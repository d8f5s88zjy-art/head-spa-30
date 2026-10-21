// Pasívna sonda merania 1 (SKEPTIK V5): nič nevolá decode(), nič nesťahuje, len číta.
// Vzorka každých 100 ms (setTimeout, nie rAF, aby čo najmenej zaťažila snímky):
//  - h1At: prvý čas, keď sú všetky slová nadpisu úvodu (#h-uvod .w) v okne s účinnou nepriehľadnosťou ≥ 0,9,
//  - neúplné fotky: <img> v okne (IntersectionObserver), účinne viditeľný (opacity > 0,01, nie display:none/hidden),
//    a pritom !(complete && naturalWidth > 0) → zapíše sa kľúč fotky a počet vzoriek,
//  - hrajúce videá naraz (všetky <video> v DOM aj mimo neho, zachytené cez play()),
//  - počet WebGL kontextov (getContext webgl/webgl2 na canvas aj OffscreenCanvas, každé plátno raz).
// LoAF a longtask cez PerformanceObserver (buffered).
(() => {
  const W = window;
  const M = (W.__m = { gl: 0, vids: new Set(), maxPlay: 0, playAt: [], h1At: null, btnAt: null, inc: {}, incN: 0, decWait: {}, loaf: [], lt: [], vzoriek: 0 });
  const hook = (P) => {
    if (!P) return; const g = P.getContext;
    P.getContext = function (k, ...a) { const c = g.call(this, k, ...a); if (c && /webgl/i.test(k) && !this.__glc) { this.__glc = 1; M.gl++; } return c; };
  };
  hook(W.HTMLCanvasElement && HTMLCanvasElement.prototype); hook(W.OffscreenCanvas && OffscreenCanvas.prototype);
  const pl = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () { if (this instanceof HTMLVideoElement) M.vids.add(this); return pl.apply(this, arguments); };
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) M.loaf.push([+e.startTime.toFixed(1), +e.duration.toFixed(1), +(e.blockingDuration || 0).toFixed(1), +((e.renderStart || 0) - e.startTime).toFixed(1), +((e.styleAndLayoutStart || 0) - (e.renderStart || 0)).toFixed(1), +(e.startTime + e.duration - (e.styleAndLayoutStart || 0)).toFixed(1), +(e.scripts || []).reduce((a, x) => a + x.duration, 0).toFixed(1)]); }).observe({ type: 'long-animation-frame', buffered: true }); } catch (e) { M.loafErr = String(e); }
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) M.lt.push([+e.startTime.toFixed(1), +e.duration.toFixed(1)]); }).observe({ type: 'longtask', buffered: true }); } catch (e) {}
  const vis = (el) => {
    let o = 1;
    for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.display === 'none' || cs.visibility === 'hidden') return 0;
      o *= +cs.opacity; if (o < 0.005) return 0;
    }
    return o;
  };
  const inView = (el, minFrac) => { const r = el.getBoundingClientRect(); const w = Math.min(r.right, innerWidth) - Math.max(r.left, 0), h = Math.min(r.bottom, innerHeight) - Math.max(r.top, 0); return w > 0 && h > 0 && (w * h) / (innerWidth * innerHeight) >= minFrac; };
  const seen = new Set(); const inter = new Set(); let io = null;
  const scan = () => {
    if (!io) io = new IntersectionObserver((es) => { for (const e of es) { if (e.isIntersecting) inter.add(e.target); else inter.delete(e.target); } });
    for (const im of document.images) if (!seen.has(im)) { seen.add(im); io.observe(im); }
  };
  const key = (im) => { const s = (im.currentSrc || im.src || im.getAttribute('src') || '').split('/').pop().split('?')[0]; const shot = im.closest('[data-shot]'); return (shot ? shot.dataset.shot + ':' : '') + (s || '(bez src)'); };
  const tick = () => {
    try {
      M.vzoriek++;
      const t = +performance.now().toFixed(0);
      if (M.h1At == null) {
        const h1 = document.getElementById('h-uvod');
        if (h1 && inView(h1, 0)) { const ws = h1.querySelectorAll('.w'); const els = ws.length ? [...ws] : [h1]; if (Math.min(...els.map(vis)) >= 0.9) M.h1At = t; }
      }
      if (M.btnAt == null) { const b = document.querySelector('#uvod .title-actions .btn-primary'); if (b && inView(b, 0) && vis(b) >= 0.9) M.btnAt = t; }
      for (const v of document.querySelectorAll('video')) M.vids.add(v);
      let n = 0; for (const v of M.vids) if (!v.paused && !v.ended && v.readyState >= 2) n++;
      if (n > M.maxPlay) { M.maxPlay = n; M.playAt.push([t, n]); }
      if (document.readyState !== 'loading') {
        scan();
        for (const im of inter) {
          if (!inView(im, 0.05)) continue;
          const o = vis(im); if (o <= 0.01) continue;
          if (!(im.complete && im.naturalWidth > 0)) { const k = key(im); M.inc[k] = (M.inc[k] || 0) + 1; M.incN++; }
          else if (im.__near === true && im.__dec === false) { const k = key(im); M.decWait[k] = (M.decWait[k] || 0) + 1; }
        }
      }
    } catch (e) { M.err = String(e); }
    setTimeout(tick, 100);
  };
  setTimeout(tick, 0);
  W.__mOut = () => ({ gl: M.gl, maxPlay: M.maxPlay, playAt: M.playAt, vidov: M.vids.size, h1At: M.h1At, btnAt: M.btnAt, inc: M.inc, incN: M.incN, decWait: M.decWait,
    loaf: M.loaf, lt: M.lt, vzoriek: M.vzoriek, err: M.err || null, loafErr: M.loafErr || null, origin: performance.timeOrigin,
    fcp: (performance.getEntriesByName('first-contentful-paint')[0] || {}).startTime ?? null,
    load: (performance.getEntriesByType('navigation')[0] || {}).loadEventEnd || null,
    cls: document.documentElement.className, y: Math.round(scrollY), sh: document.documentElement.scrollHeight,
    h1Box: (() => { const h = document.getElementById('h-uvod'); if (!h) return null; const r = h.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom].map(Math.round); })(),
    hero: (() => { const i = document.querySelector('#uvod .film-still img'); return i ? (i.currentSrc || '').split('/').pop() : null; })() });
})();
