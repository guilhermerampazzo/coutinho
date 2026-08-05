import { IsIn, IsOptional, IsString } from "class-validator";
import { PlanCode, Period } from "@prisma/client";

export class CheckoutDto {
  @IsIn(Object.values(PlanCode))
  planCode!: PlanCode;

  @IsIn(Object.values(Period))
  period!: Period;

  @IsOptional()
  @IsString()
  couponCode?: string;

  @IsIn(["pix", "cartao"])
  method!: "pix" | "cartao";
}
