# Diagnóza: čierne obrazovky a horšia plynulosť na skutočnom iPhone (lite, f624ee8)

Rola: inžinier výkonu Safari/iOS (WebKit, WKWebView). Len čítanie stromu `hs-lahky/barbershop-30` (HEAD f624ee8)
a dokumentov v `barber/lahky-telefon/`. Bez prehliadača, bez servera. Zápis len sem.

Skratky ciest: `$SP` = `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad`;
`index.html`, `assets/app.js`, `assets/style.css` sú v `$SP/hs-lahky/barbershop-30/`; `foto-proto.css/js` v
`$SP/barber/lahky-telefon/fotky-ako-pc/proto/barbershop-30/assets/`. Čísla riadkov sú z týchto súborov k 21. 10. 2026.

Označenie istoty: **[kód]** = dokázané v kóde (súbor:riadok); **[rozbor]** = prevzaté z meraní tímu v Chromiu;
**[WebKit]** = známe správanie WebKitu, na zariadení neoverené; **[predpoklad]** = hypotéza, ktorú musí potvrdiť
prekrytie na iPhone. Nič z toho nie je zmerané na telefóne – z telefónu nemáme žiadne číslo.

---

## 0. Čo presne majiteľ hodnotil a prečo to Chromium nevidí

| | majiteľ (21. 10. ~15:45 UTC) | naše meranie (meranie-1.md, oprava-1.md, kontrola-vzhlad-2.md) |
|---|---|---|
| zariadenie | skutočný iPhone 430 × 932 CSS px, DPR 3 (`rozbor-stranka`, PIL 1290 × 2796) | Chromium 1194 headless, Linux, SwiftShader (softvérové kreslenie), emulácia 390/430 × DPR 3 |
| prehliadač | Safari/WKWebView **v aplikácii Claude** (náhľad = artefakt claude.ai) | Chromium, bez limitu pamäte procesu, bez zahadzovania dekódovaných obrázkov |
| dekódovanie fotiek | ImageIO/WebKit: AVIF softvérovo **[WebKit, predpoklad pre AV1]**, asynchrónne, kým nie je hotové, maľuje sa **nič** | Chromium dekóduje na pracovných vláknach rastra a tiež nemaľuje nedekódovanú fotku, ale nikdy ju nezahodí |
| súbory | „len AVIF súbory“ v náhľade (zadanie) | všetky súbory z lokálneho stromu (WebP, JPG, MP4, plagáty) |
| hosting | claude.ai (iná latencia, neznáma kompresia, obal dokumentu, možno rámec) | `python3 -m http.server` na 127.0.0.1 s emuláciou Fast/Slow 4G |
| výsledok | čierne obrazovky, horšia plynulosť, rozmazané a sekajúce videá | tma 0 %, p95 úlohy snímky −73 %, 0 neúplných fotiek |

Kľúčový rozdiel: Chromium v kontajneri dokáže ukázať len **prácu hlavného vlákna a sieť**. Nevidí tri veci, ktoré
na iPhone rozhodujú: (1) **pamäťový strop procesu** a zahadzovanie dekódovaných bitmáp, (2) **asynchrónne maľovanie**
WebKitu (nedekódovaná fotka = priehľadná plocha, pod ňou `--ink-2`), (3) **náhľad v aplikácii** (chýbajúce súbory,
obal, rámec). Preto zoznam nižšie začína práve tam.

---

## 1. Zoradený zoznam príčin

Poradie podľa toho, ako dobre vysvetľujú **obe** sťažnosti naraz (čierne obrazovky + horšia plynulosť) a ako
pravdepodobné sú na iPhone v aplikácii. Pri každej: dôkaz, prečo to Chromium nevidí, ako to potvrdí prekrytie
(časť 2), oprava.

### P1. Nedekódovaná fotka sa vo WebKite maľuje ako nič → vidno `--ink-2` pod ňou; brána `__dec` to po zahodení bitmapy nechráni

**Dôkaz [kód]:**
- Každá záloha záberu má `decoding="async"` (index.html:179, 188, 231, 256, 280, 305, 499, 661 …) a leží v pevnej
  vrstve `.film-still` cez celé okno s podkladom `background: var(--ink-2)` (style.css:463; `--ink-2: #171412`,
  style.css:18) a `position: fixed; height: 100lvh` (style.css:1137).
- Prelínanie (`--so`) sa pustí, až keď `img.decode()` prešlo (app.js:262, 287). Príznak `img.__dec` sa však nastaví
  raz (app.js:260) a zruší sa **len** pri odchode z okolia (app.js:329). Kým je záber v okolí (`is-near`, až 3 naraz,
  app.js:323), aplikácia predpokladá, že bitmapa stále existuje. Komentár na app.js:249–250 to priznáva len pre
  `display: none`.
- Náhľad z HTML (`--nahlad`, 468 B WebP) má **iba úvod**: `html.lite .film-shot.is-title[data-pro] .film-still`
  (style.css:1148) a `<template id="still-uvod">` (index.html:174). Ostatných 8 záberov nemá pod fotkou nič iné než
  `--ink-2`.

**Správanie WebKitu [WebKit]:** veľké obrázky maľuje asynchrónne: pri prvom maľovaní, alebo keď dekódovaná bitmapa
chýba, vykreslí prázdnu plochu a doplní ju až po dekódovaní na dekódovacom vlákne. Dekódované bitmapy drží v cache s
rozpočtom a pri tlaku pamäte (`MemoryPressureHandler`) ich zahadzuje; v WKWebView tretej strany je strop procesu
WebContent nižší než v Safari **[predpoklad, Apple čísla nezverejňuje]**. Po zahodení príde pri ďalšom maľovaní
(zmena `--so`, `--sp`, skrol) znova prázdna plocha na desiatky až stovky ms – pri 3,73 MP AVIF dlhšie (P2).

**Prečo to Chromium nevidí:** nemá limit pamäte procesu v kontajneri, bitmapy nezahadzuje; sonda (`sonda.js`) kontroluje
`complete && naturalWidth`, nie prítomnosť bitmapy (tú z JS nevidno ani v Safari).

**Potvrdí prekrytie:** (a) počet volaní `decode()` na ten istý `currentSrc` > 1 počas jedného pobytu v okolí
(obalenie `HTMLImageElement.prototype.decode`, časť 2), (b) medzery rAF > 50 ms, ktoré sa kryjú s udalosťou
„`is-shown` pridané“ pri zábere s `__dec = true`, (c) tlačidlo „Overiť zahodenie“: `drawImage` dekódovanej fotky do
plátna 1 × 1 trvá > 20 ms = bitmapa sa dekódovala znova, (d) počítadlo samovoľných znovunačítaní (`sessionStorage`
+ `navigation.type`), lebo pri prekročení stropu WebKit proces ukončí a stránka sa načíta odznova (čierny štart
nanovo).

**Oprava:**
1. Pod **každou** zálohou náhľad z HTML (LQIP 24 × 43 px, ≈ 450–650 B, 9 × ≈ 5 kB), nie len pod úvodom: zovšeobecniť
   style.css:1148–1150 (`[data-pro]` preč) a do každého `<picture class="film-still" style="…">` doplniť `--nahlad`
   (šablóna v `source/tools/stills.py:41–45`). Výsledok: pri zahodení bitmapy vidno rozmazanú tú istú fotku,
   nikdy ink. Riziko nízke, vzhľad bez zmeny v pokoji (ostrá fotka sa prelína navrch).
2. Menšia bitmapa (P2) – menej pamäte, menej zahadzovania.
3. Pri `is-shown` záberoch (najviac 2) nechať `__dec` overovať periodicky lacno: nie `decode()` (je to drahé), ale
   LQIP pod nimi rieši následok; preto 1 má prednosť.

### P2. 3,73 MP AVIF na každý záber: pomalé dekódovanie, 14,9 MB RGBA na fotku, až 45 MB v okolí

**Dôkaz [kód]:** telefónny `<source>` má kandidátov `-m-1086` a `-m-1448` so `sizes="(max-width: 720px) 93vw"`
(index.html:175); 0,93 × 430 × 3 = 1 200 px > 1 086, takže Safari aj Chromium vezmú **1448 × 2575** (`fotky-ako-pc/FAKTY.md` §3,
`currentSrc` v `meranie.json`). Súbory: rohozka-m-1448.avif **438 359 B**, cakaren-m-1448 329 960 B, sud-m-1448
447 481 B (`ls -l assets/img/film`). Hlavičky AVIF (`av1C`, vlastný výpis): profil 0, 8 bit, 4:2:0, level 12 pri 1448
(`81 0c 0c 00`) – teda formát sám je v poriadku, problém je plocha.

**[WebKit, predpoklad]** AV1 obrázok dekóduje ImageIO softvérovo (hardvérový AV1 je len na A17 Pro/M3+ a pre video). Odhad
50–150 ms na 3,73 MP na jedno jadro; WebP (VP8) 2–4× lacnejší, JPEG (hardvérová/optimalizovaná cesta ImageIO) najlacnejší.
Tieto pomery **treba zmerať** (prekrytie meria `decode()` každej fotky).

**Prečo to Chromium nevidí:** dekóduje na pracovných vláknach (hlavné vlákno čisté, p95 úlohy snímky klesol), AV1 dekodér
dav1d je rýchly, pamäť bez stropu.

**Potvrdí prekrytie:** čas `decode()` podľa súboru (medián, max), `currentSrc` (potvrdiť `-m-1448.avif`), súčet
„teoreticky rozbalených“ bajtov `naturalWidth × naturalHeight × 4` pre `img` bez `display: none`.

**Oprava (bez merania, nízke riziko, pozri aj časť 3):**
- WebP pred AVIF v telefónnom `<source>` (existujúce súbory, 0 nových). Cena: bajty +30 % (rohozka 570 kB vs 438 kB).
- **Rozhodnutie majiteľa:** menšia plocha. Dve cesty, obe z existujúcich alebo ľahko vyrobiteľných súborov:
  - variant B z `fotky-ako-pc/POROTA.md` (celá fotka na šírku `-1448` = 1448 × 965, **1,40 MP**, 5,6 MB RGBA, bajty
    −64 %, ostrosť 3,37 px/CSS px na 430, teda **ostrejšie** než dnešný výrez 2,76) – zároveň splní „celé fotky vidno“;
  - alebo nový telefónny stupeň `-m-1200` (1200 × 2134, 2,56 MP; 2,29 px/CSS px na 430, −17 % lineárne proti 1448,
    `source/tools/film.py:43–63`). To je viditeľná zmena ostrosti, preto rozhodnutie majiteľa (SKEPTIK V7).

### P3. Náhľad v aplikácii Claude: chýbajúce súbory (len AVIF) dávajú čierne okná priamo

**Dôkaz [kód] + zadanie („len AVIF súbory“):**
- Video Tím v akcii: `<video … data-poster="assets/video/tim-v-akcii-poster-576.webp">` so zdrojmi `.webm`/`.mp4`
  (index.html:325–327) a `background: var(--ink-3)` (style.css:393). Ak plagát `.webp` a videá v náhľade nie sú, iOS
  ukáže **tmavý obdĺžnik 576 × 1024 s preškrtnutým prehrávaním** – doslova „čierne pole“ v páse Tím.
- Slučka Tím: `v.__poster = … + '.webp'` (app.js:921), `v.__src = … + ext` (app.js:920). Bez plagátu sa `is-ready`
  nepridá (app.js:880), video ostane `opacity: 0` (style.css:1164) – nič čierne, ale `play()` stiahne 3,4 MB zbytočne
  (ak MP4 existuje) alebo `error` → `__fail` (app.js:885).
- Galéria: lightbox otvára `data-lightbox-src="…1600.jpg"` (index.html:684, 8 tlačidiel) → bez JPG čierny lightbox.
- Zálohy `<img src="…-1448.webp">` (index.html:179 …) sa nepoužijú, kým AVIF `<source>` sedí (iOS 16+), takže fotky
  samotné sú v poriadku; plagáty videí a lightbox nie.
- `.band picture.cakaj { opacity: 0 }` (style.css:808) sa zruší aj pri `error` (app.js:647) – pri 404 sa ukáže
  prázdny `<img>` s alt textom na `--ink-2` (team-portrait má PNG fallback v `src`, index.html:338).

**Prečo to Chromium nevidí:** meralo sa z lokálneho stromu so všetkými súbormi.

**Potvrdí prekrytie:** zoznam zdrojov s chybou (`error` na `img`/`video` v capture fáze + `PerformanceResourceTiming`
`responseStatus`, kde je k dispozícii), stav každého `<video>` (`error.code`, `networkState`, `poster` + jeho stav).

**Oprava:** do náhľadu dať aj `.webp` plagáty, `.mp4`, JPG lightboxu – alebo (lepšie, P9) na telefóne videá vôbec
nepoužívať a lightbox prepnúť na AVIF (`data-lightbox-src` má len JPG; je tu `naradie-noznice-1600.avif`,
index.html:686). Chýbajúci súbor nikdy nesmie dať čierne pole: pre `<video>` dať plagát ako `background-image` z AVIF
na `.video-window` (style.css:387).

### P4. Náhľad môže bežať v rámci (iframe) alebo s obalom, ktorý mení výšku okna a pevné vrstvy

**Dôkaz [kód]:** app.js:861–866 už počíta s tým, že v náhľade chýba `rootBounds` („rootBounds chýba v cudzom rámci
(náhľad)“) – teda náhľad je **cudzí rámec**. Brána `lite` meria `screen.width/height` (index.html:16), nie okno, takže
`lite` platí aj v rámci; ale `100svh`, `100lvh`, `innerHeight`, `vh` (style.css:452, 459, 1028, 1137; app.js:60, 77)
sú z rámca. Ak aplikácia rámec rozťahuje na výšku obsahu **[predpoklad]**, každá pevná záloha má výšku celého dokumentu
(≈ 16 000 px × 1 290 px × 4 B ≈ 80 MB na vrstvu) → okamžité zahodenie bitmáp alebo pád procesu = čierna.
Rovnako pozíciu `fixed` v rámci posúva rodič, nie Safari, takže skrol pôsobí „gumovo“.

**Prečo to Chromium nevidí:** meralo sa ako hlavný dokument.

**Potvrdí prekrytie:** `top === self`, `innerWidth × innerHeight` vs `screen.width × screen.height`,
`visualViewport.width × height`, `document.compatMode` (obal bez `<!doctype>` = `BackCompat`), či `html` má triedy
navyše od obalu, `location.origin`.

**Oprava:** ak je náhľad rámec, meranie majiteľa je nepoužiteľné pre GitHub Pages; náhľad dať ako samostatnú stránku
(otvoriť v Safari, nie v aplikácii) alebo rámcu nastaviť pevnú výšku okna. Nie je to chyba stránky.

### P5. Tri pevné vrstvy cez celé okno s `will-change: transform` + `transform` z JS v každej snímke

**Dôkaz [kód]:**
- `html.karty .film-shot.is-title .film-still { position: fixed; height: 100lvh }` (style.css:1137) – vlastná vrstva
  veľkosti okna (1 290 × 2 796 × 4 B = **14,4 MB** na vrstvu pri DPR 3).
- `html[data-motion="on"] .film-shot.is-near .film-still img { will-change: transform }` (style.css:475) – druhá
  vrstva tej istej veľkosti pre každý z najviac 3 záberov v okolí (app.js:323) → až **6 vrstiev ≈ 86 MB** zadných
  pamätí + 3 dekódované fotky 45 MB (P2). K tomu `::after` s tromi gradientmi na každej (style.css:482–488, 1125–1130).
- `transform: scale(calc(1 + 0.06 * var(--sp)))` (style.css:471) a `setVar('--sp', s.t, img)` v každej snímke slučky
  pre zálohy v okolí (app.js:338). Na iOS sa transform zmenený z JS prenáša cez hlavné vlákno WebContent a commit do
  UI procesu; samotný skrol je asynchrónny. Keď je hlavné vlákno zaneprázdnené (dekódovanie callbacky, IO, štýl),
  fotka sa **oneskorí za textom** – vnímané ako sekanie, hoci rAF meria 60.
- 9 pripnutých `.title-pin { position: sticky }` (style.css:1021–1025) s `.title-frame` 100svh (1026–1033): na iOS
  je sticky prvok kompozitná vrstva **[WebKit]**; rozsah zadnej pamäte závisí od viditeľnosti (`rozbor-stranka.md` §3.2,
  nezmerané).

**Prečo to Chromium nevidí:** SwiftShader na Linuxe nemá strop pamäte skladača; Chromium ani v DPR 3 emulácii nedrží
vrstvy ako IOSurface.

**Potvrdí prekrytie:** počet prvkov s `will-change ≠ auto`, `position: fixed`, `position: sticky` (computed style),
odhad bajtov vrstiev (`rect × DPR² × 4`), rozdiel medzi rAF-fps a vnímaným sekaním (majiteľ priloží video z telefónu
– to prekrytie nezmeria).

**Oprava:** na `lite` **vypnúť pomalé priblíženie** (`--sp`): `html.lite .film-still img { transform: none; will-change: auto }`
a v app.js nezapisovať `--sp` pri `lite` (app.js:196, 338). Vrstvy klesnú zo 6 na 3, zápisy do štýlu počas skrolu
ostanú len `--so` pri prelínaní. Viditeľná zmena: fotka stojí, neprichádza o nič „filmové“ (prelínanie ostáva).
Rozhodnutie majiteľa len vtedy, ak priblíženie považuje za podpis; odporúčam vymeniť ho za variant B/C z POROTA
(časový prejazd v skladači, `foto-proto.css:48–55`), ktorý iOS zvládne bez hlavného vlákna.

### P6. Prvá fotka 438 kB + 3,73 MP na pomalšej sieti aplikácie: rozmazaný náhľad dlho, potom skok

**Dôkaz [kód]:** `FIRST_Q` (úsporná kvalita) platí len pre `-m-1086` (`film.py:46`); `rohozka-m-1448.avif` má 438 359 B
(`ls -l`) – najväčší súbor celej stránky okrem videa. Predčítanie v hlavičke je len AVIF (index.html:25,
`l.type='image/avif'`). Na Slow 4G to je ≈ 2,4 s samotnej fotky (oprava-1.md, Meranie 1/2/7). Kým nepríde,
vidno 24 × 43 px náhľad roztiahnutý na 430 × 932 – to môže byť „rozmazané“, ktoré majiteľ spomína spolu s videami.

**Potvrdí prekrytie:** čas `load` a `decode()` fotky úvodu od `navigationStart`, `encodedBodySize`, `nextHopProtocol`,
TTFB zdroja (latencia hostingu claude.ai).

**Oprava:** prvý obraz menší súbor (1086 s FIRST_Q = 124 712 B, alebo nový 1200), WebP predčítanie namiesto AVIF
(pozri V6 v SKEPTIK.md: **nepridávať**, ale **nahradiť**, aby sa fotka nestiahla dvakrát), náhľad 48 × 85 px (≈ 1,5 kB)
namiesto 24 × 43, aby rozmazanie nebolo také hrubé.

### P7. Hosting claude.ai: latencia, kompresia textu, obal dokumentu

**Dôkaz [kód]:** index.html 88 351 B, style.css 79 519 B, app.js 59 900 B surových (`wc -c`); na GitHub Pages idú gzipom
(≈ 14 + 19 + 15 kB, `rozbor-vaha.md` §3). Či ich claude.ai komprimuje a cez aký protokol, nevieme **[predpoklad]**.
Pri 228 kB nekomprimovaného textu pred prvým vykreslením na mobilnej sieti je to +0,5–1,5 s k čiernemu štartu
(`html { background: var(--ink) }`, style.css:64 – do príchodu CSS je okno ink, lebo `<link rel="stylesheet">`
blokuje vykreslenie, index.html:63).

**Potvrdí prekrytie:** pre `style.css`, `app.js`, dokument: `encodedBodySize` vs `decodedBodySize`, `nextHopProtocol`,
`responseStart − requestStart`, `domContentLoadedEventStart`, FCP z `PerformancePaintTiming` (Safari 14.1+).

**Oprava:** mimo stránky (hosting). Pre GitHub Pages neplatí. Majiteľovi zdôrazniť, že náhľad ≠ produkcia.

### P8. Zahodený dekód pri `display: none` ↔ `is-near` prepínaní + `fetchpriority` a 3 fotky naraz na štarte

**Dôkaz [kód]:** `html.karty .film-shot.is-title:not(.is-near):not([data-pro]) .film-still { display: none }`
(style.css:1154). Pri každom vstupe do okolia sa fotka sťahuje (z cache) a **dekóduje znova** (app.js:329 ruší `__dec`,
app.js:339 volá `prepStill`). Pri švihu cez 3 karty je to 3 × 3,73 MP dekódovania za sekundu. Po prvom obraze sa
okolie rozšíri na ±1 (app.js:324), takže sa paralelne dekódujú 3 veľké fotky práve vtedy, keď majiteľ prvýkrát
švihne.

**Potvrdí prekrytie:** počet a časy `decode()` v 10 s okne pri švihu (ring buffer), ich prekrytie s medzerami rAF.

**Oprava:** P2 (menšia plocha) rieši najviac; navyše okolie ±1 sťahovať, ale dekódovať **až pri `want > 0`**
(app.js:284), nie hneď pri `is-near`; `is-near` nechať 3, dekódovať najviac 1 naraz (fronta), prechod P1 LQIP kryje
zvyšok.

### P9. Videá na telefóne: 864 × 1536 zo zdroja 576, 60 fps dopočítaných, 3,4 MB cez `play()` bez bufferu

**Dôkaz [kód]:** `videa.sh:10–17`: originály majú 576 × 1024 a 30 fps; zväčšujú sa lanczosom na 864 × 1536 a
60 fps vzniká interpoláciou (`minterpolate`). Detaily nepribúdajú – video je **rozmazané zo zdroja** a majiteľova
podmienka „60 až 120 fps“ sa v skutočnosti nedá splniť (len dopočítané). Slučka Tím `tim-slucka-864.mp4` má 3 402 635 B
(`ls -l`), `preload="none"` (app.js:911) a `play()` sa volá hneď po 800 ms pokoja (app.js:822–833): sťahovanie sa
začne až v tej chvíli a prehrávanie sa rozbieha z prázdneho bufferu → trhanie na začiatku („sekajú“). Druhé video
`tim-v-akcii-576` (1,2 MB) hrá pri 35 % viditeľnosti (app.js:835).

**Potvrdí prekrytie:** `video.getVideoPlaybackQuality()` (Safari ho má): `droppedVideoFrames / totalVideoFrames`,
udalosti `waiting`/`stalled`, `readyState` pri `play()`, `buffered.end(0) − currentTime`.

**Oprava – rozhodnutie majiteľa (sám to žiada):** na `lite` videá nepoužívať: slučka Tím ostane fotka
(`slucky()` vráti `[]` pri `lite`, app.js:902), okno „Tím v akcii“ ukáže len plagát (bez `play()`), alebo sa pás
videa na telefóne skryje. Ušetrí sa 3,4 + 1,2 MB a jedna hardvérová dekódovacia pipeline. Ak majiteľ niekedy nahrá
skutočné 60 fps v 1080 × 1920, vrátiť.

### P10. Poradie `<source>` (AVIF pred WebP) a predčítanie len AVIF

**Dôkaz [kód]:** index.html:175–176 (telefón), 177–178 (počítač), `stills.py:41–44`; preload index.html:25. Safari 16+
berie AVIF, takže všetky fotky idú cez softvérový AV1. Nie je to chyba výberu, je to voľba formátu – dôsledok je P2.

**Oprava:** pre `(max-width: 720px)` dať WebP ako prvý `<source>` a preload `type='image/webp'` + `.webp` v `W/S`
slovníku (index.html:24–25). Pozor na V6 zo SKEPTIK: **vymeniť**, nie pridať. Počítač nechať na AVIF.

### P11. Slučka rAF, IntersectionObserver a MutationObservery počas skrolu

**Dôkaz [kód]:** slučka `tick` beží pri každom `scroll` (app.js:426–431) a v každej snímke prejde 9 záberov
(app.js:192–206) a `zabery()` (270–343); IO s 41 prahmi na kotve Tím (app.js:862–870), IO `.reveal` (627–632),
IO plagátov (807), IO tabule a nadpisov (951, 980, 985, 1066); MutationObserver na `<html>` triedach (178–181), na
triede záberu Tím (886), na bránach videí (894–895). Merané v Chromiu: p95 úlohy snímky 14–17 ms pri CPU 4×, pri
CPU 6× **26 ms** (oprava-1.md, Meranie 5 „neopravené“). iPhone v aplikácii je rýchlejší ako CPU 6× emulácia
**[predpoklad]**, takže samo osebe to sekanie nevysvetľuje; je to však práca hlavného vlákna, ktorá sa sčíta
s P1/P2/P5.

**Potvrdí prekrytie:** medzery rAF > 50 ms bez súbežného `decode()` a bez zmeny `is-shown` = čistá réžia slučky.

**Oprava:** až po meraní (L5.2 v oprava-1.md); na `lite` bez `--sp` (P5) je slučka o tretinu lacnejšia.

### P12. `img.decode()` ako brána na pomalom dekóde: ink medzi kartami pri rýchlom švihu

**Dôkaz [kód]:** `so[i] = … !ok ? 0 : want` (app.js:292) – kým nová fotka nie je dekódovaná, nové karta má krytie 0 a
drží **predchádzajúca** (app.js:296–315, `is-hold`). To je správne, kým predchádzajúca bitmapa existuje. Ak ju WebKit
zahodil (P1) alebo ak je `baseIdx = −1` (app.js:314 po páde podmienky), je výsledok ink. Chromium: 0 snímok s inkom
v 12 spôsoboch príchodu (kontrola-kod-2.md) – práve preto, že nič nezahadzuje.

**Potvrdí prekrytie:** riadok „čo sa práve prelína“: pre každý `is-shown` záber `--so`, `__dec`, `complete`,
`naturalWidth`, a či `drawImage` sonda (na požiadanie) trvá > 20 ms.

**Oprava:** P1 (LQIP všade) + P2.

### P13. JIT a výkon JS vo WKWebView v aplikácii

**[WebKit]** WKWebView beží web obsah v samostatnom procese s JIT (od iOS 8), takže JavaScript je rovnako rýchly ako
v Safari; výnimka je **Lockdown Mode** (bez JIT, bez niektorých formátov) a aplikácie, ktoré JIT vypnú cez
konfiguráciu (zriedkavé). Nie je to pravdepodobná príčina, ale lacno sa overí.

**Potvrdí prekrytie:** krátka slučka 2 000 000 iterácií (ms) – s JIT ≈ 2–6 ms, bez JIT 10×; `navigator.userAgent`
bez `Version/… Safari/` = WKWebView v aplikácii; `hardwareConcurrency`.

### P14. Drobnosti (nízky dopad, zapísané pre úplnosť)

- `text-rendering: optimizeLegibility` na `html` (style.css:70) – dlhšie rozloženie cenníka (SKEPTIK doplniť 8).
- `html { scroll-behavior: smooth }` (style.css:72) + skok z menu: WebKit animuje skrol na hlavnom vlákne **[WebKit]**,
  počas skoku sa dekódujú cieľové fotky (P8) → preletený úsek s inkom; `is-hold` drží poslednú (app.js:304–315).
- `is-catch` prechod 400 ms na `opacity` (style.css:1168) a súčasný zápis `--so` každú snímku (app.js:340): pri zmene
  hodnoty uprostred prechodu WebKit prechod reštartuje – fotka môže „dýchať“. Nízke.
- atmosfera.js až v pokoji (app.js:571), hudba 19 MB PCM po ťuknutí (SKEPTIK doplniť 6) – pamäť navyše presne vtedy,
  keď je jej najmenej (P1).
- `vernost.js` (index.html:914, `defer`) – malý, nesúvisí s výkonom; zato je to už existujúci základ pre „zákaznícku
  kartu“ (časť 4).

---

## 2. Diagnostické prekrytie do náhľadu (len JS + CSS v náhľade, nie v strome)

Cieľ: majiteľ otvorí náhľad s `?diag=1` (alebo trikrát ťukne na logo v lište), prejde stránku, ťukne **Kopírovať**
a vloží text do chatu; alebo panel odfotí. Panel sa prekresľuje najviac 2× za sekundu, nič nedekóduje sám
(okrem tlačidla „Overiť zahodenie“, ktoré majiteľ stlačí vedome), nemení triedy stránky.

### 2.1 Čo panel ukazuje (v tomto poradí, text na kopírovanie)

```
B30 DIAG f624ee8  21.10. 15:52:10  (beží 48 s)
html: karty lite world-off js-kin js-steps skrol
UA: iPhone OS 18_1 · WebKit 605.1.15 · v aplikácii (bez Version/Safari) · JIT slučka 3.1 ms · jadrá 6
okno: 430×932 · screen 430×932 · DPR 3 · visualViewport 430×932 · top=self · CSS1Compat · origin https://…
hosting: index 88351→24102 B (gzip? áno) h2 · style.css 79519→18744 · app.js 59900→15210 · TTFB 412 ms · FCP 1380 ms
načítania: 1 (bez samovoľného reštartu)       ← pri páde procesu rastie
fotky (currentSrc · load ms od štartu · decode ms · počet decode):
  rohozka-m-1448.avif  3.73MP  load 1290  dec 184/184/1×   __dec ✓  near ✓  so 1.00  shown
  sala-m-1448.avif     3.73MP  load 2210  dec 171/210/2×   __dec ✓  near ✓  so 0.42  shown is-catch
  stol-m-1448.avif     2.36MP  load –     dec –            near ✓
rozbalené teraz: 3 fotky · 9,8 MP · 39 MB RGBA · vrstvy: fixed 5, sticky 9, will-change 3 → odhad 43 MB
rAF (10 s): fps 57 · medzery >50 ms: 4 (max 212 ms @ 41.2 s, pri decode sala-m) · >100 ms: 1
skrol: y 2870 · rýchlosť 1420 px/s · html.skrol áno
videá: tim-slucka-864.mp4 ready 4 net 2 err – paused – t 3.2 s · dropped 11/192 · buffer +0.4 s · poster 200
       tim-v-akcii-576.mp4 ready 0 net 3 err 4 (SRC_NOT_SUPPORTED) · poster 404 ← ČIERNE POLE
chyby zdrojov: tim-v-akcii-poster-576.webp 404 · tim-slucka-poster-864.webp 404
udalosti (posledné): 41.0 s is-shown +sala · 41.1 decode sala-m 210 ms · 41.2 rAF 212 ms · 43.0 is-shown −cakaren …
```

### 2.2 CSS

```css
#b30diag{position:fixed;left:0;right:0;bottom:0;z-index:2147483647;max-height:46vh;overflow:auto;
  background:rgba(14,13,12,.92);color:#f1e9dd;font:11px/1.35 ui-monospace,Menlo,monospace;padding:6px 8px 10px;
  white-space:pre-wrap;word-break:break-all;contain:content;pointer-events:none}
#b30diag b{color:#e0601c}
#b30diag .bar{display:flex;gap:6px;margin-bottom:4px;pointer-events:auto}
#b30diag button{font:600 11px ui-sans-serif,system-ui;color:#0e0d0c;background:#e0601c;border:0;border-radius:4px;padding:5px 8px}
#b30diag button.off{background:#8e8578}
#b30diag.min{max-height:3.2em;overflow:hidden}
```

`pointer-events: none` na paneli (stránka sa pod ním dá skrolovať), tlačidlá majú `auto`. Panel nemá `will-change`
ani `backdrop-filter`, takže nepridáva vrstvu s filtrom (jedna pevná vrstva bez rozmazania).

### 2.3 JS (vložiť ako `<script>` pred `assets/app.js`, aby obalenie `decode` zachytilo aj prvé volanie)

```html
<script>
(function(){
/* zapnutie bez ?diag=1: 3 ťuknutia na logo v lište do 1,5 s (uloží sa a stránka sa znova načíta s panelom) */
document.addEventListener('DOMContentLoaded',function(){var b=document.querySelector('.brand'),n=0,t=0;if(!b)return;
  b.addEventListener('click',function(e){var k=performance.now();n=k-t<1500?n+1:1;t=k;if(n>=3){e.preventDefault();try{localStorage.setItem('b30.diag','1');}catch(x){}location.reload();}},true);});
var on=false;try{on=/[?&]diag=1\b/.test(location.search)||!!localStorage.getItem('b30.diag');}catch(e){}
if(!on)return;
var T0=performance.timeOrigin||0,now=function(){return performance.now()},s=function(ms){return (ms/1000).toFixed(1)+' s'};
var ev=[],MAXEV=40,log=function(m){ev.push(s(now())+' '+m);if(ev.length>MAXEV)ev.shift()};
var nm=function(u){return (u||'').split('/').pop().split('?')[0]||'–'};
/* 1. decode: obalenie HTMLImageElement.prototype.decode – čas, počet, výsledok, podľa currentSrc */
var dec={};/* name -> {n, last, max, sum} */
var D=HTMLImageElement.prototype.decode;
if(D)HTMLImageElement.prototype.decode=function(){var img=this,n=nm(img.currentSrc||img.src),t=now();
  log('decode začína '+n);
  return D.apply(this,arguments).then(function(){var d=now()-t,r=dec[n]||(dec[n]={n:0,max:0,sum:0});r.n++;r.last=d;r.max=Math.max(r.max,d);r.sum+=d;log('decode '+n+' '+d.toFixed(0)+' ms');},
    function(e){var r=dec[n]||(dec[n]={n:0,max:0,sum:0});r.n++;r.err=String(e&&e.name);log('decode CHYBA '+n+' '+r.err);throw e;});};
/* 2. load/error všetkých img/video (capture), chyby zdrojov */
var loads={},errs=[];
addEventListener('load',function(e){var t=e.target;if(t&&t.tagName==='IMG'){loads[nm(t.currentSrc||t.src)]=now();}},true);
addEventListener('error',function(e){var t=e.target;if(!t||!t.tagName)return;var u=t.currentSrc||t.src||(t.tagName==='SOURCE'?t.src:'');if(u){errs.push(nm(u)+' chyba');log('CHYBA zdroja '+nm(u));}},true);
/* 3. rAF medzery: posledných 10 s */
var gaps=[],last=0,frames=[];
(function raf(t){if(last){var g=t-last;frames.push(t);if(g>50)gaps.push({t:t,g:g,co:ev.length?ev[ev.length-1].slice(0,60):''});}last=t;
  var cut=t-10000;while(gaps.length&&gaps[0].t<cut)gaps.shift();while(frames.length&&frames[0]<cut)frames.shift();requestAnimationFrame(raf);})(now());
/* 4. skrol */
var ys=[],yv=0;addEventListener('scroll',function(){var t=now(),y=scrollY;ys.push([t,y]);while(ys.length>2&&ys[0][0]<t-250)ys.shift();var a=ys[0];yv=ys.length>1?Math.abs(y-a[1])/((t-a[0])/1000):0;},{passive:true});
/* 5. triedy záberov: is-shown / is-near / is-catch / is-hold (MutationObserver len na .film-shot.is-title) */
var shots=[];function watchShots(){shots=[].slice.call(document.querySelectorAll('.film-shot.is-title'));
  shots.forEach(function(sh){if(sh.__dg)return;sh.__dg=1;var prev=sh.className;new MutationObserver(function(){var c=sh.className;['is-shown','is-near','is-catch','is-hold'].forEach(function(k){var a=prev.indexOf(k)>=0,b=c.indexOf(k)>=0;if(a!==b)log((b?'+':'−')+k+' '+sh.dataset.shot);});prev=c;}).observe(sh,{attributes:true,attributeFilter:['class']});});}
document.addEventListener('DOMContentLoaded',watchShots);
/* 6. reštarty procesu: počítadlo v sessionStorage (rastie pri type=navigate/reload bez akcie majiteľa) */
var nav=(performance.getEntriesByType('navigation')||[])[0],nt=nav?nav.type:'?',cnt=0;try{cnt=+(sessionStorage.b30diagN||0)+1;sessionStorage.b30diagN=cnt;}catch(e){}
/* 7. JIT sonda (jednorazová, ~3 ms s JIT) */
var jit=(function(){var t=now(),x=0;for(var i=0;i<2e6;i++)x=(x*31+i)|0;return (now()-t).toFixed(1)+' ms'+(x===Infinity?'':'');})();
/* 8. hosting: resource timing textov */
function res(n){var e=performance.getEntriesByName(new URL(n,document.baseURI).href)[0];return e?n+' '+e.decodedBodySize+'→'+e.encodedBodySize+' B '+(e.nextHopProtocol||'?')+' ttfb '+(e.responseStart-e.requestStart).toFixed(0):n+' –';}
/* 9. vrstvy a pamäť (Safari nemá performance.memory): computed style raz za 2 s, len keď je panel otvorený */
function layers(){var fx=0,st=0,wc=0,bytes=0,dpr=devicePixelRatio||1,all=document.querySelectorAll('body *');
  for(var i=0;i<all.length;i++){var cs=getComputedStyle(all[i]),p=cs.position,w=cs.willChange;
    if(p==='fixed')fx++;else if(p==='sticky')st++;if(w&&w!=='auto')wc++;
    if(p==='fixed'||(w&&w!=='auto')){var r=all[i].getBoundingClientRect();bytes+=r.width*r.height*dpr*dpr*4;}}
  return 'fixed '+fx+', sticky '+st+', will-change '+wc+' → odhad vrstiev '+(bytes/1048576).toFixed(0)+' MB';}
function photos(){var out=[],mp=0,n=0,rgba=0;
  shots.forEach(function(sh){var img=sh.querySelector('.film-still img'),st=sh.querySelector('.film-still');if(!img)return;
    var name=nm(img.currentSrc||img.src),d=dec[name],disp=st&&getComputedStyle(st).display!=='none';
    if(img.complete&&img.naturalWidth&&disp){n++;mp+=img.naturalWidth*img.naturalHeight/1e6;rgba+=img.naturalWidth*img.naturalHeight*4;}
    out.push('  '+sh.dataset.shot+': '+name+' '+(img.naturalWidth?(img.naturalWidth*img.naturalHeight/1e6).toFixed(2)+'MP':'')+' load '+(loads[name]?loads[name].toFixed(0):'–')
      +' dec '+(d?d.last.toFixed(0)+'/'+d.max.toFixed(0)+'/'+d.n+'×':'–')+(img.__dec?' __dec✓':'')+(img.__near?' near✓':'')
      +' so '+(st?st.style.getPropertyValue('--so')||'–':'–')+' '+['is-shown','is-catch','is-hold'].filter(function(k){return sh.classList.contains(k)}).join(' '));});
  return out.join('\n')+'\nrozbalené teraz: '+n+' fotky · '+mp.toFixed(1)+' MP · '+(rgba/1048576).toFixed(0)+' MB RGBA';}
function videos(){return [].slice.call(document.querySelectorAll('video')).map(function(v){var q=v.getVideoPlaybackQuality?v.getVideoPlaybackQuality():null,b=v.buffered&&v.buffered.length?(v.buffered.end(v.buffered.length-1)-v.currentTime).toFixed(1):'–';
  return '  '+nm(v.currentSrc||v.src)+' ready '+v.readyState+' net '+v.networkState+' err '+(v.error?v.error.code:'–')+(v.paused?' paused':' hrá')+' t '+v.currentTime.toFixed(1)+(q?' dropped '+q.droppedVideoFrames+'/'+q.totalVideoFrames:'')+' buffer +'+b+' s poster '+(v.poster?nm(v.poster):'–');}).join('\n')||'  žiadne';}
/* 10. overenie zahodenia bitmapy (na požiadanie): drawImage hotovej fotky do 1×1 – >20 ms = dekódovalo sa znova */
function purgeTest(){var c=document.createElement('canvas');c.width=c.height=1;var x=c.getContext('2d'),r=[];
  shots.forEach(function(sh){var img=sh.querySelector('.film-still img');if(!img||!img.__dec)return;var t=now();try{x.drawImage(img,0,0,1,1);}catch(e){}r.push(sh.dataset.shot+' '+(now()-t).toFixed(0)+' ms');});
  log('overenie zahodenia: '+r.join(', '));}
/* panel */
var el=document.createElement('div');el.id='b30diag';var bar=document.createElement('div');bar.className='bar';
['Kopírovať','Overiť zahodenie','Min/Max','Vypnúť'].forEach(function(t,i){var b=document.createElement('button');b.textContent=t;b.onclick=function(){
  if(i===0){var tx=el.textContent.replace(/^.*\n/,'');(navigator.clipboard?navigator.clipboard.writeText(tx):Promise.reject()).then(function(){b.textContent='Skopírované';},function(){var r=document.createRange();r.selectNodeContents(body);getSelection().removeAllRanges();getSelection().addRange(r);});}
  if(i===1)purgeTest();if(i===2)el.classList.toggle('min');if(i===3){try{localStorage.removeItem('b30.diag');}catch(e){}el.remove();}};bar.appendChild(b);});
var body=document.createElement('div');el.appendChild(bar);el.appendChild(body);
function ua(){var u=navigator.userAgent,ios=(u.match(/OS (\d+_\d+)/)||[])[1],wk=(u.match(/AppleWebKit\/([\d.]+)/)||[])[1];return 'iPhone OS '+(ios||'?')+' · WebKit '+(wk||'?')+(/Version\/[\d.]+.*Safari/.test(u)?' · Safari':' · v aplikácii (WKWebView, bez Version/Safari)')+' · JIT slučka '+jit+' · jadrá '+(navigator.hardwareConcurrency||'?')+' · pamäť '+(navigator.deviceMemory||'nevie');}
function render(){var fcp=(performance.getEntriesByType('paint')||[]).filter(function(p){return p.name==='first-contentful-paint'})[0];
  var fps=frames.length>1?(frames.length-1)/((frames[frames.length-1]-frames[0])/1000):0,big=gaps.filter(function(g){return g.g>100}).length,mx=gaps.reduce(function(a,g){return g.g>a.g?g:a},{g:0});
  var vv=window.visualViewport;
  body.textContent=['B30 DIAG '+((document.querySelector('meta[name=b30-commit]')||{}).content||'?')+' '+new Date().toLocaleTimeString('sk-SK')+' (beží '+s(now())+')',
   'html: '+document.documentElement.className,'UA: '+ua(),
   'okno: '+innerWidth+'×'+innerHeight+' · screen '+screen.width+'×'+screen.height+' · DPR '+devicePixelRatio+' · visualViewport '+(vv?Math.round(vv.width)+'×'+Math.round(vv.height):'–')+' · '+(top===self?'top=self':'V RÁMCI')+' · '+document.compatMode+' · '+location.origin,
   'hosting: '+res(location.pathname.split('/').pop()||'index.html')+' · '+res('assets/style.css')+' · '+res('assets/app.js')+(nav?' · TTFB '+(nav.responseStart-nav.requestStart).toFixed(0)+' ms · DCL '+nav.domContentLoadedEventStart.toFixed(0):'')+(fcp?' · FCP '+fcp.startTime.toFixed(0)+' ms':''),
   'načítania v tejto relácii: '+cnt+' ('+nt+')',
   'fotky (currentSrc · MP · load ms · decode posledné/max/počet):',photos(),layers(),
   'rAF (10 s): fps '+fps.toFixed(0)+' · medzery >50 ms: '+gaps.length+(mx.g?' (max '+mx.g.toFixed(0)+' ms @ '+s(mx.t)+(mx.co?' po: '+mx.co:'')+')':'')+' · >100 ms: '+big,
   'skrol: y '+Math.round(scrollY)+' · rýchlosť '+Math.round(yv)+' px/s · html.skrol '+(document.documentElement.classList.contains('skrol')?'áno':'nie'),
   'videá:',videos(),'chyby zdrojov: '+(errs.length?errs.join(' · '):'žiadne'),'udalosti:',ev.slice(-12).join('\n')].join('\n');}
document.addEventListener('DOMContentLoaded',function(){document.body.appendChild(el);watchShots();render();setInterval(render,500);});
try{localStorage.setItem('b30.diag','1');}catch(e){}
})();
</script>
```

Poznámky k prekrytiu:
- `<meta name="b30-commit" content="f624ee8">` vložiť do hlavičky náhľadu, aby bol na snímke commit.
- Obalenie `decode` musí byť pred app.js (app.js volá `img.decode()` hneď po `load`, app.js:262).
- Panel sa prekresľuje každých 500 ms (`textContent`, jeden uzol) – lacné; `layers()` prejde ≈ 1 500 prvkov
  computed style, ≈ 5–10 ms, len keď panel beží. Je to jediný zásah do merania a je známy.
- Pamäť: Safari nemá `performance.memory` ani `measureUserAgentSpecificMemory`; namiesto toho panel ukazuje
  (a) teoretickú veľkosť rozbalených fotiek, (b) odhad zadnej pamäte vrstiev, (c) počítadlo načítaní (pád procesu
  WebContent sa prejaví ako nové načítanie s `type` `navigate`/`reload` bez zásahu majiteľa), (d) test zahodenia
  bitmapy na požiadanie.
- Čo má majiteľ urobiť (5 snímok + 1 kopírovanie): (1) otvoriť náhľad s `?diag=1`, počkať 5 s, snímka; (2) švihnúť
  3× rýchlo, snímka; (3) menu → Galéria, snímka hneď a po 2 s; (4) zastaviť na Tíme 3 s, snímka; (5) ťuknúť „Overiť
  zahodenie“ a potom „Kopírovať“, vložiť do chatu. Ak uvidí čiernu obrazovku, odfotiť **s panelom** – riadky `fotky`
  a `udalosti` povedia, či fotka bola dekódovaná, zahodená, nestiahnutá, alebo či panel vôbec beží (pád procesu =
  panel zmizne a „načítania“ narastie).

---

## 3. Okamžité opravy bez merania (nízke riziko)

Poradie podľa pomeru prínos / riziko. Žiadna z 1–5 nemení vzhľad v pokoji na počítači.

| # | oprava | kde | prínos | riziko | rozhodnutie majiteľa |
|---|---|---|---|---|---|
| O1 | **LQIP pod každou zálohou** (nie len úvod): `--nahlad` do 9 `<picture class="film-still">`, pravidlo style.css:1148–1150 bez `[data-pro]`; ten istý postup ako v 5015ac6 (24 × 43 px WebP q60 ≈ 470 B; odporúčam 48 × 85 px ≈ 1,5 kB) | index.html, style.css, `stills.py:41–45` | nikdy ink pod fotkou (P1, P8, P12), aj pri zahodení bitmapy | +≈ 10 kB HTML; nižšie | nie |
| O2 | **WebP pred AVIF na telefóne** + preload `.webp` namiesto `.avif` (vymeniť, nie pridať – SKEPTIK V6) | index.html:24–25, 175–176 a všetkých 9 kariet; `stills.py:41–42` | dekódovanie 2–4× lacnejšie **[predpoklad]** | bajty +30 % (rohozka 570 kB) – na pomalej sieti dlhší náhľad; po O1 je to menej viditeľné | nie (dočasne, kým prekrytie nezmeria AVIF/WebP) |
| O3 | **Bez pomalého priblíženia na `lite`**: `html.lite .film-still img { transform: none; will-change: auto }`, app.js nepíše `--sp` pri `lite` | style.css:471, 475; app.js:196, 338 | 3 vrstvy namiesto 6 (−43 MB), žiadny transform z JS počas skrolu (P5) | fotka stojí (prelínanie ostáva) | áno, ak majiteľ priblíženie chce; odporúčam vymeniť za variant B/C z POROTA |
| O4 | **Plagát videa ako pozadie z AVIF** na `.video-window` a LQIP pre `.band picture.cakaj` | style.css:387–394, 806–808 | žiadne čierne pole pri chýbajúcom alebo pomalom súbore (P3) | žiadne | nie |
| O5 | **Náhľad = všetky súbory** (WebP, JPG lightboxu, MP4, plagáty) alebo prepnúť lightbox na AVIF | publikovanie náhľadu, index.html:684 … | čierne polia z 404 zmiznú (P3) | žiadne | nie |
| O6 | **Videá na telefóne vypnúť**: `slucky()` → `[]` pri `lite`; `.video-window` len plagát | app.js:902, 811–818 | −4,6 MB, žiadne sekanie ani rozmazané video (P9) | majiteľ stráca pohyb v Tíme na telefóne – sám to žiada | **áno** (obsah) |
| O7 | **Menšie fotky**: variant B (`-1448` na šírku, 1,40 MP, existuje) alebo nový stupeň `-m-1200` | index.html `<source>`, `film.py` | dekód 2,7×/1,5× rýchlejší, pamäť 5,6 / 10 MB na fotku, bajty −64 % (B) | B mení kompozíciu (celá fotka v páse, nie cez celé okno); 1200 = −17 % ostrosti | **áno** (vzhľad) – ukázať A / B / 1:1 na iPhone (POROTA.md, SKEPTIK S6) |
| O8 | Prvý obraz: 1086 s FIRST_Q (124 712 B) len pre úvod, 1448 ostatné | index.html:25, 175 | prvá fotka 3,5× skôr na pomalej sieti (P6) | úvod o 25 % mäkší | áno (ostrosť úvodu) |
| O9 | `<meta name="b30-commit">` + prekrytie z časti 2 v každom ďalšom náhľade | náhľad | každá spätná väzba majiteľa príde s číslami | žiadne | nie |

Čo **nerobiť** bez merania: `decoding="sync"` na zobrazenom zábere (odstráni čiernu, ale pridá zásek 50–150 ms na
hlavnom vlákne pri každom prelínaní), `content-visibility` na pásoch (mení výšku dokumentu počas skrolu), zmena slučky
rAF (Meranie 5 ukázalo, že jediný vinník neexistuje).

---

## 4. Čo zo spätnej väzby nie je výkon (len zaradenie, nič nestavať bez súhlasu)

- **„Prechody nie sú cinematické ani filmové“**: na `lite` je zámerne len prelínanie kariet (SPEC L2; style.css:1132–1143).
  Cinematický pohyb bez hlavného vlákna dáva variant C z `foto-proto.css:36–55` (časový prejazd v skladači,
  overené 481/481 snímok v skladači v Chromiu) alebo `animation-timeline: view()` (Safari 26). Rozhodnutie majiteľa
  (vzhľad), až po O1–O3, inak sa čierne obrazovky vrátia s väčšou plochou (C berie `-2896`, 5,6 MP – P2).
- **AI agent na stránke**: statický web na GitHub Pages nemá server; agent potrebuje API kľúč a službu, ktorá stojí
  peniaze a vyžaduje účet (napr. Anthropic API cez malý proxy na Cloudflare Workers / Supabase Edge, vernostný
  systém už má API na `headspa30.sk/vernost/api/`, `vernost.js:12`). Obsah odpovedí len z `docs/FAKTY.md`,
  `index.html` (služby, ceny, hodiny) a Booqme odkazov. **Rozhodnutie majiteľa** (náklady, účet, súhlas s odosielaním
  otázok návštevníkov tretej strane, GDPR text).
- **Zákaznícka karta**: existuje `vernost.js` (index.html:914, prihláška k vernostnej kartičke pred rezerváciou;
  `../docs/VERNOSTNA-KARTA.md`: vlastný systém, možnosť B, admin, bez `data-zapnute` prihláška mlčí). Zapnúť
  `data-zapnute` na Barbershop 30 = **rozhodnutie majiteľa** (recepcia musí kartičky obsluhovať; GDPR).
- **„Celé fotky vidno“**: dnes 30,8 % plochy scény (`FAKTY.md` §0) – varianty B / 1:1 v `fotky-ako-pc/`, rozhodnutie
  majiteľa (POROTA + SKEPTIK S2/S6). Zhoda s O7.

---

## 5. Ďalší krok (plán 1. kola v2)

1. Náhľad v2 = f624ee8 + O1 + O2 + O4 + O5 + O9 (prekrytie), **bez** zmien vzhľadu. Majiteľ urobí 5 snímok + kopírovanie
   podľa časti 2. Zároveň otvoriť ten istý náhľad v **Safari** (nie v aplikácii) a zopakovať – rozdiel ukáže P3/P4/P7.
2. Z panelu: ak `decode` AVIF > 60 ms a WebP < 25 ms → O2 natrvalo; ak „načítania“ > 1 alebo „overenie zahodenia“
   > 20 ms → P1/P5 potvrdené → O3 + O7 ako jediná cesta; ak `V RÁMCI` alebo `innerHeight ≫ screen.height` → náhľad
   mimo aplikácie, meranie zopakovať.
3. Až potom rozhodnutia majiteľa: videá na telefóne (O6), fotky A/B/1:1 (O7), cinematický prejazd (C), AI agent,
   zákaznícka karta – každé s ukážkou na jeho iPhone, nie v Chromiu.
