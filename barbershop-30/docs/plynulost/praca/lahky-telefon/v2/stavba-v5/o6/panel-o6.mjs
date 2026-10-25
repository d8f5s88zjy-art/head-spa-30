// Oprava 6 – overenie panela recepcie v prehliadači (triedy W, D, M, Z, voľby, výrez, odkazy tel/mailto, konzola).
//   node panel-o6.mjs <url> <priečinok na snímky>
// Jeden prehliadač (Chromium z /opt/pw-browsers), telefón 390×844 a počítač 1440×900, po sebe zavrie.
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const [url, out] = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const V = { url, cas: new Date().toISOString() };
const b = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const posledna = (p) => p.evaluate(() => {
  const li = [...document.querySelectorAll('.rc-log > li.rc-a')].pop();
  const cen = li && li.querySelector('.rc-cen');
  return li && { text: li.innerText.replace(/\s+/g, ' ').slice(0, 200), cennik: cen && [...cen.querySelectorAll('p:not(.rc-sk)')].map((r) => (r.classList.contains('rc-hl') ? '▶ ' : '  ') + r.innerText.replace(/\s+/g, ' ')),
    volby: [...li.querySelectorAll('.rc-akcie button')].map((x) => x.textContent), odkazy: [...li.querySelectorAll('.rc-akcie a')].map((x) => `${x.textContent} → ${x.getAttribute('href')}`) };
});
async function spytaj(p, q) { await p.fill('#rc-q', q); await p.press('#rc-q', 'Enter'); await sleep(250); return posledna(p); }
for (const [meno, nast] of [['telefon', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }], ['pocitac', { viewport: { width: 1440, height: 900 } }]]) {
  const ctx = await b.newContext({ ...nast, locale: 'sk-SK', colorScheme: 'dark' });
  const p = await ctx.newPage(), T = { chyby: [], konzola: [] };
  p.on('pageerror', (e) => T.chyby.push(String(e)));
  p.on('console', (m) => { if (m.type() === 'error') T.konzola.push(m.text()); });
  await p.addInitScript(() => { window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); });
  await p.goto(url, { waitUntil: 'load' });
  await p.locator('.recepcia-btn').waitFor({ state: 'visible', timeout: 15000 });
  await sleep(600);
  T.clsPredTuknutim = await p.evaluate(() => +window.__cls.toFixed(4));
  await p.locator('.recepcia-btn').click(); await p.locator('#rc-panel[open]').waitFor({ timeout: 8000 }); await sleep(400);
  T.W_pondelok = await spytaj(p, 'V pondelok o 9:00 na bradu?');
  if (meno === 'telefon') await p.screenshot({ path: `${out}/o6-telefon-pondelok.png` });
  T.W_cas = await spytaj(p, 'strih o 21:00?');
  T.D_syn = await spytaj(p, 'Strih pre syna (8) a pre mňa, koľko?');
  await p.locator('.rc-log > li.rc-a').last().locator('.rc-akcie button').first().click(); await sleep(300);
  T.D_poTuknutiNaPrvuVolbu = await posledna(p);
  if (meno === 'telefon') await p.screenshot({ path: `${out}/o6-telefon-deti-vyrez.png` });
  T.M_maly = await spytaj(p, 'Koľko stojí strih pre malého?');
  T.Z_pozdrav = await spytaj(p, 'Dobré ráno, koľko stojí strih?');
  T.rezervacia = await spytaj(p, 'Môžem sa objednať na strih na zajtra ráno?');
  T.fallback = await spytaj(p, 'asdf qwer');
  if (meno === 'pocitac') await p.screenshot({ path: `${out}/o6-pocitac-panel.png` });
  await p.keyboard.press('Escape'); await sleep(400);
  T.zatvorene = await p.evaluate(() => !document.querySelector('#rc-panel[open]') && document.activeElement?.className);
  V[meno] = T;
  await ctx.close();
}
await b.close();
writeFileSync(`${out}/panel-o6.json`, JSON.stringify(V, null, 1));
console.log(JSON.stringify(V, null, 1));
