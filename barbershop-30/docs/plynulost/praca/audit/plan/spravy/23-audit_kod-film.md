# Kód filmu (assets/film.js + brána v index.html): plynulosť na telefóne a čierne okná

## Zhrnutie
Väčšina čiernych okien a zásekov filmu má štyri príčiny v kóde:
1. **Film nikdy nekreslí zástupný obraz.** Keď záber nie je v grafike, plátno sa vyčistí na farbu `--ink` (#0e0d0c). Statické zálohy sú po `world-in` skryté natrvalo. Pri skoku sa film navyše zámerne „rozsvieti zo šera“.
2. **Strata WebGL kontextu nemá zálohu.** Celý čas straty je obrazovka čierna.
3. **Film kreslí v pokoji plnou frekvenciou 3 minúty.** Pohyb kamery je pritom 0,04 px za snímku.
4. **Práca s textúrami beží na hlavnom vlákne.** Pásy fotiek (4–13 ms za pás pri CPU 4×), až 2 celé snímky sekvencie za snímku displeja, zjemnenie hĺbky za behu (na telefóne 10,5× drahšie ako prechod strihu), program sekvencie sa prekladá až uprostred skrolu a pri prvom dotyku vzniká dlhá úloha.

Navrhnuté opravy sú lokálne v film.js a style.css, plus jeden krok pri stavbe: náhľady LQIP a vopred zjemnené hĺbkové mapy.

## Metodika
- Prostredie: Chrome headless shell (Playwright) s WebGL cez SwiftShader. Emulácia 390×844, DPR 3, dotyk; CPU 4× cez CDP `Emulation.setCPUThrottlingRate`; sieť Fast 4G (latencia 165 ms, 8,1 Mb/s, rovnaké nastavenie ako audit cierne-okna). Server `python3 -m http.server 8248` v hs2, adresa `/barbershop-30/?film=on&uvod=off` (prológ: `?film=on&uvod=znova`).
- Ako sa merala práca filmu:
  - časy volaní WebGL v každej snímke rAF (`inst.js`, vkladá sa cez `addInitScript`);
  - živá pamäť textúr a renderbufferov (alokácie mínus uvoľnenia);
  - snímky „šera“: film do plátna len zavolal `clear` a nič nenakreslil; v tej snímke sa zapíše stav filmu (S, T, záber, ktorý chýba);
  - dlhé úlohy a dlhé animačné snímky (LoAF) so zdrojom skriptu.
- Mikromerania nahrávania textúr: `textury.mjs` a `volby.mjs` (A/B, 7 kôl).
- Program sekvencie: `programy.mjs`. Uvoľňovanie bitmáp: `bitmapy.mjs`. Zjemnenie hĺbky: `zjemnenie.mjs`. Odovzdanie zálohy do filmu: `odovzdanie.mjs`. Pohyb kamery v pokoji: `pokoj-pohyb.py`.
- Obmedzenia merania:
  - Časy GPU zo SwiftShaderu nie sú časy telefónu. Používam z nich len pomery.
  - Časy hlavného vlákna (JS a príprava dát pre WebGL) sú zmysluplné.
  - Počas merania bežali súbežne iné audity, preto uvádzam rozsahy z viacerých behov.

## Merania (CPU 4×, telefón, hlavné vlákno)

| zdroj | rozmer | MB RGBA (+ mipmapy) | celé nahratie | pásy spolu / najdlhší pás | pásy z Uint8Array | dekódovanie (mimo hlavného vlákna) |
|---|---|---|---|---|---|---|
| záber telefónu | 1448×2575 | 14,9 (19,9) | 41–77 ms | 43–66 / 10,6–13,3 ms (11 pásov) | 13,6 / 3,3 ms | 50–150 ms |
| záber telefónu 1086 | 1086×1932 | 8,4 (11,2) | 39–41 ms | 33 / 5,7–7 ms | – | 29–66 ms |
| hĺbka telefónu | 768×1366 | 4,2 | 24–28 ms | 11 / 3,4 ms (6 pásov) | 4 / 1,1 ms | 20 ms |
| snímka sekvencie | 720×1280 | 3,7 | texImage2D 13,8 ms, texSubImage2D 15–18 ms | 6,6–9,2 / 2,9–4 ms | 3,2 / 1,6 ms | 16–40 ms |
| počítač | 2172×1448 | 12,6 (16,8) | 33–67 ms | 47–56 / 12–14 ms | 8,8 / 3,5 ms | 40–88 ms |
| prológ počítač | 4096×2731 | 44,7 (59,7) | 181–224 ms | 148 / 27,8 ms | 129 / 41 ms | 399 ms |

- `generateMipmap` stojí na hlavnom vlákne ~0 ms (je to práca GPU).
- Voľby `createImageBitmap` (`premultiplyAlpha:'none'`, `colorSpaceConversion:'none'`) nedali merateľný zisk (±10 %).
- `resizeWidth` je pomalší pri dekódovaní (204 ms oproti 150 ms). Lepšie je použiť hotové súbory 1086.

Meranie na stránke (telefón, CPU 4×, Fast 4G):

| oblasť | výsledok |
|---|---|
| Prvý dotyk | LoAF 179–685 ms; z toho „import.then film.js“ 142–651 ms, blokovanie 111–609 ms; potom úlohy prekladu 54–100 ms. Prvý snímok filmu 2,1–3,1 s po dotyku. |
| Testovací kontext (film.js:100) | 168–279 ms na hlavnom vlákne po FCP (4 behy); potom sa zahodí. |
| Prológ | 31 zo 72 snímok filmu nesie pás; práca filmu na snímku: medián 8,1 ms s pásom oproti 1,8 ms bez neho. |
| Pokoj (10 s bez vstupu) | Film kreslí každú snímku: 274/274 pri CPU 1×, 44/44 pri CPU 4×. JS 0,4 ms (CPU 1×) / 2,3 ms (CPU 4×) na snímku plus celoplošný prechod na GPU. |
| Skrol strednými švihmi | 138 pásov v 75 snímkach; 38 celých nahratí sekvencie (p50 2,9 ms, p95 16,6 ms, max 17,4 ms); šero 0. |
| Šero | skok hore 900 ms (beh 1) a 5 000 ms (beh 2, zahltený SwiftShader); skok z menu na #sluzby 2 933 / 1 017 ms (snímka 150 ms po skoku: 86 % tmavých dlaždíc); rýchly presun ~870 ms, hoci susedný záber bol pripravený; strata kontextu: celý čas čierno (73 % tmavých dlaždíc), po obnove ešte 246–267 ms. |
| Program sekvencie | prvé použitie až počas skrolu: 70 ms, v zaťaženom behu 775 ms (`getProgramParameter`). |
| Pamäť | živá pamäť grafiky max 140 MB (skrol, DPR ≤ 2; pri DPR 2 ešte asi +18 MB render targety); dekódované ImageBitmap naraz max 52 MB; únik nepotvrdený (264 vytvorených, 264 zavretých). |
| Odovzdanie záloha → film | 456 ms po `world-in` je viditeľných 35 % obrazu (záloha 0,18, plátno 0,21); pod 60 % približne 456–640 ms. |
| Zjemnenie hĺbky | telefón 176 M vzoriek, počítač 30 M, prechod strihu 16 M; pomer v SwiftShaderi telefón : prechod strihu = 1917 : 183 ms (10,5×); návrh v rozlíšení mriežky (226×402) 135 ms. |
| Pohyb kamery v pokoji | najviac 0,041 px plátna za snímku 60 Hz (2,4 px/s). Pri kreslení 10–15 Hz by bol krok 0,16–0,24 px. |

## Čo sa nepotvrdilo
- **Pásy nekonvertujú zakaždým celú bitmapu.** Súčet pásov ≈ celé nahratie, takže samotné delenie na pásy nie je chybou. Problémom je, že každý pás stojí 4–13 ms.
- **Voľby `createImageBitmap` nie sú riešením** (±10 %).
- **Únik ImageBitmap pri zrušenom načítaní** (Promise.all, film.js:517–518) sa pri 12 rýchlych švihoch neprejavil: 264/264 zavretých.
- **three r169 `compile()` prekladá aj neviditeľné siete** (traverse). Problémom je len prvé použitie programu, ktoré čaká na zoznam uniformov.

## Riziká na overenie na zariadení (iPhone, Safari)
Tieto body som tu nevedel overiť:
- WebKit pravdepodobne dekóduje `createImageBitmap(blob)` na hlavnom vlákne.
- Video 2×2 px s `opacity: 0` (style.css:1170) môže Safari pozastaviť ako neviditeľné tiché automatické prehrávanie. Zostal by plagát.
- Strata kontextu po návrate na kartu v Safari bez obnovy: s dnešným kódom navždy čierno (nález KF-03).
- Celková pamäť na iPhonoch s 2–3 GB RAM (asi 160 MB grafiky a 52 MB bitmáp naraz).

## Odporúčané poradie opráv a odhad dopadu

| poradie | nález | oprava | čo sa zmení |
|---|---|---|---|
| 1 | KF-01, KF-02, KF-03 | Zástupný obraz namiesto šera: LQIP textúra pre každý záber od štartu (asi 70 kB grafiky spolu) a LQIP aj ako pozadie `.film-still`; nikdy `clear` bez obsahu; náhradou je najbližší pripravený záber ±1, inak LQIP; pri strate kontextu trieda, ktorá ukáže zálohy, a po 3 s `stop()`. | Čierne okná z filmu ~0 ms (dnes 0,9–5 s). |
| 2 | KF-04 | Kreslenie v pokoji najviac 12 Hz, alebo len pri posune ≥ 0,25 px; počas skrolu strop 60 Hz. | GPU a CPU v pokoji −80 až −95 %, chladnejší telefón, stabilnejší skrol. |
| 3 | KF-05, KF-06, KF-07 | Rozpočet nahrávania ≤ 2–3 ms za snímku (prispôsobivá výška pása); Uint8Array z workera (3× lacnejšie pri fotke telefónu); priorita podľa vzdialenosti od polohy filmu; sekvencia 1 nahratie za snímku do vopred vyhradeného kruhu textúr; hĺbka zjemnená vopred v rozlíšení mriežky. | Bez snímok > 33 ms od textúr; −3,8 MB grafiky na záber; bez skokov GPU pri hotovom zábere. |
| 4 | KF-08, KF-09, KF-10 | Predohrev oboch programov záberu; jeden kontext namiesto dvoch a štart po kúskoch; plátno pri `world-in` hneď nepriehľadné. | Bez dlhých úloh pri prvom dotyku a strihu; bez stmavnutia pri odovzdaní. |
| 5 | KF-11, KF-12 | Mipmapy render targetov len pre strihy, ktoré ich čítajú; zmeny DPR s hysterézou mimo skrolu; záchranná brzda: ľahká verzia pri trvalo pomalých snímkach; rozpočet pamäte na telefóne. | Menšia záťaž GPU pri strihoch, menšie riziko pádu karty na iOS. |

Regresné testy (pred aj po oprave tou istou metódou):
- `film-stopa.mjs`: pole `sero.okna` a `seroStav` musí byť pri skokoch prázdne; pri `pokoj` musí `snimokFilmu` klesnúť ~5×.
- `programy.mjs`: žiadne „prvé useProgram“ po prvom snímku filmu.
- `odovzdanie.mjs`: minimum obrazu ≥ 0,95.
- `textury.mjs` / `volby.mjs`: cena nahrávania.