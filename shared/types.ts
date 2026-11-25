// Frontend va backend uchun umumiy domen turlari.

export type Role =
  | 'admin'
  | 'menejer'
  | 'komplayens'
  | 'investitsiya'
  | 'yuridik'
  | 'audit'
  | 'investor'
  | 'biznes';

export const ROLE_IDS: Role[] = ['admin', 'menejer', 'komplayens', 'investitsiya', 'yuridik', 'audit', 'investor', 'biznes'];

/** Ichki xodim rollari (biznes va investor emas) */
export const STAFF_ROLES: Role[] = ['admin', 'menejer', 'komplayens', 'investitsiya', 'yuridik', 'audit'];

export type Stage =
  | 'yangi'
  | 'korik'
  | 'qaytarildi'
  | 'yuridik'
  | 'imzolash'
  | 'moliyalashtirildi'
  | 'yakunlandi'
  | 'rad';

export type ReviewKey = 'komplayens' | 'investitsiya' | 'yuridik';
export const REVIEW_KEYS: ReviewKey[] = ['komplayens', 'investitsiya', 'yuridik'];

export type ReviewStatus = 'kutilmoqda' | 'tasdiqlandi' | 'rad' | 'qayta';

export interface Review {
  status: ReviewStatus;
  by?: string;
  at?: string;
  comment?: string;
}

export type RiskLevel = 'past' | 'orta' | 'yuqori';
export type ActivityStatus = 'ruxsat' | 'cheklangan';

export interface AiAnalysis {
  score: number;
  level: RiskLevel;
  activity: ActivityStatus;
  activityHit?: string;
  summary: string;
  flags: string[];
  suggestedShare: number;
}

export interface MonthlyReport {
  month: string; // YYYY-MM
  revenue: number;
  expenses: number;
  plan: number; // rejadagi sof foyda
}

export interface ApplicationInput {
  company: string;
  stir: string;
  director: string;
  phone: string;
  region: string;
  sector: string;
  activity: string;
  amount: number;
  termMonths: number;
  investorShare: number;
  purpose: string;
  revenue12m: number;
  profit12m: number;
  employees: number;
}

export interface Application extends ApplicationInput {
  id: string;
  submittedAt: string;
  stage: Stage;
  /** Arizani topshirgan biznes foydalanuvchisi (bo'lmasligi mumkin — menejer kiritgan bo'lsa) */
  ownerId?: string;
  managerId?: string;
  manager: string;
  investorId?: string;
  investor?: string;
  agreementNo?: string;
  fundedAt?: string;
  reviews: Record<ReviewKey, Review>;
  /** Investor va biznesga ko'rsatilmaydi (server olib tashlaydi) */
  ai?: AiAnalysis;
  reports: MonthlyReport[];
}

export interface AuditEntry {
  id: string;
  at: string;
  user: string;
  role: Role;
  action: string;
  target?: string;
}

export interface Investor {
  id: string;
  name: string;
  type: 'MChJ' | 'AJ' | 'YaTT';
  stir: string;
  contact: string;
  capital: number; // investitsiya uchun ajratilgan mablag'
}

/** Tizimga kirgan foydalanuvchi */
export interface User {
  id: string;
  login: string;
  name: string;
  role: Role;
  investorId?: string;
}
