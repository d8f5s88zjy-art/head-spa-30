// CO-7: snímka okna tesne po tom, čo pätička vojde do okna (footerIn), počítač 1920×1080 a 1440×900, film vypnutý
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const b = await chromium.launch({ headless: true });
for (const [w, h] of [[1920, 1080], [1440, 900]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  const p = await ctx.newPage();
  await p.goto('http://127.0.0.1:8400/barbershop-30/?film=off', { waitUntil: 'load' });
  await p.waitForTimeout(1000);
  const ft = await p.evaluate(() => document.querySelector('.site-footer').getBoundingClientRect().top + scrollY);
  for (const [nm, dy] of [['pred', -40], ['po', 40]]) {
    await p.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), ft - h + dy);
    await p.waitForTimeout(1500);
    const st = await p.evaluate(() => [...document.querySelectorAll('.film-shot.is-title')].map((e, i) => [i, e.style.getPropertyValue('--so'), e.classList.contains('is-shown') ? 1 : 0]).filter((x) => +x[1] > 0 || x[2]));
    await p.screenshot({ path: `dokazy/co7-${w}x${h}-${nm}.png` });
    console.log(w, h, nm, 'y', ft - h + dy, JSON.stringify(st));
  }
  await ctx.close();
}
await b.close();
