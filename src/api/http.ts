import type { Api } from './index';
import { ApiError } from './index';

// Ishlab chiqishda Vite /api ni backend'ga yo'naltiradi (vite.config.ts).
// Production'da frontend va backend bitta domenda bo'lishi kerak (cookie SameSite=Strict).
const BASE = import.meta.env.VITE_API_URL ?? '';

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method,
      credentials: 'include',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, "Server bilan aloqa yo'q. Backend ishga tushirilganini tekshiring.");
  }
  const data = res.headers.get('content-type')?.includes('json') ? await res.json() : null;
  if (!res.ok) throw new ApiError(res.status, data?.error ?? `Xato: ${res.status}`, data?.fields);
  return data as T;
}

type A<T> = { application: T };

export const httpApi: Api = {
  config: () => req('GET', '/config'),
  me: async () => {
    try {
      return (await req<{ user: Awaited<ReturnType<Api['me']>> }>('GET', '/auth/me')).user;
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return null;
      throw e;
    }
  },
  login: async (login, password) => (await req<{ user: never }>('POST', '/auth/login', { login, password })).user,
  demoLogin: async (role) => (await req<{ user: never }>('POST', '/auth/demo-login', { role })).user,
  logout: async () => {
    await req('POST', '/auth/logout');
  },
  applications: async () => (await req<{ applications: never }>('GET', '/applications')).applications,
  application: (id) => req('GET', `/applications/${encodeURIComponent(id)}`),
  create: async (input) => (await req<A<never>>('POST', '/applications', input)).application,
  update: async (id, input) => (await req<A<never>>('PUT', `/applications/${encodeURIComponent(id)}`, input)).application,
  submit: async (id) => (await req<A<never>>('POST', `/applications/${encodeURIComponent(id)}/submit`)).application,
  review: async (id, key, status, comment) =>
    (await req<A<never>>('POST', `/applications/${encodeURIComponent(id)}/reviews/${key}`, { status, comment })).application,
  fund: async (id, investorId) => (await req<A<never>>('POST', `/applications/${encodeURIComponent(id)}/fund`, { investorId })).application,
  complete: async (id) => (await req<A<never>>('POST', `/applications/${encodeURIComponent(id)}/complete`)).application,
  addReport: async (id, report) => (await req<A<never>>('POST', `/applications/${encodeURIComponent(id)}/reports`, report)).application,
  investors: async () => (await req<{ investors: never }>('GET', '/investors')).investors,
  audit: async () => (await req<{ audit: never }>('GET', '/audit')).audit,
  reset: async () => {
    await req('POST', '/demo/reset');
  },
};
