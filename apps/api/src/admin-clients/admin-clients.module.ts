import { Module } from "@nestjs/common";
import { PaymentsModule } from "../payments/payments.module";
import { AdminAiSummaryService } from "./ai-summary.service";
import { AdminClientsController } from "./admin-clients.controller";
import { AdminClientsService } from "./admin-clients.service";

@Module({
  imports: [PaymentsModule], // StripePaymentProvider — cancelar cobrança ao remover cliente
  controllers: [AdminClientsController],
  providers: [AdminClientsService, AdminAiSummaryService],
})
export class AdminClientsModule {}
