#!/usr/bin/env node
// Skok z menu vo filme (?film=on, telefón): čas od skoku po prvý nakreslený snímok cieľového záberu a čo medzi tým
// robí film. Každých 50 ms zapíše stav BS30_FILM.state a počet vlastných requestAnimationFrame (či stránka vôbec kreslí).
//   node skok-film.mjs [--cpu=1] [--dpr=1] [--net=fast4g|slow4g|none] [--ciel=#sluzby] [--cache=cold|warm] [--port=8400]
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const CPU = Number(arg('cpu', 1)), DPR = Number(arg('dpr', 1)), NET = arg('net', 'fast4g'), CIEL = arg('ciel', '#sluzby'), PORT = arg('port', '8400'), CACHE = arg('cache', 'cold');
const NETS = { none: null, fast4g: { offline: false, latency: 165, downloadThroughput: 1012500, uploadThroughput: 168750 }, slow4g: { offline: false, latency: 562.5, downloadThroughput: 180000, uploadThroughput: 84375 } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: DPR, isMobile: true, hasTouch: true });
const p = await ctx.newPage(); const c = await ctx.newCDPSession(p);
await c.send('Network.enable');
const URL0 = `http://127.0.0.1:${PORT}/barbershop-30/?film=on&uvod=off`;
if (CACHE === 'warm') { await p.goto(URL0, { waitUntil: 'load' }); await p.touchscreen.tap(200, 400); await sleep(3000); const H = await p.evaluate(() => document.documentElement.scrollHeight); for (let y = 0; y < H; y += 500) { await p.evaluate((yy) => scrollTo(0, yy), y); await sleep(250); } await p.evaluate(() => scrollTo(0, 0)); await sleep(1500); }
if (NETS[NET]) await c.send('Network.emulateNetworkConditions', NETS[NET]);
if (CPU > 1) await c.send('Emulation.setCPUThrottlingRate', { rate: CPU });
await p.goto(URL0, { waitUntil: 'load' });
await p.touchscreen.tap(200, 300);                         // pohyb: film štartuje
const ok = await p.evaluate(() => Promise.race([window.BS30_FILM.ready, new Promise((r) => setTimeout(() => r('timeout'), 30000))]));
await sleep(4000);
await p.evaluate(() => { window.__raf = 0; const f = () => { window.__raf++; requestAnimationFrame(f); }; requestAnimationFrame(f); });
const t0 = Date.now();
await p.evaluate((h) => { location.hash = h; }, CIEL);        // to isté ako odkaz v menu (plynulý skrol z CSS)
const rows = [];
for (let k = 0; k < 200; k++) {
  const s = await p.evaluate(() => { const st = window.BS30_FILM.state; return { y: Math.round(scrollY), S: +st.S.toFixed(2), T: +st.T.toFixed(2), cur: st.current, ready: st.ready.map((r) => (r.ready ? 1 : 0) + (r.loading ? 2 : 0)).join(''), frames: st.frames, raf: window.__raf, mix: +(+st.mix).toFixed(2) }; });
  rows.push([Date.now() - t0, s]);
  const idx = s.cur ? 1 : 0;
  if (k > 10 && rows.length > 30 && rows.slice(-25).every((r) => r[1].frames === s.frames)) break;
  await sleep(50);
}
let prev = '';
for (const [t, s] of rows) { const key = JSON.stringify([s.cur, s.ready, s.frames > 0 ? 'f' : '', Math.round(s.S)]); if (key !== prev) console.log(t, JSON.stringify(s)); prev = key; }
console.log('posledný', JSON.stringify(rows[rows.length - 1]));
console.log('nastavenie', { CPU, DPR, NET, CIEL, CACHE, filmReady: ok });
await b.close();
