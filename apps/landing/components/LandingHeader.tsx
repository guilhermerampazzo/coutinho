import { APP_URL } from "../lib/env";

/** Header padrão de todas as landings: logo + Entrar (explícito) + Criar conta. */
export function LandingHeader({ variant }: { current: "/" | "/v2" | "/v3"; variant: "dark" | "light" }) {
  const dark = variant === "dark";
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: dark ? "rgba(14,15,17,.9)" : "rgba(255,255,255,.92)",
        backdropFilter: "blur(8px)",
        borderBottom: dark ? "1px solid var(--border-hairline)" : "2px solid var(--ink-900)",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 76, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/logo.webp" alt="CoutHealth" style={{ height: 32, width: "auto", display: "block" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a
            href={`${APP_URL}/entrar`}
            style={{
              height: 44,
              padding: "0 20px",
              display: "flex",
              alignItems: "center",
              color: dark ? "var(--gray-100)" : "var(--ink-900)",
              fontWeight: 500,
              fontSize: ".9375rem",
            }}
          >
            Entrar
          </a>
          <a
            href={`${APP_URL}/criar-conta`}
            style={{
              height: 48,
              padding: "0 24px",
              display: "flex",
              alignItems: "center",
              background: dark ? "var(--accent-grad)" : "var(--ink-900)",
              color: dark ? "var(--ink-900)" : "#fff",
              borderRadius: "var(--r-full)",
              fontWeight: 600,
              fontSize: ".9375rem",
            }}
          >
            Criar conta
          </a>
        </div>
      </div>
    </header>
  );
}
