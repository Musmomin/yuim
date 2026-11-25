import { bigint, integer, jsonb, pgTable, primaryKey, serial, text, timestamp, index } from 'drizzle-orm/pg-core';
import type { AiAnalysis } from '../../../shared/types';

const money = (name: string) => bigint(name, { mode: 'number' });
const ts = (name: string) => timestamp(name, { withTimezone: true, mode: 'string' });

export const investors = pgTable('investors', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').$type<'MChJ' | 'AJ' | 'YaTT'>().notNull(),
  stir: text('stir').notNull(),
  contact: text('contact').notNull(),
  capital: money('capital').notNull(),
});

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  login: text('login').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull(),
  investorId: text('investor_id').references(() => investors.id),
  createdAt: ts('created_at').notNull().defaultNow(),
});

export const applications = pgTable(
  'applications',
  {
    id: text('id').primaryKey(),
    ownerId: text('owner_id').references(() => users.id),
    managerId: text('manager_id').references(() => users.id),
    managerName: text('manager_name').notNull(),
    investorId: text('investor_id').references(() => investors.id),
    investorName: text('investor_name'),
    company: text('company').notNull(),
    stir: text('stir').notNull(),
    director: text('director').notNull(),
    phone: text('phone').notNull(),
    region: text('region').notNull(),
    sector: text('sector').notNull(),
    activity: text('activity').notNull(),
    amount: money('amount').notNull(),
    termMonths: integer('term_months').notNull(),
    investorShare: integer('investor_share').notNull(),
    purpose: text('purpose').notNull(),
    revenue12m: money('revenue_12m').notNull(),
    profit12m: money('profit_12m').notNull(),
    employees: integer('employees').notNull(),
    stage: text('stage').notNull(),
    agreementNo: text('agreement_no').unique(),
    fundedAt: ts('funded_at'),
    submittedAt: ts('submitted_at').notNull(),
    ai: jsonb('ai').$type<AiAnalysis>().notNull(),
    updatedAt: ts('updated_at').notNull().defaultNow(),
  },
  (t) => [index('applications_owner_idx').on(t.ownerId), index('applications_investor_idx').on(t.investorId)],
);

export const reviews = pgTable(
  'reviews',
  {
    applicationId: text('application_id')
      .notNull()
      .references(() => applications.id, { onDelete: 'cascade' }),
    key: text('key').notNull(),
    status: text('status').notNull(),
    byUserId: text('by_user_id').references(() => users.id),
    byName: text('by_name'),
    at: ts('at'),
    comment: text('comment'),
  },
  (t) => [primaryKey({ columns: [t.applicationId, t.key] })],
);

export const monthlyReports = pgTable(
  'monthly_reports',
  {
    applicationId: text('application_id')
      .notNull()
      .references(() => applications.id, { onDelete: 'cascade' }),
    month: text('month').notNull(),
    revenue: money('revenue').notNull(),
    expenses: money('expenses').notNull(),
    plan: money('plan').notNull(),
  },
  (t) => [primaryKey({ columns: [t.applicationId, t.month] })],
);

export const auditLog = pgTable(
  'audit_log',
  {
    id: serial('id').primaryKey(),
    at: ts('at').notNull().defaultNow(),
    userId: text('user_id'),
    userName: text('user_name').notNull(),
    role: text('role').notNull(),
    action: text('action').notNull(),
    target: text('target'),
  },
  (t) => [index('audit_target_idx').on(t.target)],
);

/** Yil bo'yicha ketma-ket raqamlar (ariza ID, shartnoma raqami) — tasodifiy son o'rniga */
export const counters = pgTable('counters', {
  key: text('key').primaryKey(),
  value: integer('value').notNull(),
});
