import { useEffect, useState } from "react";
import { Button, Card, TextField } from "@couthealth/ui";
import { foodsApi, type FoodItem } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { AdminLayout } from "./AdminLayout";

const empty = { name: "", category: "", kcal: 0, protein: 0, carbs: 0, fat: 0 };

export function AdminFoodsPage() {
  const { accessToken } = useAuth();
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [form, setForm] = useState(empty);
  const [search, setSearch] = useState("");

  function load() {
    foodsApi.list(search).then(setFoods);
  }

  useEffect(load, [search]);

  async function create() {
    if (!accessToken || !form.name) return;
    await foodsApi.create(form, accessToken);
    setForm(empty);
    load();
  }

  async function remove(id: string) {
    if (!accessToken) return;
    await foodsApi.remove(id, accessToken);
    load();
  }

  return (
    <AdminLayout title="Banco de alimentos">
      <Card style={{ marginBottom: "var(--sp-6)", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "var(--sp-3)", alignItems: "end" }}>
        <TextField label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <TextField label="Categoria" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
        <TextField label="Kcal/100g" type="number" value={form.kcal} onChange={(e) => setForm({ ...form, kcal: Number(e.target.value) })} />
        <TextField label="Proteína (g)" type="number" value={form.protein} onChange={(e) => setForm({ ...form, protein: Number(e.target.value) })} />
        <TextField label="Carbo (g)" type="number" value={form.carbs} onChange={(e) => setForm({ ...form, carbs: Number(e.target.value) })} />
        <TextField label="Gordura (g)" type="number" value={form.fat} onChange={(e) => setForm({ ...form, fat: Number(e.target.value) })} />
        <Button onClick={create} style={{ borderRadius: "var(--r-full)" }}>
          + Adicionar
        </Button>
      </Card>

      <TextField label="Buscar" value={search} onChange={(e) => setSearch(e.target.value)} style={{ marginBottom: "var(--sp-4)", maxWidth: 320 }} />

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
              <span style={{ color: "var(--text-tertiary)" }}>{food.category}</span>
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
