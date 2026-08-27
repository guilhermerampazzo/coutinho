import { PrismaClient, PlanCode, Role } from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  await prisma.plan.upsert({
    where: { code: PlanCode.ESSENCIAL },
    update: {},
    create: {
      code: PlanCode.ESSENCIAL,
      name: "Essencial",
      tagline: "Comece a cuidar da sua saúde com um plano feito para você.",
      monthlyPrice: 149,
      features: [
        "Plano alimentar personalizado",
        "Treino personalizado",
        "Mensagens de acompanhamento",
        "Check-ins regulares",
        "Revisão do plano 1 vez por mês",
      ],
    },
  });

  await prisma.plan.upsert({
    where: { code: PlanCode.PLUS },
    update: {},
    create: {
      code: PlanCode.PLUS,
      name: "Plus",
      tagline: "Mais acompanhamento para quem quer evoluir de forma consistente.",
      monthlyPrice: 249,
      features: [
        "Tudo do Essencial",
        "Revisão do plano a cada 15 dias",
        "Ajustes do plano sempre que necessário",
        "Check-ins mais frequentes",
        "Acompanhamento mais próximo",
      ],
    },
  });

  await prisma.plan.upsert({
    where: { code: PlanCode.ELITE },
    update: {},
    create: {
      code: PlanCode.ELITE,
      name: "Elite",
      tagline: "O acompanhamento mais completo da COUT.",
      monthlyPrice: 349,
      features: [
        "Tudo do Plus",
        "1 teleconsulta por mês (até 1 hora)",
        "Revisão completa durante a consulta",
        "Definição das metas do próximo ciclo",
      ],
    },
  });

  await prisma.coupon.upsert({
    where: { code: "BEMVINDO10" },
    update: {},
    create: { code: "BEMVINDO10", percentOff: 0.1, active: true },
  });

  const adminEmail = "rafael@couthealth.com.br";
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Rafael Coutinho",
        role: Role.PROFESSIONAL,
        passwordHash: await argon2.hash("mudeesta-senha-123"),
        consentedAt: new Date(),
      },
    });
    console.log(`[seed] admin criado: ${adminEmail} / mudeesta-senha-123 (TROCAR)`);
  }

  // Classificações selecionáveis dos bancos — estrutura aprovada nos PDFs
  // mudancas/alimentos.pdf e mudancas/exercicios.pdf (lista fechada do cliente).
  // O seed garante as opções padrão; o admin pode adicionar/renomear/remover pelo painel sem código.
  const foodCategories = [
    "Frutas",
    "Grãos, cereais e leguminosas",
    "Legumes, tubérculos e raízes",
    "Verduras",
    "Proteínas",
    "Leites e derivados",
    "Gorduras e sementes",
    "Bebidas",
    "Doces",
    "Suplementos",
    "Outros",
  ];
  const categoryIdByName = new Map<string, string>();
  for (const [i, name] of foodCategories.entries()) {
    const cat = await prisma.foodCategory.upsert({ where: { name }, update: { order: i }, create: { name, order: i } });
    categoryIdByName.set(name, cat.id);
  }
  // Limpeza de categorias legadas sem uso (ex.: "Legumes e verduras" da rodada 2026-08-13,
  // que foi desmembrada em "Legumes, tubérculos e raízes" + "Verduras"). Só remove se vazia (FK RESTRICT).
  const legacyCategories = await prisma.foodCategory.findMany({ where: { name: { notIn: foodCategories } }, include: { _count: { select: { foods: true } } } });
  for (const lc of legacyCategories) {
    if (lc._count.foods === 0) {
      await prisma.foodCategory.delete({ where: { id: lc.id } });
      console.log(`[seed] categoria legada removida: ${lc.name}`);
    } else {
      console.log(`[seed] categoria legada mantida (em uso): ${lc.name} (${lc._count.foods} alimentos)`);
    }
  }

  const muscleGroups = [
    "Peitoral",
    "Costas",
    "Ombros",
    "Bíceps",
    "Tríceps",
    "Quadríceps",
    "Posterior de coxa",
    "Glúteos",
    "Adutores",
    "Abdutores",
    "Panturrilhas",
    "Abdômen",
    "Lombar",
    "Outros",
  ];
  const muscleGroupIdByName = new Map<string, string>();
  for (const [i, name] of muscleGroups.entries()) {
    const mg = await prisma.muscleGroup.upsert({ where: { name }, update: { order: i }, create: { name, order: i } });
    muscleGroupIdByName.set(name, mg.id);
  }
  const legacyGroups = await prisma.muscleGroup.findMany({ where: { name: { notIn: muscleGroups } }, include: { _count: { select: { exercises: true } } } });
  for (const lg of legacyGroups) {
    if (lg._count.exercises === 0) {
      await prisma.muscleGroup.delete({ where: { id: lg.id } });
      console.log(`[seed] grupo muscular legado removido: ${lg.name}`);
    } else {
      console.log(`[seed] grupo muscular legado mantido (em uso): ${lg.name} (${lg._count.exercises} exercícios)`);
    }
  }

  // ---------- Banco de Alimentos (104 itens — mudancas/alimentos.pdf) ----------
  // Valores por 100 g: kcal, carbs, protein, fat — exatamente como no PDF.
  // "≈" do PDF = valor aproximado, gravado como número direto; faixa "20–40" = ponto médio.
  const foods: Array<{ name: string; category: string; kcal: number; carbs: number; protein: number; fat: number }> = [
    // Frutas (13)
    { name: "Abacate", category: "Frutas", kcal: 96, carbs: 6.0, protein: 1.2, fat: 8.4 },
    { name: "Banana", category: "Frutas", kcal: 92, carbs: 23.8, protein: 1.4, fat: 0.1 },
    { name: "Maçã", category: "Frutas", kcal: 56, carbs: 15.2, protein: 0.3, fat: 0.0 },
    { name: "Mamão", category: "Frutas", kcal: 40, carbs: 10.4, protein: 0.5, fat: 0.1 },
    { name: "Pera", category: "Frutas", kcal: 53, carbs: 14.0, protein: 0.6, fat: 0.1 },
    { name: "Uva", category: "Frutas", kcal: 53, carbs: 13.6, protein: 0.7, fat: 0.2 },
    { name: "Laranja", category: "Frutas", kcal: 37, carbs: 8.9, protein: 1.0, fat: 0.1 },
    { name: "Limão", category: "Frutas", kcal: 32, carbs: 11.1, protein: 0.9, fat: 0.1 },
    { name: "Abacaxi", category: "Frutas", kcal: 48, carbs: 12.3, protein: 0.9, fat: 0.1 },
    { name: "Melancia", category: "Frutas", kcal: 33, carbs: 8.1, protein: 0.9, fat: 0.0 },
    { name: "Morango", category: "Frutas", kcal: 30, carbs: 6.8, protein: 0.9, fat: 0.3 },
    { name: "Manga", category: "Frutas", kcal: 64, carbs: 16.7, protein: 0.4, fat: 0.3 },
    { name: "Maracujá", category: "Frutas", kcal: 68, carbs: 12.3, protein: 2.0, fat: 2.1 },
    // Grãos, cereais e leguminosas (14)
    { name: "Arroz integral", category: "Grãos, cereais e leguminosas", kcal: 124, carbs: 25.8, protein: 2.6, fat: 1.0 },
    { name: "Arroz parboilizado", category: "Grãos, cereais e leguminosas", kcal: 102, carbs: 23.4, protein: 2.1, fat: 0.1 },
    { name: "Aveia", category: "Grãos, cereais e leguminosas", kcal: 394, carbs: 66.6, protein: 13.9, fat: 8.5 },
    { name: "Macarrão", category: "Grãos, cereais e leguminosas", kcal: 130, carbs: 25.0, protein: 5.0, fat: 1.0 },
    { name: "Pão integral", category: "Grãos, cereais e leguminosas", kcal: 253, carbs: 49.9, protein: 9.4, fat: 3.7 },
    { name: "Pão francês", category: "Grãos, cereais e leguminosas", kcal: 300, carbs: 58.6, protein: 8.0, fat: 3.1 },
    { name: "Pão de sal", category: "Grãos, cereais e leguminosas", kcal: 300, carbs: 58.6, protein: 8.0, fat: 3.1 },
    { name: "Crepioca", category: "Grãos, cereais e leguminosas", kcal: 160, carbs: 25.0, protein: 5.0, fat: 4.0 },
    { name: "Angu de milho", category: "Grãos, cereais e leguminosas", kcal: 100, carbs: 20.0, protein: 2.0, fat: 0.5 },
    { name: "Feijão", category: "Grãos, cereais e leguminosas", kcal: 76, carbs: 13.6, protein: 4.8, fat: 0.5 },
    { name: "Grão-de-bico", category: "Grãos, cereais e leguminosas", kcal: 115, carbs: 20.8, protein: 7.5, fat: 1.9 },
    { name: "Lentilha", category: "Grãos, cereais e leguminosas", kcal: 93, carbs: 16.3, protein: 6.3, fat: 0.5 },
    { name: "Granola", category: "Grãos, cereais e leguminosas", kcal: 420, carbs: 65.0, protein: 10.0, fat: 15.0 },
    { name: "Homus", category: "Grãos, cereais e leguminosas", kcal: 166, carbs: 14.3, protein: 7.9, fat: 9.6 },
    // Legumes, tubérculos e raízes (11)
    { name: "Batata inglesa", category: "Legumes, tubérculos e raízes", kcal: 52, carbs: 11.9, protein: 1.2, fat: 0.0 },
    { name: "Batata-doce", category: "Legumes, tubérculos e raízes", kcal: 77, carbs: 18.4, protein: 0.6, fat: 0.1 },
    { name: "Batata-baroa", category: "Legumes, tubérculos e raízes", kcal: 80, carbs: 18.9, protein: 0.9, fat: 0.2 },
    { name: "Inhame", category: "Legumes, tubérculos e raízes", kcal: 78, carbs: 18.9, protein: 1.5, fat: 0.1 },
    { name: "Cenoura", category: "Legumes, tubérculos e raízes", kcal: 30, carbs: 6.7, protein: 0.8, fat: 0.2 },
    { name: "Beterraba", category: "Legumes, tubérculos e raízes", kcal: 32, carbs: 7.2, protein: 1.3, fat: 0.1 },
    { name: "Tomate", category: "Legumes, tubérculos e raízes", kcal: 15, carbs: 3.1, protein: 1.1, fat: 0.2 },
    { name: "Palmito", category: "Legumes, tubérculos e raízes", kcal: 23, carbs: 4.3, protein: 1.8, fat: 0.4 },
    { name: "Pepino", category: "Legumes, tubérculos e raízes", kcal: 10, carbs: 2.0, protein: 0.9, fat: 0.0 },
    { name: "Abóbora cabotiá", category: "Legumes, tubérculos e raízes", kcal: 48, carbs: 10.8, protein: 1.4, fat: 0.7 },
    { name: "Pimentão verde", category: "Legumes, tubérculos e raízes", kcal: 21, carbs: 4.9, protein: 1.1, fat: 0.2 },
    // Verduras (7)
    { name: "Brócolis", category: "Verduras", kcal: 25, carbs: 4.0, protein: 3.6, fat: 0.3 },
    { name: "Couve-flor", category: "Verduras", kcal: 23, carbs: 4.5, protein: 1.9, fat: 0.2 },
    { name: "Espinafre", category: "Verduras", kcal: 16, carbs: 2.6, protein: 2.0, fat: 0.2 },
    { name: "Alface", category: "Verduras", kcal: 14, carbs: 2.4, protein: 1.4, fat: 0.2 },
    { name: "Couve-manteiga", category: "Verduras", kcal: 27, carbs: 4.3, protein: 2.9, fat: 0.5 },
    { name: "Rúcula", category: "Verduras", kcal: 17, carbs: 3.2, protein: 2.0, fat: 0.3 },
    { name: "Agrião", category: "Verduras", kcal: 17, carbs: 2.3, protein: 2.7, fat: 0.2 },
    // Proteínas (11)
    { name: "Ovo", category: "Proteínas", kcal: 146, carbs: 0.6, protein: 13.3, fat: 9.5 },
    { name: "Peito de frango", category: "Proteínas", kcal: 159, carbs: 0.0, protein: 32.0, fat: 2.5 },
    { name: "Frango desfiado", category: "Proteínas", kcal: 159, carbs: 0.0, protein: 32.0, fat: 2.5 },
    { name: "Patê de frango", category: "Proteínas", kcal: 159, carbs: 0.0, protein: 32.0, fat: 2.5 },
    { name: "Patê de ovo", category: "Proteínas", kcal: 146, carbs: 0.6, protein: 13.3, fat: 9.5 },
    { name: "Carne bovina", category: "Proteínas", kcal: 219, carbs: 0.0, protein: 35.9, fat: 7.3 },
    { name: "Carne moída", category: "Proteínas", kcal: 212, carbs: 0.0, protein: 26.7, fat: 10.9 },
    { name: "Peixe", category: "Proteínas", kcal: 88, carbs: 0.0, protein: 18.0, fat: 1.2 },
    { name: "Fígado bovino", category: "Proteínas", kcal: 135, carbs: 4.7, protein: 20.7, fat: 4.7 },
    { name: "Atum em conserva", category: "Proteínas", kcal: 166, carbs: 0.0, protein: 26.2, fat: 6.0 },
    { name: "Sardinha em conserva", category: "Proteínas", kcal: 114, carbs: 0.0, protein: 21.1, fat: 2.7 },
    // Leites e derivados (10)
    { name: "Leite", category: "Leites e derivados", kcal: 61, carbs: 4.8, protein: 3.2, fat: 3.3 },
    { name: "Queijo", category: "Leites e derivados", kcal: 264, carbs: 3.2, protein: 17.4, fat: 20.2 },
    { name: "Queijo cottage", category: "Leites e derivados", kcal: 98, carbs: 3.4, protein: 11.0, fat: 4.3 },
    { name: "Ricota", category: "Leites e derivados", kcal: 140, carbs: 3.8, protein: 12.6, fat: 8.1 },
    { name: "Queijo minas", category: "Leites e derivados", kcal: 264, carbs: 3.2, protein: 17.4, fat: 20.2 },
    { name: "Queijo magro", category: "Leites e derivados", kcal: 90, carbs: 1.9, protein: 13.7, fat: 1.2 },
    { name: "Requeijão light", category: "Leites e derivados", kcal: 231, carbs: 2.4, protein: 10.6, fat: 17.6 },
    { name: "Iogurte natural", category: "Leites e derivados", kcal: 51, carbs: 4.1, protein: 3.0, fat: 1.9 },
    { name: "Iogurte proteico", category: "Leites e derivados", kcal: 60, carbs: 5.0, protein: 7.0, fat: 1.0 },
    { name: "YoPro", category: "Leites e derivados", kcal: 60, carbs: 5.0, protein: 10.0, fat: 0.5 },
    // Gorduras e sementes (9)
    { name: "Azeite", category: "Gorduras e sementes", kcal: 884, carbs: 0.0, protein: 0.0, fat: 100.0 },
    { name: "Amendoim", category: "Gorduras e sementes", kcal: 600, carbs: 16.0, protein: 27.0, fat: 50.0 },
    { name: "Chia", category: "Gorduras e sementes", kcal: 486, carbs: 42.1, protein: 16.5, fat: 30.7 },
    { name: "Linhaça", category: "Gorduras e sementes", kcal: 495, carbs: 43.3, protein: 14.1, fat: 32.3 },
    { name: "Semente de abóbora", category: "Gorduras e sementes", kcal: 559, carbs: 10.7, protein: 30.2, fat: 49.0 },
    { name: "Semente de girassol", category: "Gorduras e sementes", kcal: 584, carbs: 20.0, protein: 20.8, fat: 51.5 },
    { name: "Castanha-do-Pará", category: "Gorduras e sementes", kcal: 643, carbs: 15.1, protein: 14.5, fat: 63.5 },
    { name: "Castanha de caju", category: "Gorduras e sementes", kcal: 570, carbs: 30.2, protein: 18.2, fat: 46.2 },
    { name: "Nozes", category: "Gorduras e sementes", kcal: 620, carbs: 13.7, protein: 14.0, fat: 59.0 },
    // Bebidas (10)
    { name: "Café", category: "Bebidas", kcal: 9, carbs: 1.5, protein: 0.7, fat: 0.1 },
    { name: "Água de coco", category: "Bebidas", kcal: 22, carbs: 5.3, protein: 0.0, fat: 0.0 },
    { name: "Suco de limão", category: "Bebidas", kcal: 22, carbs: 7.3, protein: 0.6, fat: 0.1 },
    { name: "Suco de laranja", category: "Bebidas", kcal: 37, carbs: 8.7, protein: 0.7, fat: 0.1 },
    { name: "Limonada", category: "Bebidas", kcal: 10, carbs: 2.5, protein: 0.2, fat: 0.0 },
    { name: "Chá", category: "Bebidas", kcal: 1, carbs: 0.2, protein: 0.0, fat: 0.0 },
    { name: "Chá verde", category: "Bebidas", kcal: 1, carbs: 0.2, protein: 0.0, fat: 0.0 },
    // Faixa 20–40 kcal etc. -> ponto médio (30 kcal, 2.5 C, 1.75 P, 1.5 G)
    { name: "Leite vegetal sem açúcar", category: "Bebidas", kcal: 30, carbs: 2.5, protein: 1.75, fat: 1.5 },
    { name: "Suco de maracujá", category: "Bebidas", kcal: 30, carbs: 7.0, protein: 0.5, fat: 0.1 },
    { name: "Suco de abacaxi", category: "Bebidas", kcal: 40, carbs: 10.0, protein: 0.3, fat: 0.1 },
    // Doces (10)
    { name: "Mel", category: "Doces", kcal: 309, carbs: 84.0, protein: 0.4, fat: 0.0 },
    { name: "Doce de leite", category: "Doces", kcal: 315, carbs: 57.0, protein: 6.0, fat: 6.0 },
    { name: "Gelatina de whey", category: "Doces", kcal: 70, carbs: 5.0, protein: 10.0, fat: 1.0 },
    { name: "Gelatina diet", category: "Doces", kcal: 10, carbs: 0.0, protein: 1.5, fat: 0.0 },
    { name: "Pudim light", category: "Doces", kcal: 90, carbs: 15.0, protein: 3.0, fat: 2.0 },
    { name: "Mousse de maracujá light", category: "Doces", kcal: 100, carbs: 15.0, protein: 3.0, fat: 3.0 },
    { name: "Doce de abóbora light", category: "Doces", kcal: 80, carbs: 18.0, protein: 0.5, fat: 0.1 },
    { name: "Sorvete light", category: "Doces", kcal: 130, carbs: 20.0, protein: 4.0, fat: 4.0 },
    { name: "Pudim proteico", category: "Doces", kcal: 100, carbs: 8.0, protein: 12.0, fat: 2.0 },
    { name: "Mousse proteico", category: "Doces", kcal: 100, carbs: 8.0, protein: 12.0, fat: 2.0 },
    // Suplementos (9)
    { name: "Whey protein", category: "Suplementos", kcal: 400, carbs: 10.0, protein: 75.0, fat: 7.0 },
    { name: "Creatina", category: "Suplementos", kcal: 0, carbs: 0.0, protein: 0.0, fat: 0.0 },
    { name: "Albumina", category: "Suplementos", kcal: 370, carbs: 5.0, protein: 80.0, fat: 1.0 },
    { name: "Whey protein vegetal", category: "Suplementos", kcal: 380, carbs: 10.0, protein: 75.0, fat: 5.0 },
    { name: "Glutamina", category: "Suplementos", kcal: 400, carbs: 0.0, protein: 100.0, fat: 0.0 },
    { name: "Beta-alanina", category: "Suplementos", kcal: 0, carbs: 0.0, protein: 0.0, fat: 0.0 },
    { name: "Cafeína", category: "Suplementos", kcal: 0, carbs: 0.0, protein: 0.0, fat: 0.0 },
    { name: "Ômega-3", category: "Suplementos", kcal: 900, carbs: 0.0, protein: 0.0, fat: 100.0 },
    { name: "Colágeno", category: "Suplementos", kcal: 360, carbs: 0.0, protein: 90.0, fat: 0.0 },
  ];
  let foodUpserts = 0;
  for (const f of foods) {
    const categoryId = categoryIdByName.get(f.category);
    if (!categoryId) throw new Error(`Categoria não encontrada: ${f.category} para alimento ${f.name}`);
    const existing = await prisma.food.findFirst({ where: { name: f.name } });
    if (existing) {
      await prisma.food.update({ where: { id: existing.id }, data: { categoryId, kcal: f.kcal, carbs: f.carbs, protein: f.protein, fat: f.fat } });
    } else {
      await prisma.food.create({ data: { name: f.name, categoryId, kcal: f.kcal, carbs: f.carbs, protein: f.protein, fat: f.fat } });
    }
    foodUpserts++;
  }

  // ---------- Banco de Exercícios (57 itens — mudancas/exercicios.pdf) ----------
  // Cada exercício vinculado a um único grupamento muscular principal (filtro na prescrição).
  // Vídeos não inclusos nesta rodada — o cliente insere manualmente depois.
  const exercises: Array<{ name: string; muscleGroup: string }> = [
    // Peitoral (6)
    { name: "Supino reto na máquina", muscleGroup: "Peitoral" },
    { name: "Supino reto livre", muscleGroup: "Peitoral" },
    { name: "Crucifixo na máquina", muscleGroup: "Peitoral" },
    { name: "Supino com halteres", muscleGroup: "Peitoral" },
    { name: "Pullover", muscleGroup: "Peitoral" },
    { name: "Voador máquina", muscleGroup: "Peitoral" },
    // Costas (7)
    { name: "Puxada na máquina", muscleGroup: "Costas" },
    { name: "Puxada livre", muscleGroup: "Costas" },
    { name: "Remada na máquina", muscleGroup: "Costas" },
    { name: "Remada baixa", muscleGroup: "Costas" },
    { name: "Remada curvada", muscleGroup: "Costas" },
    { name: "Serrote unilateral", muscleGroup: "Costas" },
    { name: "Crucifixo invertido", muscleGroup: "Costas" },
    // Ombros (6)
    { name: "Rotação externa", muscleGroup: "Ombros" },
    { name: "Rotação interna", muscleGroup: "Ombros" },
    { name: "Desenvolvimento de ombros", muscleGroup: "Ombros" },
    { name: "Elevação lateral", muscleGroup: "Ombros" },
    { name: "Elevação lateral unilateral no crossover", muscleGroup: "Ombros" },
    { name: "Remada alta", muscleGroup: "Ombros" },
    // Bíceps (4)
    { name: "Bíceps com halteres", muscleGroup: "Bíceps" },
    { name: "Bíceps na máquina", muscleGroup: "Bíceps" },
    { name: "Bíceps com pegada invertida", muscleGroup: "Bíceps" },
    { name: "Bíceps no banco Scott", muscleGroup: "Bíceps" },
    // Tríceps (4)
    { name: "Tríceps barra V no crossover", muscleGroup: "Tríceps" },
    { name: "Tríceps invertido com barra reta no crossover", muscleGroup: "Tríceps" },
    { name: "Tríceps testa com barra V", muscleGroup: "Tríceps" },
    { name: "Tríceps na paralela", muscleGroup: "Tríceps" },
    // Quadríceps (4)
    { name: "Cadeira extensora", muscleGroup: "Quadríceps" },
    { name: "Cadeira extensora unilateral", muscleGroup: "Quadríceps" },
    { name: "Banco Sissy", muscleGroup: "Quadríceps" },
    { name: "Flexão nórdica inversa", muscleGroup: "Quadríceps" },
    // Posterior de coxa (3)
    { name: "Cadeira flexora", muscleGroup: "Posterior de coxa" },
    { name: "Mesa flexora", muscleGroup: "Posterior de coxa" },
    { name: "Stiff", muscleGroup: "Posterior de coxa" },
    // Glúteos (8)
    { name: "Agachamento livre", muscleGroup: "Glúteos" },
    { name: "Agachamento na máquina", muscleGroup: "Glúteos" },
    { name: "Agachamento na barra reta", muscleGroup: "Glúteos" },
    { name: "Agachamento passada", muscleGroup: "Glúteos" },
    { name: "Agachamento unilateral", muscleGroup: "Glúteos" },
    { name: "Agachamento búlgaro", muscleGroup: "Glúteos" },
    { name: "Coice no crossover", muscleGroup: "Glúteos" },
    { name: "Elevação pélvica", muscleGroup: "Glúteos" },
    // Adutores (1)
    { name: "Cadeira adutora", muscleGroup: "Adutores" },
    // Abdutores (2)
    { name: "Cadeira abdutora", muscleGroup: "Abdutores" },
    { name: "Cadeira abdutora em pé", muscleGroup: "Abdutores" },
    // Panturrilhas (4)
    { name: "Panturrilha com peso corporal no step", muscleGroup: "Panturrilhas" },
    { name: "Panturrilha unilateral no step", muscleGroup: "Panturrilhas" },
    { name: "Panturrilha na máquina com joelho estendido", muscleGroup: "Panturrilhas" },
    { name: "Panturrilha na máquina com joelho flexionado", muscleGroup: "Panturrilhas" },
    // Abdômen (5)
    { name: "Abdominal curto no colchonete", muscleGroup: "Abdômen" },
    { name: "Abdominal completo no colchonete", muscleGroup: "Abdômen" },
    { name: "Abdominal na máquina", muscleGroup: "Abdômen" },
    { name: "Abdominal infra suspenso", muscleGroup: "Abdômen" },
    { name: "Abdominal infra na máquina", muscleGroup: "Abdômen" },
    // Lombar (3)
    { name: "Banco romano", muscleGroup: "Lombar" },
    { name: "Extensão de quadril no banco romano", muscleGroup: "Lombar" },
    { name: "Perdigueiro unilateral isométrico", muscleGroup: "Lombar" },
  ];
  let exerciseUpserts = 0;
  for (const e of exercises) {
    const muscleGroupId = muscleGroupIdByName.get(e.muscleGroup);
    if (!muscleGroupId) throw new Error(`Grupo muscular não encontrado: ${e.muscleGroup} para exercício ${e.name}`);
    const existing = await prisma.exerciseLibrary.findFirst({ where: { name: e.name } });
    if (existing) {
      await prisma.exerciseLibrary.update({ where: { id: existing.id }, data: { muscleGroupId } });
    } else {
      await prisma.exerciseLibrary.create({ data: { name: e.name, muscleGroupId } });
    }
    exerciseUpserts++;
  }

  console.log(`[seed] concluído: 3 planos, 1 cupom (BEMVINDO10), 1 admin, ${foodCategories.length} categorias de alimentos, ${muscleGroups.length} grupos musculares, ${foodUpserts} alimentos, ${exerciseUpserts} exercícios.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
