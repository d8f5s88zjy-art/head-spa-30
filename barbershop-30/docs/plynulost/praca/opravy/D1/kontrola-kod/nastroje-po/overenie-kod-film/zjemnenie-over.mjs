#!/usr/bin/env node
/* Overenie KF-07: relatívna cena zjemnenia hĺbkovej mapy (soften() vo film.js:382–398, ten istý shader a polomery)
   voči jednému celoplošnému prechodu strihu (12 vzoriek textureLod, 780×1688). Čistý WebGL2, čas cez gl.finish (SwiftShader:
   absolútne časy neplatia pre telefón, platí pomer, keďže obe práce sú vzorkovanie textúr + slučka).
   node zjemnenie-over.mjs --port=8400 --opakuj=5 */
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const here = path.dirname(new URL(import.meta.url).pathname);
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.length ? v.join('=') : '1']; }));
const PORT = opt.port || 8400, N = Number(opt.opakuj || 5);
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
await page.goto(`http://127.0.0.1:${PORT}/barbershop-30/robots.txt`);
const r = await page.evaluate(async (N) => {
  const c = document.createElement('canvas'); c.width = 4; c.height = 4; document.body.appendChild(c);
  const gl = c.getContext('webgl2');
  const VS = '#version 300 es\nin vec2 p; void main(){ gl_Position = vec4(p,0.,1.); }';
  // shader zjemnenia prepísaný 1:1 z film.js (GLSL ES 3.0 kvôli in/out; slučka -40..40 s continue)
  const FS_SOFT = `#version 300 es
  precision highp float; uniform sampler2D tSrc; uniform vec2 uTexel, uDir; uniform float uR, uMode; out vec4 o;
  void main(){ vec2 uv = gl_FragCoord.xy * uTexel; float acc = 0.0, ws = 0.0, s2 = uR * uR / 9.0;
    for (int i = -40; i <= 40; i++) { float f = float(i); if (abs(f) > uR) continue; float z = texture(tSrc, uv + uDir * uTexel * f).r;
      if (uMode < 0.5) acc = max(acc, z); else { float w = exp(-0.5 * f * f / s2); acc += z * w; ws += w; } }
    if (uMode > 0.5) acc /= ws; o = vec4(acc, acc, acc, 1.0); }`;
  // prechod strihu: 12 vzoriek textureLod (ako streak/zoom s 2*NT, NT = 6 na telefóne)
  const FS_POST = `#version 300 es
  precision highp float; uniform sampler2D tA; uniform vec2 uRes; out vec4 o;
  void main(){ vec2 uv = gl_FragCoord.xy / uRes; vec4 a = vec4(0.); for (int i = 0; i < 12; i++) a += textureLod(tA, uv + vec2(0.01 * float(i) - 0.06, 0.), 2.0); o = a / 12.0; }`;
  // gl.finish v Chrome nečaká na grafiku: synchronizácia čítaním 1 px (readPixels čaká na dokončenie)
  const px1 = new Uint8Array(4); const sync = () => gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px1);
  const prog = (fs) => { const p = gl.createProgram(); for (const [t, s] of [[gl.VERTEX_SHADER, VS], [gl.FRAGMENT_SHADER, fs]]) { const sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh); if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh)); gl.attachShader(p, sh); } gl.bindAttribLocation(p, 0, 'p'); gl.linkProgram(p); return p; };
  const pS = prog(FS_SOFT), pP = prog(FS_POST);
  const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const texRT = (w, h, mip) => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texStorage2D(gl.TEXTURE_2D, mip ? Math.floor(Math.log2(Math.max(w, h))) + 1 : 1, gl.RGBA8, w, h); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mip ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0); return { t, fb, w, h }; };
  const depthBmp = await createImageBitmap(await (await fetch('assets/img/film/kreslo-stred-m-hlbka.webp')).blob());
  const src = (w, h) => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, w, h); const cv = new OffscreenCanvas(w, h); cv.getContext('2d').drawImage(depthBmp, 0, 0, w, h); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, cv.transferToImageBitmap()); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); return t; };
  function soften(w, h, seg) {
    const s0 = src(w, h), a = texRT(w, h), b = texRT(w, h);
    const sig = Math.max(1.5, 1.2 * w / seg), r1 = Math.round(2 * sig), r2 = Math.min(40, Math.round(3 * sig));
    gl.useProgram(pS); gl.viewport(0, 0, w, h);
    const U = (n) => gl.getUniformLocation(pS, n);
    const pass = (t, dst, dx, dy, mode, r) => { gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fb); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, t); gl.uniform1i(U('tSrc'), 0); gl.uniform2f(U('uTexel'), 1 / w, 1 / h); gl.uniform2f(U('uDir'), dx, dy); gl.uniform1f(U('uMode'), mode); gl.uniform1f(U('uR'), r); gl.drawArrays(gl.TRIANGLES, 0, 3); };
    gl.bindFramebuffer(gl.FRAMEBUFFER, b.fb); sync();
    const t0 = performance.now();
    pass(s0, a, 1, 0, 0, r1); pass(a.t, b, 0, 1, 0, r1); pass(b.t, a, 1, 0, 1, r2); pass(a.t, b, 0, 1, 1, r2);
    sync();
    const ms = performance.now() - t0;
    const vzoriek = w * h * ((2 * r1 + 1) * 2 + (2 * r2 + 1) * 2);
    return { ms, r1, r2, vzoriekM: +(vzoriek / 1e6).toFixed(1) };
  }
  function post() {
    const A = texRT(780, 1688, true); gl.bindFramebuffer(gl.FRAMEBUFFER, A.fb); gl.clearColor(0.3, 0.2, 0.1, 1); gl.clear(gl.COLOR_BUFFER_BIT); gl.bindTexture(gl.TEXTURE_2D, A.t); gl.generateMipmap(gl.TEXTURE_2D);
    const D = texRT(780, 1688); gl.useProgram(pP); gl.viewport(0, 0, 780, 1688); gl.bindFramebuffer(gl.FRAMEBUFFER, D.fb); gl.bindTexture(gl.TEXTURE_2D, A.t);
    gl.uniform1i(gl.getUniformLocation(pP, 'tA'), 0); gl.uniform2f(gl.getUniformLocation(pP, 'uRes'), 780, 1688);
    sync(); const t0 = performance.now(); gl.drawArrays(gl.TRIANGLES, 0, 3); sync(); return { ms: performance.now() - t0, vzoriekM: +(780 * 1688 * 12 / 1e6).toFixed(1) };
  }
  const med = (a) => { const s = [...a].sort((x, y) => x - y); return +s[Math.floor(s.length / 2)].toFixed(1); };
  const out = { telefon: [], pocitac: [], telefonMriezka: [], prechod: [] };
  let meta = {};
  for (let i = 0; i < N; i++) {
    let x = soften(768, 1366, 112); out.telefon.push(x.ms); meta.telefon = x;
    x = soften(768, 512, 256); out.pocitac.push(x.ms); meta.pocitac = x;
    x = soften(226, 402, 112); out.telefonMriezka.push(x.ms); meta.telefonMriezka = x;
    x = post(); out.prechod.push(x.ms); meta.prechod = x;
  }
  const res = {};
  for (const k of Object.keys(out)) res[k] = { medianMs: med(out[k]), ...meta[k], ms: undefined };
  res.surove = out;
  res.pomerTelefonKuPrechodu = +(res.telefon.medianMs / res.prechod.medianMs).toFixed(1);
  res.pomerTelefonKuMriezke = +(res.telefon.medianMs / res.telefonMriezka.medianMs).toFixed(1);
  return res;
}, N);
fs.writeFileSync(path.join(here, 'zjemnenie-over.json'), JSON.stringify(r, null, 1));
console.log(JSON.stringify(r, null, 1));
await browser.close();
