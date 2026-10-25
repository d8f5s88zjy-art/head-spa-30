import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const urls = process.argv.slice(2);
const b = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
for (let k = 0; k < 2; k++) for (const url of urls) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, locale: 'sk-SK', colorScheme: 'dark' });
  const p = await ctx.newPage(); await p.goto(url, { waitUntil: 'load' }); await sleep(7000);
  const r = [];
  for (const t of [0, 1]) { await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await sleep(3000); r.push(await p.evaluate(() => ({ sh: document.documentElement.scrollHeight, sy: Math.round(scrollY), f: Math.round(document.querySelector('.site-footer').getBoundingClientRect().height), sekcie: [...document.querySelectorAll('main > *, body > section')].map((e) => Math.round(e.getBoundingClientRect().height)).join(',') }))); }
  console.log(url.includes('8722') ? 'PRED' : 'PO  ', JSON.stringify(r));
  await ctx.close();
}
await b.close();
