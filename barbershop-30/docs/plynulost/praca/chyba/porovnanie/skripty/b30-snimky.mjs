// Snímky Barbershop 30 (lokálny server 8670, bez proxy) po sekciách na 390 a 1440 px + inventár na porovnanie.
// Použitie: node b30-snimky.mjs [základná adresa]
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const OUT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SN = path.join(OUT, 'snimky'), DATA = path.join(OUT, 'data');
const BASE = process.argv[2] || 'http://127.0.0.1:8670/barbershop-30/';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await chromium.launch();
const vysledok = {};
for (const [typ, vp] of [['d', { width: 1440, height: 900 }], ['m', { width: 390, height: 844 }]]) {
  const mob = typ === 'm';
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: mob ? 2 : 1, isMobile: mob, hasTouch: mob, locale: 'sk-SK' });
  const page = await ctx.newPage();
  // Prvý dojem s úvodom (bez filmu: prehliadač bez grafickej karty dostane pokojnú verziu ako Lighthouse).
  await page.goto(BASE, { waitUntil: 'load' }); await wait(4000);
  await page.screenshot({ path: path.join(SN, `b30-${typ}-0.jpg`), type: 'jpeg', quality: 72 });
  await page.goto(BASE + '?uvod=off&hudba=off', { waitUntil: 'load' }); await wait(2500);
  const ids = await page.evaluate(() => [...document.querySelectorAll('main section.scene[id], footer[id]')].map((s) => s.id));
  vysledok[typ] = { ids, sekcie: {} };
  for (const id of ids) {
    // Kotva karty a začiatok pásu s obsahom (ak ho sekcia má).
    const pozicie = await page.evaluate((id) => {
      const s = document.getElementById(id); const r = s.getBoundingClientRect(); const top = r.top + scrollY;
      const band = s.querySelector('.band, .scene-band, .content, .price-list, .team-list, .gallery, .kontakt');
      const bt = band ? band.getBoundingClientRect().top + scrollY : null;
      return { top, h: r.height, band: bt };
    }, id);
    vysledok[typ].sekcie[id] = pozicie;
    const ys = [pozicie.top + Math.min(pozicie.h * 0.15, innerHeightGuess(vp))];
    if (pozicie.band) ys.push(pozicie.band - 40);
    let i = 0;
    for (const y of ys) {
      await page.evaluate((y) => window.scrollTo(0, y), Math.max(0, Math.round(y))); await wait(1600);
      await page.screenshot({ path: path.join(SN, `b30-${typ}-${id}-${i++}.jpg`), type: 'jpeg', quality: 72 });
    }
  }
  vysledok[typ].vyska = await page.evaluate(() => document.documentElement.scrollHeight);
  vysledok[typ].fixed = await page.evaluate(() => [...document.querySelectorAll('body *')].filter((el) => { const s = getComputedStyle(el); const r = el.getBoundingClientRect(); return (s.position === 'fixed' || s.position === 'sticky') && r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > 0; }).map((el) => ({ tag: el.tagName, cls: String(el.className).slice(0, 40), t: (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 50) })).filter((x) => x.t).slice(0, 10));
  await ctx.close();
}
function innerHeightGuess(vp) { return vp.height * 0.3; }
fs.writeFileSync(path.join(DATA, 'b30.json'), JSON.stringify(vysledok, null, 1));
await b.close();
console.log(JSON.stringify(vysledok, null, 0).slice(0, 1500));
