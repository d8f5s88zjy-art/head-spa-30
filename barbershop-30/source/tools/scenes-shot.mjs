#!/usr/bin/env node
// Snímky prehliadky (9 sekcií, 13 kotiev .film-shot) pre desktop 1440×900 a mobil 390×844.
//
//   node source/tools/scenes-shot.mjs                        # všetko -> docs/screenshots/scena-*.png
//   node source/tools/scenes-shot.mjs --only=desktop --scenes=1,3,3x
//   node source/tools/scenes-shot.mjs --out=/tmp/iter1 --wait=800 --query=?film=off
//
// Výstup: <out>/scena-<id>-{desktop,mobile}.png
//  - <n>      = prvá kotva sekcie n (1–9), horný okraj kotvy na hornom okraji okna = záber cez celú obrazovku
//  - <n>b     = druhá kotva sekcie (3b kreslo, 4b naradie, 5b cakaren, 8c sud) alebo pás sekcie (2b fakty, 6b tím, 8b galéria)
//  - <n>x     = prelínanie: polovica vzdialenosti medzi kotvou n a nasledujúcou kotvou (tam film prelína zábery)
//  - 7m       = cenník uprostred (doska scrolluje nad prilepenou zálohou), 9f = pätička
// Scroll: window.scrollTo({top, behavior:'instant'}) + dočasne html{scroll-behavior:auto}; čaká sa na
// window.__scrollSettled (režisér dobehol) a potom ešte `wait` ms. Vypíše polohy kotiev, --p, --sp a data-scene-active.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { startStaticServer, PRESETS } from '../shot.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const VIEWPORTS = { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } };

// id -> { shot: index kotvy v dokumente } | { shot, cross: true } | { band: selektor } | { sel, t }
// kotvy v poradí dokumentu: 0 vstup, 1 recepcia, 2 sala, 3 kreslo, 4 stol, 5 naradie, 6 zadna, 7 cakaren,
//                           8 sala-rano, 9 kreslo-stred, 10 kava, 11 sud, 12 vstup (rezervácia)
const SHOTS = {
  1: { shot: 0 },
  '1x': { shot: 0, cross: true },
  2: { shot: 1 },
  '2b': { band: '#recepcia .band' },
  3: { shot: 2 },
  '3x': { shot: 2, cross: true },
  '3b': { shot: 3 },
  4: { shot: 4 },
  '4x': { shot: 4, cross: true },
  '4b': { shot: 5 },
  5: { shot: 6 },
  '5b': { shot: 7 },
  6: { shot: 8 },
  '6b': { band: '#tim .band' },
  7: { shot: 9 },
  '7m': { sel: '#sluzby .film-shot', t: 0.5 },
  8: { shot: 10 },
  '8b': { band: '#galeria .band' },
  '8c': { shot: 11 },
  '8x': { shot: 11, cross: true },
  9: { shot: 12 },
  '9f': { sel: '.site-footer', t: 1 },
};

const args = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const out = path.resolve(args.out || path.join(ROOT, 'docs', 'screenshots'));
const wait = Number(args.wait || 700);
const only = args.only;
const ids = args.scenes ? String(args.scenes).split(',') : Object.keys(SHOTS);
const query = args.query || '';
fs.mkdirSync(out, { recursive: true });

const srv = await startStaticServer(ROOT);
const browser = await chromium.launch(PRESETS[0]);
try {
  for (const [kind, vp] of Object.entries(VIEWPORTS)) {
    if (only && only !== kind) continue;
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1, isMobile: kind === 'mobile', hasTouch: kind === 'mobile', colorScheme: 'dark', reducedMotion: 'no-preference' });
    const page = await ctx.newPage();
    const logs = [];
    page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`[${m.type()}] ${m.text()}`); });
    page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
    await page.goto(`${srv.origin}/index.html${query}`, { waitUntil: 'load', timeout: 60000 });
    await page.waitForFunction(() => window.__renderDone !== false, null, { timeout: 60000 }).catch(() => logs.push('[shot] timeout __renderDone'));
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({ content: 'html{scroll-behavior:auto !important}' });
    // film (ak existuje a beží): počkaj na prvý snímok alebo na zlyhanie, najviac 20 s
    const world = await page.evaluate(() => document.documentElement.classList.contains('world'));
    if (world) {
      await page.mouse.move(10, 10); // film sa spúšťa až po pohybe návštevníka
      await page.waitForFunction(() => /world-(in|off)/.test(document.documentElement.className), null, { timeout: 20000 }).catch(() => logs.push('[shot] film nedal world-in ani world-off do 20 s'));
    }
    await page.waitForTimeout(800);

    const metrics = await page.evaluate(() => {
      const y = window.scrollY, o = { shots: [], sections: {} };
      for (const el of document.querySelectorAll('.film-shot')) {
        const r = el.getBoundingClientRect();
        o.shots.push({ name: el.dataset.shot, top: Math.round(r.top + y), height: Math.round(r.height) });
      }
      for (const el of document.querySelectorAll('section[data-scene]')) {
        const r = el.getBoundingClientRect();
        o.sections[el.id] = { top: Math.round(r.top + y), height: Math.round(r.height) };
      }
      o.vh = window.innerHeight; o.docH = document.documentElement.scrollHeight;
      o.world = document.documentElement.className;
      return o;
    });
    console.log(`${kind}: vh=${metrics.vh} docH=${metrics.docH} html.class="${metrics.world}"`);
    console.log(`  kotvy: ${metrics.shots.map((s, i) => `${i}:${s.name}@${s.top}/${s.height}`).join(' ')}`);

    for (const id of ids) {
      const def = SHOTS[id];
      if (!def) { console.warn('neznáma scéna', id); continue; }
      let y = 0;
      if (def.shot !== undefined) {
        const s = metrics.shots[def.shot], n = metrics.shots[def.shot + 1];
        y = def.cross && n ? (s.top + n.top) / 2 : s.top;
      } else if (def.band) {
        y = await page.evaluate((sel) => { const el = document.querySelector(sel); return el ? el.getBoundingClientRect().top + scrollY - 64 : 0; }, def.band);
      } else if (def.sel) {
        y = await page.evaluate(([sel, t]) => { const el = document.querySelector(sel); if (!el) return 0; const r = el.getBoundingClientRect(); return r.top + scrollY + t * Math.max(0, r.height - innerHeight); }, [def.sel, def.t]);
      }
      await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), Math.round(y));
      await page.waitForTimeout(wait);
      await page.waitForFunction(() => window.__scrollSettled === true, null, { timeout: 90000 }).catch(() => logs.push(`[shot] ${id}: scroll sa neustálil`));
      await page.waitForTimeout(500);
      const st = await page.evaluate(() => {
        const cs = getComputedStyle(document.documentElement);
        const near = [...document.querySelectorAll('.film-shot')].map((el) => ({ n: el.dataset.shot, r: el.getBoundingClientRect(), sp: el.style.getPropertyValue('--sp') })).filter((s) => s.r.bottom > 0 && s.r.top < innerHeight).map((s) => `${s.n}:${s.sp || '-'}`);
        return { y: Math.round(scrollY), p: cs.getPropertyValue('--p').trim(), active: document.documentElement.dataset.sceneActive, near: near.join(' ') };
      });
      const file = path.join(out, `scena-${id}-${kind}.png`);
      await page.screenshot({ path: file });
      console.log(`  ${String(id).padEnd(3)} y=${st.y} p=${st.p} scene=${st.active} [${st.near}] -> ${path.basename(file)}`);
    }
    for (const l of logs) console.log('   ', l);
    await ctx.close();
  }
} finally {
  await browser.close();
  srv.server.close();
}
