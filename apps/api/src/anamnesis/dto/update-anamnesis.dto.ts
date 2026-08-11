import { Type } from "class-transformer";
import { IsBoolean, IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { BowelFunction, Goal } from "@prisma/client";

export class UpdateAnamnesisDto {
  // Dados pessoais
  @IsOptional() @IsString() sex?: string;
  @IsOptional() @IsDateString() birthDate?: string;
  @IsOptional() @Type(() => Number) @IsNumber() heightCm?: number;
  @IsOptional() @Type(() => Number) @IsNumber() weightKg?: number;
  @IsOptional() @IsString() profession?: string;

  // Objetivo
  @IsOptional() @IsEnum(Goal) goal?: Goal;
  @IsOptional() @IsString() goalDescription?: string;
  @IsOptional() @IsString() goalImprove?: string;

  // Alimentação
  @IsOptional() @Type(() => Number) @IsInt() mealsPerDay?: number;
  @IsOptional() @Type(() => Number) @IsNumber() waterLitersPerDay?: number;
  @IsOptional() @IsString() preferredFoods?: string;
  @IsOptional() @IsString() dislikedFoods?: string;
  @IsOptional() @IsString() foodsAvoided?: string;
  @IsOptional() @IsString() currentDiet?: string;
  @IsOptional() @IsString() supplements?: string;
  @IsOptional() @IsString() allergies?: string;
  @IsOptional() @IsString() intolerances?: string;
  @IsOptional() @IsString() previousDiets?: string;

  // Saúde
  @IsOptional() @IsString() diseases?: string;
  @IsOptional() @IsString() medications?: string;
  @IsOptional() @IsString() surgeries?: string;
  @IsOptional() @IsString() alteredExams?: string;
  @IsOptional() @IsString() nutritionalDeficiencies?: string;
  @IsOptional() @IsString() orthopedicIssues?: string;
  @IsOptional() @IsString() familyHistory?: string;

  // Sono / rotina
  @IsOptional() @IsString() sleepQuality?: string;
  @IsOptional() @Type(() => Number) @IsNumber() sleepHours?: number;
  @IsOptional() @IsString() sleepTime?: string;
  @IsOptional() @IsString() wakeTime?: string;
  @IsOptional() @IsString() workRoutine?: string;
  @IsOptional() @IsString() mealsOut?: string;
  @IsOptional() @IsString() routineDifficulties?: string;

  // Função intestinal
  @IsOptional() @IsEnum(BowelFunction) bowelFunction?: BowelFunction;

  // Hábitos
  @IsOptional() @IsBoolean() smokes?: boolean;
  @IsOptional() @IsBoolean() drinksAlcohol?: boolean;

  // Exercícios
  @IsOptional() @IsString() activityLevel?: string;
  @IsOptional() @IsString() trainingSince?: string;
  @IsOptional() @Type(() => Number) @IsInt() trainingDaysPerWeek?: number;
  @IsOptional() @IsString() modality?: string;
  @IsOptional() @IsString() availableEquipment?: string;
  @IsOptional() @IsString() painfulExercises?: string;
  @IsOptional() @IsString() avoidedExercises?: string;
  @IsOptional() @IsString() sedentarySince?: string;
  @IsOptional() @IsString() trainingHistory?: string;
  @IsOptional() @IsString() enjoyedExercises?: string;
  @IsOptional() @IsString() pain?: string;
  @IsOptional() @IsString() limitations?: string;
  @IsOptional() @IsString() injuries?: string;

  // Gates das perguntas condicionais (Sim/Não → detalhe só se aplicável)
  @IsOptional() @IsBoolean() hasDiseases?: boolean;
  @IsOptional() @IsBoolean() usesMedications?: boolean;
  @IsOptional() @IsBoolean() hasAllergies?: boolean;
  @IsOptional() @IsBoolean() hasIntolerances?: boolean;
  @IsOptional() @IsBoolean() hasNutritionalDeficiencies?: boolean;
  @IsOptional() @IsBoolean() hadSurgeries?: boolean;
  @IsOptional() @IsBoolean() hasFamilyHistory?: boolean;
  @IsOptional() @IsBoolean() hasOrthopedicIssues?: boolean;
  @IsOptional() @IsBoolean() hasAlteredExams?: boolean;
  @IsOptional() @IsBoolean() usesSupplements?: boolean;
  @IsOptional() @IsBoolean() practicesActivity?: boolean;
  @IsOptional() @IsBoolean() hasBioimpedance?: boolean;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0) currentStep?: number;
}
