// Meranie T1: počet a objem nahratí textúr (texImage2D/texSubImage2D) a čas volaní (stena) – bez zmeny správania
(() => {
  const P = WebGL2RenderingContext.prototype, S = window.__glStats = { volani: 0, mpx: 0, ms: 0, max: 0, naSnimku: [] };
  let cur = null;
  const frame = () => { if (cur && cur.n) S.naSnimku.push(cur); cur = { n: 0, mpx: 0, ms: 0, t: performance.now() }; requestAnimationFrame(frame); };
  requestAnimationFrame(frame);
  for (const name of ['texImage2D', 'texSubImage2D']) {
    const o = P[name];
    P[name] = function (...a) {
      const src = a[a.length - 1];
      let px = 0; if (src && src.width) px = src.width * src.height; if (name === 'texSubImage2D' && a.length >= 9 && typeof a[4] === 'number') px = a[4] * a[5];
      const t = performance.now(); const r = o.apply(this, a); const dt = performance.now() - t;
      S.volani++; S.mpx += px / 1e6; S.ms += dt; S.max = Math.max(S.max, dt);
      if (cur) { cur.n++; cur.mpx += px / 1e6; cur.ms += dt; }
      return r;
    };
  }
})();
