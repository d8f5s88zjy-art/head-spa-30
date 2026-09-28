// GYM KLUB – prehliadka fitka: úvod, odkrývanie sekcií, galérie priestorov a fotky na celú obrazovku.
// Skrolovanie ostáva natívne; skript len pridáva triedy a reaguje na posun galérií (najviac raz za snímku).

const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// úvod: fotka a titulok sa odkryjú, keď je úvodná fotka dekódovaná (poistka po 2,5 s)
const heroImg = document.querySelector('.hero-img img');
Promise.race([
  (heroImg.complete ? Promise.resolve() : new Promise(r => heroImg.addEventListener('load', r, { once: true }))).then(() => heroImg.decode()).catch(() => {}),
  new Promise(r => setTimeout(r, 2500))
]).then(() => requestAnimationFrame(() => root.classList.add('ready')));

// lišta dostane pozadie, keď úvod odíde z obrazu
const bar = document.querySelector('.bar');
if ('IntersectionObserver' in window) {
  new IntersectionObserver(([e]) => bar.classList.toggle('solid', !e.isIntersecting), { rootMargin: '-72px 0px 0px 0px' })
    .observe(document.querySelector('.hero'));

  // sekcie sa odkryjú raz, keď vojdú do obrazu
  root.classList.add('io');
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.rv').forEach(el => io.observe(el));
} else {
  bar.classList.add('solid');
  document.querySelectorAll('.rv').forEach(el => el.classList.add('in'));
}

// galérie priestorov: počítadlo a šípky (na dotyku sa posúva prstom)
for (const zone of document.querySelectorAll('.zone')) {
  const rail = zone.querySelector('.rail');
  const items = rail.children;
  const ctl = zone.querySelector('.rail-ctl');
  const num = ctl.querySelector('b');
  const [prev, next] = ctl.querySelectorAll('.rail-btn');
  ctl.hidden = false;
  const step = () => items.length > 1 ? items[1].offsetLeft - items[0].offsetLeft : rail.clientWidth;
  let pending = false;
  const update = () => {
    pending = false;
    const max = rail.scrollWidth - rail.clientWidth;
    const i = Math.min(items.length - 1, Math.round(rail.scrollLeft / step()));
    num.textContent = i + 1;
    prev.disabled = rail.scrollLeft <= 2;
    next.disabled = rail.scrollLeft >= max - 2;
  };
  rail.addEventListener('scroll', () => { if (!pending) { pending = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update);
  for (const b of [prev, next]) b.addEventListener('click', () => {
    const perPage = Math.max(1, Math.floor(rail.clientWidth / step()) - 1);
    rail.scrollBy({ left: +b.dataset.dir * perPage * step(), behavior: reduce ? 'auto' : 'smooth' });
  });
  update();
}

// fotky na celú obrazovku: jeden vodorovný pás všetkých 30 fotiek, posúva sa prstom, šípkami alebo klávesmi
const lb = document.getElementById('lb');
const track = document.getElementById('lbTrack');
const cap = document.getElementById('lbCap');
const lbPrev = lb.querySelector('.lb-prev');
const lbNext = lb.querySelector('.lb-next');
const photos = [...document.querySelectorAll('.ph')];
const zoneTotal = {}, zonePos = [];
for (const p of photos) { const z = p.dataset.zone; zoneTotal[z] = (zoneTotal[z] || 0) + 1; zonePos.push(zoneTotal[z]); }

let slides = null, cur = 0, opener = null, raf = 0;

function build() {
  slides = photos.map(p => {
    const s = document.createElement('div');
    s.className = 'lb-s';
    const pic = document.createElement('picture');
    const img = document.createElement('img');
    img.alt = p.querySelector('img').alt;
    img.width = +p.dataset.w; img.height = +p.dataset.h;
    img.decoding = 'async';
    pic.append(img); s.append(pic); track.append(s);
    return { s, pic, img, p, loaded: false };
  });
}

function load(i) {
  const sl = slides[i];
  if (!sl || sl.loaded) return;
  sl.loaded = true;
  const base = `media/${sl.p.dataset.src}-${sl.p.dataset.big}`;
  for (const [type, ext] of [['image/avif', 'avif'], ['image/webp', 'webp']]) {
    const so = document.createElement('source'); so.type = type; so.srcset = `${base}.${ext}`;
    sl.pic.insertBefore(so, sl.img);
  }
  sl.img.src = `${base}.jpg`;
}

function show(i) {
  cur = i;
  for (let k = i - 1; k <= i + 2; k++) load(k);
  const p = photos[i];
  cap.innerHTML = '';
  cap.append(p.dataset.zone);
  const n = document.createElement('span');
  n.textContent = `${zonePos[i]} / ${zoneTotal[p.dataset.zone]}`;
  cap.append(n);
  lbPrev.disabled = i === 0;
  lbNext.disabled = i === photos.length - 1;
}

function go(i, smooth = true) {
  i = Math.max(0, Math.min(photos.length - 1, i));
  track.scrollTo({ left: i * track.clientWidth, behavior: smooth && !reduce ? 'smooth' : 'auto' });
  show(i);
}

if (typeof lb.showModal === 'function') {
  photos.forEach((p, i) => p.addEventListener('click', ev => {
    ev.preventDefault();
    if (!slides) build();
    opener = p;
    root.classList.add('lb-open');
    lb.showModal();
    go(i, false);
    lb.querySelector('.lb-x').focus();
  }));

  track.addEventListener('scroll', () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const i = Math.round(track.scrollLeft / track.clientWidth);
      if (i !== cur) show(i);
    });
  }, { passive: true });

  lbPrev.addEventListener('click', () => go(cur - 1));
  lbNext.addEventListener('click', () => go(cur + 1));
  document.getElementById('lbClose').addEventListener('click', () => lb.close());
  lb.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1); }
  });
  lb.addEventListener('close', () => {
    root.classList.remove('lb-open');
    // galéria na stránke sa posunie na naposledy zobrazenú fotku a zameranie sa vráti na ňu
    const p = photos[cur];
    const rail = p.closest('.rail');
    rail.scrollLeft = p.parentElement.offsetLeft - rail.firstElementChild.offsetLeft;
    (opener && photos[cur] !== opener ? p : opener)?.focus({ preventScroll: true });
  });
  addEventListener('resize', () => { if (lb.open) track.scrollLeft = cur * track.clientWidth; });
}

// ---------------------------------------------------------------------------------------------
// Priestorové fotky (3D): každá fotka má hĺbkovú mapu (media/depth-*.png, bližšie = svetlejšie).
// WebGL posúva body obrazu podľa hĺbky, takže pri pohybe kamery sa popredie hýbe viac než pozadie.
// Kamera sa sama pomaly pohybuje; myš alebo ťah prstom ju vedie. Kreslí sa len to, čo je v obraze,
// WebGL kontext sa pri odchode ďaleko z obrazu uvoľní. Bez WebGL alebo pri obmedzenom pohybe ostáva
// obyčajná fotka pod plátnom.

const VS = 'attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
const FS = `precision mediump float;
varying vec2 v;
uniform sampler2D img,dep;
uniform vec2 cover,ctr,off;
uniform float zoom,push,fade;
void main(){
  vec2 base=ctr+(vec2(v.x,1.-v.y)-.5)*cover/zoom;
  vec2 uv=base;
  for(int i=0;i<5;i++){
    float d=texture2D(dep,uv).r;
    uv=base+off*(d-.4)-(base-ctr)*push*d;
  }
  gl_FragColor=vec4(texture2D(img,clamp(uv,.001,.999)).rgb*fade,1.);
}`;

const AMP = 0.02;          // najväčší posun pri pohybe kamery (podiel šírky obrazu)
const ZOOM = 1.08;         // rezerva na okrajoch, aby posun neukázal hranu fotky
const coarse = matchMedia('(pointer: coarse)').matches;

class Space3D {
  constructor(el) {
    this.el = el; this.img = el.querySelector('img');
    this.fx = (+el.dataset.fx || 50) / 100; this.fy = (+el.dataset.fy || 50) / 100;
    this.cur = { x: 0, y: 0 }; this.user = null; this.t0 = 0; this.shown = 0; this.raf = 0; this.gl = null;
    this.visible = false;
    this.onPointer();
  }
  depthUrl() {
    // úvod má na šírku iný záber než na výšku; hĺbka musí patriť k fotke, ktorú prehliadač vybral
    const land = this.el.dataset.depthLand;
    return land && /hlavna-sala-3/.test(this.img.currentSrc) ? land : this.el.dataset.depth;
  }
  async start() {
    if (this.gl || this.starting) return;
    this.starting = true;
    try {
      if (!this.img.complete || !this.img.naturalWidth) await new Promise((res, rej) => { this.img.addEventListener('load', res, { once: true }); this.img.addEventListener('error', rej, { once: true }); });
      const dep = new Image(); dep.src = this.depthUrl();
      await dep.decode();
      // fotka sa dekóduje mimo hlavného vlákna; na telefónoch stačí textúra do 1400 px
      let src = this.img, bmp = null;
      if (window.createImageBitmap) {
        const mw = coarse ? 1400 : 2200, iw = this.img.naturalWidth, ih = this.img.naturalHeight;
        try { bmp = await createImageBitmap(this.img, iw > mw ? { resizeWidth: mw, resizeHeight: Math.round(ih * mw / iw), resizeQuality: 'high' } : undefined); src = bmp; } catch (e) { bmp = null; }
      }
      if (!this.wanted) { bmp?.close(); return; }
      const c = document.createElement('canvas');
      c.setAttribute('aria-hidden', 'true');
      const gl = c.getContext('webgl', { alpha: false, antialias: false, depth: false, premultipliedAlpha: false, powerPreference: 'high-performance' });
      if (!gl) { bmp?.close(); return; }
      const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
      const pr = gl.createProgram();
      gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
      if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
      gl.useProgram(pr);
      const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      const tex = (unit, src) => {
        const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, src);
      };
      tex(0, src); tex(1, dep); bmp?.close();
      const u = n => gl.getUniformLocation(pr, n);
      gl.uniform1i(u('img'), 0); gl.uniform1i(u('dep'), 1);
      this.u = { cover: u('cover'), ctr: u('ctr'), off: u('off'), zoom: u('zoom'), push: u('push'), fade: u('fade') };
      this.gl = gl; this.canvas = c; this.iw = this.img.naturalWidth; this.ih = this.img.naturalHeight;
      this.el.append(c);
      this.size();
      c.addEventListener('webglcontextlost', e => { e.preventDefault(); this.drop(); });
      if (!this.shown) this.shown = performance.now();
      this.el.classList.add('gl');
      this.loop();
    } catch (e) { /* ostáva obyčajná fotka */ } finally { this.starting = false; }
  }
  size() {
    if (!this.gl) return;
    const w = this.el.clientWidth, h = this.el.clientHeight;
    const k = Math.min(devicePixelRatio || 1, 2, 2200 / Math.max(w, 1));
    this.canvas.width = Math.round(w * k); this.canvas.height = Math.round(h * k);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    // ako object-fit: cover s object-position podľa bodu záujmu
    const A = w / h, I = this.iw / this.ih;
    const cw = A < I ? A / I : 1, ch = A < I ? 1 : I / A;
    this.gl.uniform2f(this.u.cover, cw, ch);
    this.gl.uniform2f(this.u.ctr, cw / 2 + (1 - cw) * this.fx, ch / 2 + (1 - ch) * this.fy);
    this.draw(performance.now());
  }
  draw(now) {
    const t = now / 1000;
    const dt = this.last ? Math.min(t - this.last, 0.05) : 0.016; this.last = t;
    // samostatný pomalý pohyb kamery; vstup používateľa má prednosť a plynule sa doň prelieva
    const auto = { x: Math.sin(t * 0.33) * 0.75, y: Math.sin(t * 0.21 + 1.3) * 0.5 };
    const tg = this.user || auto;
    const k = 1 - Math.exp(-dt * (this.user ? 5 : 2));
    this.cur.x += (tg.x - this.cur.x) * k; this.cur.y += (tg.y - this.cur.y) * k;
    // pri prvom zobrazení kamera vojde do priestoru (popredie sa priblíži) a obraz sa rozsvieti
    const r = Math.min(1, (now - this.shown) / 2400), e = 1 - Math.pow(1 - r, 3);
    const gl = this.gl, U = this.u;
    gl.uniform2f(U.off, this.cur.x * AMP, -this.cur.y * AMP * 0.6);
    gl.uniform1f(U.zoom, ZOOM + 0.02 * Math.sin(t * 0.15));
    gl.uniform1f(U.push, 0.1 * (1 - e) + 0.025);
    gl.uniform1f(U.fade, Math.min(1, 0.35 + e));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  loop() {
    if (this.raf || !this.gl || !this.visible || document.hidden) return;
    const f = now => { this.raf = 0; if (!this.gl || !this.visible || document.hidden) return; this.draw(now); this.raf = requestAnimationFrame(f); };
    this.raf = requestAnimationFrame(f);
  }
  drop() {
    cancelAnimationFrame(this.raf); this.raf = 0;
    if (this.gl) { this.gl.getExtension('WEBGL_lose_context')?.loseContext(); this.canvas.remove(); }
    this.gl = null; this.canvas = null; this.last = 0;
    this.el.classList.remove('gl');
  }
  onPointer() {
    // myš: poloha nad fotkou; dotyk: vodorovný ťah (zvislý ostáva skrolovaniu stránky)
    let sx = 0, sy = 0, bx = 0, by = 0;
    this.el.addEventListener('pointermove', e => {
      const r = this.el.getBoundingClientRect();
      if (e.pointerType === 'mouse') this.user = { x: ((e.clientX - r.left) / r.width) * 2 - 1, y: ((e.clientY - r.top) / r.height) * 2 - 1 };
      else if (this.user) this.user = { x: Math.max(-1, Math.min(1, bx + (e.clientX - sx) / (r.width * 0.5))), y: Math.max(-1, Math.min(1, by + (e.clientY - sy) / (r.height * 0.5))) };
    }, { passive: true });
    this.el.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse') return;
      sx = e.clientX; sy = e.clientY; bx = this.cur.x; by = this.cur.y; this.user = { x: bx, y: by };
    }, { passive: true });
    const end = e => { if (e.pointerType !== 'mouse' || e.type === 'pointerleave') this.user = null; };
    for (const n of ['pointerup', 'pointercancel', 'pointerleave']) this.el.addEventListener(n, end, { passive: true });
  }
}

if (!reduce && 'IntersectionObserver' in window && window.WebGLRenderingContext) {
  const spaces = new Map([...document.querySelectorAll('.s3d')].map(el => [el, new Space3D(el)]));
  // blízko obrazu: pripraviť kontext; v obraze: kresliť; ďaleko: uvoľniť
  const near = new IntersectionObserver(es => es.forEach(e => {
    const s = spaces.get(e.target);
    s.wanted = e.isIntersecting;
    if (e.isIntersecting) s.start(); else s.drop();
  }), { rootMargin: '600px 0px' });
  const vis = new IntersectionObserver(es => es.forEach(e => {
    const s = spaces.get(e.target);
    s.visible = e.isIntersecting;
    if (s.visible) s.loop();
  }), { rootMargin: '40px 0px' });
  spaces.forEach((s, el) => { near.observe(el); vis.observe(el); });
  const ro = new ResizeObserver(es => es.forEach(e => spaces.get(e.target)?.size()));
  spaces.forEach((s, el) => ro.observe(el));
  document.addEventListener('visibilitychange', () => spaces.forEach(s => s.loop()));
}
