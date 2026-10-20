// Overenie K08: otvorenie menu na telefóne (390×844 @3, CPU 4×, Fast 4G, ?uvod=off, 4,5 s po load, poloha y=0 a y≈3000).
// Event Timing (trvanie interakcie = INP kandidát, rozklad čakanie/spracovanie/vykreslenie) a LoAF (vynútený štýl a
// rozloženie zo skriptu), základ vs. navrhovaná oprava auditu (menufix: ctaHidden(curY) a focus v rAF), striedavo.
//   node over-menu.mjs [--n=3] [--v=zaklad/menufix/menufix,nolock] [--q=uvod=off&hudba=off]
import { opt, BASE, launch, open, sleep } from './spolocne.mjs';
import { patch } from './zaplaty.mjs';
const N = Number(opt.n || 3);
const VARS = String(opt.v || 'zaklad/menufix').split('/'); // varianty oddelené lomkou, záplaty v nich čiarkou
const Q = opt.q || 'uvod=off';
const browser = await launch();
const rows = [];
for (let i = 0; i < N; i++) for (const v of VARS) for (const y of [0, 3000]) {
  const { page, cdp, ctx } = await open(browser, { cpu: 1, net: 'fast4g' });
  if (v !== 'zaklad') await patch(page, v.split(','));
  await page.addInitScript(() => {
    window.__ev = []; window.__loaf = [];
    try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.interactionId) window.__ev.push({ n: e.name, t: Math.round(e.startTime), d: Math.round(e.duration), wait: Math.round(e.processingStart - e.startTime), proc: Math.round(e.processingEnd - e.processingStart), pres: Math.round(e.startTime + e.duration - e.processingEnd) }); }).observe({ type: 'event', durationThreshold: 16, buffered: true }); } catch (e) {}
    try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__loaf.push({ t: Math.round(e.startTime), d: Math.round(e.duration), s: (e.scripts || []).filter((s) => s.duration > 2).map((s) => `${s.invoker.slice(0, 28)} ${Math.round(s.duration)}/${Math.round(s.forcedStyleAndLayoutDuration)}`) }); }).observe({ type: 'long-animation-frame', buffered: true }); } catch (e) {}
  });
  await page.goto(BASE + '?' + Q, { waitUntil: 'load', timeout: 120000 });
  await sleep(4500);
  if (y) { await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y); await sleep(1500); }
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const t0 = await page.evaluate(() => performance.now());
  await page.tap('.nav-toggle');
  await sleep(1200);
  const m = await page.evaluate((t0) => ({ ev: window.__ev.filter((e) => e.t >= t0), loaf: window.__loaf.filter((e) => e.t >= t0 - 5 && e.d > 30) }), t0);
  const worst = m.ev.sort((a, b) => b.d - a.d)[0] || {};
  rows.push({ v, y, beh: i + 1, INP: worst.d, udalost: worst.n, cakanie: worst.wait, spracovanie: worst.proc, vykreslenie: worst.pres, loaf: m.loaf.map((l) => `${l.d} [${l.s.join(', ')}]`).join(' ; ') });
  await ctx.close();
}
await browser.close();
console.table(rows);
for (const v of VARS) for (const y of [0, 3000]) {
  const r = rows.filter((x) => x.v === v && x.y === y).map((x) => x.INP).sort((a, b) => a - b);
  const p = rows.filter((x) => x.v === v && x.y === y).map((x) => x.spracovanie).sort((a, b) => a - b);
  console.log(`${v} y=${y}: INP medián ${r[r.length >> 1]} (${r.join(', ')}), spracovanie medián ${p[p.length >> 1]} (${p.join(', ')})`);
}
