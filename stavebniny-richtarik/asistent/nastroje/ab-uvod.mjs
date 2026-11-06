/*
 * A/B úvodnej stránky s asistentom (ukážka) a bez neho (?asistent=off), telefón 390×844, DPR 3, CPU 4×, striedavo.
 * Meria LCP, CLS, dlhé snímky (> 50 ms) v okne úvodu 0,6–5,0 s a v okne načítania modulu asistenta, kedy sa stiahol
 * asistent.js a či bola ikona viditeľná počas prvých 4 s.
 * Pred meraním sa obe varianty raz načítajú bez zápisu (rozohriatie). Merajte pri záťaži do 3,5 (uptime).
 * Použitie: node ab-uvod.mjs <adresa …/stavebniny-richtarik/index.html> <výstup.jsonl> [kolá=4]
 */
import { createRequire } from 'node:module';
import { appendFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
const { chromium } = createRequire('/opt/node22/lib/node_modules/')('playwright');
const [URL_UVOD, OUT, K] = process.argv.slice(2);
const KOLA = +(K || 4);
writeFileSync(OUT, '');
const INIT = `(() => {
  const W = window.__ab = { gaps: [], lcp: 0, lcpEl: '', cls: 0, ikona: [] };
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) { W.lcp = e.startTime; W.lcpEl = (e.url || (e.element && e.element.tagName) || '').split('/').pop(); } }).observe({ type: 'largest-contentful-paint', buffered: true }); } catch (e) {}
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) W.cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); } catch (e) {}
  let last = 0;
  const f = (ts) => {
    if (last && ts - last > 50) W.gaps.push([Math.round(last), Math.round(ts - last)]);
    last = ts;
    const b = document.querySelector('.asi-btn');
    if (b && ts < 4000 && parseFloat(getComputedStyle(b).opacity) > 0.01) W.ikona.push(Math.round(ts));
    if (ts < 9000) requestAnimationFrame(f);
  };
  requestAnimationFrame(f);
})();`;
const browser = await chromium.launch();
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : null; };
const vysl = { s: [], bez: [] };
// rozohriatie: obe adresy raz načítať a nezapísať (súbory v pamäti disku), inak prvé kolo meria studený server
for (const v of ['', '?asistent=off']) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(URL_UVOD + v, { waitUntil: 'load' }); await page.waitForTimeout(6500);
  await ctx.close();
}
console.log('záťaž pred:', os.loadavg().map((x) => x.toFixed(2)).join(' '));
for (let k = 0; k < KOLA; k++) {
  for (const v of (k % 2 ? ['bez', 's'] : ['s', 'bez'])) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await page.addInitScript(INIT);
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    let modul = null; const t0 = Date.now();
    page.on('request', (r) => { if (/assets\/asistent\.js/.test(r.url()) && modul === null) modul = Date.now() - t0; });
    await page.goto(URL_UVOD + (v === 'bez' ? '?asistent=off' : ''), { waitUntil: 'load' });
    const nacitane = Date.now() - t0;
    await page.waitForTimeout(8000);
    const w = await page.evaluate(() => window.__ab);
    const vOkne = w.gaps.filter(([t]) => t >= 600 && t <= 5000);
    const r = { kolo: k + 1, v, lcp: Math.round(w.lcp), lcpEl: w.lcpEl, cls: +w.cls.toFixed(4), dlheUvod: vOkne.length, najdlhsiaUvod: Math.max(0, ...vOkne.map((g) => g[1])),
      dlheVsetky: w.gaps.length, najdlhsia: Math.max(0, ...w.gaps.map((g) => g[1])), gaps: w.gaps, nacitane, modul, ikonaDo4s: w.ikona.length, zataz: +os.loadavg()[0].toFixed(2) };
    appendFileSync(OUT, JSON.stringify(r) + '\n');
    console.log(JSON.stringify({ ...r, gaps: undefined }));
    vysl[v].push(r);
    await ctx.close();
  }
}
await browser.close();
for (const v of ['s', 'bez']) {
  const a = vysl[v];
  console.log(`${v === 's' ? 's asistentom   ' : 'bez (?asistent=off)'}: LCP medián ${med(a.map((x) => x.lcp))} ms (${a.map((x) => x.lcp).join('/')}), CLS max ${Math.max(...a.map((x) => x.cls))}, dlhé snímky v okne úvodu ${a.map((x) => x.dlheUvod).join('/')}, najdlhšia ${Math.max(...a.map((x) => x.najdlhsiaUvod))} ms, ikona do 4 s ${a.map((x) => x.ikonaDo4s).join('/')}`);
}
console.log('rozdiel mediánov LCP (s − bez):', med(vysl.s.map((x) => x.lcp)) - med(vysl.bez.map((x) => x.lcp)), 'ms');
console.log('záťaž po:', os.loadavg().map((x) => x.toFixed(2)).join(' '));
