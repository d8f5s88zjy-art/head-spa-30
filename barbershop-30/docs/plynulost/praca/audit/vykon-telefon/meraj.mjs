#!/usr/bin/env node
/* Meranie plynulosti BARBERSHOP 30 (telefón aj počítač) – znova spustiteľné pred aj po opravách.

   node meraj.mjs --url=http://127.0.0.1:8433/barbershop-30/ \
     [--zariadenie=telefon|pocitac] [--cpu=4] [--siet=fast4g|slow4g|ziadna] [--film=on|off|predvolene] \
     [--fazy=nacitanie,uvod,skrol,prechody] [--skrol=pomaly,stredne,svih,hore] [--stopa=1] [--out=dir] [--meno=...]
     [--vernost=1]   (pri teste vloží do stránky data-zapnute, aby sa prihláška k vernostnej karte otvorila ako s adminom)

   Výstup: <out>/<meno>.json (po fázach a po sekciách stránky) a krátky súhrn na konzolu.
   Fázy:
   1. nacitanie – FCP, LCP (prvok), CLS, dlhé úlohy a TBT (FCP až load + 6 s), čo blokuje (render-blocking zdroje,
      dlhé snímky LoAF s príčinou súbor:riadok), rozdelenie hlavného vlákna z trace.
   2. uvod – úvodný film (prológ, trieda pro) alebo nábeh nadpisu bez filmu: snímky (rAF), dlhé úlohy, dpr filmu.
   3. skrol – celá stránka prstom (Input.dispatchTouchEvent; synthesizeScrollGesture s touch v tomto headless
      Chromiu neposúva, overené probe3.mjs) alebo kolieskom (počítač): krátke ťahy, stredné švihy, rýchly švih,
      rýchly švih späť hore. Pre každý prechod a každú sekciu: časy snímok (p50/p95/max, podiel > 33 ms), dlhé
      úlohy, rozdelenie hlavného vlákna (skript, štýl, layout, paint, dekódovanie, GC, čakanie na GPU),
      WebGL volania na hlavnom vlákne (texSubImage2D, generateMipmap, draw…), vlákno GPU (SwiftShader).
   4. prechody – menu, skok z menu, jazyk, vernostná karta, videá, (film) Späť na ulicu / Vojdi dnu; INP z Event Timing.
   Pozor: kontajner nemá grafickú kartu, WebGL kreslí SwiftShader v procese GPU. Časy snímok s filmom sú preto
   horšie ako na telefóne; práca hlavného vlákna (b) je porovnateľná. */
import { createRequire } from 'module';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');

const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.length ? v.join('=') : '1']; }));
const BASE = opt.url || 'http://127.0.0.1:8433/barbershop-30/';
const DEV = opt.zariadenie === 'pocitac' ? 'pocitac' : 'telefon';
const CPU = Number(opt.cpu || (DEV === 'telefon' ? 4 : 1));
const NET = opt.siet || 'fast4g';
const FILM = opt.film || 'predvolene';
const FAZY = (opt.fazy || 'nacitanie,uvod,skrol,prechody').split(',');
const SKROL = (opt.skrol || 'pomaly,stredne,svih,hore').split(',');
const STOPA = opt.stopa !== '0';
const OUT = path.resolve(opt.out || path.join(path.dirname(new URL(import.meta.url).pathname), 'vysledky'));
const MENO = opt.meno || `${DEV}-cpu${CPU}-film-${FILM}-${NET}`;
fs.mkdirSync(OUT, { recursive: true });

// siete ako v DevTools (prepočítané konštanty Chromu: oneskorenie × 2,75 / 3,75, priepustnosť × 0,9)
const NETS = {
  fast4g: { offline: false, latency: 60 * 2.75, downloadThroughput: 9e6 * 0.9 / 8, uploadThroughput: 1.5e6 * 0.9 / 8 },
  slow4g: { offline: false, latency: 150 * 3.75, downloadThroughput: 1.6e6 * 0.9 / 8, uploadThroughput: 750e3 * 0.9 / 8 },
  ziadna: null,
};
const PHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36' };
const DESK = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 };
const query = FILM === 'on' ? '?film=on' : FILM === 'off' ? '?film=off' : '';
const URLX = BASE + query;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- inštrumentácia v stránke (pred všetkými skriptmi) ---------- */
const INIT = () => {
  const M = window.__vt = { frames: [], lt: [], loaf: [], ls: [], lcp: [], ev: [], paint: [], gl: {}, glT: 0, cls: [], ctx: [], cib: [0, 0, 0], film: [] };
  const now = () => performance.now();
  // WebGL volania na hlavnom vlákne (len ťažké a synchrónne; ostatné by meranie zaťažili)
  const GL = ['texSubImage2D', 'texImage2D', 'texStorage2D', 'generateMipmap', 'drawElements', 'drawArrays', 'clear', 'readPixels', 'getParameter', 'getError',
    'getProgramParameter', 'getShaderParameter', 'getProgramInfoLog', 'getShaderInfoLog', 'getActiveUniform', 'getUniformLocation', 'compileShader', 'linkProgram', 'checkFramebufferStatus', 'finish', 'flush',
    'framebufferTexture2D', 'renderbufferStorageMultisample', 'blitFramebuffer', 'getExtension'];
  // bajty nahraté do textúr (texSubImage2D: šírka × výška × 4; texImage2D zo zdroja: rozmery zdroja × 4)
  M.texB = 0;
  const texBytes = (n, a) => { try { if (n === 'texSubImage2D') { if (a.length >= 9 && typeof a[4] === 'number') return a[4] * a[5] * 4; const src = a[a.length - 1]; return (src.width || 0) * (src.height || 0) * 4; } if (n === 'texImage2D') { const src = a[a.length - 1]; if (a.length >= 9 && typeof a[3] === 'number') return a[3] * a[4] * 4; return src && src.width ? src.width * src.height * 4 : 0; } } catch (e) { /* nič */ } return 0; };
  const wrap = (proto) => { if (!proto) return; for (const n of GL) { const f = proto[n]; if (typeof f !== 'function' || f.__vt) continue; const w = function () { const s = now(); if (n === 'texSubImage2D' || n === 'texImage2D') M.texB += texBytes(n, arguments); try { return f.apply(this, arguments); } finally { const d = now() - s; const g = M.gl[n] || (M.gl[n] = [0, 0, 0]); g[0] += d; g[1]++; if (d > g[2]) g[2] = d; M.glT += d; } }; w.__vt = 1; proto[n] = w; } };
  try { wrap(window.WebGL2RenderingContext && WebGL2RenderingContext.prototype); wrap(window.WebGLRenderingContext && WebGLRenderingContext.prototype); } catch (e) { /* nič */ }
  // vytvorenie grafického kontextu (overenie GPU vo film.js, three)
  try { const gc = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, o) { const s = now(); const r = gc.apply(this, arguments); if (/webgl/.test(t)) M.ctx.push([Math.round(s), +(now() - s).toFixed(1), t, !!r, o ? JSON.stringify(o) : '']); return r; }; } catch (e) { /* nič */ }
  // createImageBitmap: čas od volania po hotový obrázok (dekódovanie mimo hlavného vlákna)
  try { const cib = window.createImageBitmap; window.createImageBitmap = function () { const s = now(); const p = cib.apply(this, arguments); p.then(() => { const d = now() - s; M.cib[0] += d; M.cib[1]++; if (d > M.cib[2]) M.cib[2] = d; }, () => {}); return p; }; } catch (e) { /* nič */ }
  // sekcia v strede okna z IntersectionObserver (počíta sa v rámci snímky, nič nevynúti); čítanie scrollY
  // v rAF alebo v udalosti scroll by pri neaktuálnom štýle vynútilo prepočet a meranie by ho pripísalo sebe
  let sy = 0; M.secNames = []; M.lsT = 0;
  addEventListener('scroll', () => { M.lsT = performance.now(); }, { passive: true, capture: true });
  const startIO = () => {
    const els = [...document.querySelectorAll('section[data-scene], footer')];
    M.secNames = els.map((e) => e.id || e.tagName.toLowerCase());
    try { const io = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) sy = els.indexOf(e.target); }, { rootMargin: '-50% 0px -49% 0px' }); els.forEach((e) => io.observe(e)); } catch (e) { /* nič */ }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startIO); else startIO();
  // snímky: čas, interval, poloha skrolu, WebGL čas na hlavnom vlákne doteraz (ploché pole, žiadne malé objekty na snímku)
  let last = 0;
  const F = M.frames;
  const loop = (t) => { if (last) F.push(+t.toFixed(2), +(t - last).toFixed(2), sy, +M.glT.toFixed(2), M.texB); last = t; requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
  const po = (type, fn, o = {}) => { try { new PerformanceObserver((l) => l.getEntries().forEach(fn)).observe(Object.assign({ type, buffered: true }, o)); } catch (e) { /* nepodporované */ } };
  po('longtask', (e) => M.lt.push([+e.startTime.toFixed(1), +e.duration.toFixed(1), (e.attribution && e.attribution[0] && e.attribution[0].containerType) || '']));
  po('long-animation-frame', (e) => M.loaf.push({ t: +e.startTime.toFixed(1), d: +e.duration.toFixed(1), b: +e.blockingDuration.toFixed(1), r: +(e.renderStart ? e.renderStart - e.startTime : 0).toFixed(1), sl: +(e.styleAndLayoutStart ? e.duration - (e.styleAndLayoutStart - e.startTime) : 0).toFixed(1),
    s: (e.scripts || []).map((x) => ({ inv: String(x.invoker || '').slice(0, 80), typ: x.invokerType, src: x.sourceURL, fn: x.sourceFunctionName, pos: x.sourceCharPosition, d: +x.duration.toFixed(1), fsl: +x.forcedStyleAndLayoutDuration.toFixed(1) })) }));
  po('layout-shift', (e) => { if (!e.hadRecentInput) M.ls.push([+e.startTime.toFixed(1), e.value, (e.sources || []).map((s) => s.node ? (s.node.nodeName + '.' + (s.node.className || '')).slice(0, 60) : '?').join(' | ')]); });
  po('largest-contentful-paint', (e) => M.lcp.push([+e.startTime.toFixed(1), e.size, e.element ? (e.element.nodeName + '.' + String(e.element.className || '').slice(0, 40) + (e.url ? ' ' + e.url.split('/').slice(-2).join('/') : '') + ' ' + String(e.element.textContent || '').trim().slice(0, 40)) : e.url]));
  po('paint', (e) => M.paint.push([e.name, +e.startTime.toFixed(1)]));
  po('event', (e) => { if (e.interactionId) M.ev.push([e.name, +e.startTime.toFixed(1), +e.duration.toFixed(1), e.interactionId, +(e.processingStart - e.startTime).toFixed(1), +(e.processingEnd - e.processingStart).toFixed(1)]); }, { durationThreshold: 16 });
  // triedy na <html> (world, world-in, pro, world-off, world-frame) s časom; <html> ešte nemusí existovať
  const watch = () => { const h = document.documentElement; M.cls.push([Math.round(now()), h.className]); new MutationObserver(() => M.cls.push([Math.round(now()), h.className])).observe(h, { attributes: true, attributeFilter: ['class'] }); };
  if (document.documentElement) watch(); else { const d0 = new MutationObserver(() => { if (document.documentElement) { d0.disconnect(); watch(); } }); d0.observe(document, { childList: true }); }
  // stav filmu raz za sekundu (getter je drahý, preto zriedka)
  setInterval(() => { const f = window.BS30_FILM; if (!f) return; try { const s = f.state; if (s && s.on) M.film.push([Math.round(now()), s.dpr, +(s.S || 0).toFixed(2), s.current, (s.ready || []).filter((x) => x.ready).length, s.frames]); } catch (e) { /* nič */ } }, 1000);
};

/* ---------- pomocné štatistiky ---------- */
const q = (s, p) => s.length ? s[Math.min(s.length - 1, Math.max(0, Math.ceil(p * s.length) - 1))] : null;
function frameStats(dts) {
  if (!dts.length) return null;
  const s = [...dts].sort((a, b) => a - b), sum = dts.reduce((a, b) => a + b, 0);
  const r = (v) => +v.toFixed(1);
  return { snimok: dts.length, fps: r(1000 * dts.length / sum), p50: r(q(s, 0.5)), p95: r(q(s, 0.95)), p99: r(q(s, 0.99)), max: r(s[s.length - 1]),
    podiel33: +(dts.filter((d) => d > 33.4).length / dts.length * 100).toFixed(2), podiel50: +(dts.filter((d) => d > 50).length / dts.length * 100).toFixed(2), nad100: dts.filter((d) => d > 100).length };
}
const ltStats = (lt) => ({ pocet: lt.length, max: lt.length ? Math.max(...lt.map((x) => x[1])) : 0, spolu: +lt.reduce((a, x) => a + x[1], 0).toFixed(0), blokovanie: +lt.reduce((a, x) => a + Math.max(0, x[1] - 50), 0).toFixed(0) });
function inp(ev) {
  const by = new Map();
  for (const e of ev) { const k = e[3]; if (!by.has(k) || by.get(k)[2] < e[2]) by.set(k, e); }
  const arr = [...by.values()].sort((a, b) => b[2] - a[2]);
  return { interakcii: arr.length, inp: arr.length ? arr[0][2] : null, najhorsie: arr.slice(0, 3).map((e) => ({ udalost: e[0], ms: e[2], cakanie: e[4], spracovanie: e[5] })) };
}

/* ---------- zdrojové súbory: pozícia znaku -> riadok (príčina v kóde) ---------- */
const srcCache = new Map();
async function lineOf(url, pos) {
  if (!url || pos == null || pos < 0) return null;
  if (!srcCache.has(url)) { try { const r = await fetch(url); srcCache.set(url, r.ok ? await r.text() : null); } catch (e) { srcCache.set(url, null); } }
  const t = srcCache.get(url); if (!t) return null;
  let line = 1; for (let i = 0; i < Math.min(pos, t.length); i++) if (t.charCodeAt(i) === 10) line++;
  return line;
}
async function loafTop(loaf, from, to) {
  const agg = new Map();
  for (const f of loaf) {
    if (f.t < from || f.t > to) continue;
    if (!f.s.length) { const k = '(bez skriptu: štýl/layout/paint)'; const a = agg.get(k) || { kde: k, ms: 0, n: 0, max: 0, styl: 0 }; a.ms += f.d; a.n++; a.max = Math.max(a.max, f.d); a.styl += f.sl; agg.set(k, a); continue; }
    for (const s of f.s) {
      const file = (s.src || '').split('/').slice(-2).join('/') || s.inv;
      const k = `${file}|${s.fn}|${s.pos}`;
      const a = agg.get(k) || { kde: '', src: s.src, pos: s.pos, fn: s.fn, typ: s.typ, inv: s.inv, ms: 0, n: 0, max: 0, vynutenyStylLayout: 0 };
      a.ms += s.d; a.n++; a.max = Math.max(a.max, s.d); a.vynutenyStylLayout += s.fsl; agg.set(k, a);
    }
  }
  const arr = [...agg.values()].sort((a, b) => b.ms - a.ms).slice(0, 12);
  for (const a of arr) if (!a.kde) { const ln = await lineOf(a.src, a.pos); a.kde = `${(a.src || '').split('/barbershop-30/').pop() || a.inv}${ln ? ':' + ln : ''} ${a.fn || ''} (${a.typ})`.trim(); delete a.src; delete a.pos; }
  return arr.map((a) => ({ ...a, ms: Math.round(a.ms), vynutenyStylLayout: a.vynutenyStylLayout != null ? Math.round(a.vynutenyStylLayout) : undefined }));
}

/* ---------- trace: rozdelenie času vlákien ---------- */
const CATS = (opt.kategorie || 'devtools.timeline,disabled-by-default-devtools.timeline.frame,blink.user_timing,toplevel,gpu,v8.execute,loading,cc,blink').split(',');
async function traceStart(cdp) {
  if (!STOPA) return;
  await cdp.send('Tracing.start', { traceConfig: { includedCategories: CATS, excludedCategories: ['*'], recordMode: 'recordAsMuchAsPossible' }, transferMode: 'ReturnAsStream', streamFormat: 'json', bufferUsageReportingInterval: 0 });
}
async function traceStop(cdp, nazov) {
  if (!STOPA) return null;
  const done = new Promise((r) => cdp.once('Tracing.tracingComplete', r));
  await cdp.send('Tracing.end');
  const { stream } = await done;
  const parts = []; let size = 0;
  for (;;) {
    const r = await cdp.send('IO.read', { handle: stream, size: 8 << 20 });
    const buf = r.base64Encoded ? Buffer.from(r.data, 'base64') : Buffer.from(r.data, 'utf8');
    parts.push(buf); size += buf.length;
    if (r.eof) break;
  }
  await cdp.send('IO.close', { handle: stream });
  const all = Buffer.concat(parts);
  if (opt.ulozStopu === '1' && nazov) fs.writeFileSync(path.join(OUT, `${MENO}-${nazov}.trace.json`), all);
  const txt = all.toString('utf8');
  const j = JSON.parse(txt);
  return { events: Array.isArray(j) ? j : j.traceEvents, bytes: size };
}
const KAT = (n) => {
  // poradie je dôležité: najprv čakania, potom konkrétne fázy snímky
  if (/WaitForCommitCompletion|WaitForActivation|Commit::Wait/.test(n)) return 'cakanie-kompozitor';
  if (/^(FunctionCall|EvaluateScript|v8\.|V8\.Execute|V8\.Run|RunMicrotasks|TimerFire|FireAnimationFrame|EventDispatch|FireIdleCallback|HandlePostMessage|XHR|ProfileCall|V8\.Compile|V8\.Deserialize|V8\.Deopt|V8\.Stack|V8\.Script|V8\.Bytecode|PageAnimator::serviceScriptedAnimations|BlinkScheduler_PerformMicrotaskCheckpoint)/.test(n)) return 'skript';
  if (/GC|Sweep|Marking|Scavenge/i.test(n)) return 'gc';
  if (/^(UpdateLayoutTree|RecalculateStyles|ParseAuthorStyleSheet|StyleRecalc|Document::updateStyle|Document::recalcStyle|StyleEngine|Document::UpdateStyle)/.test(n)) return 'styl';
  if (/^(AnimationTimeline|AnimationHost|DocumentAnimations|Animation::|CSSAnimations|ElementAnimations)/.test(n)) return 'animacie-css';
  if (/^(Layout|UpdateLayerTree|IntersectionObserver|ComputeIntersections|LayoutShift|LocalFrameView::RunPostLifecycle|LocalFrameView::performLayout|LocalFrameView::UpdateStyleAndLayout|HitTest)/.test(n)) return 'layout';
  if (/^(Paint|PrePaint|PaintImage|Layerize|UpdateLayer|Commit|CompositeLayers|PaintSetup|ScrollLayer|LocalFrameView::RunPaint|PaintArtifact|Blink\.(PrePaint|Paint|CompositingInputs|Compositing)|PaintController|GraphicsLayer|cc::|LayerTreeHost::(UpdateLayers|DoUpdateLayers|BuildPropertyTrees|FinishCommit))/.test(n)) return 'paint';
  if (/Decode|ImageBitmap|ImageDecoder/i.test(n)) return 'dekodovanie';
  if (/^(ParseHTML|ResourceSend|ResourceReceive|ResourceFinish|ResourceChange|ResponseBodyLoader|Receive mojo|SimpleWatcher|URLLoader)/.test(n)) return 'html-siet-ipc';
  if (/Wait|Sync|Flush|Finish|GpuChannel|CommandBuffer|SharedImage|CHROMIUM/i.test(n)) return 'gpu-cakanie';
  if (/^(ProxyMain::BeginMainFrame|WebFrameWidgetImpl::UpdateLifecycle|LocalFrameView::ScheduleAnimation|WidgetBase::|PageWidgetDelegate)/.test(n)) return 'snimka-ostatne';
  return 'ine';
};
function analyzeTrace(tr, syncName, syncPerf, spans) {
  // spans: [{ meno, od, do (ms v čase stránky) , sekciaOf(tPerf) }]
  const ev = tr.events;
  const names = new Map(); // pid:tid -> thread name
  const pnames = new Map();
  for (const e of ev) { if (e.ph === 'M' && e.name === 'thread_name') names.set(e.pid + ':' + e.tid, e.args.name); if (e.ph === 'M' && e.name === 'process_name') pnames.set(e.pid, e.args.name); }
  // synchronizácia hodín: značka performance.mark v trace
  const mark = ev.find((e) => e.name === syncName && (e.cat || '').includes('blink.user_timing'));
  const off = mark ? mark.ts / 1000 - syncPerf : null;   // trace ms = perf ms + off
  const rendererPid = mark ? mark.pid : null;
  // udalosti s trvaním: X priamo, B/E spárované
  const byThread = new Map();
  const open = new Map();
  for (const e of ev) {
    if (e.ph === 'X' && e.dur != null) { const k = e.pid + ':' + e.tid; (byThread.get(k) || byThread.set(k, []).get(k)).push({ n: e.name, ts: e.ts / 1000, d: e.dur / 1000, a: e.args }); }
    else if (e.ph === 'B') { const k = e.pid + ':' + e.tid; (open.get(k) || open.set(k, []).get(k)).push(e); }
    else if (e.ph === 'E') { const k = e.pid + ':' + e.tid, st = open.get(k); const b = st && st.pop(); if (b) (byThread.get(k) || byThread.set(k, []).get(k)).push({ n: b.name, ts: b.ts / 1000, d: (e.ts - b.ts) / 1000, a: b.args }); }
  }
  const res = { offsetOk: off != null, vlakna: {}, hlavne: {} };
  if (off == null) return res;
  // self time a hĺbka 0 (zaneprázdnenie vlákna)
  const selfOf = (list) => {
    list.sort((a, b) => a.ts - b.ts || b.d - a.d);
    const st = [];
    for (const x of list) {
      x.self = x.d; x.end = x.ts + x.d;
      while (st.length && st[st.length - 1].end <= x.ts + 1e-6) st.pop();
      x.depth = st.length;
      if (st.length) { const p = st[st.length - 1]; p.self -= Math.min(x.d, Math.max(0, p.end - x.ts)); x.par = p; }
      st.push(x);
    }
    return list;
  };
  const spanOf = (t) => { for (const s of spans) if (t >= s.od && t < s.do) return s; return null; };
  for (const [k, list] of byThread) {
    const pid = Number(k.split(':')[0]);
    const tn = names.get(k) || '?', pn = pnames.get(pid) || '?';
    const isMain = pid === rendererPid && tn === 'CrRendererMain';
    const isGpu = /GPU/i.test(pn) && (tn === 'CrGpuMain' || /Viz|Gpu/.test(tn));
    const isRenderer = pid === rendererPid;
    if (!isMain && !isGpu && !isRenderer) continue;
    selfOf(list);
    for (const sp of spans) {
      const lo = sp.od + off, hi = sp.do + off;
      let busy = 0;
      for (const x of list) if (x.depth === 0 && x.end > lo && x.ts < hi) busy += Math.min(x.end, hi) - Math.max(x.ts, lo);
      const key = `${pn.replace(/ Process$/, '')}/${tn}`;
      const v = (res.vlakna[sp.meno] || (res.vlakna[sp.meno] = {}));
      v[key] = +((v[key] || 0) + busy).toFixed(1);
    }
    if (!isMain) continue;
    // hlavné vlákno: self time podľa kategórie, po úsekoch a po sekciách stránky
    for (const x of list) {
      const t = x.ts - off; const sp = spanOf(t); if (!sp) continue;
      const sek = sp.sekciaOf ? sp.sekciaOf(t) : '-';
      const kat = KAT(x.n);
      const H = res.hlavne[sp.meno] || (res.hlavne[sp.meno] = { kat: {}, sekcie: {}, mena: {}, vstupy: {}, ulohy: {} });
      H.kat[kat] = (H.kat[kat] || 0) + x.self;
      const S = H.sekcie[sek] || (H.sekcie[sek] = {}); S[kat] = (S[kat] || 0) + x.self;
      H.mena[x.n] = (H.mena[x.n] || 0) + x.self;
      if (x.n === 'UpdateLayoutTree' && x.a && x.a.elementCount) { H.prvkov = (H.prvkov || 0) + x.a.elementCount; const S2 = H.prvkySek || (H.prvkySek = {}); S2[sek] = (S2[sek] || 0) + x.a.elementCount; }
      // úlohy s veľkým vlastným časom: kto ich poslal (toplevel: src_file/src_func)
      if (/RunTask/.test(x.n) && x.self > 4) { const k = x.a && (x.a.src_func || x.a.src_file) ? `${String(x.a.src_file || '').split('/').slice(-2).join('/')}:${x.a.src_func || ''}` : '?'; H.ulohy[k] = (H.ulohy[k] || 0) + x.self; }
      // vstupné body skriptu (celý čas podstromu podľa súboru a funkcie)
      if ((x.n === 'FunctionCall' || x.n === 'EvaluateScript' || x.n === 'v8.evaluateModule') && !(x.par && /FunctionCall|EvaluateScript|v8\.evaluateModule/.test(x.par.n))) {
        const dd = (x.a && x.a.data) || {};
        const u = String(dd.url || dd.scriptName || '').split('/barbershop-30/').pop() || '?';
        const key = `${u}:${dd.lineNumber != null ? dd.lineNumber + (x.n === 'FunctionCall' ? 1 : 0) : '?'} ${dd.functionName || ''}`.trim();
        H.vstupy[key] = (H.vstupy[key] || 0) + x.d;
      }
    }
  }
  // práca hlavného vlákna na snímku (bez čakania na kompozítor a GPU): rozdelenie podľa intervalov rAF
  for (const [k, list] of byThread) {
    const pid = Number(k.split(':')[0]);
    if (!(pid === rendererPid && names.get(k) === 'CrRendererMain')) continue;
    for (const sp of spans) {
      if (!sp.fr || sp.fr.length < 2) continue;
      const st = sp.fr.map((t) => t + off), work = new Float64Array(st.length), sec = sp.frSek || [];
      for (const x of list) {
        if (x.ts < st[0] || x.ts >= st[st.length - 1]) continue;
        const kat = KAT(x.n); if (kat === 'cakanie-kompozitor' || kat === 'gpu-cakanie') continue;
        let lo = 0, hi = st.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (st[m] <= x.ts) lo = m; else hi = m - 1; }
        work[lo] += x.self;
      }
      const H = res.hlavne[sp.meno] || (res.hlavne[sp.meno] = { kat: {}, sekcie: {}, mena: {}, vstupy: {}, ulohy: {} });
      const stat = (arr) => { const a = [...arr].sort((p, q) => p - q); if (!a.length) return null; const qq = (p) => a[Math.min(a.length - 1, Math.max(0, Math.ceil(p * a.length) - 1))]; return { snimok: a.length, p50: +qq(0.5).toFixed(1), p95: +qq(0.95).toFixed(1), max: +a[a.length - 1].toFixed(1), nad16: +(a.filter((v) => v > 16.7).length / a.length * 100).toFixed(1), nad50: a.filter((v) => v > 50).length }; };
      H.pracaNaSnimku = stat(work.slice(0, -1));
      const bs = {}; for (let i = 0; i < work.length - 1; i++) { const s2 = sec[i] || '-'; (bs[s2] || (bs[s2] = [])).push(work[i]); }
      H.pracaNaSnimkuSekcie = Object.fromEntries(Object.entries(bs).map(([s2, a]) => [s2, stat(a)]));
    }
  }
  for (const H of Object.values(res.hlavne)) {
    const r1 = (o) => Object.fromEntries(Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, +v.toFixed(1)]));
    H.kat = r1(H.kat);
    for (const s of Object.keys(H.sekcie)) H.sekcie[s] = r1(H.sekcie[s]);
    H.mena = Object.fromEntries(Object.entries(r1(H.mena)).slice(0, 25));
    H.vstupy = Object.fromEntries(Object.entries(r1(H.vstupy)).slice(0, 15));
    H.ulohy = Object.fromEntries(Object.entries(r1(H.ulohy)).slice(0, 12));
  }
  // rámce kompozítora (ak sú): zahodené a čiastočné snímky
  const pr = ev.filter((e) => e.name === 'PipelineReporter' && e.ph === 'b' && e.args && e.args.chrome_frame_reporter);
  if (pr.length) {
    const st = {}; for (const e of pr) { const s = e.args.chrome_frame_reporter.state || '?'; st[s] = (st[s] || 0) + 1; }
    res.kompozitor = st;
  }
  return res;
}

/* ---------- gestá ---------- */
async function swipe(cdp, { y0, dist, ms, hold = 0, x = 195 }) {
  // dist > 0: prst ide hore = stránka ide dole
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: y0 }] });
  const t0 = Date.now(); let y = y0;
  for (;;) {
    const e = Math.min(1, (Date.now() - t0) / ms);
    y = y0 - dist * e;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] });
    if (e >= 1) break;
    await sleep(8);
  }
  if (hold) { await sleep(hold); await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] }); }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}
const PROFIL = {
  // krátky ťah prstom bez zotrvačnosti (prst sa na konci zastaví)
  pomaly: { dist: 300, ms: 450, hold: 80, gap: 250 },
  // stredný švih (asi 2 300 px/s) so zotrvačnosťou
  stredne: { dist: 420, ms: 180, hold: 0, gap: 500 },
  // rýchly švih (asi 7 000 px/s), dlhá zotrvačnosť
  svih: { dist: 560, ms: 80, hold: 0, gap: 0, settle: true },
};
async function waitSettle(page, max = 4000) {
  // skrol stojí, keď 300 ms nepríde udalosť scroll (bez čítania polohy, ktoré by vynútilo prepočet)
  const t0 = Date.now();
  await sleep(120);
  while (Date.now() - t0 < max) { const q = await page.evaluate(() => performance.now() - (window.__vt.lsT || 0)); if (q > 300) break; await sleep(80); }
}
const MAXPASS = Number(opt.maxPass || 300) * 1000;   // najdlhší prechod (pri softvérovom kreslení filmu)
async function passPhone(page, cdp, prof, up = false) {
  const P = PROFIL[prof];
  const maxY = await page.evaluate(() => document.scrollingElement.scrollHeight - innerHeight);
  let n = 0; const tp = Date.now();
  for (; n < 140 && Date.now() - tp < MAXPASS; n++) {
    const y = await page.evaluate(() => scrollY);
    if (!up && y >= maxY - 4) break;
    if (up && y <= 8) break;
    await swipe(cdp, up ? { y0: 160, dist: -P.dist, ms: P.ms, hold: P.hold } : { y0: 700, dist: P.dist, ms: P.ms, hold: P.hold });
    if (P.settle) await waitSettle(page, 4000); else await sleep(P.gap);
  }
  await waitSettle(page, 3000);
  return n;
}
async function passDesk(page, prof, up = false) {
  const maxY = await page.evaluate(() => document.scrollingElement.scrollHeight - innerHeight);
  await page.mouse.move(720, 450);
  const W = { pomaly: { d: 100, gap: 180 }, stredne: { d: 100, gap: 45 }, svih: { d: 160, gap: 16 } }[prof];
  let n = 0; const tp = Date.now();
  for (; n < 2000 && Date.now() - tp < MAXPASS; n++) {
    const y = await page.evaluate(() => scrollY);
    if (!up && y >= maxY - 4) break;
    if (up && y <= 8) break;
    await page.mouse.wheel(0, up ? -W.d : W.d);
    await sleep(W.gap);
  }
  await waitSettle(page, 3000);
  return n;
}

/* ---------- beh ---------- */
const load1 = os.loadavg();
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext(Object.assign({ colorScheme: 'dark', locale: 'sk-SK' }, DEV === 'telefon' ? PHONE : DESK));
await ctx.addInitScript(INIT);
// pokus A/B bez zmeny repozitára: --css="pravidlá" sa vloží do stránky (napr. vypnúť backdrop-filter a overiť príčinu)
if (opt.css) await ctx.addInitScript((css) => { const put = () => { const st = document.createElement('style'); st.textContent = css; document.head.append(st); }; if (document.head) put(); else document.addEventListener('DOMContentLoaded', put); }, opt.css);
if (opt.vernost === '1') {
  // prihláška k vernostnej karte ako po nasadení s adminom (data-zapnute): atribút sa doplní skriptu vernost.js pri
  // jeho vložení do stránky (pred spustením, je defer). Nie cez page.route – zachytávanie vypína HTTP cache
  // prehliadača a film by pri návrate k záberu sťahoval fotky znova (skreslilo by to sieť aj čierne okná).
  await ctx.addInitScript(() => { const mo = new MutationObserver((ms) => { for (const m of ms) for (const n of m.addedNodes) if (n.tagName === 'SCRIPT' && /vernost\.js/.test(n.src || n.getAttribute('src') || '')) { n.setAttribute('data-zapnute', ''); mo.disconnect(); } }); mo.observe(document, { childList: true, subtree: true }); });
}
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 200)); });
const cdp = await ctx.newCDPSession(page);
await cdp.send('Network.enable');
if (NETS[NET]) await cdp.send('Network.emulateNetworkConditions', NETS[NET]);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
const out = { meta: { meno: MENO, url: URLX, css: opt.css || null, zariadenie: DEV, cpu: CPU, siet: NET, film: FILM, cas: new Date().toISOString(), zataz: load1.map((x) => +x.toFixed(2)), prehliadac: browser.version(), poznamka: 'WebGL beží softvérovo (SwiftShader, proces GPU); hlavné vlákno je porovnateľné, kreslenie GPU nie.' } };
const perfNow = () => page.evaluate(() => performance.now());
const mark = async (name) => page.evaluate((n) => { performance.mark(n); return performance.getEntriesByName(n).pop().startTime; }, name);
let sections = [];
const measureSections = () => page.evaluate(() => [...document.querySelectorAll('section[data-scene], footer')].map((e) => { const r = e.getBoundingClientRect(); return { id: e.id || e.tagName.toLowerCase(), top: Math.round(r.top + scrollY), bottom: Math.round(r.bottom + scrollY) }; }));
const vh = DEV === 'telefon' ? 844 : 900;
let SECN = [];
const secOfY = (i) => SECN[i] || '-';   // v zázname snímok je index sekcie v strede okna (IntersectionObserver), nie poloha
const M = async () => { const m = await page.evaluate(() => window.__vt); SECN = m.secNames || SECN; const f = m.frames, fr = []; for (let i = 0; i + 4 < f.length; i += 5) fr.push([f[i], f[i + 1], f[i + 2], f[i + 3], f[i + 4]]); m.frames = fr; return m; };
// poloha skrolu v čase (z rAF záznamu) pre priradenie dlhých úloh a trace k sekcii
function yAt(frames, t) { let lo = 0, hi = frames.length - 1; if (hi < 0) return 0; if (t <= frames[0][0]) return frames[0][2]; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (frames[m][0] <= t) lo = m; else hi = m - 1; } return frames[lo][2]; }

try {
  /* 1. načítanie */
  const t0wall = Date.now();
  if (FAZY.includes('nacitanie')) await traceStart(cdp);
  await page.goto(URLX, { waitUntil: 'commit', timeout: 120000 });
  const syncL = await mark('vt-sync-nacitanie').catch(() => null);
  await page.waitForLoadState('load', { timeout: 120000 });
  const loadAt = await page.evaluate(() => performance.timing.loadEventStart - performance.timing.navigationStart);
  // úvodný film beží po načítaní: počkať na jeho koniec (trieda pro zmizne) alebo 6 s po load
  const proStart = await page.evaluate(() => document.documentElement.classList.contains('pro'));
  const tEnd = Date.now() + (proStart ? 30000 : 6000);
  while (Date.now() < tEnd) { const s = await page.evaluate(() => ({ pro: document.documentElement.classList.contains('pro'), off: document.documentElement.classList.contains('world-off') })); if (proStart && (!s.pro || s.off)) break; await sleep(250); }
  await sleep(proStart ? 1500 : 0);
  const loadEndPerf = await perfNow();
  const trL = FAZY.includes('nacitanie') ? await traceStop(cdp, 'nacitanie') : null;
  let m = await M();
  sections = await measureSections();
  out.meta.sekcie = sections;
  out.meta.vyskaStranky = await page.evaluate(() => document.scrollingElement.scrollHeight);
  const fcp = (m.paint.find((p) => p[0] === 'first-contentful-paint') || [])[1] || null;
  const lcp = m.lcp.length ? m.lcp[m.lcp.length - 1] : null;
  const res = await page.evaluate(() => performance.getEntriesByType('resource').map((r) => ({ u: r.name.split('/barbershop-30/').pop(), t: r.initiatorType, b: r.renderBlockingStatus, s: Math.round(r.startTime), d: Math.round(r.duration), kb: Math.round((r.transferSize || r.encodedBodySize || 0) / 1024) })));
  const ltL = m.lt.filter((x) => x[0] <= loadEndPerf);
  const tbtWin = m.lt.filter((x) => fcp != null && x[0] >= fcp && x[0] <= loadAt + 6000);
  out.nacitanie = {
    fcp, lcp: lcp ? lcp[0] : null, lcpPrvok: lcp ? lcp[2] : null, load: loadAt, trvanieMerania: Date.now() - t0wall,
    cls: +m.ls.reduce((a, x) => a + x[1], 0).toFixed(4), posuny: m.ls.slice(0, 5),
    tbt: Math.round(tbtWin.reduce((a, x) => a + Math.max(0, x[1] - 50), 0)), dlheUlohy: ltL.map((x) => [Math.round(x[0]), Math.round(x[1])]),
    blokujuceZdroje: res.filter((r) => r.b === 'blocking'),
    zdrojeDoLCP: res.filter((r) => lcp && r.s < lcp[0]).slice(0, 30),
    prenesenoKB: res.reduce((a, r) => a + r.kb, 0), zdrojov: res.length,
    triedy: m.cls.map((c) => [c[0], c[1]]),
    webglKontext: m.ctx,
    loaf: await loafTop(m.loaf, 0, loadEndPerf),
    film: m.film.slice(0, 40),
  };
  if (trL && syncL != null) {
    out.nacitanie.stopaMB = +(trL.bytes / 1e6).toFixed(1);
    const frL = m.frames.filter((f) => f[0] <= loadEndPerf);
    const a = analyzeTrace(trL, 'vt-sync-nacitanie', syncL, [{ meno: 'nacitanie', od: 0, do: loadEndPerf, fr: frL.map((f) => f[0]), frSek: frL.map(() => 'nacitanie') }]);
    out.nacitanie.vlakno = a.hlavne.nacitanie; out.nacitanie.vlakna = a.vlakna.nacitanie;
  }

  /* 2. úvod: úvodný film (prológ) alebo nábeh úvodu bez filmu */
  if (FAZY.includes('uvod')) {
    const cl = m.cls;
    const proOn = cl.find((c) => /\bpro\b/.test(c[1])) || (proStart ? [0] : null);
    const proOff = proOn ? cl.find((c) => c[0] > proOn[0] && !/\bpro\b/.test(c[1])) : null;
    const worldIn = cl.find((c) => /world-in/.test(c[1]));
    const od = fcp || 0, po = proOff ? proOff[0] : Math.min(loadEndPerf, (fcp || 0) + 4000);
    const fr = m.frames.filter((f) => f[0] >= od && f[0] <= po);
    out.uvod = {
      prolog: !!proOn, prvySnimokFilmu: worldIn ? worldIn[0] : null, koniecProlog: proOff ? proOff[0] : null, okno: [Math.round(od), Math.round(po)],
      snimky: frameStats(fr.map((f) => f[1])), dlheUlohy: ltStats(m.lt.filter((x) => x[0] >= od && x[0] <= po)),
      glNaHlavnomVlakneMs: fr.length ? +(fr[fr.length - 1][3] - fr[0][3]).toFixed(1) : 0,
      dpr: m.film.filter((f) => f[0] <= po).map((f) => [f[0], f[1]]),
      loaf: await loafTop(m.loaf, od, po),
    };
    if (proOn && worldIn) {
      // samotný film úvodu: od prvého snímku filmu po koniec prológu
      const fr2 = m.frames.filter((f) => f[0] >= worldIn[0] && f[0] <= po);
      out.uvod.snimkyFilmu = frameStats(fr2.map((f) => f[1]));
    }
  }

  /* 3. skrol celou stránkou */
  if (FAZY.includes('skrol')) {
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    await sleep(1500);
    sections = await measureSections();
    out.meta.sekcie = sections;
    const spans = [], traces = [];
    const passes = SKROL.filter((p) => p !== 'hore').map((p) => [p, false]);
    if (SKROL.includes('hore')) passes.push(['hore', true]);
    for (const [p, up] of passes) {
      // každý prechod má vlastnú stopu (celá by presiahla limit reťazca v Node)
      if (spans.length && !up) { await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' })); await sleep(2000); }
      await traceStart(cdp);
      const sync = await mark('vt-sync-' + p);
      const od = await perfNow();
      const n = DEV === 'telefon' ? await passPhone(page, cdp, up ? 'svih' : p, up) : await passDesk(page, up ? 'svih' : p, up);
      const sp = { meno: p, od, do: await perfNow(), gest: n, koniecY: await page.evaluate(() => scrollY) };
      spans.push(sp);
      const tr = await traceStop(cdp, p);
      if (tr) {
        const mm = await M();
        const frs = mm.frames.filter((f) => f[0] >= sp.od && f[0] <= sp.do);
        sp.fr = frs.map((f) => f[0]); sp.frSek = frs.map((f) => secOfY(f[2]));
        sp.sekciaOf = (t) => secOfY(yAt(mm.frames, t));
        traces.push({ meno: p, a: analyzeTrace(tr, 'vt-sync-' + p, sync, [sp]), mb: +(tr.bytes / 1e6).toFixed(1) });
      }
    }
    m = await M();
    for (const sp of spans) sp.sekciaOf = (t) => secOfY(yAt(m.frames, t));
    const tr = traces.length ? { bytes: traces.reduce((a, t) => a + t.mb * 1e6, 0) } : null;
    const merged = { hlavne: {}, vlakna: {}, kompozitor: {} };
    for (const t of traces) { Object.assign(merged.hlavne, t.a.hlavne); Object.assign(merged.vlakna, t.a.vlakna); if (t.a.kompozitor) merged.kompozitor[t.meno] = t.a.kompozitor; }
    out.skrol = { prechody: {}, sekcie: {} };
    const allBySec = {};
    for (const sp of spans) {
      const fr = m.frames.filter((f) => f[0] >= sp.od && f[0] <= sp.do);
      const lt = m.lt.filter((x) => x[0] >= sp.od && x[0] <= sp.do);
      const bySec = {};
      for (const f of fr) { const s = secOfY(f[2]); (bySec[s] || (bySec[s] = [])).push(f); (allBySec[s] || (allBySec[s] = [])).push(f); }
      const ltBy = {}; for (const x of lt) { const s = secOfY(yAt(m.frames, x[0])); (ltBy[s] || (ltBy[s] = [])).push(x); }
      out.skrol.prechody[sp.meno] = {
        gest: sp.gest, koniecY: sp.koniecY, trvanieS: +((sp.do - sp.od) / 1000).toFixed(1), snimky: frameStats(fr.map((f) => f[1])), dlheUlohy: ltStats(lt),
        glMsNaSnimku: fr.length ? +((fr[fr.length - 1][3] - fr[0][3]) / fr.length).toFixed(2) : 0,
        texturyMB: fr.length ? +((fr[fr.length - 1][4] - fr[0][4]) / 1e6).toFixed(1) : 0,
        texturyMaxMBNaSnimku: fr.length ? +(Math.max(0, ...fr.slice(1).map((f, i) => f[4] - fr[i][4])) / 1e6).toFixed(2) : 0,
        sekcie: Object.fromEntries(sections.map((s) => s.id).filter((id) => bySec[id]).map((id) => {
          const f = bySec[id];
          let gl = 0; for (let i = 1; i < f.length; i++) { const dg = f[i][3] - f[i - 1][3]; if (dg > 0 && dg < 1000) gl += dg; }
          let tb = 0; for (let i = 1; i < f.length; i++) { const db = f[i][4] - f[i - 1][4]; if (db > 0) tb += db; }
          return [id, { snimky: frameStats(f.map((x) => x[1])), dlheUlohy: ltStats(ltBy[id] || []), glMsNaSnimku: +(gl / f.length).toFixed(2), texturyMB: +(tb / 1e6).toFixed(1) }];
        })),
        loaf: await loafTop(m.loaf, sp.od, sp.do),
      };
    }
    out.skrol.sekcie = Object.fromEntries(sections.map((s) => s.id).filter((id) => allBySec[id]).map((id) => [id, frameStats(allBySec[id].map((x) => x[1]))]));
    const glNow = await page.evaluate(() => window.__vt.gl);
    out.skrol.webglVolania = Object.fromEntries(Object.entries(glNow).sort((a, b) => b[1][0] - a[1][0]).slice(0, 12).map(([k, v]) => [k, { ms: Math.round(v[0]), pocet: v[1], max: +v[2].toFixed(1) }]));
    out.skrol.createImageBitmap = { pocet: m.cib[1], priemerMs: m.cib[1] ? Math.round(m.cib[0] / m.cib[1]) : 0, maxMs: Math.round(m.cib[2]) };
    out.skrol.film = m.film.filter((f) => f[0] >= spans[0].od).map((f) => [f[0], f[1], f[3]]);
    out.skrol.cls = +m.ls.filter((x) => x[0] >= spans[0].od).reduce((a, x) => a + x[1], 0).toFixed(4);
    if (tr) {
      const a = merged;
      out.skrol.stopaMB = traces.map((t) => t.mb);
      out.skrol.vlakno = a.hlavne; out.skrol.vlakna = a.vlakna; out.skrol.kompozitor = a.kompozitor;
      // prvkov v prepočte štýlu na snímku (stovky = premenná alebo trieda na koreni)
      out.skrol.prvkovStyluNaSnimku = Object.fromEntries(spans.map((sp) => { const H = a.hlavne[sp.meno]; const fr = m.frames.filter((f) => f[0] >= sp.od && f[0] <= sp.do).length; return [sp.meno, H && H.prvkov ? Math.round(H.prvkov / Math.max(1, fr)) : 0]; }));
      // ms hlavného vlákna na snímku po sekciách (súčet prechodov)
      const perSec = {};
      for (const sp of spans) {
        const H = a.hlavne[sp.meno]; if (!H) continue;
        const fr = m.frames.filter((f) => f[0] >= sp.od && f[0] <= sp.do);
        const cnt = {}; for (const f of fr) { const s = secOfY(f[2]); cnt[s] = (cnt[s] || 0) + 1; }
        for (const [s, kat] of Object.entries(H.sekcie)) {
          const P = perSec[s] || (perSec[s] = { snimok: 0, kat: {} });
          for (const [k, v] of Object.entries(kat)) P.kat[k] = (P.kat[k] || 0) + v;
        }
        for (const [s, c] of Object.entries(cnt)) (perSec[s] || (perSec[s] = { snimok: 0, kat: {} })).snimok += c;
      }
      out.skrol.hlavneVlaknoMsNaSnimku = Object.fromEntries(Object.entries(perSec).map(([s, P]) => {
        const spolu = Object.values(P.kat).reduce((a, b) => a + b, 0);
        return [s, { spolu: +(spolu / Math.max(1, P.snimok)).toFixed(2), ...Object.fromEntries(Object.entries(P.kat).sort((x, y) => y[1] - x[1]).map(([k, v]) => [k, +(v / Math.max(1, P.snimok)).toFixed(2)])) }];
      }));
    }
  }

  /* 4. prechody */
  if (FAZY.includes('prechody')) {
    out.prechody = {};
    const win = async (meno, fn, dwell = 1500) => {
      const od = await perfNow(); const evN = (await M()).ev.length;
      let info = null;
      try { info = await fn(); } catch (e) { info = { chyba: e.message.slice(0, 160) }; }
      await sleep(dwell);
      const po = await perfNow(); const mm = await M();
      const fr = mm.frames.filter((f) => f[0] >= od && f[0] <= po);
      out.prechody[meno] = { ...(info || {}), snimky: frameStats(fr.map((f) => f[1])), dlheUlohy: ltStats(mm.lt.filter((x) => x[0] >= od && x[0] <= po)), interakcie: inp(mm.ev.slice(evN)), loaf: await loafTop(mm.loaf, od, po) };
    };
    const tap = async (sel) => { const el = await page.$(sel); if (!el) return { chyba: 'chýba ' + sel }; const b = await el.boundingBox(); if (!b) return { chyba: 'neviditeľné ' + sel }; await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2); return null; };
    const click = async (sel) => { const el = await page.$(sel); if (!el) return { chyba: 'chýba ' + sel }; await el.click({ timeout: 5000 }); return null; };
    const press = DEV === 'telefon' ? tap : click;
    await page.evaluate(() => scrollTo({ top: Math.round(innerHeight * 3.2), behavior: 'instant' }));
    await sleep(2500);
    if (DEV === 'telefon') {
      await win('menuOtvor', () => press('.nav-toggle'), 1200);
      await win('menuZavri', () => press('.nav-toggle'), 1200);
      // skok z menu do vzdialenej časti (Služby): film musí ukázať záber, nie šero
      await press('.nav-toggle'); await sleep(900);
      await win('skokZMenu', async () => { const r = await press('#nav a[href="#sluzby"]'); return r; }, 3000);
      // jazyk: prepínač je v menu (i18n.js sa načíta po prvom geste)
      await press('.nav-toggle'); await sleep(1200);
      await win('jazykEN', () => press('[data-lang-pick="en"]'), 2500);
      await win('jazykSK', () => press('[data-lang-pick="sk"]'), 2500);
      await press('.nav-toggle'); await sleep(800);
    } else {
      await win('skokZMenu', () => press('.nav a[href="#sluzby"]'), 3000);
      await page.mouse.move(700, 400); await sleep(300);
      await win('jazykOtvor', () => press('.lang-btn'), 800);
      await win('jazykEN', () => press('[data-lang-pick="en"]'), 2500);
      await press('.lang-btn'); await sleep(400);
      await win('jazykSK', () => press('[data-lang-pick="sk"]'), 2500);
    }
    // videá: pás tímu (video tím v akcii) a pri filme zábery so sekvenciou
    await win('videoTim', async () => { await page.evaluate(() => { const v = document.querySelector('.band-team video, video[data-video]'); if (v) v.scrollIntoView({ block: 'center', behavior: 'instant' }); }); return { video: await page.evaluate(() => { const v = document.querySelector('.band-team video, video[data-video]'); return v ? { paused: v.paused, rs: v.readyState } : null; }) }; }, 3000);
    out.prechody.videoTim.poPrehravani = await page.evaluate(() => { const v = document.querySelector('.band-team video, video[data-video]'); return v ? { paused: v.paused, rs: v.readyState, t: +v.currentTime.toFixed(2) } : null; });
    // vernostná karta: prihláška pred rezerváciou (len s --vernost=1, inak odkaz vedie mimo stránky)
    if (opt.vernost === '1') {
      await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' })); await sleep(1500);
      await win('vernostOtvor', () => press('.title-actions .btn-primary'), 1200);
      out.prechody.vernostOtvor.dialog = await page.evaluate(() => !!document.querySelector('#v30p[open]'));
      await win('vernostZavri', () => press('#v30p .v30x'), 1000);
    }
    // film: Späť na ulicu a Vojdi dnu
    if (FILM !== 'off') {
      await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' })); await sleep(2000);
      const on = await page.evaluate(() => document.documentElement.classList.contains('world-in') && !document.documentElement.classList.contains('world-off'));
      if (on) {
        await win('spatNaUlicu', () => press('.film-door'), 3500);
        await win('vojdiDnu', () => press('.film-door'), 3500);
      }
    }
    out.prechody.cls = +(await M()).ls.reduce((a, x) => a + x[1], 0).toFixed(4);
  }
  // konečný stav filmu
  out.film = await page.evaluate(() => { const f = window.BS30_FILM; const s = f && f.state; return s && s.on ? { dpr: s.dpr, frames: s.frames, firstFrameMs: s.firstFrameMs, ready: s.ready.filter((x) => x.ready).map((x) => x.shot + '@' + x.size) } : { on: false, triedy: document.documentElement.className }; });
  // všetko stiahnuté za celé meranie podľa typu (fotky filmu, sekvencie, videá, zálohy…)
  out.stiahnute = await page.evaluate(() => {
    const g = {};
    for (const r of performance.getEntriesByType('resource')) {
      const u = r.name.split('/barbershop-30/').pop();
      const k = /seq\//.test(u) ? 'sekvencie' : /img\/film\/.*hlbka/.test(u) ? 'hlbkove-mapy' : /img\/film\//.test(u) ? 'fotky-filmu' : /video\//.test(u) ? 'video' : /audio\//.test(u) ? 'zvuk' : /\.(avif|webp|jpg|png)/.test(u) ? 'ine-obrazky' : /\.js/.test(u) ? 'skripty' : /\.(css|woff2)/.test(u) ? 'styly-pisma' : 'ine';
      const x = g[k] || (g[k] = { pocet: 0, kB: 0 }); x.pocet++; x.kB += Math.round((r.transferSize || r.encodedBodySize || 0) / 1024);
    }
    return g;
  });
  out.chyby = errors.slice(0, 20);
} finally {
  out.meta.zatazPo = os.loadavg().map((x) => +x.toFixed(2));
  fs.writeFileSync(path.join(OUT, MENO + '.json'), JSON.stringify(out, null, 1));
  await browser.close();
}

/* ---------- súhrn ---------- */
const f1 = (s) => s ? `p50 ${s.p50} p95 ${s.p95} max ${s.max} >33ms ${s.podiel33}% (${s.snimok} sn.)` : '-';
console.log(`\n${MENO}  (záťaž ${out.meta.zataz.join('/')})`);
if (out.nacitanie) console.log(`načítanie: FCP ${Math.round(out.nacitanie.fcp)} LCP ${Math.round(out.nacitanie.lcp)} (${out.nacitanie.lcpPrvok}) TBT ${out.nacitanie.tbt} CLS ${out.nacitanie.cls} dlhé úlohy ${out.nacitanie.dlheUlohy.length}`);
if (out.uvod) console.log(`úvod: prológ ${out.uvod.prolog} ${f1(out.uvod.snimky)} | dlhé ${out.uvod.dlheUlohy.pocet} max ${out.uvod.dlheUlohy.max}`);
if (out.skrol) for (const [k, v] of Object.entries(out.skrol.prechody)) console.log(`skrol ${k}: ${f1(v.snimky)} | dlhé ${v.dlheUlohy.pocet} max ${v.dlheUlohy.max} | GL ${v.glMsNaSnimku} ms/sn.`);
if (out.skrol && out.skrol.vlakno) for (const [k, v] of Object.entries(out.skrol.vlakno)) if (v.pracaNaSnimku) console.log(`práca hl. vlákna ${k}: ${JSON.stringify(v.pracaNaSnimku)}`);
if (out.skrol && out.skrol.hlavneVlaknoMsNaSnimku) for (const [k, v] of Object.entries(out.skrol.hlavneVlaknoMsNaSnimku)) console.log(`  vlákno ${k}: ${JSON.stringify(v)}`);
if (out.prechody) for (const [k, v] of Object.entries(out.prechody)) if (v && v.snimky !== undefined) console.log(`prechod ${k}: ${f1(v.snimky)} | dlhé ${v.dlheUlohy.pocet} max ${v.dlheUlohy.max} | INP ${v.interakcie.inp}${v.chyba ? ' CHYBA ' + v.chyba : ''}`);
if (out.chyby && out.chyby.length) console.log('chyby:', out.chyby.slice(0, 5));
