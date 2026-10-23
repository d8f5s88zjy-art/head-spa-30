# V5 etapa 1 – Recepcia: odovzdávka (23. 10. 2026)

Strom: `$SP/hs-recepcia` (vetva `barbershop-recepcia` z `f624ee8`), `$SP` = `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad`.
Návrh: `$SP/barber/lahky-telefon/v2/asistent.md` (časti 1–3, 5–8). Nič sa nepushovalo, nemergovalo ani nenasadzovalo.
Recepcia nie je umelá inteligencia a nikde tak nie je označená. Návštevník vidí „Recepcia“ s pripravenými odpoveďami
zo stránky. Keď otázke nerozumie alebo podnik odpoveď nepotvrdil, odovzdá ho na telefón, e-mail a rezerváciu.

## Commity (lokálne, po slovensky, bez podpisov)

| hash | správa |
|---|---|
| `c7ffb2f` | BARBERSHOP 30: recepcia – porozumenie otázke a slovenské odpovede (z predchádzajúceho behu; overený a ponechaný) |
| `19a107c` | BARBERSHOP 30: recepcia – tlačidlo, panel a štýl |
| `be841ed` | BARBERSHOP 30: recepcia – 7 ďalších jazykov |

`git diff --stat f624ee8 HEAD`: 20 súborov, +1127 / −7; `index.html` nie je medzi nimi.

## Čo a kde (súbor:riadok v `barbershop-30/`)

- **Porozumenie** – `assets/recepcia.js`:
  - `:2` `norm`: NFD, odstránenie diakritiky, malé písmená, len písmená a číslice.
  - `:4` `dl`: Damerau-Levenshtein ≤ 1 (prerušený pri 2).
  - `:12` `dice`: Diceov koeficient bigramov.
  - `:18` `zhoda`: zhoda slova s kmeňom (kmeň 1; obsahuje 0,9; skrátené slovo 0,6; DL ≤ 1 na začiatku slova 0,6; Dice ≥ 0,6 → 0,5).
  - `:26` `skore`: silný kmeň × 2, cenové slová len pri položke s cenou, presný variant +2, skupiny „|“.
  - `:35` `veto`: silný kmeň témy „nevieme“ má prednosť pred položkami.
  - `:46` `odpovedz`: vráti `{typ, id, p, skore}`, kde typ je odpoved / vyber („Myslíš toto?“) / nevieme / fallback.
  - Prahy sú v JSON (`prah` 0,55 / 0,55 / 0,1, `sk.json:3`).
- **Panel** – `assets/recepcia.js`:
  - `:64–141`: natívny `<dialog id="rc-panel" data-no-i18n aria-labelledby="rc-h">`, otvára sa cez `showModal()`.
  - `:117` kostra je stály reťazec. Všetok text, aj otázka návštevníka, ide cez `textContent`.
  - `:79` `odpoved`: pri jazyku inom ako sk pridá poznámku `rez` z `i18n.js` (rezervácia je po slovensky).
  - `:90` `spytaj`: odovzdanie vždy s cestami tel / e-mail / rezervácia. `mailto` je bez tela správy.
  - `:101` `texty`: rýchle voľby Rezervovať (odkaz, nové okno), Hodiny, Cenník, Kde nás nájdete, Zavolať (`tel:`).
  - `:132` `spusti`: fokus na prvú voľbu, `aria-expanded` a `aria-controls`. Esc aj ťuknutie na pozadie zavrú panel a fokus sa vráti na tlačidlo.
  - Sieť: len `import()` modulu a `fetch` súboru `assets/recepcia/<jazyk>.json`. Bez localStorage, cookies a externých skriptov.
- **Štýl panelu** – `assets/recepcia.css:1–25`:
  - Na telefóne spodný list (`72svh`), na počítači karta 360 px vpravo dole (`:23`).
  - `::backdrop` bez backdrop-filter (`:3`). Farby len z premenných `style.css`.
  - Obmedzený pohyb: `prefers-reduced-motion` (`:24`) a `html[data-motion=off]` (`:25`).
- **Tlačidlo** – `assets/app.js:617–632` (časť 7d):
  - Vznikne vo `vPokoji` 1,5 s po `load`, vtedy sa aj ukáže. Modul sa načíta cez `import('./recepcia.js')` až po ťuknutí.
  - `aria-label` z kľúča „Spýtaj sa recepcie“ cez `B30_LANG.t`, pri `langchange` sa prepíše.
  - Obsluha `langchange` je nutná, lebo `i18n.js` neprekladá atribúty neskôr vložených prvkov (`i18n.js:107–115` adoptuje len textové uzly).
- **Štýl tlačidla** – `assets/style.css:1235–1242` (8 riadkov pri `.mobile-cta`):
  - Pevne položené (`position: fixed`), rozloženie nemení.
  - Počítač: vpravo dole 56 px, `bottom: 24px`. Telefón (≤ 900 px): vľavo dole 46 px na základni zhluku.
  - `z-index: 36`. Pri `data-menu="open"` skryté. Nástup len krytím, pri `prefers-reduced-motion` bez neho.
- **Slovenské odpovede** – `assets/recepcia/sk.json`:
  - 30 položiek (`:33–62`): každá má `zdroj` index.html:riadok a `overene`.
  - 20 tém „nevieme“ (`:64–85`): 19 z návrhu + `zdravie` (alergie, pleť).
  - Úvodná veta (`:19`): „Odpovedám z pripravených odpovedí k podniku. Na ostatné vám rada odpovie recepcia.“
- **7 jazykov** – `assets/recepcia/{en,uk,hu,sr,pl,de,cs}.json`:
  - Rovnaké id, akcie, zdroje a dátumy ako sk.
  - Vety odpovedí sú doslovne zo slovníkov stránky (44 úryvkov na jazyk, test ich porovnáva). Úryvky väčších uzlov (tím, recepčná) sú vety z ich prekladu v slovníku.
  - Ceny ostávajú „18 €“ ako na stránke. Telefón je v tvare +421 951 267 203. Booqme je v jazyku ako na stránke (`i18n.js:31`).
- **Jediný nový kľúč v slovníkoch** – `assets/i18n/*.json`: „Spýtaj sa recepcie“.
  - Preklady: en „Ask the front desk“, uk „Запитай рецепцію“, hu „Kérdezd a recepciót“, sr „Pitaj recepciju“, pl „Zapytaj recepcję“, de „Frag den Empfang“, cs „Zeptej se recepce“.
  - Počet kľúčov 262 → 263, ostatné kľúče overené ako nezmenené.
- **Test** – `source/tools/recepcia-test.mjs`:
  - Sada `:33`. Testy 1 porozumenie `:120`, 2 rýchlosť `:136`, 3 obsah `:155`, 4 jazyky `:183–232`, 5 váha a bez slova AI `:234`.
  - V commite 3 som opravil chybu: kontrola popisov akcií porovnávala kľúč (`tel`) namiesto slovenského textu („Zavolať“), takže nikdy nič neoverila.
  - V commite 3 pribudla kontrola nadpisu, Zavrieť, rýchlych volieb a kontaktov voči slovníku a 17 až 18 otázok na jazyk.

## Testy s výstupom

`node --test barbershop-30/source/tools/recepcia-test.mjs` (HEAD `be841ed`):
```
# otázok: 277 (z toho nevieme 78), správne 100.0 %, falošné na nevieme 0, fallback 0 (0.0 %), ponuka „Myslíš toto?“ 1
# čas: priemer 0.235 ms, najpomalšia 1.167 ms
# položiek 30, tém nevieme 20, zdrojov 52
# en/de: otázok 18, správne 18; uk/hu/sr/pl/cs: otázok 17, správne 17; v každom jazyku 44 viet so slovníkovým prekladom
# gzip: recepcia.js 3579 B, recepcia.css 1047 B, sk.json 5567 B, spolu 10193 B
# gzip: en 9974 B, uk 11139 B, hu 10343 B, sr 10021 B, pl 10431 B, de 10111 B, cs 10269 B (spolu s modulom)
# tests 11 / pass 11 / fail 0
```
Sada sk má 277 otázok vrátane preklepov, tvarov bez diakritiky, hovorových tvarov, 78 otázok na témy „nevieme“
a 5 otázok mimo témy. „Dá sa platiť kartou?“ aj „platba kartou“ vedú na `platba`, nie na vernostnú kartičku.

Doplnkové skúšky mimo stromu (`$SP/barber/lahky-telefon/v2/stavba-v5/`):
- `node skuska-jazyky.mjs <strom>` – 112 úskalí v 7 jazykoch (karta vs. kartička, bez objednania, meškanie, ženy, alergia, neznáma služba, sviatky): `spolu 112, nesprávne 0, falošné odpovede na nevieme 0`. Prvý beh našiel 4 chyby, z toho 2 falošné zhody (de „Heiligabend geöffnet“ → hodiny, cs „stříháte holky“ → cena strihu). Opravil som ich kmeňmi ešte pred commitom 3.
- `node dom-skuska.mjs <strom> [en|uk-UA]` – UI panelu na falošnom DOM v Node, 20× OK:
  - dialóg s `data-no-i18n`, `aria-labelledby`, `aria-expanded` a `aria-controls`;
  - poradie volieb a fokus na prvú voľbu;
  - Rezervovať aj Zavolať sú odkazy;
  - „Dá sa platiť kartou?“ → „Na webe zatiaľ nemáme potvrdené: spôsob platby. Spýtaj sa recepcie: 0951 267 203 alebo info@barbershop30.sk.“;
  - `<img onerror>` z otázky ostane len text;
  - fallback s tromi cestami, `mailto` bez tela správy;
  - „Celý cenník“ zatvorí panel a vráti fokus;
  - požiadavky len na `recepcia/<jazyk>.json`;
  - prepnutie na en a uk zmení nadpis, `lang` a voľby; en odpoveď s poznámkou „The booking page is in Slovak.“
- `eslint --no-config-lookup --rule '{"no-undef":"error","no-unused-vars":"error"}' assets/recepcia.js` – bez nálezu.
- `node --check assets/app.js` – syntax v poriadku.

## Čísla (gzip úroveň 6, merané cez stdin; `gzip -c súbor` pridáva do hlavičky meno súboru)

| čo | hodnota | limit |
|---|---|---|
| index.html | 16 537 → 16 537 B, `cmp` s f624ee8: bajtovo zhodný | 0 B |
| app.js + style.css prírastok | 297 + 179 = **476 B** | ≤ 500 B |
| recepcia.js + recepcia.css + sk.json | **10 193 B** (Node zlib) / 10 178 B (gzip) | ≤ 10 240 B (10 KiB) |
| to isté s iným jazykom | najviac uk 11 139 B, ostatné 9 974–10 431 B | ≤ 12 288 B |
| zhoda na otázku | priemer 0,24 ms, najpomalšia 1,17 ms (Node) | < 5 ms |

Rezerva pri sk je len 47 B. Ak sa „10 kB“ myslí desiatkovo (10 000 B), sk je o 193 B nad. Ďalšia položka v sk.json
alebo panel bude potrebovať úsporu, napríklad hustejší zápis CSS (−35 B) a skrátenie zdrojov na rozsahy riadkov.

## ODLOŽENÉ (nie prejdené)

Prehliadač bol celý čas obsadený iným tímom: `pgrep -c -f "headless_shell|chrome-linux/chrome"` = 2 pri každej
kontrole (naposledy 08:32 UTC). Na porte 8600–8699 server nebežal (`pgrep -f "http.server 86[01]"` nič nenašiel).
Podľa pravidla som prehliadač nespustil. ODLOŽENÉ sú:
- `NODE_PATH=/opt/node22/lib/node_modules node source/tools/i18n-test.mjs` (Playwright).
  - Statický rozbor: test kontroluje textové uzly (`i18n-test.mjs:47–58`) a Booqme odkazy na stránke. Tlačidlo má len SVG bez textu a panel sa v teste neotvára.
  - Nič teda nenasvedčuje zlyhaniu, ale beh chýba.
- `node source/tools/app-smoke.mjs` (Playwright): pretekanie 375–430 px, CLS, menu a `prefers-reduced-motion` s tlačidlom.
- `vaha.mjs` (Playwright). Bajty HTML sú overené `cmp`.
- Vizuálna kontrola tlačidla a panelu v 390 × 844 a 1440 × 900:
  - kolízie so zhlukom vpravo, `.lang-offer` a `.film-place`;
  - posun šírky stránky pri `showModal()` na počítači (`scrollbar-gutter` v style.css nie je).
- Server pre tieto behy pôjde na pridelený port: `B30_PORT=8700` (`source/shot.mjs:102`), title overiť cez curl.
- Na iPhone (kritérium 8.4–8.5, len majiteľ): klávesnica a list v top layer, VoiceOver, návrat polohy skrolu.

## Čo ostalo (vedome mimo tohto kola)

- Živý stav tabule „Teraz otvorené“ v odpovedi Hodiny som vyhodil kvôli váhe (+80 B). Tabuľa sa navyše vypĺňa až pri priblížení. Odpoveď dáva týždenné hodiny zo stránky, čo je pravda.
- Ťah nadol na zatvorenie listu a vysúvací nápis „Spýtaj sa“ na počítači (návrh 3.2 a 3.3) nie sú. Zatvára sa krížikom, klávesom Esc a ťuknutím na pozadie.
- Panel zatiaľ nepočíta s `?film=on` (posun `.film-place` o 56 px, návrh 3.2).
- Rozhodnutia majiteľa podľa plánu (G, R1, R2, R7):
  - názov a miesto tlačidla;
  - odpovede na témy „nevieme“ (OTAZKY č. 1–8, 11–18, trvania, dámske strihy);
  - kto preberá otázky na `info@`.
- Úvodná veta je podľa zadania vykaná („vám“), ostatné texty panelu tykajú ako stránka. Preklady volia oslovenie podľa stránky.
- Commit 1 v hlavičke uvádza „20 tém“. Je to o jednu viac, než chce zadanie (zdravie/alergie z FAKTY), čo je v poriadku.

## Pomocné súbory (mimo stromu, v tomto priečinku)

- `jazyky-gen.py` + `jazyky_data.py`: zostavenie 7 jazykov zo sk.json a slovníkov stránky. Kmene normalizuje rovnako ako modul.
- `skuska-jazyky.mjs`, `dom-skuska.mjs`: doplnkové skúšky uvedené vyššie.
