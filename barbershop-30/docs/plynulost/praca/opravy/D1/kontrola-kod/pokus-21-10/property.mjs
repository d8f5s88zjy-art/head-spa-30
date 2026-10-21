// @property: stav úvodu a kariet pred spustením app.js a bez JS (pred 8402 vs po 8400)
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const browser = await chromium.launch({ args: ['--no-sandbox'] });
for (const port of [8402, 8400]) {
  for (const sc of ['bez JS', 'app.js zablokovaný', 'app.js blokovaný, ?film=off']) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, colorScheme: 'dark', javaScriptEnabled: sc !== 'bez JS' });
    const page = await ctx.newPage();
    if (sc !== 'bez JS') await page.route('**/assets/app.js*', (r) => r.abort());
    await page.goto(`http://127.0.0.1:${port}/barbershop-30/index.html?uvod=off${sc.includes('film=off') ? '&film=off' : ''}`, { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    const r = await page.evaluate(() => {
      const sh = [...document.querySelectorAll('.film-shot')];
      const o = (e) => e ? +getComputedStyle(e).opacity : null;
      return { karty: document.documentElement.classList.contains('karty'), uvod_frame: o(sh[0].querySelector('.title-frame')), uvod_still: o(sh[0].querySelector('.film-still')), druhy_frame: o(sh[1].querySelector('.title-frame')), druhy_still: o(sh[1].querySelector('.film-still')), druhy_still_vis: getComputedStyle(sh[1].querySelector('.film-still')).visibility, img_transform: getComputedStyle(sh[1].querySelector('.film-still img')).transform };
    });
    console.log(port, sc.padEnd(28), JSON.stringify(r));
    await page.screenshot({ path: `property/property-${port}-${sc.replace(/[^a-z]/gi, '')}.png` }).catch(() => {});
    await ctx.close();
  }
}
await browser.close();
