import { useEffect, useState } from "react";
import { Badge, Button, Card, TextField } from "@couthealth/ui";
import { adminCouponsApi, type Coupon } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { AdminLayout } from "./AdminLayout";

export function AdminCouponsPage() {
  const { accessToken } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [code, setCode] = useState("");
  const [percentOff, setPercentOff] = useState("10");

  function load() {
    if (!accessToken) return;
    adminCouponsApi.list(accessToken).then(setCoupons);
  }

  useEffect(load, [accessToken]);

  async function create() {
    if (!accessToken || !code) return;
    await adminCouponsApi.create({ code, percentOff: Number(percentOff) / 100 }, accessToken);
    setCode("");
    load();
  }

  async function toggle(c: Coupon) {
    if (!accessToken) return;
    await adminCouponsApi.update(c.id, { active: !c.active }, accessToken);
    load();
  }

  return (
    <AdminLayout title="Cupons">
      <Card style={{ marginBottom: "var(--sp-6)", display: "flex", gap: "var(--sp-3)", alignItems: "end", maxWidth: 480 }}>
        <TextField label="Código" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
        <TextField label="Desconto (%)" type="number" value={percentOff} onChange={(e) => setPercentOff(e.target.value)} />
        <Button onClick={create} style={{ borderRadius: "var(--r-full)" }}>
          + Criar cupom
        </Button>
      </Card>

      <div className="admin-table-wrap" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-hairline)", borderRadius: "var(--r-lg)" }}>
        <div style={{ minWidth: 480 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr auto auto",
              alignItems: "center",
              gap: "var(--sp-3)",
              padding: "12px var(--sp-4)",
              background: "var(--bg-base)",
              fontSize: "var(--fs-caption)",
              color: "var(--text-tertiary)",
              fontWeight: 500,
            }}
          >
            <span>Código</span>
            <span>Desconto</span>
            <span>Status</span>
            <span />
          </div>
          {coupons.map((c) => (
            <div
              key={c.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr auto auto",
                alignItems: "center",
                gap: "var(--sp-3)",
                padding: "12px var(--sp-4)",
                borderTop: "1px solid var(--border-hairline)",
                fontSize: "var(--fs-body-sm)",
              }}
            >
              <span className="display" style={{ fontWeight: 600 }}>{c.code}</span>
              <span>{Math.round(c.percentOff * 100)}% off</span>
              <Badge tone={c.active ? "accent" : "neutral"}>{c.active ? "Ativo" : "Inativo"}</Badge>
              <Button variant="ghost" onClick={() => toggle(c)}>
                {c.active ? "Desativar" : "Ativar"}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
