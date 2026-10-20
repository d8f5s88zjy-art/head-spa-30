# Zapracovanie 2. kola skeptika (20. 10. 2026) do PLAN-D6-D7.md – presné úpravy, nie prepis.
# Použitie: python3 -I zapracuj-skeptika.py <cesta k PLAN-D6-D7.md>
# Každý starý reťazec sa musí v pláne vyskytovať presne raz; inak skript skončí chybou a nič nezapíše.
import sys, pathlib, shutil

cesta = pathlib.Path(sys.argv[1])
t = cesta.read_text(encoding='utf-8')
zaloha = cesta.parent / 'chyba' / 'navrh' / 'PLAN-D6-D7.pred-skeptikom-2.md'
if not zaloha.exists():
    shutil.copy(cesta, zaloha)

opravy = [
# ---------------------------------------------------------------- 0. V skratke
("""   Odkaz na kartičku preto skryjeme, kým systém kartičiek nebude spustený; potom sa vráti (otázka 15).
""",
"""   Odkaz na kartičku má dve možnosti a vyberiete si vy (otázka 15): skryť ho, kým systém kartičiek na serveri nebeží,
   alebo systém spustiť a odkaz viesť na prihlášku priamo v Barbershope (bez servera sa prihláška nedá odoslať).
   Kým neodpoviete, platí skrytie.
"""),
("""   Čo nevieme (napríklad platba, storno, cena a platnosť poukážky), sa na webe neukáže, kým to nepotvrdíte.
""",
"""   Čo nevieme alebo čo ste nepotvrdili, sa na webe neukáže, kým to nepotvrdíte: platba, storno, pripomienky,
   hodnota a platnosť poukážky, dni a ceny Romany, hodnotenie číslom a aj veta „Prísť môžeš aj bez objednania“ (starý
   web ju uvádza, ale dnešný stav potvrdíte len vy). Tieto texty sú pripravené a skryté; po vašej odpovedi sa len zapnú.
"""),
("""   Web tak pôsobí filmovo aj mimo prehliadky. Fotky v galérii sa budú plynulo prelínať a na telefóne sa dajú listovať prstom.
""",
"""   Web tak pôsobí filmovo aj mimo prehliadky. Zväčšené fotky z galérie sa budú plynulo prelínať a na telefóne sa dajú
   listovať prstom; pás tímu dostane počítadlo „3 / 10“, aby bolo vidieť, koľko barberov ešte nasleduje.
"""),
# ---------------------------------------------------------------- 1. Východiská, bod 4 (rozpočet HTML)
("""4. **Rozpočet HTML.** `index.html` má dnes 14 380 B gzip (`gzip -9c`), strop je 14 600 B (prvé okno TCP, README, D2).
""",
"""4. **Rozpočet HTML.** `index.html` má dnes 14 409 B gzip (`gzip -c index.html | wc -c`; `gzip -9c` dáva 14 380 B),
   strop je 14 600 B (prvé okno TCP, README, D2); rezerva je teda 191 B.
"""),
("""   východisko pre D6a zmeria znova po zlúčení D5. Rozpočty nižšie (asi +100 až +150 B) platia voči tomuto číslu.
   Nový viditeľný text preto ide do modulu podľa vzoru `assets/recenzie.js`. Vložené uzly prekladá MutationObserver
   v `i18n.js:97–98`. Do HTML ide len nevyhnutné (JSON‑LD, jeden odkaz v pätičke, prázdny kontajner).
""",
"""   východisko pre D6a zmeria znova po zlúčení D5. Rozpočty nižšie platia voči tomuto číslu.
   Pravidlo pre text (R2): čo musí byť v prvom okne alebo nad kotvami filmu (riadok „Dnes“ v úvode a v karte
   Rezervácia, vety nad cenníkom a v tíme, skoky v cenníku), ide priamo do HTML; všetko ostatné (blok „Pred
   návštevou“) vkladá lenivý modul podľa vzoru `assets/recenzie.js` a prekladá ho MutationObserver v `i18n.js:97–98`.
   Každé vloženie je zmerané na kópii `index.html` (`chyba/navrh/rozpocet/rozpocet.txt`, 20. 10. 2026, `gzip -c`):

   | Vloženie do `index.html` | B gzip |
   |---|---|
   | riadok „Dnes“ v úvode (`<p class="dnes">`) | +14 |
   | riadok „Dnes“ v karte Rezervácia | +10 |
   | dve vety (nad cenníkom, v tíme) | +31 |
   | skoky v cenníku (`<nav>` so 4 kotvami) | +52 |
   | odkaz „Ako prebieha rezervácia →“ | +29 |
   | prázdny kontajner „Pred návštevou“ | +16 |
   | D6a‑0 `hidden` na `<li>` + D6a odkaz „Právne informácie“ | +28 |
   | D6a zmazaný dátový favicon (`index.html:36`) | −189 |
   | D6a JSON‑LD (HairSalon, geo, hasMap, priceRange) | +109 |
   | D6a `og:type` website | −6 |
   | **Spolu D6a‑0 + D6a + D6b** | **+94 → asi 14 503 B, rezerva asi 97 B** |

   (`gzip -9c`: spolu 14 432 B, rezerva 168 B.) Ak po zlúčení D5 rezerva nestačí, vypúšťa sa v poradí: odkaz „Ako
   prebieha rezervácia →“ (−29 B), riadok „Dnes“ v karte Rezervácia (−10 B), skoky v cenníku (−52 B). Nič z toho sa
   nepresúva do modulu „pri štarte“.
"""),
# ---------------------------------------------------------------- 2. Tabuľka nálezov
("""| N07 | Cenník: Fraunces `opsz 144` pri 18–26 px, „13 €“ a „15 €“ sú na DPR 1 takmer rovnaké, na telefóne „Páns ky s trih“ | OC‑10 | netreba | D6a |""",
 """| N07 | Cenník: Fraunces 800 je statický rez pre `opsz 144` (bez osí, bez `tnum`) pri 18–26 px: „13 €“ a „15 €“ sú na DPR 1 takmer rovnaké, na telefóne „Páns ky s trih“; rieši sa bez nového písma (R12) | OC‑10 | netreba (`fonts.css` a rezy overené fonttools 20. 10.) | D6a |"""),
("""| N15 | „Chcem ísť dnes“: web nepovie, že online sa dá aj na dnes ani že sa dá prísť bez objednania; „Teraz otvorené“ je až na 17,3. obrazovke | OC‑05, POR‑03, POR‑11, F04 | systém, starý web, citovaná recenzia | D6b |""",
 """| N15 | „Chcem ísť dnes“: web nepovie, že online sa dá aj na dnes ani že sa dá prísť bez objednania; „Teraz otvorené“ je až na 17,3. obrazovke | OC‑05, POR‑03, POR‑11, F04 | systém (aj na dnes); starý web a recenzia (bez objednania: nepotvrdené) | D6b („aj na dnes“ hneď; „bez objednania“ skryté do otázky 5, R11) |"""),
("""| N16 | Darčekové poukážky: 0 zmienok | OC‑04, POR‑01, F10 | existencia: starý web + foto‑10/40; detaily od majiteľa | D6b (existencia a telefón) |""",
 """| N16 | Darčekové poukážky: 0 zmienok | OC‑04, POR‑01, F10 | existencia: starý web + foto‑10/40; detaily od majiteľa | D6b (existencia a telefón; hodnota, platnosť a predaj skryté do otázky 2) |"""),
("""| N25 | Pás tímu na telefóne bez počítadla (9 švihov); recenzie spomínajú „Tony“, ktorý nie je v tíme | OC‑15 | systém | D7 (počítadlo), otázka |""",
 """| N25 | Pás tímu na telefóne bez počítadla (9 švihov); recenzie spomínajú „Tony“, ktorý nie je v tíme | OC‑15 | systém | D7 (počítadlo len pri páse tímu), otázka 19 |"""),
("""| N10 | Drobnosti: ikona na plochu iPhonu, dvojitý favicon, `og:type`, dlhé meta popisy, `lastmod`, upozornenie na nové okno | T09, T10 (časť), T11, T13, T14 | netreba | D6a |""",
 """| N10 | Drobnosti: ikona na plochu iPhonu (raster z `favicon.svg`, R14), dvojitý favicon, `og:type`, dlhé meta popisy, `lastmod`, upozornenie na nové okno | T09, T10 (časť), T11, T13, T14 | netreba | D6a |"""),
# ---------------------------------------------------------------- 4. Rozhodnutia
("""- **R2 Nový text ide do modulu, nie do HTML** (vzor `recenzie.js`, `app.js:366–374`).
  - Dôvod: rezerva HTML je 220 B gzip a D6a z nej minie asi 100–150 B.
""",
"""- **R2 Do HTML ide len text prvého okna a nad kotvami filmu; zvyšok do lenivého modulu** (vzor `recenzie.js`,
  `app.js:366–374`).
  - V HTML: riadok „Dnes“ (úvod, karta Rezervácia), dve vety (cenník, tím), skoky v cenníku, odkaz „Ako prebieha
    rezervácia →“ a prázdny kontajner „Pred návštevou“ (spolu +152 B gzip, meranie v časti 1, bod 4).
  - V module `navsteva.js` (lenivo, pri priblížení pásu kontaktu): len blok „Pred návštevou“ pod kartou „Kde nás nájdeš“.
  - Dôvod: rezerva HTML je dnes 191 B gzip (`gzip -c`); po D6a‑0, D6a a D6b ostane asi 97 B. Žiadny text sa nevkladá
    modulom „pri štarte“: posúval by kotvy filmu a nebol by v prvom obraze.
"""),
("""- **R10 Z025 (materiálová textúra pod textom) sa teraz nerobí.**
  - Problém plochých pásov rieši smer A skutočnými fotkami bez textu cez textúru (pozri D7).
""",
"""- **R10 Z025 (materiálová textúra pod textom) sa teraz nerobí.**
  - Problém plochých pásov rieši smer A skutočnými fotkami bez textu cez textúru (pozri D7).
- **R11 Nepotvrdený údaj sa neukáže** (pravidlo z časti 0, bod 4).
  - Platí pre: „Prísť môžeš aj bez objednania“ (otázka 5), platbu (otázka 1), storno a meškanie (3), pripomienky (4),
    hodnotu, platnosť a predaj poukážok (2), dni a ceny Romany (14), hodnotenie číslom (18).
  - Texty sú pripravené (kľúče v 7 slovníkoch, dáta modulu so `zobrazit: false`), nie sú v DOM a zapnú sa jedným
    príznakom po odpovedi. Existencia poukážok a predaj produktov ostávajú viditeľné: starý oficiálny web a foto‑40
    (poukážky na pulte) sú zdroje podľa časti 0, bod 4, a netvrdia nič o dnešnej prevádzke, čo by vedel len majiteľ.
- **R12 Cenník (N07) sa opravuje bez nového písma a bez variabilných osí.**
  - Overené 20. 10. 2026: `assets/fonts.css` definuje len statické rezy Fraunces 500, 800 a 500 italic („static
    instances cut from the variable font, opsz=144“, `fonts.css:2–3`); `fonts/Fraunces-800.woff2` nemá tabuľku `fvar`,
    GSUB má len `case`, `liga`, `rvrn`, `ss01` (bez `tnum`), GPOS `kern`; šírky číslic sú rôzne (1 = 800, 0 = 1296
    jednotiek z 2000; fonttools 4.66). Variabilný zdroj v repozitári nie je.
  - Preto `font-variation-settings` (`style.css:727, 736`) ani `font-variant-numeric: tabular-nums` (`style.css:710,
    739`) na Fraunces nič nemenia; `tabular-nums` účinkuje len na Manrope (`.price-time`), ktorý `tnum` má.
  - Nástroje opravy: veľkosť, hrúbka z existujúcich rezov (800, prípadne 500), medzery, riadkovanie, pevná šírka
    stĺpca so zarovnaním vpravo, kontrast. `fonts.css` a `assets/fonts/` sa nemenia.
- **R13 Okná miestnosti (E1) sú `<img>` v `<picture>`, nie pseudoprvok s `image-set`.**
  - `srcset` AVIF a WebP, `loading="lazy"`, `decoding="async"`, `width`/`height` v atribútoch, odhalenie až po
    `img.decode()` toho istého prvku.
  - Prvky vytvára `app.js` (a modul pre položky „Pred návštevou“), nie HTML: šesť `<picture>` v HTML by stálo
    +324 B gzip (zmerané na kópii), čo rozpočet 14 600 B nedovolí. Miesto okna rezervuje CSS vopred (CLS 0).
- **R14 Ikony na plochu sú raster priamo z `favicon.svg`.**
  - Bez prevodu „30“ na krivky písma a bez dokresľovania loga (vektor nemáme, otázka 24). `favicon.svg` sa nemení.
- **R15 Vernostná kartička: dve možnosti, vyberie majiteľ (otázka 15).**
  - A: položka v pätičke ostáva skrytá, kým na headspa30.sk nebeží `vernost/` (curl 200); potom ju odkryje
    `data-zapnute`.
  - B: majiteľ spustí systém kartičiek a odkaz vedie na prihlášku priamo v Barbershope (`vernost.js` ju pri
    `data-zapnute` otvorí cez `otvor('')`, `vernost.js:171–177`). `vernost.js` vie prihlášku zobraziť aj bez servera,
    ale odoslanie volá `/vernost/api/?a=registracia` (`vernost.js:123`) a bez servera skončí chybou; B preto platí len
    so spusteným serverom.
  - Do odpovede sa implementuje A (bezpečná). Pri B sa mení len nasadenie (`data-zapnute` v `pages.yml`), kód D6a‑0 je
    pre obe možnosti spoločný.
"""),
# ---------------------------------------------------------------- D6a-0
("""1. **N01, vernostná kartička:**
   - celé `<li>` s odkazom dostane `hidden`,
""",
"""1. **N01, vernostná kartička** (R15: možnosť A hneď, možnosť B po rozhodnutí majiteľa v otázke 15):
   - celé `<li>` s odkazom dostane `hidden` (asi +7 B gzip),
"""),
("""- **Vernostná kartička naživo:** v pätičke Barbershopu nie je položka viditeľná (Playwright 390 × 844 a 1440 × 900, sk
  aj en). Lokálne s ručne pridaným `data-zapnute` sa položka ukáže a klik otvorí prihlášku z `vernost.js`,
  nie headspa30.sk.
""",
"""- **Vernostná kartička naživo (možnosť A):** v pätičke Barbershopu nie je položka viditeľná (Playwright 390 × 844
  a 1440 × 900, sk aj en). Lokálne s ručne pridaným `data-zapnute` sa položka ukáže a klik otvorí prihlášku
  z `vernost.js`, nie headspa30.sk (to je zároveň skúška možnosti B; naživo sa B overí až so serverom, API 200).
"""),
# ---------------------------------------------------------------- D6a N07
("""5. **N07 Čitateľnosť cenníka.**
   - Pozor: `assets/fonts/Fraunces-*.woff2` sú statické rezy s `opsz 144` (`fonts.css:2–3`, fonttools: bez tabuľky
     `fvar`, GSUB len `case`, `liga`, `rvrn`, `ss01`, bez `tnum`). `font-variation-settings` ani
     `font-variant-numeric: tabular-nums` preto vzhľad nezmenia; samotné zmazanie `opsz 144` v CSS nič neopraví.
   - Najprv príčina (Iron Law): či medzery „Páns ky s trih“ spôsobuje rez pre 144 pt pri 18–26 px, alebo strata
     vyrovnania párov pri orezaní písma (porovnať s pôvodným Fraunces v rovnakej veľkosti).
   - Až potom oprava podľa rozhodnutia (pozri nálezy recenzie): nový statický rez tej istej rodiny pre menšiu optickú
     veľkosť len pre cenník, alebo úprava veľkosti a medzier bez nového súboru.
   - Vzhľad (Fraunces 800, farba, rozloženie) sa nemení. Kontroluje sa výrez „13 €“ a „15 €“ pri DPR 1 a zalomenie názvov
     na 390 px.
""",
"""5. **N07 Čitateľnosť cenníka** (R12: bez nového písma, bez variabilných osí; `fonts.css` a `assets/fonts/` sa nemenia).
   - Overené v kóde 20. 10. 2026: `fonts.css:1–3` („static instances cut from the variable font, opsz=144“), rezy
     500/800/500i; `Fraunces-800.woff2` bez `fvar`, GSUB `case`, `liga`, `rvrn`, `ss01`, GPOS `kern`, bez `tnum`;
     šírky číslic 1 = 800 až 0 = 1296 jednotiek. `font-variation-settings: "opsz" 144` v `style.css:727, 736` je bez
     účinku a `tabular-nums` (`style.css:710, 739`) na Fraunces tiež; sumy sa dnes zarovnávajú len `text-align: right`
     v pevnom stĺpci 6.5rem (`style.css:719`), na telefóne v stĺpci `auto` (`style.css:753`).
   - Najprv príčina (Iron Law), ale len medzi príčinami, ktoré rieši CSS: (a) vlasové ťahy rezu pre 144 pt pri
     18–26 px na DPR 1 (bruško „3“ a „5“ splýva), (b) medzery vnútri slova na telefóne pri 18 px („Páns ky s trih“):
     porovnať výrezy pri `letter-spacing` 0 a −0.01em, pri 18 a 20 px, pri reze 800 a 500 (oba existujú). Výsledok sa
     zapíše so snímkami do CHECKS.
   - Oprava v `style.css` (`.price-name`, `.price-amount`, `.price-row`), bez zmeny farby a rozloženia:
     - veľkosť: sumy 1.625rem → 1.875rem na počítači a 1.75rem na telefóne; názvy na telefóne 1.125rem → 1.25rem
       (`style.css:761`),
     - hrúbka: 800 ostáva prvá voľba (hrubšie vlasové ťahy); existujúci rez 500 len pre sumy a len vtedy, keď pri 800
       dvaja kontrolóri „13 €“ a „15 €“ pri DPR 1 nerozlíšia,
     - medzery: `letter-spacing` súm 0 → 0.01em, názvov −0.01em → 0; medzera medzi číslom a „€“ a `white-space: nowrap`
       ostávajú,
     - riadkovanie: sumy `line-height` 1 → 1.1, názvy 1.2 → 1.25 na telefóne,
     - zarovnanie bez `tnum`: stĺpec súm má pevnú šírku (počítač 6.5rem ostáva, telefón `min-width: 4.5ch`)
       a `text-align: right`, takže „€“ stoja pod sebou; `tabular-nums` ostáva pre Manrope (`.price-time`),
     - kontrast: sumy a názvy `--paper` (#f1e9dd) na doske `rgba(14, 13, 12, 0.84)` nad záberom; meria sa na snímke nad
       najsvetlejším miestom záberu a musí byť ≥ 4,5 : 1, inak sa doska stmaví na 0.9,
     - `font-variation-settings` v `.price-name` a `.price-amount` sa zmaže (je bez účinku).
   - Vzhľad (Fraunces 800, farba, rozloženie) sa nemení. Kontroluje sa výrez „13 €“ a „15 €“ pri DPR 1 a zalomenie
     názvov na 390 px.
"""),
# ---------------------------------------------------------------- D6a N10 ikony
("""   - `apple-touch-icon.png` 180 a `icon-512.png` z `favicon.svg`; „30“ sa prevedie na krivky z `assets/fonts` (Fraunces,
     OFL) cez fonttools, nie písmom v SVG,
""",
"""   - `apple-touch-icon.png` 180 a `icon-512.png` rastrom priamo z existujúceho `assets/favicon.svg` (R14): snímka SVG
     v Chromiu cez Playwright pri 180 × 180 a 512 × 512 so sprístupneným rezom Fraunces 800 z `assets/fonts`, bez
     prevodu „30“ na krivky a bez dokresľovania; `favicon.svg` sa nemení. Ak rasterizér písmo nenačíta, ikona ukáže
     záložný serif rovnako ako prehliadač pri SVG favicone (SVG v záložke webové písmo nenačíta); zapíše sa to do
     CHECKS a vyrieši logo z otázky 24,
"""),
("""Rozpočet HTML pre D6a:
- JSON‑LD asi +95 B (meranie T05: 14 475 B),
- odkaz v pätičke asi +40 B,
- zmazaný favicon asi −40 B,
- skrytie `<li>` +7 B.

Spolu asi 14 480–14 520 B. Strop je 14 600 B.
""",
"""Rozpočet HTML pre D6a (zmerané na kópii `index.html`, `chyba/navrh/rozpocet/rozpocet.txt`, `gzip -c`):
- JSON‑LD (HairSalon, geo, hasMap, priceRange) +109 B,
- odkaz „Právne informácie“ v pätičke a skrytie `<li>` (D6a‑0) spolu +28 B,
- zmazaný dátový favicon −189 B (riadok `index.html:36` má 540 B),
- `og:type` website −6 B.

Spolu −58 B oproti dnešku, teda asi 14 351 B pred D6b (D6b pridá +152 B, časť 1, bod 4). Strop je 14 600 B.
"""),
("""- **Cenník:**
  - výrezy pri 1440 × 900 (DPR 1) a 390 × 844 (DPR 3): dvaja kontrolóri jednoznačne prečítajú „13 €“ a „15 €“,
  - žiadny názov služby nie je zalomený vnútri slova (skript na `getClientRects` slov),
  - výrezy „13 €“, „15 €“ a „Pánsky strih“ pred a po sa v pixeloch líšia (zmena je viditeľná, nie len v CSS).
""",
"""- **Cenník:**
  - výrezy pri 1440 × 900 (DPR 1) a 390 × 844 (DPR 3): dvaja kontrolóri jednoznačne prečítajú „13 €“ a „15 €“,
  - žiadny názov služby nie je zalomený vnútri slova (skript na `getClientRects` slov) a na 390 px nemá žiadne slovo
    medzeru vnútri (vizuálne, 2 kontrolóri),
  - výrezy „13 €“, „15 €“ a „Pánsky strih“ pred a po sa v pixeloch líšia (zmena je viditeľná, nie len v CSS),
  - `git diff --stat assets/fonts assets/fonts.css` je prázdny; v `style.css` nepribudol `font-variation-settings`,
    `@font-face` ani nová rodina písma,
  - sumy stoja v stĺpci zarovnané vpravo: pravý okraj „€“ sa v rámci skupiny líši najviac o 1 px
    (`getBoundingClientRect`),
  - kontrast súm a názvov na doske ≥ 4,5 : 1 (meranie zo snímky nad najsvetlejším miestom záberu).
"""),
("""- Ikony z kriviek: Fraunces je OFL, licencia je v poriadku.
""",
"""- Ikony rastrom z `favicon.svg`: bez Fraunces v rasterizéri bude „30“ v záložnom serife; zapísať do CHECKS a vyriešiť
  logom (otázka 24). Logo sa nedokresľuje.
"""),
("""**Kapitoly skillu:** C001, C015, C019, C059, C061, C069, C075, C078, C081, C083, C091 (štruktúrované dáta), C100.
""",
"""**Kapitoly skillu:** C001, C015, C019, C023 (typografia bez nového písma), C059, C061, C069, C075, C078, C081, C083,
C091 (štruktúrované dáta), C100.
"""),
# ---------------------------------------------------------------- D6b umiestnenie a technika
("""- **odkaz z cenníka** „Ako prebieha rezervácia →“ (#pred-navstevou).

Technika:
- modul `assets/navsteva.js` (≤ 6 kB gzip), v HTML len prázdny kontajner,
- modul sa načíta, keď sa pás kontaktu priblíži (IO `rootMargin 150% 0px`), alebo v nečinnosti po `load`, podľa toho,
  čo nastane skôr,
- odpovede sú natívne `<details>` (klávesnica bez JS),
- každá položka má v dátach `zdroj`, `overene` (dátum) a `zobrazit`. Položka bez zdroja sa nevykreslí.

Obsah, ktorý sa zobrazí hneď (fakty overené 20. 10. 2026; presné znenie v časti 6):
""",
"""- **odkaz z cenníka** „Ako prebieha rezervácia →“ (#pred-navstevou),
- **skoky v cenníku** nad zoznamom (Strih · Brada a holenie · Balíčky · Doplnky).

Technika (R2; rozpor „lenivý modul pri priblížení“ verzus „vloží pri štarte“ je odstránený):
- **Priamo v HTML** (musí byť v prvom okne alebo nad kotvami filmu, preto sa nikdy nevkladá skriptom): riadok „Dnes“
  v úvode (+14 B gzip) a v karte Rezervácia (+10 B) ako prázdny `<p class="dnes">` s výškou rezervovanou v CSS, dve
  vety (+31 B), skoky v cenníku `<nav class="price-nav">` so 4 kotvami (+52 B), odkaz „Ako prebieha rezervácia →“
  (+29 B) a prázdny kontajner `<div id="pred-navstevou" data-navsteva hidden>` (+16 B). Spolu +152 B, zmerané na kópii
  `index.html` (`chyba/navrh/rozpocet/rozpocet.txt`); po D6a (asi 14 351 B) je to asi 14 503 B, rezerva asi 97 B.
  Text riadku „Dnes“ dopĺňa `hodiny.js` z D6a až po prvom obraze; nič iné sa do týchto prvkov nevkladá.
- **Ak po zlúčení D5 rezerva nestačí**, vypúšťa sa v tomto poradí (nie presúva do modulu): odkaz „Ako prebieha
  rezervácia →“ (−29 B; cieľ ostáva dostupný z menu a pätičky), riadok „Dnes“ v karte Rezervácia (−10 B; ostane
  v úvode), skoky v cenníku (−52 B; ostane menu).
- **Modul `assets/navsteva.js`** (≤ 6 kB gzip) rieši len blok „Pred návštevou“ pod kartou „Kde nás nájdeš“. Načíta sa
  lenivo: keď sa pás kontaktu priblíži (IO `rootMargin 150% 0px`) alebo hneď, keď adresa či skok mieri na
  `#pred-navstevou`. Nič nevkladá pri štarte.
- Odpovede: každá položka je nadpis (otázka) a 1–2 vety viditeľné hneď, bez ťuknutia. Natívne `<details>` (klávesnica
  bez JS) len tam, kde je dlhší obsah obhájený: „Ako sa objednám“ (4 kroky ako zoznam) a „Parkovanie“ (sadzby,
  výnimky, odkaz).
- Každá položka má v dátach `zdroj`, `overene` (dátum) a `zobrazit`. Položka bez zdroja alebo so `zobrazit: false`
  sa nevykreslí (nie je v DOM); jej kľúče sú v 7 slovníkoch pripravené (R11).

Obsah (fakty overené 20. 10. 2026; presné znenie v časti 6; položky označené „skryté“ čakajú na majiteľa):
"""),
("""7. **Bez objednania:** starý oficiálny web dnes uvádza „8 kresiel – minimálne čakanie – rýchly servis, aj keď prídeš
   bez objednania“ a citovaná recenzia to potvrdzuje.
   - Text je zdržanlivý (časť 6).
   - Potvrdenie majiteľa neblokuje; ak povie nie, položka sa vypne jedným príznakom.
8. **Darčekové poukážky:** existujú (starý web; foto‑40 s „DARČEKOVÁ POUKÁŽKA“ na recepcii), ako ich kúpiť povie
   recepcia (tlačidlo Zavolať). Hodnota, platnosť a predaj na diaľku až od majiteľa.
""",
"""7. **Bez objednania (skryté do odpovede na otázku 5, R11):** starý oficiálny web uvádza „8 kresiel – minimálne
   čakanie – rýchly servis, aj keď prídeš bez objednania“ a citovaná recenzia to potvrdzuje, ale dnešný stav vie len
   majiteľ.
   - Veta „Prísť môžeš aj bez objednania. S rezerváciou máš svoj čas istý.“ je pripravená (kľúče v 7 slovníkoch,
     `zobrazit: false`), v DOM nie je.
   - Po odpovedi „áno“ sa zapne jedným príznakom; po „nie“ sa kľúče zmažú. Dovtedy cesta „chcem ísť dnes“ končí
     odpoveďou „online aj na dnes“ (bod 2) a tlačidlom Zavolať.
8. **Darčekové poukážky:** existujú (starý web; foto‑40 s „DARČEKOVÁ POUKÁŽKA“ na recepcii), ako ich kúpiť povie
   recepcia (tlačidlo Zavolať). Hodnota, platnosť a predaj na diaľku sú pripravené skryté do odpovede na otázku 2
   (R11).
"""),
("""    Po–St len po potvrdení (dnes je to len dostupnosť v Booqme).
""",
"""    Po–St len po potvrdení (dnes je to len dostupnosť v Booqme); oboje skryté do otázky 14 (R11).
"""),
("""12. **Riadok „Dnes“** v úvode a v karte Rezervácia: „Dnes 9:00–19:00 · Teraz otvorené“ alebo „Zatvorené, otvárame
    v pondelok o 9:00“, cez `assets/hodiny.js` zo sviatkov D6a.
    - Počíta sa bez `Intl` až po prvom obraze (`requestIdleCallback`).
""",
"""12. **Riadok „Dnes“** v úvode a v karte Rezervácia: „Dnes 9:00–19:00 · Teraz otvorené“ alebo „Zatvorené, otvárame
    v pondelok o 9:00“, cez `assets/hodiny.js` zo sviatkov D6a.
    - Prvok `<p class="dnes">` je priamo v HTML (R2, +14 a +10 B gzip); text dopĺňa `hodiny.js`, pri zlyhaní ostane
      prázdny s rezervovanou výškou.
    - Počíta sa bez `Intl` až po prvom obraze (`requestIdleCallback`).
"""),
("""13. **Vety o rezervácii:**
    - nad cenníkom: „Objednať otvorí rezervačný systém, službu v ňom vyberieš v 1. kroku.“,
    - v hlavičke tímu: „Barbera si vyberieš v 2. kroku, alebo zvolíš „Nezáleží“.“

    Dve krátke vety v pásoch nad kotvami filmu: do HTML, ak po D6a ostane rezerva aspoň 80 B. Inak ich vloží modul hneď pri
    štarte (ako recenzie) a kotvy sa prepočítajú (ResizeObserver `app.js:283–285`, `film.js:1427`).
14. **Recenzia pri rezervácii:** jedna doslovná citácia z `recenzie.js` (meno, „Google“) a odkaz „Hodnotenie na Google“
    v páse kontaktu pri tlačidle. Číslo hodnotenia len so súhlasom majiteľa, so zdrojom a dátumom.
15. **Skoky v cenníku:** Strih · Brada a holenie · Balíčky · Doplnky ako kotvy na existujúce `#g-strih`, `#g-brada`,
    `#g-balicky`, `#g-doplnky`. Vloží ich modul pri štarte so skokom z D2.
""",
"""13. **Vety o rezervácii** (priamo v HTML, +31 B gzip, R2):
    - nad cenníkom: „Objednať otvorí rezervačný systém, službu v ňom vyberieš v 1. kroku.“,
    - v hlavičke tímu: „Barbera si vyberieš v 2. kroku, alebo zvolíš „Nezáleží“.“

    Sú nad kotvami filmu, preto sú statické v HTML; nič ich nevkladá pri štarte a kotvy sa neprepočítavajú.
14. **Recenzia pri rezervácii:** jedna doslovná citácia z `recenzie.js` (meno, „Google“) a odkaz „Hodnotenie na Google“
    v páse kontaktu pri tlačidle (vkladá modul, je pod kotvou). Číslo hodnotenia len so súhlasom majiteľa (otázka 18,
    R11), so zdrojom a dátumom.
15. **Skoky v cenníku** (priamo v HTML, +52 B gzip): `<nav class="price-nav" aria-label="Skupiny cenníka">` so 4 kotvami
    Strih · Brada a holenie · Balíčky · Doplnky na existujúce `#g-strih`, `#g-brada`, `#g-balicky`, `#g-doplnky`; skok
    zabezpečí D2. Názvy skupín sú už kľúčmi slovníkov, nový kľúč je len „Skupiny cenníka“.
"""),
("""17. **Pripravené, ale skryté do odpovede majiteľa:**
    - platba,
""",
"""17. **Pripravené, ale skryté do odpovede majiteľa (R11; kľúče v 7 slovníkoch, `zobrazit: false`, nie sú v DOM):**
    - príchod bez objednania (otázka 5),
    - platba,
"""),
("""    - vernostná kartička (veta pri rezervácii po spustení servera),
    - hodnotenie číslom,
""",
"""    - vernostná kartička (veta pri rezervácii po spustení servera, otázka 15),
    - dni a ceny Romany (otázka 14),
    - hodnotenie číslom (otázka 18),
"""),
# ---------------------------------------------------------------- D6b akceptácia
("""  - z 12 ciest končia bez odpovede len tie, ktoré čakajú na majiteľa (platba, lehota storna), a sú zapísané v CHECKS,
  - poukaz, parkovanie, zmena termínu, „dnes alebo bez objednania“, dieťa a cudzinec majú odpoveď z otvoreného menu
    najviac na 2 ťuknutia (položka menu, otvorenie odpovede) a najviac 1 obrazovku skrolu medzi nimi (390 × 844,
    Playwright, zapísané v `cesty.json`).
""",
"""  - z 12 ciest končia bez odpovede len tie, ktoré čakajú na majiteľa (platba, lehota storna, príchod bez objednania),
    a sú zapísané v CHECKS,
  - poukaz (existencia a telefón), parkovanie, zmena termínu, „chcem ísť dnes“ (online aj na dnes), dieťa a cudzinec
    majú odpoveď z otvoreného menu najviac na 2 ťuknutia (položka menu, prípadne otvorenie `<details>`) a najviac
    1 obrazovku skrolu medzi nimi (390 × 844, Playwright, zapísané v `cesty.json`).
"""),
("""  - položky so `zobrazit: false` nie sú v DOM,
""",
"""  - položky so `zobrazit: false` nie sú v DOM; `index.html` ani DOM po vložení modulu neobsahujú „bez objednania“,
    „kartou“, „hotovos“, „storno“ ani „pripomien“, kým príznak nie je zapnutý (grep v `navsteva-test.mjs`); kľúče
    týchto položiek sú v 7 slovníkoch (R11),
  - odpovede mimo „Ako sa objednám“ a „Parkovanie“ sú viditeľné bez ťuknutia a majú najviac 2 vety (skript nad dátami),
"""),
("""- **Ďalej:** `index.html` ≤ 14 600 B gzip, Lighthouse mobil ≥ 95, počítač 100 naživo.

**Overenie D6b**""",
"""- **Ďalej:** `index.html` ≤ 14 600 B gzip (odhad 14 503 B, `gzip -c`; pri prekročení poradie vypúšťania z techniky),
  modul nič nevkladá pred priblížením (sonda: žiadna mutácia DOM z `navsteva.js` pred IO alebo skokom na
  `#pred-navstevou`), Lighthouse mobil ≥ 95, počítač 100 naživo.

**Overenie D6b**"""),
("""- Posun kotiev pri vložení nad oknom. Obsah sa vkladá len pod kotvu `#rezervacia` alebo pri štarte s prepočtom.
""",
"""- Posun kotiev: modul vkladá len pod kotvu `#rezervacia`; texty nad kotvami sú statické v HTML a riadok „Dnes“ má
  rezervovanú výšku.
- Rozpočet HTML: po zlúčení D5 sa zmeria znova; poradie vypúšťania je dané v technike.
"""),
("""- Tvrdenie o príchode bez objednania: vypína ho jeden príznak, ak majiteľ povie nie.
""",
"""- Tvrdenie o príchode bez objednania je skryté; zapne ho jeden príznak po odpovedi „áno“ (otázka 5).
"""),
# ---------------------------------------------------------------- D7 7.1, 7.2
("""| Typografia | 1 | Titulky na kartách sú silné. Cenník však má Fraunces `opsz 144` pri 18–26 px: „13 €“ a „15 €“ sú zameniteľné, na telefóne „Páns ky s trih“ (OC‑10). |""",
 """| Typografia | 1 | Titulky na kartách sú silné. Cenník však sádže statický rez Fraunces 800 pre `opsz 144` pri 18–26 px: „13 €“ a „15 €“ sú zameniteľné, na telefóne „Páns ky s trih“ (OC‑10). |"""),
("""Zo smeru B sa preberie len sadzba jednej citácie pri rezervácii (Fraunces 500 italic, ART_DIRECTION ju povoľuje)
a správne optické veľkosti, ktoré rieši D6a. Zo smeru C sa nepreberá nič, tabuľa ostáva len pri hodinách.
""",
"""Zo smeru B sa preberie len sadzba jednej citácie pri rezervácii (Fraunces 500 italic, ART_DIRECTION ju povoľuje)
a čitateľnejšia sadzba cenníka (veľkosť, existujúci rez, medzery, pevný stĺpec), ktorú rieši D6a bez nového písma
a bez variabilných osí (R12). Zo smeru C sa nepreberá nič, tabuľa ostáva len pri hodinách.
"""),
# ---------------------------------------------------------------- D7 7.3 E1, E2, E4
("""| E1 | **FX046** Skladanie vrstiev: „okná miestnosti“ | Hlavičky skupín cenníka (kandidáti: Strih – `naradie-noznice`; Brada a holenie – `detail-stol`; Doplnky – foto‑45 pracovné miesto; Balíčky – vyberie štúdia), riadok detského strihu (foto‑29 COPS), blok poukážok a produktov (foto‑40 recepcia, ľudia nie), karta „Kde nás nájdeš“ (foto‑37 vchod s rohožkou). Kandidátov je 7, štúdia vyberie najviac 6. Foto‑40 len výrez pultu s boxom „DARČEKOVÁ POUKÁŽKA“: bez figúrky Mickey Mouse, vizitiek so Salónom 30 a tvárou a bez TV (ten istý dôvod ako vylúčenie foto‑17 v MEDIA_SELECTION). Výber potvrdiť pohľadom na fotky (C016, súpis záberov). | Návštevník vie, kde v prevádzke je a o čom je skupina. Tmavý pás má obraz. | Okno je statické: pseudoprvok s `background-image: image-set(avif, webp)`. Obrázok sa nastaví až pri triede `is-near` na páse (IO z `app.js`, vzor D2), po stiahnutí a `decode()` cez `new Image()`; dovtedy ukazuje náhľad z `nahlady.css` (D2). Pri prerušení a návrate sa nič neanimuje. | Tá istá. | Tá istá. | Spolu ≤ 6 okien, každé ≤ 40 kB AVIF na telefóne. Len lenivo, nikdy v prvom obraze. Pomer strán rezervovaný (CLS 0). Šírka súboru ≥ šírka × DPR (do 2×; fotky 1200 px len do šírky okna 600 css px). 0 B v HTML, 0 ms JS na snímku. | `style.css`; obrázky `build_images.py` |""",
 """| E1 | **FX046** Skladanie vrstiev: „okná miestnosti“ | Hlavičky skupín cenníka (kandidáti: Strih – `naradie-noznice`; Brada a holenie – `detail-stol`; Doplnky – foto‑45 pracovné miesto; Balíčky – vyberie štúdia), položka „Deti“ v „Pred návštevou“ (foto‑29 COPS), položka poukážok a produktov tamtiež (foto‑40 recepcia, ľudia nie), karta „Kde nás nájdeš“ (foto‑37 vchod s rohožkou). Kandidátov je 7, štúdia vyberie najviac 6. Foto‑40 len výrez pultu s boxom „DARČEKOVÁ POUKÁŽKA“: bez figúrky Mickey Mouse, vizitiek so Salónom 30 a tvárou a bez TV (ten istý dôvod ako vylúčenie foto‑17 v MEDIA_SELECTION). Výber potvrdiť pohľadom na fotky (C016, súpis záberov). | Návštevník vie, kde v prevádzke je a o čom je skupina. Tmavý pás má obraz. | Okno je statický `<figure class="okno">` s `<picture>`: `<source type="image/avif" srcset="480w, 800w, 1200w">`, `<source type="image/webp" …>` a `<img src srcset sizes width height loading="lazy" decoding="async" alt="">` (R13). Prvky vytvorí `app.js` jednorazovo v nečinnosti po `load` (`requestIdleCallback`, záloha `setTimeout` 1 s) alebo pri `is-near` pásu (IO z `app.js`, vzor D2), ak nastane skôr; dve okná v „Pred návštevou“ vytvorí modul. Miesto rezervuje CSS vopred (`padding-top` hostiteľa v pomere strán okna, okno absolútne v ňom), takže vloženie nič neposunie. Stiahnutie riadi natívne `loading="lazy"`; po udalosti `load` (alebo pri `complete`) sa zavolá `img.decode()` na tom istom prvku a až po splnení dostane okno `is-ready` (jednorazový prechod `opacity` 0 → 1 za 200 ms na kompozitore). Dovtedy ukazuje náhľad z `nahlady.css` (D2) ako pozadie `figure`. Pri prerušení a návrate sa nič neanimuje. | Tá istá. | Tá istá, odhalenie bez prechodu. | Spolu ≤ 6 okien, každý súbor ≤ 40 kB AVIF (aj kandidát 1200w). Len lenivo, nikdy v prvom obraze (`vaha.mjs`: prvý obraz +0 B). Pomer strán rezervovaný CSS (CLS 0). Kandidáti 480w, 800w, 1200w so `sizes="(max-width: 800px) calc(100vw - 32px), 600px"`; prehliadač vyberie podľa DPR, 1200w je strop. 0 B v HTML (šesť `<picture>` v HTML by stálo +324 B gzip, zmerané). Vytvorenie všetkých okien naraz bez úlohy > 50 ms pri CPU 4×, 0 ms JS na snímku pri skrole. | `app.js` (vytvorenie, dekódovanie, 5 okien), modul `navsteva.js` (2 okná), `style.css` (rezervácia, odhalenie); obrázky `build_images.py` |"""),
("""`@supports (animation-timeline: view())` a `prefers-reduced-motion: no-preference`: `translateY` −3 % → +3 % na pseudoprvku, len `transform` (kompozitor). Pseudoprvok je o 6 % vyšší než okno (presah 3 % hore aj dole), aby sa pri posune nikdy neodkryl tmavý okraj. Bez podpory statické.""",
 """`@supports (animation-timeline: view())` a `prefers-reduced-motion: no-preference`: `translateY` −3 % → +3 % na `<img>` v okne (R13), len `transform` (kompozitor). `<img>` je o 6 % vyšší než okno (`height: 106%`, `object-fit: cover`, `figure` s `overflow: hidden`; presah 3 % hore aj dole), aby sa pri posune nikdy neodkryl tmavý okraj. Bez podpory statické."""),
("""| E4 | **FX053** Švih a počítadlo pásov | Lightbox (švih). Pásy tímu, galérie a recenzií (počítadlo „3 / 10“ + tlačidlá ← → na počítači a klávesnici). | Kto hľadá svojho barbera, vie, koľko kariet ostáva (N25). V galérii sa listuje prstom. | Švih cez pointer events: prah 40 px a \\|dx\\| > 1,5 × \\|dy\\|, inak natívny skrol, klik a ťah sa rozlišujú. Počítadlo sa mení podľa IntersectionObserver na kartách (nie podľa scroll). Text počítadla je `aria-hidden`, tlačidlá majú `aria-label`. | Zoznam so scroll‑snap. | Bez plynulého posunu (`scroll-behavior: auto`). | Len IO, 0 práce na snímku. Ciele dotyku ≥ 44 px. | `app.js` (pásy) |""",
 """| E4 | **FX053** Švih a počítadlo | Lightbox (švih). Len pás tímu (počítadlo „3 / 10“ + tlačidlá ← → na počítači a klávesnici). Galéria a recenzie počítadlo nedostanú: galéria má lightbox s vlastným ← → a švihom, pás recenzií je krátky. | Kto hľadá svojho barbera, vie, koľko kariet ostáva (N25). V lightboxe sa listuje prstom. | Švih cez pointer events: prah 40 px a \\|dx\\| > 1,5 × \\|dy\\|, inak natívny skrol, klik a ťah sa rozlišujú. Počítadlo sa mení podľa IntersectionObserver na 10 kartách tímu (nie podľa scroll). Text počítadla je `aria-hidden`, tlačidlá majú `aria-label` (kľúč v 7 slovníkoch). | Zoznam so scroll‑snap. | Bez plynulého posunu (`scroll-behavior: auto`). | Len IO na 10 kartách, 0 práce na snímku. Ciele dotyku ≥ 44 px. | `app.js` (pás tímu, lightbox) |"""),
# ---------------------------------------------------------------- D7 7.4
("""- `index.html` ≤ 14 600 B gzip (D7 pridá ≤ 30 B).
""",
"""- `index.html` ≤ 14 600 B gzip (D7 HTML nemení: okná aj počítadlo vytvára JS, miesto rezervuje CSS; ak štúdia
  vyžiada statický hák, najviac +30 B).
- Okná E1: vytvorenie všetkých okien v jednej nečinnej úlohe bez úlohy > 50 ms pri CPU 4×, pri skrole 0 ms JS
  (sonda LoAF a `skrol.mjs`).
"""),
# ---------------------------------------------------------------- D7 7.5
("""- **E1:**
  - najviac 6 okien, každé ≤ 40 kB AVIF,
  - pod každým náhľad, takže nikde jednofarebná tmavá plocha > 150 ms,
  - pomer strán rezervovaný (CLS 0), šírka súboru ≥ šírka × DPR (do 2×),
""",
"""- **E1:**
  - najviac 6 okien, každý súbor ≤ 40 kB AVIF,
  - každé okno je `<figure>` s `<picture>` (AVIF aj WebP `srcset`) a `<img>` s `width`, `height`, `loading="lazy"`
    a `decoding="async"`; v `index.html` nie je žiadne okno (`grep -c 'class="okno"' index.html` = 0),
  - trieda `is-ready` sa pridá až po splnení `img.decode()` toho istého prvku (sonda v Playwright: poradie udalostí);
    pri obmedzení pohybu bez prechodu,
  - pod každým náhľad, takže nikde jednofarebná tmavá plocha > 150 ms,
  - pomer strán rezervovaný CSS: pri vložení okien a pri skoku na `#sluzby` alebo `#kontakt` hneď po `load` je CLS 0
    a kotvy `app.js` aj filmu ± 1 px; prehliadač vyberie zo `srcset` kandidáta ≥ šírka × DPR (overiť `currentSrc`
    pri DPR 1, 2 a 3, strop 1200w),
"""),
("""- **E4:**
  - na 390 × 844 švih prstom (CDP dotyk) prejde na ďalšiu fotku, zvislý ťah skroluje stránku,
  - počítadlo pásu tímu ukazuje „n / 10“ správne v troch polohách,
""",
"""- **E4:**
  - na 390 × 844 švih prstom (CDP dotyk) v lightboxe prejde na ďalšiu fotku, zvislý ťah skroluje stránku,
  - počítadlo pásu tímu ukazuje „n / 10“ správne v troch polohách; galéria a recenzie počítadlo nemajú
    (v DOM je práve jedno počítadlo),
"""),
("""- Súbeh s `content-visibility` z D5 (výšky pásov): kotvy ± 1 px.

**Kapitoly skillu:** C016, C017, C024, C032, C042, C043, C055, C057, C076, C084, C087, C100.
""",
"""- Súbeh s `content-visibility` z D5 (výšky pásov): kotvy ± 1 px.
- Lenivé `<img>` v starších Safari (pred 15.4 bez `loading="lazy"`): okná sa stiahnu pri vložení po `load`
  (6 × ≤ 40 kB), stále mimo prvého obrazu.

**Kapitoly skillu:** C016, C017, C023, C024, C032, C042, C043 (obrázky: `srcset`, dekódovanie), C050 (záložné
zobrazenie bez `animation-timeline` a pri obmedzení pohybu), C055, C057, C076, C084, C087, C100.
"""),
# ---------------------------------------------------------------- 6. Texty
("""| … bez objednania | Prísť môžeš aj bez objednania. S rezerváciou máš svoj čas istý. | starý oficiálny web (živý 20. 10.), recenzia Jana U. | hneď, potvrdenie neblokuje |""",
 """| … bez objednania | Prísť môžeš aj bez objednania. S rezerváciou máš svoj čas istý. | starý oficiálny web (živý 20. 10.), recenzia Jana U.; dnešný stav nepotvrdený | skryté do odpovede na otázku 5 (kľúč pripravený, R11) |"""),
("""| Romana | Farbenie, melír, trvalú, tónovanie, prekrytie šedín a poliózu robí Romana. Rezervuješ ich v Booqme, bez platby vopred. | Booqme (oficiálne, 20. 10.; `payment-required=0`) | hneď |""",
 """| Romana | Farbenie, melír, trvalú, tónovanie, prekrytie šedín a poliózu robí Romana. Rezervuješ ich v Booqme, bez platby vopred. | Booqme (oficiálne, 20. 10.; `payment-required=0`) | hneď; dni a ceny až po otázke 14 |
| Cenník: skoky | Skupiny cenníka (`aria-label`); Strih · Brada a holenie · Balíčky · Doplnky sú existujúce kľúče | – | hneď (v HTML) |
| Cenník: odkaz | Ako prebieha rezervácia → | – | hneď (v HTML) |
| Pred návštevou: nadpis | Pred návštevou | – | hneď |
| Tím: tlačidlá | Predchádzajúci barber · Ďalší barber (`aria-label`) | – | D7 |"""),
# ---------------------------------------------------------------- 7. Otázky
("""5. Platí stále „aj keď prídeš bez objednania“ zo starého webu? (potvrdenie D6b, riadok v úvode)
""",
"""5. Platí stále „aj keď prídeš bez objednania“ zo starého webu? (zapne pripravenú skrytú vetu „Prísť môžeš aj bez
   objednania“ v „Pred návštevou“; dovtedy sa na webe neukáže)
"""),
("""15. Vernostná kartička: odkedy ju chcete ponúkať zákazníkom (treba spustiť systém kartičiek na serveri headspa30.sk
    a nastaviť heslo pre recepciu) a aké budú odmeny a body? (odkaz v pätičke, veta pri rezervácii)
""",
"""15. Vernostná kartička: odkedy ju chcete ponúkať zákazníkom (treba spustiť systém kartičiek na serveri headspa30.sk
    a nastaviť heslo pre recepciu) a aké budú odmeny a body? Vyberte jednu z dvoch možností (R15): **A** odkaz
    v pätičke ostane skrytý, kým systém nebeží; **B** systém spustíme a odkaz povedie na prihlášku priamo v Barbershope
    (bez servera sa prihláška nedá odoslať, preto B len so spusteným systémom). (odkaz v pätičke, veta pri rezervácii)
"""),
("""24. Vektorové logo „30 Barbershop Holičstvo“ (SVG alebo PDF)? Ikona sa dovtedy vyrobí z existujúceho favicon.svg.
    (ikony, prípadný znak)
""",
"""24. Vektorové logo „30 Barbershop Holičstvo“ (SVG alebo PDF)? Ikony na plochu sa dovtedy vyrobia rastrom z existujúceho
    favicon.svg, bez dokresľovania (R14). (ikony, prípadný znak)
"""),
# ---------------------------------------------------------------- 8. Čo nerobiť
("""- Nepoužívať `backdrop-filter` na mobile a nepridávať nové písma. Nedokresľovať logo „30“ (vektor nemáme).
""",
"""- Nepoužívať `backdrop-filter` na mobile a nepridávať nové písma. Nedokresľovať logo „30“ (vektor nemáme) ani ho
  neprevádzať na krivky; ikony sú raster z `favicon.svg` (R14).
- Neukazovať „Prísť môžeš aj bez objednania“ ani iný nepotvrdený údaj (platba, storno, pripomienky, hodnota a platnosť
  poukážok, dni a ceny Romany, hodnotenie číslom) pred odpoveďou majiteľa; sú pripravené skryté (R11).
- Nemeniť `fonts.css` ani `assets/fonts/`: žiadny nový rez, žiadne variabilné osi (R12). Nedávať okná E1 ako `<picture>`
  do HTML (rozpočet) ani ako pseudoprvok s `background-image` (R13).
- Nevkladať skriptom „pri štarte“ text nad kotvy filmu; čo musí byť v prvom okne, je v HTML (R2).
"""),
# ---------------------------------------------------------------- 9. odhad
("""| D7 | po D6b | D2 (náhľady), D5 (pásy, content‑visibility) | 10 / 16 / 24 h | štúdie troch smerov, výber fotiek, brány výkonu, lightbox |""",
 """| D7 | po D6b | D2 (náhľady), D5 (pásy, content‑visibility) | 10 / 16 / 24 h | štúdie troch smerov, výber fotiek, brány výkonu, lightbox, okná ako `<picture>` z JS s rezerváciou v CSS |"""),
# ---------------------------------------------------------------- 10. dôkazy
("""- Strojová podoba dávok D6a–D7 pre workflow opráv: `$SP/barber/chyba/navrh/davky-d6-d7.json`.
""",
"""- Strojová podoba dávok D6a–D7 pre workflow opráv: `$SP/barber/chyba/navrh/davky-d6-d7.json`; zhoda s týmto textom:
  `$SP/barber/chyba/navrh/zhoda.py` → `zhoda.txt`.
- Rozpočet HTML (meranie každého vloženia na kópii `index.html`): `$SP/barber/chyba/navrh/rozpocet/rozpocet.txt`.
- Písmo (fonts.css, tabuľky rezov, šírky číslic): `$SP/barber/chyba/navrh/rozpocet/pismo.txt`.
"""),
# ---------------------------------------------------------------- 11. recenzia
("""Sporné body (rozhodnutie pred implementáciou) sú vo výstupe recenzie, nie v tomto pláne. Strojová podoba
`chyba/navrh/davky-d6-d7.json` a `chyba/fakty/FAKTY.md` (platba kartou u Romany) sa musia zosúladiť s týmto textom.
""",
"""Sporné body (rozhodnutie pred implementáciou) sú vo výstupe recenzie, nie v tomto pláne. `chyba/fakty/FAKTY.md`
(platba kartou u Romany) sa musí zosúladiť s týmto textom.

### 11.1 Druhé kolo (skeptik, 20. 10. 2026): zapracované rozhodnutia hlavného agenta

1. **N07 (vysoká):** v repozitári je len statický rez Fraunces `opsz 144` bez osí a bez `tnum`; oprava je bez nového
   písma a bez variabilných osí (R12, D6a bod 5, rubrika typografie v D7).
2. **Nepotvrdené údaje (stredná):** veta „Prísť môžeš aj bez objednania“ a všetky nepotvrdené údaje sú pripravené
   skryté a zapnú sa po odpovedi (R11, D6b body 7 a 17, časť 6).
3. **D6b technika (stredná):** texty prvého okna sú priamo v HTML so zmeraným rozpočtom (+152 B, rezerva asi 97 B,
   poradie vypúšťania), modul `navsteva.js` rieši len „Pred návštevou“ a načíta sa lenivo (R2).
4. **E1 (stredná):** `<img>` v `<picture>` so `srcset` AVIF a WebP, `loading="lazy"`, `decoding="async"`,
   `width`/`height`, `img.decode()` na tom istom prvku; prvky vytvára JS, miesto rezervuje CSS (R13).
5. **Strojová podoba:** `davky-d6-d7.json` vygenerovaná nanovo z tohto textu; `zhoda.py` overuje, že každý N‑bod
   plánu je v JSON a naopak (`zhoda.txt`).
6. **Nízke:** počítadlo E4 len pri páse tímu; odpovede 1–2 vety, `<details>` len pri objednaní a parkovaní; ikony
   rastrom z `favicon.svg` bez kriviek (R14); vernostná kartička s dvoma možnosťami, vyberie majiteľ (R15, otázka 15).

Verzia pred týmto kolom: `chyba/navrh/PLAN-D6-D7.pred-skeptikom-2.md`; úpravy: `chyba/navrh/skripty/zapracuj-skeptika.py`.
"""),
]

chyby = []
for i, (stare, nove) in enumerate(opravy, 1):
    n = t.count(stare)
    if n != 1:
        chyby.append(f'oprava {i}: starý text sa vyskytuje {n}× (má byť 1×): {stare[:90]!r}')
if chyby:
    print('\n'.join(chyby)); sys.exit(1)
for stare, nove in opravy:
    t = t.replace(stare, nove, 1)
cesta.write_text(t, encoding='utf-8')
print(f'OK: {len(opravy)} úprav zapísaných do {cesta}; záloha {zaloha}')
