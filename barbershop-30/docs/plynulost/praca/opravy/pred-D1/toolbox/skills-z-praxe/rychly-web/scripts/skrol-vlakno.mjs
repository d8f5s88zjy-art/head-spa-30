#!/usr/bin/env node
// Hlavné vlákno pri plynulom skrolovaní celej stránky: ms na snímku (skript, prepočet štýlu, rozloženie,
// všetky úlohy), počet prvkov v jednom prepočte štýlu a intervaly snímok (p50/p90/p99).
// Postup prevzatý z auditu výkonu BARBERSHOP 30 (CDP Performance.getMetrics, spomalenie CPU, záznam trace).
// Hodnoty sú na porovnanie dvoch verzií na tom istom stroji (pred a po), nie absolútne časy telefónu.
//
//   node skrol-vlakno.mjs --url=http://127.0.0.1:8000/ [--cpu=4] [--desktop] [--px=30] [--runs=2]
//
// --px: posun v pixeloch za snímku (telefón 30, počítač 40). Bez grafickej karty (headless) neber
// čísla WebGL ako skutočné; meraj vtedy stránku bez filmu.
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { console.error('chýba playwright (npm i -D playwright alebo globálne)'); process.exit(1); }
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.length ? v.join('=') : true]; }));
if (!opt.url) { console.error('použitie: node skrol-vlakno.mjs --url=<adresa> [--cpu=4] [--desktop] [--px=30] [--runs=2]'); process.exit(2); }

const desktop = !!opt.desktop;
const cpu = Number(opt.cpu || 4);
const perFrame = Number(opt.px || (desktop ? 40 : 30));
const runs = Number(opt.runs || 2);
const ctxOpt = desktop ? { viewport: { width: 1440, height: 900 } } : { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true };
const M = ['ScriptDuration', 'RecalcStyleDuration', 'LayoutDuration', 'TaskDuration'];

async function metrics(cdp) {
  const { metrics } = await cdp.send('Performance.getMetrics');
  return Object.fromEntries(metrics.filter((m) => M.includes(m.name)).map((m) => [m.name, m.value]));
}
// skrol v stránke: pevný posun za snímku cez requestAnimationFrame, vráti intervaly snímok
const scrollThrough = (page) => page.evaluate(async (perFrame) => {
  const end = document.scrollingElement.scrollHeight - innerHeight;
  window.scrollTo({ top: 0, behavior: 'instant' });
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  const iv = []; let last = 0, y = 0;
  await new Promise((res) => {
    const step = (now) => {
      if (last) iv.push(now - last); last = now;
      y = Math.min(end, y + perFrame);
      window.scrollTo({ top: y, behavior: 'instant' });
      if (y >= end) res(); else requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
  iv.sort((a, b) => a - b);
  const q = (p) => +iv[Math.min(iv.length - 1, Math.floor(p * iv.length))].toFixed(1);
  return { frames: iv.length + 1, p50: q(0.5), p90: q(0.9), p99: q(0.99) };
}, perFrame);

const browser = await chromium.launch({ headless: true });
const rows = [];
try {
  for (let r = 0; r < runs; r++) {
    const ctx = await browser.newContext(ctxOpt);
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Performance.enable', { timeDomain: 'threadTicks' });
    await page.goto(opt.url, { waitUntil: 'load', timeout: 90000 });
    await page.waitForTimeout(1500);
    await scrollThrough(page);                       // zahriatie: obrázky, dekódovanie, vrstvy
    await page.waitForTimeout(800);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
    await browser.startTracing(page, { categories: ['devtools.timeline'] });
    const m0 = await metrics(cdp);
    const sc = await scrollThrough(page);
    const m1 = await metrics(cdp);
    const trace = JSON.parse((await browser.stopTracing()).toString());
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    // počet prvkov v prepočtoch štýlu (UpdateLayoutTree.elementCount): stovky = premenná alebo trieda na koreni
    const ult = (trace.traceEvents || []).filter((e) => e.name === 'UpdateLayoutTree' && e.ph === 'X');
    const elems = ult.reduce((a, e) => a + (e.args?.elementCount || 0), 0);
    const per = (k) => +(((m1[k] - m0[k]) * 1000) / sc.frames).toFixed(2);
    rows.push({ ...sc, script: per('ScriptDuration'), style: per('RecalcStyleDuration'), layout: per('LayoutDuration'), task: per('TaskDuration'), prvkovNaSnimku: Math.round(elems / sc.frames) });
    await ctx.close();
  }
} finally { await browser.close(); }

console.log(`${desktop ? 'počítač 1440×900' : 'telefón 390×844 @3x'}, CPU ${cpu}x, ${perFrame} px za snímku, ${runs} behy`);
console.table(rows);
const avg = (k) => +(rows.reduce((a, r) => a + r[k], 0) / rows.length).toFixed(2);
console.log(`priemer ms na snímku: skript ${avg('script')}, štýl ${avg('style')}, rozloženie ${avg('layout')}, úlohy spolu ${avg('task')}; prvkov v prepočte na snímku ${avg('prvkovNaSnimku')}`);
