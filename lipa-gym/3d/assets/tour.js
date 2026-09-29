// GYM KLUB – prehliadka skutočných priestorov.
// Dva druhy miest:
//  • panoráma: zložená zo skutočného videa, v ktorom sa kamera otáčala na mieste (tools/panorama.py).
//    Je to valec s uhlom záberu podľa videa (napr. 238°). Kreslí sa v perspektíve, takže priame hrany
//    ostávajú priame, a rozhliadať sa dá len v rozsahu, ktorý kamera naozaj zachytila.
//  • fotka: jeden skutočný záber s hĺbkovou mapou (media/depth-*.png) a jemným priestorovým posunom.
// Prechod na ďalšie miesto priblíži kameru k bodu v scéne a prelne sa do nového miesta.
// Bez WebGL ostáva obyčajný obrázok (panoráma sa dá posúvať do strany), pri obmedzenom pohybe
// sa vypnú samovoľné pohyby a prechody sú len krátke prelínanie.

const root = document.getElementById('prehliadka');
if (root) init(root);

function init(root) {
  const data = JSON.parse(document.getElementById('tourData').textContent);
  const stops = data.stops, zones = data.zones;
  const zoneName = Object.fromEntries(zones.map(z => [z.id, z.name]));
  const $ = sel => root.querySelector(sel);
  const stage = $('.tv-stage'), flat = $('.tv-flat'), img = $('.tv-img');
  const pinsEl = $('.tv-pins'), goBtn = $('.tv-go'), goLbl = goBtn.querySelector('span');
  const capZone = $('.tv-zone'), capTitle = $('.tv-title'), capBadge = $('.tv-badge'), capN = $('.tv-n');
  const live = $('.tv-live'), info = $('.tv-info-p'), infoList = $('.tv-info-l');
  const card = $('.tv-card'), cardH = $('.tv-card-h'), cardP = $('.tv-card-p');
  const list = $('.tv-list'), openBtn = $('.tv-open');
  const guide = $('.tv-guide'), state = $('.tv-state'), stateT = $('.tv-state-t'), retryBtn = $('.tv-retry');
  const btn = n => $('.tv-' + n);
  const routeBtns = [...root.querySelectorAll('.tv-route button')];

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const small = matchMedia('(max-width: 900px), (pointer: coarse)').matches;
  // ľahšia verzia: šetrenie dát, pomalé pripojenie alebo slabé zariadenie
  const conn = navigator.connection || {};
  const light = !!(conn.saveData || /2g|3g/.test(conn.effectiveType || '') ||
    (navigator.deviceMemory && navigator.deviceMemory <= 2) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2));
  root.classList.toggle('tv-light', light);

  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const rad = d => d * Math.PI / 180;
  const byZone = {}; stops.forEach((s, i) => { (byZone[s.zone] ||= []).push(i); });
  const isPano = s => s.type === 'pano';
  const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* súkromné okno */ } } };

  // zdroje obrázkov
  const photoUrl = (s, ext = 'webp') => `media/${s.img}-${(small || light) && s.sizes.length > 2 ? s.sizes[1] : s.sizes[0]}.${ext}`;
  const panoUrl = (s, lvl) => `media/${s.img}-${lvl}.webp`;

  let cur = Math.max(0, stops.findIndex(s => location.hash === '#zaber-' + s.id));
  let W = 1, H = 1, visible = true, raf = 0, last = 0, anim = null, touched = false, idleT0 = performance.now();
  // kamera panorámy (radiány) a pohľad na fotku
  const cam = { yaw: 0, pitch: 0, fov: 1, tYaw: 0, tPitch: 0, tFov: 1, vy: 0 };
  let pan = { x: 0, y: 0 }, pz = 1, tpz = 1, look = { x: 0, y: 0 }, lookT = null;
  const EXTRA = 1.12, AMP = 0.018;

  // ---------- WebGL ----------
  let gl = null, gl2 = false, maxTex = 4096, P = null, Q = null;
  const cache = new Map();
  const VS = 'attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
  const FS_PANO = `precision highp float;
varying vec2 v;
uniform sampler2D img;
uniform float yaw,pitch,th,asp,hf,fr,alpha;
void main(){
  vec2 n=v*2.-1.;
  vec3 d=normalize(vec3(n.x*asp*th,n.y*th,1.));
  float cp=cos(pitch),sp=sin(pitch);
  d=vec3(d.x,d.y*cp+d.z*sp,-d.y*sp+d.z*cp);
  float a=atan(d.x,d.z)+yaw;
  float h=d.y/length(d.xz);
  vec2 uv=vec2(.5+a/hf,.5-h*fr);
  vec2 e=min(uv,1.-uv);
  float m=smoothstep(0.,.006,min(e.x,e.y));
  vec3 c=texture2D(img,clamp(uv,.0005,.9995)).rgb;
  gl_FragColor=vec4(mix(vec3(.02),c,m),alpha);
}`;
  const FS_PHOTO = `precision mediump float;
varying vec2 v;
uniform sampler2D iA,dA;
uniform vec2 cov,ctr,foc,off;
uniform float z,push,alpha;
void main(){
  vec2 base=ctr+(vec2(v.x,1.-v.y)-.5)*cov/z;
  vec2 uv=base;
  for(int i=0;i<5;i++){float h=texture2D(dA,uv).r;uv=base+off*(h-.4)-(base-foc)*push*h;}
  gl_FragColor=vec4(texture2D(iA,clamp(uv,.001,.999)).rgb,alpha);
}`;

  function program(g, fs, names) {
    const sh = (t, src) => { const s = g.createShader(t); g.shaderSource(s, src); g.compileShader(s); return s; };
    const pr = g.createProgram();
    g.attachShader(pr, sh(g.VERTEX_SHADER, VS)); g.attachShader(pr, sh(g.FRAGMENT_SHADER, fs));
    g.bindAttribLocation(pr, 0, 'p'); g.linkProgram(pr);
    if (!g.getProgramParameter(pr, g.LINK_STATUS)) return null;
    const u = { pr }; names.forEach(n => u[n] = g.getUniformLocation(pr, n));
    return u;
  }
  function initGL() {
    const c = document.createElement('canvas');
    c.className = 'tv-canvas'; c.setAttribute('aria-hidden', 'true');
    const opt = { alpha: false, antialias: false, depth: false, powerPreference: 'high-performance' };
    let g = null;
    try { g = c.getContext('webgl2', opt); gl2 = !!g; if (!g) g = c.getContext('webgl', opt); } catch (e) { g = null; }
    if (!g) return false;
    P = program(g, FS_PANO, ['img', 'yaw', 'pitch', 'th', 'asp', 'hf', 'fr', 'alpha']);
    Q = program(g, FS_PHOTO, ['iA', 'dA', 'cov', 'ctr', 'foc', 'off', 'z', 'push', 'alpha']);
    if (!P || !Q) return false;
    const b = g.createBuffer(); g.bindBuffer(g.ARRAY_BUFFER, b);
    g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), g.STATIC_DRAW);
    g.enableVertexAttribArray(0); g.vertexAttribPointer(0, 2, g.FLOAT, false, 0, 0);
    g.useProgram(Q.pr); g.uniform1i(Q.iA, 0); g.uniform1i(Q.dA, 1);
    g.useProgram(P.pr); g.uniform1i(P.img, 0);
    g.blendFunc(g.SRC_ALPHA, g.ONE_MINUS_SRC_ALPHA);
    maxTex = g.getParameter(g.MAX_TEXTURE_SIZE) || 4096;
    c.addEventListener('webglcontextlost', e => { e.preventDefault(); gl = null; cache.clear(); c.remove(); stage.classList.remove('gl', 'live'); showFlat(); });
    stage.insertBefore(c, pinsEl);
    gl = g; stage.classList.add('gl');
    size();
    return true;
  }
  function tex(source, mip) {
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, source);
    // panorámy sa na malom displeji silno zmenšujú: mipmapy (WebGL2) proti mihotaniu
    const mm = mip && gl2;
    if (mm) gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mm ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }
  const loadBitmap = async src => {
    const r = await fetch(src); if (!r.ok) throw new Error(src);
    const b = await r.blob();
    return window.createImageBitmap ? createImageBitmap(b) : new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(b); });
  };

  // načítanie miesta. Panoráma: najprv malý náhľad (okamžite), potom 1280 px na výšku,
  // na počítači napokon plné rozlíšenie zo 4K videa. Hotová položka je v e.ready.
  function load(i) {
    const s = stops[i];
    if (!s || !gl) return null;
    if (cache.has(s.id)) return cache.get(s.id);
    const e = { s, tex: null, dep: null, level: 0, ready: null, failed: false };
    e.ready = (async () => {
      if (isPano(s)) {
        const want = [['240', 1], ['1280', 2]];
        let got = 0;
        for (const [lvl, n] of want) {
          try { set(e, await loadBitmap(panoUrl(s, lvl)), n); got++; if (n === 1) e.first = true; }
          catch (err) { if (!got && n === want.length) throw err; }
          if (n === 1) state.hidden = true;
        }
        if (!got) throw new Error('pano');
        e.base = true; if (stops[cur] === s) sharpen(e);
      } else {
        const [a, d] = await Promise.all([loadBitmap(photoUrl(s)), loadBitmap('media/' + s.depth)]);
        if (!gl) return e;
        e.dep = tex(d, false); d.close?.(); set(e, a, 1);
      }
      return e;
    })();
    e.ready.catch(() => { e.failed = true; cache.delete(s.id); if (stops[cur] === s) fail(); });
    cache.set(s.id, e);
    // v pamäti grafiky najviac 5 miest
    if (cache.size > 5) {
      for (const [id, v] of cache) {
        const k = stops.findIndex(x => x.id === id);
        if (Math.abs(k - cur) > 1 && (!anim || anim.to !== k)) {
          if (v.tex) gl.deleteTexture(v.tex); if (v.dep) gl.deleteTexture(v.dep);
          cache.delete(id); if (cache.size <= 5) break;
        }
      }
    }
    return e;
  }
  // plné rozlíšenie zo 4K videa len pre miesto, na ktorom návštevník práve je, a len na počítači
  function sharpen(e) {
    const s = e.s;
    if (!isPano(s) || !e.base || e.full || small || light || s.w > maxTex || !gl) return;
    e.full = true;
    loadBitmap(panoUrl(s, 'full')).then(bm => set(e, bm, 3)).catch(() => { e.full = false; });
  }
  function set(e, bm, lvl) {
    if (!gl || lvl <= e.level || !cache.has(e.s.id)) { bm.close?.(); return; }
    const t = tex(bm, isPano(e.s)); bm.close?.();
    if (e.tex) gl.deleteTexture(e.tex);
    e.tex = t; e.level = lvl; kick();
  }
  const entry = i => { const e = cache.get(stops[i]?.id); return e && e.tex && (!e.s.depth || isPano(e.s) || e.dep) ? e : null; };

  function size() {
    W = stage.clientWidth; H = stage.clientHeight;
    if (!gl) return;
    const k = Math.min(devicePixelRatio || 1, light ? 1.25 : 2, 2600 / Math.max(W, 1));
    gl.canvas.width = Math.round(W * k); gl.canvas.height = Math.round(H * k);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  }

  // ---------- geometria panorámy ----------
  const pg = s => ({ hf: s.w / s.f, fr: s.f / s.h, vTop: Math.atan(s.h / 2 / s.f) });
  function fovLimits(s) {
    const g = pg(s), asp = W / H;
    // zvislý uhol tak, aby vodorovný záber nepresiahol panorámu ani nebol ako rybie oko
    const vMaxEdge = 2 * g.vTop * .94;
    const hMax = Math.min(g.hf * .96, rad(100));
    const vFromH = 2 * Math.atan(Math.tan(hMax / 2) / asp);
    // priblíženie najviac po skutočné rozlíšenie načítaného obrázka (nezväčšovať rozmazanie)
    const e = cache.get(s.id), fTex = s.f * (e && e.level === 3 ? 1 : 1280 / s.h);
    const max = Math.min(vMaxEdge, vFromH, rad(85));
    return { min: Math.min(max, Math.max(rad(24), .6 * H / fTex)), max };
  }
  function defaultFov(s) {
    const asp = W / H, L = fovLimits(s);
    const v = asp >= 1 ? 2 * Math.atan(Math.tan(rad(44)) / asp) : rad(74);
    return clamp(v, L.min, L.max);
  }
  function clampCam(s, c) {
    const g = pg(s), asp = W / H;
    const L = fovLimits(s); c.fov = clamp(c.fov, L.min, L.max);
    const hv = c.fov / 2, hh = Math.atan(asp * Math.tan(hv));
    const yl = Math.max(0, g.hf / 2 - hh - .01), pl = Math.max(0, g.vTop - hv - .03);
    c.yaw = clamp(c.yaw, -yl, yl); c.pitch = clamp(c.pitch, -pl, pl);
    return { yl, pl };
  }
  const pinDir = (s, x, y) => ({ yaw: (x / 100 - .5) * (s.w / s.f), pitch: Math.atan((.5 - y / 100) * s.h / s.f) });
  function panoToScreen(c, yawP, pitchP) {
    const a = yawP - c.yaw, cb = Math.cos(pitchP);
    const x = Math.sin(a) * cb, y = Math.sin(pitchP), z = Math.cos(a) * cb;
    const cp = Math.cos(c.pitch), sp = Math.sin(c.pitch);
    const dy = y * cp - z * sp, dz = y * sp + z * cp;
    if (dz <= .05) return null;
    const th = Math.tan(c.fov / 2), asp = W / H;
    return [(x / (dz * asp * th) * .5 + .5) * W, (1 - (dy / (dz * th) * .5 + .5)) * H];
  }
  function startCam(s) {
    cam.fov = cam.tFov = defaultFov(s);
    cam.yaw = cam.tYaw = pinDir(s, s.x0 ?? 50, 50).yaw; cam.pitch = cam.tPitch = 0; cam.vy = 0;
    clampCam(s, cam); cam.tYaw = cam.yaw;
  }

  // ---------- geometria fotky ----------
  function view(s, zoom, panv) {
    const A = W / H, I = s.w / s.h;
    const cw = A < I ? A / I : 1, ch = A < I ? 1 : I / A;
    const vw = cw / zoom, vh = ch / zoom;
    const fx = clamp(s.fx / 100 + panv.x * .5, 0, 1), fy = clamp(s.fy / 100 + panv.y * .5, 0, 1);
    return { cw, ch, vw, vh, cx: vw / 2 + (1 - vw) * fx, cy: vh / 2 + (1 - vh) * fy };
  }
  const toScreen = (vv, u, w) => [((u - vv.cx) / vv.vw + .5) * W, ((w - vv.cy) / vv.vh + .5) * H];

  // ---------- body v scéne ----------
  function buildPins() {
    const s = stops[cur];
    pinsEl.replaceChildren(...s.pins.map(p => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'tv-pin';
      b.innerHTML = `<i aria-hidden="true"></i><span>${p.label}</span>`;
      b.setAttribute('aria-label', p.label + (p.text ? ': zobraziť popis' : ''));
      b.addEventListener('click', ev => { ev.stopPropagation(); showCard(p, b); dismissGuide(); });
      return b;
    }));
    infoList.replaceChildren(...s.pins.map(p => { const li = document.createElement('li'); li.textContent = p.label; return li; }));
  }
  function showCard(p, b) {
    const was = b.classList.contains('on');
    pinsEl.querySelectorAll('.tv-pin.on').forEach(o => o.classList.remove('on'));
    if (was) { card.hidden = true; return; }
    b.classList.add('on');
    cardH.textContent = p.label;
    cardP.textContent = p.text || `${zoneName[stops[cur].zone]} · ${stops[cur].title}`;
    card.hidden = false;
  }
  const hideCard = () => { card.hidden = true; pinsEl.querySelectorAll('.tv-pin.on').forEach(o => o.classList.remove('on')); };

  function placeOverlay(alpha) {
    const s = stops[cur];
    const gLive = gl && entry(cur);
    let proj;
    if (isPano(s)) {
      if (!gLive) proj = null;
      else proj = (x, y) => { const d = pinDir(s, x, y); return panoToScreen(cam, d.yaw, d.pitch); };
    } else {
      const vv = view(s, gLive ? EXTRA * pz : 1, pan);
      proj = (x, y) => toScreen(vv, x / 100, y / 100);
    }
    [...pinsEl.children].forEach((b, k) => {
      const p = s.pins[k]; const q = proj && proj(p.x, p.y);
      const inside = q && q[0] > 24 && q[0] < W - 24 && q[1] > 90 && q[1] < H - 72;
      if (q) b.style.transform = `translate3d(${q[0].toFixed(1)}px,${q[1].toFixed(1)}px,0)`;
      b.style.opacity = inside ? alpha : 0;
      b.tabIndex = inside && alpha > .5 ? 0 : -1;
      b.classList.toggle('flip', !!q && q[0] > W * .6);
    });
    // tlačidlo Ďalej sedí v scéne na mieste, kam sa ide; mimo záberu sa prichytí k okraju
    let q = proj && proj(s.walk.x, s.walk.y);
    const gw = goBtn.offsetWidth / 2 + 12;
    if (!q) q = [W / 2, H - 150];
    const x = clamp(q[0], gw, W - gw), y = clamp(q[1], H * .42, H - 150);
    goBtn.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
    goBtn.style.opacity = alpha;
    goBtn.classList.toggle('edge', Math.abs(x - q[0]) > 4);
  }

  // ---------- kreslenie ----------
  function drawPano(e, c, alpha) {
    const s = e.s, g = pg(s);
    gl.useProgram(P.pr);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, e.tex);
    gl.uniform1f(P.yaw, c.yaw); gl.uniform1f(P.pitch, c.pitch); gl.uniform1f(P.th, Math.tan(c.fov / 2));
    gl.uniform1f(P.asp, W / H); gl.uniform1f(P.hf, g.hf); gl.uniform1f(P.fr, g.fr); gl.uniform1f(P.alpha, alpha);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  function drawPhoto(e, o, alpha) {
    gl.useProgram(Q.pr);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, e.tex);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, e.dep);
    gl.uniform2f(Q.cov, o.vv.cw, o.vv.ch); gl.uniform2f(Q.ctr, o.ctr[0], o.ctr[1]); gl.uniform2f(Q.foc, o.foc[0], o.foc[1]);
    gl.uniform2f(Q.off, look.x * AMP * o.depthK, -look.y * AMP * .6 * o.depthK);
    gl.uniform1f(Q.z, o.z); gl.uniform1f(Q.push, o.push); gl.uniform1f(Q.alpha, alpha);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  function frame(now) {
    raf = 0;
    const t = now / 1000, dt = last ? Math.min(t - last, .05) : .016; last = t;
    const s = stops[cur];
    let busy = !!anim || !!drag || gyro.on;

    // kamera panorámy: plynulé dobiehanie k cieľu, zotrvačnosť po ťahu, pomalé rozhliadnutie na začiatku
    if (isPano(s)) {
      if (!drag && !gyro.on && Math.abs(cam.vy) > 1e-4) { cam.tYaw += cam.vy * dt; cam.vy *= Math.pow(.02, dt); busy = true; }
      if (!reduce && !touched && !anim && now - idleT0 > 2500) {
        const lim = clampCam(s, { ...cam, yaw: 0 }).yl;
        cam.dir ||= 1; cam.tYaw += cam.dir * rad(2.2) * dt;
        if (cam.tYaw > lim - .02) cam.dir = -1; if (cam.tYaw < -lim + .02) cam.dir = 1;
        busy = true;
      }
      const tc = { yaw: cam.tYaw, pitch: cam.tPitch, fov: cam.tFov }; clampCam(s, tc);
      cam.tYaw = tc.yaw; cam.tPitch = tc.pitch; cam.tFov = tc.fov;
      const k = drag || gyro.on ? 1 : 1 - Math.exp(-dt * 9);
      cam.yaw += (cam.tYaw - cam.yaw) * k; cam.pitch += (cam.tPitch - cam.pitch) * k; cam.fov += (cam.tFov - cam.fov) * (1 - Math.exp(-dt * 9));
      if (Math.abs(cam.tYaw - cam.yaw) + Math.abs(cam.tFov - cam.fov) + Math.abs(cam.tPitch - cam.pitch) > 1e-4) busy = true;
    } else {
      const auto = reduce ? { x: 0, y: 0 } : { x: Math.sin(t * .3) * .35, y: Math.sin(t * .19 + 1) * .2 };
      const tg = lookT || auto;
      const k = 1 - Math.exp(-dt * (lookT ? 6 : 1.5));
      look.x += (tg.x - look.x) * k; look.y += (tg.y - look.y) * k;
      pz += (tpz - pz) * (1 - Math.exp(-dt * 9));
      busy = busy || !reduce || Math.abs(tpz - pz) > 1e-4;
    }

    let alpha = 1;
    if (gl) {
      const A = entry(cur);
      if (A) {
        gl.disable(gl.BLEND);
        let mixv = 0, B = null;
        let r = 0, eA = 0;
        if (anim) {
          r = clamp((now - anim.t0) / anim.dur, 0, 1); eA = ease(r);
          B = entry(anim.to);
          const walk = anim.via && !reduce;
          mixv = walk ? clamp((r - .35) / .65, 0, 1) : r;
          alpha = 1 - clamp(r * 3, 0, 1);
        }
        // vrstva A (aktuálne miesto)
        if (isPano(s)) {
          const c = { ...cam };
          if (anim && anim.via && !reduce) {
            const d = pinDir(s, anim.via.x, anim.via.y);
            c.yaw = cam.yaw + (d.yaw - cam.yaw) * .6 * eA; c.pitch = cam.pitch + (d.pitch * .5 - cam.pitch) * eA;
            c.fov = cam.fov * (1 - .42 * eA);
          }
          drawPano(A, c, 1);
        } else {
          const vv = view(s, EXTRA * pz, pan);
          let z = EXTRA * pz, push = 0, ctr = [vv.cx, vv.cy], foc = ctr;
          if (anim && anim.via && !reduce) {
            const w = [clamp(anim.via.x / 100, vv.cx - vv.vw / 2, vv.cx + vv.vw / 2), clamp(anim.via.y / 100, vv.cy - vv.vh / 2, vv.cy + vv.vh / 2)];
            z = EXTRA * pz * (1 + .45 * eA); push = .16 * eA; foc = w;
            ctr = [vv.cx + (w[0] - vv.cx) * .55 * eA, vv.cy + (w[1] - vv.cy) * .55 * eA];
          }
          drawPhoto(A, { vv, z, push, ctr, foc, depthK: 1 }, 1);
        }
        // vrstva B (nové miesto) sa prelína; pri príchode sa jemne oddiali do normálu
        if (B && mixv > 0) {
          gl.enable(gl.BLEND);
          const walk = anim.via && !reduce;
          if (isPano(B.s)) {
            const c = { ...anim.cam }; c.fov = anim.cam.fov * (walk ? .86 + .14 * mixv : 1);
            drawPano(B, c, mixv);
          } else {
            const vv = view(B.s, EXTRA, { x: 0, y: 0 });
            drawPhoto(B, { vv, z: EXTRA * (walk ? 1.07 - .07 * mixv : 1), push: 0, ctr: [vv.cx, vv.cy], foc: [vv.cx, vv.cy], depthK: 0 }, mixv);
          }
          gl.disable(gl.BLEND);
        }
        stage.classList.add('live');
        if (anim && r >= 1) finish();
      } else if (anim) {
        const B = entry(anim.to); if (B || now - anim.t0 > 4000) finish();
      }
    } else if (anim) {
      finish();
    }
    placeOverlay(anim ? alpha : 1);
    if (visible && !document.hidden && (busy || anim)) raf = requestAnimationFrame(frame);
  }
  const kick = () => { if (!raf && visible) raf = requestAnimationFrame(frame); };

  // ---------- stav načítania ----------
  function fail() {
    stateT.textContent = 'Toto miesto sa nepodarilo načítať. Skontrolujte pripojenie.';
    retryBtn.hidden = false; state.hidden = false;
    guide.hidden = true;   // návod nesmie zakryť chybu a tlačidlo
    showFlat(true);
  }
  retryBtn.addEventListener('click', () => { retryBtn.hidden = true; state.hidden = true; ensure(cur); });
  function ensure(i) {
    const e = load(i);
    if (e && i === cur && !e.tex) {
      stateT.textContent = isPano(stops[i]) ? 'Načítavam panorámu…' : 'Načítavam…';
      retryBtn.hidden = true;
      clearTimeout(ensure.t); ensure.t = setTimeout(() => { if (!entry(cur) && !retryBtn.offsetParent) state.hidden = false; }, 400);
      e.ready.then(() => { if (i === cur) state.hidden = true; kick(); }).catch(() => {});
    }
    return e;
  }

  // obyčajný obrázok: základ pred načítaním WebGL a záloha bez neho
  function showFlat(full) {
    const s = stops[cur];
    stage.classList.toggle('pano', isPano(s));
    img.src = isPano(s) ? `media/${s.img}-${gl && !full ? '240.webp' : '1280.jpg'}` : photoUrl(s, 'jpg');
    stage.classList.toggle('flat-full', !!full);
    img.alt = s.alt;
    img.style.objectPosition = isPano(s) ? `${s.x0 ?? 50}% 50%` : `${s.fx}% ${s.fy}%`;
    if (isPano(s) && !gl) {
      const center = () => { flat.scrollLeft = (flat.scrollWidth - flat.clientWidth) * (s.x0 ?? 50) / 100; };
      img.complete ? center() : img.addEventListener('load', center, { once: true });
    }
  }

  // ---------- popis miesta ----------
  function describe() {
    const s = stops[cur], zi = zones.findIndex(z => z.id === s.zone), zl = byZone[s.zone];
    capZone.textContent = `${String(zi + 1).padStart(2, '0')} / ${String(zones.length).padStart(2, '0')} · ${zoneName[s.zone]}`;
    capTitle.textContent = s.title;
    capBadge.textContent = isPano(s) ? `Panoráma ${s.hfov}°` : 'Fotka';
    capBadge.className = 'tv-badge' + (isPano(s) ? ' is-pano' : '');
    capN.textContent = `Miesto ${zl.indexOf(cur) + 1} z ${zl.length}${s.src === 'gymklub.sk' ? ' · fotka z gymklub.sk' : ''}`;
    info.textContent = s.alt;
    live.textContent = `${zoneName[s.zone]}: ${s.title}. ${isPano(s) ? 'Panoráma, ' + s.hfov + ' stupňov.' : 'Fotka.'}`;
    routeBtns.forEach(b => { const on = b.dataset.zone === s.zone; b.classList.toggle('on', on); b.setAttribute('aria-current', on ? 'step' : 'false'); });
    list.querySelectorAll('[data-stop]').forEach(b => { const on = b.dataset.stop === s.id; b.classList.toggle('on', on); b.setAttribute('aria-current', on ? 'location' : 'false'); });
    const next = stops[cur + 1];
    goLbl.textContent = next ? (next.zone === s.zone ? `Ďalej: ${next.title}` : `Ďalej: ${zoneName[next.zone]}`) : 'Naplánovať návštevu';
    goBtn.classList.toggle('last', !next);
    btn('prev').disabled = cur === 0; btn('next').disabled = cur === stops.length - 1;
    try { history.replaceState(null, '', '#zaber-' + s.id); } catch (e) { /* napr. v náhľade */ }
    hideCard(); buildPins();
    if (gl) { const e = cache.get(s.id); if (e) sharpen(e); ensure(cur + 1); if (cur > 0) load(cur - 1); }
  }

  // ---------- presun ----------
  function finish() {
    const a = anim; anim = null;
    cur = a.to; pan = { x: 0, y: 0 }; pz = tpz = 1;
    if (isPano(stops[cur])) { Object.assign(cam, a.cam, { tYaw: a.cam.yaw, tPitch: a.cam.pitch, tFov: a.cam.fov, vy: 0 }); idleT0 = performance.now(); }
    describe(); showFlat();
    stage.classList.remove('moving');
    kick();
  }
  async function go(i, via) {
    if (i < 0 || i >= stops.length || anim) return;
    if (i === cur) { if (isPano(stops[i])) { startCam(stops[i]); kick(); } return; }
    touched = true;
    const to = stops[i];
    const nc = { yaw: 0, pitch: 0, fov: 1 };
    if (isPano(to)) { nc.fov = defaultFov(to); nc.yaw = pinDir(to, to.x0 ?? 50, 50).yaw; clampCam(to, nc); }
    if (gl && entry(cur)) {
      const e = ensure(i); stage.classList.add('moving');
      try { await e.ready; } catch (err) { stage.classList.remove('moving'); cur = i; describe(); showFlat(); fail(); return; }
      if (anim) return;
      anim = { t0: performance.now(), dur: via && !reduce ? 1150 : reduce ? 260 : 480, to: i, via, cam: nc };
      kick();
    } else {
      cur = i; pan = { x: 0, y: 0 }; pz = tpz = 1;
      if (isPano(to)) Object.assign(cam, nc, { tYaw: nc.yaw, tPitch: 0, tFov: nc.fov, vy: 0 });
      describe(); showFlat();
      if (gl) ensure(i);
      kick();
    }
  }
  const next = () => stops[cur + 1] ? go(cur + 1, stops[cur].walk) : (location.href = 'kontakt.html#navsteva');

  // ---------- priblíženie ----------
  function zoom(f) {
    touched = true;
    const s = stops[cur];
    if (isPano(s)) { cam.tFov *= f; } else { tpz = clamp(tpz / f, 1, 2.4); }
    kick();
  }

  // ---------- celá obrazovka ----------
  const fsEl = () => document.fullscreenElement || document.webkitFullscreenElement;
  function toggleFs() {
    const on = stage.classList.contains('tv-max') || fsEl() === stage;
    if (on) {
      if (fsEl()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      setMax(false);
    } else if (stage.requestFullscreen || stage.webkitRequestFullscreen) {
      const r = (stage.requestFullscreen || stage.webkitRequestFullscreen).call(stage);
      if (r && r.catch) r.catch(() => setMax(true));
    } else setMax(true);   // iPhone: náhradná celá obrazovka
  }
  function setMax(on) {
    stage.classList.toggle('tv-max', on); document.documentElement.classList.toggle('tv-lock', on);
    btn('fs').setAttribute('aria-pressed', String(on || fsEl() === stage));
    btn('fs').setAttribute('aria-label', on || fsEl() === stage ? 'Zavrieť celú obrazovku' : 'Celá obrazovka');
    requestAnimationFrame(() => { size(); kick(); });
  }
  ['fullscreenchange', 'webkitfullscreenchange'].forEach(n => document.addEventListener(n, () => {
    const on = fsEl() === stage; stage.classList.toggle('tv-fs', on);
    btn('fs').setAttribute('aria-pressed', String(on)); btn('fs').setAttribute('aria-label', on ? 'Zavrieť celú obrazovku' : 'Celá obrazovka');
    setTimeout(() => { size(); kick(); }, 60);
  }));

  // ---------- gyroskop: len na požiadanie a po súhlase ----------
  const gyro = { on: false, a0: 0, b0: 0, y0: 0, p0: 0, first: true };
  const hasGyro = coarse && 'DeviceOrientationEvent' in window;
  btn('gyro').hidden = !hasGyro;
  function onOrient(ev) {
    if (ev.alpha == null) return;
    const s = stops[cur];
    if (gyro.first) { gyro.a0 = ev.alpha; gyro.b0 = ev.beta; gyro.y0 = cam.yaw; gyro.p0 = cam.pitch; gyro.first = false; }
    let da = ev.alpha - gyro.a0; if (da > 180) da -= 360; if (da < -180) da += 360;
    if (isPano(s)) { cam.tYaw = gyro.y0 - rad(da); cam.tPitch = gyro.p0 + rad(ev.beta - gyro.b0); }
    else { lookT = { x: clamp(-da / 20, -1, 1), y: clamp(-(ev.beta - gyro.b0) / 20, -1, 1) }; }
    touched = true; kick();
  }
  async function toggleGyro() {
    const b = btn('gyro');
    if (gyro.on) { gyro.on = false; removeEventListener('deviceorientation', onOrient); b.setAttribute('aria-pressed', 'false'); lookT = null; return; }
    try {
      if (typeof DeviceOrientationEvent.requestPermission === 'function' && await DeviceOrientationEvent.requestPermission() !== 'granted') {
        stateT.textContent = 'Pohyb telefónom nie je povolený. Rozhliadať sa môžete ťahaním prstom.'; state.hidden = false; setTimeout(() => { state.hidden = true; }, 3500); return;
      }
    } catch (e) { return; }
    gyro.on = true; gyro.first = true; addEventListener('deviceorientation', onOrient);
    b.setAttribute('aria-pressed', 'true'); kick();
  }

  // ---------- zoznam priestorov a návod ----------
  function openList(on) {
    list.hidden = !on; openBtn.setAttribute('aria-expanded', String(on));
    if (on) (list.querySelector('.on') || list.querySelector('[data-stop]')).focus();
    else openBtn.focus();
  }
  const GK = 'gk-prehliadka-navod';
  function dismissGuide() { if (!guide.hidden) { guide.hidden = true; store.set(GK, '1'); } }

  // ---------- ovládanie ----------
  goBtn.addEventListener('click', () => { dismissGuide(); next(); });
  btn('next').addEventListener('click', () => { dismissGuide(); next(); });
  btn('prev').addEventListener('click', () => go(cur - 1, null));
  btn('zin').addEventListener('click', () => zoom(.8));
  btn('zout').addEventListener('click', () => zoom(1.25));
  btn('home').addEventListener('click', () => { hideCard(); if (cur === 0) { startCam(stops[0]); kick(); } else go(0, null); });
  btn('fs').addEventListener('click', toggleFs);
  btn('gyro').addEventListener('click', toggleGyro);
  openBtn.addEventListener('click', () => openList(list.hidden));
  $('.tv-list-x').addEventListener('click', () => openList(false));
  list.addEventListener('click', e => { if (e.target === list) openList(false); });
  list.querySelectorAll('[data-stop]').forEach(b => b.addEventListener('click', () => {
    const i = stops.findIndex(s => s.id === b.dataset.stop); openList(false); dismissGuide(); go(i, null);
  }));
  $('.tv-card-x').addEventListener('click', hideCard);
  $('.tv-guide-ok').addEventListener('click', () => { dismissGuide(); stage.focus(); });
  routeBtns.forEach(b => b.addEventListener('click', () => go(byZone[b.dataset.zone][0], null)));
  document.querySelectorAll('[data-tour-stop]').forEach(a => a.addEventListener('click', ev => {
    const i = stops.findIndex(s => s.id === a.dataset.tourStop);
    if (i < 0) return;
    ev.preventDefault();
    root.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    setTimeout(() => go(i, null), reduce ? 0 : 450);
  }));
  stage.addEventListener('keydown', e => {
    if (e.target.closest('.tv-list') && e.key !== 'Escape') return;
    const s = stops[cur], k = e.key;
    const lookBy = (dx, dy) => {
      touched = true;
      if (isPano(s) && !gl) flat.scrollBy({ left: dx * flat.clientWidth * .25, behavior: reduce ? 'auto' : 'smooth' });
      else if (isPano(s)) { cam.tYaw += rad(dx * 6); cam.tPitch += rad(dy * 5); }
      else { pan.x = clamp(pan.x + dx * .15, -1, 1); pan.y = clamp(pan.y - dy * .15, -1, 1); }
      kick();
    };
    if (k === 'ArrowRight') lookBy(1, 0); else if (k === 'ArrowLeft') lookBy(-1, 0);
    else if (k === 'ArrowUp') lookBy(0, 1); else if (k === 'ArrowDown') lookBy(0, -1);
    else if (k === '+' || k === '=') zoom(.8); else if (k === '-' || k === '_') zoom(1.25);
    else if (k === 'n' || k === 'N' || k === 'PageDown') next();
    else if (k === 'p' || k === 'P' || k === 'PageUp') go(cur - 1, null);
    else if (k === '0' || k === 'Home') btn('home').click();
    else if (k === 'f' || k === 'F') toggleFs();
    else if (k === 'Escape') { if (!list.hidden) openList(false); else if (!card.hidden) hideCard(); else if (!guide.hidden) dismissGuide(); else if (stage.classList.contains('tv-max')) setMax(false); else return; }
    else return;
    e.preventDefault(); dismissGuide();
  });

  // ťah myšou aj prstom; dvoma prstami priblíženie. Zvislý ťah prstom mimo celej obrazovky
  // ostáva skrolovaniu stránky (touch-action: pan-y).
  let drag = null; const ptrs = new Map();
  stage.addEventListener('pointerdown', e => {
    if (e.target.closest('button, a, .tv-list, .tv-card, .tv-guide')) return;
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; drag = { pinch: Math.hypot(a.x - b.x, a.y - b.y), fov: cam.tFov, pz: tpz }; return; }
    drag = { x: e.clientX, y: e.clientY, lx: e.clientX, lt: performance.now(), yaw: cam.tYaw, pitch: cam.tPitch, px: pan.x, py: pan.y, sl: flat.scrollLeft, moved: false };
    cam.vy = 0; touched = true; dismissGuide();
  });
  stage.addEventListener('pointermove', e => {
    const r = stage.getBoundingClientRect();
    if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const s = stops[cur];
    if (drag && drag.pinch && ptrs.size === 2) {
      const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y) / drag.pinch;
      if (isPano(s)) cam.tFov = drag.fov / d; else tpz = clamp(drag.pz * d, 1, 2.4);
      kick(); return;
    }
    if (drag && !drag.pinch) {
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
      if (isPano(s) && !gl) {
        if (e.pointerType === 'mouse') flat.scrollLeft = drag.sl - dx;   // prst posúva obrázok natívne
      } else if (isPano(s)) {
        const perPx = cam.fov / H;          // rovnaká rýchlosť ako obraz pod prstom
        cam.tYaw = drag.yaw - dx * perPx;
        if (e.pointerType === 'mouse' || stage.classList.contains('tv-max') || fsEl()) cam.tPitch = drag.pitch + dy * perPx;
        const now = performance.now(), ddt = Math.max(now - drag.lt, 1);
        drag.v = -(e.clientX - drag.lx) * perPx / ddt * 1000; drag.lx = e.clientX; drag.lt = now;
        cam.yaw = cam.tYaw; cam.pitch = cam.tPitch;
      } else {
        pan.x = clamp(drag.px - dx / r.width * 1.6, -1, 1);
        pan.y = clamp(drag.py - dy / r.height * 1.6, -1, 1);
        lookT = { x: clamp(-dx / r.width * 3, -1, 1), y: 0 };
      }
      kick();
    } else if (e.pointerType === 'mouse' && !isPano(s)) {
      lookT = { x: ((e.clientX - r.left) / r.width) * 2 - 1, y: ((e.clientY - r.top) / r.height) * 2 - 1 }; kick();
    }
  }, { passive: true });
  const end = e => {
    ptrs.delete(e.pointerId);
    if (drag && !drag.pinch && isPano(stops[cur]) && !reduce && drag.v && performance.now() - drag.lt < 80) cam.vy = clamp(drag.v, -3, 3);
    if (ptrs.size === 0) drag = null;
    if (e.type !== 'pointermove') lookT = gyro.on ? lookT : null;
    kick();
  };
  ['pointerup', 'pointercancel'].forEach(n => stage.addEventListener(n, end, { passive: true }));
  stage.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') { end(e); } }, { passive: true });
  // samovoľné pomalé rozhliadnutie sa zastaví, len čo je myš nad scénou alebo je v nej fokus
  stage.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') touched = true; });
  stage.addEventListener('focusin', () => { touched = true; });
  // koliesko myši len so stlačeným Ctrl (aj gesto na touchpade) alebo na celej obrazovke, aby nebrzdilo skrolovanie
  stage.addEventListener('wheel', e => {
    if (!(e.ctrlKey || fsEl() || stage.classList.contains('tv-max'))) return;
    e.preventDefault(); zoom(e.deltaY > 0 ? 1.08 : 1 / 1.08);
  }, { passive: false });

  // kreslí sa len v obraze
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); }).observe(stage);
  document.addEventListener('visibilitychange', kick);
  new ResizeObserver(() => { size(); kick(); }).observe(stage);

  // ---------- štart ----------
  size();
  if (isPano(stops[cur])) startCam(stops[cur]);
  const glOn = initGL();
  showFlat();
  root.classList.toggle('tv-3d', glOn);
  describe();
  if (glOn) ensure(cur);
  if (!store.get(GK)) guide.hidden = false;
  kick();
}
