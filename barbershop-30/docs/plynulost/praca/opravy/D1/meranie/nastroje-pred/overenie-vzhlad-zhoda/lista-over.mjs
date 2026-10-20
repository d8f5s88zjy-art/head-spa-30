#!/usr/bin/env node
// Overenie VZ-09: app.js ráta voľnú dĺžku dlhej karty z window.innerHeight. V emulácii sa lišta prehliadača nedá
// ukázať (svh = lvh), preto sa innerHeight podvrhne o 56 px menšie (lišta Chrome Android viditeľná) a pošle sa resize;
// CSS (160svh) sa nemení, ako na telefóne. Meria sa krytie --o karty pri tej istej polohe skrolu.
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
await page.goto('http://127.0.0.1:8310/barbershop-30/?film=off', { waitUntil: 'load' });
await page.waitForTimeout(1500);
const cards = await page.evaluate(() => [...document.querySelectorAll('.film-shot.is-title.title-long')].map((el) => { const r = el.getBoundingClientRect(); return { shot: el.dataset.shot, top: Math.round(r.top + scrollY), h: Math.round(r.height) }; }));
const out = [];
for (const c of cards) {
  for (const f of [0.9, 0.94, 0.97, 1.0]) {
    // čerstvá poloha karty (recenzie a obrázky môžu rozloženie ešte posunúť)
    const g = await page.evaluate((s) => { const el = document.querySelector(`.film-shot[data-shot="${s}"].title-long`); const r = el.getBoundingClientRect(); return { top: Math.round(r.top + scrollY), h: Math.round(r.height) }; }, c.shot);
    const d = Math.round(f * (g.h - 844)), y = g.top + d;
    const r = {};
    for (const ih of [844, 788]) {
      await page.evaluate(([ih]) => { Object.defineProperty(window, 'innerHeight', { configurable: true, get: () => ih }); dispatchEvent(new Event('resize')); }, [ih]);
      await page.waitForTimeout(250);
      await page.evaluate((y) => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, y); }, y);
      await page.waitForFunction(() => window.__scrollSettled === true, null, { timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(150);
      r[ih] = await page.evaluate((s) => +(+document.querySelector(`.film-shot[data-shot="${s}"].title-long`).style.getPropertyValue('--o') || 0).toFixed(3), c.shot);
    }
    out.push({ karta: c.shot, vyska: g.h, y_minus_top: d, o_lista_skryta_844: r[844], o_lista_viditelna_788: r[788], skok: +(r[788] - r[844]).toFixed(3) });
    console.log(JSON.stringify(out[out.length - 1]));
  }
}
fs.writeFileSync(new URL('./merania/lista.json', import.meta.url), JSON.stringify({ cards, out }, null, 1));
await browser.close();
