// Overenie VZ-10: pokojná verzia (?film=off) zastavená v pásme nábehu karty – po 1 s pokoja krytie záloh --so a nadpisov --o + snímka.
import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const browser = await chromium.launch();
for (const [dev, vp, dsf, ys] of [['p390', { width: 390, height: 844 }, 3, [868, 1458, 2049]], ['d1440', { width: 1440, height: 900 }, 1, [925, 1555]]]) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: dsf, isMobile: dev === 'p390', hasTouch: dev === 'p390' });
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:8507/barbershop-30/?film=off', { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  for (const y of ys) {
    await page.evaluate((y) => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, y); }, y);
    await page.waitForTimeout(400);
    await page.evaluate(async () => { const im = [...document.images].filter((i) => { const r = i.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; }); await Promise.all(im.map((i) => i.decode().catch(() => {}))); });
    await page.waitForTimeout(1000);   // pokoj 1 s
    const v = await page.evaluate(() => [...document.querySelectorAll('.film-shot.is-title')].map((el) => ({ s: el.dataset.shot, o: +(+el.style.getPropertyValue('--o') || 0).toFixed(2), so: +(+el.style.getPropertyValue('--so') || 0).toFixed(2) })).filter((x) => x.o > 0.01 || x.so > 0.01));
    console.log(dev, y, JSON.stringify(v));
    await page.screenshot({ path: `snimky/dvoj-${dev}-${y}.jpg`, type: 'jpeg', quality: 90 });
  }
  await ctx.close();
}
await browser.close();
