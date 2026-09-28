// GYM KLUB – 3D prehliadka skutočných priestorov.
// Každý záber je skutočná fotka z prevádzky s hĺbkovou mapou (media/depth-*.png). WebGL podľa hĺbky
// posúva popredie viac než pozadie, takže sa dá jemne rozhliadnuť; prechod „Ďalej“ priblíži kameru
// k miestu, kam sa ide, a prelne sa do ďalšieho záberu. Body na zábere pomenúvajú vybavenie.
// Bez WebGL alebo pri obmedzenom pohybe ostáva obyčajná fotka s rovnakými bodmi a ovládaním.

const root = document.getElementById('prehliadka');
if (root) init(root);

function init(root) {
  const data = JSON.parse(document.getElementById('tourData').textContent);
  const stops = data.stops, zones = data.zones;
  const zoneName = Object.fromEntries(zones.map(z => [z.id, z.name]));
  const stage = root.querySelector('.tv-stage');
  const img = root.querySelector('.tv-img');
  const pinsEl = root.querySelector('.tv-pins');
  const goBtn = root.querySelector('.tv-go');
  const goLbl = goBtn.querySelector('span');
  const capZone = root.querySelector('.tv-zone'), capTitle = root.querySelector('.tv-title'), capCount = root.querySelector('.tv-count');
  const live = root.querySelector('.tv-live');
  const info = root.querySelector('.tv-info-p'), infoList = root.querySelector('.tv-info-l');
  const prevBtn = root.querySelector('.tv-prev'), nextBtn = root.querySelector('.tv-next');
  const routeBtns = [...root.querySelectorAll('.tv-route button')];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = matchMedia('(max-width: 900px), (pointer: coarse)').matches;

  const byZone = {}; stops.forEach((s, i) => { (byZone[s.zone] ||= []).push(i); });
  // telefóny a úzke okná: 1280 px (Panda 1200 px), počítač: plné rozlíšenie zdroja (1932 až 2160 px)
  const url = s => `media/${s.img}-${small && s.sizes.length > 2 ? s.sizes[1] : s.sizes[0]}.webp`;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  let cur = Math.max(0, stops.findIndex(s => location.hash === '#zaber-' + s.id));
  let pan = { x: 0, y: 0 }, look = { x: 0, y: 0 }, lookT = null, anim = null, visible = true, raf = 0, last = 0;
  const EXTRA = 1.12;          // rezerva na rozhliadanie a posun podľa hĺbky
  const AMP = 0.018;

  // ---------- WebGL ----------
  let gl = null, U = null, W = 1, H = 1;
  const cache = new Map();     // id -> {img, dep, iw, ih}
  const VS = 'attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
  const FS = `precision mediump float;
varying vec2 v;
uniform sampler2D iA,dA,iB,dB;
uniform vec2 covA,ctrA,focA,covB,ctrB,off;
uniform float zA,zB,pA,mixv;
vec2 look(sampler2D d,vec2 cov,vec2 ctr,float z,float push,vec2 foc){
  vec2 base=ctr+(vec2(v.x,1.-v.y)-.5)*cov/z;
  vec2 uv=base;
  for(int i=0;i<5;i++){float h=texture2D(d,uv).r;uv=base+off*(h-.4)-(base-foc)*push*h;}
  return clamp(uv,.001,.999);
}
void main(){
  vec3 a=texture2D(iA,look(dA,covA,ctrA,zA,pA,focA)).rgb;
  vec3 c=a;
  if(mixv>0.){vec3 b=texture2D(iB,look(dB,covB,ctrB,zB,0.,ctrB)).rgb;c=mix(a,b,mixv);}
  gl_FragColor=vec4(c,1.);
}`;

  function initGL() {
    if (reduce || !window.WebGLRenderingContext) return false;
    const c = document.createElement('canvas');
    c.className = 'tv-canvas'; c.setAttribute('aria-hidden', 'true');
    const g = c.getContext('webgl', { alpha: false, antialias: false, depth: false, powerPreference: 'high-performance' });
    if (!g) return false;
    const sh = (t, src) => { const s = g.createShader(t); g.shaderSource(s, src); g.compileShader(s); return s; };
    const pr = g.createProgram();
    g.attachShader(pr, sh(g.VERTEX_SHADER, VS)); g.attachShader(pr, sh(g.FRAGMENT_SHADER, FS)); g.linkProgram(pr);
    if (!g.getProgramParameter(pr, g.LINK_STATUS)) return false;
    g.useProgram(pr);
    const b = g.createBuffer(); g.bindBuffer(g.ARRAY_BUFFER, b);
    g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), g.STATIC_DRAW);
    const loc = g.getAttribLocation(pr, 'p'); g.enableVertexAttribArray(loc); g.vertexAttribPointer(loc, 2, g.FLOAT, false, 0, 0);
    U = {}; ['iA', 'dA', 'iB', 'dB', 'covA', 'ctrA', 'focA', 'covB', 'ctrB', 'off', 'zA', 'zB', 'pA', 'mixv'].forEach(n => U[n] = g.getUniformLocation(pr, n));
    ['iA', 'dA', 'iB', 'dB'].forEach((n, i) => g.uniform1i(U[n], i));
    c.addEventListener('webglcontextlost', e => { e.preventDefault(); gl = null; c.remove(); stage.classList.remove('gl'); });
    stage.insertBefore(c, pinsEl);
    gl = g; stage.classList.add('gl');
    size();
    return true;
  }

  function tex(source, fmt) {
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, fmt, fmt, gl.UNSIGNED_BYTE, source);
    return t;
  }
  const loadBitmap = async src => {
    const r = await fetch(src); if (!r.ok) throw new Error(src);
    const b = await r.blob();
    return window.createImageBitmap ? createImageBitmap(b) : new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(b); });
  };
  function load(i) {
    const s = stops[i];
    if (!s || !gl) return null;
    if (cache.has(s.id)) return cache.get(s.id);
    const p = (async () => {
      const [a, d] = await Promise.all([loadBitmap(url(s)), loadBitmap('media/' + s.depth)]);
      if (!gl) return null;
      const e = { img: tex(a, gl.RGB), dep: tex(d, gl.RGB), iw: s.w, ih: s.h };
      a.close?.(); d.close?.();
      return e;
    })();
    cache.set(s.id, p);
    // najviac 5 záberov v pamäti grafiky
    if (cache.size > 5) {
      for (const [id, v] of cache) {
        const k = stops.findIndex(x => x.id === id);
        if (Math.abs(k - cur) > 2) { Promise.resolve(v).then(t => { if (t && gl) { gl.deleteTexture(t.img); gl.deleteTexture(t.dep); } }); cache.delete(id); if (cache.size <= 5) break; }
      }
    }
    return p;
  }

  function size() {
    W = stage.clientWidth; H = stage.clientHeight;
    if (!gl) return;
    const k = Math.min(devicePixelRatio || 1, 2, 2400 / Math.max(W, 1));
    gl.canvas.width = Math.round(W * k); gl.canvas.height = Math.round(H * k);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  }

  // pohľad (object-fit: cover + bod záujmu + rozhliadnutie) v súradniciach fotky
  function view(s, zoom, panv) {
    const A = W / H, I = s.w / s.h;
    const cw = A < I ? A / I : 1, ch = A < I ? 1 : I / A;
    const vw = cw / zoom, vh = ch / zoom;
    const fx = clamp(s.fx / 100 + panv.x * 0.5, 0, 1), fy = clamp(s.fy / 100 + panv.y * 0.5, 0, 1);
    return { cw, ch, vw, vh, cx: vw / 2 + (1 - vw) * fx, cy: vh / 2 + (1 - vh) * fy };
  }
  const toScreen = (vv, u, w) => [((u - vv.cx) / vv.vw + .5) * W, ((w - vv.cy) / vv.vh + .5) * H];

  // ---------- body na zábere ----------
  function buildPins() {
    const s = stops[cur];
    pinsEl.replaceChildren(...s.pins.map((p, k) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'tv-pin';
      b.innerHTML = `<i aria-hidden="true"></i><span>${p.label}</span>`;
      b.setAttribute('aria-label', p.label);
      b.addEventListener('click', () => { const on = b.classList.toggle('on'); pinsEl.querySelectorAll('.tv-pin.on').forEach(o => { if (o !== b) o.classList.remove('on'); }); if (on) info.textContent = p.label; });
      return b;
    }));
    infoList.replaceChildren(...s.pins.map(p => { const li = document.createElement('li'); li.textContent = p.label; return li; }));
  }
  function placeOverlay(vv, alpha) {
    const s = stops[cur];
    [...pinsEl.children].forEach((b, k) => {
      const p = s.pins[k]; const [x, y] = toScreen(vv, p.x / 100, p.y / 100);
      const inside = x > 24 && x < W - 24 && y > 70 && y < H - 90;
      b.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
      b.style.opacity = inside ? alpha : 0;
      b.tabIndex = inside && alpha > .5 ? 0 : -1;
      b.classList.toggle('flip', x > W * .62);
    });
    const next = stops[cur + 1];
    if (next) {
      let [x, y] = toScreen(vv, s.walk.x / 100, s.walk.y / 100);
      const gw = goBtn.offsetWidth / 2 + 12;
      x = clamp(x, gw, W - gw); y = clamp(y, H * .45, H - 120);
      goBtn.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
      goBtn.style.opacity = alpha;
    }
  }

  // ---------- kreslenie ----------
  function frame(now) {
    raf = 0;
    const t = now / 1000, dt = last ? Math.min(t - last, .05) : .016; last = t;
    // jemný pohyb „dychu“ kamery; ťah alebo myš má prednosť
    const auto = reduce ? { x: 0, y: 0 } : { x: Math.sin(t * .3) * .35, y: Math.sin(t * .19 + 1) * .2 };
    const tg = lookT || auto;
    const k = 1 - Math.exp(-dt * (lookT ? 6 : 1.5));
    look.x += (tg.x - look.x) * k; look.y += (tg.y - look.y) * k;
    const s = stops[cur];
    const vv = view(s, EXTRA, pan);
    let alpha = 1;
    if (gl) {
      const T = cache.get(s.id)?.done;
      if (T) {
        let zA = EXTRA, pA = 0, mixv = 0, ctrA = [vv.cx, vv.cy], foc = [vv.cx, vv.cy];
        if (anim) {
          const r = clamp((now - anim.t0) / anim.dur, 0, 1), e = ease(r);
          const B = anim.B;
          if (anim.walk && !reduce) {
            zA = EXTRA * (1 + .45 * e); pA = .16 * e;
            foc = [anim.walk[0], anim.walk[1]];
            ctrA = [vv.cx + (anim.walk[0] - vv.cx) * .55 * e, vv.cy + (anim.walk[1] - vv.cy) * .55 * e];
          }
          mixv = clamp((r - (anim.walk && !reduce ? .35 : 0)) / (anim.walk && !reduce ? .65 : 1), 0, 1);
          const nv = view(anim.to, EXTRA, { x: 0, y: 0 });
          const zB = EXTRA * (anim.walk && !reduce ? .93 + .07 * mixv : 1);
          gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, B.img);
          gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, B.dep);
          gl.uniform2f(U.covB, nv.cw, nv.ch); gl.uniform2f(U.ctrB, nv.cx, nv.cy); gl.uniform1f(U.zB, zB);
          alpha = 1 - clamp(r * 3, 0, 1);
          if (r >= 1) { finish(); }
        }
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, T.img);
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, T.dep);
        gl.uniform2f(U.covA, vv.cw, vv.ch); gl.uniform2f(U.ctrA, ctrA[0], ctrA[1]); gl.uniform2f(U.focA, foc[0], foc[1]);
        gl.uniform1f(U.zA, zA); gl.uniform1f(U.pA, pA); gl.uniform1f(U.mixv, mixv);
        gl.uniform2f(U.off, look.x * AMP, -look.y * AMP * .6);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        stage.classList.add('live');
      }
    } else if (anim) {
      finish();
    }
    placeOverlay(vv, anim ? alpha : 1);
    if (visible && !document.hidden) raf = requestAnimationFrame(frame);
  }
  const kick = () => { if (!raf && visible) raf = requestAnimationFrame(frame); };

  // načítanie záberu; hotové textúry sú v p.done
  const ensure = i => {
    const p = load(i);
    if (p && !p.watched) { p.watched = true; p.then(v => { p.done = v; kick(); }).catch(() => { cache.delete(stops[i].id); }); }
    return p;
  };

  // ---------- presun medzi zábermi ----------
  function setStatic(i) {
    const s = stops[i];
    // obyčajná fotka (základ aj pre režim bez WebGL); veľkosť podľa zariadenia
    img.src = url(s).replace('.webp', '.jpg');
    img.alt = s.alt;
    img.style.objectPosition = `${s.fx}% ${s.fy}%`;
  }
  function describe() {
    const s = stops[cur], zi = zones.findIndex(z => z.id === s.zone), list = byZone[s.zone];
    capZone.textContent = `${String(zi + 1).padStart(2, '0')} / ${String(zones.length).padStart(2, '0')} · ${zoneName[s.zone]}`;
    capTitle.textContent = s.title;
    capCount.textContent = `Záber ${list.indexOf(cur) + 1} z ${list.length}${s.src === 'gymklub.sk' ? ' · fotka z gymklub.sk' : ''}`;
    info.textContent = s.alt;
    live.textContent = `${zoneName[s.zone]}: ${s.title}`;
    routeBtns.forEach(b => { const on = b.dataset.zone === s.zone; b.classList.toggle('on', on); b.setAttribute('aria-current', on ? 'step' : 'false'); });
    const next = stops[cur + 1];
    goBtn.hidden = !next;
    if (next) goLbl.textContent = next.zone === s.zone ? `Ďalej: ${next.title}` : `Ďalej: ${zoneName[next.zone]}`;
    prevBtn.disabled = cur === 0; nextBtn.disabled = cur === stops.length - 1;
    try { history.replaceState(null, '', '#zaber-' + s.id); } catch (e) { /* napr. v náhľade */ }
    buildPins();
    // vopred načítať susedov
    if (gl) { ensure(cur + 1); ensure(cur - 1); }
  }
  function finish() {
    const a = anim; anim = null;
    cur = a.toIndex; pan = { x: 0, y: 0 };
    describe(); setStatic(cur);
    stage.classList.remove('moving');
  }
  async function go(i, walk) {
    if (i < 0 || i >= stops.length || i === cur || anim) return;
    const s = stops[cur];
    if (gl && cache.get(s.id)?.done) {
      const B = ensure(i); stage.classList.add('moving');
      let Bv = null; try { Bv = await B; } catch (e) { /* záber sa nenačítal, prejde sa bez prechodu */ }
      if (!Bv) { cur = i; describe(); setStatic(i); stage.classList.remove('moving'); return; }
      const vv = view(s, EXTRA, pan);
      anim = { t0: performance.now(), dur: walk && !reduce ? 1100 : 380, B: Bv, to: stops[i], toIndex: i, walk: walk ? [s.walk.x / 100, s.walk.y / 100] : null };
      if (anim.walk) {
        // bod chôdze v súradniciach fotky
        anim.walk = [clamp(s.walk.x / 100, vv.cx - vv.vw / 2, vv.cx + vv.vw / 2), clamp(s.walk.y / 100, vv.cy - vv.vh / 2, vv.cy + vv.vh / 2)];
      }
      kick();
    } else {
      cur = i; describe(); setStatic(i);
      if (gl) ensure(i);
      kick();
    }
  }

  // ---------- ovládanie ----------
  goBtn.addEventListener('click', () => go(cur + 1, true));
  nextBtn.addEventListener('click', () => go(cur + 1, true));
  prevBtn.addEventListener('click', () => go(cur - 1, false));
  routeBtns.forEach(b => b.addEventListener('click', () => go(byZone[b.dataset.zone][0], false)));
  document.querySelectorAll('[data-tour-stop]').forEach(a => a.addEventListener('click', ev => {
    const i = stops.findIndex(s => s.id === a.dataset.tourStop);
    if (i < 0) return;
    ev.preventDefault();
    root.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    setTimeout(() => go(i, false), reduce ? 0 : 450);
  }));
  stage.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1, true); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1, false); }
  });
  // rozhliadnutie: myš podľa polohy, ťah (myš aj prst) posúva pohľad; zvislý ťah prstom ostáva skrolovaniu
  let drag = null;
  stage.addEventListener('pointermove', e => {
    const r = stage.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width) * 2 - 1, ny = ((e.clientY - r.top) / r.height) * 2 - 1;
    if (drag) {
      pan.x = clamp(drag.px - (e.clientX - drag.x) / r.width * 1.6, -1, 1);
      pan.y = clamp(drag.py - (e.clientY - drag.y) / r.height * 1.6, -1, 1);
      lookT = { x: clamp(-(e.clientX - drag.x) / r.width * 3, -1, 1), y: 0 };
      kick();
    } else if (e.pointerType === 'mouse') { lookT = { x: nx, y: ny }; kick(); }
  }, { passive: true });
  stage.addEventListener('pointerdown', e => {
    if (e.target.closest('button')) return;
    drag = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
  }, { passive: true });
  const end = () => { drag = null; lookT = null; };
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(n => stage.addEventListener(n, end, { passive: true }));

  // kreslí sa len v obraze
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); }).observe(stage);
  document.addEventListener('visibilitychange', kick);
  new ResizeObserver(() => { size(); kick(); }).observe(stage);

  // ---------- štart ----------
  setStatic(cur);
  describe();
  const glOn = initGL();
  root.classList.toggle('tv-3d', glOn);
  if (glOn) { ensure(cur); }
  kick();
}
