import type { ReactNode } from "react";

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <main
      style={{
        minHeight: "100vh",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--sp-6)",
        overflow: "hidden",
        background: "var(--bg-base)",
      }}
    >
      <svg
        width="600"
        height="600"
        viewBox="0 0 600 600"
        style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", opacity: 0.05, pointerEvents: "none" }}
      >
        <circle cx="300" cy="300" r="260" fill="none" stroke="var(--accent)" strokeWidth={3} />
      </svg>

      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 420,
          background: "var(--bg-surface)",
          border: "1px solid var(--border-hairline)",
          borderRadius: "var(--r-lg)",
          padding: "var(--sp-10) var(--sp-8)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--sp-6)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--sp-4)", textAlign: "center" }}>
          <img src="/logo.webp" alt="CoutHealth" style={{ height: 40, width: "auto", display: "block" }} />
          <div>
            <h1 className="display" style={{ fontSize: "1.75rem", letterSpacing: "-0.02em", margin: 0 }}>
              {title}
            </h1>
            {subtitle && <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem", margin: "8px 0 0" }}>{subtitle}</p>}
          </div>
        </div>
        {children}
      </div>
    </main>
  );
}
