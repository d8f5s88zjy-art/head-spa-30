#!/usr/bin/env node
/* Cena nahrávania textúr na hlavnom vlákne (ako film.js): dekódovanie createImageBitmap, pás 256 riadkov
   texSubImage2D (film.js:477-489), generateMipmap, celá snímka sekvencie texImage2D 720×1280 (film.js:692).
   Meria sa čas volania v JS (kopírovanie do príkazového bufferu) zvlášť a čakanie na GPU (gl.finish) zvlášť,
   aby softvérové kreslenie (SwiftShader) neskreslilo prvé číslo. node nahravanie.mjs [--cpu=4] [--url=...] */
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.length ? v.join('=') : '1']; }));
const BASE = opt.url || 'http://127.0.0.1:8433/barbershop-30/';
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await page.goto(BASE + 'robots.txt');
await cdp.send('Emulation.setCPUThrottlingRate', { rate: Number(opt.cpu || 4) });
const r = await page.evaluate(async (base) => {
  const now = () => performance.now();
  const c = document.createElement('canvas'); c.width = 780; c.height = 1688; document.body.append(c);
  const gl = c.getContext('webgl2', { antialias: false });
  const out = {};
  const bmpOf = async (u) => { const b = await (await fetch(u)).blob(); const t = now(); const bm = await createImageBitmap(b); return [bm, now() - t, b.size]; };
  // fotka záberu pre telefón 1448 × 2575
  const [bm, dec, size] = await bmpOf(base + 'assets/img/film/sala-m-1448.avif');
  out.fotka = { rozmer: `${bm.width}x${bm.height}`, kB: Math.round(size / 1024), dekodovanieMs: +dec.toFixed(1) };
  const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
  const lv = Math.floor(Math.log2(Math.max(bm.width, bm.height))) + 1;
  gl.texStorage2D(gl.TEXTURE_2D, lv, gl.RGBA8, bm.width, bm.height); gl.finish();
  const pasy = [], cakanie = [];
  for (let y = 0; y < bm.height; y += 256) {
    const h = Math.min(256, bm.height - y);
    const a = now(); gl.pixelStorei(gl.UNPACK_SKIP_ROWS, y); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, y, bm.width, h, gl.RGBA, gl.UNSIGNED_BYTE, bm); gl.pixelStorei(gl.UNPACK_SKIP_ROWS, 0);
    const b = now(); gl.finish(); const f = now();
    pasy.push(+(b - a).toFixed(2)); cakanie.push(+(f - b).toFixed(2));
  }
  out.pasy = { pocet: pasy.length, jsMs: pasy, spoluJsMs: +pasy.reduce((x, y) => x + y, 0).toFixed(1), finishMs: +cakanie.reduce((x, y) => x + y, 0).toFixed(1) };
  let a = now(); gl.generateMipmap(gl.TEXTURE_2D); let b = now(); gl.finish(); out.mipmapy = { jsMs: +(b - a).toFixed(2), finishMs: +(now() - b).toFixed(1) };
  // celé naraz (porovnanie)
  const t2 = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t2); gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, bm.width, bm.height); gl.finish();
  a = now(); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, bm); b = now(); gl.finish(); out.celaNaraz = { jsMs: +(b - a).toFixed(1), finishMs: +(now() - b).toFixed(1) };
  // snímka sekvencie 720 × 1280 ako vo film.js (tex + initTexture = texImage2D celej snímky)
  const sq = [];
  for (let i = 0; i < 6; i++) {
    const [s, d2] = await bmpOf(base + `assets/seq/vstup-dnu/f0${String(10 + i).padStart(2, '0')}.avif`);
    const tt = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tt);
    a = now(); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, s); b = now(); gl.finish();
    sq.push({ dekodovanieMs: +d2.toFixed(1), jsMs: +(b - a).toFixed(1), finishMs: +(now() - b).toFixed(1) });
  }
  out.sekvencia = sq;
  // hĺbková mapa 768 × 1366
  const [dm, d3] = await bmpOf(base + 'assets/img/film/sala-m-hlbka.webp');
  const td = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, td);
  a = now(); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, dm); b = now(); gl.finish();
  out.hlbka = { rozmer: `${dm.width}x${dm.height}`, dekodovanieMs: +d3.toFixed(1), jsMs: +(b - a).toFixed(1), finishMs: +(now() - b).toFixed(1) };
  return out;
}, BASE);
console.log(JSON.stringify(r, null, 1));
await browser.close();
