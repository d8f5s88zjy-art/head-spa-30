# K2 – kontrola kódu a shaderov (kolo 0)

Kontrolór: K2-kod. Strom `hs-skvrny` (vetva barbershop-skvrny, 2687b6e) som **nemenil** (`git status --short` prázdny).
Pokusy bežali na upravených kópiách `assets/film.js`, ktoré Playwright podstrčil cez `page.route`. Server bežal na
`127.0.0.1:8810`, prehliadač Chromium so SwiftShaderom, adresa `?asistent=ukazka&objednavka=ukazka&film=on&uvod=off`;
počítač 1440 × 900 (dpr 1), telefón 390 × 844 (isMobile, dpr 1). Všetky cesty k súborom nižšie sú relatívne
k `scratchpad/barber/cierne-skvrny/`.

## 1. Záver

Našiel som **tri cesty**, ktorými sa na plátno filmu dostane čierna. Spolu dávajú **9 škvŕn**.

**A – príčina škvŕn zo záznamu: alfa = hĺbka v priamom prechode.** Je v `assets/film.js:358`:

```glsl
gl_FragColor = vec4(c, vZ);      // alfa = hĺbka bodu (0 = najďalej)
```

Keď nebeží prechod, ten istý shader kreslí záber priamo na obrazovku (`film.js:1178–1180`, `vig.value.w = 1`). Do alfy
plátna sa tak zapíše hĺbka. Kde je hĺbková mapa presne 0 (najvzdialenejšia časť miestnosti, obloha), má plátno alfu 0.
Chromium má `alpha: false` (`film.js:311`), alfu zahodí, a preto žiadny test v Chromiu nič nevidel. Safari u majiteľa
tieto pixely ukáže čierne, lebo podklad stránky je `--ink #0e0d0c`. Počas strihu kreslí shader `post`, ktorý píše
alfu 1.0 (`film.js:932`). Preto škvrna pri strihu chýba a objaví sa celá v snímke, keď strih dobehne.
→ 6 škvŕn v 5 záberoch (kap. 3). Z toho 3 sú na zázname, zábery so zvyšnými tromi záznam nedosiahol.

**B – strihy „popredie“: do strihu sa vtiahne blízky okraj fotky.** Je v `film.js:1063–1066` (rezerva okraja
`ea = uAmt * 0.6`). Pri bočnom posune kamery v strihu sa okraj fotky s blízkou hĺbkou (stĺp, kreslo, až 1,0) vtiahne
do záberu. V textúre strihu tak ostane nepokrytý pás vo farbe čistenia `--ink`. Strih popredia potom práve tento okraj
rozmaže cez obraz ako „predmet v popredí“ a vznikne čierny rozmazaný pás. Deje sa to vo **všetkých prehliadačoch**,
na zázname to nie je (záznam končí skôr). Týka sa to strihov kava→sud (veľký pás vľavo) a cakaren→sala-rano (úzky pás
vpravo) → 2 škvrny.

**C – telefón na výšku: strih popredia berie „predmet“ z prázdneho pásu pod fotkou → čierna cez celú fotku.**
Na telefóne na výšku sa záber kreslí len do horného pásu plátna (`PAS_B = 0.56`, `film.js:141`, `784`, `aim()`
`1008–1016`; style.css P16). Textúry strihu rtA/rtB majú preto spodných ~44 % vo farbe čistenia `--ink`. Shader strihu
popredia (`film.js:903–921`) ráta súradnice `u`, `w` a hranu `uLead` z celej textúry a predmet berie z pásu `us ∈ [R0 = −0,15; uLead]`
v smere letu. Strih cakaren→sala-rano má na telefóne zvislý smer (`m:rise`, `film.js:197`; predmet patrí prichádzajúcemu
záberu `b:`, teda strih beží odzadu a pás predmetu je **spodok** textúry sala-rano). Spodok textúry je na telefóne prázdny
pás, takže sa cez celú fotku natiahne rozmazaná farba čistenia: pri mix 0,45–0,6 je **celý pás fotky čierny** (až 100 %).
Všetky prehliadače, len telefón na výšku; záznam je z Macu, preto to na ňom nie je → 1 škvrna (najväčšia zo všetkých).

Opravy sú tri, všetky v `film.js` (shader záberu 3 riadky, shader strihu a jeden uniform ~8 riadkov). Nemenia RGB filmu
v pokoji ani počas strihov na počítači (kap. 5), telefón ostáva rovnako ľahký.

## 2. Dôkazy

### A – alfa v priamom prechode

**D1 – tvar.** Pokus `alfa` (renderer s `alpha:true, preserveDrawingBuffer:true`, inak nezmenený) prečíta skutočnú
alfu, ktorú film zapisuje do plátna. Pixely s alfou 0 sa so škvrnami zo záznamu zhodujú tvarom, polohou aj schodíkmi
na hrane. Pozri `K2-kod/kolo-0/porovnanie-video-alfa0.jpg` (otvorené nástrojom Read): vľavo je snímka zo záznamu,
v strede alfa 0 nahradená `--ink`, vpravo alfa 0 purpurovou.
- cakaren (pes, pumpa Route 66): obdĺžnik zadnej časti sály so schodíkmi dole a zárezom pri hlave psa – zhodné.
- sala-rano (strop a kreslo): tvar „U“, v záreze lampa, rameno ku kreslu – zhodné.
- sala (Poď ďalej): oblasť okolo opierky hlavy kresla – zhodné.

**D2 – hĺbková mapa má presnú nulu.** V `K2-kod/kolo-0/snimky/hlbka-nula.jpg` je purpurová hodnota 0 v `*-hlbka.webp`,
žltá ≤ 4, modrá ≤ 12. Škvrny zodpovedajú len purpurovej (presnej nule), nie celej vzdialenej časti. Presnú nulu od
1/255 v kóde rozlišuje jedine zápis alfy: vertex shader (`film.js:340–345`) s hĺbkou počíta spojito a `post` píše
alfu 1. Podiel presnej nuly v mapách: `node nastroje/k2-staticka.mjs` → K2-11 (cakaren 5,09 %, sala 3,68 %,
sala-rano 3,6 %, vstup 12,77 %, …). Mapy majú presnú nulu od 9. 10. (`git log` mapy cakaren: 5eb9bc9 5,08 %,
e306ba4 5,09 %) a zápis alfy je z toho istého dňa (99fd69b, bf2221c).

**D3 – čas.** Zo záznamu pri 30 snímkach/s:
- `K2-kod/kolo-0/snimky/t30-pes.jpg`: švih stol→cakaren je rozmazaný a bez škvrny do 12,667 s, od 12,733 s je
  škvrna celá (strih dobehol).
- `snimky/t30-strop.jpg`: sala-rano je bez škvrny do 17,000 s, v 17,033 s sa objaví celá škvrna naraz.

Geometrická diera (orezanie, preklopenie) by rástla spolu s pohybom kamery. Táto sa objaví celá v jednej snímke, keď
film prepne z prechodu `post` (alfa 1) na priamy prechod (alfa = hĺbka).

**D4 – predpoveď po záberoch sedí so záznamom.** V `K2-kod/kolo-0/pokus-alfa-vsetko.log` (alfa 0 v % plátna, záber
v pokoji, počítač):

| záber | alfa 0 | na zázname |
|-------|--------|------------|
| rohozka | 0 % | bez škvrny |
| sala | 3,0–3,4 % | škvrna |
| stol | 0 % | bez škvrny |
| cakaren | 5,4–6,8 % | škvrna |
| sala-rano | 3,3–3,6 % | škvrna |
| kreslo-stred | 0,43–0,45 % | záznam nedošiel |
| kava | 0 % | záznam nedošiel |
| sud | 0 % | záznam nedošiel |

Počas strihov (mix 0,3 a 0,7, všetky strihy) je alfa 0 vždy 0,00 % (riadky `strih-*` v tom istom logu). Koniec
stránky (vstup): alfa 0 = 1,22–1,59 % (`pokus-alfa-doplnok.log`, `pokus-diery.log`).
Telefón (`pokus-telefon-alfa.log`, rámovanie pásu): sala 0,13 %, cakaren 2,71 %, sala-rano 0,90 %, kreslo-stred 0 %,
koniec-vstup 0,11 % plátna; pozri `K2-kod/kolo-0/telefon-alfa0-prehlad.jpg` (purpurová = alfa 0, vedľa napodobenina
Safari). Tie isté škvrny ako na počítači, len vo výreze telefónu (škvrna 4 je mimo výrezu).

**D5 – Safari.** V tomto prostredí Safari nie je, k dispozícii je len Chromium. Že WebKit skladá plátno s alfou inak
a že to závisí od zariadenia, dokladajú hlásenia WebKitu:
[Bug 181317 – WebGL alpha:false seems to be composited incorrectly](https://bugs.webkit.org/show_bug.cgi?id=181317) a
[Bug 264081 – iPhone za behu zobrazuje obraz s alfou 0 inak než na snímke obrazovky](https://bugs.webkit.org/show_bug.cgi?id=264081).
Presný mechanizmus vo WebKite som neoveroval. Príčinu dokladajú D1–D4.

### B – nepokrytý okraj v strihoch popredia

- **Pokus `diery`:** farbu čistenia plátna aj textúr strihu som zmenil na zelenú (0,255,0). Každé nepokryté miesto
  je potom zelené. Zábery v pokoji (všetky, t = 0 a 1) majú 0 zelených pixelov. Strihy (všetky, mix 0,1/0,3/0,5/0,7/0,9
  a jemne 0,15–0,45) majú 0 zelených pixelov okrem dvoch strihov (`pokus-diery.log`, `pokus-diery-jemne.log`):
  - kava→sud: mix 0,3 → 767 px pri ľavom okraji, mix 0,35 → 133 362 px, teda 13,9 % obrazovky so zelenou prevahou.
    Pozri `K2-kod/kolo-0/diery-kava-sud-m035-m04.jpg`.
  - cakaren→sala-rano: mix 0,3 → 0,80 % obrazovky so zelenou prevahou pri pravom okraji.
- **Pokus `dieryrt`** (čítanie textúr strihu): v kava→sud pri mix 0,3 má textúra prichádzajúceho záberu sud
  nepokrytý zvislý pás pri pravom okraji, za blízkym stĺpom (hĺbka okraja 0,88). Je to 4,31 % textúry, pozri
  `K2-kod/kolo-0/rtB-kava-sud-a-cakaren-salarano.jpg`. V cakaren→sala-rano pri mix 0,3 je nepokrytých 1,19 % textúry.
- **Ako to vyzerá naostro:** `K2-kod/kolo-0/produkcia-kava-sud-m035-a-koniec.jpg` (vľavo) ukazuje čierny rozmazaný
  pás pri ľavom okraji počas strihu kava→sud.
- **Kde je chyba v kóde:** `place()` počíta s paralaxou okraja `ea = uAmt·0,6` (`film.js:1064`). Okraje máp však
  majú hĺbku až 1,0 (sala, sala-rano, kreslo-stred, kava, vstup; `k2-staticka.mjs` K2-12).

### C – telefón: prázdny pás pod fotkou ako „predmet“ strihu popredia

- **Textúry strihu na telefóne** (`pokus-telefon-dieryrt.log`, farba čistenia zelená): v pokoji v cakaren je zelených
  34,45 % rtA a 43,57 % rtB – spodok textúry pod pásom fotky. Pozri `K2-kod/kolo-0/telefon-rt-cakaren-salarano.jpg`
  (otvorené nástrojom Read): hore fotka, dole zelený pás; vpravo obrazovka pri mix 0,5–0,6 celá zelená.
- **Na obrazovke v páse fotky** (`python3 -I nastroje/k2-pas-telefon.py K2-kod/kolo-0/pokus-telefon-diery
  pokus-telefon-diery3`, zelená len v horných 45 % plátna = pás fotky bez prechodu):

  | strih cakaren→sala-rano, mix | 0,3 | 0,35 | 0,4 | 0,45 | 0,5 | 0,6 | 0,7 | 0,8 | 0,9 |
  |---|---|---|---|---|---|---|---|---|---|
  | zelená v páse fotky | 0,48 % | 19,6 % | 56,7 % | 92,9 % | **100 %** | 92,9 % | 47,2 % | 8,3 % | 0 % |

  Zelená prichádza zhora (y 0–116 px pri 0,35, y 0–261 pri 0,4, celý pás pri 0,5) a odchádza dole – presne ako natiahnutý
  „predmet“ strihu. Pozri `K2-kod/kolo-0/telefon-diery-cakaren-salarano.jpg` (mix 0,3/0,35/0,4/0,45).
  Všetky ostatné strihy na telefóne (vstup→rohozka, rohozka→sala, sala→stol, stol→cakaren, sala-rano→kreslo-stred,
  kreslo-stred→kava, kava→sud, sud→vstup; mix 0,1–0,9, logy `pokus-telefon-diery*.log`) aj všetky zábery v pokoji majú
  v páse fotky 0 zelených pixelov (jediná výnimka: 9 px na hranici pásu v kreslo-stred→kava pri 0,4).
- **Naostro (produkčné farby):** `pokus-telefon-popredie.log` – podiel tmavých pixelov (R+G+B < 24) na celom plátne:
  v pokoji 39,4 % (atrament pod pásom), pri strihu mix 0,35 → 34,0 %, 0,45 → 69,6 %, 0,5 → 85,0 %, **0,6 → 96,3 %**,
  0,7 → 76,8 %. Pozri `K2-kod/kolo-0/telefon-popredie-cakaren-salarano-produkcia.jpg` (otvorené nástrojom Read): pri
  0,45–0,6 je celá fotka čierna, pri 0,7 spodná polovica.
- **Prečo práve tento strih:** `film.js:197` `'cakaren>sala-rano': 'popredie right b:0.30,0.62 m:rise …'` – na telefóne
  smer `rise` (`CUT_DIRS`, `film.js:190`), predmet patrí prichádzajúcemu záberu (`b:`), takže strih beží odzadu
  (`rev`, `film.js:1168–1170`) a predmet sa berie zo spodku textúry sala-rano (`us ∈ [−0,15; uLead]`, `film.js:906–913`).
  kava→sud je `left` (vodorovný – pás predmetu je bočný, v páse fotky), sala→stol je na telefóne `m:prelinanie`.
  Prázdny pás má v textúre alfu 1 (farba čistenia s alfou 1, `film.js:318`), preto ho `near(o.a)` berie ako blízky
  predmet a kryje ním celý obraz (`film.js:919–921`).

## 3. Nájdené škvrny

Súvislé oblasti alfy 0 (A) som spočítal príkazom `python3 -I nastroje/k2-zhluky.py <priečinok>` (oblasti ≥ 400 px);
B z pokusov `diery`/`dieryrt`, C z `k2-pas-telefon.py`.

| # | cesta | kde | záber / strih | kde na plátne (px) | veľkosť | na zázname |
|---|-------|-----|---------------|--------------------|---------|-----------|
| 1 | A | počítač aj telefón | sala (Poď ďalej) | x 370–764, y 18–347, okolo opierky kresla | 38–43 tis. px (3,0–3,4 %) | áno |
| 2 | A | počítač aj telefón | cakaren (pes) | x 292–805, y 90–362, zadná časť sály | 70–86 tis. px (5,4–6,8 %) | áno |
| 3 | A | počítač aj telefón | sala-rano (strop, kreslo) | x 670–994, y 174–409, koniec sály | 42–46 tis. px (3,3–3,6 %) | áno |
| 4 | A | počítač | kreslo-stred | x 146–212, y 120–289, ľavé zrkadlo | 5,2–5,6 tis. px (0,44 %) | záznam nedošiel |
| 5 | A | počítač aj telefón | vstup na konci stránky | x 202–410, y 0–73, obloha nad strechou | 11,7 tis. px | záznam nedošiel |
| 6 | A | počítač aj telefón | vstup na konci stránky | x 486–724, y 0–32, obloha nad strechou | 3,8 tis. px | záznam nedošiel |
| 7 | B | všetky prehliadače | strih kava→sud (mix ≈ 0,3–0,4) | ľavý okraj, rozmazaný pás | až 13,9 % obrazovky | záznam nedošiel |
| 8 | B | všetky prehliadače | strih cakaren→sala-rano (mix ≈ 0,3) | pravý okraj, úzky pás | 0,8 % obrazovky | záznam nedošiel |
| 9 | C | telefón na výšku, všetky prehliadače | strih cakaren→sala-rano (mix ≈ 0,35–0,8) | celý pás fotky, zhora nadol | až **100 % fotky** (mix 0,5) | záznam je z Macu |

Polohy 1–6 sú z počítača (1440 × 900). Obrázky škvŕn 4–6: `K2-kod/kolo-0/alfa0-kreslo-stred-sala.jpg`
a `produkcia-kava-sud-m035-a-koniec.jpg` (vpravo: napodobenina Safari, čierne škvrny v oblohe). Telefón: škvrny 1–3 a 5–6
vo výreze pásu `telefon-alfa0-prehlad.jpg` (0,11–2,71 % plátna), škvrna 4 je mimo výrezu telefónu (kreslo-stred 0 %).

## 4. Všetky cesty k čiernej na plátne

| cesta | kde | pokus | výsledok | vysvetľuje škvrny? |
|-------|-----|-------|----------|--------------------|
| **alfa = hĺbka v priamom prechode** | film.js:358, 1178 | `alfa` | alfa 0 presne v tvare škvŕn (D1–D4) | **áno – škvrny 1–6** |
| plátno `alpha:false` | film.js:311 | – | Chromium alfu zahodí, preto testy nič nevideli; v Safari sa naň nedá spoliehať | spolupríčina (v Chromiu chybu skrýva) |
| **nepokrytý blízky okraj v strihu popredia** | film.js:1063–1066, 903–923 | `diery`, `dieryrt`, `okraj` | farba čistenia v textúre strihu, strih ju rozmaže cez obraz | **áno – škvrny 7–8** (nie na zázname) |
| **telefón: pás pod fotkou ako predmet strihu popredia** | film.js:141, 784, 1008–1016, 903–913, 1172 | `diery`/`dieryrt`/`popredie` na telefóne, `pas` | pri cakaren→sala-rano je pás fotky až 100 % farba čistenia (naostro 96 % plátna čierne) | **áno – škvrna 9** (len telefón) |
| farba čistenia `--ink` (diery v mriežke, okraj fotky v pokoji) | film.js:318 | `diery` | zábery v pokoji 0 zelených px, strihy okrem B a C tiež 0 (počítač aj telefón) | nie |
| orezanie blízkou rovinou (prológ: dvere + nájazd) | film.js:327, 1034, 1051 | `diery` na strihu z prológu (mix 0,1–0,9) | výpočet: najbližšie vrcholy sú až 0,24 za kamerou (K2-06b), na obrazovke však 0 zelených px – orezaná časť je mimo záberu | nie |
| odvrátené / preklopené trojuholníky (`side` FrontSide) | film.js:413 | `rub`: DoubleSide, rub presne tyrkysový | 39 stavov (zábery t 0/1, všetky strihy mix 0,3/0,6, koniec): presná tyrkysová 0 px všade, voľná len na úrovni fotky (TV v zábere stol: 105–148 px, rovnako bez pokusu) – odvrátená strana nikde nie je vidieť (`pokus-rub.log`) | nie |
| textúry prechodu rtA/rtB a ich alfa | film.js:804–805, 858–860, 932 | `alfa` počas strihov | `post` píše alfu 1.0, počas strihov je alfa 0 na 0,00 % plátna | nie |
| prázdna textúra `blank` (rgb 14,13,12) a plochá hĺbka `flat` | film.js:409, 525–533, 543, 569 | statická analýza | kreslí sa len záber `ready` (mapa aj hĺbka hotové). `blank` by dal celý tmavý obdĺžnik, nie nepravidelnú škvrnu. Výnimka je video bez plagátu (film.js:569), index.html však `data-video` nemá | nie (riziko pre video) |
| plochá hĺbka + priamy prechod | film.js:409, 358 | statická | záber s `flat` (video, plagát) by mal alfu 0 na celej ploche, v Safari celé čierne okno | dnes nie, po oprave A zanikne |
| strata kontextu WebGL | film.js:1452–1457 | statická | plátno je prázdne a zálohy skryté (`world-in`), kým sa fotky znova nenahrajú → celé tmavé okno | nie (iný vzhľad) |
| zmena veľkosti plátna | film.js:1217–1235 | statická | `setSize` plátno vyprázdni, `wake()` hneď kreslí → najviac 1 snímka | nie |
| skok cez menu (šero) | film.js:1134, 1137, 1140 | statická, `k2-skok.mjs` | zámerné krátke šero `--ink`, keď nie je čo ukázať (kap. 7) | nie |
| Safari: premultipliedAlpha | film.js:311 | – | predvolené true; farba s RGB > alfa je neplatná premultiplikovaná farba a WebKit ju skladá inak | áno, cez cestu A |
| UNPACK_FLIP_Y, colorSpace, createImageBitmap | film.js:439–465, 473–498 | statická | flipY=false, NoColorSpace, pásy cez UNPACK_SKIP_ROWS. Chyba by dala čierny vodorovný pás, nie škvrnu; na zázname sú fotky celé | nie |
| WebGL2 limity, mediump vo vertex shaderi | film.js:427, 1527 | statická | `maxTextureSize` sa číta; žiadne `mediump/lowp`, three dá highp | nie |
| hĺbkové mapy s presnou nulou | img/film/*-hlbka.webp | štatistika | 24 z 26 máp má presnú nulu (0,01–12,8 %) | spúšťač A (dáta), samy osebe neškodné |

## 5. Návrh opravy (pre opravára; strom som nemenil)

Overená kópia je v `K2-kod/kolo-0/oprava-kopia/assets/film.js`, celý rozdiel v `K2-kod/kolo-0/oprava.diff`
(`diff -u` oproti stromu). Jadro:

```diff
       float z = texture2D(uDepth, vUv).r;
+      // okraj fotky ostáva na rovine steny: blízky okraj by sa pri bočnom posune strihu vtiahol do záberu (prázdny pás)
+      vec2 e = min(uv, 1.0 - uv); z *= smoothstep(0.0, 0.03, min(e.x, e.y));
 ...
-      gl_FragColor = vec4(c, vZ);
+      // na obrazovku vždy nepriehľadne: alfa = hĺbka len pre textúru prechodu (Safari by alfu 0 ukázal čierne)
+      gl_FragColor = vec4(c, uVig.w > 0.5 ? 1.0 : vZ);
 ...   (shader strihu, vetva popredie)
-          float u = dot(vUv - 0.5, md) + 0.5, w = dot(vUv - 0.5, pd) + 0.5, wF = dot(uFoc - 0.5, pd) + 0.5;
+          vec2 vb = vec2(vUv.x, 1.0 - (1.0 - vUv.y) / uB), fb = vec2(uFoc.x, 1.0 - (1.0 - uFoc.y) / uB);
+          float u = dot(vb - 0.5, md) + 0.5, w = dot(vb - 0.5, pd) + 0.5, wF = dot(fb - 0.5, pd) + 0.5, lead = dot(fb - 0.5, md) + 0.5;
 ...   (uLead → lead v L a k; vzorka predmetu ostáva v páse)
+          if (uB < 0.999) ps.y = max(1.0 - (1.0 - ps.y) * uB, 1.0 - uB + 1.5 * exp2(lo) / uRes.y);
 ...   (JS, pri nastavení uniformov strihu)
+      pu.uB.value = cut && cut.k === 4 ? Math.min((A && A.band) || 1, B.band || 1) : 1;
```

Oprava A (alfa):
- RGB sa nemení vôbec, takže vzhľad, vinetácia, 3D hĺbka aj plynulosť ostávajú.
- Prechody sa nemenia: do rtA/rtB sa kreslí s `vig.value.w = 0` (film.js:1143), takže tam ostáva alfa = hĺbka, ktorú
  potrebuje prelínanie (film.js:858–860) a strih popredia (film.js:915–921). `FRAG_SEQ` opravu zdedí cez `replace`
  (film.js:361–362).

Oprava B (okraj):
- Hĺbka sa stiahne na 0 len v krajných 3 % fotky. Okno v pokoji je od okraja fotky aspoň 4,8 % (OVER 0,12, posun oka
  najviac 0,06·šírky, film.js:777, 793), preto sa obraz v pokoji nemení.
- V strihu sa okraj už nevtiahne do záberu a predmetom popredia je znova skutočný stĺp, nie farba čistenia. Pozri
  `K2-kod/kolo-0/okraj-pred-po-kava-sud-m035.jpg`: vľavo zelená farba čistenia, vpravo hnedý rozmazaný stĺp.

Oprava C (pás telefónu):
- Nový uniform `uB` = pás fotky (0,56 na telefóne na výšku pri strihu popredia, inak 1). Súradnice `u`, `w`, bod strihu
  a hrana predmetu `lead` sa rátajú v páse (zvyšok shadera nezmenený), vzorka predmetu `ps.y` sa premapuje späť do pásu
  a neklesne pod jeho spodok ani s rozmazaním (rezerva 1,5·2^lod px podľa úrovne mipmapy).
- Na počítači je `uB = 1`: `vb = vUv`, `lead = uLead` (ten istý výraz) a premapovanie sa preskočí – shader počíta to isté.
- Pozri `K2-kod/kolo-0/telefon-popredie-pred-po.jpg` (otvorené nástrojom Read): hore dnešný strih (čierna pri 0,45–0,7),
  dole s opravou C – predmetom je sud/operadlo a strih prechádza do sala-rano bez čiernej.

Všetky tri opravy pridajú len pár inštrukcií (vrchol, fragment, strih), bez ďalšieho prechodu ani textúry, takže telefón
ostáva rovnako ľahký.

**Overenie opravy:**
- A: `pokus-oprava.log` (počítač) – alfa 0 aj alfa < 0,5 sú 0,00 % v rohozka, sala, stol, cakaren, sala-rano,
  kreslo-stred, kava, sud (t 0,5 a 1). Predtým až 6,8 %. Telefón `pokus-telefon-oprava.log`: 0,00 % vo všetkých záberoch
  aj v strihoch (predtým až 2,71 %).
- B: `pokus-okraj.log` – kava→sud a cakaren→sala-rano pri mix 0,2/0,3/0,35/0,4 majú 0 zelených pixelov aj 0,00 %
  zelenej prevahy. Predtým až 13,9 %.
- C: `pokus-telefon-pas.log` (farba čistenia zelená + oprava C) – cakaren→sala-rano mix 0,3–0,8 a kava→sud mix 0,3–0,8:
  `k2-pas-telefon.py` nenájde v páse fotky ani jeden zelený pixel (predtým až 100 %). Naostro
  `pokus-telefon-pasoprava.log`: tmavé pixely na plátne 29,8–35,4 % počas celého strihu (= atrament pod pásom; v pokoji
  39,6 %), predtým 96,3 %.
- Statická kontrola: `node nastroje/k2-staticka.mjs` → dnešný strom **4 CHYBA** (K2-01, K2-07c, K2-12, K2-13), kód 1;
  `node nastroje/k2-staticka.mjs K2-kod/kolo-0/oprava-kopia` → **0 CHYBA**, 9 POZOR, 13 OK, kód 0.
- Vzhľad A+B: `NODRIFT=1 RAW=1` dnešný film (`alfa`) vs. opravy A+B (`okrajoprava`) v záberoch sala, cakaren,
  sala-rano, sud (t 0,5): **0 rozdielnych pixelov z 1 296 000** v každom zábere
  (`pokus-vzhlad-alfa/*-rgb.png` vs `pokus-vzhlad-okrajoprava/*-rgb.png`).
- Vzhľad C: `NODRIFT=1 RAW=1` opravy A+B (`okrajoprava`) vs. A+B+C (`pasoprava`), bezstratové RGB
  (`pokus-vzhlad-okrajoprava-c/*-rgb.png` vs `pokus-vzhlad-pasoprava-c/*-rgb.png`, telefón `pokus-telefon-vzhlad-*-c/`):
  počítač zábery cakaren a kava v pokoji **0 rozdielnych pixelov z 1 296 000**; strihy popredia cakaren→sala-rano a kava→sud
  pri mix 0,5 **10 resp. 2 px z 1 296 000, najväčší rozdiel 1/255** (zaokrúhlenie prepísaného výrazu `lead`); telefón
  zábery cakaren a sala-rano v pokoji **0 rozdielnych z 329 160**. Strih cakaren→sala-rano na telefóne sa mení zámerne (kap. 5, C).

## 6. Nástroje (použijú sa aj pri overení)

- `nastroje/k2-staticka.mjs [koreň barbershop-30] [--json]` – statická kontrola rizikových miest:
  - alfa v priamom prechode (K2-01), FRAG_SEQ (K2-01b), alfa prechodu (K2-02);
  - kontext plátna (K2-03), farba čistenia (K2-04), side a discard (K2-05);
  - blízka rovina po prípadoch (K2-06), prázdna textúra a plochá hĺbka (K2-07);
  - strata kontextu a zmena veľkosti (K2-08), presnosť a textúry (K2-09), CSS plátna (K2-10);
  - presné nuly v mapách (K2-11), rezerva a poistka okraja (K2-12);
  - pás fotky na telefóne a strih popredia – uniform uB, vzorka v páse, zvislé popredia v CUTS (K2-13).

  Pri CHYBA vráti kód 1. Dnešný strom: **4 CHYBA**, 9 POZOR, 10 OK, kód 1. Opravená kópia: **0 CHYBA**, kód 0.
- `nastroje/k2-pokusy.mjs <variant> <výstup> [port] [koreň|x] [desk|phone]`
  - Varianty: `zaklad, alfa, oprava, diery, rub, prazdna, okraj, okrajoprava, dieryrt, pas, pasoprava`.
  - Premenné: `ZABERY` (aj `koniec`), `TT` (poloha v zábere), `STRIHY` (mix), `SETTLE`, `MYS`, `NODRIFT`, `RAW`.
  - Pre každý stav vypíše podiel alfy 0, počty kontrolných farieb (voľne aj presne) a podiel tmavých pixelov, uloží JPEG
    (alfa 0 purpurovo). Pri `alfa` uloží aj napodobeninu Safari, pri `dieryrt` aj textúry strihu.
- `nastroje/k2-zhluky.py <priečinok> [min_px]` – spočíta súvislé škvrny (purpurové) na snímku.
- `nastroje/k2-pas-telefon.py <priečinok>…` – zelená farba čistenia len v páse fotky telefónu (horných 45 %) a v prechode
  (45–56 %).
- `nastroje/k2-oprava-c.mjs <film.js>` – doplní opravu C do kópie film.js (presné zámeny, chybu hlási, keď text nesedí).
- `nastroje/k2-skok.mjs [port] [desk|phone] [zábery]` – farba čistenia tesne po skoku na záber (menu); v SwiftShaderi je
  čítanie pixelov pomalé (13–21 s na vzorku), výsledok preto nie je časovo použiteľný (kap. 7).

## 7. Čo ostáva neoverené

- Safari/WebKit tu nie je. Že Safari ukáže alfu 0 čierne, som odvodil zo zhody D1–D4, v prehliadači som to nevidel.
  Overenie u majiteľa: v Safari zábery sala, cakaren a sala-rano po skončení strihu. Cesty B a C sú nezávislé od
  prehliadača (vidno ich aj v Chromiu).
- Stavy som vzorkoval (t 0/0,5/1, mix po 0,05–0,2). Stály pohyb kamery (drift) robí každý stav trochu iný. Pás B
  sa ukázal len v úzkom rozsahu mix ≈ 0,3–0,4. Na telefóne som strihy od cakaren→sala-rano ďalej meral od mix 0,2
  (0,1 len po stol→cakaren – beh `diery2` spadol pri stol→cakaren 0,6, zvyšok dobehol v `diery3`/`diery4`).
- Skok cez menu: `pokus-skok-telefon.log` má po `goTo('cakaren')` jednu vzorku so 100 % farby čistenia v páse (zámerné
  šero po skoku, film.js:1134–1140), ostatné zábery 0 %; vzorkovanie trvalo 5–21 s, takže dĺžku šera som nezmeral.
  Nesúvisí so škvrnami zo záznamu, je to krátke celé okno vo farbe stránky.
- Riziká mimo škvŕn (iné čierne okná, nesúvisia so záznamom): strata kontextu WebGL (K2-08b) a video bez plagátu
  (K2-07b).
