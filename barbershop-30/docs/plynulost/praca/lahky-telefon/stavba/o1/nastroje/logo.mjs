import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const [ROOT] = process.argv.slice(2);
const { startStaticServer } = await import(ROOT + '/source/shot.mjs');
const srv = await startStaticServer(ROOT);
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: 'dark' });
const page = await ctx.newPage();
await page.goto(srv.origin + '/index.html', { waitUntil: 'load' });
await page.waitForTimeout(2000);
await page.evaluate(() => { const el = document.querySelectorAll('.film-shot.is-title')[7]; const r = el.getBoundingClientRect(); scrollTo({ top: r.top + scrollY + 300, behavior: 'instant' }); });
await page.waitForTimeout(3000);
const res = await page.evaluate(async () => {
  const st = [...document.querySelectorAll('.film-shot.is-title')];
  const fr = []; const t0 = performance.now();
  document.querySelector('a.brand').click();
  await new Promise((done) => { const f = () => {
    const vis = st.map((el, i) => { const c = getComputedStyle(el.querySelector('.film-still')); return c.display !== 'none' && c.visibility === 'visible' && parseFloat(c.opacity) > 0.01 ? i : -1; }).filter((i) => i >= 0);
    // je stred okna nad kotvou titulnej karty (nie nad pásom s vlastným pozadím)?
    const y = scrollY + innerHeight / 2; const nadKotvou = st.some((el) => { const r = el.getBoundingClientRect(); return r.top + scrollY <= y && r.bottom + scrollY >= y; });
    fr.push({ t: Math.round(performance.now() - t0), y: Math.round(scrollY), vis: vis.join(','), nadKotvou });
    if (performance.now() - t0 < 3000) requestAnimationFrame(f); else done(); };
    requestAnimationFrame(f); });
  return fr;
});
const ink = res.filter((f) => f.vis === '' && f.nadKotvou);
console.log(JSON.stringify({ snimok: res.length, inkNadKotvou: ink.length, ukazky: ink.slice(0, 8), koniec: res.at(-1) }));
await browser.close(); srv.server.close();
