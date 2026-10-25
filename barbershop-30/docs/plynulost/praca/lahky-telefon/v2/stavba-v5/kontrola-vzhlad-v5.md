# V5 etapa 1 – Recepcia: kontrola vzhľadu v prehliadači (25. 10. 2026, 08:00–08:45 UTC)

Kontrolu robil nezávislý kontrolór vzhľadu. V strome nič nemenil.

- Strom PO: `$SP/hs-recepcia`, vetva `barbershop-recepcia`, HEAD `6f8c47c`. `git status --short` je pred kontrolou aj po nej prázdny.
- Strom PRED: `git worktree add --detach $SP/hs-recepcia-pred f624ee8`. Po kontrole som ho odstránil (`git worktree remove`) a vo `worktree list` už nie je.
- `$SP` = `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad`, `$S5` = `$SP/barber/lahky-telefon/v2/stavba-v5`.
- Prehliadač: Playwright z `/opt/node22/lib/node_modules/`, Chromium 1194 (headless_shell) z `/opt/pw-browsers`, voľby swiftshader ako `PRESETS[0]` v `source/shot.mjs`. Vždy bežal len jeden môj prehliadač naraz a žiadny beh nebol dlhší ako 5 min.
- Servery: `python3 -m http.server` na 127.0.0.1:8721 (PO) a 8722 (PRED). Pred každým behom som curlom overil `<title>Barbershop 30 Nitra | Pánske strihy…</title>`. Po behu som server ukončil (`kill`). Nástroje stromu bežali s `B30_PORT=8720`.
- **Súbežne bežal prehliadač iného tímu**: `pgrep -c -f "headless_shell|chrome-linux/chrome"` = 2 až 8, load average 0,7–6,4. Všetky časy a váhy sú preto **orientačné**.
- Skripty a surové výstupy sú v `$S5/vzhlad/`: `vzhlad.mjs`, `film.mjs`, `rovnako.mjs`, `chips.mjs`, `cls.mjs`, `vyska.mjs`, `harky.py` a `*.json`/`*.txt`.
- Snímky sú v `$S5/snimky-v5/` (42 súborov). Hárky sú `pred-po-telefon.jpg` (636 150 B) a `pred-po-pocitac.jpg` (498 360 B). Oba hárky aj kľúčové výrezy som otvoril a prezrel.

**Verdikt: vzhľad v pokoji PREŠIEL, interakcia NEPREŠLA.**
- Mimo nového tlačidla je stránka na telefóne aj na počítači pixelovo zhodná s `f624ee8`. Recepcia nespôsobuje posun rozloženia (CLS) ani zmenu šírky stránky.
- V prehliadači som potvrdil body S2, S3, S7, D1, D2 a D8 z `kontrola-kod-3.md`. Pribudol nový stredný nález V1: rad volieb sa pri ďalšom otvorení nevráti na začiatok a fokus skončí mimo obrazovky.
- Kritérium 8.4 („zatvorenie vráti presne tú istú polohu skrolu“) v prehliadači **neplatí**. Pozri S7.

## Čo prešlo (zmerané)

| čo | výsledok | dôkaz |
|---|---|---|
| pokoj nezmenený, telefón 390×844 @3 | rozdiel PRED/PO len v obdĺžniku (48, 2346)–(186, 2484) px, čo je tlačidlo. Mimo rámu tlačidla + 40 px je rozdiel **0 px** | PIL `ImageChops.difference` > 24, `pred/po-telefon-pokoj.png` |
| pokoj nezmenený, počítač 1440×900 | rozdiel len v (1344, 821)–(1400, 876), mimo neho **0 px** | `pred/po-pocitac-pokoj.png` |
| stred stránky (#sluzby) pri rovnakom časovaní (9 s + 5 s) | telefón aj počítač: mimo tlačidla 0 px | `rovnako.mjs`, `*-r-stred.png` |
| koniec stránky na počítači | rozdiel vo výsledku je chyba merania, nie recepcie: `scrollY` na konci kolíše 15 217 / 15 219 / 15 224 v PRED aj PO, `scrollHeight` je v oboch 16 124 a výšky sekcií sú zhodné | `vyska.mjs` (2 behy × 2 stromy) |
| tlačidlo, telefón | 46×46 px, vľavo 16 px, zdola 16 px, z-index 36. Spodná lišta (Zavolať x 146, Rezervovať x 200) je v rovnakej výške, medzera **84 px** | `po-telefon.json` `btnAttr`, `tlacidlo.spodne` |
| tlačidlo, počítač | 56×56 px, sprava 40 px, zdola 24 px | `po-pocitac.json` `btnAttr` |
| objavenie | 1 863–1 900 ms po `load` (orientačne). Moduly recepcie sa pred ťuknutím nesťahujú | `tlacidloPoLoadMs`; `vaha.mjs` 0 výskytov „recepcia“ v 6 výpisoch |
| CLS | pokoj: telefón 0, počítač 0,0001 (zdroj `nav`, t = 171 ms). Rovnaký posun 0,0001 má aj PRED (t = 380 ms). Posun 0,0099 (`::before`) vzniká pri programovom skrole na #sluzby **v PRED aj PO**, s ťuknutím aj bez neho. Otvorenie a zatvorenie panela nepridá žiadny posun | `cls.mjs`: PRED `{"t":6070,"v":0.0099}`, PO `{"t":6051,"v":0.0099}` |
| `.lang-offer` (prehliadač en-US) | telefón: prúžok (80, 646, 230×114) je **22 px** nad tlačidlom (y 782), bez prekrytia. Počítač: prúžok x 538–902, tlačidlo x 1344 | `ponukaJazyka.spodne` `kolizia:false`, `po-telefon-ponuka-jazyka-uvod.png` |
| `.film-place` | pri 40 / 37 polohách skrolu sa ani raz nezobrazil (`display: none !important`, style.css:1183) | `spodneVidene` |
| menu otvorené (telefón) | tlačidlo má `visibility: hidden` (style.css:1240) | `jazyky.menuOtvorene_*.btnVis = "hidden"` |
| showModal: posun šírky | telefón: iw = cw = sw = 390 pred otvorením aj po ňom, x loga 16 → 16. Počítač: 1440 = 1440 = 1440, x loga 40 → 40. `scrollY` sa otvorením nezmení | `showModal.pred/po` |
| štýl panela | `position: fixed`, `data-no-i18n`, `lang` sk. Telefón: spodný panel 390×301. Počítač: 360×359 nad tlačidlom (spodok 808, tlačidlo od 820) | `showModal.po.panel` |
| fokus | ťuknutím na `rc-chip Rezervovať` (bez `:focus-visible`). Klávesom Enter na tlačidle fokus ide na prvú voľbu, `:focus-visible` = true. 14× Tab ostane 14× v paneli | `fokus.prvy`, `fokus.tab` |
| Esc | panel sa zatvorí, fokus sa vráti na `recepcia-btn` (`:focus-visible` po klávesnici), `aria-expanded` = false | `esc`, `fokus.poEsc` |
| jazyk sk → en → uk → sk (prepínač v menu telefónu a v lište počítača) | `aria-label`: „Spýtaj sa recepcie“ → „Ask the front desk“ → „Запитай рецепцію“ → „Spýtaj sa recepcie“. Nadpis „Recepcia“ → „Front desk“ → „Рецепція“, voľby, „Zavrieť“/„Close“/„Закрити“, placeholder a riadok o súkromí sú v jazyku. en „how much is a haircut“ → „Men's haircut 18 €“. uk „скільки коштує стрижка“ → „Чоловіча стрижка 18 €“. Šírka 390 = 390 aj 1440 = 1440 | `jazyky.*`, `po-*-jazyk-en/uk.png` |
| odpovede | „koľko stojí strih“ → „Pánsky strih 18 €“, „zo stránky“, odkazy Rezervovať termín → `https://www.barbershop30.sk/rezervacia`, Celý cenník → `#sluzby`. „strihate aj damy“ → „Dámske strihy na webe neuvádzame. Spýtaj sa recepcie: 0951 267 203 alebo info@barbershop30.sk.“ + `tel:+421951267203`, `mailto:` | `odpovede` (telefón aj počítač zhodne) |
| obmedzený pohyb | `prefers-reduced-motion: reduce`: tlačidlo aj panel majú `animation-name: none` | `pohyb.btnAnim/panelAnim` |
| konzola a sieť | 0 chýb na oboch zariadeniach. Po ťuknutí sa stiahnu len `recepcia.js`, `recepcia.css` a `recepcia/{sk,en,uk}.json` | `chyby: []`, `ziadosti` |
| `i18n-test.mjs` | **64 OK, „Všetky kontroly prešli“**, exit 0, 38 s | `vzhlad/i18n-test-po.txt` |
| `app-smoke.mjs` | PO: 156 OK, 1 FAIL, po 300 s ukončený časovým limitom (pri bode 8, šírka 430 px). PRED pri rovnakom limite: 154 OK, 2 FAIL. **Rovnaký FAIL `[lite 430] späť: … fotka` má aj PRED**, takže ho recepcia nespôsobila. Druhý FAIL v PRED je `ERR_INSUFFICIENT_RESOURCES` pri súbežnom prehliadači. Bod 8 (430 px) a ďalšie ostali nespustené v oboch stromoch | `vzhlad/app-smoke-po.txt`, `app-smoke-pred.txt` |
| `vaha.mjs` | celkom s prológom: počítač 2 330 vs 2 328 KB, telefón 2 408 vs 2 406 KB (**+2 KB**, app.js a style.css). Stĺpec „do load“ kolíše v PRED aj PO o stovky KB (napr. telefón bez filmu PO 86/681/245, PRED 310/164/738 KB), preto ho neporovnávam | `vzhlad/vaha-*.txt` (3 behy × 2 stromy) |

## Nálezy

### STREDNÉ

- **S7 potvrdené – pri otvorenom paneli sa posúva stránka a kritérium 8.4 neplatí.**
  - Telefón: skúšal som dotykovým ťahom cez CDP (`Input.dispatchTouchEvent`). Ťah nadol v logu, keď je log už na začiatku, posunul stránku zo **5 304 na 4 242 px**. Ťah cez pozadie nad panelom ju posunul na 4 314 px.
  - Po Esc ostala stránka na 4 314 px, hoci pred otvorením bola na 5 304 px (`esc.syPredOtvorenim` 5304, `esc.sy` 4314). V predchádzajúcom behu to bolo 5 304 → 4 579 px.
  - Počítač: koliesko nad pozadím posunulo stránku **6 466 → 6 966 px**. Koliesko nad logom bez pretečenia (panel len s úvodom, `film.mjs`) posunulo stránku 0 → 300 px.
  - `overscroll-behavior` je na `#rc-panel` aj `.rc-log` `auto` (recepcia.css:1, 12).
  - Návrh: `overscroll-behavior: contain` na `#rc-panel` a `.rc-log`. Pre ťah a koliesko cez pozadie (backdrop) to nestačí, preto počas `open` zamknúť skrol stránky, napr. `html:has(#rc-panel[open]) { overflow: hidden }`, alebo zapamätať `scrollY` a pri `close` ho vrátiť. Potom znova zmerať týmto skriptom.
- **S2 potvrdené – film reaguje na kláves a koliesko pri otvorenom paneli** (počítač, `?film=on`, `film.mjs`).
  - Šípka: klik do textu bubliny presunul fokus na samotný `dialog#rc-panel`. Šípka hore potom zmenila triedu `html` z „world-in“ na **„world-in outside“**, teda film odišiel na ulicu, kým bol panel otvorený.
  - Koliesko nahor nad logom na vrchu stránky zmenilo triedu „world-in skrol“ na „world-in **pro**“.
  - Príčina: `locked()` (film.js:1398) nepozná `dialog[open]` a `typing()` (:1399) neráta s fokusom na samotnom dialógu.
  - Návrh ostáva z kola 3: `dialog[open]` doplniť do `locked()`.
- **S3 potvrdené – pás filmu zakrýva tlačidlo.**
  - Hneď po objavení tlačidla (úvod ako film, `html.pro`) aj na ulici je spodný pás (0, 828, 1440×72, z-index 38, style.css:593) nad tlačidlom (z-index 36). Prekrýva **48 z 56 px**.
  - Pod pásom vidno len horný oblúk tlačidla (`po-pocitac-film-uvod.png`, výrez na hárku vpravo dole). Kliknutie ho otvorí, lebo pás má `pointer-events: none`, takže sa stláča takmer neviditeľný prvok.
  - Mimo úvodu a ulice je pás odsunutý (`translateY(72px)`) a tlačidlo je celé.
  - Návrh: počas `html.pro`/`html.outside` tlačidlo skryť (`visibility: hidden`), alebo ho dať nad pás.
- **V1 (nové) – rad volieb sa pri ďalšom otvorení nevráti na začiatok a fokus je mimo obrazovky.**
  - Postup (`chips.mjs`): prvé otvorenie dá `scrollLeft` 0, x prvej voľby 16. Po 4× Tab na „Zavolať“ je `scrollLeft` 149. Po Esc a novom ťuknutí ostane `scrollLeft` **149** a fokus je na „Rezervovať“ pri **x = −133**, teda mimo obrazovky.
  - Vidno to aj na snímkach en/uk: prvá voľba „Book“/„Забронювати“ je useknutá (`po-telefon-jazyk-en.png`, `po-telefon-volby-znova.png`).
  - Príčina: `spusti` fokusuje s `preventScroll: true` (recepcia.js:172) a `texty()` vymení voľby bez vrátenia skrolu (:142).
  - Rovnako sa to stane po vodorovnom ťahu prstom v rade volieb.
  - Návrh: v `spusti` pred fokusom nastaviť `chips.scrollLeft = 0`.

### DROBNÉ

- **D8 potvrdené** – obrys fokusu prvej voľby je vľavo rovno orezaný (`po-telefon-fokus.png`, `po-pocitac-fokus.png`). Voľba aj rad začínajú na rovnakom x (16 / 1073), obrys siaha 5 px von a `.rc-chips` má `overflow-x: auto` (recepcia.css:9). Návrh: `padding-inline: 5px` a záporný `margin-inline` na `.rc-chips`, alebo `outline-offset: -2px` pre `.rc-chip`.
- **D1 potvrdené** – pri `?motion=off` má `html` `data-motion="off"`, tlačidlo však stále `animation-name: rc-btn` (style.css:1236–1242).
- **D2 potvrdené** – na počítači je panel x 1056–1416 (sprava 24 px), tlačidlo x 1344–1400 (sprava 40 px). Pravé hrany nesedia, panel presahuje tlačidlo o 16 px (`po-pocitac-panel.png`).
- **V2 (nové) – po zmene jazyka ostanú staré bubliny v pôvodnom jazyku.** V anglickom paneli je slovenská bublina „Na webe zatiaľ nemáme potvrdené: poukážky…“, v ukrajinskom anglické „from this page / BOOK AN APPOINTMENT“ (`po-telefon-jazyk-en.png`, `-uk.png`). Návrh: pri zmene jazyka log vyprázdniť na úvod v novom jazyku.
- **V3 (nové, rozhodnutie pre majiteľa) – prvé ťuknutie na recepciu pustí hudbu.** Na snímkach panela sa ikona Hudba v lište zmení z prečiarknutej na hrajúcu (hárky, stĺpce „otvorený panel“). Je to staré správanie stránky (atmosfera.js:12, 196–219: hudba sa pustí pri prvom kliknutí kdekoľvek), nie chyba recepcie. Pre niekoho, kto chce len položiť otázku, však môže byť nečakané. Ak to nemá platiť, treba v atmosfera.js vynechať `.recepcia-btn` a `#rc-panel` z „prvého kliknutia“.
- **V4 (nové) – tvar tlačidla na telefóne.** Kruh 46 px stojí v jednej línii so zaobleným štvorcom Zavolať 46 px (`--radius-btn`), takže spodný okraj má dva tvary (výrez na hárku telefónu). Ide o vzhľad, nie o funkciu.
- **V5 (nové) – tlačidlo pri skrolovaní prechodne zakrýva obsah vľavo dole.** Pri niektorých polohách (z 40) leží pod tlačidlom odkaz „Rezervuješ ich samostatne“ (y 3 915), tlačidlo galérie „Zväčšiť: Nožnice a hrebeň…“ (y 10 440–10 585) alebo „Späť hore ↑“ (y 15 481). Na konci stránky (y 15 559) už nič nezakrýva. Pevné tlačidlo to má prirodzene, spodná lišta vpravo robí to isté.

## Čo som neoveril

- iPhone/Safari a VoiceOver (krit. 8.4–8.5). Overiť to vie len majiteľ na zariadení.
- Lighthouse mobil (CLS 0 a LCP ± 50 ms). Pri súbežnom prehliadači by čísla neboli spoľahlivé.
- `app-smoke.mjs` od bodu 8 (430 px) ďalej: beh trvá viac ako 5 min, v oboch stromoch ho ukončil limit.
- S5 (pomalá sieť, panel bez štýlu) som nemeral.

## Prostredie (pre ďalšie kolo)

- `headless_shell` bez voľby swiftshader pri snímke otvoreného dialógu padol (`Target crashed`, dmesg `Compositor … trap int3`). Plný Chromium (`channel: 'chromium'`) padol už pri načítaní.
- So swiftshader (`PRESETS[0]`) snímky prešli. Pri DPR 3 po dlhom zostupe stránkou raz zlyhali s „Unable to capture screenshot“. Riešenie v `vzhlad.mjs`: zostup v samostatnom kontexte a snímka so 4 pokusmi. V konečnom behu `snimkyChyby: []`.
