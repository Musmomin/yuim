// Backend'siz namoyish rejimi (claude.ai Artifact). Server bilan bir xil qoidalar
// (shared/workflow, shared/validation) brauzerda bajariladi, holat localStorage'da.
// Haqiqiy himoya emas — faqat namoyish uchun.
import { INVESTORS, SEED_USERS, seedApplications, seedAudit, seedUserFor } from '../../shared/seed';
import type { Application, AuditEntry, User } from '../../shared/types';
import { applicationInputSchema, fieldErrors, reportSchema } from '../../shared/validation';
import * as wf from '../../shared/workflow';
import { roleLabel } from '../../shared/roles';
import type { Api } from './index';
import { ApiError } from './index';

const KEY = 'yuim-demo-v3';

interface State {
  userId: string | null;
  apps: Application[];
  audit: AuditEntry[];
  counters: Record<string, number>;
}

function fresh(userId: string | null = null): State {
  const apps = seedApplications();
  const counters: Record<string, number> = {};
  for (const a of apps) {
    const [, y, n] = a.id.split('-');
    counters[`application:${y}`] = Math.max(counters[`application:${y}`] ?? 0, Number(n));
    if (a.agreementNo) {
      const [ay, an] = a.agreementNo.replace('OSh-', '').split('/');
      counters[`agreement:${ay}`] = Math.max(counters[`agreement:${ay}`] ?? 0, Number(an));
    }
  }
  return { userId, apps, audit: seedAudit(), counters };
}

/** Saqlangan holat buzilgan yoki eski formatda bo'lsa — test ma'lumotidan boshlaymiz */
function load(): State {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? 'null') as State | null;
    if (s && Array.isArray(s.apps) && Array.isArray(s.audit) && typeof s.counters === 'object' && s.apps.every((a) => a?.id && a.reviews && Array.isArray(a.reports))) {
      return s;
    }
  } catch {
    /* e'tiborsiz */
  }
  return fresh();
}

let state = load();
const save = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* saqlash imkoni yo'q — xotirada davom etamiz */
  }
};

const delay = <T>(v: T) => Promise.resolve(structuredClone(v));

function current(): wf.Actor {
  const u = SEED_USERS.find((x) => x.id === state.userId);
  if (!u) throw new ApiError(401, 'Tizimga kiring');
  return { id: u.id, name: u.name, role: u.role, investorId: u.investorId };
}

function next(key: string) {
  state.counters[key] = (state.counters[key] ?? 0) + 1;
  return state.counters[key];
}

function audit(actor: wf.Actor, action: string, target?: string) {
  state.audit.unshift({ id: Math.random().toString(36).slice(2), at: new Date().toISOString(), user: actor.name, role: actor.role, action, target });
}

function run(error: unknown): never {
  if (error instanceof wf.WorkflowError) throw new ApiError(error.status, error.message);
  throw error;
}

function mutate(id: string, fn: (a: Application, actor: wf.Actor) => wf.Change) {
  const actor = current();
  const i = state.apps.findIndex((a) => a.id === id);
  if (i < 0 || !wf.canView(actor, state.apps[i])) throw new ApiError(404, 'Ariza topilmadi');
  let change: wf.Change;
  try {
    change = fn(state.apps[i], actor);
  } catch (e) {
    run(e);
  }
  state.apps[i] = change.app;
  audit(actor, change.action, id);
  save();
  return delay(wf.redact(actor, change.app));
}

function parseInput(body: unknown) {
  const r = applicationInputSchema.safeParse(body);
  if (!r.success) throw new ApiError(400, "Ma'lumotlar noto'g'ri", fieldErrors(r.error));
  return r.data;
}

const now = () => new Date().toISOString();
const toUser = (u: User) => u;

export const localApi: Api = {
  config: () => delay({ demoLogin: true }),
  me: () => delay(SEED_USERS.find((u) => u.id === state.userId) ?? null),
  login: async (login) => {
    const u = SEED_USERS.find((x) => x.login === login.trim().toLowerCase());
    if (!u) throw new ApiError(401, "Login yoki parol noto'g'ri");
    state.userId = u.id;
    save();
    return toUser(u);
  },
  demoLogin: async (role) => {
    state.userId = seedUserFor(role).id;
    save();
    return toUser(seedUserFor(role));
  },
  logout: async () => {
    state.userId = null;
    save();
  },
  applications: async () => {
    const actor = current();
    return delay(state.apps.filter((a) => wf.canView(actor, a)).map((a) => wf.redact(actor, a)));
  },
  application: async (id) => {
    const actor = current();
    const a = state.apps.find((x) => x.id === id);
    if (!a || !wf.canView(actor, a)) throw new ApiError(404, 'Ariza topilmadi');
    const staff = wf.isStaff(actor.role);
    const history = state.audit.filter((e) => e.target === id).map((e) => (staff || e.role === actor.role ? e : { ...e, user: roleLabel(e.role) }));
    return delay({ application: wf.redact(actor, a), history });
  },
  create: async (body) => {
    const actor = current();
    const input = parseInput(body);
    if (actor.role === 'biznes') input.company = actor.name;
    const year = new Date().getFullYear();
    const manager = actor.role === 'menejer' ? { id: actor.id, name: actor.name } : { id: 'u-menejer', name: seedUserFor('menejer').name };
    let change: wf.Change;
    try {
      change = wf.create(input, actor, wf.formatApplicationId(year, next(`application:${year}`)), manager, now());
    } catch (e) {
      run(e);
    }
    state.apps.unshift(change.app);
    audit(actor, change.action, change.app.id);
    save();
    return delay(wf.redact(actor, change.app));
  },
  update: async (id, body) => {
    const input = parseInput(body);
    return mutate(id, (a, actor) => wf.edit(a, input, actor));
  },
  submit: async (id) => mutate(id, (a, actor) => wf.submit(a, actor)),
  review: async (id, key, status, comment) => mutate(id, (a, actor) => wf.review(a, key, status, comment, actor, now())),
  fund: async (id, investorId) => {
    const investor = INVESTORS.find((i) => i.id === investorId);
    if (!investor) throw new ApiError(400, 'Investor topilmadi');
    return mutate(id, (a, actor) => {
      if (a.stage !== 'imzolash') return wf.fund(a, investor, '', actor, now());
      const year = new Date().getFullYear();
      return wf.fund(a, investor, wf.formatAgreementNo(year, next(`agreement:${year}`)), actor, now());
    });
  },
  complete: async (id) => mutate(id, (a, actor) => wf.complete(a, actor)),
  addReport: async (id, body) => {
    const r = reportSchema.safeParse(body);
    if (!r.success) throw new ApiError(400, "Ma'lumotlar noto'g'ri", fieldErrors(r.error));
    return mutate(id, (a, actor) => wf.addReport(a, r.data, actor));
  },
  investors: async () => {
    if (!wf.isStaff(current().role)) throw new ApiError(403, "Bu bo'limga kirish huquqingiz yo'q");
    return delay(INVESTORS);
  },
  audit: async () => {
    const actor = current();
    if (!wf.isStaff(actor.role)) throw new ApiError(403, "Bu bo'limga kirish huquqingiz yo'q");
    const full = actor.role === 'admin' || actor.role === 'audit';
    return delay(state.audit.slice(0, full ? 500 : 10));
  },
  reset: async () => {
    state = fresh(state.userId);
    save();
  },
};
