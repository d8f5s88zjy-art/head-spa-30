// ukrajinčina: akú hrúbku majú prvky s cyrilikou v Manrope (rez 500–800 pred D1 vs rezy 400/600/700 po D1)
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const browser = await chromium.launch({ args: ['--no-sandbox'] });
for (const port of [8402, 8400]) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' });
  const page = await ctx.newPage();
  await page.goto(`http://127.0.0.1:${port}/barbershop-30/index.html?uvod=off&hudba=off&film=off&lang=uk`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.documentElement.lang === 'uk-UA' && !document.documentElement.classList.contains('t-wait'), null, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2500);
  const r = await page.evaluate(() => {
    const out = {}; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      if (!/[Ѐ-ӿ]/.test(n.nodeValue) || !n.parentElement) continue;
      const cs = getComputedStyle(n.parentElement); if (!/Manrope/.test(cs.fontFamily.split(',')[0])) continue;
      out[cs.fontWeight] = (out[cs.fontWeight] || 0) + 1;
    }
    return out;
  });
  console.log(port, 'počet textových uzlov s cyrilikou v Manrope podľa hrúbky:', JSON.stringify(r));
  await ctx.close();
}
await browser.close();
