// Kontrola kódu 5 – panel v prehliadači: sieť pred/po ťuknutí, úložisko, XSS, triedy N1/N2/P5 v UI, Esc, zámok skrolu
//   node prehliadac-k5.mjs <url> <výstup.json>
import { createRequire } from 'node:module'; import { writeFileSync } from 'node:fs';
const require = createRequire('/opt/node22/lib/node_modules/'); const { chromium } = require('playwright');
const [url, out] = process.argv.slice(2); const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const V = { url, cas: new Date().toISOString() };
const b = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
try {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'sk-SK' });
  const p = await ctx.newPage(); const req = []; let faza = 'pred';
  p.on('request', (r) => req.push([faza, r.url().replace(url, '/')]));
  const chyby = []; p.on('pageerror', (e) => chyby.push(String(e))); p.on('dialog', (d) => { chyby.push('dialog ' + d.message()); d.dismiss(); });
  await p.addInitScript(() => { window.__st = 0; const o = Storage.prototype.setItem; Storage.prototype.setItem = function (...a) { window.__st++; return o.apply(this, a); };
    const d = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie'); window.__ck = 0; Object.defineProperty(document, 'cookie', { get() { return d.get.call(this); }, set(v) { window.__ck++; d.set.call(this, v); } }); });
  await p.goto(url, { waitUntil: 'load' });
  await p.locator('.recepcia-btn').waitFor({ state: 'visible', timeout: 20000 }); await sleep(800);
  await p.evaluate(() => window.scrollTo(0, 3000)); await sleep(500);
  const pred = await p.evaluate(() => ({ st: window.__st, ck: window.__ck, sy: scrollY }));
  faza = 'po';
  await p.locator('.recepcia-btn').click(); await p.locator('#rc-panel[open]').waitFor({ timeout: 8000 }); await sleep(500);
  V.otvorene = await p.evaluate(() => ({ bodyOverflow: document.body.style.overflow, fokus: document.activeElement?.className, chipsScroll: document.querySelector('.rc-chips').scrollLeft }));
  const posledna = () => p.evaluate(() => { const li = [...document.querySelectorAll('.rc-log > li.rc-a')].pop(); const cen = li?.querySelector('.rc-cen');
    return { text: li?.innerText.replace(/\s+/g, ' ').slice(0, 160), cennik: cen && [...cen.querySelectorAll('p:not(.rc-sk)')].map((r) => (r.classList.contains('rc-hl') ? '▶ ' : '  ') + r.innerText.replace(/\s+/g, ' ')), volby: [...li.querySelectorAll('.rc-akcie button')].map((x) => x.textContent) }; });
  const spytaj = async (q) => { await p.fill('#rc-q', q); await p.press('#rc-q', 'Enter'); await sleep(250); return [q, await posledna()]; };
  V.odpovede = [];
  for (const q of ['Koľko stojí strih pre ňu?', 'Koľko stojí jej strih?', 'Koľko stojí strih pre ňu a pre mňa?', 'Koľko stojí strih do 10 cm?', 'Koľko za oboch?', 'Koľko stojí strih a melír?', 'Ako dlho trvá rezervácia?', '<img src=x onerror=alert(1)>'])
    V.odpovede.push(await spytaj(q));
  V.imgVPaneli = await p.evaluate(() => document.querySelectorAll('#rc-panel img').length);
  await p.screenshot({ path: out.replace(/\.json$/, '-telefon.png') });
  await p.keyboard.press('Escape'); await sleep(400);
  V.zatvorene = await p.evaluate(() => ({ open: !!document.querySelector('#rc-panel[open]'), fokus: document.activeElement?.className, bodyOverflow: document.body.style.overflow, sy: scrollY, st: window.__st, ck: window.__ck }));
  V.pred = pred; V.chyby = chyby;
  V.ziadostiPred = req.filter((r) => r[0] === 'pred' && /recepcia/.test(r[1])).map((r) => r[1]);
  V.ziadostiPo = [...new Set(req.filter((r) => r[0] === 'po').map((r) => r[1]))];
  await ctx.close();
} finally { await b.close(); }
writeFileSync(out, JSON.stringify(V, null, 1)); console.log(JSON.stringify(V, null, 1));
