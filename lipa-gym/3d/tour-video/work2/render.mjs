// Vykreslí compose.html snímku po snímke (render(t) je čistá funkcia času) do out/NNNN.jpg.
// node render.mjs [od] [do] [zoznam snímok oddelených čiarkou]
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const story = JSON.parse(fs.readFileSync('story.json', 'utf8'));
const FPS = 30, N = Math.round(story.dur * FPS);
const from = +(process.argv[2] || 0), to = +(process.argv[3] || N), list = process.argv[4] ? process.argv[4].split(',').map(Number) : null;
fs.mkdirSync('out', { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
await p.addInitScript(s => { window.STORY = s; }, story);
await p.goto('http://localhost:8765/lipa-gym/3d/tour-video/work2/compose.html');
await p.evaluate(() => window.ready);
for (const f of list || Array.from({ length: to - from }, (_, i) => from + i)) {
  await p.evaluate(async t => { window.render(t); await Promise.all([...document.querySelectorAll('#L0 img')].map(i => i.decode().catch(() => {}))); }, f / FPS);
  await p.screenshot({ path: `out/${String(f).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 95 });
  if (f % 90 === 0) console.log('snímka', f, '/', N);
}
await b.close();
