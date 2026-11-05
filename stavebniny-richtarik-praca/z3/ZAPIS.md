# z3 – asistent na otázky pre Stavebniny Richtárik: dokončenie po limite (5. 11. 2026)

Rola: zapisovateľ 3 (asistent), jediný, kto píše do `hs-richtarik-asistent`. Vetva `richtarik-asistent` z `4b2646bf`,
HEAD `2eda9c90`, `git status --short | wc -l` → `0`. V `hs-richtarik-obnova` (vetva `richtarik-profi`) som nič nemenil.
Cesty nižšie sú relatívne k `richtarik/profi/z3/`, ak nie je uvedené inak. Porty 9600–9609, všetky ukončené (časť 9).

## 1. Zhrnutie

- Predchádzajúci zapisovateľ 3 urobil 4 commity (7b35e256, d6af738c, daf2b543, 2d77cd3f). Všetky som overil
  znova na dnešnom strome. Pribudli 4 commity: zlúčenie bez konfliktu, `.htaccess` pre znalosti, oprava odkazov na
  telefón v odpovedi a rozohriatie pri meraní.
- **Skúšobné zlúčenie s `richtarik-profi` (0cfbc952, nový úvod z1) prejde bez konfliktu.** Dôkaz:
  `git merge-tree --write-tree richtarik-profi richtarik-asistent` → strom `365d7d5e…`, exit 0. Predtým boli
  2 konflikty (`index.html` a `build.py`). Na zlúčenej kópii prešlo okno 81/81, prehliadka webu, brány aj iframe.
- **A/B úvodu (telefón, CPU 4×, záťaž 1,3–1,8, 6 kôl):** LCP s asistentom 386 ms, s `?asistent=off` 400 ms,
  čisté z1 408 ms. Dlhé snímky v okne úvodu 0 v 6 zo 6 behov, ikona v prvých 4 s 0×, CLS 0.
- **Server proti falošnému API 27/27, okno 81/81** (telefón aj počítač, ukážka aj naostro proti skúšobnému serveru),
  kontrola častých otázok 534 OK a 1 známy FAIL. Balík bez `ASISTENT_API` je bez asistenta, s ním 75 z 75 stránok
  s adresou servera.
- **Nová chyba nájdená a opravená:** mobil 0905 622 223 v texte odpovede nebol odkaz na volanie a zalamoval sa.
  Časť DIČ SK1083167855 sa naopak brala ako telefón (časť 3c).
- **Ostáva pre z2 a zlučovača:** `caste-otazky.html` ešte nie je, preto zhodu stránky s 60 odpoveďami zatiaľ nemožno
  overiť. Nástroj je pripravený a vyskúšaný (časť 6b).

### Kritériá Z3-01 až Z3-08

| ID | výsledok | dôkaz |
|---|---|---|
| Z3-01 | OK (75 z 76 HTML, zámerne) | `staticke.txt`: `data-asistent="ukazka"` na 75 stránkach webu. Bez neho je len `asistent/ochrana-udajov.html`, čo je stránka asistenta s `noindex`, ktorá okno nenačíta. `git check-ignore -v asistent/config.php` → `asistent/.gitignore:1:config.php`. `sk-ant-` s 8+ znakmi: strom 0, `git log -p richtarik-profi` 0, `git log -p richtarik-asistent` 0. |
| Z3-02 | OK, okrem zhody s `caste-otazky.html` (čaká na z2) | `otazky-3-suhrn.txt`: 534 OK, 1 FAIL (známy „Kedy by ste mi to vedeli doviezť?“ 0,57). Mimo témy 20/20, odkazy 26/26, znenia 395/395, PHP = JS 131. Zakázané tvary (super ceny, superlatívy, Iveco/LIAZ, zložíme, mechanickými rukami) 0, tykanie 0 (`staticke.txt`). Keď na webe sú `doprava.html` a `caste-otazky.html`, generátor ich doplní a kontrola prejde 537/1 (`otazky-po-z2-skuska.txt`). |
| Z3-03 | OK | `prehliadac-5-vetva.txt` a `prehliadac-5-zlucenie.txt`: titul, štítok pri ikone aj mene, podtitul ukážky aj ostrého režimu, pozdrav, poznámka a Ochrana údajov sú OK. `grep -rnwI AI` mimo `asistent/`, `assets/asistent*` a `ochrana-udajov.html` (bez `pdf/`) → 0. 24 zhôd je len v binárnom prúde `pdf/287.pdf`, ktorý je zhodný s 4b2646bf. AI v správach commitov 0. |
| Z3-04 | OK | Ikona sa skryje nad úvodom aj bez atribútu (časť 4). Ikona dole/lišta hore: 320 px 556/571, 360–414 px 716/731. Počas strihu 0–4 s ikona 0× v 19 vzorkách a 0× v 6 + 8 behoch A/B. Modul ide pri geste, inak 3,5 s po `load` a najskôr 5,5 s od začiatku (namerané 5 503–5 533 ms). A/B je v časti 5. Jas za oknom 237,6 (telefón) a 223,7 (počítač). Pri „obmedziť pohyb“ je okno bez animácie (`none`). |
| Z3-05 | OK | 200 a `noindex` (prehliadač). Údaje o firme sa zhodujú s FAKTY A: Ing. Mário Richtárik - Stavebniny, Novozámocká 62/68, 949 05 Nitra – Horné Krškany, IČO 45959846, 0905 622 223, info@stavebninyrichtarik.sk. Stránka má pás „Návrh textu na schválenie majiteľom…“, teda **text na schválenie majiteľom**. |
| Z3-06 | OK | `server-testy-2.txt`: 27 OK, 0 FAIL. Model `claude-opus-5-5`, úsilie low, záložný model, prúd, kľúč nie je v odpovedi a v databáze sú len odtlačky. Limity 12/10 min, 40/deň a 400/deň (`lib/jadro.php:78–80`), CORS (`lib/jadro.php:11`). |
| Z3-07 | OK | `balik-bez-2.txt`: 0 stránok s `data-asistent`, 0 chýbajúcich odkazov zo 6 592. `balik-s-2.txt`: 75 z 75 stránok s presnou adresou servera, 0 chýbajúcich zo 6 673. `balik-kontroly-2.txt`: testy, nástroje, README, `config.php` a `vendor/` v balíku 0. Zlá adresa → `CHYBA`, exit 1. |
| Z3-08 | OK, voči z1 namiesto zf | Brány OK na vetve, zlúčení aj z1 (`brany-2.txt`). Okno 81/81 (viac ako 50) na vetve aj zlúčení. Medián LCP zlúčenia 386 ms voči z1 408 ms. zf ešte neexistuje (`richtarik/profi/zf` chýba), preto som meral voči poslednému `richtarik-profi` 0cfbc952. Chyby JS 0. |

## 2. Overenie predchádzajúcej práce (commity 7b35e256 až 2d77cd3f)

- Build: `venv/bin/python build.py` → exit 0, bez „POZOR“ z `kontrola_uvodu()` (`build.txt`). Pregenerované stránky
  sú bez rozdielu proti commitu.
- Testy servera, okna, častých otázok a balíka som spustil znova na dnešnom strome. Výsledky sú v časti 1 a sú rovnaké
  alebo lepšie ako záznamy pred limitom (`server-testy.txt`, `prehliadac-3.txt`, `balik-*.txt`).
- Neplatné ostalo len pôvodné meranie A/B (`ab-uvod-1.txt`: rozdiel 106 ms pri záťaži 11–12). Nahradil ho nový
  beh v časti 5.

## 3. Čo som doplnil (4 commity)

### 3a. `3c00cf80` Zlúčenie s novým úvodom bez konfliktu

- `index.html`: zrušený `data-bez-asistenta` na starej sekcii `.hero film`. Asistent spozná úvod podľa
  `section[aria-labelledby="h-uvod"]`, ktorý má starý `.hero` aj nový úvod z1 `<section class="uv" aria-labelledby="h-uvod">`.
  Selektor je v `assets/asistent.js:29`, komentár na `:27–28`.
- `build.py:1165`: kontrola `data-asistent="ukazka"` v `kontrola_uvodu()` je o riadok vyššie (pred `FIRMA`). Mimo
  bloku, ktorý prepísal z1, preto git zlúči sám.
- README (`README.md:124–132`, `asistent/README.md:15`): opis, podľa čoho sa ikona nad úvodom skryje.

### 3b. `d283a758` Znalosti zatvorené aj bez mod_rewrite

- Nový `asistent/znalosti/.htaccess` (Require all denied, rovnaký ako `lib/.htaccess`). Komentár je v `asistent/.htaccess:2–3`.
  Prehľad súborov je v `asistent/README.md:20`.
- README asistenta už neodkazuje na pracovný zápis mimo repozitára (`asistent/README.md:34`).

### 3c. `0b59c5b0` Telefón v odpovedi ako odkaz, DIČ bez odkazu

- Vzor `ODKAZ` v `assets/asistent.js:71` chcel za predvoľbou tri skupiny číslic. Mobil 0905 622 223 má dve, preto
  nebol odkazom. Pri pevnej linke s tromi skupinami chyba nebola.
- Pri DIČ SK1083167855 našiel vzor „083167855“ a urobil z neho odkaz `tel:`. Doklad je v `telefon-vzor.txt`: starý vzor
  v 60 odpovediach našiel `037 651 17 77` a `083167855`, nový `0905 622 223` 25× a `037 651 17 77` 1×.
- Oprava:
  - dve alebo tri skupiny číslic,
  - zhoda za písmenom, číslicou alebo „+“ sa preskočí (`assets/asistent.js:89`), bez lookbehind kvôli starším Safari,
  - dátum `28. 1. 2026` je v `span.asi-nz` (`assets/asistent.js:73–78`),
  - telefón aj dátum majú `white-space: nowrap` (`assets/asistent.css:92–93`).
- V 60 odpovediach je teraz 25× odkaz na mobil, 1× na pevnú linku a DIČ ako text.
- `asistent/nastroje/prehliadac.mjs` pribudli 3 kontroly na telefóne aj počítači: odkaz `tel:` v jednom riadku, dátum
  v jednom riadku a DIČ bez odkazu. Odkazy na stránky berie len z `a[href^="http"]`.
- Snímku `prehliadac-5-vetva/telefon-4-rozhovor.png` som otvoril. Mobil je podčiarknutý odkaz na jednom riadku a
  „28. 1. 2026“ nie je rozdelený. Predtým to bolo „28.⏎1. 2026“ a „0905⏎622 223“ bez odkazu
  (`prehliadac-4-zlucenie/telefon-4-rozhovor.png`, otvorená).

### 3d. `2eda9c90` Meranie po rozohriatí

- `asistent/nastroje/ab-uvod.mjs` pred kolami raz načíta obe varianty bez zápisu.
- Dôvod je v `ab-zl-1.txt`, kde prvé kolo hneď po spustení servera malo pri z1 snímky 1 283 ms a 4 816 ms (studený disk).
  Po rozohriatí sú v `ab-zl-2.txt` a `ab-vetva-3.txt` všetky snímky v okne úvodu najviac 67 ms.

## 4. Zmeny mimo súborov asistenta (pre zlučovača)

Nové súbory asistenta: `asistent/**`, `assets/asistent.js|css|-otazky.js|-otazky.json|-ukazka.js`,
`nasadenie/asistent-config.php`. Mimo nich je na vetve len toto (`git diff --stat 4b2646bf..HEAD` bez asistenta a HTML:
6 súborov, +82/−4):

| súbor | čo | kde | prečo |
|---|---|---|---|
| `build.py` | `<html lang="sk" data-asistent="ukazka">` v šablóne `page()` | `:585` | náhľad zapne ukážku na všetkých generovaných stránkach |
| `build.py` | v päte `<a href="{rel(path, 'asistent/ochrana-udajov.html')}" data-asistent-odkaz>Ochrana údajov</a>` za „Akciový leták“ | `:645` | odkaz z päty (STYL §9). `balik.sh` ho bez asistenta odstráni podľa `data-asistent-odkaz` |
| `build.py` | `if 'data-asistent="ukazka"' not in s: chyba.append(…)` v `kontrola_uvodu()` | `:1165` | úvod je ručný, kontrola pripomenie atribút |
| `index.html` | atribút na `<html>` a odkaz v päte (ručne, build.py úvod neprepisuje) | `:2`, `:138` | to isté ako šablóna |
| `404.html` | atribút na `<html>` a odkaz od koreňa `/asistent/ochrana-udajov.html` | `:2`, `:66` | 404 sa podáva z ľubovoľnej cesty |
| 72 generovaných podstránok | to isté z `build.py` | – | po zlúčení stačí znova spustiť `build.py` |
| `assets/site.css` | `html[data-asistent] footer .bottom{padding-right:64px}` a pri ≤ 640 px 56 px | `:508–510` | posledný riadok päty nekončí pod ikonou. V prehliadke 0 zakrytých prvkov, pred touto zmenou 25× „Ochrana údajov“ (`prehliadka-01`) |
| `assets/site.js` | IIFE `asistent()` pred blokom „// vyhľadávanie“ | `:908–932` | zapína modul podľa `data-asistent`, `?asistent=off/ukazka`, v ráme bez `allow-same-origin` nič. Musí byť pred `if (!q \|\| !res) return;` (`:936`) |
| `README.md` | časť „Asistent na otázky“ | `:124–133` | odkaz na `asistent/README.md` |
| `nasadenie/balik.sh` | vylúčenie testov, nástrojov, README, config a vendor. Vetva `ASISTENT_API`, kontroly 3 a 4 | `:9–11`, `:22–24`, `:26–38`, `:61–66` | bez adresy servera ide web bez asistenta |

**Postup zlúčenia:** `git merge richtarik-asistent` na `richtarik-profi`.
- Dnes (0cfbc952) prebehne bez konfliktu. `site.js` sa zlúči tak, že `asistent()` je na riadku 265 pred hľadaním
  na riadku 285. Overené na strome z `merge-tree`.
- Po zlúčení spustite `python3 build.py`, lebo podstránky z z2 sa pregenerujú s atribútom.
- `data-bez-asistenta` na `<section class="uv">` netreba. Kto ho chce mať výslovne (krok Z3-04), doplní ho jedným
  `sed`. Ikona je nad úvodom skrytá aj bez neho, overené na zlúčení (`prehliadac-5-zlucenie.txt`, „úvod: …“ 6× OK).
- Ak zf alebo z2 zmenia id nadpisu úvodu `h-uvod`, treba doplniť `data-bez-asistenta` alebo upraviť `UVOD`
  v `assets/asistent.js:29`.
- Ak z2 zmení pätu v `build.py:645` alebo `index.html`, odkaz s `data-asistent-odkaz` musí ostať za „Akciový leták“.

## 5. Merania A/B (telefón 390×844, DPR 3, CPU 4×, striedavo, poradie sa posúva každé kolo, po rozohriatí)

Súbežne bežali iné úlohy, preto som záťaž zapisoval. Merania v tabuľke boli pred ich nástupom.

| beh | záťaž | variant | LCP medián (behy) ms | dlhé snímky v okne úvodu 0,6–5,0 s | ikona do 4 s | chyby |
|---|---|---|---|---|---|---|
| `ab-zl-2.txt` (6 kôl) | 1,01 → 1,29 | zlúčenie s asistentom | **386** (324/596/384/388/492/328) | 0/0/0/0/0/0 | 0 | 0 |
| | | zlúčenie `?asistent=off` | 400 (412/400/476/352/400/372) | 0/0/1/0/0/0 (67 ms) | 0 | 0 |
| | | z1 0cfbc952 (bez asistenta) | 408 (408/464/400/408/372/416) | 0/0/0/0/0/0 | 0 | 0 |
| `ab-vetva-3.txt` (8 kôl) | ≈ 1,1 → 2,76 | vetva so starým úvodom | 540 | 0/0/0/1/0/0/0/0 (67 ms) | 0 | 0 |
| | | vetva `?asistent=off` | 562 | 0 vo všetkých | 0 | 0 |

- Rozdiel mediánov LCP: zlúčenie − off **−14 ms**, zlúčenie − z1 **−22 ms**, vetva − off **−22 ms**. Kritérium je
  ≤ 30 ms. CLS 0 všade.
- Pred LCP sa z asistenta nič nesťahuje (asistent.js 5 508–5 533 ms), takže rozdiely sú šum.
- 4 kolá na vetve (`ab-vetva-2.txt`) dali +64 ms pri rozptyle 352–604 ms. Preto som pridal 8 kôl.
- Mimo okna úvodu pridá modul asistenta v 3 zo 6 behov jednu snímku 50–83 ms okolo 5,54 s, čo je preklad
  `asistent.js` pri CPU 4×. Je to po skončení strihu (z1 ho končí do 4,1 s). Ak treba, dá sa presunúť na neskôr
  (časť 8).
- `ab-zl-1.txt` (prvý beh bez rozohriatia) nepoužívam, dôvod je v časti 3d.

## 6. Regresia

### 6a. Brány a prehliadka

- **Brány** (`nastroje/brany.mjs`, `brany-2.txt`, čakanie pri „obmedziť pohyb“ predĺžené na 6,5 s, aby bol asistent
  načítaný):
  - vetva, zlúčenie aj z1: skrytých prvkov bez JS a pri „obmedziť pohyb“ 0,
  - bežiace animácie pri „obmedziť pohyb“ 0,
  - asistent bez JS 0×, pri obmedzenom pohybe načítaný na 10 z 10 stránok (z1 0, nemá ho),
  - šírky 320–1920: `scrollWidth = innerWidth` 16/16.
- **Prehliadka všetkých stránok** (`dokoncenie/nastroje/prehliadka.mjs`, súhrn `prehliadka-suhrn.txt` cez
  `nastroje/suhrn-prehliadky.py`):

| strom | stránok | chyby statiky | chyby konzoly / pageerror | pretečenie | zakryté prvky | prekrytý text |
|---|---|---|---|---|---|---|
| z1 0cfbc952 | 75 | 0 | 0 / 0 | 0 | 0 | 6 („Od roku“ / „1997“ na úvode, aj v z1) |
| zlúčenie | 76 | 0 | 0 / 0 | 0 | 0 | 6 (to isté) |
| vetva 0b59c5b0 | 76 | 0 | 1 varovanie starého filmu „No available adapters.“ (aj v 4b2646bf) / 0 | 0 | 0 | 6 |

  „Rozbité obrázky“ 36 a 37 sú lenivé logá v páse značiek na úvode. Rovnako je to v z1 aj v 4b2646bf.
- **Iframe** (`nastroje/iframe-asistent.mjs`, `iframe-2-*.txt`, hostiteľ na inom porte):
  - pageerror je 0 vo všetkých troch behoch,
  - v ráme s `allow-same-origin` okno odpovie na hodiny,
  - v ráme bez neho sa asistent nenačíta. Chyby konzoly 16–18 sú CORS písiem a `net::ERR_FAILED`, ako na 4b2646bf
    (`iframe-zaklad.txt`: 18),
  - na úvode zlúčenia nie je ikona ani v ráme, lebo úvod je v okne. To je zámer. Snímku `iframe-2-zlucenie-kontakt.png`
    som otvoril.
- **Okno** (`asistent/nastroje/prehliadac.mjs`): 81/81 na vetve aj zlúčení, s ostrým režimom proti skúšobnému serveru
  (falošné API, kľúč `sk-ant-test`). Otvorené snímky:
  - `prehliadac-4-zlucenie/telefon-5-uvod-ikona.png`: nový úvod bez ikony,
  - `telefon-6-za-uvodom.png`: ikona nad spodnou lištou,
  - `pocitac-4-rozhovor.png`,
  - `prehliadac-5-vetva/telefon-4-rozhovor.png`,
  - `prehliadac-5-zlucenie/naostro-1-prud.png`: podtitul „Odpovede sú automatické…“ a poznámka „Odpovedá AI…“.

### 6b. Časté otázky a stránka `caste-otazky.html`

`caste-otazky.html` na vetve ani v `richtarik-profi` ešte nie je (z2). Preto `caste.mjs` na strome iba oznámi
„nie je čo porovnať“ (`caste-3.txt`). Samotný nástroj som vyskúšal (`caste-samotest.txt`):
- stránka s 12 otázkami z JSON (FAQPage aj `<details>`) dá 12/12 (100 %), exit 0,
- s jednou zmenenou odpoveďou dá FAIL `kontakt-firma`, 11/12, exit 1.

**Po z2 treba spustiť** `node asistent/nastroje/caste.mjs .` a `python3 -I asistent/nastroje/otazky_zdroj.py .`
(doplní `doprava.html` a `caste-otazky.html` do znalostí aj 3 odpovedí). Potom `node asistent/nastroje/otazky.mjs .`
má dať 537 OK a 1 známy FAIL.

## 7. Pre majiteľa

1. **Ochrana údajov: text na schválenie majiteľom** (`asistent/ochrana-udajov.html`). Prevádzkovateľ je
   Ing. Mário Richtárik - Stavebniny. Text otázky ide cez náš server spoločnosti Anthropic PBC (USA) ako
   sprostredkovateľovi. Rozhovory sa neukladajú. Limity sú 12 otázok za 10 minút a 40 za deň na návštevníka, 400 za deň
   spolu. Odporúčame, aby ho pozrel človek, ktorý vám robí GDPR. Kým nie je schválený, asistent ostane len v ukážke.
2. **Asistent naostro:**
   - Treba účet na platform.claude.com na firmu s mesačným limitom výdavkov.
   - Kľúč odovzdajte správcovi osobne alebo cez správcu hesiel, nie e-mailom ani v správe.
   - Hosting potrebuje PHP 8.1+ a HTTPS. Dnešný server je IIS 10 s ASP.NET 2.0 a HTTPS na ňom nefunguje (otvorená otázka).
   - Bez kľúča a servera je ostrý web bez okna.
3. **Náklady** (odhad, nie meranie): asi 0,01–0,015 $ za otázku a asi 0,03 $ po 5 minútach ticha. Pri 20 otázkach denne
   je to 5–10 $ mesačne, pri strope 400 otázok denne 4–12 $ za deň.
4. **Strop:** vyhovuje 400 otázok denne spolu a 40 na návštevníka?
5. Pred zapnutím treba 20–30 skúšobných otázok s vaším kľúčom (zoznam je v `asistent/README.md`, Zapnutie, bod 4).

## 8. Riziká a čo ostáva

- `.htaccess` a `web.config` som neoveril na skutočnom Apache ani IIS, lebo tu nie je ani jeden (`which apache2 httpd`
  → nič). Kontrola 403/404 na `lib/`, `znalosti/`, `config.php`, `data/` a `vendor/` po nasadení je v README.
- Skutočný model som nevolal (bez kľúča, podľa pravidiel). Správanie modelu je dané pokynmi, ktoré idú do API (test).
- Zhoda `caste-otazky.html` s JSON čaká na z2 (časť 6b).
- Ikona na telefóne zakryje kúsok obsahu nad spodnou lištou, ako každé plávajúce tlačidlo. Napríklad koniec riadku
  „so zákazníckou kar…“ v páse faktov úvodu, `prehliadac-4-zlucenie/telefon-6-za-uvodom.png`. Text sa posúva, ovládacie
  prvky zakryté nie sú (prehliadka 0).
- Snímka 50–83 ms pri preklade modulu okolo 5,5 s (časť 5) je mimo strihu. Keby ju zf chcel úplne preč, dá sa modul
  načítať až pri prvom posune alebo geste. Nechal som to tak, aby sa ikona ukázala aj tomu, kto neposúva.
- Mimo asistenta (len poznámka pre z1/zf): po odskrolovaní za úvod presvitá nadpis sekcie cez hornú lištu s 0,97.
  V z1 bez asistenta je to rovnaké (`lista/z1-600.png` otvorená, `lista.txt`: `rgba(250, 248, 244, 0.97)` v oboch).
- **Commity:** 4 nové commity majú na konci riadky `Co-Authored-By` a `Claude-Session`. Vyžaduje ich nastavenie
  prostredia relácie, ktoré má prednosť pred textom zadania. Autor je `Claude <noreply@anthropic.com>`, slovo AI
  v správach 0. Ak ich zlučovač nechce, odstráni ich pri zlúčení (squash alebo `git commit --amend` na svojej vetve).
  V tejto vetve históriu neprepisujem.

## 9. Upratanie

- Servery na 9600–9609 (statický web, falošné API, skúšobný server, hostiteľ rámu) som ukončil. `curl` na každý port
  → `000`.
- Zmazal som dočasné kópie v `scratchpad/z3-tmp/`: kópie na A/B, balíky, `srv2`, `run2`, skúšobné kópie a staré
  `zaklad`, `skuska-z1` a `zlucenie`. Ostali len `server/` (vendor pre `spusti.sh`), `host/host.html`, `z3.patch`,
  `md5.txt` a `zl-strom.txt`.
- Nástroje tohto zápisu sú v `nastroje/`: `ab3.mjs` (A/B/C s rozohriatím), `brany.mjs`, `iframe-asistent.mjs`,
  `lista.mjs` a `suhrn-prehliadky.py`.
