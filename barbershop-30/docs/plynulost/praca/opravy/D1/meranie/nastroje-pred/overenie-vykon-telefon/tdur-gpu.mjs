// Metodika: či sa čakanie hlavného vlákna na GPU proces (gl.finish po ťažkom kreslení v SwiftShader) pri spomalení
// CPU cez CDP započíta do času vlákna (tdur). Rovnaká práca pri rate 1 a 4.
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
for (const rate of [1, 4, 1, 4]) {
  const ctx = await browser.newContext(); const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:8310/barbershop-30/robots.txt');
  await page.evaluate(() => {
    const c = document.createElement('canvas'); c.width = 1200; c.height = 1200; document.body.append(c);
    const gl = window.gl = c.getContext('webgl2');
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; };
    const p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, '#version 300 es\nin vec2 a; void main(){gl_Position=vec4(a,0,1);}'));
    gl.attachShader(p, sh(gl.FRAGMENT_SHADER, '#version 300 es\nprecision highp float; out vec4 o; void main(){ float x=0.; for(int i=0;i<3000;i++){ x+=sin(gl_FragCoord.x*0.01+float(i))*cos(gl_FragCoord.y*0.01); } o=vec4(x,0,0,1);}'));
    gl.bindAttribLocation(p, 0, 'a'); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); gl.useProgram(p);
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3); gl.finish();
  });
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate });
  await cdp.send('Tracing.start', { categories: 'devtools.timeline,disabled-by-default-devtools.timeline', transferMode: 'ReturnAsStream' });
  const js = await page.evaluate(() => new Promise((r) => setTimeout(() => { const t = performance.now(); for (let i = 0; i < 3; i++) gl.drawArrays(gl.TRIANGLES, 0, 3); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4)); r(performance.now() - t); }, 50)));
  const done = new Promise((r) => cdp.once('Tracing.tracingComplete', r));
  await cdp.send('Tracing.end'); const { stream } = await done;
  let d = ''; for (;;) { const c = await cdp.send('IO.read', { handle: stream }); d += c.data; if (c.eof) break; }
  const tf = JSON.parse(d).traceEvents.filter((e) => e.name === 'TimerFire' && e.ph === 'X').map((e) => [(e.dur / 1000).toFixed(0), (e.tdur / 1000).toFixed(0)]);
  console.log('rate', rate, 'kreslenie+finish v JS', js.toFixed(0), 'ms; TimerFire [stena, vlákno]', JSON.stringify(tf));
  await ctx.close();
}
await browser.close();
