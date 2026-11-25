// Ma'lumotlar bazasi bilan ishlash: jadval qatorlari ↔ domen obyektlari (shared/types).
import { and, asc, desc, eq, inArray, isNotNull, sql, type SQL } from 'drizzle-orm';
import type { Actor } from '../../shared/workflow';
import { isStaff } from '../../shared/workflow';
import type { Application, AuditEntry, Investor, MonthlyReport, Review, ReviewKey, Role, Stage, User } from '../../shared/types';
import { REVIEW_KEYS } from '../../shared/types';
import type { Db } from './db/client';
import { applications, auditLog, counters, investors, monthlyReports, reviews, users } from './db/schema';

/** Tranzaksiya ichida ham, tashqarisida ham ishlaydigan ulanish */
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0] | Db;

type AppRow = typeof applications.$inferSelect;
type ReviewRow = typeof reviews.$inferSelect;
type ReportRow = typeof monthlyReports.$inferSelect;

const iso = (s: string | null | undefined) => (s ? new Date(s).toISOString() : undefined);

function toApplication(r: AppRow, revs: ReviewRow[], reps: ReportRow[]): Application {
  const rv = {} as Record<ReviewKey, Review>;
  for (const k of REVIEW_KEYS) {
    const x = revs.find((v) => v.key === k);
    rv[k] = x
      ? { status: x.status as Review['status'], by: x.byName ?? undefined, at: iso(x.at), comment: x.comment ?? undefined }
      : { status: 'kutilmoqda' };
  }
  return {
    id: r.id,
    ownerId: r.ownerId ?? undefined,
    managerId: r.managerId ?? undefined,
    manager: r.managerName,
    investorId: r.investorId ?? undefined,
    investor: r.investorName ?? undefined,
    company: r.company,
    stir: r.stir,
    director: r.director,
    phone: r.phone,
    region: r.region,
    sector: r.sector,
    activity: r.activity,
    amount: r.amount,
    termMonths: r.termMonths,
    investorShare: r.investorShare,
    purpose: r.purpose,
    revenue12m: r.revenue12m,
    profit12m: r.profit12m,
    employees: r.employees,
    stage: r.stage as Stage,
    agreementNo: r.agreementNo ?? undefined,
    fundedAt: iso(r.fundedAt),
    submittedAt: iso(r.submittedAt)!,
    ai: r.ai,
    reports: reps
      .map((p) => ({ month: p.month, revenue: p.revenue, expenses: p.expenses, plan: p.plan }))
      .sort((a, b) => a.month.localeCompare(b.month)),
    reviews: rv,
  };
}

function appColumns(a: Application) {
  return {
    ownerId: a.ownerId ?? null,
    managerId: a.managerId ?? null,
    managerName: a.manager,
    investorId: a.investorId ?? null,
    investorName: a.investor ?? null,
    company: a.company,
    stir: a.stir,
    director: a.director,
    phone: a.phone,
    region: a.region,
    sector: a.sector,
    activity: a.activity,
    amount: a.amount,
    termMonths: a.termMonths,
    investorShare: a.investorShare,
    purpose: a.purpose,
    revenue12m: a.revenue12m,
    profit12m: a.profit12m,
    employees: a.employees,
    stage: a.stage,
    agreementNo: a.agreementNo ?? null,
    fundedAt: a.fundedAt ?? null,
    submittedAt: a.submittedAt,
    ai: a.ai!,
  };
}

async function hydrate(db: Tx, rows: AppRow[]): Promise<Application[]> {
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const [revs, reps] = await Promise.all([
    db.select().from(reviews).where(inArray(reviews.applicationId, ids)),
    db.select().from(monthlyReports).where(inArray(monthlyReports.applicationId, ids)),
  ]);
  return rows.map((r) =>
    toApplication(
      r,
      revs.filter((v) => v.applicationId === r.id),
      reps.filter((p) => p.applicationId === r.id),
    ),
  );
}

/** Foydalanuvchi ko'rishi mumkin bo'lgan arizalar (huquq bazaning o'zida filtrlanadi) */
export async function listApplications(db: Tx, actor: Actor): Promise<Application[]> {
  let where: SQL | undefined;
  if (actor.role === 'biznes') where = eq(applications.ownerId, actor.id);
  else if (actor.role === 'investor')
    where = actor.investorId ? and(eq(applications.investorId, actor.investorId), isNotNull(applications.agreementNo)) : sql`false`;
  else if (!isStaff(actor.role)) where = sql`false`;
  const rows = await db.select().from(applications).where(where).orderBy(desc(applications.submittedAt));
  return hydrate(db, rows);
}

/** `forUpdate` — tranzaksiya ichida qatorni qulflaydi: ikki kishi bir vaqtda qaror qilsa, navbat bilan bajariladi */
export async function getApplication(db: Tx, id: string, forUpdate = false): Promise<Application | null> {
  const q = db.select().from(applications).where(eq(applications.id, id));
  const rows = forUpdate ? await q.for('update') : await q;
  if (!rows[0]) return null;
  return (await hydrate(db, rows))[0];
}

export async function insertApplication(db: Tx, a: Application) {
  await db.insert(applications).values({ id: a.id, ...appColumns(a) });
  await writeReviews(db, a);
  await writeReports(db, a);
}

/** Oldingi holat bilan solishtirib faqat o'zgargan qismlarni yozadi */
export async function saveApplication(db: Tx, before: Application, after: Application, actor: Actor) {
  await db
    .update(applications)
    .set({ ...appColumns(after), updatedAt: new Date().toISOString() })
    .where(eq(applications.id, after.id));
  if (JSON.stringify(before.reviews) !== JSON.stringify(after.reviews)) await writeReviews(db, after, before, actor);
  if (JSON.stringify(before.reports) !== JSON.stringify(after.reports)) await writeReports(db, after);
}

/** Faqat o'zgargan xulosalarni yozadi; qaror qilgan foydalanuvchi ID'si ham saqlanadi (ism takrorlanishi mumkin) */
async function writeReviews(db: Tx, a: Application, before?: Application, actor?: Actor) {
  for (const k of REVIEW_KEYS) {
    const r = a.reviews[k];
    if (before && JSON.stringify(before.reviews[k]) === JSON.stringify(r)) continue;
    const row = {
      status: r.status,
      byName: r.by ?? null,
      byUserId: before && actor && r.status !== 'kutilmoqda' ? actor.id : null,
      at: r.at ?? null,
      comment: r.comment ?? null,
    };
    await db
      .insert(reviews)
      .values({ applicationId: a.id, key: k, ...row })
      .onConflictDoUpdate({ target: [reviews.applicationId, reviews.key], set: row });
  }
}

async function writeReports(db: Tx, a: Application) {
  await db.delete(monthlyReports).where(eq(monthlyReports.applicationId, a.id));
  if (a.reports.length) {
    await db.insert(monthlyReports).values(a.reports.map((r: MonthlyReport) => ({ applicationId: a.id, ...r })));
  }
}

/** Atomar ketma-ket raqam: bir vaqtdagi so'rovlar ham bir xil raqam olmaydi */
export async function nextNumber(db: Tx, key: string): Promise<number> {
  const rows = await db
    .insert(counters)
    .values({ key, value: 1 })
    .onConflictDoUpdate({ target: counters.key, set: { value: sql`${counters.value} + 1` } })
    .returning({ value: counters.value });
  return rows[0].value;
}

export async function setCounterAtLeast(db: Tx, key: string, value: number) {
  await db
    .insert(counters)
    .values({ key, value })
    .onConflictDoUpdate({ target: counters.key, set: { value: sql`GREATEST(${counters.value}, ${value})` } });
}

export async function writeAudit(db: Tx, actor: Actor, action: string, target?: string, at?: string) {
  await db.insert(auditLog).values({
    userId: actor.id,
    userName: actor.name,
    role: actor.role,
    action,
    target: target ?? null,
    ...(at ? { at } : {}),
  });
}

export async function listAudit(db: Tx, opts: { target?: string; limit?: number } = {}): Promise<AuditEntry[]> {
  const rows = await db
    .select()
    .from(auditLog)
    .where(opts.target ? eq(auditLog.target, opts.target) : undefined)
    .orderBy(desc(auditLog.at), desc(auditLog.id))
    .limit(opts.limit ?? 500);
  return rows.map((r) => ({
    id: String(r.id),
    at: new Date(r.at).toISOString(),
    user: r.userName,
    role: r.role as Role,
    action: r.action,
    target: r.target ?? undefined,
  }));
}

export async function listInvestors(db: Tx): Promise<Investor[]> {
  return db.select().from(investors).orderBy(asc(investors.name));
}

export async function getInvestor(db: Tx, id: string): Promise<Investor | null> {
  return (await db.select().from(investors).where(eq(investors.id, id)))[0] ?? null;
}

type UserRow = typeof users.$inferSelect;
export const toUser = (u: UserRow): User => ({
  id: u.id,
  login: u.login,
  name: u.name,
  role: u.role as Role,
  investorId: u.investorId ?? undefined,
});

export async function findUserByLogin(db: Tx, login: string) {
  return (await db.select().from(users).where(eq(users.login, login.toLowerCase())))[0] ?? null;
}

export async function findUserById(db: Tx, id: string) {
  return (await db.select().from(users).where(eq(users.id, id)))[0] ?? null;
}

export async function findUserByRole(db: Tx, role: Role) {
  return (await db.select().from(users).where(eq(users.role, role)).orderBy(asc(users.id)).limit(1))[0] ?? null;
}

/** Yangi arizaga mas'ul menejer: hozir eng kam faol arizasi bor menejer */
export async function pickManager(db: Tx): Promise<{ id?: string; name: string }> {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      load: sql<number>`count(${applications.id}) filter (where ${applications.stage} not in ('yakunlandi','rad'))`.mapWith(Number),
    })
    .from(users)
    .leftJoin(applications, eq(applications.managerId, users.id))
    .where(eq(users.role, 'menejer'))
    .groupBy(users.id, users.name)
    .orderBy(sql`3 asc`, asc(users.id))
    .limit(1);
  return rows[0] ? { id: rows[0].id, name: rows[0].name } : { name: 'Tayinlanmagan' };
}
