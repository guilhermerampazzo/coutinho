import { Module } from "@nestjs/common";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { StripePaymentProvider } from "./providers/stripe-payment.provider";
import { MercadoPagoPixProvider } from "./providers/mercadopago-pix.provider";

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, StripePaymentProvider, MercadoPagoPixProvider],
  exports: [StripePaymentProvider],
})
export class PaymentsModule {}
