import { IsOptional, IsString } from "class-validator";

export class ExerciseDto {
  @IsString() name!: string;
  @IsString() muscleGroupId!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() videoUrl?: string;
}
