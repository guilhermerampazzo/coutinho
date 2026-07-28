import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Button, Card, GoogleIcon, TextField } from "@couthealth/ui";
import { paymentsApi, authApi, ApiError, API_URL, SITE_URL, type CheckoutResponse, type CheckoutConfig } from "../lib/api";
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
  const location = useLocation();

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
        onClick={() => savePostAuthRedirect(location.pathname + location.search)}
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

const MP_SDK_URL = "https://sdk.mercadopago.com/js/v2";

function loadMercadoPagoSdk(): Promise<void> {
  if ((window as any).MercadoPago) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = MP_SDK_URL;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Não foi possível carregar o Mercado Pago."));
    document.body.appendChild(script);
  });
}

export function CheckoutPage() {
  const [params] = useSearchParams();
  const { accessToken, user } = useAuth();
  const navigate = useNavigate();
  const [method, setMethod] = useState<Method>("pix");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckoutResponse | null>(null);
  const [config, setConfig] = useState<CheckoutConfig | null>(null);
  const [brickReady, setBrickReady] = useState(false);
  const brickContainerRef = useRef<HTMLDivElement>(null);
  const brickControllerRef = useRef<any>(null);

  const planCode = (params.get("plano") ?? "").toUpperCase();
  const period = (params.get("periodo") ?? "mensal").toUpperCase();
  const couponCode = params.get("cupom") ?? undefined;
  // Cartão vira assinatura recorrente mensal (cobra o valor mensal todo mês); PIX é pagamento único
  // do período inteiro — ver DECISIONS.md e PaymentsService.checkout().
  const monthlyAmount = Number(params.get("valorMensal") ?? 0) || undefined;
  const totalAmount = Number(params.get("valorTotal") ?? 0) || undefined;

  useEffect(() => {
    paymentsApi.checkoutConfig().then(setConfig).catch(() => setConfig({ provider: "MERCADOPAGO" }));
  }, []);

  // Mercado Pago: monta o Payment Brick (cartão + Google Pay quando o dispositivo é elegível) só
  // quando o método "cartão" está selecionado — PIX continua com o botão simples existente.
  useEffect(() => {
    if (config?.provider !== "MERCADOPAGO" || !config.publicKey || method !== "cartao" || result) return;
    let cancelled = false;

    loadMercadoPagoSdk()
      .then(() => {
        if (cancelled || !brickContainerRef.current) return;
        const mp = new (window as any).MercadoPago(config.publicKey, { locale: "pt-BR" });
        const bricksBuilder = mp.bricks();
        return bricksBuilder.create("payment", "mp-payment-brick", {
          initialization: { amount: monthlyAmount ?? 0 },
          customization: {
            // Assinatura recorrente mensal — sem parcelamento (não combina com cobrança mês a mês).
            paymentMethods: { creditCard: "all", debitCard: "all", googlePay: "all", maxInstallments: 1 },
          },
          callbacks: {
            onReady: () => setBrickReady(true),
            onError: (err: unknown) => setError(err instanceof Error ? err.message : "Erro ao carregar o pagamento."),
            onSubmit: ({ formData }: { formData: any }) =>
              confirm({
                token: formData.token,
                paymentMethodId: formData.payment_method_id,
                installments: formData.installments,
                payerDocNumber: formData.payer?.identification?.number,
              }),
          },
        });
      })
      .then((controller) => {
        if (!cancelled) brickControllerRef.current = controller;
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Erro ao carregar o Mercado Pago."));

    return () => {
      cancelled = true;
      brickControllerRef.current?.unmount?.();
      brickControllerRef.current = null;
      setBrickReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, method, result]);

  async function confirm(mercadoPagoData?: {
    token: string;
    paymentMethodId: string;
    installments: number;
    payerDocNumber?: string;
  }) {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const res = await paymentsApi.checkout(
        {
          planCode,
          period,
          couponCode,
          method,
          ...(mercadoPagoData
            ? {
                token: mercadoPagoData.token,
                paymentMethodId: mercadoPagoData.paymentMethodId,
                installments: mercadoPagoData.installments,
                payerDocNumber: mercadoPagoData.payerDocNumber,
              }
            : {}),
        },
        accessToken
      );
      setResult(res);
      if (res.status === "APPROVED") {
        setTimeout(() => navigate("/anamnese"), 1800);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível processar o pagamento.");
    } finally {
      setLoading(false);
    }
  }

  const showBrick = config?.provider === "MERCADOPAGO" && method === "cartao";

  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--sp-6)" }}>
      <Card style={{ width: "100%", maxWidth: 440, display: "flex", flexDirection: "column", gap: "var(--sp-6)" }}>
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
            {!result && (
              <>
                <div style={{ display: "flex", gap: "var(--sp-3)" }}>
                  <Button variant={method === "pix" ? "primary" : "secondary"} onClick={() => setMethod("pix")} style={{ flex: 1 }}>
                    PIX
                  </Button>
                  <Button variant={method === "cartao" ? "primary" : "secondary"} onClick={() => setMethod("cartao")} style={{ flex: 1 }}>
                    Cartão{config?.provider === "MERCADOPAGO" ? " / Google Pay" : ""}
                  </Button>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-body-sm)", margin: 0 }}>
                  {method === "pix"
                    ? totalAmount != null && `Pagamento único de ${totalAmount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} referente ao período.`
                    : monthlyAmount != null &&
                      `Cobrança mensal recorrente de ${monthlyAmount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}, renovada automaticamente todo mês até o fim do período contratado.`}
                </p>
                {error && <p style={{ color: "var(--danger)", fontSize: "var(--fs-body-sm)", margin: 0 }}>{error}</p>}

                {showBrick ? (
                  <div id="mp-payment-brick" ref={brickContainerRef} />
                ) : (
                  <Button onClick={() => confirm()} disabled={loading}>
                    {loading ? "Processando…" : "Confirmar pagamento"}
                  </Button>
                )}
                {showBrick && !brickReady && (
                  <p style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-body-sm)", margin: 0 }}>Carregando opções de pagamento…</p>
                )}
              </>
            )}

            {result && result.status === "APPROVED" && (
              <div style={{ textAlign: "center" }}>
                <p style={{ color: "var(--success)", fontWeight: 600 }}>Pagamento aprovado! Sua conta foi liberada.</p>
                <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-body-sm)" }}>Redirecionando para a anamnese…</p>
              </div>
            )}

            {result && result.status === "PENDING" && result.pixQrCode && (
              <div style={{ textAlign: "center" }}>
                <p style={{ color: "var(--text-secondary)" }}>Escaneie o QR code do PIX para pagar:</p>
                {result.pixQrCodeImage && (
                  <img
                    src={`data:image/png;base64,${result.pixQrCodeImage}`}
                    alt="QR code PIX"
                    style={{ width: 220, height: 220, margin: "0 auto", display: "block" }}
                  />
                )}
                <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-body-sm)", margin: "12px 0 4px" }}>
                  Ou copie o código PIX:
                </p>
                <p style={{ wordBreak: "break-all", fontSize: "var(--fs-caption)", color: "var(--text-tertiary)" }}>{result.pixQrCode}</p>
              </div>
            )}

            {result && result.status === "PENDING" && result.checkoutUrl && (
              <div style={{ textAlign: "center" }}>
                <p style={{ color: "var(--text-secondary)" }}>Finalize o pagamento para liberar sua conta:</p>
                <Button href={result.checkoutUrl} target="_blank" rel="noreferrer">
                  Ir para o pagamento
                </Button>
              </div>
            )}

            {result && result.status === "FAILED" && (
              <p style={{ color: "var(--danger)", textAlign: "center" }}>Pagamento recusado. Tente outro método ou cartão.</p>
            )}
          </>
        )}
      </Card>
    </main>
  );
}
