# Rozbor: filmová a 3D vrstva na iPhone (Safari) – D1 a BALÍK

Oblasť: `assets/film.js`, `assets/vendor/three.module.min.js`, hĺbkové mapy, sekvencie `assets/seq/*`, video v plátne,
prechody, rozlíšenia. Bez prehliadača a bez servera; dôkazy sú `súbor:riadok` a výstupy `wc`, `file`, `gzip`, `python3 -I`.

- **D1** = `hs-pred-d1/barbershop-30` (commit 7ea247c), verzia, ktorú majiteľ videl.
- **BALÍK** = `hs-chatgpt/barbershop-30` (D1 + D2 až D5 + D6, D7, admin).

Pomocné súbory v tomto priečinku:
- `porovnanie/cakaren-ramovanie.png`: zľava pokojná verzia (cover), snímka majiteľa, rámovanie filmu 1,24×.
- `.diff-film.txt`: celý `diff -u` súboru film.js medzi D1 a BALÍKom.

---

## 0. Výsledok v skratke

1. **Čo beží na iPhone majiteľa.** Snímka Čakárne má rámovanie filmu (presah 1,24×), nie rámovanie pokojnej
   verzie (cover). Porovnanie je v `porovnanie/cakaren-ramovanie.png`. Hlavička teda dala triedu `world`
   (`index.html:12`). Telefón tak dostal WebGL film alebo aspoň jeho zálohy v rámovaní filmu.
   - Telefón má šírku 430 CSS px (snímka 1290 × 2796 px pri DPR 3), nie 390. Merať treba obe šírky.
2. **„Zasekané“ (D1).** Na hlavnom vlákne Safari sa robí všetka práca s obrázkami:
   - rozbalenie AVIF 1448 × 2575 cez `createImageBitmap` (`film.js:433–439`),
   - nahrávanie pásov do grafiky zo `ImageBitmap` (`film.js:467–492`),
   - mipmapy fotky aj oboch cieľov prechodu (`film.js:487`, `793`),
   - sekvencie: až dve celé snímky 720 × 1280 za snímku displeja (`film.js:687–694`).

   Film navyše kreslí plnou frekvenciou ešte 3 minúty po poslednom dotyku (`film.js:982–984`, `1247`, `1277`).
   Telefón sa zahreje a spomalí.
3. **„Fotky neúplné“ (D1).** Má dve príčiny.
   - **Výrez:** telefón ukáže len asi 24 % šírky pôvodnej fotky (výrez `-m` má 37,5 % šírky a z neho je pri 1,24×
     vidno 63,5 %). Počítač ukáže asi 77 % šírky. Zdroj: `film.js:769`, `style.css:480–494` a výpočet v časti 2.4.
   - **Čakanie na textúru:** kým textúra nie je hotová, D1 vymaže plátno na farbu `--ink` (`film.js:1106`, `1112`).
     Zálohy sú pritom skryté (`style.css:506–510`), takže vznikne čierne okno.
4. **BALÍK** rieši čierne okná (náhľad, posledný obraz, strata kontextu) a rozbalenie presúva do workera.
   Tým však vznikajú nové viditeľné javy:
   - Namiesto čiernej plochy ukazuje **rozmazaný náhľad 32 px** (`img/film/nahlady.json`) a ostrá fotka sa doň
     prelína 450 ms (`film.js:1138`, `1171`). To je presne „dokresľovanie“.
   - Ostrá fotka sa nahráva **len jeden pás za snímku** (16 až 128 riadkov, `film.js:484`, `499`) a počas strihu
     **vôbec nie** (`film.js:511`). Fotka 1448 × 2575 tak potrebuje 21 až 161 snímok.
   - Sekvencie majú pri nahrávaní prednosť pred fotkami (`film.js:512`).
   - Záchranná brzda vypne film uprostred skrolu (`film.js:1262`). Zálohy potom preskočia z rámovania 1,24× na cover
     (`style.css:481`), teda viditeľný skok priblíženia.

   WebGL, hĺbka 112 × 200, strihy so shaderom a sekvencie na telefóne ostávajú. Zaťaženie telefónu teda nemení
   v podstate, len ho rozkladá.
5. **Návrh:** **ľahký režim pre telefón** bez WebGL, bez three.js a bez sekvencií:
   - tie isté fotky a výrezy `-m` v HTML `<img>`,
   - pohyb len cez CSS `transform` (kompozítor),
   - prechod cez `opacity`,
   - prvý obraz je fotka z HTML s nadpisom,
   - karty Poď ďalej, Remeslo a Tím ukážu tú istú fotku ako počítač (sala, stol, sala-rano).

   Podrobnosti sú v časti 4.

---

## 1. Čo presne beží na telefóne (D1)

### 1.1 Rozhodnutie, či film beží
| Krok | Dôkaz (D1) | Telefón |
|---|---|---|
| Hlavička: WebGL2, bez reduce-motion a saveData, výška > 500, `deviceMemory ≥ 4`, `hardwareConcurrency ≥ 4` | `index.html:12` | Safari `deviceMemory` nepozná (berie sa 8). `hardwareConcurrency` WebKit na iOS orezáva; podľa rámovania na snímke podmienka na iPhone majiteľa prešla. **Treba zmerať** hodnotu (bod M1). |
| Prológ (fasáda, chôdza k dverám) raz za návštevu | `index.html:15`, `film.js:111`, `1288` | pri prvej návšteve áno; nečaká na pohyb, sťahuje fasádu aj rohožku hneď (`film.js:119`, `124`) |
| Kontrola grafiky po prvom vykreslení | `film.js:90–106` | druhý WebGL kontext len na test, potom `loseContext` |
| Import three.js a štart | `film.js:133`, `1494–1511` | 687 458 B surový, 169 614 B gzip (`wc -c`, `gzip -9c \| wc -c`); film.js 103 839 B, gzip 37 496 B |
| Telefón = `max-width: 720px` alebo dotyk a kratšia strana ≤ 720 | `film.js:136` | áno |

### 1.2 Plátno a rozlíšenie pri DPR 3
- `DPR_MAX = min(devicePixelRatio, 2)` (`film.js:316`), takže pri DPR 3 kreslí v 2×. Plátno má výšku `100lvh`
  (`style.css:413–416`).
  - 390 × 844: 780 × 1688 px (1,32 Mpx).
  - 430 × 932 (majiteľ): 860 × 1864 px (1,60 Mpx).
- Adaptívne zníženie rozlíšenia o 0,25 až na 1× (`film.js:1171–1186`). Meranie sa vynechá, keď sa nahráva
  (`film.js:1174`); pri trvalých sekvenciách teda dlho nezasiahne (T10 v PLAN.md).
- Mriežka záberu 112 × 200 buniek = 22 400 štvoruholníkov, vrcholový shader číta hĺbku (`film.js:327–341`).
  V prechode sa kreslia dva zábery do dvoch cieľov plátna a potom skladací shader (`film.js:1113–1147`).
- Ciele prechodu `rtA` a `rtB` majú veľkosť plátna **s mipmapami**, ktoré three generuje po každom kreslení do nich
  (`film.js:793`). Počas každého strihu teda vzniknú 2 × generateMipmap z 1,6 Mpx v každej snímke.
- Kreslí sa každá snímka ešte 3 minúty po poslednom dotyku (dýchanie kamery): `film.js:982–984`, `1001–1004`,
  `1248`, `1277`. Telefón v pokoji teda stále počíta grafiku a zahrieva sa, čo vedie k zníženiu taktu.
  Majiteľ to vníma ako postupné „zasekávanie“. **Treba zmerať** (M6).

### 1.3 Textúry a pamäť (výpočet z rozmerov súborov)
Rozmery sú prečítané z hlavičiek AVIF a WebP (`python3 -I`, box `ispe` a hlavička VP8):

| Súbor (telefón) | Rozmer | Veľkosť | RGBA v pamäti |
|---|---|---|---|
| `cakaren-m-1448.avif` (podobne sala-rano, kreslo-stred, sud, vstup, rohozka) | 1448 × 2575 | 200–437 kB | 14,2 MB (s mipmapami asi 19 MB) |
| `stol-m-1448.avif` / `kava-m-1448.avif` | 1152 × 2048 / 1229 × 2185 | 150 / 151 kB | 9,0 / 10,2 MB |
| `*-m-1086.avif` | 1086 × 1931 | 107–212 kB | 8,0 MB |
| `*-m-hlbka.webp` | 768 × 1366 | 7–13 kB | 4,0 MB (+ 2 ciele zjemnenia za behu) |
| `seq/vstup-dnu/f000…f050.avif` | 720 × 1280 | spolu 1 990 kB (51 ks, priemer 39 kB) | 3,5 MB na snímku |
| `seq/okolo-kresla/*.avif` | 720 × 1280 | spolu 1 568 kB (44 ks) | 3,5 MB na snímku |
| `video/tim-slucka-864.mp4` | 864 × 1536 | 3 402 635 B | textúra videa 5,3 MB |

- **Výber veľkosti:** `pickSize` (`film.js:426–432`) chce `need = pw/vw × canvas.width`. Pre výrez 0,5625 na
  telefóne je `pw/vw ≈ 1,51` (presah 1,24, `film.js:769`, `776–778`). Pri 780 px to je asi 1 177 px, takže sa vyberie
  **1448**, a to vždy, aj pri DPR 2.
- **V pamäti grafiky súčasne:** aktuálny záber, susedia a jeden ďalší v smere skrolu (`film.js:755–765`), teda
  4 × (19 + 4) MB. K tomu `rtA` a `rtB` (2 × asi 8,5 MB s mipmapami), plátno s hĺbkou, 6 snímok sekvencie
  (`film.js:639`, 21 MB) a video 5 MB.
  - Odhad: **140–155 MB grafiky na telefóne**. PLAN.md uvádza nameraný strop 140 MB v emulácii.
  - Navyše ten istý súbor 1448 rozbalí aj `<img>` zálohy (`index.html` `sizes="(max-width: 720px) 93vw"`,
    pri 430 × 3 = 1 199 px tiež 1448). Každá fotka je tak v pamäti dvakrát: raz ako obrázok stránky, raz ako textúra.
  - **Treba zmerať** na iPhone (M5). Hranica pamäte procesu WebContent vo WKWebView aplikácie Claude nie je známa.
    Pri prekročení Safari stratí WebGL kontext alebo obnoví stránku.

### 1.4 Rozbalenie AVIF: hlavné vlákno alebo nie
- D1: `fetch` → `blob` → `createImageBitmap(blob)` na hlavnom vlákne (`film.js:433–439`). Platí aj pre snímky
  sekvencie (`film.js:678`) a plagáty (`film.js:552–558`).
- V Chromiu rozbaľuje `createImageBitmap` mimo hlavného vlákna, preto to emulácia v Chromiu **nezachytí**.
- Vo WebKite sa `ImageBitmap` z blobu môže rozbaliť synchrónne pri vytvorení alebo až pri `texSubImage2D`.
  V oboch prípadoch na hlavnom vlákne.
- **Treba zmerať na skutočnom iPhone** (M2). Je to najpravdepodobnejšia príčina zásekov, ktoré tím v Chromiu
  nevidí:
  - 3,7 Mpx AVIF (1448 × 2575) pri každom zábere,
  - 0,9 Mpx AVIF pri každej snímke sekvencie.
- Nahrávanie po pásoch zo `ImageBitmap` s `UNPACK_SKIP_ROWS` (`film.js:480–483`, pás 256 riadkov, takže 11 pásov
  na fotku) môže vo WebKite pri každom páse spracovať celý obrázok, nie len pás. **Treba zmerať** (M2: trvanie
  jedného `texSubImage2D` pása v Timeline Safari).

### 1.5 Výmena rozlíšenia („dokresľovanie“)
- D1 neprepína medzi nízkym a vysokým rozlíšením toho istého záberu. Hneď nahrá 1448 a ukáže ho až celý
  (`film.js:521–527`). Zväčšenie (`upgrade`) nastane len pri otočení telefónu (`film.js:510–515`).
- Viditeľný nábeh: nová fotka sa prelína 450 ms (`film.js:1064`, `1107–1109`). Kým nie je hotová, ostane
  posledný obraz suseda, alebo **prázdne plátno farby --ink** (`film.js:1105–1106`, `1112`). Zálohy sú pritom
  skryté (`style.css:506–510`, `1116–1119`).
- Pri skoku (menu, „Späť hore“, rýchly švih `|T−S| > 1,5`) sa ide **zo šera** (`film.js:1243`, `1109`). To sú
  čierne okná z PLAN.md (CO-1, CO-5).

### 1.6 Sekvencie viazané na skrol
- Na telefóne sú karty Poď ďalej (`sala`, 51 snímok) a Remeslo (`stol`, 44 snímok) sekvencie
  (`index.html:209–210`, `233–234`). Na počítači sú to fotky (`film.js:242`, predvolené `data-video-on="phone"`).
  Telefón teda **vyzerá inak než počítač**.
- Poloha v sekvencii `ft = shotT × (n−1)`, `shotT` beží cez 1,32 dĺžky medzi kotvami (`film.js:684`, `729`).
  - Pri medzere kotiev 1 obrazovka (932 px) to je asi 51 / (1,32 × 932) = 0,041 snímky na px.
  - Pri švihu 2 000 px/s to je **asi 80 snímok sekvencie za sekundu**, a každú treba rozbaliť (AVIF 720 × 1280)
    a nahrať (3,5 MB).
  - D1 nahrá až **2 celé snímky za snímku displeja** cez `tex()` a `initTexture` (`film.js:687–694`).
    PLAN.md uvádza nameraných 38,7 ms.
  - Rozbalenie dopredu je obmedzené na 3 čakajúce (`film.js:702–705`). Pri rýchlom skrole sa preto prelína
    medzi vzdialenými snímkami (`film.js:718–724`), čo vyzerá ako trhaný pohyb.
  - **Treba zmerať** skutočný počet rozbalení za sekundu (M4).
- Sťahovanie: všetkých 51 + 44 snímok (3,56 MB AVIF) sa stiahne a drží ako bloby (`film.js:645–663`).

### 1.7 Video tímu v plátne
- `sala-rano` má na telefóne `tim-slucka-864` v režime `play` (`index.html:282–283`). Súbor 3,4 MB sa stiahne
  celý ako blob (`film.js:576–584`). Každá snímka videa ide do textúry (`film.js:599–611`).
- V úspornom režime iPhone sa video nespustí a ostane plagát 864 × 1536 (`film.js:749`). Pri DPR 3 je plagát
  mäkký: 864 / 1290 = 0,67 rozlíšenia displeja.

### 1.8 Strata WebGL kontextu a pamäť na iOS
- D1: `webglcontextlost` nastaví `lost = true` a zastaví kreslenie (`film.js:1419`). Plátno ostane prázdne,
  zálohy sú stále skryté (`world-in`), **bez časového limitu**. Čierna plocha ostane až do obnovy, ktorá na iOS
  nemusí prísť (`film.js:1420–1424`).
- Spúšťače na iOS: návrat do aplikácie alebo na kartu, tlak na pamäť (1.3). **Treba zmerať** (M5).

### 1.9 Prechod medzi scénami
- Strih (`film.js:1113–1147`) kreslí oba zábery do textúr plnej veľkosti s mipmapami a skladá ich shaderom so 6
  vzorkami rozmazania na telefóne (`film.js:799–803`).
- Prechod trvá 16–30 % cesty medzi kotvami (`film.js:1084`). Pri pomalom nahrávaní ďalšej fotky sa namiesto strihu
  ukáže šero (1.5).

### 1.10 Prvý obraz (súvisí s „čiernou obrazovkou na začiatku“)
- Pri prológu hlavička vloží zálohu fasády (`index.html:154–175`, šablóna `still-vstup`).
- Predbežne sa načíta **len AVIF** variant (`index.html:21`, `l.type='image/avif'`).
- Film štartuje bez čakania na pohyb a hneď sťahuje dve fotky 1448 (`film.js:119`, `124`, `1257–1260`).
- Snímka `majitel-iphone-cierny-start.png` ukazuje čiernu plochu bez nadpisu, so spodnými tlačidlami. Presná príčina
  skrytia nadpisu nie je vo filmovej vrstve (rieši iný tím). Za filmovú vrstvu platí: na telefóne nemá prológ
  zdržiavať prvý obraz a nemá sťahovať nič okrem prvej fotky.

---

## 2. Príčiny majiteľových javov podľa stromu

### 2.1 Zasekávanie
| Príčina | D1 | BALÍK |
|---|---|---|
| Rozbalenie AVIF na hlavnom vlákne | áno (`film.js:433–439`, `678`) | presunuté do workera (`film-worker.js:18–26`, `film.js:415`); záloha bez workera ostáva (`film.js` časť `bitmap`, diff riadky 196–204) |
| Nahrávanie fotky do grafiky | pásy 256 riadkov zo `ImageBitmap`, limit 4 ms na snímku (`film.js:460–497`, `1212`) | jeden pás 16–128 riadkov z `Uint8Array` za snímku (`film.js:484`, `499`); pri strihu nič (`film.js:511`) |
| Sekvencie | 2 celé nahratia za snímku (`film.js:687–694`) | 1 celé nahratie 720 × 1280 za snímku (`film.js:484`, `sequence ? bmp.height`), kruh 4 textúr (`film.js:685`) |
| Mipmapy cieľov strihu | každá snímka strihu 2× (`film.js:793`) | len pri strihoch, ktoré čítajú LOD (`film.js:853`, `finishTarget`) |
| Zjemnenie hĺbky za behu (4 priechody GPU) | áno (`film.js:382–398`) | nie, `*-hlbka-z.webp` 224 × 398 (`film.js:533`) |
| Dva WebGL kontexty pri štarte | áno (`film.js:100–104` + `305`) | jeden (`film.js` diff riadky 16–31, 66–72) |
| Kreslenie 3 min po dotyku | áno (`film.js:984`) | áno (`film.js:1058`) |
| DPR 2 pri DPR 3 displeja | `film.js:316` | `film.js:322` |

### 2.2 Neúplné a rozmazané fotky
- **D1:** výrez (2.4) a čierne alebo šeré okná pri čakaní (1.5).
- **BALÍK:** náhľady 32 × 20 / 32 × 57 px (`img/film/nahlady.json`, 8 739 B, pole `width: 32`) sa kreslia cez celé
  plátno, kým nie je ostrá fotka (`film.js:1171`). Ostrá fotka sa doňho prelína 450 ms (`film.js:1138`).
  - Nahrávanie je spomalené: jeden pás za snímku, počas strihu nič (`film.js:509–513`), sekvencia má prednosť
    (`film.js:512`).
  - Preto bude rozmazaný náhľad vidieť **dlhšie a častejšie** než šero v D1, hlavne hneď za kartami so sekvenciou
    (Čakáreň je za Remeslom: `index.html` poradie sala → stol → cakaren).
  - Výsledok: fotka „sa dokresľuje“. Na telefóne pri 120 riadkoch na snímku trvá fotka 2 575 / 120 ≈ 21 snímok.
    Pri predvolených 64 riadkoch to je 40 snímok (0,67 s pri 60 Hz), bez snímok strihu.
  - **Treba zmerať** (M3).

### 2.3 Čierne okná
- **D1:** `renderer.clear()` bez obsahu (`film.js:1106`, `1112`), skok zo šera (`film.js:1243`, `1109`), strata
  kontextu bez limitu (`film.js:1419`).
- **BALÍK:**
  - Rieši ich tak, že sa nikdy nemaže (`film.js:1171–1185`).
  - Pri strate kontextu dá `film-strata`, zálohy sa vrátia (`style.css:507`) a po 3 s `stop()` (`film.js:1541`).
  - Plátno nemá prechod nepriehľadnosti (`style.css:417`).

### 2.4 Výrez fotky na telefóne a na počítači (prečo pôsobí „neúplne“)
- Výrez `-m` má šírku 1536 z 4096 (37,5 %) pôvodnej fotky (`index.html:258` `data-m-size="1536x2731"` proti
  `data-size="4096x2731"`).
- Film pridá presah 1,24 a krok kamery `z0 = −0,04` (`film.js:769`, `style.css:481–488`).
  - Na 430 × 932 je vidno **63,5 % šírky a 77,4 % výšky výrezu**, teda asi **24 % šírky pôvodnej fotky**
    (výpočet v `python3 -I`, výstup `0.635 0.774`).
  - Pokojná verzia (cover bez presahu) ukáže 82 % šírky a 100 % výšky výrezu.
  - Počítač 1440 × 900 ukáže asi 77 % šírky a 73 % výšky celej fotky.
- Snímka majiteľa sedí na rámovanie filmu (`porovnanie/cakaren-ramovanie.png`): orezaný vrch pumpy aj buldog.
  Ľahký režim bez presahu ukáže o 29 % širší pohľad (0,82 / 0,635) z toho istého výrezu.

---

## 3. Čo zmenil BALÍK (D2–D5) a či rieši príčiny

| Zmena BALÍKa | Dôkaz | Rieši | Nové riziko na iPhone |
|---|---|---|---|
| Worker: fetch, `createImageBitmap`, OffscreenCanvas 2D, `getImageData`, prenos RGBA | `film-worker.js:1–30`, `film.js:415` | rozbalenie AVIF mimo hlavného vlákna | iOS < 16.4 nemá OffscreenCanvas 2D, takže ostane pôvodná cesta. Na hlavné vlákno prichádza 14,2 MB `ArrayBuffer` na fotku a 3,5 MB na snímku sekvencie. Pamäťové špičky: **treba zmerať** (M5). |
| Pásy z `Uint8Array`, adaptívna výška, max 128 na telefóne | `film.js:484`, `499` | kratšie snímky | fotka sa ostrí dlhšie; počas strihu stojí (`film.js:511`) |
| Náhľady 32 px vo filme | `film.js:569`, `1171` | žiadna čierna plocha | **viditeľne rozmazané fotky a dokresľovanie** |
| Kruh textúr sekvencie, 1 nahratie za snímku, SEQ_TEX 4 | `film.js:685`, diff riadky 447–472 | menej alokácií | celá snímka 3,5 MB v jednej snímke; prednosť pred fotkami (`film.js:512`) |
| Predpočítaná hĺbka 224 × 398 | `film.js:533`, `ls *-m-hlbka-z.webp` | žiadne zjemnenie za behu, −3,7 MB na záber | žiadne |
| Mipmapy cieľov len pri potrebe | `film.js:853` | menej práce v strihu | žiadne |
| Nekresliť pod nepriehľadným pásom | diff riadky 535–538, 739–746 | menej kreslenia | `getComputedStyle` vo `measure()` |
| Strata kontextu: zálohy, 3 s, world-off | `film.js:1541`, `style.css:507` | čierna plocha natrvalo | prepnutie rámovania (ďalší riadok) |
| Záchranná brzda: p90 > 33 ms pri DPR 1 počas 3 s → `stop()` | `film.js:1262` | trvalé zasekávanie | `quit()` dá `world-off`, `style.css:481` platí len pre `html.world:not(.world-off)`. Záloha preto **preskočí z 1,24× na cover** uprostred obrazovky (viditeľný skok). Brzda sa nezapne, kým sa nahráva fotka (`film.js` diff riadok 679), takže na iPhone môže prísť neskoro. |
| `rohozka` vždy v pamäti | `film.js:817` | rýchly návrat hore | +19 MB grafiky trvalo |
| Plátno a zálohy bez prechodu nepriehľadnosti | `style.css:417`, `509` | žiadne stmavnutie pri odovzdaní | žiadne |

**Záver:** BALÍK je lepší než D1 v čiernych oknách a v dĺžke jednotlivých snímok (v emulácii). Ostáva však:
- WebGL plátno 1,6 Mpx kreslené 3 minúty po dotyku,
- textúry 1448 (19 MB na záber) a dvojité rozbalenie (img + textúra),
- sekvencie s 80 snímkami za sekundu pri švihu,
- video ako textúra,
- 170 kB gzip three.js a jeho štart.

Na iPhone pridáva rozmazané náhľady. „Ľahké ako pierko“ to nie je, je to presunutie tej istej záťaže.

---

## 4. Návrh: ľahký režim pre telefón (rovnaký obraz, bez WebGL)

### 4.1 Zapnutie
- V hlavičke (`index.html:12`): ak `(pointer: coarse)` a kratšia strana ≤ 720, nastaviť `html.lahky` a nedať `world`.
  `film.js` potom skončí na `film.js:63` (`world-off`) **bez importu three.js**.
  - Ušetrí 687 kB (170 kB gzip) a štart, žiadny WebGL kontext.
- Ešte lepšie: modul `film.js` vložiť skriptom len pri `world`, nie natvrdo (`index.html:902`). Telefón tak
  nestiahne ani 37 kB film.js.
- Prológ na telefóne vypnúť (`index.html:15`, podmienka `world`). Prvý obraz bude rohožka z HTML s nadpisom.
- Predbežné načítanie (`index.html:21`) pre `-m` doplniť aj o WebP. Pre `lahky` brať `1086w` pri DPR ≤ 2 a
  `1448w` pri DPR 3.

### 4.2 Obraz: tie isté fotky a výrezy
- Zábery: tie isté súbory `img/film/<meno>-m-{1086,1448}.avif|webp` a body záujmu `--fmx/--fmy` (už sú v
  `<picture class="film-still">`). Žiadny nový obsah.
- Rámovanie: cover bez presahu 1,24, teda pravidlá `style.css:442–465` (pokojná verzia), nie `480–503`.
  - Ukáže 82 % šírky výrezu namiesto 63,5 %, čo priamo rieši „neúplné fotky“.
  - Ak majiteľ chce zachovať presné priblíženie filmu, stačí na `lahky` škálovať `scale(1.1)`. Odporúčam však cover.
- Karty so sekvenciou a videom (`sala`, `stol`, `sala-rano`) dostanú na telefóne **tie isté fotky ako počítač**
  (`sala-m`, `stol-m`, `sala-rano-m` už existujú a majú výrez). Telefón tak vyzerá ako počítač.
  - Voliteľne krátka slučka ako bežné `<video muted playsinline loop preload="none" poster>` mimo plátna:
    - spustiť len pri viditeľnosti (IntersectionObserver),
    - pri úspornom režime ostane plagát,
    - nikdy nie viazaná na skrol.
  - Zdroj 576/864 px je však na DPR 3 mäkký (1.7), preto ako predvolené odporúčam fotku.
- Typografia, texty a karty: bez zmeny (rieši ich `app.js` a CSS, nie film).

### 4.3 Pohyb a prechody len na kompozítore
- **Jemný pohyb:** CSS animácia `transform` podľa `data-mv` záberu, 8–10 s, `ease-in-out`, raz pri zobrazení karty
  (trieda z IntersectionObservera, nie zápis v každej snímke):
  - `in` / `near`: `scale(1)` → `scale(1.05)` / `1.02`,
  - `left` / `right`: `translateX(∓1.5%) scale(1.04)`,
  - `rise` / `down`: `translateY(±1.5%) scale(1.04)`.
  - Okolo bodu záujmu: `transform-origin: var(--fmx) var(--fmy)`, ako má D1 v `style.css:464`.
  - Nahrádza `--sp` z `app.js` (zápis do štýlu v každej snímke, PLAN.md bod 1).
- **Prechod medzi scénami:** existujúce pevné zálohy kariet (`style.css:1105–1117`) s triedou `is-shown`.
  `opacity` 0 → 1 za 400 ms (`transition`), nie `--so` z každej snímky skrolu. Prichádzajúca fotka začína na
  `scale(1.03)` a dobehne na 1, čím naznačí pohyb kamery dopredu.
- **Pamäť:** najviac 3 fotky rozbalené (aktuálna, predošlá, ďalšia).
  - Ďalšiu pred zobrazením `img.decode()` (BALÍK `app.js:214–252` to už rieši).
  - Vzdialené ostanú `display: none` (`style.css:1115`).
  - Pri 1448: 3 × 14,2 MB = 43 MB, namiesto 140–155 MB grafiky a k tomu obrázkov stránky.
- **Vinetácia:** ostáva CSS (`body::after`, `.film-still::after`, `style.css:1086–1100`, `1159–1161`), rovnaká ako
  dnes pri zálohách.

### 4.4 Čo stratíme vizuálne a ako to zmierniť
| Stratíme | Zmiernenie |
|---|---|
| Paralaxu z hĺbky (popredie sa hýbe viac než stena) | posun a priblíženie okolo bodu záujmu; pri `rise/down` aj mierny `translateY`. Rozdiel postrehne len pozorný divák. |
| Strihy švih, nájazd, popredie (rozmazanie pohybom, predmet cez obraz) | prelínanie 400 ms + nábeh `scale(1.03→1)`. Pri nájazde začať prichádzajúcu fotku od `transform-origin` bodu `b:` z tabuľky CUTS (`film.js:186–197`). |
| Prológ (chôdza k dverám a dnu) | na telefóne vynechať. Prvý obraz je rohožka s nadpisom (požiadavka 07:12). Fasáda ostáva ako záber Vstup v pätičke. |
| Sekvencie Poď ďalej a Remeslo (pohyb okolo kresla) | fotka ako na počítači. Voliteľne video slučka (4.2) s plagátom, nie viazaná na skrol. |
| Video tímu v pozadí karty | fotka sala-rano-m. Video tímu ostáva v obsahu karty (`index.html:309`, `preload="none"`). |
| Stále dýchanie kamery | jednorazová pomalá animácia pri zobrazení. Telefón v pokoji nekreslí nič (batéria, teplota). |

### 4.5 Čo z toho platí pre ktorý strom
- **D1:** ľahký režim sa dá postaviť na pokojnej verzii D1 (`world-off`, karty).
  - Treba doplniť: hlavičku (4.1), CSS rámovanie a animácie (4.3), fotky namiesto sekvencií a videa na `lahky`
    (atribút `data-video-on` sa netýka, film nebeží; zálohy kariet sala a stol už sú fotky `sala-m` a `stol-m`).
  - Overiť to treba v `index.html` pri kotvách `209`, `233`, `282`.
- **BALÍK:** to isté. Navyše môže ostať jeho dekódovanie záloh (`app.js:214–252`) a udalosť skoku. Film v BALÍKu
  ostáva pre počítač bez zmeny.

---

## 5. Merania (bez nich sa nedá uzavrieť)

- **M1 (iPhone majiteľa, aplikácia Claude):**
  - vypísať do stránky `navigator.hardwareConcurrency`, `devicePixelRatio`, `innerWidth × innerHeight`,
    `document.documentElement.className`,
  - `JSON.stringify(BS30_FILM.state)` (pole `on`, `dpr`, `frames`, `ready`),
  - dočasný ladiaci panel cez `?ladenie=1`.

  Rozhodne, či beží film, alebo len zálohy vo `world`.
- **M2 (skutočný iPhone, Safari Web Inspector z Macu, Timeline: JavaScript & Events, Rendering, CPU):**
  - D1: dĺžka úlohy `createImageBitmap` pre `cakaren-m-1448.avif` a jednej snímky `seq/vstup-dnu/f025.avif`,
  - trvanie jedného `texSubImage2D` pása (256 riadkov, `UNPACK_SKIP_ROWS`) a `generateMipmap`,
  - ten istý záznam pre BALÍK (worker, pás z `Uint8Array`).

  Chromium to nezachytí (rozbaľuje mimo vlákna).
- **M3 (Chromium, emulácia 390 × 844 aj 430 × 932, DPR 3, CPU 4× a 6×, Fast 4G):**
  - trace s `devtools.timeline`, `disabled-by-default-devtools.timeline.frame`, `blink.image_decode`, `gpu`,
    a k tomu Long Animation Frames,
  - skrol 0 → koniec stránky rýchlosťou 1 000 a 2 500 px/s,
  - výstup: podiel snímok > 16,7 ms a > 50 ms, p95 snímky, počet a trvanie `Decode Image` a `texSubImage2D`,
  - čas od vstupu záberu po `ready` z `BS30_FILM.state.ready`,
  - v BALÍKu aj čas, keď je kreslený náhľad (`preview: true` a `ready: false`), plus `uploads.strips`.
- **M4:** počas skrolu 2 000 px/s cez Poď ďalej a Remeslo zapisovať každých 100 ms
  `BS30_FILM.state.seq[*].{got, lo, hi, up, dec}`. Výstup: rozbalené a nahraté snímky za sekundu a vzdialenosť
  `hi − lo`, teda trhanie.
- **M5:** pamäť.
  - Safari Timeline Memory na iPhone: JavaScript, Images, Layers, Other (WebGL).
  - Udalosti `webglcontextlost` po 5 minútach skrolu a po návrate z inej aplikácie.
  - V Chromiu sonda `renderer.info.memory` + odhad z rozmerov (1.3).
- **M6:** teplo a takt: 3 minúty nečinnosti na iPhone po skrole. Timeline: počet snímok filmu za sekundu v pokoji
  (D1 a BALÍK kreslia stále, `film.js:984` / `1058`).
- **M7 (A/B ľahký režim):** to isté M3, M5 a filmový pás prvých 3 s.
  - Cieľ: prvý obraz fotka + nadpis do 1,5 s pri Fast 4G,
  - 0 snímok > 50 ms pri CPU 4×, p95 ≤ 20 ms pri CPU 6×,
  - pamäť ≤ 60 MB obrázkov, 0 WebGL kontextov.
