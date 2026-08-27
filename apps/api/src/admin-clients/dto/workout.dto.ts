import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsInt, IsOptional, IsString, ValidateNested } from "class-validator";

class WorkoutExerciseDto {
  @IsString() exerciseId!: string;
  @Type(() => Number) @IsInt() sets!: number;
  @IsString() reps!: string;
  @IsOptional() @IsString() load?: string;
  @IsOptional() @Type(() => Number) @IsInt() restSeconds?: number;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @Type(() => Number) @IsInt() order?: number;
}

export class CreateWorkoutDto {
  @IsString() letter!: string;
  @IsOptional() @IsString() title?: string;
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => WorkoutExerciseDto)
  exercises!: WorkoutExerciseDto[];
}
