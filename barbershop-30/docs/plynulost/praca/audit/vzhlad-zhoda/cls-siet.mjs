#!/usr/bin/env node
// CLS prvého načítania pri pomalšej sieti (150 ms RTT, 1,6 Mb/s ako Lighthouse mobil) a CPU 4× (telefón):
// telefón 390×844 a počítač 1440×900, predvolená adresa ?uvod=off, zdroje posunov.  node cls-siet.mjs [--port=8211]
import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const port = (process.argv.find((a) => a.startsWith('--port=')) || '--port=8211').split('=')[1];
const browser = await chromium.launch();
for (const [dn, w, h, mob] of [['p390', 390, 844, true], ['d1440', 1440, 900, false]]) {
  for (let run = 0; run < 2; run++) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: mob ? 3 : 1, isMobile: mob, hasTouch: mob });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6e6 / 8, uploadThroughput: 750e3 / 8 });
    if (mob) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await page.addInitScript(() => { window.__ls = []; new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (!e.hadRecentInput) window.__ls.push({ v: +e.value.toFixed(4), t: Math.round(e.startTime), src: (e.sources || []).map((s) => { const n = s.node; return n ? (n.id ? '#' + n.id : '') + (n.className && typeof n.className === 'string' ? '.' + n.className.trim().split(/\s+/)[0] : n.nodeName) : '?'; }) }); })).observe({ type: 'layout-shift', buffered: true }); });
    await page.goto(`http://127.0.0.1:${port}/barbershop-30/?uvod=off`, { waitUntil: 'load', timeout: 120000 });
    await page.waitForTimeout(4000);
    const ls = await page.evaluate(() => window.__ls);
    const fonts = await page.evaluate(() => performance.getEntriesByType('resource').filter((r) => /woff2/.test(r.name)).map((r) => `${r.name.split('/').pop()} ${Math.round(r.responseEnd)}ms`));
    console.log(dn, 'beh', run, 'CLS', ls.reduce((a, e) => a + e.v, 0).toFixed(4), JSON.stringify(ls.filter((e) => e.v > 0.0005)), '| písma', fonts.join(', '));
    await ctx.close();
  }
}
await browser.close();
