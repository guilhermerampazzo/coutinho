import { useState, type FormEvent } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button, GoogleIcon, TextField } from "@couthealth/ui";
import { authApi, ApiError, API_URL, SITE_URL } from "../lib/api";
import { useAuth } from "../lib/auth";
import { resolveRedirectTarget, savePostAuthRedirect, consumePostAuthRedirect } from "../lib/redirect";
import { AuthLayout } from "./AuthLayout";

export function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { setSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!consent) {
      setError("É necessário aceitar o tratamento de dados para criar a conta.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await authApi.register({ name, email, password, consent });
      setSession(res.user, res.tokens.accessToken, res.tokens.refreshToken);
      navigate(consumePostAuthRedirect() ?? resolveRedirectTarget(location.search, res.user.role));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível criar sua conta. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Criar conta" subtitle="Comece seu acompanhamento contínuo.">
      <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--sp-5)" }}>
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
