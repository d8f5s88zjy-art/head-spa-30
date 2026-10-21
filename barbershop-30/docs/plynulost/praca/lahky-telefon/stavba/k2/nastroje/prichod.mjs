// Kontrola kolo 2 (len čítanie): V1 a L3 v každom spôsobe príchodu na ľahkom telefóne (390×844 @3, dotyk).
// V každom rAF: viditeľné zálohy (display, visibility, opacity), pripravenosť fotky (complete, naturalWidth, __dec
// z app.js – príznak aplikácie, sonda sama nedekóduje, SKEPTIK V5), aktuálna karta v okolí (is-near), tma (žiadna
// viditeľná záloha, hoci stred okna je v titulnej karte), polotma (najvyššie krytie viditeľných záloh < 0,9).
// Fotky -m sa oneskorujú o DELAY ms (pri "vsetky" aj rohožka úvodu).
import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const ROOT = process.argv[2];
const ONLY = process.argv[3] || '';
const { startStaticServer } = await import(ROOT + '/source/shot.mjs');
const DELAY = Number(process.env.DELAY || 2500);
const srv = await startStaticServer(ROOT);
const browser = await chromium.launch({ headless: true });

const MON = `(() => {
  const sample = () => {
    if (!document.body) return null;
    const st = [...document.querySelectorAll('.film-shot.is-title')];
    if (!st.length) return null;
    const y = scrollY, vh = innerHeight;
    let cur = 0;
    st.forEach((el, i) => { if (el.getBoundingClientRect().top + y <= y + vh * 0.5) cur = i; });
    const anyDec = st.some((el) => { const im = el.querySelector('.film-still img'); return im && im.__dec; });
    let vis = [], maxOp = 0, zle = [], uvodPoistka = false, nahlad = false;
    st.forEach((el, i) => {
      const s = el.querySelector('.film-still'); if (!s) return;
      const cs = getComputedStyle(s); const op = parseFloat(cs.opacity);
      if (cs.display === 'none' || cs.visibility !== 'visible' || !(op > 0.01)) return;
      vis.push(i); maxOp = Math.max(maxOp, op);
      const im = s.querySelector('img'); const imOp = im ? parseFloat(getComputedStyle(im).opacity) : 0;
      const ready = im && im.complete && im.naturalWidth > 0 && im.__dec;
      if (!ready && imOp > 0.01) { if (i === 0 && !anyDec) uvodPoistka = true; else zle.push(i); }
      if (i === 0 && imOp <= 0.01) nahlad = true;
    });
    const c = document.elementFromPoint(innerWidth / 2, vh / 2);
    const inTitle = !!(c && c.closest('.film-shot.is-title') && !c.closest('.band, .site-footer, .board'));
    const started = document.documentElement.hasAttribute('data-scene-active');
    const curNear = st[cur].classList.contains('is-near');
    const near = st.filter((el) => el.classList.contains('is-near')).length;
    return { t: Math.round(performance.now()), y: Math.round(y), cur, vis: vis.join(','), maxOp: +maxOp.toFixed(2), zle: zle.join(','),
      uvodPoistka, nahlad, ink: inTitle && !vis.length, polo: inTitle && vis.length > 0 && maxOp < 0.9, curNear: !started || curNear, near };
  };
  window.__mon = []; let until = performance.now() + 6000;
  const f = () => { try { const s = sample(); if (s) window.__mon.push(s); } catch (e) {} if (performance.now() < until) requestAnimationFrame(f); };
  requestAnimationFrame(f);
  window.__startMon = (ms) => { window.__mon = []; const run = performance.now() < until; until = performance.now() + ms; if (!run) requestAnimationFrame(f); };
})();`;

const out = {};
function summarize(frames) {
  const ink = frames.filter((f) => f.ink), polo = frames.filter((f) => f.polo), zle = frames.filter((f) => f.zle),
    nn = frames.filter((f) => !f.curNear);
  return { snimok: frames.length, ink: ink.length, inkT: ink.slice(0, 3).map((f) => [f.t, f.y, f.cur]), polotma: polo.length,
    poloT: polo.slice(0, 3).map((f) => [f.t, f.cur, f.vis, f.maxOp]), nedekodovana: zle.length, zleT: zle.slice(0, 3).map((f) => [f.t, f.zle]),
    curNieNear: nn.length, uvodPoistka: frames.filter((f) => f.uvodPoistka).length, nahlad: frames.filter((f) => f.nahlad).length,
    maxNear: Math.max(0, ...frames.map((f) => f.near)), koniec: frames.at(-1) && { y: frames.at(-1).y, cur: frames.at(-1).cur, vis: frames.at(-1).vis } };
}
async function ctxPage(delayAll) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: 'dark' });
  await ctx.addInitScript(MON);
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push('pageerror ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errs.push('console ' + m.text().slice(0, 120)); });
  page.on('response', (r) => { if (r.status() >= 400) errs.push('HTTP ' + r.status() + ' ' + r.url()); });
  const st = { armed: false, all: delayAll };
  await page.route(/assets\/img\/film\/.*-m-\d+\.(avif|webp)/, async (route) => {
    if (st.armed && (st.all || !/rohozka/.test(route.request().url()))) await new Promise((r) => setTimeout(r, DELAY));
    route.continue().catch(() => {});
  });
  return { ctx, page, errs, st };
}
const tops = async (page) => page.evaluate(() => [...document.querySelectorAll('.film-shot.is-title')].map((el) => { const r = el.getBoundingClientRect(); return { top: Math.round(r.top + scrollY), h: Math.round(r.height), id: el.closest('section')?.id }; }));
const yOf = (T, i) => Math.round(T[i].top + Math.min(T[i].h * 0.3, 600));
async function mode(name, fn, delayAll = false) {
  if (ONLY && !name.includes(ONLY)) return;
  const { ctx, page, errs, st } = await ctxPage(delayAll);
  try { const frames = await fn(page, st); out[name] = { ...summarize(frames), chyby: errs.slice(0, 4) }; }
  catch (e) { out[name] = { chyba: String(e).slice(0, 200), chyby: errs }; }
  await ctx.close();
  console.log(name, JSON.stringify(out[name]));
}
const U = srv.origin + '/index.html';
const after = async (page, ms) => { await page.waitForTimeout(ms); return page.evaluate(() => window.__mon); };

await mode('prvá návšteva, všetky fotky -m pomalé', async (page, st) => { st.armed = true; await page.goto(U, { waitUntil: 'commit' }); return after(page, 5000); }, true);
await mode('znovunačítanie pri 3000', async (page, st) => {
  await page.goto(U, { waitUntil: 'load' }); await page.waitForTimeout(1500);
  await page.evaluate(() => scrollTo({ top: 3000, behavior: 'instant' })); await page.waitForTimeout(1500);
  st.armed = true; await page.reload({ waitUntil: 'commit' }); return after(page, 5000);
});
await mode('/#tim prvá návšteva', async (page, st) => { st.armed = true; await page.goto(U + '#tim', { waitUntil: 'commit' }); return after(page, 5000); }, true);
await mode('/#kontakt prvá návšteva', async (page, st) => { st.armed = true; await page.goto(U + '#kontakt', { waitUntil: 'commit' }); return after(page, 5000); }, true);
await mode('späť z inej stránky (poloha karta 5)', async (page, st) => {
  await page.goto(U, { waitUntil: 'load' }); await page.waitForTimeout(1200);
  const T = await tops(page); await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), yOf(T, 5)); await page.waitForTimeout(1500);
  await page.goto(srv.origin + '/README.md', { waitUntil: 'load' }).catch(() => {});
  st.armed = true; await page.goBack({ waitUntil: 'commit' }); return after(page, 5000);
});
await mode('b30.lang=en', async (page, st) => {
  await page.goto(U, { waitUntil: 'load' }); await page.evaluate(() => localStorage.setItem('b30.lang', 'en'));
  st.armed = true; await page.reload({ waitUntil: 'commit' }); return after(page, 5000);
});
await mode('menu #sluzby z vrchu (dole)', async (page, st) => {
  await page.goto(U, { waitUntil: 'load' }); await page.waitForTimeout(2500); st.armed = true;
  await page.evaluate(() => { window.__startMon(4500); document.querySelector('.nav a[href="#sluzby"]').click(); }); return after(page, 4500);
});
await mode('menu #galeria z vrchu (dole)', async (page, st) => {
  await page.goto(U, { waitUntil: 'load' }); await page.waitForTimeout(2500); st.armed = true;
  await page.evaluate(() => { window.__startMon(4500); (document.querySelector('.nav a[href="#galeria"]') || document.querySelector('a[href="#galeria"]')).click(); }); return after(page, 4500);
});
await mode('logo z karty 7 (hore)', async (page, st) => {
  await page.goto(U, { waitUntil: 'load' }); await page.waitForTimeout(1500);
  const T = await tops(page); await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), yOf(T, 7)); await page.waitForTimeout(3000);
  st.armed = true; await page.evaluate(() => { window.__startMon(4500); document.querySelector('a.brand').click(); }); return after(page, 4500);
});
await mode('skok hore 6→1 (instant)', async (page, st) => {
  await page.goto(U, { waitUntil: 'load' }); await page.waitForTimeout(1500);
  const T = await tops(page); await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), yOf(T, 6)); await page.waitForTimeout(3000);
  st.armed = true; await page.evaluate((y) => { window.__startMon(4000); scrollTo({ top: y, behavior: 'instant' }); }, yOf(T, 1)); return after(page, 4000);
});
await mode('švih dole 25×150 px/snímku', async (page, st) => {
  await page.goto(U, { waitUntil: 'load' }); await page.waitForTimeout(1500);
  const T = await tops(page); await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), yOf(T, 1)); await page.waitForTimeout(2500);
  st.armed = true;
  await page.evaluate(() => { window.__startMon(5000); let k = 0; const f = () => { if (k++ < 25) { scrollBy({ top: 150, behavior: 'instant' }); requestAnimationFrame(f); } }; requestAnimationFrame(f); });
  return after(page, 3500);
});
await mode('švih hore 25×150 px/snímku', async (page, st) => {
  await page.goto(U, { waitUntil: 'load' }); await page.waitForTimeout(1500);
  const T = await tops(page); await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), yOf(T, 7)); await page.waitForTimeout(3000);
  st.armed = true;
  await page.evaluate(() => { window.__startMon(5000); let k = 0; const f = () => { if (k++ < 25) { scrollBy({ top: -150, behavior: 'instant' }); requestAnimationFrame(f); } }; requestAnimationFrame(f); });
  return after(page, 3500);
});
await browser.close(); srv.server.close();
