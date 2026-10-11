#!/usr/bin/env node
// Dymový test statického webu v prehliadači (Playwright, Chromium). Všeobecná verzia kontrol z
// barbershop-30/source/tools/app-smoke.mjs a statického servera z barbershop-30/source/shot.mjs.
//
//   node dymovy-test.mjs [--root=<priečinok webu>] [--page=/index.html]      # lokálne, vlastný server
//   node dymovy-test.mjs --url=https://<používateľ>.github.io/<repozitár>/    # naživo
//   voľby: [--sirky=375,390,430] [--bez-externych] [--povol=<regex adries>] [--cls=0.01] [--cakaj=600]
//
// Kontroly (každá vypíše OK/FAIL, na konci exit 1 pri akomkoľvek FAIL):
//  1. počítač 1440×900 a telefón 390×844: bez pageerror, console.error, zlyhaných požiadaviek a HTTP 4xx/5xx
//  2. cesty v HTML relatívne (žiadne /assets/…): web potom beží v koreni domény aj v podpriečinku
//  3. externé požiadavky za behu sa vypíšu; s --bez-externych sú chybou (okrem tých, čo sedia na --povol)
//  4. posun rozloženia (CLS) po načítaní pod --cls
//  5. šírky telefónov: scrollWidth <= innerWidth na 0, 25, 50, 75 a 100 % výšky stránky
//  6. bez skriptov (všetky .js zablokované), 412×823 @1,75: telefón stránku neoddiali
//  7. prefers-reduced-motion: bez chýb
// Stránka môže nastaviť window.__renderDone = false/true (prvý obraz) a window.__scrollSettled (skrol dobehol);
// test na ne počká, keď existujú. Playwright je nainštalovaný globálne: rieši sa cez createRequire (NODE_PATH).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.length ? v.join('=') : true]; }));
const ROOT = path.resolve(opt.root || '.');
const SIRKY = String(opt.sirky || '375,390,430').split(',').map(Number);
const CLS_MAX = Number(opt.cls ?? 0.01);
const CAKAJ = Number(opt.cakaj ?? 600);
const POVOL = opt.povol ? new RegExp(opt.povol) : null;
// rovnaké nastavenie ako PRESETS[0] v shot.mjs: WebGL cez SwiftShader (kontajner nemá grafickú kartu)
const LAUNCH = { headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] };

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.gif': 'image/gif', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.txt': 'text/plain; charset=utf-8', '.mp4': 'video/mp4', '.webm': 'video/webm', '.xml': 'application/xml', '.webmanifest': 'application/manifest+json' };
function startStaticServer(root) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
        if (p.endsWith('/')) p += 'index.html';
        const abs = path.normalize(path.join(root, p));
        if (!abs.startsWith(root + path.sep) && abs !== root) { res.writeHead(403); return res.end('forbidden'); }
        fs.stat(abs, (err, st) => {
          if (err || !st.isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('not found: ' + p); }
          // no-store: test vždy vidí aktuálne súbory (bajty sa potom môžu stiahnuť dvakrát, naživo idú z cache)
          res.writeHead(200, { 'Content-Type': MIME[path.extname(abs).toLowerCase()] || 'application/octet-stream', 'Content-Length': st.size, 'Cache-Control': 'no-store' });
          fs.createReadStream(abs).pipe(res);
        });
      } catch (e) { res.writeHead(500); res.end(String(e)); }
    });
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => { const { port } = server.address(); resolve({ server, origin: `http://127.0.0.1:${port}` }); });
  });
}

let failed = 0;
const ok = (cond, msg, extra = '') => { console.log(`${cond ? 'OK  ' : 'FAIL'} ${msg}${extra ? '  ' + extra : ''}`); if (!cond) failed++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const srv = opt.url ? null : await startStaticServer(ROOT);
const target = opt.url || `${srv.origin}${opt.page || '/index.html'}`;
const origin = new URL(target).origin;

async function openPage(browser, { viewport = { width: 1440, height: 900 }, mobile = false, reducedMotion = 'no-preference' } = {}) {
  const ctx = await browser.newContext({ viewport, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1, reducedMotion });
  const page = await ctx.newPage();
  const problems = [], requests = [];
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`console.error: ${m.text()}`); });
  page.on('requestfailed', (r) => problems.push(`requestfailed: ${r.url()} ${r.failure()?.errorText || ''}`));
  page.on('response', (r) => { if (r.status() >= 400) problems.push(`HTTP ${r.status()}: ${r.url()}`); });
  page.on('request', (r) => requests.push(r.url()));
  await page.goto(target, { waitUntil: 'load', timeout: 60000 });
  await page.waitForFunction(() => window.__renderDone !== false, null, { timeout: 60000 }).catch(() => problems.push('timeout: window.__renderDone'));
  await page.evaluate(() => document.fonts && document.fonts.ready);
  // okamžitý skrol: html{scroll-behavior:smooth} by inak skrol rozbehol a test by meral medzistav
  await page.addStyleTag({ content: 'html{scroll-behavior:auto !important}' });
  return { ctx, page, problems, requests };
}
async function scrollTo(page, y) {
  const moved = await page.evaluate((top) => { const y0 = Math.round(scrollY); window.scrollTo({ top, behavior: 'instant' }); return Math.round(scrollY) !== y0; }, Math.round(y));
  const settled = await page.evaluate(() => '__scrollSettled' in window);
  // ako app-smoke.mjs: príznak je po načítaní ešte true z pokoja, preto najprv počkať, kým stránka
  // pohyb zaznamená (false), a až potom, kým dobehne (true); bez pohybu sa nečaká
  if (settled && moved) {
    await page.waitForFunction(() => window.__scrollSettled === false, null, { timeout: 2000 }).catch(() => {});
    await page.waitForFunction(() => window.__scrollSettled === true, null, { timeout: 30000 }).catch(() => {});
  }
  await sleep(300);
}

const browser = await chromium.launch(LAUNCH);
try {
  for (const mobile of [false, true]) {
    const label = mobile ? 'telefón 390' : 'počítač 1440';
    const { ctx, page, problems, requests } = await openPage(browser, { mobile, viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 } });
    // buffered: true doplní aj posuny spred pripojenia pozorovateľa; zdroje (prvky) sa vypíšu pri chybe
    await page.evaluate(() => { window.__cls = 0; window.__clsSrc = []; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) { window.__cls += e.value; window.__clsSrc.push(`${Math.round(e.startTime)} ms ${e.value.toFixed(4)} ` + (e.sources || []).map((s) => s.node ? (s.node.id || (typeof s.node.className === 'string' && s.node.className.split(' ')[0]) || s.node.nodeName) : '?').join(',')); } }).observe({ type: 'layout-shift', buffered: true }); });
    await sleep(CAKAJ);
    ok(problems.length === 0, `[${label}] načítanie bez chýb a 4xx`, problems.slice(0, 4).join(' | '));
    const abs = await page.evaluate(() => {
      const bad = [];
      document.querySelectorAll('[src],[href],[srcset],[poster]').forEach((el) => {
        for (const a of ['src', 'href', 'poster', 'srcset']) {
          const v = el.getAttribute(a); if (!v) continue;
          const parts = a === 'srcset' ? v.split(',').map((s) => s.trim().split(/\s+/)[0]) : [v];
          parts.forEach((p) => { if (p.startsWith('/') && !p.startsWith('//')) bad.push(p); });
        }
      });
      return bad;
    });
    ok(abs.length === 0, `[${label}] všetky cesty v HTML sú relatívne`, abs.slice(0, 3).join(' '));
    const ext = [...new Set(requests.filter((u) => !u.startsWith(origin) && !u.startsWith('data:') && !u.startsWith('blob:')))];
    if (opt['bez-externych']) ok(ext.every((u) => POVOL && POVOL.test(u)), `[${label}] žiadne externé požiadavky (okrem povolených)`, ext.filter((u) => !(POVOL && POVOL.test(u))).slice(0, 3).join(' '));
    else console.log(`info [${label}] externé požiadavky: ${ext.length ? ext.slice(0, 5).join(' ') : 'žiadne'}`);
    const cls = await page.evaluate(() => ({ v: +window.__cls.toFixed(4), src: window.__clsSrc.slice(0, 3).join(' | ') }));
    ok(cls.v < CLS_MAX, `[${label}] posun rozloženia CLS ${cls.v} (limit ${CLS_MAX})`, cls.v ? cls.src : '');
    await ctx.close();
  }

  // šírky telefónov: žiadne vodorovné pretekanie na viacerých miestach stránky
  for (const w of SIRKY) {
    const { ctx, page } = await openPage(browser, { mobile: true, viewport: { width: w, height: 800 } });
    await sleep(400);
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    let where = '';
    for (const y of [0, h * 0.25, h * 0.5, h * 0.75, h]) {
      await scrollTo(page, y);
      const r = await page.evaluate(() => {
        const wide = [...document.querySelectorAll('body *')].filter((el) => { const b = el.getBoundingClientRect(); return b.width > 0 && b.right > innerWidth + 1 && getComputedStyle(el).position !== 'fixed'; }).slice(0, 2).map((el) => (typeof el.className === 'string' && el.className) || el.tagName);
        return { sw: document.documentElement.scrollWidth, iw: innerWidth, wide };
      });
      if (r.sw > r.iw) { where = `y=${Math.round(y)} ${r.sw}>${r.iw} ${r.wide.join(',')}`; break; }
    }
    ok(!where, `[${w} px] žiadne vodorovné pretekanie`, where);
    await ctx.close();
  }

  // bez skriptov (kým skript nedobehne, aj pri jeho zlyhaní): obrazovka mobilného Lighthouse 412×823 @1,75
  {
    const ctx = await browser.newContext({ viewport: { width: 412, height: 823 }, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await page.route(/\.m?js(\?|$)/, (r) => r.abort());
    await page.goto(target, { waitUntil: 'load', timeout: 60000 });
    await sleep(500);
    const r = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }));
    ok(r.iw === 412 && r.sw <= r.iw, '[412 px bez skriptov] žiadne pretekanie, telefón stránku neoddiali', JSON.stringify(r));
    await ctx.close();
  }

  // obmedzenie pohybu: stránka musí fungovať bez chýb
  {
    const { ctx, page, problems } = await openPage(browser, { reducedMotion: 'reduce' });
    await sleep(CAKAJ);
    ok(problems.length === 0, '[prefers-reduced-motion] bez chýb', problems.slice(0, 3).join(' | '));
    await ctx.close();
  }
} finally {
  await browser.close();
  if (srv) srv.server.close();
}
console.log(failed ? `\n${failed} kontrol zlyhalo` : '\nVšetky kontroly prešli');
process.exit(failed ? 1 : 0);
