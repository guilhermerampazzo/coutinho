import { useEffect, useRef, useState, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Button, Card, TextField, LineChart } from "@couthealth/ui";
import { adminApi, foodsApi, exercisesApi, professionalProfileApi, dietTemplatesApi, workoutTemplatesApi, ApiError, type FoodItem, type FoodCategory, type ExerciseItem, type MuscleGroup, type Assessment, type DietTemplate, type WorkoutTemplate } from "../../lib/api";
import { mealPlanPdfHtml, workoutPdfHtml, openPdfWindow } from "../../lib/pdf";
import { useAuth } from "../../lib/auth";
import { AdminLayout } from "./AdminLayout";

// ---- Labels ----
const anamnesisLabels: Record<string, string> = {
  sex: "Sexo",
  birthDate: "Nascimento",
  heightCm: "Altura (cm)",
  weightKg: "Peso (kg)",
  profession: "Profissão",
  goal: "Objetivo",
  goalDescription: "Resultado que deseja alcançar",
  goalImprove: "O que deseja melhorar",
  mealsPerDay: "Refeições/dia",
  waterLitersPerDay: "Água (L/dia)",
  preferredFoods: "Alimentos preferidos",
  dislikedFoods: "Alimentos que não gosta",
  foodsAvoided: "Alimentos que não aceita consumir",
  currentDiet: "Alimentação atual",
  supplements: "Suplementos",
  allergies: "Alergias",
  intolerances: "Intolerâncias",
  previousDiets: "Dietas anteriores",
  diseases: "Doenças/condições",
  medications: "Medicamentos",
  surgeries: "Cirurgias",
  alteredExams: "Exames alterados",
  nutritionalDeficiencies: "Deficiências nutricionais",
  orthopedicIssues: "Problemas ortopédicos",
  familyHistory: "Histórico familiar",
  sleepQuality: "Qualidade do sono",
  sleepHours: "Horas de sono",
  sleepTime: "Dorme às",
  wakeTime: "Acorda às",
  bowelFunction: "Função intestinal",
  smokes: "Fuma",
  drinksAlcohol: "Bebe álcool",
  workRoutine: "Rotina de trabalho/estudo",
  mealsOut: "Refeições fora de casa",
  routineDifficulties: "Dificuldades da rotina",
  activityLevel: "Nível de atividade",
  trainingDaysPerWeek: "Dias de treino/semana",
  modality: "Modalidade",
  trainingSince: "Treina há",
  trainingHistory: "Histórico de treinamento",
  sedentarySince: "Sedentário há",
  enjoyedExercises: "Exercícios que gosta",
  avoidedExercises: "Exercícios que não gosta",
  pain: "Dores",
  limitations: "Limitações",
  injuries: "Lesões",
  hasDiseases: "Tem doenças/condições",
  usesMedications: "Usa medicamentos",
  hasAllergies: "Tem alergias",
  hasIntolerances: "Tem intolerâncias",
  hasNutritionalDeficiencies: "Tem deficiências nutricionais",
  hadSurgeries: "Já fez cirurgias",
  hasFamilyHistory: "Histórico familiar de doenças",
  hasOrthopedicIssues: "Tem problemas ortopédicos",
  hasAlteredExams: "Tem exames alterados",
  usesSupplements: "Usa suplementos",
  practicesActivity: "Pratica atividade física",
  hasBioimpedance: "Tem dados de bioimpedância",
};

function prettyAnamnesisValue(v: unknown): string {
  if (v === null || v === undefined || v === "") return "";
  if (typeof v === "boolean") return v ? "Sim" : "Não";
  const labels: Record<string, string> = {
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
  return labels[String(v)] ?? String(v);
}

const assessmentLabels: Record<string, string> = {
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

function AnamnesisSummary({ anamnesis }: { anamnesis: Record<string, any> }) {
  const entries = Object.entries(anamnesisLabels).filter(([key]) => anamnesis?.[key] !== null && anamnesis?.[key] !== undefined && String(anamnesis[key]).trim() !== "");
  if (entries.length === 0) return <p style={{ color: "var(--text-secondary)" }}>Anamnese ainda não preenchida.</p>;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "var(--sp-4)" }}>
      {entries.map(([key]) => (
        <div key={key}>
          <p style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-caption)", margin: 0 }}>{anamnesisLabels[key]}</p>
          <p style={{ margin: "2px 0 0" }}>{prettyAnamnesisValue(anamnesis[key])}</p>
        </div>
      ))}
    </div>
  );
}

function AssessmentSummaryCard({ assessments }: { assessments?: any[] }) {
  const latest = assessments?.slice(-1)?.[0];
  if (!latest) return <p style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-body-sm)", margin: 0 }}>Sem avaliação física registrada.</p>;
  const entries = Object.entries(assessmentLabels).filter(([key]) => latest[key] !== null && latest[key] !== undefined);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "var(--sp-3)" }}>
      {entries.map(([key, label]) => (
        <div key={key}>
          <p style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-caption)", margin: 0 }}>{label}</p>
          <p style={{ margin: "2px 0 0", fontWeight: 600 }}>{latest[key]}</p>
        </div>
      ))}
      <div>
        <p style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-caption)", margin: 0 }}>Registrado em</p>
        <p style={{ margin: "2px 0 0", fontWeight: 600 }}>{new Date(latest.recordedAt).toLocaleDateString("pt-BR")}</p>
      </div>
    </div>
  );
}

function AiSummaryPanel({ clientId }: { clientId: string }) {
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{ short: string; attentionPoints: string[]; detailed: { category: string; items: string[] }[] } | null>(null);
  async function generate() {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      setSummary(await adminApi.clientSummary(clientId, accessToken));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível gerar o resumo.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <Card style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--sp-3)", flexWrap: "wrap" }}>
        <h3 style={{ margin: 0 }}>Resumo inteligente</h3>
        {!summary && (
          <Button onClick={generate} disabled={loading} style={{ height: 36 }}>
            {loading ? "Gerando…" : "Gerar com IA"}
          </Button>
        )}
      </div>
      {error && <p style={{ color: "var(--danger)", fontSize: "var(--fs-body-sm)", margin: 0 }}>{error}</p>}
      {summary && (
        <>
          <div>
            <p style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-caption)", margin: "0 0 4px" }}>Resumo rápido</p>
            <p style={{ margin: 0, lineHeight: 1.6 }}>{summary.short}</p>
          </div>
          {summary.attentionPoints.length > 0 && (
            <div>
              <p style={{ color: "var(--danger)", fontSize: "var(--fs-caption)", fontWeight: 600, margin: "0 0 4px" }}>Pontos de atenção</p>
              <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }}>
                {summary.attentionPoints.map((p, i) => (
                  <li key={i} style={{ fontSize: "var(--fs-body-sm)" }}>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {summary.detailed.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
              <p style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-caption)", margin: 0 }}>Resumo detalhado</p>
              {summary.detailed.map((section) => (
                <div key={section.category} style={{ background: "var(--bg-base)", borderRadius: "var(--r-md)", padding: "var(--sp-4)" }}>
                  <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: "var(--fs-body-sm)" }}>{section.category}</p>
                  <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 3 }}>
                    {section.items.map((item, i) => (
                      <li key={i} style={{ fontSize: "var(--fs-body-sm)", color: "var(--text-secondary)" }}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
          <Button variant="secondary" onClick={generate} disabled={loading} style={{ height: 34, fontSize: "var(--fs-caption)" }}>
            Regenerar
          </Button>
          <p style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-caption)", margin: 0 }}>A IA apenas organiza e resume — as decisões clínicas são suas.</p>
        </>
      )}
    </Card>
  );
}

function MessagesPanel({ clientId }: { clientId: string }) {
  const { accessToken } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [reply, setReply] = useState("");
  function load() {
    if (!accessToken) return;
    adminApi.clientMessages(clientId, accessToken).then((r) => setMessages(r.messages));
  }
  useEffect(load, [accessToken, clientId]);
  async function send() {
    if (!accessToken || !reply.trim()) return;
    await adminApi.replyToClient(clientId, reply, accessToken);
    setReply("");
    load();
  }
  return (
    <Card style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
      <h3 style={{ margin: 0 }}>Mensagens</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 240, overflow: "auto" }}>
        {messages.map((m) => (
          <div key={m.id} style={{ alignSelf: m.sender.role === "PROFESSIONAL" ? "flex-end" : "flex-start", maxWidth: "80%" }}>
            <div style={{ background: m.sender.role === "PROFESSIONAL" ? "var(--accent)" : "var(--bg-surface)", color: m.sender.role === "PROFESSIONAL" ? "var(--ink-900)" : "var(--text-primary)", padding: "8px 12px", borderRadius: 10, fontSize: "var(--fs-body-sm)" }}>{m.body}</div>
          </div>
        ))}
        {messages.length === 0 && <p style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-body-sm)" }}>Nenhuma mensagem ainda.</p>}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <TextField label="" placeholder="Escrever mensagem…" value={reply} onChange={(e) => setReply(e.target.value)} />
        </div>
        <Button onClick={send}>Enviar</Button>
      </div>
    </Card>
  );
}

// ---- UNIDADES CASEIRAS (PDF Arquitetura dieta e treino) ----
const UNITS = ["Gramas", "Mililitros", "Unidade", "Colher de sopa", "Colher de sobremesa", "Colher de chá", "Colher de café", "Xícara", "Copo", "Concha", "Fatia", "Rodela", "Pedaço", "Punhado", "Pequena", "Média", "Grande"] as const;
const UNIT_GRAMS: Record<string, number> = {
  Gramas: 1,
  Mililitros: 1,
  Unidade: 80,
  "Colher de sopa": 15,
  "Colher de sobremesa": 10,
  "Colher de chá": 5,
  "Colher de café": 2,
  Xícara: 200,
  Copo: 250,
  Concha: 80,
  Fatia: 30,
  Rodela: 15,
  Pedaço: 40,
  Punhado: 20,
  Pequena: 70,
  Média: 100,
  Grande: 130,
  // compat: valores antigos ainda salvos como "g"/"ml"/minúsculos
  g: 1,
  ml: 1,
  unidade: 80,
  "colher de sopa": 15,
  "colher de sobremesa": 10,
  "colher de chá": 5,
  "colher de café": 2,
  xícara: 200,
  copo: 250,
  concha: 80,
  fatia: 30,
  rodela: 15,
  pedaço: 40,
  punhado: 20,
  pequena: 70,
  média: 100,
  grande: 130,
};
function kcalForFood(food: FoodItem, quantity: number, unit: string): number {
  const factor = UNIT_GRAMS[unit] ?? 1;
  const grams = quantity * factor;
  return Math.round((food.kcal * grams) / 100);
}
function gramsForDisplay(quantity: number, unit: string): number {
  return quantity * (UNIT_GRAMS[unit] ?? 1);
}

// ---- TAB: COMPOSIÇÃO CORPORAL ----
function CompositionTab({ clientId, assessments: initial, onRefresh }: { clientId: string; assessments: Assessment[]; onRefresh: () => void }) {
  const { accessToken } = useAuth();
  const [list, setList] = useState<Assessment[]>(initial);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setList(initial), [initial]);

  const metrics: { key: keyof Assessment; label: string }[] = [
    { key: "weightKg", label: "Peso (kg)" },
    { key: "waistCm", label: "Cintura (cm)" },
    { key: "abdomenCm", label: "Abdômen (cm)" },
    { key: "armCm", label: "Braço (cm)" },
    { key: "thighCm", label: "Coxa (cm)" },
    { key: "chestCm", label: "Peitoral (cm)" },
    { key: "muscleMassKg", label: "Massa muscular (kg)" },
    { key: "fatMassKg", label: "Gordura (kg)" },
  ];

  async function save() {
    if (!accessToken) return;
    setSaving(true);
    setError(null);
    const payload: Record<string, number> = {};
    for (const [k, v] of Object.entries(form)) if (v !== "") payload[k] = Number(v);
    if (Object.keys(payload).length === 0) {
      setError("Preencha ao menos uma medida.");
      setSaving(false);
      return;
    }
    try {
      await adminApi.createAssessment(clientId, payload, accessToken);
      setForm({});
      const updated = await adminApi.listAssessments(clientId, accessToken);
      setList(updated);
      onRefresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao salvar avaliação.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-6)" }}>
      <Card style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
        <h3 style={{ margin: 0 }}>Registrar composição corporal</h3>
        <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-body-sm)", margin: 0 }}>Registre as medidas atuais do cliente. O histórico e os gráficos aparecerão abaixo.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "var(--sp-3)" }}>
          {metrics.map((m) => (
            <TextField key={m.key} label={m.label} type="number" value={form[m.key as string] ?? ""} onChange={(e) => setForm({ ...form, [m.key]: e.target.value })} />
          ))}
          <TextField label="Altura (cm)" type="number" value={form.heightCm ?? ""} onChange={(e) => setForm({ ...form, heightCm: e.target.value })} />
        </div>
        {error && <p style={{ color: "var(--danger)", fontSize: "var(--fs-body-sm)", margin: 0 }}>{error}</p>}
        <div>
          <Button onClick={save} disabled={saving}>{saving ? "Salvando…" : "Salvar avaliação"}</Button>
        </div>
      </Card>

      {list.length === 0 ? (
        <Card>
          <p style={{ color: "var(--text-secondary)", margin: 0 }}>Nenhuma avaliação registrada ainda.</p>
        </Card>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "var(--sp-6)" }}>
            {metrics.map((m) => {
              const points = list.filter((a) => (a as any)[m.key] != null).map((a) => ({ label: new Date(a.recordedAt).toLocaleDateString("pt-BR"), value: Number((a as any)[m.key]) }));
              if (points.length === 0) return null;
              return (
                <Card key={m.key as string} style={{ padding: "var(--sp-6)" }}>
                  <h4 style={{ margin: "0 0 var(--sp-4)" }}>{m.label}</h4>
                  <LineChart data={points} />
                </Card>
              );
            })}
          </div>
          <Card style={{ overflowX: "auto" }}>
            <h4 style={{ margin: "0 0 var(--sp-4)" }}>Histórico</h4>
            <div style={{ minWidth: 640 }}>
              <div style={{ display: "grid", gridTemplateColumns: "140px repeat(8, 1fr)", gap: 8, fontSize: "var(--fs-caption)", color: "var(--text-tertiary)", borderBottom: "1px solid var(--border-hairline)", paddingBottom: 8 }}>
                <span>Data</span>
                {metrics.map((m) => (
                  <span key={m.key}>{m.label}</span>
                ))}
              </div>
              {list.slice().reverse().map((a) => (
                <div key={a.id} style={{ display: "grid", gridTemplateColumns: "140px repeat(8, 1fr)", gap: 8, fontSize: "var(--fs-body-sm)", padding: "10px 0", borderBottom: "1px solid var(--border-hairline)" }}>
                  <span>{new Date(a.recordedAt).toLocaleDateString("pt-BR")}</span>
                  {metrics.map((m) => (
                    <span key={m.key}>{(a as any)[m.key] ?? "—"}</span>
                  ))}
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

// ---- TAB: PLANO ALIMENTAR ----
type SubstituteDraft = { tmpId: string; foodId: string; food: FoodItem; quantity: number; unit: string };
type MealItemDraft = { tmpId: string; foodId: string; food: FoodItem; quantity: number; unit: string; notes?: string; substitutes: SubstituteDraft[] };
type MealDraft = { id: string; time: string; name: string; notes?: string; items: MealItemDraft[] };
function defaultMeals(): MealDraft[] {
  return [
    { id: "m1", time: "07:00", name: "Café da manhã", items: [] },
    { id: "m2", time: "10:00", name: "Lanche da manhã", items: [] },
    { id: "m3", time: "12:00", name: "Almoço", items: [] },
    { id: "m4", time: "16:00", name: "Lanche da tarde", items: [] },
    { id: "m5", time: "19:00", name: "Jantar", items: [] },
  ];
}
/** Converte refeições vindas da API (plano, rascunho ou backup local) em drafts do builder. */
function toMealDrafts(src: any[]): MealDraft[] {
  return (src ?? []).map((m: any) => ({
    id: `m-${m.id ?? Date.now()}-${Math.random().toString(36).slice(2)}`,
    time: m.time ?? "",
    name: m.name ?? "",
    notes: m.notes,
    items: (m.items ?? []).map((it: any) => ({
      tmpId: `it-${it.tmpId ?? it.id ?? Date.now()}-${Math.random().toString(36).slice(2)}`,
      foodId: it.foodId ?? it.food?.id,
      food: it.food,
      quantity: it.quantity ?? it.quantityGrams ?? 100,
      unit: it.unit ?? "Gramas",
      notes: it.notes,
      substitutes: (it.substitutes ?? []).map((s: any) => ({
        tmpId: `sub-${s.tmpId ?? s.id ?? Date.now()}-${Math.random().toString(36).slice(2)}`,
        foodId: s.foodId ?? s.food?.id,
        food: s.food,
        quantity: s.quantity ?? 100,
        unit: s.unit ?? "Gramas",
      })),
    })),
  }));
}
function NutritionTab({ clientId, onPublished }: { clientId: string; onPublished: () => void }) {
  const { accessToken } = useAuth();
  const [title, setTitle] = useState(`Plano alimentar — ${new Date().toLocaleDateString("pt-BR")}`);
  const [meals, setMeals] = useState<MealDraft[]>(defaultMeals());
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [results, setResults] = useState<FoodItem[]>([]);
  const [activeMeal, setActiveMeal] = useState<string>("m1");
  const [status, setStatus] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  // Edição de plano já lançado: carrega o histórico no builder e salva in-place.
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  // Biblioteca de Dietas (modelos prontos reutilizáveis como ponto de partida).
  const [templates, setTemplates] = useState<DietTemplate[]>([]);
  const [templateTitle, setTemplateTitle] = useState("");
  const [libraryStatus, setLibraryStatus] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  // Substitutos (estilo Nutrium): alimento clicável abre o modal de "Substitutos".
  const [subModal, setSubModal] = useState<{ mealId: string; tmpId: string } | null>(null);
  const [subSearch, setSubSearch] = useState("");
  const [subResults, setSubResults] = useState<FoodItem[]>([]);
  const [subQty, setSubQty] = useState("100");
  const [subUnit, setSubUnit] = useState<string>("Gramas");
  // Salvamento automático: rascunho no servidor (invisível p/ cliente) + cópia local.
  const [draftId, setDraftId] = useState<string | null>(null);
  const [autosave, setAutosave] = useState<{ saving: boolean; savedAt: number | null; error: string | null }>({ saving: false, savedAt: null, error: null });
  const lastSavedJson = useRef("");
  const readyRef = useRef(false);
  const mealBackupKey = `couthealth:meal-draft:${clientId}`;
  // Observação por alimento (campo expansível) e copiar/colar refeição.
  const [obsOpen, setObsOpen] = useState<Record<string, boolean>>({});
  const [copiedMeal, setCopiedMeal] = useState<{ name: string; items: MealItemDraft[] } | null>(null);

  useEffect(() => {
    foodsApi.categories().then(setCategories);
    refreshTemplates();
    (async () => {
      if (!accessToken) return;
      let hist: any[] = [];
      try {
        hist = await adminApi.listMealPlans(clientId, accessToken);
        setHistory(hist);
      } catch {}
      let draft: any = null;
      try {
        draft = await adminApi.mealPlanDraft(clientId, accessToken);
        if (draft) {
          setDraftId(draft.id);
          lastSavedJson.current = JSON.stringify({ title: draft.title, meals: draft.meals });
        }
      } catch {}
      let backup: any = null;
      try {
        backup = JSON.parse(localStorage.getItem(mealBackupKey) ?? "null");
      } catch {}
      // Restaura edição de plano lançado interrompida (rascunho local).
      if (backup?.kind === "edit" && backup.planId) {
        const plan = hist.find((h) => h.id === backup.planId);
        if (plan && (backup.meals ?? []).length > 0) {
          setTitle(backup.title ?? plan.title ?? "");
          setMeals(toMealDrafts(backup.meals));
          if (backup.meals[0]) setActiveMeal(backup.meals[0].id);
          setEditingPlanId(plan.id);
          setStatus("Edição anterior restaurada do salvamento automático — revise e salve.");
          readyRef.current = true;
          return;
        }
      }
      // Restaura rascunho local mais novo que o do servidor.
      if (backup?.kind === "new" && (backup.meals ?? []).some((m: any) => (m.items ?? []).length > 0)) {
        const draftTime = draft ? new Date(draft.createdAt).getTime() : 0;
        if ((backup.savedAt ?? 0) > draftTime) {
          setTitle(backup.title ?? `Plano alimentar — ${new Date().toLocaleDateString("pt-BR")}`);
          setMeals(toMealDrafts(backup.meals));
          if (backup.meals[0]) setActiveMeal(backup.meals[0].id);
          setStatus("Rascunho anterior restaurado do salvamento automático.");
          readyRef.current = true;
          return;
        }
      }
      if (draft) {
        setTitle(draft.title ?? `Plano alimentar — ${new Date().toLocaleDateString("pt-BR")}`);
        const dm = toMealDrafts(draft.meals ?? []);
        if (dm.length > 0) {
          setMeals(dm);
          setActiveMeal(dm[0].id);
          setStatus("Rascunho em andamento restaurado — continue de onde parou.");
        }
      }
      readyRef.current = true;
    })();
  }, []);
  // Espelho local imediato a cada alteração (protege contra erro/quedas).
  useEffect(() => {
    if (!readyRef.current) return;
    try {
      localStorage.setItem(mealBackupKey, JSON.stringify({ kind: editingPlanId ? "edit" : "new", planId: editingPlanId, title, meals, savedAt: Date.now() }));
    } catch {}
  }, [title, meals, editingPlanId]);
  // Autosave no servidor (debounce 1,5s) — só para nova prescrição; edição de
  // plano lançado usa o rascunho local até o salvamento manual.
  useEffect(() => {
    if (!readyRef.current || editingPlanId || !accessToken) return;
    const payload = buildMealsPayload();
    if (payload.meals.every((m: any) => m.items.length === 0)) return;
    const snapshot = JSON.stringify(payload);
    if (snapshot === lastSavedJson.current) return;
    setAutosave((a) => ({ ...a, saving: true, error: null }));
    const t = setTimeout(async () => {
      try {
        const saved = await adminApi.saveMealPlanDraft(clientId, payload, accessToken);
        setDraftId(saved.id);
        lastSavedJson.current = snapshot;
        setAutosave({ saving: false, savedAt: Date.now(), error: null });
      } catch {
        setAutosave({ saving: false, savedAt: null, error: "Falha no salvamento automático — seu rascunho local está guardado neste navegador." });
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [title, meals, editingPlanId]);
  async function refreshHistory() {
    if (!accessToken) return;
    try {
      setHistory(await adminApi.listMealPlans(clientId, accessToken));
    } catch {}
  }
  async function refreshTemplates() {
    if (!accessToken) return;
    try {
      setTemplates(await dietTemplatesApi.list(accessToken));
    } catch {}
  }
  useEffect(() => {
    if (search.length < 2) return setResults([]);
    foodsApi.list(search, categoryId).then(setResults);
  }, [search, categoryId]);
  useEffect(() => {
    if (!subModal || subSearch.length < 2) return setSubResults([]);
    foodsApi.list(subSearch).then(setSubResults);
  }, [subSearch, subModal]);

  const addMeal = () => {
    const id = `m${Date.now()}`;
    setMeals((prev) => [...prev, { id, time: "20:00", name: "Ceia", items: [] }]);
    setActiveMeal(id);
  };
  const updateMeal = (id: string, patch: Partial<MealDraft>) => setMeals((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  const removeMeal = (id: string) => setMeals((prev) => prev.filter((m) => m.id !== id));
  const moveMeal = (id: string, dir: number) => {
    setMeals((prev) => {
      const idx = prev.findIndex((m) => m.id === id);
      const nxt = [...prev];
      const ni = idx + dir;
      if (ni < 0 || ni >= nxt.length) return prev;
      const [mv] = nxt.splice(idx, 1);
      nxt.splice(ni, 0, mv);
      return nxt;
    });
  };

  const addFoodToMeal = (food: FoodItem) => {
    setMeals((prev) => prev.map((m) => (m.id === activeMeal ? { ...m, items: [...m.items, { tmpId: `${Date.now()}`, foodId: food.id, food, quantity: 100, unit: "Gramas", substitutes: [] }] } : m)));
    setSearch("");
    setResults([]);
  };

  /** Copia os itens de uma refeição para colar em outra (ex.: almoço → janta). */
  const copyMeal = (mealId: string) => {
    const meal = meals.find((m) => m.id === mealId);
    if (!meal || meal.items.length === 0) {
      setStatus("Esta refeição não tem itens para copiar.");
      return;
    }
    setCopiedMeal({ name: meal.name, items: meal.items });
    setStatus(`Itens de "${meal.name}" copiados — abra a refeição destino e clique em Colar.`);
  };
  const pasteMeal = (targetId: string) => {
    if (!copiedMeal) return;
    const stamp = Date.now();
    const clones: MealItemDraft[] = copiedMeal.items.map((it, i) => ({
      ...it,
      tmpId: `it-${stamp}-${i}-${Math.random().toString(36).slice(2)}`,
      substitutes: (it.substitutes ?? []).map((s, j) => ({ ...s, tmpId: `sub-${stamp}-${i}-${j}-${Math.random().toString(36).slice(2)}` })),
    }));
    setMeals((prev) => prev.map((m) => (m.id === targetId ? { ...m, items: [...m.items, ...clones] } : m)));
    setStatus(`${clones.length} itens colados de "${copiedMeal.name}".`);
  };

  function addSubstitute(food: FoodItem) {
    if (!subModal) return;
    const qty = Number(subQty) || 100;
    setMeals((prev) =>
      prev.map((m) =>
        m.id === subModal.mealId
          ? {
              ...m,
              items: m.items.map((it) =>
                it.tmpId === subModal.tmpId
                  ? { ...it, substitutes: [...(it.substitutes ?? []), { tmpId: `${Date.now()}`, foodId: food.id, food, quantity: qty, unit: subUnit }] }
                  : it
              ),
            }
          : m
      )
    );
    setSubSearch("");
    setSubResults([]);
  }

  function removeSubstitute(mealId: string, tmpId: string, subTmpId: string) {
    setMeals((prev) =>
      prev.map((m) => (m.id === mealId ? { ...m, items: m.items.map((it) => (it.tmpId === tmpId ? { ...it, substitutes: (it.substitutes ?? []).filter((s) => s.tmpId !== subTmpId) } : it)) } : m))
    );
  }

  const updateItem = (mealId: string, tmpId: string, patch: any) => {
    setMeals((prev) => prev.map((m) => (m.id === mealId ? { ...m, items: m.items.map((it) => (it.tmpId === tmpId ? { ...it, ...patch } : it)) } : m)));
  };
  const removeItem = (mealId: string, tmpId: string) => setMeals((prev) => prev.map((m) => (m.id === mealId ? { ...m, items: m.items.filter((it) => it.tmpId !== tmpId) } : m)));
  const moveItem = (mealId: string, tmpId: string, dir: number) => {
    setMeals((prev) => prev.map((m) => {
      if (m.id !== mealId) return m;
      const idx = m.items.findIndex((it) => it.tmpId === tmpId);
      const nxt = [...m.items];
      const ni = idx + dir;
      if (ni < 0 || ni >= nxt.length) return m;
      const [mv] = nxt.splice(idx, 1);
      nxt.splice(ni, 0, mv);
      return { ...m, items: nxt };
    }));
  };

  function buildMealsPayload() {
    return {
      title,
      meals: meals.map((m) => ({
        time: m.time,
        name: m.name,
        notes: m.notes,
        items: m.items.map((it) => ({
          foodId: it.foodId,
          quantityGrams: gramsForDisplay(it.quantity, it.unit),
          quantity: it.quantity,
          unit: it.unit,
          notes: it.notes,
          substitutes: (it.substitutes ?? []).map((s) => ({ foodId: s.foodId, quantity: s.quantity, unit: s.unit })),
        })),
      })),
    };
  }

  /** Garante que o rascunho do servidor está atualizado (usado antes de publicar). */
  async function persistMealDraftNow(): Promise<string | null> {
    if (!accessToken || editingPlanId) return null;
    const payload = buildMealsPayload();
    if (payload.meals.every((m: any) => m.items.length === 0)) return draftId;
    const snapshot = JSON.stringify(payload);
    if (snapshot === lastSavedJson.current && draftId) return draftId;
    setAutosave((a) => ({ ...a, saving: true, error: null }));
    const saved = await adminApi.saveMealPlanDraft(clientId, payload, accessToken);
    setDraftId(saved.id);
    lastSavedJson.current = snapshot;
    setAutosave({ saving: false, savedAt: Date.now(), error: null });
    return saved.id;
  }

  function resetMealBuilder() {
    setTitle(`Plano alimentar — ${new Date().toLocaleDateString("pt-BR")}`);
    const dm = defaultMeals();
    setMeals(dm);
    setActiveMeal(dm[0].id);
    setDraftId(null);
    setCopiedMeal(null);
    lastSavedJson.current = "";
  }

  async function publish() {
    if (!accessToken) return;
    if (meals.every((m) => m.items.length === 0)) {
      setStatus("Adicione ao menos um alimento em alguma refeição.");
      return;
    }
    try {
      if (editingPlanId) {
        setStatus("Salvando alterações…");
        await adminApi.updateMealPlan(editingPlanId, buildMealsPayload(), accessToken);
        setStatus("Alterações salvas! Cliente notificado.");
        setEditingPlanId(null);
      } else {
        // Publicação manual: garante o autosave e publica o rascunho.
        setStatus("Salvando e publicando…");
        let planId: string = (await persistMealDraftNow()) ?? "";
        if (!planId) {
          const plan = await adminApi.createMealPlan(clientId, buildMealsPayload(), accessToken);
          planId = plan.id;
        }
        await adminApi.publishMealPlan(planId, accessToken);
        setStatus("Plano publicado! Cliente notificado.");
        resetMealBuilder();
      }
      try {
        localStorage.removeItem(mealBackupKey);
      } catch {}
      refreshHistory();
      onPublished();
    } catch (err) {
      setStatus(err instanceof ApiError ? err.message : "Erro ao publicar.");
    }
  }

  /** Carrega um plano do histórico no builder para editar o conteúdo já lançado. */
  function loadPlanForEdit(plan: any) {
    setTitle(plan.title ?? `Plano alimentar — ${new Date().toLocaleDateString("pt-BR")}`);
    const draftMeals = toMealDrafts(plan.meals ?? []);
    setMeals(draftMeals);
    setEditingPlanId(plan.id);
    if (draftMeals[0]) setActiveMeal(draftMeals[0].id);
    setStatus(`Editando "${plan.title ?? "plano"}". Ajuste e salve as alterações.`);
  }

  function cancelEdit() {
    setEditingPlanId(null);
    setStatus(null);
  }

  /** Remove um plano alimentar já lançado do histórico (com confirmação). */
  async function removePlan(id: string) {
    if (!accessToken) return;
    if (!window.confirm("Remover este plano alimentar lançado? O cliente deixará de vê-lo.")) return;
    try {
      await adminApi.removeMealPlan(id, accessToken);
      if (editingPlanId === id) {
        setEditingPlanId(null);
        setStatus(null);
      } else {
        setStatus("Plano removido.");
      }
      refreshHistory();
      onPublished();
    } catch (err) {
      setStatus(err instanceof ApiError ? err.message : "Erro ao remover plano.");
    }
  }

  /** Salva o conteúdo atual do builder como modelo na Biblioteca de Dietas. */
  async function saveAsTemplate() {
    if (!accessToken) return;
    if (!templateTitle.trim()) {
      setLibraryStatus("Dê um nome ao modelo (ex.: Dieta padrão 1800 kcal).");
      return;
    }
    if (meals.every((m) => m.items.length === 0)) {
      setLibraryStatus("Monte ao menos um item no builder antes de salvar como modelo.");
      return;
    }
    setLibraryStatus("Salvando modelo…");
    try {
      await dietTemplatesApi.create(
        {
          title: templateTitle.trim(),
          content: {
            meals: meals.map((m) => ({
              time: m.time,
              name: m.name,
              notes: m.notes,
              items: m.items.map((it) => ({
                foodId: it.foodId,
                foodSnapshot: { id: it.food.id, name: it.food.name, kcal: it.food.kcal, protein: it.food.protein, carbs: it.food.carbs, fat: it.food.fat, categoryId: it.food.categoryId },
                quantity: it.quantity,
                unit: it.unit,
                notes: it.notes,
                substitutes: (it.substitutes ?? []).map((s) => ({
                  foodId: s.foodId,
                  foodSnapshot: { id: s.food.id, name: s.food.name, kcal: s.food.kcal, protein: s.food.protein, carbs: s.food.carbs, fat: s.food.fat, categoryId: s.food.categoryId },
                  quantity: s.quantity,
                  unit: s.unit,
                })),
              })),
            })),
          },
        },
        accessToken
      );
      setTemplateTitle("");
      setLibraryStatus("Modelo salvo na biblioteca!");
      refreshTemplates();
    } catch (err) {
      setLibraryStatus(err instanceof ApiError ? err.message : "Erro ao salvar modelo.");
    }
  }

  /** Usa um modelo da biblioteca como ponto de partida (personalize antes de publicar). */
  function applyTemplate(tpl: DietTemplate) {
    const tplMeals = tpl.content?.meals ?? [];
    if (tplMeals.length === 0) {
      setLibraryStatus("Este modelo está vazio.");
      return;
    }
    setMeals(
      tplMeals.map((m: any) => ({
        id: `m${Date.now()}-${Math.random().toString(36).slice(2)}`,
        time: m.time ?? "",
        name: m.name ?? "",
        notes: m.notes,
        items: (m.items ?? []).map((it: any) => ({
          tmpId: `it${Date.now()}-${Math.random().toString(36).slice(2)}`,
          foodId: it.foodId,
          food: it.foodSnapshot ?? it.food,
          quantity: it.quantity ?? 100,
          unit: it.unit ?? "Gramas",
          notes: it.notes,
          substitutes: (it.substitutes ?? []).map((s: any) => ({
            tmpId: `sub${Date.now()}-${Math.random().toString(36).slice(2)}`,
            foodId: s.foodId,
            food: s.foodSnapshot ?? s.food,
            quantity: s.quantity ?? 100,
            unit: s.unit ?? "Gramas",
          })),
        })),
      }))
    );
    setEditingPlanId(null);
    setLibraryStatus(`Modelo "${tpl.title}" aplicado. Personalize e publique.`);
  }

  async function removeTemplate(id: string) {
    if (!accessToken) return;
    if (!window.confirm("Excluir este modelo da biblioteca?")) return;
    try {
      await dietTemplatesApi.remove(id, accessToken);
      refreshTemplates();
    } catch (err) {
      setLibraryStatus(err instanceof ApiError ? err.message : "Erro ao excluir modelo.");
    }
  }

  // O histórico exibe só planos publicados — o rascunho do autosave fica no builder.
  const publishedMealHistory = history.filter((h) => h.publishedAt);

  const openPdf = async (plan: any) => {
    if (!accessToken) return;
    setStatus("Gerando PDF…");
    try {
      const [pro, client] = await Promise.all([
        professionalProfileApi.get(accessToken),
        adminApi.clientDetail(clientId, accessToken),
      ]);
      openPdfWindow(plan.title ?? "Plano alimentar", mealPlanPdfHtml(plan, pro, client));
    } catch {
      setStatus("Não foi possível gerar o PDF.");
    } finally {
      setStatus(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-6)" }}>
      <Card style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
        <div style={{ display: "flex", gap: "var(--sp-3)", alignItems: "end", flexWrap: "wrap" }}>
          <TextField label="Título do plano" value={title} onChange={(e) => setTitle(e.target.value)} style={{ flex: 2, minWidth: 240 }} />
          <div style={{ flex: 1, minWidth: 220 }}>
            <label style={{ display: "block", fontSize: "var(--fs-caption)", color: "var(--text-tertiary)", marginBottom: 6 }}>📚 Biblioteca de Dietas</label>
            <select
              value={selectedTemplateId}
              onChange={(e) => {
                const id = e.target.value;
                setSelectedTemplateId(id);
                const tpl = templates.find((t) => t.id === id);
                if (tpl) applyTemplate(tpl);
              }}
              style={{ background: "var(--bg-base)", border: "1px solid var(--border-hairline)", borderRadius: "var(--r-md)", color: "var(--text-primary)", padding: "10px 12px", width: "100%", height: 44 }}
            >
              <option value="">Carregar modelo como base…</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.title} ({(t.content?.meals ?? []).length} refeições)</option>
              ))}
            </select>
          </div>
          <Button onClick={publish} style={{ height: 44 }}>{editingPlanId ? "Salvar alterações" : "Publicar plano"}</Button>
          {editingPlanId && (
            <Button variant="secondary" onClick={cancelEdit} style={{ height: 44 }}>Cancelar edição</Button>
          )}
          <span style={{ fontSize: "var(--fs-body-sm)", color: autosave.error ? "var(--danger)" : "var(--text-tertiary)" }} title="O rascunho é salvo sozinho a cada alteração; a publicação é manual.">
            {editingPlanId
              ? "💾 Rascunho local salvo automaticamente neste navegador"
              : autosave.error
                ? `⚠️ ${autosave.error}`
                : autosave.saving
                  ? "☁️ Salvando rascunho…"
                  : autosave.savedAt
                    ? `☁️ Rascunho salvo às ${new Date(autosave.savedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} — publique quando estiver pronto`
                    : "☁️ Preencha para iniciar o salvamento automático"}
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "end" }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <TextField label="Salvar atual como modelo" value={templateTitle} onChange={(e) => setTemplateTitle(e.target.value)} placeholder="Ex.: Dieta padrão 1800 kcal" />
          </div>
          <Button variant="secondary" onClick={saveAsTemplate} style={{ height: 44 }}>Salvar modelo</Button>
          {selectedTemplateId && (
            <Button variant="secondary" onClick={() => removeTemplate(selectedTemplateId).then(() => setSelectedTemplateId(""))} style={{ height: 44, color: "var(--danger)", borderColor: "var(--danger)" }}>Excluir modelo</Button>
          )}
        </div>
        {editingPlanId && (
          <p style={{ color: "var(--accent)", fontSize: "var(--fs-body-sm)", margin: 0, fontWeight: 600 }}>
            ✏️ Editando plano já lançado — ao salvar, o cliente recebe a versão atualizada.
          </p>
        )}
        {libraryStatus && <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-body-sm)", margin: 0 }}>{libraryStatus}</p>}
        {status && <p style={{ color: status.includes("publicado") || status.includes("salvas") ? "var(--success)" : "var(--text-secondary)", fontSize: "var(--fs-body-sm)", margin: 0 }}>{status}</p>}
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "var(--sp-6)", alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h4 style={{ margin: 0 }}>Refeições</h4>
            <Button variant="secondary" onClick={addMeal} style={{ height: 32, fontSize: "var(--fs-caption)" }}>+ Refeição</Button>
          </div>
          {meals.map((meal) => (
            <button
              key={meal.id}
              onClick={() => setActiveMeal(meal.id)}
              style={{ textAlign: "left", background: activeMeal === meal.id ? "var(--accent)" : "var(--bg-surface)", color: activeMeal === meal.id ? "var(--ink-900)" : "var(--text-primary)", border: "1px solid var(--border-hairline)", borderRadius: "var(--r-md)", padding: "12px 14px", cursor: "pointer", display: "flex", flexDirection: "column", gap: 4 }}
            >
              <span style={{ fontWeight: 700, display: "flex", justifyContent: "space-between" }}>
                {meal.name}
                <span style={{ fontWeight: 400, fontSize: "var(--fs-caption)" }}>{meal.time}</span>
              </span>
              <span style={{ fontSize: "var(--fs-caption)", opacity: 0.7 }}>{meal.items.length} itens</span>
            </button>
          ))}
          {publishedMealHistory.length > 0 && (
            <Card style={{ padding: "var(--sp-4)" }}>
              <h5 style={{ margin: "0 0 8px" }}>Histórico ({publishedMealHistory.length})</h5>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 260, overflow: "auto" }}>
                {publishedMealHistory.map((h) => (
                  <div key={h.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "8px 10px", background: "var(--bg-base)", borderRadius: 8, flexWrap: "wrap" }}>
                    {editingTitleId === h.id ? (
                      <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} style={{ flex: "1 1 100%", background: "var(--bg-surface)", border: "1px solid var(--border-hairline)", color: "var(--text-primary)", borderRadius: 6, padding: "4px 8px" }} />
                    ) : (
                      <span style={{ fontSize: "var(--fs-caption)", flex: "1 1 100%" }}>{h.title ?? `Plano — ${new Date(h.createdAt).toLocaleDateString("pt-BR")}`}</span>
                    )}
                    <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>{new Date(h.createdAt).toLocaleDateString("pt-BR")}</span>
                    {editingTitleId === h.id ? (
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        <button onClick={async () => { if (!accessToken) return; await adminApi.renameMealPlan(h.id, editTitle, accessToken); setEditingTitleId(null); refreshHistory(); }} style={{ fontSize: 11, background: "var(--accent)", border: 0, borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}>Salvar</button>
                        <button onClick={() => setEditingTitleId(null)} style={{ fontSize: 11, background: "transparent", border: "1px solid var(--border-hairline)", color: "var(--text-secondary)", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}>Cancelar</button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        <button onClick={() => loadPlanForEdit(h)} style={{ fontSize: 11, background: editingPlanId === h.id ? "var(--accent)" : "transparent", border: "1px solid var(--border-hairline)", color: editingPlanId === h.id ? "var(--ink-900)" : "var(--text-secondary)", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontWeight: 600 }}>Editar</button>
                        <button onClick={() => { setEditingTitleId(h.id); setEditTitle(h.title ?? ""); }} style={{ fontSize: 11, background: "transparent", border: "1px solid var(--border-hairline)", color: "var(--text-secondary)", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}>Renomear</button>
                        <button onClick={() => openPdf(h)} style={{ fontSize: 11, background: "transparent", border: "1px solid var(--border-hairline)", color: "var(--text-secondary)", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}>PDF</button>
                        <button onClick={() => removePlan(h.id)} style={{ fontSize: 11, background: "transparent", border: "1px solid var(--danger)", color: "var(--danger)", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}>Excluir</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
          {meals
            .filter((m) => m.id === activeMeal)
            .map((meal) => (
              <Card key={meal.id} style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "110px 1fr auto auto", gap: 8, alignItems: "end" }}>
                  <TextField label="Horário" value={meal.time} onChange={(e) => updateMeal(meal.id, { time: e.target.value })} />
                  <TextField label="Nome da refeição" value={meal.name} onChange={(e) => updateMeal(meal.id, { name: e.target.value })} />
                  <Button variant="secondary" onClick={() => moveMeal(meal.id, -1)} style={{ height: 36 }}>↑</Button>
                  <Button variant="secondary" onClick={() => moveMeal(meal.id, 1)} style={{ height: 36 }}>↓</Button>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Button variant="secondary" onClick={() => copyMeal(meal.id)} title="Copia os itens desta refeição para colar em outra">⧉ Copiar itens</Button>
                  {copiedMeal && copiedMeal.items.length > 0 && (
                    <Button variant="secondary" onClick={() => pasteMeal(meal.id)} title={`Cola os ${copiedMeal.items.length} itens copiados de "${copiedMeal.name}" nesta refeição`}>Colar {copiedMeal.items.length} de "{copiedMeal.name}"</Button>
                  )}
                  <Button variant="secondary" onClick={() => removeMeal(meal.id)} style={{ color: "var(--danger)", borderColor: "var(--danger)" }}>Excluir refeição</Button>
                </div>

                <div style={{ background: "var(--bg-base)", borderRadius: "var(--r-md)", padding: "var(--sp-4)", display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <TextField label="Buscar alimento" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ex: Arroz, Frango…" />
                    </div>
                    <div style={{ minWidth: 160 }}>
                      <label style={{ display: "block", fontSize: "var(--fs-caption)", color: "var(--text-tertiary)", marginBottom: 6 }}>Categoria</label>
                      <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={{ background: "var(--bg-base)", border: "1px solid var(--border-hairline)", borderRadius: "var(--r-md)", color: "var(--text-primary)", padding: "10px 12px", width: "100%" }}>
                        <option value="">Todas</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {results.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 160, overflow: "auto", background: "var(--bg-surface)", border: "1px solid var(--border-hairline)", borderRadius: 8, padding: 6 }}>
                      {results.map((food) => (
                        <button key={food.id} type="button" onClick={() => addFoodToMeal(food)} style={{ textAlign: "left", background: "transparent", border: 0, padding: "6px 8px", color: "var(--text-primary)", cursor: "pointer", display: "flex", justifyContent: "space-between" }}>
                          <span>{food.name} <span style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-caption)" }}>{food.category?.name}</span></span>
                          <span style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-caption)" }}>{food.kcal} kcal/100g</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {meal.items.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {meal.items.map((it) => (
                      <div key={it.tmpId} style={{ display: "flex", flexDirection: "column", gap: 6, background: "var(--bg-surface)", border: "1px solid var(--border-hairline)", borderRadius: 8, padding: 10 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 160px auto auto", gap: 8, alignItems: "center" }}>
                          <button
                            type="button"
                            title="Clique para gerenciar substitutos"
                            onClick={() => { setSubModal({ mealId: meal.id, tmpId: it.tmpId }); setSubSearch(""); setSubResults([]); }}
                            style={{ background: "transparent", border: 0, padding: 0, textAlign: "left", cursor: "pointer", fontWeight: 600, fontSize: "var(--fs-body-sm)", color: "var(--text-primary)", textDecoration: "underline", textDecorationStyle: "dotted", textUnderlineOffset: 3 }}
                          >
                            {it.food.name} {(it.substitutes ?? []).length > 0 ? <span style={{ fontSize: 11, color: "var(--accent)", textDecoration: "none" }}>• {it.substitutes.length} subst.</span> : <span style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 400, textDecoration: "none" }}>• + substitutos</span>}
                          </button>
                          <input type="number" value={it.quantity} onChange={(e) => updateItem(meal.id, it.tmpId, { quantity: Number(e.target.value) })} style={{ background: "var(--bg-base)", border: "1px solid var(--border-hairline)", color: "var(--text-primary)", borderRadius: 8, padding: "8px", width: "100%" }} />
                          <select value={it.unit} onChange={(e) => updateItem(meal.id, it.tmpId, { unit: e.target.value })} style={{ background: "var(--bg-base)", border: "1px solid var(--border-hairline)", color: "var(--text-primary)", borderRadius: 8, padding: "8px" }}>
                            {UNITS.map((u) => (
                              <option key={u} value={u}>{u}</option>
                            ))}
                          </select>
                          <span style={{ fontSize: "var(--fs-caption)", color: "var(--accent)", fontWeight: 600, whiteSpace: "nowrap" }}>{kcalForFood(it.food, it.quantity, it.unit)} kcal</span>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button onClick={() => setObsOpen((p) => ({ ...p, [it.tmpId]: !p[it.tmpId] }))} title={it.notes ? "Editar observação" : "Adicionar observação"} style={{ background: it.notes ? "var(--accent)" : "transparent", border: "1px solid var(--border-hairline)", color: it.notes ? "var(--ink-900)" : "var(--text-secondary)", borderRadius: 6, padding: "4px 6px", cursor: "pointer", fontWeight: 700 }}>🗒</button>
                            <button onClick={() => moveItem(meal.id, it.tmpId, -1)} style={{ background: "transparent", border: "1px solid var(--border-hairline)", color: "var(--text-secondary)", borderRadius: 6, padding: "4px 6px", cursor: "pointer" }}>↑</button>
                            <button onClick={() => moveItem(meal.id, it.tmpId, 1)} style={{ background: "transparent", border: "1px solid var(--border-hairline)", color: "var(--text-secondary)", borderRadius: 6, padding: "4px 6px", cursor: "pointer" }}>↓</button>
                            <button onClick={() => removeItem(meal.id, it.tmpId)} style={{ background: "transparent", border: "1px solid var(--danger)", color: "var(--danger)", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}>✕</button>
                          </div>
                        </div>
                        {(obsOpen[it.tmpId] || it.notes) && (
                          <input value={it.notes ?? ""} onChange={(e) => updateItem(meal.id, it.tmpId, { notes: e.target.value })} placeholder="Observação — ex.: sem açúcar, bem passado…" style={{ background: "var(--bg-base)", border: "1px solid var(--border-hairline)", color: "var(--text-primary)", borderRadius: 8, padding: "8px 10px", width: "100%", fontSize: "var(--fs-body-sm)" }} />
                        )}
                        {(it.substitutes ?? []).length > 0 && (
                          <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, paddingLeft: 2 }}>
                            ou {(it.substitutes ?? []).map((s: any) => `${s.quantity} ${String(s.unit ?? "").toLowerCase()} de ${s.food.name}`).join(" ou ")}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-body-sm)", textAlign: "center", margin: 0 }}>Nenhum alimento nesta refeição. Busque acima para adicionar.</p>
                )}
              </Card>
            ))}
        </div>
      </div>

      {subModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setSubModal(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg-surface)", border: "1px solid var(--border-hairline)", borderRadius: 14, padding: 20, width: "100%", maxWidth: 560, maxHeight: "85vh", overflow: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
            <h3 style={{ margin: 0 }}>Substitutos — {meals.flatMap((m) => m.items).find((i) => i.tmpId === subModal.tmpId)?.food.name}</h3>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>Cadastre outros alimentos que o paciente poderá usar no lugar deste item. Aparecem no plano e no PDF como “ou …”.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {(meals.flatMap((m) => (m.id === subModal.mealId ? m.items : [])).find((i) => i.tmpId === subModal.tmpId)?.substitutes ?? []).map((s: any) => (
                <div key={s.tmpId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-base)", borderRadius: 8, padding: "8px 10px", fontSize: 13 }}>
                  <span>{s.quantity} {s.unit} de {s.food.name}</span>
                  <button onClick={() => removeSubstitute(subModal.mealId, subModal.tmpId, s.tmpId)} style={{ background: "transparent", border: "1px solid var(--danger)", color: "var(--danger)", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}>Remover</button>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 140px", gap: 8 }}>
              <TextField label="Buscar substituto" value={subSearch} onChange={(e) => setSubSearch(e.target.value)} placeholder="Ex: Banana, Maçã…" />
              <TextField label="Qtd" type="number" value={subQty} onChange={(e) => setSubQty(e.target.value)} />
              <div>
                <label style={{ display: "block", fontSize: "var(--fs-caption)", color: "var(--text-tertiary)", marginBottom: 6 }}>Unidade</label>
                <select value={subUnit} onChange={(e) => setSubUnit(e.target.value)} style={{ background: "var(--bg-base)", border: "1px solid var(--border-hairline)", borderRadius: "var(--r-md)", color: "var(--text-primary)", padding: "10px 12px", width: "100%" }}>
                  {UNITS.map((u) => (<option key={u} value={u}>{u}</option>))}
                </select>
              </div>
            </div>
            {subResults.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 180, overflow: "auto", background: "var(--bg-base)", border: "1px solid var(--border-hairline)", borderRadius: 8, padding: 6 }}>
                {subResults.map((food) => (
                  <button key={food.id} type="button" onClick={() => addSubstitute(food)} style={{ textAlign: "left", background: "transparent", border: 0, padding: "6px 8px", color: "var(--text-primary)", cursor: "pointer", display: "flex", justifyContent: "space-between" }}>
                    <span>{food.name}</span><span style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-caption)" }}>{food.kcal} kcal/100g</span>
                  </button>
                ))}
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button onClick={() => setSubModal(null)}>Concluir</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- TAB: PLANO DE TREINO ----
type WorkoutExerciseDraft = { tmpId: string; exerciseId: string; exercise: ExerciseItem; sets: number; reps: string; load: string; restSeconds: string; notes: string };
/** Converte exercícios vindos da API (treino, rascunho ou backup local) em drafts do builder. */
function toWorkoutDrafts(src: any[]): WorkoutExerciseDraft[] {
  return (src ?? []).map((ex: any) => ({
    tmpId: `ex-${ex.tmpId ?? ex.id ?? Date.now()}-${Math.random().toString(36).slice(2)}`,
    exerciseId: ex.exerciseId ?? ex.exercise?.id,
    exercise: ex.exerciseSnapshot ?? ex.exercise,
    sets: ex.sets ?? 3,
    reps: ex.reps ?? "12",
    load: ex.load ?? "",
    restSeconds: ex.restSeconds != null ? String(ex.restSeconds) : "60",
    notes: ex.notes ?? "",
  }));
}
function TrainingTab({ clientId, onPublished }: { clientId: string; onPublished: () => void }) {
  const { accessToken } = useAuth();
  const [letter, setLetter] = useState("A");
  const [exercises, setExercises] = useState<WorkoutExerciseDraft[]>([]);
  const [search, setSearch] = useState("");
  const [muscleGroupId, setMuscleGroupId] = useState("");
  const [groups, setGroups] = useState<MuscleGroup[]>([]);
  const [results, setResults] = useState<ExerciseItem[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [activeLetterView, setActiveLetterView] = useState<string | null>(null);
  // Edição de treino já lançado: carrega o histórico no builder e salva in-place.
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);
  // Biblioteca de Treinos (modelos prontos reutilizáveis como ponto de partida).
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [templateTitle, setTemplateTitle] = useState("");
  const [libraryStatus, setLibraryStatus] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  // Salvamento automático: rascunho no servidor (invisível p/ cliente) + cópia local.
  const [workoutDraftId, setWorkoutDraftId] = useState<string | null>(null);
  const [autosave, setAutosave] = useState<{ saving: boolean; savedAt: number | null; error: string | null }>({ saving: false, savedAt: null, error: null });
  const lastSavedJson = useRef("");
  const readyRef = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const workoutBackupKey = (l: string) => `couthealth:workout-draft:${clientId}:${l}`;

  useEffect(() => {
    exercisesApi.muscleGroups().then(setGroups);
    refreshTemplates();
    (async () => {
      if (!accessToken) return;
      let hist: any[] = [];
      try {
        hist = await adminApi.listWorkouts(clientId, accessToken);
        setHistory(hist);
      } catch {}
      await loadLetterDraft("A", hist);
      readyRef.current = true;
    })();
  }, []);
  /** Carrega builder da letra: backup local mais novo > rascunho do servidor > vazio. */
  async function loadLetterDraft(l: string, hist?: any[]) {
    if (!accessToken) return;
    const list = hist ?? history;
    let draft: any = null;
    try {
      draft = await adminApi.workoutDraft(clientId, l, accessToken);
    } catch {}
    let backup: any = null;
    try {
      backup = JSON.parse(localStorage.getItem(workoutBackupKey(l)) ?? "null");
    } catch {}
    if (backup?.kind === "edit" && backup.workoutId) {
      const w = list.find((x: any) => x.id === backup.workoutId);
      if (w && (backup.exercises ?? []).length > 0) {
        setLetter(w.letter ?? l);
        setExercises(toWorkoutDrafts(backup.exercises));
        setEditingWorkoutId(w.id);
        setStatus("Edição anterior restaurada do salvamento automático — revise e salve.");
        return;
      }
    }
    if (backup?.kind === "new" && (backup.exercises ?? []).length > 0) {
      const draftTime = draft ? new Date(draft.createdAt).getTime() : 0;
      if ((backup.savedAt ?? 0) > draftTime) {
        setExercises(toWorkoutDrafts(backup.exercises));
        setStatus("Rascunho anterior restaurado do salvamento automático.");
        return;
      }
    }
    if (draft) {
      setWorkoutDraftId(draft.id);
      lastSavedJson.current = JSON.stringify({ letter: l, exercises: draft.exercises });
      const dx = toWorkoutDrafts(draft.exercises ?? []);
      if (dx.length > 0) {
        setExercises(dx);
        setStatus(`Rascunho do Treino ${l} restaurado — continue de onde parou.`);
        return;
      }
    }
    setExercises([]);
  }
  // Espelho local imediato a cada alteração (protege contra erro/quedas).
  useEffect(() => {
    if (!readyRef.current) return;
    try {
      localStorage.setItem(workoutBackupKey(letter), JSON.stringify({ kind: editingWorkoutId ? "edit" : "new", workoutId: editingWorkoutId, letter, exercises, savedAt: Date.now() }));
    } catch {}
  }, [letter, exercises, editingWorkoutId]);
  // Autosave no servidor (debounce 1,5s) — só para nova prescrição.
  useEffect(() => {
    if (!readyRef.current || editingWorkoutId || !accessToken) return;
    if (exercises.length === 0) return;
    const snapshot = JSON.stringify({ letter, exercises: buildExercisesPayload() });
    if (snapshot === lastSavedJson.current) return;
    setAutosave((a) => ({ ...a, saving: true, error: null }));
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        const saved = await adminApi.saveWorkoutDraft(clientId, JSON.parse(snapshot), accessToken);
        setWorkoutDraftId(saved.id);
        lastSavedJson.current = snapshot;
        setAutosave({ saving: false, savedAt: Date.now(), error: null });
      } catch {
        setAutosave({ saving: false, savedAt: null, error: "Falha no salvamento automático — seu rascunho local está guardado neste navegador." });
      }
    }, 1500);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [letter, exercises, editingWorkoutId]);
  async function refreshHistory() {
    if (!accessToken) return;
    try {
      setHistory(await adminApi.listWorkouts(clientId, accessToken));
    } catch {}
  }
  async function refreshTemplates() {
    if (!accessToken) return;
    try {
      setTemplates(await workoutTemplatesApi.list(accessToken));
    } catch {}
  }
  useEffect(() => {
    if (search.length < 2) return setResults([]);
    exercisesApi.list(search, muscleGroupId).then(setResults);
  }, [search, muscleGroupId]);

  const letters = ["A", "B", "C", "D", "E"];

  function buildExercisesPayload() {
    return exercises.map((e, i) => ({ exerciseId: e.exerciseId, sets: e.sets, reps: e.reps, load: e.load, restSeconds: e.restSeconds ? Number(e.restSeconds) : undefined, notes: e.notes, order: i }));
  }

  /** Garante que o rascunho do servidor está atualizado (usado antes de publicar/trocar de letra). */
  async function persistWorkoutDraftNow(letterArg = letter, exercisesArg = exercises): Promise<string | null> {
    if (!accessToken || editingWorkoutId || exercisesArg.length === 0) return workoutDraftId;
    const payload = { letter: letterArg, exercises: exercisesArg.map((e, i) => ({ exerciseId: e.exerciseId, sets: e.sets, reps: e.reps, load: e.load, restSeconds: e.restSeconds ? Number(e.restSeconds) : undefined, notes: e.notes, order: i })) };
    const snapshot = JSON.stringify(payload);
    if (snapshot === lastSavedJson.current && workoutDraftId) return workoutDraftId;
    setAutosave((a) => ({ ...a, saving: true, error: null }));
    const saved = await adminApi.saveWorkoutDraft(clientId, payload, accessToken);
    setWorkoutDraftId(saved.id);
    lastSavedJson.current = snapshot;
    setAutosave({ saving: false, savedAt: Date.now(), error: null });
    return saved.id;
  }

  /** Troca de letra com flush do rascunho atual antes de carregar o destino. */
  async function switchLetter(l: string) {
    if (l === letter) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    try {
      await persistWorkoutDraftNow();
    } catch {}
    setWorkoutDraftId(null);
    lastSavedJson.current = "";
    setEditingWorkoutId(null);
    setStatus(null);
    setLetter(l);
    setActiveLetterView(null);
    await loadLetterDraft(l);
  }

  async function publish() {
    if (!accessToken || exercises.length === 0) {
      setStatus("Adicione ao menos um exercício.");
      return;
    }
    try {
      if (editingWorkoutId) {
        setStatus("Salvando alterações…");
        await adminApi.updateWorkout(editingWorkoutId, { letter, exercises: buildExercisesPayload() }, accessToken);
        setStatus(`Alterações do Treino ${letter} salvas! Cliente notificado.`);
        setEditingWorkoutId(null);
      } else {
        // Publicação manual: garante o autosave e publica o rascunho.
        setStatus("Salvando e publicando…");
        let workoutId: string = (await persistWorkoutDraftNow()) ?? "";
        if (!workoutId) {
          const workout = await adminApi.createWorkout(clientId, { letter, exercises: buildExercisesPayload() }, accessToken);
          workoutId = workout.id;
        }
        await adminApi.publishWorkout(workoutId, accessToken);
        setStatus(`Treino ${letter} publicado!`);
        setWorkoutDraftId(null);
        lastSavedJson.current = "";
      }
      setExercises([]);
      try {
        localStorage.removeItem(workoutBackupKey(letter));
      } catch {}
      refreshHistory();
      onPublished();
    } catch (err) {
      setStatus(err instanceof ApiError ? err.message : "Erro ao publicar.");
    }
  }

  /** Carrega um treino do histórico no builder para editar o conteúdo já lançado. */
  function loadWorkoutForEdit(w: any) {
    setLetter(w.letter ?? "A");
    setExercises(toWorkoutDrafts(w.exercises ?? []));
    setEditingWorkoutId(w.id);
    setStatus(`Editando "${w.title ?? `Treino ${w.letter}`} ". Ajuste e salve as alterações.`);
  }

  function cancelEdit() {
    setEditingWorkoutId(null);
    setExercises([]);
    setStatus(null);
  }

  /** Remove um treino já lançado do histórico (com confirmação). */
  async function removeLaunchedWorkout(id: string) {
    if (!accessToken) return;
    if (!window.confirm("Remover este treino lançado? O cliente deixará de vê-lo.")) return;
    try {
      await adminApi.removeWorkout(id, accessToken);
      if (editingWorkoutId === id) {
        setEditingWorkoutId(null);
        setExercises([]);
        setStatus(null);
      } else {
        setStatus("Treino removido.");
      }
      refreshHistory();
      onPublished();
    } catch (err) {
      setStatus(err instanceof ApiError ? err.message : "Erro ao remover treino.");
    }
  }

  /** Salva o conteúdo atual do builder como modelo na Biblioteca de Treinos. */
  async function saveAsTemplate() {
    if (!accessToken) return;
    if (!templateTitle.trim()) {
      setLibraryStatus("Dê um nome ao modelo (ex.: Treino A padrão — hipertrofia).");
      return;
    }
    if (exercises.length === 0) {
      setLibraryStatus("Monte ao menos um exercício no builder antes de salvar como modelo.");
      return;
    }
    setLibraryStatus("Salvando modelo…");
    try {
      await workoutTemplatesApi.create(
        {
          title: templateTitle.trim(),
          letter,
          content: {
            exercises: exercises.map((e) => ({
              exerciseId: e.exerciseId,
              exerciseSnapshot: { id: e.exercise.id, name: e.exercise.name, muscleGroupId: e.exercise.muscleGroupId },
              sets: e.sets,
              reps: e.reps,
              load: e.load,
              restSeconds: e.restSeconds,
              notes: e.notes,
            })),
          },
        },
        accessToken
      );
      setTemplateTitle("");
      setLibraryStatus("Modelo salvo na biblioteca!");
      refreshTemplates();
    } catch (err) {
      setLibraryStatus(err instanceof ApiError ? err.message : "Erro ao salvar modelo.");
    }
  }

  /** Usa um modelo da biblioteca como ponto de partida (personalize antes de publicar). */
  function applyTemplate(tpl: WorkoutTemplate) {
    const tplExercises = tpl.content?.exercises ?? [];
    if (tplExercises.length === 0) {
      setLibraryStatus("Este modelo está vazio.");
      return;
    }
    setLetter(tpl.letter ?? "A");
    setExercises(
      tplExercises.map((ex: any) => ({
        tmpId: `ex${Date.now()}-${Math.random().toString(36).slice(2)}`,
        exerciseId: ex.exerciseId,
        exercise: ex.exerciseSnapshot ?? ex.exercise,
        sets: ex.sets ?? 3,
        reps: ex.reps ?? "12",
        load: ex.load ?? "",
        restSeconds: ex.restSeconds != null ? String(ex.restSeconds) : "60",
        notes: ex.notes ?? "",
      }))
    );
    setEditingWorkoutId(null);
    setLibraryStatus(`Modelo "${tpl.title}" aplicado. Personalize e publique.`);
  }

  async function removeTemplate(id: string) {
    if (!accessToken) return;
    if (!window.confirm("Excluir este modelo da biblioteca?")) return;
    try {
      await workoutTemplatesApi.remove(id, accessToken);
      refreshTemplates();
    } catch (err) {
      setLibraryStatus(err instanceof ApiError ? err.message : "Erro ao excluir modelo.");
    }
  }

  const openPdf = async (w: any) => {
    if (!accessToken) return;
    setStatus("Gerando PDF…");
    try {
      const [pro, client] = await Promise.all([
        professionalProfileApi.get(accessToken),
        adminApi.clientDetail(clientId, accessToken),
      ]);
      openPdfWindow(w.title ?? `Treino ${w.letter}`, workoutPdfHtml(w, pro, client));
    } catch {
      setStatus("Não foi possível gerar o PDF.");
    } finally {
      setStatus(null);
    }
  };

  // O histórico exibe só treinos publicados — o rascunho do autosave fica no builder.
  const publishedWorkoutHistory = history.filter((w: any) => w.publishedAt);
  const grouped = useMemo(() => {
    const g: Record<string, any[]> = {};
    for (const w of publishedWorkoutHistory) {
      const k = w.letter;
      if (!g[k]) g[k] = [];
      g[k].push(w);
    }
    return g;
  }, [publishedWorkoutHistory]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-6)" }}>
      <Card style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "end" }}>
          <div>
            <label style={{ display: "block", fontSize: "var(--fs-caption)", color: "var(--text-tertiary)", marginBottom: 6 }}>Treino</label>
            <div style={{ display: "flex", gap: 6 }}>
              {letters.map((l) => (
                <button key={l} onClick={() => switchLetter(l)} style={{ width: 44, height: 44, borderRadius: 10, border: "1px solid var(--border-hairline)", background: letter === l ? "var(--accent)" : "var(--bg-surface)", color: letter === l ? "var(--ink-900)" : "var(--text-primary)", fontWeight: 700, cursor: "pointer" }}>{l}</button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label style={{ display: "block", fontSize: "var(--fs-caption)", color: "var(--text-tertiary)", marginBottom: 6 }}>📚 Biblioteca de Treinos</label>
            <select
              value={selectedTemplateId}
              onChange={(e) => {
                const id = e.target.value;
                setSelectedTemplateId(id);
                const tpl = templates.find((t) => t.id === id);
                if (tpl) applyTemplate(tpl);
              }}
              style={{ background: "var(--bg-base)", border: "1px solid var(--border-hairline)", borderRadius: "var(--r-md)", color: "var(--text-primary)", padding: "10px 12px", width: "100%", height: 44 }}
            >
              <option value="">Carregar modelo como base…</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.title} ({t.letter}) — {(t.content?.exercises ?? []).length} ex.</option>
              ))}
            </select>
          </div>
          <Button onClick={publish} style={{ height: 44 }}>{editingWorkoutId ? `Salvar alterações (${letter})` : `Publicar Treino ${letter}`}</Button>
          {editingWorkoutId && (
            <Button variant="secondary" onClick={cancelEdit} style={{ height: 44 }}>Cancelar edição</Button>
          )}
          {status && <span style={{ color: status.includes("publicado") || status.includes("salvas") ? "var(--success)" : "var(--danger)", fontSize: "var(--fs-body-sm)" }}>{status}</span>}
          <span style={{ fontSize: "var(--fs-body-sm)", color: autosave.error ? "var(--danger)" : "var(--text-tertiary)" }} title="O rascunho é salvo sozinho a cada alteração; a publicação é manual.">
            {editingWorkoutId
              ? "💾 Rascunho local salvo automaticamente neste navegador"
              : autosave.error
                ? `⚠️ ${autosave.error}`
                : autosave.saving
                  ? "☁️ Salvando rascunho…"
                  : autosave.savedAt
                    ? `☁️ Rascunho salvo às ${new Date(autosave.savedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} — publique quando estiver pronto`
                    : "☁️ Preencha para iniciar o salvamento automático"}
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "end" }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <TextField label="Salvar atual como modelo" value={templateTitle} onChange={(e) => setTemplateTitle(e.target.value)} placeholder="Ex.: Treino A padrão — hipertrofia" />
          </div>
          <Button variant="secondary" onClick={saveAsTemplate} style={{ height: 44 }}>Salvar modelo</Button>
          {selectedTemplateId && (
            <Button variant="secondary" onClick={() => removeTemplate(selectedTemplateId).then(() => setSelectedTemplateId(""))} style={{ height: 44, color: "var(--danger)", borderColor: "var(--danger)" }}>Excluir modelo</Button>
          )}
        </div>
        {libraryStatus && <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-body-sm)", margin: 0 }}>{libraryStatus}</p>}
        {editingWorkoutId && (
          <p style={{ color: "var(--accent)", fontSize: "var(--fs-body-sm)", margin: 0, fontWeight: 600 }}>
            ✏️ Editando treino já lançado — ao salvar, o cliente recebe a versão atualizada.
          </p>
        )}
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: "var(--sp-6)", alignItems: "start" }}>
        <Card style={{ padding: "var(--sp-4)" }}>
          <h5 style={{ margin: "0 0 8px" }}>Histórico por Treino</h5>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            {letters.map((l) => (
              <button key={l} onClick={() => setActiveLetterView(activeLetterView === l ? null : l)} style={{ padding: "6px 12px", borderRadius: 999, border: "1px solid var(--border-hairline)", background: (activeLetterView ?? letter) === l ? "var(--accent)" : "transparent", color: (activeLetterView ?? letter) === l ? "var(--ink-900)" : "var(--text-secondary)", fontWeight: 700, cursor: "pointer" }}>{l}</button>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 380, overflow: "auto" }}>
            {(grouped[activeLetterView ?? letter] ?? []).map((w: any) => (
              <div key={w.id} style={{ padding: "8px 10px", background: "var(--bg-base)", borderRadius: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                {editingId === w.id ? (
                  <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} style={{ background: "var(--bg-surface)", border: "1px solid var(--border-hairline)", color: "var(--text-primary)", borderRadius: 6, padding: "4px 8px", fontSize: "var(--fs-caption)" }} />
                ) : (
                  <span style={{ fontWeight: 600, fontSize: "var(--fs-caption)" }}>{w.title ?? `Treino ${w.letter} — ${new Date(w.createdAt).toLocaleDateString("pt-BR")}`}</span>
                )}
                <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{w.exercises?.length ?? 0} exercícios • {new Date(w.createdAt).toLocaleDateString("pt-BR")}</span>
                {editingId === w.id ? (
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    <button onClick={async () => { if (!accessToken) return; await adminApi.renameWorkout(w.id, editTitle, accessToken); setEditingId(null); refreshHistory(); }} style={{ fontSize: 11, background: "var(--accent)", border: 0, borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}>Salvar</button>
                    <button onClick={() => setEditingId(null)} style={{ fontSize: 11, background: "transparent", border: "1px solid var(--border-hairline)", color: "var(--text-secondary)", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}>Cancelar</button>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    <button onClick={() => loadWorkoutForEdit(w)} style={{ fontSize: 11, background: editingWorkoutId === w.id ? "var(--accent)" : "transparent", border: "1px solid var(--border-hairline)", color: editingWorkoutId === w.id ? "var(--ink-900)" : "var(--text-secondary)", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontWeight: 600 }}>Editar</button>
                    <button onClick={() => { setEditingId(w.id); setEditTitle(w.title ?? ""); }} style={{ fontSize: 11, background: "transparent", border: "1px solid var(--border-hairline)", color: "var(--text-secondary)", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}>Renomear</button>
                    <button onClick={() => openPdf(w)} style={{ fontSize: 11, background: "transparent", border: "1px solid var(--border-hairline)", color: "var(--text-secondary)", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}>PDF</button>
                    <button onClick={() => removeLaunchedWorkout(w.id)} style={{ fontSize: 11, background: "transparent", border: "1px solid var(--danger)", color: "var(--danger)", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}>Excluir</button>
                  </div>
                )}
              </div>
            ))}
            {(grouped[activeLetterView ?? letter] ?? []).length === 0 && <p style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-caption)", margin: 0 }}>Nenhum treino {activeLetterView ?? letter} ainda.</p>}
          </div>
        </Card>

        <Card style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
          <h3 style={{ margin: 0 }}>Exercícios — Treino {letter}</h3>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <TextField label="Buscar exercício" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ex: Supino, Agachamento…" />
            </div>
            <div style={{ minWidth: 150 }}>
              <label style={{ display: "block", fontSize: "var(--fs-caption)", color: "var(--text-tertiary)", marginBottom: 6 }}>Grupo muscular</label>
              <select value={muscleGroupId} onChange={(e) => setMuscleGroupId(e.target.value)} style={{ background: "var(--bg-base)", border: "1px solid var(--border-hairline)", borderRadius: "var(--r-md)", color: "var(--text-primary)", padding: "10px 12px", width: "100%" }}>
                <option value="">Todos</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>
          {results.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 160, overflow: "auto", background: "var(--bg-surface)", border: "1px solid var(--border-hairline)", borderRadius: 8, padding: 6 }}>
              {results.map((ex) => (
                <button key={ex.id} type="button" onClick={() => { setExercises((prev) => [...prev, { tmpId: `${Date.now()}`, exerciseId: ex.id, exercise: ex, sets: 3, reps: "12", load: "", restSeconds: "60", notes: "" }]); setSearch(""); setResults([]); }} style={{ textAlign: "left", background: "transparent", border: 0, padding: "6px 8px", color: "var(--text-primary)", cursor: "pointer", display: "flex", justifyContent: "space-between" }}>
                  <span>{ex.name}</span><span style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-caption)" }}>{ex.muscleGroup?.name}</span>
                </button>
              ))}
            </div>
          )}
          {exercises.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {exercises.map((ex, idx) => (
                <div key={ex.tmpId} style={{ display: "grid", gridTemplateColumns: "1fr 60px 80px 100px 80px 1fr auto", gap: 6, alignItems: "center", background: "var(--bg-surface)", border: "1px solid var(--border-hairline)", borderRadius: 8, padding: 10 }}>
                  <span style={{ fontWeight: 600, fontSize: "var(--fs-body-sm)" }}>{idx + 1}. {ex.exercise.name}</span>
                  <input placeholder="Séries" type="number" value={ex.sets} onChange={(e) => setExercises((prev) => prev.map((x) => (x.tmpId === ex.tmpId ? { ...x, sets: Number(e.target.value) } : x)))} style={{ background: "var(--bg-base)", border: "1px solid var(--border-hairline)", color: "var(--text-primary)", borderRadius: 6, padding: "6px", width: "100%" }} />
                  <input placeholder="Reps" value={ex.reps} onChange={(e) => setExercises((prev) => prev.map((x) => (x.tmpId === ex.tmpId ? { ...x, reps: e.target.value } : x)))} style={{ background: "var(--bg-base)", border: "1px solid var(--border-hairline)", color: "var(--text-primary)", borderRadius: 6, padding: "6px", width: "100%" }} />
                  <input placeholder="Carga" value={ex.load} onChange={(e) => setExercises((prev) => prev.map((x) => (x.tmpId === ex.tmpId ? { ...x, load: e.target.value } : x)))} style={{ background: "var(--bg-base)", border: "1px solid var(--border-hairline)", color: "var(--text-primary)", borderRadius: 6, padding: "6px", width: "100%" }} />
                  <input placeholder="Int (s)" value={ex.restSeconds} onChange={(e) => setExercises((prev) => prev.map((x) => (x.tmpId === ex.tmpId ? { ...x, restSeconds: e.target.value } : x)))} style={{ background: "var(--bg-base)", border: "1px solid var(--border-hairline)", color: "var(--text-primary)", borderRadius: 6, padding: "6px", width: "100%" }} />
                  <input placeholder="Obs" value={ex.notes} onChange={(e) => setExercises((prev) => prev.map((x) => (x.tmpId === ex.tmpId ? { ...x, notes: e.target.value } : x)))} style={{ background: "var(--bg-base)", border: "1px solid var(--border-hairline)", color: "var(--text-primary)", borderRadius: 6, padding: "6px", width: "100%" }} />
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => setExercises((prev) => { const i = prev.findIndex((x) => x.tmpId === ex.tmpId); if (i <= 0) return prev; const nxt = [...prev]; const [mv] = nxt.splice(i, 1); nxt.splice(i - 1, 0, mv); return nxt; })} style={{ border: "1px solid var(--border-hairline)", background: "transparent", color: "var(--text-secondary)", borderRadius: 6, padding: "4px 6px", cursor: "pointer" }}>↑</button>
                    <button onClick={() => setExercises((prev) => { const i = prev.findIndex((x) => x.tmpId === ex.tmpId); if (i >= prev.length - 1) return prev; const nxt = [...prev]; const [mv] = nxt.splice(i, 1); nxt.splice(i + 1, 0, mv); return nxt; })} style={{ border: "1px solid var(--border-hairline)", background: "transparent", color: "var(--text-secondary)", borderRadius: 6, padding: "4px 6px", cursor: "pointer" }}>↓</button>
                    <button onClick={() => setExercises((prev) => prev.filter((x) => x.tmpId !== ex.tmpId))} style={{ border: "1px solid var(--danger)", background: "transparent", color: "var(--danger)", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-body-sm)", textAlign: "center" }}>Nenhum exercício. Busque acima para adicionar.</p>
          )}
        </Card>
      </div>
    </div>
  );
}

// ---- MAIN PAGE WITH TABS ----
type TabKey = "anamnesis" | "composition" | "nutrition" | "training";
const TABS: { key: TabKey; label: string }[] = [
  { key: "anamnesis", label: "Anamnese" },
  { key: "composition", label: "Composição corporal" },
  { key: "nutrition", label: "Plano alimentar" },
  { key: "training", label: "Plano de treino" },
];

export function AdminClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { accessToken } = useAuth();
  const [client, setClient] = useState<any>(null);

  const activeTab = (searchParams.get("tab") as TabKey) ?? "anamnesis";
  const setTab = (k: TabKey) => setSearchParams({ tab: k }, { replace: true });

  const load = () => {
    if (!accessToken || !id) return;
    adminApi.clientDetail(id, accessToken).then(setClient);
  };
  useEffect(() => {
    load();
  }, [accessToken, id]);

  if (!client || !id) {
    return (
      <AdminLayout title="Cliente">
        <p style={{ color: "var(--text-secondary)" }}>Carregando…</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title={
        <span>
          {client.name}
          <span style={{ display: "block", fontFamily: "var(--font-body)", fontWeight: 400, fontSize: "var(--fs-caption)", color: "var(--text-tertiary)" }}>
            {client.email} • {client.subscriptions?.[0]?.plan?.name ?? "Sem plano"} • {client.anamnesis?.status ?? "RASCUNHO"}
          </span>
        </span>
      }
    >
      <div style={{ display: "flex", gap: 8, borderBottom: "1px solid var(--border-hairline)", margin: "-8px -8px 0", padding: "0 var(--sp-6) 0", overflowX: "auto", position: "sticky", top: 0, background: "var(--bg-base)", zIndex: 5 }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              background: "transparent",
              border: 0,
              borderBottom: `3px solid ${activeTab === t.key ? "var(--accent)" : "transparent"}`,
              color: activeTab === t.key ? "var(--text-primary)" : "var(--text-secondary)",
              fontWeight: activeTab === t.key ? 700 : 500,
              fontSize: "var(--fs-body-sm)",
              padding: "14px 16px",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ marginTop: "var(--sp-6)" }}>
        {activeTab === "anamnesis" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-6)" }}>
            <Card>
              <h3 style={{ marginTop: 0 }}>Anamnese</h3>
              <AnamnesisSummary anamnesis={client.anamnesis ?? {}} />
            </Card>
            <AiSummaryPanel clientId={id} />
            <MessagesPanel clientId={id} />
          </div>
        )}
        {activeTab === "composition" && <CompositionTab clientId={id} assessments={client.assessments ?? []} onRefresh={load} />}
        {activeTab === "nutrition" && <NutritionTab clientId={id} onPublished={load} />}
        {activeTab === "training" && <TrainingTab clientId={id} onPublished={load} />}
      </div>
    </AdminLayout>
  );
}
