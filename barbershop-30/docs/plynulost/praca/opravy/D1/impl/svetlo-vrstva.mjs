// D1 – veľkosť vrstvy svetla okraja (.beam-line::before) proti ploche kontaktnej karty, pred (8310) a po (8312),
// telefón 390×844 @3 a počítač 1440×900; kritérium PLAN D1: vrstva ≤ 2× plocha karty (pred 1688×1688 css na telefóne).
// Plus kontrola, že klin pokryje celý rámik: polomer (výška vrstvy) ≥ polovica uhlopriečky karty.
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const b = await chromium.launch({ headless: true });
for (const [dn, o] of [['p390', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }], ['d1440', { viewport: { width: 1440, height: 900 } }]]) {
  for (const [strom, port] of [['pred', 8310], ['po', 8312]]) {
    const ctx = await b.newContext(o); const p = await ctx.newPage();
    await p.goto(`http://127.0.0.1:${port}/barbershop-30/?film=off&uvod=off&hudba=off`, { waitUntil: 'load' });
    await p.evaluate(() => document.querySelector('.beam').scrollIntoView({ block: 'center', behavior: 'instant' }));
    await p.waitForTimeout(800);
    const r = await p.evaluate(() => {
      const k = document.querySelector('.beam').getBoundingClientRect();
      const cs = getComputedStyle(document.querySelector('.beam-line'), '::before');
      const w = parseFloat(cs.width), h = parseFloat(cs.height);
      return { karta: [Math.round(k.width), Math.round(k.height)], vrstva: [Math.round(w), Math.round(h)], pomer: +((w * h) / (k.width * k.height)).toFixed(2),
        polUhlopriecky: Math.round(Math.hypot(k.width / 2, k.height / 2)), polomerKlinu: Math.round(h), animacia: cs.animationName };
    });
    console.log(dn, strom, JSON.stringify(r));
    await ctx.close();
  }
}
await b.close();
