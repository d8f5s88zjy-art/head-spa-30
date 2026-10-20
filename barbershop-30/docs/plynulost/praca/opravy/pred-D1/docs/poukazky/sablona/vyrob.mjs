// Darčekové poukážky HEAD SPA 30 podľa pôvodnej šablóny salónu: na každej je len názov rituálu a cena.
// Použitie (z koreňa repozitára):
//   python3 docs/poukazky/sablona/ceny.py          # názvy a ceny z index.html do ritualy.json
//   node docs/poukazky/sablona/vyrob.mjs           # vykreslí poukážky do docs/poukazky/sablona/png/
//   python3 docs/poukazky/sablona/export.py        # obrázky pre Booqme (booqme/) a pre web (assets/img/poukaz/)
// Chromium: PLAYWRIGHT_CHROMIUM=/cesta/k/chrome, inak ten, ktorý má Playwright.
// Playwright mimo projektu: PLAYWRIGHT_MODULE=/cesta/k/playwright/index.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const D = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(D, 'png');
fs.mkdirSync(OUT, { recursive: true });
const R = JSON.parse(fs.readFileSync(path.join(D, 'ritualy.json'), 'utf8'));
const b = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM } : {});
// v rozlíšení šablóny: nový text je rovnako ostrý ako pôvodný (zväčšuje sa až hotový obrázok v export.py)
const p = await b.newPage({ viewport: { width: 1290, height: 648 }, deviceScaleFactor: 1 });
await p.goto('file://' + path.join(D, 'poukazka.html'));
// písma treba načítať vopred: rozloženie sa počíta z ich rozmerov (inak prvé poukážky vyjdú posunuté)
await p.evaluate(() => Promise.all(['600 20px Cinzel', '600 20px Montserrat'].map((f) => document.fonts.load(f, 'AÁĹÝČ€ 0123456789'))));
for (const r of R) {
  await p.evaluate((d) => window.vykresli(d), r);
  await p.evaluate(() => document.fonts.ready);
  await p.locator('#p').screenshot({ path: path.join(OUT, r.subor + '.png') });
  console.log(r.subor, r.cena + ' €');
}
await b.close();
