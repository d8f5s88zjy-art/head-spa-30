#!/usr/bin/env node
/* Odovzdanie zo statickej zálohy do filmu (html.world-in): v každej snímke sa vzorkuje vypočítaná opacity
   zálohy úvodu (.film-still nad plátnom, style.css:498-501 / 1105-1108, 0,7 s) a plátna (.film-canvas pod stránkou,
   style.css:412-418, 1,2 s). Podiel viditeľného obrazu = záloha + plátno × (1 − záloha); zvyšok je pozadie --ink.
   node odovzdanie.mjs [--cpu=1] [--port=8248] [--dev=phone|desk] */
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.length ? v.join('=') : '1']; }));
const PORT = opt.port || 8248, CPU = Number(opt.cpu || 1), DEV = opt.dev || 'phone';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext(DEV === 'phone' ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true } : { viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => {
  const S = window.__OD = [];
  const mo = new MutationObserver(() => {
    if (!document.documentElement || !document.documentElement.classList.contains('world-in') || S.t0) return;
    S.t0 = performance.now();
    const still = [...document.querySelectorAll('#uvod .film-still')].find((e) => getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility !== 'hidden') || document.querySelector('#uvod .film-still');
    const cv = document.querySelector('canvas.film-canvas');
    const tick = (t) => {
      const so = +getComputedStyle(still).opacity, sv = getComputedStyle(still).visibility, co = +getComputedStyle(cv).opacity;
      const s = sv === 'hidden' ? 0 : so;
      S.push([+(t - S.t0).toFixed(0), +s.toFixed(2), +co.toFixed(2), +(s + co * (1 - s)).toFixed(2)]);
      if (t - S.t0 < 1500) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  mo.observe(document, { attributes: true, subtree: true, attributeFilter: ['class'] });
});
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
await page.goto(`http://127.0.0.1:${PORT}/barbershop-30/?film=on&uvod=off`, { waitUntil: 'load' });
await sleep(2000);
if (DEV === 'phone') { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: 600 }] }); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); }
else await page.mouse.move(700, 400);
for (let i = 0; i < 60; i++) { const n = await page.evaluate(() => window.__OD.length); if (n && (await page.evaluate(() => performance.now() - window.__OD.t0)) > 1600) break; await sleep(250); }
const s = await page.evaluate(() => window.__OD);
const min = s.reduce((a, r) => (r[3] < a[3] ? r : a), [0, 1, 1, 1]);
const pod60 = s.filter((r) => r[3] < 0.6);
console.log(JSON.stringify({ vzoriek: s.length, minimum: { ms: min[0], zaloha: min[1], platno: min[2], obraz: min[3] }, podiel_pod_60_percent_ms: pod60.length ? [pod60[0][0], pod60[pod60.length - 1][0]] : null, priebeh: s.filter((_, i) => i % 3 === 0) }));
await browser.close();
