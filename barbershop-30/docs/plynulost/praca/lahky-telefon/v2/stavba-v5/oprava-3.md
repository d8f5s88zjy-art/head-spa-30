# V5 etapa 1 – Recepcia: oprava 3 (25. 10. 2026)

Staviteľ: jediný zapisovateľ v `hs-recepcia` (vetva `barbershop-recepcia`). Nič nepushnuté, nič nenasadené.
- `$SP` = `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad`
- `$S5` = `$SP/barber/lahky-telefon/v2/stavba-v5`
- Pravidlá zhody sú opísané v `$S5/ZASADY-ZHODY.md`.

## Verdikt v skratke

- **Trieda K1, K2, V6–V9 je opravená v koreni, nie v dátach pre konkrétne otázky.**
  Pomohli pravidlá 1–6 zo zadania a dve spresnenia, ktoré našla vlastná kontrola:
  - nové **pravidlo 7**: cena len pri istej zhode so službou,
  - **pravidlo 3**: dve služby v otázke a spojená služba len so spojkou.
- Na troch nových sadách sond (556 otázok, 8 jazykov, nie z kontrol):
  - **vážne chyby: HEAD 122 → po pravidlách 1–6 41 → teraz 2**,
  - tie 2 sú nejednoznačné (pozri „Otvorené“).
- Podiel legitímnych otázok bez priamej odpovede je spolu **11,9 %** (cieľ ≤ 15 %).
- Test: **20/20**. Váha sk: **11 258 B** (Node zlib) / **11 257 B** (gzip -6) ≤ 11 264 B.
- Bez zmeny sú index.html (0 B), prvé okno a i18n.

## 1. Stav na začiatku a čo som s ním urobil

- Predchádzajúci pokus prerušil limit. V strome boli necommitnuté zmeny (pravidlá 1–6, test 6–11,
  `zdroje.json`) a v `$S5/o3/` pomocné skripty (`kroky.py`, `recepcia-k2…k6.js`, `recepcia-test-k1…k6.mjs`).
- Zmeny som prezrel a overil:
  - test 17/17,
  - `o3/pred-otazky.txt` dalo správne odpovede,
  - stav sa zhodoval so snímkou `o3/finale/`.
- Použil som ich a rozdelil na **6 commitov po krokoch** cez `o3/kroky.py`. Každý krok prešiel svojím testom.
  - Jedna úprava: v kroku 2 test hu padal na „hajwax“. Pravidlo 1 krátkym kmeňom „haj“ nezachytí zložené slovo,
    preto sa kmeň `Hajwax` presunul z kroku 5 do kroku 2.
- Záloha necommitnutého stavu je v `$S5/o3/sondy/zaloha-strom/`. Stash ani `checkout .` nebol potrebný.
- **Pred** (HEAD `d4657b7`): `$S5/o3/pred.txt`, otázky `$S5/o3/pred-otazky.txt`.
- **Po** (`f715141`): `$S5/o3/po.txt`.

## 2. Commity (lokálne, nad `d4657b7`)

| commit | čo |
|---|---|
| `8fc1824` | zdroje v `zdroje.json`, menej variantov otázok, limit váhy po ťuknutí (test: S7 bez zmienky) |
| `0321242` | p. 1 – krátke kmene len presne (príčina K1: `recepcia.js:20` a `:23` v HEAD) |
| `df4076c` | p. 2 a p. 5 – neznáme slovo nedostane cenu, zdvorilosť nedostane cenu |
| `972d766` | p. 3 – špecifickejšia služba vyhrá (V8 holenie hlavy britvou → Oholenie hlavy 13 €) |
| `1b75b64` | p. 4 – témy podľa tried osôb a miest (V6 mama/babka …, V7 balzam …, V9 domov/nemocnica) |
| `366c21f` | p. 6 – trvanie podľa menovanej služby (K2) |
| `d3d5604` | rýchlejšia zhoda a menšia váha bez zmeny odpovedí (1 430 z 1 431 rovnakých) |
| `7fd7170` | p. 7 a p. 3 – cena len pri istej zhode so službou, dve služby, spojená služba len so spojkou |
| `f715141` | p. 4 a p. 2 – vek nad 10 rokov ako trieda, neznáme slovo od 3 znakov |

Správy commitov sú po slovensky, bez podpisov a bez zmienky o AI (overené: `git log -9 --format=%B | grep -ciE
'\bAI\b|claude|co-authored|chatbot|asistent'` → 0).

## 3. Čo našla vlastná kontrola po pravidlách 1–6 (stav `366c21f`)

Napísal som nové sondy podľa tried, nie podľa nálezov kontroly: `$S5/o3/sondy/sondy-1.txt` (260), `sondy-2.txt`
(143) a `sondy-3.txt` (153). Riadky majú tvar `jazyk|očakávané|otázka`. Vyhodnocuje ich `sondy.mjs`.
Za vážnu chybu ráta cenu alebo trvanie tam, kde nemajú byť, a cenu alebo trvanie inej služby.

Pravidlá 1–6 nechali tieto triedy (stav `366c21f`, spolu 41 vážnych):

| trieda | príklad (stav 366c21f) |
|---|---|
| cena len zo slabého kmeňa (súčasť, nástroj, prenesené slovo) | „koľko stojí whisky“ → Ultra 40 €; „strih pre gentlemana“ → 15 €; de „alles gut“ → Paket 30 € |
| kmeň služby, ktorú stránka nemá | „koľko stojí tetovanie“ (6 jazykov) → ornament 4 € |
| kmeň s iným významom | „strih pre chlapa“ (sk, cs, pl) → detský strih 15 € |
| spojená služba bez spojky | „strih brady“, „beard cut“ (8 jazykov) → strih a brada 28 € namiesto úpravy brady |
| dve služby v otázke | „strih a holenie“ → 15 €; „holenie hlavy a brady“ → 13 € |
| vek nad 18 (zoznam =11…=18) | „syn má 25 rokov“ (8 jazykov) → 15 € |
| trojpísmenové slovo | „strih pre psa“ (sk, cs, pl, sr), „dog haircut“ → 18 €; „holenie nôh“, „leg shaving“ → 15 € |

Opravy sú pravidlá, nie zoznamy otázok: pravidlo 7, spresnené pravidlá 2, 3 a 4 a dátové zásady.
Všetko je v `ZASADY-ZHODY.md`.

## 4. Výsledky (stav `f715141`)

### 4.1 K1, K2, V6–V9 (`o3/po.txt`)

- **K1:**
  - zdvorilosti „sorry“, „köszönöm“, „děkuji“, „dekujem“, „dziękuję“ → zdvorilá odpoveď (úvodná veta a voľby),
  - „detox“, „sedacka“, „Si robot?“, „Ronaldo“ → fallback,
  - „kolko stoji detox“ → „Túto službu v cenníku neviem nájsť“,
  - „detailny strih“, „mate detsku stolicku“, „kolko stoji detske sedadlo“ → „Myslíš toto?“.
- **K2:**
  - holenie → 30 min,
  - de Bartfärben → 30 Min.,
  - balíček → 65/80 min,
  - head shave → 25 min,
  - beard dyeing → 30 min,
  - peeling → 30 min,
  - „ako dlho trvá farbenie“ → fallback.
- **V6:** mama, babka, kamarátka, sestra (sk, cs, pl, sr, en) → téma damske.
- **V7:** balzam, olej, vosk na bradu (8 jazykov) → téma produkty.
- **V8:** holenie hlavy britvou (sk, en, cs, pl, uk) → Oholenie hlavy 13 €.
- **V9:**
  - domov, doma, nemocnica, domov dôchodcov (sk, cs) → téma mimo,
  - „robite strih u zakaznika“ → „Myslíš toto?“.

### 4.2 Sondy a podiel legitímnych otázok

Počty sú z `$S5/o3/sondy/suhrn-sond.txt`.

| sada | vážne HEAD → 366c21f → teraz | legitímne bez priamej odpovede (teraz) |
|---|---|---|
| sondy-1 (260) | 48 → 10 → **0** | 8 z 89 = 9,0 % |
| sondy-2 (143) | 38 → 20 → **0** | 3 z 48 = 6,3 % |
| sondy-3 (153, písaná pred prvým behom) | 36 → 11 → **2** | 6 z 45 = 13,3 % |
| legit-stare (147, oprava 2) | – | 22 z 147 = 15,0 % (HEAD 25,9 %, 366c21f 12,9 %) |
| **spolu legitímne** | | **39 z 329 = 11,9 %** |

- Sondy 1 a 2 som použil pri vývoji, nie sú teda nezávislé.
- Sondu 3 som napísal pred prvým behom. Po ňom som pridal dve veci:
  - silné „pánsky“,
  - „dobrý večer“ ako zdvorilosť.
- Sady `$S5/slepe/` (sada A a B) som nepoužil ani nečítal výsledky. Súbor `sada-A` niekto upravoval
  25. 10. o 06:03, teda súbežne s touto prácou.

### 4.3 Regresia na starých sadách

- 513 otázok kôl 2 a 3, opráv 1 a 2 (`k2-*`, `k3-*`, `o1-*`, `o2/*` a kolízie z oprava-2), porovnanie
  HEAD `d4657b7` → `f715141`: `$S5/o3/sondy/stare-HEAD-vs-novy.txt`.
  - Bez zmeny 361.
  - Každú zmenu som prezrel. Žiadna predtým správna cena ani trvanie sa nezmenili na nesprávne.
  - Zmeny sú opravy (34× odpoveď → téma nevieme, 19× iná položka: hlava namiesto holenia, trvanie
    menovanej služby) alebo bezpečný posun na „Myslíš toto?“ či odovzdanie (40×, 7×).
- Všetkých 1 431 otázok (staré sady, test, sondy), porovnanie po krokoch:
  - `k6-vsetky.txt` → `k7.txt`: 1 zmena,
  - `k7.txt` → `k8.txt`: 63 zmien,
  - `k8.txt` → `k9.txt`: 42 zmien.
  - Porovnania som robil `o3/porovnaj.py` a všetky prezrel.
- Legitímne otázky, ktoré prešli z priamej odpovede na „Myslíš toto?“:
  - „whisky je v cene?“ a „koľko stojí naparenie tváre“: súčasť balíka alebo pleti, teda slabý kmeň,
  - „dám si ostrihať bradu“: bez spojky ponúkne úpravu brady aj spojenú službu.

### 4.4 Test, váha, čas

- `node --test source/tools/recepcia-test.mjs` → **tests 20, pass 20, fail 0**:
  - SADA 294 otázok, 100 % správnych, „Myslíš toto?“ 6×,
  - 3 374 kmeňov (p. 1),
  - 397 otázok s neznámym slovom (p. 2),
  - 1 456 dvojíc služieb, z toho „Myslíš toto?“ 1 396× a s oboma 1 312× (p. 3),
  - triedy osoba 180, miesto 88, vek 170, produkt 174 (p. 4),
  - 91 zdvorilostí (p. 5),
  - 112 trvaní (p. 6),
  - 89 otázok zo slabých kmeňov (p. 7).
  - Každý z 9 commitov prešiel svojím testom: kroky 1–6 cez `o3/kroky.py`, kroky 7–9 cez `o3/sondy/kroky3/krok.sh`.

**Váha** (gzip -6 CLI / Node zlib 6 / raw):

| súbor | gzip -6 CLI | Node zlib 6 | raw |
|---|---|---|---|
| recepcia.js | 4 784 | 4 812 | 11 992 |
| recepcia.css | 1 013 | 998 | 2 783 |
| sk.json | 5 460 | 5 448 | 14 513 |
| **sk spolu** | **11 257** | **11 258** | limit 11 264 |
| najťažší iný jazyk (uk.json 6 683) | 12 468 | 12 493 | limit 12 800 |

- Ostatné jazyky s modulom (Node): en 11 290, hu 11 682, sr 11 376, pl 11 832, de 11 463, cs 11 699.
- Prvé okno:
  - `app.js` a `style.css` sa od `d4657b7` nezmenili (`git diff --stat d4657b7 HEAD -- index.html app.js
    style.css i18n recepcia.css` je prázdny),
  - prírastok proti `f624ee8` je app.js +304 B a style.css +189 B, spolu **+493 B** ≤ 500 B (gzip -6),
  - `index.html`: `git diff --stat f624ee8 HEAD -- barbershop-30/index.html` je prázdny, teda **0 B**.

**Čas zhody** (Node 22, najlepší z 5 behov po zahriatí):

| meranie | výsledok |
|---|---|
| SADA testu | max 1,27 ms |
| 1 431 skutočných otázok (najdlhšia 43 znakov) | max 2,35 ms, 0 otázok nad 5 ms (HEAD max 1,54 ms) |
| umelé otázky s 200 znakmi (maxlength poľa) | 3–8 ms (HEAD 4–8 ms), **orientačne** |

- Pri meraní 200-znakových otázok bežal na stroji aj iný prehliadač, load average bol 2–8.

### 4.5 Bezpečnosť, prístupnosť, prehliadač

- `recepcia.js` volá `fetch` len na vlastné `recepcia/<jazyk>.json`.
- `innerHTML` je len statická kostra `KOSTRA` a text návštevníka ide cez `textContent`.
- Nikde nie je localStorage ani cookies.
- Grep na AI, chatbot a asistent nad recepcia.js, recepcia.css, JSON a testom nič nenašiel (exit 1).
- **Prehliadač** (jeden vlastný Chromium, server `127.0.0.1:8711`, title overený curlom, po behu ukončený):
  - skript `$S5/o3/sondy/prehliadac3.mjs`, výsledok `$S5/o3/sondy/prehliadac/vysledok.json`,
    snímky `panel-telefon.png` a `panel-pocitac.png`,
  - telefón 390×844 aj počítač 1440×900: 0 chýb konzoly,
  - žiadosti len `assets/recepcia.js`, `assets/recepcia.css` a `assets/recepcia/sk.json`,
  - bez vodorovného posunu (scrollWidth = innerWidth),
  - panel telefónu v rozsahu x 0–390, y 236–844; počítač x 1056, šírka 360,
  - Esc zatvorí panel a fokus sa vráti na tlačidlo, poloha stránky sa nezmení.
  - Odpovede v paneli:
    - „koľko stojí strih pre psa“ → „Myslíš toto?“,
    - „syn má 25 rokov…“ → téma vek,
    - „koľko stojí strih brady“ → dve tlačidlá (strih s bradou, úprava brady),
    - „strih + brada“ → 28 €,
    - „koľko stojí strih a holenie“ → obe služby,
    - „koľko stojí whisky“ → „Myslíš toto? Ultra inclusive“,
    - „dobrý večer“ → zdvorilá odpoveď.

## 5. Generátor a dáta

- `$S5/jazyky-gen.py`:
  - nevypisuje `prah` (prahy 0,55 a 0,1 sú v kóde),
  - pri témach nevieme vypisuje len prvú otázku,
  - pole `spoj` vypisuje ako výplňové slová.
- `$S5/jazyky_data.py` dostal zmeny podľa krokov 8 a 9.
- JSON v strome je zhodný s generátorom: beh do kópie a `cmp` dal pre en, uk, hu, sr, pl, de a cs 7× zhodné.
- Postup po krokoch (opakovateľný):
  - `$S5/o3/sondy/kroky3/js.py`, `dat.py`, `tst.py` a `krok.sh <7|8|9>`,
  - vstupy v stave `366c21f` sú v `kroky3/base/`.

## 6. Otvorené (nie vážne, alebo mimo tejto opravy)

1. **„britva na holenie“** → Holenie do hladka Hot Towel 15 €. Otázka je nejednoznačná (produkt alebo služba).
   Samotné „britva“ dá „Myslíš toto?“. Na rozlíšenie by bolo treba predložkové pravidlo.
2. **„koľko stojí whisky navyše“** → „Ceny sú konečné“ (kmeň „navyše“ témy ceny-konecne). Nie je to nepravda.
3. **N4 z kontroly 3:** „koľko platím za vlasy a bradu“ a „vlasy aj brada, koľko to vyjde“ dajú tému produkty
   („značky produktov“). Je to bezpečné odovzdanie so zlou témou, rovnaké ako v HEAD.
   Pokus podmieniť cenový bonus tém silným kmeňom zhoršil cenu (15 € namiesto 28 €), preto som ho vrátil.
4. en „how long is the beard trim“ dá trvanie strihu aj brady (vrátane Beard trim 20 min) namiesto len brady.
   Slovo „long“ je slabé, lebo je aj silným kmeňom dlhých vlasov.
5. „mám 40 rokov, je to pre mňa drahšie?“ dá tému vek („Strih pre chlapcov nad 10 rokov na webe neuvádzame“).
   Je to bezpečné, ale text nesedí na dospelého.
6. Čas 200-znakových otázok 3–8 ms. Rýchlejšie by to bolo s pamäťou zhody počas jednej otázky (~45 B gzip),
   no rezerva váhy sk je 6 B.
7. Z kontroly obsahu 3 ostávajú:
   - S6 (vykanie a tykanie v texte panela),
   - N5 (Romana a mihalnice: stále téma romana-ceny),
   - N7 (sťažnosť: teraz „Myslíš toto?“ s pánskym strihom, už nie holá cena),
   - D14 („kto si“ → „Myslíš toto?“ tím).
