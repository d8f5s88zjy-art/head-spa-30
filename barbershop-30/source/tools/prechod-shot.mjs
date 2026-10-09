#!/usr/bin/env node
// Prechod medzi zábermi: snímky prechodu zastaveného na daných polohách (BS30_FILM.fadeFreeze) na
// desktope aj mobile, pre dvojice záberov (predvolene sala -> kreslo a sud -> vstup).
//
//   node source/tools/prechod-shot.mjs [--out=dir] [--pairs=sala,sud] [--only=desktop|mobile] [--url=http://...]
//
// Výstup: <out>/prechod-<záber>-<zariadenie>-m<mix>.png + pás prechod-<záber>-<zariadenie>.jpg (cez ostrost.py nie)
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { startStaticServer, PRESETS } from '../shot.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const OUT = opt.out ? path.resolve(opt.out) : path.join(ROOT, 'docs', 'screenshots');
fs.mkdirSync(OUT, { recursive: true });
const PAIRS = (opt.pairs || 'sala,sud').split(',');
const MIXES = [0, 0.25, 0.5, 0.75, 1];
const VIEW = { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } };
const srv = opt.url ? null : await startStaticServer(ROOT);
const base = opt.url || `${srv.origin}/index.html`;
const browser = await chromium.launch(PRESETS[0]);
try {
  for (const [kind, vp] of Object.entries(VIEW)) {
    if (opt.only && opt.only !== kind) continue;
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1, isMobile: kind === 'mobile', hasTouch: kind === 'mobile', colorScheme: 'dark' });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push(e.message));
    await page.goto(base + '?uvod=off', { waitUntil: 'load', timeout: 60000 });
    await page.addStyleTag({ content: 'html{scroll-behavior:auto !important}' });
    await page.evaluate(() => { window.scrollTo(0, 10); window.scrollTo(0, 0); });
    try { await page.waitForFunction(() => document.documentElement.classList.contains('world-in'), null, { timeout: 40000 }); }
    catch { console.log(`${kind}: film sa nerozbehol`, errs); await ctx.close(); continue; }
    for (const shot of PAIRS) {
      await page.evaluate((s) => window.BS30_FILM.goTo(s, 0.5), shot);
      // aktuálny aj nasledujúci záber načítané
      try { await page.waitForFunction((s) => { const st = window.BS30_FILM.state; const i = st.ready.findIndex((x) => x.shot === s || x.shot === s + '-m'); const n = st.ready[i + 1]; return i >= 0 && st.ready[i].ready && n && n.ready && !n.loading; }, shot, { timeout: 40000 }); } catch { console.log(`${kind} ${shot}: susedný záber nedobehol`); }
      for (const m of MIXES) {
        await page.evaluate((v) => window.BS30_FILM.fadeFreeze(v), m);
        await page.waitForTimeout(900);
        const st = await page.evaluate(() => { const s = window.BS30_FILM.state; return { S: +s.S.toFixed(2), mix: +s.mix.toFixed(2), cur: s.current }; });
        const file = path.join(OUT, `prechod-${shot}-${kind}-m${String(Math.round(m * 100)).padStart(3, '0')}.png`);
        await page.screenshot({ path: file });
        console.log(`${kind} ${shot} mix=${m}: S=${st.S} mix=${st.mix} záber=${st.cur} -> ${path.basename(file)}`);
      }
      await page.evaluate(() => window.BS30_FILM.fadeFreeze(null));
    }
    if (errs.length) console.log('chyby:', errs.slice(0, 3));
    await ctx.close();
  }
} finally { await browser.close(); if (srv) srv.server.close(); }
