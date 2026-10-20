#!/usr/bin/env node
/* Overenie T8: prvé načítanie na telefóne (390×844, DPR 3, CPU N×, Fast 4G, prázdna vyrovnávacia pamäť).
   Stopa od navigácie N sekúnd: FCP, LCP (prvok), dlhé úlohy (stena aj čas vlákna) s pôvodcom (najväčšia vnorená
   funkcia / skript), súčet blokovania (stena − 50 ms) po FCP, vynútený štýl a layout v module app.js.
   node nacitanie.mjs [--film=on|off|predvolene] [--uvod=znova|off] [--cpu=4] [--sekund=14] [--meno=x] */
import { createRequire } from 'module';
import fs from 'node:fs';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.length ? v.join('=') : '1']; }));
const FILM = opt.film || 'on', CPU = Number(opt.cpu || 4), SEK = Number(opt.sekund || 14);
const MENO = opt.meno || `nacitanie-${FILM}-cpu${CPU}`;
const q = new URLSearchParams(); if (FILM !== 'predvolene') q.set('film', FILM); q.set('uvod', opt.uvod || 'znova'); q.set('hudba', 'off');
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: 'sk-SK' });
await ctx.addInitScript(() => {
  window.__lcp = []; window.__fcp = 0;
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp.push({ t: e.startTime, el: e.element ? e.element.tagName + '.' + String(e.element.className).slice(0, 40) : (e.url || '').split('/').pop() }); }).observe({ type: 'largest-contentful-paint', buffered: true }); } catch (e) { /* nič */ }
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.name === 'first-contentful-paint') window.__fcp = e.startTime; }).observe({ type: 'paint', buffered: true }); } catch (e) { /* nič */ }
});
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await cdp.send('Network.enable');
await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 165, downloadThroughput: 9e6 * 0.9 / 8, uploadThroughput: 1.5e6 * 0.9 / 8 });
await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
await cdp.send('Tracing.start', { categories: 'devtools.timeline,disabled-by-default-devtools.timeline,blink.user_timing,loading,v8', transferMode: 'ReturnAsStream' });
await page.goto(`http://127.0.0.1:${opt.port || 8400}/barbershop-30/?${q}`, { waitUntil: 'commit', timeout: 60000 });
const navT = Date.now();
await page.waitForTimeout(SEK * 1000);
const m = await page.evaluate(() => ({ fcp: window.__fcp, lcp: window.__lcp, cls: document.documentElement.className, film: (() => { try { const s = window.BS30_FILM.state; return { on: s.on, firstFrameMs: s.firstFrameMs, pro: s.pro }; } catch (e) { return null; } })() }));
const done = new Promise((r) => cdp.once('Tracing.tracingComplete', r));
await cdp.send('Tracing.end'); const { stream } = await done;
let raw = ''; for (;;) { const c = await cdp.send('IO.read', { handle: stream }); raw += c.data; if (c.eof) break; }
await browser.close();
fs.mkdirSync('stopy', { recursive: true }); if (opt.stopa === '1') fs.writeFileSync(`stopy/${MENO}.json`, raw);
const evs = JSON.parse(raw).traceEvents;
const tn = evs.find((e) => e.name === 'thread_name' && e.args.name === 'CrRendererMain' && evs.some((x) => x.pid === e.pid && x.name === 'ParseHTML'));
const M = evs.filter((e) => e.pid === tn.pid && e.tid === tn.tid);
const X = M.filter((e) => e.ph === 'X' && e.dur != null).sort((a, b) => a.ts - b.ts || b.dur - a.dur);
const nav = M.find((e) => e.name === 'navigationStart') || evs.find((e) => e.name === 'navigationStart') || X[0];
const T0 = nav.ts;
const tasks = X.filter((e) => e.name === 'RunTask'); const top = []; let end = -1; for (const t of tasks) if (t.ts >= end) { top.push(t); end = t.ts + t.dur; }
const td = (e) => (e.tdur ?? e.dur) / 1000;
const desc = (e) => { const a = e.args || {}, d = a.data || a.beginData || {}; let s = e.name; const u = d.url || d.scriptName || (d.stackTrace && d.stackTrace[0] && d.stackTrace[0].url) || ''; if (u) s += ' ' + u.split('/').pop().split('?')[0] + (d.lineNumber != null ? ':' + (d.lineNumber + 1) : ''); if (d.functionName) s += ' ' + d.functionName; return s; };
const fcpTs = T0 + m.fcp * 1000;
const longs = top.filter((t) => t.dur > 50000).map((t) => {
  const inner = X.filter((e) => e !== t && e.ts >= t.ts && e.ts + e.dur <= t.ts + t.dur);
  const fn = inner.filter((e) => ['FunctionCall', 'EvaluateScript', 'v8.evaluateModule', 'TimerFire', 'FireAnimationFrame', 'ParseHTML', 'EventDispatch', 'v8.compileModule', 'v8.compile', 'ParseAuthorStyleSheet'].includes(e.name)).sort((a, b) => b.dur - a.dur)[0];
  const forced = inner.filter((e) => e.name === 'UpdateLayoutTree' || e.name === 'Layout').reduce((a, e) => a + td(e), 0);
  return { odNavMs: Math.round((t.ts - T0) / 1000), stenaMs: Math.round(t.dur / 1000), vlaknoMs: Math.round(td(t)), stylLayoutMs: Math.round(forced), povodca: fn ? desc(fn) + ` (${Math.round(fn.dur / 1000)} ms)` : '-' };
});
const tbt = top.filter((t) => t.ts >= fcpTs && t.dur > 50000).reduce((a, t) => a + (t.dur / 1000 - 50), 0);
const tbtV = top.filter((t) => t.ts >= fcpTs && (t.tdur || 0) > 50000).reduce((a, t) => a + (td(t) - 50), 0);
// modul app.js: vyhodnotenie a vynútený štýl/layout v ňom
const appEval = X.filter((e) => (e.name === 'v8.evaluateModule' || e.name === 'EvaluateScript') && JSON.stringify(e.args || {}).includes('app.js'));
const appInfo = appEval.map((e) => ({ odNavMs: Math.round((e.ts - T0) / 1000), stenaMs: Math.round(e.dur / 1000), vlaknoMs: Math.round(td(e)), stylLayoutMs: Math.round(X.filter((x) => (x.name === 'UpdateLayoutTree' || x.name === 'Layout') && x.ts >= e.ts && x.ts + x.dur <= e.ts + e.dur).reduce((a, x) => a + td(x), 0)) }));
const out = { meno: MENO, film: FILM, cpu: CPU, zataz: fs.readFileSync('/proc/loadavg', 'utf8').split(' ').slice(0, 3), fcpMs: Math.round(m.fcp), lcp: m.lcp.map((x) => ({ t: Math.round(x.t), el: x.el })), filmStav: m.film, cls: m.cls,
  dlhychUloh: longs.length, tbtPoFcpStenaMs: Math.round(tbt), tbtPoFcpVlaknoMs: Math.round(tbtV), najdlhsie: [...longs].sort((a, b) => b.stenaMs - a.stenaMs).slice(0, 10), appJsModul: appInfo };
fs.mkdirSync('vysledky', { recursive: true });
fs.writeFileSync(`vysledky/${MENO}.json`, JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
