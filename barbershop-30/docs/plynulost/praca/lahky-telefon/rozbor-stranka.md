# Rozbor: stránka, CSS a videá na iPhone (D1 vs. BALÍK)

Oblasť: všetko okrem `film.js` (index.html, assets/app.js, style.css, atmosfera.*, i18n.*, vernost.js, recenzie.js).
Bez prehliadača a bez servera; každé tvrdenie má súbor:riadok alebo výstup príkazu.

- **D1** = `hs-pred-d1/barbershop-30` (commit 7ea247c)
- **BALÍK** = `hs-chatgpt/barbershop-30` (balík nad c129f58)
- Snímky majiteľa: 1290 × 2796 px (PIL), teda telefón **430 × 932 CSS px pri DPR 3** (iPhone Pro Max/Plus),
  nie 390 × 844. Merania treba robiť aj na 430 × 932.

---

## 1. Zhrnutie

1. **Pod pätičkou prosvitá film** (oba stromy). Dokument končí 80 px pod pätičkou, lebo telo má na telefóne
   `padding-bottom: calc(var(--cta-h) + 24px)` (`style.css:345`, oba). Pod týmto pásom nie je nič nepriehľadné,
   iba pevné plátno filmu `.film-canvas` (`position: fixed; z-index: 0`, D1 `style.css:413–419`, ktoré vytvára
   `film.js:281`). Plátno stále kreslí posledný záber „Vstup z Mostnej ulice“, teda dlažbu ulice. Na snímke je
   fotka pod pätičkou od riadku 2450 do 2796 fyzických px, čo je **346 px = 115 CSS px**. Z toho 80 px je rezerva
   tela, zvyšok (asi 35 px) je pravdepodobne odraz pri skrole (rubber band) alebo spodný bezpečný okraj (treba zmerať).
2. **Lišta na telefóne je polopriehľadná** (oba stromy). Po 80 px skrolu má `rgba(14,13,12,0.9)` bez rozmazania
   (`style.css:318`), takže 10 % obsahu pod ňou presvitá. Gradient pod lištou sa vtedy vypne (`style.css:301`)
   a obsah sa pod ňu zarezáva ostrou hranou. V pätičke vzniká dvojité logo „Barbershop 30 NITRA“ (lišta plus
   `index.html:838`).
3. **Zasekávanie mimo filmu**, podľa odhadu dopadu:
   - (a) Pevné zálohy fotiek cez celú obrazovku. V D1 ich je naraz až 4, každá s rozmermi 1448 × 2575 px, teda 14,9 MB po dekódovaní.
   - (b) Deväť pripnutých titulných rámov cez celú obrazovku. JavaScript im v každej snímke mení krytie a obsahujú
     ťažké tiene textu.
   - (c) Animácie s `filter: blur()` na slovách nadpisov, hoci ART_DIRECTION rozmazávanie textu zakazuje.
   - (d) Dobiehanie (lerp) v slučke skrolu, ktoré oneskoruje karty za prstom.
   - (e) Prepočet `measure()` pri zmene výšky okna, keď sa na iOS skrýva panel.
4. **„Neúplné fotky“**: v D1 nemá záloha žiadny náhľad. Keď sa ďalší záber začne prelínať skôr, než je fotka
   stiahnutá a dekódovaná, vidno tmavú plochu `--ink-2` (`style.css:449`) alebo čiastočný obraz. Fotka galérie
   je na telefóne v D1 na 0,37 potrebného rozlíšenia (`sizes` hovorí 50vw, karta má však 146vw). Záloha „Poď
   ďalej“ má na telefóne len 720 px. BALÍK rieši náhľady aj dekódovanie, ale pridáva ťažkú galériu a
   nútené dekódovanie všetkých fotiek tímu a galérie naraz.
5. **Videá v mojej oblasti** sú v D1 na telefóne vypnuté (okno „Tím v akcii“ má `display: none`,
   `style.css:1305`). Zasekané videá na telefóne sú filmové (`film.js`, iný tím). BALÍK okno tímu na telefóne
   zapína, kým film nebeží (`style.css:1303` BALÍK).

---

## 2. Dva viditeľné problémy zo snímok

### 2.1 Lišta bez nepriehľadného pozadia prekrýva obsah

**Pravidlá (rovnaké v D1 aj v BALÍKU):**

| Stav | Pravidlo | Výsledok na telefóne |
|---|---|---|
| hore (scrollY ≤ 80) | `.site-header` bez pozadia (`style.css:283–290`), `::before` gradient 0,6 → 0, presah 56 px (`style.css:296–300`) | v úvode dobré (tma nad fotkou) |
| po 80 px | `app.js:239–240` (D1), `app.js:341–342` (BALÍK) pridá `is-scrolled` | |
| `is-scrolled`, ≤ 900 px | `background: rgba(14,13,12,0.9)`, `backdrop-filter: none` (`style.css:318`) | **10 % presvitá** |
| `is-scrolled` | `::before { opacity: 0 }` (`style.css:301`) | obsah sa pod lištu zarezáva ostrou hranou |
| pred app.js | `@supports (animation-timeline: scroll())` 0 → 0,72, blur iba ≥ 901 px (`style.css:944–959` D1, `942–957` BALÍK); s app.js neplatí (`html[data-scene-active]`, `app.js:688` D1 / `772` BALÍK) | |

Na snímke pätičky je hrana lišty na riadku asi 357 px fyzických. Hneď pod ňou začína odrezané logo pätičky
(svetlé riadky 360–378, PIL). Priemerný jas pásu lišty je 17 a pätičky 13,1 (#0E0D0C): lišta nie je
čistý ink. BALÍK navyše pridáva do lišty 2 px oranžovú linku progresu (`app.js:71–73, 345`,
`style.css:1328–1330` BALÍK). Tá na probléme nič nemení.

**Návrh (oba stromy, iba ≤ 900 px; počítač ostáva 0,72 + blur podľa ART_DIRECTION:90–91):**

```css
@media (max-width: 900px) {
  /* nahradí style.css:318 */
  .site-header.is-scrolled {
    -webkit-backdrop-filter: none; backdrop-filter: none;
    background: var(--ink);                     /* nepriehľadný #0E0D0C */
    box-shadow: 0 1px 0 var(--line);
  }
  /* jemný prechod pod lištou: obsah sa do tmy stráca, neodreže sa hranou */
  .site-header.is-scrolled::before {
    opacity: 1; inset: 100% 0 -20px 0;
    background: linear-gradient(to bottom, rgba(14, 13, 12, 0.82), rgba(14, 13, 12, 0));
  }
}
```

Prečo to sedí s dizajnom: rozmazaná lišta 0,72 + blur 12 px nad tmavou fotkou pôsobí ako takmer plný ink.
Plný ink s 1 px linkou `--line` a 20 px prechodom dáva ten istý dojem bez `backdrop-filter`, ktorý na telefóne
nechceme (PLAN.md, D1 bod 9). Pseudoprvok `::before` má `z-index: -1` v kontexte lišty (`z-index: 40`), preto
kreslí nad stránkou a pod obsahom lišty. Pri otvorenom menu ho prekryje nepriehľadné menu (`style.css:321–330`).
Cena je nulová: jeden plný obdĺžnik a jeden gradient výšky 20 px, nič sa nehýbe.

### 2.2 Pod pätičkou prosvitá fotka ulice

**Príčina (oba stromy):**

- `body { padding-bottom: calc(var(--cta-h) + 24px) }` = 56 + 24 = **80 px** pod pätičkou (`style.css:345`).
  Spodné tlačidlo je v pätičke aj tak skryté: `ctaHidden()` vráti true pre poslednú kapitolu (`app.js:249` D1).
- Pätička je `position: relative; z-index: 1; background: var(--ink)` (`style.css:919–924` D1, `917` BALÍK),
  ale končí nad touto rezervou.
- Pod ňou leží iba pozadie `body`/`html` (`style.css:63–64, 80–85`) a nad ním pevné vrstvy so `z-index: 0`,
  ktoré sa kreslia **nad** pozadím tela:
  - `.film-canvas` (`style.css:413–419`, s filmom `opacity: 1`, D1 `:419`, BALÍK `:419` s `:not(.film-strata)`).
    Film kreslí posledný záber `data-shot="vstup"` (`index.html:781`), teda fasádu a dlažbu Mostnej ulice.
  - `body::after` s tmavým gradientom (`style.css:1087–1093`, na telefóne 0,72 dole `:1159–1161`), preto je dlažba stmavená.
  - Bez filmu sú pevné zálohy `.film-still` pri pätičke skryté (`--so = 0`, keď `footerIn`, `app.js:207, 217` D1;
    BALÍK `app.js:290`). V pokojnej verzii teda vznikne len tmavý pás, nie fotka. Fotka ulice na snímke
    dokazuje, že u majiteľa beží film (`html.world-in`). Treba to overiť meraním.
- Pri odraze na konci stránky (iOS rubber band) pevné plátno stojí a obsah ide hore, takže fotka vykukne aj
  bez rezervy 80 px. To vysvetľuje 115 namiesto 80 CSS px (treba zmerať).

**Návrh (oba stromy, nič sa nehýbe ani neprekresľuje):**

```css
/* pätička „pokračuje“ pod dokument: tieň sa nepočíta do výšky stránky (nepredĺži skrol),
   prekryje 80 px rezervu aj odraz na konci; ide len nadol, obsah nad pätičkou nezakryje */
.site-footer { box-shadow: 0 50vh 0 50vh var(--ink); }
@media (max-width: 900px) {
  body { padding-bottom: 0; }
  .site-footer { padding-bottom: calc(var(--s7) + var(--cta-h) + 24px + env(safe-area-inset-bottom, 0px)); }
}
```

Doplnok pre tím filmu: `film.js:966` (D1) a `:1031` (BALÍK) už meria pásy vrátane `footer`. Keď pätička
zakrýva celé okno, plátno môže prestať kresliť, čo ušetrí GPU aj batériu. To nie je moja oblasť.

---

## 3. Prečo sa to na telefóne zasekáva (stránka bez filmu)

### 3.1 Pevné zálohy cez celú obrazovku: pamäť a dekódovanie (D1 vysoká, BALÍK stredná)

- `html.karty .film-shot.is-title .film-still { position: fixed; height: 100lvh }` (`style.css:1105–1108` D1).
  Každá záloha je samostatná pevná vrstva cez celé okno a má ešte `::after` s gradientmi (`:1094–1099`, `:1159`).
- Okolie `is-near`: v D1 sú to **4 zábery naraz** (`cur-1 … cur+2`, `app.js:222`). `display` majú všetky štyri a
  `img` má `will-change: transform` vždy pri `data-motion="on"` (`style.css:460`).
- Rozmery (PIL): `cakaren-m-1448.webp` má 1448 × 2575 px, čo je **14,9 MB po dekódovaní**. Rovnako
  `rohozka-m`, `vstup-m`, `sud-m`. `stol-m-1448` má 1152 × 2048 px (9,4 MB). Štyri zálohy teda zaberú
  **≈ 50–60 MB** dekódovaných obrázkov plus štyri vrstvy veľkosti okna (1290 × 2796 × 4 B = 14,4 MB každá).
- Keď film beží, zálohy sú skryté iba cez `opacity: 0; visibility: hidden` (`style.css:1116–1119`), nie cez `display: none`.
  Prehliadač ich teda **stále sťahuje**. Film si súčasne sťahuje vlastné textúry (`film.js:425–431`: telefón
  maximálne 1448, podľa `need` môže vybrať 1086). Ak vyberie 1086, ten istý záber sa sťahuje dvakrát (treba zmerať).
- Výmena záberu (`--so` 0 → 1, `app.js:213–219`) sa začne bez ohľadu na to, či je fotka stiahnutá a
  dekódovaná. Podklad je `background: var(--ink-2)` (`style.css:449`). Na pomalšej sieti alebo pri dekódovaní
  14,9 MB obrázka sa preto prelína tmavá plocha alebo čiastočný obraz. To je pravdepodobné „neúplné fotky“
  (treba zmerať).
- **BALÍK** okolie zmenšil na ±1 (`app.js:297`). `will-change` dáva len pri `.is-near` (`style.css:461`).
  Dekóduje vopred (`app.js:216–233`), drží posledný obraz najviac 600 ms (`app.js:300–325`) a pridal
  rozmazané náhľady ako `background-image` na `img`: prvé dva sú priamo v `style.css:1338–1345`, ostatné
  v `img/film/nahlady.css` (6 655 B), ktorý sa načíta po dvoch snímkach (`app.js:239–243`). To je dobrý smer.

**Návrh:** v oboch stromoch pri bežiacom filme dávať zálohám `display: none` (okrem úvodu a krátkeho
odovzdania), aby sa nesťahovali ani nedekódovali dvakrát. V D1 prevziať z BALÍKA okolie ±1, `will-change` len
pri `is-near`, náhľady a podmienku „prelínaj až po `decode()`“. Vzhľad sa nemení.

### 3.2 Deväť pripnutých titulných rámov, krytie z JS v každej snímke (oba, treba zmerať)

- `index.html` obsahuje 9 kotiev `film-shot is-title` (`grep -c` = 9). Každá má `.title-pin { position: sticky;
  height: 0 }` a v ňom `.title-frame { position: absolute; height: 100svh }` (`style.css:996–1008` D1).
  Na iOS je pripnutý prvok vlastná vrstva (asynchrónny skrol), takže vznikne až 9 vrstiev veľkosti okna.
- Krytie `opacity: var(--o)` zapisuje `setVar('--o', …)` v každej snímke slučky (`app.js:198–202` D1,
  `:279–286` BALÍK). `.title-frame` nemá vlastnú vrstvu (`will-change` chýba), preto Safari pri každej zmene
  krytia prekreslí obsah pripnutej vrstvy. Ten obsahuje:
  - nadpis s tieňom `0 2px 30px` (`style.css:1047`),
  - nadpisok a riadok so štvornásobným tieňom `--halo` (rozmazanie až 16 px, `style.css:981, 1037, 1055`),
  - radiálny gradient za blokom, ktorý je na telefóne širší než okno (`style.css:1026–1029, 1150`).
  Nábeh trvá 12 % a odchod 8 % voľnej dĺžky karty (`app.js:21`), čo predstavuje stovky px skrolu s prekresľovaním.
- **Návrh:** krytie zapisovať na `.title-card` (malý blok), nie na rám cez celé okno, a dať mu `will-change: opacity`
  len pri `.is-on`. Alternatíva je prepínať triedu a nechať prechod `opacity` 300 ms na kompozitore, čo BALÍK
  robí v pokoji (`is-rest`, `style.css:1325–1327` BALÍK). Vzhľad sa nemení.

### 3.3 Rozmazanie textu animáciou `filter: blur()` (oba)

- Slová nadpisov: `.js-kin .kin .kw { filter: blur(5px) … transition: filter 0.45s }` (`style.css:1284` D1, `:1282`
  BALÍK). Spúšťa sa pri každom rozsvietení karty (`is-on`, `:1285`), teda **uprostred skrolu**.
- Úvod: `@keyframes zaostrenie { from { filter: blur(10px) … } }` (`style.css:1065–1067`) pri štarte, keď je
  hlavné vlákno najviac vyťažené.
- Kroky strihu: `filter: blur(6px)` (`style.css:1277`).
- Je to v rozpore s `docs/ART_DIRECTION.md:72` („Titulky sa nikdy nerozmazávajú“) a `:143` („Žiadne rozmazanie
  dôležitého textu“). Na iOS každé slovo s animovaným filtrom dostane vlastnú vrstvu so zväčšenými hranicami
  (rozmazanie) a vrstvy vznikajú a zanikajú práve počas ťahu prstom.
- **Návrh:** nástupy iba cez `opacity` a `transform` (posun do 24 px, ako káže ART_DIRECTION). Viditeľná zmena
  je minimálna a v súlade s dizajnovým manuálom.

### 3.4 Slučka skrolu: dobiehanie a premeriavanie (oba)

- `tick()` zmenšuje rozdiel `shownP → targetP` koeficientom 0,16 na snímku (`app.js:258–263` D1). Karty a zálohy
  sa preto oneskorujú za prstom. Pri iOS švihu (momentum) to pôsobí ako „gumené“, nie plynulé.
- `ResizeObserver(document.body)` a `resize` volajú `measure()` (`app.js:333–346`): 9× `getBoundingClientRect`
  kotiev, 8 sekcií, cenník a pätičku. Potom ide `snapNow(0)`. Na iOS sa pri skrývaní panela mení `innerHeight`
  a tým aj `resize`, takže uprostred skrolu príde vynútené rozloženie a skok stavu kariet. BALÍK aspoň počíta
  voľnú dĺžku zo stabilnej výšky rámu (`app.js:113–115` BALÍK).
- BALÍK pridáva pri každej udalosti `scroll` `clearTimeout` + `setTimeout` (`app.js:421–423`) a v každej snímke
  zápis `progress.style.transform` (`app.js:345`). Obe sú lacné.
- **Návrh:** na dotykovom zariadení dobiehanie vypnúť (`shownP = targetP`; skrol iOS je už plynulý) a ponechať ho
  len pre koliesko myši. Pri zmene samotnej výšky okna o menej ako 120 px (panel) nemerať.

### 3.5 Nekonečné animácie a masky (oba, nízka)

- Lesk tlačidla `.btn-primary::after` (`style.css:1195–1201`) beží aj v pevnom spodnom tlačidle (`index.html:877`),
  ktoré je stále na obrazovke. `box-shadow: 0 10px 28px` (`style.css:1174`). Počas skrolu stojí (`:1241`).
- Svetlo okraja: `conic-gradient` otáčaný v maske `mask-composite` (`style.css:1205–1227`). Pás služieb má masku
  a beží neustále (`:1230–1237`). Mimo okna sa vypínajú (`is-off`). Dopad je malý, treba len overiť, že maska
  neprekresľuje celú vrstvu v každej snímke.

### 3.6 Pevné vrstvy cez celú obrazovku (zoznam)

| Vrstva | Riadok | Kedy |
|---|---|---|
| `.film-canvas` (WebGL) | `style.css:413–419` | s filmom |
| `body::after` gradient | `style.css:1087–1093, 1159–1161` | s filmom |
| `.film-still` ×(až 4 v D1 / 3 v BALÍKU) | `style.css:1105–1115` | vždy (s filmom skryté, ale stiahnuté) |
| `.title-pin` sticky ×9 | `style.css:996–1008` | vždy |
| `.film-bars` (`inset: 0`, z 38) | `style.css:578–587` | prológ |
| `.site-header`, `.mobile-cta` | `style.css:283, 1168–1178` | vždy |

`backdrop-filter` na telefóne: v D1 je vypnutý všade (`style.css:269, 318, 549–550, 842, 956–958`).
`mix-blend-mode`, zrno ani svetlá cez celú obrazovku na telefóne nie sú. `.kurzor-svetlo` sa na dotyku
nevytvorí (`atmosfera.js:31`).

---

## 4. Videá (moja oblasť)

- Na telefóne je v D1 jediný `<video>` v HTML: „Tím v akcii“ (`index.html:309–312`, `preload="none"`,
  plagát až pri priblížení). Je skrytý (`style.css:1305`), takže sa nesťahuje ani nehrá.
- Riadenie (`app.js:631–674`): naraz hrá najviac jedno video, pozastaví sa mimo okna a na skrytej karte. To je v poriadku.
- BALÍK okno ukáže na telefóne, kým film nebeží (`style.css:1303` BALÍK). Vtedy sa stiahne
  `tim-v-akcii-576.mp4` (1 212 912 B) a hrá. Keď film naskočí, okno zmizne (`display: none`) uprostred sekcie a
  stránka poskočí (treba zmerať CLS).
- Filmové videá (`tim-slucka-864.mp4` 3 402 635 B a sekvencie `seq/vstup-dnu` 51 snímok, 2 037 306 B avif;
  `seq/okolo-kresla` 44 snímok, 1 605 961 B avif) vytvára a riadi `film.js:594–597` (`preload = 'auto'`).
  Patria inému tímu, ale sú najpravdepodobnejším zdrojom vety „videá sú zasekané“.
- Hudba (`atmosfera.js:150–168, 205–220`) sa pustí pri prvom ťuknutí. Stiahne 821 366 B (m4a) alebo
  687 080 B (webm) a dekóduje celé PCM. To je ďalšia záťaž pamäte a CPU práve pri prvom dotyku (treba zmerať).
  Ak má byť web „ľahký ako pierko“, majiteľ by mal rozhodnúť, či hudbu na telefóne púšťať až po ťuknutí na tlačidlo Hudba.

---

## 5. Obrázky: `sizes` voči skutočnej šírke

| Miesto | D1 | BALÍK | Skutočná potreba pri 430 CSS px, DPR 3 |
|---|---|---|---|
| Zálohy kariet (telefón) | `sizes="(max-width: 720px) 93vw"` → 1448 (`index.html:158` a ďalšie) | rovnako | s filmom (`style.css:480–490`) `--pw ≈ 1,24 · 1,04 · 932 · 0,5625 ≈ 677 CSS = 2031 px`; najväčšia je 1448, teda **0,71×** (mäkšie); bez filmu 430 × 932 cover, 1448/1290 = 1,12× (ok) |
| Poď ďalej (telefón) | snímka `seq/vstup-dnu/f025` 720 × 1280, `sizes="100vw"` (`index.html:212–213`) | `sala-m` 1086/1448 (`index.html:204–205` BALÍK) | 1290 px: D1 **0,56×** (rozmazané) |
| Galéria na šírku (karta 78 %, 4:5, cover) | `sizes="(max-width:900px) 50vw"` → 640 (`index.html:670–735`) | `146vw` → 1600 | 146vw = 628 CSS = 1883 px: D1 **0,34×**, BALÍK 0,85× |
| Galéria na výšku | 50vw → 640 | 78vw → 1080 | 78vw = 335 CSS = 1006 px: D1 0,64×, BALÍK ok |
| Portréty tímu (karta 64 %) | 50vw → 820 avif | rovnako | 275 CSS = 825 px, ok |

Cena BALÍKA: šesť fotiek galérie na šírku po 1600 × 1067 px (6,8 MB dekódovaných) a tri na výšku po
1080 × 1440 px (6,2 MB), spolu ≈ 60 MB. K tomu BALÍK `IntersectionObserver` s okrajom 100 % volá `img.decode()` na
**všetky** obrázky v `.band-team` aj `.band-gallery` (`app.js:246–255` BALÍK), čím sa pridá 10 portrétov po 2,3 MB.
Na iPhone so súbežnými textúrami filmu hrozí tlak na pamäť: Safari zahodí dekódované obrázky a pri návrate
ich kreslí znova postupne, čo vyzerá ako ďalšie „neúplné fotky“ (treba zmerať).
**Návrh:** galéria na telefóne do 1080 (pre 4:5 na šírku stačí výrez 4:5 z fotky namiesto 146vw krajiny,
nový stupeň `-m` napr. 1000 × 1250 px, 5 MB dekódovaných). Dekódovať vopred len najbližšie 2 karty pásu, nie celý pás.

Prvé načítanie (D1, gzip -9, `python3 -I`): index.html 14 358 B, style.css 18 999 B, app.js 14 939 B,
film.js 37 606 B, three.module.min.js 687 458 B (bez gzip), písma 3 × prednačítané (21–27 kB),
prvá záloha `rohozka-m-1448.avif` 438 359 B alebo `vstup-m-1448.avif` 327 096 B.
PNG portréty (10 758 054 B spolu) sa na iPhone nesťahujú (AVIF má prednosť).

---

## 6. Porovnanie D1 a BALÍKA (moja oblasť)

| Téma | D1 | BALÍK |
|---|---|---|
| Lišta na telefóne | 0,9 priehľadná (`:318`) | to isté + 2 px linka progresu |
| Fotka pod pätičkou | áno (`:345`) | áno (rovnaké pravidlá; pätička má `id="pata"`) |
| Okolie záloh | 4 (`app.js:222`) | 3 (`app.js:297`) |
| Náhľad pod zálohou | nie | áno (`style.css:1338–1345`, `nahlady.css`) |
| Prelínanie až po dekódovaní | nie | áno, s poistkou 600 ms (`app.js:216–233, 300–325`) |
| `will-change` na zálohách | všetky (`:460`) | len `is-near` (`:461`) |
| Blur nástupy textu | áno | áno |
| Galéria na telefóne | ostrosť 0,34× | ostrá, ale ≈ 60 MB + nútené `decode()` |
| Poď ďalej záloha | 720 px | 1448 px |
| Video tímu na telefóne | vypnuté | zapnuté bez filmu (skok pri štarte filmu) |
| Skok z menu | natívny smooth | okamžitý (`app.js:469–486`) |
| Karty v pokoji | — | dosadnú po 280 ms (`app.js:421–423`, `is-rest`) |

---

## 7. Treba zmerať (presné merania)

Spoločné nastavenie: Chromium (Playwright) s emuláciou **390 × 844 DPR 3** a **430 × 932 DPR 3**, dotyk,
`isMobile`, CPU **4×** a **6×** (`Emulation.setCPUThrottlingRate`), Fast 4G. Pre každý strom D1 a BALÍK dva
behy: `?film=off` (pokojná verzia) a predvolená adresa (film). Skrol cez `Input.synthesizeScrollGesture`
(švih 1 500 px/s, 12 švihov od úvodu po pätičku) a pomalý ťah (300 px/s). Trace s kategóriami
`devtools.timeline, disabled-by-default-devtools.timeline.frame, blink, cc, gpu, disabled-by-default-devtools.timeline.paint, devtools.timeline.picture`.

1. **Dlhé snímky:** počet snímok > 16,7 ms a > 33 ms, p95 času snímky. Rozpis na Style, Layout, Paint, Raster, Image Decode.
2. **Prekresľovanie titulných rámov:** udalosti `Paint` s plochou ≥ 50 % okna počas nábehu karty (D1 vs. D1 +
   `will-change` / krytie na `.title-card`).
3. **Dekódovanie:** udalosti `ImageDecodeTask` / `Decode Image` (trvanie, rozmer) pri výmene záberov a v páse galérie.
   Pri BALÍKU zvlášť špička po vstupe `.band-gallery` do okraja 100 %.
4. **Vrstvy a pamäť:** v DevTools Layers počet zložených vrstiev a ich pamäť pri kartách Čakáreň, Tím, Galéria a
   v pätičke. Na skutočnom iPhone Safari Web Inspector → Layers (počet a „Memory“) a Timelines → Memory (Images, Layers).
5. **Dvojité sťahovanie s filmom:** v sieťovom zázname počet požiadaviek `img/film/*-m-1086.*` a `*-m-1448.*`
   pre ten istý záber (HTML záloha vs. `fetch` filmu).
6. **Neúplné fotky:** Slow 4G, `?film=off`, video obrazovky (`Page.startScreencast`) pri prechode Remeslo → Čakáreň →
   Tím. Merať čas, kedy je okno tmavé alebo s polovičnou fotkou (jas pásu fotky < 90 % konečného).
7. **Pätička:** `document.scrollingElement.scrollHeight - (document.querySelector('.site-footer').getBoundingClientRect().bottom + scrollY)`
   (čaká sa 80), `getComputedStyle(document.body).paddingBottom`, `env(safe-area-inset-bottom)` cez testovací prvok.
   Na iPhone overiť odraz na konci (rubber band) pred a po návrhu.
8. **Či u majiteľa beží film:** na iPhone cez Web Inspector `document.documentElement.className` (`world`, `world-in`),
   `navigator.hardwareConcurrency`, `navigator.deviceMemory`.
9. **Lišta:** snímka 430 × 932 v pätičke a nad svetlým záberom (Remeslo) pred a po návrhu 2.1. Porovnať jas pásu pod lištou.
10. **Prvý dotyk s hudbou:** trace od `touchend` po 2 s (fetch + `decodeAudioData`, hlavné vlákno a pamäť).
11. **BALÍK, video tímu:** CLS pri prepnutí `world-in` v sekcii Tím (`PerformanceObserver` `layout-shift`).
12. **iOS panel:** počet volaní `measure()` počas 12 švihov (dočasné počítadlo v teste) a čas vynúteného rozloženia.

---

## 8. Navrhované poradie (moja oblasť)

1. Lišta: nepriehľadný ink + 20 px prechod (2.1). Pätička: `box-shadow` + rezerva v pätičke (2.2). Ide o malé
   zmeny, viditeľné na prvý pohľad, bez rizika.
2. Zálohy: pri filme `display: none`, okolie ±1, náhľady, prelínanie až po dekódovaní (D1 ← BALÍK 3.1).
3. Nástupy textu bez `filter: blur()` (3.3).
4. Krytie kariet na malom bloku s vlastnou vrstvou (3.2). Rozhodnúť po meraní 2 a 4.
5. Dotyk bez dobiehania, žiadne `measure()` pri paneli iOS (3.4).
6. Galéria: výrez 4:5 pre telefón, dekódovanie len najbližších kariet (5).
7. Hudba až po tlačidle (rozhodnutie majiteľa, 4).
