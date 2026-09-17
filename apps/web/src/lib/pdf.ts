import type { ProfessionalProfile } from "./api";

// Identidade COUT — amarelo ouro + preto, mesma tipografia do app.
export const COUT = {
  accent: "#f7be00",
  ink: "#17181b",
  muted: "#6b7280",
  light: "#9ca3af",
  border: "#e5e7eb",
};

export function calcAge(birthDate?: string | null): string {
  if (!birthDate) return "—";
  const b = new Date(birthDate);
  if (Number.isNaN(b.getTime())) return "—";
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return `${age} anos`;
}

export function calcImc(weightKg?: number | null, heightCm?: number | null): string {
  if (!weightKg || !heightCm || heightCm <= 0) return "—";
  const h = heightCm / 100;
  return `${(weightKg / (h * h)).toFixed(1)} kg/m2`;
}

function fmtQty(q?: number | null, unit?: string | null): string {
  if (q === null || q === undefined) return unit ?? "";
  const s = Number.isInteger(q) ? String(q) : String(q).replace(".", ",");
  return unit ? `${s} ${unit.toLowerCase()}` : s;
}

function esc(s: unknown): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function siteLogoUrl(): string {
  try {
    return `${window.location.origin}/logo.webp`;
  } catch {
    return "/logo.webp";
  }
}

function professionalHeaderHtml(pro: ProfessionalProfile): string {
  return `
  <div style="display:flex;justify-content:space-between;gap:32px;margin-bottom:28px;align-items:center;">
    <div style="display:flex;align-items:center;gap:12px;">
      <img src="${siteLogoUrl()}" alt="COUT" style="height:44px;width:auto;display:block;filter:brightness(0);" onerror="this.style.display='none'" />
    </div>
    <div style="font-size:12px;color:#4b5563;line-height:1.7;text-align:left;">
      <div>👤 ${esc(pro.name)}</div>
      <div>💼 ${esc(pro.title)}${pro.registration ? ` · ${esc(pro.registration)}` : ""}</div>
      ${pro.email ? `<div>✉️ ${esc(pro.email)}</div>` : ""}
    </div>
    <div style="font-size:12px;color:#4b5563;line-height:1.7;text-align:left;">
      ${pro.phone ? `<div>📞 ${esc(pro.phone)}</div>` : ""}
      ${pro.location ? `<div>📍 ${esc(pro.location)}</div>` : ""}
    </div>
  </div>`;
}

function clientInfoHtml(client: any): string {
  const an = client?.anamnesis ?? {};
  const latest = (client?.assessments ?? []).slice(-1)[0] ?? {};
  const weight = latest.weightKg ?? an.weightKg ?? null;
  const height = latest.heightCm ?? an.heightCm ?? null;
  return `
  <h2 style="font-size:15px;letter-spacing:0.06em;margin:0 0 12px;">INFORMAÇÕES DO CLIENTE</h2>
  <div style="display:flex;gap:24px;margin-bottom:8px;align-items:flex-start;">
    <div style="width:52px;height:52px;border-radius:999px;background:#fef3c7;display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;">👤</div>
    <div style="font-size:13px;line-height:1.8;">
      <div style="font-weight:700;font-size:14px;">${esc(client?.name ?? "")}</div>
      <div style="color:${COUT.muted};">${esc(client?.email ?? "")}</div>
    </div>
    <div style="font-size:12px;line-height:1.9;color:#4b5563;">
      <div><strong style="color:${COUT.ink};">IDADE</strong> ${esc(calcAge(an.birthDate))}</div>
      <div><strong style="color:${COUT.ink};">IMC</strong> ${esc(calcImc(weight, height))}</div>
    </div>
    <div style="font-size:12px;line-height:1.9;color:#4b5563;">
      <div><strong style="color:${COUT.ink};">ALTURA</strong> ${height ? `${esc(height)} cm` : "—"}</div>
      <div><strong style="color:${COUT.ink};">PESO</strong> ${weight ? `${esc(weight)} kg` : "—"}</div>
    </div>
  </div>`;
}

function substitutesHtml(subs?: any[]): string {
  if (!subs || subs.length === 0) return "";
  return subs
    .map((s: any) => {
      const name = esc(s.food?.name ?? "");
      const qty = s.quantity ? ` [${esc(fmtQty(s.quantity, s.unit))}${s.food ? ` ${esc(s.food.kcal ?? "")}` : ""}]` : "";
      // Formato Nutrium: "ou 1 unidade de X [110 g]"
      const detail = s.quantity ? ` ${esc(fmtQty(s.quantity, s.unit))} de ${name}${s.food?.kcal ? ` (${s.food.kcal} kcal/100g)` : ""}` : ` ${name}`;
      return `<span style="color:${COUT.ink};font-weight:600;"> ou</span><span style="color:${COUT.muted};">${detail}${qty && false ? qty : ""}</span>`;
    })
    .join("");
}

export function mealPlanPdfHtml(plan: any, pro: ProfessionalProfile, client: any): string {
  const created = plan.createdAt ? new Date(plan.createdAt).toLocaleDateString("pt-BR") : "";
  const time = plan.createdAt
    ? new Date(plan.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : "";
  const meals = (plan.meals ?? [])
    .map(
      (m: any) => `
    <div style="margin-bottom:22px;">
      <div style="font-weight:800;font-size:13px;margin-bottom:8px;"><span style="margin-right:10px;">${esc(m.time ?? "")}</span> ${esc((m.name ?? "").toUpperCase())}</div>
      ${m.notes ? `<div style="font-size:12px;color:${COUT.muted};margin-bottom:6px;">${esc(m.notes)}</div>` : ""}
      <ul style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:6px;font-size:12.5px;color:${COUT.muted};line-height:1.65;">
        ${(m.items ?? [])
          .map((it: any) => {
            const base = `${esc(fmtQty(it.quantity, it.unit))} de ${esc(it.food?.name ?? "")}${it.quantityGrams ? ` (${Math.round(it.quantityGrams)} g)` : ""}`;
            return `<li>${base}${substitutesHtml(it.substitutes)}${it.notes ? ` — <em>${esc(it.notes)}</em>` : ""}</li>`;
          })
          .join("")}
      </ul>
    </div>`
    )
    .join("");

  return `<html><head><meta charset="utf-8"><title>${esc(plan.title ?? "Plano alimentar")}</title>
  <style>body{font-family:Inter,Arial,sans-serif;color:${COUT.ink};padding:40px;max-width:800px;margin:0 auto;} h1{font-size:22px;}</style>
  </head><body>
  ${professionalHeaderHtml(pro)}
  ${clientInfoHtml(client)}
  <h2 style="font-size:15px;letter-spacing:0.06em;margin:22px 0 14px;">REFEIÇÕES</h2>
  ${meals}
  <h2 style="font-size:15px;letter-spacing:0.06em;margin:26px 0 10px;">RECOMENDAÇÕES</h2>
  <div style="font-size:12.5px;color:${COUT.muted};line-height:1.7;">Siga as quantidades indicadas. Em caso de dúvidas sobre substituições, fale com a equipe antes de trocar.</div>
  <h2 style="font-size:15px;letter-spacing:0.06em;margin:26px 0 10px;">OUTRAS INFORMAÇÕES</h2>
  <div style="display:flex;gap:48px;font-size:12.5px;color:#4b5563;">
    <div><strong style="color:${COUT.ink};">DATA DE CRIAÇÃO</strong> ${esc(created)}</div>
    <div><strong style="color:${COUT.ink};">HORA</strong> ${esc(time)}</div>
  </div>
  <div style="margin-top:64px;display:flex;justify-content:flex-end;">
    <div style="text-align:center;font-size:12px;color:${COUT.muted};">
      <div style="border-top:1px solid #6b7280;width:280px;margin-bottom:6px;"></div>
      [${esc(pro.name)}]
    </div>
  </div>
  <p style="margin-top:32px;font-size:11px;color:${COUT.light};">Documento gerado por COUT — acompanhamento profissional contínuo.</p>
  </body></html>`;
}

export function workoutPdfHtml(workout: any, pro: ProfessionalProfile, client: any): string {
  const created = workout.createdAt ? new Date(workout.createdAt).toLocaleDateString("pt-BR") : "";
  const rows = (workout.exercises ?? [])
    .map(
      (ex: any, i: number) => `<tr>
      <td style="padding:10px 8px;border-bottom:1px solid ${COUT.border};font-size:13px;"><strong>${i + 1}. ${esc(ex.exercise?.name ?? "")}</strong>${ex.exercise?.muscleGroup?.name ? `<div style="font-size:11px;color:${COUT.muted};">${esc(ex.exercise.muscleGroup.name)}</div>` : ""}${ex.notes ? `<div style="font-size:11px;color:${COUT.muted};"><em>${esc(ex.notes)}</em></div>` : ""}</td>
      <td style="padding:10px 8px;border-bottom:1px solid ${COUT.border};font-size:13px;">${esc(ex.sets)}</td>
      <td style="padding:10px 8px;border-bottom:1px solid ${COUT.border};font-size:13px;">${esc(ex.reps)}</td>
      <td style="padding:10px 8px;border-bottom:1px solid ${COUT.border};font-size:13px;">${esc(ex.load ?? "—")}</td>
      <td style="padding:10px 8px;border-bottom:1px solid ${COUT.border};font-size:13px;">${ex.restSeconds ? `${esc(ex.restSeconds)}s` : "—"}</td>
    </tr>`
    )
    .join("");

  return `<html><head><meta charset="utf-8"><title>${esc(workout.title ?? `Treino ${workout.letter ?? ""}`)}</title>
  <style>body{font-family:Inter,Arial,sans-serif;color:${COUT.ink};padding:40px;max-width:800px;margin:0 auto;} table{width:100%;border-collapse:collapse;margin-top:8px;} th{text-align:left;border-bottom:2px solid ${COUT.ink};padding:8px;font-size:11px;color:${COUT.muted};}</style>
  </head><body>
  ${professionalHeaderHtml(pro)}
  ${clientInfoHtml(client)}
  <h2 style="font-size:15px;letter-spacing:0.06em;margin:22px 0 4px;">TREINO ${esc(workout.letter ?? "")} ${workout.title ? `— ${esc(workout.title)}` : ""}</h2>
  <p style="font-size:12px;color:${COUT.muted};margin:0 0 8px;">Criado em ${esc(created)} • ${(workout.exercises ?? []).length} exercícios</p>
  <table><thead><tr><th>Exercício</th><th>Séries</th><th>Reps</th><th>Carga</th><th>Intervalo</th></tr></thead><tbody>${rows}</tbody></table>
  <h2 style="font-size:15px;letter-spacing:0.06em;margin:26px 0 10px;">ORIENTAÇÕES</h2>
  <div style="font-size:12.5px;color:${COUT.muted};line-height:1.7;">Respeite os intervalos e a progressão de carga orientada. Interrompa em caso de dor aguda e avise o profissional.</div>
  <div style="margin-top:64px;display:flex;justify-content:flex-end;">
    <div style="text-align:center;font-size:12px;color:${COUT.muted};">
      <div style="border-top:1px solid #6b7280;width:280px;margin-bottom:6px;"></div>
      [${esc(pro.name)}]
    </div>
  </div>
  <p style="margin-top:32px;font-size:11px;color:${COUT.light};">COUT — Plano de treino. Acompanhamento profissional contínuo.</p>
  </body></html>`;
}

export function openPdfWindow(title: string, html: string) {
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.document.title = title;
  w.focus();
  window.setTimeout(() => w.print(), 300);
}
