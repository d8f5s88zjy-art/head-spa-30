# Kontrakt medzi časťami webu

Záväzné rozhrania pre `index.html` + `assets/style.css` (stránka), `assets/app.js`
(režisér), `assets/chair.js` (3D kreslo) a `assets/img/` (obrázky). Kto mení
kontrakt, mení aj tento súbor.

## 1. Súbory

```
barbershop-30/
  index.html
  assets/
    style.css          základ + scény
    fonts.css          @font-face (Fraunces 500/800/500i, Manrope 400/600/700)
    fonts/*.woff2
    app.js             ES modul, režisér (import chair.js dynamicky)
    chair.js           ES modul, 3D kreslo; importuje ./vendor/three.module.min.js
    vendor/three.module.min.js, vendor/RoomEnvironment.js, vendor/RoundedBoxGeometry.js
    img/
      manifest.json    zoznam obrázkov (viď 4)
      <slug>-<w>.avif|webp|jpg   w ∈ {640, 1080, 1600, 2200}
      poster-uvod-desktop-<w>.avif|webp|jpg, poster-uvod-mobile-<w>.*   (poster scény 1)
      poster-rezervacia-desktop-<w>.*, poster-rezervacia-mobile-<w>.*  (poster scény 7)
      og.jpg (1200×630), favicon.svg
  source/              originály a vývojové stránky (nenasadzuje sa)
  docs/                dokumentácia, screenshoty
```

Žiadny build krok. Žiadne externé požiadavky (CDN, Google Fonts) za behu.

## 2. DOM (index.html)

```html
<html lang="sk" data-motion="on|off" data-webgl="pending|on|off">
<body>
  <a class="skip-link" href="#main">Preskočiť na obsah</a>
  <header class="site-header" data-menu="closed"> … <nav class="nav" id="nav"> … </nav> … </header>
  <nav class="story-line" aria-label="Kapitoly"> <a href="#uvod" data-chapter="1">…</a> ×7 </nav>

  <div class="stage" id="stage" aria-hidden="true">
    <div class="stage-bg"></div>                 <!-- CSS gradient za kreslom -->
    <picture class="stage-poster" id="stage-poster"> … </picture>   <!-- LCP, rovnaký záber ako 3D -->
    <canvas class="stage-canvas" id="stage-canvas"></canvas>
  </div>

  <main id="main">
    <section class="scene scene-film" id="uvod"      data-scene="1"> <div class="scene-sticky"> … </div> </section>
    <section class="scene scene-film" id="remeslo"   data-scene="2"> <div class="scene-sticky"> … </div> </section>
    <section class="scene scene-film" id="miesto"    data-scene="3"> <div class="scene-sticky"> … </div> </section>
    <section class="scene scene-flow" id="tim"       data-scene="4"> … </section>
    <section class="scene scene-flow" id="sluzby"    data-scene="5"> … </section>
    <section class="scene scene-flow" id="galeria"   data-scene="6"> … </section>
    <section class="scene scene-film" id="rezervacia" data-scene="7"> <div class="scene-sticky"> … </div> </section>
  </main>
  <footer class="site-footer" id="kontakt"> … </footer>
  <div class="mobile-cta" id="mobile-cta"><a class="btn btn-primary" href="…">Rezervovať termín</a></div>
  <div class="lightbox" id="lightbox" hidden> … </div>
  <script type="module" src="assets/app.js"></script>
```

- Filmová sekcia: `.scene-film` má `height: Xvh` (viď SCENE_MAP), vnútri
  `.scene-sticky { position: sticky; top: 0; height: 100vh }` (použiť `100svh`
  s fallbackom).
- Všetky texty sú v HTML (nie generované JS). Stavové prvky majú `data-at="a,b"`
  = interval lokálneho t, v ktorom sú viditeľné (napr. `data-at="0.3,0.95"`);
  JS pridá/odoberie triedu `is-in`.
- Prvky viazané na neoverené dáta majú `data-required="team|services|legal|…"`
  a atribút `hidden`, kým ich niekto ručne neodomkne (JS ich neodkrýva).
- Každý `<img>` má `width`, `height`, `alt`, `loading="lazy"` okrem posteru
  (`fetchpriority="high"`), `decoding="async"`; `object-position` cez
  `style="--focal: X% Y%"`.
- `.media[data-depth="2.5d"]` = fotografia s posunom vrstiev; JS nastavuje
  `--depth-scale` (1 → 1.06).

## 3. Premenné, ktoré nastavuje app.js

Na `<html>`:
- `--p` celkový progress 0–1 (plynulý, lerp 0.12/snímok; pri motion=off bez lerpu)
- `--t1`, `--t2`, `--t3`, `--t7` lokálne t filmových scén (0–1)
- `--pointer-x`, `--pointer-y` 0–1 (iba desktop s hover; inak 0.5)
- `data-scene-active="1…7"` aktívna kapitola (pre lištu a navigáciu)
- `data-motion`: `on`, alebo `off` pri `prefers-reduced-motion`, `saveData`,
  `deviceMemory < 4`, alebo keď používateľ prepne (bez UI prepínača v v1)
- `data-webgl`: `pending` → `on` po prvom vykreslenom frame, `off` pri zlyhaní

Na `.site-header`: trieda `is-scrolled` (scrollY > 80), `data-menu`.
Na `#mobile-cta`: trieda `is-hidden` v scéne 7 a pri otvorenom menu.
Na `.story-line`: `is-visible` od `--p > 0.02`; `aria-current="true"` na aktívnej kapitole.
Na `#stage`: trieda `is-3d` po prvom frame (CSS skryje poster), `data-visible="1|0"`
(canvas má opacity 1 v scénach 1–2 a 7, inak 0 – prechod 500 ms; mimo
viditeľnosti sa nerenderuje).

## 4. manifest.json (assets/img)

```json
{
  "images": {
    "<slug>": {
      "source": "foto-07.jpg",
      "alt": "…",
      "focal": [52, 48],
      "widths": [640, 1080, 1600, 2200],
      "aspect": [3, 4],
      "formats": ["avif", "webp", "jpg"],
      "scenes": [3],
      "people": "nie"
    }
  },
  "posters": { "uvod-desktop": { "aspect": [16, 9], "widths": [1080, 1600, 2200] }, "uvod-mobile": { "aspect": [9, 16], … }, … }
}
```

Názvy súborov: `assets/img/<slug>-<w>.<fmt>`. `<picture>` má `<source type="image/avif">`,
`<source type="image/webp">`, `<img src=…-1080.jpg srcset=…>`.

## 5. API assets/chair.js

```js
export async function createChairStage(canvas, options)
// options: { dpr: number (max), mobile: boolean, onFirstFrame: () => void, quality: 'high'|'low' }
// vracia:
{
  setProgress({ scene, t }),     // scene ∈ {1,2,7}, t 0–1 → kamera + svetlo podľa SCENE_MAP
  setPointer(x, y),              // 0–1, desktop; implementácia dobieha (damping .08)
  setVisible(bool),              // zastaví render loop, keď canvas nie je vidieť
  playIntroSweep(),              // 1.4 s prejazd svetla (časový), vráti Promise
  resize(),                      // prepočíta kameru a veľkosť rendereru
  renderPoster(width, height, view) // 'uvod-desktop'|'uvod-mobile'|'rezervacia-desktop'|'rezervacia-mobile' → dataURL PNG
  dispose()
}
```

- Renderuje len keď sa zmenil vstup (dirty flag) alebo beží sweep.
- DPR: min(devicePixelRatio, 1.5) desktop, 1.25 mobil; `quality:'low'` vypne tiene.
- Žiadne globálne premenné; three.js sa importuje z `./vendor/three.module.min.js`.
- Pri výnimke pri vytváraní (bez WebGL) funkcia odmietne Promise; app.js nastaví
  `data-webgl="off"` a poster ostane.
- Vývojová stránka `source/chair-dev.html` umožňuje ladiť scénu a t cez URL
  (`?scene=2&t=0.6`) a cez ňu sa generujú postery.

## 6. app.js – povinnosti

1. Zistí `data-motion` a (ak on) po `load` + `requestIdleCallback` načíta
   `chair.js`, vytvorí javisko, zavolá `playIntroSweep()` ak `--p < 0.05`.
2. Jedna slučka `requestAnimationFrame`: číta `scrollY`, počíta `--p`, lokálne t,
   nastavuje CSS premenné, `is-in` podľa `data-at`, aktívnu kapitolu, viditeľnosť
   canvasu, volá `setProgress`.
3. Navigácia: menu na mobile (aria-expanded, Esc zatvára, fokus v menu),
   `is-scrolled`, plávajúce CTA.
4. Lightbox galérie: otvorenie z tlačidla, šípky, Esc, fokus sa vráti.
5. Obnovenie stránky uprostred: pri štarte nastaví stav okamžite (bez lerpu),
   potom zapne lerp.
6. `resize` (debounce 120 ms) prepočíta rozsahy sekcií; `visibilitychange`
   pozastaví loop.
7. Žiadne sledovanie, žiadne externé requesty.
