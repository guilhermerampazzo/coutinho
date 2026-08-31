import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { authApi, type AuthUser } from "./api";

export const ACCESS_KEY = "couthealth.access";
export const REFRESH_KEY = "couthealth.refresh";
const USER_KEY = "couthealth.user";
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

/** Cache do último usuário conhecido — permite reidratar a sessão instantaneamente no boot,
 *  mesmo se a API estiver brevemente fora do ar (não derruba o login por erro transitório). */
function readCachedUser(): AuthUser | null {
  try {
    const raw = safeGet(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}
function writeCachedUser(user: AuthUser | null) {
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  } catch {
    // ignore
  }
}
/** Erro transitório (rede/503) NÃO é credencial inválida — só 401/403 derrubam a sessão. */
function isAuthRejection(err: unknown): boolean {
  const status = (err as { status?: number })?.status;
  return status === 401 || status === 403;
}
function isNetworkError(err: unknown): boolean {
  const status = (err as { status?: number })?.status;
  return status === undefined || status >= 500;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Reidrata imediatamente do cache (se houver tokens) — evita "pedir login" ao abrir nova aba
  // enquanto o /auth/me de validação ainda está em voo ou a API está brevemente indisponível.
  const cached = readCachedUser();
  const bootTokens = safeGet(ACCESS_KEY) && safeGet(REFRESH_KEY);
  const [user, setUser] = useState<AuthUser | null>(bootTokens ? cached : null);
  const [accessToken, setAccessToken] = useState<string | null>(() => safeGet(ACCESS_KEY));
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Busca /auth/me com o token atual; se 401 tenta usar o refresh token (aba nova com access expirado).
  // Se o refresh FALHA por erro de rede/5xx, propaga como erro transitório (não derruba a sessão).
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
          } catch (refreshErr: unknown) {
            const refreshStatus = (refreshErr as { status?: number })?.status;
            // Refresh rejeitado explicitamente (401/403) → sessão mesmo expirada; erro de rede → transitório.
            if (refreshStatus === undefined || refreshStatus >= 500) throw refreshErr;
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
      writeCachedUser(null);
      return;
    }
    if (token !== accessToken) {
      setAccessToken(token);
    }
    // Se já temos user e o token não mudou, mantém; senão revalida.
    // Na prática, sempre revalida quando o token veio de outra aba para garantir dados frescos.
    try {
      const me = await fetchMe(token);
      if (me) {
        setUser(me);
        writeCachedUser(me);
      }
    } catch (err) {
      // Erro transitório (rede/API fora do ar) — mantém a sessão em cache, tenta de novo no próximo foco.
      if (!isAuthRejection(err) && isNetworkError(err)) return;
      safeRemove(ACCESS_KEY);
      safeRemove(REFRESH_KEY);
      writeCachedUser(null);
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
        if (!cancelled) {
          setUser(me);
          writeCachedUser(me);
        }
      } catch (err) {
        // Sessão só é derrubada se o servidor rejeitou explicitamente (401/403 mesmo após refresh).
        // Erro de rede/5xx = API brevemente fora do ar → mantém cache, o usuário continua logado.
        if (!cancelled && !isAuthRejection(err) && isNetworkError(err)) {
          // mantém user/accessToken vindos do cache
        } else {
          safeRemove(ACCESS_KEY);
          safeRemove(REFRESH_KEY);
          writeCachedUser(null);
          if (!cancelled) setAccessToken(null);
          if (!cancelled) setUser(null);
        }
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
          writeCachedUser(msg.user);
        } else if (msg.type === "logout") {
          setAccessToken(null);
          setUser(null);
          writeCachedUser(null);
        } else if (msg.type === "refresh" && msg.access && msg.refresh) {
          setAccessToken(msg.access);
          // user permanece o mesmo; opcionalmente revalidar em background
          void fetchMe(msg.access)
            .then((me) => {
              if (me) {
                setUser(me);
                writeCachedUser(me);
              }
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
    writeCachedUser(nextUser);
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
    writeCachedUser(null);
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
      if (me) {
        setUser(me);
        writeCachedUser(me);
      }
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
