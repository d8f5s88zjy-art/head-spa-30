# K2 – kontrola kódu a shaderov (kolo 0)

Kontrolór: K2-kod. Strom `hs-skvrny` (vetva barbershop-skvrny, 2687b6e) som **nemenil**. Pokusy bežali na upravených
kópiách `assets/film.js`, ktoré podstrčil Playwright (`page.route`), server `127.0.0.1:8810`, Chromium so SwiftShaderom,
`?film=on&uvod=off`, okno 1440 × 900, dpr 1.

## 1. Záver

**Príčina čiernych škvŕn je jedna a je v shaderi záberu:** `assets/film.js:358`

```glsl
gl_FragColor = vec4(c, vZ);      // alfa = hĺbka bodu (0 = najďalej)
```

Ten istý shader kreslí záber aj **rovno na obrazovku**, keď nebeží prechod (`film.js:1178–1180`, `vig.value.w = 1`).
Do alfy plátna sa tak zapisuje hĺbka. Všade, kde je hĺbková mapa presne 0 (najvzdialenejšia časť miestnosti), dostane
plátno alfu 0. Chromium má `alpha: false` (`film.js:311`) a alfu zahodí, preto to doteraz žiadny test nevidel. Safari
u majiteľa tieto pixely ukáže čierne (podklad stránky `--ink #0e0d0c`). Počas prechodu sa kreslí cez shader `post`, ten
píše alfu 1.0 (`film.js:932`), preto škvrny počas strihu nie sú a objavia sa presne v snímke, keď strih dobehne.

Oprava je jeden riadok v shaderi a nemení vzhľad ani pocit filmu (kap. 5).

**Počet škvŕn: 4** súvislé oblasti na počítači (sala, cakaren, sala-rano, kreslo-stred), zo záznamu sú viditeľné 3
(sala, cakaren, sala-rano); kreslo-stred záznam nezachytil (končí skôr). Podrobne v kap. 3.

## 2. Dôkazy

**D1 – tvar.** Pokus `alfa` (renderer s `alpha:true, preserveDrawingBuffer:true`, inak nezmenený) prečíta skutočnú alfu,
ktorú film zapisuje do plátna. Pixely s alfou 0 sa kryjú so škvrnami zo záznamu tvarom aj polohou, vrátane schodíkov
na hrane: `K2-kod/kolo-0/porovnanie-video-alfa0.jpg` (vľavo snímka zo záznamu, v strede alfa 0 → `--ink`, vpravo
alfa 0 purpurovo). Otvoril som ju nástrojom Read:
- cakaren (pes, pumpa Route 66): obdĺžnik zadnej časti sály so schodíkmi dole a zárezom pri hlave psa – zhodne;
- sala-rano (strop a kreslo): tvar „U“ s lampou v záreze a ramenom ku kreslu – zhodne;
- sala (Poď ďalej): oblasť okolo opierky hlavy kresla – zhodne.

**D2 – hĺbková mapa = presná nula.** `K2-kod/kolo-0/snimky/hlbka-nula.jpg`: purpurová = hodnota 0 v `*-hlbka.webp`,
žltá ≤ 4, modrá ≤ 12. Škvrny zodpovedajú len purpurovej (presnej nule), nie celej vzdialenej časti. V kóde je presná
nula odlišná od 1/255 jedine v zápise alfy (vertex shader `film.js:345` ju použije spojito, prechod `post` píše
alfu 1). Podiel presnej nuly v mapách: `node nastroje/k2-staticka.mjs` → K2-11 (napr. cakaren 5,09 %, sala 3,68 %,
sala-rano 3,6 %, vstup 12,77 %).

**D3 – čas.** Záznam 30 snímok/s: `snimky/t30-pes.jpg` – švih stol→cakaren je rozmazaný do 12,667 s bez škvrny,
škvrna je celá od 12,733 s (koniec strihu); `snimky/t30-strop.jpg` – sala-rano bez škvrny do 17,000 s, celá škvrna
v 17,033 s naraz. Geometrická diera (orezanie, preklopenie) by rástla s pohybom kamery; tu sa celá objaví v jednej
snímke, keď film prepne z prechodu `post` (alfa 1) na priamy prechod (alfa = hĺbka).

**D4 – po záberoch sedí predpoveď so záznamom.** `K2-kod/kolo-0/pokus-alfa-vsetko.log` (alfa 0 v % plátna, záber
v pokoji): rohozka 0 %, sala 3,0–3,4 %, stol 0 %, cakaren 5,4–6,8 %, sala-rano 3,3–3,6 %, kreslo-stred 0,43–0,45 %,
kava 0 %, sud 0 %. Na zázname: rohozka a stol bez škvŕn, sala, cakaren, sala-rano so škvrnou – zhoda.
Počas strihov (mix 0,3 a 0,7, všetky strihy) je alfa 0 vždy 0,00 % (`strih-*` riadky v tom istom logu).

**D5 – Safari nie je v tomto prostredí** (len Chromium). Že WebKit pri skladaní plátna s alfou zaobchádza inak
a závisle od zariadenia, dokladajú hlásenia WebKitu: [Bug 181317 – WebGL alpha:false seems to be composited
incorrectly](https://bugs.webkit.org/show_bug.cgi?id=181317) a [Bug 264081 – iPhone zobrazuje obraz s alfou 0 inak
za behu než na snímke obrazovky](https://bugs.webkit.org/show_bug.cgi?id=264081). Presný mechanizmus vo WebKite som
neoveroval; dôkaz príčiny stojí na D1–D4.

## 3. Nájdené škvrny (počítač, 1440 × 900)

`python3 -I nastroje/k2-zhluky.py K2-kod/kolo-0/pokus-alfa-vsetko` (súvislé oblasti alfy 0, ≥ 400 px):

| # | záber | kde na plátne (px) | veľkosť | na zázname |
|---|-------|--------------------|---------|-----------|
| 1 | sala (Poď ďalej) | x 370–764, y 18–347, okolo opierky kresla | 38–43 tis. px (3,0–3,4 %) | áno |
| 2 | cakaren (pes) | x 292–805, y 90–362, zadná časť sály | 70–86 tis. px (5,4–6,8 %) | áno |
| 3 | sala-rano (strop, kreslo) | x 670–994, y 174–409, koniec sály | 42–46 tis. px (3,3–3,6 %) | áno |
| 4 | kreslo-stred | x 146–212, y 120–289, ľavé zrkadlo | 5,2–5,6 tis. px (0,44 %) | záznam tam nedošiel |

DOPLNIŤ_KONIEC

## 4. Všetky cesty k čiernej na plátne

| cesta | kde | pokus | výsledok | vysvetľuje škvrny? |
|-------|-----|-------|----------|--------------------|
| **alfa = hĺbka v priamom prechode** | film.js:358, 1178 | `alfa` (čítanie alfy) | alfa 0 presne v tvare škvŕn (D1–D4) | **áno – príčina** |
| plátno `alpha:false` | film.js:311 | – | Chromium alfu zahodí (preto testy nič nevideli); Safari sa naň nedá spoliehať | spolupríčina (skrýva chybu v Chromiu) |
| farba čistenia `--ink` + diery v mriežke (orezanie blízkou rovinou, okraj fotky, nepokryté pixely) | film.js:318, 327 | `diery`: čistenie zelené (0,255,0) | DOPLNIŤ_DIERY | nie |
| odvrátené / preklopené trojuholníky (`side` FrontSide) | film.js:413 | `rub`: DoubleSide, rub tyrkysový | DOPLNIŤ_RUB | nie |
| prechodové textúry rtA/rtB a ich alfa | film.js:804–805, 858–860, 932 | `alfa` počas strihov | post píše alfu 1.0; alfa 0 počas strihov 0,00 % | nie |
| prázdna textúra `blank` (rgb 14,13,12) a plochá hĺbka `flat` | film.js:409, 543, 569 | statická analýza | kreslí sa len záber `ready` (mapa aj hĺbka hotové, film.js:525–533); `blank` by dal celý tmavý obdĺžnik, nie nepravidelnú škvrnu. Výnimka: video bez plagátu (film.js:569) – index.html dnes nemá žiadne `data-video` | nie (riziko pre video) |
| plochá hĺbka + priamy prechod | film.js:409, 358 | statická | záber s `flat` (video, plagát) by mal alfu 0 na celej ploche → v Safari celé čierne okno | nie dnes; po oprave zanikne |
| strata kontextu WebGL | film.js:1452–1457 | statická | plátno prázdne, zálohy skryté (`world-in`), kým sa fotky znova nenahrajú → celé tmavé okno | nie (iný vzhľad) |
| zmena veľkosti plátna | film.js:1217–1235 | statická | `setSize` vyprázdni plátno, `wake()` kreslí hneď → najviac 1 snímka | nie |
| skok cez menu, zo šera | film.js:1134, 1137, 1140 | statická | zámerné krátke šero `--ink`, keď nie je čo ukázať | nie |
| Safari: premultipliedAlpha | film.js:311 | – | predvolené true; RGB > alfa = neplatná premultiplikovaná farba, WebKit ju môže skladať inak | áno, cez alfu (to isté ako riadok 1) |
| UNPACK_FLIP_Y, colorSpace, createImageBitmap | film.js:439–465 | statická | flipY=false, NoColorSpace; nahrávanie po pásoch cez UNPACK_SKIP_ROWS – pri chybe by bol čierny vodorovný pás, nie škvrna; na zázname fotky celé | nie |
| WebGL2 limity, mediump vo vertex shaderi | film.js:427, 1527 | statická | `maxTextureSize` sa číta; žiadne `mediump/lowp`, three dá highp | nie |
| hĺbkové mapy s presnou nulou | img/film/*-hlbka.webp | štatistika | 24 z 26 máp má presnú nulu (0,01–12,8 %) | spúšťač (dáta), samy o sebe neškodné |

## 5. Návrh opravy (pre opravára, strom som nemenil)

Overená kópia: `K2-kod/kolo-0/oprava-kopia/assets/film.js`, rozdiel `K2-kod/kolo-0/oprava.diff`:

```diff
-      gl_FragColor = vec4(c, vZ);
+      // na obrazovku vždy nepriehľadne: alfa = hĺbka len pre textúru prechodu (Safari by alfu 0 ukázal čierne)
+      gl_FragColor = vec4(c, uVig.w > 0.5 ? 1.0 : vZ);
```

- RGB sa nemení vôbec → vzhľad, vinetácia, 3D hĺbka aj plynulosť ostávajú rovnaké.
- Prechody sa nemenia: do textúr rtA/rtB sa kreslí s `vig.value.w = 0` (film.js:1143), tam ostáva alfa = hĺbka,
  ktorú potrebuje prelínanie (film.js:858–860) a strih popredia (film.js:915–921).
- `FRAG_SEQ` vzniká z FRAG cez `replace` (film.js:361–362) a opravu zdedí.
- Výkon: jedna podmienka na fragment, bez ďalšieho prechodu.

Overenie opravy: DOPLNIŤ_OPRAVA

## 6. Nástroje (použijú sa aj pri overení)

- `nastroje/k2-staticka.mjs` – statická kontrola rizikových miest: alfa v priamom prechode (K2-01), FRAG_SEQ (K2-01b),
  alfa prechodu (K2-02), kontext plátna (K2-03), farba čistenia (K2-04), side a discard (K2-05), blízka rovina
  (K2-06), prázdna textúra a plochá hĺbka (K2-07), strata kontextu a zmena veľkosti (K2-08), presnosť a textúry
  (K2-09), CSS plátna (K2-10), presné nuly v hĺbkových mapách (K2-11). Návratový kód 1 pri CHYBA.
  - dnešný strom: `node nastroje/k2-staticka.mjs` → **2 CHYBA** (K2-01 film.js:358, K2-07c), 9 POZOR, 10 OK, kód 1
  - opravená kópia: `node nastroje/k2-staticka.mjs K2-kod/kolo-0/oprava-kopia` → **0 CHYBA**, kód 0
- `nastroje/k2-pokusy.mjs <variant> <výstup> [port] [koreň] [desk|phone]` – varianty `zaklad, alfa, oprava, diery, rub,
  prazdna`; premenné `ZABERY`, `TT` (poloha v zábere), `STRIHY` (mix), `SETTLE`, `MYS`. Vypíše pre každý stav podiel
  alfy 0 a počty kontrolných farieb, uloží JPEG (alfa 0 purpurovo) a pri `alfa` aj napodobeninu Safari.
- `nastroje/k2-zhluky.py <priečinok> [min_px]` – počet súvislých škvŕn (purpurová) na snímku.

## 7. Čo ostáva neoverené

- Safari/WebKit tu nie je; že Safari ukáže alfu 0 čierne, je odvodené zo zhody D1–D4, nie pozorované v prehliadači.
  Overenie opravy u majiteľa: tie isté tri zábery v Safari (sala, cakaren, sala-rano) po skončení strihu.
- DOPLNIŤ_TELEFON
- POZOR mimo škvŕn (iné čierne okná): strata kontextu WebGL (K2-08b) a video bez plagátu (K2-07b) – nesúvisia
  so záznamom, navrhujem ich riešiť samostatne.
