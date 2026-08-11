import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import { PrismaClient, Role } from "@prisma/client";

const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});
const prisma = new PrismaClient();

// Fila de lembretes (anamnese, check-ins) — enfileirada pela API (RemindersQueueService).
export const remindersQueue = new Queue("reminders", { connection });

async function handleAnamnesisReminder(userId: string) {
  const anamnesis = await prisma.anamnesis.findUnique({ where: { userId } });
  if (!anamnesis || anamnesis.status !== "RASCUNHO") {
    return; // já concluiu ou não existe mais — nada a lembrar.
  }
  await prisma.notification.create({
    data: {
      userId,
      type: "PERSONALIZADA",
      title: "Continue sua anamnese",
      body: "Você ainda não terminou seu formulário de anamnese. Retome de onde parou para começar seu acompanhamento.",
      sentAt: new Date(),
    },
  });
  console.log(`[worker] lembrete de anamnese criado para o usuário ${userId}`);

  // Fluxo de entrada (pedido do cliente): lembretes automáticos se repetem a cada 24h
  // ATÉ a anamnese ser concluída — o submit() (API) cancela o job via `anamnesis-<userId>`.
  // Reagenda com o mesmo jobId (remove + add, padrão do RemindersQueueService) para o
  // próximo ciclo; se o usuário enviar a anamnese antes, o cancelamento continua valendo.
  const jobId = `anamnesis-${userId}`;
  await remindersQueue.remove(jobId).catch(() => undefined);
  await remindersQueue.add(
    "anamnesis-incomplete",
    { userId },
    { jobId, delay: 24 * 60 * 60 * 1000, removeOnComplete: true, removeOnFail: true }
  );
}

/**
 * Expiração de assinatura NÃO tem mais job: com o Stripe, `cancel_at` cancela a assinatura
 * sozinha e o webhook `customer.subscription.deleted` marca EXPIRED + notifica (payments.service.ts).
 */

async function resolveCampaignAudience(audience: string): Promise<string[]> {
  if (audience === "all") {
    const clients = await prisma.user.findMany({ where: { role: Role.CLIENT }, select: { id: true } });
    return clients.map((c) => c.id);
  }
  const subs = await prisma.subscription.findMany({
    where: { status: "ACTIVE", plan: { code: audience as any } },
    select: { userId: true },
  });
  return [...new Set(subs.map((s) => s.userId))];
}

async function handleCampaign(payload: { title: string; body: string; audience: string }) {
  const userIds = await resolveCampaignAudience(payload.audience);
  await prisma.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      type: "PERSONALIZADA" as const,
      title: payload.title,
      body: payload.body,
      audienceSegment: payload.audience,
      sentAt: new Date(),
    })),
  });
  console.log(`[worker] campanha "${payload.title}" enviada para ${userIds.length} cliente(s)`);
}

const worker = new Worker(
  "reminders",
  async (job) => {
    if (job.name === "anamnesis-incomplete") {
      await handleAnamnesisReminder(job.data.userId);
      return;
    }
    if (job.name === "send-campaign") {
      await handleCampaign(job.data);
      return;
    }
    console.log(`[worker] job desconhecido ignorado: ${job.name}`);
  },
  { connection }
);

worker.on("ready", () => console.log("[worker] pronto, conectado ao Redis"));
worker.on("error", (err) => console.error("[worker] erro", err));
worker.on("failed", (job, err) => console.error(`[worker] job ${job?.id} falhou`, err));

connection.on("connect", () => console.log("[worker] Redis conectado"));
connection.on("error", (err) => console.error("[worker] Redis erro", err));
