// Anamnese da COUT — estrutura aprovada pelo cliente (Anamnese Detalhada, 2026-08).
// Experiência: 6 etapas, UMA pergunta por vez, perguntas condicionais (só o que se aplica),
// opções prontas/chips/sliders, salvamento automático a cada resposta.
// O currentStep salvo é o índice na lista LINEAR `questions` (estável); o wizard pula
// automaticamente as perguntas cujo gate condicional não está aberto.

export type QuestionType = "choice" | "chips" | "slider" | "number" | "text" | "textarea" | "time" | "boolean";

export interface ChoiceOption {
  value: string;
  label: string;
}

export interface Question {
  key: string;
  type: QuestionType;
  label: string;
  /** 1..6 — etapa a que a pergunta pertence (stepsMeta). */
  step: number;
  hint?: string;
  options?: ChoiceOption[];
  placeholder?: string;
  /** slider/number */
  min?: number;
  max?: number;
  stepValue?: number;
  unit?: string;
  /** chips: opções prontas + campo para adicionar outras. */
  chips?: { options: string[]; allowCustom?: boolean };
  /** Só exibe a pergunta se answers[gate.key] === gate.value (ex.: "Sim" / true). */
  gate?: { key: string; value: string | boolean };
  /** Se false (obrigatória), o avanço é bloqueado sem resposta. */
  optional?: boolean;
}

export const stepsMeta = [
  { title: "Sobre você", intro: "Vamos começar pelo mais importante." },
  { title: "Sua saúde", intro: "Agora quero entender um pouco sobre sua saúde." },
  { title: "Sua alimentação", intro: "Vamos falar um pouco sobre sua alimentação." },
  { title: "Sua rotina", intro: "Agora quero entender um pouco da sua rotina." },
  { title: "Seu treino", intro: "Vamos falar sobre atividade física e treino." },
  { title: "Sua avaliação", intro: "Agora vamos registrar alguns dados para acompanhar sua evolução. Sem esses dados agora? Tudo bem — você pode adicionar depois." },
] as const;

export const FOOD_CHIPS = ["Arroz", "Macarrão", "Batata", "Frango", "Carne", "Peixe", "Ovos", "Leite", "Banana", "Maçã", "Abacate"];

export const questions: Question[] = [
  // ---------------- Etapa 1 — Sobre você ----------------
  {
    key: "sex",
    type: "choice",
    step: 1,
    label: "Qual é o seu sexo?",
    options: [
      { value: "feminino", label: "Feminino" },
      { value: "masculino", label: "Masculino" },
      { value: "outro", label: "Outro" },
    ],
  },
  {
    key: "goal",
    type: "choice",
    step: 1,
    label: "Qual é o seu principal objetivo hoje?",
    options: [
      { value: "EMAGRECER", label: "Emagrecer" },
      { value: "GANHAR_MASSA", label: "Ganhar massa muscular" },
      { value: "COMPOSICAO_CORPORAL", label: "Melhorar minha composição corporal" },
      { value: "SAUDE", label: "Melhorar minha saúde" },
      { value: "LONGEVIDADE", label: "Longevidade" },
      { value: "OUTRO", label: "Outro" },
    ],
  },
  {
    key: "goalImprove",
    type: "textarea",
    step: 1,
    label: "O que você deseja melhorar?",
    placeholder: "Ex.: disposição, autoestima, qualidade do sono…",
    optional: true,
  },
  {
    key: "goalDescription",
    type: "textarea",
    step: 1,
    label: "Qual resultado você gostaria de alcançar?",
    placeholder: "Ex.: perder 8 kg em 6 meses e manter…",
    optional: true,
  },

  // ---------------- Etapa 2 — Sua saúde ----------------
  { key: "hasDiseases", type: "boolean", step: 2, label: "Você tem alguma doença ou condição de saúde?" },
  { key: "diseases", type: "textarea", step: 2, label: "Quais doenças ou condições?", placeholder: "Ex.: hipertensão, diabetes, asma…", optional: true, gate: { key: "hasDiseases", value: true } },
  { key: "usesMedications", type: "boolean", step: 2, label: "Você utiliza algum medicamento?" },
  { key: "medications", type: "textarea", step: 2, label: "Quais medicamentos você utiliza?", placeholder: "Ex.: losartana 50mg, 1x ao dia…", optional: true, gate: { key: "usesMedications", value: true } },
  { key: "hasAllergies", type: "boolean", step: 2, label: "Você tem alguma alergia?" },
  { key: "allergies", type: "textarea", step: 2, label: "Quais alergias?", placeholder: "Ex.: alergia a penicilina…", optional: true, gate: { key: "hasAllergies", value: true } },
  { key: "hasIntolerances", type: "boolean", step: 2, label: "Você tem alguma intolerância alimentar?" },
  { key: "intolerances", type: "textarea", step: 2, label: "Quais intolerâncias?", placeholder: "Ex.: lactose, glúten…", optional: true, gate: { key: "hasIntolerances", value: true } },
  { key: "hasNutritionalDeficiencies", type: "boolean", step: 2, label: "Você tem alguma deficiência nutricional?" },
  { key: "nutritionalDeficiencies", type: "textarea", step: 2, label: "Quais deficiências?", placeholder: "Ex.: anemia por falta de ferro, vitamina D…", optional: true, gate: { key: "hasNutritionalDeficiencies", value: true } },
  { key: "hadSurgeries", type: "boolean", step: 2, label: "Você já passou por alguma cirurgia?" },
  { key: "surgeries", type: "textarea", step: 2, label: "Quais cirurgias?", placeholder: "Ex.: apendicite em 2019…", optional: true, gate: { key: "hadSurgeries", value: true } },
  { key: "hasFamilyHistory", type: "boolean", step: 2, label: "Tem histórico de doenças na família?" },
  { key: "familyHistory", type: "textarea", step: 2, label: "Quais doenças na família?", placeholder: "Ex.: diabetes, hipertensão, câncer…", optional: true, gate: { key: "hasFamilyHistory", value: true } },
  { key: "hasOrthopedicIssues", type: "boolean", step: 2, label: "Você tem algum problema ortopédico?" },
  { key: "orthopedicIssues", type: "textarea", step: 2, label: "Quais problemas ortopédicos?", placeholder: "Ex.: joelho, coluna, ombro…", optional: true, gate: { key: "hasOrthopedicIssues", value: true } },
  { key: "hasAlteredExams", type: "boolean", step: 2, label: "Você tem exames alterados?" },
  { key: "alteredExams", type: "textarea", step: 2, label: "Quais exames alterados?", placeholder: "Ex.: colesterol, glicemia…", optional: true, gate: { key: "hasAlteredExams", value: true } },

  // ---------------- Etapa 3 — Sua alimentação ----------------
  {
    key: "mealsPerDay",
    type: "choice",
    step: 3,
    label: "Quantas refeições você faz por dia?",
    options: [
      { value: "2", label: "2" },
      { value: "3", label: "3" },
      { value: "4", label: "4" },
      { value: "5", label: "5" },
      { value: "6", label: "6" },
      { value: "7", label: "7 ou mais" },
    ],
  },
  {
    key: "currentDiet",
    type: "textarea",
    step: 3,
    label: "Como está sua alimentação atualmente?",
    placeholder: "Ex.: como bem no almoço, mas belisco à noite…",
    optional: true,
  },
  { key: "previousDiets", type: "textarea", step: 3, label: "Você já fez alguma dieta antes? Como foi?", placeholder: "Ex.: low carb, jejum intermitente…", optional: true },
  { key: "preferredFoods", type: "chips", step: 3, label: "Quais desses alimentos você gosta?", chips: { options: FOOD_CHIPS, allowCustom: true }, optional: true },
  { key: "dislikedFoods", type: "chips", step: 3, label: "Quais alimentos você não gosta?", chips: { options: FOOD_CHIPS, allowCustom: true }, optional: true },
  { key: "foodsAvoided", type: "chips", step: 3, label: "Quais alimentos você não aceita consumir?", hint: "Por qualquer motivo: religião, princípios, experiência ruim…", chips: { options: FOOD_CHIPS, allowCustom: true }, optional: true },
  {
    key: "waterLitersPerDay",
    type: "slider",
    step: 3,
    label: "Quanto de água você bebe por dia?",
    min: 0.5,
    max: 5,
    stepValue: 0.1,
    unit: "L",
    optional: true,
  },
  {
    key: "bowelFunction",
    type: "choice",
    step: 3,
    label: "Como você descreveria sua função intestinal?",
    options: [
      { value: "NORMAL", label: "Normal" },
      { value: "CONSTIPACAO", label: "Constipação" },
      { value: "DIARREIA", label: "Diarreia" },
      { value: "IRREGULAR", label: "Irregular" },
    ],
    optional: true,
  },
  { key: "usesSupplements", type: "boolean", step: 3, label: "Você utiliza suplementos?" },
  { key: "supplements", type: "textarea", step: 3, label: "Quais suplementos você utiliza?", placeholder: "Ex.: whey, creatina, vitamina D…", optional: true, gate: { key: "usesSupplements", value: true } },

  // ---------------- Etapa 4 — Sua rotina ----------------
  { key: "sleepTime", type: "time", step: 4, label: "Que horas você costuma dormir?", optional: true },
  { key: "wakeTime", type: "time", step: 4, label: "Que horas você costuma acordar?", optional: true },
  { key: "sleepHours", type: "slider", step: 4, label: "Quantas horas de sono você tem por noite?", min: 3, max: 12, stepValue: 0.5, unit: "h", optional: true },
  {
    key: "sleepQuality",
    type: "choice",
    step: 4,
    label: "Como você considera seu sono?",
    options: [
      { value: "ruim", label: "Ruim" },
      { value: "regular", label: "Regular" },
      { value: "boa", label: "Bom" },
      { value: "otima", label: "Muito bom" },
    ],
    optional: true,
  },
  { key: "workRoutine", type: "textarea", step: 4, label: "Como é sua rotina de trabalho/estudo?", placeholder: "Ex.: home office 8h, muito tempo sentado…", optional: true },
  { key: "mealsOut", type: "textarea", step: 4, label: "Com que frequência você come fora de casa?", placeholder: "Ex.: almoço fora todo dia útil…", optional: true },
  { key: "routineDifficulties", type: "textarea", step: 4, label: "Quais são as maiores dificuldades da sua rotina?", placeholder: "Ex.: falta de tempo, horários irregulares…", optional: true },
  { key: "smokes", type: "boolean", step: 4, label: "Você fuma?" },
  { key: "drinksAlcohol", type: "boolean", step: 4, label: "Você consome bebidas alcoólicas?" },

  // ---------------- Etapa 5 — Seu treino ----------------
  { key: "practicesActivity", type: "boolean", step: 5, label: "Você pratica atividade física atualmente?" },
  { key: "modality", type: "text", step: 5, label: "Qual atividade você pratica?", placeholder: "Ex.: musculação, corrida, funcional…", optional: true, gate: { key: "practicesActivity", value: true } },
  {
    key: "trainingDaysPerWeek",
    type: "choice",
    step: 5,
    label: "Quantas vezes por semana você treina?",
    options: [
      { value: "1", label: "1" },
      { value: "2", label: "2" },
      { value: "3", label: "3" },
      { value: "4", label: "4" },
      { value: "5", label: "5" },
      { value: "6", label: "6" },
      { value: "7", label: "7" },
    ],
    optional: true,
    gate: { key: "practicesActivity", value: true },
  },
  { key: "trainingSince", type: "text", step: 5, label: "Há quanto tempo você pratica?", placeholder: "Ex.: 6 meses, 2 anos…", optional: true, gate: { key: "practicesActivity", value: true } },
  { key: "trainingHistory", type: "textarea", step: 5, label: "Qual seu histórico de treinamento?", placeholder: "Ex.: já treinei por 3 anos, parei na pandemia…", optional: true, gate: { key: "practicesActivity", value: true } },
  { key: "sedentarySince", type: "text", step: 5, label: "Há quanto tempo você está sedentário?", placeholder: "Ex.: há 2 anos…", optional: true, gate: { key: "practicesActivity", value: false } },
  { key: "enjoyedExercises", type: "chips", step: 5, label: "Quais exercícios você gosta?", chips: { options: ["Musculação", "Corrida", "Caminhada", "Natação", "Bicicleta", "Funcional", "Dança", "Lutas"], allowCustom: true }, optional: true },
  { key: "avoidedExercises", type: "chips", step: 5, label: "Quais exercícios você não gosta?", chips: { options: ["Agachamento", "Corrida", "Abdominal", "Burpee", "Polichinelo", "Corda"], allowCustom: true }, optional: true },
  { key: "pain", type: "textarea", step: 5, label: "Você sente alguma dor? Onde?", placeholder: "Ex.: dor no joelho direito ao agachar…", optional: true },
  { key: "limitations", type: "textarea", step: 5, label: "Você tem alguma limitação?", placeholder: "Ex.: pouco alongamento, mobilidade de ombro…", optional: true },
  { key: "injuries", type: "textarea", step: 5, label: "Você já teve alguma lesão?", placeholder: "Ex.: lesão no ombro em 2021…", optional: true },

  // ---------------- Etapa 6 — Sua avaliação ----------------
  { key: "hasBioimpedance", type: "boolean", step: 6, label: "Você tem dados de bioimpedância?", hint: "Gordura corporal e massa muscular de uma avaliação recente." },
  { key: "assessment.muscleMassKg", type: "number", step: 6, label: "Massa muscular (kg)", unit: "kg", optional: true, gate: { key: "hasBioimpedance", value: true } },
  { key: "assessment.fatMassKg", type: "number", step: 6, label: "Gordura corporal (kg)", unit: "kg", optional: true, gate: { key: "hasBioimpedance", value: true } },
  { key: "assessment.weightKg", type: "number", step: 6, label: "Peso atual (kg)", unit: "kg", optional: true },
  { key: "assessment.heightCm", type: "number", step: 6, label: "Altura (cm)", unit: "cm", optional: true },
  { key: "assessment.waistCm", type: "number", step: 6, label: "Circunferência da cintura (cm)", unit: "cm", optional: true },
  { key: "assessment.abdomenCm", type: "number", step: 6, label: "Circunferência abdominal (cm)", unit: "cm", optional: true },
  { key: "assessment.armCm", type: "number", step: 6, label: "Circunferência do braço (cm)", unit: "cm", optional: true },
  { key: "assessment.thighCm", type: "number", step: 6, label: "Circunferência da coxa (cm)", unit: "cm", optional: true },
  { key: "assessment.chestCm", type: "number", step: 6, label: "Circunferência do peitoral (cm)", unit: "cm", optional: true, gate: { key: "sex", value: "masculino" } },
];
