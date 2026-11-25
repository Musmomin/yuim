// npm run db:seed — bazani test ma'lumotlari bilan to'ldiradi (barcha ma'lumot o'chadi!)
import { loadEnv } from '../env';
import { connect, migrate } from './client';
import { seed } from './seed';

const env = loadEnv();
if (env.nodeEnv === 'production' && process.argv[2] !== '--force') {
  console.error("Production bazasida seed barcha ma'lumotni o'chiradi. Rostdan kerak bo'lsa: npm run db:seed -- --force");
  process.exit(1);
}
if (!env.seedPassword) {
  console.error("SEED_PASSWORD o'rnatilmagan (.env.example ga qarang)");
  process.exit(1);
}
const database = await connect(env.databaseUrl);
await migrate(database, console.log);
await seed(database.db, env.seedPassword);
await database.close();
console.log("Test ma'lumotlari yozildi. Loginlar: admin, menejer, komplayens, investitsiya, yuridik, audit, investor, biznes");
