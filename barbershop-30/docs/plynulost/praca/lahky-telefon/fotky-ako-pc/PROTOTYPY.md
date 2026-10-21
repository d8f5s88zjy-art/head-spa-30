# Prototypy „fotky ako na PC“ – ľahký telefón, ?foto=A|B|C

Požiadavka majiteľa (21. 10. 2026, iPhone): „Chcem, aby tie fotky bolo vidno tak dobre ako na PC.“
Dnes (A) telefón ukazuje z fotky na šírku len stredný pás: 30,8 % šírky scény (Pracovné miesto 17,3 %), počítač
93,7 % (fakty/raw/tabulky.md). Prototypy ukazujú tie isté súbory inak. Žiadny nový ani upravený záber a žiadna AI
úprava, žiadne WebGL. Pohyb ide len cez transform a opacity.

## Kde to je a ako to pustiť

- Kópia: `fotky-ako-pc/proto/barbershop-30/` (git archive vetvy `barbershop-lahky-telefon`, HEAD 3346f80). Pôvodne
  bola rozbalená z f1f9c4d. `app.js` a `source/tools/app-smoke.mjs` som zosúladil s HEAD (cmp: od HEAD sa líši už len
  `index.html`). Strom `hs-lahky` som len čítal.
- Zmeny v kópii:
  - `index.html`, 4 miesta:
    - hlavičkový skript pridá pri `lite` triedu `foto-b`/`foto-c` podľa `?foto=`;
    - predbežné načítanie úvodu berie pri B/C fotku na šírku (`imagesizes` 100vw / 160vh);
    - `<link>` na `foto-proto.css` + `<script>` `foto-proto.js`;
    - `fotoFix()` sa volá na šablónu úvodu a na koniec tela pred `app.js`.
  - nový `assets/foto-proto.css` (58 riadkov),
  - nový `assets/foto-proto.js` (79 riadkov, z toho 73 kód; väčšinu tvorí kreslenie rozmazaného pozadia pre B).
- Prepínanie: `?foto=A` (dnešný stav, skript nič nemení), `?foto=B`, `?foto=B&rozmaz=css`, `?foto=C`,
  `?foto=C&c=2172` (C bez dlaždíc 2896/4096). Platí len pri `lite` (telefón). Počítač nedostane nič.
- Nástroje: `fotky-ako-pc/nastroje/snimky.mjs` (snímky + ostrosť), `cena.mjs` (bajty, MP, CPU 4×, stopa),
  `zostav.py` (prehľadné JPEG). Surové údaje: `raw/udaje-390x844.json`, `raw430/udaje-430x932.json`,
  `raw/cena/cena.json`, `raw/cena-bcss2/cena.json` (B-css po oprave will-change).

## Ako fungujú

**A – dnes.** Výrez `<meno>-m-1448.avif` na výšku cez celé okno, cover, priblíženie 1 → 1,06 zo skrolu (`--sp`, app.js).

**B – celá fotka ako na PC.**
- `fotoFix()` odstráni telefónny `<source media="(max-width: 720px)">` (výrez -m) a dá `sizes="100vw"`.
  Prehliadač potom vezme `<meno>-1448.avif` (1448×965) na celú šírku displeja.
- Fotka stojí v strede pásu medzi lištou a textom karty: 390×260 CSS px, horný okraj 145 px. Pri 430×932 je to
  430×287 a horný okraj 157 px. Text karty začína na 541 px, takže fotku neprekrýva.
- Pozadie nad a pod fotkou tvorí tá istá fotka zväčšená, rozmazaná a stmavená.
  - Predvolene: plátno 36×78 px, raz po `img.decode()`, `ctx.filter = blur(1.2px)` a zapečené stmavenie 52 %.
    CSS ho len bilineárne zväčší. Žiadny `filter` pri kreslení, žiadna animácia, žiadny ďalší súbor:
    použije sa už stiahnutá `-1448`, takže pozadie stojí 0 B navyše.
  - Variant `&rozmaz=css`: druhý `<img>` s tým istým súborom (rovnaké `currentSrc`, z cache) a
    `filter: blur(22px) brightness(0.48)` na statickej vrstve. Je tu len na porovnanie ceny.
- Zadanie navrhovalo malý súbor `<meno>-1086` s CSS blur. Plátno z už dekódovanej `-1448` vychádza lacnejšie
  v bajtoch (0 B) aj v kreslení (pozri nižšie).

**C – prejazd kamery.**
- Tiež bez -m. Fotka na šírku má výšku `100lvh` a šírku `100lvh × pomer` (390×844: 1266×844 CSS px).
  `object-fit: fill`: rámik má presne pomer fotky, nič sa neoreže.
- Na zobrazenej karte (`is-shown` z app.js) beží CSS animácia
  `translate3d(0) → translate3d(100vw − 100 %)`, 18 s, `cubic-bezier(0.45,0,0.55,1)`, `infinite alternate`.
  `will-change: transform` má len táto karta: zmerané `willChange = ['cakaren:foto-main']`, animácie
  `['cakaren:foto-prejazd']`.
- `prefers-reduced-motion`: bez animácie, statická poloha podľa bodu záujmu `--fxn` (stred).
  Overené: `anims 0`, `tx −437,9 px` = (390 − 1266) / 2, `will-change: auto` (snímka `C-reduced-motion-390x844.jpg`).

**Prečo časový prejazd, nie viazaný na skrol:**
1. Časová CSS animácia transformu beží v skladači (compositor) bez hlavného vlákna.
   - Stopa pri CPU 4×: všetkých 481 z 481 snímok za 8 s má `has_compositor_animation: true` a stav
     `STATE_PRESENTED_ALL`, 0 zahodených.
   - `compositeFailed` = 0 (animácia sa nevrátila na hlavné vlákno).
2. Prejazd zo skrolu by potreboval JS pri každom posune (hlavné vlákno), alebo CSS `view-timeline`. Ten Safari
   podporuje až od verzie 26, staršie iPhony by ostali bez pohybu.
3. Bežná karta má na skrol len asi jednu výšku okna. Švihnutím by prejazd preletel za zlomok sekundy a pri
   zastavení prsta by stál, takže celú scénu by majiteľ nevidel.

## Snímky (proto/snimky/, všetky JPEG ≤ 600 kB)

| súbor | čo ukazuje |
|---|---|
| `prehlad-390x844.jpg`, `prehlad-430x932.jpg` | riadky Čakáreň / Hlavná sála / Pracovné miesto, stĺpce A, B, C (stred prejazdu), PC 1440×900 `?film=off` |
| `A-390x844.jpg`, `A-430x932.jpg` | A, tri karty |
| `B-390x844.jpg`, `B-430x932.jpg` | B s plátnom |
| `B-css-390x844.jpg`, `B-css-430x932.jpg` | B s CSS blur (vzhľad takmer rovnaký) |
| `C-390x844.jpg`, `C-430x932.jpg` | C, každá karta v čase 0 s, 9 s a 18 s (posun 0 / −438 / −876 px pri 390) |
| `C-reduced-motion-390x844.jpg` | C pri `prefers-reduced-motion` (statický stred) |
| `PC-1440x900.jpg` | referencia počítač `?film=off` |

Snímky: Chromium 1194 headless, isMobile, hasTouch, DPR 3, tmavá schéma, sk-SK. Karta je odskrolovaná do polovice
a snímka sa robí po `img.complete`, opacity zálohy aj textu 1 a 700 ms pokoja.

## Ostrosť (px fotky na CSS px, z `naturalWidth` skutočne stiahnutého súboru a rozmeru rámika)

„na fyz. px“ = px súboru na 1 fyzický px displeja (DPR 3). 1,0 = displej dostane presne toľko pixelov, koľko
zobrazí. „mierka scény“ = fyzické px displeja na 1 px originálu 4096 (koľko detailu scény vidno).

| možnosť | súbor (390) | px/CSS 390 | na fyz. px 390 | px/CSS 430 | na fyz. px 430 | mierka scény 390 | zo šírky scény vidno |
|---|---|---|---|---|---|---|---|
| A | `-m-1448` 1448×2575 (stol 1152×2048) | 3,05 (stol 2,43); s priblížením 2,88 | 1,02 (0,81) | 2,76 (stol 2,20) | 0,92 (0,73) | 0,93 | 30,8 % (stol 17,3 %) |
| B | `-1448` 1448×965 | 3,71 | 1,24 | 3,36 | 1,12 | 0,29 | 100 % naraz, fotka zaberá 30,8 % plochy okna |
| C | `-2896` 2896×1931 | 2,29 | 0,76 | 2,07 | 0,69 | 0,93 | 30,8 % naraz, 100 % za 18 s |
| C `&c=2172` | `-2172` 2172×1448 | 1,72 | 0,57 | 1,55 | 0,52 | 0,93 | ako C |
| PC 1440×900 DPR 1 | `-2172` | 1,51 (1,42 s priblížením) | 1,42 | – | – | 0,37 | 93,7 % |
| PC 1440×900 DPR 2 | `-2896` | 2,01 | 1,00 | – | – | 0,75 | 93,7 % |

Čítanie tabuľky:
- B je najostrejší na pixel (1,24 súborových px na fyzický px), ale scénu ukazuje v mierke 0,29. Celá miestnosť
  má na iPhone šírku asi 6,5 cm (1170 fyz. px pri ~460 ppi). Detaily ako nápis Route 66 sú malé (pozri
  `B-390x844.jpg`).
- C ukazuje scénu v rovnakej mierke ako A (0,93), teda veľkú, ale z menšieho súboru na fyzický px: 0,76 oproti 1,02.
  Lineárne je to o 25 % mäkšie ako A a pri `c=2172` o 44 % mäkšie.
- Na 430 px (majiteľov iPhone, V7) je C 0,69 a C 2172 len 0,52. Na „tak dobre ako na PC“ to je hranica. Ostrý C
  by potreboval dlaždicu 4096 (1,08 na fyz. px). Tú majú dnes len pri vstupe a stojí 11,2 MP (nižšie).

## Cena

### Bajty a dekódované MP pre celú stránku

Telefón 390×844 DPR 3, prázdna cache, celá stránka (16 357 px) prejdená po 422 px každých 260 ms. Bajty sú
`encodedDataLength` z CDP Network, MP z `naturalWidth × naturalHeight` každého stiahnutého súboru.

| možnosť | súbory fotiek | bajty fotiek (img/film) | všetky obrázky | celá stránka | dekódované MP spolu | MP na kartu (RGBA) |
|---|---|---|---|---|---|---|
| A | 9× `-m-1448` | 2 753 498 B | 3 077 978 B | 3 487 169 B | 31,1 MP | 3,73 MP = 14,9 MB (stol 2,36) |
| B | 9× `-1448` | **991 129 B** | 1 315 609 B | **1 724 800 B** | **12,5 MP** | **1,40 MP = 5,6 MB** + plátno 36×78 (0,003 MP) |
| B `rozmaz=css` | 9× `-1448` | 991 129 B | 1 315 609 B | 1 725 115 B | 12,5 MP | 1,40 MP; rozmazaná vrstva navyše 390×844×9 = 2,96 MP dlaždíc |
| C | 7× `-2896`, `rohozka-2172`, **`vstup-4096`** | 3 679 664 B | 4 004 144 B | 4 413 335 B | 52,6 MP | 5,59 MP = 22,4 MB; **vstup 11,19 MP = 44,8 MB** |
| C `c=2172` | 9× `-2172` | 1 957 957 B | 2 282 437 B | 2 691 628 B | 27,5 MP | 3,15 MP = 12,6 MB |

- B je o 64 % ľahší na fotkách než dnešný A (991 129 oproti 2 753 498 B). Fotka na šírku 1448 má 101 708 B,
  výrez `cakaren-m-1448` 330 151 B.
- C pri 390×844 DPR 3 pýta 3798 fyz. px šírky, preto srcset siahne po 2896 a pri vstupe po 4096. Vstup tak má
  11,19 MP (44,8 MB po rozbalení) na jednej karte, čo je pri iOS Safari riziko pamäte. Pre C treba strop 2896.

### CPU 4× (CDP `Emulation.setCPUThrottlingRate` 4), karta Čakáreň

Postup: 8 s pokoj (pri C beží prejazd), potom 3 s plynulý programový skrol o 0,6 výšky okna.
- V stránke: intervaly rAF a `long-animation-frame`.
- V stope: `DrawFrame`, `DroppedFrame`, `PipelineReporter` (stav snímky, `has_compositor_animation`), `Paint`,
  `RasterTask`, `ImageDecodeTask`.
- Spomalenie CPU dopadá len na hlavné vlákno rendereru, nie na skladač ani raster.

| možnosť | fáza | /proc/loadavg (1 min) pred → po | snímky nakreslené / zahodené | LoAF > 50 ms | rAF p95 / max | Paint n / ms | RasterTask n / ms |
|---|---|---|---|---|---|---|---|
| A | pokoj 8 s | 3,82 → 3,92 | 40 / 39 (443× „bez zmeny“) | 0 | 16,8 / 16,8 | 0 | 1 / 0,7 |
| A | skrol 3 s | 3,92 → 3,84 | 179 / 4 | 0 | 16,8 / 33,3 | 59 / 32,0 | 80 / 83,1 |
| B | pokoj | 3,11 → 2,94 | 41 / 41 (439× „bez zmeny“) | 1 (64 ms) | 16,7 / 50,0 | 2 / 1,8 | 2 / 1,0 |
| B | skrol | 2,94 → 2,95 | **181 / 1** | 0 | 16,8 / 16,8 | 67 / 38,4 | **39 / 47,9** |
| B css (vrstva s will-change) | skrol | 2,18 → 2,09 | 159 / **23** | 0 | **33,4** / 50,0 | 62 / 28,1 | 48 / 56,2 |
| B css (bez vrstvy, po oprave) | skrol | 3,85 → 4,42 | 173 / **16** | **2 (max 81)** | 16,8 / 83,4 | 64 / 32,0 | **112 / 598,4** |
| C | pokoj (prejazd) | 1,70 → 1,67 | **481 / 0**, všetky so skladačovou animáciou | 0 | 16,8 / 16,8 | 0 | 9 / 5,6 |
| C | skrol | 1,67 → 1,67 | 200 / 2 | 0 | 16,8 / 33,3 | 63 / 30,0 | 71 / 56,5 (+ decode 9,9 ms) |
| C `c=2172` | pokoj | 1,88 → 1,83 | 480 / 2 | 1 (63 ms) | 16,8 / 50,1 | 0 | 19 / 6,0 |
| C `c=2172` | skrol | 1,83 → 2,32 | 201 / 3 | 0 | 16,8 / 33,3 | 59 / 24,0 | 92 / 75,5 |

Stroj má 4 jadrá. `loadavg` pri štarte merania bol 4,78 (2026-10-21 11:10 UTC) a počas behu 1,67–4,42, lebo ho
vyťažujú iné tímy. Jednotlivé zahodené snímky a jedno LoAF okolo 63 ms sú preto na hranici šumu.

Čo z toho plynie:
- **B s plátnom je pri skrole najlacnejší:** 1 zahodená snímka, raster 47,9 ms oproti 83,1 ms pri A. Pozadie
  z plátna sa po prvom vykreslení nekreslí znova (v pokoji 2 Paint spolu 1,8 ms).
- **CSS blur je drahý v oboch podobách.**
  - Ako vlastná vrstva (pôvodne ju omylom dostala cez `style.css:475` `will-change: transform` pre A): 23
    zahodených snímok, rAF p95 33,4 ms.
  - Bez vrstvy (opravené v `foto-proto.css` vyššou špecifickosťou): raster 112 úloh a 598 ms, 16 zahodených
    snímok, 2 LoAF (81 ms).
  - Plátno je preto správna voľba, filter na celoobrazovkovej vrstve nie.
- **C prejazd je v pokoji úplne v skladači:** 481/481 snímok za 8 s, 0 zahodených, 0 LoAF, hlavné vlákno nerobí
  nič navyše (Paint 0).
  - Cena je v pamäti a bajtoch, nie v snímkach. Pri skrole 2 zahodené z 200.
  - Pri iOS Safari to treba overiť na zariadení: v Chromiu skladač CPU throttling neobmedzuje a WebKit má na
    textúry iné limity. Dlaždica 4096 pri vstupe je tu hlavné riziko.
- „Pokojové“ zahodené snímky pri A a B (39–41) sú v stope označené pri snímkach, kde sa nič nemenilo (440×
  `STATE_NO_UPDATE_DESIRED`). Sú rovnaké v A aj B, ide o základ stránky, nie o novú možnosť.

## Riziká a otvorené body

- **B:**
  - Fotka zaberá 30,8 % plochy okna (390×260 z 390×844), zvyšok je rozmazaný okraj. Je to „celá fotka ako na PC“,
    ale malá: mierka scény 0,29 oproti 0,37 na PC DPR 1. Fyzicky je to iPhone, nie monitor.
  - Plátno sa kreslí raz podľa rozmeru okna. Pri otočení telefónu sa v prototype neprekreslí.
  - `ctx.filter` nemusí staršie Safari poznať. Zväčšenie 36 px → 390 px rozmaže obraz aj bez neho.
- **C:**
  - Pri 390 je mäkší (0,76 px na fyz. px) a pri 430 ešte viac (0,69). Najdrahší v bajtoch (3,68 MB fotiek)
    aj v pamäti (vstup 44,8 MB).
  - Začiatok a koniec prejazdu môže padnúť na okraj s rozmazaným popredím (Hlavná sála 0 s: kožené kreslo cez
    pol okna, `C-390x844.jpg`). Lepšie by bolo obmedziť prejazd okolo bodu záujmu (napr. 15–85 % šírky) namiesto
    celých 0–100 %.
  - Neustály pohyb (18 s tam a späť) nemusí každý chcieť. `prefers-reduced-motion` je ošetrené.
- **WebKit:** všetko je merané v Chromiu. Výber kandidáta zo srcset aj cena vrstiev sa v Safari môžu líšiť (M1 v SPEC).
  Konečné slovo má pohľad majiteľa na jeho iPhone 430×932.
- **Prototyp nie je hotová zmena:** `?foto=` je ladiaci prepínač, kód je v samostatných súboroch kópie.
  `app-smoke.mjs` som na kópii nespúšťal.

## Odporúčanie

1. **B (plátno) ako odpoveď na „vidno tak dobre ako na PC“.**
   - Ukazuje 100 % scény ako počítač (93,7 %) pri najvyššej ostrosti na pixel (1,24 / 1,12 na fyz. px).
   - Je najľahší: fotky 0,99 MB namiesto 2,75 MB, 1,40 MP na kartu namiesto 3,73.
   - Pri skrole pri CPU 4× bol najplynulejší (1 zahodená snímka z 182).
   - Tým plní aj „ľahký ako pierko, plynulý ako potôčik“.
2. **C len ako voliteľný „filmový“ variant pre majiteľa na porovnanie**, a len so stropom 2896 (bez `vstup-4096`)
   a s prejazdom obmedzeným okolo bodu záujmu. Pohyb je plynulý (0 zahodených v pokoji), ale fotky sú mäkšie
   a stránka je 2,1× ťažšia na fotkách ako B.
3. Majiteľovi poslať `prehlad-430x932.jpg` (jeho rozmer) a odkaz na kópiu s `?foto=B` / `?foto=C`, nech si vyberie
   pohľadom na iPhone.

Servery (port 8684) a prehliadač po meraní ukončené (`curl 127.0.0.1:8684` → spojenie zatvorené, žiadny proces
chromium-1194).
