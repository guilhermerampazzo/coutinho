"use client";
import { useState } from "react";
import { PlanCard, PeriodToggle, type Period, PERIOD_DISCOUNT } from "@couthealth/ui";
import { plans } from "../content/copy";

function formatPrice(monthly: number, period: Period) {
  const discount = PERIOD_DISCOUNT[period];
  const effective = monthly * (1 - discount);
  return effective.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

export function PlansSection({ appUrl }: { appUrl: string }) {
  const [period, setPeriod] = useState<Period>("mensal");

  return (
    <section id="planos" style={{ padding: "var(--sp-16) var(--sp-6)", display: "flex", flexDirection: "column", gap: "var(--sp-8)" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--sp-4)", textAlign: "center" }}>
        <h2 className="display" style={{ fontSize: "var(--fs-display-sm)", margin: 0 }}>
          Escolha seu plano
        </h2>
        <p style={{ color: "var(--text-secondary)", maxWidth: 560 }}>
          Cada pessoa tem um objetivo diferente. Escolha o plano que faz mais sentido para o momento em que você está.
          Se precisar, você pode mudar de plano quando quiser.
        </p>
        <PeriodToggle value={period} onChange={setPeriod} />
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
            highlighted={plan.id === "plus"}
            ctaLabel={plan.ctaLabel}
            onSelect={() => {
              window.location.href = `${appUrl}/criar-conta?plano=${plan.id}&periodo=${period}`;
            }}
          />
        ))}
      </div>
    </section>
  );
}
