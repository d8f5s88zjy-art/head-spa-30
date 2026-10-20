// Kontrola kódu D1: trieda skrol na <html> (pozastavenie nekonečných animácií) – nastaví sa počas skrolu a vždy sa
// zruší po jeho konci (ťah, švih, skok z menu, okamžitý skok, koliesko na počítači, skrytá karta). Pri skoku z menu
// na Kontakt navyše posuny rozloženia (tabuľa hodín sa po D1 vypĺňa až pri priblížení) a stav tabule.
//   node skrol-trieda.mjs --base=http://127.0.0.1:8400/barbershop-30/ --meno=po
import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.length ? v.join('=') : true]; }));
const BASE = opt.base;
const OUT = new URL('./skrol-trieda/', import.meta.url).pathname; fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ headless: true });
const res = { meno: opt.meno };
const init = () => {
  window.__k = { ls: [], skrolZmeny: 0 };
  new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__k.ls.push({ t: Math.round(e.startTime), v: +e.value.toFixed(4), rec: e.hadRecentInput, src: (e.sources || []).map((s) => s.node ? (s.node.nodeName + '.' + (s.node.className || '')).slice(0, 50) : '?') }); }).observe({ type: 'layout-shift', buffered: true });
  addEventListener('DOMContentLoaded', () => new MutationObserver(() => { window.__k.skrolZmeny++; }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] }));
};
const stav = (page) => page.evaluate(() => ({ skrol: document.documentElement.classList.contains('skrol'), y: Math.round(scrollY),
  lesk: (() => { const b = [...document.querySelectorAll('.btn-primary')].find((x) => { const r = x.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; }); return b ? getComputedStyle(b, '::after').animationPlayState : '-'; })() }));

// --- telefón: ťah, švihy, okamžitý skok, skok z menu na Kontakt
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: 'sk-SK' });
  const page = await ctx.newPage(); await page.addInitScript(init);
  const cdp = await ctx.newCDPSession(page);
  await page.goto(BASE + '?uvod=off&hudba=off', { waitUntil: 'load' });
  await sleep(1500);
  const swipe = async (dy, fling) => {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: dy > 0 ? 700 : 150 }] });
    const steps = fling ? 6 : 20;
    for (let k = 1; k <= steps; k++) { await sleep(16); await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 195, y: Math.round((dy > 0 ? 700 : 150) - dy * k / steps) }] }); }
    if (!fling) await sleep(120);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  };
  // počas ťahu
  const t = swipe(500, false); await sleep(150); const pocas = await stav(page); await t;
  await sleep(400); const po1 = await stav(page);
  for (let i = 0; i < 5; i++) { await swipe(550, true); await sleep(90); }
  const pocasSvih = await stav(page);
  await sleep(1800); const po2 = await stav(page);
  await page.evaluate(() => window.scrollTo({ top: 3000, behavior: 'instant' })); await sleep(400); const po3 = await stav(page);
  // skok z menu na Kontakt
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await sleep(800);
  await page.evaluate(() => { window.__k.ls = []; window.__k.t0 = performance.now(); });
  await page.tap('.nav-toggle'); await sleep(500);
  await page.tap('#nav a[href="#kontakt"]');
  const flapStav = [];
  for (let i = 0; i < 12; i++) { await sleep(250); flapStav.push(await page.evaluate(() => { const f = document.querySelector('[data-flap]'); const r = f.getBoundingClientRect(); return { t: Math.round(performance.now() - window.__k.t0), y: Math.round(scrollY), flapTop: Math.round(r.top), b: f.querySelectorAll('.flap-cells b').length, h: Math.round(r.height), skrol: document.documentElement.classList.contains('skrol') }; })); }
  await sleep(1500);
  const po4 = await stav(page);
  await page.screenshot({ path: `${OUT}${opt.meno}-kontakt.png` });
  // skrytá karta počas skrolu: trieda sa zruší aj tak
  const t2 = swipe(-400, false); await sleep(100);
  await cdp.send('Emulation.setFocusEmulationEnabled', { enabled: false }).catch(() => {});
  await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); document.dispatchEvent(new Event('visibilitychange')); });
  await t2; await sleep(600);
  const poSkryti = await stav(page);
  await page.evaluate(() => { delete document.visibilityState; document.dispatchEvent(new Event('visibilitychange')); });
  await sleep(600);
  const poNavrate = await stav(page);
  const k = await page.evaluate(() => window.__k);
  res.telefon = { pocas_tahu: pocas, po_tahu_400ms: po1, pocas_svihov: pocasSvih, po_svihoch_1800ms: po2, po_okamzitom_skoku: po3, po_skoku_z_menu: po4, tabula: flapStav,
    posuny_pri_skoku: k.ls, zmeny_triedy_html: k.skrolZmeny, skryta_karta: poSkryti, po_navrate: poNavrate };
  await ctx.close();
}
// --- počítač: koliesko
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, locale: 'sk-SK' });
  const page = await ctx.newPage(); await page.addInitScript(init);
  await page.goto(BASE + '?uvod=off&hudba=off', { waitUntil: 'load' });
  await sleep(1500);
  await page.mouse.move(700, 450);
  for (let i = 0; i < 8; i++) { await page.mouse.wheel(0, 240); await sleep(60); }
  const pocas = await stav(page);
  await sleep(700); const po = await stav(page);
  res.pocitac = { pocas_kolieska: pocas, po_koliesku_700ms: po };
  await ctx.close();
}
fs.writeFileSync(`${OUT}${opt.meno}.json`, JSON.stringify(res, null, 1));
console.log(JSON.stringify(res, null, 1));
await browser.close();
