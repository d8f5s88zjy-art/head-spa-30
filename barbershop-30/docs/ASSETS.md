# Prehľad assetov

Stav: pracovná verzia (2026‑10‑09). Dopĺňa sa pri odovzdaní.

## Fotografie (assets/img/, manifest.json)

28 obrázkov (18 interiér/detaily + 10 portrétov), každý v šírkach 640/1080/1600/2200
(na šírku) alebo 640/1080/1600 (na výšku), formáty AVIF + WebP + JPEG (portréty PNG
s priesvitnosťou). Pôvod každého: `docs/MEDIA_SELECTION.md`. Originály:
`source/photos/` (majiteľ) a `source/web-povodny/` (aktuálny web podniku).

## 3D kreslo

- `source/model/kreslo-tripo-1.glb` – 63 MB, 1,88 M trojuholníkov; rekonštrukcia
  z jednej fotografie kresla v prevádzke (`source/photos/foto-18.jpg`, pozadie
  odstránené Adobe Photoshop API, rekonštrukcia Tripo H3.1 image‑to‑3D cez
  Higgsfield, 18 kreditov). PBR textúry: baseColor, ORM, normál.
- `source/model/kreslo-tripo-2.glb` – 66 MB, 1,99 M trojuholníkov; rekonštrukcia z
  profesionálnej fotky (`source/web-povodny/gallery/28.jpg`, pozadie odstránené Adobe,
  Tripo H3.1, 18 kreditov). **Vybraný ako hero objekt** – správna silueta kresla z
  prevádzky zo všetkých uhlov, čitateľné prešívanie a mosadzný rám (porovnanie:
  `docs/screenshots/glb-tripo-2-{front,side,back}-desktop.png`).
- `assets/model/kreslo.glb` – webová verzia modelu 2: `source/tools/glb-pipeline.sh`
  (zjednodušenie siete na 6 % = ~120 k trojuholníkov, textúry 1024², WebP, meshopt)
  → 1,01 MB (rozpočet 5 MB). Vyžaduje MeshoptDecoder + EXT_texture_webp.
- Čo to je a čo nie: AI rekonštrukcia z fotografie skutočného kresla, nie presné
  meranie. Na webe sa označuje ako „3D symbol kresla z našej prevádzky“, nie ako
  digitálna kópia. Procedurálne kreslo v `assets/chair.js` je záloha, ak GLB zlyhá.

## Písma (assets/fonts/)

Fraunces 500 / 800 / 500 italic (opsz 144, SOFT 0, WONK 0), Manrope 400 / 600 / 700;
subset latin + latin‑ext, woff2, spolu 136 KB. Licencia OFL.

## three.js (assets/vendor/)

three@0.186.1 (MIT): three.module.min.js + three.core.js (~407 KB gzip – načítava sa
až po `load` a len pri zapnutom pohybe), RoomEnvironment, RoundedBoxGeometry,
GLTFLoader + MeshoptDecoder (pre kreslo.glb).

## Logo

Aktuálny web má len PNG 100×100 px. Vektorizácia cez Adobe Illustrator API
(`source/web-povodny/logo-vector-black.svg`) z takého malého zdroja NEDOPADLA
(rozpadla sa na 1 500 šedých plôch z vyhladzovania) – nepoužíva sa. Oficiálny vektor
treba vyžiadať od majiteľa; na webe je značka sadzaná písmom.
