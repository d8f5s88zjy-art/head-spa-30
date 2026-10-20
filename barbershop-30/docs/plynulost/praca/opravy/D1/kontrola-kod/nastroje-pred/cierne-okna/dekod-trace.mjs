#!/usr/bin/env node
// Overenie príčiny „čierne okno pri výmene zálohy“ (pokojná verzia ?film=off, telefón) cez záznam výkonu (trace):
// zálohy sú stiahnuté (img.complete), stránka sa posúva po krokoch cez výmenu kariet 0→1→2→3 a v zázname sa hľadá,
// kedy prehliadač dekóduje obrázok zálohy (udalosti Decode Image / ImageDecodeTask) voči času, keď app.js kartu ukáže
// (trieda is-shown) a predošlú skryje (--so 0). Variant „decode“ zavolá img.decode() na zálohách vopred.
//   node dekod-trace.mjs [--cpu=4] [--variant=nic|decode] [--port=8402]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const here = path.dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const CPU = Number(arg('cpu', 4)), PORT = arg('port', '8402'), VAR = arg('variant', 'nic');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const p = await ctx.newPage(); const c = await ctx.newCDPSession(p);
await p.goto(`http://127.0.0.1:${PORT}/barbershop-30/?film=off`, { waitUntil: 'load' });
await sleep(1500);
if (CPU > 1) await c.send('Emulation.setCPUThrottlingRate', { rate: CPU });
// sledovanie výmeny: čas (performance.now) prvého is-shown a --so=1 každej karty
await p.evaluate(() => {
  window.__sw = [];
  const els = [...document.querySelectorAll('.film-shot')];
  new MutationObserver((ms) => ms.forEach((m) => { const i = els.indexOf(m.target); window.__sw.push([Math.round(performance.now()), i, m.target.classList.contains('is-shown') ? 1 : 0, m.target.style.getPropertyValue('--so')]); }))
    .observe(document.querySelector('main'), { subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
});
const ev = [];
c.on('Tracing.dataCollected', (d) => ev.push(...d.value));
const done = new Promise((r) => c.once('Tracing.tracingComplete', r));
await c.send('Tracing.start', { categories: 'blink.user_timing,devtools.timeline,disabled-by-default-devtools.timeline,cc,blink,disabled-by-default-devtools.timeline.frame', transferMode: 'ReportEvents' });
const tops = await p.evaluate(() => [...document.querySelectorAll('.film-shot')].slice(1, 4).map((el) => Math.round(el.getBoundingClientRect().top + scrollY)));
const marks = [];
for (const [ii, top] of tops.entries()) {
  // záloha cieľovej karty je stiahnutá (img.complete); variant decode ju pred výmenou aj dekóduje
  await p.waitForFunction((i) => { const im = document.querySelectorAll('.film-shot')[i].querySelector('.film-still img'); return im.complete && im.naturalWidth > 0; }, ii + 1, { timeout: 60000 });
  if (VAR === 'decode') await p.evaluate((i) => document.querySelectorAll('.film-shot')[i].querySelector('.film-still img').decode().catch(() => {}), ii + 1);
  // dotyk: plynulé posunutie na 0,3 okna za horný okraj kotvy (karta je celá, predošlá záloha zmizne)
  await p.evaluate((i) => performance.mark('vymena-' + i), ii + 1);
  const y0 = await p.evaluate(() => scrollY), y1 = top + 0.3 * 844;
  for (let k = 1; k <= 20; k++) { await p.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y0 + (y1 - y0) * k / 20); await sleep(25); }
  marks.push(await p.evaluate(() => Math.round(performance.now())));
  await sleep(1500);
}
await c.send('Tracing.end');
await done;
const sw = await p.evaluate(() => window.__sw);
const tOrigin = await p.evaluate(() => performance.timeOrigin);
// časová os trace je v mikrosekundách monotonických hodín; prepočet cez udalosť navigationStart nie je k dispozícii,
// preto sa zarovná na značku z performance.mark
const dec = ev.filter((e) => /Decode Image|ImageDecodeTask|Decode LazyPixelRef|DecodeAndScale/.test(e.name) && e.ph === 'X' || /Decode Image|ImageDecodeTask/.test(e.name));
fs.writeFileSync(path.join(here, `dekod-trace-${VAR}.json`), JSON.stringify({ sw, marks, dec: dec.map((e) => ({ n: e.name, ts: e.ts, dur: e.dur, args: e.args && e.args.data ? { url: (e.args.data.url || '').split('/').pop() } : null })) }, null, 0));
const names = {}; ev.forEach((e) => { names[e.name] = (names[e.name] || 0) + 1; });
console.log('udalosti dekódovania:', dec.length, 'mená:', Object.entries(names).filter(([n]) => /ecode|Image|Raster/i.test(n)).map(([n, k]) => n + '=' + k).join(', '));
// obrazy: trvanie a začiatok dekódovania vzhľadom na zmenu --so
const ts0 = Math.min(...ev.filter((e) => e.ts).map((e) => e.ts));
const dd = dec.filter((e) => e.dur).map((e) => [Math.round((e.ts - ts0) / 1000), Math.round(e.dur / 1000), e.name, e.args && e.args.data && (e.args.data.url || '').split('/').pop()]);
const pm = await p.evaluate(() => performance.getEntriesByType('mark').filter((m) => m.name.startsWith('vymena-')).map((m) => [m.name, m.startTime]));
const tm = ev.filter((e) => e.name && e.name.startsWith('vymena-'));
let off = null;
if (tm.length && pm.length) { const a = tm.find((e) => e.name === pm[0][0]); if (a) off = a.ts / 1000 - pm[0][1]; }
if (off != null) {
  const toP = (ts) => Math.round(ts / 1000 - off);
  const evs = ev.filter((e) => (/^Decode Image$/.test(e.name) && e.dur) || /CheckerImageTracker::DeferImageDecode/.test(e.name)).map((e) => [toP(e.ts), e.dur ? Math.round(e.dur / 1000) : 0, e.name.replace('CheckerImageTracker::', '')]);
  // zmeny kariet: posledná predošlá karta skrytá (--so 0) a nová ukázaná celá (--so 1)
  const ch = []; const last = {};
  for (const [t, i, sh, so] of sw) { const k = i + ':' + so; if (last[i] !== so) { last[i] = so; if (so === '1.0000' || so === '0.0000') ch.push([t, i, so]); } }
  console.log('značky výmen (performance.now):', JSON.stringify(pm.map(([n, t]) => [n, Math.round(t)])));
  console.log('karty --so (performance.now, karta, hodnota):', JSON.stringify(ch));
  console.log('dekódovanie a odklad dekódovania (performance.now, trvanie ms, udalosť):', JSON.stringify(evs));
}
console.log('dekódovania (ms od začiatku záznamu, trvanie):', JSON.stringify(dd.filter((x) => x[1] >= 5).slice(0, 40)));
console.log('výmeny kariet (performance.now, karta, is-shown, --so):', JSON.stringify(sw.filter((x) => x[2] === 1 && (x[3] === '1.0000' || x[3] === '0.0000')).slice(0, 30)));
await b.close();
