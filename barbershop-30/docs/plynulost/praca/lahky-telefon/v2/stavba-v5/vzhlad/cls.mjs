import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const b = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
for (const url of process.argv.slice(2)) for (const tap of [false, true]) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: 'sk-SK', colorScheme: 'dark' });
  await ctx.addInitScript(() => { window.__s = []; new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__s.push({ t: Math.round(e.startTime), v: +e.value.toFixed(4), r: e.hadRecentInput, src: (e.sources || []).map((s) => s.node ? (s.node.className || s.node.nodeName) + '' : '?').join('|') }); }).observe({ type: 'layout-shift', buffered: true }); });
  const p = await ctx.newPage(); await p.goto(url, { waitUntil: 'load' }); await sleep(5800);
  await p.evaluate(() => { const s = document.querySelector('#sluzby'); scrollTo(0, s.getBoundingClientRect().top + scrollY + innerHeight * 0.6); });
  await sleep(1200);
  let t = null;
  if (tap && await p.locator('.recepcia-btn').count()) { t = await p.evaluate(() => Math.round(performance.now())); await p.tap('.recepcia-btn'); await sleep(800); await p.keyboard.press('Escape'); }
  await sleep(2500);
  console.log(url.includes('8722') ? 'PRED' : 'PO  ', 'tap', tap, 'tapT', t, JSON.stringify(await p.evaluate(() => window.__s)));
  await ctx.close();
}
await b.close();
