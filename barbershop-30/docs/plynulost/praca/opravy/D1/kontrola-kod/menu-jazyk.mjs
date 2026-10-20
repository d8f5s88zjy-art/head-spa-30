// Kontrola kódu D1: otvorenie menu na telefóne skôr, než sa načítajú jazyky (i18n.js sa po D1 na dotyku načíta až
// vo voľnej chvíli alebo pri otvorení menu). Meria, kedy sa v menu objaví prepínač jazyka (.lang), či posunie
// položky menu (poloha odkazu „Prehliadka“) a posuny rozloženia (layout-shift aj s hadRecentInput).
//   node menu-jazyk.mjs --base=http://127.0.0.1:8400/barbershop-30/ --meno=po [--tah=1] [--cakaj=1400] [--cpu=4]
import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.length ? v.join('=') : true]; }));
const BASE = opt.base || 'http://127.0.0.1:8400/barbershop-30/';
const OUT = new URL('./menu-jazyk/', import.meta.url).pathname; fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: 'sk-SK' });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await cdp.send('Network.enable');
const NET = opt.net === 'slow4g' ? { offline: false, latency: 562.5, downloadThroughput: 1.6e6 / 8 * 0.9, uploadThroughput: 750e3 / 8 * 0.9 } : { offline: false, latency: 165, downloadThroughput: 9e6 / 8 * 0.9, uploadThroughput: 1.5e6 / 8 * 0.9 };
await cdp.send('Network.emulateNetworkConditions', NET);
await page.addInitScript(() => {
  window.__k = { ls: [], lang: null };
  new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__k.ls.push({ t: Math.round(e.startTime), v: +e.value.toFixed(4), rec: e.hadRecentInput, src: (e.sources || []).map((s) => s.node ? (s.node.nodeName + '.' + (s.node.className || '')).slice(0, 50) : '?') }); }).observe({ type: 'layout-shift', buffered: true });
  const f = () => { const n = document.querySelector('#nav .lang'); if (n && !window.__k.lang) window.__k.lang = Math.round(performance.now()); if (!window.__k.lang) requestAnimationFrame(f); };
  requestAnimationFrame(f);
});
const reqs = [];
page.on('request', (r) => { if (/i18n\.(js|css)/.test(r.url())) reqs.push({ u: r.url().split('/').pop(), t: Date.now() }); });
await page.goto(BASE + '?uvod=off&hudba=off', { waitUntil: 'load', timeout: 180000 });
if (opt.cpu) await cdp.send('Emulation.setCPUThrottlingRate', { rate: Number(opt.cpu) });
const tLoad = Date.now();
await sleep(800);
// jeden krátky ťah prstom (pred D1 by načítal jazyky pri touchstart)
if (opt.tah !== '0') {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: 600 }] });
  for (let k = 1; k <= 12; k++) { await sleep(16); await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 195, y: 600 - k * 25 }] }); }
  await sleep(100); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}
await sleep(Number(opt.cakaj || 1400));
// ťuknutie na tlačidlo menu
const tb = await page.evaluate(() => { const r = document.querySelector('.nav-toggle').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
const pred = await page.evaluate(() => ({ lang: !!document.querySelector('#nav .lang'), t: Math.round(performance.now()) }));
await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: tb.x, y: tb.y }] });
await sleep(40);
await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
const tTap = Date.now();
await sleep(150);
const a1 = await page.evaluate(() => { const a = document.querySelector('#nav a[href="#vstup-dnu"]').getBoundingClientRect(); return { top: Math.round(a.top), t: Math.round(performance.now()), open: document.querySelector('.site-header').dataset.menu, focus: document.activeElement && (document.activeElement.textContent || '').trim().slice(0, 20) }; });
await page.screenshot({ path: `${OUT}${opt.meno}-150ms.png` });
await sleep(2500);
const a2 = await page.evaluate(() => { const a = document.querySelector('#nav a[href="#vstup-dnu"]').getBoundingClientRect(); return { top: Math.round(a.top), t: Math.round(performance.now()), lang: !!document.querySelector('#nav .lang'), focus: document.activeElement && (document.activeElement.textContent || '').trim().slice(0, 20) }; });
await page.screenshot({ path: `${OUT}${opt.meno}-2650ms.png` });
const k = await page.evaluate(() => window.__k);
const res = { meno: opt.meno, base: BASE, jazyky_pred_menu: pred.lang, lang_v_menu_t: k.lang, tap_t: pred.t, lang_po_tuknuti_ms: k.lang && k.lang > pred.t ? k.lang - pred.t : null,
  odkaz_prehliadka_top_150ms: a1.top, odkaz_prehliadka_top_2650ms: a2.top, posun_px: a2.top - a1.top, menu: a1.open, fokus: [a1.focus, a2.focus],
  layout_shift: k.ls.filter((e) => e.t >= pred.t - 50), i18n_poziadavky: reqs.map((r) => ({ u: r.u, od_nacitania_ms: r.t - tLoad, od_tuknutia_ms: r.t - tTap })) };
fs.writeFileSync(`${OUT}${opt.meno}.json`, JSON.stringify(res, null, 1));
console.log(JSON.stringify(res));
await browser.close();
