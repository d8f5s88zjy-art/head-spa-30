// Skeptik: B na HEAD 0195615 (so slučkou Tím). node meraj.mjs <port> <out>
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const [port, out] = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const res = {};
for (const [W, H, q] of [[430, 932, 'foto=B&uvod=off'], [430, 932, 'foto=A&uvod=off']]) {
  const key = `${W}-${q}`;
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: 'dark', locale: 'sk-SK' });
  const page = await ctx.newPage();
  await page.goto(`http://127.0.0.1:${port}/barbershop-30/?${q}`, { waitUntil: 'load' });
  await sleep(1500);
  res[key] = { cls: await page.evaluate(() => document.documentElement.className) };
  const shots = await page.evaluate(() => [...document.querySelectorAll('.film-shot.is-title')].map((e) => e.dataset.shot));
  for (const c of shots) {
    await page.evaluate((c) => {
      const el = document.querySelector(`.film-shot[data-shot="${c}"]`);
      const r = el.getBoundingClientRect(); const top = r.top + scrollY;
      const free = Math.max(1, r.height - (el.classList.contains('title-long') ? innerHeight : 0));
      scrollTo({ top: c === 'rohozka' ? 0 : top + free * 0.5, behavior: 'instant' });
    }, c);
    await page.waitForFunction((c) => {
      const el = document.querySelector(`.film-shot[data-shot="${c}"]`);
      const st = el.querySelector('.film-still'); const img = st && st.querySelector('img');
      return img && img.complete && img.naturalWidth > 0 && getComputedStyle(st).opacity === '1';
    }, c, { timeout: 15000 }).catch(() => console.error('timeout', key, c));
    await sleep(c === 'sala-rano' ? 3500 : 700);
    const info = await page.evaluate(async (c) => {
      const el = document.querySelector(`.film-shot[data-shot="${c}"]`);
      const img = el.querySelector('.film-still img');
      const r = img.getBoundingClientRect();
      const vis = Math.max(0, Math.min(r.right, innerWidth) - Math.max(r.left, 0)) * Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0));
      const v = el.querySelector('.film-still video, .film-loop');
      let vid = null;
      if (v) { const vr = v.getBoundingClientRect(); const cs = getComputedStyle(v);
        vid = { tag: v.tagName, cls: v.className, rect: [Math.round(vr.left), Math.round(vr.top), Math.round(vr.width), Math.round(vr.height)], opacity: cs.opacity, z: cs.zIndex, paused: v.paused, rs: v.readyState, src: (v.currentSrc || v.src || '').split('/').pop(), poster: (v.poster||'').split('/').pop(), vw: v.videoWidth, vh: v.videoHeight }; }
      const zImg = getComputedStyle(img).zIndex;
      return { src: img.currentSrc.split('/').pop(), nat: [img.naturalWidth, img.naturalHeight], rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)],
        pxPerCss: +(img.naturalWidth / r.width).toFixed(2), photoShareOfWindow: +(vis / (innerWidth * innerHeight)).toFixed(3), physWidthPx: Math.round(r.width * devicePixelRatio), zImg, vid };
    }, c);
    res[key][c] = info;
    if (c === 'sala-rano' || (q.startsWith('foto=B') && c === 'cakaren')) await page.screenshot({ path: `${out}/${q.slice(5, 6)}430-${c}.png` });
  }
  await ctx.close();
}
fs.writeFileSync(`${out}/meranie.json`, JSON.stringify(res, null, 1));
await browser.close();
