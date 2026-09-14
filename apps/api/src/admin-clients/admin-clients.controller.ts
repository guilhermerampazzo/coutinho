import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { ProfessionalGuard } from "../auth/professional.guard";
import { AdminClientsService } from "./admin-clients.service";
import { CreateMealPlanDto } from "./dto/meal-plan.dto";
import { CreateWorkoutDto } from "./dto/workout.dto";
import { CreateClientDto } from "./dto/create-client.dto";
import { CreateDietTemplateDto, UpdateDietTemplateDto } from "./dto/diet-template.dto";
import { CreateWorkoutTemplateDto, UpdateWorkoutTemplateDto } from "./dto/workout-template.dto";
import { CreateAssessmentDto } from "../assessments/dto/create-assessment.dto";

@Controller("admin")
@UseGuards(ProfessionalGuard)
export class AdminClientsController {
  constructor(private service: AdminClientsService) {}

  @Get("clients")
  listClients() {
    return this.service.listClients();
  }

  /** Cadastro manual de cliente pela recepção (organização do painel). */
  @Post("clients")
  createClient(@Body() dto: CreateClientDto, @Req() req: any) {
    return this.service.createClient(dto, req.user.userId);
  }

  /** Remove o cadastro (anonimiza + cancela cobranças ativas) — a conta some da lista. */
  @Delete("clients/:id")
  removeClient(@Param("id") id: string, @Req() req: any) {
    return this.service.removeClient(id, req.user.userId);
  }

  /** Resumo inteligente da anamnese (IA organiza/sintetiza; o profissional decide). */
  @Get("clients/:id/summary")
  clientSummary(@Param("id") id: string, @Req() req: any) {
    return this.service.getClientSummary(id, req.user.userId);
  }

  @Get("clients/:id")
  clientDetail(@Param("id") id: string) {
    return this.service.getClientDetail(id);
  }

  @Post("clients/:id/meal-plan")
  createMealPlan(@Param("id") id: string, @Body() dto: CreateMealPlanDto) {
    return this.service.createMealPlan(id, dto);
  }

  @Post("meal-plans/:id/publish")
  publishMealPlan(@Param("id") id: string, @Req() req: any) {
    return this.service.publishMealPlan(id, req.user.userId);
  }

  @Post("clients/:id/workout")
  createWorkout(@Param("id") id: string, @Body() dto: CreateWorkoutDto) {
    return this.service.createWorkout(id, dto);
  }

  @Post("workouts/:id/publish")
  publishWorkout(@Param("id") id: string, @Req() req: any) {
    return this.service.publishWorkout(id, req.user.userId);
  }

  // ---- Composição corporal (assessments do cliente, criados pelo profissional) ----
  @Get("clients/:id/assessments")
  listAssessments(@Param("id") id: string) {
    return this.service.listAssessmentsForClient(id);
  }

  @Post("clients/:id/assessments")
  createAssessment(@Param("id") id: string, @Body() dto: CreateAssessmentDto, @Req() req: any) {
    return this.service.createAssessmentForClient(id, dto, req.user.userId);
  }

  // ---- Histórico ----
  @Get("clients/:id/meal-plans")
  listMealPlans(@Param("id") id: string) {
    return this.service.listMealPlans(id);
  }

  @Patch("meal-plans/:id/title")
  renameMealPlan(@Param("id") id: string, @Body() dto: { title: string }) {
    return this.service.renameMealPlan(id, dto.title);
  }

  /** Edita o conteúdo de um plano alimentar já lançado (republica + notifica). */
  @Patch("meal-plans/:id")
  updateMealPlan(@Param("id") id: string, @Body() dto: CreateMealPlanDto, @Req() req: any) {
    return this.service.updateMealPlan(id, dto, req.user.userId);
  }

  @Get("clients/:id/workouts")
  listWorkouts(@Param("id") id: string) {
    return this.service.listWorkouts(id);
  }

  @Patch("workouts/:id/title")
  renameWorkout(@Param("id") id: string, @Body() dto: { title: string }) {
    return this.service.renameWorkout(id, dto.title);
  }

  /** Edita o conteúdo de um treino já lançado (republica + notifica). */
  @Patch("workouts/:id")
  updateWorkout(@Param("id") id: string, @Body() dto: CreateWorkoutDto, @Req() req: any) {
    return this.service.updateWorkout(id, dto, req.user.userId);
  }

  // ---- Biblioteca de planos prontos (templates reutilizáveis) ----
  @Get("diet-templates")
  listDietTemplates() {
    return this.service.listDietTemplates();
  }

  @Post("diet-templates")
  createDietTemplate(@Body() dto: CreateDietTemplateDto, @Req() req: any) {
    return this.service.createDietTemplate(dto, req.user.userId);
  }

  @Patch("diet-templates/:id")
  updateDietTemplate(@Param("id") id: string, @Body() dto: UpdateDietTemplateDto) {
    return this.service.updateDietTemplate(id, dto);
  }

  @Delete("diet-templates/:id")
  removeDietTemplate(@Param("id") id: string) {
    return this.service.removeDietTemplate(id);
  }

  @Get("workout-templates")
  listWorkoutTemplates() {
    return this.service.listWorkoutTemplates();
  }

  @Post("workout-templates")
  createWorkoutTemplate(@Body() dto: CreateWorkoutTemplateDto, @Req() req: any) {
    return this.service.createWorkoutTemplate(dto, req.user.userId);
  }

  @Patch("workout-templates/:id")
  updateWorkoutTemplate(@Param("id") id: string, @Body() dto: UpdateWorkoutTemplateDto) {
    return this.service.updateWorkoutTemplate(id, dto);
  }

  @Delete("workout-templates/:id")
  removeWorkoutTemplate(@Param("id") id: string) {
    return this.service.removeWorkoutTemplate(id);
  }
}
