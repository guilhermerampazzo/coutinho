import { IsNotEmpty, IsObject, IsOptional, IsString } from "class-validator";

export class CreateDietTemplateDto {
  @IsString() @IsNotEmpty() title!: string;
  @IsOptional() @IsString() description?: string;
  // Mesmo formato do CreateMealPlanDto ({ meals: [...] com foodId + quantidades
  // + substitutos }) + snapshot dos nomes para exibir a lista sem resolver tudo.
  @IsObject() content!: Record<string, any>;
}

export class UpdateDietTemplateDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsObject() content?: Record<string, any>;
}
