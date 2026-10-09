#!/usr/bin/env node
// Snímky stredu každej zo 7 scén (+ medzistavy crossfade) pre desktop 1440×900 a mobil 390×844.
//
//   node source/tools/scenes-shot.mjs                      # všetko -> docs/screenshots/scena-*.png
//   node source/tools/scenes-shot.mjs --only=desktop --scenes=1,2,2a
//   node source/tools/scenes-shot.mjs --out=/tmp/iter1 --wait=800
//
// Výstup: <out>/scena-<id>-{desktop,mobile}.png, kde id ∈ 1, 1b, 2, 2a, 2b, 3, 3a, 3b, 3c, 4, 4a, 5, 5a, 6, 6a, 7.
//  - filmové scény (1, 2, 3, 7): scroll na lokálne t (t = (scrollY − top) / (výška − viewport)), stred = t 0.5
//  - toková scéna (4, 5, 6): stred sekcie v strede viewportu; 4a/5a/6a = začiatok sekcie (hlavička)
//  - 1 = t 0 (prvý dojem), 1b = t 0.5 (nájazd kamery)
//  - 2a (t2 0.80) = prelínanie 3D → fotografia kresla, 2b (t2 0.94) = fotografia kresla → fotografia nástrojov
//  - 3a/3b/3c (t3 0.16 / 0.47 / 0.84) = tri fotografie priestoru
// Scroll: window.scrollTo({top, behavior:'instant'}) + dočasne html{scroll-behavior:auto}; po scrolle sa čaká 800 ms.
// Vypíše aj namerané rozmery sekcií (offsetTop/výška) a stav (--p, --t*, data-scene-active).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { startStaticServer, PRESETS } from '../shot.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const VIEWPORTS = { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } };

// id -> { section, t } (film) | { section, mid: true } (flow)
const SHOTS = {
  1: { section: 'uvod', t: 0.0 },
  '1b': { section: 'uvod', t: 0.5 },
  2: { section: 'remeslo', t: 0.55 },
  '2a': { section: 'remeslo', t: 0.8 },
  '2b': { section: 'remeslo', t: 0.94 },
  3: { section: 'miesto', t: 0.5 },
  '3a': { section: 'miesto', t: 0.16 },
  '3b': { section: 'miesto', t: 0.47 },
  '3c': { section: 'miesto', t: 0.84 },
  '4a': { section: 'tim', head: true },
  4: { section: 'tim', mid: true },
  '5a': { section: 'sluzby', head: true },
  5: { section: 'sluzby', mid: true },
  '6a': { section: 'galeria', head: true },
  6: { section: 'galeria', mid: true },
  7: { section: 'rezervacia', t: 0.75 },
};

const args = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const out = path.resolve(args.out || path.join(ROOT, 'docs', 'screenshots'));
const wait = Number(args.wait || 800);
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
    await page.waitForTimeout(1200);

    const metrics = await page.evaluate(() => {
      const y = window.scrollY, o = {};
      for (const el of document.querySelectorAll('.scene[data-scene]')) {
        const r = el.getBoundingClientRect();
        o[el.id] = { top: Math.round(r.top + y), height: Math.round(r.height) };
      }
      o.vh = window.innerHeight; o.docH = document.documentElement.scrollHeight;
      return o;
    });
    console.log(`${kind}: ${JSON.stringify(metrics)}`);

    for (const id of ids) {
      const def = SHOTS[id];
      if (!def) { console.warn('neznáma scéna', id); continue; }
      const m = metrics[def.section];
      const vh = metrics.vh;
      const y = def.head ? m.top - 64 : def.mid ? m.top + m.height / 2 - vh / 2 : m.top + def.t * Math.max(0, m.height - vh);
      await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), Math.round(y));
      await page.waitForTimeout(wait);
      // lerp režiséra v SwiftShaderi dobieha pomaly – počkaj, kým sa stav ustáli, a potom na vykreslenie snímky
      await page.waitForFunction(() => window.__scrollSettled === true, null, { timeout: 90000 }).catch(() => logs.push(`[shot] ${id}: scroll sa neustálil`));
      await page.waitForTimeout(700);
      const st = await page.evaluate(() => {
        const cs = getComputedStyle(document.documentElement);
        return { y: Math.round(scrollY), p: cs.getPropertyValue('--p'), t1: cs.getPropertyValue('--t1'), t2: cs.getPropertyValue('--t2'), t3: cs.getPropertyValue('--t3'), t7: cs.getPropertyValue('--t7'), active: document.documentElement.dataset.sceneActive, webgl: document.documentElement.dataset.webgl };
      });
      const file = path.join(out, `scena-${id}-${kind}.png`);
      await page.screenshot({ path: file });
      console.log(`  ${id.padEnd(3)} y=${st.y} p=${st.p} t1=${st.t1} t2=${st.t2} t3=${st.t3} t7=${st.t7} scene=${st.active} webgl=${st.webgl} -> ${path.basename(file)}`);
    }
    for (const l of logs) console.log('   ', l);
    await ctx.close();
  }
} finally {
  await browser.close();
  srv.server.close();
}
