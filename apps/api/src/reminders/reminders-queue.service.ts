import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { Queue } from "bullmq";
import IORedis from "ioredis";

const ANAMNESIS_REMINDER_DELAY_MS = 24 * 60 * 60 * 1000; // 24h

function anamnesisJobId(userId: string) {
  // BullMQ não aceita ":" em jobId customizado.
  return `anamnesis-${userId}`;
}

/**
 * Enfileira lembretes processados pelo apps/worker (fila "reminders", compartilhada via Redis).
 * jobId = anamnesisJobId(userId) — cada novo save do rascunho substitui o lembrete anterior
 * (evita empilhar lembretes duplicados enquanto o cliente ainda está preenchendo aos poucos).
 */
@Injectable()
export class RemindersQueueService implements OnModuleDestroy {
  private connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", { maxRetriesPerRequest: null });
  private queue = new Queue("reminders", { connection: this.connection });

  async scheduleAnamnesisReminder(userId: string) {
    const jobId = anamnesisJobId(userId);
    await this.queue.remove(jobId).catch(() => undefined);
    await this.queue.add(
      "anamnesis-incomplete",
      { userId },
      { jobId, delay: ANAMNESIS_REMINDER_DELAY_MS, removeOnComplete: true, removeOnFail: true }
    );
  }

  async cancelAnamnesisReminder(userId: string) {
    await this.queue.remove(anamnesisJobId(userId)).catch(() => undefined);
  }

  /** Notificação/campanha agendada pelo admin (Fase 8) — o worker resolve o público e cria as Notifications no horário. */
  async scheduleCampaign(payload: { title: string; body: string; audience: string; sendAt: string }) {
    const delay = Math.max(0, new Date(payload.sendAt).getTime() - Date.now());
    await this.queue.add("send-campaign", payload, { delay, removeOnComplete: true, removeOnFail: true });
  }

  async onModuleDestroy() {
    await this.queue.close();
    this.connection.disconnect();
  }
}
