#!/usr/bin/env node
/* Kód filmu – mikromerania nahrávania textúr na hlavnom vlákne (Chrome, CPU spomalené cez CDP).
   Porovnáva spôsob z film.js (createImageBitmap bez volieb, texStorage2D + pásy po 256 riadkoch s UNPACK_SKIP_ROWS
   z celej bitmapy, film.js:467-489; potom generateMipmap) s alternatívami:
     cela      – jedno texSubImage2D celej bitmapy
     pasy      – ako film.js (UNPACK_SKIP_ROWS, zdroj = celá bitmapa)
     pasyOrez  – pásy z vopred orezaných ImageBitmap (createImageBitmap(bmp, 0, y, w, 256))
     pasyPole  – pásy z Uint8Array (pixely raz vytiahnuté cez OffscreenCanvas – v ostrom kóde vo workeri)
     bezPremult– bitmapa s { premultiplyAlpha:'none', colorSpaceConversion:'none' } (celá aj pásy)
     zmensena  – createImageBitmap s resizeWidth (napr. 1448 -> 1086) a jej nahratie
   Meria sa čas volania v JS (to blokuje hlavné vlákno) a zvlášť gl.finish (softvérová grafika SwiftShader, nie telefón).
   Použitie: node textury.mjs [--cpu=4] [--port=8248] [--opakuj=3] [--out=subor.json] */
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.length ? v.join('=') : '1']; }));
const PORT = opt.port || 8248, CPU = Number(opt.cpu || 4), REP = Number(opt.opakuj || 3);
const BASE = `http://127.0.0.1:${PORT}/barbershop-30/`;
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await page.goto(BASE + 'robots.txt');
await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
const subory = [
  ['telefon-zaber-1448x2575', 'assets/img/film/sala-m-1448.avif', 1086],
  ['pocitac-zaber-2172x1448', 'assets/img/film/sala-2172.avif', 1448],
  ['pocitac-zaber-2896x1931', 'assets/img/film/sala-2896.avif', 2172],
  ['prolog-pocitac-4096x2731', 'assets/img/film/vstup-4096.avif', 2896],
  ['hlbka-telefon-768x1366', 'assets/img/film/sala-m-hlbka.webp', 0],
  ['sekvencia-720x1280', 'assets/seq/vstup-dnu/f020.avif', 0],
];
const vysledok = { cpu: CPU, opakovania: REP, ua: await page.evaluate(() => navigator.userAgent), subory: {} };
for (const [meno, url, zmen] of subory) {
  const r = await page.evaluate(async ({ base, url, zmen, REP }) => {
    const now = () => performance.now();
    const med = (a) => { const s = [...a].sort((x, y) => x - y); return +s[Math.floor(s.length / 2)].toFixed(2); };
    const c = document.createElement('canvas'); c.width = 780; c.height = 1688; document.body.append(c);
    const gl = c.getContext('webgl2', { antialias: false, alpha: false });
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);   // ako three pre NoColorSpace
    const blob = await (await fetch(base + url)).blob();
    // hlavné vlákno počas dekódovania: najdlhšia medzera medzi snímkami (rAF) kým beží createImageBitmap
    const dek = async (o) => {
      let gap = 0, last = now(), go = true;
      const tick = () => { const t = now(); gap = Math.max(gap, t - last); last = t; if (go) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
      const t0 = now(); const b = o ? await createImageBitmap(blob, o) : await createImageBitmap(blob); const d = now() - t0;
      go = false; return [b, d, gap];
    };
    const out = { kB: Math.round(blob.size / 1024) };
    const levels = (w, h) => Math.floor(Math.log2(Math.max(w, h))) + 1;
    const alloc = (w, h, mip) => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texStorage2D(gl.TEXTURE_2D, mip ? levels(w, h) : 1, gl.RGBA8, w, h); gl.finish(); return t; };
    const R = { dekodovanieMs: [], dekodMaxMedzeraSnimokMs: [], cela: [], celaFinish: [], pasySpolu: [], pasyMax: [], pasyFinish: [], pasyPocet: 0, mipmapJs: [], mipmapFinish: [],
      orezVytvorenieMs: [], pasyOrezSpolu: [], pasyOrezMax: [], polePixelyMs: [], pasyPoleSpolu: [], pasyPoleMax: [],
      bezPremultCela: [], bezPremultPasySpolu: [], bezPremultPasyMax: [], zmensenaDekodMs: [], zmensenaCela: [], texImage2DCela: [] };
    for (let k = 0; k < REP; k++) {
      const [bm, d, gap] = await dek(null); R.dekodovanieMs.push(d); R.dekodMaxMedzeraSnimokMs.push(gap);
      const W = bm.width, H = bm.height; out.rozmer = `${W}x${H}`; out.MBrgba = +(W * H * 4 / 1e6).toFixed(1); out.MBsMipmapami = +(W * H * 4 * 4 / 3 / 1e6).toFixed(1);
      // celé naraz (texSubImage2D do texStorage2D)
      let t = alloc(W, H, false); let a = now(); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, bm); let b = now(); gl.finish();
      R.cela.push(b - a); R.celaFinish.push(now() - b); gl.deleteTexture(t);
      // texImage2D celé (ako three initTexture / sekvencia, film.js:692)
      t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); a = now(); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bm); b = now(); gl.finish(); R.texImage2DCela.push(b - a); gl.deleteTexture(t);
      // pásy ako film.js:477-489
      t = alloc(W, H, true); const pj = []; let fin = 0;
      for (let y = 0; y < H; y += 256) {
        const h = Math.min(256, H - y);
        a = now(); gl.pixelStorei(gl.UNPACK_SKIP_ROWS, y); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, y, W, h, gl.RGBA, gl.UNSIGNED_BYTE, bm); gl.pixelStorei(gl.UNPACK_SKIP_ROWS, 0); b = now();
        gl.finish(); fin += now() - b; pj.push(b - a);
      }
      R.pasySpolu.push(pj.reduce((x, y) => x + y, 0)); R.pasyMax.push(Math.max(...pj)); R.pasyFinish.push(fin); R.pasyPocet = pj.length;
      a = now(); gl.generateMipmap(gl.TEXTURE_2D); b = now(); gl.finish(); R.mipmapJs.push(b - a); R.mipmapFinish.push(now() - b);
      gl.deleteTexture(t);
      // pásy z vopred orezaných bitmáp
      a = now(); const crops = []; for (let y = 0; y < H; y += 256) crops.push([y, await createImageBitmap(bm, 0, y, W, Math.min(256, H - y))]); R.orezVytvorenieMs.push(now() - a);
      t = alloc(W, H, false); const po = [];
      for (const [y, cb] of crops) { a = now(); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, y, cb.width, cb.height, gl.RGBA, gl.UNSIGNED_BYTE, cb); po.push(now() - a); cb.close(); }
      gl.finish(); R.pasyOrezSpolu.push(po.reduce((x, y) => x + y, 0)); R.pasyOrezMax.push(Math.max(...po)); gl.deleteTexture(t);
      // pásy z Uint8Array (pixely z OffscreenCanvas; v ostrom kóde vo workeri, tu len cena nahratia)
      a = now(); const oc = new OffscreenCanvas(W, H); const ox = oc.getContext('2d', { willReadFrequently: true }); ox.drawImage(bm, 0, 0); const px = ox.getImageData(0, 0, W, H).data; R.polePixelyMs.push(now() - a);
      t = alloc(W, H, false); const pp = [];
      for (let y = 0; y < H; y += 256) { const h = Math.min(256, H - y); const v = new Uint8Array(px.buffer, y * W * 4, h * W * 4); a = now(); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, y, W, h, gl.RGBA, gl.UNSIGNED_BYTE, v); pp.push(now() - a); }
      gl.finish(); R.pasyPoleSpolu.push(pp.reduce((x, y) => x + y, 0)); R.pasyPoleMax.push(Math.max(...pp)); gl.deleteTexture(t);
      bm.close();
      // bitmapa bez premultiplikácie a prevodu farieb
      const [bn] = await dek({ premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
      t = alloc(W, H, false); a = now(); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, bn); R.bezPremultCela.push(now() - a); gl.finish(); gl.deleteTexture(t);
      t = alloc(W, H, false); const pn = [];
      for (let y = 0; y < H; y += 256) { const h = Math.min(256, H - y); a = now(); gl.pixelStorei(gl.UNPACK_SKIP_ROWS, y); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, y, W, h, gl.RGBA, gl.UNSIGNED_BYTE, bn); gl.pixelStorei(gl.UNPACK_SKIP_ROWS, 0); pn.push(now() - a); }
      gl.finish(); R.bezPremultPasySpolu.push(pn.reduce((x, y) => x + y, 0)); R.bezPremultPasyMax.push(Math.max(...pn)); gl.deleteTexture(t); bn.close();
      // zmenšená bitmapa (resizeWidth) – menšia textúra pre telefón
      if (zmen) {
        const [bz, dz] = await dek({ resizeWidth: zmen, resizeQuality: 'high' }); R.zmensenaDekodMs.push(dz); out.zmensena = `${bz.width}x${bz.height}`;
        t = alloc(bz.width, bz.height, false); a = now(); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, bz.width, bz.height, gl.RGBA, gl.UNSIGNED_BYTE, bz); R.zmensenaCela.push(now() - a); gl.finish(); gl.deleteTexture(t); bz.close();
      }
    }
    for (const [k, v] of Object.entries(R)) out[k] = Array.isArray(v) ? (v.length ? med(v) : null) : v;
    const lose = gl.getExtension('WEBGL_lose_context'); if (lose) lose.loseContext(); c.remove();
    return out;
  }, { base: BASE, url, zmen, REP });
  vysledok.subory[meno] = r;
  console.log(meno, JSON.stringify(r));
}
if (opt.out) fs.writeFileSync(opt.out, JSON.stringify(vysledok, null, 1));
await browser.close();
