// Čierny štart (kontrola vzhľadu 1): telefón DPR 3, dotyk, CPU 4×, Fast 4G; screencast prvých 3,2 s + vzorky DOM v 0/300/800/1500/3000 ms.
// node start.mjs <port> <outdir> <w>x<h> [scenáre čiarkou]
// Scenáre: prva, reload3000, tim, kontakt, spat, en
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const [port, OUT, size, only] = process.argv.slice(2);
const [W, H] = size.split('x').map(Number);
const Q = process.env.Q || '';
const base0 = `http://127.0.0.1:${port}/barbershop-30/`;
const base = base0 + Q;
const SC = (only || 'prva,reload3000,tim,kontakt,spat,en').split(',');
fs.mkdirSync(OUT, { recursive: true });
const VZORKA = `(() => {
  const vis = (el) => { if (!el) return 0; const r = el.getBoundingClientRect(); if (r.bottom <= 0 || r.top >= innerHeight || r.width < 2 || r.height < 2) return 0;
    let o = 1; for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return 0; o *= +cs.opacity; } return +o.toFixed(2); };
  window.__vz = (t) => { const h = document.documentElement; const st = [...document.querySelectorAll('.film-shot.is-title .film-still')].map((s) => { const cs = getComputedStyle(s); if (cs.display === 'none') return null; const i = s.querySelector('img');
      return [s.closest('.film-shot').dataset.shot, (+cs.opacity).toFixed(2), !!(i && i.complete && i.naturalWidth), i && i.__dec ? 'dec' : '-', s.closest('.film-shot').classList.contains('is-hold') ? 'hold' : '', i && i.classList.contains('nacitana') ? 'nac' : '']; }).filter(Boolean);
    const mid = innerHeight / 2; const cur = [...document.querySelectorAll('.film-shot')].find((e) => { const r = e.getBoundingClientRect(); return r.top <= mid && r.bottom > mid; });
    return { t, y: Math.round(scrollY), cls: h.className, h1: vis(document.getElementById('h-uvod')), btn: vis(document.querySelector('#uvod .title-actions .btn-primary')),
      lista: vis(document.querySelector('.site-header')), cta: vis(document.getElementById('mobile-cta')), near: [...document.querySelectorAll('.film-shot.is-near')].map((e) => e.dataset.shot), st, cur: cur ? cur.dataset.shot : null,
      gl: window.__gl || 0 }; };
  window.__vzorky = []; for (const t of [0, 300, 800, 1500, 2200, 3000]) setTimeout(() => { try { window.__vzorky.push(window.__vz(t)); } catch (e) { window.__vzorky.push({ t, err: String(e) }); } }, t);
  const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (k, ...a) { const c = g.call(this, k, ...a); if (c && /webgl/.test(k)) window.__gl = (window.__gl || 0) + 1; return c; };
})();`;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const vysledky = [];
async function nova(extraInit) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: 'dark' });
  if (extraInit) await ctx.addInitScript(extraInit);
  await ctx.addInitScript(VZORKA);
  const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', (process.env.SIET === 'slow' ? { offline: false, latency: 562.5, downloadThroughput: 180000, uploadThroughput: 84000 } : { offline: false, latency: 165, downloadThroughput: 9e6 / 8 * 0.9, uploadThroughput: 9e6 / 8 * 0.9 }));
  return { ctx, page, cdp };
}
async function natoc(cdp, dir, akcia) {
  fs.mkdirSync(dir, { recursive: true });
  const frames = [];
  const on = async (f) => { const n = frames.length; const file = path.join(dir, `f${String(n).padStart(4, '0')}.jpg`); fs.writeFileSync(file, Buffer.from(f.data, 'base64')); frames.push({ file, ts: f.metadata.timestamp * 1000 }); cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}); };
  cdp.on('Page.screencastFrame', on);
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 70, maxWidth: W, maxHeight: H, everyNthFrame: 1 });
  const t0 = Date.now();
  await akcia();
  await new Promise((r) => setTimeout(r, +(process.env.DLZKA || 3300)));
  await cdp.send('Page.stopScreencast');
  cdp.off('Page.screencastFrame', on);
  return { t0, frames };
}
for (const sc of SC) {
  const dir = path.join(OUT, `${sc}-${W}`);
  const { ctx, page, cdp } = await nova(sc === 'en' ? `try{if(!sessionStorage.__en){localStorage.setItem('b30.lang','en');sessionStorage.__en=1}}catch(e){}` : null);
  let rec, poBF = null;
  try {
    if (sc === 'prva') rec = await natoc(cdp, dir, () => page.goto(base, { waitUntil: 'commit' }));
    else if (sc === 'tim' || sc === 'kontakt') rec = await natoc(cdp, dir, () => page.goto(base0 + Q + '#' + sc, { waitUntil: 'commit' }));
    else if (sc === 'en') rec = await natoc(cdp, dir, () => page.goto(base, { waitUntil: 'commit' }));
    else if (sc === 'reload3000') {
      await page.goto(base, { waitUntil: 'load', timeout: 90000 });
      await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, 3000); });
      await page.waitForTimeout(2500);
      rec = await natoc(cdp, dir, () => page.reload({ waitUntil: 'commit' }));
    } else if (sc === 'spat') {
      await page.goto(base, { waitUntil: 'load', timeout: 90000 });
      await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, 3000); });
      await page.waitForTimeout(2500);
      await page.goto(`http://127.0.0.1:${port}/pravne.html`, { waitUntil: 'load' });
      await page.waitForTimeout(800);
      rec = await natoc(cdp, dir, () => page.goBack({ waitUntil: 'commit' }));
      poBF = await page.evaluate(() => ({ y: Math.round(scrollY), nav: performance.getEntriesByType('navigation')[0]?.type, vz: window.__vz ? window.__vz('po') : null }));
      // dopredu a znova späť (druhý návrat, často z bfcache)
      await page.goForward({ waitUntil: 'load' }); await page.waitForTimeout(800);
      const rec2 = await natoc(cdp, dir + '-2', () => page.goBack({ waitUntil: 'commit' }));
      const po2 = await page.evaluate(() => ({ y: Math.round(scrollY), vz: window.__vz ? window.__vz('po2') : null }));
      fs.writeFileSync(path.join(dir + '-2', 'meta.json'), JSON.stringify({ sc: sc + '-2', W, H, t0: rec2.t0, frames: rec2.frames, po: po2 }, null, 1));
    }
    const info = await page.evaluate(() => ({ fcp: (performance.getEntriesByName('first-contentful-paint')[0] || {}).startTime ?? null, origin: performance.timeOrigin,
      vzorky: window.__vzorky || null, koniec: window.__vz ? window.__vz('koniec') : null }));
    const req = []; // požiadavky sa v tomto nástroji neskúmajú (pozri siet.mjs)
    fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify({ sc, W, H, t0: rec.t0, frames: rec.frames, ...info, poBF }, null, 1));
    console.log(sc, W, 'frames', rec.frames.length, 'fcp', info.fcp && Math.round(info.fcp), 'koniec', JSON.stringify(info.koniec));
  } catch (e) { console.log(sc, 'CHYBA', e.message); }
  await ctx.close();
}
await browser.close();
