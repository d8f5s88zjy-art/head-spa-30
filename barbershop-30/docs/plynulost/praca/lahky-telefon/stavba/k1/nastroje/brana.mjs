// Kontrola (len čítanie): brána lite a ?film=on/off v rôznych zariadeniach, požiadavky film.js/three, chyby konzoly.
import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const ROOT = process.argv[2];
const { startStaticServer, PRESETS } = await import(ROOT + '/source/shot.mjs');
const srv = await startStaticServer(ROOT);
const browser = await chromium.launch(PRESETS[0]);
const cases = [
  ['pc 1440', { viewport: { width: 1440, height: 900 } }, ''],
  ['pc 1440 ?film=on', { viewport: { width: 1440, height: 900 } }, '?film=on'],
  ['pc 600x900 myš', { viewport: { width: 600, height: 900 } }, ''],
  ['pc 600x900 myš ?film=on', { viewport: { width: 600, height: 900 } }, '?film=on'],
  ['tel 390', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }, ''],
  ['tel 390 ?film=on', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }, '?film=on'],
  ['tel 390 ?film=off', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }, '?film=off'],
  ['tel 390 reduced', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, reducedMotion: 'reduce' }, ''],
  ['tel na šírku 844x390', { viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }, ''],
];
const out = [];
for (const [name, opt, q] of cases) {
  const ctx = await browser.newContext({ colorScheme: 'dark', ...opt });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', (e) => errs.push('pageerror: ' + e.message)); page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text().slice(0, 140)); });
  const req = []; page.on('request', (r) => { const u = r.url(); if (/film\.js|three\.module|film-worker|\/seq\/|hlbka|tim-slucka/.test(u)) req.push(u.replace(srv.origin, '')); });
  page.on('requestfailed', (r) => errs.push('requestfailed: ' + r.url().replace(srv.origin, '')));
  page.on('response', (r) => { if (r.status() >= 400) errs.push('HTTP ' + r.status() + ' ' + r.url().replace(srv.origin, '')); });
  await page.goto(srv.origin + '/index.html' + q, { waitUntil: 'load' });
  await page.mouse.move(200, 300).catch(() => {});
  await page.waitForTimeout(3500);
  const st = await page.evaluate(() => ({ cls: document.documentElement.className, motion: document.documentElement.dataset.motion, film: !!window.BS30_FILM, loops: document.querySelectorAll('video.film-loop').length, mp: document.querySelectorAll('link[rel=modulepreload]').length }));
  const filmJs = req.filter((u) => /film\.js/.test(u)).length;
  out.push({ name, ...st, filmJsReq: filmJs, ine: [...new Set(req.filter((u) => !/film\.js/.test(u)).map((u) => u.split('/').slice(0, 4).join('/')))].slice(0, 5), chyby: errs.slice(0, 5) });
  await ctx.close();
}
await browser.close(); srv.server.close();
for (const o of out) console.log(JSON.stringify(o));
