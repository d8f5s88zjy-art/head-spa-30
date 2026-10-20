#!/usr/bin/env node
/* Overenie T2/T7: interakcie na telefóne (menu, jazyk) – INP z Event Timing (duration = vstup až ďalší obraz)
   a rozklad v čase vlákna zo stopy: obsluha udalosti, vynútený štýl a layout v nej, dlhé úlohy do 1 s po ťuknutí.
   node inp.mjs [--film=off|on] [--cpu=4] [--y=2700] [--necinnost=5] [--sub=zamena.json] [--meno=x] [--port=8432] */
import { createRequire } from 'module';
import fs from 'node:fs';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.length ? v.join('=') : '1']; }));
const FILM = opt.film || 'off', CPU = Number(opt.cpu || 4), Y = Number(opt.y ?? 2700), IDLE = Number(opt.necinnost || 5);
const MENO = opt.meno || `inp-${FILM}-cpu${CPU}`;
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: 'sk-SK' });
if (opt.sub) {
  const SUB = JSON.parse(fs.readFileSync(opt.sub, 'utf8'));
  for (const [path, reps] of Object.entries(SUB)) await ctx.route(`**/barbershop-30/${path}*`, async (route) => {
    const r = await route.fetch(); let body = await r.text();
    for (const [a, b] of reps) { if (!body.includes(a)) { console.error('ZAMENA NESEDI', a.slice(0, 60)); process.exit(2); } body = body.split(a).join(b); }
    await route.fulfill({ response: r, body, headers: { ...r.headers(), 'cache-control': 'no-store' } });
  });
}
await ctx.addInitScript(() => {
  window.__ev = [];
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.interactionId) window.__ev.push({ n: e.name, id: e.interactionId, t: e.startTime, d: e.duration, ps: e.processingStart - e.startTime, pe: e.processingEnd - e.startTime }); }).observe({ type: 'event', durationThreshold: 16, buffered: true }); } catch (e) { /* nič */ }
});
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await page.goto(`http://127.0.0.1:${opt.port || 8432}/barbershop-30/?film=${FILM}&uvod=off&hudba=off`, { waitUntil: 'load' });
await page.touchscreen.tap(30, 450);
for (let i = 0; i < 60; i++) { if (await page.evaluate(() => /world-in|world-off/.test(document.documentElement.className))) break; await page.waitForTimeout(500); }
await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), Y);
await page.waitForTimeout(6000);                                   // načítanie záberov, jazykový modul
await page.waitForSelector('[data-lang-pick="en"]', { state: 'attached', timeout: 20000 });
await page.waitForTimeout(IDLE * 1000);                            // pokoj bez dotyku (film: dýchanie beží 3 min)
await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
await cdp.send('Tracing.start', { categories: 'devtools.timeline,disabled-by-default-devtools.timeline,blink.user_timing', transferMode: 'ReturnAsStream' });
const steps = [];
const tapOn = async (name, sel, wait) => {
  const b = await page.evaluate((s) => { const el = document.querySelector(s); if (!el) return null; const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, sel);
  if (!b) { steps.push({ name, chyba: 'nenajdene ' + sel }); return; }
  const t = await page.evaluate((n) => { performance.mark('tap:' + n); return performance.now(); }, name);
  await page.touchscreen.tap(b[0], b[1]);
  await page.waitForTimeout(wait);
  steps.push({ name, t });
};
await tapOn('menuOtvor', '.nav-toggle', 2500);
await tapOn('jazykEN', '#nav [data-lang-pick="en"]', 4000);
await tapOn('jazykSK', '#nav [data-lang-pick="sk"]', 4000);
await tapOn('menuZavri', '.nav-toggle', 2500);
const done = new Promise((r) => cdp.once('Tracing.tracingComplete', r));
await cdp.send('Tracing.end');
const { stream } = await done;
let raw = ''; for (;;) { const c = await cdp.send('IO.read', { handle: stream }); raw += c.data; if (c.eof) break; }
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
const ev = await page.evaluate(() => window.__ev);
const film = await page.evaluate(() => { try { const s = window.BS30_FILM.state; return { on: s.on, frames: s.frames, dpr: s.dpr }; } catch (e) { return null; } });
await browser.close();
if (opt.stopa === '1') { fs.mkdirSync('stopy', { recursive: true }); fs.writeFileSync(`stopy/${MENO}.json`, raw); }
const evs = JSON.parse(raw).traceEvents;
const tn = evs.find((e) => e.name === 'thread_name' && e.args.name === 'CrRendererMain');
const M = evs.filter((e) => e.pid === tn.pid && e.tid === tn.tid);
const X = M.filter((e) => e.ph === 'X' && e.dur != null);
const marks = Object.fromEntries(M.filter((e) => e.name && e.name.startsWith('tap:')).map((e) => [e.name.slice(4), e.ts]));
const tasks = X.filter((e) => e.name === 'RunTask').sort((a, b) => a.ts - b.ts); const top = []; let end = -1; for (const t of tasks) if (t.ts >= end) { top.push(t); end = t.ts + t.dur; }
const td = (e) => (e.tdur ?? e.dur) / 1000;
const out = { meno: MENO, film: FILM, filmStav: film, cpu: CPU, y: Y, zataz: fs.readFileSync('/proc/loadavg', 'utf8').split(' ').slice(0, 3), kroky: {} };
for (let i = 0; i < steps.length; i++) {
  const s = steps[i]; if (!s.t) { out.kroky[s.name] = s; continue; }
  const tEnd = steps[i + 1] && steps[i + 1].t ? steps[i + 1].t : s.t + 4000;
  const mine = ev.filter((e) => e.t >= s.t - 5 && e.t < tEnd);
  const inp = mine.length ? Math.max(...mine.map((e) => e.d)) : null;
  const mts = marks[s.name];
  const win = X.filter((e) => e.ts >= mts && e.ts < mts + 1000000);
  const disp = win.filter((e) => e.name === 'EventDispatch');
  const forced = (arr) => arr.reduce((a, e) => a + X.filter((x) => (x.name === 'UpdateLayoutTree' || x.name === 'Layout') && x.ts >= e.ts && x.ts + x.dur <= e.ts + e.dur).reduce((b, x) => b + td(x), 0), 0);
  const typ = {}; for (const e of disp) { const k = e.args && e.args.data && e.args.data.type; if (!k) continue; (typ[k] || (typ[k] = [0, 0])); typ[k][0] += td(e); }
  for (const e of disp) { const k = e.args && e.args.data && e.args.data.type; if (k) typ[k][1] += forced([e]); }
  const longs = top.filter((t) => t.ts >= mts && t.ts < mts + 1500000 && t.dur > 50000).map((t) => [+(t.dur / 1000).toFixed(0), +td(t).toFixed(0)]);
  out.kroky[s.name] = { inpMs: inp && Math.round(inp), udalosti: mine.map((e) => `${e.n}:${Math.round(e.d)}(spracovanie ${Math.round(e.pe - e.ps)})`).slice(0, 6), obsluhaVlaknoMs: Object.fromEntries(Object.entries(typ).filter(([, v]) => v[0] >= 1).map(([k, v]) => [k, { spolu: +v[0].toFixed(1), vynuteneStylLayout: +v[1].toFixed(1) }])), dlheUlohyDo1_5s_stenaVlakno: longs };
}
fs.mkdirSync('vysledky', { recursive: true });
fs.writeFileSync(`vysledky/${MENO}.json`, JSON.stringify(out, null, 1));
console.log(JSON.stringify(out));
