# SEO diagnóza – Stavebniny Richtárik (4. 11. 2026)

Strom: `hs-richtarik-obnova/stavebniny-richtarik`, vetva `richtarik-dokoncenie`, HEAD `4b2646bf`. V strome som nič
nemenil (`git status --short | wc -l` → 0). Server na porte 9620 som ukončil (`curl 127.0.0.1:9620` → 000).
Nástroje a surové výstupy sú v `richtarik/profi/diagnoza/seo/nastroje/`:
- `audit.py` → `audit-vystup.txt` a `audit.json`: všetkých 75 stránok cez lxml.
- `cwv.mjs` → `cwv.json` a `cwv.log`: telefón, 3 kolá striedavo.
- `cls-vsetky.mjs` → `cls-vsetky.json`: CLS na všetkých 75 stránkach.
- `cls.mjs` a `cls2.mjs`: zdroje posunov.

Mapa kľúčových slov je v `KLUCOVE-SLOVA.md`. Fakty sú z `diagnoza/texty/FAKTY.md` a nič nové nepridávam.

## Zhrnutie a priority

| P | ID | Nález | Dopad | Riešenie |
|---|---|---|---|---|
| **P0** | S-01 | og:image `img/uvod/og.jpg` je snímka vygenerovaného filmu s autom (otvoril som ju: biele auto „STAVEBNINY RICHTÁRIK“ na ulici). Je na **75 zo 75** stránok a v JSON-LD `image`. `build.py:24` ju mylne označuje „skutočný záber auta firmy“. | Auto ostane pri každom zdieľaní na Facebooku či WhatsAppe a v Google | nový `og.jpg` 1200×630 zo skutočnej fotky dvora bez auta (odporúčam A1 `u4` alebo neupravenú A4 `pas-dvor` z `bb6bbaeb`, pozri `diagnoza/uvod/ZAPIS.md` 2b). Prepísať `build.py:24` s komentárom, `index.html:14` a `:27`. Kvôli cache sociálnych sietí dať súboru nový názov, napr. `img/og-dvor.jpg` |
| **P0** | S-02 | Ostrý web dnes **nemá HTTPS**: `https://www…` → `SSL_ERROR_SYSCALL`, `http://www…` → 200, server Microsoft-IIS/10.0, ASP.NET 2.0. Nový web má canonical, og:url, sitemap aj `robots.txt` absolútne na `https://www.` (`build.py:23`). | Ak sa web spustí na HTTP, všetkých 75 canonical ukazuje na nefunkčnú adresu a Google môže stránky vyradiť | spustiť **len s HTTPS**. Ak hosting HTTPS nemá, prepnúť `DOMENA` na `http://www.` (jeden riadok, potom `build.py` a ručne `index.html`). Je to otvorená otázka majiteľa „hosting a HTTPS“ a predvolené riešenie nemením |
| **P0** | S-03 | Chýbajú 301 z `http://` na `https://` a z holej domény na `www.`. Na ostrom webe dnes vracia 200 aj `http://stavebninyrichtarik.sk/` (duplicita). `nasadenie/htaccess.txt` aj `web.config.txt` majú len 86 starých pravidiel a ciele sú relatívne (`/akcie/index.html`). | duplicity www/bez www, reťaz 2 presmerovaní (`.aspx` → http → https) | po zapnutí HTTPS pridať na začiatok kanonické pravidlo (host + schéma) a staré pravidlá smerovať priamo na `https://www…`. Hosting je IIS, preto platí `web.config` a treba modul URL Rewrite |
| **P1** | S-04 | Akcie a katalóg sa neprelinkujú konkrétne. 0 zo 43 katalógových stránok odkazuje na konkrétnu akciu. Žiadna akcia neodkazuje na svoju kategóriu ani značku, napr. `akcie/porfix.html` ↛ `katalog/murovaci-material/porfix.html` (grep → 0). Odkazy na katalóg na akciách sú len ponuka a päta (8 rovnakých). | slabý interný PageRank pre značky, používateľ nevie prejsť z akcie na sortiment a späť | v `build.py` pridať mapu akcia ↔ katalóg (16 párov, tabuľka v časti 4) a na katalógu blok „Táto značka je v akcii“ |
| **P1** | S-05 | Na akciách sú ceny len v obrázku letáku a v PDF. Napr. komín 918 € a tvárnice 1,45 € nie sú v HTML žiadnej akcie (`grep -l 918 akcie/*.html` → nič). Výnimkou je cement v description. Akcia má okolo 220 slov a väčšinu tvorí ponuka a päta. | Google aj asistent majú k cenám slabý text, stránky akcií sú tenké | prepísať ceny z `pdf/662.pdf` (28. 1. 2026) do HTML tabuľky s dátumom „cenník z 28. 1. 2026“. Bez nových cien |
| **P1** | S-06 | Z 1 023 obrázkov má **772 prázdny alt** (`audit.json`). Patria k nim fotky výrobkov s názvom v H3 hneď vedľa, napr. Ytong 35/37, Delap 60/62. | žiadna návštevnosť z Google Obrázkov na „Ytong tvárnica“ a podobne | alt = názov výrobku z H3 alebo popisu. Dekoratívne a opakujúce sa obrázky nech ostanú `alt=""` |
| **P1** | S-07 | Pomalé LCP na podstránkach s fotkou v hlavičke. `akcie/porfix` má 3,37 s a `kontakt` 3,10 s (telefón, CPU 4×, pomalé 4G, 3 kolá). LCP je fotka 247 kB AVIF (`zasoba-porfix-900`) a 177 kB (`pas-dvor-1280`). Spolu s ňou sa sťahujú 4 prednačítané písma a 89,5 kB CSS. | LCP nad hranicou 2,5 s | do hlavičky menšia fotka (pre 390 px stačí 720w, alebo `sizes` max. 360 px), 2 prednačítané písma namiesto 4 (len Condensed 800, Barlow 400 nechať swap) |
| **P1** | S-08 | CLS z obrázkov bez vyhradeného miesta: `site.css:297` `.logos img{width:auto}` a `:304` `.fig img{width:auto}` pri `loading="lazy"` majú pred načítaním šírku aj výšku 0. Na Ytongu sa po načítaní `.logos` zväčší z 34 na 150 px, `.figs` z 18 na 227 px a `.prods` skočí o 324 px (`cls2.mjs`). CLS 0,094 v 3 z 3 kôl. Na prvom pohľade 1 stránka ≥ 0,1 a 3 stránky 0,08–0,096 (`cls-vsetky.json`). | CLS na hranici „dobré“ | `.logos img{height:48px;width:auto}` (pomer strán sa dopočíta z atribútov), `.figs.n1 .fig img{width:100%}`. Pri ďalších `.fig` dať `aspect-ratio` zo šírky a výšky |
| **P1** | S-09 | Chýba stránka **Doprava**. Dopyt „doprava stavebného materiálu“ má dnes len H2 v `sluzby.html`. Fakty pritom sú, pozri časť 8. | strata najsilnejšieho odlíšenia firmy | nová `doprava.html` iba z faktov. Bez fotky vygenerovaného auta |
| **P1** | S-10 | Rovnaké H1 na akcii a v katalógu: Porfix, Ytong, Stavebné rezivo (`audit-vystup.txt:315`) | kanibalizácia | H1 akcie „… v akcii“ |
| **P2** | S-11 | Description sa skladá automaticky („Názov. Stavebniny Richtárik Nitra, značka, značka…“) a 26 zo 75 je odseknutých „…“ v polovici vety (`audit.json`). Niektoré obsahujú zvyšky: „1.“ (`qatro`), „HOME /do domácnosti/.“, „ASFALTOVÁ VLNITÁ KRYTINA.“, „diament plus bok mat.“. Akcie opakujú „Zľava z akciových cien so zákazníckou…“. | horšia miera preklikov (CTR) | ručné description pre hlavných 20 stránok z KLUCOVE-SLOVA.md, 120–155 znakov, celé vety, s výzvou |
| **P2** | S-12 | Slabé titulky: „Stone“, „Priečky“, „Fakro schody“, „Ytong“, „Porfix“ (`audit-vystup.txt:80–155`) | nízka relevancia | návrhy sú v KLUCOVE-SLOVA.md 1 a 2 |
| **P2** | S-13 | `sitemap.xml` nemá `lastmod` (`grep -c lastmod` → 0) | pomalšie znovu-prehľadávanie po zmenách (akcie) | `build_sitemap()` (`build.py:1150`) nech dopĺňa `lastmod` z dátumu commitu súboru, nie z dnešného dátumu |
| **P2** | S-14 | Novinky majú málo príchodzích odkazov: `magic-floor`, `topstone`, `vyrobky-z-plastu` a `fakro-schody-vylezy` majú po 1 (`audit-vystup.txt:368+`). | slabé prehľadávanie | odkaz z príslušnej kategórie katalógu (Bianka → Dlažby, plast → Podhľady a PVC, Fakro schody → Strešné okná) |
| **P2** | S-15 | JSON-LD HardwareStore je len na úvode a nemá `@id`. Na kontakte LocalBusiness chýba. | slabšie prepojenie entity | `"@id":"https://www.stavebninyrichtarik.sk/#predajna"`, rovnaký blok aj na `kontakt.html`, `image` = nový og (S-01) |
| **P2** | S-16 | Zmiešané tykanie („Príď k nám“, „Zavolaj“, „Chceš“) a vykanie („spravím vám“, „Vašu spokojnosť“) v H1, H2 a description | menej profesionálny dojem, slabšie CTR | B2B aj stavebníci: **vykanie** všade (rieši diagnóza textov) |
| **P3** | S-17 | H1 a omrvinky podstránok sú v `section.page-head` mimo `<main>` (`build.py:579`) | malý (prístupnosť a sémantika) | presunúť `page-head` do `<main>` |
| **P3** | S-18 | Staré letáky v `pdf/` (100 MB) sú indexovateľné a môžu sa ukazovať so starými cenami | zastarané ceny vo výsledkoch hľadania | po odpovedi majiteľa na „staré akcie bez dátumu“ zvážiť `X-Robots-Tag: noindex` pre staré PDF. Teraz nemeniť |

**Bez nálezu (overené):**
- 75 stránok, **0** duplicitných title aj description.
- 74 zo 74 indexovateľných stránok má canonical presne na vlastnú adresu. 404 má `noindex` a canonical nemá.
- Žiadny obrázok nie je bez atribútu alt alebo bez šírky a výšky.
- Hierarchia nadpisov nemá skoky. JSON-LD je bez chýb (73× BreadcrumbList, 1× HardwareStore).
- Všetkých 83 starých `.aspx` adries zo `zdroj/pages.json` má 301 a cieľ existuje (skript v časti 3).
- `robots.txt` povoľuje všetko a odkazuje na sitemap. Sitemap má 74 adries bez 404.
- NAP (adresa, oba telefóny, e-mail, IČO a hodiny) je na všetkých 75 stránkach rovnaký.
- Obrázky sú 865× webp a 7× avif. PNG sú len 2 logá (spolu 25,8 kB).
- Bez JS sa `.rv` zobrazí (`.no-js .rv{opacity:1}`).
- „40 rozbitých odkazov“ z auditu sú odkazy `/…` na 404, ktorá sa servíruje z ľubovoľnej hĺbky. Na hostingu sú správne,
  v náhľade pod `/stavebniny-richtarik/` nie.

## 1. Technické: indexovateľnosť, canonical, duplicity
- `audit-vystup.txt:3–78`: canonical „OK“ na 74 stránkach, 404 `robots=['noindex']`.
- Canonical `…/akcie/index.html` je konzistentný s internými odkazmi aj so sitemap. Adresa `/akcie/` však
  servíruje ten istý obsah. Canonical to rieši, ale krajšie je `index.html` → `/akcie/` (301) a canonical na adresár.
  Je to **P3**, len ak sa bude tak či tak meniť `build.py`.
- **Živý web** (`curl`, len GET):
  - `http://www.stavebninyrichtarik.sk/` → 200, IIS/10.0
  - `http://stavebninyrichtarik.sk/` → 200
  - oba `https://` → `curl: (35) SSL_ERROR_SYSCALL` (kontrola `https://example.com` → 200, proxy funguje)
  - `/sitemap.xml` → 404
  - `robots.txt` → `User-agent: *`

## 2. Titulky, description, H1–H3
Úplný zoznam je v `audit-vystup.txt:80–318`.
- Dĺžky title sú 34–60 znakov a description 120–154 znakov. Formálne v norme, obsahovo pozri S-11 a S-12.
- Úvod: title 56 znakov je dobrý. **H1 „Všetko na stavbu. Dovezieme.“ nemá miesto ani slovo „stavebniny“.**
  Nový úvod má mať v H1 ako HTML text „Stavebniny v Nitre“. Hook môže ostať v druhom riadku H1 alebo v podnadpise.
- `index.html:25` a `site.css:823` `html.pisma .hero .text{visibility:hidden}` skrýva text úvodu až na 1,5 s, kým sa
  nenačíta písmo. Nový úvod to nemá robiť. Lepšie je `font-display: optional` alebo fallback s `size-adjust`. Text nesmie
  čakať na JS.

## 3. Presmerovania (nasadenie/)
- Overenie: skript nad `zdroj/pages.json` a `nasadenie/presmerovania.tsv` vypísal „stránok v zdroji 83, chýba
  presmerovanie 0, cieľ neexistuje []“. TSV má 236 riadkov vrátane `files/N.pdf|doc|wmv`.
- Chýba (S-03), v poradí:
  1. host a schéma na `https://www.`
  2. staré `.aspx` priamo na absolútne `https://www…/…`, aby nevznikla reťaz
  3. `ErrorDocument 404` (je tam)

  V `web.config` treba ekvivalent `<rule>` s `{HTTPS}` a `{HTTP_HOST}`.
- Po spustení: Google Search Console → Zmena adresy netreba (doména je rovnaká). Odoslať sitemap a 2 týždne sledovať
  „Stránka s presmerovaním“ a 404.

## 4. Interné prelinkovanie (katalóg ↔ akcie ↔ značky)
Overenie: pre každú `akcie/*.html` → 8 unikátnych odkazov na katalóg (ponuka a päta). Pre každú `katalog/**.html` →
0 odkazov na konkrétnu akciu.

Navrhnuté páry (podľa názvov a obsahu stránok):

| Akcia | Katalóg |
|---|---|
| porfix | murovaci-material/porfix |
| ytong | murovaci-material/ytong |
| pezinska-tehla-termobrik | murovaci-material/pezinske-tehelne |
| betonove-tvarnice | murovaci-material + dlazby |
| cement-325-r | sypke-zmesy |
| sakret (Univerbau) | sypke-zmesy + fasadny-system |
| komin-qatro | kominove-systemy/qatro |
| krytina-blachotrapez | stresne-kritiny/blachotrapez |
| okna-schody-fakro | stresne-okna/fakro (+ fakro-schody-vylezy) |
| stresne-okna-rooflite | stresne-okna |
| nobasil (Climowool) | izolacny-material |
| sadrokartonovy-zateplovaci-system | sadrokartonovy-zateplovaci-system |
| dlazby-ploty-stadreko | dlazby |
| stavebne-rezivo | stavebne-rezivo |
| stavebne-naradie | stavebne-naradie-doplnky |

Drobčeky sú na 73 stránkach, vrátane BreadcrumbList.

## 5. Obrázky a Core Web Vitals (telefón)
**Podmienky:** Playwright Chromium, 390×844, DPR 3, CPU 4×, sieť 150 ms a 1,6 Mb/s (pomalé 4G), cache vypnutá.
Merali sa 3 kolá a v každom kole varianty v rovnakom poradí (A/B striedavo). Stroj mal 4 jadrá a záťaž 4,0–4,6 od
súbežných úloh (`uptime` pred aj po meraní). Absolútne čísla sú preto skôr horšie, porovnania platia.
INP je náhrada: ťuk na menu a zavretie. Skutočné INP z poľa bude v CrUX až po spustení.

| Stránka | LCP ms (3 kolá) | LCP prvok | CLS | INP ms | TBT ms | kB po načítaní |
|---|---|---|---|---|---|---|
| úvod A (pohyb) | 2040 / 2040 / 2016 | `film/prvy-t960.avif` | 0 | 32–40 | 167–255 | 498 |
| úvod B (obmedziť pohyb) | 2044 / 2024 / 2032 | to isté | 0 | 56–80 | 132–191 | 1 361 (1 602 po skrole) |
| katalóg Murovací materiál | 2180 / 2140 / 2236 | `zasoba-tehly-856.avif` | 0 | 32–40 | 65–123 | 542 |
| akcia Porfix | **3388 / 3368 / 3372** | `zasoba-porfix-900.avif` (247 kB) | 0 | 32 | 68–91 | 610 |
| kontakt | **3064 / 3136 / 3092** | `pas-dvor-1280.avif` (177 kB) | 0 | 32 | 54–61 | 692 |
| katalóg Ytong | 2204 / 2168 / 2208 | `hd/tehla-1200.webp` | **0,094** | 40 | 268–349 | 529 |

- LCP úvodu je dnes snímka filmu s autom a tá odchádza. Nový úvod: LCP = jedna skutočná fotka cez `<img>` alebo
  `<picture>` s `fetchpriority="high"` a preloadom. Na telefóne najviac ~150 kB. Pohyb rieši CSS transform nad hotovou
  fotkou, nie sekvencia snímok. Cieľ je LCP ≤ 2,0 s v rovnakom meraní.
- Fotky v hlavičkách podstránok (`zasoba-porfix`, `pas-dvor`, `dvor-predajna`) sú podľa `diagnoza/uvod/ZAPIS.md` 2a
  generatívne doplnené. Pri výmene za neupravené verzie zároveň zmenšiť (S-07).
- Mapa CLS na všetkých stránkach (`cls-vsetky.json`, bez skrolovania): ≥ 0,1: 1 (`onduline` 0,1001). 0,05–0,1: 3
  (`akcie/sadrokartonovy…` 0,0955, `topstone` 0,0914, `mediterran` 0,084). Pod 0,05: 71. Hodnoty kolíšu medzi
  behmi: `onduline` raz 0, raz 0,1. Na `akcie/sadrokartonovy…` sa posunie `.ph-in`, `MAIN` a položka omrviniek o 92 px
  vodorovne v čase 3 049 ms. Príčinou je neskoré zalomenie hlavičky (písmo alebo skript). Treba overiť v oprave.

## 6. Štruktúrované dáta
Dnes (`index.html:27`): HardwareStore s menom, alternateName, oboma telefónmi, e-mailom, `foundingDate` 1997, adresou
s PSČ, hodinami Po–Pi a So, `paymentAccepted`, `areaServed` Slovensko, url, logom, `image` (auto, S-01),
`hasMap` (cid zo zdroja) a `taxID`.
- **geo nepridávať.** V zdroji sú len stredy výrezov máp (`ll=48.273139,18.089676`, `48.282736,18.088989`,
  `48.297812,18.100147` pri zoom 11–13), nie poloha špendlíka. Súradnice nech dodá majiteľ z Google Business Profile.
- **sameAs nepridávať.** V `zdroj/pages.json` nie je Facebook, Instagram ani YouTube (grep → 0). Po založení alebo
  overení GBP môže pribudnúť jeho adresa.
- **Offer/Product nepridávať.** Cenník 662.pdf má len „Aktualizované dňa 28.01.2026“ a žiadnu platnosť do. Je to
  9 mesiacov starý údaj a otázka „staré akcie bez dátumu“ je otvorená. Bez `priceValidUntil` a dostupnosti by išlo
  o zavádzajúce rich results.
- **FAQPage:** len na stránke `caste-otazky.html`, kde sú otázky viditeľné. Od 2023 Google zobrazuje FAQ rich results
  len autoritatívnym vládnym a zdravotníckym webom. Prínos je preto hlavne pre ostatné vyhľadávače a pre konzistenciu
  s asistentom, nie pre úryvok v Google. Priorita P3.
- WebSite `SearchAction` nepridávať (Google sitelinks searchbox zrušil v 11/2024).

## 7. Open Graph, ikony, manifest
- og:title, og:description, og:url, og:type, og:locale, og:site_name a `twitter:card` sú na každej stránke.
  og:image 1200×630 je vždy ten istý súbor s autom (S-01).
- Ikony (`ikona-192/512`, `apple-touch-icon`), `favicon.svg` a `manifest.webmanifest` auto nemajú. Overené otvorením
  v `diagnoza/uvod/ZAPIS.md:54–55`, `manifest` som prečítal.
- Návrh: og pre katalógové kategórie môže byť fotka kategórie (`img/hd/*` sú Pexels a na podstránkach sú povolené),
  úvod a kontakt skutočný dvor. Zdieľanie stránky „Strešné krytiny“ by tak ukazovalo krytinu.

## 8. Obsahové medzery (len z existujúcich faktov)
1. **`doprava.html`** (P1). Z faktov:
   - vlastná nákladná doprava na miesto stavby po celom Slovensku (PW:9)
   - Avia 3,5 t a nákladné auto 8 t s mechanickou rukou (PW:31, PW:2736). **Značku 8 t auta neuvádzať**, LIAZ alebo
     Iveco je otvorená otázka.
   - tovar priamo k vám bez prekladania, menšie riziko poškodenia (PW:2736)
   - podmienky z akcií:
     - TermoBRIK „doprava zdarma až na stavbu, vykládka za poplatok“ (PDF s.1)
     - Porfix „pri celom kamióne doprava až domov zdarma“
     - Ytong „pri celom kamióne zdarma až na stavbu“
     - polystyrén „dovezieme priamo domov zdarma“
     - Blachotrapez „doprava nad 50 m² 17 € s DPH“, vykládka 40 €
     - strešné krytiny „výpočet krytiny ZDARMA, doprava ZDARMA“ (PDF s.4:46, na webe dnes nie je)

   Fotky: skutočné autá `img/p/883–885` len so súhlasom majiteľa. Inak bez fotky auta, napríklad fotka dvora.
2. **`caste-otazky.html`** (P2). 10–15 otázok, napríklad:
   - Dovezú materiál aj mimo Nitry?
   - Dá sa platiť kartou?
   - Čo je zákaznícka karta a aká je zľava?
   - Robíte výpočet spotreby?
   - Predávate na splátky?
   - Kedy máte otvorené?
   - Majú firmy špeciálne zľavy?

   Odpovede majú byť **rovnaké ako v overenej databáze asistenta**. Asistent tak neodpovedá inak než web a jeho
   odpovede sú zároveň indexovateľné.
3. **Výpočet materiálu:** samostatná stránka by bola tenká (jeden fakt). Lepšie je dať do `sluzby.html` sekciu
   „Pošlite projekt alebo zoznam“ s postupom (e-mail, telefón).
4. **Ceny akcií v HTML** (S-05).

## 9. Konkurencia (WebSearch, len ako podklad)
Päť dopytov:
- „stavebniny Nitra“
- „stavebný materiál Nitra doprava“
- „tehly Porfix Ytong Nitra cena“
- „strešná krytina Nitra predajňa“
- „zámková dlažba Nitra stavebniny“

Nástroj hľadá z USA. Vrátil hlavne české katalógy (ceskestavby.cz, estav.cz, zbozi.cz), registre (finstat) a PDF.
Ani na jeden dopyt nevrátil miestne stavebniny. Z jedného PDF cenníka vyplýva, že pobočka Lindab (plechové krytiny)
je na Novozámockej 67 v Nitre, teda v susedstve. Skutočnú SERP pre Nitru týmto nástrojom overiť nejde. Odporúčam
ručne v anonymnom okne zo Slovenska (google.sk, poloha Nitra) a hlavne cez Search Console po spustení. Nič som
nekopíroval.

## 10. AI asistent a nový úvod: SEO podmienky
- Úvod: H1, podnadpis, telefón a CTA musia byť HTML text viditeľný bez JS aj pri obmedzenom pohybe. Žiadny text
  v canvase ani v obrázku.
  - Pripnutie (sticky alebo scroll) nesmie posunúť obsah pod úvodom, aby nevznikol CLS.
  - Sekcia „Dvor plný materiálu“ so skutočnými fotkami dostane `alt` s popisom (napr. „Palety tehál TermoBRIK na dvore
    predajne v Horných Krškanoch“), bez čísel.
- Asistent:
  - Skript načítať až po ťuku na tlačidlo alebo `requestIdleCallback`, nie v kritickej ceste. Vplyv na LCP, CLS
    a TBT má byť 0.
  - Tlačidlo `position:fixed` s rezervovaným miestom. Nesmie prekryť telefón ani CTA na telefóne.
  - Odpovede sa neindexujú, preto rovnaké Q&A musia byť ako text na `caste-otazky.html`.
  - Prípadný server endpoint `Disallow` v `robots.txt` a `X-Robots-Tag: noindex`.
  - Web dnes **nemá stránku ochrany osobných údajov** (grep „ochrana/gdpr/cookies“ → len výskyty v texte výrobkov).
    Povinný odkaz z označenia asistenta preto treba vyrobiť. Text dodá majiteľ alebo právnik, nevymýšľať.
- Slovo „AI“ v titulkoch, description ani texte webu nepoužívať, okrem povinného označenia asistenta.

## 11. Návrh pre majiteľa mimo webu (len odporúčania)
1. **Google Business Profile:** overiť alebo prevziať profil (cid `137067579998285540` zo zdroja). Názov
   „Stavebniny Richtárik“, kategória Predajňa stavebného materiálu, adresa Novozámocká 62/68, hodiny Po–Pi 7–16 a So 7–12,
   oba telefóny, web, skutočné fotky dvora a predajne (nie generované). Súradnice z GBP použiť ako `geo` na webe.
2. **NAP všade rovnako:** Firmy.sk, Zlaté stránky, Azet katalóg, Mapy.cz a Apple Maps rovnakým zápisom ako na webe.
3. **Recenzie:** požiadať zákazníkov o recenziu na GBP (napr. kartička s QR pri pokladni) a odpovedať na každú.
   Recenzie na web nepreberať ani nevymýšľať.
4. **Search Console a Bing Webmaster Tools:** overiť doménu, odoslať sitemap a sledovať pokrytie a dopyty.
   Po 4 týždňoch doplniť KLUCOVE-SLOVA.md skutočnými číslami.
5. **Akcie:** aktualizovať cenník s dátumom platnosti. Potom je možné doplniť Offer s `priceValidUntil` a odstrániť
   staré PDF z indexu.
