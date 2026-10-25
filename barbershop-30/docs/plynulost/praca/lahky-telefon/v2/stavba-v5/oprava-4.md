# V5 etapa 1 – Recepcia: oprava 4 (kolo 2 po slepom hodnotení, 25. 10. 2026)

Staviteľ: jediný zapisovateľ v `hs-recepcia` (vetva `barbershop-recepcia`). Nič nepushnuté, nič nenasadené.
- `$SP` = `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad`
- `$S5` = `$SP/barber/lahky-telefon/v2/stavba-v5`, pracovné súbory opravy sú v `$S5/o4/`
- Pravidlá zhody: `$S5/ZASADY-ZHODY.md` (doplnené pravidlá 8, 9, 10 a doplnok pravidla 4).

## Verdikt v skratke

- Všetkých **5 chýb** zo `slepe/hodnotenie-1.md` je opravených ako **triedy**, nie ako jednotlivé vety:
  - **zložené slovo** (3 chyby) → nové pravidlo 8 v kóde,
  - **iná osoba, vek nad 10** → doplnok pravidla 4 (dáta podľa triedy: slová dieťaťa z položky deti),
  - **číslo dĺžky** → nové pravidlo 10 v kóde (aj čas hh:mm),
  - druhá príčina chyby 4 (služba s dvomi skupinami kmeňov) → nové pravidlo 9 v kóde.
- **Slepé sady:** A 0 → 0 chýb, B **5 → 0 chýb**. Žiadna otázka sa nezhoršila (8 zmien, všetky na lepšie).
- **Staré sady:** zo všetkých 2 031 otázok (staré sady, sady testu, sondy 1–3, slepé A a B) je 2 021 bez zmeny.
  10 zmien, všetky sú opravy alebo bezpečný posun. Žiadna predtým správna odpoveď sa nepokazila.
- **Nová sada sond tried** (`o4/sondy-4.txt`, 116 otázok, 8 jazykov, písaná pred opravou): vážne chyby **30 → 0**.
- **Test:** 23/23 (pribudli testy 15–17). Na stave `f715141` tieto testy zlyhajú na 690 z 780, 21 zo 106 a 66 z 281
  otázok.
- **Váha sk:** 11 246 B (Node zlib 6) / 11 235 B (gzip -6) ≤ 11 264 B. Najťažší iný jazyk (uk): 12 495 / 12 460 B
  ≤ 12 800 B.
- `index.html` 0 B. Prvé okno sa nezmenilo (+493 B proti `f624ee8`).

## 1. Stav na začiatku a reprodukcia

- HEAD `f715141`, `git status --short` prázdny. Základ som uložil do `$S5/o4/base/` (recepcia.js, JSON, test,
  jazyky_data.py, generátor). Kópia na porovnávanie je v `$S5/o4/basetree/`.
- Reprodukcia (`node $S5/o4/beh.mjs <strom> < $S5/o4/chyby.txt`, výstup `$S5/o4/chyby-pred.txt`):

| # | otázka | f715141 |
|---|---|---|
| 1 | sk „Synovi je 12, platí ešte detský strih?“ | deti 15 € |
| 2 | sk „Mám vlasy 3 cm, koľko stojí strih?“ | cena-dlhe 22 € |
| 3 | de „Was kostet Rückenwaxing?“ | depilácia 5,50 € |
| 4 | hu „Szempillafestés mennyi?“ | farbenie brady 10 € |
| 5 | hu „Hátgyantázás ára?“ | depilácia 5,50 € |

- Pred opravou som napísal sondy tried, nie len týchto 5 viet (`o4/p1.txt` 66 otázok, `o4/sondy-4.txt` 116 otázok).
  Stav `f715141` mal v triedach oveľa viac chýb, napríklad:
  - de Beinwaxing, Brustwaxing, Bauchrasur, Rückenrasur, Gesichtswaxing → cena depilácie, holenia, pleti,
  - hu Lábgyantázás, Mellkasgyantázás, Lábborotválás, Körömfestés → cena,
  - de Augenbrauenpiercing, Ohrenpiercing → cena obočia a depilácie,
  - en „How much is dyeing?“, pl „Ile kosztuje koloryzacja?“ → farbenie brady 10 €,
  - sk „Synovi je 11/14“, „Pre synovca, má 12“ → 15 €,
  - „vlasy 3/4 cm“ v sk, cs, en, de, pl, sr → 22 €.

## 2. Príčiny (kód na stave f715141)

| trieda | príčina |
|---|---|
| zložené slovo, známa hlava (Rücken+waxing, hát+gyantázás, szempilla+festés) | kmeň od 5 znakov sa hľadá aj vnútri slova (`recepcia.js:21` v f715141: `w.includes(k)` → 0,9). Slovo je potom „známe“, takže strážca neznámych slov (pravidlo 2) cudziu prednú časť nevidí. |
| zložené slovo, známa predná časť (Augenbrauen+piercing) | dlhý kmeň na začiatku dáva zhodu 1 pri akomkoľvek zvyšku slova. |
| služba s dvomi skupinami (farbenie \| brada) | pri položke s odpoveďou sa skóre pri jednej skupine len znížilo (`recepcia.js:34` v f715141), nevynulovalo, a príznak istoty nebral skupiny do úvahy. |
| vek nad 10 s tvarom slova dieťaťa | veto témy vek chce istú zhodu v druhej skupine. „synovi“ a „detský“ k trojznakovým kmeňom syn/det dávajú len 0,6 (pravidlo 1). Položka deti pritom má kmene Synov a Detsk – trieda slov dieťaťa nebola v oboch rovnaká. |
| číslo dĺžky | `=Cm` je silný kmeň dlhých vlasov a číslo pred ním sa nekontrolovalo. |

## 3. Pravidlá (podrobne v ZASADY-ZHODY.md)

- **Pravidlo 8 – zložené slovo po častiach** (`recepcia.js:73–76`).
  - Slovo sa rozdelí na prednú časť a hlavu:
    - ak je dlhý kmeň vnútri slova (predná časť od 3 znakov; po odrátaní „ne“ nie je predponou ani stop-slovom;
      kmeň na začiatku nesiaha za miesto delenia),
    - alebo ak za dlhým kmeňom na začiatku ostáva viac ako 7 znakov.
  - Rozdelí sa len vtedy, ak obe časti nevysvetľujú kmene ani názov tej istej položky.
  - Časti sa potom posudzujú ako dve slová (pravidlá 2 a 3). Zložené slovo sa tak správa rovnako ako tá istá fráza
    v dvoch slovách („back waxing“, „depilácia chrbta“).
- **Pravidlo 9 – viac skupín kmeňov** (`recepcia.js:25`, `:32`, `:62`).
  - Služba s cenou je istá len pri zásahu všetkých skupín, alebo pri celom názve či pripravenej otázke.
  - Pri „inej službe v otázke“ (pravidlo 3) sa naďalej berie aj jedna skupina. Preto „strih a farbenie“ nedostane
    holú cenu strihu.
- **Pravidlo 10 – čísla** (`recepcia.js:72`).
  - Čas hh:mm sa nepočíta ako číslo.
  - Jednociferné číslo pri cm (3 cm, 3cm, 3,5 cm, см) sa vynechá aj s jednotkou, nie je teda „nad 10 cm“.
- **Doplnok pravidla 4 (dáta, trieda)** – druhá skupina témy vek obsahuje všetky silné slová dieťaťa z položky deti
  toho jazyka:

  | jazyk | pridané slová |
  |---|---|
  | sk | synov, detsk, junior |
  | cs | děti, dětsk, junior |
  | en | little, junior |
  | de, pl | junior |
  | hu | kisfiú, junior |
  | sr | dec, decu, dečij, junior |
  | uk | діт, дітей, дитяч, дитин, маленьк, junior |

  Test 17 to kontroluje automaticky zo silných kmeňov položky deti.
- **Dáta k pravidlu 8.** Vždy podľa triedy alebo textu stránky, nie podľa otázky z kontroly:
  - de holenie: „Nassrasur“ – bežný názov služby; „Messerrasur“ je v nemeckom opise na stránke,
  - de depilácia: „entfern“ – z vety „Entfernung von Ohren- und Nasenhaaren mit Wachs“, preklad `index.html:619`,
  - de deti: „schnitt“ – všeobecné slovo strihu, ktoré deti majú vo všetkých ostatných jazykoch,
  - stop-slová: slovesné predpony, ktoré nie sú predložkami (sk roz; cs pře, roz; pl prze, roz; uk пере, роз; sr pre, raz).
- **Kód bez komentárov.** recepcia.js a recepcia.css nemajú komentáre: ušetrilo to 247 B (js) a 30 B (css) gzip,
  inak by sa pravidlá do limitu nezmestili.
  - Pravidlá 1–10 a bezpečnosť modulu opisuje hlavička `source/tools/recepcia-test.mjs`: nič sa neposiela ani
    neukladá, text návštevníka ide len cez textContent, innerHTML je len pre statickú kostru.

## 4. Commity (lokálne, nad f715141)

| commit | čo | test |
|---|---|---|
| `d80f993` | pravidlá zhody opisuje test, modul bez komentárov (odpovede bez zmeny: 2 031 z 2 031) | 20/20 |
| `fd07112` | p. 8 zložené slovo po častiach + dáta + test 15 | 21/21 |
| `bc99caf` | p. 9 služba s dvomi skupinami len pri zásahu oboch + test 16 | 22/22 |
| `6f8c47c` | doplnok p. 4 (slová dieťaťa vo veku), p. 10 (čas, cm) + test 17 | 23/23 |

- Každý krok zostavuje zo stavu `f715141` skript `$S5/o4/kroky.py <A|B|C|D>`. Potom sa spustí
  `jazyky-gen.py` a test. Výstupy testov sú v `$S5/o4/test-commitA…D.txt`.
- Krok D je bajtovo zhodný so snímkou `$S5/o4/final/` (cmp 11 súborov + jazyky_data.py).
- Správy sú po slovensky, bez podpisov a bez odkazov na nástroje (CLAUDE.md projektu).
  `git log -4 --format=%B | grep -ciE '\bAI\b|claude|co-authored|chatbot|asistent|umel'` → 0.

## 5. Výsledky

### 5.1 Päť chýb (`o4/chyby-po.txt`)

| # | po oprave | hodnotenie |
|---|---|---|
| 1 | téma vek: „Strih pre chlapcov nad 10 rokov na webe neuvádzame.“ + Zavolať, E-mail | OK (odovzdanie) |
| 2 | „Myslíš toto?“ [Pánsky strih, Dlhé vlasy] + Celý cenník | BEZPEČNÉ (očakávané „cena-strih alebo výber“) |
| 3 | „Meinst du das?“ [Ohren- und Nasenwaxing] + Ganze Preisliste, Anrufen, E-Mail | VÝBER‑NELEG (bez ceny) |
| 4 | téma romana-ceny (odovzdanie bez ceny) | OK |
| 5 | „Erre gondoltál?“ [Fül- és orrgyantázás] + Teljes árlista, Hívás, E-mail | VÝBER‑NELEG (bez ceny) |

- Pri #3 a #5 hodnotenie čakalo odovzdanie. Dostanú „Myslíš toto?“, tak ako tie isté frázy v dvoch slovách,
  ktoré už v kole 1 boli VÝBER‑NELEG: „How much is back waxing?“, „Koľko stojí depilácia chrbta voskom?“,
  pl „Depilacja pleców woskiem“.
  - Panel nič netvrdí. Na tlačidle je presný názov služby, ktorú stránka má, a pri ňom celý cenník a kontakt.
  - Podľa zásady majiteľa je to prijateľné.

### 5.2 Slepé sady (`slepe/spust-slepe.mjs` + `slepe/zarad-1.py`, výstupy `o4/vys-A-n5.jsonl`, `o4/vys-B-n5.jsonl`)

| sada | OK | BEZPEČNÉ | VÝBER‑MIMO | VÝBER‑NELEG | ODCHÝLKA | **CHYBA** |
|---|---|---|---|---|---|---|
| A pred → po | 317 → 317 | 28 → 28 | 1 → 1 | 3 → 3 | 0 → 0 | **0 → 0** |
| B pred → po | 242 → 246 | 23 → 23 | 3 → 3 | 38 → 39 | 4 → 4 | **5 → 0** |

Zmeny po otázkach (všetkých 8):
- sk „Synovi je 12…“: CHYBA → OK (vek),
- sk „Mám vlasy 3 cm…“: CHYBA → BEZPEČNÉ,
- de Rückenwaxing a hu Hátgyantázás: CHYBA → VÝBER‑NELEG,
- hu Szempillafestés: CHYBA → OK,
- cs „Synovi je 13, platí dětská cena?“: VÝBER‑NELEG → OK (vek),
- sk „Môžem prísť v sobotu o 15:00?“: fallback → hodiny („So 9:00–14:00“), BEZPEČNÉ → OK,
- de „nassrasur mit heißem tuch preis“: výber [holenie, hlava] → výber [holenie].

### 5.3 Staré sady a sondy

- Všetky otázky: `o4/vsetko-q.txt` = `o3/sondy/vsetky-q3.txt` (1 431: staré sady kôl 2–3, opráv 1–3, sada testu)
  + slepé A a B + sondy 1–3. Spolu **2 031** jedinečných otázok.
  - Overil som, že `stare.txt` (513), `test-sada.txt` (445), `stare-vsetky.txt` (467) aj `legit-stare.txt` (147)
    sú v nej celé.
- Porovnanie f715141 → 6f8c47c je v `o4/vsetko-base-vs-po.txt`: **2 021 bez zmeny, 10 zmien**, všetky som prezrel.
  - 5 chýb hodnotenia a cs „Synovi je 13“ (pozri 5.2),
  - de „Hundeschnitt“: téma fotky → „Myslíš toto?“ [pánsky strih] (bez ceny oboje),
  - sk „mozem prist o 19:30“: fallback → téma príchod bez objednania,
  - sk „Môžem prísť v sobotu o 15:00?“: → hodiny,
  - de „nassrasur…“: menej kandidátov.
- Sondy 1–3 (`o3/sondy/sondy.mjs`): VÁŽNE **0 / 0 / 2**, rovnako ako pred opravou.
  - Tie 2 sú známe otvorené body z opravy 3: „britva na holenie“ a „whisky navyše“.
  - Podiel legitímnych otázok bez priamej odpovede sa nezmenil: 9,0 %, 6,3 % a 13,3 %.
  - `legit-stare.txt`: 15,0 % pred aj po.
- Sondy 4 (`o4/sondy-4.txt`, 116 otázok, 8 jazykov; výstupy `o4/sondy-4-pred.txt` a `o4/sondy-4-po.txt`):
  - **VÁŽNE 30 → 0**,
  - legitímnych 48: priamo 32 → 35, „Myslíš toto?“ 9 → 12, odovzdanie 7 → 1.
  - Pri jednej otázke som opravil vlastné očakávanie: „Koľko stojí detský strih o 14:00?“ je legitímna otázka
    na detský strih (15 € je správne), nie X.

### 5.4 Správne odpovede

- V zavedených sadách (2 031 otázok) sa **žiadna** predtým správna odpoveď nezmenila na nesprávnu ani na menej
  presnú.
- Mimo sád som skúšal aj legitímne zložené slová (`o4/p2.txt`, 62 otázok, `o4/p2-base-vs-po.txt`). Tu 7 priamych
  odpovedí prešlo na „Myslíš toto?“, čo je bezpečný posun a nikdy nie iná cena:
  - de **Bartrasur** a hu **Szakállborotválás**: dve služby stránky (brada + holenie) → výber oboch,
  - de **Heißtuchrasur**, **Gesichtsbehandlung** a hu **Fülszőrtelenítés**: predná časť alebo hlava nie je slovo
    zo stránky → výber [holenie / pleť / depilácia],
  - de **Männerhaarschnitt** a **Kurzhaarschnitt**: pred aj po bez ceny (obsah strihu).
- Zložené slová, ktoré na stránke sú, ostali priamou odpoveďou (Ohrenwaxing, Nasenhaarentfernung, Augenbrauenkorrektur,
  Kinderschnitt, Kopfrasur, Szakállfestés, Szemöldökfestés, Fülgyantázás, Fejborotválás, перефарбування бороди).

### 5.5 Test, váha, čas

- `node --test source/tools/recepcia-test.mjs` → **tests 23, pass 23, fail 0** (`o4/test-n5.txt`):
  - SADA 294 otázok, 100 % správnych,
  - nové testy: zložené slová 782 (test 15), slovo jednej skupiny 106 (test 16), čísla 281 (test 17).
- Tie isté testy na stave f715141 (`o4/basetest/`, `o4/triedy-pocet.mjs`):

  | test | zlé otázky na f715141 |
  |---|---|
  | 15 | 690 z 780 |
  | 16 | 21 zo 106 |
  | 17 | 66 z 281 |

**Váha** (Node zlib 6 / gzip -6 CLI):

| súbor | Node | CLI | f715141 (Node) |
|---|---|---|---|
| recepcia.js | 4 820 | 4 782 | 4 812 |
| recepcia.css | 968 | 982 | 998 |
| sk.json | 5 458 | 5 471 | 5 448 |
| **sk spolu** | **11 246** | **11 235** | 11 258 (limit 11 264) |
| uk.json + modul | 12 495 | 12 460 | 12 493 (limit 12 800) |

- Prvé okno: `git diff --stat f715141 HEAD -- app.js style.css i18n` je prázdny. Prírastok proti `f624ee8`
  (gzip -6) je app.js +304 B a style.css +189 B, spolu **+493 B**.
- `git diff f624ee8 HEAD -- barbershop-30/index.html` má 0 riadkov.
- **Čas** (`o4/cas.mjs`, najlepší z 5 behov po zahriatí):

  | meranie | f715141 | teraz |
  |---|---|---|
  | 2 031 otázok, priemer | 0,54 ms | 0,63 ms |
  | 2 031 otázok, max | 1,67 ms | 1,79 ms |
  | otázky nad 5 ms | 0 | 0 |
  | 24 otázok s 200 znakmi, max | 7,1 ms | 8,7 ms |

  - 200-znakové otázky sú **orientačné**: súbežne bežal prehliadač iného tímu, load average 4,3.

### 5.6 Bezpečnosť, generátor, prehliadač

- `recepcia.js` volá `fetch` len na vlastné `recepcia/<jazyk>.json` (riadok 98).
- `innerHTML` je len statická `KOSTRA` (riadok 154).
- localStorage, sessionStorage, cookies ani IndexedDB modul nepoužíva.
- Grep na AI, chatbot, asistent a umelú inteligenciu nad modulom, CSS, JSON a testom: 0 zhôd.
- Generátor: beh `jazyky-gen.py` do čistej kópie (`o4/gen-kontrola`) dal en, uk, hu, sr, pl, de aj cs bajtovo
  zhodné so stromom.
- **Prehliadač** – skript `o4/prehliadac4.mjs`, výsledok `o4/prehliadac/vysledok.json`, snímky
  `panel-telefon.png` a `panel-pocitac.png`:
  - jeden vlastný Chromium, server `127.0.0.1:8712`, title overený curlom, po behu server aj prehliadač ukončené,
  - telefón 390×844 aj počítač 1440×900: 0 chýb konzoly,
  - žiadosti len recepcia.js, recepcia.css a recepcia/sk|de|hu.json,
  - scrollWidth = innerWidth,
  - Esc zatvorí panel a fokus sa vráti na tlačidlo.
  - Odpovede v paneli:
    - „Synovi je 12…“ → téma vek,
    - „3 cm“ → „Myslíš toto?“ [pánsky strih, dlhé vlasy],
    - „15 cm“ → 22 €,
    - „detský strih o 14:00“ → 15 €,
    - de Rückenwaxing a Augenbrauenpiercing → „Meinst du das?“,
    - de Ohrenwaxing → 5,50 €,
    - hu Hátgyantázás → „Erre gondoltál?“,
    - hu Szakállfestés → 10 €.

## 6. Otvorené (nie vážne chyby)

1. „Farbenie mihalníc“ (sk) a „Szempillafestés“ (hu) dajú tému romana-ceny: odovzdanie bez ceny, ale téma
   naznačuje Romanu. Platilo to už pred opravou. Riešenie by bolo pravidlo „neznáme slovo pri téme s cenou“.
2. „10 cm“ a „do 10 cm“ ostávajú dlhými vlasmi 22 €. Odpoveď ukazuje podmienku „nad 10 cm“. Rozlíšenie by
   potrebovalo predložky v 8 jazykoch.
3. Čas bez minút so slovom dieťaťa („detský strih v sobotu o 12“) dá tému vek. Je to bezpečné odovzdanie,
   no pred opravou tu bola správna odpoveď 15 €.
4. Rezerva váhy sk je 18 B (Node). Ďalšie pravidlo bude potrebovať úsporu inde, napríklad v dátach.
5. Z opravy 3 ostáva: „britva na holenie“ → holenie 15 € a „whisky navyše“ → „Ceny sú konečné“.
