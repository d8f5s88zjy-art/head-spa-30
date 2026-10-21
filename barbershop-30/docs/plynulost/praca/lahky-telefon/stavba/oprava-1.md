# Oprava 1 – ľahký telefón, vážne nálezy kola 1

Opravár (jediný zapisovateľ v `hs-lahky`). Vetva `barbershop-lahky-telefon`, pôvodný HEAD 0195615, nový HEAD **f624ee8**.
`$SP` = `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad`, `$O` = `$SP/barber/lahky-telefon/stavba/o1`.
Cesty `app.js`, `style.css` sú v `$SP/hs-lahky/barbershop-30/assets/`, `index.html` a `source/tools/app-smoke.mjs` v `$SP/hs-lahky/barbershop-30/`.

**Prostredie:**
- Porty: 8650–8652 (testy), 8653 = D1 (`hs-pred-d1`), 8654 = PO (`hs-lahky`).
- Title na 8653 aj 8654: „Barbershop 30 Nitra | Pánske strihy, brada a holenie – rezervácia online“.
- Na konci: servery ukončené (`curl` → 000 na oboch), `ps -eo args | grep -E '^/opt/pw-browsers' | wc -l` → 0,
  `git status --short` → 0 riadkov. `$O` má 5 MB.
- Záťaž `/proc/loadavg` počas meraní bola 0,4–5. Časy sú preto porovnávacie.
- Nástroje sú v `$O/nastroje/`:
  - `meraj.mjs`, `sonda.js`, `tma3.py` sú kópie z `meranie-1` s týmito zmenami: porty, variant `predoff` = D1 `?film=off`,
    profil `c1f`, `DPR=`, rozpad LoAF a rozpad práce v najťažších snímkach,
  - vlastné: `start-stopa.mjs`, `kotva.mjs`,
  - sondy kontrolóra: `skok-hore.mjs`, `logo.mjs`, `skok-hore-snimka.mjs`.
- Dáta sú v `$O/data/`.

## Commity (lokálne, bez push)

| commit | nález | zmena |
|---|---|---|
| de67eec | N1 | pri skoku alebo pohybe nahor drží obrazovku posledná hotová fotka (`is-hold`) |
| b2fd4f0 | meranie 3 (a 1) | úvod bez parser blokujúceho skriptu |
| 5015ac6 | meranie 1, 2, 7 (úvod) | náhľad fotky úvodu z HTML, fotka sa ukáže až celá stiahnutá |
| 3582235 | meranie 8 | `/#kontakt`, `/#tim` na telefóne: prvá snímka je cieľ, bez preletu stránky |
| 83e21bd | meranie 7 (galéria) | fotky tímu a galérie sa ukážu až celé stiahnuté |
| f624ee8 | meranie 6 | slučka Tím sa stiahne až po zastavení pri zábere |

Meranie 4 (LoAF) nepovažujem za skutočný nález, dôkaz je nižšie. Meranie 5 (relatívny cieľ −35 %) **nie je opravené**.

---

## N1 – skok alebo rýchly pohyb nahor ukáže čierne okno (de67eec)

**Príčina potvrdená.** Sonda kontrolóra (`skok-hore.mjs`, fotky -m oneskorené o 2,5 s) na 0195615
(`$O/data/skok-hore-HEAD.json`):
- skok 6→2: 160 z 241 snímok bez viditeľnej zálohy,
- skok 8→3: 159 z 241 snímok bez viditeľnej zálohy.

**Oprava** (`app.js` v `zabery()`, `style.css` pri `is-catch`):
- `baseIdx` je posledný záber, ktorý bol celý a ustálený (`so >= 1`, nedobieha).
- Ak v snímke nie je ustálený žiadny zobrazený záber, `baseIdx` dostane `so = 1`, ostane v okolí (pridá sa pred
  susedov) a triedu `is-hold`.
- `html.karty .film-shot.is-title.is-hold { z-index: -1 }`. Zálohy sú `position: fixed` v `.film-shot` s
  `isolation: isolate`, takže držaná fotka vyššej karty by sa inak kreslila nad textom cieľovej karty. So `z-index: -1`
  v `.site` (z-index 1) je nad `body`, ale pod textom karty aj pod pásmi (`.band` má pozadie).
  `.scene` pozadie nemá (`grep` v style.css: len `position: relative`).
- Cieľová karta sa po dekódovaní prelinie nad držanú fotku existujúcim `is-catch`, nikdy z inku.

**Po oprave** (`$O/data/skok-hore-N1.json`, `logo-N1.json`):

| sonda | pred | po |
|---|---|---|
| skok 6→2, snímky bez zálohy | 160 | **0** (241 snímok) |
| skok 8→3, snímky bez zálohy | 159 | **0** (241 snímok) |
| skok 1→6 | 0 | 0 |
| logo z karty 7 na úvod, snímky nad kotvou bez zálohy | 8 (kontrolór) | **0** (181 snímok) |
| okolie (`maxNear`) | | 3 |

Snímka 500 ms po skoku nahor (`$O/data/skok-hore-500ms.png`): nadpis karty 2 „Povedz, ako to chceš.“ je nad držanou
fotkou kávy z karty 6. Jas priemer 61,8, pod jasom 20 je 36,7 % bodov (kontrolór: 19,9 a 94,8 %).

**Test:** app-smoke časť 9 má dve nové kontroly po snímkach (rAF), obe s fotkami -m oneskorenými o 2,5 s:
- skok 6→2: `{"snimok":241,"ink":0,"koniec":"2"}`,
- logo z karty 7 s plynulým skrolom: `{"snimok":218,"ink":0,"koniec":"0"}`.

**Dotknuté testy:**
- app-smoke: 152 OK, „Všetky kontroly prešli“ (`$O/data/smoke-N1.txt`).
- `karty-shot --lite` a `--only=desktop`: výstup je zhodný s kontrolórom (`diff` bez rozdielu).

---

## Meranie 3 – na Slow 4G sa obraz ~1,5 s neprekreslí (b2fd4f0)

**Medzera 1,5 s sa nezopakovala.** `meraj.mjs start --prof=c4s --stromy=po` pri záťaži 1,33: snímky screencastu idú
po FCP (3 215 ms) súvisle. Jediná medzera nad 300 ms je 4 788 → 5 259 ms (rozbor `meta.json` toho behu, snímky boli
dočasné a sú zmazané). Rovnako `start-stopa.mjs`: snímky po 3 186 ms súvisle (`$O/data/start-stopa-c4s-po.json`). Merač mal
záťaž 3,7–5,3, preto medzeru považujem za záťaž stroja.

**Skutočný problém pri tom istom príznaku (nadpis až po prvom vykreslení):**
- Stopa štartu (`start-stopa.mjs 8654 c4s`, `$O/data/start-stopa-c4s-po-2.json`) ukazuje, že parser stojí na
  riadku 179 od 667 do 3 014 ms.
- style.css príde pri 2 916 ms.
- Riadok 180 v 0195615 je vložený skript, ktorý klonuje zálohu úvodu zo `<template>`
  (`<script>(function(d){var t=d.getElementById(...)`). Inline skript musí čakať na štýly, ktoré sú pred ním.
- Prvá snímka (FCP 3 215 ms) bola preto len lišta (`d40` 1,00, jas v ráme nadpisu max 13). Nadpis prišiel až pri
  3 602 ms. To isté platí v D1.

**Oprava** (`index.html`, hlavička):
- Klonovanie robí `MutationObserver` z hlavičky, keď parser dočíta `<template>` (`t.nextSibling`).
- Záloha je pri prológu fasáda, inak rohožka, ako doteraz.
- Skript v tele som odstránil.

**Po oprave** (`start-stopa-c4s-po-3.json`): parser dobehne po riadok 913 pri 1 076 ms a nikde nestojí.

**Test:** uvod-shot na samotnom stave b2fd4f0 (`$O/data/uvod-M3.txt`):
- desktop `pro=true záloha=vstup-2172.avif`,
- mobil s filmom `vstup-m-1086`,
- `mobile-lite: OK … nadpis=1 tlačidlá=1 záloha=1`.

---

## Meranie 1, 2 a 7 (úvod) – prvý obraz nie je fotka, tma v 3 s, prázdna plocha na Slow 4G (5015ac6)

**Príčina:** fotka úvodu `rohozka-m-1448.avif` má 438 359 B.
- Na Fast 4G nemôže prísť do prvého vykreslenia.
- Na Slow 4G (180 kB/s) potrebuje sama asi 2,4 s a delí sa o pásmo so style.css a písmami (všetko sa pýta pri
  621–637 ms, `start-stopa-c4s-po-2.json`).
- Menšie rozlíšenie nesmiem (L4 a V7 len so súhlasom majiteľa, POZIADAVKY bod 4).

**Oprava** podľa SPEC L3 bod 4 („náhľad … len ako `background-image` pod úplne prvou fotkou“):
- `index.html`, `<template id="still-uvod">`: `--nahlad` je tá istá fotka `rohozka-m` v tom istom výreze, 24×43 px,
  WebP q60, **468 B** (base64 647 znakov). Je priamo v stránke, bez požiadavky.
- `style.css`, len `@media (max-width: 720px)` a `html.lite`:
  - náhľad je pozadím `.film-still` úvodu (pozícia `--fmx/--fmy`, `cover`),
  - `img` má `opacity: 0`, kým nemá triedu `nacitana` (pridá ju hlavička po `load`), potom sa prelinie 300 ms.
  - Nestiahnutá alebo napoly stiahnutá fotka sa preto nikdy neukáže. Pri chybe ostane náhľad.
- Nič nové sa nesťahuje: `rohozka-m-*` je stále 1 požiadavka (V6).

**Vzhľad – treba ukázať majiteľovi (V8):** na pomalej sieti vidí najprv rozmazaný náhľad tej istej fotky s ostrým
nadpisom a tlačidlami a o chvíľu ostrú fotku. Snímky `$O/data/start-c4s-snimky.png` (3 582, 5 321, 5 847 ms).

**Výsledok** (`meraj.mjs start`, striedavo D1 s filmom ako u majiteľa / PO, 1 beh na profil, `$O/data/zaver.log`):

| profil | tma 3 s D1 | tma 3 s PO | fotka s nadpisom D1 | fotka s nadpisom PO | FCP D1 | FCP PO | neúplné D1 / PO |
|---|---|---|---|---|---|---|---|
| CPU 4×, Fast 4G | 19,5 % | **0 %** | 2 136 ms | **1 266 ms** | 920 | 1 268 | 0 / 0 |
| CPU 6×, Fast 4G | 22,3 % | **0 %** | 1 956 ms | **1 141 ms** | 772 | 1 140 | 0 / 0 |
| CPU 4×, Slow 4G | 71,2 % | **0 %** | 5 177 ms | **3 268 ms** | 3 040 | 3 268 | 15 / **0** |
| CPU 6×, Slow 4G | 70,7 % | **0 %** | 5 141 ms | **3 381 ms** | 3 020 | 3 380 | 13 / **0** |

- Prvá snímka PO je náhľad s nadpisom (`d40` 0,34, nadpis 0,138), teda žiadna snímka „len lišta“.
- **Výhrada:** FCP PO je o 230–370 ms neskôr ako D1. Prvá snímka už nie je len lišta, ale celý dokument
  (311 ms rozloženia pri CPU 4×, `start-stopa-c4s-po-3.json`) plus softvérové kreslenie DPR 3 v kontajneri.
  Čas do prvej fotky s nadpisom je však o 34–42 % kratší.
- Bajty prvej obrazovky: PO 1,06 MB, D1 2,15–2,20 MB.

**Test:** app-smoke časť 9 má novú kontrolu
`[lite 390/430] pod fotkou úvodu je náhľad z HTML, fotka sa ukáže až stiahnutá, úvod bez parser blokujúceho skriptu`
→ OK `{"nahlad":true,"nacitana":true,"imgOp":1,"blokuje":0}`. Celý app-smoke prešiel
(`$O/data/smoke-M8.txt`: 154 OK). Ďalej prešli uvod-shot a i18n-test (64 OK, `$O/data/i18n-M1.txt`).

---

## Meranie 8 – `/#kontakt` najprv ukáže úvod (3582235)

**Príčina potvrdená** (`kotva.mjs 8654`, `scrollY` po snímkach):
- 0 do 1 112 ms (FCP 980),
- potom 16 → 65 → 835 → … → 14 885 px za ~0,7 s.

Prehliadač skočí na kotvu až po DOMContentLoaded a **plynulo** (`html { scroll-behavior: smooth }`, style.css:72).
Návštevník tak uvidí úvod a potom prelet celej stránky.

**Oprava** (`index.html`, hlavička, len `lite` a len typ navigácie `navigate`; pri znovunačítaní a „späť“ ostáva
obnovená poloha):
- V prvom rAF pred prvým vykreslením: `scrollIntoView({behavior:'instant'})`. `scroll-margin` platí ako pri kotve.
- Kým sa návštevník nedotkne (`touchstart`, `wheel`, `keydown`, `pointerdown`), poloha sa po DOMContentLoaded,
  `fonts.ready` a `load` (+500 ms) dorovná.
  - Bez toho skončil jeden beh na y 14 915 s pätičkou v polovici okna, lebo obsah nad ňou ešte dorastal.

**Po oprave:**
- `kotva.mjs`: y = 14 885 už pri DOMContentLoaded, prvé vykreslenie je pätička, koniec 15 370 (koniec stránky).
- `meraj.mjs scen kontakt`, 2 behy: prvá aj posledná snímka sú pätička
  (`$O/data/scen-kontakt-c4f-po-2.png`), y 15 370 v oboch.
- `/#tim`: tma 0 %, fotka od FCP, y 2 870.
- Záverečné meranie (`zaver.log`):

  | scenár | tma 3 s D1 | tma 3 s PO |
  |---|---|---|
  | `#tim` | 81,6 % | 0 % |
  | znovunačítanie pri 3000 | 10,9 % | 0 % |
  | späť | 12,8 % | 0 % |
  | `en` | 17,6 % | 0 % |
  | `#kontakt` | 1,0 | 1,0 |

  Pri `#kontakt` je hodnota 1,0 správna, lebo cieľ je tmavá pätička podľa návrhu.

**Test:** app-smoke, nová kontrola `[lite #tim / #kontakt] prvá snímka je už na cieli kotvy, poloha ostáva`:
- `#tim`: `{"y1":2870,"y":2870}`,
- `#kontakt`: `{"y1":14928,"y":15416}`.

156 OK (`$O/data/smoke-M8b.txt`).

---

## Meranie 7 (galéria) – `naradie-noznice-1600.avif` 0,2–0,3 s prázdna počas skrolu na Slow 4G (83e21bd)

**Oprava:**
- `app.js` 8b: na `lite` dostane `.band picture`, ktorej lenivá fotka ešte nie je stiahnutá, triedu `cakaj`.
  Odstráni sa pri `load` aj `error`.
- `style.css`: `html.lite .band picture.cakaj { opacity: 0 }`, prelínanie 250 ms.
- Bez app.js sa nič neskrýva.
- Sonda merača násobí krytie predkov (`sonda.js:26`).

**Po oprave:** `meraj.mjs skrol --prof=c4s --stromy=po --n=2` → `incN 0`, `inc {}` v oboch behoch (merač: 16–19 vzoriek).

**Test:** app-smoke, nová kontrola `[lite 390/430] fotky tímu a galérie: ukázané len celé stiahnuté` →
`{"n":18,"zle":[]}`. 158 OK (`$O/data/smoke-M7.txt`).

---

## Meranie 6 – celá stránka 6,40 MB, z toho 2,88 MB slučka Tím (f624ee8)

**Príčina:** slučka sa stiahla a spustila hneď, ako záber zabral 60 % okna, aj pri prelete (merač: `playAt [[10464, 1]]`).

**Oprava** (`app.js` časť 11): slučka sa prvýkrát spustí, a teda aj stiahne, až keď skrol stojí aspoň `POKOJ_MS` = 800 ms.
- Dovtedy ostáva plagát, ktorý je presne prvá snímka.
- Po prvom spustení platí pôvodné pravidlo.
- Súbor ani rozlíšenie som nemenil: 864/60 fps je skoršia požiadavka majiteľa (videa.sh) a menší súbor je rozhodnutie
  majiteľa (N3, V8).

**Po oprave:** `meraj.mjs skrol --prof=c4f --stromy=po --n=2` → **3,55 MB** v oboch behoch, `playAt []`, video 15 kB.

| strom | celá stránka (Fast 4G) |
|---|---|
| PO pred opravou | 6,41 MB |
| PO po oprave | **3,55 MB** |
| D1 `?film=off` (tá istá metóda) | 3,41 MB |
| D1 s filmom | 11,47 MB (merač) |

- Rozdiel +0,14 MB proti D1 `?film=off` je v obrázkoch (+261 kB). L2 bod 5 dáva Poď ďalej fotku `sala-m-1448`
  (205 kB) namiesto snímky sekvencie (41 kB). Skripty sú o 88 kB menšie.
- Kto sa pri Tíme zastaví, stiahne slučku ako doteraz. Rozhodnutie 864 / 576 / bez slučky ostáva na majiteľovi.

**Test:** app-smoke, nová kontrola `[lite slučka] prelet cez záber Tím bez zastavenia: video sa nestiahne, ostáva plagát`
→ OK. Existujúca kontrola „záber Tím cez okno: video hrá“ → OK (`s3.t` 1,2 s). 159 OK (`$O/data/smoke-M6.txt`).

---

## Meranie 4 – LoAF > 50 ms v okne skrolu nie je 0: **nie je skutočný nález, ide o čakanie, nie prácu**

Sonda teraz ukladá rozpad LoAF (`renderStart`, `styleAndLayoutStart`, skripty). Výsledky (`$O/data/skrol-*.json`, `loafRozpad`):

| beh | LoAF > 50 | súčet | z toho pred `renderStart` | štýl+rozloženie+koniec | skripty | blokovanie |
|---|---|---|---|---|---|---|
| PO, CPU 4×, DPR 3 | 30 | 3 191 ms | 2 892 ms | 299 ms | 53 ms | 105 ms |
| PO, CPU 4×, **DPR 1** | 37 | 3 575 ms | 3 392 ms | 183 ms | 28 ms | 178 ms |
| PO, **CPU 1×** | 18 | 2 311 ms | 2 280 ms | 31 ms | **0** | **0** |
| D1 `?film=off`, CPU 1× | 26 | 3 857 ms | 3 762 ms | 94 ms | 0 | 130 ms |

- Najdlhšie LoAF pri CPU 1× (PO): `[6159, 513.8 ms, blok 0, predRender 513.2, štýl 0.2, koniec 0.4, skripty 0]`.
  Hlavné vlákno nerobí nič. Snímka sa len nevykreslila, kým headless kompozítor nepožiadal o ďalšiu.
- Trvanie je ~ prestávka 450 ms medzi umelými švihmi.
- Nezávisí od DPR (kreslenie pixelov), od CPU (1× aj 4×) ani od stromu (D1 `?film=off` rovnako).
- Merateľná práca: LoAF s trvaním mimo čakania > 50 ms (`loafPraca50`) má PO **0 a 1**, LoAF s blokovaním > 50 ms
  (`loafBlok50`) má **0 a 2**. To je po f624ee8, CPU 4×, Fast 4G, 2 behy.
- Kritérium „LoAF = 0“ preto navrhujem merať ako `loafPraca50` (alebo `blockingDuration`), nie surový počet.
  Konečné potvrdenie: Safari Web Inspector na iPhone.

## Meranie 5 – relatívny cieľ p95 −35 % proti D1 bez filmu: **NEOPRAVENÉ**

**Správny základ podľa SKEPTIK doplniť 11** je D1 `?film=off`, nie `pred0` (world-frame). Merané tou istou metódou,
3 striedavé behy (`$O/data/skrol-c*f-{predoff,po}-*.json`, stav 83e21bd):

| profil | D1 `?film=off` p95 (behy) | PO p95 (behy) | zmena mediánov |
|---|---|---|---|
| CPU 4×, Fast 4G | 16,3 (18,5 / 15,9 / 16,3) | 17,6 (16,9 / 17,6 / 19,8) | +8 % |
| CPU 6×, Fast 4G | 30,9 (30,9 / 30,9 / 31,0) | 26,1 (25,9 / 26,5 / 26,1) | −16 % |

- Po f624ee8 má PO pri CPU 4× p95 15,4 a 14,2 ms (2 behy).
- Rozptyl pri záťaži 2–5 je ±2 ms.
- Rozpad horných 10 % snímok je v oboch stromoch takmer rovnaký:

  | udalosť | D1 `?film=off` | PO |
  |---|---|---|
  | UpdateLayoutTree | 303 ms | 319 ms |
  | FunctionCall | 313 ms | 265 ms |
  | Layerize | 168 ms | 199 ms |
  | Paint | 108 ms | 142 ms |
  | IntersectionObserver | 53 ms | 67 ms |

- Ľahký režim beží po tej istej pokojnej ceste ako D1 `?film=off` (SPEC časť 1: „používame hotovú cestu“). Zníženie
  o 35 % si vyžaduje samostatnú optimalizáciu tej cesty, napríklad:
  - L5.2: krytie na `.title-card` namiesto rámu cez celé okno,
  - 41 prahov IntersectionObserver slučky nahradiť výpočtom v slučke skrolu,
  - menej IO a časovačov počas skrolu.
- Jediného vinníka som nenašiel, preto som to v tomto kole nerobil.
- Absolútne ciele SPEC L5:
  - ≤ 16,7 ms pri CPU 4×: PO 14,2–17,6, teda na hrane,
  - ≤ 20 ms pri CPU 6×: PO 26,1, nesplnené.

## Testy na HEAD f624ee8

| príkaz (v `barbershop-30`, `NODE_PATH=/opt/node22/lib/node_modules`, `B30_PORT=8651/8652`) | výsledok |
|---|---|
| `node source/tools/app-smoke.mjs` | 159 OK, „Všetky kontroly prešli“, exit 0 (`$O/data/smoke-M6.txt`) |
| `node source/tools/i18n-test.mjs` | 64 OK, všetky prešli (`z-i18n-test.txt`) |
| `node source/tools/atmosfera-test.mjs` | 39 OK, všetky prešli (`z-atmosfera-test.txt`) |
| `node source/tools/uvod-shot.mjs` | exit 0; desktop prológ `vstup-2172`, `mobile-lite: OK … nadpis=1 tlačidlá=1 záloha=1` |
| `node source/tools/karty-shot.mjs --lite` | 9 kariet, `diff` s kontrolórom (`k1/karty-lite.txt`) bez rozdielu |
| `node source/tools/karty-shot.mjs --only=desktop` | film prejde 9 kariet, `diff` s kontrolórom bez rozdielu |

## Čo ostáva (pre orchestrátora a majiteľa)

1. **Meranie 5 (−35 % proti D1 `?film=off`) nie je splnené.** Potrebuje samostatné kolo L5 (body vyššie).
   Absolútny cieľ pri CPU 6× (≤ 20 ms) tiež nie je splnený.
2. **Ukázať majiteľovi (V8):**
   - náhľad úvodu na pomalej sieti (rozmazaný na začiatku, potom ostrá fotka),
   - držanú fotku pri skoku nahor (text novej karty nad fotkou predchádzajúcej, kým nová fotka nie je hotová),
   - slučku Tím, ktorá sa spustí až po zastavení.
3. FCP v PO je o 230–370 ms neskôr ako v D1, lebo prvá snímka je celá stránka, nie len lišta. Na iPhone s GPU to treba
   overiť v Safari Web Inspector.
4. Drobné nálezy kontrolóra kódu (N2–N10) som podľa zadania neriešil.
