#!/usr/bin/env node
// Tempo textu a obrazu pri skutočnom geste: telefón = dotykový švih (CDP Input.synthesizeScrollGesture, s dobehom),
// počítač = tri zárezy kolieska (plynulé koliesko z app.js). Text karty sa meria priamo (--o na kotve z app.js v každej
// snímke), obraz filmu sa dopočíta z nameranej dráhy skrolu presne podľa film.js pri 60 Hz: kotvy measure() 943-964,
// pružina 1238-1240, okno prechodu 1082-1087, vyhladenie prelínania 1091-1094 (film v kontajneri bez grafiky nejde
// plynulo, preto sa nemeria jeho snímkovanie, len jeho matematika na tej istej dráhe skrolu).
//   node tempo-real.mjs --dev=p390|d1440 [--port=8211] [--z=600] [--do=1250] [--rychlost=2400]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const dev = opt.dev || 'p390';
const D = { p390: { vp: { width: 390, height: 844 }, mob: true }, d1440: { vp: { width: 1440, height: 900 }, mob: false } }[dev];
const HERE = path.dirname(new URL(import.meta.url).pathname);
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: D.vp, deviceScaleFactor: 1, isMobile: D.mob, hasTouch: D.mob, locale: 'sk-SK' });
const page = await ctx.newPage();
await page.goto(`http://127.0.0.1:${opt.port || 8211}/barbershop-30/?film=off`, { waitUntil: 'load' });
await page.waitForTimeout(1500);
const y0 = Number(opt.z || (D.mob ? 560 : 560));
await page.evaluate((y) => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, y); }, y0);
await page.waitForTimeout(1200);
await page.evaluate(() => { document.documentElement.style.scrollBehavior = ''; });
// kotvy filmu a okná prechodov ako vo film.js measure() (zábery z kotiev .film-shot[data-shot], prológ stojí -vh)
const geo = await page.evaluate(() => {
  const vh = innerHeight, A = [], C = [], names = [];
  const pro = document.querySelector('.film-shot[data-pro]');
  if (pro) { A.push(-vh); C.push(null); names.push('pro'); }
  for (const el of document.querySelectorAll('.film-shot[data-shot]')) {
    const top = Math.max(0, el.getBoundingClientRect().top + scrollY);
    const card = el.classList.contains('is-title') && !el.hasAttribute('data-pro');
    const free = el.offsetHeight - (el.classList.contains('title-long') ? vh : 0);
    const a = card ? top + free / 2 : top;
    const prev = el.previousElementSibling || (el.parentElement.previousElementSibling || {}).lastElementChild;
    const cut = card ? top - (prev && prev.classList && prev.classList.contains('band') ? 1.5 * vh : 0) : null;
    if (A.length && a <= A[A.length - 1] + 1) continue;
    A.push(a); C.push(cut); names.push(el.dataset.shot);
  }
  return { vh, A, C, names };
});
// záznam v každej snímke: čas, scrollY, krytie kariet (--o)
await page.evaluate(() => {
  window.__rec = [];
  const cards = [...document.querySelectorAll('.film-shot.is-title')];
  const f = () => { window.__rec.push([performance.now(), scrollY, ...cards.map((c) => parseFloat(c.style.getPropertyValue('--o')) || 0)]); if (window.__rec.length < 3000) requestAnimationFrame(f); };
  requestAnimationFrame(f);
});
await page.waitForTimeout(300);
const t0 = await page.evaluate(() => performance.now());
const cdp = await ctx.newCDPSession(page);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// profily ťahu prstom ako v audite výkonu (vykon-telefon/meraj.mjs 318-325): Input.dispatchTouchEvent, so zotrvačnosťou
const PROFIL = { pomaly: { dist: 300, ms: 450, hold: 80 }, stredne: { dist: 420, ms: 180, hold: 0 }, svih: { dist: 560, ms: 80, hold: 0 } };
const prof = opt.profil || 'stredne';
if (D.mob) {
  const P = PROFIL[prof], x = 195, y00 = 700;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: y00 }] });
  const ts = Date.now(); let y = y00;
  for (;;) { const e = Math.min(1, (Date.now() - ts) / P.ms); y = y00 - P.dist * e; await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] }); if (e >= 1) break; await sleep(8); }
  if (P.hold) { await sleep(P.hold); await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] }); }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
} else {
  for (let i = 0; i < Number(opt.zarezy || 3); i++) { await page.mouse.wheel(0, 100); await page.waitForTimeout(60); }
}
await page.waitForTimeout(2500);
const rec = await page.evaluate(() => window.__rec);
const cardNames = await page.evaluate(() => [...document.querySelectorAll('.film-shot.is-title')].map((c) => c.dataset.shot));
await browser.close();

// model filmu pri 60 Hz na nameranej dráhe skrolu
const { A, C, vh } = geo, N = A.length - 1;
const smooth = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
const targetS = (y) => { if (y <= A[0]) return 0; for (let k = 1; k < A.length; k++) if (y < A[k]) return k - 1 + (y - A[k - 1]) / (A[k] - A[k - 1]); return N; };
const want = (S) => {
  const k = Math.max(0, Math.min(N, Math.floor(S)));
  if (k >= N) return { k, w: 0 };
  const gap = A[k + 1] - A[k], span = Math.min(0.3, Math.max(0.16, 0.55 * vh / Math.max(1, gap)));
  const c = C[k + 1] != null ? Math.min(1 - span / 2 - 0.02, Math.max(span / 2 + 0.02, (C[k + 1] - A[k]) / Math.max(1, gap))) : 0.5;
  return { k, w: smooth(c - span / 2, c + span / 2, S - k) };
};
const yAt = (t) => { // scrollY v čase t (ms od začiatku záznamu), lineárne medzi snímkami
  let i = rec.findIndex((r) => r[0] >= t); if (i < 0) return rec[rec.length - 1][1]; if (i === 0) return rec[0][1];
  const a = rec[i - 1], b = rec[i]; return a[1] + (b[1] - a[1]) * (t - a[0]) / Math.max(1e-6, b[0] - a[0]);
};
let S = targetS(yAt(rec[0][0])), V = 0, fadeK = -1, fade = 0, still = 0;
const model = [];
for (let t = rec[0][0], dt = 1 / 60; t <= rec[rec.length - 1][0]; t += 1000 / 60) {
  const T = targetS(yAt(t));
  V += ((T - S) * 6.5 * 6.5 - 2 * 6.5 * V) * dt; S += V * dt;
  if (Math.abs(T - S) < 0.0004 && Math.abs(V) < 0.0004) { S = T; V = 0; }
  const { k, w } = want(S);
  if (k !== fadeK) { fade = w; fadeK = k; }
  still = Math.abs(V) < 0.03 ? still + dt : 0;
  const goal = still > 0.6 ? Math.round(w) : w;
  fade += (goal - fade) * (1 - Math.pow(0.02, dt));
  model.push({ t, S, k, fade });
}
// hranica rohožka -> sála: karta 1 (sala), záber index 2 v ceste (pro, rohozka, sala)
const ci = cardNames.indexOf('sala'), pi = geo.names.indexOf('sala');
const at = (arr, f) => { const r = arr.find(f); return r ? Math.round(r.t - t0) : null; };
const recT = rec.map((r) => ({ t: r[0], y: r[1], o: r[2 + ci], o0: r[2 + ci - 1] }));
const imgNew = (m) => m.k > pi - 1 || (m.k === pi - 1 && m.fade >= 0.5);
const imgNew90 = (m) => m.k > pi - 1 || (m.k === pi - 1 && m.fade >= 0.9);
const res = {
  dev, gesto: D.mob ? `ťah prstom ${prof} (${JSON.stringify(PROFIL[prof])})` : `${opt.zarezy || 3} zárezy kolieska po 100 px`, y0, yKoniec: Math.round(rec[rec.length - 1][1]),
  skrol_dobehol_ms: at(recT, (r, i) => i > 0 && recT.slice(i).every((q) => Math.abs(q.y - recT[recT.length - 1].y) < 1)),
  starý_text_pod_50_ms: at(recT, (r) => r.t > t0 && r.o0 < 0.5),
  nový_text_50_ms: at(recT, (r) => r.t > t0 && r.o >= 0.5), nový_text_90_ms: at(recT, (r) => r.t > t0 && r.o >= 0.9),
  nový_záber_50_ms: at(model, (m) => m.t > t0 && imgNew(m)), nový_záber_90_ms: at(model, (m) => m.t > t0 && imgNew90(m)),
};
// ako dlho je nový text (≥ 0,9) nad starým záberom (prelínanie < 0,5)
let nes = 0;
for (const m of model) { if (m.t <= t0) continue; const r = recT.find((q) => q.t >= m.t) || recT[recT.length - 1]; if (r.o >= 0.9 && !imgNew(m)) nes += 1000 / 60; }
res.nový_text_nad_starým_záberom_ms = Math.round(nes);
fs.writeFileSync(path.join(HERE, 'merania', `tempo-real-${dev}${D.mob ? '-' + prof : ''}.json`), JSON.stringify({ res, geo, priebeh: model.filter((_, i) => i % 3 === 0).map((m) => { const r = recT.find((q) => q.t >= m.t) || recT[recT.length - 1]; return { ms: Math.round(m.t - t0), y: Math.round(r.y), text_sala: +r.o.toFixed(2), text_uvod: +r.o0.toFixed(2), film_S: +m.S.toFixed(3), film_mix: +m.fade.toFixed(2) }; }) }, null, 1));
console.log(JSON.stringify(res, null, 1));
