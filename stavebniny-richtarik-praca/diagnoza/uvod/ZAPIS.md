# Diagnóza úvodu a fotiek: Stavebniny Richtárik (4. 11. 2026)

Strom: `hs-richtarik-obnova`, vetva `richtarik-dokoncenie`, HEAD `4b2646bf`. V strome som nič nemenil
(`git status --short | wc -l` = 0). Server na porte 9600 som ukončil. Moje súbory sú v `richtarik/profi/diagnoza/uvod/`:
`fotky-harok.jpg`, `prac/` (dekódované fotky, `hist/` = fotky vytiahnuté z gitu, `metriky.txt`, `meraj.mjs`,
`meranie-dnes.json`, snímky `dnes-*.png|jpg`, porovnania). Cesty nižšie sú relatívne k `stavebniny-richtarik/`.

## Zhrnutie
1. Auto z vygenerovaného klipu je na webe v **108 súboroch `img/film/` (24 766 197 B)**, v `img/uvod/og.jpg`
   (og:image na **všetkých 75 stránkach** a `image` v JSON-LD), v dvoch vložených base64 náhľadoch v `index.html:49`,
   v alt texte `index.html:49` a v texte README a FOTKY.md. Ikony, logo, manifest ani favicon auto nemajú.
2. **Vážne zistenie mimo zadania:** fotky `pas-dvor-*`, `dvor-predajna-*` a `zasoba-porfix-*` (dnes na úvode, v páse
   Sklad a doprava, v hlavičkách stránok Katalóg, Akcie, Galéria, Kontakt, O nás a Porfix) majú **palety PORFIX doplnené
   generatívnou úpravou**. Nie sú to čisté skutočné fotky. Pôvodné verzie v tých istých veľkostiach sú v gite
   (`bb6bbaeb`) a bajtovo sa zhodujú so vstupom úpravy (md5 nižšie).
3. V gite sú aj **skutočné fotky dvora vo väčšom rozlíšení, než má dnešný web**. Odstránil ich commit `44aa237b`:
   `u4` (1920×1080 a na výšku 1448×2574), `prijazd-podklad` (1512×851 a 1086×1931) a `u3` (1920×1080 a 1086×1931).
   Ako celoplošný úvod sú najlepšie: na telefóne idú bez zväčšenia alebo s malým zväčšením, ukazujú plné uličky paliet
   a nie je na nich auto (na `u3` vzadu stojí skutočné auto firmy).
4. Dnešný film stiahne na telefóne **3,95 MB hneď po načítaní, ešte bez skrolovania** (17 súborov, sada t960). Na
   počítači je to **7,75 MB** (sada p1920). Kód filmu má 51,8 kB v site.js (riadky 113–817, 76 % súboru), 12,9 kB
   v site.css a 7,5 kB v index.html.

## 1. Kde je auto z filmu (každý výskyt, overené obsahom aj históriou)

| Miesto | Čo to je | Dôkaz (obsah / história) | Verdikt |
|---|---|---|---|
| `img/film/*` (108 súborov, 24,77 MB): sady `p1920`, `p1280`, `t960`, `t720`, `t540` (vždy 18 blokov a kľúčová snímka `-k`), `prvy-*` (9), `posl-*` (4) | snímky vygenerovaného klipu | otvorené `prvy-p1920.avif` (biele IVECO na ulici pred dvorom) a `posl-p1920.avif` (auto zozadu v dvore); `zdroj/film.sh:6,42` – zdroj je `klip-4k.mp4` + `start-ulica.png` (2688×1520, rozmer výstupu generátora); `ffprobe klip-4k.mp4` → 3830×2160, 24/1, 10,04 s | PREČ celé |
| `img/uvod/og.jpg` (250 788 B) | snímka 0 filmu orezaná na 1200×630 | otvorený: tá istá scéna ako `prvy-p1920` (auto na ulici, dvor z výšky); `zdroj/film.sh:213` `convert s/p1920/000.png … img/uvod/og.jpg`; vznikol v `44aa237b` | PREČ, nahradiť |
| og:image na **75 z 75** HTML stránok | odkaz na `og.jpg` | `grep -l img/uvod/og.jpg` → 75; `find -name '*.html'` (bez nasadenie/, zdroj/) → 75 | prepísať všade (build.py + index.html) |
| `index.html:27` JSON-LD `"image": ".../img/uvod/og.jpg"` | štruktúrované dáta | grep | prepísať |
| `build.py:24` `OG_IMG = ('img/uvod/og.jpg', 1200, 630)   # skutočný záber auta firmy z úvodného filmu` | **nepravdivý komentár**: je to záber vygenerovaného klipu | viď riadok og.jpg | opraviť komentár aj súbor |
| `index.html:19–20` preload `img/film/prvy-*` | prednačítanie prvého obrazu filmu | grep | PREČ |
| `index.html:49` `<picture class="prvy">` + `<picture class="posl">` + `alt="Nákladné auto IVECO Stavebniny Richtárik s mechanickou rukou odbočuje z ulice do dvora plného materiálu"` | prvý a posledný obraz filmu | grep, snímka `prac/dnes-telefon.jpg` a `prac/dnes-pocitac.jpg` (otvorené: auto na úvode, uprostred filmu auto zozadu) | PREČ |
| `index.html:49` `--nahlad-t` a `--nahlad-p` (base64 WebP 16×35 a 32×18) a `--farba-t/-p` | rozmazané náhľady prvej snímky filmu (podklad pod obrazom) | grep (`data-film-bg style=…`) | PREČ (nový náhľad zo skutočnej fotky) |
| `index.html:25–26` skript v `<head>` (trieda `film-ide`) | pripnutie filmu pred vykreslením | grep | PREČ alebo prepísať |
| `index.html:59` titulky `01 Vlastné autá s mechanickou rukou`, `02 Doprava po celom Slovensku`, `03 Dvor plný materiálu` | titulky nad filmom | grep | text pravdivý, viazanosť na film preč |
| `index.html:62` `<script id="film-data">` (4 205 B) | časy a ohniská snímok | grep | PREČ |
| `index.html:55` „…vlastnými autami, aj Ivecom s mechanickou rukou.“ | text | fakt zo zdroja (pozri časť 3) | text môže ostať |
| `assets/site.js:113–817` (51 801 B) | prehrávač (Worker, OffscreenCanvas, bloky, posl, titulky, `richtarikFilm`) | `sed -n 113,817p … \| wc -c`; komentár `site.js:113–134` | PREČ celé |
| `assets/site.js:47` `topHranica` „úvodný film ju posunie na svoj koniec“ | lišta priehľadná nad filmom | grep | upraviť |
| `assets/site.css:770–883` (11 685 B) časť „Úvodný film“ (+ `:131` odkaz, `:62`, `:69` biele logo nad filmom) | štýly filmu, `.zatm`, `.vin`, `.titulky`, `.posl`, `film-odchod` | grep | PREČ / prepísať |
| `assets/site.css:170–180` (1 195 B) `.zasoba~.skryte`, `.bezanim` | obsah pod úvodom sa počas filmu nevykresľuje | komentár `site.css:170–173` | PREČ (bez filmu netreba) |
| `assets/site.css:731–735` `.hledaj` „vysunie nad poslednú snímku“ | prechod z filmu | komentár | prispôsobiť |
| `build.py:683–684, 701, 1161, 1172` | poistka „úvod s filmom“, komentár o sťahovaní dlaždíc filmom | grep | komentáre upraviť (poistka môže ostať) |
| `build.py:1053` starý úvod `data-film="img/film/uvod"` | vetva `--stary-uvod`, odkaz na neexistujúce `uvod*.mp4` | grep, `img/FOTKY.md` posledný odsek | upratať |
| `README.md:31, 38, 42–73, 86–87, 101–103` časť „Úvodný film“ (IVECO, dron, `film.sh`) | dokumentácia | grep | prepísať |
| `img/FOTKY.md` odsek „Úvodný film (`img/film/`) je záber z dronu príjazdu IVECO…“ | dokumentácia | cat | prepísať |
| `OBNOVA-2026-10-27.md:13–128` | denník filmu | grep | história, môže ostať (nejde do balíka) |
| `zdroj/film.sh` (15 913 B), `zdroj/film.mjs` (10 850 B), `zdroj/napis.mjs` (10 166 B) | výroba filmu | wc | PREČ |
| `nasadenie/balik.sh:21, 31` výnimka `img/film` | balík berie celý `img/film/` | sed | výnimku zrušiť |
| nástroje `richtarik/dokoncenie/nastroje/funkcie.mjs:145–242`, `technika_fling.mjs` | testy filmu | grep | upraviť testy |

**Bez auta (overené otvorením):** `img/ikona-192.png`, `ikona-512.png`, `apple-touch-icon.png` (logo na svetlom
podklade), `favicon.svg` (tehlová stena), `logo.png`, `logo-white.png`, `manifest.webmanifest` (len ikony 192/512).
`sitemap.xml`, `assets/index.json` a `robots.txt` neodkazujú na film ani na og.jpg (`grep -c` = 0).

**Skutočné autá firmy (nie z klipu):** `img/p/883`, `884` (1024×768), `885` (576×768) z pôvodného webu (otvorené:
modré a vínové nákladné autá s hydraulickou rukou na dvore; značku z fotky neurčujem), `img/g/91` a v gite `u1`, `u2`, `prijazd-auto`
(skutočné IVECO NR 227 LH, otvorené v `prac/hist-p.jpg`). Tieto autá **nie sú** z klipu. `p/885` je dnes
v `index.html:98` (alt „Nákladné auto s mechanickou rukou pri nakládke“) a `p/884` v hlavičke Služieb (`build.py:519`).
Majiteľ povedal „daj to auto preč“. Odporúčam ich do úvodu nedávať a v sekcii Doprava ich nechať len so súhlasom
majiteľa (otázka pre orchestrátora).

## 2. Fotky dvora a zásob

### 2a. Upravené fotky (generatívne doplnené palety)
- `git show 6d285c37` „doplnený tovar na fotkách dvora“: v rade PORFIX „bola namiesto palety zvalená plachta – teraz
  plná zabalená paleta“, na `zasoba-porfix` „na prázdnu drevenú paletu… doložená zabalená paleta“. Commit `b46c7d43`
  „plné palety“ doplnil dve palety a `6bffd83e` „plné palety aj na telefóne“ upravil aj `pas-dvor-t-*`.
- Vstupy a výstupy úpravy sú v `richtarik/fotky-ai/orig/` a `richtarik/fotky-ai/edit/`. Výstupy majú rozmery
  2688×1520 a 1792×2240, teda rovnakú triedu ako vygenerovaný `start-ulica.png` 2688×1520.
- md5 (prvých 12 znakov): `pas-dvor-1920` bb6bbaeb = fotky-ai/orig = `e7eef35eab97`, dnes `b29c57ee87e9`;
  `dvor-predajna-1200` `fb289b8902c0` / dnes `c8b7c8a4e759`; `zasoba-porfix-900` `29b18b563571` / dnes
  `237bff2a3d19`; `pas-dvor-t-1290` `ac74ad532602` / dnes `47e8cbccb387`.
- Snímka `prac/pas-dvor-porovnanie.jpg` (otvorená) ukazuje pôvodnú fotku, dnešnú a ich rozdiel. Rozdiel je len
  v obdĺžniku radu PORFIX, kde pôvodne boli načaté palety a modré plachty a dnes je osem rovnakých plných paliet.
  Snímka `prac/zasoby.jpg` (otvorená): na `zasoba-porfix` dnes stoja dve plné palety tam, kde je na pôvodnej fotke
  prázdna drevená paleta a napoly odobratá paleta.
- Kde sú: `index.html` (3×: pás Plná zásoba `:69`, pás Sklad a doprava `:84`, kontakt), `akcie/index.html`,
  `akcie/porfix.html`, `katalog/index.html`, `katalog/murovaci-material/porfix.html`, `galeria/index.html` (2×),
  `kontakt.html` (2×), `o-nas.html` (`build.py:507, 510–523, 877–878, 1015`).
- **Rozpor s pravidlom** „plné zásoby = skutočné fotky plného dvora“: doplnené palety na dvore v skutočnosti neboli.
  Úprava však vznikla na skoršiu žiadosť majiteľa („plné palety“). Odporúčanie: nový úvod postaviť len na
  neupravených fotkách. O vrátení `pas-dvor`, `dvor-predajna` a `zasoba-porfix` na verzie z `bb6bbaeb` (všetky
  veľkosti tam sú) **rozhodne orchestrátor alebo majiteľ**.
- **Neistota:** `bb6bbaeb` je obnova náhľadu `f4f7d79` s názvom „plnší sklad na fotkách dvora“ a podľa
  `OBNOVA-2026-10-27.md:5–6` obsahoval „doplnený tovar“. Ktoré súbory to boli, sa nedá zistiť. Isté sú len originály
  u majiteľa (`OBNOVA:10`: „59 originálnych fotiek majiteľa (majiteľ ich má)“). Odporúčam ich vyžiadať. Okrem
  vierohodnosti by dali aj ostrejší úvod v plnom rozlíšení.

### 2b. Inventár skutočných fotiek pre úvod
Hárok: `fotky-harok.jpg` (otvorený). Zelená = vhodné, oranžová = s výhradou, červená = nie.
Metriky: `prac/metriky.txt`. Ostrosť = smerodajná odchýlka Laplaceovho filtra po zmenšení na 1000 px × 1000,
jas = priemer šedej 0–255, tmavé % = podiel pixelov pod 60. Zväčšenie = koľkokrát treba fotku zväčšiť pri vyplnení
plochy (cover): počítač 1920×1080, telefón 1170×2532 (390×844 pri hustote 3). Hodnota pod 1 znamená bez zväčšenia.

| Kód | Súbor (najväčšia veľkosť) | Motív | Rozmer | Ostrosť | Jas | Tmavé % | Zväčš. PC | Zväčš. tel. | Pre úvod |
|---|---|---|---|---|---|---|---|---|---|
| A1 | git `44aa237b^:img/uvod/u4-p-1920` + `u4-t-1448` | uličky s vysokými stohmi tvárnic a paliet, modrá obloha | 1920×1080 / 1448×2574 | 49,5 / 63,8 | 114 / 113 | 19 / 18 | 1,0 | **0,98** | **najlepšia**: plný dvor, svetlá, na výšku bez zväčšenia |
| A2 | git `prijazd-podklad-p-1512` + `-t-1086` | dlhá ulička dvora, palety po oboch stranách, PORFIX vzadu | 1512×851 / 1086×1931 | 75,2 / 75,0 | 117 / 110 | 25 / 17 | 1,27 | 1,31 | **veľmi dobrá**: hĺbka pre pohyb kamery „do dvora“ |
| A3 | git `u3-p-1920` + `u3-t-1086` | ulička, PORFIX, tvárnice; **vzadu stojí skutočné auto s rukou** | 1920×1080 / 1086×1931 | 52,2 / 75,6 | 96 / 115 | 42 / 28 | 1,0 | 1,31 | s výhradou (auto, tmavšia na šírku) |
| A4 | git `bb6bbaeb:pas-dvor-1920` + `-t-1290` (pôvodné) | rad TermoBRIK a PORFIX pred predajňou, sklad | 1920×1080 / 1290×1512 | 51,0 / 54,6 | 118 / 113 | 15 / 14 | 1,0 | 1,67 | dobrá na šírku; na telefóne 4 : 4,7, treba zväčšiť |
| A5 | git `bb6bbaeb:dvor-predajna-1200` (pôvodná) | rad PORFIX, sklad, palety | 1200×800 | 60,6 | 130 | 10 | 1,6 | 3,17 | len menší záber, nie celoplošne |
| B1 | `img/uvod/zasoba-tehly-856` | stohy TermoBRIK, obloha | 856×1070 | 39,0 | 108 | 21 | 2,24 | 2,37 | detail/výrez (najmäkšia) |
| B2 | `zasoba-stadreko-900` | palety Stadreko, obrubníky | 900×1125 | 65,4 | 86 | 34 | 2,13 | 2,25 | detail; tmavšia |
| B3 | `zasoba-rezivo-900` | hranoly reziva | 900×1125 | 87,2 | 106 | 28 | 2,13 | 2,25 | detail (najostrejšia) |
| B4 | git `bb6bbaeb:zasoba-porfix-900` (pôvodná) | palety PORFIX pred predajňou | 900×1125 | 70,5 | 103 | 20 | 2,13 | 2,25 | detail |
| C1–C2 | git `u1-p-1920`, `u2-p-1920` (+ `t`) | skutočné IVECO firmy na dvore | 1920×1080 | 63,6 / 46,1 | 106 / 95 | 27 / 41 | 1,0 | 2,34 | **nie do úvodu** („auto preč“) |
| C3–C4 | `img/p/883`, `884`, `885` | staré autá s rukou na dvore (pôvodný web) | 1024×768, 576×768 | 29,7 / 30,3 / 12,7 | 150 / 164 / 121 | 21 / 10 / 15 | 1,9–3,3 | 3,3 | nie do úvodu, prípadne sekcia Doprava |
| D | `img/g/73–110` | sklad, hala, dvor (2010–2012), predajňa | **533×400** | 8–14 | 83–135 | 14–41 | 3,6 | 6,3 | **nie celoplošne** (malé, mäkké), len galéria/mozaika |
| – | `img/g/592–909` | výstavy Agrokomplex, Gardenia, Domexpo | 1024×768 | – | – | – | 1,9 | – | nie (nie je to dvor) |
| – | `img/p` ostatné | letáky, vzorky, produkty, certifikáty | do 1200×1697 | – | – | – | – | – | nie (nie sú to fotky predajne) |

Ostrosť a svetlo: všetky A a B fotky sú denné (slnko, modrá obloha, ostré tiene), bez šumu a s rovnakým tónom, takže
sa dajú strihať za sebou. Fotky `img/g` sú z iného obdobia (sivé nebo, menej paliet) a štýlovo sa k nim nehodia.
Pexels (`img/hd`) podľa zadania do úvodu nejde.

## 3. Silný hook: čo chce zákazník vedieť do 3 sekúnd
Poradie otázok: (1) Majú to? Je to na sklade? (2) Koľko to stojí, sú akcie alebo zľava? (3) Dovezú mi to na stavbu?
(4) Kde sú a kedy je otvorené? (5) Ako sa im dovolám?

Overené fakty (zdroj):
- „Široká ponuka priamo na sklade.“ (pôvodný web, stránka náradia); „stavebné rezivo priamo na sklade“ (Drepex);
  „Máme priamo na sklade, odber možný ihneď.“ (pôvodné akcie komínov Stadreko a Eko). Ide o konkrétne položky,
  nie o celý sortiment.
- Služby (pôvodný web, Služby): predaj stavebného materiálu v celom sortimente, **bezplatný výpočet spotreby**,
  **bezplatná poradenská činnosť**, množstevné zľavy, **doprava Avia 3,5 t a Iveco s mech. rukou 8 t**, platba
  terminálom VÚB.
- O nás (pôvodný web): rodinná firma založená v roku 1997, „Poradenstvo a vypracovanie cenových ponúk sú u nás
  zadarmo.“
- Adresa Novozámocká 62/68, Nitra-Horné Krškany; telefóny 0905 622 223 a 037 651 17 77; Po–Pi 7–16, So 7–12.
- **Pozor:** „doprava po celom Slovensku“ ako všeobecné tvrdenie je len na dnešnom webe (`index.html:55, 59, 100`).
  Pôvodný web ho má len pri Blachotrapeze („Doprava nad 50 m2 – 17 Eur s DPH po celom Slovensku“) a pri garážach.
  Podľa pravidiel to smie ostať, ale ako hook je to najslabšie podložený fakt.
- Zľavy 5 % / 3,3 % sú otvorená otázka majiteľa. Do hooku ich nedávať, ponechať dnešné znenie.

Návrhy hookov (len z faktov, nadpis + podnadpis):
1. **„Materiál priamo na sklade. Odvezte si ho ešte dnes.“** – pod ním: „Novozámocká 62/68, Nitra. Po–Pi 7–16, So 7–12.“
   (sklad + hodiny; „dnes“ len v otváracích hodinách)
2. **„Všetko na stavbu. Dovezieme.“** (dnešný nadpis) – pod ním: „Autami s mechanickou rukou: Avia 3,5 t a Iveco 8 t.“
3. **„Od základov po strechu. Na jednom dvore v Nitre.“** – pod ním: „Rodinné stavebniny od roku 1997.“
4. **„Koľko toho treba? Spočítame vám to zadarmo.“** – bezplatný výpočet spotreby, CTA Zavolať.
5. **„Cenová ponuka a poradenstvo zadarmo.“** – pod ním telefón 0905 622 223.
6. **„Zložíme vám to priamo na stavbe.“** – mechanická ruka (fakt), bez fotky vygenerovaného auta.
7. **„Tehly, pórobetón, rezivo, cement. Na dvore, nie len v katalógu.“** – len značky a kategórie, ktoré web má
   (TermoBRIK, Porfix, Stadreko, rezivo na fotkách; Ytong a cement v katalógu/akciách).
8. **„Rodinná firma od roku 1997. Horné Krškany, Novozámocká 62/68.“** – dôvera a miesto (SEO: lokalita v H1/H2).
9. **„Akcie na stavebný materiál: ceny z aktuálneho cenníka.“** – odkaz na akcie (cenník 28. 1. 2026), bez čísel
   zľavy.

Odporúčaná kombinácia na prvú obrazovku: H1 = hook 1 alebo 2, jeden riadok s tromi faktami („Priamo na sklade ·
Doprava autami s mechanickou rukou · Výpočet spotreby zadarmo“), tlačidlá Zavolať 0905 622 223 / Katalóg / Akcie
a pod nimi adresa a hodiny. SEO: H1 má obsahovať „stavebniny“ a „Nitra“. Napríklad viditeľný eyebrow „Stavebniny
Nitra – Horné Krškany“ a H1 s hookom. Text úvodu musí byť skutočné HTML, viditeľné aj bez JS.

## 3b. Typy filmového úvodu zo statických fotiek (riziká na telefóne pri CPU 4×)

| Typ | Ako | Fotky | Plynulosť na telefóne | Riziká |
|---|---|---|---|---|
| **Strih** (časovaný, 3–4 zábery po 1,2–1,8 s pri načítaní) | prelínanie `opacity` medzi dvoma vrstvami `<img>` | A1 → A2 → A4 → B-mozaika | výborná (len kompozítor) | obrázok nesmie naskočiť nedekódovaný, preto `img.decode()` pred prelínaním; nikdy neprelínať cez tmavé pozadie (podklad `#faf8f4`) |
| **Kamera po fotke** (Ken Burns: pomalý nájazd a posun) | `transform: scale(1→1,06) translate` 5–7 s | A1-t (bez zväčšenia), A2 | výborná | pri zväčšení nad 1,1 a zdroji menšom, ako je plocha, rozmazanie; telefón: A1-t 1448 px, A2-t 1086 px (1,31×). Pre A2 držať mierku do 1,05 |
| **Skrolovaný strih** (sticky ~150–200 lvh, 3–4 zábery viazané na skrol) | CSS scroll-driven animations, náhradne IntersectionObserver a rAF | A1, A2, A4, B | dobrá, ak sa animuje len `opacity`/`transform` | Safari bez scroll-timeline potrebuje náhradu v JS; nesmie zasekávať skrolovanie; pri obmedzenom pohybe statické poradie |
| **Maska textu** (H1 ako okno do fotky, potom sa otvorí na celú plochu) | SVG/CSS `mask` alebo `background-clip:text`; otvára sa `transform: scale` obalu | A1 | stredná | animovaný `mask-size` alebo `clip-path` sa prekresľuje v každej snímke (CPU), preto animovať len `transform`; čitateľnosť bez JS (H1 musí byť normálny text) |
| **Odpočet sortimentu** (rotujúce slovo: „Tehly. Porfix. Rezivo. Cement. Na sklade.“) | výmena textu v pevnej šírke | nad A1/A2 | výborná | CLS: dať pevnú šírku a výšku; `aria-live` vypnúť (opakovanie by rušilo čítačku) |
| **„Inventúra“** (mozaika 4 zásob B1–B4 sa zloží do celého dvora A1) | FLIP s `transform` | B1–B4 (480/720 px) + A1 | dobrá | 5 dekódovaní naraz; na telefóne brať 480 px verzie; výrezy B sú 900 px, preto ich nedávať celoplošne |
| **Svetlo cez fotku** (jemný lúč po rade paliet) | pseudo-element s bielym gradientom a `transform: translateX`, len `opacity` | A1, A4 | dobrá bez `mix-blend-mode` | `mix-blend-mode` a `filter` na celej ploche sú bez grafického čipu drahé; netmaviť |
| **Paralaxa vrstiev (2,5D)** | vystrihnuté popredie (palety) nad pozadím | A2 (ulička) | stredná | výrez je úprava fotky (svätožiara na okrajoch); medzera za vrstvou sa nesmie dokresľovať (bolo by to vymyslené); najväčšia práca a riziko |

Odporúčaný smer (najsilnejší hook pri najmenšom riziku):
**„Dvor sa otvára“** – 0–2,5 s po načítaní: A1 (telefón `u4-t-1448`, počítač `u4-p-1920`) s pomalým nájazdom kamery,
H1 nabehne po slovách a pod ním odpočet sortimentu. Pri skrole: sticky približne 180 lvh, tri strihy prelínaním
(A2 ulička → A4 pôvodný rad TermoBRIK/PORFIX → mozaika B1–B4) s krátkymi titulkami z faktov („Priamo na sklade“,
„Zložíme mechanickou rukou“, „Výpočet spotreby zadarmo“). Úvod končí na svetlom páse vyhľadávania.
Bez JS a pri obmedzenom pohybe je vidieť len A1, H1, fakty a tlačidlá. Nič sa nepripína a nemá byť ani čierna plocha.
Rozpočet: prvý obraz pre telefón zmenšiť na šírku 1170 px a do ~150–200 kB AVIF (`u4-t-1448.avif` v gite má 606 kB).
Celý úvod by mal mať na telefóne ≤ 0,8 MB, čo je asi 5× menej ako dnešné 3,95 MB.
og:image: výrez 1200×630 z A1 (`u4-p-1920`) alebo z pôvodnej A4.

## 4. Dnešný film: koľko stojí a čo pôjde preč
- Súbory: `img/film/` **108 súborov, 24 766 197 B** (`du -cb`; `git ls-files img/film | wc -l` = 108):
  p1920 19 súborov 8 379 600 B; p1280 19 / 4 447 578 B; t960 19 / 4 247 315 B; t720 19 / 3 562 878 B;
  t540 19 / 2 297 571 B; prvy-* 9 / 1 254 888 B; posl-* 4 / 576 367 B. K tomu `img/uvod/og.jpg` 250 788 B.
- Prenos zmeraný v Chromiu (Playwright, `prac/meraj.mjs`, server 9600, bez obmedzenia siete, jeden beh, nie A/B
  výkonu; súbežne bežali iné úlohy): **telefón 390×844 DPR 3: po načítaní a 2,5 s bez skrolovania 17 súborov filmu
  = 3 949 263 B** z 5 191 947 B celkom (prvy-t960 133 776 B, t960-k 230 201 B, t960-00 až -14). Po prejdení filmu
  19 súborov, 4 094 784 B. **Počítač 1440×900: 7 745 146 B** z 8 410 307 B, po prejdení 7 939 024 B. LCP obrázok
  `prvy-t960.avif` / `prvy-p1920.avif` (`prac/meranie-dnes.json`).
- Kód, ktorý pôjde preč: `assets/site.js:113–817` = 51 801 B (76 % zo 67 785 B; gzip 18 020 z 23 400 B),
  `site.js:47` úprava; `site.css:770–883` = 11 685 B + `:170–180` = 1 195 B + úpravy `:62, 69, 131, 731–735`;
  `index.html:19–20` (449 B), `:25–26` (870 B), `:49` (1 958 B s base64 náhľadmi), `:59` titulky,
  `:62` film-data (4 205 B); `zdroj/film.sh`, `film.mjs`, `napis.mjs` (36 929 B); výnimka v `nasadenie/balik.sh:21, 31`;
  časti README a FOTKY.md; testy filmu v `richtarik/dokoncenie/nastroje/`.
- Čo nechať: text o mechanickej ruke (`index.html:55, 100`, pravdivý), svetlý pás `.hledaj`, pás Plná zásoba
  (s vyriešenými fotkami podľa 2a), `p/885` v sekcii Sklad a doprava (skutočné auto, len ak majiteľ súhlasí).

## Otvorené rozhodnutia pre orchestrátora
1. Vrátiť `pas-dvor`, `dvor-predajna` a `zasoba-porfix` (všetky veľkosti) na neupravené verzie z `bb6bbaeb`, alebo
   ich len nedávať do úvodu? Odporúčam vrátiť, pretože pravidlo „žiadne vymyslené zásoby“ to vyžaduje. Úprava však
   bola skoršou žiadosťou majiteľa.
2. Skutočné IVECO firmy (`u1`, `u2`) a staré autá (`p/883–885`): v úvode nie. V sekcii Doprava len so súhlasom
   majiteľa.
3. Vyžiadať od majiteľa originály fotiek (vyššie rozlíšenie, istota bez retuše).
4. Otvorené otázky majiteľa (staré akcie, LIAZ vs. Iveco, zľava 5 % / 3,3 %, Nero Ebono/Ebano, hosting a HTTPS)
   ostávajú bez zmeny.
