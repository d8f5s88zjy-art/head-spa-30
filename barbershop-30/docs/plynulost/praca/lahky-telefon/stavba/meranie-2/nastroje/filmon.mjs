// Diagnostika: ?film=on na telefóne (390×844 @3, dotyk), PRED aj PO, bez emulácie siete/CPU: triedy v čase, 404, chyby konzoly.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
for (const [lab, port, q] of [['pred', 8600, '?film=on'], ['po', 8604, '?film=on'], ['po-uvod-off', 8604, '?film=on&uvod=off']]) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const p = await ctx.newPage(); const err = []; const bad = []; const film = [];
  p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') err.push(m.text().slice(0, 160)); });
  p.on('pageerror', (e) => err.push('pageerror ' + String(e).slice(0, 160)));
  p.on('response', (r) => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url().replace(/^.*?\/barbershop-30\//, '')); if (/film\.js|three|depth|\.bin/.test(r.url())) film.push(r.url().replace(/^https?:\/\/[^/]+/, '')); });
  await p.goto(`http://127.0.0.1:${port}/barbershop-30/${q}`, { waitUntil: 'load' });
  const cls = [];
  for (let i = 0; i < 16; i++) { cls.push((await p.evaluate(() => document.documentElement.className)).replace('karty ', '')); if (i === 4) await p.touchscreen.tap(30, 450); await p.waitForTimeout(1000); }
  console.log(lab, JSON.stringify({ cls: [...new Set(cls)], canvas: await p.evaluate(() => !!document.querySelector('canvas.film-canvas')), bad, err: err.slice(0, 6), film: film.slice(0, 6) }));
  await ctx.close();
}
await b.close();
