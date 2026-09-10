import { useEffect, useState } from "react";
import { Badge, Card } from "@couthealth/ui";
import { clientApi, professionalProfileApi } from "../../lib/api";
import { workoutPdfHtml, openPdfWindow } from "../../lib/pdf";
import { useAuth } from "../../lib/auth";
import { ClientLayout } from "./ClientLayout";

export function WorkoutPage() {
  const { accessToken } = useAuth();
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    clientApi.workouts(accessToken).then((data) => {
      setWorkouts(data);
      if (data[0]) setActive(data[0].id);
    });
  }, [accessToken]);

  const current = workouts.find((w) => w.id === active);

  const openPdf = async () => {
    if (!current || !accessToken) return;
    setPdfBusy(true);
    try {
      const pro = await professionalProfileApi.get(accessToken);
      const full = await clientApi.exportData(accessToken).catch(() => null);
      const client = full
        ? { name: full.user?.name, email: full.user?.email, anamnesis: full.anamnesis, assessments: full.assessments }
        : { name: undefined, email: undefined, anamnesis: {}, assessments: [] };
      openPdfWindow(current.title ?? `Treino ${current.letter}`, workoutPdfHtml(current, pro, client));
    } finally {
      setPdfBusy(false);
    }
  };

  return (
    <ClientLayout title="Treino">
      <div style={{ maxWidth: 820 }}>
        {workouts.length === 0 && <p style={{ color: "var(--text-secondary)" }}>Nenhum treino publicado ainda.</p>}
        {current && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "var(--sp-4)" }}>
            <button onClick={openPdf} disabled={pdfBusy} style={{ background: "transparent", border: "1px solid var(--border-hairline)", color: "var(--text-secondary)", borderRadius: 999, padding: "8px 16px", fontSize: "var(--fs-caption)", cursor: "pointer" }}>{pdfBusy ? "Gerando…" : "Baixar PDF"}</button>
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
