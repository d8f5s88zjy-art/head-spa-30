# Audit „čierne okná“ – BARBERSHOP 30 (vetva barbershop-plynulost, commit bcd487e)

## Zhrnutie
Čierne okná som našiel v 33 zo 42 nahrávok. Bez nich prešli len pomalý skrol, úvodný film, „Späť na ulicu“/„Vojdi dnu“ a samotné prepnutie jazyka. Za behom stránky sa v nahrávkach našlo 94 okien, spolu asi 139 s. Pod každým je jedna zo štyroch príčín v kóde:
1. **Film (plátno WebGL):** keď cieľový záber nemá textúru, film plátno vymaže na farbu stránky. Statické zálohy sú vtedy skryté, takže je čierne 88 až 92 % obrazovky. Deje sa to po skoku z menu, po kliknutí na logo, po „Späť hore“ a pri rýchlom švihu. Je to zámer („rozsvietenie zo šera“, film.js:1243), nie porucha. Je to aj predvolený zážitok bežného telefónu s grafickou kartou. Spolu 40 okien, najdlhšie 9,85 s. Aj pri CPU 1× trvá „Späť hore“ 2,5 s.
2. **Pokojná verzia (záloha), výmena kariet:** záloha je už stiahnutá, ale prehliadač jej dekódovanie odloží až na chvíľu zobrazenia. Predošlá karta pritom zmizne naraz, takže sa prelína do tmavej dosky. Spolu 37 okien, najdlhšie 1,8 s, aj pri návrate s plnou cache. Skúška opravy cez `img.decode()` znížila tmu o 90 až 100 %.
3. **Pokojná verzia, záloha sa ešte sťahuje:** okolie is-near je úzke a počíta sa až po udalosti `load`. Telefón s DPR 3 sťahuje fotky 1448 px (327 až 448 kB). Spolu 16 okien, najdlhšie 4,7 s (Slow 4G).
4. **Prvý obraz bez náhľadu:** úvod je tmavý, kým sa nestiahne fotka, lebo nikde nie je LQIP. Telefón Slow 4G 2,0 až 3,0 s, počítač Slow 4G 3,2 až 6,4 s, Fast 4G 0,25 až 2,4 s.

Menšie príčiny: tímové karty a kroky strihu sa odhaľujú až neskoro (prázdna tmavá doska v páse) a nad pätičkou sú všetky zálohy vypnuté.

## Metodika
- **Nahrávač** `rec.mjs` (Playwright, CDP `Page.startScreencast`): každý snímok sa uloží s časom a polohou skrolu. Stránka si každých 100 ms zapisuje stav: triedy `<html>`, stav filmu (`BS30_FILM.state`: S, T, ready po záberoch, mix), stav záloh (`is-near`, `is-shown`, `--so`, `img.complete`, display/visibility/opacity) a obdĺžniky pásov a médií. K tomu značky scenára a zoznam požiadaviek.
  - Sieť: Fast 4G (165 ms, 1 012 500 B/s) a Slow 4G (562,5 ms, 180 000 B/s) cez `Network.emulateNetworkConditions`.
  - CPU 4× cez `Emulation.setCPUThrottlingRate`, kontrolné behy pri 1×.
  - Telefón 390×844 DPR 3 s dotykom (ťahy cez `Input.dispatchTouchEvent`, švih 5 000 px/s so zotrvačnosťou). Počítač 1440×900 (koliesko).
  - Prvá návšteva (prázdna cache) aj návrat (cache zahriata prejdením celej stránky).
  - Film `?film=on`, `?film=off` a predvolene; `prefers-reduced-motion: reduce`; šetrenie dát (`navigator.connection.saveData`).
  - Scenáre: úvod, pomalý skrol, švih dole a hore, skok z menu na každú sekciu, logo, skok do pätičky a „Späť hore“, dvere, jazyk, skok hore.
- **Detektor** `ana.py`:
  - Snímok sa rozdelí na dlaždice široké asi 3,3 % šírky. Dlaždica je tmavá a prázdna, keď má priemerný jas pod 0,14 a smerodajnú odchýlku pod 0,007.
  - Prah jasu je 0,14, nie 0,06. Doska stránky `--ink-2` #171412 má jas asi 0,08 a práve ju zákazník vidí ako „čierne okno“. Jednoliatosť zabezpečuje rozptyl, nie samotný jas.
  - Počíta sa len tam, kde má byť obraz: okno bez lišty, bez pásov s textom a bez otvoreného menu. Médiá v pásoch (portréty, galéria, video) sa počítajú.
  - Čierne okno = aspoň 20 % okna, aspoň 35 % stredného pásu (15 až 60 % výšky, aby tmavý spodok fotky nebol chyba) a dlhšie ako 150 ms.
  - Kalibrácia: `maska.py`, dôkazy 11 a 12.
- **Ďalšie nástroje:**
  - `pricina.py` priradí každé okno ku kategórii podľa stavu stránky v tom čase.
  - `dekod-trace.mjs` (záznam výkonu) overuje odklad dekódovania.
  - `rozklad.mjs` + `rozklad2.py` rozložia čierne plátno filmu na sieť, rozbalenie a nahrávanie po pásoch.
  - A/B skúšky opráv bez zmeny repozitára: `rec.mjs --inject=oprava-*.js`.
- **Obmedzenia kontajnera:**
  1. Grafika beží cez SwiftShader. Film ho rozpozná (film.js:83–106) a **predvolene dá pokojnú verziu** (`world-frame world-off`). Riadky „default“ v kontajneri preto zodpovedajú telefónu bez grafiky. Skutočný telefón s grafikou dostane predvolene film, takže nálezy „film“ sú pre bežného návštevníka hlavné.
  2. Pri filme pri DPR 3 kontajner nestíha, preto tie behy idú pri DPR 1 (film aj tak kreslí najviac pri 2×).
  3. Pri filme a CPU 4× chodí screencast len 1 až 10 snímok/s. Medzi snímkami rAF sú medzery až 6,8 s (`rozklad-…-cpu4`), takže trvania sú v kontajneri nafúknuté. Preto uvádzam aj behy pri CPU 1× a odhad pre telefón s grafikou: sieť + rozbalenie + 17 pásov po 16,7 ms + polovica nábehu 450 ms.
  4. Súbežne bežali iné audity (4 jadrá).

## Výsledky (42 nahrávok, `suhrn.txt` / `suhrn.json`)
| nahrávka | zar. | sieť | CPU | film | cache | scenár | okien >150 ms | najdlhšie ms | spolu ms | tmavý prvý obraz ms |
|---|---|---|---|---|---|---|---|---|---|---|
| d-def-f4-cold-svih | PC | fast4g | 4× | default | cold | svih | 0 | 0 | 0 | 1227 |
| d-def-s4-cold-uvod | PC | slow4g | 4× | default | cold | uvod | 0 | 0 | 0 | 6391 |
| d-off-s4-cold-menu | PC | slow4g | 4× | off | cold | menu | 3 | 1125 | 2254 | 603 |
| d-off-s4-cold-svih | PC | slow4g | 4× | off | cold | svih | 1 | 558 | 558 | 3734 |
| d-on-f4-cold-dvere | PC | fast4g | 4× | on | cold | dvere | 0 | 0 | 0 | 1074 |
| d-on-f4-cold-hore | PC | fast4g | 4× | on | cold | hore | 1 | 1177 | 1177 | 1793 |
| d-on-f4-cold-jazyk | PC | fast4g | 4× | on | cold | jazyk | 1 | 1006 | 1006 | 2376 |
| d-on-f4-cold-svih | PC | fast4g | 4× | on | cold | svih | 2 | 1278 | 2432 | 992 |
| d-on-f4-cold-uvod | PC | fast4g | 4× | on | cold | uvod | 0 | 0 | 0 | 1115 |
| d-on-f4-warm-menu | PC | fast4g | 4× | on | warm | menu | 3 | 7806 | 10547 | 393 |
| d-on-s4-cold-menu | PC | slow4g | 4× | on | cold | menu | 3 | 9850 | 13198 | 3226 |
| p-def-f4-cold-uvod | tel DPR3 | fast4g | 4× | default | cold | uvod | 0 | 0 | 0 | 605 |
| p-def-s4-cold-svih | tel DPR3 | slow4g | 4× | default | cold | svih | 5 | 1922 | 6369 | 2466 |
| p-off-f4-cold-jazyk | tel DPR3 | fast4g | 4× | off | cold | jazyk | 3 | 806 | 2003 | 616 |
| p-off-f4-cold-menu | tel DPR3 | fast4g | 4× | off | cold | menu | 4 | 359 | 1085 | 1170 |
| p-off-f4-cold-pomaly | tel DPR3 | fast4g | 4× | off | cold | pomaly | 0 | 0 | 0 | 1100 |
| p-off-f4-cold-svih | tel DPR3 | fast4g | 4× | off | cold | svih | 6 | 989 | 3976 | 1072 |
| p-off-f4-warm-menu | tel DPR3 | fast4g | 4× | off | warm | menu | 2 | 1202 | 1456 | 0 |
| p-off-f4-warm-svih | tel DPR3 | fast4g | 4× | off | warm | svih | 4 | 757 | 2646 | 205 |
| p-off-s4-cold-menu | tel DPR3 | slow4g | 4× | off | cold | menu | 4 | 3636 | 4713 | 2932 |
| p-off-s4-cold-menu-b | tel DPR3 | slow4g | 4× | off | cold | menu | 5 | 4134 | 5659 | 3071 |
| p-off-s4-cold-svih | tel DPR3 | slow4g | 4× | off | cold | svih | 5 | 4676 | 8157 | 3032 |
| p-off-s4-cold-uvod | tel DPR3 | slow4g | 4× | off | cold | uvod | 0 | 0 | 0 | 3038 |
| p-on-f4-cold-dvere | tel DPR1 | fast4g | 4× | on | cold | dvere | 0 | 0 | 0 | 169 |
| p-on-f4-cold-hore | tel DPR1 | fast4g | 4× | on | cold | hore | 3 | 3893 | 7083 | 421 |
| p-on-f4-cold-jazyk | tel DPR1 | fast4g | 4× | on | cold | jazyk | 2 | 4909 | 5977 | 438 |
| p-on-f4-cold-menu | tel DPR1 | fast4g | 4× | on | cold | menu | 3 | 5072 | 5755 | 248 |
| p-on-f4-cold-menu-b | tel DPR1 | fast4g | 4× | on | cold | menu | 2 | 498 | 659 | 759 |
| **p-on-f4-cold-menu-cpu1** | tel DPR1 | fast4g | **1×** | on | cold | menu | 3 | 2494 | 3023 | 323 |
| p-on-f4-cold-pomaly | tel DPR1 | fast4g | 4× | on | cold | pomaly | 0 | 0 | 0 | 684 |
| p-on-f4-cold-svih | tel DPR1 | fast4g | 4× | on | cold | svih | 2 | 3497 | 6693 | 308 |
| p-on-f4-cold-uvod | tel DPR3 | fast4g | 4× | on | cold | uvod | 0 | 0 | 0 | 494 |
| p-on-f4-warm-menu | tel DPR1 | fast4g | 4× | on | warm | menu | 2 | 6188 | 6773 | 235 |
| p-on-f4-warm-uvod | tel DPR1 | fast4g | 4× | on | warm | uvod | 0 | 0 | 0 | 160 |
| **p-on-n0-warm-menu-cpu1** | tel DPR1 | bez obmedzenia | **1×** | on | warm | menu | 2 | 240 | 416 | 216 |
| p-on-s4-cold-menu | tel DPR1 | slow4g | 4× | on | cold | menu | 4 | 1987 | 5547 | 492 |
| p-on-s4-cold-svih | tel DPR1 | slow4g | 4× | on | cold | svih | 4 | 2752 | 5135 | 882 |
| p-on-s4-cold-uvod | tel DPR3 | slow4g | 4× | on | cold | uvod | 0 | 0 | 0 | 2009 |
| p-on-s4-warm-svih | tel DPR1 | slow4g | 4× | on | warm | svih | 3 | 5890 | 13101 | 0 |
| p-rm-f4-cold-menu | tel DPR3 | fast4g | 4× | obmedzenie pohybu | cold | menu | 4 | 1533 | 2902 | 1752 |
| p-rm-s4-cold-svih | tel DPR3 | slow4g | 4× | obmedzenie pohybu | cold | svih | 6 | 1395 | 4505 | 2485 |
| p-sd-s4-cold-menu | tel DPR3 | slow4g | 4× | šetrenie dát | cold | menu | 2 | 3873 | 4163 | 2489 |

**Príčiny všetkých okien za behu** (`pricina.py`, bez A/B behov):

| kategória | čo sa deje | okien | spolu | najdlhšie |
|---|---|---|---|---|
| F-TEX | film, cieľový záber sa načítava | 22 | 60,3 s | 9,85 s |
| F-RDY | film, záber práve dobehol: nábeh zo šera 450 ms, oneskorené snímky SwiftShaderu, odhaľovanie tímu | 18 | 28,2 s | 6,2 s |
| Z-DEC | záloha stiahnutá, ale nedekódovaná | 37 | 22,5 s | 1,8 s |
| Z-NET | záloha sa ešte sťahuje | 16 | 27,7 s | 4,7 s |
| Z-NONE | nad pätičkou žiadna záloha | 1 | 0,25 s | 0,25 s |

**Bez čierneho okna:**
- pomalý skrol (film aj záloha),
- úvodný film a prológ (telefón DPR 3, Fast aj Slow 4G),
- „Späť na ulicu“ a „Vojdi dnu“ (telefón aj počítač),
- samotné prepnutie jazyka (okná po ňom spôsobil až švih),
- návrat na úvod s cache.

## Rozklad čierneho plátna filmu (`rozklad.mjs`, telefón DPR 3, Fast 4G, prvá návšteva)
- **Menu → Služby pri CPU 1×:**
  - Skrol dobehne za 1,0 s.
  - `kreslo-stred-m-1448.avif` (332 kB) je stiahnutá v čase 2,19 s.
  - Rozbalenie (createImageBitmap) trvá 326 ms.
  - Nahrávanie po pásoch v kontajneri trvá 1,0 s; textúra je hotová v čase 3,59 s.
  - **Odhad pre telefón s grafikou:** asi 2,0 až 2,3 s čierneho plátna po dobehnutí skrolu.
- **Skoky na záber, ktorý je už v cache:** Prehliadka, Kontakt a úvod v odhade 0,5 až 0,6 s. Tvorí ich rozbalenie 90 až 330 ms, 17 pásov po 256 riadkov a nábeh zo šera 450 ms.
- **CPU 4×:** Služby 4,8 s do hotovej textúry, úvod („Späť hore“) odhad 1,06 s.
- Pri Slow 4G sa k tomu pridá sťahovanie 330 až 450 kB, čo je 2 až 3 s.

## A/B skúšky opráv (vložené skripty, repozitár nezmenený)

| oprava | podmienky | pred | po |
|---|---|---|---|
| `oprava-dekod.js`: záloha v okolí sa vopred dekóduje cez `img.decode()` | telefón, pokojná verzia, CPU 4×, Fast 4G, návrat, švih | 2 okná / 1 948 ms a 5 okien / 4 070 ms (max 1 733) | 0 okien a 1 okno / 190 ms |
| `oprava-dekod.js` | to isté, skoky z menu | 2 okná / 1 456 ms (max 1 202) | 1 okno / 210 ms (pätička) |
| `oprava-film.js`: kým film nemá záber, ukáže sa dekódovaná záloha tej istej karty; skryje sa 500 ms po hotovej textúre | telefón, film, CPU 1×, Fast 4G, prvá návšteva, menu | 3 okná / 3 812 ms (max 2 885) | 0 okien |

Pri `oprava-film.js` ostal len prechod do zálohy dlhý 114 ms, teda pod prahom (dôkazy 26 a 27).

## Odporúčané opravy (poradie podľa dopadu)
1. **Film nikdy nekreslí šero namiesto obrazu** (C1, C5).
   - Kým záber nie je v grafike, ostane viditeľná statická záloha tej istej karty (je nad plátnom). Na telefóne ide o ten istý súbor `-m-1448.avif`, takže je v cache. Zmizne prelínaním, až keď film záber nakreslí.
   - Skok nezahadzuje `held`; namiesto „zo šera“ ide prelínanie z posledného obrazu do cieľa.
   - Cieľ kotvy sa začne načítavať pri kliknutí, ešte pred skrolom.
   - Úvodný záber (rohozka) a zábery titulných kariet ostávajú v pamäti; na telefóne aspoň ±2 a úvod.
   - Kým sa čaká, platí väčší rozpočet `pump()`.
   - Dopad: odstráni asi 85 s okien F-TEX a F-RDY. Pri skutočnom telefóne to je 0,5 až 3 s na každý skok.
2. **Zálohy sa dekódujú vopred a výmena čaká na hotový obraz** (C2): `img.decode()` pri `is-near`, trieda `is-ready`, predošlá karta drží `--so` 1, kým nová nie je hotová. Dopad: asi 22 s Z-DEC (A/B: −90 až 100 %).
3. **LQIP pod každou zálohou a pod úvodom** (C3, C4): inline rozmazaný náhľad 0,5 až 1 kB ako `background-image` `.film-still`. Úvod s `decoding="sync"`. Prednačítanie zálohy cieľa pri kliknutí a okolia v smere skrolu, nie až po `load`. Dopad: tmavý prvý obraz 0,25 až 6,4 s → 0, Z-NET asi 28 s → 0 (namiesto tmy náhľad).
4. **Odhaľovanie v pásoch bez prázdnej dosky** (C6): menšie posuny bez `opacity: 0`, väčší `rootMargin`, kratší prechod.
5. **Pätička** (C7): posledná záloha sa nevypína, kým pätička nezakrýva celé okno.

## Ako merať pred a po
Server spusti v koreni pracovného stromu: `python3 -m http.server 8174`. Potom v `audit/cierne-okna/`:
- celá sada: `bash batch.sh matica3.txt` a `bash batch.sh matica4.txt` (`FORCE=1` nahrávky prepíše), súhrn `python3 suhrn.py > suhrn.txt; python3 pricina.py`;
- akceptačná sada (10 nahrávok): `FORCE=1 bash batch.sh matica-akceptacia.txt`; po oprave má byť 0 okien za behu a tmavý prvý obraz ≤ 150 ms;
- rozklad: `node rozklad.mjs --cpu=1 --net=fast4g && python3 rozklad2.py rozklad-<meno>.json`;
- dekódovanie: `node dekod-trace.mjs --variant=nic|decode`.

Surové snímky (frames) som po rozbore zmazal. V `runs/*/kluc/` ostali snímky každého okna a `_priebeh.png`, dôkazy sú v `dokazy/` (29 pásov snímok, všetky som si pozrel).