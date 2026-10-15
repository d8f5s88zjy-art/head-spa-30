# GYM KLUB: finálna špecifikácia redizajnu („Tichá sila“ + prevzaté nápady)

Verzia 1.0 · 14. 10. 2026 · hlavný dizajnér a technický vedúci
Repozitár: `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/lupa` (ďalej `lupa/`), východiskový commit `396f446`.
Pracovný priečinok redizajnu: `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/redesign/` (ďalej `redesign/`).

Tento dokument je jediný zdroj pravdy pre implementáciu. Kde sa líši od návrhov A, B, C alebo od auditov, platí tento dokument. Implementátor nemá ďalšie otázky riešiť sám. Ak niečo nejde podľa textu, postupuje podľa bodu „Ak to nejde“ pri danom pravidle. Ak pre daný prípad taký bod chýba, zvolí konzervatívnejšie riešenie, teda menej pohybu, menej zmien v CMS a zachovanie háku, a zapíše ho do `redesign/IMPLEMENTACIA-POZNAMKY.md`.

---

## 0. Rozhodnutie a jeho pôvod

**Víťazný smer:** návrh A, Editoriál „Tichá sila“ (porota 3 × 1. miesto: 8 / 8 / 7,5). Stránka je pokojný fotografický magazín v natívnom toku, bez pripínania a bez únosu skrolovania. Má jeden akcent (červenú z loga), dve písma a jeden pohybový jazyk.

**Prevzaté z ostatných návrhov a z verdiktov poroty:**

| Odkiaľ | Čo | Kde v tomto dokumente |
|---|---|---|
| C | druhý riadok H1 v značkovej červenej namiesto sivej | 2.1, 4.2 |
| C | existujúce 4 súbory písma (Oswald a Manrope, latin a latin-ext), 3 v preloade; žiadne nové podmnožiny | 2.3 |
| C | reverzné logo so zaokrúhlenými súradnicami (14,7 kB gzip) | 2.2, 7.6 |
| C | v cenníku sa spoločné tlačidlo vypíše len raz, štítok `.price-tag` je v toku | 4.10 |
| C | rozvrh so všetkými 7 dňami na každej šírke; na úzkom telefóne skrátené popisky | 4.9 |
| C | maska nadpisov s hornou rezervou .18em (mäkčene nad Č, Ť, Á) a test so vzorkou „ŠŤÁVA ČÍŽ“ | 5.3 |
| C | výber ohniska fotky v CMS (select) namiesto slovníka v kóde | 8.2 |
| C | `kedy_riadky`: čas lekcie na samostatných riadkoch | 4.7, 8.3 |
| B | poistka `GK.VERZIA !== 2` proti starej stránke z cache | 6.1, 8.3 |
| B | v lightboxe: popisok sa mení až po `img.decode()`; prechod do inej skupiny záberov ako „krok“ | 5.4 |
| B | stav „zatvorené“ sivou bodkou, nie červenou | 2.1 |
| B | Playwright skript `test_vzhlad.mjs` a pevné výkonnostné brány | 11 |
| B, C | presun napevno písaných viditeľných textov šablóny do CMS (kľúč `rozhranie`) | 8.2 |
| audit médií + porota | úvod na počítači zo záberu `funkcna-zona-4`, orez 16 : 9 od 28 % (bez nápisu susednej firmy); na telefóne `funkcna-zona-7` | 4.2, 7.2 |

**Zamietnuté (nerobiť):**

- 6 jednoobrazovkových „izieb“ a obsah, ktorý sa pripína alebo zaostáva podľa polohy skrolovania (B);
- text prelínaný podľa polohy skrolovania;
- exteriérové video IMG_8989 ako prvý priestor;
- zlučovanie miestností bez overenia („Sála pri oknách“);
- veľká migrácia CMS na `zony`;
- nová sada `-v-` pre celý katalóg;
- validácie, ktoré by zablokovali zverejnenie kvôli kontrastu fotky;
- lightbox so zdrojom z JSON;
- `content-visibility`;
- kostené plochy ako štvrtina stránky a modrá ako druhý akcent (C);
- klubová karta s logom v cenníku (C);
- snímky z tréningových videí ako fotky kariet (C);
- skrývanie buniek kolofónu na mobile (C);
- zoznam `hlavicka.menu` v CMS (C);
- zmena výstupu `nadpis()` (C);
- animovaný `clip-path` (C);
- `moreFold` v JS (C);
- nové podmnožiny písiem cez pyftsubset (A);
- sivý druhý riadok H1 (A);
- `body{overflow-wrap:anywhere}` (A);
- čiernobiele portréty trénerov ako predvolené (A, C);
- WebGL (všetci).

---

## 1. Pevné pravidlá (platia pre každý balík)

1. **Fakty a médiá.**
   - Žiadne vymyslené čísla, ocenenia, recenzie ani služby.
   - Nové texty vznikajú len preformulovaním existujúcich textov z `obsah/*.json`.
   - Používajú sa len skutočné fotky a videá fitka. Dovolené sú farby, jas, orez a zmenšenie. Retuš obsahu, AI zväčšovanie a AI zábery sú zakázané.
2. **Všetok viditeľný text ide z CMS.** Nové texty sa pridávajú do `obsah/*.json` a `.pages.yml` (pozri 8.2).
   - Výnimka, ktorá ostáva ako dnes: texty, ktoré generuje JS rozvrhu a skript `GK.paint` („Samostatný tréning“, „Otvorené do“ …). Neprepisovať ich, test `test_udaje_pre_skripty` ich čaká doslova.
   - Popisky `aria-label` neviditeľných ovládacích prvkov môžu ostať v šablóne.
3. **Živé funkcie musia fungovať** v každom balíku od B3: stav otvorenia, kolofón, živé štítky „Kde začať“, rozvrh, filter trénerov, lightbox, otázky, oznam, dok, kopírovanie adresy, mapa, videá.
4. **Pohyb:**
   - žiadny únos kolieska, žiadne pripnutie dlhšie ako vlastný obsah, žiadne video riadené skrolovaním;
   - `prefers-reduced-motion: reduce` znamená statickú stránku a okamžité skoky;
   - jediná nekonečná animácia je pulz stavovej bodky, ktorý beží len v obraze.
5. **Prístupnosť a slovenčina:**
   - klávesnica všade;
   - kontrast podľa 2.1;
   - dotykové ciele aspoň 44 px;
   - slovenčina so správnou diakritikou.
6. **Git:**
   - nikdy nepushovať;
   - lokálne commity len ak to zadanie implementácie výslovne dovolí: jeden commit na balík, na vetve `redizajn-2026-10`;
   - zmeny `.pages.yml` + `obsah/` + `nastroje/testdata/obsah/` + `zostav.py` + testy idú vždy v jednom commite.
7. **Server pre kontrolu:**
   - `python3 -m http.server <port> --directory <priečinok>`, port z rozsahu 8100–8999 okrem 8080 a 8437/8438;
   - nikdy so `cwd=_site`, lebo generátor priečinok nahrádza premenovaním;
   - **nikdy nespúšťať `playwright install`**.

### 1.1 Nedotknuteľné háky (musia ostať po každom balíku)

**Inline skripty:**

- skript v `<head>`: rozhodnutie `hx` / `hx-quick` / nič, poistka 3 s, `lite-root`, `in-hero`;
- inline skript `GK` **hneď za `section.hero`** (rozhranie `GK.HOURS`, `TIMETABLE`, `HOLIDAYS`, `DAYS`, `GYM`, `TAGS`, `CARD_TAGS`, `now`, `info`, `status`, `lesson`, `paint`, `start`, `last`, `heroDone`; udalosti `gk:tick`, `gk:hero-done`; `?gk-at=`);
- oznam: `.oznam[data-oznam][data-od][data-do][hidden]` a jeho inline skript **hneď za `div.oznam`**.

**Živé údaje:**

- `[data-open-status]` (aj `="short"`) vnútri `.status`, `.nav-status` alebo `.hero-live`;
- `[data-today-hours]`, `[data-today-label]`, `[data-today-k]`, `[data-today-line]`;
- `[data-live="c-open|c-boj|c-lekcie"]`;
- `[data-hours] tbody`;
- `:root.live-wait`.

**Interaktívne prvky:**

- rozvrh: `[data-timetable] > .tt-days[role=tablist] + .tt-list[role=tabpanel]`, do ktorého app.js vkladá `.tt-day[data-day]`, `#tt-tab-N`, `[data-filter-go]`, vždy cez `esc()`;
- filter trénerov: `#treneri .chip[data-tag]` (aj `all`), `aria-pressed`, `.coach[data-tags]`, `.coach-name`, `[data-coach-count]`;
- lightbox: `dialog#lightbox` s `.lb-close`, `.lb-prev`, `.lb-next`, `.lb-cap`, `.lb-count`; zdroje sú `figure.shot[data-full]` a `figure.gal-f[data-full]`;
- otázky: `details.q > summary + .a`.

**Kotvy a navigácia:**

- id: `#top`, `#main`, `#cesta`, `#preco`, `#priestor`, `#bar`, `#treningy`, `#mds`, `#treneri`, `#rozvrh`, `#cennik`, `#prva-navsteva`, `#recenzie`, `#faq`, `#kontakt`, `#lightbox`, `#h-*`;
- dok: `.dock`, `.dock-call[data-fact=phone-link]`, `.dock-cta` (app.js prepína `href` medzi `#prva-navsteva` a `#cennik`), `.dock.is-hidden`.

**Ostatné:**

- fakty: `data-fact=…` (všetky dnešné hodnoty), `[data-year]`; odkazy `href` fungujú aj bez JS;
- 2 bloky `<script type="application/ld+json">` a meta značky `<head>`;
- poistka proti starej stránke z cache v app.js (rozšírená, pozri 6.1).

---

## 2. Vizuálny systém

### 2.1 Farby (tokeny na `:root`, stránka je len tmavá, `color-scheme: dark`)

| Token | Hex | Použitie | Kontrast (na #0b0c0f / #121418 / #1a1d22) |
|---|---|---|---|
| `--bg` | #0b0c0f | pozadie stránky | – |
| `--bg-2` | #121418 | plochy: pás MDS, menu, dok, mapa, lightbox | – |
| `--bg-3` | #1a1d22 | hover riadkov, vybraný deň rozvrhu | – |
| `--ink` | #f4f2ec | hlavný text, nadpisy | 17,47 / 16,47 / 15,09 |
| `--ink-2` | #c9c7c0 | odseky, lead | 11,56 / 10,90 / 9,99 |
| `--ink-3` | #a6a49f | `em` v H2, štítky (kicker), poznámky, popisky | 7,85 / 7,40 / 6,79 |
| `--ink-4` | #8f8d88 | najslabší text (copyright), najmenej 13 px | 5,90 / 5,56 / 5,10 |
| `--line` | rgba(244,242,236,.12) | vlasové linky | – |
| `--line-2` | rgba(244,242,236,.24) | obrys vedľajšieho tlačidla, aktívne linky | – |
| `--red` | #e2412f | značka: logo, druhý riadok H1, `em` v slogane pätičky, linka pred štítkom, aktívna položka menu, vybraný deň, linka zvýraznenej permanentky | 4,69 / 4,42 / 4,05 (len veľký text ≥ 24 px alebo netextové prvky) |
| `--red-ink` | #ff5a43 | malý akcentový text na tmavom, obrys fokusu | 6,33 / 5,97 / 5,47 |
| `--red-btn` | #c8361f | plocha hlavného tlačidla; text na ňom `--ink` | 4,69 : 1 (text na ploche) |
| `--red-btn-h` | #b8301f | hover a stlačenie hlavného tlačidla | 5,39 : 1 |
| `--ok` | #6fcf97 | **výlučne** bodka „otvorené“ a „práve prebieha“ | 10,29 |
| `--off` | = `--ink-3` | bodka „zatvorené“ a „sviatok“ (obrysová bodka) | – |
| `--bone` | #f4f2ec | pozadie spodnej časti pätičky; text #0b0c0f (17,47), sekundárny #5c5a55 (6,15), odkazy #b52d1c (5,59) | – |

**Pravidlá:**

- Limetka #d4ff3f, #b8ea1e, všetky gradienty, `.g1`, `.g2`, `.grain`, radiálne žiary a „volt“ sa rušia.
- Modrá #2a4ea8 je **len** v plnofarebnom logu v pätičke.
- Červený text v nadpisoch je na celej stránke len na 2 miestach: druhý riadok H1 a `em` v slogane pätičky.
- `em` v H2 je tónové (`--ink-3`), nie farebné. Pole CMS `zvyraznene` ostáva.
- Bez `backdrop-filter` (lišta, menu, dok, lightbox majú plné farby; výkon na iOS).
- Text na fotke stojí vždy na prekrytí, pod ktorým je priemerný jas pozadia ≤ 0,14, aby text `--ink` mal ≥ 4,5 : 1 a H1/H2 ≥ 3 : 1. Overuje sa v 11.3.

### 2.2 Logo

- **Hlavička:** `assets/img/gymklub-logo-tmave.svg`, kópia `redesign/znacka/logo-reverz-0dp.svg`. Modrá a čierna sú prefarbené na #f4f2ec, červená činka #e2412f ostáva; 38 kB raw, 14,7 kB gzip.
  - Bez bielej kartičky: `.brand-card` sa ruší.
  - Výška 40 px (≥ 861 px), 32 px (≤ 860 px).
  - `alt` = `P.nazov_cely`.
  - Prefarbenie je otvorená otázka pre majiteľa (13). Návrat je jedna zmena `src` a CSS triedy `.brand--card` (biela kartička 32 px vysoká), ktorú pripraviť a nechať nepoužitú.
- **Pätička (kostená časť):** pôvodné plnofarebné `assets/img/gymklub-logo.svg`, šírka 140 px, `loading="lazy"`.
- **Ruší sa** podtitul `.brand-sub` (nález B1).
- **Logo MDS:** 56 px v bloku MDS, 24 px v riadku lekcie, 24 px odznak pri mene trénera, 40 px v pätičke (dnes 136 px).

### 2.3 Písma

**Súbory** (už existujú v `assets/fonts/`, nič nové nevyrábať):

| Súbor | Veľkosť | Preload |
|---|---|---|
| `Oswald-latin.woff2` | 21 kB, wght 400–700 | áno |
| `Oswald-latin-ext.woff2` | 19 kB | áno (Č, Ť v H1) |
| `Manrope-latin.woff2` | 25 kB, wght 200–800 | áno |
| `Manrope-latin-ext.woff2` | 15 kB | nie (načíta sa podľa `unicode-range`, `font-display: swap`) |

**`assets/fonts.css`:**

- Obsahuje len 4 `@font-face` (dnešné pravidlá pre Oswald a Manrope s rovnakým `unicode-range`) a 2 záložné tváre s upravenými metrikami:
  - `@font-face{font-family:"Oswald F";src:local("Arial Narrow"),local("Arial");size-adjust:…;ascent-override:…;descent-override:…;line-gap-override:0%}`,
  - rovnako `"Manrope F"` z `local("Arial")`.
- Hodnoty vypočítať skriptom `nastroje/media/metriky_pisma.py` (fontTools, spustiť ručne):
  - `ascent-override = hhea.ascent / unitsPerEm`, `descent-override = |hhea.descent| / unitsPerEm`;
  - `size-adjust = priemerná šírka znakov „abcdefghijklmnopqrstuvwxyzáčďéíľňóôŕšťúýž 0123456789“ v cieľovom písme / v Arial`;
  - výsledok vpísať do `fonts.css` ako čísla.
- Rodiny: `--font-h: "Oswald","Oswald F",sans-serif`; `--font-t: "Manrope","Manrope F",system-ui,sans-serif`.

**Zmazať:**

- `Archivo-*`, `BebasNeue-*`, `Fraunces-*`, `JetBrainsMono-*` a ich `@font-face`;
- vloženú podmnožinu „GK Hero“ (`style.css:904–911`), čím zmizne chyba s chýbajúcou číslicou 7.

**Skript otvorenia v šablóne:** `d.fonts.load('600 100px "GK Hero"', {{ h1_vzorka }})` sa mení na `d.fonts.load('600 100px Oswald', {{ h1_vzorka }})`. Logika „text sa spustí po písme, najneskôr o 300 ms“ ostáva **presne** ako dnes (`sablona/index.html:311–330`; obe stopy otvorenia sú nezávislé a text nečaká na fotku).

### 2.4 Typografická stupnica

| Rola | Písmo a rez | Veľkosť | Riadkovanie a úprava |
|---|---|---|---|
| H1 `.hero-h` | Oswald 600, verzálky | `clamp(3.25rem, 1.6rem + 6.6vw, 8.25rem)` | lh .92, ls −.005em; riadok 1 `--ink`, riadok 2 (`em`, `font-style:normal`) `--red` |
| H2 `.h2` | Oswald 500, verzálky | `clamp(2.25rem, 1.5rem + 3.2vw, 4.25rem)` | lh 1.0, `text-wrap: balance`; `em` (`display:block` až od 760 px, inak inline) `--ink-3` |
| H3 `.h3`, `.mds-h`, `.lessons-h` | Oswald 500, verzálky | `clamp(1.5rem, 1.1rem + 1.4vw, 2.25rem)` | lh 1.05 |
| Titulok záberu `.shot-t`, `.cesta-t`, `h4` | Oswald 500, verzálky | `clamp(1.375rem, 1.1rem + .9vw, 1.875rem)` | lh 1.1 |
| Meno trénera `.coach-name` | Oswald 500, verzálky | 1.375rem | lh 1.1 |
| Cena `.price-n` | Oswald 500 | `clamp(3rem, 2rem + 3vw, 4.5rem)` | lh .95, `font-variant-numeric: tabular-nums` |
| Lead `.lead`, `.hero-p` | Manrope 400 | `clamp(1.125rem, 1rem + .4vw, 1.3125rem)` | lh 1.55, max 52ch, `--ink-2` |
| Telo | Manrope 400 | 1rem (≤ 760 px), 1.0625rem (inak) | lh 1.6, max 64ch, `--ink-2` |
| Štítok `.kicker` | Manrope 600, verzálky | .8125rem (13 px) | ls .12em, `--ink-3`; `::before` linka 24 × 1 px `--red`, medzera 12 px |
| Údaje (hodiny, časy, kolofón `dd`) | Manrope 500 | 1rem až 1.1875rem | `tabular-nums` |
| `dt` kolofónu, štítky tabuliek | Manrope 600, verzálky | .8125rem | ls .1em, `--ink-3` |
| Popisky, poznámky | Manrope 500 | .875rem (14 px) | `--ink-3` |
| Tlačidlá | Manrope 700 | .9375rem (15 px) | bez verzálok, ls .01em |

**Pravidlá:**

- Žiadny text pod 13 px. Rozpal najviac .12em. Žiadne mono písmo.
- `font-synthesis: none` na nadpisoch.
- Zalomenie slov (oprava I2):
  ```css
  body{overflow-wrap:break-word}            /* nemení min-content; dlhé URL v texte nepretečú */
  h1,h2,h3,h4,.shot-t,.cesta-t,.coach-name,.price-name,.price-n{overflow-wrap:normal;word-break:normal;hyphens:manual}
  p,li,dd{text-wrap:pretty}
  ```
- Veľkosti nadpisov sú zvolené tak, aby sa najdlhšie slovo zmestilo do svojho stĺpca. Overuje to test rozdelených slov v 11.3.

### 2.5 Mriežka, rytmus, tvary

```css
:root{
  --wrap:1320px; --gut:clamp(16px,4vw,48px); --gap:clamp(16px,2.2vw,32px);
  --sec:clamp(72px,9vw,136px);           /* zvislé odsadenie sekcie */
  --head-gap:clamp(32px,4vw,56px);       /* hlavička sekcie → obsah */
  --plate-gap:clamp(56px,7vw,112px);     /* medzi plochami eseje */
  --bar-h:72px;                          /* ≤860 px: 60px */
  --r-img:4px; --r-ui:8px; --r-sheet:clamp(20px,2.2vw,28px); --r-pill:999px;
  --z-bar:50; --z-dock:40; --z-menu:60;
}
```

- **Body zlomu:** 360 (minimum), 560, 760, 860 (lišta, dok, `lite-root` ako dnes), 1024, 1280.
- **Stĺpce:** ≥ 1024 px má 12 stĺpcov, 760–1023 px má 8 stĺpcov, < 760 px má 4 stĺpce. Medzera je `--gap`. `.wrap{max-width:var(--wrap);margin-inline:auto;padding-inline:var(--gut)}`.
- **Tvary:**
  - fotky v mriežke `--r-img`, fotky cez celú šírku 0;
  - tlačidlá `--r-pill`;
  - zoznamy a tabuľky bez zaoblenia, len vlasové linky;
  - **žiadne tiene okrem listu Intro** (`0 -24px 48px rgba(0,0,0,.35)`);
  - žiadne karty s podkladom okrem pásu MDS a mapy.
- **Ďalšie pravidlá:**
  - `html{scroll-padding-top:calc(var(--bar-h) + var(--oznam-h,0px) + 8px)}`;
  - pri `html.has-oznam` sa výška oznamu pripočíta.

### 2.6 Komponenty

**Tlačidlá:**

- **`.btn`** (spoločné): `inline-flex; align-items:center; gap:10px; min-height:52px; padding:0 26px; border-radius:var(--r-pill)`, písmo podľa 2.4. `transition: background-color var(--dur-2) var(--ease-ui), border-color var(--dur-2) var(--ease-ui), color var(--dur-2) var(--ease-ui)`.
- **Varianty:**
  - `.btn-p` (hlavné): `--red-btn`, text `--ink`; hover `--red-btn-h`.
  - `.btn-g` (vedľajšie): priehľadné, `1px solid var(--line-2)`; hover obrys `--ink`.
  - `.btn-lg`: 56 px. `.btn-sm`: 44 px, `padding:0 18px`.
  - Na kostenom podklade `.btn-g` dostane obrys `rgba(11,12,15,.3)` a text #0b0c0f.
- **Šípka** `.btn-arrow::after` (→ cez SVG masku 16 px): hover `translate: 3px 0` (`--dur-2`).
- **Stlačenie:** `scale:.98` (`--dur-1`).
- **Premenovanie:** triedy `.btn-volt` → `.btn-p`, `.btn-ghost` → `.btn-g` v šablóne, makrách aj app.js (grep `btn-volt|btn-ghost` musí vrátiť 0).
- **Zrušené efekty:** odlesk `gkShine`, pulzujúce šípky, zdvih o 2 px.
- **Pravidlo:** najviac jedno `.btn-p` v jednom okne (okrem hlavičky).

**Ďalšie prvky:**

- **`.tlink`** (textový odkaz): Manrope 600 15 px, podčiarknutie 1 px cez `text-decoration-thickness:1px; text-underline-offset:5px`; hover farba `--red-ink` a šípka `translate:3px 0`. Samostatný odkaz má `padding-block:12px`, aby cieľ mal ≥ 44 px.
- **`.ph`** (rám fotky): `position:relative; overflow:clip; border-radius:var(--r-img); background:var(--bg-2)`. Vnútri je `<picture>` a `<img width height loading decoding>` s `object-fit:cover; object-position:var(--fx,50%) var(--fy,50%)`.
- **`.ph-btn`:** skutočné `<button type="button" class="ph-btn" aria-haspopup="dialog">` okolo `<picture>`. Prístupný názov dáva `alt` obrázka, `aria-label` sa nepridáva.
- **`.dot`:**
  - 8 px kruh;
  - farba `--ok` pri `.is-open` na obale, inak obrysová `--off`;
  - pulz: `.is-open .dot.is-vis::after`, `scale` 1 → 2.4 a `opacity` .5 → 0, 2,4 s, `--ease-out`, `infinite`;
  - triedu `.is-vis` dáva IO;
  - pri obmedzenom pohybe bez pulzu;
  - pulzujú najviac 2 bodky (úvod a hlavička).
- **Fokus:** `:focus-visible{outline:2px solid var(--red-ink);outline-offset:3px;border-radius:inherit}`. Na kostenom podklade má obrys farbu #0b0c0f.

### 2.7 Štyri typy rozložení (namiesto 11 rovnakých mriežok kariet)

- **T2 Delenie 7 : 5:** `header.sec-head{display:grid;grid-template-columns:7fr 5fr;column-gap:var(--gap);align-items:end}`.
  - Vľavo `p.kicker` + `h2` (max 14ch), vpravo `p.lead` zarovnaný na spodok H2.
  - Pod 760 px pod sebou. Medzera ku obsahu `--head-gap`.
  - Platí pre: Prečo, Priestor, Tréningy, Tréneri, Rozvrh, Cenník, Recenzie, Kontakt (Kontakt má vlastné 6 : 6, pozri 4.13).
- **T3 Bočná lepiaca hlavička:** Otázky. Nadpis vľavo (5 stĺpcov) `position:sticky; top:calc(var(--bar-h) + 32px)`, obsah vpravo (7 stĺpcov).
- **T4 Text na fotke:** úvod, medzihra Funkčná zóna, (pätička bez fotky, ale s rovnakou kompozíciou).
- **Esej:** tri plochy, pozri 4.5.

Čísla kapitol (`<span class="ch">`) sa vypúšťajú zo všetkých štítkov.

---

## 3. Štruktúra stránky

### 3.1 Poradie DOM

```
a.skip (text z CMS rozhranie.preskocit)
svg sprite (ikony: i-phone, i-pin, i-arrow, i-play, i-chevron, i-plus; zrušiť i-kettle, i-plate, i-glove, i-snow, i-tag ak sa nepoužijú)
header.bar#top
  .wrap.bar-in: a.brand > img(logo tmavé) · nav#nav · .bar-cta(.status · a.btn · button.burger)
  div.oznam + <script> (len ak je oznam)
  div.progress > span.progress-bar
main#main
  div.hero-pin
    section.hero[aria-labelledby=h-hero]
    <script> GK … </script>                      ← hneď za úvodom
    div.intro (list, ktorý prekryje úvod)
      section.why#preco[aria-labelledby=h-preco]
      section.cesta#cesta[aria-labelledby=h-cesta]
  section.space#priestor[aria-labelledby=h-priestor]
    div.opener[role=group][aria-labelledby=h-band]  (h2#h-band)
    .wrap > header.sec-head (h2#h-priestor)
    div.essay
    div.more (Detaily: h3 + .mosaic.strip)
    .wrap > div.bar-blok#bar (h3 + .mosaic)
  section.trainings#treningy
    header.sec-head · div.duo · div.lessons · section.mds#mds
  section.team#treneri
  section.timetable#rozvrh
  section.prices#cennik (… div.steps#prva-navsteva)
  section.reviews#recenzie
  section.faq#faq
  section.contact#kontakt
footer.foot (div.foot-cta + div.foot-in[kostená])
div.dock
a.totop
dialog#lightbox
<script src="assets/app.js?v=…" defer>
```

**Ruší sa:**

- `.ticker`, 3 × `.bridge`, `section.band`, `.reel` (vrátane `.reel-stage`, `.reel-hud`), 2 × `.pole-rule`, `.cut`;
- `<noscript>` so štýlom filmu, `<script src="assets/depth.js">`;
- všetky `data-tilt`, `data-par`, `data-depth-*`, `data-src-w/t`, `glowcard`, `.cesta-n`, `.shot-n`, `span.ch`.

`test_prehliadac` nájde 9 sekcií (cesta, preco, priestor, treningy, treneri, rozvrh, cennik, faq, kontakt).

### 3.2 Rozpočet dĺžky (akceptačné kritérium, meria sa v 11.3)

| Blok | 1440 × 900 (obrazovky) | 390 × 844 (obrazovky) |
|---|---|---|
| Úvod | 1,0 | 1,0 |
| Intro (Prečo + Kde začať) | 1,5 | 2,0 |
| Priestor (medzihra, hlavička, esej, Detaily, Bar) | 6,0 | 6,3 |
| Tréningy (duo, lekcie, MDS) | 2,8 | 3,6 |
| Tréneri | 1,5 | 1,6 |
| Rozvrh | 1,0 | 1,3 |
| Cenník + prvá návšteva | 1,4 | 2,2 |
| Recenzie | 0,6 | 1,0 |
| Otázky | 0,8 | 1,2 |
| Kontakt | 0,9 | 1,5 |
| Pätička | 0,7 | 1,0 |
| **Spolu (limit)** | **≤ 18,5** (dnes 27,3) | **≤ 23** (dnes 35,5) |

**Ak sa limit prekročí, skracuje sa v tomto poradí:**

1. Odsadenie sekcií `--sec` na `clamp(64px,8vw,112px)`.
2. Fotky dua v Tréningoch z 3 : 2 na 16 : 9.
3. Esej z 5 na 4 zábery: vypustiť položku 4, `hlavna-sala-4` ide do Detailov. Vyžaduje zmenu obsahu v `obsah/` aj `testdata`.

---

## 4. Sekcia po sekcii

Zápis `TX` = `obsah/texty.json`, `PR` = `obsah/priestor.json`, `CN` = `obsah/cennik.json`, `R` = `TX.rozhranie` (nový kľúč, 8.2), `P` = `prevadzka.json`, `K` = kontakty z generátora.

### 4.1 Hlavička `header.bar#top`

**Obsah lišty:**

- **Logo** podľa 2.2.
- **Menu `#nav`:** 7 odkazov s textom z CMS (`nadpis_maly`, ktoré už existujú):

  | Text | Cieľ |
  |---|---|
  | `TX.priestor.nadpis_maly` | `#priestor` |
  | `TX.treningy.nadpis_maly` | `#treningy` |
  | `TX.treneri.nadpis_maly` | `#treneri` |
  | `TX.rozvrh.nadpis_maly` | `#rozvrh` |
  | `TX.cennik.nadpis_maly` | `#cennik` |
  | `TX.otazky.nadpis_maly` | `#faq` |
  | `TX.kontakt.nadpis_maly` | `#kontakt` |

  „Bar“ v hlavnom menu nie je (je v pätičke). Otázky pribúdajú.
- **`.nav-status`** (dnešné značkovanie) a `.nav-phone` ostávajú; zobrazujú sa len v mobilnom menu.
- **`.bar-cta`:**
  - `span.status > span.dot + span[data-open-status=short]`;
  - `a.btn.btn-sm` s `TX.hlavicka.tlacidlo` (text a odkaz z CMS);
  - `button.burger` (≤ 860 px).
  - Kým je `html.in-hero`, tlačidlo má vzhľad `.btn-g`, inak `.btn-p`. Trieda je na tlačidle stále `btn btn-sm btn-cta`; vzhľad určuje CSS podľa `html.in-hero`.

**Vzhľad a správanie lišty:**

- **Pozadie:** v `html.in-hero` gradient `linear-gradient(180deg,rgba(11,12,15,.55),rgba(11,12,15,0))`; inak plné rgba(11,12,15,.96) a dole `1px solid var(--line)`. Prelnutie cez `opacity` pseudoprvku `::before` (`--dur-2`).
- **Typografia menu:**
  - Manrope 500 15 px, medzera 28 px.
  - Aktívna položka má `aria-current="true"` a pod textom linku 2 px `--red` (`scale: 0 1` → `1 1`, `--dur-2`).
  - Hover: farba `--ink`, inak `--ink-2`.
- **Skrývanie:** po prvej obrazovke pri posune nadol o > 6 px sa lišta skryje (`translate: 0 -100%`, `--dur-3`, `--ease-io`). Pri posune nahor sa ukáže. Pri otvorenom menu sa neskrýva.
- **Prúžok postupu `.progress-bar`:** 2 px `--red`, `transform-origin:0 50%`. Hýbe sa **len** cez `@supports (animation-timeline: scroll())` a `prefers-reduced-motion: no-preference` (`@keyframes prog{from{scale:0 1}to{scale:1 1}}`, `animation-timeline:scroll(root)`). Bez podpory `display:none`. JS už nezapisuje `--sp`.

**Mobilné menu (≤ 860 px), `#nav.is-open`:**

- panel na celú obrazovku `position:fixed; inset:0; background:var(--bg-2); padding: calc(var(--bar-h) + 24px) var(--gut) 32px`;
- odkazy Oswald 500 1.875rem verzálkami, riadky 56 px, oddelené `--line`;
- pod nimi `.nav-status`, `.nav-phone` (44 px) a `a.btn.btn-p` (CTA z hlavičky);
- `html.nav-open{overflow:hidden}`;
- Esc zatvorí a fokus sa vráti na burger;
- prechod podľa 5.4;
- lišta nad panelom ostáva viditeľná, burger sa mení na ×.

**Oznam:** značkovanie bez zmeny. Štítok „Oznam“ z `R.oznam`. Vzhľad: pás `--bg-3`, štítok `.kicker`, text 15 px `--ink`, odkaz `.tlink`.

**Ruší sa:** `.brand-sub`, `.brand-card`, `chapterLine`, kapitola v podtitule.

### 4.2 Úvod `section.hero` (T4)

**Rozmery:** `min-height: max(600px, 100svh)` a pri výške okna nad 1100 px `min-height:1100px`. Obsah je dole (`display:grid; align-content:end`). Ak sa nezmestí (360 × 640), úvod sa natiahne.

**Fotka:**

- **Počítač** (`media="(min-width: 861px)"`): `TX.uvod.foto`, sada `w` (16 : 9). Predvolene `funkcna-zona-4`, nový orez od 28 % (7.2).
- **Telefón** (`media="(max-width: 860px)"`): `TX.uvod.foto_telefon`, sada `t` (4 : 5), ak je vyplnené, inak sada `t` fotky `uvod.foto`. Predvolene `funkcna-zona-7`, orez 4 : 5 zhora.
- **Ohnisko:** `style="--fx-w:…;--fy-w:…;--fx-t:…;--fy-t:…"` na `section.hero` z `uvod.ohnisko_pocitac` a `uvod.ohnisko_telefon` (8.2). `img{object-position:var(--fx-w) var(--fy-w)}`, pod 861 px `var(--fx-t) var(--fy-t)`.
- **Zväčšenie:** `.hero-cam{position:absolute;inset:0}`. Ruší sa `top:-30%; height:130%` (dnes zväčšenie 1,74×).
- **Značkovanie:**
  - `<picture class="hero-cam">` obsahuje zdroje `t` (avif, webp, jpg, `media=(max-width:860px)`, `sizes="(orientation: portrait) 80svh, 100vw"`) a zdroje `w` (avif, webp, `sizes="100vw"`);
  - `<img class="hero-img" fetchpriority="high" src="…w-1920.jpg" srcset="…" sizes="100vw" width height alt="" decoding="async">`;
  - **bez** `data-src-*` a `data-depth-*`.
- **Preload** v `<head>` ostáva (2 riadky dnes), len `hero.t` sa berie z fotky pre telefón.
- **LQIP:** vždy generovaný v `<head>` (`<style>:root{--lqip-w:url(…);--lqip-t:url(…)}</style>`) z dvoch použitých sád. Je pozadím `.hero-cam`. Zrušiť napevno zapísané `--lqip-*` v CSS a `LQIP_V_CSS` v `fotky.py`.

**Vrstvy nad fotkou:**

- `.hero-shade` na počítači:
  ```css
  linear-gradient(90deg, rgba(11,12,15,.86) 0, rgba(11,12,15,.55) 38%, rgba(11,12,15,.12) 70%, rgba(11,12,15,0) 100%),
  linear-gradient(0deg, rgba(11,12,15,.92) 0, rgba(11,12,15,0) 46%),
  linear-gradient(180deg, rgba(11,12,15,.55) 0, rgba(11,12,15,0) 22%)
  ```
- `.hero-shade` na telefóne:
  ```css
  linear-gradient(0deg, rgba(11,12,15,.95) 0, rgba(11,12,15,.78) 42%, rgba(11,12,15,.25) 72%, rgba(11,12,15,.45) 100%)
  ```
- `.hero-expo` (závoj .5 → 0 pri `hx-lit`) a `.hero-dim` (odchod) ostávajú.

**Obsah `.wrap.hero-in`** (vľavo dole, max 8 stĺpcov):

1. `p.hero-live`: bodka, `[data-open-status]`, oddeľovač a `a.hero-addr` (adresa).
   - Adresa sa ukáže od 561 px. Pod 561 px je na vlastnom riadku a odkaz má `min-height:44px; display:inline-flex; align-items:center`.
2. `h1#h-hero.hero-h`: **doslovné značkovanie ostáva** `<span class="line"><span>{{ t(TX.uvod.nadpis_riadok_1) }}</span></span><span class="line"><span><em>{{ t(TX.uvod.nadpis_riadok_2) }}</em></span></span>`.
   - Druhý riadok je `--red`, bez gradientu a bez `gkSheen`.
   - `.line{display:block;overflow:clip;padding-block:.2em .06em;margin-block:-.2em -.06em}`.
   - `heroFit()` ostáva (poistka proti prekrytiu lištou).
3. `p.hero-p`: `tb(TX.uvod.odsek)`, max 44ch.
4. `.hero-cta`:
   - `a.btn.btn-p.btn-lg.btn-arrow` s `TX.uvod.tlacidlo`;
   - `a.tlink.hero-link` s `P.adresa.navigovat_na` (`data-fact=map-link`, nové okno).

**Kolofón `.wrap.hero-colo`:**

- **Značkovanie ostáva doslova** (`<dl>`, `class="colo-4"`, `colo-live`, `colo-c4`, `<dt>`, `data-today-*`; test `test_ina_sobota_kolofon_tri_skupiny`).
- Vzhľad:
  - horná vlasová linka `--line`;
  - mriežka 4 stĺpce (≥ 1024 px), 2 stĺpce (inak);
  - `dt` podľa 2.4, `dd` Manrope 500 1.0625rem `tabular-nums` `--ink`;
  - odkaz `colo-live` je `.tlink`.
- Fraunces je preč (C2).
- Na telefóne sa zobrazujú **všetky** bunky (2 × 2).

**Texty:** H1 sa nemení (rozhodne majiteľ, pozri 13). Cena ostáva v H1, kým majiteľ nerozhodne inak.

**Telefón a tablet na výšku** *(zmenené v Opravách pred B4 a po ich kontrole, podrobnosti v `IMPLEMENTACIA-POZNAMKY.md`; platí namiesto „Telefón“ v časti Fotka a „`.hero-shade` na telefóne“ vyššie)*:

- fotka sady `t` (4 : 5) je celá hore pod lištou, pri oznamu pod oznamom (`top: var(--oznam-h)`), nie cez celý úvod; `funkcna-zona-4` má na to vlastný orez `t` (7.2);
- obsah je dole a úvod má presne 100svh, kým sa obsah zmestí; kolofón končí nad dokom;
- clona je `.hero-in::before` viazaná na začiatok textu (od 56 px nad ním po plné `--bg`), `.hero-shade` len tlmí pás pod lištou a spodok fotky;
- pri výške okna ≤ 780 px a pri zobrazenom oznamu (do výšky 960 px) sa úvod natiahne tak, že text končí 8 px nad dokom a celý kolofón začína pod ním; `heroFit` úvod prilepí so záporným `top`;
- bez JS (`@media (scripting:none)`) sa úvod nelepí;
- *Výrez na telefóne* sa na výšku pri fotke 4 : 5 neuplatní (fotka je celá od horného okraja); platí na šírku a pri fotke na šírku.

### 4.3 Intro: `div.intro` so `section.why#preco` a `section.cesta#cesta`

**List cez úvod:**

- `div.intro{position:relative;z-index:2;background:var(--bg);border-radius:var(--r-sheet) var(--r-sheet) 0 0;margin-top:calc(var(--r-sheet) * -1);box-shadow:0 -24px 48px rgba(0,0,0,.35);padding-block:var(--sec)}`.
- `.hero-pin` a `position:sticky; top:0` úvodu ostávajú (dnešný mechanizmus „list“).
- `min-height:100svh` z dnešného `.cesta` (`style.css:1052`) sa ruší.

**A. Prečo `section.why#preco`:**

- `header.sec-head` typu T2:
  - `p.kicker` (`TX.preco.nadpis_maly`);
  - `h2#h-preco.h2` (`nadpis(TX.preco.nadpis)`);
  - `p.lead` (`tb(TX.preco.uvod)`).
- `ul.why-list` (mriežka 3 stĺpce ≥ 760 px, inak pod sebou). Položka `li.why-item.rv` (`--i` 0..2) obsahuje:
  - `h3.why-h` (Manrope 600 1.125rem `--ink`);
  - `p` (`tb(text)`, 1rem `--ink-2`);
  - hornú linku `1px --line` a `padding-top:20px`.
- **Bez fotiek.** Polia `preco.karty[].foto`, `.nova_foto`, `.popis_fotky` sa z CMS odstraňujú (8.2).

**B. Kde začať `section.cesta#cesta`** (odsadenie od A `clamp(56px,7vw,96px)`):

- **Hlavička:**
  - `p.kicker` (`TX.cesta.nadpis_maly`);
  - `h2#h-cesta.h3` (vzhľad H3), obsah `nadpis(TX.cesta.nadpis)`;
  - `p.cesta-lead` (`t(TX.cesta.uvod)`).
- **Rozloženie** ≥ 1024 px a `(pointer:fine)`: mriežka 12 stĺpcov. Zoznam v stĺpcoch 1–7, náhľad `.cesta-pv` v stĺpcoch 9–12 (`position:sticky; top:calc(var(--bar-h) + 24px)`, pomer 3 : 4, `.ph`). Inak zoznam na celú šírku a bez náhľadu.
- **Zoznam** `nav[aria-labelledby=h-cesta] > ol.cesta-list > li.rv > a.cesta-card`:
  - `min-height:88px`, mriežka `[názov | štítok] / [popis | šípka]`, dolná linka `--line`, `padding-block:20px`.
  - Obsahuje `span.cesta-t` (vzhľad 2.4), `span.cesta-m` (`data-live` ak je; Manrope 600 13 px verzálkami `--ink-3`), `span.cesta-d` (15 px `--ink-2`) a `span.cesta-go[aria-hidden]` (→).
  - **Doslovný kúsok ostáva:** `<span class="cesta-m">…</span>`, `data-live="c-open|c-boj|c-lekcie"`.
  - Pri živom štítku sa pred text vloží `span.dot` cez CSS `::before` (zelená pri `.is-now`).
  - `.cesta-n` sa ruší.
- **Náhľad `.cesta-pv[aria-hidden=true]`:** 4 vrstvy `<picture class="cesta-pic" data-i="N">`, každá:
  ```html
  <picture class="cesta-pic" data-i="0">
    <source media="(min-width:1024px) and (pointer:fine)" type="image/avif" srcset="…640 640w, …1080 1080w" sizes="min(30vw,420px)">
    <source media="(min-width:1024px) and (pointer:fine)" type="image/webp" srcset="…">
    <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" alt="" width="1080" height="1350" loading="lazy" decoding="async">
  </picture>
  ```
  Telefón tak nič nesťahuje.
  - Aktívna vrstva má `opacity:1`, zmena pri hover/fokuse riadku (5.4). Predvolene je aktívna prvá.
  - Pole `cesta.karty[].foto` a `nova_foto` ostávajú a v CMS dostanú popis „Ukáže sa len na počítači pri prechode myšou“.
- **`p.cesta-foot`:** `TX.cesta.pata` ako tichý riadok faktov oddelených „·“ (14 px `--ink-3`).

**Odporúčané fotky kariet (obsah):**

| Karta | Fotka | Zmena |
|---|---|---|
| Začínam | `stroje-1` | ponechať |
| Sila a postava | `funkcna-zona-7` | namiesto mäkkej `u-0e350667` |
| Bojové športy | `mma-1-32` | namiesto `mma-2-card`, 640 px, lap 842 |
| Skupinové lekcie | `tatami-3` | ponechať do dofotenia |

*(Zmenené po kontrole B0+B1: karta „Sila a postava“ má `volne-vahy-2`, nie `funkcna-zona-7` – ten má v okne nápis susednej firmy. Rovnaká fotka je v eseji na ploche 2.)*

**Štítok karty 2:** `{pocet_zaberov_cislom} priestoru` → „Bez čakania na stojan“ (text existuje v CMS pri zábere voľných váh).

**Ruší sa:** bežiaci pás `.ticker` a makro `ticker`, `why-card`, `glowcard`, `data-tilt`.

### 4.4 Medzihra Funkčná zóna `div.opener` (začiatok `#priestor`, T4)

- **Rozmery:** cez celú šírku stránky (mimo `.wrap`). Výška `min(100svh, 60vw)`, najmenej 520 px. Na telefóne 88svh, najmenej 520 px.
- **Fotka:** `TX.funkcna_zona.foto` (komponent `foto_siroka`), predvolene `funkcna-zona-5`. Je na nej rig, kettlebelly a vzduchový bicykel, čo zodpovedá textu (oprava H1).
  - *(Zmenené v Opravách pred B4: predvolene `u-38047dcd` – rig Life Fitness pod šesťuholníkovým LED stropom, kettlebelly, laná a dráha, bez ľudí a cudzích nápisov; `funkcna-zona-5` má v okne plagáty susednej predajne. Vzduchový bicykel na zábere nie je, text medzihry sa nemenil – otvorené rozhodnutie majiteľa 13.5. `popis_fotky` ostáva dnešný.)*
  - Sada `w` od 861 px, sada `t` pod 861 px. `alt` = `TX.funkcna_zona.popis_fotky`.
  - Ohnisko z `TX.funkcna_zona.ohnisko`.
  - Obal `.par` (parallax, 5.3) je o `2 × --par` vyšší a posunutý o `-var(--par)`.
- **Prekrytie:** `linear-gradient(0deg, rgba(11,12,15,.9) 0, rgba(11,12,15,.35) 45%, rgba(11,12,15,0) 70%)` + `linear-gradient(90deg, rgba(11,12,15,.6) 0, rgba(11,12,15,0) 55%)`.
- **Text** (vľavo dole, `.wrap`, max 7 stĺpcov):
  - `p.kicker` (`TX.funkcna_zona.nadpis_maly`);
  - `h2#h-band.h2` (`nadpis(TX.funkcna_zona.nadpis)`);
  - `p.lead` (`tb(TX.funkcna_zona.text)`).
- **Bez** pripínania, roztiahnutia z rámu, `clip-path`, JS aj WebGL.

### 4.5 Priestor: hlavička a esej

**Hlavička** (`.wrap`, T2, odsadenie od medzihry `--sec`):

- `p.kicker` (`TX.priestor.nadpis_maly`);
- `h2#h-priestor.h2` (`nadpis(TX.priestor.nadpis)`);
- `p.lead` (`tb(TX.priestor.uvod)`).
- **Nový text v obsahu** (rovnaký v `obsah/` aj `testdata/`): `priestor.uvod` = „Pozrite si klub ešte pred prvou návštevou. Nech viete, kam ísť a čo si vziať.“ Pôvodné „Od vchodu po terasu … v poradí“ už neplatí.

**Esej `div.essay`** (zoznam `PR.film`, odporúčaných 4–7 položiek):

- Generátor zoskupí položky do plôch funkciou `dosky()` (8.3). Cyklus je [široká, rozložená, dvojica]. Široká plocha len pri fotke so sadou `w`, inak rozložená. Strana rozloženej plochy sa strieda `l`/`r`. Osamelá položka v dvojici sa zmení na rozloženú.
- **Každá fotka:**
  ```html
  <figure class="shot pl-{w|s|p}-item" data-full="{plná}" data-w="{š}" data-h="{v}" data-group="priestor" style="--fx:…;--fy:…">
    <div class="ph rv-img"><button class="ph-btn" type="button" aria-haspopup="dialog"><picture>…</picture></button></div>
    <figcaption class="rv"><span class="shot-t">{{ t(nadpis) }}</span><span class="shot-d">{{ t(text) }}</span></figcaption>
  </figure>
  ```
  - `.shot-n` (číslo) sa ruší.
  - `data-full`: pri širokej ploche `w-1920`, inak najväčšia `t` (1600 alebo 1080).
  - `PLNA_FOTKA` má prednosť.
  - `data-w`/`data-h` = rozmery plnej fotky.

| Plocha | ≥ 1024 px | 760–1023 px | < 760 px |
|---|---|---|---|
| `div.plate.pl-w` | Fotka cez celú šírku stránky (mimo `.wrap`), sada `w`, výška `min(70svh, 50vw)`, `object-fit:cover`. Popis pod ňou v `.wrap`: `.shot-t` stĺpce 1–4, `.shot-d` stĺpce 5–10. Obal `.par` (parallax). | rovnako, popis pod sebou | sada `t` 4 : 5 cez celú šírku obrazovky, popis pod ňou |
| `div.plate.pl-s.l` / `.r` | Fotka 4 : 5 v stĺpcoch 1–6 (`.l`) alebo 7–12 (`.r`), `max-height:74svh` (šírka sa podľa toho zúži, `justify-self` k okraju). Text v stĺpcoch 8–11 alebo 2–5, `align-self:end; padding-bottom:6%`. `.shot-t` vo veľkosti H3. | fotka 5 stĺpcov, text 3 | fotka 4 : 5 na šírku `.wrap`, text pod ňou |
| `div.plate.pl-p` | Dve fotky 4 : 5 v stĺpcoch 2–5 a 8–11; druhá posunutá nadol o `margin-top:clamp(48px,7vw,112px)`. Popis pod každou. | stĺpce 1–4 a 5–8 | vodorovný pás: `display:grid; grid-auto-flow:column; grid-auto-columns:78%; gap:12px; overflow-x:auto; scroll-snap-type:x mandatory; scroll-padding-inline:var(--gut); overscroll-behavior-x:contain`, karta `scroll-snap-align:start`; ďalšia vykúka; bez posuvníka (`scrollbar-width:none`) |

- Medzi plochami je `--plate-gap`.
- Plochy sú `div.plate` (nie `section`, nemajú vlastný nadpis).

**Obsah eseje** (texty sú existujúce dvojice z dnešného `film`, nič nové):

| # | Plocha | Fotka | `nadpis` | `text` | `popis_fotky` (alt) |
|---|---|---|---|---|---|
| 1 | W | `hlavna-sala-1` | Štart na strojoch | Stroje vedú pohyb za vás – ideálny štart bez činiek. | dnešná hodnota pri `hlavna-sala-1` |
| 2 | S (l) | `volne-vahy-2` | Voľné váhy | Prvý drep bez čakania na stojan, prvý tlak na lavici hneď vedľa. | „Rad lavíc a stojanov s voľnými váhami pri veľkých oknách“ |
| 3 | P | `stroje-4` | Svetlá sála | Technika na strojoch v pokoji, kým prejdete na voľné váhy. | dnešná hodnota |
| 4 | P | `hlavna-sala-4` | Veža na všetko | Príťahy, tlaky a kladky na jednom stroji, bez čakania medzi sériami. | dnešná hodnota |
| 5 | W | `kardio-1` | Kardio pri oknách | Rozbehnite sa s výhľadom do stromov, nie do steny. | dnešná hodnota |

Z eseje vypadnú: `vstup-1`, `recepcia-1`, `terasa-1` (snímky z videa), `funkcna-zona-1` (mäkká), `funkcna-zona-5` (je v medzihre) a `mma-1` (Panda je v Kde začať).

*(Zmenené v B3 krokom 3 z 3.2: esej má 4 zábery – W `hlavna-sala-1`, S `volne-vahy-2`, P `stroje-4` + `kardio-1`; `hlavna-sala-4` je v Detailoch.)*

### 4.6 Priestor: Detaily a Bar

**Detaily `div.more`:**

- **Hlavička** (`.wrap`, flex, zarovnanie na spodok):
  - vľavo `h3.h3` (`PR.mozaika_nadpis`) a `p` (`tb(PR.mozaika_text)`);
  - vpravo (≥ 861 px) `button.strip-prev` a `button.strip-next`: kruhové 44 × 44, `1px --line-2`, ikona šípky, `aria-controls="detaily"`, `aria-label` napevno „Predchádzajúce zábery“ / „Ďalšie zábery“.
- **Pás `div.mosaic.strip#detaily[role=region][aria-labelledby=h-detaily][tabindex=0]`:**
  - cez celú šírku stránky, `padding-inline:max(var(--gut), calc((100vw - var(--wrap))/2 + var(--gut)))`;
  - `display:flex; gap:12px; overflow-x:auto; scroll-snap-type:x mandatory; scroll-padding-inline:(rovnaké ako padding); overscroll-behavior-x:contain; scrollbar-width:none`.
- **Dlaždica** (`m.gal`, 8.4): výška 420 px (≥ 861 px), 300 px (inak). Šírka podľa tvaru: `vysoka` 4 : 5, `siroka` 3 : 2 (zo sady `w`, `object-fit:cover`). `scroll-snap-align:start`.
- **Bez viditeľných popiskov** (J1). `popis` ide do `data-cap` (lightbox), `popis_fotky` do `alt`.
- **Ruší sa:** `moreFold`, `[data-more-btn]`, text „Ukázať ďalšie zábery“.
- **Generátor:** pre `mozaika` nevolá `_vypln_mozaiku` (žiadne spany, žiadne varovanie o súčte).

**Obsah Detailov (6):**

| Tvar | Fotka | `popis` (len lightbox) | `popis_fotky` |
|---|---|---|---|
| siroka | `hlavna-sala-3` | ponechať | ponechať |
| vysoka | `jednorucky-1` | ponechať | ponechať |
| vysoka | `u-38047dcd` | „Kruhový tréning pri oknách“ | „Červený rig Life Fitness pri veľkých oknách, vedľa zrkadlo“ |
| vysoka | `volne-vahy-3` | ponechať | ponechať |
| siroka | `stroje-3` | ponechať | ponechať |
| vysoka | `kardio-3` | „Kardio s výhľadom do zelene“ | „Svetlá sála so strojmi a bežeckými pásmi pri veľkých oknách do zelene“ |

- Vypadnú `u-b4be27d3` (mäkká) a `kardio-2`.
- *(Zmenené: v B3 pribudol `hlavna-sala-4` z eseje, vysoká dlaždica za `hlavna-sala-3`, popis „Veža na všetko“; v Opravách pred B4 vypadol `u-38047dcd`, lebo je v medzihre (4.4). Detaily majú 6 záberov: `hlavna-sala-3`, `hlavna-sala-4`, `jednorucky-1`, `volne-vahy-3`, `stroje-3`, `kardio-3`; `{pocet_dalsich_miest}` dáva „Šesť ďalších miest“.)*
- `mozaika_text` = „{pocet_dalsich_miest}. Detaily, ktoré si všimnete až na mieste – ukážeme vám ich vopred.“ (bez „multipress“).

**Bar `div.bar-blok#bar`** (`.wrap`, odsadenie `clamp(64px,8vw,112px)`):

- **Hlavička T2:**
  - `p.kicker` (`PR.bar.nadpis_maly`, nové pole, predvolene „Bar“);
  - `h3.h3` (`PR.bar.nadpis`);
  - `p` (`tb(PR.bar.text)`) vpravo.
- **`div.mosaic`:** dnešná mriežka (4 stĺpce ≥ 761 px, 2 stĺpce inak, dlaždica 2 riadky vysoká, `grid-auto-flow:dense`).
  - `_vypln_mozaiku` ostáva bez zmeny (test „bar +1 fotka“).
  - Medzera 12 px. Bez popiskov (`data-cap`).
- **Obsah:** `bar-pult` (siroka) a `bar-posedenie` (siroka). Súčet miest 4: na počítači jeden rad, na telefóne dva.
- Vypadnú `bar-kavovar`, `bar-stolicky`, `bar-napoje` (kartón na zemi) a `bar-kresla` (opakuje posedenie). Súbory `bar-kavovar`, `bar-stolicky` a `bar-kresla` ostávajú v katalógu ako rezerva, `bar-napoje` sa maže.

### 4.7 Tréningy `section.trainings#treningy`

- **Hlavička T2:** `kicker` (`TX.treningy.nadpis_maly`), `h2#h-treningy`, `lead`.
- **Duo `div.duo`:** 2 stĺpce ≥ 760 px, bez podkladu. `article.duo-card.rv`:
  - `.ph.rv-img` s pomerom **3 : 2** (sada `t`, `object-fit:cover`, ohnisko stred, `sizes="(max-width:760px) calc(100vw - 32px), 600px"`);
  - pod ním `p.tr-tag` (Manrope 600 13 px verzálkami `--ink-3`), `h3.h3`, `p` a `a.tlink.tr-link`;
  - **bez** `data-tilt` a `data-par`.
  - Fotky: Fitness tréning → `volne-vahy-1` (dnes `volne-vahy-2`, tá je v eseji), Osobný tréning → `stroje-2`.
- **Lekcie `div.lessons`** (`margin-top:clamp(64px,8vw,112px)`):
  - ≥ 1024 px: mriežka 12 stĺpcov. `figure.lv` (video zápasenia) v stĺpcoch 1–5, `grid-row:1`. `div.lessons-list` v stĺpcoch 7–12.
  - Video je `position:sticky; top:calc(var(--bar-h) + 24px)` **len** pri `(min-width:1024px) and (min-height:760px)`.
  - < 1024 px: najprv zoznam, potom video (`max-width:420px`).
  - **DOM poradie:** `div.lessons-list` je pred `figure.lv`.
  - `div.lessons-list`:
    - `h3.lessons-h` (doslova, test), `p.lessons-p`;
    - riadky `article.lesson.rv[data-tag]`: mriežka `9.5rem | 1fr | 1.2fr` (≥ 1024 px), `9rem | 1fr` (760–1023 px), pod sebou (< 760 px);
    - čiara len hore `1px --line`, **`border-radius:0`** (oprava K1), `padding-block:24px`;
    - `p.lesson-when`: Manrope 600 15 px `tabular-nums` `--ink`. Skupiny dní **na samostatných riadkoch** cez `<span>` s `display:block`; žiadne verzálky (K3);
    - `h4` (Oswald, s malým logom MDS 24 px pri `logo_mds`; podnadpis `span` Manrope 15 px `--ink-3`), `p.lesson-who` (14 px `--ink-3`), popis;
    - pod zoznamom `a.btn.btn-g.lessons-go` → `#rozvrh`.
- **MDS `section.mds#mds`:**
  - Pás cez celú šírku `--bg-2`, bez červeného gradientu. `margin-top:clamp(64px,8vw,112px)`, `padding-block:clamp(48px,6vw,88px)`.
  - Vnútri `.wrap`, mriežka 12 stĺpcov:
    - `figure.lv.mds-video` (4 : 5, max 70svh) v stĺpcoch 1–5;
    - `div.mds-body` v stĺpcoch 7–12.
  - `div.mds-body` obsahuje:
    - logo MDS 56 px;
    - `p.kicker` (`TX.mds.nadpis_maly`), `h3#h-mds.mds-h` (`nadpis(TX.mds.nadpis)`);
    - `ul.mds-when` (doslova `<li><b>…</b><span>…</span></li>`, test);
    - `div.mds-lady`: `h4` (`TX.mds.ladydefence_nadpis`), `ul` bodov a `button.mds-lady-open` (8.4) s náhľadom 96 × 128 (plagát `ladydefence-poster`), ikonou prehrávania, `span.live-tag` (`ladydefence_video_stitok`) a textom (`ladydefence_video_text`). Tlačidlo otvorí lightbox v režime videa (5.4). Video Ladydefence už nemá vlastný rám (K4);
    - `p.mds-note`, `div.mds-act` (`a.btn.btn-p.btn-arrow` „{{ TX.mds.tlacidlo }}“ a `a.tlink.mds-tel`, 44 px).
  - < 1024 px: video nad textom, `max-width:420px`.
- **Videá `figure.lv[data-live-video]`** (zápasenie, MDS):
  ```html
  <figure class="lv" data-live-video>
    <img class="lv-poster" src="assets/video/{id}-poster.jpg" srcset (avif/webp cez <picture>) width height alt="" loading="lazy" decoding="async">
    <video muted playsinline loop preload="none" width height aria-label="{{ t(popis) }}" data-src="….mp4" data-src-webm="….webm"></video>
    <button class="lv-sound" type="button" aria-pressed="false" aria-label="Zapnúť zvuk"><span class="lv-ico" aria-hidden="true"></span><span class="lv-t">{{ t(R.zvuk) }}</span></button>
    <button class="lv-play" type="button" aria-label="Prehrať ukážku" hidden><span aria-hidden="true"></span></button>
    <figcaption><span class="live-tag">{{ t(stitok) }}</span>{{ t(text) }}</figcaption>
  </figure>
  ```
  - **Bez atribútu `poster`.** Dnes sa 116 kB plagátov sťahuje pri štarte.
  - Tlačidlá majú najmenej 44 × 44.
  - Rám 4 : 5, `--r-img`. Štítok vľavo hore na rgba(11,12,15,.72).

### 4.8 Tréneri `section.team#treneri`

- **Hlavička T2.**
- **Filter `div.chips[role=group]`:**
  - tlačidlá `.chip` (Manrope 500 15 px, `min-height:44px`, `padding:0 16px`, bez rámika). Aktívne (`aria-pressed=true`) má text `--ink` a spodnú linku 2 px `--red`, ostatné `--ink-2`.
  - „Všetci“ z `R.filter_vsetci`.
  - `span.chip-count[data-coach-count][aria-live=polite]` vpravo (doslova, test).
  - < 760 px: jeden riadok s `overflow-x:auto`, `scrollbar-width:none` a maskou okraja (`mask-image:linear-gradient(90deg,#000 88%,transparent)`).
- **Mriežka `div.coach-grid`:**
  - `display:flex; flex-wrap:wrap; justify-content:center; gap:40px var(--gap)`.
  - `.coach{flex:0 0 calc((100% - 3*var(--gap))/4)}` (≥ 1024 px, 11 = 4 + 4 + 3 vycentrované, L1) a `calc((100% - 2*var(--gap))/3)` (640–1023 px).
- **Karta `article.coach.rv[data-tags]`:**
  - `div.coach-face.ph` 4 : 5, `img{filter:var(--coach-filter)}` s `--coach-filter: saturate(.88) contrast(1.04) brightness(.98)`. Je to jednotná jemná úprava, **farebná**. Platí aj pre fotky nahraté cez CMS.
  - odznak MDS (`odznak_mds`) je malé logo 24 px pri mene, nie na fotke;
  - `h3.coach-name`, `p.coach-role` (14 px `--ink-3`);
  - `p.coach-when` (doslova `Tréning: …`, „Tréning:“ z `R.trening`; 14 px `--ink-2`);
  - `details.coach-more` so `summary` (`R.trener_viac`, 44 px, ikona chevron) a obsahom `p.coach-bio` (`overflow-wrap:anywhere`, test `dlhe`) a `a.coach-tel` (44 px), ak je telefón.
  - Hover/fokus na karte: `picture{scale:var(--zoom-hover)}` (5.4).
- **< 640 px riadky:** `.coach{flex:0 0 100%; display:grid; grid-template-columns:72px 1fr; column-gap:16px}`. Portrét 72 × 90, vpravo meno, zameranie, čas. `details` na celú šírku pod nimi. Všetky karty majú rovnakú šírku (test `dlhe`).
- **`p.team-note`** ostáva.

### 4.9 Rozvrh `section.timetable#rozvrh`

- **Hlavička T2.**
- **`div.today`:** riadok bez karty s hornou a dolnou linkou.
  - vľavo `[data-today-label]` (štítok) a `[data-today-hours]` (Oswald 500 2.5rem `tabular-nums`);
  - v strede `p.status.status-big`;
  - vpravo `a.btn.btn-g` s telefónom (`TX.rozvrh.tlacidlo`).
- **Widget `div.tt[data-timetable]`** (značkovanie bez zmeny).
- **`.tt-days`:** `display:grid; grid-template-columns:repeat(7,1fr); gap:4px` **na každej šírke**.
  - Tlačidlo `.tt-day`: `min-height:56px`, skratka dňa Oswald 500 1.125rem, pod ňou `<small>` (Manrope 13 px `--ink-3`).
  - Vybraný deň: pozadie `--bg-3` a spodná linka 2 px `--red`. Dnešný deň: bodka 6 px nad skratkou (`::before`, `--red`).
  - **≤ 560 px:** `<small>` sa skryje (`display:none`) a namiesto neho sa ukáže `::after{content:attr(data-n)}` (počet lekcií alebo „–“; 13 px).
  - JS dopĺňa `data-n` a `aria-label` s plným textom („Pondelok, dnes, 2 lekcie“). `textContent` tlačidla ostáva rovnaký ako dnes (porovnanie živých textov).
  - Text `' lekcií'` ostáva v app.js (test).
- **Riadky `.tt-row`:**
  - čas Oswald 500 1.75rem `tabular-nums` (`small` „do …“ 13 px);
  - názov 1.0625rem 600, poznámka 14 px `--ink-3`;
  - „Práve prebieha“ (`b.tt-live`) je zelená bodka a text Manrope 600 13 px `--ink`, nie kapsula;
  - `a.tt-go` `min-height:44px`.
- **`p.tt-note`** ostáva.

### 4.10 Cenník `section.prices#cennik` a `div.steps#prva-navsteva`

- **Hlavička T2** (`<h2 id="h-cennik" class="h2">…</h2>` doslova, test).
- **`div.price-grid`:** 3 typografické stĺpce (≥ 760 px), oddelené zvislou linkou `--line`, bez podkladu, zaoblenia a naklápania. Na telefóne pod sebou s linkou.
- **`article.price-card[data-price][data-name]`** (atribúty ostávajú):
  - `span.price-tag` **v toku nad názvom** (oprava N1): Manrope 600 13 px verzálkami `--red-ink`;
  - `p.price-name` (Manrope 600 15 px verzálkami `--ink-2`);
  - `p.price` > `span.price-n` (doslova, test) + `span.price-u` (14 px `--ink-3`);
  - `p.price-d`.
  - `.is-hot`: horná linka 2 px `--red` cez `box-shadow: inset 0 2px 0 var(--red)`.
- **Tlačidlá (N2):**
  - Generátor vypočíta `ceny.spolocne_tlacidlo` (8.3). Ak majú všetky karty rovnaký text aj odkaz, šablóna **nevypíše** tlačidlá v kartách. Pod `price-grid` vypíše raz `a.btn.btn-p.btn-arrow.price-cta`.
  - Inak má každá karta `a.tlink`.
- **Tabuľka `table.price-t`:** celá šírka. Riadok `<tr data-price data-name><th scope="row">{{ názov }}</th><td>{{ poznámka }}</td><td>{{ cena }}</td></tr>`. Cenová bunka ostáva doslova `<td>3,50 €</td>`. `caption.sr-only` ostáva. Ceny vpravo `tabular-nums`, riadok ≥ 48 px.
- **`ul.price-notes`:** 2 stĺpce (≥ 760 px), bez ikony cenovky. Odrážka je 6 × 6 px štvorček `--ink-4`.
- **Kroky `div.steps#prva-navsteva`:**
  - `h3.h3` + `ol.step-list` v 3 stĺpcoch (≥ 760 px);
  - číslica cez `counter(step)`: Oswald 500 3.5rem `--ink-4` (sú to kroky, nie kapitoly), bez krúžkov;
  - `strong` (Manrope 600 1.0625rem) a text.

### 4.11 Recenzie `section.reviews#recenzie`

- **Hlavička T2** (zdroj gymklub.sk je v `lead` z CMS).
- **Prvá recenzia:** veľký citát `blockquote.rev.rev-lead`, Manrope 400 `clamp(1.5rem, 1.1rem + 1.4vw, 2.25rem)`, lh 1.35, max 30ch. Pred textom úvodzovka „ (Oswald 6rem `--red`, `aria-hidden`).
- **Ďalšie recenzie:** mriežka 3 stĺpcov (≥ 760 px) s hornou linkou, text 1.0625rem.
- Značkovanie `<blockquote class="rev …"><p>…</p><footer>…</footer></blockquote>` ostáva (test). `footer` je 13 px verzálkami `--ink-3`.
- Bez kariet a bez prázdnych plôch.

### 4.12 Otázky `section.faq#faq` (T3)

- **Vľavo** (5 stĺpcov, sticky): `p.kicker` a `h2#h-faq`.
- **Vpravo** (7 stĺpcov) `div.faq-list`:
  - `details.q > summary + .a` (doslova);
  - `summary`: Manrope 600 1.1875rem, `min-height:64px`, ikona +/− vpravo (dve linky, zvislá `rotate: 90deg → 0`, `--dur-2`), `list-style:none`;
  - `.a`: 1rem `--ink-2`, max 64ch;
  - tabuľka `[data-hours]` Manrope `tabular-nums`.
- **< 1024 px:** pod sebou, bez sticky.

### 4.13 Kontakt `section.contact#kontakt` (6 : 6)

**Vľavo:**

- `p.kicker`, `h2#h-kontakt`;
- `address.addr` (dnešné `data-fact` bez zmeny, Manrope 1.125rem);
- `div.contact-actions`:
  - **jedno** hlavné `a.btn.btn-p.btn-arrow` (`R.navigovat`, `data-fact=map-link`, nové okno);
  - pod ním riadok textových odkazov `.tlink`, každý 44 px: Zavolať (`R.zavolat`, `data-fact=phone-link`), `button.tlink[data-copy-addr][data-done="{{ t(R.adresa_skopirovana) }}"]` (`R.kopirovat_adresu`), Instagram (`R.instagram`, `data-fact=ig-link`), Facebook (`R.facebook`, `data-fact=fb-link`);
- `p.status.status-big`.

**Vpravo:**

- `h3.h3` (`TX.kontakt.hodiny_nadpis`);
- `table.hours-t[data-hours]` (Manrope `tabular-nums`; dnešný riadok `--ink` a 600, JS ho označí `is-today`);
- `p.hours-note`;
- mapa `div.map[data-map]`:
  - rám 4 : 3 na `--bg-2`, `--r-img`;
  - zástupný obsah: ikona špendlíka, adresa (`data-fact=street`/`city`) a `button.btn.btn-g.btn-sm[data-map-load]` (`R.mapa_zobrazit`);
  - iframe sa načíta pri kliknutí na tlačidlo **alebo** pri priblížení (IO, `rootMargin:'200px'`, ako dnes) a prelne sa (`--dur-3`). `filter:grayscale(.85)` na iframe.
  - Text „Mapa sa načíta pri posune sem.“ sa ruší.

### 4.14 Pätička `footer.foot`

- **`.foot-cta`** (na `--bg`, `padding-block:clamp(72px,9vw,136px)`):
  - `p.foot-k` (dnešný obsah, 13 px verzálkami `--ink-3`);
  - `p.foot-h` (vzhľad H2, `nadpis(TX.paticka.slogan)`, `em` `--red`; druhé povolené miesto červeného nadpisu);
  - `.foot-act`: `a.btn.btn-p.btn-lg.btn-arrow` (`P.adresa.navigovat_na`) a `a.btn.btn-g.btn-lg` (telefón).
- **`.foot-in`** (kostený spodok `--bone`, text #0b0c0f, `padding-block:56px 40px`):
  - plnofarebné logo 140 px;
  - adresa a `span.foot-status.status` (bodka na kostenej #1f8a52, stav nesie text);
  - `nav.foot-nav` v 3 stĺpcoch, každý odkaz riadok ≥ 44 px, farba #0b0c0f, hover #b52d1c. Položky:
    - 7 rovnakých ako menu + `PR.bar.nadpis_maly` → `#bar` (za Priestorom);
    - Instagram (`R.instagram`), Facebook (`R.facebook`), web (`K.web_text`);
  - partner MDS (logo 40 px a dnešné texty);
  - `p.foot-copy` (© `[data-year]`, `data-fact=fullname`, `R.prava`; 13 px #5c5a55).

### 4.15 Dok, tlačidlo hore, lightbox

- **`div.dock`** (≤ 860 px):
  - plné `--bg` s hornou linkou `--line`, bez rozostrenia, `padding: 10px var(--gut) calc(10px + env(safe-area-inset-bottom))`;
  - `a.dock-call.btn.btn-g` (48 px, `R.zavolat`) a `a.dock-cta.btn.btn-p` (48 px; `span.dock-l-hero` = `R.dok_prvy_raz`, `span.dock-l-std` = `R.dok_cennik`);
  - skryje sa pri pätičke (`.is-hidden`) a pri otvorenom menu.
- **`a.totop`:** len ≥ 861 px a od 3. obrazovky. 44 × 44, `--bg-2`.
  - *(Odchýlka z Opráv pred B4, na rozhodnutie orchestrátora: tlačidlo stojí v pravom okraji vedľa `.wrap` a ukáže sa až od 1344 px, keď je okraj aspoň 60 px. Pri 861–1343 px by 44 px tlačidlo prekrylo obsah, preto tam nie je; návrat hore cez lištu (ukáže sa pri posune nahor) a kláves Home.)*
- **Lightbox:** značkovanie a správanie v 5.4 a 6.2.

---

## 5. Pohybový systém

### 5.1 Tokeny

```css
:root{
  --dur-1:120ms;   /* stlačenie, fokus */
  --dur-2:200ms;   /* hover: farba, linka, šípka; prelnutie textu */
  --dur-3:320ms;   /* UI stavy: menu, lišta, filter, lightbox, dok, mapa */
  --dur-4:640ms;   /* odhalenie textu a riadkov */
  --dur-5:900ms;   /* nadpis z masky, riadky H1 */
  --dur-6:1100ms;  /* opona fotky */
  --dur-7:1600ms;  /* usadenie fotky (scale), usadenie úvodu */
  --ease-out:cubic-bezier(.16,1,.3,1);     /* príchod, usadenie */
  --ease-io:cubic-bezier(.65,0,.35,1);     /* presun medzi stavmi, opona */
  --ease-in:cubic-bezier(.55,0,1,.45);     /* krátky odchod (≤ --dur-3) */
  --ease-ui:cubic-bezier(.2,0,0,1);        /* hover, drobné stavy */
  --rise:14px; --rise-2:24px; --stagger:70ms;   /* najviac 4 súrodenci = 280 ms */
  --zoom-in:1.06; --zoom-hover:1.03; --par:18px;
}
@media (prefers-reduced-motion: reduce){
  :root{--dur-3:0s;--dur-4:0s;--dur-5:0s;--dur-6:0s;--dur-7:0s;--rise:0px;--rise-2:0px;--stagger:0ms;--zoom-in:1;--zoom-hover:1;--par:0px}
  html{scroll-behavior:auto}
  .dot::after{animation:none}
}
```

- Toto je **jediný** blok `prefers-reduced-motion: reduce` v `style.css`.
- Prelínanie farby a opacity do 200 ms (`--dur-1`, `--dur-2`) ostáva aj pri obmedzenom pohybe, nejde o pohyb.
- Všetky `transition` a `animation` v súbore používajú len tieto tokeny. Iné trvania sú dovolené len ako výpočet z tokenov.

### 5.2 Pravidlá

1. **Animujú sa len `opacity`, `translate`, `scale`, `rotate`** (samostatné vlastnosti, nie `transform`). Žiadny `clip-path`, `filter`, `box-shadow`, `background-position`, `height`, `top`, `width` v prechode ani animácii.
   - Výnimky: `background-color`, `border-color`, `color`, `outline-color` v `--dur-2`; `block-size` pri `::details-content` (5.4).
2. **Odhalenie, hover a parallax sú vždy na rôznych prvkoch:**
   - opona na `.ph::after`;
   - usadenie na `.ph img`;
   - hover na `.ph picture`;
   - parallax na obale `.par`.
   - Odhalenie textu mení `translate`, hover `scale`. Tým zmiznú chyby „karta preskočí z 0 na 1“ a „hover zdvih nefunguje“.
3. **Jediná nekonečná animácia** je `ping` stavovej bodky (2.6), len pri `.is-vis`.
4. **Pohyb viazaný na skrolovanie len cez CSS**, len vo vnútri `@supports (animation-timeline: view())` a `@media (prefers-reduced-motion: no-preference)`, na 3 miestach:
   - odchod úvodu (dnešné `hxOut`, `hxDim`, `hxPush`);
   - prúžok postupu;
   - parallax ±`--par` na `.opener` a `.pl-w`.

   Bez podpory je stav statický. **JS obsluha skrolovania pre efekty sa ruší** (`heroExit`, `band`, `chapterLine`, `[data-par]`).
5. **Žiadne pripínanie** dlhšie ako vlastný obsah. Lepiace sú len: úvod pod listom Intro, náhľad Kde začať, video lekcií (vysoké okno), nadpis Otázok.
6. **Jeden IntersectionObserver na odhalenia:** `threshold:0`, `rootMargin:'0px 0px -12% 0px'`, jednorazovo.
7. **`will-change`** sa nepíše natrvalo. Cieľ ≤ 40 vrstiev kompozítora.
8. **Bez JS** (`html.no-anim` alebo app.js sa nenačíta) je všetko viditeľné. Skryté počiatočné stavy platia len pod `html.rv-on`, ktorú pridá app.js pri štarte.
9. Pohyb musí vyzerať dobre aj pri 30 fps (úsporný režim iOS). Žiadne efekty viazané na snímky.

### 5.3 Odhalenia (CSS)

```css
/* text, riadky, karty */
html.rv-on .rv:not(.is-in){opacity:0;translate:0 var(--rise)}
.rv{transition:opacity var(--dur-4) var(--ease-out) calc(var(--i,0)*var(--stagger)),
               translate var(--dur-4) var(--ease-out) calc(var(--i,0)*var(--stagger))}
/* nadpis z masky – obal je MIMO h2, nadpis() sa nemení */
.mask{display:block;overflow:clip;padding-block:.18em .06em;margin-block:-.18em -.06em}
html.rv-on .mask:not(.is-in) > *{translate:0 105%}
.mask > *{transition:translate var(--dur-5) var(--ease-out)}
/* fotka: opona vo farbe pozadia, odhalenie vždy zdola, len kompozítor */
.ph::after{content:"";position:absolute;inset:0;background:var(--rv-bg,var(--bg));transform-origin:50% 0;pointer-events:none;scale:1 0}
html.rv-on .rv-img:not(.is-in)::after{scale:1 1}
.rv-img::after{transition:scale var(--dur-6) var(--ease-io)}
html.rv-on .rv-img:not(.is-in) img{scale:var(--zoom-in)}
.rv-img img{transition:scale var(--dur-7) var(--ease-out)}
.no-tr,.no-tr *, .no-tr::after, .no-tr *::after{transition:none!important}
```

- Opona má `transform-origin` hore a zmenšuje sa k hornej hrane, takže fotka sa odkrýva zdola nahor.
- `--i` zapisuje šablóna (`style="--i:{{ [loop.index0, 4]|min }}"`).
- `.mask` obaľuje `h2.h2` v hlavičkách sekcií a `h3.h3` v Detailoch, Bare a krokoch. **Neobaľuje** H1 (úvod má vlastné `.line`). Doslovné testy H2 tak ostávajú.
- **Fotka sa odhalí až keď je načítaná:** IO pridá `is-in` po splnení oboch podmienok: prvok je v okne a `img.complete && img.naturalWidth > 0`, inak sa čaká na `load`/`error` najviac 800 ms. Pod oponou je `background:var(--bg-2)`, nikdy sa neodhalí prázdny rám.
- **Prvky v okne pri štarte** (obnova stránky, otvorenie s kotvou, skok z menu) dostanú `.is-in` spolu s `.no-tr`. `.no-tr` sa odstráni po 2 snímkach (`requestAnimationFrame` × 2).
- **Parallax:**
  ```css
  @supports (animation-timeline: view()){ @media (prefers-reduced-motion: no-preference){
    @keyframes par{from{translate:0 calc(var(--par) * -1)}to{translate:0 var(--par)}}
    .par{animation:par linear both;animation-timeline:view();animation-range:cover}
  }}
  .par{position:absolute;inset:calc(var(--par) * -1) 0}
  ```
  Ak na skutočnom iPhone so Safari 26.0–26.3 parallax zaostáva, nastaviť `--par:0px` (bez ďalšej zmeny).
- *(Zmenené v B4, podrobnosti v `IMPLEMENTACIA-POZNAMKY.md`)* Maska nadpisu posúva o `calc(105% + .4em)` a riadky H1 o `calc(100% + .35em)` (pri 105 % / 110 % vykúkali pod maskou mäkčene a dĺžne). Opona je len na `.rv-img::after` (rámy s odhalením), nie na každom `.ph`. Prvok, ktorý pri vstupe do okna už leží v hornej polovici okna (rýchly posun, skok bez VT), dostane `.is-in` hneď s `.no-tr`. Parallax a odchod úvodu majú `fill` `backwards` (mimo rozsahu nedržia vrstvy kompozítora). Sekcie a pätička majú `isolation:isolate` (vrstvy ≤ 40).

### 5.4 Katalóg prechodov

| # | Prechod | Spúšťač | Technika | Trvanie, krivka | Záloha (Safari iOS ≤ 17/18, Firefox) | Obmedzený pohyb |
|---|---|---|---|---|---|---|
| 1 | Otvorenie úvodu: fotka | `hx-lit` (po `img.decode()`, najneskôr 1200 ms) | LQIP podklad; `.hero-cam img` `scale` 1.06 → 1; `.hero-expo` opacity .5 → 0 (700 ms) | `--dur-7`, `--ease-out` | rovnaké (transform, opacity) | bez `hx`, hneď konečný stav |
| 2 | Otvorenie úvodu: H1 | `hx-go` (písmo alebo 300 ms, čo skôr) | `.line > span` `translate` 0 110 % → 0, druhý riadok s oneskorením 120 ms | `--dur-5`, `--ease-out` | rovnaké | hneď |
| 3 | Otvorenie úvodu: ostatné | `hx-go` | `.hero-live`, `.hero-p`, `.hero-cta`, kolofón, dok: opacity + `translate 0 12px` | `--dur-4`, oneskorenie 0 / 200 / 280 / 480 / 560 ms | rovnaké | hneď |
| 4 | Opakovaná návšteva | `hx-quick` | len opacity | 300 ms | rovnaké | hneď |
| 5 | Odchod úvodu pod list | `animation-timeline: scroll(root)` | `hxOut`/`hxDim`/`hxPush` (`style.css:1040–1049`), hodnoty: `.hero-in` opacity 1 → 0 a `translate 0 → -48px` (0–60svh), `.hero-dim` 0 → .55, `.hero-cam` `scale 1 → 1.05` (0–100svh) | lineárne s posunom | **statický** úvod, list ho len prekryje. **JS záloha `heroExit` sa maže** | statické |
| 6 | Lišta skryť/ukázať | scroll (pasívny, rAF, číta len `scrollY`) | `translate: 0 -100%` | `--dur-3`, `--ease-io` | rovnaké | okamžitá zmena |
| 7 | Lišta plná / priehľadná | `in-hero` (JS podľa `scrollY < 0,5 · innerHeight`, ako dnes) | opacity `::before` | `--dur-2` | rovnaké | rovnaké |
| 8 | Aktívna položka menu | IO na sekciách menu, `rootMargin:'-45% 0px -50% 0px'` | linka `scale` X 0 → 1, `aria-current` | `--dur-2` | rovnaké | bez animácie |
| 9 | Prúžok postupu | `scroll(root)` | `scale` X | lineárne | skrytý | skrytý |
| 10 | Mobilné menu | burger | panel opacity 0 → 1 + `translate 0 -8px → 0` (`@starting-style` + `transition-behavior: allow-discrete` na `display`); odkazy opacity + `--rise` s odstupom 30 ms (max 8); zatvorenie opacity `--dur-2` `--ease-in` | `--dur-3`, `--ease-out` | bez `@starting-style` (iOS < 17.5) sa panel ukáže hneď | len zobraziť |
| 11 | Skok z menu, pätičky, tlačidla na vzdialenú kotvu (> 1,5 výšky okna) | klik na `a[href^="#"]` s existujúcim cieľom | View Transition (6.2 `jump`): `::view-transition-old(root)` opacity → 0 (140 ms, `--ease-in`), `::view-transition-new(root)` opacity 0 → 1 a `translate 0 12px → 0` (280 ms, `--ease-out`); `.bar{view-transition-name:bar}`, `.dock{view-transition-name:dock}`, `::view-transition-group(bar),::view-transition-group(dock){animation:none}` | ≤ 280 ms | bez VT (iOS 17, Safari 18.0–18.3, Firefox < 144): `scrollIntoView({behavior:'smooth'})` | okamžitý skok |
| 12 | Skok na blízku kotvu (≤ 1,5 okna) | klik | `scrollIntoView({behavior:'smooth'})` | prehliadač | rovnaké | `auto` |
| 13 | Odhalenie textu, riadkov, kariet | IO (5.3) | `.rv` | `--dur-4` + odstup | bez IO všetko viditeľné | viditeľné |
| 14 | Odhalenie nadpisu | IO | `.mask > h2` z 105 % | `--dur-5`, `--ease-out` | rovnaké | viditeľné |
| 15 | Odhalenie fotky | IO + načítaný obrázok | opona `scale` Y 1 → 0 (`--dur-6`, `--ease-io`) + `img scale` 1.06 → 1 (`--dur-7`, `--ease-out`) | – | rovnaké | viditeľné, bez zväčšenia |
| 16 | Parallax `.opener`, `.pl-w` | `view()` | `.par translate` ±18 px | lineárne | statické | statické |
| 17 | Náhľad Kde začať | `mouseenter`/`focusin` riadku (≥ 1024 px, `pointer:fine`) | 4 vrstvy: nová opacity 0 → 1 (`--dur-3`) a `scale` 1.04 → 1 (600 ms); šípka riadku `translate 4px` | `--ease-out` | rovnaké | len prelnutie `--dur-2` |
| 18 | Hover klikateľnej fotky | `:hover`, `:focus-visible` (len `@media (hover:hover)` pre hover) | `picture scale` 1 → 1.03; prechod je na **základnom** stave (tam aj späť) | 700 ms, `--ease-out` | rovnaké | bez zväčšenia |
| 19 | Hover tlačidla a odkazu | `:hover` | farba, šípka `translate 3px` | `--dur-2`, `--ease-ui` | rovnaké | len farba |
| 20 | Lightbox: otvorenie | klik/Enter na `.ph-btn` | FLIP cez WAAPI: vrstva A dostane `src = currentSrc` náhľadu, animuje sa z obdĺžnika náhľadu do konečnej polohy (`translate` + `scale`); `::backdrop` rgba(11,12,15,.94) opacity; plná fotka sa načíta, `decode()`, prelnutie 200 ms | 420 ms, `--ease-out` | bez `el.animate`: `dialog[open]` cez `@starting-style` (opacity 0, `scale .96`) `--dur-3`; bez `@starting-style` hneď | okamžite |
| 21 | Lightbox: ďalší záber v tej istej skupine | šípky, ←/→, ťah | nový záber sa zobrazí **až po `decode()`**; vrstvy A/B: nová opacity 0 → 1 + `translate ±24px → 0`, stará opacity → 0; popisok sa mení v tej istej snímke | 240 ms, `--ease-out` | rovnaké | okamžite |
| 22 | Lightbox: prechod do inej skupiny (priestor → detaily → bar) | rovnaké | „krok“: stará `scale 1 → 1.04` + opacity → 0 (320 ms, `--ease-io`), nová `scale .965 → 1` + opacity (420 ms, `--ease-out`, oneskorenie 60 ms); späť zrkadlovo | 420 ms | rovnaké | okamžite |
| 23 | Lightbox: ťah prstom | pointer events na `.lb-stage`, `touch-action:pan-y` | vrstva ide s prstom 1 : 1 (`translate`); pustenie > 18 % šírky alebo rýchlosť > 0,5 px/ms = krok, inak návrat | návrat 240 ms `--ease-out` | rovnaké | bez animácie návratu |
| 24 | Lightbox: zatvorenie | Esc (`cancel` → `preventDefault` + animácia), ×, klik na pozadie | spätný FLIP k náhľadu, ak je náhľad v okne; inak opacity + `scale .98`; potom `close()` a fokus späť na tlačidlo | 240 ms, `--ease-in` | `close()` hneď | okamžite |
| 25 | Lightbox: video (Ladydefence) | `button.mds-lady-open` | ten istý dialóg, `video.lb-video` (`controls playsinline`, zdroj z `data-*`), šípky skryté; pri zatvorení `pause()` a `removeAttribute('src')` | ako #20 (bez FLIP, len opacity/scale) | rovnaké | bez autoplay |
| 26 | Filter trénerov | klik `.chip` | `document.startViewTransition(apply)`; počas prechodu má každá viditeľná `.coach` `view-transition-name: c-{index}` (JS nastaví pred a zmaže po `finished`); `::view-transition-group(*)` `--dur-3` `--ease-io` | 320 ms | bez VT: viditeľné karty opacity 0 → 1 (200 ms) | okamžite |
| 27 | Rozvrh: výber dňa | klik, ←/→ | `.tt-row` opacity 0 → 1 + `translate 0 6px → 0`, odstup 40 ms (max 6) cez `animation-delay`, ako dnes | 320 ms | rovnaké | okamžite (`tt-quiet` pri minútovom obnovení ostáva) |
| 28 | Otázky | `toggle` na `details` | `@supports (interpolate-size: allow-keywords){:root{interpolate-size:allow-keywords} details.q::details-content{block-size:0;overflow:clip;transition:block-size var(--dur-3) var(--ease-io),content-visibility var(--dur-3) allow-discrete} details.q[open]::details-content{block-size:auto}}`; vždy `details.q[open] .a{animation:fadeUp var(--dur-2) var(--ease-out)}` (opacity + 6 px) | 320 ms | výška sa zmení okamžite, obsah sa prelne (Safari, Firefox) | natívne |
| 29 | Detail trénera | `details.coach-more` | rovnaké ako #28 | – | – | – |
| 30 | Pás Detaily: šípky | `.strip-prev/.strip-next` | `strip.scrollBy({left: ±0,8 · clientWidth, behavior:'smooth'})`; `disabled` na koncoch (pasívny scroll + rAF, číta len `scrollLeft`, `scrollWidth` a `clientWidth` z `ResizeObserver`) | prehliadač | rovnaké | `behavior:'auto'` |
| 31 | Video v sekcii | počítač: IO ≥ 50 % (pauza pod 20 %); telefón (`lite-root`): len ťuknutie na `.lv-play` | po udalosti `playing` sa `.lv-poster` prelne (opacity → 0) | `--dur-3` | plagát + tlačidlo | nikdy samo, tlačidlo Prehrať |
| 32 | Mapa | klik alebo IO | iframe opacity 0 → 1 po `load` | `--dur-3` | rovnaké | okamžite |
| 33 | Stavová bodka | IO pridá `.is-vis` | `::after` `scale 1 → 2.4`, opacity .5 → 0, `infinite` | 2,4 s `--ease-out` | rovnaké | bez pulzu |
| 34 | Dok | IO na pätičke, otvorené menu | `translate 0 100%` + opacity | `--dur-3` | rovnaké | okamžite |

**Podrobnosti k #11 (skok cez View Transition):**

1. Zavolať `flush()` odložených inicializácií (ako dnes).
2. Obrázkom s `loading=lazy` v prvej obrazovke cieľa nastaviť `loading='eager'` a čakať na `decode()` najviac 250 ms.
3. Vo vnútri `startViewTransition`: `window.scrollTo({top: cieľ, behavior:'instant'})` a prvkom `.rv`, `.mask`, `.rv-img` v cieľovej obrazovke pridať `.is-in .no-tr`.
4. Po `finished`: `history.pushState(null,'','#'+id)` a fokus na nadpis cieľa (`tabindex="-1"`, `focus({preventScroll:true})`).
5. Pri `hashchange`/späť v histórii prehliadač zaskočí sám (bez VT).
6. **Detekcia funkcie:** `'startViewTransition' in document && !/Version\/18\.[0-3](\.\d+)? .*Safari/.test(navigator.userAgent)`. Safari 18.0–18.3 má chyby pri zmene polohy skrolovania; vynecháva sa vedome a kontrola je obmedzená len na tieto verzie.
7. **Názvy kapitol v JS (`CHAPTERS`) sa rušia** spolu s `filmCut` a `.cut`.

**Zmenené v B4** (podrobnosti a dôvody v `IMPLEMENTACIA-POZNAMKY.md`, časť B4):

- **#5:** jeden rozsah pre všetky štyri prvky (`calc(--hero-top · −1)` až `+ 100svh`, úvod vyšší ako okno sa najprv doroluje); text úvodu zmizne v 60 % rozsahu (`@keyframes hxOut{60%,to{…}}`), `fill` `backwards`.
- **#11:** `::view-transition-old(bar)` a `old(dock)` sa prelnú preč (140 ms, `mix-blend-mode:normal`), inak by stará snímka lišty s otvoreným mobilným menu zmizla naraz. Mobilné menu zatvára `jump()` až vo vnútri prechodu. Lišta po skoku ostane 1,5 s viditeľná. Pri `#top` dostane fokus `#h-hero`.
- **Otvorenie s kotvou** (`/#cennik` …, doplnok): skript v hlavičke pridá `html.kotva` (`main` a pätička `visibility:hidden`), kým prehliadač neskočí na cieľ (prvý `scroll`, `load`, najneskôr 1,5 s). CLS 0 pri všetkých kotvách a úvod pred skokom nezablikne.
- **#20, #24:** let fotky ide cez dočasný rám `.lb-fly` (rám mení `scale` X/Y, fotka v ňom opačne), aby náhľad orezaný `object-fit:cover` prešiel do celej fotky bez deformácie; pred letom `decode()` rámu (najviac 250 ms) a `decoding='sync'`. Široké plochy eseje majú pod 760 px `data-full-t` (lightbox ukáže tú istú sadu `t` ako náhľad).
- **#21, #22:** popisok a počítadlo sa prelínajú spolu s novou fotkou (rovnaké trvanie a oneskorenie), takže nikdy nie sú novšie než fotka pod nimi.
- **#18:** trvanie hoveru `calc(var(--dur-4) * 1.09375)` = 700 ms, pri obmedzenom pohybe 0.

### 5.5 Ruší sa

**JS:** `heroExit`, `cardGlow`, `band`, `tilt`, `splitWords`, `bridges`, `reel`, `filmCut` + `CHAPTERS`, `chapterLine`, `smoothScroll` + `SMOOTH_SCROLL`, `moreFold`, JS animácia výšky v `faq()`, celý súbor `depth.js`.

**Keyframes:** `gkSheen`, `gkTick`, `gkPole`, `arrowGo`, `hxRing`, `cutIn`, `zoomThrough`, `capIn`, `dip`, `secPulse`, `gkShine`, `ping` na `box-shadow` (nový `ping` je na `scale` pseudoprvku).

**Selektory a atribúty:** `.marquee`, `.gal-item`, `.tr-card`, `.rail`, `.f-field`, `[data-tilt]`, `.glowcard`, `[data-par]`, `[data-depth-*]`, `.reel*`, `.cut*`, `.band*`, `.bridge*`, `.ticker*`, `.pole-rule`, `.ch`, `--spring`, `--volt*`, `--acc-*`, `--panel-grad`.

---

## 6. JavaScript `assets/app.js` (prepis v jednom súbore, ≤ 14 kB gzip)

### 6.1 Musí ostať

- **Poistka na začiatku**, rozšírená: `if (!GK || !GK.GYM || !GK.TIMETABLE || GK.VERZIA !== 2) { …raz reload cez sessionStorage 'gk-obnova'…; return; }`. Reťazec `if (!GK || !GK.GYM` musí v súbore ostať (test).
- `window.GK_APP = true`, `var GYM = GK.GYM;` (test).
- `esc()` pri **každom** vkladaní textu do `innerHTML`. `esc(c.name)`, `esc(c.note)`, `esc(c.coach)`, `esc(c.from)`, `esc(c.to)`, `esc(c.tag)` doslova (test).
- `fillFacts`, `hoursTable` (doplní `is-today` riadku), `timetable` (6.2), `coaches` + `setCoachFilter`, `dock` (prepínanie `href` `.dock-cta`), `copyAddr` (texty z `data-done` a pôvodného textu tlačidla, nie napevno), `mapEmbed` (+ tlačidlo `[data-map-load]`), `heroFit`, `liveVideo`.
- Udalosti `gk:tick` a `gk:hero-done`. Odložené inicializácie po `gk:hero-done`, prvom posune nad 0,3 okna alebo kliku na kotvu, ako dnes (`app.js:707–724`).
- `html.sm` po `load` (plynulé skrolovanie CSS až po prvom vykreslení).

### 6.2 Moduly

| Modul | Čo robí | Poznámky |
|---|---|---|
| `header()` | jedna pasívna rAF slučka: číta **len** `scrollY`; `in-hero`, skrytie, `.totop.is-on` (od 3 okien) | žiadne `scrollHeight` ani `getBoundingClientRect` |
| `menu()` | burger, `html.nav-open`, Esc, návrat fokusu, zatvorenie pri kliku na odkaz a pri zmene na ≥ 861 px | `aria-expanded`, `aria-label` |
| `activeNav()` | IO na 7 sekciách menu; `aria-current` a `.is-active`; **ruší stav**, keď v pásme nie je žiadna sekcia (oprava B2) | – |
| `reveal()` | pridá `html.rv-on`; 1 IO podľa 5.3; prvky v okne pri štarte okamžite (`no-tr`); pri `rv-img` čaká na obrázok (≤ 800 ms) | bez IO: všetko `is-in` |
| `jump()` | 5.4 #11, #12; delegovaný klik na `document` pre `a[href^="#"]` s existujúcim cieľom (aj `.skip`: len fokus na `#main`) | pri `reduce` okamžitý skok + fokus |
| `dots()` | IO pridáva/odoberá `.is-vis` na `.dot` v obale `.is-open` | – |
| `timetable()` | dnešná logika; v `drawTabs` navyše `data-n` (počet lekcií, „–“ pri 0, „!“ pri sviatku) a `aria-label` s plným textom; `textContent` tlačidla bez zmeny | test `' lekcií'` |
| `coaches()` | filter; zmenu obalí `document.startViewTransition` (5.4 #26), ak je k dispozícii a nie je `reduce` | `[data-coach-count]` |
| `lightbox()` | 5.4 #20–25; zdroje v poradí DOM `.shot`, `.more .gal-f`, `#bar .gal-f`; skupina z `data-group`; popisok `.shot-t` + „ · “ + `.shot-d`, inak `data-cap`, inak `alt`; `.lb-count` = „n / N“ (`white-space:nowrap`); prednačítanie susedov po usadení (pri `saveData` nie); `html.lb-open{overflow:hidden}`; klik na `figure` aj na `.ph-btn` otvorí (porovnávací skript klika na `figure`) | DOM v 6.3 |
| `strip()` | šípky Detailov (5.4 #30) | – |
| `cestaPreview()` | len `matchMedia('(min-width:1024px) and (pointer:fine)')`; `mouseenter`/`focusin` riadku nastaví `data-active` na `.cesta-pv` | – |
| `liveVideo()` | dnešná logika + lenivý plagát (`.lv-poster`) + na `lite-root` žiadne automatické prehrávanie; nikdy pri `reduce`, `saveData` ani 2G | `rootMargin` načítania 600 px ostáva |
| `faq()` | len doplnok: `toggle` → nič, ak CSS stačí; JS výška sa ruší | – |

Kontrola `matchMedia('(prefers-reduced-motion: reduce)')` pred každou WAAPI animáciou a View Transition.

### 6.3 Lightbox DOM (šablóna)

```html
<dialog class="lb" id="lightbox" aria-label="Zväčšená fotografia">
  <div class="lb-stage">
    <img class="lb-img lb-a" alt="" decoding="async">
    <img class="lb-img lb-b" alt="" decoding="async" aria-hidden="true">
    <video class="lb-video" controls playsinline preload="none" hidden></video>
  </div>
  <button class="lb-close" type="button" aria-label="Zavrieť">×</button>
  <button class="lb-prev" type="button" aria-label="Predchádzajúca">‹</button>
  <button class="lb-next" type="button" aria-label="Ďalšia">›</button>
  <p class="lb-bar"><span class="lb-cap" aria-live="polite"></span><span class="lb-count"></span></p>
</dialog>
```

- Fotka `object-fit:contain`, `max-height: calc(100svh - 120px)`.
- Rozmery z `data-w`/`data-h` sa nastavia pred načítaním, takže nevznikne skok rozmerov.
- Tlačidlá majú 48 × 48 px.

---

## 7. Médiá

### 7.1 Gradácia `fotky.zjednot(im, rola)` (len Pillow, v CI musí bežať bez numpy)

Jedna funkcia v `nastroje/fotky.py`. Používa ju `fotky.spracuj()` pre fotky nahraté cez CMS aj jednorazový skript 7.3, takže všetko má jeden tón.

1. `ImageOps.exif_transpose`, sRGB (dnešné `_do_srgb`).
2. **Vyváženie bielej:**
   - maska neutrálnych pixelov: jas 30–225 a `(max-min)/max < 0,25`, zo zmenšenej kópie 256 px;
   - `ImageStat.Stat(im, mask)` dá priemery R, G, B;
   - zisky: `k = sqrt(1,06 / (R/B))`, `gR = k`, `gB = 1/k`, `gG = (1,5 + (R·gR + B·gB)/2) / G`;
   - použitie cez `Image.point` po kanáloch (`split`/`merge`).
3. **Jas:** gama tak, aby priemerný jas L bol 110, `g = ln(110/255)/ln(L/255)`, ohraničenie `g ∈ [0,70; 1,40]`. LUT cez `point()`.
4. **Rameno svetiel a čierny bod:** LUT `y = x` pre `x < 0,72`, inak `0,72 + 0,21·(1 − e^(−(x−0,72)/0,21))`; potom `y = 0,035 + 0,965·y`.
5. **Sýtosť:** priemerná sýtosť `s` (HSV kanál S zo zmenšenej kópie). Faktor `f = 0,22/s`, ak `s > 0,22`; `min(1,15; 0,16/s)`, ak `s < 0,128`; inak 1. `ImageEnhance.Color(f)`.
6. **Vinetácia** −8 % v rohoch: `Image.radial_gradient('L')` zmenšený na rozmer, `ImageChops.multiply` s maskou 235–255.
7. **Žiadne doostrenie.** Zmenšenie `Image.LANCZOS`.

**Poistky:**

- Ak je priemerný jas pred úpravou < 45 alebo > 180, alebo neutrálnych pixelov < 2 %, urobí sa **len vyváženie bielej**.
- `rola == 'trener'`: len vyváženie bielej a strop sýtosti (body 2 a 5).

**Unit test `TestZjednotenie`:**

- syntetický šedý obrázok s nádychom R/B 0,90 a jasom 80 má po úprave R/B neutrálnych pixelov 1,06 ± 0,03 a priemer L 110 ± 8;
- obrázok s jasom 20 sa jasom nezmení (± 3);
- funkcia nepoužíva numpy (`'numpy' not in sys.modules` po importe `fotky` v čistom interpreteri).

### 7.2 Výber záberov a orezy

**Zdroje:**

- originály: `/root/.claude/uploads/e4fc08a7-9804-506e-a6e2-06fd64c3d915/<kód>-image.jpg` (1932 × 2576);
- kódy a ďalšie zdroje: `redesign/audit-media/inventar.csv` (stĺpce `kod`, `zdroj`);
- bar: `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/gymfoto/bar-*-orig.png` podľa stĺpca `zdroj`.

**Orezy:**

- `t` = 4 : 5 s parametrami šírka (podiel šírky originálu), x (stred 0–1) a top (podiel výšky);
- `w` = 16 : 9 na plnú šírku od `top`.

Tabuľka sa zapíše do `nastroje/media/orezy.json` vo formáte `{id: {zdroj, t:{sirka,x,top,sirky}, w:{top,sirky}}}`.

| ID | Originál | `t` šírka/x/top | `t` šírky | `w` top | `w` šírky | Použitie |
|---|---|---|---|---|---|---|
| `funkcna-zona-4` **(nové)** | a08cf80a | **,84 / ,54 / ,21** *(Opravy pred B4; pôvodne 1,00 / ,5 / ,04)* | 640, 1080, 1600 | **,28** | 960, 1920 | úvod na počítači (bez nápisu susednej firmy; LED strop, rig, dráha, maľba GYM, tabuľa GYM KLUB) a od B2 aj na telefóne (`t`: LED strop, rig, maľba GYM, dráha) |
| `funkcna-zona-7` | 4f66d594 | 1,00 / ,5 / ,00 | 640, 1080, 1600 | ,22 | 960, 1920 | *(od B2 rezerva: v okne nápis „SATELITNÁ TECHNIKA“; pôvodne úvod na telefóne, náhľad „Sila a postava“)* |
| `funkcna-zona-5` | 101780bb | ,86 / ,5 / ,16 | 640, 1080, 1600 | ,38 *(B1)* | 960, 1920 | *(rezerva: v okne plagáty „ANTIK“, „namiSAT“; pôvodne medzihra)* |
| `hlavna-sala-1` | ded57978 | ,86 / ,5 / ,12 | 640, 1080, 1600 | ,30 | 960, 1920 | esej 1 |
| `volne-vahy-2` | 750d9d90 | ,86 / ,5 / ,14 | 640, 1080, 1600 | ,32 | 960, 1920 | esej 2, od B2 aj náhľad „Sila a postava“ |
| `stroje-4` | 4c899013 | ,86 / ,5 / ,12 | 640, 1080, 1600 | ,24 | 960, 1920 | esej 3 |
| `hlavna-sala-4` | 1a601891 | ,86 / ,5 / ,12 | 640, 1080, 1600 | ,34 *(B1)* | 960, 1920 | *(od B3 Detaily, vysoká)*; pôvodne esej 4 |
| `kardio-1` | ca5cd7a4 | ,86 / ,5 / ,12 | 640, 1080, 1600 | ,36 | 960, 1920 | esej 5 |
| `hlavna-sala-3` | e604ab34 | ,86 / ,5 / ,12 | 640, 1080 | ,32 | 960, 1920 | Detaily (široká) |
| `stroje-3` | 31539524 | ,86 / ,5 / ,12 | 640, 1080 | ,32 | 960, 1920 | Detaily (široká) |
| `jednorucky-1` | 4a8527d5 | ,86 / ,5 / ,12 | 640, 1080 | – | – | Detaily |
| `u-38047dcd` | 38047dcd | ,86 / ,5 / ,12 | 640, 1080, **1600** | **,24** | **960, 1920** | *(Opravy pred B4)* medzihra; z Detailov vypadol |
| `volne-vahy-3` | b57b28e1 | ,86 / ,5 / ,12 | 640, 1080 | – | – | Detaily |
| `kardio-3` | 7729db43 | ,86 / ,5 / ,12 | 640, 1080 | – | – | Detaily |
| `volne-vahy-1` | ea0dcc02 | ,86 / ,5 / ,12 | 640, 1080 | ,30 | 960, 1920 | Duo |
| `stroje-2` | 30d967db | ,86 / ,5 / ,12 | 640, 1080 | – | – | Duo |
| `stroje-1` | 50b58cdb | ,86 / ,5 / ,12 | 640, 1080 | – | – | Kde začať |
| `tatami-3` | b95c2f9e | ,86 / ,5 / ,12 (porovnať s dnešným orezom na hárku) | 640, 1080 | – | – | Kde začať |
| `mma-1-32` | `zdroj` riadku „panda-sala-1 (= mma-1)“ v `inventar.csv` | 3 : 2 celý záber (1200 × 800) | 640, 1200 | – | – | Kde začať |
| `bar-pult` | bar-1 (`gymfoto`) | dnešný orez 4 : 3, len gradácia | 640, 1080 | – | – | Bar |
| `bar-posedenie` | bar-6 (`gymfoto`) | dnešný orez 4 : 3, len gradácia | 640, 1080 | – | – | Bar |

*Zdroj pravdy pre orezy je `nastroje/media/orezy.json`. Okrem riadkov označených vyššie posunul B1 hornú hranu `w` podľa pravidla „viac stropu“: `stroje-4` ,34, `kardio-1` ,40, `hlavna-sala-3` ,36, `stroje-3` ,37, `volne-vahy-1` ,37 (IMPLEMENTACIA-POZNAMKY › B1 › odchýlka 5).*

**Kontrola orezov (povinná pred exportom):**

- Skript urobí kontaktný hárok `redesign/overenie/orezy-harok.jpg` (každý orez 480 px a vedľa súčasná webová verzia).
- Ak nový orez ukazuje viac stropu ako súčasný, `top` sa posunie o +0,04 až +0,10 a zapíše do `orezy.json`.
- Ak orez ukazuje človeka (aj v zrkadle) alebo čitateľný nápis cudzej firmy, záber sa nepoužije a zapíše sa do poznámok.
- Úvod (`funkcna-zona-4` w) skontrolovať výrezom 100 % na zrkadlá vpravo (v tejto kontrole sú čisté).

**Zostávajúce fotky v katalógu bez zmeny** (rezerva pre majiteľa): `funkcna-zona-2`, `funkcna-zona-3`, `hlavna-sala-5`, `kardio-2`, `mma-1`, `bar-kavovar`, `bar-stolicky`, `bar-kresla`. Prečistiť ich gradáciou je voliteľné (P3).

### 7.3 Nástroj `nastroje/media/priprav_fotky.py` (ručne, nie v CI)

- **Spustenie:** `python3 nastroje/media/priprav_fotky.py --zdroj /root/.claude/uploads/e4fc08a7-9804-506e-a6e2-06fd64c3d915 --gymfoto <cesta> [--id ID …] [--harok redesign/overenie/orezy-harok.jpg]`.
- **Postup pre každé id:**
  1. načítať originál;
  2. `zjednot()`;
  3. orez podľa `orezy.json`;
  4. pre každú šírku `LANCZOS`;
  5. uložiť `assets/img/f/{id}[-w]-{šírka}.{avif,webp,jpg}`: AVIF `quality=50, speed=6` (úvod `t-1600` `quality=42`), WebP `quality=78, method=6`, JPG `quality=82, optimize, progressive`, **bez metadát** (žiadne EXIF a GPS).
- **Kontroly:** skript na konci vypíše tabuľku veľkostí a skontroluje rozpočet AVIF zo 7.4. Pri prekročení zníži AVIF kvalitu o 4 (najviac 2×) a ohlási to. Záložné WebP a JPG sa neznižujú (pozri 7.4).
- **Ďalší nástroj:** `nastroje/media/metriky_pisma.py` (2.3).

### 7.4 Rozpočet veľkostí (AVIF)

| Sada | Najviac |
|---|---|
| úvod na počítači: `-w-1920` fotky `uvod.foto` (dnes `funkcna-zona-4`) | 200 kB |
| úvod na telefóne: `-1600` fotky, ktorú úvod na telefóne naozaj ukazuje (`uvod.foto_telefon`, inak `uvod.foto`; dnes `funkcna-zona-4`), AVIF kvalita 42 | 150 kB |
| `-w-1920` (ostatné) | 190 kB |
| `-w-960` | 70 kB |
| `-1600` | 160 kB |
| `-1080` | 110 kB |
| `-640` | 45 kB |
| plagát videa (AVIF, šírka 576) | 30 kB |

Rozpočet platí pre AVIF. **Záložné WebP a JPG** (len pre prehliadače bez AVIF) majú pevnú kvalitu zo 7.3 (WebP 78, JPG 82), **neznižujú sa** (`MAX_KROKOV` webp/jpg = 0) a **nemajú pomerový limit voči AVIF** *(rozhodnutie orchestrátora 15. 10. 2026; pôvodne „WebP najviac 1,4× AVIF, JPG najviac 2,2× AVIF“, čo sa so 7.3 súčasne splniť nedalo)*.

**`sizes` podľa skutočných šírok:**

| Prvok | `sizes` |
|---|---|
| úvod `t` | `(orientation: portrait) 80svh, 100vw` |
| úvod `w` | `100vw` |
| `.pl-w` | `100vw` |
| `.pl-s` | `(max-width:760px) calc(100vw - 32px), min(46vw, 620px)` |
| `.pl-p` | `(max-width:760px) 78vw, min(32vw, 440px)` |
| Detaily | `(max-width:860px) 240px, 336px` (vysoká), `(max-width:860px) 450px, 630px` (široká) |
| Bar | `(max-width:760px) 100vw, 50vw` (široká) |
| Duo | `(max-width:760px) calc(100vw - 32px), 600px` |
| náhľad Kde začať | `min(30vw, 420px)` |
| tréner | `(max-width:639px) 72px, (max-width:1023px) 30vw, 300px` |

Všetky fotky pod zlomom majú `loading="lazy" decoding="async"` a atribúty `width`/`height`.

### 7.5 Videá

- **Zápasenie:** `assets/video/zapasenie.mp4` (2,1 MB, 18 s) prekódovať cez `ffmpeg -i zapasenie.mp4 -c:v libx264 -preset slow -crf 26 -profile:v high -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 96k`, rozmer bez zmeny 576 × 720. Cieľ ≤ 1,2 MB. WebM: `libvpx-vp9 -crf 36 -b:v 0 -row-mt 1 -c:a libopus -b:a 64k`, ≤ 0,9 MB.
- **MDS a Ladydefence:** bez zmeny.
- **Plagáty:** `assets/video/{zapasenie,mds,ladydefence}-poster.{avif,webp}` (šírka podľa videa, AVIF ≤ 30 kB) vedľa existujúcich `.jpg`. Ladydefence navyše náhľad `ladydefence-nahlad.{avif,webp,jpg}` 192 × 256.
- **Neprenášať:** príchodový film, panorámy, prehliadku 29 s, IMG_8989, WebGL hĺbku.

### 7.6 Logo a ikony

- `assets/img/gymklub-logo-tmave.svg` = kópia `redesign/znacka/logo-reverz-0dp.svg`. Overiť, že výplne sú len #e2412f a #f4f2ec a že obrys písmen sa pri 96 px nelíši od originálu (snímka 200 %).
- Favicon ostáva.

### 7.7 Mazanie z repozitára (v balíku B2, spolu s migráciou obsahu)

**Zmazať:**

- `assets/depth.js`, `assets/img/d/` (692 kB);
- písma z 2.3;
- fotky `assets/img/f/` týchto id (všetky šírky a formáty):
  - `u-66420587` (muž v zrkadle);
  - mäkké a nepoužiteľné: `u-b4be27d3`, `u-97b23fd1`, `u-0e350667`, `tatami-1`, `tatami-2`, `mma-2-card`, `mma-2`, `mma-2-32`;
  - `mma-live` (ľudia bez súhlasu);
  - mäkké: `funkcna-zona-6`, `funkcna-zona-1`;
  - snímky z videa: `vstup-1`, `recepcia-1`, `terasa-1`;
  - `bar-napoje`.
- Z `.pages.yml` súčasne odstrániť ich hodnoty zo všetkých výberových zoznamov.

`git grep` na každé id nesmie po zmazaní nič nájsť okrem `PRODUKCIA`/návodov.

### 7.8 Dofotiť (zoznam pre majiteľa, nič sa negeneruje)

- recepcia a pult;
- šatne a sprchy;
- ľudia pri tréningu so súhlasom (hlavná sála, funkčná zóna pod LED, lekcia na tatami);
- vlastné zábery sály Panda;
- široké zábery na šírku zo statívu vo výške asi 1,3 m;
- originály fotiek baru (nie snímky obrazovky) s vypnutým televízorom;
- pred fotením upratať popolníky, bundy na rigoch a ľudí v zrkadlách.

---

## 8. CMS, obsah, generátor, testy

Zmeny `.pages.yml`, `obsah/*.json`, `nastroje/testdata/obsah/*.json`, `nastroje/zostav.py`, `nastroje/fotky.py` a testov idú **v jednom commite**.

**Po migrácii je `nastroje/testdata/obsah/` bajtovo totožný s `obsah/`.** Doslovné tvrdenia testov sa upravia na nové hodnoty (8.5).

### 8.1 Mená položiek CMS sa nemenia (len `label`)

- `texty-uvod`: label „Úvod, výber cesty a pás s ponukou“ → „Úvod a výber cesty“.
- `texty-preco`: label „Prečo GYM KLUB, mostíky a funkčná zóna“ → „Prečo GYM KLUB a funkčná zóna“.
- Nová položka skupiny `texty`: `name: texty-rozhranie`, `label: Tlačidlá a popisky`, `path: obsah/texty.json`, `format: json`, `operations: { delete: false }`. Vlastní kľúč `rozhranie`.
- `test_poradie_menu` (len najvyššia úroveň) ostáva bez zmeny.

### 8.2 `.pages.yml`: presné zmeny

Každé nové pole má `label` aj `description` (`test_kazde_pole_ma_popisok`) a zoznamy majú `collapsible`.

**Komponenty:**

- **`foto_hlbka` → premenovať na `foto_siroka`.**
  - `label: Fotka`;
  - `description: „Fotky, ktoré majú verziu na šírku (počítač) aj na výšku (telefón). Novú fotku sem nahrať nejde.“`;
  - `values` = všetky kompletné fotky so sadou `t` aj `w`, popisky v dnešnom štýle;
  - nová fotka `funkcna-zona-4` má label „Funkčná zóna – celkový pohľad s LED stropom“.
- **Nový `ohnisko`:**
  - `type: select`, `label: Výrez fotky`;
  - `description: „Ktorá časť fotky ostane viditeľná, keď ju web oreže (napr. na telefóne). Ak neviete, nechajte Stred.“`;
  - `default: stred`;
  - `values`: `stred` (Stred), `hore` (Horná časť), `dole` (Dolná časť), `vlavo` (Ľavá časť), `vpravo` (Pravá časť).
  - Mapovanie v `zostav.py`: `OHNISKA = {'stred':('50%','50%'), 'hore':('50%','20%'), 'dole':('50%','78%'), 'vlavo':('25%','50%'), 'vpravo':('75%','50%')}`. Chýbajúca hodnota = `stred`.
- **`foto_na_vysku`, `foto_mozaika`:** aktualizovať hodnoty podľa katalógu (pridať `funkcna-zona-4`, `stroje-3` a `hlavna-sala-3` so sadou `t`, `mma-1-32`; odstrániť zmazané).
- **`dlazdica.popis`:** `description` = „Ukáže sa len pod zväčšenou fotkou, nie na fotke. Napíšte, na čo miesto slúži, nie čo je na fotke.“

**`texty-uvod`:**

- Odstrániť pole `pas_ponuky` (celé).
- `uvod.foto`: `component: foto_siroka`, `label: „Fotka úvodu (počítač)“`.
- Nové `uvod.foto_telefon`:
  - `component: foto_na_vysku`, `required: false`;
  - `label: „Fotka úvodu na telefóne“`;
  - `description: „Nepovinné. Ak je prázdne, na telefóne sa použije verzia na výšku fotky úvodu.“`.
- Nové `uvod.ohnisko_pocitac` a `uvod.ohnisko_telefon` (`component: ohnisko`, labely „Výrez na počítači“ a „Výrez na telefóne“).
- `cesta.karty[].foto` a `nova_foto`: `description` doplniť „Ukáže sa len na počítači pri prechode myšou nad kartou.“

**`texty-preco`:**

- Odstrániť `mostiky` (celé).
- `preco.karty[]`: odstrániť `foto`, `nova_foto`, `popis_fotky`.
- `funkcna_zona.foto`: `component: foto_siroka`.
- Nové `funkcna_zona.ohnisko` (`component: ohnisko`).

**Nadpisy sekcií v menu:**

- `*.nadpis_maly` v `priestor`, `treningy`, `treneri`, `rozvrh`, `cennik`, `otazky`, `kontakt`: `options.maxlength: 16`;
- `description` = „Krátky štítok nad nadpisom. Zobrazí sa aj v menu, 1–2 slová.“

**Popisy viazané na starý dizajn:**

- Zmazať 8 zmienok „pred ním je číslo 0X“.
- `film`: `description` = „Hlavné zábery priestoru. Poradie určuje rozloženie: 1. fotka ide cez celú šírku (ak má verziu na šírku), 2. vedľa textu, 3. a 4. vedľa seba, potom sa to opakuje. Odporúčame 4 až 7 fotiek. Text píšte o tom, na čo miesto slúži, nie čo je na fotke.“
- `mozaika`: zmazať „4 stĺpce, súčet 8“, nový `description` = „Ďalšie zábery v páse, ktorý sa posúva do strán. Široká fotka je v páse širšia.“
- `bar.fotky`: `description` = „Na počítači 4 miesta v rade, na telefóne 2 (široká = 2 miesta, vysoká = 1). Súčet 4 alebo 8 je bez diery.“
- `cennik.karty[].tlacidlo`: `description` doplniť „Ak majú všetky karty rovnaké tlačidlo, ukáže sa raz pod cenami.“

**`priestor` (súbor `obsah/priestor.json`, položka „Fotky priestoru a baru“):**

- `film[].foto`: `component: foto_na_vysku` (namiesto `foto_hlbka`).
- Nové `film[].nova_foto` (`component: nova_foto`; generátor ju spracuje v role `karta`, takže nikdy nejde do širokej plochy).
- Nové `film[].ohnisko` (`component: ohnisko`).
- Nové `bar.nadpis_maly`: string, `required: true`, `maxlength: 16`, `default: Bar`, `label: „Štítok baru“`, `description: „Krátky štítok nad nadpisom baru. Zobrazí sa aj ako odkaz v pätičke.“`

**Nové `rozhranie` (položka `texty-rozhranie`):**

- typ `object`;
- všetky polia `type: string`, `required: true`, `options.maxlength: 40`, `default` = hodnota v tabuľke;
- popis každého poľa je „Text na stránke: <kde>“.

| Pole | Hodnota | Kde |
|---|---|---|
| `preskocit` | Preskočiť na obsah | odkaz pre klávesnicu na začiatku |
| `oznam` | Oznam | štítok oznamu |
| `zavolat` | Zavolať | dok, kontakt |
| `navigovat` | Navigovať | hlavné tlačidlo v kontakte |
| `kopirovat_adresu` | Kopírovať adresu | kontakt |
| `adresa_skopirovana` | Adresa skopírovaná | kontakt po kliknutí |
| `instagram` | Instagram | kontakt, pätička |
| `facebook` | Facebook | kontakt, pätička |
| `dok_prvy_raz` | Ako prísť prvýkrát | dok v úvode |
| `dok_cennik` | Cenník a vstup | dok pod úvodom |
| `filter_vsetci` | Všetci | filter trénerov |
| `trening` | Tréning: | karta trénera |
| `trener_viac` | Viac o trénerovi | karta trénera |
| `zvuk` | Zvuk | videá |
| `mapa_zobrazit` | Zobraziť mapu | kontakt |
| `prava` | Všetky práva vyhradené. | pätička |

Zástupné značky v nových poliach fungujú automaticky.

**Obsah (zmeny hodnôt v `obsah/` aj `testdata/`):**

- `texty.uvod.foto` = `funkcna-zona-4`; `foto_telefon` = `funkcna-zona-7`; `ohnisko_pocitac` = `stred`; `ohnisko_telefon` = `stred`.
- `texty.funkcna_zona.foto` = `funkcna-zona-5`; `popis_fotky` = „Funkčná zóna GYM KLUBU s červeným rigom Life Fitness, kettlebellmi a vzduchovým bicyklom“; `ohnisko` = `stred`.
- `texty.cesta.karty`: fotky podľa 4.3; `karty[1].stitok` = „Bez čakania na stojan“.
- `texty.treningy.karty[0].foto` = `volne-vahy-1`.
- `texty.priestor.uvod` podľa 4.5.
- `priestor.film` podľa 4.5 (5 položiek); `mozaika` a `mozaika_text` podľa 4.6; `bar.nadpis_maly` = „Bar“; `bar.fotky` = `bar-pult` (siroka) + `bar-posedenie` (siroka) s dnešnými popismi pri týchto id.
- `texty.rozhranie` podľa tabuľky.
- Odstrániť kľúče `texty.pas_ponuky`, `texty.mostiky`, `texty.preco.karty[].foto|nova_foto|popis_fotky`.
- `NAVOD-PRE-ONDREJA.md` a `NASTAVENIE-CMS.md` upraviť:
  - nové polia, ohnisko, fotka na telefóne;
  - čo zmizlo (bežiaci pás, mostíky, fotky pri Prečo);
  - Detaily sú pás;
  - bar má 4 miesta v rade;
  - „píšte účel, nie čo je na fotke“.

### 8.3 Generátor `nastroje/zostav.py` a `nastroje/fotky.py`

**`fotky.py`:**

- pribúda `zjednot(im, rola)` (7.1) a jej volanie v `spracuj()` pred orezom;
- `lqip(koren, sada_w, sada_t)` berie dve sady;
- zrušiť `LQIP_V_CSS`;
- zrušiť `Foto.hlbka_w`, `hlbka_t`, `ma_hlbku` a čítanie `assets/img/d/`;
- `PLNA_FOTKA` ostáva.

**`zostav.py`:**

- `VERZOVANE` bez `'depth'`.
- `foto_hlbka()` → `foto_siroka(subor, miesto, kluc, fid)`: vyžaduje kompletnú fotku so sadou `t` aj `w`. Chyba: „fotka „X“ nemá verziu na šírku aj na výšku.“
- **Úvod:**
  - `hero = foto_siroka(uvod.foto)`;
  - `hero_t = katalog[uvod.foto_telefon].t`, ak je pole vyplnené, kompletné a má `t`; inak `hero.t`;
  - `ctx['hero_fx']` z ohnísk;
  - `ctx['lqip']` sa generuje **vždy** (`fotky.lqip(koren, hero.w, hero_t)`).
- **Medzihra:** `medzihra = foto_siroka(funkcna_zona.foto)` + ohnisko. Kľúč `band` v kontexte sa premenuje na `medzihra`.
- **Film:** každá položka `foto_karta(..., rola='karta')` (sada `t`, alebo nahratá) + `w` z katalógu, ak existuje + ohnisko. Výstup `film = [{d, t, w, plna, plna_w, plna_h, fx, fy}]`.
- **`dosky(film)`:** čistá funkcia na úrovni modulu, testovateľná.
  ```python
  def dosky(polozky):  # polozky: list s .w (Sada|None)
      out, cyklus, i, strana = [], ['w','s','p'], 0, 'l'
      while i < len(polozky):
          typ = cyklus[len(out) % 3]
          if typ == 'w' and not polozky[i]['w']: typ = 's'
          if typ == 'p' and i + 1 >= len(polozky): typ = 's'
          if typ == 'p': out.append({'typ':'p','polozky':polozky[i:i+2]}); i += 2
          elif typ == 's': out.append({'typ':'s','strana':strana,'polozky':[polozky[i]]}); strana = 'r' if strana=='l' else 'l'; i += 1
          else: out.append({'typ':'w','polozky':[polozky[i]]}); i += 1
      return out
  ```
- **Mozaika:** `mozaika` (Detaily) bez `_vypln_mozaiku` a bez varovania o súčte; `bar` s `_vypln_mozaiku('bar.fotky', bar)` ako dnes.
- **Preco:** príprava `preco` už nečíta fotky (`ctx['preco'] = TX['preco']['karty']`).
- **Lekcie:** pribúda `kedy_riadky = [f'{spoj_a(...)} {od}–{do}' for …]`; `kedy` ostáva (JSON-LD).
- **Cenník:** `ceny['spolocne_tlacidlo'] = karty[0]['tlacidlo']`, ak všetky karty majú rovnaký `tlacidlo.text` aj `tlacidlo.odkaz` a text nie je prázdny, inak `None`.
- **`gk_data`:** doplniť riadok `  GK.VERZIA = 2;` hneď pred `GK.HOURS`.
- **`R = TX['rozhranie']`** do kontextu.
- **`_skontroluj_html`:** pribúda kontrola kotiev. Pre každé `href="#x"` s neprázdnym `x` musí existovať `id="x"`. Inak `self.h.chyba('sablona/index.html', 'výsledná stránka', '', f'odkaz #{x} nevedie na žiadnu časť stránky.', 'Pre vývojára: …')`. Konštanta `ODKAZY_KOTVY` sa použije v teste 8.5.
- **Ostáva:** `nadpis()` bez zmeny; `h1_vzorka` ostáva (načítanie písma Oswald).

### 8.4 Šablóna a makrá

**`sablona/index.html`:** prepísať podľa 3.1 a 4, so zachovaním hákov 1.1. Každé pole CMS sa niekde vypíše; kontroluje to test 8.5. Napevno písaný viditeľný text nahradiť `R.*`.

**`sablona/makra.html`:**

- `zdroje()` ostáva.
- Nové `pic(s, sizes, alt, eager=False, cls='')` vracia `<picture>` + `<img>` (`width`/`height` z najväčšej varianty, `loading`/`decoding`).
- Nové `shot(z, typ, fx, fy)` (4.5).
- `gal(g, skupina)`:
  - `figure class="gal-f gal-{w|t}{ gal-x} rv"` (poradie atribútov: `class`, `style`, `data-full`, `data-w`, `data-h`, `data-cap`, `data-group`);
  - vnútri `div.ph.rv-img > button.ph-btn > picture`;
  - **bez** `figcaption` a `data-par`.
- `coach_face()`: odznak MDS presunúť k menu.
- Zmazať `pic_why`, `pic_duo`, `pic_cesta` (nahrádza ich `pic`) a `ticker`.

**Ladydefence:** `button.mds-lady-open[data-lb-video][data-src="assets/video/ladydefence.mp4"][data-src-webm="…webm"][data-poster="…-poster.jpg"][aria-haspopup=dialog]`, `aria-label` = `t(TX.mds.ladydefence_video_popis)`.

### 8.5 Testy

**`nastroje/test_zostav.py` – úpravy:**

- `test_subory_webu`: `assets/img/f/vstup-1-640.avif` → `assets/img/f/hlavna-sala-1-640.avif`; pribúda `assets/img/gymklub-logo-tmave.svg`.
- `test_obsah_a_pocty`:
  - Riadok `<span class="reel-of">/ 11</span>` nahradiť tvrdením `h.count('<figure class="shot') == len(film v testdata)`, kde počet sa načíta z `testdata/obsah/priestor.json`, nie napevno.
  - `'Od vchodu po terasu…'` → `'Pozrite si klub ešte pred prvou návštevou.'`.
  - `'Šesť ďalších miest, od jednoručiek po multipress.'` → `'Šesť ďalších miest. Detaily, ktoré si všimnete'`.
  - `<span class="cesta-m">11 záberov priestoru</span>` → `<span class="cesta-m">Bez čakania na stojan</span>`.
  - `<p class="lesson-when">Ut a Št 17:00–19:00 · So 13:00–15:00</p>` → `<p class="lesson-when"><span>Ut a Št 17:00–19:00</span><span>So 13:00–15:00</span></p>`.
  - Ostatné doslovné kúsky (H1 `Vstup 6 €`, `chip-count`, `lessons-h`, `coach-when`, `mds-when li`, `price-n`, `<td>3,50 €</td>`, `data-price="3.5"`, H2 cenníka) **ostávajú bez zmeny**.
- `test_odkazy_na_skripty_s_verziou`: zmazať riadok s `depth.js`; pridať `assertNotIn('depth.js', self.html)`.
- `test_udaje_pre_skripty`: doplniť `assertIn('GK.VERZIA = 2;', self.html)` a `assertIn('GK.VERZIA !== 2', app)`.
- `test_neznama_fotka`: upraviť na `cesta.karty[0].foto = 'neexistuje-9'`, hláška obsahuje label položky „Úvod a výber cesty“ a `neexistuje-9`.
- `test_fotka_bez_hlbkovej_mapy_vo_filme` → `test_uvod_bez_sirokej_verzie`: `uvod.foto = 'kardio-2'` zlyhá s `kardio-2` a „na šírku aj na výšku“.
- `test_jedna_fotka_navyse_v_bare_bez_diery`:
  - pridáva sa `d['bar']['fotky'][1]`;
  - `bar.count('class="gal-f') == 3`;
  - `'gal-x rv" style="--sd:4;--sm:2"'`;
  - `'súčet miest je 6'`.
- `test_katalog_a_pages_yml_sa_zhoduju`: `foto_siroka` = kompletné so sadou `t` aj `w`; `foto_hlbka` sa ruší.
- `TestBezpecnostTextu`: bez zmeny (H2 Prečo ostáva cez `nadpis()`).

**Nové testy v `test_zostav.py`:**

| Test | Overuje |
|---|---|
| `test_dosky` | Syntetické položky s/bez `w`, dĺžky 1–9: každá položka práve raz, `p` má 2, `w` má sadu `w`, strany `s` sa striedajú, žiadna osamelá dvojica. |
| `test_kotvy_maju_ciel` | V hotovom HTML má každé `href="#x"` cieľ `id="x"`; každá kotva z `ODKAZY_KOTVY` a z `components.odkaz` v `.pages.yml` existuje v HTML. |
| `test_kontrola_kotiev_zlyha` | `z._skontroluj_html('<a href="#nie-je">x</a>')` pridá chybu. |
| `test_kazdy_text_rozhrania_sa_vypise` | Každé pole `rozhranie` dostane jedinečnú hodnotu „RZ-<pole>“, po zostavení je každá v HTML. |
| `test_spolocne_tlacidlo_cennika` | Testdata: `price-cta` raz a v kartách žiadne tlačidlo; po zmene textu tlačidla 1. karty sú v kartách 3 × `class="tlink`. |
| `test_fotka_na_telefon` | `uvod.foto_telefon=''` → preload `max-width: 860px` obsahuje `funkcna-zona-4-`; s `funkcna-zona-7` obsahuje `funkcna-zona-7-`. |
| `test_ohnisko` | `film[0].ohnisko='hore'` → `--fy:20%` v prvom `figure.shot`. |
| `test_haky_v_html` | Pozitívne háky z 1.1 sú v HTML; negatívne neexistujú: `depth.js`, `<canvas`, `class="ch"`, `ticker`, `bridge`, `data-tilt`, `data-par`, `data-depth`, `btn-volt`, `reel-`, `class="cut"`. |
| `TestZjednotenie` | 7.1 |
| `test_css_pravidla` | `style.css`: `!important` ≤ 5; regex `prefers-reduced-motion\s*:\s*reduce` presne 1×; každý výskyt `infinite` je v deklarácii s `ping`; žiadne `backdrop-filter`, `GK Hero`, `Fraunces`, `JetBrains`, `Archivo`, `Bebas`, `--volt`; `fonts.css` bez týchto rodín; gzip `style.css` ≤ 22 kB, `app.js` ≤ 14 kB (`gzip.compress(…, 9)`). |

**`nastroje/test_prehliadac.mjs`:** 9 sekcií ostáva. `dlhe`, `bar`, `xss`, `komentar` a `cache` ostávajú. Spúšťa sa **dvakrát**, s `../lupa-vzor` aj s `../lupa-vzor-cms` (zmrazený 396f446).

**`nastroje/porovnaj_so_vzorom.mjs`:**

- Pridať prepínač `BEZ_PIXELOV=1`: preskočí krok 1 (pixely aj výška). Vzor je `redesign/audit-cms/skripty/porovnaj-bez-pixelov.mjs`.
- `SEKCIE` bez `.ticker`, `.bridge`, `.band`, s `.opener`.
- `ZIVE`: `'#cesta'` → `'#cesta [data-live]'` (texty kariet sa zmenili zámerne).
- Pri `BEZ_PIXELOV` sa v interakciách lightboxu porovnáva len „otvoril sa a má neprázdny popisok“. Filter, dni, odkazy Tréner a otázky sa porovnávajú celé.

---

## 9. Výkonnostný rozpočet

| Metrika | Dnes | Cieľ (akceptácia) |
|---|---|---|
| Lighthouse mobil / počítač (medián 3 behov) | 86 / 69 | ≥ 90 / ≥ 98; A11y, BP, SEO 100 |
| LCP mobil (simulácia) | 4,06 s | ≤ 2,5 s |
| LCP počítač | 0,81 s | ≤ 1,0 s |
| TBT mobil / počítač | 35 / 13 822 ms | ≤ 150 / ≤ 100 ms |
| CLS vrátane otvorenia `/#cennik` | 0,70 pri kotve | ≤ 0,02 |
| `index.html` gzip | 24,2 kB | ≤ 25 kB |
| `style.css` gzip | 32,9 kB | ≤ 22 kB (≤ 1 000 riadkov) |
| `app.js` gzip | 12 + 5,6 kB | ≤ 14 kB |
| Písma pred prvým vykreslením | 9 súborov, 211 kB | 3 súbory, ≤ 70 kB |
| Logo v hlavičke | 22,5 kB | ≤ 15 kB gzip |
| Fotka úvodu (AVIF) | 268 kB mobil | mobil ≤ 150 kB, počítač ≤ 200 kB |
| Prenos do nečinnosti, mobil | 993 kB | ≤ 600 kB (plagáty sa nesťahujú) |
| Prenos po prejdení celej stránky | 9,05 / 8,3 MB | mobil ≤ 3,5 MB (videá len po ťuknutí), počítač ≤ 5 MB |
| Plynulosť (`audit-pohyb/skripty/meraj.mjs`, CPU 4×, gesto 2 000 px/s) | 26,8 / 33,3 fps | ≥ 55 fps na počítači aj telefóne; ≤ 1 % snímok > 50 ms v každej sekcii |
| Nečinnosť hlavného vlákna (`necinnost.mjs`, CPU 4×) | 63–82 % | ≤ 6 % |
| Vrstvy kompozítora | 81–110 | ≤ 40 |
| Nekonečné animácie pri nečinnosti | 12 | len `ping`, len bodky v obraze |
| Kontexty WebGL a `<canvas>` | 2–3 | 0 |
| Výška stránky | 27,3 / 35,5 obrazovky | ≤ 18,5 / ≤ 23 |

*(B4: plynulosť hlavného vlákna pri CPU 4× bez WebGL 38,9–40,3 fps na počítači a 47,4–50,0 fps na telefóne – cieľ ≥ 55 fps nie je splnený; snímky kompozítora 56,9 / 59,5 za s. Nečinnosť 0–1 %, vrstvy ≤ 35, CLS všetkých kotiev 0. Meranie, porovnanie so stavom pred B4 a so vzorom a rozbor sú v `IMPLEMENTACIA-POZNAMKY.md`, časť B4; o prahu a spôsobe merania rozhodne orchestrátor.)*

**Opatrenia:**

- preload len fotky úvodu (2 riadky) a 3 písiem;
- žiadne `content-visibility`;
- výšky stránky nezávisia od JS (`--n` filmu zaniká);
- plagáty videí sú lenivé `<img>`;
- iframe mapy až pri priblížení alebo kliknutí.

---

## 10. Prístupnosť

- **Kontrast** podľa 2.1. Text na fotkách overí 11.3.
- **Fokus:** `:focus-visible` podľa 2.6 na všetkom interaktívnom. `outline` sa nikdy nemaže bez náhrady.
- **Klávesnica:**
  - skip link na `#main`;
  - `aria-current` v menu;
  - po skoku fokus na nadpis sekcie;
  - menu: Esc, fokus späť na burger;
  - lightbox: fokus v dialógu (natívny `showModal`), Esc, ←/→, Home/End, návrat fokusu na tlačidlo zdroja;
  - pás Detaily: dlaždice sú tlačidlá dosiahnuteľné tabulátorom (natívne sa posunú do obrazu), šípky s `aria-controls`;
  - rozvrh: ←/→ (ako dnes).
- **Dotykové ciele** ≥ 44 × 44 px na ≤ 860 px: čipy, `tt-go`, `.tt-day` (56), `lv-sound`, `lv-play`, telefóny trénerov a MDS, odkazy pätičky, adresa v úvode, `summary` v otázkach a pri trénerovi, šípky pásu, tlačidlá lightboxu (48). Výnimka WCAG: odkazy vnútri súvislého textu odseku.
- **Sémantika:**
  - klikateľné fotky sú `<button>` vo `figure` (rieši `aria-allowed-role` a `label-content-name-mismatch`);
  - `a.brand` **nemá** `aria-label`. Prístupný názov odkazu dáva `img alt` = `P.nazov_cely`, čím zmizne nález Lighthouse `label-content-name-mismatch`;
  - cenník má `th scope=row`;
  - detail trénera a otázky sú natívne `details`;
  - `figure.lv` video má `aria-label` z CMS.
- **Pohyb:** obmedzený pohyb znamená statickú stránku a okamžité skoky. Žiadny automatický pohyb dlhší ako 5 s okrem stavovej bodky (WCAG 2.2.2; bežiaci pás sa ruší). Video v slučke má viditeľné ovládanie (klik na video pauzuje, ako dnes).
- **Jazyk a texty:** `lang="sk"`, diakritika, nezlomiteľné medzery z generátora ostávajú.

---

## 11. Overovanie

### 11.1 Príprava (raz, B0)

```bash
# miesto na disku: vyrovnávacie pamäte pip a uv sú obnoviteľné (~440 MB)
rm -rf /root/.cache/pip /root/.cache/uv
rm -rf /tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/lupa/_site
df -h /                                   # musí byť ≥ 0,6 GB voľných
cd /tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/lupa
git status --short                         # prázdne, HEAD 396f446
python3 nastroje/zostav.py --vystup ../lupa-vzor-cms   # ZMRAZENÝ VZOR pred akoukoľvek zmenou
git switch -c redizajn-2026-10
```

Ak po vyčistení vyrovnávacích pamätí nie je ≥ 0,6 GB: zmazať `redesign/audit-desktop/*-cela-stranka-*.png` (celostranové zlepence, ~13 MB) a ostatné PNG nad 1 MB previesť na JPG q85. Nič iné v scratchpade nemazať.

### 11.2 Zostavenie a testy (po každom balíku od B1)

```bash
cd …/lupa
python3 nastroje/zostav.py                                   # musí skončiť bez chýb
python3 -m unittest discover -s nastroje -p 'test_*.py'      # 100 % zelené
node nastroje/test_prehliadac.mjs ../lupa-vzor                # od B3
node nastroje/test_prehliadac.mjs ../lupa-vzor-cms            # od B3
BEZ_PIXELOV=1 node nastroje/porovnaj_so_vzorom.mjs ../lupa-vzor-cms _site ../redesign/overenie/porovnanie   # od B3
```

### 11.3 Nový `nastroje/test_vzhlad.mjs` (Playwright, ručne, nie v CI)

**Spustenie:** `node nastroje/test_vzhlad.mjs <priečinok _site> <výstup>`. Server spúšťa sám na voľnom porte (vzor `test_prehliadac.mjs`). Čas `?gk-at=2026-10-14T18:12`.

**Šírky × výšky:** 360 × 740, 390 × 844, 768 × 1024, 1024 × 768, 1440 × 900, 1920 × 1080 (telefóny s `isMobile`, `hasTouch`, DPR 3 pri 390 a DPR 2 pri 360).

**Kontroly:**

1. Žiadne vodorovné pretečenie: `scrollWidth ≤ clientWidth`.
2. Žiadne rozdelené slovo v `h1, h2, h3, h4, .shot-t, .cesta-t, .coach-name, .price-name`. Každé slovo cez `Range` musí mať `getClientRects().length === 1`.
3. Dotykové ciele ≥ 44 px pri šírke ≤ 860 px (`a, button, summary, [role=button]`, okrem `a` vo vnútri `p` s ďalším textom).
4. Žiadny viditeľný text pod 13 px (vypočítaná `font-size` rodiča každého neprázdneho textového uzla, okrem `.sr-only`).
5. `.price-tag` neprekrýva `.price-name` (prienik obdĺžnikov = 0).
6. Všetky `a[href^="#"]` majú cieľ.
7. Žiadny `canvas`, žiadny prvok s `backdrop-filter` ≠ `none`.
8. **Kontrast textu na fotke:**
   - pre `.hero-h`, `.hero-p`, `.opener .h2`, `.opener .lead` sa urobí snímka so `visibility:hidden` na texte;
   - vypočíta sa priemerná relatívna svetlosť pixelov pod obdĺžnikom textu;
   - kontrast s farbou textu musí byť ≥ 4,5 (odseky) a ≥ 3 (nadpisy);
   - pre H1 riadok 2 (`--red`) ≥ 3.
9. **Výška stránky** v obrazovkách podľa 3.2 (1440 ≤ 18,5, 390 ≤ 23).
10. **Pri `reducedMotion:'reduce'`:** po 1,5 s `document.getAnimations().length === 0`; všetky `.rv`, `.mask > *` a `.rv-img` majú vypočítanú `opacity` 1 a `translate` none; žiadne `video` nehrá.
11. **Bez obmedzenia pohybu:** po 4 s nečinnosti (raz v úvode, raz pri Cenníku) obsahuje `getAnimations()` len animácie s `animationName === 'ping'`. Ich počet sa rovná počtu bodiek s `.is-vis`, ktoré sú v obraze a v obale `.is-open`. Pri Cenníku je to spravidla 0 alebo 1 (bodka v hlavičke, ak je lišta viditeľná). *(Zmenené v B4: animácie s časovou osou skrolovania – odchod úvodu, prúžok postupu, parallax – sa nepočítajú; bez skrolovania stoja.)*
12. **CLS kotvy:** otvoriť `/?gk-at=…#cennik`, 3 s zbierať `layout-shift`, súčet ≤ 0,02.
13. **Snímky:**
    - celostránkové a po sekciách pri 390, 768, 1024 a 1440 (aj 360 a 1920) do `<výstup>/snimky/`;
    - snímky stavov pri 390 a 1440: otvorené menu, lightbox (prvý záber, krok do skupiny Detaily), filter „Bojové“, deň Sobota v rozvrhu, otvorená otázka, otvorený detail trénera;
    - časy `…T23:30` (zatvorené) a `2026-12-24T10:00` (sviatok) pre úvod, hlavičku a rozvrh.

Implementátor si **každú snímku prezrie** (nástrojom Read) a zapíše nájdené vady do `redesign/IMPLEMENTACIA-POZNAMKY.md`.

### 11.4 Výkon a pohyb

- Skripty z `redesign/audit-pohyb/skripty/` (prispôsobiť cestu k `_site` a port): `meraj.mjs` (CPU 4×, 1440 a 390), `necinnost.mjs`, `kotva_cls.mjs`, `obmedzeny_pohyb.mjs`, `trace.mjs`. Výsledky do `redesign/overenie/vykon/`. Prahy podľa 9.
- Lighthouse 3 behy mobil a počítač, medián, server s gzip (`redesign/audit-cms/skripty/gzip-server.mjs`). Prahy podľa 9.
- Vrstvy kompozítora: DevTools protokol `LayerTree` (ako v audite pohybu) pri úvode a pri Detailoch.

### 11.5 Ručné overenie (mimo kontajnera; zapísať ako odporúčanie do odovzdania)

- skutočný iPhone so Safari 18 (bez scroll-timeline) a 26.x;
- stredný Android s Chrome;
- prejdenie klávesnicou (menu, Kde začať, esej, lightbox, Detaily, filter, rozvrh, otázky, detail trénera);
- VoiceOver na úvode, eseji a lightboxe.

---

## 12. Pracovné balíky (poradie implementácie)

Každý balík končí zelenými testmi z 11.2 v rozsahu uvedenom pri balíku a zápisom do `redesign/IMPLEMENTACIA-POZNAMKY.md`. Ak je to dovolené, balík končí aj lokálnym commitom bez push.

### B0 Príprava prostredia a vzoru

**Cieľ:** miesto na disku, zmrazený vzor, prepínač porovnania a východiskové merania.

**Súbory:** `nastroje/porovnaj_so_vzorom.mjs` (len `BEZ_PIXELOV`, `SEKCIE`, `ZIVE` podľa 8.5), `../lupa-vzor-cms/`, `redesign/overenie/` (nový priečinok).

**Akceptácia:**

- `df` ≥ 0,6 GB voľných;
- `../lupa-vzor-cms/index.html` existuje a pochádza z 396f446;
- unittest 70/70;
- `test_prehliadac ../lupa-vzor` OK;
- `BEZ_PIXELOV=1 porovnaj` vzor proti vzoru dá 0 rozdielov.

### B1 Médiá a jednotná gradácia

**Cieľ:**

- `fotky.zjednot()` (len Pillow) + test;
- `priprav_fotky.py`, `orezy.json`, `metriky_pisma.py`;
- nové a pregenerované sady podľa 7.2 (bez mazania);
- tmavé logo;
- prekódované video a plagáty;
- kontaktný hárok;
- doplnenie nových id do výberových zoznamov v `.pages.yml`, aby test katalógu prešiel.

**Akceptácia:**

- unittest zelený (vrátane `TestZjednotenie` a `test_katalog_a_pages_yml_sa_zhoduju`);
- všetky sady z 7.2 kompletné (avif, webp, jpg) a `python3 nastroje/zostav.py --vypis-fotky` ich vypíše;
- veľkosti v rozpočte 7.4 (tabuľka zo skriptu priložená v poznámkach);
- `orezy-harok.jpg` prezretý: žiadni ľudia, žiadny cudzí nápis, menej stropu ako dnes;
- súbory bez EXIF (`PIL Image.getexif()` prázdne);
- `zapasenie.mp4` ≤ 1,2 MB a hrá (ffprobe);
- `gymklub-logo-tmave.svg` ≤ 15 kB gzip, len 2 farby.

### B2 Obsah, CMS, generátor a šablóna (štruktúra)

**Cieľ:** v jednom commite:

- `.pages.yml` (8.1, 8.2);
- `obsah/` a `testdata/obsah/` (bajtovo zhodné);
- `zostav.py`, `fotky.py` (8.3);
- `sablona/index.html`, `sablona/makra.html` (3, 4, 8.4);
- testy (8.5);
- mazanie (7.7);
- `fonts.css` (len 4 + 2 tváre);
- návody (8.2).

CSS a JS sa v tomto balíku nemenia okrem dvoch vecí: odstránenia `depth.js` a rozšírenia poistky v app.js na `if (!GK || !GK.GYM || !GK.TIMETABLE || GK.VERZIA !== 2)`. Kvôli tomu prechádza `test_udaje_pre_skripty`. Test `test_css_pravidla` sa pridá až v B3.

**Akceptácia:**

- `python3 nastroje/zostav.py` bez chýb a varovaní okrem známych;
- unittest 100 % zelený vrátane nových testov z 8.5 okrem `test_css_pravidla`, ktorý ešte neexistuje;
- `test_haky_v_html` zelený;
- `test_kotvy_maju_ciel` zelený;
- `git grep` na zmazané id a na `foto_hlbka|pas_ponuky|mostiky|depth` vráti len návody alebo históriu;
- `TestNezavislostOdObsahu` zelený.

### B3 Vizuálny systém a funkčné JS (bez pohybu)

**Cieľ:**

- nový `assets/style.css` (jedna vrstva, tokeny 2.x, rozloženia 4.x, bez pohybových prechodov okrem farieb);
- prepis `assets/app.js` s funkčnými modulmi z 6.2: `header` (bez animácie skrývania), `menu`, `activeNav`, `timetable`, `coaches` (bez VT), `lightbox` (otvorenie, zatvorenie, ďalší po `decode()`, bez FLIP), `strip`, `cestaPreview` (bez prelínania), `liveVideo`, `dock`, `copyAddr`, `mapEmbed`, `heroFit`, poistka `GK.VERZIA`;
- `reveal()` zatiaľ len pridá `is-in` všetkému.

**Akceptácia:**

- unittest 100 % vrátane novo pridaného `test_css_pravidla`;
- `test_prehliadac` s oboma vzormi OK;
- `BEZ_PIXELOV porovnaj`: živé texty a interakcie (filter 8×, dni 7×, Tréner, otázky, lightbox) bez rozdielov;
- `test_vzhlad.mjs` kontroly 1–9, 12 a 13 prejdú;
- snímky pri 390, 768, 1024 a 1440 prezreté a vady opravené;
- výška stránky v limite;
- grep `btn-volt|btn-ghost|reveal\b|data-tilt` v `sablona`, `assets` = 0.

### B4 Pohybový systém

**Cieľ:**

- tokeny 5.1 a jediný blok reduced-motion;
- odhalenia 5.3 (`rv`, `mask`, `rv-img` s čakaním na obrázok);
- otvorenie a odchod úvodu (5.4 #1–5, len CSS);
- lišta, menu, prúžok;
- skok cez View Transition (#11);
- filter cez VT (#26);
- lightbox FLIP, krok, ťah, video (#20–25);
- rozvrh, otázky, detail trénera (#27–29);
- parallax (#16);
- náhľad Kde začať (#17);
- videá (#31);
- mapa (#32);
- bodky (#33);
- dok (#34).

**Akceptácia:**

- `test_vzhlad.mjs` kontroly 10–12 prejdú;
- `meraj.mjs` ≥ 55 fps a ≤ 1 % snímok > 50 ms (1440 aj 390, CPU 4×);
- `necinnost.mjs` ≤ 6 %;
- vrstvy ≤ 40;
- `kotva_cls.mjs` ≤ 0,02;
- skok z každej položky menu a pätičky pristane na nadpise sekcie (snímka po 400 ms) a bez prázdnych rámov fotiek;
- lightbox: popisok sa nikdy neukáže nad starou fotkou (snímky 0/120/300 ms po šípke);
- pri `reduce` 0 animácií;
- unittest a `test_prehliadac` zelené.

### B5 Výkon a prístupnosť

**Cieľ:** splniť rozpočet 9 a body 10.

**Akceptácia:**

- Lighthouse mobil ≥ 90, počítač ≥ 98, A11y/BP/SEO 100 (medián 3 behov);
- LCP mobil ≤ 2,5 s, TBT podľa 9;
- prenos do nečinnosti mobil ≤ 600 kB, po celej stránke ≤ 3,5 MB;
- žiadne zlyhané informatívne audity `aria-allowed-role`, `label-content-name-mismatch`, `td-has-header`;
- prejdenie klávesnicou bez pasce, fokus vždy viditeľný.

### B6 Záverečná kontrola a odovzdanie

**Cieľ:**

- celá matica testov 11.2 až 11.4;
- finálne snímky do `redesign/overenie/final/` (390, 768, 1024, 1440, 1920; 3 časy);
- aktualizované `NAVOD-PRE-ONDREJA.md`, `NASTAVENIE-CMS.md`, `README.md`;
- zoznam rozhodnutí pre majiteľa (13) a zoznam dofotenia (7.8);
- lokálny commit bez push.

**Akceptácia:**

- všetky prahy z 9 a kontroly z 11.3 splnené a zapísané v `redesign/overenie/SUHRN.md`;
- `git status` čistý na vetve `redizajn-2026-10`;
- žiadny push.

---

## 13. Otvorené rozhodnutia majiteľa a riziká

### Rozhodnutia (implementácia má predvolenú voľbu, zmena je na jednom mieste)

1. **Logo v hlavičke:** biely nápis a červená činka na tmavom pozadí bez bielej kartičky (predvolené). Plnofarebné logo ostáva v pätičke. Návrat ku kartičke je jedna zmena v šablóne.
2. **Nadpis úvodu:** ostáva „Stačí prísť. Vstup 6 €.“ (predvolené). Alternatíva pre majiteľa v CMS: „Bez objednávania.“ ako druhý riadok, cena ostane v odseku a v cenníku.
3. **Fotky Panda Fight Club** (z gymklub.sk) sú na webe len ako náhľad pri karte „Bojové športy“. Je súhlas klubu stále platný?
4. **Dofotenie** podľa 7.8 (recepcia, šatne, ľudia so súhlasom, Panda, bar bez televízora, široké zábery). Až potom bude dojem naplno prémiový.
5. **Text medzihry Funkčná zóna** *(doplnené po kontrole Opráv pred B4)*: „Rig, kettlebelly, šprintérska dráha a vzduchový bicykel na jednom mieste.“ Na fotke medzihry (`u-38047dcd`, rig pri oknách) vzduchový bicykel nie je; nebol ani na predchádzajúcej `funkcna-zona-4`. Predvolene sa text nemení. Majiteľ rozhodne: skrátiť vymenovanie v CMS (bez bicykla), alebo dofotiť funkčnú zónu so vzduchovým bicyklom a bez nápisov susedov v oknách (7.8).

### Riziká

- **Dĺžka:** odhad 18,5 obrazovky na počítači a 23 na telefóne je stále viac ako 14–16 obrazoviek z auditu. Postup skracovania je v 3.2.
- **Strop kvality podkladov:** zábery majú najviac 1932 px na šírku, takže široká plocha na retine je asi 1,5× zväčšená. Pod prekrytím to je prijateľné, bez dofotenia to však nebude dokonale ostré.
- **Migrácia CMS:** ak Ondrej uloží formulár so starými kľúčmi počas nasadenia, zverejnenie zlyhá na „kľúč nepozná nastavenie CMS“. Nasadiť, keď needituje, a upozorniť ho.
- **View Transitions a scroll-timeline na starších iPhonoch:** majú len zálohu, teda natívne skrolovanie a statický stav. Overiť na zariadení.
- **Plný disk:** bez kroku 11.1 padnú testy na ENOSPC.
