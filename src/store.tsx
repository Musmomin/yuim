import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Application, AuditEntry, Investor, Role, User } from '../shared/types';
import type { Actor } from '../shared/workflow';
import { isStaff } from '../shared/workflow';
import { type Api, errorMessage } from './api';
import { httpApi } from './api/http';
import { localApi } from './api/local';

// Artifact (claude.ai) build'ida backend yo'q — brauzer ichidagi namoyish rejimi ishlatiladi
export const api: Api = import.meta.env.MODE === 'artifact' ? localApi : httpApi;

interface Ctx {
  /** Birinchi yuklash tugadimi (sessiya tekshirildi) */
  ready: boolean;
  demoLogin: boolean;
  me: User | null;
  role: Role | null;
  actor: Actor | null;
  user: string;
  apps: Application[];
  audit: AuditEntry[];
  investors: Investor[];
  /** Har yangilanishda oshadi — sahifalar o'z ma'lumotini qayta yuklashi uchun */
  version: number;
  error: string | null;
  clearError: () => void;
  refresh: () => Promise<void>;
  login: (login: string, password: string) => Promise<void>;
  demo: (role: Role) => Promise<void>;
  logout: () => Promise<void>;
  reset: () => Promise<void>;
  /** Amalni bajaradi, xatoni umumiy xabar sifatida ko'rsatadi, so'ng ma'lumotni yangilaydi */
  perform: <T>(fn: () => Promise<T>) => Promise<T | undefined>;
}

const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [demoLogin, setDemoLogin] = useState(false);
  const [me, setMe] = useState<User | null>(null);
  const [apps, setApps] = useState<Application[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [version, setVersion] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (u: User | null) => {
    if (!u) {
      setApps([]);
      setAudit([]);
      setInvestors([]);
      return;
    }
    const staff = isStaff(u.role);
    const [a, au, inv] = await Promise.all([api.applications(), staff ? api.audit() : [], staff ? api.investors() : []]);
    setApps(a);
    setAudit(au);
    setInvestors(inv);
    setVersion((v) => v + 1);
  }, []);

  const refresh = useCallback(async () => {
    const u = await api.me();
    setMe(u);
    await loadData(u);
  }, [loadData]);

  useEffect(() => {
    (async () => {
      try {
        const cfg = await api.config();
        setDemoLogin(cfg.demoLogin);
        await refresh();
      } catch (e) {
        setError(errorMessage(e));
      } finally {
        setReady(true);
      }
    })();
  }, [refresh]);

  const value = useMemo<Ctx>(() => {
    const actor: Actor | null = me ? { id: me.id, name: me.name, role: me.role, investorId: me.investorId } : null;
    const perform: Ctx['perform'] = async (fn) => {
      try {
        const r = await fn();
        await refresh();
        return r;
      } catch (e) {
        setError(errorMessage(e));
        // Holat boshqa foydalanuvchi tomonidan o'zgargan bo'lishi mumkin — eng so'nggisini ko'rsatamiz
        refresh().catch(() => {});
        return undefined;
      }
    };
    const enter = async (u: User) => {
      setError(null);
      setMe(u);
      await loadData(u);
    };
    return {
      ready,
      demoLogin,
      me,
      role: me?.role ?? null,
      actor,
      user: me?.name ?? '',
      apps,
      audit,
      investors,
      version,
      error,
      clearError: () => setError(null),
      refresh,
      login: async (login, password) => enter(await api.login(login, password)),
      demo: async (role) => {
        try {
          await enter(await api.demoLogin(role));
        } catch (e) {
          setError(errorMessage(e));
        }
      },
      logout: async () => {
        await api.logout().catch(() => {});
        setMe(null);
        await loadData(null);
      },
      reset: () => perform(() => api.reset()).then(() => {}),
      perform,
    };
  }, [ready, demoLogin, me, apps, audit, investors, version, error, refresh, loadData]);

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("StoreProvider yo'q");
  return c;
}
