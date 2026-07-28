const POST_AUTH_REDIRECT_KEY = "couthealth.postAuthRedirect";

/**
 * Após login/cadastro: profissionais vão direto pro painel admin (nunca têm
 * plano pra escolher); clientes seguem pro CTA de plano (se veio de um) ou
 * pro dashboard.
 */
export function postAuthPath(search: string, role?: "CLIENT" | "PROFESSIONAL"): string {
  if (role === "PROFESSIONAL") {
    return "/admin";
  }
  const params = new URLSearchParams(search);
  const plano = params.get("plano");
  const periodo = params.get("periodo");
  if (plano) {
    return `/planos?plano=${plano}${periodo ? `&periodo=${periodo}` : ""}`;
  }
  return "/app";
}

/** Prioriza um `?redirect=` explícito (ex.: vindo do ProtectedRoute ou de "Já tem conta?" no checkout). */
export function resolveRedirectTarget(search: string, role?: "CLIENT" | "PROFESSIONAL"): string {
  const params = new URLSearchParams(search);
  const redirect = params.get("redirect");
  if (redirect) return decodeURIComponent(redirect);
  return postAuthPath(search, role);
}

/**
 * Guarda o caminho atual (ex.: /checkout?plano=...) antes de sair da SPA pro OAuth do Google —
 * o full-page redirect perde o estado do React Router, então usamos localStorage (sobrevive
 * à volta pro mesmo domínio) pra retomar o fluxo (ex.: contratação) de onde parou.
 */
export function savePostAuthRedirect(path: string) {
  localStorage.setItem(POST_AUTH_REDIRECT_KEY, path);
}

/** Lê e limpa o redirect salvo — usado uma única vez, logo após o login/cadastro. */
export function consumePostAuthRedirect(): string | null {
  const path = localStorage.getItem(POST_AUTH_REDIRECT_KEY);
  if (path) localStorage.removeItem(POST_AUTH_REDIRECT_KEY);
  return path;
}
