import { Module } from "@nestjs/common";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { AppController } from "./app.controller";
import { PrismaModule } from "./prisma/prisma.module";
import { RemindersModule } from "./reminders/reminders.module";
import { AuthModule } from "./auth/auth.module";
import { PlansModule } from "./plans/plans.module";
import { CouponsModule } from "./coupons/coupons.module";
import { PaymentsModule } from "./payments/payments.module";
import { AnamnesisModule } from "./anamnesis/anamnesis.module";
import { AssessmentsModule } from "./assessments/assessments.module";
import { FoodsModule } from "./foods/foods.module";
import { ExercisesModule } from "./exercises/exercises.module";
import { MessagesModule } from "./messages/messages.module";
import { AdminClientsModule } from "./admin-clients/admin-clients.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { ClientModule } from "./client/client.module";
import { CheckInsModule } from "./checkins/checkins.module";
import { AdminNotificationsModule } from "./admin-notifications/admin-notifications.module";
import { AdminSubscriptionsModule } from "./admin-subscriptions/admin-subscriptions.module";
import { AuditModule } from "./audit/audit.module";

@Module({
  imports: [
    // Rate limiting global — default 60 req/min por IP; endpoints sensíveis (auth) usam limite
    // mais restrito via @Throttle() (ver auth.controller.ts).
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    PrismaModule,
    RemindersModule,
    AuthModule,
    PlansModule,
    CouponsModule,
    PaymentsModule,
    AnamnesisModule,
    AssessmentsModule,
    FoodsModule,
    ExercisesModule,
    MessagesModule,
    AdminClientsModule,
    NotificationsModule,
    ClientModule,
    CheckInsModule,
    AdminNotificationsModule,
    AdminSubscriptionsModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
