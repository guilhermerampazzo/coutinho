import { useEffect, useState } from "react";
import { Badge, Card } from "@couthealth/ui";
import { clientApi } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { ClientLayout } from "./ClientLayout";

export function WorkoutPage() {
  const { accessToken } = useAuth();
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    clientApi.workouts(accessToken).then((data) => {
      setWorkouts(data);
      if (data[0]) setActive(data[0].id);
    });
  }, [accessToken]);

  const current = workouts.find((w) => w.id === active);

  const openPdf = () => {
    if (!current) return;
    const w = window.open("", "_blank");
    if (!w) return;
    const html = `<html><head><title>${current.title ?? `Treino ${current.letter}`}</title>
      <style>body{font-family:Inter,sans-serif;color:#17181b;padding:40px} h1{font-family:'Space Grotesk',sans-serif} table{width:100%;border-collapse:collapse;margin-top:16px} th{border-bottom:2px solid #111;padding:8px;font-size:12px;color:#6b7280;text-align:left} td{padding:10px 8px;border-bottom:1px solid #e5e7eb;font-size:13px} .badge{background:#f7be00;color:#17181b;padding:4px 10px;border-radius:999px;font-weight:700}</style>
      </head><body><h1><span class="badge">Treino ${current.letter}</span> ${current.title ?? ""}</h1><p style="color:#6b7280">${new Date(current.publishedAt ?? current.createdAt).toLocaleDateString("pt-BR")}</p>
      <table><thead><tr><th>Exercício</th><th>Séries</th><th>Repetições</th><th>Carga</th><th>Intervalo</th><th>Obs</th></tr></thead><tbody>${(current.exercises ?? []).map((ex: any) => `<tr><td><strong>${ex.exercise.name}</strong></td><td>${ex.sets}</td><td>${ex.reps}</td><td>${ex.load ?? "—"}</td><td>${ex.restSeconds ? ex.restSeconds + "s" : "—"}</td><td>${ex.notes ?? ""}</td></tr>`).join("")}</tbody></table>
      <p style="margin-top:32px;font-size:12px;color:#9ca3af">COUT — Plano de treino. Acompanhamento profissional contínuo.</p></body></html>`;
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  };

  return (
    <ClientLayout title="Treino">
      <div style={{ maxWidth: 820 }}>
        {workouts.length === 0 && <p style={{ color: "var(--text-secondary)" }}>Nenhum treino publicado ainda.</p>}
        {current && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "var(--sp-4)" }}>
            <button onClick={openPdf} style={{ background: "transparent", border: "1px solid var(--border-hairline)", color: "var(--text-secondary)", borderRadius: 999, padding: "8px 16px", fontSize: "var(--fs-caption)", cursor: "pointer" }}>Baixar PDF</button>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginBottom: "var(--sp-6)", borderBottom: "1px solid var(--border-hairline)" }}>
          {workouts.map((w) => (
            <button
              key={w.id}
              onClick={() => setActive(w.id)}
              style={{
                padding: "12px 20px",
                fontWeight: 600,
                fontSize: "0.9375rem",
                background: "transparent",
                border: "none",
                borderBottom: `2px solid ${w.id === active ? "var(--accent)" : "transparent"}`,
                color: w.id === active ? "var(--text-primary)" : "var(--text-secondary)",
                cursor: "pointer",
              }}
            >
              Treino {w.letter}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 0, marginBottom: "var(--sp-8)" }}>
          {current?.exercises?.map((we: any) => (
            <div
              key={we.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "16px 0",
                borderBottom: "1px solid var(--border-hairline)",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: "0.9375rem" }}>{we.exercise.name}</div>
                <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                  {we.sets} × {we.reps} {we.restSeconds ? `· ${we.restSeconds}s` : ""}
                </div>
              </div>
              <Badge>{we.exercise.muscleGroup}</Badge>
            </div>
          ))}
        </div>

        {current?.exercises?.map((we: any) => (
          <Card key={`detail-${we.id}`} style={{ marginBottom: "var(--sp-4)", padding: "var(--sp-8)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--sp-5)" }}>
              <h3 style={{ margin: 0 }}>{we.exercise.name}</h3>
              <span style={{ color: "var(--accent)", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                {we.sets}x{we.reps}
              </span>
            </div>
            <div style={{ display: "flex", gap: 32, marginBottom: "var(--sp-5)", fontSize: "0.9375rem", flexWrap: "wrap" }}>
              <div>
                <span style={{ color: "var(--text-secondary)" }}>Séries</span>
                <div style={{ fontWeight: 600 }}>{we.sets}</div>
              </div>
              <div>
                <span style={{ color: "var(--text-secondary)" }}>Repetições</span>
                <div style={{ fontWeight: 600 }}>{we.reps}</div>
              </div>
              {we.load && (
                <div>
                  <span style={{ color: "var(--text-secondary)" }}>Carga</span>
                  <div style={{ fontWeight: 600 }}>{we.load}</div>
                </div>
              )}
              {we.restSeconds && (
                <div>
                  <span style={{ color: "var(--text-secondary)" }}>Intervalo</span>
                  <div style={{ fontWeight: 600 }}>{we.restSeconds}s</div>
                </div>
              )}
            </div>
            {we.notes && (
              <div
                style={{
                  borderLeft: "2px solid var(--accent)",
                  paddingLeft: 16,
                  fontSize: "0.9375rem",
                  color: "var(--text-primary)",
                  marginBottom: "var(--sp-5)",
                }}
              >
                "{we.notes}"
              </div>
            )}
            {we.exercise.videoUrl && (
              <a href={we.exercise.videoUrl} target="_blank" rel="noreferrer" style={{ color: "var(--accent)", fontSize: "var(--fs-body-sm)", fontWeight: 600 }}>
                Ver vídeo demonstrativo →
              </a>
            )}
          </Card>
        ))}
      </div>
    </ClientLayout>
  );
}
