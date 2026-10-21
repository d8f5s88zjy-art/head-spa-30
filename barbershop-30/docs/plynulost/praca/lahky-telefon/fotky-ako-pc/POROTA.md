# Porota: „fotky vidno tak dobre ako na PC“ (BARBERSHOP 30, ľahký telefón)

Predseda poroty (art director, mobilný výkon), 21. 10. 2026. Podklady: `FAKTY.md`, `PROTOTYPY.md`, snímky
`fakty/`, `proto/snimky/`, majiteľova snímka `../majitel-iphone-film.png` (zmenšená: `porota/majitel-film-mala.jpg`).
Vlastné overenie poroty: `porota/over-b.mjs` → `porota/raw/over-b.json`, `porota/raw/B430-*.png`, `porota/raw/B375-*.png`,
`porota/vysky.mjs` (výšky textov). Server 8686 nad `proto/`, po meraní ukončený (`curl 127.0.0.1:8686` → bez odpovede,
0 procesov `chrome-linux/chrome`). Strom `hs-lahky` som len čítal.

## Verdikt

**B (celá fotka na šírku, okolie z tej istej fotky rozmazané v malom plátne) pre všetkých 9 titulných kariet aj fasádu
úvodu, s jednou opravou rozloženia pri kartách so stredovým textom (pozri „Nález poroty“).** C ani A sa nekombinujú.

## Prečo (čísla)

| kritérium | A dnes | **B plátno** | C prejazd (2896) | PC 1440×900 |
|---|---|---|---|---|
| zo scény vidno naraz | 30,8 % (stol 17,3 %, kava 19,7 %) | **100 %** | 30,8 % (100 % za 18 s) | 93,7 % |
| px fotky na CSS px, 390 / 430 | 3,05 / 2,76 (stol 2,43 / 2,20; s priblížením 1,06 stol 2,08) | **3,71 / 3,37** (aj 375: 3,86) | 2,29 / 2,07 | 1,51 (DPR 1), 2,01 (DPR 2) |
| bajty fotiek celej stránky | 2 753 498 B | **991 129 B (−64 %)** | 3 679 664 B (+34 %) | – |
| dekódované MP na kartu | 3,73 | **1,40** | 5,59 (vstup 11,19) | – |
| skrol pri CPU 4×: nakreslené / zahodené, LoAF > 50 ms | 179 / 4, 0 | **181 / 1, 0** | 200 / 2, 0 | – |
| raster pri skrole | 80 úloh / 83,1 ms | **39 / 47,9 ms** | 71 / 56,5 ms | – |

Zdroj: `PROTOTYPY.md` (tabuľky Ostrosť, Cena, CPU 4×), `FAKTY.md` časť 1 a 3, `porota/raw/over-b.json`.

- **Majiteľova sťažnosť je o scéne, nie o ostrosti.** Na jeho snímke (`majitel-iphone-film.png`, 1290×2796) je z
  Čakárne len pumpa a kúsok buldoga; na počítači sú kreslá, hĺbka sály, buldog aj pumpa (`fakty/porovnanie-cakaren.jpg`).
  B je jediná možnosť, ktorá ukáže 100 % záberu naraz a bez pohybu – teda „fotky úplné“.
- **B je zároveň najostrejšia na pixel** (3,37 px/CSS px na jeho 430×932, kritérium ≥ 2 splnené s rezervou 68 %) a
  **najľahšia** („ľahký ako pierko“): 0,99 MB fotiek namiesto 2,75 MB, 1,40 MP na kartu namiesto 3,73.
- **Plynulosť:** pri skrole pri CPU 4× najmenej zahodených snímok (1 zo 182) a polovičný raster oproti A; 0 LoAF > 50 ms.
- **Rovnaký vzhľad:** texty, farby, tlačidlá, poradie kariet, lišta a prechody kariet ostávajú. Mení sa len to, že fotka
  stojí v páse cez celú šírku a okolie tvorí tá istá fotka rozmazaná a stmavená – tónom zapadá do tmavej palety
  (`proto/snimky/B-430x932.jpg`). Text karty je pod fotkou, takže je čitateľnejší ako dnes.

Prečo nie ostatné:
- **A** ukazuje 31 % scény (stol 18 %, kava 21 % plochy PC); presne to majiteľ nazval „neúplné“.
- **C** je pekná filmovo, ale: naraz vidno stále len 30,8 %, na 430 má 2,07 px/CSS px (s akýmkoľvek priblížením pod 2),
  stránka je o 34 % ťažšia ako dnes a 3,7× ťažšia ako B, vstup by bez stropu ťahal 11,19 MP (44,8 MB v pamäti), začiatok
  prejazdu padá na rozmazané popredie (Hlavná sála 0 s, `proto/snimky/C-430x932.jpg`) a neustály pohyb pod textom
  zhoršuje čitateľnosť. Kombinácia „C pre široké scény“ by preto porušila „ľahký ako pierko“ aj kritérium ostrosti.
- **A pre detaily** (kava): A tam ukazuje 19,7 % a odreže polovicu šálky aj spodok podnosu (`FAKTY.md` časť 2),
  teda tiež „neúplná“. B ukáže celý podnos v slnku (`porota/raw/B430-kava.png`).
- **B s CSS rozmazaním** zamietnuté: 112 rastrových úloh / 598,4 ms, 16 zahodených snímok, 2 LoAF (81 ms).

## Nález poroty: prototyp B zakrýva fotku textom pri kartách so stredovým textom

`porota/raw/over-b.json` (všetkých 9 titulných kariet, 3 rozmery, `?foto=B&uvod=off`), medzera = vrch textu − spodok fotky:

| karta (`data-card`) | 390×844 | 430×932 | 375×667 |
|---|---|---|---|
| rohozka (center, úvod) | **−103** | **−103** | **−133** |
| kreslo-stred (center) | **−67** | **−67** | **−97** |
| vstup (center) | **−103** | **−100** | **−134** |
| sala-rano (left, dlhší text) | 112 | 145 | 7 |
| ostatné (left/right) | 136–160 | 169–198 | 31–54 |

Na `porota/B430-styri.jpg` (úvod, vstup, kava, sud pri 430×932) je vidno, že „Tvoj strih.“ a „Kedy si sadneš?“ ležia
cez dolnú tretinu fotky. To by bola opäť „neúplná fotka“, preto to staviteľ musí opraviť (krok 4 nižšie).
Výšky textov (`porota/vysky.mjs`): center karty 390: rohozka 277, kreslo-stred 188, vstup 260 CSS px; pri 375×667
vychádza fotka hneď pod lištou + text pod ňou: 60 + 8 + 250 + 24 + 272 = 614 ≤ 667, takže sa zmestí aj na najmenší iPhone.

## Postup pre staviteľa

Pracuj v strome vetvy `barbershop-lahky-telefon` (po dohode s tímom, ktorý v ňom pracuje). Prototyp na čítanie:
`proto/barbershop-30/assets/foto-proto.{css,js}`. Do produkcie **nepreberaj** prepínač `?foto=`, variant C, `&rozmaz=css`
ani zmazávanie `<source>` skriptom (závisí od poradia sťahovania; má to byť deklaratívne v HTML).

1. **`source/tools/stills.py` → `index.html`** (11 `<picture>`: 9 titulných + šablóny `still-uvod`, `still-vstup` a
   `<noscript>`; 22 riadkov `<source media="(max-width: 720px)">`):
   - telefónny výrez `-m` nech platí len pre úzke okno s myšou: `media="(max-width: 720px) and (hover: hover)"`.
     Ľahký telefón (`hover: none`) tak prejde na zdroje na šírku `-1086/-1448/-2172/…`. Úzke okno počítača ostáva bez zmeny.
   - `sizes` na zdrojoch na šírku a na `<img>`:
     `(hover: none) and (max-width: 720px) 100vw, (hover: none) and (max-height: 720px) 66vw, (max-width: 720px) 93vw, 124vw`.
     Očakávaný výber: 390 aj 430 pri DPR 3 → `-1448` (1170 / 1290 px), telefón na šírku 932×430 → `-2172` (1845 px),
     počítač bez zmeny (124vw). Súbory `-2896`/`-4096` sa na telefón nesmú dostať.
2. **Hlavičkový skript `index.html` (r. 22–25, a jeho zdroj v `stills.py`):** `m=matchMedia('(max-width: 720px) and (hover: hover)').matches`
   a `imagesizes` = presne ten istý reťazec `sizes` ako v kroku 1 (inak sa predbežné načítanie úvodu nepoužije a stiahne sa dvakrát).
3. **`assets/style.css`, nový blok „L-foto: celá fotka na telefóne“** za pravidlá P11 (r. ~1133–1160), celý pod
   `@media (max-width: 720px) and (orientation: portrait)` a `html.lite`:
   - `html.lite .film-shot.is-title .film-still > img`: `position:absolute; left:0; right:0; z-index:1; width:100vw;
     height:calc(100vw / var(--pa, 1.5)); max-width:none; object-fit:cover; object-position:50% 50%; transform:none;
     will-change:auto; box-shadow:0 18px 40px rgba(0,0,0,.45);`
     `top: max(calc(var(--nav-h) + 8px), calc(var(--nav-h) + (58svh - var(--nav-h) - 100vw / var(--pa, 1.5)) / 2));`
     (z `foto-proto.css`). Špecifickosť musí prebiť `style.css:475` (`will-change: transform`) a `:470` (priblíženie),
     inak fotka dostane vlastnú vrstvu a orez 1,06.
   - plátno pozadia `html.lite .film-still > canvas.foto-bg`: `position:absolute; inset:0; width:100%; height:100%;
     z-index:0; transform:none; will-change:auto; pointer-events:none; opacity:0;` a `.is-painted{opacity:1}`.
     `.film-still { background: var(--ink); }` (kým sa plátno nenakreslí, okolie je tmavé, fotka a text už sú vidno).
   - vinetácia `::after` z `foto-proto.css` (hore len pod lištou, dole pod textom, fotku v strede netónuje).
   - **žiadny** `filter: blur` ani `backdrop-filter` v ľahkom režime.
   - telefón na šírku (`orientation: landscape`) nech ostane obyčajný cover ako na počítači (`object-position: var(--fx) var(--fy)`),
     plátno `display:none`.
4. **Oprava stredových kariet** (`data-card="center"`: rohozka, kreslo-stred, vstup, aj fasáda pri `pro`):
   fotka `top: calc(var(--nav-h) + 8px)`; textový blok titulnej karty zarovnaný hore s odsadením
   `calc(var(--nav-h) + 8px + 66.7vw + 24px)` (66,7vw = výška fotky 3:2; rohožka 16:10 má 62,5vw, rezerva 4vw je v poriadku).
   Konkrétnu vlastnosť (`align-content`/`padding-top` na `.title-frame` alebo `.title-card`) urč podľa P11 v `style.css`.
   Poradie a znenie textov sa nemenia, iba ich zvislá poloha na telefóne na výšku.
5. **JS (do `assets/app.js`, len vetva `lite`, ~30 riadkov z `paintBg` vo `foto-proto.js`):** pre každú titulnú
   `<picture class="film-still">` vlož `<canvas class="foto-bg" aria-hidden="true">` pred `<img>`; po `load` + `img.decode()`
   nakresli 36 × round(36·vh/vw) px, `ctx.filter='blur(1.2px)'` ak existuje, `drawImage` cover okolo `--fxn`, prekrytie
   `rgba(14,13,12,.52)`, potom `is-painted`. Prekresli len pri zmene `innerWidth` (otočenie), s odstupom 150 ms.
   Pri chybe nič – ostane `var(--ink)`. Brána „fotka sa nikdy neukáže neúplná“ (f1f9c4d, `--so` až po dekódovaní) ostáva.
   Voliteľne: v `lite` nepíš `--sp` na `<img>` (priblíženie je v B vypnuté, zápis by len spúšťal prepočet štýlu).
6. **Dokumentácia:** zapíš do `SPEC-LAHKY-TELEFON.md` ako L4c („celá fotka na šírku“, nahrádza L4a/L4b) a V7 zo
   `SKEPTIK.md` označ za vyriešené číslami z K1.

### Kritériá prijatia (každé podložiť príkazom a výstupom)

- **K1 ostrosť:** 9 titulných kariet (fasáda `still-vstup` sa v lite nepoužije, `pro` vzniká len pri filme; jej
  `<source>` však uprav rovnako) pri 390×844 a 430×932, DPR 3, `isMobile`, `hasTouch`: `naturalWidth(currentSrc) / img.getBoundingClientRect().width ≥ 2,0`
  (očakávané 3,71 a 3,37; 375×667: 3,86). `currentSrc` končí `-1448.avif`, nikde `-m-`, `-2896`, `-4096`.
  Telefón na šírku 932×430: `-2172`, ≥ 2,0 (očakávané 2,33).
- **K2 žiadna neúplná fotka:** pomer rámika = pomer súboru (odchýlka ≤ 0,5 %; prototyp 0,05 %), `left = 0`,
  `right = innerWidth ± 0,5`, `top ≥` spodok lišty, `transform: none`. Medzera vrch textu − spodok fotky ≥ 16 px pri 390 a 430,
  ≥ 0 pri 375×667, pre **všetkých 9** kariet (dnes −67 až −134 pri troch stredových). Počas skrolu v každom rAF:
  žiadna karta s `opacity > 0` a `!img.complete`. Snímky každej karty pri 430×932 pridať do odovzdania.
- **K3 plynulosť:** CPU 4× (`Emulation.setCPUThrottlingRate 4`), 390×844 DPR 3, celá stránka po 422 px každých 260 ms
  + 3 s plynulého skrolu na Čakárni, Úvode a Vstupe; `PerformanceObserver('long-animation-frame')` počas skrolu:
  **0 záznamov > 50 ms v 3 behoch po sebe** (zapísať `/proc/loadavg`; pri > 3 beh zopakovať). Zahodené snímky ≤ 4 zo ~180
  (základ A). Raster pri skrole ≤ 83 ms (A).
- **K4 váha:** bajty fotiek celej stránky ≤ 1,05 MB (prototyp 991 129 B), dekódované spolu ≤ 13 MP, 0 pravidiel
  `filter: blur` v ľahkom režime (`grep -n 'blur' assets/style.css`).
- **K5 rovnaký vzhľad:** zoznam `innerText` všetkých `.title-card` zhodný s HEAD (`diff` prázdny); farby (tokeny na `:root`)
  bez zmeny; počítač 1440×900 `?film=off` – `currentSrc` všetkých kariet a snímka pixelovo zhodné s HEAD; úzke okno
  s myšou 700×900 stále berie `-m`.
- **K6 prvý obraz:** filmový pás prvých 3 s (390×844, CPU 4×, Fast 4G): v prvom obraze s obsahom je fotka úvodu aj nadpis
  „Tvoj strih. Tvoje miesto.“ a tlačidlá, nikdy čierna plocha (požiadavka 2 majiteľa).
- **K7:** `source/tools/app-smoke.mjs` a `i18n-test.mjs` prejdú; potom pohľad majiteľa na jeho iPhone (430×932).

## Výhrady

- Fotka v B má na telefóne šírku displeja (mierka scény 0,29 oproti 0,37 na PC pri DPR 1): celá, ostrá, ale menšia.
  Ak ju majiteľ na iPhone uzná za malú, ďalší krok nie je C, ale väčší pás (napr. 4:3 výrez = 89 % šírky scény,
  +12 % výšky) – treba ho najprv ukázať.
- Všetko je merané v Chromiu. Výber `-1448` zo `sizes`, `hover: none` a cena plátna v Safari treba overiť na iPhone
  (SPEC M1); Chromium neobmedzuje CPU skladača.
- Prototyp nepreveril telefón na šírku ani otočenie (plátno sa v prototype neprekreslí) – rieši krok 3 a 5.
- LoAF 64 ms v pokoji pri B (1 záznam) je pri `loadavg` 2,9–3,1 na hranici šumu; K3 to musí potvrdiť opakovaním.
