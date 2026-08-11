import { useEffect, type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../lib/auth";
import { initPushNotifications } from "../../lib/push";

const icons: Record<string, string> = {
  "/app": "M4 11 12 4l8 7 M6 10v9a1 1 0 0 0 1 1h4v-6h2v6h4a1 1 0 0 0 1-1v-9",
  "/app/nutricao": "M6 2v7a2 2 0 1 0 4 0V2 M8 2v20 M17 2c-2 0-3 2-3 4v3c0 1.5 1 2.5 2 3v10 M17 2v9",
  "/app/treino": "M3 12h4l2-7 4 14 2-7h6",
  "/app/mensagens": "M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.4 0-2.7-.3-3.9-.9L4 21l1.9-4.6A8.5 8.5 0 1 1 21 11.5z",
  "/app/evolucao": "M3 17l6-6 4 4 8-8 M15 7h6v6",
  "/app/checkin": "M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z M9 16l2 2 4-4",
  "/app/notificacoes": "M6 9a6 6 0 0 1 12 0v4l2 3H4l2-3z M10 19a2 2 0 0 0 4 0",
  "/app/perfil": "M8 8a4 4 0 1 1 8 0a4 4 0 1 1-8 0 M4 21c0-4 4-6 8-6s8 2 8 6",
};

const links = [
  { to: "/app", label: "Início", end: true },
  { to: "/app/nutricao", label: "Nutrição" },
  { to: "/app/treino", label: "Treino" },
  { to: "/app/mensagens", label: "Mensagens" },
  { to: "/app/evolucao", label: "Evolução" },
  { to: "/app/checkin", label: "Check-in" },
  { to: "/app/notificacoes", label: "Notificações" },
  { to: "/app/perfil", label: "Perfil" },
];

const tabLinks = [
  { to: "/app", label: "Início", end: true },
  { to: "/app/nutricao", label: "Nutrição" },
  { to: "/app/treino", label: "Treino" },
  { to: "/app/evolucao", label: "Evolução" },
  { to: "/app/perfil", label: "Mais" },
];

function NavIcon({ path }: { path: string }) {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

export function ClientLayout({ title, children }: { title?: string; children: ReactNode }) {
  const { accessToken, user } = useAuth();

  useEffect(() => {
    if (accessToken) initPushNotifications(accessToken);
  }, [accessToken]);

  return (
    <div className="client-shell" style={{ minHeight: "100vh", display: "flex", background: "var(--bg-base)" }}>
      <style>{`
        .client-shell { flex-direction: row; }
        .client-sidebar { display: flex; }
        .client-bottomnav { display: none; }
        .client-navitem:hover { background: var(--ink-600); }
        .client-header-search { display: inline-flex; }
        @media (max-width: 860px) {
          .client-sidebar { display: none; }
          .client-header-search { display: none; }
          .client-bottomnav {
            display: flex; position: fixed; bottom: 0; left: 0; right: 0;
            background: var(--bg-surface); border-top: 1px solid var(--border-hairline);
            padding: 6px 4px; justify-content: space-around; z-index: 40;
          }
          .client-main { padding-bottom: 96px !important; }
        }
      `}</style>

      <aside
        className="client-sidebar"
        style={{
          width: 260,
          flexShrink: 0,
          background: "var(--bg-surface)",
          borderRight: "1px solid var(--border-hairline)",
          flexDirection: "column",
          padding: "var(--sp-6) 0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 var(--sp-6)", marginBottom: "var(--sp-8)" }}>
          <img src="/logo.webp" alt="CoutHealth" style={{ height: 28, width: "auto", display: "block" }} />
        </div>
        <nav style={{ display: "flex", flexDirection: "column" }}>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className="client-navitem"
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px var(--sp-6)",
                borderLeft: `3px solid ${isActive ? "var(--accent)" : "transparent"}`,
                color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                fontWeight: isActive ? 600 : 400,
                fontSize: "var(--fs-body-sm)",
                textDecoration: "none",
              })}
            >
              <NavIcon path={icons[link.to]} />
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div
          style={{
            marginTop: "auto",
            padding: "var(--sp-4) var(--sp-6) 0",
            borderTop: "1px solid var(--border-hairline)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "var(--r-full)",
              background: "var(--bg-card)",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              color: "var(--accent)",
            }}
          >
            {user?.name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontSize: "0.875rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user?.name ?? "—"}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
              {user?.hasActiveSubscription ? user.activePlanName ?? "Plano ativo" : "Sem plano ativo"}
            </div>
          </div>
        </div>
      </aside>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {title && (
          <div
            style={{
              height: 76,
              flexShrink: 0,
              borderBottom: "1px solid var(--border-hairline)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 var(--sp-8)",
            }}
          >
            <h1 className="display" style={{ fontSize: "var(--fs-title-lg)", margin: 0 }}>
              {title}
            </h1>
            <div className="client-header-search" style={{ alignItems: "center", gap: "var(--sp-4)" }}>
              <input
                placeholder="Buscar"
                style={{
                  height: 40,
                  width: 220,
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-hairline)",
                  borderRadius: "var(--r-sm)",
                  color: "var(--text-primary)",
                  padding: "0 14px",
                  fontSize: "var(--fs-body-sm)",
                  fontFamily: "var(--font-body)",
                }}
              />
            </div>
          </div>
        )}
        <main className="client-main" style={{ flex: 1, padding: "var(--sp-8)" }}>
          {children}
        </main>
      </div>

      <nav className="client-bottomnav">
        {tabLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            style={({ isActive }) => ({
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              flex: 1,
              padding: "6px 4px",
              color: isActive ? "var(--accent)" : "var(--text-secondary)",
              fontSize: "0.6875rem",
              textDecoration: "none",
            })}
          >
            <NavIcon path={icons[link.to]} />
            {link.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
