#!/usr/bin/env node
// Overenie VZ-05 (pásmo bez nadpisu) a VZ-10 (dvojexpozícia v pokojnej verzii): krytie nadpisov --o a záloh --so
// na hraniciach kariet po ustálení skrolu, krok 3 px. node pasma.mjs --dev=p390|d1440
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const DEVS = { p390: { width: 390, height: 844, mob: true }, d1440: { width: 1440, height: 900, mob: false } };
const D = DEVS[opt.dev || 'p390'];
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: D.width, height: D.height }, isMobile: D.mob, hasTouch: D.mob });
const page = await ctx.newPage();
await page.goto('http://127.0.0.1:8400/barbershop-30/?film=off', { waitUntil: 'load' });
await page.waitForTimeout(1500);
const cards = await page.evaluate(() => [...document.querySelectorAll('.film-shot.is-title')].map((el) => { const r = el.getBoundingClientRect(); return { shot: el.dataset.shot, top: Math.round(r.top + scrollY), free: Math.round(r.height - (el.classList.contains('title-long') ? innerHeight : 0)) }; }));
const out = { dev: opt.dev || 'p390', cards, hranice: [] };
for (let i = 1; i <= 4; i++) {
  const a = cards[i - 1], b = cards[i];
  const rows = [];
  for (let y = b.top - 90; y <= b.top + 100; y += 3) {
    await page.evaluate((y) => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, y); }, y);
    await page.waitForFunction(() => window.__scrollSettled === true, null, { timeout: 5000 }).catch(() => {});
    const v = await page.evaluate(([i]) => { const c = [...document.querySelectorAll('.film-shot.is-title')]; const g = (el, n) => +el.style.getPropertyValue(n) || 0; return { y: Math.round(scrollY), o0: g(c[i - 1], '--o'), o1: g(c[i], '--o'), so0: g(c[i - 1], '--so'), so1: g(c[i], '--so') }; }, [i]);
    rows.push(v);
  }
  const noTitle = rows.filter((r) => r.o0 < 0.5 && r.o1 < 0.5).map((r) => r.y);
  const dvoj = rows.filter((r) => r.so1 > 0.05 && r.so1 < 0.95 && r.so0 > 0.5).map((r) => r.y);
  const h = { z: a.shot, do: b.shot, hranica: b.top, bez_nadpisu: noTitle.length ? [noTitle[0], noTitle[noTitle.length - 1]] : null, dvojexpozicia_so: dvoj.length ? [dvoj[0], dvoj[dvoj.length - 1]] : null };
  out.hranice.push({ ...h, rows });
  console.log(JSON.stringify(h));
}
fs.writeFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), 'merania', `pasma-${out.dev}.json`), JSON.stringify(out, null, 0));
await browser.close();
