// Tlačové PDF: A6 na šírku (148 × 105 mm) so spadávkou 3 mm, teda 154 × 111 mm
import fs from 'node:fs';
import path from 'node:path';
import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const ROOT = path.dirname(new URL(import.meta.url).pathname);
const ids = JSON.parse(fs.readFileSync(path.join(ROOT, 'varianty.json'), 'utf8'));
const out = path.join(ROOT, 'tlac'); fs.mkdirSync(out, { recursive: true });

const src = fs.readFileSync(path.join(ROOT, 'poukaz.html'), 'utf8');
const cards = src.split('\n').join('\n');
const page = (inner) => `<div class="page">${inner}</div>`;
// vytiahni jednotlivé karty z poukaz.html
const bodies = [...cards.matchAll(/<div class="card[^"]*" id="([^"]+)">[\s\S]*?\n<\/div>/g)];
const printCss = `
@page{size:154mm 111mm;margin:0}
html,body{margin:0;padding:0;background:#fff}
.page{width:154mm;height:111mm;overflow:hidden;position:relative;page-break-after:always;display:flex;align-items:center;justify-content:center}
.page .card{transform:scale(.33831);transform-origin:center center;flex:0 0 auto}
body{display:block;gap:0;padding:0;background:#fff}
`;
const mk = (list) => `<!doctype html><html lang="sk"><head><meta charset="utf-8">
<link rel="stylesheet" href="poukaz.css"><style>${printCss}</style></head><body>
${list.map((m) => page(m[0])).join('\n')}</body></html>`;

const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--allow-file-access-from-files'] });
const p = await b.newPage();
const byId = Object.fromEntries(bodies.map((m) => [m[1], m]));
const backM = byId['back'];

async function pdf(list, file) {
  fs.writeFileSync(path.join(ROOT, '_print.html'), mk(list));
  await p.goto('file://' + path.join(ROOT, '_print.html'), { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(200);
  await p.pdf({ path: path.join(out, file), width: '154mm', height: '111mm', printBackground: true, pageRanges: '' });
}
for (const id of ids) await pdf([byId['front-' + id], backM], `poukaz-${id}.pdf`);
await pdf([...ids.map((i) => byId['front-' + i]), backM], 'poukaz-vsetky.pdf');
fs.unlinkSync(path.join(ROOT, '_print.html'));
await b.close();
console.log('PDF hotové:', fs.readdirSync(out).join(', '));
