// D1 – vzhľad pokojnej verzie pred/po: snímky každej titulnej karty v tretine pripnutia a pásu kontaktu (svetlo okraja
// v dvoch fázach obehu), telefón 390×844 @3 a počítač 1440×900, ?film=off&uvod=off&hudba=off. Pred = 8430 (pred-D1),
// po = 8432 (HEAD). Nekonečné animácie sa pred snímkou zastavia v rovnakom čase (getAnimations, currentTime = fáza),
// prechody a preklápanie tabule sa nechajú dobehnúť. Porovnanie: python3 vzhlad.py.
//   node vzhlad.mjs [--dev=p390,d1440]
import fs from 'node:fs';
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
// --bez-i18n: modul jazykov sa nenačíta (v strome pred jeho i18n.css prepne Manrope 600/700 na písmo systému, čo nie je
// zmena D1, ale chyba pred ňou); porovná sa tak len vplyv ostatných zmien D1
const OUT = new URL(process.argv.includes('--bez-i18n') ? '../vzhlad-bez-i18n/' : '../vzhlad/', import.meta.url).pathname;
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.length ? v.join('=') : '1']; }));
const DEVS = { p390: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: 'sk-SK' },
  d1440: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, locale: 'sk-SK' } };
const PORT = { pred: 8430, po: 8432 };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ headless: true });
for (const dn of String(opt.dev || 'p390,d1440').split(',')) {
  for (const strom of ['pred', 'po']) {
    fs.mkdirSync(`${OUT}${strom}`, { recursive: true });
    const ctx = await browser.newContext(DEVS[dn]);
    const page = await ctx.newPage();
    const errs = []; page.on('pageerror', (e) => errs.push(e.message));
    if (process.argv.includes('--bez-i18n')) await page.route('**/assets/i18n.js', (r) => r.abort());
    await page.goto(`http://127.0.0.1:${PORT[strom]}/barbershop-30/?film=off&uvod=off&hudba=off`, { waitUntil: 'load', timeout: 120000 });
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.addStyleTag({ content: 'html{scroll-behavior:auto !important}' });
    await sleep(1500);
    const ciele = await page.evaluate(() => {
      const out = [...document.querySelectorAll('.film-shot')].map((el, i) => { const r = el.getBoundingClientRect(); const long = el.classList.contains('title-long'); const free = r.height - (long ? innerHeight : 0); return { meno: `karta-${String(i).padStart(2, '0')}-${el.dataset.shot}`, y: i === 0 ? 0 : Math.round(r.top + scrollY + free * 0.35) }; });
      const k = document.querySelector('.band-contact .contact-main').getBoundingClientRect();
      out.push({ meno: 'kontakt', y: Math.round(k.top + scrollY - 80), faza: [0, 2600] });
      return out;
    });
    for (const c of ciele) {
      await page.evaluate((y) => scrollTo(0, y), c.y);
      await page.waitForFunction(() => window.__scrollSettled === true, null, { timeout: 30000 }).catch(() => {});
      await sleep(c.meno === 'kontakt' ? 3500 : 1600);   // prechody kariet a preklápanie tabule dobehnú
      for (const f of c.faza || [0]) {
        await page.evaluate((t) => { for (const a of document.getAnimations()) { const tm = a.effect && a.effect.getComputedTiming(); if (tm && tm.iterations === Infinity) { a.pause(); a.currentTime = t; } } }, f);
        await sleep(150);
        await page.screenshot({ path: `${OUT}${strom}/${dn}-${c.meno}${c.faza ? '-f' + f : ''}.png` });
      }
    }
    if (errs.length) console.log(strom, dn, 'chyby:', errs);
    await ctx.close();
  }
}
await browser.close();
console.log('hotovo', OUT);
