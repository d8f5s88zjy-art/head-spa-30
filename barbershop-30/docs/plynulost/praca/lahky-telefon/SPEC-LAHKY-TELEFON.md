# Špecifikácia „Ľahký telefón“ – Barbershop 30 (Nitra)

Dátum: 21. 10. 2026. Podklad: spätná väzba majiteľa (iPhone, Safari v aplikácii Claude, verzia D1), snímky
`majitel-iphone-film.png`, `majitel-iphone-paticka.png`, `majitel-iphone-cierny-start.png` a rozbory
`rozbor-film.md`, `rozbor-stranka.md`, `rozbor-vaha.md` (všetko v tomto priečinku).

Skratky stromov (len na čítanie):

- **D1** = `$SP/hs-pred-d1/barbershop-30` (commit 7ea247c)
- **BALÍK** = `$SP/hs-chatgpt/barbershop-30` (balík inej AI nad c129f58, ešte sa preveruje)
- `$SP` = `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad`

Odkaz `súbor:riadok` bez prívlastku platí pre **oba** stromy (riadky sme porovnali). Inak je pri ňom uvedené D1 alebo BALÍK.
Nič z toho, čo je tu, som nemeral v prehliadači (pravidlo zadania). Čísla, ktoré sú odhad, sú tak označené.

---

## 0. Cieľ a hranice

**Cieľ (slovami majiteľa):** web na telefóne „ľahký ako pierko a plynulý ako potôčik“. Žiadna fotka sa neukáže
neúplná (tmavá, rozmazaná, napoly vykreslená), žiadne čierne okná, žiadne zasekávanie pri skrole.

**Čo sa nesmie zmeniť:** fotky a ich výrezy (`-m` na výšku s bodmi záujmu `--fmx/--fmy`), texty, typografia,
farby (ink #0E0D0C, paper #F1E9DD, lamp #E0601C), poradie sekcií, titulné karty, tlačidlá. Počítač (šírka > 720 px
bez dotykového prsta) ostáva bez zmeny, okrem dávky L1 (pätička), ktorá platí všade.

**Čo smie odísť (len na telefóne) a čím sa to nahradí:**

| Ťažký efekt (dnes na telefóne) | Prečo odchádza | Náhrada, ktorá drží dojem |
|---|---|---|
| WebGL film (three.js, 687 458 B, gzip asi 170 kB) s hĺbkou a paralaxou | rozbaľovanie a nahrávanie textúr na hlavnom vlákne Safari (D1 film.js:433–439, 460–497), 140–155 MB grafiky (odhad, rozbor-film), čierne plátno pri čakaní (D1 film.js:1106, 1112) | tie isté fotky `-m` ako HTML obrázky cez celé okno s pomalým priblížením 1 → 1,06 okolo bodu záujmu (už existuje: style.css:457–458, 464) |
| Strihy so shaderom medzi zábermi | rovnaký dôvod, mipmapy cieľov strihu 2× za snímku (D1 film.js:793) | prelínanie cez `opacity` 400 ms; prichádzajúca fotka `scale(1.03 → 1)`; vždy až po dekódovaní |
| Prológ (chôdza k dverám, trieda `pro`) | štart filmu hneď po načítaní, hlásená čierna obrazovka na začiatku (index.html:15 D1 / :14 BALÍK) | prvý obraz je rohožka z HTML s nadpisom „Tvoj strih. Tvoje miesto.“ a tlačidlami; fasáda ostáva ako záber Vstup |
| Sekvencie viazané na skrol (Poď ďalej 51 snímok, Remeslo 44; 95 AVIF, spolu 3 643 267 B) | až 2 celé snímky 720×1280 nahraté za snímku displeja (D1 film.js:687–694), asi 80 snímok/s pri švihu (odhad) | tá istá fotka ako na počítači (`sala-m`, `stol-m`), s pomalým priblížením |
| Video v plátne (`tim-slucka-864.mp4`, 3 402 635 B, celé ako blob, D1 film.js:576–584) | váha a nahrávanie 1,33 MP na snímku do textúry | fotka `sala-rano-m`; voliteľne (L6) bežné `<video>` 576 px s plagátom, hrá len vo viditeľnej karte |
| Stále „dýchanie“ kamery 3 min po dotyku (D1 film.js:984) | telefón počíta aj v pokoji, zahrieva sa | v pokoji sa nekreslí nič; pohyb je len pri skrole |
| Rozostrenie slov nadpisov `filter: blur()` (D1 style.css:1284, 1277, 1065 / BALÍK :1282) | vrstva s rozmazaním pre každé slovo počas ťahu prstom; zakazuje to aj docs/ART_DIRECTION.md:72 a :143 | nástup len cez `opacity` a posun do 24 px (presne podľa ART_DIRECTION.md:72–73) |

---

## 1. Rozhodnutie „ľahký telefón“ (spoločné pre všetky dávky)

Hlavička dnes zapína film každému, kto má WebGL2, nemá zníženie pohybu, šetrenie dát, nízke okno a má
`deviceMemory || 8 ≥ 4` a `hardwareConcurrency || 8 ≥ 4` (index.html:12 D1, rovnaká podmienka v BALÍKu index.html:12).
Šírka telefónu ani dotyk sa nekontroluje, takže iPhone dostane `world`. Potvrdzuje to snímka Čakárne
(rámovanie 1,24×, porovnanie/cakaren-ramovanie.png) aj fotka ulice pod pätičkou (pozri L1).

Zavedie sa trieda **`lite`** na `<html>` rozhodnutá v tej istej hlavičke **pred** podmienkou `world`, s rovnakým
prahom telefónu ako film.js:136 (D1) / :138 (BALÍK):

```js
var lite = matchMedia('(max-width: 720px)').matches ||
           (matchMedia('(pointer: coarse)').matches && Math.min(innerWidth, innerHeight) <= 720);
if (lite && !/[?&]film=on\b/.test(location.search)) { h.classList.add('lite', 'world-off'); /* žiadne world, žiadne pro */ }
```

Dôsledky: `world` ani `pro` sa nepridajú (index.html:15 D1 / :14 BALÍK sa nevykoná), film.js si overí triedu
`world` a nespustí sa (komentár index.html:899–901 D1 / :881–883 BALÍK). `?film=on` ostáva na ladenie.
Trieda `world-off` zapína existujúcu pokojnú verziu so zálohami v rámovaní `cover` (style.css:480 sa pri
`world-off` neuplatní), takže nič nové nekreslíme, len používame hotovú cestu.

---

## 2. Dávky (zoradené podľa toho, čo majiteľ uvidí)

### L1 – Lišta s plným pozadím a ink pod pätičkou (dve chyby zo snímok)

**Čo vidno na snímke `majitel-iphone-paticka.png`:**

1. Pevná lišta „Barbershop 30 NITRA“ je polopriehľadná a cez ňu presvitá logo pätičky (dve logá nad sebou).
2. Pod čiernou pätičkou je pás fotky ulice (dlažba a kanál).

**Príčina 1 (oba stromy, rovnaké riadky):** na ≤ 900 px má lišta po 80 px skrolu `backdrop-filter: none;
background: rgba(14,13,12,0.9)` (style.css:318) a zároveň zmizne prechod pod ňou
(`.site-header.is-scrolled::before { opacity: 0 }`, style.css:301). Trieda `is-scrolled` sa nastavuje v
app.js:240 (D1) / app.js:342 (BALÍK). Výsledkom je 10 % presvitania a ostrá hrana, pod ktorú sa text zarezáva.

**Príčina 2 (oba stromy):** telo má na ≤ 900 px `padding-bottom: calc(var(--cta-h) + 24px)` = 80 px
(style.css:345, `--cta-h: 56px` style.css:40). Pätička je nepriehľadná (`background: var(--ink)`, style.css:919–923 D1
/ :917 BALÍK), ale končí nad touto rezervou. Pod rezervou je pevné plátno filmu `.film-canvas`
(`position: fixed; z-index: 0`, style.css:413–419), ktoré pri `world-in` stále ukazuje posledný záber (fasáda a dlažba).
Pozadie tela (`background: var(--ink)`, style.css:83) leží pod plátnom, preto ho nezakryje.

**Čo presne (style.css, oba stromy):**

```css
@media (max-width: 900px) {
  .site-header.is-scrolled { -webkit-backdrop-filter: none; backdrop-filter: none;
    background: var(--ink); box-shadow: 0 1px 0 var(--line); }
  .site-header.is-scrolled::before { opacity: 1; inset: 100% 0 -20px 0;
    background: linear-gradient(to bottom, rgba(14,13,12,.82), rgba(14,13,12,0)); }
  body { padding-bottom: 0; }
  .site-footer { padding-bottom: calc(var(--s7) + var(--cta-h) + 24px + env(safe-area-inset-bottom, 0px)); }
}
/* tieň ide len nadol, nepočíta sa do výšky stránky a zakryje aj odraz na konci (rubber band) */
.site-footer { box-shadow: 0 50vh 0 50vh var(--ink); }
```

Pravidlo `body { padding-bottom: 0 }` je v rovnakom bloku ako pôvodné (style.css:345), preto musí ísť **za** neho,
alebo sa má priamo upraviť riadok 345. Počítač (> 900 px) sa v lište nemení (0,72 + blur podľa ART_DIRECTION.md:90–91).

Doplnok len pre BALÍK a D1 s filmom na počítači: v rovnakej chvíli, keď app.js vie, že pätička zakrýva okno
(`footerIn`, D1 app.js:207), film nemusí kresliť (film.js:966 D1 / :1031 BALÍK už pätičku meria). Na telefóne po L2 to
netreba, plátno nebude.

**Merateľné kritérium (emulácia 430×932 aj 390×844, DPR 3, dotyk):**

- `document.scrollingElement.scrollHeight − (footer.getBoundingClientRect().bottom + scrollY)` = **0 px** (dnes 80 px).
- `getComputedStyle(header).backgroundColor` pri `is-scrolled` = `rgb(14, 13, 12)` (alfa 1).
- Snímka obrazovky na konci stránky: priemerný jas riadkov pod spodnou hranou textu pätičky = jas inku ±2
  (dnes je tam fotka, podľa snímky majiteľa od fyzického riadku 2450 po 2796, teda 115 CSS px).
- Snímka pri pätičke: v páse 0–64 px pod lištou nie je druhé logo (porovnanie pohľadom + `lista-over.mjs`).
- Počítač 1440×900: snímky lišty a pätičky totožné s pred (rozdiel pixelov 0 mimo pätičky).

**Riziko:** nízke (iba CSS). Pozor na `env(safe-area-inset-bottom)` – v aplikácii Claude nemusí byť nenulový,
treba overiť na iPhone. **Dopad na vzhľad:** lišta na telefóne je plne tmavá s jemnou linkou a mäkkým prechodom
pod sebou, čo pôsobí ako lišta s rozmazaním na počítači; pätička rovnaká, pod ňou už len čierna.

---

### L2 – Ľahký režim: telefón bez filmu, prvý obraz hneď z HTML

**Čo majiteľ uvidí:** žiadna čierna obrazovka na začiatku, žiadne čierne okná uprostred skrolu, fotky v širšom
výreze (cover namiesto presahu 1,24×, asi o 29 % viac šírky fotky), žiadne trhanie pri sekvenciách.

**Súbory:** index.html (hlavička riadky 12–21 D1 / 12–19 BALÍK, značka skriptu film.js D1 :902 / BALÍK :884),
assets/style.css, assets/app.js.

**Čo presne:**

1. **Brána `lite`** podľa časti 1 v hlavičke (index.html:12). Poradie: najprv `?film=off`, potom `lite`, potom
   pôvodná podmienka `world`.
2. **Film.js sa na telefóne vôbec nestiahne.** Statickú značku `<script type="module" src="assets/film.js">`
   (D1 index.html:902 / BALÍK :884) nahradiť malým vkladačom: `if (!document.documentElement.classList.contains('lite'))
   import('./assets/film.js')`. Dnes sa stiahne 103 839 B (D1) / 111 325 B (BALÍK) aj vtedy, keď sa film nespustí.
3. **Predbežné načítanie prvého obrazu** (index.html:18–21 D1 / :16–19 BALÍK): pri `lite` vždy `rohozka-m`
   (prológ nie je), a pridať aj WebP vetvu pre prehliadač bez AVIF (dnes len `type='image/avif'`).
4. **Prvý obraz a nadpis viditeľné hneď:** pri `lite` nesmie platiť nič, čo skrýva úvod kvôli `pro` (snímka
   `majitel-iphone-cierny-start.png`: viditeľná len lišta a tlačidlá). Keďže `pro` sa pri `lite` nepridá, overiť,
   že úvodná karta má `--so: 1` (style.css:1112) a nadpis nie je skrytý animáciou.
5. **Zálohy zábernov so sekvenciou a videom** dostanú na telefóne fotku: Poď ďalej = `sala-m` (D1 má dnes
   v záložnom `<picture>` snímku sekvencie `seq/vstup-dnu/f025` 720×1280, D1 index.html:212–213; BALÍK už má
   `sala-m`, BALÍK index.html:204), Remeslo = `stol-m`, ranná sála = `sala-rano-m`.
6. **Video tímu** na telefóne vždy skryté (ako D1 style.css:1305). V BALÍKu je skryté len pri `world-in`
   (BALÍK style.css:1303), teda pri `lite` by sa zobrazilo a stiahlo `tim-v-akcii-576.mp4` (1 212 912 B): pravidlo zmeniť
   na `html.lite .team-video { display: none }` (dokiaľ L6 nerozhodne inak).
7. **Hudba**: bez zmeny správania v L2 (rozhodnutie majiteľa, pozri `otvorene`).

**Merateľné kritérium** (Chromium, 390×844 a 430×932, DPR 3, dotyk, CPU 4×, Fast 4G, prvá návšteva, prázdna cache):

- `document.documentElement.className` obsahuje `lite` a `world-off`, neobsahuje `world`, `world-in`, `pro`.
- Sieť: 0 požiadaviek na `three.module.min.js`, `film.js`, `film-worker.js` (BALÍK), `seq/*`, `*-hlbka*`,
  `video/tim-slucka-*`. Počet WebGL kontextov = 0 (háčik na `HTMLCanvasElement.prototype.getContext`).
- **Prvý obraz:** vo filmovom páse (screencast) je fotka rohožky aj nadpis viditeľný ≤ 1,5 s od navigácie pri
  Fast 4G a ≤ 3,5 s pri Slow 4G; po FCP žiadna snímka, kde je > 90 % plochy tmavšej ako jas 20 (nástroj `tma.py`).
- **Bajty prvej obrazovky** (súčet `transferSize` všetkých zdrojov do 3 s nečinnosti po `load`, bez skrolu):
  **≤ 0,75 MB** (D1 s filmom dnes 1,30 MB, BALÍK 1,37 MB podľa rozbor-vaha; cieľ je odhad, základ treba zmerať tou
  istou metódou).
- **Skrol celej stránky** (12 švihov 1 500 px/s a 1 pomalý ťah 300 px/s, 3 opakovania): dlhé úlohy > 50 ms
  počas skrolu **≤ 2** na celý prechod; Long Animation Frames > 50 ms **≤ 2**; „úloha snímky“ p95 nezhoršená
  oproti D1 `?film=off` (základ PLAN.md §8: p95 27,5–33,1 ms pri CPU 4×). Prísnejšie ciele prichádzajú v L5.
- 0 snímok s plochou čiernej väčšou ako 10 % okna počas skrolu cez všetkých 9 titulných kariet
  (screencast + `over2.py`).
- Počítač 1440×900: `world` sa pridá ako dnes, film beží, výsledky `strih-shot.mjs` a `karty-shot.mjs` bez zmeny.

**Riziko:** stredné. (a) Tablety na výšku s prstom do 720 px dostanú tiež ľahký režim (zámerne, rovnaký prah
ako film.js). (b) Treba overiť, že pokojná verzia nemá iné skryté závislosti na `world` (napr. `.film-place`,
`data-scene-active`). (c) Testy z PLAN.md §3 (`app-smoke.mjs`, `uvod-shot.mjs`, `karty-shot.mjs`) musia prejsť.
**Dopad na vzhľad:** odchádza 3D film, prológ a sekvencie (náhrady v tabuľke v časti 0). Fotky, výrezy, texty,
karty a poradie ostávajú. Fotka je v rámovaní cover, nie 1,24×, takže je jej vidieť viac a buldog ani vrch pumpy
nie sú orezané (porovnanie/cakaren-ramovanie.png).

---

### L3 – Fotka sa nikdy neukáže neúplná

**Čo majiteľ uvidí:** pri prechode na ďalšiu kartu sa nová fotka objaví až celá a ostrá; dovtedy ostáva stará.

**Príčiny:**

- D1 prelína zálohy podľa skrolu (`--so`, D1 app.js:213–219) bez kontroly, či je obrázok stiahnutý a dekódovaný.
  V D1 app.js nie je ani jedno volanie `decode` (`grep -c decode` = 0). Pod fotkou je len `--ink-2`
  (style.css:449), takže vznikne tmavá alebo napoly vykreslená plocha.
- D1 má okolie zálohy −1…+2 (D1 app.js:222): naraz až 4 fotky 1448×2575, každá 14,9 MB po rozbalení
  (python3 -I, časť 5).
- BALÍK má `decodeStill` (BALÍK app.js:214–233), okolie ±1 (BALÍK app.js:297), `will-change` len pri blízkych
  (BALÍK style.css:461), ale poistku 600 ms (BALÍK app.js:303–306), po ktorej ukáže aj nedekódovanú fotku, a rozmazané
  náhľady 32 px cez celé okno (img/film/nahlady.json, BALÍK style.css:1338–1345).

**Súbory:** assets/app.js, assets/style.css.

**Čo presne:**

1. Prevziať do D1 `decodeStill`/`stillReady` z BALÍKa (BALÍK app.js:214–233) a okolie ±1 (BALÍK app.js:297).
2. **Pravidlo zobrazenia:** karta `i` sa začne prelínať (`--so > 0`) len ak `stillReady(i)`. Kým nie je, ostáva
   na obrazovke posledná hotová fotka (`lastStill`) a nová fotka dobehne prelínanie cez `opacity` 400 ms hneď,
   ako je pripravená (`transition` len pri tomto dobehnutí, inak riadi skrol).
3. **Poistka** platí len pre úplne prvý obraz stránky (úvod), nie pre ďalšie karty. Pre ostatné karty: ak fotka
   nie je hotová, ostáva predchádzajúca, nikdy nie tma ani náhľad.
4. Náhľady 32 px (BALÍK) na telefóne nepoužívať cez celé okno. Smú byť len ako `background-image` pod
   úplne prvou fotkou pri pomalej sieti.
5. `will-change: transform` len pri `.is-near` (BALÍK style.css:461, do D1 style.css:460).
6. Najviac **3** zálohy s `display` iným ako `none` (aktuálna, predchádzajúca, ďalšia).
7. BALÍK: obmedziť nútené `decode()` pásu tímu a galérie (BALÍK app.js:246–255, okraj 100 % a všetky obrázky)
   na 2 najbližšie obrázky pásu.

**Merateľné kritérium** (390×844 DPR 3, CPU 4×, Fast 4G aj Slow 4G, skrol cez všetky karty 1 500 px/s a skok
z menu na Služby a Kontakt):

- **„Obrázok viditeľný pred dekódovaním“ = 0**: sonda v každom `requestAnimationFrame` zistí každú `.film-still`
  s `visibility: visible`, `display ≠ none` a `opacity > 0.01` a skontroluje `img.complete && img.naturalWidth > 0`
  a príznak dokončeného `img.decode()` (sonda sama volá `decode()` po `load` a zapíše čas). Počet porušení = 0.
- Screencast: žiadna snímka, kde je pás fotky pod 90 % konečného jasu dlhšie ako 1 snímku po začiatku
  prelínania (metóda „neúplné fotky“ z rozbor-stranka; nástroj `over-dekod.mjs` + `over-dekod.py`; základ
  PLAN.md §8: „2–4 snímky 77–98 % tmy; 14–16 snímok slepého portrétu“ → cieľ 0 a 0).
- Počet `.film-still` s `display ≠ none` ≤ 3 v každom okamihu; súčet `naturalWidth × naturalHeight` ≤ 11,2 MP
  (3 × 3,73 MP) v L3, po L4 ≤ 6,3 MP.

**Riziko:** stredné. Pri veľmi pomalej sieti môže stará fotka ostať dlhšie, než sa zmení text karty (text
a fotka sa rozídu). Zmierniť: ďalšiu fotku sťahovať o jednu kartu skôr (okolie +1 už to robí). **Dopad na vzhľad:**
žiadny nový efekt; mení sa len okamih, kedy sa fotka objaví.

---

### L4 – Ľahšie fotky pre telefón (rovnaké výrezy)

**Čo majiteľ uvidí:** rýchlejšie načítanie a menej zastavení pri skrole; obraz rovnaký.

**Príčina:** `sizes="(max-width: 720px) 93vw, …"` (napr. D1 index.html:158–159, hlavička :21) pri DPR 3 a šírke
390 vyjde 1 088 px > 1 086, Safari teda vezme `-m-1448` (rozbor-vaha; tvrdenie o výbere WebKitu treba overiť M1).
Súbory: `rohozka-m-1448.avif` 438 359 B oproti `rohozka-m-1086.avif` 124 712 B; `cakaren-m-1448.avif` 329 960 B
oproti `cakaren-m-1086.avif` 181 536 B (python3 -I os.path.getsize, oba stromy rovnaké).

Výpočet pre cover v ľahkom režime (python3 -I): fotka 9:16 v okne 390×844 má šírku 475 CSS px, v okne 430×932
524 CSS px. Hustota: `1448` = 3,05 / 2,76 px na CSS px, `1086` = 2,29 / 2,07, `900` = 1,90 / 1,72.
Po rozbalení: 1448 = 14,9 MB, 1086 = 8,4 MB, 900 = 5,8 MB na fotku.

**Súbory:** index.html (`<source media="(max-width: 720px)">` pri každom zábere, hlavička), source/tools/stills.py
(výpočet a komentár :17–19 D1), v kroku L4b nové súbory v assets/img/film/.

**Čo presne:**

- **L4a (bez nových súborov):** telefónny `<source>` dostane jediného kandidáta `-m-1086` (AVIF aj WebP vetva),
  rovnako hlavičkový `imagesrcset`. Opraviť komentár a výpočet v stills.py.
- **L4b (voliteľné, po schválení ostrosti majiteľom):** vyrobiť `-m-900` (900×1600) z tých istých originálov
  a výrezov; prepnúť len ak porovnanie `ostrost.py` a pohľad majiteľa nepotvrdia viditeľný rozdiel.
- **Galéria (hlavne BALÍK):** BALÍK má `sizes` 146vw/78vw (BALÍK index.html:650–715) a na telefóne berie 1600×1067,
  asi 60 MB po rozbalení (rozbor-stranka). Pridať `<source media="(max-width: 640px)">` s výrezom 4:5 (800×1000) z tých
  istých originálov podľa bodu záujmu. D1 má opačný problém: `sizes 50vw` → 0,34× potrebného rozlíšenia (D1
  index.html:670–735), fotky sú mäkké; ten istý výrez 4:5 to opraví.
- Zálohy, ktoré film na telefóne nekreslí, sa po L2 netýkajú (film nebeží).

**Merateľné kritérium:**

- Chromium (390×844 DPR 3): `currentSrc` každej zálohy končí na `-m-1086.*` (L4a) alebo `-m-900.*` (L4b);
  žiadny `-m-1448`. To isté overiť v Safari (M1), lebo Chromium vyberá kandidáta inak.
- Bajty prvej obrazovky **≤ 0,45 MB** (L4a, odhad), celá stránka prejdená do konca **≤ 3,5 MB** bez videa (odhad;
  rozbor-vaha uvádza dnes bez filmu 4,4 MB D1 a 5,0 MB BALÍK).
- Najväčší rozbalený obrázok na telefóne ≤ 2,1 MP (L4a) / ≤ 1,44 MP (L4b); galéria ≤ 1 MP na bunku.
- `ostrost.py` na snímkach 390×844 DPR 3: rozdiel ostrosti 1448 vs 1086 pod prahom, ktorý určí porovnanie; konečné
  slovo majiteľ (pohľadom na iPhone).

**Riziko:** stredné pre vzhľad (menej pixelov na DPR 3 displeji), nízke technicky. **Dopad na vzhľad:** rovnaké
výrezy a body záujmu; pri L4b mierne menšia ostrosť na veľmi blízky pohľad – preto L4b len so súhlasom.

---

### L5 – Plynulý skrol stránky (mimo fotiek)

**Čo majiteľ uvidí:** karty a nadpisy idú s prstom, bez oneskorenia a bez „gumy“.

**Príčiny a čo presne (súbory assets/style.css, assets/app.js):**

1. **Rozmazávanie slov** `filter: blur(5px)` (D1 style.css:1284 / BALÍK :1282), `blur(6px)` (D1 :1277), úvod
   `zaostrenie` blur(10px) (D1 :1065–1067). → odstrániť `filter` zo všetkých troch, nástup len `opacity` +
   `translateY` (ART_DIRECTION.md:72–73, :143).
2. **Deväť pripnutých titulných rámov cez celé okno** s krytím `--o` zapisovaným v každej snímke (D1 app.js:198–202,
   BALÍK :279–286) a ťažkými tieňmi textu (D1 style.css:1047, `--halo` :981, :1037, :1055). → zapisovať krytie na menší
   blok `.title-card`, nie na rám cez celé okno, a `will-change: opacity` len pri `.is-on`. Najprv zmerať
   prekresľovanie (udalosti Paint ≥ 50 % okna).
3. **Dobiehanie (lerp)** v slučke skrolu (D1 app.js:258–263). → na dotyku `shownP = targetP`; lerp len pre koliesko.
4. **Prepočet `measure()`** pri skrývaní panela Safari (D1 app.js:333–346: resize, orientationchange,
   ResizeObserver tela). → pri zmene iba výšky okna o < 120 px nemerať; dĺžky kariet zo stabilnej `svh`
   (ako BALÍK app.js:113–115). BALÍK navyše `setTimeout` pri každom skrole (BALÍK app.js:421–423) – zrušiť.
5. **Lesk tlačidla** `.btn-primary::after` beží nekonečne aj v pevnom spodnom tlačidle (D1 style.css:1195–1201,
   index.html:877) → v `.mobile-cta` prejde raz po zobrazení.

**Merateľné kritérium** (390×844 DPR 3, CPU 4× a 6×, `ab3.sh stredne` a `svih`, 3 opakovania, medián):

- „Úloha snímky“ (čas hlavného vlákna na snímku) p95 **≤ 16,7 ms pri CPU 4×** a **≤ 20 ms pri CPU 6×**;
  snímky s úlohou > 33 ms ≤ 1 %. Základ (D1, film vypnutý, PLAN.md §8): p95 27,5–33,1 ms pri CPU 4×.
- Long Animation Frames > 50 ms počas celého skrolu **= 0** pri CPU 4×.
- Počas nábehu a odchodu karty žiadna udalosť Paint s plochou ≥ 50 % okna okrem prvej snímky prelínania.
- Pri emulovanej zmene výšky okna o 60 px (panel Safari) počas skrolu: 0 volaní `measure()`.
- rAF a celkové snímky sa v kontajneri merajú so softvérovým kreslením (PLAN.md §3), preto pre ne platí „nezhoršiť“,
  rozhoduje čas vlákna.

**Riziko:** nízke až stredné (bod 2 mení spôsob, ako karta mizne; treba porovnať snímky prechodov
`karty-shot.mjs`). **Dopad na vzhľad:** nadpisy sa nerozostrujú (v súlade s dizajnovým manuálom), karty sú rovnaké.

---

### L6 – Videá na telefóne (voliteľné, rozhodnutie majiteľa)

Po L2 telefón neukazuje žiadne video (sekvencie a video v plátne sú nahradené fotkami). Majiteľ sa sťažoval, že
videá sú zasekané, nie že ich nechce. Ak ich chce späť:

- **Súbory:** index.html (záber sala-rano a karta tímu), assets/app.js, nový `assets/video/tim-slucka-576.mp4`
  (H.264, 576×1024, z toho istého zdroja; dnešný `tim-slucka-864.mp4` je zväčšený zo 576 px podľa videa.sh:10–13,
  rozbor-vaha).
- **Čo presne:** bežné `<video muted playsinline loop preload="none" poster="…-poster-576.avif">` v karte, spúšťané
  `IntersectionObserver` (≥ 60 % viditeľnosti), zastavené mimo okna; nikdy viac ako 1 hrajúce video; žiadne viazanie
  na skrol. Plagát je presne prvá snímka videa (žiadny skok pri štarte).
- **Kritérium:** pri prejdení karty: 0 dlhých úloh > 50 ms spôsobených videom, `video.getVideoPlaybackQuality().droppedVideoFrames`
  ≤ 2 % pri CPU 4×, sieť: video sa začne sťahovať až pri vstupe karty do okna, nie pri načítaní stránky.
- **Riziko:** nízke (dekódovanie videa na iPhone je hardvérové, treba potvrdiť M2). **Dopad:** vráti pohyb do sály
  bez ťažkého filmu.

### L7 – Počítač a film (mimo telefónu, len poznámka)

Na počítači film ostáva. Opravy čiernych okien filmu (BALÍK film.js:1171–1185, 1541, style.css:507), rozbaľovanie vo
workeri (BALÍK film-worker.js:18–26) a skok priblíženia po záchrannej brzde (BALÍK film.js:1262 → pridať `world-frame`
pri `stop()`) sú samostatná práca a neblokujú L1–L6.

---

## 3. Metóda merania pred a po

**Podmienky (PLAN.md §3):** meria sa len keď nebeží iný prehliadač (`pgrep -c chrom` = 0) a záťaž `/proc/loadavg`
< 2 sa zapisuje; A/B striedavo (pred, po, pred, po); skrol 3×, ostatné 2×, medián. Nástroje sa vždy kopírujú:
`bash $SP/barber/audit/plan/nastroje.sh <cieľ> <port> <strom>`. Toto meranie **nespúšťať súbežne s iným tímom**.

**Porty (8600–8619):**

| Strom | http.server | gzip (Lighthouse) |
|---|---|---|
| D1 pred | 8600 | 8601 |
| BALÍK pred | 8602 | 8603 |
| D1 + L dávky | 8604 | 8605 |
| BALÍK + L dávky | 8606 | 8607 |
| kópie nástrojov | 8610–8619 | |

```bash
SP=/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad
python3 -I -m http.server 8600 --bind 127.0.0.1 --directory $SP/hs-pred-d1 &       # web: http://127.0.0.1:8600/barbershop-30/
python3 -I $SP/barber/audit/overenie-vykon-telefon/gzip-server.py $SP/hs-pred-d1 8601 &
# Lighthouse (mobil): CHROME_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome \
#   $SP/lh-tool/node_modules/.bin/lighthouse http://127.0.0.1:8601/barbershop-30/ --only-categories=performance --output=json --output-path=<súbor>
```

**Playwright (1.56.1, `/opt/node22/lib/node_modules/playwright`), jadro skriptu `meranie-lahky.mjs`:**

```js
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3,
  isMobile: true, hasTouch: true });                         // druhý beh: 430×932
await ctx.addInitScript(SONDA);                              // WebGL háčik, LoAF observer, sonda dekódovania (L3)
const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });   // a 6
await cdp.send('Network.enable');
await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 165,
  downloadThroughput: 9e6 / 8 * 0.9, uploadThroughput: 9e6 / 8 * 0.9 });   // Fast 4G; Slow 4G: 562.5 ms, 180 kB/s
await cdp.send('Tracing.start', { transferMode: 'ReturnAsStream', traceConfig: { includedCategories: [
  'devtools.timeline', 'disabled-by-default-devtools.timeline', 'disabled-by-default-devtools.timeline.frame',
  'disabled-by-default-devtools.timeline.paint', 'blink', 'blink.image_decode', 'cc', 'gpu', 'loading' ] } });
await page.goto('http://127.0.0.1:8604/barbershop-30/?uvod=off');
// prvá obrazovka: Page.startScreencast (filmový pás 3 s), potom performance.getEntriesByType('resource') → transferSize
// skrol: 12× Input.synthesizeScrollGesture { x:195, y:600, yDistance:-900, speed:1500, gestureSourceType:'touch' }
//        + 1× pomalý ťah speed:300 až po pätičku
await cdp.send('Tracing.end');                               // stream → stopa.json
```

**Čo sonda a vyhodnotenie zapíšu (rovnako pred aj po):**

- zo stopy: snímky (`PipelineReporter`/`BeginFrame`) a čas hlavného vlákna na snímku (p50, p95, podiel > 16,7 ms,
  > 33 ms, > 50 ms), dlhé úlohy > 50 ms, `ImageDecodeTask`/`Decode Image` (vlákno, trvanie, rozmer), `Paint` s plochou,
  `texSubImage2D`/`GPUTask` (pred, pri filme);
- zo sondy: Long Animation Frames > 50 ms, počet WebGL kontextov, porušenia „viditeľný pred dekódovaním“, počet
  `.film-still` s `display ≠ none` a súčet ich MP, `scrollHeight − footer.bottom`, triedy `<html>`;
- zo siete: bajty prvej obrazovky a celej stránky, `currentSrc` záloh;
- zo screencastu: snímky s > 90 % tmy po FCP, pás fotky pod 90 % konečného jasu (`tma.py`, `over2.py`, `over-dekod.py`).

Existujúce nástroje na to isté: `overenie-kod-stranka/ab3.sh` (skrol, švih), `overenie-vykon-telefon/skrol2.mjs`
(čas vlákna), `overenie-kod-stranka/over-dekod.mjs` (neúplné fotky), `nastroje/pata2.mjs` (pätička),
`hlavicka.mjs`/`lista-over.mjs` (lišta). Pozor: `pata2.mjs` dnes meria počítačové šírky (PLAN.md §8), pre L1 treba
pridať 390×844 a 430×932.

**Čo ostane nepotvrdené bez skutočného iPhonu:**

1. Či iPhone majiteľa naozaj zapína `world` (M1: `navigator.hardwareConcurrency`, `devicePixelRatio`, triedy `<html>`,
   cez dočasný panel `?ladenie=1`). Po L2 je to jedno, ale vysvetlí to pôvodné zasekávanie.
2. Cena rozbaľovania AVIF v Safari na hlavnom vlákne (Chromium rozbaľuje mimo hlavného vlákna, emulácia to nezachytí).
3. Ktorého kandidáta zo `srcset` vyberie WebKit (1448 vs 1086) – Chromium rozhoduje inak (rozbor-vaha).
4. Pamäť a strata WebGL kontextu vo WKWebView aplikácie Claude, správanie po návrate z inej aplikácie.
5. Odraz na konci stránky (rubber band) a `env(safe-area-inset-bottom)` v náhľade aplikácie Claude.
6. Teplo a takt procesora v pokoji (D1 kreslí 3 min po dotyku).
7. Skutočná plynulosť – emulácia CPU 4×/6× v kontajneri so softvérovým kreslením je len porovnávacia.

Postup na iPhone (po L2, pred zverejnením): iPhone cez kábel → Safari na Macu → Vývoj → zariadenie →
Timelines (JavaScript & Events, Rendering, CPU, Memory) pri prejdení stránky tam a späť 3×; konzola
`[...document.images].map(i=>[i.currentSrc,i.naturalWidth,i.complete])`; a nakoniec pohľad majiteľa v aplikácii Claude.

---

## 4. Na ktorom strome stavať

**Odporúčanie: stavať na D1 a každú dávku písať tak, aby sa dala bez zmeny preniesť na BALÍK.**

Dôkazy z rozborov:

- Obe viditeľné chyby (L1) sú v D1 aj v BALÍKu v **rovnakých riadkoch** (style.css:301, 318, 345, 413–419); BALÍK ich
  nerieši. Brána filmu je v oboch rovnaká (index.html:12).
- Hlavné zlepšenia BALÍKa sú vo **filme** (worker, náhľady, podržanie obrazu, strata kontextu). Po L2 film na
  telefóne nebeží, takže pre telefón strácajú váhu; zostávajú cenné pre počítač (L7).
- BALÍK prináša na telefón aj zhoršenia: ťažká galéria asi 60 MB po rozbalení (BALÍK index.html:650–715), nútené
  dekódovanie celých pásov (BALÍK app.js:246–255), video tímu a skok obsahu pri štarte filmu (BALÍK style.css:1303),
  rozmazané 32 px náhľady („dokresľovanie“) a skok priblíženia po záchrannej brzde (BALÍK film.js:1262).
- Pre telefón je z BALÍKa potrebné len málo: `decodeStill`/`stillReady` (BALÍK app.js:214–233), okolie ±1
  (app.js:297), `will-change` len pri blízkych (style.css:461), stabilná výška `svh` (app.js:113–115), záloha Poď
  ďalej `sala-m` (index.html:204). Tieto časti sa do D1 prenesú v L2–L5.
- BALÍK sa ešte preveruje (D6, D7, admin). Telefón nemusí čakať.

**Ako sa špecifikácia premietne na oba stromy:**

| Dávka | D1 | BALÍK |
|---|---|---|
| L1 | style.css:301, 318, 345, 919 | style.css:301, 318, 345, 917 (rovnaká zmena) |
| L2 | index.html:12, 15, 18–21, 902; zálohy D1 :212–213 → sala-m; video tímu už skryté (style.css:1305) | index.html:12, 14, 16–19, 884; style.css:1303 zmeniť na `html.lite` |
| L3 | preniesť decodeStill a ±1 z BALÍKa; poistka len pre prvý obraz | už má; zmeniť poistku 600 ms (app.js:303–306) na „len prvý obraz“, náhľady na telefóne vypnúť, decode pásov obmedziť (app.js:246–255) |
| L4 | `<source>` 1086 (index.html:158–159 a ďalšie), galéria 4:5 (index.html:670–735) | to isté; galéria index.html:650–715 |
| L5 | style.css:1284, 1277, 1065; app.js:198–202, 258–263, 333–346 | style.css:1282; app.js:279–286, 421–423 |
| L6, L7 | rovnaké | rovnaké; L7 je v BALÍKu z veľkej časti hotová |

Ak preverenie BALÍK prijme skôr, než sa začne L3, prejsť na BALÍK (L3 sa skráti na úpravu poistky a náhľadov)
a L1–L2 preniesť ako hotové záplaty – riadky sa zhodujú alebo sú posunuté o 1–18 riadkov, ako uvádza tabuľka.

---

## 5. Výpočty a overenia bez prehliadača (podklady tvrdení)

- Veľkosti súborov (python3 -I os.path.getsize, rovnaké v D1 aj BALÍKu): rohozka-m-1086.avif 124 712 B,
  rohozka-m-1448.avif 438 359 B, cakaren-m-1086.avif 181 536 B, cakaren-m-1448.avif 329 960 B, vstup-m-1448.avif
  327 096 B, three.module.min.js 687 458 B, tim-slucka-864.mp4 3 402 635 B, tim-v-akcii-576.mp4 1 212 912 B,
  95 snímok sekvencií AVIF spolu 3 643 267 B. film.js 103 839 B (D1) / 111 325 B (BALÍK), app.js 43 418 / 51 202 B.
- Rozbalená pamäť (RGBA): 1448×2575 = 3,73 MP = 14,9 MB; 1086×1931 = 2,10 MP = 8,4 MB; 900×1600 = 1,44 MP = 5,8 MB;
  tri naraz 44,7 / 25,2 / 17,3 MB.
- Cover 9:16 na telefóne: 390×844 → 475 CSS px šírky, 430×932 → 524 CSS px; hustoty uvedené v L4.
- Snímky majiteľa: 1290×2796 px = 430×932 CSS pri DPR 3 (rozbor-stranka, PIL), nie 390×844.
