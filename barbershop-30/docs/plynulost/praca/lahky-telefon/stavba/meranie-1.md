# Meranie 1 – ľahký telefón (L1, L2, L3, L5, L6), PRED a PO

Kontrolór merania, kolo 1. Nič som nemenil v `hs-lahky` ani v `hs-pred-d1`: `git status --short` je na konci 0 riadkov, HEAD 0195615.
Cesty sú od `$ST` = `$SP/barber/lahky-telefon/stavba`, kde `$SP` = `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad`.
Dáta sú v `$ST/meranie-1/`:
- `data/*.json` – 72 behov a `brana.json` s 8 behmi,
- `pasy/*.jpg` – filmové pásy,
- `beh.log` – celý záznam,
- `suhrn.md` – všetky tabuľky s jednotlivými behmi,
- `nastroje/` – `meraj.mjs`, `sonda.js`, `tma3.py`, `suhrn.py`, `beh.sh`, `filmon.mjs`.

## Výsledok v skratke

**PO je lepšie v zaťažení, ale nie v prvom obraze.** Zaťaženie pri skrole klesá o 73–75 %, bajty prvej obrazovky o 51 %,
WebGL kontexty sú 0 namiesto 2. Prvý obraz však ani po zmene nie je fotka. Podiel tmy v prvých 3 s sa nezlepšil a na Slow 4G je
o niečo horší.

| čo (telefón 390×844 @3, dotyk; medián) | PRED (D1) | PO (lite) | zmena |
|---|---|---|---|
| prvá fotka s nadpisom, CPU 4× Fast 4G | 2 155 ms | 1 416 ms | −34 % |
| prvá fotka s nadpisom, CPU 6× Fast 4G | 2 000 ms | 1 566 ms | −22 % |
| prvá fotka s nadpisom, CPU 4× / 6× Slow 4G | 5 172 / 5 247 ms | 5 394 / 5 404 ms | **+4 % / +3 % (horšie)** |
| tma v 3 s po FCP, Fast 4G (4× / 6×) | 22 % / 23 % | 22 % / 25 % | bez zlepšenia |
| tma v 3 s po FCP, Slow 4G (4× / 6×) | 72 % / 72 % | 80 % / 79 % | **horšie o 7–8 b.** |
| čierna (len lišta) v 3 s po FCP, Fast 4G 4× | 10 % | 8 % | −2 b. |
| bajty prvej obrazovky | 2 161 kB (25 pož.) | 1 050 kB (18 pož.) | −51 % |
| bajty celej stránky, Fast 4G | 11,47 MB | 6,40 MB | −44 % (D1 pokojná: 2,97 MB) |
| úloha snímky p95 pri skrole, CPU 4× / 6× (Fast) | 54,1 / 84,0 ms | 14,5 / 21,3 ms | −73 % / −75 % |
| úloha snímky p95, CPU 4× / 6× (Slow) | 56,5 / 80,7 ms | 14,1 / 22,7 ms | −75 % / −72 % |
| dlhé úlohy > 50 ms v okne skrolu, 4× / 6× (Fast) | 21 / 62 | 1 / 3 | −95 % |
| LoAF > 50 ms v okne skrolu, 4× / 6× (Fast) | 467 / 447 | 21 / 27 | −95 %, **nie 0** |
| najdlhší LoAF, 4× / 6× (Fast) | 2 548 / 3 095 ms | 479 / 441 ms | |
| neúplné fotky (pasívne, vzorky po 100 ms), Fast 4G | 0 | 0 | = |
| neúplné fotky, Slow 4G (štart / skrol) | 15 / 15 | 17 / 16–19 | mierne horšie |
| WebGL kontexty | 2 | 0 | splnené |
| hrajúce videá naraz (max) | 1 | 1 (Fast), 0 (Slow) | = |
| tma 3 s pri otvorení `/#tim` | 85 % | 18 % | −67 b. |
| **počítač 1440×900**: úloha snímky p95 pri krátkom skrole | 19,7 ms | 20,5 ms | +4 %, v rozptyle behov 19,2–21,0 |

## 1. Podmienky

**Cudzí prehliadač: nebežal.**
- Čakací príkaz zo zadania `timeout 3000 bash -c 'until [ "$(pgrep -c -f "headless_shell|chrome-linux/chrome")" = 0 ]; …'`
  sa nikdy neukončí, lebo `pgrep -f` nájde aj vlastný riadok `bash -c` s tým istým vzorom.
  - Dôkaz: `pgrep -af` vypísal len procesy 17982/17983 (samotný čakací príkaz) a žiadny Chromium.
  - Čakanie som preto ukončil a overil to inak: `ps -eo args | grep -E '^/opt/pw-browsers' | wc -l` → **0**.
- `beh.sh` toto číslo zapisuje pred každou sériou. Vo všetkých 7 riadkoch `==` v `beh.log` je `prehliadačov 0`.

**Záťaž stroja: /proc/loadavg bol vyšší ako 2.** Hodnoty pred sériami (z `beh.log`):

| séria | loadavg |
|---|---|
| štart | 2,71–3,76 |
| D1 bez GPU (pred0) | 3,37 |
| scenáre | 3,62–5,29 |
| počítač | 4,47 |
| skrol | 4,20–5,10 |
| koniec | 4,69 |

- Záťaž pochádza z vlastného merania, nie z cudzieho tímu. Film D1 kreslí softvérovo (SwiftShader) a pri skrole D1 ukázal
  `ps` toto:
  - GPU proces Chromia: 155 % CPU, neskôr 235 % CPU,
  - renderer: 94 % CPU,
  - všetky procesy Chromia mali vek ako môj beh (`etime` 13:21 pri spustení série 13:13).
- Čísla PRED (s filmom) sú preto horné odhady. Čísla PO a pred0 film nemajú, takže GPU proces ich zaťažuje len málo.
- Disk: 2,2 GB voľných počas celého merania. Dáta majú 4,5 MB, stopy sa neukladali.

**Prostredie:**
- Chromium 1194 (`/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, headless), Playwright z `/opt/node22`.
- Prepínače `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`.
- Servery `python3 -I -m http.server`:
  - 8600 = `hs-pred-d1` (7ea247c),
  - 8604 = `hs-lahky` (0195615).
- Title som overil cez `curl … | grep -o '<title>[^<]*'`. Oba servery vrátili „Barbershop 30 Nitra | Pánske strihy, brada a holenie – rezervácia online“.
  Lite v HTML: `grep -c "classList.add('lite')"` → 8600: 0, 8604: 1.
- Oba servery som po meraní ukončil (`curl` → 000 na 8600 aj 8604).

**GPU ako na iPhone (dôležité pre PRED):**
- Bez zásahu D1 v tomto kontajneri film **vôbec nespustí**. `film.js` D1 (riadky 98–106) zistí softvérové kreslenie a prejde do
  pokojnej verzie `world-frame world-off`.
- Dôkaz `data/brana.json` (beh bez podvrhu): `tel-bez-param` → `karty world js-kin js-steps world-frame world-off`, `film: false`.
- iPhone majiteľa grafiku má, preto `meraj.mjs` pred stránkou podvrhne výsledok kontroly GPU:
  - `failIfMajorPerformanceCaveat` je vypnuté,
  - `UNMASKED_RENDERER_WEBGL` = `'Apple GPU'`,
  - adresa ostáva **bez parametrov**.
- Potom D1 na telefóne dostane `world pro … world-in` a 2 WebGL kontexty. Takto ho vidí majiteľ.
- Lite tento podvrh nijako neovplyvní, lebo `film.js` sa v lite nenačíta.
- Pre porovnanie som meral aj **pred0**: D1 bez podvrhu, teda pokojná verzia so zálohami bez filmu. Je to najbližšie k
  „D1 `?film=off`“ zo SKEPTIK doplniť 11.

## 2. Metóda

Podľa SPEC časť 3 so zmenami SKEPTIK V1 a V5.

**Spoločné nastavenia:**
- Kontext: 390×844, DPR 3, `isMobile`, `hasTouch`, `colorScheme: dark`.
- Sieť (CDP `Network.emulateNetworkConditions`):
  - Fast 4G: 165 ms, 9 Mb/s × 0,9,
  - Slow 4G: 562,5 ms, 1,6 Mb/s × 0,9.
- CPU: `Emulation.setCPUThrottlingRate` 4 a 6.
- Každý beh má nový kontext s prázdnou vyrovnávacou pamäťou.
- Poradie je vždy striedavé: pred, po, pred, po (pri skrole pred, po, pred0, …).
- Opakovania: skrol 3×, ostatné 2×. Uvádzam medián.

**Štart (`meraj.mjs start`):**
- Navigácia bez parametrov a 8 s screencast (`Page.startScreencast`).
- Potom čakanie na pokoj siete (2,5 s bez prenosu, najviac 30 s), bez dotyku.
- Bajty prvej obrazovky = súčet `encodedDataLength` všetkých požiadaviek do pokoja.

**Rozbor pásu (`tma3.py`), kalibrovaný na pilote** (výpis jasov v tomto zázname):
- Plocha obsahu = okno bez lišty (70 px) a spodných tlačidiel (110 px).
- `d40` = podiel pixelov s jasom < 40.
- Prázdna tmavá karta má 1,00, s nadpisom na tme 0,91, fotka úvodu 0,31–0,38.
- **Tmavá snímka** = `d40 ≥ 0,85`. Patrí sem aj nadpis na tme bez fotky.
- **Čierna snímka** = `d40 ≥ 0,97`. Je viditeľná len lišta.
- **Fotka** = `d40 < 0,60` a smerodajná odchýlka > 25.
- **Nadpis** = v ráme `#h-uvod` aspoň 5 % pixelov s jasom ≥ 200, teda pixelový test, nie DOM.
- **Tma v 3 s** = podiel ČASU v okne [FCP, FCP+3000 ms], keď je na obrazovke tmavá snímka. Biele snímky `about:blank` pred FCP
  sa nerátajú.

**Sonda (`sonda.js`):**
- Je pasívna (SKEPTIK V5). Nikdy nevolá `decode()` ani nič nesťahuje.
- Vzorka každých 100 ms:
  - `<img>` v okne (IntersectionObserver), účinne viditeľný (opacity > 0,01) a pritom `!(complete && naturalWidth > 0)` → „neúplná fotka“,
  - príznak aplikácie `__dec` len číta,
  - hrajúce `<video>` (aj mimo DOM, zachytené cez `play()`),
  - počet WebGL kontextov (`getContext`).
- LoAF a longtask zbiera cez PerformanceObserver.

**Čierny štart v ďalších situáciách (SKEPTIK V1, `meraj.mjs scen`):**
- Bez `?uvod=off`, CPU 4×, Fast 4G, pás 4 s od akcie.
- Scenáre:
  - znovunačítanie pri `scrollY` = 3000,
  - `/#tim`,
  - `/#kontakt`,
  - späť z `pravne.html` pri 3000,
  - `localStorage b30.lang = 'en'`.

**Skrol (`meraj.mjs skrol`):**
- Postup: `load`, čakanie na koniec prológu (`pro`), 3 s pokoj.
- Potom stopa (`devtools.timeline`, `…timeline.frame`, `toplevel`, `blink.user_timing`) počas:
  - **12 švihov prstom** (`Input.dispatchTouchEvent`, 480 px pri 1 500 px/s, pustenie v pohybe, pauza 450 ms),
  - **1 pomalého ťahu** (400 px pri 300 px/s).
- Stopa sa potom ukončí. Švihy pokračujú bez stopy až po pätičku, aby sa zmerali bajty celej stránky a neúplné fotky.
- **Úloha snímky** = súčet trvaní najvyšších `RunTask` hlavného vlákna medzi dvoma `BeginMainThreadFrame` (stena).
  Uvádzam aj čas vlákna.
- Dlhé úlohy aj LoAF > 50 ms sa počítajú len v okne stopy.

**Počítač (`meraj.mjs pc`):**
- 1440×900, `?uvod=off` (rovnako pre oba stromy), CPU 1×, bez obmedzenia siete.
- Pohyb myšou, čakanie na `world-in`, 3 s pokoj, stopa.
- 15 × `synthesizeScrollGesture` kolieskom po 420 px pri 2 333 px/s.

**Brána (`meraj.mjs brana`, 1 beh):** `?film=on` na telefóne, okno 600×900 s myšou, `reducedMotion: reduce`.

## 3. Tabuľky pred/po (medián, v zátvorke jednotlivé behy)

Úplné tabuľky sú v `$ST/meranie-1/suhrn.md` (generuje `python3 -I nastroje/suhrn.py data`). Tu je ich celý obsah:

### Štart (prvá návšteva bez parametrov)

| meranie | 4× Fast PRED | 4× Fast PO | 6× Fast PRED | 6× Fast PO | 4× Slow PRED | 4× Slow PO | 6× Slow PRED | 6× Slow PO |
|---|---|---|---|---|---|---|---|---|
| FCP (ms) | 868 | 746 | 832 | 808 | 2 998 | 3 002 | 3 086 | 3 038 |
| prvá fotka (ms) | 1 536 | 1 416 | 1 533 | 1 566 | 5 172 | 5 394 | 5 247 | 5 404 |
| prvá fotka s nadpisom (ms) | 2 155 | 1 416 | 2 000 | 1 566 | 5 172 | 5 394 | 5 247 | 5 404 |
| tma v 3 s po FCP | 22 % | 22 % | 23 % | 25 % | 72 % | 80 % | 72 % | 79 % |
| čierna v 3 s po FCP | 10 % | 8 % | 10 % | 12 % | 7 % | 6 % | 5 % | 6 % |
| bajty prvej obrazovky (kB) | 2 161 | 1 050 | 2 196 | 1 050 | 2 161 | 1 050 | 2 161 | 1 050 |
| požiadavky | 25 | 18 | 27 | 18 | 25 | 18 | 25 | 18 |
| WebGL kontexty | 2 | 0 | 2 | 0 | 2 | 0 | 2 | 0 |
| hrajúce videá (max) | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| neúplné fotky (vzorky) | 0 | 0 | 0 | 0 | 15 | 17 | 12 | 15 |

Fotka v prvej obrazovke:
- PRED: `vstup-m-1448.avif` 2×, potom `rohozka-m-1448.avif`.
- PO: len `rohozka-m-1448.avif` (V6 splnené: 1 požiadavka `rohozka-m-*`).

**D1 pred0** (bez podvrhu GPU, CPU 4× Fast):
- FCP 832 ms,
- prvá fotka 1 386 ms, s nadpisom 1 892 ms,
- tma 18 %, čierna 7 %,
- 1 014 kB, 20 požiadaviek, 1 WebGL kontext (len skúšobný).

### Čierny štart v ďalších situáciách (CPU 4×, Fast 4G)

| scenár | tma 3 s PRED | tma 3 s PO | čierna 3 s PRED | čierna 3 s PO | prvá fotka PRED | prvá fotka PO | poznámka |
|---|---|---|---|---|---|---|---|
| znovunačítanie pri 3000 | 7 % | 4 % | 4 % | 2 % | 1 578 ms (728 / 2 428) | 616 ms | obe `y` 3000, karta Čakáreň |
| `/#tim` | **85 %** | **18 %** | 21 % | 6 % | 1 444 ms | 1 300 ms | PRED ukazuje text „Ľudia / Komu zveríš hlavu?“ na tme asi od 1,9 s do 4 s bez fotky (`pasy/scen-tim-c4f-pred-1.jpg`) |
| `/#kontakt` | 94 % | 85 % | 17 % | 7 % | – / 1 439 ms | 1 348 ms | cieľ je pätička, ktorá je tmavá podľa návrhu (karty faktov a kontakt); tma tu neznamená chybu. Oba stromy však najprv ukážu úvod a až potom skočia na pätičku (`pasy/scen-kontakt-c4f-po-1.jpg`, 1,0–1,5 s úvod, 2,0 s pätička) |
| späť (`back_forward`, nový dokument) | 11 % | 9 % | 4 % | 9 % | 371 ms | 431 ms | `y` 3000 v oboch |
| `b30.lang = 'en'` | 18 % | 19 % | 18 % | 19 % | 1 258 ms | 1 316 ms | fotka s nadpisom: PRED 1 832 / 1 924 ms, PO 1 339 / 1 293 ms |

### Skrol prstom

| meranie | 4× Fast PRED | 4× Fast PO | 4× Fast pred0 | 6× Fast PRED | 6× Fast PO | 6× Fast pred0 | 4× Slow PRED | 4× Slow PO | 6× Slow PRED | 6× Slow PO |
|---|---|---|---|---|---|---|---|---|---|---|
| úloha snímky p95 (ms) | 54,1 | **14,5** | 16,8 | 84,0 | **21,3** | 27,1 | 56,5 | **14,1** | 80,7 | **22,7** |
| úloha snímky p50 (ms) | 11,4 | 3,6 | 3,1 | 16,3 | 5,3 | 4,4 | 10,4 | 4,3 | 16,0 | 5,4 |
| p95 čas vlákna (ms) | 48,8 | 13,4 | 15,2 | 78,3 | 20,5 | 25,3 | 51,7 | 13,2 | 73,1 | 20,4 |
| snímky > 16,7 ms | 35,7 % | 3,1 % | 5,0 % | 48,9 % | 11,1 % | 12,2 % | 35,2 % | 3,2 % | 48,6 % | 10,2 % |
| dlhé úlohy > 50 ms | 21 | 1 | 3 | 62 | 3 | 5 | 19 | 1 | 43 | 1 |
| dlhé úlohy spolu (ms) | 2 762 | 81 | 468 | 4 865 | 198 | 1 163 | 2 436 | 75 | 3 441 | 69 |
| najdlhšia úloha (ms) | 588 | 81 | 157 | 262 | 88 | 486 | 470 | 75 | 306 | 69 |
| LoAF > 50 ms (počet) | 467 | 21 | 30 | 447 | 27 | 38 | 439 | 16 | 440 | 24 |
| LoAF > 50 ms spolu (ms) | 88 400 | 2 606 | 2 794 | 87 539 | 3 542 | 3 849 | 91 848 | 1 408 | 83 895 | 2 421 |
| najdlhší LoAF (ms) | 2 548 | 479 | 284 | 3 095 | 441 | 502 | 2 859 | 334 | 2 666 | 407 |
| rAF p50 / p95 (ms) | 66,6 / 400 | 16,7 / 33,4 | 16,7 / 50 | 66,6 / 400 | 16,7 / 33,4 | 16,7 / 50,1 | 66,6 / 483 | 16,7 / 33,4 | 66,6 / 400 | 16,7 / 33,4 |
| trvanie okna (s) | 102,3 | 16,9 | 17,2 | 102,8 | 18,3 | 19,7 | 106,0 | 16,1 | 98,5 | 16,9 |
| posun v okne (px) | 5 500 | 8 308 | 9 552 | 5 500 | 8 593 | 12 025 | 5 500 | 9 252 | 5 500 | 9 078 |
| bajty celej stránky (MB) | 11,47 | 6,40 | 2,97 | 11,47 | 6,40 | 2,97 | 11,59 | 3,66* | 11,59 | 3,66* |
| WebGL kontexty | 2 | 0 | 1 | 2 | 0 | 1 | 2 | 0 | 2 | 0 |
| hrajúce videá naraz | 1 | 1 | 0 | 1 | 1 | 0 | 1 | 0 | 1 | 0 |
| neúplné fotky (vzorky) | 0 | 0 | 0 | 0 | 0 | 0 | 15 | 16–19 | 10–15 | 14–16 |

\* Na Slow 4G sa slučka Tím (2,88 MB) pri rýchlom prechode nestihne spustiť, a preto sa nestiahne (`playAt []`, video 15 kB).
Na Fast 4G hrá od asi 10,4 s (`playAt [[10464, 1]]`).

Skladba celej stránky (kB, Fast 4G, `celaStranka.podlaTypu`):

| strom | obrázky | video | sekvencie | skripty |
|---|---|---|---|---|
| PRED | 3 768 | 2 878 | 3 661 | 896 |
| PO | 3 134 | 2 878 (slučka Tím z L6) | 0 | 118 |
| pred0 | 2 435 | 15 | 41 | 208 |

### Počítač 1440×900 (film), krátky skrol kolieskom

| meranie | PRED | PO |
|---|---|---|
| úloha snímky p95 (ms) | 19,7 (20,2 / 19,2) | 20,5 (20,0 / 21,0) |
| úloha snímky p50 (ms) | 6,8 | 6,7 |
| snímky > 16,7 ms | 10,3 % | 7,1 % |
| dlhé úlohy > 50 ms | 1 | 1 |
| LoAF > 50 ms | 127 | 126 |
| rAF p95 (ms) | 992 | 1 033 |
| WebGL kontexty | 2 | 2 |
| posun (px) | 6 300 | 6 300 |
| triedy | `world … world-in` | `world … world-in` |

rAF okolo 1 s je softvérové kreslenie filmu v kontajneri a platí rovnako pre oba stromy. Hlavné vlákno sa nezhoršilo: rozdiel +0,8 ms
je v rozptyle behov.

### Brána (`data/brana.json`, s podvrhom GPU)

| prípad | PRED | PO |
|---|---|---|
| telefón bez parametrov | `world … world-in`, 2 GL | `lite world-off`, 0 GL |
| telefón `?film=on` | `world-in`, 2 GL | `world pro` po 6 s (prológ ešte beží), pozri nižšie |
| okno 600×900 s myšou | `world-in`, 2 GL | `world-in`, 2 GL (V3 splnené) |
| obmedzený pohyb | `world-off`, 0 animácií | `lite world-off`, 0 bežiacich animácií |

`?film=on` na telefóne PO som overil zvlášť (`nastroje/filmon.mjs`, bez emulácie siete a CPU, 16 s):
- triedy sa menia `world pro` → `world pro world-in` → `world world-in`,
- `canvas: true`,
- žiadna 404,
- načíta `assets/film.js` a `assets/vendor/three.module.min.js`.

Rovnako sa správa PRED. **?film=on teda film na telefóne zapne.**

## 4. Vyhodnotenie

**Splnené (merané):**
1. Na telefóne nie je WebGL: 0 kontextov v každom behu PO (štart, skrol). PRED má 2.
2. Plynulejší skrol:
   - úloha snímky p95 klesla o 73–75 % pri všetkých štyroch profiloch,
   - snímky > 16,7 ms klesli z 35–49 % na 3–11 %,
   - rAF p95 kleslo zo 400–483 ms na 33,4 ms.
3. Dlhé úlohy > 50 ms v okne skrolu klesli z 19–62 na 1–3.
4. Ľahšia prvá obrazovka: 1 050 kB proti 2 161 kB (−51 %), 18 požiadaviek proti 25. Fotka úvodu sa stiahne raz (`rohozka-m-1448.avif`).
   PRED ju sťahuje 2× (`vstup-m-1448.avif`).
5. Celá stránka na Fast 4G: 6,40 MB proti 11,47 MB (−44 %).
6. Najviac 1 hrajúce video naraz (ako PRED).
7. Na Fast 4G nie je počas štartu ani skrolu žiadna viditeľná neúplná fotka (0 vzoriek, pasívna sonda).
8. Čierny štart pri `/#tim`: tma klesla z 85 % na 18 %. Pri znovunačítaní a návrate späť je tma ≤ 9 % a na konci je fotka.
9. Prvá fotka s nadpisom na Fast 4G: o 22–34 % skôr. V PO prichádza fotka a nadpis v tej istej snímke.
10. Počítač: film beží (`world-in`, 2 GL), p95 19,7 → 20,5 ms v rozptyle behov.
11. Okno 600×900 s myšou ostáva na filme. `?film=on` film na telefóne zapne. Obmedzený pohyb vypne animácie.

**Nesplnené alebo nezlepšené:**
1. **Prvý obraz nie je fotka.**
   - V PO aj PRED je snímka FCP tmavá, vidno len lištu (`d40` = 1,00), `pasy/start-c4f-po-1.jpg`.
   - Fotka príde 670 ms po FCP na Fast 4G a 2,4 s po FCP na Slow 4G.
   - Kritérium majiteľa „prvý obraz hneď fotka z HTML s nadpisom, nikdy čierna plocha“ teda neplatí.
2. **Tma v prvých 3 s po FCP sa nezlepšila.**
   - Fast 4G: 22 % → 22 % (4×), 23 % → 25 % (6×).
   - **Slow 4G je horšie:** 72 % → 80 % (4×), 72 % → 79 % (6×).
   - Prvá fotka na Slow 4G príde o 150–220 ms neskôr: 5 172 → 5 394 ms, 5 247 → 5 404 ms.
   - Pravdepodobná príčina je veľkosť súboru. PO kreslí ako prvú `rohozka-m-1448.avif` (438 359 B, `ls -l`), PRED kreslí
     `vstup-m-1448.avif` z prológu (327 096 B).
3. **Na Slow 4G sa obraz 1,5 s neprekreslí.**
   - Nadpis je podľa DOM sondy viditeľný od 3,25 s (`h1At` 3 251 ms).
   - Screencast však medzi 3,05 s a 4,74 s nemá žiadnu novú snímku a nadpis sa objaví až pri 4,74 s
     (`pasy/start-c4s-po-1.jpg`; PRED rovnako).
   - Príčinu som neoveril: dlhá úloha pri štarte alebo čakanie na písmo či skript. Treba stopu štartu na Slow 4G.
4. **LoAF > 50 ms v okne skrolu nie je 0** (SKEPTIK doplniť 11).
   - PO má 16–27 LoAF, spolu 1,4–3,5 s.
   - Najdlhší LoAF trvá 334–479 ms, pri jednotlivých behoch až 606 ms.
5. **Relatívny cieľ SKEPTIK doplniť 11 (p95 aspoň o 35 % nižšie ako D1 bez filmu) nie je splnený.**
   - PO proti pred0: 14,5 vs 16,8 ms (−14 %) pri 4×, 21,3 vs 27,1 ms (−21 %) pri 6×.
   - Výhrada: pred0 je pokojná verzia `world-frame`, nie presne `?film=off`.
6. **Celá stránka PO je ťažšia ako D1 bez filmu:** 6,40 MB proti 2,97 MB.
   - Z toho 2,88 MB je slučka Tím z L6 (`tim-slucka-864.mp4`, staviteľ B uvádza 3,4 MB, 60 fps).
   - Pre „ľahký ako pierko“ je to najväčšia jednotlivá položka (L4 a menšie video vyžadujú súhlas majiteľa).
7. **Neúplné fotky na Slow 4G.**
   - Fotka úvodu je viditeľná ako prázdna plocha ešte pred stiahnutím, 15–17 vzoriek, teda 1,5–1,7 s.
   - V PO pri skrole na Slow 4G aj `naradie-noznice-1600.avif` 2–3 vzorky (0,2–0,3 s).
   - Čiastočne vykreslenú fotku Chromium pri AVIF neukazuje. Ide o prázdnu plochu, nie o „rozbitú“ fotku.
   - Kritérium L3 „nikdy neúplná“ pre fotky záberov na Slow 4G pri skrole drží: kľúče záberov sa okrem úvodu pri štarte
     neobjavili.
8. `/#kontakt`: oba stromy na 0,5–1 s ukážu úvod a až potom skočia na pätičku. Nie je to čierna plocha, ale je to skok.

**Výhrady merania:**
- PRED skrol: 12 švihov posunie D1 vždy len na 5 500 px, PO o 8 300–9 300 px. Okno D1 trvá asi 100 s, lebo hlavné vlákno pri
  softvérovom filme nestíha dotykové udalosti. Čísla na snímku sú preto porovnateľné, celkové súčty (LoAF spolu, dlhé úlohy spolu)
  sú v D1 za dlhší čas.
- Bajty celej stránky na Slow 4G nie sú úplné. Pri rýchlom prechode sa nestiahnu zábery, ktoré sa nezobrazili, a slučka Tím.

## 5. Čo emulácia nepotvrdí

Platí SPEC časť 3, body 1–7:
- dekódovanie AVIF v Safari na hlavnom vlákne,
- výber `srcset` vo WebKite,
- WKWebView v aplikácii Claude,
- skutočná plynulosť a teplo.

K tomu v tomto meraní:
- **Čísla PRED s filmom sú z podvrhnutého GPU a softvérového kreslenia.** Na iPhone s grafikou bude D1 rýchlejší, než ukazujú
  tieto čísla. Rozdiel PO proti PRED je preto pravdepodobne nadhodnotený.
- Poctivý dolný odhad prínosu je porovnanie PO s pred0: p95 −14 až −21 %, dlhé úlohy 1–3 proti 3–5.
- Konečné potvrdenie: Safari Web Inspector na iPhone (Timelines: Rendering, Images, Memory) a pohľad majiteľa na lite proti `?film=on`.

## 6. Upratanie

- Servery 8600 a 8604 som ukončil (`curl` → 000).
- Žiadny prehliadač nebeží (`ps … | grep -cE '^/opt/pw-browsers'` → 0).
- Snímky screencastu sa po rozbore zmazali, `tmp/` a `pilot/` sú odstránené. `meranie-1/` má 4,5 MB.
- Do `hs-lahky` a `hs-pred-d1` som nič nezapísal a necommitol.
