# Rozhodnutie o balíku ChatGPT/Codex pre BARBERSHOP 30 (21. 10. 2026, 15:40 UTC)

Senior integrátor (eng manažér + art director). Rozhodnuté **bez prehliadača** z dokladov v `overenie/bezpecnost/`,
`overenie/qa-prehliadac/`, `overenie/meranie-pred-po/` a z diffu (`git -C hs-chatgpt diff --cached c129f58`). Oba stromy
(PO = `hs-chatgpt`, PRED = `hs-pred-d1`) som nemenil a nič som v nich necommitol; jediný zápis do objektovej databázy je
`git write-tree` z indexu PO, ktorý vrátil ohlásený strom `4cc286ac…` (žiadna zmena pracovného stromu ani indexu).
Skúšobnú integráciu som urobil v odhoditeľnom klone (po skúške zmazaný kvôli disku); jej výsledok sú záplaty v
`overenie/rozhodnutie/commity/` a skripty v `overenie/rozhodnutie/zaplaty/`.

`$SP` = `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad`,
`$O` = `$SP/odovzdanie-chatgpt/overenie`.

## 0. Pre majiteľa (bez žargónu)

Balík od ChatGPT sme rozobrali na časti a každú posúdili zvlášť. Preberáme to, čo je overené a lepšie než náš stav:
správnu chybovú stránku Barbershopu (dnes posiela zákazníka na HEAD SPA s jej telefónom), skrytie odkazu na vernostnú
kartičku, kým systém nebeží, otváracie hodiny s sviatkami a letným časom z jedného miesta, stránku s právnymi údajmi
firmy, časť „Pred návštevou“ s overenými odpoveďami (ako sa objednať, zmena termínu, parkovanie, deti, poukážky),
čitateľnejší cenník a lepšie ovládanie galérie a tímu prstom. Administráciu (ceny, hodiny, oznam, tím, texty) preberáme
do vetvy, ale **nezverejníme ju**, kým neprejde našimi bránami (je o 3,5 % ťažšia než limit, na telefóne má orezané
menu, pri uložení prepíše viac riadkov než treba a sťahuje 7,7 MB fotiek). Film pre počítač (D2–D5) odkladáme: na
telefóne už máme vlastný ľahký režim bez filmu a na počítači balík v našom prostredí zhoršil prológ (rozmazaný namiesto
ostrej fasády) a strihy (14 záberov sa nenačítalo do minúty); rozhodne až meranie na skutočnej grafike. Odmietame
cudzí nástroj na riadenie agentov (do webu nepatrí) a dokumenty s cestami nášho prostredia. Nič z toho nie je nasadené;
nasadenie, právne znenie a zverejnenie administrácie schvaľuje majiteľ.

## 1. Čo je overené a z čoho rozhodujem

| Doklad | Výsledok |
|---|---|
| Kontrolné súčty, strom | patch SHA-256 sedí, `write-tree` z indexu PO = `4cc286ac15a26e62d2373e174ef168e2f83d59cd` |
| D1 v balíku | 8 súborov bajtovo zhodných s 7ea247c (README, atmosfera.css/js, CONTRACT.md, app-smoke, i18n-test, scenes-shot, strih-shot); `i18n.js` a `style.css` obsahujú D1 ako podmnožinu (3-way bez konfliktu); `app.js` balík v tých istých miestach prepísal (12 konfliktov pri 3-way, `$O/rozhodnutie/3way/`) – D1 sa preto berie z našej vetvy, nie z balíka; `i18n.css` má 1 len textový konflikt (`.booking-note` vložený vedľa komentára D1), obsah D1 (bez `@font-face` cyriliky, komentár D1) v balíku je – recenzia overila, preto sa v kroku 3 smie vziať celý |
| Bezpečnosť (`$O/bezpecnost`) | bez úniku tajomstiev, bez CDN, kľúč adminu len v pamäti, escapovanie v poriadku; nálezy: zmienka cudzieho nástroja v `admin/README.md:36` a `navsteva-browser.mjs:3`, admin 20 689–20 710 B gzip > 20 000, API verzia `2026-03-10` neoverená, dva `<main>` v 404, FTP sed necháva 2 prázdne riadky |
| Prehliadač (`$O/qa-prehliadac`, SwiftShader, bez GPU) | 0 chýb konzoly, CLS ≤ 0,004, 404 HEAD SPA pixelovo zhodná (0,0 %), pravne.html 200, D7 lightbox a tím fungujú, admin funkčne správny; regresie: prológ PO rozmazaný (PRED ostrý), strih-shot 14–26 nedobehnutých záberov (PRED 0), karta „sud“ na telefóne bez nadpisu, app-smoke padá na asynchrónnom lightboxe |
| Meranie telefónu (`$O/meranie-pred-po`) | pri skrole zhodné; prvý dotyk p95 20,97 ms (PRED 14,06), INP jazyk SK 192 ms (PRED 100) = horšie; film: nahrávanie textúr 0,5 ms/snímku (PRED 5,85), pamäť 94 MB (PRED 173) = lepšie. Pre telefón už neplatí (lite bez filmu), pre počítač sa zmeria v L7 |
| Lighthouse (`$O/meranie-pred-po/lighthouse`, SwiftShader, stromy PRED/PO, nie integrovaný strom; doplnila recenzia) | mobil PRED 94 a 96, PO 96 a 97 (LCP 2,6 s, CLS 0); počítač PRED 98 a 99, PO 100 a 100 – balík skóre nezhoršuje |
| Vetva lite (`hs-lahky`, f624ee8) | kontrola kolo 2 práve beží (`$SP/barber/lahky-telefon/stavba/k2`, `vzhlad-2`); integrácia ide **nad jej HEAD po skončení kolo 2** |
| Skúšobná integrácia (odhoditeľný klon) | zlúčenie lite do c129f58 bez konfliktu (strom = lite v `barbershop-30/`, = c129f58 inde); 7 commitov podľa časti 4; Node testy: test-404 OK, vernost-priprav 4/4, vernost-footer 1/1, hodiny 17/17, d7 14/14, admin 20/21 (padá len brána 20 000 B gzip, zámerne), navsteva-test padá len na rozpočte HTML (pozri 5.1), statická kontrola i18n 0 chýbajúcich kľúčov (21 riadkov „CHÝBA“ v `$O/bezpecnost/i18n-staticky.txt` sú texty tabule hodín z `hodiny.js`; prekladá ich kľúč `__tabula`, ktorý je vo všetkých 7 slovníkoch – recenzia overila, statický nástroj ho nevidí), JSON-LD aj blok nastavení sa parsujú, brána `lite` a dynamický import filmu zachované |

## 2. Rozhodnutia po častiach

Brána cudzích návrhov (`tim-roly/references/cudzie-navrhy.md`): prevziať len overené a merateľne lepšie, pravidlá
CLAUDE.md a ZADANIE.md majú prednosť, cudzí návrh neprepíše rozhodnutie majiteľa.

| Časť | Rozhodnutie | Prečo (dôkaz) | Čo upraviť |
|---|---|---|---|
| **D1** (8 súborov + časti app.js/style.css/i18n) | už máme (odmietnuť ako duplicitu) | naša D1 je v lite vetve; balík ju v app.js prepísal | nič; D1 ide z vetvy lite |
| **D2 – skok z menu** (app.js hunk 12–13: `scrollIntoView instant`, fokus, `pushState`, udalosť `bs30:skok`) | prevziať upravené | QA: skok pristane hneď, fokus na sekcii (PRED jazda bez fokusu); TOUR_DIRECTION to žiada | samostatný vratný commit; po lite kontrole „skok nahor“ overiť snímkovou sondou (de67eec); ak sa objaví čierne okno, commit vrátiť |
| **D2 – zvyšok** (náhľady `nahlady.*`, `decodeStill`, poistka 600 ms, pätička `contactTop`, IO dekódovanie pásov) | odložiť (L7) | telefón rieši lite (vlastný `--nahlad`, dekódovanie L3, pásy 83e21bd); náhľady 32 px cez celé okno SPEC zakazuje | pri L7 len pre film na počítači |
| **D3 – film bez čiernych okien** (film.js, film-strata, hĺbkové mapy `-hlbka-z`) | odložiť (L7) | v SwiftShaderi prológ rozmazaný namiesto ostrej fasády a strih-shot 14–26 timeoutov (PRED 0); film-continuity potrebuje `pngjs`; GPU neoverená | pred L7 nájsť príčinu (test vs. film) na stroji s GPU; mapy sú bit po bite správne (285 600 B) a prídu s film.js |
| **D4 – film plynulo** (film-worker.js, pásy, kruh textúr) | odložiť (L7) | merateľne lepšie nahrávanie (0,5 vs 5,85 ms, pamäť 94 vs 173 MB), ale na telefóne film nebeží a worker posiela celé RGBA buffre (riziko pamäte) | zmerať na počítači pri L7 bez súbežnej záťaže |
| **D5 – vzhľad** | prevziať upravené | QA: ponuka jazyka v 2 riadkoch, 320 px bez pretekania, CLS 0 | prevziať len: `i18n.css` (ponuka jazyka, `.booking-note`), menu nepriehľadné `rgb(14,13,12)`, `t-wait` 1,2 s + predčítanie i18n v hlavičke; **odmietnuť**: galéria `sizes` 146vw/78vw (asi 60 MB po rozbalení, SPEC L4), pravidlo `team-video` len pri filme (lite L6 má vlastné video), podklad kickera na telefóne (zmena vzhľadu bez schválenia art directora); **odložiť** (L7/lite): `is-rest`, `mobile-progress`, nadpisy viazané na polohu filmu (karta „sud“ bez nadpisu), `kins` delené neskôr |
| **D6a-0** (404 Barbershopu, skrytá vernostná kartička, prihláška len pri funkčnom serveri) | prevziať upravené | plán D6a-0 splnený; 404 HEAD SPA 0,0 % rozdiel; FTP verzia bez Barbershopu; test-404, vernost-priprav 4/4 | koreňový `404.html`: druhý `<main hidden>` (skript ho odkryje, HEAD SPA `<main>` skryje), bez prázdnych riadkov pred značkami (FTP sed potom vráti **bajtovo** pôvodný súbor – overené); `barbershop-30/404.html`: zmazať odkaz na neexistujúci `apple-touch-icon.png`, zvyšky HEAD SPA (Lora → Fraunces 500, komentár), `theme-color` #0e0d0c; `vernost-priprav.py` s `encoding='utf-8'` |
| **D6a** (hodiny.js, nastavenia `#barbershop-settings`, pravne.html, HairSalon/hasMap/priceRange, cenník N07, cudzinec N08, „minimálne čakanie“ N09, sitemap, CONTENT_SOURCES, rezervacia-kontrola) | prevziať upravené | hodiny-test 17/17, rezervácia naživo 0 rozdielov, sídlo podľa ORSR, fakty podľa FAKTY/CONTENT_SOURCES, geo zámerne nepridané (centroid nesúhlasí) | app.js: len hunky nastavení a tabule (nie model skrolu balíka); index.html: len háčiky (nie hlavičku a galériu balíka); `geo` ostáva vynechané; ÚOOÚ Galvaniho 7/B má zdroj v balíku, naše HEAD SPA `pravne.html` má Hraničná – právnu kontrolu robí majiteľ; „8 kresiel – minimálne čakanie“ podľa plánu N09 (zdroj: starý oficiálny web), majiteľovi ostáva otázka 10 |
| **D6b** („Pred návštevou“: navsteva.js, vysvetlivky, skoky v cenníku, riadok Dnes) | prevziať upravené | navsteva-browser 16 kombinácií OK, 7 položiek so zdrojom a dátumom, nepotvrdené pravidlá skryté | poukážky: veta o **existencii** ostáva (náš PLAN-D6-D7 §6 ju radí medzi „hneď“, zdroj starý web + foto-40), podrobnosti skryté do odpovede majiteľa (otázka 2); ak majiteľ nesúhlasí, `zobrazit:false` v `navsteva.js` (jeden príznak) |
| **D7 – interakcie** (galeria.js, d7.css, ovládanie tímu, d7-test) | prevziať upravené | d7-test 14/14, lightbox Enter/šípky/Tab/Esc, swipe mení fotku (PRED nie), tlačidlá 48×48 | ovládanie tímu na počítači ukázať len keď pás preteká (`scrollWidth > clientWidth`); lite `app-smoke.mjs` doplniť čakanie na asynchrónny `#lightbox-img` (vzor `$O/qa-prehliadac/skripty/app-smoke-upraveny.mjs`); štúdie A/B/C a okná E1/E2: **odložiť** (nevykreslené, neschválené) |
| **Admin** (`barbershop-30/admin/`, admin-test, admin-browser) | prevziať upravené, **bez nasadenia** | pekný a prehľadný na počítači (snímky), bezpečný (kľúč v pamäti, CSP, escapovanie, `force:false`); ale 20 710 B gzip > 20 000 (ENGINE §7), na telefóne orezaný pás záložiek a oranžový rám fokusu, zápis preformátuje celé JSON-LD a rozpíše hodiny na 7 dní (+252/−59 riadkov), Tím sťahuje 10 PNG ≈ 7,7 MB, API verzia neoverená, README s cudzím nástrojom | do vetvy ako commit (vratný); `pages.yml` admin **nekopíruje**, kým neprejde: (a) ≤ 20 000 B gzip (brána v admin-test vrátená na 20 000; návrh: vypustiť marketingový „Prehľad“ s fotkou sály, zostane prehľadová ponuka), (b) zápis zachová pôvodný formát JSON-LD/nastavení a zoskupenie Po–Pi – zlatý diff: zmena ceny = presne 2 riadky, (c) portréty `tim-<meno>-480.webp` namiesto 820 PNG, (d) telefón: zoznam „Čo chceš zmeniť“ do 700 px alebo viditeľné pokračovanie pásu; fokus bez rámu na obsahovom kontajneri, (e) kontrola práva zápisu pri pripojení (`permissions.push`), (f) `X-GitHub-Api-Version` 2022-11-28 (overená adminom HEAD SPA) alebo jedno autorizované volanie, (g) 10 chýb CSP z DOMParsera (`style-src-attr`), „3 zmien“ → „3 zmeny“, zastaraná správa po konflikte, (h) `robots.txt` `Disallow: /admin/` (hotové v záplate), (i) rozhodnutie majiteľa: kľúč s Contents RW dáva zápis aj do HEAD SPA a admin bude verejná adresa na Pages |
| **pages.yml** | prevziať upravené | tajomstvá len v kroku vernosti, skript ich iba meria; výpadok servera prihlášku bezpečne vypne (plán D6a-0) | kopírovať `barbershop-30/404.html` (D6a-0) a `pravne.html` (D6a); `barbershop-30/admin` až po bránach adminu a súhlase majiteľa |
| **404 koreň (HEAD SPA)** | prevziať upravené | nutné: Pages má jeden 404 na projekt; HEAD SPA obsah nezmenený, snímky 0,0 % | pozri D6a-0 |
| **ftp-balik.sh** | prevziať | sed maže oba bloky; po úprave značiek vracia pôvodný 404 bajt po bajte (overené) | nič |
| **vernost** (`ochrana-udajov.html`, `vernost.js`) | prevziať | sídlo FACEPALM podľa ORSR (plán D6a bod 3); prísnejšia kontrola uloženej kartičky (https, origin, cesta) rieši živú chybu R1 | právne znenie odsúhlasí majiteľ; na headspa30.sk ide až FTP balíkom, ktorý nahráva majiteľ |
| **Hĺbkové mapy** (26 × `-hlbka-z.webp`) | odložiť (L7) | správne (nezávislý prepočet bit po bite), ale používa ich len film.js balíka | prídu spolu s film.js pri L7 |
| **pracovna-siet** (`tools/pracovna-siet/`) | odmietnuť | nie je súčasť webu, koordinátor cudzieho prostredia (`/root/frontend`…), duplikuje náš toolbox (tim-roly, workflowy) | myšlienky (vlastníctvo ciest, odtlačky odovzdaní) posúdiť osobitne cez `cudzie-navrhy.md` do toolboxu |
| **Dokumenty** | odmietnuť / odložiť | `docs/POKRACOVANIE-2026-10-20.md` spomína `.openai/hosting.json` a cudzí repozitár; `docs/plynulost/*` sú naše súbory z vetvy denníka (7c5fbc0) s cestami `/tmp/claude-0/…` a záplatou „From: Claude“ – do main nepatria; `docs/d7-studies/` odložiť (nevykreslené) | `CONTENT_SOURCES.md` a `overenie-d6/rezervacia-live.json` prevziať (D6a); README Barbershopu (= D1) doplniť o nové nástroje my |
| **Testy a nástroje** | prevziať upravené | Node testy prešli na izolovanej kópii aj v skúške | prevziať: test-404, test-vernost-priprav, vernost-footer-test, hodiny-test, navsteva-test, d7-test, admin-test (brána 20 000), rezervacia-kontrola, admin-browser a navsteva-browser (komentár bez cudzieho nástroja); odložiť na L7: frontend-regression (čaká 400 ms, neexistujúci odkaz), film-continuity (pngjs), film-regression, nahlady.py, hlbka-zjemni.py |

## 3. Konflikty s vetvou lite a pravidlo riešenia

Prienik zmien lite (0f6ffa3…f624ee8) a balíka: `index.html`, `app.js`, `style.css`, `film.js`, `README.md`,
`app-smoke.mjs`. Skúšobný 3-way (lite / D1 / PO, `$O/rozhodnutie/3way/*.lite-po.merged`): index.html 4 konflikty,
style.css 2, app.js 1 textový (ale sémanticky súperia celé modely skrolu: lite `__dec`/`is-hold`/`is-catch`/`lerpOn`/
`slucky()` proti balíkovým `decodeStill`/`is-rest`/`cardsIdle`/`filmPosition`), film.js 1.

**Pravidlo:** na telefóne má prednosť naša vetva lite (všetko, čo sa týka skrolu, dekódovania, prvého obrazu, videa
tímu), balík má prednosť v tom, čo lite nerieši (obsah D6, interakcie D7, admin, 404) a pri L7 vo filme na počítači.
Preto sa z balíka **nepreberá** `app.js`, `style.css` ani `index.html` ako celok, ale len vybrané hunky (časť 4);
`film.js` sa nepreberá vôbec (L7). Konkrétne:

- `index.html` hlavička: ostáva skript lite (brána `lite`, `--nahlad`, kotva v adrese, vkladač filmu); z balíka sa
  doň prenáša len predčítanie `i18n.js` a slovníka pri uloženom jazyku (`uprav.py d6`). Záber „Poď ďalej“ má `sala-m`
  v oboch; ostáva verzia lite (`sizes` ako ostatné zábery). Značka `film.js`: ostáva dynamický import lite (balíkové
  `fetchpriority="low"` sa neberie). Bannerové komentáre sekcií ostávajú.
- `style.css`: z balíka len hunky cenníka (N07), menu, `t-wait`, `.shop-notice` a blok „Pred návštevou“; nie
  `film-strata`, `transition: none`, `will-change .is-near` (lite má), `NAHLADY-UVOD` (lite má `--nahlad`), `is-rest`,
  `mobile-progress`, podklad kickera, pravidlo `team-video`.
- `app.js`: z balíka hunky 2 (nastavenia, `HOURS`, `clock`), 14 (`predNavstevou`, `noveOkno`), 15 (lightbox →
  `galeria.js`), 18–20 (tabuľa a hodiny) a vratne 12–13 (skok z menu). Nie: 1, 3–11 (model skrolu, náhľady,
  `filmPosition`, `progress`), 16–17 (odložené).

## 4. Postup integrácie (vetva `barbershop-integracia`, každý krok samostatný commit, po slovensky, bez podpisov)

Predpoklady: kontrola kolo 2 vetvy lite skončila a jej HEAD je schválený; `pgrep -c chrom` = 0 pri meraniach;
`$T=4cc286ac15a26e62d2373e174ef168e2f83d59cd` je v objektovej databáze (`git cat-file -t $T` → tree; ak nie,
`git -C $SP/hs-chatgpt write-tree`). Záplaty a skripty: `$Z=$O/rozhodnutie/zaplaty`, hotové commity zo skúšky:
`$O/rozhodnutie/commity/000*.patch` (dajú sa priložiť `git am -3`, ale po kolo 2 lite radšej postup nižšie).

0. `git worktree add $SP/hs-integracia -b barbershop-integracia c129f58` (main je dnes da24b32 = c129f58 + toolbox;
   neskoršie zlúčenie do main je bez konfliktu, balík ani lite toolbox nemenia).
1. **Zlúčenie lite:** `git merge --no-ff barbershop-lahky-telefon -m "Zlúčenie vetvy barbershop-lahky-telefon (D1 + L1–L6)"`.
   Overené v skúške: bez konfliktu; kontrola `git diff --stat <lite HEAD> HEAD -- barbershop-30` prázdne a
   `git diff --stat c129f58 HEAD -- . ':!barbershop-30'` prázdne. Test: nič nové (lite má svoje kontroly).
2. **D6a-0:** `git checkout $T -- $(cat $Z/subory-D6a0.txt)`; v `index.html` ručne len riadok pätičky
   `<li hidden data-vernost-footer>…Vernostná kartička…</li>`; `python3 -I $Z/uprav.py <strom> d6a0`.
   Commit „BARBERSHOP 30: 404 Barbershopu na Pages aj vlastnej doméne, skrytá vernostná kartička, prihláška len pri
   funkčnom serveri“. Testy: `node tools/test-404.mjs`, `python3 -I tools/test-vernost-priprav.py`,
   `node --test barbershop-30/source/tools/vernost-footer-test.mjs`,
   `sed '/<!-- B30 -->/,/<!-- \/B30 -->/d' 404.html | diff - <(git show c129f58:404.html)` (prázdne) a
   `grep -ci barbershop` na výsledku (0). Prehliadač (dávka v kroku 9): snímky 404 HEAD SPA pred/po ≤ 0,5 %.
3. **D6a:** `git checkout $T -- $(cat $Z/subory-D6a.txt)`; `patch -p1 --no-backup-if-mismatch` so
   `$Z/index.html.d6-hooky.diff` (hunky 2,3,4,5,11,13,17,18,19,20 z D1→PO; riadky D6b – `nav-visit`,
   `booking-explainer` ×2, `price-nav`, `<p class="dnes">`, kontajner `#pred-navstevou`, odkaz „Pred návštevou“ v pätičke
   – **diff ich obsahuje a `patch` ich priloží**; po priložení ich v tomto kroku ručne odstrániť, vzor je skúšobný
   commit `$O/rozhodnutie/commity/0002*` (tie riadky nemá) a `0003*` (pridáva ich) – vrátia sa v kroku 4),
   `$Z/style.css.d6-cennik-menu-twait.diff`, `$Z/app.js.D6a-hodiny-nastavenia.diff`;
   `python3 -I $Z/uprav.py <strom> d6 $SP/hs-chatgpt` (popis stránky, predčítanie i18n, blok nastavení, `.shop-notice`,
   `pages.yml` + pravne.html; blok „Pred návštevou“ v style.css patrí do kroku 4). Commit „BARBERSHOP 30: hodiny z
   jedného zdroja so sviatkami a letným časom, právne informácie, HairSalon v JSON-LD, cenník čitateľnejší, cudzinec
   vie zavolať“. Testy: `node --check assets/app.js`, `node --test source/tools/hodiny-test.mjs` (17/17),
   `python3 -I $O/bezpecnost/i18n_staticky.py <lite strom> <strom>` (0 nových chýbajúcich), JSON-LD a
   `#barbershop-settings` sa parsujú, `gzip -9c index.html | wc -c` (zapísať, pozri 5.1),
   `node source/tools/rezervacia-kontrola.mjs` (len čítanie, ale cez živé POST volania ajax `getEmployees`/`getCalendar`
   rezervačného systému, nič nezapisuje; 0 rozdielov). Prehliadač (krok 9): `app-smoke.mjs`
   (lite), `i18n-test.mjs`, `$O/qa-prehliadac/skripty/nastavenia.mjs`, výrezy „13 €“/„15 €“ pri DPR 1 (dvaja
   kontrolóri, plán N07), snímky `pravne.html` 320/390/1440.
4. **D6b:** `git checkout $T -- $(cat $Z/subory-D6b.txt)`; riadky D6b do `index.html`, blok „Pred návštevou“ do
   `style.css` (od `/* Praktické odpovede` po koniec súboru balíka), `$Z/app.js.D6b-pred-navstevou.diff`;
   `python3 -I $Z/uprav.py <strom> d6b`. Commit „BARBERSHOP 30: Pred návštevou – overené praktické odpovede pri kontakte,
   vysvetlivky rezervácie, skoky v cenníku“. Testy: `node --check`, `node source/tools/navsteva-test.mjs`
   (dnes padá len na rozpočte HTML 14 600 B – pozri 5.1; obsahová časť prešla v strome balíka). Prehliadač (krok 9):
   `navsteva-browser.mjs`, snímky 390/360/1440 v sk, en, uk, de, kotvy filmu ± 1 px.
5. **D7:** `git checkout $T -- $(cat $Z/subory-D7.txt)`; `$Z/app.js.D7-galeria.diff`; `python3 -I $Z/uprav.py <strom> d7`
   (odkaz na `d7.css`); úpravy: v `galeria.js` ovládanie tímu len pri pretekaní pásu; v lite `app-smoke.mjs` čakať na
   `#lightbox-img`. Commit „BARBERSHOP 30: lightbox s dekódovanou výmenou a prelínaním, švih prstom, ovládanie pásu
   tímu“. Testy: `node --test source/tools/d7-test.mjs` (14/14), `grep -c setupLightbox assets/app.js` = 0.
   Prehliadač (krok 9): `app-smoke.mjs` (lite) 100 %, lightbox Enter/šípky/Tab/Esc, swipe 390×844.
6. **Admin (bez nasadenia):** `git checkout $T -- $(cat $Z/subory-admin.txt)`; `python3 -I $Z/uprav.py <strom> admin`
   (README bez cudzieho nástroja, API 2022-11-28, brána 20 000 B, `robots.txt`). Commit „BARBERSHOP 30: administrácia
   cien, hodín, oznamu, tímu a textov (zatiaľ bez nasadenia na Pages)“. Testy: `node --test
   barbershop-30/source/tools/admin-test.mjs` → 20/21, padá brána gzip (20 710 B) – to je **zámerný stav**: ďalší
   samostatný commit „admin: pod 20 000 B a presný zápis“ rieši body (a)–(g) z tabuľky a až potom commit
   „pages.yml: nasadiť admin“ (po súhlase majiteľa k bodu (i)). `admin-browser.mjs` v kroku 9.
7. **D2 skok z menu (vratný):** `patch -p1 --no-backup-if-mismatch < $Z/app.js.d2-skok-z-menu.diff`; commit
   „BARBERSHOP 30: skok z menu pristane hneď, s fokusom a históriou; filmu oznámi udalosť bs30:skok“. Testy:
   `node --check`; prehliadač (krok 9): `app-smoke.mjs` (lite), `$O/qa-prehliadac/skripty/skoky.mjs`, snímková sonda
   skoku nahor z kontroly lite; pri čiernom okne commit vrátiť (`git revert`).
8. **Dokumentácia:** `barbershop-30/README.md` (hodiny.js, navsteva.js, galeria.js, 404, pravne, admin, nové testy,
   `rezervacia-kontrola`), `docs/CHECKS.md` nová časť, denník `PRIEBEH.md` (dátum, „ChatGPT cez majiteľa“, čo sa
   prevzalo, čo nie, dôkazy). Commit „BARBERSHOP 30: dokumentácia prevzatých častí“.
9. **Prehliadačová dávka** (jeden beh po kroku 8, bez súbežnej záťaže, `python3 -m http.server <port>` v koreni,
   Playwright cez `createRequire('/opt/node22/lib/node_modules/')`): `app-smoke.mjs` (lite, `B30_PORT`), `i18n-test.mjs`,
   `uvod-shot.mjs` (verzia lite; variant D1/PO v QA padol na oboch stromoch na limite snímky 30 s v SwiftShaderi,
   `$O/qa-prehliadac/testy/{pred,po}/uvod-shot.log` – nie je to regresia balíka), `karty-shot.mjs --lite`,
   `atmosfera-test.mjs`, `koliesko-test.mjs`, `navsteva-browser.mjs`,
   `admin-browser.mjs`, QA skripty `nastavenia.mjs`, `skoky.mjs`, `csp.mjs`, snímky 404 HEAD SPA pred/po,
   `bash $SP/barber/audit/plan/nastroje.sh` + `overenie-kod-stranka/skrol.mjs --scen=stredne` 3×, Lighthouse cez `gzip-server.py`
   (mobil ≥ 95, počítač 100). Každý pád = oprava v samostatnom commite alebo `git revert` daného kroku.
10. **L7 (neskôr, len počítač):** z balíka `film.js`, `film-worker.js`, `nahlady.css/json`, `nahlady.py`,
    `hlbka-zjemni.py`, 26 máp `-hlbka-z.webp`, `film-continuity.mjs` (+ pngjs alebo PIL náhrada), `film-regression.mjs`,
    `frontend-regression.mjs` (opraviť), app.js hunky 1, 3–11, 16–17, style.css hunky filmu a `NAHLADY-UVOD`,
    index.html `fetchpriority` a náhľady. Konflikty riešiť pravidlom z časti 3 (lite vyhráva na telefóne, balík vo
    filme na počítači); pred zlúčením vysvetliť prológ a strih-shot a zmerať na GPU.

## 5. Riziká a čo ostáva neoverené

5.1 **Rozpočet `index.html` ≤ 14 600 B gzip (README, prvé okno TCP) prekračuje už vetva lite:** D1 14 380 B
(`gzip -9c`, zhodne s MODEL.md; pôvodne uvedených 14 358 B nesedelo – opravila recenzia), lite 16 477 B (+1 218 B hlavičkový skript lite, +639 B `--nahlad` data URI), po D6a 16 574 B, po D6b 16 781 B
(balík pridáva +304 B, sám o sebe bol 14 406 B). `navsteva-test.mjs` túto bránu kontroluje a padá. Rozhodnúť musí
tím lite (zmenšiť skript alebo rozpočet zdôvodnene zmeniť v README a testoch) – nie je to chyba balíka.

5.2 Neoverené (treba prehliadač, GPU alebo telefón): vzhľad integrovaného stromu (všetky prehliadačové testy idú až
v kroku 9), skutočný iPhone a GPU, Lighthouse, `pages.yml` v CI (nespúšťali sme), živé API vernosti a FTP balík,
`X-GitHub-Api-Version` 2022-11-28 na tomto admine (overená len prevádzkou HEAD SPA), adresa ÚOOÚ (balík cituje
dataprotection.gov.sk 20. 10. 2026; HEAD SPA `pravne.html` uvádza Hraničná 12 – jedna je zastaraná, právnu kontrolu
robí majiteľ), „8 kresiel – minimálne čakanie“ (zdroj starý web; majiteľ otázka 10), existencia poukážok (otázka 2),
prológ a strihy filmu na GPU (L7), pamäť workera na telefóne (po L2 sa netýka).

5.3 Skúšobné záplaty v `$O/rozhodnutie/commity/` vznikli nad lite f624ee8; po kolo 2 lite treba prikladať s `-3` a
hunky kontrolovať. Z nich boli odstránené záložné súbory `*.orig`, ktoré vytvoril nástroj `patch` (v reálnom behu
použiť `--no-backup-if-mismatch`).

## 6. Dôkazy

- `$O/rozhodnutie/3way/` – 3-way porovnania (D1 ⊂ PO pre i18n.js/style.css; konflikty lite/PO).
- `$O/rozhodnutie/zaplaty/` – `*.d1-po.diff` (celé), filtrované `app.js.D6a-*`, `app.js.D6b-*`, `app.js.D7-*`,
  `app.js.d2-skok-z-menu.diff`, `app.js.d5-nadpisy-neskor.diff` (odložené), `style.css.d6-*`, `index.html.d6-hooky.diff`,
  `index.html.d2-d5-odlozene.diff`, zoznamy `subory-*.txt`, `filtruj.py`, `uprav.py`.
- `$O/rozhodnutie/commity/` – 7 commitov zo skúšobnej integrácie (`ZOZNAM.txt`).
- `$O/bezpecnost/`, `$O/qa-prehliadac/`, `$O/meranie-pred-po/` – podklady troch kontrol.

## 7. Recenzia (skeptik, 21. 10. 2026, bez prehliadača – len zo súborov, snímok a logov)

Overené s dokladom: kontrolné súčty a strom `4cc286ac` (`write-tree` indexu PO sedí, oba stromy nezmenené);
D1 8 súborov bajtovo zhodných s 7ea247c; 3-way konflikty (app.js 12, i18n.css 1, lite/PO: index.html 4, style.css 2,
app.js 1, film.js 1); zlúčenie lite do c129f58 bez konfliktu (merge-base bcd487e, lite mimo `barbershop-30/` nič nemení,
c129f58 vnútri nič nemení); `main` = da24b32 = c129f58 + len `toolbox/`; prológ PO rozmazaný pri t = 2,5 s (snímka
`prolog-pocitac-porovnanie.jpg`), strih-shot PO 26 (mobil + počítač) a 14 (počítač, opakovanie) nedobehnutých záberov,
PRED 0; skok z menu PO pristane hneď s fokusom (`skoky.json`); swipe v lightboxe mení fotku; tlačidlá tímu 48×48;
404 HEAD SPA 0,0 % rozdiel, 404 Barbershopu na doméne aj Pages; `pravne.html` 200 s ÚOOÚ Galvaniho 7/B (zdroj
`CONTENT_SOURCES.md:179`), sídlo FACEPALM podľa ORSR (`:177`); „8 kresiel – minimálne čakanie“ (`:173`); JSON-LD
HairSalon/hasMap/priceRange bez `geo`; blok `#barbershop-settings` sa parsuje; admin 20 689 B (`gzip -9c`) / 20 710 B
(Node zlib) gzip, na telefóne pás záložiek 684 px v 354 px a zlatý rám fokusu (snímka `admin/telefon-overview.jpg`),
10 chýb CSP, zápis +252/−59 riadkov, tím 10 PNG ≈ 7,7 MB, API verzia `2026-03-10` (HEAD SPA admin má `2022-11-28`),
`force:false`, „3 zmien“ (`app.mjs:41`), `robots.txt` bez `/admin/`; `pages.yml` tajomstvá len v kroku vernosti,
`vernost-priprav.py` meria len dĺžku; `vernost.js` kontroluje https/origin/cestu; FTP sed po `uprav.py d6a0` vráti
pôvodný 404 bajt po bajte; cudzí nástroj len v `admin/README.md:36` a `navsteva-browser.mjs:3` (`source/audit.json`
s podobnou zmienkou je z c129f58, balík ho nemení); `pracovna-siet` má `runtimeId` `/root/frontend`…;
`docs/plynulost` nesie cesty `/tmp/claude-0/…`; `POKRACOVANIE` spomína `.openai/hosting.json`; hĺbkové mapy 26 ×,
285 600 B, odchýlka 0; Node testy hodiny 17/17, d7 14/14, admin 21/21 pri bráne 21 504 B (po znížení na 20 000 B
zámerne 20/21), vernost-priprav 4/4, test-404 OK, rezervácia `matches: true`, `differences: []`; čísla v §5.1
(16 477 → 16 574 → 16 781 B) sedia pri replike záplat 0001–0003 na súboroch lite; všetky cesty a prepínače v časti 4
existujú (`B30_PORT` v `source/shot.mjs`, `karty-shot --lite`, `uprav.py` kroky `d6a0|d6|d6b|d7|admin`, `filtruj.py`,
`i18n_staticky.py <pred> <po>`).

Opravené recenziou: D1 gzip 14 358 → 14 380 B (§5.1); krok 3 – diff `index.html.d6-hooky.diff` obsahuje riadky D6b,
treba ich po priložení odstrániť (§4); vysvetlenie 21 riadkov „CHÝBA“ (`__tabula`, §1); `i18n.css` konflikt je len
textový, D1 v PO je (§1); `uvod-shot.mjs` padá v QA aj na PRED, do kroku 9 ide verzia lite (§4); `rezervacia-kontrola`
číta cez POST ajax, nie GET (§4); `skrol.mjs --scen` je v `overenie-kod-stranka/` (§4); doplnený riadok Lighthouse (§1).

Ostáva sporné (nemení rozhodnutie, ale chýba doklad alebo potvrdenie): regresia „karta „sud“ na telefóne bez nadpisu“
nemá uložený doklad – `titulky.mjs` píše opacity len na stdout (nie je v `$O`), snímky
`qa-prehliadac/titulky/titulky-{pred,po}-filmoff-7-sud.jpg` nadpis ukazujú v oboch stromoch (film=off); ak išlo o
film=on, treba záznam doplniť, inak vetu v §1 a v riadku D5 vypustiť. Stav kola 2 vetvy lite: `stavba/k2/` má výsledky
(`brana.txt` 15:19, `slucka.txt` 15:20, bez chýb okrem známeho varovania THREE), súhrnný verdikt v `stavba/` nie je –
pred krokom 0 potvrdiť. Skúšobné záplaty `commity/*.patch` majú autora „Claude <noreply@anthropic.com>“ ako všetky
doterajšie commity repozitára; `git am` ho prenesie.
