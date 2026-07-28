import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authApi } from "../lib/api";
import { useAuth } from "../lib/auth";
import { postAuthPath, consumePostAuthRedirect } from "../lib/redirect";

/** Destino do redirect do Google OAuth (?access=...&refresh=...), ver auth.controller.ts no backend. */
export function AuthCallbackPage() {
  const [params] = useSearchParams();
  const { setSession } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const access = params.get("access");
    const refresh = params.get("refresh");
    if (!access || !refresh) {
      setError("Não foi possível concluir o login com Google.");
      return;
    }
    authApi
      .me(access)
      .then((user) => {
        setSession(user, access, refresh);
        navigate(consumePostAuthRedirect() ?? postAuthPath("", user.role), { replace: true });
      })
      .catch(() => setError("Não foi possível concluir o login com Google."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: error ? "var(--danger)" : "var(--text-secondary)" }}>{error ?? "Entrando…"}</p>
    </main>
  );
}
