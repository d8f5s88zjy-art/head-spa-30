/*
 * BARBERSHOP 30 – 3D kreslo (autorský štylizovaný symbol).
 * ES modul bez závislostí mimo ./vendor/. API podľa docs/CONTRACT.md §5.
 *
 *   const stage = await createChairStage(canvas, { dpr, mobile, onFirstFrame, quality });
 *   stage.setProgress({ scene: 1, t: 0.4 });  stage.setPointer(x, y);  stage.setVisible(true);
 *   await stage.playIntroSweep();  stage.resize();  stage.renderPoster(w, h, 'uvod-desktop');  stage.dispose();
 */
import * as THREE from './vendor/three.module.min.js';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';
import { RoundedBoxGeometry } from './vendor/RoundedBoxGeometry.js';

const COL = {
  leather: 0x1a1614,
  brass: 0xb5924e,
  satin: 0x15120f,
  key: 0xffd8b4,
  rim: 0xff9a58,
  hemiSky: 0x2a2622,
  hemiGround: 0x0e0d0c,
};

/* ---------- kľúčové snímky kamery (SCENE_MAP, tabuľka „Kamera 3D kresla“) ---------- */
// [t, pos(x,y,z), target(x,y,z), fov, key, rim, pointerFactor]
const KEYS = {
  1: [
    [0.00, [-3.6, 1.55, 4.4], [0.15, 0.72, 0], 32, 1.0, 0.6, 1],
    [1.00, [-2.6, 1.35, 3.3], [0.15, 0.78, 0], 32, 1.0, 0.9, 1],
  ],
  2: [
    [0.00, [-2.6, 1.35, 3.3], [0.15, 0.78, 0], 32, 1.0, 0.9, 1],
    [0.55, [1.3, 1.05, 1.9], [0.62, 0.62, 0.35], 30, 1.1, 1.0, 1],
    [0.80, [1.15, 0.95, 1.55], [0.66, 0.6, 0.38], 28, 1.15, 1.0, 0.6],
    [1.00, [1.15, 0.95, 1.55], [0.66, 0.6, 0.38], 28, 0.9, 0.8, 0],
  ],
  7: [
    [0.00, [2.4, 1.3, 4.2], [0, 0.75, 0], 32, 0.8, 0.7, 1],
    [0.60, [1.9, 1.15, 3.6], [0, 0.78, 0], 32, 1.0, 0.8, 0.7],
    [1.00, [1.9, 1.15, 3.6], [0, 0.78, 0], 32, 1.0, 0.8, 0.5],
  ],
};
const POSTER_VIEWS = {
  'uvod-desktop': { scene: 1, t: 0, mobile: false },
  'uvod-mobile': { scene: 1, t: 0, mobile: true },
  'rezervacia-desktop': { scene: 7, t: 0, mobile: false },
  'rezervacia-mobile': { scene: 7, t: 0, mobile: true },
};

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (v) => { v = clamp01(v); return v * v * (3 - 2 * v); };
const lerp = (a, b, u) => a + (b - a) * u;

function sampleKeys(scene, t) {
  const rows = KEYS[scene] || KEYS[1];
  t = clamp01(t);
  let a = rows[0], b = rows[rows.length - 1];
  for (let i = 0; i < rows.length - 1; i++) {
    if (t >= rows[i][0] && t <= rows[i + 1][0]) { a = rows[i]; b = rows[i + 1]; break; }
  }
  const span = b[0] - a[0];
  const u = span > 0 ? smooth((t - a[0]) / span) : 1;
  const v3 = (p, q) => [lerp(p[0], q[0], u), lerp(p[1], q[1], u), lerp(p[2], q[2], u)];
  return { pos: v3(a[1], b[1]), target: v3(a[2], b[2]), fov: lerp(a[3], b[3], u), key: lerp(a[4], b[4], u), rim: lerp(a[5], b[5], u), ptr: lerp(a[6], b[6], u) };
}

/* ---------- procedurálne textúry ---------- */
function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

// Diamantové prešívanie: výškové pole → normálová mapa (tangentný priestor), + jemné zrno.
function makeStitchNormal(size = 1024, cells = 4, strength = 3.0) {
  const h = new Float32Array(size * size);
  const cell = size / cells;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x + y) / cell, v = (x - y) / cell;          // mriežka otočená o 45°
      const fu = u - Math.floor(u) - 0.5, fv = v - Math.floor(v) - 0.5;
      const au = Math.abs(fu), av = Math.abs(fv);
      const d = Math.max(au, av) * 2;                        // 0 stred → 1 šev
      let z = Math.pow(Math.max(0, 1 - d * d), 0.55);         // vyvýšený vankúšik
      const seam = 1 - Math.min(1, (1 - d) / 0.09);          // mäkký žliabok šva
      if (seam > 0) z -= 0.16 * seam * seam;
      const r = Math.hypot(0.5 - au, 0.5 - av) * 2;          // gombík v priesečníku
      if (r < 0.19) { const k = 1 - r / 0.19; z = Math.min(z, 0.12 - 0.42 * Math.pow(k, 0.5)) + 0.08 * Math.sin(k * 6.5) * k; }
      const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      z += ((n - Math.floor(n)) - 0.5) * 0.035;              // zrno kože
      h[y * size + x] = z;
    }
  }
  const img = new ImageData(size, size), px = img.data;
  const m = size - 1;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (h[y * size + ((x + 1) & m)] - h[y * size + ((x - 1) & m)]) * 0.5 * strength * cells;
      const dy = (h[((y + 1) & m) * size + x] - h[((y - 1) & m) * size + x]) * 0.5 * strength * cells;
      let nx = -dx, ny = dy, nz = 1;
      const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
      const i = (y * size + x) * 4;
      px[i] = (nx * 0.5 + 0.5) * 255; px[i + 1] = (ny * 0.5 + 0.5) * 255; px[i + 2] = (nz * 0.5 + 0.5) * 255; px[i + 3] = 255;
    }
  }
  const c = makeCanvas(size, size);
  c.getContext('2d').putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

// Zrnitý odliatok (bump pre mosadz) – jemný šum.
function makeGrain(size = 256) {
  const c = makeCanvas(size, size), ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size), p = img.data;
  for (let i = 0; i < size * size; i++) {
    const v = 110 + Math.random() * 40;
    p[i * 4] = p[i * 4 + 1] = p[i * 4 + 2] = v; p[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 6);
  return tex;
}

// Zdobená mriežka (podnožka, pás pod sedákom): mosadz s tmavými prelamovanými otvormi.
function makeLattice(w = 512, h = 256) {
  const c = makeCanvas(w, h), ctx = c.getContext('2d');
  ctx.fillStyle = '#e8c977'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#0d0b0a';
  const s = 32;
  for (let y = s; y < h - s; y += s) {
    for (let x = s; x < w - s; x += s) {
      const k = ((x / s) + (y / s)) & 1;
      if (k) { ctx.fillRect(x + 6, y + 6, s - 12, 8); ctx.fillRect(x + 6, y + s - 14, s - 12, 8); }
      else { ctx.fillRect(x + 6, y + 6, 8, s - 12); ctx.fillRect(x + s - 14, y + 6, 8, s - 12); }
    }
  }
  ctx.strokeStyle = '#0d0b0a'; ctx.lineWidth = 6; ctx.strokeRect(s * 0.6, s * 0.6, w - s * 1.2, h - s * 1.2);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

// Kontaktný tieň: radiálny gradient (alfa) na rovine.
function makeContact(size = 256) {
  const c = makeCanvas(size, size), ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(0,0,0,0.9)'); g.addColorStop(0.45, 'rgba(0,0,0,0.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}

/* ---------- geometrické pomôcky ---------- */
function lathe(profile, segments = 72) {
  return new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), segments);
}
function rbox(w, h, d, r = 0.02, seg = 4) { return new RoundedBoxGeometry(w, h, d, seg, r); }

// Uzavretý profil z hladkej stredovej krivky s odsadením ±width/2 (pre liatinové ramená).
function strokeShape(points, width) {
  const curve = new THREE.SplineCurve(points.map(([x, y]) => new THREE.Vector2(x, y)));
  const n = 48, pts = curve.getPoints(n), tang = [], left = [], right = [];
  for (let i = 0; i <= n; i++) {
    const t = curve.getTangent(i / n).normalize();
    const nx = -t.y * width / 2, ny = t.x * width / 2;
    left.push(new THREE.Vector2(pts[i].x + nx, pts[i].y + ny));
    right.push(new THREE.Vector2(pts[i].x - nx, pts[i].y - ny));
  }
  const shape = new THREE.Shape();
  shape.moveTo(left[0].x, left[0].y);
  left.forEach((p) => shape.lineTo(p.x, p.y));
  right.reverse().forEach((p) => shape.lineTo(p.x, p.y));
  shape.closePath();
  return shape;
}
function extrude(shape, depth, bevel, curveSegments = 24) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 4, curveSegments, steps: 1 });
  g.translate(0, 0, -depth / 2);
  g.computeVertexNormals();
  return g;
}
// Tvar opierky: „náhrobný kameň“ – rovné boky, eliptický vrch.
function backShape(hw, hStraight, ry) {
  const s = new THREE.Shape();
  s.moveTo(-hw, 0); s.lineTo(hw, 0); s.lineTo(hw, hStraight);
  s.absellipse(0, hStraight, hw, ry, 0, Math.PI, false, 0);
  s.lineTo(-hw, 0); s.closePath();
  return s;
}
function capsuleBetween(a, b, r, mat) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const len = A.distanceTo(B);
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 4, 16), mat);
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
  return m;
}
function tube(points, r, mat) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  return new THREE.Mesh(new THREE.TubeGeometry(curve, 24, r, 14, false), mat);
}

/* ---------- stavba kresla ---------- */
function buildChair(mats) {
  const g = new THREE.Group();
  const add = (geo, mat, pos, rot) => {
    const m = geo instanceof THREE.Mesh ? geo : new THREE.Mesh(geo, mat);
    if (pos) m.position.set(...pos);
    if (rot) m.rotation.set(...rot);
    g.add(m); return m;
  };

  // Základňa (čierna, zaoblená) + mosadzný prstenec
  add(lathe([[0, 0], [0.47, 0], [0.49, 0.014], [0.49, 0.04], [0.47, 0.062], [0.41, 0.078], [0.27, 0.092], [0.215, 0.11], [0.195, 0.135], [0.195, 0.16], [0, 0.16]]), mats.satin);
  add(new THREE.TorusGeometry(0.445, 0.009, 10, 90), mats.brass, [0, 0.078, 0], [Math.PI / 2, 0, 0]);
  // Kužeľovitý hydraulický stĺp + mosadzný golier
  add(lathe([[0, 0.15], [0.19, 0.15], [0.175, 0.2], [0.15, 0.3], [0.128, 0.38], [0.122, 0.42], [0.136, 0.43], [0.136, 0.455], [0.112, 0.465], [0.105, 0.49], [0, 0.49]]), mats.satin);
  add(new THREE.TorusGeometry(0.138, 0.013, 10, 72), mats.brass, [0, 0.443, 0], [Math.PI / 2, 0, 0]);
  // Krúžok pumpy a páka
  add(new THREE.TorusGeometry(0.285, 0.011, 10, 90), mats.brass, [0, 0.135, 0.02], [Math.PI / 2, 0, 0]);
  add(capsuleBetween([0.13, 0.33, -0.02], [0.43, 0.3, -0.3], 0.012, mats.brass));
  add(new THREE.SphereGeometry(0.026, 20, 14), mats.satin, [0.43, 0.3, -0.3]);

  // Masívna sedačková vaňa (mosadz) + predný čierny panel s mriežkovými pásmi
  add(rbox(1.06, 0.15, 0.84, 0.05), mats.brass, [0, 0.41, 0]);
  add(rbox(0.72, 0.17, 0.04, 0.012), mats.satin, [0, 0.29, 0.40]);
  add(rbox(0.74, 0.055, 0.045, 0.01), mats.lattice, [0, 0.355, 0.405]);
  add(rbox(0.74, 0.05, 0.045, 0.01), mats.lattice, [0, 0.225, 0.405]);
  // Sedák – kožený vankúš s prešívaním
  add(rbox(0.96, 0.14, 0.76, 0.055, 6), mats.leather, [0, 0.545, 0.03]);

  // Ramená: liatinové C‑profily s drážkou a koženým vankúšikom
  const armPts = [[-0.26, 0.44], [-0.275, 0.58], [-0.245, 0.675], [-0.12, 0.712], [0.12, 0.718], [0.30, 0.702], [0.385, 0.655], [0.405, 0.56], [0.385, 0.45]];
  const armGeo = extrude(strokeShape(armPts, 0.058), 0.062, 0.011);
  const grooveGeo = extrude(strokeShape(armPts, 0.012), 0.07, 0);
  for (const sx of [-1, 1]) {
    add(armGeo, mats.brass, [sx * 0.555, 0, 0], [0, -Math.PI / 2, 0]);
    add(grooveGeo, mats.satin, [sx * 0.555, 0, 0], [0, -Math.PI / 2, 0]);
    add(rbox(0.085, 0.04, 0.40, 0.016), mats.pad, [sx * 0.555, 0.742, 0.06]);
    // vzpery sklápania opierky a kĺbové gombíky
    add(capsuleBetween([sx * 0.50, 0.44, -0.16], [sx * 0.445, 0.86, -0.385], 0.019, mats.brass));
    add(new THREE.CylinderGeometry(0.042, 0.042, 0.05, 24), mats.brass, [sx * 0.465, 0.56, -0.30], [0, 0, Math.PI / 2]);
    add(new THREE.CylinderGeometry(0.018, 0.018, 0.012, 16), mats.satin, [sx * 0.497, 0.56, -0.30], [0, 0, Math.PI / 2]);
  }

  // Opierka chrbta: mosadzná škrupina + prešívaný kožený vankúš + opierka hlavy
  const back = new THREE.Group();
  back.position.set(0, 0.50, -0.30); back.rotation.x = -0.21;
  const shell = new THREE.Mesh(extrude(backShape(0.39, 0.42, 0.34), 0.06, 0.016), mats.brass);
  shell.position.z = -0.03; back.add(shell);
  const cushion = new THREE.Mesh(extrude(backShape(0.345, 0.40, 0.29), 0.05, 0.034), mats.leather);
  cushion.position.set(0, 0.025, 0.055); back.add(cushion);
  const post = new THREE.Mesh(rbox(0.07, 0.32, 0.026, 0.01), mats.satin);
  post.position.set(0, 0.86, -0.03); back.add(post);
  const head = new THREE.Mesh(rbox(0.36, 0.115, 0.095, 0.035, 5), mats.pad);
  head.position.set(0, 1.04, 0.025); back.add(head);
  const headKnob = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.01, 16), mats.brass);
  headKnob.position.set(0, 0.78, -0.075); headKnob.rotation.x = Math.PI / 2; back.add(headKnob);
  g.add(back);

  // Podnožka: zdobená mriežková platňa na kĺbe + dve prehnuté ramená + gumené nožičky
  const foot = new THREE.Group(); foot.position.set(0, 0, 0.58);
  const plate = new THREE.Mesh(rbox(0.52, 0.034, 0.30, 0.012), mats.lattice);
  plate.position.set(0, 0.20, 0); plate.rotation.x = 0.5; foot.add(plate);
  const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.56, 18), mats.brass);
  hinge.position.set(0, 0.272, -0.13); hinge.rotation.z = Math.PI / 2; foot.add(hinge);
  g.add(foot);
  for (const sx of [-1, 1]) {
    add(tube([[sx * 0.31, 0.37, 0.36], [sx * 0.33, 0.31, 0.50], [sx * 0.27, 0.26, 0.58], [sx * 0.21, 0.24, 0.66], [sx * 0.19, 0.15, 0.70]], 0.02, mats.brass));
    add(new THREE.CylinderGeometry(0.02, 0.024, 0.11, 14), mats.satin, [sx * 0.19, 0.055, 0.70]);
  }

  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

/* ---------- javisko ---------- */
export async function createChairStage(canvas, options = {}) {
  const mobile = !!options.mobile;
  const quality = options.quality === 'low' ? 'low' : 'high';
  const dprCap = Math.min(window.devicePixelRatio || 1, options.dpr || (mobile ? 1.25 : 1.5));

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, premultipliedAlpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: false });
  renderer.setPixelRatio(dprCap);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = quality !== 'low';
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 40);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = envRT.texture;
  pmrem.dispose();

  const stitch = makeStitchNormal(1024, 4, 3.2);
  const grain = makeGrain(256);
  const latticeTex = makeLattice();
  const contactTex = makeContact();

  const mats = {
    leather: new THREE.MeshPhysicalMaterial({ color: COL.leather, roughness: 0.55, metalness: 0, clearcoat: 0.22, clearcoatRoughness: 0.5, sheen: 0.25, sheenColor: 0x6b4a2e, sheenRoughness: 0.6, normalMap: stitch, normalScale: new THREE.Vector2(1, 1), envMapIntensity: 0.35 }),
    pad: new THREE.MeshPhysicalMaterial({ color: COL.leather, roughness: 0.5, metalness: 0, clearcoat: 0.25, clearcoatRoughness: 0.45, sheen: 0.25, sheenColor: 0x6b4a2e, envMapIntensity: 0.35 }),
    brass: new THREE.MeshPhysicalMaterial({ color: COL.brass, metalness: 1, roughness: 0.32, bumpMap: grain, bumpScale: 0.0012, envMapIntensity: 0.55 }),
    lattice: new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: latticeTex, bumpMap: latticeTex, bumpScale: -0.006, metalness: 1, roughness: 0.36, envMapIntensity: 0.55 }),
    satin: new THREE.MeshPhysicalMaterial({ color: COL.satin, roughness: 0.45, metalness: 0.25, clearcoat: 0.3, clearcoatRoughness: 0.35, envMapIntensity: 0.45 }),
  };
  mats.lattice.color.setHex(0xb5924e).multiplyScalar(1.15);
  stitch.repeat.set(2, 2);

  let chair = buildChair(mats);
  scene.add(chair);

  // Podlaha: skutočný tieň + kontaktný gradient
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.55, transparent: true }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const contact = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.9), new THREE.MeshBasicMaterial({ map: contactTex, transparent: true, depthWrite: false, opacity: 0.85 }));
  contact.rotation.x = -Math.PI / 2; contact.position.set(0.02, 0.002, 0.08); contact.scale.set(1, 0.9, 1); scene.add(contact);

  // Svetlá
  const KEY_BASE = new THREE.Vector3(-2.3, 3.2, 2.7);
  const key = new THREE.SpotLight(COL.key, 1, 14, 0.62, 0.65, 1.6);
  key.position.copy(KEY_BASE); key.target.position.set(0, 0.7, 0);
  key.castShadow = quality !== 'low';
  key.shadow.mapSize.set(1024, 1024); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.015;
  key.shadow.camera.near = 1; key.shadow.camera.far = 10;
  scene.add(key, key.target);
  const rim = new THREE.SpotLight(COL.rim, 1, 14, 0.42, 0.5, 1.6);
  rim.position.set(2.6, 2.3, -2.7); rim.target.position.set(0, 0.8, 0);
  scene.add(rim, rim.target);
  const hemi = new THREE.HemisphereLight(COL.hemiSky, COL.hemiGround, 2.2);
  scene.add(hemi);
  const KEY_I = 38, RIM_I = 46;

  // Stav
  const state = { scene: 1, t: 0, mobile };
  const ptr = { tx: 0, ty: 0, x: 0, y: 0 };
  let sweep = null, dirty = true, visible = true, rafId = 0, disposed = false, firstFrame = false;

  function applyCamera(k, isMobile) {
    const target = new THREE.Vector3(...k.target);
    const pos = new THREE.Vector3(...k.pos);
    if (isMobile) { pos.sub(target).multiplyScalar(1.25).add(target); target.y += 0.15; pos.y += 0.15; }
    camera.position.copy(pos); camera.lookAt(target); camera.fov = k.fov; camera.updateProjectionMatrix();
  }
  function applyLights(k, sweepOff, sweepGain) {
    key.position.set(KEY_BASE.x + ptr.x * k.ptr + sweepOff.x, KEY_BASE.y + ptr.y * k.ptr + sweepOff.y, KEY_BASE.z + sweepOff.z);
    key.intensity = KEY_I * k.key * sweepGain;
    rim.intensity = RIM_I * k.rim;
  }
  function frame(now) {
    rafId = 0;
    if (disposed) return;
    let more = false;
    // kurzor: dobeh 0.08
    const dx = ptr.tx - ptr.x, dy = ptr.ty - ptr.y;
    if (Math.abs(dx) > 0.0008 || Math.abs(dy) > 0.0008) { ptr.x += dx * 0.08; ptr.y += dy * 0.08; dirty = true; more = true; }
    else if (dx || dy) { ptr.x = ptr.tx; ptr.y = ptr.ty; dirty = true; }
    const off = new THREE.Vector3(), gain = { v: 1 };
    if (sweep) {
      const s = clamp01((now - sweep.start) / sweep.dur);
      // 0–0.78: prejazd zľava spredu (koža) cez bok (kov) dozadu doprava (silueta); 0.78–1: návrat do kľúčovej polohy
      if (s < 0.78) {
        const u = smooth(s / 0.78);
        off.set(lerp(-1.6, 5.2, u), lerp(-0.6, -0.4, u), lerp(0.4, -5.0, u));
        gain.v = 0.75 + 0.55 * Math.sin(u * Math.PI);
      } else {
        const u = smooth((s - 0.78) / 0.22);
        off.set(lerp(5.2, 0, u), lerp(-0.4, 0, u), lerp(-5.0, 0, u));
        gain.v = lerp(0.3, 1, u) * (u < 0.5 ? 0.5 + u : 1);
      }
      dirty = true; more = true;
      if (s >= 1) { const r = sweep.resolve; sweep = null; off.set(0, 0, 0); gain.v = 1; more = false; r(); }
    }
    if (dirty) {
      const k = sampleKeys(state.scene, state.t);
      applyCamera(k, state.mobile); applyLights(k, off, gain.v);
      renderer.render(scene, camera);
      dirty = false;
      if (!firstFrame) { firstFrame = true; if (typeof options.onFirstFrame === 'function') options.onFirstFrame(); }
    }
    if (more && visible) rafId = requestAnimationFrame(frame);
  }
  function schedule() { if (visible && !rafId && !disposed) rafId = requestAnimationFrame(frame); }
  function resize() {
    const w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight;
    renderer.setPixelRatio(dprCap);
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    dirty = true; schedule();
  }

  // Voliteľný GLB (fotogrametria): ak existuje, nahradí procedurálne kreslo; pri chybe ticho ostáva procedurálne.
  async function tryLoadGLB() {
    const url = new URL('./model/kreslo.glb', import.meta.url).href;
    try {
      const head = await fetch(url, { method: 'HEAD' });
      if (!head.ok) return;
      const { GLTFLoader } = await import('./vendor/GLTFLoader.js');
      const gltf = await new GLTFLoader().loadAsync(url);
      const model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3(); box.getSize(size);
      const sc = 1.6 / Math.max(size.y, 1e-6);
      model.scale.setScalar(sc);
      box.setFromObject(model);
      const c = new THREE.Vector3(); box.getCenter(c);
      model.position.set(-c.x, -box.min.y, -c.z);
      model.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; if (o.material && 'envMapIntensity' in o.material) o.material.envMapIntensity = 0.55; } });
      if (disposed) return;
      scene.remove(chair); chair = model; scene.add(model);
      dirty = true; schedule();
    } catch (_) { /* fallback: procedurálne kreslo */ }
  }

  resize();
  renderer.compile(scene, camera);
  frame(performance.now());
  tryLoadGLB();

  const api = {
    setProgress({ scene: sc, t }) {
      const ns = KEYS[sc] ? sc : state.scene, nt = clamp01(Number(t) || 0);
      if (ns !== state.scene || Math.abs(nt - state.t) > 1e-5) { state.scene = ns; state.t = nt; dirty = true; schedule(); }
    },
    setPointer(x, y) {
      if (mobile) return;
      ptr.tx = (clamp01(x) - 0.5) * 2 * 0.35;
      ptr.ty = (0.5 - clamp01(y)) * 2 * 0.22;
      schedule();
    },
    setVisible(v) {
      visible = !!v;
      if (!visible && rafId) { cancelAnimationFrame(rafId); rafId = 0; }
      else if (visible) { dirty = true; schedule(); }
    },
    playIntroSweep() {
      if (sweep) return sweep.promise;
      let resolve; const promise = new Promise((r) => { resolve = r; });
      sweep = { start: performance.now(), dur: mobile ? 1000 : 1400, resolve, promise };
      if (!visible) { sweep = null; resolve(); return promise; }
      schedule();
      return promise;
    },
    resize,
    renderPoster(width, height, view) {
      const v = POSTER_VIEWS[view] || POSTER_VIEWS['uvod-desktop'];
      const prevSize = new THREE.Vector2(); renderer.getSize(prevSize);
      const prevPR = renderer.getPixelRatio();
      renderer.setPixelRatio(1); renderer.setSize(width, height, false);
      camera.aspect = width / height;
      const k = sampleKeys(v.scene, v.t);
      const savedPtr = [ptr.x, ptr.y]; ptr.x = 0; ptr.y = 0;
      applyCamera(k, v.mobile); applyLights(k, new THREE.Vector3(), 1);
      renderer.render(scene, camera);
      const url = canvas.toDataURL('image/png');
      ptr.x = savedPtr[0]; ptr.y = savedPtr[1];
      renderer.setPixelRatio(prevPR); renderer.setSize(prevSize.x, prevSize.y, false);
      camera.aspect = prevSize.x / prevSize.y;
      dirty = true; schedule();
      return url;
    },
    dispose() {
      disposed = true;
      if (rafId) cancelAnimationFrame(rafId);
      if (sweep) { sweep.resolve(); sweep = null; }
      scene.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); } });
      Object.values(mats).forEach((m) => m.dispose());
      [stitch, grain, latticeTex, contactTex].forEach((t) => t.dispose());
      floor.material.dispose(); contact.material.dispose();
      envRT.dispose();
      renderer.dispose();
    },
  };
  return api;
}
