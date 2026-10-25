// Počítač: rovnaké časovanie pre PRED/PO (9 s + 5 s) a skrol pri zmene jazyka (telefón aj počítač). node rovnako2.mjs <url> <out> <tag>
import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const [url, out, tag] = process.argv.slice(2);
const b = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const o = {};
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, locale: 'sk-SK', colorScheme: 'dark' });
  const p = await ctx.newPage(); await p.goto(url, { waitUntil: 'load' }); await sleep(9000);
  await p.evaluate(() => { const s = document.querySelector('#sluzby'); scrollTo(0, s.getBoundingClientRect().top + scrollY + innerHeight * 0.6); }); await sleep(5000);
  o.stred = await p.evaluate(() => Math.round(scrollY));
  await p.screenshot({ path: `${out}/${tag}-pocitac-r-stred.png` });
  await p.click('.lang-btn'); await sleep(300); await p.click('.lang-menu [data-lang-pick="uk"]'); await sleep(1500);
  o.pocitacPoUk = await p.evaluate(() => Math.round(scrollY));
  await ctx.close();
}
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, locale: 'sk-SK', colorScheme: 'dark' });
  const p = await ctx.newPage(); await p.goto(url, { waitUntil: 'load' }); await sleep(5000);
  await p.evaluate(() => { const s = document.querySelector('#sluzby'); scrollTo(0, s.getBoundingClientRect().top + scrollY + innerHeight * 0.6); }); await sleep(1500);
  o.telefonPred = await p.evaluate(() => Math.round(scrollY));
  await p.tap('.nav-toggle'); await sleep(500); await p.tap('.site-header [data-lang-pick="uk"]'); await sleep(1200);
  if (await p.evaluate(() => document.querySelector('.site-header').dataset.menu === 'open')) { await p.tap('.nav-toggle'); await sleep(500); }
  o.telefonPoUk = await p.evaluate(() => Math.round(scrollY));
  await ctx.close();
}
await b.close();
console.log(JSON.stringify(o));
