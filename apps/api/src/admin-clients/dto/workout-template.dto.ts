import { IsNotEmpty, IsObject, IsOptional, IsString } from "class-validator";

export class CreateWorkoutTemplateDto {
  @IsString() @IsNotEmpty() title!: string;
  @IsOptional() @IsString() letter?: string;
  @IsOptional() @IsString() description?: string;
  // Mesmo formato do CreateWorkoutDto ({ exercises: [...] com exerciseId +
  // séries/reps/carga }) + snapshot dos nomes para exibir a lista.
  @IsObject() content!: Record<string, any>;
}

export class UpdateWorkoutTemplateDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() letter?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsObject() content?: Record<string, any>;
}
