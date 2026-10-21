// T4/K12: trieda skrol na <html> a pauza animácií. Dotykový ťah, skok z menu, rýchly švih. node skrol-trieda.mjs --port=8400
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
import { swipe } from './pom.mjs';
const opt = Object.fromEntries(process.argv.slice(2).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const port = opt.port || 8400;
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: 'dark' });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await page.goto(`http://127.0.0.1:${port}/barbershop-30/index.html?uvod=off&hudba=off&film=off`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__renderDone !== false);
await page.waitForTimeout(800);
const snap = () => page.evaluate(() => { const m = document.querySelector('.marquee-track'); const r = m.getBoundingClientRect(); return { t: Math.round(performance.now()), skrol: document.documentElement.classList.contains('skrol'), play: getComputedStyle(m).animationPlayState, vOkne: r.bottom > 0 && r.top < innerHeight, y: Math.round(scrollY) }; });
await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; document.querySelector('.marquee').scrollIntoView({ block: 'center', behavior: 'instant' }); });
await page.waitForTimeout(700);
const pokoj = await snap();
console.log('POKOJ  ', JSON.stringify(pokoj));
// dotykový ťah 120 px za cca 0,5 s a vzorkovanie
async function gest(nazov, cfg, trvanie = 1800) {
  const vzorky = []; const t0 = Date.now();
  const p = swipe(cdp, cfg);
  while (Date.now() - t0 < trvanie) { vzorky.push({ dt: Date.now() - t0, ...(await snap()) }); await page.waitForTimeout(30); }
  await p;
  const s = vzorky.filter((v) => v.vOkne);
  const prve = s.find((v) => v.skrol), posl = [...s].reverse().find((v) => v.skrol);
  const yy = vzorky.map((v) => v.y); const koniecSkrolu = yy.findIndex((v, i) => i > 0 && yy.slice(i).every((w) => w === v) && yy[0] !== v);
  const zhoda = s.every((v) => (v.skrol ? v.play === 'paused' : v.play === 'running'));
  console.log(nazov.padEnd(26), JSON.stringify({ vzoriek: vzorky.length, vOkne: s.length, skrolPrvy: prve && prve.dt, y0: yy[0], y1: yy[yy.length - 1], skrolPoslednyDt: posl && posl.dt, koniecPohybuDt: koniecSkrolu >= 0 ? vzorky[koniecSkrolu].dt : null, trieda_zostala_po_ms: posl && koniecSkrolu >= 0 ? posl.dt - vzorky[koniecSkrolu].dt : null, playStateSediSTriedou: zhoda, nakoniec: vzorky[vzorky.length - 1].skrol }));
}
await gest('T1 pomalý ťah 80 px', { dy: 80, speed: 200 });
await page.evaluate(() => document.querySelector('.marquee').scrollIntoView({ block: 'center', behavior: 'instant' })); await page.waitForTimeout(600);
await gest('T2 rýchly švih 500 px', { dy: 500, speed: 4000, fling: true }, 2600);
await page.evaluate(() => document.querySelector('.marquee').scrollIntoView({ block: 'center', behavior: 'instant' })); await page.waitForTimeout(600);
// skok z menu na Cenník (hladký skrol)
await page.evaluate(() => { document.documentElement.style.scrollBehavior = ''; });
await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await page.waitForTimeout(500);
await page.tap('.nav-toggle'); await page.waitForTimeout(600);
const vz = []; const t0 = Date.now();
await page.tap('#nav a[href="#kontakt"]');
while (Date.now() - t0 < 4000) { vz.push({ dt: Date.now() - t0, ...(await page.evaluate(() => ({ skrol: document.documentElement.classList.contains('skrol'), y: Math.round(scrollY) }))) }); await page.waitForTimeout(40); }
const kon = vz.findIndex((v, i) => i > 0 && vz.slice(i).every((w) => w.y === v.y));
const posl = [...vz].reverse().find((v) => v.skrol);
console.log('T3 skok z menu'.padEnd(26), JSON.stringify({ y_koniec: vz[vz.length - 1].y, koniecPohybuDt: kon >= 0 ? vz[kon].dt : null, skrolPoslednyDt: posl && posl.dt, zostala_po_ms: posl && kon >= 0 ? posl.dt - vz[kon].dt : null, nakoniec: vz[vz.length - 1].skrol, medzera: vz.filter((v, i) => i > 0 && i < kon && !v.skrol && vz[i - 1].skrol).length }));
// skrytie karty počas skrolu (visibilitychange)
await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await page.waitForTimeout(600);
await swipe(cdp, { dy: 200, speed: 800 });
await page.waitForTimeout(1000);
console.log('T4 po ťahu 1 s  skrol =', await page.evaluate(() => document.documentElement.classList.contains('skrol')));
await browser.close();
