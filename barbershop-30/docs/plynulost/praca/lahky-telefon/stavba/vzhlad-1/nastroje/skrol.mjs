// Skrol po celej stránke na telefóne: 3 švihy (dotyk s doběhom), skok z menu na Služby, potom ťahy až po pätičku.
// Pasívna sonda (V5): žiadne decode(), číta len príznak aplikácie img.__dec, opacity, complete/naturalWidth; screencast na tmu.
// node skrol.mjs <port> <outdir> <w>x<h> [query]
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const [port, OUT, size, Q = ''] = process.argv.slice(2);
const [W, H] = size.split('x').map(Number);
const url = `http://127.0.0.1:${port}/barbershop-30/${Q}`;
fs.mkdirSync(OUT, { recursive: true });
const SONDA = `(() => {
  const r = window.__s = { n: 0, titul: { nestiahnuta: 0, nedekod: 0, poistka: 0 }, ine: 0, pr: [], maxZobr: 0, gl: 0, hraju: 0, videaZobr: 0, videaBezPlagatu: 0 };
  const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (k, ...a) { const c = g.call(this, k, ...a); if (c && /webgl/.test(k)) r.gl++; return c; };
  const vo = new Set();
  const start = () => {
    const io = new IntersectionObserver((es) => { for (const e of es) e.isIntersecting ? vo.add(e.target) : vo.delete(e.target); });
    const sled = () => { for (const i of document.querySelectorAll('img, video')) if (!i.__sl && !i.closest('.film-still')) { i.__sl = 1; io.observe(i); } };
    sled(); new MutationObserver(sled).observe(document.body, { childList: true, subtree: true });
    const eff = (el) => { let o = 1; for (let e = el, k = 0; e && e.nodeType === 1 && k < 12; e = e.parentElement, k++) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return 0; o *= +cs.opacity; if (o < 0.01) return 0; } return o; };
    const krok = () => {
      r.n++; const t = Math.round(performance.now()); let zobr = 0;
      for (const s of document.querySelectorAll('.film-shot.is-title .film-still')) {
        const cs = getComputedStyle(s); if (cs.display === 'none') continue; zobr++;
        if (cs.visibility !== 'visible' || +cs.opacity <= 0.01) continue;
        const i = s.querySelector('img'); const shot = s.closest('.film-shot').dataset.shot;
        if (!(i && i.complete && i.naturalWidth > 0)) { r.titul.nestiahnuta++; if (r.pr.length < 30) r.pr.push(['titul-nestiahnuta', shot, t, +(+cs.opacity).toFixed(2)]); }
        else if (!i.__dec) { const prva = s.closest('.film-shot').matches('#uvod .film-shot'); if (prva) r.titul.poistka++; else { r.titul.nedekod++; if (r.pr.length < 30) r.pr.push(['titul-nedekod', shot, t, +(+cs.opacity).toFixed(2)]); } }
        const v = s.querySelector('video'); if (v) { const vc = getComputedStyle(v); if (vc.display !== 'none' && +vc.opacity > 0.01 && v.readyState < 2 && !(v.poster)) r.videaBezPlagatu++; }
      }
      r.maxZobr = Math.max(r.maxZobr, zobr);
      for (const i of vo) {
        if (i.tagName === 'VIDEO') { if (!i.paused) r.hraju = Math.max(r.hraju, [...document.querySelectorAll('video')].filter((v) => !v.paused).length); continue; }
        if (i.complete && i.naturalWidth > 0) continue;
        if (eff(i) > 0.01) { r.ine++; if (r.pr.length < 30) r.pr.push(['ina-nestiahnuta', (i.currentSrc || i.src || '').split('/').pop(), t]); }
      }
      r.hraju = Math.max(r.hraju, [...document.querySelectorAll('video')].filter((v) => !v.paused).length);
      requestAnimationFrame(krok);
    };
    requestAnimationFrame(krok);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();`;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: 'dark' });
await ctx.addInitScript(SONDA);
const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
const req = []; page.on('request', (r) => req.push(r.url()));
const errs = []; page.on('pageerror', (e) => errs.push(e.message));
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
await cdp.send('Network.enable');
await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 165, downloadThroughput: 9e6 / 8 * 0.9, uploadThroughput: 9e6 / 8 * 0.9 });
const frames = []; const fdir = path.join(OUT, 'f'); fs.mkdirSync(fdir, { recursive: true });
cdp.on('Page.screencastFrame', (f) => { const file = path.join(fdir, `f${String(frames.length).padStart(5, '0')}.jpg`); fs.writeFileSync(file, Buffer.from(f.data, 'base64')); frames.push({ file, ts: f.metadata.timestamp * 1000 }); cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}); });
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 45, maxWidth: Math.round(W * 0.6), maxHeight: Math.round(H * 0.6), everyNthFrame: 1 });
const t0 = Date.now(); const udalosti = [];
const ev = async (n) => udalosti.push({ n, t: Date.now() - t0, y: await page.evaluate(() => Math.round(scrollY)) });
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
await page.waitForTimeout(1500); await ev('pred-svihom');
// ťah prstom cez CDP (synthesizeScrollGesture s dotykom v tomto Chromiu neposúva); švih = 3 rýchle ťahy po 0,75 okna bez prestávky
const tah = async (d, ms) => { const n = Math.max(4, Math.round(ms / 16)), x = Math.round(W / 2), y0 = Math.round(H * 0.85);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: y0 }] });
  for (let i = 1; i <= n; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: Math.round(y0 - d * i / n) }] }); await new Promise((r) => setTimeout(r, 16)); }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); };
const svih = async () => { for (let k = 0; k < 3; k++) await tah(Math.round(H * 0.75), 110); };
for (let k = 0; k < 3; k++) { await svih(); await page.waitForTimeout(700); await ev('svih' + (k + 1)); }
await page.waitForTimeout(800);
// skok z menu na Služby
await page.tap('.nav-toggle'); await page.waitForTimeout(500); await ev('menu');
const tSkok = Date.now() - t0; await page.tap('#nav a[href="#' + (process.env.SKOK || 'galeria') + '"]'); await ev('skok-' + (process.env.SKOK || 'galeria'));
await page.waitForTimeout(3000); await ev('po-skoku');
// ďalej ťahmi až po pätičku
for (let k = 0; k < 40; k++) {
  const [y, m] = await page.evaluate(() => [scrollY, document.documentElement.scrollHeight - innerHeight]);
  if (y >= m - 2) break;
  await tah(Math.round(H * 0.7), 220); await page.waitForTimeout(250);
}
await page.waitForTimeout(1500); await ev('koniec');
await cdp.send('Page.stopScreencast');
const s = await page.evaluate(() => ({ ...window.__s, cls: document.documentElement.className, y: Math.round(scrollY), max: document.documentElement.scrollHeight - innerHeight }));
const film = req.filter((u) => /three|film\.js|film-worker|\/seq\/|hlbka/.test(u));
fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify({ W, H, t0, tSkok, udalosti, frames, sonda: s, film, poziadavky: req.length, errs }, null, 1));
console.log(JSON.stringify({ W, sonda: s, udalosti, tSkok, film, poziadavky: req.length, errs, snimok: frames.length }));
await browser.close();
