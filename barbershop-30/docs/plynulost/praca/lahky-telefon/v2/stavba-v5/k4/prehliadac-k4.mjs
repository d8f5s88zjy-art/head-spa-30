import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const [url] = process.argv.slice(2);
const b = await chromium.launch();
const out = [];
try {
for (const [meno, vp, mobil] of [['telefon', { width: 390, height: 844 }, true], ['pocitac', { width: 1440, height: 900 }, false]]) {
  const ctx = await b.newContext({ viewport: vp, isMobile: mobil, hasTouch: mobil, locale: 'sk-SK' });
  await ctx.addInitScript(() => {
    window.__st = 0; const s = Storage.prototype.setItem; Storage.prototype.setItem = function (...a) { if (String(a[0]).match(/rc|recep/i)) window.__st++; return s.apply(this, a); };
    window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
  });
  const p = await ctx.newPage();
  const chyby = [], ziad = [];
  p.on('pageerror', (e) => chyby.push(String(e)));
  p.on('request', (r) => { const u = r.url(); if (/recepcia/.test(u) || (!u.startsWith(url) && !u.startsWith('data:'))) ziad.push(u.replace(url, '')); });
  await p.goto(url, { waitUntil: 'load' });
  const pred = ziad.filter((u) => /recepcia/.test(u)).length;
  const btn = p.locator('.recepcia-btn');
  await btn.waitFor({ state: 'attached', timeout: 15000 });
  const box = await btn.boundingBox();
  const clsPred = await p.evaluate(() => window.__cls);
  await btn.click();
  await p.locator('#rc-panel[open]').waitFor({ timeout: 5000 });
  const fokus = await p.evaluate(() => document.activeElement.className + ' / ' + document.activeElement.closest('dialog')?.id);
  const ask = async (q) => { await p.fill('#rc-q', q); await p.press('#rc-q', 'Enter'); return (await p.locator('.rc-log > li').last().innerText()).replace(/\s+/g, ' '); };
  const odp = {};
  for (const q of ['Koľko stojí strih a melír?', 'Koľko minút sa čaká v čakárni?', 'Koľko je príplatok za víkend?', '<img src=x onerror=alert(1)>']) odp[q] = await ask(q);
  const img = await p.evaluate(() => document.querySelectorAll('#rc-panel img').length);
  await p.keyboard.press('Escape');
  await p.waitForTimeout(300);
  const po = await p.evaluate(() => ({ open: document.querySelector('#rc-panel').open, fokus: document.activeElement.className, exp: document.querySelector('.recepcia-btn').getAttribute('aria-expanded'), st: window.__st, cookie: document.cookie.length }));
  out.push({ meno, box, clsPred, pred_tuknutim_recepcia_ziadosti: pred, ziadosti: ziad, chyby, fokus, odp, img, po });
  await ctx.close();
}
} finally { await b.close(); }
console.log(JSON.stringify(out, null, 1));
