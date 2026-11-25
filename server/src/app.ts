import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import Fastify, { type FastifyServerOptions } from 'fastify';
import { ZodError } from 'zod';
import { fieldErrors } from '../../shared/validation';
import { WorkflowError } from '../../shared/workflow';
import { COOKIE, HttpError, registerAuth, requireActor } from './auth';
import type { Database, Db } from './db/client';
import { seed } from './db/seed';
import type { Env } from './env';
import { applicationRoutes } from './routes/applications';
import { authRoutes } from './routes/auth';

export interface Ctx {
  db: Db;
  env: Env;
}

export async function buildApp(env: Env, database: Database, opts: FastifyServerOptions = {}) {
  const app = Fastify({ bodyLimit: 256 * 1024, ...opts });
  const ctx: Ctx = { db: database.db, env };

  await app.register(cookie);
  await app.register(jwt, { secret: env.jwtSecret, cookie: { cookieName: COOKIE, signed: false } });
  // Umumiy cheklov; login uchun alohida, qattiqroq cheklov marshrutning o'zida
  await app.register(rateLimit, { max: 300, timeWindow: '1 minute' });
  registerAuth(app, database.db);

  app.setErrorHandler((err, req, reply) => {
    if (err instanceof ZodError) return reply.code(400).send({ error: "Ma'lumotlar noto'g'ri", fields: fieldErrors(err) });
    if (err instanceof WorkflowError || err instanceof HttpError) return reply.code(err.status).send({ error: err.message });
    const e = err as { statusCode?: number; message?: string };
    if (e.statusCode && e.statusCode < 500) return reply.code(e.statusCode).send({ error: e.message });
    req.log.error(err);
    return reply.code(500).send({ error: 'Serverda kutilmagan xato' });
  });

  app.get('/api/health', async () => ({ ok: true }));
  await authRoutes(app, ctx);
  await applicationRoutes(app, ctx);

  // Namoyish rejimi: ↺ tugmasi test ma'lumotlarini boshlang'ich holatga qaytaradi
  app.post('/api/demo/reset', async (req) => {
    if (!env.demoLogin) throw new HttpError(404, 'Topilmadi');
    requireActor(req);
    if (!env.seedPassword) throw new HttpError(400, "SEED_PASSWORD o'rnatilmagan");
    await seed(database.db, env.seedPassword);
    return { ok: true };
  });

  return app;
}
