import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
await page.goto('http://127.0.0.1:8507/barbershop-30/?film=on&uvod=off', { waitUntil: 'load' });
await page.touchscreen.tap(5, 400);
await page.waitForFunction(() => document.documentElement.classList.contains('world-in'), null, { timeout: 90000 });
const st0 = await page.evaluate(() => { const s = BS30_FILM.state; return { anchors: s.anchors.map(Math.round), shots: s.ready.map((r) => r.shot), cuts: BS30_FILM.cuts }; });
console.log(JSON.stringify(st0));
await page.evaluate(() => scrollTo(0, 1140));
for (let i = 0; i < 12; i++) { await page.waitForTimeout(1000); console.log(JSON.stringify(await page.evaluate(() => { const s = BS30_FILM.state; return { S: s.S.toFixed(4), T: s.T.toFixed(4), mix: s.mix.toFixed(3), cur: s.current, seq: s.seq.map((q) => [q.shot, q.got, q.n, q.lo, q.hi, q.mix]) }; }))); }
await browser.close();
