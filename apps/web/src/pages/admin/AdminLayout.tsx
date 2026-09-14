import { useState, type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/auth";

const links = [
  { to: "/admin", label: "Clientes", end: true },
  { to: "/admin/alimentos", label: "Banco de alimentos" },
  { to: "/admin/exercicios", label: "Banco de exercícios" },
  { to: "/admin/notificacoes", label: "Notificações" },
  { to: "/admin/cupons", label: "Cupons" },
  { to: "/admin/assinaturas", label: "Planos & Assinaturas" },
  { to: "/admin/configuracoes", label: "Configurações" },
];

export function AdminLayout({
  children,
  title,
  actions,
}: {
  children: ReactNode;
  title?: ReactNode;
  actions?: ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    setUserMenuOpen(false);
    setMenuOpen(false);
    navigate("/entrar");
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "var(--bg-base)" }}>
      <style>{`
        .admin-navitem { transition: background var(--motion-fast), color var(--motion-fast); }
        .admin-navitem:hover { background: var(--nav-hover); }
        .admin-mobile-bar, .admin-mobile-overlay { display: none; }
        /* Utilitários reaproveitados pelas páginas admin (grids/tabelas) — ver DECISIONS.md
           responsividade mobile: em vez de redesenhar cada tela, tabelas ganham scroll
           horizontal contido e painéis lado-a-lado empilham em 1 coluna. */
        .admin-table-wrap { overflow-x: auto; }
        @media (max-width: 860px) {
          .admin-sidebar {
            position: fixed; inset: 0 auto 0 0; z-index: 50; height: 100vh;
            transform: translateX(-100%); transition: transform var(--motion-fast, 0.2s ease);
          }
          .admin-sidebar.open { transform: translateX(0); box-shadow: var(--elev, 0 8px 24px rgba(0,0,0,0.4)); }
          .admin-mobile-bar {
            display: flex; align-items: center; justify-content: space-between;
            height: 56px; flex-shrink: 0; padding: 0 var(--sp-4);
            border-bottom: 1px solid var(--border-hairline);
          }
          .admin-mobile-overlay { display: block; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 40; }
          .admin-header { padding: 0 var(--sp-4) !important; flex-wrap: wrap; height: auto !important; padding-top: var(--sp-3) !important; padding-bottom: var(--sp-3) !important; }
          .admin-main { padding: var(--sp-4) !important; }
          .admin-split-2 { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {menuOpen && <div className="admin-mobile-overlay" onClick={() => setMenuOpen(false)} />}

      <aside
        className={`admin-sidebar${menuOpen ? " open" : ""}`}
        style={{
          width: "var(--sidebar-w)",
          flexShrink: 0,
          background: "var(--bg-surface)",
          borderRight: "1px solid var(--border-hairline)",
          padding: "var(--sp-6) 0",
          display: "flex",
          flexDirection: "column",
          gap: "var(--sp-8)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)", padding: "0 var(--sp-6)" }}>
          <img src="/logo.webp" alt="CoutHealth" style={{ height: 28, width: "auto", display: "block" }} />
          <span style={{ fontSize: "0.6875rem", color: "var(--text-tertiary)", marginLeft: "auto", letterSpacing: "0.06em" }}>
            ADMIN
          </span>
        </div>        <nav style={{ display: "flex", flexDirection: "column" }}>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className="admin-navitem"
              onClick={() => setMenuOpen(false)}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: "var(--sp-3)",
                padding: "12px var(--sp-6)",
                borderLeft: `3px solid ${isActive ? "var(--accent)" : "transparent"}`,
                color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                fontWeight: isActive ? 600 : 400,
                fontSize: "var(--fs-body-sm)",
                textDecoration: "none",
              })}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div style={{ marginTop: "auto", padding: "var(--sp-4) var(--sp-6) 0", borderTop: "1px solid var(--border-hairline)", position: "relative" }}>
          {userMenuOpen && (
            <>
              <div style={{ position: "fixed", inset: 0, zIndex: 45 }} onClick={() => setUserMenuOpen(false)} />
              <div
                style={{
                  position: "absolute",
                  bottom: "calc(100% + 8px)",
                  left: "var(--sp-4)",
                  right: "var(--sp-4)",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-hairline)",
                  borderRadius: "var(--r-md)",
                  padding: 6,
                  zIndex: 46,
                  boxShadow: "var(--elev, 0 8px 24px rgba(0,0,0,0.4))",
                }}
              >
                <button
                  onClick={handleLogout}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    background: "transparent",
                    border: 0,
                    color: "var(--danger)",
                    fontSize: "var(--fs-body-sm)",
                    fontWeight: 600,
                    padding: "10px 12px",
                    borderRadius: 8,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9" />
                  </svg>
                  Sair
                </button>
              </div>
            </>
          )}
          <button
            onClick={() => setUserMenuOpen((v) => !v)}
            title="Clique para ver opções da conta"
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: userMenuOpen ? "var(--ink-600)" : "transparent",
              border: 0,
              borderRadius: "var(--r-md)",
              padding: 6,
              margin: "-6px",
              cursor: "pointer",
              textAlign: "left",
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
            <div style={{ overflow: "hidden", flex: 1 }}>
              <div style={{ fontSize: "0.875rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "var(--text-primary)" }}>
                {user ? `${user.name} ADM` : "—"}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Administrador</div>
            </div>
            <span style={{ color: "var(--text-tertiary)", fontSize: "0.75rem", flexShrink: 0 }}>{userMenuOpen ? "▲" : "▼"}</span>
          </button>
        </div>
      </aside>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div className="admin-mobile-bar">
          <button
            aria-label="Abrir menu"
            onClick={() => setMenuOpen(true)}
            style={{ background: "none", border: 0, color: "var(--text-primary)", fontSize: "1.5rem", lineHeight: 1, cursor: "pointer", padding: 4 }}
          >
            ☰
          </button>
          <img src="/logo.webp" alt="CoutHealth" style={{ height: 24, width: "auto", display: "block" }} />
          <span style={{ width: 24 }} />
        </div>
        {title && (
          <header
            className="admin-header"
            style={{
              height: "var(--header-h)",
              flexShrink: 0,
              borderBottom: "1px solid var(--border-hairline)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 var(--sp-8)",
              gap: "var(--sp-4)",
            }}
          >
            <h1 className="display" style={{ fontSize: "var(--fs-title-lg)", margin: 0 }}>
              {title}
            </h1>
            {actions && <div style={{ display: "flex", gap: "var(--sp-3)", alignItems: "center", flexWrap: "wrap" }}>{actions}</div>}
          </header>
        )}
        <main className="admin-main" style={{ flex: 1, padding: "var(--sp-8)", overflow: "auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
