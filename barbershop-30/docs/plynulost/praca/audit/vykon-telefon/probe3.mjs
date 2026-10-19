// dotykový švih: synthesizeScrollGesture (touch) na jednoduchej stránke a ručné Input.dispatchTouchEvent
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const browser = await chromium.launch({ headless: true });
for (const mode of ['plain', 'site']) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  if (mode === 'plain') await page.setContent('<div style="height:20000px;background:linear-gradient(red,blue)">x</div>');
  else await page.goto('http://127.0.0.1:8433/barbershop-30/?film=off&uvod=off', { waitUntil: 'load' });
  await page.waitForTimeout(800);
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Input.synthesizeScrollGesture', { x: 195, y: 600, yDistance: -600, speed: 1200, gestureSourceType: 'touch' });
  const a = await page.evaluate(() => scrollY);
  // ručné ťahanie prstom
  const steps = 20, y0 = 700, dy = -500;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: y0 }] });
  for (let i = 1; i <= steps; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 195, y: y0 + dy * i / steps }] }); await new Promise((r) => setTimeout(r, 16)); }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(1200);
  const b = await page.evaluate(() => scrollY);
  console.log(mode, 'synth touch ->', a, '| dispatchTouch ->', b);
  await ctx.close();
}
await browser.close();
