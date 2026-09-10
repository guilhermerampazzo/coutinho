import { useEffect, useState } from "react";
import { Card } from "@couthealth/ui";
import { clientApi, professionalProfileApi } from "../../lib/api";
import { mealPlanPdfHtml, openPdfWindow } from "../../lib/pdf";
import { useAuth } from "../../lib/auth";
import { ClientLayout } from "./ClientLayout";

export function NutritionPage() {
  const { accessToken } = useAuth();
  const [mealPlan, setMealPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pdfBusy, setPdfBusy] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    clientApi
      .nutrition(accessToken)
      .then(setMealPlan)
      .finally(() => setLoading(false));
  }, [accessToken]);

  const openPdf = async () => {
    if (!mealPlan || !accessToken) return;
    setPdfBusy(true);
    try {
      const [pro, data] = await Promise.all([
        professionalProfileApi.get(accessToken),
        clientApi.dashboard(accessToken).catch(() => null),
      ]);
      // clientApi.dashboard não traz anamnese; busca export para dados do cliente (idade/IMC).
      const full = await clientApi.exportData(accessToken).catch(() => null);
      const client = full
        ? { name: full.user?.name, email: full.user?.email, anamnesis: full.anamnesis, assessments: full.assessments }
        : { name: undefined, email: undefined, anamnesis: {}, assessments: [] };
      void data;
      openPdfWindow(mealPlan.title ?? "Plano alimentar", mealPlanPdfHtml(mealPlan, pro, client));
    } finally {
      setPdfBusy(false);
    }
  };

  return (
    <ClientLayout title="Nutrição">
      <div style={{ maxWidth: 820 }}>
        {loading && <p style={{ color: "var(--text-secondary)" }}>Carregando…</p>}
        {!loading && !mealPlan && <p style={{ color: "var(--text-secondary)" }}>Nenhum plano alimentar publicado ainda.</p>}

        {mealPlan && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "var(--sp-4)" }}>
            <button onClick={openPdf} disabled={pdfBusy} style={{ background: "transparent", border: "1px solid var(--border-hairline)", color: "var(--text-secondary)", borderRadius: 999, padding: "8px 16px", fontSize: "var(--fs-caption)", cursor: "pointer" }}>{pdfBusy ? "Gerando…" : "Baixar PDF"}</button>
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
                      {(item.substitutes ?? []).length > 0 && (
                        <span style={{ color: "var(--text-secondary)" }}>
                          {" "}ou {(item.substitutes ?? []).map((s: any) => `${s.quantity} ${(s.unit ?? "").toLowerCase()} de ${s.food?.name}`).join(" ou ")}
                        </span>
                      )}
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
