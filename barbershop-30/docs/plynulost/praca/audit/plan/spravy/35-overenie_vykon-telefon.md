Všetky skripty, výsledky a stopy sú v `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/barber/audit/overenie-vykon-telefon/`. Repozitár som nemenil, `git status` je čistý.

# Overenie auditu „vykon-telefon“ (skeptický overovateľ, 20. 10. 2026)

## Výsledok v skratke

| ID | Pôvodne | Po overení | Verdikt |
|---|---|---|---|
| T1 sekvencie snímok | kritická | **vysoká** | platí, ale čísla boli nafúknuté čakaním na SwiftShader; navrhnutá oprava ide proti rozhodnutiu majiteľa |
| T2 kreslenie v pokoji | kritická | **stredná** | mechanizmus platí, INP 1,3–3,5 s je artefakt kontajnera; neplatí tvrdenie o troch priechodoch v pokoji |
| T3 zápis `--sp` | vysoká | **stredná** | platí: štýl −50 %; zlepšenie p95 a menej dlhých úloh sa nezopakovalo |
| T4 nekonečné animácie | vysoká | **stredná** | platí počas skrolu (p50 −1,7 až −2,0 ms), v pokoji nič nestoja; hudba na telefóne je zdokumentovaná funkcia |
| T5 prelínanie karty | vysoká | **nízka** | prekresľovanie je potvrdené, na hlavnom vlákne sa však nedá namerať úspora |
| T6 zálohy pri švihu | stredná | **stredná** | platí len oneskorené dekódovanie a vrstvy; medzery 0,3–2,8 s sú softvérové rastrovanie |
| T7 interakcie | stredná | **stredná** | platí (menu pri CPU 6× 216 ms, po prepnutí jazyka úlohy 178–318 ms, tabuľa hodín) |
| T8 prvé načítanie | stredná | **stredná** | Lighthouse 55–77 je vyvrátené (s gzip 95–96); neplatí ani tvrdenie, že app.js vynúti layout pred prvým obrazom; platí LCP 2,7–2,9 s a dlhé úlohy pri štarte |
| T9 počítač (backdrop, koliesko) | stredná | — | **vyvrátené** |
| T10 adaptívne DPR | stredná | **nízka** | chyba v logike je skutočná, prepad DPR na 1 kvôli nahrávaniu sa v kontajneri nepotvrdil |
| T11 lišta a nadpis úvodu | nízka | — | **vyvrátené** (s JS animácia lišty nebeží, ostatné sa spustí raz) |

## Metodika a podmienky

- Server `python3 -m http.server 8544` v koreni `hs2` (podľa vzorca 8100 + 12×37). Na Lighthouse som použil aj `gzip-server.py` na porte 8545 (gzip ako GitHub Pages). Adresa `/barbershop-30/`. Na stroji súbežne bežal iný audit, záťaž bola 5–12 (pri Lighthouse 0,7–1,2).
- Telefón 390×844, DPR 3, dotyk. Skrol cez `Input.dispatchTouchEvent`: stredný ťah 420 px za 180 ms, švih 560 px za 80 ms, pauza 450 ms. Fast 4G: 165 ms RTT, 9 Mb/s × 0,9. CPU 1×, 4× a 6× cez `Emulation.setCPUThrottlingRate`.
- Merané z `Tracing`: čas vlákna (tdur) na snímku medzi `BeginMainThreadFrame`, rozklad na štýl, layout, paint a skript, sekcie stránky (kotva `performance.mark`). Ďalej čas vlákna jednotlivých volaní `film.js frame`, Event Timing (INP) a stav vrstiev (`LayerTree`). Všetky A/B zámeny som robil cez `page.route` alebo vložený skript, nie v repozitári.

### Tri chyby metodiky pôvodného auditu (dôležité pre všetky čísla)

1. **Čas vlákna pri CPU 4× obsahuje čakanie, nie je „bez čakania“.** Spomaľovač CDP pripočíta 50–68 % blokujúceho čakania do času vlákna (`vysledky/metodika-spomalenie.txt`):
   - synchrónne XHR 500 ms: pri CPU 1× 2 ms vlákna, pri CPU 4× 342–348 ms;
   - čakanie na GPU (readPixels): pri CPU 1× 1–2 ms, pri CPU 4× 22,7–25,3 s.
   
   V kontajneri so SwiftShader preto „CPU na snímku“ pri 4× nafukujú čakania na softvérovú grafiku. Dlhé úlohy pri švihu (film=off, 4×) sú hlavne `Commit` a čakanie: úloha 645 ms steny / 458 ms vlákna mala len ~10 ms vnorených udalostí. Pri CPU 1× film=off nemala žiadna úloha viac ako 10,3 ms vlákna. Čistú CPU prácu som preto meral pri CPU 1× a násobil ~4.
2. **S filmom trvajú snímky v kontajneri 100–1 000 ms** (rAF p95 350–1 133 ms). „CPU na snímku“ potom sčíta prácu z mnohých skutočných snímok. Spoľahlivejší je čas jedného volania `film.js frame`.
3. **python http.server nekomprimuje.** HTML má 84 kB, style.css 72 kB a film.js 104 kB namiesto 14 / 18 / 37 kB s gzip. Lighthouse bez gzip dal mobil 82–83, s gzip pri rovnakej (nízkej) záťaži 95–96.

Meracia sonda (rAF, ktorý číta scrollY) stojí 0,12 ms na snímku pri CPU 1× a 0,6–1,3 ms pri 4×. Je rovnaká v oboch variantoch A/B.

## Merania podľa nálezov

### T1 – sekvencie snímok (`?film=on`, skrol 0 → 2 900 px)

| beh | skript na snímku vstup-dnu / remeslo / čakáreň | film frame p95 / max | objem textúr |
|---|---|---|---|
| CPU 1×, so sekvenciami | 3,09 / 6,19 / 3,66 ms | 4,5 / 20,6 ms | 420 MB |
| CPU 1×, bez sekvencií | 1,37 / 1,25 / 1,34 ms | 0,8 / 6,0 ms | 95 MB |
| CPU 1×, 1 nahratie za snímku | 3,37 / 6,82 / 4,10 ms | 8,8 / 15,0 ms | 398 MB |
| CPU 4×, so sekvenciami | 18,2 / 28,8 / 18,2 ms | p90 23, p95 32, max 204 ms (10 volaní nad 50 ms) | 435 MB |
| CPU 4×, bez sekvencií | 9,6 / 6,0 / 7,2 ms | p90 6,3, p95 9,7 ms (1 volanie nad 50 ms) | 110 MB |

- Samostatné nahratie pri CPU 1×: snímka 720×1280 p50 4,1 ms (max 6,9), dve snímky 9,2 ms, pás 1448×256 1,7 ms. Dekódovanie `createImageBitmap` beží mimo hlavného vlákna (samotné volanie 0,7 ms).
- Z čoho sa nahratie skladá (CPU 4×): ImageBitmap 18–30 ms, ImageBitmap bez úprav alfy 15–21 ms, surové RGBA 1,7–5,3 ms. Väčšinu teda tvorí prevod pixelov; na Linuxe (BGRA) je drahší, na Androide (RGBA) môže byť lacnejší.
- Stena volaní texSubImage2D pri CPU 1× bola spolu 2 158 ms, čas vlákna všetkých `frame` len 1 025 ms. Pôvodných 27,4 s a 7,85 s je teda čakanie na SwiftShader.

### T2 – kreslenie v pokoji (`necinnost.mjs`, `inp.mjs`)

- V pokoji: 1 kreslenie a 0 render targetov na snímku (26 z 26 snímok pri 1×, 10 z 10 pri 4×). Jedno volanie `film.js frame` stojí 0,40 ms vlákna pri CPU 1×, čo je ≈1,6 ms pri 4×, teda asi 10 % hlavného vlákna pri 60 Hz a 19 % pri 120 Hz.
- Výpočet driftu kamery (DRIFT 0,6, DPR 2): najviac 0,013–0,024 px zariadenia na snímku pri 60 Hz, spolu do 1,5 px/s.
- INP v kontajneri (y=2 700, CPU 4×):

  | interakcia | dnes | kreslenie v pokoji zastavené po 2 s |
  |---|---|---|
  | menu otvor | 1 592 ms | 96 ms |
  | menu zavri | 1 776 ms | 664 ms |
  | jazyk EN | 14 664 ms | 10 464 ms |

  Jazyk je pomalý v oboch variantoch a hlavné vlákno pritom nič nerobí, takže ide o artefakt SwiftShader. Pri filme vypnutom je INP 56–144 ms.

### T3 – zápis `--sp` (film=off, CPU 4×, celá stránka, 2 striedavé opakovania)

| variant | štýl na snímku | prvkov v prepočte | CPU p50 | CPU p95 |
|---|---|---|---|---|
| základ | 2,62 / 3,93 ms | 14,8 / 14,5 | 6,0 / 6,4 ms | 27,5 / 33,1 ms |
| bez `--sp` | 1,28 / 1,31 ms | 7,7 / 7,2 | 5,3 / 5,8 ms | 29,2 / 27,7 ms |

### T4 – nekonečné animácie (hudba pustená ťuknutím)

| variant | CPU p50 | štýl | skript |
|---|---|---|---|
| s animáciami | 6,6 / 6,9 ms | 3,04 / 3,44 ms | 2,69 / 2,44 ms |
| pozastavené | 4,9 / 4,9 ms | 2,60 / 2,58 ms | 1,65 / 1,48 ms |

- p95 sa nezmenilo (25,9 / 31,1 oproti 26,9 / 30,2 ms).
- V pokoji animácie nič nestoja: 0,1 prepočtu štýlu za sekundu, 0 paint.
- Vrstva 1688×1688 css (25,6 Mpx pri DPR 3) existuje od y=2 300 po koniec stránky.

### T5 – prelínanie karty

- `.title-card::before` sa pri ťahu 120 px prekreslí 2–6× (y = 2 300, 10 000, 13 300). `.title-frame` 390×844 sa prekreslí 9× (y = 5 200).
- A/B `.title-frame{will-change:opacity}`: paint 3,56 / 2,96 → 3,11 / 2,89 ms, rozdiel v šume.

### T6 – švih pri film=off

- Dekódovanie (stopa švihu, CPU 4×): ImageDecodeTask 18×, stena p50 27 ms, max 78 ms.
- Vrstvy: 36–42 kresliacich vrstiev, plocha 166–200 Mpx. Prekryvné vrstvy 390×6909 a 390×5769 css.

### T7 – interakcie (film=off, y=2 700)

- Menu otvor: INP 112 a 136 ms pri CPU 4× (obsluha 36–50 ms, z toho vynútený štýl a layout 33–43 ms); 216 ms pri CPU 6×.
- Jazyk: INP 56–144 ms, ale nasledujú úlohy vykresľovania 178–211 ms vlákna pri 4× a 146–318 ms pri 6×. Úloha s 211 ms = štýl 849 prvkov 70 ms + layout 119 ms.
- Tabuľa hodín (`app.js:694`): 152 volaní, 505–735 ms pri CPU 4×.

### T8 – prvé načítanie (`nacitanie.mjs`, bez vyrovnávacej pamäte)

| beh | dlhé úlohy | TBT (stena) | poznámka |
|---|---|---|---|
| film=off, CPU 4× | 7 | 444 ms | |
| predvolene (záloha), CPU 4× | 8 | 617 ms | |
| film=on, CPU 4× | 11 | 1 319 ms | overenie GPU 544 ms steny / 352 ms vlákna |
| film=on, CPU 1× | 1 skutočná | — | overenie GPU 1 115 ms steny, ale len 11 ms vlákna |
| film=off, CPU 1× | 1 (59 ms) | 0 | |

- LCP je text `span.w` úvodu: 0,75–0,99 s.
- Lighthouse s gzip pri nízkej záťaži: mobil 95 a 96 (TBT 10–20 ms, CLS 0, FCP 1,6–1,7 s, LCP 2,7–2,9 s), počítač 98.

## Čo som vyvrátil a prečo

- **T9 (počítač: backdrop-filter, koliesko).** `.board` v index.html vôbec nie je (0 výskytov), takže `style.css:542` je mŕtve CSS. Na počítači má backdrop-filter len lišta (7 % okna, keď je `is-scrolled`) a `.chip` 105×35 (`sonda2.mjs`). Rozdiel v A/B (44,8 → 10,3 % pomalých snímok) pochádza zo softvérového skladania obrazu v kontajneri. Hlavné vlákno pri CPU 1× má p50 3,5–4,1 ms. Plynulé koliesko je výslovné rozhodnutie majiteľa (MASTER_BRIEF §2 „Plynulosť ako video“). Lighthouse počítač dal 98.
- **T11 (lišta a nadpis úvodu).** Animácia `header-bg` platí len pre `html:not([data-scene-active])` a app.js tento atribút nastaví hneď pri štarte. `getAnimations()` na lište je prázdne. Prekreslenie lišty 18× spôsobuje 300 ms prechod `background-color` pri prepnutí `is-scrolled` na y=80, a to raz. `zaostrenie` nadpisu úvodu je po načítaní `finished`. Prechody s blur na `.kin` a `.steps` patria do T4.
- **Čiastočne vyvrátené:**
  - T1: stena texSubImage2D 27,4 s / 7,85 s je čakanie na SwiftShader. VideoTexture nie je významná. „Dekódovanie 14–50 ms“ je asynchrónne mimo hlavného vlákna.
  - T2: v pokoji sa nekreslia tri celoobrazovkové priechody, len jeden. INP 1,3–3,5 s na telefóne nie je preukázané.
  - T3: zlepšenie p95 34 → 23 ms a dlhé úlohy 18 → 5 sa nezopakovali. Vynútený prepočet cez `readTarget` sa nepreukázal; LoAF bol meraný so sondou, ktorá tiež číta scrollY.
  - T4: „tretinový podiel snímok nad 33 ms“ je stena v kontajneri.
  - T5: úspora −2 ms paint sa nepotvrdila.
  - T6: medzery 0,3–2,8 s sú softvérové rastrovanie.
  - T8: Lighthouse 55–77 bol pri záťaži 11–13 a bez gzip. „app.js vynúti layout pred prvým obrazom“ neplatí: v stope pri CPU 1× bol prvý obraz o 676 ms, app.js sa vyhodnotil o 788 ms bez štýlu či layoutu nad 1,5 ms. style.css má s gzip 18 kB a Lighthouse odhaduje úsporu len 150 ms.
  - T10: v mojich behoch skončilo DPR na 2 / 1,75 / 1 / 1,5 / 1,25. Klesá aj bez sekvencií, čo spôsobuje SwiftShader.
- **Navrhnuté opravy, ktoré idú proti rozhodnutiam majiteľa:**
  - T1 „späť na video so seek“: sekvencie zaviedol majiteľ 2026-10-11, lebo video pri posune pôsobilo zaseknuto (CHECKS §12).
  - T2 „zastaviť po 3–5 s, 24–30 snímok/s“: stály pohyb kamery je rozhodnutie z 2026-10-09 a 10-11.
  - T4 hudba na telefóne: README ju výslovne uvádza („pri prvom kliknutí alebo ťuknutí“), ZADANIE ju spomína len pri počítači. Rozhodne majiteľ.
  - Navrhujem opravy, ktoré vzhľad zachovajú (pozri nálezy).

## Odporúčané poradie opráv

1. **T1: menej bajtov sekvencií** (KTX2/Basis ETC2/ASTC alebo WebCodecs `VideoFrame`) a predalokované textúry. Odhad ≈ −8 až −20 ms na snímku pri CPU 4× vo vstupe a remesle.
2. **T2: v pokoji kresliť len pri posune obrazu ≥ 0,25 px** a nekresliť pod nepriehľadným pásom. Odhad −90 % snímok v pokoji, vzhľad sa nezmení.
3. **T7 a T8: `content-visibility: auto` pre sekcie mimo okna.** Skráti celostránkový štýl a layout pri štarte, jazyku aj menu.
4. **T3:** transform priamo na cieľový prvok. Odhad −1,3 až −2,6 ms štýlu na snímku.
5. **T4:** pozastaviť nekonečné animácie počas skrolu. Odhad −1,7 až −2 ms p50.
6. **T6:** dekódovať zálohy vopred cez `decode()`, na telefóne menšia záloha. Spolu s auditom cierne-okna.
7. **T5 a T10:** malé, lacné úpravy.

Každú opravu treba overiť pri CPU 1× (čistý čas vlákna) a Lighthouse spúšťať na serveri s gzip pri nízkej záťaži.