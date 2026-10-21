// Úsporný režim (play odmietnuté): ktoré súbory slučky sa stiahnu? node usporny-req.mjs <port>
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const base = `http://127.0.0.1:${process.argv[2]}/barbershop-30/`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
for (const rej of [true, false]) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: 'dark' });
  if (rej) await ctx.addInitScript(() => { HTMLMediaElement.prototype.play = function () { return Promise.reject(new DOMException('x', 'NotAllowedError')); }; });
  const page = await ctx.newPage(); const log = [];
  page.on('request', (r) => { if (/tim-slucka/.test(r.url())) log.push(r.url().split('/').pop()); });
  await page.goto(base, { waitUntil: 'load' }); await sleep(800);
  for (const [sel, off] of [['[data-shot="cakaren"]', 0.3], ['[data-shot="sala-rano"]', 0.35]]) {
    await page.evaluate(([sel, off]) => { const e = document.querySelector(sel); scrollTo({ top: e.getBoundingClientRect().top + scrollY + off * innerHeight, behavior: 'instant' }); }, [sel, off]); await sleep(1500);
    log.push('@' + sel);
  }
  console.log(rej ? 'odmietnuté' : 'bežné', JSON.stringify(log), await page.evaluate(() => { const v = document.querySelector('.film-loop'); return [v.paused, v.readyState, v.networkState]; }));
  await ctx.close();
}
await browser.close();
