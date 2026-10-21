# Kontrola kódu, kolo 1 – ľahký telefón L1, L2, L3, L5, L6

Kontrolór: nezávislý, v strome som nič nemenil (`git -C $SP/hs-lahky status --short` = 0 riadkov).
Predmet: `git diff 7ea247c..HEAD -- barbershop-30` (HEAD = 0195615), odovzdávky A a B.
Cesty `app.js`, `style.css`, `index.html` sú od `$SP/hs-lahky/barbershop-30/assets` alebo `barbershop-30/`.
`$SP` = `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad`, `$K` = `$SP/barber/lahky-telefon/stavba/k1`.

**Verdikt: ok = nie.** Jedna vážna chyba: pri skoku alebo rýchlom pohybe **nahor** na kartu, ktorej fotka nie je
hotová, je na obrazovke čierne okno (len text karty). Presne to, čo majiteľ hlási („čierne okná“), a v rozpore
s V1 a L3 („nikdy nie tma“). Ostatné je v poriadku alebo drobné.

---

## Testy (spustil som ich sám, porty 8641–8645, po sebe nič nebeží)

| príkaz (v `barbershop-30`, `NODE_PATH=/opt/node22/lib/node_modules`) | port | výsledok |
|---|---|---|
| `node source/tools/app-smoke.mjs` | 8641 | **149 OK, „Všetky kontroly prešli“**, exit 0, 4 min 40 s (`$K/smoke.txt`) |
| `node source/tools/i18n-test.mjs` | 8642 | **64 OK, všetky prešli** (`$K/i18n.txt`) |
| `node source/tools/atmosfera-test.mjs` | 8642 | **39 OK, všetky prešli** (`$K/atmo.txt`) |
| `node source/tools/uvod-shot.mjs --out=$K/uvod` (aj počítač) | 8643 | exit 0; desktop prológ prejde (A to nechal na kontrolóra – pri záťaži 0,2 bez timeoutu), mobil s `?film=on` beží, `mobile-lite: OK … požiadavky filmu=žiadne` (`$K/uvod.txt`) |
| `node source/tools/karty-shot.mjs --lite --out=$K/karty` | 8643 | 9 kariet, všetky s fotkou (`$K/karty-lite.txt`) |
| `node source/tools/karty-shot.mjs --only=desktop` | 8643 | film prejde 9 kariet, S 0 → 8,86 (`$K/karty-pc.txt`) |

Vlastné sondy (len čítanie, `$K/nastroje/`): `brana.mjs`, `skok-hore.mjs`, `skok-hore-snimka.mjs`, `logo.mjs`, `svih.mjs`, `pc-pred-load.mjs`.

---

## Nálezy

### N1 – VÁŽNA: skok / rýchly pohyb nahor ukáže čierne okno (V1, L3)

**Kód:** `app.js:283` `want` predchádzajúcej (vyššej) karty klesne pri pohybe nahor na 0, `app.js:291` jej dá `so = 0`
a `shown` je prázdne. Pravidlo „najnižší zobrazený záber je celý“ (`app.js:297–302`) zaberie len vtedy, keď niečo
zobrazené je. Cieľová karta (a karty pod ňou) nie sú `__near && __dec` (`app.js:287`), preto sa nezobrazí nič.
Pri skoku nadol to funguje len preto, že vyššie karty majú `want = 1` naďalej.
Model teda nemá „poslednú hotovú fotku“ (`lastStill` zo SPEC L3 bod 2), len „najnižšiu zobrazenú“.

**Dôkaz (lite 390×844 @3, dotyk):**
- `skok-hore.mjs`, fotky -m oneskorené o 2,5 s (`$K/skok-hore.json`):
  - skok galéria (6) → remeslo (2): **155 z 241 snímok bez jedinej viditeľnej zálohy**, od 26 ms do 2 593 ms
    (`"vis": ""`, `near: "2,3,4"`),
  - rezervácia (8) → čakáreň (3): **157 snímok**, 29–2 629 ms,
  - kontrola nadol vstup (1) → galéria (6): 0 snímok.
- Bez oneskorenia siete (lokálny server, len dekódovanie, `$K/skok-hore-0.json`): nahor **9 a 7 snímok** čiernej,
  nadol 0.
- Logo `a.brand` → `#uvod` z karty 7 (plynulý skrol, bez oneskorenia, `$K/logo.json`): **8 snímok bez zálohy**
  nad kotvou karty, z toho 6 po sebe pri príchode na úvod (y 2167 → 717, t 504–587 ms).
- Snímka `$K/skok-hore-500ms.png` (500 ms po skoku nahor): celá plocha ink, len nadpis „Povedz, ako to chceš.“,
  lišta a tlačidlá; jas priemer 19,9, **94,8 % bodov pod jasom 20**. Všetky zálohy majú `opacity 0`.

Bežné cesty, ktoré to spustia: logo (`#uvod`), položky menu na skoršiu sekciu (`#vstup-dnu`, `#sluzby`, `#tim`,
`#galeria`), návrat späť po kotve, ťuknutie na stavový riadok iPhonu (skrol na vrch), rýchly švih nahor cez viac
kariet (`$K/svih.json`: 2 snímky aj lokálne). app-smoke to nezachytí, lebo pri „späť“ a kotvách kontroluje len
ustálený stav (`app-smoke.mjs:415, 424, 431`), nie snímky počas príchodu.

**Návrh:** v `zabery()` si pamätať záber zobrazený v predchádzajúcej snímke (`lastShown`). Ak je `shown` prázdne
a ten záber je stále `__near && __dec`, dať mu `so = 1`, nechať ho v `near` (pred limitom 3) a zakryť ho až
cieľovou kartou po jej dobehnutí (`is-catch`). Pre úvod platí to isté (pri návrate cez logo). Do app-smoke časti 9
pridať kontrolu po snímkach (rAF) pre skok nahor (6 → 2 a logo z karty 7) s oneskorenými fotkami: v každej snímke
nad kotvou titulnej karty je viditeľná aspoň jedna záloha.

### N2 – STREDNÁ: SKEPTIK „doplniť“ 8 a 9 nie sú urobené

Zadanie hovorí, že „doplniť“ má prednosť pred špecifikáciou.
- **Bod 8:** `style.css:70` `text-rendering: optimizeLegibility` ostáva aj na telefóne.
- **Bod 9:** `style.css:1271` `animation: obeh 7s linear infinite` beží mimo okna aj v pokoji. Zastaví ho len
  `html.skrol`.

Odovzdávka B: „SKEPTIK 9 … a 8 … som nerobil, neboli v zadaní dávky B.“
**Návrh:** doplniť (8 je jeden riadok v `@media (max-width: 720px)` alebo `html.lite`; pri 9 pozastaviť `obeh`
mimo okna cez IntersectionObserver, ako pás služieb), alebo to orchestrátor výslovne presunie.

### N3 – STREDNÁ: slučka Tím je 864 px, 60 fps, 3,4 MB; kritériá L6 nie sú zmerané

- `app.js:875–879` berie `data-video` = `assets/video/tim-slucka-864`: `ls -l` mp4 3 402 635 B, webm 2 863 037 B.
  SPEC L6 počíta s ľahkou verziou 576 px. Tú B kvôli zákazu nových súborov nevyrobil a navrhol ju.
- Kritériá L6 nie sú zmerané:
  - `droppedVideoFrames` ≤ 2 % pri CPU 4×,
  - 0 dlhých úloh > 50 ms od videa.
- Súhlas majiteľa (V8) je otvorený.

Pri „ľahký ako pierko“ ide o najväčší jednotlivý prenos na telefóne (len ak návštevník dôjde na Tím).
**Návrh:** pred zverejnením zmerať obe kritériá. Majiteľovi dať na rozhodnutie L6 so súborom 864 alebo
výrobu `tim-slucka-576.mp4`, alebo L6 zatiaľ vypnúť.

### N4 – DROBNÁ: na počítači s filmom sa dekódujú skryté zálohy (odchýlka od D1)

- `zabery()` beží aj pri `world-in` a `prepStill` volá `img.decode()` na zálohách, ktoré film skrýva
  (`style.css:1158–1161`).
- Sonda `pc-pred-load.mjs`, 1440×900 s myšou, dva švihy kolieskom (`$K/pc-pred-load.txt`):
  - D1 `?film=on`: `dec: 0`, okolie `3,4,5,6`,
  - HEAD `?film=on`: `dec: 5`, okolie `3,4,5`.
- Stiahnutie pred `load` je rovnaké (len `vstup-2172.avif`) a `tLoad` je porovnateľné (332 / 331 ms).
- Film sám sa správa rovnako: `karty-shot --only=desktop` prejde 9 kariet a `strih-shot` pustil A. Je to však
  práca navyše na počítači: dekódovanie 2172w AVIF, asi 12 MB na fotku.

**Návrh:** v `prepStill` nedekódovať, kým platí `world-in && !world-off`. Po pridaní `world-off` sa vďaka
MutationObserver (`app.js:177–181`) zavolá `snapNow` a dekódovanie dobehne.

### N5 – DROBNÁ: stav `s.ok` / `s.catchUntil` sa stráca pri každom `measure()`

- `measure()` vytvára nové objekty záberov (`app.js:96`). Po každom plnom meraní je `s.ok` nedefinované, takže
  `app.js:288` pre každý zobrazený záber s `want > 0` spustí `is-catch` na 420 ms. To sa stane pri `load`,
  `fonts.ready`, otočení a zmene výšky dokumentu.
- Počas toho záber „nedokrýva“ (`catching`, `app.js:290`), takže pod ním ostane zobrazený aj predchádzajúci.
  Prelínanie rozbehnuté skrolom potom dobieha 400 ms namiesto toho, aby išlo s prstom.

**Návrh:** stav držať na `img` (ako `__near`/`__dec`) alebo ho preniesť zo starých objektov v `measure()`.

### N6 – DROBNÁ: `decode()` bez časového limitu

`app.js:261`: ak sa sľub `decode()` nikdy nevyrovná (známe správanie niektorých verzií WebKitu pri skrytých alebo
veľkých obrázkoch), ostane `__busy = true` (`app.js:252`) a záber sa už nikdy neukáže. Kombinované s N1 to môže
byť trvalé čierne okno. Overiť sa to dá len na iPhone.

**Návrh:** poistka napr. 1 500 ms. Potom stačí `complete && naturalWidth > 0`, a ak ani to nie, `__busy = false`
a skúsiť znova pri ďalšom `load`.

### N7 – DROBNÁ: okolie môže mať viac ako 3 zálohy

`app.js:308` pridá `base`, `vis` a `cur` bez limitu. Limit 3 platí len pre susedov (`app.js:309`). Pri rýchlom
švihu bez hotových fotiek (`low`, `base`, `vis = base + 1`, `cur = vis + 1`) sú to 4 zálohy bez `display: none`.
Tvrdenie „najviac 3“ (komentár `app.js:240`, `style.css:1144–1146`) teda neplatí vždy. Moje sondy namerali
`maxNear: 3` (`$K/skok-hore*.json`), takže je to zriedkavé.

### N8 – DROBNÁ: nízka priorita sa nezvýši, keď sa sused stane aktuálnou kartou

`app.js:317` nastaví `fetchPriority = 'low'` len pri vstupe do okolia. Keď sa z tej karty stane `cur`, kým sa ešte
sťahuje, priorita ostane nízka.

**Návrh:** pri `i === cur && !img.complete` nastaviť `'high'`.

### N9 – DROBNÁ: nový kandidát srcset sa nedekóduje

Pri otočení alebo zmene DPR sa vyberie nový kandidát srcset. Príde `load` (`app.js:265`), ale `prepStill` skončí
na `img.__dec` (`app.js:252`), takže nový kandidát sa zobrazí bez `decode()`. Komentár pri `app.js:264` s tým
počíta. Je to však cesta, kde sa môže ukázať neúplná fotka (L3).

**Návrh:** v `load` nastaviť `__dec = false` a nechať starú fotku hore, kým sa nový kandidát nedekóduje.

### N10 – DROBNÁ: `<video>` vnútri `<picture>`

`app.js:880` `still.append(v)` vloží `<video>` do `<picture class="film-still">`. Obsahový model `picture`
(source*, img) to nedovoľuje. Chromium to kreslí (snímka `$K/karty/karta-04-sala-rano-mobile-lite.png`), Safari
to treba overiť na iPhone.

**Ďalej:**
- Plagát je `.webp` 55 418 B (`app.js:879`), hoci existuje `tim-slucka-poster-864.avif` s 28 459 B.
- Prístupnosť: video je dekoratívne, `aria-hidden="true"` a `tabIndex = -1` (`app.js:871`) sú v poriadku.
  Slučka dlhšia ako 5 s nemá ovládanie (WCAG 2.2.2), rovnako ako videá Remeslo a Tím v D1. Pri obmedzení
  pohybu sa nespúšťa.

---

## Čo prešlo (s dôkazom)

- **Brána lite (V3), ?film=on/off** – `index.html:16`. Sonda `brana.mjs` (`$K/brana.txt`):

  | prípad | triedy `<html>` | film.js |
  |---|---|---|
  | počítač 1440×900 | `world … world-frame world-off` (softvér, ako D1) | stiahnutý |
  | počítač `?film=on` | `world-in` | stiahnutý |
  | 600×900 s myšou | `world`, bez `lite` | stiahnutý |
  | 600×900 `?film=on` | `world-in` | stiahnutý |
  | telefón 390 | `karty lite world-off` | 0 požiadaviek; three, seq, hĺbky ani tim-slucka sa pri štarte nesťahujú |
  | telefón `?film=on` | `world pro world-in` (film aj prológ) | stiahnutý |
  | telefón `?film=off` | `lite world-off` | 0 požiadaviek |
  | telefón, obmedzený pohyb | `lite world-off`, `data-motion off` | 0 požiadaviek, 0 slučiek |
  | telefón na šírku 844×390 | `lite` | 0 požiadaviek |

  Vo všetkých prípadoch: žiadna chyba konzoly, žiadne HTTP ≥ 400, žiadna zlyhaná požiadavka. Jediné hlásenie je
  varovanie three.js `KHR_parallel_shader_compile` pri filme, rovnaké ako v D1.
- **Načítanie film.js mimo lite:**
  - `index.html:27` modulepreload a `index.html:908` dynamický import adresujú ten istý súbor
    (`filmJsReq: 1`, žiadne dvojité stiahnutie),
  - `film.js:83` dá bez značky so `src` správnu adresu: desktop `?film=on` stiahne `vendor/three.module.min.js`
    a `img/film`, `uvod-shot` desktop prejde.
- **Počítač a myš ako v D1:**
  - film.js má len jednu zmenu (`film.js:82–83`),
  - lerp a koliesko sú na jemnom ukazovateli rovnaké (`app.js:343`, časť 6b bez zmeny),
  - atmosféra na myši je rovnaká ako v D1 (`app.js:542–546`),
  - lišta > 900 px je bez zmeny (L1 je v `@media (max-width: 900px)`),
  - `karty-shot --only=desktop` a `uvod-shot` desktop prešli,
  - odchýlka je len N4.
- **V1, ustálený stav:** aktuálna karta je vždy v okolí (`app.js:308`). Ustálený stav pri obnovenej polohe, späť,
  `#tim`, `#kontakt`, `b30.lang=en` a `?film=off` overuje app-smoke (149 OK). Počas príchodu nahor pozri N1.
- **V2:** susedia ±1 po prvom dekódovaní, nie po `load` (`app.js:310`, `firstDone` `app.js:259`).
  Pri skoku nadol 0 snímok bez zálohy (`$K/skok-hore.json`).
- **L3, chyby dekódovania:**
  - zamietnuté `decode()` má poistku `complete && naturalWidth > 0` (`app.js:261`),
  - chybný súbor sa nikdy neukáže,
  - nedekódovaná fotka sa pri pohybe nadol neukáže (krytie `app.js:286–293`).
- **L1:**
  - lišta `var(--ink)` + linka + prechod 20 px (`style.css:318–325`),
  - telo `padding-bottom: 0`, pätička s rezervou a tieňom `0 50vh 0 50vh` (`style.css:940–946`),
  - smoke: žiadne vodorovné pretekanie pri 390, 430 a 412 px.
- **L2, prvý obraz:**
  - `html.lite` úvod `dosadnutie` bez krytia 0 (`style.css:1098–1101`),
  - uvod-shot `mobile-lite: OK prvý snímok … nadpis=1 tlačidlá=1 záloha=1`.
- **L2, zálohy:** Poď ďalej má na telefóne `sala-m-1086/1448` (`index.html:217–219`). Súbory existujú
  (`ls -l`: 111 084 / 205 070 B avif, 136 154 / 230 472 B webp), na `seq/vstup-dnu/f025` ostáva len
  `data-video-poster` pre film a ten súbor existuje.
- **L5:**
  - `blur(` mimo `backdrop-filter` v style.css už nie je (grep prázdny),
  - `.kw` posun `min(0.3em, 24px)`,
  - lerp na dotyku vypnutý (`app.js:343–345`),
  - `measure()` sa pri zmene výšky < 120 px nevolá (`app.js:443–452`),
  - lesk spodného tlačidla prejde raz (`style.css:1244–1247`, `app.js:330–331`),
  - atmosféra na dotyku vo voľnej chvíli (`app.js:556–557`),
  - `--sp` len v okolí (`app.js:196`, `323`).
  - Bod L5.2 (krytie na `.title-card`) B vynechal so zdôvodnením meraním (`b-paint-L6.json`). Akceptujem, ide
    o súlad so SPEC („najprv zmerať“).
- **L6:**
  - slučka len v lite a len pri `motionOn` (`app.js:779–781`, `860`),
  - `preload="none"`, adresa a plagát až pri `is-near`,
  - hrá pri ≥ 60 % a `is-shown`,
  - najviac jedno video (`sync`),
  - úsporný režim nechá plagát (app-smoke `[lite slučka]` 8 kontrol OK).
- **Prístupnosť:**
  - obmedzený pohyb vypne `dosadnutie`, nástupy aj slučku (`style.css:1097`, `1334–1336`; `brana.txt` reduced:
    `motion off`, `loops 0`),
  - fokus: nové prvky nie sú fokusovateľné (video `tabIndex -1`), poradie fokusu sa nemení.
- **Mŕtve odkazy:** v žiadnom z 9 prípadov `brana.mjs` ani v smoke nie je 404. README odkazuje na existujúce časti
  (`app.js` časť 11, testy).

## Čo opraviť pred kolom 2

1. N1 (povinné), s testom po snímkach pre skok a švih nahor.
2. N2: urobiť, alebo výslovné rozhodnutie orchestrátora.
3. N3: meranie a rozhodnutie majiteľa.
4. N5 a N6 (lacné, priamo súvisia s L3). Ostatné podľa uváženia.

Dočasné súbory: `$K` má 12 MB (veľké snímky uvod a karty-pc som zmazal). Servery na 8641–8645 som ukončil. Bežiaci
Chromium (PID 15227, `karty.mjs 8630`) nie je môj.
