/* HEAD SPA 30: prehliadka salónu ako film.
   Pozadie webu sú skutočné fotky salónu, nie vymodelovaná scéna. Každá fotka má hĺbkovú mapu,
   takže kamera sa v nej pohne ako v skutočnej miestnosti: bližšie veci sa posúvajú viac ako
   stena za nimi. Pri skrolovaní ide kamera pomalým filmovým pohybom a medzi časťami webu sa
   zábery prelínajú. Fotky sa netónujú, pridá sa len vinetácia a krátke šero pri prelínaní.
   Scéna je iba pozadie: text, formuláre a tlačidlá ostávajú v HTML nad ňou. Keď 3D nejde
   (bez WebGL2, obmedzenie pohybu, šetrenie dát), web ostáva s pokojným úvodom a nič sa nenačíta. */
(async function () {
  'use strict';
  const d = document, root = d.documentElement;
  // či sa 3D použije, rozhodol už skript v hlavičke (trieda .world), aby obsah pri štarte neskočil
  if (!root.classList.contains('world')) return;

  const here = (d.currentScript && d.currentScript.src) || location.href;
  if (d.readyState !== 'complete') await new Promise((r) => addEventListener('load', r, { once: true }));
  // film sa spustí až keď sa návštevník pohne (dotyk, myš, skrolovanie, klávesnica); dovtedy je
  // v úvode fotka miestnosti, takže otvorenie stránky nič nebrzdí a kto len nazrie, nič nesťahuje
  const INPUTS = ['pointerdown', 'pointermove', 'touchstart', 'wheel', 'scroll', 'keydown'];
  await new Promise((r) => {
    const go = () => { INPUTS.forEach((e) => removeEventListener(e, go)); r(); };
    INPUTS.forEach((e) => addEventListener(e, go, { passive: true }));
  });
  // sekcie sú vo filme vyššie ako odhad content-visibility, skok cez menu by pristál vedľa. Preto sa
  // po prvom pohybe postupne vo voľných chvíľach vykreslia všetky (nie naraz, aby dotyk nezamrzol)
  // a pri kliknutí na odkaz v stránke hneď všetky zvyšné.
  const secs = [...d.querySelectorAll('.site>section,.site>footer,.site>.pull,.site>.finale')];
  const open = (all) => { do { const s = secs.shift(); if (s) s.style.contentVisibility = 'visible'; } while (all && secs.length); };
  const step = (dl) => { while (secs.length && dl.timeRemaining() > 6) open(); if (secs.length) requestIdleCallback(step, { timeout: 800 }); };
  if ('requestIdleCallback' in window) requestIdleCallback(step, { timeout: 800 }); else setTimeout(() => open(true), 600);
  d.addEventListener('click', (e) => { if (e.target.closest && e.target.closest('a[href^="#"]')) open(true); }, true);
  const quit = () => { root.classList.remove('world'); };
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
  // jeden jednotný pohyb celého filmu: kamera ide stále pomaly dopredu (nájazd) s jemným
  // bočným posunom, takže celá stránka pôsobí ako jedna súvislá prechádzka salónom
  const FWD = [[0, 0, 0.04], [0, 0, -0.12]];
  const MOVES = {
    in: FWD,
    right: [[-0.008, 0, 0.04], [0.008, 0, -0.12]],
    left: [[0.008, 0, 0.04], [-0.008, 0, -0.12]],
    rise: [[0, -0.006, 0.04], [0, 0.006, -0.12]],
    down: [[0, 0.006, 0.04], [0, -0.006, -0.12]],
  };
  const SHOTS = [
    // úvod: tá istá miestnosť, ktorú vidno cez otvorené dvere (a tá istá fotka ako úvod bez 3D)
    { at: null, photo: 'okna', place: 'Miestnosť pri oknách', f: [0.5, 0.4], fm: [0.5, 0.5], mv: 'in' },
    { at: '#ritual', photo: 'voda', place: 'Vodný oblúk nad misou', f: [0.5, 0.55], mv: 'right' },
    { at: '#cennik', photo: 'zhora', place: 'Lôžka s misami', f: [0.5, 0.5], mv: 'down' },
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
    { at: '#poukaz', photo: 'buddha', place: 'Budha a sviečky', f: [0.58, 0.3], mv: 'in' },
    { at: '#tim', photo: 'lozko', place: 'Pripravené lôžko', f: [0.5, 0.6], mv: 'rise' },
    { at: '#salon', photo: 'miestnost', place: 'Miestnosť pre dvoch', f: [0.5, 0.55], mv: 'right' },
    { at: '#galeria', photo: 'neon-spa', place: 'Nápis Spa relax', f: [0.5, 0.42], mv: 'left' },
    { at: '#faq', photo: 'komoda', place: 'Komoda s uterákmi', f: [0.5, 0.55], mv: 'down' },
    { at: '#kontakt', photo: 'neon-head-spa', place: 'Svietiace logo HEAD SPA', f: [0.5, 0.3], mv: 'in' },
  );
  /* ---------- renderer ---------- */
  const canvas = d.createElement('canvas');
  canvas.className = 'world-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  d.body.prepend(canvas);
  // prehliadka: nenápadný popis miesta vľavo dole, len tam kde film nezakrýva doska
  const placeBox = d.createElement('div');
  placeBox.className = 'world-place'; placeBox.setAttribute('aria-hidden', 'true');
  placeBox.innerHTML = '<b>Prehliadka salónu</b>' + SHOTS.filter((s) => s.place).map((s) => `<span data-p="${s.photo}">${s.place}</span>`).join('');
  canvas.after(placeBox);
  let placeNow = null;
  const showPlace = (s) => {
    const key = s && s.place && s.pi !== 0 ? s.photo : null;   // v úvode nie, tam je text úvodu
    if (key === placeNow) return; placeNow = key;
    placeBox.querySelectorAll('span').forEach((e) => e.classList.toggle('on', e.dataset.p === key));
    placeBox.classList.toggle('on', !!key);
  };
  let renderer;
  // bez prelínania sa záber kreslí rovno na obrazovku, preto aj ona má hĺbku (mriežka sa môže prekryť sama so sebou)
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, depth: true, stencil: false, powerPreference: 'high-performance' }); }
  catch (e) { canvas.remove(); quit(); return; }
  if (!renderer.capabilities.isWebGL2) { renderer.dispose(); canvas.remove(); quit(); return; }
  // farby fotiek idú na obrazovku bez prepočtov, presne ako na fotke
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.autoClear = false;
  renderer.setClearColor(0x0d0a07, 1);
  // shadery sú hotové a overené; kontrola chýb by pri každom preklade čakala na grafiku (stovky ms na telefóne)
  renderer.debug.checkShaderErrors = false;
  // ostrosť: plné rozlíšenie displeja do 2x; pomalé zariadenie si ho samo zníži
  let dpr = Math.min(devicePixelRatio || 1, 2);

  const FOV = phone ? 50 : 38, DIST = 10;
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
  const scene = new THREE.Scene();

  /* ---------- záber = fotka na mriežke, ktorú hĺbková mapa vytlačí k oku ---------- */
  // mriežka na telefóne: bunka asi 20 px, pohyb kamery je malý a rozdiel oproti hustejšej nevidno
  const SEG = phone ? [72, 96] : [192, 256];
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
  // uVig: 1/šírka, 1/výška plátna, pomer strán, 1 = kreslí sa rovno na obrazovku (vinetácia už tu)
  const FRAG = `
    uniform sampler2D uMap; uniform vec4 uVig; varying vec2 vUv;
    void main() {
      vec3 c = texture2D(uMap, vUv).rgb;
      if (uVig.w > 0.5) {
        vec2 q = (gl_FragCoord.xy * uVig.xy - 0.5) * vec2(uVig.z, 1.0) / max(uVig.z, 1.0);
        c *= 1.0 - smoothstep(0.32, 0.9, length(q)) * 0.34;
      }
      gl_FragColor = vec4(c, 1.0);
    }`;
  const vig = { value: new THREE.Vector4(1, 1, 1, 0) };      // spoločná pre všetky zábery
  const px = (r, g, b) => { const t = new THREE.DataTexture(new Uint8Array([r, g, b, 255]), 1, 1); t.needsUpdate = true; return t; };
  const blank = px(13, 10, 7), flat = px(0, 0, 0);

  SHOTS.forEach((s) => {
    s.mat = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG,
      uniforms: { uMap: { value: blank }, uDepth: { value: flat }, uAmt: { value: 0.42 }, uEye: { value: new THREE.Vector3() }, uVig: vig },
    });
    s.mesh = new THREE.Mesh(grid, s.mat);
    s.mesh.visible = false; s.mesh.frustumCulled = false;
    scene.add(s.mesh);
    s.eye = new THREE.Vector3();
    s.ready = false; s.loading = null; s.size = 0; s.pi = null;
  });

  /* ---------- načítanie fotiek: najprv aktuálny záber, potom susedia; ostatné sa uvoľnia ---------- */
  const FILM = window.HS30_FILM || null;                       // náhľad: fotky vložené priamo
  const SIZES = (window.HS30_FILM_SIZES || [1086, 1448, 2172]).slice().sort((a, b) => a - b);
  const base = new URL('img/film/', here).href;
  const fileUrl = (f) => (FILM && FILM[f]) || base + f;
  let maxTex = 4096;
  // telefón: najviac 1448 px. Na displeji 2x je to takmer bod na bod (2172 by bol ostrejší len o 8 %),
  // no do grafiky sa nahrá trikrát rýchlejšie a zaberie o polovicu menej pamäte
  const CAP = phone ? 1448 : Infinity;
  function pickSize(s) {
    // najmenšia fotka, ktorá na obrazovke nebude zväčšená (ostrosť ako na fotke)
    const fit = SIZES.filter((w) => w <= maxTex && w <= CAP);
    const need = s.pw / s.vw * canvas.width;
    return fit.find((w) => w >= need * 0.95) || fit[fit.length - 1];
  }
  async function bitmap(url, signal) {
    let blob;
    if (url.startsWith('data:')) {
      // vložená fotka (náhľad): rozbalí sa priamo, bez sieťovej požiadavky
      const bin = atob(url.slice(url.indexOf(',') + 1)), u8 = new Uint8Array(bin.length);
      for (let k = 0; k < bin.length; k++) u8[k] = bin.charCodeAt(k);
      blob = new Blob([u8], { type: 'image/webp' });
    } else {
      const r = await fetch(url, { signal }); if (!r.ok) throw new Error(url);
      blob = await r.blob();
    }
    if (signal.aborted) throw new Error('zrušené');
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
  /* nahratie do grafiky po pásoch: jedno veľké nahratie by zastavilo stránku (na telefóne 40 až 250 ms),
     pásy po 256 riadkoch idú po jednom v ďalších snímkach, každý pár milisekúnd */
  const gl = renderer.getContext(), BAND = 256;
  let jobs = [];
  function upload(bmp, live) {
    return new Promise((res) => {
      const t = tex(bmp);
      t.source.dataReady = false;                           // three len vyhradí miesto, obsah príde po pásoch
      renderer.initTexture(t);
      const glt = renderer.properties.get(t).__webglTexture;
      let y = 0;
      jobs.push(() => {                                     // vráti true, keď je fotka celá (alebo zrušená)
        if (!live()) { bmp.close(); t.dispose(); res(null); return true; }
        const h = Math.min(BAND, bmp.height - y);
        renderer.state.bindTexture(gl.TEXTURE_2D, glt);
        gl.pixelStorei(gl.UNPACK_SKIP_ROWS, y);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, y, bmp.width, h, gl.RGBA, gl.UNSIGNED_BYTE, bmp);
        gl.pixelStorei(gl.UNPACK_SKIP_ROWS, 0);
        y += h;
        if (y < bmp.height) return false;
        bmp.close(); res(t); return true;
      });
      wake();
    });
  }
  function pump(ms) {
    // aspoň jeden pás za snímku, ďalšie len kým neminie rozpočet
    const t0 = performance.now();
    while (jobs.length && performance.now() - t0 < ms) if (jobs[0]()) jobs.shift();
  }
  // fotky sú v AVIF (o tretinu menšie) aj WebP; keď prehliadač AVIF nedekóduje, ďalej sa berie WebP
  let avif = !FILM;
  async function photo(s, w, signal) {
    if (avif) {
      try { return await bitmap(fileUrl(`${s.photo}-${w}.avif`), signal); }
      catch (e) { if (signal.aborted) throw e; avif = false; }
    }
    return bitmap(fileUrl(`${s.photo}-${w}.webp`), signal);
  }
  const retryOk = (s) => !s.failedAt || performance.now() - s.failedAt > 10000;   // po výpadku siete skúsi znova
  function load(s) {
    // raz načítaná veľkosť sa drží (z cache), aj keď pomalé zariadenie zníži rozlíšenie; väčšia len keď treba
    const w = Math.max(pickSize(s), s.w || 0);
    if (s.loading || (s.ready && s.size >= w) || !retryOk(s)) return;
    // hotový záber v menšej veľkosti (napr. po otočení telefónu) sa vymení až keď je väčší načítaný
    const ctl = new AbortController(), upgrade = s.ready;
    const live = () => !ctl.signal.aborted && !lost && !(upgrade && !s.ready);
    s.ctl = ctl;
    s.loading = Promise.all([photo(s, w, ctl.signal), upgrade ? null : bitmap(fileUrl(`${s.photo}-hlbka.webp`), ctl.signal)])
      .then(([img, dep]) => Promise.all([upload(img, live), dep && upload(dep, live)]))
      .then(([map, depth]) => {
        if (s.ctl === ctl) s.loading = null;
        if (!map || (!upgrade && !depth) || !live()) { if (map) map.dispose(); if (depth) depth.dispose(); return; }
        const u = s.mat.uniforms, old = upgrade ? u.uMap.value : null;
        u.uMap.value = map;                                   // obraz je už celý v grafickej karte
        if (depth) u.uDepth.value = depth;
        if (old) old.dispose();
        if (!upgrade) s.t0 = performance.now();
        s.ready = true; s.size = s.w = w; s.failedAt = 0; wake();
      })
      .catch(() => { if (s.ctl === ctl) s.loading = null; if (!ctl.signal.aborted) s.failedAt = performance.now(); });
  }
  function drop(s) {
    if (s.loading) { s.ctl.abort(); s.loading = null; }   // preskočený záber sa ani nedotiahne
    if (!s.ready) return;
    const u = s.mat.uniforms;
    u.uMap.value.dispose(); u.uDepth.value.dispose();
    u.uMap.value = blank; u.uDepth.value = flat; s.ready = false; s.size = 0;
  }
  let onScreen = new Set();
  function keepAround(ci) {
    // v pamäti je aktuálny záber, susedia a ďalší v smere skrolovania
    const dir = V < 0 ? -1 : 1, keep = (s) => s.pi != null && (Math.abs(s.pi - ci) <= 1 || s.pi === ci + 2 * dir);
    SHOTS.forEach((s) => { if (!keep(s) && !onScreen.has(s)) drop(s); });
    const cur = path[ci];
    if (!cur) return;
    load(cur);
    if (!cur.ready) return;                                   // pri skoku najprv cieľ, susedia až potom
    for (const k of [ci + dir, ci - dir, ci + 2 * dir]) if (path[k]) load(path[k]);
  }

  /* ---------- rozloženie záberu podľa obrazovky ---------- */
  const tanH = Math.tan(THREE.MathUtils.degToRad(FOV) / 2);
  const OVER = 0.12;                                          // presah fotky za okraj, aby pohyb nikdy neodhalil hranu
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
  // hĺbkový buffer ostáva: mriežka záberu sa pri pohybe môže prekrývať sama so sebou
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
          c *= 1.0 - 0.12 * sin(3.14159 * uMix);   // prechod cez jemné šero ako vo filme
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

  /* ---------- skrolovanie -> poloha vo filme ----------
     path = zábery, ktoré sú teraz na stránke (skrytá kategória cenníka vypadne), anchors = kde
     na stránke je každý záber celý. S = poloha vo filme (index v path, s desatinami). */
  let path = [], anchors = [], N = 0;
  function measure() {
    const vh = innerHeight, P = [], An = [], was = path.map((s) => s.photo).join();
    SHOTS.forEach((s) => {
      s.pi = null;
      let a = 0;
      if (s.at) {
        const el = typeof s.at === 'string' ? d.querySelector(s.at) : s.at;
        if (!el || !el.offsetParent) return;
        const r = el.getBoundingClientRect();
        if (!s.mid) a = r.top + scrollY - vh * 0.45;
        else {
          // telefón: záber je vysoký takmer ako obrazovka, bod záujmu fotky sa nedá posunúť kamerou,
          // preto kamera zastane, keď je v okne tá časť fotky, na ktorú mieri výrez (napr. neón hore)
          const fy = phone && s.oy != null ? clamp(s.oy * (1 + 2 * OVER) - 0.12, 0.2, 0.5) : 0.5;
          a = r.top + scrollY + r.height / 2 - vh * fy;
        }
      }
      if (An.length && a <= An[An.length - 1] + 1) return;
      s.pi = P.length; P.push(s); An.push(a);
    });
    path = P; anchors = An; N = Math.max(0, P.length - 1);
    // iné poradie záberov (filter v cenníku): film sa nastaví na nové miesto bez jazdy cez cudzie zábery
    if (P.map((s) => s.photo).join() !== was) { S = targetS(); V = 0; fadeK = -1; }
  }
  function targetS() {
    const y = sy;
    if (!anchors.length || y <= anchors[0]) return 0;
    for (let k = 1; k < anchors.length; k++) if (y < anchors[k]) return k - 1 + (y - anchors[k - 1]) / (anchors[k] - anchors[k - 1]);
    return N;
  }

  /* ---------- kamera: tlmená pružina, jemné dýchanie ako zo steadicamu ---------- */
  let S = 0, V = 0, mx = 0, my = 0, pmx = 0, pmy = 0, breath = 1, sy = scrollY;
  let raf = 0, last = 0, running = true, lost = false, shown = false, lastInput = performance.now();
  const started = performance.now();
  const BREATH_MS = 25000;                                    // po chvíli bez pohybu sa obraz upokojí a prestane kresliť
  const tmp = new THREE.Vector3(), off = new THREE.Vector3();
  function place(s, now, push = 0) {
    // pohyb záberu trvá celý čas, keď je záber vidieť (od prelínania dnu po prelínanie von)
    const t = s.pi == null ? 0.5 : s.pi === 0 ? clamp(S / 0.66, 0, 1) : clamp((S - s.pi + 0.66) / 1.32, 0, 1);
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
    // pri prechode kamera odchádzajúceho záberu pokračuje dopredu, akoby prešla do ďalšej miestnosti
    // odchádzajúci záber: kamera ide ďalej dopredu; prichádzajúci: kamera prichádza zo vzdialenosti
    off.z -= push > 0 ? Math.pow(push, 1.4) * 0.2 * DIST : push * 0.07 * DIST;
    camera.position.copy(s.eye).add(off);
    tmp.set(s.eye.x + off.x * 0.35, s.eye.y + off.y * 0.35, 0);
    camera.lookAt(tmp);
  }

  // prelínanie: v pohybe sleduje skrolovanie, v pokoji sa dokončí na bližší záber (nikdy neostane napoly)
  let fade = 0, fadeK = -1, fadeGoal = 0, still = 0, held = null;
  const fin = (s, now) => (s.t0 ? Math.min(1, (now - s.t0) / 450) : 1);   // nábeh práve načítanej fotky
  function draw(now, dt) {
    if (!path.length || !compiled) return false;
    keepAround(clamp(Math.round(S), 0, N));
    const k = clamp(Math.floor(S), 0, N);
    let A = path[k], B = path[clamp(k + 1, 0, N)];
    const want = A === B ? 0 : smooth(0.35, 0.65, S - k);
    if (k !== fadeK) { fade = want; fadeK = k; }
    // až keď skrolovanie naozaj stojí (nie medzi dvomi zárezmi kolieska), dokončí sa prelínanie
    still = Math.abs(V) < 0.03 ? still + dt : 0;
    fadeGoal = still > 0.6 ? Math.round(want) : want;
    fade += (fadeGoal - fade) * (1 - Math.pow(0.02, dt));
    let mix = A === B || !B.ready ? 0 : fade * fin(B, now);
    if (!A.ready) {
      // záber sa ešte načítava (napr. po skoku cez menu): ostane posledný obraz a cieľ sa doň prelnie
      const H = held && held.ready ? held : B.ready ? B : null;
      if (!H) return false;
      A = H; mix = B.ready && B !== A ? fin(B, now) : 0;
    } else if (held && held !== A && held !== B && held.ready && fin(A, now) < 1) { B = A; A = held; mix = fin(B, now); }
    if (mix >= 0.999) { A = B; mix = 0; }
    if (mix > 0.001) {
      // prelínanie: oba zábery do textúr a spolu na obrazovku
      vig.value.w = 0;
      renderer.setRenderTarget(rtA); renderer.clear();
      A.mesh.visible = true; place(A, now, mix); renderer.render(scene, camera); A.mesh.visible = false;
      renderer.setRenderTarget(rtB); renderer.clear();
      B.mesh.visible = true; place(B, now, -(1 - mix)); renderer.render(scene, camera); B.mesh.visible = false;
      post.material.uniforms.uMix.value = mix;
      renderer.setRenderTarget(null); renderer.clear();
      renderer.render(postScene, postCam);
    } else {
      // jeden záber: rovno na obrazovku s vinetáciou, jeden prechod namiesto dvoch
      vig.value.w = 1;
      renderer.setRenderTarget(null); renderer.clear();
      A.mesh.visible = true; place(A, now, 0); renderer.render(scene, camera); A.mesh.visible = false;
    }
    held = mix > 0.5 ? B : A;
    showPlace(held);
    onScreen = new Set(mix > 0.001 ? [A, B] : [A]);
    drawn = true;
    // ešte beží prelínanie alebo nábeh novej fotky: kresliť ďalej
    return Math.abs(fadeGoal - fade) > 0.002 || (mix > 0.001 && mix < 0.999) || fin(A, now) < 1;
  }
  let drawn = false;

  /* ---------- adaptívna kvalita: keď zariadenie nestíha, zníži sa rozlíšenie ----------
     porovnáva sa s najkratšou snímkou zariadenia, takže displej s 30 Hz (šetrenie energie) nie je „pomalý“ */
  let fastest = 0, cap = false;
  const ft = [];
  function quality(dt) {
    if (dt <= 0 || dt >= 0.1) return;
    fastest = fastest ? Math.min(fastest, dt) : dt;
    ft.push(dt); if (ft.length < 40) return;
    const avg = ft.reduce((a, b) => a + b, 0) / ft.length; ft.length = 0;
    if (avg > fastest * 1.6 && avg > 0.024) {
      if (dpr > 1) { dpr = Math.max(1, dpr - 0.5); resize(); }
      else cap = true;          // ani pri najnižšom rozlíšení nestíha: film ide 30 snímok za sekundu ako v kine
    }
  }

  let cw = 0, ch = 0, cd = 0, drawnAt = 0, compiled = false;
  function resize() {
    // plátno má výšku veľkého výrezu (100lvh), takže lišta prehliadača na mobile ho pri skrolovaní nemení
    const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
    if (w !== cw || h !== ch || dpr !== cd) {
      cw = w; ch = h; cd = dpr;
      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
      rtA.setSize(canvas.width, canvas.height); rtB.setSize(canvas.width, canvas.height);
      // nový render target pri prvom použití čaká na grafiku: overí sa hneď, v tej istej snímke ako zmena
      // rozlíšenia, a nie o chvíľu neskôr uprostred skrolu pri najbližšom prelínaní
      for (const rt of [rtA, rtB]) { renderer.setRenderTarget(rt); renderer.clear(); }
      renderer.setRenderTarget(null);
      post.material.uniforms.uAspect.value = w / h;
      vig.value.set(1 / canvas.width, 1 / canvas.height, w / h, vig.value.w);
      layout();
    }
    measure(); wake();
  }
  function frame(now) {
    raf = 0;
    if (!running || lost) return;
    if (jobs.length) pump(4);
    // strop 30 snímok za sekundu (len keď zariadenie nestíha): stránka sa pritom skroluje plynulo ďalej
    if (cap && shown && now - drawnAt < 30) { raf = requestAnimationFrame(frame); return; }
    drawnAt = now;
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0; last = now;
    const T = targetS();
    // kriticky tlmená pružina: plynulé rozbehnutie aj dobehnutie, žiadne trhnutie pri rýchlom skrole
    const w0 = 5.2;
    V += ((T - S) * w0 * w0 - 2 * w0 * V) * dt; S += V * dt;
    if (Math.abs(T - S) < 0.0004 && Math.abs(V) < 0.0004) { S = T; V = 0; }
    // skok cez menu alebo tlačidlo: žiadna dlhá jazda cez celý salón, len krátke prelínanie na cieľ
    if (Math.abs(T - S) > 1.5) { S = T - Math.sign(T - S) * 0.45; V = 0; }
    pmx += (mx - pmx) * (1 - Math.pow(0.02, dt)); pmy += (my - pmy) * (1 - Math.pow(0.02, dt));
    const idle = now - lastInput;
    breath = idle < BREATH_MS ? 1 : Math.max(0, 1 - (idle - BREATH_MS) / 3000);
    const busy = draw(now, dt);
    if (drawn && !shown) { shown = true; requestAnimationFrame(() => root.classList.add('world-in')); }
    // naklonenie telefónu dobehne v pokojových 30 snímkach za sekundu, myš na počítači plynulo
    const moving = busy || jobs.length > 0 || Math.abs(T - S) > 0.0004 || Math.abs(V) > 0.0004 || (!phone && (Math.abs(mx - pmx) > 0.0008 || Math.abs(my - pmy) > 0.0008));
    if (!shown) {
      // prvý záber ešte nie je: čakať, a keď nič nepríde (sieť), vrátiť pokojný web
      if (now - started > 15000) { stop(); return; }
      if (jobs.length) wake(); else setTimeout(wake, 120);   // fotka ide do grafiky: ďalší pás hneď v ďalšej snímke
      last = 0;
    } else if (moving) { quality(dt); if (!raf) raf = requestAnimationFrame(frame); }
    else if (breath > 0) setTimeout(() => { if (!raf && running) raf = requestAnimationFrame(frame); }, 1000 / 30 - 4);   // v pokoji 30 snímok za sekundu
    else last = 0;
  }
  function wake() { if (!raf && running && !lost) raf = requestAnimationFrame(frame); }
  const poke = () => { lastInput = performance.now(); wake(); };

  /* ---------- udalosti; všetko sa dá naraz odpojiť, keď film skončí ---------- */
  const ac = new AbortController();
  const on = (t, e, f, o) => t.addEventListener(e, f, Object.assign({ passive: true, signal: ac.signal }, o));
  // poloha skrolu sa číta hneď na začiatku udalosti (zachytávanie, pred ostatnými poslucháčmi), keď je
  // štýl ešte čistý; čítanie scrollY v snímke až po zápisoch iných skriptov by vynútilo prepočet štýlu
  on(window, 'scroll', () => { sy = scrollY; poke(); }, { capture: true });
  on(window, 'resize', resize);
  on(window, 'touchstart', poke);
  if (!phone) on(window, 'pointermove', (e) => { mx = e.clientX / innerWidth - 0.5; my = -(e.clientY / innerHeight - 0.5); poke(); });
  // telefón: pri naklonení sa perspektíva jemne pohne ako pri pohľade do skutočnej miestnosti.
  // iPhone by na to potreboval povolenie, preto sa tam nepýtame a obraz ostáva len so skrolovaním.
  if (phone && 'DeviceOrientationEvent' in window && typeof DeviceOrientationEvent.requestPermission !== 'function') {
    let b0 = null, g0 = null;
    on(window, 'deviceorientation', (e) => {
      if (e.beta == null || e.gamma == null || performance.now() - lastInput > BREATH_MS) return;
      // beta a gamma sú viazané na telefón, nie na obrazovku: na šírku sa osi vymenia
      const ang = (screen.orientation && screen.orientation.angle) || window.orientation || 0;
      let gx = e.gamma, by = e.beta;
      if (ang === 90) [gx, by] = [by, -gx]; else if (ang === 270 || ang === -90) [gx, by] = [-by, gx];
      if (b0 == null) { b0 = by; g0 = gx; }
      // základ sa pomaly dorovná, aby obraz neostal vychýlený, keď telefón držíš inak
      b0 += (by - b0) * 0.01; g0 += (gx - g0) * 0.01;
      const nx = clamp((gx - g0) / 24, -0.5, 0.5), ny = clamp((by - b0) / 24, -0.5, 0.5);
      // mŕtva zóna asi 0,7°: chvenie ruky obraz nerozhýbe
      if (Math.abs(nx - mx) > 0.03 || Math.abs(ny - my) > 0.03) { mx = nx; my = ny; wake(); }
    });
    if (screen.orientation) on(screen.orientation, 'change', () => { b0 = g0 = null; });
  }
  on(d, 'visibilitychange', () => { running = !d.hidden; if (running) { last = 0; poke(); } });
  // strata grafického kontextu (málo pamäte): rozrobené pásy sa hneď zrušia (uvoľnia rozbalené fotky),
  // po obnove sa fotky načítajú znova
  on(canvas, 'webglcontextlost', (e) => { e.preventDefault(); lost = true; while (jobs.length) jobs.shift()(); }, { passive: false });
  on(canvas, 'webglcontextrestored', () => {
    lost = false;
    SHOTS.forEach((s) => { if (s.loading) s.ctl.abort(); s.loading = null; s.ready = false; s.size = 0; s.mat.uniforms.uMap.value = blank; s.mat.uniforms.uDepth.value = flat; });
    cw = 0; resize();
  });
  // obsah stránky mení výšku (fotky, rozbalené karty, filter), kotvy sa preto prepočítajú
  let mt;
  const ro = new ResizeObserver(() => { clearTimeout(mt); mt = setTimeout(() => { measure(); wake(); }, 150); });
  ro.observe(d.body);
  function stop() {
    running = false; ac.abort(); ro.disconnect(); clearTimeout(mt); jobs = [];
    if (raf) cancelAnimationFrame(raf);
    SHOTS.forEach(drop);
    renderer.dispose(); try { renderer.forceContextLoss(); } catch (e) { /* nič */ }
    canvas.remove(); quit();
  }

  maxTex = renderer.capabilities.maxTextureSize || 4096;
  await new Promise((r) => setTimeout(r, 0));                  // vytvorenie grafiky a meranie stránky nie v jednej dlhej úlohe
  resize();
  S = targetS();
  // prvé použitie shaderu čaká na grafiku: shadery sa preložia vopred a bez čakania
  // (KHR_parallel_shader_compile), nie až pri prvom zábere či prelínaní počas skrolu
  try { await Promise.all([renderer.compileAsync(scene, camera), renderer.compileAsync(postScene, postCam)]); } catch (e) { /* preloží sa pri prvom kreslení */ }
  compiled = true;
  // prvý obraz až keď je načítaný záber na mieste, kde návštevník je; potom sa fotka z úvodu prelnie do filmu
  wake();
})();
