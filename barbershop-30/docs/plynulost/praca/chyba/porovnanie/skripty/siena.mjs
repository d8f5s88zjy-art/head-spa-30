// Siena Film Foundation: za bránou ENTER – snímky a časový sled prechodu (len rozbor princípu prelínania).
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const OUT = new URL('../snimky/', import.meta.url).pathname;
const b = await chromium.launch({ proxy: { server: process.env.HTTPS_PROXY }, args: ['--ignore-certificate-errors-spki-list=' + process.env.SPKI] });
for (const [typ, vp, mob] of [['d', { width: 1440, height: 900 }, false], ['m', { width: 390, height: 844 }, true]]) {
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: mob ? 2 : 1, isMobile: mob, hasTouch: mob });
  const p = await ctx.newPage(); p.setDefaultTimeout(15000);
  try {
    await p.goto('https://siena.film/', { waitUntil: 'domcontentloaded', timeout: 40000 });
    await p.waitForTimeout(4000);
    await p.getByText('ENTER', { exact: false }).first().click().catch((e) => console.log('enter', String(e).slice(0, 80)));
    for (const t of [300, 900, 2500, 5000]) { await p.waitForTimeout(t === 300 ? 300 : t - [300, 900, 2500, 5000][[300, 900, 2500, 5000].indexOf(t) - 1]); await p.screenshot({ path: OUT + `siena-${typ}-enter-${t}.jpg`, type: 'jpeg', quality: 70 }); }
    for (let i = 1; i <= 3; i++) { await p.mouse.wheel(0, vp.height).catch(() => {}); await p.evaluate((y) => scrollBy(0, y), vp.height); await p.waitForTimeout(1800); await p.screenshot({ path: OUT + `siena-${typ}-skrol-${i}.jpg`, type: 'jpeg', quality: 70 }); }
    console.log(typ, await p.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 600)));
  } catch (e) { console.log(typ, 'CHYBA', String(e).slice(0, 150)); }
  await ctx.close();
}
await b.close();
