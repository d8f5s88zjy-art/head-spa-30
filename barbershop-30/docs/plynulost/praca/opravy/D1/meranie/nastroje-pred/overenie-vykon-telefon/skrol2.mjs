#!/usr/bin/env node
/* Overenie nálezov vykon-telefon (2. verzia): skrol prstom (dotyk cez Input.dispatchTouchEvent) so stopou výkonu.
   Meria hlavné vlákno v ČASE VLÁKNA (tdur: bez čakania na GPU proces, so spomalením CPU) na snímku medzi
   BeginMainThreadFrame, rozklad na štýl / layout / paint / skript a rozdelenie podľa sekcie stránky
   (kotva performance.mark -> časová os stopy). Zámena súborov webu bez zmeny repozitára: --sub=subor.json
   ({"assets/film.js": [["z", "na"], ...]}) cez page.route.
   node skrol2.mjs --film=off|on|predvolene [--cpu=4] [--od=0] [--do=15400] [--gesto=stredne|svih|kratke]
        [--hudba=on|off] [--tap=1] [--js=init.js] [--css="..."] [--sub=zamena.json] [--meno=x] [--stopa=1]
        [--port=8310] [--pocitac=1] [--maxs=240] [--pauza=450] [--cakaj=4000] */
import { createRequire } from 'module';
import fs from 'node:fs';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.length ? v.join('=') : '1']; }));
const FILM = opt.film || 'off', CPU = Number(opt.cpu || 4), OD = Number(opt.od || 0), DO = Number(opt.do || 15400);
const PC = opt.pocitac === '1';
const G = { stredne: [420, 2333], svih: [560, 7000], kratke: [120, 1000] }[opt.gesto || 'stredne'];
const MENO = opt.meno || `${PC ? 'pc' : 'tel'}-${FILM}-cpu${CPU}-${opt.gesto || 'stredne'}`;
const PORT = opt.port || 8310;
const params = new URLSearchParams();
if (FILM !== 'predvolene') params.set('film', FILM);
params.set('uvod', 'off');
if (opt.hudba !== 'on') params.set('hudba', 'off');
const URL0 = `http://127.0.0.1:${PORT}/barbershop-30/?${params}`;
const load0 = fs.readFileSync('/proc/loadavg', 'utf8').split(' ').slice(0, 3).map(Number);
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext(PC ? { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, locale: 'sk-SK' } : { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: 'sk-SK' });
if (opt.js) for (const f of opt.js.split(',')) await ctx.addInitScript({ content: fs.readFileSync(f, 'utf8') });
if (opt.sub) {
  const SUB = JSON.parse(fs.readFileSync(opt.sub, 'utf8'));
  for (const [path, reps] of Object.entries(SUB)) {
    await ctx.route(`**/barbershop-30/${path}*`, async (route) => {
      const r = await route.fetch(); let body = await r.text();
      for (const [a, b] of reps) { if (!body.includes(a)) { console.error('ZAMENA NESEDI', path, a.slice(0, 60)); process.exit(2); } body = body.split(a).join(b); }
      await route.fulfill({ response: r, body, headers: { ...r.headers(), 'cache-control': 'no-store' } });
    });
  }
}
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await cdp.send('Network.enable');
// Fast 4G (ako DevTools): 9 Mb/s dole, 1,5 Mb/s hore, 165 ms RTT (×0,9)
await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 165, downloadThroughput: 9e6 * 0.9 / 8, uploadThroughput: 1.5e6 * 0.9 / 8 });
await page.goto(URL0, { waitUntil: 'load', timeout: 120000 });
if (opt.css) await page.addStyleTag({ content: opt.css });
if (opt.tap !== '0') { if (PC) await page.mouse.click(30, 450); else await page.touchscreen.tap(30, 450); }
for (let i = 0; i < 60; i++) { if (await page.evaluate(() => /world-in|world-off|world-frame/.test(document.documentElement.className))) break; await page.waitForTimeout(500); }
await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), OD);
await page.waitForTimeout(Number(opt.cakaj || 4000));
await page.evaluate(() => { window.__f = []; const f = (t) => { window.__f.push([t, scrollY]); requestAnimationFrame(f); }; requestAnimationFrame(f); });
await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
await cdp.send('Tracing.start', { categories: 'devtools.timeline,disabled-by-default-devtools.timeline,disabled-by-default-devtools.timeline.frame,blink.user_timing,v8', transferMode: 'ReturnAsStream' });
await page.waitForTimeout(100);
const kotva = await page.evaluate(() => { const t = performance.now(); performance.mark('kotva-stopy'); return t; });
const t0 = kotva;
const tStart = Date.now();
for (let i = 0; i < 400; i++) {
  const y = await page.evaluate(() => scrollY);
  if (y >= DO - 5 || Date.now() - tStart > Number(opt.maxs || 240) * 1000) break;
  const dist = Math.min(G[0], DO - y);
  if (PC) await cdp.send('Input.synthesizeScrollGesture', { x: 720, y: 450, yDistance: -dist, speed: G[1], gestureSourceType: 'mouse' });
  else {
    const ms = 1000 * dist / G[1], n = Math.max(2, Math.round(ms / 16)), y0 = 700;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: y0 }] });
    for (let k = 1; k <= n; k++) { const tt = Date.now(); await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 195, y: y0 - dist * k / n }] }); const w = 16 - (Date.now() - tt); if (w > 0) await new Promise((r) => setTimeout(r, w)); }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  }
  await page.waitForTimeout(Number(opt.pauza || 450));
}
await page.waitForTimeout(1200);
const t1 = await page.evaluate(() => performance.now());
const done = new Promise((r) => cdp.once('Tracing.tracingComplete', r));
await cdp.send('Tracing.end');
const { stream } = await done;
let raw = ''; for (;;) { const c = await cdp.send('IO.read', { handle: stream }); raw += c.data; if (c.eof) break; }
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
const info = await page.evaluate(() => ({ f: window.__f, cls: document.documentElement.className, secs: [...document.querySelectorAll('main section[id], footer[id]')].map((el) => { const b = el.getBoundingClientRect(); return [el.id, Math.round(b.top + scrollY), Math.round(b.bottom + scrollY)]; }), film: window.BS30_FILM && window.BS30_FILM.state ? (() => { try { const s = window.BS30_FILM.state; return { on: s.on, dpr: s.dpr, frames: s.frames }; } catch (e) { return null; } })() : null, gl: window.__glStats ? (() => { const S = window.__glStats, a = S.naSnimku; const ms = a.map((x) => x.ms).sort((x, y) => x - y); return { volani: S.volani, mpx: +S.mpx.toFixed(1), mb: +(S.mpx * 4).toFixed(0), msSpolu: +S.ms.toFixed(0), msMax: +S.max.toFixed(1), snimokSNahratim: a.length, nahratiNaSnimkuMax: Math.max(0, ...a.map((x) => x.n)), mbNaSnimkuMax: +(4 * Math.max(0, ...a.map((x) => x.mpx))).toFixed(1), msNaSnimkuP50: ms.length ? +ms[ms.length >> 1].toFixed(1) : 0, msNaSnimkuP95: ms.length ? +ms[Math.floor(ms.length * 0.95)].toFixed(1) : 0 }; })() : null, anim: document.getAnimations().filter((a) => a.playState === 'running').map((a) => (a.effect && a.effect.target ? (a.effect.target.className || a.effect.target.tagName) + (a.effect.pseudoElement || '') : '?') + ':' + (a.animationName || a.constructor.name)) }));
await browser.close();
const load1 = fs.readFileSync('/proc/loadavg', 'utf8').split(' ').slice(0, 3).map(Number);
fs.mkdirSync('stopy', { recursive: true }); fs.mkdirSync('vysledky', { recursive: true });
if (opt.stopa === '1') fs.writeFileSync(`stopy/${MENO}.json`, raw);
// ---------- rozbor ----------
const evs = JSON.parse(raw).traceEvents;
const tn = evs.find((e) => e.name === 'thread_name' && e.args.name === 'CrRendererMain');
const M = evs.filter((e) => e.pid === tn.pid && e.tid === tn.tid);
const mk = M.find((e) => e.name === 'kotva-stopy');
const offUs = mk ? mk.ts - kotva * 1000 : 0;          // ts stopy = performance.now()*1000 + offUs
const X = M.filter((e) => e.ph === 'X' && e.dur != null);
const tasks = X.filter((e) => e.name === 'RunTask' || e.name === 'ThreadControllerImpl::RunTask').sort((a, b) => a.ts - b.ts);
const top = []; let end = -1; for (const t of tasks) { if (t.ts >= end) { top.push(t); end = t.ts + t.dur; } }
const bmf = M.filter((e) => e.name === 'BeginMainThreadFrame').map((e) => e.ts).sort((a, b) => a - b);
const sum = (a) => a.reduce((x, y) => x + y, 0);
const st = (a) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); const q = (p) => s[Math.min(s.length - 1, Math.floor(p * s.length))]; return { n: a.length, p50: +q(0.5).toFixed(1), p95: +q(0.95).toFixed(1), max: +s[s.length - 1].toFixed(1), priem: +(sum(a) / a.length).toFixed(2) }; };
const nF = bmf.length - 1;
const arr = () => new Float64Array(Math.max(0, nF));
const cpu = arr(), sty = arr(), lay = arr(), pnt = arr(), scr = arr(), elc = arr(), gc = arr();
const idx = (ts) => { let lo = 0, hi = bmf.length - 1; if (ts < bmf[0] || ts >= bmf[hi]) return -1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (bmf[m] <= ts) lo = m; else hi = m; } return lo; };
const td = (e) => (e.tdur != null ? e.tdur : e.dur) / 1000;
for (const t of top) { const i = idx(t.ts); if (i >= 0) cpu[i] += td(t); }
const pick = (names, a) => { for (const e of X) if (names.has(e.name)) { const i = idx(e.ts); if (i >= 0) a[i] += td(e); } };
pick(new Set(['UpdateLayoutTree']), sty);
pick(new Set(['Layout']), lay);
pick(new Set(['Paint', 'PrePaint', 'Layerize', 'UpdateLayer', 'Commit']), pnt);
pick(new Set(['FireAnimationFrame', 'EventDispatch', 'TimerFire', 'EvaluateScript', 'v8.evaluateModule', 'FireIdleCallback', 'RunMicrotasks']), scr);
pick(new Set(['MinorGC', 'MajorGC']), gc);
for (const e of X) if (e.name === 'UpdateLayoutTree') { const i = idx(e.ts); const n = (e.args && (e.args.elementCount || (e.args.data && e.args.data.elementCount))) || 0; if (i >= 0) elc[i] += n; }
const by = {};
for (const e of X) if (e.name === 'FunctionCall' && e.args && e.args.data) { const u = (e.args.data.url || '').split('/').pop().split('?')[0] + ':' + (e.args.data.lineNumber != null ? e.args.data.lineNumber + 1 : '') + ' ' + (e.args.data.functionName || ''); (by[u] || (by[u] = [])).push(td(e)); }
const funkcie = Object.entries(by).map(([k, a]) => [k, +sum(a).toFixed(0), a.length, +(sum(a) / a.length).toFixed(2), +Math.max(...a).toFixed(1)]).sort((a, b) => b[1] - a[1]).slice(0, 14);
const F = info.f.filter(([t]) => t >= t0 && t <= t1);
const secOf = (y) => { const m = y + (PC ? 900 : 844) * 0.5; const s = info.secs.find(([, a, b]) => m >= a && m < b); return s ? s[0] : '-'; };
let fi = 0;
const yAt = (ts) => { const t = (ts - offUs) / 1000; while (fi + 1 < F.length && F[fi + 1][0] <= t) fi++; return F.length ? F[fi][1] : null; };
const bySec = {};
for (let i = 0; i < nF; i++) { const y = yAt(bmf[i]); const s = y == null ? '-' : secOf(y); const b = (bySec[s] || (bySec[s] = { cpu: [], sty: [], lay: [], pnt: [], scr: [] })); b.cpu.push(cpu[i]); b.sty.push(sty[i]); b.lay.push(lay[i]); b.pnt.push(pnt[i]); b.scr.push(scr[i]); }
const sekcie = Object.fromEntries(Object.entries(bySec).map(([k, v]) => [k, { snimok: v.cpu.length, cpuPriem: +(sum(v.cpu) / v.cpu.length).toFixed(1), cpuP95: st(v.cpu).p95, styl: +(sum(v.sty) / v.cpu.length).toFixed(2), layout: +(sum(v.lay) / v.cpu.length).toFixed(2), paint: +(sum(v.pnt) / v.cpu.length).toFixed(2), skript: +(sum(v.scr) / v.cpu.length).toFixed(2) }]));
const dts = []; for (let i = 1; i < F.length; i++) dts.push(F[i][0] - F[i - 1][0]);
const longT = top.filter((t) => t.dur > 50000), longTd = top.filter((t) => (t.tdur || 0) > 50000);
const out = {
  meno: MENO, url: URL0, cpu: CPU, gesto: opt.gesto || 'stredne', js: opt.js || null, css: opt.css || null, sub: opt.sub || null, zatazPred: load0, zatazPo: load1, trvanieS: +((t1 - t0) / 1000).toFixed(1),
  y: [OD, F.length ? F[F.length - 1][1] : null], cls: info.cls, film: info.film, gl: info.gl, animacieBezia: info.anim,
  snimkyRaf: { n: dts.length, ...st(dts), nad33: +(100 * dts.filter((x) => x > 33.4).length / Math.max(1, dts.length)).toFixed(1), nad100: dts.filter((x) => x > 100).length },
  vlaknoNaSnimku: { snimok: nF, cpu: st([...cpu]), nad16: +(100 * [...cpu].filter((x) => x > 16.7).length / Math.max(1, nF)).toFixed(1), nad33: +(100 * [...cpu].filter((x) => x > 33.4).length / Math.max(1, nF)).toFixed(1), stylPriem: +(sum([...sty]) / nF).toFixed(2), layoutPriem: +(sum([...lay]) / nF).toFixed(2), paintPriem: +(sum([...pnt]) / nF).toFixed(2), skriptPriem: +(sum([...scr]) / nF).toFixed(2), gcPriem: +(sum([...gc]) / nF).toFixed(2), prvkovStylPriem: +(sum([...elc]) / nF).toFixed(1) },
  dlheUlohy: { stena50: longT.length, vlakno50: longTd.length, maxVlaknoMs: +(Math.max(0, ...top.map((t) => t.tdur || 0)) / 1000).toFixed(1), maxStenaMs: +(Math.max(0, ...top.map((t) => t.dur)) / 1000).toFixed(1) },
  sekcie, funkcie,
};
fs.writeFileSync(`vysledky/${MENO}.json`, JSON.stringify(out, null, 1));
console.log(JSON.stringify({ meno: out.meno, zataz: [load0[0], load1[0]], trvanieS: out.trvanieS, y: out.y, film: out.film, gl: out.gl, snimkyRaf: out.snimkyRaf, vlakno: out.vlaknoNaSnimku, dlhe: out.dlheUlohy }));
console.log('SEKCIE', JSON.stringify(sekcie));
console.log('FUNKCIE', JSON.stringify(funkcie.slice(0, 8)));
