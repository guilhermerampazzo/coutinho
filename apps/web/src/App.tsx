import { Routes, Route, Navigate } from "react-router-dom";
import { ContinuityRing } from "@couthealth/ui";
import { RegisterPage } from "./pages/RegisterPage";
import { LoginPage } from "./pages/LoginPage";
import { AuthCallbackPage } from "./pages/AuthCallbackPage";
import { PlansPage } from "./pages/PlansPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { AnamnesisPage } from "./pages/anamnesis/AnamnesisPage";
import { DashboardPage } from "./pages/client/DashboardPage";
import { NutritionPage } from "./pages/client/NutritionPage";
import { WorkoutPage } from "./pages/client/WorkoutPage";
import { MessagesPage } from "./pages/client/MessagesPage";
import { NotificationsPage } from "./pages/client/NotificationsPage";
import { EvolutionPage } from "./pages/client/EvolutionPage";
import { CheckInPage } from "./pages/client/CheckInPage";
import { ProfilePage } from "./pages/client/ProfilePage";
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage";
import { AdminClientDetailPage } from "./pages/admin/AdminClientDetailPage";
import { AdminFoodsPage } from "./pages/admin/AdminFoodsPage";
import { AdminExercisesPage } from "./pages/admin/AdminExercisesPage";
import { AdminNotificationsPage } from "./pages/admin/AdminNotificationsPage";
import { AdminCouponsPage } from "./pages/admin/AdminCouponsPage";
import { AdminSubscriptionsPage } from "./pages/admin/AdminSubscriptionsPage";
import { ProtectedRoute } from "./lib/ProtectedRoute";

function Placeholder({ title }: { title: string }) {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--sp-6)",
        textAlign: "center",
      }}
    >
      <ContinuityRing progress={0.3} size={64} />
      <h1 className="display">{title}</h1>
      <p style={{ color: "var(--text-secondary)" }}>Módulos completos chegam nas próximas fases.</p>
    </main>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/app" replace />} />

      <Route path="/criar-conta" element={<RegisterPage />} />
      <Route path="/entrar" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      {/* Públicas: escolha de plano e contratação acontecem antes do cadastro (Iniciar plano → Contratação → Cadastro). */}
      <Route path="/planos" element={<PlansPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route
        path="/anamnese"
        element={
          <ProtectedRoute requireSubscription>
            <AnamnesisPage />
          </ProtectedRoute>
        }
      />

      {/* Painel é a área central do cliente desde a criação da conta — recursos são liberados conforme
          o status (CTA comercial até contratar; presencial tem acesso livre sem cobrança). */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/nutricao"
        element={
          <ProtectedRoute requireSubscription>
            <NutritionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/treino"
        element={
          <ProtectedRoute requireSubscription>
            <WorkoutPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/mensagens"
        element={
          <ProtectedRoute requireSubscription>
            <MessagesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/evolucao"
        element={
          <ProtectedRoute requireSubscription>
            <EvolutionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/checkin"
        element={
          <ProtectedRoute requireSubscription>
            <CheckInPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/notificacoes"
        element={
          <ProtectedRoute requireSubscription>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/perfil"
        element={
          <ProtectedRoute requireSubscription>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute role="PROFESSIONAL">
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/clientes/:id"
        element={
          <ProtectedRoute role="PROFESSIONAL">
            <AdminClientDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/alimentos"
        element={
          <ProtectedRoute role="PROFESSIONAL">
            <AdminFoodsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/exercicios"
        element={
          <ProtectedRoute role="PROFESSIONAL">
            <AdminExercisesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/notificacoes"
        element={
          <ProtectedRoute role="PROFESSIONAL">
            <AdminNotificationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/cupons"
        element={
          <ProtectedRoute role="PROFESSIONAL">
            <AdminCouponsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/assinaturas"
        element={
          <ProtectedRoute role="PROFESSIONAL">
            <AdminSubscriptionsPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Placeholder title="Não encontrado" />} />
    </Routes>
  );
}
