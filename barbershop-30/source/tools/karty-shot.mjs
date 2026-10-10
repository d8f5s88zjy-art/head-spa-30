#!/usr/bin/env node
// Snímky titulných kariet: každá kotva .film-shot v tretine svojho pripnutia (karta celá, film na zábere).
//   node source/tools/karty-shot.mjs [--out=dir] [--only=mobile|desktop] [--wait=1500] [--url=...]
// Výstup: <out>/karta-<nn>-<záber>-<zariadenie>.png a prehľad <out>/karty-<zariadenie>.jpg (cez python3 PIL).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { startStaticServer, PRESETS } from '../shot.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const OUT = opt.out ? path.resolve(opt.out) : path.join(ROOT, 'docs', 'screenshots');
fs.mkdirSync(OUT, { recursive: true });
const WAIT = +(opt.wait || 1500);
const srv = opt.url ? null : await startStaticServer(ROOT);
const raw = opt.url || `${srv.origin}/index.html`;
const base = raw + (raw.includes('?') ? '&' : '?') + 'uvod=off&film=on';   // softvérové kreslenie v teste
const VIEW = { mobile: { vp: { width: 390, height: 844 }, dsf: 2, mob: true }, desktop: { vp: { width: 1440, height: 900 }, dsf: 1, mob: false } };
const browser = await chromium.launch(PRESETS[0]);
try {
  for (const [kind, v] of Object.entries(VIEW)) {
    if (opt.only && opt.only !== kind) continue;
    const ctx = await browser.newContext({ viewport: v.vp, deviceScaleFactor: v.dsf, isMobile: v.mob, hasTouch: v.mob, colorScheme: 'dark' });
    const page = await ctx.newPage();
    const errs = []; page.on('pageerror', (e) => errs.push(e.message));
    await page.goto(base, { waitUntil: 'load', timeout: 90000 });
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.waitForFunction(() => document.documentElement.classList.contains('world-in'), null, { timeout: 60000 }).catch(() => {});
    const n = await page.evaluate(() => document.querySelectorAll('.film-shot').length);
    const files = [];
    for (let i = 0; i < n; i++) {
      const a = await page.evaluate((i) => { const el = document.querySelectorAll('.film-shot')[i]; const r = el.getBoundingClientRect(); const long = el.classList.contains('title-long'); const free = r.height - (long ? innerHeight : 0); return { shot: el.dataset.shot, y: i === 0 ? 0 : r.top + scrollY + free * 0.35 }; }, i);
      await page.evaluate((y) => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, y); }, a.y);
      await page.waitForFunction(() => window.__scrollSettled === true, null, { timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(WAIT);
      const f = path.join(OUT, `karta-${String(i).padStart(2, '0')}-${a.shot}-${kind}.png`);
      await page.screenshot({ path: f }); files.push(f);
      const st = await page.evaluate(() => { const s = window.BS30_FILM && window.BS30_FILM.state; return s ? { S: +(s.S || 0).toFixed(2), cur: s.current } : {}; });
      console.log(kind, i, a.shot, JSON.stringify(st));
    }
    if (errs.length) console.log('chyby:', errs.slice(0, 3));
    execFileSync('python3', ['-I', '-c', `
import sys
from PIL import Image
fs=sys.argv[2:]; ims=[Image.open(f).convert('RGB') for f in fs]
for i in ims: i.thumbnail((390 if ${v.mob ? 1 : 0} else 720, 844))
w=max(i.width for i in ims); h=max(i.height for i in ims); cols=7 if ${v.mob ? 1 : 0} else 3
rows=(len(ims)+cols-1)//cols; sh=Image.new('RGB',(cols*(w+6),rows*(h+6)),'black')
for k,i in enumerate(ims): sh.paste(i,((k%cols)*(w+6),(k//cols)*(h+6)))
sh.save(sys.argv[1],quality=84)`, path.join(OUT, `karty-${kind}.jpg`), ...files]);
    await ctx.close();
  }
} finally { await browser.close(); if (srv) srv.server.close(); }
