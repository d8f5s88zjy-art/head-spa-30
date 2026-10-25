# V5 etapa 1 – Recepcia: kontrola vzhľadu a interakcie, kolo 2 (25. 10. 2026, 11:17–11:50 UTC)

Kontrolu robil nezávislý kontrolór vzhľadu. V strome som nič nemenil.

- Strom PO: `$SP/hs-recepcia`, vetva `barbershop-recepcia`, HEAD **`854e849`**. `git status --short` = 0 riadkov pred kontrolou aj po nej.
- Strom PRED: `git worktree add --detach $SP/hs-recepcia-pred f624ee8`. Po kontrole som ho odstránil (`git worktree remove`) a `worktree list | grep -c recepcia-pred` vrátil 0.
- `$SP` = `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad`, `$S5` = `$SP/barber/lahky-telefon/v2/stavba-v5`.
- Prehliadač: Playwright z `/opt/node22/lib/node_modules/`, Chromium 1194 (headless_shell, swiftshader). Vždy bežal len jeden môj prehliadač naraz, každý beh mal `timeout` ≤ 290 s.
- Servery: `python3 -m http.server` na 127.0.0.1:8721 (PO) a 8722 (PRED). Title som overil curlom: „Barbershop 30 Nitra | Pánske strihy, brada a holenie – rezervácia online“. 8721 vracia `assets/recepcia.js` 200, 8722 vracia 404. Po kontrole som oba servery ukončil (počet procesov 0). Nástroje stromu bežali s `B30_PORT=8720` a `NODE_PATH=/opt/node22/lib/node_modules`.
- **Súbežne bežal prehliadač iného tímu**: `pgrep -c -f "headless_shell|chrome-linux/chrome"` = 2 pred mojimi behmi aj po nich, load average 7,7–18,4. Časy a váhy sú preto **orientačné**.
- Skripty a surové výstupy sú v `$S5/vzhlad2/`: `vzhlad2.mjs`, `film.mjs` (kópia z kola 1), `rovnako2.mjs`, `harky2.py`, `po-/pred-{telefon,pocitac}.json`, `film-po.json`, `i18n-test-po.txt`, `app-smoke-{po,pred}.txt` a `vaha-{po,pred}.txt`.
- Snímky sú v `$S5/snimky-v5/` s predponou `v2-` (43 súborov). Hárky `pred-po-telefon.jpg` (625 496 B) a `pred-po-pocitac.jpg` (580 827 B) som prepísal. Hárky z kola 1 som zachoval ako `pred-po-*-kolo1.jpg`. Oba nové hárky aj kľúčové snímky (cena, voľby, fokus volieb, dámy, panel, uk, cena na počítači, voľby na počítači, film úvod a ulica) som otvoril a prezrel.

**Verdikt: všetkých 7 opráv (S7, S3, S2, V1, D1, D2, D8) v prehliadači PREŠLO. Vzhľad v pokoji je nezmenený. Interakcia má jeden nový stredný nález (V6: voľby „Myslíš toto?“ majú 40 px, nie 44 px) a tri drobné.**

## Overenie opráv z `kontrola-vzhlad-v5.md`

| nález | kolo 1 (6f8c47c) | kolo 2 (854e849) | dôkaz |
|---|---|---|---|
| **S7** posun stránky pri otvorenom paneli | ťah 5 304 → 4 242, po Esc 4 314; koliesko 6 466 → 6 966 | **PREŠLO.** Telefón (dotyk cez CDP): scrollY 5 304 pred otvorením, po otvorení, po ťahu na konci logu, po 6 ťahoch na začiatku logu, po ťahu cez pozadie nahor aj nadol a po zatvorení krížikom. Počítač: 6 466 po koliesku nad logom (nadol aj nahor), nad pozadím (nadol aj nahor) a po zatvorení. Počas otvorenia je `body.style.overflow` = „hidden“, po zatvorení „“. `overscroll-behavior` je `contain` na paneli aj logu. Šírka 390 = 390 a 1 440 = 1 440, logo x 16 → 16 a 40 → 40. Kritérium 8.4 v Chromiu platí | `po-telefon.json` `S7`, `poOtvoreni`; `po-pocitac.json` `S7` |
| **S3** pás filmu zakrýva tlačidlo | z 36 pod pásom z 38, viditeľný len oblúk | **PREŠLO.** `?film=on`: tlačidlo z 39, pás z 38. Pri objavení (úvod `pro`) aj na ulici sa geometricky prekrývajú 48 px, ale `elementFromPoint` dolného okraja = tlačidlo. Na snímke je celý kruh s ikonou nad čiernym pásom | `film-po.json` `priObjaveni`, `ulica`; `v2-po-pocitac-film-uvod-vyrez.png`, `-ulica-vyrez.png` |
| **S2** film reaguje na kláves a koliesko | šípka hore → `outside`, koliesko → `pro` | **PREŠLO.** Vnútri, panel otvorený: koliesko nahor nad logom aj nad pozadím a klik do bubliny (fokus `rc-panel`) + šípka hore. Trieda `html` ostáva „… world-in“ bez `outside`/`pro`, panel ostáva otvorený. Na ulici sa trieda „pro“ → „outside“ zmenila len dokončením prechodu, ktorý spustili dvere, nie kolieskom | `film-po.json` `S2_*` |
| **V1** rad volieb sa nevráti na začiatok | po 4× Tab, Esc a ťuknutí scrollLeft 149, fokus x −133 | **PREŠLO.** Telefón: 4× Tab → scrollLeft 149, Esc, ťuknutie → scrollLeft **0**, fokus „Rezervovať“ x 16–120. Vodorovný ťah prstom v rade (scrollLeft 149), zatvorenie krížikom a nové otvorenie → 0, x 16. Počítač: Tab aj vodorovné koliesko → 181, po novom otvorení 0, x 1 057 | `po-*.json` `V1`, `S7.chipsPoTahu`; `v2-po-telefon-volby-znova.png` |
| **D1** nábeh pri `?motion=off` | `animation-name: rc-btn` | **PREŠLO.** `?motion=off`: `data-motion` = off, tlačidlo aj panel `animation-name: none`. `reduce`: none/none. Bežne: rc-btn/rc-in (telefón aj počítač) | `pohyb` |
| **D2** pravé hrany na počítači | panel sprava 24 px, tlačidlo 40 px | **PREŠLO.** Panel x 1 040–1 400, tlačidlo 1 344–1 400, pravé hrany 1 400 = 1 400. Spodok panela 808, tlačidlo od 820 (medzera 12 px), merané po dokončení animácie (`getAnimations().finish()`) | `po-pocitac.json` `panel` |
| **D8** orezaný obrys fokusu | obrys vľavo rovno orezaný | **PREŠLO.** Otvorenie klávesom Enter: prvá voľba „Rezervovať“, `:focus-visible`, obrys 2 px + odsadenie 3 px = 5 px. Voľba je od okraja radu 6 px vľavo a 8 px hore aj dole (`.rc-chips` padding 8px 6px, margin 0 −6px). Text panela ostal zarovnaný (voľba x 16 = nadpis x 16). Na snímke je obrys celý | `D8`; `v2-po-telefon-fokus.png`, `v2-po-pocitac-fokus.png` |

## Čo ďalej prešlo (zmerané)

| čo | výsledok | dôkaz |
|---|---|---|
| pokoj, telefón 390×844 @3 | rozdiel PRED/PO je len v (48, 2346)–(186, 2484) px, teda v tlačidle. Mimo rámu tlačidla + 40 px je rozdiel **0 px**, v pokoji aj pri #sluzby | PIL `ImageChops.difference` > 24; `v2-{pred,po}-telefon-{pokoj,tlacidlo}.png` |
| pokoj, počítač 1440×900 | pokoj: rozdiel len v (1344, 821)–(1400, 876). Stred stránky pri rovnakom časovaní (9 s + 5 s, `rovnako2.mjs`): rozdiel len v ráme tlačidla, mimo neho **0 px**. Snímka `v2-*-pocitac-tlacidlo.png` s rôznym časovaním sa líši celá (animácia scény), preto ju neporovnávam | `v2-{pred,po}-pocitac-r-stred.png` |
| tlačidlo | telefón 46×46, x 16, y 782, z 39. Počítač 56×56, sprava 40, zdola 24, z 39. `aria-label` „Spýtaj sa recepcie“. Objaví sa 1 595 ms (telefón) a 1 971 ms (počítač) po `load` (orientačne) | `btn`, `tlacidloPoLoadMs` |
| CLS | pokoj: telefón 0, počítač 0,0001 (t 221 ms). PRED má rovnako 0 a 0,0001 (t 234 ms). Otvorenie a zatvorenie panela na počítači nepridá nič (0,0001 → 0,0001). Na telefóne pribudlo 0,0099 pri t 9 007 ms. Podľa kola 1 vzniká pri programovom skrole na #sluzby v PRED aj PO. V tomto kole som to znova neoddelil | `clsPokoj`, `clsPoOtvoreni`, `clsKoniec`; `pred-*.json` |
| **výrez cenníka** („koľko stojí strih“) | Telefón: bublina 315×199 px je celá v logu (`liCeleViditelne`), log končí nad formulárom (752 ≤ 760). Výrez má 291×105 px: nadpis „Strih“, zvýraznený riadok „Pánsky strih · 40 min · 18 €“ (`aria-current=true`, ľavý okraj `--lamp`, farba `--paper`) a susedný riadok „Pánsky strih a úprava brady · 60 min · 28 €“ (zalomený na 2 riadky, 51 px). Žiadny riadok ani časť nepretečie (scrollWidth ≤ clientWidth). Log nemá vodorovný posuv (358 = 358), stránka 390 = 390. Písmo 16 px. Počítač: bublina 287 px, rovnako bez pretečenia, 1 440 = 1 440. Čitateľné na snímke aj vo zväčšenom výreze | `odpovede.cena.cen`; `v2-po-telefon-cena(-vyrez).png`, `v2-po-pocitac-cena(-vyrez).png` |
| výrez v en a uk | en „how much is a haircut“ → „Cut / Men's haircut 40 min 18 € / Men's haircut and beard trim 60 min 28 €“ + „The booking page is in Slovak.“. uk „скільки коштує стрижка“ → „Стрижка / Чоловіча стрижка 40 хв 18 € / …28 €“. Celé viditeľné, bez pretečenia, šírka 390 = 390 a 1 440 = 1 440 | `jazyky.en/uk.odpoved` |
| **voľby „Myslíš toto?“** („strih a melír“) | poradie zhora: „Koľko stojí pánsky strih?“, „Farbíte vlasy?“, „Koľko stojí strih s bradou?“, potom Celý cenník (`#sluzby`) a Zavolať (`tel:+421951267203`). Zhoduje sa s `oprava-5.md` riadok 39. Šírky 135–230 px, medzera 8 px, výška **40 px** (V6) | `odpovede.volby.odkazy` |
| fokus volieb | Shift+Tab zo vstupu ide zdola nahor: Zavolať → Celý cenník → strih s bradou → farbíte → pánsky strih → (odkazy predchádzajúcej bubliny) → … Vždy je fokus v paneli a prvok vo viditeľnej časti logu, `:focus-visible`, obrys 2 px `--lamp` + 3 px. Ťuknutie na prvú voľbu pridá otázku „Koľko stojí pánsky strih?“ a výrez cenníka | `volbyShiftTab`, `volbaFokus`, `poVolbe`; `v2-po-*-volby-fokus.png`, `v2-po-telefon-po-volbe.png` |
| odovzdanie („strihate aj damy“) | „Dámske strihy na webe neuvádzame. Spýtaj sa recepcie: 0951 267 203 alebo info@barbershop30.sk.“ + Zavolať (`tel:+421951267203`) a Napísať e‑mail (`mailto:info@barbershop30.sk`). Bez ceny a bez sľubu, rovnako na telefóne aj počítači | `odpovede.damy` |
| Esc a fokus | Esc zatvorí panel, fokus sa vráti na `recepcia-btn` s `:focus-visible`, `aria-expanded` = false. 14× Tab ostane 14/14 v paneli. Pri otvorení ťuknutím je fokus na „Rezervovať“ bez `:focus-visible` | `D8.poEsc`, `D8.tabVPaneli`, `panel.fokus` |
| prepnutie jazyka sk → en → uk → sk | `aria-label`: „Spýtaj sa recepcie“ → „Ask the front desk“ → „Запитай рецепцію“ → „Spýtaj sa recepcie“. Nadpis Recepcia / Front desk / Рецепція, voľby, Zavrieť / Close / Закрити, placeholder a riadok o súkromí sú v jazyku stránky. `lang` panela sk / en / uk. Šírka bez zmeny | `jazyky.*` |
| konzola a sieť | 0 chýb na telefóne, počítači aj s filmom. Mimo 127.0.0.1 žiadna požiadavka. Moduly recepcie sa stiahnu až po ťuknutí: `recepcia.js`, `recepcia.css`, `recepcia/{sk,en,uk}.json` | `chyby`, `ziadosti`; `film-po.json` `chyby: []` |
| `i18n-test.mjs` | **64 OK, „Všetky kontroly prešli“**, exit 0, 44 s | `vzhlad2/i18n-test-po.txt` |
| `app-smoke.mjs` | PO: 132 OK, **2 FAIL**, ukončené limitom 290 s pri `[lite #tim]`. Oba FAIL sú typu `[lite 390/430] späť: aktuálna karta vstup is-near, fotka ` (prázdne). Rovnaký FAIL `[lite 430]` mali v kole 1 PRED aj PO. PRED: 113 OK, 0 FAIL, limit ho zastavil skôr (`[lite 390]` úvod), takže bod „späť“ nedosiahol. Recepcia v `app.js` len pridáva tlačidlo (16 riadkov, `git diff f624ee8 HEAD -- assets/app.js`) a karty ani fotky nemení. FAIL preto nepripisujem recepcii. Pri súbežnej záťaži (load 9–18) sa to ale nedá dokázať | `vzhlad2/app-smoke-{po,pred}.txt` |
| `vaha.mjs` | s prológom: počítač 2 013 vs 2 011 KB, telefón 2 408 vs 2 406 KB (**+2 KB**). „recepcia“ sa vo výpise nevyskytuje ani raz, teda do `load` sa nesťahuje. Stĺpec „do load“ kolíše (PO 703/228, PRED 286/605 KB), preto ho neporovnávam | `vzhlad2/vaha-{po,pred}.txt` |
| skrol pri zmene jazyka | po prepnutí na uk sa scrollY posunie 5 304 → 5 352 (telefón) a 6 466 → 6 513 (počítač). **Rovnako v PRED**, teda ide o stránku (dlhšie texty nad polohou), nie o recepciu | `rovnako2.mjs`: PRED aj PO `{"telefonPred":5304,"telefonPoUk":5352,"pocitacPoUk":6513}` |
| slovo AI | v `recepcia/sk.json` 0 výskytov „AI“, „umel“, „chatbot“ a „asistent“. V paneli je len „Recepcia“ | `grep -i` |

## Nové nálezy

### STREDNÉ

- **V6 – voľby „Myslíš toto?“ a akčné tlačidlá v odpovediach majú výšku 40 px, nie 44 px.**
  - Namerané na telefóne aj počítači: 3 voľby, Celý cenník, Zavolať, Rezervovať termín, Napísať e‑mail majú všetky `h: 40` (`odpovede.*.odkazy`).
  - Príčina: `.rc-btn{min-height:40px}` (recepcia.css:10). Rýchle voľby `.rc-chip` majú 44 px (:9) a Odoslať má 44 px, lebo sa natiahne na výšku vstupu.
  - Zadanie žiada pre voľby veľkosť ≥ 44 px. Návrh 3.3 chce 44 px pre chipy a Odoslať. Rozostup 8 px spĺňa WCAG 2.5.8 (24 px), ale nie cieľ 44 px.
  - Na telefóne sú voľby nad sebou s medzerou 8 px a ide o hlavný ťukací prvok „Myslíš toto?“.
  - Návrh: `.rc-btn{min-height:44px}` (pár bajtov). Zvážiť aj vzhľad volieb ako `.rc-chip` (zaoblené, bez verzálok), aby sa otázka na výber nečítala ako akcia „REZERVOVAŤ TERMÍN“. Na snímke „strih a melír“ vyzerajú voľby rovnako ako akčné tlačidlá a otázky sú vo verzálkach.

### DROBNÉ

- **V7 – na počítači je Odoslať pod vstupom.** Formulár má na počítači výšku 92 px (`panel.form.h`) a na telefóne 44 px. Pri šírke 326 px sa `input` (`flex:1 1 auto`, recepcia.css:21) a tlačidlo nezmestia vedľa seba a `flex-wrap:wrap` (:20) posunie Odoslať na nový riadok vľavo (`v2-po-pocitac-cena.png`). Bolo to tak už v kole 1 (panel 360×359). Návrh: `input{flex:1 1 0}` alebo `.rc-form{flex-wrap:nowrap}`.
- **V8 – tlmený text v bubline má kontrast 4,41 : 1** (pod AA 4,5 : 1). Farba `--paper-3` #8e8578 na pozadí bubliny (36, 33, 30), vzorka pixelu z `v2-po-telefon-cena-vyrez.png`. Týka sa susedného riadku cenníka (16 px, recepcia.css:16), nadpisu skupiny „Strih“, „zo stránky“ a riadku o súkromí (12,8 px, :19). Zvýraznený riadok `--paper` má 13,3 : 1. Návrh: v bubline svetlejší odtieň, alebo bublina bez 6 % prekrytia (:14).
- **V9 – úvod vyká, zvyšok tyká.** Úvod znie „Na ostatné **vám** rada odpovie recepcia.“ (`recepcia/sk.json:21`), ale panel má „Napíš otázku…“, „Myslíš toto?“, „Spýtaj sa recepcie“ a stránka „Rezervuješ…“. Navyše panel sám sa volá „Recepcia“, takže veta „odpovie recepcia“ môže pôsobiť, že ide o niekoho iného. Rozhodnúť textom (napr. „Na ostatné ti odpovie recepcia telefonicky alebo e‑mailom.“). Treba ho doplniť len z faktov stránky.

### Pozorovania (bez zmeny oproti kolu 1)

- **V2** – po zmene jazyka ostanú staré bubliny v pôvodnom jazyku (en: 16 zo 17 bublín inak, uk: 18 z 19). Podľa návrhu 3.5 je to zámer a každá bublina má vlastný `lang`.
- **V3** – na snímkach otvoreného panela je ikona Hudba v lište zapnutá. Ide o prvé kliknutie v atmosfera.js, je to rozhodnutie pre majiteľa.
- **V4, V5** – tvar a poloha tlačidla na telefóne sú bez zmeny.
- Ukrajinské verzálky („ЗАБРОНЮВАТИ ЧАС“, „НАДІСЛАТИ“) majú nerovnomerné medzery medzi písmenami. Rovnako je to v hlavičke stránky („НІТРА“), takže ide o záložné písmo pre cyriliku na celej stránke, nie o recepciu.
- Po ťuknutí na Odoslať ostáva fokus vo vstupe (oranžový obrys na snímkach). Na skutočnom telefóne preto ostane otvorená klávesnica a zmenší viditeľný log. V headless prehliadači sa to nedá overiť, treba pozrieť na iPhone (krit. 8.4–8.5).

## Čo som neoveril

- iPhone/Safari, VoiceOver, klávesnica iOS a klasický posuvník na počítači (`scrollbar-gutter`). Headless Chromium má skryté posuvníky (`gutter` = „“ pri otvorení).
- Lighthouse (CLS 0, LCP) – pri súbežnom prehliadači by čísla neboli spoľahlivé.
- `app-smoke.mjs` od `[lite #tim]` ďalej (PO) a od `[lite 390]` ďalej (PRED). Limit 290 s.
- Ťah nadol na hornej lište, ktorý má zatvoriť list (návrh 3.3), som neskúšal.
