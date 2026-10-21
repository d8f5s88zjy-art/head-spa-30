// Zdroj posunov rozloženia (layout-shift sources) na telefóne pri prechode kartami: node cls-zdroj.mjs <port>
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const base = `http://127.0.0.1:${process.argv[2]}/barbershop-30/`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: 'dark' });
await ctx.addInitScript(() => { window.__ls = []; new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__ls.push({ v: +e.value.toFixed(4), t: Math.round(e.startTime), y: Math.round(scrollY),
  src: (e.sources || []).map((s) => { const n = s.node; return n ? (n.nodeType === 1 ? n.tagName + '.' + [...n.classList].join('.') : '#text:' + (n.parentElement ? n.parentElement.tagName + '.' + [...n.parentElement.classList].join('.') : '')) : '?'; }) }))).observe({ type: 'layout-shift', buffered: true }); });
const page = await ctx.newPage();
await page.goto(base, { waitUntil: 'load' }); await sleep(1500);
for (const [sel, off] of [['[data-shot="cakaren"]', 0.3], ['[data-shot="sala-rano"]', 0.35], ['.band-team', 0.1], ['[data-shot="kreslo-stred"]', 0.4], ['[data-shot="cakaren"]', 0.3], ['[data-shot="sala-rano"]', 0.35]]) {
  await page.evaluate(([sel, off]) => { const e = document.querySelector(sel); scrollTo({ top: e.getBoundingClientRect().top + scrollY + off * innerHeight, behavior: 'instant' }); }, [sel, off]); await sleep(900);
}
console.log(JSON.stringify(await page.evaluate(() => window.__ls)));
await browser.close();
