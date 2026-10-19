// Spoločné pomôcky meraní auditu kódu stránky (kod-stranka): prehliadač s emuláciou telefónu, sieť, CPU,
// dotykový skrol cez CDP a záznam trace. Použitie z ostatných skriptov v tomto priečinku.
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
export const { chromium } = require('playwright');

export const BASE = process.env.BASE || 'http://127.0.0.1:8285/barbershop-30/';
export const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.length ? v.join('=') : true]; }));

// DevTools predvoľby sietí (Chrome 141): Fast 4G a Slow 4G
export const NET = {
  fast4g: { offline: false, latency: 165, downloadThroughput: 9 * 1000 * 1000 / 8 * 0.9, uploadThroughput: 1.5 * 1000 * 1000 / 8 * 0.9 },
  slow4g: { offline: false, latency: 562.5, downloadThroughput: 1.6 * 1000 * 1000 / 8 * 0.9, uploadThroughput: 750 * 1000 / 8 * 0.9 },
  none: null,
};

export const PHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36' };
export const DESK = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 };

export const CATS = [
  'toplevel', 'devtools.timeline', 'disabled-by-default-devtools.timeline', 'disabled-by-default-devtools.timeline.frame',
  'disabled-by-default-devtools.timeline.stack', 'disabled-by-default-devtools.timeline.invalidationTracking',
  'blink.user_timing', 'loading', 'v8.execute', 'cc', 'disabled-by-default-devtools.timeline.picture',
];

export async function launch() {
  return chromium.launch({ headless: true, args: ['--enable-gpu-rasterization', '--ignore-gpu-blocklist'] });
}

export async function open(browser, { url, desk = false, cpu = 4, net = 'fast4g', cache = true } = {}) {
  const ctx = await browser.newContext(desk ? DESK : PHONE);
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  if (!cache) await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  if (NET[net]) await cdp.send('Network.emulateNetworkConditions', NET[net]);
  if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
  return { ctx, page, cdp };
}

// dotykový ťah (skutočný skrol kompozitora, nie scrollTo): dy > 0 = nadol po stránke
export async function swipe(cdp, { dy, speed = 1200, x = 195, y = 620, fling = false, dx = 0 } = {}) {
  await cdp.send('Input.synthesizeScrollGesture', {
    x, y, yDistance: -dy, xDistance: -dx, speed, gestureSourceType: 'touch', preventFling: !fling, repeatCount: 1,
  });
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// trace cez CDP Tracing (bez Playwright wrappera, aby šli kategórie disabled-by-default)
export async function traceStart(cdp, cats = CATS) {
  const chunks = [];
  cdp.on('Tracing.dataCollected', (e) => { for (const ev of e.value) chunks.push(ev); });
  await cdp.send('Tracing.start', { traceConfig: { includedCategories: cats, recordMode: 'recordContinuously' }, transferMode: 'ReportEvents' });
  return async () => {
    const done = new Promise((r) => cdp.once('Tracing.tracingComplete', r));
    await cdp.send('Tracing.end');
    await done;
    return chunks;
  };
}
