/* Zmenšenie štýlu a skriptov pre web.
   Zdroj je vždy assets/style.css, assets/app.js a assets/i18n.js.
   Súbory *.min.* sú len výstup, nikdy sa neupravujú ručne.
   Spustenie:  node tools/build.mjs       (potrebuje esbuild)
   Po každej zmene CSS alebo JS treba build spustiť znova. */
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const esbuild = process.env.ESBUILD || 'esbuild';
const jobs = [
  ['assets/style.css', 'assets/style.min.css'],
  ['assets/app.js', 'assets/app.min.js'],
  ['assets/i18n.js', 'assets/i18n.min.js'],
  ['assets/premium-v9.css', 'assets/premium-v9.min.css'],
  ['assets/premium-v9.js', 'assets/premium-v9.min.js'],
];

for (const [src, out] of jobs) {
  const code = execFileSync(esbuild, [join(root, src), '--minify', '--charset=utf8'], { encoding: 'utf8' });
  writeFileSync(join(root, out), code);
  const a = statSync(join(root, src)).size, b = statSync(join(root, out)).size;
  console.log(`${src} ${a} B  ->  ${out} ${b} B  (${Math.round((1 - b / a) * 100)} % menej)`);
}
