# Kontrola vzhľadu a funkcie v prehliadači – kolo 1 (ľahký telefón L1, L2, L3, L5, L6)

Kontrolór vzhľadu, nezávislý. V stromoch som nič nemenil: `git status --short` v `hs-lahky` je prázdny, HEAD `0195615`.
V `hs-pred-d1` je tiež prázdny.

- Porovnávaný stav: `$SP/hs-lahky` (vetva `barbershop-lahky-telefon`, HEAD 0195615) proti D1 `$SP/hs-pred-d1` (7ea247c).
- `$SP` = `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad`, `$V` = `$SP/barber/lahky-telefon/stavba/vzhlad-1`.

**Servery:**
- 8630 = hs-lahky, 8631 = D1 (`python3 -I -m http.server`).
- Pred testom som overil titul: `curl -s http://127.0.0.1:863x/barbershop-30/ | grep -o '<title>[^<]*'` vrátil na oboch
  „Barbershop 30 Nitra | Pánske strihy, brada a holenie – rezervácia online“.
- Rozlíšenie stromov: `grep -c 'hover: none'` vrátil 2 na 8630 a 0 na 8631.
- Na konci som servery ukončil (`pkill -f "http.server 863[01]"`). `pgrep -c chrom` = 0.

**Prehliadač:** Chromium 1194 cez Playwright (`/opt/node22/lib/node_modules/playwright/index.mjs`), vždy len jeden môj naraz.
Pred niektorými behmi bola záťaž `/proc/loadavg` 4–6 (4 jadrá). Raz bežal cudzí prehliadač (`pgrep -c chrom` = 10 pred prvým behom
čierneho štartu, potom 0). Časy sú preto len porovnávacie.

**Nástroje:** `$V/nastroje/` (`start.mjs`, `tma.py`, `zhoda.py`, `pas.py`, `skrol.mjs`, `skrol-tma.py`, `karty.mjs`, `porovnaj.py`,
`lista.mjs`, `videa.mjs`, `pohyb.mjs`). Surové snímky screencastu som po vyhodnotení zmazal. `$V` má 14 MB.

## Súhrn

| bod | výsledok |
|---|---|
| (1) čierny štart | Čierne okno ako na snímke majiteľa už nie je. Nadpis a tlačidlá sú hneď po prvom vykreslení, okrem EN. Fotka však prichádza až po texte a pri obnovení či kotve je pod kartou dočasne iná fotka. **Čiastočne splnené.** |
| (2) skrol, 3 švihy + skok z menu, pasívna sonda | **0** viditeľných neúplných alebo nedekódovaných fotiek, 0 neúplných iných obrázkov. **Prešlo.** |
| (3) lišta a pätička | Lišta má plné `rgb(14, 13, 12)`, text pod ňou nepresvitá. Pod pätičkou je rezerva 0 px, tlačidlo neprekrýva text. **Prešlo.** |
| (4) WebGL a požiadavky filmu | 0 WebGL kontextov, 0 požiadaviek three, film.js, seq, hlbka. **Prešlo.** |
| (5) videá | Hrá najviac 1 video, nikdy viditeľné bez plagátu, CLS 0,0099. **Prešlo** (drobnosť nižšie). |
| (6) titulné karty lite vs D1 `?film=off` | 7 z 9 kariet je zhodných (rozdiel ≤ 1 %). Karta 1 (iná fotka) a karta 4 (video Tímu) sa líšia zámerne. **Prešlo s výhradou.** |
| počítač 1440×900, 600×900 s myšou | Bez lite, film beží (`world-in` s `?film=on`). Snímky úvodu a 3 kariet sa zhodujú s D1. **Prešlo.** |
| `?film=on` na telefóne | Film zapnutý: `world … world-in`, 2 WebGL, 10–14 požiadaviek filmu. **Prešlo.** |
| `prefers-reduced-motion` | `data-motion=off`, žiadne priblíženie, slučka sa nespustí ani nestiahne. **Prešlo.** |

## (1) Čierny štart

Podmienky merania:
- telefón 390×844 a 430×932, DPR 3, `isMobile`, `hasTouch`, CPU 4×, Fast 4G (165 ms, 1,01 MB/s),
- screencast 3,3 s od akcie a vzorky DOM v 0, 300, 800, 1500 a 3000 ms (`start.mjs`),
- tma = podiel plochy s jasom < 20 (`tma.py`), časová os zhody s konečnou snímkou (`zhoda.py`),
- vzorky a časové osi sú v `$V/meta/start-*.json`.

| scenár | snímky > 90 % tmy po FCP | čo vidno |
|---|---|---|
| prvá návšteva 390 | 1 (764 ms, 99,4 %) | snímka FCP je lišta na inku, o 16 ms neskôr nadpis a tlačidlá (tma 0,64–0,74), fotka od 1 251 ms |
| prvá návšteva 430 | 0 | text od 908 ms, fotka od 1 511 ms |
| znovunačítanie pri `scrollY` 3000 (390/430) | 0 / 0 | max. tma 0,65 / 0,73; poloha ostane 3000; **pod kartou Tím sa najprv ukáže rohožka** |
| `/#tim` (390/430) | 1 (712 ms, FCP) / 0 | úvod, potom plynulý skrol (CSS smooth, rovnaké v D1 app.js:364) na Tím; **karta Tím stojí ~1,6 s na fotke rohožky** |
| `/#kontakt` (390/430) | 0 / 0 | max. 0,87 / 0,73; skrol na pätičku, zálohy pri pätičke zhasnuté (`footerIn`) |
| späť (dvakrát, aj po dopredu) | 0 | `nav: back_forward`, `scrollY` 3000; **rohožka pod Tímom ~0,46 s** |
| `b30.lang=en` (390/430) | 1 (FCP) / 1 (FCP) | `t-wait` skrýva nadpis a tlačidlá do 800–1500 ms (style.css:105), medzitým je len lišta na inku |

Porovnanie s D1 (390, rovnaká metóda, `$V/meta/start-d1*.json`):
- D1 bez parametra má tiež 1 snímku 99,4 % v FCP (691 ms) a fotku až od 1 408 ms.
- D1 `?film=off`: fotka od 1 577 ms. Pri znovunačítaní 4 snímky > 90 % (415–474 ms).
- D1 `?film=off` `#tim`: tma 0,63–0,88 asi 1,6 s, teda ink pod kartou.
- Lite je teda vo všetkých scenároch lepší alebo rovnaký. Snímka v FCP s lištou na inku trvá 1 snímku (~16 ms) a je rovnaká v D1.

Pomalá sieť (Slow 4G, 430, prvá návšteva, `$V/meta/start-slow-*.json`):
- lite: text od 2 981 ms, fotka od 5 261 ms, teda **2,3 s text na inku bez fotky**,
- D1 `?film=off`: text od 2 567 ms, fotka od 5 860 ms.

Pás snímok `$V/start-prva-430-slow4g.jpg`.

## (2) Skrol po celej stránke

Podmienky (`skrol.mjs`):
- Fast 4G, CPU 4×, 3 švihy (každý 3 rýchle ťahy prsta po 0,75 okna cez `Input.dispatchTouchEvent`),
- `synthesizeScrollGesture` s dotykom v tomto Chromiu neposúva (overené, scrollY ostal 0 aj na D1 a na `pravne.html`),
- potom menu a skok, nakoniec ťahy až po pätičku,
- sonda je pasívna podľa V5: nikdy nevolá `decode()`, číta len `img.__dec`, opacity, `complete` a `naturalWidth`.

| | 390×844 (skok na Galériu) | 430×932 (skok na Služby) |
|---|---|---|
| snímok sondy | 1 182 | 1 370 |
| titulná fotka viditeľná nestiahnutá / nedekódovaná | **0 / 0** | **0 / 0** |
| poistka úvodu (pred prvým dekódovaním, dovolená) | 3 | 3 |
| iné obrázky v okne viditeľné nestiahnuté | **0** | **0** |
| max. zobrazených záloh | 3 | 3 |
| WebGL / požiadavky filmu | 0 / [] | 0 / [] |
| chyby stránky | [] | [] |
| snímky > 90 % tmy | 64: otvorené menu (0,90–0,91) a dno pätičky | 112: dno pätičky (0,90–0,91) |

Snímky nad 90 % tmy patria k návrhu: otvorené menu je plný ink a dno pätičky je tmavé. Pri skoku sú lišta a obsah vidno v každej
snímke. Skok je plynulý skrol cez cenník a karta je celá do 1 s.

Snímky okolo skoku:
- `$V/skrol-390-skok.jpg`,
- `$V/skrol-430-skok.jpg`,
- údaje v `$V/skrol-*-skok.json`.

## (3) Lišta a pätička (`lista.mjs`, `$V/lista/*.json`)

**Lite 390 aj 430:**
- `.site-header.is-scrolled`: `bg rgb(14, 13, 12)`, `backdrop-filter: none`,
- `::before` je prechod 20 px pod lištou (od `61px`),
- text pod lištou (napr. „Kto ťa ostrihá“, „Pánsky strih“) je zakrytý plnou lištou a nepresvitá,
- `rezervaPodPatickou: 0`, `footerPb 128px`, tieň `0 422px 0 422px` (390) a `0 466px 0 466px` (430),
- `ctaPrekryvaText: []` vo všetkých polohách.

**D1 `?film=off`:**
- `rgba(14, 13, 12, 0.9)`, rezerva 80 px.
- Na snímke `d1off-390-koniec` presvitá text pod lištou, lite nie (`$V/lista-patka-porovnanie.jpg`).

Odraz na konci (rubber band) Chromium nemá. Snímka `*-pretiahnutie.jpg` to preto nepreukazuje a ostáva na iPhone.

## (4) WebGL a požiadavky

Lite telefón bez parametra:
- `gl: 0`, `filmReqN: 0` (`$V/karty/lite-390.json`, `lite-430.json`, `$V/filmon/lite-bez-390.json`),
- v skrole po celej stránke `film: []`.

Pre porovnanie D1 `?film=off` stiahne 2 súbory filmu (`d1off-390.json`).

## (5) Videá (`videa.mjs`, `$V/meta/videa-390.json`)

- `maxHraju 1`, `hrajuViac 0`, `bezPlagatu []`,
- hrala len `tim-slucka-864.webm` (do 2,23 s) s plagátom `tim-slucka-poster-864.webp`,
- video v okne nebolo nikdy viditeľné bez plagátu,
- `tim-v-akcii` je na telefóne skryté (`figure display: none`) rovnako ako v D1,
- posun rozloženia: jediný, `0,0099` pri `y 83`, zdroj `::before` (prechod lišty z L1), D1 má 0. Podrobnosti v nálezoch.

## (6) Titulné karty: lite vs D1 `?film=off`

Porovnávacie obrázky:
- `$V/porovnanie-karty-390.jpg`,
- `$V/porovnanie-karty-430.jpg`,
- jednotlivé snímky v `$V/karty/`, polohy ako `karty-shot.mjs`.

| karta | rozdiel 390 / 430 | fotka lite | fotka D1 off |
|---|---|---|---|
| 0 rohožka, 2 stôl, 3 čakáreň, 5 kreslo, 6 káva, 7 sud, 8 vstup | 0,0–1,0 % | rovnaké `*-m-1448.avif` | rovnaké |
| 1 Poď ďalej | 15,0 / 15,3 % | `sala-m-1448.avif` | `seq/vstup-dnu/f025.avif` |
| 4 Tím | 16,1 / 16,3 % | `sala-rano-m` + hrajúca slučka tímu (L6) | `sala-rano-m` (statická) |

Texty, typografia, karty a tlačidlá sú vo všetkých kartách zhodné.

## Počítač s myšou (`$V/pc/*.json`)

**Bez parametra:**
- na oboch stromoch a oboch šírkach `karty world … world-frame world-off`,
- softvérové kreslenie kontajnera vypne film rovnako v D1 aj v lite,
- 600×900 **nemá** lite (V3 splnené).

**`?film=on`:**
- oba stromy `world-in`, `gl 2`,
- rovnaké stavy filmu: S 2,85, 4,86 a 6,97 (6,98 v D1 pri 600),
- `cur` je `stol`, `sala-rano`, `kava` a pri 600 `stol-video`, `sala-rano-video`, `kava-m`.

**Porovnanie snímok úvodu a 3 kariet:**
- obrázky `$V/porovnanie-pc-1440.jpg` a `$V/porovnanie-pc-600.jpg`,
- rozdiel 0,06–1,6 % (1440) a 0,1–5,5 % (600),
- najväčší rozdiel je pri Tíme 600, kde hrá video filmu, a teda iná snímka videa,
- vizuálne bez rozdielu, lišta aj pätička sú pri šírke > 900 bez zmeny (L1 platí len ≤ 900).

## Nálezy

1. **Stredná – pod kartou je dočasne cudzia fotka (rohožka) po znovunačítaní, návrate späť a pri `/#tim`.**
   - Dôkaz:
     - `$V/start-reload3000-430-zablesk.jpg` a `$V/start-spat-430-zablesk.jpg`: od 434 ms je karta „Komu zveríš hlavu?“ nad fotkou
       recepcie s rohožkou. Prelínanie na fotku Tímu začne až pri 896 ms.
     - `$V/start-tim-390-detail.jpg`: Čakáreň aj Tím stoja od 1 659 do ~3 300 ms na fotke rohožky.
     - `zhoda.py`: rozdiel ~62 proti ~30–40 po prelínaní.
   - Príčina: poistka úvodu a pravidlo najnižšieho záberu, app.js:286 a :297–300. Kým sa cieľová fotka dekóduje, ukazuje sa posledná
     hotová fotka, a pri novom načítaní je to vždy úvod.
   - Je to lepšie ako ink v D1, ale majiteľ uvidí nesprávnu fotku pod textom karty.
   - Návrh:
     - pri obnovenej polohe či kotve (scrollY > 0 alebo `location.hash` pri štarte) nevyužívať úvod ako poistku pod cudzou kartou,
     - namiesto toho nechať kartu na `--ink-2` s textom, kým sa jej fotka dekóduje (krátko, fotka je v cache),
     - alebo v hlavičke predčítať fotku aktuálnej karty namiesto rohožky,
     - alebo aspoň skryť pri poistke text cudzej karty. Rozhodnúť s ohľadom na „žiadne čierne okná“.
2. **Stredná – fotka úvodu prichádza až po nadpise (Fast 4G +0,5 s, Slow 4G +2,3 s).**
   - Dôkaz:
     - časová os `prva-390`: text pri 748 ms (tma 0,64–0,74), fotka pri 1 251 ms,
     - Slow 4G 430: text pri 2 981 ms, fotka pri 5 261 ms (`$V/start-prva-430-slow4g.jpg`).
   - Kritérium „fotka + nadpis + tlačidlá od začiatku“ teda nie je splnené pre fotku. Je to lepšie ako D1 `?film=off` (5 860 ms).
   - Príčina: 438 kB `rohozka-m-1448.avif` pri obmedzenom pásme.
   - Návrh, oboje len so súhlasom majiteľa (V7, „žiadne nové zábery“):
     - vložený malý náhľad tej istej fotky ako pozadie zálohy úvodu (data URI asi 1–2 kB),
     - alebo menšia prvá fotka pre telefón (L4).
3. **Drobná – EN návšteva (`b30.lang=en`) nemá prvých ~0,5–0,7 s nadpis ani tlačidlá.**
   - Dôkaz: vzorky `en-390` a `en-430`. V 800 ms je `h1: 0, btn: 0` a trieda `t-wait`. Snímka 747 ms má tmu 99 %, potom 0,65 až po
     fotku (1 251 ms). Pozri `$V/start-en-390.jpg`.
   - Príčina: style.css:105 `html.t-wait .title-hero { visibility: hidden … 2.5s }`. Je to správanie D1, nie regresia.
   - SKEPTIK V1 ho však zaradil do čierneho štartu.
   - Návrh: v lite ukázať aspoň tlačidlá alebo fotku hneď, alebo skrátiť `t-wait`, keď je preklad už v cache.
4. **Drobná – snímka v okamihu FCP je lišta na inku (99,4 % tmy, 1 snímka ~16 ms).**
   - Dôkaz: `prva-390` 764 ms, `tim-390` 712 ms, `en-*`. Rovnako aj D1 (691 ms).
   - Prakticky nepostrehnuteľné. Prísne podľa kritéria je to 1 snímka > 90 %.
   - Návrh: nechať, prípadne overiť na iPhone.
5. **Drobná, rozhodnutie majiteľa – karta 1 „Poď ďalej“ má inú fotku ako D1 `?film=off`.**
   - lite: `sala-m-1448.avif`, kreslo a barber pole,
   - D1: snímka sekvencie `seq/vstup-dnu/f025.avif`, barber pri strihu,
   - rozdiel 15 % (`$V/porovnanie-karty-390.jpg`, index.html:215–219),
   - v odovzdávke A je to zámerné (rovnaké ako na počítači, sekvencia na telefóne odchádza),
   - majiteľ však uvidí inú fotku ako dnes na telefóne,
   - ukázať ho spolu s V8.
6. **Drobná – slučka Tímu (L6) je na telefóne mäkšia ako fotky.**
   - Video 864×1536 na 430 @3 (1 290 px) je zväčšené 1,5× a vizuálne mäkšie ako susedné fotky -m 1448
     (`$V/porovnanie-karty-430.jpg`, karta 4).
   - Pri požiadavke majiteľa „fotky tak dobre ako na PC“ to treba ukázať. Návrh 576p z odovzdávky B by ostrosť ešte znížil.
7. **Drobná – posun rozloženia 0,0099 zo `::before` lišty (L1) pri prvom skrole.**
   - Dôkaz: `$V/meta/videa-390.json` `posuny [{v: 0.0099, y: 83, src: ["::before"]}]`, D1 má `cls 0`.
   - Hlásila to už odovzdávka B.
   - Návrh: `::before` mať vždy v rozložení (`content: ""` aj bez `is-scrolled`) a meniť len `opacity`.

## Čo nemožno overiť v Chromiu (ostáva na iPhone)

- odraz na konci a `env(safe-area-inset-bottom)`,
- dekódovanie AVIF v Safari a výber 1448 alebo 1086,
- automatické prehrávanie a úsporný režim,
- skutočný švih s dobehom (CDP ťah nemá dobeh).

## Cesty k snímkam a porovnaniam (všetky v `$V`)

- **Čierny štart, pásy 0/300/800/1500/3000 ms:**
  - prvá návšteva: `start-prva-390.jpg`, `start-prva-430.jpg`,
  - znovunačítanie: `start-reload3000-390.jpg`, `start-reload3000-430.jpg`,
  - kotvy: `start-tim-390.jpg`, `start-tim-430.jpg`, `start-kontakt-390.jpg`, `start-kontakt-430.jpg`,
  - späť: `start-spat-390.jpg`, `start-spat-390-2.jpg`, `start-spat-430.jpg`, `start-spat-430-2.jpg`,
  - angličtina: `start-en-390.jpg`, `start-en-430.jpg`,
  - detaily: `start-tim-390-detail.jpg`, `start-reload3000-430-zablesk.jpg`, `start-spat-430-zablesk.jpg`, `start-prva-430-slow4g.jpg`,
  - D1: `start-d1-prva-390.jpg`, `start-d1-tim-390.jpg`, `start-d1off-prva-390.jpg`, `start-d1off-tim-390.jpg`, `start-d1off-reload3000-390.jpg`.
- **Skrol a skok:** `skrol-390-skok.jpg`, `skrol-430-skok.jpg`.
- **Lišta a pätička:** `lista-patka-porovnanie.jpg`, `lista/*.jpg`.
- **Karty:** `porovnanie-karty-390.jpg`, `porovnanie-karty-430.jpg`, `karty/*.jpg`.
- **Počítač:** `porovnanie-pc-1440.jpg`, `porovnanie-pc-600.jpg`, `pc/*.jpg`.
- **`?film=on` na telefóne:** `filmon/lite-390-*.jpg`, `filmon/lite-430-*.jpg`.
