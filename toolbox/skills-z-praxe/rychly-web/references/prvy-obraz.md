# Prvý obraz: FCP, LCP a CLS podrobne

Zdroj: `barbershop-30/index.html` (hlavička, šablóny zálohy úvodu), `barbershop-30/assets/film.js` (brána
58 až 130), `barbershop-30/assets/style.css`, `barbershop-30/source/tools/film.py`, `barbershop-30/docs/CHECKS.md`
(časti 4, 8, 9, 10), HEAD SPA 30 `index.html`, `assets/style.css`, `assets/app.js`, `tools/build.mjs`, README.

## Poradie v hlavičke

BARBERSHOP 30 (`barbershop-30/index.html`): `charset`, `viewport`, `title`, `description`, `theme-color`,
`color-scheme`; **inline skript brány** (triedy na `<html>` a preload fotky úvodu); `canonical` a `og:*`; ikony;
preload troch rezov písma; `<style>` so všetkými `@font-face`; `<link rel="stylesheet">`; JSON-LD.

HEAD SPA 30 (`index.html`): brána, preload dvoch písem, `<style>` s `@font-face`, hneď `style.min.css` (ešte pred
`hreflang`, `og:*` a `twitter:*`), štruktúrované dáta až na konci tela (README: aby nebrzdili prvé vykreslenie),
skripty `i18n.min.js`, `app.min.js`, `world.min.js` s `defer`.

Písma (`barbershop-30/index.html`):

```html
<link rel="preload" href="assets/fonts/Fraunces-800.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/Manrope-400.woff2" as="font" type="font/woff2" crossorigin>
<!-- kurzíva je v nadpise úvodu (Tvoje miesto), bez prednačítania by sa nadpis prekreslil až po nej -->
<link rel="preload" href="assets/fonts/Fraunces-500i.woff2" as="font" type="font/woff2" crossorigin>
<style>/* písma priamo v stránke (to isté ako assets/fonts.css), aby prvé vykreslenie nečakalo na ďalší súbor */
@font-face{font-family:"Fraunces";font-style:normal;font-weight:500;font-display:swap;src:url("assets/fonts/Fraunces-500.woff2") format("woff2")}
```

HEAD SPA 30: písma orezané len na znaky zo stránky, Lora vyrezaná z premenlivého písma v jednej hrúbke (500,
kurzíva 400), spolu s Manrope asi 93 kB (README, Výkon na mobile). README ešte píše „z ôsmich súborov zostalo
šesť“; v `assets/fonts/` sú dnes štyri: `Lora-display`, `Lora-italic`, `Manrope-400`, `Manrope-700`
(spolu 93 036 B), v preloade len `Lora-display` a `Manrope-400`.

## Brána: lacné kontroly pred prvým obrazom, drahé po ňom

Hlavička BARBERSHOP 30 (výňatok z inline skriptu):

```js
if('WebGL2RenderingContext' in window&&!matchMedia('(prefers-reduced-motion: reduce)').matches&&!(navigator.connection&&navigator.connection.saveData)&&!matchMedia('(max-height: 500px)').matches&&(navigator.deviceMemory||8)>=4&&(navigator.hardwareConcurrency||8)>=4)h.classList.add('world');
```

Kontrola grafickej karty až po prvom obraze (`film.js`; čakanie na FCP je v SKILL.md):

```js
const g = c.getContext('webgl2', { failIfMajorPerformanceCaveat: !filmOn }) || (filmOn ? c.getContext('webgl2') : null);
const ri = g && !filmOn && g.getExtension('WEBGL_debug_renderer_info');
gpu = !!g && !(ri && /swiftshader|llvmpipe|softpipe|software|basic render/i.test(g.getParameter(ri.UNMASKED_RENDERER_WEBGL) || ''));
const x = g && g.getExtension('WEBGL_lose_context'); if (x) x.loseContext();
```

Pri neúspechu trieda `world-frame` (záloha si drží rámovanie filmu, nič neposkočí) a film skončí.

Pohyb návštevníka počas čakania sa nesmie stratiť (`film.js`):

```js
const INPUTS = ['pointerdown', 'pointermove', 'touchstart', 'wheel', 'scroll', 'keydown'];
let movedEarly = false;
const markMove = () => { movedEarly = true; INPUTS.forEach((e) => removeEventListener(e, markMove)); };
INPUTS.forEach((e) => addEventListener(e, markMove, { passive: true }));
```

Veľká knižnica až po pohybe; bez pohybu len stiahnuť do cache po 4 s vo voľnej chvíli:

```js
const early = () => { fetch(src, { priority: 'low' }).catch(() => {}); };
// ...
t = setTimeout(() => { if ('requestIdleCallback' in window) requestIdleCallback(early, { timeout: 3000 }); else early(); }, 4000);
```

Lekcia (CHECKS 10): WebGL kontext v hlavičke oneskoroval prvý obraz telefónu o 1 s. HEAD SPA 30 ho v hlavičke
ešte vytvára (`c.getContext('webgl2')` + `loseContext`); pred prenesením riešenia zmeraj obe verzie.

## LCP: fotka úvodu

1. **Jedna fotka pre prvý obraz, vybraná pred vykreslením.** Zálohy úvodu sú v `<template>` a inline skript
   hneď za nimi vloží tú, ktorá platí (prológ alebo bez neho), takže sa stiahne len jedna:

```html
<script>(function(d){var t=d.getElementById(d.documentElement.classList.contains('pro')?'still-vstup':'still-uvod');t.after(t.content.cloneNode(true));})(document);</script>
```

   Pod tým je `<noscript>` s tou istou `<picture>` pre prehliadač bez skriptu.
2. **Preload s rovnakým `imagesrcset`/`imagesizes`** ako `<picture>` (úryvok v SKILL.md), typ `image/avif`,
   `fetchPriority = 'high'`. Tabuľka stupňov v bráne sa generuje z `film.json` (kontrola našla preload fasády bez
   stupňa 4096; ručne písaná tabuľka sa rozíde so šablónou).
3. **`<picture>` so zdrojmi pre telefón** (`media="(max-width: 720px)"`, výrez na výšku `-m-1086`, `-m-1448`),
   AVIF pred WebP, `sizes="(max-width: 720px) 93vw, 124vw"`, `width`/`height`, `fetchpriority="high"`,
   `decoding="async"`.
4. **Stupne veľkosti** (`film.py`): na šírku 1086, 1448, 2172, 2896 px, výrez na telefón 1086 a 1448; nikdy
   nezväčšovať nad originál (prvý stupeň nad šírkou originálu je kópia originálu):

```python
def tiers_for(W, widths, big=False):
    """Stupne, ktoré sa vyrobia: všetky pod šírkou originálu a prvý nad ňou ako kópia originálu."""
```

5. **Kvalita:** bežne AVIF 66 / WebP 84 (`AVIF_Q, WEBP_Q`), len prvý obraz na telefóne AVIF 46 / WebP 74
   (`FIRST_Q`). Výsledné súbory `vstup-m-1086.avif` 109 129 B, `rohozka-m-1086.avif` 124 712 B.
   HEAD SPA 30 robí zábery v 2172, 1448 a 1086 px a skript filmu berie najmenšiu šírku, ktorá na obrazovke nebude
   zväčšená o viac ako 5 % (README, Film zo skutočných fotiek).
6. **Zmena fotky úvodu = zmeraj LCP.** CHECKS 8: výrez z väčšej fotky (278 kB namiesto 132 kB) zdvihol LCP na
   telefóne na 3,1 až 3,3 s. CHECKS 9: záloha v tom istom stupni ako film (1086) dala LCP 1,6 s. Ostrosť po zmene
   over `ostrost.mjs` (references/meranie.md).

### Obrázky, ktoré sa nemajú sťahovať

`position: fixed` znamená „vždy v okne“, takže `loading="lazy"` nezaberie (`barbershop-30/assets/style.css`):

```css
/* pevná záloha je stále „v okne“, takže by sa načítala hneď (loading=lazy nepomôže): mimo okolia (is-near
   z app.js, záber do 2 obrazoviek pred oknom) ostáva display none a nesťahuje sa */
html.karty .film-shot.is-title:not(.is-near):not([data-pro]) .film-still { display: none; }
```

Komentár v CSS („do 2 obrazoviek pred oknom“) je starší; platí kód v `app.js`: `is-near` dostane aktuálna
karta, dve ďalšie a jedna predchádzajúca, a kým `document.readyState` nie je `complete`, len úvod (prvý obraz
má sieť sám pre seba). Okolie sa ráta v kartách, nie v pixeloch: rozloženie sa pri
načítaní ešte dopočítava a pixelové okolie by naraz spustilo sťahovanie záloh celej stránky.

## FCP a TBT: práca až po prvom obraze

- HEAD SPA 30 `assets/app.js`: časti pod prvou obrazovkou cez
  `const idle = (fn) => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 2000 }) : setTimeout(fn, 200));`;
  plátno úvodu `requestIdleCallback(heroStart, { timeout: 2500 })` alebo pri prvom skrole, dotyku či klávese.
- Preklad do iného jazyka sa nasadzuje po dávkach, aby nezasekol prehliadač (README, Výkon na mobile).
- `content-visibility` (HEAD SPA 30 `assets/style.css`):

```css
.site>section,.site>footer,.site>.pull,.site>.finale{content-visibility:auto;contain-intrinsic-size:auto 1400px}
@media print{.site>section,.site>footer{content-visibility:visible}}
html.cv-all .site>section,html.cv-all .site>footer,html.cv-all .site>.pull,html.cv-all .site>.finale{content-visibility:visible}
```

  Pasca: sekcie sú skutočne vyššie ako odhad, takže skok na `#kotvu` by pristál nepresne. Hlavička dá pri
  `location.hash` triedu `cv-all` (všetko sa vykreslí hneď); inak sa po prvom pohybe sekcie postupne vykreslia vo
  voľných chvíľach a pri kliknutí na odkaz v stránke hneď (README, Film zo skutočných fotiek).
- Minifikácia (HEAD SPA 30 `tools/build.mjs`): esbuild z `PATH` alebo z premennej `ESBUILD`, zdroj ostáva
  needitovaný, výstup `*.min.*` sa ručne nemení.

```js
const code = execFileSync(esbuild, [join(root, src), '--minify', '--charset=utf8'], { encoding: 'utf8' });
writeFileSync(join(root, out), code);
```

## CLS podrobne

### Skryté popisky a vodorovný pás

Pravidlo `.visually-hidden` (`barbershop-30/assets/style.css`) je `position: absolute !important` s rozmerom
1 px. Absolútne umiestnený prvok sa viaže na najbližšieho umiestneného predka; keď pás s `overflow-x: auto` nie je
umiestnený, popisky vo vzdialených kartách pásu ním nie sú orezané a ostanú vpravo za oknom. Na telefóne to roztiahlo
dokument na 2326 px, mobilný prehliadač stránku oddialil (okno 1648 px) a po prvom výpočte app.js preskočila späť:
posun rozloženia 0,14. Oprava je `position: relative` na páse (úryvok v SKILL.md).

Hľadanie vinníka: na telefóne porovnaj `document.documentElement.scrollWidth` s `innerWidth` a vypíš prvky, ktoré
pretekajú (rovnaký výber ako v `app-smoke.mjs`):

```js
const wide = [...document.querySelectorAll('body *')].filter((el) => { const b = el.getBoundingClientRect(); return b.width > 0 && b.right > innerWidth + 1 && getComputedStyle(el).position !== 'fixed'; }).slice(0, 2).map((el) => el.className || el.tagName);
```

### Čo sa ukáže až so skriptom

- Spodné tlačidlo na telefóne je v HTML už skryté (`<div class="mobile-cta is-hidden" id="mobile-cta">`,
  `transform: translateY(110%); opacity: 0`); app.js ho ukáže, keď má.
- Trieda `karty` sa dá na `<html>` v hlavičke (pred prvým vykreslením, žiadny posun) a karty okrem úvodu sú do prvého
  výpočtu app.js skryté len cez krytie: `html.karty .film-shot.is-title:not([data-pro]) .title-frame { opacity: var(--o, 0); }`;
  fokus klávesnicou ich ukáže aj tak (`:focus-within`).
- Bez skriptu nič z toho neplatí (`html:not(.karty)`), záloha ide bežne so stránkou.

### Pevné rozmery a pomer strán

- Zálohy a plátno majú pevné rozmery (`100vh` a `100lvh`), doska úvodu nastupuje len `transform` a `opacity` (CHECKS 4).
- Výrezy s `object-fit: cover`; pri zálohe s rámovaním filmu má rámik pomer strán fotky, takže `cover` kreslí to
  isté ako `fill` a pri zaokrúhlení nedeformuje (komentár v `style.css`). Rieši audit `image-aspect-ratio`.
