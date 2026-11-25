import bcrypt from 'bcryptjs';
import { sql } from 'drizzle-orm';
import { INVESTORS, SEED_USERS, seedApplications, seedAudit } from '../../../shared/seed';
import type { Db } from './client';
import { auditLog, investors, users } from './schema';
import { insertApplication, setCounterAtLeast } from '../repo';

/**
 * Bazani test ma'lumotlari bilan to'ldiradi. Mavjud BARCHA ma'lumot o'chiriladi —
 * faqat ishlab chiqish va namoyish muhitida ishlating.
 */
export async function seed(db: Db, password: string, bcryptCost = 10) {
  const hash = await bcrypt.hash(password, bcryptCost);
  await db.transaction(async (tx) => {
    // TRUNCATE audit jurnalidagi qator triggerini chetlab o'tadi — bu ataylab, faqat seed uchun
    await tx.execute(sql`TRUNCATE monthly_reports, reviews, applications, audit_log, users, investors, counters RESTART IDENTITY CASCADE`);
    await tx.insert(investors).values(INVESTORS);
    await tx.insert(users).values(
      SEED_USERS.map((u) => ({ id: u.id, login: u.login, name: u.name, role: u.role, investorId: u.investorId ?? null, passwordHash: hash })),
    );
    for (const a of seedApplications()) {
      await insertApplication(tx, a);
      const [, year, n] = a.id.split('-');
      await setCounterAtLeast(tx, `application:${year}`, Number(n));
      if (a.agreementNo) {
        const [y, num] = a.agreementNo.replace('OSh-', '').split('/');
        await setCounterAtLeast(tx, `agreement:${y}`, Number(num));
      }
    }
    const byName = new Map(SEED_USERS.map((u) => [u.name, u.id]));
    // Eskidan yangiga tartibda yozamiz, shunda id ham vaqt bo'yicha o'sadi
    for (const e of seedAudit().reverse()) {
      await tx.insert(auditLog).values({ at: e.at, userId: byName.get(e.user) ?? null, userName: e.user, role: e.role, action: e.action, target: e.target ?? null });
    }
  });
}
