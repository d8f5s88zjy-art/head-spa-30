## Audit výkonu na telefóne – BARBERSHOP 30 (kľúč `vykon-telefon`)

Toto meranie nadväzuje na beh prerušený o 10:40 UTC. Doplnil som počítač pri CPU 4×, gestá cez `synthesizeScrollGesture`, pokusy A/B, opakované behy pri nižšej záťaži, profil JS, rozbor vrstiev a zaseknutí a Lighthouse. Repozitár `hs2` som nezmenil (`git status` je čistý). Server na porte 8433 je zastavený. Stopy väčšie ako 50 MB som po rozbore zmazal.

### 1. Zhrnutie
- **Bežný telefón dostane film.** Brána v `index.html:12` pustí film každému telefónu, ktorý má WebGL2, nemá zapnuté obmedzenie pohybu ani šetrenie dát, má na výšku viac ako 500 px, `deviceMemory ≥ 4` a `hardwareConcurrency ≥ 4`. Potom `film.js:99–106` overí grafiku: `failIfMajorPerformanceCaveat` a reťazec renderera nesmie byť softvérový. Odhad je **85–95 % telefónov**. Film nedostanú hlavne Androidy s 3 GB RAM a menej (`deviceMemory` 2), telefóny so šetričom dát a s obmedzením pohybu. Web nemá analytiku, preto je to odhad, nie meranie. V kontajneri dostane „predvolene“ verziu bez filmu, lebo SwiftShader je softvérový. Tá verzia je záloha `world-frame` + `world-off`, nie zážitok bežného telefónu. Pre bežný telefón je smerodajný režim `?film=on`.
- **S filmom (telefón, CPU 4×) je stránka zaseknutá.**
  - CPU hlavného vlákna na snímku: p50 17,5–21,6 ms, p95 68–91 ms.
  - V sekciách vstup‑dnu, remeslo a čakáreň je to 66 / 67 / 82 ms na snímku.
  - Snímky nad 33 ms: 71–87 %. Dlhé úlohy: 33–61 na jeden prechod stránkou.
  - Príčina 1: nahrávanie textúr na hlavnom vlákne. Hlavne sú to sekvencie snímok 720×1280, ktoré má **len telefón**; počítač ukazuje fotku.
  - Príčina 2: film kreslí plnou frekvenciou ešte 3 minúty po každom dotyku.
  - Počítač s filmom pri CPU 1× má na hlavnom vlákne p95 len 15–16 ms. Telefón teda robí viac práce ako počítač.
- **Bez filmu (pokojná verzia) to nie je ďaleko od cieľa, ale cieľ nesplní.**
  - CPU p50 7–9 ms, p95 25–33 ms. Snímky p95 33–50 ms, nad 33 ms 4,8–9,7 % (cieľ ≤ 2 %). Dlhé úlohy: 3–15 na prechod.
  - Pokusy A/B dokázali príčiny: zápis `--sp` na kotvy, nekonečné animácie (ekvalizér hudby, lesk, obiehajúce svetlo, pás služieb) a prechody s `filter: blur`.
  - Keď som ich vypol naraz, CPU p95 kleslo na 13,8–19,1 ms, snímky nad 33 ms na 1,5–2,2 % a dlhé úlohy na 0–3.
- **Prechody.**
  - Bez filmu pri CPU 4× je INP 56–208 ms. Pri CPU 6× je menu 224 ms a vernostná karta 280 ms, oboje cez cieľ 200 ms. Príčinou sú vynútené prepočty pri `focus()`, `showModal()` a `overflow: hidden`.
  - S filmom je INP 432–3 496 ms, lebo hlavné vlákno a GPU sú plné.
- **Načítanie.** LCP je text, 0,78–0,89 s pri emulácii Fast 4G, teda v poriadku. TBT bez filmu je 78–396 ms, s filmom 916–964 ms. Lighthouse mobil pod záťažou stroja dal 55–77 bodov a počítač 99; cieľ 95 pre mobil nie je splnený.
- **Počítač.** Hlavné vlákno pri CPU 1× zvláda (p95 7–8 ms). Snímky brzdí `backdrop-filter`: pokus A/B ho bez blur zrýchlil z 45 % pomalých snímok na 10 %. K tomu prispieva plynulé koliesko cez `scrollTo` na hlavnom vlákne.

### 2. Metodika a prostredie
- **Stroj a prehliadač.** Headless Chromium 141 (Playwright 1.56), WebGL cez SwiftShader v procese GPU, 4 jadrá. Počas meraní na stroji bežali ďalšie audity, záťaž bola 3–18.
  - Preto popri časoch snímok (rAF) meriam aj **čas CPU vlákna** (`tdur` zo stopy). Ten nezahŕňa čakanie na jadro, ale spomalenie CPU áno: CPU 4× dalo 3,1–3,5× viac `tdur` ako 1× (`v2/probe-tdur.mjs`).
  - Pri záťaži 9 boli časy udalostí nafúknuté 1,66×, kým `tdur` nie.
  - Stĺpce „CPU“ sú preto to, čo zadanie volá **(b) práca hlavného vlákna bez GPU** (bez čakania na kompozítor a GPU). Časy snímok sú **(a) celá stránka**; v kontajneri ich zhoršuje softvérové kreslenie a rastrovanie.
- **Telefón.** 390×844, DPR 3, `isMobile`, `hasTouch`, UA Pixel 7. CPU 4× a 6× cez `Emulation.setCPUThrottlingRate`. Sieť Fast 4G cez `Network.emulateNetworkConditions` (165 ms, 9 Mb/s × 0,9).
- **Počítač.** 1440×900, CPU 1× a 4×.
- **Gestá.** Dotyk cez `Input.dispatchTouchEvent`, ktorý vytvorí skutočný švih so zotrvačnosťou. Použil som štyri prechody stránkou:
  - pomalý ťah: 300 px za 450 ms so zastavením prsta,
  - stredný švih: 420 px za 180 ms, asi 2 300 px/s,
  - rýchly švih: 560 px za 80 ms, asi 7 000 px/s,
  - rýchly švih späť hore.
- **`Input.synthesizeScrollGesture` s `gestureSourceType: 'touch'` v tomto headless Chromiu nič neposunie**, ani na prázdnej stránke (`v2/probe-synth.mjs`: touch 0 px, default 598 px, mouse 601 px; `probe-synth2.mjs` overil všetky kombinácie emulácie). `meraj.mjs --gesto=synth` preto používa zdroj `mouse` pri 700 / 2 200 / 6 500 px/s. Výsledky sú zhodné s dotykom (tabuľka 4.3).
- **Stopa (Tracing).** Kategórie `devtools.timeline`, `disabled-by-default-devtools.timeline.frame`, `toplevel`, `gpu`, `cc`, `blink`, `v8.execute`, `loading`. Okrem toho PerformanceObserver (`longtask`, `long-animation-frame` so súbor:riadok, `layout-shift`, `largest-contentful-paint`, `event`/INP) a obalenie WebGL volaní (čas, bajty textúr na snímku).
- **Sekcia stránky** sa určuje podľa IntersectionObserver, bez čítania `scrollY`. Na telefóne: úvod 0–844, vstup‑dnu 844–1435, remeslo 1435–2026, čakáreň 2026–2616, tím 2616–4798, služby 4798–9735, galéria 9735–13056, rezervácia 13056–15492, kontakt 15492–16355; výška stránky 16 435 px.

### 3. Merania

#### 3.1 Prvé načítanie (Fast 4G, emulované)
| beh | FCP = LCP (text „Tvoje miesto.“) | TBT | dlhé úlohy (najdlhšia) |
|---|---|---|---|
| telefón CPU 4× bez filmu (2 behy) | 796–840 ms | 142 / 396 ms | 5–8 (183–295 ms) |
| telefón CPU 4× predvolene (kontajner = záloha) | 776–888 ms | 78 / 325 ms | 5–6 (276–279) |
| telefón CPU 4× film | 784–868 ms | 916 / 955 ms | 12–13 (244–376) |
| telefón CPU 6× bez filmu / predvolene / film | 772–804 ms | 351 / 1 040 / 964 ms | 5–13 (284–606) |
| počítač CPU 1× bez filmu / film | 780–852 ms | 0 / 1 074 ms | 2–5 |
| počítač CPU 4× bez filmu / predvolene / film | 864–1 520 ms | 502 / 1 884 / 1 930 ms | 8–13 (do 1 345) |

- CLS je ≤ 0,0005 všade.
- Čo blokuje vykreslenie: `style.css` (72 kB, render-blocking, `index.html:50`) a modul `app.js` (LoAF 114–412 ms, z toho vynútený štýl a layout 26–226 ms: `measure()` a delenie nadpisov na slová pred prvým obrazom).
- S filmom pribudnú ďalšie úlohy:
  - inicializácia scény po importe three.js: 346 ms v jednej úlohe,
  - druhý WebGL kontext na overenie GPU: 50–209 ms,
  - kompilácia shaderov (`getProgramParameter` do 99 ms),
  - prvé snímky filmu do 64 ms.
- Lighthouse 12.8 (simulácia Slow 4G, CPU 4×, záťaž stroja 11–13, preto čísla len orientačne):

| beh | skóre | LCP | TBT |
|---|---|---|---|
| mobil predvolene | 58 / 76 | 3,9–4,3 s | 320–810 ms |
| mobil bez filmu | 55 / 77 | 3,6–4,1 s | 390–1 460 ms |
| počítač | 99 | 0,9 s | 40 ms |

  LCP na mobile tvorí z 88–89 % oneskorenie vykreslenia. Pri prvom behu, keď bola záťaž 16, vyšlo skóre 47.

#### 3.2 Úvodný film (prológ, telefón CPU 4×, `?film=on`)
- Prvý snímok filmu príde po 3,8–4,0 s, prológ končí po 8,9–10,0 s (v kontajneri; čistý čas chôdze je 2,3 s).
- Snímky filmu počas prológu: 7,5–9,2 snímky/s, p50 33–67 ms, p95 267–283 ms, max 1,7–1,8 s.
- Od FCP po koniec prológu je 10–11 dlhých úloh (spolu 1,46 s, najdlhšia 244–376 ms).
- Pri CPU 6× je p95 217 ms a najhoršia snímka 1,5 s.
- V režime predvolene (kontajner) sa prológ hneď po overení GPU zruší (`world-frame`). Prechod trvá 4–5 snímok s p95 317–383 ms.

#### 3.3 Skrol celou stránkou – telefón (rozsahy cez štyri prechody stránkou)

**Tabuľka A – telefón, režimy a gestá**

| beh (záťaž) | snímky p95 | > 33 ms | dlhé úlohy na prechod (max) | CPU p50 | CPU p95 |
|---|---|---|---|---|---|
| CPU 4× bez filmu, r2 (3–5) | 33–50 ms | 4,8–9,2 % | 3–10 (276) | 7,1–9,4 | 25–33 |
| CPU 4× predvolene, r2 (3–4) | 50 | 5,8–9,7 % | 3–15 (123) | 7,3–9,4 | 27–33 |
| CPU 4× film, r2 (10–13) | 0,47–2,6 s (p50 67–200) | 71–87 % | 33–61 (7,9 s) | 17,5–21,6 | 68–91 |
| CPU 6× bez filmu (9) | 67–150 | 11–21 % | 19–61 (1 395) | 7,7–10,1 | 31–44 |
| CPU 6× film (12–13) | 2,3–4,1 s | 82–83 % | 68–87 (4,8 s) | 27–32 | 118–155 |
| CPU 4× bez filmu, gesto synth (10) | 50–67 | 6,3–10,1 % | 1–25 | 4,7–8,2 | 25–30 |
| CPU 4× film, gesto synth (9–10) | 1,8–2,0 s | 53–69 % | 12–26 | 22–23 | 82–151 |

Prvý beh pri záťaži 4–10 (bez CPU stĺpcov) dal pre bez filmu podobný výsledok: snímky p95 33–67 ms a nad 33 ms 3,4–9,6 %.

**Tabuľka B – CPU hlavného vlákna na snímku podľa sekcie (telefón, CPU 4×, r2; v zátvorke najväčšia zložka)**

| sekcia | bez filmu | film |
|---|---|---|
| úvod | 15,6 (štýl 6,1, paint 3,3) | 38,5 (skript 14,2) |
| vstup‑dnu | 16,0 (štýl 6,1) | **66,0 (skript 31,0)** |
| remeslo | 15,6 (štýl 6,6) | **66,8 (skript 35,0)** |
| čakáreň | 16,5 (štýl 5,3) | **81,8 (skript 32,9; čakanie na GPU 168)** |
| tím | 10,3 | 33,5 |
| služby | 9,0 | 16,7 |
| galéria | 10,3 | 20,3 |
| rezervácia | 14,0 (štýl 4,6) | 37,2 (štýl 9,4) |
| kontakt | 5,3 | 15,6 |

Pri CPU 6× s filmom: vstup‑dnu 85, remeslo 100, čakáreň 137 ms.

- **WebGL a textúry (film, CPU 4×, r2).**
  - `texSubImage2D`: 660 volaní, spolu 27,4 s, najdlhšie 7,85 s (čaká na GPU proces).
  - Nahraté textúry: 259–402 MB na jeden prechod stránkou, najviac 16–28,6 MB v jednej snímke.
  - `createImageBitmap`: 378× (priemer 374 ms pod záťažou).
  - Film si sám znížil DPR z 2 na 1 (pri CPU 6× na 1,5).
- **Profil JS (`v2/profil-on.json`, film, CPU 4×, skrol 0 → 2 850 px).**
  - `film.js frame` spolu 4,4 s. Z toho `seqDrive` 2,4 s (`initTexture` → `texSubImage2D` 1,74 s), `pump` 0,44 s, `render` z three.js 1,0 s, GC 1,35 s, `createImageBitmap` 0,39 s.
  - `app.js tick` 0,34 s.
  - Čítanie `scrollY` stojí vlastný čas: `app.js:146 readTarget` 0,22 s, `film.js:1348` 0,16 s.
- **Nahrávanie bez súbehu (`nahravanie.mjs`, CPU 4×).**
  - Pás 256 riadkov fotky 1448 px: 6–9 ms. Celá fotka po pásoch 59 ms, naraz 86 ms.
  - Snímka sekvencie 720×1280: 11–36 ms nahratie a 14–50 ms dekódovanie.
  - Hĺbková mapa: 11 ms.
- **Film v pokoji (`necinnost.mjs`).** 15,8 s bez pohybu: 92 nakreslených snímok, GPU proces vyťažený na 96,6 %.
- **Zaseknutia bez filmu pri švihu (`v2/stopy/off-svih-zaseky.txt`).** 57 medzier dlhších ako 150 ms. Počas nich je GPU proces 86 % času v rastrovaní, hlavné vlákno 30 %. Dekódovanie AVIF prebehlo 96× (priemer 81 ms, najdlhšie 251 ms).
- **Vrstvy (`v2/vrstvy.mjs`).**
  - 50–70 vrstiev s plochou 166–200 Mpx pri okne 3 Mpx.
  - Prekryvné vrstvy 390×6909 a 390×5769 css.
  - Rotujúca vrstva 1688×1688 css (25,6 Mpx) obiehajúceho svetla.
  - `.title-card::before` (3,2 Mpx) sa prekreslí 2–6× za jeden ťah.

#### 3.4 Prechody (INP; telefón CPU 4× / 6×)

| prechod | bez filmu | film |
|---|---|---|
| menu otvoriť | 120–168 ms / 216–224 ms (`app.js:443`, vynútený štýl a layout 60–97 ms) | 880–2 504 ms |
| menu zavrieť | 72–80 / 88–136 ms | – |
| skok z menu (Služby) | 56–80 / 88–112 ms | 432–824 ms |
| jazyk (EN/SK) | INP 48–144 ms, ale dlhé úlohy po prepnutí 134–243 ms (CPU 4×) a 289–419 ms (CPU 6×) | 984–3 496 ms |
| vernostná karta otvoriť | 160–208 / 224–280 ms (`vernost.js:159` 91–143 ms, z toho 79–124 ms vynútené) | 1 744–2 064 ms |
| vernostná karta zavrieť | 104–152 / 136–160 ms | – |
| video tím | p95 snímky 16,8 ms, bez dlhých úloh | – |
| Späť na ulicu / Vojdi dnu | – | 344–512 / 416–2 760 ms |

S filmom tvorí INP hlavne čakanie na vstup (až 3,7 s) a oneskorenie zobrazenia; samotné spracovanie trvá menej ako 10 ms.

#### 3.5 Telefón vs. počítač
- **Počítač CPU 1×.**
  - Bez filmu: CPU p50 3,5–3,8 ms, p95 6,9–7,9 ms; snímky p95 217–350 ms (softvérové rastrovanie s backdrop-filter).
  - S filmom: CPU p50 6,4–6,7 ms, p95 15–16 ms; `texSubImage2D` len 134 volaní (max 23 ms), lebo počítač nemá sekvencie.
- **Počítač CPU 4×.** Predvolene CPU p50 16–20 ms, p95 43–53 ms. S filmom p50 25–34 ms, p95 53–89 ms (plynulé koliesko ťahá skrol cez hlavné vlákno).
- **Porovnanie.** Telefón s filmom pri CPU 4× robí na snímku 3–4× viac práce na hlavnom vlákne ako počítač pri CPU 1×. Bez filmu je telefón pri CPU 4× asi 2× horší ako počítač pri CPU 1× a lepší ako počítač pri CPU 4×.
- **A/B počítač CPU 1× bez filmu, bez backdrop-filter.** Snímky nad 33 ms: 44,8 → 10,3 % (stredný skrol) a 41,4 → 13,6 % (rýchly); p50 33,4 → 16,7 ms.

#### 3.6 Pokusy A/B (telefón, bez filmu, CPU 4×; stredný a rýchly švih; `ab-tabulka.txt`)

| pokus | štýl ms/snímku | CPU p50 | CPU p95 | snímky > 33 ms | dlhé úlohy |
|---|---|---|---|---|---|
| základ (2 behy) | 3,0–3,6 | 7,0–8,9 | 28,8–34,1 | 8,3–13,2 % | 1–20 |
| bez zápisu `--sp` | 1,6–1,7 | 6,7–7,0 | 22,9–24,0 | 6,5–8,3 % | 2–5 |
| bez `--o`/`--so` | 2,8–3,8 | 6,9–9,9 | 28,7–31,1 | 9,0–13,1 % | 11–12 |
| bez hudby (`?hudba=off`) | 2,1–3,2 | 5,0–8,1 | 21,5–30,8 | 6,0–6,7 % | 1–4 |
| bez blur prechodov slov a krokov | 2,5–2,7 | 6,1–6,5 | 21,6–24,8 | 5,9–7,5 % | 4–16 |
| bez nekonečných animácií a blur | 2,4–3,4 | 4,9–6,5 | 27,1–28,9 | 2,8–4,6 % | 0–15 |
| bez prejazdu zálohy (`transform`) | 2,7–3,4 | 6,4–9,5 | 28,1–31,4 | 8,6–10,2 % | 6–11 |
| bez záloh kariet (diagnostika) | 2,6–3,0 | 6,5–8,4 | 22,3–28,2 | 3,8–5,8 % | 2–4 |
| **všetko spolu** (bez `--sp`, hudby, blur, nekonečných animácií) | **0,5–0,8** | **3,8–4,0** | **13,8–19,1** | **1,5–2,2 %** | **0–3** |

### 4. Nálezy
Podrobnosti sú v poli `nalezy`. Poradie podľa dopadu:

| ID | závažnosť | nález |
|---|---|---|
| T1 | kritická | Nahrávanie sekvencií, pásov fotiek a videa do grafiky na hlavnom vlákne |
| T2 | kritická | Film kreslí plnou frekvenciou 3 min po každom dotyku (`BREATH_MS`) |
| T3 | vysoká | Zápisy CSS premenných na kotvy v každej snímke (`--sp`) |
| T4 | vysoká | Nekonečné animácie a blur prechody počas skrolu; hudba sa na telefóne pustí po ťuknutí |
| T5 | vysoká | Prelínanie titulnej karty prekresľuje celú obrazovku |
| T6 | stredná | Rastrovanie a dekódovanie veľkých záloh pri švihu |
| T7 | stredná | Vynútené prepočty v menu, vernostnej karte, jazyku a tabuli hodín |
| T8 | stredná | Úvodný film a prvé načítanie |
| T9 | stredná | Počítač: backdrop-filter a plynulé koliesko |
| T10 | stredná | Film si trvalo zníži rozlíšenie |
| T11 | nízka | Lišta animovaná cez nekompozitné vlastnosti |

### 5. Odporúčané poradie opráv a odhad dopadu
1. **T1 + T2 (film).**
   - Sekvencie nahradiť videom s každou snímkou kľúčovou (mód `scroll` už existuje) alebo atlasom v KTX2/Basis.
   - Nahrávať najviac 1 textúru za snímku a nie počas rýchleho švihu.
   - V pokoji nekresliť.
   - Odhad: CPU v sekciách vstup‑dnu až čakáreň klesne zo 66–82 na približne 20–30 ms pri CPU 4×; GPU v pokoji pod 10 %; INP s filmom pod 200 ms. Overenie: `meraj.mjs --film=on`, `v2/profil.mjs`, `necinnost.mjs`.
2. **T3 + T4 + T5 (pokojná verzia aj obsah nad filmom).**
   - Efekty viazané na skrol presunúť do CSS scroll-driven animácií alebo zapisovať priamo na cieľový prvok.
   - Pozastaviť nekonečné animácie počas skrolu a slová bez blur.
   - `.title-frame { will-change: opacity }`.
   - Podľa A/B je dosiahnuteľné CPU p95 14–19 ms a snímky nad 33 ms okolo 2 %.
3. **T7.** Focus v ďalšej snímke, menu bez `overflow` na body, `content-visibility` na pásoch, tabuľa bez `offsetWidth`. Cieľ: INP pod 120 ms pri CPU 6×.
4. **T8.** Kritické CSS inline, `app.js` bez vynúteného layoutu pred prvým obrazom, inicializáciu filmu rozdeliť na viac úloh. Cieľ: TBT bez filmu pod 150 ms, s filmom pod 400 ms; Lighthouse mobil ≥ 95 overiť na stroji bez súbežnej záťaže.
5. **T6, T9, T10, T11.**

Každá oprava sa overí tým istým `matica.sh` (pred/po: `node suhrn.mjs <pred> <po>`) a A/B tabuľkou (`ab.mjs`). Pri súbežných meraniach porovnávať stĺpce CPU, nie časy snímok.

### 6. Obmedzenia
- **Kontajner nemá GPU.** Časy snímok s filmom a pri rýchlom švihu sú horšie ako na telefóne (rastrovanie a kreslenie softvérovo, `texSubImage2D` čaká na GPU proces sekundy). Práca hlavného vlákna (CPU) a počty a bajty nahrávaní sú prenosné.
- **Spomalenie CPU** sa týka hlavného vlákna; dekódovacie a rastrovacie vlákna spomalené nie sú.
- **Lighthouse** bežal pri záťaži stroja 11–13, preto sú jeho čísla len orientačné.
- **INP** pochádza z jedného ťuknutia na prechod, je to orientačná hodnota.
- **Jazyk a vernostná karta** sa merali s `--vernost=1`: atribút `data-zapnute` vložený pri teste, ako po nasadení s adminom.