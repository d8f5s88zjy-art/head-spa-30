// Opakovanie scenára „späť“ z app-smoke časti 9 (lite 390): node spat.mjs <port> [n]
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const [port, n = 3] = process.argv.slice(2);
const base = `http://127.0.0.1:${port}/barbershop-30`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const state = (page) => page.evaluate(() => {
  const y = scrollY, vh = innerHeight, t = [...document.querySelectorAll('.film-shot.is-title')];
  let cur = 0; t.forEach((el, i) => { if (el.getBoundingClientRect().top + y <= y + vh * 0.5) cur = i; });
  const stills = [...document.querySelectorAll('.film-shot.is-title .film-still')];
  const info = stills.map((st) => { const cs = getComputedStyle(st), img = st.querySelector('img'); const sh = st.closest('.film-shot');
    return [sh.dataset.shot, cs.display, cs.visibility, (+cs.opacity).toFixed(2), img.complete && img.naturalWidth > 0, sh.classList.contains('is-near'), img.__dec]; }).filter((x) => x[1] !== 'none');
  return { y: Math.round(y), cur: t[cur].dataset.shot, settled: window.__scrollSettled, info };
});
for (let k = 0; k < n; k++) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: 'dark' });
  const page = await ctx.newPage();
  await page.goto(`${base}/index.html`, { waitUntil: 'load' }); await sleep(1500);
  // ako app-smoke: prejsť karty a koniec stránky
  const tops = await page.evaluate(() => [...document.querySelectorAll('.film-shot.is-title')].map((el) => { const r = el.getBoundingClientRect(); return r.top + scrollY + r.height * 0.3; }));
  for (const y of tops) { await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), y); await sleep(700); }
  await page.evaluate(() => scrollTo(0, document.scrollingElement.scrollHeight)); await sleep(900);
  const cak = await page.evaluate(() => { const el = document.querySelector('[data-shot="cakaren"]'); const r = el.getBoundingClientRect(); return r.top + scrollY + r.height * 0.3; });
  await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), cak); await sleep(800);
  await page.reload({ waitUntil: 'load' }); await sleep(1500);
  await page.goto(`${base}/index.html#kontakt`, { waitUntil: 'load' }); await sleep(800);
  await page.goBack({ waitUntil: 'load' }).catch(() => {});
  const tb = Date.now();
  await page.waitForFunction(() => window.__scrollSettled === true, null, { timeout: 30000 }).catch(() => {});
  console.log('settled po', Date.now() - tb, 'ms');
  for (let i = 0; i < 10; i++) { console.log('  ', Date.now() - tb, JSON.stringify(await state(page))); await sleep(500); }
  await ctx.close();
}
await browser.close();
