// Kontrola kódu D1: svetlo po okraji kontaktnej karty (.beam-line::before) pred a po zmene vrstvy. Animácie sa
// zastavia a nastavia na rovnaké fázy (Web Animations: currentTime), karta sa odfotí; porovnanie robí svetlo-fazy.py.
//   node svetlo-fazy.mjs --base=http://127.0.0.1:8402/barbershop-30/ --meno=pred
import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.length ? v.join('=') : true]; }));
const BASE = opt.base;
const OUT = new URL('./svetlo-fazy/', import.meta.url).pathname; fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ headless: true });
const DEV = {
  p390: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  d1440: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
};
const info = {};
for (const [dev, o] of Object.entries(DEV)) {
  const ctx = await browser.newContext({ ...o, locale: 'sk-SK', reducedMotion: 'no-preference' });
  const page = await ctx.newPage();
  await page.goto(BASE + '?uvod=off&hudba=off&film=off', { waitUntil: 'load' });
  await sleep(1500);
  await page.evaluate(() => { const b = document.querySelector('.contact-main'); window.scrollTo({ top: b.getBoundingClientRect().top + scrollY - 120, behavior: 'instant' }); });
  await sleep(2500);
  for (const T of [0, 900, 1750, 2600, 3500, 4400, 5250, 6100]) {
    const st = await page.evaluate((T) => {
      const an = document.getAnimations();
      let n = 0, rozmer = null;
      for (const a of an) {
        const ef = a.effect;
        if (!ef || !ef.target) continue;
        const isBeam = ef.pseudoElement === '::before' && ef.target.classList.contains('beam-line');
        // ostatné nekonečné animácie (lesk, pás) do pevnej fázy, aby nerušili porovnanie
        a.pause(); a.currentTime = isBeam ? T : 0;
        if (isBeam) { n++; const cs = getComputedStyle(ef.target, '::before'); rozmer = [cs.width, cs.height]; }
      }
      return { n, rozmer, skrol: document.documentElement.classList.contains('skrol') };
    }, T);
    await sleep(120);
    const el = page.locator('.contact-main');
    await el.screenshot({ path: `${OUT}${opt.meno}-${dev}-${T}.png`, animations: 'allow' });
    info[`${dev}-${T}`] = st;
  }
  await ctx.close();
}
fs.writeFileSync(`${OUT}${opt.meno}.json`, JSON.stringify(info, null, 1));
console.log(JSON.stringify(info));
await browser.close();
