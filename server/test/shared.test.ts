import { describe, expect, it } from 'vitest';
import { findRestricted } from '../../shared/policy';
import { applicationInputSchema } from '../../shared/validation';
import * as wf from '../../shared/workflow';
import { seedApplications } from '../../shared/seed';
import type { Application } from '../../shared/types';

describe('findRestricted (komplayens skriningi)', () => {
  it('cheklangan faoliyatni topadi', () => {
    expect(findRestricted('Vino ishlab chiqarish')).toMatch(/Alkogol/);
    expect(findRestricted('Lotereya va bukmekerlik shoxobchalari')).toMatch(/lotereya/);
    expect(findRestricted('mikrokredit tashkiloti')).toMatch(/Qarz/);
    expect(findRestricted('Aholiga kredit berish')).toMatch(/Qarz/);
    expect(findRestricted("Qurol-yarog' savdosi")).toMatch(/Qurol/);
  });

  it("so'z ichidagi yoki istisno so'zlarni cheklangan deb hisoblamaydi", () => {
    expect(findRestricted('Vinogradchilik va uzum quritish')).toBeUndefined();
    expect(findRestricted('Alkogolsiz ichimliklar ishlab chiqarish')).toBeUndefined();
    expect(findRestricted('Bank kreditini muddatidan oldin yopish va aylanma mablag\'')).toBeUndefined();
    expect(findRestricted('Qurilish materiallari')).toBeUndefined();
  });
});

describe('applicationInputSchema', () => {
  const base = seedApplications()[0];
  const input = {
    company: base.company, stir: '309512447', director: base.director, phone: '+998901234567', region: base.region,
    sector: base.sector, activity: base.activity, amount: base.amount, termMonths: base.termMonths, investorShare: base.investorShare,
    purpose: base.purpose, revenue12m: base.revenue12m, profit12m: base.profit12m, employees: base.employees,
  };

  it("STIR va telefonni tekshiradi va bir xil ko'rinishga keltiradi", () => {
    const r = applicationInputSchema.parse(input);
    expect(r.stir).toBe('309 512 447');
    expect(r.phone).toBe('+998 90 123-45-67');
  });

  it("noto'g'ri STIR, telefon va ulushni rad etadi", () => {
    expect(applicationInputSchema.safeParse({ ...input, stir: '12345' }).success).toBe(false);
    expect(applicationInputSchema.safeParse({ ...input, phone: '901234567' }).success).toBe(false);
    expect(applicationInputSchema.safeParse({ ...input, investorShare: 150 }).success).toBe(false);
    expect(applicationInputSchema.safeParse({ ...input, extra: 1 }).success).toBe(false);
  });
});

describe('workflow', () => {
  const komp: wf.Actor = { id: 'u-komplayens', name: 'S', role: 'komplayens' };
  const inv: wf.Actor = { id: 'u-investitsiya', name: 'B', role: 'investitsiya' };
  const man: wf.Actor = { id: 'u-menejer', name: 'D', role: 'menejer' };
  const biz: wf.Actor = { id: 'u-biznes', name: "Navro'z Tekstil MChJ", role: 'biznes' };
  const t = '2026-11-25T10:00:00.000Z';
  const fresh = (): Application => ({ ...seedApplications().find((a) => a.id === 'YU-2026-029')!, stage: 'korik' });

  it("ikkala qo'mita tasdiqlasa yuridik bosqichga o'tadi", () => {
    let a = wf.review(fresh(), 'komplayens', 'tasdiqlandi', '', komp, t).app;
    expect(a.stage).toBe('korik');
    a = wf.review(a, 'investitsiya', 'tasdiqlandi', '', inv, t).app;
    expect(a.stage).toBe('yuridik');
  });

  it("«qayta» arizani qaytaradi, tuzatilgach qayta yuborilib, xulosalar yangidan olinadi", () => {
    let a = wf.review(fresh(), 'komplayens', 'tasdiqlandi', '', komp, t).app;
    a = wf.review(a, 'investitsiya', 'qayta', "Balans kerak", inv, t).app;
    expect(a.stage).toBe('qaytarildi');
    expect(wf.canReview(komp, a, 'komplayens')).toBe(false);
    a = wf.submit(a, man).app;
    expect(a.stage).toBe('korik');
    expect(a.reviews.komplayens.status).toBe('kutilmoqda');
    expect(a.reviews.investitsiya.status).toBe('kutilmoqda');
  });

  it('rad etish va qaytarishda izoh majburiy', () => {
    expect(() => wf.review(fresh(), 'komplayens', 'rad', '  ', komp, t)).toThrow(/izoh/);
  });

  it("boshqa organ nomidan qaror qilib bo'lmaydi", () => {
    expect(() => wf.review(fresh(), 'investitsiya', 'tasdiqlandi', '', komp, t)).toThrow(wf.WorkflowError);
  });

  it("biznes faqat o'z arizasini ko'radi va AI bahosi unga ko'rsatilmaydi", () => {
    const own = seedApplications().find((a) => a.ownerId === 'u-biznes')!;
    const other = seedApplications().find((a) => a.ownerId !== 'u-biznes')!;
    expect(wf.canView(biz, own)).toBe(true);
    expect(wf.canView(biz, other)).toBe(false);
    expect(wf.redact(biz, own).ai).toBeUndefined();
  });

  it("biznes tahrirda kompaniya nomini almashtira olmaydi", () => {
    const own = { ...seedApplications().find((a) => a.ownerId === 'u-biznes')!, stage: 'yangi' as const };
    const { app } = wf.edit(own, { ...own, company: 'Boshqa MChJ' }, biz);
    expect(app.company).toBe(own.company);
  });
});
