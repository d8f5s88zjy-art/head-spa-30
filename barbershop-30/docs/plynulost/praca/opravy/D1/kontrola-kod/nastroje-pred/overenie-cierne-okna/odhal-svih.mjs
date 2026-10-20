// CO-6: koľko plochy okna zaberajú skryté tímové karty (.team-card.reveal) a kroky (.steps li) počas skutočného
// dotykového švihu a skoku z menu. Meria sa v stránke každú snímku (requestAnimationFrame): plocha prvkov v okne,
// ktorých vypočítaná opacity < 0.15; zvlášť plocha kariet s nenačítanou fotkou. Telefón 390×844 DPR 3, CPU 4×, Fast 4G.
//   node odhal-svih.mjs [--cache=warm|cold] [--port=8402]
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const CACHE = arg('cache', 'warm'), PORT = arg('port', '8402');
const URL0 = `http://127.0.0.1:${PORT}/barbershop-30/?film=off`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
await ctx.addInitScript(() => {
  const O = window.__od = [];
  const f = () => {
    const H = innerHeight, W = innerWidth; let hid = 0, noimg = 0;
    document.querySelectorAll('.team-card, .steps li').forEach((el) => {
      const r = el.getBoundingClientRect(); if (r.bottom <= 0 || r.top >= H || r.right <= 0 || r.left >= W || !r.width) return;
      const a = (Math.min(r.bottom, H) - Math.max(r.top, 0)) * (Math.min(r.right, W) - Math.max(r.left, 0));
      if (+getComputedStyle(el).opacity < 0.15) hid += a;
      else { const im = el.querySelector('img'); if (im && !(im.complete && im.naturalWidth)) noimg += a; }
    });
    O.push([Math.round(performance.now()), Math.round(scrollY), +(hid / (W * H)).toFixed(3), +(noimg / (W * H)).toFixed(3)]);
    requestAnimationFrame(f);
  };
  requestAnimationFrame(f);
});
if (CACHE === 'warm') {
  const p0 = await ctx.newPage(); await p0.goto(URL0, { waitUntil: 'load' }); await sleep(1500);
  const tot = await p0.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < tot; y += 420) { await p0.evaluate((yy) => scrollTo({ top: yy, behavior: 'instant' }), y); await sleep(300); }
  await p0.close();
}
const p = await ctx.newPage(); const c = await ctx.newCDPSession(p);
await c.send('Network.enable'); if (CACHE === 'cold') await c.send('Network.clearBrowserCache');
await c.send('Network.emulateNetworkConditions', { offline: false, latency: 165, downloadThroughput: 1012500, uploadThroughput: 168750 });
await c.send('Emulation.setCPUThrottlingRate', { rate: 4 });
await p.goto(URL0, { waitUntil: 'load' }); await sleep(2500);
const marks = [];
const res = [];
const mark = async (m) => { if (marks.length) await flush(); marks.push([await p.evaluate(() => Math.round(performance.now())), m]); };
async function flush() {
  const [t0, nm] = marks[marks.length - 1];
  const seg = (await p.evaluate(() => window.__od.splice(0))).filter((r) => r[0] >= t0);
  res.push([nm, t0, seg]);
}
async function swipe(dy, speed) {
  const x = 195, s = Math.sign(dy), dist = Math.min(Math.abs(dy), 506), y0 = s > 0 ? 675 : 169, steps = Math.max(2, Math.round(dist / speed * 1000 / 16));
  const sent = [c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: y0 }] })];
  for (let k = 1; k <= steps; k++) { await sleep(16); sent.push(c.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: Math.round(y0 - s * dist * k / steps) }] })); }
  sent.push(c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })); await Promise.all(sent);
}
// 1) švih nadol cez tím a cenník (od karty Ľudia po koniec cenníka)
await p.evaluate(() => scrollTo({ top: 2700, behavior: 'instant' })); await sleep(1500);
await mark('svih');
for (let k = 0; k < 10 && (await p.evaluate(() => scrollY)) < 9600; k++) { await swipe(500, 5000); await sleep(900); }
await sleep(1500);
// 2) pomalý ťah (krátke ťahy 250 px, 1200 px/s) cez tím
// nová stránka, aby karty neboli odhalené (IntersectionObserver ich po prvom odhalení už nesleduje)
await flush(); marks.push([0, '-']); await p.reload({ waitUntil: 'load' }); await sleep(2500);
await p.evaluate(() => scrollTo({ top: 3300, behavior: 'instant' })); await sleep(1500); await mark('pomaly');
for (let k = 0; k < 6; k++) { await swipe(250, 1200); await sleep(700); }
await sleep(1500);
// 3) skok z menu na Tím z úvodu (nová stránka, aby karty neboli odhalené)
await flush(); marks.push([0, '-']); await p.reload({ waitUntil: 'load' }); await sleep(2500);
{ const t = await (await p.$('.nav-toggle')).boundingBox(); await p.touchscreen.tap(t.x + t.width / 2, t.y + t.height / 2); } await sleep(800); await mark('menu #tim');
const a = await p.$('#nav a[href="#tim"]'); const bb = await a.boundingBox(); await p.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 2);
await sleep(4000);
await p.evaluate(() => scrollTo({ top: 0, behavior: 'instant' })); await sleep(1500);
{ const t = await (await p.$('.nav-toggle')).boundingBox(); await p.touchscreen.tap(t.x + t.width / 2, t.y + t.height / 2); } await sleep(800); await mark('menu #sluzby');
const a2 = await p.$('#nav a[href="#sluzby"]'); const b2 = await a2.boundingBox(); await p.touchscreen.tap(b2.x + b2.width / 2, b2.y + b2.height / 2);
await sleep(3000);
// cenník s krokmi je pod kartou Služby: posun prstom k nemu
await mark('k cenniku'); for (let k = 0; k < 3; k++) { await swipe(500, 3000); await sleep(900); }
await sleep(1500);
await flush();
await b.close();
// vyhodnotenie: úseky so skrytou plochou >= 20 % okna a ich trvanie
for (const [nm, t0, seg] of res) {
  if (nm === '-') continue;
  let mx = 0, my = 0, run = null; const ev = [];
  for (const r of seg) {
    if (r[2] > mx) { mx = r[2]; my = r[1]; }
    if (r[2] >= 0.2 && !run) run = [r[0], r[1], r[2]];
    else if (r[2] >= 0.2) run[2] = Math.max(run[2], r[2]);
    if (r[2] < 0.2 && run) { ev.push([run[0] - t0, r[0] - run[0], run[1], run[2]]); run = null; }
  }
  if (run) ev.push([run[0] - t0, seg[seg.length - 1][0] - run[0], run[1], run[2]]);
  const ni = Math.max(0, ...seg.map((r) => r[3]));
  console.log(`${nm}: snímok ${seg.length}, y ${Math.min(...seg.map((r) => r[1]))}–${Math.max(...seg.map((r) => r[1]))}, najviac skrytej plochy ${(mx * 100).toFixed(0)} % (y ${my}); úseky >= 20 %: ${ev.length ? ev.map((e) => `${e[0]} ms +${e[1]} ms y${e[2]} ${(e[3] * 100).toFixed(0)} %`).join('; ') : 'žiadne'}; karty bez fotky najviac ${(ni * 100).toFixed(0)} %`);
}
