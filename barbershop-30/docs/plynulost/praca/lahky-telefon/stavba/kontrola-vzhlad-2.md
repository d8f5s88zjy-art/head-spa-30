# Kontrola vzhľadu a funkcie v prehliadači – kolo 2 (ľahký telefón L1, L2, L3, L5, L6 po oprave 1)

Kontrolór vzhľadu, nezávislý. V stromoch som nič nemenil.

- `$SP` = `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad`
- `$V` = `$SP/barber/lahky-telefon/stavba/vzhlad-2`
- Kontrolovaný stav: `$SP/hs-lahky`, vetva `barbershop-lahky-telefon`, HEAD **f624ee8** (oprava 1).
- Porovnávam s D1 v `$SP/hs-pred-d1` (7ea247c).
- Na konci: `git status --short` je v oboch stromoch prázdny (0 riadkov) a HEAD je stále f624ee8.

**Servery:**
- 8630 = hs-lahky, 8631 = D1. Obe bežali cez `python3 -I -m http.server`.
- Pred testom: `curl -s http://127.0.0.1:863x/barbershop-30/ | grep -o '<title>[^<]*'` vrátil na oboch
  „Barbershop 30 Nitra | Pánske strihy, brada a holenie – rezervácia online“.
- Stromy som rozlíšil cez `grep -c nacitana` v index.html: 2 na 8630, 0 na 8631.
- Na konci som servery ukončil (`curl` vráti 000 na oboch) a `pgrep -c chrom` = 0.

**Prehliadač:**
- Chromium 1194 cez Playwright, vždy len jeden môj naraz.
- Záťaž `/proc/loadavg` bola 0,3–3,6. Časy sú len porovnávacie.
- Disk: počas práce kleslo voľné miesto z 3,0 na 1,5 GB, no nie mojou vinou: `$V` má 16 MB. Surové snímky
  screencastu som po vyhodnotení zmazal (`$V/raw` už neexistuje).

**Nástroje:** `$V/nastroje/`.
- Prevzaté z kola 1: `start.mjs`, `tma.py`, `zhoda.py`, `pas.py`, `skrol.mjs`, `skrol-tma.py`, `karty.mjs`,
  `porovnaj.py`, `lista.mjs`, `videa.mjs`, `pohyb.mjs`.
- Rozšírenia:
  - `start.mjs` zapisuje aktuálnu kartu (`cur`), `is-hold`, `nacitana` a vzorku v 2 200 ms,
  - `skrol.mjs` má `SIET=slow` (Slow 4G), `CAKAJ` (švih pred `load`) a dve sondy:
    - `nahladBezImg`: úvod ukazuje náhľad a `img` má krytie 0,
    - úseky `seg`: aktuálna titulná karta ukazuje vlastnú fotku, cudziu fotku, náhľad, alebo nič.
- Nové: `seg.py`, `pas2.py`, `slucka.mjs` (štart slučky po snímkach), `brana.mjs` (lite/film podľa zariadenia),
  `ziad.mjs`.
- Všetky sondy sú pasívne podľa V5: nikdy nevolajú `decode()`. Čítajú len `img.__dec` aplikácie, opacity, `complete`
  a `naturalWidth`.

## Súhrn

| bod | výsledok |
|---|---|
| (1) čierny štart | **Prešlo pre tmu:** 0 snímok > 90 % tmy po prvom vykreslení, okrem pätičky pri `/#kontakt` (je tmavá podľa návrhu). **Prvá návšteva:** prvá snímka je náhľad úvodu s nadpisom a tlačidlami, ostrá fotka o 230 ms neskôr. **Výhrady:** pri znovunačítaní, späť a `/#tim` je pod kartou dočasne fotka úvodu, a to 0,45–1,5 s (nález 1). Pri EN chýba nadpis ~0,65 s (nález 3). |
| (2) skrol, 3 švihy a skok z menu, pasívna sonda | Na Fast 4G aj Slow 4G **0** viditeľných neúplných alebo nedekódovaných fotiek a 0 neúplných iných obrázkov. **Prešlo.** Na Slow 4G však karty dlho stoja na cudzej fotke úvodu (nález 2). |
| (3) lišta a pätička | Lišta má plné `rgb(14, 13, 12)` bez `backdrop-filter`, text pod ňou nepresvitá, stránka končí pätičkou (rezerva 0 px), tlačidlo neprekrýva text. **Prešlo.** |
| (4) WebGL a požiadavky filmu | 0 WebGL kontextov a 0 požiadaviek three, film.js, seq, hlbka (390 aj 430, štart aj celý skrol). **Prešlo.** |
| (5) videá | Hrá najviac 1 video, plagát je pred štartom a pri štarte nič neposkočí. **Prešlo.** CLS 0,0099 / 0,0081 zo `::before` lišty ostáva (nález 5). |
| (6) titulné karty lite vs D1 `?film=off` | 7 z 9 kariet je zhodných (≤ 1 %). Karta 1 (iná fotka) a karta 4 (slučka Tímu) sa líšia zámerne, ako v kole 1. **Prešlo s výhradou** (rozhodnutie majiteľa). |
| počítač 1440×900 a 600×900 s myšou | Bez lite. S `?film=on` je `world-in` a 2 WebGL kontexty. Úvod a 3 karty sa od D1 líšia o 0,24–1,06 %. **Prešlo.** Bez parametra a bez WebGL má karta 1 pri 600 inú fotku (nález 6). |
| `?film=on` na telefóne | `karty world pro … world-in`, 2 WebGL, 4 požiadavky filmu (390 aj 430). **Prešlo.** |
| `prefers-reduced-motion` | `data-motion=off`, `transform: none`, slučka sa nestiahne (`slucka-req 0`). **Prešlo.** |

## Stav nálezov z kola 1

| nález kola 1 | stav po f624ee8 | dôkaz |
|---|---|---|
| 1 cudzia fotka (rohožka) po znovunačítaní, späť, `/#tim` | **trvá** (nález 1 nižšie) | `start-reload3000-*-detail.jpg`, `start-tim-*-detail.jpg`, `start-spat-390-detail.jpg` |
| 2 fotka úvodu až po nadpise | **opravené**. V prvom vykreslení je náhľad tej istej fotky s nadpisom a tlačidlami. Ostrá fotka: 390 od 1 288 ms (FCP 1 056), 430 podobne. | `start-prva-390-fcp.jpg`, `start-prva-430-fcp.jpg` |
| 3 EN bez nadpisu ~0,6 s | **trvá** (nález 3) | `start-en-390-detail.jpg` |
| 4 snímka FCP = lišta na inku | **opravené**: prvá návšteva má max. tmu po FCP 0,093 (390) a 0,091 (430) | `meta/start-prva-*.json` |
| 5 karta 1 iná fotka ako D1 | trvá, rozhodnutie majiteľa | `porovnanie-karty-390.jpg` |
| 6 slučka mäkšia ako fotky | trvá, rozhodnutie majiteľa | `porovnanie-karty-430.jpg` karta 4 |
| 7 CLS `::before` | **trvá** (nález 5) | `meta/videa-390.json` |

## (1) Čierny štart

Podmienky merania:
- telefón 390×844 a 430×932, DPR 3, `isMobile`, `hasTouch`, CPU 4×, Fast 4G (165 ms, 1,01 MB/s),
- screencast 3,3 s a vzorky DOM v 0, 300, 800, 1 500, 2 200 a 3 000 ms,
- tma je podiel plochy s jasom < 20 (`tma.py`),
- zhoda s konečnou snímkou cez `zhoda.py` (priemerný rozdiel jasu v pásme fotky),
- údaje sú v `$V/meta/start-*.json`.

| scenár | 390: FCP / snímky > 90 % / max. tma | 430 | čo vidno |
|---|---|---|---|
| prvá návšteva | 1 060 / **0** / 0,093 | 951 / **0** / 0,091 | FCP = rozmazaný náhľad rohožky, nadpis, oba tlačidlá a „Prejdi si podnik“; od ~1 290 ms ostrá fotka (zhoda 29,8 → konečná) |
| znovunačítanie pri `scrollY` 3000 | 315 / **0** / 0,248 | 379 / **0** / 0,24 | poloha ostane 3000; **313–366 ms náhľad úvodu bez textu karty, 366–591 ostrá rohožka bez textu, potom text Tímu nad rohožkou, prelínanie na fotku Tímu ~690–750 ms** |
| `/#tim` | 946 / **0** / 0,247 | 1 002 / **0** / 0,234 | prvá snímka je už na kotve (y 2 870 / 3 169), **ale je to náhľad úvodu bez textu, potom text Tímu nad rohožkou až do 2 491 / 2 472 ms**, potom fotka Tímu |
| `/#kontakt` | 943 / 4 (pätička) / 0,925 | 1 114 / 3 (pätička) / 0,936 | prvá snímka je už pätička (y 15 370 / 16 113), bez úvodu a preletu; tma patrí tmavej pätičke |
| späť (`back_forward`) | 30 / **0** / 0,254 | **0** / 0,24 | y 3 000; 143 ms náhľad úvodu, 208 ms ostrá rohožka bez textu, 400 ms text Tímu nad rohožkou, prelínanie ~600–665 ms |
| späť po dopredu | **0** / 0,248 | **0** / 0,236 | rovnako (zhoda: 119 → 639 ms) |
| `b30.lang=en` | 994 / **0** / 0,089 | 882 / **0** / 0,086 | FCP = náhľad + „PREJDI SI PODNIK“ (po slovensky), **nadpis a tlačidlá až od 1 635 / 1 586 ms** (`t-wait`) |

Prvá snímka pred FCP je biela. Je to `about:blank` screencastu, nie stránka (v pásoch „0 ms: nic“ alebo biela).

Pásy (0 / 300 / 800 / 1 500 / 3 000 ms):
- `$V/start-{prva,reload3000,tim,kontakt,spat,en}-{390,430}.jpg`,
- `$V/start-spat-{390,430}-2.jpg`.

Detaily:
- `$V/start-prva-390-fcp.jpg`, `$V/start-prva-430-fcp.jpg`,
- `$V/start-reload3000-390-detail.jpg`, `$V/start-reload3000-430-detail.jpg`,
- `$V/start-tim-390-detail.jpg`, `$V/start-tim-430-detail.jpg`,
- `$V/start-spat-390-detail.jpg`, `$V/start-kontakt-390-detail.jpg`, `$V/start-en-390-detail.jpg`.

## (2) Skrol po celej stránke

Podmienky (`skrol.mjs`):
- 3 švihy (3 rýchle ťahy prsta po 0,75 okna cez `Input.dispatchTouchEvent`), potom menu a skok, potom ťahy až po
  pätičku,
- CPU 4×,
- surové výstupy v `$V/meta/skrol-*.json` a `$V/skrol-*.json`.

| beh | snímok sondy | titulná viditeľná nestiahnutá / nedekódovaná | iné neúplné | náhľad úvodu bez `img` | WebGL / film | chyby |
|---|---|---|---|---|---|---|
| 390 Fast 4G, skok na Galériu | 1 143 | **0 / 0** | **0** | 8 | 0 / [] | [] |
| 430 Fast 4G, skok na Služby | 1 422 | **0 / 0** | **0** | – | 0 / [] | [] |
| 390 **Slow 4G**, švih 400 ms po DOMContentLoaded (`readyState` = `interactive`, teda pred `load`), skok nahor na Tím | 1 541 | **0 / 0** | **0** | 140 | 0 / [] | [] |
| 390 Slow 4G, skok na Galériu | 1 026 | **0 / 0** | **0** | 184 | 0 / [] | [] |
| D1 `?film=off` 390 Slow 4G (porovnanie) | 1 678 | **510** / 874 | 0 | – | – | – |

**Snímky > 90 % tmy:** len otvorené menu (0,90–0,91) a dno pätičky (0,90–0,909). Pri skoku je lišta aj obsah
vidno v každej snímke.

Snímky okolo skoku:
- `$V/skrol-390-skok.jpg`, `$V/skrol-430-skok.jpg`,
- D1 `?film=off`: `$V/skrol-390-skok-d1off.jpg`.

**Čo vidí návštevník (úseky `seg.py`, aktuálna karta = titulná karta v strede okna):**

| beh | vlastná fotka | cudzia fotka | nič (len náhľad úvodu alebo ink) |
|---|---|---|---|
| lite 390 Fast 4G | 7 122 ms | 3 264 ms, úseky 110–628 ms | 0 |
| D1 `?film=off` 390 Fast 4G | 10 479 ms | 4 641 ms, úseky 358–1 039 ms | 0 |
| lite 390 Slow 4G, skok na Tím | 1 948 ms | **7 296 ms**, z toho Tím na rohožke **3 217 ms** a kreslo na rohožke 1 407 ms | 1 583 ms |
| lite 390 Slow 4G, skok na Galériu | 96 ms | **5 592 ms**, z toho Galéria (káva) na rohožke **3 390 ms** | 1 604 ms |
| D1 `?film=off` 390 Slow 4G | 15 072 ms (vrátane 510 snímok neúplných fotiek) | 3 553 ms | 2 294 ms + snímky > 90 % tmy (4 564–5 000 ms, 0,92–0,96) |

- Na Fast 4G je cudzia fotka len bežné prelínanie riadené skrolom: susedná fotka dobieha, kým nová karta prechádza
  stredom okna. Lite je tu kratší ako D1.
- Na Slow 4G ide o skutočné čakanie (nález 2). Pásy:
  - `$V/skrol-390-slow4g-svihy.jpg`,
  - `$V/skrol-390-slow4g-po-skoku-tim.jpg`,
  - `$V/skrol-390-slow4g-skok-galeria.jpg`,
  - `$V/skrol-390-slow4g-skok-tim.jpg`,
  - D1: `$V/skrol-390-slow4g-skok-tim-d1off.jpg`.

## (3) Lišta a pätička (`lista.mjs`, `$V/lista/lite-{390,430}.json`)

- Vo všetkých polohách (Tím, cenník, galéria, kontakt, koniec): `is-scrolled`, `bg rgb(14, 13, 12)`,
  `backdrop-filter: none`.
- Text pod lištou (napr. „Pánsky strih“, „18 €“) je zakrytý. Najjasnejší bod v pásme 62–80 px pod lištou má jas
  120 (prechod `::before`), v lište je len logo a ikony.
- `rezervaPodPatickou: 0` (390 aj 430), tieň `0 422px` a `0 466px`.
- `ctaPrekryvaText: []`, stránka končí riadkom „© 2026 … / Späť hore“.
- Obrázok: `$V/lista-patka-390.jpg` (cenník | Tím | koniec).
- Bublina „This page is also in English“ zakrýva pri anglickom jazyku prehliadača časť copyrightu. Rovnako je to
  v D1 (`vzhlad-1/lista/d1off-390-koniec.jpg`), takže nejde o regresiu L1. Majiteľov iPhone je po slovensky.

## (4) WebGL a požiadavky

`brana.mjs` (`$V/meta/brana-lite.json`, `brana-d1.json`):

| zariadenie | lite (f624ee8) | D1 |
|---|---|---|
| tel. 390 / 430 bez parametra | `karty lite world-off`, gl 0, film 0 | `world world-frame world-off`, gl 1, film 2 |
| tel. 390 / 430 `?film=on` | `world pro … world-in`, gl 2, film 4 | `world-in`, gl 2, film 5 |
| tel. 390 `reduce` | `lite`, `motion off`, gl 0, film 0 | `world-off`, film 2 |
| PC 1440 / 600 bez parametra | `world … world-frame world-off`, gl 1 (ako D1) | rovnako |

V skrole po celej stránke je `film: []` vo všetkých lite behoch.

## (5) Videá

`videa.mjs` (`$V/meta/videa-{390,430}.json`):
- `maxHraju 1`, `hrajuViac 0`, `bezPlagatu []`,
- hrala len `tim-slucka-864.webm` s plagátom `tim-slucka-poster-864.webp`,
- požiadavky: `strih.webm` (zvuk nožníc z atmosfera.js) a `tim-slucka-864.webm`.

`slucka.mjs` (prst sa zastaví v zábere Tím):
- `play` 1 283 ms, `playing` 1 343 ms po zastavení (pravidlo `POKOJ_MS` 800 ms),
- rozdiel susedných snímok v pásme fotky: pri štarte 3,14, počas pohybu videa 1,0–2,2,
- obrázok rozdielu (`$V/slucka-start-390.jpg`, pravý panel ×6) ukazuje len tenké hrany, žiadny posun ani zmenu
  výrezu. **Nič neposkočí.**

Posun rozloženia: `0,0099` (390, y 83) a `0,0081` (430, y 93), zdroj `::before`. Pozri nález 5.

## (6) Titulné karty: lite vs D1 `?film=off`

Porovnávacie obrázky: `$V/porovnanie-karty-390.jpg`, `$V/porovnanie-karty-430.jpg`.
Snímky jednotlivých kariet sú v `$V/karty/`.

| karta | rozdiel 390 / 430 (bez lišty a spodku) | fotka lite | fotka D1 off |
|---|---|---|---|
| 0 rohožka | 0,32 / 0,2 % | `rohozka-m-1448.avif` | rovnaká |
| 1 sala („Poď ďalej.“) | 17,71 / 17,72 % | `sala-m-1448.avif` | `seq/vstup-dnu/f025.avif` |
| 2 stôl, 3 čakáreň, 5 kreslo, 6 káva, 7 sud, 8 vstup | 0,0–0,23 % | `*-m-1448.avif` | rovnaké |
| 4 sala-rano („Komu zveríš hlavu?“) | 18,67 / 18,63 % | `sala-rano-m-1448` a hrajúca slučka tímu (L6) | `sala-rano-m-1448` (statická) |

Texty, typografia, farby, karty a tlačidlá sú vo všetkých 9 kartách zhodné.

## Počítač s myšou

**`?film=on`:**
- 1440 aj 600: oba stromy `world-in`, gl 2,
- rovnaké stavy filmu:
  - 1440: S 1 / 2,85 / 4,85 (D1 4,86) / 6,97, `cur` `rohozka`, `stol`, `sala-rano`, `kava`,
  - 600: S 1 / 2,85 / 4,86 / 6,98, `cur` `rohozka-m`, `stol-video`, `sala-rano-video`, `kava-m`.
- Rozdiel snímok: 1440 0,51–0,96 % a 600 0,26–0,79 %. Vizuálne bez rozdielu (`$V/porovnanie-pc-1440.jpg`,
  `$V/porovnanie-pc-600.jpg`).

**Bez parametra (headless kreslí softvérovo, takže film sa vypne v oboch stromoch, `world-frame world-off`):**
- úvod a stôl sú zhodné,
- **karta 1 má pri 600 inú fotku**: lite `sala-m-1086`, D1 `seq/vstup-dnu/f025` (nález 6, `$V/porovnanie-pc-600-bezfilmu.jpg`).

## Nálezy

1. **Stredná – po znovunačítaní, návrate späť a pri `/#tim` je pod kartou najprv fotka úvodu, prvé snímky sú bez textu karty.**
   (Trvá z kola 1, po oprave 1 so zmenou: náhľad úvodu je teraz prvá snímka.)
   - Dôkaz:
     - `start-reload3000-390-detail.jpg`: 313 ms rozmazaný náhľad rohožky bez textu, 366 ms ostrá rohožka bez textu,
       591 ms text „Komu zveríš hlavu?“ nad rohožkou, 751 ms prelínanie na fotku Tímu.
     - `start-reload3000-430-detail.jpg`: rovnako 372 → 805 → 900 ms.
     - `start-tim-390-detail.jpg`: 943 ms náhľad bez textu, 1 200–2 491 ms text Tímu nad rohožkou. `/#tim` 430:
       1 000–2 472 ms.
     - `start-spat-390-detail.jpg`: 143 → 208 → 400 → ~665 ms.
     - Vzorky `meta/start-reload3000-390.json` v 300 ms: `st [['rohozka','1.00',…'nac'], ['sala-rano','0.01',…]]`,
       `cur: 'sala-rano'`.
   - Príčina:
     - náhľad aj fotku úvodu klonuje hlavička (`index.html:29`, `nacitana`) bez ohľadu na obnovenú polohu alebo kotvu,
     - app.js:287 `(s.first && !anyDec)` (poistka úvodu) a pravidlo najnižšieho záberu app.js:296–302 nechajú úvod
       pod cudzou kartou, kým sa dekóduje cieľová fotka.
   - Kritérium „fotka + nadpis + tlačidlá od začiatku“ tu teda platí len pre lištu a spodné tlačidlá. Fotka aj nadpis
     karty sú v prvých 250–300 ms cudzie alebo chýbajú.
   - Návrh:
     - pri štarte so `scrollY > 0`, pri `back_forward` alebo pri `location.hash` klonovať do zálohy úvodu namiesto
       rohožky fotku aktuálnej karty (rovnaký `-m` súbor, je v cache prehliadača),
     - alebo aspoň neukazovať náhľad úvodu, keď cieľ nie je úvod, a nechať `--ink-2` s textom karty len na tých
       ~200–300 ms. Treba rozhodnúť s ohľadom na zásadu „žiadne čierne okná“.
2. **Stredná – na Slow 4G stoja karty sekundy na cudzej fotke úvodu (rohožka), najmä po skoku z menu.**
   - Dôkaz (`seg.py`, `meta/skrol-390-slow-lite-2.json`, `skrol-390-slow-galeria.json`):
     - Tím nad rohožkou **3 217 ms** po skoku a fotka Tímu sa do ďalšieho ťahu neukázala
       (`skrol-390-slow4g-po-skoku-tim.jpg`, snímky 12 000–15 000 ms),
     - Galéria nad rohožkou **3 390 ms** (`skrol-390-slow4g-skok-galeria.jpg`),
     - pri prvých švihoch je pod kartami „Poď ďalej.“, „Vzadu ťa čaká káva.“ rozmazaný náhľad úvodu a „Čo to bude dnes?“
       je nad ostrou rohožkou (`skrol-390-slow4g-svihy.jpg`).
     - Cudzia fotka spolu 7,3 s (skok na Tím) a 5,6 s (skok na Galériu). Vlastná fotka len 1,9 s a 0,1 s.
   - Pre porovnanie: D1 `?film=off` má na tej istej trase **510 snímok s neúplnou fotkou** a snímky > 90 % tmy
     (`meta/skrol-390-slow-d1off.json`). Lite je teda podľa sťažnosti majiteľa lepší (nič neúplné, nič čierne), ale
     majiteľ na mobilných dátach uvidí nesprávnu fotku pod textom karty. Súvisí s POZIADAVKY bod 5.
   - Návrh:
     - po skoku z menu dať cieľovej fotke `fetchpriority="high"` a ostatným zálohám a galérii nízku prioritu alebo
       odklad, kým cieľ nie je hotový,
     - alebo použiť náhľad (`--nahlad`, ~0,5 kB) aj pre ostatné titulné karty, teda tú istú fotku a výrez, nie nový
       záber. SPEC L3 bod 4 dnes dovoľuje náhľad len pre prvú fotku, takže ide o rozhodnutie orchestrátora.
     - Ukázať majiteľovi (V8).
3. **Drobná – pri `b30.lang=en` je prvých ~0,65–0,7 s len náhľad bez nadpisu a tlačidiel. Popis „PREJDI SI PODNIK“ je
   dovtedy po slovensky.**
   - Dôkaz: `start-en-390-detail.jpg`. FCP 991 ms bez nadpisu, 1 484 ms ostrá fotka so slovenským popisom bez nadpisu,
     1 635 ms anglický nadpis a tlačidlá. 430: 880 → 1 586 ms.
   - Vzorka v 800 ms: `cls 'karty t-wait lite …'`, `h1 0`, `btn 0`.
   - Príčina: `t-wait` (style.css, správanie D1, nie regresia).
   - Návrh: v lite skryť pri `t-wait` len text, ktorý sa prekladá, tlačidlá nechať viditeľné, alebo skrátiť `t-wait`,
     keď je preklad už v cache.
4. **Drobná – `/#kontakt` je od prvej snímky pätička (správne), ale tá je tmavá podľa návrhu: 3–4 snímky majú
   0,92–0,94 tmy.**
   - Nejde o chybu, len o vysvetlenie čísel pre kritérium „> 90 %“. Lišta, logo a texty pätičky sú viditeľné
     (`start-kontakt-390-detail.jpg`).
5. **Drobná – posun rozloženia 0,0099 (390) a 0,0081 (430) zo `::before` lišty pri prvom skrole.**
   - Trvá z kola 1. D1 má `cls 0`.
   - Dôkaz: `meta/videa-390.json`, `posuny [{v: 0.0099, y: 83, src: ['::before.']}]`.
   - Návrh: `::before` mať v rozložení vždy a meniť len `opacity`.
6. **Drobná – na počítači bez WebGL (`world-off`) a pri šírke ≤ 720 px má karta 1 inú fotku ako D1.**
   - Dôkaz:
     - `ziad.mjs` pri 600×900 bez parametra: lite stiahne len `assets/film.js`, D1 aj `seq/vstup-dnu/f025.avif`,
     - `porovnanie-pc-600-bezfilmu.jpg`, karta 1: lite `sala-m-1086.avif`, D1 `f025.avif`, rozdiel 17,8 %.
   - Ak film beží (`?film=on`, `world-in`), je zhodné.
   - Dotýka sa len počítača, kde film nebeží. Patrí k rozhodnutiu o karte 1 (nález 5 kola 1). Ak má počítač ostať
     presne ako D1, výmenu `f025` → `sala-m` obmedziť na `html.lite`.
7. **Na rozhodnutie majiteľa (bez zmeny od kola 1):**
   - karta 1 „Poď ďalej.“ má inú fotku ako D1 na telefóne,
   - slučka Tímu je mäkšia ako susedné fotky (`porovnanie-karty-430.jpg`, karta 4),
   - náhľad úvodu na pomalej sieti (rozmazaný začiatok),
   - pozri oprava-1.md, „Čo ostáva“ bod 2.

## Čo nemožno overiť v Chromiu (ostáva na iPhone)

- odraz na konci a `env(safe-area-inset-bottom)`,
- dekódovanie AVIF v Safari a výber 1448 alebo 1086,
- bfcache v Safari (v tomto Chromiu bol návrat `back_forward` s novým vykreslením),
- automatické prehrávanie a úsporný režim pri slučke,
- skutočný švih s dobehom (CDP ťah nemá dobeh).

## Cesty k snímkam a porovnaniam (všetky v `$V`)

- **Čierny štart, pásy 0/300/800/1500/3000 ms:**
  - prvá návšteva: `start-prva-390.jpg`, `start-prva-430.jpg`,
  - znovunačítanie: `start-reload3000-390.jpg`, `start-reload3000-430.jpg`,
  - kotvy: `start-tim-390.jpg`, `start-tim-430.jpg`, `start-kontakt-390.jpg`, `start-kontakt-430.jpg`,
  - späť: `start-spat-390.jpg`, `start-spat-390-2.jpg`, `start-spat-430.jpg`, `start-spat-430-2.jpg`,
  - angličtina: `start-en-390.jpg`, `start-en-430.jpg`.
- **Detaily štartu:**
  - prvé vykreslenie: `start-prva-390-fcp.jpg`, `start-prva-430-fcp.jpg`,
  - znovunačítanie: `start-reload3000-390-detail.jpg`, `start-reload3000-430-detail.jpg`,
  - kotvy: `start-tim-390-detail.jpg`, `start-tim-430-detail.jpg`, `start-kontakt-390-detail.jpg`,
  - späť a angličtina: `start-spat-390-detail.jpg`, `start-en-390-detail.jpg`.
- **Skrol a skok:**
  - Fast 4G: `skrol-390-skok.jpg`, `skrol-430-skok.jpg`, `skrol-390-skok-d1off.jpg`,
  - Slow 4G: `skrol-390-slow4g-svihy.jpg`, `skrol-390-slow4g-skok-tim.jpg`, `skrol-390-slow4g-po-skoku-tim.jpg`,
    `skrol-390-slow4g-skok-galeria.jpg`, `skrol-390-slow4g-skok-tim-d1off.jpg`.
- **Lišta a pätička:** `lista-patka-390.jpg`, `lista/lite-{390,430}-{tim,cennik,koniec,pretiahnutie}.jpg`.
- **Videá:** `slucka-start-390.jpg`.
- **Karty (porovnanie s D1 `?film=off`):** `porovnanie-karty-390.jpg`, `porovnanie-karty-430.jpg`, `karty/*.jpg`.
- **Počítač:** `porovnanie-pc-1440.jpg`, `porovnanie-pc-600.jpg`, `porovnanie-pc-600-bezfilmu.jpg`, `pc/*.jpg`.
- **Údaje:** `meta/*.json` (štart, skrol, videá, brána), `lista/*.json`, `karty/*.json`, `pc/*.json`.
