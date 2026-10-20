// Klávesnica: poradie fokusu, viditeľnosť obrysu, tlačidlo hudby na telefóne aj počítači.
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const BASE = process.argv[2], OUT = process.argv[3];
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const out = {};
for (const dev of ['pocitac', 'mobil']) {
  const opt = dev === 'mobil' ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1440, height: 900 } };
  const ctx = await browser.newContext(opt);
  const page = await ctx.newPage();
  await page.goto(BASE + '?uvod=off', { waitUntil: 'load' });
  await page.waitForTimeout(4500); // atmosfera.js sa načíta najneskôr 3,5 s po načítaní
  const music = await page.evaluate(() => [...document.querySelectorAll('button')].filter((b) => /hudb|music/i.test((b.getAttribute('aria-label') || '') + b.textContent + (b.className || ''))).map((b) => { const r = b.getBoundingClientRect(); const s = getComputedStyle(b); return { t: (b.getAttribute('aria-label') || b.textContent).trim().slice(0, 40), pressed: b.getAttribute('aria-pressed'), vis: s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; }));
  const steps = [];
  for (let i = 0; i < 14; i++) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(120);
    steps.push(await page.evaluate(() => {
      const e = document.activeElement; if (!e || e === document.body) return { el: 'body' };
      const s = getComputedStyle(e); const r = e.getBoundingClientRect();
      return { el: e.tagName.toLowerCase() + (e.className ? '.' + String(e.className).split(' ')[0] : ''), name: (e.getAttribute('aria-label') || e.textContent).replace(/\s+/g, ' ').trim().slice(0, 40), outline: s.outlineStyle + ' ' + s.outlineWidth + ' ' + s.outlineColor, shadow: s.boxShadow.slice(0, 40), inView: r.bottom > 0 && r.top < innerHeight && r.width > 0 };
    }));
  }
  if (dev === 'pocitac') await page.screenshot({ path: `${OUT}/fokus-${dev}.jpg`, type: 'jpeg', quality: 70 });
  out[dev] = { music, steps };
  await ctx.close();
}
fs.writeFileSync(`${OUT}/klavesnica.json`, JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
await browser.close();
