# V5 etapa 1 – Recepcia: oprava 5 (nový princíp zhody, výrez cenníka, panel)

Staviteľ: senior staviteľ, jediný zapisovateľ v `hs-recepcia`. 25. 10. 2026, 08:58–10:05 UTC.

- Strom `$SP/hs-recepcia`, vetva `barbershop-recepcia`. Pred opravou HEAD `6f8c47c`, po oprave HEAD **`aeaafb7`**,
  `git status --short` = 0 riadkov. Nič som nepushoval ani nenasadzoval.
- `$SP` = `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad`, `$S5` = `$SP/barber/lahky-telefon/v2/stavba-v5`.
- Zásady zhody verzia 2: `$S5/ZASADY-ZHODY.md`. Pracovné súbory: `$S5/o5/` (zoznam na konci).
- Iné stromy (hs-lahky, hs-vernost) som nemenil. Prehliadač: jeden, porty 8711, po behu server aj prehliadač zavreté.

## Výsledok

| kritérium | cieľ | pred (6f8c47c) | po (aeaafb7) | dôkaz |
|---|---|---|---|---|
| holé chyby v slepých sadách A, B, C2 (924 otázok) | 0 | 0 | **0** | `python3 -I o5/hodnot.py o5/po-*.jsonl` |
| odovzdanie bez správnej voľby (legitímne, 413) | ≤ 10 % | 8,7 % (36) | **7,3 % (30)** | to isté; pred: `o5/pred-hodnotenie.txt` |
| „Myslíš toto?“ so správnou voľbou medzi prvými dvomi | OK | 76 | 104 | to isté |
| triedy kontroly 4 – A (trvanie × položka bez trvania) / B (farbenie vlasov × služba) | 0 | 571 / 195 | **0 / 0** | `node $S5/k4/trieda-k4.mjs <strom>` (`o5/pred.txt`, `o5/po.txt`) |
| otázky skeptika a sondy kontroly 4: holá cena/trvanie nesprávnej služby | 0 | 48 zo 150 | **0** | test P6e, `o5/kombinacie-na-6f8c47c.txt` |
| kombinatorické testy z dát (P6, 8 jazykov) | 0 | 3 082 + 654 + 1 152 + 766 + 48, lint 18 | **0** (17 777 otázok) | `node --test source/tools/recepcia-kombinacie-test.mjs` |
| `recepcia-test.mjs` | pass | 23/23 | **23/23** | `node --test source/tools/recepcia-test.mjs` |
| váha po ťuknutí: js + css + sk.json (zlib 6) | ≤ 12 288 B | 11 246 | **12 055** (gzip -9: 11 985) | test 5 |
| váha po ťuknutí: s iným jazykom, najťažší uk | ≤ 13 312 B | 12 495 | **13 267** (gzip -9: 13 177) | test 5 |
| prvé okno (app.js + style.css) proti f624ee8 | ≤ +500 B | +478 (gzip -9: app.js +297, style.css +181) | **+491** (app.js +297, style.css +194; zlib +492) | `git show f624ee8:… \| gzip -9c \| wc -c` |
| index.html | 0 B | 0 | **0 B** | `git diff f624ee8..HEAD -- barbershop-30/index.html \| wc -c` |
| čas zhody, max (najlepší zo 7 behov) | < 5 ms | 4,8 ms bežné (sk), 14,6 ms pri 200 znakoch | **2,9 ms bežné (sk), 2,6 ms pri 200 znakoch** (orientačne) | `node o5/cas-o5.mjs <strom>` → `o5/cas-pred.txt`, `o5/cas-po.txt` (merané za sebou) |

Časy sú orientačné: súbežne bežal prehliadač iného tímu (`pgrep -c -f headless_shell` = 2–4), load 4,8–11.
Holé chyby: v slepých sadách ich nebolo ani pred opravou; triedy, ktoré ich mali (melír, rezervácia, dlho, príplatok,
šediny, odfarbenie), v sadách neboli – preto sú teraz súčasťou kombinatorických testov z dát (P6).

## 1. Zopakovanie nálezov na HEAD 6f8c47c (`o5/pred.txt`)

`node k4/trieda-k4.mjs` → **A 571, B 195**. Ručné sondy kontroly 4 a otázky skeptika (`k1-skusaj.mjs`) dali na HEAD
napríklad:

| nález | otázka | 6f8c47c | aeaafb7 |
|---|---|---|---|
| V1 | sk „Koľko stojí strih a melír?“ (aj hu, pl, uk, sr, cs) | Pánsky strih 18 € | „Myslíš toto?“ [pánsky strih, farbíte vlasy, strih s bradou] |
| V1 | sk „Koľko stojí úprava obočia a trvalá?“ | obočie 3 € / 5 € | „Myslíš toto?“ |
| V2 | sk „Ako dlho trvá rezervácia?“, pl „Jak długo trwa rezerwacja?“, uk „Скільки хвилин чекати?“ | 40 / 20 min | odovzdanie + voľba (rezervácia / káva) |
| V3 | sk „Koľko dlho sa čaká?“, sr „Koliko dugo se čeka?“ | 22 € | odovzdanie + voľba káva |
| V4 | sk „Koľko je príplatok za víkend / večer?“, sr „doplata za subotu“ | 22 € | „Myslíš toto?“ bez ceny v texte: víkend a sobota → voľba hodiny; večer → voľby dlhé vlasy a konečné ceny |
| V5 | sk „Koľko stojí zafarbenie šedín?“ | farbenie brady 10 € | farbenie vlasov – Romana (bez ceny) |
| S1 | sk „Koľko stojí odfarbenie fúzov?“ | farbenie brady 10 € | „Myslíš toto?“ |
| skeptik | en „How long is a beard trim?“ | strih 40 + brada 20 min | Beard trim 20 min |
| skeptik | sk „Koľko dlho sa strihá?“ | strih 40 + brada 20 min | Pánsky strih 40 min |

Všetky správne priame odpovede ostali (`o5/po.txt`): strih 18 €, úprava brady 15 €, oholenie hlavy 25 min, holenie
15 € (cs), Herrenhaarschnitt 18 €, Szakállfestés 10 €, golenie głowy 13 €, brijanje glave 13 €.

## 2. Nový princíp P1–P6 (commity 74e21fd, 15f1f7f, 897a32b, 21bc944, aeaafb7)

Podrobne v `ZASADY-ZHODY.md` (verzia 2). V skratke:

- **P1** (`recepcia.js:53–69`): priama odpoveď len keď je položka „plná“ – vysvetlí každé obsahové slovo otázky
  (kmeňom alebo slovom celého názvu z cenníka). Voľné sú len cenové, výplňové (nové: opytovacie slová a zámená),
  zdvorilé slová a spojky. Slovo inej položky s cenou aj **bez ceny** aj témy „nevieme“ priamu odpoveď zakazuje – tým
  odpadá celá trieda V1/V4 bez ďalších pravidiel. Dlhý kmeň vnútri slova neplatí, ak začiatok slova patrí inému kmeňu
  (`vysvetli`, `recepcia.js:23`): „odfarbenie“ ≠ „farbenie“ (S1) vo všetkých jazykoch.
- **P2** (`recepcia.js:66–68`, `:142`): inak „Myslíš toto?“ – voľby položiek so slovami otázky, zoradené podľa zhody
  (silná 2, preklep silného 1,2, slabá 1), max. 4 + Celý cenník + Zavolať; odpoveď až po ťuknutí.
- **P3** (`recepcia.js:94–101`, `:118–133`, `recepcia.css:15–18`): cena vo výreze cenníka – nadpis skupiny, riadok
  služby zvýraznený (`aria-current`), susedné riadky skupiny, Celý cenník. Dáta `cennik` v JSON, nadpisy z generátora.
- **P4** (`recepcia.js:82–92`): trvanie len z price-time menovanej služby; položka bez trvania → odovzdanie s voľbou;
  strih + brada len bez inej veci; časová príslovka je slabé časové slovo; en „how long“, de „wie lange“ dvojslovný
  spúšťač (long, lange sú aj prídavné mená).
- **P5** (dáta 8 jazykov cez `jazyky_data.py` → `jazyky-gen.py`, sk ručne): dlhé vlasy bez časových prísloviek,
  príplatok a „drahší“ slabé, šediny mimo skupiny brady, sr vreme a pl opłat slabé. Lint v teste: zdieľaný kmeň len
  medzi 120 povolenými dvojicami.
- **P6** (`source/tools/recepcia-kombinacie-test.mjs`): dvojice položiek, trvanie × položka, cenové a časové slovo ×
  služba, príplatky, dni, šediny, odfarbenie, triedy kontroly 4 a otázky skeptika – 17 777 otázok, 0 chýb.
  Na 6f8c47c ten istý súbor hlási 3 082 + 654 + 1 152 + 766 + 48 chýb a 18 chýb lintu (`o5/kombinacie-na-6f8c47c.txt`).

JSON = generátor: kópia `assets/recepcia/sk.json` + `assets/i18n/*.json` → `python3 -I $S5/jazyky-gen.py <kópia>` →
`cmp` en uk hu sr pl de cs: 7× „zhodné“ (kópiu som zmazal).

## 3. Panel nehýbe stránkou ani filmom (commit 58f392d)

Prehliadač (`node o5/panel-o5.mjs http://127.0.0.1:8711/ o5/snimky` → `o5/snimky/panel-o5.json`, title overený curlom):

| nález | oprava | meranie |
|---|---|---|
| S7 posun stránky pri otvorenom paneli | `zamkni()` (`recepcia.js:159–164`): body overflow hidden ako pri menu, scrollbar-gutter stable len pri klasickom posuvníku; overscroll-behavior: contain na paneli a logu | telefón: scrollY 5 304 → po otvorení 5 304 → ťah cez log 5 304 → ťah cez pozadie 5 304 → po Esc 5 304; počítač: koliesko nad pozadím aj logom 6 466 → 6 466, po zatvorení 6 466; šírka 1 440 = 1 440, logo x 40 → 40 |
| S2 film reaguje na klávesy a koliesko | film.js `locked()` už pozná `body.style.overflow === 'hidden'`, takže stačí zámok z S7 (film.js ani app.js nemenené) | `?film=on`: šípka hore s fokusom v dialógu, koliesko nahor nad logom aj pozadím na vrchu → trieda html ostáva `world-in` (bez `outside`) |
| S3 pás filmu zakrýva tlačidlo | `.recepcia-btn` z-index 36 → 39 (nad pásom 38, pod lištou 40) | počas `html.pro` (pás y 828, výška 72) je dolný okraj tlačidla `elementFromPoint` = tlačidlo |
| V1 rad volieb a fokus | `chips.scrollLeft = 0` až po `showModal` (`recepcia.js:194`) | posun 149 → zatvoriť → otvoriť: scrollLeft 0, fokus „Rezervovať“ x 16, viditeľný |
| D1 nábeh pri ?motion=off | animácia len v `@media (prefers-reduced-motion: no-preference)` a `html:not([data-motion="off"])` (style.css, recepcia.css) | ?motion=off: `animation-name: none`; reduce: none; inak rc-btn |
| D2 pravé hrany | panel `inset: auto var(--gutter) 92px auto` | panel right 1 400 = tlačidlo right 1 400 |
| D8 orezaný obrys fokusu | `.rc-chips` margin 0 −6px, padding 6px | prvá voľba je 6 px od okraja radu (obrys 2 + 3 px) |

CLS pred ťuknutím na telefóne 0. Konzola: 0 chýb na telefóne, počítači aj s filmom. Snímky: `o5/snimky/o5-telefon-vyrez.png`
(výrez cenníka), `o5-telefon-myslis.png`, `o5-telefon-trvanie.png`, `o5-pocitac-panel.png`, `o5-pocitac-film-tlacidlo.png`.

## 4. Commity (len lokálne)

| commit | správa |
|---|---|
| 74e21fd | BARBERSHOP 30: recepcia – priama odpoveď len pri úplnom vysvetlení otázky |
| 15f1f7f | BARBERSHOP 30: recepcia – cena vždy vo výreze cenníka |
| 897a32b | BARBERSHOP 30: recepcia – trvanie len pri službe s trvaním |
| 21bc944 | BARBERSHOP 30: recepcia – čisté kmene a kombinatorické testy |
| 58f392d | BARBERSHOP 30: recepcia – panel nehýbe stránkou ani filmom |
| aeaafb7 | BARBERSHOP 30: recepcia – rozhodovanie len medzi položkami so zásahom (rýchlosť; odpovede bajtovo totožné) |

Commity som zostavil z konečného stavu skriptom `o5/stavy.py` (medzistavy A–E). Na každom medzistave prešiel
`recepcia-test.mjs` 23/23 (od B aj test P3, od D všetkých 7 kombinatorických testov) a slepé sady mali 0 holých chýb
(`o5/stavA…D-hodnotenie.txt`). Stav 58f392d je bajtovo zhodný s `o5/final/` (overené v `stavy.py E`); aeaafb7 mení v module jeden riadok
(`recepcia.js:55`, položky so skóre 0 sa pri rozhodovaní vynechajú) – slepé sady, sondy a otázky skeptika dávajú bajtovo
rovnaké výsledky, testy 23/23 a 7/7.

## Čo ostáva otvorené (nie je vážna chyba)

- **Zápor** („Nechcem bradu, len strih“, cs „bez vousů“, hu „nem kell hajvágás“, uk „не бороду“): „Myslíš toto?“,
  správna voľba je 3. – VOLBA-MIMO 4×; zápor pravidlá zámerne nehádajú.
- **ODCHYLKA bez ceny** 3×: „chcem sa objednat na strih“ → výber barbera (pred: rezervácia), „Máte TikTok?“ → Instagram,
  de „Hundefriseur?“ → tím.
- **Odovzdanie bez voľby** 25× (zväčša rovnaké ako pred opravou): srbská cyrilika, mená barberov, „mate kafe“ (cs),
  zápory s produktom, dlhé otázky.
- **D2 spodná hrana** sa v headless prehliadači nedala spoľahlivo zmerať (getBoundingClientRect zachytil začiatok
  nábehu, 848 px); snímka `o5-pocitac-panel.png` ukazuje spodok panela ~808 px nad tlačidlom (820 px).
- **scrollbar-gutter** je overený len v headless Chromiu so skrytými posuvníkmi; na počítači s klasickým posuvníkom
  a na iPhone (VoiceOver, klávesnica) treba pozrieť na zariadení (kritérium 8.4–8.5).
- Neriešené (mimo zadania): V2 kontroly vzhľadu (staré bubliny v pôvodnom jazyku – podľa návrhu 3.5 zámerne),
  V3 (prvé ťuknutie pustí hudbu, atmosfera.js), `app-smoke.mjs` a `i18n-test.mjs` som nespúšťal (i18n sa nezmenil:
  `git diff 6f8c47c..HEAD -- barbershop-30/assets/i18n | wc -c` → 0).
- Rezerva váhy uk je 45 B (zlib 6). Ďalšia zmena modulu musí ubrať inde.

## Súbory v `$S5/o5/`

`pred.txt`, `po.txt` (triedy kontroly 4, sondy, otázky skeptika), `pred-*.jsonl`, `po-*.jsonl`, `pred-hodnotenie.txt`,
`po-hodnotenie.txt` (slepé sady), `hodnot.py` (hodnotenie s pravidlom „správna voľba medzi prvými dvomi“), `beh.sh`
(celý beh), `cas-o5.mjs` + `cas-po.txt` (čas), `panel-o5.mjs` + `snimky/` (prehliadač), `kombinacie-na-6f8c47c.txt`,
`stavy.py` + `stav/` + `final/` (zostavenie commitov A–E, final = 58f392d), `jazyky_data.pred-o5.py`, `jazyky-gen.pred-o5.py` (dáta pred opravou),
`stavA…D-*` (hodnotenie medzistavov).
