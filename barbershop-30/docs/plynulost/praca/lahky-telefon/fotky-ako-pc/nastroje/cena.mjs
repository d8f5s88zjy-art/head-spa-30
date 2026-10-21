// Cena možností ?foto=A|B|B-css|C|C-2172 na ľahkom telefóne 390×844 DPR 3.
// 1) bajty fotiek a dekódované MP pre celú stránku (prejdenie celej stránky skrolom bez spomalenia CPU)
// 2) CPU 4× (CDP Emulation.setCPUThrottlingRate): karta cakaren, 8 s v pokoji (prejazd pri C) + 3 s skrol cez kartu;
//    stopa (trace): Paint, RasterTask, ImageDecodeTask, snímky skladača (PipelineReporter), zlyhané skladanie animácie;
//    v stránke: rAF intervaly a long-animation-frame.
// node cena.mjs <port> <out-dir>
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const port = process.argv[2], OUT = process.argv[3];
fs.mkdirSync(OUT, { recursive: true });
const base = `http://127.0.0.1:${port}/barbershop-30/`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const load = () => fs.readFileSync('/proc/loadavg', 'utf8').split(' ').slice(0, 3).join(' ');
const modes = [
  { id: 'A', q: '?foto=A' }, { id: 'B', q: '?foto=B' }, { id: 'Bcss', q: '?foto=B&rozmaz=css' },
  { id: 'C', q: '?foto=C' }, { id: 'C2172', q: '?foto=C&c=2172' },
];
const only = process.env.MODES ? process.env.MODES.split(',') : null;
const phone = { viewport: { width: 390, height: 844 }, screen: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: 'dark', locale: 'sk-SK' };
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const res = { start: new Date().toISOString(), loadStart: load(), modes: {} };

async function goCard(page, c) {
  await page.evaluate((c) => {
    document.documentElement.style.scrollBehavior = 'auto';
    const el = document.querySelector(`.film-shot[data-shot="${c}"]`);
    const top = el.getBoundingClientRect().top + scrollY;
    const free = Math.max(1, el.offsetHeight - (el.classList.contains('title-long') ? innerHeight : 0));
    scrollTo(0, top + free * 0.5);
  }, c);
  await page.waitForFunction((c) => {
    const el = document.querySelector(`.film-shot[data-shot="${c}"]`);
    const st = el.querySelector('.film-still'), img = st.querySelector('img.foto-main') || st.querySelector('img');
    return el.classList.contains('is-shown') && img.complete && img.naturalWidth > 0 && getComputedStyle(st).opacity === '1';
  }, c, { timeout: 30000 }).catch(() => console.error('timeout', c));
}

function parseTrace(file) {
  const t = JSON.parse(fs.readFileSync(file, 'utf8'));
  const ev = t.traceEvents || t;
  const agg = {};
  const add = (k, d) => { agg[k] = agg[k] || { n: 0, ms: 0 }; agg[k].n++; agg[k].ms += (d || 0) / 1000; };
  const states = {}; const fail = []; let maxPaint = 0;
  for (const e of ev) {
    if (['Paint', 'RasterTask', 'ImageDecodeTask', 'Decode Image', 'PaintImage', 'Layout', 'UpdateLayoutTree', 'Layerize', 'PrePaint', 'Commit', 'ProxyMain::BeginMainFrame::commit', 'Animation Frame Fired', 'FireAnimationFrame'].includes(e.name) && e.ph === 'X') {
      add(e.name, e.dur);
      if (e.name === 'Paint') maxPaint = Math.max(maxPaint, (e.dur || 0) / 1000);
    }
    if (e.name === 'PipelineReporter' && e.ph === 'b' && e.args && e.args.frame_reporter) {
      const fr = e.args.frame_reporter, s = fr.state || '?'; states[s] = (states[s] || 0) + 1;
      if (fr.has_compositor_animation) states.sAnimSkladaca = (states.sAnimSkladaca || 0) + 1;
      if (fr.has_main_animation) states.sAnimHlavne = (states.sAnimHlavne || 0) + 1;
      if (fr.has_missing_content || fr.checkerboarded_needs_raster) states.chybaObsah = (states.chybaObsah || 0) + 1;
    }
    if (e.name === 'DroppedFrame') states.DroppedFrame = (states.DroppedFrame || 0) + 1;
    if (e.name === 'DrawFrame') states.DrawFrame = (states.DrawFrame || 0) + 1;
    if (e.cat && e.cat.includes('animations') && e.args && e.args.data && e.args.data.compositeFailed !== undefined) {
      fail.push(e.args.data.compositeFailed);
    }
  }
  for (const k in agg) agg[k].ms = +agg[k].ms.toFixed(1);
  return { agg, frames: states, compositeFailed: [...new Set(fail)], maxPaintMs: +maxPaint.toFixed(1) };
}

const inPageRec = () => {
  window.__rec = { raf: [], loaf: [] };
  let last = performance.now();
  const f = (t) => { window.__rec.raf.push(t - last); last = t; if (window.__rec.on) requestAnimationFrame(f); };
  window.__rec.on = true; requestAnimationFrame(f);
  try {
    window.__rec.po = new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__rec.loaf.push(Math.round(e.duration)); });
    window.__rec.po.observe({ type: 'long-animation-frame' });
  } catch (e) { window.__rec.loaf = null; }
};
const inPageStop = () => {
  window.__rec.on = false; try { window.__rec.po.disconnect(); } catch (e) {}
  const r = window.__rec.raf.slice(1);
  const s = [...r].sort((a, b) => a - b);
  const q = (p) => +(s[Math.min(s.length - 1, Math.floor(p * s.length))] || 0).toFixed(1);
  return { rafN: r.length, rafP50: q(0.5), rafP95: q(0.95), rafMax: q(1), rafOver33: r.filter((x) => x > 33.4).length, rafOver50: r.filter((x) => x > 50).length,
    loaf: window.__rec.loaf ? { n: window.__rec.loaf.length, max: Math.max(0, ...window.__rec.loaf), sum: window.__rec.loaf.reduce((a, b) => a + b, 0) } : 'nepodporované' };
};

for (const m of modes) {
  if (only && !only.includes(m.id)) continue;
  const R = res.modes[m.id] = { q: m.q };
  // ---------- 1) bajty a MP pre celú stránku ----------
  {
    const ctx = await browser.newContext(phone);
    const page = await ctx.newPage();
    const bytes = {};
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Network.enable');
    const urls = {};
    cdp.on('Network.responseReceived', (e) => { urls[e.requestId] = e.response.url; });
    cdp.on('Network.loadingFinished', (e) => { const u = urls[e.requestId]; if (u) bytes[u] = e.encodedDataLength; });
    await page.goto(base + m.q, { waitUntil: 'load' });
    await sleep(1500);
    R.cls = await page.evaluate(() => document.documentElement.className);
    const H = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < H; y += 422) { await page.evaluate((y) => scrollTo(0, y), y); await sleep(260); }
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await sleep(2500);
    const film = Object.entries(bytes).filter(([u]) => u.includes('/img/film/'));
    const imgAll = Object.entries(bytes).filter(([u]) => /\.(avif|webp|jpe?g|png)(\?|$)/.test(u));
    const dims = await page.evaluate(async (list) => {
      const out = {};
      for (const u of list) { const i = new Image(); i.src = u; try { await i.decode(); out[u] = [i.naturalWidth, i.naturalHeight]; } catch (e) {} }
      return out;
    }, film.map(([u]) => u));
    R.page = {
      scrollHeight: H,
      filmFiles: film.length,
      filmBytes: film.reduce((a, [, b]) => a + b, 0),
      allImgBytes: imgAll.reduce((a, [, b]) => a + b, 0),
      allBytes: Object.values(bytes).reduce((a, b) => a + b, 0),
      filmMP: +film.reduce((a, [u]) => a + (dims[u] ? dims[u][0] * dims[u][1] / 1e6 : 0), 0).toFixed(1),
      files: film.map(([u, b]) => [u.split('/').pop(), b, dims[u] ? dims[u].join('×') : '?']).sort(),
    };
    await ctx.close();
  }
  // ---------- 2) CPU 4×: karta cakaren v pokoji a pri skrole ----------
  {
    const ctx = await browser.newContext(phone);
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await page.goto(base + m.q, { waitUntil: 'load' });
    await sleep(1500);
    await goCard(page, 'cakaren');
    await sleep(1500);
    // vrstvy s will-change: transform (len aktívna karta pri C)
    R.willChange = await page.evaluate(() => [...document.querySelectorAll('.film-still img, .film-still .foto-bg')]
      .filter((e) => getComputedStyle(e).willChange.includes('transform')).map((e) => e.closest('.film-shot').dataset.shot + ':' + e.className));
    R.anims = await page.evaluate(() => [...document.querySelectorAll('.film-still img.foto-main')].flatMap((e) => e.getAnimations().map((a) => e.closest('.film-shot').dataset.shot + ':' + (a.animationName || a.constructor.name))));
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    for (const [lab, ms, scroll] of [['pokoj', 8000, false], ['skrol', 3000, true]]) {
      const l0 = load();
      const tf = `${OUT}/trace-${m.id}-${lab}.json`;
      await browser.startTracing(page, { path: tf, categories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'disabled-by-default-devtools.timeline.frame', 'blink.animations', 'benchmark', 'rail', 'cc'] });
      await page.evaluate(inPageRec);
      if (scroll) {
        // plynulý programový skrol cez kartu: 3 s, každú snímku posun (ako prst), 0,6 výšky okna celkom
        await page.evaluate(() => new Promise((res) => {
          const y0 = scrollY, d = innerHeight * 0.6, t0 = performance.now();
          const f = (t) => { const k = Math.min(1, (t - t0) / 3000); scrollTo(0, y0 + d * k); if (k < 1) requestAnimationFrame(f); else res(); };
          requestAnimationFrame(f);
        }));
        await sleep(300);
      } else await sleep(ms);
      const st = await page.evaluate(inPageStop);
      await browser.stopTracing();
      const tr = parseTrace(tf);
      if (!process.env.KEEP) fs.unlinkSync(tf);
      R[lab] = { ...st, ...tr, loadavg: [l0, load()] };
      if (lab === 'pokoj') await goCard(page, 'cakaren');
    }
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    await ctx.close();
  }
  console.error(m.id, JSON.stringify({ page: { ...R.page, files: undefined }, pokoj: R.pokoj && { raf: [R.pokoj.rafP50, R.pokoj.rafP95, R.pokoj.rafOver50], loaf: R.pokoj.loaf, frames: R.pokoj.frames, paint: R.pokoj.agg.Paint, raster: R.pokoj.agg.RasterTask } }));
}
// ---------- 3) C s prefers-reduced-motion: statický stred ----------
if (!only || only.includes('C')) {
  const ctx = await browser.newContext({ ...phone, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(base + '?foto=C', { waitUntil: 'load' });
  await sleep(1500);
  await goCard(page, 'cakaren');
  await sleep(1000);
  res.reducedC = await page.evaluate(() => {
    const img = document.querySelector('.film-shot[data-shot="cakaren"] img.foto-main');
    const cs = getComputedStyle(img);
    return { anims: img.getAnimations().length, tx: new DOMMatrix(cs.transform).e, w: img.offsetWidth, vw: innerWidth, willChange: cs.willChange, stredOcakavany: (innerWidth - img.offsetWidth) * 0.5 };
  });
  await page.screenshot({ path: `${OUT}/C-reduced-cakaren.png` });
  await ctx.close();
}
res.loadEnd = load();
fs.writeFileSync(`${OUT}/cena.json`, JSON.stringify(res, null, 1));
await browser.close();
console.log('hotovo', OUT);
