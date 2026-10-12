#!/usr/bin/env node
// Test kurzora (nožnice), svetla pod kurzorom a hudby (assets/atmosfera.js) – Playwright, statický server.
//   NODE_PATH=/cesta/k/node_modules node source/tools/atmosfera-test.mjs [--snimky=priečinok]
// Kontroly: kurzor v CSS a jeho PNG, svetlo ide za myšou, hudba sa nesťahuje pred kliknutím, pustí sa pri prvom
// kliknutí (nie pri klávese), slučka bez medzery (loop, loopEnd), tlačidlo vypne a voľba sa pamätá, skrytá karta
// zastaví zvuk, ?hudba=off, telefón: bez svetla, ťuknutie pustí hudbu, tlačidlo 44 × 44 px v lište.
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { startStaticServer, PRESETS } from '../shot.mjs';

const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SNIMKY = (process.argv.find((a) => a.startsWith('--snimky=')) || '').slice(9);
let failed = 0;
const ok = (c, m, x = '') => { console.log(`${c ? 'OK  ' : 'FAIL'} ${m}${x ? '  ' + x : ''}`); if (!c) failed++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// zachytí AudioContext a zdroje slučky, aby test videl stav zvuku
const HOOK = () => {
  window.__ac = []; window.__src = [];
  const AC = window.AudioContext;
  window.AudioContext = class extends AC {
    constructor(...a) { super(...a); window.__ac.push(this); }
    createBufferSource() { const s = super.createBufferSource(); window.__src.push(s); return s; }
  };
};
const audioState = (page) => page.evaluate(() => ({
  pressed: document.querySelector('.hudba')?.getAttribute('aria-pressed'),
  hidden: document.querySelector('.hudba')?.hidden,
  ctx: window.__ac.map((c) => c.state),
  t: window.__ac[0] ? +window.__ac[0].currentTime.toFixed(2) : null,
  src: window.__src.map((s) => ({ loop: s.loop, end: +s.loopEnd.toFixed(3), dur: s.buffer ? +s.buffer.duration.toFixed(3) : null })),
  fetched: performance.getEntriesByType('resource').filter((r) => /hudba\.(webm|m4a)/.test(r.name)).length,
  pref: localStorage.getItem('b30-hudba'),
}));

const srv = await startStaticServer(ROOT);
const URL0 = `${srv.origin}/index.html?uvod=off`;
const browser = await chromium.launch({ ...PRESETS[0], args: [...PRESETS[0].args, '--autoplay-policy=user-gesture-required'] });
try {
  // ---------------------------------------------------------------- počítač
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(HOOK);
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error' && !/WebGL|GPU/i.test(m.text())) errs.push(m.text()); });
  const bad = [];
  page.on('response', (r) => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url()); });
  await page.goto(URL0, { waitUntil: 'load' });
  await sleep(800);
  const cur = await page.evaluate(() => ({
    html: getComputedStyle(document.documentElement).cursor,
    link: getComputedStyle(document.querySelector('.nav a')).cursor,
    btn: getComputedStyle(document.querySelector('.nav .btn')).cursor,
  }));
  ok(/noznice-32\.png|noznice-64\.png/.test(cur.html), 'kurzor stránky: nožnice', cur.html.slice(0, 90));
  ok(/noznice-otvorene/.test(cur.link) && /noznice-otvorene/.test(cur.btn), 'kurzor nad odkazom a tlačidlom: otvorené nožnice');
  for (const n of ['noznice', 'noznice-otvorene', 'noznice-zatvorene']) for (const px of [32, 64]) {
    const st = await page.evaluate(async (u) => (await fetch(u)).status, `assets/img/kurzor/${n}-${px}.png`);
    ok(st === 200, `PNG ${n}-${px} existuje`);
  }
  let s = await audioState(page);
  ok(s.hidden === false && s.pressed === 'false', 'tlačidlo Hudba je v lište, vypnuté', JSON.stringify(s));
  ok(s.fetched === 0 && s.ctx.length === 0, 'pred kliknutím sa hudba nesťahuje a zvuk sa nevytvára');
  // svetlo
  await page.mouse.move(700, 450); await page.mouse.move(720, 470, { steps: 4 }); await sleep(500);
  const sv = await page.evaluate(() => { const e = document.querySelector('.kurzor-svetlo'); return e && { on: e.classList.contains('is-on'), tr: e.style.transform, op: getComputedStyle(e).opacity, pe: getComputedStyle(e).pointerEvents }; });
  ok(sv && sv.on && /720(\.\d)?px, 470(\.\d)?px/.test(sv.tr), 'svetlo ide za myšou', JSON.stringify(sv));
  ok(sv && sv.pe === 'none', 'svetlo nezachytáva kliknutia');
  await page.hover('.nav a'); await sleep(600);
  const sc = await page.evaluate(() => document.querySelector('.kurzor-svetlo').style.transform);
  ok(/scale\(1\.(2|3)/.test(sc), 'nad odkazom sa svetlo zväčší', sc);
  if (SNIMKY) { fs.mkdirSync(SNIMKY, { recursive: true }); await page.mouse.move(380, 520); await sleep(600); await page.screenshot({ path: path.join(SNIMKY, 'pocitac-svetlo.png') }); await page.screenshot({ path: path.join(SNIMKY, 'pocitac-lista.png'), clip: { x: 0, y: 0, width: 1440, height: 80 } }); }
  // klávesa hudbu nepustí
  await page.keyboard.press('Tab'); await sleep(400);
  s = await audioState(page);
  ok(s.pressed === 'false' && s.fetched === 0, 'klávesa (Tab) hudbu nepustí');
  // prvé kliknutie na stránke (mimo odkazov) hudbu pustí
  await page.mouse.click(1000, 600); await sleep(2500);
  s = await audioState(page);
  ok(s.pressed === 'true' && s.ctx[0] === 'running' && s.fetched >= 1, 'prvé kliknutie pustí hudbu', JSON.stringify(s));
  ok(s.src.length === 1 && s.src[0].loop && Math.abs(s.src[0].end - 46.829) < 0.01, 'slučka bez medzery (loop, loopEnd 46,829 s)', JSON.stringify(s.src));
  const t1 = s.t; await sleep(800); s = await audioState(page);
  ok(s.t > t1, 'zvuk beží (čas kontextu rastie)', `${t1} → ${s.t}`);
  await page.mouse.click(900, 650); await sleep(300); s = await audioState(page);
  ok(s.src.length === 1, 'ďalšie kliknutie nespustí druhú stopu');
  // skrytá karta
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { value: true, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await sleep(300); s = await audioState(page);
  ok(s.ctx[0] === 'suspended', 'skrytá karta: zvuk sa zastaví');
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { value: false, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await sleep(300); s = await audioState(page);
  ok(s.ctx[0] === 'running', 'návrat na kartu: hudba pokračuje');
  // vypnutie tlačidlom
  await page.click('.hudba'); await sleep(1000); s = await audioState(page);
  ok(s.pressed === 'false' && s.ctx[0] === 'suspended' && s.pref === 'vyp', 'tlačidlo hudbu vypne a voľba sa uloží', JSON.stringify(s));
  // po obnovení stránky a kliknutí ostane vypnutá
  await page.reload({ waitUntil: 'load' }); await sleep(500);
  await page.mouse.click(1000, 600); await sleep(1200); s = await audioState(page);
  ok(s.pressed === 'false' && s.fetched === 0 && s.ctx.length === 0, 'vypnutá hudba sa po obnovení nepustí', JSON.stringify(s));
  await page.click('.hudba'); await sleep(2000); s = await audioState(page);
  ok(s.pressed === 'true' && s.ctx[0] === 'running' && s.pref === 'zap', 'tlačidlo ju znova zapne', JSON.stringify(s));
  ok(errs.length === 0, 'bez chýb v konzole', errs.join(' | ').slice(0, 300));
  ok(bad.length === 0, 'žiadne zlyhané požiadavky', bad.join(' | '));
  // ?hudba=off
  const p2 = await ctx.newPage();
  await p2.goto(`${srv.origin}/index.html?uvod=off&hudba=off`, { waitUntil: 'load' }); await sleep(400);
  await p2.mouse.click(1000, 600); await sleep(800);
  const s2 = await audioState(p2);
  ok(s2.hidden === true && s2.ctx.length === 0, '?hudba=off: bez tlačidla a bez zvuku', JSON.stringify(s2));
  await ctx.close();

  // ---------------------------------------------------------------- telefón
  const m = await browser.newContext({ ...devices['iPhone 13'], defaultBrowserType: undefined });
  await m.addInitScript(HOOK);
  const mp = await m.newPage();
  const merr = [];
  mp.on('pageerror', (e) => merr.push(String(e)));
  await mp.goto(URL0, { waitUntil: 'load' }); await sleep(800);
  const mb = await mp.evaluate(() => { const b = document.querySelector('.hudba').getBoundingClientRect(); const h = document.querySelector('.site-header').getBoundingClientRect(); return { w: b.width, h: b.height, inHeader: b.top >= h.top && b.bottom <= h.bottom, right: b.right, vw: innerWidth, svetlo: !!document.querySelector('.kurzor-svetlo'), text: getComputedStyle(document.querySelector('.hudba-text')).clipPath }; });
  ok(mb.w >= 44 && mb.h >= 44 && mb.inHeader, 'telefón: tlačidlo Hudba 44 × 44 px v lište', JSON.stringify(mb));
  ok(!mb.svetlo, 'telefón: bez svetla pod kurzorom');
  if (SNIMKY) await mp.screenshot({ path: path.join(SNIMKY, 'telefon-lista.png'), clip: { x: 0, y: 0, width: 390, height: 70 } });
  await mp.tap('main, body', { position: { x: 200, y: 500 } }).catch(() => mp.touchscreen.tap(200, 500));
  await sleep(2500);
  const ms = await audioState(mp);
  ok(ms.pressed === 'true' && ms.ctx[0] === 'running', 'telefón: ťuknutie pustí hudbu', JSON.stringify(ms));
  ok(merr.length === 0, 'telefón: bez chýb', merr.join(' | '));
  await m.close();
} finally {
  await browser.close();
  srv.server.close();
}
console.log(failed ? `\n${failed} kontrol zlyhalo` : '\nVšetky kontroly prešli');
process.exit(failed ? 1 : 0);
