import { buildApp } from './app';
import { connect, migrate } from './db/client';
import { users } from './db/schema';
import { seed } from './db/seed';
import { loadEnv } from './env';

const env = loadEnv();
const database = await connect(env.databaseUrl);
await migrate(database, console.log);

// Namoyish muhitida baza bo'sh bo'lsa, test ma'lumotlarini avtomatik yozamiz
if (env.demoLogin && env.seedPassword && !(await database.db.select({ id: users.id }).from(users).limit(1)).length) {
  await seed(database.db, env.seedPassword);
  console.log("Bo'sh bazaga test ma'lumotlari yozildi");
}

const app = await buildApp(env, database, {
  logger: env.nodeEnv === 'production' ? true : { level: 'info' },
  // Reverse proxy (nginx) orqasida haqiqiy IP rate-limit uchun kerak
  trustProxy: env.nodeEnv === 'production',
});

const shutdown = async () => {
  await app.close();
  await database.close();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

await app.listen({ host: env.host, port: env.port });
if (env.demoLogin) app.log.warn('DEMO_LOGIN yoqilgan: rolni tanlab parolsiz kirish mumkin. Production uchun o\'chiring.');
