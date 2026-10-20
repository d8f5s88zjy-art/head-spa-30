// Cena zmeny atribútu data-scene-active na <html> (app.js:212 pri každej zmene kapitoly) oproti nepoužitému atribútu;
// trace UpdateLayoutTree.elementCount ukáže, koľko prvkov sa prepočíta. Telefón, CPU 4×, ?uvod=off&film=off.
import { BASE, launch, open, sleep, traceStart, CATS } from './spolocne.mjs';
import { mainThread } from './analyza.mjs';
const browser = await launch();
const { page, cdp, ctx } = await open(browser, { cpu: 1, net: 'none' });
await page.goto(BASE + '?uvod=off&film=off', { waitUntil: 'load' });
await sleep(4500);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
const stop = await traceStart(cdp, CATS);
const r = await page.evaluate(() => {
  const h = document.documentElement, N = 40, out = {};
  const run = (name, fn) => { let s = 0; for (let i = 0; i < N; i++) { fn(i); const t = performance.now(); void document.body.offsetTop; s += performance.now() - t; } out[name] = +(s / N).toFixed(2); };
  performance.mark('a0'); run('data-scene-active (dnes)', (i) => h.setAttribute('data-scene-active', String(1 + (i % 8)))); performance.mark('a1');
  run('nepoužitý atribút data-x', (i) => h.setAttribute('data-x', String(1 + (i % 8)))); performance.mark('a2');
  return out;
});
const ev = await stop();
const mt = mainThread(ev);
const marks = Object.fromEntries(ev.filter((e) => e.cat && e.cat.includes('blink.user_timing') && /^a\d$/.test(e.name)).map((e) => [e.name, e.ts]));
const cnt = (a, b) => { const c = ev.filter((e) => `${e.pid}:${e.tid}` === mt && e.name === 'UpdateLayoutTree' && e.ph === 'X' && e.ts >= marks[a] && e.ts <= marks[b]).map((e) => e.args.elementCount || 0).sort((x, y) => x - y); return c.length ? `medián ${c[c.length >> 1]} prvkov (n ${c.length})` : '?'; };
console.log('ms na jednu zmenu + vynútený prepočet (CPU 4×):', r);
console.log('data-scene-active:', cnt('a0', 'a1'), '| data-x:', cnt('a1', 'a2'));
await ctx.close(); await browser.close();
