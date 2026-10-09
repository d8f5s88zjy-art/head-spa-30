#!/usr/bin/env node
// Kontrola, že poster scény 1 a živé 3D javisko na seba nadväzujú bez skoku:
//   C = samotný CSS gradient .stage-bg (poster aj canvas skryté)
//   A = poster (?motion=off, text skrytý)
//   B = živé 3D (motion=on, po prvom frame, text skrytý, poster skrytý)
// Porovnáva (1) podklad: poster vs CSS gradient v oblasti bez kresla (musí byť takmer identický),
//          (2) celý záber poster vs 3D (kreslo sa líši len jemne – AA, DPR).
//   node source/tools/poster-check.mjs [--only=desktop|mobile]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { startStaticServer, PRESETS } from '../shot.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const only = (process.argv.find((a) => a.startsWith('--only=')) || '').split('=')[1];
const outDir = fs.mkdtempSync(path.join(process.env.CLAUDE_SCRATCHPAD || os.tmpdir(), 'poster-check-'));
const VIEWPORTS = { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } };
const HIDE_TEXT = '.scene-sticky,.site-header,.story-line,.mobile-cta,.scroll-hint{visibility:hidden !important} html{scroll-behavior:auto !important}';

const srv = await startStaticServer(ROOT);
const browser = await chromium.launch(PRESETS[0]);
const results = [];
try {
  for (const [kind, vp] of Object.entries(VIEWPORTS)) {
    if (only && only !== kind) continue;
    const mk = () => browser.newContext({ viewport: vp, deviceScaleFactor: 1, isMobile: kind === 'mobile', hasTouch: kind === 'mobile', colorScheme: 'dark' });
    const shots = {};
    // A: poster
    for (const [key, query, css] of [
      ['A', '?motion=off', HIDE_TEXT],
      ['B', '', HIDE_TEXT],
      ['C', '?motion=off', HIDE_TEXT + ' .stage-poster,.stage-canvas{display:none !important}'],
    ]) {
      const ctx = await mk();
      const page = await ctx.newPage();
      await page.goto(`${srv.origin}/index.html${query}`, { waitUntil: 'load', timeout: 60000 });
      await page.waitForFunction(() => window.__renderDone !== false, null, { timeout: 60000 });
      await page.addStyleTag({ content: css });
      if (key === 'A') await page.waitForFunction(() => { const i = document.querySelector('#stage-poster img'); return i && i.complete && i.naturalWidth > 0; });
      await page.waitForTimeout(key === 'B' ? 2500 : 600); // B: po úvodnom prejazde svetla (1,4 s) sa kreslo vráti do kľúčovej polohy
      const file = path.join(outDir, `${key}-${kind}.png`);
      await page.screenshot({ path: file });
      shots[key] = file;
      await ctx.close();
    }
    const py = `
import sys
from PIL import Image, ImageChops
import numpy as np
A,B,C=[np.asarray(Image.open(p).convert('RGB')).astype(np.int16) for p in sys.argv[1:4]]
h,w,_=A.shape
# oblasť bez kresla: kreslo je v pravej časti (desktop) / spodnej polovici (mobil) -> porovnaj ľavých 35 % hore 45 %
if w>h: reg=(slice(0,h),slice(0,int(w*0.40)))
else:   reg=(slice(0,int(h*0.40)),slice(0,w))
d_bg=np.abs(A[reg]-C[reg]); d_all=np.abs(A-B)
print('bg  poster vs css gradient: mean %.3f  p99 %d  max %d'%(d_bg.mean(), np.percentile(d_bg,99), d_bg.max()))
print('all poster vs live 3D     : mean %.3f  p99 %d'%(d_all.mean(), np.percentile(d_all,99)))
`;
    const r = spawnSync('python3', ['-I', '-c', py, shots.A, shots.B, shots.C], { encoding: 'utf-8' });
    console.log(`${kind}: ${shots.A.replace(/A-/, '{A,B,C}-')}`);
    console.log(r.stdout.trim() || r.stderr);
    results.push({ kind, ...shots });
  }
} finally {
  await browser.close();
  srv.server.close();
}
