#!/usr/bin/env node
// Plynulosť úvodu: časová os prológu a zhoda zálohy s prvým snímkom filmu (telefón 390×844 2×, počítač 1440×900).
//
//   node source/tools/uvod-meranie.mjs [--out=dir] [--url=http://...] [--only=os|zhoda]
//
// 1. Časová os (os): stránka v čistom kontexte na telefóne pri rýchlej aj pomalej sieti (1,6 Mb/s, 150 ms);
//    každých 50 ms sa zapíše S, dpr a stav prológu. Vypíše prvý snímok, začiatok chôdze, koniec prológu,
//    zmeny rozlíšenia (dpr) a zastavenia (S rovnaké dlhšie než 250 ms počas chôdze). Chôdza má byť jeden
//    pohyb bez zastavenia pri dverách (S 0,33 = čakanie na záber úvodu) a dpr sa počas prológu nemení.
//    Softvérové kreslenie v headless prehliadači je pomalé, preto časy nesedia s telefónom; zastavenia
//    a zmeny dpr sú ale rovnaké.
// 2. Zhoda (zhoda): film zastavený na začiatku (prológ S = 0; druhá návšteva na kotve úvodu po prvom
//    dotyku), záloha sa vráti nad film a odfotí sa, potom sa skryje a odfotí sa film – obe bez dosiek a
//    hlavičky, výrez 12–88 % výšky. Dvojice <out>/zhoda-{zaloha,film}-<zariadenie>[-2].png vyhodnotí
//    python3 -I source/tools/uvod-zhoda.py <out> (posun a mierka; má byť do 8 px a 2 %).
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
const VIEW = { mobile: { vp: { width: 390, height: 844 }, dsf: 2, mob: true }, desktop: { vp: { width: 1440, height: 900 }, dsf: 1, mob: false } };
const srv = opt.url ? null : await startStaticServer(ROOT);
// prehliadač v teste kreslí softvérovo: ?film=on povolí film aj tak (brána v hlavičke inak dá pokojnú verziu)
const raw = opt.url || `${srv.origin}/index.html`;
const base = raw + (raw.includes('?') ? '&' : '?') + 'film=on';
const browser = await chromium.launch(PRESETS[0]);
let bad = 0;

async function os(name, throttle) {
  const { vp, dsf, mob } = VIEW.mobile;
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: dsf, isMobile: mob, hasTouch: mob, colorScheme: 'dark' });
  const page = await ctx.newPage();
  const logs = [];
  page.on('pageerror', (e) => logs.push(e.message));
  if (throttle) { const cdp = await ctx.newCDPSession(page); await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: throttle / 8, uploadThroughput: 500e3 / 8 }); }
  await page.addInitScript(() => {
    const out = window.__vz = []; const start = performance.now();
    const tick = () => { try {
      const f = window.BS30_FILM, h = document.documentElement ? document.documentElement.classList : [], s = f && f.state;
      out.push({ t: Math.round(performance.now() - start), S: s && typeof s.S === 'number' ? +s.S.toFixed(3) : null, pro: s ? s.pro : null, dpr: s ? s.dpr : null, cap: s ? s.cap : null, cls: [...h].filter((c) => /world|pro|outside/.test(c)).join(' ') });
      if (performance.now() - start < 30000 && !(s && out.length > 40 && !s.pro && s.S >= 1)) setTimeout(tick, 50); else window.__vzDone = true;
    } catch (e) { window.__vzErr = String(e); window.__vzDone = true; } }; tick();
  });
  await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForFunction(() => window.__vzDone === true, null, { timeout: 45000 });
  const samples = await page.evaluate(() => window.__vz);
  const first = samples.find((x) => /world-in/.test(x.cls)), start = samples.find((x) => x.S > 0.001), end = samples.find((x) => x.pro === false && x.S >= 0.999);
  const holds = []; let hs = null;
  for (let i = 1; i < samples.length; i++) {
    const a = samples[i - 1], b = samples[i];
    if (b.pro && b.S > 0.001 && b.S < 0.999 && a.S === b.S) { if (!hs) hs = a; }
    else if (hs) { if (b.t - hs.t > 250) holds.push({ S: hs.S, od: hs.t, ms: b.t - hs.t }); hs = null; }
  }
  const dprs = [...new Set(samples.filter((x) => x.dpr).map((x) => x.dpr))];
  const door = holds.filter((h) => Math.abs(h.S - 0.33) < 0.001);
  console.log(`\n== os: ${name} ==\n  prvý snímok ${first ? first.t : '-'} ms, chôdza od ${start ? start.t : '-'} ms, koniec prológu ${end ? end.t : '-'} ms, dpr ${dprs.join(' > ') || '-'}, strop 30 fps ${samples.some((x) => x.cap)}`);
  console.log(`  zastavenia počas chôdze: ${holds.length ? JSON.stringify(holds) : 'žiadne'}`);
  console.log(`  ${door.length ? 'CHYBA čakanie pri dverách (S 0,33)' : 'OK   bez čakania pri dverách'}; ${dprs.length > 1 ? 'CHYBA rozlíšenie sa menilo počas prológu' : 'OK   rozlíšenie stále'}`);
  if (door.length || dprs.length > 1) bad++;
  if (logs.length) console.log('  chyby stránky:', logs.slice(0, 3));
  await ctx.close();
}
async function zhoda(kind, second) {
  const { vp, dsf, mob } = VIEW[kind];
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: dsf, isMobile: mob, hasTouch: mob, colorScheme: 'dark' });
  const page = await ctx.newPage();
  if (second) { await page.goto(base, { waitUntil: 'load', timeout: 90000 }); await page.waitForTimeout(300); }
  else await page.addInitScript(() => { const w = () => { const f = window.BS30_FILM; if (!(f && typeof f.proFreeze === 'function' && f.proFreeze(0))) setTimeout(w, 10); }; w(); });
  await page.goto(base, { waitUntil: 'load', timeout: 90000 });
  if (second) { if (mob) await page.touchscreen.tap(200, 400); else await page.mouse.move(300, 300); }   // bez prológu film čaká na prvý pohyb
  await page.waitForFunction(() => document.documentElement.classList.contains('world-in'), null, { timeout: 60000 });
  await page.waitForTimeout(300);                            // skoro po prvom snímku: stály pohyb kamery ešte len nabieha (1,5 s)
  const tag = `${kind}${second ? '-2' : ''}`;
  const clip = { x: 0, y: Math.round(vp.height * 0.12), width: vp.width, height: Math.round(vp.height * 0.76) };
  await page.evaluate(() => { document.querySelectorAll('#uvod .board, #uvod .film-content, .film-place, .film-bars, .film-door, .site-header, .mobile-cta, header, nav').forEach((e) => e.style.visibility = 'hidden'); });
  // zálohu vrátiť nad film cez setProperty (cssText by zmazal vlastné premenné bodu záujmu v inline štýle)
  const show = (on) => page.evaluate((on) => { const st = document.querySelector('#uvod .film-still').style; st.setProperty('opacity', on ? '1' : '0', 'important'); st.setProperty('visibility', on ? 'visible' : 'hidden', 'important'); st.setProperty('transition', 'none', 'important'); }, on);
  await show(true);
  await page.waitForTimeout(250);
  await page.screenshot({ clip, path: path.join(OUT, `zhoda-zaloha-${tag}.png`) });
  await show(false);
  await page.waitForTimeout(250);
  await page.screenshot({ clip, path: path.join(OUT, `zhoda-film-${tag}.png`) });
  const st = await page.evaluate(() => { const s = window.BS30_FILM.state; return { S: +s.S.toFixed(3), pro: s.pro, zaber: s.current, zaloha: (document.querySelector('#uvod .film-still img') || {}).currentSrc || '' }; });
  console.log(`zhoda ${tag}: S=${st.S} prológ=${st.pro} záber=${st.zaber} záloha=${path.basename(st.zaloha)}`);
  await ctx.close();
}
try {
  if (!opt.only || opt.only === 'os') { await os('rýchla sieť', 0); await os('pomalá sieť 1,6 Mb/s', 1.6e6); }
  if (!opt.only || opt.only === 'zhoda') { console.log(''); for (const kind of ['mobile', 'desktop']) for (const second of [false, true]) await zhoda(kind, second); }
} finally { await browser.close(); }
console.log(bad ? `\nCHYBY: ${bad}` : '\nOS prológu v poriadku; zhodu vyhodnotí uvod-zhoda.py');
process.exit(bad ? 1 : 0);
