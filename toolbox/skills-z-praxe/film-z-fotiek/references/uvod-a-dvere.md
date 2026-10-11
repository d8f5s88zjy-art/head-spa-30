# Úvod cez dvere: prológ vo filme a dvere ako vrstva

Dve overené riešenia toho istého zámeru: návštevník na začiatku „vojde“ skutočnými dverami podniku.
Obe bežia raz za návštevu, dajú sa preskočiť a stránka pod nimi je od prvej chvíle použiteľná.

| | Prológ vo filme (BARBERSHOP 30) | Dvere ako vrstva (HEAD SPA 30) |
| --- | --- | --- |
| Technika | záber fasády vo filme, kamera ide k dverám, strih `najazd` dnu | fotka dverí, krídla v CSS 3D sa otvoria dnu |
| Potrebuje WebGL | áno (bez filmu sa nekoná) | nie |
| Kód | `barbershop-30/assets/film.js` (prológ 1283 až 1339), `index.html` (hlavička, kotva úvodu), `style.css` (`.film-bars`, `.film-door`) | `index.html` (hlavička, `.veil`), `assets/app.js` (`flipVeil`, `endVeil`), `assets/style.css` (`.veil`) |
| Dokument | `barbershop-30/docs/TOUR_DIRECTION.md` (Úvod ako film, Návrat na otváraciu scénu) | `README.md` (Úvodné dvere, Dvere na úvode) |

## A. Prológ vo filme

### Rozhodnutie v hlavičke

Trieda `pro` na `<html>`, keď: film pôjde (`world`), adresa nemá kotvu (`#…`), karta je zobrazená, nie je
`?uvod=off` a buď `?uvod=znova`, alebo ešte nie je `sessionStorage.bs30uvod`. Rozhoduje sa tu, aby prvý obraz
stránky bola hneď fasáda. Hlavička zároveň prednačíta zálohu úvodu (fasáda pri prológu, inak rohožka; na
telefóne výrez `-m`) s rovnakým `srcset` ako v kotve a `fetchPriority = 'high'`.

### Statická záloha úvodu z `<template>`

Kotva úvodu má dve zálohy v `<template>` (prehliadač ich nesťahuje) a hneď za nimi krátky skript, ktorý vloží
tú správnu:

```html
<script>(function(d){var t=d.getElementById(d.documentElement.classList.contains('pro')?'still-vstup':'still-uvod');t.after(t.content.cloneNode(true));})(document);</script>
```

V `<noscript>` je záloha bez prológu. Záloha fasády má triedu `film-still-pro` (`--z0: 0.05`, začiatok chôdze).

### Časová os (`proS`, `proMs`)

- `S` ide z 0 (fasáda) do 1 (záber úvodu) po jednej krivke `smoothstep` cez celý čas: pomalý rozbeh na chodníku,
  najrýchlejšie v dverách (tam je strih), pomalý dojazd. Chôdza 1,1 s (telefón 1,3 s), vstup 0,9 s (1,0 s).
- Pohyb záberu fasády `door`: dopredu o 34 % vzdialenosti (asi 1,5× priblíženie), na počítači aj bokom k dverám.
- Strih `vstup>rohozka`: `najazd a:0.76,0.53 ma:0.50,0.53` (bod dverí na fasáde a vo výreze na telefón).
- Chôdza začne, až keď je nakreslená fasáda **a** načítaný záber úvodu; pred podnikom sa čaká najviac 1,5 s.
  Ak záber úvodu ešte nie je, kamera počká pred dverami (S 0,33) najviac 4 s.
- Poistky: bez prvého snímku do 7 s sa prológ vynechá a film začne rovno úvodom. Pri opakovanom vojdení
  z ulice a pri odchode von sa film vzdá, keď fasáda nie je nakreslená do 12 s, a stránka ide ďalej normálne.
- Počas prológu sa nemení rozlíšenie plátna (`quality()` nemeria). Na začiatku sa sťahuje len fasáda a záber
  úvodu; ďalší záber za úvodom až od polovice prológu (`keepAround` vynechá len záber o dva ďalej).
- Skrolovanie prológ hneď ukončí (`|T − 1| > 0,02`), ďalej vedie pružina. Pri opakovanom vojdení z ulice
  až pri `|T − 1| > 0,5` (polovica cesty k ďalšej kotve), aby drobný posun kolieskom nezrušil chôdzu.
- Prológ sa pustí len keď návštevník naozaj stojí na začiatku stránky (`scrollY` pod štvrtinou okna);
  pri malom obnovenom posune sa stránka skokom vráti na 0.

### Filmové pásy

`.film-bars` (dva prvky `<i>` hore a dole, 8 % výšky, do 900 px šírky 9 %) sú vysunuté, kým má `<html>` triedu
`pro` alebo `outside`; po prológu sa odsunú za 900 ms. Poistka: ak film nenakreslí prvý snímok, CSS animácia
`bars-out` ich odsunie po 5 s. Pri `world-off` sa nezobrazia vôbec.

### Späť na ulicu a znova dnu

- Von: tlačidlo `.film-door` („Späť na ulicu“, viditeľné len pri `world-in`), koliesko nahor (`deltaY < −8`),
  potiahnutie prstom nadol o viac než 28 px, šípka hore, PageUp alebo Home. Platí len keď stránka stojí na
  vrchu aspoň 350 ms (`atTopSettled`). Kamera ide z úvodu cez dvere von za 1,9 s (telefón 2,2 s) a ostane stáť
  (`html.outside`, S = 0).
- Dnu: to isté tlačidlo („Vojdi dnu“), koliesko nadol, potiahnutie nahor, šípka dole, PageDown, medzerník,
  alebo bežné skrolovanie (pružina prejde cez dvere). Opakované vojdenie je prológ o tretinu rýchlejší
  (chôdza × 0,65, vstup × 0,75).
- Gestá neplatia pri otvorenom menu alebo lightboxe; klávesy navyše nie z polí, tlačidiel a odkazov.
- `html { overscroll-behavior-y: none; }`, aby potiahnutie nadol na vrchu neobnovilo stránku.
- Záber fasády sa načíta len keď ho treba a po vojdení sa uvoľní.

### Kontrola

- `node barbershop-30/source/tools/uvod-shot.mjs`: snímky prológu na polohách (`BS30_FILM.proFreeze`), skrol,
  druhá návšteva bez prológu, `?film=off`.
- `node barbershop-30/source/tools/uvod-meranie.mjs`: časová os pri rýchlej a pomalej sieti (1,6 Mb/s, 150 ms),
  zastavenia počas chôdze, zmeny DPR; dvojice snímok záloha a prvý snímok filmu.
- `python3 -I barbershop-30/source/tools/uvod-zhoda.py`: posun a mierka dvojíc; rámovanie sedí pri posune do
  8 px a mierke do 2,5 % (namerané do 7 px, mierka 0,98 až 0,99).

## B. Dvere ako vrstva (HEAD SPA 30)

### Rozhodnutie v hlavičke

Trieda `door` a `--veil: 620ms`, keď ešte nie je `sessionStorage.hs30open`, adresa nemá kotvu, nie je obmedzenie
pohybu ani šetrenie dát a karta nie je skrytá. Hlavička prednačíta fotku dverí (`dvere-{800,1200,1600,2400}.webp`,
`sizes="max(100vw, 80.65vh)"`).

### Stavba

`.veil > .scene > .door` s otvorom `.doorway`, zárubňou `.jamb` (hore, vľavo, vpravo) a krídlami `.leaf.l`,
`.leaf.r`. Každý diel je okno do **tej istej** fotky dverí, posunutej tak, aby diely spolu dali celú fotku
(percentá v `assets/style.css`: horná zárubňa 8,27 % výšky, ľavé krídlo od 8 % šírky na 41,75 %, pravé od
49,75 % na 40,5 %). Rám má `--bw: max(100vw, 80.65vh)` a výšku `--bw × 1,24`, perspektívu `--bw × 1,1`.

```css
.veil.lift .leaf.l{transform:rotateY(100deg)}
.veil.lift .leaf.r{transform:rotateY(-100deg)}
```

Krídla sa otáčajú 760 ms (pravé o 60 ms neskôr) a pritom stmavnú (čierny `::after` do 0,6). Trieda `through`
o 260 ms neskôr zväčší celú scénu na 2,6× (do 640 px šírky 2,2×) a rozplynie ju: prejdeš cez dvere. Zlatá značka zo stredu dverí
medzitým preletí na svoje miesto v lište (`flipVeil` počíta posun a mierku z `getBoundingClientRect`).

### Časovanie a poistky (`assets/app.js`)

- Dvere sa ukážu, až keď je fotka dverí dekódovaná; keď do 0,9 s nepríde, tma sa za 420 ms rozplynie bez dverí
  („radšej žiadne dvere ako plochá plocha namiesto fotky“).
- Po ukázaní fotky krídla počkajú 560 ms (telefón 700 ms) a otvoria sa; celé to trvá asi 1,7 s.
- Koniec pri `transitionend` priehľadnosti scény, poistka 2,6 s.
- Dotyk, klik, koliesko alebo kláves dvere hneď jemne otvorí (rozplynutie 320 ms).
- Scéna úvodu na telefóne čaká na koniec dverí (udalosť `hs30veilend`), hlavné vlákno patrí dverám.

### Lekcia z výkonu

Stará verzia dverí stála devätnásť bodov výkonu, lebo telo stránky bolo do konca animácie neviditeľné.
Teraz je stránka vykreslená hneď a dvere sú len vrstva nad ňou; fotka dverí sa prednačíta s bežnou prioritou
a fotka v otvore sa sťahuje až keď sú dvere na obrazovke. Dvere tak stoja zhruba jeden bod (`README.md`,
Dvere na úvode).

## Ktoré zvoliť

- Je film a fotka fasády s dverami: prológ vo filme (jeden súvislý pohyb, žiadna ďalšia vrstva).
- Film nie je istý alebo stačí krátky efekt: dvere ako vrstva. Fungujú aj bez WebGL, len potrebujú fotku
  dverí spredu, z ktorej sa dajú vystrihnúť krídla.
- V oboch: raz za návštevu, nikdy pri príchode na konkrétnu časť (`#kotva`), pri obmedzení pohybu ani v skrytej
  karte; preskočenie jedným gestom; prvý obraz je skutočná fotka, nie prázdna plocha.
