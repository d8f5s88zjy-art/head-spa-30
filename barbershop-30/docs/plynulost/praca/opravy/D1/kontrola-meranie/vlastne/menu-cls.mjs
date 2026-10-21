// Kontrola merania D1: skok rozloženia v menu na telefóne, keď sa menu otvorí skôr, než sa načíta modul jazykov.
// Telefón 390×844 DPR 3, dotyk, CPU 4×, ?uvod=off&hudba=off. V čase --t (ms po udalosti load) sa ťukne na Menu, potom
// sa 5 s sleduje poloha prvého odkazu menu (top), počet prvkov .lang v menu a Layout Shift (aj s hadRecentInput).
//   node menu-cls.mjs --port=8432 --net=fast4g|slow4g --t=1000 --n=2 --meno=po
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.length ? v.join('=') : true]; }));
const PORT = opt.port || '8432', NETN = opt.net || 'fast4g', T = Number(opt.t ?? 1000), N = Number(opt.n || 2);
const NET = {
  fast4g: { offline: false, latency: 165, downloadThroughput: 9e6 / 8 * 0.9, uploadThroughput: 1.5e6 / 8 * 0.9 },
  slow4g: { offline: false, latency: 562.5, downloadThroughput: 1.6e6 / 8 * 0.9, uploadThroughput: 750e3 / 8 * 0.9 },
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: 'sk-SK',
  userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36' };
const browser = await chromium.launch({ headless: true, args: ['--enable-gpu-rasterization', '--ignore-gpu-blocklist'] });
const out = [];
for (let i = 0; i < N; i++) {
  const ctx = await browser.newContext(PHONE);
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', NET[NETN]);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.addInitScript(() => {
    window.__ls = [];
    try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__ls.push({ t: Math.round(e.startTime), v: +e.value.toFixed(5), vstup: e.hadRecentInput }); }).observe({ type: 'layout-shift', buffered: true }); } catch (e) {}
  });
  await page.goto(`http://127.0.0.1:${PORT}/barbershop-30/?uvod=off&hudba=off`, { waitUntil: 'load', timeout: 120000 });
  const tLoad = await page.evaluate(() => performance.now());
  await sleep(Math.max(0, T));
  const t0 = await page.evaluate(() => performance.now());
  await page.tap('.nav-toggle');
  const trace = [];
  for (let k = 0; k < 50; k++) {
    await sleep(100);
    trace.push(await page.evaluate(() => {
      const nav = document.getElementById('nav');
      const a = nav && [...nav.querySelectorAll('a')].find((x) => /Prehliadka|Služby|Kontakt/.test(x.textContent));
      const r = a && a.getBoundingClientRect();
      return { t: Math.round(performance.now()), top: r ? Math.round(r.top) : null, lang: nav ? nav.querySelectorAll('.lang, [data-lang-pick]').length : 0, open: document.documentElement.classList.contains('nav-open') || !!document.querySelector('.nav-toggle[aria-expanded="true"]') };
    }));
  }
  const ls = await page.evaluate((t0) => window.__ls.filter((e) => e.t >= t0 - 50), t0);
  const tops = [...new Set(trace.filter((x) => x.open && x.top != null).map((x) => x.top))];
  const prvyLang = trace.find((x) => x.lang > 0);
  out.push({ meno: opt.meno, net: NETN, tuk_po_load_ms: Math.round(t0 - tLoad), beh: i + 1, polohy_odkazu: tops, jazyky_od_ms: prvyLang ? Math.round(prvyLang.t - t0) : null, cls_po_tuknuti: +ls.reduce((s, e) => s + e.v, 0).toFixed(4), cls_bez_vstupu: +ls.filter((e) => !e.vstup).reduce((s, e) => s + e.v, 0).toFixed(4), posuny: ls.length });
  if (i === 0 && opt.snimka) {
    await page.screenshot({ path: `${opt.snimka}.png` });
  }
  await ctx.close();
}
await browser.close();
for (const o of out) console.log(JSON.stringify(o));
