# Výkon, brána a zálohy filmu

Zdroj: `barbershop-30/assets/film.js` (brána 58 až 134, renderer 303 až 322, nahrávanie 419 až 538,
`keepAround` 755 až 765, `quality` 1164 až 1186, `resize` a `frame` 1188 až 1281, udalosti 1341 až 1436,
zahriatie 1494 až 1511), `barbershop-30/docs/CHECKS.md` (časti 9, 10, 12, 13), `assets/world.js` a `README.md`
HEAD SPA (Film zo skutočných fotiek, Výkon na mobile).

## Brána v troch krokoch

1. **Hlavička (inline, pred prvým obrazom)**: len lacné podmienky, bez WebGL kontextu:
   `WebGL2RenderingContext` v okne (three r169 iný nevie), nie `prefers-reduced-motion`, nie `saveData`,
   výška okna nad 500 px, `deviceMemory` aspoň 4 a `hardwareConcurrency` aspoň 4 (chýbajúci údaj = 8).
   `?film=off` alebo `?motion=off` dá rovno `world-off`.
2. **Po `load` a prvom obraze**: čaká sa na záznam `first-contentful-paint` (PerformanceObserver typu
   `paint`, `buffered: true`), záloha 3 s pre skrytú kartu, potom `requestAnimationFrame` + 50 ms.
   Samotné `requestAnimationFrame` nestačí: kontext by zdržal ešte rozpracovaný snímok.
3. **Kontrola GPU**: dočasné plátno, `getContext('webgl2', { failIfMajorPerformanceCaveat: true })`, meno
   vykresľovača cez `WEBGL_debug_renderer_info` proti `/swiftshader|llvmpipe|softpipe|software|basic render/i`,
   kontext sa hneď uvoľní (`WEBGL_lose_context`). Neúspech: `world-frame` + `world-off`.

Potom ešte: `renderer.capabilities.isWebGL2`, inak koniec. Keď sa do 15 s nenakreslí prvý snímok (sieť),
film sa ukončí (`stop()`) a ostáva pokojný web.

**Kedy sa sťahuje three.js**: bez prológu až po prvom pohybe návštevníka (`pointerdown`, `pointermove`,
`touchstart`, `wheel`, `scroll`, `keydown`); po 4 s bez pohybu sa knižnica vo voľnej chvíli
(`requestIdleCallback`, timeout 3 s) len stiahne do cache s `priority: 'low'`. S prológom ide hneď po
prvom obraze. Pohyb počas čakania sa zapamätá (`movedEarly`), film sa potom rozbehne aj tak.

## Renderer

```js
renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, depth: true, stencil: false, powerPreference: 'high-performance' });
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
renderer.autoClear = false;
renderer.debug.checkShaderErrors = false;
```

- Farby fotky idú na obrazovku bez prepočtu (textúry `NoColorSpace`, výstup lineárny, bez tónovania).
- `checkShaderErrors = false`: kontrola by pri každom preklade čakala na grafiku (stovky ms na telefóne).
- `depth: true`: mriežka záberu sa pri pohybe môže prekryť sama so sebou.
- Textúry fotiek: mipmapy, `LinearMipmapLinearFilter`, anizotropia `min(8, max)`; hĺbka a sekvencie bez mipmáp.
  `flipY = false`, otočenie robí shader (`vUv.y = 1 - uv.y`).

## Rozlíšenie (DPR) a frekvencia

- `DPR_MAX = min(devicePixelRatio, 2)`, `DPR_MIN = min(DPR_MAX, 1)`. 3× brzdilo slabšie telefóny.
- `quality(dt, now)`: 30 dĺžok snímok, medián `ft[15]`, 90. percentil `ft[27]`, interval displeja
  `hz = max(najkratšia snímka, 1/250)`. Zníženie o 0,25, keď `med > max(1,3·hz, 1/55)` alebo
  `p90 > max(2,2·hz, 1/40)`; zvýšenie o 0,25, keď `med < 1,08·hz`, `p90 < 1,5·hz` a od posledného
  zníženia prešlo 8 s. Snímky dlhšie než 0,1 s sa ignorujú.
- Nemeria sa počas nahrávania do grafiky, prológu a odchodu (inak skok rozlíšenia uprostred úvodu).
- Žiadny strop snímkovej frekvencie: kreslí sa plnou frekvenciou displeja (60 až 240 Hz). Safari na iPhone
  kreslí stránky najviac 60 snímok za sekundu (`CHECKS.md` časť 12).
- Kreslenie beží, kým je pohyb, prechod, nahrávanie, prológ, alebo kým je od posledného vstupu menej než
  3 minúty (`BREATH_MS = 180000`); potom dýchanie za 3 s doznie a film nekreslí. Akýkoľvek vstup ho zobudí.
- HEAD SPA (`world.js`): priemer zo 40 snímok, zníženie o 0,5, posledný krok strop 30 snímok za sekundu,
  dýchanie v pokoji 30 snímok za sekundu a po 25 s stojí. Na jednoduchší web to stačí a šetrí batériu.

## Nahrávanie do grafiky po pásoch

```js
jobs.push(() => {                                     // vráti true, keď je fotka celá (alebo zrušená)
  if (!live()) { bmp.close(); t.dispose(); res(null); return true; }
  const h = Math.min(BAND, bmp.height - y);
  renderer.state.bindTexture(gl.TEXTURE_2D, glt);
  gl.pixelStorei(gl.UNPACK_SKIP_ROWS, y);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, y, bmp.width, h, gl.RGBA, gl.UNSIGNED_BYTE, bmp);
  gl.pixelStorei(gl.UNPACK_SKIP_ROWS, 0);
```

- `t.source.dataReady = false` + `renderer.initTexture(t)`: three len vyhradí miesto (pri mipmapách všetky
  úrovne), obsah príde po pásoch. `BAND = 256` riadkov.
- `pump(4)` na začiatku každej snímky: aspoň jeden pás, ďalšie kým neminú 4 ms.
- `generateMipmap` až keď je fotka celá (jeden krok na grafike).
- Dekódovanie `createImageBitmap(blob)` bez volieb (Safari ich nepozná). Po nahratí `bitmap.close()`;
  rozmery si ulož predtým (`t.userData.w/h`), zavretý obrázok hlási 0 × 0.
- Novo nahraná fotka nabieha 450 ms (`fin()`), nikdy sa neobjaví skokom.

## Pamäť a sieť (`keepAround`, `load`, `drop`)

- V pamäti je aktuálny záber, oba susedia a ďalší v smere skrolovania (najviac štyri). Pri skoku sa
  najprv načíta cieľ, susedia až keď je cieľ hotový.
- Zábery mimo okolia a mimo obrazovky sa uvoľnia (textúra, hĺbka, video), rozbehnuté sťahovanie sa zruší
  (`AbortController`). Prológ, ktorý prebehol, sa uvoľní, len čo zíde z obrazovky.
- `keepAround` sa nevolá v každej snímke: v `setTimeout(…, 0)` po snímke, najviac raz za 100 ms alebo pri
  zmene záberu či smeru.
- Výpadok siete: záber sa skúsi znova po 10 s (`retryOk`). AVIF zlyhá raz, ďalej sa berie WebP.
- Strata grafického kontextu: `preventDefault`, rozrobené pásy sa hneď zrušia (uvoľnia rozbalené obrázky);
  po obnove sa všetko načíta znova. `stop()` uvoľní všetko, `forceContextLoss()`, zmaže plátno.
- `visibilitychange`: skrytá karta nekreslí.

## Zahriatie pred prvým snímkom

```js
try { await Promise.all([renderer.compileAsync(scene, camera), renderer.compileAsync(postScene, postCam), renderer.compileAsync(softScene, postCam)]); } catch (e) { /* preloží sa pri prvom kreslení */ }
// prvé použitie programu číta zoznam uniformov synchrónne z grafiky: urobí sa teraz do cieľa 1 × 1 px,
// nie pri prvom strihu uprostred skrolu
```

Pred tým `await new Promise((r) => setTimeout(r, 0))`, aby vytvorenie grafiky a meranie stránky neboli jedna
dlhá úloha. Pri zmene rozlíšenia sa nové ciele `rtA`, `rtB` hneď raz vyčistia (prvé použitie cieľa čaká na
grafiku; nech je to v snímke zmeny, nie pri najbližšom strihu).

## Čo nesmie byť v každej snímke

| Nerob | Prečo | Namiesto toho |
| --- | --- | --- |
| čítať `innerHeight` | na telefóne vynúti prepočet | výška z `measure()` (`vhNow`) |
| čítať `scrollY` po zápisoch štýlu | vynútený prepočet štýlu | `scroll` listener s `capture: true` zapíše `sy` |
| zapisovať CSS premennú na `<html>` | dedí sa do celej stránky, prepočet asi 750 prvkov | premenné len na kotvy (`--hint` len na kotvu úvodu) |
| volať `keepAround` | fetch, uvoľňovanie, videá | `setTimeout`, najviac raz za 100 ms |
| zmenšovať hĺbkovú mapu | 36 až 320 ms na telefóne | uložiť ≤ 768 px už pri príprave |
| nahrávať celú fotku naraz | 40 až 250 ms na telefóne | pásy po 256 riadkoch |
| `measure()` pri každom `resize` | lišta prehliadača posiela `resize` počas skrolu | ak sa plátno (`100lvh`) nezmenilo, `measure()` o 150 ms |

Meranie po týchto úpravách (telefón 390 × 844, CPU 4×, film vypnutý): hlavné vlákno 10,9 → 9,6 ms na snímku;
audit inou metódou tvrdil viac, preto tvrdenia auditu over meraním (`CHECKS.md` časť 13).

## `content-visibility` a kotvy (HEAD SPA)

Sekcie s `content-visibility: auto` majú vo filme inú výšku, než prehliadač odhaduje, skok cez menu by
pristál vedľa. `world.js` ich po prvom pohybe postupne vo voľných chvíľach vykreslí (`requestIdleCallback`),
pri kliknutí na odkaz v stránke hneď všetky; v prehliadači bez `overflow-anchor` (Safari) vyrovná posun ručne.
Príchod s `#kotvou` vykreslí všetko hneď (trieda `cv-all` z hlavičky).

## Výsledky

- BARBERSHOP 30 naživo (Lighthouse 12.8.2, predvolená adresa s prológom): telefón 96 až 99, počítač 100,
  prístupnosť, osvedčené postupy a SEO 100, CLS 0 (`CHECKS.md` časť 10); po skrátení cesty telefón 93 až 99,
  medián 97, počítač 100 (`CHECKS.md` časť 11). Lighthouse kreslí softvérovo, meria teda pokojnú verziu so zálohami.
- HEAD SPA: počítač 100, mobil 94 až 96 (`README.md`, Výkon na mobile).
- Plynulosť filmu na skutočnom zariadení headless prehliadač nezmeria (softvérové kreslenie asi 7 snímok
  za sekundu); časy prológu a zastavenia sa dajú zmerať (`uvod-meranie.mjs`), fps nie.

## Overené, ešte nenasadené nápady (`CHECKS.md` časť 13)

Kresliť v strihu len potrebný cieľ, mipmapy cieľov len pri rozmazaní, šero `body::after` presunúť do shadera,
prispôsobivé pásy nahrávania (s limitom bajtov), menej vzoriek pri krátkej stope strihu, skryté zálohy bez
sťahovania pri bežiacom filme.

## Rozdiely medzi dokumentmi a kódom (platí kód)

| Dokument hovorí | Kód robí |
| --- | --- |
| `TOUR_DIRECTION.md`: plátno na telefóne až 3× | `DPR_MAX = min(devicePixelRatio, 2)` |
| `TOUR_DIRECTION.md`: oblúk 2,6 % šírky na telefóne | `ARC` 0,02 vo `film.js` (0,026 je v HEAD SPA `world.js`) |
| `TOUR_DIRECTION.md`: 60 snímok/s minútu, potom 30, pružina 4,2 | plná frekvencia 3 minúty, pružina `w0 = 6.5` (dokument to v časti Cesta už spomína) |
| `TOUR_DIRECTION.md`: prológ chôdza 2,0 / 2,3 s, vstup 1,4 / 1,6 s, čakanie pred podnikom do 6 s | chôdza 1,1 / 1,3 s, vstup 0,9 / 1,0 s, pred podnikom najviac 1,5 s |
| `TOUR_DIRECTION.md`: poistka filmových pásov po 9 s | CSS `bars-out` s oneskorením 5 s, kým nie je `world-in` |
| `README.md` HEAD SPA: štyri pásy na snímku | `pump(4)` = rozpočet 4 ms, aspoň jeden pás |
| `TOUR_DIRECTION.md` (Úvod ako film, bod 4): počas prológu sa nesťahuje nič iné než záber úvodu | `keepAround` počas prológu vynechá len záber o dva ďalej; od polovice prológu (`S` zaokrúhlene 1) sa sťahuje aj ďalší záber za úvodom |
| komentár vo `film.js` pri `moving`: „pokojových 30 snímkach za sekundu“ | režim 30 snímok už nie je, komentár je zastaraný |
| `film.json`: veľkosti `hlbka` (napr. `stol` 55 232 B) | súbory po zmenšení na 768 px majú asi 5 až 18 kB; `film.json` sa neprepísal |
| `CONTRACT.md` opisuje 3D kreslo (`chair.js`, `#stage`, `data-webgl`) | kreslo je z webu odstránené (`TOUR_DIRECTION.md`, Čo sa z webu odstraňuje); aktuálna je napr. poznámka v časti 3, že progres sa nepíše na `<html>` a `--hint` je na kotve úvodu |
| HEAD SPA `index.html`: brána vytvára WebGL2 kontext v hlavičke | staršia verzia; BARBERSHOP 30 overuje GPU až po FCP |
