// Ariza jarayonining qoidalari (holat mashinasi) va kirish huquqlari.
// Sof funksiyalar: ma'lumotlar bazasiga bog'liq emas. Server ularni haqiqiy qaror
// uchun, frontend esa tugmalarni ko'rsatish/yashirish uchun ishlatadi.
import { analyze } from './analyze';
import type { Application, ApplicationInput, Investor, MonthlyReport, ReviewKey, Role, Stage } from './types';
import { STAFF_ROLES } from './types';

export interface Actor {
  id: string;
  name: string;
  role: Role;
  investorId?: string;
}

export class WorkflowError extends Error {
  constructor(
    public status: 400 | 403 | 404 | 409,
    message: string,
  ) {
    super(message);
  }
}

export interface Change {
  app: Application;
  action: string;
}

export const REVIEW_TITLE: Record<ReviewKey, string> = {
  komplayens: "Komplayens qo'mitasi",
  investitsiya: "Investitsiya qo'mitasi",
  yuridik: 'Yuridik xizmat',
};

const DECISION: Record<'tasdiqlandi' | 'rad' | 'qayta', string> = {
  tasdiqlandi: 'tasdiqlandi',
  rad: 'rad etildi',
  qayta: 'qayta ishlashga qaytarildi',
};

export const isStaff = (role: Role) => STAFF_ROLES.includes(role);
const isManager = (a: Actor) => a.role === 'menejer' || a.role === 'admin';
const isOwner = (a: Actor, app: Application) => a.role === 'biznes' && !!app.ownerId && app.ownerId === a.id;

const pendingReviews = (): Application['reviews'] => ({
  komplayens: { status: 'kutilmoqda' },
  investitsiya: { status: 'kutilmoqda' },
  yuridik: { status: 'kutilmoqda' },
});

// ---------- Kirish huquqlari ----------

export function canView(actor: Actor, app: Application): boolean {
  if (isStaff(actor.role)) return true;
  if (actor.role === 'biznes') return isOwner(actor, app);
  if (actor.role === 'investor') return !!app.agreementNo && !!actor.investorId && app.investorId === actor.investorId;
  return false;
}

/** Xodim bo'lmaganlarga ichki ma'lumotlarni (AI bahosi, qo'mita a'zolari) ko'rsatmaslik */
export function redact(actor: Actor, app: Application): Application {
  if (isStaff(actor.role)) return app;
  const reviews = { ...app.reviews };
  for (const k of Object.keys(reviews) as ReviewKey[]) {
    const r = reviews[k];
    // Biznes nima uchun qaytarilgani yoki rad etilganini ko'rishi kerak; kim qarori — yo'q
    const showComment = actor.role === 'biznes' && (r.status === 'qayta' || r.status === 'rad');
    reviews[k] = { status: r.status, at: r.at, comment: showComment ? r.comment : undefined };
  }
  return { ...app, ai: undefined, reviews };
}

export function canEdit(actor: Actor, app: Application) {
  return (app.stage === 'yangi' || app.stage === 'qaytarildi') && (isManager(actor) || isOwner(actor, app));
}

export function canSubmit(actor: Actor, app: Application) {
  if (app.stage === 'yangi') return isManager(actor);
  if (app.stage === 'qaytarildi') return isManager(actor) || isOwner(actor, app);
  return false;
}

export function canReview(actor: Actor, app: Application, key: ReviewKey) {
  const stageOk = key === 'yuridik' ? app.stage === 'yuridik' : app.stage === 'korik';
  return (actor.role === key || actor.role === 'admin') && stageOk && app.reviews[key].status === 'kutilmoqda';
}

export function canAddReport(actor: Actor, app: Application) {
  return app.stage === 'moliyalashtirildi' && (isManager(actor) || isOwner(actor, app));
}

/** Joriy foydalanuvchidan harakat talab qiladigan arizalar */
export function tasksFor(actor: Actor | null, apps: Application[]) {
  if (!actor) return [];
  return apps.filter(
    (a) =>
      canSubmit(actor, a) ||
      (['komplayens', 'investitsiya', 'yuridik'] as ReviewKey[]).some((k) => canReview(actor, a, k)) ||
      (a.stage === 'imzolash' && isManager(actor)),
  );
}

// ---------- O'tishlar ----------

export function create(input: ApplicationInput, actor: Actor, id: string, manager: { id?: string; name: string }, now: string): Change {
  if (!isManager(actor) && actor.role !== 'biznes') throw new WorkflowError(403, "Ariza topshirish huquqingiz yo'q");
  const app: Application = {
    ...input,
    id,
    submittedAt: now,
    stage: 'yangi',
    ownerId: actor.role === 'biznes' ? actor.id : undefined,
    managerId: manager.id,
    manager: manager.name,
    reviews: pendingReviews(),
    ai: analyze(input),
    reports: [],
  };
  return { app, action: 'Yangi ariza topshirildi' };
}

export function edit(app: Application, input: ApplicationInput, actor: Actor): Change {
  if (!canEdit(actor, app)) throw new WorkflowError(409, "Arizani faqat «Yangi» yoki «Qaytarildi» bosqichida o'zgartirish mumkin");
  // Biznes kompaniya nomini almashtirib, boshqa kompaniya nomidan ariza qila olmasin
  const company = actor.role === 'biznes' ? app.company : input.company;
  const next = { ...input, company };
  return { app: { ...app, ...next, ai: analyze(next) }, action: "Ariza ma'lumotlari tahrirlandi" };
}

export function submit(app: Application, actor: Actor): Change {
  if (!canSubmit(actor, app)) throw new WorkflowError(409, "Arizani hozir qo'mitalarga yuborib bo'lmaydi");
  const again = app.stage === 'qaytarildi';
  return {
    // Qayta yuborilganda ma'lumot o'zgargan bo'lishi mumkin — barcha xulosalar qaytadan olinadi
    app: { ...app, stage: 'korik', reviews: pendingReviews() },
    action: again ? "Tuzatilgan ariza qo'mitalarga qayta yuborildi" : "Ariza qo'mitalarga yuborildi",
  };
}

export function review(
  app: Application,
  key: ReviewKey,
  status: 'tasdiqlandi' | 'rad' | 'qayta',
  comment: string,
  actor: Actor,
  now: string,
): Change {
  if (actor.role !== key && actor.role !== 'admin') throw new WorkflowError(403, `Bu qaror ${REVIEW_TITLE[key]} vakolatida`);
  if (!canReview(actor, app, key)) throw new WorkflowError(409, 'Bu bosqichda bunday qaror qabul qilib bo\'lmaydi');
  const c = comment.trim();
  if (status !== 'tasdiqlandi' && !c) throw new WorkflowError(400, 'Rad etish yoki qaytarish uchun izoh majburiy');

  const reviews = { ...app.reviews, [key]: { status, by: actor.name, at: now, comment: c || undefined } };
  let stage: Stage = app.stage;
  if (status === 'rad') stage = 'rad';
  else if (status === 'qayta') stage = 'qaytarildi';
  else if (key === 'yuridik') stage = 'imzolash';
  else if (reviews.komplayens.status === 'tasdiqlandi' && reviews.investitsiya.status === 'tasdiqlandi') stage = 'yuridik';

  return { app: { ...app, reviews, stage }, action: `${REVIEW_TITLE[key]}: ${DECISION[status]}` };
}

export function fund(app: Application, investor: Investor, agreementNo: string, actor: Actor, now: string): Change {
  if (!isManager(actor)) throw new WorkflowError(403, "Moliyalashtirishni faqat menejer tasdiqlaydi");
  if (app.stage !== 'imzolash') throw new WorkflowError(409, 'Ariza imzolash bosqichida emas');
  return {
    app: { ...app, stage: 'moliyalashtirildi', investorId: investor.id, investor: investor.name, agreementNo, fundedAt: now },
    action: `Shartnoma ${agreementNo} imzolandi, moliyalashtirildi (${investor.name})`,
  };
}

export function complete(app: Application, actor: Actor): Change {
  if (!isManager(actor)) throw new WorkflowError(403, 'Shartnomani faqat menejer yakunlaydi');
  if (app.stage !== 'moliyalashtirildi') throw new WorkflowError(409, 'Faqat amaldagi shartnomani yakunlash mumkin');
  return { app: { ...app, stage: 'yakunlandi' }, action: 'Shartnoma yakunlandi, yakuniy hisob-kitob qilindi' };
}

export function addReport(app: Application, report: MonthlyReport, actor: Actor): Change {
  if (!canAddReport(actor, app)) throw new WorkflowError(409, "Oylik hisobotni faqat amaldagi shartnoma bo'yicha topshirish mumkin");
  const reports = [...app.reports.filter((r) => r.month !== report.month), report].sort((a, b) => a.month.localeCompare(b.month));
  return { app: { ...app, reports }, action: `${report.month} oyi hisoboti topshirildi` };
}

// ---------- Hisob-kitoblar ----------

export function profitOf(r: { revenue: number; expenses: number }) {
  return r.revenue - r.expenses;
}

export const formatAgreementNo = (year: number, n: number) => `OSh-${year}/${String(n).padStart(3, '0')}`;
export const formatApplicationId = (year: number, n: number) => `YU-${year}-${String(n).padStart(3, '0')}`;
