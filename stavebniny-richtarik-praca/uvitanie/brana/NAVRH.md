# Uvítanie „Brána“ (smer B): prototyp pred dnešným úvodom, Stavebniny Richtárik, 5. 11. 2026

Rola: senior motion a web dizajn. Majiteľ chce pred tovarom krátke uvítanie so silným hookom. Smer B: dve svetlé krídla
brány s pozdravom sa otvoria do dvora, kamera vojde dnu, na paletách sa rozsvietia štítky a obraz sa usadí do dnešného úvodu.

- **Východisko:** `git archive richtarik-profi` (commit **a9dd53d2**, `COMMIT.txt`) rozbalený do `/dev/shm/uvitanie-brana/`.
  Nezmenená kópia A je `stavebniny-richtarik-A`, prototyp B je `stavebniny-richtarik`.
- Do `hs-richtarik-obnova` som nič nepísal. `git status --short` tam ukazuje ` M stavebniny-richtarik/assets/site.css`
  (pred tým `README.md`). To sú zmeny druhého zapisovateľa (zf), ktorý tam práve robí filmové prechody.
- Servery 9810 (A), 9811 (B) a 9812 (hostiteľ iframe) som po meraní ukončil (`pgrep` → „servery ukončené“).
- Kód je vlastný: CSS a WAAPI, bez knižnice a CDN. Nie je tu žiadny nový obrázok, video ani generovaný záber.
  Uvítanie používa **tú istú fotku dvora** (`img/uvod/dvor-t-*` na telefóne, `dvor-p-*` na počítači) s rovnakým
  `srcset` a `sizes` ako úvod, takže sa stiahne raz.
- `grep -ow AI` v `prototyp/index.html` a v `zdroj/*` vráti 0 riadkov.

## 0. Zhrnutie

| | A (dnes) | B (brána) |
|---|---|---|
| Telefón 390×844, DPR 3, CPU 4×, 4G: LCP (medián, 6 behov) | 1058 ms | **1006 ms** |
| Telefón, CPU 4×, 4G: úvod použiteľný (H1, Zavolať, vyhľadávanie) | 1,60 s (max 1,73) | **2,49 s (max 2,50)** |
| Telefón, CPU 4×, Slow 4G: LCP a použiteľný | 3324 ms a 3,62 s | 3392 ms (+68 ms) a 3,80 s (rýchla cesta) |
| Počítač 1440×900: LCP a použiteľný | 306 ms a 1,06 s | 252 ms a 1,93 s (max 1,98) |
| CLS (najviac) | 0 tel., 0,0004 PC | 0 tel., 0,0006 PC (rovnaký posun v 0,1 – 0,3 s ako v A, ešte pred uvítaním) |
| Bajty navyše | – | 0 obrázkov. `index.html` +15,0 kB, po gzip **+4,7 kB**. `site.js` +0,4 kB, po gzip +0,14 kB |
| Najnižší jas snímky | 173 tel., 162 PC | **121 tel., 118 PC**: je to jas samotnej fotky dvora (115 – 119), brána má 240 – 248 |
| Dlhé snímky (rAF > 50 ms) počas pohybu brány, tel. CPU 4× | – | 0 v 4 zo 6 behov (záťaž stroja 6 – 8, pozri 4.3) |

**Verdikt:** funguje, je svetlé, preskočiteľné a odovzdanie je plynulé. LCP ani CLS sa nezhoršili a obrázok navyše nie je
žiadny. Cieľ „použiteľné do 2,5 s“ na telefóne s CPU 4× a 4G **tesne plní**, pretože uvítanie zrýchli samo seba
(časť 3). Daňou je čakanie: približne **+0,9 s** do použiteľného úvodu, ale len pri prvej návšteve v relácii a len pri
príchode zvonka.

## 1. Hook

Fakty sú len z FAKTY.md a tón podľa STYL.md: vykanie, bez výkričníkov a superlatívov, bez „zadarmo“.

| # | Na krídlach brány (pozdrav + hook) | Po otvorení na fotke | Sila | Prečo áno / nie |
|---|---|---|---|---|
| **1 (vybraný)** | malým: „Stavebniny Richtárik · od roku 1997“ · veľkým: **„Vitajte. Poďte ďalej.“** | odznak **„Skutočná fotka nášho dvora v Nitre“** a štítky na paletách | 4/5 | Slovo a pohyb sú jedno: hostiteľ povie „poďte ďalej“ a brána sa v tej istej sekunde otvorí. Má 3 slová, prečítajú sa za menej ako 0,4 s. Je to pozvanie, nie tvrdenie, takže nie je čo vyvracať. Rodinná firma od 1997 (FAKTY A). Dôkaz („skutočná fotka“, FAKTY F) príde hneď po otvorení a ostane ako odznak úvodu. |
| 2 | „Žiadna ilustračná fotka.“ | „Toto je náš dvor v Nitre.“ | 4/5 dôvera, 2/5 privítanie | Najsilnejší rozdiel voči odvetviu (inspiracia/odvetvie: dvor neukazuje nikto), ale prvé slová sú záporné a nevítajú. Množné „žiadne ilustračné fotky“ by bolo nepravdivé, lebo kategórie majú fotky z Pexels. Pravdivú časť som preto dal do odznaku pri variante 1. |
| 3 | „Rodinná firma v Nitre od roku 1997.“ | „Pozrite sa na náš dvor.“ | 3/5 | Pravdivé (FAKTY A), no 7 a 5 slov sa za 0,6 s neprečítajú a pôsobí to ako vizitka, nie ako pozvanie. |

**Štítky na paletách:** sú len tam, kde to fotka naozaj ukazuje. Výrezy som otvoril: `snimky/zoom1.jpg` (obal s nápisom
„betonárka“), `snimky/zoom3.jpg` a mriežky `snimky/dvor-*-mriezka.jpg`.

| Štítok | Kde | Opora |
|---|---|---|
| **Betónové tvárnice** · murovací materiál | vysoké zabalené stohy | obal „betonárka“; FAKTY F (Murovací materiál, Betonárka Nadlice; značku som neuvádzal, lebo Nadlice na obale nečítam) |
| **Betónové výrobky** · na paletách | voľné betónové prvky vpredu | FAKTY D1 (betónové výrobky); presný druh (šalovacie, krycie dosky) sa z fotky overiť nedá, preto je štítok všeobecný |
| **Doprava na stavbu** · po celom Slovensku | štrková ulička, kade odchádza tovar | FAKTY B (doprava vlastnými autami po celom Slovensku) |

Na fotke dvora nie sú tehly TermoBRIK, Porfix ani rezivo. Štítky s nimi by boli nepravdivé. Tieto zásoby ukáže hneď potom
dnešný strih úvodu (4 výtlačky). Preto sú štítky 3 a z nich 2 sú sortiment. Dva sú na každom zariadení, tretí
(„Betónové výrobky“) je v inom bode záberu.

## 2. Scenár po desatinách sekundy

Časy sú od začiatku otvárania `t0`, keď je fotka vykreslená a uplynulo aspoň 0,38 s od prvého vykreslenia (FCP).
Pri `k = 1` (počítač) je `t0` ≈ 0,6 – 0,7 s od navigácie. Na telefóne pri CPU 4× a 4G je `t0` ≈ 1,19 – 1,25 s a `k` = 0,93 – 0,98.
Všetky časy sa násobia `k` (časť 3). Namerané `brCas` sú v `mer/*.jsonl`.

| čas | obraz | text | technika |
|---|---|---|---|
| FCP + 0,0 | zatvorená brána, papier #faf8f4 s jemnými latkami, v strede tehlová spára | | prvok zo `<template>`, vložený pred prvým vykreslením |
| FCP + 0,0 – 0,4 | spára sa nakreslí zhora nadol | „Vitajte.“ a „Poďte ďalej.“ vyjdú z drážky (0,34 s, druhý riadok +0,06 s), nadpisok stojí | CSS `transform` |
| FCP + 0,38 až `t0` | brána drží, kým prehliadač fotku nevykreslí (LCP) alebo nedekóduje | pozdrav sa dá čítať | PerformanceObserver `paint` a `largest-contentful-paint`, záloha `img.decode()` |
| t0 + 0,0 – 0,1 | krídla sa pohnú. Nápis cez obe krídla sa v spáre rozdelí | | WAAPI `rotateY` okolo vonkajších pántov, `perspective` 1300 px |
| 0,1 – 0,4 | brána sa otvára do dvora, za ňou je celá fotka dvora | | `cubic-bezier(.6,0,.22,1)` |
| 0,2 – 0,4 | | odznak **„Skutočná fotka nášho dvora v Nitre“** vľavo hore, zväčšený (PC 1,8×, tel. 1,3×) | `opacity` |
| 0,2 / 0,3 / 0,4 | | štítky sa rozsvietia za sebou (pečiatka 0,28 s a pulz krúžku na špendlíku 0,65 s) | `transform`, `opacity`, `::before` |
| 0,5 – 0,6 | krídla dosadnú takmer naplocho (78° → 88°) a zmiznú | | |
| 0,0 – 0,6 | kamera jemne vojde dnu, 1,00 → 1,06 k úbežníku uličky | | `scale` na vnútornej vrstve |
| 0,6 – 0,7 | **usadenie:** celoplošný záber sa zmenšuje do rámu úvodu, kamera sa vracia na 1,00 | odznak sa zmenšuje a ide presne na odznak úvodu | okno `scale(sx,sy)` a scéna s opačnou mierkou (19 kľúčových snímok), len transform |
| 0,8 | odkrýva sa lišta a text úvodu | H1 „Dvor plný materiálu.“ vyjde z drážky | WAAPI na `.uv h1 .ln>span` |
| 0,9 | | 2. riadok H1, ponuka, Zavolať a vyhľadávanie vyjdú (14 px, z 0,2 na 1) | |
| 0,9 – 1,1 | štítky zhasnú, fotka dosadá | | |
| 1,17 | fotka je presne v ráme úvodu | | |
| 1,17 – 1,26 | prelnutie 90 ms do skutočného úvodu (rovnaká poloha) | štítok „Náš dvor“ sa vrazí ako pečiatka (0,36 s) | uvítanie sa odstráni z DOM |
| 1,3 | **úvod je použiteľný** | | |
| 1,5 – 4,5 | dnešný strih zásob: Tehly, Pórobetón, Dlažby a obrubníky, Stavebné rezivo | | `site.js` čaká na udalosť `br-koniec` |

**Prečo takto:** Najprv upratať (pozdrav), potom hlavný ťah (otvorenie a dôkaz), potom detaily (štítky) a odovzdanie.
Je to rovnaká choreografia ako v POHYB.md §1. Žiadna plocha nie je tmavá. Podklad krídel aj prelnutia je papier.

## 3. Ako to funguje

- **Kedy sa uvítanie ukáže** (skript v `<head>`, trieda `br-ide` pred prvým vykreslením):
  - musí byť „bez obmedzenia pohybu“ a v adrese nesmie byť kotva;
  - nesmie byť zapnuté šetrenie dát (`saveData`);
  - navigácia musí byť typu `navigate` (nie Späť ani obnovenie) a referer nesmie byť z toho istého webu;
  - v `sessionStorage` ešte nesmie byť `br-videne`;
  - okno musí mať aspoň 420 × 300 px.

  Bez JS je `<template>` nečinný a nič sa nestiahne. Pri `br-ide` sa nezapína dnešný `uv-ide`, takže sa nič nehýbe dvakrát.
- **Rovnaká fotka, žiadny skok:** okno uvítania má rozmer obrazovky a len cez `transform` sa zmenší na `.uv-ram`.
  Scéna s fotkou v pomere strán sa vo vnútri zmenšuje opačne. Cieľ sa počíta z `getBoundingClientRect()` obrázka úvodu,
  takže zahŕňa aj jeho posun pri odchode (view timeline: translate 0,45 %, scale 1,0019) a `object-position`.
  Rozloženie sa nemení. Pokus s prestavaním okna na rám úvodu dal **CLS 0,23 na telefóne a 0,096 na PC**, preto som ho vrátil.
  Na konci je 90 ms prelnutie. Pri meraní posunu medzi poslednou snímkou uvítania a úvodom (`nastroje/posun.py`, predchádzajúca
  zostava s rovnakou matematikou usadenia) bol najlepší posun **(0, 0) px**. Zvyšný rozdiel jasu 17 je len iná cesta rastra
  (prevzorkovanie, `snimky/v-tel-detail.jpg`) a prelnutie ho skryje.
- **Rýchlosť:**
  - Ak sa brána otvára neskoro, všetky časy sa násobia `k = (2450 − t0) / 1290`, najmenej 0,72.
    Na telefóne pri 4G a CPU 4× to bolo 0,77 – 0,98.
  - Ak je FCP neskôr ako 1,5 s (Slow 4G), brána len pozdraví a otvorí sa rovno na úvod bez fotky („rýchla cesta“).
    Rovnako to urobí, keď fotka nie je vykreslená do 0,9 s od FCP.
  - Poistka: po 6 s sa uvítanie odstráni vždy.
- **Preskočenie:** `pointerdown` (ťuk aj klik), `wheel`, `touchstart`, `keydown` (každý kláves vrátane Tab) aj posun vyvolajú
  prelnutie 0,2 s. Text úvodu je hneď na mieste a strih zásob sa vtedy nespustí. Uvítanie ukončí aj `pagehide` a skrytie karty.
  Kým uvítanie beží, ťuk nikam nepreklikne.
- **Hlavné vlákno:** príprava pohybu trvá 2 – 24 ms pri CPU 4× (`brCas.js`). Zvyšok beží v kompozítore (`transform`, `opacity`).
- **Prístupnosť:** uvítanie má `aria-hidden="true"` a 0 prvkov s fokusom. H1 a celý úvod sú v HTML od začiatku (SEO).
  V strome prístupnosti nie je „Vitajte“, H1 tam je. Prvý Tab ukončí uvítanie a fokus je na „Preskočiť na obsah“.

## 4. Merania A/B (`nastroje/ab.sh`, `meraj.mjs`, `suhrn.py` → `mer/suhrn.txt`)

Behy sa striedali A/B. Bez vyrovnávacej pamäte. Telefón: 390×844, DPR 3, touch, CPU 4×. 4G: 170 ms, 9 Mb/s.
Slow 4G: 562 ms, 1,6 Mb/s. Počítač: 1440×900 bez obmedzenia.
**Stroj bol počas merania vyťažený inými procesmi (load average 4 – 8,4, iný agent spúšťal Playwright), čísla sú preto skôr pesimistické.**

### 4.1 Načítanie a použiteľnosť (mediány)

| | FCP | LCP (min – max) | CLS max | použiteľný (max) | kB za 6 s (bez gzip) |
|---|---|---|---|---|---|
| tel. 4G A | 888 | 1058 (936 – 1256) | 0 | 1598 (1727) | 1400 |
| tel. 4G B | 820 | 1006 (916 – 1336) | 0 | **2493 (2504)** | 1418 |
| tel. Slow 4G A | 2912 | 3324 | 0,0001 | 3621 | 1371 |
| tel. Slow 4G B | 2860 | 3392 | 0,0001 | 3800 (rýchla cesta) | 1389 |
| PC A | 306 | 306 | 0,0004 | 1056 (1261) | 2141 |
| PC B | 252 | 252 | 0,0006 | 1927 (1976) | 2159 |

- **Použiteľný** znamená prvú snímku, v ktorej uvítanie nie je v DOM, H1, Zavolať a vyhľadávanie sú zasiahnuteľné
  (`elementFromPoint`), riadky H1 sú do 1,5 px na mieste a ponuka má plnú priehľadnosť.
- LCP prvok je v A aj v B `IMG` v `.uv-ram` (`dvor-t-1448.avif` alebo `dvor-p-1720.avif`). LCP sa v rámci šumu nezhoršil:
  v B je dokonca nižší, v Slow 4G +68 ms.
- **Bajty navyše:** fotka dvora je v zozname stiahnutých súborov raz (`mer/*.jsonl` → `obrazky`). Rozdiel 15 – 18 kB je len HTML.
  Po minifikácii vloženého CSS a JS (`zdroj/zloz.py`) je to 59 726 B namiesto 44 678 B, po gzip 15 744 B namiesto 11 055 B
  (+4,7 kB). Kontrolné behy minifikovanej zostavy: tel. LCP 968 a 1040, použiteľný 2466 a 2487, CLS 0, chyby 0.
  PC: LCP 216 a 236, použiteľný 1873 a 1898.

### 4.2 Plynulosť

| | rAF > 50 ms po FCP do 4,5 s (na beh) | z toho počas pohybu brány (t0 až koniec) |
|---|---|---|
| tel. 4G A | 3, 3, 2, 5, 2, 2 (max 250 ms) | – |
| tel. 4G B | 8, 6, 5, 5, 2, 2 (max 233 ms) | **4, 0, 2, 0, 0, 0** |
| PC A | 0, 1, 0, 0, 0, 0 | – |
| PC B | 1, 1, 1, 0, 0, 2 | **0, 0, 0, 0, 0, 1** |

Dlhé snímky pred `t0` sú načítanie stránky (LoAF bez skriptov, layout 41 ms). Majú ich A aj B.
Dlhé snímky počas pohybu sú LoAF 52 – 58 ms bez skriptu a bez layoutu. Objavili sa len v behoch s najvyššou záťažou stroja
(7,3 – 8,4). V skoršej sade pri záťaži 2,2 – 3,3 bolo 0 zo 6 behov. Tá sada však bežala s predchádzajúcou verziou usadenia,
ktorú som zahodil kvôli CLS, takže ju beriem len ako náznak. **Cieľ „0 snímok nad 50 ms“ som teda na tomto vyťaženom stroji
nepreukázal vo všetkých behoch.**

### 4.3 Kompozítor a záznam obrazovky

- V zázname obrazovky (CDP screencast) je pri usadení medzera 0,18 – 0,27 s bez snímky.
  Stopa (`nastroje/stopa.mjs`, `mer/stopa-tel-B-1.json`) v tom istom behu ukazuje, že `Display::DrawAndSwap` ide ďalej bez
  medzery. Je to teda chyba zachytávania, nie zastavený obraz. Overil som to dvakrát (screencast 1823 ms / 269 ms,
  DrawAndSwap bez medzery).
- Kým som to zistil, vylúčil som tieto príčiny: krídla, usadenie, kameru, texty, štítky, `pointer-events`, strih zásob,
  zakrytie stránky a blur lišty (po 2 – 3 behy každej varianty).
- Softvérový kompozítor v headless Chromiu kreslí snímku 40 – 60 ms a niekedy 85 – 147 ms, najmä pri prvom odkrytí fotky.
  Na skutočnom telefóne s GPU to treba overiť (riziko R2).

## 5. Kontroly (`nastroje/kontroly.mjs` → `mer/kontroly-mini.json`, minifikovaná zostava; všetko OK)

| kontrola | výsledok |
|---|---|
| ťuk pri zatvorenej bráne | koniec `preskocene: true`, uvítanie preč za 0,2 s (s réžiou nástroja 0,26 s), URL sa nezmenila, H1 a Zavolať zasiahnuteľné, strih zásob sa nespustí |
| ťuk, klik, Tab pri otvorenej bráne | rovnako (0,28 – 0,38 s s réžiou) |
| koliesko (PC) | rovnako, stránka sa posunie o 300 px (koliesko nie je zablokované) |
| šípka nadol pri zatvorenej bráne | rovnako, posun 40 px |
| celé uvítanie bez zásahu | `preskocene: false`, potom beží strih zásob, 0 chýb |
| druhá návšteva v relácii, obnovenie | `br-ide: false`, žiadne uvítanie, dnešný úvod (`uv-ide`) |
| príchod z inej stránky webu (Katalóg → logo) | žiadne uvítanie (referer z toho istého webu) |
| obmedziť pohyb (390 aj 1440) | `br-ide: false`, žiadny prvok `.br`, ani `uv-ide` |
| bez JS | `.br` neexistuje, `<template>` je nečinný, H1 je viditeľný (`snimky/bez-js-390.jpg`) |
| kotva `#obsah` | žiadne uvítanie |
| šetrenie dát (`saveData: true`) | žiadne uvítanie |
| prístupnosť | `aria-hidden="true"`, 0 prvkov s fokusom, strom bez „Vitajte“, H1 v strome |
| iframe z iného pôvodu (bez sandboxu; `allow-scripts allow-same-origin`; len `allow-scripts`) | 0 chýb JS v rámcoch. Konzola má 16 hlásení (8× CORS písma a 8× ERR_FAILED), **rovnako v A aj v B** (`mer/iframe.json`). Vznikajú len v rámci s nepriehľadným pôvodom. Prvý rámec uvítanie ukázal, druhý už nie (spoločný `sessionStorage`), tretí áno (úložisko nie je dostupné, ukáže sa a skončí). |

Prehľad snímok, ktorý som otvoril: `snimky/kontroly-prehlad.jpg`.

## 6. Jas (všetky snímky)

| sada | najnižší jas | najviac tmavých px (Y < 60) |
|---|---|---|
| screencast tel. A / B (0 – 4,5 s) | 173,4 / **121,0** (1,91 s) | 7,3 % / 13,0 % |
| screencast PC A / B | 161,7 / **118,1** (1,51 s) | 12,9 % / 20,4 % |
| video tel. B, 10 snímok/s (`mer/jas-video.txt`) | 119,6 | 18,0 % |
| video PC B, 10 snímok/s | 116,8 | 22,8 % |

- Najtmavšia snímka je celoplošná fotka dvora. Fotka sama má jas **115,0** (telefónna verzia) a **115,5** (počítačová).
  Merané cez `ffmpeg signalstats`. Žiadny výrez nemá viac ako 119.
- Uvítanie nepridáva nič tmavšie, než je fotka. Brána má jas 240 – 248 a prelnutie je do papiera.
- Tmavé pixely sú sivé tvárnice v tieni, nie tma ani clona. Ak by majiteľ chcel celé uvítanie nad jasom 160,
  musela by fotka ostať menšia s papierovým okrajom (časť 8, R1).

## 7. Kontaktné hárky, videá a poctivé hodnotenie

- Hárky (16 snímok, obidva som otvoril): `harok-tel.jpg` (0,76 – 3,56 s) a `harok-pc.jpg` (0,33 – 3,59 s).
- Videá: `video/brana-tel.mp4|webm` (5,2 s, 4G bez CPU spomalenia) a `video/brana-pc.mp4|webm` (5,4 s).
  Majú po 0,6 – 0,8 MB a ich jas som meral po snímkach.

**Sila hooku do 3 s: 4/5.**

- Pozdrav je čitateľný od ~0,25 s po FCP a ešte ~0,3 s počas rozdeľovania.
- „Poďte ďalej.“ sa splní v tej istej sekunde: brána sa otvorí a za ňou je skutočný plný dvor. Odvetvie dvor neukazuje
  (inspiracia/odvetvie §1), takže je to nezvyčajné.
- Odznak „Skutočná fotka…“ je zväčšený a čitateľný asi 1 s a potom ostane v úvode. Na počítači hárok (1,03 – 1,29 s)
  pôsobí ako skutočný vjazd: krídla majú perspektívu a v spáre je vidieť oblohu.
- Slabiny:
  - na telefóne je celoplošný výrez fotky najmä sivé tvárnice v tieni (jas 120), čo je ťažšie a menej „slnečné“ ako záber v úvode;
  - štítky na telefóne (17 px) svietia len ~0,5 s a čítajú sa skôr ako „živé značky“ než ako informácia;
  - malý nadpisok na bráne je na 1440 px drobný.

**Profesionálny dojem: 4/5 na počítači, 3,5/5 na telefóne.**

- Typografia a farby sú rovnaké ako na webe (Barlow Condensed, tehlová, papier). Nie je tu tmavá opona, blik ani skok.
  Odovzdanie do úvodu je v hárkoch bez švu (PC 1,74 → 1,97 s, tel. 2,10 → 2,24 s).
- Proti tomu stojí poučenie z rešerší: opona pred obsahom škodí (Haven 2,4 s, Hays 1,0 s, Stavmat 3 s).
  Brána drží zatvorená 0,38 – 0,65 s a celé uvítanie oddiali úvod o ~0,9 s. Preto sa ukáže len raz za reláciu a len
  pri príchode zvonka.

## 8. Riziká a otvorené otázky

- **R1 – jas:** celoplošná fotka má jas 115 – 121. Ak to majiteľ považuje za „tmavé“, dá sa použiť variant s papierovým
  okrajom 8 % alebo iný výrez (najsvetlejší výrez telefónu px = 0 má 119, teda len o málo viac).
- **R2 – plynulosť na skutočnom zariadení:** headless Chromium kreslí softvérovo. Pred nasadením treba nahrať
  Performance v Chrome na strednom Androide (overiť `DrawFrame` počas usadenia a 0 dlhých snímok pri záťaži).
- **R3 – štítky:** „Betónové výrobky“ a „Betónové tvárnice“ sú zámerne všeobecné. Majiteľ môže potvrdiť presný druh
  (napr. šalovacie tvárnice, Betonárka Nadlice) a štítok spresniť.
- **R4 – čas:** +0,9 s do použiteľného úvodu pri prvej návšteve. Ak chce majiteľ kratšie, dá sa vynechať tretí štítok
  a kamera (−0,2 s), alebo nastaviť `CIEL` na 2200 ms.
- **R5 – zlúčenie so zf:** zf práve mení pohyb úvodu (`site.css` „Pohybový systém“ a `zdroj/prechody.js`).
  Uvítanie potrebuje z úvodu len: `.uv-ram`, `.uv-dvor img`, `.uv-znak`, `.uv-ram>.uv-stitok`, `.uv h1 .ln>span`,
  `.uv-b`, `.uv-tel`, `#q` a strih zásob v `site.js` (udalosť `br-koniec`). Ak zf tieto triedy premenuje, treba
  upraviť `zdroj/brana.js`.

## 9. Súbory (v `uvitanie/brana/`)

| súbor | čo |
|---|---|
| `prototyp/index.html`, `prototyp/assets/site.js` | zmenené súbory prototypu (minifikovaná zostava) |
| `zmeny.diff` | diff voči nezmenenej kópii (179 riadkov) |
| `zdroj/brana.css`, `brana.js` (145 riadkov s komentármi), `brana.html` (šablóna), `brana-head.js` | čitateľné zdroje |
| `zdroj/zloz.py` | `python3 -I zloz.py <A> <B> [--plne]` zloží B z nezmenenej kópie A (vloží CSS do `<head>`, šablónu a skript za odkaz „Preskočiť na obsah“ a upraví 2 miesta v `site.js`) |
| `nastroje/` | `meraj.mjs`, `ab.sh`, `suhrn.py`, `sekv.mjs` (screencast), `harok.py`, `medzery.py`, `stopa.mjs`, `kontroly.mjs`, `iframe-a.mjs`, `video.mjs`, `posun.py`, `odovzdanie.py`, `finale.sh` |
| `mer/` | surové merania (`*.jsonl`), `suhrn.txt`, `kontroly*.json`, `jas-*.txt`, `iframe.json`, ukážky stôp |
| `harok-tel.jpg`, `harok-pc.jpg`, `snimky/`, `video/` | hárky, kontrolné snímky, výrezy fotky a videá |

**Zapracovanie do vetvy:** `build.py` vkladá skript do `<head>` len pri `index.html`. Do šablóny úvodu treba pridať
`brana.css` (do `<style>` v `<head>`, iba na úvode) a `brana-head.js` pred riadok s `uv-ide`. K nemu patrí podmienka
`&&!h.classList.contains("br-ide")`. Šablónu a skript treba vložiť hneď za odkaz „Preskočiť na obsah“ a do `site.js`
pridať 2 úpravy (diff). `kontrola_uvodu()` treba rozšíriť o kontrolu, že `#br-tpl` je `<template>`.

## 10. Inšpirácia (len princípy, nič som nekopíroval)

| princíp | zdroj (rešerše 5. 11. 2026) | čím sa to líši tu |
|---|---|---|
| „otvorenie brány dvora“ zo stredu do strán | inspiracia/galerie R7 (Image Reveal) | dve 3D krídla s pántami namiesto `clip-path`, len `transform` |
| firemný moment a potom odhalenie | galerie R3 (Hays) | svetlý papier namiesto sýtej červenej, otvorí sa až po vykreslení fotky |
| slovo vyjde z drážky po riadkoch | galerie R1 (Haven), technika T11 (nedeliť na písmená) | len 2 riadky, celé vety |
| kamera vojde do uličky | odvetvie N1 | 1,06 za 0,6 s, potom sa vráti do rámu úvodu |
| štítok ako na palete | odvetvie R1 (Petersen Tegl) | špendlík na skutočnom mieste fotky |
| prerušenie na `pointerdown`/`keydown` | technika T3 (Shopify) | aj koliesko, posun a skrytie karty |
| čo nerobiť: opona, preloader, tmavé video | odvetvie R8 Stavmat, galerie R17 – R20 | uvítanie len raz a len zvonka, krátke, svetlé, s rýchlou cestou na pomalej sieti |
