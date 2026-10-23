# V5 etapa 1 – Recepcia: kontrola kódu, kolo 1 (23. 10. 2026)

Kontrolór: nezávislý, v strome nič nemenil. Strom `$SP/hs-recepcia`, vetva `barbershop-recepcia`, HEAD `be841ed`
(3 commity nad `f624ee8`). `$SP` = `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad`.
Cesty nižšie sú relatívne k `barbershop-30/`.

**Verdikt: zatiaľ NEPRIJAŤ.** Bezpečnosť, váha, index.html a i18n sú v poriadku. Treba však opraviť 5 stredných
nálezov. Najdôležitejší je S1: krátke kmene dávajú na nesúvisiace otázky odpoveď s cenou inej služby.
Kontrola v prehliadači je ODLOŽENÁ, pozri koniec.

## Čo prešlo (s dôkazom)

| čo | dôkaz |
|---|---|
| index.html bez zmeny | `git diff --quiet f624ee8..HEAD -- index.html` → „index.html bez zmeny“, gzip 16 537 B |
| prírastok prvého okna ≤ 500 B | `gzip -6 < súbor \| wc -c`: app.js 20 532 → 20 829 (+297), style.css 20 874 → 21 053 (+179), spolu **476 B** |
| panel sk ≤ 10 240 B | recepcia.js 3 555 + recepcia.css 1 050 + sk.json 5 573 = **10 178 B** (rezerva 62 B; ak sa „10 kB“ myslí ako 10 000 B, je to o 178 B viac) |
| iný jazyk ≤ 12 288 B | modul a CSS 4 605 B + jazyk: en 10 003, uk **11 086**, hu 10 353, sr 10 017, pl 10 433, de 10 111, cs 10 236 B |
| testy | `node --test source/tools/recepcia-test.mjs` → `tests 11, pass 11, fail 0` (1,65 s) |
| doplnkové skúšky | `skuska-jazyky.mjs …/barbershop-30` → `spolu 112, nesprávne 0, falošné odpovede na nevieme 0`; `dom-skuska.mjs` sk: 20× OK, en aj uk-UA: nadpis, `lang` a voľby sa prepnú |
| XSS | `innerHTML` je len so stálymi reťazcami: app.js:624 (SVG) a recepcia.js:117–119, 122 (kostra). Otázka aj text z JSON idú cez `textContent` (`el`, recepcia.js:67). Vložená otázka `<img src=x onerror=…>` → fallback, ostane len text (dom-skuska) |
| žiadny eval, úložisko ani cudzia sieť | grep pridaných riadkov na `eval\|new Function\|localStorage\|sessionStorage\|cookie\|indexedDB\|XMLHttp\|sendBeacon\|WebSocket` = 0. Sieť je len `import('./recepcia.js')` (app.js:625) a `fetch` súboru `recepcia/<jazyk>.json` s whitelistom jazykov (recepcia.js:68). Externé odkazy majú `rel="noopener"` (:72). Vstup je obmedzený `maxlength=200` a `slice(0,200)` |
| CSP | bez inline `style=` a bez `eval`. Štýly idú cez `<link>` z rovnakého pôvodu (recepcia.js:121) |
| výkon | nový kód nemá poslucháča `scroll` a nemá `will-change` (grep = 0). Tlačidlo je `position: fixed` a animuje len `opacity` (style.css:1236–1237). Vzniká vo `vPokoji` po `load` + 1,5 s (app.js:629). Modul aj CSS sa načítajú až po ťuknutí |
| prístupnosť (kód) | natívny `<dialog>` cez `showModal()`; `aria-labelledby="rc-h"`; tlačidlo má `aria-haspopup="dialog"`, `aria-expanded`, `aria-controls`. Esc je natívny. Fokus sa po otvorení presunie na prvú voľbu a po zatvorení vráti s `preventScroll` (recepcia.js:127, 140). Vstup má `<label class="visually-hidden">`, záznam je `role="log" aria-live="polite"`. Ciele majú 44/46/56 px. Vstup má 16 px, iOS teda nepriblíži. Panel rešpektuje reduced motion aj `data-motion=off` (recepcia.css:24–25) |
| kontrast (WCAG, výpočet) | text `--paper` na `--ink-3` 13,87:1; `--ink` na `--lamp` (Odoslať) 5,42:1; ikona `--paper` na tlačidle aj nad bielou fotkou ≥ 8,33:1; `.rc-sukromie` 5,04:1 |
| i18n | v každom zo 7 slovníkov pribudol jeden kľúč „Spýtaj sa recepcie“ (262 → 263, odobraté 0, zmenené 0). Texty panelu sú úplné v 8 jazykoch, so slovenčinou sa zhodujú len „Instagram“ a e-mailová adresa. Dialóg má `data-no-i18n`. Jazyk sa berie z `html.lang`, ktorý `i18n.js:162` nastaví pred udalosťou `langchange` (:173) |
| bez zmienky o AI | grep `\bai\b\|umel\w* intelig\|chatbot\|gpt\|llm\|claude\|anthropic` nenašiel nič v nasadzovaných súboroch. Rovnaký grep na správy commitov = 0. Grep `KI\|ШІ\|sztuczn\|mesters\|veštač\|uměl\|künstlich` = 0. „Chat“ je len kmeň témy WhatsApp (sk.json:73) |
| lint | `eslint --no-config-lookup` s pravidlami no-undef, no-unused-vars, no-eval a no-implied-eval: recepcia.js 0 nálezov. Test má len `console`, pretože chýba prostredie node. `node --check assets/app.js` OK |
| nasadenie | `nasad-barbershop30.sh:21` kopíruje celé `assets/`, takže nové súbory pôjdu s ním |

## Nálezy

### STREDNÉ

**S1 – Krátke kmene (≤ 3 znaky) dávajú odpoveď aj na nesúvisiace otázky, niekedy s cenou inej služby.**
- Príčina: `zhoda` v recepcia.js:20 (`w.startsWith(k)` → 1) a :23 (DL na predpone slova; pri 3-znakovom kmeni stačí,
  aby sa zhodovali prvé dva znaky).
- Kmene ≤ 3 znaky bez `=` v sk.json: `kde, noc, fuz, dlh, det, syn, rok, usi, usn, sed, tim, kav, cak, pit, bez, dni`.
- Zmerané cez `odpovedz(q, sk.json)`:
  - `detailny strih` → **odpoveď `deti`** („Strih pre malých gentlemanov 15 €“, skóre 1,50);
  - `synteticke vlasy` → **odpoveď `deti`** (1,00);
  - `sedacka` → **odpoveď `farbenie-brady`** (0,67);
  - `Si robot?`, `rozmyslam`, `Rodicia`, `Ronaldo` → `nevieme sviatky` („Na webe zatiaľ nemáme potvrdené: hodiny vo sviatky.“);
  - `rovno` → `bez-objednania`;
  - `romantika` → `romana-ceny`.
- Tvrdenia sú zo stránky, takže nie sú vymyslené, ale odpovedajú na inú otázku. Pri cene je to pre návštevníka zavádzajúce.
- Návrh:
  - kmene kratšie ako 4 znaky porovnávať len ako celé slovo (správať sa k nim ako k `=`) alebo ich nahradiť zoznamom tvarov (`syn syna synovi`, `rok roky rokov`);
  - pravidlo DL na predpone (:23) zapnúť až od `k.length ≥ 5`;
  - otázky vyššie pridať do sady testu 1 ako fallback alebo správne id.

**S2 – Skrolovanie kolieskom v otvorenom paneli môže na počítači s filmom spustiť odchod na ulicu** (PLAUSIBLE, kód je jasný, prehliadač ODLOŽENÝ).
- `film.js:1398`: `locked()` pozná len `body.style.overflow` a `menu-open`, otvorený `<dialog>` nepozná.
- `film.js:1400–1402`: pri `deltaY < -8` na vrchu stránky volá `leave()`.
- `film.js:1407–1410`: to isté robí ťah nadol na dotykovom zariadení s filmom.
- Udalosti `wheel` a `touchmove` z modálneho dialógu stúpajú až po `window`.
- app.js:520 to pre svoj plynulý skrol rieši (`document.querySelector('dialog[open]')`), film.js nie.
- Návrh: v recepcia.js `postav()` pridať
  `['wheel','touchmove'].forEach((t) => dlg.addEventListener(t, (e) => e.stopPropagation(), { passive: true }))`.
  Poslucháči film.js sú vo fáze bublania (`film.js:1344`, bez `capture`). Druhá možnosť je jedna podmienka
  `|| d.querySelector('dialog[open]')` v `locked()`, ak to vlastník film.js dovolí.

**S3 – Na počítači pásy filmu prekryjú tlačidlo, ktoré sa dá stále stlačiť.**
- `.film-bars` má `z-index: 38` a pás `height: 8vh` (style.css:593–594). V `html.pro` a `html.outside` je pás vysunutý (:597).
- `.recepcia-btn` má `z-index: 36`, `bottom: 24px` a výšku 56 px (:1236).
- Pri 1440 × 900 je pás vysoký 72 px, takže zakryje 48 z 56 px tlačidla. Pásy majú `pointer-events: none`, preto sa neviditeľné tlačidlo dá stlačiť.
- `html.outside` trvá, kým návštevník stojí na ulici. Tlačidlo sa pritom ukáže už 1,5 s po `load`.
- Zhluk na telefóne to rieši pravidlom style.css:627 (`z-index: 39`).
- Návrh 3.2 počítal s polohou „pod pásmi“ len pre lite telefón, kde pásy nie sú (`world-off` → `display: none`, :601).
- Návrh: `html.pro .recepcia-btn, html.outside .recepcia-btn { z-index: 39 }` alebo tlačidlo v týchto stavoch skryť
  (`visibility: hidden`). Treba sa rozhodnúť a overiť snímkou.

**S4 – Drobný text v odpovedi nemá kontrast AA.**
- `.rc-zdroj` („zo stránky“) a `.rc-pozn` („The booking page is in Slovak.“) majú `--paper-3` #8e8578 pri 0,8rem = 12,8 px (recepcia.css:18).
- Pozadie `.rc-a` je 6 % `--paper` na `--ink-2` (:16), čo dáva **4,41:1 < 4,5:1**.
- Návrh: pre `.rc-zdroj` a `.rc-pozn` použiť `--paper-2` (#c9beae) alebo zrušiť tónovanie `.rc-a`.

**S5 – Panel sa môže pri prvom ťuknutí ukázať bez štýlu.**
- `postav()` vloží `<link rel=stylesheet>` (recepcia.js:121) a `spusti` potom čaká len na JSON (:135).
- `showModal()` (:138) sa teda môže zavolať skôr, než sa načíta `recepcia.css`.
- Vtedy sa dialóg krátko ukáže s predvoleným štýlom prehliadača (biely, v strede) a potom preskočí na spodný list.
- Hrozí to hlavne na pomalej sieti alebo pri inej politike cache pre .css a .json.
- Návrh: `const css = new Promise((ok) => { link.onload = link.onerror = ok; })` a v `spusti`
  `await Promise.all([css, prepni(jazyk())])`. Stojí to asi 40 B gzip.

### DROBNÉ

- **D1** Tlačidlo ignoruje `html[data-motion="off"]`, nástup 300 ms beží aj vtedy (style.css:1236–1237, 1242). Návrh 3.2
  chce obe podmienky, panel ich má (recepcia.css:25). Návrh: doplniť `html[data-motion="off"] .recepcia-btn { animation: none; }`.
- **D2** Nad 1 024 px je panel `right: 24px` (recepcia.css:23), ale tlačidlo `right: var(--gutter)` = 40 px
  (style.css:38, 55). Karta je o 16 px vpravo od tlačidla. Návrh: `right: var(--gutter)` aj pre panel.
- **D3** Tiché zlyhanie:
  - `import(...).catch(() => {})` (app.js:625);
  - `nacitaj` vráti `null` a `spusti` skončí bez hlásenia (recepcia.js:68, 136).
  - Offline ťuknutie tak neurobí nič. Návrh: pri zlyhaní aspoň `location.hash = 'kontakt'` alebo otvoriť `tel:`.
- **D4** Test:
  - Časová bomba: `overene` nesmie byť staršie ako 90 dní (recepcia-test.mjs:159, 163). Všetkých 30 položiek má 2026-10-21, takže **od 2027-01-20 test zlyhá** bez zmeny kódu.
  - `gz()` vráti 0 pre chýbajúci súbor (:235). `JAZYKY` (:31) aj `subory` (:240) filtrujú cez `existsSync`, takže zmazaný modul alebo jazyk test prejde.
  - Návrh: pevný zoznam jazykov podľa regexu v recepcia.js:68 a `assert` na existenciu; vek overenia vypisovať ako varovanie.
- **D5** Mŕtvy kód v teste: `norm(o).replace(/ /g, ' ')` (recepcia-test.mjs:176) nahrádza medzeru medzerou. Riadok slúži len na výpis.
- **D6** Slovo „AI“ je v komentári a v názve testu (recepcia-test.mjs:17, 234 a hlásenie :241). Zadanie chce
  „bez zmienky o AI v kóde a komentároch“. Strážca je užitočný a nie je v `assets/`, teda sa nenasadzuje. Návrh: názov
  „bez zakázaných označení“ a vzor zapísaný bez súvislého slova (napr. `/\bA[I]\b/`).
- **D7** Po „Celý cenník“ alebo „Pozrieť tím“ (kotva `#…`, recepcia.js:72) `onclose` vráti fokus na tlačidlo recepcie dole
  (:127), nie na cieľovú sekciu. Klávesnica a čítačka tak ostanú mimo obsahu, na ktorý sa skočilo. Návrh: pri kotve
  presunúť fokus na cieľ (`tabindex=-1`, `preventScroll`).
- **D8** Prvá voľba po otvorení dostane fokus, no jej obrys (`outline-offset: 3px`, style.css:96–98) môže `.rc-chips`
  orezať zľava: kontajner má `overflow-x: auto` a vodorovné odsadenie 0 (recepcia.css:10). Overiť snímkou. Návrh: `padding-inline: 6px`.
- **D9** Čitateľnosť:
  - husté jednoriadkové výrazy bez komentára k bodovaniu (recepcia.js:9, 28, 41, 97);
  - Diceov vzorec `2n / (A + B + n)` (:16) je správny len preto, že `splice` skracuje B. Patrí k nemu komentár.
- **D10** README neuvádza `recepcia-test.mjs` ani nové súbory v zozname testov a štruktúry (README.md:72–73).

Obsahové nálezy sú v `kontrola-obsah-1.md` a tu sa neopakujú: S „voľné miesta“ (sk.json:80) a D2 „vernostná kartička“ proti
index.html:879. Kód ich potvrdzuje: `Mate volny termin dnes?` → `nevieme skolenia`; `Mate studentsku zlavu?` → `nevieme vernost`.

## ODLOŽENÉ (nie prejdené)

O 10:44 UTC `pgrep -c -f "headless_shell|chrome-linux/chrome"` = **2** (prehliadač iného tímu) a `pgrep -f "http.server 86[01]"`
nič nenašiel. Podľa pravidla som prehliadač nespustil. Odložené sú:
- `i18n-test.mjs`, `app-smoke.mjs`, `vaha.mjs` a `karty-shot.mjs` (Playwright, port 8710–8714, title overiť cez curl).
- Snímky 390 × 844 a 1440 × 900:
  - tlačidlo voči zhluku vpravo, najmä „Book an appointment“ pri šírke 320–360 px;
  - `.lang-offer` a pásy filmu (S3);
  - otvorený panel bez posunu šírky stránky (`scrollbar-gutter` chýba);
  - fokus prvej voľby (D8);
  - S5 pri spomalenej sieti;
  - S2 koliesko nahor v paneli na vrchu stránky s filmom.
- iPhone (len majiteľ, kritérium 8.4–8.5): klávesnica a list v top layer, VoiceOver, návrat polohy skrolu.

## Poradie opráv pred kolom 2

1. S1 krátke kmene + nové otázky do testu.
2. S3 a S2 (pásy a koliesko pri filme).
3. S4 kontrast a S5 čakanie na CSS (pozor na rezervu 62 B v sk; S4 je zadarmo, S5 stojí asi 40 B).
4. D1–D4, potom zvyšok.
5. Po uvoľnení prehliadača spustiť ODLOŽENÉ behy.
