// Porota: B na všetkých 9 titulných kartách – prekrytie fotky s textom, úplnosť, px/CSS. node over-b.mjs <port> <out>
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const [port, out] = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const res = {};
for (const [W, H] of [[390, 844], [430, 932], [375, 667]]) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: 'dark', locale: 'sk-SK' });
  const page = await ctx.newPage();
  await page.goto(`http://127.0.0.1:${port}/barbershop-30/?foto=B&uvod=off`, { waitUntil: 'load' });
  await sleep(1500);
  const shots = await page.evaluate(() => [...document.querySelectorAll('.film-shot.is-title')].map((e) => e.dataset.shot));
  res[W] = {};
  for (const c of shots) {
    await page.evaluate((c) => {
      const el = document.querySelector(`.film-shot[data-shot="${c}"]`);
      const r = el.getBoundingClientRect(); const top = r.top + scrollY;
      const free = Math.max(1, r.height - (el.classList.contains('title-long') ? innerHeight : 0));
      scrollTo({ top: c === 'rohozka' ? 0 : top + free * 0.5, behavior: 'instant' });
    }, c);
    await page.waitForFunction((c) => {
      const el = document.querySelector(`.film-shot[data-shot="${c}"]`);
      const st = el.querySelector('.film-still'); const img = st && st.querySelector('img.foto-main');
      const fr = el.querySelector('.title-frame');
      return img && img.complete && img.naturalWidth > 0 && getComputedStyle(st).opacity === '1' && getComputedStyle(fr).opacity === '1';
    }, c, { timeout: 15000 }).catch(() => console.error('timeout', W, c));
    await sleep(600);
    const info = await page.evaluate(async (c) => {
      const el = document.querySelector(`.film-shot[data-shot="${c}"]`);
      const img = el.querySelector('img.foto-main');
      const r = img.getBoundingClientRect();
      const real = new Image(); real.src = img.currentSrc; await real.decode().catch(() => {});
      const t = el.querySelector('.title-card').getBoundingClientRect();
      const nav = document.querySelector('header, .nav, .site-nav'); const nb = nav ? nav.getBoundingClientRect().bottom : 0;
      return { src: img.currentSrc.split('/').pop(), nat: [real.naturalWidth, real.naturalHeight], rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)],
        pxPerCss: +(real.naturalWidth / r.width).toFixed(2), ratioErr: +Math.abs((r.width / r.height) / (real.naturalWidth / real.naturalHeight) - 1).toFixed(4),
        navBottom: Math.round(nb), textTop: Math.round(t.top), gapToText: Math.round(t.top - r.bottom), transform: getComputedStyle(img).transform };
    }, c);
    res[W][c] = info;
    if (W === 430 && ['rohozka', 'kava', 'vstup', 'sud'].includes(c)) await page.screenshot({ path: `${out}/B430-${c}.png` });
    if (W === 375 && ['rohozka', 'sala-rano'].includes(c)) await page.screenshot({ path: `${out}/B375-${c}.png` });
  }
  await ctx.close();
}
fs.writeFileSync(`${out}/over-b.json`, JSON.stringify(res, null, 1));
await browser.close();
