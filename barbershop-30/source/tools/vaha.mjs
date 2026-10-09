#!/usr/bin/env node
// Váha prvého obrazu: koľko bajtov sa prenesie do udalosti load (bez filmu) a koľko navyše stiahne
// prológ (three.js + dva zábery s hĺbkou), na desktope aj mobile. Čísla idú do docs/CHECKS.md.
//
//   node source/tools/vaha.mjs [--url=http://...]

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { startStaticServer, PRESETS } from '../shot.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const srv = opt.url ? null : await startStaticServer(ROOT);
const base = opt.url || `${srv.origin}/index.html`;
const VIEW = { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } };
const kb = (n) => (n / 1024).toFixed(0) + ' KB';

const browser = await chromium.launch(PRESETS[0]);
try {
  for (const [kind, vp] of Object.entries(VIEW)) {
    for (const mode of ['bez filmu (?film=off)', 's prológom']) {
      const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: kind === 'mobile' ? 3 : 1, isMobile: kind === 'mobile', hasTouch: kind === 'mobile', colorScheme: 'dark' });
      const page = await ctx.newPage();
      const rows = [];
      page.on('response', async (r) => {
        try { const b = await r.body(); rows.push({ url: r.url(), bytes: b.length, type: (r.headers()['content-type'] || '').split(';')[0] }); } catch { /* zrušené */ }
      });
      await page.goto(base + (mode.startsWith('bez') ? '?film=off' : ''), { waitUntil: 'load', timeout: 60000 });
      const atLoad = rows.reduce((a, r) => a + r.bytes, 0);
      let extra = 0;
      if (!mode.startsWith('bez')) {
        try { await page.waitForFunction(() => document.documentElement.classList.contains('world-in'), null, { timeout: 20000 }); } catch { /* bez filmu */ }
        await page.waitForTimeout(2500);
        extra = rows.reduce((a, r) => a + r.bytes, 0) - atLoad;
      }
      const byType = {};
      for (const r of rows) byType[r.type || '?'] = (byType[r.type || '?'] || 0) + r.bytes;
      const big = rows.filter((r) => r.bytes > 40000).sort((a, b) => b.bytes - a.bytes).slice(0, 6).map((r) => `${path.basename(r.url.split('?')[0])} ${kb(r.bytes)}`);
      console.log(`${kind} · ${mode}: do load ${kb(atLoad)}${extra ? `, prológ navyše ${kb(extra)} (spolu ${kb(atLoad + extra)})` : ''}`);
      console.log('   podľa typu: ' + Object.entries(byType).map(([t, n]) => `${t} ${kb(n)}`).join(' · '));
      console.log('   najväčšie: ' + big.join(' · '));
      await ctx.close();
    }
  }
} finally {
  await browser.close();
  if (srv) srv.server.close();
}
