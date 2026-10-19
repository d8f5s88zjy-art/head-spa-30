// Dotykové synthesizeScrollGesture: ktoré nastavenie emulácie ho blokuje
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const browser = await chromium.launch({ headless: true });
const variants = {
  'mobil+dotyk': { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  'len-dotyk': { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true },
  'len-mobil': { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true },
  'dpr1-dotyk': { viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true },
  'nic': { viewport: { width: 390, height: 844 } },
};
for (const [k, o] of Object.entries(variants)) {
  const ctx = await browser.newContext(o);
  const page = await ctx.newPage();
  await page.setContent('<div style="height:20000px;background:linear-gradient(red,blue)">x</div>');
  await page.waitForTimeout(300);
  const cdp = await ctx.newCDPSession(page);
  const r = [];
  for (const pre of [null, 'off']) {
    if (pre === 'off') await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: false }).catch(() => {});
    await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(200);
    await cdp.send('Input.synthesizeScrollGesture', { x: 195, y: 600, yDistance: -600, speed: 2000, gestureSourceType: 'touch' }).catch((e) => r.push('chyba ' + e.message.slice(0, 60)));
    await page.waitForTimeout(600);
    r.push(await page.evaluate(() => scrollY));
  }
  console.log(k, JSON.stringify(r));
  await ctx.close();
}
await browser.close();
