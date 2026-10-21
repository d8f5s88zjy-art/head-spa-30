// Kontrola kódu D1: skúška opravy N2 na telefóne – príčina rastu je prázdny .flap-state, ktorý po vyplnení dostane text
// („Teraz otvorené“) a zalomí sa do druhého riadka; skúša sa min-height políčok + zástupný znak v prázdnom stave.
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const BASE = process.argv[2];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const CSS = '.flap-cells { min-height: calc(1.36 * clamp(1.125rem, 4.6vw, 1.5rem)); line-height: 1; align-items: center; } .flap-state:empty::before { content: "\\00a0"; } @media (max-width: 720px) { .flap-state { flex-basis: 100%; } }';
const browser = await chromium.launch({ headless: true });
for (const [meno, o] of Object.entries({ telefon390: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }, telefon360: { viewport: { width: 360, height: 780 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }, pocitac: { viewport: { width: 1440, height: 900 } } })) {
  const ctx = await browser.newContext(o); const page = await ctx.newPage();
  await page.goto(BASE + '?uvod=off&hudba=off&film=off', { waitUntil: 'load' });
  await page.addStyleTag({ content: CSS });
  await sleep(800);
  const h = () => page.evaluate(() => { const f = document.querySelector('[data-flap]'), s = f.querySelector('.flap-state').getBoundingClientRect(), c = f.querySelector('.flap-cells').getBoundingClientRect(); return { h: +f.getBoundingClientRect().height.toFixed(1), b: f.querySelectorAll('.flap-cells b').length, stavTop: Math.round(s.top - f.getBoundingClientRect().top), cellsH: +c.height.toFixed(1) }; });
  const pred = await h();
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; location.hash = '#kontakt'; });
  await sleep(1500);
  const po = await h();
  console.log(JSON.stringify({ meno, pred, po, rozdiel_px: +(po.h - pred.h).toFixed(1) }));
  await ctx.close();
}
await browser.close();
