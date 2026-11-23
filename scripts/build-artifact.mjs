// dist-artifact/ dagi Vite build'ni bitta HTML faylga yig'adi (claude.ai Artifact uchun).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const dir = 'dist-artifact';
const html = readFileSync(join(dir, 'index.html'), 'utf8');
const css = [...html.matchAll(/href="\.?\/?(assets\/[^"]+\.css)"/g)].map((m) => readFileSync(join(dir, m[1]), 'utf8')).join('\n');
const js = [...html.matchAll(/src="\.?\/?(assets\/[^"]+\.js)"/g)].map((m) => readFileSync(join(dir, m[1]), 'utf8')).join('\n');
if (!css || !js) throw new Error('CSS yoki JS topilmadi');

const out = `<title>YUIM</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400..800&display=swap">
<style>${css}</style>
<div id="root"></div>
<script type="module">${js.replace(/<\/script/gi, '<\/script')}</script>
`;
mkdirSync('artifact', { recursive: true });
writeFileSync('artifact/yuim.html', out);
console.log(`artifact/yuim.html — ${(out.length / 1024).toFixed(0)} KB`);
