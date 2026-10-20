## Overenie auditu „kod-film“: skeptický overovateľ

### Metodika
Repozitár som nemenil (`git status` je čistý). Server bežal na porte 8433 v `hs2` a stránka na `/barbershop-30/?film=on&uvod=off`. Emulácia: telefón 390×844, DPR 3, dotyk, UA Android, Chromium s SwiftShaderom. CPU 4× a Fast 4G, kde to má zmysel, inak CPU 1× bez obmedzenia siete (logika a mikromerania).

Merania sú vlastné a nezávislé od nástrojov auditu:
- **Sonda** `sonda.js` počíta snímky filmu s kreslením a s „len vyčistením“, nahrávania, mipmapy, prvé použitia programov a synchrónne dotazy. Zbiera aj kontexty, LoAF a longtask a každých 100 ms stav filmu.
- **Screencast**: CDP snímky s časom stránky.
- **Pixely** `tma.py`: dlaždica 10×10 px je tmavá, keď má jas < 0,07 a odchýlku < 0,02. Podiel tmy sa počíta z celej plochy aj zo stredu 64–760 px.
- **Deterministické reprodukcie**: zadržanie fotiek v sieti (`over-kf02.mjs`), skutočné ovládanie (ťuk na menu a logo) a spomalenie CSS prechodov cez CDP Animation (`--pomaly=0.1`).
- **Mikromerania**: `nahratie.mjs` (nahrávanie textúr) a `zjemnenie-over.mjs` (pomer ceny zjemnenia hĺbky).
- **Výpočet** `pohyb.py`: pohyb obrazu v pokoji.

**Dôležité obmedzenie prostredia.** Zjemnenie hĺbky telefónu (KF-07) trvá v SwiftShaderi 2,2–3,3 s grafického času na každý načítaný záber. Grafický proces sa tým zahltí: LoAF 2,2–3,6 s bez skriptu a kompozítor nevydal ani jednu snímku 6 s po skoku hore (beh1/hore), 13 s pred stratou kontextu a 4 s po ťuku do menu. Absolútne trvania šera v tomto kontajneri sú preto nafúknuté. Mechanizmy a pomery sú však overené a trvania pre telefón odhadujem zo zložiek. Po oprave KF-07 sa merania v kontajneri zmenia oveľa viac než na telefóne, s čím treba rátať pri porovnaní pred a po.

**Druhé metodické zistenie.** Metrika „šero“ v `film-stopa.mjs` (snímka filmu iba vyčistila plátno) nie je to isté ako viditeľná čierna. V behu beh1/dole bol film 1 883 ms v šere (S 4,98→5,93), ale v pixeloch bolo čierno iba 75 ms, lebo plátno zakrývali nepriehľadné pásy (tím, cenník). Akceptačné kritériá pre čierne okná treba merať v pixeloch (`tma.py`), nie počítadlom šera.

### Výsledky po nálezoch

| ID | Pôvodne | Po overení | Verdikt |
|---|---|---|---|
| KF-01 | kritická | kritická | Platí, overené pixelmi aj pri skutočnom ťuku do menu a na logo. |
| KF-02 | vysoká | stredná | Logika platí (deterministická reprodukcia). Dopad je menší: ide o podprípad KF-01 a viditeľné je to len mimo pásov. |
| KF-03 | vysoká | vysoká | Platí: počas straty 89 % stredu tmavé, 0 viditeľných záloh, žiadny časový limit. |
| KF-04 | vysoká | stredná | Fakty platia (100 % snímok kreslí, posun 0,049 px na snímku). Je to však efektivita, nie zasekávanie, a plná frekvencia je výslovné rozhodnutie majiteľa. |
| KF-05 | vysoká | vysoká | Platí: pás 7,4 ms medián, 10,5 ms max. Dve čiastkové tvrdenia sú nadhodnotené (priorita fronty, „vždy 1448“). |
| KF-06 | stredná | stredná | Platí a je silnejšie: dve celé nahratia v jednej snímke som zachytil priamo v stránke (38,7 ms). |
| KF-07 | stredná | stredná | Platí: pomer 11,2× voči prechodu strihu a 12,1× voči rozlíšeniu mriežky. |
| KF-08 | stredná | nízka | Mechanizmus platí (183,5 ms v snímke skrolu), ale veľkosť je daná frontou SwiftShadera. Na telefóne skôr jednotky ms. |
| KF-09 | stredná | stredná | Platí: po prvom dotyku LoAF 152–497 ms a testovací kontext 40–651 ms. Opravu treba spresniť (atribúty kontextu). |
| KF-10 | stredná | stredná | Platí, doložené pixelmi: obraz klesne na 38 % pri ~616 ms, pod 60 % ~220 ms. |
| KF-11 | nízka | nízka | Platí so spresnením: popredie (kind 4) mipmapy predmetu potrebuje. |
| KF-12 | nízka | nízka | Platí: aktuálny WebKit hlási na iPhone 4 jadrá a deviceMemory nemá. |

Úplne vyvrátený nie je žiadny nález.

### Čo som vyvrátil, nadhodnotil alebo spresnil
1. **KF-02, závažnosť.** Logická chyba je reálna. Nastane však až vtedy, keď film preskočí o dva zábery skôr, než sa načítajú (held sa vymaže). Plátno je navyše často zakryté pásmi: vo voľnom rýchlom skrole bolo šero filmu 1,9 s, ale v pixeloch len 75 ms. Oprava KF-01 (LQIP) ho rieši úplne, preto stredná.
2. **KF-04, závažnosť a časť opravy.** Kreslenie v pokoji nespôsobuje trhanie, je to batéria, teplo a GPU. Komentár na film.js:982 hovorí, že plná frekvencia displeja je rozhodnutie majiteľa z 2026‑10‑11. Návrh „počas pohybu obmedziť na 60 Hz“ by šiel proti nemu, preto som ho z opravy vyradil. Odporúčam 20–30 Hz v pokoji (krok 0,10–0,15 px) namiesto 12 Hz (0,25 px).
3. **KF-05, dve tvrdenia.**
   - (a) „Fronta je FIFO, cieľ skoku čaká za susedmi“ je nadhodnotené. keepAround nahráva najprv cieľ, susedov až keď je cieľ hotový (film.js:762–764). drop() preskočené zábery zruší (film.js:532) a ich joby skončia hneď pri kontrole live() (film.js:478, 515). Stav „kava-m sa načítava“ v logu auditu je snímka pred spustením keepAround.
   - (b) „Telefón vždy berie 1448 px“ platí len pri DPR_MAX 2. pickSize (film.js:426–432) pri dpr ≤ 1,75 vyberie 1086, takže bod opravy 5 už je v kóde (okrem toho, že s.w drží väčšiu načítanú veľkosť).
4. **KF-08, veľkosť.** 183,5 ms na getProgramParameter(ACTIVE_UNIFORMS) je čakanie na zahltený grafický proces SwiftShadera. compileAsync už počkal na COMPLETION_STATUS, takže na skutočnej grafike ide o synchrónny dotaz rádovo v ms. Oprava je lacná, závažnosť nízka.
5. **KF-11, znenie.** Strih popredie číta odchádzajúci záber cez textureLod (film.js:904), takže mipmapy jedného z render targetov potrebuje. Zbytočné sú len pri prelínaní (kind 0) a pri prichádzajúcom zábere popredia. Na telefóne je kind 0 len sala>stol a nábehy po skoku, takže úspora je malá.
6. **KF-09, oprava.** Testovací kontext vzniká s predvolenými atribútmi (antialias true, alpha true). Ak sa odovzdá do THREE.WebGLRenderer, three ich prevezme. Kontext preto treba vytvoriť hneď s atribútmi renderera, inak sa zapne MSAA a alfa plátna.
7. **KF-06, posilnené.** Audit v stránke videl najviac 1 celé nahratie na snímku. Ja som zachytil dve po sebe v jednej snímke (21,8 + 16,9 = 38,7 ms pri t = 9 795 ms), presne podľa slučky `k < 2` na film.js:689.

### Merania (čísla)
**KF-01**
- beh1, ťuk Menu → Služby (plynulý skrol): logika skoku |T−S| > 1,5 sa spustila uprostred natívneho skrolu (S 1 → 4,372 pri y = 2 525). V pixeloch je stred 100 % tmavý (jas 0,031) 1 223 ms, film v šere 1 367 ms. Snímka `beh1/menu-sluzby-harok.jpg`: úplne čierne okno, potom karta „Čo to bude dnes?“ na čiernom.
- skok1, ťuk na logo (#uvod) zo spodku: film v šere 4 150 ms. Snímka `logo-hore-harok.jpg`: 100 % čierna snímka, potom karta úvodu na čiernom.
- beh1, scrollTo(0,0): film v šere celých 5,4 s okna.
- Odhad pre telefón zo zložiek:

| Zložka | Hodnota |
|---|---|
| sieť (keď fotka nie je v cache) | ~0,5 s pri Fast 4G (330 kB AVIF) |
| dekódovanie (CPU 4×) | 76 ms |
| 11 pásov fotky + 6 pásov hĺbky (pás 7,4 ms > rozpočet pump 4 ms) | ≥ 13 snímok ≈ 220 ms |
| zjemnenie | 1–3 snímky |
| fin 450 ms, z toho úplná tma pri mix < 0,55 | ≈ 250 ms |
| **spolu** | **0,55–1,1 s čiernej** |

**KF-02 (kf02b)**
- sala-rano bolo pripravené 6,4 s a film bol napriek tomu stále čierny: 95 % stredu, jas 0,055.
- Šero trvalo spolu 10,1 s, kým sa nenačítal kreslo-stred.

**KF-03**
- Počas straty: world-in, 0 viditeľných záloh, plátno má opacity 1, 89 % stredu tmavé.
- Po obnove film ešte 350 ms v šere.

**KF-04**
- 74/74 (CPU 1×) a 60/60 (CPU 4×) snímok prehliadača za 10 s malo kreslenie filmu.
- JS medián 1,7 ms, p95 5,9 ms (CPU 4×).
- Za 1 s sa zmení 5,5–8,6 % pixelov o viac ako 8 úrovní.
- Výpočet: najväčší posun 0,049 px na snímku pri 60 Hz (2,96 px/s).

**KF-05 (CPU 4×; CPU 1× v zátvorke)**
- Pás z ImageBitmap 7,4 ms medián (1,2), najdlhší pás fotky 10,5 ms medián / 15,7 ms max, spolu 73,8 ms (10,9).
- Pás z Uint8Array 1,5 ms (0,3), spolu 14 ms (3,2).
- Celá fotka jedným volaním 70,6 ms.
- V stránke malo 55 z 269 snímok filmu viac ako 8 ms nahrávania, najviac 49,2 ms.

**KF-06**
- Celá snímka 720×1280 sa nahráva 18,6 ms medián, 24,3 ms max (CPU 4×), 3,6 ms (CPU 1×).
- V stránke 16 celých nahratí, medián 18,7 ms, max 26,8 ms; dve v jednej snímke = 38,7 ms.

**KF-07**
- Telefón: 176,2 M vzoriek (polomery 16/25). Počítač: 29,9 M. Mriežka 226×402: 4,7 M. Prechod strihu: 15,8 M.
- SwiftShader: 2,2–3,3 s / 0,65–1,55 s / 142–295 ms / 202–361 ms.
- Pomer 11,2× voči prechodu strihu a 12,1× voči rozlíšeniu mriežky.
- Slučka beží vždy 81 iterácií × 4 prechody (vzorky preskakuje cez continue).

**KF-08**
- Nový program v snímke filmu pri prvom strihu do sekvencie (t = 10 747 ms): synchrónny dotaz 183,5 ms.
- FRAG pri prvom snímku 2,5 ms; predohrev mimo snímok 56,8 / 72 ms.

**KF-09**
- Testovací kontext 39,8 ms (beh1), 612,5 ms (CPU 1×), LoAF 651 ms (skok1).
- Po dotyku LoAF 485,6 ms (blokovanie 372,7 ms), z toho import.then film.js 349 ms (beh1); 497 / 316 ms (skok1); 85 / 76 a 152 / 130 ms (CPU 1×).
- Potom úloha compileAsync (poll „n“) 105–211 ms.

**KF-10**
- Spomalené prechody 0,1×: faktor obrazu 0,38 pri 616 ms, pod 0,6 od 554 do 777 ms.
- Opacity z rAF pri 610 ms: plátno 0,187, záloha 0,218, obraz 0,36. Analyticky minimum 0,346.

**KF-11**
- 51 z 269 snímok filmu (beh1) malo 2× generateMipmap (oba render targety), 2 snímky 3×.

**KF-12**
- WebKit main, NavigatorBase.cpp:195: `numberOfProcessorCores() < 8 ? 4 : 8` (iPhone = 4).
- Safari ani Firefox nemajú deviceMemory, takže brána počíta s 8 GB.
- DPR v behoch klesol na 1,75 / 1,5.

### Odporúčané poradie (dopad)
1. **Čierne okná: KF-01 + KF-02 + KF-03 spolu.** LQIP pre každý záber, náhradný záber vrátane path[k−1], nikdy clear bez obsahu, záloha pri strate kontextu. Dopad: zmiznú čierne okná 0,5–1,1 s (telefón) pri skoku, švihu a návrate na kartu.
2. **Zasekávanie: KF-05 + KF-06 + KF-07.** Pásy z Uint8Array alebo prispôsobivá výška pása, najviac 1 snímka sekvencie po pásoch, zjemnenie hĺbky pri stavbe. Dopad: práca s textúrami na snímku ~10 ms → ≤ 3 ms pri CPU 4×, preč špičky 38–49 ms a GPU skok pri každom zábere.
3. **KF-10.** Jeden riadok CSS. Preč stmavnutie na 38 % pri štarte filmu.
4. **KF-09, KF-04, KF-08, KF-11, KF-12.** Štart filmu bez dlhých úloh, menej kreslenia v pokoji, predohrev programov, menej mipmáp, záchranná brzda.

KF-01 sa prekrýva s nálezom č. 1 auditu čiernych okien. V pláne ich treba zlúčiť do jednej dávky.

### Nástroje (opakovateľné pred/po)
Server spustiť v `hs2` príkazom `python3 -m http.server 8433`. Príkazy:
- `node over-film.mjs --port=8433 --cpu=4 --net=fast4g --out=beh1`, potom `python3 sero.py beh1/vysledok.json` a `python3 tma.py beh1/menu-sluzby --od=<scen.od>`
- `node over-skok.mjs --port=8433 --cpu=4 --net=fast4g --dpr=3 --out=skok1 --cakaj=20000`
- `node over-kf02.mjs --port=8433 --cpu=1 --out=kf02b`
- `node over-film.mjs --port=8433 --cpu=1 --net=none --scen=nic --pomaly=0.1 --out=beh-odov-pomaly`, potom `python3 odovzdanie-pixely.py beh-odov-pomaly --pomaly=0.1`
- `node over-pokoj.mjs --port=8433 --cpu=1|4` a `python3 pohyb.py`
- `node nahratie.mjs --port=8433 --cpu=4 --opakuj=5`
- `node zjemnenie-over.mjs --port=8433 --opakuj=5`

Zdroje (KF-12): [WebKit NavigatorBase.cpp (raw)](https://raw.githubusercontent.com/WebKit/WebKit/main/Source/WebCore/page/NavigatorBase.cpp), [caniuse hardwareConcurrency](https://caniuse.com/hardwareconcurrency), [staršia verzia Navigator.cpp](https://webkit.googlesource.com/WebKit/+/4a8d297ef526789630720c27e2d88520c2d3ef54/Source/WebCore/page/Navigator.cpp).