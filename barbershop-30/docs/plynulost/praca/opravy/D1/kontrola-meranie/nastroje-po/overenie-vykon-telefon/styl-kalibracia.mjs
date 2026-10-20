#!/usr/bin/env node
/* Kalibrácia T3: cena prepočtu štýlu na prvok na tej istej stránke s plným style.css, bez style.css
   (styleSheets.disabled) a na prázdnej stránke s 25 prvkami. CPU 4×, čas vlákna zo stopy. */
import { createRequire } from 'module';
import fs from 'node:fs';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const CPU = Number(process.argv[2] || 4);
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const res = {};
for (const variant of ['plne-css', 'bez-style-css', 'prazdna']) {
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  if (variant === 'prazdna') await page.setContent('<div id=s style="--zz:0">' + '<div><p><span>x</span></p></div>'.repeat(8) + '</div>');
  else await page.goto('http://127.0.0.1:8432/barbershop-30/?film=off&uvod=off&hudba=off', { waitUntil: 'load' });
  await page.waitForTimeout(2000);
  if (variant !== 'prazdna') await page.evaluate(() => scrollTo({ top: 1000, behavior: 'instant' }));
  if (variant === 'bez-style-css') await page.evaluate(() => { for (const s of document.styleSheets) if ((s.href || '').includes('style.css')) s.disabled = true; });
  await page.waitForTimeout(1500);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
  await cdp.send('Tracing.start', { categories: 'devtools.timeline,disabled-by-default-devtools.timeline,blink.user_timing', transferMode: 'ReturnAsStream' });
  await page.evaluate(async (v) => {
    const el = v === 'prazdna' ? document.getElementById('s') : document.querySelector('.film-shot[data-shot="sala"]');
    let x = 0;
    for (let rep = 0; rep < 10; rep++) await new Promise((r) => setTimeout(() => { performance.mark('op:zz'); el.style.setProperty('--zz', (x += 0.013).toFixed(4)); document.body.offsetHeight; setTimeout(r, 40); }, 40));
  }, variant);
  const done = new Promise((r) => cdp.once('Tracing.tracingComplete', r));
  await cdp.send('Tracing.end');
  const { stream } = await done;
  let raw = ''; for (;;) { const c = await cdp.send('IO.read', { handle: stream }); raw += c.data; if (c.eof) break; }
  const evs = JSON.parse(raw).traceEvents;
  const tn = evs.find((e) => e.name === 'thread_name' && e.args.name === 'CrRendererMain');
  const M = evs.filter((e) => e.pid === tn.pid && e.tid === tn.tid);
  const timers = M.filter((e) => e.name === 'TimerFire' && e.ph === 'X'), ult = M.filter((e) => e.name === 'UpdateLayoutTree' && e.ph === 'X');
  const a = [];
  for (const m of M.filter((e) => e.name === 'op:zz')) { const tf = timers.find((e) => e.ts <= m.ts && e.ts + e.dur >= m.ts); if (!tf) continue; const u = ult.filter((e) => e.ts >= tf.ts && e.ts <= tf.ts + tf.dur); a.push([+(u.reduce((s, e) => s + (e.tdur ?? e.dur), 0) / 1000).toFixed(2), u.reduce((s, e) => s + ((e.args && e.args.elementCount) || 0), 0)]); }
  a.sort((p, q) => p[0] - q[0]);
  const m = a[a.length >> 1];
  res[variant] = { stylMs: m[0], prvkov: m[1], msNaPrvok: +(m[0] / Math.max(1, m[1])).toFixed(3), vsetko: a };
  await page.close();
}
await browser.close();
fs.writeFileSync(`vysledky/styl-kalibracia-cpu${CPU}.json`, JSON.stringify(res, null, 1));
console.log(JSON.stringify(Object.fromEntries(Object.entries(res).map(([k, v]) => [k, { stylMs: v.stylMs, prvkov: v.prvkov, msNaPrvok: v.msNaPrvok }]))));
