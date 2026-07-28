import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button, PeriodToggle, PlanCard, TextField, PERIOD_DISCOUNT, type Period } from "@couthealth/ui";
import { plansApi, couponsApi, ApiError, type Plan } from "../lib/api";

const PERIOD_MONTHS: Record<Period, number> = {
  mensal: 1,
  trimestral: 3,
  semestral: 6,
  anual: 12,
};

function formatPrice(monthly: number, period: Period) {
  const effective = monthly * (1 - PERIOD_DISCOUNT[period]);
  return effective.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

/**
 * Espelha o cálculo de PaymentsService.checkout() — só pra exibir/inicializar o Payment Brick com o
 * valor certo; quem cobra de verdade é o backend. Cartão vira assinatura recorrente mensal (valor
 * mensal com desconto, cobrado todo mês); PIX continua pagamento único do período inteiro.
 */
function monthlyAmount(monthly: number, period: Period, couponPercentOff: number) {
  return Number((monthly * (1 - PERIOD_DISCOUNT[period]) * (1 - couponPercentOff)).toFixed(2));
}

function totalAmount(monthly: number, period: Period, couponPercentOff: number) {
  return Number((monthly * PERIOD_MONTHS[period] * (1 - PERIOD_DISCOUNT[period]) * (1 - couponPercentOff)).toFixed(2));
}

export function PlansPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [period, setPeriod] = useState<Period>((params.get("periodo")?.toLowerCase() as Period) || "mensal");
  const [couponCode, setCouponCode] = useState("");
  const [couponStatus, setCouponStatus] = useState<{ valid: boolean; message: string; percentOff?: number } | null>(null);

  useEffect(() => {
    plansApi.list().then(setPlans).catch(() => setPlans([]));
  }, []);

  async function checkCoupon() {
    if (!couponCode) {
      setCouponStatus(null);
      return;
    }
    try {
      const res = await couponsApi.validate(couponCode);
      setCouponStatus({ valid: true, message: `Cupom aplicado: -${Math.round(res.percentOff * 100)}%`, percentOff: res.percentOff });
    } catch (err) {
      setCouponStatus({ valid: false, message: err instanceof ApiError ? err.message : "Cupom inválido." });
    }
  }

  function selectPlan(planCode: string) {
    const plan = plans.find((p) => p.code === planCode);
    const couponPercentOff = couponStatus?.valid ? couponStatus.percentOff ?? 0 : 0;
    const query = new URLSearchParams({ plano: planCode.toLowerCase(), periodo: period });
    if (plan) {
      query.set("valorMensal", String(monthlyAmount(plan.monthlyPrice, period, couponPercentOff)));
      query.set("valorTotal", String(totalAmount(plan.monthlyPrice, period, couponPercentOff)));
    }
    if (couponStatus?.valid && couponCode) query.set("cupom", couponCode);
    navigate(`/checkout?${query.toString()}`);
  }

  const preselected = params.get("plano");
  // "inativo": já teve assinatura e ela expirou/foi cancelada — tela de renovação.
  // qualquer outro caso (visitante novo, ou "?motivo=novo" vindo do ProtectedRoute): boas-vindas.
  const renewing = params.get("motivo") === "inativo";
  const ctaLabel = renewing ? "Renovar plano" : "Iniciar plano";

  return (
    <main style={{ minHeight: "100vh", padding: "var(--sp-16) var(--sp-6)", display: "flex", flexDirection: "column", gap: "var(--sp-8)" }}>
      <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--sp-4)" }}>
        {renewing && (
          <div
            style={{
              background: "var(--danger-bg, #3a1a1a)",
              color: "var(--danger)",
              border: "1px solid var(--danger)",
              borderRadius: "var(--r-md)",
              padding: "var(--sp-3) var(--sp-5)",
              fontSize: "var(--fs-body-sm)",
              maxWidth: 480,
            }}
          >
            Sua assinatura está inativa ou expirada. Renove um plano para liberar novamente sua conta.
          </div>
        )}
        <h1 className="display" style={{ fontSize: "var(--fs-display-sm)", margin: 0 }}>
          {renewing ? "Renove seu plano" : "Bem-vindo(a) à CoutHealth"}
        </h1>
        <p style={{ color: "var(--text-secondary)", maxWidth: 480 }}>
          {renewing ? "Quanto maior o período, maior o desconto." : "Escolha um plano para iniciar seu acompanhamento contínuo. Quanto maior o período, maior o desconto."}
        </p>
        <PeriodToggle value={period} onChange={setPeriod} />
        <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "flex-end", maxWidth: 320, width: "100%" }}>
          <div style={{ flex: 1 }}>
            <TextField label="Cupom (opcional)" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} onBlur={checkCoupon} />
          </div>
        </div>
        {couponStatus && (
          <p style={{ color: couponStatus.valid ? "var(--success)" : "var(--danger)", fontSize: "var(--fs-caption)", margin: 0 }}>
            {couponStatus.message}
          </p>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "var(--sp-6)",
          maxWidth: 1080,
          margin: "0 auto",
          width: "100%",
        }}
      >
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            name={plan.name}
            tagline={plan.tagline}
            priceLabel={`${formatPrice(plan.monthlyPrice, period)}/mês`}
            originalPriceLabel={period !== "mensal" ? `${formatPrice(plan.monthlyPrice, "mensal")}/mês` : undefined}
            features={plan.features}
            highlighted={plan.code === "PLUS" || plan.code.toLowerCase() === preselected}
            ctaLabel={ctaLabel}
            onSelect={() => selectPlan(plan.code)}
          />
        ))}
      </div>
    </main>
  );
}
