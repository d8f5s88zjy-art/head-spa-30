// GYM KLUB 3D – úvodná scéna: činka padá z neba nad Nitrou a dopadne pred vchod.
// Celý stav scény je funkcia jedného čísla p (0 až 1), ktoré posiela tour.js podľa skrolovania,
// takže scéna ide rovnako dopredu aj dozadu a po obnovení stránky v strede sa nič neskočí.
// Zdroj sa zbalí do ../assets/intro.js príkazom v build.sh (esbuild, len použité časti three.js).

import {
  WebGLRenderer, Scene, PerspectiveCamera, OrthographicCamera, Mesh, Group, Points,
  PlaneGeometry, SphereGeometry, CylinderGeometry, ExtrudeGeometry, RingGeometry, BufferGeometry,
  BufferAttribute, Shape, ShaderMaterial, MeshPhysicalMaterial, MeshBasicMaterial,
  DirectionalLight, HemisphereLight, Vector3, Quaternion, Euler, Color, CanvasTexture,
  RepeatWrapping, SRGBColorSpace, ACESFilmicToneMapping, WebGLRenderTarget, HalfFloatType,
  PMREMGenerator, BackSide, DoubleSide, AdditiveBlending, NormalBlending, MathUtils,
} from 'three';

// Časová os (musí sedieť s textami v tour.js)
export const T = { impact: 0.72, settle: 0.8, irisStart: 0.83, irisEnd: 0.97 };

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const SUN = new Vector3(-0.55, 0.32, -0.77).normalize(); // nízke večerné slnko, ako na záberoch z 26. 9.

// ——— Výška činky nad zemou podľa p ———
// Vysoko: logaritmické priblíženie (konštantný vizuálny rozdiel medzi vrstvami),
// posledné tri metre: zrýchľujúci sa pád ako pri gravitácii.
const H0 = 2200, H1 = 3, REST = 0.0563; // REST = vpísaný polomer šesťhrannej hlavy
export function heightAt(p) {
  const u = clamp(p / T.impact);
  if (u < 0.85) {
    const e = u / 0.85;
    const k = e < 0.5 ? 2 * e * e : 1 - Math.pow(-2 * e + 2, 2) / 2;
    return Math.exp(MathUtils.lerp(Math.log(H0), Math.log(H1), k));
  }
  const v = (u - 0.85) / 0.15;
  return MathUtils.lerp(H1, REST, v * v);
}

// ——— Textúry generované v prehliadači (žiadne ďalšie súbory) ———
function knurlTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#808080'; g.fillRect(0, 0, 128, 128);
  g.strokeStyle = '#d8d8d8'; g.lineWidth = 3;
  for (let i = -128; i < 256; i += 10) {
    g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 128, 128); g.stroke();
    g.beginPath(); g.moveTo(i + 128, 0); g.lineTo(i, 128); g.stroke();
  }
  const t = new CanvasTexture(c); t.wrapS = t.wrapT = RepeatWrapping; t.repeat.set(10, 3);
  return t;
}
function grimeTexture(seed) {
  // jemné opotrebenie gumy: škrabance a svetlejšie miesta, len v roughness mape
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#c4c4c4'; g.fillRect(0, 0, 256, 256);
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 1400; i++) {
    const v = 150 + rnd() * 105 | 0;
    g.fillStyle = `rgba(${v},${v},${v},${0.25 + rnd() * 0.4})`;
    g.fillRect(rnd() * 256, rnd() * 256, 1 + rnd() * 3, 1 + rnd() * 3);
  }
  g.lineWidth = 0.8;
  for (let i = 0; i < 70; i++) {
    const x = rnd() * 256, y = rnd() * 256, a = rnd() * Math.PI, l = 6 + rnd() * 26;
    g.strokeStyle = `rgba(255,255,255,${0.2 + rnd() * 0.35})`;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  const t = new CanvasTexture(c); t.wrapS = t.wrapT = RepeatWrapping;
  return t;
}
function softDot() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.45, 'rgba(255,255,255,.45)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  return new CanvasTexture(c);
}

// ——— Činka: šesťhranné gumené hlavy, chrómová rúčka s vrúbkovaním ———
// Rozmery zodpovedajú bežnej 10 kg šesťhrannej jednoručke (dĺžka asi 34 cm).
function makeDumbbell() {
  const g = new Group();
  const R = 0.065, HEAD = 0.088, GRIP = 0.128;
  const hex = new Shape();
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3, x = Math.cos(a) * (R - 0.005), y = Math.sin(a) * (R - 0.005);
    i ? hex.lineTo(x, y) : hex.moveTo(x, y);
  }
  hex.closePath();
  const headGeo = new ExtrudeGeometry(hex, { depth: HEAD - 0.01, bevelEnabled: true, bevelThickness: 0.005, bevelSize: 0.005, bevelSegments: 3, curveSegments: 1 });
  headGeo.center();
  headGeo.rotateY(Math.PI / 2); // os pozdĺž X, ploché steny hore a dole

  const rubber = new MeshPhysicalMaterial({
    color: 0x1b1c1f, roughness: 0.74, metalness: 0, clearcoat: 0.28, clearcoatRoughness: 0.5,
    roughnessMap: grimeTexture(7), sheen: 0.25, sheenRoughness: 0.8, sheenColor: new Color(0x2a2c30),
  });
  const chrome = new MeshPhysicalMaterial({ color: 0xc9ccd1, metalness: 1, roughness: 0.2 });
  const knurl = knurlTexture();
  const grip = new MeshPhysicalMaterial({ color: 0xb4b8be, metalness: 1, roughness: 0.38, bumpMap: knurl, bumpScale: 0.6, roughnessMap: knurl });
  const steel = new MeshPhysicalMaterial({ color: 0x9aa0a8, metalness: 1, roughness: 0.32 });

  const off = GRIP / 2 + 0.012 + HEAD / 2;
  for (const s of [-1, 1]) {
    const head = new Mesh(headGeo, rubber); head.position.x = s * off; g.add(head);
    const cap = new Mesh(new CylinderGeometry(0.032, 0.032, 0.004, 40), steel);
    cap.rotation.z = Math.PI / 2; cap.position.x = s * (off + HEAD / 2 + 0.001); g.add(cap);
    const bolt = new Mesh(new CylinderGeometry(0.011, 0.011, 0.005, 6), chrome);
    bolt.rotation.z = Math.PI / 2; bolt.position.x = s * (off + HEAD / 2 + 0.004); g.add(bolt);
    const collar = new Mesh(new CylinderGeometry(0.024, 0.024, 0.012, 40), chrome);
    collar.rotation.z = Math.PI / 2; collar.position.x = s * (GRIP / 2 + 0.006); g.add(collar);
  }
  const handle = new Mesh(new CylinderGeometry(0.0165, 0.0165, GRIP, 40, 1, true), grip);
  handle.rotation.z = Math.PI / 2; g.add(handle);
  g.traverse(o => { if (o.isMesh) o.castShadow = false; });
  return g;
}

// ——— Zem ako sústredné prstence: husté pri mieste dopadu, riedke do diaľky.
// Dva obrovské trojuholníky by pri kamere 20 cm nad zemou stratili presnosť a zem by sa rozpadla. ———
function radialGround() {
  const SEG = 72, radii = [0];
  for (let r = 0.04; r < 22000; r *= 1.22) radii.push(r);
  const pos = [], idx = [];
  for (const r of radii) for (let i = 0; i <= SEG; i++) { const a = i / SEG * Math.PI * 2; pos.push(Math.cos(a) * r, 0, Math.sin(a) * r); }
  for (let k = 0; k < radii.length - 1; k++) for (let i = 0; i < SEG; i++) {
    const a = k * (SEG + 1) + i, b = a + SEG + 1;
    idx.push(a, a + 1, b, a + 1, b + 1, b);
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  g.setIndex(idx);
  return g;
}

// ——— Obloha ———
const skyVert = `varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = modelViewMatrix*vec4(position,1.); gl_Position = projectionMatrix*p; gl_Position.z = gl_Position.w; }`;
const skyFrag = `
uniform vec3 uSun; varying vec3 vDir;
void main(){
  vec3 d = normalize(vDir);
  float h = d.y;
  vec3 zen = vec3(.07,.17,.42), hor = vec3(.62,.62,.64), low = vec3(.36,.37,.40);
  vec3 c = mix(hor, zen, pow(clamp(h,0.,1.), .4));
  c = mix(c, vec3(.9,.72,.55), pow(1.-abs(h),12.)*.35*max(dot(normalize(vec3(d.x,0.,d.z)), normalize(vec3(uSun.x,0.,uSun.z))),0.));
  c = mix(c, low, smoothstep(0.,-.25,h));
  float s = max(dot(d, uSun), 0.);
  c += vec3(1.,.7,.42) * (pow(s, 8.)*.28 + pow(s, 90.)*.8);
  c += vec3(1.,.9,.75) * smoothstep(.99975,.9999,s) * 5.;
  gl_FragColor = vec4(c, 1.);
}`;

// ——— Zem: z výšky mozaika mesta a polí, pri dopade teraco pred vchodom ———
const noiseGLSL = `
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),u.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x), u.y); }
float fbm(vec2 p){ float v=0., a=.5; for(int i=0;i<4;i++){ v+=a*noise(p); p=p*2.03+17.1; a*=.5; } return v; }
`;
const groundVert = `varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`;
const groundFrag = `
uniform vec3 uSun; uniform vec3 uFog; uniform float uFogD;
varying vec3 vW;
${noiseGLSL}
vec3 city(vec2 p){
  vec2 w = vec2(fbm(p/700.), fbm(p/700.+5.2));
  float ang = (fbm(p/3400.)-.5)*.8;
  mat2 R = mat2(cos(ang),-sin(ang),sin(ang),cos(ang));
  vec2 q = R*(p + (w-.5)*120.)/vec2(78.,118.); vec2 id = floor(q); vec2 f = fract(q);
  float r = hash(id), r2 = hash(id+7.3);
  float district = fbm(p/1400.);
  vec3 roof = mix(vec3(.42,.41,.40), vec3(.47,.36,.31), step(.8, r2)) * (.85 + .3*hash(id+1.7));
  vec3 park = vec3(.19,.25,.15) * (.7 + .5*noise(p/7.));
  vec3 field = mix(vec3(.47,.43,.30), vec3(.30,.36,.20), hash(floor(p/260.)));
  vec3 c = r < .34 ? park : mix(roof, park, .35*noise(p/14.)) * (.85 + .3*noise(p/6.));
  c = mix(field, c, smoothstep(.38,.55, district));
  float street = 1. - smoothstep(.03, .07, min(min(f.x,1.-f.x), min(f.y,1.-f.y)));
  c = mix(c, vec3(.30,.30,.31), street * smoothstep(.38,.5,district));
  return c;
}
vec3 terrazzo(vec2 p, float detail){
  vec3 base = vec3(.60,.58,.54) * (.93 + .1*noise(p*3.));
  vec2 q = p*95.; vec2 id = floor(q); float md = 9.; vec2 cid;
  for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++){
    vec2 o = vec2(x,y); vec2 c = id+o; vec2 pt = o + vec2(hash(c), hash(c+3.1)) - fract(q);
    float d = length(pt); if(d<md){ md=d; cid=c; }
  }
  float r = hash(cid+9.7);
  float chip = 1. - smoothstep(.2, .26, md + (1.-r)*.3 - hash(cid+4.4)*.12);
  vec3 cc = r < .25 ? vec3(.3,.29,.28) : r < .55 ? vec3(.68,.63,.57) : r < .72 ? vec3(.5,.43,.39) : vec3(.8,.78,.74);
  cc = mix(base, cc, .75);
  return mix(base, mix(base, cc, chip), detail);
}
void main(){
  vec2 p = vW.xz;
  float dist = length(cameraPosition - vW);
  float plaza = 1. - smoothstep(14., 55., length(p));
  float scale = fwidth(p.x*95.);
  float detail = 1. - smoothstep(.25, 1., scale);
  vec3 c;
  if (plaza > .999) c = terrazzo(p, detail);
  else if (plaza < .001) c = city(p);
  else c = mix(city(p), terrazzo(p, detail), plaza);
  float light = .36 + .8*max(uSun.y,0.);
  c *= light * vec3(1.,.93,.84);
  float fog = 1. - exp(-dist/uFogD);
  c = mix(c, uFog, clamp(fog,0.,1.));
  gl_FragColor = vec4(c,1.);
}`;

// ——— Mraky: niekoľko vrstiev, cez ktoré kamera prechádza ———
const cloudFrag = `
uniform float uSeed; uniform float uCover; uniform vec3 uSun; uniform vec3 uFog; uniform float uFogD; uniform float uTime;
varying vec3 vW;
${noiseGLSL}
void main(){
  vec2 p = vW.xz/900. + uSeed + vec2(uTime*.004, 0.);
  float n = fbm(p) * .75 + fbm(p*3.1)*.25;
  float a = smoothstep(uCover, uCover+.22, n);
  float dist = length(cameraPosition - vW);
  a *= smoothstep(25., 220., dist);
  if(a < .01) discard;
  vec3 lit = mix(vec3(.52,.53,.58), vec3(.95,.88,.8), clamp(n*1.6-.45,0.,1.));
  float fog = 1. - exp(-dist/(uFogD*1.4));
  vec3 c = mix(lit, uFog, clamp(fog,0.,1.)*.6);
  gl_FragColor = vec4(c, a*.92);
}`;

// ——— Prach po dopade (poloha je analytická funkcia času, takže ide aj dozadu) ———
const dustVert = `
attribute vec4 aSeed; attribute vec4 aSeed2;
uniform float uT; uniform float uScale;
varying float vA;
void main(){
  float t = max(uT, 0.);
  float ang = aSeed.x*6.2832;
  float v0 = mix(.4, 2.4, aSeed.y*aSeed.y);
  float k = 2.4;
  float r = .12 + v0/k*(1.-exp(-k*t));
  float vy = mix(.04, .5, aSeed.z*aSeed.z);
  float y = .01 + vy/k*(1.-exp(-k*t)) - .06*t*t;
  vec3 pos = vec3(cos(ang)*r*1.25, max(y,.004), sin(ang)*r);
  pos.xz += (aSeed2.xy-.5)*.08;
  vec4 mv = modelViewMatrix*vec4(pos,1.);
  gl_Position = projectionMatrix*mv;
  float size = mix(.012, .07, aSeed2.z*aSeed2.z) * (1. + t*.7);
  gl_PointSize = min(size * uScale / -mv.z, 42.);
  vA = uT <= 0. ? 0. : smoothstep(0., .08, t) * (1. - smoothstep(.5, 2.4, t*(.7+aSeed2.w*.6))) * .26 * smoothstep(.3, .8, -mv.z);
}`;
const dustFrag = `
uniform sampler2D uMap; uniform vec3 uCol; varying float vA;
void main(){ float m = texture2D(uMap, gl_PointCoord).a; float a = m*vA; if(a<.004) discard; gl_FragColor = vec4(uCol, a); }`;

const ringFrag = `
uniform float uT; varying vec2 vUv2;
void main(){
  float r = length(vUv2);
  float R = .15 + 1.9*(1.-exp(-3.2*uT));
  float w = .06 + .25*uT;
  float a = exp(-pow((r-R)/w, 2.)) * (1.-smoothstep(.2, 1.3, uT)) * .22;
  if(uT<=0.) a = 0.;
  gl_FragColor = vec4(vec3(.72,.68,.62), a);
}`;

// ——— Postprocesing: radiálne rozmazanie podľa rýchlosti, opar pri prechode mrakom, vinetácia, zrno ———
const postVert = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`;
const postFrag = `
uniform sampler2D tDiffuse; uniform float uBlur; uniform float uHaze; uniform float uDark; uniform vec3 uHazeCol; uniform float uTime; uniform vec2 uCenter;
varying vec2 vUv;
float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
void main(){
  vec2 dir = vUv - uCenter;
  float mask = smoothstep(.2, .7, length(dir));
  vec4 acc = vec4(0.);
  for(int i=0;i<10;i++){ float s = 1. - uBlur*mask*float(i)/10.; acc += texture2D(tDiffuse, uCenter + dir*s); }
  vec3 c = (acc/10.).rgb;
  c = mix(c, uHazeCol, uHaze);
  float vig = smoothstep(.95, .25, length(vUv-.5)*1.15);
  c *= mix(.62 - uDark*.3, 1. - uDark*.35, vig);
  gl_FragColor = vec4(c, 1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  gl_FragColor.rgb += (h(vUv*1000. + uTime) - .5) * .018;
}`;

export function mount(canvas, opts = {}) {
  const small = Math.min(innerWidth, innerHeight) < 700;
  const renderer = new WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', alpha: false });
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  renderer.outputColorSpace = SRGBColorSpace;
  const maxDpr = small ? 1.5 : 1.75;
  let dpr = Math.min(devicePixelRatio || 1, maxDpr);

  const scene = new Scene();
  const camera = new PerspectiveCamera(40, 1, 0.02, 30000);
  const fogCol = new Color(0.5, 0.55, 0.63);

  // obloha + prostredie pre odrazy
  const skyMat = new ShaderMaterial({ vertexShader: skyVert, fragmentShader: skyFrag, uniforms: { uSun: { value: SUN } }, side: BackSide, depthWrite: false });
  const sky = new Mesh(new SphereGeometry(20000, 32, 16), skyMat);
  sky.frustumCulled = false; sky.renderOrder = -1;
  scene.add(sky);
  const envScene = new Scene();
  envScene.add(new Mesh(new SphereGeometry(100, 32, 16), skyMat.clone()));
  const floorEnv = new Mesh(new PlaneGeometry(400, 400), new MeshBasicMaterial({ color: 0x4a4540 }));
  floorEnv.rotation.x = -Math.PI / 2; floorEnv.position.y = -2; envScene.add(floorEnv);
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(envScene, 0.03).texture;
  pmrem.dispose();

  const sun = new DirectionalLight(0xffd6a8, 3.4); sun.position.copy(SUN).multiplyScalar(10); scene.add(sun);
  scene.add(new HemisphereLight(0xbcd0ea, 0x4b4238, 0.55));

  // zem
  const groundMat = new ShaderMaterial({
    vertexShader: groundVert, fragmentShader: groundFrag,
    uniforms: { uSun: { value: SUN }, uFog: { value: fogCol }, uFogD: { value: 2600 } },
  });
  const ground = new Mesh(radialGround(), groundMat);
  ground.frustumCulled = false; scene.add(ground);

  // mraky
  const clouds = [];
  const cloudGeo = radialGround();
  const layers = [[1650, 0.54, 3.1], [1150, 0.6, 8.7], [720, 0.57, 1.9], [420, 0.66, 5.3]];
  for (const [h, cover, seed] of layers) {
    const m = new ShaderMaterial({
      vertexShader: groundVert, fragmentShader: cloudFrag, transparent: true, depthWrite: false, side: DoubleSide,
      uniforms: { uSeed: { value: seed }, uCover: { value: cover }, uSun: { value: SUN }, uFog: { value: fogCol }, uFogD: { value: 2600 }, uTime: { value: 0 } },
    });
    const c = new Mesh(cloudGeo, m);
    c.frustumCulled = false; c.position.y = h; scene.add(c); clouds.push({ mesh: c, h });
  }

  // tieň pod činkou: široký mäkký + úzky kontaktný
  const dot = softDot();
  const shadowSoft = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ map: dot, color: 0x000000, transparent: true, depthWrite: false, opacity: 0 }));
  shadowSoft.rotation.x = -Math.PI / 2; shadowSoft.position.y = 0.002; scene.add(shadowSoft);
  const shadowHard = shadowSoft.clone(); shadowHard.material = shadowSoft.material.clone(); shadowHard.position.y = 0.003; scene.add(shadowHard);

  // činka
  const bell = makeDumbbell(); scene.add(bell);

  // prach, drobné úlomky, kruh
  const N = small ? 300 : 560;
  const dg = new BufferGeometry();
  const s1 = new Float32Array(N * 4), s2 = new Float32Array(N * 4);
  for (let i = 0; i < N * 4; i++) { s1[i] = Math.random(); s2[i] = Math.random(); }
  dg.setAttribute('position', new BufferAttribute(new Float32Array(N * 3), 3));
  dg.setAttribute('aSeed', new BufferAttribute(s1, 4));
  dg.setAttribute('aSeed2', new BufferAttribute(s2, 4));
  const dustMat = new ShaderMaterial({
    vertexShader: dustVert, fragmentShader: dustFrag, transparent: true, depthWrite: false, blending: NormalBlending,
    uniforms: { uT: { value: 0 }, uScale: { value: 800 }, uMap: { value: dot }, uCol: { value: new Color(0.5, 0.46, 0.41) } },
  });
  const dust = new Points(dg, dustMat); dust.frustumCulled = false; scene.add(dust);

  const ringGeo = new RingGeometry(0.01, 3, 64, 1);
  const ringMat = new ShaderMaterial({
    vertexShader: `varying vec2 vUv2; void main(){ vUv2 = position.xy; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: ringFrag, transparent: true, depthWrite: false, blending: AdditiveBlending, uniforms: { uT: { value: 0 } },
  });
  const ring = new Mesh(ringGeo, ringMat); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.004; scene.add(ring);

  // postprocesing
  let rt = null;
  const postCam = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const postMat = new ShaderMaterial({
    vertexShader: postVert, fragmentShader: postFrag, toneMapped: true,
    uniforms: { tDiffuse: { value: null }, uBlur: { value: 0 }, uDark: { value: 0 }, uHaze: { value: 0 }, uHazeCol: { value: new Color(0.72, 0.73, 0.76) }, uTime: { value: 0 }, uCenter: { value: { x: 0.5, y: 0.5 } } },
  });
  const postScene = new Scene(); postScene.add(new Mesh(new PlaneGeometry(2, 2), postMat));

  function resize() {
    const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < 0.8 ? 52 : 40; // na výšku širší záber, aby činka nevypĺňala celý displej
    camera.updateProjectionMatrix();
    dustMat.uniforms.uScale.value = h * dpr / (2 * Math.tan(MathUtils.degToRad(camera.fov / 2)));
    rt?.dispose();
    rt = new WebGLRenderTarget(Math.round(w * dpr), Math.round(h * dpr), { type: HalfFloatType, samples: small ? 0 : 2 });
    postMat.uniforms.tDiffuse.value = rt.texture;
  }

  // ——— stav podľa p ———
  const tumbleAxis = new Vector3(0.35, 1, 0.2).normalize();
  const qA = new Quaternion(), qB = new Quaternion(), qRest = new Quaternion().setFromEuler(new Euler(0, 0.55, 0));
  const tmp = new Vector3(), look = new Vector3();
  let progress = 0, time = 0, lastP = -1;

  function apply(p, t) {
    const h = heightAt(p);
    const u = clamp(p / T.impact);
    const ti = (p - T.impact) / (T.settle - T.impact) * 1.6; // sekundy od dopadu

    // rotácia: pomalé prevracanie, pred dopadom sa ustáli na plochej stene
    qA.setFromAxisAngle(tumbleAxis, u * 7.2 + t * 0.05);
    qB.setFromAxisAngle(new Vector3(1, 0, 0), u * 3.1);
    qA.multiply(qB);
    const settle = smooth(0.78, 1, u);
    bell.quaternion.copy(qA).slerp(qRest, settle);
    // malý odraz po dopade
    let bounce = 0, tilt = 0;
    if (ti > 0) { bounce = 0.018 * Math.exp(-7 * ti) * Math.abs(Math.sin(ti * 22)); tilt = 0.05 * Math.exp(-6 * ti) * Math.sin(ti * 26); }
    bell.position.set(0, h + bounce, 0);
    bell.rotateZ(tilt);

    // kamera: z boku v oblakoch, zhora počas pádu, nízko pri zemi na dopad
    const topView = smooth(0.08, 0.35, u) * (1 - smooth(0.86, 0.99, u));
    const elev = MathUtils.lerp(0.08, 1.05, topView) + smooth(0.9, 1, u) * 0.12;
    const az = 0.9 - u * 0.9 + t * 0.01;
    const dist = (MathUtils.lerp(1.05, 0.95, u) - smooth(0.95, 1, u) * 0.12) * (camera.aspect < 0.8 ? 1.55 : 1);
    tmp.set(Math.cos(az) * Math.cos(elev), Math.sin(elev), Math.sin(az) * Math.cos(elev)).multiplyScalar(dist);
    camera.position.copy(bell.position).add(tmp);
    if (ti > 0) camera.position.y += 0.012 * Math.exp(-6 * ti) * Math.sin(ti * 40); // krátky náraz, žiadne dlhé trasenie
    camera.position.y = Math.max(camera.position.y, 0.09);
    look.copy(bell.position); look.y -= topView * 0.12;
    camera.lookAt(look);
    if (ti > 0) camera.rotateZ(0.004 * Math.exp(-6 * ti) * Math.sin(ti * 31));

    // tiene
    const near = 1 - smooth(0.4, 6, h);
    const sSoft = 0.9 + h * 0.6;
    shadowSoft.scale.set(sSoft, sSoft * 0.6, 1); shadowSoft.material.opacity = 0.5 * near * (1 / (1 + h));
    shadowHard.scale.set(0.42, 0.2, 1); shadowHard.material.opacity = 0.75 * (1 - smooth(0.02, 0.5, h - REST));
    shadowSoft.rotation.z = shadowHard.rotation.z = -0.55;

    // prach a kruh
    dustMat.uniforms.uT.value = ti > 0 ? ti + Math.max(0, p - T.settle) * 6 : 0;
    ringMat.uniforms.uT.value = ti > 0 ? ti : 0;

    // hmla a opar podľa výšky; prechod mrakom = krátky opar
    const fogD = MathUtils.lerp(7000, 700, 1 - smooth(20, 1500, h));
    groundMat.uniforms.uFogD.value = fogD;
    let haze = 0;
    for (const c of clouds) haze = Math.max(haze, 1 - smooth(0, 90, Math.abs(camera.position.y - c.h)));
    postMat.uniforms.uHaze.value = haze * 0.7;
    postMat.uniforms.uDark.value = smooth(T.impact, T.settle, p);
    // rozmazanie podľa vizuálnej rýchlosti pádu (najväčšia v strede pádu, pri zemi mierne)
    postMat.uniforms.uBlur.value = 0.03 * smooth(0.05, 0.3, u) * (1 - smooth(0.93, 1, u)) + 0.02 * (ti > 0 ? Math.exp(-5 * ti) : 0);
    // stred rozmazania = poloha činky na obrazovke
    camera.updateMatrixWorld();
    tmp.copy(bell.position).project(camera);
    postMat.uniforms.uCenter.value = { x: tmp.x * 0.5 + 0.5, y: tmp.y * 0.5 + 0.5 };
    for (const c of clouds) c.mesh.material.uniforms.uTime.value = t;
    postMat.uniforms.uTime.value = t % 100;
  }

  // ——— vykresľovanie: len keď sa zmení p alebo pri pokojnom „dýchaní“ scény ———
  let raf = 0, running = true, idleSince = performance.now(), prev = performance.now(), slowFrames = 0;
  function frame(now) {
    raf = 0;
    if (!running) return;
    const dt = Math.min(0.1, (now - prev) / 1000); prev = now; time += dt;
    const changed = progress !== lastP;
    if (changed) idleSince = now;
    const idle = now - idleSince > 12000; // po 12 s bez pohybu scéna zastaví
    if (changed || !idle) {
      apply(progress, time); lastP = progress;
      renderer.setRenderTarget(rt); renderer.render(scene, camera);
      renderer.setRenderTarget(null); renderer.render(postScene, postCam);
      // ak zariadenie nestíha, znížime rozlíšenie (raz)
      if (dt > 1 / 40) slowFrames++; else slowFrames = Math.max(0, slowFrames - 1);
      if (slowFrames > 45 && dpr > 1) { dpr = 1; slowFrames = 0; resize(); }
    }
    if (!idle || changed) raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf && running) { prev = performance.now(); raf = requestAnimationFrame(frame); } }

  resize();
  apply(0, 0);
  renderer.setRenderTarget(rt); renderer.render(scene, camera); renderer.setRenderTarget(null); renderer.render(postScene, postCam);
  kick();

  return {
    setProgress(p) { progress = clamp(p); idleSince = performance.now(); kick(); },
    resize() { resize(); lastP = -1; kick(); },
    pause() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; },
    resume() { if (!running) { running = true; lastP = -1; kick(); } },
    impactScreenPoint() { camera.updateMatrixWorld(); tmp.set(0, REST, 0).project(camera); return { x: tmp.x * 0.5 + 0.5, y: 1 - (tmp.y * 0.5 + 0.5) }; },
    dispose() { this.pause(); rt?.dispose(); renderer.dispose(); },
  };
}
