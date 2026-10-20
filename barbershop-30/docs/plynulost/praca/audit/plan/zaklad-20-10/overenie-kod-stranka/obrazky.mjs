// Ktorý stupeň fotky si prehliadač vyberie na telefóne (390×844 @3) a akú má fotka zobrazenú veľkosť:
// currentSrc, prirodzená šírka vs. šírka na displeji v pixeloch zariadenia (pomer < 1 = rozmazanie, > 1.6 = zbytočné bajty a dekódovanie)
import { opt, BASE, launch, open, sleep } from './spolocne.mjs';
const browser = await launch();
for (const dev of [{ w: 390, h: 844, dpr: 3 }, { w: 412, h: 915, dpr: 2.625 }, { w: 360, h: 800, dpr: 3 }]) {
  const ctx = await browser.newContext({ viewport: { width: dev.w, height: dev.h }, deviceScaleFactor: dev.dpr, isMobile: true, hasTouch: true, locale: 'sk-SK' });
  const page = await ctx.newPage();
  const req = [];
  page.on('request', (r) => { if (r.resourceType() === 'image') req.push(r.url().split('/').pop()); });
  await page.goto(BASE + '?' + (opt.q || 'uvod=off'), { waitUntil: 'load' });
  await sleep(1500);
  const first = [...req];
  // prejsť stránku, aby sa načítali lenivé fotky
  const H = await page.evaluate(() => document.scrollingElement.scrollHeight);
  for (let y = 0; y < H; y += 600) { await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y); await sleep(250); }
  await page.evaluate(() => document.querySelectorAll('.team-grid, .gallery-grid').forEach((g) => { g.scrollLeft = g.scrollWidth; }));
  await sleep(1500);
  const r = await page.evaluate((dpr) => [...document.querySelectorAll('img')].filter((i) => i.currentSrc).map((i) => {
    const disp = i.closest('.film-still') ? i.getBoundingClientRect().width : i.getBoundingClientRect().width;
    return { kde: i.closest('.film-still') ? 'zaloha' : i.closest('.team-card') ? 'tim' : i.closest('.gallery-item') ? 'galeria' : 'ine', src: i.currentSrc.split('/').pop(), prirodzena: i.naturalWidth, zobrazena_dev: Math.round(disp * dpr), pomer: disp ? +(i.naturalWidth / (disp * dpr)).toFixed(2) : null, sizes: i.sizes };
  }), dev.dpr);
  console.log(`=== ${dev.w}×${dev.h} @${dev.dpr}; prvé obrázky do load: ${first.slice(0, 4).join(', ')}`);
  const seen = new Set();
  for (const x of r) { const k = x.kde + x.src; if (seen.has(k)) continue; seen.add(k); if (x.zobrazena_dev > 0) console.log(`  ${x.kde.padEnd(7)} ${x.src.padEnd(30)} prirodzená ${x.prirodzena} px, na displeji ${x.zobrazena_dev} px, pomer ${x.pomer}  (sizes ${x.sizes})`); }
  await ctx.close();
}
await browser.close();
