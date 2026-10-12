---
name: web-dizajn
description: Web dizajn od opisu slovami po snímky z prehliadača: zadanie webu (brief, prompt), vkus z referencií bez kopírovania (taste, inspiration, Awwwards), dizajnový systém (design tokens, typography, type scale, spacing, grid, color palette), rozloženie a komponenty (layout, landing page, hero section, cards, navigation), pohyb (motion, prefers-reduced-motion), prístupnosť (WCAG, contrast, focus, touch targets) a kontrola v prehliadači (Playwright, screenshots, responsive, design audit). Figma MCP, keď je pripojená. Použi pri novom webe, redizajne a posudku návrhu.
---

# Web dizajn: od opisu slovami po snímky z prehliadača

Postup, ako navrhnúť a postaviť web, ktorý nevyzerá ako generický návrh: web sa najprv opíše slovami,
vkus sa vezme z referencií (princípy, nie obsah), vznikne z neho malý dizajnový systém, potom rozloženie,
komponenty a pohyb, a všetko sa overí v prehliadači v niekoľkých šírkach so snímkami. Čísla a príklady sú
z webov HEAD SPA 30 (koreň repozitára) a BARBERSHOP 30 (`barbershop-30/`), zmerané v prehliadači 2026-10-11.

**Pôvod.** Video sebintel na TikToku (35 s, pozreté 2026-10-11; zápis v
`../referencie-z-videi/references/naucene-z-videi.md`, časť 8) hovorí: daj Claudovi pár open-source skills na
typografiu, rozostupy, rozloženia a animácie, pridaj skill „taste“, aby sa inšpiroval skvelými webmi namiesto
obvyklého generického dizajnu, pripoj Figma MCP a Playwright, aby návrh, stavbu, test a snímky urobil v jednom
postupe, a web opíš obyčajnými slovami. Na snímkach sú repozitáre „claude-web-design-skills“ (24 skills, vlastník
nečitateľný) a „taste-skill“ (štítok MIT). **Repozitáre sme neotvárali, nič z nich tu nie je.** Zo zoznamu vo
videu sme prevzali len mená 24 oblastí a naplnili ich pravidlami zo štandardov (WCAG 2.2, tradičná typografia)
a z kódu našich webov.

**Poradie autorít:** pravidlá projektu (`CLAUDE.md`, `barbershop-30/docs/MASTER_BRIEF.md`,
`barbershop-30/docs/ART_DIRECTION.md`) > fakty zo zdrojov > zadanie od majiteľa > vkus z referencií > všeobecné
pravidlá z tohto skillu. Vkus nikdy neprebije pravidlo, ktoré dal majiteľ.

## Kedy použiť

- Nový web alebo samostatná stránka (landing page) od nuly, majiteľ ju opíše slovami.
- Redizajn, „nech to vyzerá prémiovo“, „pôsobí to lacno“, „vyzerá to ako každý iný web“.
- Posudok návrhu alebo prototypu: typografia, rozostupy, mriežka, kontrast, dotykové plochy, telefón.
- Majiteľ pošle odkazy alebo snímky webov, ktoré sa mu páčia.
- Návrh vo Figme sa má preniesť do kódu (Figma MCP, `references/figma-mcp.md`).

Nepoužívaj namiesto: `rychly-web` (Lighthouse, LCP, CLS, plynulý skrol), `film-z-fotiek` (pozadie z fotiek,
dvere v úvode), `obsah-a-texty` (texty, fakty, preklady), `testy-a-nasadenie` (dymový test, nasadenie),
`booqme-rezervacie` (ceny a tlačidlá do Booqme), `motion-grafika` a `kratke-video` (grafika a video na sociálne
siete). Tento skill na ne odkazuje v kroku, kde ich treba.

## Postup v siedmich krokoch

```
1 opíš web slovami         references/zadanie.md
2 vkus z referencií        references/vkus.md, design-dna
3 dizajnový systém         tokeny v :root; oblasti 1, 2, 4, 6, 14, 15
4 rozloženie a komponenty  oblasti 3, 7, 8, 11, 12, 16 až 21
5 pohyb                    oblasť 10; skills-animacie
6 kontrola v prehliadači   scripts/dizajn-audit.mjs, snímky pozrieť okom; oblasti 5, 9, 22, 24
7 oprava                   jedna vec, znova ten istý audit, späť na 6
```

Čísla oblastí sú z [references/oblasti.md](references/oblasti.md) (24 oblastí v poradí zo zoznamu vo videu,
pri každej čo stráži, pravidlá s číslami, ako to máme my a ktorý skill alebo nástroj to rieši). Oblasť 13
(Figma) patrí ku krokom 2 až 4, oblasť 23 (zdroje a dokumentácia) ku každému kroku.

### 1. Opíš web slovami

Vyplň šablónu [references/zadanie.md](references/zadanie.md): značka, publikum, **jedna úloha stránky**, tón,
paleta, písma, sekcie v poradí, výzvy, obmedzenia projektu a fakty len zo zdrojov. Vzor zadania vo videu
(„moderná prémiová landing page pre startup FlowAI, čistá biela téma, výrazná typografia, jemné modré prechody,
plynulé animácie, veľa bieleho priestoru, navigácia, hero s nadpisom a výzvou, karty funkcií, Ako to funguje,
referencie, cenník, FAQ…“) opisuje vzhľad, ale nehovorí, pre koho stránka je, čo má návštevník urobiť ani odkiaľ
sú fakty. To dopĺňa naša šablóna. Ak v zadaní chýba fakt (cena, hodiny, meno), **spýtaj sa alebo vynechaj**;
nedopĺňaj ho z pamäti ani z referencie. Vyplnené príklady pre oba weby sú v tom istom súbore.

### 2. Vkus z referencií

Podľa [references/vkus.md](references/vkus.md): prvou referenciou je vždy skutočná prevádzka (fotky priestoru,
logo, materiály), potom 3 až 5 cudzích webov z galérií inšpirácie. Každú rozober podľa `design-dna`
(`../../skills-animacie/design-dna/`: paleta, typografia, rozostupy, kompozícia, pohyb) a zapíš, **aký princíp**
si berieš. Farby z fotky nemeraj odhadom, ale skriptom `design-dna/scripts/measure-colors.mjs`. Obsah, texty,
logá ani obrázky z referencie sa nepreberajú nikdy. Pred stavbou prejdi zoznam znakov generického dizajnu
(vkus.md a `../../skills/frontend-design/SKILL.md`, časť Process).

### 3. Dizajnový systém

Malý a pevný, ako CSS premenné v jednom bloku `:root` na začiatku štýlu. Najprv plán podľa
`../../skills/frontend-design/SKILL.md` (farby 4 až 6 hodnôt, písma a ich úlohy, rozloženie, zásady), potom
kontrola plánu proti zadaniu a až potom kód. `../../skills/theme-factory/` len pre podnik bez vlastnej identity
alebo na rýchly prototyp; náš podnik má identitu z prevádzky.

Ako to vyzerá u nás (hodnoty zo štýlov 2026-10-11):

| Časť systému | HEAD SPA 30 (`assets/style.css`) | BARBERSHOP 30 (`barbershop-30/assets/style.css`) |
| --- | --- | --- |
| Písma | Lora (nadpisy, zlatá kurzíva ako jediný akcent), Manrope (text aj štítky) | Fraunces 800 (nadpisy), Manrope 400/600/700 |
| Pozadie | `--canvas #0d0a07`, `--panel #14100c` | `--ink #0e0d0c`, `--ink-2 #171412`, `--ink-3 #221d19` |
| Text v troch stupňoch | `#efe7da`, `#bfb3a2`, `#978b7b` | `#f1e9dd`, `#c9beae`, `#8e8578` |
| Akcent | `--accent #c9a66b`, zlatá len ako detail | `--lamp #e0601c`, jediný akcent |
| Rozostupy | medzi časťami `--lux-space: clamp(76px,9vw,128px)` | škála `--s1` až `--s10`: 4, 8, 12, 16, 24, 32, 48, 64, 96, 144 px |
| Rádius | 2 px (`--radius*`, tlačidlá); rituály v cenníku bez zaoblenia | 8 px karty, 6 px tlačidlá, 999 px štítky |
| Šírka obsahu | `.wrap`: `min(1180px, 100% - 48px)`, do 640 px `100% - 32px` | `--container 1360px`, okraj 40 / 24 / 16 px |
| Pohyb | `--t-fast 180ms`, `--t-base 320ms`, `--t-slow 700ms`, `--e-out cubic-bezier(.16,1,.3,1)` | `--t-micro 200ms`, `--t-text 560ms`, `--ease-out cubic-bezier(.2,.7,.2,1)` |

Kontrast over hneď pri tokenoch, nie až na konci (oblasť 9). Prepočet vzorcom WCAG 2.x z hodnôt vyššie:
HEAD SPA 30 text 16,1 / 9,6 / 5,9 : 1 na `--canvas`, tmavý text na zlatom tlačidle 8,2 : 1; BARBERSHOP 30 text
16,1 / 10,6 / 5,3 : 1 na `--ink`, `--ink` na `--lamp` 5,4 : 1.

### 4. Rozloženie a komponenty

1. **Drôtový model skôr ako farba** (oblasť 18): ASCII alebo sivé obdĺžniky, najprv telefón 390 px, potom
   počítač 1440 px. Sekcie v poradí zo zadania, jedna hlavná výzva.
2. **Úvod** (oblasť 19): jedna veta sľubu, jeden riadok pod ňou, jedno hlavné a jedno vedľajšie tlačidlo,
   skutočná fotka. U nás „Vypni hlavu.“ (HEAD SPA 30) a „Tvoj strih. Tvoje miesto.“ (BARBERSHOP 30).
3. **Komponenty s variantmi a stavmi** (oblasť 7): tlačidlo hlavné, vedľajšie a textové; každé so stavom
   pod ukazovateľom, pri stlačení a pri fokuse. Jedna definícia, žiadne ďalšie „opravy“ na konci súboru.
4. **Karty len pre samostatné jednotky** (oblasť 20). HEAD SPA 30 má cenník ako menu: rituály oddelené vlasovou
   linkou, top rituál kategórie v zlatom ráme; nie mriežka rovnakých zaoblených kariet s tieňom.
5. **Navigácia** (oblasť 21): lišta, mobilné menu, kotvy so správnym odsadením, vždy dostupná výzva na telefóne.

### 5. Pohyb

Pohyb len tam, kde niečo vysvetľuje (oblasť 10): odpoveď na akciu, zmena stavu, jeden premyslený moment.
Animuj len `transform` a `opacity`, rešpektuj `prefers-reduced-motion`. Pravidlá projektov sú prísnejšie než
všeobecné návody: HEAD SPA 30 bez žiar, čiastočiek, efektov pod kurzorom a poskakovania, obsah sa pri skrole
nevysúva; BARBERSHOP 30 nástupy textu 450 až 700 ms, paralaxa najviac 6 %, žiadne častice. Technika:
`../../skills-animacie/` (gsap, motion-design, genjutsu `motion-principles` a `css-native`), výkon pohybu
`rychly-web`, časť 5.

### 6. Kontrola v prehliadači

Nástroj [scripts/dizajn-audit.mjs](scripts/dizajn-audit.mjs) otvorí stránku v Chromiu cez Playwright, premeria
ju v zadaných šírkach a odfotí celú stránku. Súbor `.html` si servíruje sám (malý server nad jeho priečinkom),
adresu `http(s)://` otvorí priamo. Podrobnosti a obmedzenia nástroja: hlavička skriptu a `references/audit.md`.
Rozhranie:

```bash
# z koreňa repozitára; OUT je priečinok mimo repozitára (napr. scratchpad relácie)
node toolbox/skills-z-praxe/web-dizajn/scripts/dizajn-audit.mjs <url-alebo-cesta-k-html> <výstupný-priečinok> [--sirky=390,768,1440] [--bez-snimok]

node toolbox/skills-z-praxe/web-dizajn/scripts/dizajn-audit.mjs index.html "$OUT/hs"
node toolbox/skills-z-praxe/web-dizajn/scripts/dizajn-audit.mjs barbershop-30/index.html "$OUT/bs" --sirky=375,390,430,1440
node toolbox/skills-z-praxe/web-dizajn/scripts/dizajn-audit.mjs https://d8f5s88zjy-art.github.io/head-spa-30/ "$OUT/naziv" --bez-snimok
```

| Výstup | Čo v ňom je |
| --- | --- |
| `sprava.md` | čitateľný súhrn: nálezy po oblastiach so závažnosťou |
| `sprava.json` | to isté strojovo, na porovnanie pred a po oprave |
| `snimka-<šírka>.png` | celá stránka v danej šírke (nie pri `--bez-snimok`) |
| kód 1 | len pri závažných nálezoch (kontrast bežného textu pod 3 : 1, vodorovné pretečenie, žiadny alebo viac ako jeden viditeľný h1, obrázok bez `alt`, chyby konzoly a zlyhané požiadavky); bez nich 0, takže sa dá použiť ako brána pred nasadením; 2 je chyba nástroja |

Oblasti v správe a ich čísla v `references/oblasti.md`: typografia (1), rozostupy (2), farby a kontrast (6, 9),
dotykové plochy pod 44 × 44 px v šírkach pod 600 px (9), štruktúra: h1, poradie nadpisov, `alt`, prístupné mená,
jazyk (9), rozloženie: vodorovné pretečenie (4, 5), pohyb: druhý beh s `prefers-reduced-motion` (10), konzola
a požiadavky. Voľba `--cakaj=ms` (predvolene 1500) predĺži čakanie po načítaní, kým dobehne úvod stránky.

Overené 2026-10-11 pri 390 px: BARBERSHOP 30 za 31 s (0 závažných, 9 pozor: 14 zo 41 ovládacích prvkov pod
44 px, napr. telefón v kontakte 21 px, odkazy v pätičke 23 px; 16 veľkostí písma; text 11 px), HEAD SPA 30 za 71 s
(0 závažných, 8 pozor: 24 veľkostí písma, 30 prvkov pod 12 px, rozostupy mimo škály 4 px, 4 zo 117 dotykových
plôch pod 44 px, napr. „17 rituálov a ceny“ v úvode 33,5 px vysoké; znak U+2011 v „24‑karátovým“ kreslí
systémové písmo, lebo orezaná Manrope ho nemá). Snímky celej stránky z tohto behu sa od 8192 px opakovali
(pasca nižšie); nálezy z merania to neovplyvňuje.

Ako s tým pracovať:

1. **Najprv závažné nálezy**, potom ostatné podľa oblastí. Každý nález over na snímke alebo v kóde, kým ho
   opravíš; nástroj meria, vkus neposudzuje.
2. **Snímky pozri okom** (nástroj Read na PNG). Dlhú stránku rozdeľ na dlaždice (Pillow, `python3 -I`) a pozri
   úvod, stred a koniec v každej šírke. Pri stránke vyššej ako 8192 px najprv over, že sa snímka neopakuje
   (pasca so SwiftShaderom nižšie) a že nemá prázdne časti. Pýtaj sa: je jedna dominanta na obrazovku, dýcha
   to, je zrejmé, kam ťuknúť, nevyzerá to ako generický návrh (vkus.md)?
3. **Doplň ostatné kontroly**, ktoré audit nerobí: `../testy-a-nasadenie/scripts/dymovy-test.mjs` (chyby konzoly,
   CLS, beh bez skriptu, šírky 375 až 430), Lighthouse naživo (`rychly-web`), texty
   (`../obsah-a-texty/scripts/typografia-kontrola.mjs`, `i18n-kontrola.mjs`), pri HEAD SPA 30 ceny
   (`node tools/booqme-kontrola.mjs`).
4. **Pokojná verzia.** BARBERSHOP 30 ju dá adresou `?film=off&motion=off&uvod=off` (cez lokálny server, napr.
   `npx http-server -p 8080` z koreňa repozitára). HEAD SPA 30 takú adresu nemá; pokojnú verziu zapína
   `prefers-reduced-motion`, `saveData` a chýbajúce WebGL2 (brána v `index.html`).

Prostredie: Playwright je nainštalovaný globálne (`/opt/node22/lib/node_modules/playwright`), Chromium v
`/opt/pw-browsers` (`PLAYWRIGHT_BROWSERS_PATH`). **Nič neinštaluj.** Kontajner nemá grafickú kartu, WebGL kreslí
softvérovo; podrobnosti `../testy-a-nasadenie/SKILL.md`, časť 1. Na vlastný prieskum stránky (klikanie,
selektory, konzola) slúži `../../skills/webapp-testing/` (Python Playwright).

### 7. Oprava

Jedna oprava naraz, od závažných. Po nej **ten istý audit s tými istými šírkami** a porovnanie `sprava.json`
pred a po; snímky vedľa seba. Pri HEAD SPA 30 po zmene CSS alebo JS `node tools/build.mjs` (web načítava
`*.min.*`). Čo sa opravilo a čo nie (a prečo), zapíš do dokumentu projektu (`barbershop-30/docs/CHECKS.md`,
README HEAD SPA 30). Nový text potrebuje kľúč vo všetkých šiestich `assets/i18n/*.json`.

## Figma a Playwright: čo hovorí video a čo máme

| Vo videu | U nás |
| --- | --- |
| Figma MCP: Claude číta návrh z Figmy | konektor Figma je v adresári Claude; 2026-10-11 počas písania tohto skillu bol pripojený, nástroje sme neskúšali (weby nemajú návrh vo Figme). Pripája sa na https://claude.ai/customize/connectors; ak sa nástroje neukážu, nová relácia. Postup s Figmou aj bez nej: [references/figma-mcp.md](references/figma-mcp.md) |
| Playwright: test a snímky | Playwright beží priamo z Node skriptov (`dizajn-audit.mjs`, `dymovy-test.mjs`), MCP server na to netreba |
| „opíš web obyčajnými slovami“ | šablóna `references/zadanie.md`, fakty len zo zdrojov |
| skill „taste“ | `references/vkus.md`: referencie, rozbor, princípy bez kopírovania |
| 24 skills na typografiu, rozostupy, rozloženie… | `references/oblasti.md`, každá oblasť odkazuje na existujúci skill alebo nástroj |

## Pasce (lekcie)

| Pasca | Ako sa stala | Riešenie |
| --- | --- | --- |
| Snímka celej stránky sa od 8192 px opakuje | 2026-10-11: Chromium so SwiftShaderom (`--use-gl=angle --use-angle=swiftshader`, predvoľba testov s WebGL) má `MAX_TEXTURE_SIZE` 8192; snímka celej stránky BARBERSHOP 30 (390 px, výška 15 767) mala od riadku 8192 znova vrch stránky, HEAD SPA 30 (24 679 px) trikrát úvod a cenník, poukaz až kontakt chýbali. Bez týchto prepínačov bola snímka správna | celú stránku fotiť v prehliadači bez prepínačov SwiftShaderu alebo po úsekoch do 8192 px; pri dlhej stránke vždy skontrolovať, či sa úvod neopakuje |
| Snímka celej stránky je skoro prázdna alebo poskladaná zle | 2026-10-11, telefón 390 px bez skrolu: HEAD SPA 30 nevykreslil sekcie s `content-visibility: auto` (7 sekcií) a načítal 8 z 30 obrázkov s `loading="lazy"`; BARBERSHOP 30 2 z 26 (prázdny tím a galéria). Po prejdení stránky skrolom 26 a 23, stránka celá | pred snímkou celej stránky ju prejsť skrolom po kúskoch a vrátiť hore (snímka z odskrolovanej polohy, `scrollY` 14 923, mala chybné úseky aj bez SwiftShaderu); výška HEAD SPA 30 sa tým zmení z 25 715 na 24 679 px (odhad `contain-intrinsic-size`) |
| Správa píše „kreslí sa Manrope ExtraLight“ | orezané súbory `Manrope-400.woff2` a `Manrope-700.woff2` majú v tabuľke mien „Manrope ExtraLight“ (vyrezané z premenného písma), váha v nich je správna (`usWeightClass` 400 a 700, overené fontTools) | meno z tabuľky nie je chyba; chýbajúce znaky áno (U+2011 v Manrope HEAD SPA 30 chýba, v BARBERSHOP 30 je) |
| Vrstva „agentúrneho“ vzhľadu pôsobila lacno | HEAD SPA 30 vrstva V9: číslovanie sekcií 01 až 11, linka priebehu skrolu, svetlo pod kurzorom, odlesk na kartách, magnetické tlačidlá (README, Vrstva V9 a Luxusná vrstva) | vypnutá; prémiovosť robí priestor, písmo a zdržanlivosť, nie efekty |
| `ch` nie je znak | BARBERSHOP 30 `.price-desc` `max-width: 62ch` pri 15 px dal na počítači 83 znakov na riadok; HEAD SPA 30 `.desc` `58ch` pri 16,5 px dal 71 | dĺžku riadku meraj v prehliadači, nie z CSS |
| Číslo kontrastu v dokumente nesedí | `ART_DIRECTION.md` uvádza `--ink` na `--lamp` 6,3 : 1, výpočet WCAG dáva 5,4 : 1 (stále nad 4,5) | kontrast vždy prepočítať z hodnôt v CSS |
| Tokeny definované viackrát | HEAD SPA 30 má päť blokov `:root` (riadky 2, 980 v media query, 1362, 1570, 1855) a 94 × `!important`, BARBERSHOP 30 dva (základ na riadku 14, prehliadka na riadku 947, každý so svojím komentárom) plus úpravy v media query a 7 × | nový web: jeden blok tokenov (alebo jeden na vrstvu, s komentárom), vrstvy bez `!important`; pri úprave HEAD SPA 30 hľadaj poslednú definíciu |
| Dva nadpisy h1 v HTML | HEAD SPA 30 má h1 v úvode s filmom (`.band`) aj v pokojnom úvode (`.hero-static`); viditeľný je vždy jeden | pri kontrole poradia nadpisov počítať len viditeľné prvky |
| Starý dokument v rozpore s pravidlami | `docs/zadanie-zjednotenie-s-prevadzkou.md` píše „pod značkou Salón 30“ a zelenú plochu; dnešné `CLAUDE.md` oboje zakazuje | pri rozpore platí `CLAUDE.md`; staré zadania brať ako históriu |
| Vkus z referencie prebije pravidlo | lákavé pri „prémiovom“ webe: žiara, častice, efekt pod kurzorom | pravidlá projektu majú prednosť (Poradie autorít) |
| Fakt doplnený z pamäti | „prémiový“ text láka na čísla a sľuby | fakt len zo zdroja (`obsah-a-texty`); čo nie je v zdroji, vynechať |

## V tomto repozitári

- HEAD SPA 30: pravidlá `CLAUDE.md` (Technika: písma, štýl, film, Lighthouse), štýl `assets/style.css`
  (sekcie Luxusná vrstva, Čitateľnosť, Prechody medzi časťami, Luxusná kompozícia, Pohybový systém, Menu rituálov),
  `index.html`, README (Luxusná vrstva, Identita z prevádzky, Typografia po slovensky, Rýchlosť a prístupnosť,
  Mobil), fotky a pravidlá fotenia `docs/fotenie.md`, build `tools/build.mjs`.
- BARBERSHOP 30: `barbershop-30/docs/MASTER_BRIEF.md` (kontrolný zoznam detailu), `ART_DIRECTION.md` (paleta,
  typografia, mriežka, komponenty, pohyb), `TOUR_DIRECTION.md`, `CONTENT_SOURCES.md`, štýl
  `barbershop-30/assets/style.css` (časti 1 až 8 a PREHLIADKA), záznamy `docs/CHECKS.md`.
- Existujúce skills: `toolbox/skills/` (frontend-design, theme-factory, webapp-testing, web-artifacts-builder),
  `toolbox/skills-animacie/` (design-dna, gsap, motion-design, genjutsu), `toolbox/skills-z-praxe/` (rychly-web,
  testy-a-nasadenie, obsah-a-texty, film-z-fotiek, booqme-rezervacie, workflowy).
- Väčšia stavba alebo kontrola z viacerých pohľadov naraz: `../workflowy/` (`priklady/stavba-webu.js`,
  `priklady/integracia-a-kontrola.js`).

## Mimo tohto repozitára

Skill sa dá použiť aj v inom chate (zip zo `../zabal.py` do Claude.ai, Settings, Capabilities, Skills; alebo
priečinok do `~/.claude/skills/`). Vtedy:

- Postup, šablóny a pravidlá v `references/` platia; hodnoty „u nás“ sú stav webov k 2026-10-11, nie pravidlo
  pre iný podnik.
- Pravidlá projektu, fakty a fotky prevádzky si vypýtaj od majiteľa (alebo nech vloží obsah `CLAUDE.md`,
  `ART_DIRECTION.md`, `CONTENT_SOURCES.md`). Bez faktov stavaj len kostru so zástupnými poľami, nie vymyslený obsah.
- `dizajn-audit.mjs` potrebuje Node a Playwright s Chromiom. Kde chýbajú, nainštaluj ich len so súhlasom
  (`npm i -D playwright`, `npx playwright install chromium`); kde to nejde, urob snímky inak a kontroly ručne
  podľa `references/oblasti.md`.
- Odkazy na iné skills (`../testy-a-nasadenie/`, `../../skills-animacie/`) fungujú, len ak sú nahraté aj tie.
- Figma: konektor na https://claude.ai/customize/connectors, potom nová relácia (`references/figma-mcp.md`).

## Kontrolný zoznam

- [ ] Zadanie vyplnené: publikum, jedna úloha stránky, sekcie v poradí, výzvy, obmedzenia, zdroje faktov.
- [ ] Pravidlá projektu prečítané dnes; nič v návrhu ich neporušuje.
- [ ] Referencie: prvá je prevádzka, potom 3 až 5 webov; pri každej zapísaný prevzatý princíp, nič skopírované.
- [ ] Jeden blok tokenov: farby, písma (najviac dve rodiny), škála, rozostupy po 4/8 px, rádius, pohyb.
- [ ] Kontrast textu aspoň 4,5 : 1, veľký text a ovládacie prvky aspoň 3 : 1, prepočítané z CSS.
- [ ] Odsek 45 až 75 znakov na riadok na počítači, zmerané v prehliadači.
- [ ] Jeden viditeľný h1, nadpisy bez preskakovania úrovní, viditeľný fokus, odkaz na preskočenie na obsah.
- [ ] Dotykové plochy na telefóne aspoň 44 px (minimum WCAG AA 24 px).
- [ ] Telefón 375 až 430 px bez vodorovného pretečenia; tablet a počítač bez dier a natiahnutých riadkov.
- [ ] Pohyb len `transform` a `opacity`, `prefers-reduced-motion` dá pokojnú verziu.
- [ ] `dizajn-audit.mjs` bez závažných nálezov (kód 0), snímky všetkých šírok pozreté okom.
- [ ] Dymový test, Lighthouse naživo a kontroly textov podľa ich skills.
- [ ] Opravy a čo ostalo neopravené zapísané v dokumente projektu.
