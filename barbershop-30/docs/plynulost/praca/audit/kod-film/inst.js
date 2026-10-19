/* Inštrumentácia filmu (vkladá sa pred skripty stránky cez addInitScript). Nemení správanie, len meria:
   - každé volanie rAF: čas spätného volania podľa mena funkcie (film = 'frame'), zoskupené do snímok podľa ts
   - WebGL2: čas volaní (texSubImage2D, texImage2D, generateMipmap, draw…), počet pásov (texSubImage2D z ImageBitmap),
     celé nahratia (texImage2D z ImageBitmap/videa), živá pamäť textúr a renderbufferov (alokácie mínus uvoľnenia)
   - šero: snímka filmu, v ktorej sa do plátna (predvolený framebuffer) len vyčistilo a nič nenakreslilo
   - dlhé úlohy (longtask) a dlhé animačné snímky (long-animation-frame) so zdrojom skriptu
   Výsledky v window.__KF. */
(() => {
  const now = () => performance.now();
  const M = window.__KF = { frames: new Map(), calls: {}, big: [], live: 0, liveMax: 0, liveT: [], lt: [], loaf: [], marks: [], outside: [], ctxCount: 0, ctxMs: [] };
  let cur = null;                                           // práve bežiaca snímka (ts) a meno callbacku
  const raf0 = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = function (cb) {
    return raf0(function (ts) {
      let f = M.frames.get(ts);
      if (!f) { f = { ts, film: 0, ine: 0, gl: 0, pasy: 0, pasyMs: 0, cele: 0, celeMs: 0, mip: 0, kresli: 0, sero: 0, cistiDef: 0, kresliDef: 0, upB: 0 }; M.frames.set(ts, f); }
      const name = cb.name || 'anon';
      const prev = cur; cur = { f, film: name === 'frame' };
      const s = now();
      try { return cb(ts); } finally {
        const d = now() - s;
        if (cur.film) f.film += d; else f.ine += d;
        cur = prev;
      }
    });
  };
  const add = (n, d, ctx) => {
    const g = M.calls[n] || (M.calls[n] = [0, 0, 0]); g[0] += d; g[1]++; if (d > g[2]) g[2] = d;
    if (d > 4) M.big.push([+now().toFixed(1), n, +d.toFixed(1), ctx || '']);
  };
  const film = (gl) => gl.canvas && gl.canvas.classList && gl.canvas.classList.contains('film-canvas');
  const P = window.WebGL2RenderingContext && WebGL2RenderingContext.prototype;
  if (!P) return;
  const TEX = new WeakMap(), RB = new WeakMap();
  const setLive = (d) => { M.live += d; if (M.live > M.liveMax) M.liveMax = M.live; };
  const texOf = (gl) => gl.getParameter(gl.TEXTURE_BINDING_2D);
  const wrap = (n, fn) => { const f = P[n]; P[n] = function () { const s = now(); try { return f.apply(this, arguments); } finally { const d = now() - s; fn && fn.call(this, arguments, d); add(n, d, this.__lbl); if (cur && film(this)) cur.f.gl += d; else if (film(this) && d > 1) M.outside.push([+now().toFixed(1), n, +d.toFixed(1)]); } }; };
  wrap('texSubImage2D', function (a, d) {
    if (!film(this)) return;
    const src = a[a.length - 1], bmp = typeof ImageBitmap !== 'undefined' && src instanceof ImageBitmap;
    const w = a.length >= 9 && typeof a[4] === 'number' ? a[4] : 0, h = a.length >= 9 && typeof a[5] === 'number' ? a[5] : 0;
    if (cur) { if (bmp) { cur.f.pasy++; cur.f.pasyMs += d; } cur.f.upB += w * h * 4; }
  });
  wrap('texImage2D', function (a, d) {
    let w = 0, h = 0; const src = a[a.length - 1];
    if (a.length >= 9 && typeof a[3] === 'number') { w = a[3]; h = a[4]; } else if (src) { w = src.videoWidth || src.width || 0; h = src.videoHeight || src.height || 0; }
    if (a[1] === 0) { const t = texOf(this); if (t) { const old = TEX.get(t) || 0; const b = w * h * 4; TEX.set(t, b); setLive(b - old); } }
    if (film(this) && cur && src && (src.width || src.videoWidth) && a.length < 9) { cur.f.cele++; cur.f.celeMs += d; cur.f.upB += w * h * 4; }
  });
  wrap('texStorage2D', function (a) {
    const [, lv, , w, h] = a; let b = 0; for (let l = 0; l < lv; l++) b += Math.max(1, w >> l) * Math.max(1, h >> l) * 4;
    const t = texOf(this); if (t) { const old = TEX.get(t) || 0; TEX.set(t, b); setLive(b - old); }
  });
  wrap('generateMipmap', function () {
    const t = texOf(this); if (t) { const old = TEX.get(t) || 0; if (old && !t.__mip) { t.__mip = 1; TEX.set(t, old * 4 / 3); setLive(old / 3); } }
    if (cur && film(this)) cur.f.mip++;
  });
  wrap('deleteTexture', function (a) { const t = a[0]; if (t && TEX.has(t)) { setLive(-TEX.get(t)); TEX.delete(t); } });
  wrap('renderbufferStorage', function (a) { const rb = this.getParameter(this.RENDERBUFFER_BINDING); const b = a[2] * a[3] * 4; if (rb) { const old = RB.get(rb) || 0; RB.set(rb, b); setLive(b - old); } });
  wrap('renderbufferStorageMultisample', function (a) { const rb = this.getParameter(this.RENDERBUFFER_BINDING); const b = a[3] * a[4] * 4 * Math.max(1, a[1]); if (rb) { const old = RB.get(rb) || 0; RB.set(rb, b); setLive(b - old); } });
  wrap('deleteRenderbuffer', function (a) { const rb = a[0]; if (rb && RB.has(rb)) { setLive(-RB.get(rb)); RB.delete(rb); } });
  wrap('bindFramebuffer', function (a) { this.__fb = a[1]; });
  wrap('clear', function () { if (cur && film(this) && !this.__fb) cur.f.cistiDef++; });
  const draw = function () { if (cur && film(this)) { cur.f.kresli++; if (!this.__fb) cur.f.kresliDef++; } };
  wrap('drawElements', draw); wrap('drawArrays', draw);
  ['compileShader', 'linkProgram', 'getProgramParameter', 'getShaderParameter', 'getUniformLocation', 'getActiveUniform', 'finish', 'readPixels', 'getError'].forEach((n) => wrap(n));
  // vytvorenie kontextu (hlavné vlákno)
  const gc = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (t) {
    const s = now(); const r = gc.apply(this, arguments); const d = now() - s;
    if (/webgl/.test(t)) { M.ctxCount++; M.ctxMs.push([+s.toFixed(1), t, +d.toFixed(1), this.className || '(test)']); }
    return r;
  };
  try { new PerformanceObserver((l) => l.getEntries().forEach((e) => M.lt.push([+e.startTime.toFixed(1), +e.duration.toFixed(1)]))).observe({ type: 'longtask', buffered: true }); } catch (e) { /* nič */ }
  try {
    new PerformanceObserver((l) => l.getEntries().forEach((e) => M.loaf.push({ t: +e.startTime.toFixed(1), d: +e.duration.toFixed(1), blok: +(e.blockingDuration || 0).toFixed(1), render: +((e.renderStart ? e.startTime + e.duration - e.renderStart : 0)).toFixed(1),
      skripty: (e.scripts || []).map((s) => [s.invoker, (s.sourceURL || '').split('/').pop(), s.sourceFunctionName, +s.duration.toFixed(1)]).filter((s) => s[3] > 3) }))).observe({ type: 'long-animation-frame', buffered: true });
  } catch (e) { /* nič */ }
  // vzorkovanie živej pamäte každých 250 ms
  setInterval(() => M.liveT.push([+now().toFixed(0), +(M.live / 1e6).toFixed(1)]), 250);
  M.mark = (n) => M.marks.push([+now().toFixed(1), n]);
  M.dump = (od, po) => {
    const fr = [...M.frames.values()].filter((f) => f.ts >= od && f.ts <= (po || 1e12)).sort((a, b) => a.ts - b.ts);
    return fr.map((f) => [+f.ts.toFixed(1), +f.film.toFixed(2), +f.ine.toFixed(2), +f.gl.toFixed(2), f.pasy, +f.pasyMs.toFixed(2), f.cele, +f.celeMs.toFixed(2), f.mip, f.kresli, f.cistiDef, f.kresliDef, f.upB]);
  };
})();
