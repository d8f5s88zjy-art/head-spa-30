#!/usr/bin/env node
/* Prečo je prepočet štýlu pri skrole drahý: štatistika selektorov (SelectorStats) a dôvody zneplatnenia štýlu
   (invalidationTracking) počas skrolu telefónom. node styl.mjs [--url=...] [--film=off] [--cpu=4] [--svihov=24]
   Vypíše najdrahšie selektory (čas, pokusy o zhodu), prvky s najčastejším prepočtom a dôvody. */
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.length ? v.join('=') : '1']; }));
const FILM = opt.film || 'off';
const URL0 = (opt.url || 'http://127.0.0.1:8433/barbershop-30/') + (FILM === 'predvolene' ? '' : '?film=' + FILM);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: 'sk-SK' });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: Number(opt.cpu || 4) });
await page.goto(URL0, { waitUntil: 'load' });
await sleep(4000);
await cdp.send('Tracing.start', { traceConfig: { includedCategories: ['devtools.timeline', 'disabled-by-default-devtools.timeline.invalidationTracking', 'disabled-by-default-blink.debug', 'blink,blink_style'], excludedCategories: ['*'] }, transferMode: 'ReturnAsStream' });
const swipe = async (y0, dist, ms) => { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: y0 }] }); const t0 = Date.now(); for (;;) { const e = Math.min(1, (Date.now() - t0) / ms); await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 195, y: y0 - dist * e }] }); if (e >= 1) break; await sleep(8); } await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); };
for (let i = 0; i < Number(opt.svihov || 24); i++) { await swipe(700, 420, 180); await sleep(500); }
const done = new Promise((r) => cdp.once('Tracing.tracingComplete', r));
await cdp.send('Tracing.end');
const { stream } = await done;
const parts = []; for (;;) { const r = await cdp.send('IO.read', { handle: stream, size: 8 << 20 }); parts.push(r.base64Encoded ? Buffer.from(r.data, 'base64') : Buffer.from(r.data)); if (r.eof) break; }
await browser.close();
const j = JSON.parse(Buffer.concat(parts).toString()); const ev = Array.isArray(j) ? j : j.traceEvents;
// selektory
const sel = new Map();
for (const e of ev) {
  if (e.name !== 'SelectorStats') continue;
  const t = (e.args && (e.args.selector_stats || (e.args.data && e.args.data.selector_stats))) || {};
  for (const s of t.selector_timings || []) { const x = sel.get(s.selector) || { ms: 0, pokusy: 0, zhody: 0 }; x.ms += (s['elapsed (us)'] || s.elapsed || 0) / 1000; x.pokusy += s.match_attempts || 0; x.zhody += s.match_count || 0; sel.set(s.selector, x); }
}
const top = [...sel.entries()].sort((a, b) => b[1].ms - a[1].ms).slice(0, 15);
console.log('najdrahšie selektory počas skrolu (ms spolu, pokusy, zhody):');
for (const [s, x] of top) console.log(`  ${x.ms.toFixed(1)} ms  ${x.pokusy}  ${x.zhody}  ${s.slice(0, 140)}`);
// prepočty štýlu: prvky a dôvody
const recalc = ev.filter((e) => e.name === 'StyleRecalcInvalidationTracking' || e.name === 'StyleInvalidatorInvalidationTracking' || e.name === 'ScheduleStyleInvalidationTracking');
const why = new Map();
for (const e of recalc) { const d = (e.args && e.args.data) || {}; const k = `${e.name.replace('InvalidationTracking', '')}: ${d.reason || d.invalidationList?.map?.((x) => x.classes || x.id || x.tagNames).join(',') || ''} | ${String(d.nodeName || '').slice(0, 60)}`; why.set(k, (why.get(k) || 0) + 1); }
console.log('\nnajčastejšie zneplatnenia štýlu (počet):');
for (const [k, n] of [...why.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20)) console.log(`  ${n}  ${k}`);
const ult = ev.filter((e) => e.name === 'UpdateLayoutTree' && e.ph === 'X');
const tot = ult.reduce((a, e) => a + (e.dur || 0), 0) / 1000, el = ult.reduce((a, e) => a + ((e.args && e.args.elementCount) || 0), 0);
console.log(`\nUpdateLayoutTree: ${ult.length}×, spolu ${tot.toFixed(0)} ms, prvkov spolu ${el}, priemer ${(el / Math.max(1, ult.length)).toFixed(1)} prvkov a ${(tot / Math.max(1, ult.length)).toFixed(2)} ms na prepočet`);
