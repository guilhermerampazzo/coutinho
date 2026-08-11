import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { authApi, type AuthUser } from "./api";

const ACCESS_KEY = "couthealth.access";
const REFRESH_KEY = "couthealth.refresh";

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  loading: boolean;
  setSession: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  /**
   * Busca /auth/me com o token atual e atualiza o `user` no contexto (sem trocar tokens).
   * Usado depois do pagamento: o `hasActiveSubscription` do contexto fica stale (o usuário
   * foi criado sem assinatura) e o ProtectedRoute redirecionaria de volta para /planos.
   */
  refreshUser: () => Promise<AuthUser | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(() => localStorage.getItem(ACCESS_KEY));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(ACCESS_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me(token)
      .then(setUser)
      .catch(() => {
        localStorage.removeItem(ACCESS_KEY);
        localStorage.removeItem(REFRESH_KEY);
        setAccessToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  function setSession(nextUser: AuthUser, access: string, refresh: string) {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
    setAccessToken(access);
    setUser(nextUser);
  }

  function logout() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    setAccessToken(null);
    setUser(null);
  }

  async function refreshUser() {
    const token = localStorage.getItem(ACCESS_KEY);
    if (!token) return null;
    try {
      const me = await authApi.me(token);
      setUser(me);
      return me;
    } catch {
      return null;
    }
  }

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, setSession, logout, refreshUser }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  return ctx;
}
