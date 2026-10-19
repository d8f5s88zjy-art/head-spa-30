#!/usr/bin/env node
/* Správa pamäte: koľko ImageBitmap film vytvorí a koľko z nich nikdy nezavrie (close) pri rýchlych švihoch
   hore a dole (zrušené načítania, film.js:517-518 Promise.all bez close pri chybe/zrušení).
   node bitmapy.mjs [--cpu=4] [--port=8248] [--svihov=12] [--out=bitmapy.json] */
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.length ? v.join('=') : '1']; }));
const PORT = opt.port || 8248, CPU = Number(opt.cpu || 4), N = Number(opt.svihov || 12);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
await ctx.addInitScript(() => {
  const B = window.__BM = { vytvorene: 0, zavrete: 0, otvorene: new Set(), mb: 0, maxMb: 0 };
  const cib = window.createImageBitmap;
  window.createImageBitmap = function () {
    return cib.apply(this, arguments).then((b) => {
      B.vytvorene++; B.otvorene.add(b); B.mb += b.width * b.height * 4 / 1e6; B.maxMb = Math.max(B.maxMb, B.mb);
      b.__st = new Error().stack.split('\n').slice(2, 4).join(' | ').replace(/https?:\/\/[^)]*\//g, '');
      return b;
    });
  };
  const cl = ImageBitmap.prototype.close;
  ImageBitmap.prototype.close = function () { if (B.otvorene.has(this)) { B.otvorene.delete(this); B.zavrete++; B.mb -= this.width * this.height * 4 / 1e6; } return cl.apply(this, arguments); };
});
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 165, downloadThroughput: 1012500, uploadThroughput: 168750, connectionType: 'cellular4g' });
await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
await page.goto(`http://127.0.0.1:${PORT}/barbershop-30/?film=on&uvod=off`, { waitUntil: 'load' });
await sleep(2500);
const swipe = async (dist, ms) => {
  const y0 = dist > 0 ? 760 : 120;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: y0 }] });
  const t0 = Date.now(); for (;;) { const e = Math.min(1, (Date.now() - t0) / ms); await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 195, y: y0 - dist * e }] }); if (e >= 1) break; await sleep(8); }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
};
await swipe(200, 300); await sleep(6000);
// rýchle švihy: 3 dole, 3 hore, dookola
for (let i = 0; i < N; i++) { const dole = Math.floor(i / 3) % 2 === 0; await swipe(dole ? 600 : -600, 80); await sleep(700); }
await sleep(8000);
const r1 = await page.evaluate(() => { const B = window.__BM; const z = {}; for (const b of B.otvorene) { const k = `${b.width}x${b.height} ${b.width ? '' : '(zavretá inak)'}`; z[k] = (z[k] || 0) + 1; } return { vytvorene: B.vytvorene, zavrete: B.zavrete, otvorene: B.otvorene.size, otvoreneMB: +B.mb.toFixed(1), maxMB: +B.maxMb.toFixed(1), podlaRozmeru: z, zdroje: [...new Set([...B.otvorene].map((b) => b.__st))].slice(0, 6), film: window.BS30_FILM.state.ready.filter((x) => x.ready || x.loading).map((x) => x.shot + (x.loading ? '(načítava)' : '')) }; });
console.log(JSON.stringify(r1, null, 1));
if (opt.out) fs.writeFileSync(opt.out, JSON.stringify(r1, null, 1));
await browser.close();
