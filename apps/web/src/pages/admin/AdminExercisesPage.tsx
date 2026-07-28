import { useEffect, useState } from "react";
import { Button, Card, TextField } from "@couthealth/ui";
import { exercisesApi, type ExerciseItem } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { AdminLayout } from "./AdminLayout";

const empty = { name: "", muscleGroup: "", videoUrl: "" };

export function AdminExercisesPage() {
  const { accessToken } = useAuth();
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [form, setForm] = useState(empty);
  const [search, setSearch] = useState("");

  function load() {
    exercisesApi.list(search).then(setExercises);
  }

  useEffect(load, [search]);

  async function create() {
    if (!accessToken || !form.name) return;
    await exercisesApi.create(form, accessToken);
    setForm(empty);
    load();
  }

  async function remove(id: string) {
    if (!accessToken) return;
    await exercisesApi.remove(id, accessToken);
    load();
  }

  return (
    <AdminLayout title="Banco de exercícios">
      <Card style={{ marginBottom: "var(--sp-6)", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "var(--sp-3)", alignItems: "end" }}>
        <TextField label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <TextField label="Grupo muscular" value={form.muscleGroup} onChange={(e) => setForm({ ...form, muscleGroup: e.target.value })} />
        <TextField label="URL do vídeo (YouTube não listado)" value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} />
        <Button onClick={create} style={{ borderRadius: "var(--r-full)" }}>
          + Adicionar
        </Button>
      </Card>

      <TextField label="Buscar" value={search} onChange={(e) => setSearch(e.target.value)} style={{ marginBottom: "var(--sp-4)", maxWidth: 320 }} />

      <div className="admin-table-wrap" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-hairline)", borderRadius: "var(--r-lg)" }}>
        <div style={{ minWidth: 560 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.4fr 1fr 1.4fr auto",
              alignItems: "center",
              gap: "var(--sp-3)",
              padding: "12px var(--sp-4)",
              background: "var(--bg-base)",
              fontSize: "var(--fs-caption)",
              color: "var(--text-tertiary)",
              fontWeight: 500,
            }}
          >
            <span>Nome</span>
            <span>Grupo muscular</span>
            <span>Vídeo</span>
            <span />
          </div>
          {exercises.map((ex) => (
            <div
              key={ex.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1.4fr 1fr 1.4fr auto",
                alignItems: "center",
                gap: "var(--sp-3)",
                padding: "12px var(--sp-4)",
                borderTop: "1px solid var(--border-hairline)",
                fontSize: "var(--fs-body-sm)",
              }}
            >
              <span>{ex.name}</span>
              <span style={{ color: "var(--text-tertiary)" }}>{ex.muscleGroup}</span>
              <span style={{ color: "var(--accent)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ex.videoUrl}</span>
              <Button variant="ghost" onClick={() => remove(ex.id)}>
                Remover
              </Button>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
