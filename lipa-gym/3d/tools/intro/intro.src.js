// Úvodná filmová scéna GYM KLUB: z večernej oblohy padne šesťhranná jednoručka na gumovú podlahu
// so šprintérskou dráhou. Pád je voľný pád (g = 9,81), rotácia konštantná, dopad má dva údery
// (najprv jedna hlava, potom druhá), krátky odskok, prach a tlakovú vlnu. Vlna otvorí pohľad
// na skutočnú fotku funkčnej zóny, ktorá je pod plátnom (plátno je v otvore priehľadné).
// Pohybová neostrosť: niekoľko podsnímok v rámci uzávierky 180° sa spriemeruje.
// Zostavenie: node tools/intro/build.mjs → assets/intro.js
import {
  WebGLRenderer, Scene, PerspectiveCamera, Vector3, Vector2, Quaternion, Euler, Matrix4, Color,
  Mesh, Group, Points, PlaneGeometry, CylinderGeometry, ExtrudeGeometry, Shape, BufferGeometry,
  BufferAttribute, MeshStandardMaterial, MeshPhysicalMaterial, ShaderMaterial, CanvasTexture,
  RepeatWrapping, SRGBColorSpace, LinearSRGBColorSpace, DirectionalLight, HemisphereLight, Fog, PMREMGenerator,
  ACESFilmicToneMapping, PCFSoftShadowMap, WebGLRenderTarget, HalfFloatType, AdditiveBlending,
  NoBlending, OrthographicCamera, MathUtils, NormalBlending, Object3D, DepthTexture, BoxGeometry, InstancedMesh, FogExp2
} from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky.js';

const G = 9.81;
const DROP_H = 12.5;                       // výška, z ktorej činka padá (m)
const T_IMPACT = Math.sqrt(2 * DROP_H / G);  // ≈ 1,60 s
const T_OPEN = T_IMPACT + 0.1;             // začiatok otvárania
const OPEN_DUR = 1.15;
export const DURATION = T_OPEN + OPEN_DUR + 0.05;

const smooth = (a, b, x) => { const t = MathUtils.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const easeOut = x => 1 - Math.pow(1 - x, 3);

function rand(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

// ---------- textúry vyrobené v prehliadači (žiadne cudzie súbory) ----------
function rubberTextures(size) {
  const r = rand(7);
  const c = document.createElement('canvas'); c.width = c.height = size;
  const x = c.getContext('2d');
  x.fillStyle = '#1b1c1c'; x.fillRect(0, 0, size, size);
  // granule EPDM: tisíce drobných zŕn rôzneho jasu
  const n = size * size / 9;
  for (let i = 0; i < n; i++) {
    const v = 18 + Math.floor(r() * 30 * r());
    x.fillStyle = `rgb(${v},${v},${v + 1})`;
    const s = 1 + r() * 2.2;
    x.fillRect(r() * size, r() * size, s, s);
  }
  for (let i = 0; i < n / 60; i++) {           // riedke svetlejšie zrná
    const v = 70 + r() * 50; x.fillStyle = `rgb(${v},${v},${v})`;
    x.fillRect(r() * size, r() * size, 1.3, 1.3);
  }
  // škára na okraji dlaždice 1 × 1 m
  x.fillStyle = 'rgba(0,0,0,.75)'; x.fillRect(0, 0, size, 2); x.fillRect(0, 0, 2, size);
  const color = new CanvasTexture(c);
  color.colorSpace = SRGBColorSpace; color.wrapS = color.wrapT = RepeatWrapping; color.anisotropy = 8;
  // hrboľatosť z toho istého obrazu
  const bump = new CanvasTexture(c); bump.wrapS = bump.wrapT = RepeatWrapping; bump.colorSpace = LinearSRGBColorSpace;
  return { color, bump };
}

function knurlTexture() {
  const s = 256, c = document.createElement('canvas'); c.width = c.height = s;
  const x = c.getContext('2d');
  x.fillStyle = '#808080'; x.fillRect(0, 0, s, s);
  x.strokeStyle = '#303030'; x.lineWidth = 3;
  for (let i = -s; i < 2 * s; i += 16) {
    x.beginPath(); x.moveTo(i, 0); x.lineTo(i + s, s); x.stroke();
    x.beginPath(); x.moveTo(i + s, 0); x.lineTo(i, s); x.stroke();
  }
  const t = new CanvasTexture(c); t.wrapS = t.wrapT = RepeatWrapping; t.colorSpace = LinearSRGBColorSpace;
  return t;
}

function puffTexture() {
  const s = 64, c = document.createElement('canvas'); c.width = c.height = s;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.45, 'rgba(255,255,255,.45)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, s, s);
  return new CanvasTexture(c);
}

// ---------- šesťhranná jednoručka (22,5 kg: hlavy Ø 21 cm, rúčka 13 cm) ----------
function dumbbell(knurl) {
  const g = new Group();
  const hex = new Shape();
  const R = 0.105;
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * Math.PI * 2;
    const p = [Math.cos(a) * R, Math.sin(a) * R];
    i ? hex.lineTo(...p) : hex.moveTo(...p);
  }
  hex.closePath();
  const HL = 0.118, bev = 0.009;
  const headGeo = new ExtrudeGeometry(hex, { depth: HL - 2 * bev, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 4, curveSegments: 1 });
  headGeo.translate(0, 0, -(HL - 2 * bev) / 2);
  headGeo.rotateY(Math.PI / 2);                  // os pozdĺž X
  headGeo.computeVertexNormals();
  const rubber = new MeshPhysicalMaterial({ color: 0x101112, roughness: 0.62, metalness: 0, clearcoat: 0.25, clearcoatRoughness: 0.55, envMapIntensity: 0.9 });
  const chrome = new MeshStandardMaterial({ color: 0xd9dcdf, metalness: 1, roughness: 0.16, envMapIntensity: 1.25 });
  const grip = new MeshStandardMaterial({ color: 0xc9ccd0, metalness: 1, roughness: 0.34, bumpMap: knurl, bumpScale: 1.2, envMapIntensity: 1.1 });
  knurl.repeat.set(3, 6);
  const handleL = 0.132, collar = 0.018;
  const off = handleL / 2 + collar + HL / 2;
  for (const s of [-1, 1]) {
    const h = new Mesh(headGeo, rubber); h.position.x = s * off; h.castShadow = h.receiveShadow = true; g.add(h);
    // oceľový krúžok medzi hlavou a rúčkou a lesklé čelo hlavy
    const c = new Mesh(new CylinderGeometry(0.03, 0.034, collar, 40), chrome);
    c.rotation.z = Math.PI / 2; c.position.x = s * (handleL / 2 + collar / 2); c.castShadow = true; g.add(c);
    const cap = new Mesh(new CylinderGeometry(0.032, 0.032, 0.004, 40), chrome);
    cap.rotation.z = Math.PI / 2; cap.position.x = s * (off + HL / 2 + 0.001); g.add(cap);
  }
  const hd = new Mesh(new CylinderGeometry(0.0165, 0.0165, handleL, 48, 1, true), grip);
  hd.rotation.z = Math.PI / 2; hd.castShadow = true; g.add(hd);
  g.userData.halfLen = off + HL / 2;
  g.userData.R = R;   // vzdialenosť stredu od plochy šesťuholníka = R·cos30°
  return g;
}

// ---------- prach z gumovej podlahy ----------
function dust(count, tex) {
  const r = rand(11);
  const pos = new Float32Array(count * 3), vel = new Float32Array(count * 3), seed = new Float32Array(count), size = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const a = r() * Math.PI * 2, sp = 0.6 + r() * 2.6, up = 0.15 + r() * 0.9 * r();
    vel[i * 3] = Math.cos(a) * sp; vel[i * 3 + 1] = up; vel[i * 3 + 2] = Math.sin(a) * sp;
    seed[i] = r(); size[i] = 0.02 + r() * 0.07;
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(pos, 3));
  geo.setAttribute('vel', new BufferAttribute(vel, 3));
  geo.setAttribute('seed', new BufferAttribute(seed, 1));
  geo.setAttribute('size', new BufferAttribute(size, 1));
  const mat = new ShaderMaterial({
    transparent: true, depthWrite: false, blending: NormalBlending,
    uniforms: { age: { value: -1 }, map: { value: tex }, light: { value: new Color(0.8, 0.7, 0.6) }, amb: { value: new Color(0.2, 0.21, 0.23) }, px: { value: 800 }, origin: { value: new Vector3() } },
    vertexShader: `
      attribute vec3 vel; attribute float seed; attribute float size;
      uniform float age; uniform float px; uniform vec3 origin;
      varying float vA; varying float vS;
      void main(){
        float t = max(age, 0.0);
        // odpor vzduchu: rýchlosť klesá exponenciálne, prach sa vznáša a pomaly klesá
        float k = 3.2 + seed * 2.0;
        vec3 p = origin + vel * (1.0 - exp(-k * t)) / k;
        p.y += -0.12 * t * t + 0.02;
        p.y = max(p.y, 0.005);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        float grow = size * (1.0 + t * 2.4);
        gl_PointSize = px * grow / -mv.z;
        vA = age < 0.0 ? 0.0 : smoothstep(0.0, 0.05, t) * (1.0 - smoothstep(0.35, 1.5 + seed * 0.6, t)) * (0.07 + 0.08 * seed);
        vS = seed;
      }`,
    fragmentShader: `
      uniform sampler2D map; uniform vec3 light; uniform vec3 amb;
      varying float vA; varying float vS;
      void main(){
        float m = texture2D(map, gl_PointCoord).a;
        vec3 c = mix(amb, light, 0.55 + 0.3 * vS) * 0.9;
        gl_FragColor = vec4(c, m * vA);
      }`
  });
  const pts = new Points(geo, mat); pts.frustumCulled = false; pts.renderOrder = 2;
  return pts;
}

// ---------- záverečné zloženie: priemer podsnímok, tlaková vlna a otvor do fitka ----------
const quadVS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const compFS = `
  #include <packing>
  uniform sampler2D tex; uniform sampler2D dep; uniform vec2 res; uniform vec2 c; uniform float rad; uniform float wave; uniform float wAmp; uniform float fade;
  uniform float cn; uniform float cf; uniform float focus; uniform float ap; uniform float maxC;
  varying vec2 vUv;
  float coc(vec2 uv){
    float z = -perspectiveDepthToViewZ(texture2D(dep, uv).x, cn, cf);
    return min(maxC, ap * abs(z - focus) / max(z, 0.01));
  }
  void main(){
    vec2 px = vUv * res;
    vec2 d = px - c; float r = length(d); vec2 dir = d / max(r, 1.0);
    float m = min(res.x, res.y);
    // tlaková vlna tesne po dopade: tenký prstenec lomu svetla, rýchlo slabne
    float band = exp(-pow((r - wave) / (0.014 * m), 2.0));
    vec2 uv = vUv - dir * band * wAmp / res;
    // okraj otvoru: vzduch sa láme ako cez šošovku
    float edge = exp(-pow((r - rad) / (0.03 * m), 2.0));
    uv -= dir * edge * 0.02 * m / res * step(1.0, rad);
    // hĺbka ostrosti: rozostrenie podľa vzdialenosti od roviny zaostrenia (zlatý uhol, 24 vzoriek)
    float c0 = coc(uv);
    vec4 acc = texture2D(tex, uv); float wsum = 1.0;
    if (c0 > 0.6) {
      for (int i = 1; i < 24; i++) {
        float fi = float(i);
        float rr = sqrt(fi / 24.0) * c0;
        float an = fi * 2.39996;
        vec2 o = vec2(cos(an), sin(an)) * rr / res;
        float cs = coc(uv + o);
        float w = smoothstep(rr - 1.0, rr + 1.0, max(cs, c0 * 0.35));
        acc += texture2D(tex, uv + o) * w; wsum += w;
      }
    }
    vec4 col = acc / wsum;
    col.rgb += band * wAmp * 0.0025;
    gl_FragColor = vec4(col.rgb, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    float a = smoothstep(rad - 0.01 * m, rad + 0.01 * m, r) * fade;
    gl_FragColor = vec4(gl_FragColor.rgb * a, a);
  }`;
const accFS = `uniform sampler2D tex; uniform float w; varying vec2 vUv; void main(){ gl_FragColor = texture2D(tex, vUv) * w; }`;

export async function createIntro(host, opts = {}) {
  const mobile = matchMedia('(pointer: coarse)').matches || innerWidth < 760;
  const renderer = new WebGLRenderer({ antialias: true, alpha: true, premultipliedAlpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.5 : 1.75));
  renderer.toneMapping = ACESFilmicToneMapping; renderer.toneMappingExposure = 0.62;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 0);
  const cv = renderer.domElement; cv.setAttribute('aria-hidden', 'true'); cv.className = 'intro-cv';

  const scene = new Scene();
  const cam = new PerspectiveCamera(40, 1, 0.05, 2000);

  // obloha: neskoré popoludnie, slnko nízko, riedke oblaky
  const sky = new Sky(); sky.scale.setScalar(1000);
  const su = sky.material.uniforms;
  su.turbidity.value = 9; su.rayleigh.value = 1.2; su.mieCoefficient.value = 0.006; su.mieDirectionalG.value = 0.86;
  su.cloudCoverage.value = 0.34; su.cloudDensity.value = 0.5; su.cloudScale.value = 0.0009; su.cloudElevation.value = 0.35; su.cloudSpeed.value = 0.00003;
  const sunDir = new Vector3().setFromSphericalCoords(1, MathUtils.degToRad(90 - 13), MathUtils.degToRad(-128));
  su.sunPosition.value.copy(sunDir);
  // okolie pre odrazy chrómu: tá istá obloha
  const pm = new PMREMGenerator(renderer);
  const skyScene = new Scene(); const sky2 = new Sky(); sky2.scale.setScalar(1000);
  for (const k in su) sky2.material.uniforms[k].value = su[k].value?.clone ? su[k].value.clone() : su[k].value;
  sky2.material.uniforms.showSunDisc.value = 0;
  skyScene.add(sky2);
  const env = pm.fromScene(skyScene, 0, 0.1, 1000);
  scene.environment = env.texture; scene.environmentIntensity = 0.85;
  scene.add(sky);
  pm.dispose();

  const horizon = new Color(0.62, 0.62, 0.64);
  scene.fog = new FogExp2(horizon, 0.0017);

  const sun = new DirectionalLight(0xffe2c2, 3.1);
  sun.position.copy(sunDir).multiplyScalar(20);
  sun.castShadow = true; sun.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
  const sc = sun.shadow.camera; sc.left = -3; sc.right = 3; sc.top = 3; sc.bottom = -3; sc.near = 1; sc.far = 45;
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.01; sun.shadow.radius = 3;
  scene.add(sun, sun.target);
  scene.add(new HemisphereLight(0xbfd4ff, 0x1a1a1a, 0.18));

  // podlaha: gumové dlaždice, červené čiary šprintérskej dráhy ako vo fitku
  const tx = rubberTextures(mobile ? 512 : 1024);
  tx.color.repeat.set(36, 36); tx.bump.repeat.set(36, 36);
  const floor = new Mesh(new PlaneGeometry(36, 36), new MeshStandardMaterial({ map: tx.color, bumpMap: tx.bump, bumpScale: 0.6, roughness: 0.9, metalness: 0, envMapIntensity: 0.12, color: 0x8c8c8c }));
  floor.position.z = -8;
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const paint = new MeshStandardMaterial({ color: 0xb4221a, roughness: 0.78, envMapIntensity: 0.5, polygonOffset: true, polygonOffsetFactor: -2 });
  const stripe = (w, l, x, z, ry = 0) => { const m = new Mesh(new PlaneGeometry(w, l), paint); m.rotation.set(-Math.PI / 2, 0, ry); m.position.set(x, 0.0015, z); m.receiveShadow = true; scene.add(m); };
  stripe(0.07, 60, -1.25, -20); stripe(0.07, 60, 1.25, -20);
  for (let z = 1.5; z > -30; z -= 1.5) { stripe(0.05, 0.28, -1.08, z, Math.PI / 2); stripe(0.05, 0.28, 1.08, z, Math.PI / 2); }
  stripe(2.5, 0.07, 0, -0.9);

  // strešná terasa: betónový atik so zábradlím, za ním v opare mesto
  const concrete = new MeshStandardMaterial({ color: 0x8d8a84, roughness: 0.95, envMapIntensity: 0.6 });
  const steel = new MeshStandardMaterial({ color: 0x9aa0a6, metalness: 1, roughness: 0.35 });
  const wall = (w, d, x, z) => { const m = new Mesh(new BoxGeometry(w, 1.05, d), concrete); m.position.set(x, 0.525, z); m.receiveShadow = m.castShadow = true; scene.add(m); };
  wall(36, 0.28, 0, -26); wall(0.28, 36, -18, -8); wall(0.28, 36, 18, -8);
  const rail = new Mesh(new CylinderGeometry(0.025, 0.025, 36, 12), steel); rail.rotation.z = Math.PI / 2; rail.position.set(0, 1.35, -26); scene.add(rail);
  for (let x = -17.5; x <= 17.5; x += 2.5) { const p = new Mesh(new CylinderGeometry(0.018, 0.018, 0.32, 8), steel); p.position.set(x, 1.2, -26); scene.add(p); }
  const ground = new Mesh(new PlaneGeometry(4000, 4000), new MeshStandardMaterial({ color: 0x3b3d3c, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -22; scene.add(ground);
  {
    const rr = rand(23), n = mobile ? 90 : 160;
    const city = new InstancedMesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial({ color: 0x9a9892, roughness: 0.9, envMapIntensity: 0.5 }), n);
    const m4 = new Matrix4(), q = new Quaternion(), sc3 = new Vector3(), ps = new Vector3();
    for (let i = 0; i < n; i++) {
      const a = MathUtils.degToRad(-80 + rr() * 160), d = 520 + rr() * 1300;
      const w = 18 + rr() * 40, h = 12 + Math.pow(rr(), 2.6) * 60, dp = 18 + rr() * 40;
      ps.set(Math.sin(a) * d, -22 + h / 2, -Math.cos(a) * d);
      q.setFromAxisAngle(new Vector3(0, 1, 0), rr() * Math.PI); sc3.set(w, h, dp);
      city.setMatrixAt(i, m4.compose(ps, q, sc3));
    }
    scene.add(city);
  }

  // jemný kontaktný tieň pod činkou (okolité zatienenie), silnie pri zemi
  const aoMat = new ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { k: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform float k; varying vec2 vUv; void main(){ vec2 p = (vUv - 0.5) * vec2(1.0, 2.2); float d = length(p) * 2.0; gl_FragColor = vec4(0.0,0.0,0.0, k * 0.55 * pow(max(0.0, 1.0 - d), 1.6)); }` });
  const ao = new Mesh(new PlaneGeometry(0.62, 0.36), aoMat); ao.rotation.x = -Math.PI / 2; ao.position.y = 0.002; ao.renderOrder = 1; scene.add(ao);

  const db = dumbbell(knurlTexture()); scene.add(db);
  const flatH = db.userData.R * Math.cos(Math.PI / 6);   // výška osi nad zemou v pokoji
  const yaw = MathUtils.degToRad(-17);
  const rest = new Quaternion().setFromEuler(new Euler(0, yaw, 0));
  // otáčanie počas pádu okolo šikmej osi, konštantná uhlová rýchlosť (bez vonkajšieho momentu)
  const spinAxis = new Vector3(0.35, 0.25, 1).normalize();
  const spinW = 1.9;
  const tilt0 = MathUtils.degToRad(9);    // pri prvom dotyku je činka naklonená, ľavá hlava dopadne prvá

  const dustPts = dust(mobile ? 140 : 260, puffTexture()); scene.add(dustPts);

  // kamera: blízko pri zemi, pozerá za padajúcou činkou a pomaly sa približuje
  // výška bodu, na ktorý kamera mieri v úvodnom zábere (asi 45° nad obzor)
  let estab = 4, drop = 0.2;   // drop: o koľko kamera na konci mieri pod činku (na výšku viac, činka ostane nad titulkom)
  const camFrom = new Vector3(0.9, 0.45, 4.1), camTo = new Vector3(0.5, 0.3, 2.05);

  // ciele na podsnímky a zloženie
  const rtOpts = { type: HalfFloatType, depthBuffer: true };
  let rtS = new WebGLRenderTarget(1, 1, rtOpts), rtA = new WebGLRenderTarget(1, 1, { type: HalfFloatType, depthBuffer: false });
  rtS.samples = mobile ? 0 : 4;
  rtS.depthTexture = new DepthTexture(1, 1);
  const qCam = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const acc = new ShaderMaterial({ uniforms: { tex: { value: null }, w: { value: 1 } }, vertexShader: quadVS, fragmentShader: accFS, blending: AdditiveBlending, depthTest: false, depthWrite: false, transparent: true, toneMapped: false });
  const comp = new ShaderMaterial({
    uniforms: { tex: { value: rtA.texture }, dep: { value: rtS.depthTexture }, res: { value: new Vector2() }, c: { value: new Vector2() }, rad: { value: 0 }, wave: { value: 0 }, wAmp: { value: 0 }, fade: { value: 1 }, cn: { value: 0.05 }, cf: { value: 2000 }, focus: { value: 3 }, ap: { value: 10 }, maxC: { value: 12 } },
    vertexShader: quadVS, fragmentShader: compFS, blending: NoBlending, depthTest: false, depthWrite: false, transparent: true, toneMapped: true
  });
  const quad = new Mesh(new PlaneGeometry(2, 2), acc); quad.frustumCulled = false;
  const qScene = new Scene(); qScene.add(quad);

  let W = 1, H = 1;
  function resize() {
    W = host.clientWidth || innerWidth; H = host.clientHeight || innerHeight;
    renderer.setSize(W, H, false);
    const pr = renderer.getPixelRatio();
    rtS.setSize(Math.round(W * pr), Math.round(H * pr)); rtA.setSize(Math.round(W * pr), Math.round(H * pr));
    cam.aspect = W / H;
    // na výšku širší zorný uhol, aby činka ostala celá v zábere
    cam.fov = W / H < 1 ? 58 : 38;
    estab = W / H < 1 ? 5.2 : 4.1; drop = W / H < 1 ? 0.85 : 0.22;
    cam.updateProjectionMatrix();
    comp.uniforms.res.value.set(W * pr, H * pr);
    dustPts.material.uniforms.px.value = H * pr / (2 * Math.tan(MathUtils.degToRad(cam.fov / 2)));
  }
  resize();

  const look = new Vector3(), lookS = new Vector3(0, DROP_H * 0.75, 0), shake = new Vector3();
  const tmpQ = new Quaternion(), tmpQ2 = new Quaternion(), impactScreen = new Vector3();
  let lookInit = false;

  // stav scény v čase t (sekundy od začiatku)
  function pose(t) {
    let y, q;
    if (t < T_IMPACT) {
      const tr = T_IMPACT - t;                       // čas do dopadu
      y = flatH + 0.5 * G * tr * tr + 0.03;
      tmpQ.setFromAxisAngle(spinAxis, -spinW * tr);  // pootočenie pred dopadom
      tmpQ2.setFromAxisAngle(new Vector3(0, 0, 1), tilt0);
      q = rest.clone().multiply(tmpQ2).multiply(tmpQ);
    } else {
      const s = t - T_IMPACT;
      // druhá hlava dopadne po ~55 ms, potom malý odskok (guma pohltí väčšinu energie)
      const tilt = tilt0 * Math.max(0, 1 - s / 0.055) + (s > 0.055 ? MathUtils.degToRad(1.6) * Math.sin(Math.min(1, (s - 0.055) / 0.16) * Math.PI) * Math.exp(-(s - 0.055) * 6) : 0);
      const hop = s > 0.055 ? Math.max(0, Math.sin(Math.min(1, (s - 0.055) / 0.17) * Math.PI)) * 0.016 : 0;
      y = flatH + 0.03 * Math.max(0, 1 - s / 0.055) + hop;
      tmpQ2.setFromAxisAngle(new Vector3(0, 0, 1), tilt);
      q = rest.clone().multiply(tmpQ2);
    }
    return { y, q };
  }

  function shot(t, dt) {
    const { y, q } = pose(t);
    db.position.set(0, y, 0); db.quaternion.copy(q);
    ao.material.uniforms.k.value = smooth(1.6, 0.05, y);
    // kamera: pomalý nájazd, operátor sleduje činku s oneskorením
    const k = easeOut(MathUtils.clamp(t / (T_IMPACT + 0.6), 0, 1));
    cam.position.lerpVectors(camFrom, camTo, k);
    // najprv pokojný záber oblohy, činka vletí do obrazu zhora a operátor ju začne sledovať
    const follow = smooth(0.45, 1.05, t);
    look.set(0, MathUtils.lerp(estab, Math.max(0.2, y - 0.05), follow) - drop * smooth(T_IMPACT - 0.6, T_IMPACT + 0.3, t), 0);
    if (!lookInit) { lookS.copy(look); lookInit = true; }
    const f = 1 - Math.exp(-dt * (t < T_IMPACT ? 9 : 5));
    lookS.lerp(look, f);
    // otras po dopade: tlmená pružina, pár centimetrov
    const s = t - T_IMPACT;
    shake.set(0, 0, 0);
    if (s > 0) {
      const e = Math.exp(-s * 9);
      shake.set(Math.sin(s * 71) * 0.006 * e, Math.sin(s * 53 + 1) * 0.014 * e, 0);
    }
    cam.position.add(shake);
    cam.lookAt(lookS.x, lookS.y + shake.y * 0.5, lookS.z);
    dustPts.material.uniforms.age.value = s;
  }

  // zdroj hodín: skutočný čas alebo __step pri nahrávaní
  let t0 = -1, prev = 0, clock = 0, slow = 0, last = 0, raf = 0, done = false, impacted = false, fade = 1, fadeT = -1;
  const onImpact = opts.onImpact || (() => {}), onDone = opts.onDone || (() => {});

  function frame(now) {
    raf = 0;
    if (done) return;
    // hodiny scény: krok najviac 50 ms, takže pri zaseknutí sa film spomalí, ale nepreskočí dopad
    if (t0 < 0) { t0 = now; prev = now; }
    const real = (now - prev) / 1000; prev = now;
    const dt = Math.min(0.05, Math.max(0.001, real));
    clock += t0 === now ? 0 : dt;
    const t = clock; last = t;
    // príliš pomalé zariadenie: po troch ťažkých snímkach sa úvod potichu zoslabí a web ide ďalej
    if (real > 0.12 && t < T_IMPACT) slow++;
    if (slow >= 3 && fadeT < 0) fadeT = now;
    // pohybová neostrosť: počet podsnímok podľa rýchlosti činky
    const speed = t < T_IMPACT ? G * t : 0;
    const N = speed > 5 ? (mobile ? 3 : 5) : 1;
    const shutter = 1 / 60 * 0.5;
    renderer.setRenderTarget(rtA); renderer.setClearColor(0x000000, 0); renderer.clear();
    for (let i = 0; i < N; i++) {
      const ts = t - shutter * (N > 1 ? i / (N - 1) - 0.5 : 0);
      shot(ts, i === 0 ? dt : 0);
      renderer.setRenderTarget(rtS); renderer.clear(); renderer.render(scene, cam);
      quad.material = acc; acc.uniforms.tex.value = rtS.texture; acc.uniforms.w.value = 1 / N;
      renderer.setRenderTarget(rtA); renderer.autoClear = false; renderer.render(qScene, qCam); renderer.autoClear = true;
    }
    if (!impacted && t >= T_IMPACT) { impacted = true; onImpact(); }
    // otvor: stred v mieste dopadu na obrazovke, rozšíri sa za roh obrazu
    impactScreen.set(0, 0.05, 0).project(cam);
    const pr = renderer.getPixelRatio();
    const cx = (impactScreen.x * 0.5 + 0.5) * W * pr, cy = (impactScreen.y * 0.5 + 0.5) * H * pr;
    const far = Math.hypot(Math.max(cx, W * pr - cx), Math.max(cy, H * pr - cy)) * 1.12;
    const o = MathUtils.clamp((t - T_OPEN) / OPEN_DUR, 0, 1);
    const oe = o < 0.5 ? 4 * o * o * o : 1 - Math.pow(-2 * o + 2, 3) / 2;
    const s = t - T_IMPACT, m = Math.min(W, H) * pr;
    comp.uniforms.c.value.set(cx, cy);
    comp.uniforms.rad.value = o > 0 ? oe * far : 0;
    comp.uniforms.wave.value = s > 0 ? s * 1.9 * m : 0;
    comp.uniforms.wAmp.value = s > 0 ? 26 * pr * Math.exp(-s * 5.5) : 0;
    // zoslabnutie po preskočení ide v reálnom čase (0,35 s), nie v čase scény
    if (fadeT >= 0) fade = Math.max(0, 1 - (now - fadeT) / 350);
    comp.uniforms.fade.value = fade;
    // zaostrenie sleduje činku (clona ako pri objektíve 85 mm f/2)
    const fd = cam.position.distanceTo(db.position);
    comp.uniforms.focus.value = fd;
    comp.uniforms.ap.value = 0.028 * m * Math.min(1, 3 / fd);   // pri vzdialenom zaostrení sa pozadie rozostrí menej
    comp.uniforms.maxC.value = 0.011 * m;
    quad.material = comp;
    renderer.setRenderTarget(null); renderer.render(qScene, qCam);
    if (t >= DURATION || fade <= 0) { finish(); return; }
    raf = requestAnimationFrame(frame);
  }

  function finish() {
    if (done) return; done = true;
    cancelAnimationFrame(raf);
    if (!impacted) { impacted = true; onImpact(); }
    onDone();
    removeEventListener('resize', resize);
    setTimeout(() => {
      cv.remove();
      scene.traverse(o => { o.geometry?.dispose(); const m = o.material; if (m) (Array.isArray(m) ? m : [m]).forEach(x => { for (const k in x) x[k]?.isTexture && x[k].dispose(); x.dispose(); }); });
      env.dispose(); rtS.dispose(); rtA.dispose(); renderer.dispose(); renderer.forceContextLoss();
    }, 60);
  }

  addEventListener('resize', resize);
  // prvá snímka sa pripraví vopred (kompilácia shaderov), aby štart nebol trhaný
  shot(0, 0.016);
  renderer.compile(scene, cam);
  renderer.setRenderTarget(rtS); renderer.render(scene, cam); renderer.setRenderTarget(null);

  return {
    canvas: cv,
    duration: DURATION,
    impactAt: T_IMPACT,
    play() { host.append(cv); raf = requestAnimationFrame(frame); },
    // preskočenie: krátke zoslabnutie namiesto strihu
    skip() { if (done) return; if (fadeT < 0) fadeT = performance.now(); if (!raf) finish(); },
    destroy: finish,
  };
}
