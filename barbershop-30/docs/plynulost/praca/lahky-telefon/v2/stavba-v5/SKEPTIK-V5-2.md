# V5 etapa 1 – Recepcia: skeptik, kolo 2 (25. 10. 2026, 11:52–12:10 UTC)

Strom `$SP/hs-recepcia`, vetva `barbershop-recepcia`, HEAD **854e849** (oprava 6). `git status --short` = 0 riadkov
pred aj po kontrole, v strome som nič nemenil. Od `kontrola-kod-5.md` (11:50) nepribudol žiadny commit.
`$SP` = `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad`, `$S5` = `$SP/barber/lahky-telefon/v2/stavba-v5`.
Moje súbory sú v `$S5/skeptik2/` (zoznam na konci). Prehliadač: jeden, port 8733, 48 s, potom server aj prehliadač
ukončené (`curl 127.0.0.1:8733` → 000). Súbežne bežal ffmpeg a prehliadač tímu Richtárik (load 4,5–13,7), časy sú orientačné.

Tvrdenie: „Recepcia na HEAD nikdy nedá holú nesprávnu cenu ani trvanie – keď otázka menuje viac vecí alebo niečo
neznáme, ponúkne voľby alebo odovzdá; cena je vždy vo výreze cenníka; bežné otázky vybaví hneď; panel nehýbe stránkou
ani filmom a na telefóne aj počítači vyzerá dobre; je bezpečná a ľahká.“

## Verdikt: NEPOTVRDENÉ → neposielať

Bezpečnosť, váha, testy, správanie panelu (stránka ani film sa nehýbu) a výrez pri každej cene služby sú v poriadku.
**Jadro tvrdenia však neplatí:** zo 167 mojich nových otázok dostalo **17 holú cenu**, ktorá nesedí s tým, čo otázka
hovorí. Patria do troch tried:
- **N1 (nová):** „dlhé vlasy“ s dĺžkou pod 10 cm dostanú 22 € za vlasy nad 10 cm.
- **V1:** „pre ňu / for her / für sie“ dostane cenu pánskej služby.
- **V2:** zložené slovo druhej služby.

Triedy V1 až V4 z `kontrola-kod-5.md` na HEAD stále platia, keďže od tej kontroly nepribudol žiadny commit. Dá sa to
overiť tak, že `k5/sondy-k5.txt` dá na HEAD bajtovo ten istý výstup.

## 1. Moje otázky (167, 8 jazykov)

Spustenie:
- `node $S5/k1-skusaj.mjs <strom>/barbershop-30 < skeptik2/otazky-v5-2.txt` (137 otázok) a `… < otazky-v5-2b.txt` (30 otázok, cielené na triedy nájdené v prvej sade);
- podrobnosti: `node skeptik2/detail.mjs <strom> otazky-v5-2*.txt > detail.json`;
- zaradenie: `python3 -I skeptik2/zarad.py` → `zarad.txt`.

Novosť som overil takto: každú otázku som hľadal v `$S5` (sady, sondy, výstupy) a v testoch a JSON stromu. 25 zhôd som
preformuloval, takže na konci bolo 0 zhôd.

**Zloženie sady:**
- bežné 53;
- viac vecí naraz 39;
- pasce 75.

Viac vecí a pasce tak tvoria 68 %. Každý jazyk má 15 až 26 otázok.

| výsledok | počet | čo znamená |
|---|---|---|
| OK – hneď správne | 40 | priama odpoveď správnej položky (cena, trvanie, info) |
| OK – voľba | 7 | „Myslíš toto?“, správna položka medzi prvými dvomi |
| OK – bezpečne | 96 | pri viacvecných otázkach a pasciach: voľby, téma „nevieme“ alebo odovzdanie, bez holého čísla |
| ODCHÝLKA | 4 | holá odpoveď inej info položky (nič nepravdivé, ale neodpovedá) |
| ODOVZDANIE‑NAVYŠE | 3 | legitímna otázka bez správnej voľby |
| **CHYBA** | **17** | holá cena, ktorá nevysvetlí, čo otázka menuje (8 N1, 8 V1, 1 V2) |

Rozdelenie chýb:
- podľa jazyka: sk 5, de 4, en 3, cs 2, hu 1, pl 1, sr 1, uk 0;
- podľa toho, či otázka patrila do cielenej sady: prvá sada so 137 otázkami mala 3 chyby, druhá sada s 30 otázkami ich mala 14.

### CHYBA – trieda N1 (nová): „dlhé vlasy“ + dĺžka pod 10 cm → 22 €

| otázka | odpoveď na HEAD | podľa stránky |
|---|---|---|
| sk „Koľko stojí strih, vlasy mám dlhé 7 cm?“ | výrez **▶ Pánsky strih – dĺžka vlasov nad 10 cm 60 min 22 €** | 7 cm nie je nad 10 cm → Pánsky strih 18 € (`index.html:530–531`, `:542–543`) |
| sk „Mám dlhé vlasy, asi 8 cm. Koľko stojí strih?“, „Koľko stojí strih, mám dlhšie vlasy, 9 cm?“ | **22 €** | 18 € |
| cs „Kolik stojí střih, mám dlouhé vlasy 7 cm?“ | **22 €** | 18 € |
| de „Was kostet ein Schnitt für lange Haare, ca. 8 cm?“ | **22 €** | 18 € |
| pl „Ile kosztuje strzyżenie długich włosów 7 cm?“ | **22 €** | 18 € |
| sr „Koliko košta šišanje duge kose od 8 cm?“ | **22 €** | 18 € |
| hu „Mennyibe kerül a hosszú haj vágása, 8 cm?“ | **22 €** | 18 € |

- **V paneli (prehliadač, telefón aj počítač):** zvýraznený je riadok 22 €, susedia sú 28 € a 15 €. Riadok so správnymi 18 €
  vo výreze nie je (`snimky/prehliadac-s2.json`, `panelOdpovede.odpovede[0]`).
- **Generátor `skeptik2/n1-dlzka.mjs`** (2 vzory × 3 prídavné mená × dĺžky 1–9 cm × 8 jazykov) dal **216 z 432** holých
  cien 22 €. Podľa jazyka: de 54/54, sk, cs, pl a uk po 36/54, en 18/54, sr 0/54, hu 0/54. V sr a hu trieda platí pri
  inom slovoslede (ručné otázky vyššie).
- **Príčina:** `recepcia.js:72` pred zhodou **zmaže** jednocifernú dĺžku `.replace(/(^|\D)\d\s?(cm|см)/gi, '$1')`.
  Po zmazaní ostane prídavné meno „dlhé/dlouhé/lange/długich/duge/hosszú“, čo je silný kmeň `Dlhe` položky cena-dlhe
  (`sk.json`). Otázka tak vyzerá úplne vysvetlená (P1).
  - Číslo, ktoré odpoveď vyvracia, sa zahodí skôr, ako ho P1 môže posúdiť.
  - Ten istý vzor bez prídavného mena („vlasy 8 cm koľko“) bol chybou už v `o4/p1-base.txt` a zmazanie čísla ho opravilo len bez prídavného mena.
  - Nejde o triedu V3 z kontroly 5. Tam „do 10 cm“ zostane, lebo „10“ je kmeň.
- **Návrh:**
  - dĺžku 1–9 cm nezmazať, ale nahradiť slovom (napr. `0cm`), ktoré cena-dlhe nevysvetlí. P1 potom zakáže priamu
    odpoveď a vznikne „Myslíš toto?“ [Pánsky strih, nad 10 cm];
  - do P6 pridať triedu „dĺžka 1–9 cm × prídavné meno dĺžky × 8 jazykov“ (vzor `n1-dlzka.mjs`).

### CHYBA – trieda V1 (z kontroly 5, potvrdená novými tvarmi pri iných službách): zámeno inej osoby je výplň

| otázka | odpoveď na HEAD |
|---|---|
| sk „Koľko stojí úprava brady pre ňu?“ | **Úprava brady 15 €** (výrez) |
| sk „Koľko stojí oholenie hlavy pre ňu?“ | **Oholenie hlavy 13 €** (výrez, overené aj v paneli) |
| cs „Kolik stojí oholení hlavy pro ni?“ | **13 €** |
| en „How much is a beard trim / a head shave / a hot towel shave for her?“ | **15 € / 13 € / 15 €** |
| de „Was kostet eine Bartpflege / eine Kopfrasur für sie?“ | **15 € / 13 €** |

- **Správne fungujú:**
  - pl „dla niej“, sr „za nju“, uk „для неї“ a sk „pre moju susedu“ dajú voľby;
  - „für meine Frau / my wife / barátnőmnek / přítelkyni“ dajú tému dámske strihy alebo odovzdanie.
- **Rovnaká otázka má teda v jednom jazyku bezpečnú odpoveď a v inom holú cenu.** Príčina je v `kontrola-kod-5.md` V1:
  - krátke neznáme slovo je voľné (`recepcia.js:82`);
  - zámená 3. osoby sú v `stop`;
  - `ine` má len položka deti (`recepcia.js:62`).

### CHYBA – trieda V2 (z kontroly 5, nový tvar)

de „Was kostet ein Kinderschnitt und ein Herrenschnitt?“ → holá cena **Schnitt für kleine Gentlemen 15 €**. Otázka menuje
dve služby, druhá stojí 18 €. Hu „gyerek és a férfi hajvágás“ a en „kids haircut and a men's haircut“ dajú voľby.

### ODCHÝLKY a ODOVZDANIE‑NAVYŠE (bez nepravdy)

- **„Kde máte barbershop?“, „Kde je váš barbershop?“, en „Where is your barbershop?“, de „Wo ist euer Barbershop?“** → holá
  odpoveď položky **tím**: „Pod značkou Barbershop 30 tu pracuje tím barberov a barberiek…“. Adresa chýba, overené aj v paneli.
  - Príčina: „kde/where/wo“ sú výplň (P1, `sk.json` `vypln`), a tak otázka „kde“ stratí svoj zmysel.
  - Nie je to nepravda, ale bežnú otázku na adresu to nevybaví.
- **Fallback:** sk „Kde je vaša prevádzka?“, hu „Hol található a szalon?“.
- pl „Jak długo trwa strzyżenie brody?“ → voľby trvania [strih s bradou, strih, brada]. Brada je až tretia.
- **Pasce na výdrž farby** (de „Wie lange hält die Bartfarbe?“, hu „Meddig marad meg a szakállfesték?“) dajú voľbu trvania farbenia:
  - po ťuknutí sa ukáže 30 min, teda čas služby, nie ako dlho farba vydrží;
  - voľba je označená vlastnou otázkou, preto to nerátam ako chybu;
  - v sk, cs, pl, sr, uk a en sú voľby bez trvania.

### Čo fungovalo (výber)

- **Cena + platba kartou, darčeková poukážka, dámske, vek 13 a 14 rokov, svadba, masáž/manikúra** → téma „nevieme“ s odovzdaním vo všetkých 8 jazykoch.
- **Viac vecí naraz** („strih s bradou a obočím“, „strih alebo brada“, „holenie alebo úprava brady“, „balíček 1 bez whisky“,
  „oholenie hlavy a farbenie brady“, „ako dlho trvá strih a farbenie brady“) → vždy voľby, nikdy holé číslo.
- **Čakanie** („Ako dlho budem čakať na strih?“, „Wie lange muss ich ohne Termin warten?“, „Скільки чекати без запису?“) a
  **príplatok za víkend** v 8 jazykoch → voľby alebo odovzdanie, nikdy holé trvanie ani cena.
- **„pod/unter/alatt/krótsze niż/kraće od/коротше 10 cm“** → voľby. Pozor: cena nad 10 cm je v nich prvá, pánsky strih až druhý.
- **P3:** všetkých 31 priamych cien má výrez so zvýrazneným riadkom.
  - Výnimka, ktorá už bola známa: `ceny-konecne` vo všetkých 8 jazykoch ukáže doslovnú vetu `index.html:506`
    „Pánsky strih 18 €, s úpravou brady 28 €.“ bez výrezu. Overené volaním `vyrez()` nad všetkými položkami.
- **P4:** 6 priamych trvaní, všetky sú price-time menovanej služby:
  - hlava 25 min (`index.html:554`);
  - Hot Towel 30 min (`:572`);
  - brada 20 min (`:566`).
- **Bežné otázky:** 40 z 53 priamo, ďalších 6 jedným ťuknutím (správna voľba prvá), spolu 87 %.

## 2. Ďalšie tvrdenia (overené príkazom alebo v prehliadači)

| tvrdenie | výsledok | dôkaz |
|---|---|---|
| testy prechádzajú | **áno**: `recepcia-test.mjs` 23/23 (4,4 s), `recepcia-kombinacie-test.mjs` 10/10 (14,1 s; P6a–P6g všade „chýb 0“). **Žiadnu zo 17 mojich chýb nezachytia** | `node --test source/tools/…` v `barbershop-30/` |
| ľahká | **áno**: gzip -9 -n po súboroch js 5 483 + css 1 019 + sk.json → **12 142 B ≤ 12 288**. Najťažší iný jazyk uk **13 163 B ≤ 13 312**. Prvé okno app.js +297, style.css +194 = **+491 B ≤ 500**. index.html **0 B**. Test 5 v Node: sk 12 206, uk 13 256 | `gzip -9 -n -c … \| wc -c`, `git show f624ee8:…`, `git diff f624ee8..HEAD -- index.html \| wc -c` → 0 |
| bezpečná | **áno**: `innerHTML` len statická kostra (`recepcia.js:175`) a statické SVG v app.js; jediný `fetch` je JSON z bieleho zoznamu (`recepcia.js:107`); žiadne úložisko ani `eval`. V prehliadači: vstup `<img src=x onerror=alert(1)>` → 0 prvkov `img`, 0 dialógov, zobrazí sa ako text; `setItem` 0×, `document.cookie` 0×; žiadna cudzia adresa; súbory recepcie až po ťuknutí (`recepcia.js`, `recepcia.css`, `recepcia/sk.json`) | `grep -nE`; `snimky/prehliadac-s2.json` (`imgVPaneli`, `poEsc.st/ck`, `cudzie`, `recepciaPredTuknutim`) |
| panel nehýbe stránkou ani filmom | **áno** pri otvorenom paneli. Telefón 390×844: 4 dotykové ťahy (log nahor, 2× nadol, pozadie) → scrollY 4 000 bez zmeny, rovnako po zatvorení krížikom, opätovnom otvorení a Esc; `body.overflow` „hidden“ ↔ „“. Počítač 1440×900 `?film=on`: 4× koliesko (nad logom aj pozadím, oboma smermi) a 6 klávesov (↓, PageDown, ↑, End, Home, medzera) → scrollY 2 500 bez zmeny, trieda `html` ostáva „… world-in“ (bez outside/pro), panel ostáva otvorený. Poznámka: stránka má `scroll-behavior: smooth` (`style.css:72`), takže moje meranie tesne pred otvorením zachytilo ešte bežiaci posun (2 486 → 4 000). Od otvorenia je poloha stála | `prehliadac-s2.json` (`tahy`, `vstupy`, `poEsc`) |
| vyzerá dobre na telefóne aj počítači | **čiastočne**: tlačidlo na telefóne 46×46 vľavo dole (x 16, y 782), na počítači 56×56, 40 px sprava, 24 px zdola; `aria-label` „Spýtaj sa recepcie“. CLS pred ťuknutím telefón 0, počítač 0,0001, po ťuknutí 0. Fokus na prvej voľbe, rad volieb po ťahu 149 → po novom otvorení 0, Esc vráti fokus na tlačidlo. Snímky sú čitateľné. **Trvá V6:** voľby „Myslíš toto?“ a akčné tlačidlá majú 40 px, nie 44 px (`recepcia.css:10` `.rc-btn{min-height:40px}`). **Trvá V7:** na počítači je Odoslať pod vstupom | `snimky/s2-telefon-panel.png`, `s2-pocitac-panel.png`, `prehliadac-s2.json` |
| čas zhody < 5 ms | **áno po zahriatí, orientačne**: 171 otázok (+4 dlhé po 200 znakov), medián zo 7 behov 0,53–0,58 ms, max 1,7–3,3 ms (3 behy). **Prvá otázka v novom procese** (studený JIT) 6,0 / 8,7 / 8,7 ms. V prehliadači je to prvá otázka po otvorení panela – nebadateľné, ale „max < 5 ms“ v prísnom zmysle neplatí | `node skeptik2/cas-s2.mjs …`, `ZAHRIAT=1 …` → `cas-s2.txt` (load 4,5) |
| bez zmienky o AI | **áno**: v pridaných riadkoch `f624ee8..HEAD` 0 zhôd (AI, umelá inteligencia, chatbot, asistent v 8 jazykoch), v paneli len „Recepcia“. Jediný výskyt je názov súboru návrhu `asistent.md` v správe c7ffb2f | `git diff … \| grep -ciE`, `git log --format=%B` |

## 3. Čo treba pred odoslaním

1. **N1** – `recepcia.js:72`: jednocifernú dĺžku v cm nemazať, ale previesť na slovo, ktoré P1 musí vysvetliť (cena-dlhe
   ho nevysvetlí). Pridať test P6 „dĺžka 1–9 cm × prídavné meno dĺžky × 8 jazykov“. Cieľ je `node skeptik2/n1-dlzka.mjs <strom>` → 0 z 432.
2. **V1, V2, V3, V4** podľa `kontrola-kod-5.md`:
   - krátke neznáme slovo nie je voľné;
   - zámeno inej osoby po predložke príjemcu;
   - vnútorný kmeň pri prvej časti zloženého slova inej služby;
   - „do/pod 10 cm“;
   - `Oboc`.
3. **Adresa:** opytovacie slovo „kde/where/wo/hol/gdzie/gde/де“ nesmie byť pri položkách bez adresy úplná výplň. „Kde máte
   barbershop?“ má dať adresu alebo voľby [adresa, tím], nie holý tím.
4. **Vzhľad:** `.rc-btn{min-height:44px}` (V6); na počítači Odoslať vedľa vstupu (V7).
5. **Overenie po oprave:**
   - `node $S5/k1-skusaj.mjs <strom>/barbershop-30 < skeptik2/otazky-v5-2.txt` (a `…-2b.txt`), `python3 -I skeptik2/zarad.py` po `detail.mjs` – cieľ CHYBA 0;
   - `k5/trieda-k5.mjs` a `k5/zarad-k5.py` podľa kontroly 5.

## Súbory v `$S5/skeptik2/`

- **Otázky a výstupy:** `otazky-v5-2.txt` (137) a `otazky-v5-2b.txt` (30), formát `jazyk|otázka|očakávanie|druh` (B bežná, V viac vecí, P pasca). Výstupy `k1-skusaj.mjs`: `vystup-k1.txt`, `vystup-k1b.txt`.
- **Podrobnosti a zaradenie:** `detail.mjs` + `detail.json` (typ, odpoveď, výrez, voľby, čas), `zarad.py` + `zarad.json` + `zarad.txt`.
- **Trieda N1:** generátor `n1-dlzka.mjs` + `n1-vystup.txt`.
- **Kontrola 5 na HEAD:** `k5-sondy-na-head.txt` (výstup `k5/sondy-k5.txt` na HEAD, zhodný s kontrolou 5).
- **Čas:** `cas-s2.mjs` + `cas-s2.txt`.
- **Prehliadač:** `prehliadac-s2.mjs` + `prehliadac-s2.out`, `snimky/prehliadac-s2.json`, `snimky/s2-telefon-panel.png`, `snimky/s2-pocitac-panel.png`, `server.log`.
