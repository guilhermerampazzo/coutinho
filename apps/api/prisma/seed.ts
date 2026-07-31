import { PrismaClient, PlanCode, Role } from "@prisma/client";
import * as argon2 from "argon2";
import { foods } from "./seed-data/foods";
import { exercises } from "./seed-data/exercises";

const prisma = new PrismaClient();

async function main() {
  await prisma.plan.upsert({
    where: { code: PlanCode.ESSENCIAL },
    update: {},
    create: {
      code: PlanCode.ESSENCIAL,
      name: "Essencial",
      tagline: "Comece a cuidar da sua saúde com um plano feito para você.",
      monthlyPrice: 149,
      features: [
        "Plano alimentar personalizado",
        "Treino personalizado",
        "Mensagens de acompanhamento",
        "Check-ins regulares",
        "Revisão do plano 1 vez por mês",
      ],
    },
  });

  await prisma.plan.upsert({
    where: { code: PlanCode.PLUS },
    update: {},
    create: {
      code: PlanCode.PLUS,
      name: "Plus",
      tagline: "Mais acompanhamento para quem quer evoluir de forma consistente.",
      monthlyPrice: 249,
      features: [
        "Tudo do Essencial",
        "Revisão do plano a cada 15 dias",
        "Ajustes do plano sempre que necessário",
        "Check-ins mais frequentes",
        "Acompanhamento mais próximo",
      ],
    },
  });

  await prisma.plan.upsert({
    where: { code: PlanCode.ELITE },
    update: {},
    create: {
      code: PlanCode.ELITE,
      name: "Elite",
      tagline: "O acompanhamento mais completo da COUT.",
      monthlyPrice: 349,
      features: [
        "Tudo do Plus",
        "1 teleconsulta por mês (até 1 hora)",
        "Revisão completa durante a consulta",
        "Definição das metas do próximo ciclo",
      ],
    },
  });

  await prisma.coupon.upsert({
    where: { code: "BEMVINDO10" },
    update: {},
    create: { code: "BEMVINDO10", percentOff: 0.1, active: true },
  });

  const adminEmail = "rafael@couthealth.com.br";
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Rafael Coutinho",
        role: Role.PROFESSIONAL,
        passwordHash: await argon2.hash("mudeesta-senha-123"),
        consentedAt: new Date(),
      },
    });
    console.log(`[seed] admin criado: ${adminEmail} / mudeesta-senha-123 (TROCAR)`);
  }

  for (const food of foods) {
    const existing = await prisma.food.findFirst({ where: { name: food.name } });
    if (!existing) await prisma.food.create({ data: food });
  }

  for (const exercise of exercises) {
    const existing = await prisma.exerciseLibrary.findFirst({ where: { name: exercise.name } });
    if (!existing) await prisma.exerciseLibrary.create({ data: exercise });
  }

  console.log(`[seed] concluído: 3 planos, 1 cupom (BEMVINDO10), 1 admin, ${foods.length} alimentos, ${exercises.length} exercícios.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
