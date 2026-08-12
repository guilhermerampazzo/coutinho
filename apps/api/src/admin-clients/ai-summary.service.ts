import { Injectable, ServiceUnavailableException } from "@nestjs/common";

export interface AiSummaryResult {
  /** Resumo curto — para leitura em poucos segundos. */
  short: string;
  /** Pontos de atenção destacados pela IA (separados do resumo). */
  attentionPoints: string[];
  /** Resumo detalhado agrupado por categorias. */
  detailed: { category: string; items: string[] }[];
}

const anamnesisLabels: Record<string, string> = {
  sex: "Sexo",
  goal: "Objetivo principal",
  goalImprove: "O que deseja melhorar",
  goalDescription: "Resultado que deseja alcançar",
  hasDiseases: "Tem doenças/condições",
  diseases: "Doenças/condições",
  usesMedications: "Usa medicamentos",
  medications: "Medicamentos",
  hasAllergies: "Tem alergias",
  allergies: "Alergias",
  hasIntolerances: "Tem intolerâncias",
  intolerances: "Intolerâncias",
  hasNutritionalDeficiencies: "Tem deficiências nutricionais",
  nutritionalDeficiencies: "Deficiências nutricionais",
  hadSurgeries: "Já fez cirurgias",
  surgeries: "Cirurgias",
  hasFamilyHistory: "Histórico familiar de doenças",
  familyHistory: "Histórico familiar",
  hasOrthopedicIssues: "Tem problemas ortopédicos",
  orthopedicIssues: "Problemas ortopédicos",
  hasAlteredExams: "Tem exames alterados",
  alteredExams: "Exames alterados",
  mealsPerDay: "Refeições/dia",
  currentDiet: "Alimentação atual",
  previousDiets: "Dietas anteriores",
  preferredFoods: "Alimentos preferidos",
  dislikedFoods: "Alimentos que não gosta",
  foodsAvoided: "Alimentos que não aceita consumir",
  waterLitersPerDay: "Água (L/dia)",
  bowelFunction: "Função intestinal",
  usesSupplements: "Usa suplementos",
  supplements: "Suplementos",
  sleepTime: "Dorme às",
  wakeTime: "Acorda às",
  sleepHours: "Horas de sono",
  sleepQuality: "Qualidade do sono",
  workRoutine: "Rotina de trabalho/estudo",
  mealsOut: "Refeições fora de casa",
  routineDifficulties: "Dificuldades da rotina",
  smokes: "Fuma",
  drinksAlcohol: "Bebe álcool",
  practicesActivity: "Pratica atividade física",
  modality: "Modalidade",
  trainingDaysPerWeek: "Dias de treino/semana",
  trainingSince: "Treina há",
  trainingHistory: "Histórico de treinamento",
  sedentarySince: "Sedentário há",
  enjoyedExercises: "Exercícios que gosta",
  avoidedExercises: "Exercícios que não gosta",
  pain: "Dores",
  limitations: "Limitações",
  injuries: "Lesões",
  hasBioimpedance: "Tem dados de bioimpedância",
};

const valueLabels: Record<string, string> = {
  EMAGRECER: "Emagrecer",
  GANHAR_MASSA: "Ganhar massa muscular",
  COMPOSICAO_CORPORAL: "Melhorar composição corporal",
  SAUDE: "Melhorar a saúde",
  LONGEVIDADE: "Longevidade",
  OUTRO: "Outro",
  NORMAL: "Normal",
  CONSTIPACAO: "Constipação",
  DIARREIA: "Diarreia",
  IRREGULAR: "Irregular",
  feminino: "Feminino",
  masculino: "Masculino",
  outro: "Outro",
  boa: "Bom",
  otima: "Muito bom",
  ruim: "Ruim",
  regular: "Regular",
};

function pretty(v: unknown): string {
  if (v === null || v === undefined || v === "") return "";
  if (typeof v === "boolean") return v ? "Sim" : "Não";
  const label = valueLabels[String(v)];
  return label ?? String(v);
}

/**
 * Camada de IA da COUT (escopo.md §10): a IA apenas ORGANIZA e SINTETIZA a anamnese
 * para agilizar a análise do profissional — nunca prescreve, nunca decide e nunca
 * publica nada. As respostas originais continuam sempre disponíveis no painel.
 */
@Injectable()
export class AdminAiSummaryService {
  async generateSummary(client: any): Promise<AiSummaryResult> {
    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) {
      throw new ServiceUnavailableException(
        "Resumo com IA não configurado. Defina AI_API_KEY (e opcionalmente AI_BASE_URL/AI_MODEL) no .env."
      );
    }

    const baseUrl = (process.env.AI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, "");
    const model = process.env.AI_MODEL ?? "gpt-4o-mini";
    const input = this.buildInput(client);

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        max_tokens: 1200,
        messages: [
          {
            role: "system",
            content:
              "Você é uma ferramenta interna de organização de anamnese de um profissional de nutrição e treino. " +
              "Você SINTETIZA e ORGANIZA as informações do cliente — nunca prescreve dieta/treino, nunca dá diagnóstico e " +
              "nunca inventa dados que não estejam na anamnese. Responda APENAS com um JSON válido no formato: " +
              '{"short": "resumo curto em poucas frases", "attentionPoints": ["ponto 1", "ponto 2"], "detailed": [{"category": "Saúde", "items": ["item"]}]}. ' +
              "Use português do Brasil, linguagem profissional e direta.",
          },
          { role: "user", content: input },
        ],
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new ServiceUnavailableException(`Falha ao gerar resumo com IA (HTTP ${res.status}). ${detail.slice(0, 200)}`);
    }

    const data = await res.json();
    const content: string | undefined = data?.choices?.[0]?.message?.content;
    if (!content) throw new ServiceUnavailableException("A IA retornou uma resposta vazia.");

    const parsed = this.tryParseJson(content);
    if (parsed) {
      return {
        short: String(parsed.short ?? "").trim(),
        attentionPoints: Array.isArray(parsed.attentionPoints) ? parsed.attentionPoints.map(String) : [],
        detailed: Array.isArray(parsed.detailed)
          ? parsed.detailed.map((d: any) => ({
              category: String(d?.category ?? ""),
              items: Array.isArray(d?.items) ? d.items.map(String) : [],
            }))
          : [],
      };
    }
    return { short: content, attentionPoints: [], detailed: [] };
  }

  private tryParseJson(content: string): any | null {
    try {
      return JSON.parse(content);
    } catch {
      // Alguns providers embrulham o JSON em ```json ... ```
      const m = content.match(/\{[\s\S]*\}/);
      if (m) {
        try {
          return JSON.parse(m[0]);
        } catch {
          return null;
        }
      }
      return null;
    }
  }

  private buildInput(client: any): string {
    const lines: string[] = ["Anamnese do cliente (responda apenas com o JSON pedido):"];

    const anamnesis = client?.anamnesis ?? {};
    for (const [key, label] of Object.entries(anamnesisLabels)) {
      const value = pretty(anamnesis[key]);
      if (value) lines.push(`- ${label}: ${value}`);
    }

    const assessment = client?.assessments?.slice(-1)?.[0];
    if (assessment) {
      lines.push("");
      lines.push("## Avaliação física mais recente");
      const measures: Record<string, string> = {
        weightKg: "Peso (kg)",
        heightCm: "Altura (cm)",
        waistCm: "Cintura (cm)",
        abdomenCm: "Abdômen (cm)",
        armCm: "Braço (cm)",
        thighCm: "Coxa (cm)",
        chestCm: "Peitoral (cm)",
        muscleMassKg: "Massa muscular (kg)",
        fatMassKg: "Gordura corporal (kg)",
      };
      for (const [k, label] of Object.entries(measures)) {
        if (assessment[k] !== null && assessment[k] !== undefined) lines.push(`- ${label}: ${assessment[k]}`);
      }
    }
    return lines.join("\n");
  }
}
