import { z } from 'zod';

const bool = z
  .enum(['true', 'false', '1', '0'])
  .transform((v) => v === 'true' || v === '1')
  .optional();

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  HOST: z.string().default('127.0.0.1'),
  PORT: z.coerce.number().int().default(3000),
  /** postgres://... — PostgreSQL; pglite:<papka> yoki pglite:memory — o'rnatishsiz ichki PostgreSQL (ishlab chiqish va testlar) */
  DATABASE_URL: z.string().default('pglite:./.data/pglite'),
  JWT_SECRET: z.string().optional(),
  /** Kirish sahifasida rolni tanlab parolsiz kirish (faqat namoyish uchun) */
  DEMO_LOGIN: bool,
  SEED_PASSWORD: z.string().optional(),
  COOKIE_SECURE: bool,
  /** Bitta IP'dan daqiqasiga login urinishlari soni */
  LOGIN_RATE_LIMIT: z.coerce.number().int().positive().default(10),
});

export type Env = {
  nodeEnv: 'development' | 'production' | 'test';
  host: string;
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  demoLogin: boolean;
  seedPassword?: string;
  cookieSecure: boolean;
  loginRateLimit: number;
};

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const e = schema.parse(source);
  const prod = e.NODE_ENV === 'production';
  if (prod && (!e.JWT_SECRET || e.JWT_SECRET.length < 32)) {
    throw new Error('Production rejimida JWT_SECRET kamida 32 belgidan iborat bo\'lishi shart');
  }
  if (prod && e.DATABASE_URL.startsWith('pglite:')) {
    throw new Error('Production rejimida DATABASE_URL PostgreSQL manzili (postgres://...) bo\'lishi kerak');
  }
  return {
    nodeEnv: e.NODE_ENV,
    host: e.HOST,
    port: e.PORT,
    databaseUrl: e.DATABASE_URL,
    jwtSecret: e.JWT_SECRET ?? 'dev-only-secret-change-me-dev-only-secret',
    demoLogin: e.DEMO_LOGIN ?? !prod,
    seedPassword: e.SEED_PASSWORD,
    cookieSecure: e.COOKIE_SECURE ?? prod,
    loginRateLimit: e.LOGIN_RATE_LIMIT,
  };
}
