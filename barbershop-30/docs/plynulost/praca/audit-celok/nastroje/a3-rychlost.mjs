#!/usr/bin/env node
// A3 SEO – rýchlosť a vykreslenie BARBERSHOP 30 v Chromiu cez Playwright a CDP (Lighthouse tu nie je).
//   node a3-rychlost.mjs [--port=8880] [--out=priečinok] [--behy=3] [--stranky=index.html,en/index.html,rezervacia.html]
//
// Server: python3 -I -m http.server <port> --bind 127.0.0.1 --directory <hs-skvrny> (web je pod /barbershop-30/ ako pri
// nasadení na GitHub Pages head-spa-30). Jeden prehliadač, po skončení sa zavrie aj server.
//
// 1. Rýchlosť (studená cache, každý beh nový kontext): FCP, LCP (+ prvok), CLS (najväčšie okno relácie), TBT (súčet
//    dlhých úloh nad 50 ms od FCP po 5 s ticha), prenesené bajty a počet požiadaviek do načítania a po 8 s.
//    Telefón: 412×823, DPR 1.75, CPU 4× spomalené, sieť ako Lighthouse „Slow 4G“ (562,5 ms, 1,47 Mb/s dole, 675 kb/s hore).
//    Počítač: 1350×940, CPU 1×, sieť 40 ms, 10 Mb/s. Medián z --behy behov.
// 2. CLS pri skrolovaní (telefón, bez spomalenia): posun po obrazovkách až na koniec, CLS a posuny s prvkami.
// 3. Bez JavaScriptu (ako robot, ktorý skripty nespúšťa): text, H1, obrázok úvodu, snímka JPEG.
// 4. Telefón 360 a 390 px: vodorovné pretekanie, písmo pod 12 px, dotykové plochy menšie než 44×44 px (len samostatné
//    odkazy a tlačidlá, nie odkazy vnútri vety), snímka úvodu JPEG.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');

const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.length ? v.join('=') : true]; }));
const ROOT = opt.root || '/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/hs-skvrny';
const PORT = +(opt.port || 8880);
const OUT = path.resolve(opt.out || '.');
const BEHY = +(opt.behy || 3);
const STRANKY = String(opt.stranky || 'index.html,en/index.html,rezervacia.html').split(',');
const BASE = `http://127.0.0.1:${PORT}/barbershop-30/`;
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const median = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor((s.length - 1) / 2)] : null; };

// ---------------------------------------------------------------- server
const srv = spawn('python3', ['-I', '-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', ROOT], { stdio: 'ignore' });
let up = false;
for (let i = 0; i < 50 && !up; i++) { try { const r = await fetch(BASE + 'index.html'); up = r.ok; } catch (e) { await sleep(200); } }
if (!up) { console.error('server nebeží'); srv.kill(); process.exit(2); }
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const vysledok = { datum: new Date().toISOString(), chromium: browser.version(), base: BASE, rychlost: {}, skrol: {}, bezJS: {}, mobil: {} };
const koniec = async () => { await browser.close().catch(() => {}); srv.kill(); };
process.on('uncaughtException', async (e) => { console.error(e); await koniec(); process.exit(3); });

// meranie vložené do stránky pred jej skriptami
const MERANIE = () => {
  const M = (window.__a3 = { lcp: null, lcpEl: null, fcp: null, shifts: [], long: [] });
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) { M.lcp = e.startTime; const el = e.element; M.lcpEl = el ? `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : ''} ${(e.url || '').split('/').pop()} ${e.size}px²` : (e.url || '').split('/').pop(); } }).observe({ type: 'largest-contentful-paint', buffered: true }); } catch (e) {}
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.name === 'first-contentful-paint') M.fcp = e.startTime; }).observe({ type: 'paint', buffered: true }); } catch (e) {}
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) M.shifts.push({ t: e.startTime, v: e.value, src: (e.sources || []).map((s) => { const n = s.node; return n && n.nodeType === 1 ? `${n.tagName.toLowerCase()}${n.id ? '#' + n.id : ''}${n.className && typeof n.className === 'string' ? '.' + n.className.trim().split(/\s+/).slice(0, 3).join('.') : ''}` : (n ? n.nodeName : '?'); }) }); }).observe({ type: 'layout-shift', buffered: true }); } catch (e) {}
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) M.long.push({ t: e.startTime, d: e.duration }); }).observe({ type: 'longtask', buffered: true }); } catch (e) {}
};
const clsWindows = (shifts) => { let best = 0, cur = 0, start = -1, last = -1; for (const s of shifts) { if (start < 0 || s.t - last > 1000 || s.t - start > 5000) { cur = 0; start = s.t; } cur += s.v; last = s.t; best = Math.max(best, cur); } return best; };

const PROFILY = {
  telefon: { ctx: { viewport: { width: 412, height: 823 }, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36' }, cpu: 4, net: { latency: 562.5, downloadThroughput: 1474.56 * 1024 / 8, uploadThroughput: 675 * 1024 / 8 } },
  pocitac: { ctx: { viewport: { width: 1350, height: 940 }, deviceScaleFactor: 1 }, cpu: 1, net: { latency: 40, downloadThroughput: 10240 * 1024 / 8, uploadThroughput: 10240 * 1024 / 8 } },
};

async function beh(stranka, profil) {
  const P = PROFILY[profil];
  const ctx = await browser.newContext({ ...P.ctx, colorScheme: 'dark', locale: 'sk-SK' });
  const page = await ctx.newPage();
  await page.addInitScript(MERANIE);
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await cdp.send('Network.emulateNetworkConditions', { offline: false, ...P.net });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: P.cpu });
  let bajty = 0, poz = 0, bajtyLoad = null, pozLoad = null, chyby = [];
  cdp.on('Network.loadingFinished', (e) => { bajty += e.encodedDataLength; poz++; });
  page.on('pageerror', (e) => chyby.push('pageerror: ' + e.message));
  page.on('response', (r) => { if (r.status() >= 400) chyby.push(`HTTP ${r.status()} ${r.url()}`); });
  const t0 = Date.now();
  await page.goto(BASE + stranka, { waitUntil: 'load', timeout: 120000 });
  const tLoad = Date.now() - t0; bajtyLoad = bajty; pozLoad = poz;
  // čakanie na ticho: 5 s bez dlhej úlohy (najviac 25 s)
  let posl = -1, zmena = Date.now();
  while (Date.now() - t0 < 25000) { await sleep(500); const n = await page.evaluate(() => window.__a3.long.length); if (n !== posl) { posl = n; zmena = Date.now(); } else if (Date.now() - zmena >= 5000) break; }
  const m = await page.evaluate(() => window.__a3);
  const fcp = m.fcp || 0;
  // ako Lighthouse: z každej dlhej úlohy sa ráta časť nad 50 ms, ktorá leží po FCP
  const tbt = m.long.reduce((a, l) => a + Math.max(0, l.t + l.d - Math.max(l.t + 50, fcp)), 0);
  const r = { fcp: Math.round(m.fcp), lcp: Math.round(m.lcp), lcpEl: m.lcpEl, cls: +clsWindows(m.shifts).toFixed(4), posuny: m.shifts.filter((s) => s.v > 0.001).map((s) => `${Math.round(s.t)}ms ${s.v.toFixed(4)} ${s.src.join(',')}`), tbt: Math.round(tbt), dlheUlohy: m.long.length, load: tLoad, kBLoad: Math.round(bajtyLoad / 1024), pozLoad, kB8s: Math.round(bajty / 1024), poz8s: poz, chyby };
  await ctx.close();
  return r;
}

console.log(`Chromium ${vysledok.chromium}, ${BASE}`);
for (const s of STRANKY) {
  for (const profil of ['telefon', 'pocitac']) {
    const n = profil === 'telefon' ? BEHY : Math.max(1, BEHY - 1);
    const runs = [];
    for (let i = 0; i < n; i++) runs.push(await beh(s, profil));
    const med = { fcp: median(runs.map((r) => r.fcp)), lcp: median(runs.map((r) => r.lcp)), cls: median(runs.map((r) => r.cls)), tbt: median(runs.map((r) => r.tbt)), kBLoad: median(runs.map((r) => r.kBLoad)), kB8s: median(runs.map((r) => r.kB8s)) };
    vysledok.rychlost[`${s} ${profil}`] = { median: med, behy: runs };
    console.log(`${s.padEnd(18)} ${profil.padEnd(8)} FCP ${med.fcp} ms, LCP ${med.lcp} ms, CLS ${med.cls}, TBT ${med.tbt} ms, do load ${med.kBLoad} kB, po 8 s ${med.kB8s} kB | LCP prvok: ${runs[0].lcpEl} | posuny: ${runs[0].posuny.join(' ; ') || '-'}${runs.some((r) => r.chyby.length) ? ' | CHYBY: ' + [...new Set(runs.flatMap((r) => r.chyby))].join(' ; ') : ''}`);
  }
}

// ---------------------------------------------------------------- 2. CLS pri skrolovaní (telefón 390×844)
for (const s of ['index.html', 'en/index.html']) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: 'dark' });
  const page = await ctx.newPage();
  await page.addInitScript(MERANIE);
  await page.goto(BASE + s, { waitUntil: 'load', timeout: 60000 });
  await sleep(1500);
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += 700) { await page.evaluate((y) => window.scrollTo(0, y), y); await sleep(220); }
  await sleep(1000);
  const m = await page.evaluate(() => window.__a3);
  const r = { vyska: H, cls: +clsWindows(m.shifts).toFixed(4), posuny: m.shifts.filter((x) => x.v > 0.001).map((x) => `${Math.round(x.t)}ms ${x.v.toFixed(4)} ${x.src.join(',')}`) };
  vysledok.skrol[s] = r;
  console.log(`skrol ${s}: výška ${H}px, CLS ${r.cls}${r.posuny.length ? ' | ' + r.posuny.slice(0, 8).join(' ; ') : ''}`);
  await ctx.close();
}

// ---------------------------------------------------------------- 3. bez JavaScriptu
for (const s of ['index.html', 'en/index.html', 'rezervacia.html']) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, javaScriptEnabled: false, colorScheme: 'dark' });
  const page = await ctx.newPage();
  await page.goto(BASE + s, { waitUntil: 'load', timeout: 60000 });
  await sleep(800);
  const r = await page.evaluate(() => {
    const t = document.body.innerText.replace(/\s+/g, ' ').trim();
    const h1 = document.querySelector('h1');
    const hb = h1 && h1.getBoundingClientRect();
    const img = [...document.images].filter((i) => { const b = i.getBoundingClientRect(); return b.width > 50 && b.top < innerHeight && b.bottom > 0; });
    const tma = (() => { const cs = getComputedStyle(document.body); return cs.backgroundColor; })();
    return { slov: t.split(' ').filter((w) => /\p{L}/u.test(w)).length, h1: h1 ? h1.innerText.replace(/\s+/g, ' ') : null, h1Viditelny: !!(hb && hb.width && hb.height && getComputedStyle(h1).visibility !== 'hidden' && +getComputedStyle(h1).opacity > 0), obrazkyVOkne: img.map((i) => `${(i.currentSrc || i.src).split('/').pop()} ${i.complete && i.naturalWidth ? 'načítaný' : 'NENAČÍTANÝ'}`), cenyVTexte: (t.match(/\d+(,\d+)? €/g) || []).length, telefon: t.includes('0951 267 203'), scrollW: document.documentElement.scrollWidth, sirka: innerWidth, pozadie: tma };
  });
  const f = path.join(OUT, `bezjs-${s.replace(/\W+/g, '-')}-390.jpg`);
  await page.screenshot({ path: f, type: 'jpeg', quality: 70 });
  r.snimka = f;
  vysledok.bezJS[s] = r;
  console.log(`bez JS ${s}: ${r.slov} slov, H1 „${r.h1}“ viditeľný ${r.h1Viditelny}, cien ${r.cenyVTexte}, telefón ${r.telefon}, šírka ${r.scrollW}/${r.sirka}, obrázky v okne: ${r.obrazkyVOkne.join(', ') || '-'}; ${f}`);
  await ctx.close();
}

// ---------------------------------------------------------------- 4. použiteľnosť na telefóne
for (const w of [360, 390]) {
  for (const s of ['index.html', 'en/index.html', 'rezervacia.html']) {
    const ctx = await browser.newContext({ viewport: { width: w, height: w === 360 ? 780 : 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: 'dark' });
    const page = await ctx.newPage();
    const chyby = [];
    page.on('pageerror', (e) => chyby.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') chyby.push('console: ' + m.text()); });
    await page.goto(BASE + s + '?uvod=off', { waitUntil: 'load', timeout: 60000 });
    await sleep(1500);
    if (s === 'index.html' || w === 390) { const f = path.join(OUT, `mobil-${s.replace(/\W+/g, '-')}-${w}.jpg`); await page.screenshot({ path: f, type: 'jpeg', quality: 70 }); }
    // prejsť stránku, aby sa ukázal obsah, ktorý sa odkrýva pri skrolovaní
    const H = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < H; y += 800) { await page.evaluate((y) => window.scrollTo(0, y), y); await sleep(120); }
    await page.evaluate(() => window.scrollTo(0, 0)); await sleep(400);
    const r = await page.evaluate(() => {
      const vis = (el) => { const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) return false; const b = el.getBoundingClientRect(); return b.width > 0 && b.height > 0; };
      const malePismo = new Map();
      const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let n; while ((n = tw.nextNode())) { const t = n.nodeValue.trim(); if (t.length < 2) continue; const el = n.parentElement; if (!el || !vis(el) || el.closest('[aria-hidden="true"],.visually-hidden,script,style,noscript,template')) continue; const fs = parseFloat(getComputedStyle(el).fontSize); if (fs < 12) { const k = `${fs}px ${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ')[0]}`; malePismo.set(k, (malePismo.get(k) || 0) + 1); } }
      const male = [];
      for (const el of document.querySelectorAll('a[href], button, [role="button"], input, select, summary')) {
        if (!vis(el)) continue;
        const b = el.getBoundingClientRect();
        // odkaz vnútri odseku (v riadku textu) Lighthouse ani WCAG 2.5.8 nepočíta
        const vRiadku = el.tagName === 'A' && getComputedStyle(el).display === 'inline' && el.parentElement && /^(P|LI|DD|SPAN|ADDRESS)$/.test(el.parentElement.tagName) && el.parentElement.innerText.trim().length > el.innerText.trim().length + 3;
        if (vRiadku) continue;
        if (b.width < 44 || b.height < 44) male.push(`${el.tagName.toLowerCase()}${el.className ? '.' + String(el.className).split(' ')[0] : ''} „${(el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 30)}“ ${Math.round(b.width)}×${Math.round(b.height)}`);
      }
      return { scrollW: document.documentElement.scrollWidth, sirka: innerWidth, malePismo: [...malePismo].map(([k, v]) => `${k} ×${v}`), maleCiele: male };
    });
    r.chyby = chyby;
    vysledok.mobil[`${s} ${w}`] = r;
    console.log(`mobil ${w} ${s}: pretekanie ${r.scrollW > r.sirka ? 'ÁNO ' + r.scrollW + '/' + r.sirka : 'nie'}; písmo < 12 px: ${r.malePismo.join(', ') || '-'}; ciele < 44 px (${r.maleCiele.length}): ${r.maleCiele.slice(0, 14).join(' | ') || '-'}${chyby.length ? ' | CHYBY: ' + chyby.join(' ; ') : ''}`);
    await ctx.close();
  }
}

fs.writeFileSync(path.join(OUT, 'a3-rychlost.json'), JSON.stringify(vysledok, null, 1));
await koniec();
console.log('hotovo', path.join(OUT, 'a3-rychlost.json'));
