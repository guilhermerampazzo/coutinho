import { useState, type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { ContinuityRing } from "@couthealth/ui";

const links = [
  { to: "/admin", label: "Clientes", end: true },
  { to: "/admin/alimentos", label: "Banco de alimentos" },
  { to: "/admin/exercicios", label: "Banco de exercícios" },
  { to: "/admin/biblioteca", label: "Biblioteca" },
  { to: "/admin/notificacoes", label: "Notificações" },
  { to: "/admin/cupons", label: "Cupons" },
  { to: "/admin/assinaturas", label: "Planos & Assinaturas" },
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
          <ContinuityRing progress={0.6} size={26} strokeWidth={3} />
          <span className="display" style={{ fontWeight: 700, fontSize: "1rem", color: "var(--accent)" }}>
            CoutHealth
          </span>
          <span style={{ fontSize: "0.6875rem", color: "var(--text-tertiary)", marginLeft: "auto", letterSpacing: "0.06em" }}>
            ADMIN
          </span>
        </div>
        <nav style={{ display: "flex", flexDirection: "column" }}>
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
          <span className="display" style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--accent)" }}>
            CoutHealth Admin
          </span>
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
