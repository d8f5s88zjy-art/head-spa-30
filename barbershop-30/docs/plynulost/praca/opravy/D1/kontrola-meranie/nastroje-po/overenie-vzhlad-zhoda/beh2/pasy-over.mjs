// Overenie VZ-06: viditeľnosť okna videa tímu, linky kapitol a počet položiek pásov v jednom okne (telefón vs počítač, ?film=off).
import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const browser = await chromium.launch();
for (const [dev, vp] of [['p390', { width: 390, height: 844 }], ['d1440', { width: 1440, height: 900 }]]) {
  const ctx = await browser.newContext({ viewport: vp, isMobile: dev === 'p390', hasTouch: dev === 'p390' });
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:8432/barbershop-30/?film=off', { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  const r = await page.evaluate(() => {
    const cs = (s) => { const e = document.querySelector(s); return e ? getComputedStyle(e).display : null; };
    const vis = (sel) => { const g = document.querySelector(sel); if (!g) return null; const gr = g.getBoundingClientRect(); const items = [...g.children]; return { spolu: items.length, v_okne_sirky: +items.reduce((a, it) => { const r = it.getBoundingClientRect(); const w = Math.max(0, Math.min(r.right, innerWidth) - Math.max(r.left, 0)); return a + w / r.width; }, 0).toFixed(2), vyska_px: Math.round(gr.height) }; };
    const prog = [...document.querySelectorAll('[class*="progress"], .story-line, .chapter-line')].map((e) => e.className + ':' + getComputedStyle(e).display);
    return { teamVideo: cs('.team-video'), storyLine: cs('.story-line'), progres: prog, tim: vis('.team-grid'), galeria: vis('.gallery-grid'), recenzie: vis('.rec-list') };
  });
  console.log(dev, JSON.stringify(r));
  await ctx.close();
}
await browser.close();
