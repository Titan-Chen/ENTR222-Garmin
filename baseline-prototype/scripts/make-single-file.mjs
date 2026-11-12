// Builds "Open Prototype.html": the whole prototype in ONE file (JS + CSS inlined),
// so it opens by double-clicking, with no server or Terminal needed.
// Run after `vite build` (npm run build does both).
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
let html = readFileSync(join(dist, 'index.html'), 'utf8');

html = html.replace(/<link rel="stylesheet"[^>]*href="\.\/(assets\/[^"]+\.css)"[^>]*>/g, (_, p) =>
  `<style>\n${readFileSync(join(dist, p), 'utf8')}\n</style>`);

const scripts = [];
html = html.replace(/<script type="module"[^>]*src="\.\/(assets\/[^"]+\.js)"[^>]*><\/script>/g, (_, p) => {
  scripts.push(readFileSync(join(dist, p), 'utf8').replace(/<\/script/gi, '<\\/script'));
  return '';
});
// Run the app after the #root element exists.
html = html.replace('</body>', scripts.map(s => `<script type="module">\n${s}\n</script>`).join('\n') + '\n</body>');

writeFileSync(join(root, 'Open Prototype.html'), html);
console.log(`Wrote Open Prototype.html (${Math.round(html.length / 1024)} KB)`);
