# Plán „Telefón v2“ – BARBERSHOP 30 (ľahký telefón po spätnej väzbe majiteľa z iPhonu, 21. 10. 2026)

Senior technický riaditeľ a art director, 21. 10. 2026, ~20:30 UTC. Zostavené len z rozborov v tomto priečinku
(`diagnoza.md`, `pohyb.md`, `asistent.md`, `vernost.md`), zo stromu vetvy `barbershop-lahky-telefon` (HEAD **f624ee8**)
a z dokumentov `lahky-telefon/`. Bez prehliadača, bez servera, bez zmeny stromov.

Cesty: `$SP` = `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad`;
`$T` = `$SP/hs-lahky/barbershop-30` (index.html, assets/app.js, assets/style.css); `$L` = `$SP/barber/lahky-telefon`;
`$V` = `$L/v2`. Čísla riadkov sú z `$T` k 21. 10. 2026 (znova overené `sed -n` pri písaní tohto plánu).

Označenie istoty: **[kód]** dokázané súbor:riadok; **[meranie]** z Chromia v kontajneri (SwiftShader, CPU 4×/6×);
**[WebKit]** známe správanie WebKitu, na zariadení neoverené; **[predpoklad]** hypotéza; **[rozhodnutie majiteľa]** stojí
peniaze, vyžaduje účet, prístup, právny text alebo mení vzhľad – bez jeho slova sa nerobí.
**Z iPhonu nemáme ani jedno číslo** – preto je prvá dávka diagnostika.

---

## 0. Čo majiteľ povedal a kde to v kóde je

| Výčitka (21. 10. ~15:45 UTC, iPhone 430×932, náhľad claude.ai len s AVIF) | Najpravdepodobnejšia príčina | Dávka |
|---|---|---|
| „stále čierne obrazovky … žiadne čierne polia ani okná“ | pod 8 z 9 fotiek je len plochá farba `--ink-2` (`style.css:463`), náhľad z HTML má iba úvod (`index.html:174`, `style.css:1148` len `[data-pro]`); WebKit nedekódovanú alebo zahodenú bitmapu maľuje ako nič **[WebKit]**; náhľad nemal `.webp` plagáty, JPG lightboxu ani videá → tmavé obdĺžniky priamo (`index.html:325–327`, `684`; `style.css:387–394` `--ink-3`) **[kód]** | **V1** (po V0) |
| „zhoršila sa plynulosť“ | 3,73 MP AVIF na záber (`-m-1448`, `index.html:175`, 438 kB) softvérovo dekódovaný **[WebKit, predpoklad]**; až 6 pevných vrstiev cez celé okno s `will-change` (`style.css:475`, `1137`) a `transform` z JS v každej snímke (`style.css:471`, `app.js:338`); 9 zápisov premenných na snímku skrolu (`app.js:198–204`, `338–341`) **[kód]** | **V1** (bez merania), **V3** |
| „prechody nie sú cinematické ani filmové“ | prelínanie je pripnuté na prst – krytie píše skrol centimeter po centimetri (`app.js:292`, lerp na dotyku vypnutý `app.js:358–360`); strih nemá vlastný čas (`pohyb.md` 1.2) | **V3** |
| „chcem, aby celé fotky boli vidno“ | telefón ukazuje 30,8 % scény (`fotky-ako-pc/FAKTY.md:32`); porota odporúča variant B (celá fotka na šírku, `POROTA.md` Verdikt) | **V2** |
| „videá sekajú a sú rozmazané; nedávaj ich pod 60–120 fps“ | slučka 864×1536 zväčšená z 576 px, 60 fps dopočítaných (`videa.sh:10–17` cez `diagnoza.md` P9), 3,4 MB `play()` z prázdneho bufferu (`app.js:911`, `822–833`) | **V4** |
| „stránka má komunikovať – AI agent“ | nič také v strome nie je; web je statický bez servera (`README.md:3–4`) | **V5** |
| „zákazník si má vytvoriť zákaznícku kartu“ | systém existuje celý, ale je vypnutý (`vernost.js:42–43`, `index.html:914` bez `data-zapnute`); odkaz v pätičke vedie na HEAD SPA (`index.html:879`) | **V6** |

Dôležité pre čítanie výsledkov: majiteľ hodnotil **WKWebView v aplikácii Claude** a **hosting claude.ai** (iná latencia,
možno rámec – `app.js:861–866` s tým počíta), nie Safari ani GitHub Pages. Naše merania sú len z Chromia so SwiftShader
(`$L/stavba/meranie-1.md`, časť 1): p95 úlohy snímky 54,1 → 14,5 ms (−73 %, `meranie-1.md:28`), bajty prvej obrazovky
2 161 → 1 050 kB (−51 %, `:26`), ale LoAF > 50 ms 467 → 21, **nie 0** (`:31`). Chromium nevidí tri veci, ktoré na iPhone
rozhodujú: strop pamäte a zahadzovanie bitmáp, asynchrónne maľovanie WebKitu, chýbajúce súbory v náhľade
(`diagnoza.md` časť 0).

---

## 1. Pravidlá stavby (platia pre každú dávku)

1. **Jediný zapisovateľ v strome `$T`.** Dávky sa stavajú postupne, nikdy dve naraz; každá dávka = samostatné commity
   na vetve `barbershop-lahky-telefon` (ako doteraz 0f6ffa3…f624ee8).
2. **Stavba začne až po dobehnutí bežiacej kontroly vetvy** (meranie 2, `$L/stavba/meranie-2/beh.log`, beží od 20:07 UTC;
   používa porty 8600–8619). Do tej doby len príprava mimo stromu (`$V/`, náhľad) – tak vznikol aj `$V/lqip/lqip.json`
   (48 náhľadov, 146–448 B, 24 px na dlhšej strane – overené PIL: `rohozka-m-1086` 24×43, `rohozka-1086` 24×15).
3. **Nič sa nenasadzuje** na GitHub Pages. Majiteľ vidí len súkromný náhľad (artefakt claude.ai); po každej dávke
   nový náhľad s číslom commitu v `<meta name="b30-commit">`.
4. **Počítač bez zmeny**: film (`html.world`) ostáva; každá dávka má kontrolu 1440×900 pixelovo zhodnú s HEAD
   (`karty-shot`, kritérium K5 poroty) a úzke okno s myšou 700×900 bez zmeny (SKEPTIK V3). Všetky zmeny vzhľadu
   telefónu idú pod `html.lite` a `@media (max-width: 720px)`.
5. **Žiadne nové tvrdenia o podniku** (ceny, hodiny, služby len z `index.html`, `docs/CONTENT_SOURCES.md`, Booqme odkazov
   `index.html:484, 644`). Právne texty schvaľuje majiteľ.
6. **Každá dávka má tri kontroly**: kód (riadky a testy), meranie v Chromiu (`meraj.mjs` z `$L/stavba/meranie-1/nastroje`,
   390×844 a 430×932, DPR 3, CPU 4×, Fast aj Slow 4G; `tma.py`), vzhľad (snímky + **fotka z iPhonu majiteľa**).
   Kritérium prijatia platí len vtedy, keď prejdú obe strany: Chromium **a** telefón.
7. **Nič, čo stojí peniaze alebo vyžaduje účet, prístup či súhlas**, sa nerobí bez majiteľa – označené
   **[rozhodnutie majiteľa]** a zhrnuté v časti 3.

Poradie stavby (podľa toho, čo majiteľ vidí najskôr a čo čomu predchádza):
**V0 → V1 → V4 → V2 → V3 → V6 (časť „hneď“) → V5**. V6a (skrytie chybného odkazu v pätičke, 1 riadok) sa môže
pripojiť hneď k V1, lebo je to živá chyba a nesúvisí s fotkami. V5 nasadíme až po fotkách (nesmie nič pridať do
prvého obrazu ani do skrolu), stavať sa dá súbežne mimo stromu (JSON, testy).

---

## 2. Dávky

### V0 – Diagnostika na iPhone majiteľa (prekrytie v náhľade, nič v strome)

**Cieľ:** prvé čísla z telefónu. Potvrdiť alebo vyvrátiť P1 (bitmapa zahodená → ink), P2 (AVIF dekódovanie pomalé),
P3 (chýbajúce súbory v náhľade), P4 (náhľad v rámci), P5 (rAF 60 Hz aj na ProMotion), P6 (`animation-timeline`),
P7 (`clip-path` na skladači) – všetko sú dnes **[predpoklad]** (`diagnoza.md` časť 1, `pohyb.md` časť 13).

**Súbory:** len skladač náhľadu (artefakt), nie `$T`:
- `<script>` prekrytia z `diagnoza.md` časť 2.3 (syntax overená), vložený **pred** `assets/app.js`, aby obalenie
  `HTMLImageElement.prototype.decode` zachytilo aj prvé volanie (`app.js:262`); CSS z časti 2.2; zapnutie `?diag=1` alebo
  3 ťuknutia na logo. Doplniť riadky z `pohyb.md` 8.1: `CSS.supports('animation-timeline: view()')`, `'filter' in
  CanvasRenderingContext2D.prototype`, podpora AVIF (1-px data URI), `(hover: none) and (pointer: coarse)`, histogram rAF
  p50/p95/max a počty rozstupov > 34 ms a > 9 ms, sonda „viditeľná pred dekódovaním“ (pasívna).
- `<meta name="b30-commit" content="f624ee8">`.
- Náhľad musí mať **všetky súbory** (WebP, AVIF, JPG lightboxu, plagáty, MP4) – náhľad v5 (PRIEBEH 21. 10. 16:20) už má
  WebP a je bez videí; pre V0 dať aj pôvodnú podobu f624ee8 (AVIF + videá) ako druhý náhľad, inak nezmeriame AVIF
  a videá, ktoré majiteľ videl.

**Čo majiteľ odfotí (5 snímok + 1 kopírovanie, `diagnoza.md` 2.3 poznámky):**
1. otvoriť náhľad s `?diag=1`, počkať 5 s, snímka (štart, hosting, `top=self` alebo `V RÁMCI`, FCP, TTFB);
2. švihnúť 3× rýchlo, snímka (rAF medzery, `decode` ms, `rozbalené teraz` MB);
3. menu → Galéria, snímka hneď a po 2 s (skok z menu, chyby zdrojov);
4. zastaviť na Tíme 3 s, snímka (videá: `dropped/total`, `readyState`, `poster`);
5. ťuknúť „Overiť zahodenie“, potom „Kopírovať“ a vložiť text do chatu.
Ak uvidí čiernu obrazovku, odfotiť **s panelom**. Potom to isté v **Safari mimo aplikácie** (rozdiel = P3/P4/P7).
Po nasadení na GitHub Pages zopakovať bod 1 (latencia hostingu, `diagnoza.md` P7).

**Merateľné kritérium (dávka je hotová, keď máme):** 5 snímok + text z telefónu, z nich odčítané: `decode()` ms pre
každú z 9 fotiek a formát (`currentSrc`), rAF p95 a počet rozstupov > 34 ms pri švihu, `načítania v relácii` (> 1 = pád
procesu), výsledok „Overiť zahodenie“ (> 20 ms = bitmapa zahodená), `top=self`/`V RÁMCI`, zoznam chýb zdrojov, stav
videí. Rozhodovací strom (`diagnoza.md` časť 5 bod 2):
- `decode` AVIF > 60 ms a WebP < 25 ms → V1 WebP natrvalo; ak aj WebP > 40 ms → JPEG stupeň pre pás fotky (V1c);
- `načítania` > 1 alebo „Overiť zahodenie“ > 20 ms → P1/P5 potvrdené → V1 LQIP + bez priblíženia sú nutné, V2 (menšia
  plocha) je jediná trvalá cesta;
- `V RÁMCI` alebo `innerHeight ≫ screen.height` → náhľad v aplikácii je nepoužiteľný na hodnotenie, meranie zopakovať
  v Safari; nie je to chyba stránky;
- rAF p50 ≈ 8,3 ms → P5 padá (120 Hz), kritérium V3 sa sprísni na ≤ 9 ms.
Chromium: prekrytie samo nesmie zhoršiť p95 o viac než 2 ms (`layers()` prejde ≈ 1 500 prvkov každých 500 ms; známy
zásah, `diagnoza.md` 2.3 poznámky).

**Riziko: nízke.** Panel je jediné povolené tmavé pole (len pri ladení). Riziko merania: panel beží v tej istej stránke,
ktorú meria; pád procesu panel zhodí – preto počítadlo načítaní v `sessionStorage`.

**Čaká na majiteľa:** 5 snímok + skopírovaný text, raz v aplikácii Claude, raz v Safari. Nestojí nič.

---

### V1 – Žiadne čierne polia ani okná (bez merania, nízke riziko, bez zmeny vzhľadu v pokoji)

**Cieľ:** nikdy plochá farba pod fotkou, žiadny tmavý obdĺžnik z chýbajúceho alebo pomalého súboru, lacnejšie
dekódovanie na telefóne, menej vrstiev. Všetko z `diagnoza.md` časť 3 (O1–O5, O8) + SKEPTIK V6.

**Súbory a kroky:**
1. **V1a LQIP pod každou zálohou** (O1): do všetkých 9 `<picture class="film-still" style="…">` doplniť `--nahlad`
   z `$V/lqip/lqip.json` (kľúče `*-m-1086.webp`, 254–448 B, 24×43 px; spolu ≈ 3,5 kB surových, ≈ 2,7 kB gzip);
   pravidlo `style.css:1148–1150` zovšeobecniť (bez `[data-pro]`): `html.lite .film-shot.is-title .film-still { background:
   var(--nahlad) … / cover no-repeat var(--ink-2) }`, `img { opacity: 0 } img.nacitana { opacity: 1 }` – triedu `nacitana`
   dnes dostáva len úvod z hlavičky (`index.html:29`, MutationObserver pri `still-uvod`); pre ostatné ju nastaví `prepStill`
   po `decode()` (`app.js:260`, `done(true)`). Šablóna generátora: `source/tools/stills.py:41–45`. Ak diagnostika ukáže
   hrubé „kosoštvorce“, prejsť na 48×85 px (≈ 1,5 kB/ks, `diagnoza.md` P6).
2. **V1b WebP pred AVIF na telefóne** (O2/P10): v telefónnom `<source media="(max-width: 720px)">` poradie WebP → AVIF
   (`index.html:175–176` a všetkých 9 kariet; `stills.py:41–42`); predčítanie **vymeniť** na `.webp` (`index.html:24–25`:
   `l.type='image/webp'` a prípona v slovníku `W/S`), **nie pridať** (SKEPTIK V6: inak sa prvá fotka stiahne dvakrát).
   Počítač ostáva na AVIF. Cena: bajty +30 % (rohozka-m-1448 438 → 570 kB) – dočasne, kým V0 nezmeria pomer
   AVIF/WebP; po V2 klesnú bajty o 64 % (`POROTA.md`), takže sa to vráti.
3. **V1c JPEG stupeň** – len ak V0 ukáže `decode` WebP > 40 ms: nový výstup `stills.py` (JPEG q 80, tie isté rozmery),
   `<source type="image/jpeg">` ako prvý na telefóne. Nové súbory ≈ +40 % bajtov proti WebP **[predpoklad]**. Bez V0
   sa nerobí.
4. **V1d Plagát videa ako pozadie** (O4): `.video-window { background: var(--nahlad) … / cover }` z LQIP
   (`lqip.json` kľúče `assets/video/*-poster-*.webp`, 292–386 B) namiesto plochého `--ink-3` (`style.css:387–394`);
   to isté pre `.band picture.cakaj` (`style.css:806–808`) z kľúčov `galeria-*-640.webp`, `detail-*-640.webp`.
5. **V1e Lightbox bez JPG-závislosti**: `data-lightbox-src` na AVIF/WebP (`index.html:684`, 8 tlačidiel; AVIF 1600
   existuje: `index.html:686`), a náhľad s úplnou sadou súborov (O5).
6. **V1f Bez pomalého priblíženia na lite** (O3/P5): `html.lite .film-still img { transform: none; will-change: auto }`
   (`style.css:471, 475`) a `app.js` nepíše `--sp` pri `lite` (`app.js:196, 338`). Vrstvy 6 → 3 (−43 MB **[výpočet]**),
   0 transformov z JS počas skrolu. Viditeľná zmena: fotka na telefóne stojí; pohyb kamery sa vracia vo V3 ako
   „dosadnutie“ v CSS (`pohyb.md` 4.1). Ak majiteľ priblíženie považuje za podpis, povie to pri V3 – zatiaľ ho vypíname
   kvôli plynulosti (sám žiada plynulosť pred efektom).
7. **V1g Prvý obraz menší** (O8, **[rozhodnutie majiteľa]** – úvod o 25 % mäkší): úvod z `rohozka-m-1086` s FIRST_Q
   (124 712 B) namiesto 438 359 B (`film.py:46`). Odložiť do V2, kde sa úvod mení tak či tak (rohožka na šírku 1448 =
   1,40 MP).
8. **V6a** (pripojené): `<li hidden data-vernost-footer>` + `obnovPaticku()` – pozri V6.

**Merateľné kritérium:**
- Chromium (`tma.py`, filmový pás 3 s, 390×844 aj 430×932, DPR 3, CPU 4×, Fast aj Slow 4G): **0 snímok > 90 % tmy po FCP**
  a žiadna plocha s jasom < 20 väčšia než lišta + spodné tlačidlo (okrem pätičky) v scenároch: prvá návšteva, znovunačítanie
  pri `scrollY` 3 000 px, `/#tim`, `/#kontakt`, skok z menu na Galériu pri Slow 4G, návrat späť (SKEPTIK V1).
- Chromium emulácia telefónu: všetkých 9 `currentSrc` končí `.webp` (`new Image(currentSrc).naturalWidth`, oprava
  skeptika); predčítanie = 1 požiadavka na `rohozka-m-*.webp`, 0 na `.avif` (sieťový denník); počítač 1440×900:
  `currentSrc` `.avif` a snímka zhodná s HEAD.
- Chromium výkon: p95 úlohy snímky ≤ 16,7 ms CPU 4× (dnes 14,5), zahodené snímky ≤ 4/180, bajty prvej obrazovky
  ≤ 1 200 kB (dnes 1 050 + WebP), `will-change` v pokoji na lite = 0 (computed style).
- iPhone (fotky majiteľa, tie isté 5 scenárov ako V0 + panel): **0 fotiek s čiernou plochou**; panel: `chyby zdrojov:
  žiadne`, `will-change 0`, `fixed ≤ 5`, `decode` WebP < AVIF z V0.
- HTML: `vaha.mjs` +≤ 4 kB gzip (LQIP); `karty-shot` 1440×900 = HEAD.

**Riziko: nízke.** Bajty +30 % do V2 (na Slow 4G o ≈ 0,7 s dlhší náhľad úvodu – ale rozmazaný, nie čierny). LQIP
24×43 zväčšený na 430×932 je hrubý; to je zámer (blur-up), nie chyba. V1f mení pohyb (fotka stojí) – návrat vo V3.

**Čaká na majiteľa:** nič (okrem V1g, ktorý ide do V2). Poslať mu náhľad V1 s prekrytím a požiadať o tie isté snímky.

---

### V2 – Celá fotka so svetlejším okolím, text pod fotkou (variant B, teplé okolie)

**Cieľ:** 100 % scény namiesto 30,8 % (`FAKTY.md:32`), 1,40 MP namiesto 3,73 MP na kartu, bajty fotiek −64 %
(991 kB, `POROTA.md`), ostrejšie na pixel (3,37 px/CSS na 430 vs 2,76), a zároveň jediná trvalá odpoveď na P1/P2
(menšia bitmapa = menej zahadzovania). Návrh v `pohyb.md` časť 3; prototyp existuje (`$L/fotky-ako-pc/proto`, v náhľade
prepínač „Fotky 2“).

**[rozhodnutie majiteľa] pred stavbou** (SKEPTIK S2 a V8, `pohyb.md` R7): mení rozsah z MASTER_BRIEF:88 a
TOUR_DIRECTION.md:57 („záber cez celé okno, text na ňom“). Ukázať na iPhone vedľa seba: dnes (1), B 3:2 s teplým okolím (2),
B 1:1 (3, `stvorec/B11-prehlad.jpg`). Spolu s tým R1 (spoločný rám 3:2 aj pre rohožku 16:10, orez 3,1 %), R2 (na šírku
`-2172` vs `-2896`), R3 (3:2 vs 1:1), R8 (úvod rohožka ako na počítači namiesto foto-40). Odporúčanie: B 3:2, jeden rám,
rohožka ako na PC.

**Súbory a kroky (po súhlase):**
1. `index.html`: telefónny `<source>` na šírkové `-1448` (`sizes` 100vw), **nie** `-m-1448`; `--nahlad` pre každú kartu na
   šírku (`lqip.json` kľúče `*-1086.webp`, 24×15 px, 146–230 B; pohyb.md odporúča 48×32 ≈ 1 kB – vyrobiť v `stills.py`,
   ak 24×15 dáva viditeľné „kosoštvorce“ na snímke z iPhonu).
2. `style.css` (len `@media (max-width: 720px) and (orientation: portrait)` + `html.lite`, náčrt `pohyb.md` časť 12):
   fotka `100vw × 100vw/1.5`, `top: calc(var(--nav-h) + 8px)` pre všetkých 9 kariet, `object-fit: cover` len pre rohožku;
   okolie = `--nahlad` cover na celom `.film-still` (nikdy plochá farba); tón `::before` ≤ 0,38 len pod lištou, 0,22–0,30 pod
   textom + `rgba(224,96,28,.05)` (lampa); `::after` bez dnešných 0,72/0,5 (`style.css:1215–1217`); elipsa
   `.title-card::before` ≤ 0,25 (`:1206`); `.title-frame { align-content: start; padding-top: lišta + 8 + 66,7vw + 24 px }`
   (16 px pri výške ≤ 700 px); pri 375×667 skryť výzvu „Prejdi si podnik“ a `--hero-size` 12 vw (kolízia ≈ 17 px,
   `pohyb.md` 3.2). Na šírku (932×430) cover cez celé okno ako na PC.
3. `app.js`: bez zmeny logiky okolia (5b); `prepStill` dáva `nacitana`.
4. Texty kariet sa nemenia (K5 poroty); `innerText` všetkých `.title-card` = HEAD.

**Merateľné kritérium (`pohyb.md` 8.3):**
- Chromium 390×844 a 430×932: rám 3:2 ± 0,5 %, `left 0`, `right innerWidth`, `top = nav-h + 8`; medzera text − fotka
  ≥ 16 px (≥ 0 pri 375), text − spodná zóna ≥ 8 px (S5); všetkých 9 `currentSrc` končí `-1448.webp` (po V1b) resp.
  `-1448.avif` na PC; bajty fotiek celej stránky ≤ 1,1 MB; p95 ≤ 16,7 ms CPU 4×; raster pri skrole ≤ 48 ms (prototyp B
  47,9); 0 pravidiel `filter:` v lite (`grep`).
- Vzhľad: 0 snímok > 90 % tmy; žiadna plocha s jasom < 20 väčšia než lišta + tlačidlo; **kontrast** `paper` pod
  `.title-sub` ≥ 4,5:1 a pod `.title` ≥ 3:1 na snímke každej karty (430×932, 375×667) – kde nevyjde, spodný gradient
  najviac 0,42.
- iPhone (fotky): každá karta celá fotka, okolie rozmazaná tá istá scéna, nikdy plochá farba; žiadne „kosoštvorce“
  v okolí pri lampách (inak 48×32).
- Počítač 1440×900 a 700×900 s myšou: pixelovo zhodné s HEAD.

**Riziko: stredné** – mení kompozíciu (scéna v mierke 0,29 oproti 0,93, fotka ≈ 71×48 mm na iPhone, S3). Preto
súhlas pred stavbou a V3 „dosadnutie“ 1,04 → 1,00 ako náhrada za priblíženie. Kontrast na svetlých miestach (okno pri
vstupe, obklady recepcie) môže klesnúť pod 4,5:1 – rieši gradient ≤ 0,42.

**Čaká na majiteľa:** R7 (rozloženie), R1, R2, R3, R8 – pozrieť 3 varianty v náhľade na iPhone a povedať. Nestojí nič.
Bez odpovede sa V2 nestavia; V3 sa dá postaviť aj na dnešnom rozložení (bez dosadnutia).

---

### V3 – Filmové prechody bez WebGL (skrol rozhoduje, čas hrá)

**Cieľ:** strih má vlastný čas: skrol prepne stav raz (hysteréza), CSS zahrá 700 ms na skladači; 0 zápisov do DOM na
snímku skrolu v lite (dnes až 9: `--so`, `--o`, `--sp`, `app.js:198–204`, `338–341`); choreografia z `pohyb.md` časť 5:
7 prelínaní s dosadnutím 1,04 → 1,00, 2 stierky transformovou maskou (úvod → Poď ďalej, sud → vstup), 3 teplé záblesky
(úvod, Sála ráno, Káva), slová nadpisu +220 ms po štarte strihu; paralaxa cez `animation-timeline: view()` len ak V0
potvrdí podporu, inak až keď rAF p95 na iPhone ≤ 12 ms. Letterboxové pásy **nie** (sú čierne polia; R4 len ak ich
majiteľ výslovne chce, vtedy ink-3, 4 %).

**Súbory:**
- `app.js` (lite vetva v `zabery()`, `app.js:270–343`): `is-on` s prahmi 0,44/0,56 voľnej dĺžky (±0,06 nad `want`,
  `app.js:284`), prepnúť len ak `stillReady` (dekódované); `--so`/`--o` sa v lite nepíšu; skok z menu a obnovená poloha
  nastavia stav bez prechodu (`snapNow`, `app.js:144`). Náčrt: `pohyb.md` časť 12.
- `style.css` (len `html.lite`): `.film-still` opacity 0 → 1 700 ms (odchádzajúca s oneskorením 150 ms), `img`
  `scale(1.04) → 1` 1 200 ms `cubic-bezier(.2,.7,.2,1)` okolo `--fx/--fy` + posun 1,5 % podľa `data-mv`
  (`index.html:169, 225, 249, 274, 298, 493, 655, 773, 797`); okolie `scale(1 → 1.08)` 14 s; stierka = obal
  `overflow:hidden rotate(-8deg) translateX(100% → 0)` + obsah opačne (`clip-path` len ak V0 ukáže akceleráciu);
  záblesk `.lamp-leak` 1 prvok, opacity 0 → .9 → 0, bez `mix-blend-mode`; `.kw` odstup 70 ms; `prefers-reduced-motion`
  a `data-motion="off"` = výmena bez prechodu (`style.css:410–412`, `1347–1350`). Žiadna nová `position: fixed` vrstva –
  všetko deti dnešného `.film-still` (`style.css:1137`).

**Merateľné kritérium:**
- Chromium CPU 4×: p95 úlohy snímky ≤ 16,7 ms, **LoAF > 50 ms počas skrolu = 0 v 3 behoch** (dnes 21 – predikcia, nie
  fakt), zahodené ≤ 4/180, `will-change` v pokoji 0 a počas strihu ≤ 9 (stopa `LayerTreeHost`), raster počas strihu 0
  (fotka dekódovaná pred `is-on`), počet zápisov `style.setProperty` na snímku skrolu v lite = 0 (obaliť `setVar`
  v meracom skripte).
- iPhone (panel V0): rAF p95 ≤ 17 ms pri pomalom ťahu aj švihu (≤ 9 ms, ak je 120 Hz), **0 rozstupov > 34 ms**, 0 „viditeľná
  pred dekódovaním“; majiteľ natočí 10 s skrolu telefónom (prekrytie pohyb nezmeria) a povie, či je to „filmové“ –
  to je jediné kritérium, ktoré nie je číslo, a je rozhodujúce.
- Vzhľad: najhoršia snímka ≤ 9 vrstiev v pohybe (tabuľka `pohyb.md` 4.8); v pokoji je fotka vždy celá (scale 1,00);
  0 snímok > 90 % tmy; počítač = HEAD.

**Riziko: stredné.** Predpoklady P5–P8 (`pohyb.md` 13) – ak Safari neakceleruje `clip-path`, ostáva transformová maska;
ak rAF ide 120 Hz, kritérium sa sprísni. Ak V2 neprejde, dosadnutie 1,04 → 1 na fotke cez celé okno oreže 2 % – vtedy len
prelínanie + záblesk + slová (bez dosadnutia a stierky), stále bez zápisov na snímku.

**Čaká na majiteľa:** výsledok V0 (čísla), R4 (letterbox – odporúčame nie), a jeho slovo „je to filmové“ na náhľade V3.

---

### V4 – Telefón bez videí (statické zábery); videá späť len pri 60 fps a ostré

**Cieľ:** splniť, čo majiteľ žiada: žiadne video na telefóne, kým nie je skutočných 60 fps a ostré. Dnešné videá to
nesplnia nikdy: zdroj 576×1024, 30 fps, 60 fps je dopočítaných interpoláciou a obraz zväčšený lanczosom (`videa.sh:10–17`
cez `diagnoza.md` P9) – detaily nepribúdajú.

**Súbory:**
- `app.js:902` `slucky()` → v lite vráti `[]` (slučka Tím sa nevytvorí, −3,4 MB, žiadny `play()`); `app.js:811–818`,
  `822–835` okno „Tím v akcii“ v lite bez `play()`; `style.css`: `html.lite .film-loop { display: none }`, `.video-window`
  v lite = plagát z `data-poster` ako `<img>`/pozadie (V1d) bez `<video>` (alebo pás videa na telefóne skryť – vzhľad,
  **[rozhodnutie majiteľa]** medzi „plagát“ a „skryť“; odporúčame plagát, lebo pás má text).
- Karta 5 (Sála ráno, `index.html:298`) = fotka `sala-rano` s dosadnutím a zábleskom (V3). HTML `data-video` ostáva pre
  počítač (film.js), index.html sa nemení.

**Ako zmerať „60 fps a ostré“ pre budúci záber (kritérium pre R6, nič nevymýšľame):**
- zdroj: `ffprobe -show_streams` → `r_frame_rate` ≥ 60/1 **natívne** (nie z `minterpolate`), rozlíšenie ≥ 1080×1920,
  bez zväčšovania v `videa.sh`; dĺžka 10–12 s, statív; export H.264/HEVC ≤ 6 MB (`pohyb.md` R6);
- ostrosť: rozptyl Laplaciánu (OpenCV/PIL) snímky videa ≥ 70 % hodnoty tej istej scény na fotke `-1448` **[predpoklad
  prahu, nastaviť podľa prvej vzorky]**; porovnanie 1:1 výrezu na snímke z iPhonu (majiteľ);
- zariadenie (panel V0): `getVideoPlaybackQuality()` `droppedVideoFrames/totalVideoFrames` ≤ 1 %, `readyState ≥ 3` pred
  `play()`, `buffered.end − currentTime` ≥ 2 s, 0 udalostí `waiting/stalled` v 10 s; prehrávanie len v zobrazenej karte,
  `preload="none"`, `poster` z LQIP.

**Merateľné kritérium:** Chromium emulácia telefónu: 0 požiadaviek na `assets/video/*.mp4|.webm`, bajty celej stránky
−4,6 MB (6,40 → ≤ 1,8 MB spolu s V2 **[výpočet]**), 0 `<video>` v DOM v lite; karta Tím ukazuje fotku; počítač: slučka
a video bez zmeny (`?film=on` test). iPhone: fotka karty Tím bez tmavého obdĺžnika; panel `videá: žiadne`.

**Riziko: nízke** (kód), **stredné** (obsah: majiteľ stráca pohyb v Tíme – sám to žiada).

**Čaká na majiteľa:** R6 – nový záber tímu na iPhone (60 fps, 9:16, statív, 10–12 s). Stojí jeho čas, nie peniaze. Bez
neho video na telefóne nebude; počítač bez zmeny.

---

### V5 – Virtuálna recepcia (etapa 1 bez servera a modelu; etapa 2 = rozhodnutie majiteľa)

**Cieľ:** „stránka komunikuje s návštevníkom“ hneď, zadarmo a bez odosielania dát: panel „Recepcia / Spýtaj sa“,
porozumenie otázke (normalizácia NFD, kmene, Damerau-Levenshtein ≤ 1, Dice), 30 odpovedí **len vetami zo stránky** so
zdrojom riadok:súbor (`asistent.md` časť 5), pole „nevieme“ s 19 témami (časť 6), rýchle voľby (Rezervovať, Hodiny,
Cenník, Kde nás nájdete, Zavolať), odovzdanie na telefón/e-mail/rezerváciu, 7 jazykov.

**Súbory:** `assets/recepcia.js` (≈ 3,8 kB gzip), `assets/recepcia.css` (≈ 1,5 kB), `assets/recepcia/{sk,en,uk,hu,sr,pl,
de,cs}.json` (≈ 4,5 kB gzip každý), `source/tools/recepcia-test.mjs`; `app.js` nová časť „7d“ (≈ 25 riadkov: tlačidlo vo
`vPokoji`, `app.js:436`; `import()` po ťuknutí ako `recenzie.js`, `app.js:579–585`); `style.css` `.recepcia-btn` (≈ 12
riadkov pri `style.css:1224`); jediný nový kľúč v `assets/i18n/*.json` = `aria-label` tlačidla. **HTML 0 B** – index.html je
už dnes 16 548 B gzip nad rozpočtom 14 600 B (`asistent.md` úvod). Panel = natívny `<dialog data-no-i18n>` (vzor
`vernost.js:68`), bez `backdrop-filter`.

**Umiestnenie [rozhodnutie majiteľa R1 asistenta, odporúčanie]:** telefón vľavo dole 46 px (vpravo je zhluk Zavolať +
Rezervovať, `style.css:1224–1233`), počítač vpravo dole 56 px; objaví sa až vo voľnej chvíli po načítaní (CLS 0).

**Merateľné kritérium (`asistent.md` časť 8):** `vaha.mjs` 0 B v HTML, `app.js + style.css` +≤ 0,5 kB gzip; modul pri
prvom ťuknutí ≤ 10 kB gzip (≤ 12 kB pri jazyku ≠ sk); `recepcia-test.mjs` ≥ 90 % správnych `id`, **0 falošných odpovedí
na témy „nevieme“** (napr. „platba kartou“ nesmie trafiť „Vernostnú kartičku“), fallback ≤ 15 %, zhoda < 5 ms; každý `zdroj`
existuje v strome (test porovná riadok a text); `i18n-test.mjs` bez nepreloženého textu v 7 jazykoch; Lighthouse mobil CLS 0,
LCP ± 50 ms; Chromium p95 bez zmeny. iPhone (fotky majiteľa): tlačidlo nič nezakrýva a nič ho nezakrýva (zhluk vpravo,
prúžok jazyka), list sa otvorí bez skoku, pri otvorenej klávesnici vidno vstup aj poslednú odpoveď, zatvorenie vráti
polohu skrolu; VoiceOver prečíta „Spýtaj sa recepcie, tlačidlo“.

**Etapa 2 [rozhodnutie majiteľa]:** model Claude cez Cloudflare Worker proxy (kľúč len na serveri, odpovede len zo
znalostnej bázy so štruktúrovaným výstupom, kontrola cien a zdrojov, limity 20/h a 60/deň na IP, denný strop, Turnstile,
tichý návrat na etapu 1). Odhad pri 1 000 otázok mesačne bez vyrovnávacej pamäte: ~0,7 USD (Haiku 5.5), ~13,5 USD
(Sonnet 5.5), ~27 USD (Opus 5.5) – cenník z referencie `claude-api` k 2026-10-06, pred rozhodnutím overiť. Vyžaduje: účet
Anthropic + platobnú kartu + mesačný strop, účet Cloudflare, poddoménu `api.` (kto spravuje DNS, nevieme –
`OTAZKY-PRE-MAJITELA.md:29`), DPA, odsek v `pravne.html`, a **súhlas s uvedením, že odpovedá automat** (AI Act čl. 50; ruší
pravidlo „Nespomínať AI“, `OTAZKY-PRE-MAJITELA.md:105`). Riziká modelu (vymyslené ceny, sľuby, rady k zdraviu, prompt
injection) etapa 1 nemá (`asistent.md` časť 7).

**Riziko: nízke** (etapa 1 nič neposiela, nič neukladá; chyba porozumenia = fallback na recepciu). Obsahové riziko: stará
odpoveď po zmene cien → `overene/platnost` + test.

**Čaká na majiteľa:** R2 (odpovede na 19 tém „nevieme“ – OTAZKY č. 1–8, 11–18, trvania, dámske strihy), R7 (kto preberá
odovzdané otázky na `info@`), R1 (názov a miesto tlačidla – ukážka na iPhone). Etapa 2: R3–R6 (súhlas, účty, model,
právne texty).

---

### V6 – Zákaznícka (vernostná) karta: čo hneď, čo čaká na majiteľa

**Stav:** systém existuje celý (prihláška `assets/vernost.js` = kópia `vernost/web/prihlaska.js`, 8 jazykov; server PHP
8.1 + SQLite `vernost/api/index.php`; kartička s QR `vernost/karta/`; admin; zásady; `ftp.yml`/`pages.yml`; testy), ale na
Barbershope je vypnutý: bez `data-zapnute` (`vernost.js:42–43`, `index.html:914`) prihláška mlčí (`vernost.js:164`), a
odkaz „Vernostná kartička“ v pätičke (`index.html:879`) posiela zákazníka na `www.headspa30.sk` – živá chyba D6a-0
(`OTAZKY-PRE-MAJITELA.md:36–40`). Kartička „len v prehliadači bez servera“ sa **neodporúča** – bola by bez bodov a odmien,
ďalší nepravdivý sľub (`vernost.md` 4.1).

**Hneď bez majiteľa (V6a–V6e, `vernost.md` časť 9 V0–V7):**
- **V6a** skryť chybný odkaz: `<li hidden data-vernost-footer>` + `obnovPaticku()` – zmenu robiť **najprv** v
  `vernost/web/prihlaska.js` a kopírovať (inak padá `vernost/testy/e2e.mjs:25`); +7 B HTML, +0,6 kB JS. Pripojiť k V1.
- **V6b** CI: `tools/vernost-priprav.py` + test, `pages.yml:51` – prihlášku zapne až keď `api/?a=stav` vráti `ok`,
  `databaza`, `sqlite`, `admin.barbershop === true` (`api/index.php:60–64`); bez toho by samotné heslo zaplo prihlášku aj
  bez servera a zákazník by dostal chybu (`vernost.js:133`).
- **V6c** sekcia „Vernostná kartička“ s tlačidlom **Vytvoriť kartičku** (`<a class="btn btn-ghost" data-vernost-karta>`,
  skript ju už obsluhuje `vernost.js:171–177`) v páse kontaktu `#rezervacia` (`index.html:819–849`), `hidden
  data-vernost-sekcia` do zapnutia servera; texty bez čísel bodov a bez odmien (`vernost.md` časť 7), preklady do 7
  slovníkov (+≈ 0,4 kB gzip HTML).
- **V6d** skúšobný režim **len v náhľade**: atribút `data-skuska` pridáva len skladač náhľadu, `fetch` sa v skúške nikdy
  nevolá (náhrada `{ok:true}` po 600 ms), `v30.karta.*` sa nezapisuje, štítok „SKÚŠKA“ + veta „nič sme neodoslali“, statická
  ukážka kartičky; 2 testy (index.html v strome bez `data-skuska`; stub `fetch` zhodí test pri zavolaní).
- **V6e** návrhy textov (sekcia v 8 jazykoch, zásady so sídlom FACEPALM, s.r.o. v Mojmírovciach – adresa z ORSR bez siete
  neoverená **[predpoklad]**, `pravne.html` s úložiskom `v30.*`) → majiteľovi na schválenie.

**Merateľné kritérium:** `e2e.mjs:25` (kópia zhodná) prechádza; `sh vernost/testy/spusti.sh` zelené (až keď druhý tím
skončí meranie – potrebuje lokálny server); test „bez `data-skuska` v strome“ a „`fetch` sa v skúške nevolá“ zelené;
`vaha.mjs` HTML +≤ 0,5 kB gzip; `i18n-test.mjs` 7 jazykov; Chromium: 0 požiadaviek na `headspa30.sk` z Barbershopu
v náhľade; p95 bez zmeny (`vernost.js` je `defer`, 10 kB, nič pri skrole – `rozbor-vaha.md:76`). iPhone (fotky): celý
skúšobný tok sekcia → okno → „Kartička je pripravená“ → ukážka kartičky, v 8 jazykoch, bez odoslania.

**Čaká na majiteľa (reťaz M1–M4, `vernost.md` časť 3 a 8) [rozhodnutie majiteľa]:**
1. hosting servera `vernost/` – navrhnutý webhosting HEAD SPA 30 (`headspa30.sk`, Forpsi): adresa kartičky zákazníka
   Barbershopu bude na doméne `headspa30.sk` a údaje FACEPALM, s.r.o. ležia na hostingu inej prevádzky (zmluvný vzťah –
   právnik); alebo hosting s PHP pre `barbershop30.sk` (otázka 21);
2. prístup FTP ako tajomstvá v GitHube (`FTP_SERVER/USER/PASSWORD/DIR/DOMENA`, `ftp.yml:4–9`) – ručný ZIP nestačí, lebo
   `config.php` s odtlačkami hesiel tvorí až nasadenie;
3. heslo do adminu `VERNOST_HESLO_BARBERSHOP` ≥ 10 znakov (`tools/vernost-config.php:7–10`) a kto ho na recepcii dostane;
4. odmeny a body (predvolene 1 bod, žiadna odmena – `README.md:26–28`): aspoň jedna odmena s cenou v bodoch, inak
   prihláška sľubuje „vymeň za zľavu alebo produkt“ (`vernost.js:20`) bez krytia;
5. voliteľne schránka `VERNOST_EMAIL_OD` (inak sa odkazy e-mailom neposielajú, `jadro.php:252–254`);
6. schválenie právnych textov a kontakt pre otázky k údajom (otázka 22);
7. vzhľad: okno a kartička sú tmavé v značke (`vernost.js:59`, `#141210`) – pri požiadavke „žiadne čierne polia“ ponúkame
   svetlý (paper) variant, 6 premenných CSS, ale mení vzhľad značky.
Po M1–M3 ďalšie nasadenie Pages doplní `data-zapnute` samo (V6b) a sekcia, pätička aj prihláška pred rezerváciou ožijú.

**Riziko: nízke** (kód), **vysoké** (právne/organizačné: doména, správca údajov, odmeny). Bez M1–M4 zákazník kartu
nevytvorí – to musí majiteľ vedieť vopred; náhľad so skúškou je práve na to.

---

## 3. Rozhodnutia majiteľa (zhrnutie; nič z toho sa nerobí bez jeho slova)

| # | Rozhodnutie | Dávka | Odporúčanie | Stojí |
|---|---|---|---|---|
| A | 5 snímok + text z prekrytia v aplikácii aj v Safari | V0 | urobiť ako prvé | čas |
| B | Rozloženie „celá fotka 3:2, text pod ňou“ namiesto „fotka cez celé okno“ (R7), rám 3:2 aj pre rohožku (R1), 3:2 vs 1:1 (R3), úvod = rohožka ako PC (R8), na šírku -2172/-2896 (R2) | V2 | B 3:2, jeden rám, rohožka ako PC, -2896 len ak decode ≤ 40 ms | nič |
| C | Priblíženie zo skrolu vypnúť (V1f) a nahradiť dosadnutím 1,04 → 1 | V1/V3 | áno | nič |
| D | Letterboxové pásy pri stierke (R4) | V3 | nie (sú čierne polia) | nič |
| E | Videá na telefóne vypnúť; pás „Tím v akcii“ plagát vs. skryť; nový záber 60 fps (R6) | V4 | vypnúť, plagát; natočiť nový záber | čas majiteľa |
| F | Prvý obraz mäkší (1086 s FIRST_Q) – odpadá, ak prejde V2 | V1g | odložiť do V2 | nič |
| G | Recepcia: názov a miesto tlačidla; odpovede na 19 tém „nevieme“; kto preberá otázky | V5 e1 | podľa návrhu | nič |
| H | Etapa 2 s modelom Claude: súhlas s označením „odpovedá automat“, účet Anthropic + karta + strop, Cloudflare + DNS, výber modelu, DPA, `pravne.html` | V5 e2 | až po týždni prevádzky etapy 1 | ~0,7–27 USD/mes. pri 1 000 otázok |
| I | Kartička: hosting (headspa30.sk vs. vlastný), FTP tajomstvá, heslo adminu, odmeny a body, e-mail, právne texty, svetlý vzhľad | V6 | hosting HEAD SPA (ak právnik súhlasí), 1 bod + 1 odmena na štart | hosting už existuje; právnik |

---

## 4. Predpoklady, ktoré musí potvrdiť V0 (a čo tento plán netvrdí)

- P1 AVIF sa na iPhone dekóduje softvérovo na hlavnom vlákne; P2 WebP 2–4× lacnejšie; P3 WKWebView v aplikácii má nižší
  strop pamäte než Safari a zahadzuje bitmapy; P4 náhľad môže byť rámec; P5 rAF v Safari 60 Hz aj na ProMotion;
  P6 `animation-timeline: view()` v Safari majiteľa; P7 `clip-path` na skladači; P8 Safari bez LoAF API.
- Všetky „ms“ a „MB“ v pláne sú z Chromia (`meranie-1.md`), výpočet z rozmerov, alebo odhad veľkosti súborov; nič nebolo
  spustené v prehliadači pri písaní plánu.
- O podniku sa netvrdí nič nové; ceny Anthropic a Cloudflare sú z referencie k 2026-10-06 a treba ich overiť pred
  rozhodnutím H; adresa sídla FACEPALM, s.r.o. je neoverená bez siete.
- LoAF = 0 vo V3 je predikcia (bez zápisov na snímku by mali zmiznúť), nie fakt.

## 5. Čo bude majiteľ vidieť po každej dávke (náhľad)

| Dávka | Náhľad obsahuje | Čo má majiteľ urobiť |
|---|---|---|
| V0 | f624ee8 + prekrytie `?diag=1`, dve podoby (AVIF + videá / WebP bez videí), všetky súbory | 5 snímok + Kopírovať, v aplikácii aj v Safari |
| V1 (+V6a) | LQIP pod každou fotkou, WebP, plagáty z náhľadov, bez priblíženia, prekrytie | tie isté snímky; povedať, či ešte videl čiernu |
| V4 | bez videí, Tím = fotka | povedať, či chýba pohyb v Tíme |
| V2 (po B) | celá fotka 3:2 s teplým okolím, text pod ňou; prepínač 1/2/3 | vybrať; ukázať na iPhone, nie v Chromiu |
| V3 | strihy s vlastným časom, dosadnutie, 2 stierky, 3 záblesky, prekrytie | 10 s video skrolu + „je to filmové?“ |
| V6b–e | sekcia Vernostná kartička + skúšobný tok „SKÚŠKA“ | prejsť tok; odpovedať na M1–M4 |
| V5 | tlačidlo Recepcia vľavo dole, panel, 30 odpovedí v 7 jazykoch | spýtať sa 5 otázok; povedať, čo chýba |
