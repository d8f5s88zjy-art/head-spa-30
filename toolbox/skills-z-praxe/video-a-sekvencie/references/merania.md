# Merania, realita fps a čo ostáva rozhodnúť

Zdroj: `barbershop-30/docs/CHECKS.md` (časti 10 až 13), `docs/TOUR_DIRECTION.md`, `docs/MEDIA_SELECTION.md`,
commity z 2026-10-11 (`git log -- barbershop-30/source/tools/videa.sh`) a vlastné overenie v kontajneri
(ffprobe, Playwright, opätovné spustenie skriptov do scratchpadu).

## Vývoj riešenia (čo sa skúšalo a prečo sa to zmenilo)

| krok | commit | čo | výsledok |
| --- | --- | --- | --- |
| 1 | 205795f (2026-10-10) | chôdza kamery ako video pretáčané skrolom, 15 snímok/s, každá snímka kľúčová (`-g 1`), 576 px | majiteľ chcel ostrejší obraz (CHECKS 11, snímka z iPhonu) |
| 2 | 6af024e | to isté ostrejšie: 864 px (lanczos + CAS), crf 20, kľúčová každá 4. snímka | ostrejšie, videá spolu asi 10 MB H.264 (predtým 3,8 MB); na telefóne pri posune trhané, pri zastavení obraz stál (majiteľ: video pôsobí zaseknuto) |
| 3 | c96b95a | videá hrajú v čase ako tiché slučky 30 snímok/s, šev prelínaním, plagát = prvá snímka | nesledujú skrol; majiteľ potom chcel celú stránku 60 až 120 snímok/s (komentár vo `videa.sh`) |
| 4 | 619862e, cf47a0d | film kreslí plnou frekvenciou displeja aj v pokoji, bez stropu 30 snímok, displeje do 240 Hz | |
| 5 | 967e68f | slučky 60 snímok/s (`minterpolate`), šev cez strojnásobenie a výrez strednej periódy | šev 1,6 pri bežnom rozdiele 1,7 |
| 6 | f3c9a22 | prvé ťuknutie odomkne v úspornom režime všetky videá filmu | |
| 7 | d1419d5 | chôdza kamery ako fotky po 0,1 s, skrol ich prelína (51 a 44 snímok, 720 × 1280) | pohyb pri každej snímke displeja, v pokoji ostrý obraz |

Podnet majiteľa (CHECKS 12): „videá pôsobia zaseknuto; celá stránka aspoň 60 a podľa zariadenia až 240 snímok za
sekundu; video rozložiť na snímky po 0,10 s“.

## Namerané a overené

- Sekvencie: `vstup-dnu` 51 snímok, 1990 kB AVIF / 2481 kB WebP; `okolo-kresla` 44 snímok, 1568 kB AVIF / 1936 kB WebP.
  CHECKS 12: „2,0 a 1,6 MB AVIF (menej než predchádzajúce videá)“. Opätovný beh skriptu dal rovnaké súčty veľkostí;
  pri nezávislom overení bolo 188 zo 190 súborov zhodných bajt po bajte, `okolo-kresla/f008` (AVIF aj WebP) sa
  nepatrne líšila (priemerne 0,6 z 255 v jase). Beh teda nemusí byť úplne deterministický; porovnávaj obsah, nie bajty.
- Slučka tímu `tim-slucka-864`: 864 × 1536, 60 snímok/s, 444 snímok, 7,4 s; MP4 3 402 635 B, WebM 2 863 037 B.
  Opätovný beh `videa.sh` do scratchpadu (4 min 28 s): MP4 zhodný bajt po bajte, WebM rovnako veľký (líši sa
  v hlavičke kontajnera), plagáty rovnako veľké. Snímky sekvencií (`f025.avif`, `f043.webp`) zhodné bajt po bajte.
- Šev slučky (priemerný absolútny rozdiel v šedej 216 × 384): 1,57 na šve, 1,68 priemer susedných, medián 1,37.
- Test v prehliadači (CHECKS 12, telefón 390 × 844): snímka a prelínanie sledujú skrol bez zastavenia, v pokoji `mix`
  0 alebo 1, bez chýb konzoly. Zopakované skriptom [../scripts/seq-stav.mjs](../scripts/seq-stav.mjs) (obe scény prešli): počas skrolu napr.
  `lo 14, hi 15, mix 0,257` a `lo 36, hi 37, mix 1`, v pokoji `mix 0` po 7,1 s (`vstup-dnu`) a 9,1 s (`remeslo`),
  v grafike 6 snímok, stiahnutých 51/51 a 44/44, bez chýb konzoly. Pri nezávislom overení test zastal na kotve
  filmu (stred pripnutia karty, `t` 0,5): `vstup-dnu` ukázal `f025` = plagát (pokoj po 6,4 s), `remeslo` `f021`
  pri plagáte `f022` (`S` 2,9995, pokoj po 9,8 s). Pri párnom počte snímok je stred medzi dvomi a obraz sa môže
  od plagátu líšiť o 0,1 s.
- Nahratie jednej snímky 720 × 1280 do grafiky: komentár pri limite „najviac dve nahratia za snímku displeja“ uvádza
  1 až 3 ms na jedno nahratie (nemerané v tomto kontajneri).

## Realita merania fps

- Kontajner nemá grafickú kartu. Chromium kreslí cez SwiftShader (softvérovo, asi 7 snímok/s podľa CHECKS 10).
  Skutočnú plynulosť tu zmerať nedá; testuje sa logika (`state.seq`: ktoré snímky, aká zmes, či v pokoji dosadne),
  nie fps. Na skutočnom zariadení nemerané (CHECKS 12).
- V teste softvérové kreslenie dobieha pomaly a má výpadky (aj 2 s bez jedinej snímky, počítadlo `state.frames`
  stojí). Pevné čakanie preto nestačí: po 2,5 s bol `mix` ešte 0,897, prvá verzia testu s „S sa 1 s nezmenilo“
  vyhlásila pokoj uprostred výpadku. Spoľahlivé je čakať, kým `state.S === state.T` a dve čítania `seq` po sebe sú
  rovnaké (najviac 30 s).
- Bez `?film=on` sa film pri softvérovom kreslení po prvom vykreslení vypne (pokojná verzia). Bez prológu
  (`?uvod=off`) film čaká na prvý pohyb návštevníka; test musí poslať koliesko alebo kláves.
- Safari na iPhone kreslí webové stránky najviac 60 snímok/s (CHECKS 12: „nastavenie Apple“); 90 až 240 Hz platí pre
  Chrome na Androide a počítače s rýchlym monitorom.
- Film nemá strop snímkovej frekvencie. Interval displeja odhaduje z najrýchlejšej snímky (najmenej 1/250 s) a
  prispôsobuje rozlíšenie (`quality` v `film.js`): z 30 snímok medián a 90. percentil; keď je medián nad
  `max(1,3 × interval, 1/55 s)` alebo p90 nad `max(2,2 × interval, 1/40 s)`, zníži `dpr` o 0,25 (najnižšie 1×);
  späť o 0,25, keď je medián pod 1,08 × interval, p90 pod 1,5 × interval a od posledného zníženia uplynulo 8 s.
  Najvyššie `dpr` je `min(devicePixelRatio, 2)`.
- Tvrdenia auditov over vlastným meraním (CHECKS 13, audit výkonu stránky): audit uvádzal prepočet štýlu
  48,7 → 7,4 ms (inou metódou), vlastné meranie skrolu (telefón 390 × 844, CPU 4×, film vypnutý) dalo prepočet
  štýlu 5,1 → 4,8 ms a hlavné vlákno 10,9 → 9,6 ms na snímku.

## Čo ostáva na rozhodnutie

- **Zdroj v 60 snímkach/s.** Dnešné slučky majú medzisnímky dopočítané z pohybu (`minterpolate`). Pravých 60 snímok dá
  len video nahraté v 60 (napr. iPhone 4K60); ostrejší obraz dá originál 1080p alebo 4K namiesto 576 × 1024.
  Rozhoduje a natáča majiteľ.
- **Meranie na skutočnom telefóne** (iPhone so Safari, Android s 120 Hz): plynulosť sekvencie, čas do prvej snímky
  na mobilnej sieti, pamäť.
- **Z auditu nezapracované** (CHECKS 13, podklad): prispôsobivé pásma nahrávania s limitom bajtov, vrátane sekvencií.
- **Súhlasy osôb vo videách** potvrdiť u majiteľa (CHECKS 5, MEDIA_SELECTION).

## Rozdiely medzi dokumentmi a kódom (platí kód)

- `film.js` (komentár pri videu): režim scroll má súbor „každú snímku kľúčovú (-g 1)“; posledná verzia skriptu
  pre scroll kódovala s `-g 4` (6af024e). Režim scroll sa dnes nepoužíva.
- `film.js` (`clipBlob`): „1 až 2 MB“ na video; `tim-slucka-864.mp4` má 3,4 MB.
- `film.js` (sekvencia) a CHECKS 12: v pokoji „do 0,2 s“ dorovnanie; kód zaokrúhli cieľ po 0,25 s pokoja a `uMix`
  dobieha exponenciálne (po 0,2 s ostáva asi 22 % rozdielu).
- CHECKS 11: H.264 crf 20 / VP9 crf 33 platí pre zrušené videá režimu scroll; slučka má crf 21 / 32.
- `MEDIA_SELECTION.md`, časť Videá (crf 23 / 34, 576 px) platí len pre videá v okienkach stránky, nie pre film.
- `TOUR_DIRECTION.md` (riadok 47): „60 snímok/s minútu po poslednom pohybe, potom 30“ a „pružina 4,2“ sú staršie;
  kód kreslí plnou frekvenciou 3 minúty po pohybe (`BREATH_MS = 180000`) a pružina má `w0 = 6.5`.
