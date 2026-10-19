#!/usr/bin/env node
/* Profil JavaScriptu hlavného vlákna (CDP Profiler) počas skrolu telefónom: vlastný a celkový čas funkcií so
   súborom:riadkom. Ukáže, ktorá časť film.js / app.js / three.js berie čas na snímku.
   node profil.mjs [--film=on] [--cpu=4] [--od=0] [--do=2700] [--svihov=30] */
import { createRequire } from 'module';
import fs from 'node:fs';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.length ? v.join('=') : '1']; }));
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: 'sk-SK' });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await cdp.send('Network.enable');
await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 165, downloadThroughput: 9e6 * 0.9 / 8, uploadThroughput: 1.5e6 * 0.9 / 8 });
await page.goto('http://127.0.0.1:8433/barbershop-30/?film=' + (opt.film || 'on') + '&uvod=off&hudba=off', { waitUntil: 'load' });
await page.touchscreen.tap(30, 400);
for (let i = 0; i < 60; i++) { if (await page.evaluate(() => document.documentElement.classList.contains('world-in') || document.documentElement.classList.contains('world-off'))) break; await page.waitForTimeout(500); }
await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), Number(opt.od || 0));
await page.waitForTimeout(3000);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: Number(opt.cpu || 4) });
await cdp.send('Profiler.enable');
await cdp.send('Profiler.setSamplingInterval', { interval: 250 });
await cdp.send('Profiler.start');
const t0 = Date.now();
const DO = Number(opt.do || 2700);
for (let i = 0; i < Number(opt.svihov || 30); i++) {
  if (await page.evaluate(() => scrollY) >= DO) break;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: 700 }] });
  for (let k = 1; k <= 12; k++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 195, y: 700 - 25 * k }] }); await page.waitForTimeout(16); }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(700);
}
await page.waitForTimeout(1500);
const { profile } = await cdp.send('Profiler.stop');
const wall = Date.now() - t0;
const y1 = await page.evaluate(() => scrollY);
await browser.close();
// vlastný čas podľa uzla
const dt = profile.timeDeltas, smp = profile.samples, self = new Map();
for (let i = 0; i < smp.length; i++) self.set(smp[i], (self.get(smp[i]) || 0) + (dt[i] || 0) / 1000);
const byId = new Map(profile.nodes.map((n) => [n.id, n]));
const parent = new Map(); for (const n of profile.nodes) for (const c of n.children || []) parent.set(c, n.id);
const short = (u) => (u || '').split('/barbershop-30/').pop().split('?')[0] || '(natívne)';
const key = (n) => `${short(n.callFrame.url)}:${n.callFrame.lineNumber + 1} ${n.callFrame.functionName || '(anonymná)'}`;
const selfAgg = new Map(), totAgg = new Map();
for (const [id, ms] of self) {
  const n = byId.get(id); const k = key(n);
  selfAgg.set(k, (selfAgg.get(k) || 0) + ms);
  // celkový čas: každý predok raz
  const seen = new Set(); let p = id;
  while (p != null) { const nn = byId.get(p); const kk = key(nn); if (!seen.has(kk)) { seen.add(kk); totAgg.set(kk, (totAgg.get(kk) || 0) + ms); } p = parent.get(p); }
}
const filt = (m) => [...m.entries()].filter(([k]) => !/^\(natívne\):0 \((root|program|idle)\)/.test(k)).sort((a, b) => b[1] - a[1]);
const sum = [...self.values()].reduce((a, b) => a + b, 0), idle = [...self.entries()].filter(([id]) => /\((idle|program)\)/.test(byId.get(id).callFrame.functionName)).reduce((a, [, v]) => a + v, 0);
const out = { film: opt.film || 'on', cpu: Number(opt.cpu || 4), skrolDo: y1, trvanieMs: wall, vzorkyMs: Math.round(sum), necinnostMs: Math.round(idle), vlastny: filt(selfAgg).slice(0, 25).map(([k, v]) => [k, Math.round(v)]), celkovy: filt(totAgg).slice(0, 30).map(([k, v]) => [k, Math.round(v)]) };
fs.writeFileSync(new URL(`profil-${out.film}.json`, import.meta.url), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
