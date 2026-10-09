#!/usr/bin/env node
// Úvod ako film: snímky prológu v čase (desktop + mobil) a kontrola stavov.
//
//   node source/tools/uvod-shot.mjs [--out=dir] [--only=desktop|mobile] [--url=http://...]
//
// Pre každé zariadenie otvorí stránku v čistom kontexte (bez sessionStorage, takže prológ je povolený),
// počká na prvý snímok filmu a odfotí prológ na daných polohách (BS30_FILM.proFreeze, lebo softvérové
// kreslenie v headless prehliadači je pomalé a čas by nesedel). Potom:
//  1. skroluje o 700 px a odfotí (film ide ďalej skrolovaním),
//  2. znova načíta stránku v tom istom kontexte (sessionStorage je nastavený) a overí, že prológ sa
//     nepustil a záloha úvodu je rohožka,
//  3. otvorí stránku s ?film=off a overí pokojnú verziu (záloha rohožka, bez plátna).
// Výstup: <out>/uvod-<zariadenie>-<ms>.png a súhrn do konzoly (stavy BS30_FILM.state, chyby konzoly).

import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { startStaticServer, PRESETS } from '../shot.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');

const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const OUT = opt.out ? path.resolve(opt.out) : path.join(ROOT, 'docs', 'screenshots');
fs.mkdirSync(OUT, { recursive: true });
const VIEW = { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } };
const STOPS = [0, 0.18, 0.35, 0.5, 0.62, 0.8, 1];

const srv = opt.url ? null : await startStaticServer(ROOT);
const base = opt.url || `${srv.origin}/index.html`;
const browser = await chromium.launch(PRESETS[0]);
const summary = [];
try {
  for (const [kind, vp] of Object.entries(VIEW)) {
    if (opt.only && opt.only !== kind) continue;
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1, isMobile: kind === 'mobile', hasTouch: kind === 'mobile', colorScheme: 'dark', reducedMotion: 'no-preference' });
    const page = await ctx.newPage();
    const logs = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text()}`); });
    page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
    const t0 = Date.now();
    await page.goto(base, { waitUntil: 'load', timeout: 60000 });
    const pro0 = await page.evaluate(() => ({ pro: document.documentElement.classList.contains('pro'), still: (document.querySelector('#uvod .film-still img') || {}).currentSrc || '' }));
    // prológ hneď zastaviť na začiatku (ešte pred prvým snímkom), aby pomalé kreslenie nič nepreskočilo
    await page.evaluate(() => { const w = () => { const f = window.BS30_FILM; if (!(f && typeof f.proFreeze === 'function' && f.proFreeze(0))) setTimeout(w, 20); }; w(); });
    let shownAt = null;
    try {
      await page.waitForFunction(() => document.documentElement.classList.contains('world-in'), null, { timeout: 20000 });
      shownAt = Date.now();
    } catch { logs.push('[uvod] film sa nerozbehol do 20 s'); }
    const states = [];
    for (const s of STOPS) {
      if (shownAt == null) break;
      const ok = await page.evaluate((v) => window.BS30_FILM.proFreeze(v), s);
      await page.waitForTimeout(900);
      const st = await page.evaluate(() => { const s = window.BS30_FILM.state; return { S: +s.S.toFixed(3), mix: +s.mix.toFixed(3), cur: s.current, pro: s.pro, first: s.firstFrameMs, htmlPro: document.documentElement.classList.contains('pro') }; });
      await page.screenshot({ path: path.join(OUT, `uvod-${kind}-s${String(Math.round(s * 100)).padStart(3, '0')}.png`) });
      states.push({ stop: s, frozen: ok, ...st });
    }
    await page.evaluate(() => window.BS30_FILM.proFreeze(null));
    await page.waitForTimeout(1200);
    const done = await page.evaluate(() => { const s = window.BS30_FILM.state; return { S: +s.S.toFixed(3), pro: s.pro, htmlPro: document.documentElement.classList.contains('pro') }; });
    states.push({ stop: 'koniec', ...done });
    // skrolovanie po prológu
    await page.addStyleTag({ content: 'html{scroll-behavior:auto !important}' });
    await page.evaluate(() => window.scrollTo({ top: 700, behavior: 'instant' }));
    await page.waitForTimeout(1500);
    const afterScroll = await page.evaluate(() => { const s = window.BS30_FILM.state; return { S: +s.S.toFixed(3), cur: s.current, pro: s.pro, T: +s.T.toFixed(3) }; });
    await page.screenshot({ path: path.join(OUT, `uvod-${kind}-scroll700.png`) });
    // druhé načítanie: bez prológu, záloha rohožka
    await page.goto(base, { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(800);
    const second = await page.evaluate(() => ({ pro: document.documentElement.classList.contains('pro'), worldIn: document.documentElement.classList.contains('world-in'), still: (document.querySelector('#uvod .film-still img') || {}).currentSrc || '' }));
    await page.screenshot({ path: path.join(OUT, `uvod-${kind}-druhykrat.png`) });
    // pokojná verzia
    await page.goto(base + '?film=off', { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(800);
    const off = await page.evaluate(() => ({ pro: document.documentElement.classList.contains('pro'), canvas: !!document.querySelector('.film-canvas'), still: (document.querySelector('#uvod .film-still img') || {}).currentSrc || '' }));
    await page.screenshot({ path: path.join(OUT, `uvod-${kind}-pokojna.png`) });
    summary.push({ kind, loadMs: shownAt == null ? null : shownAt - t0, pro0, states, afterScroll, second, off, logs });
    await ctx.close();
  }
} finally {
  await browser.close();
  if (srv) srv.server.close();
}
for (const s of summary) {
  console.log(`\n== ${s.kind}: prvý snímok ${s.loadMs} ms po načítaní; pred filmom pro=${s.pro0.pro} záloha=${path.basename(s.pro0.still)}`);
  for (const st of s.states) console.log(`  stop=${String(st.stop).padStart(6)} S=${st.S} mix=${st.mix ?? '-'} záber=${st.cur ?? '-'} prológ=${st.pro} html.pro=${st.htmlPro}`);
  console.log(`  po skrole 700 px: S=${s.afterScroll.S} T=${s.afterScroll.T} záber=${s.afterScroll.cur} prológ=${s.afterScroll.pro}`);
  console.log(`  druhé načítanie: pro=${s.second.pro} world-in=${s.second.worldIn} záloha=${path.basename(s.second.still)}`);
  console.log(`  film=off: pro=${s.off.pro} plátno=${s.off.canvas} záloha=${path.basename(s.off.still)}`);
  for (const l of s.logs) console.log('  ', l);
}
