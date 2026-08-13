import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsString } from "class-validator";

export class FoodDto {
  @IsString() name!: string;
  @IsString() categoryId!: string;
  @Type(() => Number) @IsNumber() kcal!: number;
  @Type(() => Number) @IsNumber() protein!: number;
  @Type(() => Number) @IsNumber() carbs!: number;
  @Type(() => Number) @IsNumber() fat!: number;
  @IsOptional() @IsString() notes?: string;
}
