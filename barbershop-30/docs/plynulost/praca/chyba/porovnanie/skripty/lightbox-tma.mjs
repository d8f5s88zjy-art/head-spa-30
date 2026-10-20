// Lightbox galérie: čo vidí zákazník po ťuknutí na „ďalšia“ pri sieti Fast 4G (telefón 390 × 844, DPR 3).
// Meria podiel tmavej plochy v rámci obrázka v čase po kliknutí (bez zásahu do kódu webu).
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const OUT = new URL('../snimky/', import.meta.url).pathname;
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: 'sk-SK' });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await page.goto('http://127.0.0.1:8670/barbershop-30/?uvod=off&hudba=off', { waitUntil: 'load' });
await page.waitForTimeout(1500);
await page.evaluate(() => document.querySelector('.gallery').scrollIntoView());
await page.waitForTimeout(1200);
await page.locator('.gallery-btn').first().click();
await page.waitForTimeout(3000);
await page.screenshot({ path: OUT + 'lightbox-0-otvoreny.jpg', type: 'jpeg', quality: 70 });
// Fast 4G (rovnaké hodnoty ako PLAN.md: 165 ms, 9 Mb/s × 0,9)
await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 165, downloadThroughput: 9e6 * 0.9 / 8, uploadThroughput: 9e6 * 0.9 / 8 });
const vysl = [];
await page.locator('.lightbox-next').click();
const t0 = Date.now();
for (const t of [100, 250, 500, 900, 1500, 2500]) {
  const w = t - (Date.now() - t0); if (w > 0) await page.waitForTimeout(w);
  const f = OUT + `lightbox-dalsia-${t}ms.jpg`;
  await page.screenshot({ path: f, type: 'jpeg', quality: 70 });
  const stav = await page.evaluate(() => { const i = document.querySelector('#lightbox-img, .lightbox img'); const r = i.getBoundingClientRect(); return { complete: i.complete, nw: i.naturalWidth, src: (i.currentSrc || i.src).split('/').pop(), x: r.x, y: r.y, w: r.width, h: r.height }; });
  vysl.push({ t, ...stav });
}
fs.writeFileSync(OUT + '../data/lightbox-tma.json', JSON.stringify(vysl, null, 1));
console.log(JSON.stringify(vysl));
await b.close();
