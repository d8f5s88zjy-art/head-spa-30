#!/usr/bin/env node
/* Overenie KF-04: koľko snímok film nakreslí v pokoji (bez vstupu) a čo ho to stojí na hlavnom vlákne.
   Po prvom dotyku a načítaní: 4 s čakanie, potom 10 s bez vstupu; počíta sa callback 'frame' a kreslenie na obrazovku.
   Navyše 2 snímky obrazovky 1 s od seba: rozdiel pixelov (pohyb obrazu v pokoji).
   node over-pokoj.mjs --port=8433 --cpu=1 */
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const here = path.dirname(new URL(import.meta.url).pathname);
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.length ? v.join('=') : '1']; }));
const PORT = opt.port || 8433, CPU = Number(opt.cpu || 1);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36' });
await ctx.addInitScript({ path: path.join(here, 'sonda.js') });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
await page.goto(`http://127.0.0.1:${PORT}/barbershop-30/?film=on&uvod=off`, { waitUntil: 'load', timeout: 120000 });
await sleep(2500);
await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: 700 }] });
for (let i = 1; i <= 10; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 195, y: 700 - 16 * i }] }); await sleep(20); }
await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
for (let i = 0; i < 120; i++) { if (await page.evaluate(() => window.BS30_FILM.state.shown)) break; await sleep(250); }
// počkať, kým sa dotiahnu susedia (nahrávanie by kreslenie vysvetľovalo)
for (let i = 0; i < 120; i++) { const s = await page.evaluate(() => { const s = window.BS30_FILM.state; return s.ready.filter((r) => r.loading).length; }); if (!s) break; await sleep(250); }
await sleep(4000);
const od = await page.evaluate(() => performance.now());
// raf mimo filmu: počet snímok prehliadača v tom istom okne (na porovnanie)
await page.evaluate(() => { window.__raf = 0; const f = () => { window.__raf++; requestAnimationFrame(f); }; requestAnimationFrame(f); });
await sleep(10000);
const po = await page.evaluate(() => performance.now());
const r = await page.evaluate(([od, po]) => {
  const fr = window.__OV.fr.filter((f) => f.ts >= od && f.ts <= po);
  const js = fr.map((f) => f.js).sort((a, b) => a - b);
  const s = window.BS30_FILM.state;
  return { snimokFilmu: fr.length, kresleni: fr.filter((f) => f.draw > 0).length, rafStranky: window.__raf, jsMedian: +js[Math.floor(js.length / 2)].toFixed(2), jsP95: +js[Math.floor(js.length * 0.95)].toFixed(2), jsSpolu: +js.reduce((a, b) => a + b, 0).toFixed(1), stav: { S: s.S, cur: s.current, loading: s.ready.filter((r) => r.loading).map((r) => r.shot), mix: s.mix, dpr: s.dpr } };
}, [od, po]);
await page.screenshot({ path: path.join(here, `pokoj-a-cpu${CPU}.png`), scale: 'css' });
await sleep(1000);
await page.screenshot({ path: path.join(here, `pokoj-b-cpu${CPU}.png`), scale: 'css' });
const vys = { CPU, okno_ms: Math.round(po - od), ...r };
fs.writeFileSync(path.join(here, `pokoj-cpu${CPU}.json`), JSON.stringify(vys, null, 1));
console.log(JSON.stringify(vys));
await browser.close();
