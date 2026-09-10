import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { IsString } from "class-validator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";

class RegisterPushTokenDto {
  @IsString() token!: string;
}

@Controller("client")
@UseGuards(JwtAuthGuard)
export class ClientController {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  @Get("dashboard")
  async dashboard(@Req() req: any) {
    const userId = req.user.userId;
    const [subscription, mealPlan, workouts, unreadNotifications, thread] = await Promise.all([
      this.prisma.subscription.findFirst({ where: { userId, status: "ACTIVE" }, include: { plan: true }, orderBy: { createdAt: "desc" } }),
      this.prisma.mealPlan.findFirst({ where: { clientId: userId, publishedAt: { not: null } }, orderBy: { publishedAt: "desc" } }),
      this.prisma.workout.findMany({ where: { clientId: userId, publishedAt: { not: null } }, orderBy: { publishedAt: "desc" } }),
      this.prisma.notification.findMany({ where: { userId, readAt: null }, orderBy: { createdAt: "desc" }, take: 5 }),
      this.prisma.thread.findFirst({ where: { clientId: userId }, include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } } }),
    ]);

    return {
      subscription,
      nextReview: subscription?.currentPeriodEnd ?? null,
      lastMealPlanPublishedAt: mealPlan?.publishedAt ?? null,
      workoutsCount: workouts.length,
      unreadNotifications,
      lastMessage: thread?.messages[0] ?? null,
    };
  }

  @Get("nutrition")
  async nutrition(@Req() req: any) {
    return this.prisma.mealPlan.findFirst({
      where: { clientId: req.user.userId, publishedAt: { not: null } },
      orderBy: { publishedAt: "desc" },
      include: { meals: { include: { items: { include: { food: true, substitutes: { include: { food: true } } } } } } },
    });
  }

  @Get("workouts")
  async workouts(@Req() req: any) {
    return this.prisma.workout.findMany({
      where: { clientId: req.user.userId, publishedAt: { not: null } },
      orderBy: { letter: "asc" },
      include: { exercises: { include: { exercise: true }, orderBy: { order: "asc" } } },
    });
  }

  /** Estrutura de push pronta (FCM via Capacitor) — ativação/envio real ficam para fase posterior. */
  @Post("push-token")
  async registerPushToken(@Req() req: any, @Body() dto: RegisterPushTokenDto) {
    await this.prisma.user.update({ where: { id: req.user.userId }, data: { pushToken: dto.token } });
    return { ok: true };
  }

  /** Portabilidade de dados (LGPD art. 18, V) — exporta tudo que a plataforma guarda sobre o cliente. */
  @Get("export")
  async exportData(@Req() req: any) {
    const userId = req.user.userId;
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, consentedAt: true, createdAt: true },
    });
    const [anamnesis, assessments, mealPlans, workouts, checkIns, messages, subscriptions] = await Promise.all([
      this.prisma.anamnesis.findUnique({ where: { userId } }),
      this.prisma.assessment.findMany({ where: { userId } }),
      this.prisma.mealPlan.findMany({ where: { clientId: userId }, include: { meals: { include: { items: { include: { food: true, substitutes: { include: { food: true } } } } } } } }),
      this.prisma.workout.findMany({ where: { clientId: userId }, include: { exercises: { include: { exercise: true } } } }),
      this.prisma.checkIn.findMany({ where: { userId } }),
      this.prisma.message.findMany({ where: { thread: { clientId: userId } } }),
      this.prisma.subscription.findMany({ where: { userId }, include: { plan: true } }),
    ]);
    this.audit.log(userId, "EXPORT", "User", userId);
    return { user, anamnesis, assessments, mealPlans, workouts, checkIns, messages, subscriptions, exportedAt: new Date() };
  }

  /**
   * Exclusão/anonimização de conta (LGPD art. 18, VI — direito ao esquecimento). Anonimiza em vez
   * de apagar fisicamente: registros históricos (pagamentos, planos publicados) têm valor de
   * auditoria/contábil e ficam retidos sem identificar a pessoa, conforme permite a LGPD art. 16.
   */
  @Post("request-deletion")
  async requestDeletion(@Req() req: any) {
    const userId = req.user.userId;
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: "Conta removida",
        email: `deleted-${userId}@couthealth.invalid`,
        passwordHash: null,
        googleId: null,
        pushToken: null,
      },
    });
    this.audit.log(userId, "REQUEST_DELETION", "User", userId);
    return { ok: true };
  }
}
