// Dotykový skrol celou stránkou na telefóne (390×844 @3, CPU 4×, Fast 4G) so záznamom trace a dlhých snímok (LoAF).
//   node skrol.mjs --q=uvod=off --scen=stredne|svih|prvy-dotyk|kontakt --out=beh-meno [--cpu=4] [--net=fast4g] [--desk]
// Výstup: <out>/vysledok.json (rozbor hlavného vlákna, LoAF so zdrojom skriptu, intervaly snímok, obrázky stiahnuté počas
// merania, zmeny tried kotiev) a <out>/trace.json.gz.
import fs from 'fs';
import zlib from 'zlib';
import { opt, BASE, launch, open, swipe, sleep, traceStart } from './spolocne.mjs';
import { analyze, invalidations } from './analyza.mjs';

const scen = opt.scen || 'stredne';
const out = new URL(`./${opt.out || 'beh-' + scen}/`, import.meta.url).pathname;
fs.mkdirSync(out, { recursive: true });
const url = BASE + (opt.q ? '?' + opt.q : '');
const cpu = Number(opt.cpu || 4);

const browser = await launch();
const { page, cdp, ctx } = await open(browser, { url, desk: !!opt.desk, cpu: 1, net: opt.net || 'fast4g' });

// zberače v stránke: LoAF (zdroj skriptu, vynútený štýl/layout), intervaly snímok, posuny rozloženia, triedy kotiev
await page.addInitScript(() => {
  window.__m = { loaf: [], ls: [], fr: [], cls: [], t0: 0 };
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__m.loaf.push({ t: Math.round(e.startTime), d: Math.round(e.duration), blk: Math.round(e.blockingDuration || 0), rs: Math.round(e.renderStart - e.startTime), sl: Math.round(e.styleAndLayoutStart - e.startTime), scripts: (e.scripts || []).map((s) => ({ inv: s.invoker, src: (s.sourceURL || '').split('/').pop(), fn: s.sourceFunctionName, pos: s.sourceCharPosition, d: Math.round(s.duration), forced: Math.round(s.forcedStyleAndLayoutDuration || 0) })) }); }).observe({ type: 'long-animation-frame', buffered: true }); } catch (e) {}
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__m.ls.push({ t: Math.round(e.startTime), v: +e.value.toFixed(4), src: (e.sources || []).map((s) => s.node ? (s.node.nodeName + '.' + (s.node.className || '')).slice(0, 60) : '?') }); }).observe({ type: 'layout-shift', buffered: true }); } catch (e) {}
  addEventListener('DOMContentLoaded', () => {
    const mo = new MutationObserver((list) => { for (const m of list) { const el = m.target; if (!el.classList || !el.classList.contains('film-shot')) continue; window.__m.cls.push({ t: Math.round(performance.now()), shot: el.dataset.shot, c: [...el.classList].filter((c) => /^is-/.test(c)).join(' ') }); } });
    document.querySelectorAll('.film-shot').forEach((el) => mo.observe(el, { attributes: true, attributeFilter: ['class'] }));
  });
});
const reqs = [];
page.on('request', (r) => { if (r.resourceType() === 'image' || r.resourceType() === 'media' || /\.(avif|webp|jpg|png|mp4|webm|json|js|css|woff2)(\?|$)/.test(r.url())) reqs.push({ t: Date.now(), u: r.url().replace(BASE, ''), typ: r.resourceType() }); });

await page.goto(url, { waitUntil: 'load', timeout: 120000 });
const t0 = Date.now();
if (scen !== 'prvy-dotyk') await sleep(5000); else await sleep(1200);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });

const H = await page.evaluate(() => document.scrollingElement.scrollHeight - innerHeight);
const stop = await traceStart(cdp);
const tStart = await page.evaluate(() => { const m = window.__m; m.fr = []; m.loaf = m.loaf.filter(() => false); m.t0 = performance.now(); let last = 0; const f = (t) => { if (last) m.fr.push(+(t - last).toFixed(1)); last = t; if (!m.stopFr) requestAnimationFrame(f); }; requestAnimationFrame(f); return m.t0; });
const tReq0 = Date.now();

if (scen === 'stredne') {
  // krátke ťahy prstom 600 px, 1300 px/s, pauza 120 ms, až na koniec; potom späť hore v ťahoch 1800 px
  let y = 0;
  while (y < H - 10) { await swipe(cdp, { dy: 600, speed: 1300 }); await sleep(120); y = await page.evaluate(() => scrollY); }
  await sleep(600);
  while (y > 10) { await swipe(cdp, { dy: -1800, speed: 3000 }); await sleep(80); y = await page.evaluate(() => scrollY); }
  await sleep(800);
} else if (scen === 'svih') {
  // rýchle švihy s doťahom (fling) nadol a nahor
  for (let i = 0; i < 12; i++) { await swipe(cdp, { dy: 700, speed: 5000, fling: true }); await sleep(700); }
  for (let i = 0; i < 12; i++) { await swipe(cdp, { dy: -700, speed: 5000, fling: true }); await sleep(700); }
  await sleep(800);
} else if (scen === 'prvy-dotyk') {
  // prvý dotyk návštevníka (načíta atmosféru a jazyky) počas prvých ťahov
  for (let i = 0; i < 6; i++) { await swipe(cdp, { dy: 500, speed: 1300 }); await sleep(150); }
  await sleep(1500);
} else if (scen === 'kontakt') {
  // pomaly k rezervácii (tabuľa hodín sa preklápa), potom 5 s pokoj
  const y0 = await page.evaluate(() => { const b = document.querySelector('.band-contact'); return b.getBoundingClientRect().top + scrollY - innerHeight * 0.9; });
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y0);
  await sleep(800);
  for (let i = 0; i < 4; i++) { await swipe(cdp, { dy: 220, speed: 600 }); await sleep(300); }
  await sleep(5000);
}

const m = await page.evaluate(() => { window.__m.stopFr = true; return window.__m; });
const ev = await stop();
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });

// rozbor
const mt = ev.filter((e) => e.ph === 'X');
const tsMin = Math.min(...mt.map((e) => e.ts));
const res = analyze(ev, { from: tsMin });
res.invalidacie = invalidations(ev, { from: tsMin });
// uzly kreslenia -> názov prvku
for (const p of res.paint.podla_uzla) {
  if (typeof p.nodeId !== 'number') continue;
  try { const { node } = await cdp.send('DOM.describeNode', { backendNodeId: p.nodeId }); const a = node.attributes || []; const cls = a[a.indexOf('class') + 1]; p.prvok = `${node.nodeName.toLowerCase()}${a.includes('class') ? '.' + String(cls).split(' ').join('.') : ''}`.slice(0, 80); } catch (e) { p.prvok = '?'; }
}
const fr = m.fr; const s = [...fr].sort((a, b) => a - b);
const q = (p) => s[Math.min(s.length - 1, Math.floor(p * s.length))];
res.snimky = { n: fr.length, p50: q(0.5), p95: q(0.95), max: s[s.length - 1], nad33_pct: +(100 * fr.filter((v) => v > 33.4).length / fr.length).toFixed(1), nad100: fr.filter((v) => v > 100).length };
res.loaf = m.loaf.filter((e) => e.t >= tStart).map((e) => ({ ...e, t: e.t - Math.round(tStart) }));
res.loaf_nad50 = res.loaf.filter((e) => e.d > 50).length;
res.layout_shift = m.ls;
res.zmeny_kotiev = m.cls.filter((e) => e.t >= tStart).length;
res.near_zmeny = m.cls.filter((e) => e.t >= tStart).slice(0, 60);
res.poziadavky = reqs.filter((r) => r.t >= tReq0).map((r) => ({ t: r.t - tReq0, u: r.u }));
res.parametre = { url, scen, cpu, net: opt.net || 'fast4g', desk: !!opt.desk, H };
res.dom = await page.evaluate(() => ({ prvkov: document.getElementsByTagName('*').length, kw: document.querySelectorAll('.kw').length, flap_b: document.querySelectorAll('.flap-cells b').length, hlbka: (() => { let mx = 0; const w = (n, d) => { if (d > mx) mx = d; for (const c of n.children) w(c, d + 1); }; w(document.documentElement, 1); return mx; })(), html_class: document.documentElement.className }));
fs.writeFileSync(out + 'vysledok.json', JSON.stringify(res, null, 1));
fs.writeFileSync(out + 'trace.json.gz', zlib.gzipSync(JSON.stringify({ traceEvents: ev })));
await ctx.close(); await browser.close();
const { near_zmeny, loaf, ...kratko } = res;
console.log(JSON.stringify({ ...kratko, loaf_top: [...loaf].sort((a, b) => b.d - a.d).slice(0, 6) }, null, 1).slice(0, 12000));
