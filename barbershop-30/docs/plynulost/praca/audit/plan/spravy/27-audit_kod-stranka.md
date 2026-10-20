# Code review stránky BARBERSHOP 30: plynulosť na telefóne a čierne okná (kod-stranka)

## Zhrnutie
Najviac času na snímku pri skrolovaní na telefóne stojí **prepočet štýlu (39 % práce hlavného vlákna v snímke)**. Spôsobujú ho tri CSS premenné, ktoré app.js v každej snímke zapisuje na kotvu `.film-shot`. Kotva ich dedí do 18 a viac prvkov, hoci každú číta len jeden prvok. Pokus A/B, ktorý repozitár nemení a súbory podvrhne cez page.route, zapisoval premenné priamo na prvok, ktorý ich číta (registrované cez `@property`, `inherits: false`). Výsledok, medián 3 + 3 behov:
- štýl na snímku: 3,27 → 1,42 ms; p95 štýlu: 16,5 → 5,3 ms;
- úloha snímky: p95 27,8 → 19,0 ms; snímky nad 16,7 ms: 15,8 → 7,3 %;
- interval rAF: p95 50 → 33 ms; snímky nad 33 ms: 7,1 → 3,5 %;
- dlhé úlohy: 13 → 6; štýl spolu za beh: 8,4 → 4,1 s.

Ďalej som našiel tri jednorazové zamrznutia nad 100 ms na začiatku návštevy. Všetky prídu pri prvom ťahu prstom, keď sa načíta atmosféra a jazyky:
- `i18n.css` pridá `@font-face` Manrope a tým vynúti rozloženie celej stránky. Snímka trvá 208 až 309 ms.
- `new AudioContext` v `touchend` trvá 47 až 97 ms.
- `decodeAudioData` dá snímku 98 až 159 ms.

K čiernym oknám prispieva kód stránky takto:
- **Zálohy kariet sa dekódujú až v okamihu zobrazenia.** Dekódovanie AVIF trvá 22 až 617 ms a začína 28 až 70 ms po triede `is-shown`.
- **Portréty v páse tímu sú 100 ms po švihu prázdne**, hoci sú stiahnuté.
- **Skok z menu plynulým skrolom prejde všetkými kartami.** Počas jedného skoku sa začne sťahovať 15 obrázkov.

## Metodika
- Prehliadač: Chromium 141 headless (Playwright z /opt/node22). Server: `python3 -m http.server 8285` (bez gzipu), adresa `http://127.0.0.1:8285/barbershop-30/?uvod=off`.
- Telefón: 390×844, DPR 3, isMobile, dotyk, locale sk-SK. CPU spomalené 4× (`Emulation.setCPUThrottlingRate`), sieť Fast 4G (165 ms, 9 Mb/s × 0,9).
- Skrol skutočným dotykom cez `Input.dispatchTouchEvent`, lebo `synthesizeScrollGesture` s dotykom v tomto Chromiu neskroluje.
  - „stredne“: ťahy po 600 px rýchlosťou 1300 px/s, pauza 120 ms, celou stránkou (15 591 px) nadol a potom nahor po 1800 px.
  - „švih“: 12 + 12 švihov po 700 px rýchlosťou 5000 px/s s doťahom.
  - „prvý dotyk“: ťahy 1,2 s po načítaní.
  - „kontakt“: pomalý príchod k rezervácii, potom 5 s pokoj.
- Kontajner nemá grafickú kartu. Brána filmu ho preto vypne (`html.world-frame world-off`) a meria sa pokojná verzia. To je meranie (b) zo zadania: práca hlavného vlákna stránky bez filmu. Film rieši audit kod-film.
- Zdroje údajov:
  - CDP Tracing (toplevel, devtools.timeline, invalidationTracking pre príčiny);
  - Long Animation Frames so zdrojom skriptu a časom vynúteného štýlu a rozloženia;
  - Event Timing (INP), LayerTree, CPU profil a mikromerania „zápis + vynútený prepočet“.
- Pozor: kategória `disabled-by-default-devtools.timeline.picture` predĺži Commit na sekundy (dekóduje obrázky na hlavnom vlákne). Prvý beh s ňou som zahodil. Ostatné merania sú bez nej.
- A/B pokusy podvrhnú upravené `app.js`, `style.css` a `i18n.css` cez `page.route` (zaplaty.mjs). Repozitár sa nemenil (`git status` je čistý). Snímky so zaplátou a bez nej sú totožné (0,0 % pixelov s rozdielom > 30).

## Rozklad snímky pred opravou (stredne, CPU 4×, 2470 snímok)
| časť | p50 ms | p95 ms | podiel |
|---|---|---|---|
| úloha snímky spolu | 4,85 | 29,1 | 100 % |
| UpdateLayoutTree (štýl) | 0,71 | 16,7 | 39 % |
| rAF (app.js tick) | 1,0 | 4,5 | 16 % |
| Commit | 0,57 | 3,3 | 11 % |
| PrePaint / Layerize / Paint | 0,2 / 0 / 0 | 2,2 / 2,9 / 2,7 | 7 / 6 / 4 % |

Po zaplátach premenne a bezanim:
- p95 úlohy snímky klesne na 20,8 ms;
- snímok nad 16,7 ms je 8,3 % (pred opravou 16,1 %);
- podiel štýlu klesne na 20 %.

## Nálezy (podrobne v poli nalezy)
1. **K01 (vysoká): premenné `--sp`, `--o`, `--so` na kotve** (app.js:175, 182, 199). Jeden zápis s vynúteným prepočtom stojí 1,2 až 2,1 ms. Priamo na prvok, ktorý hodnotu číta, stojí 0,07 až 0,17 ms. `--sp` sa pri `world` a `world-frame` vôbec nepoužije, lebo style.css:484 dáva `transform: none`.
2. **K02 (vysoká): `@font-face` v i18n.css:64-65 pri prvom dotyku vynúti rozloženie celej stránky.** Snímka trvá 208 až 309 ms. Bez `@font-face` je najdlhšia snímka 100 ms.
3. **K03 (vysoká): hudba na telefóne sa pustí koncom prvého ťahu** (atmosfera.js:195). Úloha 47 až 97 ms, snímka pri dekódovaní 98 až 159 ms, 687 kB a ekvalizér. Kompozitor potom kreslí 60 snímok/s aj v pokoji.
4. **K04 (vysoká): dekódovanie až pri zobrazení.** Zálohy majú style.css:1098 a 1104 a `decoding="async"`, portréty v páse sú prázdne 100 ms po švihu. Je to príčina záznamov Z-DEC z auditu čiernych okien.
5. **K05 (stredná): skok z menu a „Späť hore“ plynulým skrolom** (style.css:71, app.js:192-204). Načíta 8 až 9 kotiev a 15 obrázkov, interval rAF má p95 67 ms a 19 zo 119 snímok je nad 33 ms.
6. **K06 (stredná): tabuľa hodín, `void b.offsetWidth`** (app.js:693). 294 vynútených rozložení stojí 427 ms. S Web Animations API je to 0, najdlhšia snímka klesne zo 126 na 94 ms.
7. **K07 (stredná): `Intl.DateTimeFormat` s časovou zónou pri štarte** (app.js:660, 698). Zaberie 54 ms zo 131 ms inicializácie app.js.
8. **K08 (stredná): otvorenie menu.** Vynútené rozloženie stojí 34 až 60 ms, INP je 136 až 176 ms.
9. **K09 (stredná): prepnutie jazyka.** Snímky trvajú 145 až 186 ms. `collect()` beží 45 ms počas prvého skrolu.
10. **K10 (nízka): čítanie `scrollY` v rAF vynúti štýl** (app.js:147). Za beh je to 1540 prepočtov, 1,56 s. Po opravách K01 a K12 ostáva približne 820 prepočtov, asi 1 s.
11. **K11 (nízka): `data-scene-active` na `<html>`** (app.js:212). Každá zmena prepočíta 95 prvkov.
12. **K12 (nízka): nekonečné animácie v okne.** Lesk tlačidla, ekvalizér a svetlo okraja s vrstvou 1688×1688 CSS px.
13. **K13 (nízka): galéria na telefóne má zlé `sizes`.** Vyberie sa súbor 640w, ale zobrazí sa na 838 px zariadenia.
14. **K14 (nízka): ponuka jazyka je stlačená na 232 px** a text sa zalomí na 4 riadky.
15. **K15 (nízka): nadpis úvodu je skrytý `t-wait`.** Pri uloženom inom jazyku ho návštevník nevidí 1,0 až 2,1 s po prvom obraze.
16. **K16 (nízka): `backdrop-filter` na lište telefónu pred spustením app.js** (style.css:945).
17. **K17 (nízka): rozmazanie `.kw` (kinetické nadpisy).** Pri rozsvietení karty zdvojnásobí Layerize (8,8 oproti 3,7 ms).

## Overené a v poriadku (alebo vyvrátené)
- **DOM:** 838 prvkov, hĺbka 13; kinetické nadpisy majú len 28 spanov `.kw`. Nie je to problém.
- **CLS pri skrole:** 0. Jediný posun 0,0000 (`B.flip`).
- **Písma:** swap a preload 3 rezov sú v poriadku. Manrope 600 a 700 nie sú v preloade, ale CLS je 0 (pozri aj audit vzhlad-zhoda).
- **Jednotky okna:** dôsledne svh pre rozloženie, lvh pre pevné plochy, vh len ako záloha. Problém so 100vh na telefóne nenašiel. Riziko: app.js berie `vh = innerHeight` (mení sa s lištou), CSS kotvy sú v svh. Pri skrytí lišty sa krytie kariet posunie o desiatky px. V emulácii sa to overiť nedá.
- **Videá stránky:** okno „Tím v akcii“ má na telefóne `display: none`, `preload="none"` a plagát sa nastavuje lenivo cez IO. V poriadku.
- **Hypotéza vyvrátená:** karty tímu v páse nie sú skryté triedou `.reveal`, majú `is-in`. Prázdne sú len kvôli dekódovaniu (K04).
- **Vrstvy:** 46 až 62 kompozitných vrstiev, z toho 25 až 32 vzniká prekrytím s pevnými zálohami (napríklad `.band-prices` 390×6909).
  - Odstránenie `will-change` zo záloh ich počet nezmení (45 až 59).
  - Layerize a Commit stoja priemerne asi 1,4 ms na snímku. Beriem to ako informáciu, nie nález.
- **S filmom** (`?film=on`) sa zálohy aj textúry sťahujú z tej istej URL (napr. `-m-1448`). Duplicitný stupeň nevzniká.
- **recenzie.js a vernost.js:** pri štarte zanedbateľné (1,9 a 0,3 ms). Dialóg vernosti je naživo vypnutý (chýba `data-zapnute`).

## Pasce z toolboxu rychly-web
| pasca | stav na Barbershope |
|---|---|
| premenná na `<html>` v každej snímke | opravené, ale o úroveň nižšie trvá: kotva dedí do celej kotvy (K01) |
| `scrollY` po zápise štýlu | `apply()` je v poriadku, ale `setMenu` číta `scrollY` po zápisoch (K08) a `readTarget` vynúti štýl kvôli animáciám (K10) |
| nekonečné animácie mimo okna | pauzované cez `is-off`, ale v okne bežia stále a ekvalizér nie je pokrytý (K12) |
| žiadny backdrop-filter na telefóne | porušené pred spustením app.js (K16) |
| doplnok cez `import()` pri prvom geste | presne tento vzor spôsobí K02 a K03: práca padne do prvého ťahu prstom |
| pevné obrázky sa sťahujú všetky | `is-near` funguje, ale plynulý skok z menu ho obíde (K05) |
| WebGL na SwiftShader | brána funguje (`world-frame`) |

## Odporúčané poradie opráv a odhad dopadu
1. **K01: premenné na prvok, ktorý ich číta, plus `@property` s `inherits: false`.** Pri `world` a `world-frame` `--sp` nepísať.
   - Zmerané: štýl −57 %, snímky nad 16,7 ms 15,8 → 7,3 %, nad 33 ms 7,1 → 3,5 %.
2. **K02 a K03: žiadny `@font-face` v i18n.css.** Cyriliku pridať cez `document.fonts.add` až pri voľbe ukrajinčiny. Atmosféru a jazyky na telefóne nenačítať pri `touchstart`, ale v nečinnosti. Hudbu na telefóne nespúšťať koncom ťahu, len ťuknutím na tlačidlo.
   - Zmerané: snímka prvého dotyku 208–309 → najviac 100 ms.
3. **K04: `img.decode()` pri `is-near`, `is-shown` až po dekódovaní.** To isté pre portréty a galériu pred vstupom do okna. Rieši čierne okná zo záznamov Z-DEC.
4. **K05: skok z menu okamžite s krátkym prelínaním**, nie plynulým skrolom cez celú stránku.
5. **K06 a K07: tabuľa cez WAAPI a výpočet času až pri priblížení kontaktu.**
   - Zmerané: −427 ms vynútených rozložení, −54 ms pri štarte.
6. Potom K08 až K17 (menšie úlohy, každá do 60 ms alebo kozmetická).

Po zaplátach K01, K12 (bezanim) a K06 (bezflap) v scenári švih: snímok nad 100 ms 11 → 3, hlavné vlákno 11,0 → 7,9 s.
Na splnenie cieľa (nad 33 ms najviac 2 %) treba ešte K10, K11 a K04. Zvyšok tvoria Commit, Layerize a dekódovanie, ktoré merať pred a po tou istou metódou: `ab.sh`, `ab2.sh` a `ab-suhrn.py`.
