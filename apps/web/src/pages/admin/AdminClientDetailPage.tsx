import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button, Card, TextField } from "@couthealth/ui";
import { adminApi, foodsApi, exercisesApi, type FoodItem, type ExerciseItem } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { AdminLayout } from "./AdminLayout";

const anamnesisLabels: Record<string, string> = {
  sex: "Sexo",
  birthDate: "Nascimento",
  heightCm: "Altura (cm)",
  weightKg: "Peso (kg)",
  profession: "Profissão",
  goal: "Objetivo",
  goalDescription: "O que espera conquistar",
  mealsPerDay: "Refeições/dia",
  waterLitersPerDay: "Água (L/dia)",
  preferredFoods: "Alimentos preferidos",
  dislikedFoods: "Alimentos que não gosta",
  allergies: "Alergias",
  diseases: "Doenças",
  medications: "Medicamentos",
  sleepQuality: "Qualidade do sono",
  sleepHours: "Horas de sono",
  bowelFunction: "Função intestinal",
  smokes: "Fuma",
  drinksAlcohol: "Bebe álcool",
  activityLevel: "Nível de atividade",
  trainingDaysPerWeek: "Dias de treino/semana",
};

function AnamnesisSummary({ anamnesis }: { anamnesis: Record<string, any> }) {
  const entries = Object.entries(anamnesisLabels).filter(([key]) => anamnesis?.[key] !== null && anamnesis?.[key] !== undefined);
  if (entries.length === 0) return <p style={{ color: "var(--text-secondary)" }}>Anamnese ainda não preenchida.</p>;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "var(--sp-4)" }}>
      {entries.map(([key, value]) => (
        <div key={key}>
          <p style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-caption)", margin: 0 }}>{anamnesisLabels[key]}</p>
          <p style={{ margin: "2px 0 0" }}>{String(value)}</p>
        </div>
      ))}
    </div>
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
        <Card>
          <h3 style={{ marginTop: 0 }}>Anamnese</h3>
          <AnamnesisSummary anamnesis={client.anamnesis ?? {}} />
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-6)" }}>
          <MealPlanBuilder clientId={id} />
          <WorkoutBuilder clientId={id} />
          <MessagesPanel clientId={id} />
        </div>
      </div>
    </AdminLayout>
  );
}
