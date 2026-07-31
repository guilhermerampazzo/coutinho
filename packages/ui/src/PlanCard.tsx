import type { ReactNode } from "react";
import { Button } from "./Button";
import { Card } from "./Card";

export interface PlanCardProps {
  name: string;
  tagline: string;
  priceLabel: string;
  originalPriceLabel?: string;
  features: string[];
  highlighted?: boolean;
  ctaLabel?: string;
  onSelect?: () => void;
  footer?: ReactNode;
}

export function PlanCard({
  name,
  tagline,
  priceLabel,
  originalPriceLabel,
  features,
  highlighted,
  ctaLabel = "Escolher plano",
  onSelect,
  footer,
}: PlanCardProps) {
  return (
    <Card
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--sp-4)",
        border: highlighted ? "1px solid var(--accent)" : undefined,
        boxShadow: highlighted ? "0 0 0 1px var(--accent), var(--elev)" : undefined,
        position: "relative",
      }}
    >
      {highlighted && (
        <span
          style={{
            position: "absolute",
            top: -12,
            right: "var(--sp-6)",
            background: "var(--accent-grad, var(--accent))",
            color: "var(--text-on-accent)",
            fontSize: "var(--fs-caption)",
            fontWeight: 700,
            padding: "4px 12px",
            borderRadius: "var(--r-full)",
          }}
        >
          Mais escolhido
        </span>
      )}
      <div>
        <h3 className="display" style={{ fontSize: "var(--fs-title-lg)", margin: 0 }}>
          {name}
        </h3>
        <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-body-sm)", margin: "4px 0 0" }}>{tagline}</p>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        {originalPriceLabel && (
          <span style={{ color: "var(--text-tertiary)", textDecoration: "line-through", fontSize: "var(--fs-body-sm)" }}>
            {originalPriceLabel}
          </span>
        )}
        <span className="display" style={{ fontSize: "var(--fs-display-sm)" }}>
          {priceLabel}
        </span>
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
        {features.map((feature) => (
          <li key={feature} style={{ display: "flex", gap: "var(--sp-2)", color: "var(--text-secondary)", fontSize: "var(--fs-body-sm)" }}>
            <span aria-hidden style={{ color: "var(--accent)" }}>
              ✓
            </span>
            {feature}
          </li>
        ))}
      </ul>
      <Button variant={highlighted ? "primary" : "secondary"} onClick={onSelect} style={{ marginTop: "auto" }}>
        {ctaLabel}
      </Button>
      {footer}
    </Card>
  );
}
