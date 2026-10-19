#!/usr/bin/env node
/* Relatívna cena zjemnenia hĺbkovej mapy (film.js:360-398, 4 prechody max/gauss) na grafike.
   Ten istý fragment shader ako vo filme, polomery ako soften(): telefón (mapa 768x1366, mriežka 112 buniek),
   počítač (768x512, mriežka 256), návrh: mapa v rozlíšení mriežky (226x402) – porovnanie s jedným celoplošným
   prechodom strihu 780x1688 s 12 vzorkami textureLod (post, telefón NT=6). Čas = gl.finish (SwiftShader),
   preto má význam len pomer, nie milisekundy. node zjemnenie.mjs [--port=8248] [--opakuj=5] */
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.length ? v.join('=') : '1']; }));
const PORT = opt.port || 8248, REP = Number(opt.opakuj || 5);
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
await page.goto(`http://127.0.0.1:${PORT}/barbershop-30/robots.txt`);
const r = await page.evaluate(async (REP) => {
  const c = document.createElement('canvas'); c.width = 4; c.height = 4; document.body.append(c);
  const gl = c.getContext('webgl2'); const now = () => performance.now();
  const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
  const prog = (fs) => { const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, '#version 300 es\nin vec2 p; void main(){ gl_Position = vec4(p,0.,1.); }')); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.bindAttribLocation(p, 0, 'p'); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); return p; };
  const px = new Uint8Array(4); const sync = () => gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
  const SOFT = `#version 300 es
    precision highp float; uniform sampler2D tSrc; uniform vec2 uTexel, uDir; uniform float uR, uMode; out vec4 o;
    void main() {
      vec2 uv = gl_FragCoord.xy * uTexel;
      float acc = 0.0, ws = 0.0, s2 = uR * uR / 9.0;
      for (int i = -40; i <= 40; i++) { float f = float(i); if (abs(f) > uR) continue; float z = texture(tSrc, uv + uDir * uTexel * f).r;
        if (uMode < 0.5) acc = max(acc, z); else { float w = exp(-0.5 * f * f / s2); acc += z * w; ws += w; } }
      if (uMode > 0.5) acc /= ws; o = vec4(acc, acc, acc, 1.0);
    }`;
  const POST = `#version 300 es
    precision highp float; uniform sampler2D tA, tB; uniform vec2 uRes; out vec4 o;
    void main() { vec2 uv = gl_FragCoord.xy / uRes; vec2 st = vec2(0.07, 0.0); vec4 a = vec4(0.0);
      for (int i = 0; i < 6; i++) { a += textureLod(tA, uv + st * ((float(i) + 0.5) / 6.0 - 0.5), 2.0); a += textureLod(tB, uv - st * ((float(i) + 0.5) / 6.0 - 0.5), 2.0); }
      o = a / 12.0; }`;
  const ps = prog(SOFT), pp = prog(POST);
  const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const texRT = (w, h, mip) => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texStorage2D(gl.TEXTURE_2D, mip ? Math.floor(Math.log2(Math.max(w, h))) + 1 : 1, gl.RGBA8, w, h); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mip ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR); const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0); return { t, f, w, h }; };
  const soften = (w, h, seg) => {
    const src = texRT(w, h), a = texRT(w, h), b = texRT(w, h);
    const sig = Math.max(1.5, 1.2 * w / seg), r1 = Math.round(2 * sig), r2 = Math.min(40, Math.round(3 * sig));
    gl.useProgram(ps); gl.bindFramebuffer(gl.FRAMEBUFFER, src.f); sync();
    const L = (n) => gl.getUniformLocation(ps, n);
    const pass = (s, d, dx, dy, mode, r) => { gl.bindFramebuffer(gl.FRAMEBUFFER, d.f); gl.viewport(0, 0, w, h); gl.bindTexture(gl.TEXTURE_2D, s.t); gl.uniform2f(L('uTexel'), 1 / w, 1 / h); gl.uniform2f(L('uDir'), dx, dy); gl.uniform1f(L('uR'), r); gl.uniform1f(L('uMode'), mode); gl.drawArrays(gl.TRIANGLES, 0, 3); };
    const t0 = now();
    pass(src, a, 1, 0, 0, r1); pass(a, b, 0, 1, 0, r1); pass(b, a, 1, 0, 1, r2); pass(a, b, 0, 1, 1, r2); sync();
    const d = now() - t0; [src, a, b].forEach((x) => { gl.deleteTexture(x.t); gl.deleteFramebuffer(x.f); });
    return { ms: d, vzoriekNaTexel: 2 * (2 * r1 + 1) + 2 * (2 * r2 + 1), milionovVzoriek: +((2 * (2 * r1 + 1) + 2 * (2 * r2 + 1)) * w * h / 1e6).toFixed(0), r1, r2 };
  };
  const post = () => {
    const A = texRT(780, 1688, true), B = texRT(780, 1688, true), D = texRT(780, 1688, false);
    gl.bindTexture(gl.TEXTURE_2D, A.t); gl.generateMipmap(gl.TEXTURE_2D); gl.bindTexture(gl.TEXTURE_2D, B.t); gl.generateMipmap(gl.TEXTURE_2D);
    gl.useProgram(pp); gl.uniform1i(gl.getUniformLocation(pp, 'tA'), 0); gl.uniform1i(gl.getUniformLocation(pp, 'tB'), 1); gl.uniform2f(gl.getUniformLocation(pp, 'uRes'), 780, 1688);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, A.t); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, B.t); gl.activeTexture(gl.TEXTURE0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, D.f); gl.viewport(0, 0, 780, 1688); gl.finish();
    sync(); const t0 = now(); gl.drawArrays(gl.TRIANGLES, 0, 3); sync(); const d = now() - t0;
    [A, B, D].forEach((x) => { gl.deleteTexture(x.t); gl.deleteFramebuffer(x.f); });
    return { ms: d, milionovVzoriek: +(12 * 780 * 1688 / 1e6).toFixed(0) };
  };
  const med = (a) => { const s = [...a].sort((x, y) => x - y); return +s[Math.floor(s.length / 2)].toFixed(1); };
  const R = { telefon: [], pocitac: [], navrhTelefon: [], post: [] }; let info = {};
  for (let i = 0; i < REP; i++) {
    const t = soften(768, 1366, 112), p = soften(768, 512, 256), n = soften(226, 402, 112), q = post();
    R.telefon.push(t.ms); R.pocitac.push(p.ms); R.navrhTelefon.push(n.ms); R.post.push(q.ms);
    info = { telefon: t, pocitac: p, navrhTelefon: n, post: q };
  }
  const err = gl.getError(); const out = { glError: err }; for (const [k, v] of Object.entries(R)) out[k] = { msSwiftShader: med(v), ...Object.fromEntries(Object.entries(info[k]).filter(([x]) => x !== 'ms')) };
  return out;
}, REP);
console.log(JSON.stringify(r, null, 1));
await browser.close();
