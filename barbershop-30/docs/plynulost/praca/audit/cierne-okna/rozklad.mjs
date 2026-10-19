#!/usr/bin/env node
// Rozklad čierneho plátna filmu po skoku (menu, logo, „Späť hore“) na časti: sieť, rozbalenie (createImageBitmap)
// a nahrávanie do grafiky po pásoch (počet snímok × dĺžka snímky). Z toho sa dá odhadnúť trvanie na skutočnom
// telefóne s grafickou kartou (snímka 16,7 ms), lebo v kontajneri kreslí SwiftShader a snímky trvajú stovky ms.
//   node rozklad.mjs [--dev=phone|desk] [--dpr=3] [--cpu=4] [--net=fast4g|slow4g|none] [--cache=cold|warm] [--port=8174] [--name=X]
// Výstup: rozklad-<name>.json a súhrn na stdout.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const here = path.dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const DEV = arg('dev', 'phone'), CPU = Number(arg('cpu', 4)), NET = arg('net', 'fast4g'), CACHE = arg('cache', 'cold');
const PORT = arg('port', '8174'), DPR = Number(arg('dpr', DEV === 'phone' ? 3 : 1));
const NAME = arg('name', `${DEV}-${NET}-cpu${CPU}-${CACHE}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const NETS = {
  none: null,
  fast4g: { offline: false, latency: 165, downloadThroughput: 1012500, uploadThroughput: 168750, connectionType: 'cellular4g' },
  slow4g: { offline: false, latency: 562.5, downloadThroughput: 180000, uploadThroughput: 84375, connectionType: 'cellular4g' },
};
const VIEW = DEV === 'phone'
  ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: DPR, isMobile: true, hasTouch: true }
  : { viewport: { width: 1440, height: 900 }, deviceScaleFactor: DPR, isMobile: false, hasTouch: false };
const URL0 = `http://127.0.0.1:${PORT}/barbershop-30/?film=on&uvod=off`;

// v stránke: značky blobov podľa adresy, trvanie createImageBitmap, časy snímok (rAF), stav filmu každých 40 ms
const PROBE = `(() => {
  const P = window.__rz = { bmp: [], raf: [], st: [], res: [] };
  const ob = Response.prototype.blob;
  Response.prototype.blob = function () { const u = this.url; return ob.call(this).then((b) => { try { b.__url = u; } catch (e) {} return b; }); };
  const cib = window.createImageBitmap;
  window.createImageBitmap = function (src, ...rest) {
    const t0 = performance.now(), u = src && src.__url ? src.__url.split('/barbershop-30/')[1] : (src && src.constructor ? src.constructor.name : '?');
    return cib.call(this, src, ...rest).then((b) => { P.bmp.push([u, Math.round(t0), Math.round(performance.now() - t0), b.width, b.height]); return b; });
  };
  const loop = (t) => { P.raf.push(Math.round(t)); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
  setInterval(() => {
    const f = window.BS30_FILM; if (!f || !f.state || !f.state.on) return;
    const s = f.state;
    P.st.push([Math.round(performance.now()), Math.round(scrollY), s.current, +s.S.toFixed(3), +s.T.toFixed(3), s.ready.map((r) => (r.ready ? 1 : 0) + (r.loading ? 2 : 0)).join(''), +(+s.mix).toFixed(3), s.frames, s.dpr]);
  }, 40);
  try { new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (/img\\/film|seq\\/|video\\//.test(e.name)) P.res.push([e.name.split('/barbershop-30/')[1], Math.round(e.startTime), Math.round(e.responseEnd), e.transferSize]); })).observe({ type: 'resource', buffered: true }); } catch (e) {}
})();`;

const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ ...VIEW, locale: 'sk-SK' });
await ctx.addInitScript(PROBE);
if (CACHE === 'warm') {
  const p0 = await ctx.newPage();
  await p0.goto(URL0, { waitUntil: 'load' }); await sleep(2000);
  const H = await p0.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += 500) { await p0.evaluate((yy) => scrollTo({ top: yy, behavior: 'instant' }), y); await sleep(400); }
  await p0.close();
}
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await cdp.send('Network.enable');
if (CACHE === 'cold') await cdp.send('Network.clearBrowserCache');
if (NETS[NET]) await cdp.send('Network.emulateNetworkConditions', NETS[NET]);
if (CPU > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
await page.goto(URL0, { waitUntil: 'load', timeout: 180000 });
await sleep(1000);
// film bez prológu čaká na pohyb návštevníka
await page.evaluate(() => { scrollBy(0, 2); dispatchEvent(new Event('scroll')); });
const ready = await page.evaluate(() => Promise.race([window.BS30_FILM.ready, new Promise((r) => setTimeout(() => r('timeout'), 30000))]));
await sleep(6000);
const jumps = [];
const targets = ['#sluzby', '#galeria', '#tim', '#vstup-dnu', '#kontakt', '#uvod'];
for (const h of targets) {
  const t = await page.evaluate((hh) => { const a = document.querySelector(`a[href="${hh}"]`); const t0 = performance.now(); a.click(); return Math.round(t0); }, h);
  jumps.push([h, t]);
  await sleep(NET === 'slow4g' ? 14000 : 8000);
}
const P = await page.evaluate(() => window.__rz);
await browser.close();

// rozbor každého skoku: kedy sa dostal cieľ (záber, na ktorom film zastal) do stavu ready
const out = { name: NAME, dev: DEV, dpr: DPR, cpu: CPU, net: NET, cache: CACHE, ready, jumps: [] };
for (let j = 0; j < jumps.length; j++) {
  const [h, t0] = jumps[j], t1 = j + 1 < jumps.length ? jumps[j + 1][1] : Infinity;
  const st = P.st.filter((x) => x[0] >= t0 && x[0] < t1);
  if (!st.length) continue;
  const last = st[st.length - 1], cur = last[2];
  const idx = (() => { const s = st.find((x) => x[2] === cur); return s; })();
  // index záberu v ceste: poradie znakov v reťazci ready zodpovedá ceste; cieľ = záber s najbližším celým S na konci
  const ci = Math.max(0, Math.min(last[5].length - 1, Math.round(last[3])));
  const tStop = (st.find((x) => Math.abs(x[3] - last[3]) < 0.02) || last)[0];               // film zastal na cieli
  const tReady = (st.find((x) => x[0] >= tStop && (x[5][ci] === '1' || x[5][ci] === '3')) || [null])[0];
  const wasReady = st[0][5][ci] === '1' || st[0][5][ci] === '3';
  const name = cur;
  const res = P.res.filter((r) => r[1] >= t0 - 50 && r[1] < (tReady || t1));
  const bmp = P.bmp.filter((b) => b[1] >= t0 - 50 && b[1] < (tReady || t1));
  const lastBmpEnd = bmp.length ? Math.max(...bmp.map((b) => b[1] + b[2])) : null;
  const lastResEnd = res.length ? Math.max(...res.map((r) => r[2])) : null;
  const frames = lastBmpEnd && tReady ? P.raf.filter((f) => f > lastBmpEnd && f <= tReady) : [];
  const fd = frames.length > 1 ? (frames[frames.length - 1] - frames[0]) / (frames.length - 1) : null;
  const net = lastResEnd != null ? lastResEnd - t0 : 0;
  const dec = bmp.length ? Math.max(...bmp.map((b) => b[2])) : 0;
  out.jumps.push({ kotva: h, zaber: name, ci, uz_pripraveny: wasReady, film_na_cieli_ms: tStop - t0, pripraveny_ms: tReady ? tReady - t0 : null,
    siet_ms: net, subory: res.map((r) => [r[0], r[2] - r[1], r[3]]), rozbalenie_ms: bmp.map((b) => [b[0], b[2], b[3] + 'x' + b[4]]),
    nahratie_snimok: frames.length, nahratie_ms: lastBmpEnd && tReady ? tReady - lastBmpEnd : null, snimka_ms: fd && Math.round(fd),
    // odhad na telefóne s grafikou: sieť + najdlhšie rozbalenie + snímky nahrávania po 16,7 ms + polovica nábehu (450 ms) zo šera
    odhad_realny_ms: tReady ? Math.round(Math.max(net, 0) + dec + frames.length * 16.7 + 225) : null });
}
fs.writeFileSync(path.join(here, `rozklad-${NAME}.json`), JSON.stringify({ ...out, raw: { st: P.st, bmp: P.bmp, res: P.res, jumps } }));
console.log(JSON.stringify({ name: NAME, ready }, null, 0));
for (const j of out.jumps) console.log(`${j.kotva.padEnd(11)} záber ${String(j.zaber).padEnd(18)} pripravený ${j.uz_pripraveny ? 'UŽ BOL' : (j.pripraveny_ms + ' ms')}  sieť ${j.siet_ms} ms  rozbalenie ${JSON.stringify(j.rozbalenie_ms.map((b) => b[1]))}  nahratie ${j.nahratie_snimok} snímok × ${j.snimka_ms} ms = ${j.nahratie_ms} ms  → odhad reálny telefón ${j.odhad_realny_ms} ms`);
