#!/usr/bin/env node
// Snímky odovzdania zálohy filmu v presných časoch: prechody CSS sa cez CDP Animation zastavia (playbackRate 0)
// a posunú na čas t (seekAnimations), film sa zastaví (BS30_FILM.pause), takže snímka ukazuje presne stav v čase t.
//   node odovzdanie-snimky.mjs --dev=p390|d1440 [--port=8211] [--casy=0,250,450,700,1300]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const dev = opt.dev || 'p390';
const D = { p390: { vp: { width: 390, height: 844 }, dsf: 3, mob: true }, d1440: { vp: { width: 1440, height: 900 }, dsf: 1, mob: false } }[dev];
const HERE = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.join(HERE, 'shots', `odovzdanie-snimky-${dev}`); fs.mkdirSync(OUT, { recursive: true });
const CASY = String(opt.casy || '0,250,450,700,1300').split(',').map(Number);
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: D.vp, deviceScaleFactor: D.dsf, isMobile: D.mob, hasTouch: D.mob, locale: 'sk-SK' });
const page = await ctx.newPage();
// len v teste: bez zníženia rozlíšenia plátna pri pomalom softvérovom kreslení (telefón s grafikou ho nezníži)
await page.route('**/assets/film.js*', async (route) => {
  const r = await route.fetch(); const body = (await r.text()).replace('if (dpr > DPR_MIN) { dpr = Math.max(', 'if (false && dpr > DPR_MIN) { dpr = Math.max(');
  await route.fulfill({ response: r, body, headers: { ...r.headers(), 'content-type': 'text/javascript' } });
});
await page.goto(`http://127.0.0.1:${opt.port || 8211}/barbershop-30/?film=on&uvod=off`, { waitUntil: 'load', timeout: 120000 });
await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].filter((i) => i.getBoundingClientRect().top < innerHeight && i.offsetParent).map((i) => i.decode().catch(() => {}))); });
await page.waitForTimeout(1000);
// snímka pred filmom (záloha)
await page.screenshot({ path: path.join(OUT, 'pred.jpg'), type: 'jpeg', quality: 88, timeout: 120000 });
const cdp = await ctx.newCDPSession(page);
await cdp.send('Animation.enable');
const anims = new Map();
cdp.on('Animation.animationStarted', (e) => { anims.set(e.animation.id, e.animation); });
await cdp.send('Animation.setPlaybackRate', { playbackRate: 0 });
if (D.mob) await page.touchscreen.tap(5, Math.round(D.vp.height * 0.5)); else await page.mouse.move(200, 300);
await page.waitForFunction(() => document.documentElement.classList.contains('world-in'), null, { timeout: 120000 });
// film už nakreslil prvý snímok; ďalej stojí, nech sa obraz pod prechodom nemení
await page.waitForTimeout(1500);
await page.evaluate(() => window.BS30_FILM.pause(true));
// len dlhé prechody odovzdania (záloha 0,7 s, plátno 1,2 s); krátke (lišta, ikony) už skončili a nedajú sa posunúť
const ids = [...anims.values()].filter((a) => a.type === 'CSSTransition' && a.source && a.source.duration >= 700).map((a) => a.id);
console.log('prechody CSS:', [...anims.values()].filter((a) => a.type === 'CSSTransition').map((a) => `${a.name} ${a.source && a.source.duration}ms`).join(', '));
const rows = [];
for (const t of CASY) {
  await cdp.send('Animation.seekAnimations', { animations: ids, currentTime: t });
  await page.waitForTimeout(400);
  const st = await page.evaluate(() => {
    const s = document.querySelector('.film-shot[data-shot="rohozka"] .film-still'), c = document.querySelector('.film-canvas');
    return { zaloha: +getComputedStyle(s).opacity, viditelna: getComputedStyle(s).visibility, platno: +getComputedStyle(c).opacity };
  });
  const f = path.join(OUT, `t${String(t).padStart(4, '0')}.jpg`);
  await page.screenshot({ path: f, type: 'jpeg', quality: 88, timeout: 120000 });
  rows.push({ t, ...st, file: path.basename(f) });
  console.log(t, JSON.stringify(st));
}
await cdp.send('Animation.setPlaybackRate', { playbackRate: 1 });
await browser.close();
fs.writeFileSync(path.join(OUT, 'casy.json'), JSON.stringify(rows, null, 1));
