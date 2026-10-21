// Kontrola kódu D1: po dobehnutí preklápania tabule (Web Animations) neostávajú živé animácie políčok (únik);
// zároveň po skrole a skoku z menu je stav tried a cache premenných v poriadku (žiadna premenná na kotve).
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const BASE = process.argv[2];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
await page.goto(BASE + '?uvod=off&hudba=off&film=off', { waitUntil: 'load' });
await sleep(1500);
const pocet = () => page.evaluate(() => { const a = document.getAnimations(); return { spolu: a.length, policka: a.filter((x) => x.effect && x.effect.target && x.effect.target.tagName === 'B').length, stavy: a.filter((x) => x.effect && x.effect.target && x.effect.target.tagName === 'B').map((x) => x.playState) }; });
const pred = await pocet();
await page.evaluate(() => { const b = document.querySelector('.band-contact'); window.scrollTo({ top: b.getBoundingClientRect().top + scrollY - 200, behavior: 'instant' }); });
await sleep(700);
const pocas = await pocet();
await sleep(4500);
const po = await pocet();
// druhé spustenie (zmena jazyka prepíše tabuľu bez preklápania) – animácie neostávajú
const kotvy = await page.evaluate(() => [...document.querySelectorAll('.film-shot')].filter((s) => ['--sp', '--o', '--so'].some((n) => s.style.getPropertyValue(n) !== '')).length);
console.log(JSON.stringify({ pred_tabulou: pred, pocas_preklapania: pocas, po_dobehnuti: po, premenne_na_kotvach: kotvy }));
await browser.close();
