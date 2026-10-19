// Má stopa čas vlákna (tdur)? Ak áno, dá sa merať CPU hlavného vlákna nezávisle od záťaže stroja.
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await page.goto('http://127.0.0.1:8433/barbershop-30/?film=off', { waitUntil: 'load' });
await cdp.send('Emulation.setCPUThrottlingRate', { rate: Number(process.argv[2] || 4) });
await page.waitForTimeout(1500);
await cdp.send('Tracing.start', { traceConfig: { includedCategories: ['devtools.timeline', 'disabled-by-default-devtools.timeline.frame', 'toplevel', 'blink'], excludedCategories: ['*'] }, transferMode: 'ReturnAsStream' });
for (let i = 0; i < 6; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: 700 }] }); for (let k = 1; k <= 10; k++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 195, y: 700 - 42 * k }] }); await page.waitForTimeout(16); } await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await page.waitForTimeout(400); }
const done = new Promise((r) => cdp.once('Tracing.tracingComplete', r));
await cdp.send('Tracing.end'); const { stream } = await done;
const parts = []; for (;;) { const r = await cdp.send('IO.read', { handle: stream, size: 8 << 20 }); parts.push(r.base64Encoded ? Buffer.from(r.data, 'base64') : Buffer.from(r.data)); if (r.eof) break; }
const j = JSON.parse(Buffer.concat(parts).toString()); const ev = Array.isArray(j) ? j : j.traceEvents;
const tn = new Map(); for (const e of ev) if (e.ph === 'M' && e.name === 'thread_name') tn.set(e.pid + ':' + e.tid, e.args.name);
const main = ev.filter((e) => tn.get(e.pid + ':' + e.tid) === 'CrRendererMain' && e.ph === 'X');
const withT = main.filter((e) => e.tdur != null);
const rs = main.filter((e) => e.name === 'Document::recalcStyle' || e.name === 'UpdateLayoutTree');
console.log('X na hlavnom vlákne', main.length, 's tdur', withT.length);
const sum = (a, k) => a.reduce((s, e) => s + (e[k] || 0), 0) / 1000;
console.log('recalc dur', sum(rs, 'dur').toFixed(1), 'tdur', sum(rs, 'tdur').toFixed(1));
const top = main.filter((e) => e.name === 'RunTask' || e.name === 'ThreadControllerImpl::RunTask');
console.log('RunTask dur', sum(top, 'dur').toFixed(1), 'tdur', sum(top, 'tdur').toFixed(1));
await browser.close();
