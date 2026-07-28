import { useState, type FormEvent } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button, GoogleIcon, TextField } from "@couthealth/ui";
import { authApi, ApiError, API_URL } from "../lib/api";
import { useAuth } from "../lib/auth";
import { resolveRedirectTarget, savePostAuthRedirect, consumePostAuthRedirect } from "../lib/redirect";
import { AuthLayout } from "./AuthLayout";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { setSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await authApi.login({ email, password });
      setSession(res.user, res.tokens.accessToken, res.tokens.refreshToken);
      navigate(consumePostAuthRedirect() ?? resolveRedirectTarget(location.search, res.user.role));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível entrar. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Entrar" subtitle="Continue seu acompanhamento.">
      <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--sp-5)" }}>
        <TextField label="E-mail" type="email" placeholder="voce@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        <TextField
          label="Senha"
          type="password"
          placeholder="Sua senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
        {error && <p style={{ color: "var(--danger)", fontSize: "var(--fs-body-sm)", margin: 0 }}>{error}</p>}
        <Button type="submit" disabled={submitting} style={{ height: 48, justifyContent: "center" }}>
          {submitting ? "Entrando…" : "Entrar"}
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
      </form>
      <p style={{ textAlign: "center", fontSize: "0.875rem", color: "var(--text-secondary)", margin: 0 }}>
        Não tem conta? <Link to="/criar-conta" style={{ color: "var(--accent)" }}>Criar conta</Link>
      </p>
    </AuthLayout>
  );
}
