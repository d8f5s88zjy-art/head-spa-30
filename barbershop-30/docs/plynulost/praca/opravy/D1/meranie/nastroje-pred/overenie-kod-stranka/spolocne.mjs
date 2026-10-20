// Spoločné pomôcky meraní auditu kódu stránky (kod-stranka): prehliadač s emuláciou telefónu, sieť, CPU,
// dotykový skrol cez CDP a záznam trace. Použitie z ostatných skriptov v tomto priečinku.
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
export const { chromium } = require('playwright');

export const BASE = process.env.BASE || 'http://127.0.0.1:8310/barbershop-30/';
export const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.length ? v.join('=') : true]; }));

// DevTools predvoľby sietí (Chrome 141): Fast 4G a Slow 4G
export const NET = {
  fast4g: { offline: false, latency: 165, downloadThroughput: 9 * 1000 * 1000 / 8 * 0.9, uploadThroughput: 1.5 * 1000 * 1000 / 8 * 0.9 },
  slow4g: { offline: false, latency: 562.5, downloadThroughput: 1.6 * 1000 * 1000 / 8 * 0.9, uploadThroughput: 750 * 1000 / 8 * 0.9 },
  none: null,
};

export const PHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: 'sk-SK',
  userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36' };
export const DESK = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, locale: 'sk-SK' };

// 'cc' a 'disabled-by-default-devtools.timeline.picture' sa nezapínajú: snímky vrstiev (picture) v Commit dekódujú
// obrázky na hlavnom vlákne a predĺžia commit na sekundy (artefakt merania, overené v prvom behu)
export const CATS = [
  'toplevel', 'devtools.timeline', 'disabled-by-default-devtools.timeline', 'disabled-by-default-devtools.timeline.frame',
  'disabled-by-default-devtools.timeline.stack', 'blink.user_timing', 'loading', 'v8.execute', 'latencyInfo',
];
export const CATS_INV = [...CATS, 'disabled-by-default-devtools.timeline.invalidationTracking'];

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

// dotykový ťah prstom cez Input.dispatchTouchEvent (synthesizeScrollGesture s dotykom v tomto Chromiu neskroluje,
// rovnako zistil audit čiernych okien); dy > 0 = nadol po stránke; dlhší ťah sa rozdelí na viac ťahov po 60 % výšky;
// fling = pustenie v pohybe (zotrvačnosť dorobí Chrome), inak prst zastane a až potom sa zdvihne
export async function swipe(cdp, { dy, speed = 1200, x = 195, fling = false, dx = 0, H = 844, y0 } = {}) {
  const s = Math.sign(dy) || 1;
  let left = Math.abs(dy);
  while (left > 0) {
    const dist = Math.min(left, Math.round(H * 0.6));
    left -= dist;
    const ys = y0 ?? (s > 0 ? Math.round(H * 0.8) : Math.round(H * 0.2));
    const steps = Math.max(2, Math.round(dist / (speed * 0.016)));
    const sent = [cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: ys }] })];
    for (let k = 1; k <= steps; k++) {
      await sleep(16);
      sent.push(cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: Math.round(x - (dx ? Math.sign(dx) * Math.min(Math.abs(dx), 300) * k / steps : 0)), y: Math.round(ys - s * (dy ? dist : 0) * k / steps) }] }));
    }
    if (!fling) { await sleep(120); }
    sent.push(cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }));
    await Promise.all(sent);
    if (left > 0) await sleep(fling ? 60 : 40);
  }
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
