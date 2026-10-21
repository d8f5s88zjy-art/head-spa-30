// Videá na telefóne: prechod celou stránkou ťahmi s pauzou 1,2 s; hrá najviac 1, plagát pred štartom, posun rozloženia.
// node videa.mjs <port> <w>x<h> <out.json> [query]
import fs from 'node:fs';
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const [port, size, OUT, Q = ''] = process.argv.slice(2);
const [W, H] = size.split('x').map(Number);
const SONDA = `(() => {
  const r = window.__v = { maxHraju: 0, hrajuViac: 0, bezPlagatu: [], posuny: [], cls: 0, videa: {} };
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) { if (e.hadRecentInput) continue; r.cls += e.value; if (e.value > 0.001) r.posuny.push({ t: Math.round(e.startTime), v: +e.value.toFixed(4), y: Math.round(scrollY), src: (e.sources || []).map((s) => s.node ? (s.node.nodeName + '.' + (s.node.className && s.node.className.baseVal === undefined ? String(s.node.className).slice(0, 40) : '')) : '?').slice(0, 3) }); } }).observe({ type: 'layout-shift', buffered: true }); } catch (e) {}
  const krok = () => {
    const vs = [...document.querySelectorAll('video')]; let hraju = 0;
    for (const v of vs) {
      const k = (v.currentSrc || v.getAttribute('src') || v.querySelector('source')?.getAttribute('src') || v.dataset.poster || '?').split('/').pop();
      const rec = r.videa[k] = r.videa[k] || { hralo: false, maxT: 0, plagat: v.getAttribute('poster') || '', w: v.getAttribute('width'), h: v.getAttribute('height') };
      if (!v.paused && !v.ended && v.readyState > 2) { hraju++; rec.hralo = true; rec.maxT = Math.max(rec.maxT, +v.currentTime.toFixed(2)); }
      rec.plagat = v.getAttribute('poster') || rec.plagat;
      const b = v.getBoundingClientRect(); if (b.bottom <= 0 || b.top >= innerHeight || b.width < 2) continue;
      let o = 1; for (let e = v; e && e.nodeType === 1; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') { o = 0; break; } o *= +cs.opacity; }
      if (o > 0.05 && v.readyState < 2 && !v.getAttribute('poster') && r.bezPlagatu.length < 20) r.bezPlagatu.push({ k, t: Math.round(performance.now()), o: +o.toFixed(2) });
    }
    r.maxHraju = Math.max(r.maxHraju, hraju); if (hraju > 1) r.hrajuViac++;
    requestAnimationFrame(krok);
  };
  requestAnimationFrame(krok);
})();`;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: 'dark' });
await ctx.addInitScript(SONDA);
const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
const req = []; page.on('request', (r) => req.push(r.url()));
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
await cdp.send('Network.enable');
await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 165, downloadThroughput: 9e6 / 8 * 0.9, uploadThroughput: 9e6 / 8 * 0.9 });
await page.goto(`http://127.0.0.1:${port}/barbershop-30/${Q}`, { waitUntil: 'load', timeout: 120000 });
await page.waitForTimeout(1500);
const tah = async (d, ms) => { const n = Math.max(4, Math.round(ms / 16)), x = Math.round(W / 2), y0 = Math.round(H * 0.85);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: y0 }] });
  for (let i = 1; i <= n; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: Math.round(y0 - d * i / n) }] }); await new Promise((r) => setTimeout(r, 16)); }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); };
const stopa = [];
for (let k = 0; k < 60; k++) {
  const [y, m] = await page.evaluate(() => [Math.round(scrollY), document.documentElement.scrollHeight - innerHeight]);
  const st = await page.evaluate(() => [...document.querySelectorAll('video')].filter((v) => !v.paused).map((v) => (v.currentSrc || '').split('/').pop()));
  stopa.push([y, st.join(' ')]);
  if (y >= m - 2) break;
  await tah(Math.round(H * 0.55), 300); await page.waitForTimeout(1200);
}
const r = await page.evaluate(() => window.__v);
const vreq = req.filter((u) => /\.(mp4|webm)(\?|$)/.test(u)).map((u) => u.split('/').pop());
const res = { W, H, ...r, stopa: stopa.filter((s) => s[1]), videoPoziadavky: vreq };
fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
console.log(JSON.stringify(res).slice(0, 3000));
await browser.close();
