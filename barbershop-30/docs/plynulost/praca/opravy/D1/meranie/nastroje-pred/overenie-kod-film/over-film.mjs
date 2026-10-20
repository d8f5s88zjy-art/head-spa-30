#!/usr/bin/env node
/* Overenie kod-film: scenáre na stránke so screencastom (pixely = čo vidí návštevník) + sonda.js (stav filmu).
   node over-film.mjs --port=8310 --cpu=4 --net=fast4g --out=beh1 [--scen=odovzdanie,dole,hore,menu-sluzby,menu-galeria,kontext] [--q=film=on&uvod=off]
   Screencast: snímky 390×844 (zmenšené) s časom v performance.now() stránky -> <out>/<scenár>/<t>.jpg; analýza tma.py. */
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const here = path.dirname(new URL(import.meta.url).pathname);
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.length ? v.join('=') : '1']; }));
const PORT = opt.port || 8310, CPU = Number(opt.cpu || 4), NET = opt.net || 'fast4g';
const OUT = path.resolve(here, opt.out || 'beh');
const SCEN = (opt.scen || 'odovzdanie,dole,hore,menu-sluzby,menu-galeria,kontext').split(',');
const Q = opt.q || 'film=on&uvod=off';
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const NETS = {
  fast4g: { offline: false, latency: 165, downloadThroughput: 1012500, uploadThroughput: 168750, connectionType: 'cellular4g' },
  slow4g: { offline: false, latency: 562.5, downloadThroughput: 180000, uploadThroughput: 84375, connectionType: 'cellular4g' },
};
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36' });
await ctx.addInitScript({ path: path.join(here, 'sonda.js') });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await cdp.send('Network.enable');
if (NETS[NET]) await cdp.send('Network.emulateNetworkConditions', NETS[NET]);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

// screencast so značkou času stránky
let origin = 0, castDir = null, castN = 0;
cdp.on('Page.screencastFrame', async (f) => {
  try { await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }); } catch (e) { /* nič */ }
  if (!castDir) return;
  const t = f.metadata.timestamp * 1000 - origin;
  fs.writeFileSync(path.join(castDir, String(Math.round(t)).padStart(7, '0') + '.jpg'), Buffer.from(f.data, 'base64'));
  castN++;
});
async function cast(name) {
  castDir = path.join(OUT, name); fs.mkdirSync(castDir, { recursive: true }); castN = 0;
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 60, maxWidth: 390, maxHeight: 844, everyNthFrame: 1 });
}
async function uncast() { await cdp.send('Page.stopScreencast'); const n = castN; castDir = null; return n; }
const T = () => page.evaluate(() => performance.now());
const mark = (n) => page.evaluate((n) => window.__OV.mark(n), n);
async function swipe({ y0 = 700, dist = 160, ms = 300, hold = 60, x = 195 }) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: y0 }] });
  const t0 = Date.now();
  for (;;) { const e = Math.min(1, (Date.now() - t0) / ms); await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y0 - dist * e }] }); if (e >= 1) break; await sleep(8); }
  if (hold) await sleep(hold);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}
const st = () => page.evaluate(() => { const s = window.BS30_FILM && window.BS30_FILM.state; return s && s.on ? { shown: s.shown, S: +s.S.toFixed(3), T: +s.T.toFixed(3), cur: s.current, ready: s.ready.filter((r) => r.ready).map((r) => r.shot).join(' '), loading: s.ready.filter((r) => r.loading).map((r) => r.shot).join(' '), dpr: s.dpr, cls: document.documentElement.className, y: scrollY } : { on: false, cls: document.documentElement.className }; });
const vys = { nastavenie: { CPU, NET, Q, cas: new Date().toISOString() }, scen: {} };
const uloz = () => fs.writeFileSync(path.join(OUT, 'vysledok.json'), JSON.stringify(vys, null, 1));

await page.goto(`http://127.0.0.1:${PORT}/barbershop-30/?${Q}`, { waitUntil: 'load', timeout: 120000 });
origin = await page.evaluate(() => performance.timeOrigin);
await sleep(3000);
log('načítané', JSON.stringify(await st()));

// 1) prvý dotyk -> odovzdanie zo zálohy do filmu: opacity plátna a zálohy po snímkach + screencast
{
  // vzorkovanie opacity v každej snímke (vlastná slučka mimo filmu)
  await page.evaluate(() => {
    const O = window.__OV; O.op = [];
    const c0 = () => document.querySelector('canvas.film-canvas');
    const still = document.querySelector('.film-shot[data-shot="rohozka"] .film-still');
    const loop = () => { const c = c0(); const t = performance.now(); if (c) O.op.push([+t.toFixed(1), +getComputedStyle(c).opacity, still ? +getComputedStyle(still).opacity : -1, still ? getComputedStyle(still).visibility : '', document.documentElement.classList.contains('world-in') ? 1 : 0]); if (O.op.length < 4000) requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  });
  // --pomaly=0.1: CSS prechody 10× pomalšie (CDP Animation), aby screencast zachytil odovzdanie aj na pomalej grafike
  if (opt.pomaly) { await cdp.send('Animation.enable'); await cdp.send('Animation.setPlaybackRate', { playbackRate: Number(opt.pomaly) }); }
  await cast('odovzdanie');
  const od = await T(); await mark('prvy-dotyk');
  await swipe({});
  let t = 0; while (t < 25000) { const s = await st(); if (s.shown && /world-in/.test(s.cls)) break; await sleep(200); t += 200; }
  await sleep(opt.pomaly ? 3000 / Number(opt.pomaly) : 3000);
  if (opt.pomaly) await cdp.send('Animation.setPlaybackRate', { playbackRate: 1 });
  const n = await uncast();
  vys.scen.odovzdanie = { od, po: await T(), snimok: n, stav: await st() };
  log('odovzdanie', n, JSON.stringify(vys.scen.odovzdanie.stav));
  uloz();
}
if (SCEN.includes('dole')) {
  await cast('dole');
  const od = await T(); await mark('dole');
  const maxY = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  for (let y = 0; y <= maxY; y += 700) { await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y); await sleep(350); }
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
  for (let i = 0; i < 60; i++) { const s = await st(); if (s.cur && /vstup/.test(s.cur) && s.ready.split(' ').includes(s.cur)) break; await sleep(500); }
  await sleep(1500);
  const n = await uncast();
  vys.scen.dole = { od, po: await T(), snimok: n, stav: await st() };
  log('dole', n, JSON.stringify(vys.scen.dole.stav));
  uloz();
}
if (SCEN.includes('hore')) {
  await sleep(1500);
  await cast('hore');
  await sleep(300);
  const od = await T(); await mark('hore');
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await sleep(6000);
  const n = await uncast();
  vys.scen.hore = { od, po: await T(), snimok: n, stav: await st() };
  log('hore', n, JSON.stringify(vys.scen.hore.stav));
  uloz();
}
// skok z menu tak, ako ho robí návštevník: ťuk na menu, ťuk na odkaz (natívny plynulý skrol z CSS)
for (const id of ['sluzby', 'galeria']) {
  if (!SCEN.includes('menu-' + id)) continue;
  await sleep(1500);
  await page.tap('.nav-toggle');
  await sleep(700);
  await cast('menu-' + id);
  await sleep(300);
  const od = await T(); await mark('menu-' + id);
  await page.tap(`#nav a[href="#${id}"]`);
  await sleep(7000);
  const n = await uncast();
  vys.scen['menu-' + id] = { od, po: await T(), snimok: n, stav: await st() };
  log('menu-' + id, n, JSON.stringify(vys.scen['menu-' + id].stav));
  uloz();
}
if (SCEN.includes('kontext')) {
  await sleep(1500);
  await cast('kontext');
  await sleep(300);
  const od = await T(); await mark('strata');
  const ok = await page.evaluate(() => { const c = document.querySelector('canvas.film-canvas'); if (!c) return 'bez plátna'; const gl = c.getContext('webgl2'); const x = gl && gl.getExtension('WEBGL_lose_context'); if (!x) return 'bez rozšírenia'; window.__lose = x; x.loseContext(); return 'stratený'; });
  await sleep(2500);
  const pocas = await page.evaluate(() => { const c = document.querySelector('canvas.film-canvas'); const vis = [...document.querySelectorAll('.film-still')].filter((e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.bottom > 0 && r.top < innerHeight && cs.visibility !== 'hidden' && +cs.opacity > 0.05 && cs.display !== 'none'; }).length; return { cls: document.documentElement.className, zaloh: vis, platno: c && getComputedStyle(c).opacity, y: scrollY }; });
  const tr = await T(); await mark('obnova');
  await page.evaluate(() => window.__lose && window.__lose.restoreContext());
  await sleep(4000);
  const n = await uncast();
  vys.scen.kontext = { od, obnova: tr, po: await T(), snimok: n, vysledok: ok, pocasStraty: pocas, stav: await st() };
  log('kontext', n, JSON.stringify(pocas));
  uloz();
}
vys.sonda = await page.evaluate(() => { const O = window.__OV; return { st: O.st, cls: O.cls, lt: O.lt, loaf: O.loaf, prog: O.prog, q: O.q, ctx: O.ctx, op: O.op, fr: O.fr.map((f) => [+f.ts.toFixed(1), +f.js.toFixed(2), f.draw, f.clr, f.mip, f.band, +f.bandMs.toFixed(2), f.full, +f.fullMs.toFixed(2)]), up: O.up, mip: O.mip.length }; });
uloz();
log('hotovo', OUT);
await browser.close();
