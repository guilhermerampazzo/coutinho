import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, ContinuityRing } from "@couthealth/ui";
import { anamnesisApi, assessmentsApi, ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { questions, stepsMeta, type Question } from "./steps";
import { StepField } from "./StepField";

const ASSESSMENT_DRAFT_KEY = "couthealth:anamnesis-assessment";

function isVisible(q: Question, answers: Record<string, unknown>): boolean {
  if (!q.gate) return true;
  return answers[q.gate.key] === q.gate.value;
}

/** Converte o valor bruto do StepField para o formato persistido na API (usado no save). */
function serializeValue(q: Question, v: unknown): unknown {
  if (q.type === "chips") return Array.isArray(v) ? v.join(", ") : v;
  if (q.type === "number" || q.type === "slider") {
    if (v === "" || v === undefined || v === null) return undefined;
    return Number(v);
  }
  if (q.type === "choice" && (q.key === "mealsPerDay" || q.key === "trainingDaysPerWeek")) {
    if (v === undefined || v === null) return undefined;
    return Number(v === "7 ou mais" ? 7 : v);
  }
  return v;
}

/** Converte o valor persistido de volta para o formato bruto do StepField. */
function deserializeValue(q: Question, v: unknown): unknown {
  if (q.type === "chips") return typeof v === "string" && v ? v.split(", ") : [];
  // Choice/inputs numéricos: o banco devolve number; o StepField compara com strings
  // (opt.value "6") — sem essa conversão a opção salva nunca aparece selecionada (bug visto
  // em produção: "a escolha trava" ao voltar na pergunta).
  if (q.type === "number" || q.type === "slider") {
    return v === null || v === undefined ? "" : String(v);
  }
  if (q.type === "choice" && (q.key === "mealsPerDay" || q.key === "trainingDaysPerWeek")) {
    return v === null || v === undefined ? undefined : String(v);
  }
  return v;
}

function isEmpty(q: Question, v: unknown): boolean {
  if (v === undefined || v === null || v === "") return true;
  if (q.type === "chips") return Array.isArray(v) && v.length === 0;
  return false;
}

export function AnamnesisPage() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [assessmentData, setAssessmentData] = useState<Record<string, string | undefined>>({});
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    anamnesisApi
      .getMine(accessToken)
      .then((data) => {
        const { id, status, currentStep, userId, createdAt, updatedAt, submittedAt, analyzedAt, ...fields } = data as any;
        setFormData(fields);
        setStepIndex(Math.min(currentStep ?? 0, questions.length - 1));
        setAlreadySubmitted(status !== "RASCUNHO");
        // Rascunho da avaliação física (etapa 6) — sobrevive a sair e voltar na mesma máquina.
        try {
          const draft = localStorage.getItem(ASSESSMENT_DRAFT_KEY);
          if (draft) {
            const parsed = JSON.parse(draft);
            const normalized: Record<string, string | undefined> = {};
            for (const [k, v] of Object.entries(parsed)) {
              normalized[k] = v === null || v === undefined ? undefined : String(v);
            }
            setAssessmentData(normalized);
          }
        } catch {
          // ignora rascunho corrompido
        }
      })
      .catch(() => setError("Não foi possível carregar sua anamnese."))
      .finally(() => setLoading(false));
  }, [accessToken]);

  // Pergunta atual = primeira visível a partir do stepIndex salvo (pula condicionais fechadas).
  const current = useMemo(() => {
    for (let i = stepIndex; i < questions.length; i++) {
      if (isVisible(questions[i], formData)) return { q: questions[i], listIndex: i };
    }
    for (let i = 0; i < stepIndex; i++) {
      if (isVisible(questions[i], formData)) return { q: questions[i], listIndex: i };
    }
    return { q: questions[questions.length - 1], listIndex: questions.length - 1 };
  }, [stepIndex, formData]);

  const isLast = current.listIndex === questions.length - 1;
  const stepMeta = stepsMeta[current.q.step - 1];
  const progress = current.q.step / stepsMeta.length;

  // Valor exibido: campos assessment.* vivem no assessmentData (rascunho da avaliação);
  // os demais, no formData. Sem isso o input numérico da etapa 6 é limpo a cada
  // re-render (bug "o campo não permitiu digitar" visto em produção).
  const currentValue = current.q.key.startsWith("assessment.")
    ? deserializeValue(current.q, assessmentData[current.q.key.replace("assessment.", "")])
    : deserializeValue(current.q, formData[current.q.key]);

  const flashSaved = useCallback(() => {
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1600);
  }, []);

  async function save(nextStep: number) {
    if (!accessToken) return;
    setSaving(true);
    setError(null);
    try {
      // Serializa os valores brutos (strings do StepField) para o formato da API
      // (numbers/ints/enums) — só campos com resposta entram no body.
      const payload: Record<string, unknown> = { currentStep: nextStep };
      for (const q of questions) {
        const raw = formData[q.key];
        if (raw === undefined || raw === null || raw === "") continue;
        const serialized = serializeValue(q, raw);
        if (serialized !== undefined) payload[q.key] = serialized;
      }
      await anamnesisApi.updateMine(payload, accessToken);
      flashSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível salvar. Tente novamente.");
      throw err;
    } finally {
      setSaving(false);
    }
  }

  function setValue(key: string, value: unknown) {
    if (key.startsWith("assessment.")) {
      const field = key.replace("assessment.", "");
      const raw = (value as string | undefined) ?? undefined;
      setAssessmentData((prev) => {
        const next = { ...prev, [field]: raw };
        localStorage.setItem(ASSESSMENT_DRAFT_KEY, JSON.stringify(next));
        return next;
      });
    } else {
      setFormData((prev) => ({ ...prev, [key]: value }));
    }
  }

  async function handleAnswerLater() {
    try {
      await save(stepIndex);
      navigate("/app");
    } catch {
      // erro já exibido
    }
  }

  async function handleNext() {
    const value = formData[current.q.key];
    if (!current.q.optional && isEmpty(current.q, value)) {
      setError(current.q.type === "chips" ? "Selecione pelo menos uma opção." : "Responda para continuar.");
      return;
    }
    try {
      if (!isLast) {
        await save(current.listIndex + 1);
        setStepIndex((s) => current.listIndex + 1);
        return;
      }
      // Última pergunta: salva, cria avaliação física (se preenchida) e envia.
      await save(current.listIndex);
      const hasAssessment = Object.values(assessmentData).some((v) => v !== undefined && v !== null && v !== "");
      if (hasAssessment && accessToken) {
        const numeric: Record<string, number> = {};
        for (const [k, v] of Object.entries(assessmentData)) {
          if (v !== undefined && v !== null && v !== "" && !Number.isNaN(Number(v))) {
            numeric[k] = Number(v);
          }
        }
        await assessmentsApi.create(numeric, accessToken);
      }
      if (accessToken) await anamnesisApi.submitMine(accessToken);
      localStorage.removeItem(ASSESSMENT_DRAFT_KEY);
      setDone(true);
    } catch {
      // erro já exibido
    }
  }

  async function handleBack() {
    if (current.listIndex <= 0) return;
    try {
      await save(current.listIndex - 1);
      setStepIndex(current.listIndex - 1);
    } catch {
      // erro já exibido
    }
  }

  if (loading) return null;

  if (alreadySubmitted) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "var(--sp-6)", background: "var(--bg-base)" }}>
        <div>
          <ContinuityRing progress={1} size={64} />
          <h1 className="display" style={{ margin: "var(--sp-6) 0" }}>
            Anamnese já enviada
          </h1>
          <p style={{ color: "var(--text-secondary)" }}>Sua anamnese está com a equipe para análise.</p>
          <Button href="/app" style={{ marginTop: "var(--sp-6)" }}>
            Ir para o painel
          </Button>
        </div>
      </main>
    );
  }

  if (done) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "var(--sp-6)", background: "var(--bg-base)" }}>
        <div style={{ maxWidth: 480 }}>
          <ContinuityRing progress={1} size={80} strokeWidth={5} />
          <h1 className="display" style={{ fontSize: "var(--fs-display-sm)", margin: "var(--sp-8) 0 var(--sp-4)" }}>
            Tudo certo!
          </h1>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
            Suas informações foram enviadas. Agora eu vou analisar tudo e preparar seu acompanhamento.
          </p>
          <p className="display" style={{ fontSize: "var(--fs-title-lg)", color: "var(--accent)", margin: "var(--sp-6) 0" }}>
            Você fez a sua parte. Agora é comigo.
          </p>
          <Button href="/app" style={{ marginTop: "var(--sp-4)" }}>
            Ir para o painel
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", padding: "var(--sp-12) var(--sp-6)", background: "var(--bg-base)" }}>
      <div style={{ width: "100%", maxWidth: 560, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--sp-8)" }}>
          <div>
            <span style={{ textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.12em", color: "var(--text-secondary)" }}>
              Etapa {current.q.step} de {stepsMeta.length} · {stepMeta.title}
            </span>
            <h1 className="display" style={{ fontSize: "1.75rem", margin: "8px 0 0" }}>
              {stepMeta.title}
            </h1>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <ContinuityRing progress={progress} size={64} strokeWidth={4} label={`${current.q.step}/${stepsMeta.length}`} />
          </div>
        </div>

        <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-body-sm)", margin: "0 0 var(--sp-5)", lineHeight: 1.5 }}>
          {stepMeta.intro}
        </p>

        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-hairline)", borderRadius: "var(--r-lg)", padding: "var(--sp-10)", marginBottom: "var(--sp-6)" }}>
          <h2 style={{ fontSize: "var(--fs-title-md)", margin: "0 0 var(--sp-6)", lineHeight: 1.35 }}>{current.q.label}</h2>
          {current.q.hint && (
            <p style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-body-sm)", margin: "-12px 0 var(--sp-5)", lineHeight: 1.5 }}>{current.q.hint}</p>
          )}
          <StepField
            question={current.q}
            value={currentValue}
            onChange={(v) => setValue(current.q.key, v)}
          />
        </div>

        {error && <p style={{ color: "var(--danger)", fontSize: "var(--fs-body-sm)", margin: "0 0 var(--sp-4)" }}>{error}</p>}
        {savedFlash && !error && (
          <p style={{ color: "var(--success)", fontSize: "var(--fs-caption)", margin: "0 0 var(--sp-4)" }}>Seu progresso foi salvo.</p>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--sp-3)" }}>
          <button
            onClick={handleAnswerLater}
            disabled={saving}
            style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: "0.875rem", cursor: saving ? "not-allowed" : "pointer", padding: 0 }}
          >
            Responder depois
          </button>
          <div style={{ display: "flex", gap: "var(--sp-3)" }}>
            {current.listIndex > 0 && (
              <Button variant="secondary" onClick={handleBack} disabled={saving} style={{ borderRadius: "var(--r-full)" }}>
                Voltar
              </Button>
            )}
            <Button onClick={handleNext} disabled={saving} style={{ borderRadius: "var(--r-full)" }}>
              {saving ? "Salvando…" : isLast ? "Concluir" : "Próximo"}
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
