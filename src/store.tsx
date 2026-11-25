import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { analyze } from './ai/analyze';
import { ROLES, seedApplications, seedAudit } from './data/mock';
import type { Application, ApplicationInput, AuditEntry, ReviewKey, ReviewStatus, Role } from './data/types';
import { REVIEW_BODY, REVIEW_LABEL } from './lib/labels';

// Test rejimi: holat brauzerda saqlanadi. Backend ulanganda shu qatlam API'ga almashtiriladi.
const KEY = 'yuim-test-v3';

interface State {
  role: Role | null;
  apps: Application[];
  audit: AuditEntry[];
  /** O'qilgan bildirishnomalar */
  read: string[];
}

function fresh(): State {
  return { role: null, apps: seedApplications(), audit: seedAudit(), read: [] };
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as Partial<State>;
      return { ...fresh(), ...s, read: s.read ?? [] };
    }
  } catch {
    /* saqlash imkoni yo'q — test ma'lumoti bilan davom etamiz */
  }
  return fresh();
}

interface Ctx extends State {
  user: string;
  login: (r: Role) => void;
  logout: () => void;
  submitToCommittees: (id: string) => void;
  review: (id: string, key: ReviewKey, status: Exclude<ReviewStatus, 'kutilmoqda'>, comment: string) => void;
  fund: (id: string, investor: string) => void;
  complete: (id: string) => void;
  addApplication: (input: ApplicationInput) => string;
  reset: () => void;
  markRead: (ids: string[]) => void;
}

const StoreCtx = createContext<Ctx | null>(null);

const now = () => new Date().toISOString();

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* e'tiborsiz */
    }
  }, [state]);

  const user = ROLES.find((r) => r.id === state.role)?.user ?? '';

  const entry = (action: string, target?: string): AuditEntry => ({
    id: Math.random().toString(36).slice(2),
    at: new Date().toISOString(),
    user,
    role: state.role ?? 'admin',
    action,
    target,
  });

  const updateApp = (id: string, fn: (a: Application) => Application, action: string) =>
    setState((s) => ({
      ...s,
      apps: s.apps.map((a) => (a.id === id ? fn(a) : a)),
      audit: [entry(action, id), ...s.audit],
    }));

  const value: Ctx = {
    ...state,
    user,
    login: (role) => setState((s) => ({ ...s, role })),
    logout: () => setState((s) => ({ ...s, role: null })),

    submitToCommittees: (id) =>
      updateApp(id, (a) => ({ ...a, stage: 'korik', sentAt: now(), stageAt: now() }), "Ariza qo'mitalarga yuborildi"),

    review: (id, key, status, comment) =>
      updateApp(
        id,
        (a) => {
          const reviews = { ...a.reviews, [key]: { status, by: user, at: new Date().toISOString(), comment } };
          let stage = a.stage;
          if (status === 'rad') stage = 'rad';
          else if (key !== 'yuridik' && reviews.komplayens.status === 'tasdiqlandi' && reviews.investitsiya.status === 'tasdiqlandi') stage = 'yuridik';
          else if (key === 'yuridik' && status === 'tasdiqlandi') stage = 'imzolash';
          return { ...a, reviews, stage, stageAt: stage === a.stage ? a.stageAt : now() };
        },
        `${REVIEW_BODY[key].title}: ${REVIEW_LABEL[status].toLowerCase()}`,
      ),

    fund: (id, investor) =>
      setState((s) => {
        const year = new Date().getFullYear();
        const used = s.apps
          .filter((a) => a.agreementNo?.startsWith(`OSh-${year}/`))
          .map((a) => Number(a.agreementNo!.split('/')[1]));
        const n = Math.max(0, ...used) + 1;
        const agreementNo = `OSh-${year}/${String(n).padStart(3, '0')}`;
        return {
          ...s,
          apps: s.apps.map((a) =>
            a.id === id ? { ...a, stage: 'moliyalashtirildi', investor, agreementNo, fundedAt: now(), stageAt: now() } : a,
          ),
          audit: [entry(`Shartnoma ${agreementNo} imzolandi, moliyalashtirildi (${investor})`, id), ...s.audit],
        };
      }),

    complete: (id) => updateApp(id, (a) => ({ ...a, stage: 'yakunlandi', stageAt: now() }), 'Shartnoma yakunlandi, yakuniy hisob-kitob qilindi'),

    addApplication: (input) => {
      const id = `YU-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`;
      const app: Application = {
        ...input,
        id,
        submittedAt: new Date().toISOString(),
        stage: 'yangi',
        manager: 'D. Rasulov',
        reviews: { komplayens: { status: 'kutilmoqda' }, investitsiya: { status: 'kutilmoqda' }, yuridik: { status: 'kutilmoqda' } },
        ai: analyze(input),
        reports: [],
      };
      setState((s) => ({ ...s, apps: [app, ...s.apps], audit: [entry('Yangi ariza topshirildi', id), ...s.audit] }));
      return id;
    },

    reset: () => setState({ ...fresh(), role: state.role }),

    markRead: (ids) => setState((s) => ({ ...s, read: [...new Set([...s.read, ...ids])] })),
  };

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error('StoreProvider yo\'q');
  return c;
}

/** Joriy rol uchun harakat talab qiladigan arizalar */
export function tasksFor(role: Role | null, apps: Application[]) {
  if (!role) return [];
  return apps.filter((a) => {
    const can = (k: ReviewKey) => role === k || role === 'admin';
    if (a.stage === 'korik') {
      return (can('komplayens') && a.reviews.komplayens.status !== 'tasdiqlandi') ||
        (can('investitsiya') && a.reviews.investitsiya.status !== 'tasdiqlandi');
    }
    if (a.stage === 'yuridik') return can('yuridik');
    if (a.stage === 'yangi' || a.stage === 'imzolash') return role === 'menejer' || role === 'admin';
    return false;
  });
}

export function profitOf(r: { revenue: number; expenses: number }) {
  return r.revenue - r.expenses;
}
