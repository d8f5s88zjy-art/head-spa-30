#!/usr/bin/env node
/* Overenie KF-01: skok späť hore tak, ako ho urobí návštevník (ťuk na logo „na začiatok“, href="#uvod",
   natívny plynulý skrol z CSS) zo spodku stránky; a skok z menu (Služby). Screencast + snímky obrazovky v časoch.
   node over-skok.mjs --port=8433 --cpu=4 --net=fast4g --dpr=3 --out=skok1 [--cakaj=20000] */
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const here = path.dirname(new URL(import.meta.url).pathname);
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.length ? v.join('=') : '1']; }));
const PORT = opt.port || 8433, CPU = Number(opt.cpu || 4), NET = opt.net || 'fast4g', DPR = Number(opt.dpr || 3), CAKAJ = Number(opt.cakaj || 20000);
const OUT = path.resolve(here, opt.out || 'skok');
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const NETS = { fast4g: { offline: false, latency: 165, downloadThroughput: 1012500, uploadThroughput: 168750, connectionType: 'cellular4g' }, slow4g: { offline: false, latency: 562.5, downloadThroughput: 180000, uploadThroughput: 84375, connectionType: 'cellular4g' } };
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: DPR, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36' });
await ctx.addInitScript({ path: path.join(here, 'sonda.js') });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await cdp.send('Network.enable');
if (NETS[NET]) await cdp.send('Network.emulateNetworkConditions', NETS[NET]);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
let origin = 0, castDir = null;
cdp.on('Page.screencastFrame', async (f) => {
  try { await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }); } catch (e) { /* nič */ }
  if (castDir) fs.writeFileSync(path.join(castDir, String(Math.round(f.metadata.timestamp * 1000 - origin)).padStart(7, '0') + '.jpg'), Buffer.from(f.data, 'base64'));
});
const cast = async (n) => { castDir = path.join(OUT, n); fs.mkdirSync(castDir, { recursive: true }); await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 60, maxWidth: 390, maxHeight: 844 }); };
const uncast = async () => { await cdp.send('Page.stopScreencast'); castDir = null; };
const T = () => page.evaluate(() => performance.now());
const mark = (n) => page.evaluate((n) => window.__OV.mark(n), n);
const st = () => page.evaluate(() => { const s = window.BS30_FILM.state; return { S: +s.S.toFixed(3), T: +s.T.toFixed(3), cur: s.current, ready: s.ready.filter((r) => r.ready).map((r) => r.shot).join(' '), loading: s.ready.filter((r) => r.loading).map((r) => r.shot).join(' '), y: Math.round(scrollY) }; });
const snimky = [];
const shot = async (n, od) => { const a = await T(); await page.screenshot({ path: path.join(OUT, n + '.jpg'), type: 'jpeg', quality: 60, scale: 'css' }); const b = await T(); snimky.push([n, Math.round(a - od), Math.round(b - od)]); };
await page.goto(`http://127.0.0.1:${PORT}/barbershop-30/?film=on&uvod=off`, { waitUntil: 'load', timeout: 120000 });
origin = await page.evaluate(() => performance.timeOrigin);
await sleep(2500);
await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: 700 }] });
for (let i = 1; i <= 10; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 195, y: 700 - 16 * i }] }); await sleep(20); }
await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
for (let i = 0; i < 120; i++) { if (await page.evaluate(() => window.BS30_FILM.state.shown)) break; await sleep(250); }
await sleep(2000);
const vys = { nastavenie: { CPU, NET, DPR, CAKAJ }, scen: {} };
async function skok(meno, klik) {
  await sleep(1000);
  await cast(meno); await sleep(300);
  const od = await T(); await mark(meno);
  await klik();
  for (const ms of [250, 600, 1200]) { const t = await T(); if (t - od < ms) await sleep(ms - (t - od)); await shot(meno + '-' + ms + 'ms', od); }
  await sleep(6000);
  await uncast();
  vys.scen[meno] = { od, po: await T(), stav: await st() };
  log(meno, JSON.stringify(vys.scen[meno].stav));
}
// dole: menu -> Kontakt (plynulý skrol), počkať na načítanie a utíšenie grafiky
await page.tap('.nav-toggle'); await sleep(800); await page.tap('#nav a[href="#kontakt"]');
for (let i = 0; i < 160; i++) { const s = await st(); if (s.cur && /vstup/.test(s.cur) && s.ready.split(' ').includes(s.cur) && Math.abs(s.T - s.S) < 0.01) break; await sleep(500); }
log('dole', JSON.stringify(await st()));
await sleep(CAKAJ);
await skok('logo-hore', () => page.tap('a.brand'));
await sleep(CAKAJ);
await page.tap('.nav-toggle'); await sleep(800);
await skok('menu-sluzby', () => page.tap('#nav a[href="#sluzby"]'));
vys.snimky = snimky;
vys.sonda = await page.evaluate(() => { const O = window.__OV; return { st: O.st, cls: O.cls, lt: O.lt, loaf: O.loaf, fr: O.fr.map((f) => [+f.ts.toFixed(1), +f.js.toFixed(2), f.draw, f.clr, f.mip, f.band, +f.bandMs.toFixed(2), f.full, +f.fullMs.toFixed(2)]) }; });
fs.writeFileSync(path.join(OUT, 'vysledok.json'), JSON.stringify(vys, null, 0));
await browser.close();
