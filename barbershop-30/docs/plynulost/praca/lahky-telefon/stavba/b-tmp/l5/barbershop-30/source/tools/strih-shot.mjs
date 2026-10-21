#!/usr/bin/env node
// Snímky zastavených strihov (BS30_FILM.cutFreeze) na počítači 1440×900 a telefóne 390×844 @2 a prehľad.
//   node source/tools/strih-shot.mjs [--only=desktop|mobile] [--cuts=pro,rohozka,...] [--mixes=0,0.5,1] [--out=dir] [--content]
// Strih sa vyberá podľa záberu, z ktorého ide (pro = prológ). Na telefóne sú tri zábery videá (meno-video).
// Výstup: <out>/<odkiaľ>-<zariadenie>-m<mix>.png, prehľad <out>/strihy-<zariadenie>.jpg; chyby konzoly do <out>/konzola.txt
import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
// pomocník je v tom istom strome (nie pevná cesta ku klonu repozitára), aby test išiel v každom pracovnom strome
const { startStaticServer, PRESETS } = await import(new URL('../shot.mjs', import.meta.url).href);
const require = createRequire('/home/user/head-spa-30/barbershop-30/source/shot.mjs');
const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const OUT = path.resolve(opt.out || path.join(SITE, 'docs', 'screenshots', 'strihy'));
fs.mkdirSync(OUT, { recursive: true });
const MIXES = (opt.mixes || '0,0.2,0.35,0.5,0.65,0.8,1').split(',').map(Number);
const ALL = {
  desktop: ['pro', 'rohozka', 'sala', 'stol', 'cakaren', 'sala-rano', 'kreslo-stred', 'kava', 'sud'],
  mobile: ['pro', 'rohozka', 'sala-video', 'stol-video', 'cakaren', 'sala-rano-video', 'kreslo-stred', 'kava', 'sud'],
};
const VIEW = { desktop: { width: 1440, height: 900, dpr: 1 }, mobile: { width: 390, height: 844, dpr: 2 } };
const srv = await startStaticServer(SITE);
const browser = await chromium.launch(PRESETS[0]);
const log = [];
const hide = 'html{scroll-behavior:auto !important} body > *:not(.film-canvas){visibility:hidden !important} .film-place,.film-bars{display:none !important}';
async function open(kind, q) {
  const vp = VIEW[kind];
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.dpr, isMobile: kind === 'mobile', hasTouch: kind === 'mobile', colorScheme: 'dark' });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => log.push(`${kind} pageerror ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') log.push(`${kind} ${m.type()} ${m.text()}`); });
  await page.goto(`${srv.origin}/index.html?${q}&film=on`, { waitUntil: 'load', timeout: 60000 });
  await page.addStyleTag({ content: opt.content ? 'html{scroll-behavior:auto !important}' : hide });
  await page.evaluate(() => { window.scrollTo(0, 10); window.scrollTo(0, 0); });
  await page.waitForFunction(() => document.documentElement.classList.contains('world-in'), null, { timeout: 60000 });
  return { ctx, page };
}
const readyBoth = async (page, name) => page.waitForFunction((n) => {
  const st = window.BS30_FILM.state; const r = st.ready;
  const i = n === 'pro' ? 0 : r.findIndex((x, k) => k > 0 && (x.shot === n || x.shot === n + '-m'));
  return i >= 0 && r[i].ready && r[i + 1] && r[i + 1].ready && !r[i + 1].loading && !r[i].loading;
}, name, { timeout: 60000 });
try {
  for (const kind of Object.keys(VIEW)) {
    if (opt.only && opt.only !== kind) continue;
    let cur = null;
    const files = [];
    for (const name of (opt.cuts ? opt.cuts.split(',') : ALL[kind])) {
      const q = name === 'pro' ? 'uvod=znova' : 'uvod=off';
      if (!cur || cur.q !== q) { if (cur) await cur.ctx.close(); cur = { q, ...(await open(kind, q)) }; }
      const { page } = cur;
      if (name === 'pro') await page.waitForFunction(() => window.BS30_FILM.state.pro, null, { timeout: 30000 }).catch(() => {});
      const ok = await page.evaluate((n) => window.BS30_FILM.cutFreeze(n, 0.5), name);
      if (!ok) { log.push(`${kind} ${name}: cutFreeze false`); continue; }
      try { await readyBoth(page, name); } catch { log.push(`${kind} ${name}: zábery nedobehli`); }
      await page.waitForTimeout(700);                                // nábeh práve načítanej fotky (450 ms)
      for (const m of MIXES) {
        const f0 = await page.evaluate(([n, v]) => { window.BS30_FILM.cutFreeze(n, v); return window.BS30_FILM.state.frames; }, [name, m]);
        // softvérová grafika kreslí pomaly: čakať, kým sa nakreslia aspoň tri snímky v novej polohe
        await page.waitForFunction((f) => window.BS30_FILM.state.frames >= f + 3, f0, { timeout: 30000, polling: 100 }).catch(() => log.push(`${kind} ${name} ${m}: snímky nedobehli`));
        const st = await page.evaluate(() => { const s = window.BS30_FILM.state; return { S: +s.S.toFixed(3), mix: +s.mix.toFixed(3), cut: s.cut, cur: s.current }; });
        const file = path.join(OUT, `${name}-${kind}-m${String(Math.round(m * 100)).padStart(3, '0')}.png`);
        await page.evaluate(() => window.BS30_FILM.pause(true));
        await page.waitForTimeout(150);
        await page.screenshot({ path: file, timeout: 120000 }); files.push([name, m, file]);
        await page.evaluate(() => window.BS30_FILM.pause(false));
        console.log(kind, name, m, JSON.stringify(st));
      }
    }
    if (cur) await cur.ctx.close();
    // prehľad: riadok na strih, stĺpec na mix
    execFileSync('python3', ['-I', '-c', `
import sys, json
from PIL import Image, ImageDraw
rows = {}
for n, m, f in json.loads(sys.argv[2]): rows.setdefault(n, []).append((m, f))
W = 300 if ${kind === 'mobile' ? 1 : 0} else 420
tiles = []
for n, items in rows.items():
    ims = []
    for m, f in items:
        i = Image.open(f).convert('RGB'); i.thumbnail((W, 650)); d = ImageDraw.Draw(i); d.rectangle((0, 0, 150, 14), fill='black'); d.text((3, 2), f'{n} {m}', fill='yellow'); ims.append(i)
    tiles.append(ims)
w = max(len(r) for r in tiles) * (tiles[0][0].width + 4); h = sum(r[0].height + 4 for r in tiles)
sh = Image.new('RGB', (w, h), 'black'); y = 0
for r in tiles:
    x = 0
    for i in r: sh.paste(i, (x, y)); x += i.width + 4
    y += r[0].height + 4
sh.save(sys.argv[1], quality=82)`, path.join(OUT, `strihy-${kind}.jpg`), JSON.stringify(files)]);
  }
} finally {
  await browser.close(); srv.server.close();
  fs.writeFileSync(path.join(OUT, 'konzola.txt'), log.join('\n') + '\n');
  console.log('konzola:', log.length ? log.join('\n') : 'bez chýb');
}
