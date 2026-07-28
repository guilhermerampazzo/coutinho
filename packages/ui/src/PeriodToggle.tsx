"use client";

export type Period = "mensal" | "trimestral" | "semestral" | "anual";

export const PERIOD_LABELS: Record<Period, string> = {
  mensal: "Mensal",
  trimestral: "Trimestral",
  semestral: "Semestral",
  anual: "Anual",
};

/** % de desconto aplicado sobre o preço mensal — valores placeholder (ver escopo.md §13). */
export const PERIOD_DISCOUNT: Record<Period, number> = {
  mensal: 0,
  trimestral: 0.08,
  semestral: 0.15,
  anual: 0.25,
};

export interface PeriodToggleProps {
  value: Period;
  onChange: (period: Period) => void;
}

export function PeriodToggle({ value, onChange }: PeriodToggleProps) {
  const periods: Period[] = ["mensal", "trimestral", "semestral", "anual"];
  return (
    <div
      role="tablist"
      aria-label="Período de assinatura"
      style={{
        display: "inline-flex",
        // Quebra em 2 linhas no mobile: os 4 períodos não cabem em ~340px e, sem wrap,
        // empurravam a página inteira para fora da tela (scroll horizontal no celular).
        flexWrap: "wrap",
        justifyContent: "center",
        maxWidth: "100%",
        padding: 4,
        borderRadius: "var(--r-full)",
        background: "var(--bg-surface)",
        border: "1px solid var(--border-hairline)",
        gap: 2,
      }}
    >
      {periods.map((period) => {
        const active = period === value;
        return (
          <button
            key={period}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(period)}
            style={{
              padding: "8px 14px",
              borderRadius: "var(--r-full)",
              border: "none",
              cursor: "pointer",
              fontSize: "var(--fs-body-sm)",
              fontWeight: 600,
              background: active ? "var(--accent-grad, var(--accent))" : "transparent",
              color: active ? "var(--text-on-accent)" : "var(--text-secondary)",
              transition: "background var(--motion-fast), color var(--motion-fast)",
              whiteSpace: "nowrap",
            }}
          >
            {PERIOD_LABELS[period]}
            {PERIOD_DISCOUNT[period] > 0 && (
              <span style={{ marginLeft: 6, opacity: 0.8 }}>-{Math.round(PERIOD_DISCOUNT[period] * 100)}%</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
