import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const W = +process.argv[2] || 1920, H = +process.argv[3] || 1080;
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto('http://127.0.0.1:8211/barbershop-30/?film=on&uvod=off', { waitUntil: 'load' });
await page.mouse.move(100, 100);
await page.waitForFunction(() => document.documentElement.classList.contains('world-in'), null, { timeout: 120000 });
const cards = await page.evaluate(() => [...document.querySelectorAll('.film-shot.is-title')].map((el) => { const r = el.getBoundingClientRect(); return [el.dataset.shot, Math.round(r.top + scrollY), Math.round(r.height)]; }));
console.log('karty', JSON.stringify(cards));
for (const y of [1420, 2176, 2932]) {
  await page.evaluate((y) => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, y); }, y);
  for (let i = 0; i < 12; i++) {
    await page.waitForTimeout(1500);
    const s = await page.evaluate(() => { const s = window.BS30_FILM.state; return { y: scrollY, S: +s.S.toFixed(3), T: +s.T.toFixed(3), mix: +s.mix.toFixed(3), cur: s.current, dpr: s.dpr, frames: s.frames, A: s.anchors.map(Math.round).slice(0, 6) }; });
    console.log(y, i, JSON.stringify(s));
    if (Math.abs(s.S - s.T) < 0.004) break;
  }
}
await browser.close();
