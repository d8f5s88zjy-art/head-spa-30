// Overenie K13: galéria a tím na telefóne – vybraný súbor (currentSrc) voči skutočne potrebnej šírke. Pri object-fit: cover
// je kreslená šírka celého obrázka max(šírka boxu, výška boxu × pomer strán fotky), nie len šírka boxu.
// Šírka súboru sa berie z názvu (…-640.avif), lebo naturalWidth pri srcset s w je prepočítaná na sizes.
// Porovná sizes dnes a navrhované sizes="(max-width: 640px) 78vw, ..." (podvrhnuté v page.route).
//   node over-galeria.mjs
import fs from 'fs';
import { BASE, launch, sleep } from './spolocne.mjs';
const ROOT = '/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/barber/opravy/pred-D1/barbershop-30/';
const browser = await launch();
for (const dev of [{ w: 390, h: 844, dpr: 3 }, { w: 412, h: 915, dpr: 2.625 }]) for (const v of ['dnes', 'sizes78']) {
  const ctx = await browser.newContext({ viewport: { width: dev.w, height: dev.h }, deviceScaleFactor: dev.dpr, isMobile: true, hasTouch: true, locale: 'sk-SK' });
  const page = await ctx.newPage();
  if (v === 'sizes78') await page.route(/barbershop-30\/(\?.*)?$/, (r) => r.fulfill({ status: 200, contentType: 'text/html', body: fs.readFileSync(ROOT + 'index.html', 'utf8').replaceAll('sizes="(max-width: 900px) 50vw, 25vw"', 'sizes="(max-width: 640px) 78vw, (max-width: 900px) 50vw, 25vw"') }));
  await page.goto(BASE + '?uvod=off&film=off', { waitUntil: 'load' });
  await page.evaluate(() => document.querySelector('.gallery').scrollIntoView({ behavior: 'instant', block: 'center' }));
  await sleep(800);
  await page.evaluate(() => document.querySelectorAll('.gallery-grid img, .team-grid img').forEach((i) => { i.loading = 'eager'; }));
  await sleep(3000);
  const r = await page.evaluate((dpr) => [...document.querySelectorAll('.gallery-grid img, .team-grid img')].map((i) => {
    const b = i.getBoundingClientRect(); const ar = i.naturalWidth / i.naturalHeight || 1; const fileW = +((i.currentSrc || '').match(/-(\d+)\.(avif|webp|jpe?g|png)/) || [0, 0])[1]; const fit = getComputedStyle(i).objectFit;
    const kresl = fit === 'cover' ? Math.max(b.width, b.height * ar) : b.width;
    return { kde: i.closest('.gallery-grid') ? 'galeria' : 'tim', src: (i.currentSrc || '').split('/').pop(), prir: fileW, box: Math.round(b.width * dpr), potrebna: Math.round(kresl * dpr), pomer: +(fileW / (kresl * dpr)).toFixed(2), fit };
  }), dev.dpr);
  console.log(`=== ${dev.w}×${dev.h} @${dev.dpr} – ${v}`);
  for (const x of r) console.log(`  ${x.kde.padEnd(7)} ${x.src.padEnd(32)} súbor ${x.prir} px, box ${x.box} px, kreslená fotka ${x.potrebna} px (${x.fit}), pomer ${x.pomer}`);
  await ctx.close();
}
await browser.close();
