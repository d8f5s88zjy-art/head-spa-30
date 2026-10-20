# BARBERSHOP 30 – plán D6 (doplniť, čo chýba) a D7 (seniorský art direction a filmové efekty)

Zostavil senior art director a eng manažér 20. 10. 2026. Postup podľa skillu Premium & Cinematic Web Studio
(C001, C004, C006, C016, C017, C022, C081). Vstupy:
- štyri prieskumy workflowu `barbershop-co-chyba` v `barber/chyba/`: `obsah-cesta`, `technika-seo`, `porovnanie`
  a `fakty/FAKTY.md`,
- `PLAN.md` a `workflowy/davky.json` (D1–D5),
- dokumenty Barbershopu (README, MASTER_BRIEF, ART_DIRECTION, CONTRACT, CONTENT_SOURCES, COMPARISON,
  MEDIA_SELECTION, TOUR_DIRECTION, CHECKS, JAZYKY),
- `CLAUDE.md` a `ZADANIE.md`.

V `hs-tool` ani v `hs2` sa nič nemenilo.

Pokyn majiteľa (20. 10. 2026): „Zlepši a zdokonaľ Barbershop, doplň tam veci, čo chýbajú.“ Ďalej platí ZADANIE.md:
- obsah len pravdivý zo zdrojov,
- len skutočné fotky a videá,
- nič vymyslené,
- 8 jazykov,
- žiadna zmienka o AI,
- plynulosť a žiadne čierne okná,
- Lighthouse na mobile ≥ 95.

`$SP` = `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad`.

---

## 0. V skratke pre majiteľa

1. Web vyzerá dobre a prehliadka prevádzky funguje. Zákazník však na ňom nenájde praktické odpovede:
   - či existuje darčeková poukážka,
   - kde zaparkuje,
   - ako zmení alebo zruší termín,
   - či môže prísť bez objednania,
   - ako zaplatí.
2. Dve chyby treba opraviť hneď, lebo posielajú vašich zákazníkov k inej prevádzke. Odkaz „Vernostná kartička“
   v pätičke aj každá neexistujúca stránka Barbershopu vedú na chybovú stránku HEAD SPA 30 s jej telefónom.
   Odkaz na kartičku preto skryjeme, kým systém kartičiek nebude spustený; potom sa vráti (otázka 15).
3. Doplnenie je rozdelené do troch krokov:
   - **D6a:** opravy dôvery a pravdivých údajov,
   - **D6b:** časť „Pred návštevou“ s odpoveďami,
   - **D6c:** vlastná doména a vyhľadávače.
   Kroky idú až po dokončení opráv plynulosti (D1–D5), lebo menia tie isté súbory. Výnimkou sú dve chyby z bodu 2.
4. Dopĺňame len to, čo je overené z týchto zdrojov:
   - váš rezervačný systém,
   - váš starý web,
   - Booqme,
   - obchodný register,
   - mesto Nitra.

   Čo nevieme (napríklad platba, storno, cena a platnosť poukážky), sa na webe neukáže, kým to nepotvrdíte.
5. Grafika (D7): dlhé tmavé pásy cenníka a kontaktu dostanú úzke „okná“ so skutočnými fotkami z prevádzky:
   - nožnice,
   - štetka na holenie a pomády na pracovnom stole,
   - detské autíčko‑kreslo,
   - recepcia s poukážkami,
   - vchod.

   Web tak pôsobí filmovo aj mimo prehliadky. Fotky v galérii sa budú plynulo prelínať a na telefóne sa dajú listovať prstom.
6. Nič z toho nesmie spomaliť telefón ani ukázať čiernu plochu. Každá dávka sa meria rovnako ako opravy plynulosti
   a pri zhoršení sa vráti.
7. Na konci je 24 otázok. Odpovede odomknú ďalšie doplnky. Najdôležitejšie sú platba, poukážky, storno, sviatky,
   príchod bez objednania a doména.

---

## 1. Východiská, ktoré upresňujú zadanie

1. **Hlavná rezervácia nie je Booqme.** Barberi a 15 služieb sa rezervujú vo vlastnom systéme podniku
   https://www.barbershop30.sk/rezervacia. Potvrdzujú to:
   - CONTENT_SOURCES,
   - Google profil (tlačidlo rezervácie),
   - 30 odkazov na webe,
   - `fakty/FAKTY.md` časť 2.

   Booqme `barbershop30` má len Romanu a 14 farbiacich služieb. Jeho obchod s poukážkami je prázdny („toto zariadenie
   nemá dostupné žiadne poukážky na predaj“). „Booqme rezervácia“ zo zadania teda platí len pre Romanu. Tlačidlá
   barberov sa na Booqme nepresmerúvajú.
2. **Číslovanie.** V doplnku PLAN.md a v PRIEBEH 3b bola „D6 – art direction a VFX“. Podľa tohto pokynu je teraz
   **D6 = doplnenie** a **D7 = art direction a filmové efekty**.
3. **Tie isté súbory.** D6 a D7 menia `index.html`, `app.js`, `style.css`, `i18n.js` a slovníky, teda to isté ako D1–D5
   (`hs2`, vetva `barbershop-plynulost`; D1 je od 20. 10. 13:11 commit `7ea247c`). Preto idú až po zlúčení D5. Výnimkou je rýchla
   oprava **D6a‑0**, ktorá mení len súbory mimo D1–D5: `/404.html`, jeden riadok pätičky `index.html`, `assets/vernost.js`,
   `.github/workflows/pages.yml`, `tools/ftp-balik.sh`, nové kľúče 404 v 7 slovníkoch, nový `barbershop-30/404.html`
   a `source/tools/over-404.mjs`. Overené v `davky.json` a v zozname zmien commitu `7ea247c`: D1 nemení ani jeden z nich.
   D5 mení v `index.html` len hlavičku, prvé karty a galériu; do slovníkov môže pridať kľúče, preto sa kľúče 404 pridajú
   ako samostatný blok a pri zlúčení sa slovníky overia `i18n-test.mjs`.
4. **Rozpočet HTML.** `index.html` má dnes 14 380 B gzip (`gzip -9c`), strop je 14 600 B (prvé okno TCP, README, D2).
   D5 mení `index.html` (`sizes` galérie, karta Poď ďalej, načítanie filmu) a má ten istý strop 14 600 B, preto sa
   východisko pre D6a zmeria znova po zlúčení D5. Rozpočty nižšie (asi +100 až +150 B) platia voči tomuto číslu.
   Nový viditeľný text preto ide do modulu podľa vzoru `assets/recenzie.js`. Vložené uzly prekladá MutationObserver
   v `i18n.js:97–98`. Do HTML ide len nevyhnutné (JSON‑LD, jeden odkaz v pätičke, prázdny kontajner).
5. **Slovníky.** Je ich 7 (`assets/i18n/{en,uk,hu,sr,pl,de,cs}.json`), kľúč je slovenský text. Každý nový viditeľný text
   potrebuje kľúč vo všetkých siedmich a musí prejsť `node source/tools/i18n-test.mjs`.
6. **Fakty.** Zdrojom je `chyba/fakty/FAKTY.md` (overené 20. 10. 2026, dôkazy v `chyba/fakty/zdroje/`). Čo tam nie je,
   má stav „doplniť – od majiteľa“ a na web nejde.

---

## 2. Zlúčené nálezy (bez duplicít)

Zdrojové ID z prieskumov:
- **OC** = obsah a cesta zákazníka,
- **T** = technika a SEO,
- **POR** = porovnanie s konkurenciou,
- **F** a **R** = fakty a rozpory z FAKTY.md.

| # | Čo chýba alebo je zlé | Zdrojové ID | Stav faktov | Dávka |
|---|---|---|---|---|
| N01 | „Vernostná kartička“ v pätičke vedie na 404 HEAD SPA 30 (s telefónom 0911 153 136) | OC‑01, T02, F01, R1 | netreba, odkaz sa skryje | **D6a‑0** |
| N02 | Každá neexistujúca adresa pod `/barbershop-30/` ukáže 404 HEAD SPA 30 (iný telefón, iná rezervácia) | T01 | CONTENT_SOURCES | **D6a‑0** |
| N03 | Tabuľa „Dnes“ nepozná sviatky (24. 12. 2026 by hlásila „Teraz otvorené“) | OC‑09, F02, R2 | kalendár rezervačného systému | D6a |
| N04 | JSON‑LD: neexistujúci typ `BarberShop`, chýba `geo`, `hasMap`, `priceRange` | T05, F09 | OSM/Booqme, Google cid, cenník | D6a |
| N05 | Právne údaje neúplné, chýba stránka o údajoch | T06, F06, R6 | § 4 overený (ORSR, starý web), GDPR časť od majiteľa | D6a (§ 4), D6b (GDPR po odpovedi) |
| N06 | Menu „Kontakt“ pristane v pätičke (bez Rezervovať), preskočí kartu „Kde nás nájdeš“ | OC‑08 | netreba | D6a (po D2) |
| N07 | Cenník: Fraunces `opsz 144` pri 18–26 px, „13 €“ a „15 €“ sú na DPR 1 takmer rovnaké, na telefóne „Páns ky s trih“ | OC‑10 | netreba | D6a |
| N08 | Cudzinec: upozornenie „rezervácia je po slovensky“ je len v `title` (na dotyku neviditeľné), telefón bez +421 | OC‑07 | `i18n.js` L.rez, rezervácia má prepínač SK/EN (Google prekladač, `translate_a/element.js`) | D6a |
| N09 | „8 kresiel v troch miestnostiach“: časť „v troch miestnostiach“ nemá zdroj | F14, R5 | starý web: „8 kresiel – minimálne čakanie“ | D6a (alebo potvrdenie) |
| N10 | Drobnosti: ikona na plochu iPhonu, dvojitý favicon, `og:type`, dlhé meta popisy, `lastmod`, upozornenie na nové okno | T09, T10 (časť), T11, T13, T14 | netreba | D6a |
| N11 | Zastarané CONTENT_SOURCES (trvania „None min“, 945 recenzií, chýbajú nové zdroje) | F15, R7 | systém, Google 949, Booqme | D6a |
| N12 | Nikto nekontroluje, že cenník a tím sedia so systémom (dátum overenia) | POR‑07 (b, c) | rezervačný systém | D6a (nástroj), D6b (riadok) |
| N13 | Chýba miesto na praktické odpovede | OC‑02, POR‑04 | – | D6b |
| N14 | Ako prebieha rezervácia: kroky, „Nezáleží“, mesiac dopredu, zmena termínu; „Objednať“ sľubuje predvoľbu | OC‑03, OC‑11, F12, F13, POR‑06 | systém (texty, getEmployees, getCalendar) | D6b |
| N15 | „Chcem ísť dnes“: web nepovie, že online sa dá aj na dnes ani že sa dá prísť bez objednania; „Teraz otvorené“ je až na 17,3. obrazovke | OC‑05, POR‑03, POR‑11, F04 | systém, starý web, citovaná recenzia | D6b |
| N16 | Darčekové poukážky: 0 zmienok | OC‑04, POR‑01, F10 | existencia: starý web + foto‑10/40; detaily od majiteľa | D6b (existencia a telefón) |
| N17 | Parkovanie: 0 zmienok | OC‑12, F03 | mesto Nitra (nitra.sk/parkovanie, upravené 13. 8. 2026) | D6b |
| N18 | Deti: chýba ubezpečenie a postup pre dvoch, nevyužitá fotka detského kresla COPS | OC‑13 | systém, foto‑29 | D6b (text), D7 (fotka) |
| N19 | Predaj produktov: 0 zmienok | OC‑14, POR‑13, F11 | starý web; značky od majiteľa | D6b |
| N20 | Romanine služby neúplné (chýba tónovanie, prekrytie šedín, polióza), platba v Booqme | F05 | Booqme (oficiálne) | D6b |
| N21 | Dôkaz pri rozhodnutí: recenzie sú až na 13,7. obrazovke z 19,5 | POR‑05 | `recenzie.js` (13. 10. 2026) | D6b (obsah), D7 (sadzba) |
| N22 | Cenník 3,26 obrazovky na telefóne bez skoku na skupinu | POR‑07 (a) | – | D6b |
| N23 | Platba (karta, hotovosť) | OC‑06 | od majiteľa | D6b (skryté do odpovede) |
| N24 | Storno, meškanie, pripomienka SMS/e‑mail | OC‑03, F12 | od majiteľa | D6b (skryté do odpovede) |
| N25 | Pás tímu na telefóne bez počítadla (9 švihov); recenzie spomínajú „Tony“, ktorý nie je v tíme | OC‑15 | systém | D7 (počítadlo), otázka |
| N26 | Jazyky a Instagram barberov | POR‑09 | od majiteľa | čaká |
| N27 | Výsledky strihov (blok `data-required="results"` je skrytý) | POR‑02 | od majiteľa (fotky so súhlasom) | čaká |
| N28 | Školenia bez odkazu, kariéra | OC‑17, POR‑12, R4 | od majiteľa | čaká |
| N29 | WhatsApp | OC‑18 | od majiteľa | čaká |
| N30 | „Recepcia 8 rokov, jediný v Nitre“ verzus 2019 (7 rokov) | OC‑16, F07, R3 | od majiteľa (výslovné želanie z 13. 10.) | otázka |
| N31 | Bezbariérový vchod (atribút na Google profile) | F08 | tretia strana | čaká na potvrdenie |
| N32 | Vernostná kartička viditeľne pri rezervácii (čo dáva) | POR‑10 | od majiteľa | po spustení servera |
| N33 | Hlavná doména nerozhodnutá; robots.txt v podpriečinku sa nečíta | T03, T08 | od majiteľa (prístupy) | D6c |
| N34 | Jazykové verzie `?lang=` majú slovenský canonical a `og:url`, hreflang v sitemape s tým odporuje | T04, T10 | slovníky existujú | D6c |
| N35 | Vyhlásenie o prístupnosti | T12 | merania; povinnosť podľa veľkosti firmy | D6c |
| N36 | Súhlasy zamestnancov s portrétmi a videami | T07 | od majiteľa | otázka (pred spustením na doméne) |
| N37 | Lightbox: popis sa vymení skôr než fotka, tvrdý strih okolo 250 ms, bez švihu | POR‑08 | snímky `porovnanie/snimky/lightbox-dalsia-100ms.jpg` (nový popis nad starou fotkou) a `-250ms.jpg` (nová fotka); `lightbox-tma.json` sám zmenu neukazuje (`currentSrc` sa prepne hneď) | D7 |
| N38 | Dlhé jednofarebné tmavé pásy (#171412) cenníka a kontaktu | POR‑14 | snímky `_b30-m.jpg`, `_b30-d.jpg` | D7 |
| N39 | FX029 (preostrenie) v trase D5 je v rozpore s „bez straty ostrosti“ | porovnanie (Z098) | TOUR_DIRECTION r. 18 a 26 | rozhodnutie R9 |
| N40 | Hodnotenie číslom (Google 5,0 z 949, 20. 10. 2026) | POR‑05 | MASTER_BRIEF číslo dnes zakazuje | otázka |
| N41 | Facebook a Instagram sa bez prihlásenia nedajú prečítať | F16 | od majiteľa | otázka |

---

## 3. Čo už riešia D1–D5 (tu sa nenavrhuje, len nadväzuje)

| Téma | Kto ju rieši | Ako na ňu D6/D7 nadväzuje |
|---|---|---|
| Tabuľa hodín: vynútené rozloženia, Intl pri štarte (K06, K07) | D1 | Sviatky (D6a) sa doplnia až do verzie po D1, teda s IO, `animate()` a formatterom vytvoreným raz. Riadok „Dnes“ v úvode (D6b) počíta čas bez `Intl`. |
| Skok z menu, história, fokus, udalosť `bs30:skok` (K05) | D2 | D6a mení len cieľ odkazu „Kontakt“ a použije skok z D2. |
| Náhľady LQIP, `decode()` pred zobrazením, `is-near` (CO‑2, K04, CO‑4) | D2 | Okná v D7 použijú ten istý nástroj (`nahlady.py`, `nahlady.css`) a to isté pravidlo dekódovania. |
| Film: čierne okná, strata kontextu, textúry, worker (CO‑1, KF‑*) | D3, D4 | D6 ani D7 nemenia `film.js`, strihy CUTS, sekvencie ani prológ. |
| Pozastavenie nekonečných animácií (T4/K12) | D1 | D7 nepridáva žiadnu nekonečnú animáciu. |
| Linka progresu, video tímu na telefóne, ostrosť galérie (`sizes`), orezy Čakárne a Kávy, kontrast nadpisku úvodu, výmena Manrope, prepnutie jazyka, LCP | D5 | Nenavrhuje sa znova. OC‑10 (Fraunces `opsz` v cenníku) je iný problém než VZ‑13 (Manrope). |
| FX012 pri titulných kartách (text a obraz naraz, C039) | D5 | D7 použije rovnaké pravidlo v lightboxe. |
| Lightbox je v PLAN.md len v časti „Zachovať“ | – | D7 ho mení bez straty fokusu, Esc a šípok. |
| `content-visibility` na pásoch (pokus s bránou ± 1 px) | D5 | Ak D5 bránu zapne, D6b a D7 musia vkladať obsah a okná v súlade s `contain-intrinsic-size`. Pri prechode sa preto overujú kotvy ± 1 px. |

---

## 4. Seniorské rozhodnutia (krátke záznamy)

- **R1 Rýchla oprava D6a‑0 hneď na `main`.**
  - Dôvod: dve živé chyby posielajú zákazníka na inú značku, a to s cudzím telefónom a cudzou rezerváciou.
  - Rozsah: `/404.html`, riadok pätičky `index.html:863`, `vernost.js`, `pages.yml`, `tools/ftp-balik.sh`, kľúče 404
    v slovníkoch (úplný zoznam v časti 1, bod 3; D1 ich nemení).
  - Po nasadení tím `hs2` zlúči `main`, konflikt sa nečaká.
  - Rozhodnutie sa mení, ak `hs2` začne meniť pätičku, `vernost.js`, `pages.yml` alebo tie isté miesta slovníkov.
- **R2 Nový text ide do modulu, nie do HTML** (vzor `recenzie.js`, `app.js:366–374`).
  - Dôvod: rezerva HTML je 220 B gzip a D6a z nej minie asi 100–150 B.
- **R3 FAQPage JSON‑LD sa nepridáva.**
  - Google od 8. 8. 2023 zobrazuje výsledky s otázkami len autoritatívnym vládnym a zdravotníckym webom (Google Search
    Central, „Changes to HowTo and FAQ rich results“; pri implementácii overiť, či to stále platí).
  - Pridanie by stálo bajty HTML bez úžitku. Odpovede ostanú ako HTML `<details>`.
- **R4 Súradnice `geo`.**
  - Použijú sa tie isté ako pri HEAD SPA 30 v tej istej budove (OSM way 58223421 = budova Mostná 226/30, ťažisko
    48.3156549, 18.0904390; overené cez API OpenStreetMap 20. 10. 2026, dôkaz `recenzia-planu/osm-way-58223421.json`
    a `osm-reverse-48.315655-18.090439.json`).
  - Booqme uvádza 48.3155884, 18.0905691, teda asi o 12 m inde.
  - Dôvod: jedna pravda pre obe prevádzky v jednej budove.
- **R5 Stránka 404.**
  - GitHub Pages má jednu 404 na projekt. Preto `/404.html` rozhodne podľa `location.pathname` už v hlavičke,
    pred prvým vykreslením.
  - Variant HEAD SPA sa nesmie zmeniť (porovnanie snímok). Pre vlastnú doménu sa pridá aj `barbershop-30/404.html`.
- **R6 Sviatky.**
  - Zdroj je kalendár rezervačného systému.
  - Kým majiteľ nepotvrdí, že je v tieto dni zatvorené, tabuľa ukáže „Sviatok“ a overenú vetu „Online sa na dnes
    objednať nedá“, nikdy „Teraz otvorené“.
  - Po potvrdení sa stav zmení na „Dnes zatvorené“.
- **R7 Jazykové adresy.**
  - Rýchla oprava, ktorá mení canonical cez JavaScript, sa nerobí. Google neodporúča meniť canonical skriptom (dôkaz
    v T04).
  - Robustná oprava (statické jazykové stránky generované v `pages.yml`) ide do D6c spolu s doménou.
- **R8 D7 nemení film.**
  - Mimo zásahu D7 ostávajú `film.js`, CUTS, sekvencie, prológ aj titulné karty (vlastníci sú D3–D5).
  - Filmový jazyk sa do pásov prenáša len statickými oknami so skutočnými fotkami a pohybom na kompozitore.
- **R9 FX029 (preostrenie) a FX055 (odhalenie podľa hĺbky) sa nerobia.**
  - FX029 je v rozpore s rozhodnutím majiteľa z 9. 10. 2026 („bez straty ostrosti“, „nikdy rozmazanie“, TOUR_DIRECTION
    r. 18 a 26). Zadanie D5 ho má len podmienečne („ak fotku nezhorší“) a túto podmienku nesplní.
  - FX055 by pri stále sa hýbucej kamere rozchádzal masku s textom a ohrozil kontrast 4,5 : 1.
- **R10 Z025 (materiálová textúra pod textom) sa teraz nerobí.**
  - Problém plochých pásov rieši smer A skutočnými fotkami bez textu cez textúru (pozri D7).

---

## 5. Dávky

Pre všetky dávky platia spoločné pravidlá merania z PLAN.md, časť 3:
- **pred** = commit pred dávkou, **po** = HEAD,
- nástroje sa kopírujú cez `bash $SP/barber/audit/plan/nastroje.sh`,
- server `python3 -m http.server <port>` v koreni stromu, Lighthouse cez `gzip-server.py`,
- pred a po sa merajú striedavo, vždy bez iného prehliadača.

Po každej dávke nasledujú tri nezávislé kontroly (kód, meranie, vzhľad) podľa `skill_senior_kontrola`
(C081, C083, C084, C100).

### D6a‑0 – Rýchla oprava dvoch živých chýb (hneď, na `main`)

1. **N01, vernostná kartička:**
   - celé `<li>` s odkazom dostane `hidden`,
   - `vernost.js` položku odkryje len pri `data-zapnute` alebo pri uloženej kartičke (`kartaUlozena()`),
   - v `pages.yml` sa `data-zapnute` doplní len vtedy, keď `curl -fsS` vráti 200 na `/vernost/karta/`,
     `/vernost/api/?a=stav` aj `/vernost/ochrana-udajov.html`,
   - bez toho ostane položka skrytá aj pri vyplnenom hesle.
2. **N02, stránka 404:**
   - inline skript v `<head>` súboru `/404.html` pri ceste so segmentom `/barbershop-30/` (github.io aj vlastná doména) nastaví na `<html>` triedu
     `bs30` ešte pred vykreslením,
   - CSS potom ukáže blok Barbershopu: „Táto stránka tu nie je.“, Rezervovať termín (barbershop30.sk/rezervacia),
     Zavolať 0951 267 203, Späť na úvod `/head-spa-30/barbershop-30/`,
   - blok HEAD SPA ostane pri tejto ceste skrytý, `noindex` zostáva,
   - texty sa preložia zo slovníka `barbershop-30/assets/i18n/<jazyk>.json`, keď je v `localStorage` uložené `b30.lang`;
     inak ostane slovenčina (kľúče do 7 slovníkov),
   - kópia `barbershop-30/404.html` sa pripraví pre vlastnú doménu (ErrorDocument) a `pages.yml` ju skopíruje,
   - `tools/ftp-balik.sh` kopíruje `/404.html` aj na headspa30.sk (HEAD SPA, bez priečinka Barbershopu). Blok Barbershopu
     a jeho skript sú preto medzi značkami `<!-- B30 -->` a `<!-- /B30 -->` a `ftp-balik.sh` ich z `_ftp/404.html` vymaže.

**Akceptácia D6a‑0**
- **Vernostná kartička naživo:** v pätičke Barbershopu nie je položka viditeľná (Playwright 390 × 844 a 1440 × 900, sk
  aj en). Lokálne s ručne pridaným `data-zapnute` sa položka ukáže a klik otvorí prihlášku z `vernost.js`,
  nie headspa30.sk.
- **Krok v `pages.yml`:** pri vyplnenom hesle a odpovedi curl iné ako 200 sa `data-zapnute` nepridá (test kroku na kópii
  skriptu).
- **404 Barbershopu:** `https://d8f5s88zjy-art.github.io/head-spa-30/barbershop-30/neexistuje` vráti 404. Viditeľné sú
  titulok „Stránka sa nenašla | Barbershop 30 Nitra“ a odkazy `tel:+421951267203`, barbershop30.sk/rezervacia
  a `/head-spa-30/barbershop-30/`. V žiadnej snímke, ani v prvej pri Slow 4G, sa neukáže „0911 153 136“ ani Booqme
  HEAD SPA.
- **404 HEAD SPA:** `/head-spa-30/neexistuje` má na snímkach 390 a 1440 rozdiel > 30 úrovní najviac na 0,5 % pixelov
  oproti stavu pred zmenou.
- **Ďalej:** `noindex` v oboch variantoch, kľúče 404 v 7 slovníkoch, `index.html` ≤ 14 600 B gzip. Prejdú `app-smoke.mjs`
  a `i18n-test.mjs`.

**Overenie D6a‑0**
- Nový skript `source/tools/over-404.mjs` (Playwright) proti lokálnemu serveru, ktorý vracia `404.html` (vzor
  `chyba/technika-seo/gzip-server.py`).
- Snímky HEAD SPA pred a po.
- Po nasadení `curl -sI` a Playwright naživo s `?v=` proti cache.

**Riziko D6a‑0**
- Zmena `404.html` zasahuje HEAD SPA, preto sa porovnávajú snímky.
- Bez JavaScriptu ostane variant HEAD SPA (prijateľné, zriedkavé).
- FTP balík HEAD SPA: `sh tools/ftp-balik.sh headspa30.sk` a potom `_ftp/404.html` nesmie obsahovať „0951 267 203“,
  „barbershop30.sk“ ani „Barbershop“ (grep v overení D6a‑0).
- Tím `hs2` musí zlúčiť `main`; konflikt sa nečaká, lebo pätičku ani 404 nemení.

**Kapitoly skillu:** C001, C059, C081, C083.


### D6a – Dôvera a pravdivé opravy bez čakania na majiteľa (po zlúčení D5)

Položky (každá s faktom zo zdroja alebo bez nového faktu):
1. **N03 Sviatky na tabuli a pri ďalšom otvorenom dni.**
   - Zoznam zo systému:
     - pevné dni: 1. 1., 6. 1., 1. 5., 5. 7., 29. 8., 1. 11., 24.–26. 12.,
     - Veľký piatok a Veľkonočný pondelok (výpočet Veľkej noci podľa Meeusa).
   - Logika tabule (verzia po D1) dostane stav „Sviatok“, ďalší otvorený deň sviatky preskočí.
   - Slová tabule `__tabula` sa rozšíria vo všetkých 7 slovníkoch.
   - Výpočet je zdieľaný s riadkom „Dnes“ z D6b (malý modul `assets/hodiny.js` bez `Intl`, letný čas podľa pravidla EÚ:
     od poslednej nedele v marci 01:00 UTC do poslednej nedele v októbri 01:00 UTC).
2. **N04 JSON‑LD** (`index.html:54`):
   - `"@type": "HairSalon"`,
   - `geo` 48.315655 / 18.090439 (R4),
   - `hasMap` https://www.google.com/maps?cid=18132360254733427623,
   - `priceRange` „3 € – 40 €“ (Úprava obočia 3 €, Ultra inclusive 40 €),
   - `aggregateRating` ani `review` sa nepridávajú,
   - 15 ponúk ostáva bez zmeny.
3. **N05 Právne údaje, nová stránka `barbershop-30/pravne.html`** (vzor `pravne.html` HEAD SPA, vlastná značka):
   - **§ 4 zák. 22/2004 Z. z.:**
     - FACEPALM, s.r.o.,
     - sídlo Šalgovská ulica 1039/43, 951 15 Mojmírovce,
     - IČO 52 231 381, DIČ 2120952218,
     - zápis v OR Okresného súdu Nitra, oddiel Sro, vložka 52616/N,
     - e‑mail info@barbershop30.sk, telefón +421 951 267 203,
     - orgán dozoru: Slovenská obchodná inšpekcia, Inšpektorát SOI pre Nitriansky kraj (adresu overiť na soi.sk v deň
       implementácie).
   - **Čo robí samotný web** (overené Playwrightom, `technika-seo/dom-*.json`):
     - 0 cookies, 0 hostiteľov tretích strán,
     - v prehliadači ukladá `b30.lang`, `b30.lang.no`, voľbu hudby, `v30.*` a `sessionStorage bs30uvod`,
     - hosting GitHub Pages spracúva IP v záznamoch servera.
   - **Rezervácia:** prebieha na www.barbershop30.sk/rezervacia. Otázky k údajom ide na info@barbershop30.sk, dozorný
     orgán je ÚOOÚ SR (adresu overiť).
   - Časti, ktoré potrebujú majiteľa (kto spracúva rezervácie, lehoty, IČ DPH), sa nezobrazia (D6b po odpovedi).
   - Text je po slovensky (záväzné znenie). V ostatných jazykoch je na začiatku jedna preložená veta „Právne informácie
     sú po slovensky.“ (kľúč v 7 slovníkoch).
   - Pätička dostane odkaz „Právne informácie“ (asi +40 B gzip) a `pages.yml` skopíruje `pravne.html`.
   - Opraví sa aj adresa prevádzkovateľa v `vernost/ochrana-udajov.html` (Mostná 30 → sídlo Mojmírovce).
   - Právnu formuláciu GDPR časti nech skontroluje majiteľ alebo jeho právnik (C001: odborná kontrola).
4. **N06 „Kontakt“ v menu.**
   - `id="kontakt"` sa presunie z `<footer>` na `.band-contact`; na odkaz z menu nič iné nezávisí (overené v `app.js`,
     `film.js`, `i18n.js` a testoch).
   - Pristátie zabezpečí skok z D2 (okamžite, fokus, história).
   - Pätička dostane `id="pata"`.
5. **N07 Čitateľnosť cenníka.**
   - Pozor: `assets/fonts/Fraunces-*.woff2` sú statické rezy s `opsz 144` (`fonts.css:2–3`, fonttools: bez tabuľky
     `fvar`, GSUB len `case`, `liga`, `rvrn`, `ss01`, bez `tnum`). `font-variation-settings` ani
     `font-variant-numeric: tabular-nums` preto vzhľad nezmenia; samotné zmazanie `opsz 144` v CSS nič neopraví.
   - Najprv príčina (Iron Law): či medzery „Páns ky s trih“ spôsobuje rez pre 144 pt pri 18–26 px, alebo strata
     vyrovnania párov pri orezaní písma (porovnať s pôvodným Fraunces v rovnakej veľkosti).
   - Až potom oprava podľa rozhodnutia (pozri nálezy recenzie): nový statický rez tej istej rodiny pre menšiu optickú
     veľkosť len pre cenník, alebo úprava veľkosti a medzier bez nového súboru.
   - Vzhľad (Fraunces 800, farba, rozloženie) sa nemení. Kontroluje sa výrez „13 €“ a „15 €“ pri DPR 1 a zalomenie názvov
     na 390 px.
6. **N08 Cudzinec.**
   - V jazykoch iných než sk sa pod hlavnými tlačidlami úvodu a karty Rezervácia ukáže viditeľná poznámka. Použijú sa
     existujúce texty L.rez z `i18n.js:163–165`; vloží ich `i18n.js`, takže HTML sa nemení.
   - V angličtine doplniť: „Need help? Call +421 951 267 203.“ Vetu o prepínači EN nepridávať: prepínač je Google
     prekladač (`zdroje/bs30-rez.html`), ale pri skúške 20. 10. 2026 po výbere EN ostala stránka po 8 s po slovensky
     (1440 × 900) a na telefóne je prepínač skrytý v menu (dôkaz `recenzia-planu/rez-en-d.jpg`, `skripty/rez-en.mjs`).
     Vetu možno vrátiť len po úspešnej skúške na telefóne aj počítači.
   - Telefón sa v cudzích jazykoch zobrazí ako +421 951 267 203 (kľúč „0951 267 203“ do 7 slovníkov).
7. **N09 Zdroj faktu „8 kresiel“.**
   - Ak majiteľ do implementácie nepotvrdí „v troch miestnostiach“, podriadok sa zmení na doslovné „minimálne čakanie“
     zo starého oficiálneho webu (kľúč v 7 slovníkoch).
8. **N10 Drobnosti:**
   - `apple-touch-icon.png` 180 a `icon-512.png` z `favicon.svg`; „30“ sa prevedie na krivky z `assets/fonts` (Fraunces,
     OFL) cez fonttools, nie písmom v SVG,
   - jeden `<link rel=icon>` (zmazať dátovú kópiu, `index.html:36`),
   - `og:type` website,
   - meta popisy ≤ 155 znakov v 8 jazykoch bez zmeny faktov,
   - `lastmod` v `sitemap.xml` sa pri každej zmene obsahu nastaví na dátum nasadenia,
   - upozornenie „otvorí sa v novom okne“: `app.js` v nečinnosti pridá `aria-describedby` všetkým 38 odkazom
     s `target=_blank` na jeden skrytý prvok s kľúčom (0 B v HTML).
9. **N11 CONTENT_SOURCES.md:**
   - trvania zo systému (20. 10. 2026) namiesto „None min“, Google 949 (932/11/1/1/4),
   - nové zdroje: texty rezervačného systému (lang, kroky, potvrdenie, pripomienky), getEmployees, getCalendar (horizont,
     sviatky), Booqme 14 služieb, platba a dni, ORSR sídlo a zápis, nitra.sk parkovanie (pre D6b),
   - každý riadok s dátumom a stupňom.
10. **N12 Nástroj `source/tools/rezervacia-kontrola.mjs`.**
    - Načíta dáta `v-order-component` a `/rezervacia/ajax` (getEmployees, getCalendar) a porovná:
      - 15 názvov, cien a trvaní s `index.html` aj JSON‑LD,
      - 10 mien tímu,
      - zoznam sviatkov s `hodiny.js`.
    - Výsledok OK alebo zoznam rozdielov a dátum. Vzor `tools/booqme-kontrola.mjs` (HEAD SPA). Zapísať do README a CHECKS.

Rozpočet HTML pre D6a:
- JSON‑LD asi +95 B (meranie T05: 14 475 B),
- odkaz v pätičke asi +40 B,
- zmazaný favicon asi −40 B,
- skrytie `<li>` +7 B.

Spolu asi 14 480–14 520 B. Strop je 14 600 B.

**Akceptácia D6a**
- **Sviatky:** test s pevným časom (Playwright `page.clock`):

  | Čas | Očakávaný stav |
  |---|---|
  | 24. 12. 2026 10:00 | „Sviatok“, nikdy „Teraz otvorené“ |
  | 3. 4. 2026, 6. 4. 2026, 26. 3. 2027, 29. 3. 2027 | „Sviatok“ |
  | 23. 12. 2026 20:00 | ďalší otvorený deň „v pondelok od 9:00“ (28. 12.) |
  | 31. 12. 2026 10:00 | otvorené (systém ho neblokuje) |
  | sobota 13:59 / 14:00 | otvorené / zatvorené |
  | 29. 3. 2026 a 25. 10. 2026 | správna hodina pri zmene času |
  | pondelok 30. 3. 2026 a 26. 10. 2026, 8:59 / 9:00 | zatvorené / otvorené (prvý pracovný deň po zmene času) |
  | všetky riadky znova s `timezoneId` America/New_York a Asia/Tokyo | rovnaký stav ako v Europe/Bratislava (výpočet nezávisí od zóny zariadenia) |

  Všetkých 8 jazykov je bez nepreloženého textu.
- **`rezervacia-kontrola.mjs`** hlási naživo zhodu: sviatky, 15 cien a trvaní (HTML aj JSON‑LD) a 10 mien tímu.
- **JSON‑LD:**
  - `JSON.parse` prejde,
  - `@type` je HairSalon a obsahuje `geo`, `hasMap` a `priceRange`,
  - 15 ponúk je zhodných (skript), `aggregateRating` chýba,
  - validator.schema.org je bez chýb (ručný záznam so snímkou).
- **pravne.html:**
  - obsahuje všetkých 8 údajov § 4 (kontrola skriptom na reťazce),
  - odkaz z pätičky je vo všetkých 8 jazykoch,
  - Lighthouse mobil ≥ 95, prístupnosť 100, naživo `curl` 200,
  - `vernost/ochrana-udajov.html` má sídlo Mojmírovce.
- **Menu → Kontakt** na 390 × 844:
  - karta „Kde nás nájdeš“ je hore v okne (scroll‑margin ± 8 px),
  - Rezervovať je viditeľné bez skrolu,
  - `over-menu.mjs` a `interakcie.mjs` z D2 prejdú,
  - kotvy `app.js` aj filmu sa posunú najviac o ± 1 px.
- **Cenník:**
  - výrezy pri 1440 × 900 (DPR 1) a 390 × 844 (DPR 3): dvaja kontrolóri jednoznačne prečítajú „13 €“ a „15 €“,
  - žiadny názov služby nie je zalomený vnútri slova (skript na `getClientRects` slov),
  - výrezy „13 €“, „15 €“ a „Pánsky strih“ pred a po sa v pixeloch líšia (zmena je viditeľná, nie len v CSS).
- **Cudzinec:**
  - v 7 jazykoch je poznámka o slovenskej rezervácii viditeľná pod hlavnými tlačidlami (nie len `title`),
  - telefón je +421 951 267 203,
  - v slovenčine sa nič nemení.
- **Drobnosti:**
  - `apple-touch-icon.png` 180 a `icon-512.png` vracajú 200, v HTML je jeden `rel=icon`,
  - `og:type` je website,
  - meta popisy majú ≤ 155 znakov v 8 jazykoch (zopakovať `jazyky.json` z technika‑seo),
  - všetkých 38 odkazov s `target=_blank` má prístupný popis nového okna (Playwright, strom prístupnosti),
  - `lastmod` = dátum nasadenia.
- **CONTENT_SOURCES** má nové riadky s dátumom a stupňom, „None min“ zmizne.
- **Spoločné:**
  - `index.html` ≤ 14 600 B gzip,
  - Lighthouse mobil ≥ 95 (gzip, záťaž < 2), počítač ≥ 98 lokálne a 100 naživo, SEO 100, prístupnosť 100,
  - CLS < 0,05,
  - prejdú `app-smoke`, `i18n-test`, `koliesko-test`, `uvod-shot` a `atmosfera-test`,
  - `skrol.mjs --scen=stredne` nie je horší ako po D5 nad šum merania (p95 +≤ 1 ms, štýl +≤ 0,2 ms),
  - výber sád čiernych okien (D2 `co2` skok na Kontakt, D3 `co1` menu) je bez nového okna.

**Overenie D6a**
- Kópia nástrojov: `bash $SP/barber/audit/plan/nastroje.sh <kópia> <port> <strom>`.
- Testy a skripty:
  - `node source/tools/app-smoke.mjs`,
  - `node source/tools/i18n-test.mjs`,
  - nový `node source/tools/hodiny-test.mjs` (pevné časy, 8 jazykov),
  - `node source/tools/rezervacia-kontrola.mjs`.
- Z D2 a D1: `node over-menu.mjs --n=3`, `node interakcie.mjs` (overenie‑kod‑stranka) a
  `bash ab3.sh d6a stredne 3 uvod=off zaklad`.
- Výrezy cenníka (Playwright, snímky si pozrieť), Lighthouse cez `gzip-server.py` a `gzip -9c index.html | wc -c`.
- Po nasadení `curl` (pravne.html, ikony, sitemap) a snímky naživo.

**Riziko D6a**
- Tabuľa po D1: ten istý blok kódu. Sviatky sa dopĺňajú až do zlúčenej verzie a pred tým prejde `over-intl.mjs`.
- Chybný výpočet Veľkej noci alebo času: testy s pevnými dátumami 2026–2030.
- Presun `id="kontakt"`: vonkajšie odkazy na `#kontakt` pristanú na karte, čo je žiaduce.
- Právne znenie: kontrola majiteľom; adresy SOI a ÚOOÚ overiť v deň implementácie.
- Rozpočet HTML: meranie po každej zmene.
- Ikony z kriviek: Fraunces je OFL, licencia je v poriadku.

**Kapitoly skillu:** C001, C015, C019, C059, C061, C069, C075, C078, C081, C083, C091 (štruktúrované dáta), C100.


### D6b – „Pred návštevou“: praktické odpovede tam, kde sa zákazník rozhoduje

Umiestnenie podľa C022 (odpoveď pri rozhodnutí):
- **blok „Pred návštevou“** v páse kontaktu pod kartou „Kde nás nájdeš“. Je pod kotvou filmu `#rezervacia`, takže
  vloženie posunie len pätičku, nie kotvy filmu,
- **jedna veta** nad cenníkom a jedna v hlavičke tímu,
- **riadok „Dnes“** pod tlačidlami úvodu a karty Rezervácia,
- **odkaz z cenníka** „Ako prebieha rezervácia →“ (#pred-navstevou).

Technika:
- modul `assets/navsteva.js` (≤ 6 kB gzip), v HTML len prázdny kontajner,
- modul sa načíta, keď sa pás kontaktu priblíži (IO `rootMargin 150% 0px`), alebo v nečinnosti po `load`, podľa toho,
  čo nastane skôr,
- odpovede sú natívne `<details>` (klávesnica bez JS),
- každá položka má v dátach `zdroj`, `overene` (dátum) a `zobrazit`. Položka bez zdroja sa nevykreslí.

Obsah, ktorý sa zobrazí hneď (fakty overené 20. 10. 2026; presné znenie v časti 6):
1. **Ako sa objednám:** 4 kroky (služba → barber alebo „Nezáleží“ → termín → tvoje údaje), potvrdenie e‑mailom, alebo
   recepcia v pracovné dni 9–19.
2. **Ako ďaleko dopredu:** online až mesiac dopredu, aj na dnes, ak je voľný termín (getCalendar: od dnes do +1 mesiac).
3. **Zmena termínu:** telefonicky 0951 267 203 alebo e‑mailom info@barbershop30.sk (text potvrdenia v systéme hovorí
   len o zmene: „pre zmenu rezervácie nás neváhajte kontaktovať telefonicky alebo emailom“). Zrušenie, lehota, poplatok
   a meškanie sa nezobrazia, kým ich majiteľ neurčí (otázka 3).
4. **Výber barbera netreba:** voľba „Nezáleží“ (getEmployees).
5. **Deti:** strih pre malých gentlemanov do 10 rokov, 45 min, 15 €. Rezervácia je vždy pre jednu osobu, pre dvoch si
   treba spraviť dve (krok 4 systému).
6. **Parkovanie:** zóna SM‑A, zadarmo v pracovné dni po 16:00 a v sobotu po 12:00, inak 1 € prvá hodina a 2 € každá
   ďalšia, platba cez datamesta.nitra.sk, automat alebo SMS 2200.
   - Pozor: Parkové nábrežie a Na Predmostí (blízko Mostnej) sú v SM‑A spoplatnené nonstop; veta to musí povedať.
   - Konkrétne záchytné parkovisko sa nemenuje: „parkovisko Nábrežie mládeže (pri Chrenovskom moste)“ je v platenej
     zóne CH‑A (pracovné dni 0–18 h), hoci mesto uvádza „Nábrežie mládeže“ aj medzi bezplatnými záchytnými.
     Odkaz na zoznam záchytných parkovísk mesta stačí, presné miesto doplní majiteľ.
   - Pri texte je „podľa mesta Nitra, stav k <dátum>“ a odkaz na nitra.sk/parkovanie.
   - Vlastné miesta a zastávku MHD doplní majiteľ.
7. **Bez objednania:** starý oficiálny web dnes uvádza „8 kresiel – minimálne čakanie – rýchly servis, aj keď prídeš
   bez objednania“ a citovaná recenzia to potvrdzuje.
   - Text je zdržanlivý (časť 6).
   - Potvrdenie majiteľa neblokuje; ak povie nie, položka sa vypne jedným príznakom.
8. **Darčekové poukážky:** existujú (starý web; foto‑40 s „DARČEKOVÁ POUKÁŽKA“ na recepcii), ako ich kúpiť povie
   recepcia (tlačidlo Zavolať). Hodnota, platnosť a predaj na diaľku až od majiteľa.
9. **Produkty:** „Prípravky, ktoré používame, si môžeš kúpiť aj u nás.“ (starý web). Značky až od majiteľa.
10. **Rezervácia v cudzom jazyku** (len v jazykoch iných než sk): poznámka z N08 ako odpoveď.
11. **Romana** (rozšírenie riadku pod cenníkom): farbenie, melír, trvalá, tónovanie, prekrytie šedín a polióza v Booqme,
    bez platby vopred (všetkých 14 služieb má `payment-required="0"`, sekcia platby kartou sa ukáže len pri hodnote 2,
    `booqme2/rez.html:1207` a `:1782`; platba kartou online teda dnes nie je). Ceny sa zobrazia len so súhlasom majiteľa (pravidlo jedného cenníka), dni
    Po–St len po potvrdení (dnes je to len dostupnosť v Booqme).

Ďalšie doplnky:
12. **Riadok „Dnes“** v úvode a v karte Rezervácia: „Dnes 9:00–19:00 · Teraz otvorené“ alebo „Zatvorené, otvárame
    v pondelok o 9:00“, cez `assets/hodiny.js` zo sviatkov D6a.
    - Počíta sa bez `Intl` až po prvom obraze (`requestIdleCallback`).
    - Miesto je vopred rezervované v CSS (CLS 0), slová sú z `__tabula`.
    - Stav nesie text, nie len farba.
    - Kompozíciu riadku schvaľuje D7 (C017, statický záber 390 a 1440). Ak neprejde, riadok ostane len v karte Rezervácia.
13. **Vety o rezervácii:**
    - nad cenníkom: „Objednať otvorí rezervačný systém, službu v ňom vyberieš v 1. kroku.“,
    - v hlavičke tímu: „Barbera si vyberieš v 2. kroku, alebo zvolíš „Nezáleží“.“

    Dve krátke vety v pásoch nad kotvami filmu: do HTML, ak po D6a ostane rezerva aspoň 80 B. Inak ich vloží modul hneď pri
    štarte (ako recenzie) a kotvy sa prepočítajú (ResizeObserver `app.js:283–285`, `film.js:1427`).
14. **Recenzia pri rezervácii:** jedna doslovná citácia z `recenzie.js` (meno, „Google“) a odkaz „Hodnotenie na Google“
    v páse kontaktu pri tlačidle. Číslo hodnotenia len so súhlasom majiteľa, so zdrojom a dátumom.
15. **Skoky v cenníku:** Strih · Brada a holenie · Balíčky · Doplnky ako kotvy na existujúce `#g-strih`, `#g-brada`,
    `#g-balicky`, `#g-doplnky`. Vloží ich modul pri štarte so skokom z D2.
16. **Dátum overenia cenníka:** „Ceny a trvanie podľa rezervačného systému, overené <dátum>.“ Dátum je z behu
    `rezervacia-kontrola.mjs`. Ak beh zlyhá, riadok sa nezobrazí.
17. **Pripravené, ale skryté do odpovede majiteľa:**
    - platba,
    - storno lehota, poplatok a meškanie,
    - pripomienka deň vopred (texty v systéme existujú, posielanie neoverené),
    - poukážky (hodnota, platnosť, predaj),
    - vlastné parkovanie a MHD,
    - bezbariérový vchod,
    - WhatsApp,
    - odkaz na školenia a kariéru,
    - výsledky strihov (existujúci blok `data-required="results"`),
    - jazyky a Instagram barberov,
    - vernostná kartička (veta pri rezervácii po spustení servera),
    - hodnotenie číslom,
    - GDPR časť `pravne.html`.
18. **CONTENT_SOURCES:** nová tabuľka „Texty D6 (Pred návštevou)“, v nej pri každej vete zdroj, dátum a stupeň.

**Akceptácia D6b**
- **Cesty zákazníka** (zopakovať skripty `chyba/obsah-cesta/skripty` → `cesty.json`):
  - z 12 ciest končia bez odpovede len tie, ktoré čakajú na majiteľa (platba, lehota storna), a sú zapísané v CHECKS,
  - poukaz, parkovanie, zmena termínu, „dnes alebo bez objednania“, dieťa a cudzinec majú odpoveď z otvoreného menu
    najviac na 2 ťuknutia (položka menu, otvorenie odpovede) a najviac 1 obrazovku skrolu medzi nimi (390 × 844,
    Playwright, zapísané v `cesty.json`).
- **Pravdivosť:**
  - každá vykreslená položka má v dátach zdroj a dátum (kontrolný skript modulu),
  - položky so `zobrazit: false` nie sú v DOM,
  - druhý kontrolór otvorí každý zdroj (`fakty/zdroje/`, nitra.sk) a potvrdí vetu.
- **Riadok „Dnes“:**
  - zhoda s tabuľou pre 12 pevných časov (sviatky, sobota 13:59 a 14:00, nedeľa, zmena času),
  - `over-intl.mjs` (D1): pri štarte žiadny `Intl.DateTimeFormat` s časovou zónou,
  - LCP úvodu nie horší o > 0,1 s, CLS úvodu ≤ 0,001.
- **Jazyky:**
  - všetky nové texty sú v 7 slovníkoch,
  - `i18n-test.mjs` rozšírený o obsah modulu (počká na vloženie) prejde,
  - de a hu pri 360 px nepretekajú (`app-smoke` šírka).
- **Prístupnosť:** `<details>` sa ovláda klávesnicou, nadpisy idú bez preskoku, ciele dotyku ≥ 44 px, Lighthouse
  prístupnosť 100.
- **Výkon:**
  - modul ≤ 6 kB gzip, vloženie bez LoAF > 50 ms pri CPU 4×,
  - `skrol.mjs` (stredne, švih) nie je horší ako po D6a nad šum (p95 +≤ 1 ms, štýl +≤ 0,2 ms),
  - kotvy `app.js` aj filmu sa po vložení posunú najviac o ± 1 px, aj pri skoku na `#kontakt` hneď po `load`,
  - CLS < 0,05 v scenároch „Späť hore z pätičky“ a „skok na Kontakt“,
  - sady čiernych okien D2 a D3 bez nového okna.
- **Ďalej:** `index.html` ≤ 14 600 B gzip, Lighthouse mobil ≥ 95, počítač 100 naživo.

**Overenie D6b**
- Rovnaké nástroje ako D6a. Navyše:
  - `node source/tools/navsteva-test.mjs` (dáta modulu: zdroj, dátum, príznaky; 8 jazykov),
  - zopakovanie ciest `chyba/obsah-cesta/skripty`,
  - `over-intl.mjs`, `skrol.mjs`/`ab3.sh`, `pata2.mjs`, `over.mjs` (`co2-*`, `co1-*`),
  - snímky 390 × 844, 360 × 780 a 1440 × 900 v sk, en, uk a de (pozrieť),
  - Lighthouse cez gzip server.
- Kontrolór pravdy prejde tabuľku textov v časti 6 proti zdrojom.

**Riziko D6b**
- Posun kotiev pri vložení nad oknom. Obsah sa vkladá len pod kotvu `#rezervacia` alebo pri štarte s prepočtom.
- Starnutie faktov:
  - pravidlá parkovania sa menili 1. 7. 2026, preto dátum, odkaz a ročná kontrola v CHECKS,
  - cenník a sviatky stráži nástroj.
- Kvalita prekladov: rovnaký postup s overením ako pri jazykových verziách.
- Preplnenie úvodu: riadok „Dnes“ schvaľuje D7, inak ostane len v karte Rezervácia.
- Tvrdenie o príchode bez objednania: vypína ho jeden príznak, ak majiteľ povie nie.

**Kapitoly skillu:** C019, C021, C022, C027, C066, C069, C074, C075, C081, C083.


### D6c – Doména, jazykové adresy a vyhľadávače (po súhlase a prístupoch majiteľa)

1. **Plán migrácie** (C091, C088):
   - zoznam adries starého webu (/, /rezervacia, /rezervacia/ajax, /images/…; /gdpr dnes 404),
   - rezervačná aplikácia ostane na tej istej doméne (podpriečinok, koordinácia s dodávateľom),
   - nový web do koreňa www.barbershop30.sk (sed základnej adresy, README, DEPLOY STEP),
   - 301 z http na https a z barbershop30.sk na www (dnes 302 a dve živé verzie),
   - záloha starého webu pre návrat.
2. **Statické jazykové stránky** `/en/`, `/uk/`, `/hu/`, `/sr/`, `/pl/`, `/de/`, `/cs/`:
   - generuje ich krok v `pages.yml` (CI) zo slovníkov, takže web ostane lokálne bez build kroku,
   - každá stránka má vlastné `lang`, title, description, canonical na seba, hreflang (9 vrátane x‑default),
     `og:locale` a `og:locale:alternate`, `og:url`,
   - prepínač jazyka sú odkazy `<a href>` s prepnutím cez JS,
   - `?lang=` ostane funkčné a canonical povedie na jazykovú stránku,
   - HTML každej stránky ≤ 14 600 B gzip.
3. **Kópia na github.io:** po prepnutí canonical na doménu (alebo `noindex`).
4. **robots.txt v koreni domény**, sitemap odoslaná v Search Console (účet majiteľa), web v profile Google na novú adresu.
5. **Analytika:** žiadna (nový web je bez cookies); GTM a GA4 starého webu skončia s ním, ak majiteľ nerozhodne inak.
   Inak súhlasová lišta.
6. **Hlavičky na vlastnej doméne** (`.htaccess`): CSP, Referrer‑Policy, X‑Content‑Type‑Options (T14).
7. **Vyhlásenie o prístupnosti** (T12) ako sekcia `pravne.html`, len z overených meraní. Povinnosť závisí od veľkosti
   firmy (otázka 22).

**Akceptácia D6c**
- **Presmerovania:** `curl -sI` na http://barbershop30.sk, http://www.barbershop30.sk a https://barbershop30.sk vráti
  301 jedným skokom na https://www.barbershop30.sk/.
- **Rezervácia:** /rezervacia vracia 200 a načíta služby aj termíny. Rezervácia sa neodosiela, žiadne skúšobné termíny.
- **Jazykové stránky (8):**
  - vlastný canonical,
  - recipročné hreflang (validačný skript),
  - `lang`, title, description, `og:url` a `og:locale`,
  - HTML každej ≤ 14 600 B gzip,
  - Lighthouse SEO 100 a mobil ≥ 95 pre sk a en.
- **Vyhľadávače:**
  - `robots.txt` v koreni vracia 200 a obsahuje Sitemap,
  - Search Console prijala sitemapu (snímka od majiteľa),
  - kópia na github.io má canonical na doménu alebo `noindex`.
- **Súkromie a hlavičky:** nový web je bez analytiky a cookies (výpis DOM a siete), bezpečnostné hlavičky sú prítomné
  (`curl -I`).
- **Návrat:** záloha starého webu existuje a postup obnovy je vyskúšaný na kópii.

**Overenie D6c**
- `curl` matica presmerovaní, skript validácie hreflang a canonical, Lighthouse naživo (PageSpeed alebo lokálny
  Lighthouse proti doméne), Playwright na /rezervacia bez odoslania.
- Záznam do CHECKS a do README (nasadenie na doménu).

**Riziko D6c**
- Rozbitie rezervačnej aplikácie: koordinácia s dodávateľom, test na kópii.
- E‑mail pri zmene DNS: menia sa len záznamy webu, nie MX.
- Duplicita obsahu počas prechodu.
- Koniec starej analytiky (rozhodne majiteľ).
- Údržba generovaných jazykových stránok: krok v CI a test.

**Kapitoly skillu:** C056, C069, C078, C088, C089, C091, C100.


### D7 – Seniorský art direction a filmové efekty (po D6b, na skutočnom obsahu)

#### 7.1 Východiskový posudok (C017, rubrika 0–3, pozorované)

Pozorované 20. 10. 2026 na snímkach `porovnanie/snimky/_b30-m.jpg` a `_b30-d.jpg` (lokálne, pokojná verzia) a na
meraniach prieskumov. Film s grafickou kartou nebol pozorovaný (`unobserved`), preto sa nehodnotí.

| Rozmer | Známka | Pozorovanie |
|---|---|---|
| Hierarchia | 2 | Úvod má H1, Rezervovať a Zavolať v prvom okne. V pásoch je 15 tlačidiel „Objednať“, hlavná akcia je jasná. |
| Typografia | 1 | Titulky na kartách sú silné. Cenník však má Fraunces `opsz 144` pri 18–26 px: „13 €“ a „15 €“ sú zameniteľné, na telefóne „Páns ky s trih“ (OC‑10). |
| Kompozícia | 2 | Karty sa striedajú vľavo, vpravo a v strede s dobrým rytmom. Pásy cenníka a kontaktu sú dlhé jednofarebné plochy #171412 (cenník 3,26 obrazovky na telefóne). |
| Obraz | 2 | Fotky sú autentické a karty ostré. Galéria ukazuje len priestor, nie prácu. Fotky detského kresla a recepcie s poukážkami sa nepoužívajú. |
| Interakcia | 1 | V lightboxe sa popis zmení asi 100 ms pred fotkou a nasleduje tvrdý strih okolo 250 ms, švih chýba. Pás tímu nemá počítadlo. |
| Mobil | 2 | Má vlastné výrezy a spodné tlačidlo. Pásy pôsobia ako šablóna oproti filmu. |

#### 7.2 Tri smery (C017; textové návrhy, D7 ich najprv vykreslí ako statické štúdie)

| | **A „Okno do miestnosti“** (dokumentárne remeslo) | **B „Tichý editoriál“** | **C „Materiál a znak prevádzky“** |
|---|---|---|---|
| Prvý bod pohľadu v páse | Úzky výrez skutočnej fotky predmetu alebo miesta na začiatku každej skupiny (nožnice, štetka, autíčko COPS, recepcia s poukážkami, vchod) | Veľká sadzba cien a citátov | Povrch z tmavého dubu alebo prešívanej kože pod textom a split‑flap tabuľa ako jazyk čísel |
| Druhý bod | Cena a Objednať | Názov služby | Ceny na tabuli |
| Text a obraz | Obraz nad textom, nikdy pod textom | Text dominuje, obraz v okienkach | Text priamo na textúre |
| Podklady | Existujúce fotky (`assets/img`, foto‑29, foto‑40, foto‑37, foto‑45) a náhľady z D2 | Existujúce písma (Fraunces 500 italic, ART_DIRECTION) | Výrez materiálu z vlastných fotiek |
| Mobil | Okno 358 × ~110 px nad skupinou | Dlhšia stránka (viac medzier, dnes 19,5 obrazovky) | Textúra pod textom |
| Pohyb | Paralaxa okna ≤ 6 % cez CSS, prelínanie v lightboxe | Len prelínanie | Jednorazový nástup textúry, preklápanie tabule |
| Prečo môže zlyhať | Opakovanie fotiek z galérie, bajty obrázkov | Rozpadne sa jednota s filmom, ešte dlhší skrol | Kontrast < 4,5 : 1, „30“ nemáme vo vektore, tabuľa všade = šum a práca hlavného vlákna (D1 ju práve odľahčila) |
| ZADANIE: „vzhľad sa len zdokonaľuje“ | Áno, paleta, písma a karty ostávajú | Čiastočne, mení sa mierka typografie | Nie, pribúda nová vrstva materiálu |

**Odporúčanie: smer A.** Prečo:
- Najväčšia pozorovaná slabina je prerušená súvislosť medzi filmom a pásmi.
- A ju rieši skutočnými fotkami prevádzky, ktoré už sú v pipeline.
- Nemení paletu, písma ani karty.
- Nepridáva JS na snímku.
- Napĺňa bod 2 ZADANIA („zámerné tmavé plochy … aj tie musia mať obsah“).

Zo smeru B sa preberie len sadzba jednej citácie pri rezervácii (Fraunces 500 italic, ART_DIRECTION ju povoľuje)
a správne optické veľkosti, ktoré rieši D6a. Zo smeru C sa nepreberá nič, tabuľa ostáva len pri hodinách.

Smer by sa zmenil, keby statické štúdie A pri 390 px ukázali, že okná opakujú galériu alebo zhoršujú čitanie cenníka.
Potom nastupuje smer B bez okien.

#### 7.3 Efekty (jeden vlastník každej vlastnosti)

| ID | Efekt | Kde | Účel | Priebeh (vstup / držanie / výstup / prerušenie / návrat / upratanie) | Statická verzia | Obmedzený pohyb | Rozpočet výkonu | Vlastník |
|---|---|---|---|---|---|---|---|---|
| E1 | **FX046** Skladanie vrstiev: „okná miestnosti“ | Hlavičky skupín cenníka (kandidáti: Strih – `naradie-noznice`; Brada a holenie – `detail-stol`; Doplnky – foto‑45 pracovné miesto; Balíčky – vyberie štúdia), riadok detského strihu (foto‑29 COPS), blok poukážok a produktov (foto‑40 recepcia, ľudia nie), karta „Kde nás nájdeš“ (foto‑37 vchod s rohožkou). Kandidátov je 7, štúdia vyberie najviac 6. Foto‑40 len výrez pultu s boxom „DARČEKOVÁ POUKÁŽKA“: bez figúrky Mickey Mouse, vizitiek so Salónom 30 a tvárou a bez TV (ten istý dôvod ako vylúčenie foto‑17 v MEDIA_SELECTION). Výber potvrdiť pohľadom na fotky (C016, súpis záberov). | Návštevník vie, kde v prevádzke je a o čom je skupina. Tmavý pás má obraz. | Okno je statické: pseudoprvok s `background-image: image-set(avif, webp)`. Obrázok sa nastaví až pri triede `is-near` na páse (IO z `app.js`, vzor D2), po stiahnutí a `decode()` cez `new Image()`; dovtedy ukazuje náhľad z `nahlady.css` (D2). Pri prerušení a návrate sa nič neanimuje. | Tá istá. | Tá istá. | Spolu ≤ 6 okien, každé ≤ 40 kB AVIF na telefóne. Len lenivo, nikdy v prvom obraze. Pomer strán rezervovaný (CLS 0). Šírka súboru ≥ šírka × DPR (do 2×; fotky 1200 px len do šírky okna 600 css px). 0 B v HTML, 0 ms JS na snímku. | `style.css`; obrázky `build_images.py` |
| E2 | **FX007** Paralaxa (jedna vrstva, ≤ 6 %) | Obrázok v okne E1 | Jemný pohyb kamery aj v pásoch, filmový jazyk bez filmu | `@supports (animation-timeline: view())` a `prefers-reduced-motion: no-preference`: `translateY` −3 % → +3 % na pseudoprvku, len `transform` (kompozitor). Pseudoprvok je o 6 % vyšší než okno (presah 3 % hore aj dole), aby sa pri posune nikdy neodkryl tmavý okraj. Bez podpory statické. | Statické okno. | Statické okno. | 0 zápisov z JS. Štýl na snímku počas skrolu ≤ výsledok D5 + 0,2 ms. Ak brána neprejde, E2 sa vypne a E1 ostane. | CSS animácia; `app.js` na okná nesiaha |
| E3 | **FX012** Prelínanie v lightboxe (Z046) | Lightbox galérie (`app.js:481–529`) | Odstrániť nesúlad popisu a fotky a tvrdý strih (N37) | Klik, šípka alebo švih spustí stiahnutie a `img.decode()` novej fotky; popis stojí. Potom sa v jednej snímke vymení popis a začne 300 ms lineárne prelínanie dvoch vrstiev `<img>`. Stará vrstva sa po konci odpojí. Nová požiadavka počas čakania zruší predošlú (len posledná, C055). Počas prelínania sa aktuálne prelínanie dokončí hneď a začne ďalšie. Po zobrazení sa predčítajú susedia ± 1. | Okamžitá výmena po dekódovaní. | Okamžitá výmena po dekódovaní, rovnaká rezervovaná plocha. | ≤ 3 dekódované fotky v pamäti. Žiadna úloha > 50 ms pri CPU 4×. INP ≤ 200 ms. | Modul lightboxu v `app.js` |
| E4 | **FX053** Švih a počítadlo pásov | Lightbox (švih). Pásy tímu, galérie a recenzií (počítadlo „3 / 10“ + tlačidlá ← → na počítači a klávesnici). | Kto hľadá svojho barbera, vie, koľko kariet ostáva (N25). V galérii sa listuje prstom. | Švih cez pointer events: prah 40 px a \|dx\| > 1,5 × \|dy\|, inak natívny skrol, klik a ťah sa rozlišujú. Počítadlo sa mení podľa IntersectionObserver na kartách (nie podľa scroll). Text počítadla je `aria-hidden`, tlačidlá majú `aria-label`. | Zoznam so scroll‑snap. | Bez plynulého posunu (`scroll-behavior: auto`). | Len IO, 0 práce na snímku. Ciele dotyku ≥ 44 px. | `app.js` (pásy) |
| E5 | **FX006/FX002** Otváranie odpovedí | `<details>` v „Pred návštevou“ | Plynulé otvorenie bez skoku | `::details-content` + `interpolate-size: allow-keywords` (0 → auto za 200 ms). Bez podpory sa otvorí hneď. Žiadny JS. | Okamžité otvorenie. | Okamžité otvorenie. | Animuje sa layout len jednej položky pri ťuknutí, nie počas skrolu. LoAF pri otvorení ≤ 50 ms pri CPU 4×. | CSS |
| E6 | Sadzba citácie (zo smeru B) | Recenzia pri rezervácii (D6b, bod 14) | Dôkaz pri rozhodnutí bez ďalšieho prvku | Statická sadzba Fraunces 500 italic, ≤ 62 znakov na riadok, meno a „Google“ v Manrope. | Tá istá. | Tá istá. | 0. | CSS |

Vylúčené efekty (R9, R10, MASTER_BRIEF, ART_DIRECTION):
- FX029 preostrenie,
- FX055 odhalenie podľa hĺbky,
- FX032 zrno,
- FX045 tónovanie a LUT,
- FX034 chromatická aberácia,
- FX035 rozmazanie pohybom,
- FX031 bloom,
- FX038 častice,
- ďalšie efekty pod kurzorom (FX052 už je, na želanie majiteľa),
- Z025 textúra pod textom,
- nekonečné animácie,
- brány typu „ENTER“ alebo „Start the experience“,
- čierne úvodné plochy.

#### 7.4 Rozpočet výkonu (proti meraniu po D5, tá istá metóda)

- `skrol.mjs --scen=stredne` a `--scen=svih` (CPU 4×, Fast 4G, `?uvod=off`, 3 behy, medián):
  - úloha snímky p95 ≤ výsledok D5 + 1 ms a stále ≤ 20 ms,
  - štýl na snímku ≤ výsledok D5 + 0,2 ms a ≤ 2,0 ms,
  - dlhé úlohy ≤ 6,
  - snímky > 16,7 ms ≤ 8 %.
- `skrol2.mjs --film=off --cpu=1`: p95 vlákna ≤ 5,5 ms a žiadna úloha vlákna > 50 ms (ZADANIE 2.1, meranie b).
- Absolútne hranice ZADANIA 2.1 platia vždy, aj keď je výsledok D5 horší: snímka p95 ≤ 20 ms, snímky > 33 ms ≤ 2 %,
  žiadna snímka > 100 ms, LCP ≤ 2,5 s, INP < 200 ms, CLS < 0,05.
- Film: `git diff` na `film.js` je prázdny, pamäť grafiky (sonda `over-film.mjs`) ≤ 140 MB.
- Čierne okná:
  - sady D2 (`co2-*`, `co3-*`, `co4-*`) a D3 (`co1-*`, `co5-*`) bez nového okna,
  - nové okná E1 nikdy jednofarebne tmavé > 150 ms (náhľad pod nimi).
- Lighthouse a webové metriky:
  - mobil ≥ 95 (gzip server, záťaž < 2), počítač 100 naživo (lokálne ≥ 98),
  - LCP nie horší o > 0,1 s,
  - CLS < 0,05 (dnes ≤ 0,0005),
  - INP ≤ 200 ms (menu, jazyk, lightbox) pri CPU 4×.
- `index.html` ≤ 14 600 B gzip (D7 pridá ≤ 30 B).
- Bajty obrázkov D7 ≤ 260 kB na celú stránku na telefóne, všetko lenivo, prvý obraz +0 B (`vaha.mjs`).

#### 7.5 Akceptácia D7

- **Štúdie:**
  - tri statické štúdie (A, B, C) pása cenníka a karty „Kde nás nájdeš“ pri 390 × 844 a 1440 × 900 zo skutočných
    podkladov, uložené v `chyba/navrh/studie/`,
  - rubrika C017 pred a po, s pozorovaním a snímkou pri každej známke,
  - zdôvodnený výber.
- **Rubrika po D7:** typografia ≥ 2, kompozícia pásov ≥ 2, interakcia ≥ 2, žiadny rozmer neklesne.
- **E1:**
  - najviac 6 okien, každé ≤ 40 kB AVIF,
  - pod každým náhľad, takže nikde jednofarebná tmavá plocha > 150 ms,
  - pomer strán rezervovaný (CLS 0), šírka súboru ≥ šírka × DPR (do 2×),
  - fotky len zo súpisu `source/audit.json` s `people_visible: nie`; foto‑29 a foto‑40 sa pred použitím zapíšu
    do MEDIA_SELECTION s výrezom a stĺpcom „ľudia“; výrez foto‑40 bez figúrky, vizitiek a TV (kontrola pohľadom).
- **E2:** beží len pri podpore `animation-timeline` a bez obmedzenia pohybu. Do okien sa nezapisuje z JS (sonda zápisov
  štýlu) a štýl na snímku stúpne najviac o 0,2 ms.
- **E3:**
  - popis sa vymení najviac 16 ms od začiatku prelínania (rozšírený `lightbox-tma.mjs`; meria sa z obrazu, `Page.startScreencast`
    alebo snímky po 16 ms, nie z `currentSrc`, ktorý sa prepne hneď a dnešnú chybu neukáže),
  - žiadna snímka nemá nový popis nad starou fotkou,
  - prelínanie trvá 300 ms ± 1 snímka,
  - po 5 rýchlych ťuknutiach sa ukáže posledná požadovaná fotka,
  - pri obmedzení pohybu je výmena okamžitá,
  - najviac 3 dekódované fotky.
- **E4:**
  - na 390 × 844 švih prstom (CDP dotyk) prejde na ďalšiu fotku, zvislý ťah skroluje stránku,
  - počítadlo pásu tímu ukazuje „n / 10“ správne v troch polohách,
  - tlačidlá ← → idú klávesnicou, ciele dotyku ≥ 44 px,
  - `aria-label` tlačidiel ← → má kľúč vo všetkých 7 slovníkoch (`i18n-test.mjs`).
- **E5:** otvorenie odpovede bez LoAF > 50 ms pri CPU 4×, pri obmedzení pohybu okamžite.
- **Rozpočet a vzhľad:**
  - rozpočet 7.4 je splnený a `film.js` sa nezmenil,
  - `karty-shot.mjs` (titulné karty): rozdiel > 30 úrovní najviac na 0,5 % pixelov,
  - žiadne nové písmo, farby len z tokenov (`--lamp` je jediný akcent),
  - v kóde nepribudol `filter: blur` ani `backdrop-filter` na mobile.

**Overenie D7**
- Kópia nástrojov cez `nastroje.sh` (pred = commit pred D7, po = HEAD).
- Meranie:
  - overenie‑kod‑stranka: `bash ab3.sh d7 stredne 3 uvod=off zaklad` a `ab3.sh d7s svih 3 uvod=off zaklad`,
  - overenie‑vykon‑telefon: `node skrol2.mjs --film=off --cpu=1` a `node inp.mjs --film=off --cpu=4`,
  - overenie‑cierne‑okna: `over.mjs` (`co1`–`co5`) s `over2.py`,
  - `vaha.mjs`, `karty-shot.mjs --wait=5000`,
  - rozšírený `lightbox-tma.mjs` (porovnanie/skripty),
  - Lighthouse cez gzip server.
- Snímky 390 × 844, 360 × 780 a 1440 × 900 si pozrie art director aj druhý kontrolór (C084: ten istý viewport, obsah
  a stav pred a po).

**Riziko D7**
- Výkon vrstiev: každé okno je pri paralaxe vlastná vrstva, preto strop 6 okien a brána; inak sa E2 vypne.
- Opakovanie fotiek z galérie: iné výrezy a výber v štúdiách.
- Podpora časovej osi skrolu: Safari pred verziou 26 a Firefox ostanú statické.
- Bajty na pomalej sieti: lenivé načítanie a náhľad.
- Subjektívny posudok: rubrika s pozorovaním a dvaja kontrolóri.
- Súbeh s `content-visibility` z D5 (výšky pásov): kotvy ± 1 px.

**Kapitoly skillu:** C016, C017, C024, C032, C042, C043, C055, C057, C076, C084, C087, C100.


---

## 6. Texty na schválenie (slovenské znenie; kľúč do 7 slovníkov, preklad overený rovnako ako pri jazykových verziách)

| Kde | Text | Zdroj (stupeň, dátum) | Kedy |
|---|---|---|---|
| Pred návštevou: objednanie | Online rezervácia má štyri kroky: služba, barber alebo „Nezáleží“, termín a tvoje údaje. Potvrdenie ti príde e‑mailom. | rezervačný systém, texty krokov a potvrdenia (oficiálne, 20. 10.) | hneď |
| … dopredu | Online sa objednáš až mesiac dopredu, aj na dnes, keď je voľný termín. | getCalendar (oficiálne, 20. 10.) | hneď |
| … zmena | Termín zmeníš telefonicky na 0951 267 203 alebo e‑mailom na info@barbershop30.sk. | text potvrdenia v systéme (oficiálne; hovorí len o zmene) | hneď; zrušenie až po otázke 3 |
| … barber | Barbera vyberať nemusíš. V rezervácii zvoľ „Nezáleží“. | getEmployees (oficiálne) | hneď |
| … deti | Strih pre malých gentlemanov do 10 rokov trvá 45 minút a stojí 15 €. Rezervácia je vždy pre jednu osobu, pre dvoch si sprav dve. | systém (oficiálne) | hneď |
| … parkovanie | Mostná je v zóne SM‑A. V pracovné dni po 16:00 a v sobotu po 12:00 parkuješ zadarmo, inak prvá hodina 1 €, každá ďalšia 2 €. Pozor, na Parkovom nábreží a Na Predmostí sa platí stále. Bezplatné záchytné parkoviská nájdeš na nitra.sk/parkovanie. Podľa mesta Nitra, stav k 20. 10. 2026. | nitra.sk/parkovanie (úrad, upravené 13. 8. 2026) | hneď |
| … bez objednania | Prísť môžeš aj bez objednania. S rezerváciou máš svoj čas istý. | starý oficiálny web (živý 20. 10.), recenzia Jana U. | hneď, potvrdenie neblokuje |
| … poukážky | Darčekové poukážky máme. Ako ich kúpiť, ti povie recepcia na 0951 267 203. | starý web, foto‑40 (poukážky na pulte) | hneď |
| … produkty | Prípravky, ktoré používame, si môžeš kúpiť aj u nás. | starý oficiálny web | hneď |
| … cudzí jazyk (en) | The booking page is in Slovak. Need help? Call +421 951 267 203. | rezervácia po slovensky (prepínač EN pri skúške 20. 10. nepreložil), CONTENT_SOURCES | hneď (len iné jazyky) |
| Romana | Farbenie, melír, trvalú, tónovanie, prekrytie šedín a poliózu robí Romana. Rezervuješ ich v Booqme, bez platby vopred. | Booqme (oficiálne, 20. 10.; `payment-required=0`) | hneď |
| Nad cenníkom | Objednať otvorí rezervačný systém, službu v ňom vyberieš v 1. kroku. | systém | hneď |
| Tím | Barbera si vyberieš v 2. kroku, alebo zvolíš „Nezáleží“. | systém | hneď |
| Cenník | Ceny a trvanie podľa rezervačného systému, overené 20. 10. 2026. | `rezervacia-kontrola.mjs` | po prvom behu nástroja |
| Úvod a Rezervácia | Dnes 9:00–19:00 · Teraz otvorené | otváracie hodiny (CONTENT_SOURCES), sviatky zo systému | hneď (po schválení kompozície v D7) |
| Tabuľa na sviatok | Sviatok · Online sa na dnes objednať nedá. | getCalendar | hneď; po potvrdení „Dnes zatvorené“ |
| Fakty | 8 kresiel · minimálne čakanie | starý oficiálny web | ak majiteľ nepotvrdí „v troch miestnostiach“ |
| 404 | Táto stránka tu nie je. · Rezervovať termín · Zavolať 0951 267 203 · Späť na úvod | CONTENT_SOURCES | D6a‑0 |
| Pätička | Právne informácie | ORSR, starý web | D6a |

Texty sú krátke, v druhej osobe, bez dlhej pomlčky a bez superlatívov (CLAUDE.md, MASTER_BRIEF).

---

## 7. Otázky pre majiteľa (len to, čo sa nedá zistiť; v zátvorke, čo odpoveď odomkne)

Najprv odpovedať na 1, 2, 3, 5, 6, 15 a 21 (platba, poukážky, storno, bez objednania, sviatky, vernostná kartička,
doména). Ostatné odomknú len doplnky a môžu počkať.

1. Platba v barbershope: karta, hotovosť, iné? (D6b platba)
2. Darčekové poukážky: ako sa kupujú (recepcia, telefonicky, na diaľku)? Sú na sumu, alebo na službu? Aká je platnosť
   a ceny? Chcete ich predávať online (Booqme e‑shop je prázdny)? (D6b poukážky)
3. Storno: dokedy sa dá termín zmeniť alebo zrušiť, je poplatok, čo pri meškaní (koľko minút)? (D6b storno)
4. Chodí zákazníkom naozaj SMS alebo e‑mailová pripomienka deň vopred? (D6b pripomienka)
5. Platí stále „aj keď prídeš bez objednania“ zo starého webu? (potvrdenie D6b, riadok v úvode)
6. Ste zatvorení vo dni, ktoré blokuje rezervácia (1. 1., 6. 1., Veľký piatok, Veľkonočný pondelok, 1. 5., 5. 7., 29. 8.,
   1. 11., 24.–26. 12.)? Ste otvorení 8. 5., 1. 9., 15. 9. a 17. 11.? Máte skrátené hodiny 31. 12.? (tabuľa „Dnes
   zatvorené“)
7. Parkovanie: máte vlastné miesta alebo dohodu s parkoviskom? Ktorá zastávka MHD je najbližšie? (D6b parkovanie)
8. Bezbariérový vchod (atribút na Google): platí? Je tam schod alebo prah? (D6b)
9. „Recepcia už 8 rokov, ako jediný barbershop v Nitre“: od ktorého roku a podľa čoho „jediný“? Register a starý web
   uvádzajú rok 2019. Inak navrhujeme „Pri dverách ťa privíta recepčná.“ (oprava rozporu)
10. „8 kresiel v troch miestnostiach“: v koľkých miestnostiach sú kreslá? (fakt N09)
11. Školenia: názov, odkaz alebo kontakt? Hľadáte barberov (kariéra)? (D6b školenia, kariéra)
12. WhatsApp: používa ho recepcia, na akom čísle? (D6b)
13. Ktoré značky prípravkov predávate na recepcii? (D6b produkty)
14. Romana: smieme uviesť jej ceny z Booqme (35 až 80 €) a dni pondelok až streda? (D6b Romana)
15. Vernostná kartička: odkedy ju chcete ponúkať zákazníkom (treba spustiť systém kartičiek na serveri headspa30.sk
    a nastaviť heslo pre recepciu) a aké budú odmeny a body? (odkaz v pätičke, veta pri rezervácii)
16. Výsledky strihov: môžete dodať 8 až 12 fotiek so súhlasom klientov (najlepšie zozadu alebo z profilu)? (blok výsledkov)
17. Barberi: v akých jazykoch sa dohovoria a majú Instagram (so súhlasom)? (karty tímu)
18. Smieme na webe uviesť hodnotenie číslom („5,0 z 949 recenzií na Google, 20. 10. 2026“) s odkazom? (dôkaz pri
    rezervácii)
19. Recenzie so slovom „Tony“ (v tíme taký barber nie je): ponechať doslovne, alebo vymeniť za inú? (recenzie)
20. Máte písomné súhlasy zamestnancov s portrétmi a videami na webe? Sú klienti vo videách nerozpoznateľní? (pred
    spustením na doméne)
21. Doména a rezervácia:
    - Smieme spustiť nový web na www.barbershop30.sk?
    - Kto spravuje hosting a DNS?
    - Kto prevádzkuje rezervačnú aplikáciu, aby /rezervacia ostala funkčná?
    - Vie systém otvoriť konkrétnu službu alebo barbera cez adresu?
    - Dáte prístup do Google Search Console a profilu Google?

    (D6c, predvoľba služby)
22. Ochrana údajov:
    - Kto spracúva údaje z rezervácie (dodávateľ systému)?
    - Ako dlho sa uchovávajú?
    - Kto je kontakt pre otázky?
    - Je FACEPALM, s.r.o. platiteľ DPH (IČ DPH)?
    - Má firma menej ako 10 zamestnancov a ročný obrat do 2 mil. €? Stačí áno alebo nie (len kvôli povinnosti
      vyhlásenia o prístupnosti).

    (pravne.html, D6c)
23. Facebook a Instagram: pošlete snímku profilu a posledných noviniek? Bez prihlásenia sa nedajú prečítať. (texty
    noviniek)
24. Vektorové logo „30 Barbershop Holičstvo“ (SVG alebo PDF)? Ikona sa dovtedy vyrobí z existujúceho favicon.svg.
    (ikony, prípadný znak)

Otázky Q1–Q7 z PLAN.md (originály videí, hudba na telefóne, kreslenie v pokoji, fotka rohožky na počítači, DPR 3,
skutočné zariadenia) platia ďalej a tu sa neopakujú.

---

## 8. Čo nerobiť

- Nevymýšľať recenzie, hviezdičky ani počty („10 000+ strihov“, „stovky spokojných“). Nepridávať superlatívy
  („najlepší v Nitre“) ani nové tvrdenia typu „jediný v Nitre“.
- Nedávať `aggregateRating` ani `review` do JSON‑LD. Nedávať FAQPage do HTML (R3).
- Nepoužívať cudzie fotky:
  - 98 fotiek verejnosti na Google profile,
  - konkurencia,
  - fotobanky,
  - generované obrázky,
  - fotky výsledkov bez súhlasu klientov,
  - fotky vylúčené pre súkromie (foto‑43, 03, 17, 28, 07, 19, 25, 39; MEDIA_SELECTION).
- Neuvádzať ceny, služby ani trvania mimo rezervačného systému barbershop30.sk a Booqme (Romana). Žiadne ceny „od“,
  zľavy ani akcie. Romanine ceny len so súhlasom (pravidlo jedného cenníka).
- Nepresmerovať rezerváciu barberov na Booqme. Nevkladať rezervačný formulár ani vlastný formulár. Nepredstierať
  predvoľbu služby či barbera, ktorú systém nevie.
- Nevkladať mapu Google cez iframe (cookies a výkon), odkaz Navigovať stačí. Nepridávať analytiku, GTM ani cookie lištu
  bez rozhodnutia majiteľa.
- Nepoužívať vyskakovacie okná (zľava, newsletter), odpočítavanie ani falošnú naliehavosť.
- Nespomínať AI, nástroje ani 3D model. Prehliadka je „prehliadka podniku“.
- Z efektov nepoužívať:
  - FX029 preostrenie a žiadne iné rozmazanie,
  - zrno, LUT ani tónovanie,
  - chromatickú aberáciu, bloom ani častice,
  - ďalšie efekty pod kurzorom,
  - FX055 odhalenie podľa hĺbky,
  - textúru pod textom (Z025),
  - nekonečné animácie,
  - brány „ENTER“,
  - čierne úvodné plochy.
- Nemeniť `film.js`, strihy CUTS, sekvencie, prológ ani titulné karty v D6 a D7 (vlastníci D3–D5).
- Neprekročiť 14 600 B gzip v `index.html`. Nepridávať viditeľný text bez kľúčov v 7 slovníkoch.
- Nepoužívať `backdrop-filter` na mobile a nepridávať nové písma. Nedokresľovať logo „30“ (vektor nemáme).
- Neukazovať odkaz vernostnej kartičky, kým na headspa30.sk nebeží `vernost/` (curl 200).
- Nespomínať Salón 30 ani HEAD SPA 30 ako súčasť značky a nedávať ich telefón na stránky Barbershopu.
- Neuvádzať atribút LGBTQ+ z Google profilu bez výslovného súhlasu majiteľa. Bezbariérovosť len po potvrdení.
- Nemeniť canonical JavaScriptom (R7). Nepreberať texty konkurencie, len princípy.

---

## 9. Poradie, závislosti a odhad (C006; odhad práce agentov vrátane kontrol, nie cena)

| Dávka | Kedy | Závisí od | Optimisticky / očakávane / ťažko | Čo spôsobuje rozptyl |
|---|---|---|---|---|
| D6a‑0 | hneď na `main` | nič | 1 / 2 / 3 h | emulácia 404 servera, porovnanie variantu HEAD SPA |
| D6a | po zlúčení D5 | D1 (tabuľa), D2 (skok z menu) | 6 / 9 / 14 h | tabuľa po D1, ikony z kriviek, pravne.html a jej kontrola, rozpočet HTML |
| D6b | po D6a | D6a (hodiny.js, nástroj), odpovede majiteľa len pre skryté položky | 8 / 12 / 18 h | vloženie bez posunu kotiev, preklad do 8 jazykov, druhé overenie zdrojov |
| D7 | po D6b | D2 (náhľady), D5 (pásy, content‑visibility) | 10 / 16 / 24 h | štúdie troch smerov, výber fotiek, brány výkonu, lightbox |
| D6c | keď majiteľ dá súhlas a prístupy | D6a, D6b, D7 | 6 / 12 / 24 h + čakanie | hosting, rezervačná aplikácia na tej istej doméne, DNS |

Rozsah sa zmení, keď:
- majiteľ dodá fakty (skryté položky D6b sa len zapnú),
- dodá fotky výsledkov (blok výsledkov a E1/E3 pre ne),
- doména nebude možná (D6c sa zúži na Search Console pre github.io).

---

## 10. Kde sú dôkazy

- Obsah a cesta zákazníka: `$SP/barber/chyba/obsah-cesta/`:
  - `data/inventar.json`, `data/cesty.json`,
  - snímky `t01–t15`, `d01–d05`, `e01–e03`, `z-*`,
  - `zdroje/bs30-rez.html`, `cal.json`, `emp.json`.
- Technika a SEO: `$SP/barber/chyba/technika-seo/`:
  - `lh/`, `jazyky.json`, `dom-*.json`, `klavesnica.json`,
  - `odkazy-vysledok.txt`, `404-barbershop-ukazuje-headspa.jpg`, `live/`.
- Porovnanie: `$SP/barber/chyba/porovnanie/`:
  - `data/porovnanie.json`, `data/b30-polohy.json`, `data/lightbox-tma.json`,
  - `snimky/_*.jpg`.
- Fakty: `$SP/barber/chyba/fakty/FAKTY.md` a `zdroje/` (booqme, booqme2, web, google, firma, parkovanie, ine, fb, ig).
- D1–D5: `$SP/barber/PLAN.md`, `$SP/barber/workflowy/davky.json`.
- Strojová podoba dávok D6a–D7 pre workflow opráv: `$SP/barber/chyba/navrh/davky-d6-d7.json`.

---

## 11. Recenzia faktov a plánu (20. 10. 2026)

Skeptický recenzent (product owner a editor faktov) otvoril zdroje a priamo v tomto pláne opravil jasné chyby. Pôvodná
verzia a dôkazy sú v `$SP/barber/chyba/recenzia-planu/` (`PLAN-D6-D7.pred-recenziou.md`, `skripty/oprav_plan.py`, OSM,
skúška prepínača EN, výrezy foto‑40). Opravené:
- Romana: v Booqme nie je platba kartou online (`payment-required=0` pri všetkých 14 službách, sekcia platby skrytá).
- Parkovanie: bez mena „Nábrežie mládeže“ (časť je v platenej zóne CH‑A), doplnené nonstop spoplatnené Parkové nábrežie
  a Na Predmostí.
- Zmena termínu: systém hovorí len o zmene, „zrušíš“ čaká na otázku 3.
- Angličtina: veta o automatickom preklade rezervácie vypustená (skúška nepreložila, na telefóne je prepínač v menu).
- N07: písmo Fraunces je statický rez `opsz 144` bez `tnum`, CSS oprava by nič nezmenila; najprv príčina, potom rozhodnutie.
- D6a‑0: úplný zoznam súborov, cesta 404 aj pre vlastnú doménu, blok Barbershopu sa nesmie dostať do FTP balíka HEAD SPA.
- D7: 7 kandidátov na najviac 6 okien, výrez foto‑40 bez figúrky Mickey Mouse a vizitiek, presah obrázka pri paralaxe,
  absolútne hranice ZADANIA v rozpočte, merateľné kritériá (ťuknutia, zmena času, lightbox z obrazu, kľúče `aria-label`).
- Otázky: poradie dôležitosti, zrozumiteľná otázka 15, otázka 22 na áno/nie, rozsah cien Romany bez „od“.

Sporné body (rozhodnutie pred implementáciou) sú vo výstupe recenzie, nie v tomto pláne. Strojová podoba
`chyba/navrh/davky-d6-d7.json` a `chyba/fakty/FAKTY.md` (platba kartou u Romany) sa musia zosúladiť s týmto textom.
