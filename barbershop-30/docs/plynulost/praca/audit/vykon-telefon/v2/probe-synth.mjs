// Overenie Input.synthesizeScrollGesture (dotyk) v headless shell aj v plnom Chromiu (nový headless)
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
for (const channel of [undefined, 'chromium']) {
  const browser = await chromium.launch({ headless: true, channel, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.setContent('<div style="height:20000px;background:linear-gradient(red,blue)">x</div>');
  await page.waitForTimeout(500);
  const cdp = await ctx.newCDPSession(page);
  const res = {};
  for (const g of ['touch', 'default', 'mouse']) {
    await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(200);
    const t = Date.now();
    try { await cdp.send('Input.synthesizeScrollGesture', { x: 195, y: 600, yDistance: -600, speed: 2000, gestureSourceType: g }); } catch (e) { res[g] = 'chyba ' + e.message.slice(0, 80); continue; }
    await page.waitForTimeout(800);
    res[g] = [await page.evaluate(() => scrollY), Date.now() - t];
  }
  console.log(channel || 'headless-shell', browser.version(), JSON.stringify(res));
  await browser.close();
}
