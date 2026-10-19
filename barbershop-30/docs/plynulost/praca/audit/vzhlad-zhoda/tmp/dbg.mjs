import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
page.on('console', (m) => console.log('console', m.type(), m.text()));
page.on('pageerror', (e) => console.log('err', e.message));
const t0 = Date.now();
await page.goto('http://127.0.0.1:8211/barbershop-30/?film=on&uvod=off', { waitUntil: 'load' });
console.log('load', Date.now() - t0);
await page.waitForTimeout(800);
await page.touchscreen.tap(5, 422);
for (let i = 0; i < 30; i++) {
  await page.waitForTimeout(1000);
  const s = await page.evaluate(() => ({ c: document.documentElement.className, st: window.BS30_FILM && (() => { const s = window.BS30_FILM.state; return { on: s.on, shown: s.shown, frames: s.frames, ready: s.ready && s.ready.map((r) => r.shot + ':' + r.ready + (r.loading ? 'L' : '')).join(' ') }; })() }));
  console.log(i, JSON.stringify(s));
  if (s.c.includes('world-in')) break;
}
await browser.close();
