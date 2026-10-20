// Kontrola kódu D1: tempo preklápania tabule hodín pred a po (čas od prvej po poslednú zmenu textu políčok,
// priemerný krok jedného políčka). Bez spomalenia CPU, telefón 390×844.
//   node flap-tempo.mjs <base>
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const BASE = process.argv[2];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
await page.goto(BASE + '?uvod=off&hudba=off&film=off', { waitUntil: 'load' });
await sleep(1500);
// zberač zmien textu políčok (každé políčko b zvlášť)
await page.evaluate(() => {
  window.__z = [];
  const box = document.querySelector('[data-flap]');
  new MutationObserver((l) => { const t = performance.now(); for (const m of l) { const b = m.target.nodeType === 3 ? m.target.parentNode : m.target; if (b && b.tagName === 'B') { const i = [...b.parentNode.children].indexOf(b); window.__z.push([i, t]); } } }).observe(box, { subtree: true, childList: true, characterData: true });
});
await page.evaluate(() => { const b = document.querySelector('.band-contact'); window.scrollTo({ top: b.getBoundingClientRect().top + scrollY - 200, behavior: 'instant' }); });
await sleep(4500);
const r = await page.evaluate(() => {
  const z = window.__z; const per = {};
  for (const [i, t] of z) (per[i] = per[i] || []).push(t);
  const kroky = []; let prvy = Infinity, posl = 0;
  for (const k in per) { const a = per[k]; prvy = Math.min(prvy, a[0]); posl = Math.max(posl, a[a.length - 1]); for (let j = 1; j < a.length; j++) kroky.push(a[j] - a[j - 1]); }
  kroky.sort((x, y) => x - y);
  return { zmien: z.length, policok: Object.keys(per).length, trvanie_ms: Math.round(posl - prvy), krok_median_ms: Math.round(kroky[kroky.length >> 1]), krok_p90_ms: Math.round(kroky[Math.floor(kroky.length * 0.9)]) };
});
console.log(JSON.stringify(r));
await browser.close();
