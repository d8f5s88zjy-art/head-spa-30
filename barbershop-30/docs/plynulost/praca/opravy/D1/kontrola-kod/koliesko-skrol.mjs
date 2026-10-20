// Kontrola kódu D1: trieda skrol po skrole kolieskom na počítači (plynulé koliesko app.js 6b) – kedy sa zruší
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const BASE = process.argv[2];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.addInitScript(() => { window.__sk = []; addEventListener('DOMContentLoaded', () => new MutationObserver(() => window.__sk.push([Math.round(performance.now()), document.documentElement.classList.contains('skrol')])).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })); window.__ev = 0; addEventListener('scroll', () => { window.__ev++; window.__last = performance.now(); }, { passive: true }); });
await page.goto(BASE + '?uvod=off&hudba=off', { waitUntil: 'load' });
await sleep(1500);
await page.mouse.move(700, 450);
const t0 = await page.evaluate(() => performance.now());
for (let i = 0; i < 8; i++) { await page.mouse.wheel(0, 240); await sleep(60); }
const out = [];
for (const ms of [300, 700, 1200, 2000, 3000]) { await sleep(ms - (out.length ? [300, 700, 1200, 2000, 3000][out.length - 1] : 0)); out.push(await page.evaluate((t0) => ({ t: Math.round(performance.now() - t0), skrol: document.documentElement.classList.contains('skrol'), y: scrollY, posledny_scroll: Math.round(window.__last - t0), udalosti: window.__ev }), t0)); }
console.log(JSON.stringify({ out, zmeny: await page.evaluate((t0) => window.__sk.map(([t, s]) => [t - Math.round(t0), s]).filter(([t]) => t > 0), t0) }));
await browser.close();
