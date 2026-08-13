import { useEffect, useState } from "react";
import { Button, Card, TextField } from "@couthealth/ui";
import { foodsApi, ApiError, type FoodItem, type FoodCategory } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { AdminLayout } from "./AdminLayout";

const empty = { name: "", categoryId: "", kcal: 0, protein: 0, carbs: 0, fat: 0 };

const selectStyle: React.CSSProperties = {
  background: "var(--bg-base)",
  border: "1px solid var(--border-hairline)",
  borderRadius: "var(--r-md)",
  color: "var(--text-primary)",
  padding: "10px 12px",
  fontSize: "var(--fs-body-sm)",
  width: "100%",
};

export function AdminFoodsPage() {
  const { accessToken } = useAuth();
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [form, setForm] = useState(empty);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [error, setError] = useState<string | null>(null);

  function load() {
    foodsApi.list(search, filterCategory).then(setFoods);
  }

  function loadCategories() {
    foodsApi.categories().then(setCategories);
  }

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(load, [search, filterCategory]);

  async function create() {
    if (!accessToken || !form.name || !form.categoryId) {
      setError("Preencha nome e selecione a categoria.");
      return;
    }
    setError(null);
    await foodsApi.create(form, accessToken);
    setForm(empty);
    load();
  }

  async function remove(id: string) {
    if (!accessToken) return;
    await foodsApi.remove(id, accessToken);
    load();
  }

  async function addCategory() {
    if (!accessToken || !newCategory.trim()) return;
    try {
      await foodsApi.createCategory(newCategory.trim(), accessToken);
      setNewCategory("");
      loadCategories();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível criar a categoria.");
    }
  }

  async function removeCategory(id: string) {
    if (!accessToken) return;
    try {
      await foodsApi.removeCategory(id, accessToken);
      loadCategories();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível remover a categoria.");
    }
  }

  return (
    <AdminLayout title="Banco de alimentos">
      <Card style={{ marginBottom: "var(--sp-6)", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "var(--sp-3)", alignItems: "end" }}>
        <TextField label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <div>
          <label style={{ display: "block", fontSize: "var(--fs-caption)", color: "var(--text-tertiary)", marginBottom: 6 }}>Categoria</label>
          <select style={selectStyle} value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
            <option value="">Selecionar…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <TextField label="Kcal/100g" type="number" value={form.kcal} onChange={(e) => setForm({ ...form, kcal: Number(e.target.value) })} />
        <TextField label="Proteína (g)" type="number" value={form.protein} onChange={(e) => setForm({ ...form, protein: Number(e.target.value) })} />
        <TextField label="Carbo (g)" type="number" value={form.carbs} onChange={(e) => setForm({ ...form, carbs: Number(e.target.value) })} />
        <TextField label="Gordura (g)" type="number" value={form.fat} onChange={(e) => setForm({ ...form, fat: Number(e.target.value) })} />
        <Button onClick={create} style={{ borderRadius: "var(--r-full)" }}>
          + Adicionar
        </Button>
      </Card>
      {error && <p style={{ color: "var(--danger)", fontSize: "var(--fs-body-sm)", margin: "0 0 var(--sp-3)" }}>{error}</p>}

      <Card style={{ marginBottom: "var(--sp-6)", display: "flex", gap: "var(--sp-3)", alignItems: "end", flexWrap: "wrap" }}>
        <div style={{ minWidth: 220, flex: 1 }}>
          <label style={{ display: "block", fontSize: "var(--fs-caption)", color: "var(--text-tertiary)", marginBottom: 6 }}>Gerenciar categorias</label>
          <div style={{ display: "flex", gap: 8 }}>
            <TextField label="" placeholder="Nova categoria…" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
            <Button onClick={addCategory} variant="secondary">
              + Adicionar
            </Button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {categories.map((c) => (
            <span key={c.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--bg-base)", border: "1px solid var(--border-hairline)", borderRadius: "var(--r-full)", padding: "4px 8px 4px 12px", fontSize: "var(--fs-caption)" }}>
              {c.name}
              {c._count?.foods ? <em style={{ color: "var(--text-tertiary)", fontStyle: "normal" }}>({c._count.foods})</em> : null}
              <button type="button" onClick={() => removeCategory(c.id)} style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", fontSize: "var(--fs-caption)", padding: 2 }}>
                ✕
              </button>
            </span>
          ))}
        </div>
      </Card>

      <div style={{ display: "flex", gap: "var(--sp-3)", marginBottom: "var(--sp-4)", flexWrap: "wrap" }}>
        <TextField label="Buscar" value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 320 }} />
        <div style={{ minWidth: 200 }}>
          <label style={{ display: "block", fontSize: "var(--fs-caption)", color: "var(--text-tertiary)", marginBottom: 6 }}>Filtrar por categoria</label>
          <select style={selectStyle} value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="">Todas</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="admin-table-wrap" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-hairline)", borderRadius: "var(--r-lg)" }}>
        <div style={{ minWidth: 640 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.6fr 1fr 0.7fr 0.7fr 0.7fr 0.7fr auto",
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
            <span>Categoria</span>
            <span style={{ textAlign: "right" }}>Kcal</span>
            <span style={{ textAlign: "right" }}>Prot.</span>
            <span style={{ textAlign: "right" }}>Carb.</span>
            <span style={{ textAlign: "right" }}>Gord.</span>
            <span />
          </div>
          {foods.map((food) => (
            <div
              key={food.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1.6fr 1fr 0.7fr 0.7fr 0.7fr 0.7fr auto",
                alignItems: "center",
                gap: "var(--sp-3)",
                padding: "12px var(--sp-4)",
                borderTop: "1px solid var(--border-hairline)",
                fontSize: "var(--fs-body-sm)",
              }}
            >
              <span>{food.name}</span>
              <span style={{ color: "var(--text-tertiary)" }}>{food.category?.name ?? "—"}</span>
              <span style={{ textAlign: "right" }}>{food.kcal}</span>
              <span style={{ textAlign: "right" }}>{food.protein}g</span>
              <span style={{ textAlign: "right" }}>{food.carbs}g</span>
              <span style={{ textAlign: "right" }}>{food.fat}g</span>
              <Button variant="ghost" onClick={() => remove(food.id)}>
                Remover
              </Button>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
