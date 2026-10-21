// N3: tempo preklápania tabule – časy zmien textu políčok (MutationObserver), pred 8402 vs po 8400. Desktop, CPU 1x
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const browser = await chromium.launch({ args: ['--no-sandbox'] });
for (const port of [8402, 8400, 8402, 8400]) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' });
  const page = await ctx.newPage();
  await page.goto(`http://127.0.0.1:${port}/barbershop-30/index.html?uvod=off&hudba=off&film=off`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__renderDone !== false);
  await page.addStyleTag({ content: 'html{scroll-behavior:auto !important}' });
  // pred pozorovaním: pred D1 beží preklápanie pri 60 % viditeľnosti, po D1 tiež; pozorovateľ sa pripojí k .flap-cells (po D1 sa políčka vytvoria až pri priblížení)
  await page.evaluate(() => { window.__mut = []; const c = document.querySelector('.flap-cells'); new MutationObserver((l) => { const t = performance.now(); for (const m of l) { if (m.type === 'characterData') window.__mut.push({ t, i: [...c.children].indexOf(m.target.parentNode) }); } }).observe(c, { subtree: true, characterData: true, childList: false }); });
  await page.evaluate(() => document.querySelector('.flap').scrollIntoView({ block: 'center', behavior: 'instant' }));
  await page.waitForTimeout(4500);
  const r = await page.evaluate(() => { const m = window.__mut; const by = {}; m.forEach((x) => (by[x.i] = by[x.i] || []).push(x.t)); const med = (a) => a.sort((x, y) => x - y)[Math.floor(a.length / 2)]; const iv = []; Object.values(by).forEach((ts) => { for (let k = 1; k < ts.length; k++) iv.push(ts[k] - ts[k - 1]); }); const ends = Object.values(by).map((ts) => ts[ts.length - 1]); const starts = Object.values(by).map((ts) => ts[0]); return { zmien: m.length, poli: Object.keys(by).length, medianKrok: iv.length ? +med(iv).toFixed(1) : null, celkomMs: ends.length ? Math.round(Math.max(...ends) - Math.min(...starts)) : null }; });
  console.log(port, JSON.stringify(r));
  await ctx.close();
}
await browser.close();
