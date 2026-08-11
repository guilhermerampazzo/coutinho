import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Badge, Button, Card, TextField } from "@couthealth/ui";
import { adminApi, ApiError, type ClientListItem } from "../../lib/api";
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
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function load() {
    if (!accessToken) return;
    setLoading(true);
    adminApi
      .listClients(accessToken)
      .then(setClients)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const pending = clients.filter((c) => c.anamnesis?.status === "ENVIADA");

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    setSaving(true);
    setFormError(null);
    try {
      await adminApi.createClient(form, accessToken);
      setForm({ name: "", email: "", password: "" });
      setShowForm(false);
      load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Não foi possível cadastrar o cliente.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(client: ClientListItem) {
    if (!accessToken) return;
    const ok = window.confirm(`Remover o cadastro de ${client.name}?\nA conta será desativada, as cobranças canceladas e ela deixará de aparecer na lista.`);
    if (!ok) return;
    try {
      await adminApi.removeClient(client.id, accessToken);
      load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Não foi possível remover o cliente.");
    }
  }

  return (
    <AdminLayout
      title="Clientes"
      actions={
        <Button onClick={() => setShowForm((v) => !v)} style={{ height: 40 }}>
          {showForm ? "Cancelar" : "+ Novo cliente"}
        </Button>
      }
    >
      <p style={{ color: "var(--text-secondary)", marginBottom: "var(--sp-8)" }}>
        {pending.length > 0 ? `${pending.length} anamnese(s) aguardando análise.` : "Nenhuma anamnese pendente no momento."}
      </p>

      {showForm && (
        <Card style={{ marginBottom: "var(--sp-6)", padding: "var(--sp-6)" }}>
          <h3 className="display" style={{ fontSize: "var(--fs-title-sm)", margin: "0 0 var(--sp-4)" }}>
            Cadastrar cliente (recepção)
          </h3>
          <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--sp-4)" }}>
              <TextField label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoComplete="off" />
              <TextField label="E-mail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required autoComplete="off" />
              <TextField
                label="Senha inicial"
                type="text"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
                autoComplete="off"
              />
            </div>
            {formError && <p style={{ color: "var(--danger)", fontSize: "var(--fs-body-sm)", margin: 0 }}>{formError}</p>}
            <div style={{ display: "flex", gap: "var(--sp-3)" }}>
              <Button type="submit" disabled={saving} style={{ height: 40 }}>
                {saving ? "Cadastrando…" : "Cadastrar cliente"}
              </Button>
              <Button variant="secondary" onClick={() => setShowForm(false)} style={{ height: 40 }}>
                Cancelar
              </Button>
            </div>
            <p style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-caption)", margin: 0 }}>
              O cliente usa o e-mail e a senha definidos aqui para entrar na plataforma.
            </p>
          </form>
        </Card>
      )}

      <h2 className="display" style={{ fontSize: "var(--fs-title-sm)", margin: "0 0 var(--sp-4)" }}>
        Cadastros
      </h2>

      {loading ? (
        <p style={{ color: "var(--text-secondary)" }}>Carregando…</p>
      ) : clients.length === 0 ? (
        <p style={{ color: "var(--text-secondary)" }}>Nenhum cliente cadastrado ainda.</p>
      ) : (
        <div className="admin-table-wrap" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-hairline)", borderRadius: "var(--r-lg)" }}>
          <div style={{ minWidth: 680 }}>
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
                <div
                  key={client.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.4fr 1.2fr 1fr auto",
                    alignItems: "center",
                    gap: "var(--sp-3)",
                    padding: "14px var(--sp-6)",
                    borderTop: "1px solid var(--border-hairline)",
                  }}
                >
                  <Link to={`/admin/clientes/${client.id}`} style={{ textDecoration: "none", color: "inherit", display: "contents" }}>
                    <span style={{ fontWeight: 600 }}>{client.name}</span>
                    <span style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-caption)" }}>{client.email}</span>
                    <span style={{ display: "flex", gap: "var(--sp-2)", flexWrap: "wrap" }}>
                      <Badge tone={status.tone}>{status.label}</Badge>
                      {client.subscriptions[0] && <Badge>{client.subscriptions[0].plan.name}</Badge>}
                    </span>
                  </Link>
                  <span style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center", justifyContent: "flex-end" }}>
                    <Link to={`/admin/clientes/${client.id}`} style={{ color: "var(--accent)", fontWeight: 600, fontSize: "var(--fs-caption)", textDecoration: "none" }}>
                      Ver →
                    </Link>
                    <button
                      onClick={() => handleRemove(client)}
                      style={{
                        background: "none",
                        border: "1px solid var(--danger)",
                        color: "var(--danger)",
                        borderRadius: "var(--r-sm)",
                        padding: "4px 10px",
                        fontSize: "var(--fs-caption)",
                        cursor: "pointer",
                      }}
                    >
                      Remover
                    </button>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
