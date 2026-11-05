# BARBERSHOP 30 – zlepšenia podľa VYBER.md (senior front-end, motion a výkon, 3. 11. 2026)

Strom `scratchpad/hs-skvrny` (vetva barbershop-skvrny), základ **791fb3db**, teraz **2179170f**: 22 lokálnych commitov
po slovensky, autor `Claude <noreply@anthropic.com>`, bez podpisových riadkov
(`git log --format=%B 791fb3db..HEAD | grep -ci "co-authored\|claude-session"` → 0). Nič nepushnuté ani nenasadené.
`git status --short` → prázdny. Výstupy: `barber/senior/zlepsenia/` (nástroje v `nastroje/`, snímky v `snimky/`,
hárok `pred-po.jpg` 357 kB – otvorený).

## Čo je hotové (v poradí podľa VYBER)

| bod | commit | výsledok merania (príkaz → výstup) |
|---|---|---|
| A1 BAR-01 smerovač | 0479a89a | `hodnot.mjs sada-150-ceny.json` → `c:ZLÉ ČÍSLO` 8 → **0**, `t:ZLÉ ČÍSLO` 1 → **0**, `c:TELEFÓN` 1 → **0**, zhoda server/okno **150/150**; `otazky.mjs --kontrola` OK (nová stráž „sada 150“, nulová tolerancia); sada 120 + A6: zmenených **0 z 240** (`barber/porovnanie-120-A6-A1.log`). Navyše „strih brady“ = úprava brady (15 €). |
| A2 BAR-02 dve služby | 69238eaf | kombinácie #127–#150: `k:ZLÉ ČÍSLO` 10 → 3 (#128, #131, #150 – neúplné prehľady, čísla pri správnych službách), #135 „strih pre syna a úprava brady pre mňa“ → 15 € + 15 € (nie 28 €); zhoda 150/150; server dá modelu všetky nájdené odpovede na prvé miesta (`otazky_pre_model` overené php). Stráž kombinácií v `otazky.mjs`. |
| A3 BAR-03/07 MIMO | 8e9423a2 | sada 120 `m:ZLÉ ČÍSLO` 3 → **0**; v 240 otázkach zmenené len 3 (trávnik, živý plot, holenie psa → telefón); „kedy ma otvorene posta“ a „Kedy je otvorená plaváreň?“ → telefón; „Video zo strihu“ ostáva `deti-fotenie` ako pred; MIMO v `otazky-ocakavane.json` 71 → 80. |
| A4 BAR-04 dlhý rozhovor | 1f527f98 | `nastroje/dlhy20.cjs` (20 otázok): pred 12× „Rozhovor je už dlhý“, odpoveď nevidno 12×; po **0×, 0×**, konzola 0; naostro cez `page.route`: 20 tiel, počty 1…15, max 15, všetky nepárne, začínajú aj končia `u`, max 14 830 znakov, zlých 0 (pred: po 8 otázkach koniec). Snímka `snimky/A4/ukazka-20.png` otvorená. |
| A5 BAR-05/06/08/09 | ca53734b | sonda 11/11 správne (`barber/A5-sonda.log`, vrátane 3 otázok BAR-06); `grep -c buldog barbershop.md` → 1; zhoda textov tímu s webom **10/10**; v 390 otázkach zo sád zmenených 6, všetky k lepšiemu (`barber/porovnanie-390-len-A5.log`); 3 ďalšie odpovede „Patrí k nemu…“ dostali podmet. |
| A6 REZ-01/05/08 | 25799c36 | `domena-kontrola.sh https://www.barbershop30.sk --web=…github.io…`: 1–3 OK, 4 POZOR (HTTP bez presmerovania), 5 CHYBA (301 na http), 6 POZOR 404, kód 1 (`domena/zive.log`). Kolízia (rezervacia.html ako súbor „rezervacia“, port 9007): 1 „chýba v-order-component“, kód 1, server zastavený podľa PID (`domena/kolizia.log`). README a TEMA_REZERVACIA prepísané. |
| A7 REZ-03 voľno | c8241692 | `kalendar-test.php` 24 OK / 0 FAIL (3 nové prípady volno/sviatky); `nastroje/okno-hrany.mjs` 57 OK / 0 FAIL: Adrianovo voľno `sobota 7. novembra, nepracuje` (nie zakázané), sviatok `piatok 6. novembra, zatvorené`, ťuk → „Adrian v tento deň nepracuje.“ + Iný barber → krok 2 (snímka `rezervacia/snimky/hrany/3-volno-390.png` otvorená); kľúče v 8 jazykoch. |
| A8 krok 4 | b695e1b4, 41b5f7d3 | `krok4-test.mjs` 8 jazykov: `viditelne` pred **false** (390/360/320) → po **true**, `poSpat` 0, 1 okno `https://www.barbershop30.sk/rezervacia`, ťahák so slovenskými názvami; `a8-kontrola.cjs`: výber po dvojkliku pred „Alebo si vyber…“, zoznam dní, `BARBER` → po `''` ×4; `outline-style` pred `solid` → `none`; Späť pri 320 pred 48 → 44 px; `okno-hrany` 57/0; `objednavka-test` 113 OK / 0 (test upravený na pätu). rezervacia.html: Dokončiť v obsahu pred Zavolať. Hárok `snimky/A8/krok4-harok.jpg` otvorený. |
| A9 WEB-01 otočenie | b35e6ec3 | `otocenie.cjs`: na výšku→na šírku pred `aria-modal true, inert 10, BODY` → po `null, 0, IMG`; na šírku→na výšku pred `null, 0` → po `true, 10`; nový test v `asistent-test.mjs` (bez servera: 2× OK, Tab ostane v okne). |
| A10 WEB-02 ponuka jazyka | 87bc8bdb | `sonda.cjs --casti=ponuka`: kryje pred 36 % / 53 % / 14 % (320×568, 568×320, 844×390) → po **0 % vo všetkých 7 oknách**; 390×844 a 1440×900 rovnaký box (16,68,358,58 / 508,72,423,58); pixelový rozdiel 390×844 len v pulzujúcej bodke „otvorené“ (51×51 px). Hárky `snimky/A10/pred-harok.jpg`, `po-harok.jpg` otvorené. |
| A11 FIL-2 strih sála→stôl | 54ee77cc | `a5-film --mode=desk1440 --variant=safari`: najv. tmavá plocha m30 24,9 % → **5,6 %**, m50 37,2 % → **9,3 %**, jas 46,9 → 63,3 / 68,7. Cieľ ≤ 5 % na m50 **nesplnený**: zvyšok je tmavý nábytok na samotnej fotke stola (m70 9,4 %). Hárok `film/A11-harok.jpg` otvorený. |
| A12 FIL-1/FIL-3 | d683388b | `a5-film-okno.mjs --variant=prod --passes=okno`: stred plátna po zmene **[14,13,12,255]** (pred [1,1,1,255]), `tatIstaSnimka: true` vo všetkých 36 zmenách, `zablesky: []`, čierne po snímke 0; `kontrola` stále zachytí [0,0,0,255]. Druhé `draw(now, 0)` odstránené (`grep -c "draw(now, 0)" film.js` → 0, snímka so zmenou kreslí raz). |
| A13 WEB-06 tablet | a18eef71 | `uvod-src.cjs`: 820×1180 @2 `vstup-2172` 1,04 → **`vstup-2896` 1,39 bodu/CSS px**, jedno stiahnutie (upravené aj prednačítanie a `stills.py`, `--check` zhodné); 390×844 `vstup-m-1448` a 1440×900 `vstup-2172` bez zmeny; 1024×1366 berie 4096 (+325 kB len na veľkom tablete). |
| A14 WEB-04 mobil-audit | 239a2355 | PIL stále rozbitý (`ImportError … _imaging`); `mobil-audit.mjs --w=390` dobehol (26 snímok, prehľad `a14/prehlad-w390.jpg`); tma počíta presne vzorec tma-test (jas ITU-R 601 < 22). |
| C1 PLY-01 | 03ec52dc | `zmensi.mjs`: gzip index 16 127 → **14 325 B**, en 16 040 → **13 946 B**, style.css 25 616 → 14 577 B; spracovaná kópia: i18n-test 55/0, app-smoke 109/0, en-test 15/1 (jediné „en/ je aktuálna“ – kópia je zámerne iná než zdroj). Stráž vo `vaha.mjs`: OK 14 339 B. |
| C2 PLY-07 | aead06e0 | `fetchpriority="low"` na film.js a vernost.js (index, en, rezervacia). Vlastné A/B Slow 4G som **nezopakoval**; podklad: `plynulost/ab-html.log` „nizkaPriorita“ fotka úvodu 4 183 → 3 717 ms. |
| C3 PLY-02 | b53c2601 | `rez-fotky.cjs` (Slow 4G): pred 4 fotky krokov pred load (3,1 s), load 5 555 ms → po **0 pred load**, load **3 781 ms**, LCP 3 660 → 3 488 ms, CLS 0; pri doskrolovaní načítané do 22 ms; bez skriptu noscript fotky viditeľné. |
| B1 KF-10 | 53a42e5e | `karta.mjs`: y=700 scéna 2 → **1** (karta Úvod), y=1139 3 → **2**, y=2400 5 → 4; app-smoke kapitoly 1→8 OK. |
| B2 KF-01 pás | 1b25c2dc | `kino-test.mjs` mobil/počítač: 8 kapitol, ťah, klávesnica (fokus Čakáreň, kap. 3), en/de/uk/hu, `chyby: []`; `prienik.cjs`: pás aj Ďalej **0 px²** s textom karty, cenníka, tímu, spodnými tlačidlami, ikonou Barbera a ponukou pri 320/360/390/430/1440; 0 poslucháčov skrolu v kóde pásu; app.js +1 824 B gzip (≤ 2,5 kB). |
| B3+B4 KF-02/03 | acf480c8 | `kino-ciele.mjs` počítač: 8 cieľov (0, 1125 … 13 904), státie 5,0 s s jazdou / 3,2 s po strihu, koniec na Rezervácii, celá jazda ≈ 30,6 s; prerušenie `hra: false`; obmedzený pohyb skoky; Ďalej „Ďalej Čakáreň ↓“ `#cakaren`; kino.js 2 480 B gzip; en/ stránka „Play the tour“, „Next Team ↓“. |
| B8 KH-07 | 2179170f | `.btn:active` scale(0,97) 120 ms (predtým translateY+scale 0,98 80 ms), pri obmedzenom pohybe nič. Pokojové snímky sa nemenia (pravidlo platí len pri stlačení). INP som nemeral. |

## Záverečná brána (kópia HEAD 2179170f, `nastroje/testy.sh`, porty 9000–9006)

| test | 791fb3db | HEAD |
|---|---|---|
| i18n-test | 55/0 | 55/0 |
| en-test | 16/0 | 16/0 |
| en-stranka --check | aktuálna | aktuálna |
| otazky.mjs --kontrola | OK (7) | OK (9, +2 nové stráže) |
| vychytavky-test | 27/0 | 27/0 |
| admin-test | 101/0 | 101/0 |
| app-smoke | 109/0 | 108/1 – `[softvér desktop] CLS 0.0283` |
| objednavka-test (zástupná knižnica) | 113/0 | 113/0 |
| asistent-test (zástupná knižnica) | 32/10 + TimeoutError | 32/10 + TimeoutError (to isté: chýba knižnica Anthropic) |
| vaha | – | stráž OK 14 339 B |
| mobil-audit (bez Pillow) | padal na Pillow | exit 0, 390 aj 1440 px, pretekanie 0 px (`zlepsenia/po/mobil-audit.log`) |

CLS 0.0283 je známy WEB-05: `nastroje/cls-sonda.cjs` ho ukáže aj na **791fb3db** (beh 2: 0.0283, zdroj `::before` a `NAV.nav`),
na HEAD rovnako (1 z 2 behov). `grep -oE '\bAI\b'` index / en / asistent-otazky.json → 0 / 0 / 3. `tma-test` nespúšťaný (Pillow).

## Čo nie je hotové (poctivo)

- **B5 titulky krok za krokom, B6 bod „Pozri bližšie“, B7 zvuk, C4–C9**: nezačaté (limit práce). B6 a B7 potrebujú film.js
  a atmosfera.js; poradie VYBER ich dáva na koniec.
- **Merania, ktoré chýbajú**: B2 `paint.mjs` a `ab.mjs` (dlhé úlohy), čierne bunky `a2-vzhlad`; B4 kontrast ≥ 4,5 : 1 z pixelov
  (Ďalej má zosilnený tieň a biely text, ale nemeral som); C1 a C2 vlastné A/B `mer.cjs` Slow 4G (len staršie A/B z plynulosti);
  A11 `obrazovka.mjs` p010; A12 počítadlo drawElements (dôkaz je v kóde); B8 INP; `a3-seo.mjs`, `sonda2.cjs`.
- **A11** cieľ ≤ 5 % na m50 nesplnený (9,3 %, tmavý nábytok na fotke), jas splnený.
- **vaha „do load“** v tomto kontajneri kolíše (791fb3db pri dvoch behoch 250 a 187 kB na telefóne), preto rozpočet +3 kB
  dokladám gzipom: app.js +1,8 kB, nasadený style.css +0,9 kB (a zároveň −11 kB vďaka C1), kino.js až po load.
- **▶ a hudba**: ťuk na ▶ pustí hudbu tým istým pravidlom prvého ťuknutia ako inde (atmosfera.js, kľúč `b30-hudba` = `vyp`
  ju nepustí); explicitné volanie som nepridal, lebo C6 nie je urobené.
- **Safari na iPhone** (Kino, pás, otočenie) sa v kontajneri overiť nedá – kontrola na zariadení majiteľa.

## Pre majiteľa

1. Pozrieť Kino ▶ a pás kapitol na iPhone a Macu (2–5 min).
2. Doména: `domena-kontrola.sh` dnes hlási REZ-08 (https://…/rezervacia/ → http) – úloha hostingu.
3. Strih sála → stôl na počítači je teraz pohybom bez tmavého operadla; strih čakáreň → ranná sála (tiež popri operadle) ostal.
