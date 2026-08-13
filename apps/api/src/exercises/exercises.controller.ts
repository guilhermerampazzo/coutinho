import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ProfessionalGuard } from "../auth/professional.guard";
import { ExerciseDto } from "./dto/exercise.dto";

@Controller("exercises")
export class ExercisesController {
  constructor(private prisma: PrismaService) {}

  // ---- Grupos musculares (selecionáveis, gerenciáveis pelo painel) ----

  @Get("muscle-groups")
  muscleGroups() {
    return this.prisma.muscleGroup.findMany({ orderBy: { order: "asc" }, include: { _count: { select: { exercises: true } } } });
  }

  @Post("muscle-groups")
  @UseGuards(ProfessionalGuard)
  createMuscleGroup(@Body() dto: { name: string }) {
    return this.prisma.muscleGroup.create({ data: { name: dto.name, order: 99 } });
  }

  @Patch("muscle-groups/:id")
  @UseGuards(ProfessionalGuard)
  updateMuscleGroup(@Param("id") id: string, @Body() dto: { name?: string }) {
    return this.prisma.muscleGroup.update({ where: { id }, data: dto });
  }

  @Delete("muscle-groups/:id")
  @UseGuards(ProfessionalGuard)
  removeMuscleGroup(@Param("id") id: string) {
    return this.prisma.muscleGroup.delete({ where: { id } }).catch((e) => {
      if (e?.code === "P2003") {
        throw new BadRequestException("Grupo muscular em uso por exercícios. Reatribua ou remova os exercícios antes.");
      }
      throw e;
    });
  }

  // ---- Exercícios ----

  @Get()
  list(@Query("search") search?: string, @Query("muscleGroupId") muscleGroupId?: string) {
    return this.prisma.exerciseLibrary.findMany({
      where: {
        ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
        ...(muscleGroupId ? { muscleGroupId } : {}),
      },
      include: { muscleGroup: true },
      orderBy: { name: "asc" },
    });
  }

  @Post()
  @UseGuards(ProfessionalGuard)
  create(@Body() dto: ExerciseDto) {
    return this.prisma.exerciseLibrary.create({ data: dto, include: { muscleGroup: true } });
  }

  @Patch(":id")
  @UseGuards(ProfessionalGuard)
  update(@Param("id") id: string, @Body() dto: Partial<ExerciseDto>) {
    return this.prisma.exerciseLibrary.update({ where: { id }, data: dto, include: { muscleGroup: true } });
  }

  @Delete(":id")
  @UseGuards(ProfessionalGuard)
  remove(@Param("id") id: string) {
    return this.prisma.exerciseLibrary.delete({ where: { id } });
  }
}
