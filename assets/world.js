/* HEAD SPA 30: 3D prehliadka salónu.
   Celý web je jedna prechádzka: zelené dvere sa otvoria a kamera ide chodbou salónu. Každá časť
   webu má svoje miesto, fotka salónu v mosadznom ráme. Na konci svieti lotos zo značky.
   Scéna je iba pozadie: text, formuláre a tlačidlá ostávajú v HTML nad ňou.
   Materiály sú odpísané z fotiek: orech v rybej kosti, tapeta s listami, fľaškovo zelené dvere,
   mosadz a teplé svetlo. Keď 3D nejde (bez WebGL, obmedzenie pohybu, šetrenie dát), web ostáva
   s pokojným úvodom a nič sa nenačíta. */
(async function () {
  'use strict';
  const d = document, root = d.documentElement;
  // či sa 3D použije, rozhodol už skript v hlavičke (trieda .world), aby obsah pri štarte neskočil
  if (!root.classList.contains('world')) return;

  const here = d.currentScript ? d.currentScript.src : location.href;
  if (d.readyState !== 'complete') await new Promise((r) => addEventListener('load', r, { once: true }));
  // scéna sa stavia až keď sa návštevník pohne (dotyk, myš, skrolovanie, klávesnica); dovtedy je
  // v úvode fotka miestnosti, takže otvorenie stránky nič nebrzdí a kto len nazrie, nič nesťahuje
  await new Promise((r) => {
    const go = () => { ['pointerdown', 'pointermove', 'touchstart', 'wheel', 'scroll', 'keydown'].forEach((e) => removeEventListener(e, go)); r(); };
    ['pointerdown', 'pointermove', 'touchstart', 'wheel', 'scroll', 'keydown'].forEach((e) => addEventListener(e, go, { passive: true }));
  });
  const src = window.HS30_THREE || new URL('vendor/three.module.min.js', here).href;
  let THREE;
  try { THREE = await import(src); } catch (e) { root.classList.remove('world'); return; }

  const phone = matchMedia('(max-width: 720px)').matches;
  const pause = () => new Promise((r) => setTimeout(r, 0));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const ease = (t) => t * t * (3 - 2 * t);

  /* ---------- renderer, scéna, kamera ---------- */
  const canvas = d.createElement('canvas');
  canvas.className = 'world-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  d.body.prepend(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !phone, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, phone ? 1 : 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  const INK = 0x0d0a07;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(INK);
  scene.fog = new THREE.FogExp2(INK, phone ? 0.055 : 0.042);
  const camera = new THREE.PerspectiveCamera(phone ? 64 : 46, 1, 0.1, 80);

  /* ---------- textúry kreslené v prehliadači (nič sa nesťahuje) ---------- */
  function canvasTex(w, h, draw, rx, ry) {
    const c = d.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx || 1, ry || 1);
    t.anisotropy = phone ? 2 : 8;
    return t;
  }
  // parkety rybia kosť z orecha
  const parquet = canvasTex(512, 512, (g, w) => {
    g.fillStyle = '#2a1a0e'; g.fillRect(0, 0, w, w);
    const L = 128, S = 32, tones = ['#4a2e18', '#422814', '#52341c', '#3c2412', '#5a3a20'];
    for (let y = -L; y < w + L; y += S) {
      for (let x = -L; x < w + L; x += L) {
        for (let k = 0; k < 2; k++) {
          g.save(); g.translate(x + k * S + (y / S % 2) * 0, y); g.rotate(k ? Math.PI / 4 : -Math.PI / 4);
          g.fillStyle = tones[Math.abs((x * 7 + y * 3 + k * 5) / S | 0) % tones.length];
          g.fillRect(0, 0, L * 0.72, S * 0.72 - 1.5);
          g.globalAlpha = 0.18; g.fillStyle = '#000';
          for (let s = 0; s < 6; s++) g.fillRect(0, (S * 0.72 / 6) * s, L * 0.72, 0.6);
          g.restore();
        }
      }
    }
  }, 6, 22);
  // tapeta so zlatohnedými listami, veľmi tlmená
  const wallpaper = canvasTex(512, 512, (g, w) => {
    g.fillStyle = '#17120c'; g.fillRect(0, 0, w, w);
    g.strokeStyle = 'rgba(201,150,90,.28)'; g.lineWidth = 2; g.lineCap = 'round';
    const frond = (x, y, len, ang) => {
      g.save(); g.translate(x, y); g.rotate(ang);
      g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(len * 0.2, -len * 0.5, 0, -len); g.stroke();
      for (let i = 1; i < 9; i++) {
        const t = i / 9, py = -len * t, px = Math.sin(t * 3) * len * 0.06, l = len * 0.32 * (1 - t * 0.6);
        g.beginPath(); g.moveTo(px, py); g.quadraticCurveTo(px - l * 0.6, py - l * 0.1, px - l, py + l * 0.35); g.stroke();
        g.beginPath(); g.moveTo(px, py); g.quadraticCurveTo(px + l * 0.6, py - l * 0.1, px + l, py + l * 0.35); g.stroke();
      }
      g.restore();
    };
    for (let i = 0; i < 9; i++) frond(40 + (i % 3) * 170 + (i / 3 | 0) * 30, 180 + (i / 3 | 0) * 170, 150, (i % 2 ? 0.3 : -0.25));
  }, 16, 1.4);
  // teplý svit na podlahe pod obrazom
  const glowTex = canvasTex(256, 256, (g, w) => {
    const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    r.addColorStop(0, 'rgba(255,196,120,.55)'); r.addColorStop(0.45, 'rgba(240,166,90,.16)'); r.addColorStop(1, 'rgba(240,166,90,0)');
    g.fillStyle = r; g.fillRect(0, 0, w, w);
  });
  glowTex.wrapS = glowTex.wrapT = THREE.ClampToEdgeWrapping;

  await pause();
  /* ---------- materiály ---------- */
  const M = {
    floor: new THREE.MeshStandardMaterial({ map: parquet, roughness: 0.5, metalness: 0.05, color: 0xb8a28c }),
    wall: new THREE.MeshStandardMaterial({ map: wallpaper, roughness: 0.95, color: 0x9a8a78 }),
    door: new THREE.MeshStandardMaterial({ color: 0x12241a, roughness: 0.5, metalness: 0.02 }),
    doorFrame: new THREE.MeshStandardMaterial({ color: 0x0f1e16, roughness: 0.55 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xc9a66b, roughness: 0.28, metalness: 1 }),
    backing: new THREE.MeshStandardMaterial({ color: 0x100c08, roughness: 0.9 }),
    glow: new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
    lotus: new THREE.MeshStandardMaterial({ color: 0x3a2a14, emissive: 0xf3c98a, emissiveIntensity: 1.6, roughness: 0.4, metalness: 0.3 })
  };

  /* ---------- chodba ---------- */
  const LEN = 96, Z0 = 8;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, LEN), M.floor);
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, Z0 - LEN / 2); scene.add(floor);
  for (const side of [-1, 1]) {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(LEN, 5.2), M.wall);
    w.rotation.y = side * -Math.PI / 2; w.position.set(side * 4.6, 2.6, Z0 - LEN / 2); scene.add(w);
  }

  await pause();
  /* ---------- zelené dvere s mosadznými kruhmi ---------- */
  const door = new THREE.Group(); scene.add(door);
  const box = (w, h, dp, m, x, y, z, parent) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, dp), m); b.position.set(x, y, z); (parent || door).add(b); return b; };
  // stena okolo dverí
  box(3.4, 5.2, 0.2, M.wall, -3.0, 2.6, -0.1); box(3.4, 5.2, 0.2, M.wall, 3.0, 2.6, -0.1); box(3.1, 2.3, 0.2, M.wall, 0, 4.05, -0.1);
  // rám
  box(0.16, 2.95, 0.32, M.doorFrame, -1.23, 1.47, 0); box(0.16, 2.95, 0.32, M.doorFrame, 1.23, 1.47, 0); box(2.62, 0.18, 0.32, M.doorFrame, 0, 2.95, 0);
  const leaves = [];
  for (const side of [-1, 1]) {
    const hinge = new THREE.Group(); hinge.position.set(side * 1.15, 0, 0); door.add(hinge);
    const leaf = new THREE.Group(); leaf.position.set(-side * 0.575, 0, 0); hinge.add(leaf);
    box(1.14, 2.84, 0.07, M.door, 0, 1.42, 0, leaf);
    // kazety: vysoká hore, dve nízke dole
    for (const [h, y] of [[1.3, 1.95], [0.34, 0.95], [0.46, 0.45]]) {
      box(0.78, h, 0.03, M.doorFrame, 0, y, 0.05, leaf);
      box(0.66, h - 0.12, 0.03, M.door, 0, y, 0.07, leaf);
    }
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.013, 12, 48), M.brass);
    ring.position.set(0, 1.18, 0.1); leaf.add(ring);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 12), M.brass); knob.position.set(0, 1.3, 0.1); leaf.add(knob);
    if (side > 0) { box(0.03, 0.26, 0.03, M.brass, -0.5, 1.05, 0.1, leaf); box(0.16, 0.025, 0.03, M.brass, -0.43, 1.12, 0.14, leaf); }
    leaves.push({ hinge, side });
  }
  const doorLight = new THREE.SpotLight(0xffd29a, phone ? 44 : 50, 12, 0.62, 0.7, 1.4);
  doorLight.position.set(0, 4.6, 3.4); doorLight.target.position.set(0, 1.3, 0); scene.add(doorLight, doorLight.target);
  // za dverami svieti miestnosť; keď sa otvoria, teplé svetlo presvitne von
  const inside = new THREE.PointLight(0xffb870, 0, 10, 1.4); inside.position.set(0, 1.6, -2.2); scene.add(inside);

  /* ---------- miesta: fotky salónu v mosadzných rámoch ---------- */
  const pick = (name) => {
    const img = d.querySelector(`img[data-photo="${name}"]`);
    if (!img) return null;
    const s = img.getAttribute('src') || '';
    return s.startsWith('data:') ? s : s.replace(/-800\.jpg$/, '-800.webp');
  };
  const loader = new THREE.TextureLoader();
  let live = false;   // fotka môže prísť skôr, než beží kreslenie; vtedy ju zachytí prvý snímok
  function framed(name, w, h, x, y, z, ry, parent) {
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; (parent || scene).add(g);
    const b = 0.06, dp = 0.08;
    const back = new THREE.Mesh(new THREE.BoxGeometry(w + b * 2, h + b * 2, 0.04), M.backing); back.position.z = -0.03; g.add(back);
    for (const [fw, fh, fx, fy] of [[w + b * 2, b, 0, h / 2 + b / 2], [w + b * 2, b, 0, -h / 2 - b / 2], [b, h, -w / 2 - b / 2, 0], [b, h, w / 2 + b / 2, 0]]) {
      const f = new THREE.Mesh(new THREE.BoxGeometry(fw, fh, dp), M.brass); f.position.set(fx, fy, 0); g.add(f);
    }
    const mat = new THREE.MeshBasicMaterial({ color: 0x2a241e });
    const url = pick(name);
    if (url) loader.load(url, (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = phone ? 2 : 8; mat.map = t; mat.color.set(0xd8cfc2); mat.needsUpdate = true; if (live) wake(); });
    const pic = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); pic.position.z = 0.012; g.add(pic);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(w * 2.2, w * 1.6), M.glow);
    glow.rotation.x = -Math.PI / 2; glow.position.set(0, -y + 0.01, 0.9); g.add(glow);
    return g;
  }
  // časti webu v poradí; každá má pohľad kamery a cieľ, kam kamera hľadí
  const SECTIONS = ['ritual', 'cennik', 'rezervacia', 'poukaz', 'salon', 'galeria', 'faq', 'kontakt'];
  const PHOTOS = { ritual: 'voda', cennik: 'miestnost', rezervacia: 'lozka-sviecka', poukaz: 'komoda', salon: 'okna', faq: 'neon-spa' };
  const views = [{ pos: new THREE.Vector3(-1.35, 1.5, 5.2), look: new THREE.Vector3(-1.35, 1.4, 0) }];   // dvere; text je vľavo, dvere vpravo
  if (phone) { views[0].pos.set(0, 1.5, 6.4); views[0].look.set(0, 1.85, 0); }
  let z = -5.5, lotusAt = null;
  SECTIONS.forEach((id, i) => {
    const side = i % 2 ? -1 : 1;
    if (PHOTOS[id]) {
      const x = side * 2.25, h = 2.5, w = h * 0.75;
      framed(PHOTOS[id], w, h, x, 1.75, z, -side * 0.62);
      if (id === 'salon') framed('buddha', w * 0.8, h * 0.8, -x * 0.95, 1.65, z - 1.2, side * 0.62);
      views.push({ pos: new THREE.Vector3(side * (phone ? 0.9 : 0.4), 1.6, z + (phone ? 4.6 : 3.6)), look: new THREE.Vector3(x * (phone ? 0.92 : 0.8), 1.72, z) });
    } else if (id === 'galeria') {
      // stena s fotkami po oboch stranách chodby
      const names = ['neon-head-spa', 'lozka-spa', 'lozko', 'spa-relax-lozko', 'zhora', 'buddha'];
      names.forEach((n, k) => { const s = k % 2 ? -1 : 1; framed(n, 1.4, 1.87, s * 2.9, 1.85, z + 1.2 - (k >> 1) * 2.6, -s * 1.1); });
      views.push({ pos: new THREE.Vector3(0, 1.62, z + 4.2), look: new THREE.Vector3(0, 1.7, z - 4) });
      z -= 3;
    } else if (id === 'kontakt') {
      // koniec chodby: stena s nápisom a svietiaci lotos pred ňou
      const end = new THREE.Mesh(new THREE.PlaneGeometry(9.2, 5.2), M.wall); end.position.set(0, 2.6, z - 2.2); scene.add(end);
      framed('neon-head-spa', 2.1, 2.8, 0, 2.0, z - 2.1, 0);
      lotusAt = new THREE.Vector3(0, 1.0, z - 0.6);
      views.push({ pos: new THREE.Vector3(0, 1.55, z + (phone ? 5.2 : 4.2)), look: new THREE.Vector3(0, 1.6, z - 1.5) });
    }
    z -= 8.5;
  });

  await pause();
  /* ---------- lotos zo značky ako zlatá svietiaca línia ---------- */
  function lotusMesh() {
    const P = 'M32 19c3.6 4.6 4.6 10.6 0 18.5c-4.6-7.9-3.6-13.9 0-18.5zM32 37.5c-5.2-1-9.6-5.2-10.8-11.4c5.3 1.1 8.9 5 10.8 11.4zM32 37.5c5.2-1 9.6-5.2 10.8-11.4c-5.3 1.1-8.9 5-10.8 11.4zM32 38.6c-7.2 0-12.6-2.9-15.6-7c6.2-.6 11.6 2 15.6 7zM32 38.6c7.2 0 12.6-2.9 15.6-7c-6.2-.6-11.6 2-15.6 7z';
    const g = new THREE.Group();
    const tok = P.match(/[Mcz]|-?\d*\.?\d+/g);
    let i = 0, cx = 0, cy = 0, sx = 0, sy = 0, pts = [];
    const flush = () => { if (pts.length > 2) { const curve = new THREE.CatmullRomCurve3(pts, true); g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 80, 0.35, 8, true), M.lotus)); } pts = []; };
    const V = (x, y) => new THREE.Vector3(x - 32, -(y - 30), 0);
    while (i < tok.length) {
      const t = tok[i++];
      if (t === 'M') { flush(); cx = +tok[i++]; cy = +tok[i++]; sx = cx; sy = cy; pts.push(V(cx, cy)); }
      else if (t === 'c') {
        while (i < tok.length && !/[Mcz]/.test(tok[i])) {
          const a = [+tok[i], +tok[i + 1], +tok[i + 2], +tok[i + 3], +tok[i + 4], +tok[i + 5]]; i += 6;
          const p0 = [cx, cy], p1 = [cx + a[0], cy + a[1]], p2 = [cx + a[2], cy + a[3]], p3 = [cx + a[4], cy + a[5]];
          for (let s = 1; s <= 8; s++) { const u = s / 8, m = 1 - u; pts.push(V(m * m * m * p0[0] + 3 * m * m * u * p1[0] + 3 * m * u * u * p2[0] + u * u * u * p3[0], m * m * m * p0[1] + 3 * m * m * u * p1[1] + 3 * m * u * u * p2[1] + u * u * u * p3[1])); }
          cx = p3[0]; cy = p3[1];
        }
      } else if (t === 'z') { pts.pop(); flush(); cx = sx; cy = sy; }
    }
    g.scale.setScalar(0.034);
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), M.glow); halo.position.z = -2; g.add(halo);
    return g;
  }
  const lotus = lotusMesh(); scene.add(lotus);
  if (lotusAt) lotus.position.copy(lotusAt);
  const lotusLight = new THREE.PointLight(0xffc98a, 6, 6, 1.8); lotus.add(lotusLight);

  /* ---------- svetlo: tlmené okolie a lampa, ktorá ide s kamerou ---------- */
  scene.add(new THREE.HemisphereLight(0xffe2b8, 0x2a1a0e, 1.0));
  const lantern = new THREE.PointLight(0xffc98a, phone ? 20 : 26, 14, 1.5);
  scene.add(lantern);

  /* ---------- cesta kamery podľa skrolovania ---------- */
  const posCurve = new THREE.CatmullRomCurve3(views.map((v) => v.pos), false, 'centripetal');
  const lookCurve = new THREE.CatmullRomCurve3(views.map((v) => v.look), false, 'centripetal');
  const N = views.length - 1;
  let anchors = [];
  function measure() {
    const vh = innerHeight;
    anchors = [0].concat(SECTIONS.map((id) => { const el = d.getElementById(id); return el ? el.getBoundingClientRect().top + scrollY - vh * 0.45 : 0; }));
    for (let k = 1; k < anchors.length; k++) anchors[k] = Math.max(anchors[k], anchors[k - 1] + 1);
  }
  function targetS() {
    const y = scrollY;
    if (y <= anchors[0]) return 0;
    for (let k = 1; k < anchors.length; k++) if (y < anchors[k]) return k - 1 + ease((y - anchors[k - 1]) / (anchors[k] - anchors[k - 1]));
    return N;
  }

  let S = 0, T = 0, mx = 0, my = 0, pmx = 0, pmy = 0, raf = 0, last = 0, running = true;
  const tmpL = new THREE.Vector3();
  live = true;
  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    measure(); wake();
  }
  function frame(now) {
    raf = 0;
    if (!running) return;
    const dt = Math.min(0.1, (now - (last || now)) / 1000); last = now;
    T = targetS();
    S += (T - S) * (1 - Math.pow(0.001, dt));               // mäkké dobiehanie, kamera nikdy neskočí
    pmx += (mx - pmx) * (1 - Math.pow(0.01, dt)); pmy += (my - pmy) * (1 - Math.pow(0.01, dt));
    const u = clamp(S / N, 0, 1);
    posCurve.getPoint(u, camera.position);
    lookCurve.getPoint(u, tmpL);
    camera.position.x += pmx * 0.18; camera.position.y += pmy * 0.1;
    camera.lookAt(tmpL);
    // dvere sa otvoria v prvej časti cesty
    const open = ease(clamp(S / 0.55, 0, 1));
    inside.intensity = open * 18;
    for (const l of leaves) l.hinge.rotation.y = -l.side * open * 1.75;
    lantern.position.copy(camera.position).add(tmpL.sub(camera.position).normalize().multiplyScalar(2.2)).setY(2.6);
    lotus.rotation.y = Math.sin(now / 1000 * 0.3) * 0.35;   // jemné pohupovanie, nikdy nie z boku
    lotusLight.intensity = 5 + Math.sin(now / 1000 * 0.63) * 0.8;   // svit ako LED pás, pomalé nadýchnutie
    renderer.render(scene, camera);
    const moving = Math.abs(T - S) > 0.0005 || Math.abs(mx - pmx) > 0.001;
    // počas pohybu plné tempo, v pokoji len pomalý lotos a svit
    // kreslí sa len pri pohybe; v pokoji iba pomalé dýchanie lotosu, a to len keď je na obrazovke
    if (moving) raf = requestAnimationFrame(frame);
    else if (S > N - 1.2) setTimeout(() => { if (!raf) raf = requestAnimationFrame(frame); }, 80);
  }
  function wake() { if (!raf && running) raf = requestAnimationFrame(frame); }

  addEventListener('scroll', wake, { passive: true });
  addEventListener('resize', resize, { passive: true });
  if (!phone) addEventListener('pointermove', (e) => { mx = e.clientX / innerWidth - 0.5; my = -(e.clientY / innerHeight - 0.5); wake(); }, { passive: true });
  d.addEventListener('visibilitychange', () => { running = !d.hidden; if (running) { last = 0; wake(); } });
  // obsah stránky mení výšku (fotky, rozbalené karty), kotvy sa preto prepočítajú
  let mt; new ResizeObserver(() => { clearTimeout(mt); mt = setTimeout(() => { measure(); wake(); }, 150); }).observe(d.body);

  resize();
  // shadery sa skompilujú na pozadí (KHR_parallel_shader_compile), až potom prvý obraz
  if (renderer.extensions.has('KHR_parallel_shader_compile')) { try { await renderer.compileAsync(scene, camera); } catch (e) { /* skompiluje sa pri prvom kreslení */ } }
  await pause();
  renderer.render(scene, camera);
  requestAnimationFrame(() => root.classList.add('world-in'));
  wake();
})();
