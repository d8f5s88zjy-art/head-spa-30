// Pasívna sonda (bez decode()): telefón 390×844 @3, pomalá sieť, skok na kartu pred load a švih cez stránku.
// node skok.mjs <port> <hash|scroll> ; vypíše porušenia: viditeľná záloha s nestiahnutou fotkou, snímky bez fotky (ink), max. zobrazených záloh
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const [port, mode = 'hash'] = process.argv.slice(2);
const base = `http://127.0.0.1:${port}/barbershop-30/`;
const SONDA = `(() => { const r = window.__sonda = { snimky: 0, nestiahnuta: 0, nestiahnutaIna: 0, inkPoUvode: 0, ink: 0, maxZobr: 0, pred: [] };
  const krok = () => { if (document.querySelector('.film-shot')) {
    const st = [...document.querySelectorAll('.film-shot.is-title .film-still')]; let vid = 0, hot = 0, zobr = 0;
    for (const s of st) { const cs = getComputedStyle(s); if (cs.display === 'none') continue; zobr++;
      if (cs.visibility !== 'visible' || +cs.opacity <= 0.01) continue; vid++; const i = s.querySelector('img');
      if (!(i && i.complete && i.naturalWidth > 0)) { r.nestiahnuta++; if (!s.closest('[data-pro]')) r.nestiahnutaIna++; if (r.pred.length < 5) r.pred.push(s.closest('.film-shot').dataset.shot + '@' + Math.round(performance.now())); } else if (+cs.opacity > 0.99) hot++; }
    const kryte = [0.2, 0.5, 0.8].every((f) => { const el = document.elementFromPoint(innerWidth / 2, innerHeight * f); return el && el.closest('.band, .site-footer'); });
    r.snimky++; if (!hot && !kryte) { r.ink++; const u = document.querySelector('#uvod .film-still img'); if (u && u.complete && u.naturalWidth > 0) r.inkPoUvode++; } r.maxZobr = Math.max(r.maxZobr, zobr); }
    requestAnimationFrame(krok); };
  requestAnimationFrame(krok); })();`;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: 'dark' });
await ctx.addInitScript(SONDA);
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await cdp.send('Network.enable');
// pomalá sieť (približne Slow 4G: 562,5 ms, 180 kB/s)
await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 562.5, downloadThroughput: 180000, uploadThroughput: 84000 });
const t0 = Date.now();
if (mode === 'hash') {
  await page.goto(base + '#sluzby', { waitUntil: 'commit' });
} else {
  await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(1500);
  // švih pred load: skok o niekoľko kariet
  for (let k = 0; k < 6; k++) { await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollBy(0, innerHeight * 0.9); }); await page.waitForTimeout(250); }
}
const loadTime = await page.evaluate(() => new Promise((r) => { if (document.readyState === 'complete') r('uz'); else addEventListener('load', () => r(Math.round(performance.now())), { once: true }); })).catch(() => null);
await page.waitForTimeout(4000);
const r = await page.evaluate(() => ({ ...window.__sonda, cls: document.documentElement.className, near: [...document.querySelectorAll('.film-shot.is-near')].map((e) => e.dataset.shot),
  y: Math.round(scrollY), stav: [...document.querySelectorAll('.film-shot.is-title .film-still')].map((s) => { const cs = getComputedStyle(s), i = s.querySelector('img');
    return cs.display === 'none' ? null : [s.closest('.film-shot').dataset.shot, cs.visibility, (+cs.opacity).toFixed(2), s.style.getPropertyValue('--so'), i.complete, i.naturalWidth, (i.currentSrc || '').split('/').pop()]; }).filter(Boolean) }));
console.log(JSON.stringify({ mode, load: loadTime, ms: Date.now() - t0, ...r }));
await browser.close();
