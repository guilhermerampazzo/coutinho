import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./auth";

export function ProtectedRoute({
  children,
  role,
  requireSubscription,
}: {
  children: ReactNode;
  role?: "CLIENT" | "PROFESSIONAL";
  /** Área só liberada com assinatura ACTIVE — o pagamento é o que libera a conta (ver escopo.md). */
  requireSubscription?: boolean;
}) {
  const { user, loading, refreshUser } = useAuth();
  const location = useLocation();
  // Confirmação ao vivo (uma vez por montagem): o contexto pode estar stale — ex.: o usuário acabou
  // de pagar e foi redirecionado para /anamnese, mas o `user` ainda não sabe da assinatura ativa.
  // Sem isso, ele seria devolvido para /planos mesmo com o pagamento aprovado.
  const [liveChecked, setLiveChecked] = useState(false);

  useEffect(() => {
    if (loading || liveChecked) return;
    if (user?.role !== "CLIENT" || user.hasActiveSubscription) return;
    setLiveChecked(true);
    void refreshUser();
  }, [loading, liveChecked, user?.role, user?.hasActiveSubscription, refreshUser]);

  if (loading) return null;
  if (!user) return <Navigate to={`/entrar?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  if (role && user.role !== role) return <Navigate to="/app" replace />;
  if (requireSubscription && user.role === "CLIENT" && !user.hasActiveSubscription) {
    // Aguarda o refresh ao vivo antes de decidir — evita o "flash" de redirecionamento errado.
    if (!liveChecked) return null;
    // Quem já teve alguma assinatura (expirou/cancelou) vê a tela de renovação; quem nunca
    // assinou (ex.: conta criada mas contratação não concluída) vê a tela de boas-vindas.
    const motivo = user.hadSubscription ? "inativo" : "novo";
    return <Navigate to={`/planos?motivo=${motivo}`} replace />;
  }

  return <>{children}</>;
}
