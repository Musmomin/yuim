// Kiruvchi ma'lumotlar sxemalari: forma ham, server ham shu qoidalarni ishlatadi.
import { z } from 'zod';
import { REGIONS, SECTORS } from './policy';

const text = (max: number, msg = "Majburiy maydon") => z.string().trim().min(1, msg).max(max);
const money = z.number().int("Butun son kiriting").min(0, "Manfiy bo'lishi mumkin emas").max(1e13);

export const applicationInputSchema = z
  .object({
    company: text(200),
    stir: z
      .string()
      .transform((s) => s.replace(/\s/g, ''))
      .refine((s) => /^\d{9}$/.test(s), 'STIR 9 ta raqamdan iborat bo\'lishi kerak')
      .transform((s) => `${s.slice(0, 3)} ${s.slice(3, 6)} ${s.slice(6)}`),
    director: text(120),
    phone: z
      .string()
      .transform((s) => s.replace(/[\s()-]/g, ''))
      .refine((s) => /^\+998\d{9}$/.test(s), "Telefon +998 XX XXX-XX-XX ko'rinishida bo'lishi kerak")
      .transform((s) => `+998 ${s.slice(4, 6)} ${s.slice(6, 9)}-${s.slice(9, 11)}-${s.slice(11)}`),
    region: z.enum(REGIONS as [string, ...string[]], { message: "Hudud ro'yxatdan tanlanishi kerak" }),
    sector: z.enum(SECTORS as [string, ...string[]], { message: "Tarmoq ro'yxatdan tanlanishi kerak" }),
    activity: text(300),
    amount: money.min(1, "Summa 0 dan katta bo'lishi kerak"),
    termMonths: z.number().int().min(1, 'Kamida 1 oy').max(120, "Ko'pi bilan 120 oy"),
    investorShare: z.number().int().min(1, 'Kamida 1%').max(99, "Ko'pi bilan 99%"),
    purpose: text(2000),
    revenue12m: money,
    profit12m: z.number().int().max(1e13).min(-1e13),
    employees: z.number().int().min(0).max(1_000_000),
  })
  .strict();

export const reviewSchema = z.object({
  status: z.enum(['tasdiqlandi', 'rad', 'qayta']),
  comment: z.string().trim().max(2000).default(''),
});

export const fundSchema = z.object({ investorId: z.string().min(1) });

export const reportSchema = z
  .object({
    month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Oy YYYY-MM formatida bo\'lishi kerak'),
    revenue: money,
    expenses: money,
    plan: z.number().int().min(-1e13).max(1e13),
  })
  .strict();

export const loginSchema = z.object({
  login: z.string().trim().min(1).max(100),
  password: z.string().min(1).max(200),
});

/** Zod xatosini foydalanuvchiga ko'rsatish uchun { maydon: xabar } ko'rinishiga keltiradi */
export function fieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of err.issues) {
    const k = i.path.join('.') || '_';
    out[k] ??= i.message;
  }
  return out;
}
