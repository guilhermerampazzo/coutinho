import { useState } from "react";
import type { Question } from "./steps";

function OptionsGroup({
  options,
  value,
  onSelect,
}: {
  options: { value: string; label: string }[];
  value?: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelect(opt.value)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px var(--sp-5)",
              background: active ? "rgba(247,190,0,0.12)" : "var(--bg-base)",
              border: `1px solid ${active ? "var(--accent)" : "var(--border-hairline)"}`,
              borderRadius: "var(--r-md)",
              color: "var(--text-primary)",
              fontSize: "var(--fs-body)",
              fontFamily: "var(--font-body)",
              cursor: "pointer",
              textAlign: "left",
              transition: "border-color var(--motion-fast), background var(--motion-fast)",
            }}
          >
            {opt.label}
            <span
              style={{
                width: 18,
                height: 18,
                borderRadius: "var(--r-full)",
                border: `2px solid ${active ? "var(--accent)" : "var(--ink-600)"}`,
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              {active && <span style={{ width: 8, height: 8, borderRadius: "var(--r-full)", background: "var(--accent)" }} />}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function BooleanGroup({ value, onSelect }: { value?: boolean; onSelect: (v: boolean) => void }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-3)" }}>
      {[true, false].map((v) => {
        const active = value === v;
        return (
          <button
            key={String(v)}
            type="button"
            onClick={() => onSelect(v)}
            style={{
              padding: "16px var(--sp-5)",
              background: active ? "rgba(247,190,0,0.12)" : "var(--bg-base)",
              border: `1px solid ${active ? "var(--accent)" : "var(--border-hairline)"}`,
              borderRadius: "var(--r-md)",
              color: "var(--text-primary)",
              fontSize: "var(--fs-body)",
              fontFamily: "var(--font-body)",
              cursor: "pointer",
              fontWeight: active ? 600 : 400,
            }}
          >
            {v ? "Sim" : "Não"}
          </button>
        );
      })}
    </div>
  );
}

function ChipsGroup({
  options,
  value,
  allowCustom,
  onChange,
}: {
  options: string[];
  value: string[];
  allowCustom?: boolean;
  onChange: (v: string[]) => void;
}) {
  const [custom, setCustom] = useState("");

  function toggle(option: string) {
    onChange(value.includes(option) ? value.filter((v) => v !== option) : [...value, option]);
  }

  function addCustom() {
    const trimmed = custom.trim();
    if (!trimmed || value.includes(trimmed)) return;
    onChange([...value, trimmed]);
    setCustom("");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--sp-2)" }}>
        {options.map((option) => {
          const active = value.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              style={{
                padding: "10px 16px",
                background: active ? "var(--accent)" : "var(--bg-base)",
                color: active ? "var(--ink-900)" : "var(--text-primary)",
                border: `1px solid ${active ? "var(--accent)" : "var(--border-hairline)"}`,
                borderRadius: "var(--r-full)",
                fontSize: "var(--fs-body-sm)",
                fontFamily: "var(--font-body)",
                fontWeight: active ? 600 : 400,
                cursor: "pointer",
              }}
            >
              {option}
            </button>
          );
        })}
      </div>
      {allowCustom && (
        <div style={{ display: "flex", gap: "var(--sp-2)" }}>
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustom();
              }
            }}
            placeholder="Não encontrou algum alimento? Adicione aqui"
            style={{
              flex: 1,
              height: 44,
              background: "var(--bg-base)",
              border: "1px solid var(--border-hairline)",
              borderRadius: "var(--r-md)",
              color: "var(--text-primary)",
              padding: "0 14px",
              fontSize: "var(--fs-body-sm)",
              fontFamily: "var(--font-body)",
            }}
          />
          <button
            type="button"
            onClick={addCustom}
            style={{
              height: 44,
              padding: "0 18px",
              background: "var(--ink-600)",
              color: "var(--text-primary)",
              border: "none",
              borderRadius: "var(--r-md)",
              fontSize: "var(--fs-body-sm)",
              fontFamily: "var(--font-body)",
              cursor: "pointer",
            }}
          >
            Adicionar
          </button>
        </div>
      )}
    </div>
  );
}

export function StepField({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "var(--bg-base)",
    border: "1px solid var(--border-hairline)",
    borderRadius: "var(--r-md)",
    color: "var(--text-primary)",
    padding: "14px",
    fontSize: "var(--fs-body)",
    fontFamily: "var(--font-body)",
    outline: "none",
  };

  if (question.type === "choice") {
    return <OptionsGroup options={question.options ?? []} value={value as string | undefined} onSelect={(v) => onChange(v)} />;
  }

  if (question.type === "boolean") {
    return <BooleanGroup value={value as boolean | undefined} onSelect={(v) => onChange(v)} />;
  }

  if (question.type === "chips") {
    return (
      <ChipsGroup
        options={question.chips?.options ?? []}
        value={(value as string[] | undefined) ?? []}
        allowCustom={question.chips?.allowCustom}
        onChange={(v) => onChange(v)}
      />
    );
  }

  if (question.type === "slider") {
    const min = question.min ?? 0;
    const max = question.max ?? 10;
    const step = question.stepValue ?? 1;
    const current = typeof value === "number" ? value : min;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "var(--fs-title-lg)", fontWeight: 700, color: "var(--accent)" }}>
            {current.toLocaleString("pt-BR")}
            {question.unit ? ` ${question.unit}` : ""}
          </span>
          <span style={{ fontSize: "var(--fs-caption)", color: "var(--text-tertiary)" }}>
            {min}
            {question.unit ? ` ${question.unit}` : ""} — {max}
            {question.unit ? ` ${question.unit}` : ""}
          </span>
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={current}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ width: "100%", accentColor: "var(--accent)" }}
        />
      </div>
    );
  }

  if (question.type === "number") {
    return (
      <input
        type="number"
        inputMode="decimal"
        value={typeof value === "number" ? value : ""}
        onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
        placeholder={question.placeholder ?? (question.unit ? `em ${question.unit}` : "")}
        style={inputStyle}
      />
    );
  }

  if (question.type === "time") {
    return (
      <input
        type="time"
        value={(value as string | undefined) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
      />
    );
  }

  if (question.type === "textarea") {
    return (
      <textarea
        value={(value as string | undefined) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={question.placeholder}
        rows={3}
        style={{ ...inputStyle, resize: "vertical" }}
      />
    );
  }

  // text
  return (
    <input
      type="text"
      value={(value as string | undefined) ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={question.placeholder}
      style={inputStyle}
    />
  );
}
