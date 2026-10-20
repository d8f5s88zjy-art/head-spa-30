// CO-7: presný bod, kde zálohy zhasnú (--so všetkých kariet 0), voči hornému okraju pätičky; snímky pred a po.
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const b = await chromium.launch({ headless: true });
for (const [w, h] of [[2560, 1440], [1920, 1080], [1024, 1366]]) {
  const mob = w === 1024;
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: mob ? 2 : 1, isMobile: mob, hasTouch: mob });
  const p = await ctx.newPage();
  await p.goto('http://127.0.0.1:8400/barbershop-30/?film=off', { waitUntil: 'load' });
  await p.waitForTimeout(1200);
  const ft = await p.evaluate(() => document.querySelector('.site-footer').getBoundingClientRect().top + scrollY);
  const out = [];
  for (let dy = -80; dy <= 120; dy += 20) {
    await p.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), ft - h + dy);
    await p.waitForTimeout(500);
    const so = await p.evaluate(() => [...document.querySelectorAll('.film-shot.is-title')].map((e) => +e.style.getPropertyValue('--so')).reduce((a, x) => Math.max(a, x), 0));
    out.push(`${dy}:${so.toFixed(2)}`);
    if (dy === 40) await p.screenshot({ path: `dokazy-v2/co7-${w}x${h}-po-vojdeni-paty.png` });
    if (dy === -60) await p.screenshot({ path: `dokazy-v2/co7-${w}x${h}-pred.png` });
  }
  console.log(`${w}x${h} pätička od ${Math.round(ft)}; y = pätička − výška okna + dy → najväčšie --so:`, out.join(' '));
  await ctx.close();
}
await b.close();
