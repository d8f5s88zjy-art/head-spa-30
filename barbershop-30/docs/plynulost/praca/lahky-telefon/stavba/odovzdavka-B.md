# Odovzdávka B – ľahký telefón L5 + L6 (staviteľ B)

Strom: `$SP/hs-lahky` (vetva `barbershop-lahky-telefon`, základ 7ea247c = D1). Cesty nižšie sú od `barbershop-30/`.
`$SP` = `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad`, `$ST` = `$SP/barber/lahky-telefon/stavba`.
Nadväzuje na odovzdávku A (L1–L3), z nej sa nič nemenilo.

## Commity (lokálne, nič nebolo pushnuté ani zlúčené)

| hash | dávka | čo |
|---|---|---|
| 3346f80 | L5 | plynulý skrol na telefóne mimo fotiek (+ úprava app-smoke) |
| 0195615 | L6 | na telefóne sa vracia slučka tímu ako ľahké video (+ kontroly v app-smoke, README) |

`git log --oneline 7ea247c..HEAD`: 5 commitov (0f6ffa3, 5902aa5, f1f9c4d, 3346f80, 0195615). `git status`: čistý.
Autor commitov je z nastavenia gitu stromu (`Claude <noreply@anthropic.com>`), rovnako ako pri dávke A. Správy sú bez podpisov.

## Priebeh po prerušení

- L5 bola commitnutá pred prerušením. Commit bol dvakrát doplnený (`git reflog`: 790c05c → 6fb8811 → 3346f80) o opravu
  `__scrollSettled` (`$ST/b-nastroje/fix-settled.py`) a o čakanie na ustálenú polohu v teste „späť“.
- Po poslednom doplnení test chýbal. Posledný výstup `$ST/b-smoke-L5b.txt` mal ešte 1 FAIL. Preto som stav 3346f80 overil znova v kópii
  s pevnými odkazmi (`cp -al`, zmenené súbory z `git show HEAD:`): **app-smoke 141 OK, všetky prešli** (`$ST/b-smoke-L5c.txt`),
  **i18n 64 OK** (`$ST/b-i18n-L5c.txt`). Kópiu som potom zmazal.
- Rozpracovaná L6 bola vo dvoch častiach:
  - necommitnuté CSS v strome (záloha `$ST/zaloha/B-necommitnute-1102.patch`),
  - app.js uložený bokom v `$ST/b-tmp/app-L6.js`.
  `diff` proti app.js v HEAD ukázal len zmeny L6, oprava L5 v ňom už bola. Použil som ho a dokončil: opravil som čísla PSNR
  v komentári, doplnil testy a README.

## L5 – plynulý skrol mimo fotiek (3346f80)

| bod | kde | dôkaz |
|---|---|---|
| bez `filter: blur` v nástupoch: slová `.kw` (posun `min(0.3em, 24px)` + opacity), kroky `li` (14 px + opacity), úvod `zaostrenie` (len posun 14 px) | style.css:1331–1332, 1323, 1091 | `$ST/b-kontrola-L5.json` `filter: kw [], steps [], hero []` (D1: `blur(5px)` × 24, `blur(6px)` × 5; `b-kontrola-L5-D1.json`) |
| lerp vypnutý na dotyku (`lerpOn`; posledný vstup rozhoduje: dotyk vypne, koliesko zapne) | app.js:343–345, 353 | `lerpDotyk: settled true, o 1.0000` (D1: `false, 0.0000`) |
| `--sp` len na zálohách v okolí (`.is-near`, najviac 3) | app.js:323 (zabery), pôvodný zápis pre titulné karty vynechaný v apply() | app-smoke `[?film=off] --sp sa počas skrolu zapisuje len na zálohy v okolí` (MutationObserver: `far: 0`) |
| `measure()` sa nevolá pri zmene len výšky o < 120 px; pri načítaní a písmach vždy celé | app.js:436–451 (`measureFull`, `scheduleMeasure(force)`) | `measure: lista60 0, lista115 0, vyska150 19` (D1: 19 aj pri 60 px) |
| lesk spodného tlačidla raz | style.css:1244–1247, app.js:330–331 | `lesk: iter "1", po: raz true, anim 0` (D1: `infinite`) |
| atmosfera.js nie pri prvom švihu: na dotyku v pokoji (3,5 s po `load` + 1 s bez posunu), pri ťuknutí (`click` s `detail > 0`), klávese alebo myši; na počítači bez zmeny | app.js (časť atmosféra, `vPokoji(load)`) | `atmosferaPocasSvihu: []` (D1: js+css), `atmosferaPotom: hudba true`. `atmosfera-test.mjs` po L6: **39 OK, všetky prešli** (`$ST/b-atmosfera-L6.txt`) |

**Bod „krytie na .title-card“ som vynechal.** Podklad z nástroja `$ST/b-nastroje/paint-karty.mjs` (`$ST/b-paint-L6.json`):
- podmienky: lite 390×844 @3, prechod Čakáreň → Kreslo v 60 krokoch, sledujú sa udalosti Paint s plochou výrezu ≥ 50 % okna,
- výsledok: z 83 takých udalostí pripadá na `.title-frame` (nositeľ `--o`) **2**, na `.title-card` 6 a na `#document` 38.

Rám s krytím teda nie je hlavný zdroj veľkých prekreslení, a presun `--o` by menil spôsob, ako karta mizne, bez dokázaného prínosu.
Výhrada: výrez udalosti Paint v Chromiu so softvérovým kreslením je len orientačný, nie skutočná poškodená plocha. Rozhodne až meranie
na iPhone (Safari Web Inspector, Paint rectangles).

## L6 – slučka tímu ako ľahké video (0195615)

**Čo:**
- V `html.lite` dostane záber s `data-video-mode="play"` bežné video. Je to len Tím, tá istá slučka `assets/video/tim-slucka-864`, ktorú
  na telefóne hrá dnešný film (index.html:289).
- Zábery `vstup-dnu` a `okolo-kresla` sú sekvencie snímok, nie video. V assets/video pre ne nič nie je, preto ostávajú fotky z L2 a L3.
- Nové súbory som nevyrobil.

| pravidlo | kde |
|---|---|
| `<video muted playsinline loop preload="none" aria-hidden>` vložené do `.film-still` zálohy, `width/height` z `data-video-size`, `object-position` z `data-video-f` | app.js:859–883 (`slucky()`) |
| typ: H.264 mp4 má prednosť (iPhone ho dekóduje hardvérovo), inak webm; plagát `.webp` | app.js:861–863 |
| rezervovaný rozmer: `position:absolute; inset:0` v pevnej zálohe, žiadny posun | style.css:1150–1155 |
| plagát aj adresa sa nastavia až pri `is-near` záberu (karta pred Tímom); video sa vďaka `preload="none"` sťahuje až pri `play()` | app.js:829–840 |
| plagát sa ukáže až načítaný, prelínanie 400 ms (`is-ready`) | app.js:832–836, style.css:1153–1155 |
| hrá, keď kotva záberu zaberá ≥ 60 % výšky okna (IntersectionObserver, 41 prahov) a záloha je zobrazená (`is-near` + `is-shown`, nie zakrytá ďalšou kartou ani pätičkou), inak stojí | app.js:789–792, 817–828 |
| najviac 1 hrajúce video spolu s videami Remeslo a Tím (`sync()` vyberie jedno) | app.js:798–806 |
| nič viazané na skrol: len IntersectionObserver, MutationObserver na triede záberu, `visibilitychange` | app.js:817–849 |
| úsporný režim: odmietnuté `play()` nechá plagát, ťuknutie (`touchend`) skúsi znova; chyba videa nechá plagát | app.js:842, 848 |
| `prefers-reduced-motion`, `?motion=off`, šetrenie dát: `motionOff` → žiadna slučka (ostáva fotka) | app.js:779 |
| `?film=on`, počítač, 600×900 s myšou: bez `lite` → `slucky()` vráti `[]` | app.js:860 |

Plagát je prvá snímka (ffmpeg PSNR proti `tim-slucka-poster-864.webp`):
- mp4, snímka 0: **40,3 dB**,
- webm, snímka 0: 40,2 dB,
- mp4, snímka 15: 23,8 dB.

Štart prehrávania teda neurobí skok.

**Funkčná kontrola** (`$ST/b-nastroje/kontrola-L6.mjs`, `$ST/b-snimky/L6b/kontrola-L6.json`, 390×844 @3, dotyk):
- pri štarte žiadna požiadavka `tim-slucka`,
- pri Čakárni (karta pred Tímom) len plagát, video stojí,
- pri Tíme video hrá (`t` 0,84 → 2,04 s),
- na páse tímu, pri Kresle a pri návrate na Čakáreň stojí, pri opätovnom Tíme hrá ďalej,
- `maxPlay 1`, žiadne chyby,
- úsporný režim: plagát, `paused`. Video sa vtedy nestiahne (`$ST/b-nastroje/usporny-req.mjs`: len plagát),
- obmedzený pohyb, `?film=on`, 1440×900 a 600×900: 0 slučiek, 0 požiadaviek.

Snímky:
- `$ST/b-snimky/L6b/tim-hra.png` (hrá),
- `$ST/b-snimky/L6b/tim-plagat.png` (úsporný režim),
- `$ST/b-snimky/L6-karty/karty-mobile-lite.jpg` (9 kariet, Tím so slučkou, ostatné fotky -m).

Posun rozloženia 0,0099 pri skoku na Čakáreň má zdroj `::before` a je rovnaký aj bez L6 (`cls-zdroj.mjs` na kópii 3346f80). L6 ho
nespôsobila, nechávam ho ako poznámku. Asi ide o `::before` lišty z L1, overiť.

## Testy (port 8621 cez `B30_PORT`, server staviteľa 8620; v `barbershop-30`, `NODE_PATH=/opt/node22/lib/node_modules`)

| príkaz | stav | výsledok |
|---|---|---|
| `node source/tools/app-smoke.mjs` | 3346f80 (L5) | **141 OK, všetky prešli** `$ST/b-smoke-L5c.txt` |
| `node source/tools/i18n-test.mjs` | 3346f80 | **64 OK** `$ST/b-i18n-L5c.txt` |
| `node source/tools/app-smoke.mjs` | 0195615 (L6) | **149 OK, všetky prešli** `$ST/b-smoke-L6c.txt`, z toho 8 nových kontrol `[lite slučka]` |
| `node source/tools/i18n-test.mjs` | 0195615 | **všetky prešli** `$ST/b-i18n-L6.txt` |
| `node source/tools/atmosfera-test.mjs` | 0195615 | **39 OK** `$ST/b-atmosfera-L6.txt` |
| `node source/tools/uvod-shot.mjs --only=mobile` | 0195615 | `mobile-lite: OK` (triedy lite, nadpis 1, tlačidlá 1, záloha rohozka-m, požiadavky filmu žiadne); film na telefóne s `?film=on` beží `$ST/b-uvod-L6.txt`, snímky `$ST/b-snimky/L6-uvod/` |
| `node source/tools/karty-shot.mjs --lite --out=$ST/b-snimky/L6-karty` | 0195615 | 9 kariet, všetky s fotkou `$ST/b-karty-L6.txt` |

Úpravy app-smoke v L6:
- kontrola kotvy `#tim` povoľuje `tim-slucka` (`FILM_REQ_KOTVA`, app-smoke:352, 431),
- pri štarte stránky platí naďalej celý `FILM_REQ` vrátane `tim-slucka`,
- nové kontroly sú v app-smoke:440–495.
- Plagát môže prísť dvakrát (`new Image` a `poster`), lebo testovací server posiela `Cache-Control: no-store`. S python
  http.server (bez no-store) prišiel raz (`$ST/b-tmp/server-8620.log`).

Prvý beh `$ST/b-smoke-L6b.txt` mal 1 FAIL práve kvôli tomuto dvojitému plagátu. Opravil som očakávanie testu, nie stránku. Časové merania som nerobil.

## Návrh (nevyrobené, len so súhlasom)

`tim-slucka-864.mp4` má 3,4 MB, H.264 High, 864×1536, **60 fps**, 3,7 Mb/s, 7,4 s (ffmpeg). Podľa rozboru je zväčšená z 576 px. Pre telefón
navrhujem `tim-slucka-576.mp4` (576×1024, 30 fps, CRF asi 26, `+faststart`) z toho istého zdroja. Odhadom má pod 1 MB a dekóduje sa
s polovičnou snímkovou frekvenciou. Plagát musí ostať prvou snímkou. V kóde stačí zmeniť `data-video` len pre lite (napr.
`data-video-m`).

## Čo ostalo a na čo dať pozor

- **V8:** súhlas majiteľa s telefónom bez filmu a so slučkou Tím ostáva otvorený. Porovnať sa dá cez `?film=on`.
- **SKEPTIK doplniť 14:** úvod bez rozmazania je zmena podpisového nástupu, treba ju ukázať majiteľovi.
- **Overiť na iPhone:**
  - automatické prehrávanie a úsporný režim (plagát, ťuknutie),
  - `droppedVideoFrames`,
  - prekreslenie pri prechode kariet (bod `.title-card`),
  - Safari lišta: `measure()` pri 50–115 px sa nevolá.
- **SKEPTIK 9 (`obeh` mimo okna) a 8 (`text-rendering`)** som nerobil, neboli v zadaní dávky B.
- **Dočasné súbory:**
  - nástroje sú v `$ST/b-nastroje/` (kontrola-L5/L6, cls-zdroj, usporny-req, paint-karty, spat, patch-smoke-L6.py),
  - `$ST/b-tmp` (4,4 MB),
  - `$ST/b-snimky` (35 MB, žiadny súbor nad 50 MB).
- **Servery a prehliadače:** servery 8620 a 8622 som ukončil, na 8620–8622 nič nepočúva. Žiadny prehliadač nebeží.
