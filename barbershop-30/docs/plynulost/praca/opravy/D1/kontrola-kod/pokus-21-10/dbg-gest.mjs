import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: 'dark' });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await page.goto(`http://127.0.0.1:8400/barbershop-30/index.html?uvod=off&hudba=off&film=off`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__renderDone !== false);
await page.waitForTimeout(800);
for (const cfg of [{ yDistance: -80, speed: 200 }, { yDistance: -300, speed: 800 }, { yDistance: -300, speed: 800, preventFling: true }]) {
  const y0 = await page.evaluate(() => scrollY);
  const ys = [];
  const p = cdp.send('Input.synthesizeScrollGesture', { x: 200, y: 600, gestureSourceType: 'touch', ...cfg });
  const t0 = Date.now(); while (Date.now() - t0 < 1500) { ys.push(await page.evaluate(() => Math.round(scrollY))); await page.waitForTimeout(50); }
  await p;
  console.log(JSON.stringify(cfg), y0, '->', ys.filter((v, i) => i % 3 === 0).join(' '));
}
await browser.close();
