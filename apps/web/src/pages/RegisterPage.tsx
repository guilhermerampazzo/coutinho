import { useState, type FormEvent } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { AppleIcon, Button, GoogleIcon, TextField } from "@couthealth/ui";
import { authApi, ApiError, API_URL, SITE_URL } from "../lib/api";
import { useAuth } from "../lib/auth";
import { resolveRedirectTarget, savePostAuthRedirect, consumePostAuthRedirect } from "../lib/redirect";
import { useAppleLoginEnabled } from "../lib/useAppleLogin";
import { AuthLayout } from "./AuthLayout";

export function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const appleEnabled = useAppleLoginEnabled();
  const { setSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // "Sou aluno/paciente presencial" (landing) chega com ?modalidade=presencial — mesmo cadastro,
  // modalidade diferente: acesso livre, sem contratação/pagamento pela plataforma.
  const [modality, setModality] = useState<"ONLINE" | "PRESENCIAL">(() =>
    new URLSearchParams(window.location.search).get("modalidade") === "presencial" ? "PRESENCIAL" : "ONLINE"
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!consent) {
      setError("É necessário aceitar o tratamento de dados para criar a conta.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await authApi.register({ name, email, password, consent, modality });
      setSession(res.user, res.tokens.accessToken, res.tokens.refreshToken);
      navigate(consumePostAuthRedirect() ?? resolveRedirectTarget(location.search, res.user.role));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível criar sua conta. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  const modalityOptions: { value: "ONLINE" | "PRESENCIAL"; label: string; hint: string }[] = [
    { value: "ONLINE", label: "Consultoria online", hint: "Planos COUT com contratação e pagamento pela plataforma." },
    { value: "PRESENCIAL", label: "Atendimento presencial", hint: "Acesso livre à sua área; cobranças tratadas diretamente com o profissional." },
  ];

  return (
    <AuthLayout title="Criar conta" subtitle={modality === "PRESENCIAL" ? "Área do aluno/paciente presencial." : "Comece seu acompanhamento contínuo."}>
      <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--sp-5)" }}>
        <fieldset style={{ border: 0, margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
          <legend style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: 6, padding: 0 }}>Qual atendimento você deseja?</legend>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "var(--sp-3)" }}>
            {modalityOptions.map((opt) => {
              const selected = modality === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setModality(opt.value)}
                  aria-pressed={selected}
                  style={{
                    textAlign: "left",
                    cursor: "pointer",
                    padding: "var(--sp-4)",
                    borderRadius: "var(--r-md)",
                    font: "inherit",
                    color: "var(--text-primary)",
                    background: selected ? "var(--bg-card)" : "var(--bg-surface)",
                    border: selected ? "1px solid var(--accent)" : "1px solid var(--border-hairline)",
                  }}
                >
                  <span style={{ display: "block", fontWeight: 600, fontSize: "0.9375rem", marginBottom: 4 }}>
                    {opt.label}
                    {selected ? " ✓" : ""}
                  </span>
                  <span style={{ display: "block", fontSize: "0.75rem", lineHeight: 1.45, color: "var(--text-secondary)" }}>{opt.hint}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
        <TextField label="Nome" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
        <TextField label="E-mail" type="email" placeholder="voce@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        <TextField
          label="Senha"
          type="password"
          placeholder="Mínimo 8 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
        />
        <Button type="submit" disabled={submitting} style={{ height: 48, justifyContent: "center", marginTop: 4 }}>
          {submitting ? "Criando conta…" : "Criar conta"}
        </Button>
        <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--text-tertiary)", fontSize: "0.8125rem" }}>
          <div style={{ flex: 1, height: 1, background: "var(--border-hairline)" }} />
          ou
          <div style={{ flex: 1, height: 1, background: "var(--border-hairline)" }} />
        </div>
        <Button
          variant="secondary"
          href={`${API_URL}/auth/google`}
          onClick={() => savePostAuthRedirect(resolveRedirectTarget(location.search))}
          style={{ height: 48, justifyContent: "center", gap: 10 }}
        >
          <GoogleIcon />
          Continuar com Google
        </Button>
        {appleEnabled && (
          <Button
            variant="secondary"
            href={`${API_URL}/auth/apple`}
            onClick={() => savePostAuthRedirect(resolveRedirectTarget(location.search))}
            style={{ height: 48, justifyContent: "center", gap: 10 }}
          >
            <AppleIcon />
            Continuar com Apple
          </Button>
        )}
        <label style={{ display: "flex", gap: "var(--sp-2)", alignItems: "flex-start", fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: 4 }}>
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ marginTop: 3, accentColor: "var(--accent)" }} />
          <span>
            Li e concordo com a{" "}
            <a href={`${SITE_URL}/politica-de-privacidade`} target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>
              Política de Privacidade
            </a>{" "}
            e o tratamento dos meus dados de saúde conforme a LGPD.
          </span>
        </label>
        {error && <p style={{ color: "var(--danger)", fontSize: "var(--fs-body-sm)", margin: 0 }}>{error}</p>}
      </form>
      <p style={{ textAlign: "center", fontSize: "0.875rem", color: "var(--text-secondary)", margin: 0 }}>
        Já tem conta? <Link to="/entrar" style={{ color: "var(--accent)" }}>Entrar</Link>
      </p>
    </AuthLayout>
  );
}
