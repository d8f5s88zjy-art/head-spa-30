// Opravár 1: stopa štartu (prvá návšteva) na telefóne 390×844 @3 – čo robí hlavné vlákno a kedy prídu súbory a snímky
// obrazovky. node start-stopa.mjs <port> <c4s|c4f> <výstup.json> [query]
import fs from 'node:fs';
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const [PORT, PROF = 'c4s', OUT, Q = ''] = process.argv.slice(2);
const NET = { f: { offline: false, latency: 165, downloadThroughput: 9e6 / 8 * 0.9, uploadThroughput: 1.5e6 / 8 * 0.9 },
  s: { offline: false, latency: 562.5, downloadThroughput: 1.6e6 / 8 * 0.9, uploadThroughput: 750e3 / 8 * 0.9 } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: 'sk-SK', colorScheme: 'dark' });
const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
await cdp.send('Network.enable');
await cdp.send('Network.emulateNetworkConditions', NET[PROF.slice(-1)]);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: Number(PROF[1]) });
const req = new Map();
cdp.on('Network.requestWillBeSent', (e) => req.set(e.requestId, { url: e.request.url.split('/').pop().split('?')[0], t0: e.timestamp }));
cdp.on('Network.responseReceived', (e) => { const r = req.get(e.requestId); if (r) r.resp = e.timestamp; });
cdp.on('Network.loadingFinished', (e) => { const r = req.get(e.requestId); if (r) { r.end = e.timestamp; r.b = e.encodedDataLength; } });
const shots = [];
cdp.on('Page.screencastFrame', (f) => { shots.push(f.metadata.timestamp); cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}); });
await cdp.send('Tracing.start', { transferMode: 'ReturnAsStream', traceConfig: { includedCategories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'disabled-by-default-devtools.timeline.frame', 'loading', 'blink.user_timing', 'toplevel', 'cc', 'viz', 'gpu'] } });
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 40, maxWidth: 195, maxHeight: 422, everyNthFrame: 1 });
const tNav = Date.now() / 1000;
await page.goto(`http://127.0.0.1:${PORT}/barbershop-30/${Q}`, { waitUntil: 'commit', timeout: 90000 });
await sleep(9000);
await cdp.send('Page.stopScreencast');
const done = new Promise((r) => cdp.once('Tracing.tracingComplete', r));
await cdp.send('Tracing.end');
const { stream } = await done;
const parts = []; for (;;) { const c = await cdp.send('IO.read', { handle: stream, size: 4 << 20 }); parts.push(c.data); if (c.eof) break; }
const pi = await page.evaluate(() => ({ origin: performance.timeOrigin, fcp: (performance.getEntriesByName('first-contentful-paint')[0] || {}).startTime,
  res: performance.getEntriesByType('resource').map((r) => [r.name.split('/').pop(), Math.round(r.startTime), Math.round(r.responseEnd)]) }));
await browser.close();
const ev = JSON.parse(parts.join('')).traceEvents;
const nav = ev.find((e) => e.name === 'navigationStart' && e.args?.data?.documentLoaderURL?.includes('barbershop-30')) || ev.find((e) => e.name === 'navigationStart');
const T0 = nav.ts;
const main = ev.find((e) => e.name === 'thread_name' && e.args.name === 'CrRendererMain' && e.pid === nav.pid) || { pid: nav.pid, tid: nav.tid };
const M = ev.filter((e) => e.pid === main.pid && e.tid === main.tid && e.ph === 'X' && e.dur != null);
const ms = (ts) => Math.round((ts - T0) / 1000);
const tasks = M.filter((e) => e.name === 'RunTask' || e.name === 'ThreadControllerImpl::RunTask').sort((a, b) => a.ts - b.ts);
const top = []; let end = -1; for (const t of tasks) if (t.ts >= end) { top.push(t); end = t.ts + t.dur; }
const kids = (t) => { const m = {}; for (const e of M) if (e.ts >= t.ts && e.ts + e.dur <= t.ts + t.dur && e !== t && !/RunTask/.test(e.name)) m[e.name] = (m[e.name] || 0) + e.dur / 1000; return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => `${k} ${v.toFixed(0)}`); };
const dlhe = top.filter((t) => t.dur > 30000).map((t) => ({ od: ms(t.ts), ms: Math.round(t.dur / 1000), co: kids(t) }));
// snímky: DrawFrame / PipelineReporter (kompozítor), BeginMainThreadFrame (hlavné vlákno)
const all = ev.filter((e) => e.pid === main.pid || true);
const frames = ev.filter((e) => e.name === 'PipelineReporter' && e.ph === 'b').map((e) => ({ t: ms(e.ts), st: e.args?.chrome_frame_reporter?.state }));
const draws = ev.filter((e) => (e.name === 'DrawFrame' || e.name === 'Graphics.Pipeline.DrawAndSwap') ).map((e) => ms(e.ts));
const bmf = M.filter((e) => e.name === 'BeginMainThreadFrame').map((e) => ms(e.ts));
const paints = M.filter((e) => e.name === 'Paint' || e.name === 'PaintImage' || e.name === 'Decode Image').map((e) => [e.name, ms(e.ts), Math.round(e.dur / 1000)]);
const sieť = [...req.values()].filter((r) => r.end).map((r) => [r.url, Math.round((r.t0 - tNav) * 1000), Math.round((r.end - tNav) * 1000), r.b]).sort((a, b) => a[2] - b[2]);
const parse = M.filter((e) => e.name === 'ParseHTML').map((e) => [ms(e.ts), Math.round(e.dur / 1000), e.args?.beginData?.startLine, e.args?.endData?.endLine]);
const fcpEv = ev.filter((e) => /firstContentfulPaint|firstPaint|largestContentfulPaint::Candidate/.test(e.name)).map((e) => [e.name, ms(e.ts)]);
const out = { parse, fcpEv, prof: PROF, port: PORT, fcp: Math.round(pi.fcp), sietPodlaKonca: sieť, resourceTiming: pi.res, dlheUlohy: dlhe,
  snimkyObrazovky: shots.map((s) => Math.round((s - pi.origin / 1000) * 1000)), bmf, draws: draws.slice(0, 400), pipeline: frames.slice(0, 400), paints: paints.slice(0, 200) };
fs.writeFileSync(OUT, JSON.stringify(out));
console.log(JSON.stringify({ parse, fcpEv, fcp: out.fcp, dlhe: dlhe.slice(0, 12), snimky: out.snimkyObrazovky.slice(0, 60) }));
