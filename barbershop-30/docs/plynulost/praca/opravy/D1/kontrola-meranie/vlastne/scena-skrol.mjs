// Kontrola D1 (QA): počas dotykového skrolu celou stránkou (telefón 390×844 @3, CPU 4×, Fast 4G, ?uvod=off)
// spočíta zmeny atribútu data-scene-active na <html>, prepnutia triedy skrol, kedy sa načíta i18n.js a atmosfera.js
// (čas od začiatku skrolu, či počas skrolu), AudioContext, a posuny rozloženia (CLS).
//   node scena-skrol.mjs --port=8430|8432 [--meno=x]
import { createRequire } from 'module';
import fs from 'node:fs';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).map((a) => { const [k, ...v] = a.replace(/^--/, '').split('='); return [k, v.join('=') || '1']; }));
const PORT = opt.port || 8432;
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: 'sk-SK',
  userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36' });
await ctx.addInitScript(() => {
  const M = window.__q = { scene: [], skrol: 0, cls: 0, ac: 0 };
  const AC = window.AudioContext; if (AC) window.AudioContext = class extends AC { constructor(...a) { super(...a); M.ac++; } };
  new MutationObserver((l) => { for (const m of l) { if (m.attributeName === 'data-scene-active') M.scene.push([Math.round(performance.now()), document.documentElement.getAttribute('data-scene-active')]); if (m.attributeName === 'class' && (m.oldValue || '').includes('skrol') !== document.documentElement.classList.contains('skrol')) M.skrol++; } })
    .observe(document.documentElement, { attributes: true, attributeOldValue: true, attributeFilter: ['data-scene-active', 'class'] });
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) M.cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); } catch (e) {}
});
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await cdp.send('Network.enable');
await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 165, downloadThroughput: 1012500, uploadThroughput: 168750 });
const req = [];
const T0 = Date.now();
page.on('request', (r) => { const u = r.url(); if (/(i18n|atmosfera)\.(js|css)|Manrope-cyr|audio\//.test(u)) req.push([Date.now() - T0, u.split('/').pop()]); });
await page.goto(`http://127.0.0.1:${PORT}/barbershop-30/?uvod=off`, { waitUntil: 'load' });
const tLoad = Date.now() - T0;
await page.waitForTimeout(1500);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
const tSkrol = Date.now() - T0;
const swipe = async (dy, speed) => {
  const x = 195, y0 = dy > 0 ? 675 : 170, dist = Math.min(Math.abs(dy), 500), steps = Math.max(2, Math.round(dist / speed * 1000 / 16)), s = Math.sign(dy);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: y0 }] });
  for (let k = 1; k <= steps; k++) { await page.waitForTimeout(16); await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: Math.round(y0 - s * dist * k / steps) }] }); }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
};
const H = await page.evaluate(() => document.scrollingElement.scrollHeight - innerHeight);
let y = 0;
while (y < H - 10) { await swipe(500, 1300); await page.waitForTimeout(120); y = await page.evaluate(() => scrollY); }
const tKoniec = Date.now() - T0;
await page.waitForTimeout(6000);
const q = await page.evaluate(() => ({ ...window.__q, attr: document.documentElement.getAttribute('data-scene-active'), aria: [...document.querySelectorAll('[aria-current="true"]')].map((a) => a.textContent.trim().slice(0, 20)), hudba: document.querySelector('.hudba')?.getAttribute('aria-pressed'), skrolTeraz: document.documentElement.classList.contains('skrol') }));
const out = { port: PORT, tLoad, tSkrol, tKoniec, H, ...q, poziadavky: req };
console.log(JSON.stringify(out));
fs.mkdirSync('vysledky', { recursive: true });
fs.writeFileSync(`vysledky/${opt.meno || 'scena-' + PORT}.json`, JSON.stringify(out, null, 1));
await browser.close();
