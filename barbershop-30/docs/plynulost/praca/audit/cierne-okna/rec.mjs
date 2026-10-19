#!/usr/bin/env node
// Lov na čierne okná – nahrávač (BARBERSHOP 30).
// Nahrá skrolovanie stránky cez CDP Page.startScreencast (každý snímok s časovou značkou a polohou skrolu)
// a zároveň každých 100 ms zapisuje stav stránky (triedy <html>, stav filmu, zálohy, obdĺžniky pásov a médií),
// aby sa dal každý tmavý snímok priradiť k príčine. Analýza: ana.py.
//
//   node rec.mjs --name=X --dev=phone|desk --net=fast4g|slow4g|none --cpu=4 --film=on|off|default
//                --cache=cold|warm|reload --scen=uvod|pomaly|svih|menu|dvere|jazyk|hore [--rm] [--savedata]
//                [--port=8174] [--uvod=off]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');

const here = path.dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : (process.argv.includes(`--${k}`) ? true : d); };
const NAME = arg('name', 'run');
const DEV = arg('dev', 'phone');
const NET = arg('net', 'fast4g');
const CPU = Number(arg('cpu', 4));
const FILM = arg('film', 'on');
const CACHE = arg('cache', 'cold');
const SCEN = arg('scen', 'uvod');
const RM = !!arg('rm', false);
const SAVE = !!arg('savedata', false);
const PORT = arg('port', '8174');
const UVOD = arg('uvod', '');
const LANG = arg('lang', '');
const DPR = arg('dpr', '');
const OUT = path.join(here, 'runs', NAME);
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'frames'), { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// sieť podľa predvolieb DevTools (Fast 4G / Slow 4G, s násobičmi latencie ako v Chrome)
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

const q = [];
if (FILM === 'on') q.push('film=on');
if (FILM === 'off') q.push('film=off');
if (UVOD) q.push('uvod=' + UVOD);
if (LANG) q.push('lang=' + LANG);
const URL0 = `http://127.0.0.1:${PORT}/barbershop-30/` + (q.length ? '?' + q.join('&') : '');

// zapisovač stavu v stránke (každých 100 ms; obdĺžniky pásov a médií v súradniciach stránky raz za 500 ms)
const LOGGER = `(() => {
  const L = window.__bwlog = [];
  window.__bwmark = (m) => L.push({ t: Date.now(), mark: m });
  let lastGeo = '', geoAt = 0;
  const pg = (r, y) => [Math.round(r.left), Math.round(r.top + y), Math.round(r.right), Math.round(r.bottom + y)];
  const tick = () => {
    try {
      const d = document, h = d.documentElement, y = scrollY, now = Date.now();
      const e = { t: now, y: Math.round(y), cls: h.className, rs: d.readyState };
      const hdr = d.querySelector('.site-header'); if (hdr) e.menu = hdr.dataset.menu;
      const f = window.BS30_FILM;
      if (f && f.state && f.state.on) {
        const s = f.state;
        e.film = { shown: s.shown, S: +s.S.toFixed(3), T: +s.T.toFixed(3), mix: +(+s.mix).toFixed(3), cur: s.current, cut: s.cut, frames: s.frames, pro: s.pro, leaving: s.leaving, outside: s.outside, dpr: s.dpr,
          ready: s.ready.map((r) => (r.ready ? 1 : 0) + (r.loading ? 2 : 0)).join(''), seq: s.seq.map((q) => q.got + '/' + q.n + ':' + q.tex).join('|') };
      }
      // zálohy titulných kariet (pokojná verzia): is-near, is-shown, --so, či je obrázok dekódovaný
      const st = [];
      d.querySelectorAll('.film-shot').forEach((el, i) => {
        const so = el.style.getPropertyValue('--so');
        const img = el.querySelector('.film-still img');
        const cs = img ? getComputedStyle(el.querySelector('.film-still')) : null;
        st.push([i, el.classList.contains('is-near') ? 1 : 0, el.classList.contains('is-shown') ? 1 : 0, so ? +(+so).toFixed(2) : -1,
          img ? (img.complete && img.naturalWidth > 0 ? 1 : 0) : -1, cs ? cs.display[0] + (cs.visibility[0]) + (+cs.opacity).toFixed(2) : '']);
      });
      e.st = st;
      if (now - geoAt > 500) {
        geoAt = now;
        const bands = [...d.querySelectorAll('.band, .site-footer')].map((el) => pg(el.getBoundingClientRect(), y));
        const media = [...d.querySelectorAll('.band .media, .band .team-portrait, .band .video-window, .band .gallery-btn')].map((el) => pg(el.getBoundingClientRect(), y));
        const g = JSON.stringify([bands, media]);
        if (g !== lastGeo) { lastGeo = g; e.geo = { bands, media }; }
      }
      L.push(e);
    } catch (err) { window.__bwlog.push({ t: Date.now(), err: String(err) }); }
  };
  setInterval(tick, 100);
  addEventListener('load', () => window.__bwmark('load'));
  // presný čas otvorenia a zatvorenia menu (prekrytie menu je zámerne tmavé, do čiernych okien sa nepočíta)
  const mo = new MutationObserver(() => { const h = document.querySelector('.site-header'); if (h) L.push({ t: Date.now(), menuEv: h.dataset.menu }); });
  const hookMenu = () => { const h = document.querySelector('.site-header'); if (h) mo.observe(h, { attributes: true, attributeFilter: ['data-menu'] }); else setTimeout(hookMenu, 50); };
  hookMenu();
  new PerformanceObserver((l) => l.getEntries().forEach((x) => window.__bwmark((x.entryType === 'largest-contentful-paint' ? 'lcp:' + (x.url || '').split('/').pop() : x.name) + '@' + Math.round(x.startTime)))).observe({ type: 'largest-contentful-paint', buffered: true });
  try { new PerformanceObserver((l) => l.getEntries().forEach((x) => window.__bwmark(x.name + '@' + Math.round(x.startTime)))).observe({ type: 'paint', buffered: true }); } catch (e) {}
})();`;
const SAVEDATA = `try { Object.defineProperty(navigator, 'connection', { configurable: true, get: () => ({ saveData: true, effectiveType: '4g', addEventListener() {}, removeEventListener() {} }) }); } catch (e) {}`;

const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ ...VIEW, reducedMotion: RM ? 'reduce' : 'no-preference', locale: 'sk-SK' });
await ctx.addInitScript(LOGGER);
if (SAVE) await ctx.addInitScript(SAVEDATA);

const marks = [];
const mark = (m) => { marks.push({ t: Date.now(), mark: m }); console.log(new Date().toISOString().slice(11, 23), m); };

async function setup(page) {
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  if (NETS[NET]) await cdp.send('Network.emulateNetworkConditions', NETS[NET]);
  if (CPU > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
  return cdp;
}

// zahriatie cache (návrat): prvá návšteva bez nahrávania, celá stránka raz prejdená
if (CACHE === 'warm' || CACHE === 'reload') {
  const p0 = await ctx.newPage();
  const c0 = await ctx.newCDPSession(p0);
  await c0.send('Network.enable');
  await p0.goto(URL0, { waitUntil: 'load', timeout: 120000 });
  await sleep(3000);
  // prejsť celou stránkou, aby sa stiahli zábery a zálohy ako pri skutočnej prvej návšteve
  const total = await p0.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < total; y += Math.round(H * 0.6)) { await p0.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'instant' }), y); await sleep(350); }
  await p0.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await sleep(1500);
  if (CACHE === 'warm') await p0.close();
  mark('cache zahriata');
}

const page = CACHE === 'reload' ? ctx.pages()[0] : await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
const reqs = [];
page.on('requestfinished', (r) => { const t = r.timing(); reqs.push({ url: r.url().replace(/^.*barbershop-30\//, ''), end: Date.now(), dur: Math.round(t.responseEnd) }); });
const cdp = await setup(page);
if (CACHE === 'cold') await cdp.send('Network.clearBrowserCache');

// screencast: každý snímok na disk s časom a polohou skrolu
const frames = [];
let fi = 0, pending = 0;
cdp.on('Page.screencastFrame', async (f) => {
  const i = fi++;
  const file = `f${String(i).padStart(5, '0')}.jpg`;
  frames.push({ i, file, t: f.metadata.timestamp * 1000, sy: f.metadata.scrollOffsetY, w: f.metadata.deviceWidth, h: f.metadata.deviceHeight, top: f.metadata.offsetTop });
  pending++;
  fs.writeFile(path.join(OUT, 'frames', file), Buffer.from(f.data, 'base64'), () => { pending--; });
  try { await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }); } catch (e) { /* koniec */ }
});
await cdp.send('Page.enable');
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 70, maxWidth: DEV === 'phone' ? 390 : 720, maxHeight: DEV === 'phone' ? 844 : 450, everyNthFrame: 1 });

// ---- pomocníci pre gestá ----
async function swipe(dy, speed, fling = false) {
  // dy > 0: obsah ide nahor (skrol nadol), prst ide hore
  if (DEV === 'phone') {
    // skutočný ťah prstom cez Input.dispatchTouchEvent (synthesizeScrollGesture s dotykom v tomto Chromiu neskroluje);
    // prst ostáva na displeji (najviac 60 % výšky), švih = rýchly krátky ťah a pustenie, zotrvačnosť dorobí Chrome
    const x = Math.round(W / 2), s = Math.sign(dy) || 1;
    const dist = Math.min(Math.abs(dy), Math.round(H * 0.6));
    const y0 = s > 0 ? Math.round(H * 0.8) : Math.round(H * 0.2);
    const steps = Math.max(2, Math.round(dist / speed * 1000 / 16));
    // pohyby sa posielajú v reálnom čase bez čakania na potvrdenie (pri zaťaženom vlákne by sa ťah spomalil a švih by nebol švihom)
    const sent = [cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: y0 }] })];
    for (let k = 1; k <= steps; k++) {
      await sleep(16);
      sent.push(cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: Math.round(y0 - s * dist * k / steps) }] }));
    }
    if (!fling) { await sleep(150); sent.push(cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: Math.round(y0 - s * dist) }] })); await sleep(50); }
    sent.push(cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }));
    await Promise.all(sent);
  } else {
    // koliesko po zárezoch 100 px (app.js z neho robí plynulý skrol)
    const n = Math.max(1, Math.round(Math.abs(dy) / 100));
    const gap = Math.max(8, Math.round(1000 * 100 / speed));
    for (let k = 0; k < n; k++) { await page.mouse.wheel(0, Math.sign(dy) * 100); await sleep(gap); }
  }
}
const sy = () => page.evaluate(() => scrollY);
const maxY = () => page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
async function tapSel(sel) {
  const el = await page.$(sel);
  if (!el) { mark('chýba ' + sel); return false; }
  const b = await el.boundingBox();
  if (!b) { mark('neviditeľné ' + sel); return false; }
  if (DEV === 'phone') await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
  else await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
  return true;
}
async function waitFilm(ms = 30000) {
  return page.evaluate((ms) => Promise.race([window.BS30_FILM ? window.BS30_FILM.ready : Promise.resolve('bez filmu'), new Promise((r) => setTimeout(() => r('čas vypršal'), ms))]), ms).catch((e) => String(e));
}

// ---- scenár ----
mark('goto ' + URL0);
const tNav = Date.now();
if (CACHE === 'reload') await page.reload({ waitUntil: 'commit' });
else await page.goto(URL0, { waitUntil: 'commit', timeout: 120000 });
await page.waitForLoadState('load', { timeout: 180000 }).catch(() => mark('load timeout'));
mark('load');
const nudge = async () => { if (DEV === 'phone') await swipe(2, 200); else await page.mouse.move(W / 2 + 3, H / 2); };

try {
  if (SCEN === 'uvod') {
    // prvá návšteva: nič nerobiť 6 s (prológ, prvý obraz), potom drobný pohyb a čakanie na film
    await sleep(6000);
    mark('pohyb'); await nudge();
    mark('film ready: ' + await waitFilm(20000));
    await sleep(4000);
  } else {
    await sleep(1500);
    mark('pohyb'); await nudge();
    if (FILM !== 'off') mark('film ready: ' + await waitFilm(20000));
    // prológ (ak beží) sa nechá dobehnúť
    await sleep(FILM === 'off' ? 500 : 5000);
    if (SCEN === 'pomaly') {
      // pomalé skrolovanie prstom: ťahy po 280 px rýchlosťou 600 px/s, medzi nimi 350 ms, celou stránkou
      const M = await maxY();
      mark('pomaly start');
      const dl = Date.now() + 240000;
      for (let k = 0; k < 200 && Date.now() < dl && (await sy()) < M - 5; k++) { await swipe(280, 600); await sleep(350); }
      mark('pomaly koniec'); await sleep(2500);
    } else if (SCEN === 'svih') {
      // rýchle švihy so zotrvačnosťou: 900 px rýchlosťou 5000 px/s, 700 ms pauza, celou stránkou nadol a späť
      const M = await maxY();
      mark('svih dole');
      const dl1 = Date.now() + 150000;
      for (let k = 0; k < 60 && Date.now() < dl1 && (await sy()) < M - 5; k++) { await swipe(500, 5000, true); await sleep(900); }
      await sleep(2500);
      mark('svih hore');
      const dl2 = Date.now() + 150000;
      for (let k = 0; k < 60 && Date.now() < dl2 && (await sy()) > 5; k++) { await swipe(-500, 5000, true); await sleep(900); }
      mark('svih koniec'); await sleep(3000);
    } else if (SCEN === 'menu') {
      const links = ['#vstup-dnu', '#sluzby', '#tim', '#galeria', '#kontakt', '#vstup-dnu'];
      for (const h of links) {
        if (DEV === 'phone') { await tapSel('.nav-toggle'); await sleep(700); }
        mark('menu ' + h);
        await tapSel(`#nav a[href="${h}"]`);
        await sleep(4500);
      }
      // návrat hore: logo v lište (#uvod)
      mark('hore logo'); await tapSel('.site-header .brand'); await sleep(5000);
      // skok dole cez pätičku a „Späť hore“
      await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
      mark('skok na pätičku'); await sleep(4000);
      mark('spat hore'); await tapSel('.footer-top'); await sleep(5000);
    } else if (SCEN === 'dvere') {
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await sleep(1500);
      mark('spat na ulicu'); await tapSel('.film-door'); await sleep(5000);
      mark('vojdi dnu'); await tapSel('.film-door'); await sleep(5000);
      // gesto: potiahnutie nadol na vrchu (von) a nahor (dnu)
      mark('tah von'); await swipe(-200, 800); await sleep(5000);
      mark('tah dnu'); await swipe(200, 800); await sleep(5000);
    } else if (SCEN === 'jazyk') {
      if (DEV === 'phone') { await tapSel('.nav-toggle'); await sleep(900); mark('jazyk EN'); await tapSel('[data-lang-pick="en"]'); await sleep(1500); await tapSel('.nav-toggle'); }
      else { await tapSel('.lang-btn'); await sleep(500); mark('jazyk EN'); await tapSel('[data-lang-pick="en"]'); }
      await sleep(3000);
      mark('svih po preklade');
      for (let k = 0; k < 6; k++) { await swipe(500, 5000, true); await sleep(900); }
      await sleep(2000);
      if (DEV === 'phone') { await tapSel('.nav-toggle'); await sleep(900); mark('jazyk SK'); await tapSel('[data-lang-pick="sk"]'); await sleep(1500); await tapSel('.nav-toggle'); }
      else { await tapSel('.lang-btn'); await sleep(500); mark('jazyk SK'); await tapSel('[data-lang-pick="sk"]'); }
      await sleep(4000);
    } else if (SCEN === 'hore') {
      // dlhý skok: dole na koniec a hneď hore (Home), ako pri rýchlom švihu na vrch
      for (let k = 0; k < 8; k++) { await swipe(1500, 6000, true); await sleep(400); }
      await sleep(2000);
      mark('skok hore (scrollTo smooth)'); await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' })); await sleep(6000);
    }
  }
} catch (e) { mark('chyba scenára: ' + e.message); }

mark('koniec');
await sleep(300);
await cdp.send('Page.stopScreencast').catch(() => {});
const log = await page.evaluate(() => window.__bwlog).catch(() => []);
for (let k = 0; k < 50 && pending; k++) await sleep(100);
fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify({ name: NAME, dpr: VIEW.deviceScaleFactor, dev: DEV, net: NET, cpu: CPU, film: FILM, cache: CACHE, scen: SCEN, rm: RM, savedata: SAVE, url: URL0, W, H, tNav, marks, errs, frames, reqs }, null, 0));
fs.writeFileSync(path.join(OUT, 'log.json'), JSON.stringify(log));
console.log(`snímok ${frames.length}, záznamov ${log.length}, chýb ${errs.length}`);
if (errs.length) console.log(errs.slice(0, 5).join('\n'));
await browser.close();
