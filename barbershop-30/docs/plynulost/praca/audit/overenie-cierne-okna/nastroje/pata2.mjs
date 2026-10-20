// CO-7: po vojdení pätičky do okna (footerIn, app.js:188) zmiznú všetky zálohy; koľko okna (pod lištou) je potom
// prázdny pás nad pásom kontaktu a v akom rozsahu skrolu je to viac ako 20 % okna. Film vypnutý (pokojná verzia).
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const b = await chromium.launch({ headless: true });
for (const [w, h, dpr, mob] of [[390, 844, 3, true], [412, 915, 2.6, true], [768, 1024, 2, true], [1024, 1366, 2, true], [1366, 768, 1, false], [1536, 864, 1.25, false], [1440, 900, 1, false], [1680, 1050, 1, false], [1920, 1080, 1, false], [2560, 1440, 1, false]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, isMobile: mob, hasTouch: mob });
  const p = await ctx.newPage();
  await p.goto('http://127.0.0.1:8359/barbershop-30/?film=off', { waitUntil: 'load' });
  await p.waitForTimeout(1200);
  const r = await p.evaluate(async () => {
    const y0 = scrollY, f = document.querySelector('.site-footer'), band = document.querySelector('.band-contact');
    const ft = f.getBoundingClientRect().top + y0, bt = band.getBoundingClientRect().top + y0, vh = innerHeight;
    const nav = document.querySelector('.site-header').getBoundingClientRect().height;
    const yOn = Math.ceil(ft - vh) + 1;
    scrollTo({ top: yOn, behavior: 'instant' }); await new Promise((r) => setTimeout(r, 700));
    const so = [...document.querySelectorAll('.film-shot.is-title')].filter((e) => +e.style.getPropertyValue('--so') > 0.001).length;
    const strip = Math.max(0, bt - yOn - nav);
    const over20 = Math.max(0, Math.round(bt - nav - 0.2 * vh - yOn));  // px skrolu, kde je prázdny pás > 20 % okna
    return { vh, nav: Math.round(nav), pasOd: Math.round(bt), pataOd: Math.round(ft), yOn, karietSoPoVojdeni: so, prazdnyPas_px: Math.round(strip), podiel: +(strip / vh).toFixed(2), rozsahNad20pct_px: over20 };
  });
  console.log(`${w}x${h}`, JSON.stringify(r));
  await ctx.close();
}
await b.close();
