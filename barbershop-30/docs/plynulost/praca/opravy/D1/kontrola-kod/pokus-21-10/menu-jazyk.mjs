// N1: menu na telefóne – kedy sa objaví prepínač jazyka a posunú sa odkazy? Pred (8402) vs po (8400).
// node menu-jazyk.mjs --port=8400 --tah=0|1 --cpu=4 --sit=fast|slow --caka=800
import { createRequire } from 'module';
import fs from 'node:fs';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
import { swipe } from './pom.mjs';
const opt = Object.fromEntries(process.argv.slice(2).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const port = opt.port || 8400, tah = opt.tah === '1', cpu = +(opt.cpu || 4), caka = +(opt.caka || 800), sit = opt.sit || 'fast';
const out = opt.out || '/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/barber/opravy/D1/kontrola-kod/pokus-21-10/menu';
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: 'dark' });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
const net = sit === 'slow' ? { latency: 400, downloadThroughput: 400 * 1024 / 8 * 8 / 8, uploadThroughput: 400 * 1024 / 8 } : { latency: 170, downloadThroughput: 9 * 1024 * 1024 / 8, uploadThroughput: 9 * 1024 * 1024 / 8 };
if (sit === 'slow') { net.downloadThroughput = 400 * 1024 / 8 * 1; net.uploadThroughput = 400 * 1024 / 8; net.latency = 2000 / 5; }
await cdp.send('Network.enable');
await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: net.latency, downloadThroughput: net.downloadThroughput, uploadThroughput: net.uploadThroughput });
await page.addInitScript(() => {
  window.__ls = [];
  new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__ls.push({ t: Math.round(e.startTime), v: +e.value.toFixed(4), recent: e.hadRecentInput, src: (e.sources || []).map((s) => (s.node && (s.node.className || s.node.nodeName)) + ':' + Math.round(s.previousRect.y) + '>' + Math.round(s.currentRect.y)).slice(0, 4) }); }).observe({ type: 'layout-shift', buffered: true });
});
await page.goto(`http://127.0.0.1:${port}/barbershop-30/index.html?uvod=off&hudba=off`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__renderDone !== false);
await page.waitForTimeout(caka);
if (tah) { // krátky ťah prstom (skrol) pred otvorením menu
  await swipe(cdp, { dy: 300, speed: 800 });
  await page.waitForTimeout(500);
  await swipe(cdp, { dy: -300, speed: 800, y0: 300 });
  await page.waitForTimeout(500);
}
const t0 = await page.evaluate(() => Math.round(performance.now()));
const yPredTapom = await page.evaluate(() => Math.round(scrollY));
const hasLangBefore = await page.evaluate(() => !!document.querySelector('#nav .lang'));
await page.tap('.nav-toggle');
const trace = [];
for (let i = 0; i < 60; i++) {
  const s = await page.evaluate(() => { const l = document.querySelector('#nav .lang'); const a = [...document.querySelectorAll('#nav a')].find((x) => /Prehliadka|Cenn|Kontakt/.test(x.textContent)); return { t: Math.round(performance.now()), lang: !!l, langH: l ? Math.round(l.getBoundingClientRect().height) : 0, aTop: a ? Math.round(a.getBoundingClientRect().top) : null, txt: a && a.textContent.trim() }; });
  trace.push(s);
  await page.waitForTimeout(100);
  if (s.lang && trace.length > 3 && trace[trace.length - 2].lang) break;
}
const first = trace[0], withLang = trace.find((x) => x.lang);
const ls = await page.evaluate(() => window.__ls);
const res = { port, tah, yPredTapom, cpu, sit, hasLangBefore, tapAt: t0, prvy_odkaz_top: first.aTop, lang_objavil_sa_po_ms: withLang ? withLang.t - t0 : null, odkaz_top_po_prepinaci: withLang ? withLang.aTop : null, posun_px: withLang && first.aTop != null ? withLang.aTop - first.aTop : null, layoutShift: ls, sucet_bez_vstupu: +ls.filter((x) => !x.recent).reduce((a, b) => a + b.v, 0).toFixed(4) };
console.log(JSON.stringify(res));
fs.writeFileSync(`${out}/menu-${port}-tah${tah ? 1 : 0}-${sit}-cpu${cpu}.json`, JSON.stringify({ ...res, trace }, null, 1));
await page.screenshot({ path: `${out}/menu-${port}-tah${tah ? 1 : 0}-${sit}-po.png` });
await browser.close();
