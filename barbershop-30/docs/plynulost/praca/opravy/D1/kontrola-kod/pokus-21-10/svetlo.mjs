// Svetlo po okraji kontaktnej karty: snímky v pevných fázach obehu (pred 8402 vs po 8400). node svetlo.mjs --port=8400 --zar=tel|tel360|pc
import { createRequire } from 'module';
import fs from 'node:fs';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const port = opt.port || 8400, zar = opt.zar || 'tel';
const out = '/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/barber/opravy/D1/kontrola-kod/pokus-21-10/svetlo';
fs.mkdirSync(out, { recursive: true });
const V = { tel: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, tel360: { viewport: { width: 360, height: 780 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, pc: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 } }[zar];
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const ctx = await browser.newContext({ ...V, colorScheme: 'dark', locale: 'sk-SK' });
const page = await ctx.newPage();
await page.goto(`http://127.0.0.1:${port}/barbershop-30/index.html?uvod=off&hudba=off&film=off`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__renderDone !== false);
await page.addStyleTag({ content: 'html{scroll-behavior:auto !important}' });
await page.evaluate(() => { const b = document.querySelector('.contact-main.beam'); b.scrollIntoView({ block: 'center', behavior: 'instant' }); });
await page.waitForTimeout(2500);
const info = await page.evaluate(() => { const b = document.querySelector('.contact-main.beam'); const r = b.getBoundingClientRect(); const l = b.querySelector('.beam-line'); const bs = getComputedStyle(l, '::before'); return { x: r.x, y: r.y, w: r.width, h: r.height, pw: bs.width, ph: bs.height, anim: getComputedStyle(l, '::before').animationName }; });
console.log(JSON.stringify({ port, zar, ...info }));
for (const ph of [0, 700, 1400, 2100, 2800, 3500, 4200, 4900, 5600, 6300]) {
  await page.evaluate((t) => { document.getAnimations().forEach((a) => { a.pause(); if (a.animationName === 'obeh') a.currentTime = t; }); }, ph);
  await page.waitForTimeout(150);
  const b = await page.evaluate(() => { const r = document.querySelector('.contact-main.beam').getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; });
  await page.screenshot({ path: `${out}/${port}-${zar}-${String(ph).padStart(4, '0')}.png`, clip: { x: Math.max(0, b.x - 4), y: Math.max(0, b.y - 4), width: Math.min(V.viewport.width, b.width + 8), height: Math.min(V.viewport.height, b.height + 8) } });
}
fs.writeFileSync(`${out}/${port}-${zar}-info.json`, JSON.stringify(info));
await browser.close();
