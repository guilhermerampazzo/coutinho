import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@couthealth/ui";
import { adminApi, type ClientListItem } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { AdminLayout } from "./AdminLayout";

const statusLabel: Record<string, { label: string; tone: "accent" | "neutral" }> = {
  RASCUNHO: { label: "Anamnese em rascunho", tone: "neutral" },
  ENVIADA: { label: "Anamnese enviada — pendente de análise", tone: "accent" },
  ANALISADA: { label: "Anamnese analisada", tone: "neutral" },
};

export function AdminDashboardPage() {
  const { accessToken } = useAuth();
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    adminApi
      .listClients(accessToken)
      .then(setClients)
      .finally(() => setLoading(false));
  }, [accessToken]);

  const pending = clients.filter((c) => c.anamnesis?.status === "ENVIADA");

  return (
    <AdminLayout title="Dashboard">
      <p style={{ color: "var(--text-secondary)", marginBottom: "var(--sp-8)" }}>
        {pending.length > 0 ? `${pending.length} anamnese(s) aguardando análise.` : "Nenhuma anamnese pendente no momento."}
      </p>

      <h2 className="display" style={{ fontSize: "var(--fs-title-sm)", margin: "0 0 var(--sp-4)" }}>
        Clientes
      </h2>

      {loading ? (
        <p style={{ color: "var(--text-secondary)" }}>Carregando…</p>
      ) : (
        <div className="admin-table-wrap" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-hairline)", borderRadius: "var(--r-lg)" }}>
          <div style={{ minWidth: 640 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.4fr 1.2fr 1fr auto",
                alignItems: "center",
                gap: "var(--sp-3)",
                padding: "14px var(--sp-6)",
                background: "var(--bg-base)",
                fontSize: "var(--fs-caption)",
                color: "var(--text-tertiary)",
                fontWeight: 500,
              }}
            >
              <span>Cliente</span>
              <span>E-mail</span>
              <span>Status</span>
              <span />
            </div>
            {clients.map((client) => {
              const status = statusLabel[client.anamnesis?.status ?? "RASCUNHO"];
              return (
                <Link
                  key={client.id}
                  to={`/admin/clientes/${client.id}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.4fr 1.2fr 1fr auto",
                    alignItems: "center",
                    gap: "var(--sp-3)",
                    padding: "14px var(--sp-6)",
                    borderTop: "1px solid var(--border-hairline)",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{client.name}</span>
                  <span style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-caption)" }}>{client.email}</span>
                  <span style={{ display: "flex", gap: "var(--sp-2)", flexWrap: "wrap" }}>
                    <Badge tone={status.tone}>{status.label}</Badge>
                    {client.subscriptions[0] && <Badge>{client.subscriptions[0].plan.name}</Badge>}
                  </span>
                  <span style={{ color: "var(--accent)", fontWeight: 600, fontSize: "var(--fs-caption)" }}>Ver →</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
