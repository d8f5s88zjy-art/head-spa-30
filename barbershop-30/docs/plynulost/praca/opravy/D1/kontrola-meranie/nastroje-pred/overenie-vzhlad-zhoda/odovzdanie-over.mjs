#!/usr/bin/env node
// Overenie VZ-02: odovzdanie zálohy filmu (trieda world-in). Hneď ako film pridá world-in, všetky prechody CSS,
// ktoré tým vzniknú (krytie plátna, záloh, body::after), sa zastavia a potom sa ručne posúvajú po 50–100 ms;
// v každom čase snímka a jas stredného pásu. Deterministické, nezávislé od rýchlosti softvérového kreslenia.
//   node odovzdanie-over.mjs --dev=p390|d1440 [--port=8430]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const DEVS = { p390: { vp: { width: 390, height: 844 }, dsf: 3, mob: true }, d1440: { vp: { width: 1440, height: 900 }, dsf: 1, mob: false } };
const dn = opt.dev || 'p390', DEV = DEVS[dn], PORT = opt.port || 8430;
const OUT = path.resolve(path.dirname(new URL(import.meta.url).pathname), 'snimky', `odovzdanie-${dn}`);
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: DEV.vp, deviceScaleFactor: DEV.dsf, isMobile: DEV.mob, hasTouch: DEV.mob, colorScheme: 'dark' });
const page = await ctx.newPage();
await page.addInitScript(() => {
  // pri pridaní world-in zachytiť a zastaviť všetky prechody, ktoré tým vzniknú
  new MutationObserver(() => {
    const h = document.documentElement;
    if (!h || !h.classList.contains('world-in') || window.__frozen) return;
    window.__frozen = [];
    for (const a of document.getAnimations()) {
      if (!(a instanceof CSSTransition)) continue;
      a.pause(); a.currentTime = 0;
      const t = a.effect && a.effect.target, pe = a.effect && a.effect.pseudoElement;
      window.__frozen.push({ a, name: a.transitionProperty || a.animationName, el: t ? (t.className && typeof t.className === 'string' ? t.nodeName + '.' + t.className.split(' ')[0] : t.nodeName) + (pe || '') : '?', dur: a.effect.getTiming().duration, delay: a.effect.getTiming().delay, easing: a.effect.getTiming().easing });
    }
  }).observe(document, { attributes: true, subtree: true, attributeFilter: ['class'] });
});
await page.goto(`http://127.0.0.1:${PORT}/barbershop-30/?film=on&uvod=off`, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1500);
// pred filmom: len záloha
await page.screenshot({ path: path.join(OUT, 'pred.png') });
if (DEV.mob) await page.touchscreen.tap(5, 400); else await page.mouse.move(200, 300);
await page.waitForFunction(() => !!window.__frozen, null, { timeout: 120000 });
const list = await page.evaluate(() => window.__frozen.map((f) => ({ name: f.name, el: f.el, dur: f.dur, delay: f.delay, easing: f.easing, state: f.a.playState })));
console.log(JSON.stringify(list, null, 0));
// film kreslí ďalej (pohyb kamery), čakať na prvé snímky
await page.waitForTimeout(3000);
await page.evaluate(() => window.BS30_FILM.pause(true));   // posledný snímok filmu ostane, snímky obrazovky sú rýchle
await page.waitForTimeout(500);
const times = [0, 100, 200, 300, 350, 400, 450, 500, 550, 600, 700, 800, 900, 1000, 1100, 1200, 1300];
const rows = [];
for (const t of times) {
  const op = await page.evaluate((t) => {
    for (const f of window.__frozen) f.a.currentTime = t;
    const cv = document.querySelector('canvas.film-canvas');
    const still = [...document.querySelectorAll('.film-shot.is-title')][0].querySelector('.film-still');
    return { canvas: +getComputedStyle(cv).opacity, still: +getComputedStyle(still).opacity, after: +getComputedStyle(document.body, '::after').opacity };
  }, t);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const f = path.join(OUT, `t${String(t).padStart(4, '0')}.png`);
  await page.screenshot({ path: f, timeout: 120000 });
  rows.push({ t, ...op, cover: +(op.still + (1 - op.still) * op.canvas).toFixed(3), file: path.basename(f) });
  console.log(t, JSON.stringify(op), 'krytie', (op.still + (1 - op.still) * op.canvas).toFixed(3));
}
// koniec: prechody dobehnú
await page.evaluate(() => { for (const f of window.__frozen) f.a.finish(); });
await page.waitForTimeout(800);
await page.screenshot({ path: path.join(OUT, 'po.png') });
fs.writeFileSync(path.join(OUT, 'odovzdanie.json'), JSON.stringify({ dev: dn, list, rows }, null, 1));
await browser.close();
