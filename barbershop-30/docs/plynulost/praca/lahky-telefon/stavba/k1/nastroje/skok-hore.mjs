// Kontrola (len čítanie): skok NAHOR na kartu, ktorej fotka ešte nie je stiahnutá (lite, 390×844 @3, dotyk).
// Fotky -m (okrem rohožky) sa oneskoria o DELAY ms. Po skoku sa v každom rAF počíta, koľko záloh je naozaj viditeľných.
import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const ROOT = process.argv[2];
const { startStaticServer } = await import(ROOT + '/source/shot.mjs');
const DELAY = Number(process.env.DELAY || 2500);
const srv = await startStaticServer(ROOT);
const browser = await chromium.launch({ headless: true });
const out = {};
async function run(name, fromIdx, toIdx) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: 'dark' });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  let armed = false;
  await page.route(/assets\/img\/film\/.*-m-\d+\.(avif|webp)/, async (route) => {
    if (armed && !/rohozka/.test(route.request().url())) await new Promise((r) => setTimeout(r, DELAY));
    route.continue().catch(() => {});
  });
  await page.goto(srv.origin + '/index.html', { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  const tops = await page.evaluate(() => [...document.querySelectorAll('.film-shot.is-title')].map((el) => { const r = el.getBoundingClientRect(); return { top: r.top + scrollY, h: r.height, id: el.closest('section')?.id }; }));
  const yOf = (i) => Math.round(tops[i].top + Math.min(tops[i].h * 0.3, 600));
  // na východiskovú kartu, počkať, kým je jej fotka hotová
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), yOf(fromIdx));
  await page.waitForTimeout(4000);
  armed = true;
  const before = await page.evaluate(() => [...document.querySelectorAll('.film-shot.is-title')].map((el, i) => el.classList.contains('is-near') ? i : -1).filter((i) => i >= 0));
  const res = await page.evaluate(async ({ y, ms }) => {
    const st = [...document.querySelectorAll('.film-shot.is-title')];
    const frames = [];
    window.scrollTo({ top: y, behavior: 'instant' });
    const t0 = performance.now();
    await new Promise((done) => {
      const f = () => {
        const vis = st.map((el, i) => { const s = el.querySelector('.film-still'); const cs = getComputedStyle(s); return (cs.display !== 'none' && cs.visibility === 'visible' && parseFloat(cs.opacity) > 0.01) ? i : -1; }).filter((i) => i >= 0);
        frames.push({ t: Math.round(performance.now() - t0), vis: vis.join(','), near: st.map((el, i) => el.classList.contains('is-near') ? i : -1).filter((i) => i >= 0).join(',') });
        if (performance.now() - t0 < ms) requestAnimationFrame(f); else done();
      };
      requestAnimationFrame(f);
    });
    return frames;
  }, { y: yOf(toIdx), ms: DELAY + 1500 });
  const ink = res.filter((f) => f.vis === '');
  const maxNear = Math.max(...res.map((f) => f.near.split(',').filter(Boolean).length));
  out[name] = { z: tops[fromIdx].id, na: tops[toIdx].id, nearPred: before, snimok: res.length, inkSnimok: ink.length, inkOd: ink[0]?.t, inkDo: ink.at(-1)?.t, maxNear, prve: res.slice(0, 3), posledne: res.at(-1), chyby: errs };
  await ctx.close();
}
try {
  await run('hore 6→2', 6, 2);
  await run('hore 8→3', 8, 3);
  await run('dole 1→6', 1, 6);
} finally { await browser.close(); srv.server.close(); }
console.log(JSON.stringify(out, null, 1));
