#!/usr/bin/env node
// Audit vzhľadu: telefón vs počítač, sekcia po sekcii (rola dizajnér / art director).
//   node zhoda.mjs --dev=p390|p360|d1440|d1920 --mode=off|on|def [--port=8211] [--krok] [--out=dir]
// mode: off = ?film=off (pokojná verzia), on = ?film=on&uvod=off (film aj pri softvérovom kreslení; zníženie
// rozlíšenia plátna pri pomalých snímkach je v teste vypnuté, aby snímka ukázala to, čo telefón s grafikou),
// def = predvolená adresa ?uvod=off (v kontajneri bez grafiky = world-frame + world-off, ako Lighthouse).
// --krok: navyše snímky celej stránky po 0,9 výšky okna (hľadanie prázdnych a tmavých miest).
// Výstup: <out>/<dev>-<mode>/NN-<beat>.png (+ -ciste.png bez textu pre ostrosť) a beats.json (metriky).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');

const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const DEV = {
  p390: { vp: { width: 390, height: 844 }, dsf: 3, mob: true },
  p360: { vp: { width: 360, height: 780 }, dsf: 3, mob: true },
  d1440: { vp: { width: 1440, height: 900 }, dsf: 1, mob: false },
  d1920: { vp: { width: 1920, height: 1080 }, dsf: 1, mob: false },
}[opt.dev || 'p390'];
const MODE = opt.mode || 'off';
const PORT = opt.port || 8211;
const OUT = path.resolve(opt.out || path.join(path.dirname(new URL(import.meta.url).pathname), 'shots'), `${opt.dev || 'p390'}-${MODE}${opt.tag ? '-' + opt.tag : ''}`);
fs.mkdirSync(OUT, { recursive: true });
const q = { off: '?film=off', on: '?film=on&uvod=off', def: '?uvod=off' }[MODE];
const URL0 = `http://127.0.0.1:${PORT}/barbershop-30/${q}`;

const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: DEV.vp, deviceScaleFactor: DEV.dsf, isMobile: DEV.mob, hasTouch: DEV.mob, colorScheme: 'dark', locale: 'sk-SK' });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
if (MODE === 'on') {
  // len v teste: film si pri pomalom softvérovom kreslení znižuje rozlíšenie plátna (dpr 2 → 1); telefón s grafikou nie
  await page.route('**/assets/film.js*', async (route) => {
    const r = await route.fetch(); let body = await r.text();
    const n0 = body.length;
    body = body.replace('if (dpr > DPR_MIN) { dpr = Math.max(', 'if (false && dpr > DPR_MIN) { dpr = Math.max(');
    if (body.length === n0) console.error('POZOR: náhrada dpr vo film.js sa nenašla');
    await route.fulfill({ response: r, body, headers: { ...r.headers(), 'content-type': 'text/javascript' } });
  });
}
// posuny rozloženia (CLS) od začiatku
await page.addInitScript(() => {
  window.__ls = [];
  try {
    new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (!e.hadRecentInput) window.__ls.push({ v: e.value, t: Math.round(e.startTime), src: (e.sources || []).map((s) => { const n = s.node; return n ? (n.id ? '#' + n.id : '') + (n.className && typeof n.className === 'string' ? '.' + n.className.trim().split(/\s+/).join('.') : n.nodeName) : '?'; }).slice(0, 4) }); })).observe({ type: 'layout-shift', buffered: true });
  } catch (e) { /* nič */ }
});
const t0 = Date.now();
await page.goto(URL0, { waitUntil: 'load', timeout: 120000 });
await page.evaluate(() => document.fonts && document.fonts.ready);
// pohyb návštevníka (film bez prológu čaká na pohyb)
if (DEV.mob) await page.touchscreen.tap(5, Math.round(DEV.vp.height * 0.5)).catch(() => {}); else await page.mouse.move(200, 300);
if (MODE === 'on') await page.waitForFunction(() => document.documentElement.classList.contains('world-in'), null, { timeout: 90000 }).catch(() => console.error('film nenabehol (world-in)'));
else await page.waitForTimeout(1200);
const classes = await page.evaluate(() => document.documentElement.className);
console.log('načítané', ((Date.now() - t0) / 1000).toFixed(1), 's, html:', classes);

const beats = await page.evaluate(({ krok }) => {
  const vh = innerHeight, max = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight) - vh;
  const navh = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 64;
  const top = (el) => el.getBoundingClientRect().top + scrollY;
  const B = [];
  const add = (name, y, kind = 'sekcia') => B.push({ name, y: Math.max(0, Math.min(max, Math.round(y))), kind });
  const shots = [...document.querySelectorAll('.film-shot')];
  shots.forEach((el, i) => {
    const r = el.getBoundingClientRect(); const long = el.classList.contains('title-long');
    const free = r.height - (long ? vh : 0);
    add(`karta-${String(i).padStart(2, '0')}-${el.dataset.shot}`, i === 0 ? 0 : top(el) + free * 0.45, 'karta');
    // prelínanie: horný okraj kotvy (karta sa mení, film strihá)
    if (i > 0) add(`strih-${String(i).padStart(2, '0')}-${el.dataset.shot}`, top(el) + free * 0.04, 'strih');
  });
  const q = (s) => document.querySelector(s);
  const at = (s) => { const el = q(s); return el && el.offsetParent !== null ? top(el) - navh - 16 : null; };
  const opt = (name, s, dy = 0) => { const y = at(s); if (y !== null) add(name, y + dy); };
  const bt = q('.band-team'); if (bt) { add('tim-pas-nastup', top(bt) - vh * 0.4, 'prechod'); add('tim-pas', top(bt)); }
  opt('tim-mriezka', '.team-grid');
  const bp = q('.band-prices'); if (bp) { add('sluzby-pas-nastup', top(bp) - vh * 0.4, 'prechod'); add('sluzby-pas', top(bp)); }
  opt('sluzby-kroky', '.steps-wrap');
  [...document.querySelectorAll('.price-group')].forEach((g, i) => add(`sluzby-cennik-${i + 1}`, top(g) - navh - 16));
  opt('sluzby-extra', '.price-extra', -vh * 0.4);
  const bg = q('.band-gallery'); if (bg) { add('galeria-pas-nastup', top(bg) - vh * 0.4, 'prechod'); add('galeria-pas', top(bg)); }
  opt('galeria-mriezka', '.gallery');
  opt('galeria-recenzie', '.recenzie:not([hidden])');
  opt('galeria-dovera', '.trust');
  const bc = q('.band-contact'); if (bc) { add('kontakt-pas-nastup', top(bc) - vh * 0.4, 'prechod'); add('kontakt-pas', top(bc)); }
  opt('kontakt-fakty', '.facts');
  add('paticka', max);
  if (krok) for (let y = 0, k = 0; y < max + vh * 0.5; y += vh * 0.9, k++) add(`krok-${String(k).padStart(2, '0')}`, Math.min(y, max), 'krok');
  B.sort((a, b) => a.y - b.y || a.name.localeCompare(b.name));
  return { beats: B, vh, max, screens: (max + vh) / vh };
}, { krok: !!opt.krok });
console.log('stránka:', beats.screens.toFixed(1), 'obrazoviek,', beats.beats.length, 'polôh');

const measureNow = async () => { await page.evaluate(async () => {
  window.__nat = window.__nat || {};
  const vh = innerHeight;
  const urls = [...document.images].filter((i) => { const r = i.getBoundingClientRect(); return r.bottom > 0 && r.top < vh && (i.currentSrc || i.src); }).map((i) => i.currentSrc || i.src).filter((u) => !window.__nat[u]);
  await Promise.race([new Promise((r) => setTimeout(r, 5000)), Promise.all(urls.map((u) => new Promise((res) => { const x = new Image(); x.onload = () => { window.__nat[u] = [x.naturalWidth, x.naturalHeight]; res(); }; x.onerror = res; x.src = u; })))]);
}); return page.evaluate(() => {
  const dpr = devicePixelRatio, vw = innerWidth, vh = innerHeight;
  const vis = (el) => { const s = getComputedStyle(el); return s.display !== 'none' && s.visibility !== 'hidden'; };
  const imgs = [...document.images].filter((im) => {
    const r = im.getBoundingClientRect();
    if (r.bottom <= 0 || r.top >= vh || r.right <= 0 || r.left >= vw || r.width < 4) return false;
    for (let e = im; e; e = e.parentElement) { if (!vis(e)) return false; if (parseFloat(getComputedStyle(e).opacity) < 0.05) return false; }
    return true;
  }).map((im) => {
    const r = im.getBoundingClientRect();
    const fit = getComputedStyle(im).objectFit;
    // skutočné rozmery súboru (naturalWidth pri srcset je delený hustotou výberu, preto z nového Image z cache)
    const raw = window.__nat && window.__nat[im.currentSrc || im.src];
    const nw = raw ? raw[0] : 0, nh = raw ? raw[1] : 0;
    const sc = nw ? (fit === 'cover' ? Math.max(r.width / nw, r.height / nh) : Math.min(r.width / nw, r.height / nh)) : 0;
    const visW = Math.max(0, Math.min(r.right, vw) - Math.max(r.left, 0)), visH = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
    return { src: (im.currentSrc || im.src).split('/').slice(-2).join('/'), nat: [nw, nh], css: [Math.round(r.width), Math.round(r.height)], complete: im.complete,
      zdroj_na_px: sc ? +(1 / (sc * dpr)).toFixed(2) : null, plocha: +((visW * visH) / (vw * vh)).toFixed(3) };
  }).sort((a, b) => b.plocha - a.plocha);
  // písmo: najmenšie viditeľné písmo s textom v okne
  const texts = [];
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = tw.nextNode(); n; n = tw.nextNode()) {
    if (!n.nodeValue.trim()) continue;
    const el = n.parentElement; if (!el) continue;
    const r = el.getBoundingClientRect(); if (r.bottom <= 0 || r.top >= vh || r.width < 1 || r.height < 1) continue;
    if (el.closest('.visually-hidden,[aria-hidden="true"] svg')) continue;
    let o = 1, ok = true; for (let e = el; e; e = e.parentElement) { if (!vis(e)) { ok = false; break; } o *= parseFloat(getComputedStyle(e).opacity); }
    if (!ok || o < 0.5) continue;
    const s = getComputedStyle(el);
    texts.push({ fs: parseFloat(s.fontSize), t: n.nodeValue.trim().slice(0, 40), cls: el.className && typeof el.className === 'string' ? el.className.split(' ')[0] : el.nodeName });
  }
  texts.sort((a, b) => a.fs - b.fs);
  const st = window.BS30_FILM && window.BS30_FILM.state;
  const cards = [...document.querySelectorAll('.film-shot.is-title')].map((el) => ({ shot: el.dataset.shot, o: +(parseFloat(el.style.getPropertyValue('--o')) || 0).toFixed(2), so: +(parseFloat(el.style.getPropertyValue('--so')) || 0).toFixed(2) })).filter((c) => c.o > 0.01 || c.so > 0.01);
  return {
    scrollY: Math.round(scrollY), dpr, imgs: imgs.slice(0, 6), minFont: texts.slice(0, 3), fonts: [...new Set(texts.map((t) => t.fs))].sort((a, b) => a - b),
    film: st && st.on ? { S: +st.S.toFixed(3), T: +st.T.toFixed(3), cur: st.current, mix: +(st.mix || 0).toFixed(3), cut: st.cut, dpr: st.dpr, ready: (st.ready.find((r) => r.shot === st.current) || {}).ready, size: (st.ready.find((r) => r.shot === st.current) || {}).size, seq: st.seq.filter((s) => s.on).map((s) => ({ shot: s.shot, got: s.got, n: s.n, mix: s.mix })), video: st.video.filter((v) => v.onScreen).map((v) => ({ shot: v.shot, rs: v.rs, live: v.live, poster: v.poster, fail: v.fail })) } : null,
    cards, cls: (window.__ls || []).reduce((a, e) => a + e.v, 0),
  };
}); };

const waitSettled = async () => {
  await page.waitForFunction(() => window.__scrollSettled === true, null, { timeout: 8000 }).catch(() => console.error('  skrol sa neustálil'));
  // fotky v okne načítané a dekódované
  await page.evaluate(async () => {
    const vh = innerHeight;
    const im = [...document.images].filter((i) => { const r = i.getBoundingClientRect(); return r.bottom > 0 && r.top < vh && r.right > 0 && r.left < innerWidth && r.width > 2 && getComputedStyle(i).display !== 'none'; });
    const t = Date.now();
    while (im.some((i) => !i.complete) && Date.now() - t < 15000) await new Promise((r) => setTimeout(r, 100));
    await Promise.race([Promise.all(im.map((i) => i.decode ? i.decode().catch(() => {}) : 0)), new Promise((r) => setTimeout(r, 4000))]);
  });
  if (MODE === 'on') {
    await page.waitForFunction(() => {
      const st = window.BS30_FILM && window.BS30_FILM.state; if (!st || !st.on) return true;
      const r = st.ready.find((x) => x.shot === st.current);
      const sq = st.seq.find((s) => s.shot === st.current && s.on);
      return Math.abs(st.S - st.T) < 0.004 && (st.mix < 0.002 || st.mix > 0.998) && r && r.ready && (!sq || sq.got >= Math.min(sq.n, 8));
    }, null, { timeout: 25000, polling: 250 }).catch(() => console.error('  film sa neustálil'));
    await page.waitForTimeout(1500);
  } else await page.waitForTimeout(900);
};

const out = [];
let k = 0;
for (const b of beats.beats) {
  const tb = Date.now();
  await page.evaluate((y) => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, y); }, b.y);
  await waitSettled();
  const m = await measureNow();
  const nm = `${String(k).padStart(2, '0')}-${b.name}`;
  const f = path.join(OUT, `${nm}.jpg`);
  await page.screenshot({ path: f, type: 'jpeg', quality: 90 });
  let fc = null;
  if (b.kind === 'karta') {
    // tá istá poloha bez textu a lišty: ostrosť fotky (záloha alebo film)
    await page.addStyleTag({ content: '.title-pin,.site-header,.mobile-cta,.story-line,.film-door,.film-bars{visibility:hidden!important} body::after{display:none!important}' }).then((h) => h.evaluate((n) => n.setAttribute('data-ciste', '')));
    await page.waitForTimeout(MODE === 'on' ? 700 : 150);
    fc = path.join(OUT, `${nm}-ciste.png`);
    await page.screenshot({ path: fc });
    await page.evaluate(() => document.querySelectorAll('style[data-ciste]').forEach((s) => s.remove()));
    if (opt.kontrast) {
      // pozadie textu karty (stmavenie karty ostáva, text a tiene preč) + obdĺžniky textu v css px
      const rects = await page.evaluate(() => {
        const card = [...document.querySelectorAll('.film-shot.is-title.is-on')].pop(); if (!card) return [];
        return [...card.querySelectorAll('.title-card .kicker, .title-card .title, .title-card .title-sub')].map((el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return { cls: el.className.split(' ')[0], x: r.left, y: r.top, w: r.width, h: r.height, fs: parseFloat(s.fontSize), fw: s.fontWeight, color: s.color }; });
      });
      await page.addStyleTag({ content: '.title-card .kicker,.title-card .title,.title-card .title-sub,.title-card .title *{color:transparent!important;text-shadow:none!important}.title-card .kicker::before,.title-card .kicker::after,.title-actions,.scroll-hint,.film-door{visibility:hidden!important}' }).then((h) => h.evaluate((n) => n.setAttribute('data-ciste', '')));
      await page.waitForTimeout(MODE === 'on' ? 700 : 150);
      const fp = path.join(OUT, `${nm}-pozadie.png`);
      await page.screenshot({ path: fp });
      await page.evaluate(() => document.querySelectorAll('style[data-ciste]').forEach((s) => s.remove()));
      out.__kontrast = out.__kontrast || {}; out.__kontrast[nm] = { file: path.basename(fp), rects };
    }
  }
  out.push({ ...b, file: path.basename(f), ciste: fc && path.basename(fc), ...m });
  console.log(nm, 'y', m.scrollY, 'img', m.imgs[0] ? `${m.imgs[0].src} ${m.imgs[0].zdroj_na_px}` : '-', 'písmo min', m.fonts[0], ((Date.now() - tb) / 1000).toFixed(1) + 's', m.film ? `film ${m.film.cur} S${m.film.S} mix${m.film.mix} dpr${m.film.dpr}` : '');
  k++;
}
const ls = await page.evaluate(() => window.__ls || []);
fs.writeFileSync(path.join(OUT, 'beats.json'), JSON.stringify({ kontrast: out.__kontrast || null, dev: opt.dev, mode: MODE, url: URL0, classes, vh: beats.vh, max: beats.max, screens: beats.screens, layoutShifts: ls, errs, beats: out }, null, 1));
console.log('CLS spolu', ls.reduce((a, e) => a + e.v, 0).toFixed(4), ls.length, 'posunov; chyby', errs.length, errs.slice(0, 3));
await browser.close();
