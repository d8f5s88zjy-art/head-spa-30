#!/usr/bin/env node
/* Čierne okná počas skrolu a skokov (doplnok k meraj.mjs, osobitný beh, lebo záznam obrazovky zaťaží prehliadač).
   node cierne.mjs --url=http://127.0.0.1:8433/barbershop-30/ [--film=on|off|predvolene] [--cpu=4] [--siet=fast4g|slow4g]
                   [--zariadenie=telefon|pocitac] [--out=dir] [--meno=...]
   Postup: Page.startScreencast (JPEG, 390 px na šírku), scenáre: rýchly švih celou stránkou, skok z menu do Služieb,
   skok z menu do Kontaktu, rýchly švih späť hore. Každá snímka sa uloží s polohou skrolu z metadát. Potom
   cierne.py zmeria, aká časť plochy, kde má byť obraz (okno mimo nepriehľadných pásov .band a pätičky), je
   jednofarebná tmavá (bloky 10 × 10 px: jas < 30 a rozptyl < 5) a ako dlho. */
import { createRequire } from 'module';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.length ? v.join('=') : '1']; }));
const BASE = opt.url || 'http://127.0.0.1:8433/barbershop-30/';
const FILM = opt.film || 'on';
const CPU = Number(opt.cpu || 4);
const DEV = opt.zariadenie === 'pocitac' ? 'pocitac' : 'telefon';
const NET = opt.siet || 'fast4g';
const here = path.dirname(new URL(import.meta.url).pathname);
const MENO = opt.meno || `cierne-${DEV}-cpu${CPU}-film-${FILM}-${NET}`;
const OUT = path.resolve(opt.out || path.join(here, 'vysledky'), MENO);
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const NETS = { fast4g: { offline: false, latency: 165, downloadThroughput: 9e6 * 0.9 / 8, uploadThroughput: 1.5e6 * 0.9 / 8 }, slow4g: { offline: false, latency: 562.5, downloadThroughput: 1.6e6 * 0.9 / 8, uploadThroughput: 750e3 * 0.9 / 8 } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const query = FILM === 'on' ? '?film=on' : FILM === 'off' ? '?film=off' : '';
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext(DEV === 'telefon'
  ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: 'dark', locale: 'sk-SK' }
  : { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, colorScheme: 'dark', locale: 'sk-SK' });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await cdp.send('Network.enable');
if (NETS[NET]) await cdp.send('Network.emulateNetworkConditions', NETS[NET]);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
await page.goto(BASE + query, { waitUntil: 'load', timeout: 120000 });
// koniec úvodného filmu (ak beží)
for (let i = 0; i < 120; i++) { if (!(await page.evaluate(() => document.documentElement.classList.contains('pro')))) break; await sleep(250); }
await sleep(1500);
const frames = []; let scen = 'start';
cdp.on('Page.screencastFrame', async (f) => {
  const name = String(frames.length).padStart(5, '0') + '.jpg';
  fs.writeFileSync(path.join(OUT, name), Buffer.from(f.data, 'base64'));
  frames.push({ f: name, t: f.metadata.timestamp, y: f.metadata.scrollOffsetY, s: scen });
  cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
});
const W = DEV === 'telefon' ? 390 : 720, H = DEV === 'telefon' ? 844 : 450;
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 60, maxWidth: W, maxHeight: H, everyNthFrame: 1 });
async function swipe(y0, dist, ms) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: y0 }] });
  const t0 = Date.now();
  for (;;) { const e = Math.min(1, (Date.now() - t0) / ms); await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 195, y: y0 - dist * e }] }); if (e >= 1) break; await sleep(8); }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}
async function settle(max = 4000) { const t0 = Date.now(); let last = -1, since = Date.now(); while (Date.now() - t0 < max) { const y = await page.evaluate(() => scrollY); if (y !== last) { last = y; since = Date.now(); } else if (Date.now() - since > 300) break; await sleep(50); } }
const maxY = await page.evaluate(() => document.scrollingElement.scrollHeight - innerHeight);
// nepriehľadné pásy a pätička v súradniciach stránky (tam je tmavá plocha s textom zámerná)
const bands = await page.evaluate(() => [...document.querySelectorAll('.band, footer, .site-footer')].map((e) => { const r = e.getBoundingClientRect(); return [Math.round(r.top + scrollY), Math.round(r.bottom + scrollY)]; }));
const secs = await page.evaluate(() => [...document.querySelectorAll('section[data-scene], footer')].map((e) => { const r = e.getBoundingClientRect(); return [e.id, Math.round(r.top + scrollY)]; }));
if (DEV === 'telefon') {
  scen = 'svih-dole';
  for (let i = 0; i < 60; i++) { if ((await page.evaluate(() => scrollY)) >= maxY - 4) break; await swipe(700, 560, 80); await settle(); }
  await sleep(1500);
  scen = 'svih-hore';
  for (let i = 0; i < 60; i++) { if ((await page.evaluate(() => scrollY)) <= 8) break; await swipe(160, -560, 80); await settle(); }
  await sleep(1500);
  const tapSel = async (sel) => { const el = await page.$(sel); const b = el && await el.boundingBox(); if (b) await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2); };
  // otvorené menu (tmavý panel s odkazmi) sa nevyhodnocuje; skok sa ráta od ťuknutia na odkaz
  const skok = async (kam, meno) => { scen = 'menu-otvorene'; await tapSel('.nav-toggle'); await sleep(800); await tapSel(`#nav a[href="#${kam}"]`); await sleep(350); scen = meno; await sleep(3650); };
  await skok('sluzby', 'menu-sluzby'); await skok('kontakt', 'menu-kontakt'); await skok('vstup-dnu', 'menu-prehliadka'); await skok('galeria', 'menu-galeria');
  scen = 'znacka-hore'; await tapSel('.brand'); await sleep(4000);
} else {
  scen = 'koliesko-dole'; await page.mouse.move(720, 450);
  for (let i = 0; i < 400; i++) { if ((await page.evaluate(() => scrollY)) >= maxY - 4) break; await page.mouse.wheel(0, 240); await sleep(30); }
  await sleep(1500);
  scen = 'menu-sluzby'; await page.click('.nav a[href="#sluzby"]'); await sleep(4000);
  scen = 'menu-prehliadka'; await page.click('.nav a[href="#vstup-dnu"]'); await sleep(4000);
  scen = 'znacka-hore'; await page.click('.brand'); await sleep(4000);
}
await cdp.send('Page.stopScreencast');
await sleep(300);
fs.writeFileSync(path.join(OUT, 'snimky.json'), JSON.stringify({ meno: MENO, film: FILM, cpu: CPU, siet: NET, zariadenie: DEV, vh: DEV === 'telefon' ? 844 : 900, vw: DEV === 'telefon' ? 390 : 1440, sirka: W, pasy: bands, sekcie: secs, snimky: frames }));
await browser.close();
// vyhodnotenie (Python, Pillow)
const r = execFileSync('python3', ['-I', path.join(here, 'cierne.py'), OUT], { encoding: 'utf8' });
console.log(r);
