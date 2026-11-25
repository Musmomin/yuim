import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app';
import { connect, migrate, type Database } from '../src/db/client';
import { seed } from '../src/db/seed';
import { loadEnv } from '../src/env';
import type { Application, Role } from '../../shared/types';

const PASSWORD = 'test-parol-123';
let database: Database;
let app: FastifyInstance;

beforeAll(async () => {
  const env = loadEnv({ NODE_ENV: 'test', DATABASE_URL: 'pglite:memory', DEMO_LOGIN: 'true', SEED_PASSWORD: PASSWORD, LOGIN_RATE_LIMIT: '1000' });
  database = await connect(env.databaseUrl);
  await migrate(database);
  app = await buildApp(env, database);
});

afterAll(async () => {
  await app?.close();
  await database?.close();
});

beforeEach(async () => {
  await seed(database.db, PASSWORD, 4);
});

async function loginAs(login: string, password = PASSWORD) {
  const res = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { login, password } });
  expect(res.statusCode, res.body).toBe(200);
  const cookie = res.cookies.find((c) => c.name === 'yuim_token')!;
  expect(cookie.httpOnly).toBe(true);
  return { yuim_token: cookie.value };
}

function api(cookies: Record<string, string>) {
  return {
    get: (url: string) => app.inject({ method: 'GET', url, cookies }),
    post: (url: string, payload?: object) => app.inject({ method: 'POST', url, cookies, payload }),
    put: (url: string, payload: object) => app.inject({ method: 'PUT', url, cookies, payload }),
  };
}

const as = async (role: Role) => api(await loginAs(role));

const newInput = {
  company: 'Test Mebel MChJ',
  stir: '301 222 333',
  director: 'T. Testov',
  phone: '+998 90 111-22-33',
  region: 'Toshkent sh.',
  sector: 'Mebel ishlab chiqarish',
  activity: 'Ofis mebellari ishlab chiqarish',
  amount: 300_000_000,
  termMonths: 12,
  investorShare: 40,
  purpose: 'Stanok xaridi',
  revenue12m: 1_500_000_000,
  profit12m: 200_000_000,
  employees: 12,
};

describe('autentifikatsiya', () => {
  it("noto'g'ri parol va kirmagan foydalanuvchini rad etadi", async () => {
    const bad = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { login: 'admin', password: 'xato' } });
    expect(bad.statusCode).toBe(401);
    expect((await app.inject({ method: 'GET', url: '/api/applications' })).statusCode).toBe(401);
    expect((await app.inject({ method: 'GET', url: '/api/auth/me', cookies: { yuim_token: 'soxta' } })).statusCode).toBe(401);
  });

  it("to'g'ri parol bilan kiradi", async () => {
    const me = await api(await loginAs('menejer')).get('/api/auth/me');
    expect(me.json().user).toMatchObject({ login: 'menejer', role: 'menejer' });
  });
});

describe("kirish huquqlari", () => {
  it("biznes faqat o'z arizalarini ko'radi, boshqasini ochsa 404", async () => {
    const biz = await as('biznes');
    const list = (await biz.get('/api/applications')).json().applications as Application[];
    expect(list.length).toBeGreaterThan(0);
    expect(list.every((a) => a.ownerId === 'u-biznes')).toBe(true);
    expect(list.every((a) => a.ai === undefined)).toBe(true);
    expect((await biz.get('/api/applications/YU-2026-027')).statusCode).toBe(404);
  });

  it("investor faqat o'zi moliyalashtirgan shartnomalarni ko'radi", async () => {
    const inv = await as('investor');
    const list = (await inv.get('/api/applications')).json().applications as Application[];
    expect(list.map((a) => a.id).sort()).toEqual(['YU-2025-031', 'YU-2026-018']);
    // Ilgari URL orqali istalgan arizani ochish mumkin edi
    expect((await inv.get('/api/applications/YU-2026-031')).statusCode).toBe(404);
    expect((await inv.get('/api/audit')).statusCode).toBe(403);
    expect((await inv.get('/api/investors')).statusCode).toBe(403);
  });
});

describe('ariza jarayoni', () => {
  it("ID'lar ketma-ket va takrorlanmaydi", async () => {
    const man = await as('menejer');
    const ids = new Set<string>();
    for (let i = 0; i < 5; i++) {
      const res = await man.post('/api/applications', newInput);
      expect(res.statusCode, res.body).toBe(201);
      ids.add(res.json().application.id);
    }
    expect(ids.size).toBe(5);
    const year = new Date().getFullYear();
    // 2026 yil uchun seed'dagi eng katta raqam 031
    if (year === 2026) expect([...ids]).toContain('YU-2026-032');
  });

  it("noto'g'ri ma'lumotni maydon xatolari bilan rad etadi", async () => {
    const res = await (await as('menejer')).post('/api/applications', { ...newInput, stir: '12', investorShare: 150 });
    expect(res.statusCode).toBe(400);
    expect(Object.keys(res.json().fields)).toEqual(expect.arrayContaining(['stir', 'investorShare']));
  });

  it("to'liq jarayon: ariza → qaytarish → tuzatish → tasdiqlash → moliyalashtirish → hisobot → yakun", async () => {
    const biz = await as('biznes');
    const created = await biz.post('/api/applications', { ...newInput, company: 'Boshqa nom' });
    expect(created.statusCode).toBe(201);
    const a = created.json().application as Application;
    expect(a.company).toBe("Navro'z Tekstil MChJ"); // biznes boshqa kompaniya nomidan ariza bera olmaydi
    expect(a.manager).toBeTruthy();

    const man = await as('menejer');
    expect((await biz.post(`/api/applications/${a.id}/submit`)).statusCode).toBe(409); // yangi arizani faqat menejer yuboradi
    expect((await man.post(`/api/applications/${a.id}/submit`)).json().application.stage).toBe('korik');

    const komp = await as('komplayens');
    const inv = await as('investitsiya');
    expect((await komp.post(`/api/applications/${a.id}/reviews/investitsiya`, { status: 'tasdiqlandi' })).statusCode).toBe(403);
    expect((await komp.post(`/api/applications/${a.id}/reviews/komplayens`, { status: 'tasdiqlandi' })).statusCode).toBe(200);
    expect((await inv.post(`/api/applications/${a.id}/reviews/investitsiya`, { status: 'qayta' })).statusCode).toBe(400); // izohsiz
    const back = await inv.post(`/api/applications/${a.id}/reviews/investitsiya`, { status: 'qayta', comment: 'Balans kerak' });
    expect(back.json().application.stage).toBe('qaytarildi');

    // Biznes qaytarish sababini ko'radi, tuzatadi va qayta yuboradi
    const seen = (await biz.get(`/api/applications/${a.id}`)).json().application as Application;
    expect(seen.reviews.investitsiya.comment).toBe('Balans kerak');
    expect(seen.reviews.investitsiya.by).toBeUndefined();
    expect((await biz.put(`/api/applications/${a.id}`, { ...newInput, profit12m: 250_000_000 })).statusCode).toBe(200);
    expect((await biz.post(`/api/applications/${a.id}/submit`)).json().application.stage).toBe('korik');

    await komp.post(`/api/applications/${a.id}/reviews/komplayens`, { status: 'tasdiqlandi' });
    expect((await inv.post(`/api/applications/${a.id}/reviews/investitsiya`, { status: 'tasdiqlandi' })).json().application.stage).toBe('yuridik');
    const yur = await as('yuridik');
    expect((await yur.post(`/api/applications/${a.id}/reviews/yuridik`, { status: 'tasdiqlandi' })).json().application.stage).toBe('imzolash');

    expect((await biz.put(`/api/applications/${a.id}`, newInput)).statusCode).toBe(409); // imzolash bosqichida tahrir yo'q
    const funded = (await man.post(`/api/applications/${a.id}/fund`, { investorId: 'inv-1' })).json().application as Application;
    expect(funded.stage).toBe('moliyalashtirildi');
    expect(funded.agreementNo).toMatch(/^OSh-\d{4}\/\d{3}$/);

    const rep = await biz.post(`/api/applications/${a.id}/reports`, { month: '2026-12', revenue: 150_000_000, expenses: 120_000_000, plan: 25_000_000 });
    expect(rep.json().application.reports).toHaveLength(1);

    // Investor endi bu shartnomani ko'radi
    const investor = await as('investor');
    expect((await investor.get(`/api/applications/${a.id}`)).statusCode).toBe(200);

    expect((await man.post(`/api/applications/${a.id}/complete`)).json().application.stage).toBe('yakunlandi');

    const history = (await man.get(`/api/applications/${a.id}`)).json().history as { action: string }[];
    expect(history.length).toBeGreaterThanOrEqual(10);
  });

  it("audit jurnalini o'zgartirib yoki o'chirib bo'lmaydi", async () => {
    await expect(database.exec("UPDATE audit_log SET action = 'x'")).rejects.toThrow(/audit_log/);
    await expect(database.exec('DELETE FROM audit_log')).rejects.toThrow(/audit_log/);
  });
});
