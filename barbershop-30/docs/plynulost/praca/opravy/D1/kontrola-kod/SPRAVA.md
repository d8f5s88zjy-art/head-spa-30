# Kontrola kódu D1 „Stránka bez zásekov pri skrole a prvom dotyku“ (staff recenzent)

Kontrolovaný rozsah: `bcd487e..7ea247c` (12 súborov, +373/−90) vo vetve `barbershop-plynulost`, pracovný strom čistý.
Servery: po = HEAD na porte 8400 (`$SP/hs2`), pred = worktree `bcd487e` na porte 8402 (`$SP/barber/opravy/pred-D1`).
Prvý pokus kontroly (13:23–13:41) bol prerušený pri teste `strih-shot`; tento pokus naň nadviazal: výstupy testov
a vlastných overení z prvého pokusu sú v `testy/`, `skrol-trieda/`, `svetlo-fazy/`, `menu-jazyk/`, `flap-tempo.txt`;
nové overenia tohto pokusu: `flap-posun.mjs` + `flap-posun-pc.mjs` (`flap-posun/`), `svetlo-fazy.py` (`svetlo-fazy.txt`),
`koliesko-skrol.mjs`, `cyr-poziadavky.mjs`, `animacie-unik.mjs`, `menu-jazyk.mjs --tah=0` na strome pred,
`i18n-test` (nový) na strome pred, opakovanie `strih-shot` (`testy/strih-shot-2.txt`, `testy/strihy2/`).

## 1. Diff riadok po riadku – čo je v poriadku

- **K01 premenné skrolu** (`app.js:95–97, 169–181, 191–218`, `style.css:426–432, 1018, 1110`): `@property` bez dedenia,
  `--o`/`--so` s `initial-value: 1` a nulové východisko cez triedne pravidlá (`html.karty … .title-frame { --o: 0 }`,
  `… .film-still { --so: 0 }`), inline zápis z app.js má prednosť. Všetky čítania `var(--sp|--o|--so)` v CSS sú na
  prvkoch, na ktoré app.js píše (`style.css:457, 1006, 1018, 1107, 1112`); film.js ani iný JS ich nečíta. Cache
  `el.__v` per prvok (`setVar`, `app.js:118`). `spNeeded()` len `classList.contains`, MutationObserver na triedu
  `<html>` dorovná stav pri `world-off`/`world-frame` za behu (`snapNow(0)`). Bez `@property` (Safari < 16.4) sa
  premenné dedia ako doteraz – zápis je na potomkovi kotvy, takže čítajúci prvok dostane správnu hodnotu.
- **K11 data-scene-active**: všetky selektory v CSS testujú len prítomnosť (`style.css:390, 622, 951, 957, 1012–1013`),
  nič nečíta hodnotu (`grep sceneActive` → len testy). Nastaví sa pred prvým `apply()` (`app.js:688`).
- **T4/K12 trieda skrol** (`app.js:298–319`): pridanie aj zrušenie v snímke slučky; stav po `visibilitychange`,
  po okamžitom skoku, po skoku z menu, po švihoch aj po koliesku vždy skončí bez triedy (`skrol-trieda-po.log`,
  `koliesko-skrol`: zrušená 1 771 ms po koliesku, t. j. 150 ms po poslednom posune dobiehania). Selektory pauzy
  mieria len na `.marquee-track`, `.beam-line::before`, `.btn-primary::after`, `.hudba-eq-p` (trieda namiesto značky `i`).
- **Svetlo okraja** (`style.css:1211–1227`): vrstva 291×335 css px na telefóne (pred 1688×1688), 400×461 na počítači
  (pred 2880×2880) – `svetlo-fazy/*.json`. Porovnanie snímok v 8 fázach (0–6 100 ms) pred/po: na 6 px páse okraja
  karty (kde sa svetlo kreslí) **0,0 % pixelov** s rozdielom > 30 na oboch zariadeniach (`svetlo-fazy.txt`,
  `svetlo-fazy/rozdiel-*.png`); rozdiely 0,97–1,16 % sú vnútri karty a sú to texty Manrope 600/700, ktoré pred D1
  kreslil Liberation Sans (`svetlo-fazy/porovnanie-p390-0.png`, nadpisky ADRESA/TELEFÓN) – oprava chyby, pozri bod 3.
  Geometria klinu overená: obdĺžnik 0,867R × R s rohom v strede karty obsahuje celý klin 300–360° do polomeru R
  (R = polovica uhlopriečky + 2 px ≥ vzdialenosť každého bodu rámika).
- **K06/K07 tabuľa** (`app.js:742–816`): preklápanie cez `b.animate`, jedna rAF slučka, bez `offsetWidth`;
  po dobehnutí 0 živých animácií políčok (`animacie-unik`: 9 počas, 0 po), vynútené rozloženia 0 (meranie
  implementátora, kontakt). Formátovač raz, mimo skrolu (`vPokoji`, overené `over-intl` u implementátora).
- **K02/K09 jazyky**: `cyrilika()` s tromi rezmi presne 400/600/700; `i18n-test` na strome **pred** D1 padá na
  2 kontrolách (latinka 700 v tabuli a tlačidle = Liberation Sans, `pred-s-novymi-testami`, vlastný beh
  19:0x), na HEAD prejde (`testy/i18n-test.txt` 66 OK). `app-smoke` na strome pred: 6 FAIL
  (`impl/testy/regres-pred-app-smoke.txt`), na HEAD 114 OK. Regresné testy teda bez opravy padajú a s ňou prejdú.
  Kľúč pre text tabule bez skriptu („Po–Pi 9:00–19:00, So 9:00–14:00“) je vo všetkých 7 slovníkoch.
- **K03 hudba** (`atmosfera.js:96–104, 137–168, 205–220`): kontext v obsluhe `touchend`/`click` (iOS), sťahovanie
  v `setTimeout(0)`, `aria-pressed` podľa `ctx.state` cez `statechange`; `fail()` a `stop()` stav zhodia;
  `atmosfera-test` 41 OK (vrátane ťuknutia pred načítaním modulu). Ťuknutie = 1 prst, ≤ 10 px, ≤ 500 ms, žiadny
  `scroll` medzi `touchstart` a `touchend` (capture na window zachytí aj vodorovné pásy).
- **K16, K08**: `backdrop-filter` len v `@media (min-width: 901px)` (`style.css:956–958`); `ctaHidden(curY)`,
  fokus v rAF s kontrolou `menuOpen` (`app.js:511–518`).
- Funkcie zo zadania: `app-smoke` (`?film=off`, `?motion=off`, reduced-motion, bez WebGL, softvérové kreslenie),
  `uvod-shot`, `uvod-meranie` + `uvod-zhoda` (≤ 5 px), `karty-shot`, `koliesko-test`, `atmosfera-test`
  (`?hudba=off`) – všetky OK na HEAD. `tools/build.mjs` sa `barbershop-30/` netýka (0 zmienok). Komentáre po
  slovensky, commit bez podpisu a bez zmienky o nástrojoch (autor „Claude“ v hlavičke commitu je nastavenie
  prostredia rovnaké pre všetky commity vetvy aj `main`, nie súčasť dávky).

## 2. Nálezy

### N1 (stredná) – Menu na telefóne: položky skočia o 120 px, keď sa prepínač jazyka vloží až po otvorení menu
Po D1 sa na dotyku i18n.js načíta až vo voľnej chvíli (load + 3,5 s + 1 s bez skrolu) alebo pri kliknutí na Menu
(`app.js:461, 468–471`). Kto otvorí menu skôr (prvé sekundy, alebo po súvislom skrolovaní), vidí najprv odkazy
a po 442 ms (Fast 4G) / 1 348 ms (Slow 4G) sa nad ne vloží rad jazykov `.lang` a odkazy Prehliadka…Kontakt sa
posunú o 120 px nadol (`menu-jazyk/po.json`, `po-slow4g.json`: `odkaz_prehliadka_top` 92 → 212, layout-shift
0,0366; pri Slow 4G `hadRecentInput: false`, teda sa ráta do CLS; snímky `menu-jazyk/po-slow4g-150ms.png` bez
jazykov vs `po-slow4g-2650ms.png` s jazykmi). Pred D1 to nastalo len, keď bol úplne prvý dotyk na stránke tlačidlo
Menu (`menu-jazyk/pred-bez-tahu.json`: ten istý posun 120 px); po predošlom ťahu prstom bol prepínač v menu
už pri otvorení (`pred.json`: posun 0). Riziko: ťuknutie na „Prehliadka“ v okamihu posunu trafí rad jazykov
(prepne jazyk). Porušuje ZADANIE §2.4 „bez skokov rozloženia“ a PLAN §5 „CLS ≤ 0,0005 nesmie sa zhoršiť“.
Oprava: rad jazykov vkladať pod odkazy (`i18n.js:235` `nav.prepend(host)` → `nav.append(host)`, alebo pred tlačidlo
Rezervovať), takže odkazy sa nehýbu; alebo vyhradiť miesto vopred (prázdny prvok v `#nav` s výškou radu, i18n.js ho
len naplní – výška radu je 120 px pri 390 px, pri širších telefónoch jeden riadok, preto je vkladanie pod odkazy
spoľahlivejšie). Navyše možno spustiť `load` už pri `pointerdown` tlačidla Menu (skráti čakanie o ~100 ms, nerieši skok).

### N2 (nízka, pred D2 opraviť) – Tabuľa hodín mení výšku pri vyplnení (26 → 57 px telefón, 26 → 33 px počítač)
Pred D1 boli políčka vytvorené pri štarte; po D1 ostáva do priblíženia (IO rootMargin 100 %) text z HTML v jednom
riadku a pri vyplnení (`app.js:806–816`) box narastie – `flap-posun/po.json`: `flapH` 26 → 57, `scrollHeight`
+32 px; `po-pc.json`: 26 → 33 px. Kým sa plní mimo okna (pomalý skrol, telefón pri skoku z menu: tabuľa nad oknom,
Chrome ju vyrovná kotvením skrolu, `y` 15 384 → 15 416), nič nevidno. Pri okamžitom skoku na `#kontakt` na počítači
1440×900 pristane tabuľa hore v okne, text sa zmení na políčka a adresa, telefón aj tlačidlá sa posunú o 8 px
(`po-pc.json` okamžitý: `btnTop` 347 → 355, layout-shift 0,0027 bez vstupu; pred D1 0). Je pod cieľom 0,05, ale
zhoršuje „CLS ≤ 0,0005“ (PLAN §5) a po D2 (okamžitý skok z menu) by to bolo pri každom skoku na Kontakt.
Príčina rastu: na počítači nižší textový riadok než políčka (25,6 → 32,6 px); na telefóne prázdny `.flap-state`,
ktorý po vyplnení dostane „Teraz otvorené“ a zalomí sa do druhého riadka (25,6 → 57,3 px), kým text z HTML sa
zmestí do jedného. Overená oprava (vložený štýl, `flap-oprava-skuska2.mjs`, `flap-oprava-skuska3.txt`: rozdiel 0 px
na 390, 360 aj 1440): `.flap-cells { min-height: calc(1.36 * clamp(1.125rem, 4.6vw, 1.5rem)); line-height: 1;
align-items: center; } .flap-state:empty::before { content: "\00a0"; } @media (max-width: 720px) { .flap-state
{ flex-basis: 100%; } }` – stav na telefóne vždy v druhom riadku, čo je aj dnešný vzhľad po vyplnení
(`svetlo-fazy/porovnanie-p390-0.png`). Samotný `min-height` políčok stačí len na počítači (`flap-oprava-skuska.txt`).

### N3 (nízka) – Tempo preklápania tabule je o 17 % pomalšie
`s.dalsi = now + 70` (`app.js:793`) sa zaokrúhľuje na hranice snímok: krok políčka 71 → 83 ms (medián), celé
preklopenie 2,24 → 2,53 s (`flap-tempo.txt`, 2 behy pred aj po, CPU 1×). Vzhľad má ostať rovnaký (PLAN D1).
Oprava: `s.dalsi += 70` (plán krokov od `t0`), nie od času snímky.

### N4 (nízka) – Manrope-cyr-700.woff2 sa pri ukrajinčine sťahuje dvakrát
Rezy 600 a 700 sú dva objekty `FontFace` s tým istým súborom (`i18n.js:57`); obe požiadavky bežia naraz, druhá
nie je z cache (`cyr-poziadavky`: 3 požiadavky, 2× `Manrope-cyr-700.woff2`, 16 kB navyše). Oprava: stiahnuť raz
cez `fetch` → `ArrayBuffer` a vytvoriť oba rezy z neho, alebo druhý rez načítať až po `load()` prvého.

## 3. Viditeľná zmena mimo plánu (v poriadku, doložená)
Pred D1 po načítaní i18n.css kreslil Chrome latinské texty s hrúbkou 600/700 (tlačidlá, nadpisky, číslice tabule)
písmom Liberation Sans, lebo rez cyriliky s rozsahom hrúbok 500–800 bol samostatný „segmentovaný“ rez, ktorý pri
hrúbke 600/700 vyhral pred latinským rezom a pre latinku bez cyrilického rozsahu spadol na písmo systému.
Dôkaz: `i18n-test` na strome pred (`CHYBA … Liberation Sans`), snímky `svetlo-fazy/porovnanie-*.png`. Po D1 rezy
s presnou hrúbkou 400/600/700 sa pri rovnakej hrúbke dopĺňajú podľa rozsahu znakov a latinka ostáva v Manrope.

## 4. Záver
Kód dávky je správny a merania implementátora sú metodicky v poriadku (nástroje z kópie, striedavo pred/po, mediány),
akceptačné čísla D1 sú splnené. Nepúšťam ďalej pre N1 (viditeľný skok 120 px v menu na telefóne, ktorý D1 zmenil
z výnimočného na bežný); N2–N4 sú drobné a opraviteľné v tej istej dávke.
