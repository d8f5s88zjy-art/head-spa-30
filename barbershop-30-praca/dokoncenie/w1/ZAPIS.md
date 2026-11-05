# BARBERSHOP 30 – dokončenie, zapisovateľ 1 (senior front-end a výkon, 5. 11. 2026)

Strom `scratchpad/hs-skvrny` (vetva barbershop-skvrny), základ **a24ec0c8**, teraz **0f74fcdb**: 11 nových lokálnych
commitov po slovensky, autor `Claude <noreply@anthropic.com>`, bez podpisových riadkov
(`git log --format=%B a24ec0c8..HEAD | grep -ci 'co-authored\|claude-session'` → 0; od c8febb66 tiež 0;
`git log --format='%an <%ae>' a24ec0c8..HEAD | sort | uniq -c` → `11 Claude <noreply@anthropic.com>`).
`git branch -vv` → `[origin/barbershop-oprava: ahead 40]`. Nič nepushnuté, nenasadené, nič neinštalované; na živý
rezervačný systém som nesiahol. `git status --short | wc -l` → 0.
Cesty nižšie sú relatívne k `scratchpad/barber/senior/dokoncenie/w1/` (nástroje `nastroje/`, logy `log/`, snímky `snimky/`).

Práca prebehla v dvoch častiach: 10:40–12:50 (9 commitov, potom limit) a po limite 17:00–17:50 (overenie týchto
commitov, nový nález WEB-05 opravený, lastmod, celá záverečná brána).

Podmienky meraní: Chromium 153 (Playwright), SwiftShader, telefón 390×844 DPR 3, dotyk, CPU 4× (CDP), 4G, A = kópia
a24ec0c8 (`git archive`, port 9000), B = snímka stromu v RAM (`nastroje/snimka-b.sh`, port 9001), behy striedavo
(b1 A→B, b2 B→A …), nástroj `nastroje/ab.cjs`. Záťaž stroja (súbežné úlohy) je v hlavičke každého logu.

## Commity

| commit | čo | hlavný dôkaz |
|---|---|---|
| cefd61a7 | Kino na počítači: koliesko a klávesy zastavia aj s myšou či fokusom na ▶ | kino-test blok 6 |
| 5f9e8f86 | C4 ťuky bez vynúteného rozloženia (+ Tab z menu ostane v lište) | `log/ab-interakcie-C4-final.log`, `log/ab-interakcie-overenie.log` |
| 8cd9912c | C6 prvý ťuk na ovládač nezakladá AudioContext | `log/ab-interakcie-C6.log`, `log/ab-interakcie-overenie.log` |
| 84df1285 | Barber pri dvoch službách menuje obe s cenou | `log/barber-dve-sluzby.log` |
| 56050c61 | C7 uložený jazyk: prednačítanie, najprv lišta a úvod | `log/ab-jazyk-C7-final.log`, `log/ab-jazyk-overenie.log` |
| f47c5652 | C8 film.js len tam, kde film bude | `log/ab-film-C8.log`, `log/ab-film-overenie.log` |
| 3142f345 | C5 plán lenivých modulov (prvý švih) | `log/ab-gesto-C5b*.log`, `log/ab-gesto-overenie.log` |
| 3892ebb3 | „Ďalej“ zo slovníka i18n | `log/dalej-i18n.log` |
| 0d0d2e0c | app.js späť v rozpočte (len komentáre) | gzip nižšie, kanonický kód zhodný |
| **daa19891** | **WEB-05: živý stav v úvode má miesto už v prvom obraze (CLS 0,028 na počítači preč)** | `log/cls-web05-oprava.log` |
| **0f74fcdb** | lastmod v sitemap.xml 2026-11-05 (a3-seo OK 171) | `log/a3-seo-final.log` |

## 1. Kino na počítači (nález skeptika 2) – opravené

Príčina `kino.js:55–57`: prerušenie ignorovalo udalosti s cieľom v `.kino-play` a kláves pri fokuse na ▶. Teraz
(`assets/kino.js:58–61`) koliesko a kláves zastavia vždy; ▶ prepína len kliknutím a Enter/medzerník na fokusovanom ▶
sú to isté kliknutie; dotyk a stlačenie mimo ▶ ako doteraz. `kino-test.mjs` blok 6 (rovnaký test na oboch verziách,
`log/kino-test-a24ec0c8.log`, `log/kino-test-po.log`):

| kontrola (1440×900, po kliknutí na ▶ a 3 s jazdy) | a24ec0c8 | teraz |
|---|---|---|
| koliesko s myšou nad ▶ | FAIL, jazda ďalej 1 084 px za 1,5 s | OK, 2 px |
| šípka ↓ (fokus ostal na ▶) | FAIL, 1 078 px | OK, 0 px |
| PageDown | FAIL, 406 px | OK, 0 px |
| koliesko v strede stránky | OK, 2 px | OK, 2 px |
| medzerník a Enter na ▶: pustí, zastaví | OK | OK |
| telefón 390 dotyk: ťuk na ▶ (po 5 s y 1 055), ťuk do stránky zastaví | rovnako (posun 0 px) | rovnako (`nastroje/kino6.mjs`) |

Záverečný kino-test na HEAD: **46 OK / 0 FAIL** (`log/testy-FINAL2/kino-test.log`).

## 2. C4–C9 (každé A/B voči a24ec0c8)

Po limite som A/B pre C4–C8 zopakoval nezávisle, 5 + 5 behov (nepárny počet, medián je stredná hodnota), proti B =
HEAD. Čísla „overenie“ sú z týchto behov, pôvodné v zátvorke.

### C4 – ťuknutia bez vynúteného rozloženia (zapracované)
Stopa s `stackTrace` (`nastroje/vynutene.cjs`, `log/vynutene-a24ec0c8.log`): menu `ctaHidden@app.js:299` číta scrollY
(13+13 ms) a `focus()` po `inert` prepočíta 849 prvkov (75 ms); Barber `prisposob@asistent.js:458` číta výšku okna po
inert (100 ms, 949 prvkov) a `scrollHeight` (14 ms); objednávka `showModal()` (121 ms) a potom `offsetWidth`, `focus`,
`scrollTop`. Po oprave (`log/vynutene-C4.log`) v snímke ťuku na menu a Barbera 0 vynútených prepočtov.

| ťuk, medián INP | a24ec0c8 | HEAD (overenie 5 + 5) | pôvodne 4 + 4 | cieľ VYBER |
|---|---|---|---|---|
| menu otvoriť | 192 ms (vynútené 104) | **80** (0) | 168 → 80 | ≤ 200, vynútené ≤ 30 |
| menu zavrieť | 144 | **64** | 136 → 64 | |
| Barber otvoriť | 200 | **104** | 208 → 120 | ≤ 200 |
| Barber zavrieť | 120 | **64** | 136 → 88 | |
| Objednať (okno) | 216 | **200** [200, 240, 192, 208, 160] | 312 → 176 | ≤ 200 – na hrane |
| galéria (nemenené) | 152 | 136 | 136 → 144 | |

Objednať je presne na cieli: zvyšok (vynútené ~110 ms) je samotný `showModal()` – modálne okno musí prepočítať štýl
celej stránky (inertná stránka pod ním). Ďalšie zníženie by chcelo `content-visibility` na vzdialených pásoch, čo mení
meranie polôh filmu v app.js – neskúšal som (riziko pre film). Prístupnosť (`nastroje/fokus.cjs`, `log/fokus-C4b.log`
a overenie): Barber modálny (aria-modal, inert 10, fokus v okne 5/5), Esc a zatvorenie vrátia fokus, objednávka
s fokusom v okne 5/5, fokus v menu 5/5. **Nový nález opravený popri C4:** Tab z otvoreného menu utekal na ▶ a kapitoly
pásu, ikonu Barbera a preskakovací odkaz (12× z 30 mimo lišty, `nastroje/tab.cjs`); teraz 1× (dokument).

### C5 – prvý švih bez piatich modulov naraz (zapracované)
Plán v app.js (5b): po load po jednom v nečinnosti a mimo skrolu, n-tý modul najneskôr 0,7·n s po spustení plánu;
gesto plán len spustí; hneď len uložený jazyk, ▶ a Objednať. Dotyk 0,5 s po load, 4 švihy, prvé 3 s:

| | a24ec0c8 | HEAD (overenie 5 + 5) | pôvodne 5 + 5 | cieľ |
|---|---|---|---|---|
| p95 snímky | 83,3 ms | **50** | 83,4 → 66,7 | ≤ 120 |
| najdlhšia snímka | 250 ms | **167** | 233 → 167 | ≤ 300 |
| snímky > 50 ms | 10 | **5** | 8 → 8 | |
| dlhé úlohy spolu | 245 ms | **120** | 415 → 293 | ≤ 2 000 |
| Barber / Hudba po load (pri švihaní) | 1,4 / 1,1 s | 2,5 / 3,8 s | 2,5 / 3,9 s | do 4 s |
| Barber / Hudba bez gesta (`log/ab-gesto-C5b-bezgesta.log`) | 4,1 / 3,9 s | 1,8 / 2,3 s | – | do 4 s |

atmosfera-test 41/0, aj „pred prvým gestom sa atmosféra nesťahuje“, ktoré na a24ec0c8 padalo.

### C6 – prvý ťuk na ovládač nezakladá AudioContext (zapracované)
AudioContext po 1. ťuku na menu: a24ec0c8 **1,1,1,1,1 → HEAD 0,0,0,0,0** (overenie; pôvodne 4 + 4 rovnako), INP 1. ťuku
na menu 192 → 80 ms (cieľ ≤ 300). Ťuk do fotky či textu hudbu pustí, ▶ Kino zámerne (B3), „vypnuté“ platí.

### C7 – uložený jazyk (zapracované)
Hlavička pridá modulepreload i18n.js a preload slovníka s nízkou prioritou; i18n.js najprv preloží lištu a kartu úvodu.
`?lang=en`, 4G (overenie 5 + 5, `log/ab-jazyk-overenie.log`): odkrytie úvodu medián **2 000 → 1 690 ms**, FCP
856 → 788 ms, LCP (fotka) **1 104 → 1 036 ms** (cieľ ≤ 1 300); i18n.js začne o ~220 ms namiesto ~1 100 ms; prvý
viditeľný nadpis je v oboch verziách po anglicky. Pôvodne 6 + 6: 1 973 → 1 843 ms, LCP 1 128 → 1 154 ms.

### C8 – film.js len tam, kde film bude (zapracované)
`log/ab-film-overenie.log`: pri pamäti 2 GB, obmedzenom pohybe, `?motion=off`, `?film=off` a en/ s 2 GB film.js
110 382 B (a24ec0c8) → **nestiahnutý**, world-off už pri DOMContentLoaded; bežný telefón a `?film=on` ho sťahujú ako
predtým; konzola 0. 7 dvojíc snímok A/B pixelovo zhodných (`log/c8-snimky-cmp.log`). Nástup samotného filmu
(world-in) sa v kontajneri (SwiftShader) nedá spoľahlivo overiť: `nastroje/film-on.cjs` 3 + 3 – ani A, ani B do 40 s,
v `ab-film` raz A áno a B nie, v pôvodných logoch ani jeden (`log/film-on-overenie.log`). Rozdiel A/B tu nevidím.

### C9 – `--sp` ako scroll-driven animácia: **vynechané, zdôvodnenie**
Variant (HEAD + `@property --spv`, `view-timeline` na kotve, app.js `--sp` nepíše; `nastroje/c9-variant.sh`):
- výkon (skrol celou stránkou, 3 + 3, `log/ab-skrol-C9.log`): čas štýlu 7 233 → 4 832 ms (**−33 %**, cieľ ≥ 40 %),
  mutácie 1 139 → **352** (cieľ ≤ 250) – ciele VYBER nesplnené;
- vizuálna zhoda nesplnená: dnešná cesta kameru **dobieha** – `shownP` sa k cieľu blíži lerpom 0,16 na snímku
  (`assets/app.js:167`, `:296`) a `--sp` sa píše z neho (`:203`, `:306`); CSS časová os by išla presne so skrolom.
  Po limite som to overil znova (`log/c9-dobiehanie-overenie.log`): 150 ms po skoku sa `--sp` líši od polohy
  o 0,017–0,286 (1440) a 0,077–0,211 (390), po 2 s o 0. C9 by teda zmenilo pohyb filmu, nielen výkon.
Návrh pre ďalšie kolo: najprv rozhodnúť, či je dobiehanie žiaduce; potom C9 s overením v Safari (pred 26 bez podpory).

## 3. Drobnosti

- **Barber, dve služby (SKEPTIK #13):** nová odpoveď `deti-syn-strih-a-brada` (strih pre malých gentlemanov 15 €,
  45 min; úprava brady 15 €, 20 min) a odpoveď kombinácie 28 € doplnená o samostatné ceny (pánsky strih 18 €, 40 min;
  úprava brady 15 €, 20 min). Ceny a dĺžky som po limite porovnal s `asistent/znalosti/barbershop.md:48–54` – sedia.
  Stráž v `otazky.mjs` („dve služby v jednej otázke“, 4 otázky): a24ec0c8 4 FAIL, teraz OK; `--kontrola` na HEAD
  10 OK / 0 FAIL, 779 otázok. V prehliadači: „strih pre syna a úpravu brady pre mňa, koľko to bude?“ → obe služby
  s cenami; „Koľko stojí strih a koľko úprava brady?“ → 28 € a samostatne 18 € a 15 € (`log/barber-dve-sluzby.log`).
- **„Ďalej“** zo slovníka (`tr('Ďalej')`, 7 jazykov), pri zmene jazyka ho obnoví kino.js (`log/dalej-i18n.log`);
  záverečné snímky: „Ďalej Tím ↓“ na 390 aj 1440.
- **app.js gzip** (`gzip -9`): 791fb3db 15 657 B, a24ec0c8 18 265 B (+2 608, nad rozpočtom), teraz **17 803 B
  (+2 146, rozpočet +2 500)**. 0d0d2e0c mení len komentáre – po limite overené kanonickým kódom (parser
  a tlačiareň TypeScriptu bez komentárov): 3892ebb3 a HEAD `ba81dbdd…` → „KÓD ZHODNÝ“.

## 4. Nový nález po limite: WEB-05 – CLS 0,028 na počítači (opravené, daa19891)

Predchádzajúca záverečná brána mala `app-smoke` 108/1 (`[softvér desktop] bez posunu rozloženia (CLS 0.0283)`,
prerušovane aj na a24ec0c8). Sonda `nastroje/cls-karta.cjs` (sleduje kartu úvodu od prvého obrazu) našla príčinu:
`.hero-live` („Teraz otvorené · …“) je v HTML skrytý (`index.html:197`) a app.js ho vyplní a odkryje (`app.js:893–904`)
až po prvom rozložení; karta úvodu narastie 527 → 575 px, posunie sa (y 207 → 182) a s ňou `.title-card::before`
(`style.css:1129`, `inset: -55% -28%`, plocha 1148×900) – odtiaľ 0,028. Posun lišty o 12 px pri písmach Manrope
600/700 má len ~0,0001.

Oprava (`style.css:1526–1529`, 4 riadky): so skriptom (trieda `karty` z hlavičky) má `.hero-live[hidden]` rezervované
miesto neviditeľne (`visibility: hidden`, nezalomiteľná medzera ako riadok textu) a `animation: none`, takže nástup
`text-in` sa spustí až po vyplnení ako doteraz. Bez skriptu ostáva skrytý.

| meranie | a24ec0c8 | HEAD |
|---|---|---|
| počítač 1440, behy s CLS > 0,01 (12 + 12 striedavo, `log/cls-web05-oprava.log`) | 4 / 12 | **0 / 12** |
| karta úvodu: posun pri vyplnení (`cls-karta.cjs`; ľavý stĺpec je 0d0d2e0c pred opravou) | 1 / 6 behov | 0 / 8 |
| telefón 390 DPR 3, CLS (5 + 5, `log/zive-nastup.log`) | 0 | 0 |
| nástup živého stavu: opacity 0 do 650 ms po vyplnení, potom rastie | áno | áno |
| úvod v pokoji, pixely (`nastroje/uvod-ab.cjs` + `cmp.cjs`) | – | 390: 5 bodov z 2,96 mil. nad prahom (max 11), 1440: 4 body (max 13) = zhodné |
| app-smoke `[softvér desktop]` | prerušovane FAIL | **OK, CLS 0,0001** (mobil 0) |

## 5. Záverečná brána (HEAD 0f74fcdb)

**Testy** – kópia stromu v RAM (`nastroje/testy.sh FINAL2`, `log/testy-FINAL2/vysledky.txt`, 17:08–17:24, kópia
daa19891; 0f74fcdb mení len sitemap.xml): **0 FAIL**.

| test | výsledok |
|---|---|
| otazky.mjs --kontrola | 10 OK / 0 FAIL, 779 otázok, 11 tém |
| kino-test | 46 / 0 |
| i18n-test | 55 / 0 |
| en-test | 16 / 0 |
| en-stranka.mjs --check | en/index.html je aktuálna |
| vychytavky-test | 27 / 0 |
| objednavka-test | 15 / 0 (časti so serverom PRESKOČENÉ – chýba knižnica, ako doteraz) |
| asistent-test | 9 / 0 (to isté) |
| vaha | OK, nasadená index.html gzip 14 248 B (hranica 14 600) |
| app-smoke | **109 / 0** (softvér desktop CLS 0,0001, mobil 0) |
| admin-test | 101 / 0 |
| mobil-audit | pretečenie 0 px pri 360, 390, 430, 768, 1440; výšky stránky zhodné s 0d0d2e0c |
| atmosfera-test | 41 / 0 |
| tma-test | nespúšťaný (Pillow) – tma cez a2-vzhlad nižšie |

**Konzola a odpovede** (`nastroje/konzola10.cjs`, 10 stránok × 320/390/1440 s celým skrolom): na snímke HEAD
(`log/konzola10-final.log`) 27 z 30 kombinácií 0/0; karta/ hlásila 3× 404 na `/vernost/api/?a=stav`, lebo snímka
obsahuje len `barbershop-30/`. Na serveri celého stromu `hs-skvrny` (ako predpisuje zadanie, port 9007,
`log/konzola10-karta-strom.log`) karta/ **0 chýb, 0 odpovedí ≥ 400**. Spolu: **chyby 0, ≥ 400 0, pretečenie 0 px**.

**Vzhľad** (`audit-final/nastroje/a2-vzhlad.cjs --port=9005 --strany=index,en,rez,404 --okna=320x568,390x844,1440x900`,
212 snímok, `log/a2-vzhlad-final.log`, `log/a2-suhrn-final.log`): preteká 0, orezaný text 0, ovládač mimo okna 0,
foto 0, chyby 0, **súvislé čierne plochy 0**. Podiel čiernych buniek v snímke (nástroj ho dáva ako zlomok) max
**0,015** (index 320/390) a **0,021** (en 320) – rovnako ako pôvodný audit (`audit-final/A2-vzhlad/hlavna`:
index 0,015, en 320 0,021) a beh web/ (0,015), ktorý to zapísal ako „≤ 0,059 %“; je to roztrúsené tmavé pozadie okolo
textu karty, nie diera. Otvorená snímka `snimky/final/a2-en-320-s017.jpg` (Galéria, text na tmavom pozadí, fotka hore).

**SEO** (`audit-final/nastroje/a3-seo.mjs --port=9004`, `log/a3-seo-final.log`): **OK 171, POZOR 16, CHYBA 0**
(pred lastmod OK 169, POZOR 18; zvyšné POZOR sú známe: hreflang len v sitemap, DEPLOY STEP domény, noindex rezervácie…).

**Váha telefónu do load** (`nastroje/vaha-ab.cjs`, 390×844 DPR 3, súčet odpovedí do udalosti load, gzip -9;
`log/vaha-ab.log`):

| | 791fb3db | a24ec0c8 | HEAD |
|---|---|---|---|
| `?film=off` | 384 101 B | 388 710 B | **347 396 B** (−36,7 kB voči 791: film.js sa nesťahuje) |
| predvolene (telefón s filmom) | 533 068 B | 539 356 B | 539 718 B (+6,6 kB; z toho recenzie.js 1,7 kB len súbeh pred load, zdroj s komentármi) |

Nasadená podoba (`zmensi.mjs` rovnako na všetky tri, gzip -9): index −8 B, style.css +979 B, app.js +2 146 B voči
791fb3db = **+3 117 B** (+3 355 B s film.js +238 B), teda o 0,1–0,4 kB **nad** rozpočtom „+3 kB“. Voči skutočne
nasadenej 791fb3db (tá ešte komentáre neodstraňovala, `zmensi.mjs` pribudol v 03ec52dc) je to **−9,7 kB**
a voči a24ec0c8 −477 B. Prekročenie vzniklo pred a24ec0c8 (B1–B8 a opravy A); toto kolo váhu znížilo. app.js je
v rozpočte (+2 146 ≤ +2 500 B). Rast app.js je kód, nie komentáre (komentáre sú dnes kratšie ako v 791fb3db),
preto ďalšie škrtanie komentárov som nerobil; ~2 kB by ušetrila minifikácia JS pri nasadení (nástroj v CI –
rozhodnutie pre hlavnú reláciu).

**AI v texte:** `grep -oE '\bAI\b'` v `index.html`, `en/index.html`, `assets/asistent-otazky.json` → **0 / 0 / 3**
(štítok pri ikone Barbera nezmenený).

**Snímky 390 a 1440** (`nastroje/snimky-final.cjs`, `log/snimky-final.log`: chyby 0), všetky štyri otvorené:
- `snimky/final/final-390-uvod.png` – fasáda, ▶ vľavo hore, nadpis, „Teraz otvorené · 9:00 – 19:00“, Objednať sa
  a Zavolať; bez čiernych polí;
- `snimky/final/final-1440-uvod.png` – úvod s autom, lišta, živý stav pod podnadpisom, ▶ dole;
- `snimky/final/final-390-cakaren-dalej.png` – Čakáreň, pás kapitol 4/8, „Ďalej Tím ↓“, karta pod fotkou;
- `snimky/final/final-1440-cakaren-dalej.png` – Čakáreň, „Ďalej Tím ↓“ vľavo dole, pás so štítkom „04 · Čakáreň“.

**Porty a upratanie:** moje servery 9000, 9001, 9007, 9009 (PID v `log/server90*.pid`) zastavené podľa PID; testy
mali 9002 a 9008, a2 9005–9006, a3 9004 (vlastné servery nástrojov). `/dev/shm/w1` zmazaný.

## Čo sa overiť nedalo / pre majiteľa

- Safari na iPhone a Macu (WebKit v kontajneri nie je): Kino ▶ (koliesko, šípky), poradie fokus/inert v menu a
  Barberovi (VoiceOver), nízka priorita prednačítania pri uloženom jazyku.
- Skutočný telefón: čísla INP a švihu sú zo SwiftShaderu pri CPU 4×; porovnávajú A a B v tom istom behu.
  Objednať (okno) je pri CPU 4× presne na 200 ms – na skutočnom telefóne overiť.
- Nástup filmu (world-in) a server Barbera a kalendára naostro sa v kontajneri overiť nedajú.
- Damian: podľa zadania som web, Barbera ani znalosti nemenil – otázka pre majiteľa (SKEPTIK nález 1).
- C9 (dobiehanie kamery vs. menej práce štýlu) – rozhodnúť, či zachovať dobiehanie.
- Rozpočet váhy: pri rovnakom nasadení +3,1 kB voči 791fb3db (cieľ +3 kB); minifikácia JS pri nasadení by to vyriešila.
