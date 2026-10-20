/* Overenie kod-film: nezávislá sonda (vkladá sa cez addInitScript, správanie stránky nemení).
   - rAF: každá snímka filmu (callback 'frame'): čas JS, počet kreslení a vyčistení predvoleného framebuffera plátna filmu
   - prvé použitie programov (useProgram) a synchrónne dotazy (getProgramParameter) s časom
   - generateMipmap, texSubImage2D (pásy), texImage2D/texStorage2D na plátne filmu
   - stav filmu každých 100 ms (S, T, current, ready, loading) a zmeny triedy <html>
   - longtask + long-animation-frame
   Výsledky: window.__OV */
(() => {
  const now = () => performance.now();
  const O = window.__OV = { fr: [], st: [], cls: [], lt: [], loaf: [], prog: [], q: [], mip: [], up: [], ctx: [] };
  let cur = null;
  const raf0 = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = function (cb) {
    return raf0(function (ts) {
      if (cb.name !== 'frame') return cb(ts);
      const f = { ts, js: 0, draw: 0, clr: 0, mip: 0, band: 0, bandMs: 0, full: 0, fullMs: 0 };
      const prev = cur; cur = f; const s = now();
      try { return cb(ts); } finally { f.js = now() - s; cur = prev; if (O.fr.length < 20000) O.fr.push(f); }
    });
  };
  const P = window.WebGL2RenderingContext && WebGL2RenderingContext.prototype;
  if (P) {
    const film = (gl) => gl.canvas && gl.canvas.classList && gl.canvas.classList.contains('film-canvas');
    const W = (n, after) => { const f = P[n]; P[n] = function () { const s = now(); const r = f.apply(this, arguments); const d = now() - s; if (film(this)) after.call(this, arguments, d); return r; }; };
    W('bindFramebuffer', function (a) { this.__fbo = a[1]; });
    W('clear', function () { if (cur && !this.__fbo) cur.clr++; });
    W('drawElements', function () { if (cur && !this.__fbo) cur.draw++; });
    W('drawArrays', function () { if (cur && !this.__fbo) cur.draw++; });
    W('generateMipmap', function (a, d) { if (cur) cur.mip++; O.mip.push([+now().toFixed(1), +d.toFixed(2), this.__fbo ? 1 : 0]); });
    W('texSubImage2D', function (a, d) { const src = a[a.length - 1]; if (cur) { cur.band++; cur.bandMs += d; } if (d > 1) O.up.push([+now().toFixed(1), 'sub', a.length >= 9 ? a[4] + 'x' + a[5] : '?', +d.toFixed(2), src && src.constructor && src.constructor.name]); });
    W('texImage2D', function (a, d) { if (cur) { cur.full++; cur.fullMs += d; } if (d > 1) O.up.push([+now().toFixed(1), 'img', '', +d.toFixed(2)]); });
    const seen = new WeakSet();
    W('useProgram', function (a, d) { const p = a[0]; if (p && !seen.has(p)) { seen.add(p); O.prog.push([+now().toFixed(1), 'useProgram#' + O.prog.length, +d.toFixed(2), cur ? 1 : 0]); } });
    W('getProgramParameter', function (a, d) { if (d > 2) O.q.push([+now().toFixed(1), 'getProgramParameter 0x' + a[1].toString(16), +d.toFixed(1), cur ? 1 : 0]); });
    W('getActiveUniform', function (a, d) { if (d > 2) O.q.push([+now().toFixed(1), 'getActiveUniform', +d.toFixed(1), cur ? 1 : 0]); });
    W('getUniformLocation', function (a, d) { if (d > 2) O.q.push([+now().toFixed(1), 'getUniformLocation', +d.toFixed(1), cur ? 1 : 0]); });
    const gc = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (t) { const s = now(); const r = gc.apply(this, arguments); const d = now() - s; if (/webgl/.test(t)) O.ctx.push([+s.toFixed(1), t, +d.toFixed(1), this.className || '(test)']); return r; };
  }
  try { new PerformanceObserver((l) => l.getEntries().forEach((e) => O.lt.push([+e.startTime.toFixed(1), +e.duration.toFixed(1)]))).observe({ type: 'longtask', buffered: true }); } catch (e) { /* nič */ }
  try {
    new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (e.duration > 50) O.loaf.push({ t: +e.startTime.toFixed(1), d: +e.duration.toFixed(1), blok: +(e.blockingDuration || 0).toFixed(1), sk: (e.scripts || []).map((s) => [s.invoker, (s.sourceURL || '').split('/').pop(), s.sourceFunctionName, +s.duration.toFixed(1), +(s.forcedStyleAndLayoutDuration || 0).toFixed(1)]).filter((s) => s[3] > 5) }); })).observe({ type: 'long-animation-frame', buffered: true });
  } catch (e) { /* nič */ }
  const poll = () => {
    try {
      const f = window.BS30_FILM, s = f && f.state;
      if (s && s.on) O.st.push([+now().toFixed(0), +s.S.toFixed(3), +s.T.toFixed(3), s.current, s.ready.filter((r) => r.ready).map((r) => r.shot).join(' '), s.ready.filter((r) => r.loading).map((r) => r.shot).join(' '), +s.mix.toFixed(3), s.dpr, s.frames, Math.round(scrollY)]);
    } catch (e) { /* nič */ }
  };
  setInterval(poll, 100);
  let lastCls = '';
  const watch = () => { const c = document.documentElement.className; if (c !== lastCls) { lastCls = c; O.cls.push([+now().toFixed(1), c]); } };
  const obs = () => { if (!document.documentElement) { setTimeout(obs, 0); return; } watch(); new MutationObserver(watch).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] }); };
  obs();
  O.mark = (n) => { O.cls.push([+now().toFixed(1), 'ZNACKA ' + n]); };
})();
