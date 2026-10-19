// Čo je vnútri prepočtu štýlu pri skrole (pokojná verzia, telefón CPU 4×): podudalosti Document::recalcStyle
// podľa vlastného času CPU (tdur), počet prvkov a najdrahšie jednotlivé prepočty.
// node styl-strom.mjs [--film=off] [--od=900] [--svihov=8] [--param=hudba=off]
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.length ? v.join('=') : '1']; }));
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await page.goto('http://127.0.0.1:8433/barbershop-30/?film=' + (opt.film || 'off') + (opt.param ? '&' + opt.param : ''), { waitUntil: 'load' });
await page.touchscreen.tap(20, 500);
await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), Number(opt.od || 600));
await page.waitForTimeout(2500);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: Number(opt.cpu || 4) });
await cdp.send('Tracing.start', { traceConfig: { includedCategories: ['devtools.timeline', 'blink', 'blink_style', 'disabled-by-default-blink.debug', 'disabled-by-default-devtools.timeline', 'toplevel'], excludedCategories: ['*'] }, transferMode: 'ReturnAsStream' });
for (let i = 0; i < Number(opt.svihov || 8); i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: 700 }] }); for (let k = 1; k <= 8; k++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 195, y: 700 - 30 * k }] }); await page.waitForTimeout(16); } await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await page.waitForTimeout(500); }
const done = new Promise((r) => cdp.once('Tracing.tracingComplete', r));
await cdp.send('Tracing.end'); const { stream } = await done;
const parts = []; for (;;) { const r = await cdp.send('IO.read', { handle: stream, size: 8 << 20 }); parts.push(r.base64Encoded ? Buffer.from(r.data, 'base64') : Buffer.from(r.data)); if (r.eof) break; }
const y1 = await page.evaluate(() => scrollY);
await browser.close();
const j = JSON.parse(Buffer.concat(parts).toString()); const ev = Array.isArray(j) ? j : j.traceEvents;
const tn = new Map(); for (const e of ev) if (e.ph === 'M' && e.name === 'thread_name') tn.set(e.pid + ':' + e.tid, e.args.name);
const L = ev.filter((e) => tn.get(e.pid + ':' + e.tid) === 'CrRendererMain' && e.ph === 'X' && e.dur != null).map((e) => ({ n: e.name, ts: e.ts, d: e.dur, td: e.tdur || 0, a: e.args })).sort((a, b) => a.ts - b.ts || b.d - a.d);
const st = []; for (const x of L) { x.end = x.ts + x.d; x.self = x.td; while (st.length && st[st.length - 1].end <= x.ts) st.pop(); x.anc = st.map((p) => p.n); if (st.length) st[st.length - 1].self -= x.td; st.push(x); }
const inRS = L.filter((x) => x.n === 'Document::recalcStyle' || x.anc.includes('Document::recalcStyle'));
const agg = {}; for (const x of inRS) agg[x.n] = (agg[x.n] || 0) + x.self;
console.log('koniec skrolu y =', y1);
console.log('vnútri Document::recalcStyle (vlastný čas CPU, ms):');
for (const [k, v] of Object.entries(agg).sort((a, b) => b[1] - a[1]).slice(0, 25)) console.log('  ', (v / 1000).toFixed(1), k);
const ult = L.filter((x) => x.n === 'UpdateLayoutTree');
const big = ult.map((x) => ({ ms: x.td / 1000, el: (x.a && (x.a.elementCount || (x.a.data && x.a.data.elementCount))) || 0 })).sort((a, b) => b.ms - a.ms);
console.log('UpdateLayoutTree', ult.length, '× CPU spolu', (ult.reduce((s, x) => s + x.td, 0) / 1000).toFixed(0), 'ms; najdrahšie:', JSON.stringify(big.slice(0, 10)));
const hist = {}; for (const b of big) { const k = b.el <= 5 ? '≤5' : b.el <= 20 ? '6-20' : b.el <= 100 ? '21-100' : '>100'; const h = hist[k] || (hist[k] = { n: 0, ms: 0 }); h.n++; h.ms += b.ms; }
console.log('podľa počtu prvkov:', JSON.stringify(Object.fromEntries(Object.entries(hist).map(([k, v]) => [k, { pocet: v.n, msSpolu: +v.ms.toFixed(0), msPriemer: +(v.ms / v.n).toFixed(2) }]))));
