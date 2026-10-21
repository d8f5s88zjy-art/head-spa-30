# Skeptik: oponentúra špecifikácie „Ľahký telefón“

Dátum: 21. 10. 2026. Predmet: `SPEC-LAHKY-TELEFON.md` a rozbory `rozbor-film.md`, `rozbor-stranka.md`, `rozbor-vaha.md`.
Stromy len na čítanie: **D1** = `hs-pred-d1/barbershop-30`, **BALÍK** = `hs-chatgpt/barbershop-30`. Bez prehliadača
a bez servera. Pomocné výrezy snímok som uložil do `lahky-telefon/skeptik/`.

**Verdikt: ok = nie.** Smer (ľahký režim bez WebGL na telefóne, nepriehľadná lišta, pätička, dekódovanie pred
zobrazením) je správny a väčšina citácií sedí. Našiel som však 8 vážnych nedostatkov:

- dve príčiny sú nepodložené alebo nesprávne (čierny štart, predčítanie suseda),
- brána `lite` potichu vypne film aj na úzkom okne počítača,
- dva pokyny idú proti vlastnému cieľu (WebP preload, L4a „obraz rovnaký“),
- jedno kľúčové meranie samo ovplyvňuje výsledok,
- poradie dávok dovoľuje zverejniť zhoršenie,
- pri najväčšej zmene vzhľadu chýba súhlas majiteľa.

---

## 1. Overené tvrdenia (priamo v kóde)

| # | Tvrdenie špecifikácie | Overenie | Výsledok |
|---|---|---|---|
| 1 | Brána `world` nekontroluje šírku ani dotyk (index.html:12) | D1 aj BALÍK index.html:12: WebGL2, reduce-motion, saveData, `max-height: 500px`, `deviceMemory\|\|8`, `hardwareConcurrency\|\|8` | platí pre oba |
| 2 | Lišta ≤ 900 px má `rgba(14,13,12,0.9)` bez blur (style.css:318), `::before` zhasne (:301), telo má rezervu 80 px (:345) | D1 aj BALÍK style.css:301, 318, 345 | platí pre oba |
| 2b | Cez lištu presvitá logo pätičky | PIL na `majitel-iphone-paticka.png`, x 200–420: v riadkoch 338–356 (nad hranou lišty na riadku 357) má logo jas 24,7–26,7 pri pozadí 12,7–13,0; pod hranou 158–190. Presvitanie je teda asi 8–10 %. | potvrdené snímkou |
| 3 | D1 app.js nemá `decode` | `grep -c decode`: D1 0, BALÍK 13 | platí |
| 4 | D1 okolie záloh −1…+2 (app.js:222) | D1 app.js:222 platí **až po `document.readyState === 'complete'`**, dovtedy len `i === 0`. BALÍK app.js:297 má dovtedy len `i === cur`. | čiastočne, pozri V2 |
| 5 | Video tímu: v D1 na telefóne vždy skryté, v BALÍKu len pri `world-in` | D1 style.css:1305; BALÍK style.css:1303 `html.world-in:not(.world-off):not(.film-strata) .team-video` | platí |
| 6 | Rozostrenie textu `filter: blur()` | D1 style.css:1065–1067 (`zaostrenie` 10 px), :1277 (6 px), :1284 (5 px) | platí |
| 7 | `will-change` na všetkých zálohách v D1, v BALÍKu len pri blízkych | D1 style.css:460; BALÍK style.css:461 `.is-near .film-still img` | platí |
| 8 | Prah telefónu vo film.js | D1 film.js:136 = BALÍK film.js:138 = podmienka `lite` zo SPEC:52–53 | platí |
| 9 | film.js je statická značka | D1 index.html:902, BALÍK index.html:884 (`fetchpriority="low"`) | platí |
| 10 | Veľkosti súborov (SPEC §5) | `python3 -I os.path.getsize`: rohozka-m-1086.avif 124 712, rohozka-m-1448.avif 438 359, cakaren-m-1086/1448 181 536 / 329 960, three.module.min.js 687 458, tim-slucka-864.mp4 3 402 635, tim-v-akcii-576.mp4 1 212 912, 95 snímok seq 3 643 267, film.js 103 839 / 111 325, app.js 43 418 / 51 202. Oba stromy rovnaké. | platí |
| 11 | Písma nebrzdia prvý obraz | D1 index.html:43–48 / BALÍK :40–45: všetky `font-display: swap`, 3 predčítané | platí (písmo nie je príčina) |
| 12 | Odraz na konci (rubber band) vysvetľuje 115 namiesto 80 px (SPEC:111, rozbor-stranka §1.1) | D1 style.css:588 `html { overscroll-behavior-y: none; }` odraz pri koreni vypína (WebKit od iOS 16) | **pochybné**, treba zmerať |
| 13 | „Prológ (`pro`) skrýva aj text úvodu“ (POZIADAVKY:9, SPEC:138–140) | V D1 style.css:575–633 nie je žiadne pravidlo `html.pro`, ktoré by skrývalo `.title-hero` alebo `.title-frame`. Úvod má `[data-pro]`, preto `--o` ostáva 1 (style.css:1018). | **nepodložené**, pozri V1 |
| 14 | Cover ukáže fotku tak, že „buldog ani vrch pumpy nie sú orezané“ (SPEC:171) | `porovnanie/cakaren-ramovanie.png`, ľavý panel (cover): vrch pumpy je celý, buldog je **stále orezaný ľavým okrajom** | čiastočne nepravdivé |
| 15 | „Ďalšiu fotku sťahovať o kartu skôr, okolie +1 už to robí“ (SPEC:220) | Pozri riadok 4: kým nie je `load`, sused sa nesťahuje (D1 app.js:222, style.css:1115 `display: none`) | **nepravdivé počas načítania** |

---

## 2. Vážne nedostatky

### V1. Čierny štart: príčina nie je dokázaná a meranie ho nezopakuje (D1, L2)
- Na snímke `majitel-iphone-cierny-start.png` je spodné tlačidlo **viditeľné**.
  - V HTML začína ako `is-hidden` (D1 index.html:875).
  - V úvode ho app.js skrýva (`ctaHidden`: `hero = … y < shots[0].height * 0.6`, D1 app.js:246–249).
  - Viditeľné tlačidlo teda znamená, že stránka **nebola na vrchu úvodu**. Mohla to byť obnovená poloha po
    znovunačítaní, skok na kotvu alebo návrat späť.
- Plocha snímky je v riadkoch 400–2499 úplne rovná: jas 12–13 = ink, žiadny prechod ani vinetácia. To sedí na
  vymazané plátno filmu (D1 film.js:1106, 1112) **alebo** na kartu, ktorej záloha má `display: none`.
- Druhá cesta ostáva aj v ľahkom režime. Pred `load` je v D1 `is-near` len karta 0 (app.js:222). Ostatné zálohy
  majú `display: none` (style.css:1115). Pri obnovenej polohe v strede stránky preto ostane len `--ink`, lišta
  a tlačidlo. **L2 to na D1 neopraví.** BALÍK má aspoň `i === cur` (app.js:297).
- Meranie v SPEC:367 otvára `?uvod=off`. To vypne prológ, takže nezopakuje ani hypotézu `pro`, ani obnovenú polohu.
- **Náprava:**
  - Aktuálna karta má byť `is-near` vždy, bez ohľadu na `readyState`.
  - Do kritéria L2 pridať tieto scenáre, každý s filmovým pásom 3 s a nástrojom `tma.py`:
    - prvá návšteva bez parametrov,
    - znovunačítanie pri `scrollY` = 3 000 px,
    - otvorenie `/#tim` a `/#kontakt`,
    - návrat späť (bfcache, `pageshow`),
    - `localStorage b30.lang = 'en'` (style.css:105 skrýva `.title-hero` na 2,5 s pri `t-wait`).

### V2. Sused sa pred `load` nesťahuje, takže L3 nemôže splniť vlastné kritérium (oba stromy)
- D1 app.js:222 a BALÍK app.js:297 dovolia okolie ±1 až po `document.readyState === 'complete'`.
- Na pomalej sieti (kritérium L3 má Slow 4G) príde prvý švih skôr než `load`. Vtedy nastane jedno z dvoch:
  - v D1 sa ukáže neúplná fotka,
  - po L3 ostane stará fotka pod novým textom karty, čo je riziko, ktoré SPEC:219–220 „zmierňuje“ chybným tvrdením.
- **Náprava (L3):** okolie ±1 povoliť hneď po dekódovaní prvého obrazu (nie po `load`) s `fetchpriority="low"`.
  Kritérium „skok z menu“ doplniť o skok **pred** `load`.

### V3. Brána `lite` podľa samotnej šírky vypne film aj na počítači (L2, časť 1)
- SPEC:52 dáva `lite` každému oknu `max-width: 720px`, aj bez dotyku. Úzke okno prehliadača alebo bočný panel
  náhľadu v aplikácii Claude na počítači tak stratí film.
- To odporuje SPEC:24–25 („Počítač … ostáva bez zmeny“). Majiteľ si náhľad pozerá aj na počítači: text
  „Náhľad sa v telefóne aj na počítači načíta“ je v pozadí jeho snímok.
- Kritérium počítača testuje len 1440 × 900 (SPEC:164).
- **Náprava:** `lite` = `(hover: none) and (pointer: coarse)` a kratšia strana ≤ 720 px. Úzke okno s myšou nechať
  na film, alebo to dať majiteľovi na rozhodnutie. Pridať test 600 × 900 s myšou: `world` musí ostať.

### V4. Poradie dávok dovoľuje zverejniť zhoršenie: L2 bez L3 na D1 (časť 2, poradie)
- S filmom sú zálohy skryté (D1 style.css:506–510, 1116–1119) a WebGL drží posledný obraz.
- Po L2 ide **každá** karta cez prelínanie D1 bez dekódovania (app.js:213–219, 0× `decode`) nad `--ink-2`
  (style.css:449).
- Ak sa L2 zverejní samostatne, „neúplné fotky“ budú častejšie, nie zriedkavejšie. Vlastné kritérium L2
  „0 snímok s čiernou > 10 %“ (SPEC:162) pri Slow 4G bez L3 zlyhá.
- **Náprava:** L2 + L3 + L4a + L5.1 (bez rozmazania) zverejniť ako jednu dávku „telefón v1“.

### V5. Sonda L3 sama dekóduje, a tým skrýva chybu (L3, kritérium)
- SPEC:210–212: „sonda sama volá `decode()` po `load`“. To vynúti dekódovanie a zahreje vyrovnávaciu pamäť, takže
  meranie „pred“ ukáže menej porušení, než má skutočná stránka.
- Chromium navyše dekóduje pri rastri mimo hlavného vlákna. „Viditeľné pred dekódovaním“ sa z JS v Chromiu
  nedá zistiť.
- **Náprava:**
  - Sonda len pasívne zapisuje čas `load` a prvej snímky s `opacity > 0.01`. Ako príznak hotového dekódovania
    číta príznak samotnej aplikácie (`stillReady`), nikdy nevolá `decode()`.
  - Rozhodujúci verdikt dáva screencast (`over-dekod.mjs` + `over-dekod.py`).
  - Konečné potvrdenie: Safari Web Inspector na iPhone (Timelines → Rendering, Images).

### V6. „Pridať WebP vetvu“ do predčítania stiahne prvú fotku dvakrát (L2 bod 3)
- `<link rel="preload" as="image" type="image/webp">` stiahne každý prehliadač, ktorý WebP podporuje, teda aj
  Safari na iPhone, ktorý zároveň vyberie AVIF.
- Navyše sa stiahne `rohozka-m-1086.webp` 242 204 B alebo `-1448.webp` 570 350 B (`ls -l`), čo ide proti cieľu
  ≤ 0,75 MB (SPEC:157).
- **Náprava:** WebP do predčítania nepridávať. Prehliadačom bez AVIF stačí `<source type="image/webp">` v `<picture>`.

### V7. L4a nie je „obraz rovnaký“ na iPhone majiteľa (L4)
- SPEC:227 píše „obraz rovnaký“ a súhlas majiteľa chce len pre L4b. Majiteľov telefón má 430 × 932 pri DPR 3
  (rozbor-stranka, PIL 1290 × 2796).
- Cover tam potrebuje 524 CSS px, teda 1 573 px displeja (`python3 -I`):
  - `1448` dá 2,76 px na CSS px,
  - `1086` dá 2,07 px na CSS px, teda o 25 % menej lineárneho rozlíšenia.
- Pri sťažnosti „nie je to pekné“ to nie je neutrálna zmena.
- **Náprava, jedna z dvoch:**
  - L4a dať pod rovnakú bránu ako L4b (`ostrost.py` + pohľad majiteľa),
  - alebo vyberať podľa šírky: `<source media="(max-width: 400px)">` s jediným kandidátom 1086 a
    `(max-width: 720px)` s jediným kandidátom 1448.

### V8. Najväčšia zmena vzhľadu (telefón bez filmu) nemá súhlas majiteľa (časť 0, L2)
- Skoršia požiadavka majiteľa znie „rovnaký vzhľad ako na počítači“. Na počítači film ostáva (L7), na telefóne
  odchádza 3D hĺbka, strihy, prológ s chôdzou k dverám aj sekvencie. ART_DIRECTION:141 uvádza hĺbku 2.5D ako
  súčasť pohybového jazyka.
- Špecifikácia to píše otvorene, ale ako hotové rozhodnutie. Súhlas majiteľa chce len pre L4b, L6 a hudbu.
- Odkaz „pozri `otvorene`“ (SPEC:147) vedie na časť, ktorá v súbore neexistuje (`grep -n otvoren` nájde len tento
  riadok).
- **Náprava:**
  - Pridať časť „Otvorené rozhodnutia majiteľa“ (film na telefóne, L4a/L4b, L6, hudba).
  - Pred zverejnením ukázať majiteľovi na iPhone dva súkromné náhľady vedľa seba: `lite` a `?film=on`.

---

## 3. Odpovede na päť otázok

**(1) Zachováva vzhľad?** Výrezy, texty, farby a poradie áno. Potichu sa však mení:
- film na úzkom okne počítača (V3),
- ostrosť na 430 px (V7),
- choreografia úvodu: `zaostrenie` bez rozmazania (v súlade s ART_DIRECTION:72–73, ale je to viditeľná zmena
  podpisového nástupu, treba ju ukázať).

Odchod filmu z telefónu je napísaný otvorene, no bez súhlasu (V8). Tvrdenie o nerezanom buldogovi je
prehnané (tabuľka, riadok 14). Ak majiteľ „neúplnými“ myslel aj výrez, cover to vyrieši len čiastočne.

**(2) Sú príčiny podložené?**
- Lišta, pätička, brána filmu, chýbajúce `decode`, rozmazanie, `will-change` a veľkosti súborov: áno, súbor:riadok
  sedí a lištu potvrdzujú aj pixely snímky.
- Nepodložené: čierny štart cez `pro` (V1), rubber band (D1 style.css:588), „okolie +1 už to robí“ (V2).
- Cena dekódovania AVIF v Safari a výber 1448/1086 vo WebKite sú správne označené „treba zmerať“.

**(3) Čo chýba z typických príčin na iPhone**
- Dekódovanie veľkých obrázkov: pokryté (L3, L4).
- Limit plátien a WebGL: pokryté odchodom filmu.
- Blend módy: nie sú (`grep mix-blend` = 0 v oboch).
- `backdrop-filter` na telefóne: D1 len ≥ 901 px (style.css:269, 318, 550, 842, 957).
- Písma: v poriadku (`swap`).
- Nepokryté:
  - **`--sp` zapisované v každej snímke** na `img` všetkých záberov (D1 app.js:190–194). V `lite` je to jediný
    pohyb fotiek a L5 ho nerieši.
  - **Hudba:** 50,5 s (mvhd v `hudba.m4a`) sa rozbalí do asi 19,4 MB PCM (atmosfera.js:86–92, 140) a zvukový
    kontext potom stále beží.
  - **Nekonečné animácie** v pevných vrstvách: `obeh` (style.css:1225), lesk (:1199).
  - **`text-rendering: optimizeLegibility`** na celom `html` (style.css:70).
  - **Úsporný režim** pre L6: `play()` sa odmietne a musí ostať plagát.
  - **`content-visibility`** sa nepoužíva (`grep` = 0). Bolo by voliteľné pre pásy pod okrajom.

**(4) Merateľnosť**
- L1 je merateľné, okrem kritéria „pás 0–64 px bez druhého loga“, ktoré závisí od polohy skrolu.
- L2 nezopakuje čierny štart (V1).
- Sonda L3 ovplyvňuje výsledok (V5).
- L5 p95 ≤ 16,7 ms pri CPU 4× znamená pri základe 27,5–33,1 ms (PLAN.md:619) zníženie o 40–50 %. Nie je isté, že sa
  dá dosiahnuť, a v kontajneri so softvérovým kreslením je to len porovnanie.
- Bajty sa v Chromiu pri 390 px môžu podhodnotiť: Chromium vyberie 1086, Safari 1448 (rozbor-vaha §2).

**(5) Poradie**
- L1 ako prvé je v poriadku: lacné, viditeľné, bez rizika.
- L2 sa však nesmie zverejniť bez L3 (V4). L4a a L5.1 patria do tej istej dávky, lebo priamo znižujú cenu
  dekódovania a vrstiev počas prvého skrolu.
- Navrhujem: L1 → „telefón v1“ (L2 + L3 + V1/V2 opravy + L4a podľa šírky + L5.1) → L5.2–L5.5 po meraní → L4b,
  L6 a hudba po rozhodnutí majiteľa.

---

## 4. Drobnosti na doplnenie

1. **Rubber band** odporuje `overscroll-behavior-y: none` (D1 style.css:588). Rozdiel 35 px skôr spôsobuje
   `viewport-fit=cover` (index.html:5) a spodný bezpečný okraj. Riešenie `box-shadow` pokryje oba prípady, len
   opraviť zdôvodnenie a zmerať `env(safe-area-inset-bottom)` v aplikácii Claude.
2. Kritérium lišty preformulovať: pri polohách skrolu, keď je logo pätičky 0–40 px pod hranou lišty, má pás
   lišty max. jas ≤ jas inku + 2 (dnes 25–27 proti 13, PIL).
3. Časť 0 („prelínanie opacity 400 ms, `scale(1.03 → 1)`, vždy po dekódovaní“) nesedí s L2 („nič nové
   nekreslíme“) ani s L3 (prelínanie riadi skrol, `transition` len pri dobehnutí). Zvoliť jeden model a opísať ho
   na jednom mieste.
4. `--sp` (D1 app.js:192–194) zapisovať len na `.is-near` zábery, alebo na telefóne použiť CSS
   `animation-timeline: view()` so záložnou statickou fotkou. Pridať do L5.
5. Testy, ktoré čakajú na `BS30_FILM.ready` (film.js:47), v `lite` zamrznú, lebo film.js sa nenačíta. Pre
   `app-smoke.mjs`, `uvod-shot.mjs` a `karty-shot.mjs` pridať vetvu pre `lite`.
6. Hudbu (asi 19,4 MB PCM, beží stále) dať do „Otvorených rozhodnutí“ s meraním pamäte po prvom ťuknutí (trace
   2 s od `touchend`).
7. atmosfera.js sa načíta pri prvom dotyku (app.js:410–416), teda práve pri prvom švihu. Zmerať, prípadne
   presunúť na nečinnosť.
8. Na telefóne zmeniť `text-rendering` na `auto` (style.css:70) a zmerať čas rozloženia pri dlhých pásoch (cenník).
9. Nekonečné `obeh` (style.css:1225) a `lesk` (:1199) v pevných a maskovaných vrstvách: L5.5 rieši len lesk.
   Doplniť `obeh` mimo okna a v pokoji.
10. Pre L3 a L4 pridať kritérium celkovej rozbalenej pamäte obrázkov na telefóne (zálohy + tím + galéria), napr.
    ≤ 40 MB. BALÍK má galériu asi 60 MB (rozbor-stranka §5).
11. L5: popri absolútnom cieli pridať relatívny (p95 aspoň o 35 % nižšie ako D1 `?film=off` tou istou metódou).
    LoAF = 0 merať len v okne skrolu, nie počas načítania.
12. L2 bajty: v Chromiu zapisovať `currentSrc` pri 390 aj 430 px. Pri 430 je 0,93 × 430 × 3 = 1 200 px, takže
    obe jadrá vezmú 1448 a porovnanie so Safari je férové.
13. L6: kritérium „pri úspornom režime (odmietnuté `play()`) ostane plagát bez skoku“. Plagát musí byť
    presne prvá snímka.
14. Úvod `zaostrenie` bez rozmazania: ukázať majiteľovi ako súčasť V8 (podpisový nástup sa zmení).

---

## 5. Presné merania, ktoré treba doplniť

Chromium (Playwright 1.56.1), emulácia **390 × 844 aj 430 × 932, DPR 3**, dotyk, CPU **4× a 6×**, Fast 4G a Slow 4G.
Trace s kategóriami `devtools.timeline`, `disabled-by-default-devtools.timeline.frame`, `blink.image_decode`, `cc`,
`gpu`, Long Animation Frames. Spúšťať až po skončení merania druhého tímu.

- **M-V1 (čierny štart):** D1, BALÍK, D1+L. Tieto scenáre, každý s filmovým pásom 3 s a `tma.py` (podiel
  snímok s > 90 % plochy pod jasom 20):
  - prvá návšteva bez parametrov a s prázdnym `sessionStorage`,
  - znovunačítanie pri `scrollY` = 3 000,
  - `/#tim`, `/#kontakt`,
  - späť/dopredu,
  - `b30.lang = 'en'`.

  Zapísať aj triedy `<html>`, `is-near` a `display` záloh v čase 0–3 s.
- **M-V2:** Slow 4G, prvý švih 1 500 px/s 500 ms po FCP (pred `load`). Počet snímok, keď má aktuálna karta zálohu
  `display: none` alebo jas pásu fotky < 90 % konečného.
- **M-V3:** 600 × 900, DPR 1, myš, bez dotyku. `world` musí byť prítomné a film beží.
- **M-V5:** pasívna sonda (bez `decode()`) a screencast. Porovnať D1 a D1+L. Na iPhone Safari Web Inspector
  Timelines (Rendering, Images, Memory) pri prejdení stránky 3× tam a späť.
- **M-V6:** sieťový záznam prvej obrazovky. Počet požiadaviek `rohozka-m-*` musí byť 1.
- **M-V7:** `ostrost.py` 1086 vs 1448 na snímkach 430 × 932 DPR 3 pri zábere Čakáreň a Úvod, potom pohľad
  majiteľa na iPhone.
- **M-hudba:** trace 2 s od prvého ťuknutia (`touchend`): hlavné vlákno, pamäť (`performance.memory` v Chromiu;
  Timelines Memory na iPhone).
