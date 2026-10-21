// Kontrola kódu D1: skúška navrhovanej opravy N2 bez zmeny repozitára – vložený štýl .flap-cells { min-height } s výškou
// políčka; výška tabule pred a po vyplnení musí byť rovnaká (telefón 390×844 aj počítač 1440×900).
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const BASE = process.argv[2];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const CSS = '.flap-cells { min-height: calc(1.36 * clamp(1.125rem, 4.6vw, 1.5rem)); align-items: center; }';
const browser = await chromium.launch({ headless: true });
for (const [meno, o] of Object.entries({ telefon: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }, pocitac: { viewport: { width: 1440, height: 900 } } })) {
  for (const oprava of [false, true]) {
    const ctx = await browser.newContext(o); const page = await ctx.newPage();
    await page.goto(BASE + '?uvod=off&hudba=off&film=off', { waitUntil: 'load' });
    if (oprava) await page.addStyleTag({ content: CSS });
    await sleep(800);
    const h = () => page.evaluate(() => { const f = document.querySelector('[data-flap]'); return { h: +f.getBoundingClientRect().height.toFixed(1), b: f.querySelectorAll('.flap-cells b').length }; });
    const pred = await h();
    await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; location.hash = '#kontakt'; });
    await sleep(1500);
    const po = await h();
    console.log(JSON.stringify({ meno, oprava, pred, po, rozdiel_px: +(po.h - pred.h).toFixed(1) }));
    await ctx.close();
  }
}
await browser.close();
