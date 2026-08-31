import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, ContinuityRing } from "@couthealth/ui";
import { clientApi, anamnesisApi, authApi, ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { ClientLayout } from "./ClientLayout";

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
}

function daysUntil(value?: string | null) {
  if (!value) return null;
  const diff = Math.ceil((new Date(value).getTime() - Date.now()) / 86400000);
  return diff;
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.1em", color: "var(--text-secondary)" }}>{children}</span>
  );
}

/**
 * Conta criada ≠ plano contratado (fluxo definitivo): até a contratação ser confirmada, o painel
 * mostra a chamada comercial + a escolha de atendimento (online com planos COUT ou presencial,
 * que tem acesso livre sem cobrança pela plataforma).
 */
function NoPlanCta({ name }: { name?: string }) {
  const { accessToken, refreshUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [choosing, setChoosing] = useState(false);

  async function choosePresencial() {
    if (!accessToken) return;
    setError(null);
    setChoosing(true);
    try {
      await authApi.chooseModality("PRESENCIAL", accessToken);
      await refreshUser();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível continuar. Tente novamente.");
    } finally {
      setChoosing(false);
    }
  }

  return (
    <>
      <Card
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--sp-6)",
          flexWrap: "wrap",
          background: "var(--accent)",
          border: "none",
          marginBottom: "var(--sp-6)",
          padding: "var(--sp-8)",
        }}
      >
        <div>
          <span style={{ textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.1em", fontWeight: 700, color: "var(--ink-600)" }}>
            Bem-vindo, {name?.split(" ")[0] ?? "!"}
          </span>
          <h2 className="display" style={{ fontSize: "1.5rem", margin: "10px 0 4px", color: "var(--ink-900)" }}>
            Pronto para começar sua transformação?
          </h2>
          <p style={{ margin: 0, color: "var(--ink-700)", fontSize: "var(--fs-body-sm)", maxWidth: "52ch" }}>
            Escolha o acompanhamento ideal para o seu objetivo e dê o primeiro passo para melhorar sua composição corporal.
          </p>
        </div>
        <Button href="/planos" style={{ background: "var(--ink-900)", color: "var(--accent)" }}>
          Escolher meu plano
        </Button>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "var(--sp-6)" }}>
        <Card>
          <Eyebrow>Como você quer ser acompanhado?</Eyebrow>
          <h3 className="display" style={{ fontSize: "1.125rem", fontWeight: 600, margin: "10px 0 6px" }}>Sou aluno/paciente presencial</h3>
          <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", margin: "0 0 20px" }}>
            Acesso livre à sua área para consultar treino, plano alimentar e acompanhamento. As cobranças do atendimento
            presencial são tratadas diretamente com o profissional.
          </p>
          <Button variant="secondary" onClick={choosePresencial} disabled={choosing}>
            {choosing ? "Ativando…" : "Ativar acesso presencial"}
          </Button>
          {error && <p style={{ color: "var(--danger)", fontSize: "var(--fs-body-sm)", margin: "10px 0 0" }}>{error}</p>}
        </Card>

        <Link to="/planos" style={{ textDecoration: "none", color: "inherit" }}>
          <Card style={{ height: "100%" }}>
            <Eyebrow>Consultoria online</Eyebrow>
            <h3 className="display" style={{ fontSize: "1.125rem", fontWeight: 600, margin: "10px 0 6px" }}>Planos COUT — Essencial, Plus e Elite</h3>
            <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", margin: "0 0 20px" }}>
              Acompanhamento contínuo de nutrição e treino com contratação e pagamento pela plataforma.
            </p>
            <span style={{ fontSize: "0.9375rem", color: "var(--accent)", fontWeight: 600 }}>Ver planos →</span>
          </Card>
        </Link>
      </div>
    </>
  );
}

export function DashboardPage() {
  const { user, accessToken } = useAuth();
  const [data, setData] = useState<any>(null);
  // Anamnese pendente (RASCUNHO) → banner com CTA no topo do dashboard (fluxo de entrada).
  const [anamnesisPending, setAnamnesisPending] = useState(false);

  const hasAccess = Boolean(user?.hasActiveSubscription);

  useEffect(() => {
    if (!accessToken || !hasAccess) return;
    clientApi.dashboard(accessToken).then(setData);
    anamnesisApi
      .getMine(accessToken)
      .then((a) => setAnamnesisPending(a.status === "RASCUNHO"))
      .catch(() => setAnamnesisPending(false));
  }, [accessToken, hasAccess]);

  const days = daysUntil(data?.nextReview);
  const ringProgress = days != null ? Math.max(0, Math.min(1, 1 - days / 30)) : 0.3;

  return (
    <ClientLayout title="Início">
      <p style={{ fontSize: "1.0625rem", color: "var(--text-secondary)", margin: "0 0 var(--sp-8)" }}>
        Bom dia, {user?.name?.split(" ")[0] ?? ""}. Hoje é {formatDate(new Date().toISOString())}.
      </p>

      {!hasAccess && <NoPlanCta name={user?.name} />}

      {hasAccess && (
        <>
          {anamnesisPending && (
            <Card
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "var(--sp-6)",
                flexWrap: "wrap",
                background: "var(--accent)",
                border: "none",
                marginBottom: "var(--sp-6)",
                padding: "var(--sp-8)",
              }}
            >
              <div>
                <span style={{ textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.1em", fontWeight: 700, color: "var(--ink-600)" }}>
                  Passo importante
                </span>
                <h2 className="display" style={{ fontSize: "1.375rem", margin: "10px 0 4px", color: "var(--ink-900)" }}>
                  Complete sua anamnese
                </h2>
                <p style={{ margin: 0, color: "var(--ink-700)", fontSize: "var(--fs-body-sm)", maxWidth: "52ch" }}>
                  Seu atendimento está ativo. Preencha o formulário para que a equipe monte seu plano alimentar e treino personalizados.
                </p>
              </div>
              <Button href="/anamnese" style={{ background: "var(--ink-900)", color: "var(--accent)" }}>
                Preencher agora
              </Button>
            </Card>
          )}

          <Card
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "var(--sp-6)",
              padding: "var(--sp-8)",
            }}
          >
            <div>
              <Eyebrow>Próxima revisão profissional</Eyebrow>
              <h2 className="display" style={{ fontSize: "1.5rem", margin: "10px 0 0" }}>
                {days != null ? (days <= 0 ? "Hoje" : `Em ${days} dia${days > 1 ? "s" : ""}`) : "A combinar"}
              </h2>
            </div>
            <ContinuityRing progress={ringProgress} size={80} strokeWidth={5} />
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "var(--sp-6)" }}>
            <Card>
              <Eyebrow>Plano ativo</Eyebrow>
              <h3 style={{ fontSize: "1.125rem", fontWeight: 600, margin: "10px 0 20px" }}>
                {data?.subscription?.plan?.name ?? user?.activePlanName ?? "Atendimento presencial"}
              </h3>
            </Card>

            <Link to="/app/nutricao" style={{ textDecoration: "none", color: "inherit" }}>
              <Card>
                <Eyebrow>Último plano alimentar</Eyebrow>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 600, margin: "10px 0 20px" }}>{formatDate(data?.lastMealPlanPublishedAt)}</h3>
                <span style={{ fontSize: "0.9375rem", color: "var(--accent)", fontWeight: 600 }}>Ver plano →</span>
              </Card>
            </Link>

            <Link to="/app/treino" style={{ textDecoration: "none", color: "inherit" }}>
              <Card>
                <Eyebrow>Treinos publicados</Eyebrow>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 600, margin: "10px 0 20px" }}>{data?.workoutsCount ?? 0}</h3>
                <span style={{ fontSize: "0.9375rem", color: "var(--accent)", fontWeight: 600 }}>Iniciar →</span>
              </Card>
            </Link>

            <Link to="/app/mensagens" style={{ textDecoration: "none", color: "inherit" }}>
              <Card>
                <Eyebrow>Últimas mensagens</Eyebrow>
                <p style={{ fontSize: "0.9375rem", color: "var(--text-primary)", margin: "10px 0 20px" }}>
                  {data?.lastMessage?.body ?? "Sem mensagens ainda"}
                </p>
                <span style={{ fontSize: "0.9375rem", color: "var(--accent)", fontWeight: 600 }}>Abrir conversa →</span>
              </Card>
            </Link>

            <Link to="/app/notificacoes" style={{ textDecoration: "none", color: "inherit" }}>
              <Card>
                <Eyebrow>Notificações não lidas</Eyebrow>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 600, margin: "10px 0 20px" }}>{data?.unreadNotifications?.length ?? 0}</h3>
              </Card>
            </Link>

            <Link to="/app/checkin" style={{ textDecoration: "none", color: "inherit" }}>
              <Card>
                <Eyebrow>Próximo check-in</Eyebrow>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 600, margin: "10px 0 20px" }}>Disponível</h3>
                <span style={{ fontSize: "0.9375rem", color: "var(--accent)", fontWeight: 600 }}>Responder agora →</span>
              </Card>
            </Link>
          </div>
        </>
      )}
    </ClientLayout>
  );
}
