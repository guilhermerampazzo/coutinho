import type { Metadata } from "next";
import { differentiators, heroCopy, howItWorks, testimonials } from "../../content/copy";
import { PlansSection } from "../../components/PlansSection";
import { FaqSection } from "../../components/FaqSection";
import { LandingHeader } from "../../components/LandingHeader";
import { LandingFooter } from "../../components/LandingFooter";
import { APP_URL } from "../../lib/env";

const hero = heroCopy.editorial;

export const metadata: Metadata = {
  title: "CoutHealth — Seu método, seu profissional, sua continuidade",
  description: hero.subheadline,
};

export default function LandingEditorial() {
  return (
    <main style={{ background: "#fff", color: "var(--ink-900)" }}>
      <LandingHeader current="/v3" variant="light" />

      {/* Hero: magazine grid com retrato circular */}
      <section
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "var(--sp-16) var(--sp-6)",
          display: "grid",
          gridTemplateColumns: "repeat(12, 1fr)",
          gap: "var(--sp-6)",
          borderBottom: "2px solid var(--ink-900)",
        }}
      >
        <div style={{ gridColumn: "span 8" }}>
          <span style={{ textTransform: "uppercase", fontSize: "var(--fs-caption)", letterSpacing: "0.12em", color: "var(--gray-500)" }}>
            {hero.eyebrow}
          </span>
          <h1 className="display" style={{ fontSize: "3.25rem", lineHeight: 1.05, margin: "var(--sp-6) 0 0" }}>
            {hero.headline}
          </h1>
        </div>
        <div style={{ gridColumn: "span 4", display: "flex", flexDirection: "column", justifyContent: "space-between", paddingTop: 8 }}>
          <img
            src="/rafael.jpg"
            alt="Rafael Coutinho"
            style={{ width: 140, height: 140, borderRadius: "var(--r-full)", objectFit: "cover", marginBottom: "var(--sp-6)" }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: "var(--fs-body-sm)", color: "var(--gray-500)", marginBottom: "var(--sp-6)" }}>
            <span>Rafael Coutinho</span>
            <span>CREF 123456-G/SP · CRN 45678/SP</span>
            <span>12 anos de atuação</span>
          </div>
          <a
            href={`${APP_URL}/criar-conta`}
            style={{
              height: 48,
              padding: "0 26px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--ink-900)",
              color: "#fff",
              borderRadius: "var(--r-full)",
              fontWeight: 600,
              width: "fit-content",
            }}
          >
            Criar conta
          </a>
          <a
            href={`${APP_URL}/criar-conta?modalidade=presencial`}
            style={{ fontSize: "var(--fs-body-sm)", color: "var(--ink-900)", borderBottom: "1px solid var(--gray-500)", paddingBottom: 2, width: "fit-content" }}
          >
            Sou aluno/paciente presencial
          </a>
        </div>
      </section>

      {/* Como funciona — grade editorial */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "var(--sp-16) var(--sp-6)", borderBottom: "2px solid var(--ink-900)" }}>
        <h2 className="display" style={{ fontSize: "var(--fs-display-sm)", margin: "0 0 var(--sp-12)" }}>
          Como funciona
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderTop: "2px solid var(--ink-900)", borderLeft: "2px solid var(--ink-900)" }}>
          {howItWorks.map((s) => (
            <div key={s.step} style={{ padding: "var(--sp-8)", borderRight: "2px solid var(--ink-900)", borderBottom: "2px solid var(--ink-900)" }}>
              <div
                className="display"
                style={{
                  fontSize: "3.5rem",
                  color: "transparent",
                  WebkitTextStroke: "2px var(--accent)",
                  marginBottom: "var(--sp-4)",
                }}
              >
                {s.step}
              </div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 600, margin: "0 0 8px" }}>{s.title}</h3>
              <p style={{ fontSize: "var(--fs-body-sm)", color: "var(--gray-500)", lineHeight: 1.6, margin: 0 }}>{s.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Diferenciais editorial */}
      <section
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "var(--sp-16) var(--sp-6)",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "var(--sp-16)",
          borderBottom: "2px solid var(--ink-900)",
        }}
      >
        <div>
          <h2 className="display" style={{ fontSize: "2rem", margin: "0 0 var(--sp-6)" }}>
            Tecnologia organiza. Profissional decide.
          </h2>
          <p style={{ fontSize: "1.0625rem", lineHeight: 1.7, margin: "0 0 var(--sp-6)" }}>
            Nenhum plano é gerado automaticamente. Toda anamnese é lida por Rafael, todo treino é montado à mão e toda revisão é feita
            por um profissional de verdade — não por um algoritmo.
          </p>
          <p style={{ fontSize: "1.375rem", fontStyle: "italic", borderLeft: "4px solid var(--accent)", paddingLeft: 20, margin: "var(--sp-8) 0 0" }} className="display">
            &ldquo;Meu compromisso é olhar pra cada aluno como um caso único.&rdquo;
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-6)" }}>
          {differentiators.map((d) => (
            <div key={d.title} style={{ borderTop: "1px solid var(--ink-900)", paddingTop: "var(--sp-4)" }}>
              <h3 style={{ fontSize: "var(--fs-title-sm)", fontWeight: 600, margin: "0 0 8px" }}>{d.title}</h3>
              <p style={{ fontSize: "var(--fs-body-sm)", color: "var(--gray-500)", lineHeight: 1.6, margin: 0 }}>{d.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Depoimentos */}
      <section style={{ padding: "var(--sp-16) var(--sp-6)", borderBottom: "2px solid var(--ink-900)" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "var(--sp-6)" }}>
          {testimonials.map((t) => (
            <a
              key={t.name}
              href={t.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                border: "1px solid var(--ink-900)",
                borderRadius: "var(--r-md)",
                padding: "var(--sp-6)",
                textDecoration: "none",
                color: "inherit",
                display: "block",
              }}
            >
              <p style={{ fontSize: "var(--fs-body-lg)", lineHeight: 1.6, margin: 0 }}>&ldquo;{t.quote}&rdquo;</p>
              <p style={{ color: "var(--gray-500)", fontSize: "var(--fs-caption)", marginTop: "var(--sp-4)" }}>
                {t.name} · {t.role}
              </p>
            </a>
          ))}
        </div>
      </section>

      {/* PlansSection/FaqSection usam Card/Accordion do design system, feitos para
          fundo escuro (--bg-card, --text-secondary). Como esta variante é clara,
          forçamos aqui a cor de texto padrão (branco) que os cards esperam. */}
      <div style={{ background: "var(--ink-900)", color: "var(--white)" }}>
        <PlansSection appUrl={APP_URL} />
        <FaqSection />
      </div>

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
            background: "var(--ink-900)",
            color: "#fff",
            borderRadius: "var(--r-full)",
            fontWeight: 600,
          }}
        >
          Criar conta
        </a>
      </section>

      <LandingFooter variant="light" />
    </main>
  );
}
