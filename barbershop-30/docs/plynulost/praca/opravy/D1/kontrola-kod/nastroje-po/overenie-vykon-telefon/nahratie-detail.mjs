// T1: čo presne robí hlavné vlákno pri texSubImage2D(ImageBitmap) – udalosti so všetkými kategóriami (CPU 1×)
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
await page.goto('http://127.0.0.1:8400/barbershop-30/robots.txt');
await page.evaluate(async () => { const c = document.createElement('canvas'); window.gl = c.getContext('webgl2'); window.bm = await createImageBitmap(await (await fetch('/barbershop-30/assets/seq/vstup-dnu/f010.avif')).blob()); });
await cdp.send('Tracing.start', { categories: '*,disabled-by-default-gpu.service,disabled-by-default-skia,disabled-by-default-devtools.timeline', transferMode: 'ReturnAsStream' });
await page.evaluate(() => new Promise((r) => setTimeout(() => { performance.mark('op'); const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, 720, 1280); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, bm); setTimeout(r, 100); }, 50)));
const done = new Promise((r) => cdp.once('Tracing.tracingComplete', r));
await cdp.send('Tracing.end'); const { stream } = await done;
let d = ''; for (;;) { const c = await cdp.send('IO.read', { handle: stream }); d += c.data; if (c.eof) break; }
await browser.close();
const evs = JSON.parse(d).traceEvents;
const tn = evs.find((e) => e.name === 'thread_name' && e.args.name === 'CrRendererMain');
const M = evs.filter((e) => e.pid === tn.pid && e.tid === tn.tid);
const mk = M.find((e) => e.name === 'op');
const tf = M.find((e) => e.name === 'TimerFire' && e.ph === 'X' && e.ts <= mk.ts && e.ts + e.dur >= mk.ts);
console.log('TimerFire stena', (tf.dur / 1000).toFixed(2), 'vlákno', (tf.tdur / 1000).toFixed(2));
// B/E páry aj X
const open = []; const rows = [];
for (const e of M.filter((e) => e.ts >= tf.ts && e.ts <= tf.ts + tf.dur).sort((a, b) => a.ts - b.ts)) {
  if (e.ph === 'X') rows.push([e.name, e.cat, e.dur / 1000, (e.tdur ?? 0) / 1000, e.ts]);
  else if (e.ph === 'B') open.push(e); else if (e.ph === 'E') { const b = open.pop(); if (b) rows.push([b.name, b.cat, (e.ts - b.ts) / 1000, ((e.tts ?? 0) - (b.tts ?? 0)) / 1000, b.ts]); }
}
rows.filter((r) => r[2] > 0.05).sort((a, b) => a[4] - b[4]).forEach((r) => console.log(`${r[0]} [${r[1]}] stena ${r[2].toFixed(2)} vlákno ${r[3].toFixed(2)}`));
