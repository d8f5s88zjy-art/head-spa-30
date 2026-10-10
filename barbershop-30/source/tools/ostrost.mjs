#!/usr/bin/env node
// Ostrosť filmu: snímky toho istého záberu z dvoch adries (napr. naživo stará verzia vs. lokálna nová)
// na telefóne 390×844 @3x a na počítači 1440×900 @2x, film na rovnakej polohe (BS30_FILM.goTo), a
// číslo ostrosti (rozptyl Laplaciánu v strede obrazu) cez source/tools/ostrost.py.
//
//   node source/tools/ostrost.mjs --a=https://.../barbershop-30/ --b=http://127.0.0.1:8765/ [--out=dir] [--shots=sala,kreslo]
//
// Výstup: <out>/<a|b>-<zariadenie>-<záber>.png a tabuľka ostrosti.
import path from 'node:path';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { startStaticServer, PRESETS } from '../shot.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const OUT = opt.out ? path.resolve(opt.out) : path.join(ROOT, 'docs', 'screenshots', 'ostrost');
fs.mkdirSync(OUT, { recursive: true });
const SHOTS = (opt.shots || 'sala,kreslo,recepcia').split(',');
const srv = opt.b ? null : await startStaticServer(ROOT);
const URLS = { a: opt.a, b: opt.b || `${srv.origin}/` };
const DEV = { mobil: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }, desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 } };

const browser = await chromium.launch(PRESETS[0]);
const files = [];
try {
  for (const [dev, cfg] of Object.entries(DEV)) {
    for (const [key, base] of Object.entries(URLS)) {
      if (!base) continue;
      const ctx = await browser.newContext({ ...cfg, colorScheme: 'dark' });
      const page = await ctx.newPage();
      const errs = [];
      page.on('pageerror', (e) => errs.push(e.message));
      await page.goto(base + (base.includes('?') ? '&' : '?') + 'uvod=off&film=on&v=' + key + dev, { waitUntil: 'load', timeout: 90000 });
      await page.addStyleTag({ content: 'html{scroll-behavior:auto !important}' });
      // film sa spustí pohybom: skrol o kúsok a späť
      await page.evaluate(() => { window.scrollTo(0, 10); window.scrollTo(0, 0); });
      try { await page.waitForFunction(() => document.documentElement.classList.contains('world-in'), null, { timeout: 40000 }); }
      catch { console.log(`${key} ${dev}: film sa nerozbehol`, errs.slice(0, 2)); await ctx.close(); continue; }
      for (const shot of SHOTS) {
        const ok = await page.evaluate((s) => window.BS30_FILM.goTo(s, 0.5), shot);
        // počkať, kým je záber načítaný v cieľovej veľkosti a nakreslený (bez prelínania)
        try { await page.waitForFunction((s) => { const st = window.BS30_FILM.state; const r = st.ready.find((x) => x.shot === s || x.shot === s + '-m'); return r && r.ready && !r.loading && st.mix === 0 && st.current && (st.current === s || st.current === s + '-m'); }, shot, { timeout: 40000 }); } catch { console.log(`${key} ${dev} ${shot}: záber nedobehol`); }
        await page.waitForTimeout(1500);
        const info = await page.evaluate((s) => { const st = window.BS30_FILM.state; const r = st.ready.find((x) => x.shot === s || x.shot === s + '-m'); return { photo: r && r.shot, size: r && r.size, dpr: st.dpr, cap: st.cap }; }, shot);
        const file = path.join(OUT, `${key}-${dev}-${shot}.png`);
        await page.screenshot({ path: file });
        files.push({ key, dev, shot, file, ...info, ok });
      }
      await ctx.close();
    }
  }
} finally { await browser.close(); if (srv) srv.server.close(); }
const py = spawnSync('python3', ['-I', path.join(ROOT, 'source', 'tools', 'ostrost.py'), ...files.map((f) => f.file)], { encoding: 'utf-8' });
const sharp = Object.fromEntries((py.stdout || '').trim().split('\n').filter(Boolean).map((l) => { const [f, v] = l.split('\t'); return [f, parseFloat(v)]; }));
for (const f of files) console.log(`${f.key.padEnd(2)} ${f.dev.padEnd(8)} ${f.shot.padEnd(9)} záber=${f.photo} ${f.size}px dpr=${f.dpr}${f.cap ? ' (30 fps)' : ''}  ostrosť=${sharp[f.file] ?? '?'}`);
if (py.stderr) console.error(py.stderr.slice(0, 500));
