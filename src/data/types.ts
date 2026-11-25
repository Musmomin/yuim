export type Role =
  | 'admin'
  | 'menejer'
  | 'komplayens'
  | 'investitsiya'
  | 'yuridik'
  | 'audit'
  | 'investor'
  | 'biznes';

export type Stage =
  | 'yangi'
  | 'korik'
  | 'yuridik'
  | 'imzolash'
  | 'moliyalashtirildi'
  | 'yakunlandi'
  | 'rad';

export type ReviewKey = 'komplayens' | 'investitsiya' | 'yuridik';
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
  /** Qo'mitalarga yuborilgan vaqt */
  sentAt?: string;
  /** Joriy bosqichga o'tgan vaqt (muddatni hisoblash uchun) */
  stageAt?: string;
  manager: string;
  investor?: string;
  agreementNo?: string;
  fundedAt?: string;
  reviews: Record<ReviewKey, Review>;
  ai: AiAnalysis;
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
