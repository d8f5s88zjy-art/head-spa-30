# Koncept úvodu „Inventúra“: Stavebniny Richtárik (4. 11. 2026)

Rola: motion a web dizajn, smer A. Strom `hs-richtarik-obnova` som nezmenil (`git status --short | wc -l` → 0,
HEAD `4b2646bf`, vetva `richtarik-dokoncenie`). Prototyp je kópia webu v `koncept-inventura/web/` (cez `tar`, bez
`img/film`, `nasadenie`, `zdroj` a `*.md`). Servery na portoch 9640 (prototyp) a 9641 (dnešný web) som po meraní
ukončil (`curl` na oba porty → 000, `pgrep` nič nenašiel).

## 1. Zhrnutie
- Auto je preč. Úvod tvorí sedem **skutočných fotiek dvora**, sú to fotky majiteľa: dvor u4, ulička, pôvodný rad
  TermoBRIK/Porfix, tehly, pórobetón, Stadreko, rezivo. Nič nie je vygenerované ani dokreslené. Fotky Porfix a radu
  pred predajňou sú **neupravené verzie z `bb6bbaeb`**, nie dnešné s doplnenými paletami.
- Strih trvá 4,2 s. Štítok ako na palete vymenúva sortiment: Nitra → Tehly → Pórobetón → Dlažby → Rezivo → Pred
  predajňou → Celý dvor → **Náš dvor**. Všetko pristane na H1 **„Dvor plný materiálu. Od základov po strechu.“**,
  pod ním je vyhľadávanie a tlačidlá Zavolať, Katalóg a Akcie. Na telefóne aj na počítači je to celé na prvej obrazovke.
- Telefón (CPU 4×, 4 behy striedavo A/B): **počas strihu 0 snímok nad 50 ms** v 4 zo 4 behov (najdlhšia 17 ms).
  Medián LCP je **394 ms** (dnes 738 ms) a CLS 0. Obrázky úvodu majú **553 kB, dnešný film 3 953 kB (−86 %)**.
- Celý úvod je svetlý. Najnižší priemerný jas snímky videa je 179 z 255 a nikde nie je čierna ani tmavá plocha.
- Bez JS, pri „obmedziť pohyb“ a pri šetrení dát sa ukáže hneď konečný stav: fotka, H1, vyhľadávanie a Zavolať.
  Zábery strihu sa v takom prípade vôbec nesťahujú.

## 2. Hook (len overené fakty)
| Prvok | Text | Zdroj |
|---|---|---|
| eyebrow | Stavebniny Nitra – Horné Krškany · od roku 1997 (na telefóne bez „– Horné Krškany“) | FAKTY A (adresa, 1997) |
| H1 | **Dvor plný materiálu. Od základov po strechu.** | STYL.md §4 a P1 (vzor H1 úvodu); „dvor plný materiálu“ je výslovne povolené, „od základov po strechu“ je na dnešnom webe (index.html:79) |
| lede | Rodinné stavebniny v Nitre. Spotrebu spočítame a cenovú ponuku pripravíme zadarmo, materiál dovezieme vlastnými autami s mechanickou rukou. | FAKTY B (bezplatný výpočet spotreby PW:28, cenové ponuky zadarmo PW:2722, vlastná doprava a mechanická ruka PW:9, PW:31). Značku auta som neuviedol (❓ LIAZ/Iveco) |
| štítky strihu | Nitra / Horné Krškany · od roku 1997; Tehly / TermoBRIK; Pórobetón / Porfix; Dlažby / a obrubníky Stadreko; Rezivo / stavebné rezivo; Pred predajňou / Novozámocká 62/68; Celý dvor / Horné Krškany; **Náš dvor / Novozámocká 62/68, Nitra** | štítok opisuje to, čo je na fotke (STYL.md P1 má rovnaký zoznam titulkov), adresa FAKTY A; Stadreko patrí do kategórie Dlažby a ploty (FAKTY F) |
| rám | odznak „Skutočné fotografie“ | pravdivý dôkaz (STYL.md P3) |
| vyhľadávanie | placeholder „Hľadajte: cement, Ytong, škridla, Fakro…“ | STYL.md (vykanie) |
| info | Novozámocká 62/68, Nitra · Po–Pi 7:00–16:00 · So 7:00–12:00 | FAKTY A |
| alt / og:image:alt | „Dvor Stavebnín Richtárik v Nitre: vysoké stohy tvárnic na paletách pod modrou oblohou“ | opis fotky u4 |

Úvod neobsahuje žiadne čísla zásob, „najlacnejší“, „hneď“, zľavy 5 % / 3,3 % (❓) ani slovo AI. Pás pod úvodom
dostal podľa STYL.md P3 nadpis „Na našom dvore v Nitre“ s eyebrow „Skutočné fotografie“, aby sa neopakoval s H1.

## 3. Scenár po sekundách
Čas t = 0 je chvíľa, keď sú všetky zábery dekódované. V meraní na telefóne s CPU 4× to bolo 0,74 – 1,13 s po štarte
navigácie. Dovtedy stojí konečný obraz (dvor u4 a štítok „Náš dvor“), ktorý je zároveň LCP.

| t (s) | Záber (fotka) | Štítok veľký / malý | Počítadlo | Pohyb |
|---|---|---|---|---|
| 0,00–0,90 | A1 dvor u4 (vysoké stohy tvárnic) | NITRA / Horné Krškany · od roku 1997 | 01 / 07 | podčiarknutie H1 zmizne, pruh priebehu začne bežať |
| 0,90–1,50 | B1 tehly TermoBRIK | TEHLY / TermoBRIK | 02 / 07 | tvrdý strih, biely záblesk 0,18 s, štítok vyskočí o 14 px |
| 1,50–2,02 | B4 Porfix (pôvodná fotka) | PÓROBETÓN / Porfix | 03 / 07 | rovnako |
| 2,02–2,48 | B2 palety Stadreko, obrubníky | DLAŽBY / a obrubníky Stadreko | 04 / 07 | rovnako (rytmus zrýchľuje) |
| 2,48–2,92 | B3 rezivo | REZIVO / stavebné rezivo | 05 / 07 | rovnako (najkratší záber) |
| 2,92–3,48 | A4 rad TermoBRIK a Porfix pred predajňou (pôvodná) | PRED PREDAJŇOU / Novozámocká 62/68 | 06 / 07 | rovnako |
| 3,48–4,18 | A2 dlhá ulička dvora | CELÝ DVOR / Horné Krškany | 07 / 07 | rovnako, záber je dlhší (spomalenie pred koncom) |
| 4,18 → | A1 dvor u4 (konečný stav = HTML) | **NÁŠ DVOR** / Novozámocká 62/68, Nitra | zmizne → „Prehrať znova“ | záblesk, pod „Od základov po strechu“ nabehne tehlové podčiarknutie (0,7 s) |

Strih sa hneď ukončí skrolovaním, dotykom, klávesom alebo písaním do vyhľadávania (overené: po napísaní „cement“
je strih ukončený a výsledkov je 7). Ak zábery nie sú pripravené do 4 s od navigácie, ak zákazník už skroloval alebo
ak je fokus v úvode, strih sa nespustí a v ráme ostane tlačidlo „Prehrať úvod“.

Snímky (otvorené): `snimky/harok-390.jpg` a `snimky/harok-1440.jpg` (8 stavov, bez JS, obmedziť pohyb), jednotlivé
`snimky/inv-390-01…08.png`, `inv-1440-01…08.png`, `inv-*-koniec.png`. Stavy overil skript `nastroje/snimky.mjs`
s ovládaním času stránky (výstup `prac/snimky-vystup.json`: pocet 01–07, štítky v poradí, `on` = správny súbor záberu).

## 4. Technika
- **HTML** (`web/index.html:47–69`): `<section class="inv">`. Konečný stav je obyčajné HTML: eyebrow, H1, lede,
  vyhľadávanie (presunuté z bývalého pásu `.hledaj`), tlačidlá, info a `<figure class="inv-ram">` s `<picture>` dvora
  (AVIF a WebP, telefón 6:5 `a1-m`, počítač 4:5 `a1-d` 960w / `a1-d2` 1448w, `fetchpriority="high"`). Štítok je
  `<figcaption>`. Zábery strihu sú v `<template id="inv-zabery">` (`:68`), takže sa bez JS nesťahujú. Preload dvora je
  v `:19–20` a nahrádza preload filmu. Skript v `<head>` (`:25–26`) už film nepripína. Ostala len stráž písma, ktorá
  skryje text úvodu najviac na 1 s, kým sa nenačíta písmo. og:image aj JSON-LD `image` ukazujú na
  `img/inventura/og-dvor.jpg`.
- **JS** (`web/assets/site.js:114–172`, 4 433 B). Po načítaní fotky dvora naklonuje `<template>` a čaká na
  `img.decode()` všetkých šiestich záberov. Strih je reťaz `setTimeout`. Každý strih prepne triedu `.on` (opacity 0/1,
  zábery majú počas strihu `will-change: opacity`, sú to teda hotové vrstvy kompozítora), zmení text štítku
  a prepne triedy `ba`/`bb`. Tie striedajú názvy animácií, takže sa animácia znova spustí bez vynúteného prepočtu
  rozloženia. Celý **film (51,8 kB, Worker, OffscreenCanvas) je zo `site.js` preč**: súbor má 20 334 B namiesto
  67 785 B, po gzip 7 197 B namiesto 23 374 B.
- **CSS** (`web/assets/site.css:916–1001`, 7 900 B). Animujú sa len `opacity` a `transform` (záblesk, štítok, pruh
  priebehu `scaleX`, podčiarknutie). Zo `site.css` odišla časť „Úvodný film“ (pôvodne `:770–883`), `.skryte` a
  `.bezanim` (`:170–180`) a priehľadná lišta s bielym logom (`body.home .top…`). Lišta je svetlá ako na podstránkach.
  `:1004` vracia na obsah pod pásom zásoby `content-visibility:auto` s `contain-intrinsic-size:auto 700px` (ako
  dnes, len bez JS). Meraním sa tým zmiernili dlhé snímky pri načítaní (`prac/cv/meranie.json` proti
  `prac/meranie-bez-cv.json`).
- **Rozloženie.** Počítač (od 1101 px): text vľavo, rám 4:5 vpravo s výškou `clamp(500px, 100svh − 150px, 800px)`.
  Tablet (701–1100 px): dva rovnaké stĺpce. Telefón: rám 6:5 hore, pod ním text. Nízky telefón (výška do 760 px):
  rám sa zúži na široký filmový pás `max(150px, 100svh − 440px)` a lede ide pod tlačidlá, aby vyhľadávanie
  a Zavolať ostali nad spodnou lištou. Overené na 320, 360, 390, 768, 1024, 1440 a 1920 px, všade
  `scrollWidth = innerWidth` (`prac/funkcie.json`, snímky `snimky/inv-320…1920-koniec.png`).
- **Obmedziť pohyb a šetrenie dát:** skript sa nespustí (`reduce`, `navigator.connection.saveData`), CSS vypne nábeh
  textu. **Bez JS:** konečný stav. Overené v `prac/snimky-vystup.json`: `h1`, `foto`, `hladanie`, `tel` sú viditeľné
  a nad okrajom okna, `zabery: 0`, stiahnutý je len `b4-d.avif` (dlaždica Porfix v páse zásoby, nie záber strihu).

## 5. Fotky a bajty
Zábery vyrába skript `nastroje/zabery.sh`: len výrez (`convert -crop`), zmenšenie (nikdy zväčšenie), AVIF (libaom)
a WebP. Hárok výrezov je v `prac/harok-zabery.jpg` (otvorený).

| Záber | Zdroj (skutočná fotka) | Telefón (m) | B | Počítač (d) | B |
|---|---|---|---|---|---|
| A1 dvor | git `44aa237b^` `u4-p-1920` (výrez bez pravého okraja, kde stojí auto) / `u4-t-1448` | 1080×900 | 73 107 | 960×1200 (+1448×1810 pre hustotu 2: 241 998) | 163 439 |
| B1 tehly | `img/uvod/zasoba-tehly-856` | 856×713 | 32 848 | 720×900 | 35 163 |
| B4 Porfix | git `bb6bbaeb` `zasoba-porfix-900` (**pôvodná**) | 900×750 | 66 759 | 720×900 | 85 311 |
| B2 Stadreko | `img/uvod/zasoba-stadreko-900` | 900×750 | 64 037 | 720×900 | 88 951 |
| B3 rezivo | `img/uvod/zasoba-rezivo-900` | 900×750 | 114 201 | 720×900 | 124 873 |
| A4 rad pred predajňou | git `bb6bbaeb` `pas-dvor-1920` / `pas-dvor-t-1290` (**pôvodné**) | 1080×900 | 83 703 | 720×900 | 69 191 |
| A2 ulička | git `prijazd-podklad-p-1512` / `-t-1086` | 1021×851 | 116 752 | 720×900 | 111 974 |
| **spolu** | | | **552 707** | | **678 902** |

og:image `img/inventura/og-dvor.jpg` má 1200×630 a 161 244 B. Je to výrez `u4-p-1920` bez auta, otvorený
v `prac/skrol-og.jpg`. Pravý okraj výrezu A1 pre počítač som zväčšil a pozrel (`prac/a1d-okraj.png`): je tam drevená
budova, nie auto. V kópii webu ukazuje og:image na nový súbor na všetkých 75 stránkach, starý `img/uvod/og.jpg` je
z kópie zmazaný a `build.py:24` (OG_IMG) je v kópii prepísaný. `grep` na `img/film|uvod/og.jpg` v HTML/JS/CSS
kópie → 0. Jediný zvyšok je mŕtva vetva `--stary-uvod` v `build.py:1053`.

**Ostrosť** (zväčšenie = zobrazené px × hustota / px súboru, meria `meraj.mjs`, `ostrost` v `meranie.json`):
- počítač 1440 (hustota 1): A1 0,94 a všetky zábery 0,83, teda bez zväčšenia;
- telefón 390 (hustota 3): A1 a A4 0,98, A2 1,04, **B1 1,24, B2, B3 a B4 1,18**. Fotky B od majiteľa sú široké
  len 856–900 px a rám na telefóne má 354 CSS px (1 062 px). Pri hustote ≤ 2,5 sú všetky ≤ 1. Na obrazovke sú
  0,44–0,60 s. Konečný a úvodný záber (A1) je ostrý vždy.

## 6. Merania (A/B striedavo, rovnaké podmienky)
Skript `nastroje/meraj.mjs`, výsledok `meranie.json`, súhrn `prac/meranie-suhrn.txt`. Chromium 1243 (Playwright
1.63) a lokálny server bez obmedzenia siete. Telefón: 390×844, hustota 3, `Emulation.setCPUThrottlingRate 4`.
Počítač: 1440×900 bez obmedzenia CPU. Po načítaní 8 s bez dotyku. Poradie variantov sa v každom kole strieda
(proto/dnes, dnes/proto). **Súbežne bežali iné úlohy:** záťaž pri meraní bola 3,9 → 1,8 (4 jadrá), v predchádzajúcich
kolách 7–12. Hodnoty sú preto orientačné a porovnávajú sa len v rámci rovnakého kola.

| | Telefón, prototyp | Telefón, dnes (film) | Počítač, prototyp | Počítač, dnes |
|---|---|---|---|---|
| behov | 4 | 4 | 3 | 3 |
| LCP ms (medián) | 284 / 476 / 404 / 384 (**394**) | 752 / 724 / 484 / 2 252 (**738**) | 200 / 184 / 204 (**200**) | 228 / 224 / 212 (**224**) |
| LCP prvok | `a1-m.avif` (fotka dvora) | `film/prvy-t960.avif` | `a1-d.avif` | `film/prvy-p1920.avif` |
| CLS | 0 / 0 / 0 / 0 | 0 / 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0,0001 / 0 |
| **snímky > 50 ms počas strihu** | **0 / 0 / 0 / 0** (najdlhšia 17 ms, 270 snímok) | – (film stojí, kým sa neskroluje) | 0 / 0 / 0 (17 ms) | – |
| snímky > 50 ms za 8 s spolu | 2 / 1 / 1 / 1, všetky pri načítaní 392–650 ms, ešte pred strihom | 1 / 1 / 1 / 4 (najdlhšia 683 ms) | 0 / 0 / 1 | 1 / 0 / 1 |
| **obrázky úvodu** | **552 739 B** | 3 952 510 B | 594 734 B (+ `b4-d` 85 kB, zdieľaný s pásom zásoby) | 7 748 393 B |
| kód (HTML + CSS + JS + písma) | 292 443 B (JS 20 529, CSS 83 738, HTML 39 272) | 349 343 B (JS 67 980, CSS 89 729, HTML 42 730) | 315 405 B | 372 305 B |
| všetky bajty za 8 s | 3 009 445 B | 5 198 500 B | 2 669 814 B | 8 417 046 B |
| z toho lenivé obrázky pod úvodom | 2 138 126 B | 870 511 B | 1 733 538 B | 270 212 B |

Predchádzajúce kolá pri vyššej záťaži (7–12) sú v `prac/meranie-bez-cv.json` a `prac/cv/meranie.json`. Počas strihu
mali na telefóne v 9 behoch 3× 1–4 snímky po 50–117 ms (napríklad `4461:117`). Dnešný web mal v tých istých kolách
naprázdno aj 683 ms. Pri dlhých snímkach počas strihu sa zároveň sťahovali a dekódovali lenivé obrázky pod úvodom
(pozri riziko R3).

**Žiadne tmavé plochy.** Pri 10 snímkach za sekundu videa som zmeral priemerný jas celej obrazovky a podiel pixelov
s jasom pod 60 (`prac/jas-*.txt`). Telefón: najnižší priemer 178,6 / 255, najviac tmavých pixelov 11,3 % (snímka 3,5
s, tiene pod rezivom). Počítač: 179,8 a 13,3 %. Tmavé pixely sú len tiene na fotkách. Záblesk je biely a štítky,
rám aj pozadie sú papier a betón.

## 7. Videá (kontaktné hárky som otvoril)
- `video/inventura-telefon-390.webm` / `.mp4` (390×844, 7,8 s) a hárok `video/harok-telefon.jpg` (4 snímky/s).
- `video/inventura-pocitac-1440.webm` / `.mp4` (1440×900, 7,9 s) a hárok `video/harok-pocitac.jpg`.
- Videá sú nahraté bez obmedzenia CPU, lebo záznam sám zaťažuje procesor. Plynulosť pri CPU 4× je v časti 6.
  Biele záblesky strihu je na hárkoch vidieť ako svetlé snímky (napr. 1,00 s, 2,25 s, 5,00 s). V hárku počítača
  pri 4 snímkach/s záber Rezivo vypadol medzi vzorkami. Všetky stavy dokladajú snímky z časti 3.

## 8. Ďalšie kontroly (`nastroje/funkcie.mjs`, `prac/funkcie.json`)
- Hľadanie počas strihu: štítok „Tehly“ → po ťuknutí a napísaní „cement“ je `inv-ide` false, štítok „Náš dvor“,
  7 výsledkov a zoznam výsledkov je nad tlačidlami (`snimky/inv-390-hladanie.png`, otvorené; opravený z-index).
- „Prehrať znova“: strih znova beží (štítok „Pórobetón“ po 1,4 s) a skončí na „Náš dvor“.
- Jeden H1. V `index.html` nie je `img/film` ani `og.jpg`.
- Obsah pod úvodom sa pri skrolovaní normálne vykreslí (`prac/skrol-og.jpg`, otvorené).

## 9. Riziká a otvorené body
- **R1 Pôvod fotiek.** `u4` a `prijazd-podklad` sú z gitu (`44aa237b^`, pridané v `bb6bbaeb`). Ten commit obnovoval
  stav „plnší sklad na fotkách dvora“ a podľa diagnózy (2a) sa nedá úplne vylúčiť retuš aj iných súborov. Na ich
  zmenšeninách som stopy úpravy nenašiel. `prijazd-podklad` bol podklad pre 2,5D príjazd auta. Jeho prázdnu
  uličku som porovnal s `u3` (`prac/porovnanie-a.jpg`) a je to iný záber z inej polohy, nie `u3` s vymazaným autom.
  Istotu dajú až originály od majiteľa (59 fotiek). Odporúčam ich vyžiadať, vyriešia aj R2.
- **R2 Ostrosť B na telefóne s hustotou 3:** zväčšenie 1,18–1,24 (časť 5). Riešením sú originály, alebo
  na telefóne len A zábery (A1, A4, A2 sú ≤ 1,04), čím sa však stratí vymenovanie sortimentu.
- **R3 Lenivé obrázky pod úvodom** (2,1 MB na telefóne do 8 s). Kým bol film, dráha 250 lvh ich držala ďaleko
  a JS ich skrýval. Bez filmu sú v dosahu lenivého načítania. V emulácii sa navyše dlaždice pásu zásoby sťahujú dvakrát
  (`zasoba-*-720` aj `-900`/`-856` pri tehlách, stadreko a rezive; `prac/lenive.txt` z `nastroje/lenive.mjs`,
server 9642 potom ukončený). Pri zavádzaní do stromu treba skontrolovať `sizes` dlaždíc a
  fotky kategórií (Pexels `img/hd`, `img/*.webp`) a prípadne pridať `fetchpriority="low"` alebo menšie `srcset`. Úvod
  sám sa tým nespomalí, zábery majú prednosť.
- **R4 Poradie spustenia:** strih sa spustí len do 4 s od navigácie. Na pomalej sieti ostane statický úvod
  s tlačidlom „Prehrať úvod“. Je to zámer, žiadny strih neskočí zákazníkovi do čítania.
- **R5 Pás „Sklad a doprava“ a kontakt** stále používajú upravené `pas-dvor-*` a `dvor-predajna-*`
  (doplnené palety, diagnóza 2a). Mimo úvodu som ich nemenil, rozhodne orchestrátor alebo majiteľ. V prototype som
  vymenil len dlaždicu Porfix v páse zásoby za pôvodnú fotku (`b4-d`).
- **R6 Auto na iných miestach:** skutočné auto `img/p/885` v sekcii Služby na úvode (`index.html` „Nákladné auto
  s mechanickou rukou pri nakládke“) som nechal. Podľa diagnózy patrí len so súhlasom majiteľa a je to otázka pre
  orchestrátora.
- **R7 Prenos do stromu:** `build.py` neprepisuje `index.html`. Treba ručne preniesť `index.html` (časť úvodu),
  `site.css` a `site.js` podľa `zmeny.diff`, `build.py:24` (OG_IMG) a pregenerovať 74 podstránok, nakopírovať
  `img/inventura/` (4,7 MB vrátane WebP), zmazať `img/film/` (24,8 MB), `img/uvod/og.jpg`, `zdroj/film.sh`,
  `film.mjs`, `napis.mjs`, výnimku v `nasadenie/balik.sh` a upraviť README a FOTKY.md (diagnóza, časť 1). Testy filmu
  v `dokoncenie/nastroje/` treba nahradiť (napríklad `snimky.mjs` a `funkcie.mjs` z tohto priečinka).
- Otvorené otázky majiteľa (staré akcie, LIAZ/Iveco, 5 % / 3,3 %, Nero Ebono/Ebano, hosting/HTTPS) som nemenil.

## 10. Súbory
- Prototyp: `koncept-inventura/web/index.html` (spúšťa sa cez server, napr. `python3 -I -m http.server 9640
  --bind 127.0.0.1 --directory koncept-inventura` → `/web/index.html`), zábery `web/img/inventura/`.
- Rozdiel voči stromu: `zmeny.diff` (index.html, site.css, site.js, build.py).
- Nástroje: `nastroje/zabery.sh` (výrezy a kódovanie), `uvod_html.py` (prepis úvodu v kópii), `snimky.mjs`,
  `video.mjs`, `meraj.mjs`, `funkcie.mjs`, `pozri.mjs`.
- Výstupy: `snimky/`, `video/`, `meranie.json`, `prac/` (pracovné snímky, merania, jas).
