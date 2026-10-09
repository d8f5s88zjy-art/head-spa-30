/* BARBERSHOP 30: prehliadka podniku ako film.
   Pozadie webu sú skutočné fotky podniku, nie vymodelovaná scéna. Každá fotka má hĺbkovú mapu,
   takže kamera sa v nej pohne ako v skutočnej miestnosti: kreslá a pult vpredu sa posúvajú viac
   ako stena za nimi. Pri skrolovaní ide kamera pomalým filmovým pohybom a medzi časťami webu sa
   zábery prelínajú. Fotky sa netónujú, pridá sa len vinetácia a krátke šero pri prelínaní.
   Film je iba pozadie: text, cenník a tlačidlá ostávajú v HTML nad ním.

   Rozhranie so stránkou (index.html + style.css):
   - kotvy <div class="film-shot" data-shot="meno" data-f="x,y" data-mv="in|right|left|rise|down|near"
     [data-fm="x,y" pre telefón] [data-place="popis miesta"]> v poradí dokumentu; v každej je statická
     záloha <picture class="film-still"> s <img width height> (z rozmerov sa berie pomer strán fotky).
     Záber je celý na obrazovke, keď je horný okraj kotvy (pri sticky/fixed kotve jej rodiča) na
     hornom okraji okna; medzi susednými kotvami sa zábery prelínajú v polovici vzdialenosti.
   - fotky: img/film/<meno>-{2172,1448,1086}.{avif,webp} + <meno>-hlbka.webp vedľa tohto skriptu.
   - triedy na <html>: world (film sa použije), world-in (prvý snímok je nakreslený, zálohy zmiznú),
     world-off (film zlyhal alebo skončil, zálohy ostávajú). Keď stránka v hlavičke triedu world
     nedala, rozhodne sa tu podľa tých istých pravidiel (WebGL2, pohyb, dáta, výška, pamäť, jadrá).
     html[data-film="force"] (vývojová stránka) obíde rozhodovanie aj čakanie na pohyb návštevníka.
   - dosky s textom .board (a pätička): popis miesta vľavo dole sa ukazuje len tam, kde ich nie je.
   - úvod ako film (prológ): kotva úvodu má data-pro="meno" (+ data-pro-f, data-pro-fm, data-pro-mv,
     data-pro-size="ŠxV", data-pro-place). Keď stránka v hlavičke dala triedu pro (raz za návštevu, len
     s filmom, bez kotvy v adrese), film sa nečaká na pohyb návštevníka, začne záberom prológu (fasáda,
     kamera dôjde k dverám), cez šero prejde do záberu úvodu a odtiaľ už vedie skrolovanie. Prológ sa
     dá kedykoľvek preskočiť skrolovaním; bez triedy pro sa nič z toho nedeje.
   - data-size="ŠxV" na kotve: rozmery fotky záberu, keď ich nedáva <img> (viac záloh v kotve).
   - window.BS30_FILM = { ready, shots, goTo(meno, t), state } na ladenie. */
(async function () {
  'use strict';
  const d = document, root = d.documentElement;
  const force = root.dataset.film === 'force';
  let readyDone;
  const api = {
    ready: new Promise((r) => { readyDone = r; }),       // true = prvý snímok, false = film nejde (world-off)
    shots: [],
    goTo() { return false; },
    proFreeze() { return false; },
    get state() { return { on: false }; },
  };
  window.BS30_FILM = api;
  // film nejde (grafika, sieť, zariadenie): zálohy .film-still ostávajú, rozloženie stránky sa nemení
  const quit = () => { root.classList.add('world-off'); readyDone(false); };

  /* ---------- či sa film vôbec použije ----------
     ideálne to rozhodne už skript v hlavičke stránky (trieda world), aby stránka mohla štýly
     prispôsobiť pred prvým vykreslením; keď to neurobil, rozhodne sa tu podľa rovnakých pravidiel */
  if (root.classList.contains('world-off')) return;
  if (!force && !root.classList.contains('world')) {
    let ok = false;
    try {
      const c = d.createElement('canvas'), g = c.getContext('webgl2');
      ok = !!g && !matchMedia('(prefers-reduced-motion: reduce)').matches
        && !(navigator.connection && navigator.connection.saveData)
        && !matchMedia('(max-height: 500px)').matches
        && (navigator.deviceMemory || 8) >= 4 && (navigator.hardwareConcurrency || 8) >= 4;
      const x = g && g.getExtension('WEBGL_lose_context'); if (x) x.loseContext();
    } catch (e) { ok = false; }
    if (!ok) { quit(); return; }
    root.classList.add('world');
  } else if (force) root.classList.add('world');

  // adresa tohto skriptu (aj keď je načítaný ako modul, kde currentScript chýba): od nej sa odvíja vendor/ a img/film/
  const me = d.currentScript || d.querySelector('script[src$="film.js"],script[src*="film.js?"]');
  const here = (me && me.src) || location.href;
  if (d.readyState !== 'complete') await new Promise((r) => addEventListener('load', r, { once: true }));
  // prológ (úvod ako film) len keď návštevník naozaj stojí na začiatku stránky: obnovený scroll
  // uprostred stránky alebo skrytá karta ho zrušia a web sa správa ako bez neho
  const proEl = d.querySelector('.film-shot[data-pro]');
  let proArmed = root.classList.contains('pro') && !!proEl && scrollY < innerHeight * 0.25 && !d.hidden;
  if (!proArmed) root.classList.remove('pro');
  // film sa spustí až keď sa návštevník pohne (dotyk, myš, skrolovanie, klávesnica); dovtedy drží
  // každé okno do filmu statická fotka (.film-still), takže nikde nie je prázdna plocha. Aby film
  // prišiel skoro aj po prvom švihu na telefóne, knižnica sa po načítaní stránky vo voľnej chvíli
  // len stiahne do vyrovnávacej pamäte (bez spustenia), až po chvíli, aby nebrzdila fotku úvodu.
  // S prológom sa nečaká: knižnica aj prvé dva zábery idú hneď po načítaní stránky (po jej prvom obraze).
  const src = new URL('vendor/three.module.min.js', here).href;
  const early = () => { fetch(src, { priority: 'low' }).catch(() => {}); };
  const INPUTS = ['pointerdown', 'pointermove', 'touchstart', 'wheel', 'scroll', 'keydown'];
  if (!force && !proArmed) await new Promise((r) => {
    let t = 0;
    const go = () => { clearTimeout(t); INPUTS.forEach((e) => removeEventListener(e, go)); r(); };
    INPUTS.forEach((e) => addEventListener(e, go, { passive: true }));
    t = setTimeout(() => { if ('requestIdleCallback' in window) requestIdleCallback(early, { timeout: 3000 }); else early(); }, 4000);
  });
  const tStart = performance.now();
  let THREE;
  try { THREE = await import(src); } catch (e) { quit(); return; }

  const phone = matchMedia('(max-width: 720px)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  /* ---------- zábery z kotiev v stránke ----------
     f  = bod záujmu na fotke (0 až 1, zľava a zhora), fm = to isté pre telefón (nepovinné)
     mv = pohyb kamery počas záberu: [x, y, z] na začiatku a na konci, v podieloch obrazu
          (x a y ako časť šírky a výšky záberu, z ako časť vzdialenosti; mínus z = nájazd)
     Jeden jednotný pohyb celého filmu: kamera ide stále pomaly dopredu s jemným bočným oblúkom
     okolo bodu záujmu (pozerá sa stále naň), popredie sa tak posúva voči stene ako pri skutočnej
     prechádzke podnikom. */
  const ARC = phone ? 0.026 : 0.04;
  const MOVES = {
    in: [[-ARC * 0.5, 0, 0.04], [ARC * 0.5, 0, -0.12]],
    right: [[-ARC, 0, 0.04], [ARC, 0, -0.12]],
    left: [[ARC, 0, 0.04], [-ARC, 0, -0.12]],
    rise: [[-ARC * 0.4, -ARC * 0.5, 0.04], [ARC * 0.4, ARC * 0.5, -0.12]],
    down: [[ARC * 0.4, ARC * 0.5, 0.04], [-ARC * 0.4, -ARC * 0.5, -0.12]],
    // len jemný nájazd: pokojný záber pod doskou s cenníkom
    near: [[-ARC * 0.5, 0, 0.02], [ARC * 0.5, 0, -0.03]],
    // prológ: chôdza z ulice k dverám, kamera ide dopredu o tretinu vzdialenosti (asi 1,5× priblíženie)
    door: [[-ARC * 0.3, 0, 0.05], [ARC * 0.3, 0, -0.34]],
  };
  const pair = (v, dflt) => { const a = (v || '').split(/[\s,;]+/).map(parseFloat); return a.length === 2 && a.every(isFinite) ? [clamp(a[0], 0, 1), clamp(a[1], 0, 1)] : dflt; };
  // pomer strán fotky: z data-size="ŠxV", inak z width/height prvej zálohy <img> (zábery podniku sú 3 : 2)
  const ratio = (size, img) => {
    const a = (size || '').split(/[x×,\s]+/).map(parseFloat);
    if (a.length === 2 && a[0] > 0 && a[1] > 0) return a[0] / a[1];
    const w = img && parseFloat(img.getAttribute('width')), h = img && parseFloat(img.getAttribute('height'));
    return w > 0 && h > 0 ? w / h : 1.5;
  };
  const SHOTS = [...d.querySelectorAll('.film-shot[data-shot]')].map((el) => {
    const f = pair(el.dataset.f, [0.5, 0.5]);
    // záloha ukazuje ten istý bod záujmu ako film (object-position cez vlastné premenné)
    el.style.setProperty('--fx', (f[0] * 100).toFixed(1) + '%'); el.style.setProperty('--fy', (f[1] * 100).toFixed(1) + '%');
    return {
      at: el, photo: el.dataset.shot, place: el.dataset.place || '', f, fm: pair(el.dataset.fm, null),
      mv: MOVES[el.dataset.mv] ? el.dataset.mv : 'in',
      pa: ratio(el.dataset.size, el.querySelector('img')),
    };
  });
  if (!SHOTS.length) { quit(); return; }
  /* záber prológu: nemá vlastnú kotvu, stojí pred úvodom (index 0 v ceste, kotva jednu obrazovku nad
     začiatkom stránky), takže skrolovaním sa k nemu nedá vrátiť; po prológu sa uvoľní a už sa nekreslí */
  let PRO = null;
  if (proArmed) {
    const e = proEl;
    PRO = {
      at: e, photo: e.dataset.pro, place: e.dataset.proPlace || '', f: pair(e.dataset.proF, [0.5, 0.5]), fm: pair(e.dataset.proFm, null),
      mv: MOVES[e.dataset.proMv] ? e.dataset.proMv : 'in', pa: ratio(e.dataset.proSize, null), pro: true,
    };
    SHOTS.unshift(PRO);
  }
  api.shots = SHOTS.map((s) => s.photo);

  /* ---------- renderer ---------- */
  const canvas = d.createElement('canvas');
  canvas.className = 'film-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  d.body.prepend(canvas);
  // prehliadka: nenápadný popis miesta vľavo dole, len tam kde film nezakrýva doska s textom
  const placeBox = d.createElement('div');
  placeBox.className = 'film-place'; placeBox.setAttribute('aria-hidden', 'true');
  const esc = (t) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const places = new Map(); SHOTS.forEach((s) => { if (s.place && !places.has(s.photo)) places.set(s.photo, s.place); });
  placeBox.innerHTML = '<b>Prehliadka podniku</b>' + [...places].map(([k, v]) => `<span data-p="${esc(k)}">${esc(v)}</span>`).join('');
  canvas.after(placeBox);
  // popis je vidieť, len kým ho celý odkrýva okno do filmu; doska s textom ho nikdy neprereže
  let placeNow = null, placeBand = [0, 0], bands = [];
  const measurePlace = () => { const r = placeBox.getBoundingClientRect(); placeBand = [r.top - 24, r.bottom + 24]; placeNow = -1; };
  const showPlace = (s) => {
    const y0 = sy + placeBand[0], y1 = sy + placeBand[1];
    const free = placeBand[1] > 0 && !bands.some((b) => b[0] < y1 && b[1] > y0);
    const key = s && s.place && free ? s.photo : null;
    if (key === placeNow) return;
    if (key) placeBox.querySelectorAll('span').forEach((e) => e.classList.toggle('on', e.dataset.p === key));
    placeNow = key;
    placeBox.classList.toggle('on', !!key);
  };
  let renderer;
  // bez prelínania sa záber kreslí rovno na obrazovku, preto aj ona má hĺbku (mriežka sa môže prekryť sama so sebou)
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, depth: true, stencil: false, powerPreference: 'high-performance' }); }
  catch (e) { canvas.remove(); placeBox.remove(); quit(); return; }
  if (!renderer.capabilities.isWebGL2) { renderer.dispose(); canvas.remove(); placeBox.remove(); quit(); return; }
  // farby fotiek idú na obrazovku bez prepočtov, presne ako na fotke
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.autoClear = false;
  renderer.setClearColor(0x0e0d0c, 1);                        // --ink
  // shadery sú hotové a overené; kontrola chýb by pri každom preklade čakala na grafiku (stovky ms na telefóne)
  renderer.debug.checkShaderErrors = false;
  // ostrosť: plné rozlíšenie displeja do 2x; pomalé zariadenie si ho samo zníži
  let dpr = Math.min(devicePixelRatio || 1, 2);

  const FOV = phone ? 50 : 38, DIST = 10;
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
  const scene = new THREE.Scene();

  /* ---------- záber = fotka na mriežke, ktorú hĺbková mapa vytlačí k oku ---------- */
  // mriežka na telefóne: bunka asi 20 px, pohyb kamery je malý a rozdiel oproti hustejšej nevidno
  const SEG = phone ? [96, 72] : [256, 192];                   // fotky sú na šírku: viac buniek vodorovne
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
  /* hĺbková mapa sa po načítaní raz zjemní na grafike: popredie sa najprv mierne rozšíri (max filter),
     potom sa hrana rozmaže na šírku asi dvoch buniek mriežky. Predmet sa tak hýbe ako celok a pri
     pohybe sa naťahuje len úzky pás steny tesne za ním, hrana nesleduje bunky mriežky (žiadne zúbky) */
  const soft = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    depthTest: false, depthWrite: false,
    uniforms: { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() }, uDir: { value: new THREE.Vector2() }, uR: { value: 1 }, uMode: { value: 0 } },
    vertexShader: 'void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `
      uniform sampler2D tSrc; uniform vec2 uTexel, uDir; uniform float uR, uMode;
      void main() {
        vec2 uv = gl_FragCoord.xy * uTexel;
        float acc = 0.0, ws = 0.0, s2 = uR * uR / 9.0;
        for (int i = -40; i <= 40; i++) {
          float f = float(i);
          if (abs(f) > uR) continue;
          float z = texture2D(tSrc, uv + uDir * uTexel * f).r;
          if (uMode < 0.5) acc = max(acc, z);
          else { float w = exp(-0.5 * f * f / s2); acc += z * w; ws += w; }
        }
        if (uMode > 0.5) acc /= ws;
        gl_FragColor = vec4(acc, acc, acc, 1.0);
      }`,
  }));
  soft.frustumCulled = false;
  const softScene = new THREE.Scene(); softScene.add(soft);
  function soften(t) {
    // rozmery z nahratia: samotný obrázok je po nahratí zavretý (bitmap.close) a hlási 0 × 0
    const w = t.userData.w, h = t.userData.h, u = soft.material.uniforms;
    const opt = { depthBuffer: false, stencilBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, generateMipmaps: false };
    const a = new THREE.WebGLRenderTarget(w, h, opt), b = new THREE.WebGLRenderTarget(w, h, opt);
    // polomer v texeloch hĺbkovej mapy podľa bunky mriežky: rozmazanie asi 1,2 bunky, rozšírenie dvojnásobok
    const sig = Math.max(1.5, 1.2 * w / SEG[0]);
    const pass = (src, dst, dx, dy, mode, r) => {
      u.tSrc.value = src; u.uTexel.value.set(1 / w, 1 / h); u.uDir.value.set(dx, dy); u.uMode.value = mode; u.uR.value = r;
      renderer.setRenderTarget(dst); renderer.render(softScene, postCam);
    };
    pass(t, a, 1, 0, 0, Math.round(2 * sig)); pass(a.texture, b, 0, 1, 0, Math.round(2 * sig));
    pass(b.texture, a, 1, 0, 1, Math.min(40, Math.round(3 * sig))); pass(a.texture, b, 0, 1, 1, Math.min(40, Math.round(3 * sig)));
    renderer.setRenderTarget(null); u.tSrc.value = null;
    a.dispose(); t.dispose();
    return b;
  }
  const vig = { value: new THREE.Vector4(1, 1, 1, 0) };      // spoločná pre všetky zábery
  const px = (r, g, b) => { const t = new THREE.DataTexture(new Uint8Array([r, g, b, 255]), 1, 1); t.needsUpdate = true; return t; };
  const blank = px(14, 13, 12), flat = px(0, 0, 0);

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
  const SIZES = [1086, 1448, 2172];
  const base = new URL('img/film/', here).href;
  let maxTex = 4096;
  // telefón: najviac 1448 px. Na displeji 2x je to takmer bod na bod, no do grafiky sa nahrá
  // trikrát rýchlejšie ako 2172 a zaberie o polovicu menej pamäte
  const CAP = phone ? 1448 : Infinity;
  function pickSize(s) {
    // najmenšia fotka, ktorá na obrazovke nebude zväčšená (ostrosť ako na fotke)
    const fit = SIZES.filter((w) => w <= maxTex && w <= CAP);
    const need = s.pw / s.vw * canvas.width;
    return fit.find((w) => w >= need * 0.95) || fit[fit.length - 1];
  }
  async function bitmap(url, signal) {
    const r = await fetch(url, { signal }); if (!r.ok) throw new Error(url);
    const blob = await r.blob();
    if (signal.aborted) throw new Error('zrušené');
    // bez volieb (Safari ich nepozná); prvý riadok obrázka je hore, shader to otočí sám
    return createImageBitmap(blob);
  }
  // hĺbková mapa: mriežka má 256 buniek na šírku, mapa širšia než 768 px by len zabrala pamäť grafiky
  // (4096 px = 45 MB na záber) a predĺžila zjemnenie; väčšia sa preto po rozbalení zmenší
  const DEPTH_W = 768;
  async function depthBitmap(url, signal) {
    const b = await bitmap(url, signal);
    if (b.width <= DEPTH_W) return b;
    const w = DEPTH_W, h = Math.round(b.height * w / b.width);
    const c = typeof OffscreenCanvas === 'function' ? new OffscreenCanvas(w, h) : Object.assign(d.createElement('canvas'), { width: w, height: h });
    const x = c.getContext('2d'); x.drawImage(b, 0, 0, w, h); b.close();
    return createImageBitmap(c);
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
      t.userData.w = bmp.width; t.userData.h = bmp.height;  // rozmery ostanú známe aj po zavretí obrázka
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
  let avif = true;
  async function photo(s, w, signal) {
    if (avif) {
      try { return await bitmap(`${base}${s.photo}-${w}.avif`, signal); }
      catch (e) { if (signal.aborted) throw e; avif = false; }
    }
    return bitmap(`${base}${s.photo}-${w}.webp`, signal);
  }
  const retryOk = (s) => !s.failedAt || performance.now() - s.failedAt > 10000;   // po výpadku siete skúsi znova
  function load(s) {
    // raz načítaná veľkosť sa drží (z cache), aj keď pomalé zariadenie zníži rozlíšenie; väčšia len keď treba
    const w = Math.max(pickSize(s), s.w || 0);
    if (s.done || s.loading || (s.ready && s.size >= w) || !retryOk(s)) return;   // done: prológ, ktorý už prebehol
    // hotový záber v menšej veľkosti (napr. po otočení telefónu) sa vymení až keď je väčší načítaný
    const ctl = new AbortController(), upgrade = s.ready;
    const live = () => !ctl.signal.aborted && !lost && !(upgrade && !s.ready);
    s.ctl = ctl;
    s.loading = Promise.all([photo(s, w, ctl.signal), upgrade ? null : depthBitmap(`${base}${s.photo}-hlbka.webp`, ctl.signal)])
      .then(([img, dep]) => Promise.all([upload(img, live), dep && upload(dep, live)]))
      .then(([map, depth]) => {
        if (s.ctl === ctl) s.loading = null;
        if (!map || (!upgrade && !depth) || !live()) { if (map) map.dispose(); if (depth) depth.dispose(); return; }
        const u = s.mat.uniforms, old = upgrade ? u.uMap.value : null;
        u.uMap.value = map;                                   // obraz je už celý v grafickej karte
        if (depth) { s.drt = soften(depth); u.uDepth.value = s.drt.texture; }
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
    u.uMap.value.dispose(); if (s.drt) { s.drt.dispose(); s.drt = null; }
    u.uMap.value = blank; u.uDepth.value = flat; s.ready = false; s.size = 0;
  }
  let onScreen = new Set();
  function keepAround(ci) {
    // v pamäti je aktuálny záber, susedia a ďalší v smere skrolovania (najviac štyri);
    // prológ, ktorý už prebehol (done), sa uvoľní, len čo zíde z obrazovky
    const dir = V < 0 ? -1 : 1, keep = (s) => !s.done && s.pi != null && (Math.abs(s.pi - ci) <= 1 || s.pi === ci + 2 * dir);
    SHOTS.forEach((s) => { if (!keep(s) && !onScreen.has(s)) drop(s); });
    const cur = path[ci];
    if (!cur) return;
    load(cur);
    if (!cur.ready) return;                                   // pri skoku najprv cieľ, susedia až potom
    for (const k of [ci + dir, ci - dir, ci + 2 * dir]) if (path[k]) load(path[k]);
  }

  /* ---------- rozloženie záberu podľa obrazovky ---------- */
  const tanH = Math.tan(THREE.MathUtils.degToRad(FOV) / 2);
  const OVER = 0.12;                                          // presah fotky za okraj (1,24), aby pohyb nikdy neodhalil hranu
  function layout() {
    const aspect = canvas.width / canvas.height;
    const vh = 2 * DIST * tanH, vw = vh * aspect;
    SHOTS.forEach((s) => {
      // fotka pokryje okno s presahom na oboch stranách; na telefóne na výšku vidno jej stred okolo bodu záujmu
      const ov = 1 + 2 * OVER;
      let pw = vw * ov, ph = pw / s.pa;
      if (ph < vh * ov) { ph = vh * ov; pw = ph * s.pa; }
      s.mesh.scale.set(pw, ph, 1);
      s.pw = pw; s.ph = ph; s.vw = vw; s.vh = vh;
      const f = (phone && s.fm) || s.f;
      const mx = Math.max(0, (pw - vw) / 2 - vw * OVER * 0.5), my = Math.max(0, (ph - vh) / 2 - vh * OVER * 0.5);
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
          // prechod cez krátke šero ako medzi dvoma miestnosťami: starý záber stmavne skôr, než sa nový
          // rozsvieti, cez seba stoja len slabo (v strede 16 % + 20 %, spolu asi 36 % jasu), takže nikdy
          // nie je tma ani zreteľná dvojexpozícia
          c = c * (1.0 - smoothstep(0.0, 0.7, uMix)) + texture2D(tB, vUv).rgb * smoothstep(0.3, 1.0, uMix);
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
     path = zábery, ktorých kotvy sú teraz v stránke (skrytá vypadne), anchors = kde na stránke je
     každý záber celý na obrazovke. S = poloha vo filme (index v path, s desatinami). */
  let path = [], anchors = [], N = 0;
  // horný okraj kotvy v súradniciach stránky; prilepená (sticky) alebo pevná kotva, aj jej prilepený
  // obal, sa pri skrolovaní hýbe, preto sa berie jej rodič: tam sa kotva začína lepiť
  function pageTop(el) {
    const y = scrollY;
    for (let e = el; e && e !== d.body; e = e.parentElement) {
      const p = getComputedStyle(e).position;
      if (p === 'sticky' || p === 'fixed') return (e.parentElement || e).getBoundingClientRect().top + y;
    }
    return el.getBoundingClientRect().top + y;
  }
  function measure() {
    const vh = innerHeight, P = [], An = [], was = path.map((s) => s.photo).join();
    SHOTS.forEach((s) => {
      s.pi = null;
      if (!s.at.offsetParent && getComputedStyle(s.at).position !== 'fixed') return;   // skrytá kotva vypadne
      // prológ stojí jednu obrazovku pred začiatkom stránky: pri scrollY 0 je film presne na zábere úvodu
      const a = s.pro ? -vh : Math.max(0, pageTop(s.at));
      if (An.length && a <= An[An.length - 1] + 1) return;
      s.pi = P.length; P.push(s); An.push(a);
    });
    path = P; anchors = An; N = Math.max(0, P.length - 1);
    // dosky s textom (aj ich mäkké prechody do filmu) v súradniciach stránky, pre popis miesta
    bands = [...d.querySelectorAll('.board,footer')].map((el) => { const r = el.getBoundingClientRect(); return [r.top + scrollY - vh * 0.16, r.bottom + scrollY + vh * 0.1]; });
    if (root.classList.contains('world-in')) measurePlace();
    // iné poradie záberov (zmena stránky): film sa nastaví na nové miesto bez jazdy cez cudzie zábery
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
    off.x += (Math.sin(sec * 0.37) * 0.006 * breath + pmx * 0.03) * s.vw;
    off.y += (Math.sin(sec * 0.29 + 1.3) * 0.004 * breath + pmy * 0.018) * s.vh;
    off.z += Math.sin(sec * 0.21 + 0.4) * 0.008 * DIST * breath;
    // pri prechode kamera odchádzajúceho záberu pokračuje dopredu, akoby prešla do ďalšej miestnosti;
    // prichádzajúci záber: kamera prichádza zo vzdialenosti
    off.z -= push > 0 ? Math.pow(push, 1.4) * 0.2 * DIST : push * 0.07 * DIST;
    camera.position.copy(s.eye).add(off);
    // pohľad ostáva takmer na bode záujmu: posun kamery sa mení na oblúk okolo neho
    tmp.set(s.eye.x + off.x * 0.08, s.eye.y + off.y * 0.08, 0);
    camera.lookAt(tmp);
  }

  // prelínanie: v pohybe sleduje skrolovanie, v pokoji sa dokončí na bližší záber (nikdy neostane napoly)
  let fade = 0, fadeK = -1, fadeGoal = 0, still = 0, held = null, dark = false;   // dark: po skoku sa ide zo šera
  const fin = (s, now) => (s.t0 ? Math.min(1, (now - s.t0) / 450) : 1);   // nábeh práve načítanej fotky
  let mixNow = 0;
  function draw(now, dt) {
    if (!path.length || !compiled) return false;
    keepAround(clamp(Math.round(S), 0, N));
    const k = clamp(Math.floor(S), 0, N);
    let A = path[k], B = path[clamp(k + 1, 0, N)];
    const want = A === B ? 0 : smooth(0.35, 0.65, S - k);
    if (k !== fadeK) { fade = want; fadeK = k; }
    // až keď skrolovanie naozaj stojí (nie medzi dvomi zárezmi kolieska), dokončí sa prelínanie;
    // v prológu vedie čas, prelínanie ide presne podľa neho
    still = Math.abs(V) < 0.03 ? still + dt : 0;
    fadeGoal = pro ? want : still > 0.6 ? Math.round(want) : want;
    fade = pro ? want : fade + (fadeGoal - fade) * (1 - Math.pow(0.02, dt));
    let mix = A === B || !B.ready ? 0 : fade * fin(B, now);
    // prológ začína vždy svojím záberom (fasáda), nikdy záberom úvodu, keby sa náhodou načítal skôr
    if (pro && !A.ready) return false;
    if (!A.ready) {
      // záber sa ešte načítava: ostane posledný obraz, ak je to susedný záber, a cieľ sa doň prelnie.
      // Záber z iného miesta stránky (po skoku) sa neukáže, namiesto neho je šero farby stránky.
      const H = held && held.ready && held.pi != null && Math.abs(held.pi - k) <= 1 ? held : B.ready && !dark ? B : null;
      if (!H) { if (shown) { renderer.setRenderTarget(null); renderer.clear(); held = null; } return false; }
      A = H; mix = B.ready && B !== A ? fin(B, now) : 0;
    } else if (held && held !== A && held !== B && held.ready && fin(A, now) < 1) { B = A; A = held; mix = fin(B, now); }
    else if (dark && fin(A, now) < 1) { B = A; A = null; mix = fin(B, now); }   // zo šera po skoku
    if (dark && A && A.ready && fin(A, now) >= 1) dark = false;
    if (mix >= 0.999) { A = B; mix = 0; }
    if (!A && mix <= 0.001) { renderer.setRenderTarget(null); renderer.clear(); return true; }
    if (mix > 0.001) {
      // prelínanie: oba zábery do textúr a spolu na obrazovku (bez prvého záberu len šero)
      vig.value.w = 0;
      renderer.setRenderTarget(rtA); renderer.clear();
      if (A) { A.mesh.visible = true; place(A, now, mix); renderer.render(scene, camera); A.mesh.visible = false; }
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
    mixNow = mix;
    held = mix > 0.5 ? B : A;
    showPlace(held);
    onScreen = new Set((mix > 0.001 ? [A, B] : [A]).filter(Boolean));
    drawn = true;
    // ešte beží prelínanie alebo nábeh novej fotky: kresliť ďalej
    return Math.abs(fadeGoal - fade) > 0.002 || (mix > 0.001 && mix < 0.999) || !A || fin(A, now) < 1;
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

  let cw = 0, ch = 0, cd = 0, drawnAt = 0, compiled = false, firstMs = 0;
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
    if (pro) {
      // prológ: polohu vo filme vedie čas, nie pružina; skrolovanie ho hneď ukončí a ďalej vedie pružina
      if (Math.abs(T - 1) > 0.02) endPro(false);
      else if (pro.t0) S = proS(now);
      V = 0;
    } else {
      // kriticky tlmená pružina: plynulé rozbehnutie aj dobehnutie, žiadne trhnutie pri rýchlom skrole
      const w0 = 5.2;
      V += ((T - S) * w0 * w0 - 2 * w0 * V) * dt; S += V * dt;
      if (Math.abs(T - S) < 0.0004 && Math.abs(V) < 0.0004) { S = T; V = 0; }
      // skok cez menu alebo tlačidlo: žiadna jazda cez celý podnik ani cudzie zábery; film je hneď na cieli
      // a jeho záber sa rozsvieti zo šera, len čo je načítaný (posledný záber zďaleka sa už neukáže)
      if (Math.abs(T - S) > 1.5) { S = T; V = 0; held = null; dark = shown; }
    }
    pmx += (mx - pmx) * (1 - Math.pow(0.02, dt)); pmy += (my - pmy) * (1 - Math.pow(0.02, dt));
    const idle = now - lastInput;
    breath = idle < BREATH_MS ? 1 : Math.max(0, 1 - (idle - BREATH_MS) / 3000);
    const busy = draw(now, dt);
    if (drawn && !shown) {
      shown = true; firstMs = Math.round(performance.now() - tStart);
      if (pro) pro.t0 = now;                                   // prológ beží od prvého nakresleného snímku
      requestAnimationFrame(() => { root.classList.add('world-in'); measurePlace(); wake(); readyDone(true); });
    }
    // prológ sa skončil: film stojí na zábere úvodu a ďalej vedie skrolovanie
    if (pro && pro.t0 && S >= 1) endPro(true);
    // naklonenie telefónu dobehne v pokojových 30 snímkach za sekundu, myš na počítači plynulo
    const moving = !!pro || busy || jobs.length > 0 || Math.abs(T - S) > 0.0004 || Math.abs(V) > 0.0004 || (!phone && (Math.abs(mx - pmx) > 0.0008 || Math.abs(my - pmy) > 0.0008));
    if (!shown) {
      // prvý záber ešte nie je: čakať, a keď nič nepríde (sieť), vrátiť pokojný web.
      // Prológ, ktorý nepríde do 7 s (pomalá sieť), sa vynechá a film začne rovno záberom úvodu.
      if (pro && now - started > 7000) endPro(false);
      if (now - started > 15000) { stop(); return; }
      if (jobs.length) wake(); else setTimeout(wake, 120);   // fotka ide do grafiky: ďalší pás hneď v ďalšej snímke
      last = 0;
    } else if (moving) { quality(dt); if (!raf) raf = requestAnimationFrame(frame); }
    else if (breath > 0) setTimeout(() => { if (!raf && running) raf = requestAnimationFrame(frame); }, 1000 / 30 - 4);   // v pokoji 30 snímok za sekundu
    else last = 0;
  }
  function wake() { if (!raf && running && !lost) raf = requestAnimationFrame(frame); }
  const poke = () => { lastInput = performance.now(); wake(); };

  /* ---------- prológ: úvod ako film ----------
     čas -> poloha S v ceste: 0 = záber prológu (fasáda), 1 = záber úvodu. Najprv chôdza k dverám
     (S 0 -> 0,35, pomalý rozbeh aj dobeh), potom cez šero dnu (prelínanie je medzi 0,35 a 0,65) a
     dojazd na kotvu úvodu. Kým nie je záber úvodu načítaný, kamera pri dverách počká (najviac 4 s). */
  let pro = PRO ? { t0: 0, walk: phone ? 2300 : 2000, into: phone ? 1600 : 1400, wait: 0 } : null;
  const ease = (t) => t * t * (3 - 2 * t), easeOut = (t) => 1 - (1 - t) * (1 - t);
  function proS(now) {
    if (pro.freeze != null) return pro.freeze;               // ladenie: prológ stojí na danej polohe
    const el = now - pro.t0 - pro.wait;
    if (el < pro.walk) return 0.35 * ease(el / pro.walk);
    const hero = path[1];
    if (!(hero && hero.ready) && now - pro.t0 < pro.walk + 4000) { pro.wait = el - pro.walk + pro.wait; return 0.35; }
    return 0.35 + 0.65 * easeOut(Math.min(1, (el - pro.walk) / pro.into));
  }
  function endPro(finished) {
    if (!pro) return;
    pro = null;
    if (finished) { S = 1; V = 0; }
    else if (!shown) { S = targetS(); V = 0; held = null; fadeK = -1; }   // prológ sa ani nezačal: film začne tam, kde návštevník je
    if (PRO) PRO.done = true;                                 // uvoľní sa, len čo zíde z obrazovky (keepAround)
    root.classList.remove('pro');
    lastInput = performance.now(); wake();
  }

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
    SHOTS.forEach((s) => { if (s.loading) s.ctl.abort(); s.loading = null; s.ready = false; s.size = 0; s.drt = null; s.mat.uniforms.uMap.value = blank; s.mat.uniforms.uDepth.value = flat; });
    cw = 0; resize();
  });
  // obsah stránky mení výšku (fotky, rozbalené karty, menu), kotvy sa preto prepočítajú
  let mt;
  const ro = new ResizeObserver(() => { clearTimeout(mt); mt = setTimeout(() => { measure(); wake(); }, 150); });
  ro.observe(d.body);
  function stop() {
    running = false; ac.abort(); ro.disconnect(); clearTimeout(mt); jobs = [];
    if (raf) cancelAnimationFrame(raf);
    SHOTS.forEach(drop);
    renderer.dispose(); try { renderer.forceContextLoss(); } catch (e) { /* nič */ }
    canvas.remove(); placeBox.remove(); quit();
  }

  /* ---------- ladenie: window.BS30_FILM ---------- */
  // goTo(meno, t): skočí na záber bez jazdy; t 0..1 je poloha v jeho pohybe kamery (0,5 = kotva),
  // drží sa mimo prelínania, aby bol záber celý. Vráti false, keď taký záber v stránke nie je.
  api.goTo = (name, t = 0.5) => {
    const s = path.find((x) => x.photo === name);
    if (!s) return false;
    const k = s.pi, a = anchors[k], gap = k < N ? anchors[k + 1] - a : (k > 0 ? a - anchors[k - 1] : innerHeight);
    const y = Math.max(0, Math.round(a + (clamp(t, 0, 1) - 0.5) * 0.7 * gap));
    scrollTo({ top: y, left: 0, behavior: 'instant' });
    sy = scrollY; S = targetS(); V = 0; still = 1; held = null; fadeK = -1; lastInput = performance.now(); wake();
    return true;
  };
  // proFreeze(s): prológ zastaví na polohe s (0 fasáda, 1 úvod) pre snímky; proFreeze(null) ho pustí ďalej
  // od toho miesta. Vráti false, keď prológ nebeží.
  api.proFreeze = (s) => {
    if (!pro) return false;
    if (s == null) { if (pro.freeze != null) { pro.t0 = performance.now() - (pro.freeze < 0.35 ? pro.walk * pro.freeze / 0.35 : pro.walk + pro.into * (pro.freeze - 0.35) / 0.65); pro.wait = 0; } pro.freeze = null; }
    else pro.freeze = clamp(s, 0, 1);
    wake(); return true;
  };
  Object.defineProperty(api, 'state', {
    get: () => ({
      on: true, shown, phone, dpr, cap, S, T: targetS(), mix: mixNow, anchors: anchors.slice(), firstFrameMs: firstMs, pro: !!pro,
      current: path[clamp(Math.round(S), 0, N)] && path[clamp(Math.round(S), 0, N)].photo,
      ready: path.map((s) => ({ shot: s.photo, ready: s.ready, size: s.size, loading: !!s.loading, depth: s.drt ? [s.drt.width, s.drt.height] : null })),
    }),
  });

  maxTex = renderer.capabilities.maxTextureSize || 4096;
  await new Promise((r) => setTimeout(r, 0));                  // vytvorenie grafiky a meranie stránky nie v jednej dlhej úlohe
  resize();
  S = targetS();
  if (pro) { S = 0; V = 0; }                                   // prológ začína záberom fasády
  // prvé použitie shaderu čaká na grafiku: shadery sa preložia vopred a bez čakania
  // (KHR_parallel_shader_compile), nie až pri prvom zábere či prelínaní počas skrolu
  try { await Promise.all([renderer.compileAsync(scene, camera), renderer.compileAsync(postScene, postCam)]); } catch (e) { /* preloží sa pri prvom kreslení */ }
  compiled = true;
  // prvý obraz až keď je načítaný záber na mieste, kde návštevník je; potom sa statická fotka prelnie do filmu
  wake();
})();
