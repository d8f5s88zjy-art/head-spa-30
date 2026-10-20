// Zväčšená snímka cien v cenníku (overenie, či sa číslice vykreslia správne)
import { createRequire } from 'module';
import path from 'path';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const OUT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', 'snimky');
const b = await chromium.launch();
for (const [meno, vp, dpr] of [['d', { width: 1440, height: 900 }, 2], ['t', { width: 390, height: 844 }, 3]]) {
  const c = await b.newContext({ viewport: vp, deviceScaleFactor: dpr, isMobile: meno === 't', hasTouch: meno === 't' });
  const p = await c.newPage();
  await p.goto('http://127.0.0.1:8610/barbershop-30/?uvod=off&hudba=off', { waitUntil: 'load' });
  await p.waitForTimeout(1500);
  const rows = p.locator('.price-row');
  const n = await rows.count();
  const texty = [];
  for (let i = 0; i < n; i++) {
    const r = rows.nth(i);
    await r.scrollIntoViewIfNeeded();
    await p.waitForTimeout(150);
    const amt = r.locator('.price-amount');
    texty.push(await r.locator('.price-name').innerText() + ' = ' + await amt.innerText());
    if (i === 4 || i === 3) await amt.screenshot({ path: path.join(OUT, `z-${meno}-cena-${i}.png`) });
  }
  console.log(meno, JSON.stringify(texty));
  await c.close();
}
await b.close();
