#!/usr/bin/env node
/* Film v pokoji: koľko snímok film nakreslí, keď sa návštevník nehýbe (po jednom ťuknutí), a ako je pri tom
   vyťažené vlákno GPU a hlavné vlákno. node necinnost.mjs [--url=...] [--cpu=4] [--sekund=20] [--zariadenie=telefon|pocitac]
   Očakávanie podľa film.js: BREATH_MS = 180000 – 3 minúty po každom vstupe kreslí plnou frekvenciou displeja. */
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.length ? v.join('=') : '1']; }));
const URL0 = (opt.url || 'http://127.0.0.1:8433/barbershop-30/') + '?film=on&uvod=off&hudba=off';
const CPU = Number(opt.cpu || 4), SEC = Number(opt.sekund || 20), DEV = opt.zariadenie === 'pocitac' ? 'pocitac' : 'telefon';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext(DEV === 'telefon' ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: 'sk-SK' } : { viewport: { width: 1440, height: 900 }, locale: 'sk-SK' });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
await page.goto(URL0, { waitUntil: 'load', timeout: 120000 });
// prvý pohyb spustí film (bez prológu čaká na pohyb návštevníka)
if (DEV === 'telefon') await page.touchscreen.tap(30, 400); else await page.mouse.move(300, 300);
for (let i = 0; i < 120; i++) { if (await page.evaluate(() => document.documentElement.classList.contains('world-in'))) break; await sleep(500); }
await sleep(3000);
const s0 = await page.evaluate(() => ({ f: window.BS30_FILM.state.frames, t: performance.now() }));
await cdp.send('Tracing.start', { traceConfig: { includedCategories: ['toplevel', 'devtools.timeline'], excludedCategories: ['*'] }, transferMode: 'ReturnAsStream' });
await sleep(SEC * 1000);
const done = new Promise((r) => cdp.once('Tracing.tracingComplete', r));
await cdp.send('Tracing.end');
const { stream } = await done;
const parts = []; for (;;) { const r = await cdp.send('IO.read', { handle: stream, size: 8 << 20 }); parts.push(r.base64Encoded ? Buffer.from(r.data, 'base64') : Buffer.from(r.data)); if (r.eof) break; }
const s1 = await page.evaluate(() => ({ f: window.BS30_FILM.state.frames, t: performance.now(), dpr: window.BS30_FILM.state.dpr }));
const j = JSON.parse(Buffer.concat(parts).toString()); const ev = Array.isArray(j) ? j : j.traceEvents;
const tn = new Map(), pn = new Map(); for (const e of ev) { if (e.ph === 'M' && e.name === 'thread_name') tn.set(e.pid + ':' + e.tid, e.args.name); if (e.ph === 'M' && e.name === 'process_name') pn.set(e.pid, e.args.name); }
const busy = {}; const st = {};
for (const e of ev) { if (e.ph !== 'X' || e.dur == null) continue; const k = e.pid + ':' + e.tid; (st[k] || (st[k] = [])).push(e); }
for (const [k, l] of Object.entries(st)) { l.sort((a, b) => a.ts - b.ts); let end = 0, b = 0; for (const e of l) { const s = Math.max(e.ts, end), f = e.ts + e.dur; if (f > s) { b += f - s; end = f; } } const name = `${(pn.get(Number(k.split(':')[0])) || '?').replace(/ Process$/, '')}/${tn.get(k) || '?'}`; busy[name] = (busy[name] || 0) + b / 1000; }
const secs = (s1.t - s0.t) / 1000;
console.log(JSON.stringify({ zariadenie: DEV, cpu: CPU, sekund: +secs.toFixed(1), snimkyFilmu: s1.f - s0.f, snimkyFilmuZaSekundu: +((s1.f - s0.f) / secs).toFixed(1), dpr: s1.dpr,
  vytazenieVlakienPercent: Object.fromEntries(Object.entries(busy).filter(([k]) => /CrRendererMain|CrGpuMain|Compositor|VizCompositor/.test(k)).map(([k, v]) => [k, +(v / (SEC * 10)).toFixed(1)])) }, null, 1));
await browser.close();
