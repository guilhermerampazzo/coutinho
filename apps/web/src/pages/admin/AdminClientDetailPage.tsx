import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button, Card, TextField } from "@couthealth/ui";
import { adminApi, foodsApi, exercisesApi, ApiError, type FoodItem, type ExerciseItem } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { AdminLayout } from "./AdminLayout";

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

function AnamnesisSummary({ anamnesis }: { anamnesis: Record<string, any> }) {
  const entries = Object.entries(anamnesisLabels).filter(([key]) => anamnesis?.[key] !== null && anamnesis?.[key] !== undefined);
  if (entries.length === 0) return <p style={{ color: "var(--text-secondary)" }}>Anamnese ainda não preenchida.</p>;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "var(--sp-4)" }}>
      {/* entries vem de Object.entries(anamnesisLabels) → [key, label]; o VALOR exibido
          é anamnesis[key] (dado do cliente), não o label (bug corrigido 2026-08-13). */}
      {entries.map(([key]) => (
        <div key={key}>
          <p style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-caption)", margin: 0 }}>{anamnesisLabels[key]}</p>
          <p style={{ margin: "2px 0 0" }}>{prettyAnamnesisValue(anamnesis[key])}</p>
        </div>
      ))}
    </div>
  );
}

/** Traduz enums/booleans para leitura humana no admin (mesmo dicionário do resumo IA). */
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

/** Avaliação física registrada pelo cliente na anamnese (etapa 6) ou na Evolução. */
function AssessmentSummary({ assessments }: { assessments?: any[] }) {
  const latest = assessments?.slice(-1)?.[0];
  if (!latest) {
    return <p style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-body-sm)", margin: 0 }}>Sem avaliação física registrada.</p>;
  }
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

/** Resumo inteligente da anamnese — a IA organiza/sintetiza; as decisões são do profissional. */
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
                  <li key={i} style={{ fontSize: "var(--fs-body-sm)", color: "var(--text-primary)" }}>
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

          <div style={{ display: "flex", gap: "var(--sp-2)", flexWrap: "wrap" }}>
            <Button variant="secondary" onClick={generate} disabled={loading} style={{ height: 34, fontSize: "var(--fs-caption)" }}>
              Regenerar
            </Button>
          </div>
          <p style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-caption)", margin: 0 }}>
            A IA apenas organiza e resume as respostas — as decisões clínicas são suas. Confira sempre a anamnese original acima.
          </p>
        </>
      )}
    </Card>
  );
}

function MealPlanBuilder({ clientId }: { clientId: string }) {
  const { accessToken } = useAuth();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<FoodItem[]>([]);
  const [items, setItems] = useState<{ foodId: string; name: string; quantityGrams: number }[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (search.length < 2) return setResults([]);
    foodsApi.list(search).then(setResults);
  }, [search]);

  async function publish() {
    if (!accessToken || items.length === 0) return;
    setStatus("Publicando…");
    const mealPlan = await adminApi.createMealPlan(
      clientId,
      { meals: [{ time: "08:00", name: "Refeição", items: items.map((i) => ({ foodId: i.foodId, quantityGrams: i.quantityGrams })) }] },
      accessToken
    );
    await adminApi.publishMealPlan(mealPlan.id, accessToken);
    setStatus("Plano publicado! O cliente foi notificado.");
    setItems([]);
  }

  return (
    <Card style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
      <h3 style={{ margin: 0 }}>Montar plano alimentar</h3>
      <TextField label="Buscar alimento" value={search} onChange={(e) => setSearch(e.target.value)} />
      {results.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 160, overflow: "auto" }}>
          {results.map((food) => (
            <button
              key={food.id}
              type="button"
              onClick={() => {
                setItems((prev) => [...prev, { foodId: food.id, name: food.name, quantityGrams: 100 }]);
                setSearch("");
                setResults([]);
              }}
              style={{ textAlign: "left", background: "var(--bg-surface)", border: "1px solid var(--border-hairline)", borderRadius: 8, padding: 8, color: "var(--text-primary)", cursor: "pointer" }}
            >
              {food.name} — {food.kcal} kcal/100g
            </button>
          ))}
        </div>
      )}
      {items.length > 0 && (
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 4 }}>
          {items.map((item, i) => (
            <li key={i} style={{ color: "var(--text-secondary)", fontSize: "var(--fs-body-sm)" }}>
              {item.name} — {item.quantityGrams} g
            </li>
          ))}
        </ul>
      )}
      <Button onClick={publish} disabled={items.length === 0}>
        Publicar plano
      </Button>
      {status && <p style={{ color: "var(--success)", fontSize: "var(--fs-body-sm)" }}>{status}</p>}
    </Card>
  );
}

function WorkoutBuilder({ clientId }: { clientId: string }) {
  const { accessToken } = useAuth();
  const [letter, setLetter] = useState("A");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<ExerciseItem[]>([]);
  const [items, setItems] = useState<{ exerciseId: string; name: string; sets: number; reps: string }[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (search.length < 2) return setResults([]);
    exercisesApi.list(search).then(setResults);
  }, [search]);

  async function publish() {
    if (!accessToken || items.length === 0) return;
    setStatus("Publicando…");
    const workout = await adminApi.createWorkout(
      clientId,
      { letter, exercises: items.map((i) => ({ exerciseId: i.exerciseId, sets: i.sets, reps: i.reps })) },
      accessToken
    );
    await adminApi.publishWorkout(workout.id, accessToken);
    setStatus("Treino publicado! O cliente foi notificado.");
    setItems([]);
  }

  return (
    <Card style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
      <h3 style={{ margin: 0 }}>Montar treino</h3>
      <TextField label="Letra do treino" value={letter} onChange={(e) => setLetter(e.target.value.toUpperCase())} />
      <TextField label="Buscar exercício" value={search} onChange={(e) => setSearch(e.target.value)} />
      {results.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 160, overflow: "auto" }}>
          {results.map((ex) => (
            <button
              key={ex.id}
              type="button"
              onClick={() => {
                setItems((prev) => [...prev, { exerciseId: ex.id, name: ex.name, sets: 4, reps: "10-12" }]);
                setSearch("");
                setResults([]);
              }}
              style={{ textAlign: "left", background: "var(--bg-surface)", border: "1px solid var(--border-hairline)", borderRadius: 8, padding: 8, color: "var(--text-primary)", cursor: "pointer" }}
            >
              {ex.name} — {ex.muscleGroup}
            </button>
          ))}
        </div>
      )}
      {items.length > 0 && (
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 4 }}>
          {items.map((item, i) => (
            <li key={i} style={{ color: "var(--text-secondary)", fontSize: "var(--fs-body-sm)" }}>
              {item.name} — {item.sets}x{item.reps}
            </li>
          ))}
        </ul>
      )}
      <Button onClick={publish} disabled={items.length === 0}>
        Publicar treino
      </Button>
      {status && <p style={{ color: "var(--success)", fontSize: "var(--fs-body-sm)" }}>{status}</p>}
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
            <div style={{ background: m.sender.role === "PROFESSIONAL" ? "var(--accent)" : "var(--bg-surface)", color: m.sender.role === "PROFESSIONAL" ? "var(--ink-900)" : "var(--text-primary)", padding: "8px 12px", borderRadius: 10, fontSize: "var(--fs-body-sm)" }}>
              {m.body}
            </div>
          </div>
        ))}
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

export function AdminClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { accessToken } = useAuth();
  const [client, setClient] = useState<any>(null);

  useEffect(() => {
    if (!accessToken || !id) return;
    adminApi.clientDetail(id, accessToken).then(setClient);
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
            {client.email}
          </span>
        </span>
      }
    >
      <div className="admin-split-2" style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: "var(--sp-6)", alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-6)" }}>
          <Card>
            <h3 style={{ marginTop: 0 }}>Anamnese</h3>
            <AnamnesisSummary anamnesis={client.anamnesis ?? {}} />
          </Card>

          <Card>
            <h3 style={{ marginTop: 0 }}>Avaliação física</h3>
            <AssessmentSummary assessments={client.assessments ?? []} />
          </Card>

          <AiSummaryPanel clientId={id} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-6)" }}>
          <MealPlanBuilder clientId={id} />
          <WorkoutBuilder clientId={id} />
          <MessagesPanel clientId={id} />
        </div>
      </div>
    </AdminLayout>
  );
}
