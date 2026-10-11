# Príprava záberov: stupne, výrezy na telefón, hĺbka, zálohy v HTML

Zdroj: `barbershop-30/source/tools/film.py`, `hlbka.py`, `stills.py`, `barbershop-30/docs/TOUR_DIRECTION.md`
(časť Technika a Mobil), `barbershop-30/docs/ART_DIRECTION.md` (časť 7), `README.md` HEAD SPA (Film zo
skutočných fotiek). Spúšťa sa z koreňa `barbershop-30`, Python vždy s `-I`.

## 1. Výber fotiek

- Len fotky skutočného miesta. Rozpoznateľné osoby (aj odraz v zrkadle, chodci za sklom) bez súhlasu
  nepoužiť (`ART_DIRECTION.md` časť 7).
- Fotka na šírku s hĺbkou: niečo vpredu (kreslo, pult, sud), stena vzadu. Hĺbková mapa potom dáva
  zmysluplný posun popredia.
- Bod záujmu na vec, ktorú pomenúva popis miesta: pult, stôl, pumpa, kreslo (`TOUR_DIRECTION.md`, Mobil).
  Pre počítač je to `data-f` na kotve v HTML (píše sa ručne), pre výrez na telefón `fx`, `mfx`, `mfy`
  vo `film.py` (z nich `stills.py` dopíše `data-fm`).
- Popis miesta (`place`) len podľa toho, čo na fotke naozaj je.

## 2. `film.py`: stupne a výrezy

Zápis záberu (`SHOTS` v `film.py`): `meno: (zdroj, popis miesta, fx, voľby)`, kde `fx` je x bodu záujmu
pre výrez na telefón (0 až 1). Voľby:

| Voľba | Význam |
| --- | --- |
| `m` | iný zdroj pre telefón (fotka toho istého miesta na výšku) |
| `mfx`, `mfy` | bod záujmu pre výrez na telefón (0 až 1), inak `fx` a 0,5 |
| `mh` | výška okna výrezu ako podiel výšky fotky; detailné zábery sa tak na telefóne zúžia na predmet |
| `big` | aj stupeň 4096 px (fasáda pre nájazd k dverám v úvode) |

Konštanty:

```python
WIDTHS = (1086, 1448, 2172, 2896)      # stupne na šírku (desktop)
M_WIDTHS = (1086, 1448)                # stupne výrezu na výšku (telefón; film tam berie najviac 1448)
M_RATIO = 9 / 16                       # výrez na telefón: šírka / výška
AVIF_Q, WEBP_Q = 66, 84                # maximálny detail: vyššia kvalita než pôvodných 58 / 80
FIRST_Q = {'vstup-m-1086': (46, 74), 'rohozka-m-1086': (46, 74)}
```

`FIRST_Q`: prvý obraz stránky na telefóne je úspornejší, aby text úvodu (LCP) nečakal na veľkú fotku
(107 a 122 kB namiesto 215 a 272 kB, `CHECKS.md` časť 10).

Stupne nikdy nezväčšujú originál:

```python
def tiers_for(W, widths, big=False):
    """Stupne, ktoré sa vyrobia: všetky pod šírkou originálu a prvý nad ňou ako kópia originálu."""
    out = []
    for w in sorted(widths):
        out.append(w)
        if w >= W: break
    if big and W > max(widths): out.append(W)
    return out
```

Preto napríklad `rohozka-2172` má 1920 px a v `srcset` je zapísaná ako `1920w`.

Výrez na telefón: okno 9 : 16 okolo bodu záujmu, na celú výšku alebo `mh` z nej, nikdy cez okraj fotky.
Pre výrez sa robí vlastná hĺbková mapa (`<meno>-m-hlbka.webp`), nie výsek z mapy celej fotky.

Výstup do `assets/img/film/`:
`<meno>-{1086,1448,2172,2896[,4096]}.{avif,webp}`, `<meno>-hlbka.webp`, `<meno>-m-{1086,1448}.{avif,webp}`,
`<meno>-m-hlbka.webp` a `film.json` (zdroj, popis, rozmery, stupne a ich veľkosť, výrez: rozmery, poloha,
`fx`, `fy`). Celý priečinok mal 39 MB, stiahne sa vždy len to, čo zariadenie potrebuje (`CHECKS.md` časť 6).

```
python3 -I source/tools/film.py            # všetky zábery
python3 -I source/tools/film.py stol kava  # len niektoré
```

## 3. `hlbka.py`: hĺbková mapa

- Model Depth Anything V2 small v ONNX (asi 99 MB), beží lokálne cez onnxruntime na CPU. V gite nie je:
  `source/tools/depth/model.onnx` (v `.gitignore`) alebo cesta v premennej `DEPTH_MODEL`.
- Vstup: dlhšia strana 518 px, rozmery násobok 14, normalizácia ImageNet. Výstup sa normalizuje na
  0 až 1, **svetlá = blízko** (model dáva inverznú hĺbku).
- Uloží sa ako WebP (kvalita 90) **najviac 768 px na šírku**:

```python
# najviac 768 px na šírku: film viac nepotrebuje (mriežka 256 buniek) a väčšiu mapu by pri každom zábere
# zmenšoval na hlavnom vlákne (zastavenie 36 až 320 ms na telefóne)
tw = min(W, 768)
```

Hĺbkové mapy po tejto úprave: spolu 970 → 222 kB (`CHECKS.md` časť 13), jednotlivé mapy v repozitári majú asi 5 až 19 kB (26 máp, spolu 227 196 B).
Film má pre istotu aj poistku (`depthBitmap` vo `film.js`): širšiu mapu zmenší cez `OffscreenCanvas`,
ale to je práve tá drahá cesta, ktorej sa má príprava vyhnúť.

Na grafike sa mapa po načítaní ešte raz zjemní (`soften()`): dva prechody max filtra (rozšíri popredie
o polomer `2 × sig`), dva prechody gaussa (`3 × sig`, najviac 40 texelov), `sig = max(1,5; 1,2 × šírka
mapy v texeloch / počet buniek mriežky na šírku)`, teda asi 1,2 bunky. Predmet sa hýbe ako celok a pri pohybe sa naťahuje len úzky pás steny za ním.

## 4. `stills.py`: zálohy a atribúty kotiev z `film.json`

Prepíše v `index.html` každú `<picture class="film-still">` (aj v `<template>` a `<noscript>`) a doplní
atribúty kotiev `.film-shot` (`data-size`, `data-tiers`, `data-m`, `data-m-size`, `data-m-tiers`, `data-fm`
a to isté pre prológ `data-pro-*`). Zachová `alt`, `loading`, `fetchpriority`, `decoding`, `--fx`, `--fy`.

Štruktúra zálohy:
1. `<source media="(max-width: 720px)" type="image/avif">` výrez `-m` (prah telefónu ako vo `film.js`),
2. to isté WebP,
3. `<source type="image/avif">` všetky stupne na šírku,
4. to isté WebP,
5. `<img>` WebP (druhý stupeň v `src`) so skutočnými `width` a `height` fotky.

`sizes` je zvolené tak, aby záloha vybrala **ten istý stupeň ako film** a film ho mal z cache:

```python
# šírka pre výber stupňa: rovnaký stupeň, aký si vyberie film (rovina záberu 1,24 × okno; telefón kreslí 2×,
# preto 93vw dá pri 3× aj 2× displeji 1086 px), takže fotku zálohy film už má v cache
SIZES = '(max-width: 720px) 93vw, 124vw'
```

```
python3 -I source/tools/stills.py          # prepíše index.html
python3 -I source/tools/stills.py --check  # len overí, či sedí (návratový kód 1 = líši sa)
```

## 5. Ako si film vyberá stupeň (`pickSize` vo `film.js`)

- Potrebná šírka = šírka roviny záberu / šírka okna × šírka plátna v pixeloch; vezme sa najmenší stupeň,
  ktorý je aspoň 95 % potrebnej šírky.
- Strop: telefón 1448 px (výrez na výšku je tak takmer bod na bod aj na displeji 3×), počítač 2896 px,
  záber prológu 4096 px (kamera doň nabieha asi 1,5×), vždy najviac `maxTextureSize` grafiky.
- Raz načítaná veľkosť sa drží aj po znížení rozlíšenia; väčšia sa načíta len keď treba a vymení sa
  až keď je celá v grafike.
- AVIF prvý; keď ho prehliadač nedekóduje, ďalej už len WebP.

## 6. Preload prvého obrazu

Hlavička vloží `<link rel="preload" as="image" type="image/avif" imagesrcset=… imagesizes=…>` pre zálohu
úvodu (fasáda pri prológu, inak rohožka; telefón výrez `-m`) s `fetchPriority = 'high'`. Tabuľky stupňov
v tomto skripte musia sedieť so `srcset` kotvy úvodu, inak sa fotka stiahne dvakrát
(`barbershop-30/index.html`, komentár „DEPLOY STEP: tie isté srcset ako v kotve úvodu“).

## 7. Kontrola ostrosti

`node source/tools/ostrost.mjs --a=<stará adresa> --b=<nová adresa> --shots=sala,kreslo`: ten istý záber
na telefóne 390 × 844 @3 a počítači 1440 × 900 @2, film na rovnakej polohe (`BS30_FILM.goTo`), číslo ostrosti
je rozptyl Laplaciánu v strede obrazu (`ostrost.py`). Väčšie = ostrejšie.

## Rozdiel oproti HEAD SPA 30

HEAD SPA (`README.md`, Film zo skutočných fotiek) má fotky na výšku 3 : 4 (`pa = 0.75` v `world.js`),
stupne 1086, 1448 a 2172, pričom 2172 je dvojnásobok originálu: zaostrená fotka z polovice zmiešaná
s verným zväčšením. BARBERSHOP 30 originál nezväčšuje vôbec a ostrosť získava väčšími originálmi,
vlastnými výrezmi na telefón, mipmapami a anizotropiou. Pri novom projekte použi postup BARBERSHOP 30.
