# Pohyb v2: filmové prechody na telefóne bez WebGL, celá fotka, žiadne čierne polia

Art director pohybu a inžinier výkonu, 21. 10. 2026. Len čítanie: strom `hs-lahky/barbershop-30` (HEAD **f624ee8**,
vetva `barbershop-lahky-telefon`) a dokumenty v `lahky-telefon/`. Žiadny prehliadač, žiadny server, žiadne meranie – všetky
čísla sú buď z existujúcich meraní (zdroj pri každom), alebo výpočet z rozmerov (označené „výpočet“), alebo predpoklad
(označené „predpoklad“). Cesty: `$SP` = `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad`,
`$T` = `$SP/hs-lahky/barbershop-30`, `$L` = `$SP/barber/lahky-telefon`.

Spätná väzba majiteľa (21. 10. ~15:45, iPhone 430×932, náhľad = artefakt claude.ai s f624ee8): čierne obrazovky, horšia
plynulosť, prechody nie sú filmové, žiadne čierne polia, celé fotky, videá len pri 60–120 fps a ostré (inak nie),
AI agent a zákaznícka karta (tie dve sú mimo tohto dokumentu, časť 11).

---

## 0. Verdikt v skratke

1. **Rozloženie „celá fotka“ = variant B poroty, ale s teplým, svetlým okolím a s jedným spoločným rámom pre všetkých
   9 kariet** (fotka 3 : 2 na celú šírku, vždy na tom istom mieste pod lištou, text pod ňou). Rám, ktorý sa nehýbe, je
   to, čo robí z výmeny fotiek *strih* a nie *skrolovanie webu*. Čísla: časť 3.
2. **Prechody prestanú byť „pripnuté na prst“ a dostanú vlastný čas.** Dnes krytie fotky aj textu píše skrol v každej
   snímke (`--so`, `--o`, `$T/assets/app.js:198–204, 340`). Film má strih, ktorý „sa vždy dokončí na bližší záber“
   (`$T/docs/TOUR_DIRECTION.md:27–29`). Návrh: skrol **rozhodne** (prah s hysterézou), CSS **zahrá** prechod
   700 ms na skladači (compositor). Hlavné vlákno pri skrole potom nepíše nič okrem zriedkavej zmeny triedy. Na iPhone
   s ProMotion (120 Hz) to je jediná cesta k viac než 60 fps: `requestAnimationFrame` v Safari ide pri 60 Hz,
   animácie transform/opacity na skladači môžu ísť 120 Hz (predpoklad P5, časť 8 ho overí).
3. **Žiadne čierne pole nikdy:** pod každou fotkou je od prvého vykreslenia jej vlastný náhľad priamo v HTML (ako dnes
   len pri úvode, `$T/index.html:174–177`, 468 B). Náhľad zväčšený cez celé okno **je** rozmazané okolie – plátno
   z prototypu B (`foto-proto.js`, `paintBg`) už netreba, a okolie existuje skôr, než sa čokoľvek stiahne. Odchádzajú
   aj tmavé plochy v CSS: `--ink-2` pod zálohou (`$T/assets/style.css:463`), spodný prechod 0,72 (`:1215–1217`),
   elipsa 0,66 za textom (`:1206`), stmavenie 52 % zapečené v plátne prototypu (`foto-proto.js`, `fillStyle`).
   Čitateľnosť textu drží `--halo` (`:1006`) a meranie kontrastu (3.6).
4. **Videá na telefóne vypnúť** (slučka Tím 864×1536 je zväčšená z 576 px, `$L/rozbor-vaha.md`, videa.sh; majiteľ: rozmazané,
   sekajú). Vrátiť až s novým záberom 60 fps – rozhodnutie majiteľa (časť 7).
5. **Prvý krok plánu je diagnostika na zariadení** (časť 8): bez čísel z iPhonu sú všetky naše merania len Chromium
   so SwiftShader (`$L/stavba/meranie-1.md`, časť 1).

Kritériá: snímka p95 ≤ 16,7 ms CPU 4× v Chromiu (ako dnes 14,5 ms, `meranie-1.md`, tabuľka) **a** potvrdenie na iPhone
cez prekrytie, ktoré majiteľ odfotí (časť 8).

---

## 1. Čo majiteľ vidí a odkiaľ to v kóde pochádza

### 1.1 „Čierne obrazovky“ – kandidáti (každý má riadok)

| # | kandidát | kde | čo s tým (tento návrh) |
|---|---|---|---|
| Č1 | pod každou zálohou je plná farba `--ink-2`, kým fotka nie je dekódovaná | `$T/assets/style.css:463` (`.film-still { background: var(--ink-2) }`) | náhľad fotky z HTML pod každou kartou (3.4), nie farba |
| Č2 | spodný prechod na telefóne ide až do 0,72 inku, horný 0,5 | `$T/assets/style.css:1215–1217` | v „celej fotke“ sa fotka netónuje; okolie dostane len jemný teplý prechod ≤ 0,35 (3.5) |
| Č3 | elipsa za textom 0,66 inku cez 34 % nad a 22 % pod blokom | `$T/assets/style.css:1206` | text už neleží na fotke; elipsa ≤ 0,25 alebo preč, čitateľnosť rieši `--halo` (`:1006`) a meranie (3.6) |
| Č4 | prototyp B má `html.lite.foto-b .film-still { background: var(--ink) }` a plátno stmavené 52 % | `$L/fotky-ako-pc/proto/barbershop-30/assets/foto-proto.css` (posledný riadok bloku B), `foto-proto.js` `fillStyle 'rgba(14,13,12,.52)'` | nepreberať; okolie z náhľadu, tón ≤ 0,2 |
| Č5 | na Slow 4G karty dlho stoja na cudzej fotke (úvod) alebo na náhľade | `$L/stavba/kontrola-vzhlad-2.md`, súhrn bod (2) | náhľad každej karty = jej vlastná scéna, nie cudzia; dobeh ostrej fotky je „zaostrenie“ (4.7) |
| Č6 | náhľad claude.ai má inú latenciu než GitHub Pages | predpoklad (zadanie) | diagnostika zapíše `transferSize`/čas každej fotky; porovnanie s GitHub Pages až po nasadení |
| Č7 | AVIF sa na iPhone dekóduje softvérovo na hlavnom vlákne (3,73 MP výrez `-m-1448` = 14,9 MB RGBA) | predpoklad P1 v `$L/rozbor-vaha.md:103–105` | B berie `-1448` na šírku = 1,40 MP (`$L/fotky-ako-pc/PROTOTYPY.md`, tabuľka Cena), 2,7× menej; diagnostika zmeria `decode()` |

Majiteľova snímka čierneho štartu (`$L/majitel-iphone-cierny-start.png`) bola z verzie s prológom (D1); vo f624ee8 je
prvá snímka náhľad úvodu s nadpisom (`kontrola-vzhlad-2.md`, nález 2 opravený). Čo videl 21. 10. ~15:45, nevieme bez
diagnostiky – preto časť 8.

### 1.2 „Zhoršila sa plynulosť“ – kandidáti

- Každá snímka skrolu píše až 3× `--so` a `--o` a `--sp` na zálohy v okolí a rámy kariet (`app.js:338–341, 203`), čo je
  prepočet štýlu troch pevných vrstiev cez celé okno (1290×2796 fyz. px každá, `style.css:1136–1139`). V Chromiu p95 14,5 ms
  pri CPU 4× (`meranie-1.md`), teda tesne pod 16,7 ms – na iPhone s dekódovaním AVIF v tom istom vlákne (Č7) to môže
  preliezť. Predpoklad, meria časť 8.
- Slučka Tím (video 864×1536, 3,4 MB) sa od f624ee8 sťahuje po zastavení pri zábere (`$T/index.html:299`,
  `app.js` časť 11); dekódovanie videa je na iPhone hardvérové (SPEC L6), ale zväčšené 576 → 864 je mäkké (majiteľ).
- Lerp je na dotyku vypnutý (`app.js:358–360`), takže karty idú s prstom; to je správne, ale práve preto prechod
  „nemá vlastný čas“ – pri pomalom ťahu sa fotka prelína centimeter po centimetri, čo nevyzerá ako strih, ale ako
  posuvník. To je, myslím, jadro výčitky „nie sú cinematické“.

---

## 2. Zásady pohybu pre iPhone bez WebGL

1. **Len `transform`, `opacity` (a `clip-path` len tam, kde to diagnostika potvrdí ako akcelerované, inak transformová
   maska – 4.3).** Žiadny `filter`/`backdrop-filter` v ničom, čo sa hýbe (`$T/docs/ART_DIRECTION.md:72–73, 143`;
   plátno B s CSS blur: 112 rastrových úloh / 598 ms, 16 zahodených snímok, `PROTOTYPY.md`, tabuľka CPU 4×).
2. **Skrol rozhoduje, čas hrá.** Stav karty (ktorá je „na obraze“) určuje skrol s hysterézou (prah vstupu 0,5 voľnej
   dĺžky − 0,06, prah výstupu + 0,06 – výpočet nad dnešným `want`, `app.js:284`). Samotný prechod je CSS `transition`
   alebo `animation` 500–900 ms na skladači. Skok z menu a obnovená poloha nastavia stav bez prechodu (ART_DIRECTION
   §8, `:145`; dnes `snapUntil`, `app.js:144`).
3. **Najviac 2 zábery naraz viditeľné** (odchádzajúci a prichádzajúci), 3 v DOM bez `display: none` (ako dnes,
   `app.js` 5b). Nikdy dvojexpozícia celého obrazu dlhšie než prechod (`TOUR_DIRECTION.md:26`).
4. **Žiadna `position: fixed` vrstva navyše.** Dnešné pevné `.film-still` (`style.css:1137`) ostáva jediným pevným
   prvkom záberu; okolie, fotka, svetelný záblesk aj maska sú jeho deti (absolútne), takže pri skrole sa nič nové
   nepripína. Lišta a spodné tlačidlo sú pevné už dnes.
5. **Vlastnú vrstvu (`will-change`) dostane len prvok, ktorý sa práve hýbe** – najviac: 2 zábery × (fotka + okolie)
   + 1 záblesk + slová nadpisu počas 0,7 s. Dnešné `will-change: transform` na `.is-near img` (`style.css:475`) v lite
   zrušiť (fotka v B nemá priblíženie zo skrolu).
6. **Rozmer vrstiev:** fotka 3 : 2 na šírku 430 má 430 × 287 CSS = 1290 × 861 fyz. px = 1,1 MP (4,4 MB RGBA); okolie je
   náhľad 32 px zväčšený na okno – vrstva okna 1290 × 2796 = 3,6 MP (14,4 MB), ale len 1 taká na záber, 2 pri prechode.
   Výpočet. Rozpočet grafickej pamäte na prechod: ≈ 2 × (14,4 + 4,4) + záblesk 4,4 ≈ 42 MB. Pre porovnanie film D1
   držal 140–155 MB (odhad, `rozbor-film.md` cez SPEC časť 0).
7. **`prefers-reduced-motion`:** stav sa mení bez prechodu (dnes 1 ms, `style.css:410–412`), fotky stoja v konečnej
   polohe, slová nadpisu sú hneď viditeľné (`:1347–1350`), skrol bez `smooth` (`:76–78`). Nič z návrhu nepridáva
   výnimku.

---

## 3. Rozloženie „celá fotka“ (variant B, teplé okolie)

### 3.1 Pomer, poloha, text

- **Fotka:** celá šírka okna, pomer súboru (`-1448` je 1448 × 965, 3 : 2; rohožka 1448 × 905, 16 : 10 –
  `$T/assets/img/film/film.json`, tiers). Výška `100vw / --pa`. Odporúčam **jeden rám 3 : 2 pre všetkých 9 kariet**
  a rohožku v ňom `object-fit: cover` (odreže 3,1 % výšky hore a dole, výpočet 1 − 1,5/1,6) – rozhodnutie majiteľa
  R1, lebo porota K2 žiada pomer rámika = pomer súboru. Dôvod: ak má úvod iný rám než ostatné, pri prvom strihu rám
  poskočí o 4 vw (16 px pri 390) a strih prestane byť strihom.
- **Poloha:** `top: calc(var(--nav-h) + 8px)` pre všetky karty (`--nav-h` 60 px pri ≤ 640 px, `style.css:56`), nie
  stredovanie v páse ako v prototype (`foto-proto.css`, `top: max(...)`), ktoré by tiež dávalo rôzne polohy podľa pomeru.
- **Text:** pod fotkou, odsadený 24 px (16 px pri výške okna ≤ 700 px), zarovnanie `left|right|center` podľa
  `data-card` ostáva (`style.css:1046–1047`), `align-content: start` namiesto `end` (`:1202`) a namiesto stredu pri
  `center` (`:1213`). Znenie textov sa nemení (porota K5).
- **Spodok:** spodné tlačidlo (46 px + odsadenie, `style.css:1225–1230`) a pri úvode „Prejdi si podnik“
  (`:1214`) ostávajú.

### 3.2 Čísla pre štyri okná (výpočet z `--nav-h`, pomeru 3 : 2 a výšok textov z `$L/fotky-ako-pc/POROTA.md`, `porota/vysky.mjs`)

| okno | lišta | fotka: vrch / výška / spodok | text od | najvyšší text (rohožka 277 / vstup 260 / kreslo-stred 188 pri 390) → spodok | spodná zóna (tlačidlo alebo výzva) | rezerva |
|---|---|---|---|---|---|---|
| 375 × 667 | 60 | 68 / 250 / 318 | 334 (medzera 16) | úvod ≈ 334 + 277 = **611**; vstup ≈ 594; sala-rano (dlhší text, ≈ 239) ≈ 573 | „Prejdi si podnik“ ≈ 594–640 (`$L/fotky-ako-pc/SKEPTIK.md` S5); tlačidlo ≈ 605–651 | **úvod koliduje s výzvou o ≈ 17 px** → pri `max-height: 700px` výzvu skryť (spodná lišta vedie ďalej, ako `style.css:625` pre telefón) a `--hero-size` 12 vw; potom rezerva ≈ 20 px |
| 390 × 844 | 60 | 68 / 260 / 328 | 352 | úvod 629, vstup 612 | tlačidlo ≈ 782–828 | ≥ 150 px |
| 430 × 932 | 60 | 68 / 287 / 355 | 379 | úvod ≈ 660 (text pri 430 o niečo nižší, POROTA: rozdiely 20–30 px) | tlačidlo ≈ 870–916 | ≥ 200 px |
| 932 × 430 (na šírku) | 64 | fotka `cover` cez celé okno ako na počítači (POROTA krok 3), 69 % scény (`$L/fotky-ako-pc/SKEPTIK.md` S7) | text na fotke, `align-content: center` | – | – | súbor `-2172` (2,33 px/CSS) alebo `-2896` pri `sizes` 100 vw (3,11) – rozhodnutie R2 |

Všetky výšky textov sú z merania poroty pri 390 (`porota/vysky.mjs`); pri 375 a 430 sú odhad ± 30 px. Kritérium K2
poroty (medzera text − fotka ≥ 16 px pri 390/430, ≥ 0 pri 375) ostáva, doplnené o S5 skeptika (text − spodná zóna ≥ 8 px).

### 3.3 Čo z toho vidno (z `$L/fotky-ako-pc/FAKTY.md`, `PROTOTYPY.md`)

- 100 % scény naraz (dnes 30,8 %, Pracovné miesto 17,3 %), 3,37 px/CSS na 430 (dnes 2,76), bajty fotiek 0,99 MB
  (dnes 2,75 MB), 1,40 MP na kartu (dnes 3,73).
- Cena: scéna je v mierke 0,29 oproti 0,93 dnes; fotka má na iPhone ≈ 71 × 48 mm, 13,5° (`fotky-ako-pc/SKEPTIK.md` S3).
  Preto priblíženie „dosadnutím“ 1,04 → 1,00 (4.1) a nie trvalé 1 → 1,06: v pokoji je fotka vždy celá.
- Ak majiteľ povie „malé“: variant 1 : 1 (štvorec, 66,7 % scény, fotka 46 % okna, `$L/fotky-ako-pc/stvorec/B11-prehlad.jpg`)
  je pripravený v tom istom ráme (len `--pa: 1` a `object-fit: cover` okolo `--fxn`); choreografia nižšie platí bez
  zmeny. Rozhodnutie R3.

### 3.4 Okolie: náhľad z HTML namiesto plátna

- Dnes má náhľad len úvod: `--nahlad: url(data:image/webp;base64,…)` 24 × 43 px, 468 B (`$T/index.html:174–177`) a CSS
  ho dáva pod fotku úvodu (`style.css:1147–1150`). Návrh: **každá z 9 titulných kariet dostane náhľad fotky na šírku
  48 × 32 px WebP** (≈ 0,9–1,2 kB, odhad podľa 468 B pri 24 × 43; spolu ≈ 10 kB v HTML), vyrobí ho `stills.py` z toho
  istého originálu.
- Okolie = ten náhľad ako `background-image` celého `.film-still` v režime `cover` okolo `--fxn/--fyn`. Prehliadač ho
  zväčší bilineárne (27× na 1290 fyz. px) – to je presne to, čo robilo plátno 36 px v prototype (`foto-proto.js`,
  `paintBg`, 36 × 78 → okno), len bez JS, bez `ctx.filter` (SKEPTIK S6: staršie iOS ho nemajú) a **dostupné v prvej
  snímke**. Riziko „kosoštvorcov“ pri jasných lampách je rovnaké ako pri plátne – overí snímka z iPhonu (časť 8).
  Ak by boli viditeľné, 64 × 43 px (≈ 2 kB) ich zjemní.
- Dôsledok pre „čierne okno“: ktorákoľvek karta má od prvého vykreslenia svoju scénu (rozmazanú) a nikdy plochú
  farbu – aj pri skoku z menu, aj na Slow 4G (Č1, Č5). Pravidlo „ostrá fotka sa ukáže len celá dekódovaná“
  (`app.js` 5b, `prepStill`) ostáva pre pás fotky.

### 3.5 Tón okolia: svetlejšie a teplejšie, nie „čierne pole“

Interiér na fotkách je sám tmavý a teplý (dub, oranžové lampy, `ART_DIRECTION.md` §1). Rozmazané okolie bude preto
prirodzene tmavohnedé – bez stmavenia 52 %. Návrh tónu (jedna vrstva `::before` s gradientom, statická, bez animácie):

```
linear-gradient(to bottom,
  rgba(14,13,12,.38) 0, rgba(14,13,12,0) calc(var(--nav-h) + 24px),   /* len pod lištou, aby lišta nesplývala */
  rgba(14,13,12,0) calc(var(--nav-h) + 8px + 66.7vw),                  /* fotka: nič */
  rgba(23,20,18,.22) calc(var(--nav-h) + 8px + 66.7vw + 32px), rgba(23,20,18,.30) 100%)  /* text: ľahké šero */
+ rgba(224,96,28,.05) cez celé okolie (teplý nádych lampy, --lamp)
```

Hranice: nikde nad 0,38, nikde čistý `--ink`, fotka sa netónuje (rovnaká zásada ako komentár pri `style.css:482`).
Výsledok vyzerá ako Instagram Stories pri fotke na šírku: scéna pokračuje rozmazane za rámom (časť 9).

### 3.6 Čitateľnosť textu na svetlejšom okolí (kritérium, nie dojem)

- `--paper` na rozmazanom tmavom interiéri: odhad jasu okolia 25–45 (0–255) pri väčšine záberov; `paper` 241/233/221 →
  kontrast ≈ 8–12 : 1 (výpočet WCAG pre jas 30–45; predpoklad o jase, meria sa). Pri svetlých miestach (okno pri
  vstupe, biele obklady recepcie) môže klesnúť pod 4,5 : 1.
- Kritérium: na snímke každej karty (430 × 932 a 375 × 667) priemerný kontrast `paper` proti pozadiu pod
  `.title-sub` ≥ 4,5 : 1 a pod `.title` ≥ 3 : 1 (veľký text). Kde to nevyjde, zvýšiť spodnú časť gradientu z 0,30
  najviac na 0,42 – stále prechod cez fotku, nie pole. `--halo` (`style.css:1006`) ostáva na kickeri a riadku.
- Elipsa `.title-card::before` (`:1206`) v lite: `opacity` ≤ 0,25, alebo preč, ak meranie prejde bez nej.

---

## 4. Slovník prvkov: mechanizmus, cena, spúšťač, obmedzený pohyb

Zoznam je zoradený od „vždy“ po „voliteľné po diagnostike“. Spúšťač „stav“ = trieda zo skrolu (časť 2 bod 2),
„čas“ = CSS po zmene stavu. Cena = vrstvy skladača počas pohybu + prekresľovanie (raster) hlavného vlákna.

### 4.1 Prelínanie záberov + dosadnutie 1,04 → 1,00 (náhrada Ken Burns)

- **Mechanizmus:** `.film-still` prichádzajúcej karty `opacity 0 → 1` za 700 ms `var(--ease-in-out)`; v tej istej
  chvíli jej `img` (pás fotky) `transform: scale(1.04) → scale(1)` za 1 200 ms `cubic-bezier(.2,.7,.2,1)` s
  `transform-origin: var(--fx) var(--fy)` (bod záujmu). Odchádzajúca karta stojí a len zmizne (opacity → 0, 700 ms,
  začína až po 150 ms, aby sa pod novou nikdy neotvoril ink). Okolie (náhľad) prichádza s kartou (je to to isté
  `.film-still`), a samo pomaly pláva: `scale(1 → 1.08)` za 14 s `linear`, `animation-play-state: paused` mimo
  `is-on` – rozmazané okolie znesie orez, ostrá fotka nie (3.3).
- **Prečo 1,04 → 1,00 a nie 1 → 1,06:** majiteľ chce celú fotku; dosadnutie končí na 1,00 = celá. Dojem pohybu kamery
  ostáva v prvej sekunde, kde ho oko hľadá (strih). Pre karty s `data-mv="rise|down|left"` (`index.html:169, 249, 298,
  655, 773`) sa dosadnutie skombinuje s posunom 1,5 % správnym smerom (`translate(0, 1.5%)` → 0), pre `in|near`
  (`:225, 274, 493, 797`) len mierka. Rovnaký jazyk ako film (`data-mv`), bez WebGL.
- **Cena:** 2 vrstvy v pohybe (fotka prichádzajúcej, `.film-still` prichádzajúcej), 1 vrstva odchádzajúcej; raster 0
  (fotka je dekódovaná pred `is-shown`, `app.js prepStill`). Zmena `is-on` je jediný zápis do DOM za strih.
- **Spúšťač:** stav (skrol prejde prah s hysterézou); čas hrá.
- **Obmedzený pohyb:** opacity bez času (1 ms, `style.css:410`), `transform: none` (`:476` pre `data-motion=off`).

### 4.2 Paralaxa fotka vs. text (dva posuny zo skrolu) – stupeň 2, po diagnostike

- **Mechanizmus A (bez JS, ak Safari podporuje):** `@supports (animation-timeline: view())` → `img` pásu
  `translateY(8px → −8px)` a `.title-card` `translateY(0 → −14px)` cez `animation-timeline: view()` na kotve karty.
  Beží mimo hlavného vlákna. Safari má scroll-driven animácie od verzie 26 (`PROTOTYPY.md`, časť „Prečo časový
  prejazd“ – tvrdenie poroty, predpoklad P6; overí `CSS.supports` v diagnostike).
- **Mechanizmus B (záloha):** `--py` písané v slučke skrolu len na 2 prvky aktuálnej karty (ako dnes `--sp`,
  `app.js:338`), amplitúda ≤ 14 px (ART_DIRECTION §8: paralaxa ≤ 6 %, `:140–141`; TOUR_DIRECTION „doska pláva
  ±14 px“, `:117–118`).
- **Cena:** A: 2 vrstvy, 0 hlavného vlákna. B: 2 zápisy premenných na snímku skrolu (dnes 3 × 3) – menej než dnes,
  ale nie nula; preto až po diagnostike (ak p95 na iPhone ≤ 12 ms, zapnúť).
- **Spúšťač:** skrol (jediný prvok, ktorý je zo skrolu).
- **Obmedzený pohyb:** vypnuté (`animation: none`, `--py` sa nepíše – `motionOff` v `app.js`).

### 4.3 Odhalenie šikmým strihom (filmová stierka) – pre dva prahové strihy

- **Mechanizmus (len transformy, istý vo všetkých prehliadačoch):** prichádzajúci záber má vnútorný obal `.foto-ram`
  (absolútny, `inset: -20%`, `overflow: hidden`, `rotate(-8deg)`); obal ide `translateX(100%) → 0` za 760 ms
  `cubic-bezier(.7,0,.2,1)`, jeho obsah (okolie + fotka) presne opačne `translateX(-100%) → 0` v rovnakom čase.
  Obraz tak stojí na mieste a cez neho prejde šikmá hrana. Na hrane je `::after` obalu: pás 10 px
  `linear-gradient(90deg, rgba(224,96,28,.35), transparent)` – svetlo lampy na stierke, bez vlastnej animácie
  (ide s obalom). Variant s `clip-path: polygon()` je kratší v kóde, ale či ho WebKit a Chromium animujú na skladači,
  si nie som istý (predpoklad P7); diagnostika ho skúsi, inak ostáva transformová maska.
- **Kde:** úvod → Poď ďalej (prechod dverami dnu; `data-mv="in"`, `index.html:225`) a sud → vstup (von na ulicu,
  `:797`). Ostatné strihy sú prelínanie (4.1) – striedanie rytmu, nie efekt všade (ART_DIRECTION §8: keď sa hýbe
  obraz výrazne, text stojí → slová nadpisu nastúpia až po stierke).
- **Cena:** 2 vrstvy v pohybe (obal, obsah) + rotácia zväčší rastrovanú plochu o ≈ 1,2× (výpočet: obal 140 % × 140 %
  okna pri −8°); raster 0 (náhľad aj fotka hotové). Len 2× na stránku.
- **Spúšťač:** stav; čas hrá.
- **Obmedzený pohyb:** bez stierky, obyčajná výmena.

### 4.4 Letterboxové pásy pri vstupe do sekcie – neodporúčam na telefóne

- Pásy sú z definície čierne polia (majiteľ: „žiadne čierne polia“; prológové pásy 8–9 % v `TOUR_DIRECTION.md:113`
  boli súčasťou toho, čo videl ako čiernu obrazovku). V rozložení 3.1 je navyše „letterbox“ už samotný rám: fotka
  3 : 2 so svetlým okolím.
- Ak by ich majiteľ predsa chcel (rozhodnutie R4): dva absolútne pruhy v `.film-still`, `background: var(--ink-3)`
  (#221D19, nie ink), výška 4 % okna, `transform: scaleY(0 → 1 → 0)` z okrajov, 600 ms, len pri 4.3. Cena 2 vrstvy,
  raster 0. Obmedzený pohyb: nič.

### 4.5 Kinetické nadpisy po slovách – existuje, doladiť čas

- **Mechanizmus:** dnes `.kw` s `translateY(min(.3em, 24px))` + `opacity`, 0,6 s / 0,35 s, odstup 60 ms
  (`style.css:1344–1346`, slová vyrába `app.js:953–960`). Návrh: nástup začína 220 ms po štarte strihu (po tom, čo sa
  obraz usadí, ART_DIRECTION §8 „keď sa hýbe kamera, text stojí“), odstup 70 ms, krivka `cubic-bezier(.2,.7,.2,1)`
  (`ART_DIRECTION.md:143`); kicker 0 ms, riadok +380 ms, tlačidlá +520 ms (ako choreografia úvodu, `style.css:1097–1099`).
  Pri odchode karty slová len zmiznú (opacity 250 ms), bez posunu.
- **Cena:** 2–4 vrstvy (slová) na 0,7 s; raster 0 (text už rastrovaný – transition na transform/opacity netvorí nový
  raster, predpoklad bežného správania WebKitu; overí sa v stope Chromia).
- **Spúšťač:** stav (`is-on`); čas hrá.
- **Obmedzený pohyb:** hneď viditeľné (`style.css:1347–1350`).

### 4.6 Teplý „light leak“ len cez opacity

- **Mechanizmus:** jeden absolútny prvok `.lamp-leak` v `.film-still`, prekrýva len pás fotky (nie celé okno),
  `background: radial-gradient(60% 80% at var(--fx) 0%, rgba(240,126,60,.38), rgba(224,96,28,.12) 45%, transparent 70%)`
  (`--lamp-2`, `--lamp`), `opacity 0 → .9 → 0` za 1 400 ms `ease-out` + `translateX(-6% → 4%)`, spustené pri `is-on`
  (`animation` s `both`, bez opakovania). Žiadny `mix-blend-mode` (drahé, netestované na iPhone).
- **Kde:** úvod (prvý obraz, po dosadnutí nadpisu), Sála ráno (`data-shot="sala-rano"`, `index.html:298` – ranné
  svetlo), Káva (`:655`, podnos v slnku, FAKTY časť 2). Nie na každej karte: trikrát na stránku je prízvuk, deväťkrát
  šum.
- **Cena:** 1 vrstva 430 × 287 CSS (1,1 MP fyz.), raster raz pri vzniku; počas prechodu beží súčasne s 4.1 → 3 vrstvy.
- **Spúšťač:** stav; čas hrá.
- **Obmedzený pohyb:** nič (`animation: none`).

### 4.7 Rozmazané okolie → ostrá fotka („zaostrenie“)

- **Mechanizmus:** okolie je náhľad (3.4) a pod pásom fotky je od začiatku tiež (ten istý náhľad, cover). Ostrý
  `img` pásu má `opacity: 0` a po `load` + `decode()` (dnes `nacitana`, `style.css:1149–1150`; `prepStill`,
  `app.js:251–268`) prejde na 1 za 500 ms. Na rýchlej sieti sa to deje pred strihom (fotka sa sťahuje v okolí ±1,
  `app.js` 5b), takže majiteľ zaostrenie vôbec neuvidí; na pomalej sieti vidí scénu rozmazanú a potom ostrú – ako
  zaostrenie objektívu, nie čiernu plochu ani polovičnú fotku.
- **Pravidlo „fotka sa nikdy neukáže neúplná“** (SPEC L3): pás fotky ukazuje buď ostrú celú fotku, alebo svoj náhľad
  (rozmazanú celú scénu) – nikdy napoly stiahnutý súbor. Či je krátky rozmazaný stav prijateľný, je rozhodnutie R5;
  alternatíva je dnešný `is-hold` (posledná ostrá fotka drží, `style.css:1171`), ktorý však pri skoku z menu ukazuje
  cudziu scénu (kontrola-vzhlad-2, nález 1).
- **Cena:** 1 vrstva (img) na 0,5 s; raster 0 (dekódované pred zobrazením).
- **Spúšťač:** udalosť (dekódovanie), nie skrol ani stav.
- **Obmedzený pohyb:** výmena bez prelínania.

### 4.8 Súhrn ceny prvkov

| prvok | vrstvy v pohybe | raster hl. vlákna | zápisy do DOM na snímku skrolu | spúšťač | reduced-motion |
|---|---|---|---|---|---|
| 4.1 prelínanie + dosadnutie | 3 | 0 | 0 (1 trieda za strih) | stav → čas | okamžite |
| 4.2 paralaxa | 2 | 0 | A: 0, B: 2 | skrol | vypnuté |
| 4.3 stierka (2× na stránku) | 2 | 0 | 0 | stav → čas | vypnuté |
| 4.4 letterbox (neodporúčam) | 2 | 0 | 0 | stav → čas | vypnuté |
| 4.5 slová nadpisu | 2–4 | 0 | 0 | stav → čas | okamžite |
| 4.6 light leak (3× na stránku) | 1 | 1× pri vzniku | 0 | stav → čas | vypnuté |
| 4.7 zaostrenie | 1 | 0 | 0 | dekódovanie | okamžite |
| **spolu v najhoršej snímke** (strih so stierkou + slová + záblesk) | **≤ 9** | 0 | 0 | | |
| dnes (f624ee8) pri skrole | 3 pevné zálohy s `will-change` + rám karty | 0 | až 9 (`--so`, `--o`, `--sp` × 3) | skrol | – |

---

## 5. Choreografia 9 titulných kariet

Rám (3.1) je spoločný; mení sa len obsah rámu, text a jeden prízvuk. Poradie a `data-mv` z `$T/index.html`.

| # | karta (`data-shot`, `data-card`, `data-mv`) | obraz pri príchode | prechod z predchádzajúcej | text | prízvuk |
|---|---|---|---|---|---|
| 1 | rohozka, center, rise (`:169`) | prvý obraz: náhľad + ostrá rohožka (zaostrenie 4.7 len na pomalej sieti); dosadnutie 1,04→1 s posunom nahor 1,5 % | – (štart stránky) | ako dnes `dosadnutie` (`style.css:1103–1104`): nadpis po vetách, riadok, tlačidlá | light leak od lámp hore (4.6), 1,4 s po nadpise |
| 2 | sala, left, in (`:225`) | dosadnutie mierkou | **stierka** 4.3 zľava (vchádzame dverami) | slová „Poď ďalej.“ až po stierke (+220 ms) | – |
| 3 | stol, left, rise (`:249`) | dosadnutie + posun nahor | prelínanie 700 ms | slová | – |
| 4 | cakaren, right, in (`:274`) | dosadnutie | prelínanie | slová zarovnané vpravo | – |
| 5 | sala-rano, left, left (`:298`, `title-long`, dnes slučka Tím) | **fotka namiesto videa** (časť 7); dosadnutie + posun doľava 1,5 % | prelínanie | slová | light leak z pravej strany (ranné svetlo) |
| 6 | kreslo-stred, center, near (`:493`, `title-long`, Služby) | dosadnutie len mierkou 1,02→1 (jemný nájazd ako `--z0 -0.005`, `style.css:514`) | prelínanie | slová do stredu | – |
| 7 | kava, left, down (`:655`, `title-long`, Galéria) | dosadnutie + posun nadol | prelínanie | slová | light leak zhora (slnko na podnose) |
| 8 | sud, right, down (`:773`) | dosadnutie + posun nadol | prelínanie | slová vpravo | – |
| 9 | vstup, center, in (`:797`, `title-long`, Rezervácia) | dosadnutie mierkou | **stierka** 4.3 sprava (vychádzame na ulicu) | slová do stredu, tlačidlá | – |

Rytmus: 7 prelínaní, 2 stierky, 3 záblesky. Dĺžka každého strihu 0,7 s (stierka 0,76 s) – menej než 30 % cesty medzi
kotvami pri bežnom tempe ťahu (TOUR_DIRECTION `:27`); pri švihu cez viac kariet naraz sa hrá len strih na konečnú kartu
(stav sa mení raz, `app.js` už dnes počíta `vis/base`, 5b).

Pásy za kartami (tím, cenník, galéria, kontakt) sa nemenia; zakryjú rám ako dnes (`title-long`, `style.css:1013–1018`).

---

## 6. Štart, skoky z menu, pätička

- **Štart:** prvá snímka = lišta + náhľad rohožky (okolie aj pás) + nadpis + tlačidlá (dnes splnené pre fotku úvodu,
  kontrola-vzhlad-2 nález 2); ostrá rohožka 1 288 ms po FCP pri 390 (ten istý zdroj). Kritérium ostáva: 0 snímok
  > 90 % tmy po FCP.
- **Skok z menu (`#sluzby`, `#kontakt`):** stav sa nastaví bez prechodu (dnes `snapNow`, `app.js:144`); cieľová karta
  má okamžite svoj náhľad (3.4), ostrá fotka dobehne zaostrením (4.7). Dnešné `is-hold` (posledná ostrá fotka pod
  všetkým, `style.css:1171`) ostáva ako poistka, ale pod ňou/nad ňou je vždy scéna cieľa, nie cudzia karta dlhšie než
  trvá sťahovanie. Kritérium POZIADAVKY bod 3: lišta a (aspoň náhľad) fotky viditeľné v ďalšej snímke po skoku.
- **Pätička:** bez zmeny (L1 hotové, `kontrola-vzhlad-2` bod 3).

---

## 7. Videá na telefóne

- Majiteľ: videá sekajú a sú rozmazané; nedávať, pokiaľ nebudú 60–120 fps. Dnešná slučka Tím je `tim-slucka-864.mp4`
  3 402 635 B, 864 × 1536 zväčšené z 576 px (`$T/assets/video/`, `rozbor-vaha.md`; videa.sh:10–13 cez SPEC L6).
  Zdrojové `source/video/video-*.mp4` majú natívne 576 × 1024 (`rozbor-vaha.md`, tabuľka návrhu „576 × 1024 natívne“).
  Snímkovú frekvenciu zdroja z dokumentov neviem – predpoklad: 25–30 fps (bežný telefón), nie 60.
- **Návrh:** v `lite` video vypnúť úplne (karta 5 = fotka `sala-rano`, 4.1 + záblesk). `html.lite .film-loop { display:
  none }` a `slucky()` (`app.js:901`) v lite nevolať – 0 B videa, 0 dekódovania.
- **Rozhodnutie majiteľa R6:** nový záber tímu natočený na iPhone pri 60 fps (4K alebo 1080p, 9 : 16, statický statív,
  10–12 s), export 1080 × 1920 H.264 ≤ 6 MB alebo HEVC; prehrávanie `<video muted playsinline loop preload="none"
  poster>` len v zobrazenej karte (SPEC L6). Bez nového záberu video na telefóne nebude. Stojí čas majiteľa, nie peniaze.
- Počítač: bez zmeny.

---

## 8. Diagnostika na zariadení (krok 1 plánu) a kritériá prijatia

### 8.1 Prekrytie `?ladenie=1` (nič bez parametra; majiteľ ho odfotí)

Malý panel vpravo hore (pod lištou), písmo 11 px, `paper` na `ink` 0,85 (jediné povolené tmavé pole, len pri ladení),
aktualizácia 2× za sekundu, obsah v jednom `<pre>`:

1. `UA` (skrátené), `innerWidth × innerHeight`, `screen.width × height`, `devicePixelRatio`, `hardwareConcurrency`,
   `deviceMemory` (Safari nemá – vypíše „–“), triedy `<html>`.
2. Podpora: AVIF (`new Image()` s 1-pixel AVIF data URI → `onload`/`onerror`), `CSS.supports('animation-timeline: view()')`
   (P6), `'filter' in CanvasRenderingContext2D.prototype` (pre porovnanie so S6), `matchMedia('(prefers-reduced-motion)')`,
   `(hover: none) and (pointer: coarse)`.
3. **rAF:** histogram rozstupov za posledných 5 s – p50, p95, max, počet rozstupov > 34 ms (= aspoň 1 zahodená snímka pri
   60 Hz) a > 9 ms (pri 120 Hz; P5: Safari drží rAF na 60 Hz aj na ProMotion – ak p50 ≈ 8,3 ms, predpoklad padá).
   Safari nemá `long-animation-frame` ani `PerformanceLongTaskTiming` – rAF rozstup je jediný dostupný ukazovateľ
   hlavného vlákna (predpoklad P8, podľa stavu WebKitu, ktorý poznám; ak API existuje, panel ho použije).
4. **Fotky:** pre každú z 9 kariet `currentSrc` (koniec názvu), `naturalWidth`, `complete`, čas `decode()` v ms
   (meria `prepStill` okolo `img.decode()`), či bola niekedy viditeľná s `opacity > 0` a `!__dec` (sonda „viditeľná
   pred dekódovaním“, pasívna – V5 skeptika).
5. **Sieť:** `performance.getEntriesByType('resource')` → súčet `transferSize` fotiek, čas prvej fotky úvodu
   (`responseEnd`), `navigation.type`.
6. **Tma:** nie je merateľná na zariadení bez snímky – majiteľ fotí obrazovku; panel preto zapíše aj čas od navigácie
   (`performance.now()`), aby sa fotka dala priradiť k stavu.
7. **Pamäť:** Safari neposkytuje (`performance.memory` je len Chromium) – namiesto toho panel loguje udalosť
   `pagehide`/obnovenie stránky (WKWebView zabije stránku pri nedostatku pamäte; opätovné načítanie s `navigation.type
   = 'reload'` bez zásahu majiteľa je nepriamy dôkaz).

Zápis: panel drží posledných 200 riadkov a tlačidlo „Kopírovať“ (clipboard), aby majiteľ mohol poslať text, nie len fotku.

### 8.2 Postup s majiteľom

1. Otvoriť náhľad s `?ladenie=1`, odfotiť panel po 3 s, po pomalom prejdení celej stránky a po skoku z menu na Kontakt.
2. Potom to isté bez panela, s pozorovaním: kde videl čierne pole (ktorá karta, pri akom pohybe).
3. Po nasadení na GitHub Pages zopakovať bod 1 (Č6).

### 8.3 Kritériá prijatia pre v2

- **Chromium (ako doteraz, `meraj.mjs` z `$L/stavba/meranie-1/nastroje`):** 390 × 844 a 430 × 932, DPR 3, CPU 4×,
  Fast 4G a Slow 4G; úloha snímky p95 ≤ 16,7 ms (dnes 14,5), LoAF > 50 ms počas skrolu = 0 v 3 behoch (dnes 21 –
  tu je najväčší rozdiel: bez zápisov v každej snímke by LoAF mali zmiznúť; to je predikcia, nie fakt), zahodené snímky
  ≤ 4 zo ~180, raster pri skrole ≤ 48 ms (B prototyp 47,9), 0 pravidiel `filter:` v lite (`grep`), vrstvy s `will-change`
  počas pokoja = 0, počas strihu ≤ 9 (stopa `cc`, `LayerTreeHost`).
- **iPhone (panel 8.1):** rAF p95 ≤ 17 ms pri pomalom ťahu aj švihu (ak P5 padne a rAF ide 120 Hz: ≤ 9 ms),
  rozstupy > 34 ms počas skrolu = 0, `decode()` každej fotky ≤ 40 ms (predpoklad hranice pre 1,40 MP AVIF; ak je
  vyššie, L4-cesta JPEG pre pás fotky podľa `rozbor-vaha.md` časť 8), „viditeľná pred dekódovaním“ = 0, žiadne
  nevyžiadané znovunačítanie.
- **Vzhľad (snímky z Chromia + fotky majiteľa):** 0 snímok > 90 % tmy po FCP; na žiadnej snímke plocha s jasom < 20
  väčšia než lišta + spodné tlačidlo (okrem pätičky); kontrast textu 3.6; pomer rámika = 3 : 2 ± 0,5 %, `left 0`,
  `right innerWidth`, `top = nav-h + 8`; medzery podľa 3.2; všetky 9 `currentSrc` končia `-1448.avif` (K1 poroty, mer.
  `new Image(currentSrc).naturalWidth`, nie `img.naturalWidth` – oprava skeptika bod 4).
- **Rovnaký vzhľad:** `innerText` všetkých `.title-card` zhodný s HEAD; počítač 1440 × 900 pixelovo zhodný s HEAD
  (K5 poroty); úzke okno s myšou 700 × 900 bez zmeny.
- **Potom pohľad majiteľa** na iPhone – a to pred stavbou (prototyp B existuje, `?foto=B`; teplé okolie a stierka sa
  dajú ukázať v tej istej kópii), nie po nej (SKEPTIK V8, fotky-ako-pc SKEPTIK S2).

---

## 9. Referencie z praxe (reálne techniky, nie vymyslené)

1. **Instagram Stories / Reels – fotka na šírku s rozmazaným okolím z tej istej fotky.** Fotka, ktorá nemá 9 : 16,
   sa ukáže celá v strede a zvyšok plochy vyplní jej rozmazaná kópia. Je to presne 3.4–3.5: scéna pokračuje za rámom,
   nie čierne pásy. Používa to aj YouTube pri videách na výšku v prehrávači na šírku.
2. **Medium – „blur-up“ (progresívne načítanie obrázkov, José M. Pérez, 2015):** drobný náhľad (~ 20–30 px) vložený
   priamo v HTML, zväčšený cez celý rámik, a ostrý obrázok sa cez neho prelinie po stiahnutí. To je 4.7 a dôvod, prečo
   náhľad nahrádza plátno. Rovnaký princíp má Facebook (náhľad ≈ 200 B v hlavičke JSON) a dnes každá galéria
   s LQIP/BlurHash.
3. **Apple.com produktové stránky (iPhone, AirPods):** pripnuté sekcie, v ktorých skrol **rozhoduje** o stave a prechod
   (prelínanie, dosadnutie mierkou, nástup textu) **hrá v čase** cez CSS transform/opacity; žiadne rozmazanie pri
   pohybe. To je časť 2 bod 2 – stav zo skrolu, čas z CSS.
4. **Ken Burns** (dokumentarista; „Ken Burns effect“ v Apple iPhoto/Apple TV šetriči): pomalý pohyb mierky a polohy po
   statickej fotke. Tu ho používame v tvare „dosadnutie“ 1,04 → 1,00 (4.1), aby v pokoji bola fotka celá.
5. **Odhalenie transformovou maskou (obal s `overflow: hidden` + obsah s opačným posunom)**: štandardná technika
   z dokumentácie GSAP (ScrollTrigger „reveal“) a z Awwwards stránok agentúr, lebo beží len na `transform` – 4.3.
6. **Zásada „len transform a opacity“ (web.dev, Paul Lewis, „Stick to compositor-only properties“)** – rámec celej
   časti 2; `filter`/`backdrop-filter` v pohybe sú práve tie vlastnosti, ktoré sa tam odporúča nepoužívať.

Body 1–3 sú požadované tri referencie; 4–6 dopĺňajú mechanizmy. Konkrétne verzie stránok som dnes neoveroval
(zadanie zakazuje prehliadač) – opisujem techniky, ktoré sú na týchto službách dlhodobo zavedené.

---

## 10. Rozhodnutia majiteľa (nič z toho sa nestavia bez jeho slova)

| # | rozhodnutie | možnosti | moje odporúčanie |
|---|---|---|---|
| R1 | spoločný rám 3 : 2 aj pre rohožku (orez 3,1 % výšky) | rám 3 : 2 pre všetky / rohožka 16 : 10 vo vlastnom ráme | 3 : 2 pre všetky (strih drží rám) |
| R2 | telefón na šírku: `-2172` (ľahšie) alebo `-2896` (ostrejšie 3,11 px/CSS) | | `-2896` len pri `(hover: none) and (max-height: 720px)`, ak diagnostika ukáže `decode()` ≤ 40 ms |
| R3 | veľkosť scény: 3 : 2 (100 % scény) alebo 1 : 1 (66,7 % scény, fotka 1,5× väčšia) | | najprv ukázať obe na iPhone (`stvorec/B11-prehlad.jpg`, `proto/snimky/B-430x932.jpg`) |
| R4 | letterboxové pásy pri stierke | áno (ink-3, 4 %) / nie | nie |
| R5 | krátke rozmazané zaostrenie na pomalej sieti vs. držanie poslednej ostrej (cudzej) fotky | | zaostrenie (vlastná scéna, nikdy cudzia) |
| R6 | video tímu na telefóne: nový záber 60 fps, alebo bez videa | | bez videa, kým nie je nový záber |
| R7 | súhlas s rozložením „celá fotka, text pod ňou“ namiesto „fotka cez celé okno, text na nej“ (mení MASTER_BRIEF:88, TOUR_DIRECTION:57) – výslovne, pred stavbou (SKEPTIK S2) | | ukázať prototyp B s teplým okolím vedľa dnešného stavu |
| R8 | výmena fotky úvodu na telefóne: dnes foto-40 (`TOUR_DIRECTION.md:62`), B dá rohožku zo `slider/3` ako počítač (FAKTY bod 4) | | rovnaká ako počítač (majiteľ: „rovnaký vzhľad“) |

---

## 11. Mimo tohto dokumentu (len označenie)

- **AI agent, ktorý odpovedá na otázky návštevníkov:** vyžaduje službu mimo GitHub Pages (kľúč API, server alebo
  hostovanú službu, náklady na každú odpoveď) a pravidlá, čo smie tvrdiť (len údaje z `index.html`, `docs/CONTENT_SOURCES.md`,
  Booqme odkazy `index.html:484, 644`). Rozhodnutie majiteľa, vrátane platby – samostatný dokument.
- **Zákaznícka karta:** účet zákazníka = ukladanie osobných údajov (GDPR, správca údajov je majiteľ), server alebo
  služba (Booqme už účty má – `booqme.app/sk/rezervacia/barbershop30`), overenie telefónom alebo e-mailom. Rozhodnutie
  majiteľa – samostatný dokument. Na statickom webe sa dá bez servera spraviť len „karta“ ako odkaz na Booqme účet
  alebo Apple Wallet/Google Wallet kartička s QR, čo tiež potrebuje vydavateľský účet.

---

## 12. Náčrt kódu (len na čítanie, nie zmena stromu)

```css
/* lite + výška: jeden rám pre všetkých 9 kariet */
@media (max-width: 720px) and (orientation: portrait) {
  html.lite .film-shot.is-title .film-still {
    background: var(--nahlad) var(--fx, 50%) var(--fy, 50%) / cover no-repeat var(--ink-3); /* okolie = náhľad, nikdy ink */
    opacity: 0; transition: opacity 700ms var(--ease-in-out) 150ms;
  }
  html.lite .film-shot.is-title.is-on .film-still { opacity: 1; transition-delay: 0ms; }
  html.lite .film-shot.is-title .film-still > img {
    position: absolute; left: 0; width: 100vw; height: calc(100vw / 1.5); top: calc(var(--nav-h) + 8px);
    max-width: none; object-fit: cover; object-position: var(--fx) var(--fy);
    transform: scale(1.04); transition: transform 1200ms cubic-bezier(.2,.7,.2,1), opacity 500ms var(--ease-in-out);
    will-change: auto; box-shadow: 0 18px 40px rgba(14,13,12,.35);
  }
  html.lite .film-shot.is-title.is-on .film-still > img.nacitana { transform: none; opacity: 1; }
  html.lite .film-shot.is-title .film-still::before { /* tón okolia, 3.5 */ }
  html.lite .film-shot.is-title .film-still::after { background: none; }   /* žiadne 0,72 */
  html.lite .title-frame { align-content: start; padding-top: calc(var(--nav-h) + 8px + 100vw / 1.5 + 24px); }
  html.lite .title-card::before { opacity: .25; }
}
@media (prefers-reduced-motion: reduce) {
  html.lite .film-shot.is-title .film-still > img { transform: none; }
}
```

```js
// app.js, len lite: stav s hysterézou namiesto --so/--o v každej snímke
const IN = 0.44, OUT = 0.56;                       // podiel voľnej dĺžky karty (nad dnešným want, app.js:284)
for (const s of titles) {
  const u = (y - s.top) / s.free;
  const on = s.on ? u > -OUT && u < 1 - IN + OUT : u > -IN && u < 1 - IN;   // hysteréza ±0,06 okolo prahu
  if (on !== s.on && stillReady(s)) { s.on = on; setClass(s.el, 'is-on', on); }   // 1 zápis za strih, nie 9 za snímku
}
```

Dekódovanie pred `is-on`, okolie ±1 a `display: none` mimo okolia ostávajú z 5b (`app.js:228–342`).

---

## 13. Čo tento dokument netvrdí

- Žiadne číslo z iPhonu. Všetky „ms“ sú z Chromia so SwiftShader (`meranie-1.md`, časť 1) alebo výpočet.
- Predpoklady, ktoré treba zmerať: P1 (AVIF na hlavnom vlákne), P5 (rAF 60 Hz na ProMotion), P6 (`animation-timeline`
  v Safari majiteľa), P7 (akcelerácia `clip-path`), P8 (chýbajúce LoAF API v Safari), jas okolia pre kontrast (3.6),
  výšky textov pri 375 a 430 (± 30 px), veľkosť náhľadu bez „kosoštvorcov“ (3.4).
- O podniku sa tu netvrdí nič nové; texty kariet, hodiny ani ceny sa nemenia.
