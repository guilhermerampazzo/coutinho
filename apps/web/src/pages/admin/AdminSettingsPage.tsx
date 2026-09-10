import { useEffect, useState, type FormEvent } from "react";
import { Button, Card, TextField } from "@couthealth/ui";
import { professionalProfileApi, ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { AdminLayout } from "./AdminLayout";

export function AdminSettingsPage() {
  const { accessToken } = useAuth();
  const [form, setForm] = useState({ name: "", title: "", registration: "", phone: "", email: "", location: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    professionalProfileApi
      .get(accessToken)
      .then((p) => setForm({ name: p.name ?? "", title: p.title ?? "", registration: p.registration ?? "", phone: p.phone ?? "", email: p.email ?? "", location: p.location ?? "" }))
      .finally(() => setLoading(false));
  }, [accessToken]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    setSaving(true);
    setStatus(null);
    try {
      await professionalProfileApi.update(form, accessToken);
      setStatus("Dados salvos! Os próximos PDFs já saem com essas informações.");
    } catch (err) {
      setStatus(err instanceof ApiError ? err.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout title="Configurações">
      <div style={{ maxWidth: 640 }}>
        <Card style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
          <h3 style={{ margin: 0 }}>Dados do profissional</h3>
          <p style={{ margin: 0, fontSize: "var(--fs-body-sm)", color: "var(--text-secondary)" }}>
            Essas informações aparecem no cabeçalho dos PDFs do plano alimentar e do treino (identificação,
            registro, contato e local de atendimento).
          </p>
          {loading ? (
            <p style={{ color: "var(--text-secondary)" }}>Carregando…</p>
          ) : (
            <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
              <TextField label="Nome do profissional" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-4)" }}>
                <TextField label="Título (ex.: Nutricionista)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                <TextField label="Registro profissional" value={form.registration} onChange={(e) => setForm({ ...form, registration: e.target.value })} placeholder="Ex.: 25106135" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-4)" }}>
                <TextField label="Telefone / WhatsApp" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+55 24 99265 8924" />
                <TextField label="E-mail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <TextField label="Local de atendimento" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Ex.: Academia Locatelli" />
              {status && <p style={{ margin: 0, fontSize: "var(--fs-body-sm)", color: status.includes("salvos") ? "var(--success)" : "var(--danger)" }}>{status}</p>}
              <div>
                <Button type="submit" disabled={saving}>{saving ? "Salvando…" : "Salvar dados"}</Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}
