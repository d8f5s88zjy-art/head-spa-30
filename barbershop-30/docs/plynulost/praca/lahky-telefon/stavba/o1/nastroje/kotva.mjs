// Opravár 1: otvorenie /#kontakt (telefón 390×844 @3, CPU 4×, Fast 4G): kedy prehliadač skočí na kotvu (scrollY po snímkach,
// readyState, udalosti). node kotva.mjs <port> [hash] [cpu] [net f|s]
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const [PORT, HASH = '#kontakt', CPU = '4', NET = 'f'] = process.argv.slice(2);
const N = { f: { offline: false, latency: 165, downloadThroughput: 9e6 / 8 * 0.9, uploadThroughput: 1.5e6 / 8 * 0.9 },
  s: { offline: false, latency: 562.5, downloadThroughput: 1.6e6 / 8 * 0.9, uploadThroughput: 750e3 / 8 * 0.9 } };
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: 'dark' });
await ctx.addInitScript(() => {
  window.__k = []; const t0 = performance.now(); let last = -1;
  const log = (ev) => { const y = Math.round(scrollY); window.__k.push([Math.round(performance.now()), ev, y, document.readyState, document.getElementById('kontakt') ? 1 : 0]); };
  const f = () => { const y = Math.round(scrollY); if (y !== last) { last = y; log('raf'); } requestAnimationFrame(f); }; requestAnimationFrame(f);
  for (const e of ['DOMContentLoaded', 'load', 'pageshow']) addEventListener(e, () => log(e), true);
  addEventListener('scroll', () => log('scroll'), { passive: true, once: true });
  try { new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__k.push([Math.round(e.startTime), 'paint:' + e.name, null, '', 0]))).observe({ type: 'paint', buffered: true }); } catch (e) {}
});
const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
await cdp.send('Network.enable'); await cdp.send('Network.emulateNetworkConditions', N[NET]);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: Number(CPU) });
await page.goto(`http://127.0.0.1:${PORT}/barbershop-30/${HASH}`, { waitUntil: 'load', timeout: 90000 });
await page.waitForTimeout(2500);
const k = await page.evaluate(() => window.__k.sort((a, b) => a[0] - b[0]));
console.log(JSON.stringify(k));
await browser.close();
