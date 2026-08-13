import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ProfessionalGuard } from "../auth/professional.guard";
import { FoodDto } from "./dto/food.dto";

@Controller("foods")
export class FoodsController {
  constructor(private prisma: PrismaService) {}

  // ---- Classificações (categorias selecionáveis, gerenciáveis pelo painel) ----
  // Declaradas ANTES das rotas com :id para o Nest casar as estáticas primeiro.

  @Get("categories")
  categories() {
    return this.prisma.foodCategory.findMany({ orderBy: { order: "asc" }, include: { _count: { select: { foods: true } } } });
  }

  @Post("categories")
  @UseGuards(ProfessionalGuard)
  createCategory(@Body() dto: { name: string }) {
    return this.prisma.foodCategory.create({ data: { name: dto.name, order: 99 } });
  }

  @Patch("categories/:id")
  @UseGuards(ProfessionalGuard)
  updateCategory(@Param("id") id: string, @Body() dto: { name?: string }) {
    return this.prisma.foodCategory.update({ where: { id }, data: dto });
  }

  @Delete("categories/:id")
  @UseGuards(ProfessionalGuard)
  removeCategory(@Param("id") id: string) {
    // Proteção: categoria com alimentos não pode ser removida (FK RESTRICT).
    return this.prisma.foodCategory.delete({ where: { id } }).catch((e) => {
      if (e?.code === "P2003") {
        throw new BadRequestException("Categoria em uso por alimentos. Reatribua ou remova os alimentos antes.");
      }
      throw e;
    });
  }

  // ---- Alimentos ----

  @Get()
  list(@Query("search") search?: string, @Query("categoryId") categoryId?: string) {
    return this.prisma.food.findMany({
      where: {
        ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
        ...(categoryId ? { categoryId } : {}),
      },
      include: { category: true },
      orderBy: { name: "asc" },
    });
  }

  @Post()
  @UseGuards(ProfessionalGuard)
  create(@Body() dto: FoodDto) {
    return this.prisma.food.create({ data: dto, include: { category: true } });
  }

  @Patch(":id")
  @UseGuards(ProfessionalGuard)
  update(@Param("id") id: string, @Body() dto: Partial<FoodDto>) {
    return this.prisma.food.update({ where: { id }, data: dto, include: { category: true } });
  }

  @Delete(":id")
  @UseGuards(ProfessionalGuard)
  remove(@Param("id") id: string) {
    return this.prisma.food.delete({ where: { id } });
  }
}
