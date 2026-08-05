import { Module } from "@nestjs/common";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { StripePaymentProvider } from "./providers/stripe-payment.provider";

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, StripePaymentProvider],
  exports: [StripePaymentProvider],
})
export class PaymentsModule {}
