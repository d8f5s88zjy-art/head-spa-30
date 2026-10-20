#!/usr/bin/env node
// Overenie auditu „čierne okná“ (BARBERSHOP 30) – nezávislý nahrávač.
// Iná metóda ako audit (rec.mjs): (1) pravda o filme priamo z WebGL – zachytávajú sa volania clear/draw do
// obrazovky (framebuffer null); posledná operácia „clear“ bez kreslenia = plátno je prázdne (#0e0d0c);
// (2) pravda o zálohách z DOM – aktuálna karta, --so, is-shown, img.complete a výsledok img.decode() na kópii;
// (3) screencast (JPEG 90) na pixelovú kontrolu a snímky; (4) sieť z CDP (začiatok a koniec každého obrázka).
//   node over.mjs --name=X --dev=phone|desk [--dpr=3] --net=none|fast4g|slow4g --cpu=4 --q="film=on&uvod=off"
//        --cache=cold|warm --scen=uvod|svih|skok [--ciele="#sluzby,PATA,HORE"] [--rm] [--savedata] [--inject=x.js]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');

const here = path.dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : (process.argv.includes(`--${k}`) ? true : d); };
const NAME = arg('name', 'run'), DEV = arg('dev', 'phone'), NET = arg('net', 'fast4g'), CPU = Number(arg('cpu', 4));
const Q = arg('q', ''), CACHE = arg('cache', 'cold'), SCEN = arg('scen', 'uvod'), RM = !!arg('rm', false), SAVE = !!arg('savedata', false);
const PORT = arg('port', '8581'), INJECT = arg('inject', ''), DPR = arg('dpr', ''), CIELE = String(arg('ciele', '#sluzby,#vstup-dnu,PATA,HORE')).split(',');
const WAIT = Number(arg('wait', 5000)), SWIPES = Number(arg('swipes', 60));
const OUT = path.join(here, 'runs', NAME);
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'f'), { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const NETS = {
  none: null,
  fast4g: { offline: false, latency: 165, downloadThroughput: 1012500, uploadThroughput: 168750, connectionType: 'cellular4g' },
  slow4g: { offline: false, latency: 562.5, downloadThroughput: 180000, uploadThroughput: 84375, connectionType: 'cellular4g' },
};
const VIEW = DEV === 'phone'
  ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
      userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36' }
  : { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false };
if (DPR) VIEW.deviceScaleFactor = Number(DPR);
const W = VIEW.viewport.width, H = VIEW.viewport.height;
const URL0 = `http://127.0.0.1:${PORT}/barbershop-30/` + (Q ? '?' + Q : '');

const PROBE = `(() => {
  const O = window.__ov = { log: [], gl: { op: '', c: 0, d: 0 }, marks: [] };
  // WebGL: posledná operácia do obrazovky (framebuffer null) – clear bez kreslenia = prázdne plátno
  try {
    for (const C of [window.WebGL2RenderingContext, window.WebGLRenderingContext]) {
      if (!C) continue;
      const P = C.prototype, ob = P.bindFramebuffer, oc = P.clear, oa = P.drawArrays, oe = P.drawElements;
      P.bindFramebuffer = function (t, fb) { if (t === this.FRAMEBUFFER || t === 0x8CA9) this.__fb = fb; return ob.call(this, t, fb); };
      P.clear = function (m) { if (!this.__fb && this.canvas && this.canvas.isConnected) { O.gl.op = 'clear'; O.gl.c++; } return oc.call(this, m); };
      P.drawArrays = function (a, b, c) { if (!this.__fb && this.canvas && this.canvas.isConnected) { O.gl.op = 'draw'; O.gl.d++; } return oa.call(this, a, b, c); };
      P.drawElements = function (a, b, c, e) { if (!this.__fb && this.canvas && this.canvas.isConnected) { O.gl.op = 'draw'; O.gl.d++; } return oe.call(this, a, b, c, e); };
    }
  } catch (e) {}
  // kópie záloh: img.decode() na každej zálohe karty (len meranie, kedy by bol obraz dekódovateľný)
  const dec = new Map();
  const tick = () => {
    try {
      const d = document, h = d.documentElement, now = performance.now();
      const e = { t: Date.now(), p: Math.round(now), y: Math.round(scrollY), wi: h.classList.contains('world-in') ? 1 : 0, wo: h.classList.contains('world-off') ? 1 : 0,
        gl: O.gl.op, menu: (d.querySelector('.site-header') || {}).dataset ? d.querySelector('.site-header').dataset.menu : '' };
      const f = window.BS30_FILM;
      if (f && f.state && f.state.on) {
        const s = f.state;
        e.f = { S: +s.S.toFixed(2), T: +s.T.toFixed(2), r: s.ready.map((r) => (r.ready ? 1 : 0) + (r.loading ? 2 : 0)).join(''), n: s.frames, cur: s.current };
      }
      const cards = [];
      d.querySelectorAll('.film-shot.is-title').forEach((el, i) => {
        const im = el.querySelector('.film-still img');
        const so = el.style.getPropertyValue('--so');
        if (im && im.complete && im.naturalWidth && !dec.has(im)) { dec.set(im, 0); }
        cards.push([i, el.classList.contains('is-near') ? 1 : 0, el.classList.contains('is-shown') ? 1 : 0, so ? +(+so).toFixed(2) : -1,
          im ? (im.complete && im.naturalWidth ? 1 : 0) : -1, im ? (im.currentSrc || '').split('/').pop() : '']);
      });
      e.k = cards;
      // odhalenie: viditeľné .reveal bez is-in a .steps bez is-in v okne
      if (now - (O.hidAt || 0) > 250) {
        O.hidAt = now;
        let hid = 0;
        d.querySelectorAll('.reveal:not(.is-in), .js-steps .steps:not(.is-in)').forEach((el) => { const r = el.getBoundingClientRect(); if (r.bottom > 0 && r.top < innerHeight && r.height > 0) hid += Math.min(r.bottom, innerHeight) - Math.max(r.top, 0); });
        e.hid = Math.round(hid);
      }
      if (now - (O.geoAt || 0) > 500) {
        O.geoAt = now;
        const y = scrollY, pg = (r) => [Math.round(r.left), Math.round(r.top + y), Math.round(r.right), Math.round(r.bottom + y)];
        const g = JSON.stringify([[...d.querySelectorAll('.band, .site-footer')].map((x) => pg(x.getBoundingClientRect())),
          [...d.querySelectorAll('.band .media, .band .team-portrait, .band .video-window, .band .gallery-btn')].map((x) => pg(x.getBoundingClientRect()))]);
        if (g !== O.lastGeo) { O.lastGeo = g; e.geo = JSON.parse(g); }
      }
      O.log.push(e);
    } catch (err) { O.log.push({ t: Date.now(), err: String(err) }); }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  // pravidelný záznam aj keď stránka nekreslí (requestAnimationFrame stojí)
  setInterval(() => { const L = O.log; if (!L.length || Date.now() - L[L.length - 1].t > 150) tick.call(null); }, 200);
  new PerformanceObserver((l) => l.getEntries().forEach((x) => O.marks.push([x.entryType, x.name || '', (x.url || '').split('/').pop(), Math.round(x.startTime)]))).observe({ type: 'largest-contentful-paint', buffered: true });
  try { new PerformanceObserver((l) => l.getEntries().forEach((x) => O.marks.push([x.entryType, x.name, '', Math.round(x.startTime)]))).observe({ type: 'paint', buffered: true }); } catch (e) {}
  O.t0 = Date.now() - performance.now();
})();`;
const SAVEDATA = `try { Object.defineProperty(navigator, 'connection', { configurable: true, get: () => ({ saveData: true, effectiveType: '4g', addEventListener() {}, removeEventListener() {} }) }); } catch (e) {}`;

const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ ...VIEW, reducedMotion: RM ? 'reduce' : 'no-preference', locale: 'sk-SK' });
await ctx.addInitScript(PROBE);
if (SAVE) await ctx.addInitScript(SAVEDATA);
if (INJECT) for (const f of String(INJECT).split(',')) await ctx.addInitScript({ path: path.resolve(here, f) });
const marks = [];
const mark = (m) => { marks.push({ t: Date.now(), m }); console.log(new Date().toISOString().slice(11, 23), m); };

if (CACHE === 'warm') {
  const p0 = await ctx.newPage();
  await p0.goto(URL0, { waitUntil: 'load', timeout: 120000 });
  await p0.mouse.move(100, 100); await sleep(3000);
  const total = await p0.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < total; y += Math.round(H * 0.5)) { await p0.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'instant' }), y); await sleep(400); }
  await p0.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await sleep(1500);
  await p0.close();
  mark('cache zahriata');
}

const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(String(e)));
const cdp = await ctx.newCDPSession(page);
await cdp.send('Network.enable');
if (CACHE === 'cold') await cdp.send('Network.clearBrowserCache');
if (NETS[NET]) await cdp.send('Network.emulateNetworkConditions', NETS[NET]);
if (CPU > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
const net = new Map();
let wallOff = null;   // CDP timestamp (s, monotónny) -> Date.now
cdp.on('Network.requestWillBeSent', (e) => { if (wallOff == null && e.wallTime) wallOff = e.wallTime * 1000 - e.timestamp * 1000; net.set(e.requestId, { url: e.request.url.replace(/^.*barbershop-30\//, ''), ts: e.timestamp }); });
cdp.on('Network.responseReceived', (e) => { const r = net.get(e.requestId); if (r) { r.fromCache = e.response.fromDiskCache || e.response.fromMemoryCache || false; r.status = e.response.status; } });
cdp.on('Network.loadingFinished', (e) => { const r = net.get(e.requestId); if (r) { r.te = e.timestamp; r.bytes = e.encodedDataLength; } });
cdp.on('Network.requestServedFromCache', (e) => { const r = net.get(e.requestId); if (r) r.fromCache = true; });

const frames = [];
let fi = 0, pending = 0;
cdp.on('Page.screencastFrame', async (f) => {
  const i = fi++, file = `f${String(i).padStart(5, '0')}.jpg`;
  frames.push({ i, file, t: f.metadata.timestamp * 1000, sy: f.metadata.scrollOffsetY });
  pending++;
  fs.writeFile(path.join(OUT, 'f', file), Buffer.from(f.data, 'base64'), () => { pending--; });
  try { await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }); } catch (e) {}
});
await cdp.send('Page.enable');
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 90, maxWidth: DEV === 'phone' ? 390 : 720, maxHeight: DEV === 'phone' ? 844 : 450, everyNthFrame: 1 });

async function swipe(dy, speed) {
  if (DEV === 'phone') {
    const x = Math.round(W / 2), s = Math.sign(dy) || 1, dist = Math.min(Math.abs(dy), Math.round(H * 0.6));
    const y0 = s > 0 ? Math.round(H * 0.8) : Math.round(H * 0.2), steps = Math.max(2, Math.round(dist / speed * 1000 / 16));
    const sent = [cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: y0 }] })];
    for (let k = 1; k <= steps; k++) { await sleep(16); sent.push(cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: Math.round(y0 - s * dist * k / steps) }] })); }
    sent.push(cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }));
    await Promise.all(sent);
  } else {
    const n = Math.max(1, Math.round(Math.abs(dy) / 100)), gap = Math.max(8, Math.round(1000 * 100 / speed));
    for (let k = 0; k < n; k++) { await page.mouse.wheel(0, Math.sign(dy) * 100); await sleep(gap); }
  }
}
async function tap(sel) {
  const el = await page.$(sel); if (!el) { mark('chýba ' + sel); return false; }
  const b = await el.boundingBox(); if (!b) { mark('neviditeľné ' + sel); return false; }
  if (DEV === 'phone') await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2); else await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
  return true;
}
const sy = () => page.evaluate(() => scrollY);
const maxY = () => page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
const filmOn = !/film=off/.test(Q);

mark('goto ' + URL0);
const tNav = Date.now();
await page.goto(URL0, { waitUntil: 'commit', timeout: 120000 });
await page.waitForLoadState('load', { timeout: 180000 }).catch(() => mark('load timeout'));
mark('load');
try {
  if (SCEN === 'uvod') {
    await sleep(Number(arg('uvodms', 8000)));
  } else {
    await sleep(1500);
    if (DEV === 'phone') await swipe(3, 200); else await page.mouse.move(W / 2 + 3, H / 2);
    if (filmOn) mark('film: ' + await page.evaluate(() => Promise.race([window.BS30_FILM ? window.BS30_FILM.ready : 'bez', new Promise((r) => setTimeout(() => r('timeout'), 40000))])).catch((e) => String(e)));
    await sleep(filmOn ? 4000 : 1000);
    if (SCEN === 'svih') {
      const M = await maxY(); mark('svih dole');
      const dl = Date.now() + 160000;
      for (let k = 0; k < SWIPES && Date.now() < dl && (await sy()) < M - 5; k++) { await swipe(500, 5000); await sleep(900); }
      await sleep(2500); mark('svih hore');
      const dl2 = Date.now() + 160000;
      for (let k = 0; k < SWIPES && Date.now() < dl2 && (await sy()) > 5; k++) { await swipe(-500, 5000); await sleep(900); }
      mark('svih koniec'); await sleep(3000);
    } else if (SCEN === 'skok') {
      for (const c of CIELE) {
        if (c === 'PATA') { await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })); mark('skok PATA'); await sleep(WAIT); continue; }
        if (c === 'HORE') { mark('klik Späť hore'); await tap('.footer-top'); await sleep(WAIT); continue; }
        if (c === 'LOGO') { mark('klik logo'); await tap('.site-header .brand'); await sleep(WAIT); continue; }
        if (c.startsWith('Y')) { await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), Number(c.slice(1))); mark('skok ' + c); await sleep(WAIT); continue; }
        if (DEV === 'phone') { await tap('.nav-toggle'); await sleep(800); }
        mark('menu ' + c);
        await tap(`#nav a[href="${c}"]`);
        await sleep(WAIT);
      }
    }
  }
} catch (e) { mark('chyba scenára: ' + e.message); }
mark('koniec');
await sleep(300);
await cdp.send('Page.stopScreencast').catch(() => {});
const ov = await page.evaluate(() => ({ log: window.__ov.log, marks: window.__ov.marks, t0: window.__ov.t0, cas: window.__cas || null })).catch(() => ({ log: [], marks: [] }));
for (let k = 0; k < 50 && pending; k++) await sleep(100);
const reqs = [...net.values()].filter((r) => /img\/|seq\/|video\//.test(r.url)).map((r) => ({ url: r.url, od: wallOff != null ? Math.round(wallOff + r.ts * 1000 - tNav) : null, do: r.te && wallOff != null ? Math.round(wallOff + r.te * 1000 - tNav) : null, kB: r.bytes ? Math.round(r.bytes / 1024) : null, cache: !!r.fromCache }));
fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify({ name: NAME, dev: DEV, dpr: VIEW.deviceScaleFactor, net: NET, cpu: CPU, q: Q, cache: CACHE, scen: SCEN, rm: RM, savedata: SAVE, inject: INJECT, url: URL0, W, H, tNav, marks, errs, frames, reqs, pmarks: ov.marks, pt0: ov.t0 }));
fs.writeFileSync(path.join(OUT, 'log.json'), JSON.stringify(ov.log));
if (ov.cas) fs.writeFileSync(path.join(OUT, 'cas.json'), JSON.stringify(ov.cas));
console.log(`snímok ${frames.length}, záznamov ${ov.log.length}, chýb ${errs.length}`);
if (errs.length) console.log(errs.slice(0, 5).join('\n'));
await browser.close();
