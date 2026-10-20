// Overenie K07: koľko stojí prvé Intl.DateTimeFormat s časovou zónou (app.js:661 nowNitra) pri načítaní stránky.
// Telefón 390×844 @3, CPU 4×, Fast 4G, prázdna cache, ?uvod=off. Konštruktor a formatToParts sa obalia v stránke
// (performance.now pred a po), ďalej celkové trvanie vyhodnotenia app.js (LoAF skript app.js).
//   node over-intl.mjs [--n=3]
import { opt, BASE, launch, open, sleep } from './spolocne.mjs';
const N = Number(opt.n || 3);
const browser = await launch();
for (let i = 0; i < N; i++) {
  const { page, ctx } = await open(browser, { cpu: 4, net: 'fast4g', cache: false });
  await page.addInitScript(() => {
    window.__intl = []; window.__loaf = [];
    const DTF = Intl.DateTimeFormat;
    function W(...a) { const t = performance.now(); const f = new DTF(...a); const d = performance.now() - t; const o = f.formatToParts.bind(f); f.formatToParts = (...b) => { const t2 = performance.now(); const r = o(...b); window.__intl.push({ co: 'formatToParts', ms: +(performance.now() - t2).toFixed(1) }); return r; }; window.__intl.push({ co: 'new DateTimeFormat ' + JSON.stringify(a[1] || {}).slice(0, 40), ms: +d.toFixed(1), zasobnik: (new Error().stack || '').split('\n')[2]?.trim().slice(0, 80) }); return f; }
    W.prototype = DTF.prototype; W.supportedLocalesOf = DTF.supportedLocalesOf;
    Intl.DateTimeFormat = W;
    try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__loaf.push({ t: Math.round(e.startTime), d: Math.round(e.duration), s: (e.scripts || []).filter((s) => s.duration > 5).map((s) => `${(s.sourceURL || '').split('/').pop()} ${s.invoker.slice(0, 30)} ${Math.round(s.duration)}`) }); }).observe({ type: 'long-animation-frame', buffered: true }); } catch (e) {}
  });
  await page.goto(BASE + '?uvod=off', { waitUntil: 'load', timeout: 120000 });
  await sleep(1500);
  const r = await page.evaluate(() => ({ intl: window.__intl, loaf_appjs: window.__loaf.filter((l) => l.s.some((s) => /^app\.js/.test(s))) }));
  console.log(`beh ${i + 1}:`, JSON.stringify(r.intl));
  for (const l of r.loaf_appjs) console.log(`   LoAF ${l.d} ms o ${l.t} ms: ${l.s.join(' | ')}`);
  // to isté priamo v čerstvom procese bez stránky (izolovaná cena ICU časovej zóny)
  await ctx.close();
}
// izolovaná cena: prázdna stránka (robots.txt) v novom kontexte, CPU 4×
for (let i = 0; i < N; i++) {
  const { page, ctx } = await open(browser, { cpu: 4, net: 'none' });
  await page.goto(BASE + 'robots.txt');
  const r = await page.evaluate(() => { const t = performance.now(); const f = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Bratislava', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }); const t1 = performance.now(); f.formatToParts(new Date()); const t2 = performance.now(); new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Bratislava', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()); const t3 = performance.now(); return { prvy_konstruktor: +(t1 - t).toFixed(1), prvy_format: +(t2 - t1).toFixed(1), druhy_spolu: +(t3 - t2).toFixed(1) }; });
  console.log(`prázdna stránka beh ${i + 1}:`, JSON.stringify(r));
  await ctx.close();
}
await browser.close();
