import type { ReactNode } from "react";
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
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (!user) return <Navigate to={`/entrar?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  if (role && user.role !== role) return <Navigate to="/app" replace />;
  if (requireSubscription && user.role === "CLIENT" && !user.hasActiveSubscription) {
    // Quem já teve alguma assinatura (expirou/cancelou) vê a tela de renovação; quem nunca
    // assinou (ex.: conta criada mas contratação não concluída) vê a tela de boas-vindas.
    const motivo = user.hadSubscription ? "inativo" : "novo";
    return <Navigate to={`/planos?motivo=${motivo}`} replace />;
  }

  return <>{children}</>;
}
