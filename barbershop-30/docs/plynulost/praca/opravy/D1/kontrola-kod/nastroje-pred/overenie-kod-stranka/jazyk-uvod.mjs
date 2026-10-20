// (1) ?lang=en na telefóne: ako dlho je nadpis úvodu skrytý triedou t-wait (čaká na i18n.js + slovník);
// (2) ponuka jazyka (prehliadač v angličtine): šírka prúžku .lang-offer na telefóne (left: 50% + shrink-to-fit)
import { BASE, launch, sleep, NET } from './spolocne.mjs';
const browser = await launch();
for (const net of ['fast4g', 'slow4g']) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: 'sk-SK' });
  const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable'); await cdp.send('Network.emulateNetworkConditions', NET[net]); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.addInitScript(() => { window.__tw = null; const h = document.documentElement; const mo = new MutationObserver(() => { if (h.classList.contains('t-wait')) window.__twOn = window.__twOn || performance.now(); else if (window.__twOn && !window.__tw) window.__tw = performance.now(); }); mo.observe(h, { attributes: true, attributeFilter: ['class'] }); });
  await page.goto(BASE + '?uvod=off&lang=en', { waitUntil: 'commit' });
  await sleep(net === 'slow4g' ? 9000 : 5000);
  const r = await page.evaluate(() => ({ fcp: Math.round((performance.getEntriesByName('first-contentful-paint')[0] || {}).startTime || 0), skryte_do: Math.round(window.__tw || 0), lang: document.documentElement.lang }));
  console.log(`?lang=en ${net}: FCP ${r.fcp} ms, nadpis úvodu skrytý (t-wait) do ${r.skryte_do} ms, jazyk ${r.lang}`);
  await ctx.close();
}
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: 'en-US' });
const page = await ctx.newPage();
await page.goto(BASE + '?uvod=off', { waitUntil: 'load' });
await sleep(5500);
const b = await page.evaluate(() => { const o = document.querySelector('.lang-offer'); if (!o) return null; const r = o.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), left: Math.round(r.left) }; });
console.log('ponuka jazyka (en-US):', JSON.stringify(b));
const el = await page.$('.lang-offer');
if (el) await page.screenshot({ path: new URL('./snimky/ponuka-jazyka.jpg', import.meta.url).pathname, type: 'jpeg', quality: 70, scale: 'css', clip: { x: 0, y: 600, width: 390, height: 244 } });
await ctx.close(); await browser.close();
