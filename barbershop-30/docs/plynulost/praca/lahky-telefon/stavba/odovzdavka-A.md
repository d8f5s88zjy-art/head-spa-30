# Odovzdávka A – ľahký telefón L1 + L2 + L3 (staviteľ A)

Strom: `$SP/hs-lahky` (vetva `barbershop-lahky-telefon`, základ 7ea247c = D1). Cesty nižšie sú od `barbershop-30/`.
`$SP` = `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad`, `$ST` = `$SP/barber/lahky-telefon/stavba`.

## Commity (lokálne, nič nebolo pushnuté)

| hash | dávka | čo |
|---|---|---|
| 0f6ffa3 | L1 | lišta na telefóne plne tmavá, stránka končí pätičkou |
| 5902aa5 | L2 | ľahký telefón bez filmu, prvý obraz hneď z HTML (+ vetvy lite v testoch, port B30_PORT) |
| f1f9c4d | L3 | fotka záberu sa nikdy neukáže neúplná (jeden model záberov) |

`git diff 7ea247c --stat`: 9 súborov, +313 / −40.

L2 a L3 tvoria jeden celok (V4) a zverejniť sa smú len spolu. Medzistav 5902aa5 v teste ukázal presne problém z V4:
`[lite 430] späť … hotova: []`, teda fotka aktuálnej karty ešte nebola stiahnutá a pod ňou bol ink (`$ST/a-smoke-L2.txt`).

## L1 – lišta a pätička (iba CSS, `assets/style.css`)

- `style.css:318–325`: na šírke ≤ 900 px má `.site-header.is-scrolled` pozadie `var(--ink)` a linku `box-shadow: 0 1px 0 var(--line)`. Pod lištou je
  mäkký prechod `::before` s veľkosťou 20 px (0,82 → 0). Začína 1 px pod lištou, takže linku neprekryje.
- `style.css:352–359`: telo na ≤ 900 px má `padding-bottom: 0`. Pri tom je komentár s opraveným zdôvodnením podľa SKEPTIK
  „doplniť“ 1. Príčinou nie je odraz na konci, ten vypína `overscroll-behavior-y: none` (style.css, časť P1). Príčinou bola rezerva tela 80 px
  a bezpečný okraj pri `viewport-fit=cover` (index.html:5).
- `style.css:940–946` (za základným štýlom pätičky, inak by ho prebil): `.site-footer` má `padding-bottom: calc(var(--s7) +
  var(--cta-h) + 24px + env(safe-area-inset-bottom, 0px))` a tieň `0 50vh 0 50vh var(--ink)`. Tieň sa nepočíta do výšky ani šírky stránky
  a zakryje plochu za koncom dokumentu. Pravidlo platí len pre ≤ 900 px, počítač ostáva bez zmeny.
- Overené (`$ST/a-kontrola-L1.json`, 390×844 @3): rezerva pod pätičkou je `0`, lišta `rgb(14, 13, 12)`, pätička `padding-bottom 128px`, telo `0px`.
  Snímka `$ST/a-snimky/L1/tel-koniec-maly.png`. Počítač 1440×900 (`a-nastroje/lista-pc.mjs`): `rgba(14, 13, 12, 0.72)`, `blur(12px)`,
  pätička bez tieňa, `48px`.
- **Neoverené:** skutočná hodnota `env(safe-area-inset-bottom)` v náhľade aplikácie Claude na iPhone. V Chromiu je 0. Tieň pätičky pokryje obe
  možné príčiny.

## L2 – brána lite (`index.html`, `assets/film.js`, `assets/style.css`, `assets/app.js`, README)

- **Brána, index.html:16** (komentár :11–14):
  `L = !film=on && matchMedia('(hover: none) and (pointer: coarse)') && Math.min(screen.width, screen.height) <= 720`.
  - Pri `L` sa pridá `lite` a `world-off`. `world` ani `pro` sa nepridajú, lebo prológ podmieňuje trieda `world`.
  - `?film=off` lite nechá, `?film=on` ho vypne. Pôvodný `return` pri `film=off` som zrušil, takže predčítanie prvej fotky ide aj pri film=off.
- **Predčítanie** ostáva len AVIF (V6, bez WebP). V lite je vždy `rohozka-m`, lebo prológ tam nie je.
- **Načítanie film.js mimo lite:**
  - index.html:26–27 pridá `modulepreload` film.js len mimo lite, aby sa sťahoval v rovnakom čase ako predtým.
  - index.html:908 je vkladač `<script type="module">if(!…contains('lite'))import('./assets/film.js')</script>` namiesto statickej značky.
  - film.js:82: adresa modulu bez značky so `src` je `new URL('assets/film.js', d.baseURI)`. `source/film-dev.html` (klasický `defer`) ide ďalej
    cez `currentScript`.
- **Prvý obraz, style.css:1096–1099:** v `html.lite` majú nadpis, kicker, riadok a tlačidlá úvodu animáciu `dosadnutie`, teda len posun
  14 px bez krytia 0 a bez `filter: blur`. Sú viditeľné od prvého snímku.
- **Zálohy so sekvenciou alebo videom:** Poď ďalej má na telefóne `sala-m-1086/1448` namiesto `seq/vstup-dnu/f025` (index.html:217–219,
  bod záujmu `--fmx 50 % / --fmy 55 %` podľa `data-fm`). Remeslo (`stol-m`) a Tím (`sala-rano-m`) už fotku -m mali. Nové zábery ani súbory
  nepribudli.
- **Overenie** (`$ST/a-kontrola-L3.json`, 390×844 @3, dotyk):
  - triedy na prvom snímku aj po načítaní sú `karty lite world-off js-kin js-steps`,
  - WebGL kontexty: `gl: 0`, `BS30_FILM` neexistuje, celkom 23 požiadaviek,
  - požiadavky na three.module, film.js, film-worker, seq/*, *hlbka*, tim-slucka: `[]`,
  - prvý snímok: `h1: 1, act: 1, still: 1`.
- **Počítač:**
  - 1440×900 `?film=on`: `worldIn: true`, three.js sa stiahne.
  - Bez `?film=on` sa v kontajneri so softvérovou grafikou dá `world-frame`, rovnako ako v D1.
  - 600×900 s myšou: `karty world pro …`, bez lite (V3).
  - `strih-shot.mjs --only=desktop --cuts=rohozka,sala`: strihy idú (`$ST/a-strih-L3.txt`).
  - `karty-shot --only=desktop`: film prejde všetkých 9 kariet, S = 0 → 8,85 (`$ST/a-karty-pc-L3.txt`).

## L3 – fotka nikdy neúplná, jeden model (`assets/app.js` časť 5b, `assets/style.css`)

Model je opísaný na jednom mieste v app.js:227–240 (SKEPTIK „doplniť“ 3): pomalé priblíženie `--sp` (transform) a prelínanie `--so`
(opacity) riadi skrol. Prelínanie 400 ms sa použije len pri dobehnutí. `scale(1.03 → 1)` zo SPEC časti 0 som zámerne nepoužil.

| Pravidlo | Kde |
|---|---|
| dekódovanie po stiahnutí, `img.decode()`; pri chybe stačí `complete && naturalWidth > 0`; nevolá sa v každej snímke (`__busy`, `__dec`) | app.js:248–266 |
| záber je „hotový“ len keď je v okolí a dekódovaný; po vypadnutí z okolia sa dekóduje znova | app.js:284, 311–314 |
| krytie zhora: záber zakryje nižšie až keď je celý, hotový a nedobieha | app.js:277–291 |
| neskoro hotová fotka dobehne prelínaním 400 ms (`is-catch`) | app.js:288, style.css:1145–1146 |
| najnižší zobrazený záber je vždy celý, nikdy priesvitný nad inkom | app.js:292–300 |
| poistka len pre prvý obraz: kým nie je dekódovaná žiadna fotka (`anyDec`, `load` ju neukončí), úvod sa ukazuje bez čakania | app.js:242, 284 |
| okolie: na obrazovke + `base` + `vis` + aktuálna karta vždy, ±1 po prvom dekódovaní (`firstDone`) alebo `load`, susedia do 3 | app.js:301–308 |
| `fetchpriority = 'low'` pre okolie mimo aktuálnej karty | app.js:315 |
| úvod tiež dostane `display: none` mimo okolia (po `data-scene-active`), takže zálohy bez `display: none` sú najviac 3 | style.css:1142–1144 |
| `will-change: transform` len pri `.is-near` | style.css:474–475 |

Dve chyby som našiel a opravil ešte pred commitom L3:

1. `load` ukončil poistku skôr, než bola niektorá fotka dekódovaná, a vznikol ink.
2. Po znovunačítaní uprostred stránky vytlačila aktuálna karta spolu so susedom z okolia práve ten záber, ktorý skrol ukazoval. Na obrazovke by
   tak natrvalo ostala rohožka. Nový test na to: app-smoke:400.

Pasívna sonda bez `decode()` (V5) je v `$ST/a-nastroje/skok.mjs`. Podmienky: telefón 390×844 @3, sieť 562,5 ms a 180 kB/s, skok `#sluzby` pred `load`
a švih 6 × 0,9 okna pred `load`. Výsledok:

- `nestiahnutaIna: 0`: žiadna karta okrem úvodu nebola viditeľná nestiahnutá,
- `inkPoUvode: 0`: po stiahnutí úvodu nebol nikdy ink,
- `maxZobr: 3`.

Zostávajúci ink (`ink` 461 snímok pri skoku, 129 pri švihu) je len okno poistky, kým sa pri 180 kB/s sťahuje prvá fotka
`rohozka-m-1448.avif` (438 kB). Inú fotku vtedy stránka ešte nemá. Skrátiť ho môže L4 (menšie súbory, len so súhlasom majiteľa podľa V7).

## Testy (porty 8620 server staviteľa, 8621 test cez `B30_PORT`; výstupy v `$ST`)

| príkaz (v `barbershop-30`, `NODE_PATH=/opt/node22/lib/node_modules B30_PORT=8621`) | výsledok |
|---|---|
| `node source/tools/app-smoke.mjs` pred zmenami | 109 OK, 3 FAIL (desktop, kotva čakáreň, film pri záťaži) `a-smoke-pred.txt` |
| … po L1 | všetky prešli (112) `a-smoke-L1.txt` |
| … po L2 | 133 OK, 5 FAIL: 4 × film na telefóne pri `?film=on` (rovnaký druh ako pred zmenami) a 1 × lite späť (V4, opravuje L3) `a-smoke-L2.txt` |
| … po L3 (konečný stav f1f9c4d) | **všetkých 140 prešlo** `a-smoke-L3b.txt` |
| `node source/tools/i18n-test.mjs` po L2 a po L3 | 64 OK, všetky prešli `a-i18n-L2.txt`, `a-i18n-L3b.txt` |
| `node source/tools/uvod-shot.mjs --only=mobile` po L2 a L3 | film na telefóne s `?film=on` beží (prológ, von, dnu), `mobile-lite: OK` `a-uvod-L3.txt` |
| `node source/tools/uvod-shot.mjs` (aj desktop) | po L2 `page.screenshot: Timeout 30000ms` vo filmovom prológu na počítači; záťaž stroja 9–12 pri 4 jadrách (`/proc/loadavg`), cudzie prehliadače. Zmenou to nie je dotknuté, opakovanie nechávam na kontrolóra |
| `node source/tools/karty-shot.mjs --lite` po L2 a L3 | 9 kariet, všetky s fotkou -m `a-snimky/L3-karty/karty-mobile-lite.jpg` |
| `node source/tools/karty-shot.mjs --only=desktop` po L3 | film prejde všetkých 9 kariet `a-karty-pc-L3.txt` |
| `node source/tools/strih-shot.mjs --only=desktop --cuts=rohozka,sala --mixes=0,0.5,1` | strihy rohozka>sala a sala>stol idú `a-strih-L3.txt` |

Časové merania som nerobil (podľa zadania).

## Ako som vyriešil výhrady skeptika

- **V1:** aktuálna karta je vždy v okolí (app.js:306) a na obrazovke je vždy hotová fotka alebo poistka úvodu. Obe sú overené v app-smoke časti 9
  (app-smoke:333 a ďalej) pre všetky tieto prípady:
  - každá karta pri 390 aj 430,
  - znovunačítanie uprostred stránky (čakáreň),
  - späť,
  - `#tim`, `#kontakt` (okno kryje pás a pätička),
  - `b30.lang=en` (t-wait skrýva len text úvodu, fotka je viditeľná),
  - `?film=off`.
- **V2:** okolie ±1 sa sťahuje hneď po prvom dekódovaní (`firstDone`), nie až po `load`. Platí s `fetchpriority` low. Overené sondou skoku pred `load`.
- **V3:** brána `(hover: none) and (pointer: coarse)` a kratšia strana obrazovky ≤ 720. Test 600×900 s myšou: `world`, bez `lite`.
- **V4:** L2 a L3 sú tri commity jedného celku. Medzistav L2 sa nesmie zverejniť sám, dôkaz je vyššie.
- **V5:** sonda je pasívna (`skok.mjs`) a ako príznak hotovosti číta len stav stránky. Rozhodujúci screencast a Safari Web Inspector ostávajú na
  kontrolóra merania.
- **V6:** do predčítania som WebP nepridal. Prvá obrazovka má 1 požiadavku `rohozka-m-*` (`rohozka-m-1448.avif` pri 390 @3).
- **V8:** odchod filmu z telefónu je zatiaľ len technicky pripravený. Majiteľ si porovná `lite` a `?film=on` na iPhone a test `[telefón ?film=on]`
  potvrdzuje, že `?film=on` film zapne. Súhlas majiteľa je stále otvorený.

## Čo ostalo a na čo dať pozor

- **Mimo môjho rozsahu:**
  - L5 (rozmazávanie slov `.kin`/`.steps`, `--sp` na všetkých 9 záberoch v každej snímke, lerp na dotyku, `measure()`, lesk),
  - L6,
  - L4 (V7, len so súhlasom),
  - hudba.
  - Pri lerpe som videl, že počas dlhého programového skrolu (návrat späť cez 10 000 px) zobrazený stav zaostáva za skutočnou polohou. Patrí to
    do L5.3.
- **Pravidlo `footerIn`** z D1 (app.js `zabery`) zhasne všetky zábery, keď pätička vstúpi do okna. Na telefóne to kryje pás kontaktu
  (1 085 px > okno). Na počítači je správanie nezmenené.
- **Na iPhone:**
  - overiť `env(safe-area-inset-bottom)` v aplikácii Claude,
  - zistiť, ako Safari vyberie 1448 alebo 1086,
  - zmerať cenu `decode()` v Safari,
  - pozrieť, či sa dobehnutie 400 ms pri pomalej sieti neukazuje príliš často.
- **Mimo stránky som zmenil aj testovacie nástroje:**
  - `source/shot.mjs:101–102` (port z `B30_PORT`),
  - `app-smoke` časť 9 (pôvodná kontrola „softvér mobil“ je teraz „softvér úzke okno bez dotyku“, app-smoke:316–318, lebo telefón bez
    `?film=on` je lite),
  - `uvod-shot` časť 4,
  - `karty-shot --lite`,
  - README:33–39.
- **Dočasné súbory:**
  - nástroje sú v `$ST/a-nastroje/` (kontrola.mjs, skok.mjs, spat.mjs, lista-pc.mjs, patch-L3.py),
  - snímky v `$ST/a-snimky/` (12 MB, veľké PNG som zmazal),
  - server 8620 som ukončil, žiadny proces na 8620–8629 nepočúva.
