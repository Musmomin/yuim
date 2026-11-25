import bcrypt from 'bcryptjs';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ROLE_IDS } from '../../../shared/types';
import { loginSchema } from '../../../shared/validation';
import { clearSession, HttpError, issueSession, requireActor } from '../auth';
import type { Ctx } from '../app';
import { findUserByLogin, findUserById, findUserByRole, toUser, writeAudit } from '../repo';

// Mavjud bo'lmagan login uchun ham bcrypt ishlaydi — javob vaqtidan login borligini bilib bo'lmasin
const DUMMY_HASH = bcrypt.hashSync('timing-equalizer', 10);

export async function authRoutes(app: FastifyInstance, { db, env }: Ctx) {
  app.get('/api/config', async () => ({ demoLogin: env.demoLogin }));

  app.post(
    '/api/auth/login',
    { config: { rateLimit: { max: env.loginRateLimit, timeWindow: '1 minute' } } },
    async (req, reply) => {
      const { login, password } = loginSchema.parse(req.body);
      const u = await findUserByLogin(db, login);
      const ok = await bcrypt.compare(password, u?.passwordHash ?? DUMMY_HASH);
      if (!u || !ok) throw new HttpError(401, "Login yoki parol noto'g'ri");
      await issueSession(reply, u.id, env.cookieSecure);
      const user = toUser(u);
      await writeAudit(db, { id: user.id, name: user.name, role: user.role }, 'Tizimga kirdi');
      return { user };
    },
  );

  // Namoyish rejimi: rolni tanlab parolsiz kirish. Production'da sukut bo'yicha o'chiq.
  app.post('/api/auth/demo-login', async (req, reply) => {
    if (!env.demoLogin) throw new HttpError(404, 'Topilmadi');
    const { role } = z.object({ role: z.enum(ROLE_IDS as [string, ...string[]]) }).parse(req.body);
    const u = await findUserByRole(db, role as (typeof ROLE_IDS)[number]);
    if (!u) throw new HttpError(404, 'Bu rol uchun test foydalanuvchisi yo\'q (npm run db:seed)');
    await issueSession(reply, u.id, env.cookieSecure);
    return { user: toUser(u) };
  });

  app.post('/api/auth/logout', async (_req, reply) => {
    clearSession(reply);
    return { ok: true };
  });

  app.get('/api/auth/me', async (req) => {
    const actor = requireActor(req);
    const u = await findUserById(db, actor.id);
    return { user: toUser(u!) };
  });
}
