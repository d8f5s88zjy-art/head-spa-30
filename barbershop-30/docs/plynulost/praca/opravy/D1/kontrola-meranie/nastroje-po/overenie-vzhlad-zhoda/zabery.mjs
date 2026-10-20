#!/usr/bin/env node
// Overenie VZ-01/03/07/08/11: snímky záberov filmu (alebo pokojnej verzie) pri kotve každej karty,
// s textom aj bez neho, a živé údaje z film.js (plátno, textúra, rozmery fotky v rovine).
//   node zabery.mjs --dev=p390|p360|d1440|d1920 --mode=on|off [--port=8432] [--len=regex]
// mode on = ?film=on&uvod=off (znižovanie rozlíšenia plátna pri pomalom softvérovom kreslení je v teste vypnuté)
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const DEVS = {
  p390: { vp: { width: 390, height: 844 }, dsf: 3, mob: true },
  p360: { vp: { width: 360, height: 780 }, dsf: 3, mob: true },
  d1440: { vp: { width: 1440, height: 900 }, dsf: 1, mob: false },
  d1920: { vp: { width: 1920, height: 1080 }, dsf: 1, mob: false },
};
const dn = opt.dev || 'p390', DEV = DEVS[dn], MODE = opt.mode || 'on', PORT = opt.port || 8432;
const OUT = path.resolve(path.dirname(new URL(import.meta.url).pathname), 'snimky', `${dn}-${MODE}`);
fs.mkdirSync(OUT, { recursive: true });
const q = { off: '?film=off', on: '?film=on&uvod=off' }[MODE];
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: DEV.vp, deviceScaleFactor: DEV.dsf, isMobile: DEV.mob, hasTouch: DEV.mob, colorScheme: 'dark', locale: 'sk-SK' });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.error('pageerror', e.message));
if (MODE === 'on') {
  await page.route('**/assets/film.js*', async (route) => {
    const r = await route.fetch(); let body = await r.text(); const n0 = body.length;
    body = body.replace('if (dpr > DPR_MIN) { dpr = Math.max(', 'if (false && dpr > DPR_MIN) { dpr = Math.max(');
    if (body.length === n0) console.error('POZOR: náhrada nenájdená');
    await route.fulfill({ response: r, body, headers: { ...r.headers(), 'content-type': 'text/javascript' } });
  });
}
await page.goto(`http://127.0.0.1:${PORT}/barbershop-30/${q}`, { waitUntil: 'load', timeout: 120000 });
await page.evaluate(() => document.fonts && document.fonts.ready);
if (DEV.mob) await page.touchscreen.tap(5, 400).catch(() => {}); else await page.mouse.move(200, 300);
if (MODE === 'on') await page.waitForFunction(() => document.documentElement.classList.contains('world-in'), null, { timeout: 90000 });
else await page.waitForTimeout(1500);
console.log('html:', await page.evaluate(() => document.documentElement.className));
// kotvy kariet: film → state.anchors (záber celý na obrazovke); pokojná verzia → stred voľnej dĺžky karty
const cards = await page.evaluate((mode) => {
  const els = [...document.querySelectorAll('.film-shot.is-title')];
  const st = window.BS30_FILM && window.BS30_FILM.state;
  return els.map((el, i) => {
    const r = el.getBoundingClientRect(), top = r.top + scrollY;
    const free = r.height - (el.classList.contains('title-long') ? innerHeight : 0);
    let y = i === 0 ? 0 : Math.round(top + free / 2), kk = -1;
    if (mode === 'on' && st && st.on) { const k = st.ready.findLastIndex((r) => r.shot === el.dataset.shot || r.shot === el.dataset.shot + '-m' || r.shot === el.dataset.shot + '-video'); if (k >= 0) { y = Math.max(0, Math.round(st.anchors[k])); kk = k; } }
    return { i, kk, shot: el.dataset.shot, y, top: Math.round(top), free: Math.round(free) };
  });
}, MODE);
const LEN = opt.len ? new RegExp(opt.len) : null;
const res = [];
for (const c of cards) {
  if (LEN && !LEN.test(c.shot)) continue;
  await page.evaluate((y) => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, y); }, c.y);
  await page.waitForFunction(() => window.__scrollSettled === true, null, { timeout: 10000 }).catch(() => {});
  if (MODE === 'on') {
    await page.waitForFunction((kk) => {
      const st = window.BS30_FILM.state; if (kk >= 0 && Math.abs(st.T - kk) > 0.002) return false; const r = st.ready.find((x) => x.shot === st.current);
      const sq = st.seq.find((s) => s.shot === st.current && s.on);
      return Math.abs(st.S - st.T) < 0.0012 && st.mix < 0.002 && r && r.ready && (!sq || sq.got >= sq.n);
    }, c.kk, { timeout: 150000, polling: 250 }).catch(() => console.error('  film sa neustálil', c.shot));
    await page.waitForTimeout(1800);
  } else {
    await page.evaluate(async () => { const im = [...document.images].filter((i) => { const r = i.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight && getComputedStyle(i).display !== 'none'; }); const t = Date.now(); while (im.some((i) => !i.complete) && Date.now() - t < 15000) await new Promise((r) => setTimeout(r, 100)); await Promise.all(im.map((i) => i.decode().catch(() => {}))); });
    await page.waitForTimeout(1000);
  }
  const info = await page.evaluate(() => {
    const st = window.BS30_FILM && window.BS30_FILM.state;
    const cv = document.querySelector('canvas.film-canvas');
    const vis = [...document.querySelectorAll('.film-shot.is-title')].map((el) => ({ shot: el.dataset.shot, o: +(+el.style.getPropertyValue('--o') || 0).toFixed(2), so: +(+el.style.getPropertyValue('--so') || 0).toFixed(2) })).filter((x) => x.o > 0.01 || x.so > 0.01);
    // záloha v okne: aktuálny súbor a jeho rozmery na obrazovke
    const im = [...document.querySelectorAll('.film-still img')].filter((i) => { const s = getComputedStyle(i.closest('.film-still')); return s.display !== 'none' && s.visibility !== 'hidden' && +s.opacity > 0.5; }).map((i) => { const r = i.getBoundingClientRect(); return { src: (i.currentSrc || '').split('/').slice(-2).join('/'), css: [Math.round(r.width), Math.round(r.height)], left: Math.round(r.left) }; });
    return { scrollY: Math.round(scrollY), canvas: cv ? [cv.width, cv.height, cv.clientWidth, cv.clientHeight] : null,
      film: st && st.on ? { S: +st.S.toFixed(3), cur: st.current, mix: st.mix, dpr: st.dpr, ready: st.ready.find((r) => r.shot === st.current), seq: st.seq.filter((s) => s.on), video: st.video.filter((v) => v.onScreen) } : null, vis, still: im };
  });
  const nm = `${String(c.i).padStart(2, '0')}-${c.shot}`;
  await page.screenshot({ path: path.join(OUT, nm + '.jpg'), type: 'jpeg', quality: 92 });
  const h = await page.addStyleTag({ content: '.title-pin,.site-header,.mobile-cta,.story-line,.film-door,.film-bars,.scroll-hint{visibility:hidden!important} body::after{display:none!important}' });
  await page.waitForTimeout(MODE === 'on' ? 600 : 200);
  await page.screenshot({ path: path.join(OUT, nm + '-ciste.png') });
  await h.evaluate((n) => n.remove());
  res.push({ ...c, ...info, file: nm });
  console.log(nm, JSON.stringify({ y: info.scrollY, film: info.film && { cur: info.film.cur, dpr: info.film.dpr, size: info.film.ready && info.film.ready.size, mix: info.film.mix }, canvas: info.canvas, still: info.still[0] }));
}
fs.writeFileSync(path.join(OUT, 'zabery.json'), JSON.stringify({ dev: dn, mode: MODE, vp: DEV.vp, dsf: DEV.dsf, res }, null, 1));
await browser.close();
