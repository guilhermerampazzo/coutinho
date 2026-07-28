import { useEffect, useState } from "react";
import { Button, Card, TextField } from "@couthealth/ui";
import { adminNotificationsApi } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { AdminLayout } from "./AdminLayout";

const audiences = [
  { value: "all", label: "Todos os clientes" },
  { value: "ESSENCIAL", label: "Assinantes Essencial" },
  { value: "PLUS", label: "Assinantes Plus" },
  { value: "ELITE", label: "Assinantes Elite" },
];

export function AdminNotificationsPage() {
  const { accessToken } = useAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("all");
  const [scheduledFor, setScheduledFor] = useState("");
  const [sent, setSent] = useState<any[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  function load() {
    if (!accessToken) return;
    adminNotificationsApi.list(accessToken).then(setSent);
  }

  useEffect(load, [accessToken]);

  async function create() {
    if (!accessToken || !title || !body) return;
    const res = await adminNotificationsApi.create({ title, body, audience, scheduledFor: scheduledFor || undefined }, accessToken);
    setStatus(res.status === "sent" ? `Enviada para ${res.recipients} cliente(s).` : `Agendada para ${new Date(res.scheduledFor).toLocaleString("pt-BR")}.`);
    setTitle("");
    setBody("");
    setScheduledFor("");
    load();
  }

  return (
    <AdminLayout title="Nova notificação">
      <div className="admin-split-2" style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "var(--sp-8)", alignItems: "start" }}>
        <Card style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)", maxWidth: 480 }}>
          <TextField label="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
            <label style={{ fontSize: "var(--fs-body-sm)", fontWeight: 600, color: "var(--text-secondary)" }}>Mensagem</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              style={{ background: "var(--bg-base)", border: "1px solid var(--border-hairline)", borderRadius: "var(--r-md)", padding: "12px 16px", color: "var(--text-primary)", fontFamily: "var(--font-body)" }}
            />
          </div>
          <div>
            <label style={{ fontSize: "var(--fs-body-sm)", fontWeight: 600, color: "var(--text-secondary)" }}>Público</label>
            <select value={audience} onChange={(e) => setAudience(e.target.value)} style={{ display: "block", width: "100%", marginTop: 8, background: "var(--bg-base)", border: "1px solid var(--border-hairline)", borderRadius: "var(--r-md)", padding: "12px 16px", color: "var(--text-primary)" }}>
              {audiences.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>
          <TextField label="Agendar para (opcional)" type="datetime-local" value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} />
          <Button onClick={create} style={{ borderRadius: "var(--r-full)" }}>
            {scheduledFor ? "Agendar" : "Enviar agora"}
          </Button>
          {status && <p style={{ color: "var(--success)", fontSize: "var(--fs-body-sm)" }}>{status}</p>}
        </Card>

        <div>
          <span style={{ fontSize: "var(--fs-caption)", color: "var(--text-tertiary)", display: "block", marginBottom: "var(--sp-3)" }}>Prévia no app</span>
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-hairline)", borderRadius: "var(--r-lg)", padding: "var(--sp-5, 20px)" }}>
            <div style={{ display: "flex", gap: "var(--sp-3)", alignItems: "flex-start" }}>
              <div style={{ width: 32, height: 32, flexShrink: 0, borderRadius: "var(--r-full)", background: "var(--ink-600)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)", fontSize: "0.875rem" }}>
                🔔
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: "var(--fs-body-sm)" }}>{title || "Título da notificação"}</div>
                <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-tertiary)", marginTop: 4 }}>{body || "Prévia da mensagem enviada ao cliente."}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <h2 className="display" style={{ fontSize: "var(--fs-title-sm)", margin: "var(--sp-8) 0 var(--sp-4)" }}>
        Enviadas recentemente
      </h2>
      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-hairline)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
        {sent.length === 0 && <p style={{ color: "var(--text-tertiary)", padding: "var(--sp-4)", margin: 0 }}>Nenhuma notificação enviada ainda.</p>}
        {sent.map((n, i) => (
          <div
            key={n.id}
            style={{
              padding: "12px var(--sp-4)",
              borderTop: i === 0 ? "none" : "1px solid var(--border-hairline)",
              fontSize: "var(--fs-body-sm)",
            }}
          >
            <strong>{n.title}</strong> <span style={{ color: "var(--text-tertiary)" }}>— {n.audienceSegment}</span>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
