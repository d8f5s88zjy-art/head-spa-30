/* HEAD SPA 30: prehliadka salónu ako film.
   Pozadie webu sú skutočné fotky salónu, nie vymodelovaná scéna. Každá fotka má hĺbkovú mapu,
   takže kamera sa v nej pohne ako v skutočnej miestnosti: bližšie veci sa posúvajú viac ako
   stena za nimi. Pri skrolovaní ide kamera pomalým filmovým pohybom a medzi časťami webu sa
   zábery prelínajú, kým ich zakrýva textová doska. Farby fotiek sa nemenia.
   Scéna je iba pozadie: text, formuláre a tlačidlá ostávajú v HTML nad ňou. Keď 3D nejde
   (bez WebGL, obmedzenie pohybu, šetrenie dát), web ostáva s pokojným úvodom a nič sa nenačíta. */
(async function () {
  'use strict';
  const d = document, root = d.documentElement;
  // či sa 3D použije, rozhodol už skript v hlavičke (trieda .world), aby obsah pri štarte neskočil
  if (!root.classList.contains('world')) return;

  const here = d.currentScript ? d.currentScript.src : location.href;
  if (d.readyState !== 'complete') await new Promise((r) => addEventListener('load', r, { once: true }));
  // film sa spustí až keď sa návštevník pohne (dotyk, myš, skrolovanie, klávesnica); dovtedy je
  // v úvode fotka miestnosti, takže otvorenie stránky nič nebrzdí a kto len nazrie, nič nesťahuje
  const INPUTS = ['pointerdown', 'pointermove', 'touchstart', 'wheel', 'scroll', 'keydown'];
  await new Promise((r) => {
    const go = () => { INPUTS.forEach((e) => removeEventListener(e, go)); r(); };
    INPUTS.forEach((e) => addEventListener(e, go, { passive: true }));
  });
  // od prvého pohybu sa vykreslia všetky sekcie (CSS world-full), aby skok cez menu pristál presne
  root.classList.add('world-full');
  const quit = () => { root.classList.remove('world', 'world-full'); };
  const src = window.HS30_THREE || new URL('vendor/three.module.min.js', here).href;
  let THREE;
  try { THREE = await import(src); } catch (e) { quit(); return; }

  const phone = matchMedia('(max-width: 720px)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  /* ---------- zábery: fotka, kam sa pozerá kamera a ako sa pohne ----------
     f  = bod záujmu na fotke (0 až 1, zľava a zhora), fm = to isté pre telefón
     mv = pohyb kamery počas záberu: [x, y, z] na začiatku a na konci, v podieloch obrazu
          (x a y ako časť šírky a výšky záberu, z ako časť vzdialenosti; mínus z = nájazd) */
  const MOVES = {
    in: [[0, 0, 0.03], [0, 0, -0.11]],
    right: [[-0.03, 0.004, 0], [0.03, -0.004, -0.05]],
    left: [[0.03, 0, -0.02], [-0.03, 0.004, -0.06]],
    rise: [[0, -0.022, 0], [0.008, 0.022, -0.06]],
    down: [[-0.006, 0.022, -0.01], [0.006, -0.02, -0.07]],
  };
  const SHOTS = [
    { at: null, photo: 'miestnost', f: [0.5, 0.4], fm: [0.5, 0.5], mv: 'in' },
    { at: '#ritual', photo: 'voda', f: [0.5, 0.55], mv: 'right' },
    { at: '#cennik', photo: 'zhora', f: [0.5, 0.5], mv: 'down' },
  ];
  // pri každej kategórii cenníka jej priestor; fotku kategórie určuje stránka.
  // Bod záujmu je tam, kam mieri výrez fotky na stránke (object-position), napr. neón Spa relax hore.
  const FOCUS = { 'spa-relax-lozko': [0.5, 0.3] };
  d.querySelectorAll('#cennik .cat[data-cat]').forEach((cat, k) => {
    const img = cat.querySelector('img[data-photo]');
    if (!img) return;
    const oy = parseFloat((img.style.objectPosition || '50% 62%').split(' ')[1]) / 100;
    SHOTS.push({ at: cat, mid: true, oy, photo: img.dataset.photo, f: FOCUS[img.dataset.photo] || [0.5, 0.62], mv: ['left', 'in', 'right', 'rise', 'left'][k % 5] });
  });
  SHOTS.push(
    { at: '#rezervacia', photo: 'lozko', f: [0.5, 0.6], mv: 'rise' },
    { at: '#poukaz', photo: 'buddha', f: [0.58, 0.3], mv: 'in' },
    { at: '#salon', photo: 'okna', f: [0.5, 0.5], mv: 'right' },
    { at: '#galeria', photo: 'neon-spa', f: [0.5, 0.42], mv: 'left' },
    { at: '#faq', photo: 'komoda', f: [0.5, 0.55], mv: 'down' },
    { at: '#kontakt', photo: 'neon-head-spa', f: [0.5, 0.3], mv: 'in' },
  );
  const N = SHOTS.length - 1;

  /* ---------- renderer ---------- */
  const canvas = d.createElement('canvas');
  canvas.className = 'world-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  d.body.prepend(canvas);
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' }); }
  catch (e) { canvas.remove(); quit(); return; }
  // farby fotiek idú na obrazovku bez prepočtov, presne ako na fotke
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.autoClear = false;
  renderer.setClearColor(0x0d0a07, 1);
  // ostrosť: plné rozlíšenie displeja do 2x; pomalé zariadenie si ho samo zníži
  let dpr = Math.min(devicePixelRatio || 1, 2);

  const FOV = phone ? 50 : 38, DIST = 10;
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
  const scene = new THREE.Scene();

  /* ---------- záber = fotka na mriežke, ktorú hĺbková mapa vytlačí k oku ---------- */
  const SEG = phone ? [120, 160] : [192, 256];
  const grid = new THREE.PlaneGeometry(1, 1, SEG[0], SEG[1]);
  const VERT = `
    uniform sampler2D uDepth; uniform float uAmt; uniform vec3 uEye;
    varying vec2 vUv;
    void main() {
      vUv = vec2(uv.x, 1.0 - uv.y);
      float z = texture2D(uDepth, vUv).r;
      vec4 w = modelMatrix * vec4(position, 1.0);
      // bod sa posunie po priamke k oku: z pokojného miesta kamery je obraz presne fotka,
      // pri pohybe kamery sa bližšie veci posúvajú viac ako stena za nimi
      w.xyz = uEye + (w.xyz - uEye) * (1.0 - uAmt * z);
      gl_Position = projectionMatrix * viewMatrix * w;
    }`;
  const FRAG = `
    uniform sampler2D uMap; varying vec2 vUv;
    void main() { gl_FragColor = vec4(texture2D(uMap, vUv).rgb, 1.0); }`;
  const px = (r, g, b) => { const t = new THREE.DataTexture(new Uint8Array([r, g, b, 255]), 1, 1); t.needsUpdate = true; return t; };
  const blank = px(13, 10, 7), flat = px(0, 0, 0);

  SHOTS.forEach((s, i) => {
    s.i = i;
    s.mat = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG,
      uniforms: { uMap: { value: blank }, uDepth: { value: flat }, uAmt: { value: 0.42 }, uEye: { value: new THREE.Vector3() } },
    });
    s.mesh = new THREE.Mesh(grid, s.mat);
    s.mesh.visible = false; s.mesh.frustumCulled = false;
    scene.add(s.mesh);
    s.eye = new THREE.Vector3();
    s.ready = false; s.loading = null;
  });

  /* ---------- načítanie fotiek: vždy len zábery okolo aktuálneho, ostatné sa uvoľnia ---------- */
  const FILM = window.HS30_FILM || null;                       // náhľad: fotky vložené priamo
  const SIZES = (window.HS30_FILM_SIZES || [1086, 1448, 2172]).slice().sort((a, b) => a - b);
  const base = new URL('img/film/', here).href;
  const fileUrl = (f) => (FILM && FILM[f]) || base + f;
  let maxTex = 4096;
  function pickSize(s) {
    // najmenšia fotka, ktorá na obrazovke nebude zväčšená (ostrosť ako na fotke)
    const fit = SIZES.filter((w) => w <= maxTex);
    const need = s.pw / s.vw * canvas.width;
    return fit.find((w) => w >= need * 0.95) || fit[fit.length - 1];
  }
  async function bitmap(url) {
    let blob;
    if (url.startsWith('data:')) {
      // vložená fotka (náhľad): rozbalí sa priamo, bez sieťovej požiadavky
      const bin = atob(url.slice(url.indexOf(',') + 1)), u8 = new Uint8Array(bin.length);
      for (let k = 0; k < bin.length; k++) u8[k] = bin.charCodeAt(k);
      blob = new Blob([u8], { type: 'image/webp' });
    } else {
      const r = await fetch(url); if (!r.ok) throw new Error(url);
      blob = await r.blob();
    }
    // bez volieb (Safari ich nepozná); prvý riadok obrázka je hore, shader to otočí sám
    return createImageBitmap(blob);
  }
  function tex(bmp) {
    const t = new THREE.Texture(bmp);
    t.flipY = false; t.generateMipmaps = false;
    t.minFilter = t.magFilter = THREE.LinearFilter;
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    t.colorSpace = THREE.NoColorSpace;
    t.needsUpdate = true;
    return t;
  }
  function load(s) {
    if (s.ready || s.loading) return s.loading;
    s.loading = Promise.all([bitmap(fileUrl(`${s.photo}-${pickSize(s)}.webp`)), bitmap(fileUrl(`${s.photo}-hlbka.webp`))])
      .then(([img, dep]) => {
        s.loading = null;
        if (s.dropped) { s.dropped = false; img.close(); dep.close(); return; }
        const u = s.mat.uniforms;
        u.uMap.value = tex(img); u.uDepth.value = tex(dep);
        renderer.initTexture(u.uMap.value); renderer.initTexture(u.uDepth.value);
        s.ready = true; s.t0 = performance.now(); wake();
      })
      .catch(() => { s.loading = null; s.failed = true; });
    return s.loading;
  }
  function drop(s) {
    if (s.loading) { s.dropped = true; return; }
    s.dropped = false;
    if (!s.ready) return;
    const u = s.mat.uniforms;
    for (const t of [u.uMap.value, u.uDepth.value]) { if (t.image && t.image.close) t.image.close(); t.dispose(); }
    u.uMap.value = blank; u.uDepth.value = flat; s.ready = false;
  }
  function keepAround(i) {
    SHOTS.forEach((s) => {
      if (Math.abs(s.i - i) <= 2) { s.dropped = false; if (!s.failed) load(s); }
      else drop(s);
    });
  }

  /* ---------- rozloženie záberu podľa obrazovky ---------- */
  const tanH = Math.tan(THREE.MathUtils.degToRad(FOV) / 2);
  const OVER = 0.08;                                          // presah fotky za okraj, aby pohyb nikdy neodhalil hranu
  function layout() {
    const aspect = canvas.width / canvas.height;
    const vh = 2 * DIST * tanH, vw = vh * aspect, pa = 0.75;   // fotky salónu sú na výšku 3 : 4
    SHOTS.forEach((s) => {
      let pw = vw * (1 + 2 * OVER), ph = pw / pa;
      if (ph < vh * (1 + 2 * OVER)) { ph = vh * (1 + 2 * OVER); pw = ph * pa; }
      s.mesh.scale.set(pw, ph, 1);
      s.pw = pw; s.ph = ph; s.vw = vw; s.vh = vh;
      const f = (phone && s.fm) || s.f;
      const mx = (pw - vw) / 2 - vw * OVER * 0.5, my = (ph - vh) / 2 - vh * OVER * 0.5;
      s.eye.set(clamp((f[0] - 0.5) * pw, -mx, mx), clamp((0.5 - f[1]) * ph, -my, my), DIST);
      s.mat.uniforms.uEye.value.copy(s.eye);
    });
  }

  /* ---------- skladanie: dva zábery do textúr, prelínanie a vinetácia ---------- */
  const rtA = new THREE.WebGLRenderTarget(1, 1), rtB = new THREE.WebGLRenderTarget(1, 1);
  const post = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    depthTest: false, depthWrite: false,
    uniforms: { tA: { value: rtA.texture }, tB: { value: rtB.texture }, uMix: { value: 0 }, uAspect: { value: 1 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `
      uniform sampler2D tA, tB; uniform float uMix, uAspect; varying vec2 vUv;
      void main() {
        vec3 c = texture2D(tA, vUv).rgb;
        if (uMix > 0.0) {
          c = mix(c, texture2D(tB, vUv).rgb, uMix);
          c *= 1.0 - 0.22 * sin(3.14159 * uMix);   // prechod cez jemné šero ako vo filme
        }
        // jemná vinetácia ako pri filmovom objektíve, stred ostáva nedotknutý
        vec2 q = (vUv - 0.5) * vec2(uAspect, 1.0) / max(uAspect, 1.0);
        c *= 1.0 - smoothstep(0.32, 0.9, length(q)) * 0.34;
        gl_FragColor = vec4(c, 1.0);
      }`,
  }));
  post.frustumCulled = false;
  const postScene = new THREE.Scene(); postScene.add(post);
  const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  /* ---------- skrolovanie -> poloha vo filme ---------- */
  let anchors = [];
  function measure() {
    const vh = innerHeight;
    // pri sekcii je záber celý, keď je medzera pred jej doskou uprostred obrazovky;
    // pri okne kategórie, keď je okno v strede
    anchors = SHOTS.map((s) => {
      if (!s.at) return 0;
      const el = typeof s.at === 'string' ? d.querySelector(s.at) : s.at;
      if (!el || !el.offsetParent) return null;
      const r = el.getBoundingClientRect();
      if (!s.mid) return r.top + scrollY - vh * 0.45;
      // telefón: záber je vysoký takmer ako obrazovka, bod záujmu fotky sa nedá posunúť kamerou,
      // preto kamera zastane, keď je v okne tá časť fotky, na ktorú mieri výrez (napr. neón hore)
      const fy = phone && s.oy != null ? clamp(s.oy * (1 + 2 * OVER) - 0.12, 0.2, 0.5) : 0.5;
      return r.top + scrollY + r.height / 2 - vh * fy;
    });
    // skrytá kategória (filter v cenníku) dostane miesto hneď za predchádzajúcou
    for (let k = 1; k < anchors.length; k++) anchors[k] = Math.max(anchors[k] == null ? 0 : anchors[k], anchors[k - 1] + 1);
  }
  function targetS() {
    const y = scrollY;
    if (y <= anchors[0]) return 0;
    for (let k = 1; k < anchors.length; k++) if (y < anchors[k]) return k - 1 + (y - anchors[k - 1]) / (anchors[k] - anchors[k - 1]);
    return N;
  }

  /* ---------- kamera: tlmená pružina, jemné dýchanie ako zo steadicamu ---------- */
  let S = 0, V = 0, mx = 0, my = 0, pmx = 0, pmy = 0, breath = 1;
  let raf = 0, last = 0, running = true, lastInput = performance.now();
  const BREATH_MS = 25000;                                    // po chvíli bez pohybu sa obraz upokojí a prestane kresliť
  const tmp = new THREE.Vector3(), off = new THREE.Vector3();
  function place(s, now) {
    // pohyb záberu trvá celý čas, keď je záber vidieť (od prelínania dnu po prelínanie von)
    const t = s.i === 0 ? clamp(S / 0.66, 0, 1) : clamp((S - s.i + 0.66) / 1.32, 0, 1);
    const m = MOVES[s.mv], e = t * t * (3 - 2 * t) * 0.6 + t * 0.4;
    off.set(
      (m[0][0] + (m[1][0] - m[0][0]) * e) * s.vw,
      (m[0][1] + (m[1][1] - m[0][1]) * e) * s.vh,
      (m[0][2] + (m[1][2] - m[0][2]) * e) * DIST,
    );
    const sec = now / 1000;
    off.x += (Math.sin(sec * 0.37) * 0.004 * breath + pmx * 0.018) * s.vw;
    off.y += (Math.sin(sec * 0.29 + 1.3) * 0.003 * breath + pmy * 0.012) * s.vh;
    off.z += Math.sin(sec * 0.21 + 0.4) * 0.008 * DIST * breath;
    camera.position.copy(s.eye).add(off);
    tmp.set(s.eye.x + off.x * 0.35, s.eye.y + off.y * 0.35, 0);
    camera.lookAt(tmp);
  }
  function nearestReady() {
    let best = null;
    for (const s of SHOTS) if (s.ready && (!best || Math.abs(s.i - S) < Math.abs(best.i - S))) best = s;
    return best;
  }
  // prelínanie: v pohybe sleduje skrolovanie, v pokoji sa dokončí na bližší záber (nikdy neostane napoly)
  let fade = 0, fadeK = -1, fadeGoal = 0, sub = null;
  const fin = (s, now) => (s.t0 ? Math.min(1, (now - s.t0) / 450) : 1);
  function draw(now, dt) {
    keepAround(clamp(Math.round(S), 0, N));
    const k = clamp(Math.floor(S), 0, N);
    let A = SHOTS[k], B = SHOTS[clamp(k + 1, 0, N)];
    const want = A === B ? 0 : smooth(0.42, 0.58, S - k);
    if (k !== fadeK) { fade = want; fadeK = k; }
    fadeGoal = Math.abs(V) < 0.03 ? Math.round(want) : want;
    fade += (fadeGoal - fade) * (1 - Math.pow(0.02, dt || 0));
    let mix = A === B || !B.ready ? 0 : fade * fin(B, now);
    if (!A.ready) {
      // aktuálny záber sa ešte načítava: dovtedy najbližší hotový, potom sa doň prelnie
      const R = B.ready ? B : nearestReady();
      if (!R) return false;
      A = R; B = R; mix = 0; sub = R;
    } else if (sub && sub !== A && sub.ready && fin(A, now) < 1) { B = A; A = sub; mix = fin(B, now); }
    else sub = null;
    renderer.setRenderTarget(rtA); renderer.clear();
    A.mesh.visible = true; place(A, now); renderer.render(scene, camera); A.mesh.visible = false;
    if (mix > 0.001) {
      renderer.setRenderTarget(rtB); renderer.clear();
      B.mesh.visible = true; place(B, now); renderer.render(scene, camera); B.mesh.visible = false;
    }
    post.material.uniforms.uMix.value = mix > 0.001 ? mix : 0;
    renderer.setRenderTarget(null); renderer.clear();
    renderer.render(postScene, postCam);
    // ešte beží prelínanie alebo nábeh novej fotky: kresliť ďalej
    return Math.abs(fadeGoal - fade) > 0.002 || (B.ready && fin(B, now) < 1) || (A.ready && fin(A, now) < 1);
  }

  /* ---------- adaptívna kvalita: keď zariadenie nestíha, zníži sa rozlíšenie ---------- */
  const ft = [];
  function quality(dt) {
    ft.push(dt); if (ft.length < 40) return;
    const avg = ft.reduce((a, b) => a + b, 0) / ft.length; ft.length = 0;
    if (avg > 0.028 && dpr > 1) { dpr = Math.max(1, dpr - 0.5); resize(); }
  }

  let cw = 0, ch = 0, cd = 0;
  function resize() {
    // plátno má výšku veľkého výrezu (100lvh), takže lišta prehliadača na mobile ho pri skrolovaní nemení
    const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
    if (w === cw && h === ch && dpr === cd) { measure(); wake(); return; }
    cw = w; ch = h; cd = dpr;
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    rtA.setSize(canvas.width, canvas.height); rtB.setSize(canvas.width, canvas.height);
    post.material.uniforms.uAspect.value = w / h;
    layout(); measure(); wake();
  }
  function frame(now) {
    raf = 0;
    if (!running) return;
    const dt = Math.min(0.1, (now - (last || now)) / 1000); last = now;
    const T = targetS();
    // kriticky tlmená pružina: plynulé rozbehnutie aj dobehnutie, žiadne trhnutie pri rýchlom skrole
    const w0 = 5.2;
    V += ((T - S) * w0 * w0 - 2 * w0 * V) * dt; S += V * dt;
    // skok cez menu alebo tlačidlo: žiadna dlhá jazda cez celý salón, len krátke prelínanie na cieľ
    if (Math.abs(T - S) > 1.5) { S = T - Math.sign(T - S) * 0.45; V = 0; }
    pmx += (mx - pmx) * (1 - Math.pow(0.02, dt)); pmy += (my - pmy) * (1 - Math.pow(0.02, dt));
    const idle = now - lastInput;
    breath = idle < BREATH_MS ? 1 : Math.max(0, 1 - (idle - BREATH_MS) / 3000);
    const busy = draw(now, dt);
    const moving = busy || Math.abs(T - S) > 0.0004 || Math.abs(V) > 0.0004 || Math.abs(mx - pmx) > 0.0008 || Math.abs(my - pmy) > 0.0008;
    if (moving) { quality(dt); raf = requestAnimationFrame(frame); }
    else if (breath > 0) setTimeout(() => { if (!raf && running) raf = requestAnimationFrame(frame); }, 1000 / 30 - 4);   // v pokoji 30 snímok za sekundu
  }
  function wake() { if (!raf && running) raf = requestAnimationFrame(frame); }
  const poke = () => { lastInput = performance.now(); wake(); };

  addEventListener('scroll', poke, { passive: true });
  addEventListener('resize', resize, { passive: true });
  addEventListener('touchstart', poke, { passive: true });
  if (!phone) addEventListener('pointermove', (e) => { mx = e.clientX / innerWidth - 0.5; my = -(e.clientY / innerHeight - 0.5); poke(); }, { passive: true });
  // telefón: pri naklonení sa perspektíva jemne pohne ako pri pohľade do skutočnej miestnosti.
  // iPhone by na to potreboval povolenie, preto sa tam nepýtame a obraz ostáva len so skrolovaním.
  if (phone && 'DeviceOrientationEvent' in window && typeof DeviceOrientationEvent.requestPermission !== 'function') {
    let b0 = null, g0 = null;
    addEventListener('deviceorientation', (e) => {
      if (e.beta == null || e.gamma == null || performance.now() - lastInput > BREATH_MS) return;
      if (b0 == null) { b0 = e.beta; g0 = e.gamma; }
      // základ sa pomaly dorovná, aby obraz neostal vychýlený, keď telefón držíš inak
      b0 += (e.beta - b0) * 0.01; g0 += (e.gamma - g0) * 0.01;
      const nx = clamp((e.gamma - g0) / 24, -0.5, 0.5), ny = clamp((e.beta - b0) / 24, -0.5, 0.5);
      if (Math.abs(nx - mx) > 0.006 || Math.abs(ny - my) > 0.006) { mx = nx; my = ny; wake(); }
    }, { passive: true });
  }
  d.addEventListener('visibilitychange', () => { running = !d.hidden; if (running) { last = 0; poke(); } });
  // obsah stránky mení výšku (fotky, rozbalené karty), kotvy sa preto prepočítajú
  let mt; new ResizeObserver(() => { clearTimeout(mt); mt = setTimeout(() => { measure(); wake(); }, 150); }).observe(d.body);

  maxTex = renderer.capabilities.maxTextureSize || 4096;
  resize();
  S = targetS();
  // prvý obraz až keď je načítaný aktuálny záber, potom sa fotka z úvodu prelnie do filmu
  const first = SHOTS[clamp(Math.round(S), 0, N)];
  keepAround(first.i);
  await first.loading;
  if (!first.ready) { canvas.remove(); quit(); return; }
  draw(performance.now(), 0);
  requestAnimationFrame(() => root.classList.add('world-in'));
  wake();
})();
