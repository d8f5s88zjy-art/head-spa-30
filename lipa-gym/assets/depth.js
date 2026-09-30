/* GYM KLUB: priestorové fotky (3D).
   Každá fotka má hĺbkovú mapu (assets/img/d/*.png, bližšie = svetlejšie). WebGL posúva body obrazu
   podľa hĺbky, takže pri pohybe myši, ťahu prstom alebo samovoľnom pohybe kamery sa popredie hýbe
   viac než pozadie. Kreslí sa len to, čo je v obraze. Bez WebGL, pri obmedzenom pohybe alebo pri
   chybe ostáva obyčajná fotka pod plátnom.
   - [data-depth-w] / [data-depth-t]: mapa pre široký (počítač) a vysoký (telefón) výrez
   - .hero-media: kamera po rozsvietení vojde do priestoru; .band-frame: priblíženie podľa --bp
   - .reel-stage: jedno plátno pre všetky zábery, pri strihu prejde kamera cez obraz */
(function () {
  'use strict';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var MOBILE = window.matchMedia('(max-width: 860px)');
  var COARSE = window.matchMedia('(pointer: coarse)').matches;
  var VS = 'attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
  var FS = 'precision mediump float;varying vec2 v;uniform sampler2D img,dep;uniform vec2 cover,ctr,off;uniform float zoom,push,fade;' +
    'vec2 look(){vec2 base=ctr+(vec2(v.x,1.-v.y)-.5)*cover/zoom;vec2 uv=base;for(int i=0;i<5;i++){float d=texture2D(dep,uv).r;uv=base+off*(d-.4)-(base-ctr)*push*d;}return clamp(uv,.001,.999);}' +
    'void main(){gl_FragColor=vec4(texture2D(img,look()).rgb*fade,1.);}';
  var AMP = 0.022, ZOOM = 1.08;
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function ease(x) { return 1 - Math.pow(1 - clamp(x, 0, 1), 3); }
  function loadImg(url) { return new Promise(function (res, rej) { var i = new Image(); i.onload = function () { res(i); }; i.onerror = rej; i.src = url; }); }
  function bitmap(img) {
    if (!window.createImageBitmap) return Promise.resolve(img);
    var mw = COARSE ? 1400 : 2200, iw = img.naturalWidth, ih = img.naturalHeight;
    var o = iw > mw ? { resizeWidth: mw, resizeHeight: Math.round(ih * mw / iw), resizeQuality: 'high' } : undefined;
    return createImageBitmap(img, o).catch(function () { return img; });
  }

  /* jedno plátno s hĺbkou; zdroj (fotka + mapa) sa dá vymeniť */
  function Scene(host, opts) {
    this.host = host; this.o = opts || {};
    this.cur = { x: 0, y: 0 }; this.user = null; this.visible = false; this.raf = 0; this.gl = null;
    this.fx = this.o.fx == null ? 0.5 : this.o.fx; this.fy = this.o.fy == null ? 0.5 : this.o.fy;
    this.t0 = 0; this.pointer(this.o.input || host);
  }
  Scene.prototype.init = function () {
    if (this.gl) return true;
    var c = document.createElement('canvas'); c.setAttribute('aria-hidden', 'true'); c.className = 'depth-canvas';
    var gl = c.getContext('webgl', { alpha: false, antialias: false, depth: false, premultipliedAlpha: false, powerPreference: 'high-performance' });
    if (!gl) return false;
    function sh(t, s) { var x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); return x; }
    var pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return false;
    gl.useProgram(pr);
    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    this.tex = [gl.createTexture(), gl.createTexture()];
    var self = this;
    this.tex.forEach(function (t, i) {
      gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    });
    gl.uniform1i(gl.getUniformLocation(pr, 'img'), 0); gl.uniform1i(gl.getUniformLocation(pr, 'dep'), 1);
    this.u = {}; ['cover', 'ctr', 'off', 'zoom', 'push', 'fade'].forEach(function (n) { self.u[n] = gl.getUniformLocation(pr, n); });
    this.gl = gl; this.canvas = c; this.host.appendChild(c);
    c.addEventListener('webglcontextlost', function (e) { e.preventDefault(); self.drop(); });
    window.addEventListener('resize', function () { self.size(); });
    if (window.ResizeObserver) new ResizeObserver(function () { self.size(); }).observe(this.host);
    return true;
  };
  /* načíta fotku a mapu, nahrá ich do textúr */
  Scene.prototype.load = function (src, depth) {
    var self = this;
    return Promise.all([loadImg(src).then(bitmap), loadImg(depth)]).then(function (r) {
      if (!self.gl && !self.init()) throw new Error('webgl');
      var gl = self.gl;
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, self.tex[0]); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, r[0]);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, self.tex[1]); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, r[1]);
      self.iw = r[0].width || r[0].naturalWidth; self.ih = r[0].height || r[0].naturalHeight;
      if (r[0].close) r[0].close();
      self.size(); self.host.classList.add('gl'); self.t0 = performance.now(); self.loop();
    });
  };
  Scene.prototype.size = function () {
    if (!this.gl || !this.iw) return;
    var w = this.host.clientWidth, h = this.host.clientHeight, k = Math.min(window.devicePixelRatio || 1, 2, 2200 / Math.max(w, 1));
    this.canvas.width = Math.round(w * k); this.canvas.height = Math.round(h * k);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    var A = w / h, I = this.iw / this.ih;
    this.cw = A < I ? A / I : 1; this.ch = A < I ? 1 : I / A;
    this.gl.uniform2f(this.u.cover, this.cw, this.ch);
    this.draw(performance.now());
  };
  Scene.prototype.draw = function (now) {
    var gl = this.gl, u = this.u; if (!gl) return;
    var t = now / 1000, dt = this.last ? Math.min(t - this.last, 0.05) : 0.016; this.last = t;
    var auto = { x: Math.sin(t * 0.33) * 0.75, y: Math.sin(t * 0.21 + 1.3) * 0.5 };
    var tg = this.user || auto, k = 1 - Math.exp(-dt * (this.user ? 5 : 2));
    this.cur.x += (tg.x - this.cur.x) * k; this.cur.y += (tg.y - this.cur.y) * k;
    gl.uniform2f(u.off, this.cur.x * AMP, -this.cur.y * AMP * 0.6);
    var r = (now - this.t0) / 1000, e = ease(r / 2.2);
    var zoom = (this.o.zoom ? this.o.zoom(e, t) : ZOOM + 0.02 * Math.sin(t * 0.15));
    var w = this.cw / zoom, h = this.ch / zoom;
    gl.uniform2f(u.ctr, w / 2 + (1 - w) * this.fx, h / 2 + (1 - h) * this.fy);
    gl.uniform1f(u.zoom, zoom);
    gl.uniform1f(u.push, (this.o.push == null ? 0.1 : this.o.push) * (1 - e) + 0.025);
    gl.uniform1f(u.fade, this.o.fade ? this.o.fade(r) : 1);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };
  Scene.prototype.loop = function () {
    var self = this;
    if (this.raf || !this.gl || !this.visible || document.hidden) return;
    var f = function (now) { self.raf = 0; if (!self.gl || !self.visible || document.hidden) return; self.draw(now); self.raf = requestAnimationFrame(f); };
    this.raf = requestAnimationFrame(f);
  };
  Scene.prototype.drop = function () {
    cancelAnimationFrame(this.raf); this.raf = 0;
    if (this.gl) { var x = this.gl.getExtension('WEBGL_lose_context'); if (x) x.loseContext(); this.canvas.remove(); }
    this.gl = null; this.canvas = null; this.last = 0; this.iw = 0; this.host.classList.remove('gl');
  };
  Scene.prototype.pointer = function (el) {
    var self = this, sx = 0, sy = 0, bx = 0, by = 0;
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      if (e.pointerType === 'mouse') self.user = { x: ((e.clientX - r.left) / r.width) * 2 - 1, y: ((e.clientY - r.top) / r.height) * 2 - 1 };
      else if (self.user) self.user = { x: clamp(bx + (e.clientX - sx) / (r.width * 0.5), -1, 1), y: clamp(by + (e.clientY - sy) / (r.height * 0.5), -1, 1) };
    }, { passive: true });
    el.addEventListener('pointerdown', function (e) { if (e.pointerType === 'mouse') return; sx = e.clientX; sy = e.clientY; bx = self.cur.x; by = self.cur.y; self.user = { x: bx, y: by }; }, { passive: true });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (n) { el.addEventListener(n, function (e) { if (e.pointerType !== 'mouse' || e.type === 'pointerleave') self.user = null; }, { passive: true }); });
  };
  function watch(scene, el, margin) {
    if (!('IntersectionObserver' in window)) { scene.visible = true; return; }
    new IntersectionObserver(function (en) { scene.visible = en[0].isIntersecting; if (scene.visible) scene.loop(); }, { rootMargin: margin || '0px' }).observe(el);
  }
  function srcFor(el) {
    var img = el.querySelector('img'); if (!img) return null;
    var mob = MOBILE.matches;
    return { src: img.getAttribute(mob ? 'data-src-t' : 'data-src-w') || img.currentSrc || img.src, depth: el.getAttribute(mob ? 'data-depth-t' : 'data-depth-w') };
  }

  /* úvod: po rozsvietení kamera vojde dnu, potom pomalý pohyb; skrolovanie posúva scénu ako fotku */
  var hero = document.querySelector('.hero-media[data-depth-w]');
  if (hero) {
    var hs = new Scene(hero, { input: hero.closest('.hero'), fx: 0.5, fy: MOBILE.matches ? 0.66 : 0.58, push: 0.14,
      zoom: function (e, t) { var base = MOBILE.matches ? 1.42 : 1.14; return base - 0.06 * e + 0.015 * Math.sin(t * 0.15); } });
    var s = srcFor(hero);
    var startHero = function () { if (s && s.depth) hs.load(s.src, s.depth).catch(function () {}); };
    watch(hs, hero.closest('.hero'), '100px');
    if (document.body.classList.contains('is-loaded')) startHero();
    else { var mo = new MutationObserver(function () { if (document.body.classList.contains('lights') || document.body.classList.contains('is-loaded')) { mo.disconnect(); startHero(); } }); mo.observe(document.body, { attributes: true, attributeFilter: ['class'] }); }
  }

  /* pás LED: priblíženie ide podľa --bp z rolovania */
  var band = document.querySelector('.band-frame[data-depth-w]');
  if (band) {
    var bs = new Scene(band, { input: band.closest('.band'), fx: 0.5, fy: 0.4, push: 0.06,
      zoom: function (e, t) { var bp = parseFloat(band.closest('.band').style.getPropertyValue('--bp')) || 0; return 1.24 - bp * 0.16; } });
    var bsrc = srcFor(band);
    if (bsrc && bsrc.depth) {
      if ('IntersectionObserver' in window) new IntersectionObserver(function (en, io) { if (en[0].isIntersecting) { io.disconnect(); bs.load(bsrc.src, bsrc.depth).catch(function () {}); } }, { rootMargin: '600px 0px' }).observe(band);
      watch(bs, band.closest('.band'), '100px');
    }
  }

  /* filmový pás: jedno plátno; pri strihu kamera vojde do nového záberu */
  var stage = document.querySelector('.reel:not(.static) .reel-stage');
  if (stage) {
    var rs = new Scene(stage, { input: stage, fx: 0.5, fy: 0.5, push: 0.08,
      zoom: function (e, t) { var lp = parseFloat(stage.closest('.reel').style.getPropertyValue('--lp')) || 0; return 1.16 - 0.08 * e - 0.04 * lp; } });
    var shots = Array.prototype.slice.call(stage.querySelectorAll('.shot'));
    var cur = -1, loading = false, pending = -1;
    function show(i) {
      if (i === cur) return;
      if (loading) { pending = i; return; }
      var f = shots[i], src = srcFor(f);
      if (!src || !src.depth) return;
      loading = true;
      rs.load(src.src, src.depth).then(function () { cur = i; stage.classList.add('gl-on'); }).catch(function () {}).then(function () { loading = false; if (pending >= 0 && pending !== cur) { var p = pending; pending = -1; show(p); } });
    }
    var obs = new MutationObserver(function () { var i = shots.findIndex(function (f) { return f.classList.contains('is-on'); }); if (i >= 0) show(i); });
    shots.forEach(function (f) { obs.observe(f, { attributes: true, attributeFilter: ['class'] }); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { rs.visible = en[0].isIntersecting; if (rs.visible) { rs.loop(); var i = shots.findIndex(function (f) { return f.classList.contains('is-on'); }); show(Math.max(0, i)); } }, { rootMargin: '400px 0px' }).observe(stage.closest('.reel'));
  }
})();
