// GYM KLUB – úvod: skutočná 20 kg jednoručka padá z neba nad Lipou a dopadne na terasu pred vchodom.
//
// Pozadie tvoria dva skutočné zábery z 26. 9. (nebo nad Lipa Centrom a terasa pred vchodom).
// Činka je 3D model, ktorý sa kreslí do samostatnej vrstvy s kamerou zladenou so záberom
// (ohnisko odmerané z úbežníkov dlažby, výška a sklon kamery) a skladá sa na záber
// s rovnakým orezom ako CSS object-fit: cover (na stred). Odrazy a svetlo dáva skutočné
// HDR prostredie (Poly Haven, CC0), na terase doplnené o strop, podlahu a steny vo farbách zo záberu.
//
// Celý obraz je čistá funkcia čísla p (0 až 1), ktoré posiela skrolovanie: dopredu aj dozadu
// vznikne rovnaký záber a po obnovení stránky v strede sa nič neskočí.
// Zdroj sa zbalí do ../assets/intro.js príkazom v build.sh (esbuild, len použité časti three.js).

import {
  WebGLRenderer, Scene, PerspectiveCamera, OrthographicCamera, Mesh, Group, Points,
  PlaneGeometry, CylinderGeometry, LatheGeometry, BoxGeometry, BufferGeometry, BufferAttribute,
  Vector2, Vector3, Vector4, Quaternion, Euler, Color, Texture, CanvasTexture,
  RepeatWrapping, ClampToEdgeWrapping, SRGBColorSpace, NoToneMapping,
  LinearMipmapLinearFilter, LinearFilter, EquirectangularReflectionMapping,
  WebGLRenderTarget, HalfFloatType, PMREMGenerator, VSMShadowMap,
  MeshPhysicalMaterial, MeshBasicMaterial, ShaderMaterial, ShadowMaterial,
  DirectionalLight, DoubleSide, NormalBlending, CustomBlending, AddEquation, OneFactor, MathUtils,
} from 'three';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';

// ——— Časová os (p od 0 do 1) ———
// skyEnd: koniec pádu z neba · whipEnd: kamera dosadne na terasu po prudkom švihu nadol
// land: prvý dotyk s dlažbou · settle: činka leží, prach zmizol, obraz je odtiaľto nemenný
// handoff: odporúčaný začiatok prelínania do prvej zastávky prehliadky
export const T = { skyEnd: 0.42, whipEnd: 0.52, land: 0.62, settle: 0.72, handoff: 0.9 };
const CUT = 0.47; // strih medzi zábermi v strede švihu, keď je rozmazanie najväčšie

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const DEG = Math.PI / 180;
const G = 9.81;

// ——— Kamera záberov ———
// Oba zábery sú z toho istého iPhonu (ultraširoký objektív, video 4K otočené na výšku).
// Ohnisko 1665 px pri šírke 2160 px vyšlo z dvoch kolmých úbežníkov škár dlažby na terase
// (úbežníky x ≈ −690 a 2676 px) → zvislý uhol záberu ≈ 98°. Zvislé hrany na terase sú zvislé
// (sklon 0°), výška kamery 1,33 m vyšla z výšky stola 0,74 m. Záber oblohy je naklonený
// asi 10° nahor (horizont je 280 px pod stredom).
const PW = 2160, PH = 3840, F_PX = 1665;
const PLATE_ASPECT = PW / PH;
const VFOV = 2 * Math.atan(PH / 2 / F_PX) / DEG;
const SKY_PITCH = 10 * DEG;
const TER_EYE = 1.33;

// ——— Rozmery jednoručky 20 kg (okrúhle gumené hlavy, chrómová rúčka) ———
const R = 0.095;        // polomer hlavy (priemer 19 cm)
const HEAD_L = 0.108;   // dĺžka hlavy vrátane klenutého čela
const GRIP = 0.132;     // rúčka medzi objímkami
const COLLAR = 0.014;   // chrómová objímka
const HR = 0.0165;      // polomer rúčky (priemer 33 mm)
const X_IN = GRIP / 2 + COLLAR;    // vnútorná stena hlavy od stredu
const X_OUT = X_IN + HEAD_L;       // čelo hlavy (celková dĺžka ≈ 0,38 m)
const CAP_R = 0.0515;              // medený štítok s číslom

// ——— Náhodné čísla s pevným semienkom (rovnaký vzhľad pri každom načítaní) ———
function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = Math.imul(s ^ (s >>> 15), 0x2c1b3c6d) + 0x6d2b79f5 >>> 0) / 4294967296); }

function canvas2d(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d', { willReadFrequently: true })]; }

// výšková mapa → normálová mapa (tangentový priestor), kraje sa opakujú
function heightToNormal(hgt, w, h, strength, wrap = true) {
  const [c, g] = canvas2d(w, h);
  const img = g.createImageData(w, h), d = img.data;
  const at = (x, y) => {
    if (wrap) { x = (x + w) % w; y = (y + h) % h; } else { x = Math.min(w - 1, Math.max(0, x)); y = Math.min(h - 1, Math.max(0, y)); }
    return hgt[y * w + x];
  };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = (at(x + 1, y) - at(x - 1, y)) * strength, dy = (at(x, y + 1) - at(x, y - 1)) * strength;
    const l = Math.hypot(dx, dy, 1), i = (y * w + x) * 4;
    d[i] = (-dx / l * 0.5 + 0.5) * 255; d[i + 1] = (dy / l * 0.5 + 0.5) * 255; d[i + 2] = (1 / l * 0.5 + 0.5) * 255; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return c;
}

function boxBlur(a, w, h, r, wrap) {
  const t = new Float32Array(a.length);
  for (let pass = 0; pass < 2; pass++) {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let s = 0, n = 0;
      for (let k = -r; k <= r; k++) {
        let xx = x + k; if (wrap) xx = (xx + w) % w; else if (xx < 0 || xx >= w) continue;
        s += a[y * w + xx]; n++;
      }
      t[y * w + x] = s / n;
    }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let s = 0, n = 0;
      for (let k = -r; k <= r; k++) {
        let yy = y + k; if (wrap) yy = (yy + h) % h; else if (yy < 0 || yy >= h) continue;
        s += t[yy * w + x]; n++;
      }
      a[y * w + x] = s / n;
    }
  }
  return a;
}

// ——— Textúry činky (kreslené v prehliadači, žiadne ďalšie súbory) ———

// Vrúbkovanie rúčky: diamantový vzor so stúpaním ≈ 1,6 mm, len v strednej časti rúčky.
function knurlMaps() {
  const W = 512, H = 512, NU = 64, NV = 64 * (GRIP + 0.008) / (2 * Math.PI * HR);
  const hgt = new Float32Array(W * H), rough = new Float32Array(W * H);
  for (let y = 0; y < H; y++) {
    const v = y / H, band = MathUtils.smoothstep(v, 0.08, 0.12) * (1 - MathUtils.smoothstep(v, 0.88, 0.92));
    for (let x = 0; x < W; x++) {
      const a = x / W * NU, b = v * NV;
      const s = a + b, t = a - b;
      const d = Math.min(Math.abs(s - Math.floor(s) - 0.5), Math.abs(t - Math.floor(t) - 0.5)) * 2;
      const k = MathUtils.smoothstep(d, 0.1, 0.5);
      hgt[y * W + x] = k * band;
      rough[y * W + x] = band * (1 - k);
    }
  }
  const n = new CanvasTexture(heightToNormal(hgt, W, H, 2.2, false));
  const [rc, rg] = canvas2d(W, H); const im = rg.createImageData(W, H);
  const rnd = rng(11);
  for (let i = 0; i < W * H; i++) { const v = 150 + rough[i] * 70 + (rnd() - 0.5) * 18; im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = 255; }
  rg.putImageData(im, 0, 0);
  const r = new CanvasTexture(rc);
  for (const t of [n, r]) { t.wrapS = RepeatWrapping; t.wrapT = ClampToEdgeWrapping; t.anisotropy = 4; }
  return { normal: n, rough: r };
}

// Guma: jemná zrnitosť (normála), škrabance a vyleštené miesta (drsnosť), prach a odreniny (farba).
function rubberMaps() {
  const W = 512, H = 256, rnd = rng(7);
  // zrnitosť povrchu gumy
  const hgt = new Float32Array(W * H);
  for (let i = 0; i < hgt.length; i++) hgt[i] = rnd();
  boxBlur(hgt, W, H, 1, true);
  // plytké odreniny ako výškové priehlbiny
  for (let k = 0; k < 90; k++) {
    let x = rnd() * W, y = rnd() * H; const a = rnd() * Math.PI, l = 6 + rnd() * 40;
    for (let s = 0; s < l; s++) { const xi = ((x + Math.cos(a) * s) | 0 + W) % W, yi = ((y + Math.sin(a) * s * 0.5) | 0 + H) % H; hgt[yi * W + xi] -= 0.9; }
  }
  const normal = new CanvasTexture(heightToNormal(hgt, W, H, 0.9));

  const [rc, rg] = canvas2d(W, H);
  rg.fillStyle = 'rgb(165,165,165)'; rg.fillRect(0, 0, W, H);
  for (let i = 0; i < 38; i++) { // vyleštené miesta od rúk a stojana
    const x = rnd() * W, y = rnd() * H, r = 10 + rnd() * 40;
    const gr = rg.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(95,95,95,${0.25 + rnd() * 0.3})`); gr.addColorStop(1, 'rgba(95,95,95,0)');
    rg.fillStyle = gr; rg.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  rg.lineWidth = 0.7;
  for (let i = 0; i < 160; i++) { // jemné škrabance: drsnejšie
    const x = rnd() * W, y = rnd() * H, a = rnd() * Math.PI, l = 4 + rnd() * 30;
    rg.strokeStyle = `rgba(235,235,235,${0.25 + rnd() * 0.4})`;
    rg.beginPath(); rg.moveTo(x, y); rg.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l * 0.5); rg.stroke();
  }
  const rough = new CanvasTexture(rc);

  const [cc, cg] = canvas2d(W, H);
  cg.fillStyle = '#262626'; cg.fillRect(0, 0, W, H);
  for (let i = 0; i < 26; i++) { // prach a sivý povlak z podlahy
    const x = rnd() * W, y = rnd() * H, r = 14 + rnd() * 60;
    const gr = cg.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(70,66,60,${0.12 + rnd() * 0.16})`); gr.addColorStop(1, 'rgba(70,66,60,0)');
    cg.fillStyle = gr; cg.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  for (let i = 0; i < 1400; i++) { const v = 40 + rnd() * 40 | 0; cg.fillStyle = `rgba(${v},${v - 2},${v - 5},${0.2 + rnd() * 0.3})`; cg.fillRect(rnd() * W, rnd() * H, 1, 1); }
  cg.lineWidth = 0.8;
  for (let i = 0; i < 60; i++) { // svetlejšie odreniny
    const x = rnd() * W, y = rnd() * H, a = rnd() * Math.PI, l = 3 + rnd() * 16;
    cg.strokeStyle = `rgba(80,78,74,${0.3 + rnd() * 0.4})`;
    cg.beginPath(); cg.moveTo(x, y); cg.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l * 0.5); cg.stroke();
  }
  const color = new CanvasTexture(cc); color.colorSpace = SRGBColorSpace;
  for (const t of [normal, rough, color]) { t.wrapS = t.wrapT = RepeatWrapping; t.anisotropy = 4; }
  return { normal, rough, color };
}

// Medený štítok s vyrazeným číslom 20 (bez značky výrobcu).
function capMaps() {
  const S = 512, rnd = rng(3);
  const [tc, tg] = canvas2d(S, S);
  tg.fillStyle = '#000'; tg.fillRect(0, 0, S, S);
  tg.save(); tg.translate(S / 2, S / 2); tg.rotate(-Math.PI / 2);
  tg.fillStyle = '#fff'; tg.textAlign = 'center'; tg.textBaseline = 'middle';
  tg.font = '700 190px "Arial Narrow", "Helvetica Neue", Arial, sans-serif';
  tg.scale(0.82, 1);
  tg.fillText('20', 0, 8);
  tg.restore();
  const txt = tg.getImageData(0, 0, S, S).data;
  const hgt = new Float32Array(S * S);
  for (let i = 0; i < S * S; i++) hgt[i] = txt[i * 4] / 255;
  const mask = Float32Array.from(hgt);
  boxBlur(hgt, S, S, 2, false);
  // jemné sústružnícke drážky štítka
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const r = Math.hypot(x - S / 2, y - S / 2); hgt[y * S + x] += Math.sin(r * 1.9) * 0.015 + (rnd() - 0.5) * 0.02; }
  const normal = new CanvasTexture(heightToNormal(hgt, S, S, 1.8, false));

  const [cc, cg] = canvas2d(S, S); const im = cg.createImageData(S, S);
  for (let i = 0; i < S * S; i++) {
    const x = i % S, y = (i / S) | 0, r = Math.hypot(x - S / 2, y - S / 2) / (S / 2);
    const m = mask[i], wear = 0.9 + rnd() * 0.12 - r * 0.08;
    // meď s oxidáciou pri okraji, číslo svetlejšie (vyleštené)
    im.data[i * 4] = Math.min(255, (160 * wear) * (1 - m) + 196 * m);
    im.data[i * 4 + 1] = Math.min(255, (100 * wear) * (1 - m) + 150 * m);
    im.data[i * 4 + 2] = Math.min(255, (84 * wear) * (1 - m) + 122 * m);
    im.data[i * 4 + 3] = 255;
  }
  cg.putImageData(im, 0, 0);
  const color = new CanvasTexture(cc); color.colorSpace = SRGBColorSpace;
  const [rc, rg] = canvas2d(S, S); const ri = rg.createImageData(S, S);
  for (let i = 0; i < S * S; i++) { const v = 112 + mask[i] * 40 + (rnd() - 0.5) * 30; ri.data[i * 4] = ri.data[i * 4 + 1] = ri.data[i * 4 + 2] = v; ri.data[i * 4 + 3] = 255; }
  rg.putImageData(ri, 0, 0);
  const rough = new CanvasTexture(rc);
  for (const t of [normal, color, rough]) t.anisotropy = 4;
  return { normal, color, rough };
}

// ——— Profily pre sústruženie (LatheGeometry okolo osi y) ———
function arc(pts, cx, cy, r, a0, a1, n) { for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; pts.push(new Vector2(cx + Math.cos(a) * r, cy + Math.sin(a) * r)); } }

function headProfile() {
  // os y: 0 = vnútorná stena (k rúčke), HEAD_L = čelo s medeným štítkom
  const p = [], f1 = 0.014, f2 = 0.024, yF = HEAD_L - 0.0065;
  p.push(new Vector2(0.0, 0.0), new Vector2(0.0232, 0.0));
  p.push(new Vector2(0.060, -0.0012)); // vnútorná stena je mierne vypuklá
  arc(p, R - f1, f1 - 0.0004, f1, -Math.PI / 2, 0, 7);
  p.push(new Vector2(R + 0.0007, HEAD_L * 0.42));
  p.push(new Vector2(R + 0.0004, yF - f2 * 0.6));
  arc(p, R - f2, yF - f2 + 0.0035, f2, 0, Math.PI / 2 - 0.12, 8);
  // klenuté čelo až k lemu štítka
  for (let i = 1; i <= 6; i++) { const t = i / 6, r = MathUtils.lerp(R - f2 - 0.001, CAP_R + 0.0055, t); p.push(new Vector2(r, yF + 0.0035 + 0.0045 * Math.sin(t * Math.PI / 2))); }
  p.push(new Vector2(CAP_R + 0.0028, HEAD_L));
  p.push(new Vector2(CAP_R + 0.0006, HEAD_L - 0.0022));
  p.push(new Vector2(CAP_R - 0.001, HEAD_L - 0.0034));
  p.push(new Vector2(0.0, HEAD_L - 0.0034));
  return p;
}

function collarProfile() {
  const p = [], c = 0.0022, r = 0.0228;
  p.push(new Vector2(HR - 0.001, 0), new Vector2(r - c, 0));
  arc(p, r - c, c, c, -Math.PI / 2, 0, 3);
  arc(p, r - c, COLLAR - c, c, 0, Math.PI / 2, 3);
  p.push(new Vector2(HR - 0.001, COLLAR));
  return p;
}

function makeDumbbell() {
  const g = new Group();
  const rm = rubberMaps(), km = knurlMaps(), cm = capMaps();
  const rubber = new MeshPhysicalMaterial({
    color: 0xffffff, map: rm.color, roughness: 0.52, roughnessMap: rm.rough,
    normalMap: rm.normal, normalScale: new Vector2(0.22, 0.22),
    metalness: 0, clearcoat: 0.3, clearcoatRoughness: 0.34, specularIntensity: 1,
    sheen: 0.5, sheenRoughness: 0.5, sheenColor: new Color(0.09, 0.09, 0.1), side: DoubleSide,
  });
  rm.color.repeat.set(3, 1); rm.rough.repeat.set(3, 1); rm.normal.repeat.set(10, 3);
  const chrome = new MeshPhysicalMaterial({ color: 0xf4f5f7, metalness: 1, roughness: 0.1, side: DoubleSide });
  const knurl = new MeshPhysicalMaterial({
    color: 0xe2e4e8, metalness: 1, roughness: 0.24, roughnessMap: km.rough,
    normalMap: km.normal, normalScale: new Vector2(1.4, 1.4), anisotropy: 0.35,
  });
  const cap = new MeshPhysicalMaterial({
    color: 0xffffff, map: cm.color, metalness: 0.2, roughness: 1, roughnessMap: cm.rough,
    normalMap: cm.normal, normalScale: new Vector2(0.8, 0.8), clearcoat: 0.3, clearcoatRoughness: 0.3,
  });
  const capEdge = new MeshPhysicalMaterial({ color: 0x7a4636, metalness: 0.2, roughness: 0.5 });

  const headGeo = new LatheGeometry(headProfile(), 112);
  const collarGeo = new LatheGeometry(collarProfile(), 64);
  const capGeo = new CylinderGeometry(CAP_R, CAP_R, 0.0024, 96, 1, false);
  for (const s of [1, -1]) {
    const head = new Mesh(headGeo, rubber);
    head.rotation.z = -s * Math.PI / 2; head.position.x = s * X_IN;
    const c = new Mesh(capGeo, [capEdge, cap, capEdge]);
    c.position.y = HEAD_L - 0.0034 + 0.0012; head.add(c);
    g.add(head);
    const col = new Mesh(collarGeo, chrome);
    col.rotation.z = -s * Math.PI / 2; col.position.x = s * (GRIP / 2); g.add(col);
  }
  const handle = new Mesh(new CylinderGeometry(HR, HR, GRIP + 0.008, 72, 1, true), knurl);
  handle.rotation.z = Math.PI / 2; g.add(handle);
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

// ——— Tieňovanie ———

// Kontaktné zatienenie dlažby: činka ako sada guľôčok, analyticky (ako ambientná oklúzia).
const aoVert = `varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`;
const aoFrag = `
uniform vec4 uS[10]; uniform float uK;
varying vec3 vW;
void main(){
  float vis = 1.;
  for(int i=0;i<10;i++){
    vec3 d = uS[i].xyz - vW; float l2 = max(dot(d,d), 1e-6); float r = uS[i].w;
    float occ = clamp(d.y*inversesqrt(l2), 0., 1.) * r*r / l2;
    vis *= 1. - clamp(occ, 0., 1.);
  }
  gl_FragColor = vec4(0., 0., 0., (1. - vis) * uK);
}`;

// Prach po dopade: poloha je analytická funkcia času od dopadu, takže ide aj dozadu.
const dustVert = `
attribute vec4 aA; attribute vec4 aB;
uniform float uT; uniform float uScale; uniform vec3 uC0; uniform vec3 uC1; uniform vec3 uDir;
varying float vA;
void main(){
  float t = max(uT, 0.);
  vec3 c = aB.w < .5 ? uC0 : uC1;
  float ang = aA.x*6.2832;
  vec2 dir = vec2(cos(ang), sin(ang));
  float v0 = mix(.3, 1.8, aA.y*aA.y);
  float k = 3.2;
  float r = .03 + v0/k*(1. - exp(-k*t));
  float vy = mix(.02, .32, aA.z*aA.z);
  float y = .006 + vy/k*(1. - exp(-k*t)) + .02*t;
  vec3 pos = c + vec3(dir.x*r, y, dir.y*r) + uDir*(.05*t);
  vec4 mv = modelViewMatrix*vec4(pos,1.);
  gl_Position = projectionMatrix*mv;
  float size = mix(.015, .06, aA.w) * (1. + t*2.2);
  gl_PointSize = clamp(size*uScale/-mv.z, 1., 64.);
  float life = mix(.4, 1.1, aB.x);
  vA = uT <= 0. ? 0. : smoothstep(0., .03, t) * (1. - smoothstep(life*.2, life, t)) * mix(.02, .075, aB.y);
}`;
const dustFrag = `
uniform sampler2D uMap; uniform vec3 uCol; varying float vA;
void main(){ float m = texture2D(uMap, gl_PointCoord).a; float a = m*vA; if(a < .002) discard; gl_FragColor = vec4(uCol, a); }`;

// Drobné úlomky (kúsky gumy a zrnká z dlažby): balistický let, jeden odskok, potom ležia.
const chipVert = `
attribute vec4 aA; attribute vec4 aB;
uniform float uT; uniform float uScale; uniform vec3 uC0; uniform vec3 uC1;
varying float vA; varying float vShade;
void main(){
  float t = max(uT, 0.);
  vec3 c = aB.w < .5 ? uC0 : uC1;
  float ang = aA.x*6.2832; vec2 dir = vec2(cos(ang), sin(ang));
  float vh = mix(.3, 1.3, aA.y), vy = mix(.4, 1.6, aA.z);
  float t1 = 2.*vy/9.81;
  float y, s;
  if (t < t1) { y = vy*t - 4.905*t*t; s = vh*t; }
  else { float t2 = t - t1; float vy2 = vy*.25, tb = 2.*vy2/9.81; y = t2 < tb ? vy2*t2 - 4.905*t2*t2 : 0.; s = vh*t1 + vh*.4*min(t2, tb) + vh*.05*(1. - exp(-8.*max(t2 - tb, 0.))); }
  vec3 pos = c + vec3(dir.x*(s + .03), .0015 + max(y, 0.), dir.y*(s + .03));
  vec4 mv = modelViewMatrix*vec4(pos,1.);
  gl_Position = projectionMatrix*mv;
  gl_PointSize = clamp(mix(.002, .005, aA.w)*uScale/-mv.z, 1., 6.);
  vA = uT <= 0. ? 0. : 1.;
  vShade = aB.y;
}`;
const chipFrag = `
varying float vA; varying float vShade;
void main(){ vec2 q = gl_PointCoord - .5; if(dot(q,q) > .25 || vA < .5) discard; gl_FragColor = vec4(vec3(mix(.03, .16, vShade)), 1.); }`;

// Prenos akumulovaných snímok (rozmazanie pohybu): vrstva * váha, sčítanie.
const blitVert = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`;
const blitFrag = `uniform sampler2D tSrc; uniform float uW; varying vec2 vUv; void main(){ gl_FragColor = texture2D(tSrc, vUv) * uW; }`;

// Zloženie: záber (object-fit: cover), vrstva s činkou, švih kamery, zrno na činke.
const compFrag = `
precision highp float;
uniform sampler2D tPlate; uniform sampler2D tLayer;
uniform vec4 uCrop;     // u0, v0, du, dv – výrez záberu pre celé plátno
uniform float uShift;   // posun obsahu nahor (v jednotkách výšky plátna)
uniform float uBlur;    // dĺžka zvislého rozmazania záberu
uniform float uLBlur;   // dĺžka rozmazania vrstvy
uniform int uTaps;
uniform float uSeed; uniform float uGrain; uniform vec2 uPx;
varying vec2 vUv;
float h12(vec2 p){ vec3 p3 = fract(vec3(p.xyx)*.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y)*p3.z); }
vec3 neutral(vec3 color){
  const float startCompression = 0.8 - 0.04; const float desaturation = 0.15;
  float peak = max(color.r, max(color.g, color.b));
  if (peak < startCompression) return color;
  float d = 1. - startCompression;
  float newPeak = 1. - d*d/(peak + d - startCompression);
  color *= newPeak/peak;
  float g = 1. - 1./(desaturation*(peak - newPeak) + 1.);
  return mix(color, vec3(newPeak), g);
}
vec3 toSRGB(vec3 c){ c = clamp(c, 0., 1.); return mix(c*12.92, 1.055*pow(c, vec3(1./2.4)) - .055, step(.0031308, c)); }
void main(){
  vec2 uv = vec2(vUv.x, vUv.y - uShift);
  float jit = h12(gl_FragCoord.xy + uSeed) - .5;
  vec3 plate = vec3(0.); vec4 lay = vec4(0.);
  float n = float(uTaps);
  for (int i = 0; i < 48; i++) {
    if (i >= uTaps) break;
    float o = uTaps > 1 ? ((float(i) + .5 + jit)/n - .5) : 0.;
    vec2 q = vec2(uv.x, uv.y + o*uBlur);
    plate += texture2D(tPlate, uCrop.xy + q*uCrop.zw).rgb;
    if (uTaps > 1) {
      vec2 ql = vec2(uv.x, uv.y + o*uLBlur);
      if (ql.y >= 0. && ql.y <= 1.) lay += texture2D(tLayer, ql);
    }
  }
  plate /= n;
  if (uTaps > 1) lay /= n;
  else if (uv.y >= 0. && uv.y <= 1.) {
    // 3D vrstva je ostrejšia než video záber → jemné zmäkčenie (4 vzorky po pol pixeli)
    vec2 d = uPx*.5;
    lay = .25*(texture2D(tLayer, uv + vec2(d.x, d.y)) + texture2D(tLayer, uv + vec2(-d.x, d.y)) + texture2D(tLayer, uv + vec2(d.x, -d.y)) + texture2D(tLayer, uv - d));
  }
  vec3 col = plate;
  float a = clamp(lay.a, 0., 1.);
  if (a > .0005) col = mix(plate, neutral(lay.rgb/lay.a), a);
  vec3 outc = toSRGB(col);
  // zrno ako na zábere (v zobrazovacom priestore), len na činke, tieni a prachu
  float gr = (h12(gl_FragCoord.xy*1.37 + uSeed*7.1) + h12(gl_FragCoord.yx*.71 + uSeed + 3.1) - 1.);
  outc += gr*uGrain*a;
  gl_FragColor = vec4(outc, 1.);
}`;

function softDot() {
  const [c, g] = canvas2d(64, 64);
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.35, 'rgba(255,255,255,.55)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  return new CanvasTexture(c);
}

// ——— Načítanie záberov: AVIF → WebP → JPG podľa podpory prehliadača ———
function loadImage(url) {
  return new Promise((res, rej) => { const i = new Image(); i.decoding = 'async'; i.onload = () => res(i); i.onerror = rej; i.src = url; });
}
async function loadPlate(base, name, big) {
  const suf = big ? '-2160' : '';
  for (const ext of ['avif', 'webp', 'jpg']) {
    try {
      const img = await loadImage(new URL(`${name}${suf}.${ext}`, base).href);
      if (img.naturalWidth > 0) return img;
    } catch { /* ďalší formát */ }
  }
  throw new Error('plate ' + name);
}

export function mount(canvas) {
  const base = new URL('../media/', import.meta.url);
  const small = Math.min(innerWidth, innerHeight) < 700;
  const maxDpr = small ? 1.5 : 1.75;
  let dpr = Math.min(devicePixelRatio || 1, maxDpr);

  const renderer = new WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: false });
  renderer.toneMapping = NoToneMapping;
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = VSMShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.setClearColor(0x000000, 0);
  renderer.autoClear = false; // akumulácia čiastkových snímok; mažeme ručne
  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  // ——— 3D vrstva ———
  const scene = new Scene();
  const bell = makeDumbbell(); scene.add(bell);
  bell.traverse(o => { if (o.isMesh) for (const m of [].concat(o.material)) for (const k of ['map', 'normalMap', 'roughnessMap']) if (m[k]) m[k].anisotropy = Math.min(4, maxAniso); });

  const sun = new DirectionalLight(0xffffff, 1);
  sun.castShadow = true;
  sun.shadow.mapSize.set(512, 512);
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.002;
  sun.shadow.blurSamples = 12; // rovnaké pre oba zábery, inak by sa shader prekladal pri každom strihu
  scene.add(sun, sun.target);

  // na terase: zachytávač tieňa a kontaktné zatienenie na dlažbe
  const catcher = new Mesh(new PlaneGeometry(2.4, 2.4), new ShadowMaterial({ opacity: 0.3, depthWrite: false }));
  catcher.rotation.x = -Math.PI / 2; catcher.receiveShadow = true; catcher.renderOrder = 1; scene.add(catcher);
  const aoSpheres = Array.from({ length: 10 }, () => new Vector4());
  const aoMat = new ShaderMaterial({ vertexShader: aoVert, fragmentShader: aoFrag, transparent: true, depthWrite: false, uniforms: { uS: { value: aoSpheres }, uK: { value: 0.95 } } });
  const ao = new Mesh(new PlaneGeometry(1.6, 1.6), aoMat);
  ao.rotation.x = -Math.PI / 2; ao.position.y = 0.0005; ao.renderOrder = 2; scene.add(ao);

  // prach a úlomky
  const mkAttr = (n, seed) => { const a = new Float32Array(n * 4), r = rng(seed); for (let i = 0; i < a.length; i++) a[i] = r(); return new BufferAttribute(a, 4); };
  const ND = small ? 90 : 140, NC = 22;
  const dustGeo = new BufferGeometry();
  dustGeo.setAttribute('position', new BufferAttribute(new Float32Array(ND * 3), 3));
  dustGeo.setAttribute('aA', mkAttr(ND, 21)); dustGeo.setAttribute('aB', mkAttr(ND, 22));
  const dot = softDot();
  const dustMat = new ShaderMaterial({
    vertexShader: dustVert, fragmentShader: dustFrag, transparent: true, depthWrite: false, blending: NormalBlending,
    uniforms: { uT: { value: 0 }, uScale: { value: 800 }, uMap: { value: dot }, uCol: { value: new Color(0.38, 0.35, 0.31) }, uC0: { value: new Vector3() }, uC1: { value: new Vector3() }, uDir: { value: new Vector3() } },
  });
  const dust = new Points(dustGeo, dustMat); dust.frustumCulled = false; dust.renderOrder = 3; scene.add(dust);
  const chipGeo = new BufferGeometry();
  chipGeo.setAttribute('position', new BufferAttribute(new Float32Array(NC * 3), 3));
  chipGeo.setAttribute('aA', mkAttr(NC, 31)); chipGeo.setAttribute('aB', mkAttr(NC, 32));
  const chipMat = new ShaderMaterial({ vertexShader: chipVert, fragmentShader: chipFrag, uniforms: { uT: { value: 0 }, uScale: { value: 800 }, uC0: { value: dustMat.uniforms.uC0.value }, uC1: { value: dustMat.uniforms.uC1.value } } });
  const chips = new Points(chipGeo, chipMat); chips.frustumCulled = false; scene.add(chips);

  // ——— Kamery zladené so zábermi ———
  const skyCam = new PerspectiveCamera(VFOV, PLATE_ASPECT, 0.05, 2000);
  skyCam.rotation.order = 'YXZ'; skyCam.rotation.x = SKY_PITCH;
  const terCam = new PerspectiveCamera(VFOV, PLATE_ASPECT, 0.05, 200);
  terCam.rotation.order = 'YXZ'; terCam.position.set(0, TER_EYE, 0);

  // ——— Zloženie ———
  const postCam = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new PlaneGeometry(2, 2);
  const compMat = new ShaderMaterial({
    vertexShader: blitVert, fragmentShader: compFrag, depthTest: false, depthWrite: false,
    uniforms: {
      tPlate: { value: null }, tLayer: { value: null }, uCrop: { value: new Vector4(0, 0, 1, 1) },
      uShift: { value: 0 }, uBlur: { value: 0 }, uLBlur: { value: 0 }, uTaps: { value: 1 },
      uSeed: { value: 0 }, uGrain: { value: 0.018 }, uPx: { value: new Vector2(1, 1) },
    },
  });
  const compScene = new Scene(); compScene.add(new Mesh(quad, compMat));
  const blitMat = new ShaderMaterial({
    vertexShader: blitVert, fragmentShader: blitFrag, depthTest: false, depthWrite: false, transparent: true,
    blending: CustomBlending, blendEquation: AddEquation, blendSrc: OneFactor, blendDst: OneFactor,
    uniforms: { tSrc: { value: null }, uW: { value: 1 } },
  });
  const blitScene = new Scene(); blitScene.add(new Mesh(quad, blitMat));

  let rtSub = null, rtAcc = null, W = 1, H = 1, cssW = 1, cssH = 1;
  const crop = { x: 0, y: 0, w: 1, h: 1 }; // výrez v normovaných súradniciach záberu (y zhora)
  let fCss = 1; // ohnisko v CSS px

  // ——— Prostredie (HDR) a zábery ———
  const pmrem = new PMREMGenerator(renderer);
  let hdr = null, envSky = null, envTer = null, plateSky = null, plateTer = null, loaded = false, disposed = false;
  const envRotY = { v: 0 };
  // smer slnka: nízko (asi 4°), za kamerou vpravo – na zábere oblohy svieti na čelo panelákov za stromom
  const SUN_SKY = new Vector3(0.62, 0.075, 0.78).normalize();
  // na terase priame slnko nesvieti (strecha); hlavné svetlo prichádza otvorenou stranou vpravo
  const OPEN_DIR = new Vector3(0.93, 0.36, 0.08).normalize();
  const HDR_SUN_PHI = Math.atan2(0.588, 0.809); // poloha slnka v HDR obrázku (u = 0,60, výška 3,3°)

  function makeTexture(img) {
    const t = new Texture(img);
    t.colorSpace = SRGBColorSpace; t.wrapS = ClampToEdgeWrapping; t.wrapT = ClampToEdgeWrapping; // mimo záberu pri švihu: pretiahnutý okraj = šmuha
    t.minFilter = LinearMipmapLinearFilter; t.magFilter = LinearFilter; t.generateMipmaps = true;
    t.anisotropy = Math.min(8, maxAniso); t.needsUpdate = true;
    return t;
  }

  // prostredie terasy: HDR len cez otvorenú stranu, inak strop, dlažba a steny vo farbách zo záberu
  const spot = new Vector3(); let spotKey = '';
  function buildTerraceEnv() {
    if (!hdr) return;
    const s = new Scene();
    s.background = hdr; s.backgroundIntensity = 2.2; s.backgroundRotation.set(0, envRotY.v, 0);
    const box = (w, h, d, x, y, z, r, g, b, ry = 0) => {
      const m = new Mesh(new BoxGeometry(w, h, d), new MeshBasicMaterial({ color: new Color(r, g, b), side: DoubleSide }));
      m.position.set(x, y, z); m.rotation.y = ry; s.add(m); return m;
    };
    // strop (svetlý, nepriamo osvetlený), okraj strechy nad zábradlím
    box(14, 0.2, 18, -2.5, 3.9, -3, 0.24, 0.215, 0.165);
    // dlažba (teraco) – svetlejšia smerom k otvorenej strane
    box(12, 0.1, 18, -3, -0.05, -3, 0.23, 0.19, 0.15);
    box(4, 0.1, 18, 4.5, -0.05, -3, 0.31, 0.29, 0.27);
    // fasáda s oknami a vchodom (šikmo, 45°), sokel
    box(12, 3.9, 0.3, -2.2, 1.95, -6.4, 0.14, 0.11, 0.07, -Math.PI / 4);
    box(12, 0.9, 0.35, -2.1, 0.45, -6.2, 0.095, 0.083, 0.063, -Math.PI / 4);
    // zábradlie s parapetom na pravej strane
    box(0.2, 1.05, 18, 3.2, 0.52, -3, 0.33, 0.29, 0.24);
    // stena za kamerou a bočná stena vľavo (bez medzier, cez ktoré by presvitalo HDR)
    box(14, 3.9, 0.3, 0, 1.95, 4.2, 0.2, 0.19, 0.17);
    box(0.3, 3.9, 18, -7.5, 1.95, -3, 0.16, 0.14, 0.11);
    for (const o of s.children) o.geometry.computeBoundingSphere();
    envTer?.dispose();
    envTer = pmrem.fromScene(s, 0.012, 0.02, 60, { size: 256, position: new Vector3(spot.x, 0.12, spot.z) }).texture;
    s.traverse(o => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
  }

  function worldSunRotation() {
    // otočenie HDR tak, aby jeho slnko sedelo so smerom SUN_SKY
    // (three.js otáča smer pri čítaní prostredia o −rotáciu, preto rozdiel env − svet)
    return HDR_SUN_PHI - Math.atan2(SUN_SKY.z, SUN_SKY.x);
  }

  // ——— Pád z neba: priamka k miestu tesne pod kamerou, rýchlosť sa blíži k pádovej (odpor vzduchu) ———
  const P0 = new Vector3(), P1 = new Vector3(), dirSky = new Vector3();
  let skyLen = 1, skyTf = 1, skyE = 1;
  const V0 = 22, VT = 52, TAU = 1.6;
  const sAt = t => VT * t - (VT - V0) * TAU * (1 - Math.exp(-t / TAU));
  const vAt = t => VT - (VT - V0) * Math.exp(-t / TAU);
  function tForS(s) { // inverzia dráhy (Newton)
    let t = s / VT + 0.5;
    for (let i = 0; i < 6; i++) t -= (sAt(t) - s) / vAt(t);
    return Math.max(0, t);
  }
  const tmpV = new Vector3(), tmpV2 = new Vector3();

  // bod na obrazovke (0..1 v rámci plátna, y zhora) → lúč z kamery
  function rayFrom(cam, sx, sy, out) {
    // súradnice v rámci celého záberu
    const px = (crop.x + sx * crop.w - 0.5) * PW, py = (crop.y + sy * crop.h - 0.5) * PH;
    out.set(px / F_PX, -py / F_PX, -1).normalize();
    return out.applyQuaternion(cam.quaternion);
  }

  // ——— Terasa: miesto dopadu podľa viditeľnej časti záberu ———
  // Na výšku (mobil) je vidno celú dlažbu: činka dopadne do voľného priestoru pred stoličkami (≈ 1,6 m).
  // Na šírku zostane z výšky záberu len pás v strede; dlažba je vidno len vzadu vpravo pri zábradlí.
  function chooseSpot() {
    const bottom = (crop.y + crop.h) * PH;
    let ix, iy;
    if (bottom >= 3420) { ix = 1000; iy = 3280; }
    else { ix = 1850; iy = Math.min(2520, bottom - Math.max(70, crop.h * PH * 0.07)); iy = Math.max(iy, 2380); }
    const Z = F_PX * TER_EYE / (iy - PH / 2), X = (ix - PW / 2) * Z / F_PX;
    spot.set(X, 0, -Z);
    const key = `${ix}|${iy | 0}`;
    const changed = key !== spotKey; spotKey = key;
    return changed;
  }

  // pokojová poloha na dlažbe: os činky natočená tak, aby čelo s medeným štítkom mierne mierilo ku kamere
  const axisRest = new Vector3(), rollDir = new Vector3();
  let restYaw = 0;
  function computeRest() {
    const toCam = tmpV.set(terCam.position.x - spot.x, 0, terCam.position.z - spot.z).normalize();
    const camAz = Math.atan2(toCam.z, toCam.x);
    restYaw = camAz - 48 * DEG; // os 48° od smeru ku kamere
    axisRest.set(Math.cos(restYaw), 0, Math.sin(restYaw));
    rollDir.set(-axisRest.z, 0, axisRest.x); // kolmo na os po zemi
    if (rollDir.dot(toCam) < 0) rollDir.negate();
    rollDir.multiplyScalar(-1); // odgúľa sa mierne od kamery
  }

  function layout() {
    const A = cssW / cssH;
    if (A > PLATE_ASPECT) { crop.w = 1; crop.h = PLATE_ASPECT / A; crop.x = 0; crop.y = (1 - crop.h) / 2; }
    else { crop.h = 1; crop.w = A / PLATE_ASPECT; crop.y = 0; crop.x = (1 - crop.w) / 2; }
    for (const cam of [skyCam, terCam]) {
      cam.setViewOffset(9000, 16000, crop.x * 9000, crop.y * 16000, crop.w * 9000, crop.h * 16000);
      cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    }
    compMat.uniforms.uCrop.value.set(crop.x, 1 - crop.y - crop.h, crop.w, crop.h);
    fCss = F_PX * cssW / (crop.w * PW);
    // dráha z neba: zrnko vysoko na oblohe (≈ 5 px) → tesne pod kamerou (≈ 40 % šírky)
    const d0 = 0.38 * fCss / 5.5;
    const d1 = 0.38 * fCss / (0.4 * Math.min(cssW, cssH * 0.9));
    skyE = d1;
    rayFrom(skyCam, 0.57, 0.24, P0).multiplyScalar(d0);
    rayFrom(skyCam, 0.46, 0.8, P1).multiplyScalar(d1);
    dirSky.subVectors(P1, P0); skyLen = dirSky.length(); dirSky.normalize();
    skyTf = tForS(skyLen);
    if (chooseSpot() && loaded) buildTerraceEnv();
    computeRest();
    const sc = H / (2 * Math.tan(VFOV * DEG / 2) * crop.h);
    dustMat.uniforms.uScale.value = sc; chipMat.uniforms.uScale.value = sc;
  }

  function resize() {
    cssW = Math.max(1, canvas.clientWidth || innerWidth); cssH = Math.max(1, canvas.clientHeight || innerHeight);
    renderer.setPixelRatio(dpr);
    renderer.setSize(cssW, cssH, false);
    W = Math.round(cssW * dpr); H = Math.round(cssH * dpr);
    rtSub?.dispose(); rtAcc?.dispose();
    rtSub = new WebGLRenderTarget(W, H, { type: HalfFloatType, samples: 4 });
    rtAcc = new WebGLRenderTarget(W, H, { type: HalfFloatType, depthBuffer: false });
    compMat.uniforms.uPx.value.set(1 / W, 1 / H);
    layout();
  }

  // ——— Stav činky ———
  const skyAxis = new Vector3(0.25, 0.35, 1).normalize(), skyAxis2 = new Vector3(1, 0, 0);
  const qSky0 = new Quaternion().setFromEuler(new Euler(0.4, 0.9, 0.2));
  const terAxis = new Vector3(0.2, 1, 0.35).normalize();
  const TER_H0 = 2.45, V_IMP = 7.0;
  const TER_V0 = Math.sqrt(Math.max(0, V_IMP * V_IMP - 2 * G * (TER_H0 - R)));
  const TER_TF = (V_IMP - TER_V0) / G; // čas pádu na terase (≈ 0,57 s)
  const POST_T = 1.25; // fyzikálny čas od dopadu po úplné ustálenie
  const E1 = 0.12, E2 = 0.12;
  const TILT0 = 7 * DEG, HALF = 0.172; // náklon pri dopade, vzdialenosť od stredu po spodnú hranu čela

  const pos = new Vector3(), quat = new Quaternion();
  const qa = new Quaternion(), qb = new Quaternion();
  const vX = new Vector3(1, 0, 0), vY = new Vector3(0, 1, 0);

  // pád z neba v čase t (s); t môže presiahnuť skyTf počas švihu
  function poseSky(t) {
    const s = t <= skyTf ? sAt(t) : skyLen + vAt(skyTf) * (t - skyTf);
    pos.copy(P0).addScaledVector(dirSky, s);
    // pomalé prevracanie (konštantná uhlová rýchlosť) + pomalšie otáčanie okolo rúčky
    qa.setFromAxisAngle(skyAxis, 2.1 * t);
    qb.setFromAxisAngle(skyAxis2, 0.9 * t);
    quat.copy(qSky0).multiply(qa).multiply(qb);
  }

  // terasa: t < 0 pád (t = −TER_TF … 0), t ≥ 0 po dopade
  function poseTer(t) {
    // pokojová orientácia: os vodorovne v smere restYaw, pootočenie okolo osi tak, aby číslo stálo zvislo
    const roll = t >= 0 ? rollAt(t) : 0;
    const tilt = t >= 0 ? tiltAt(t) : TILT0;
    const yaw = restYaw + (t >= 0 ? -0.07 * (1 - Math.exp(-t / 0.18)) : 0);
    // os v rovine podlahy natočená o yaw, náklon okolo vodorovnej kolmice, pootočenie okolo osi
    qa.setFromAxisAngle(vY, -yaw);
    qb.setFromAxisAngle(tmpV2.set(0, 0, 1), tilt);
    quat.copy(qa).multiply(qb);
    qb.setFromAxisAngle(vX, roll + 0.35);
    quat.multiply(qb);
    if (t < 0) {
      // pád: pred dopadom konštantné otáčanie, ktoré presne dosadne do polohy dopadu
      qb.setFromAxisAngle(terAxis, 4.2 * t);
      quat.multiply(qb);
      const y = R * Math.cos(TILT0) + HALF * Math.sin(TILT0) - (V_IMP * t + 0.5 * G * t * t);
      pos.set(spot.x, y, spot.z).addScaledVector(rollDir, 0.15 * t); // mierny posun pri páde
      return;
    }
    // odskoky ťažiska (nízky koeficient odrazu gumy o kameň)
    let b = 0;
    const v1 = E1 * V_IMP, t1 = 2 * v1 / G, v2 = E2 * v1, t2 = 2 * v2 / G;
    if (t < t1) b = v1 * t - 0.5 * G * t * t;
    else if (t < t1 + t2) { const u = t - t1; b = v2 * u - 0.5 * G * u * u; }
    const a = Math.abs(tilt);
    const s = 0.055 * (1 - Math.exp(-t / 0.32));
    pos.set(spot.x, b + R * Math.cos(a) + HALF * Math.sin(a), spot.z).addScaledVector(rollDir, s);
  }
  function tiltAt(t) { return TILT0 * Math.exp(-t / 0.075) * Math.cos(t * 2 * Math.PI / 0.3); }
  function rollAt(t) { return -0.055 * (1 - Math.exp(-t / 0.32)) / R; }

  // guľôčky pozdĺž osí oboch hláv a rúčky (x v súradniciach činky, polomer)
  const AO_BALLS = [[0.098, 0.083], [0.134, 0.083], [0.168, 0.083], [-0.098, 0.083], [-0.134, 0.083], [-0.168, 0.083], [0.03, 0.022], [-0.03, 0.022], [0.0, 0.022], [0.0, 0.0]];
  function setAO() {
    for (let i = 0; i < 10; i++) {
      tmpV.set(AO_BALLS[i][0], 0, 0).applyMatrix4(bell.matrixWorld);
      aoSpheres[i].set(tmpV.x, tmpV.y, tmpV.z, AO_BALLS[i][1]);
    }
  }

  // ——— Švih kamery a náraz ———
  const SHIFT = 0.4, BLUR_K = 0.36;
  let wShift = 0, wSpeed = 0;
  function whip(p) {
    // posun obsahu nahor (kamera sa prudko skláňa nadol), zrýchľuje sa do strihu a potom dobieha
    wShift = 0; wSpeed = 0;
    if (p <= T.skyEnd || p >= T.whipEnd) return;
    if (p < CUT) { const u = (p - T.skyEnd) / (CUT - T.skyEnd); wShift = SHIFT * u * u; wSpeed = 2 * SHIFT * u; return; }
    const k = 1 - (p - CUT) / (T.whipEnd - CUT);
    wShift = -SHIFT * k * k; wSpeed = 2 * SHIFT * k;
  }

  // ——— Vykreslenie ———
  let progress = 0, lastP = -1, raf = 0, running = true;
  const proj = new Vector3();
  function screenOf(v, cam) { proj.copy(v).project(cam); return proj; }

  // obdĺžnik činky na obrazovke (px cieľa) počas uzávierky – kreslí sa len v ňom
  const scissorBox = new Vector4();
  function boundsOf(cam, poseFn, t0, t1) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    const fDev = F_PX * W / (crop.w * PW);
    for (let i = 0; i <= 2; i++) {
      poseFn(t0 + (t1 - t0) * i / 2);
      tmpV.copy(pos).applyMatrix4(cam.matrixWorldInverse);
      const z = Math.max(0.05, -tmpV.z), r = 0.22 * fDev / z + 6;
      screenOf(pos, cam);
      const x = (proj.x * 0.5 + 0.5) * W, y = (proj.y * 0.5 + 0.5) * H;
      x0 = Math.min(x0, x - r); x1 = Math.max(x1, x + r); y0 = Math.min(y0, y - r); y1 = Math.max(y1, y + r);
    }
    if (mode === 'ter') { // na terase aj tieň, kontaktné zatienenie a prach okolo miesta dopadu
      for (let i = 0; i < 4; i++) {
        screenOf(tmpV.set(spot.x + (i & 1 ? 0.8 : -0.8), 0, spot.z + (i & 2 ? 0.8 : -0.8)), cam);
        const x = (proj.x * 0.5 + 0.5) * W, y = (proj.y * 0.5 + 0.5) * H;
        x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y + 40);
      }
    }
    x0 = Math.max(0, Math.floor(x0)); y0 = Math.max(0, Math.floor(y0));
    x1 = Math.min(W, Math.ceil(x1)); y1 = Math.min(H, Math.ceil(y1));
    return scissorBox.set(x0, y0, Math.max(0, x1 - x0), Math.max(0, y1 - y0));
  }

  function renderLayer(cam, poseFn, t, shutter, blurMask) {
    // počet čiastkových snímok podľa pohybu na obrazovke počas uzávierky
    poseFn(t - shutter / 2); const ax = screenOf(pos, cam).x * W / 2, ay = proj.y * H / 2, az = proj.z;
    poseFn(t + shutter / 2); const bx = screenOf(pos, cam).x * W / 2, by = proj.y * H / 2;
    let move = Math.hypot(bx - ax, by - ay);
    if (!(az < 1)) move = 0;
    // dlhé rozmazanie by sa pri obmedzenom počte snímok rozpadlo na kópie → uzávierku skrátime
    if (move > 72) { shutter *= 72 / move; move = 72; }
    const N = blurMask ? Math.min(24, Math.max(1, Math.ceil(move / 3))) : 1;
    // činka je malá časť obrazu → čiastkové snímky sa kreslia len v jej obdĺžniku
    const sc = N > 1 ? boundsOf(cam, poseFn, t - shutter / 2, t + shutter / 2) : null;
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = true; // tieň raz, zo stredu uzávierky
    rtSub.scissorTest = rtAcc.scissorTest = false;
    if (N === 1) {
      // bez výrezu: rozlíšenie MSAA sa kopíruje len vo výreze a mimo neho by zostal starý obraz
      renderer.setRenderTarget(rtSub); renderer.clear();
      poseFn(t); bell.position.copy(pos); bell.quaternion.copy(quat); afterPose(cam);
      renderer.render(scene, cam);
      return rtSub.texture;
    }
    renderer.setRenderTarget(rtAcc); renderer.clear();
    if (sc) { rtSub.scissor.copy(sc); rtAcc.scissor.copy(sc); rtSub.scissorTest = rtAcc.scissorTest = true; }
    blitMat.uniforms.tSrc.value = rtSub.texture; blitMat.uniforms.uW.value = 1 / N;
    for (let j = 0; j < N; j++) {
      const k = (j + (N >> 1)) % N; // stredná snímka prvá (kvôli tieňu)
      poseFn(t + ((k + 0.5) / N - 0.5) * shutter);
      bell.position.copy(pos); bell.quaternion.copy(quat); afterPose(cam);
      renderer.setRenderTarget(rtSub); renderer.clear(); renderer.render(scene, cam);
      renderer.setRenderTarget(rtAcc); renderer.render(blitScene, postCam);
    }
    return rtAcc.texture;
  }

  let mode = 'sky';
  function afterPose() {
    bell.updateMatrixWorld();
    if (mode === 'sky') {
      sun.position.copy(bell.position).addScaledVector(SUN_SKY, 3); sun.target.position.copy(bell.position);
    } else {
      setAO();
      sun.position.copy(spot).addScaledVector(OPEN_DIR, 4); sun.target.position.copy(spot);
    }
    sun.target.updateMatrixWorld();
  }

  function useSky() {
    mode = 'sky';
    scene.environment = envSky; scene.environmentIntensity = 0.62;
    scene.environmentRotation.set(0, envRotY.v, 0);
    sun.color.setRGB(1.0, 0.64, 0.4); sun.intensity = 3.2;
    const c = sun.shadow.camera; c.left = c.bottom = -0.3; c.right = c.top = 0.3; c.near = 0.5; c.far = 6; c.updateProjectionMatrix();
    sun.shadow.radius = 2;
    catcher.visible = ao.visible = dust.visible = chips.visible = false;
  }
  function useTer() {
    mode = 'ter';
    scene.environment = envTer; scene.environmentIntensity = 1.0;
    scene.environmentRotation.set(0, 0, 0);
    sun.color.setRGB(1.0, 0.97, 0.93); sun.intensity = 0.55;
    const c = sun.shadow.camera; c.left = c.bottom = -0.9; c.right = c.top = 0.9; c.near = 0.5; c.far = 9; c.updateProjectionMatrix();
    sun.shadow.radius = 14;
    catcher.visible = ao.visible = true;
    catcher.position.set(spot.x, 0, spot.z); ao.position.set(spot.x, 0.0005, spot.z);
  }

  // fyzikálny čas podľa p v jednotlivých úsekoch
  function skyTime(p) {
    if (p <= T.skyEnd) {
      // zostávajúca dráha ubúda po logaritmickej krivke → veľkosť činky rastie pri skrolovaní rovnomerne
      // (ku koncu je to spomalený záber, rýchlosť činky sa pritom nemení)
      const u = clamp(p / T.skyEnd);
      const rem = Math.exp(MathUtils.lerp(Math.log(skyLen + skyE), Math.log(skyE), u)) - skyE;
      return tForS(skyLen - rem);
    }
    return skyTf + (p - T.skyEnd) / (CUT - T.skyEnd) * 0.14; // švih: skutočná rýchlosť
  }
  const terTime = p => -TER_TF * (T.land - p) / (T.land - CUT);
  const postTime = p => Math.min(POST_T, (p - T.land) / (T.settle - T.land) * POST_T);
  // Uzávierka: ako film s 24 snímkami/s a uzávierkou 180°, ak by úvod trval 8 s:
  // jedna snímka = 1/192 skrolovania, uzávierka polovica. Pri spomalenom zábere je teda činka ostrá,
  // pri skutočnej rýchlosti (švih, pád na terase) sa rozmaže tak, ako by sa rozmazala na kamere.
  const SHUTTER_P = 1 / 384;
  function shutter(fn, p, lo, hi) {
    const e = 0.0005, a = Math.max(lo, p - e), b = Math.min(hi, p + e);
    return Math.min(0.02, Math.abs(fn(b) - fn(a)) / Math.max(1e-6, b - a) * SHUTTER_P);
  }

  function draw(p) {
    whip(p);
    const shift = wShift, speed = wSpeed;
    let impulse = 0;
    const cu = compMat.uniforms;
    let layerTex;
    if (p < CUT) {
      useSky();
      cu.tPlate.value = plateSky;
      layerTex = renderLayer(skyCam, poseSky, skyTime(p), p <= T.skyEnd ? shutter(skyTime, p, 0, T.skyEnd) : shutter(skyTime, p, T.skyEnd, CUT), true);
    } else {
      useTer();
      cu.tPlate.value = plateTer;
      // prach a úlomky vychádzajú spod oboch hláv v okamihu dopadu
      poseTer(0); bell.position.copy(pos); bell.quaternion.copy(quat); bell.updateMatrixWorld();
      dustMat.uniforms.uC0.value.set(0.15, 0, 0).applyMatrix4(bell.matrixWorld).setY(0);
      dustMat.uniforms.uC1.value.set(-0.15, 0, 0).applyMatrix4(bell.matrixWorld).setY(0);
      dustMat.uniforms.uDir.value.copy(rollDir);
      if (p < T.land) {
        dust.visible = chips.visible = false;
        layerTex = renderLayer(terCam, poseTer, terTime(p), shutter(terTime, p, CUT, T.land), true);
      } else {
        const t = postTime(p);
        dustMat.uniforms.uT.value = t; chipMat.uniforms.uT.value = t;
        dust.visible = t < POST_T; chips.visible = true;
        // krátky náraz kamery (1–2 snímky), tlmený
        impulse = 0.007 * Math.exp(-t / 0.03) * Math.sin(t * 2 * Math.PI * 14);
        layerTex = renderLayer(terCam, poseTer, t, t < POST_T ? shutter(postTime, p, T.land, T.settle) : 0, t < POST_T);
      }
    }
    cu.tLayer.value = layerTex;
    cu.uShift.value = shift + impulse;
    const blur = speed * BLUR_K;
    cu.uBlur.value = blur; cu.uLBlur.value = blur * 0.55;
    cu.uTaps.value = blur > 0.002 ? Math.min(48, Math.max(8, Math.ceil(blur * H / 6))) : 1;
    cu.uSeed.value = (p * 997.13) % 101;
    renderer.setRenderTarget(null);
    renderer.render(compScene, postCam);
  }

  function frame() {
    raf = 0;
    if (!running || !loaded || disposed) return;
    if (progress === lastP) return;
    lastP = progress;
    draw(progress);
  }
  function kick() { if (!raf && running && loaded && !disposed) raf = requestAnimationFrame(frame); }

  resize();

  // ——— Načítanie ———
  // na veľkých displejoch by sa 1440 px záber zväčšoval → načíta sa plné rozlíšenie 2160 × 3840
  const big = () => !small && W / (1440 * crop.w) > 1.15;
  const ready = (async () => {
    const useBig = big();
    const hdrP = new HDRLoader().setDataType(HalfFloatType).loadAsync(new URL('env-venice_sunset-1k.hdr', base).href);
    const skyP = loadPlate(base, 'intro-nebo', useBig);
    const terP = loadPlate(base, 'intro-terasa', useBig);
    hdr = await hdrP;
    if (disposed) return;
    hdr.mapping = EquirectangularReflectionMapping;
    envRotY.v = worldSunRotation();
    envSky = pmrem.fromEquirectangular(hdr).texture;
    buildTerraceEnv();
    plateSky = makeTexture(await skyP);
    plateTer = makeTexture(await terP);
    if (disposed) return;
    // predkompilovanie shaderov oboch záberov, aby prvé skrolovanie nezaseklo
    loaded = true; lastP = -1;
    draw(0.62); draw(0.3);
    lastP = -1; frame();
    canvas.dataset.ready = '1';
    canvas.dispatchEvent(new Event('introready'));
  })();
  ready.catch(err => { canvas.dataset.ready = 'error'; canvas.dispatchEvent(new CustomEvent('introerror', { detail: err })); });

  // bod dopadu na obrazovke (0..1, y zhora) – pre texty nad scénou
  function landScreenPoint() {
    screenOf(tmpV.set(spot.x, R, spot.z), terCam);
    return { x: proj.x * 0.5 + 0.5, y: 0.5 - proj.y * 0.5 };
  }

  return {
    ready,
    setProgress(p) { progress = clamp(+p || 0); kick(); },
    resize() { resize(); lastP = -1; kick(); },
    pause() {
      // rozpracovaná snímka sa ešte dokreslí (napr. setProgress(1) a hneď pause())
      if (raf) { cancelAnimationFrame(raf); raf = 0; if (loaded && !disposed && progress !== lastP) { lastP = progress; draw(progress); } }
      running = false;
    },
    resume() { if (!running) { running = true; lastP = -1; kick(); } },
    landScreenPoint,
    impactScreenPoint: landScreenPoint,
    dispose() {
      disposed = true; this.pause();
      rtSub?.dispose(); rtAcc?.dispose(); envSky?.dispose(); envTer?.dispose(); hdr?.dispose(); pmrem.dispose();
      plateSky?.dispose(); plateTer?.dispose(); dot.dispose();
      scene.traverse(o => { if (o.isMesh || o.isPoints) { o.geometry.dispose(); for (const m of [].concat(o.material)) { for (const k in m) if (m[k] && m[k].isTexture) m[k].dispose(); m.dispose(); } } });
      compMat.dispose(); blitMat.dispose(); quad.dispose();
      renderer.dispose();
    },
  };
}
