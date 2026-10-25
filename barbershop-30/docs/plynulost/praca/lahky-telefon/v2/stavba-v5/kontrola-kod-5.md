# V5 etapa 1 – Recepcia: kontrola kódu 5 (25. 10. 2026, 11:15–11:50 UTC)

Kontrolór: nezávislý senior. V strome `hs-recepcia` som nič nemenil: `git status --short` dal 0 riadkov pred kontrolou aj po nej.

- Strom: `$SP/hs-recepcia`, vetva `barbershop-recepcia`, HEAD **854e849** (oprava 6).
  - `$SP` = `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad`, `$S5` = `$SP/barber/lahky-telefon/v2/stavba-v5`.
- Diffy:
  - `6f8c47c..HEAD`: 10 commitov, 13 súborov, +1 324 −751;
  - `f624ee8..HEAD`: 22 súborov, +2 104 −7.
- Moje súbory sú v `$S5/k5/` (zoznam na konci). Kópia stromu na mutáciu (`k5/mut/`) má 200 kB, kópia na generátor JSON (`k5/gen/`) 330 kB.
- Prehliadač: jeden, Chromium z `/opt/pw-browsers`, port 8741 (title som overil curlom), beh trval asi 40 s.
  - Server aj prehliadač som po behu ukončil, `curl 127.0.0.1:8741` vracia 000.
  - Súbežne bežal prehliadač iného tímu (8 procesov, load 15–19), preto sú všetky časy **orientačné**.

## Verdikt: NEPRIJATÉ (ale princíp funguje)

**Zmena princípu (P1–P6) zabrala.** Pustil som vlastný generátor so 453 173 otázkami v 8 jazykoch. Triedy kontroly 4 a skeptika
v ňom majú **0** skutočných chýb:
- V1 služba + vec bez ceny,
- V2 trvanie + položka bez trvania,
- V3 príslovka „dlho/dugo“,
- V4 príplatok za deň,
- V5 šediny,
- S1 odfarbenie.

Ďalej platí:
- **P3:** 12 190 holých cien, všetky vo výreze cenníka.
- **P4:** 6 838 holých trvaní, všetky sú price-time menovanej služby.
- Bezpečnosť, váha, testy, JSON = generátor, i18n aj „žiadna zmienka o AI“ sú v poriadku.

**Ostávajú však 4 vážne triedy holých odpovedí, ktoré nevysvetlia všetky menované veci (cieľ P6 = 0):**

| # | trieda | príklad (HEAD 854e849) | holých v mojom generátore | jazyky |
|---|---|---|---|---|
| V1 | zámeno inej osoby je výplň | sk „Koľko stojí strih pre ňu?“ → **Pánsky strih 18 €**; de „Was kostet ein Haarschnitt für ihn und für mich?“ → **18 €** | 68 (žena) + 262 (dve osoby) | sk, cs, de, en, pl, sr, uk |
| V2 | zložené slovo inej služby | de „Was kostet ein Herrenhaarschnitt und ein Kinderhaarschnitt?“ → **18 €**; „Bartpflege und Hautpflege?“ → **15 €** | 111 | de, hu, sk, cs |
| V3 | „do/pod/bis/up to 10 cm“ | sk „Koľko stojí strih do 10 cm?“ → **22 € (nad 10 cm)** | 26 + 12 sond | sk, cs, en, de, pl, sr, uk |
| V4 | kmeň „Oboc“ zachytí „oboch“ (P5) | sk „Koľko za oboch?“ → **Úprava obočia 3 €, Farbenie obočia 5 €** | 1 sonda | sk |

Všetky štyri majú spoločnú príčinu: P1 počíta za výplň viac, než vymenúva. Ide o krátke slová, zámená 3. osoby,
predložky pred číslom a začiatok zloženého slova. Oprava je v troch miestach kódu a v zoznamoch `stop` (nižšie).

Testy staviteľa tieto triedy nevidia z dvoch dôvodov:
- orákulum v teste prehliada trvanie v 5 jazykoch (S1, dokázané mutáciou);
- orákulum preberá z modulu funkciu `zhoda` (S2).

---

## 1. Čo prešlo (s dôkazom)

| oblasť | výsledok | dôkaz |
|---|---|---|
| testy | `recepcia-test.mjs` **23/23** (4,2 s); `recepcia-kombinacie-test.mjs` **10/10** (15,6 s) | `node --test source/tools/…` v `barbershop-30/`. Počty: P6a 11 198, P6b 3 058, P6c 2 182, P6d 1 189, P6e 179, P6f 4 432, P6g 288 otázok, lint 120 dvojíc, P3 112 výrezov |
| JSON = generátor | **8× zhodné** | kópia `assets/recepcia` + `assets/i18n` do `k5/gen/` → `python3 -I jazyky-gen.py k5/gen` → `cmp` sk en uk hu sr pl de cs: všetky „zhodné“ |
| váha po ťuknutí (súbory zvlášť, ako ich server pošle) | sk **12 206 B** (Node zlib 6) / 12 156 B (`gzip -n -6`) ≤ 12 288. Najťažší uk **13 256** / 13 178 ≤ 13 312. Ostatné jazyky: en 12 049, sr 12 143, de 12 217, cs 12 461, hu 12 442, pl 12 585 | `zlib.gzipSync` po súboroch: recepcia.js 5 495 (gzip -9), recepcia.css 1 032, JSON jazyka |
| prvé okno proti f624ee8 | app.js +297 B, style.css +192/+194 B = **+489 až +492 B** ≤ 500 B | `gzip -n -6/-9` a Node. Pozor: `gzip -c súbor` bez `-n` pridá do hlavičky názov súboru (+7 a +10 B) a ukáže +506/+508 – to je chyba merania, nie prekročenie |
| index.html | **0 B** zmien | `git diff f624ee8..HEAD -- index.html \| wc -c` → 0 |
| bezpečnosť – DOM | `innerHTML` len pri statickej kostre `KOSTRA` (`recepcia.js:175`) a statickom SVG tlačidla (app.js 7d). Text návštevníka ide len cez `el()` → `textContent` (`recepcia.js:106`, `:138`) | grep `innerHTML\|outerHTML\|insertAdjacentHTML\|document.write\|eval(\|new Function` → len tieto dva výskyty. Prehliadač: vstup `<img src=x onerror=alert(1)>` → 0 prvkov `img`, 0 dialógov, text sa zobrazí ako text (`k5/prehliadac-k5-telefon.png`) |
| bezpečnosť – sieť | jediný `fetch` je `recepcia/<jazyk>.json` (biely zoznam, `recepcia.js:107`). `import('./recepcia.js')` sa volá až po ťuknutí (app.js 7d) | prehliadač (`k5/prehliadac-k5.json`): pred ťuknutím 0 žiadostí na recepciu, po ťuknutí `recepcia.js`, `recepcia.css`, `recepcia/sk.json`. Ostatné žiadosti po ťuknutí sú vlastné súbory stránky (atmosfera.js a hudba pri prvom kliknutí, i18n.js, film). Cudzia adresa žiadna |
| bezpečnosť – úložisko | 0× `setItem`, 0× zápis `document.cookie` počas celej relácie s panelom | sledovanie `Storage.prototype.setItem` a setter `document.cookie` v init skripte; grep `localStorage\|sessionStorage\|indexedDB\|cookie` v module → 0 |
| prístupnosť | `showModal`, pri otvorení fokus na prvej voľbe (`rc-chip`) a `scrollLeft` 0, Esc zavrie, fokus sa vráti na `recepcia-btn`. `body.overflow` je pri otvorenom paneli `hidden`, po zatvorení sa obnoví | `k5/prehliadac-k5.json` (`otvorene`, `zatvorene`) |
| i18n | v každom zo 7 slovníkov pribudol len kľúč „Spýtaj sa recepcie“ (cs „Zeptej se recepce“, de „Frag den Empfang“, en „Ask the front desk“, hu, pl, sr, uk). Žiadny kľúč nezmizol, žiadna hodnota sa nezmenila | porovnanie JSON proti `git show f624ee8:…` |
| žiadna zmienka o AI | v module, CSS, 8 JSON, testoch ani app.js nie je AI, umelá inteligencia, chatbot ani asistent (hu „Ki“ a pl „dzięki“ sú falošné zásahy grepu). Správy commitov sú bez podpisu. Jediný výskyt je názov súboru návrhu `asistent.md` v c7ffb2f (odkaz, nie označenie) | grep cez súbory a `git log --format=%B f624ee8..HEAD`. Pole autora commitov je nastavenie celého repozitára (rovnaké pri 248 commitoch histórie), nie súčasť tejto vetvy |
| ZÁSADY v2 zapísané | `ZASADY-ZHODY.md` má P1–P6 podľa zadania, časť „Oprava 6“ a „Čo pravidlá zámerne nerobia“ (k tejto časti pozri V3) | čítanie súboru |
| triedy kontroly 4 a skeptika | `node k4/trieda-k4.mjs` → **A 0, B 0**. Skeptik (`otazky.txt` + `otazky2.txt`, 78 otázok) → 11 holých odpovedí, všetkých 11 sedí so stránkou (strih 18 €, brada 15 €, hlava 25 min/13 €, Hot Towel 15 €, brada 20 min, Szakállfestés 10 €) | `k5/skeptik1-k5.txt`, `k5/skeptik2-k5.txt` |
| P3 výrez | 12 190 holých cien z môjho generátora: **0 bez výrezu** so zvýrazneným riadkom. Každá položka s cenou v 8 jazykoch má výrez aj akciu Celý cenník | `k5/trieda-k5-vystup.txt` (časť P3) a kontrola dát v Node. Výnimka `ceny-konecne` je v D2 |
| P4 trvanie | 6 838 holých trvaní: **0 rozporov** s price-time služby. Položka `trvanie` = price-time strihu a brady v 8 jazykoch | to isté (časť P4) |
| čas zhody (orientačne, load 15–19) | 467 265 otázok, jeden beh: p99 1,95 ms. Výkyvy z jedného behu (najviac 168 ms) som premeral: 40 najpomalších otázok, medián zo 7 behov, **max 2,28 ms**, 0 nad 5 ms. Vstupy s 200 znakmi 0,07–0,79 ms | `node k5/cas-k5.mjs <strom>` (2 behy, rovnaký výsledok) |
| nezávislé slepé hodnotenie (nie moje meranie) | `slepe/hodnotenie-v2-2.md` na 854e849: 1 736 otázok, CHYBA 0, odovzdanie navyše 8,48 % (cieľ ≤ 15 %) | citované, neoverené |

## 2. Vlastný generátor tried (`k5/trieda-k5.mjs`)

**Nezávislosť.** Otázky sa skladajú z vložených častí so známym pôvodom: položka JSON alebo moje zoznamy slov v 8 jazykoch.

Orákulum:
- nepoužíva `stop`, `vypln`, `zdvor` ani `zhoda` z modulu;
- „vysvetlí“ = kmeň od začiatku slova (kmeň do 3 znakov len s koncovkou ≤ 3), `=slovo` presne, alebo slovo názvu či otázky víťaznej položky;
- holá odpoveď je `odpoved` s € alebo s trvaním (min/perc/хв/Min. aj s nedeliteľnou medzerou);
- pri trvaní musí vložené veci vysvetliť služba. Východiskové trvanie strihu a brady pri menovanej veci je chyba.

| trieda | čo skladá | otázok | holých | po zaradení |
|---|---|---|---|---|
| K1 | služba s cenou (názov aj silné slovo) × **každé** slovo každej inej položky (kmene, slová otázok, názvy), 3 šablóny | 358 939 | 12 249 | V2 111; zvyšok falošné poplachy |
| K2 | trvanie × každé slovo každej položky; trvanie + služba + slovo inej položky | 70 679 | 3 703 | 0 (V2 trvanie je v čísle V2) |
| K3 | „koľko dlho / jak długo / koliko dugo / meddig …“ × čakanie × položka; cena + príslovka | 8 689 | 1 967 | **0** |
| K4 | príplatok (moje slová) × deň, časť dňa, sviatok, služba | 835 | 12 | **0** |
| K5 | šediny, odfarbenie, melír, trvalá, tónovanie, blond × brada, fúzy, obočie, hlava | 1 097 | 24 | **0** (sk „prefarbenie brady“ → farbenie brady je správne) |
| K6 | moje skloňované dni („v stredu“, „w środę“, „szerdán“ …), zajtra, časti dňa, `9:30`, `17 h`, `5 pm`, `17 Uhr` × služba, cena aj trvanie | 6 174 | 294 | **0**, okrem holého čísla „um 9“ (D1) |
| K7 | osoby (syn, dcéra, manželka, brat, kamarát, malý, „pre ňu“, „for her“, „für uns“ …) × 5 služieb, sám aj „a pre mňa“ | 3 960 | 435 | **V1 330** |
| K8 | dĺžka („do/pod 10 cm“ …), počet („2x“, „dva“, „két“ …), zápor × služba | 2 800 | 344 | V3 26, S3 228 |
| K9 | slovník stránky (i18n, 13 000+ slov) × 4 služby: ktoré slovo modul zahodí a predsa dá holú cenu | 14 092 | 689 | zaradenie podľa JSON (pozri V1, V3, D3) |

Zaradenie 7 871 nálezov orákula (`python3 -I k5/zarad-k5.py k5/trieda-k5-vystup.txt` → `k5/zarad-k5-vystup.txt`, 0 nezaradených):
- 7 027 falošných poplachov:
  - funkčné alebo cenové slovo mimo môjho zoznamu (cs „kolika, ceník, komu“, de „ihr, euch, Preise“, sr „kako, cenovnik“ …),
  - alebo sémanticky správny víťaz (pl „ogolicie“ → holenie, de „teuerstes“ …);
- 71 nezmyselných šablón so záporom. Realistické vety („Koľko stojí úprava brady, nie strih?“, „beard trim without the haircut“, „nur Bart ohne Haarschnitt“) dávajú „Myslíš toto?“;
- 36 zámen muža („for him“ → 18 €). P1 ich výslovne radí do výplne, preto to nerátam ako chybu;
- **skutočné:** V1 330, V2 111, V3 26, S3 228, D1 42.

## 3. Nálezy

### V1 – VÁŽNA: zámeno inej osoby je výplň → cena pánskej služby pre ženu, jedna cena pre dve osoby

Sondy (`k5/sondy-k5-vystup.txt`, `k5/sondy-k5b-vystup.txt`) a prehliadač (`k5/prehliadac-k5.json`):

| otázka | odpoveď na HEAD |
|---|---|
| sk „Koľko stojí strih pre ňu?“, „Koľko stojí jej strih?“ | výrez **▶ Pánsky strih 40 min 18 €** (overené aj v paneli) |
| cs „Kolik stojí střih pro ni?“; de „Was kostet ein Haarschnitt für sie?“, „Was kostet ihr Haarschnitt?“; en „How much is a haircut for her?“, „her haircut“; pl „Ile kosztuje jej strzyżenie?“ | **18 €** (pánsky strih) |
| sk „Koľko stojí strih pre ňu a pre mňa?“, „pre nás a pre mňa“; cs „pro ni a pro mě“ | **18 €** |
| de „Was kostet ein Haarschnitt für ihn und für mich?“; en „for him and me“, „for all of us“; pl „dla nas“; sr „za nas“; uk „для нас“ | **18 €** |
| pre porovnanie: sk „pre brata a pre mňa“, en „for my brother and me“, sr „za njega i za mene“, pl „dla niego i dla mnie“, hu „neki és nekem“ | „Myslíš toto?“ (správne) |

- Odpoveď hovorí o žene cenu pánskeho strihu. Stránka dámske strihy neuvádza, správna odpoveď je téma `damske`.
- Pri dvoch osobách ide o tú istú triedu ako D z hodnotenia v2-1 („pre syna a pre mňa“), ktorú hodnotenie rátalo ako CHYBA a oprava 6 vyriešila **len pre položku deti** (`ine`).
- Generátor: 68 (žena) + 262 (dve osoby) holých odpovedí v sk, cs, de, en, pl, sr, uk; hu 0.
- **Príčina:**
  - `recepcia.js:82` `vol`: každé neznáme slovo kratšie ako 3 znaky je voľné. To platí pre „ňu“ → `nu`, „ni“, „ně“ → `ne`, „2x“ (aj S3);
  - zámená 3. osoby a „my“ sú v `stop`: sk `jej ich` (`sk.json:3`), en `her she us all` + zdvorilé `hi` ⊃ „him, his“ (`en.json:3`, `:6`), de `sie ihr ihn ihm uns` (`de.json:3`), pl `jej ich nas`;
  - `ine` má len položka deti (`recepcia.js:62`, `sk.json:46`). P6g testuje len deti.
- **Návrh:**
  - krátke neznáme slovo nemá byť voľné. Voľné nech je len slovo zo zoznamov jazyka, kde sa dá skontrolovať;
  - zámená 3. osoby a „my/nás“ po predložke príjemcu (pre, pro, für, for, dla, za, для) sú „iná osoba“. Pri službe s cenou zakážu priamu odpoveď a dajú „Myslíš toto?“ (ženské zámeno môže viesť na tému `damske`);
  - pozor na de „Sie“ (vykanie), preto len po predložke;
  - `ine` zo služby deti zovšeobecniť na všetky služby s cenou;
  - test P6h: osoba-zámeno × každá služba s cenou × 8 jazykov.

### V2 – VÁŽNA: zložené slovo, ktorého začiatok patrí inej službe → holá cena jednej služby

| otázka | odpoveď na HEAD | čo otázka menuje |
|---|---|---|
| de „Was kostet ein Herrenhaarschnitt und ein Kinderhaarschnitt?“ | **Herrenhaarschnitt 18 €** | pánsky a detský strih (15 €) |
| de „Was kostet Bartpflege und Hautpflege?“, „Hautpflege und Bartpflege?“ | **Bartpflege 15 €** | brada a pleť (21,50 €) |
| de „Was kostet Kopfrasur und Nassrasur?“ | **Kopfrasur 13 €** | hlava a holenie (15 €) |
| hu „Mennyibe kerül a borotválás és a fejborotválás?“ | **Fejborotválás 13 €** | holenie a hlava |
| sk „Koľko stojí strih a zastrihnutie?“ | **Pánsky strih 18 €** | strih a zastrihnutie (kmeň `Zastrih` brady) |

- Generátor: 111 holých odpovedí (de 44, sk 25, cs 25, hu 17).
- **Príčina:** `recepcia.js:23` `vysvetli` pripustí dlhý kmeň vnútri slova, ak „začiatok slova nepatrí inému kmeňu, ktorý končí **uprostred**
  tohto kmeňa“ (`i < j.length && j.length < i + k.length`). Dve medzery:
  - kmeň inej položky končí **presne na konci** vnútorného kmeňa. Podmienka `<` namiesto `<=` (`fejborotv` ⊃ `borotv`, `zastrih` ⊃ `strih`);
  - kmeň inej položky končí **pred začiatkom** vnútorného kmeňa. Je to prvá časť zloženého slova, napr. `kinder|haarschnitt`, `haut|pflege`, `nass|rasur`.
    Delenie zloženého slova (`recepcia.js:74–76`) sa nespustí, lebo položka deti má slabý kmeň `haarschnitt` a obe časti „vysvetlí“.
- **Návrh:**
  - vnútorná zhoda platí, len ak `w.slice(0, i)` nezačína (`pred`) kmeňom inej položky;
  - v podmienke prekrytia `<=`;
  - test P6j: prvá časť z kmeňa položky B + hlava zo služby A → nikdy holá cena A ani B.

### V3 – VÁŽNA: „do / pod / bis / up to 10 cm“ → cena dlhých vlasov 22 €

- `k5/dlzka-k5.mjs`: 12 z 84 sond v 7 jazykoch, hu 0:
  - sk a cs „strih do 10 cm“, „pod 10 cm“; en „haircut up to 10 cm“; de „Haarschnitt bis 10 cm“; pl, sr „do/pod 10 cm“; uk „до/під 10 см“ → **22 €**;
  - generátor: 26 holých odpovedí.
- V paneli (`k5/prehliadac-k5.json`, „Koľko stojí strih do 10 cm?“) je zvýraznený riadok
  **▶ Pánsky strih – dĺžka vlasov nad 10 cm 60 min 22 €** a susedia 28 € a 15 €. Riadok so správnymi 18 € vo výreze **nie je**.
- **Príčina:**
  - `=10! =Cm` sú silné presné kmene cena-dlhe (`sk.json:45` a obdoby);
  - „do, pod, nad“ (sk, cs, pl, sr), „під, над, до“ (uk), „bis“ (de) sú stop-slová. „up“ v en nie je kmeň a dá sa vypustiť ako krátke slovo (`vol`).
  - ZÁSADY v2 to majú v „Čo pravidlá zámerne nerobia“ („Nerozlišujú 10 cm, do 10 cm a nad 10 cm“). P1 však predložky medzi výplň neráta a zásada majiteľa
    („radšej nevedieť ako odpovedať zle“) ide proti tejto výnimke.
- **Návrh:**
  - číslo s „cm“ vysvetlí cena-dlhe, len keď ho nepredchádza „do/pod/bis/up to/under/alatt/ispod/до/під/менше“. Inak dať „Myslíš toto?“ [Pánsky strih, nad 10 cm];
  - výnimku zo ZÁSAD vypustiť;
  - test P6i: smer dĺžky × 8 jazykov.

### V4 – VÁŽNA (P5): „Koľko za oboch?“ → obočie 3 € a 5 €

- sk „Koľko za oboch?“ → výrez Doplnky so zvýraznenými riadkami **Úprava obočia 3 €** a **Farbenie obočia 5 €** (overené v paneli).
  „Koľko stojí strih pre oboch?“ dá „Myslíš toto?“ [strih, obočie, …].
- **Príčina:** silný kmeň `Oboc` položky obocie (`sk.json:52`) zachytí „oboch“. Ide o nález D4 z kontroly 4, teraz s holou cenou.
  Vlastný lint (`k5/lint-k5-vystup.txt`) iné zachytenie slova iného významu silným kmeňom služby s cenou nenašiel. Ostatné zachytenia sú zámerne slabé kmene
  (príplatok pri dlhých vlasoch, šediny pri farbení brady) alebo en `Long`, de `Lang` v jednej z dvoch skupín.
- **Návrh:** `=Obocie =Obocia =Oboci =Obocim` (alebo `Oboci`). Do lintu P5 pridať zoznam bežných slov iného významu (oboch, oba, oboje …).

### S1 – STREDNÁ (test): orákulum testu nevidí trvanie v en, hu, sr, pl, cs

- `recepcia-kombinacie-test.mjs:48` `cenaText = /€|\d (min|хв|perc|Min)/` čaká obyčajnú medzeru.
- Trvania v en, hu, sr, pl, cs majú nedeliteľnú medzeru („40 min“, „40 perc“), takže `hola()` ich nikdy neoznačí.
- Testy P6a, P6c, P6e a P6f (časť `FRAZA.cas`) sú preto pri trvaní slepé v 5 z 8 jazykov.
  Napríklad riadok P6e `en|How long is a beard trim?|trvanie:cena-brada` sa nikdy nekontroluje.
- **Dôkaz mutáciou** (`k5/mut/`, jedna zmena v `recepcia.js:87`: pri trvaní zahodiť slová položky hodiny; `node k5/p6f-medzera.mjs k5/mut/barbershop-30`):

| jazyk | sk | de | uk | en | hu | sr | pl | cs |
|---|---|---|---|---|---|---|---|---|
| skutočné holé trvanie s dňom | 98 | 98 | 84 | 98 | 98 | 98 | 98 | 98 |
| vidí `hola()` testu | 98 | 98 | 84 | **0** | **0** | **0** | **0** | **0** |

- Na HEAD je skutočných chýb 0 (kontroluje to môj generátor K6). Test by však tú istú regresiu v 5 jazykoch nezachytil.
- **Návrh:** `/\d[\s ]?(min|хв|perc|Min)/` alebo holé trvanie spoznať podľa `r.id === T.id`.

### S2 – STREDNÁ (test): orákulum P6 nie je nezávislé od modulu a chýbajú mu triedy V1–V4

- Test importuje `zhoda` z modulu (`recepcia-kombinacie-test.mjs:34`) a jeho `vysvetli` (`:60`) berie `zhoda ≥ 0,9`, teda aj **vnútornú** zhodu
  dlhého kmeňa. Rovnako tolerantný je aj modul, preto test V2 (Kinder|haarschnitt) nevidí ani v princípe.
- P6g testuje druhú osobu len s položkou deti. Zámená 3. osoby, smer dĺžky ani zložené slová P6 neskladá.
- **Návrh:** vlastné prísne „vysvetlí“ (predpona, `=`, názov) a triedy P6h, P6i, P6j podľa V1–V3. Môj `k5/trieda-k5.mjs` slúži ako vzor
  (zoznamy slov sú v ňom, nie v JSON).

### S3 – STREDNÁ: počet → jednotková cena bez voľby

- sk „Koľko stojí 2x pánsky strih?“ a hu „Mennyibe kerül két hajvágás?“ → **18 €**.
- Generátor: 228 v 8 jazykoch („2x“ všade, hu `ket` je stop-slovo, en „all of us“).
- Výrez ukazuje cenu za kus, takže to nie je nepravda. Je to však tá istá logika ako „dve osoby“ (V1) a otázku na súčet
  odpoveď nevysvetlí. „dva/two/zwei/dwa/два strihy“ dávajú „Myslíš toto?“.
- **Príčina:** `recepcia.js:82` (krátke slovo „2x“ je voľné), hu `ket`, en `all` v `stop`.
- **Návrh:** opraví sa spolu s V1 (krátke slovo nie je voľné), hu `ket` a en `all` vyradiť zo `stop`.

### DROBNÉ

- **D1 – holé číslo bez minút** (`recepcia.js:72`): „Koľko stojí strih o 9?“, „at 9“, „um 9“ → 18 € (generátor: 42 pri de, kde orákulum zachytilo „um“).
  Staviteľ to má vedome v ZÁSADÁCH (číslo môže byť vek alebo cm). Cena sa časom nemení, takže nejde o nepravdu.
- **D2 – P3, výnimka `ceny-konecne`:** veta „Pánsky strih 18 €, s úpravou brady 28 €. Ceny sú konečné.“ sa vo všetkých 8 jazykoch ukáže bez výrezu
  (doslovne `index.html:506`, akcia Celý cenník je pri nej). P3 hovorí „vždy výrez“. Návrh: pridať výrez dvoch riadkov skupiny Strih.
- **D3 – krátke výplňové predpony zachytia slová iného významu** (`k5/lint-k5-vystup.txt`):
  - zdvorilé `ok` ⊃ „oko“ (sk, cs, pl, sr, uk), en `hi` ⊃ „him, his“;
  - hu cenové `ara` ⊃ „arany“ (zlato), sr `dan` ⊃ „dana“, cs `kdy` ⊃ „když“;
  - holú chybnú cenu z toho som okrem V1 nenašiel. Návrh: krátke položky zoznamov zapisovať ako `=slovo`.
- **D4 – rezerva váhy je malá:** sk 82 B, uk 56 B (Node), prvé okno 8 B. Opravy V1–V3 sú v kóde, takže ich treba písať úsporne (podmienka, nie nové kmene).
  Pri meraní cez `gzip` používať `-n`.
- **D5 – vzhľad V2 z `kontrola-vzhlad-v5.md` trvá:** po zmene jazyka ostanú staré bubliny v pôvodnom jazyku. `texty()` (`recepcia.js:152–158`) log nevyprázdni.
  Nie je to kódová chyba zhody, len pripomienka.

## 4. Zhrnutie pre staviteľa

1. Princíp P1–P6 drží. Triedy kontroly 4 a skeptika sú v 8 jazykoch nulové. **Nezáplatovať vety.** Štyri nové triedy majú jednu
   príčinu: výplň je širšia, než P1 dovoľuje.
2. Kód:
   - `recepcia.js:82` krátke neznáme slovo nie je voľné (V1, S3);
   - `recepcia.js:23` vnútorný kmeň neplatí, keď začiatok slova patrí inej položke, a v prekrytí `<=` (V2);
   - `recepcia.js:62` `ine`/„iná osoba“ pre všetky služby s cenou (V1);
   - číslo s cm po „do/pod/bis/up to …“ cena-dlhe nevysvetlí (V3).
3. Dáta (`jazyky_data.py`, sk ručne):
   - zámená 3. osoby a „my“ zo `stop` preč, alebo ich viazať na predložku príjemcu (V1);
   - hu `ket`, en `all` zo `stop` preč (S3);
   - `Oboc` → presné tvary (V4);
   - krátke predpony v zoznamoch zapisovať ako `=slovo` (D3);
   - výnimku o „do 10 cm“ zo ZÁSAD vypustiť.
4. Testy:
   - opraviť `cenaText` (S1);
   - orákulum bez `zhoda` z modulu (S2);
   - doplniť P6h (osoba-zámeno), P6i (smer dĺžky), P6j (zložené slovo inej služby).
5. Overenie po oprave:
   - `node $S5/k5/trieda-k5.mjs <strom>/barbershop-30 výstup.txt` (asi 4,5 min) a `python3 -I $S5/k5/zarad-k5.py výstup.txt`.
     Cieľ: V1a, V1b, V2, V3 = 0. S3 a D1 sú rozhodnutie;
   - `node $S5/k1-skusaj.mjs <strom>/barbershop-30 < $S5/k5/sondy-k5.txt` a `… < sondy-k5b.txt`;
   - `node $S5/k5/dlzka-k5.mjs <strom>/barbershop-30`;
   - `node $S5/k5/p6f-medzera.mjs` na mutovanej kópii: po oprave S1 musí test vidieť všetkých 8 jazykov.

## Súbory v `$S5/k5/`

- **Generátor a zaradenie:** `trieda-k5.mjs` (generátor tried K1–K9 s vlastným orákulom), `trieda-k5-vystup.txt` (1,1 MB, všetky nálezy),
  `zarad-k5.py` + `zarad-k5-vystup.txt` (zaradenie), `najpomalsie.json`.
- **Lint, čas, dĺžka:** `lint-k5.mjs` + `lint-k5-vystup.txt` (P5), `cas-k5.mjs` (čas), `dlzka-k5.mjs` (V3).
- **Sondy:** `sonda.txt`, `sondy-k5.txt` + `sondy-k5-vystup.txt`, `sondy-k5b.txt` + `sondy-k5b-vystup.txt`, `skeptik1-k5.txt`, `skeptik2-k5.txt`.
- **Test a mutácia:** `p6f-medzera.mjs` (slepota `hola()`), `mut/barbershop-30/` (mutovaná kópia modulu, JSON, index.html a testu; len na S1).
- **Kópia na generátor:** `gen/` (výstup `jazyky-gen.py` na `cmp`).
- **Prehliadač:** `prehliadac-k5.mjs` + `prehliadac-k5.json` + `prehliadac-k5-telefon.png`, `server.log`.
