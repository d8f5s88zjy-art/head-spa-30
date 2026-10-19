import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto('http://127.0.0.1:8507/barbershop-30/?film=on&uvod=off', { waitUntil: 'load' });
await page.mouse.move(200, 300);
await page.waitForFunction(() => document.documentElement.classList.contains('world-in'), null, { timeout: 90000 });
console.log(JSON.stringify(await page.evaluate(() => { const s = BS30_FILM.state; return { anchors: s.anchors.map(Math.round), shots: s.ready.map((r) => r.shot), cuts: BS30_FILM.cuts.map((c) => c.from + '>' + c.to + ' ' + c.cut) }; })));
await page.evaluate(() => scrollTo(0, 1215));
const t0 = Date.now();
for (let i = 0; i < 20; i++) { await page.waitForTimeout(1000); console.log((Date.now() - t0) / 1000, JSON.stringify(await page.evaluate(() => { const s = BS30_FILM.state; return { y: scrollY, S: s.S.toFixed(4), T: s.T.toFixed(4), mix: s.mix.toFixed(3), cur: s.current, frames: s.frames }; }))); }
await browser.close();
