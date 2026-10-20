## Overenie auditu „kod-stranka“ (skeptický overovateľ)

**Prostredie:** pracovný strom `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/hs2` (vetva barbershop-plynulost). Repozitár som nemenil (`git status` je čistý). Server bežal na porte 8470 (8100 + 10×37), po meraní som ho zastavil. Telefón som emuloval rovnako ako audit: 390×844, DPR 3, dotyk, CPU 4×, Fast 4G (Slow 4G pri K15), headless Chromium so SwiftShader. Film na tomto stroji spadne do stavu `world world-frame world-off`, teda bežia zálohy, rovnako ako v audite.

Všetky výstupy sú v `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/barber/audit/overenie-kod-stranka/`. Pri štarte nebežal žiadny iný prehliadač. Merania som spúšťal postupne v dávkach `davka1.sh` až `davka4.sh`, nikdy dva prehliadače naraz. A/B behy sa striedali (základ, záplata, základ…).

**Metodika:** Každý nález som zopakoval vlastným meraním. Nástroje auditu som skopíroval a nasmeroval na svoj port. Napísal som aj vlastné testy, ktoré priamo vyvracajú alebo potvrdzujú tvrdenie, nielen opakujú auditovu metriku: `over-property`, `over-audio`, `over-intl`, `over-menu`, `over-galeria`, `over-dekod` (záznam zobrazených snímok cez `Page.startScreencast`) a nové pokusné záplaty `premenne2`, `scrollcache`, `menufix` a `nolock` v `zaplaty.mjs`. Každý citovaný riadok kódu (súbor:riadok) som skontroloval.

### Súhrn verdiktov

| Nález | Verdikt | Závažnosť |
|---|---|---|
| K01 | Potvrdený, efekt je ešte väčší. **Navrhovaná oprava je chybná:** stmaví úvod. Opravený návrh som overil. | vysoká |
| K02 | Potvrdený, efekt je ešte väčší (snímka 282–378 ms). | vysoká |
| K03 | Potvrdený. Výhrada: na skutočnom telefóne ťah skrolu možno nedá aktiváciu, cena však vznikne aj tak. | vysoká |
| K04 | Potvrdený priamo snímkami obrazovky. Oprava cez `decode()` overená. | vysoká |
| K05 | Potvrdený. | stredná |
| K06 | Potvrdený. | stredná |
| K07 | Potvrdený, 30–89 ms. | stredná |
| K09 | Potvrdený, snímky až 378 ms. Navrhovaná oprava by nestačila. | stredná |
| K13 | Potvrdený a podhodnotený: pri orezaní na šírku je pomer až 0,41×. Závažnosť **zvýšená**. | nízka → stredná |
| K08 | **Nadhodnotený:** INP je pod 200 ms a navrhnutá oprava INP podstatne nezlepší. Závažnosť **znížená**. | stredná → nízka |
| K11 | Cena potvrdená. Tvrdenie „až −30 ms v snímke“ nie je podložené. | nízka |
| K12 | Potvrdený, nekreslí sa však nič navyše. | nízka |
| K14 | Potvrdený. Prúžok výzvu neprekrýva, je tesne nad ňou. | nízka |
| K15 | Potvrdený. | nízka |
| K16 | Potvrdený. | nízka |
| **K10** | **VYVRÁTENÝ** | – |
| **K17** | **VYVRÁTENÝ** (efekt sa nedá zmerať) | – |

### Vyvrátené

**K10 (čítanie scrollY v rAF):** Pokusnú opravu z auditu (`scrollcache`: scrollY sa číta v listeneri scroll s capture a readTarget použije uloženú hodnotu) som zmeral A/B nad `premenne`, 2+2 behy, scenár stredne:

- štýl na snímku 1,69 → 1,72 ms,
- štýl spolu 4,62 → 4,74 s,
- p95 snímky 23,5 → 23,9 ms,
- hlavné vlákno 24,75 → 25,35 s.

Vynútený prepočet zmizol z readTarget (1607–1663×), ale presunul sa do listenera scroll (775–811×, asi 1,0 s). V čase udalosti scroll už je štýl zneplatnený. Práca sa len presúva, ušetrí sa 0 ms. Ani predpoklad „film.js to už rieši“ v tomto stave neplatí.

**K17 (rozmazanie slov .kw):** Jeden beh s invalidationTracking na každú variantu (`premenne,bezanim` vs `+bezkinfilter`), v 0,9 s po rozsvietení karty (34 rozsvietení, medián):

- najdlhšia snímka 28,4 vs 27,0 ms,
- snímky nad 16,7 ms: 1 vs 1,
- Layerize spolu 8,4 → 5,3 ms, rozložené na 7–9 snímok (asi 0,4 ms na snímku).

Žiadna metrika zadania sa nezmení. Audit sám uvádzal, že prínos je malý. Ako problém neobstál.

### Najdôležitejšia oprava návrhu (K01)

Navrhovaná registrácia `@property --o/--so { initial-value: 0; inherits: false }` rozbije úvod. Úvodná kotva má vždy atribút `data-pro`, preto pre ňu platí `style.css:998 opacity: var(--o, 1)` a `style.css:1101 opacity: var(--so, 1)`. Pri registrovanej vlastnosti sa záloha vo `var()` nepoužije.

Overenie (`over-property.mjs`, app.js zdržaný o 3 s, aby bolo vidieť stav pred jeho spustením):

| Variant | Úvod pred app.js | Bez JS |
|---|---|---|
| základ | opacity titulku 1, zálohy 1, priemerný jas 60,6 | titulky viditeľné |
| návrh auditu | titulok aj záloha 0, **100 % tmavých pixelov, jas 13,6** (čierna obrazovka) | všetky titulné karty majú opacity 0 |
| opravený návrh | rovnaké ako základ | rovnaké ako základ |

Opravený návrh (`premenne2`): `--o` a `--so` dostanú `initial-value: 1` a pridajú sa dve deklarácie `html.karty .film-shot.is-title:not([data-pro]) .title-frame { --o: 0 }` a `html.karty .film-shot.is-title:not([data-pro]) .film-still { --so: 0 }`. Inline zápis z app.js má prednosť.

- Pred app.js aj bez JS je stav rovnaký ako dnes.
- Zisk sa drží: štýl na snímku 1,88 ms (A/B 2 behy) oproti 3,84 ms v základe.

Snímka: `snimky/property-porovnanie.jpg`. Poradie zľava: základ, návrh auditu, opravený návrh, návrh auditu bez JS.

### Kľúčové čísla

- **K01**, A/B 3+3, stredne, základ → premenne:
  - štýl na snímku 3,84 → 1,61 ms (−58 %), p95 štýlu 19,4 → 5,6 ms,
  - p95 snímky 34,0 → 20,4 ms, snímky nad 16,7 ms 19,7 → 9,5 %,
  - rAF nad 33 ms 10,6 → 3,1 %,
  - dlhé úlohy 26 → 6, LoAF nad 50 ms 49 → 16,
  - štýl spolu 9,6 → 4,6 s; podiel štýlu na snímke 36,7 %.
  - Mikromeranie (ms na zápis): `--sp` na kotvu 2,37 vs na img 0,12; `--o` na kotvu 1,55 vs na `.title-frame` bez registrácie 0,57 vs priamo opacity 0,11; `--so` na kotvu 1,91 vs opacity na `.film-still` 0,17.
- **K02**, prvý dotyk, `hudba=off`, 2+2:
  - základ: LoAF 326–370 ms (blokovanie 251–306 ms), úloha 282–378 ms, z toho Layout 206–269 ms,
  - bez `@font-face`: najdlhšia úloha 67–95 ms, LoAF najviac 74–80 ms.
- **K03**: Po zvislom ťahu, vodorovnom švihu po páse aj po ťuknutí sa vytvorí AudioContext (stav running), `aria-pressed=true` a bežia 3 animácie ekvalizéra. Hudba sa začne sťahovať 187–1483 ms po geste.
  - Obsluha touchend trvá 47–86 ms, jej LoAF 70–137 ms.
  - Callback po `decodeAudioData` dá LoAF 57–130 ms.
  - Pozor: emulácia CDP pokladá aj ťah skrolu za aktiváciu (`userActivation.hasBeenActive=true`).
- **K04** (screencast):
  - Záloha karty Čakáreň (stiahnutá, is-near 4 s, potom skok): 2–4 snímky so 77–98 % tmavého okna počas 42–77 ms.
  - S `img.decode()` vopred: 0 takých snímok, prelínanie ide priamo do fotky (`snimky/dekod-A-porovnanie.jpg`).
  - Pás tímu, všetky portréty vopred stiahnuté: dnes 14–16 snímok so slepým portrétom 112–413 ms po švihu; s `decode()` 2–5 snímok do 245 ms.
- **K05** (2 behy):
  - Skok na Kontakt: 15 obrázkov, is-near pri 7–9 kotvách, is-shown pri 6–7, rAF p95 33–67 ms, 7–25 snímok nad 33 ms, LoAF 51–88 ms.
  - Späť hore: is-near aj is-shown pri 9 kotvách, LoAF do 93 ms.
- **K06**, kontakt, 2+2: vynútené rozloženie z `app.js:693` 146–149× (305–355 ms) a štýl 147–149× (202–245 ms). Skript tabule 774–840 → 149–223 ms. LoAF nad 50 ms 16–19 → 10–15. Preklopení je 152.
- **K07**: `new Intl.DateTimeFormat` s časovou zónou v stránke 30–89 ms, na prázdnej stránke 56–95 ms. Vyhodnotenie app.js dá LoAF 228–384 ms.
- **K08**: Obsluha kliknutia na menu trvá 49–97 ms, z toho 48–94 ms vynútený štýl a rozloženie.
  - INP v základe 112–176 ms (vždy pod 200 ms).
  - S opravou auditu 104–144 ms, rozdiel mediánu −24 ms je na úrovni šumu.
  - Snímky 115–176 ms po kliknutí ostávajú v oboch variantoch. Bez zamknutia stránky (nolock) sa nič nezlepší.
- **K09**: EN LoAF 196 + 378 ms a 63 + 267 ms; SK 114 + 216 ms a 92 + 240 ms; `collect()` 30 ms počas prvého dotyku.
- **K11**: 2,6–6,0 ms na jednu zmenu atribútu, 95 prvkov.
- **K12**: V pokoji 300 DrawFrame za 5 s pri Remesle aj pri kontakte. Bez lesku a ekvalizéra 0 pri Remesle; pri kontakte stále 300, lebo beží svetlo okraja.
- **K13**: Na 390@3 je súbor 640 px a fotka sa kreslí na 838 px (0,76×). Pri fotkách na šírku orezaných na 4:5 sa kreslí na 1571 px (0,41×). S navrhnutým 78vw: 1,29×, resp. 0,69×.
- **K14**: Prúžok 232×114 px, text na 4 riadky.
- **K15**: Nadpis skrytý 1,23–1,41 s po FCP pri Fast 4G a 2,04–2,16 s pri Slow 4G.
- **K16**: `backdrop-filter: blur(12px)` pred spustením app.js.

### Odporúčané poradie opráv a odhad dopadu

1. **K02:** Najväčšie jednorazové zaseknutie pri prvom dotyku (−200 až −280 ms).
2. **K01 v opravenej podobe:** Polovica času štýlu a polovica snímok nad 33 ms.
3. **K04 (`decode()` pred is-shown):** Odstráni tmavé prelínanie, na telefóne s pomalším dekódovaním ide o čierne okno.
4. **K03:** Na dotykovom zariadení nespúšťať hudbu automaticky. Odpadne LoAF 70–137 ms a 94–130 ms a 687 kB v prvých sekundách.
5. **K06, K05, K07, K09.**
6. **K13:** Ostrosť fotiek.
7. Zvyšok: K08, K11, K12, K14, K15 a K16.

**Výhrady:** Dekódovanie obrázkov beží na pracovných vláknach a tie emulácia CPU nespomaľuje, takže na skutočnom telefóne budú tmavé úseky z K04 dlhšie. Medzi dávkami sa výsledky líšili, napr. štýl s `premenne` 1,61 vs 1,69 ms. Preto porovnávam vždy striedavé A/B z tej istej dávky.