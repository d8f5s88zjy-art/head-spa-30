// Meranie viditeľnej časti fotiek titulných kariet: počítač (?film=off) vs telefón (lite).
// Použitie: node meraj.mjs <base-url> <out-dir>
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');

const BASE = process.argv[2];
const OUT = process.argv[3];
fs.mkdirSync(OUT, { recursive: true });
const SHOOT = new Set(['rohozka', 'sala', 'stol', 'cakaren', 'vstup']);

const devices = [
  { id: 'pc1', q: '?film=off', ctx: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }, shots: true, frame: true },
  { id: 'pc2', q: '?film=off', ctx: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 }, shots: false },
  { id: 'tel390', q: '', ctx: { viewport: { width: 390, height: 844 }, screen: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }, shots: true },
  { id: 'tel430', q: '', ctx: { viewport: { width: 430, height: 932 }, screen: { width: 430, height: 932 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }, shots: true },
];

// v stránke: geometria zálohy karty -> viditeľný obdĺžnik v súradniciach súboru
const measureFn = (shot) => {
  const el = document.querySelector(`.film-shot.is-title[data-shot="${shot}"]`);
  const pic = el.querySelector('picture.film-still');
  const img = pic.querySelector('img');
  const cs = getComputedStyle(img);
  const r = img.getBoundingClientRect();
  const fr = pic.getBoundingClientRect();
  const bw = img.offsetWidth, bh = img.offsetHeight;
  const z = r.width / bw;
  const nw = img.naturalWidth, nh = img.naturalHeight;
  const s = Math.max(bw / nw, bh / nh);
  const pos = cs.objectPosition.split(' ').map((v) => v.endsWith('%') ? parseFloat(v) / 100 : NaN);
  const offx = (bw - nw * s) * pos[0], offy = (bh - nh * s) * pos[1];
  const vw = document.documentElement.clientWidth, vh = window.innerHeight;
  const cl = { x0: Math.max(0, fr.left, r.left), y0: Math.max(0, fr.top, r.top), x1: Math.min(vw, fr.right, r.right), y1: Math.min(vh, fr.bottom, r.bottom) };
  const toU = (X) => ((X - r.left) / z - offx) / s;
  const toV = (Y) => ((Y - r.top) / z - offy) / s;
  const nav = document.querySelector('header, .nav, .site-nav');
  const nb = nav ? nav.getBoundingClientRect() : null;
  return {
    shot, cls: document.documentElement.className, src: img.currentSrc.split('/').pop(), nw, nh,
    css: { bw, bh, z: +z.toFixed(4), s, drawnW: nw * s * z, drawnH: nh * s * z, pos: cs.objectPosition, transform: cs.transform },
    clip: cl, vis: { u0: toU(cl.x0), u1: toU(cl.x1), v0: toV(cl.y0), v1: toV(cl.y1) },
    so: getComputedStyle(pic).opacity, nav: nb ? { tag: nav.tagName + '.' + nav.className, h: nb.bottom, bg: getComputedStyle(nav).backgroundColor } : null,
    complete: img.complete, vw, vh, dpr: devicePixelRatio,
  };
};

const browser = await chromium.launch({ executablePath: undefined });
const res = {};
try {
  for (const d of devices) {
    const ctx = await browser.newContext({ locale: 'sk-SK', ...d.ctx });
    const page = await ctx.newPage();
    await page.goto(BASE + d.q, { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    const shots = await page.$$eval('.film-shot.is-title', (a) => a.map((e) => e.dataset.shot));
    res[d.id] = [];
    for (const shot of shots) {
      await page.evaluate((shot) => {
        document.documentElement.style.scrollBehavior = 'auto';
        const el = document.querySelector(`.film-shot.is-title[data-shot="${shot}"]`);
        const top = el.getBoundingClientRect().top + scrollY;
        const u = shot === 'rohozka' ? 0 : 0.5;
        const free = Math.max(1, el.offsetHeight - (el.classList.contains('title-long') ? innerHeight : 0));
        scrollTo(0, top + u * free);
      }, shot);
      await page.waitForTimeout(600);
      await page.waitForFunction((shot) => {
        const img = document.querySelector(`.film-shot.is-title[data-shot="${shot}"] picture.film-still img`);
        return img && img.complete && img.naturalWidth > 0 && getComputedStyle(img.closest('picture')).opacity === '1';
      }, shot, { timeout: 20000 });
      await page.waitForTimeout(1600);
      const m = await page.evaluate(measureFn, shot);
      res[d.id].push(m);
      if (d.shots && SHOOT.has(shot)) await page.screenshot({ path: `${OUT}/${d.id}-${shot}.png` });
      if (d.frame) {
        // rámovanie filmu (prvý snímok pri kotve, presah 1,24) bez WebGL: tá istá záloha s triedou world-frame
        await page.evaluate(() => document.documentElement.classList.add('world-frame'));
        await page.waitForTimeout(300);
        const f = await page.evaluate(measureFn, shot);
        f.mode = 'world-frame';
        res[d.id + 'film'] = res[d.id + 'film'] || [];
        res[d.id + 'film'].push(f);
        if (d.shots && SHOOT.has(shot)) await page.screenshot({ path: `${OUT}/${d.id}film-${shot}.png` });
        await page.evaluate(() => document.documentElement.classList.remove('world-frame'));
        await page.waitForTimeout(300);
      }
    }
    await ctx.close();
  }
} finally {
  await browser.close();
}
fs.writeFileSync(`${OUT}/meranie.json`, JSON.stringify(res, null, 1));
console.log('ok', Object.keys(res).map((k) => k + ':' + res[k].length).join(' '));
