// Rozklad čakania filmu na záber (CO-1, CO-5): časy fetch (začiatok, hlavičky, celé telo), createImageBitmap
// (rozbalenie) a texSubImage2D (pásy do grafiky) pre každý súbor filmu. Vkladá sa cez over.mjs --inject, repozitár sa nemení.
(() => {
  const L = window.__cas = [];
  const now = () => Math.round(performance.now());
  const short = (u) => String(u || '').split('/').pop().split('?')[0];
  const of = window.fetch;
  const blobUrl = new WeakMap();
  window.fetch = function (input, init) {
    const url = short(typeof input === 'string' ? input : input.url);
    const e = { k: 'fetch', url, t0: now() };
    L.push(e);
    return of.call(this, input, init).then((r) => {
      e.th = now();
      const ob = r.blob.bind(r);
      r.blob = () => ob().then((b) => { e.tb = now(); blobUrl.set(b, url); return b; }, (err) => { e.err = String(err); throw err; });
      return r;
    }, (err) => { e.err = String(err); e.te = now(); throw err; });
  };
  const oc = window.createImageBitmap;
  window.createImageBitmap = function (src, ...rest) {
    const url = blobUrl.get(src) || (src && src.constructor && src.constructor.name) || '?';
    const e = { k: 'bitmap', url, t0: now(), w: 0 };
    L.push(e);
    return oc.call(this, src, ...rest).then((b) => { e.t1 = now(); e.w = b.width; e.h = b.height; return b; }, (err) => { e.t1 = now(); e.err = String(err); throw err; });
  };
  for (const C of [window.WebGL2RenderingContext]) {
    if (!C) continue;
    const P = C.prototype, os = P.texSubImage2D, og = P.generateMipmap;
    P.texSubImage2D = function (...a) {
      const t = performance.now(); const r = os.apply(this, a); const d = performance.now() - t;
      const last = L[L.length - 1];
      if (last && last.k === 'tex' && now() - last.t1 < 40) { last.n++; last.ms += d; last.t1 = now(); }
      else L.push({ k: 'tex', t0: Math.round(t), t1: now(), n: 1, ms: d });
      return r;
    };
    P.generateMipmap = function (...a) { const t = performance.now(); const r = og.apply(this, a); L.push({ k: 'mip', t0: Math.round(t), ms: +(performance.now() - t).toFixed(1) }); return r; };
  }
})();
