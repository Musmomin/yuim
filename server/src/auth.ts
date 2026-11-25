import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { Actor } from '../../shared/workflow';
import type { Role } from '../../shared/types';
import { findUserById, toUser } from './repo';
import type { Db } from './db/client';

export const COOKIE = 'yuim_token';
export const SESSION_SECONDS = 8 * 60 * 60;

declare module 'fastify' {
  interface FastifyRequest {
    actor: Actor | null;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string };
    user: { sub: string };
  }
}

/** Har bir so'rovda cookie'dagi tokenni tekshirib, foydalanuvchini bazadan yuklaydi */
export function registerAuth(app: FastifyInstance, db: Db) {
  app.decorateRequest('actor', null);
  app.addHook('onRequest', async (req) => {
    if (!req.cookies[COOKIE]) return;
    try {
      const { sub } = await req.jwtVerify<{ sub: string }>();
      const u = await findUserById(db, sub);
      // Foydalanuvchi o'chirilgan bo'lsa, eski token ham ishlamaydi
      if (u) {
        const user = toUser(u);
        req.actor = { id: user.id, name: user.name, role: user.role, investorId: user.investorId };
      }
    } catch {
      /* yaroqsiz yoki muddati o'tgan token — mehmon sifatida davom etadi */
    }
  });
}

export async function issueSession(reply: FastifyReply, userId: string, secure: boolean) {
  const token = await reply.jwtSign({ sub: userId }, { expiresIn: SESSION_SECONDS });
  reply.setCookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure,
    path: '/',
    maxAge: SESSION_SECONDS,
  });
}

export function clearSession(reply: FastifyReply) {
  reply.clearCookie(COOKIE, { path: '/' });
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Kirgan foydalanuvchini qaytaradi; `roles` berilsa, rolni ham tekshiradi */
export function requireActor(req: FastifyRequest, roles?: Role[]): Actor {
  if (!req.actor) throw new HttpError(401, 'Tizimga kiring');
  if (roles && !roles.includes(req.actor.role)) throw new HttpError(403, "Bu bo'limga kirish huquqingiz yo'q");
  return req.actor;
}
