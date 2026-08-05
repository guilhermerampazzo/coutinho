import type { Metadata } from "next";
import { Badge, Button } from "@couthealth/ui";
import { differentiators, heroCopy, howItWorks, testimonials } from "../content/copy";
import { PlansSection } from "../components/PlansSection";
import { FaqSection } from "../components/FaqSection";
import { LandingHeader } from "../components/LandingHeader";
import { LandingFooter } from "../components/LandingFooter";
import { APP_URL } from "../lib/env";

const hero = heroCopy.cinematic;

// Ícones inline (estilo lucide) — sem dependência externa. Stroke = currentColor.
function IconAward({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  );
}

function IconDumbbell({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
      <path d="M3 9v6" />
      <path d="M6.5 6.5v11" />
      <path d="M17.5 6.5v11" />
      <path d="M21 9v6" />
      <path d="M6.5 12h11" />
    </svg>
  );
}

function IconShieldCheck({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

// Diferenciais exibidos no hero, entre o texto principal e os botões de CTA (pedido do cliente).
const heroDifferentials = [
  { icon: IconAward, label: "+10 anos de atuação no segmento" },
  { icon: IconDumbbell, label: "2 especialidades: Nutrição e Treinamento" },
  { icon: IconShieldCheck, label: "100% dos planos revisados por um profissional" },
];

export const metadata: Metadata = {
  title: "CoutHealth — Um plano feito para a sua realidade",
  description: hero.subheadline,
};

// Imagens de acompanhamento (consulta, evolução no celular, treino orientado) em vez de
// corrida/academia/comida — o cliente pediu que transmitissem cuidado contínuo, não só
// atividade física e alimentação.
const diffImages = [
  // "Você sabe exatamente o que fazer" — imagem local enviada pelo cliente
  "/diferencial-1.png",
  // "Você acompanha sua evolução" — imagem local enviada pelo cliente
  "/diferencial-2.png",
  // alguém treinando com orientação
  "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=75",
];

export default function LandingCinematic() {
  return (
    <main style={{ background: "var(--ink-900)" }}>
      <LandingHeader current="/" variant="dark" />

      {/* Hero full-bleed escuro, foto à direita */}
      <section
        style={{
          position: "relative",
          minHeight: "88vh",
          display: "flex",
          alignItems: "center",
          padding: "var(--sp-16) var(--sp-6)",
          overflow: "hidden",
          borderBottom: "1px solid var(--border-hairline)",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "url(https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1800&q=70)",
            backgroundSize: "cover",
            backgroundPosition: "center 35%",
          }}
        />
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(100deg, var(--ink-900) 38%, rgba(14,15,17,.55) 62%, rgba(14,15,17,0) 100%)",
          }}
        />
        <div style={{ position: "relative", maxWidth: 1200, margin: "0 auto", width: "100%" }}>
          <div style={{ maxWidth: 620 }}>
            <div style={{ display: "flex", marginBottom: "var(--sp-6)" }}>
              <Badge tone="accent">Nutrição • Treino • Saúde</Badge>
            </div>
            {hero.eyebrow && (
              <p style={{ color: "var(--accent)", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", fontSize: "var(--fs-caption)" }}>
                {hero.eyebrow}
              </p>
            )}
            <h1 className="display" style={{ fontSize: "var(--fs-display-lg)", lineHeight: 1.05, margin: "var(--sp-4) 0" }}>
              {hero.headline}
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-title-sm)", margin: 0 }}>
              {hero.subheadline}
            </p>
            {/* Diferenciais entre o texto e os CTAs */}
            <div style={{ display: "flex", gap: "var(--sp-6)", flexWrap: "wrap", margin: "var(--sp-7) 0 var(--sp-8)" }}>
              {heroDifferentials.map((d) => (
                <div key={d.label} style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)", maxWidth: 230 }}>
                  <span
                    style={{
                      flexShrink: 0,
                      width: 44,
                      height: 44,
                      borderRadius: "var(--r-full)",
                      display: "grid",
                      placeItems: "center",
                      background: "rgba(247,190,0,0.08)",
                      border: "1px solid rgba(247,190,0,0.25)",
                      color: "var(--accent)",
                    }}
                  >
                    <d.icon />
                  </span>
                  <span style={{ fontSize: "var(--fs-caption)", lineHeight: 1.35, color: "var(--text-secondary)" }}>{d.label}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "var(--sp-4)", flexWrap: "wrap" }}>
              <Button href={`${APP_URL}/criar-conta`}>Iniciar meu plano</Button>
              <Button variant="secondary" href="#como-funciona">
                Como funciona
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Como funciona — ciclo contínuo */}
      <section id="como-funciona" style={{ padding: "var(--sp-16) var(--sp-6)", maxWidth: 1080, margin: "0 auto" }}>
        <h2 className="display" style={{ fontSize: "var(--fs-display-sm)", margin: "0 0 8px" }}>
          Cuidar da saúde não precisa ser complicado.
        </h2>
        <p style={{ color: "var(--text-secondary)", margin: "0 0 var(--sp-8)" }}>
          Veja como funciona o acompanhamento na COUT.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--sp-4)" }}>
          {howItWorks.map((step) => (
            <div
              key={step.step}
              style={{
                background: "rgba(23,24,27,0.6)",
                backdropFilter: "blur(6px)",
                border: "1px solid var(--border-hairline)",
                borderRadius: "var(--r-lg)",
                padding: "var(--sp-6)",
              }}
            >
              <span className="display" style={{ color: "var(--accent)", fontSize: "var(--fs-title-lg)" }}>
                {step.step}
              </span>
              <h3 style={{ fontSize: "var(--fs-title-sm)", margin: "var(--sp-2) 0" }}>{step.title}</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-body-sm)", margin: 0 }}>{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Diferenciais */}
      <section style={{ padding: "var(--sp-16) var(--sp-6)", maxWidth: 1080, margin: "0 auto" }}>
        <h2 className="display" style={{ fontSize: "var(--fs-display-sm)", marginBottom: "var(--sp-8)" }}>
          Tecnologia nos bastidores, profissional na linha de frente
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "var(--sp-6)" }}>
          {differentiators.map((d, i) => (
            <div
              key={d.title}
              style={{
                background: "rgba(23,24,27,0.6)",
                border: "1px solid var(--border-hairline)",
                borderRadius: "var(--r-lg)",
                overflow: "hidden",
              }}
            >
              <img
                src={diffImages[i]}
                alt=""
                loading="lazy"
                style={{ width: "100%", height: 170, objectFit: "cover", display: "block" }}
              />
              <div style={{ padding: "var(--sp-6)", borderTop: "2px solid var(--accent)" }}>
                <h3 style={{ fontSize: "var(--fs-title-sm)", margin: "0 0 8px" }}>{d.title}</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-body-sm)", margin: 0 }}>{d.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Depoimentos / casos */}
      <section style={{ padding: "var(--sp-16) var(--sp-6)", background: "var(--ink-800)" }}>
        <h2 className="display" style={{ fontSize: "var(--fs-display-sm)", maxWidth: 880, margin: "0 auto var(--sp-8)" }}>
          Casos reais de quem acompanho
        </h2>
        <div style={{ maxWidth: 880, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "var(--sp-6)" }}>
          {testimonials.map((t) => (
            <div
              key={t.name}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-hairline)",
                borderRadius: "var(--r-lg)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <img
                src={t.image}
                alt={`Depoimento de ${t.name}`}
                loading="lazy"
                style={{ width: "100%", aspectRatio: "4 / 5", objectFit: "cover", display: "block" }}
              />
              <div style={{ padding: "var(--sp-6)", display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
                <p style={{ fontSize: "var(--fs-body-lg)", lineHeight: 1.6, margin: 0 }}>&ldquo;{t.quote}&rdquo;</p>
                <p style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-caption)", margin: 0 }}>
                  {t.name} · {t.role}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <PlansSection appUrl={APP_URL} />
      <FaqSection />

      {/* CTA final */}
      <section style={{ padding: "var(--sp-16) var(--sp-6)", textAlign: "center" }}>
        <h2 className="display" style={{ fontSize: "var(--fs-display-md)", margin: "0 0 var(--sp-6)" }}>
          Comece seu ciclo de acompanhamento
        </h2>
        <Button href={`${APP_URL}/criar-conta`}>Criar conta</Button>
      </section>

      <LandingFooter />
    </main>
  );
}
