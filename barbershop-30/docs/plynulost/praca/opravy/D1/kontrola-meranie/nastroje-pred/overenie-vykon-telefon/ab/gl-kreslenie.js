// Meranie T2: počet kreslení (drawElements/drawArrays) a prechodov do render targetu na snímku filmu
(() => {
  const P = WebGL2RenderingContext.prototype, S = window.__glDraw = { draw: 0, fbo: 0, snimky: [] };
  let cur = { d: 0, f: 0 };
  const tick = () => { if (cur.d) S.snimky.push(cur); cur = { d: 0, f: 0 }; requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
  for (const n of ['drawElements', 'drawArrays']) { const o = P[n]; P[n] = function (...a) { S.draw++; cur.d++; return o.apply(this, a); }; }
  const ob = P.bindFramebuffer; P.bindFramebuffer = function (t, fb) { if (fb) { S.fbo++; cur.f++; } return ob.call(this, t, fb); };
})();
