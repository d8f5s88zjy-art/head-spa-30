#!/usr/bin/env node
/* Overenie KF-02 deterministicky: zábery sala-rano (plagát videa, pi 5), kreslo-stred-m (pi 6) a kava-m (pi 7) sa
   zadržia v sieti (page.route). Skrol z karty cakaren (S 4) na kartu kreslo-stred (S 6) po krokoch (|T−S| < 1,5, bez skoku).
   Potom sa uvoľní len sala-rano: ak film ostane čierny, hoci susedný záber (pi 5 pri k = 6) je pripravený, KF-02 platí.
   node over-kf02.mjs --port=8400 --cpu=1 --out=kf02 */
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const here = path.dirname(new URL(import.meta.url).pathname);
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.length ? v.join('=') : '1']; }));
const PORT = opt.port || 8400, CPU = Number(opt.cpu || 1);
const OUT = path.resolve(here, opt.out || 'kf02');
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36' });
await ctx.addInitScript({ path: path.join(here, 'sonda.js') });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
// zadržané požiadavky: skupina -> zoznam route
const held = { salarano: [], kreslo: [], kava: [] };
const grp = (u) => (/tim-slucka-poster/.test(u) ? 'salarano' : /img\/film\/kreslo-stred-m-(1448|1086|hlbka)/.test(u) ? 'kreslo' : /img\/film\/kava-m-(1448|1086|hlbka)/.test(u) ? 'kava' : null);
let holdOn = true;
await page.route('**/*', (route) => { const g = grp(route.request().url()); if (g && holdOn && held[g]) { held[g].push(route); return; } route.continue(); });
const release = async (g) => { const a = held[g]; held[g] = null; for (const r of a) await r.continue().catch(() => {}); return a.length; };
const st = () => page.evaluate(() => { const s = window.BS30_FILM.state; return { S: +s.S.toFixed(3), T: +s.T.toFixed(3), cur: s.current, ready: s.ready.filter((r) => r.ready).map((r) => r.shot).join(' '), loading: s.ready.filter((r) => r.loading).map((r) => r.shot).join(' '), mix: s.mix, y: Math.round(scrollY), anchors: s.anchors }; });
const T = () => page.evaluate(() => performance.now());
const mark = (n) => page.evaluate((n) => window.__OV.mark(n), n);
const shots = [];
const shot = async (n) => { const t = await T(); await page.screenshot({ path: path.join(OUT, n + '.jpg'), type: 'jpeg', quality: 70 }); shots.push([n, Math.round(t)]); };
async function swipe() {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: 700 }] });
  for (let i = 1; i <= 10; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 195, y: 700 - 16 * i }] }); await sleep(20); }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}
await page.goto(`http://127.0.0.1:${PORT}/barbershop-30/?film=on&uvod=off`, { waitUntil: 'load', timeout: 120000 });
await sleep(2000);
await swipe();
for (let i = 0; i < 80; i++) { const s = await page.evaluate(() => window.BS30_FILM.state.shown); if (s) break; await sleep(250); }
let s = await st(); const A = s.anchors; log('kotvy', JSON.stringify(A.map(Math.round)));
// k zábere cakaren (pi 4) po krokoch, aby sa načítavali aj susedia a nebol skok
const goStep = async (from, to, steps, ms) => { for (let i = 1; i <= steps; i++) { const y = Math.round(from + (to - from) * i / steps); await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y); await sleep(ms); } };
await goStep(0, A[2], 12, 250); await sleep(2500);
await goStep(A[2], A[4], 12, 250);
for (let i = 0; i < 60; i++) { s = await st(); if (s.ready.split(' ').includes('cakaren-m')) break; await sleep(250); }
await sleep(3000);
s = await st(); log('na cakaren', JSON.stringify({ ...s, anchors: undefined }), 'zadržané', Object.entries(held).map(([k, v]) => k + ':' + (v ? v.length : 'uvoľnené')).join(' '));
await shot('0-cakaren');
// skrol na kartu kreslo-stred (S 6) po krokoch: rýchlosť ~1,7 záberu/s, pružina zaostáva < 1,5
await mark('skrol-na-kreslo');
await goStep(A[4], A[6], 24, 50);
// počkať, kým film naozaj dôjde na záber kreslo-stred (k = 6); pomalé snímky softvérovej grafiky ho brzdia
for (let i = 0; i < 240; i++) { s = await st(); if (s.S >= 5.999) break; await sleep(250); }
await sleep(1500);
s = await st(); log('na kreslo (pred uvoľnením)', JSON.stringify({ ...s, anchors: undefined }));
await shot('1-kreslo-pred-uvolnenim');
await mark('uvolni-salarano');
log('uvoľnené sala-rano:', await release('salarano'));
for (const ms of [800, 1600, 2600]) { await sleep(ms === 800 ? 800 : ms === 1600 ? 800 : 1000); s = await st(); log('po uvoľnení sala-rano ' + ms, JSON.stringify({ ...s, anchors: undefined })); await shot('2-po-salarano-' + ms + 'ms'); }
await mark('uvolni-kreslo');
log('uvoľnené kreslo/kava:', await release('kreslo'), await release('kava'));
holdOn = false;
await sleep(4000);
s = await st(); log('po uvoľnení kreslo', JSON.stringify({ ...s, anchors: undefined }));
await shot('3-po-kreslo');
const sonda = await page.evaluate(() => { const O = window.__OV; return { st: O.st, cls: O.cls, fr: O.fr.map((f) => [+f.ts.toFixed(1), +f.js.toFixed(2), f.draw, f.clr]) }; });
fs.writeFileSync(path.join(OUT, 'vysledok.json'), JSON.stringify({ shots, sonda }, null, 0));
await browser.close();
