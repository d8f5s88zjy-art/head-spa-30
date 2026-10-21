# Rozbor: váha a dekódovanie médií na iPhone (D1 a BALÍK)

Oblasť: čo iPhone (390 × 844, DPR 3, Safari s AVIF, aj Safari v aplikácii Claude = WKWebView) stiahne a rozbalí,
koľko to váži, a čo s tým, aby web bol „ľahký ako pierko“. Len čítanie stromov, bez prehliadača a bez servera.

- D1 = `scratchpad/hs-pred-d1/barbershop-30` (commit 7ea247c)
- BALÍK = `scratchpad/hs-chatgpt/barbershop-30`
- Nástroje (len `python3 -I`, bez knižníc): `lahky-telefon/nastroje/rozmery.py` (rozmery z hlavičiek AVIF `ispe`,
  WebP VP8/VP8L/VP8X), `vyber.py` (výber `<picture>`/`srcset` pre 390 × 844 DPR 3), `rozpocet.py` (súčty bajtov,
  text ako gzip úroveň 6 = približne GitHub Pages, a megapixelov pre scenáre).
  Spustenie: `python3 -I nastroje/rozpocet.py <D1> <BALÍK>`, `python3 -I nastroje/vyber.py <strom> 1`.

Obrázky a videá v `assets/img`, `assets/seq`, `assets/video` sú v oboch stromoch bajtovo rovnaké (porovnanie
`md5sum`); BALÍK pridal len `*-hlbka-z.webp` (224 × 398), `nahlady.json` a `nahlady.css`. Rozdiely sú teda v tom,
**čo sa vyberie a kedy**, nie v súboroch.

## 1. Zhrnutie v piatich vetách

1. Každá fotka filmu aj zálohy na telefóne je **1448 × 2575 = 3,73 MP** (`*-m-1448.avif`, 200 – 437 kB), hoci
   nástroj bol navrhnutý na 1086: `stills.py:17–19` píše „93vw dá pri 3× aj 2× displeji 1086 px“, ale
   0,93 × 390 × 3 = **1 088 px > 1 086**, takže Safari (najmenší kandidát s hustotou ≥ 3) berie 1448 (hustota 3,99).
   Tým sa obíde aj úsporná kvalita prvého obrazu `FIRST_Q` (`film.py:44–46`, platí len pre `-m-1086`):
   `rohozka-m-1086.avif` má 122 kB, stiahne sa `rohozka-m-1448.avif` 428 kB.
2. Film na telefóne berie tiež 1448 (`film.js:425` `CAP = phone ? 1448`, `pickSize` 426–431), a v D1 ho rozbaľuje
   `createImageBitmap` (`film.js:433–439`, sekvencie `film.js:678`); WebKit to robí s veľkou pravdepodobnosťou na
   hlavnom vlákne (komentár `film.js:638` „mimo hlavného vlákna“ platí pre Chromium) – **treba zmerať**.
3. Prvá obrazovka: D1 s filmom **1,30 MB** a **12,8 MP** na rozbalenie, BALÍK **1,37 MB / 12,3 MP**; celá stránka s
   filmom D1 **11,4 MB / 133 MP**, BALÍK **12,0 MB / 140 MP** (tabuľky nižšie).
4. Najväčšie položky celej stránky: video `tim-slucka-864.mp4` **3,32 MB** stiahnuté celé ako blob (`film.js:576`),
   95 snímok sekvencií **3,47 MB** (87 MP rozbaľovania počas skrolu) a 6 až 8 fotiek 3,73 MP.
5. Návrh „pierko“: telefónne varianty **900 × 1600 (1,44 MP)** z tých istých originálov a výrezov, sekvencie a video
   v natívnych **576 × 1024** (zdroj má len 576 px, `videa.sh:10`, `sekvencie.sh:4`), galéria na telefóne výrez
   4 : 5 **800 × 1000**, zobrazovať až po `decode()`; odhad: prvá obrazovka **≈ 0,6 MB / ≈ 3 MP**,
   celá stránka **≈ 5,5 MB / ≈ 70 MP** pri rovnakých záberoch a rámovaní.

## 2. Ako iPhone vyberá súbor (dôkazy)

| Prvok | Kód | Výpočet pre 390 × 844 DPR 3 | Vybraný súbor (vyber.py) |
|---|---|---|---|
| Zálohy filmu, telefónny `<source>` | D1 `index.html:158,167,236,260,285,479,641,759,783`, `sizes="(max-width: 720px) 93vw, 124vw"` | 362,7 px × 3 = 1 088 → kandidáti 1086 (2,99) / 1448 (3,99) | `*-m-1448.avif` (3,73 MP); `stol` 1152 × 2048 (2,36 MP), `kava` 1229 × 2185 (2,69 MP) |
| Predbežné načítanie úvodu | D1 `index.html:17–21` (rovnaké `imagesizes`) | ako vyššie | `vstup-m-1448.avif` 319 kB (prológ) alebo `rohozka-m-1448.avif` 428 kB |
| Skutočná šírka zálohy s filmom | `style.css:480–490` `--pw: 1.24·k·max(100vw, 100vh·pa)`, telefón `pa = 0,5625` (`style.css:501–503`) | 1,24 × 1,04 × 474,75 ≈ **612 px** CSS (157vw) | `sizes` 93vw ho podhodnocuje 1,7× |
| Skutočná šírka zálohy bez filmu | `style.css:442–458` `object-fit: cover`, 100svh | 844 × 0,5625 ≈ **475 px** CSS → 1 425 px displeja | 1448 je presne 1 : 1, 1086 = 2,3× hustota |
| Film na telefóne | `film.js:316` `DPR_MAX = min(dpr, 2)`, `film.js:425–431` | plátno 780 px, rovina ≈ 1,57 × okno → potreba ≈ 1 225 → 1448 | `*-m-1448.avif` (ten istý súbor ako záloha: 1× sieť, **2× rozbalenie**) |
| Tím (oba) | `index.html:320…` `(max-width: 640px) 50vw` | 195 × 3 = 585 → 820 | `tim-*-820.avif` 0,57 MP, 30–44 kB – v poriadku |
| Galéria D1 | `index.html:670–735` 100vw / 50vw | 1 170 → 1600; 585 → 640 | nožnice 1600 × 1000 (1,6 MP) + 7 × 640 (0,27 MP) |
| Galéria BALÍK | BALÍK `index.html:650–715` `(max-width: 640px) 146vw` / `78vw` | 569 × 3 = 1 708 → 1600 (najväčší, 2,81) | **5 × 1600** (1,6 – 1,71 MP) + 3 × 1080 (do 1,56 MP) |
| Záloha „Poď ďalej“ | D1 `index.html:212` `seq/vstup-dnu/f025` 720w; BALÍK `index.html:204` `sala-m` 93vw | – | D1 `f025.avif` 39 kB 0,92 MP; BALÍK `sala-m-1448.avif` 200 kB 3,73 MP |

Predpoklad na overenie: WebKit vyberá **najmenšieho kandidáta s hustotou ≥ DPR**; Chromium medzi 1086 (2,99) a 1448
(3,99) rozhoduje geometrickým priemerom (3,46 > 3), takže **emulácia v Chromiu pravdepodobne vyberie 1086** a váhu
podhodnotí. Overiť `currentSrc` priamo v Safari (Web Inspector cez kábel z Macu) – pozri časť 8.

## 3. (a) Prvá obrazovka

Scenár „film“ = trieda `world` z hlavičky (D1 `index.html:12`: WebGL2, bez reduce‑motion, `deviceMemory || 8`,
`hardwareConcurrency ≥ 4`) a prvá návšteva (prológ, `pro`). Na iPhone je `world` pravdepodobné, ale
`hardwareConcurrency` WebKit orezáva – **treba zmerať** (`BS30_FILM.state.on` a trieda na `<html>` na skutočnom iPhone).
Zálohy okolia sa sťahujú, aj keď film beží: `display: none` majú len karty mimo `is-near`
(`style.css:1113–1115`), `is-near` je v D1 karta −1…+2 (`app.js:222`), v BALÍKu ±1 (BALÍK `app.js:297`).

| Scenár | Text + písma (gzip) | Obrázky | Spolu | Rozbaliť (MP) | Súbory nad 1,5 MP |
|---|---|---|---|---|---|
| D1, film | 377 kB (z toho three.js 170 kB) | 958 kB / 6 súb. | **1,30 MB** | 12,8 (+3,7 druhé rozbalenie fasády v `<img>`) | 3 (vstup‑m, rohozka‑m 3,73; stol‑m 2,36) |
| D1, bez filmu | 211 kB | 618 kB / 3 | **0,81 MB** | 7,0 | 2 |
| BALÍK, film | 399 kB | 1 003 kB / 6 | **1,37 MB** | 12,3 | 3 (vstup‑m, rohozka‑m, sala‑m – všetky 3,73) |
| BALÍK, bez filmu | 226 kB | 628 kB / 2 | **0,83 MB** | 7,5 | 2 |

Zoznam obrázkov prvej obrazovky (výstup `rozpocet.py`):

- D1 film: `vstup-m-1448.avif` 319 kB 3,73 MP · `rohozka-m-1448.avif` 428 kB 3,73 MP · `stol-m-1448.avif` 151 kB 2,36 MP
  (záloha karty +2, film ju nepoužije, na telefóne kreslí sekvenciu) · `vstup-m-hlbka.webp` 7 kB 1,05 MP ·
  `rohozka-m-hlbka.webp` 13 kB 1,05 MP · `seq/vstup-dnu/f025.avif` 39 kB 0,92 MP (plagát susedného záberu).
- BALÍK film: rovnaké fotky, ale namiesto `stol-m` je `sala-m-1448.avif` 200 kB 3,73 MP (záloha karty +1, film ju
  na telefóne nepoužije) a hĺbky sú `*-m-hlbka-z.webp` 224 × 398 (0,09 MP, 5 a 11 kB) – to je zlepšenie.
- Text: `index.html` 14 kB, `style.css` 19/21 kB, `app.js` 15/17 kB, `vernost.js` 10 kB, `film.js` 38/40 kB,
  `three.module.min.js` **687 kB surových / 170 kB gzip** (preklad JS na telefóne – treba zmerať), 6 písem 128 kB.

## 4. (b) Celá stránka (prejdenie zhora dole)

| Scenár | Text + písma | Obrázky | Video | Spolu | Rozbaliť (MP, každý súbor raz) | Nad 1,5 MP |
|---|---|---|---|---|---|---|
| D1, film | 379 kB | 6 755 kB / 129 súb. | 4 507 kB | **11,37 MB** | **133** | 9 súb. / 29 MP |
| D1, bez filmu | 213 kB | 3 145 kB / 28 | 1 184 kB | **4,44 MB** | **39** | 9 / 29 MP |
| BALÍK, film | 400 kB | 7 341 kB / 130 | 4 507 kB | **11,96 MB** | **140** | 17 / 44 MP |
| BALÍK, bez filmu | 228 kB | 3 704 kB / 28 | 1 184 kB | **5,00 MB** | **51** | 17 / 44 MP |

Čo tvorí váhu s filmom (D1 aj BALÍK, súbory sú rovnaké):

| Položka | Dôkaz | Bajty | Pixely |
|---|---|---|---|
| `tim-slucka-864.mp4` (záber „sála ráno“ na telefóne, režim play) | `index.html:283`; celý súbor ako blob `film.js:576–584` (D1), `film.js:622` (BALÍK) | **3 321 kB** | 864 × 1536 = 1,33 MP na snímku, `VideoTexture` nahrá každú snímku |
| Sekvencie `vstup-dnu` 51 + `okolo-kresla` 44 snímok | `index.html:210,234`; `film.js:645–663` | **3 558 kB** AVIF | 95 × 0,92 = **87 MP**; pri návrate skrolom znova (v grafike najviac 6 / BALÍK 4 snímky, `film.js:639` / BALÍK `685`) |
| 6 fotiek filmu `*-m-1448` (vstup, rohozka, čakáreň, kreslo‑stred, káva, sud) | `film.js:425–431` | 1 857 kB | 6 × 2,7 – 3,73 MP ≈ 20 MP, každá **14,9 MB RGBA** v grafike, s mipmapami ≈ 19,9 MB |
| HTML zálohy stiahnuté popri filme, ktoré film na telefóne nekreslí | `stol-m` (sekvencia), `sala-rano-m` (video), BALÍK aj `sala-m` | D1 508 kB, BALÍK 708 kB | ďalších 6 – 10 MP, ak sa namaľujú |
| `tim-v-akcii-576.mp4` (tím, `<video preload="none">`) | `index.html:309–311`, hrá v okne `app.js:647` | 1 184 kB | 0,59 MP/snímka – primerané |
| Galéria | časť 2 | D1 262 kB / BALÍK 573 kB | D1 3,5 MP / BALÍK 11,2 MP |

## 5. Dekódovanie, pamäť a „neúplné“ fotky

Predpoklady na zmeranie (neoverené bez zariadenia):

- **P1 – AVIF je na iPhone drahší na rozbalenie než JPEG/WebP.** ImageIO rozbaľuje AVIF softvérovo; hardvérový AV1
  je len pre video a len na novších čipoch. Pre 3,73 MP AVIF čakám desiatky ms na snímku, pre 1,44 MP približne
  2,6× menej. JPEG (baseline 4 : 2 : 0) je na iOS najlacnejší, WebP medzi nimi. **Treba zmerať** (časť 8, M3).
- **P2 – `createImageBitmap(blob)` vo WebKite beží na hlavnom vlákne** (D1 `film.js:433–439`, `678`). Pri švihu cez
  sekvenciu sa rozbaľujú snímky 720 × 1280 jedna za druhou počas skrolu – priamy kandidát na „zasekané“.
  BALÍK to presúva do workera (`film-worker.js:18–26`: `createImageBitmap` → OffscreenCanvas 2D → `getImageData`
  → prenos RGBA 14,9 MB na fotku) a nahráva po pásoch 16 – 128 riadkov (BALÍK `film.js:499`); bez OffscreenCanvas 2D
  (iOS < 16.4) ostáva pôvodná cesta (BALÍK `film.js:446`).
- **P3 – nahratie `texSubImage2D` z `ImageBitmap` po pásoch** (D1 `film.js:466–492`, pás 256 riadkov s
  `UNPACK_SKIP_ROWS`): ak WebKit pri každom páse prevádza celý obrázok, 11 pásov = 11 × 3,73 MP prevodu.
  **Treba zmerať**; BALÍK sa tomu vyhýba nahrávaním z `ArrayBuffer`.
- **P4 – pamäť.** D1 drží okolo polohy 3 – 4 zábery (`film.js:758` `|pi − ci| ≤ 1` a `ci + 2·dir`), teda ≈ 60 – 80 MB
  textúr + hĺbky (D1 768 × 1366 = 4,2 MB a zjemnenie cez dva render‑targety) + 6 snímok sekvencie (3,7 MB každá)
  + rozbalené `<img>` zálohy. WKWebView v aplikácii Claude má prísnejší strop procesu; tlak pamäte vedie k strate
  WebGL kontextu (čierne okno) alebo zahodeniu rozbalených obrázkov (znovu rozbalenie pri návrate). **Treba zmerať.**

Kde vzniká „neúplná fotka“ (z kódu, zoradené podľa pravdepodobnosti):

1. **D1 zálohy sa ukazujú bez `decode()`.** D1 `app.js` nemá ani jedno `decode` (`grep -c decode` = 0); záloha karty sa
   prelína cez `--so` (`app.js:213–219`), hoci 3,73 MP AVIF môže byť ešte stiahnutý len sčasti alebo nerozbalený
   (`decoding="async"`). Výsledok: tmavá alebo napoly vykreslená plocha počas nábehu karty. BALÍK to rieši
   `decodeStill` (BALÍK `app.js:216–228`), ale len s poistkou 600 ms (`app.js:302–306`); po nej sa ukáže aj
   nerozbalená fotka s 32 px náhľadom pod ňou (`nahlady.css`), čo na telefóne vyzerá ako rozmazaná „neúplná“ fotka.
2. **Sekvencia sa prelína medzi vzdialenými snímkami.** Kým nie sú stiahnuté všetky, `seqDrive` prelína najbližšie
   stiahnuté (najprv každá 8., `film.js:645–648`), teda snímky 0,8 s od seba – dvojitý obraz.
3. **BALÍK náhľady 32 px vo filme** (`loadPreviews`, BALÍK `film.js:564`): kým ostrá 3,73 MP fotka nie je nahratá
   (21 – 161 pásov, `rozbor-film.md` 1.3), film kreslí rozmazaný náhľad. Čím väčšia fotka, tým dlhšie.

## 6. Rozpočet „pierko“ (telefón ≤ 720 px)

| Pravidlo | Hodnota | D1 dnes | BALÍK dnes |
|---|---|---|---|
| Prvá obrazovka, všetko (gzip) | **≤ 1 MB**, z toho fotky ≤ 250 kB | 1,30 MB / fotky 958 kB | 1,37 MB / 1 003 kB |
| Prvý obraz (fotka úvodu) | ≤ 120 kB, ≤ 1,5 MP, v HTML od prvého vykreslenia | 319 – 428 kB, 3,73 MP | to isté |
| Celá stránka s filmom | **≤ 6 MB** | 11,4 MB | 12,0 MB |
| Najväčší obrázok pre telefón | **≤ 1,5 MP** | 3,73 MP (9 súb. nad limit) | 3,73 MP (17 súb.) |
| Rozbalenie počas skrolu na hlavnom vlákne | **0** (worker alebo hotové pred skrolom) | áno (P2) | nie, ak je worker |
| Ukázanie obrázka | až po `decode()` / po celom nahratí textúry | nie | áno, s poistkou 600 ms |
| Textúry filmu v grafike naraz | ≤ 40 MB | ≈ 60 – 80 MB | ≈ 60 – 80 MB |
| Video na telefóne | ≤ 1,2 MB na klip, ≤ 0,6 MP na snímku | 3,32 MB, 1,33 MP | to isté |

## 7. Konkrétne zmeny

Všetky nové varianty sa vyrobia **z tých istých originálov a tých istých výrezov** (`source/photos/foto-*.jpg` cez
`source/tools/film.py`, ten istý stred záujmu `data-fm`; videá z `source/video/video-*.mp4` cez `videa.sh` a
`sekvencie.sh`). Žiadny nový ani upravený záber, žiadne tónovanie. Desktop (`min-width > 720px`) sa nemení.

### 7.1 Nové varianty (rozmery)

| Variant | Rozmer | MP | Odhad bajtov | Nahrádza na telefóne |
|---|---|---|---|---|
| `<meno>-m-900.avif` + `.jpg` (+ `.webp` záloha) pre vstup, rohozka, sala, stol, čakáreň, sála‑ráno, kreslo‑stred, káva, sud | **900 × 1600** (ten istý výrez 9 : 16) | 1,44 | AVIF ≈ 73 – 145 kB (spolu ≈ 914 kB za 9 záberov; odhad = `-m-1086` × 0,687) | `-m-1448` (3,73 MP) aj `-m-1086` (2,10 MP) |
| `<meno>-m-720.avif/.jpg` (voliteľne, šetrenie dát) | 720 × 1280 | 0,92 | ≈ 50 – 95 kB | pri `saveData` / pomalej sieti |
| `<meno>-m-hlbka-z.webp` | 224 × 398 (už v BALÍKu) | 0,09 | 5 – 12 kB | D1 `-m-hlbka.webp` 768 × 1366 |
| Sekvencie `seq/<meno>/fNNN` | **576 × 1024** (natívne z `video-3.mp4`, bez zväčšenia, CAS ostáva) | 0,59 | ≈ 2,3 MB AVIF spolu (odhad × 0,64) | 720 × 1280 (zväčšené lanczos, `sekvencie.sh:12`) |
| `tim-slucka-576.mp4` (H.264, ako `tim-v-akcii-576`) | **576 × 1024** | 0,59 | ≈ 1,0 – 1,3 MB | `tim-slucka-864.mp4` 3,32 MB (zväčšený zo 576, `videa.sh:10–13`) |
| Plagát `tim-slucka-poster-576.avif` | 576 × 1024 | 0,59 | ≈ 20 kB | 864 × 1536 |
| Galéria telefón `<meno>-p-800.avif` | **800 × 1000** (výrez 4 : 5 podľa `--focal`) | 0,80 | ≈ 40 – 60 kB | BALÍK 1600 (1,6 – 1,71 MP), D1 nožnice 1600 |

Ostrosť: 900 px dáva pri zálohe bez filmu hustotu 1,9× (1 425 px displeja), vo filme 0,74 texelu na pixel (1 224 px
pri DPR 2). Je to vedomý ústupok oproti rozhodnutiu „1448 kvôli ostrosti“ (`PLAN.md:244`, ZADANIE bod 4); preto
porovnať `source/tools/ostrost.py` 900 vs 1448 na snímkach 390 × 844 a ak majiteľ uvidí rozdiel, ísť na 1086 len pre
prvý obraz (2,1 MP, s `FIRST_Q` 122 kB). Sekvencie a video stratia len umelé zväčšenie – detail v zdroji nie je.

### 7.2 Výber a `sizes` (index.html, stills.py, hlavička)

1. Telefónny `<source media="(max-width: 720px)">` dostane **jediného kandidáta** na formát
   (`srcset="assets/img/film/<meno>-m-900.avif 900w" sizes="100vw"`), takže výber nezávisí od DPR ani od algoritmu
   prehliadača. Rovnako `imagesrcset` predbežného načítania v hlavičke (`index.html:17–21`, slovník `S`/`W`).
2. `stills.py:17–19`: opraviť komentár a výpočet (93vw nedáva 1086 pri šírke ≥ 390 px).
3. Galéria (BALÍK): pridať `<source media="(max-width: 640px)">` s `-p-800` (jediný kandidát); D1 nožnice rovnako.
4. BALÍK „Poď ďalej“ (`index.html:204`): vrátiť telefónnu zálohu na snímku sekvencie (`f025`, po zmene 576 × 1024),
   lebo film na telefóne kreslí sekvenciu – dnes sa sťahuje 200 kB `sala-m-1448`, ktorý sa nikdy neukáže.

### 7.3 Formát podľa ceny rozbalenia

- Fotky filmu a snímky sekvencie (rozbaľujú sa počas skrolu): ak M3 potvrdí AVIF ≥ 2× pomalší než JPEG, dávať
  telefónu **JPEG** (mozjpeg, q ≈ 80, 4 : 2 : 0, baseline, nie progresívny) – bajtov pribudne ≈ 1,6 – 2×, ale pri
  1,44 MP a 0,59 MP sa rozpočet 6 MB stále drží. Film volí príponu sám (`film.js:500–506`), stačí poradie
  `.jpg` → `.avif` pre `phone`.
- Zálohy v HTML (rozbaľujú sa raz a vopred cez `decode()`): AVIF môže ostať.

### 7.4 Nič neúplné, nič rozbalené počas skrolu

1. **D1 `app.js`**: prevziať z BALÍKa `decodeStill` (BALÍK `app.js:214–233`): kartu ukázať (`--so > 0`) až po
   `img.decode()`; do vtedy držať predošlú, hotovú fotku (bez časovej poistky, keď predošlá existuje; poistka len pre
   prvý obraz).
2. **Film**: textúru záberu zapnúť až po poslednom páse (D1 to robí, `film.js:520–526`); náhľad 32 px nepoužívať na
   celé okno (BALÍK) – radšej držať posledný hotový záber. S 1,44 MP fotkou je nahratie ≈ 2,6× kratšie.
3. **Rozbalenie mimo hlavného vlákna**: ponechať worker z BALÍKa (`film-worker.js`), pre sekvencie rozbaľovať
   vopred okolie ±8 snímok **pred** vstupom do scény, nie počas švihu; pri rýchlosti > 1 obrazovka/s kresliť len
   hrubé snímky a jemné doťahovať až v pokoji (patrí do `film.js`, nadväzuje na `rozbor-film.md`).
4. **Zálohy pri bežiacom filme nesťahovať**: pri `html.world-in` dávať `is-near` len karte, ktorú film práve
   nemá hotovú (alebo žiadnej); zálohy pre `stol`, `sala`, `sala-rano` na telefóne vôbec (film kreslí sekvenciu
   a video). Úspora D1 ≈ 0,5 MB, BALÍK ≈ 0,7 MB a 6 – 10 MP.

### 7.5 Poradie načítania podľa polohy

1. Hneď: HTML, CSS, písma prvej obrazovky, **jedna** fotka úvodu `-m-900` (`fetchpriority="high"`).
2. Po prvom vykreslení (`requestIdleCallback`/`load`): `film.js` + three.js; prvý záber filmu = ten istý súbor
   z cache.
3. Po prvom pohybe: sused v smere skrolu (jedna fotka + hĺbka); sekvencia až keď je jej scéna do 1 obrazovky.
4. Video `tim-slucka-576` až pri vstupe do scény (dnes celý blob, `film.js:576`); `tim-v-akcii` ponechať `preload="none"`.
5. Galéria a tím `loading="lazy"` (už je), lightbox 1600 len po ťuknutí (už je).

### 7.6 Odhad po zmenách (telefón, film zapnutý)

| | Dnes D1 / BALÍK | Po zmenách (odhad) |
|---|---|---|
| Prvá obrazovka | 1,30 / 1,37 MB; 12,8 / 12,3 MP | ≈ 0,55 – 0,65 MB (text 377 kB + vstup‑m‑900 ≈ 73 kB + rohozka‑m‑900 ≈ 84 kB + hĺbky); ≈ 3,0 MP |
| Celá stránka | 11,4 / 12,0 MB; 133 / 140 MP | ≈ 5,3 – 5,8 MB (fotky ≈ 0,9 MB, sekvencie ≈ 2,3 MB, videá ≈ 2,3 MB, galéria + tím ≈ 0,7 MB); ≈ 70 MP |
| Najväčší obrázok | 3,73 MP | 1,44 MP |
| Textúra záberu | 14,9 MB (+ mipmapy) | 5,8 MB (+ mipmapy 7,7 MB) |

## 8. Treba zmerať (presne)

- **M1 – výber súborov v skutočnom Safari.** iPhone cez kábel → Safari na Macu → Vývoj → zariadenie →
  konzola: `[...document.images].map(i => [i.currentSrc, i.naturalWidth, i.complete])` a záložka Sieť (stĺpec
  Prenesené) pri prvom otvorení a po prejdení stránky. Potvrdiť 1448 vs 1086 a prenesené bajty z tabuliek 3 a 4.
- **M2 – Chromium, telefón 390 × 844 DPR 3, CPU 4× a 6×, sieť Fast 4G a Slow 4G**, `?uvod=znova` aj `?film=off`:
  trace s kategóriami `devtools.timeline, disabled-by-default-devtools.timeline, blink, cc, gpu,
  disabled-by-default-devtools.timeline.frame`; vyhodnotiť dlhé snímky (> 16,7 ms a > 50 ms), udalosti
  `ImageDecodeTask` / `Decode Image` (vlákno, trvanie, rozmer), `GPUTask`, `texSubImage2D` v JS profile. Pozor:
  Chromium rozbaľuje mimo hlavného vlákna a môže vybrať 1086 – preto výsledok slúži na porovnanie D1/BALÍK/po zmene,
  nie ako dôkaz správania Safari.
- **M3 – cena rozbalenia na iPhone.** Testovacia stránka (súkromný náhľad, nie server) s tou istou fotkou v AVIF, WebP
  a JPEG v rozmeroch 1448 × 2575, 1086 × 1931, 900 × 1600, 576 × 1024: čas `img.decode()` a `createImageBitmap(blob)`
  na hlavnom vlákne a vo workeri, 10 opakovaní, medián; zároveň `performance.now()` medzery v `requestAnimationFrame`
  (blokovanie hlavného vlákna). Výsledok rozhodne 7.3.
- **M4 – nahratie textúry.** Na iPhone `BS30_FILM.dbg` / BALÍK `uploads` (`maxMs`, `strips`) pri 1448 a 900;
  D1 pás 256 riadkov z `ImageBitmap`: čas jedného `texSubImage2D` (overiť P3).
- **M5 – pamäť a strata kontextu.** Safari Web Inspector → Timelines → Memory pri prejdení stránky tam a späť 3×;
  počet `webglcontextlost` (BALÍK `film-strata`), v aplikácii Claude aj v Safari.
- **M6 – `world` na iPhone.** `navigator.hardwareConcurrency`, trieda `world`/`world-off` a `BS30_FILM.state` na
  majiteľovom iPhone (ovplyvní, či platia stĺpce „film“ alebo „bez filmu“).
- **M7 – vizuálne porovnanie ostrosti** 900 vs 1448 (zálohy aj film) a sekvencií 576 vs 720 nástrojom
  `source/tools/ostrost.py` na snímkach 390 × 844 DPR 3; schválenie majiteľom.

## 9. Mimo oblasti, ale súvisí

- Fotka ulice pod pätičkou (snímka `majitel-iphone-paticka.png`) je posledný záber `vstup` (fasáda na Mostnej) –
  pevná záloha / plátno s výškou `100lvh` (`style.css:413–418`, `1105–1107`) presahuje pätičku; sťahuje sa
  `vstup-m-1448.avif` 319 kB len na pás pod pätičkou. Rieši rozbor stránky (`rozbor-stranka.md`).
- three.js 687 kB surových (170 kB gzip) – vlastný zostavený výber modulov by zmenšil preklad JS; treba zmerať.
