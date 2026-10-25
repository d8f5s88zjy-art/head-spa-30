// Rovnaký časový priebeh pre PRED aj PO: 9 s po load, potom poloha, 4 s pokoj, snímka. node rovnako.mjs <url> <out> <tag>
import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const [url, out, tag] = process.argv.slice(2);
const b = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const o = {};
for (const [meno, vp, dpr, mobil] of [['telefon', { width: 390, height: 844 }, 3, true], ['pocitac', { width: 1440, height: 900 }, 1, false]]) {
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: dpr, isMobile: mobil, hasTouch: mobil, locale: 'sk-SK', colorScheme: 'dark' });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'load' });
  await sleep(9000);
  for (const [n, f] of [['r-stred', () => { const s = document.querySelector('#sluzby'); scrollTo(0, s.getBoundingClientRect().top + scrollY + innerHeight * 0.6); }], ['r-koniec', () => scrollTo(0, document.documentElement.scrollHeight)]]) {
    await p.evaluate(f); await sleep(5000);
    o[meno + n] = await p.evaluate(() => ({ sy: Math.round(scrollY), c: document.documentElement.className }));
    await p.screenshot({ path: `${out}/${tag}-${meno}-${n}.png` });
  }
  await ctx.close();
}
await b.close();
console.log(JSON.stringify(o));
