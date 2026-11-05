# Koncept D „Film“: filmový úvod, prechody sekcií a stránok, mikroanimácie (Stavebniny Richtárik, 5. 11. 2026)

Rola: senior motion a web dizajn. Prototyp je v `koncept-film/web/` (cesty nižšie sú relatívne k `koncept-film/`).
Strom `hs-richtarik-obnova` som nemenil: `git status --short | wc -l` → `0`, HEAD `4b2646bf`. Dočasný worktree som
nevytváral, neupravené fotky som vytiahol príkazom `git show bb6bbaeb:…`. Pracovné súbory boli v RAM (`/dev/shm/film`),
lebo disk `/` mal na začiatku voľných 19 MB. Servery na portoch 9730 (prototyp), 9731 (dnešný strom, len čítanie)
a 9732 (koncepty A až C) som po meraní ukončil. Kód je celý vlastný: CSS a 107 riadkov JS (`film-d.js` 55, `vt-head.js` 52), WAAPI nebolo treba.
Nepoužil som knižnicu ani CDN a nič som nekopíroval z cudzích webov.

**Ako prototyp otvoriť:** `python3 -I -m http.server 9730 --bind 127.0.0.1 --directory koncept-film`, potom `/web/index.html`.
Podstránky, `pdf`, `subory`, písma a nezmenené obrázky sú symbolické odkazy na strom. Skutočné súbory sú len
zmenené HTML, `assets/site.css|js`, `img/film-d/` a vrátené fotky v `img/uvod/`.
**Ako ho zložiť znova:** `python3 -I nastroje/zloz.py <strom>/stavebniny-richtarik web`. Skript vezme `index.html`,
`site.css`, `site.js` a 74 podstránok zo stromu a zapracuje do nich `nastroje/film-d.css`, `film-d.js` a `vt-head.js`.

## 0. Zhrnutie

- **Auto je preč.** V HTML, CSS ani JS nie je žiadny odkaz na `img/film/` ani `uvod/og.jpg`
  (`grep -rlE 'img/film/|uvod/og\.jpg|prvy-t|posl-p'` → 0). Priečinok `img/film` v prototype nie je. og:image a JSON-LD
  `image` ukazujú na všetkých 75 stránkach na `img/film-d/og-dvor.jpg`. Je to výrez skutočnej fotky dvora `u4` bez
  pravého okraja, kde stojí skutočné auto firmy. Snímku som otvoril (`snimky/og-a-pravy-okraj.jpg`): sú na nej
  palety, dom a stĺp, auto nie.
- **Hook (prvé 3 s):** skutočný plný dvor je viditeľný od prvej snímky a je to LCP. Otvorí sa ako filmové plátno
  (svetlé pásy cinemascope sa rozostúpia) a nadpis **„Dvor plný materiálu. Od základov po strechu.“** vyjde po
  riadkoch z drážky. Potom na dvor za sebou „dopadnú“ štyri skutočné zábery zásob ako výtlačky so štítkom palety:
  Tehly, Pórobetón, Dlažby a obrubníky, Stavebné rezivo. Kôpka odíde a štítok **Náš dvor · Novozámocká 62/68**
  sa vrazí ako pečiatka. Celé to trvá 4 s a dá sa to kedykoľvek prerušiť.
- **Filmové prechody na celom webe:** prechody medzi stránkami (View Transitions medzi dokumentmi) majú tri typy
  „strihu“: *ďalej*, *späť* a *strih zdola* z menu a úvodu. Pri dlaždici sa **fotka dlaždice zmení na hlavičku
  stránky** a pri Späť sa vráti do dlaždice. Sekcie sa pri posune otvárajú ako filmová clona, nadpisy a dlaždice
  vychádzajú zdola a štítky akcií dopadnú ako pečiatka. K tomu mikroanimácie tlačidiel a dlaždíc.
- **Fotky s doplneným tovarom som vrátil:** `pas-dvor`, `dvor-predajna` a `zasoba-porfix` sú vo všetkých 20 veľkostiach
  a formátoch neupravené verzie z `bb6bbaeb` (md5 `e7eef35eab97`, `fb289b8902c0`, `29b18b563571`, `ac74ad532602`, zhodujú
  sa s diagnózou). Pórobetón v úvode je táto neupravená fotka s prázdnou paletou.
- **Merania (A/B/C striedavo, 4 kolá, záťaž 1,6 – 3,5):** počas úvodu je **0 snímok nad 50 ms** na telefóne (CPU 4×)
  aj na počítači vo všetkých 4 behoch. Dnes to bolo 2/1/0/0 na telefóne a 1/0/0/0 na počítači. Medián LCP
  na telefóne je 442 ms (dnes 534, koncept B Kamera 378) a na počítači 268 ms (dnes 336, B 218). CLS je ≤ 0,0001.
  Bajty za 6 s: telefón 2,75 MB (dnes 5,08 MB, z toho film 3,86 MB), počítač 2,12 MB (dnes 8,22 MB).
- **Svetlo:** v každej snímke videí (10 za sekundu) je priemerný jas aspoň 169 (telefón) a 160 (počítač) z 255.
  Pri prechodoch medzi stránkami je to aspoň 162. Čierna ani tmavá clona nie je nikde. Podklad prechodov je papier.
- **Slabé miesto:** na počítači v headless Chromiu bez GPU spôsobí zdieľaná fotka pri prechode
  dlaždica → hlavička občas jednu snímku 67 – 117 ms (9 z 18 prechodov, dnes 3 z 18). Na telefóne pri CPU 4× sú to
  5 z 24 prechodov (dnes 1 z 24). Príčina a možnosti sú v časti 7 (R1).

## 1. Hook

**Prečo je silný:** veta tvrdí „Dvor plný materiálu“ a v tej istej sekunde ju dokazuje skutočná fotka. Zábery zásob,
ktoré dopadnú ako fotky na stôl, sú „inventúra“ v 2 sekundách. Divák vidí tovar, nie reklamu. Úvod neprekrýva nič
pred obsahom, nemá oponu ani preloader. Vyhľadávanie, Katalóg, Akcie a Zavolať fungujú od prvej snímky.

| Prvok | Text | Zdroj faktu |
|---|---|---|
| eyebrow | Stavebniny Richtárik · Nitra – Horné Krškany · od roku 1997 (na telefóne bez „Nitra – Horné Krškany“) | FAKTY A (adresa, 1997) |
| H1 | **Dvor plný materiálu. Od základov po strechu.** | STYL.md §4 a P1; „dvor plný materiálu“ je povolené (FAKTY F) |
| lede | Rodinné stavebniny v Nitre. Spotrebu spočítame a cenovú ponuku pripravíme zadarmo, materiál dovezieme vlastnými autami s mechanickou rukou po celom Slovensku. | STYL P1 (doslova); FAKTY B: PW:28, PW:2722, PW:9, PW:31; značka auta neuvedená (❓ LIAZ/Iveco) |
| štítky záberov | Tehly · TermoBRIK / Pórobetón · Porfix / Dlažby a obrubníky · Stadreko / Stavebné rezivo · priamo na sklade | opis skutočnej fotky; „stavebné rezivo priamo na sklade“ PW:956 (FAKTY F) |
| štítok dvora | Náš dvor · Novozámocká 62/68, Nitra | FAKTY A |
| odznak | Skutočné fotky z nášho dvora | fotky majiteľa (diagnóza 2b) |
| info (počítač) | Novozámocká 62/68, Nitra – Horné Krškany · Po – Pi 7:00 – 16:00 · So 7:00 – 12:00 | FAKTY A |
| alt fotky | Dvor Stavebnín Richtárik v Nitre: vysoké stohy tvárnic na paletách pod modrou oblohou | opis `u4` |

Kontrolu textu úvodu som robil v Pythone nad HTML bez značiek. Výrazy „AI“, „hneď“, „ihneď“, „najlacn“, „najlep“,
„Iveco“, „LIAZ“, „zložíme“, „zdarma“ a „%“ sa v ňom nevyskytujú (všetky `False`). `grep -rw AI` v HTML, CSS a JS
prototypu → 0.

## 2. Scenár po sekundách

Čas je od začiatku navigácie. Strih sa spustí, keď sú dekódované všetky štyri zábery, najskôr v 1,0 s (`t_m`).
Merania ukazujú, že to býva 1,0 s. Ak zábery nie sú pripravené do 3,4 s, strih sa vynechá a ostane statický
koncový stav s tlačidlom „Prehrať úvod“.

| s | Obraz | Text a štítky | Technika |
|---|---|---|---|
| 0,00 | fotka dvora (LCP: telefón 0,42 – 0,53 s pri CPU 4×, počítač 0,22 – 0,31 s), hore a dole svetlé pásy papiera (po 15 %) | text čaká na písmo, najviac 1 s (inak by výmena písma posunula riadky, CLS) | `html.fd-ide` a `fd-pisma` zo skriptu v `<head>` |
| 0,00 – 2,90 | kamera dosadne: zmenšenie z 1,09 na 1,00 s jemným posunom (jednorazovo) | | `transform` na `<picture>` |
| 0,12 – 0,92 | | 1. riadok H1 vyjde z drážky | `translateY(112 % → 0)` v `overflow: clip`; text sa nedelí na písmená |
| 0,20 – 1,05 | pásy sa rozostúpia, plátno sa otvorí na celý záber | 2. riadok (tehlový) 0,26 – 1,06 s, linka eyebrow sa nakreslí | `scaleY(1 → 0)` pseudoprvkov |
| 1,00 – 1,52 | **01/04** výtlačok „Tehly · TermoBRIK“ dopadne sprava s rotáciou | štítok sa vrazí 1,30 – 1,64 s | `translate3d + rotate`, `opacity` |
| 1,55 – 2,07 | **02/04** „Pórobetón · Porfix“ (neupravená fotka) | | rovnako, rytmus 0,55 → 0,50 → 0,45 s |
| 2,05 – 2,57 | **03/04** „Dlažby a obrubníky · Stadreko“ | | |
| 2,50 – 3,02 | **04/04** „Stavebné rezivo · priamo na sklade“ | | |
| 3,32 – 3,84 | celá kôpka odíde doprava a zmizne | počítadlo zmizne 3,5 s | jedna animácia na kontajneri `.fd-zabery` |
| 3,62 – 3,98 | dvor v plnom zábere | **Náš dvor · Novozámocká 62/68, Nitra** sa vrazí ako pečiatka | `fd-pecat2` |
| 4,02 | koncový stav = statický HTML stav | vpravo hore tlačidlo „Prehrať úvod“ | skript odstráni zábery |

**Prerušenie:** posun o viac ako 24 px, koliesko, dotyk, kláves (okrem Tab) alebo fokus vo vyhľadávaní. Zábery vtedy
za 0,18 s zmiznú. **Strih sa nespustí** pri „obmedziť pohyb“, bez JS, pri šetrení dát (`saveData`), pri druhom
načítaní v tej istej relácii (`sessionStorage`) a keď zákazník už skroluje. Tlačidlo „Prehrať úvod“ ho spustí znova.
Overené v `meranie/kontroly.json` → `funkcie-*`: po „Prehrať úvod“ je `mont: true`, zábery 4, po posune o 300 px
`mont: false`, zábery 0.

Sekvencie (otvorené): `sekvencia-uvod-390.jpg` a `sekvencia-uvod-1440.jpg` (12 záberov od 0,15 do 4,6 s),
jednotlivé snímky `snimky/uvod-390-*.jpg` a `snimky/uvod-1440-*.jpg`.

## 3. Katalóg prechodov a animácií (s rozpočtami)

Všade platí: animuje sa len `transform`/`translate`/`scale`/`rotate` a `opacity`, nič sa nepripína a posun
sa nezamyká. Podklad je papier `#faf8f4` alebo malta. Pri „obmedziť pohyb“ a bez JS sa nič nehýbe (časti 3c a 5).

### 3a. Úvod (len `index.html`)
| # | Prvok | Spúšťač | Trvanie | Rozpočet | Bez podpory / obmedziť pohyb / bez JS |
|---|---|---|---|---|---|
| U1 | filmové plátno (2 pásy papiera) | načítanie | 0,85 s | 2 vrstvy kompozítora | pásy nie sú |
| U2 | dosadnutie kamery na fotke dvora | načítanie | 2,9 s, raz | 1 vrstva | fotka stojí |
| U3 | H1 po riadkoch z drážky | písmo načítané | 0,8 s | 2 riadky | text stojí |
| U4 | strih zásob (4 výtlačky + odchod kôpky + pečiatky) | zábery dekódované | 1,0 – 4,0 s | 5 vrstiev; 1 animácia transformácie na prvok | zábery sa vôbec nestiahnu (`<template>`) |
| U5 | odjazd kamery pri posune (fotka ide pomalšie než stránka) | posun, `animation-timeline: view()` | počas odchodu úvodu | 0 ms JS | statická |

Kód úvodu: `film-d.js` 3 976 B (gzip 1 682 B) na konci `site.js`. Skript v `<head>` má 0,5 kB.

### 3b. Prechody medzi stránkami (všetkých 75 stránok)
| # | Typ | Kedy | Čo sa deje | Trvanie (namerané od FP) |
|---|---|---|---|---|
| P1 | **ďalej** | bežný odkaz | stará stránka za 0,16 s zmizne o 10 px hore, nová za 0,34 s vyjde zdola o 18 px | 410 – 458 ms |
| P2 | **zdieľaná fotka** | dlaždica katalógu, akcie, zásoby (`a.cat`, `a.deal`, `a.zt`) → stránka s hlavičkou `.ph-foto` | fotka dlaždice za 0,44 s preletí a zväčší sa na hlavičku, zvyšok ako P1 | 0,44 s |
| P3 | **späť** | Späť v histórii | smer je opačný (nová prichádza zhora). Hlavička sa zmenší späť do dlaždice a dlaždica sa prelne až na konci, takže prázdny rám obnovenej stránky nie je vidieť | 409 – 432 ms |
| P4 | **strih zdola** | hlavné menu, menu na telefóne, tlačidlá úvodu | stará stránka stojí, nová za 0,5 s vyjde zdola cez ňu | 480 – 511 ms |
| P5 | poistky | – | pri reloade a „obmedziť pohyb“ bez prechodu, ťuknutie alebo kláves prechod ukončí (`skipTransition`). Lišta a spodná lišta stoja. Pri obnovenom (nenačítanom) obrázku sa fotka nezdieľa, je len prelnutie | – |
| P6 | príprava | `pointerdown` na dlaždici | Speculation Rules `prerender` (eagerness `conservative`), takže fotka hlavičky je pri prechode načítaná | – |

Kód: `vt-head.js` sa vkladá do `<head>` každej stránky (2 933 B, gzip 1 287 B). CSS je v časti „filmové prechody medzi
stránkami“ v `film-d.css`. Prechod nesmie byť dlhší ako 0,5 s, cieľ je 0 snímok nad 50 ms (časť 6). Záloha
dnešného webu, ktorá v prehliadačoch bez podpory čakala 200 ms (`site.js:819–831`), je zmazaná. Firefox tak má
okamžitú navigáciu.

### 3c. Prechody sekcií pri posune (CSS časová os `view()`, len v `@supports` a `@media (prefers-reduced-motion: no-preference) and (scripting: enabled)`)
| # | Prvok | Čo robí | Rozsah | Rozpočet |
|---|---|---|---|---|
| S1 | fotky (`.zt`, `.rvimg`, `.ph-foto`, galéria, dvor v kontakte) | **filmová clona:** pásy papiera (po 19 %) sa rozostúpia a fotka v ráme dosadne z 1,14 na 1 | `entry 0 % → 90 %`, dosadnutie do `cover 55 %` | 0 ms JS, `scaleY` a `scale` |
| S2 | nadpisy sekcií (`.head > *`) a bloky `.rv` | vyjdú zdola o 30 px z priehľadnosti 0,2 (nikdy nie 0). V mriežke postupne podľa stĺpca (`--k`, 7 % rozsahu na stĺpec) | `entry 0 % → 72 %` | `translate`, `opacity` |
| S3 | štítok akcie (`.deal .tag`) | **pečiatka:** dopadne z 1,7× a −10° na −2° | `entry 35 % → 95 %` | `scale`, `rotate` |
| S4 | pás Doprava | fotka ide pomalšie než stránka (1,12 → 1,04) | `cover 0 → 100 %` | nahrádza nekonečný drift a JS paralaxu |
| S5 | prvá snímka novej stránky | sekcie pod prvou a päta majú `content-visibility: auto` | – | lacnejšie prvé vykreslenie |

Rozsahy končia v `entry`, takže dobehnú aj pri poslednom prvku stránky. Pri `scripting: enabled` sa pri vypnutom
JS nič nehýbe. Prehliadač bez `animation-timeline` použije pôvodné objavovanie cez IntersectionObserver.
Sekvencie posunu (otvorené): `snimky/posun-sekcie-390.jpg` a `posun-sekcie-1440.jpg`, jas aspoň 176 a 190.

### 3d. Mikroanimácie
| # | Prvok | Pohyb | Trvanie |
|---|---|---|---|
| M1 | tlačidlá `.btn` | stlačenie `scale(.97)`; šípka pri hover (dnešná) | 0,08 s |
| M2 | dlaždice katalógu, akcie, zásoby, novinky | stlačenie `scale .985`; pri myši šípka „→“ vyjde v páse názvu, fotka 1,04 (dnešná) | 0,14 / 0,25 s |
| M3 | štítok akcie pri myši | `scale 1.06` | 0,25 s |
| M4 | štítky zásob (`.zt`) | papierový štítok palety namiesto tmavého prechodu cez fotku, pri myši sa zdvihne o 3 px | 0,25 s |
| M5 | ťuknutie | `-webkit-tap-highlight-color: transparent` (modrý záblesk by sa dostal do snímky prechodu), vlastný `:active` a `:focus-visible` | – |

## 4. Fotky a bajty

| Súbor | Zdroj (len skutočné fotky) | Rozmer | B |
|---|---|---|---|
| `img/film-d/dvor-p-1720.avif` / `-1290` (+ WebP) | `44aa237b^:img/uvod/u4-p-1920` (md5 `249b9d2ae8b0`), výrez x 0–1720, y 220–1080 (bez auta vpravo) | 1720×860 / 1290×645 | 114 372 / 78 277 |
| `img/film-d/dvor-t-1448.avif` / `-1086` (+ WebP) | `u4-t-1448` (md5 `bd300f4d00f0`), výrez y 300–1860 | 1448×1560 / 1086×1170 | 207 553 / 147 395 |
| `img/film-d/og-dvor.jpg` | `u4-p-1920`, výrez x 0–1720 | 1200×630 | 175 703 |
| zábery strihu | `img/uvod/zasoba-tehly|stadreko|rezivo-*` (strom) a **`zasoba-porfix-*` z `bb6bbaeb`** | 480/720/856–900 | zdieľané s pásom zásob |
| `img/uvod/pas-dvor*`, `dvor-predajna*`, `zasoba-porfix*` | **neupravené z `bb6bbaeb`** (20 súborov, 5 625 269 B) | ako dnes | – |

Pexels (`img/hd`) ani `img/film` sa v úvode nepoužívajú. Náhľady pod fotkou, kým sa načíta, sú svetlé WebP 16 px
(108 B a 124 B base64).
**Kód:** `site.js` má 19 339 B namiesto 67 785 B (gzip 6 926 namiesto 23 374). `site.css` má 94 653 B namiesto 89 541 B
(gzip 22 553 namiesto 21 634), lebo film odišiel (11,7 kB) a pribudol `film-d.css` (18,2 kB s komentármi, gzip 5,9 kB).
`index.html` má 42 477 B namiesto 42 541 B.

**Ostrosť** (`meranie/ostrost.jsonl`): px zariadenia na šírku zobrazeného výrezu ÷ px súboru, ≤ 1 = bez zväčšenia.
Platí stĺpec `zaberyKoniec`, lebo vnútorný nájazd záberov som nakoniec vypustil.
| okno | dvor na konci / pri nájazde kamery 1,09 | zábery strihu |
|---|---|---|
| 360×740 @3 | 0,99 / 1,08 | 0,59 – 0,74 |
| 390×844 @3 | **0,81 / 0,88** | **0,83 – 0,88** |
| 430×932 @3 | 0,89 / 0,97 | 0,96 – 1,01 |
| 390×844 @2 | 0,72 / 0,78 | 0,69 |
| 1280×800 | 0,99 / 1,08 | 0,58 |
| **1440×900** | **0,84 / 0,91** | **0,72** |
| 1920×1080 | 1,12 / 1,22 | 0,57 – 0,85 |
| 1440×900 @2 (Retina) | 1,67 / 1,83 | 0,95 |

## 5. Kontroly (`meranie/kontroly.json`, snímky v `snimky/`, všetky som otvoril)

- **Obmedziť pohyb** (390 aj 1440, po 0,3 s aj po 3,3 s): H1, 2. riadok, fotka, štítok, vyhľadávanie a Zavolať sú
  „vidno“, beží 0 animácií, triedy `fd-ide` ani zábery nie sú. Na Katalógu je 0 skrytých prvkov a 0 animácií
  (`snimky/pokoj-*.jpg`).
- **Bez JS:** všetko „vidno“, zábery 0 (nestiahnu sa). Bežia len 2 nekonečné CSS animácie, ktoré má aj dnešný web
  (pás značiek). Na Katalógu je 0 skrytých prvkov (`snimky/bezjs-*.jpg`). `scrollWidth = innerWidth` (390, 1440).
- **Prehliadač bez prechodov medzi dokumentmi** (Firefox; simulované `@view-transition{navigation:none}`, `vt: false`):
  okamžitý strih bez bieleho aj čierneho medzisnímku, jas 176 (`snimky/prechod-390-bezVT-*.jpg`, otvorené). 200 ms
  čakanie zálohy je preč.
- **Späť a Vpred:** typ `spat` (Späť) a `dalej` (Vpred), navigácia `back_forward`. Hlavička sa pri Späť zmenší do
  dlaždice (`snimky/prechod-390-3-spat.jpg`, `prechod-1440-3-spat.jpg`, otvorené), pri Vpred sa znova zväčší
  (`*-4-vpred.jpg`). Pri reloade prechod nie je.
- **Prechody medzi stránkami (sekvencie, otvorené):** `snimky/prechod-390-{1-uvod-katalog,2-katalog-kategoria,3-spat,
  4-vpred,5-menu-akcie,6-akcia-detail}.jpg` a rovnaké `prechod-1440-*`. Jas aspoň 174,7 (390) a 162,8 (1440),
  tmavé px najviac 13,1 % a 16,3 % (`meranie/jas-vt-*.txt`). Počas prechodu je rám hlavičky bez podkladu, takže
  fotka neletí do prázdneho svetlého rámu (`:root:active-view-transition .ph-foto`). Sú to fotky dlaždíc, nie clona.
- **Vyhľadávanie:** „cement“ → 7 výsledkov (390 aj 1440).
- **Náhľad v iframe** (`meranie/iframe.txt`): **0 chýb JS** dnes aj v prototype. V sandboxe bez `allow-same-origin`
  hlási konzola rovnako dnes aj v prototype 16 chýb CORS pri písmach (nepriehľadný pôvod a server bez
  `Access-Control-Allow-Origin`). So `allow-same-origin` je 0 chýb. Prechod dlaždica → kategória v iframe funguje
  (`murovaci-material.html`).
- **Jas videí** (`meranie/jas-video-*.txt`, 10 snímok za sekundu): telefón najmenej 169,0 a najviac 13,7 % tmavých px,
  počítač 159,8 a 16,9 %.

## 6. Merania (A/B striedavo, rovnaké podmienky)

Playwright, Chromium 1243 (headless shell), lokálne servery bez obmedzenia siete. Telefón: 390×844, DPR 3,
`Emulation.setCPUThrottlingRate 4`. Počítač: 1440×900, CPU 1×. Poradie variantov sa v každom kole mení
(`nastroje/ab-uvod.sh`, `ab-prechod.sh`). **Súbežne bežali iné úlohy** (záťaž 1,6 – 3,5 na 4 jadrách, uvedená pri
každom behu v `meranie/ab-uvod.jsonl`), preto sú hodnoty orientačné a porovnávajú sa len v rámci kola.
„B Kamera“ je najlepší z A–C podľa merania poroty (`porota/prac/prehliadka.log`: najnižší medián LCP a najmenej
dlhých snímok).

### 6a. Úvod (`meranie/ab-uvod-suhrn.txt`, 4 + 4 + 4 behy na profil, finálna verzia)
| profil | verzia | LCP medián (behy) | CLS max | snímky > 50 ms počas úvodu 0,6 – 4,6 s | bajty za 6 s* |
|---|---|---|---|---|---|
| telefón CPU 4× | dnes (film) | 534 (548/612/520/408) | 0 | 2/1/0/0 | 5 077 kB (film 3 860) |
| telefón CPU 4× | B Kamera | **378** (308/384/392/372) | 0 | 0/0/0/0 | 2 319 kB |
| telefón CPU 4× | **D Film** | 442 (452/532/432/424) | 0 | **0/0/0/0** | 2 746 kB |
| počítač | dnes | 336 (368/300/304/384) | 0,0001 | 1/0/0/0 | 8 220 kB (film 7 567) |
| počítač | B Kamera | **218** | 0,0001 | 0/0/0/0 | 2 157 kB |
| počítač | **D Film** | 268 (308/220/304/232) | 0,0001 | **0/0/0/0** | 2 116 kB |

\* Bajty sú z `requestfinished` v Playwright (`meranie/bajty.jsonl`) a zahŕňajú aj sťahovanie filmu pracovným vláknom.
CDP v `ab-uvod.jsonl` worker nevidí, preto je tam pri „dnes“ len 1 348 kB. Z 2 746 kB prototypu na telefóne
pripadá 203 kB na fotku dvora a 1 260 kB na `img/uvod` (zábery strihu sú tie isté súbory ako pás zásob pod úvodom).
Zvyšok tvoria lenivé obrázky pod úvodom.
Predchádzajúce kolá s rovnakým nástrojom (pred dvoma opravami) mali na počítači 0/2/1/1 a 2/0/2/0 dlhé snímky pri
dopade záberov. Stopa (`nastroje/stopa2.mjs`) ukázala `compositeFailed 64` (TargetHasIncompatibleAnimations): dve
animácie transformácie na tom istom výtlačku sa nedali presunúť do kompozítora. Opravil som to tak, že výtlačok má
len dopad a odchod robí kontajner. Potom som ešte vypustil vnútorný nájazd záberov a zmenšil tieň. Po týchto
zmenách bolo 6 + 4 behov na počítači bez dlhej snímky.

### 6b. Prechody medzi stránkami (`meranie/prechod-tel/suhrn.txt`, `prechod-pc/suhrn.txt`)
„Po FP“ znamená, že snímka začala po prvom vykreslení novej stránky, teda počas animácie. Prvá snímka novej
stránky (jej prvé rozloženie a štýly, 67 – 167 ms pri CPU 4×) je pred animáciou v oboch verziách.
| profil | verzia | prechodov | > 50 ms spolu | **> 50 ms po FP** | trvanie od FP |
|---|---|---|---|---|---|
| telefón CPU 4× (4 kolá) | dnes („papier“) | 24 | 22 | **1** | 527 – 563 ms |
| telefón CPU 4× (4 kolá) | D Film | 24 | 24 | **5** | 409 – 511 ms |
| počítač (3 kolá) | dnes | 18 | 9 | **3** | 460 – 523 ms |
| počítač (3 kolá) | D Film | 18 | 16 | **9** (najmä P2/P3 zdieľaná fotka) | 343 – 492 ms |

Kontrolný pokus na telefóne (`meranie/prechod-exp/`, 2 × 6 prechodov na variant) mal po FP: plná verzia 0 z 12, bez
`content-visibility` 1 z 12, bez animácií pri posune 1 z 12. Rozdiely 0 – 5 z 24 sú teda na hranici šumu pri
zdieľanom CPU. Na počítači je však rozdiel opakovaný (pozri R1). LCP novej stránky je na telefóne 200 – 392 ms
pri D a 156 – 316 ms dnes.

### 6c. Posun úvodnej stránky (telefón CPU 4×, 30 × 100 px kolieskom, `meranie/posun-ab.jsonl`)
D Film: snímky nad 50 ms 1/1/0 z ~250, najdlhšia 67 ms. Dnes: 0/0/0, najdlhšia 33 – 50 ms. Dnešný web počas
posunu filmovej dráhy obsah pod úvodom vôbec nevykresľuje (trieda `skryte`), takže porovnanie nie je úplne férové.

## 7. Riziká a otvorené body

- **R1 Zdieľaná fotka na počítači (P2/P3):** skupina `::view-transition-group` mení šírku a výšku, čo robí hlavné vlákno.
  V headless Chromiu bez GPU navyše skladá snímky softvérový kompozítor (`VizCompositorThread` 17 – 36 ms na snímku
  v stope). Vtedy vzniká 1 snímka 67 – 117 ms. **Pred nasadením treba overiť na skutočnom počítači a telefóne s GPU.**
  Ak sa to potvrdí, stačí jeden riadok v CSS: na počítači nahradiť zdieľanú fotku len prelnutím
  (`@media (min-width:1001px){::view-transition-group(fd-foto){animation-duration:0s}}`) a P1/P4 ostanú.
- **R2 Prvá snímka novej stránky** trvá pri CPU 4× 67 – 167 ms v oboch verziách (rozloženie stránky s 92 kB CSS).
  Animácia začína až po nej, takže ide o oneskorenie začiatku, nie o trhnutie. Ďalšia úspora je v CSS (zjednotenie
  pravidiel), čo je mimo tohto konceptu.
- **R3 Pôvod fotky `u4`:** rovnaké riziko ako pri A až C. V gite je len jedna verzia (pridaná v `bb6bbaeb`) a nie je
  medzi súbormi generatívnej úpravy. Úplnú istotu dajú originály od majiteľa. Tie by zároveň vyriešili ostrosť na
  Retina 1440 (1,67×) a 1920 (1,12×) a záberov na veľkých telefónoch (430 px: 0,96 – 1,01).
- **R4 Vrátené fotky (plán pre majiteľa):** `pas-dvor`, `dvor-predajna` a `zasoba-porfix` sú neupravené. Na
  Porfixe je vidieť prázdnu a načatú paletu, v rade pred predajňou modré plachty. „Plné zásoby“ teraz dokazuje
  fotka `u4` a štyri zábery, nie dokreslené palety. Ak majiteľ chce plnší Porfix, jediná poctivá cesta je nová
  skutočná fotka.
- **R5 Skutočné autá firmy** (`img/p/885` v Službách na úvode, `p/883–885` na stránke Služby) nie sú z klipu a ostali.
  Ich ponechanie rozhodne majiteľ (diagnóza, časť 1). Text o mechanickej ruke ostáva.
- **R6 Náhľad v iframe:** písma v sandboxe bez `allow-same-origin` blokuje CORS. Je to rovnaké ako dnes a nie je
  to chyba JS. Rieši to hosting (hlavička `Access-Control-Allow-Origin` pre `assets/fonts/`) alebo sandbox
  `allow-same-origin`. Či sa prechody medzi dokumentmi v iframe claude.ai prejavia, závisí od prehliadača. Ak nie,
  je tam okamžitá navigácia.
- **R7 Prerender pri dotyku dlaždice:** pri kliknutej dlaždici sa stiahne cieľová stránka o chvíľu skôr. Bez
  podpory (Safari, Firefox) sa nič nestane a fotka sa zdieľa len vtedy, keď je hlavička už načítaná. Inak je
  len prelnutie.
- **R8 Safari 18.2+** má prechody medzi dokumentmi aj typy, ale WebKit som tu netestoval (nie je k dispozícii).
  Treba ho skúsiť na iPhone.
- **R9 Texty:** podľa STYL.md (P1 až P8 a mikrocopy) som prepísal len úvodnú stránku, výzvu pred pätou (P10) na
  všetkých 75 stránkach a zástupný text vyhľadávania („Hľadajte:“). Podstránky generované `build.py` a `obsah.py`
  ešte miestami tykajú. To je samostatná úloha textára.
- **R10 Prenos do stromu:** `build.py` neprepisuje `index.html`. Treba preniesť `index.html`, `site.css` a `site.js`
  podľa `zmeny.diff`. Do šablóny v `build.py` treba dať skript `vt-head.js`, preload dvoch písem a Speculation Rules
  (prototyp ich do 74 podstránok vkladá skriptom `zloz.py`). Ďalej `OG_IMG` (`build.py:24`, v kópii prepísané),
  skopírovať `img/film-d/` a vrátené `img/uvod/*` a zmazať `img/film/` (24,8 MB) a `img/uvod/og.jpg`. Upraviť treba
  aj `zdroj/film.*`, výnimku v `nasadenie/balik.sh`, README, FOTKY.md a testy filmu v `dokoncenie/nastroje`.
- **R11 Asistent** nie je súčasťou tohto konceptu. Spodná lišta `.mbar` a pravý dolný roh treba pri jeho
  umiestnení skoordinovať so strihom úvodu, ktorý je vpravo v ráme.
- **R12 Otvorené otázky majiteľa** (staré akcie bez dátumu, LIAZ vs. Iveco, znenie zľavy 5 % / 3,3 %, Nero Ebono,
  hosting a HTTPS) som nemenil. „Iveco 8 t“ v zozname služieb na úvode ostáva, kým majiteľ nerozhodne.

## 8. Zdroje inšpirácie (čo odkiaľ a čím sa líši)

Všetky referencie navštívili a zachytili rešerše 5. 11. 2026 (`../inspiracia/galerie|odvetvie|technika/ZAPIS.md`,
hárky tam). Prevzaté sú len princípy, kód je vlastný.
| Zdroj (URL) | Čo inšpiruje | Čím sa D líši |
|---|---|---|
| Haven Constructions, Awwwards HM 10. 6. 2026 – https://www.havenconstructions.com.au/ (galerie R1) | slovo vyjde zdola z drážky | bez modrej opony (jas 51), H1 nad už viditeľnou fotkou, delenie po riadkoch, nie po písmenách |
| Hays Woodworking – https://www.hayswoodworking.com/ (R3) | „odhalenie“ plochou, ktorá odíde | svetlé pásy papiera nad už viditeľnou fotkou (cinemascope), nie sýta opona pred obsahom |
| Codrops: Image Layer Animations with Clip-Path – https://tympanus.net/codrops/2023/10/31/image-layer-animations-with-clip-path (R9), Fullscreen Clip Animation (R8) | strih viacerých záberov ako v traileri | výtlačky dopadnú na dvor cez `transform` (nie `clip-path`, nie celoplošne kvôli ostrosti), skutočné fotky zásob so štítkom |
| Petersen Tegl – https://www.petersen-tegl.dk/ (odvetvie R1) | materiál je hrdina, typografia ako štítok palety | štítok na papieri s tehlovou hranou (nie text na tmavom pruhu), aj v páse zásob |
| Coltman Bros – https://coltmanbros.co.uk/ (R15) | „navštívte náš dvor“ ako hlavná správa | Richtárik dvor ukazuje fotkou, nielen opisuje |
| Byggmax – https://www.byggmax.se/ (R17) | postupný nástup „chipov“ s oneskorením podľa indexu | posun podľa stĺpca na časovej osi posunu, nie časovač |
| Chrome: Profiles MPA – https://view-transitions.chrome.dev/profiles/mpa/ (R5), Off the beaten path (R6, aj prerender) | zdieľaný prvok medzi dvoma HTML a prerender cez Speculation Rules | dlaždica → hlavička kategórie, 0,44 s, prerender len pri dotyku (conservative), pri Späť sa prelne až na konci |
| Chrome: Stack Navigator MPA – https://view-transitions.chrome.dev/stack-navigator/mpa/ (R4) | typy push/pop podľa smeru | papierový podklad namiesto `background: black` (nameraný jas 0), stará stránka sa nezmenšuje ani nestmavuje |
| scroll-driven-animations.style Image Reveal – https://scroll-driven-animations.style/demos/image-reveal/css/ (R7) | fotka sa odhalí pri posune | filmová clona `scaleY` pseudoprvkov namiesto `clip-path` (v koncepte C zhodil kompozítor), začiatok nie je neviditeľný |
| Codrops: Double Image Hover – https://tympanus.net/codrops/2023/03/01/double-image-hover-effects-with-clip-path-animations/ (R13) | odozva dlaždice pri myši | šípka v páse názvu a stlačenie pri dotyku, žiadna druhá fotka |
| Chrome for Developers: Cross-document view transitions – https://developer.chrome.com/docs/web-platform/view-transitions/cross-document (T1) | `@view-transition`, `pageswap`/`pagereveal`, limit 4 s, reload | – |
| Shopify.dev: Cancel view transitions on interaction – https://shopify.dev/docs/storefronts/themes/best-practices/performance/cancel-view-transitions-on-interaction (T3) | `skipTransition` pri `pointerdown`/`keydown` | – |
| WebKit: Scroll-driven animations with just CSS – https://webkit.org/blog/17101/a-guide-to-scroll-driven-animations-with-just-css/ (T5) | `animation-timeline` za skratkou, rozsahy | – |
| CSS-Tricks: Cross-document view transitions gotchas – https://css-tricks.com/cross-document-view-transitions-part-1/ (T9) | `object-fit: cover` na snímkach prechodu | – |
| web.dev: High-performance CSS animations – https://web.dev/articles/animations-guide (T10); A. Roselli: Don't split words into letters – https://adrianroselli.com/2026/02/you-know-what-just-dont-split-words-into-letters.html (T11) | len `transform`/`opacity`; text deliť najviac po riadkoch | – |
| Negatívne: Wienerberger SK, Porfix SK (cookie okno cez úvod), Leitl (tmavé video 64 %), Jonite (do 8 s nič) | čomu sa vyhnúť | žiadne okno, video ani clona pred obsahom; prvý snímok je hotový obraz |

## 9. Súbory

- `web/`: prototyp. `zmeny.diff`: rozdiel voči stromu (`index.html`, `site.css`, `site.js`, `build.py`, `katalog/index.html`).
- `sekvencia-uvod-390.jpg`, `sekvencia-uvod-1440.jpg`: sekvencie úvodu.
- `snimky/`: `uvod-390|1440-*.jpg`, `prechod-390|1440-*.jpg` (6 prechodov), `prechod-390-bezVT-*.jpg`,
  `posun-sekcie-*.jpg`, `pokoj-*`, `bezjs-*`, `iframe-1440.jpg`, `og-a-pravy-okraj.jpg`.
- `video/`: `film-telefon.webm|mp4` (390×844, CPU 4×, 18,5 s: úvod → posun → Katalóg strihom → Murovací materiál
  zdieľanou fotkou → Späť → Vpred), `film-pocitac.webm|mp4` (1440×900, MP4 zmenšené na 960 px) a hárky
  `video-harok-telefon.jpg` a `video-harok-pocitac.jpg` (každých 0,5 s, otvorené).
- `meranie/`: `ab-uvod.jsonl` a `ab-uvod-suhrn.txt`, `bajty.jsonl`, `prechod-tel|pc/` (logy a súhrn), `posun-ab.jsonl`,
  `kontroly.json`, `ostrost.jsonl`, `iframe.txt`, `jas-video-*.txt`, `jas-vt-*.txt`.
- `nastroje/`: `zloz.py` (zloženie), `film-d.css`, `film-d.js`, `vt-head.js` (zdroj), `meraj-uvod.mjs`, `ab-uvod.sh`,
  `prechod.mjs`, `ab-prechod.sh`, `suhrn-*.py`, `kontroly.mjs`, `ostrost.mjs`, `posun*.mjs`, `video.mjs`, `pozri.mjs`,
  `harok.py`, `sekv.py`, `stopa*.mjs`, `bajty.mjs`, `iframe-dnes.mjs`.
