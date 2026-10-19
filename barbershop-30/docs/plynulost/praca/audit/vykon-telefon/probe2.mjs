// test dotykového gesta v headless shell aj v plnom Chromiu (nový headless)
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://127.0.0.1:8433/barbershop-30/?film=off&uvod=off';
for (const channel of [undefined, 'chromium']) {
  const browser = await chromium.launch({ headless: true, channel, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  const cdp = await ctx.newCDPSession(page);
  const t1 = Date.now();
  await cdp.send('Input.synthesizeScrollGesture', { x: 195, y: 600, yDistance: -600, speed: 1200, gestureSourceType: 'touch' });
  const a = await page.evaluate(() => scrollY);
  const t2 = Date.now();
  await cdp.send('Input.synthesizeScrollGesture', { x: 195, y: 700, yDistance: -500, speed: 5000, gestureSourceType: 'touch', preventFling: false });
  const b = await page.evaluate(() => scrollY);
  await page.waitForTimeout(1500);
  const c = await page.evaluate(() => scrollY);
  console.log(channel || 'shell', browser.version(), 'gesto', t2 - t1, 'ms ->', a, '| švih ->', b, 'po 1,5 s', c);
  // aj gestureSourceType default
  await cdp.send('Input.synthesizeScrollGesture', { x: 195, y: 600, yDistance: -600, speed: 1200 });
  console.log(' default ->', await page.evaluate(() => scrollY));
  await browser.close();
}
