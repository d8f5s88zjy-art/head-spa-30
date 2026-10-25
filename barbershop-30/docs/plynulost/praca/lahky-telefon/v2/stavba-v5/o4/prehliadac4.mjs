// Skúška panela recepcie v Chromiu po oprave 4 (telefón 390×844 a počítač 1440×900). node prehliadac4.mjs <url> <výstupný priečinok>
import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const [url, out] = process.argv.slice(2);
const b = await chromium.launch();
const vysl = [];
for (const [meno, vp, mobil] of [['telefon', { width: 390, height: 844 }, true], ['pocitac', { width: 1440, height: 900 }, false]]) {
  const ctx = await b.newContext({ viewport: vp, isMobile: mobil, hasTouch: mobil, deviceScaleFactor: 1, locale: 'sk-SK' });
  const p = await ctx.newPage();
  const chyby = [], ziadosti = [];
  p.on('console', (m) => { if (m.type() === 'error') chyby.push(m.text()); });
  p.on('pageerror', (e) => chyby.push(String(e)));
  p.on('request', (r) => { if (/recepcia/.test(r.url())) ziadosti.push(r.url().replace(url, '')); });
  await p.goto(url, { waitUntil: 'load' });
  const btn = p.locator('.recepcia-btn');
  await btn.waitFor({ state: 'attached', timeout: 15000 });
  await btn.click();
  await p.locator('#rc-panel[open]').waitFor({ timeout: 5000 });
  const opytaj = async (q) => { await p.fill('#rc-q', q); await p.press('#rc-q', 'Enter'); return p.locator('.rc-log > li').last().innerText(); };
  const r = {};
  for (const q of ['Synovi je 12, platí ešte detský strih?', 'Mám vlasy 3 cm, koľko stojí strih?', 'Mám vlasy 15 cm, koľko stojí strih?', 'Koľko stojí detský strih o 14:00?', 'Farbenie mihalníc, koľko?', 'koľko stojí strih a holenie', 'ďakujem']) r[q] = await opytaj(q);
  await p.evaluate(() => { document.documentElement.lang = 'de'; document.dispatchEvent(new Event('langchange')); });
  await p.waitForTimeout(800);
  for (const q of ['Was kostet Rückenwaxing?', 'Ohrenwaxing Preis?', 'Augenbrauenpiercing?']) r['de ' + q] = await opytaj(q);
  await p.evaluate(() => { document.documentElement.lang = 'hu'; document.dispatchEvent(new Event('langchange')); });
  await p.waitForTimeout(800);
  for (const q of ['Hátgyantázás ára?', 'Szempillafestés mennyi?', 'Szakállfestés ára?']) r['hu ' + q] = await opytaj(q);
  await p.screenshot({ path: `${out}/panel-${meno}.png` });
  const panel = await p.evaluate(() => { const d = document.querySelector('#rc-panel'); const x = d.getBoundingClientRect(); return { x: x.x, y: x.y, w: x.width, h: x.height, sw: document.documentElement.scrollWidth, iw: innerWidth }; });
  await p.keyboard.press('Escape');
  await p.waitForTimeout(300);
  const po = await p.evaluate(() => ({ open: !!document.querySelector('#rc-panel[open]'), fokus: document.activeElement && document.activeElement.className }));
  vysl.push({ meno, chyby, ziadosti, panel, po, r });
  await ctx.close();
}
await b.close();
console.log(JSON.stringify(vysl, null, 1));
