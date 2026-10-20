#!/usr/bin/env node
/* Doplnok k nahratie-vlakno.mjs: z čoho sa skladá CPU nahratia snímky 720×1280 – ImageBitmap (prevod formátu
   pixelov v prehliadači) vs. surové RGBA pole (len kopírovanie do príkazového bufferu) vs. VideoFrame/canvas.
   node nahratie-zdroj.mjs [--cpu=4] */
import { createRequire } from 'module';
import fs from 'node:fs';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.length ? v.join('=') : '1']; }));
const CPU = Number(opt.cpu || 4), BASE = `http://127.0.0.1:${opt.port || 8432}/barbershop-30/`;
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await page.goto(BASE + 'robots.txt');
await page.evaluate(async (base) => {
  const c = document.createElement('canvas'); c.width = 780; c.height = 1688; document.body.append(c);
  window.gl = c.getContext('webgl2', { antialias: false });
  const blob = await (await fetch(base + 'assets/seq/vstup-dnu/f010.avif')).blob();
  window.S = {
    bitmap: await createImageBitmap(blob),
    bitmapNone: await createImageBitmap(blob, { premultiplyAlpha: 'none', colorSpaceConversion: 'none' }),
    raw: new Uint8Array(720 * 1280 * 4).fill(128),
  };
}, BASE);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
await cdp.send('Tracing.start', { categories: 'devtools.timeline,disabled-by-default-devtools.timeline,blink.user_timing', transferMode: 'ReturnAsStream' });
await page.evaluate(async () => {
  const task = (name, fn) => new Promise((r) => setTimeout(() => { performance.mark('op:' + name); fn(); setTimeout(() => { gl.finish(); setTimeout(r, 30); }, 0); }, 30));
  for (let rep = 0; rep < 4; rep++) for (const k of ['bitmap', 'bitmapNone', 'raw']) {
    await task(k + '#' + rep, () => { const tt = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tt); gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, 720, 1280);
      if (k === 'raw') gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 720, 1280, gl.RGBA, gl.UNSIGNED_BYTE, S.raw); else gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, S[k]); });
  }
});
const done = new Promise((r) => cdp.once('Tracing.tracingComplete', r));
await cdp.send('Tracing.end');
const { stream } = await done;
let raw = ''; for (;;) { const c = await cdp.send('IO.read', { handle: stream }); raw += c.data; if (c.eof) break; }
await browser.close();
const evs = JSON.parse(raw).traceEvents;
const main = evs.find((e) => e.name === 'thread_name' && e.args.name === 'CrRendererMain');
const M = evs.filter((e) => e.pid === main.pid && e.tid === main.tid);
const timers = M.filter((e) => e.name === 'TimerFire' && e.ph === 'X');
const res = {};
for (const m of M.filter((e) => e.name.startsWith('op:'))) {
  const tf = timers.find((e) => e.ts <= m.ts && e.ts + e.dur >= m.ts);
  const k = m.name.slice(3).split('#')[0];
  if (tf) (res[k] || (res[k] = [])).push(+(tf.tdur / 1000).toFixed(2));
}
const out = { cpu: CPU, vlaknoMsNaSnimku720x1280: res };
fs.writeFileSync(`vysledky/nahratie-zdroj-cpu${CPU}.json`, JSON.stringify(out, null, 1));
console.log(JSON.stringify(out));
