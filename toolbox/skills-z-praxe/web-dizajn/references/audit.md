# Dizajn audit hotovej stránky (`scripts/dizajn-audit.mjs`)

Nástroj otvorí stránku v Chromiu (Playwright) na niekoľkých šírkach a zmeria to, čo sa pri dizajne ľahko
prehliadne: stupnicu písma, rozostupy, kontrast proti skutočnému pozadiu, dotykové plochy, osnovu nadpisov,
pretečenie, správanie pri `prefers-reduced-motion` a chyby konzoly. Je všeobecný, nič v ňom nie je viazané na
naše weby. Výsledok je správa pre človeka (`sprava.md`), dáta pre ďalšie spracovanie (`sprava.json`) a snímky
celej stránky. Je to kontrola po stavbe, nie náhrada oka: snímky si vždy prezri.

## Spustenie

```bash
node scripts/dizajn-audit.mjs <url-alebo-cesta-k-html> <výstupný-priečinok> [--sirky=390,768,1440] [--bez-snimok] [--cakaj=ms]

# lokálny súbor (nástroj sám spustí statický server nad priečinkom súboru)
node scripts/dizajn-audit.mjs index.html /tmp/audit
# naživo, len telefón, bez snímok
node scripts/dizajn-audit.mjs https://example.com/ /tmp/audit --sirky=390 --bez-snimok
```

| Voľba | Význam |
| --- | --- |
| `<url-alebo-cesta-k-html>` | `http(s)://` adresa, cesta k `.html`, priečinok (vezme `index.html`) alebo `file://`. Súbor sa servíruje cez vstavaný server (`node:http`, voľný port, `Range` pre video, `Cache-Control: no-store`): cez `file://` prehliadač blokuje písma (CORS) a `fetch`, meranie by nesedelo. |
| `<výstupný-priečinok>` | `sprava.md`, `sprava.json`, `snimka-<šírka>.png`; vytvorí sa. Výstupy nedávaj do repozitára. |
| `--sirky` | šírky okna; výška 844 pri 390 (a pod 600), 1024 pri 768 (a pod 1024), inak 900. Pod 1024 px beží ako telefón (`isMobile`, `hasTouch`). |
| `--bez-snimok` | bez snímok celej stránky. |
| `--cakaj` | ms po `load` a `document.fonts.ready`, kým dobehne úvod stránky (predvolené 1500). Potom ešte čaká na konečné animácie (najviac 5 s). |

Návratový kód: **0** bez závažných nálezov, **1** pri závažných, **2** chyba nástroja (zlé argumenty, chýba
súbor alebo Playwright). Šírka, ktorá zlyhá (napr. stránka sa nenačíta), sa zapíše do správy ako nález a ostatné
šírky bežia ďalej. Celý zásobník volaní pri chybe nástroja: `DIZAJN_AUDIT_LADENIE=1`.

Playwright sa hľadá v `node_modules` projektu (aktuálny priečinok a priečinok skriptu), potom v `NODE_PATH`,
v `npm root -g` a na známych globálnych cestách (`/opt/node22/lib/node_modules` ...). Nič sa neinštaluje.
Chromium berie Playwright (`PLAYWRIGHT_BROWSERS_PATH`, tu `/opt/pw-browsers`); keď ho nenájde, skript hľadá
`chromium-*/chrome-linux/chrome` v `/opt/pw-browsers`, `$PLAYWRIGHT_BROWSERS_PATH` a `~/.cache/ms-playwright`
a spustí ho cez `executablePath`. Prehliadač beží so SwiftShaderom (WebGL bez grafickej karty) ako ostatné
nástroje v toolboxe, takže stránky s WebGL pozadím sa merajú s pozadím. V tomto kontajneri: Playwright 1.56.1
z `NODE_PATH`, Chromium 141.0.7390.37. Adresa naživo ide cez proxy z prostredia (overené na
`https://d8f5s88zjy-art.github.io/head-spa-30/`).

Trvanie: jednoduchá stránka asi 6 s na šírku, BARBERSHOP 30 asi 30 s, HEAD SPA 30 (WebGL film v softvéri) 45 s
na telefóne a 100 až 140 s na počítači. Najdlhšia je fáza kontrastu (snímky okna pod textom s fotkou).
Časy po fázach sú v správe pri každej šírke (`Trvanie`).

## Čo meria

Pred meraním: načítanie, písma, `--cakaj`, dobehnutie konečných animácií, potom **prvý prechod** stránkou po
80 % výšky okna (odkryje obsah s IntersectionObserver a lenivé obrázky) a návrat hore. Merania 1, 2, 4, 5 a 6 sú
z celej stránky naraz, kontrast z **druhého prechodu** po 70 % výšky okna.

Do typografie a rozostupov ide obsah, ktorý je vykreslený (nie `display: none`, `visibility: hidden`) a nie je
skrytý pre čítačky (`clip: rect(0 0 0 0)`, `clip-path: inset(50%)`, rozmer 1 px). Text orezaný predkom
(zavretý akordeón s `height: 0; overflow: hidden`) sa ráta, je to obsah, ktorý sa ukáže po otvorení.

1. **Typografia.** Veľkosti písma (px) a počet prvkov s každou, počet rôznych veľkostí a susedné veľkosti bližšie
   ako 1 px (rozpadnutá stupnica, typicky `clamp()` s `vw`). Rodiny z `font-family` (prvá v zásobníku, rez, váha).
   Či sa písmo naozaj kreslí: `document.fonts` (stav každého `@font-face`) a CDP `CSS.getPlatformFontsForNode`
   (ktoré písmo prehliadač použil a na koľko znakov). Keď vlastný text prvku obsahuje znak, ktorý prvé písmo
   nemá (overené na plátne: šírka znaku s dvoma rôznymi zálohami sa líši), nález vypíše znak aj kód U+.
   Dĺžka riadku odsekov (blokové prvky bez blokových potomkov, aspoň 80 znakov a dva riadky): šírka obsahu delená
   priemernou šírkou znaku textu (`measureText` s písmom prvku, plus `letter-spacing`). Rozsah 45 až 75 znakov,
   na šírkach pod 600 px 30 až 75. Riadkovanie bežného textu (do 24 px) ako násobok veľkosti.
2. **Rozostupy.** `margin`, `padding` a `gap` (pri flex a grid) všetkých viditeľných prvkov: počet výskytov
   každej hodnoty, počet rôznych hodnôt a podiel výskytov mimo škály 4 px (tolerancia 0,5 px); pre porovnanie aj
   mimo 2 px a 8 px. Centrovanie cez `margin: auto` sa nepočíta. Najčastejšie hodnoty mimo škály majú príklad
   so selektorom a vlastnosťou.
3. **Kontrast.** Textové prvky = prvky s vlastným textom, ktorý obsahuje písmeno alebo číslicu. Pre každý text
   v okne: bod v jeho textovom uzle, `document.elementsFromPoint` (skutočné poradie vrstiev, aj `position: fixed`
   pozadie; počas merania `pointer-events: auto`, aby boli vidno aj vrstvy, ktoré ich vypínajú), farba textu
   (`-webkit-text-fill-color`, priehľadnosť prvku a predkov) proti zloženým farbám pozadia od textu nadol po prvú
   nepriehľadnú. Pomer podľa WCAG 2 (relatívny jas sRGB). Limit 4,5:1, pre veľký text (24 px, alebo 18,66 px
   tučné od 700) 3:1. Keď je pod textom obrázok, video, plátno, SVG alebo `background-image` (aj prechod farieb),
   meranie je **neisté**: nástroj na chvíľu spraví text priehľadný a bez tieňa, odfotí okno a spočíta pomer
   farby textu proti pixelom pod textom (medián a najhorších 10 %). Text, ktorý v žiadnej polohe nebol navrchu
   (zavretý panel, `<details>`), dostane pomer zo štýlov predkov (priehľadnosť sa ignoruje); keď je pod celou
   stránkou pevný obrázok alebo plátno a pozadie sa našlo až na `html`/`body`, je neistý.
   Nemerajú sa: nevykreslený text, text len pre čítačky, neaktívne ovládacie prvky (`disabled`, výnimka WCAG).
   Text v `aria-hidden` sa meria, ale nález je len info (dekoratívny).
4. **Dotykové plochy** (šírky pod 600 px). Odkazy, tlačidlá, prvky s rolou tlačidla, odkazu, karty, položky
   menu, prepínača, polia formulára a `summary` menšie ako 44 × 44 px (pole s `<label>` sa ráta s popisom).
   Odkaz vo vete (inline, rodič má vlastný text) je výnimka WCAG, nález je info. Pod 24 px sa pripíše WCAG 2.5.8.
   Prvky úplne mimo obrazovky (odkaz na preskočenie, vysúvacie menu posunuté transformom) sa nerátajú.
5. **Štruktúra.** Nadpisy `h1` až `h6` a `role="heading"` v poradí dokumentu (bez skrytých a `aria-hidden`; skrytý
   len pre čítačky sa ráta): počet `h1`, preskočené úrovne, osnova. Obrázky bez atribútu `alt` (nie v
   `aria-hidden`, nie `role="presentation"`). Ovládacie prvky bez prístupného mena z prístupného stromu prehliadača
   (CDP `Accessibility.getFullAXTree`, meno počíta Chromium): odkaz, tlačidlo, pole, prepínač ...; grafika len s
   výslovným `role="img"` mimo odkazu a tlačidla (ako Lighthouse). Atribút `lang` na `<html>`.
6. **Rozloženie.** Pretečenie: `scrollWidth` dokumentu väčší ako šírka okna (keď ho koreň neoreže) alebo
   `innerWidth` väčší ako šírka okna (telefón pri pretečení stránku oddiali a rozšíri rozloženie). Pôvodcovia:
   najvyššie prvky, ktorých pravý okraj presahuje šírku, nie sú v orezávajúcom predkovi (absolútne prvky
   uniknú z predka, ktorý nie je ich kontajnerom) a nie sú pevné. Keď `overflow-x: hidden/clip` na `html` alebo
   `body` pretečenie skryje, je to nález na pozor (zakrytá chyba). Pevné prvky celé vpravo mimo okna (vysúvacie
   menu) sú info.
7. **Pohyb.** Bežiace animácie z `document.getAnimations()` (CSS animácie, prechody, Web Animations; zvlášť
   nekonečné) a snímky `requestAnimationFrame` za sekundu (obal rAF pred skriptmi stránky), hore na stránke a
   v strede. Rovnaké meranie v druhom behu s `reducedMotion: 'reduce'`. Nekonečné animácie alebo rAF od 20 za
   sekundu pri reduce sú nález na pozor. Info, keď štýly nemajú žiadne `@media (prefers-reduced-motion)`.
8. **Konzola a požiadavky** (oba behy). `console.error`, chyby skriptu (`pageerror`), odpovede 4xx a 5xx a
   neúspešné požiadavky. Prerušené (`net::ERR_ABORTED`, napr. video, ktoré prehliadač zruší) sú info.
   Hlásenie „Failed to load resource“ sa nezdvojuje, ide ako záznam požiadavky.

### Závažnosť

| Závažné (kód 1) | Pozor | Info |
| --- | --- | --- |
| kontrast bežného textu pod 3:1 (isté meranie) | kontrast pod limitom (4,5 alebo 3 pri veľkom texte) | použité veľkosti, zhrnutia |
| vodorovné pretečenie a jeho pôvodcovia | neistý kontrast s mediánom z pixelov pod limitom, bez tieňa textu | neistý kontrast s tieňom alebo bez pixelov |
| žiadny alebo viac ako jeden `h1` | dotyková plocha pod 44 × 44 px | odkaz vo vete pod 44 px |
| obrázok bez atribútu `alt` | preskočená úroveň nadpisu, prvok bez prístupného mena, chýba `lang` | prvý nadpis nie je `h1` |
| `console.error`, chyba skriptu, HTTP 4xx/5xx, neúspešná požiadavka | viac ako 12 veľkostí písma, text pod 12 px, viac ako 3 rodiny, písmo sa nenačítalo alebo nekreslí, znaky v systémovom písme | znaky v ďalšom písme zo zásobníka, systémové písmo bez `@font-face` |
| stránka sa nenačítala | riadok nad 75 znakov, riadkovanie bežného textu pod 1,3, rozostupy mimo 4 px nad 30 % | krátky riadok, riadkovanie nad 2, rozostupy prevažne na škále |
| | pohyb pri reduce, obsah skrytý cez `overflow-x` koreňa | pohyb pri reduce ustane, pevný prvok mimo obrazovky |

## Ako čítať správu

`sprava.md`:

1. **Hlavička**: adresa (pri súbore aj cesta), čas, verzia nástroja a Chromia, šírky, počty nálezov a návratový kód.
2. **Súhrn po oblastiach**: tabuľka závažné, pozor, info a hlavné čísla každej šírky.
3. **Hlavné nálezy**: najviac 30 závažných a na pozor, zoradené podľa závažnosti a počtu výskytov. Riadok:
   závažnosť, oblasť, príklad selektora, šírky a počet výskytov, hodnota, popis. Rovnaké nálezy sa **zlučujú**:
   naprieč šírkami a naprieč opakovanými komponentmi (skupina = selektor bez `id` a poradia, takže 17 kariet
   rituálov je jeden nález). Keď sa hodnota líši podľa šírky, je pred ňou šírka (`768: 81 znakov`).
4. **Po šírkach**: veľkosti písma s počtami, rezy a čím sa naozaj kreslia (meno je z tabuľky mien v súbore
   písma, napr. orezaný Manrope sa hlási ako „Manrope ExtraLight“; ráta aj obsah `::before` a `::after`),
   odseky a znaky na riadok, riadkovanie, `@font-face` so stavom, rozostupy s najčastejšími hodnotami a
   príkladmi mimo škály, kontrast (koľko textov v okne, koľko zo štýlov predkov, koľko neistých, koľko okien sa
   fotilo, prečo ostali texty nezmerané a kde), dotyk, osnova nadpisov, rozloženie, pohyb, trvanie po fázach.
5. **Info**: najviac 60 nálezov, zvyšok v JSON.

`sprava.json`: `suhrn` (počty, aj `podlaOblasti`), `nalezy` (zlúčené: `zavaznost`, `oblast`, `kod`, `selektor`,
`skupina`, `sirky`, `pocet`, `hodnoty`, `popis`), `sirky[]` so surovými meraniami každej oblasti (napr.
`kontrast.vysledky[]` s `farba`, `pozadie`, `pomer`, `nejiste`, `metoda` `okno`/`predkovia`, pri fotke `pixely`
a `pomerZoStylov`; `rozostupy.hodnoty`; `struktura.nadpisy`; `pohyb.bezny`/`reduce`; `casy`) a `konzola` (všetky
záznamy oboch behov). Kódy nálezov: `vela-velkosti`, `maly-text`, `pismo-*`, `riadok-dlhy`, `riadkovanie-tesne`,
`skala-4`, `kontrast`, `kontrast-neisty`, `dotyk-maly`, `h1`, `preskok`, `alt`, `meno`, `jazyk`, `pretecenie`,
`pretieka`, `orezane`, `reduce-nekonecne`, `reduce-raf`, `console.error`, `pageerror`, `http`, `requestfailed` ...

Ako s nálezmi pracovať:

- Najprv závažné, potom pozor. Pri kontraste over farbu v CSS (často je chyba v špecifickosti, nie v palete, pozri
  BARBERSHOP 30 nižšie) a pozri snímku.
- **Neisté** nálezy kontrastu (text na fotke, na filme, na prechode) ber ako upozornenie: medián z pixelov hovorí,
  aké je pozadie najčastejšie, najhorších 10 % hovorí o svetlých miestach. Tieň textu (`text-shadow`) čitateľnosť
  zlepší, WCAG ho však do pomeru neráta.
- Počet veľkostí písma a rozostupy mimo škály sú merané fakty, nie chyby. Či vadia, rozhoduje dizajnový systém
  webu (pravidlá v `CLAUDE.md`, `ART_DIRECTION.md`); pri prerábke ich zjednoť, pri hotovom webe neprerábaj kvôli
  číslu.
- Dĺžka riadku je kapacita riadku (koľko znakov sa zmestí), nie počet znakov v konkrétnom riadku.

## Známe obmedzenia

- Kontrast sa meria v jednom bode textu (stred prvého riadku). Text cez rozhranie dvoch plôch alebo s rôznym
  pozadím po riadkoch sa posúdi podľa prvého riadku; pri fotke pomáha snímka (celé obdĺžniky textu v okne).
- Pseudo-prvky (`::before`, `::after`) s pozadím pod textom alebo nad ním `elementsFromPoint` nevidí ako samostatné
  vrstvy (vráti hostiteľa). Prekrytie gradientom cez `::after` sa preto prejaví len pri meraní z pixelov.
- `mix-blend-mode`, `background-clip: text`, `filter` a priehľadnosť, ktorá sa mení so skrolom, robia meranie
  neistým (zapíše sa dôvod). Pri premenlivej priehľadnosti sa berie meranie s najvyššou priehľadnosťou.
- Text na fotke sa meria z pixelov len v okne, kde bol navrchu. Na telefóne pri pretečení rastie `innerHeight`
  nad viditeľné okno; spodok stránky potom dostane len meranie zo štýlov (neisté). Stránka s pretečením má však
  aj tak závažný nález.
- Obsah, ktorý je `display: none` (zatvorené menu, dialóg, iný jazyk), sa nemeria; v správe je počet a miesto
  (napr. `#drawer` ×15). Otvorené stavy menu a dialógov over zvlášť (skript s kliknutím, `webapp-testing`).
- Dotykové plochy: rozmer je `getBoundingClientRect` prvku; plochu zväčšenú cez `::before` s `inset` záporným
  nástroj nevidí. Výnimka WCAG 2.5.8 (dostatočný odstup od susedov) sa neposudzuje.
- Dĺžka riadku je odhad z priemernej šírky znaku textu; overené proti skutočným zlomom riadkov (85 oproti 83 a
  59 oproti 58 znakom). Pri dvojriadkovom odseku sa prvý riadok môže zlomiť skôr (83 oproti 70).
- Mená písiem z CDP sú z tabuľky mien súboru (`Manrope ExtraLight` pri orezanom variabilnom Manrope), nie
  z `@font-face`. Rozhoduje príznak vlastného písma.
- Shadow DOM a obsah v `<iframe>` sa neprechádzajú.
- rAF za sekundu závisí od rýchlosti kreslenia: WebGL v SwiftShaderi na počítačovej šírke dá menej snímok
  (HEAD SPA 30: 44 na telefóne, 6 až 7 na počítači), podstatné je porovnanie s behom pri reduce.
- Stránka, ktorá sa sama presmeruje alebo prenačíta počas merania, preruší meranie tej šírky (zapíše sa ako nález).
- Nástroj na stránke dočasne mení štýly (pozri hlavičku skriptu). Na živú stránku nič neposiela, nič neklikne.

## Overenie nástroja na vzorkách

Dve skúšobné stránky (v scratchpade, nie v repozitári) s úmyselnými chybami a s pascami na falošné nálezy:

- **So chybami** (390 a 1440): nástroj našiel všetko, čo tam bolo: kontrast 2,85:1 (závažné) a 4,48:1 (pozor),
  text v zavretom paneli 2,32:1 zo štýlov predkov (závažné), 2× `h1`, preskok h2 → h4, `img` bez `alt`,
  tlačidlo s ikonou bez mena, chýbajúci `lang`, pretečenie 600 px širokým prvkom (`innerWidth` 616 pri šírke 390,
  pôvodca nájdený), tlačidlá 20 × 20 a 32 × 25 px, odkaz vo vete ako info, riadok 192 znakov, riadkovanie 1,1,
  znak U+2011 mimo orezaného Manrope, biely text na svetlej časti fotky (~1,68:1 z pixelov), tmavý text na
  tmavom plátne (~1,26:1), nekonečnú animáciu, ktorá beží aj pri reduce, `console.error` a HTTP 404, tlačidlo
  bez `font: inherit` (Arial, systémové písmo, info). Nenahlásil text len pre čítačky, `display: none`,
  dekoratívny `aria-hidden` (len info), `alt=""`, obrázok v `aria-hidden`, veľký text s 3,03:1.
- **Čistá** (390, 768, 1440): 0 závažných. Dva nálezy na pozor sú skutočné (`summary` 25,6 px a tlačidlo
  akordeónu 31,6 px vysoké). Bez falošných nálezov pri odkaze na preskočenie mimo obrazovky, vodorovnom páse
  s `overflow-x: auto`, `overflow-x: hidden` na tele, pevnej hlavičke, obsahu odkrývanom pri skrole
  (IntersectionObserver), zatvorenom `<details>`, zavretom akordeóne a svetlom texte na tmavej fotke.

## Prvý beh na našich weboch

VÝSLEDKY_PRVEHO_BEHU
