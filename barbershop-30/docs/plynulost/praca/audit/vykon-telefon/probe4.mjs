// overenie: poloha skrolu z metadát screencastu oproti scrollY a snímke
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: 'sk-SK' });
const page = await ctx.newPage();
await page.goto('http://127.0.0.1:8433/barbershop-30/?film=off', { waitUntil: 'load' });
await page.waitForTimeout(3000);
const cdp = await ctx.newCDPSession(page);
let meta = [];
cdp.on('Page.screencastFrame', (f) => { meta.push(f.metadata); cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}); });
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 50, maxWidth: 390, maxHeight: 844 });
await page.evaluate(() => scrollTo({ top: 12455, behavior: 'instant' }));
await page.waitForTimeout(2500);
console.log('scrollY', await page.evaluate(() => scrollY), 'meta', JSON.stringify(meta.slice(-2)));
console.log(await page.evaluate(() => [...document.querySelectorAll('.band, footer')].map((e) => { const r = e.getBoundingClientRect(); return [e.className.slice(0, 20), Math.round(r.top + scrollY), Math.round(r.bottom + scrollY)]; })));
await page.screenshot({ path: 'test/y12455.png' });
await browser.close();
