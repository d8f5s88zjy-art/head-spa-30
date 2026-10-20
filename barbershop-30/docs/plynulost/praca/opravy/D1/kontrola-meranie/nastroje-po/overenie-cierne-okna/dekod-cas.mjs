// Čas rozbalenia fotky záberu (createImageBitmap ako film.js:443) pri CPU 1× a 4× – odhad pre telefón bez SwiftShaderu.
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const b = await chromium.launch({ headless: true });
for (const cpu of [1, 4]) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true });
  const p = await ctx.newPage(); const c = await ctx.newCDPSession(p);
  await p.goto('http://127.0.0.1:8432/barbershop-30/robots.txt');
  if (cpu > 1) await c.send('Emulation.setCPUThrottlingRate', { rate: cpu });
  const r = await p.evaluate(async () => {
    const out = {};
    for (const f of ['kreslo-stred-m-1448.avif', 'rohozka-m-1448.avif', 'kreslo-stred-m-1086.avif', 'kreslo-stred-m-hlbka.webp']) {
      const blob = await (await fetch('/barbershop-30/assets/img/film/' + f)).blob();
      const ts = [];
      for (let i = 0; i < 3; i++) { const t = performance.now(); const bm = await createImageBitmap(blob); ts.push(Math.round(performance.now() - t)); out[f + ' ' + bm.width + 'x' + bm.height] = ts; bm.close(); }
    }
    return out;
  });
  console.log('CPU', cpu + '×', JSON.stringify(r));
  await ctx.close();
}
await b.close();
