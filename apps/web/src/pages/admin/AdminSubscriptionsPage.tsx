import { useEffect, useState } from "react";
import { Badge } from "@couthealth/ui";
import { adminSubscriptionsApi } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { AdminLayout } from "./AdminLayout";

const statuses = ["PENDING", "ACTIVE", "CANCELED", "EXPIRED"];
const planCodes = ["ESSENCIAL", "PLUS", "ELITE"];

const statusTone: Record<string, "accent" | "neutral"> = {
  ACTIVE: "accent",
  PENDING: "neutral",
  CANCELED: "neutral",
  EXPIRED: "neutral",
};

export function AdminSubscriptionsPage() {
  const { accessToken } = useAuth();
  const [subs, setSubs] = useState<any[]>([]);

  function load() {
    if (!accessToken) return;
    adminSubscriptionsApi.list(accessToken).then(setSubs);
  }

  useEffect(load, [accessToken]);

  async function changeStatus(id: string, status: string) {
    if (!accessToken) return;
    await adminSubscriptionsApi.update(id, { status }, accessToken);
    load();
  }

  async function changePlan(id: string, planCode: string) {
    if (!accessToken) return;
    await adminSubscriptionsApi.update(id, { planCode }, accessToken);
    load();
  }

  return (
    <AdminLayout title="Planos & Assinaturas">
      <div className="admin-table-wrap" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-hairline)", borderRadius: "var(--r-lg)" }}>
        <div style={{ minWidth: 640 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr auto auto",
            alignItems: "center",
            gap: "var(--sp-3)",
            padding: "12px var(--sp-4)",
            background: "var(--bg-base)",
            fontSize: "var(--fs-caption)",
            color: "var(--text-tertiary)",
            fontWeight: 500,
          }}
        >
          <span>Cliente</span>
          <span>Período</span>
          <span>Plano</span>
          <span>Status</span>
        </div>
        {subs.map((s) => (
          <div
            key={s.id}
            style={{
              display: "grid",
              gridTemplateColumns: "1.4fr 1fr auto auto",
              alignItems: "center",
              gap: "var(--sp-3)",
              padding: "12px var(--sp-4)",
              borderTop: "1px solid var(--border-hairline)",
              fontSize: "var(--fs-body-sm)",
              flexWrap: "wrap",
            }}
          >
            <span>
              {s.user.name} <span style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-caption)" }}>({s.user.email})</span>
            </span>
            <Badge>{s.period}</Badge>
            <select
              value={s.plan.code}
              onChange={(e) => changePlan(s.id, e.target.value)}
              style={{ background: "var(--bg-base)", border: "1px solid var(--border-hairline)", borderRadius: "var(--r-sm)", padding: "6px 10px", color: "var(--text-primary)" }}
            >
              {planCodes.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <span style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center" }}>
              <Badge tone={statusTone[s.status] ?? "neutral"}>{s.status}</Badge>
              <select
                value={s.status}
                onChange={(e) => changeStatus(s.id, e.target.value)}
                style={{ background: "var(--bg-base)", border: "1px solid var(--border-hairline)", borderRadius: "var(--r-sm)", padding: "6px 10px", color: "var(--text-primary)" }}
              >
                {statuses.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </span>
          </div>
        ))}
        </div>
      </div>
    </AdminLayout>
  );
}
