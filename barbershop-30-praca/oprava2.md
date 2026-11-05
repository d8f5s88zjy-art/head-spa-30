# BARBERSHOP 30 – oprava2 po kontrolách vizuálu a plynulosti (senior front-end, 5. 11. 2026)

Strom `scratchpad/hs-skvrny` (vetva barbershop-skvrny), len lokálne commity, nič nenasadené ani pushnuté.
Predchodcu s touto rolou zastavil 4. 11. limit po šiestich commitoch nad 2179170f; oprava2.md nenapísal.
Tento zápis ich overuje, dopĺňa zvyšok a uzatvára. Pracovné súbory: `barber/senior/oprava2/`
(`log3/` logy, `nastroje/` sondy, `snimky3/` snímky, `fil3/` záznamy filmu).

## Verdikt

Všetkých 7 nálezov z kontrol (V1, V2, S1, S2, S3, KP-01, KP-02) je opravených alebo overených. Na konečnom HEAD prejdú
všetky testy (tabuľka nižšie). Nič som nevracal (revert): žiadna oprava nič nezhoršila.

| nález | stav | commit | dôkaz |
|---|---|---|---|
| V1 ťah myšou po páse | opravené | 52b34362 | kino-test: 1440 aj 1024 ťah doprava 2385/4 → … → 17498/8, doľava späť na 1167/2; na 2179170f stál na 1960/3 |
| V2 Ďalej na ležiacom telefóne | opravené | d2c00c38 | kino-test 844×390, 932×430, 568×320: „ukázal sa 0×“; sonda 667×375 a 740×360 `display: none`; snímka otvorená |
| S1 aria-label ▶ v jazyku | opravené | bbfd7594 | kino-test sk/en/de/en/: „Play the tour → Stop the tour → Play the tour“, „Rundgang abspielen → anhalten → abspielen“ |
| S2 pás prečiarkuje text | opravené | 97cb81bc | kino-test 390 a 1440 nad pásmi s textom `op: 0`; snímky 1280×800 a 390×844 nad tímom otvorené, žiadne čiary |
| S3 nestabilný app-smoke, štítok po skoku | opravené | 6f4c3292 | app-smoke 109/0 dvakrát; kino-test „ťuk na Remeslo… štítok hneď ukáže cieľ 03 · Remeslo“ |
| KP-01 trhanejší skrol | opravené | 97cb81bc + **a24ec0c8** | A/B nižšie: po oprave na úrovni 791fb3db v rámci šumu |
| KP-02 FIL-3 neoverené behom | **overené behom** | – (len sonda) | `nastroje/fil3.mjs`: rozlíšenie sa samo zmenilo 2×, stred obrazu po zmene má obraz, 0 čiernych snímok; kontrola s vrátenou opravou dá 0,0,0 a 13,6 % čiernej |
| D1 Ďalej v poradí Tab | opravené | bbfd7594 | kino-test „Ďalej za pásom v poradí Tab“ pri 390, 360, 1440, 1280 |
| D2 ▶ v úvode bez textu | neriešené | – | drobná; vzhľad v pokoji sa bez nutnosti nemení (pravidlo majiteľa) |

## Commity (všetko lokálne, autor Claude <noreply@anthropic.com>, bez podpisových riadkov)

Predchodca (overené testami v tomto zápise):
- `52b34362` pás kapitol sa dá pretáčať aj myšou (V1)
- `bbfd7594` ▶ hlási čítačke Prehrať/Zastaviť v jazyku stránky, Ďalej hneď za pásom (S1, D1)
- `d2c00c38` Ďalej sa na ležiacom a nízkom telefóne neukáže (V2)
- `97cb81bc` pás kapitol nad textom schovaný a ľahší pri skrole (S2, KP-01 časť 1)
- `6f4c3292` po ťuku na kapitolu štítok hneď ukáže cieľ, app-smoke čaká na ustálenie (S3)
- `6e36b673` test kino-test.mjs pre pás kapitol a Kino

Môj:
- `a24ec0c8` ponuka jazyka schová pás cez triedu, nie cez html:has() (KP-01 časť 2) – `assets/i18n.js`,
  `assets/style.css`, `source/tools/kino-test.mjs` (+ blok 5: pás čaká na ponuku jazyka a po zavretí sa vráti).

## Testy

`log3/testy.sh` (všetky nástroje zo `source/tools`, porty 9005–9008 pre PHP testy). Na HEAD 6e36b673
(`log3/testy/vysledky.txt`) a na konečnom a24ec0c8 (`log3/testy-a24ec0c8/vysledky.txt`):

| test | 6e36b673 | a24ec0c8 |
|---|---|---|
| kino-test | 34 OK / 0 | 38 OK / 0 (+ ponuka jazyka 390 a 1440) |
| i18n-test | 55 / 0 | 55 / 0 |
| en-test, en-stranka --check | 16 / 0, aktuálna | 16 / 0, aktuálna |
| vychytavky-test | 27 / 0 | 27 / 0 |
| admin-test | 101 / 0 | 101 / 0 |
| otazky --kontrola | 9 / 0 (778 otázok, 11 tém) | 9 / 0 |
| objednavka-test, asistent-test | 15 / 0, 9 / 0 (časti so serverom preskočené – v kontajneri chýba knižnica Anthropic, známe) | 15 / 0, 9 / 0 |
| vaha | OK, index.html gzip 14 339 B (hranica 14 600) | OK, 14 339 B |
| app-smoke | 109 / 0 (aj CLS WEB-05 tentoraz prešiel) | 109 / 0 |

Na 2179170f (pred šiestimi commitmi) zlyhá v kino-teste 20 kontrol (`oprava2/log/kino-test-pred.log`), na HEAD žiadna.
Testy prepisujú snímky v `docs/screenshots/`; po behu som ich vrátil `git checkout -- docs/screenshots`, aby sa
nemenili bez dôvodu.

**Prostredie:** disk `/` je plný (`df -m /` → 89–236 MB voľných, plní ho súbežný audit). Chromium potom padá
(„Page crashed“, `net::ERR_INSUFFICIENT_RESOURCES`), prvý beh testov preto spadol na kino-teste, i18n-teste aj
vychytavkách – nie kvôli webu. `oprava2/nastroje/crash.mjs` padne bez úpravy a prejde 3/3 s `TMPDIR=/dev/shm/bs30-senior`
(profil prehliadača v RAM). Všetky behy v tomto zápise idú s týmto TMPDIR. Nič mimo môjho priečinka som nemazal.

## KP-01 – skrol bez filmu

Predchodca (97cb81bc) zrušil `filter: drop-shadow` nad pevným pásom, výplň píše po celých px a nad textom pás schová;
počet prepočtov štýlu tým klesol na úroveň pred (2 432–2 547 proti 791fb3db 2 404–2 504, `oprava2/log/ab-skrol-var.log`).
Ostal však väčší vynútený štýl v `app.js:tick` (300–490 ms proti 17–130 ms).

Príčinu som našiel stopou Chromium s invalidationTracking (`nastroje/inval.cjs`, telefón 390×844 DPR3 CPU4×, 12 ťahov):
`Schedule Style HTML … has` **22×** v HEAD, **0×** v 791fb3db. Pravidlo `html.kino:has(.lang-offer.in) .story-line`
(a rovnaké pre `.kino-next`) urobilo z `<html>` predmet `:has()`; pri zmenách počas skrolu (napr. `is-hidden` na spodnom
tlačidle) prehliadač zneplatnil štýl dokumentu a prepočet sa vynútil na začiatku snímky pri čítaní `scrollY`.
Oprava a24ec0c8: i18n.js pri ponuke jazyka pridá `html.lang-ponuka`, pri zavretí ju zoberie; CSS používa túto triedu.
Vzhľad aj správanie rovnaké (kino-test blok 5).

Stopa (`log3/inval.log`, `log3/inval-has.log`, `log3/inval-po-oprava.log`), prvkov v prepočtoch spolu:

| verzia | prepočtov | prvkov | `has` na HTML |
|---|---|---|---|
| 791fb3db | 1 131 | 14 860 | 0 |
| HEAD 6e36b673 | 1 147 | 15 890 | 22 |
| HEAD bez pásu (route) | 1 075 | 14 904 | – |
| **a24ec0c8** | 1 074 | **14 868** | **0** |

A/B skrol (`nastroje/ab-skrol3.cjs --var=pred,po,po-has --behy=4`, striedavo, záťaž 4–6,6 – súbežný audit;
`log3/ab-skrol-has.log`), medián zo 4 behov:

| verzia | p95 | snímky > 34 ms | > 50 ms | > 100 ms | prepočtov | vynútený štýl v tick |
|---|---|---|---|---|---|---|
| pred 791fb3db | 33,5 | 87 | 30 | 1 | 2 446 | 57 ms |
| po 6e36b673 | 49,9 | 102 | 37 | 2 | 2 492 | 168 ms |
| po-has (= a24ec0c8) | 49,9 | 90 | 33 | 1 | 2 474 | 79 ms |

Jednotlivé behy pred: > 50 ms 45/15/30/83, po-has 66/36/17/33 – rozptyl pri záťaži je väčší ako rozdiel. Cieľ kontroly
(„nad 50 ms okolo 25–30, prepočty okolo 2 500“) je splnený v rámci šumu; p95 49,9 je hranica dvoch snímok (33,4/50) a
v jednotlivých behoch skáče aj pri pred (b1 50, b4 50). Na skutočnom telefóne treba ešte potvrdiť (N5 kontroly).

## KP-02 – automatická zmena rozlíšenia filmu (FIL-3) overená behom

Prečo sa nedala vyvolať: `quality()` (film.js:1227) ignoruje snímky ≥ 100 ms; SwiftShader pri 1440×900 kreslí pomalšie,
takže sa rozlíšenie nikdy nemenilo. Sonda `nastroje/fil3.mjs` použije malé okno 540×520 s DPR 1,5 (snímka ~50 ms),
`?film=on`, 45 s pomalého skrolu kolieskom, CDP záznam obrazovky a MutationObserver na šírke plátna, ktorý hneď po
zmene prečíta stred obrazu. Stránka sa nemení; `kontrola` = film.js s vrátenou opravou (quality za draw(), bez clear).

| | prod (HEAD) | kontrola (bez FIL-3) |
|---|---|---|
| zmeny rozlíšenia | 2 (dpr 1,5 → 1,25 → 1; 675×650, 540×520) | 2 (rovnaké) |
| stred obrazu hneď po zmene | [236,218,198], [45,34,36] – obraz | **[0,0,0]**, **[0,0,0]** |
| záznam: snímok / s čiernou > 3 % | 239 / **0** (najviac 0,48 %) | 192 / **2** (13,58 %) |

Otvorené snímky: `fil3/kontrola-540x520x1.5/zaznam-0014-cierna13.jpg` (namiesto fotky čierne pozadie za nadpisom –
presne chyba, ktorú FIL-3 rieši) a `fil3/prod-540x520x1.5/zmena-675x650-0013.jpg` (snímka pri zmene, fotka podniku
viditeľná). Logy `fil3/*/log.txt`, `vysledky.json`. Na zariadení majiteľa (iPhone, Mac) ostáva len potvrdiť na
skutočnej grafike; v kontajneri je oprava overená behom aj kontrolným variantom.

## Vizuálne overenie V2 a S2 (`nastroje/vizual.mjs`, `snimky3/vizual-po.json`)

- V2: 667×375, 740×360, 844×390, 568×320, Remeslo, po zastavení (`kino-stoji: true`): Ďalej `display: none`.
  Otvorená `snimky3/V2-po-667x375-remeslo.png`: kicker REMESLO a nadpis „Povedz, ako to chceš.“ čisté, pás hore pod lištou.
- S2: 1280×800, 1440×900, 390×844 nad pásom tímu: `kino-tenky: true`, pás `opacity 0`. Otvorené
  `snimky3/S2-po-1280x800-tim.png` a `S2-po-390x844-tim.png`: žiadne čiary cez bio tímu ani pod lištou.

## Čo ostáva / návrhy

- D2 (drobná): text „Prehrať prehliadku“ pri ▶ v úvode – mení vzhľad v pokoji, nechávam na rozhodnutie majiteľa.
- N2–N4 z kontroly plynulosti (najtmavší strih telefónu kreslo-stred > káva 20,8 %, app.js pred prvým vykreslením,
  CLS 0,0292 z `::before`) sú návrhy, nie nálezy tohto kola; v tomto kole som ich nemenil.
- Overiť na zariadeniach majiteľa: skrol telefónu bez filmu (iPhone), pomalé skrolovanie filmom na Macu.
- Servery 9000 a 9002 som po práci zastavil podľa PID (`log3/server900*.pid`).
