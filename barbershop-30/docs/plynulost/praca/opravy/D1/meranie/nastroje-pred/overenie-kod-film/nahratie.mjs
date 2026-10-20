#!/usr/bin/env node
/* Overenie KF-05/KF-06: cena nahratia fotiek do grafiky na hlavnom vlákne (WebGL2, ten istý postup ako film.js).
   - fotka telefónu kreslo-stred-m-1448.avif (1448×2575): pásy po 256 riadkoch z ImageBitmap (UNPACK_SKIP_ROWS) ako upload()
     vs. pásy z Uint8Array (pixely vytiahnuté vopred) vs. jedno celé nahratie
   - hĺbka 768×1366 po pásoch, snímka sekvencie 720×1280 celá (ako seqDrive: nová textúra + texStorage2D + celé nahratie)
   node nahratie.mjs --port=8310 --cpu=4 --opakuj=5 */
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const here = path.dirname(new URL(import.meta.url).pathname);
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.length ? v.join('=') : '1']; }));
const PORT = opt.port || 8310, CPU = Number(opt.cpu || 4), N = Number(opt.opakuj || 5);
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
await page.goto(`http://127.0.0.1:${PORT}/barbershop-30/robots.txt`);
const cdp = await ctx.newCDPSession(page);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
const r = await page.evaluate(async (N) => {
  const now = () => performance.now();
  const c = document.createElement('canvas'); c.width = 780; c.height = 1688; document.body.appendChild(c);
  const gl = c.getContext('webgl2', { antialias: false });
  const blob = async (u) => (await fetch(u)).blob();
  const photoB = await blob('assets/img/film/kreslo-stred-m-1448.avif');
  const depthB = await blob('assets/img/film/kreslo-stred-m-hlbka.webp');
  const seqB = await blob('assets/seq/okolo-kresla/f010.avif');
  const levels = (w, h) => Math.floor(Math.log2(Math.max(w, h))) + 1;
  const out = { pasyBitmap: [], pasyBitmapSpolu: [], pasyBitmapMax: [], mip: [], pasyU8: [], pasyU8Spolu: [], pasyU8Max: [], vytiahnutie: [], celaBitmap: [], hlbkaPasy: [], hlbkaSpolu: [], seqCela: [], dekodFotka: [], dekodSeq: [] };
  const med = (a) => { const s = [...a].sort((x, y) => x - y); return +s[Math.floor(s.length / 2)].toFixed(2); };
  for (let it = 0; it < N; it++) {
    let t = now(); const bmp = await createImageBitmap(photoB); out.dekodFotka.push(now() - t);
    const W = bmp.width, H = bmp.height;
    // a) pásy z ImageBitmap (ako upload() vo film.js), textúra s mipmapami (texStorage2D všetkých úrovní)
    let tx = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tx); gl.texStorage2D(gl.TEXTURE_2D, levels(W, H), gl.RGBA8, W, H);
    const pasy = [];
    for (let y = 0; y < H; y += 256) {
      const h = Math.min(256, H - y);
      t = now(); gl.pixelStorei(gl.UNPACK_SKIP_ROWS, y); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, y, W, h, gl.RGBA, gl.UNSIGNED_BYTE, bmp); gl.pixelStorei(gl.UNPACK_SKIP_ROWS, 0); pasy.push(now() - t);
    }
    out.pasyBitmap.push(...pasy); out.pasyBitmapSpolu.push(pasy.reduce((a, b) => a + b, 0)); out.pasyBitmapMax.push(Math.max(...pasy));
    t = now(); gl.generateMipmap(gl.TEXTURE_2D); out.mip.push(now() - t);
    gl.finish(); gl.deleteTexture(tx);
    // b) pixely vytiahnuté vopred (OffscreenCanvas; vo filme by to bolo vo workeri), pásy z Uint8Array
    t = now(); const oc = new OffscreenCanvas(W, H); const x2 = oc.getContext('2d', { willReadFrequently: true }); x2.drawImage(bmp, 0, 0); const px = new Uint8Array(x2.getImageData(0, 0, W, H).data.buffer); out.vytiahnutie.push(now() - t);
    tx = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tx); gl.texStorage2D(gl.TEXTURE_2D, levels(W, H), gl.RGBA8, W, H);
    const p2 = [];
    for (let y = 0; y < H; y += 256) { const h = Math.min(256, H - y); t = now(); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, y, W, h, gl.RGBA, gl.UNSIGNED_BYTE, px.subarray(y * W * 4, (y + h) * W * 4)); p2.push(now() - t); }
    out.pasyU8.push(...p2); out.pasyU8Spolu.push(p2.reduce((a, b) => a + b, 0)); out.pasyU8Max.push(Math.max(...p2));
    gl.finish(); gl.deleteTexture(tx);
    // c) celá fotka jedným volaním
    tx = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tx); gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, W, H);
    t = now(); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, bmp); out.celaBitmap.push(now() - t);
    gl.finish(); gl.deleteTexture(tx); bmp.close();
    // d) hĺbka 768×1366 po pásoch (bez mipmáp)
    const db = await createImageBitmap(depthB);
    tx = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tx); gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, db.width, db.height);
    const p3 = [];
    for (let y = 0; y < db.height; y += 256) { const h = Math.min(256, db.height - y); t = now(); gl.pixelStorei(gl.UNPACK_SKIP_ROWS, y); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, y, db.width, h, gl.RGBA, gl.UNSIGNED_BYTE, db); gl.pixelStorei(gl.UNPACK_SKIP_ROWS, 0); p3.push(now() - t); }
    out.hlbkaPasy.push(...p3); out.hlbkaSpolu.push(p3.reduce((a, b) => a + b, 0)); gl.finish(); gl.deleteTexture(tx); db.close();
    // e) snímka sekvencie 720×1280 ako seqDrive (nová textúra, texStorage2D, celé nahratie)
    t = now(); const sb = await createImageBitmap(seqB); out.dekodSeq.push(now() - t);
    t = now(); tx = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tx); gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, sb.width, sb.height); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, sb.width, sb.height, gl.RGBA, gl.UNSIGNED_BYTE, sb); out.seqCela.push(now() - t);
    gl.finish(); gl.deleteTexture(tx); sb.close();
    await new Promise((r) => setTimeout(r, 200));
  }
  const res = {};
  for (const [k, v] of Object.entries(out)) res[k] = { median: med(v), max: +Math.max(...v).toFixed(2), n: v.length };
  res.pocetPasovFotky = Math.ceil(2575 / 256);
  return res;
}, N);
const vys = { CPU, N, r };
fs.writeFileSync(path.join(here, `nahratie-cpu${CPU}.json`), JSON.stringify(vys, null, 1));
console.log(JSON.stringify(vys, null, 1));
await browser.close();
