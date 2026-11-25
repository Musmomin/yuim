import { mkdirSync } from 'node:fs';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import * as schema from './schema';
import { MIGRATIONS } from './migrations';

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

export interface Database {
  db: Db;
  /** Bir nechta SQL buyrug'ini parametrsiz bajaradi (migratsiyalar uchun) */
  exec: (sql: string) => Promise<void>;
  close: () => Promise<void>;
}

/**
 * DATABASE_URL:
 *  - postgres://user:pass@host:5432/db — haqiqiy PostgreSQL
 *  - pglite:./.data/pglite — fayldagi ichki PostgreSQL (o'rnatish shart emas)
 *  - pglite:memory — xotiradagi baza (testlar)
 */
export async function connect(url: string): Promise<Database> {
  if (url.startsWith('pglite:')) {
    const { PGlite } = await import('@electric-sql/pglite');
    const { drizzle } = await import('drizzle-orm/pglite');
    const target = url.slice('pglite:'.length);
    if (target !== 'memory') mkdirSync(target, { recursive: true });
    const client = target === 'memory' ? new PGlite() : new PGlite(target);
    await client.waitReady;
    return {
      db: drizzle(client, { schema }) as unknown as Db,
      exec: async (sql) => {
        await client.exec(sql);
      },
      close: () => client.close(),
    };
  }

  const pg = await import('pg');
  const { drizzle } = await import('drizzle-orm/node-postgres');
  const pool = new pg.default.Pool({ connectionString: url, max: 10 });
  return {
    db: drizzle(pool, { schema }) as unknown as Db,
    exec: async (sql) => {
      await pool.query(sql);
    },
    close: () => pool.end(),
  };
}

/** Hali qo'llanmagan migratsiyalarni tartib bilan bajaradi */
export async function migrate(database: Database, log: (m: string) => void = () => {}) {
  await database.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (id text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`);
  const { sql } = await import('drizzle-orm');
  const rows = await database.db.execute<{ id: string }>(sql`SELECT id FROM schema_migrations`);
  const done = new Set(((rows as unknown as { rows?: { id: string }[] }).rows ?? (rows as unknown as { id: string }[])).map((r) => r.id));
  for (const m of MIGRATIONS) {
    if (done.has(m.id)) continue;
    // Har bir migratsiya o'z tranzaksiyasida: yarim qo'llangan holat qolmasin
    try {
      await database.exec(`BEGIN;\n${m.sql}\nINSERT INTO schema_migrations (id) VALUES ('${m.id}');\nCOMMIT;`);
    } catch (err) {
      await database.exec('ROLLBACK').catch(() => {});
      throw err;
    }
    log(`Migratsiya qo'llandi: ${m.id}`);
  }
}
