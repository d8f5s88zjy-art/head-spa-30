## Lov na čierne okná: BARBERSHOP 30 (audit QA, kľúč `cierne-okna`)

Výstupy sú v `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/barber/audit/cierne-okna/`. Repozitár `hs2` ostal nezmenený (`git status` je čistý). Server na porte 8174 je zastavený a snímky nahrávok (614 MB) som po analýze zmazal. Ostali kľúčové snímky v `runs/*/kluc/`, súbory `ana.json` a `snimky.json`, logy a vybrané dôkazy v `dokazy/` (19 pásov snímok, všetky som si pozrel).

### Zhrnutie
Čierne okná, v ktorých zákazník nevidí nič alebo len titulok na čiernom, sa našli vo **všetkých troch režimoch**: film (`?film=on`), pokojná verzia (`?film=off`) a predvolený režim, ktorý v kontajneri prepne na zálohu. Vznikajú pri **rýchlom švihu, skoku z menu, skoku hore a pri prvom obraze**. Pri pomalom skrolovaní, pri „Späť na ulicu“/„Vojdi dnu“ a pri samotnom prepnutí jazyka žiadne nie sú (len prvý obraz).

Príčiny sú štyri:
1. Film po skoku plátno zámerne vymaže na farbu `--ink` a potom robí nábeh zo šera. Medzitým zahadzuje práve zobrazený záber.
2. V pokojnej verzii sa záloha ďalšej karty dekóduje až vo chvíli, keď sa ukáže. Predošlá sa pritom skryje okamžite (dôkaz z trace: `CheckerImageTracker::DeferImageDecode` presne pri výmene).
3. Zálohy, ktoré ešte nie sú stiahnuté, nemajú žiadny náhľad (LQIP). Ich pozadie je len `--ink-2` a na telefóne sa pri DPR 3 sťahuje 1448w (150 až 450 kB).
4. Prvý obraz (úvodný záber) nemá náhľad a súťaží o sieť s písmami a skriptmi.

Menšie nálezy: skryté portréty tímu (`.reveal`), tmavé spodky záberov sud a stol pod spodným prechodom a tmavý predmet pri strihu „popredie“ na počítači.

### Metodika
- **Nahrávanie** (`rec.mjs`): Playwright Chromium (ANGLE/SwiftShader) cez CDP `Page.startScreencast`. Každý snímok má časovú značku a `scrollOffsetY`.
  - V stránke beží zapisovač každých 100 ms: triedy `<html>`, `BS30_FILM.state` (S, T, current, ready a loading každého záberu, snímky, sekvencie), stav záloh (is-near, is-shown, --so, `img.complete`, display/visibility/opacity), obdĺžniky pásov a médií a `MutationObserver` menu. K tomu sa zaznamenajú požiadavky siete s časom konca.
  - Sieť cez `Network.emulateNetworkConditions` podľa predvolieb DevTools: **Fast 4G** = 165 ms a 1 012 500 B/s; **Slow 4G** = 562,5 ms a 180 000 B/s. CPU 4× cez `Emulation.setCPUThrottlingRate`.
  - Telefón 390×844, DPR 3, dotyk; počítač 1440×900.
  - Dotykové ťahy cez `Input.dispatchTouchEvent`: `synthesizeScrollGesture` s dotykom v tomto Chromiu neskroluje (overené, 0 px). Švih je ťah 500 px rýchlosťou 5000 px/s a pustenie, zotrvačnosť dorobí Chrome. Pomalý skrol sú ťahy po 280 px rýchlosťou 600 px/s.
  - Scenáre:
    - `uvod`: prvá návšteva a nečinnosť.
    - `pomaly`: pomalý skrol celou stránkou.
    - `svih`: švihy dole na koniec a hore na začiatok.
    - `menu`: Prehliadka, Služby, Tím, Galéria, Kontakt, Prehliadka, potom logo hore, skok na pätičku a „Späť hore“.
    - `dvere`: tlačidlo von/dnu a ťah von/dnu.
    - `jazyk`: EN, švihy, SK.
    - `hore`: švihy dole a `scrollTo` smooth na vrch.
  - Prepínače: `--rm` (prefers-reduced-motion), `--savedata` (`navigator.connection.saveData`), prvá návšteva (`cold`) aj návrat (`warm`: nová karta s HTTP cache).
- **Analýza** (`ana.py`):
  - Snímok sa delí na dlaždice 13×13 px. Dlaždica je *tmavá prázdna*, keď má priemerný jas < 0,14 a smerodajnú odchýlku < 0,007. Kalibrované: `--ink`/`--ink-2` majú odchýlku 0 až 0,005, tmavá fotka 0,01 až 0,2.
  - Počíta sa len „tam, kde má byť obraz“: okno bez lišty, pásov `.band` a pätičky, ale s médiami vnútri pásov.
  - Okno = súvislé snímky s tmavou prázdnou plochou ≥ 20 % okna a zároveň ≥ 35 % stredného pásu okna (15 až 60 % výšky; odlíši chýbajúci obraz od tmavého spodku fotky pod prechodom), dlhšie ako 150 ms.
  - Otvorené menu sa rozpozná z obrazu (oranžové tlačidlo cez celú šírku) a nepočíta sa. Okno pred prvým vykreslením (FCP) sa nepočíta.
  - Výstupy: `ana.json`, kľúčové snímky a priebeh `_priebeh.png`. Súhrn všetkých nahrávok je v `suhrn.json` (`suhrn.py`).
- **Overenie príčin**:
  - `dekod-trace.mjs`: trace dekódovania pri výmene záloh; dva varianty, bez prípravy a s `img.decode()` vopred.
  - `skok-film.mjs`: stav filmu každých 50 ms po skoku z menu.
  - `maska.py`: zobrazenie označených dlaždíc.
- **Obmedzenia, prosím brať vážne**:
  - Kontajner nemá GPU. Predvolený režim sa preto prepne na zálohu (`world-frame` + `world-off`), čo je správanie zariadení bez grafiky. Film sa meria s `?film=on` na SwiftShader, a to pri **DPR 1**: pri DPR 3 bežal pod 2 snímky/s a švih nedobehol. Veľkosť stiahnutých fotiek je pritom rovnaká (1086 až 1448w), lebo `pickSize` vyberá podľa plátna.
  - Súčasne bežali ďalšie audity (load average 12 až 22 na 4 jadrách). Film kreslil 2 až 10 snímok/s a screencast za DOM meškal stovky ms až sekundy. **Trvania okien vo filme sú preto horná hranica.** Mechanizmus aj to, že okno vzniká, sú overené kódom aj stavom filmu. Trvania v pokojnej verzii pri Slow 4G určuje hlavne sieť, takže sú spoľahlivé.

### Merania (vybrané, ms; úplná tabuľka 33 nahrávok je v `suhrn.json`)
| nahrávka | čierny prvý obraz | okná po prvom obraze (> 150 ms) |
|---|---|---|
| telefón film Fast 4G švih (`p-on-f4-cold-svih`) | 308 | 2 okná: 3196 (y 2975, cesta do Služieb), 3497 (švih na vrch, úvod) |
| telefón film Slow 4G švih | 882 | 4 okná: 691, 694, 998, 2752 |
| telefón film Slow 4G švih, **teplá cache** | – | 3 okná: 3547, 3664, 5890 |
| telefón film Fast 4G menu | 248 | Služby 5072, Prehliadka 294, Späť hore 389 |
| telefón film Fast 4G skok hore | 421 | 745, 2445, 3893 (na vrchu) |
| telefón film Fast 4G jazyk + švih | 438 | 1068, 4909 (švih po preklade; samotné prepnutie bez okna) |
| telefón film Fast 4G dvere (von/dnu, ťah) | 169 | 0 |
| telefón film Fast 4G pomalý skrol | 684 | 0 |
| telefón záloha Fast 4G švih | 1072 | 6 okien: 507 (y 970, obrázok bol stiahnutý), 151, 733 (tím), 761, 835, 989 |
| telefón záloha Fast 4G švih, **teplá cache** | 205 | 4 okná: 737, 634, 757, 518 |
| telefón záloha Fast 4G menu | 1170 | 4 okná: 322, 359, 152, 252 |
| telefón záloha Slow 4G švih | 3032 | 5 okien: 409, 1520, 186, 1366, 4676 |
| telefón záloha Slow 4G menu (2 behy) | 2932 / 3071 | Služby 3636 / 4134 (záber sa do ďalšieho ťuknutia vôbec neukázal), ďalšie 155 až 692 |
| telefón predvolene (záloha) Slow 4G švih | 2466 | 5 okien: 686, 1588, 1922, 1785, 388 |
| telefón obmedzenie pohybu, Slow 4G švih | 2485 | 6 okien do 1395 |
| telefón šetrenie dát, Slow 4G menu | 2489 | 3873 (Služby), 290 |
| telefón úvod Slow 4G (film / záloha) | 2009 / 3038 | – |
| telefón úvod Fast 4G (film DPR 3 / predvolene), návrat | 494 / 605, návrat 160 | – |
| počítač predvolene Slow 4G úvod | **6391** | – |
| počítač film Slow 4G menu | 3226 | 1450, 1898, **9850** (logo hore) |
| počítač záloha Slow 4G švih / menu | 3734 / 603 | 558 / 1125, 585, 544 |

**Trace dekódovania** (pokojná verzia, telefón, CPU 4×, zálohy stiahnuté):
- **Bez prípravy:** `Decode Image` 31 / 43 / 228 ms a `CheckerImageTracker::DeferImageDecode` v časoch 3586 a 3745, 6496 a 6548, 9047 a 9281 ms. Výmeny kariet (`--so` 1/0) prebehli v časoch 3610, 6555 a 9143 ms. Dekódovanie teda začne až pri výmene a Chrome dovtedy kreslí snímky bez obrázka.
- **S `img.decode()` vopred:** dekódovanie (22 / 77 / 64 ms) prebehne pred výmenou a pri výmene nie je ani jeden odklad.

### Nálezy (podrobne v poli `nalezy`)
- **N1, kritická, film:** Po skoku (švih, menu, návrat hore) je plátno čierne, typicky 0,3 až 5,9 s. Na zariadení s GPU zostane z logiky najmenej asi 250 ms čistej čiernej aj s načítanou fotkou. Príčiny: `film.js:1243`, `1105–1106`, `1109`, `849`, `1064`, `755–765`, `403`; zálohy sú vo filme skryté (`style.css:498–501`, `1105–1108`).
- **N2, kritická, pokojná verzia:** Výmena záloh ukáže čiernu 0,15 až 1 s aj s cache, pre odložené dekódovanie. Príčiny: `style.css:1096–1100`, `decoding="async"` záloh, `app.js:196–200`.
- **N3, vysoká, pokojná verzia na pomalej sieti:** Celé okno je prázdne 1,4 až 4,7 s. Príčiny: `app.js:203`, `style.css:1104` a `441`, `loading=lazy` a 1448w pri DPR 3, plynulý skrol menu cez medzikarty (`style.css:71`, `1113`).
- **N4, vysoká, prvý obraz:** Úvod je čierny s textom 0,25 až 0,6 s (Fast 4G), 2 až 3 s (Slow 4G), na počítači pri Slow 4G 6,4 s. Príčiny: `index.html:18–21`, `38–41`, `162`/`171`, `style.css:441`. LCP meria text, takže Lighthouse toto nevidí.
- **N5, stredná:** Portréty tímu sú pri rýchlom pohybe prázdna plocha (27 až 33 % okna, 0,7 s a viac). Príčina: `.reveal` v `app.js:399–412` a `style.css:388–390`.
- **N6, stredná, dizajn:** Spodná tretina záberov sud a stol je na telefóne takmer čierna natrvalo (`style.css:1148–1149`, výrezy sud-m a stol-m).
- **N7, nízka:** Strih „popredie“ na počítači (čakáreň → sála ráno) nechá tmavý neostrý predmet na 36 % plochy, kým prechod nedobehne.

### Odporúčané poradie opráv a odhad dopadu
1. **LQIP pre všetky zábery.** Napríklad WebP 12×21 px, 120 až 170 B, base64 asi 160 až 230 B na záber; 9 výrezov na výšku má spolu 1,35 kB (prepočítané), so zábermi na šírku pre počítač asi 3 až 4 kB.
   - Ako `background-image` na `.film-still` v `style.css`, nie v HTML: HTML má po gzip 14,4 kB a je na hrane prvého okna TCP. Pre úvod (fasáda aj rohožka) ide náhľad inline do hlavičky.
   - Vo filme ako počiatočná textúra namiesto `blank`.
   - Odstráni čiernu vo všetkých nálezoch N1 až N4 (namiesto nej je vidieť rozmazaný záber).
2. **Film nikdy nemaže plátno na čierno.**
   - Pri nenačítanom zábere kresliť jeho LQIP alebo posledný snímok, nenastavovať `dark`, nezahadzovať práve zobrazený záber.
   - Prechod robiť z LQIP do ostrej fotky, nie zo šera.
   - Pri skoku z menu načítať cieľ okamžite (z `click`/`hashchange` alebo cez `api.goTo`). Susedov nečakať na hotový cieľ a držať ±2 zábery.
   - Odhad na zariadení s GPU: zostane rozmazaný náhľad asi 0,2 s (cache), 0,5 s (Fast 4G) až 1,5 s (Slow 4G), nikdy čierna.
3. **Pokojná verzia: dekódovať vopred** (`img.decode()` pri is-near) a predošlú zálohu skryť až keď je nová dekódovaná. Overené trace: odklad dekódovania zmizne. Odstráni N2 úplne.
4. **Prednačítanie záloh.** Okolie cur−1 až cur+3, po udalosti `load` postupne všetky s nízkou prioritou. Na telefóne zvážiť 1086w ako prvú veľkosť (110 až 215 kB namiesto 150 až 450 kB, pri Slow 4G zhruba o 0,5 až 1,5 s rýchlejšie na záber), 1448w až pri rýchlej sieti. Skok z menu cez väčšiu vzdialenosť okamžite, nie plynulo cez medzikarty.
5. **Úvod.** Inline LQIP a na telefóne 1086w; na počítači 1448w a väčšie až po prvom obraze. Pri Slow 4G príde obraz zhruba o 1 až 1,5 s skôr a nikdy nie je čierny.
6. **Ostatné.** Portréty bez `.reveal` alebo s predstihom IO, slabší spodný prechod na zábere sud/stol (bez tónovania fotky), kratší dobeh strihu „popredie“.

**Akceptačné kritérium:** `FORCE=1 bash batch.sh matica3.txt` (po spustení servera na porte 8174) dá 0 okien > 150 ms po prvom obraze vo všetkých 33 nahrávkach a čierny prvý obraz ≤ 150 ms (LQIP od prvého vykreslenia). Doplnkovo `dekod-trace.mjs` bez `DeferImageDecode` pri výmenách a `skok-film.mjs`, kde nikdy neplatí „A nie je ready a nič sa nekreslí“.

### Čo je v poriadku
- Pomalý skrol prstom (film aj záloha, Fast 4G): okrem prvého obrazu 0 okien.
- „Späť na ulicu“/„Vojdi dnu“ tlačidlom aj ťahom: 0 okien. Fasáda sa drží a odchod čaká na jej načítanie.
- Prepnutie jazyka samo osebe: 0 okien.
- Filmové pásy prológu (9vh hore aj dole, asi 11 % okna mimo lišty) sú pod prahom 20 % a sú zámerné.
- Prechod zo zálohy na film (`world-in`): jas 0,222 pred aj po, bez poklesu.
- Známa poznámka v `CHECKS.md:229` („pri skoku cez menu… tmavý 2–3 s“) je tu potvrdená a rozšírená na švih, návrat hore a pokojnú verziu.

### Ako merať znova
Najprv spustiť server: `cd …/scratchpad/hs2 && python3 -m http.server 8174 --bind 127.0.0.1`. Potom:
- jedna nahrávka: `node rec.mjs --name=X --dev=phone --net=slow4g --cpu=4 --film=off --cache=cold --scen=svih [--dpr=1] [--rm] [--savedata]` a `python3 ana.py runs/X`;
- celá matica: `bash batch.sh matica3.txt`;
- súhrn: `python3 suhrn.py`;
- príčina dekódovania: `node dekod-trace.mjs --cpu=4 --variant=nic|decode`;
- stav filmu po skoku: `node skok-film.mjs --net=fast4g --ciel=#sluzby`.