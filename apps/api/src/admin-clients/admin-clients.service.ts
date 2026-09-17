import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Role } from "@prisma/client";
import * as argon2 from "argon2";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { StripePaymentProvider } from "../payments/providers/stripe-payment.provider";
import { AdminAiSummaryService, type AiSummaryResult } from "./ai-summary.service";
import { CreateMealPlanDto } from "./dto/meal-plan.dto";
import { CreateWorkoutDto } from "./dto/workout.dto";
import { CreateClientDto } from "./dto/create-client.dto";
import { CreateDietTemplateDto, UpdateDietTemplateDto } from "./dto/diet-template.dto";
import { CreateWorkoutTemplateDto, UpdateWorkoutTemplateDto } from "./dto/workout-template.dto";

@Injectable()
export class AdminClientsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private stripeProvider: StripePaymentProvider,
    private aiSummary: AdminAiSummaryService
  ) {}

  listClients() {
    return this.prisma.user.findMany({
      where: {
        role: Role.CLIENT,
        // Contas removidas (anonimizadas) somem da lista — organização do painel.
        email: { not: { startsWith: "deleted-" } },
      },
      select: {
        id: true,
        name: true,
        email: true,
        modality: true,
        createdAt: true,
        anamnesis: { select: { status: true, submittedAt: true } },
        // Traz as últimas para o painel distinguir ACTIVE de PENDING (evita mostrar
        // "plano" quando é só uma tentativa pendente, e vice-versa).
        subscriptions: { orderBy: { createdAt: "desc" }, take: 5, select: { status: true, plan: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Cadastro manual de cliente (recepção): o profissional informa nome/e-mail/senha inicial e
   * repassa o acesso ao cliente. O consentimento LGPD é registrado no momento do cadastro pelo
   * profissional (assinatura de contrato em papel na recepção) — trilha de auditoria incluída.
   */
  async createClient(dto: CreateClientDto, professionalId: string) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException("Já existe uma conta com este e-mail.");

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash: await argon2.hash(dto.password),
        role: Role.CLIENT,
        modality: dto.modality ?? "ONLINE",
        consentedAt: new Date(),
      },
    });
    this.audit.log(professionalId, "CREATE_CLIENT", "User", user.id, { email: dto.email, name: dto.name, modality: user.modality });
    return { id: user.id, name: user.name, email: user.email, modality: user.modality };
  }

  /**
   * Remoção de cadastro pelo admin (organização do painel): anonimiza a conta (LGPD art. 16 —
   * histórico de pagamentos/planos retido sem identificar a pessoa), cancela assinaturas ativas
   * (inclusive a cobrança recorrente no Stripe) e a conta some da lista de clientes.
   */
  async removeClient(id: string, professionalId: string) {
    const client = await this.prisma.user.findUnique({ where: { id, role: Role.CLIENT } });
    if (!client) throw new NotFoundException("Cliente não encontrado.");

    const activeSubs = await this.prisma.subscription.findMany({ where: { userId: id, status: "ACTIVE" } });
    for (const sub of activeSubs) {
      if (sub.stripeSubscriptionId) {
        await this.stripeProvider.cancelSubscription(sub.stripeSubscriptionId).catch(() => undefined);
      }
      await this.prisma.subscription.update({
        where: { id: sub.id },
        data: { status: "CANCELED", currentPeriodEnd: new Date() },
      });
    }

    await this.prisma.user.update({
      where: { id },
      data: {
        name: "Conta removida",
        email: `deleted-${id}@couthealth.invalid`,
        passwordHash: null,
        googleId: null,
        appleId: null,
        pushToken: null,
      },
    });
    this.audit.log(professionalId, "REMOVE_CLIENT", "User", id, { email: client.email });
    return { ok: true };
  }

  /** Resumo inteligente (IA) da anamnese + avaliação física do cliente — apoio à análise. */
  async getClientSummary(id: string, professionalId: string): Promise<AiSummaryResult> {
    const client = await this.getClientDetail(id);
    const result = await this.aiSummary.generateSummary(client);
    this.audit.log(professionalId, "AI_SUMMARY", "User", id);
    return result;
  }

  async getClientDetail(id: string) {
    const client = await this.prisma.user.findUnique({
      where: { id, role: Role.CLIENT },
      include: {
        anamnesis: true,
        assessments: { orderBy: { recordedAt: "asc" } },
        subscriptions: { orderBy: { createdAt: "desc" }, take: 1, include: { plan: true } },
        mealPlans: { orderBy: { createdAt: "desc" }, include: { meals: { include: { items: { include: { food: true, substitutes: { include: { food: true } } } } } } } },
        workouts: { orderBy: { createdAt: "desc" }, include: { exercises: { include: { exercise: true } } } },
      },
    });
    if (!client) throw new NotFoundException("Cliente não encontrado.");
    return client;
  }

  async listMealPlans(clientId: string) {
    await this.assertClient(clientId);
    return this.prisma.mealPlan.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      include: { meals: { include: { items: { include: { food: true, substitutes: { include: { food: true } } } } } } },
    });
  }

  async listWorkouts(clientId: string) {
    await this.assertClient(clientId);
    return this.prisma.workout.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      include: { exercises: { include: { exercise: true } } },
    });
  }

  async renameMealPlan(mealPlanId: string, title: string) {
    return this.prisma.mealPlan.update({ where: { id: mealPlanId }, data: { title } });
  }

  async renameWorkout(workoutId: string, title: string) {
    return this.prisma.workout.update({ where: { id: workoutId }, data: { title } });
  }

  /** Remove um plano alimentar já lançado (refeições/itens/substitutos) do histórico do cliente. */
  async removeMealPlan(mealPlanId: string, professionalId: string) {
    const existing = await this.prisma.mealPlan.findUnique({
      where: { id: mealPlanId },
      include: { meals: { include: { items: { select: { id: true } } } } },
    });
    if (!existing) throw new NotFoundException("Plano alimentar não encontrado.");
    const mealIds = existing.meals.map((m) => m.id);
    const itemIds = existing.meals.flatMap((m) => m.items.map((i) => i.id));
    await this.prisma.$transaction(async (tx) => {
      if (itemIds.length > 0) {
        await tx.mealItemSubstitute.deleteMany({ where: { mealItemId: { in: itemIds } } });
        await tx.mealItem.deleteMany({ where: { id: { in: itemIds } } });
      }
      if (mealIds.length > 0) {
        await tx.meal.deleteMany({ where: { id: { in: mealIds } } });
      }
      await tx.mealPlan.delete({ where: { id: mealPlanId } });
    });
    this.audit.log(professionalId, "DELETE", "MealPlan", mealPlanId, { clientId: existing.clientId });
    return { ok: true };
  }

  /** Remove um treino já lançado (exercícios/logs) do histórico do cliente. */
  async removeWorkout(workoutId: string, professionalId: string) {
    const existing = await this.prisma.workout.findUnique({
      where: { id: workoutId },
      include: { exercises: { select: { id: true } } },
    });
    if (!existing) throw new NotFoundException("Treino não encontrado.");
    const exerciseIds = existing.exercises.map((e) => e.id);
    await this.prisma.$transaction(async (tx) => {
      if (exerciseIds.length > 0) {
        await tx.exerciseLog.deleteMany({ where: { workoutExerciseId: { in: exerciseIds } } });
        await tx.workoutExercise.deleteMany({ where: { id: { in: exerciseIds } } });
      }
      await tx.workout.delete({ where: { id: workoutId } });
    });
    this.audit.log(professionalId, "DELETE", "Workout", workoutId, { clientId: existing.clientId });
    return { ok: true };
  }

  /**
   * Edição de um plano alimentar já lançado: substitui refeições/itens/substitutos
   * pelo novo conteúdo, republica (publishedAt = agora) e notifica o cliente.
   * O histórico é preservado — edita in-place em vez de criar uma nova versão.
   */
  async updateMealPlan(mealPlanId: string, dto: CreateMealPlanDto, professionalId: string) {
    const existing = await this.prisma.mealPlan.findUnique({
      where: { id: mealPlanId },
      include: { meals: { include: { items: { select: { id: true } } } } },
    });
    if (!existing) throw new NotFoundException("Plano alimentar não encontrado.");

    const mealIds = existing.meals.map((m) => m.id);
    const itemIds = existing.meals.flatMap((m) => m.items.map((i) => i.id));

    await this.prisma.$transaction(async (tx) => {
      if (itemIds.length > 0) {
        await tx.mealItemSubstitute.deleteMany({ where: { mealItemId: { in: itemIds } } });
        await tx.mealItem.deleteMany({ where: { id: { in: itemIds } } });
      }
      if (mealIds.length > 0) {
        await tx.meal.deleteMany({ where: { id: { in: mealIds } } });
      }
      if (dto.title !== undefined) {
        await tx.mealPlan.update({ where: { id: mealPlanId }, data: { title: dto.title } });
      }
      for (const meal of dto.meals) {
        await tx.meal.create({
          data: {
            mealPlanId,
            time: meal.time,
            name: meal.name,
            notes: meal.notes,
            items: {
              create: meal.items.map((item) => ({
                foodId: item.foodId,
                quantityGrams: item.quantityGrams,
                quantity: item.quantity ?? item.quantityGrams,
                unit: item.unit ?? "g",
                notes: item.notes,
                substitutes: item.substitutes?.length
                  ? {
                      create: item.substitutes.map((s) => ({
                        foodId: s.foodId,
                        quantity: s.quantity,
                        unit: s.unit,
                        notes: s.notes,
                      })),
                    }
                  : undefined,
              })),
            },
          },
        });
      }
      await tx.mealPlan.update({
        where: { id: mealPlanId },
        data: { publishedAt: new Date(), createdById: professionalId },
      });
    });

    await this.prisma.notification.create({
      data: {
        userId: existing.clientId,
        type: "PLANO_PUBLICADO",
        title: "Seu plano alimentar foi atualizado",
        body: "A equipe atualizou seu plano alimentar. Confira as novidades na área de Nutrição.",
        sentAt: new Date(),
      },
    });
    this.audit.log(professionalId, "UPDATE", "MealPlan", mealPlanId, { clientId: existing.clientId });
    return this.prisma.mealPlan.findUnique({
      where: { id: mealPlanId },
      include: { meals: { include: { items: { include: { food: true, substitutes: { include: { food: true } } } } } } },
    });
  }

  /**
   * Edição de um treino já lançado: substitui os exercícios, republica e notifica.
   * Edita in-place (preserva o histórico/letra) em vez de criar nova versão.
   */
  async updateWorkout(workoutId: string, dto: CreateWorkoutDto, professionalId: string) {
    const existing = await this.prisma.workout.findUnique({ where: { id: workoutId } });
    if (!existing) throw new NotFoundException("Treino não encontrado.");

    await this.prisma.$transaction(async (tx) => {
      await tx.workoutExercise.deleteMany({ where: { workoutId } });
      await tx.workout.update({
        where: { id: workoutId },
        data: {
          ...(dto.title !== undefined ? { title: dto.title } : {}),
          ...(dto.letter ? { letter: dto.letter } : {}),
          publishedAt: new Date(),
          createdById: professionalId,
          exercises: {
            create: dto.exercises.map((ex, i) => ({
              exerciseId: ex.exerciseId,
              sets: ex.sets,
              reps: ex.reps,
              load: ex.load,
              restSeconds: ex.restSeconds,
              notes: ex.notes,
              order: ex.order ?? i,
            })),
          },
        },
      });
    });

    await this.prisma.notification.create({
      data: {
        userId: existing.clientId,
        type: "TREINO_ATUALIZADO",
        title: `Treino ${dto.letter ?? existing.letter} atualizado`,
        body: "A equipe atualizou seu treino. Confira na área de Treino.",
        sentAt: new Date(),
      },
    });
    this.audit.log(professionalId, "UPDATE", "Workout", workoutId, { clientId: existing.clientId });
    return this.prisma.workout.findUnique({
      where: { id: workoutId },
      include: { exercises: { include: { exercise: true } } },
    });
  }

  // ---------- Biblioteca de planos prontos (templates) ----------

  listDietTemplates() {
    return this.prisma.dietTemplate.findMany({ orderBy: { updatedAt: "desc" } });
  }

  createDietTemplate(dto: CreateDietTemplateDto, professionalId: string) {
    return this.prisma.dietTemplate.create({
      data: { title: dto.title, description: dto.description, content: dto.content as any, createdById: professionalId },
    });
  }

  updateDietTemplate(id: string, dto: UpdateDietTemplateDto) {
    return this.prisma.dietTemplate.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.content !== undefined ? { content: dto.content as any } : {}),
      },
    });
  }

  async removeDietTemplate(id: string) {
    await this.prisma.dietTemplate.delete({ where: { id } });
    return { ok: true };
  }

  listWorkoutTemplates() {
    return this.prisma.workoutTemplate.findMany({ orderBy: { updatedAt: "desc" } });
  }

  createWorkoutTemplate(dto: CreateWorkoutTemplateDto, professionalId: string) {
    return this.prisma.workoutTemplate.create({
      data: { title: dto.title, letter: dto.letter ?? "A", description: dto.description, content: dto.content as any, createdById: professionalId },
    });
  }

  updateWorkoutTemplate(id: string, dto: UpdateWorkoutTemplateDto) {
    return this.prisma.workoutTemplate.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.letter !== undefined ? { letter: dto.letter } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.content !== undefined ? { content: dto.content as any } : {}),
      },
    });
  }

  async removeWorkoutTemplate(id: string) {
    await this.prisma.workoutTemplate.delete({ where: { id } });
    return { ok: true };
  }

  async createAssessmentForClient(clientId: string, dto: { weightKg?: number; heightCm?: number; waistCm?: number; abdomenCm?: number; armCm?: number; thighCm?: number; chestCm?: number; muscleMassKg?: number; fatMassKg?: number }, actorId: string) {
    await this.assertClient(clientId);
    const assessment = await this.prisma.assessment.create({ data: { userId: clientId, ...dto } });
    this.audit.log(actorId, "CREATE_ASSESSMENT", "Assessment", assessment.id, { clientId });
    return assessment;
  }

  async listAssessmentsForClient(clientId: string) {
    await this.assertClient(clientId);
    return this.prisma.assessment.findMany({ where: { userId: clientId }, orderBy: { recordedAt: "asc" } });
  }

  async createMealPlan(clientId: string, dto: CreateMealPlanDto) {
    await this.assertClient(clientId);
    const title = dto.title ?? `Plano alimentar — ${new Date().toLocaleDateString("pt-BR")}`;
    return this.prisma.mealPlan.create({
      data: {
        clientId,
        title,
        meals: {
          create: dto.meals.map((meal) => ({
            time: meal.time,
            name: meal.name,
            notes: meal.notes,
            items: {
              create: meal.items.map((item) => ({
                foodId: item.foodId,
                quantityGrams: item.quantityGrams,
                quantity: item.quantity ?? item.quantityGrams,
                unit: item.unit ?? "g",
                notes: item.notes,
                substitutes: item.substitutes?.length
                  ? {
                      create: item.substitutes.map((s) => ({
                        foodId: s.foodId,
                        quantity: s.quantity,
                        unit: s.unit,
                        notes: s.notes,
                      })),
                    }
                  : undefined,
              })),
            },
          })),
        },
      },
      include: { meals: { include: { items: { include: { substitutes: true } } } } },
    });
  }

  async publishMealPlan(mealPlanId: string, professionalId: string) {
    const mealPlan = await this.prisma.mealPlan.update({
      where: { id: mealPlanId },
      data: { publishedAt: new Date(), createdById: professionalId },
    });
    await this.prisma.notification.create({
      data: {
        userId: mealPlan.clientId,
        type: "PLANO_PUBLICADO",
        title: "Seu plano alimentar foi publicado",
        body: "A equipe publicou um novo plano alimentar para você. Confira na área de Nutrição.",
        sentAt: new Date(),
      },
    });
    this.audit.log(professionalId, "PUBLISH", "MealPlan", mealPlan.id, { clientId: mealPlan.clientId });
    return mealPlan;
  }

  async createWorkout(clientId: string, dto: CreateWorkoutDto) {
    await this.assertClient(clientId);
    const title = dto.title ?? `Treino ${dto.letter} — ${new Date().toLocaleDateString("pt-BR")}`;
    return this.prisma.workout.create({
      data: {
        clientId,
        letter: dto.letter,
        title,
        exercises: {
          create: dto.exercises.map((ex, i) => ({
            exerciseId: ex.exerciseId,
            sets: ex.sets,
            reps: ex.reps,
            load: ex.load,
            restSeconds: ex.restSeconds,
            notes: ex.notes,
            order: ex.order ?? i,
          })),
        },
      },
      include: { exercises: { include: { exercise: true } } },
    });
  }

  async publishWorkout(workoutId: string, professionalId: string) {
    const workout = await this.prisma.workout.update({
      where: { id: workoutId },
      data: { publishedAt: new Date(), createdById: professionalId },
    });
    await this.prisma.notification.create({
      data: {
        userId: workout.clientId,
        type: "TREINO_ATUALIZADO",
        title: `Treino ${workout.letter} publicado`,
        body: "A equipe publicou/atualizou um treino para você. Confira na área de Treino.",
        sentAt: new Date(),
      },
    });
    this.audit.log(professionalId, "PUBLISH", "Workout", workout.id, { clientId: workout.clientId, letter: workout.letter });
    return workout;
  }

  private async assertClient(id: string) {
    const client = await this.prisma.user.findUnique({ where: { id, role: Role.CLIENT } });
    if (!client) throw new NotFoundException("Cliente não encontrado.");
  }
}
