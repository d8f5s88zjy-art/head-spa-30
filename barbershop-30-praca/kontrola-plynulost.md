# BARBERSHOP 30 – kontrola plynulosti a filmu (nezávislý kontrolór, 4. 11. 2026)

Kontrolované: strom `scratchpad/hs-skvrny`, **pred = 791fb3db**, **po = HEAD 2179170f** (22 lokálnych commitov zo
`zlepsenia.md`). V strome som nič nemenil; všetky nástroje, logy a snímky sú v `barber/senior/kp/`
(nové merania `mer2/`, `film2/`, logy `log2/`, nástroje `nastroje/`). Pokračovanie po limite: čiastkové výstupy
predchodcu (`mer/`, `film/`, `log/`) som prečítal a použil; jeho meranie načítania bežalo pri záťaži 25 na 4 jadrách
(`log/nacitanie.out`, stĺpec záťaž), preto som ho zopakoval pri nižšej záťaži.

## Verdikt v skratke

| oblasť | výsledok | stav |
|---|---|---|
| Film snímku po snímke (čierne / zelené diery / alfa) | čierna 0 % vo všetkých 27 + 27 strihoch telefónu, 5 + 5 strihoch počítača, 11 + 11 snímkach prológu; záznam obrazovky 0 čiernych snímok | v poriadku |
| Strih sála → stôl (počítač) | najväčšia tmavá plocha 29,83 % → **9,48 %** (m50), 29,83 % → 5,5 % (m30) | zlepšené |
| Zmena okna / otočenie počas filmu | 36 zmien okna a 4 otočenia: prvá snímka po zmene má obraz, záblesky 0 (pred aj po) | v poriadku; automatická zmena rozlíšenia sa v kontajneri nevyvolala |
| Načítanie úvodu (LCP, CLS) | FCP/LCP v rámci šumu (±150 ms); CLS nad 0,01 na telefóne pred 1 zo 49, po 2 zo 49 behov – vždy 0,0292 z toho istého `::before`, ktorý je aj v pred | bez zhoršenia |
| Načítanie rezervácie | LCP telefón 4G 2444 → 1184 ms, Slow 4G 6268 → 4860 ms | zlepšené |
| **Skrol celou stránkou bez filmu (telefón aj počítač)** | snímky nad 50 ms telefón medián 25,5 → **40**, nad 34 ms 62 → **108**; počítač nad 50 ms 16–18 → **24–31** | **ZHORŠENÉ – príčina: pás kapitol (A/B dôkaz)** |
| INP (bez filmu) | telefón najhoršia interakcia 240 / 176 → 464 / 256 ms (jeden odľahlý ťuk), počítač 168 / 96 → 96 / 72 ms | bez jasnej zmeny |
| Pamäť (JS heap po skrole) | telefón bez filmu 1,6–1,9 → 2,3–2,4 MB, s filmom 4,5 → 5,4–5,8 MB | mierne viac (nový kód) |
| Bajty | zdroj: +12,6 kB gzip JS/CSS; nasadené (zmensi.mjs): style.css 25 616 → 15 525 B gzip | nasadené menšie |

**Pravidlo „nič sa nesmie zhoršiť“ nie je splnené v jednom bode: plynulosť skrolu bez filmu.** To je predvolený stav
telefónu (film sa na telefóne bez `?film=on` nezapína, trieda `world-off`, `log2/beh3.out` riadky „konzola“).
Návrh opravy a postup overenia je v časti 4. Všetko ostatné sa nezhoršilo alebo zlepšilo.

## 1. Podmienky merania (aby sa čísla dali čítať)

- Chromium 153.0.8010.12 (Playwright), grafika SwiftShader (softvérová) – absolútne fps filmu sú preto nízke
  (telefón s filmom 4,8–7 fps, počítač s filmom 2,3–2,7 fps, `mer2/kpSkrol.log`); porovnávam **pred proti po v tom
  istom behu**, striedavo (b1 pred→po, b2 po→pred).
- Telefón: 390×844, DPR 3, dotyk, CPU 4× (CDP), siete DevTools „Fast 4G“ (RTT 165 ms, 9 Mb/s × 0,9) a „Slow 4G“
  (RTT 562,5 ms, 1,6 Mb/s × 0,9). Počítač: 1440×900, DPR 1, bez spomalenia.
- Súbežne bežal iný audit; záťaž je pri každom behu v logu (`záťaž`). Väčšina nových meraní 3–10, predchodcove 25.
- Servery: `python3 -I -m http.server` (9170 = kópia 791fb3db, 9171 = strom HEAD). Python neposiela gzip, preto
  doplnková séria s gzip ako na hostingu: `nastroje/srv-gz.cjs` (9170/9175 = pred, 9171/9176 = HEAD + nasadené
  súbory z `nasad/po` po `zmensi.mjs`, 9177 = HEAD zdroj s gzip).
- Kópie overené: `git archive 791fb3db|HEAD barbershop-30 asistent` a `diff -rq` voči `kp/pred` a `kp/po` → líšia sa
  len priečinky `docs`, `source/photos`, `source/video`, `source/web-povodny`, ktoré sa neservírujú
  (`/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/tasks/b41teramn.output`).
- Chyba konzoly `TypeError: Failed to execute 'observe' on 'MutationObserver'` v logoch `kpInp`/`kpKino` je chyba
  **meracieho nástroja** (jeho init skript pozoruje `document.documentElement`, ktorý v tej chvíli ešte neexistuje),
  nie webu: `nastroje/konzola2.cjs` bez tohto skriptu → 0 chýb na pred aj po, telefón aj počítač, s ukážkou
  Barbera a objednávky (`mer2/konzola2.log`; jediné hlásenie je varovanie SwiftShaderu `KHR_parallel_shader_compile`
  pri `?film=on`, rovnaké pred aj po).

## 2. Film

### 2.1 Strihy telefónu (a5-film, variant safari: zelená = diera v obraze, purpurová = nenačítaný záber, čierna = 0,0,0)

`node nastroje/a5-film.mjs --mode=phone --variant=safari --passes=cuts --mixy=0.3,0.5,0.7 --root=<strom>`
(`log2/film-phone-cuts-pred.log`, `-po.log`, hárok `film2/phone-safari-po/harok-cuts.jpg` – otvorený):

- 9 strihov × 3 polohy = 27 snímok v každej verzii; **čierna 0 % vo všetkých 54**, alfa < 255 0 %.
- Pred a po sú prakticky totožné (rozdiel jasu L ≤ 1,3, najväčšej tmavej plochy ≤ 1,55 bodu) – na telefóne sa
  film nemenil (strih sála → stôl je na telefóne `m:prelinanie` v oboch verziách).
- Jediná značka: po `cut-kreslo-stred-kava-m50` zelená 0,022 % (okraj rozmazania pri švihu; v pred 0 %). Je to
  0,02 % pásu fotky v jednej polohe, závisí od presného času snímky; čierna tam 0 %.
- Pretrvávajúce (aj v pred): `kreslo-stred>kava m70` najväčšia tmavá plocha **20,87 % / 20,81 %** – tmavý rozmazaný
  vrch záberu pri švihu (na hárku 3. riadok, 5. snímka). Nie je to čierne pole (L 85, čierna 0 %), ale je to
  najtmavší strih telefónu – kandidát na rovnakú úpravu ako A11 (pozri časť 4).

### 2.2 Strih sála → stôl a prológ na počítači (predchodcove behy, `film/desk1440-safari-pred|po`)

| poloha | pred (popredie, cez operadlo) | po (pohyb) |
|---|---|---|
| m10 | L 58,4, tmavá plocha 6,27 % | L 59,5, 6,22 % |
| m30 | L 43,7, **29,83 %** | L 63,3, 5,5 % |
| m50 | L 48,2, **29,86 %** | L 68,2, 9,48 % |
| m70 | L 71,9, 7,93 % | L 70,8, 10,16 % |
| m90 | L 72,5, 5,1 % | L 72,2, 5,54 % |

Hárky `film/desk1440-safari-pred/harok-cuts.jpg` a `-po/harok-cuts.jpg` som otvoril: v pred zakrýva m30 a m50
tmavé rozmazané operadlo takmer polovicu obrazu, v po je to prelínanie dvoch svetlých záberov v pohybe (na m30 je
viditeľný dvojitý obraz, čo je pri pohybe prirodzené). m70 10,16 % je tmavý nábytok na samotnej fotke stola
(rovnako ako zistil autor v A11). Zelená, purpurová, čierna, alfa < 255: 0 % vo všetkých 10 snímkach.
Prológ (fasáda → dvere → úvod, 11 polôh) je pred a po zhodný (napr. s060 L 41 / 41, tmavá plocha 19,46 / 19,46 %);
tmavé plochy 18–20 % sú sud a tmavé panely na fotke rohože (`harok-pro.jpg` otvorený), nie chyba kreslenia.

### 2.3 Výroba (prod): záznam obrazovky, štart filmu, strata grafického kontextu

`node nastroje/a5-film.mjs --mode=phone|desk1440 --variant=prod --passes=resize,lost,start` (`log2/film-*-prod-*.log`):

| | telefón pred | telefón po | počítač pred | počítač po |
|---|---|---|---|---|
| záznam obrazovky počas skrolu: snímok / s čiernou > 3 % | 97 / **0** | 85 / **0** | 14 / **0** | 23 / **0** |
| štart filmu: najviac presvitajúceho podkladu | 0 | 0 | 0 | 0 |
| prelnutie zálohy do plátna | 1612 ms | 2161 ms | 2465 ms | 2646 ms |
| strata kontextu: záloha počas straty (jas / tmavé %) | 47,1 / 57,9 | 47 / 57,9 | 33,5 / 54,7 | 34,3 / 54 |
| obnova po strate | áno | áno | áno | áno |

Pozn.: v zázname obrazovky nenastala ani jedna zmena rozlíšenia (`zmeny rozlíšenia: []`), takže tento pas sám
opravu FIL-1/FIL-3 nepreverí – preto pas „okno“ v 2.4. „Tmavé %“ pri strate kontextu je podiel bodov s jasom < 25
na celej obrazovke vrátane tmavých kariet webu; pred, počas a po strate je rovnaký, teda záloha nezhasne.

### 2.4 Zmena okna a otočenie telefónu počas filmu (FIL-1/FIL-3)

`node nastroje/a5-film-okno.mjs --mode=desk1440|phone --variant=prod|kontrola --passes=okno` (kópia nástroja
autora; `kontrola` = HEAD so spätne vrátenou opravou FIL-3; `log2/okno-*.log`, `film2/*-okno-*/vysledky.json`):

| | počítač pred | počítač po | počítač kontrola | telefón pred | telefón po | telefón kontrola |
|---|---|---|---|---|---|---|
| zmien okna / otočení | 36 | 36 | 36 | 4 | 4 | 4 |
| prvá snímka po zmene má obraz (nie 0,0,0) v tej istej snímke | 36/36 | 36/36 | 36/36 | 4/4 | 4/4 | 4/4 |
| záblesky (snímka o 40 % tmavšia ako susedné) | 0 | 0 | 1 | 0 | 0 | 0 |
| snímok záznamu / s bodmi ≤ 6 nad 3 % | 161 / 96 | 186 / 112 | 196 / 112 | 240 / 68 | 275 / 14 | 313 / 83 |

Čítanie: zmena okna a otočenie telefónu sú bez čierneho snímku **v pred aj po** (stred plátna po zmene napr.
[36,28,25,255], [30,22,19,255]). Stĺpec „body ≤ 6 nad 3 %“ nie je chyba filmu: rovnaký podiel 4,07 % (počítač) a
4,9 % (telefón) má už **prvá snímka pred akoukoľvek zmenou** a otvorená snímka `phone-prod-okno-pred/snimky/okno-0060-cierna5.jpg`
je sekcia tímu bez filmu (tmavý dizajn stránky, čierne tričká na fotkách); počet závisí len od toho, koľko snímok
záznam zachytil v tej polohe. Snímka po otočení `phone-prod-okno-po/snimky/okno-844x390-0138.jpg` (otvorená) ukazuje
celý záber kresla, pás kapitol a „Ďalej Galéria ↓“ bez tmavého poľa.

**Čo sa overiť nedalo:** automatická zmena rozlíšenia filmu (`quality()`, oprava FIL-3) v tomto kontajneri ani raz
nenastala (`zmeny rozlíšenia: []` vo všetkých štyroch záznamoch v 2.3) a variant `kontrola` sa v pase okno správa
rovnako ako po – zmena okna ide inou cestou (`resize()` z udalosti okna). Opravu FIL-1/FIL-3 preto dokladám len
kódom: HEAD čistí plátno presne na 14, 13, 12 (`film.js:331`, `new THREE.Color(14 / 255, 13 / 255, 12 / 255)`) a
`quality()` beží vo `frame()` pred `draw()` v tej istej snímke (`film.js:1314`); v pred čistil na 0x0e0d0c
prepočítané z sRGB (podľa komentára autora 1, 1, 1) a kreslil po zmene druhýkrát. Behové overenie zostáva na
zariadení (N5).

### 2.5 Kino (nové): automatická prehliadka

Len po (v pred neexistuje). `mer-kp.cjs kpKino` (`BS30_KINO.play()`, 40 s záznamu rAF):

| | snímok | p95 | p99 | max | > 50 ms | zastávok | koniec |
|---|---|---|---|---|---|---|---|
| telefón bez filmu b1 / b2 | 2297 / 2339 | 16,8 / 16,8 | 33,4 / 33,3 | 150 / 66,7 | 9 / 6 | 8 / 8 | y 12 671, hrá false |
| počítač bez filmu b1 / b2 | 2388 / 2287 | 16,8 / 16,8 | 16,8 / 16,8 | 83,3 / **1733** | 2 / 2 | 8 / 8 | y 13 904, hrá false |
| telefón s filmom (SwiftShader) | 432 / 194 | 250 / 667 | – | 867 / 1550 | 197 / 135 | 8 / 8 | y 12 671 |

(`mer2/kpKino-bezfilmu.log`, `mer2/kpKino.log`). Kino prejde všetkých 8 kapitol a zastaví sa na rezervácii; bez
filmu je jazda plynulá (p95 16,8 ms). Jeden beh na počítači mal jednu snímku 1,7 s – v druhom behu nie; príčinu
(pravdepodobne dekódovanie veľkej fotky pri skoku na strih) som nedohľadal – zopakovať na Macu (N5).

## 3. Plynulosť a načítanie

### 3.1 Načítanie – zdroj, python server (`mer2/kpNacitanie.log`, 3 behy, medián; `mer2/sonda-cls-*.log`)

| stránka, profil | FCP pred → po | LCP pred → po | CLS (max) pred → po | TBT pred → po | kB do load |
|---|---|---|---|---|---|
| index, telefón 4G (3 behy) | 932 → 916 | 1252 → 1152 | 0 (0) → 0 (0,0292) | 356 → 540 | 786 → 799 |
| index, telefón 4G (sonda, 8 behov) | 812 → 840 | 932 → 984 | 0/8 → 0/8 nad 0,01 | – | – |
| index, telefón Slow 4G (3 behy) | 3572 → 4132 | 3752 → 4132 | 0 → 0 | 1329 → 475 | 786 → 841 |
| index, telefón Slow 4G (sonda, 5 behov) | 3484 → 3616 | 3624 → 3728 | 0/5 → 0/5 | – | – |
| rezervácia, telefón 4G | 2444 → 924 | 2444 → **1184** | 0 → 0 | 142 → 219 | 740 → 619 |
| rezervácia, telefón Slow 4G | 3260 → 2984 | 6268 → **4860** | 0 → 0 | 5 → 21 | 887 → 619 |
| en/, telefón 4G | 916 → 872 | 1164 → 1196 | 0,0004 (0,0308) → rovnako | 508 → 624 | 804 → 817 |
| index, počítač | 324 → 236 | 324 → 236 | 0,0001 (0,0001) → 0,0001 (0,0283) | 42 → 2 | 768 → 799 |
| rezervácia, počítač | 148 → 140 | 148 → 152 | 0,0001 → 0,0001 | 0 → 0 | 673 → 404 |

### 3.2 Načítanie – nasadené verzie s gzip (`mer2/gz/`)

| stránka, profil | FCP pred → po | LCP pred → po | poznámka |
|---|---|---|---|
| index, telefón 4G (8 behov) | 712 → 856 | 732 → 856 | séria 1 |
| index, telefón 4G (8 behov) | 648 → 784 | 776 → 820 | séria 2, súbežne bežal film |
| index HEAD **zdroj** s gzip, telefón 4G (8) | 776 → 696 | 892 → 768 | séria 3 |
| index, telefón Slow 4G (6 behov) | 2020 → **1776** | 2212 → **1904** | menší style.css pomôže |
| rezervácia, telefón 4G (3) | 812 → 812 | 1644 → **1188** | kB do load 603 → 459 |
| en/, telefón 4G (3) | 656 → 808 | 780 → 808 | |
| index, počítač (3) | 220 → 212 | 220 → 260 | CLS medián 0,0283 → 0,0001 |

Čítanie: na telefóne 4G je FCP/LCP úvodu **v šume** – v dvoch sériách je po pomalšie o 80–144 ms, v jednej rýchlejšie
o 80 ms. Sieť to nie je: style.css aj tri písma dorazia v pred aj po okolo 500 ms (`mer2/gz/sonda-fcp-nasad-*.log`,
riadky „do FCP“). Rozptyl robí pretek: keď app.js stihne bežať pred prvým vykreslením, posunie FCP o 107–361 ms
(LoAF `app.js … 107 f22` až `361 f250` = 361 ms skriptu, z toho 250 ms vynútený štýl a rozloženie). Nastalo to v po
3 zo 16 behov a v pred 1 zo 16 – je to vlastnosť oboch verzií (pozri návrh N3).

CLS 0,0292 na telefóne: pseudoprvok `::before` sa okolo 1,4 s zväčší z 0,374,390,422 na 0,329,390,469 – **raz v pred
aj raz v po** (`mer2/gz/sonda-fcp-zdroj-4G-index_html.log`, pred b3 a po b6). Nie je to zhoršenie; je pod hranicou
0,1, ale dá sa odstrániť (N4).

### 3.3 Skrol celou stránkou – telefón (dotyk 1500 px/s, ťahy po 600 px, celých 17 292 px)

Hlavné meranie `nastroje/ab-skrol.cjs`, bez filmu (predvolený stav telefónu), 6 behov na verziu (2 + 4 v
`mer2/ab-skrol.log` a `mer2/ab-skrol-opak.log`), záťaž 3–7:

| verzia | snímky > 34 ms (6 behov) | > 50 ms | prepočtov štýlu | vynútený štýl v app.js:tick |
|---|---|---|---|---|
| pred 791fb3db | 72, 27, 84, 64, 54, 59 | 26, 7, 34, 25, 21, 27 | 2476–2513 | 1–78 ms |
| **po HEAD** | **116, 101, 89, 58, 132, 180** | **38, 38, 45, 16, 42, 101** | **3188–3350** | **100–796 ms** |
| po bez pásu kapitol | 59, 59 | 16, 19 | 2469–2471 | 7–26 ms |
| po bez zápisu výplne pásu | 85, 73 | 36, 25 | 2454–2579 | 48–187 ms |
| po bez `filter: drop-shadow` pásu | 73, 85 | 20, 33 | 3364–3409 | 80–323 ms |

Z ~1 800–1 900 snímok skrolu. Varianty „bez …“ menia len súbor v prehliadači cez `page.route` (strom nedotknutý):
`const kino = false` v app.js, vynechaný riadok `kino.fills[i].style.transform = …` v `kresliPas`, resp. pravidlo
`html.kino .story-line { filter: none !important; }`.

**Záver:** zhoršenie spôsobuje **pás kapitol (B2, commit 1b25c2dc)**. Bez neho je po rovnako plynulé ako pred
(59 / 16–19 proti mediánu pred 62 / 25). Výplň kapitoly, ktorá sa zapisuje v každej snímke skrolu, pridá okolo 750
prepočtov štýlu (+30 %); zvyšok pridávajú filter nad pevne umiestneným pásom a vynútený prepočet štýlu v `tick`
(app.js:179 `readTarget()` číta `scrollY` na začiatku snímky – keď je štýl v tej chvíli neplatný, napr. počas CSS
prechodov výšky čiar pásu pri prepnutí `kino-tenky`, prehliadač ho musí prepočítať hneď).

Potvrdenie aj v pôvodnom nástroji (`mer2/kpSkrol.log`, 2 behy, záťaž 10–14): bez filmu fps 33,1 → 28,2,
p95 50,1 → 83,3 ms, nad 50 ms 106 → 188, nad 100 ms 21 → 62, LoAF ≥ 50 ms 82 → 145; čas `app.js:tick` v dlhých
snímkach 638 / 281 → 1782 / 1624 ms. S filmom (SwiftShader) je rozdiel prekrytý kreslením filmu: nad 50 ms
1135 → 1141, p95 816 → 483 ms (tam rozhoduje softvérová grafika, nie web).

Rezervácia na telefóne: 59,4 → 59,2 fps, nad 50 ms 0 → 0 (bez zmeny).

### 3.4 Skrol – počítač (koliesko 240 px každých 40 ms, `mer2/kpSkrol-pocitac.log`, bez filmu)

| | pred b1 / b2 | po b1 / b2 |
|---|---|---|
| fps | 30,1 / 33,1 | 24,3 / 30,1 |
| p95 | 33,3 / 33,2 ms | 166,7 / 116,6 ms |
| snímky > 50 ms | 16 / 18 | 31 / 24 |
| LoAF ≥ 50 ms | 15 / 17 | 33 / 24 |
| prepočet štýlu | 517 / 499 ms | 639 / 580 ms |

Rovnaký smer ako na telefóne (pás je na počítači dole v strede s názvom kapitoly). Rezervácia na počítači:
60 → 59,5 fps, nad 50 ms 0 → 0. S filmom (SwiftShader) 2,3 → 2,7 fps – nemerateľné.

### 3.5 INP (Event Timing, najdlhšia udalosť interakcie, `mer2/kpInp-bezfilmu.log`)

| interakcia (telefón, 4G) | pred b1 / b2 | po b1 / b2 |
|---|---|---|
| menu otvoriť | 200 / 144 | 160 / 152 |
| jazyk EN | 64 / 48 | **464** / 48 |
| menu zavrieť | 120 / 128 | 168 / 136 |
| jazyk späť SK | 112 / 152 | 112 / 112 |
| Barber otvoriť / zavrieť | 232 / 128 · 88 / 120 | 176 / 144 · 136 / 120 |
| cenník záložka | 64 / 88 | 64 / 72 |
| Objednať (okno) / 1. voľba | 240 / 176 · 144 / 96 | 216 / 256 · 120 / 72 |
| galéria | 96 / 112 | 80 / 112 |
| pás: ťuk na kapitolu 4 | – | 64 / 80 |
| Kino ▶ / ■ | – | 40 / 40 · 40 / 56 |

Počítač: najhoršia interakcia pred 168 / 96 ms, po 96 / 72 ms; nové prvky pás 24 / 48, Kino ▶ 56 / 40, ■ 48 / 56 ms.
Jediný odľahlý údaj je po b1 „jazyk EN“ 464 ms (druhý beh 48 ms) – zopakovať na zariadení. S filmom (SwiftShader)
sú hodnoty v oboch verziách 136–3016 ms a ich rozptyl je daný softvérovým kreslením (`mer2/kpInp.log`).

### 3.6 Pamäť a bajty

- JS heap po celom skrole (`mer2/kpSkrol.log`): telefón bez filmu pred 1,6 / 1,9 MB → po 2,3 / 2,4 MB; s filmom
  4,5 / 4,5 → 5,8 / 5,4 MB; počítač s filmom 3,8 → 3,9 MB. DOM uzly 2 687–2 840 → 2 692–2 779 (bez zmeny).
- Zdroj (gzip -9): app.js 15 664 → 17 866 B (+2 202), kino.js nový 2 480 B (načíta sa až po load), style.css
  25 572 → 27 173 B (+1 601), objednavka.js +2 265, objednavka.css +574, asistent-otazky.js +1 234, asistent.js +513,
  i18n.css +392, rezervacia.js +300, film.js +245, index.html +29, rezervacia.html +155 B.
- Nasadené (`nasad/po` po `zmensi.mjs`): index.html 16 084 → 14 319 B gzip, style.css 25 616 → 15 525 B gzip
  (overené `curl` cez srv-gz, `log2/beh4.out`). Rezervácia stiahne do load 603 → 459 kB (fotky krokov až po load).

## 4. Návrhy (čo by stránke pomohlo; v strome nič nemením)

- **N1 – oprava zhoršenia skrolu (nutné, aby platilo „nič sa nesmie zhoršiť“).** Pás kapitol nech nepíše štýl v
  každej snímke: (a) výplň kapitoly zapisovať len pri zmene o ≥ 1 % (zaokrúhliť na 0,01, dnes na 0,001), alebo ju
  nechať na CSS `animation-timeline: scroll()/view()` tam, kde ho prehliadač podporuje, a JS len ako náhradu; (b) prechody výšky čiar (`height`/`margin-top` 180 ms pri `kino-tenky`) nahradiť `transform: scaleY()`;
  (c) `filter: drop-shadow` nad pevným pásom nahradiť tieňom priamo na čiarach (`box-shadow`) alebo ho vypnúť počas
  skrolu. Overenie: `node barber/senior/kp/nastroje/ab-skrol.cjs --var=pred,po --behy=6` (servery 9170/9171) –
  cieľ: snímky nad 50 ms a počet prepočtov štýlu na úrovni pred (≈ 25 a ≈ 2 500).
- **N2 – najtmavší strih telefónu** `kreslo-stred>kava` (švih) má na m70 tmavú plochu 20,8 % (aj v pred). Rovnaký
  postup ako A11 (pohyb namiesto švihu cez tmavý vrch záberu) by ho stiahol pod 10 %.
- **N3 – app.js pred prvým vykreslením.** Keď app.js dobehne skôr, ako sa stránka prvý raz vykreslí, jeho
  úvodný kód vynúti štýl a rozloženie celej stránky (až 250 ms pri CPU 4×, LoAF `f250`) a FCP sa posunie. Úvodné
  meranie stránky presunúť za prvé vykreslenie (napr. `requestAnimationFrame(() => setTimeout(…))`) – rovnaký vzhľad,
  stabilnejší FCP. Ktoré volanie presne vynucuje rozloženie, som neoveril (LoAF uvádza len súbor app.js).
- **N4 – CLS 0,0292** z `::before` (≈ 1,4 s po načítaní, posun o 45 px nahor a zväčšenie výšky) – nájsť pravidlo a
  rezervovať mu výšku od začiatku; nastáva v pred aj po.
- **N5 – overiť na zariadeniach majiteľa** (kontajner má len softvérovú grafiku): skrol bez filmu na iPhone po N1,
  Kino ▶ s filmom na Macu, otočenie telefónu počas filmu.

## 5. Čo som neoveril

- Skutočný iPhone / Safari a skutočnú grafiku (len SwiftShader). Čísla fps s filmom nie sú výpovedné pre zariadenia.
- Vlastné meranie `vaha.mjs` som nespúšťal (bajty dokladám gzipom a CDP `encodedDataLength`).
- Ostatné testy (i18n, app-smoke, objednávka …) sú úlohou iného kontrolóra; ja som sledoval len plynulosť a film.

## Príkazy (výber)

```
node barber/senior/kp/nastroje/mer-kp.cjs kpNacitanie|kpSkrol|kpInp|kpKino --behy=2|3 --out=…/kp/mer2   (beh2.sh)
node barber/senior/kp/nastroje/sonda-cls.cjs --siet=4G --behy=8 ; --siet=slow4G --behy=5               (beh3.sh)
node barber/senior/kp/nastroje/ab-skrol.cjs --behy=2 ; --var=pred,po --behy=4 --tag=opak               (beh3/5)
node barber/senior/kp/nastroje/srv-gz.cjs 9171 hs-skvrny kp/nasad/po ; sonda-cls / sonda-fcp            (beh4/6)
node barber/senior/kp/nastroje/a5-film.mjs --mode=phone|desk1440 --variant=prod|safari …                (beh5.sh)
node barber/senior/kp/nastroje/a5-film-okno.mjs --passes=okno --variant=prod|kontrola …                 (beh7.sh)
```
Servery som po každom behu zastavil podľa PID (`kill $P1 $P2` v skriptoch beh2–beh8).
