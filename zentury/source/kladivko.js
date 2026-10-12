// ZENTURY – 3D sudcovské kladivko v úvode. Zdroj; na web ide zostavené assets/kladivko.min.js (source/zostav-3d.sh).
// Načíta ho site.js až po prvom vykreslení stránky.
// Svetlo ide za kurzorom (na telefóne za prstom), kladivko sa nakláňa, pri kliknutí udrie.
// Bez WebGL alebo pri obmedzenom pohybe ostane statický obrázok kladivka (assets/img/kladivko-*.webp, vyrobí source/plagat.mjs).
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, LatheGeometry, Vector2, Vector3,
  MeshPhysicalMaterial, MeshStandardMaterial, MeshBasicMaterial, BoxGeometry, PointLight, DirectionalLight,
  HemisphereLight, CanvasTexture, RepeatWrapping, SRGBColorSpace, ACESFilmicToneMapping, PMREMGenerator,
  BackSide, MathUtils,
} from './vendor/three.module.min.js';

const { lerp, clamp } = MathUtils;

// ---------- drevo: textúra vlákien kreslená v canvase (bez obrázkov na stiahnutie) ----------
function drevo(w = 1024, h = 1024, seed = 3) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  let s = seed; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  // základ: tmavý mahagón
  g.fillStyle = '#3a170b'; g.fillRect(0, 0, w, h);
  // vlákna idú pozdĺž osi (v textúre zvisle), mierne sa vlnia
  for (let i = 0; i < 520; i++) {
    const x = rnd() * w, wid = 0.6 + rnd() * 3.2, a = 0.05 + rnd() * 0.16;
    const light = rnd() < 0.55;
    g.strokeStyle = light ? `rgba(150,84,46,${a * 0.8})` : `rgba(20,6,2,${a + 0.04})`;
    g.lineWidth = wid; g.beginPath();
    const ph = rnd() * 6.28, amp = 2 + rnd() * 9, fr = 0.004 + rnd() * 0.01;
    for (let y = -10; y <= h + 10; y += 16) g.lineTo(x + Math.sin(y * fr + ph) * amp, y);
    g.stroke();
  }
  // široké pásy (letokruhy pri pozdĺžnom reze)
  for (let i = 0; i < 18; i++) {
    const x = rnd() * w, wid = 20 + rnd() * 60;
    const grd = g.createLinearGradient(x - wid, 0, x + wid, 0);
    grd.addColorStop(0, 'rgba(120,52,20,0)'); grd.addColorStop(0.5, `rgba(130,58,22,${0.12 + rnd() * 0.14})`); grd.addColorStop(1, 'rgba(120,52,20,0)');
    g.fillStyle = grd; g.fillRect(x - wid, 0, wid * 2, h);
  }
  // póry: krátke tmavé čiarky
  g.fillStyle = 'rgba(12,3,0,0.35)';
  for (let i = 0; i < 2600; i++) g.fillRect(rnd() * w, rnd() * h, 0.9, 3 + rnd() * 7);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace; t.wrapS = t.wrapT = RepeatWrapping; t.anisotropy = 8;
  return t;
}

// ---------- tvar: profily pre sústruh (LatheGeometry otáča krivku okolo osi Y) ----------
const P = (pts) => pts.map(([r, y]) => new Vector2(r, y));

// hlava kladivka: súmerný súdok s dvoma drážkami pri každom konci, dĺžka 11,2 cm
function profilHlavy() {
  const pol = [
    [0.001, -5.6], [1.3, -5.58], [2.05, -5.52], [2.32, -5.4], [2.44, -5.22],
    [2.46, -4.95], [2.28, -4.85], [2.28, -4.66], [2.5, -4.56], [2.54, -4.38], [2.36, -4.28], [2.36, -4.1],
    [2.56, -4.0], [2.6, -3.75], [2.56, -3.5], [2.62, -2.4], [2.68, -1.1], [2.7, 0],
  ];
  const zrkadlo = pol.slice(0, -1).reverse().map(([r, y]) => [r, -y]);
  return P([...pol, ...zrkadlo]);
}
// rúčka: zhora (v hlave) nadol, so zúžením, prstencom a guľkou na konci, dĺžka 24 cm
function profilRucky() {
  return P([
    [0.001, -1.6], [0.62, -1.6], [0.62, -2.55], [0.9, -2.72], [0.92, -3.05], [0.66, -3.3],
    [0.56, -4.6], [0.58, -8], [0.66, -12], [0.76, -16], [0.8, -18.3], [0.74, -19.4],
    [0.94, -19.7], [0.96, -20.15], [0.74, -20.45], [0.86, -21.05], [1.04, -21.9], [1.05, -22.7],
    [0.92, -23.35], [0.62, -23.85], [0.25, -24.08], [0.001, -24.12],
  ]);
}
// mosadzný pás na hlave
function profilPasu(y0, y1, r) {
  return P([[r - 0.06, y0], [r + 0.04, y0 + 0.06], [r + 0.06, (y0 + y1) / 2], [r + 0.04, y1 - 0.06], [r - 0.06, y1]]);
}

// ---------- prostredie pre odlesky: tmavá miestnosť s teplými a jedným chladným panelom ----------
function prostredie(renderer) {
  const sc = new Scene();
  const room = new Mesh(new BoxGeometry(40, 30, 40), new MeshBasicMaterial({ color: 0x050403, side: BackSide }));
  sc.add(room);
  const panel = (w, h, col, x, y, z, ry = 0) => { const m = new Mesh(new BoxGeometry(w, h, 0.2), new MeshBasicMaterial({ color: col })); m.position.set(x, y, z); m.rotation.y = ry; sc.add(m); };
  panel(14, 6, 0xffc88a, -8, 9, 12, 0.6);   // veľký teplý softbox vpredu vľavo hore
  panel(4, 16, 0xff9a4a, 16, 2, 2, -1.4);   // úzky oranžový pás sprava
  panel(10, 3, 0x6d86c8, 6, 12, -14, 0.2);  // slabý chladný odlesk zozadu (ako modrá vo videu)
  const pm = new PMREMGenerator(renderer);
  const env = pm.fromScene(sc, 0.03).texture; pm.dispose();
  return env;
}

export function spusti(canvas, opts = {}) {
  const host = opts.host || canvas.parentElement;
  const still = !!opts.still;      // jeden snímok (plagát), bez slučky
  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: !!opts.preserve });
  } catch (e) { return null; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, opts.dpr || 1.75));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  scene.environment = prostredie(renderer);
  scene.environmentIntensity = 0.55;

  const camera = new PerspectiveCamera(30, 1, 1, 200);
  camera.position.set(0, 0, 62);

  // materiály
  const mapa = drevo();
  const lak = new MeshPhysicalMaterial({ map: mapa, color: 0xd8b8a8, roughness: 0.42, clearcoat: 0.85, clearcoatRoughness: 0.16, sheen: 0.25, sheenColor: 0x7a3a18 });
  const mosadz = new MeshStandardMaterial({ color: 0xd6ad6f, metalness: 1, roughness: 0.26 });

  // zostava: otočný bod je pri konci rúčky (tam ho drží ruka), aby úder vyzeral ako úder
  const ruka = new Group();       // pivot
  const kladivko = new Group();
  ruka.add(kladivko);
  scene.add(ruka);

  const hlava = new Mesh(new LatheGeometry(profilHlavy(), 96), lak);
  hlava.rotation.z = Math.PI / 2;  // os hlavy vodorovne
  kladivko.add(hlava);
  for (const s of [-1, 1]) {
    const pas = new Mesh(new LatheGeometry(profilPasu(s * 3.0 - 0.3, s * 3.0 + 0.3, 2.63), 96), mosadz);
    pas.rotation.z = Math.PI / 2; kladivko.add(pas);
  }
  const rucka = new Mesh(new LatheGeometry(profilRucky(), 64), lak);
  kladivko.add(rucka);
  kladivko.add(new Mesh(new LatheGeometry(profilPasu(-20.12, -19.72, 0.99), 64), mosadz));

  // kladivko posunieme tak, aby pivot (koniec rúčky) bol v ruke
  kladivko.position.y = 22.5;
  const PIVOT = { x: 11, y: -7.5 };
  ruka.position.set(PIVOT.x, PIVOT.y, 0);

  // svetlá
  const kluc = new PointLight(0xffb36b, 2600, 0, 2);     // teplé svetlo za kurzorom
  kluc.position.set(12, 10, 26); scene.add(kluc);
  const kontra = new DirectionalLight(0xffd9b0, 1.6);     // obrys zozadu
  kontra.position.set(-14, 18, -20); scene.add(kontra);
  const modra = new DirectionalLight(0x5d7bd6, 0.55);     // chladná protiváha zľava dole
  modra.position.set(-20, -12, 6); scene.add(modra);
  scene.add(new HemisphereLight(0x2a3046, 0x140904, 0.35));

  // základná póza ako vo videu: hlava stojí vľavo, rúčka ide doprava mierne nadol a k divákovi
  const POZA = { rx: -0.18, ry: 0.5, rz: 1.2 };
  const stav = { rx: POZA.rx, ry: POZA.ry, rz: POZA.rz, uder: 0, uderV: 0, svX: 0.35, svY: 0.25, scroll: 0 };
  const ciel = { mx: 0.35, my: 0.25 };
  ruka.rotation.set(POZA.rx, POZA.ry, POZA.rz);

  function velkost() {
    const w = Math.max(1, host.clientWidth), h = Math.max(1, host.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // na úzkej obrazovke kamera odstúpi, aby sa celé kladivko zmestilo
    camera.position.z = w / h < 0.8 ? 78 : 62;
    camera.updateProjectionMatrix();
  }
  velkost();

  const v3 = new Vector3();
  let t0 = performance.now(), cas = 0, beh = false, raf = 0, viditelne = true;

  function krok(now) {
    // čas rAF môže byť o kúsok starší ako performance.now() z predošlého volania: záporný krok by tlmenie rozkmital
    const dt = clamp((now - t0) / 1000, 0, 0.05); t0 = Math.max(t0, now); cas += dt;
    const k = still ? 1 : 1 - Math.pow(0.0015, dt);  // tlmenie nezávislé od fps (plagát hneď v cieli)
    stav.svX = lerp(stav.svX, ciel.mx, k); stav.svY = lerp(stav.svY, ciel.my, k);
    // svetlo: kurzor premietnutý pred kladivko
    v3.set(stav.svX * 30, stav.svY * 20 + 4, 24); kluc.position.copy(v3);
    // úder: pružina (pozícia uder, rýchlosť uderV)
    stav.uderV += (-stav.uder * 140 - stav.uderV * 13) * dt; stav.uder += stav.uderV * dt;
    const pohyb = opts.motion === false ? 0 : 1;
    const dych = pohyb * Math.sin(cas * 0.6) * 0.06;
    const tx = POZA.rx + stav.svY * -0.12 * pohyb;
    const ty = POZA.ry + stav.svX * 0.32 * pohyb + Math.sin(cas * 0.35) * 0.12 * pohyb + stav.scroll * 0.9;
    const tz = POZA.rz + dych + stav.uder - stav.scroll * 0.35;
    stav.rx = lerp(stav.rx, tx, k); stav.ry = lerp(stav.ry, ty, k); stav.rz = lerp(stav.rz, tz, k * 1.6);
    ruka.rotation.set(stav.rx, stav.ry, stav.rz);
    ruka.position.y = PIVOT.y + Math.sin(cas * 0.8) * 0.35 * pohyb + stav.scroll * 9;
    renderer.render(scene, camera);
    if (beh) raf = requestAnimationFrame(krok);
  }
  const start = () => { if (beh || still) return; beh = true; t0 = performance.now(); raf = requestAnimationFrame(krok); };
  const stop = () => { beh = false; cancelAnimationFrame(raf); };

  const api = {
    // x, y v rozsahu −1…1 vzhľadom na stred plochy
    svetlo(x, y) { ciel.mx = clamp(x, -1.4, 1.4); ciel.my = clamp(y, -1.4, 1.4); },
    uder() { stav.uderV += 9.5; },
    posun(p) { stav.scroll = clamp(p, 0, 1); },
    viditelne(on) { viditelne = on; on && !document.hidden ? start() : stop(); },
    velkost,
    snimok() { krok(performance.now()); },
    renderer,
  };

  if (still) { api.snimok(); return api; }
  new ResizeObserver(() => velkost()).observe(host);
  document.addEventListener('visibilitychange', () => (document.hidden || !viditelne ? stop() : start()));
  start();
  return api;
}
