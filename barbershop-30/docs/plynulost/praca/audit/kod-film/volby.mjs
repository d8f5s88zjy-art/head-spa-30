#!/usr/bin/env node
/* A/B: cena nahratia ImageBitmap do textúry podľa volieb createImageBitmap (film.js:438 ich nedáva).
   Varianty sa striedajú v každom kole (súbeh iných procesov zasiahne všetky rovnako), výsledok je medián.
   node volby.mjs [--cpu=4] [--kol=7] [--port=8248] [--out=volby.json] */
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.length ? v.join('=') : '1']; }));
const PORT = opt.port || 8248, CPU = Number(opt.cpu || 4), KOL = Number(opt.kol || 7);
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await page.goto(`http://127.0.0.1:${PORT}/barbershop-30/robots.txt`);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
const out = {};
for (const [meno, url] of [['telefon-zaber-1448x2575', 'assets/img/film/sala-m-1448.avif'], ['telefon-zaber-1086x1932', 'assets/img/film/sala-m-1086.avif'], ['sekvencia-720x1280', 'assets/seq/vstup-dnu/f020.avif'], ['pocitac-zaber-2172x1448', 'assets/img/film/sala-2172.avif']]) {
  out[meno] = await page.evaluate(async ({ url, KOL }) => {
    const now = () => performance.now();
    const c = document.createElement('canvas'); c.width = 8; c.height = 8; document.body.append(c);
    const gl = c.getContext('webgl2');
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    const blob = await (await fetch(url)).blob();
    const V = { predvolene: undefined, bezPremult: { premultiplyAlpha: 'none' }, bezFarieb: { colorSpaceConversion: 'none' }, oboje: { premultiplyAlpha: 'none', colorSpaceConversion: 'none' } };
    const R = {}; for (const k of Object.keys(V)) R[k] = { dek: [], cela: [], pasy: [], pas: [] };
    for (let i = 0; i < KOL; i++) {
      for (const [k, o] of Object.entries(V)) {
        let t0 = now(); const b = o ? await createImageBitmap(blob, o) : await createImageBitmap(blob); R[k].dek.push(now() - t0);
        const W = b.width, H = b.height;
        let t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, W, H); gl.finish();
        t0 = now(); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, b); R[k].cela.push(now() - t0); gl.finish(); gl.deleteTexture(t);
        t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, W, H); gl.finish();
        let s = 0, mx = 0;
        for (let y = 0; y < H; y += 256) { const h = Math.min(256, H - y); t0 = now(); gl.pixelStorei(gl.UNPACK_SKIP_ROWS, y); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, y, W, h, gl.RGBA, gl.UNSIGNED_BYTE, b); gl.pixelStorei(gl.UNPACK_SKIP_ROWS, 0); const d = now() - t0; s += d; mx = Math.max(mx, d); gl.finish(); }
        R[k].pasy.push(s); R[k].pas.push(mx); gl.deleteTexture(t); b.close();
      }
    }
    const med = (a) => { const z = [...a].sort((x, y) => x - y); return +z[Math.floor(z.length / 2)].toFixed(1); };
    const o = {}; for (const [k, v] of Object.entries(R)) o[k] = { dekodovanie: med(v.dek), cela: med(v.cela), pasySpolu: med(v.pasy), najdlhsiPas: med(v.pas) };
    c.remove(); return o;
  }, { url, KOL });
  console.log(meno, JSON.stringify(out[meno]));
}
if (opt.out) fs.writeFileSync(opt.out, JSON.stringify({ cpu: CPU, kol: KOL, out }, null, 1));
await browser.close();
