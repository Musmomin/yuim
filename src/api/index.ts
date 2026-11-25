// Frontend ma'lumotni faqat shu interfeys orqali oladi. Ikki amalga oshirish bor:
//  - http.ts  — haqiqiy backend (sukut bo'yicha)
//  - local.ts — brauzer ichidagi namoyish rejimi (claude.ai Artifact build'i, backend yo'q)
import type { Application, ApplicationInput, AuditEntry, Investor, MonthlyReport, ReviewKey, Role, User } from '../../shared/types';

export interface ApplicationDetail {
  application: Application;
  history: AuditEntry[];
}

export interface Api {
  config(): Promise<{ demoLogin: boolean }>;
  me(): Promise<User | null>;
  login(login: string, password: string): Promise<User>;
  demoLogin(role: Role): Promise<User>;
  logout(): Promise<void>;
  applications(): Promise<Application[]>;
  application(id: string): Promise<ApplicationDetail>;
  create(input: ApplicationInput): Promise<Application>;
  update(id: string, input: ApplicationInput): Promise<Application>;
  submit(id: string): Promise<Application>;
  review(id: string, key: ReviewKey, status: 'tasdiqlandi' | 'rad' | 'qayta', comment: string): Promise<Application>;
  fund(id: string, investorId: string): Promise<Application>;
  complete(id: string): Promise<Application>;
  addReport(id: string, report: MonthlyReport): Promise<Application>;
  investors(): Promise<Investor[]>;
  audit(): Promise<AuditEntry[]>;
  reset(): Promise<void>;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fields?: Record<string, string>,
  ) {
    super(message);
  }
}

export const errorMessage = (e: unknown) => (e instanceof Error ? e.message : "Noma'lum xato");
