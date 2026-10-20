# BARBERSHOP 30 – diagnóza a plán opráv (plynulosť na telefóne, čierne okná, vzhľad)

Plán zostavil eng manažér a art director (tim-roly) 20. 10. 2026. Vychádza z piatich auditov a ich skeptických
overení (`audit/vykon-telefon`, `cierne-okna`, `vzhlad-zhoda`, `kod-film`, `kod-stranka` a `audit/overenie-*`).
Do plánu idú len nálezy **po overení**: vyvrátené časti sú v časti 6 a nerobia sa.

- Repozitár: `$SP/hs2`, vetva `barbershop-plynulost` = `origin/main` = `bcd487e` (čistý strom). Web je
  `barbershop-30/` a nemá build krok (`tools/build.mjs` sa ho netýka). Po zmene záberov ide `film.py` → `stills.py`.
- `$SP` = `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad`.
- Záväzné: `ZADANIE.md` (ciele v časti 2), dokumenty Barbershopu (README, MASTER_BRIEF, ART_DIRECTION, CONTRACT,
  CONTENT_SOURCES, TOUR_DIRECTION, CHECKS §9, §12, §13) a koreňový `CLAUDE.md` (časť Technika, kde nie je v rozpore).

---

## 1. Diagnóza v skratke

**Prečo sa to na telefóne zasekáva** (merané na emulácii 390 × 844, DPR 3, CPU 4×, Fast 4G):

1. **Stránka sama** (platí pre film aj pokojnú verziu): app.js v každej snímke zapisuje tri CSS premenné na kotvu
   karty, kotva ich dedí do celého podstromu a prehliadač prepočítava štýl. Štýl tvorí 37 % snímky, p95 snímky
   34 ms (cieľ 20 ms). Prvý dotyk prstom zamrzne stránku na 0,28–0,38 s (i18n.css pridá `@font-face` Manrope a vynúti
   rozloženie celej stránky) a ešte raz na 70–137 ms (hudba sa spustí aj po ťahu skrolu). Nekonečné animácie (lesk,
   ekvalizér, obiehajúce svetlo s vrstvou 25,6 Mpx) pridávajú 1,7–2 ms do každej snímky skrolu. Tabuľa hodín vynúti
   rozloženie 152-krát.
2. **Film na telefóne** (bežný telefón s grafikou dostane film, odhad 85–95 % telefónov): nahrávanie obrázkov do
   grafiky beží na hlavnom vlákne. Sekvencie 720 × 1280 (karty Poď ďalej, Remeslo; len telefón) nahrávajú až dve
   celé snímky za snímku displeja (38,7 ms), pásy fotiek stoja 7–16 ms každý, zjemnenie hĺbky beží za behu
   (11× drahšie než strih), prvý dotyk spustí úlohy 150–500 ms (štart filmu, dvojitý WebGL kontext).

**Kde sú čierne okná:**

1. **Film** (predvolený zážitok telefónu): keď cieľový záber nemá textúru, film plátno vymaže na farbu stránky a
   statické zálohy sú skryté. Nastane to po skoku z menu, po „Späť hore“, po kliknutí na logo, pri rýchlom švihu
   (skoková vetva sa spúšťa aj pri bežnom švihu), pri strate WebGL kontextu (bez časového limitu). V kontajneri
   0,3–8,3 s, odhad pre telefón s grafikou 0,55–1,1 s pri návrate a 2–2,5 s pri prvej návšteve. Pri odovzdaní zo
   zálohy do filmu obraz na ~0,2 s stmavne na 35–38 %.
2. **Pokojná verzia a prvý obraz**: záloha karty je stiahnutá, ale dekóduje sa až pri zobrazení, a predošlá karta
   zmizne skôr (0,5–3,9 s tmavá doska v kontajneri, 0,1–0,4 s na telefóne). Na pomalej sieti sa cieľ skoku sťahuje
   súbežne s piatimi prechádzanými kartami (Slow 4G: 11,8 s). Úvod je tmavý, kým nepríde fotka (1–4,7 s), lebo nikde
   nie je rozmazaný náhľad. Na tablete a veľkom počítači zhasnú zálohy pri pätičke (prázdny pás 22–41 % okna).

**Prečo telefón vyzerá horšie:** tri karty sú z videí 576 px (mäkké, kocky kompresie), orezy Čakárne a Kávy stredujú
vedľajší predmet, text karty sa mení o 150–370 ms skôr než obraz (alebo ostane miestnosť bez nadpisu), v pokojnej
verzii ostane dvojexpozícia, galéria je na telefóne na 0,41–0,76 rozlíšenia, chýba video tímu a linka progresu.

## 2. Príčiny zoskupené a zoradené podľa toho, čo majiteľ cíti

| # | Príčina v kóde | Čo vidí zákazník | Overené nálezy | Dávka |
|---|---|---|---|---|
| P1 | Prepočet štýlu z premenných na kotvách, nekonečné animácie, vynútené rozloženia (tabuľa, Intl, atribút scény) | trhaný skrol na každom telefóne | K01/T3, T4/K12, K06/T7, K07, K11 | D1 |
| P2 | Ťažká práca pri prvom dotyku (písmo i18n, hudba, collect) | zamrznutie po prvom ťahu prstom | K02, K03, K09 (collect), K08 (drobnosť), K16 (pravidlo) | D1 |
| P3 | Žiadny náhľad pod fotkou, dekódovanie až pri zobrazení, skok z menu jazdí cez celú stránku | tmavá doska namiesto fotky (pokojná verzia, prvý obraz, pomalá sieť) | CO-2, K04, CO-3, CO-4, K05, CO-7, T6 | D2 |
| P4 | Film maže plátno do čiernej, zahadzuje posledný obraz, skoková vetva pri švihu, strata kontextu bez zálohy, odovzdanie cez tmu | čierna obrazovka vo filme (kritické) | CO-1/KF-01, CO-5, KF-02, KF-03, VZ-02/KF-10, KF-07 | D3 |
| P5 | Nahrávanie textúr a štart filmu na hlavnom vlákne | zasekávanie filmu v prvých miestnostiach a po prvom dotyku | T1/KF-06, KF-05, KF-08, KF-11, T10, KF-09, KF-12, T2/KF-04 (len časť bez zmeny vzhľadu) | D4 |
| P6 | Krytie kariet len zo scrollY, orezy, rozlíšenie galérie, chýbajúce prvky telefónu, kontrast, písmo, prechody jazyka | telefón pôsobí lacnejšie, text a obraz nesedia | VZ-05, VZ-10, VZ-03, K13, VZ-06, VZ-09, VZ-11, VZ-12, VZ-13, K14, K15, VZ-01 (3), T7/K09, T8 | D5 |

Závažnosť po overení: kritické sú len P4 (CO-1, KF-01). Vysoké: K01, K02, K03, K04, CO-2, CO-3, CO-4, CO-5,
KF-03, KF-05, T1, VZ-01, VZ-02.

### Poradie dávok a prečo

D1 → D2 → D3 → D4 → D5, každá samostatne nasaditeľná a overiteľná.

1. **D1 Stránka bez zásekov** ide prvá: zasekávanie je prvá veta majiteľa, oprava je lacná, nízke riziko, pomôže
   každému telefónu (aj s filmom, app.js beží vždy) a dá sa zmerať v kontajneri presne (hlavné vlákno).
2. **D2 Podklad proti čiernym oknám** (náhľady, dekódovanie, skok bez jazdy) je základ pre D3: náhľady a udalosť
   skoku z D2 použije film. Odstráni čierne okná pokojnej verzie a prvého obrazu.
3. **D3 Film bez čiernych okien** obsahuje jediné kritické nálezy. Ide pred D4, lebo vytvorí záchrannú sieť
   (náhľad, posledný obraz, záloha pri strate kontextu): keby prestavba nahrávania v D4 niečo spomalila, zákazník
   uvidí náhľad, nie čiernu. Predpočítané zjemnenie hĺbky (KF-07) je tu, lebo skracuje čas do ostrého záberu a
   odstraňuje 2–3 s zahltenie grafiky v kontajneri, bez ktorého sa čierne okná filmu nedajú spoľahlivo zmerať.
4. **D4 Film plynulo** je najväčší zásah (worker, kruh textúr) a najväčšie riziko, preto až na pripravenej sieti.
5. **D5 Vzhľad a prechody**: menšie, nezávislé úpravy; VZ-05 potrebuje stav filmu z D3, VZ-03 nástroje z D2 a D3.

---

## 3. Spoločné pravidlá merania (platia pre všetky dávky)

- **Rovnaká metóda pred aj po.** „Pred“ = commit tesne pred dávkou (pre D1 je to `origin/main` `bcd487e`), „po“ =
  HEAD vetvy. Pred-strom: `git -C $SP/hs2 worktree add $SP/barber/opravy/pred-<D> <commit>`. Na súhrn sa navyše
  porovná s `origin/main`.
- **Nástroje** sú overené skripty auditu. Nikdy sa nespúšťajú v priečinkoch auditu (prepísali by dôkazy) – vždy
  čistá kópia s vlastným portom:
  `bash $SP/barber/audit/plan/nastroje.sh <cieľ> <port> <strom>` (skopíruje kód nástrojov, prepíše predvolené porty
  na `<port>`, gzip server na `<port>+1`, cesty k stromu v `zaplaty.mjs`, `over-property.mjs`, `over-galeria.mjs`).
  Overené 20. 10.: kópia funguje (`hlavicka.mjs`, `pata2.mjs`, `ab3.sh`, `skrol2.mjs`).
- **Server:** `cd <strom> && python3 -m http.server <port>`, web na `/barbershop-30/`. Dva stromy naraz = porty
  `P` a `P+2` (`P+1` je gzip). Lighthouse len cez `python3 -I <N>/overenie-vykon-telefon/gzip-server.py <strom> <port>`
  (python server nekomprimuje, bez gzip je skóre o 12–14 bodov nižšie) a pri záťaži `/proc/loadavg` pod 2.
  Lighthouse: `CHROME_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome $SP/lh-tool/node_modules/.bin/lighthouse
  http://127.0.0.1:<port+1>/barbershop-30/ --only-categories=performance --output=json --output-path=<súbor>`
  (mobil predvolene, počítač `--preset=desktop`), 2 behy, medián.
- **Výkon sa meria len bez iného prehliadača** (`pgrep -c chrom` = 0) a záťaž sa zapisuje. A/B behy striedavo
  (pred, po, pred, po), porovnáva sa len v rámci jednej série. Opakovania: skrol 3×, ostatné 2×, medián.
- **Dve vrstvy čísel (ZADANIE bod 1):** (b) práca hlavného vlákna = čas vlákna (`tdur`) zo stopy; pri CPU 4× obsahuje
  aj čakanie na SwiftShader (overenie vykon-telefon: 50–68 % blokujúceho čakania), preto sa (b) potvrdzuje aj pri
  CPU 1× (`skrol2.mjs --cpu=1`, odhad telefónu ×4). (a) celá stránka (rAF, snímky) je v kontajneri skreslená
  softvérovým kreslením: ak dávka neurčí inak, kritérium je „nezhoršiť“ a „žiadna snímka s nahrávaním textúry či
  dekódovaním nad rozpočet“.
- **Čierne okná sa merajú v pixeloch** (screencast + `over.py`/`over2.py`/`tma.py`) a pri filme navyše pravdou
  z WebGL (snímka „clear bez kreslenia“). Počítadlo „šera“ samo nestačí (plátno býva zakryté pásmi). Každé nájdené
  okno sa overí pohľadom na kľúčovú snímku (falošné: tmavá horná časť fotky kávy, otvorené menu, oneskorenie
  screencastu). Surové snímky screencastu po vyhodnotení zmazať (> 50 MB).
- **Snímky si vždy pozrieť** (Read na obrázok), pri vzhľade porovnať telefón 390 × 844 a 360 × 780 (DPR 3) a
  počítač 1440 × 900.
- **Iron Law:** najprv príčina, potom oprava; regresné meranie musí bez opravy zlyhať a s ňou prejsť; po troch
  neúspešných pokusoch na jednom probléme zastaviť a zapísať do `otvorene`.
- **Testy po každej dávke** (zo `barbershop-30/`): `node source/tools/app-smoke.mjs` (dnes 105 OK),
  `i18n-test.mjs`, `atmosfera-test.mjs`, `koliesko-test.mjs`, `uvod-shot.mjs`, `uvod-meranie.mjs` +
  `python3 -I source/tools/uvod-zhoda.py`, `karty-shot.mjs --wait=5000`, `strih-shot.mjs` (14 prechodov bez chýb
  konzoly). Testy, ktoré potrebujú port, spúšťať podľa ich hlavičky.

---

## 4. Dávky

### D1 – Stránka bez zásekov pri skrole a prvom dotyku

**Cieľ:** hlavné vlákno stránky (rovnaké pre film aj pokojnú verziu) s rezervou pod rozpočtom 60 Hz: štýl na snímku
o polovicu nižší, prvý dotyk bez zamrznutia, nekonečné animácie nebrzdia skrol. Vzhľad sa nemení; jediná viditeľná
zmena je lišta na mobile bez rozmazania pred spustením app.js (pravidlo „žiadny backdrop-filter na mobile“).

**Nálezy:** K01/T3 (premenné na kotve), K02 (`@font-face` v i18n.css), K03 (hudba po ťahu skrolu), T4/K12
(nekonečné animácie počas skrolu, vrstva 25,6 Mpx), K06/T7 (tabuľa hodín), K07 (Intl pri štarte), K11
(`data-scene-active`), K09 (collect pri prvom dotyku), K16 (backdrop-filter na mobile – porušuje pravidlo),
K08 (drobná úprava menu).

**Zmeny:**
1. **K01** – `app.js:173–199`: v `measure()` si pre každú kotvu uložiť čítajúce prvky (`.film-still img`,
   `.title-frame`, `.film-still`) a `setVar('--sp'|'--o'|'--so', …)` volať na ne, nie na kotvu. `--sp` nezapisovať
   pri `html.world-frame`, `html.world:not(.world-off)` a `data-motion="off"` (img má vtedy `transform: none`,
   `style.css:484, 502`). V `style.css` registrovať `@property --sp { syntax: '<number>'; inherits: false;
   initial-value: 0 }`, **`--o` a `--so` s `initial-value: 1`** (nie 0 – návrh auditu stmavil úvod, overené
   `over-property.mjs`) a doplniť `html.karty .film-shot.is-title:not([data-pro]) .title-frame { --o: 0 }` a
   `html.karty .film-shot.is-title:not([data-pro]) .film-still { --so: 0 }` (inline zápis z app.js má prednosť;
   overená varianta `premenne2` v `overenie-kod-stranka/zaplaty.mjs`). Zmazať mŕtve pravidlo `style.css:568`
   (`.film-content` v HTML nie je).
2. **K02** – zmazať `@font-face` z `i18n.css:64–65`; cyrilické Manrope pridať v `i18n.js` až pri voľbe ukrajinčiny
   (`document.fonts.add(new FontFace(…))` s rovnakým `unicode-range`). Na dotykovom zariadení načítať i18n.js
   v `requestIdleCallback` po `load` a pokoji skrolu, nie pri `touchstart` (`app.js:391`); otvorenie menu ho načíta
   hneď (prepínač jazyka je v menu); pri `?lang=` a uloženom jazyku ostáva okamžité načítanie.
3. **K09 (časť)** – `collect()` (`i18n.js:267`) spúšťať až pri prvom `set()`, nie pri každej návšteve.
4. **K03** – `atmosfera.js:195`: na dotyku pustiť hudbu len pri **ťuknutí** (touchend do 10 px od touchstart, do
   500 ms, bez skrolu medzi nimi), nie po ťahu. `AudioContext` vytvoriť/obnoviť v obsluhe ťuknutia (iOS), sťahovanie
   a `decodeAudioData` až v ďalšej úlohe; `aria-pressed` a ekvalizér zapnúť až pri `ctx.state === 'running'`.
   Počítač bez zmeny. (Zachováva README „hudba sa pustí pri prvom kliknutí alebo ťuknutí“; otázka Q2 pre majiteľa.)
5. **T4/K12** – počas skrolu pozastaviť nekonečné animácie: trieda na `<html>` (napr. `skrol`), zruší sa 150 ms po
   poslednom `scroll`; `animation-play-state: paused` pre `.btn-primary::after`, `.beam-line::before`,
   `.marquee-track`, `.hudba-eq i` (`style.css:1184–1216`, `atmosfera.css:59`). Svetlo okraja (`style.css:1201–1206`)
   nakresliť vo vrstve veľkosti karty (štvorec s uhlopriečkou karty, nie `200vmax`), vzhľad obehu rovnaký. Pri
   obmedzení pohybu všetko stojí ako dnes.
6. **K06** – tabuľa hodín (`app.js:693`): preklopenie cez `b.animate([...], { duration: 90 })` bez prepínania triedy
   a bez `void b.offsetWidth`; text všetkých políčok meniť dávkovo v jednom `requestAnimationFrame` cykle (nie
   10 samostatných časovačov). Zmazať `style.css:1241–1242`.
7. **K07** – `tabula()` (`app.js:697–698`) spustiť až keď sa `[data-flap]` priblíži (IntersectionObserver
   `rootMargin: '100% 0px'`); `Intl.DateTimeFormat` vytvoriť raz, až vtedy.
8. **K11** – `data-scene-active` (`app.js:212`) nastaviť raz pri štarte (CSS testuje len prítomnosť:
   `style.css:389, 617, 945, 1004–1005`); aktívna kapitola len v `aria-current`.
9. **K16** – blur v `@supports (animation-timeline: scroll())` (`style.css:940–951`) obmedziť na
   `@media (min-width: 901px)`; na mobile bez `backdrop-filter`.
10. **K08** – v `setMenu` volať `ctaHidden(curY)` (nie čítanie `scrollY`) a `focus()` v `requestAnimationFrame`.
    `overflow: hidden` na body ostáva (bez zamknutia sa nič nezlepšilo).

**Akceptačné kritériá** (telefón 390 × 844, DPR 3, dotyk, Fast 4G, `?uvod=off`; v kontajneri ide pokojná verzia,
čo je meranie (b) zo zadania):
- Skrol celou stránkou (`skrol.mjs --scen=stredne`, CPU 4×, 3 behy, medián): úloha snímky hlavného vlákna p95
  **≤ 20 ms** (pred 34,0), štýl na snímku **≤ 2,0 ms** (3,84), p95 štýlu ≤ 6 ms (19,4), snímky > 16,7 ms ≤ 8 %
  (19,7 %), dlhé úlohy ≤ 6 (26); **žiadna LoAF > 50 ms, v ktorej skript app.js, i18n.js alebo atmosfera.js trvá
  > 10 ms alebo vynúti štýl/rozloženie > 10 ms** (pole `loaf` vo `vysledok.json`). Celá stránka (a) v kontajneri:
  rAF > 33 ms ≤ 3 % (10,6 %); hranica 2 % zo zadania sa potvrdí na zariadení (časť 7, Q7).
- Rýchly švih (`--scen=svih`): úloha snímky p95 ≤ 18 ms (19,0), dlhé úlohy ≤ 6 (8).
- Čas vlákna bez čakania (`skrol2.mjs --film=off --cpu=1`): p95 **≤ 5,5 ms** (6,3–7,4), štýl na snímku ≤ 0,7 ms
  (0,97–1,37), žiadna úloha > 50 ms vlákna. Pri `--cpu=4` len nezhoršiť: tam čas vlákna obsahuje čakanie na
  SwiftShader (overenie vykon-telefon) a p95 sa pri samostatných A/B T3 a T4 nehýbal.
- Prvý dotyk (`--scen=prvy-dotyk`, `hudba=off`, 2 behy): najdlhšia úloha **≤ 100 ms** (282–378), LoAF ≤ 100 ms
  (326–370). S hudbou (bez `hudba=off`): žiadna LoAF > 50 ms so skriptom atmosfera.js po ťahu skrolu.
- `over-audio.mjs --n=2`: po zvislom ťahu a vodorovnom švihu **žiadny AudioContext**, `aria-pressed=false`,
  ekvalizér stojí (dnes 6/6 behov hudba zapnutá); po ťuknutí hudba hrá. `atmosfera-test.mjs` (počítač) prejde.
- Tabuľa (`--scen=kontakt`, 2 behy): vynútené `Layout/UpdateLayoutTree <- app.js:tick` z tabule **0** (146–149×),
  skript tabule ≤ 250 ms (774–840).
- `over-intl.mjs`: pri vyhodnotení app.js sa nevytvorí `Intl.DateTimeFormat` s časovou zónou (dnes 30–89 ms).
- Atribút `data-scene-active` sa počas skrolu nemení (stopa: 0 zmien hodnoty; dnes 2,6–6,0 ms za zmenu).
- `hlavicka.mjs`: telefón `backdropFilter: none` aj pred app.js (dnes `blur(12px)`); počítač blur ostáva.
- `vrstvy.mjs --film=off`: vrstva svetla okraja ≤ 2× plocha kontaktnej karty (dnes 1688 × 1688 css px).
- INP (`inp.mjs --film=off`): menu ≤ 200 ms pri CPU 6× (216), pri CPU 4× nezhoršiť (112–136); jazyk nezhoršiť.
- `over-property.mjs`: úvod pred app.js a bez JS rovnaký ako dnes (titulok aj záloha viditeľné, jas 60,6 ± 2).
- Vzhľad: snímky pokojnej verzie (`karty-shot.mjs`) a pásu kontaktu pred/po – rozdiel > 30 úrovní na ≤ 0,5 % pixelov
  (okrem animovaných prvkov: lesk, ekvalizér, svetlo, tabuľa – tie porovnať okom).
- CLS < 0,05; testy z časti 3 vrátane `i18n-test.mjs` (ukrajinčina s cyrilikou stiahne `Manrope-cyr-*`).

**Overenie pred/po:** `N=$SP/barber/opravy/D1/meranie/nastroje-{pred,po}` cez `nastroje.sh` (strom pred / HEAD).
V `$N/overenie-kod-stranka`: `bash ab3.sh d1 stredne 3 uvod=off zaklad && python3 ab-suhrn.py d1`; to isté so
`svih` (predpona `d1s`), `prvy-dotyk` s `'uvod=off&hudba=off'` (predpona `d1pd`) a `kontakt` (predpona `d1k`, pole
`vynutene` a `skripty` vo `vysledok.json`); `node over-audio.mjs --n=2`, `node over-intl.mjs --n=3`,
`node cena-sceny.mjs`, `node hlavicka.mjs`, `node over-property.mjs`, `node over-menu.mjs --n=3 '--q=uvod=off&hudba=off'`.
V `$N/overenie-vykon-telefon`: `node skrol2.mjs --film=off --cpu=1 --meno=d1-cpu1`, `--cpu=4 --meno=d1-cpu4`,
`node vrstvy.mjs --film=off`, `node inp.mjs --film=off --cpu=4` a `--cpu=6`.

**Riziko regresie a ochrana:**
- `@property` s nesprávnou `initial-value` stmaví úvod alebo karty bez JS → `over-property.mjs` (povinné).
  Safari < 16.4 `@property` nepozná – správa sa ako dnes (len bez úspory).
- Zápis na `img`/`.title-frame` musí mať vlastnú cache (`el.__v`), inak sa zapisuje každú snímku.
- Hudba: iOS odomkne zvuk len v obsluhe gesta – AudioContext musí vzniknúť v obsluhe ťuknutia, nie v časovači.
- Pozastavenie animácií triedou na `<html>`: selektory len na konkrétne prvky (nie atribútové na celú stránku, K11).
- Ukrajinčina bez `@font-face` v i18n.css → `i18n-test.mjs` musí ukázať cyriliku v Manrope.
- Neskoršie načítanie i18n.js oneskorí ponuku jazyka – prijateľné, overiť `jazyk-uvod.mjs`.

---

### D2 – Čierne okná: náhľady, dekódované zálohy, skok z menu bez jazdy

**Cieľ:** v pokojnej verzii (bez WebGL, obmedzenie pohybu, šetrenie dát, slabé telefóny, kým film nebeží) a pri
prvom obraze nikdy tmavá doska: pod každou fotkou je okamžite rozmazaný náhľad, nová karta sa ukáže až keď je
dekódovaná, skok z menu pristane hneď bez jazdy cez stránku. Pripraviť náhľady a udalosť skoku pre film (D3).

**Nálezy:** CO-2, K04 (A aj B), CO-3, CO-4, K05, CO-7 (tablet, veľký počítač), T6.

**Zmeny:**
1. **Náhľady (nový nástroj `source/tools/nahlady.py`, Pillow):** pre každý záber (výrez na šírku aj `-m`), prológ
   (`vstup`, `vstup-m`) a plagáty sekvencií (`f025`, `f022`) a tímu vyrobiť náhľad ~24–32 px na šírku (WebP,
   vopred rozmazaný), base64. Výstupy: (a) úvod (`rohozka`, `rohozka-m`, `vstup`, `vstup-m`) do bloku v `style.css`
   medzi značkami `/* NAHLADY-UVOD */` (prírastok ≤ 3 kB gzip), (b) ostatné do `assets/img/film/nahlady.css`
   (načíta ho app.js po prvom vykreslení, neblokuje prvý obraz), (c) `assets/img/film/nahlady.json` pre
   film (D3). Náhľad je `background-image` samotného `img` (`background-size: cover`, `background-position` rovnaká
   ako `object-position`), takže pri zobrazení fotky nič neposkočí ani v rámovaní `html.world`. Pod náhľadom
   dominantná farba fotky namiesto plochej `--ink-2` (`style.css:441`). **Do `index.html` nič** – HTML má gzip
   14 380 B a musí ostať v prvom okne TCP (README). Nástroj zapísať do README (Nástroje).
2. **Dekódovanie pred zobrazením (K04, CO-2):** v `app.js` pri pridaní `is-near` (`app.js:203`): keď je `img`
   stiahnutý (`complete`, inak po `load`), zavolať `img.decode()` a kotve dať `is-ready`. Predošlá (naposledy celá)
   karta drží `--so` 1 a `is-near`, kým nová nemá `is-ready` (`app.js:196–198`), najdlhšie ~600 ms (poistka:
   potom sa nová ukáže aj tak, s náhľadom pod sebou). Pri `html.world-in` (film beží) sa zálohy nedekódujú (šetrí
   pamäť), okrem `film-strata` (D3). `decode()` nikdy nevolať na nestiahnutý lenivý obrázok (promise visí).
3. **Pásy tímu a galérie (K04 B):** IntersectionObserver na `.team-grid` a `.gallery-grid` s `rootMargin '100% 0px'`;
   pre stiahnuté obrázky pásu `decode()`, ostatné po `load`. Lenivé sťahovanie ostáva.
4. **Skok z menu, logo a „Späť hore“ bez jazdy (K05, CO-3):** v obsluhe kliknutia na `a[href^="#"]` (`app.js:301–306`)
   `preventDefault`, `scrollIntoView({ block: 'start', behavior: 'instant' })` na cieľ (rešpektuje `scroll-margin`,
   `style.css:1112`), `history.pushState` s hashom, fokus na cieľovú sekciu (`tabindex="-1"`, `preventScroll`),
   `snapNow`, a vyslať udalosť `bs30:skok` (detail: cieľ) pre film. Staré Safari bez `'instant'`: dočasne
   `scroll-behavior: auto` (vzor `film.js:139`). Pri okamžitom skoku dostane `is-near` len cieľ ±1, prechádzané
   karty sa nesťahujú. Súlad s TOUR_DIRECTION („skok cez menu pristane bez jazdy“).
5. **Pätička (CO-7):** `footerIn` (`app.js:188`) nahradiť podmienkou „pás kontaktu zakrýva okno pod lištou“
   (`y + výška lišty ≥ horný okraj .band-contact`).
6. **T6:** `will-change: transform` na `img` zálohy (`style.css:452`) len pri `.is-near`.
7. **Bez zmeny `sizes`** pri DPR 3 (záloha 1448 px kvôli ostrosti, ZADANIE bod 4): tmu na pomalej sieti rieši náhľad.

**Akceptačné kritériá** (telefón 390 × 844 DPR 3 CPU 4×; počítač 1440 × 900; `?film=off` a predvolená adresa,
ktorá je v kontajneri pokojná verzia):
- `over.mjs` + `over2.py` (pixely, okno = ≥ 20 % plochy tmavej jednofarebnej > 150 ms): **0 okien** v scenároch
  švih Fast 4G (návrat aj prvá návšteva), skok z menu Fast 4G (Služby, Prehliadka, Galéria, Tím) a skok Slow 4G
  prvá návšteva (Služby, Tím, Galéria, Kontakt). Dnes: švih 539–2 001 ms, skok 470–3 932 ms, Slow 4G 4 675 a 5 774 ms.
  Úsek, na ktorého kľúčovej snímke je rozmazaný náhľad fotky, nie je čierne okno (ZADANIE bod 2: „vidno náhľad“);
  detektor ho pri tmavej fotke môže označiť – rozhoduje pohľad na snímku.
- Prvý obraz: tma po FCP **≤ 150 ms** (náhľad úvodu je už v prvom vykreslení). Dnes: telefón predvolene Fast 4G
  1 028 ms, telefón `?film=off` Fast 4G 2 454 ms, telefón `?film=off` Slow 4G 3 511 ms, počítač predvolene Slow 4G
  4 719 ms (v prológu len lišta).
- `over-dekod.mjs --n=2`: test A 0 snímok > 60 % tmy (dnes 2–4), test B ≤ 5 snímok slepého portrétu, všetky do
  250 ms (dnes 14–16 do 413 ms).
- `interakcie.mjs`: skok na Kontakt stiahne ≤ 3 zálohy kariet (dnes 15 obrázkov), `is-near` len pri cieli.
- `pata2.mjs`: prázdny pás 0 px pri 1024 × 1366, 1536 × 864, 1440 × 900, 1680 × 1050, 1920 × 1080, 2560 × 1440
  (dnes 22–598 px), telefóny ostávajú 0.
- `index.html` gzip ≤ 14 600 B; `style.css` gzip +≤ 3 kB; `nahlady.css` ≤ 12 kB.
- Načítanie (`nacitanie.mjs --film=off --cpu=4`): LCP text nezhoršený (0,75–0,99 s); Lighthouse mobil (gzip, nízka
  záťaž) ≥ 95 a LCP nie horšie o > 0,1 s (dnes 95–96, 2,7–2,9 s), počítač nezhoršiť (98); CLS < 0,05.
- `uvod-zhoda.py` ≤ 7 px, mierka 0,98–0,99 (náhľad nesmie zmeniť rámovanie zálohy); `karty-shot.mjs` telefón aj
  počítač: po ustálení každá karta s ostrou fotkou.
- Prístupnosť: po skoku z menu je fokus v cieľovej sekcii, tlačidlo Späť v prehliadači vráti predchádzajúcu polohu.

**Overenie pred/po:** `$N/overenie-cierne-okna`: sada `beh.sh` (scenáre `co2-*`, `co3-*`, `co4-*`; každý beh
`node over.mjs --name=<meno><prípona> …` + `python3 over2.py runs/<meno>`), `node odhal-svih.mjs --cache=warm`,
`node nastroje/pata2.mjs`; telefón pri prvom obraze aj `node over.mjs --dev=phone --net=slow4g --cpu=4 --q="film=off"
--cache=cold --scen=uvod --name=uvod-s4`. `$N/overenie-kod-stranka`: `node over-dekod.mjs --n=2 && python3 -I
over-dekod.py dekod`, `node interakcie.mjs`. `$N/overenie-vykon-telefon`: `node nacitanie.mjs --film=off --cpu=4`,
Lighthouse podľa časti 3. Veľkosti: `gzip -9c index.html | wc -c`.

**Riziko regresie a ochrana:**
- Visiaci `decode()` → karta sa neukáže: poistka 600 ms a nikdy na nestiahnutom obrázku.
- Držanie predošlej karty ukáže krátko nesprávnu miestnosť pod novým nadpisom – strop 600 ms, náhľad nového pod ním.
- Pamäť: dekódované zálohy okolia (4 × ~15 MB) – len pri pokojnej verzii, prehliadač ich môže zahodiť; nesmie sa
  objaviť tma (meranie).
- Vlastný skok namiesto natívneho: história, fokus, `scroll-padding`, klávesnica; `hashchange` pri Späť.
- Náhľad v `style.css` zväčší blokujúce CSS – strop 3 kB gzip; Lighthouse kontrola.

---

### D3 – Film bez čiernych okien (skok, švih, strata kontextu, odovzdanie)

**Cieľ:** film nikdy nekreslí prázdne plátno: keď cieľový záber nie je v grafike, ukáže posledný obraz alebo
náhľad cieľa a ostrý záber sa doň prelnie. Odovzdanie zo zálohy do filmu bez stmavnutia. Strata WebGL kontextu
ukáže zálohy a do 3 s prepne na pokojnú verziu.

**Nálezy:** CO-1/KF-01 (kritické), CO-5, KF-02, KF-03, VZ-02/KF-10, KF-07.

**Zmeny (film.js, style.css, nástroj hĺbky):**
1. **Náhľady vo filme:** pri štarte filmu načítať `nahlady.json` (D2) a pre každý záber (telefón `-m`) vyrobiť malú
   textúru s plochou hĺbkou – samostatný stav `s.lqip`, nie `s.ready`. `draw()` (`film.js:1102–1112`): keď A nie je
   pripravený, poradie náhrady je `held` (pripravený, |pi − k| ≤ 1) → `path[k+1]` → `path[k−1]` → náhľad A (KF-02).
   `renderer.clear()` bez obsahu (`film.js:1106`, `1112`) sa už nikdy nevolá; `held` sa pri čakaní nemaže.
2. **Žiadne „rozsvietenie zo šera“:** zrušiť `dark` (`film.js:1063, 1109–1110, 1243`). Ostrý záber sa prelína
   z toho, čo je práve na obrazovke (posledný obraz alebo náhľad), cez `fin()` (`film.js:1064`), bez fázy pod 55 %.
3. **Skoková vetva len pri programovom skoku (CO-5):** `S = T` (`film.js:1243`) len po udalosti `bs30:skok` z D2
   (a pri vlastných skokoch filmu), alebo keď |T − S| > 1,5 záberu **a zároveň** rozdiel v px > 2,5 výšky okna. Pri
   švihu pokračuje pružina a drží sa posledný obraz. Pri skoku sa prelína z posledného obrazu do cieľa (nie zo tmy).
4. **Načítanie (CO-1, CO-5):** pri `bs30:skok` hneď `load(cieľ)` ešte pred dobehnutím skrolu; `keepAround`
   (`film.js:755–764`) načíta ±1 a +2 v smere **nezávisle** od toho, či je aktuálny hotový (aktuálny prvý),
   uvoľňuje podľa poslednej doby použitia: najviac 5 záberov (aktuálny, ±1, +2 v smere a úvod – rohožka ostáva
   vždy); náhľady všetkých záberov sú v grafike stále (spolu < 1 MB). Kým sa po skoku čaká na cieľ, `pump()` smie
   8 ms namiesto 4 (`film.js:1212`).
5. **Strata kontextu (KF-03):** pri `webglcontextlost` (`film.js:1419`) pridať `html.film-strata`; CSS vráti
   `.film-still` titulných kariet (rovnaké pravidlá `is-near`/`is-shown`/`--so` ako pokojná verzia, `style.css:1096–1108`),
   app.js pri `film-strata` dekóduje zálohy (D2). Časovač 3 s → `stop()` (world-off). Pri `webglcontextrestored`
   (`film.js:1420`) časovač zrušiť, nahrať náhľady, triedu odobrať až po prvom snímku cieľového záberu.
6. **Odovzdanie zo zálohy (VZ-02, KF-10):** `html.world-in .film-canvas { opacity: 1; transition: none }`
   (`style.css:412–418`) a `body::after` pri `world-in` tiež hneď 1 (`style.css:1080–1084`); mizne len záloha nad
   plátnom (prvý snímok má rovnaké rámovanie, `film.js:1250–1252`). Zladiť vinetáciu zálohy so shaderom
   (`film.js:350` smoothstep 0,32–0,9 × 0,34 proti `style.css:488–490` a `1086–1089`), aby sa obraz po odovzdaní
   nerozjasnil o 13–14 %.
7. **Predpočítané zjemnenie hĺbky (KF-07):** nový krok pri stavbe (napr. `source/tools/hlbka-zjemni.py`, Pillow +
   numpy; volá ho aj `film.py`): z `<meno>-hlbka.webp` a `<meno>-m-hlbka.webp` ten istý postup ako `soften()`
   (`film.js:382–398`: max filter s polomerom 2σ, potom Gauss σ, σ = 1,2 × šírka mapy / SEG[0]) a uložiť ako
   `<meno>[-m]-hlbka-z.webp` v šírke 2 × SEG[0] (telefón 224, počítač 512). Film ich nahrá priamo, bez `soften()`
   a bez dvoch render targetov na záber (`film.js:524`); `depthBitmap` zmenšovanie netreba. Pôvodné mapy ostávajú
   (zdroj; model hĺbky nie je v gite).

**Akceptačné kritériá** (`?film=on&uvod=off`; telefón 390 × 844 pri DPR 1 aj 3, CPU 1× aj 4×, Fast 4G prvá návšteva
aj návrat; počítač 1440 × 900):
- WebGL pravda (`over.mjs` + `over2.py`): **0 snímok „clear bez kreslenia“** vo všetkých scenároch: skok z menu
  (Služby, Prehliadka, Galéria, Tím), pätička, „Späť hore“, logo, švih nadol a nahor. Dnes 325–8 321 ms na skok,
  švih 1 182–3 794 ms.
- Pixely: **0 okien** ≥ 20 % tmavej plochy > 150 ms v tých istých behoch; `over-film.mjs` scenáre `menu-sluzby`,
  `hore` a `over-skok.mjs` (logo) + `tma.py`: stred tmavý > 20 % najviac 150 ms (dnes 1 223 ms 100 % tmavý).
- `over-kf02.mjs --cpu=1`: po uvoľnení sala-rano žiadne šero (`sero.py`) a stred tmavý ≤ 20 % (dnes 6,4 s čierno).
- Strata kontextu (`over-film.mjs --scen=kontext`): počas straty viditeľných záloh ≥ 1 a stred tmavý ≤ 20 % (dnes
  0 a 89 %); variant bez obnovy: world-off najneskôr 3,5 s po strate, zálohy viditeľné.
- Odovzdanie: `odovzdanie-over.mjs --dev=p390|d1440` + `jas-odovzdania.py`: jas pásu fotky **95–105 %** pôvodného
  v každom čase 0–1 300 ms na oboch zariadeniach (dnes 53 % a 60 % pri 450 ms), podiel jasu < 20 nikdy nad pôvodný
  + 5 p. b.; `odovzdanie-pixely.py` minimum faktora obrazu ≥ 0,95 (dnes 0,38); po dobehnutí jas filmu a zálohy do 5 %.
- Hĺbka: `karty-shot.mjs --wait=5000` a `strih-shot.mjs` pred/po: priemerný rozdiel snímok ≤ 3 úrovne, žiadne
  trhanie hrán > 3 px (MASTER_BRIEF §3); `zjemnenie-over.mjs` už nemá čo merať (0 render targetov zjemnenia za behu).
- Pamäť grafiky (sonda v `over-film.mjs`) na telefóne ≤ 140 MB (dnes max 140 MB), počítač nezhoršiť.
- `uvod-zhoda.py` ≤ 7 px; `uvod-meranie.mjs`: prológ bez čakania pri dverách, dpr 2 celý prológ; `uvod-shot.mjs`
  (prológ, Späť na ulicu, Vojdi dnu, druhá návšteva, `?film=off`), `koliesko-test.mjs`, `app-smoke.mjs`.

**Overenie pred/po:** `$N/overenie-cierne-okna`: `beh.sh` scenáre `co1-*` (skok, DPR 1, Fast 4G a cache) a
`co5-*` (švih) + `python3 pruzina.py runs/<meno>`; navyše co1 pri DPR 3 (`--dpr=3`). `$N/overenie-kod-film`:
`node over-film.mjs --cpu=4 --net=fast4g --out=d3-beh1` (scenáre odovzdanie, dole, hore, menu-sluzby, menu-galeria,
kontext) + `python3 sero.py d3-beh1/vysledok.json` + `python3 tma.py d3-beh1/<scenár> --od=<scen.od>`;
`node over-skok.mjs --cpu=4 --net=fast4g --dpr=3 --out=d3-skok --cakaj=20000`; `node over-kf02.mjs --cpu=1 --out=d3-kf02`;
`node over-film.mjs --cpu=1 --net=none --scen=nic --pomaly=0.1 --out=d3-odov` + `python3 odovzdanie-pixely.py d3-odov
--pomaly=0.1`. `$N/overenie-vzhlad-zhoda/beh2`: `node odovzdanie-over.mjs --dev=p390` a `--dev=d1440` +
`python3 jas-odovzdania.py`. Pozor: po KF-07 sa časy v kontajneri zmenia oveľa viac než na telefóne (zmizne
2–3 s zahltenie grafiky na záber) – porovnávať kritériá, nie len rozdiel pred/po.

**Riziko regresie a ochrana:**
- Náhľad vo filme pri skoku je rozmazaný 0,2–2 s – zámer (ZADANIE bod 2 to dovoľuje), nesmie byť tmavší než fotka.
- Viac záberov v pamäti → pamäť grafiky; s menšími hĺbkami (−3,8 MB/záber) a stropom 5 záberov na telefóne
  nesmie prekročiť dnešných 140 MB.
- Neodhalená udalosť skoku (klávesa End, posuvník, hľadanie v stránke): pružina prejde cez zábery s náhľadmi alebo
  sa uplatní px prah – bez tmy.
- Predpočítaná hĺbka iná ako za behu → iný pohyb popredia; kontrola snímkami strihov a hrán.
- Strata kontextu na iPhone (Safari pri návrate na kartu) sa v kontajneri simuluje `WEBGL_lose_context`; skutočné
  zariadenie je otázka Q7.
- Prológ a „Späť na ulicu“ používajú časovú os, nie skok – nesmú sa zmeniť (`uvod-shot.mjs`, `uvod-meranie.mjs`).

---

### D4 – Film na telefóne plynulo (textúry a štart mimo hlavného vlákna)

**Cieľ:** film na telefóne bez zásekov od nahrávania obrázkov a od štartu: práca s textúrami ≤ 3 ms na snímku
pri CPU 4×, žiadna dlhá úloha filmu po prvom dotyku, sekvencie (rozhodnutie majiteľa) ostávajú, len lacnejšie.

**Nálezy:** T1/KF-06 (sekvencie), KF-05 (pásy fotiek), KF-08 (predohrev programu sekvencie), KF-11 (mipmapy),
T10 (adaptívne DPR meria aj snímky s nahrávaním), KF-09 (štart filmu), KF-12 (záchranná brzda), T2/KF-04 len časť
bez zmeny vzhľadu (nekresliť pod nepriehľadným pásom).

**Zmeny (film.js, nový worker):**
1. **Pixely mimo hlavného vlákna (KF-05):** worker (napr. `assets/film-pixely.js`): `fetch` → `createImageBitmap` →
   `OffscreenCanvas` 2D → `getImageData` → prenos `ArrayBuffer` bez kópie. `upload()` (`film.js:467–497`) nahráva
   pásy z `Uint8Array` (merané: 1,5 ms namiesto 7,4 ms na pás pri CPU 4×). Výška pása podľa nameranej ceny riadku,
   cieľ ≤ 3 ms na snímku; v snímkach strihu (0 < mix < 1) nenahrávať, okrem čakania na cieľ skoku (D3). Bez
   `OffscreenCanvas` 2D (staršie Safari) ostane dnešná cesta s menším pásom podľa ceny riadku.
2. **Sekvencie (T1, KF-06):** pri `seqStart` vyhradiť kruh `SEQ_TEX` textúr raz (`texStorage2D` 720 × 1280),
   na telefóne `SEQ_TEX = 4` (`film.js:639`); snímky dekódovať vo workeri do RGBA; za snímku displeja najviac
   **jedno** nahratie (`film.js:689` dnes `k < 2`), po pásoch alebo celé, ak stojí ≤ 3 ms, najbližšie k polohe prvé;
   žiadne `tex()`/`initTexture`/`dispose` v každej snímke (`film.js:687–694, 726`). Návrat k videu so seek **nie**
   (rozhodnutie majiteľa 2026‑10‑11, CHECKS §12).
3. **KF-08:** v predohreve (`film.js:1504–1508`) raz vykresliť do 1 × 1 sieť s `FRAG` a sieť s `FRAG_SEQ`
   (`SHOTS.find(s => s.video && s.video.mode === 'seq')`), potom `visible = false`.
4. **KF-11:** `rtOpt.generateMipmaps = false` (`film.js:793`) a `gl.generateMipmap` ručne len pre render target,
   ktorý strih číta cez LOD (druh 1–3 oba, druh 4 len predmet, druh 0 žiadny; `film.js:844–849, 904`).
5. **T10:** `quality()` (`film.js:1171–1186`) vynechá aj snímky s nahratím sekvencie, videa alebo pása (príznak
   v `pump`, `seqDrive`, `onFrame`).
6. **KF-09:** testovací kontext (`film.js:98–106`) vytvoriť na samotnom `.film-canvas` s atribútmi renderera
   (`antialias: false, alpha: false, depth: true, stencil: false, powerPreference: 'high-performance',
   failIfMajorPerformanceCaveat`) a odovzdať ho `new THREE.WebGLRenderer({ canvas, context })` – jeden kontext
   namiesto dvoch. Štart po importe (`film.js:133–1495`) rozdeliť na úlohy < 50 ms (`scheduler.yield` alebo
   `setTimeout(0)`): vyhodnotenie three vo voľnom čase po `load`, renderer, materiály, mriežka, preklad.
7. **KF-12 záchranná brzda:** keď ani pri `DPR_MIN` 3 s nedrží p90 ≤ 33 ms (mimo snímok s nahrávaním), `stop()` →
   world-off s pokojnou verziou (ZADANIE bod 3: ľahká rovnocenná verzia, nie čierna). Pri `?film=on` (testy
   v kontajneri) brzda nesmie zasiahnuť; na test pridať ladiaci prepínač (napr. `BS30_FILM.brzdaTest()`).
   Zmena DPR s hysteréziou a len v pokoji; pri zmene DPR stačí `layout()`, nie `measure()` (`film.js:1189–1207`).
8. **T2/KF-04 – len bez zmeny vzhľadu:** nekresliť, keď plátno celé zakrýva nepriehľadný pás (`.band`,
   `style.css:633–639`; poloha z `measure()`, bez čítania rozloženia v snímke). Kreslenie plnou frekvenciou
   v pokoji ostáva (rozhodnutie majiteľa, `film.js:982–984`; otázka Q3).

**Akceptačné kritériá** (`?film=on&uvod=off`, telefón 390 × 844 DPR 3, Fast 4G):
- `skrol2.mjs --film=on --cpu=1 --do=2900 --js=ab/gl-pocitadlo.js` (čas vlákna, skrol 0 → 2 900 px): skript na
  snímku vo vstup-dnu / remesle / čakárni **≤ 1,6 ms** každý (pred 3,09 / 6,19 / 3,66; bez sekvencií 1,37 / 1,25 /
  1,34), `film.js frame` p95 ≤ 1,5 ms a max ≤ 6 ms (4,5 / 20,6).
- To isté pri `--cpu=4`: `film.js frame` p95 ≤ 10 ms, **0 volaní > 50 ms** (dnes p95 32, 10 volaní > 50 ms).
- Sonda `over-film.mjs --cpu=4` (scenár dole): snímky filmu s nahrávaním > 3 ms ≤ 5 %, najviac 6 ms (dnes 55 z 269
  > 8 ms, max 49,2); **žiadna snímka s dvoma nahratiami sekvencie** (dnes 38,7 ms).
- `nahratie.mjs --cpu=4 --opakuj=5`: pás fotky z workera ≤ 2 ms medián (7,4).
- Prvý dotyk (`over-film.mjs` beh, `over-skok.mjs`): **žiadna LoAF > 50 ms so skriptom film.js alebo three** pri
  CPU 4× (dnes 152–497 ms); sonda: jeden WebGL2 kontext (dnes testovací + renderer).
- Sonda: žiadne prvé `useProgram` ani `getProgramParameter` v snímke filmu po prvom snímku (dnes 183,5 ms);
  `generateMipmap` len pri strihoch, ktoré čítajú LOD (dnes 51 z 269 snímok 2×).
- T10: `BS30_FILM.state.dpr` po skrole s nahrávaním nie nižšie ako pri tom istom skrole bez sekvencií (A/B
  `--sub=zamena-bez-seq.json`).
- Brzda: s `?film=on` sa nespustí; ladiaci test prepne na world-off do 3,5 s, zálohy viditeľné, 0 okien tmy.
- Pod nepriehľadným pásom (`over-pokoj.mjs` alebo `necinnost.mjs --y=<y v páse cenníka>`): 0 kreslení filmu za 5 s
  (dnes každá snímka); mimo pásu sa kreslí ako dnes.
- Vzhľad: `karty-shot.mjs --wait=5000` telefón aj počítač, `strih-shot.mjs`: rozdiel farieb pred/po ≤ 1 úroveň
  priemerne (worker nesmie zmeniť farby ani ostrosť); `uvod-meranie.mjs` a `uvod-zhoda.py` ako dnes.
- Pamäť grafiky ≤ 140 MB na telefóne.

**Overenie pred/po:** `$N/overenie-vykon-telefon`: `node skrol2.mjs --film=on --cpu=1 --do=2900 --js=ab/gl-pocitadlo.js
--meno=d4-on-cpu1` a `--cpu=4 --meno=d4-on-cpu4`, `node rozbor-frame.mjs stopy/<meno>.json` (pri `--stopa=1`),
`node nahratie-vlakno.mjs --cpu=1`, `node necinnost.mjs --cpu=1 --sekund=15 --y=<y>`. `$N/overenie-kod-film`:
`node over-film.mjs --cpu=4 --net=fast4g --out=d4-beh1`, `node over-skok.mjs --cpu=4 --net=fast4g --dpr=3 --out=d4-skok`,
`node nahratie.mjs --cpu=4 --opakuj=5`, `node over-pokoj.mjs --cpu=1` a `--cpu=4`.

**Riziko regresie a ochrana:**
- Worker a `getImageData`: farebný priestor (sRGB, nepremultiplikované) – porovnať pixely pred/po; pamäťové špičky
  z prenosov (uvoľňovať hneď po nahratí); zrušenie úloh pri rýchlom švihu (`live()`), bez úniku (sonda bitmáp
  264/264 dnes).
- Kruh textúr: priame volania `gl` len cez `renderer.state` (väzba textúr), inak sa three pomýli v cache.
- Odovzdaný kontext three: nesprávne atribúty zapnú MSAA a alfu (pomalšie, iné okraje).
- Brzda v kontajneri (SwiftShader) by vypla film v testoch – len bez `?film=on`.
- iOS Safari < 16.4 bez `OffscreenCanvas` 2D → záložná cesta musí ostať funkčná (test s vypnutým workerom).
- Komprimované textúry (KTX2/Basis) a WebCodecs sa nerobia; až keď D4 na skutočnom telefóne nestačí (časť 6).

---

### D5 – Vzhľad telefónu a prechody

**Cieľ:** telefón vyzerá rovnako dobre ako počítač: text a obraz sa menia spolu, v pokoji nikdy dvojexpozícia ani
miestnosť bez nadpisu, správne orezy, ostrá galéria, chýbajúce prvky telefónu, čitateľný nadpisok, bez výmeny
písma a bez dlhých úloh pri prepnutí jazyka. Vzhľad sa neprerába, len dolaďuje.

**Nálezy (zoradené podľa dopadu):** VZ-05 a VZ-10 (spoločná príčina), K13, VZ-03, VZ-06, VZ-09, VZ-01 (3),
VZ-11, VZ-12, VZ-13, K14, K15, T7/K09 (jazyk), T8 (načítanie).

**Zmeny:**
1. **VZ-05 + VZ-10 – dokončenie v pokoji:** po 250–300 ms bez zmeny `scrollY` dostanú `--o` a `--so` karty, ktorá je
   v prechode, najbližšiu hodnotu 0 alebo 1 s prechodom krytia 300 ms (pri obmedzení pohybu bez prechodu); pri ďalšom
   skrole sa plynulo (300 ms) vráti riadenie zo `scrollY` (`app.js:180–200`). Pri `world-in` počítať krytie karty
   z polohy filmu `BS30_FILM.state.S` (prepočet cez kotvy filmu), nie zo `scrollY`, a app.js slučku nechať bežať,
   kým film dobieha (|T − S| > ε). Karta sa ďalej mení len krytím (ART_DIRECTION P11).
2. **K13 – galéria:** `sizes` podľa kreslenej šírky (`index.html:681–735`): fotky na výšku a štvorcové
   `(max-width: 640px) 78vw`, fotky na šírku v rámiku 4 : 5 `(max-width: 640px) 146vw`; pre tie štyri (detail-stol,
   buldog, kava, sud) doplniť stupeň 1600w cez `build_images.py` (zo skutočného originálu, manifest). Lenivé
   sťahovanie ostáva.
3. **VZ-03 – orezy (len ak je k dispozícii model hĺbky):** `film.py:34` cakaren `mfx ≈ 0,62–0,65`, `film.py:37` kava
   `mfx ≈ 0,45`; potom `python3 -I source/tools/film.py cakaren kava`, `stills.py`, náhľady (D2) a zjemnené hĺbky
   (D3). Model Depth Anything V2 small (~99 MB) v kontajneri nie je (`source/tools/depth/` chýba) – ak sa nedá
   stiahnuť, VZ-03 odložiť a zapísať (hĺbku výrezu nevyrábať ručne).
4. **VZ-06:** na telefóne bez filmu ukázať okno „Tím v akcii“ (`style.css:1282`: napr.
   `html:not(.world-in) .team-video { display: block }` v `@media (max-width: 720px)`; pri obmedzení pohybu a šetrení
   dát len plagát). Vodorovná linka progresu 2 px pod lištou (ART_DIRECTION 95–96), len `transform: scaleX` z `p`
   v app.js; „čisto informatívna“.
5. **VZ-09:** voľná dĺžka karty z CSS (`app.js:75, 92`): `free = r.height − výška .title-frame` (100svh, zmerané raz
   v `measure()`), resize bez zmeny šírky pri kartách ignorovať.
6. **VZ-01 (3):** pokojná verzia karty Poď ďalej na telefóne (`index.html:212–213`) zo záberu `sala-m`
   (1086/1448) namiesto snímky sekvencie `f025` 720 px. Hlavná oprava VZ-01 je otázka Q1.
7. **VZ-11:** len `.title-hero .kicker` na telefóne: silnejšie halo alebo jemná tmavá plocha pod nadpiskom.
8. **VZ-12:** pozadie menu plné `rgb(14, 13, 12)` (`style.css:327`), bez backdrop-filter.
9. **VZ-13:** výmenu Manrope 600/700 skryť bez bajtov pred LCP: záložné písmo s `size-adjust` (metriky Manrope);
   prednačítanie Manrope-700 s `fetchpriority="low"` len ak A/B Lighthouse nezhorší LCP.
10. **K14:** `.lang-offer` (`i18n.css:35–44`) `left: 16px; right: 16px; margin-inline: auto; width: fit-content;
    max-width: calc(100vw - 32px)`, posun len v osi Y.
11. **K15:** pri uloženom/zvolenom inom jazyku hlavička vloží `modulepreload` na `assets/i18n.js` a `preload as=fetch
    crossorigin` na `assets/i18n/<jazyk>.json`; poistku `t-wait` (`style.css:104`) skrátiť na ~1,2 s.
12. **T7/K09 – prepnutie jazyka (pokus s bránou):** `content-visibility: auto` + `contain-intrinsic-size: auto <výška>`
    na pásoch `.band` mimo okna, podľa vzoru HEAD SPA (vykreslenie vo voľných chvíľach po prvom pohybe, pri skoku
    na kotvu hneď všetko, trieda `cv-all` pri `location.hash`; toolbox `rychly-web/references/prvy-obraz.md`,
    `film-z-fotiek/references/vykon.md`). **Brána:** kotvy app.js (`shots[].top`) aj filmu (`BS30_FILM` kotvy) pred
    a po celom prechode stránkou rovnaké ± 1 px a CLS < 0,05 – inak vrátiť a zapísať. Nasadenie prekladu v jednom
    `requestAnimationFrame` (i18n.js:119–154).
13. **T8 – načítanie:** `<script type="module" src="assets/film.js" fetchpriority="low">` (`index.html:902`);
    delenie `.kin` na slová mimo prvej obrazovky po prvom obraze (`app.js:636–645`, rAF + `requestIdleCallback`).
    Predčítanie zálohy úvodu ostáva (chráni pred tmou).

**Akceptačné kritériá:**
- `tempo-over.mjs --dev=p390 --tah=svih|stredne|pomaly` a `--dev=d1440 --tah=koliesko`: |t50 textu − t50 obrazu|
  **≤ 100 ms** (dnes 150–367 ms); `pasma.mjs`: po 1 s pokoja **0 px** bez nadpisu (dnes 54–75 px na hranicu).
- `dvojexpozicia-over.mjs`: po 1 s pokoja má každá karta `--so` a `--o` v {0, 1} na všetkých testovaných y (dnes
  0,25–0,27).
- `over-galeria.mjs`: pomer zdroj / kreslené px ≥ 1,0 pre fotky na výšku a ≥ 0,95 pre fotky na šírku (dnes 0,76 a
  0,41) pri 390@3 aj 412@2,625.
- VZ-03 (ak sa robí): na snímke `zabery.mjs --dev=p390` je buldog celý a šálka celá; `presah-over.mjs` + `fialova.py`
  0 % odhalenej hrany.
- `pasy-over.mjs`: na telefóne s `?film=off` má `.team-video` zobrazenie iné než none, linka progresu viditeľná;
  `skrol.mjs --scen=stredne` štýl na snímku nie horší než výsledok D1 + 0,2 ms.
- `lista-over.mjs`: |Δ`--o`| ≤ 0,05 pri zmene `innerHeight` o 56 px (dnes 0,15–1,0).
- `sirka-hran.py`: σ karty Poď ďalej v pokojnej verzii ≤ 1,3 px displeja (dnes 1,76).
- `kontrast-over2.mjs` + `kontrast-halo.py`: nadpisok úvodu p95 ≥ 4,5 : 1 v pokojnej verzii aj vo filme (4,1 / 3,2).
- `menu-over.mjs`: p99 jasu pozadia menu ≤ 15 (dnes 21,1).
- `pisma2.mjs --dev=p390 --siet=slow --behy=2`: Manrope 700 použité najneskôr pri FCP + 100 ms, alebo bez viditeľnej
  zmeny šírky textu (dnes ~0,5 s po FCP); LCP nezhoršiť.
- `jazyk-uvod.mjs`: ponuka jazyka ≥ 358 px široká, najviac 2 riadky (dnes 232 px, 4 riadky);
  `jazyk-uvod2.mjs`: nadpis skrytý ≤ 0,6 s po FCP pri Fast 4G a ≤ 1,2 s pri Slow 4G (dnes 1,23–1,41 a 2,04–2,16 s).
- Jazyk (`inp.mjs --film=off --cpu=4`, `interakcie.mjs`): po EN aj SK žiadna úloha > 100 ms (dnes 178–378 ms),
  cieľ 50 ms; ak brána c-v neprejde, zapísať a nechať dnešný stav.
- Načítanie: Lighthouse mobil (gzip, nízka záťaž) ≥ 95 a LCP ≤ 2,5 s alebo aspoň o 0,2 s lepšie než pred
  (dnes 95–96, 2,7–2,9 s); naživo po nasadení mobil ≥ 95 a LCP ≤ 2,5 s (CHECKS §11: 2,1–2,5 s), počítač ≥ 98 lokálne
  a 100 naživo; CLS < 0,05; `index.html` gzip ≤ 14 600 B; `i18n-test.mjs` všetky jazyky.

**Overenie pred/po:** `$N/overenie-vzhlad-zhoda/beh2`: `tempo-over.mjs`, `pasma.mjs`, `dvojexpozicia-over.mjs`,
`zabery.mjs --dev=p390|d1440 --mode=on|off` + `sirka-hran.py`, `kontrast-over2.mjs --dev=p390 --mode=off|on` +
`kontrast-halo.py`, `menu-over.mjs`, `pisma2.mjs`, `lista-over.mjs`, `pasy-over.mjs`, `presah-over.mjs` + `fialova.py`.
`$N/overenie-kod-stranka`: `over-galeria.mjs`, `jazyk-uvod.mjs`, `jazyk-uvod2.mjs`, `interakcie.mjs`, `ab3.sh`
(stredne). `$N/overenie-vykon-telefon`: `inp.mjs --film=off --cpu=4`, `nacitanie.mjs`, Lighthouse.

**Riziko regresie a ochrana:**
- Dokončenie v pokoji nesmie „skočiť“ pri ďalšom skrole (návrat s prechodom); pri obmedzení pohybu bez animácie.
- Krytie z polohy filmu: app.js nesmie čítať rozloženie v snímke; pri world-off ostáva `scrollY`.
- `content-visibility` mení výšky pásov a tým kotvy filmu → brána ± 1 px, inak vrátiť.
- Nové `sizes` a 1600w zväčšia bajty galérie (len lenivo v páse, nie prvý obraz).
- Video tímu na telefóne v pokojnej verzii = bajty: len pri pohybe a v okne, pri šetrení dát len plagát.
- Nový viditeľný text nevzniká; keby áno, kľúč vo všetkých `assets/i18n/*.json`.

---

## 5. Zachovať (funguje a nesmie sa rozbiť)

**Funkcie (ZADANIE časť 3, README):** úvodný film s dverami raz za návštevu (`?uvod=znova`, `?uvod=off`), „Späť na
ulicu“ / „Vojdi dnu“ (aj koliesko nahor na vrchu, potiahnutie nadol, šípky), kurzor nožníc a svetlo pod ním (len
myš), hudba a strih (počítač; tlačidlo Hudba pamätá voľbu), `?film=off|on`, `?motion=off`, `?hudba=off`,
`?svetlo=off`, `?lang=`, obmedzenie pohybu (všetko statické a viditeľné), šetrenie dát (bez filmu a videí),
8 jazykov s ponukou jazyka a Booqme v jazyku stránky, tabuľa dnešných hodín (Europe/Bratislava), lightbox galérie,
pásy tímu, galérie a recenzií posúvané prstom (zámer, VZ-06), mobilné tlačidlo Rezervovať (skryté v úvode, cenníku,
rezervácii a pri menu), menu na celú obrazovku s fokusom, vernostná karta (naživo vypnutá, kód nesmie spadnúť;
pri zapnutí `showModal` + `focus` v rAF), recenzie, JSON-LD, hreflang v `sitemap.xml`, obsah a odkazy bez zmeny.

**Rozhodnutia majiteľa:**
- Kamera sa hýbe stále, plnou frekvenciou displeja aj v pokoji (3 min), 60–240 Hz (CHECKS §12, `film.js:982–984`).
- Chôdza kamery Poď ďalej a Remeslo ako sekvencie snímok po 0,1 s (nie video so seek), tím ako slučka 60 snímok/s.
- Na telefóne tri karty zo skutočných videí majiteľa (TOUR_DIRECTION 146) – zmena len so súhlasom (Q1, Q6).
- 9 kariet, pružina w0 6,5 (~0,7 s), karta 70 % okna / 1,6 okna pred pásom, koliesko na počítači plynulo 140 ms.
- Titulné karty sa menia len krytím, nikdy sa nehýbu; strihy podľa tabuľky `CUTS` (na telefóne sala>stol prelínanie,
  cakaren>sala-rano pohyb – VZ-04 vyvrátený), fotky bez tónovania, len vinetácia a krátke stmavnutie pri prelínaní.
- Presah fotky 1,24 (overené 0 % odhalenej hrany na všetkých strihoch telefónu), prológ: chôdza 1,3 s, vstup 1,0 s.
- Žiadny backdrop-filter na mobile, komentáre a commity po slovensky bez podpisov, žiadna zmienka o AI.

**Čo funguje (s číslom, nesmie sa zhoršiť):**
- CLS ≤ 0,0005 všade; LCP je text úvodu 0,75–0,99 s (Fast 4G, emulácia), HTML gzip 14 380 B (prvé okno TCP).
- Hlavné vlákno pokojnej verzie pri CPU 1× p95 6,3–7,4 ms; počítač pri CPU 1× p95 7–8 ms (T9 vyvrátený).
- Lighthouse lokálne s gzip: mobil 95–96, počítač 98; naživo (CHECKS §11) mobil medián 97, počítač 100.
- Zhoda zálohy s prvým snímkom filmu ≤ 7 px, mierka 0,98–0,99 (`uvod-zhoda.py`); prológ bez čakania pri dverách,
  dpr 2 celý prológ (`uvod-meranie.mjs`).
- Bez úniku ImageBitmap (264 vytvorených / 264 zavretých); 0 % odhalenej hrany pri strihoch.
- Rovnaký systém písma, farieb a kariet na telefóne aj počítači; tmavé spodky záberov sú zámerná clona pod textom
  (`style.css:1149`); odkrývanie kariet tímu a krokov strihu je v poriadku (CO-6 vyvrátený).
- Testy: `app-smoke.mjs` 105 OK, `koliesko-test.mjs`, `uvod-shot.mjs`, `karty-shot.mjs`, `strih-shot.mjs`,
  `i18n-test.mjs`, `atmosfera-test.mjs`.

## 6. Vyvrátené, odložené a mimo rozsahu (nerobiť)

**Vyvrátené overením:** T9 (počítač: backdrop-filter, koliesko), T11 (lišta a nadpis úvodu), K10 (čítanie scrollY
v rAF – práca sa len presunie), K17 (rozmazanie slov .kw), CO-6 (karty tímu a kroky), VZ-04 (iné strihy na telefóne),
CO-7 na telefóne, časti VZ-03 (Cestou von, tmavé spodky, „19–25 % šírky“), VZ-06 pásy, VZ-11 nadpis (len nadpisok
platí), Lighthouse 55–77 (záťaž a server bez gzip), „app.js vynúti layout pred prvým obrazom“, „style.css 72 kB
blokuje“, INP 1,3–3,5 s s filmom (artefakt kontajnera), T5 úspora 2 ms (will-change bez merateľného zisku),
„telefón vždy 1448 px“ a „FIFO fronta pred cieľom“ (KF-05).

**Navrhnuté opravy, ktoré sa nerobia:** návrat k videu so seek (T1), obmedzenie frekvencie počas pohybu (T2/KF-04),
`@property --o/--so` s `initial-value: 0` (stmaví úvod), `decoding="sync"` pre úvod (prvý obraz o 0,7–1 s neskôr),
`overscroll-behavior` namiesto zamknutia stránky pri menu (bez zisku), `sizes` 1086 pri DPR 3 (horšia ostrosť;
tmu rieši náhľad), presah 1,12 kvôli ostrosti (ostrosť nezvýši, VZ-08), `effectiveType` v bráne filmu (náhľad rieši
pomalú sieť).

**Odložené (potrebujú skutočné zariadenie alebo majiteľa):** VZ-08 vyššie DPR plátna na 3× displejoch (až po meraní
na telefóne, Q5), VZ-07 úvodná fotka na počítači (Q4), VZ-01 originály videí (Q1), komprimované textúry KTX2/Basis
alebo WebCodecs (len ak D4 na skutočnom telefóne nestačí), strih „popredie“ na počítači s tmavým predmetom v polovici
prechodu (dizajn strihu, nie čierne okno), kreslenie v pokoji s nižšou frekvenciou (Q3).

## 7. Otázky pre majiteľa (neblokujú dávky)

- **Q1** Originály videí z telefónu (1080p alebo 4K) pre Poď ďalej, Remeslo a Tím. Bez nich ostanú tieto tri karty
  na telefóne mäkšie (zdroj 576 px), to už majiteľ vytkol pri Remesle (CHECKS §11).
- **Q2** Hudba na telefóne: dnes sa pustí pri prvom ťuknutí (README), po D1 len pri ťuknutí, nie pri skrole. Má sa na
  telefóne púšťať len tlačidlom Hudba (ZADANIE ju uvádza pri počítači)?
- **Q3** Film kreslí v pokoji plnou frekvenciou 3 minúty (batéria, teplo). Súhlas so šetrením v pokoji, ktoré obraz
  nezmení (posun pod 0,1 px na snímku)? Bez súhlasu ostáva.
- **Q4** Úvod na počítači: rohožka má len 1920 px a polovica záberu je takmer čierna. Lepšia fotka rohožky na šírku
  (≥ 2 896 px), alebo súhlas s posunom bodu záujmu.
- **Q5** Ostrejší film na displejoch 3× (dnes plátno 2×) – rozhodnúť po teste na skutočnom telefóne (plynulosť má
  prednosť).
- **Q6** Ak originály videí nebudú: na telefóne pri troch kartách fotky (sala-m, stol-m, sala-rano-m) a video v okne?
- **Q7** Overenie na skutočnom iPhone a Androide po D3 a D4 (strata kontextu v Safari, worker, 120 Hz), lebo
  kontajner nemá grafickú kartu.

## 8. Meranie: nástroje, príkazy a základné hodnoty (pred = `bcd487e`)

Príprava: `bash $SP/barber/audit/plan/nastroje.sh <cieľ> <port> <strom>`; server `cd <strom> && python3 -m http.server
<port>`. Telefón = 390 × 844, DPR 3, dotyk, Fast 4G (165 ms, 9 Mb/s × 0,9), Slow 4G (562,5 ms, 180 kB/s).
Čísla sú z overení 20. 10. (`audit/overenie-*`); kontrolné zopakovanie pri nízkej záťaži 20. 10. (kópia nástrojov,
port 8581) je v `$SP/barber/audit/plan/zaklad-20-10/` (skrol stredne, čas vlákna film vypnutý a film so sekvenciami,
`hlavicka.mjs`, `pata2.mjs`) a zhoduje sa s overeniami.

| Oblasť | Príkaz (v kópii nástrojov) | Základ (pred) |
|---|---|---|
| Skrol stránky, CPU 4× | `overenie-kod-stranka: bash ab3.sh <p> stredne 3 uvod=off zaklad; python3 ab-suhrn.py <p>` | úloha snímky p95 33,98 (20. 10. 32,75), štýl/sn 3,84 (3,76), p95 štýlu 19,4, > 16,7 ms 19,7 %, dlhé úlohy 26 (15), LoAF > 50 49 (46), rAF p95 50, rAF > 33 ms 10,6 % |
| Švih, CPU 4× | `… ab3.sh <p> svih 3 uvod=off zaklad` | úloha snímky p95 19,0, štýl/sn 1,16, dlhé úlohy 8, rAF > 100 ms 11 |
| Prvý dotyk | `… ab3.sh <p> prvy-dotyk 2 'uvod=off&hudba=off' zaklad` | najdlhšia úloha 282–378 ms (Layout 206–269), LoAF 326–370 ms |
| Tabuľa hodín | `… ab3.sh <p> kontakt 2 uvod=off zaklad` (pole `vynutene`) | Layout z app.js:693 146–149× (305–355 ms), skript tabule 774–840 ms |
| Hudba | `overenie-kod-stranka: node over-audio.mjs --n=2` | AudioContext po ťahu 6/6, touchend LoAF 70–137 ms, decode LoAF 57–130 ms |
| Intl, scéna, lišta | `node over-intl.mjs --n=3`, `node cena-sceny.mjs`, `node hlavicka.mjs` | 30–89 ms; 2,6–6,0 ms/zmena; telefón `blur(12px)` |
| Čas vlákna, film vypnutý | `overenie-vykon-telefon: node skrol2.mjs --film=off --cpu=1` / `--cpu=4` | CPU 1×: p50 1,9–3,4, p95 6,3–7,4, štýl 0,97–1,37 ms; CPU 4×: p95 27,5–33,1, > 33 ms 3,1–4,8 % |
| Film, sekvencie | `node skrol2.mjs --film=on --cpu=1 --do=2900 --js=ab/gl-pocitadlo.js` (A/B `--sub=zamena-bez-seq.json`) | skript/snímku vstup-dnu / remeslo / čakáreň 3,09 / 6,19 / 3,66 ms (20. 10.: 3,10 / 5,73 / 3,35), bez sekvencií 1,37 / 1,25 / 1,34; frame p95 4,5, max 19,6–20,6 ms; 420 MB nahratí; DPR klesne na 1 |
| Film, CPU 4× | to isté `--cpu=4` | frame p90 23, p95 32, max 204 ms, 10 volaní > 50 ms |
| Nahrávanie textúr | `overenie-kod-film: node nahratie.mjs --cpu=4 --opakuj=5` | pás ImageBitmap 7,4 ms (Uint8Array 1,5), sekvencia 18,6 ms, celá fotka 70,6 ms |
| Film v stránke | `node over-film.mjs --cpu=4 --net=fast4g --out=<o>` + `sero.py`, `tma.py` | 55/269 snímok > 8 ms nahrávania (max 49,2), 2 sekv. v snímke 38,7 ms; menu→Služby 1 223 ms 100 % čierno; kontext 89 % čierno; po dotyku LoAF 152–497 ms |
| Skok na logo | `node over-skok.mjs --cpu=4 --net=fast4g --dpr=3 --out=<o> --cakaj=20000` | šero 4 150 ms, čierna snímka |
| Náhradný záber | `node over-kf02.mjs --cpu=1 --out=<o>` | 6,4 s čierno pri pripravenom susedovi |
| Odovzdanie | `overenie-vzhlad-zhoda/beh2: node odovzdanie-over.mjs --dev=p390` (a `--dev=d1440`) + `jas-odovzdania.py`; `overenie-kod-film: odovzdanie-pixely.py` | jas pásu 53 % (telefón) a 60 % (počítač) pri 450 ms; faktor obrazu min 0,38 |
| Čierne okná (sada) | `overenie-cierne-okna: bash beh.sh <prípona>` (alebo jednotlivo `node over.mjs …` + `python3 over2.py runs/<meno>`) | film skok DPR 1 cache 606–3 044 ms, DPR 3 325–8 321 ms; švih 1 182–3 794 ms; pokojná švih 539–2 001 ms, skok 470–3 932 ms; Slow 4G skok 4 675–5 774 ms |
| Prvý obraz | `node over.mjs --scen=uvod --cache=cold …` | tma po FCP: telefón Fast 4G 1 028 ms (film off 2 454), Slow 4G 3 511 ms, počítač Slow 4G 4 719 ms |
| Pätička | `node nastroje/pata2.mjs` | 1024 × 1366: 535 px (39 %), 1920 × 1080: 238 px, 2560 × 1440: 598 px (20. 10. zopakované) |
| Dekódovanie | `overenie-kod-stranka: node over-dekod.mjs --n=2 && python3 -I over-dekod.py dekod` | A: 2–4 snímky 77–98 % tmy; B: 14–16 snímok slepého portrétu |
| Skok z menu | `node interakcie.mjs` | skok na Kontakt 15 obrázkov, is-near 7–9 kotiev, LoAF 51–93 ms |
| INP | `overenie-vykon-telefon: node inp.mjs --film=off --cpu=4` / `--cpu=6` | menu 112–136 / 216 ms, jazyk 56–144 / 80–224 ms, úlohy po jazyku 178–318 ms |
| Načítanie | `node nacitanie.mjs --film=off --cpu=4` | LCP text 0,75–0,99 s, TBT 444 ms (7 dlhých úloh) |
| Lighthouse | gzip server + `lighthouse` (časť 3) | mobil 95 / 96, LCP 2,9 / 2,7 s, TBT 10–20 ms; počítač 98, LCP 1,0 s |
| Vzhľad | `overenie-vzhlad-zhoda/beh2`: `tempo-over.mjs`, `pasma.mjs`, `dvojexpozicia-over.mjs`, `zabery.mjs` + `sirka-hran.py`, `kontrast-over2.mjs` + `kontrast-halo.py`, `menu-over.mjs`, `pisma2.mjs`, `lista-over.mjs`, `pasy-over.mjs`; `overenie-kod-stranka`: `over-galeria.mjs`, `jazyk-uvod*.mjs` | text vs obraz 150–367 ms; bez nadpisu 54–75 px; dvojexpozícia 0,25–0,27; videá σ 1,69–1,84 vs fotky 1,20; nadpisok p95 4,1 / 3,2; menu p99 21,1; Manrope 700 ~0,5 s po FCP; Δ`--o` 0,15–1,0; galéria 0,41× / 0,76×; ponuka jazyka 232 px; nadpis skrytý 1,23–2,16 s po FCP |

Zápis výsledkov: `$SP/barber/opravy/<dávka>/<rola>/` (tabuľka pred/po, príkazy, záťaž, kľúčové snímky). Po
poslednej dávke nová časť `barbershop-30/docs/CHECKS.md` (Plynulosť na telefóne a čierne okná, 2026-10: metodika,
čísla pred/po, čo sa zmenilo, ako zopakovať meranie).
