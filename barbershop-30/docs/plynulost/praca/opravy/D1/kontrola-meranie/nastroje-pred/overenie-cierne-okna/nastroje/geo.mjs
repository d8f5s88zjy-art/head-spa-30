// Rozloženie stránky (pokojná verzia): sekcie, titulné karty, pásy, pätička – telefón aj počítač.
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const b = await chromium.launch({ headless: true });
for (const [w, h, dpr, mob] of [[390, 844, 3, true], [1440, 900, 1, false]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, isMobile: mob, hasTouch: mob });
  const p = await ctx.newPage();
  await p.goto('http://127.0.0.1:8430/barbershop-30/?film=off', { waitUntil: 'load' });
  await p.waitForTimeout(1500);
  const r = await p.evaluate(() => {
    const y0 = scrollY, R = (e) => { const q = e.getBoundingClientRect(); return [Math.round(q.top + y0), Math.round(q.bottom + y0)]; };
    const out = [];
    document.querySelectorAll('section, .film-shot, .band, .site-footer').forEach((e) => {
      const tag = e.matches('.film-shot') ? (e.matches('.is-title') ? 'KARTA ' + (e.dataset.m || e.dataset.shot) : 'zaber ' + (e.dataset.shot || '')) : e.matches('.band') ? 'pas ' + (e.className) : e.matches('.site-footer') ? 'PATA' : 'sekcia #' + e.id;
      out.push([...R(e), tag]);
    });
    return out.sort((a, b) => a[0] - b[0]);
  });
  console.log(`== ${w}x${h}`); r.forEach((x) => console.log(String(x[0]).padStart(6), String(x[1]).padStart(6), x[2]));
  await ctx.close();
}
await b.close();
