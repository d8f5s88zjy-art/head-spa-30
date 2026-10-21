// Meranie 1 (kontrolór merania, nezávislé): PRED = D1 (hs-pred-d1, port 8600) a PO = lite (hs-lahky, port 8604),
// striedavo pred, po, pred, po. Telefón 390×844 DPR 3, isMobile, dotyk. Bez parametrov v adrese (ako majiteľ), okrem
// režimu pc (?uvod=off, film na počítači, rovnaké pre oba stromy). Sonda je pasívna (sonda.js, bez decode()).
//   node meraj.mjs start  --prof=c4f,c6f,c4s,c6s [--n=2]     prvá návšteva: screencast 8 s, bajty prvej obrazovky
//   node meraj.mjs scen   --prof=c4f [--sc=reload3000,tim,kontakt,spat,en] [--n=2]   čierny štart (SKEPTIK V1)
//   node meraj.mjs skrol  --prof=c4f,c6f,c4s,c6s [--n=3]     skrol prstom so stopou, potom až po pätičku (bajty celej stránky)
//   node meraj.mjs pc     [--n=2]                            počítač 1440×900: krátky skrol kolieskom so stopou
//   node meraj.mjs brana                                     ?film=on na telefóne, 600×900 s myšou, obmedzený pohyb
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const HERE = path.dirname(new URL(import.meta.url).pathname);
const ROOT = path.resolve(HERE, '..');
const DATA = path.join(ROOT, 'data'), PASY = path.join(ROOT, 'pasy'), TMP = path.join(ROOT, 'tmp');
for (const d of [DATA, PASY, TMP]) fs.mkdirSync(d, { recursive: true });
const SONDA = fs.readFileSync(path.join(HERE, 'sonda.js'), 'utf8');
const [MODE, ...rest] = process.argv.slice(2);
const opt = Object.fromEntries(rest.filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.length ? v.join('=') : '1']; }));
const STROMY = { pred: 8653, po: 8654, pred0: 8653, predoff: 8653 };
// GPU ako na iPhone: kontajner kreslí WebGL softvérovo (SwiftShader) a film.js D1 by pri tom prešiel do pokojnej verzie
// (world-frame, film.js:98–106). Telefón majiteľa má grafiku, preto sa kontrola GPU podvrhne (failIfMajorPerformanceCaveat
// vypnuté, UNMASKED_RENDERER = 'Apple GPU'); adresa ostáva bez parametrov. 'pred0' = D1 bez podvrhu (pokojná verzia kontajnera).
const GPU = `(() => { const gc = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (k, o, ...r) { if (o && typeof o === 'object' && o.failIfMajorPerformanceCaveat) o = { ...o, failIfMajorPerformanceCaveat: false }; return gc.call(this, k, o, ...r); };
  for (const C of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) { if (!C) continue; const gp = C.prototype.getParameter;
    C.prototype.getParameter = function (p) { if (p === 0x9246) return 'Apple GPU'; if (p === 0x9245) return 'Apple Inc.'; return gp.call(this, p); }; } })();`;
const NET = {
  f: { offline: false, latency: 165, downloadThroughput: 9e6 / 8 * 0.9, uploadThroughput: 1.5e6 / 8 * 0.9 },
  s: { offline: false, latency: 562.5, downloadThroughput: 1.6e6 / 8 * 0.9, uploadThroughput: 750e3 / 8 * 0.9 },
};
const PROF = { c1f: { cpu: 1, net: 'f' }, c4f: { cpu: 4, net: 'f' }, c6f: { cpu: 6, net: 'f' }, c4s: { cpu: 4, net: 's' }, c6s: { cpu: 6, net: 's' } };
const PHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: Number(process.env.DPR || 3), isMobile: true, hasTouch: true, locale: 'sk-SK', colorScheme: 'dark' };
const DESK = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, locale: 'sk-SK', colorScheme: 'dark' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const load = () => fs.readFileSync('/proc/loadavg', 'utf8').trim();
const base = (strom) => `http://127.0.0.1:${STROMY[strom]}/barbershop-30/`;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
console.log('loadavg', load(), 'mode', MODE, JSON.stringify(opt));

// ---- sieť: bajty (encodedDataLength) priebežne cez dataReceived, na konci požiadavky presne z loadingFinished ----
function siet(cdp) {
  const R = new Map(); let last = Date.now();
  cdp.on('Network.requestWillBeSent', (e) => { last = Date.now(); if (!R.has(e.requestId)) R.set(e.requestId, { url: e.request.url, b: 0, done: false, t: Date.now() }); });
  cdp.on('Network.dataReceived', (e) => { last = Date.now(); const r = R.get(e.requestId); if (r && !r.done) r.b += e.encodedDataLength || 0; });
  cdp.on('Network.loadingFinished', (e) => { last = Date.now(); const r = R.get(e.requestId); if (r) { r.b = Math.max(r.b, e.encodedDataLength || 0); r.done = true; } });
  cdp.on('Network.loadingFailed', (e) => { last = Date.now(); const r = R.get(e.requestId); if (r) r.done = true; });
  const kat = (u) => { const f = u.split('?')[0]; if (/^data:/.test(u)) return null; if (/\.(mp4|webm)$/.test(f)) return 'video'; if (/\/seq\//.test(f)) return 'sekvencie'; if (/\.(avif|webp|jpe?g|png|svg|gif)$/.test(f)) return 'obrazky';
    if (/\.(woff2?|ttf)$/.test(f)) return 'pisma'; if (/\.(js|mjs)$/.test(f)) return 'skripty'; if (/\.css$/.test(f)) return 'css'; if (/\.(bin|ktx2|glb|exr|hdr)$/.test(f)) return 'film-data'; if (/\.(mp3|ogg|wav|m4a|opus)$/.test(f)) return 'zvuk'; return 'ine'; };
  return {
    snap() { const by = {}; let tot = 0, n = 0; for (const r of R.values()) { const k = kat(r.url); if (!k) continue; by[k] = (by[k] || 0) + r.b; tot += r.b; n++; }
      const hero = [...R.values()].filter((r) => /\/(rohozka|vstup)(-m)?-\d+\.(avif|webp)/.test(r.url)).map((r) => r.url.split('/').pop());
      return { bajty: tot, poziadaviek: n, podlaTypu: by, hero }; },
    async idle(q = 2500, max = 30000) { const t0 = Date.now(); while (Date.now() - t0 < max) { if (Date.now() - last >= q) return Date.now() - t0; await sleep(250); } return -1; },
    list() { return [...R.values()].map((r) => [r.url.replace(/^https?:\/\/[^/]+/, ''), r.b]); },
  };
}
async function nova(strom, prof, { desk = false, init = null, w = 0, h = 0, mouse = false, reduced = false } = {}) {
  let o = desk ? DESK : PHONE;
  if (mouse) o = { viewport: { width: w, height: h }, deviceScaleFactor: 1, locale: 'sk-SK', colorScheme: 'dark' };
  if (reduced) o = { ...o, reducedMotion: 'reduce' };
  const ctx = await browser.newContext(o);
  if (strom !== 'pred0') await ctx.addInitScript({ content: GPU });
  if (init) await ctx.addInitScript({ content: init });
  await ctx.addInitScript({ content: SONDA });
  const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
  const net = siet(cdp);
  await cdp.send('Network.enable');
  if (prof && NET[prof.net]) await cdp.send('Network.emulateNetworkConditions', NET[prof.net]);
  if (prof && prof.cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: prof.cpu });
  return { ctx, page, cdp, net };
}
// screencast: snímky sa zapisujú na disk hneď (malé JPEG), rozbor tma3.py ich potom zmaže
async function natoc(cdp, dir, W = 390, H = 844) {
  fs.mkdirSync(dir, { recursive: true });
  const frames = []; const pend = [];
  const on = (f) => { const file = path.join(dir, `f${String(frames.length).padStart(4, '0')}.jpg`); frames.push({ file, ts: f.metadata.timestamp * 1000 });
    pend.push(fs.promises.writeFile(file, Buffer.from(f.data, 'base64'))); cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}); };
  cdp.on('Page.screencastFrame', on);
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 60, maxWidth: W, maxHeight: H, everyNthFrame: 1 });
  return async () => { await cdp.send('Page.stopScreencast').catch(() => {}); cdp.off('Page.screencastFrame', on); await Promise.all(pend); return { frames, stop: Date.now() }; };
}
function rozbor(dir, meta, pas) {
  fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(meta));
  const out = execFileSync('python3', ['-I', path.join(HERE, 'tma3.py'), dir, pas, ...(process.env.NECHAJ ? ['--nechaj'] : [])], { encoding: 'utf8' });
  if (!process.env.NECHAJ) try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
  return JSON.parse(out.trim().split('\n').pop());
}
const save = (name, o) => { fs.writeFileSync(path.join(DATA, name + '.json'), JSON.stringify(o, null, 1)); };
const STR = (opt.stromy || 'pred,po').split(',');
const poradie = (n) => { const a = []; for (let i = 1; i <= n; i++) for (const s of STR) a.push([s, i]); return a; };

// ---------------- START: prvá návšteva bez parametrov ----------------
async function start(strom, pk, rep) {
  const prof = PROF[pk]; const name = `start-${pk}-${strom}-${rep}`; const la = load();
  const { ctx, page, cdp, net } = await nova(strom, prof);
  const dir = path.join(TMP, name);
  const stop = await natoc(cdp, dir);
  await page.goto(base(strom), { waitUntil: 'commit', timeout: 90000 });
  const origin = await page.evaluate(() => performance.timeOrigin).catch(() => Date.now());
  while (Date.now() - origin < 8000) await sleep(100);
  const rec = await stop();
  const b8 = net.snap();
  const idle = await net.idle(2500, 30000);
  const b1 = net.snap();
  const s = await page.evaluate(() => window.__mOut());
  await ctx.close();
  const t = rozbor(dir, { origin: s.origin, fcp: s.fcp, h1At: s.h1At, h1Box: s.h1Box, koniecMs: rec.stop - s.origin, frames: rec.frames }, path.join(PASY, name + '.jpg'));
  const o = { name, strom, prof: pk, rep, loadavg: la, ...t, btnAt: s.btnAt, gl: s.gl, maxPlay: s.maxPlay, vidov: s.vidov, inc: s.inc, incN: s.incN, decWait: s.decWait, cls: s.cls, hero: s.hero,
    load: s.load && Math.round(s.load), bajty8s: b8, prvaObrazovka: { ...b1, idleMs: idle }, loaf: s.loaf.filter((x) => x[1] > 50).length, err: s.err };
  save(name, o);
  console.log(name, JSON.stringify({ fcp: o.fcp, tma3: o.tma3, fotkaMs: o.fotkaMs, fotkaH1Ms: o.fotkaH1Ms, h1At: o.h1At && Math.round(o.h1At), MB: (b1.bajty / 1e6).toFixed(2), hero: b1.hero, gl: o.gl, play: o.maxPlay, incN: o.incN, cls: o.cls }));
}

// ---------------- SCEN: čierny štart v ďalších situáciách (bez ?uvod=off) ----------------
async function scen(strom, pk, rep, sc) {
  const prof = PROF[pk]; const name = `scen-${sc}-${pk}-${strom}-${rep}`; const la = load();
  const init = sc === 'en' ? `try{if(!sessionStorage.__en){localStorage.setItem('b30.lang','en');sessionStorage.__en=1}}catch(e){}` : null;
  const { ctx, page, cdp } = await nova(strom, prof, { init });
  const B = base(strom); const dir = path.join(TMP, name);
  const priprav = async () => { await page.goto(B, { waitUntil: 'load', timeout: 120000 }); for (let i = 0; i < 60 && /\bpro\b/.test(await page.evaluate(() => document.documentElement.className)); i++) await sleep(500);
    await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, 3000); }); await sleep(2500); };
  if (sc === 'reload3000' || sc === 'spat') await priprav();
  if (sc === 'spat') { await page.goto(`http://127.0.0.1:${STROMY[strom]}/pravne.html`, { waitUntil: 'load' }); await sleep(800); }
  const stop = await natoc(cdp, dir);
  const t0 = Date.now();
  if (sc === 'reload3000') await page.reload({ waitUntil: 'commit' });
  else if (sc === 'spat') await page.goBack({ waitUntil: 'commit' });
  else if (sc === 'tim' || sc === 'kontakt') await page.goto(B + '#' + sc, { waitUntil: 'commit' });
  else await page.goto(B, { waitUntil: 'commit' });
  while (Date.now() - t0 < 4000) await sleep(100);
  const rec = await stop();
  const s = await page.evaluate(() => ({ ...window.__mOut(), nav: (performance.getEntriesByType('navigation')[0] || {}).type, near: [...document.querySelectorAll('.film-shot.is-near')].map((e) => e.dataset.shot) }));
  await ctx.close();
  const novy = s.origin >= t0 - 50; // nový dokument (nie bfcache)
  const rel = (x) => (x == null ? null : s.origin + x - t0);
  const fcp = novy ? rel(s.fcp) : (rec.frames.length ? rec.frames.find((f) => f.ts >= t0)?.ts - t0 : null);
  const t = rozbor(dir, { origin: t0, fcp, h1At: sc === 'en' ? rel(s.h1At) : null, h1Box: sc === 'en' ? s.h1Box : null, koniecMs: rec.stop - t0, frames: rec.frames }, path.join(PASY, name + '.jpg'));
  const o = { name, strom, prof: pk, rep, sc, loadavg: la, novyDokument: novy, nav: s.nav, ...t, y: s.y, near: s.near, cls: s.cls, gl: s.gl, incN: s.incN, inc: s.inc };
  save(name, o);
  console.log(name, JSON.stringify({ fcp: o.fcp, tma3: o.tma3, fotkaMs: o.fotkaMs, fotkaH1Ms: o.fotkaH1Ms, y: o.y, near: o.near, nav: o.nav, novy, cls: o.cls }));
}

// ---------------- stopa: rozbor hlavného vlákna ----------------
async function traceStart(cdp) {
  await cdp.send('Tracing.start', { categories: 'devtools.timeline,disabled-by-default-devtools.timeline.frame,blink.user_timing,toplevel', transferMode: 'ReturnAsStream' });
  return async () => {
    const done = new Promise((r) => cdp.once('Tracing.tracingComplete', r));
    await cdp.send('Tracing.end');
    const { stream } = await done;
    const parts = []; for (;;) { const c = await cdp.send('IO.read', { handle: stream, size: 4 << 20 }); parts.push(c.base64Encoded ? Buffer.from(c.data, 'base64').toString() : c.data); if (c.eof) break; }
    await cdp.send('IO.close', { handle: stream }).catch(() => {});
    return parts.join('');
  };
}
function rozborStopy(raw, kotvaPerf, w0, w1) {
  const evs = JSON.parse(raw).traceEvents; const velkost = raw.length;
  const tn = evs.filter((e) => e.name === 'thread_name' && e.args && e.args.name === 'CrRendererMain');
  // hlavné vlákno stránky = to, ktoré má značku kotva-stopy
  const mk = evs.find((e) => e.name === 'kotva-stopy');
  const main = mk ? tn.find((t) => t.pid === mk.pid && t.tid === mk.tid) || { pid: mk.pid, tid: mk.tid } : tn[0];
  const M = evs.filter((e) => e.pid === main.pid && e.tid === main.tid);
  const off = mk ? mk.ts - kotvaPerf * 1000 : 0; // ts stopy (µs) = perf*1000 + off
  const a = w0 * 1000 + off, b = w1 * 1000 + off;
  const X = M.filter((e) => e.ph === 'X' && e.dur != null && e.ts >= a && e.ts <= b);
  const tasks = X.filter((e) => e.name === 'RunTask' || e.name === 'ThreadControllerImpl::RunTask').sort((x, y) => x.ts - y.ts);
  const top = []; let end = -1; for (const t of tasks) if (t.ts >= end) { top.push(t); end = t.ts + t.dur; }
  const bmf = M.filter((e) => e.name === 'BeginMainThreadFrame' && e.ts >= a && e.ts <= b).map((e) => e.ts).sort((x, y) => x - y);
  const nF = Math.max(0, bmf.length - 1); const wall = new Float64Array(nF), thr = new Float64Array(nF);
  const idx = (ts) => { let lo = 0, hi = bmf.length - 1; if (!bmf.length || ts < bmf[0] || ts >= bmf[hi]) return -1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (bmf[m] <= ts) lo = m; else hi = m; } return lo; };
  for (const t of top) { const i = idx(t.ts); if (i >= 0) { wall[i] += t.dur / 1000; thr[i] += (t.tdur != null ? t.tdur : t.dur) / 1000; } }
  const q = (arr, p) => { const s = [...arr].sort((x, y) => x - y); return s.length ? +s[Math.min(s.length - 1, Math.floor(p * s.length))].toFixed(1) : null; };
  const long = top.filter((t) => t.dur > 50000);
  // rozpad práce v najťažších snímkach (nad p90): súčet trvaní udalostí podľa mena (vnorené sa môžu prekrývať)
  const p90 = [...wall].sort((x, y) => x - y)[Math.floor(0.9 * nF)] || 0;
  const tazke = new Set(); wall.forEach((w, i) => { if (w >= p90) tazke.add(i); });
  const rozpad = {}; const vsetky = {};
  const XS = X.filter((e) => !/RunTask/.test(e.name)).sort((x, y) => x.ts - y.ts);
  const lb = (ts) => { let lo = 0, hi = XS.length; while (lo < hi) { const m = (lo + hi) >> 1; if (XS[m].ts < ts) lo = m + 1; else hi = m; } return lo; };
  for (const t of top) { const i = idx(t.ts); if (i < 0) continue;
    for (let j = lb(t.ts); j < XS.length && XS[j].ts < t.ts + t.dur; j++) { const e = XS[j]; if (e.ts + e.dur <= t.ts + t.dur) {
      vsetky[e.name] = (vsetky[e.name] || 0) + e.dur / 1000; if (tazke.has(i)) rozpad[e.name] = (rozpad[e.name] || 0) + e.dur / 1000; } } }
  const topN = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, 14).map(([k, v]) => [k, +v.toFixed(0)]);
  return { velkostMB: +(velkost / 1e6).toFixed(1), snimok: nF, ulohaSnimkyP50: q(wall, 0.5), ulohaSnimkyP95: q(wall, 0.95), ulohaSnimkyMax: q(wall, 1), vlaknoP95: q(thr, 0.95),
    nad16: +(100 * [...wall].filter((x) => x > 16.7).length / Math.max(1, nF)).toFixed(1), nad50: [...wall].filter((x) => x > 50).length,
    tazkeSnimky: tazke.size, rozpadTazkych: topN(rozpad), rozpadVsetkych: topN(vsetky), dlheUlohy50: long.length, dlheUlohyMs: +(long.reduce((s, t) => s + t.dur, 0) / 1000).toFixed(0), najdlhsiaMs: +(Math.max(0, ...top.map((t) => t.dur)) / 1000).toFixed(0) };
}
const statsRaf = (f, w0, w1) => { const F = f.filter((x) => x >= w0 && x <= w1); const d = []; for (let i = 1; i < F.length; i++) d.push(F[i] - F[i - 1]); d.sort((x, y) => x - y);
  return { n: d.length, p50: d.length ? +d[d.length >> 1].toFixed(1) : null, p95: d.length ? +d[Math.floor(0.95 * d.length)].toFixed(1) : null, nad50: d.filter((x) => x > 50).length }; };
async function tah(cdp, { x = 195, y0 = 720, dy = 480, speed = 1500, fling = true }) {
  const ms = 1000 * dy / speed, n = Math.max(2, Math.round(ms / 16));
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: y0 }] });
  for (let k = 1; k <= n; k++) { const tt = Date.now(); await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: Math.round(y0 - dy * k / n) }] }); const w = 16 - (Date.now() - tt); if (w > 0) await sleep(w); }
  if (!fling) await sleep(150);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

// ---------------- SKROL: 12 švihov + pomalý ťah so stopou, potom až po pätičku ----------------
async function skrol(strom, pk, rep) {
  const prof = PROF[pk]; const name = `skrol-${pk}-${strom}-${rep}`; const la = load();
  const { ctx, page, cdp, net } = await nova(strom, prof);
  await page.goto(base(strom) + (strom === 'predoff' ? '?film=off' : ''), { waitUntil: 'load', timeout: 180000 });
  let pro = 0; for (let i = 0; i < 60 && /\bpro\b/.test(await page.evaluate(() => document.documentElement.className)); i++) { await sleep(500); pro++; }
  await sleep(3000);
  await page.evaluate(() => { window.__f = []; const f = (t) => { window.__f.push(t); requestAnimationFrame(f); }; requestAnimationFrame(f); });
  const stopT = await traceStart(cdp);
  await sleep(100);
  const kotva = await page.evaluate(() => { const t = performance.now(); performance.mark('kotva-stopy'); return t; });
  const w0 = kotva; const y0 = await page.evaluate(() => scrollY);
  for (let i = 0; i < 12; i++) { await tah(cdp, { dy: 480, speed: 1500, fling: true }); await sleep(450); }
  await tah(cdp, { y0: 700, dy: 400, speed: 300, fling: false });
  await sleep(1000);
  const w1 = await page.evaluate(() => performance.now()); const yTrace = await page.evaluate(() => scrollY);
  const raw = await stopT();
  const st = rozborStopy(raw, kotva, w0, w1);
  // až po pätičku (bez stopy), sonda beží ďalej
  let g = 0; for (; g < 150; g++) { const k = await page.evaluate(() => scrollY + innerHeight >= document.documentElement.scrollHeight - 4); if (k) break; await tah(cdp, { dy: 480, speed: 1500, fling: true }); await sleep(350); }
  await sleep(2000);
  const idle = await net.idle(2500, 20000);
  const b = net.snap();
  const s = await page.evaluate(() => ({ ...window.__mOut(), f: window.__f }));
  await ctx.close();
  const loaf = s.loaf.filter((x) => x[0] >= w0 && x[0] <= w1 && x[1] > 50);
  const lt = s.lt.filter((x) => x[0] >= w0 && x[0] <= w1 && x[1] > 50);
  const o = { name, strom, prof: pk, rep, loadavg: la, loadavgPo: load(), proCakanie: pro * 0.5, y: [y0, yTrace, s.y], sh: s.sh, svihovDoPaty: g, okno: +((w1 - w0) / 1000).toFixed(1),
    stopa: st, raf: statsRaf(s.f, w0, w1), loaf50: { n: loaf.length, sucet: +loaf.reduce((a, x) => a + x[1], 0).toFixed(0), max: Math.max(0, ...loaf.map((x) => x[1])), blok: +loaf.reduce((a, x) => a + x[2], 0).toFixed(0) },
    loafPraca50: loaf.filter((x) => x[1] - (x[3] || 0) > 50).length, loafBlok50: loaf.filter((x) => x[2] > 50).length,
    loafRozpad: { predRender: +loaf.reduce((a, x) => a + (x[3] || 0), 0).toFixed(0), renderDoStylu: +loaf.reduce((a, x) => a + (x[4] || 0), 0).toFixed(0), stylAzKoniec: +loaf.reduce((a, x) => a + (x[5] || 0), 0).toFixed(0), skripty: +loaf.reduce((a, x) => a + (x[6] || 0), 0).toFixed(0), naj: loaf.sort((a, b) => b[1] - a[1]).slice(0, 5) },
    longtask50: lt.length, loafErr: s.loafErr, gl: s.gl, maxPlay: s.maxPlay, playAt: s.playAt, vidov: s.vidov, incN: s.incN, inc: s.inc, decWait: s.decWait, cls: s.cls,
    celaStranka: { ...b, idleMs: idle } };
  save(name, o);
  console.log(name, JSON.stringify({ okno: o.okno, y: o.y, stopa: st, raf: o.raf, loaf: o.loaf50, gl: o.gl, play: o.maxPlay, incN: o.incN, MB: (b.bajty / 1e6).toFixed(2), cls: o.cls }));
}

// ---------------- PC: film na počítači, krátky skrol kolieskom ----------------
async function pc(strom, rep) {
  const name = `pc-${strom}-${rep}`; const la = load();
  const { ctx, page, cdp, net } = await nova(strom, null, { desk: true });
  await page.goto(base(strom) + '?uvod=off', { waitUntil: 'load', timeout: 120000 });
  await page.mouse.move(700, 450); await page.mouse.move(720, 470);
  let w = 0; for (; w < 60; w++) { if (await page.evaluate(() => /world-in/.test(document.documentElement.className))) break; await sleep(500); }
  await sleep(3000);
  await page.evaluate(() => { window.__f = []; const f = (t) => { window.__f.push(t); requestAnimationFrame(f); }; requestAnimationFrame(f); });
  const stopT = await traceStart(cdp); await sleep(100);
  const kotva = await page.evaluate(() => { const t = performance.now(); performance.mark('kotva-stopy'); return t; });
  for (let i = 0; i < 15; i++) { await cdp.send('Input.synthesizeScrollGesture', { x: 720, y: 450, yDistance: -420, speed: 2333, gestureSourceType: 'mouse' }); await sleep(450); }
  await sleep(1000);
  const w1 = await page.evaluate(() => performance.now());
  const raw = await stopT(); const st = rozborStopy(raw, kotva, kotva, w1);
  const s = await page.evaluate(() => ({ ...window.__mOut(), f: window.__f }));
  await ctx.close();
  const loaf = s.loaf.filter((x) => x[0] >= kotva && x[0] <= w1 && x[1] > 50);
  const o = { name, strom, rep, loadavg: la, worldInCakanie: w * 0.5, y: s.y, cls: s.cls, gl: s.gl, stopa: st, raf: statsRaf(s.f, kotva, w1), loaf50: { n: loaf.length, sucet: +loaf.reduce((a, x) => a + x[1], 0).toFixed(0), max: Math.max(0, ...loaf.map((x) => x[1])) }, bajty: net.snap().bajty };
  save(name, o);
  console.log(name, JSON.stringify({ y: o.y, stopa: st, raf: o.raf, loaf: o.loaf50, gl: o.gl, cls: o.cls }));
}

// ---------------- BRÁNA ----------------
async function brana() {
  const out = [];
  for (const strom of STR) {
    for (const [lab, o, q] of [['tel-film-on', {}, '?film=on'], ['okno-600x900-mys', { mouse: true, w: 600, h: 900 }, ''], ['tel-obmedzeny-pohyb', { reduced: true }, ''], ['tel-bez-param', {}, '']]) {
      const { ctx, page, cdp } = await nova(strom, null, o);
      await page.goto(base(strom) + q, { waitUntil: 'load', timeout: 120000 });
      if (o.mouse) { await page.mouse.move(300, 450); await page.mouse.move(320, 470); } else await tah(cdp, { dy: 300, speed: 1000 });
      await sleep(6000);
      const s = await page.evaluate(() => ({ ...window.__mOut(), mq: { hoverNone: matchMedia('(hover: none)').matches, coarse: matchMedia('(pointer: coarse)').matches, screen: [screen.width, screen.height] },
        film: !!document.querySelector('canvas.film-canvas'), anim: document.getAnimations().filter((a) => a.playState === 'running').length }));
      await ctx.close();
      const r = { strom, lab, cls: s.cls, gl: s.gl, film: s.film, mq: s.mq, animBezi: s.anim, maxPlay: s.maxPlay };
      out.push(r); console.log(JSON.stringify(r));
    }
  }
  save('brana', out);
}

try {
  if (MODE === 'start') { for (const pk of (opt.prof || 'c4f').split(',')) { console.log('séria', pk, 'loadavg', load()); for (const [s, i] of poradie(+(opt.n || 2))) await start(s, pk, i); } }
  else if (MODE === 'scen') { for (const pk of (opt.prof || 'c4f').split(',')) for (const sc of (opt.sc || 'reload3000,tim,kontakt,spat,en').split(',')) { console.log('séria', sc, pk, 'loadavg', load()); for (const [s, i] of poradie(+(opt.n || 2))) await scen(s, pk, i, sc); } }
  else if (MODE === 'skrol') { for (const pk of (opt.prof || 'c4f').split(',')) { console.log('séria', pk, 'loadavg', load()); for (const [s, i] of poradie(+(opt.n || 3))) await skrol(s, pk, i); } }
  else if (MODE === 'pc') { console.log('séria pc loadavg', load()); for (const [s, i] of poradie(+(opt.n || 2))) await pc(s, i); }
  else if (MODE === 'brana') await brana();
  else console.log('neznámy režim');
} finally { await browser.close(); }
