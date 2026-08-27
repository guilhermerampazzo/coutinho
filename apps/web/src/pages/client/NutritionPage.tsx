import { useEffect, useState } from "react";
import { Card } from "@couthealth/ui";
import { clientApi } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { ClientLayout } from "./ClientLayout";

export function NutritionPage() {
  const { accessToken } = useAuth();
  const [mealPlan, setMealPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    clientApi
      .nutrition(accessToken)
      .then(setMealPlan)
      .finally(() => setLoading(false));
  }, [accessToken]);

  const openPdf = () => {
    if (!mealPlan) return;
    const w = window.open("", "_blank");
    if (!w) return;
    const html = `<html><head><title>${mealPlan.title ?? "Plano alimentar"}</title>
      <style>body{font-family:Inter,sans-serif;color:#17181b;padding:40px} h1{font-family:'Space Grotesk',sans-serif} .meal{border:1px solid #e5e7eb;border-radius:14px;padding:16px;margin-bottom:16px} .item{display:flex;justify-content:space-between;border-bottom:1px solid #f3f4f6;padding:8px 0} .kcal{color:#f5b335;font-weight:600;font-size:12px}</style>
      </head><body><h1 style="color:#f7be00">COUT — ${mealPlan.title ?? "Plano alimentar"}</h1><p style="color:#6b7280">${mealPlan.meals?.length ?? 0} refeições • ${new Date(mealPlan.publishedAt ?? mealPlan.createdAt).toLocaleDateString("pt-BR")}</p>
      ${(mealPlan.meals ?? []).map((m: any) => `<div class="meal"><strong>${m.time} — ${m.name}</strong>${m.notes ? `<p style="color:#6b7280">${m.notes}</p>` : ""}${(m.items ?? []).map((it: any) => `<div class="item"><span>${it.food.name} — ${it.quantity ?? it.quantityGrams} ${it.unit ?? "Gramas"}</span><span class="kcal">${Math.round((it.food.kcal * (it.quantityGrams ?? 100))/100)} kcal</span></div>`).join("")}</div>`).join("")}
      <p style="margin-top:32px;font-size:12px;color:#9ca3af">CoutHealth — acompanhamento profissional contínuo.</p></body></html>`;
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  };

  return (
    <ClientLayout title="Nutrição">
      <div style={{ maxWidth: 820 }}>
        {loading && <p style={{ color: "var(--text-secondary)" }}>Carregando…</p>}
        {!loading && !mealPlan && <p style={{ color: "var(--text-secondary)" }}>Nenhum plano alimentar publicado ainda.</p>}

        {mealPlan && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "var(--sp-4)" }}>
            <button onClick={openPdf} style={{ background: "transparent", border: "1px solid var(--border-hairline)", color: "var(--text-secondary)", borderRadius: 999, padding: "8px 16px", fontSize: "var(--fs-caption)", cursor: "pointer" }}>Baixar PDF</button>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
          {mealPlan?.meals?.map((meal: any) => (
            <Card key={meal.id} style={{ padding: "var(--sp-6) var(--sp-8)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-4)" }}>
                <h3 className="display" style={{ fontSize: "1.0625rem", fontWeight: 600, margin: 0 }}>
                  {meal.name}
                </h3>
                <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>{meal.time}</span>
              </div>
              {meal.notes && <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-body-sm)", marginTop: 0 }}>{meal.notes}</p>}
              <div>
                {meal.items.map((item: any) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "10px 0",
                      borderTop: "1px solid var(--border-hairline)",
                      fontSize: "0.9375rem",
                    }}
                  >
                    <span>
                      {item.food.name} — {item.quantity ?? item.quantityGrams} {item.unit ?? "Gramas"}
                    </span>
                    <span style={{ color: "var(--accent)", fontSize: "var(--fs-caption)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                      {Math.round((item.food.kcal * (item.quantityGrams ?? 100)) / 100)} kcal
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </ClientLayout>
  );
}
