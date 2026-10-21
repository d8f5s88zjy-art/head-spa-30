// Brána lite/film: triedy <html>, WebGL kontexty a požiadavky filmu pre zariadenia a parametre.
import fs from 'node:fs';
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const [port, OUT] = process.argv.slice(2);
const P = [
  ['pc-1440', { viewport: { width: 1440, height: 900 } }, ''], ['pc-600', { viewport: { width: 600, height: 900 } }, ''],
  ['tel-390', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }, ''],
  ['tel-430', { viewport: { width: 430, height: 932 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }, ''],
  ['tel-390-filmon', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }, '?film=on'],
  ['tel-430-filmon', { viewport: { width: 430, height: 932 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }, '?film=on'],
  ['tel-390-rm', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, reducedMotion: 'reduce' }, ''],
];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const res = [];
for (const [n, o, q] of P) {
  const ctx = await browser.newContext({ colorScheme: 'dark', ...o });
  await ctx.addInitScript(`(() => { const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (k, ...a) { const c = g.call(this, k, ...a); if (c && /webgl/.test(k)) window.__gl = (window.__gl || 0) + 1; return c; }; })();`);
  const page = await ctx.newPage(); const req = []; page.on('request', (r) => req.push(r.url()));
  await page.goto(`http://127.0.0.1:${port}/barbershop-30/${q}`, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => document.documentElement.classList.contains('world-in'), null, { timeout: q ? 30000 : 4000 }).catch(() => {});
  await page.waitForTimeout(1500);
  const r = await page.evaluate(() => ({ cls: document.documentElement.className, motion: document.documentElement.dataset.motion || null, gl: window.__gl || 0,
    hover: matchMedia('(hover: none)').matches, coarse: matchMedia('(pointer: coarse)').matches }));
  r.film = req.filter((u) => /three|film\.js|film-worker|\/seq\/|hlbka/.test(u)).length;
  res.push({ n, q, ...r }); console.log(n, q, JSON.stringify(r));
  await ctx.close();
}
fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
await browser.close();
