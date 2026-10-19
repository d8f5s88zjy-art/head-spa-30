#!/usr/bin/env node
/* Kód filmu – meranie filmu priamo na stránke s inštrumentáciou inst.js (pred aj po opravách tou istou metódou).
   Scenáre (poradie v jednom behu):
     prvy    – stránka bez prológu (návrat, ?uvod=off), 3 s pokoj, prvý dotykový ťah: cena štartu filmu
               (import three, kontext, preklad shaderov, prvé nahratia) v nasledujúcich 6 s
     pokoj   – 10 s bez vstupu: koľko snímok film kreslí a koľko ho to stojí na hlavnom vlákne
     skrol   – celá stránka strednými švihmi (dotyk): snímky, pásy textúr, celé nahratia (sekvencie), šero, pamäť
     hore    – skok na vrch (ako logo / „späť hore“): šero a čas do obrazu
     menu    – skok z menu na #sluzby a #galeria: šero a čas do obrazu
     kontext – WEBGL_lose_context: čo vidno počas straty (snímka) a po obnove
   Výstup: JSON so súhrnom a snímky do --out priečinka.
   node film-stopa.mjs [--cpu=4] [--net=fast4g|slow4g|none] [--dev=phone|desk] [--port=8248] [--out=dir] [--scen=prvy,pokoj,skrol,hore,menu,kontext] [--q=film=on&uvod=off] */
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.length ? v.join('=') : '1']; }));
const PORT = opt.port || 8248, CPU = Number(opt.cpu || 4), NET = opt.net || 'fast4g', DEV = opt.dev || 'phone';
const OUT = opt.out || path.join(path.dirname(new URL(import.meta.url).pathname), 'beh-' + DEV + '-cpu' + CPU + '-' + NET);
const SCEN = (opt.scen || 'prvy,pokoj,skrol,hore,menu,kontext').split(',');
const Q = opt.q || 'film=on&uvod=off';
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const NETS = {
  fast4g: { offline: false, latency: 165, downloadThroughput: 1012500, uploadThroughput: 168750, connectionType: 'cellular4g' },
  slow4g: { offline: false, latency: 562.5, downloadThroughput: 180000, uploadThroughput: 84375, connectionType: 'cellular4g' },
};
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext(DEV === 'phone'
  ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36' }
  : { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
await ctx.addInitScript({ path: path.join(path.dirname(new URL(import.meta.url).pathname), 'inst.js') });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await cdp.send('Network.enable');
await cdp.send('Network.setCacheDisabled', { cacheDisabled: false });
if (NETS[NET]) await cdp.send('Network.emulateNetworkConditions', NETS[NET]);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
const T = () => page.evaluate(() => performance.now());
const mark = (n) => page.evaluate((n) => window.__KF.mark(n), n);
async function swipe({ y0 = 700, dist = 420, ms = 180, hold = 0, x = 195 }) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: y0 }] });
  const t0 = Date.now();
  for (;;) {
    const e = Math.min(1, (Date.now() - t0) / ms);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y0 - dist * e }] });
    if (e >= 1) break;
    await sleep(8);
  }
  if (hold) await sleep(hold);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}
async function wheel(dy) { await page.mouse.move(720, 450); await page.mouse.wheel(0, dy); }
const st = () => page.evaluate(() => { const s = window.BS30_FILM && window.BS30_FILM.state; return s && s.on ? { shown: s.shown, dpr: s.dpr, S: +s.S.toFixed(3), T: +s.T.toFixed(3), cur: s.current, mix: +s.mix.toFixed(3), frames: s.frames, first: s.firstFrameMs, ready: s.ready.filter((r) => r.ready).map((r) => r.shot + ':' + r.size).join(' '), loading: s.ready.filter((r) => r.loading).map((r) => r.shot).join(' '), seq: s.seq, video: s.video, cls: document.documentElement.className } : { on: false, cls: document.documentElement.className }; });
// súhrn snímok v okne času
const stat = (a) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); const q = (p) => +s[Math.min(s.length - 1, Math.floor(p * s.length))].toFixed(2); return { n: a.length, p50: q(0.5), p95: q(0.95), max: +s[s.length - 1].toFixed(2), sum: +a.reduce((x, y) => x + y, 0).toFixed(1) }; };
async function okno(od, po, meno) {
  const d = await page.evaluate(([od, po]) => ({ fr: window.__KF.dump(od, po), lt: window.__KF.lt.filter((l) => l[0] >= od && l[0] <= po), loaf: window.__KF.loaf.filter((l) => l.t >= od && l.t <= po), outside: window.__KF.outside.filter((l) => l[0] >= od && l[0] <= po), big: window.__KF.big.filter((l) => l[0] >= od && l[0] <= po), live: window.__KF.liveT.filter((l) => l[0] >= od && l[0] <= po), ctx: window.__KF.ctxMs }), [od, po]);
  const fr = d.fr;
  const film = fr.filter((f) => f[1] > 0);
  const dts = fr.slice(1).map((f, i) => f[0] - fr[i][0]);
  // šero: snímka filmu, ktorá do plátna len vyčistila (clear) a nič nenakreslila; súvislé úseky = okná šera
  const sero = []; let run = null;
  for (const f of film) {
    const dark = f[10] > 0 && f[11] === 0;
    if (dark) { if (!run) run = [f[0], f[0]]; else run[1] = f[0]; } else if (run && f[11] > 0) { sero.push([+run[0].toFixed(0), +(f[0] - run[0]).toFixed(0)]); run = null; }
  }
  if (run) sero.push([+run[0].toFixed(0), +(po - run[0]).toFixed(0), 'trvá']);
  const r = {
    meno, trvanieMs: +(po - od).toFixed(0), snimok: fr.length, snimokFilmu: film.length, fps: +(fr.length / ((po - od) / 1000)).toFixed(1),
    intervalSnimky: stat(dts), filmJsMs: stat(film.map((f) => f[1])), filmGlMs: stat(film.map((f) => f[3])), ineRafMs: stat(fr.map((f) => f[2]).filter((x) => x > 0)),
    pasy: { snimokSPasmi: film.filter((f) => f[4] > 0).length, pasov: film.reduce((a, f) => a + f[4], 0), msNaSnimku: stat(film.filter((f) => f[4] > 0).map((f) => f[5])), maxNaSnimku: Math.max(0, ...film.map((f) => f[4])) },
    celeNahratia: { snimokSNimi: film.filter((f) => f[6] > 0).length, pocet: film.reduce((a, f) => a + f[6], 0), msNaSnimku: stat(film.filter((f) => f[6] > 0).map((f) => f[7])), maxNaSnimku: Math.max(0, ...film.map((f) => f[6])) },
    nahrateMB: +(film.reduce((a, f) => a + f[12], 0) / 1e6).toFixed(1),
    kresliNaSnimku: stat(film.map((f) => f[9])),
    sero: { okien: sero.length, nad150ms: sero.filter((s) => s[1] > 150).length, najdlhsieMs: Math.max(0, ...sero.map((s) => s[1])), okna: sero.slice(0, 12) },
    dlheUlohy: { pocet: d.lt.length, max: Math.max(0, ...d.lt.map((l) => l[1])), zoznam: d.lt.slice(0, 15) },
    loaf: d.loaf.filter((l) => l.d > 50).slice(0, 12),
    mimoSnimky: d.outside.slice(0, 20),
    velkeVolania: d.big.slice(0, 25),
    pametMB: { max: Math.max(0, ...d.live.map((l) => l[1])), koniec: d.live.length ? d.live[d.live.length - 1][1] : 0 },
    surove: fr,
  };
  return r;
}
const vys = { nastavenie: { DEV, CPU, NET, Q, cas: new Date().toISOString() }, scenare: {} };
const uloz = () => fs.writeFileSync(path.join(OUT, 'vysledok.json'), JSON.stringify(vys, (k, v) => (k === 'surove' && !opt.surove ? undefined : v), 1));
const casySnimok = [];
const shot = async (n) => { const a = await T(); await page.screenshot({ path: path.join(OUT, n + '.jpg'), type: 'jpeg', quality: 70 }); const b = await T(); casySnimok.push([n, +a.toFixed(0), +b.toFixed(0)]); vys.snimky = casySnimok; };

await page.goto(`http://127.0.0.1:${PORT}/barbershop-30/?${Q}`, { waitUntil: 'load', timeout: 120000 });
await sleep(3000);
vys.poNacitani = await st();

if (SCEN.includes('prvy')) {
  const od = await T(); await mark('prvy-dotyk');
  if (DEV === 'phone') await swipe({ dist: 160, ms: 300, hold: 60 }); else await wheel(120);
  // čakať na prvý snímok filmu (world-in) najviac 20 s
  let t = 0; while (t < 20000) { const s = await st(); if (s.shown) break; await sleep(250); t += 250; }
  await sleep(6000);
  const po = await T();
  vys.scenare.prvy = await okno(od, po, 'prvý dotyk -> film');
  vys.scenare.prvy.stav = await st();
  await shot('prvy-po');
  uloz();
}
if (SCEN.includes('pokoj')) {
  await sleep(2000);
  const od = await T(); await sleep(10000); const po = await T();
  vys.scenare.pokoj = await okno(od, po, '10 s bez vstupu');
  vys.scenare.pokoj.stav = await st();
  uloz();
}
if (SCEN.includes('skrol')) {
  const od = await T(); await mark('skrol');
  const maxY = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  const stavy = [];
  for (let i = 0; i < 120; i++) {
    if (DEV === 'phone') await swipe({ dist: 420, ms: 180 }); else await wheel(500);
    await sleep(450);
    if (i % 4 === 0) stavy.push(await st());
    const y = await page.evaluate(() => scrollY);
    if (y >= maxY - 4) break;
  }
  await sleep(1500);
  const po = await T();
  vys.scenare.skrol = await okno(od, po, 'skrol celou stránkou (stredné švihy)');
  vys.scenare.skrol.stavy = stavy.map((s) => ({ S: s.S, cur: s.cur, dpr: s.dpr, ready: s.ready, loading: s.loading, seq: s.seq && s.seq.map((q) => `${q.shot} got ${q.got}/${q.n} tex ${q.tex} up ${q.up} dec ${q.dec}`).join('; ') }));
  uloz();
}
if (SCEN.includes('dole')) {
  // rýchly presun na koniec stránky po kúskoch (ako dlhý skrol), aby film stál na poslednom zábere
  const maxY = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  for (let y = 0; y <= maxY; y += 700) { await page.evaluate((y) => scrollTo(0, y), y); await sleep(350); }
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  for (let i = 0; i < 40; i++) { const s = await st(); if (s.cur && /vstup/.test(s.cur) && s.ready.includes('vstup')) break; await sleep(500); }
  await sleep(2000);
  vys.dole = await st();
}
if (SCEN.includes('hore')) {
  await sleep(1500);
  const od = await T(); await mark('hore');
  await page.evaluate(() => { const s = document.documentElement.style.scrollBehavior; document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, 0); document.documentElement.style.scrollBehavior = s; });
  let bolo = 0;
  for (const ms of [120, 300, 700, 1500]) { await sleep(ms - bolo); bolo = ms; await shot('hore-' + ms + 'ms'); }
  await sleep(3000);
  const po = await T();
  vys.scenare.hore = await okno(od, po, 'skok na vrch stránky');
  vys.scenare.hore.stav = await st();
  uloz();
}
if (SCEN.includes('menu')) {
  for (const id of ['sluzby', 'galeria']) {
    await sleep(1500);
    const od = await T(); await mark('menu-' + id);
    await page.evaluate((id) => { const s = document.documentElement.style.scrollBehavior; document.documentElement.style.scrollBehavior = 'auto'; document.getElementById(id).scrollIntoView(); document.documentElement.style.scrollBehavior = s; }, id);
    await sleep(150); await shot('menu-' + id + '-150ms');
    await sleep(450); await shot('menu-' + id + '-600ms');
    await sleep(3500);
    const po = await T();
    vys.scenare['menu-' + id] = await okno(od, po, 'skok z menu na #' + id);
    vys.scenare['menu-' + id].stav = await st();
    uloz();
  }
}
if (SCEN.includes('kontext')) {
  await sleep(1500);
  const od = await T(); await mark('strata');
  const ok = await page.evaluate(() => { const c = document.querySelector('canvas.film-canvas'); if (!c) return 'bez plátna'; const gl = c.getContext('webgl2'); const x = gl && gl.getExtension('WEBGL_lose_context'); if (!x) return 'bez rozšírenia'; window.__lose = x; x.loseContext(); return 'stratený'; });
  await sleep(1500); await shot('kontext-strateny-1500ms');
  const pocasStraty = await page.evaluate(() => { const c = document.querySelector('canvas.film-canvas'); const st = [...document.querySelectorAll('.film-still')].filter((e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.bottom > 0 && r.top < innerHeight && cs.visibility !== 'hidden' && +cs.opacity > 0.05 && cs.display !== 'none'; }).length; return { cls: document.documentElement.className, viditelnychZaloh: st, canvasOpacity: c && getComputedStyle(c).opacity }; });
  await page.evaluate(() => window.__lose && window.__lose.restoreContext());
  const tr = await T();
  let back = null; for (let i = 0; i < 80; i++) { await sleep(100); const f = await page.evaluate((tr) => window.__KF.dump(tr).find((f) => f[11] > 0), tr); if (f) { back = +(f[0] - tr).toFixed(0); break; } }
  await sleep(300); await shot('kontext-obnoveny');
  await sleep(1500);
  const po = await T();
  vys.scenare.kontext = await okno(od, po, 'strata a obnova kontextu');
  vys.scenare.kontext.vysledok = ok; vys.scenare.kontext.pocasStraty = pocasStraty; vys.scenare.kontext.obrazPoObnoveMs = back;
  uloz();
}
vys.koniec = await st();
vys.znacky = await page.evaluate(() => window.__KF.marks);
vys.seroStav = await page.evaluate(() => window.__KF.darkLog || []);
vys.volania = await page.evaluate(() => Object.fromEntries(Object.entries(window.__KF.calls).map(([k, v]) => [k, { ms: +v[0].toFixed(1), n: v[1], max: +v[2].toFixed(1) }])));
vys.kontexty = await page.evaluate(() => window.__KF.ctxMs);
vys.pametMaxMB = await page.evaluate(() => +(window.__KF.liveMax / 1e6).toFixed(1));
vys.platno = await page.evaluate(() => { const c = document.querySelector('canvas.film-canvas'); return c ? { w: c.width, h: c.height, css: [c.clientWidth, c.clientHeight] } : null; });
uloz();
// stručný výpis
for (const [k, v] of Object.entries(vys.scenare)) console.log(k, JSON.stringify({ fps: v.fps, interval: v.intervalSnimky, filmJs: v.filmJsMs, filmGl: v.filmGlMs, pasy: v.pasy, cele: v.celeNahratia, sero: v.sero, lt: v.dlheUlohy.pocet + '/' + v.dlheUlohy.max, pamet: v.pametMB }));
console.log('pamätMax', vys.pametMaxMB, 'plátno', JSON.stringify(vys.platno), 'kontexty', JSON.stringify(vys.kontexty));
await browser.close();
