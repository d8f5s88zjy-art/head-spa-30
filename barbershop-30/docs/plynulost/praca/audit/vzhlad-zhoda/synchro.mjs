#!/usr/bin/env node
// Súlad textu karty a strihu filmu: kotvy filmu (BS30_FILM.state.anchors), horné okraje kotiev kariet a pre každú
// hranicu poloha skrolu, kde (a) starý text zmizne, (b) nový text nabehne, (c) film strihá (okno prelínania).
//   node synchro.mjs --dev=p390|d1440 [--port=8211]
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const D = { p390: { vp: { width: 390, height: 844 }, mob: true }, d1440: { vp: { width: 1440, height: 900 }, mob: false } }[opt.dev || 'p390'];
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await b.newContext({ viewport: D.vp, deviceScaleFactor: 1, isMobile: D.mob, hasTouch: D.mob });
const p = await ctx.newPage();
await p.goto(`http://127.0.0.1:${opt.port || 8211}/barbershop-30/?film=on&uvod=off`, { waitUntil: 'load' });
if (D.mob) await p.touchscreen.tap(5, 400); else await p.mouse.move(100, 100);
await p.waitForFunction(() => document.documentElement.classList.contains('world-in'), null, { timeout: 120000 });
await p.waitForTimeout(1500);
const r = await p.evaluate(() => {
  const st = window.BS30_FILM.state, vh = innerHeight, A = st.anchors;
  const cards = [...document.querySelectorAll('.film-shot.is-title')].map((el) => { const r = el.getBoundingClientRect(); const top = r.top + scrollY; const long = el.classList.contains('title-long'); const free = r.height - (long ? vh : 0); return { shot: el.dataset.shot, top: Math.round(top), free: Math.round(free), long }; });
  return { vh, anchors: A.map(Math.round), path: st.ready.map((x) => x.shot), cards };
});
// pre každú hranicu kariet: textová výmena [top − 0,08·free_prev, top + 0,12·free] vs. okno strihu filmu
const out = [];
for (let i = 1; i < r.cards.length; i++) {
  const c = r.cards[i], pc = r.cards[i - 1];
  const k = r.path.findIndex((s) => s === c.shot || s === c.shot + '-m' || s.startsWith(c.shot + '-')) ;
  if (k < 1) continue;
  const a0 = r.anchors[k - 1], a1 = r.anchors[k], gap = a1 - a0, span = Math.min(0.3, Math.max(0.16, 0.55 * r.vh / gap));
  // horný okraj kotvy, pri páse pred kartou o 1,5 okna skôr (film.js:960)
  const prevBand = await p.evaluate((shot) => { const el = document.querySelector(`.film-shot[data-shot="${shot}"]`); const prev = el.previousElementSibling || (el.parentElement.previousElementSibling || {}).lastElementChild; return !!(prev && prev.classList && prev.classList.contains('band')); }, c.shot);
  const cut = c.top - (prevBand ? 1.5 * r.vh : 0);
  const cc = Math.min(1 - span / 2 - 0.02, Math.max(span / 2 + 0.02, (cut - a0) / gap));
  out.push({ z: pc.shot, do: c.shot, pas_pred: prevBand,
    text_von: [Math.round(c.top - 0.08 * pc.free), c.top], text_dnu: [c.top, Math.round(c.top + 0.12 * c.free)],
    film_strih: [Math.round(a0 + (cc - span / 2) * gap), Math.round(a0 + (cc + span / 2) * gap)] });
}
fs.writeFileSync(`merania/synchro-${opt.dev || 'p390'}.json`, JSON.stringify({ ...r, hranice: out }, null, 1));
for (const o of out) console.log(`${o.z} → ${o.do}${o.pas_pred ? ' (pás)' : ''}: text von ${o.text_von} dnu ${o.text_dnu} | film strih ${o.film_strih}`);
await b.close();
