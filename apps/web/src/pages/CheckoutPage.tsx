import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { loadStripe, type Stripe, type StripeEmbeddedCheckout } from "@stripe/stripe-js";
import { Button, Card, GoogleIcon, TextField } from "@couthealth/ui";
import {
  paymentsApi,
  authApi,
  ApiError,
  API_URL,
  SITE_URL,
  type CheckoutResponse,
  type PixStatusResponse,
  type PixPaymentInfo,
} from "../lib/api";
import { useAuth } from "../lib/auth";
import { savePostAuthRedirect } from "../lib/redirect";

type AuthMode = "criar" | "entrar";

/** Cadastro/login embutido no checkout — contratação acontece antes do cadastro (Iniciar plano →
 * Contratação → Cadastro → Anamnese → Liberação). Só aparece se o visitante ainda não tem sessão. */
function InlineAuth({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<AuthMode>("criar");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { setSession } = useAuth();
  const { pathname, search } = window.location;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (mode === "criar" && !consent) {
      setError("É necessário aceitar o tratamento de dados para criar a conta.");
      return;
    }
    setSubmitting(true);
    try {
      const res =
        mode === "criar"
          ? await authApi.register({ name, email, password, consent })
          : await authApi.login({ email, password });
      setSession(res.user, res.tokens.accessToken, res.tokens.refreshToken);
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível continuar. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
      <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-body-sm)", margin: 0 }}>
        {mode === "criar" ? "Crie sua conta para concluir a contratação." : "Entre na sua conta para concluir a contratação."}
      </p>
      <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
        {mode === "criar" && (
          <TextField label="Nome" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
        )}
        <TextField label="E-mail" type="email" placeholder="voce@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        <TextField
          label="Senha"
          type="password"
          placeholder={mode === "criar" ? "Mínimo 8 caracteres" : "Sua senha"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={mode === "criar" ? 8 : undefined}
          autoComplete={mode === "criar" ? "new-password" : "current-password"}
        />
        {mode === "criar" && (
          <label style={{ display: "flex", gap: "var(--sp-2)", alignItems: "flex-start", fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ marginTop: 3, accentColor: "var(--accent)" }} />
            <span>
              Li e concordo com a{" "}
              <a href={`${SITE_URL}/politica-de-privacidade`} target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>
                Política de Privacidade
              </a>{" "}
              e o tratamento dos meus dados de saúde conforme a LGPD.
            </span>
          </label>
        )}
        {error && <p style={{ color: "var(--danger)", fontSize: "var(--fs-body-sm)", margin: 0 }}>{error}</p>}
        <Button type="submit" disabled={submitting} style={{ height: 48, justifyContent: "center" }}>
          {submitting ? "Enviando…" : mode === "criar" ? "Criar conta e continuar" : "Entrar e continuar"}
        </Button>
      </form>
      <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--text-tertiary)", fontSize: "0.8125rem" }}>
        <div style={{ flex: 1, height: 1, background: "var(--border-hairline)" }} />
        ou
        <div style={{ flex: 1, height: 1, background: "var(--border-hairline)" }} />
      </div>
      <Button
        variant="secondary"
        href={`${API_URL}/auth/google`}
        onClick={() => savePostAuthRedirect(`${pathname}${search}`)}
        style={{ height: 48, justifyContent: "center", gap: 10 }}
      >
        <GoogleIcon />
        Continuar com Google
      </Button>
      <p style={{ textAlign: "center", fontSize: "0.8125rem", color: "var(--text-secondary)", margin: 0 }}>
        {mode === "criar" ? (
          <>
            Já tem conta?{" "}
            <button type="button" onClick={() => setMode("entrar")} style={{ background: "none", border: 0, color: "var(--accent)", cursor: "pointer", padding: 0, font: "inherit" }}>
              Entrar
            </button>
          </>
        ) : (
          <>
            Não tem conta?{" "}
            <button type="button" onClick={() => setMode("criar")} style={{ background: "none", border: 0, color: "var(--accent)", cursor: "pointer", padding: 0, font: "inherit" }}>
              Criar conta
            </button>
          </>
        )}
      </p>
    </div>
  );
}

type Method = "pix" | "cartao";
type PixPhase = "loading" | "pending" | "paid" | "expired" | "error";

interface PixData extends PixPaymentInfo {
  subscriptionId: string;
  amount: number;
}

const PIX_POLL_MS = 4000;
/** Chave do localStorage que permite retomar o PIX pendente após recarregar a página (item 10). */
const PIX_RESUME_KEY = "couthealth:pix-pending";

function formatCountdown(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatLastCheck(ts: number) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 5) return "agora mesmo";
  return `há ${diff}s`;
}

/** Barra de etapas do processo (item 6). */
function ProgressSteps({ phase }: { phase: PixPhase }) {
  const steps = ["QR Code gerado", "Aguardando pagamento", "Liberando acesso", "Redirecionando"];
  const idx = phase === "loading" ? 0 : phase === "pending" ? 1 : phase === "paid" ? 4 : phase === "expired" ? 1 : 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {steps.map((label, i) => {
        const done = i < idx;
        const current = i === idx;
        const error = phase === "expired" && i === 1;
        return (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                width: 20,
                height: 20,
                borderRadius: "var(--r-full)",
                display: "grid",
                placeItems: "center",
                fontSize: 10,
                fontWeight: 700,
                background: error ? "var(--danger)" : done ? "var(--success)" : current ? "rgba(247,190,0,0.15)" : "var(--ink-600)",
                color: done || error ? "#fff" : current ? "var(--accent)" : "var(--text-tertiary)",
                border: current && !done ? "1px solid var(--accent)" : "none",
              }}
            >
              {done ? "✓" : error ? "✕" : i + 1}
            </span>
            <span
              style={{
                fontSize: "var(--fs-body-sm)",
                color: current ? "var(--text-primary)" : "var(--text-tertiary)",
                fontWeight: current ? 600 : 400,
              }}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function statusMeta(phase: PixPhase, checking: boolean): { color: string; label: string } {
  if (phase === "loading") return { color: "var(--info)", label: "🔄 Gerando QR Code…" };
  if (phase === "pending") return { color: "var(--accent)", label: checking ? "🔄 Verificando pagamento…" : "🟡 Aguardando pagamento" };
  if (phase === "paid") return { color: "var(--success)", label: "🟢 Pagamento confirmado" };
  if (phase === "expired") return { color: "var(--danger)", label: "🔴 Pagamento expirado" };
  return { color: "var(--danger)", label: "Erro" };
}

const FAQ_MINI = [
  {
    q: "O que acontece após o pagamento?",
    a: "Sua conta é liberada na hora e você parte para a anamnese — o formulário inicial que permite montar seu plano personalizado.",
  },
  {
    q: "Como funciona a plataforma?",
    a: "Cadastro → anamnese → análise profissional → plano alimentar e treino publicados por um profissional → acompanhamento contínuo.",
  },
  {
    q: "Meu pagamento foi confirmado mas não liberou?",
    a: "Não se preocupe: a liberação é automática assim que o pagamento é confirmado. Toque em 'Já paguei' para forçar uma nova verificação.",
  },
];

export function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const { accessToken, user } = useAuth();
  const navigate = useNavigate();

  const [method, setMethod] = useState<Method>("pix");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  // Estado do PIX customizado
  const [pix, setPix] = useState<{ phase: PixPhase; data?: PixData; message?: string }>({ phase: "loading" });
  const [remaining, setRemaining] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);
  const [connectionLost, setConnectionLost] = useState(false);
  const [redirectSec, setRedirectSec] = useState(3);
  const [lastCheckAt, setLastCheckAt] = useState<number | null>(null);
  // Estado do cartão (Embedded Checkout)
  const [sessionInfo, setSessionInfo] = useState<{ method: Method; checkout: CheckoutResponse } | null>(null);
  const [successTimedOut, setSuccessTimedOut] = useState(false);

  const stripeRef = useRef<Stripe | null>(null);
  const embeddedRef = useRef<StripeEmbeddedCheckout | null>(null);
  const pixDataRef = useRef<PixData | null>(null);
  const pixInitRef = useRef(false);

  const planCode = (searchParams.get("plano") ?? "").toUpperCase();
  const period = (searchParams.get("periodo") ?? "mensal").toUpperCase();
  const couponCode = searchParams.get("cupom") ?? undefined;
  // Cartão vira assinatura recorrente mensal; PIX é pagamento único do período. Só para exibição:
  // o valor cobrado é calculado pela API (fonte da verdade).
  const monthlyAmount = Number(searchParams.get("valorMensal") ?? 0) || undefined;
  const totalAmount = Number(searchParams.get("valorTotal") ?? 0) || undefined;
  const success = searchParams.get("success") === "1";

  // ---------- Lógica compartilhada de status do PIX ----------
  function applyStatus(res: PixStatusResponse) {
    if (res.status === "paid") {
      localStorage.removeItem(PIX_RESUME_KEY);
      setPix((prev) => ({ ...prev, phase: "paid" }));
      return;
    }
    if (res.status === "expired") {
      localStorage.removeItem(PIX_RESUME_KEY);
      setPix((prev) => ({ ...prev, phase: "expired" }));
      return;
    }
    setLastCheckAt(Date.now());
    setPix((prev) => ({
      ...prev,
      phase: "pending",
      data: prev.data && res.expiresAt ? { ...prev.data, expiresAt: res.expiresAt } : prev.data,
    }));
  }

  async function createNewPix() {
    setPix({ phase: "loading" });
    setError(null);
    try {
      const res = await paymentsApi.checkout({ planCode, period, couponCode, method: "pix" }, accessToken!);
      if (!res.pix) throw new ApiError("Resposta de pagamento inválida.", 500);
      pixDataRef.current = { subscriptionId: res.subscriptionId, ...res.pix, amount: res.amount };
      localStorage.setItem(PIX_RESUME_KEY, res.subscriptionId);
      setPix({ phase: "pending", data: pixDataRef.current });
    } catch (err) {
      setPix({ phase: "error", message: err instanceof ApiError ? err.message : "Não foi possível gerar o PIX." });
    }
  }

  /** Retoma um PIX pendente (persistência, item 10) ou cria um novo. */
  async function resumeOrCreate() {
    const persisted = localStorage.getItem(PIX_RESUME_KEY);
    if (persisted) {
      try {
        const res = await paymentsApi.pixStatus(persisted, accessToken!);
        if (res.status === "pending" && res.qrCodeImageUrl && res.expiresAt) {
          pixDataRef.current = {
            subscriptionId: persisted,
            qrCode: res.qrCode ?? "",
            qrCodeImageUrl: res.qrCodeImageUrl,
            hostedInstructionsUrl: res.hostedInstructionsUrl,
            expiresAt: res.expiresAt,
            amount: res.amount ?? 0,
          };
          setPix({ phase: "pending", data: pixDataRef.current });
          return;
        }
        if (res.status === "paid" || res.status === "expired") {
          applyStatus(res);
          return;
        }
      } catch {
        // offline ou dado inválido — tenta criar um novo
      }
      localStorage.removeItem(PIX_RESUME_KEY);
    }
    await createNewPix();
  }

  // ---------- Cartão: carrega Stripe.js (public key) ----------
  useEffect(() => {
    let cancelled = false;
    paymentsApi
      .checkoutConfig()
      .then(async (cfg) => {
        if (cancelled) return;
        if (cfg.provider !== "STRIPE" || !cfg.publicKey) {
          setError("Gateway de pagamento não configurado.");
          return;
        }
        const stripe = await loadStripe(cfg.publicKey);
        if (cancelled) return;
        stripeRef.current = stripe;
      })
      .catch(() => setError("Não foi possível carregar o pagamento."));
    return () => {
      cancelled = true;
    };
  }, []);

  // ---------- PIX: inicializa (cria ou retoma) ----------
  useEffect(() => {
    if (method !== "pix" || !user || !accessToken) return;
    if (pixInitRef.current) return;
    pixInitRef.current = true;
    void resumeOrCreate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method, user, accessToken]);

  // ---------- PIX: polling automático (a cada 4s) ----------
  useEffect(() => {
    if (pix.phase !== "pending" || !pix.data?.subscriptionId) return;
    const id = pix.data.subscriptionId;
    const tick = async () => {
      try {
        const res = await paymentsApi.pixStatus(id, accessToken!);
        setConnectionLost(false);
        applyStatus(res);
      } catch {
        setConnectionLost(true);
      } finally {
        setChecking(false);
      }
    };
    void tick();
    const t = setInterval(() => void tick(), PIX_POLL_MS);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pix.phase, pix.data?.subscriptionId, accessToken]);

  // ---------- PIX: countdown do QR ----------
  useEffect(() => {
    if (pix.phase !== "pending" || !pix.data?.expiresAt) return;
    const target = pix.data.expiresAt * 1000;
    const upd = () => {
      const left = Math.max(0, Math.floor((target - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) setPix((prev) => (prev.phase === "pending" ? { phase: "expired" } : prev));
    };
    upd();
    const t = setInterval(upd, 1000);
    return () => clearInterval(t);
  }, [pix.phase, pix.data?.expiresAt]);

  // ---------- PIX: confirmação + redirecionamento (3...2...1) ----------
  useEffect(() => {
    if (pix.phase !== "paid") return;
    let s = 3;
    setRedirectSec(s);
    const t = setInterval(() => {
      s -= 1;
      setRedirectSec(Math.max(0, s));
      if (s <= 0) {
        clearInterval(t);
        navigate("/anamnese", { replace: true });
      }
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pix.phase]);

  // ---------- Detecção de perda de conexão ----------
  useEffect(() => {
    const off = () => setConnectionLost(true);
    const on = () => setConnectionLost(false);
    window.addEventListener("offline", off);
    window.addEventListener("online", on);
    return () => {
      window.removeEventListener("offline", off);
      window.removeEventListener("online", on);
    };
  }, []);

  // ---------- Cartão: monta o Embedded Checkout ----------
  useEffect(() => {
    if (method !== "cartao" || !user || !stripeRef.current || !accessToken || success) return;
    if (sessionInfo && sessionInfo.method === method) return;
    let cancelled = false;
    const token = accessToken;
    const stripe = stripeRef.current;

    async function build() {
      setCreating(true);
      setError(null);
      setSessionInfo(null);
      try {
        const res = await paymentsApi.checkout({ planCode, period, couponCode, method: "cartao" }, token);
        if (cancelled) return;
        if (!res.clientSecret) throw new ApiError("Resposta de pagamento inválida.", 500);
        const embedded = await stripe.createEmbeddedCheckoutPage({
          clientSecret: res.clientSecret,
          onComplete: () => undefined,
        });
        if (cancelled) {
          embedded.destroy();
          return;
        }
        embeddedRef.current = embedded;
        setSessionInfo({ method, checkout: res });
        embedded.mount("#embedded-checkout");
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Não foi possível iniciar o pagamento.");
        }
      } finally {
        if (!cancelled) setCreating(false);
      }
    }
    build();

    return () => {
      cancelled = true;
      embeddedRef.current?.destroy();
      embeddedRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method, user, accessToken, success]);

  // ---------- Cartão: volta do Stripe (?success=1) aguarda ativação ----------
  useEffect(() => {
    if (!success || !accessToken) return;
    let attempts = 0;
    const poll = setInterval(async () => {
      attempts++;
      try {
        const me = await authApi.me(accessToken);
        if (me.hasActiveSubscription) {
          clearInterval(poll);
          navigate("/anamnese", { replace: true });
          return;
        }
      } catch {
        // token pode ter expirado; segue tentando
      }
      if (attempts >= 15) {
        clearInterval(poll);
        setSuccessTimedOut(true);
      }
    }, 2000);
    return () => clearInterval(poll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success, accessToken]);

  // ---------- Ações manuais do PIX ----------
  async function manualVerify() {
    const id = pix.data?.subscriptionId;
    if (!id || checking) return;
    setChecking(true);
    try {
      const res = await paymentsApi.pixStatus(id, accessToken!);
      setConnectionLost(false);
      applyStatus(res);
    } catch {
      setConnectionLost(true);
    } finally {
      setChecking(false);
    }
  }

  async function copyPix() {
    if (!pix.data?.qrCode) return;
    try {
      await navigator.clipboard.writeText(pix.data.qrCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard pode não estar disponível
    }
  }

  async function regeneratePix() {
    const id = pix.data?.subscriptionId;
    if (!id) return;
    setPix({ phase: "loading" });
    try {
      const res = await paymentsApi.regeneratePix(id, accessToken!);
      if (!res.pix) throw new ApiError("Resposta de pagamento inválida.", 500);
      pixDataRef.current = { subscriptionId: id, ...res.pix, amount: res.amount };
      localStorage.setItem(PIX_RESUME_KEY, id);
      setPix({ phase: "pending", data: pixDataRef.current });
    } catch (err) {
      setPix({ phase: "error", message: err instanceof ApiError ? err.message : "Não foi possível gerar um novo PIX." });
    }
  }

  function retryPix() {
    pixInitRef.current = false;
    setPix({ phase: "loading" });
    void resumeOrCreate();
  }

  const status = statusMeta(pix.phase, checking);

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "var(--sp-6)" }}>
      {/* Menu mínimo durante o checkout (item 8) */}
      <header style={{ width: "100%", maxWidth: 480, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-6)" }}>
        <span className="display" style={{ fontSize: "var(--fs-title-lg)" }}>
          CoutHealth
        </span>
        <a href={SITE_URL} style={{ color: "var(--text-secondary)", fontSize: "var(--fs-body-sm)" }}>
          ← Voltar ao site
        </a>
      </header>

      <Card style={{ width: "100%", maxWidth: 480, display: "flex", flexDirection: "column", gap: "var(--sp-6)" }}>
        <div>
          <h1 className="display" style={{ fontSize: "var(--fs-title-lg)", margin: 0 }}>
            Pagamento
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-body-sm)", margin: "8px 0 0" }}>
            Plano {planCode} · {period.toLowerCase()}
          </p>
        </div>

        {!user ? (
          <InlineAuth onDone={() => {}} />
        ) : (
          <>
            {!success && (
              <>
                <div style={{ display: "flex", gap: "var(--sp-3)" }}>
                  <Button variant={method === "pix" ? "primary" : "secondary"} onClick={() => setMethod("pix")} style={{ flex: 1 }}>
                    PIX
                  </Button>
                  <Button variant={method === "cartao" ? "primary" : "secondary"} onClick={() => setMethod("cartao")} style={{ flex: 1 }}>
                    Cartão
                  </Button>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-body-sm)", margin: 0 }}>
                  {method === "pix"
                    ? totalAmount != null && `Pagamento único de ${totalAmount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} referente ao período.`
                    : "Sua assinatura será renovada automaticamente conforme o período escolhido. Você pode gerenciar ou cancelar a renovação a qualquer momento pela sua conta."}
                </p>
                {error && <p style={{ color: "var(--danger)", fontSize: "var(--fs-body-sm)", margin: 0 }}>{error}</p>}

                {/* ---------------- Tela PIX customizada ---------------- */}
                {method === "pix" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-5)" }}>
                    <ProgressSteps phase={pix.phase} />

                    <p style={{ fontWeight: 600, color: status.color, margin: 0 }}>{status.label}</p>

                    {pix.phase === "loading" && (
                      <p style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-body-sm)", margin: 0 }}>Gerando seu QR Code…</p>
                    )}

                    {(pix.phase === "pending" || pix.phase === "paid") && pix.data && (
                      <>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--sp-4)" }}>
                          <div style={{ background: "#fff", padding: 12, borderRadius: "var(--r-md)" }}>
                            <img src={pix.data.qrCodeImageUrl} alt="QR Code PIX" width={220} height={220} style={{ display: "block" }} />
                          </div>
                          <p style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-caption)", margin: 0, textAlign: "center" }}>
                            Escaneie com o app do seu banco ou copie o código PIX abaixo.
                          </p>
                          {pix.phase === "pending" && (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                width: "100%",
                                background: "var(--bg-surface)",
                                border: "1px solid var(--border-hairline)",
                                borderRadius: "var(--r-md)",
                                padding: "10px 12px",
                              }}
                            >
                              <span
                                style={{
                                  flex: 1,
                                  fontSize: "0.72rem",
                                  color: "var(--text-tertiary)",
                                  wordBreak: "break-all",
                                  fontFamily: "monospace",
                                  maxHeight: 40,
                                  overflow: "hidden",
                                }}
                              >
                                {pix.data.qrCode}
                              </span>
                              <Button variant="secondary" onClick={copyPix} style={{ height: 36, padding: "0 14px", fontSize: "var(--fs-caption)", whiteSpace: "nowrap" }}>
                                {copied ? "Copiado ✓" : "📋 Copiar"}
                              </Button>
                            </div>
                          )}
                          {pix.phase === "pending" && remaining != null && (
                            <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-caption)", margin: 0 }}>
                              O QR expira em <b>{formatCountdown(remaining)}</b>
                            </p>
                          )}
                        </div>

                        {pix.phase === "pending" && lastCheckAt && (
                          <p style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-caption)", margin: 0, textAlign: "center" }}>
                            Última verificação: {formatLastCheck(lastCheckAt)}
                          </p>
                        )}

                        {pix.phase === "pending" && connectionLost && (
                          <p style={{ color: "var(--info)", fontSize: "var(--fs-body-sm)", margin: 0, textAlign: "center" }}>
                            Sua conexão parece estar instável. Se você já realizou o pagamento, ele não será perdido. Assim que a conexão voltar, toque em "Verificar pagamento".
                          </p>
                        )}

                        {pix.phase === "pending" && (
                          <>
                            <div style={{ display: "flex", gap: "var(--sp-3)", flexWrap: "wrap" }}>
                              <Button onClick={manualVerify} disabled={checking} style={{ flex: 1, justifyContent: "center" }}>
                                {checking ? "Verificando…" : "Já paguei"}
                              </Button>
                            </div>
                            {/* Aproveita o tempo de espera (item 11) */}
                            <details style={{ borderTop: "1px solid var(--border-hairline)", paddingTop: "var(--sp-4)" }}>
                              <summary style={{ cursor: "pointer", fontSize: "var(--fs-body-sm)", color: "var(--text-secondary)" }}>
                                Enquanto aguarda, saiba mais sobre a plataforma
                              </summary>
                              <div style={{ marginTop: "var(--sp-4)", display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
                                {FAQ_MINI.map((f) => (
                                  <div key={f.q}>
                                    <p style={{ margin: "0 0 4px", fontWeight: 600, fontSize: "var(--fs-body-sm)" }}>{f.q}</p>
                                    <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "var(--fs-body-sm)" }}>{f.a}</p>
                                  </div>
                                ))}
                              </div>
                            </details>
                          </>
                        )}

                        {pix.phase === "paid" && (
                          <div style={{ textAlign: "center" }}>
                            <p style={{ color: "var(--success)", fontWeight: 600, margin: 0 }}>✅ Pagamento confirmado!</p>
                            <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-body-sm)", margin: "8px 0 0" }}>
                              Estamos criando seu acesso… Redirecionando em {redirectSec}…
                            </p>
                          </div>
                        )}
                      </>
                    )}

                    {pix.phase === "expired" && (
                      <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
                        <p style={{ color: "var(--danger)", fontWeight: 600, margin: 0 }}>🔴 Pagamento expirado</p>
                        <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-body-sm)", margin: 0 }}>
                          O QR Code expirou. Gere um novo para concluir o pagamento — o valor e o período continuam os mesmos.
                        </p>
                        <Button onClick={regeneratePix} style={{ justifyContent: "center" }}>
                          Gerar novo QR Code
                        </Button>
                      </div>
                    )}

                    {pix.phase === "error" && (
                      <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
                        <p style={{ color: "var(--danger)", margin: 0 }}>{pix.message}</p>
                        <Button onClick={retryPix} style={{ justifyContent: "center" }}>
                          Tentar novamente
                        </Button>
                      </div>
                    )}

                    {/* Atalhos úteis (item 7) */}
                    <div style={{ display: "flex", gap: "var(--sp-3)", flexWrap: "wrap" }}>
                      <Button variant="secondary" href="/" style={{ flex: 1, justifyContent: "center" }}>
                        🏠 Voltar ao início
                      </Button>
                      <Button variant="secondary" href="mailto:rafael@couthealth.com.br" style={{ flex: 1, justifyContent: "center" }}>
                        💬 Falar com o suporte
                      </Button>
                    </div>
                  </div>
                )}

                {/* ---------------- Cartão: Embedded Checkout ---------------- */}
                {method === "cartao" && (
                  <>
                    {creating && (
                      <p style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-body-sm)", margin: 0 }}>Preparando o pagamento…</p>
                    )}
                    <div id="embedded-checkout" style={{ minHeight: 320 }} />
                    <p style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-caption)", margin: 0, textAlign: "center" }}>
                      🔒 Pagamento processado com segurança pela Stripe. Seus dados são protegidos e criptografados.
                    </p>
                  </>
                )}
              </>
            )}

            {success && (
              <div style={{ textAlign: "center" }}>
                <p style={{ color: "var(--success)", fontWeight: 600 }}>Pagamento confirmado!</p>
                <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-body-sm)" }}>
                  {successTimedOut
                    ? "Sua conta está sendo liberada. Assim que o pagamento for confirmado, você poderá continuar."
                    : "Sua conta está sendo liberada… você será direcionado para a anamnese."}
                </p>
                {successTimedOut && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setSuccessTimedOut(false);
                      navigate("/app", { replace: true });
                    }}
                  >
                    Ir para o app
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </Card>
    </main>
  );
}
