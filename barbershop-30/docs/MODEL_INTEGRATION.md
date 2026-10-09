# Integrácia 3D modelu kresla (assets/model/kreslo.glb)

Súbor: `assets/model/kreslo.glb`, 1,27 MB. glTF 2.0 s rozšíreniami
`EXT_meshopt_compression`, `EXT_texture_webp`, `KHR_mesh_quantization`
(všetky tri sú *required*). ~120 k trojuholníkov, 1 primitív, 1 materiál
(baseColor + metallicRoughness(ORM) + normál, všetko WebP 2048²).

Načítanie (three@0.186.1 z `assets/vendor/`):

```js
import { GLTFLoader } from './vendor/GLTFLoader.js';          // kópia z examples/jsm/loaders s prepísanými importmi (zdroj: source/tools/GLTFLoader.js + BufferGeometryUtils.js + SkeletonUtils.js)
import { MeshoptDecoder } from './vendor/meshopt_decoder.module.js';
const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
loader.load('assets/model/kreslo.glb', gltf => { … }, undefined, err => fallbackProceduralne());
```

Normalizácia: `Box3.setFromObject` → mierka tak, aby výška = 1.6 j.; posun tak, aby
stred XZ = 0 a spodok = 0 (podlaha). Orientácia: predok kresla (sedák, podnožka)
smeruje približne na **+X / −Z** (pozri `docs/screenshots/glb-web2048-az50-desktop.png`
= kamera na azimute 50° vidí predok). Pri kamerových kľúčových snímkach zo
SCENE_MAP, ktoré predpokladajú predok na +Z, otoč model `rotation.y = +Math.PI * 0.75`
a over screenshotom; drobné doladenie ±15° je v poriadku.

Materiál (jediný `MeshStandardMaterial` z loaderu):
- `envMapIntensity = 0.6` (PMREM RoomEnvironment zo scény),
- koža je v textúre teplo hnedá; skutočné kreslá sú čierne → `material.color.setRGB(0.72, 0.68, 0.66)`
  (jemné stmavenie a ochladenie celej albedo textúry; mosadz ostane čitateľná),
- `material.roughness = 1.0` (násobí ORM), `metalness = 1.0` (násobí ORM),
- `castShadow = receiveShadow = true`, `frustumCulled = false` (model je vždy v zábere).

Čo to je: AI rekonštrukcia z jednej fotografie skutočného kresla v prevádzke
(Tripo H3.1), nie presné meranie. Na webe: „3D symbol kresla z našej prevádzky“.
Procedurálne kreslo v `chair.js` ostáva ako záloha pri zlyhaní načítania
(a ako okamžitý vizuál počas sťahovania 1,27 MB: zobraz procedurálne, po načítaní
GLB prepni bez skoku – rovnaká pozícia a mierka).
