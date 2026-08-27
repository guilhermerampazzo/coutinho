import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { authApi, type AuthUser } from "./api";

export const ACCESS_KEY = "couthealth.access";
export const REFRESH_KEY = "couthealth.refresh";
const CHANNEL_NAME = "couthealth-auth";

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  loading: boolean;
  setSession: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  refreshUser: () => Promise<AuthUser | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // storage indisponível (ex.: modo privado restrito) — segue apenas em memória
  }
}
function safeRemove(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(() => safeGet(ACCESS_KEY));
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Busca /auth/me com o token atual; se 401 tenta usar o refresh token (aba nova com access expirado)
  const fetchMe = useCallback(async (token: string | null): Promise<AuthUser | null> => {
    if (!token) return null;
    try {
      return await authApi.me(token);
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 401) {
        const refresh = safeGet(REFRESH_KEY);
        if (refresh) {
          try {
            const refreshed = await authApi.refresh(refresh);
            safeSet(ACCESS_KEY, refreshed.tokens.accessToken);
            safeSet(REFRESH_KEY, refreshed.tokens.refreshToken);
            setAccessToken(refreshed.tokens.accessToken);
            // Notifica outras abas que o token foi renovado
            try {
              channelRef.current?.postMessage({ type: "refresh", access: refreshed.tokens.accessToken, refresh: refreshed.tokens.refreshToken });
              window.dispatchEvent(new Event("couthealth:tokens-updated"));
            } catch {
              // ignore
            }
            return await authApi.me(refreshed.tokens.accessToken);
          } catch {
            // refresh falhou — desloga
          }
        }
      }
      throw err;
    }
  }, []);

  const syncFromStorage = useCallback(async () => {
    const token = safeGet(ACCESS_KEY);
    // Se o token em memória já é o mesmo do storage, nada a fazer — evita loop
    // Mas precisamos garantir que o `user` esteja carregado (aba recém-aberta)
    if (!token) {
      setAccessToken(null);
      setUser(null);
      return;
    }
    if (token !== accessToken) {
      setAccessToken(token);
    }
    // Se já temos user e o token não mudou, mantém; senão revalida.
    // Na prática, sempre revalida quando o token veio de outra aba para garantir dados frescos.
    try {
      const me = await fetchMe(token);
      if (me) setUser(me);
    } catch {
      safeRemove(ACCESS_KEY);
      safeRemove(REFRESH_KEY);
      setAccessToken(null);
      setUser(null);
    }
  }, [accessToken, fetchMe]);

  // Carga inicial — lê localStorage (compartilhado entre abas no mesmo origin) e valida
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = safeGet(ACCESS_KEY);
      if (!token) {
        if (!cancelled) setLoading(false);
        return;
      }
      try {
        const me = await fetchMe(token);
        if (!cancelled) setUser(me);
      } catch {
        safeRemove(ACCESS_KEY);
        safeRemove(REFRESH_KEY);
        if (!cancelled) setAccessToken(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchMe]);

  // Canal entre abas (BroadcastChannel) — imediato, sem depender do polling do storage event
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    try {
      const ch = new BroadcastChannel(CHANNEL_NAME);
      channelRef.current = ch;
      ch.onmessage = (ev: MessageEvent<{ type: string; access?: string; refresh?: string; user?: AuthUser }>) => {
        const msg = ev.data;
        if (!msg || typeof msg.type !== "string") return;
        if (msg.type === "login" && msg.access && msg.refresh && msg.user) {
          setAccessToken(msg.access);
          setUser(msg.user);
        } else if (msg.type === "logout") {
          setAccessToken(null);
          setUser(null);
        } else if (msg.type === "refresh" && msg.access && msg.refresh) {
          setAccessToken(msg.access);
          // user permanece o mesmo; opcionalmente revalidar em background
          void fetchMe(msg.access)
            .then((me) => {
              if (me) setUser(me);
            })
            .catch(() => {});
        } else if (msg.type === "sync-request") {
          // Uma aba nova pediu o estado atual — se estamos logados, respondemos
          const tok = safeGet(ACCESS_KEY);
          const ref = safeGet(REFRESH_KEY);
          if (tok && ref && user) {
            ch.postMessage({ type: "login", access: tok, refresh: ref, user });
          }
        }
      };
      // Aba nova pede sync para o caso de storage event não ter disparado ainda
      ch.postMessage({ type: "sync-request" });
      return () => {
        ch.close();
        channelRef.current = null;
      };
    } catch {
      // BroadcastChannel indisponível — segue apenas com storage event
    }
  }, [fetchMe, user]);

  // storage event — dispara nas OUTRAS abas quando uma aba escreve em localStorage
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== ACCESS_KEY && e.key !== REFRESH_KEY) return;
      void syncFromStorage();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [syncFromStorage]);

  // focus / visibility — cobre casos onde storage event foi perdido (ex.: Safari, aba em background)
  useEffect(() => {
    const onFocus = () => void syncFromStorage();
    const onVisibility = () => {
      if (document.visibilityState === "visible") void syncFromStorage();
    };
    const onTokensUpdated = () => {
      const tok = safeGet(ACCESS_KEY);
      if (tok) setAccessToken(tok);
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("couthealth:tokens-updated", onTokensUpdated);
    window.addEventListener("pageshow", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("couthealth:tokens-updated", onTokensUpdated);
      window.removeEventListener("pageshow", onFocus);
    };
  }, [syncFromStorage]);

  function setSession(nextUser: AuthUser, access: string, refresh: string) {
    safeSet(ACCESS_KEY, access);
    safeSet(REFRESH_KEY, refresh);
    setAccessToken(access);
    setUser(nextUser);
    try {
      channelRef.current?.postMessage({ type: "login", access, refresh, user: nextUser });
    } catch {
      // ignore
    }
  }

  function logout() {
    safeRemove(ACCESS_KEY);
    safeRemove(REFRESH_KEY);
    setAccessToken(null);
    setUser(null);
    try {
      channelRef.current?.postMessage({ type: "logout" });
    } catch {
      // ignore
    }
  }

  async function refreshUser() {
    const token = safeGet(ACCESS_KEY);
    if (!token) return null;
    try {
      const me = await fetchMe(token);
      if (me) setUser(me);
      return me;
    } catch {
      return null;
    }
  }

  return <AuthContext.Provider value={{ user, accessToken, loading, setSession, logout, refreshUser }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  return ctx;
}
