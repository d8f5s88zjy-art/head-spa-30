#!/usr/bin/env node
/* Overenie T1: koľko CPU hlavného vlákna (tdur zo stopy, bez čakania na GPU proces) stojí nahratie textúry
   tak, ako ho robí film.js, a koľko je čakanie (dur - tdur). Každé volanie beží vo vlastnej úlohe (setTimeout),
   aby sa dalo zo stopy priradiť. Po každom volaní gl.finish() v ďalšej úlohe (GPU sa vyprázdni).
   node nahratie-vlakno.mjs [--cpu=4] [--port=8402] */
import { createRequire } from 'module';
import fs from 'node:fs';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.length ? v.join('=') : '1']; }));
const CPU = Number(opt.cpu || 4), BASE = `http://127.0.0.1:${opt.port || 8402}/barbershop-30/`;
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await page.goto(BASE + 'robots.txt');
await page.evaluate(async (base) => {
  const c = document.createElement('canvas'); c.width = 780; c.height = 1688; document.body.append(c);
  const gl = window.gl = c.getContext('webgl2', { antialias: false });
  const bm = async (u) => createImageBitmap(await (await fetch(u)).blob());
  window.B = { foto: await bm(base + 'assets/img/film/sala-m-1448.avif') };
  window.SQ = []; for (let i = 0; i < 8; i++) SQ.push(await (await fetch(base + `assets/seq/vstup-dnu/f0${String(10 + i).padStart(2, '0')}.avif`)).blob());
  window.SQB = []; for (const b of SQ) SQB.push(await createImageBitmap(b));
  window.log = [];
}, BASE);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
await cdp.send('Tracing.start', { categories: 'devtools.timeline,disabled-by-default-devtools.timeline,blink.user_timing,gpu,v8', transferMode: 'ReturnAsStream' });
// jedna operácia = jedna úloha; meno sa zapíše cez performance.mark tesne pred ňou
const runs = await page.evaluate(async () => {
  const gl = window.gl, out = [];
  const task = (name, fn) => new Promise((r) => setTimeout(() => { performance.mark('op:' + name); const t = performance.now(); fn(); out.push([name, performance.now() - t]); setTimeout(() => { const f = performance.now(); gl.finish(); out.push(['finish:' + name, performance.now() - f]); setTimeout(r, 30); }, 0); }, 30));
  const bmp = B.foto;
  const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texStorage2D(gl.TEXTURE_2D, 12, gl.RGBA8, bmp.width, bmp.height); gl.finish();
  for (let y = 0; y < bmp.height; y += 256) {
    const h = Math.min(256, bmp.height - y);
    await task('pas256@' + y, () => { gl.bindTexture(gl.TEXTURE_2D, t); gl.pixelStorei(gl.UNPACK_SKIP_ROWS, y); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, y, bmp.width, h, gl.RGBA, gl.UNSIGNED_BYTE, bmp); gl.pixelStorei(gl.UNPACK_SKIP_ROWS, 0); });
  }
  await task('mipmap', () => { gl.bindTexture(gl.TEXTURE_2D, t); gl.generateMipmap(gl.TEXTURE_2D); });
  // snímka sekvencie ako three initTexture: texStorage2D + texSubImage2D celej snímky 720×1280
  for (let i = 0; i < SQB.length; i++) {
    await task('seq720x1280#' + i, () => { const tt = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tt); gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, 720, 1280); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, SQB[i]); });
  }
  // dve snímky v jednej úlohe (seqDrive nahrá až 2 za snímku displeja)
  await task('seq2x', () => { for (let i = 0; i < 2; i++) { const tt = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tt); gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, 720, 1280); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, SQB[i]); } });
  // dekódovanie createImageBitmap: koľko z neho je na hlavnom vlákne (čaká sa v ďalšej úlohe)
  for (let i = 0; i < 4; i++) {
    await new Promise((r) => setTimeout(async () => { performance.mark('op:decode#' + i); const t0 = performance.now(); const p = createImageBitmap(SQ[i]); const t1 = performance.now(); const b = await p; out.push(['decode-call#' + i, t1 - t0]); out.push(['decode-wall#' + i, performance.now() - t0]); b.close(); setTimeout(r, 30); }, 30));
  }
  return out;
});
const done = new Promise((r) => cdp.once('Tracing.tracingComplete', r));
await cdp.send('Tracing.end');
const { stream } = await done;
let raw = ''; for (;;) { const c = await cdp.send('IO.read', { handle: stream }); raw += c.data; if (c.eof) break; }
await browser.close();
const evs = JSON.parse(raw).traceEvents;
const main = evs.find((e) => e.name === 'thread_name' && e.args.name === 'CrRendererMain');
const M = evs.filter((e) => e.pid === main.pid && e.tid === main.tid);
const marks = M.filter((e) => e.cat && e.cat.includes('blink.user_timing') && e.name.startsWith('op:')).map((e) => ({ n: e.name.slice(3), ts: e.ts }));
const timers = M.filter((e) => e.name === 'TimerFire' && e.ph === 'X');
// k marke priradiť TimerFire, ktorý ju obsahuje
const res = {};
for (const m of marks) {
  const tf = timers.find((e) => e.ts <= m.ts && e.ts + e.dur >= m.ts);
  if (tf) res[m.n] = { wallMs: +(tf.dur / 1000).toFixed(2), vlaknoMs: +(tf.tdur / 1000).toFixed(2) };
}
const wall = Object.fromEntries(runs.map(([n, v]) => [n, +v.toFixed(2)]));
const agg = (re) => { const k = Object.keys(res).filter((x) => re.test(x)); const s = (f) => +k.reduce((a, x) => a + res[x][f], 0).toFixed(1); return { n: k.length, vlaknoSpolu: s('vlaknoMs'), wallSpolu: s('wallMs'), vlaknoMax: Math.max(...k.map((x) => res[x].vlaknoMs)), vlaknoP50: k.map((x) => res[x].vlaknoMs).sort((a, b) => a - b)[k.length >> 1] }; };
const out = { cpu: CPU, zataz: fs.readFileSync('/proc/loadavg', 'utf8').split(' ').slice(0, 3), ulohy: res, jsCas: wall, suhrn: { pasy: agg(/^pas256/), seq: agg(/^seq720/), seq2x: res.seq2x, mipmap: res.mipmap, dekodovanie: agg(/^decode/) } };
fs.writeFileSync(`vysledky/nahratie-vlakno-cpu${CPU}.json`, JSON.stringify(out, null, 1));
console.log(JSON.stringify(out.suhrn, null, 1));
