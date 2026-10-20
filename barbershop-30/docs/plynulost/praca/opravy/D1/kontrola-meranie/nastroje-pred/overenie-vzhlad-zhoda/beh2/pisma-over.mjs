#!/usr/bin/env node
// Overenie VZ-13: kedy prídu súbory písma pri pomalšej sieti (RTT 150 ms, 1,6 Mb/s, CPU 4× na telefóne) a kedy
// je Manrope 700 (nadpisok úvodu, tlačidlá) naozaj použité; FCP a LCP pre porovnanie. node pisma-over.mjs --dev=p390|d1440
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const mob = (opt.dev || 'p390') === 'p390';
const browser = await chromium.launch();
const res = [];
for (let run = 0; run < 3; run++) {
  const ctx = await browser.newContext(mob ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true } : { viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6e6 / 8, uploadThroughput: 750e3 / 8 });
  if (mob) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.addInitScript(() => {
    window.__lcp = 0; try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true }); } catch (e) {}
    window.__f700 = 0; const t = setInterval(() => { if (document.fonts && document.fonts.check('700 12px Manrope') && [...document.fonts].some((f) => f.family.replace(/"/g, '') === 'Manrope' && f.weight === '700' && f.status === 'loaded')) { window.__f700 = performance.now(); clearInterval(t); } }, 20);
  });
  await page.goto('http://127.0.0.1:8430/barbershop-30/?uvod=off', { waitUntil: 'load', timeout: 120000 });
  await page.waitForTimeout(4000);
  const r = await page.evaluate(() => {
    const fonts = performance.getEntriesByType('resource').filter((e) => /fonts\/.*woff2/.test(e.name)).map((e) => ({ f: e.name.split('/').pop(), start: Math.round(e.startTime), end: Math.round(e.responseEnd) }));
    const fcp = (performance.getEntriesByName('first-contentful-paint')[0] || {}).startTime;
    return { fcp: Math.round(fcp || 0), lcp: Math.round(window.__lcp), manrope700_pouzite: Math.round(window.__f700), fonts };
  });
  res.push(r); console.log(JSON.stringify(r));
  await ctx.close();
}
fs.writeFileSync(`merania/pisma-${mob ? 'p390' : 'd1440'}.json`, JSON.stringify(res, null, 1));
await browser.close();
