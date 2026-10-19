---
name: film-z-fotiek
description: Kinematografické pozadie webu zo skutočných fotiek podniku s hĺbkovou mapou (three.js r169, WebGL2). Kamera sa pri skrolovaní hýbe v priestore fotky (2.5D parallax, depth map z Depth Anything), zábery sa menia filmovými strihmi, úvod ide cez dvere. Použi pri pozadí webu ako filme či prehliadke priestoru (scroll-driven camera, scrollytelling), pri príprave záberov a výrezov na telefón, ladení strihov, bráne WebGL so statickou zálohou, adaptívnom DPR, plynulosti (fps) a Lighthouse pri WebGL filme.
---

# Film zo skutočných fotiek

Pozadie webu je film z fotiek skutočného miesta. Každá fotka leží na mriežke, ktorú hĺbková mapa
vytlačí k oku, takže pri pohybe kamery sa popredie posúva voči stene ako v skutočnej miestnosti.
Skrolovanie vedie kameru, medzi časťami webu sú strihy. Text, ceny a tlačidlá ostávajú v HTML nad filmom.
Nič sa nemodeluje a fotky sa netónujú (len vinetácia a krátke šero pri strihu).

## Kedy použiť

- Web podniku s vlastným priestorom (salón, barbershop, reštaurácia) a sadou dobrých fotiek (najlepšie na šírku;
  HEAD SPA 30 má fotky na výšku 3 : 4).
- Treba „prehliadku“ miesta pri skrolovaní, filmový úvod (z ulice cez dvere dnu) alebo strihy medzi scénami.
- Ladíš existujúci film: trhanie, skok medzi zálohou a filmom, rozmazané zábery na telefóne, Lighthouse.

Nepoužívaj, keď nie sú vlastné fotky miesta (film z cudzích fotiek by klamal) alebo keď stačí statická fotka. Video
pri skrolovaní rieši skill `video-a-sekvencie`, všeobecný výkon `rychly-web`, testy `testy-a-nasadenie`.

**3D model namiesto fotky?** Film tu stojí na skutočných fotkách a hĺbkovej mape; nič sa nemodeluje. 3D model
predmetu (náradie, produkt) alebo „3D z jednej fotky“ (TRELLIS.2 z videa V8) rieši skill `3d-modely-na-web`:
HEAD SPA 30 nie (`CLAUDE.md`: nič vymodelované), Barbershop 30 a GYM KLUB najprv procedurálne v three.js r169,
model z fotky nikdy nevydávať za skutočný sken a výstup TRELLIS.2 nie na komerčný web pred posúdením licencií
závislostí (nvdiffrast, RMBG-2.0, DINOv3). „3D okolie“ prevádzky z Google 3D nie (v EEA pre nové projekty
nedostupné, zábery z Google Earth sa nesmú použiť na propagáciu; rozbor V4).

## Architektúra (štyri vrstvy, každá ďalšia je len nadstavba)

1. **HTML kotvy** `.film-shot` v poradí dokumentu. Každá nesie meno záberu, bod záujmu a pohyb kamery
   v `data-*` a vo vnútri statickú zálohu `<picture class="film-still">`. Bez skriptu je web hotový.
2. **Brána v `<head>`**: krátky inline skript dá `<html>` triedu `world` len pri lacných podmienkach
   (WebGL2 v prehliadači, bez obmedzenia pohybu a šetrenia dát, výška okna nad 500 px, aspoň 4 GB a 4 jadrá).
3. **Film** (`film.js`, ES modul, three.js z `vendor/`): po prvom vykreslení overí grafickú kartu, vytvorí
   jeden `<canvas>` `position: fixed; z-index: 0` pod stránkou, z kotiev postaví cestu a kreslí.
   Triedy na `<html>`: `world-in` (prvý snímok je na displeji, zálohy zmiznú), `world-off` (film nejde),
   `world-frame` (vypnuté až po prvom vykreslení, záloha si drží rámovanie filmu).
4. **Režisér stránky** (`app.js`): karty s textom nad filmom (krytie `--o`, `is-on`), zálohy pri pokojnej
   verzii (`--so`, `is-shown`, `is-near`). Triedy filmu nečíta ani nemení; film a stránka sa rozprávajú
   len cez kotvy.

Tabuľka všetkých atribútov, tried, premenných a ladiaceho API: [references/atributy-a-api.md](references/atributy-a-api.md).

## Postup

### 1. Zábery: fotky, stupne veľkosti, výrezy na telefón, hĺbka

- Vyber fotky na šírku s jasným bodom záujmu a hĺbkou (kreslo vpredu, stena vzadu). Fakty o mieste
  (popis záberu) len zo zdrojov.
- Každý záber v stupňoch šírky `1086, 1448, 2172, 2896` (fasáda pre nájazd k dverám aj `4096`), AVIF aj WebP.
  Nikdy nezväčšuj nad originál: prvý stupeň nad šírkou originálu je kópia originálu
  (`tiers_for` v `barbershop-30/source/tools/film.py`).
- Telefón: vlastný výrez 9 : 16 okolo bodu záujmu (`<meno>-m-1086/-m-1448`), pri detailoch len časť výšky
  (`mh`), aby telefón ukázal predmet a nie stenu.
- Hĺbková mapa `<meno>-hlbka.webp` (svetlá = blízko) z Depth Anything V2 small (ONNX, lokálne, `hlbka.py`),
  uložená **najviac 768 px na šírku**. Väčšiu by film zmenšoval na hlavnom vlákne.
- Zálohy `<picture class="film-still">` a rozmerové atribúty kotiev (`data-size`, `data-tiers`, `data-m`,
  `data-m-size`, `data-m-tiers`, `data-fm`, pri prológu `data-pro-*` tých istých) nepíš ručne: `stills.py` ich
  prepíše z `film.json`. `data-shot`, `data-f`, `data-mv`, `data-place` a `data-card` píšeš sám.

Podrobne (parametre skriptov, kvalita, `sizes`, preload): [references/priprava-zaberov.md](references/priprava-zaberov.md).

### 2. Kotvy v HTML

Kotva s výrezom na telefón, bez videa (`barbershop-30/index.html`):

```html
<div class="film-shot is-title" data-card="right" data-shot="cakaren" data-f="0.5,0.55" data-mv="in" data-place="Kútik s pumpou Route 66" data-size="4096x2731" data-tiers="1086,1448,2172,2896" data-m="cakaren-m" data-m-size="1536x2731" data-m-tiers="1086,1448" data-fm="0.50,0.55">
  <picture class="film-still" style="--fx: 50%; --fy: 55%; --fmx: 50.0%; --fmy: 55%; --fxn: 0.5; --fyn: 0.55; --fmxn: 0.5; --fmyn: 0.55; --pa: 1.4998; --pam: 0.5624">
```

Záber je celý na obrazovke, keď je horný okraj kotvy na hornom okraji okna (pri sticky alebo fixed kotve
sa berie jej rodič, `pageTop()` vo `film.js`); pri titulnej karte (`.is-title`) v strede jej pripnutia a strih
padne na horný okraj kotvy (`measure()`, podrobne v references/atributy-a-api.md). Skrytá kotva z cesty vypadne.

### 3. Brána a záloha

Lacná brána (úryvok z `barbershop-30/assets/film.js`, ktorý ju opakuje, keď stránka triedu nedala; hlavička
`barbershop-30/index.html` má tie isté podmienky v jednom riadku a navyše `?film=off` / `?motion=off`):

```js
const ok = 'WebGL2RenderingContext' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches
  && !(navigator.connection && navigator.connection.saveData)
  && !matchMedia('(max-height: 500px)').matches
  && (navigator.deviceMemory || 8) >= 4 && (navigator.hardwareConcurrency || 8) >= 4;
```

WebGL kontext v hlavičke **nevytváraj**: prehliadač by pred prvým obrazom štartoval grafiku (Lighthouse
telefón: FCP 1,5 s namiesto 0,5 s, `barbershop-30/docs/TOUR_DIRECTION.md`, Brána filmu). Grafickú kartu
over až po first-contentful-paint (PerformanceObserver, záloha 3 s) + `requestAnimationFrame` + 50 ms:

```js
const g = c.getContext('webgl2', { failIfMajorPerformanceCaveat: !filmOn }) || (filmOn ? c.getContext('webgl2') : null);
const ri = g && !filmOn && g.getExtension('WEBGL_debug_renderer_info');
gpu = !!g && !(ri && /swiftshader|llvmpipe|softpipe|software|basic render/i.test(g.getParameter(ri.UNMASKED_RENDERER_WEBGL) || ''));
const x = g && g.getExtension('WEBGL_lose_context'); if (x) x.loseContext();
```

(`barbershop-30/assets/film.js`.) Pri softvérovom kreslení: `world-frame` + `world-off`, ostáva pokojná verzia.
Lighthouse aj PageSpeed Insights kreslia softvérovo, merajú teda pokojnú verziu. `?film=on` overenie
vynechá (testy v headless prehliadači), `?film=off` film vypne.

Záloha má **presne rámovanie prvého snímku filmu**, inak prelínanie zálohy do filmu poskočí
(`barbershop-30/assets/style.css`, rovnaký výpočet ako `layout()` vo filme):

```css
html.world:not(.world-off) .film-still img, html.world-frame .film-still img {
  --k: calc(1 / (1 + var(--z0, -0.04)));
  --pw: calc(1.24 * var(--k) * max(100vw, 100vh * var(--pa, 1.5)));
  --ph: calc(var(--pw) / var(--pa, 1.5));
  --mx: calc((var(--pw) - 100vw * var(--k)) / 2 - 6vw * var(--k));
```

`--z0` je vzdialenosť kamery v okamihu prvého snímku: −0,04 záber pri kotve (polovica pohybu `in` a ostatných),
−0,005 jemný nájazd `near`, 0,05 začiatok prológu. Záloha berie ten istý stupeň fotky ako film
(`sizes="(max-width: 720px) 93vw, 124vw"`), takže ho film má z cache.

### 4. Jadro filmu

Úryvky v krokoch 4 až 6 sú z `barbershop-30/assets/film.js`.

**Záber = fotka na mriežke** (`SEG` 256 × 192 na počítači, 112 × 200 na telefóne pre výrez na výšku). Vertex shader
posunie každý bod po priamke k oku podľa hĺbky:

```glsl
float z = texture2D(uDepth, vUv).r;
vZ = z;                                                  // hĺbka bodu (1 = blízko) pre prechod medzi zábermi
vec4 w = modelMatrix * vec4(position, 1.0);
w.xyz = uEye + (w.xyz - uEye) * (1.0 - uAmt * z);
```

Z pokojného miesta kamery je obraz presne fotka. Sila `uAmt` 0,42 (telefón 0,3, výrez má blízke popredie).
Hĺbková mapa sa po načítaní raz zjemní na grafike (max filter, potom gauss na šírku asi 1,2 bunky
mriežky), predmet sa hýbe ako celok a hrany nemajú zúbky (`soften()`).

**Rozloženie** (`layout()`): fotka pokryje okno s presahom 1,24 (`OVER` 0,12), oko kamery mieri na bod
záujmu, ale len tak ďaleko, aby pohyb neodhalil okraj fotky. `FOV` 38° (telefón 50°), vzdialenosť 10.

**Pohyb záberu** (`MOVES`): začiatok a koniec `[x, y, z]` v podieloch obrazu, kamera stále pomaly dopredu
s bočným oblúkom okolo bodu záujmu:

```js
const ARC = phone ? 0.02 : 0.04;                            // telefón: menší oblúk, výrez má blízke popredie
const MOVES = {
  in: [[-ARC * 0.5, 0, 0.04], [ARC * 0.5, 0, -0.12]],
  right: [[-ARC, 0, 0.04], [ARC, 0, -0.12]],
```

Ďalšie: `left`, `rise`, `down`, `near` (jemný nájazd), `door` (prológ, dopredu o 34 % vzdialenosti),
`still` (záber z videa). Poloha v pohybe `shotT()` beží celý čas, keď je záber vidieť.

**Skrol → poloha vo filme**: `measure()` zapíše polohy kotiev (`anchors`), `targetS()` z `scrollY`
lineárne dopočíta `T` (index záberu s desatinami). Kamera ide za `T` kriticky tlmenou pružinou:

```js
const w0 = 6.5;                                          // kamera dobehne skrol asi za 0,7 s (predtým 4,2 = 1,1 s, pôsobilo pomaly); zárezy kolieska sa stále zlejú
V += ((T - S) * w0 * w0 - 2 * w0 * V) * dt; S += V * dt;
if (Math.abs(T - S) < 0.0004 && Math.abs(V) < 0.0004) { S = T; V = 0; }
if (Math.abs(T - S) > 1.5) { S = T; V = 0; held = null; dark = shown; }
```

Skok cez menu (rozdiel nad 1,5 záberu) nejde cez cudzie zábery: film je hneď na cieli a rozsvieti sa zo šera.

**Prechod**: okno prechodu je najviac 30 % cesty medzi kotvami (pri väčších medzerách asi 55 % výšky
okna, najmenej 16 %), okolo stredu medzi kotvami, pri titulnej karte okolo miesta, kde sa mení text (horný
okraj jej kotvy). Keď skrol stojí dlhšie než 0,6 s, prechod sa dokončí na bližší
záber (nikdy neostane napoly). Novo načítaná fotka nabieha 450 ms.

**Dýchanie**: kamera sa hýbe aj bez skrolovania (dva pomalé oblúky v každej osi, na telefóne 0,6 ×),
nabieha 1,5 s od prvého snímku. Po 3 minútach bez vstupu (`BREATH_MS`) sa za 3 s zastaví a film nekreslí.

### 5. Strihy

Každá dvojica susedných záberov môže mať vlastný strih: `data-cut` na kotve prichádzajúceho záberu,
inak tabuľka `CUTS`. Zápis `"druh [smer] [a:x,y] [b:x,y] [m:…]"`, `m…` platí len pre telefón:

```js
'vstup>rohozka': 'najazd a:0.76,0.53 ma:0.50,0.53',                         // prológ: cez dvere dnu (von je to isté odzadu)
'stol>cakaren': 'svih right',                                              // od kresla švihom dozadu do čakárne
'sud>vstup': 'odjazd b:0.76,0.53 mb:0.50,0.53',                            // von cez dvere na Mostnú
```

Druhy: `prelinanie` (každý bod vo vlastnom čase podľa hĺbky, ďaleké skôr), `pohyb`, `svih`, `najazd`,
`odjazd`, `popredie`. Strih je funkciou polohy v prechode, nie času, preto ide rovnako tam aj späť.
Pri strihu sa kreslia oba zábery do textúr s mipmapami a skladajú sa v jednom post shaderi; mimo
strihu ide jeden záber rovno na obrazovku s vinetáciou. Všetky druhy, parametre `CK` pre telefón a
počítač a ako kamera reaguje: [references/strihy.md](references/strihy.md).

### 6. Výkon (cieľ: plná frekvencia displeja, nič nezasekne)

- **DPR**: najviac 2 (3× brzdilo slabšie telefóny, textúra výrezu 1448 px stačí). `quality()` meria
  medián a 90. percentil z 30 snímok voči najrýchlejšej snímke (interval displeja, najmenej 1/250 s):
  ```js
  if (med > Math.max(hz * 1.3, 1 / 55) || p90 > Math.max(hz * 2.2, 1 / 40)) {
    if (dpr > DPR_MIN) { dpr = Math.max(DPR_MIN, Math.round((dpr - 0.25) * 4) / 4); lowAt = now; resize(); }
  } else if (dpr < DPR_MAX && med < hz * 1.08 && p90 < hz * 1.5 && now - lowAt > 8000) {
  ```
  Počas nahrávania textúr, prológu a odchodu sa nemeria (rozlíšenie by skočilo uprostred úvodu).
- **Nahrávanie po pásoch**: fotka sa nahrá do grafiky po 256 riadkoch (`texSubImage2D` s `UNPACK_SKIP_ROWS`),
  `pump(4)` v každej snímke (rozpočet 4 ms, aspoň jeden pás). Jedno veľké nahratie stálo na telefóne 40 až 250 ms.
  Mipmapy až keď je fotka celá.
- **Pamäť**: `keepAround()` drží aktuálny záber, susedov a ďalší v smere skrolu (najviac štyri), ostatné
  uvoľní a preskočené sťahovanie zruší. Nevolá sa v každej snímke:
  ```js
  if (!keepT && (ci !== keptCi || kd !== keptDir || now - keptAt > 100)) {
    keptCi = ci; keptDir = kd; keptAt = now;
    keepT = setTimeout(() => { keepT = 0; if (running && !lost && path.length) keepAround(clamp(Math.round(S), 0, N)); }, 0);
  }
  ```
- **Zahriatie**: `compileAsync` pre scénu, post aj zjemnenie hĺbky a jedno kreslenie do cieľa 1 × 1 px vopred,
  inak prvý strih uprostred skrolu zasekne.
- **V každej snímke nesmie byť**: čítanie `innerHeight` (výška ide z `measure()`), čítanie `scrollY` po
  zápisoch štýlu (číta sa v `scroll` listeneri s `capture: true`), zápis CSS premennej na `<html>`
  (prepočet asi 750 prvkov; premenné len na kotvy), `keepAround`, zmenšovanie hĺbkových máp.
- **Resize**: lišta prehliadača na telefóne posiela `resize` bez zmeny plátna (plátno má `100lvh`), kotvy sa
  vtedy prepočítajú až o 150 ms. `ResizeObserver` na `body` tiež s odkladom 150 ms.

Všetky čísla a ďalšie poistky (strata kontextu, 15 s bez prvého snímku, AVIF → WebP, opakovanie po 10 s):
[references/vykon.md](references/vykon.md).

### 7. Dvere a filmový úvod

Dve overené riešenia (podrobne [references/uvod-a-dvere.md](references/uvod-a-dvere.md)):

- **Prológ vo filme** (BARBERSHOP 30): raz za návštevu (`sessionStorage`), len s filmom a bez kotvy v adrese,
  rozhodne hlavička (trieda `pro`). Prvý obraz je fasáda (záloha z `<template>`), kamera ide k dverám
  (chôdza 1,1 s, telefón 1,3 s), strihom `najazd` dnu (0,9 s / 1,0 s) a ďalej vedie skrol. Chôdza začne až
  keď je načítaný aj záber úvodu. Skrolovanie prológ hneď ukončí. Späť na ulicu: tlačidlo, koliesko nahor
  na vrchu, potiahnutie, šípka.
- **Dvere ako vrstva** (HEAD SPA 30): fotka skutočných dverí, krídla vystrihnuté z tej istej fotky sa v CSS 3D
  otočia dnu (`rotateY(±100deg)`) a stmavnú; stránka pod nimi je vykreslená hneď.

### 8. Ladenie a kontrola

`window.BS30_FILM`: `ready`, `state` (S, T, dpr, mix, strih, zábery), `goTo(meno, t)`, `cutFreeze(meno, mix)`,
`fadeFreeze(v)`, `proFreeze(s)`, `pause(v)`, `dbg(1|2)` (hĺbka), `cuts`, `uvod.von()`, `uvod.znova()`.
Snímky zastavených strihov a úvodu robia testy v `barbershop-30/source/tools/` (zoznam v časti Kontrola
v [references/strihy.md](references/strihy.md) a [references/uvod-a-dvere.md](references/uvod-a-dvere.md)).

## Lekcie (pasce a riešenia)

1. **WebGL kontext v hlavičke** oneskoril prvý obraz telefónu asi o 1 s. Riešenie: lacná brána v hlavičke,
   GPU až po FCP. (HEAD SPA `index.html` ešte vytvára kontext v hlavičke, je to staršia verzia.)
2. **Softvérové kreslenie** (SwiftShader, llvmpipe) film trhá. Riešenie: pokojná verzia s `world-frame`, CLS 0.
3. **Pohyb počas overovania GPU sa strácal**: poslucháče vstupu (`markMove`) od úplného začiatku skriptu.
4. **Skok medzi zálohou a filmom**: film bol 1,18× bližšie a na inom bode. Riešenie: CSS rámovanie zálohy
   podľa `layout()` a `--z0`, rovnaký stupeň fotky; overené `uvod-zhoda.py` (posun do 7 px, mierka 0,98 až 0,99).
5. **Zmena rozlíšenia uprostred prológu** (dlhé snímky z nahrávania): `quality()` počas nahrávania nemeria.
6. **Zastavenie pri novom zábere** (36 až 320 ms): hĺbkové mapy širšie než 768 px. Ukladaj ich menšie.
7. **Pauza pri dverách** v prológu: chôdza čakala na záber úvodu. Riešenie: chôdza štartuje až s načítaným
   záberom (pred fasádou najviac 1,5 s), pri dverách najviac 4 s, bez filmu do 7 s sa prológ vynechá.
8. **Prvý strih zasekol**: program sa prekladal až pri prvom použití. Riešenie: `compileAsync` + kreslenie 1 × 1.
9. **Telefón rozmazaný**: výsek z fotky na šírku sa zväčšoval. Riešenie: vlastný výrez na výšku, CAP 1448 px,
   hustejšia mriežka zvislo, menšia sila hĺbky a oblúk.
10. **Pretáčanie videa skrolom** bolo na telefóne trhané a pri zastavení stálo: video ako sekvencia fotiek
    (skill `video-a-sekvencie`).
11. **`bitmap.close()`** po nahratí hlási rozmery 0 × 0: rozmery si ulož (`t.userData.w/h`) pred zavretím.
12. **Safari**: `createImageBitmap` bez volieb, video prvok musí byť v dokumente, `behavior: 'instant'`
    má záložný skok, záporný `scrollY` (odraz) sa berie ako 0.
13. **Test čakajúci 300 ms zlyhával**: film berie koliesko nahor na vrchu až po 350 ms pokoja, test čaká 500 ms.
14. **Strih „popredie“ potrebuje hĺbku**: záber bez nej (video) dostane automaticky `pohyb`.

## V tomto repozitári

| Čo | Kde |
| --- | --- |
| Film (plná verzia, strihy, prológ, videá) | `barbershop-30/assets/film.js` |
| Kotvy, brána v hlavičke, preload a `<template>` zálohy úvodu | `barbershop-30/index.html` |
| Vrstvy, rámovanie záloh, výrezy, pásy, karty | `barbershop-30/assets/style.css` (P0, P1, P11) |
| Karty nad filmom (`--o`, `--so`, `--sp`, `--hint`) | `barbershop-30/assets/app.js`, funkcia `apply()` |
| Zábery a hĺbka | `barbershop-30/source/tools/film.py`, `hlbka.py`, `stills.py`, model v `source/tools/depth/` (nie v gite) |
| Zámer a rozhodnutia majiteľa | `barbershop-30/docs/TOUR_DIRECTION.md`, `CHECKS.md` (časti 6, 9, 10, 12, 13) |
| Pôvodná jednoduchšia verzia (bez strihov, len prelínanie cez šero) | `assets/world.js`, README „Film zo skutočných fotiek“ |
| Dvere ako CSS 3D vrstva | `index.html` (`.veil`), `assets/app.js` (`flipVeil`, `endVeil`), `assets/style.css` (`.veil`) |

Kde sa dokumenty líšia od kódu, platí kód (zoznam rozdielov v [references/vykon.md](references/vykon.md), časť Rozdiely).

## Kontrolný zoznam

- [ ] Fotky skutočného miesta, netónované; popisy miest zo zdrojov.
- [ ] Stupne bez zväčšenia nad originál, výrez 9 : 16 pre telefón, hĺbka ≤ 768 px, zálohy cez `stills.py`.
- [ ] Brána v hlavičke bez WebGL kontextu; GPU po FCP; `world-frame` pri softvérovom kreslení.
- [ ] Záloha má rámovanie prvého snímku a ten istý stupeň fotky (zhoda do pár px).
- [ ] Bez skriptu, s `?film=off` a pri `prefers-reduced-motion` je web celý a rovnako rozložený.
- [ ] DPR najviac 2, adaptívne; nahrávanie po pásoch; `keepAround` mimo snímky; zahriate shadery.
- [ ] V snímke žiadne `innerHeight`, žiadne zápisy na `<html>`, `scrollY` z capture listenera.
- [ ] Strihy idú tam aj späť; skok cez menu bez jazdy; prológ sa dá preskočiť skrolom.
- [ ] Testy: strihy a úvod snímkami (`strih-shot.mjs`, `uvod-shot.mjs`, `uvod-meranie.mjs`), dymový test `app-smoke.mjs`, Lighthouse
      mobil 95+ a desktop 100 na pokojnej verzii, CLS 0.
- [ ] Na skutočnom telefóne overená plynulosť (headless prehliadač fps nezmeria).
