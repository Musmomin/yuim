import { defineConfig } from 'tsup';

// ../shared dagi kod ham bitta faylga yig'iladi; node_modules paketlari tashqarida qoladi
export default defineConfig({
  entry: { index: 'src/index.ts', 'migrate-cli': 'src/db/migrate-cli.ts', 'seed-cli': 'src/db/seed-cli.ts' },
  format: 'esm',
  platform: 'node',
  target: 'node22',
  clean: true,
  sourcemap: true,
});
