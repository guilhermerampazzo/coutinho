export const API_URL = import.meta.env.VITE_API_URL ?? "https://localhost/api";
export const SITE_URL = import.meta.env.VITE_SITE_URL ?? "https://localhost";

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const body = await res.json().catch(() => undefined);
  if (!res.ok) {
    throw new ApiError(body?.message ?? "Erro inesperado. Tente novamente.", res.status);
  }
  return body as T;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "CLIENT" | "PROFESSIONAL";
  hasActiveSubscription: boolean;
  activePlanName?: string;
  hadSubscription: boolean;
}

export interface AuthResponse {
  user: AuthUser;
  tokens: { accessToken: string; refreshToken: string };
}

export const authApi = {
  register: (data: { email: string; password: string; name: string; consent: boolean }) =>
    request<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) =>
    request<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  me: (token: string) => request<AuthUser>("/auth/me", {}, token),
  /** Quais logins sociais estão configurados no servidor — evita mostrar botão que só daria erro. */
  providers: () => request<{ google: boolean; apple: boolean }>("/auth/providers"),
};

export interface Plan {
  id: string;
  code: "ESSENCIAL" | "PLUS" | "ELITE";
  name: string;
  tagline: string;
  monthlyPrice: number;
  features: string[];
}

export const plansApi = {
  list: () => request<Plan[]>("/plans"),
};

export const couponsApi = {
  validate: (code: string) => request<{ code: string; percentOff: number }>("/coupons/validate", { method: "POST", body: JSON.stringify({ code }) }),
};

export interface PixPaymentInfo {
  qrCode: string;
  qrCodeImageUrl: string;
  hostedInstructionsUrl?: string;
  /** Timestamp (segundos) em que o QR expira. */
  expiresAt: number;
}

export interface CheckoutResponse {
  subscriptionId: string;
  method: "pix" | "cartao";
  amount: number;
  /** Cartão (assinatura recorrente) — monta o Embedded Checkout com este client_secret. */
  clientSecret?: string;
  /** PIX customizado — QR para exibir na própria página. */
  pix?: PixPaymentInfo;
}

export type PixStatus = "pending" | "paid" | "expired" | "failed";

export interface PixStatusResponse {
  status: PixStatus;
  expiresAt?: number;
  amount?: number;
  /** Preenchidos quando ainda pendente — permitem retomar o pagamento após recarregar a página. */
  qrCode?: string;
  qrCodeImageUrl?: string;
  hostedInstructionsUrl?: string;
}

export interface Anamnesis {
  id: string;
  status: "RASCUNHO" | "ENVIADA" | "ANALISADA";
  currentStep: number;
  [key: string]: unknown;
}

export const anamnesisApi = {
  getMine: (token: string) => request<Anamnesis>("/anamnesis/me", {}, token),
  updateMine: (data: Record<string, unknown>, token: string) =>
    request<Anamnesis>("/anamnesis/me", { method: "PATCH", body: JSON.stringify(data) }, token),
  submitMine: (token: string) => request<Anamnesis>("/anamnesis/me/submit", { method: "POST" }, token),
};

export const assessmentsApi = {
  create: (data: Record<string, number | undefined>, token: string) =>
    request("/assessments", { method: "POST", body: JSON.stringify(data) }, token),
};

export interface ClientListItem {
  id: string;
  name: string;
  email: string;
  anamnesis: { status: string; submittedAt: string | null } | null;
  subscriptions: { status: string; plan: { name: string } }[];
}

export const adminApi = {
  listClients: (token: string) => request<ClientListItem[]>("/admin/clients", {}, token),
  /** Cadastro manual de cliente pela recepção. */
  createClient: (data: { name: string; email: string; password: string }, token: string) =>
    request<{ id: string; name: string; email: string }>("/admin/clients", { method: "POST", body: JSON.stringify(data) }, token),
  /** Remove o cadastro (anonimiza + cancela cobranças) — a conta some da lista. */
  removeClient: (id: string, token: string) => request<{ ok: boolean }>(`/admin/clients/${id}`, { method: "DELETE" }, token),
  clientDetail: (id: string, token: string) => request<any>(`/admin/clients/${id}`, {}, token),
  /** Resumo inteligente da anamnese (IA organiza/sintetiza — o profissional decide). */
  clientSummary: (id: string, token: string) =>
    request<{ short: string; attentionPoints: string[]; detailed: { category: string; items: string[] }[] }>(
      `/admin/clients/${id}/summary`,
      {},
      token
    ),
  createMealPlan: (clientId: string, data: { meals: any[] }, token: string) =>
    request<any>(`/admin/clients/${clientId}/meal-plan`, { method: "POST", body: JSON.stringify(data) }, token),
  publishMealPlan: (mealPlanId: string, token: string) =>
    request<any>(`/admin/meal-plans/${mealPlanId}/publish`, { method: "POST" }, token),
  createWorkout: (clientId: string, data: { letter: string; exercises: any[] }, token: string) =>
    request<any>(`/admin/clients/${clientId}/workout`, { method: "POST", body: JSON.stringify(data) }, token),
  publishWorkout: (workoutId: string, token: string) =>
    request<any>(`/admin/workouts/${workoutId}/publish`, { method: "POST" }, token),
  clientMessages: (clientId: string, token: string) => request<any>(`/admin/clients/${clientId}/messages`, {}, token),
  replyToClient: (clientId: string, body: string, token: string) =>
    request<any>(`/admin/clients/${clientId}/messages`, { method: "POST", body: JSON.stringify({ body }) }, token),
};

export interface FoodCategory {
  id: string;
  name: string;
  order: number;
  _count?: { foods: number };
}

export interface FoodItem {
  id: string;
  name: string;
  categoryId: string;
  category?: FoodCategory;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  notes?: string;
}

export const foodsApi = {
  list: (search?: string, categoryId?: string) =>
    request<FoodItem[]>(`/foods?${new URLSearchParams({ ...(search ? { search } : {}), ...(categoryId ? { categoryId } : {}) })}`),
  categories: () => request<FoodCategory[]>("/foods/categories"),
  createCategory: (name: string, token: string) => request<FoodCategory>("/foods/categories", { method: "POST", body: JSON.stringify({ name }) }, token),
  removeCategory: (id: string, token: string) => request<void>(`/foods/categories/${id}`, { method: "DELETE" }, token),
  create: (data: Omit<FoodItem, "id" | "category">, token: string) => request<FoodItem>("/foods", { method: "POST", body: JSON.stringify(data) }, token),
  update: (id: string, data: Partial<FoodItem>, token: string) =>
    request<FoodItem>(`/foods/${id}`, { method: "PATCH", body: JSON.stringify(data) }, token),
  remove: (id: string, token: string) => request<void>(`/foods/${id}`, { method: "DELETE" }, token),
};

export interface MuscleGroup {
  id: string;
  name: string;
  order: number;
  _count?: { exercises: number };
}

export interface ExerciseItem {
  id: string;
  name: string;
  muscleGroupId: string;
  muscleGroup?: MuscleGroup;
  description?: string;
  videoUrl?: string;
}

export const exercisesApi = {
  list: (search?: string, muscleGroupId?: string) =>
    request<ExerciseItem[]>(`/exercises?${new URLSearchParams({ ...(search ? { search } : {}), ...(muscleGroupId ? { muscleGroupId } : {}) })}`),
  muscleGroups: () => request<MuscleGroup[]>("/exercises/muscle-groups"),
  createMuscleGroup: (name: string, token: string) => request<MuscleGroup>("/exercises/muscle-groups", { method: "POST", body: JSON.stringify({ name }) }, token),
  removeMuscleGroup: (id: string, token: string) => request<void>(`/exercises/muscle-groups/${id}`, { method: "DELETE" }, token),
  create: (data: Omit<ExerciseItem, "id" | "muscleGroup">, token: string) =>
    request<ExerciseItem>("/exercises", { method: "POST", body: JSON.stringify(data) }, token),
  update: (id: string, data: Partial<ExerciseItem>, token: string) =>
    request<ExerciseItem>(`/exercises/${id}`, { method: "PATCH", body: JSON.stringify(data) }, token),
  remove: (id: string, token: string) => request<void>(`/exercises/${id}`, { method: "DELETE" }, token),
};

export const clientApi = {
  dashboard: (token: string) => request<any>("/client/dashboard", {}, token),
  nutrition: (token: string) => request<any>("/client/nutrition", {}, token),
  workouts: (token: string) => request<any[]>("/client/workouts", {}, token),
  exportData: (token: string) => request<any>("/client/export", {}, token),
  requestDeletion: (token: string) => request<{ ok: boolean }>("/client/request-deletion", { method: "POST" }, token),
};

export const notificationsApi = {
  mine: (token: string) => request<any[]>("/notifications/me", {}, token),
  markRead: (id: string, token: string) => request<any>(`/notifications/me/${id}/read`, { method: "POST" }, token),
};

export const messagesApi = {
  mine: (token: string) => request<{ thread: any; messages: any[] }>("/messages/me", {}, token),
  send: (body: string, token: string) => request<any>("/messages/me", { method: "POST", body: JSON.stringify({ body }) }, token),
};

export interface Assessment {
  id: string;
  weightKg?: number;
  waistCm?: number;
  abdomenCm?: number;
  armCm?: number;
  thighCm?: number;
  muscleMassKg?: number;
  fatMassKg?: number;
  recordedAt: string;
}

export const assessmentsListApi = {
  mine: (token: string) => request<Assessment[]>("/assessments/me", {}, token),
};

export interface CheckIn {
  id: string;
  kind: "NUTRICAO" | "TREINO";
  question: string;
  answer?: string | null;
  answeredAt?: string | null;
  createdAt: string;
}

export const checkinsApi = {
  mine: (token: string) => request<CheckIn[]>("/checkins/me", {}, token),
  answer: (id: string, answer: string, token: string) =>
    request<CheckIn>(`/checkins/me/${id}`, { method: "PATCH", body: JSON.stringify({ answer }) }, token),
};

export const adminNotificationsApi = {
  list: (token: string) => request<any[]>("/admin/notifications", {}, token),
  create: (data: { title: string; body: string; audience: string; scheduledFor?: string }, token: string) =>
    request<any>("/admin/notifications", { method: "POST", body: JSON.stringify(data) }, token),
};

export interface Coupon {
  id: string;
  code: string;
  percentOff: number;
  active: boolean;
  expiresAt: string | null;
}

export const adminCouponsApi = {
  list: (token: string) => request<Coupon[]>("/coupons/admin/all", {}, token),
  create: (data: { code: string; percentOff: number; expiresAt?: string }, token: string) =>
    request<Coupon>("/coupons/admin", { method: "POST", body: JSON.stringify(data) }, token),
  update: (id: string, data: Partial<Pick<Coupon, "active" | "percentOff">>, token: string) =>
    request<Coupon>(`/coupons/admin/${id}`, { method: "PATCH", body: JSON.stringify(data) }, token),
};

export const adminSubscriptionsApi = {
  list: (token: string) => request<any[]>("/admin/subscriptions", {}, token),
  update: (id: string, data: { status?: string; planCode?: string }, token: string) =>
    request<any>(`/admin/subscriptions/${id}`, { method: "PATCH", body: JSON.stringify(data) }, token),
};

export const adminPlansApi = {
  update: (id: string, data: Partial<Plan>, token: string) =>
    request<Plan>(`/plans/admin/${id}`, { method: "PATCH", body: JSON.stringify(data) }, token),
};

export interface CheckoutConfig {
  provider: "STRIPE";
  publicKey?: string;
}

export const paymentsApi = {
  checkout: (
    data: {
      planCode: string;
      period: string;
      couponCode?: string;
      method: "pix" | "cartao";
    },
    token: string
  ) => request<CheckoutResponse>("/checkout", { method: "POST", body: JSON.stringify(data) }, token),
  checkoutConfig: () => request<CheckoutConfig>("/payments/checkout-config"),
  /** Status do PIX (polling) — também ativa a assinatura se o pagamento já foi pago (falha segura). */
  pixStatus: (subscriptionId: string, token: string) =>
    request<PixStatusResponse>(`/payments/status/${subscriptionId}`, {}, token),
  /** Gera um novo QR PIX para a mesma assinatura pendente (QR expirado). */
  regeneratePix: (subscriptionId: string, token: string) =>
    request<CheckoutResponse>(`/payments/pix/regenerate/${subscriptionId}`, { method: "POST" }, token),
};
