// Kontrola (len čítanie): švih nahor a nadol po 60 px na snímku (lite 390×844 @3, dotyk, bez oneskorenia siete).
import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const ROOT = process.argv[2];
const { startStaticServer } = await import(ROOT + '/source/shot.mjs');
const srv = await startStaticServer(ROOT);
const browser = await chromium.launch({ headless: true });
const out = {};
async function run(name, fromIdx, dy, n) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: 'dark' });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto(srv.origin + '/index.html', { waitUntil: 'load' });
  await page.waitForTimeout(2000);
  const y0 = await page.evaluate((i) => { const el = document.querySelectorAll('.film-shot.is-title')[i]; const r = el.getBoundingClientRect(); return Math.round(r.top + scrollY + 200); }, fromIdx);
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y0);
  await page.waitForTimeout(3000);
  const r = await page.evaluate(async ({ dy, n }) => {
    const st = [...document.querySelectorAll('.film-shot.is-title')];
    const foot = document.querySelector('.site-footer');
    const fr = [];
    let k = 0;
    await new Promise((done) => {
      const f = () => {
        if (k < n) { window.scrollBy({ top: dy, behavior: 'instant' }); k++; }
        const vis = st.map((el, i) => { const s = el.querySelector('.film-still'); const cs = getComputedStyle(s); return (cs.display !== 'none' && cs.visibility === 'visible' && parseFloat(cs.opacity) > 0.01) ? i : -1; }).filter((i) => i >= 0);
        // okno kryté pásom (nepriehľadný obsah) sa nepočíta: bod v strede okna
        const el = document.elementFromPoint(195, 422);
        const kryte = !!(el && el.closest('.board, .band, .site-footer, section > :not(.film-shot)'));
        fr.push({ y: Math.round(scrollY), vis: vis.join(','), kryte });
        if (k < n + 60) { if (k >= n) k++; requestAnimationFrame(f); } else done();
      };
      requestAnimationFrame(f);
    });
    return fr;
  }, { dy, n });
  const ink = r.filter((f) => f.vis === '' && !f.kryte);
  out[name] = { snimok: r.length, inkSnimok: ink.length, ukazky: ink.slice(0, 6), chyby: errs };
  await ctx.close();
}
try {
  await run('nahor z 8', 8, -60, 150);
  await run('nadol z 0', 0, 60, 150);
} finally { await browser.close(); srv.server.close(); }
console.log(JSON.stringify(out, null, 1));
