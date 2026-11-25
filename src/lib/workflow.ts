// Hujjat aylanishi mantig'i: muddatlar, kiruvchi qutilar, ijro statistikasi, kalendar va bildirishnomalar.
// Hammasi arizalar va audit jurnalidan hisoblanadi — alohida saqlanmaydi.
import type { Application, AuditEntry, ReviewKey, Role, Stage } from '../data/types';
import { REVIEW_BODY } from './labels';

const profitOf = (r: { revenue: number; expenses: number }) => r.revenue - r.expenses;

export const DAY = 86_400_000;
/** Biznesga va'da: ariza 14 kalendar kunda yakuniy javob oladi */
export const PROMISE_DAYS = 14;
/** Har bosqichning ko'rib chiqish muddati (kalendar kun) */
export const STAGE_SLA: Partial<Record<Stage, number>> = { yangi: 2, korik: 7, yuridik: 4, imzolash: 3 };
export const REVIEW_SLA: Record<ReviewKey, number> = { komplayens: 7, investitsiya: 7, yuridik: 4 };
export const REVIEW_KEYS: ReviewKey[] = ['komplayens', 'investitsiya', 'yuridik'];
const IN_PROCESS: Stage[] = ['yangi', 'korik', 'yuridik', 'imzolash'];

const ms = (iso?: string) => (iso ? new Date(iso).getTime() : NaN);
const plusDays = (iso: string, d: number) => new Date(ms(iso) + d * DAY).toISOString();
const later = (a?: string, b?: string) => (!a || !b ? undefined : ms(a) > ms(b) ? a : b);

/** Ariza qo'mitalarga yuborilgan vaqt */
export const sentAt = (a: Application) => a.sentAt ?? a.submittedAt;

/** Qo'mita ko'rigi qachon boshlangan (yuridik — ikkala qo'mita tasdiqlagandan keyin) */
export function reviewStart(a: Application, k: ReviewKey): string | undefined {
  if (a.stage === 'yangi') return undefined;
  if (k !== 'yuridik') return sentAt(a);
  const { komplayens: c, investitsiya: i } = a.reviews;
  if (c.status !== 'tasdiqlandi' || i.status !== 'tasdiqlandi') return undefined;
  return later(c.at, i.at);
}

export function reviewDeadline(a: Application, k: ReviewKey) {
  const s = reviewStart(a, k);
  return s ? plusDays(s, REVIEW_SLA[k]) : undefined;
}

/** Joriy bosqich qachon boshlangan */
export function stageStart(a: Application): string {
  if (a.stageAt) return a.stageAt;
  switch (a.stage) {
    case 'korik':
      return sentAt(a);
    case 'yuridik':
      return reviewStart(a, 'yuridik') ?? sentAt(a);
    case 'imzolash':
      return a.reviews.yuridik.at ?? sentAt(a);
    case 'moliyalashtirildi':
      return a.fundedAt ?? a.submittedAt;
    default:
      return a.submittedAt;
  }
}

export function stageDeadline(a: Application) {
  const d = STAGE_SLA[a.stage];
  return d ? plusDays(stageStart(a), d) : undefined;
}

export type Timing = 'otgan' | 'yaqin' | 'normal';
export function timing(deadline: string | undefined, now = Date.now()): Timing {
  if (!deadline) return 'normal';
  const left = ms(deadline) - now;
  if (left < 0) return 'otgan';
  return left <= 2 * DAY ? 'yaqin' : 'normal';
}

/** "3 kun 04:12 qoldi" yoki "2 kun kechikdi" */
export function remaining(deadline: string, now = Date.now()) {
  const diff = ms(deadline) - now;
  const abs = Math.abs(diff);
  const d = Math.floor(abs / DAY);
  const h = Math.floor((abs % DAY) / 3_600_000);
  const m = Math.floor((abs % 3_600_000) / 60_000);
  const hm = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  if (diff < 0) return d ? `${d} kun kechikdi` : `${hm} kechikdi`;
  return d ? `${d} kun ${hm} qoldi` : `${hm} qoldi`;
}

export const daysBetween = (a: string, b: string) => (ms(b) - ms(a)) / DAY;

/** Rol qaysi qo'mita nomidan qaror qiladi */
export function keysOf(role: Role): ReviewKey[] {
  if (role === 'admin') return REVIEW_KEYS;
  return REVIEW_KEYS.filter((k) => k === role);
}

// ───────────────────────── Kiruvchi qutilar ─────────────────────────

export type BoxId = 'korib' | 'qayta' | 'imzo' | 'nazorat' | 'bajarilgan';
export const BOXES: { id: BoxId; label: string; hint: string }[] = [
  { id: 'korib', label: "Ko'rib chiqishda", hint: 'Sizning qaroringizni kutmoqda' },
  { id: 'qayta', label: 'Qayta ishlashda', hint: "Hujjat yetishmaydi — qo'shimcha ma'lumot kutilmoqda" },
  { id: 'imzo', label: 'Imzo uchun', hint: 'Barcha xulosalar ijobiy, shartnoma imzolanadi' },
  { id: 'nazorat', label: 'Nazoratda', hint: "Siz o'z qismingizni bajardingiz, boshqalar ko'rmoqda" },
  { id: 'bajarilgan', label: 'Bajarilgan', hint: 'Yakuniy qaror chiqqan arizalar' },
];

export type RowState = 'jarayonda' | 'yaqin' | 'otgan' | 'bajarildi' | 'kech' | 'rad' | 'qayta';
export interface InboxRow {
  app: Application;
  /** Qaysi qo'mita nomidan (qo'mita a'zosi uchun) */
  key?: ReviewKey;
  deadline?: string;
  state: RowState;
}

function doneState(a: Application, k: ReviewKey): RowState {
  const r = a.reviews[k];
  if (r.status === 'rad') return 'rad';
  const start = reviewStart(a, k);
  if (start && r.at && daysBetween(start, r.at) > REVIEW_SLA[k]) return 'kech';
  return 'bajarildi';
}

const liveState = (deadline: string | undefined, now: number): RowState => {
  const t = timing(deadline, now);
  return t === 'otgan' ? 'otgan' : t === 'yaqin' ? 'yaqin' : 'jarayonda';
};

export function inboxFor(role: Role, apps: Application[], now = Date.now()): Record<BoxId, InboxRow[]> {
  const box: Record<BoxId, InboxRow[]> = { korib: [], qayta: [], imzo: [], nazorat: [], bajarilgan: [] };
  const manager = role === 'menejer' || role === 'admin';
  const keys = keysOf(role);

  for (const a of apps) {
    // Qo'mita a'zosi sifatida
    for (const k of keys) {
      const r = a.reviews[k];
      const start = reviewStart(a, k);
      if (!start) continue;
      const deadline = reviewDeadline(a, k);
      const active = k === 'yuridik' ? a.stage === 'yuridik' : a.stage === 'korik';
      if (active && r.status === 'qayta') box.qayta.push({ app: a, key: k, deadline, state: 'qayta' });
      else if (active && r.status === 'kutilmoqda') box.korib.push({ app: a, key: k, deadline, state: liveState(deadline, now) });
      else if (r.status === 'tasdiqlandi' && IN_PROCESS.includes(a.stage) && role !== 'admin')
        box.nazorat.push({ app: a, key: k, deadline: stageDeadline(a), state: liveState(stageDeadline(a), now) });
      else if ((r.status === 'tasdiqlandi' || r.status === 'rad') && role !== 'admin') box.bajarilgan.push({ app: a, key: k, deadline, state: doneState(a, k) });
    }

    if (!manager) continue;
    // Loyiha menejeri sifatida — butun jarayonni yuritadi
    const deadline = stageDeadline(a);
    if (a.stage === 'yangi') box.korib.push({ app: a, deadline, state: liveState(deadline, now) });
    else if (a.stage === 'imzolash') box.imzo.push({ app: a, deadline, state: liveState(deadline, now) });
    else if (IN_PROCESS.includes(a.stage)) {
      if (role === 'menejer' && REVIEW_KEYS.some((k) => a.reviews[k].status === 'qayta')) box.qayta.push({ app: a, deadline, state: 'qayta' });
      else if (!box.korib.some((x) => x.app.id === a.id) && !box.qayta.some((x) => x.app.id === a.id))
        box.nazorat.push({ app: a, deadline, state: liveState(deadline, now) });
    } else {
      const late = a.stage !== 'rad' && a.fundedAt && daysBetween(a.submittedAt, a.fundedAt) > PROMISE_DAYS + (STAGE_SLA.imzolash ?? 0);
      box.bajarilgan.push({ app: a, state: a.stage === 'rad' ? 'rad' : late ? 'kech' : 'bajarildi' });
    }
  }
  const byDeadline = (x: InboxRow, y: InboxRow) => (ms(x.deadline) || Infinity) - (ms(y.deadline) || Infinity);
  box.korib.sort(byDeadline);
  box.qayta.sort(byDeadline);
  box.imzo.sort(byDeadline);
  box.nazorat.sort(byDeadline);
  box.bajarilgan.sort((x, y) => ms(y.app.submittedAt) - ms(x.app.submittedAt));
  return box;
}

// ───────────────────────── Ijro statistikasi ─────────────────────────

export type BodyId = ReviewKey | 'menejer';
export const BODY_LABEL: Record<BodyId, string> = {
  menejer: 'Loyiha menejeri (qabul)',
  komplayens: REVIEW_BODY.komplayens.title,
  investitsiya: REVIEW_BODY.investitsiya.title,
  yuridik: REVIEW_BODY.yuridik.title,
};
export const BODY_SLA: Record<BodyId, number> = { menejer: STAGE_SLA.yangi ?? 2, ...REVIEW_SLA };

export interface BodyStats {
  id: BodyId;
  total: number;
  onTime: number;
  late: number;
  inWork: number;
  overdue: number;
  returned: number;
  rejected: number;
  avgDays: number | null;
  score: number | null;
}

/**
 * Ball: o'z vaqtida qaror — 1, kechikib — 0,5, muddati o'tib hali qarorsiz — 0.
 * Muddati hali tugamagan ishlar ballga kirmaydi.
 */
export function scoreOf(onTime: number, late: number, overdue: number) {
  const n = onTime + late + overdue;
  return n ? Math.round(((onTime + late * 0.5) / n) * 100) : null;
}

export function ratingOf(score: number | null): { label: string; tone: 'green' | 'blue' | 'amber' | 'red' | 'slate' } {
  if (score == null) return { label: '—', tone: 'slate' };
  if (score >= 90) return { label: "A'lo", tone: 'green' };
  if (score >= 75) return { label: 'Yaxshi', tone: 'blue' };
  if (score >= 50) return { label: 'Qoniqarli', tone: 'amber' };
  return { label: 'Past', tone: 'red' };
}

export function bodyStats(apps: Application[], from?: number, to?: number, now = Date.now()): BodyStats[] {
  const inRange = (iso?: string) => {
    const t = ms(iso);
    return !Number.isNaN(t) && (from == null || t >= from) && (to == null || t < to);
  };
  return (['menejer', ...REVIEW_KEYS] as BodyId[]).map((id) => {
    const s: BodyStats = { id, total: 0, onTime: 0, late: 0, inWork: 0, overdue: 0, returned: 0, rejected: 0, avgDays: null, score: null };
    const days: number[] = [];
    for (const a of apps) {
      let start: string | undefined;
      let end: string | undefined;
      let rejected = false;
      let returned = false;
      if (id === 'menejer') {
        start = a.submittedAt;
        end = a.stage === 'yangi' ? undefined : sentAt(a);
      } else {
        start = reviewStart(a, id);
        const r = a.reviews[id];
        if (r.status === 'tasdiqlandi' || r.status === 'rad') end = r.at;
        rejected = r.status === 'rad';
        returned = r.status === 'qayta';
        // Jarayon boshqa bosqichda rad etilgan bo'lsa, bu qo'mita ishi to'xtagan
        if (!end && a.stage === 'rad') continue;
      }
      if (!start || !inRange(start)) continue;
      s.total++;
      if (rejected) s.rejected++;
      if (returned) s.returned++;
      if (end) {
        const d = daysBetween(start, end);
        days.push(d);
        if (d > BODY_SLA[id]) s.late++;
        else s.onTime++;
      } else if (now > ms(start) + BODY_SLA[id] * DAY) s.overdue++;
      else s.inWork++;
    }
    s.avgDays = days.length ? days.reduce((x, y) => x + y, 0) / days.length : null;
    s.score = scoreOf(s.onTime, s.late, s.overdue);
    return s;
  });
}

/** Yakuniy javob (moliyalashtirishga tayyor yoki rad) qachon berilgan */
export function finalAnswerAt(a: Application): string | undefined {
  if (a.stage === 'rad') {
    return REVIEW_KEYS.map((k) => a.reviews[k]).find((r) => r.status === 'rad')?.at;
  }
  return a.reviews.yuridik.status === 'tasdiqlandi' ? a.reviews.yuridik.at : undefined;
}

export function monthRange(offset: number, now = new Date()) {
  const from = new Date(now.getFullYear(), now.getMonth() + offset, 1).getTime();
  const to = new Date(now.getFullYear(), now.getMonth() + offset + 1, 1).getTime();
  return { from, to };
}

export function monthSummary(apps: Application[], offset: number, now = new Date()) {
  const { from, to } = monthRange(offset, now);
  const inM = (iso?: string) => {
    const t = ms(iso);
    return t >= from && t < to;
  };
  const decisions = apps.reduce(
    (n, a) => n + REVIEW_KEYS.filter((k) => ['tasdiqlandi', 'rad'].includes(a.reviews[k].status) && inM(a.reviews[k].at)).length,
    0,
  );
  const funded = apps.filter((a) => inM(a.fundedAt));
  const answered = apps.filter((a) => inM(finalAnswerAt(a)));
  const inPromise = answered.filter((a) => daysBetween(a.submittedAt, finalAnswerAt(a)!) <= PROMISE_DAYS);
  return {
    received: apps.filter((a) => inM(a.submittedAt)).length,
    decisions,
    funded: funded.length,
    fundedSum: funded.reduce((s, a) => s + a.amount, 0),
    answered: answered.length,
    inPromise: inPromise.length,
  };
}

export function change(cur: number, prev: number): { text: string; dir: 'up' | 'down' | 'flat' } {
  if (cur === prev) return { text: "o'zgarmadi", dir: 'flat' };
  if (!prev) return { text: "o'tgan oyda yo'q edi", dir: 'up' };
  const p = Math.round(((cur - prev) / prev) * 100);
  return { text: `o'tgan oyga nisbatan ${p > 0 ? '+' : ''}${p}%`, dir: p > 0 ? 'up' : 'down' };
}

// ───────────────────────── Kalendar ─────────────────────────

export type EventKind = 'muddat' | 'yigilish' | 'hisobot' | 'shartnoma';
export const EVENT_KINDS: { id: EventKind; label: string; tone: string }[] = [
  { id: 'muddat', label: "Ko'rib chiqish muddatlari", tone: 'bg-amber-500' },
  { id: 'yigilish', label: "Qo'mita yig'ilishlari", tone: 'bg-sky-500' },
  { id: 'hisobot', label: 'Oylik hisobot topshirish', tone: 'bg-emerald-600' },
  { id: 'shartnoma', label: 'Shartnoma muddati tugashi', tone: 'bg-violet-700' },
];

export interface CalEvent {
  id: string;
  kind: EventKind;
  date: string; // ISO
  title: string;
  detail: string;
  who: string;
  appId?: string;
  overdue?: boolean;
}

/** Qo'mita yig'ilishlari jadvali: hafta kuni (0 — yakshanba) va soat */
const MEETINGS: { key: ReviewKey; weekday: number; hour: number }[] = [
  { key: 'investitsiya', weekday: 2, hour: 15 },
  { key: 'komplayens', weekday: 4, hour: 11 },
];

export function calendarEvents(role: Role, user: string, apps: Application[], year: number, month: number, now = Date.now()): CalEvent[] {
  const from = new Date(year, month, 1);
  const to = new Date(year, month + 1, 1);
  const inMonth = (iso?: string) => !!iso && ms(iso) >= from.getTime() && ms(iso) < to.getTime();
  const staff = !['investor', 'biznes'].includes(role);
  const mine = (a: Application) => staff || (role === 'investor' ? a.investor === user : a.company === user);
  const out: CalEvent[] = [];

  for (const a of apps.filter(mine)) {
    if (staff) {
      for (const k of REVIEW_KEYS) {
        const dl = reviewDeadline(a, k);
        const r = a.reviews[k];
        const active = k === 'yuridik' ? a.stage === 'yuridik' : a.stage === 'korik';
        if (!active || r.status === 'tasdiqlandi' || !inMonth(dl)) continue;
        if (role !== 'admin' && role !== 'menejer' && role !== k) continue;
        out.push({
          id: `rv:${a.id}:${k}`, kind: 'muddat', date: dl!, appId: a.id, overdue: ms(dl) < now,
          title: `${REVIEW_BODY[k].title}: ${a.company}`, detail: `${a.id} · xulosa berish muddati`, who: REVIEW_BODY[k].title,
        });
      }
      const sd = stageDeadline(a);
      if ((a.stage === 'yangi' || a.stage === 'imzolash') && inMonth(sd) && (role === 'admin' || role === 'menejer')) {
        out.push({
          id: `st:${a.id}`, kind: 'muddat', date: sd!, appId: a.id, overdue: ms(sd) < now,
          title: `${a.stage === 'yangi' ? "Qo'mitalarga yuborish" : 'Shartnoma imzolash'}: ${a.company}`, detail: `${a.id} · bosqich muddati`, who: a.manager,
        });
      }
    }
    if (a.stage === 'moliyalashtirildi') {
      const rep = new Date(year, month, 10, 18).toISOString();
      if (a.fundedAt && ms(a.fundedAt) < ms(rep)) {
        out.push({
          id: `rp:${a.id}:${year}-${month}`, kind: 'hisobot', date: rep, appId: a.id,
          title: `Oylik hisobot: ${a.company}`, detail: `${a.agreementNo} · o'tgan oy natijasi`, who: a.company,
        });
      }
    }
    if (a.fundedAt && (a.stage === 'moliyalashtirildi' || a.stage === 'yakunlandi')) {
      const f = new Date(a.fundedAt);
      const end = new Date(f.getFullYear(), f.getMonth() + a.termMonths, f.getDate(), 18).toISOString();
      if (inMonth(end)) {
        out.push({
          id: `sh:${a.id}`, kind: 'shartnoma', date: end, appId: a.id,
          title: `Shartnoma tugaydi: ${a.company}`, detail: `${a.agreementNo} · ${a.termMonths} oy`, who: a.investor ?? '',
        });
      }
    }
  }

  if (staff) {
    for (let d = new Date(from); d < to; d.setDate(d.getDate() + 1)) {
      for (const m of MEETINGS) {
        if (d.getDay() !== m.weekday) continue;
        if (!['admin', 'menejer', 'audit', m.key].includes(role)) continue;
        const at = new Date(d.getFullYear(), d.getMonth(), d.getDate(), m.hour).toISOString();
        out.push({
          id: `mt:${m.key}:${at}`, kind: 'yigilish', date: at,
          title: `${REVIEW_BODY[m.key].title} yig'ilishi`, detail: "Navbatdagi arizalar ko'rib chiqiladi", who: REVIEW_BODY[m.key].title,
        });
      }
    }
  }
  return out.sort((x, y) => ms(x.date) - ms(y.date));
}

// ───────────────────────── Bildirishnomalar ─────────────────────────

export type NoteKind = 'vazifa' | 'muddat' | 'yaqin' | 'ogohlantirish' | 'harakat';
export interface Note {
  id: string;
  kind: NoteKind;
  at: string;
  title: string;
  text: string;
  to: string;
}

export function notificationsFor(role: Role, user: string, apps: Application[], audit: AuditEntry[], now = Date.now()): Note[] {
  const out: Note[] = [];
  const box = inboxFor(role, apps, now);
  const who = (r: InboxRow) => (r.key ? REVIEW_BODY[r.key].title : 'Loyiha menejeri');

  for (const r of [...box.korib, ...box.imzo]) {
    const tag = `${r.app.id}:${r.key ?? r.app.stage}`;
    out.push({
      id: `task:${tag}`, kind: 'vazifa', at: r.key ? (reviewStart(r.app, r.key) ?? stageStart(r.app)) : stageStart(r.app),
      title: 'Sizga yangi vazifa', text: `${who(r)}: ${r.app.company} (${r.app.id}) arizasi bo'yicha qaror kutilmoqda.`, to: `/arizalar/${r.app.id}`,
    });
    if (r.state === 'otgan' && r.deadline) {
      out.push({
        id: `late:${tag}`, kind: 'muddat', at: r.deadline,
        title: "Muddat o'tdi", text: `${r.app.company} (${r.app.id}) — ${remaining(r.deadline, now)}.`, to: `/arizalar/${r.app.id}`,
      });
    } else if (r.state === 'yaqin' && r.deadline) {
      out.push({
        id: `soon:${tag}`, kind: 'yaqin', at: new Date(ms(r.deadline) - 2 * DAY).toISOString(),
        title: 'Muddat yaqinlashmoqda', text: `${r.app.company} (${r.app.id}) — ${remaining(r.deadline, now)}.`, to: `/arizalar/${r.app.id}`,
      });
    }
  }

  const staff = !['investor', 'biznes'].includes(role);
  for (const a of apps) {
    if (a.stage !== 'moliyalashtirildi' || !a.reports.length) continue;
    if (!staff && !(role === 'investor' && a.investor === user)) continue;
    const last = a.reports[a.reports.length - 1];
    if (profitOf(last) >= last.plan * 0.7) continue;
    out.push({
      id: `alert:${a.id}:${last.month}`, kind: 'ogohlantirish', at: `${last.month}-28T18:00:00`,
      title: 'Monitoring ogohlantirishi', text: `${a.company}: oxirgi oy foydasi rejadan 30% dan ko'proq past.`, to: '/monitoring',
    });
  }

  const relevant = (e: AuditEntry) => {
    if (e.user === user || !e.target) return false;
    const a = apps.find((x) => x.id === e.target);
    if (!a) return false;
    if (role === 'biznes') return a.company === user;
    if (role === 'investor') return a.investor === user;
    return true;
  };
  for (const e of audit.filter(relevant).slice(0, 8)) {
    out.push({ id: `audit:${e.id}`, kind: 'harakat', at: e.at, title: e.action, text: `${e.user} · ${e.target}`, to: `/arizalar/${e.target}` });
  }
  return out.sort((x, y) => ms(y.at) - ms(x.at));
}

export function ago(iso: string, now = Date.now()) {
  const diff = now - ms(iso);
  if (diff < 0) return 'tez orada';
  const min = Math.floor(diff / 60_000);
  if (min < 60) return `${Math.max(1, min)} daqiqa oldin`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} soat oldin`;
  const d = Math.floor(h / 24);
  return d < 30 ? `${d} kun oldin` : `${Math.floor(d / 30)} oy oldin`;
}
