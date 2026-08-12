import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { ProfessionalGuard } from "../auth/professional.guard";
import { AdminClientsService } from "./admin-clients.service";
import { CreateMealPlanDto } from "./dto/meal-plan.dto";
import { CreateWorkoutDto } from "./dto/workout.dto";
import { CreateClientDto } from "./dto/create-client.dto";

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
}
