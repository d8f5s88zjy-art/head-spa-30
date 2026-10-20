#!/usr/bin/env node
// Koľko stojí zápis CSS premennej na <html> oproti zápisu na jeden prvok (prepočet štýlu po zápise).
// Premenná na koreni sa dedí do celého stromu, takže každý zápis prepočíta štýl všetkých prvkov.
// Postup prevzatý z merania pred úpravou app.js BARBERSHOP 30 (premenné --p a --pointer-x na <html>).
//
//   node cena-premennej.mjs --url=http://127.0.0.1:8000/ [--sel=.film-shot] [--var=--x] [--cpu=4] [--desktop]
//
// Predvolene telefón 390×844 @3x so 4× spomaleným procesorom (ako mobilný Lighthouse); --desktop 1440×900 bez spomalenia.
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { console.error('chýba playwright (npm i -D playwright alebo globálne)'); process.exit(1); }
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.length ? v.join('=') : true]; }));
if (!opt.url) { console.error('použitie: node cena-premennej.mjs --url=<adresa> [--sel=<selektor>] [--var=--x] [--cpu=4] [--desktop]'); process.exit(2); }

const desktop = !!opt.desktop;
const cpu = Number(opt.cpu || (desktop ? 1 : 4));
const ctxOpt = desktop ? { viewport: { width: 1440, height: 900 } } : { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true };
const browser = await chromium.launch({ headless: true });
try {
  const ctx = await browser.newContext(ctxOpt);
  const page = await ctx.newPage();
  await page.goto(opt.url, { waitUntil: 'load', timeout: 90000 });
  await page.waitForTimeout(1500);
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
  const r = await page.evaluate(({ sel, name }) => {
    const N = 40, out = { prvkov: document.getElementsByTagName('*').length };
    const el = (sel && document.querySelector(sel)) || document.body.firstElementChild;
    // zápis a hneď čítanie rozloženia: vynúti prepočet štýlu, ktorý by inak prišiel v snímke
    const run = (label, target) => {
      let tot = 0;
      for (let i = 0; i < N; i++) { target.style.setProperty(name, (i / N).toFixed(4)); const t = performance.now(); void document.body.offsetTop; tot += performance.now() - t; }
      out[label] = +(tot / N).toFixed(2) + ' ms';
    };
    run(`${name} na <html>`, document.documentElement);
    run(`${name} na ${sel || el.tagName.toLowerCase()}`, el);
    return out;
  }, { sel: opt.sel || null, name: opt.var || '--x' });
  console.log(`${desktop ? 'počítač' : 'telefón'} CPU ${cpu}x`, r);
  await ctx.close();
} finally { await browser.close(); }
