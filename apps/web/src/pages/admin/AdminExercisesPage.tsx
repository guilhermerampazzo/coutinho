import { useEffect, useState } from "react";
import { Button, Card, TextField } from "@couthealth/ui";
import { exercisesApi, ApiError, type ExerciseItem, type MuscleGroup } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { AdminLayout } from "./AdminLayout";

const empty = { name: "", muscleGroupId: "", videoUrl: "" };

const selectStyle: React.CSSProperties = {
  background: "var(--bg-base)",
  border: "1px solid var(--border-hairline)",
  borderRadius: "var(--r-md)",
  color: "var(--text-primary)",
  padding: "10px 12px",
  fontSize: "var(--fs-body-sm)",
  width: "100%",
};

export function AdminExercisesPage() {
  const { accessToken } = useAuth();
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [groups, setGroups] = useState<MuscleGroup[]>([]);
  const [form, setForm] = useState(empty);
  const [search, setSearch] = useState("");
  const [filterGroup, setFilterGroup] = useState("");
  const [newGroup, setNewGroup] = useState("");
  const [error, setError] = useState<string | null>(null);

  function load() {
    exercisesApi.list(search, filterGroup).then(setExercises);
  }

  function loadGroups() {
    exercisesApi.muscleGroups().then(setGroups);
  }

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(load, [search, filterGroup]);

  async function create() {
    if (!accessToken || !form.name || !form.muscleGroupId) {
      setError("Preencha nome e selecione o grupo muscular.");
      return;
    }
    setError(null);
    await exercisesApi.create(form, accessToken);
    setForm(empty);
    load();
  }

  async function remove(id: string) {
    if (!accessToken) return;
    await exercisesApi.remove(id, accessToken);
    load();
  }

  async function addGroup() {
    if (!accessToken || !newGroup.trim()) return;
    try {
      await exercisesApi.createMuscleGroup(newGroup.trim(), accessToken);
      setNewGroup("");
      loadGroups();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível criar o grupo.");
    }
  }

  async function removeGroup(id: string) {
    if (!accessToken) return;
    try {
      await exercisesApi.removeMuscleGroup(id, accessToken);
      loadGroups();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível remover o grupo.");
    }
  }

  return (
    <AdminLayout title="Banco de exercícios">
      <Card style={{ marginBottom: "var(--sp-6)", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "var(--sp-3)", alignItems: "end" }}>
        <TextField label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <div>
          <label style={{ display: "block", fontSize: "var(--fs-caption)", color: "var(--text-tertiary)", marginBottom: 6 }}>Grupo muscular</label>
          <select style={selectStyle} value={form.muscleGroupId} onChange={(e) => setForm({ ...form, muscleGroupId: e.target.value })}>
            <option value="">Selecionar…</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
        <TextField label="URL do vídeo (YouTube não listado)" value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} />
        <Button onClick={create} style={{ borderRadius: "var(--r-full)" }}>
          + Adicionar
        </Button>
      </Card>
      {error && <p style={{ color: "var(--danger)", fontSize: "var(--fs-body-sm)", margin: "0 0 var(--sp-3)" }}>{error}</p>}

      <Card style={{ marginBottom: "var(--sp-6)", display: "flex", gap: "var(--sp-3)", alignItems: "end", flexWrap: "wrap" }}>
        <div style={{ minWidth: 220, flex: 1 }}>
          <label style={{ display: "block", fontSize: "var(--fs-caption)", color: "var(--text-tertiary)", marginBottom: 6 }}>Gerenciar grupos musculares</label>
          <div style={{ display: "flex", gap: 8 }}>
            <TextField label="" placeholder="Novo grupo…" value={newGroup} onChange={(e) => setNewGroup(e.target.value)} />
            <Button onClick={addGroup} variant="secondary">
              + Adicionar
            </Button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {groups.map((g) => (
            <span key={g.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--bg-base)", border: "1px solid var(--border-hairline)", borderRadius: "var(--r-full)", padding: "4px 8px 4px 12px", fontSize: "var(--fs-caption)" }}>
              {g.name}
              {g._count?.exercises ? <em style={{ color: "var(--text-tertiary)", fontStyle: "normal" }}>({g._count.exercises})</em> : null}
              <button type="button" onClick={() => removeGroup(g.id)} style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", fontSize: "var(--fs-caption)", padding: 2 }}>
                ✕
              </button>
            </span>
          ))}
        </div>
      </Card>

      <div style={{ display: "flex", gap: "var(--sp-3)", marginBottom: "var(--sp-4)", flexWrap: "wrap" }}>
        <TextField label="Buscar" value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 320 }} />
        <div style={{ minWidth: 200 }}>
          <label style={{ display: "block", fontSize: "var(--fs-caption)", color: "var(--text-tertiary)", marginBottom: 6 }}>Filtrar por grupo muscular</label>
          <select style={selectStyle} value={filterGroup} onChange={(e) => setFilterGroup(e.target.value)}>
            <option value="">Todos</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      </div>

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
              <span style={{ color: "var(--text-tertiary)" }}>{ex.muscleGroup?.name ?? "—"}</span>
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
