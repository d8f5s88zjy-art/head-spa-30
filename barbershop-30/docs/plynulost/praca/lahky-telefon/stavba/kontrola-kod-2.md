# Kontrola kódu, kolo 2 – ľahký telefón L1, L2, L3, L5, L6

Som nezávislý kontrolór, v strome som nič nemenil (`git -C $SP/hs-lahky status --short | wc -l` → 0).

**Predmet kontroly:**
- `git diff 7ea247c..HEAD -- barbershop-30`, HEAD = **f624ee8**,
- odovzdávky A a B, `oprava-1.md`.

**Skratky:**
- `$SP` = `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad`
- `$K` = `$SP/barber/lahky-telefon/stavba/k2`
- Cesty `app.js` a `style.css` sú v `$SP/hs-lahky/barbershop-30/assets/`, `index.html` v `$SP/hs-lahky/barbershop-30/`.

## Verdikt

**ok = áno, žiadny vážny nález.**

Vážny nález kola 1 (N1, čierne okno pri skoku nahor) je opravený. Overil som to vlastnou sondou v 12 spôsoboch príchodu:
- 0 snímok s čistým inkom,
- 0 snímok s polotmou,
- 0 snímok s viditeľnou nedekódovanou fotkou.

Ďalej:
- Brána lite (V3) a `?film=on/off` sú správne.
- Film na počítači sa správa ako v D1.
- Všetky testy prešli.

Otvorené ostávajú:
- jeden stredný nález: SKEPTIK „doplniť“ body 8 a 9 (N2 z kola 1), o ktorom musí rozhodnúť orchestrátor,
- drobné nálezy z kola 1, ktoré oprava 1 podľa zadania neriešila.

---

## Testy (spustil som ich sám, porty 8640–8645)

Všetky príkazy som spúšťal v `barbershop-30` s `NODE_PATH=/opt/node22/lib/node_modules`. Port nastavuje `B30_PORT`.

| príkaz | port | výsledok |
|---|---|---|
| `node source/tools/app-smoke.mjs` | 8640 | **159 OK, „Všetky kontroly prešli“**, exit 0 (`$K/smoke.txt`) |
| `node source/tools/i18n-test.mjs` | 8641 | **64 OK**, „Všetky kontroly prešli“, exit 0 (`$K/i18n.txt`) |
| `node source/tools/atmosfera-test.mjs` | 8641 | **39 OK**, „Všetky kontroly prešli“, exit 0 (`$K/atmo.txt`) |
| `node source/tools/uvod-shot.mjs` | 8642 | exit 0, podrobnosti pod tabuľkou (`$K/uvod.txt`) |
| `node source/tools/karty-shot.mjs --lite` | 8642 | exit 0, 9 kariet, výstup zhodný s kolom 1 (`diff` bez rozdielu, `$K/karty-lite.txt`) |
| `node source/tools/karty-shot.mjs --only=desktop` | 8642 | exit 0, film prejde 9 kariet, S 0 → 8,86, podrobnosti pod tabuľkou (`$K/karty-pc.txt`) |

Podrobnosti k `uvod-shot.mjs`:
- desktop: `pro=true záloha=vstup-2172.avif`, prológ prejde 0 → koniec,
- `mobile-lite: OK … nadpis=1 tlačidlá=1 záloha=1`,
- mobil s filmom (`?film=on`): prológ beží, `vstup-m-1086`.

Podrobnosti ku `karty-shot.mjs --only=desktop`: proti kolu 1 sa líši len S o ±0,01 pri kartách 4–6 (4,85 / 4,86). Je to časovanie dobiehania, nie zmena správania.

Vlastné sondy sú v `$K/nastroje/` a len čítajú, sami nič nedekódujú (SKEPTIK V5):
- `prichod.mjs`: V1 a L3 po snímkach (rAF) v 12 spôsoboch príchodu,
- `brana.mjs`: kópia z kola 1,
- `slucka.mjs`: kritérium L6.

Po sebe: porty 8640–8645 odpovedajú `000`, žiadny môj proces nebeží, `$K` má 12 MB (veľké snímky som zmazal).
Bežiaci Chromium a servery na 8630/8631 nie sú moje.

---

## Overenie po bodoch zadania

### Brána lite (V3) a `?film=on/off`

Kód brány je na `index.html:16`:

```js
L = !/[?&]film=on\b/.test(q) && matchMedia('(hover: none) and (pointer: coarse)').matches && Math.min(screen.width, screen.height) <= 720
```

`lite` a `?film=off` dajú `world-off`, inak platí pôvodná podmienka `world`. Odstránený `return` z D1 je v poriadku: pri `?film=off` sa teraz vykoná aj vkladanie zálohy úvodu a predčítanie.

Sonda `brana.mjs` dáva ten istý výsledok ako v kole 1 (`$K/brana.txt`):

| prípad | triedy `<html>` | film.js / modulepreload | slučka | chyby |
|---|---|---|---|---|
| PC 1440 | `world … world-frame world-off` (softvér, ako D1) | 1 / 1 | 0 | žiadne |
| PC 1440 `?film=on` | `world world-in`, stiahne three a `img/film` | 1 / 1 | 0 | len varovanie three `KHR_parallel_shader_compile` (aj v D1) |
| 600×900 s myšou | `world`, bez `lite` | 1 / 1 | 0 | žiadne |
| 600×900 s myšou `?film=on` | `world pro world-in` | 1 / 1 | 0 | varovanie three |
| telefón 390 | `karty lite world-off` | **0 / 0** | 1 | žiadne |
| telefón `?film=on` | `world pro world-in` (film aj prológ ako v D1) | 1 / 1 | 0 | varovanie three |
| telefón `?film=off` | `lite world-off` | 0 / 0 | 1 | žiadne |
| telefón, obmedzený pohyb | `lite world-off`, `motion off` | 0 / 0 | **0** | žiadne |
| telefón na šírku 844×390 | `lite world-off` | 0 / 0 | 1 | žiadne |

### Počítač a myš sa správajú ako v D1 (porovnanie kódu)

**film.js:** jediná zmena je `film.js:82–83`, adresa modulu pri dynamickom importe. Stav filmu nečíta `is-near`, `is-shown`, `is-hold`, `is-catch` ani `--so`. `grep` v film.js našiel len komentáre a ladenie (riadky 11, 55, 117, 1491). Okolie záloh teda film neovplyvní.

**Brána pre počítač** (`index.html:16`): podmienka `world` aj prológ `pro` sú bez zmeny. Rozdiely:
- `modulepreload` film.js v hlavičke (`index.html:36`),
- dynamický import na konci (`index.html:918`).

  Oba adresujú ten istý súbor, `filmJsReq: 1`.

**Slučka skrolu:**
- `lerpOn` = `!matchMedia('(hover: none) and (pointer: coarse)')` (`app.js:358`). Myš a koliesko majú dobiehanie ako v D1.
- Atmosféra pri jemnom ukazovateli je tá istá vetva ako v D1 (`app.js:557–562`).
- Jazyky tiež (`app.js:605–610`).
- Lišta nad 900 px je bez zmeny.

**Zálohy pod filmom** sú pri `world-in` skryté pravidlom `style.css:1172` (vyššia špecificita ako `is-shown` na `style.css:1142`). Zmenené okolie (najviac 3 namiesto −1…+2) a `is-hold` sa preto pri bežiacom filme neukážu.

**Odchýlky od D1, pri ktorých film ostáva rovnaký:**
- N4 z kola 1 trvá: `prepStill` (`app.js:251–268`) dekóduje aj zálohy skryté filmom, nemá podmienku `world-in`.
- L5.1 odstránil rozmazanie nadpisov aj na počítači:
  - `@keyframes zaostrenie` na `style.css:1094`,
  - `.kw` na `style.css:1345`,
  - `.steps`.

  Zodpovedá to SPEC L5 bod 1 a ART_DIRECTION. Podpisový nástup úvodu sa však mení aj na počítači, preto patrí k ukážke majiteľovi (SKEPTIK „doplniť“ 14).

### V1 – aktuálna karta je viditeľná v každom spôsobe príchodu

**Kód:**
- Aktuálna karta `cur` je v okolí vždy (`app.js:322`), rovnako `vis`, `base` a držaná fotka `hold`.
- Susedia ±1 pribúdajú len do 3 záloh (`app.js:323`).

**Sonda `prichod.mjs`:** telefón 390×844 @3, dotyk. Fotky `-m` sú oneskorené o 2,5 s, pri prvej návšteve aj rohožka úvodu. Sonda v každom rAF zisťuje:
- **tma** = stred okna je v titulnej karte a nie je viditeľná žiadna záloha,
- **polotma** = najvyššie krytie viditeľných záloh < 0,9,
- **nedekódovaná** = viditeľná záloha, ktorej `img` nemá `complete && naturalWidth && __dec` a sama nemá krytie 0. Výnimkou je poistka úvodu pred prvým dekódovaním.

Výsledky sú v `$K/prichod.txt` a `$K/prichod-svih.txt`:

| spôsob príchodu | snímok | tma | polotma | nedekódovaná | koniec |
|---|---|---|---|---|---|
| prvá návšteva, všetky fotky pomalé | 290 | 0 | 0 | 0 | úvod, 151 snímok náhľad z HTML |
| znovunačítanie pri y = 3000 | 291 | 0 | 0 | 0 | karta 4; 4 snímky poistka úvodu pod kartou |
| `/#tim` prvá návšteva | 287 | 0 | 0 | 0 | y 2870, karta 4 |
| `/#kontakt` prvá návšteva | 294 | 0 | 0 | 0 | y 15416 (pätička) |
| späť z inej stránky (karta 5) | 290 | 0 | 0 | 0 | karta 5 |
| `b30.lang = en` | 293 | 0 | 0 | 0 | úvod |
| menu `#sluzby` z vrchu | 271 | 0 | 0 | 0 | karta 5 |
| menu `#galeria` z vrchu | 270 | 0 | 0 | 0 | karta 6 |
| logo z karty 7 (plynulo nahor) | 270 | 0 | 0 | 0 | úvod |
| skok nahor 6 → 1 | 239 | 0 | 0 | 0 | karta 1 |
| švih nadol 25 × 150 px/snímku | 210 | 0 | 0 | 0 | — |
| švih nahor 25 × 150 px/snímku | 210 | 0 | 0 | 0 | — |

Ďalšie pozorovania:
- Najviac záloh bez `display: none` bolo 3 (`maxNear`).
- Chyby konzoly ani HTTP ≥ 400 sa nevyskytli v žiadnom behu.
- Pri `/#kontakt`, `#galeria` a skoku 6 → 1 má aktuálna karta v prvej snímke po skoku ešte starú triedu (1 snímka). Je to vlastnosť merania: rAF sondy je zaregistrovaný pred rAF `tick`, ktorý pridá skrol. V nasledujúcej snímke je `is-near`.
- Bfcache Playwright vypína (`--disable-back-forward-cache`). „Späť“ je tu preto obnovenie polohy, nie bfcache.

### V2

Susedia ±1 sa pridávajú po prvom dekódovaní alebo po `load` (`firstDone`, `app.js:248` a `app.js:260`), nie až po `load`. `fetchPriority = 'low'` je na `app.js:331`.

### L3 – žiadna cesta, ktorou sa ukáže nedekódovaná fotka

Krytie: `so = 0`, kým nie je `__near && __dec` (`app.js:287`). Výnimka je len úvod pred prvým dekódovaním (poistka podľa SPEC L3 bod 3). Ďalej:

- **Najnižšia zobrazená** fotka je celá (`app.js:298–303`).
- **Držaná fotka** (`is-hold`) je posledná ustálená. Pokiaľ ostane hotová, drží sa v okolí (`app.js:309–316`, `style.css:1171`).
- **Chyba decode** (`app.js:262`): pri zamietnutí stačí `complete && naturalWidth > 0`. Chybný súbor (`naturalWidth 0`) sa nikdy neukáže, ostane držaná fotka.
- **Úvod na telefóne:** `img` má krytie 0, kým nemá triedu `nacitana`. Pod ním je náhľad 468 B z HTML (`style.css:1147–1151`).
- **Pásy tímu a galérie:** trieda `cakaj` platí do `load` alebo `error` (`app.js` 8b, `style.css:807–808`). Všetkých 26 lenivých `img` má `decoding="async"`.

Cesty, ktoré ostávajú bez ošetrenia, sú len drobné nálezy N6 a N9 nižšie. V Chromiu sa nedajú vyvolať, treba ich overiť na iPhone.

### L5 a L6 podľa zadania

**L5:**
- `filter: blur` je mimo `backdrop-filter` preč (grep v style.css: len `backdrop-filter` na riadkoch 263, 293, 565, 850, 982).
- `.kw` sa posúva o `min(0.3em, 24px)`.
- Dobiehanie na dotyku je vypnuté (`app.js:358–360`, `tick`).
- `measure()` sa pri zmene len výšky < 120 px nevolá (`app.js:461`).
- Lesk spodného tlačidla prejde raz (`style.css:1258–1261`, `app.js:346`).
- Atmosféra a jazyky sa na dotyku načítajú vo voľnej chvíli.
- `--sp` sa zapisuje len na zálohy v okolí.
- L5.2 je vynechaný so zdôvodnením meraním. Akceptované v kole 1.
- Relatívny cieľ −35 % nie je splnený. Opravár to priznáva (`oprava-1.md`, Meranie 5), ide o meranie, nie o chybu kódu.

**L6:**
- Slučka sa vytvára len pri `lite` a pri pohybe (`app.js` 11, `slucky()`).
- `preload="none"`, adresa a plagát sa nastavia až pri `is-near`.
- Hrá pri ≥ 60 % a `is-shown`, prvýkrát až po 800 ms pokoja (`app.js:822`).
- Naraz hrá najviac jedno video.

**Moje meranie L6** (`slucka.mjs`, CPU 4×, 8 s prehrávania, `$K/slucka.txt`):
- `tim-slucka-864.webm`, 864×1536,
- **droppedVideoFrames 2 z 566 (0,35 %)**,
- **0 dlhých úloh**,
- žiadne chyby.

Výhrada: Chromium z Playwrightu nemá H.264, preto meria VP9 webm. iPhone vezme mp4, takže potvrdenie treba urobiť na iPhone.

### Prístupnosť

**Obmedzený pohyb:**
- `data-motion off`, slučka sa nevytvorí (`loops 0`),
- úvod bez animácie (`style.css` `html[data-motion="off"] .title-hero *`),
- `--sp` dá `transform: none`.

**Video:**
- `aria-hidden="true"`, `tabIndex = -1`, `pointer-events: none`, `disablepictureinpicture` (`app.js:912–913`),
- poradie fokusu sa nemení.

**`is-hold`** (z-index −1) ani `cakaj` (krytie) fokus neovplyvnia. Kotva z hlavičky (`scrollIntoView`) nechá prehliadaču aj jeho skok na fragment.

### Mŕtve odkazy a konzola

Skript prešiel 246 odkazov v `index.html` a `style.css` (`src`, `href`, `srcset`, `poster`, `imagesrcset`, `url()`). Chýbajú len položky, ktoré nie sú súbory:
- `data-video-poster` bez prípony; súbory `.avif`, `.webp` a `.jpg` existujú (`ls`),
- SVG v `data:` a názov písma.

Slučka používa súbory, ktoré existujú:
- `tim-slucka-864.mp4` 3 402 635 B,
- `tim-slucka-864.webm` 2 863 037 B,
- `tim-slucka-poster-864.webp` 55 418 B.

V smoke (kontroly pageerror, console.error, requestfailed, HTTP ≥ 400), v `brana.mjs` ani v `prichod.mjs` nie je nová chyba konzoly.

---

## Nálezy

### N1 (kolo 1) – VÁŽNA → **opravená** (de67eec)

Overené vyššie: skok 6 → 1, logo z karty 7 a švih nahor majú 0 snímok tmy. V kole 1 to bolo 155 / 157 snímok.

### N2 – STREDNÁ, trvá: SKEPTIK „doplniť“ 8 a 9 nie sú urobené

- Bod 8: `style.css:70` `text-rendering: optimizeLegibility;` platí aj na telefóne.
- Bod 9: `style.css:1285` `animation: obeh 7s linear infinite;` beží mimo okna aj v pokoji. Zastaví ho len `html.skrol`.

Zadanie hovorí, že „doplniť“ má prednosť pred špecifikáciou. Oprava 1 to podľa svojho zadania neriešila (`oprava-1.md`, „Čo ostáva“ bod 4).

**Návrh:**
- bod 8: jeden riadok v `html.lite`,
- bod 9: pozastaviť `obeh` mimo okna cez IntersectionObserver,
- alebo výslovné rozhodnutie orchestrátora, že sa presúvajú.

### N3 – DROBNÁ (predtým stredná): slučka Tím 864 px

f624ee8 ju sťahuje až po zastavení pri zábere: merač opravára namerá celú stránku 3,55 MB namiesto 6,41 MB. Kritériá L6 sú teraz zmerané aspoň v Chromiu (0,35 %, 0 dlhých úloh, pozri vyššie).

Otvorené ostáva:
- Súbor 864/60 fps (3,4 MB) proti súboru 576 px zo SPEC je rozhodnutie majiteľa (V8).
- Overenie mp4 na iPhone.

### N4 – DROBNÁ, trvá: počítač s filmom dekóduje skryté zálohy

`app.js:251–268`: `prepStill` nemá podmienku `world-in && !world-off`.

**Návrh:** ako v kole 1. MutationObserver na `app.js:177–181` po `world-off` zavolá `snapNow` a dekódovanie dobehne.

### N5 – DROBNÁ, trvá: `measure()` zahodí `s.ok` a `s.catchUntil`

Objekty záberov vznikajú znova (`app.js:96`). Po každom plnom meraní dostane každý zobrazený záber `is-catch` na 420 ms (`app.js:289–291`). Plné meranie nastáva pri `load`, `fonts.ready` a zmene výšky dokumentu, napríklad po načítaní recenzií.

Tmu to nespôsobí: `covered` sa počas dobiehania len nenastaví, takže je zobrazených viac záloh. Prelínanie však 420 ms nejde s prstom.

### N6 – DROBNÁ, trvá: `decode()` bez časového limitu

`app.js:262`: ak sa sľub nevyrovná, ostane `__busy = true` a záber sa nikdy neukáže. Pri skoku sa ukáže držaná fotka (`is-hold`), takže následkom už nie je tma, ale „stará fotka pod novou kartou natrvalo“.

**Návrh:** poistka 1 500 ms. Overiť sa to dá len na iPhone.

### N7 – DROBNÁ, trvá: okolie nemá tvrdý strop 3

`app.js:320–322` (`near.add(hold)` na :321, `base`/`vis`/`cur` na :322) pridá `shown`, `hold`, `base`, `vis` a `cur` bez limitu. Limit platí len pre susedov (`app.js:323`). Sonda namerala `maxNear` 3 vo všetkých 12 behoch, takže ide o zriedkavý prípad.

### N8 – DROBNÁ, trvá: priorita sa nezvýši, keď sa sused stane aktuálnou kartou

`app.js:331` nastaví `'low'` len pri vstupe do okolia.

### N9 – DROBNÁ, trvá: nový kandidát srcset sa nedekóduje

Po otočení telefónu sa pri `lite` prepne `<source media="(max-width: 720px)">`, teda iný výrez aj súbor. `load` (`app.js:266`) vtedy skončí na `img.__dec` (`app.js:253`), takže nová fotka sa ukáže bez `decode()`.

Súvisí s tým aj toto: pri `lite` na šírku (844×390) neplatí skrytie úvodu do `nacitana` ani náhľad. Pravidlá sú len v `@media (max-width: 720px)` (`style.css:1147`), takže na šírku sa prvá fotka ukazuje tak, ako sa sťahuje.

### N10 – DROBNÁ, trvá: `<video>` vnútri `<picture>`

`app.js:922` `still.append(v)`. Obsahový model `picture` to nedovoľuje. Overiť v Safari.

Ďalej plagát `.webp` 55 418 B (`app.js:921`), hoci existuje `.avif`.

### N11 – DROBNÁ, nová, neoverená: príznak `__dec` prežije návrat zo zálohy prehliadača

Pri `pageshow` z bfcache a po návrate z inej aplikácie ostáva `__dec = true` (`app.js:251–268`, `pageshow` len `snapNow(300)`). Ak WebKit medzitým zahodil dekódované obrazy, prvá snímka po návrate môže čakať na dekódovanie. V Chromiu sa to nedá vyvolať, Playwright bfcache vypína.

**Návrh:** pri `pageshow` s `persisted` zrušiť `__dec` na zálohách v okolí. Držaná fotka a dobiehanie to už pokryjú.

---

## Zhrnutie pre orchestrátora

1. Nič nebráni ukážke majiteľovi. Ukázať treba body V8:
   - telefón bez filmu proti `?film=on`,
   - náhľad úvodu,
   - držanú fotku,
   - slučku 864,
   - nástup nadpisov bez rozmazania aj na počítači.
2. N2 urobiť alebo výslovne presunúť.
3. N6, N9 a N11 overiť na iPhone (Safari Web Inspector). Lacné poistky sú N6 a N11.
