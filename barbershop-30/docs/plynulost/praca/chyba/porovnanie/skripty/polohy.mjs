// Polohy kľúčových prvkov Barbershop 30 (telefón 390 × 844 a počítač 1440 × 900): kde je dôkaz, hodiny, cenník.
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const b = await chromium.launch();
const out = {};
for (const [typ, vp, mob] of [['m', { width: 390, height: 844 }, true], ['d', { width: 1440, height: 900 }, false]]) {
  const ctx = await b.newContext({ viewport: vp, isMobile: mob, hasTouch: mob, deviceScaleFactor: mob ? 3 : 1 });
  const p = await ctx.newPage();
  await p.goto('http://127.0.0.1:8670/barbershop-30/?uvod=off&hudba=off', { waitUntil: 'load' });
  await p.waitForTimeout(3500);
  await p.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 600) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); } scrollTo(0, 0); });
  await p.waitForTimeout(1500);
  out[typ] = await p.evaluate(() => {
    const top = (el) => el ? Math.round(el.getBoundingClientRect().top + scrollY) : null;
    const byText = (re) => [...document.querySelectorAll('p, h2, h3, a, li, span')].find((e) => re.test(e.textContent || '') && e.children.length < 3);
    const H = document.documentElement.scrollHeight, vh = innerHeight;
    const q = {
      prvy_rezervovat: top(document.querySelector('#uvod a.btn')),
      recenzie_povedali_o_nas: top(byText(/^\s*Povedali o nás\s*$/)),
      prva_recenzia: top(document.querySelector('[class*="recenz"], [class*="review"]')),
      hodnotenie_google: top(byText(/Hodnotenie na Google/)),
      tabula_dnes: top(document.querySelector('[class*="tabul"], [class*="board-today"], [data-tabula]')) ,
      cennik_zaciatok: top(document.querySelector('.price-group')),
      cennik_koniec: (() => { const g = [...document.querySelectorAll('.price-group')].pop(); return g ? Math.round(g.getBoundingClientRect().bottom + scrollY) : null; })(),
      galeria_mriezka: top(document.querySelector('.gallery')),
      vernost_odkaz: top(document.querySelector('[data-vernost-karta]')),
      skolenia: top(byText(/Školenia/)),
    };
    const cen = q.cennik_koniec - q.cennik_zaciatok;
    return { H, vh, obrazoviek: +(H / vh).toFixed(1), ...q, cennik_px: cen, cennik_obrazoviek: +(cen / vh).toFixed(2), recenzie_obrazovka: q.recenzie_povedali_o_nas ? +(q.recenzie_povedali_o_nas / vh).toFixed(1) : null };
  });
  await ctx.close();
}
fs.writeFileSync(new URL('../data/b30-polohy.json', import.meta.url).pathname, JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
await b.close();
