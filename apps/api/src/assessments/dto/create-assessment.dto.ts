import { Type } from "class-transformer";
import { IsNumber, IsOptional } from "class-validator";

export class CreateAssessmentDto {
  @IsOptional() @Type(() => Number) @IsNumber() weightKg?: number;
  @IsOptional() @Type(() => Number) @IsNumber() heightCm?: number;
  @IsOptional() @Type(() => Number) @IsNumber() waistCm?: number;
  @IsOptional() @Type(() => Number) @IsNumber() abdomenCm?: number;
  @IsOptional() @Type(() => Number) @IsNumber() armCm?: number;
  @IsOptional() @Type(() => Number) @IsNumber() thighCm?: number;
  @IsOptional() @Type(() => Number) @IsNumber() chestCm?: number;
  @IsOptional() @Type(() => Number) @IsNumber() muscleMassKg?: number;
  @IsOptional() @Type(() => Number) @IsNumber() fatMassKg?: number;
}
