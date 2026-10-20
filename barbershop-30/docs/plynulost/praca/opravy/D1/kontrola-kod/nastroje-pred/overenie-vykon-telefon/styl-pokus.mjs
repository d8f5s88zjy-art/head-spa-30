#!/usr/bin/env node
/* Overenie T3: čo stojí jeden zápis CSS premennej na kotvu .film-shot (prepočet štýlu podstromu) pri CPU 4×.
   Každý pokus = vlastná úloha (setTimeout): zápis + vynútený prepočet (getComputedStyle), čas vlákna zo stopy.
   Varianty: --sp na kotvu (ako app.js:175), nepoužitá premenná --zz na kotvu (rovnaký podstrom, nič od nej
   nezávisí), --sp priamo na img a .film-content (len 2 prvky), --o na kotvu, trieda bez zmeny štýlu.
   node styl-pokus.mjs [--film=off|predvolene] [--cpu=4] [--y=1000] */
import { createRequire } from 'module';
import fs from 'node:fs';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.length ? v.join('=') : '1']; }));
const CPU = Number(opt.cpu || 4), FILM = opt.film || 'off';
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: 'sk-SK' });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await page.goto(`http://127.0.0.1:8402/barbershop-30/?${FILM === 'predvolene' ? '' : 'film=' + FILM + '&'}uvod=off&hudba=off`, { waitUntil: 'load' });
await page.touchscreen.tap(30, 450);
await page.waitForTimeout(1500);
await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), Number(opt.y || 1000));
await page.waitForTimeout(3000);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
await cdp.send('Tracing.start', { categories: 'devtools.timeline,disabled-by-default-devtools.timeline,blink.user_timing', transferMode: 'ReturnAsStream' });
const meta = await page.evaluate(async () => {
  // zastaviť rAF slučku app.js, aby nezapisovala medzi pokusmi: skrol stojí, slučka sa sama zastaví
  await new Promise((r) => setTimeout(r, 500));
  const shot = [...document.querySelectorAll('.film-shot')].find((el) => { const b = el.getBoundingClientRect(); return b.top < innerHeight * 0.5 && b.bottom > innerHeight * 0.5; }) || document.querySelector('.film-shot');
  const img = shot.querySelector('.film-still img'), fc = shot.querySelector('.film-content') || shot.querySelector('.title-frame');
  const force = () => { getComputedStyle(img).transform; getComputedStyle(fc || img).transform; document.body.offsetHeight; };
  let v = 0;
  const V = {
    'sp-kotva': () => shot.style.setProperty('--sp', (v = (v + 0.013) % 1).toFixed(4)),
    'zz-kotva': () => shot.style.setProperty('--zz', (v = (v + 0.013) % 1).toFixed(4)),
    'o-kotva': () => shot.style.setProperty('--o', (0.5 + ((v = (v + 0.013) % 1) / 2)).toFixed(4)),
    'sp-img+obsah': () => { const s = (v = (v + 0.013) % 1).toFixed(4); img.style.setProperty('--sp', s); if (fc) fc.style.setProperty('--sp', s); },
    'transform-img': () => { img.style.transform = `scale(${1 + 0.06 * (v = (v + 0.013) % 1)})`; },
  };
  for (let rep = 0; rep < 8; rep++) for (const [k, f] of Object.entries(V)) {
    await new Promise((r) => setTimeout(() => { performance.mark('op:' + k); f(); force(); setTimeout(r, 40); }, 40));
  }
  return { shot: shot.dataset.shot, potomkov: shot.querySelectorAll('*').length, cls: document.documentElement.className };
});
const done = new Promise((r) => cdp.once('Tracing.tracingComplete', r));
await cdp.send('Tracing.end');
const { stream } = await done;
let raw = ''; for (;;) { const c = await cdp.send('IO.read', { handle: stream }); raw += c.data; if (c.eof) break; }
await browser.close();
const evs = JSON.parse(raw).traceEvents;
const tn = evs.find((e) => e.name === 'thread_name' && e.args.name === 'CrRendererMain');
const M = evs.filter((e) => e.pid === tn.pid && e.tid === tn.tid);
const timers = M.filter((e) => e.name === 'TimerFire' && e.ph === 'X');
const ult = M.filter((e) => e.name === 'UpdateLayoutTree' && e.ph === 'X');
const res = {};
for (const m of M.filter((e) => e.name.startsWith('op:'))) {
  const tf = timers.find((e) => e.ts <= m.ts && e.ts + e.dur >= m.ts); if (!tf) continue;
  const u = ult.filter((e) => e.ts >= tf.ts && e.ts <= tf.ts + tf.dur);
  const k = m.name.slice(3);
  (res[k] || (res[k] = [])).push({ uloha: +(tf.tdur / 1000).toFixed(2), styl: +(u.reduce((a, e) => a + (e.tdur ?? e.dur), 0) / 1000).toFixed(2), prvkov: u.reduce((a, e) => a + ((e.args && e.args.elementCount) || 0), 0) });
}
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[s.length >> 1]; };
const sum = Object.fromEntries(Object.entries(res).map(([k, a]) => [k, { stylMsMedian: med(a.map((x) => x.styl)), ulohaMsMedian: med(a.map((x) => x.uloha)), prvkov: med(a.map((x) => x.prvkov)), msNaPrvok: +(med(a.map((x) => x.styl)) / Math.max(1, med(a.map((x) => x.prvkov)))).toFixed(3) }]));
const out = { cpu: CPU, film: FILM, ...meta, suhrn: sum, vsetko: res };
fs.writeFileSync(`vysledky/styl-pokus-${FILM}-cpu${CPU}.json`, JSON.stringify(out, null, 1));
console.log(JSON.stringify({ ...meta, suhrn: sum }, null, 1));
