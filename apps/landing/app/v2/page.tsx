import type { Metadata } from "next";
import { ContinuityRing } from "@couthealth/ui";
import { differentiators, heroCopy, howItWorks, testimonials } from "../../content/copy";
import { PlansSection } from "../../components/PlansSection";
import { FaqSection } from "../../components/FaqSection";
import { LandingHeader } from "../../components/LandingHeader";
import { LandingFooter } from "../../components/LandingFooter";
import { APP_URL } from "../../lib/env";

const hero = heroCopy.clinical;

export const metadata: Metadata = {
  title: "CoutHealth — Cuidado contínuo, decidido por gente",
  description: hero.subheadline,
};

export default function LandingClinical() {
  return (
    <main style={{ background: "var(--ink-900)" }}>
      <LandingHeader current="/v2" variant="dark" />

      {/* Hero: texto + anel de progresso */}
      <section
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "var(--sp-16) var(--sp-6)",
          display: "grid",
          gridTemplateColumns: "1.1fr 0.9fr",
          gap: "var(--sp-12)",
          alignItems: "center",
        }}
      >
        <div>
          <span style={{ textTransform: "uppercase", fontSize: "var(--fs-caption)", letterSpacing: "0.12em", color: "var(--text-secondary)" }}>
            {hero.eyebrow}
          </span>
          <h1 className="display" style={{ fontSize: "var(--fs-display-lg)", lineHeight: 1.15, margin: "20px 0 var(--sp-6)" }}>
            {hero.headline}
          </h1>
          <p style={{ fontSize: "var(--fs-title-sm)", lineHeight: 1.6, color: "var(--text-secondary)", margin: "0 0 var(--sp-8)", maxWidth: 460 }}>
            {hero.subheadline}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-6)" }}>
            <a
              href={`${APP_URL}/criar-conta`}
              style={{
                height: 48,
                padding: "0 28px",
                display: "flex",
                alignItems: "center",
                background: "var(--accent-grad)",
                color: "var(--ink-900)",
                borderRadius: "var(--r-full)",
                fontWeight: 600,
              }}
            >
              Criar conta
            </a>
            <a href="#como-funciona" style={{ fontSize: "var(--fs-body-sm)", color: "var(--gray-100)", borderBottom: "1px solid var(--border-hairline)", paddingBottom: 2 }}>
              Como funciona
            </a>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--sp-4)" }}>
          <ContinuityRing progress={0.6} size={220} />
          <span style={{ color: "var(--text-secondary)", fontSize: "var(--fs-body-sm)", textAlign: "center" }}>
            Um ciclo simples de quatro etapas conecta você a Rafael Coutinho — sem plano automático, sem algoritmo decidindo por você.
          </span>
        </div>
      </section>

      {/* Diferenciais */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 var(--sp-6) var(--sp-16)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "var(--sp-8)" }}>
          {differentiators.map((d) => (
            <div key={d.title}>
              <h3 style={{ fontSize: "var(--fs-title-sm)", fontWeight: 600, margin: "0 0 10px" }}>{d.title}</h3>
              <p style={{ fontSize: "var(--fs-body-sm)", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>{d.description}</p>
            </div>
          ))}
        </div>
      </section>

      <div style={{ borderTop: "1px solid var(--border-hairline)" }} />

      {/* Como funciona — timeline horizontal */}
      <section id="como-funciona" style={{ maxWidth: 1200, margin: "0 auto", padding: "var(--sp-16) var(--sp-6)" }}>
        <span style={{ display: "block", textAlign: "center", textTransform: "uppercase", fontSize: "var(--fs-caption)", letterSpacing: "0.12em", color: "var(--text-secondary)", marginBottom: "var(--sp-4)" }}>
          Como funciona
        </span>
        <h2 className="display" style={{ fontSize: "var(--fs-display-sm)", textAlign: "center", margin: "0 0 var(--sp-16)" }}>
          O ciclo de acompanhamento
        </h2>
        <div style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--sp-6)" }}>
          <div style={{ position: "absolute", top: 6, left: "12.5%", right: "12.5%", height: 1, background: "var(--border-hairline)", zIndex: 0 }} />
          {howItWorks.map((s) => (
            <div key={s.step} style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
              <div style={{ width: 13, height: 13, borderRadius: "var(--r-full)", background: "var(--accent)", margin: "0 auto var(--sp-6)" }} />
              <div className="display" style={{ fontSize: "var(--fs-body-sm)", color: "var(--accent)", marginBottom: 8 }}>{s.step}</div>
              <h3 style={{ fontSize: "1.0625rem", fontWeight: 600, margin: "0 0 8px" }}>{s.title}</h3>
              <p style={{ fontSize: "var(--fs-body-sm)", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>{s.description}</p>
            </div>
          ))}
        </div>
      </section>

      <div style={{ borderTop: "1px solid var(--border-hairline)" }} />

      {/* Trust */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "var(--sp-16) var(--sp-6)", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap", marginBottom: "var(--sp-8)" }}>
          {["CREF 123456-G/SP", "CRN 45678/SP", "12 anos de atuação", "+300 clientes acompanhados"].map((c) => (
            <span key={c} style={{ padding: "8px 18px", border: "1px solid var(--border-hairline)", borderRadius: "var(--r-full)", fontSize: "var(--fs-caption)", color: "var(--gray-100)" }}>
              {c}
            </span>
          ))}
        </div>
        <p style={{ maxWidth: 560, margin: "0 auto", fontSize: "1.0625rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
          Nenhum plano é publicado sem revisão profissional. Todo treino e toda dieta passam pelas mãos de Rafael antes de chegar até você.
        </p>
      </section>

      <div style={{ borderTop: "1px solid var(--border-hairline)" }} />

      {/* Depoimentos */}
      <section style={{ padding: "var(--sp-16) var(--sp-6)", background: "var(--ink-800)" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "var(--sp-6)" }}>
          {testimonials.map((t) => (
            <div key={t.quote} style={{ background: "var(--bg-card)", border: "1px solid var(--border-hairline)", borderRadius: "var(--r-lg)", padding: "var(--sp-6)" }}>
              <p style={{ fontSize: "var(--fs-body-lg)", lineHeight: 1.6 }}>&ldquo;{t.quote}&rdquo;</p>
              <p style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-caption)", marginTop: "var(--sp-4)" }}>
                {t.name} · {t.role}
              </p>
            </div>
          ))}
        </div>
      </section>

      <PlansSection appUrl={APP_URL} />
      <FaqSection />

      <section style={{ padding: "var(--sp-16) var(--sp-6)", textAlign: "center" }}>
        <h2 className="display" style={{ fontSize: "var(--fs-display-md)", margin: "0 0 var(--sp-6)" }}>
          Comece seu ciclo de acompanhamento
        </h2>
        <a
          href={`${APP_URL}/criar-conta`}
          style={{
            height: 48,
            padding: "0 28px",
            display: "inline-flex",
            alignItems: "center",
            background: "var(--accent-grad)",
            color: "var(--ink-900)",
            borderRadius: "var(--r-full)",
            fontWeight: 600,
          }}
        >
          Criar conta
        </a>
      </section>

      <LandingFooter />
    </main>
  );
}
