// npm run db:migrate — qo'llanmagan migratsiyalarni bajaradi
import { loadEnv } from '../env';
import { connect, migrate } from './client';

const env = loadEnv();
const database = await connect(env.databaseUrl);
await migrate(database, console.log);
await database.close();
console.log('Baza sxemasi dolzarb');
