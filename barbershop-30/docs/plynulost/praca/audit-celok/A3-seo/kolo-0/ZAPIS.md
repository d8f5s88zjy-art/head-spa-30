# Audit A3 – SEO, kolo 0 (BARBERSHOP 30, 26. 10. 2026)

Strom: `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/hs-skvrny/barbershop-30`, commit `2687b6e`
(vetva barbershop-skvrny, `git status` čistý, v strome sa nič nezmenilo). Chromium 141 z /opt/pw-browsers (Playwright),
server `python3 -I -m http.server 8880–8889 --bind 127.0.0.1`, jeden prehliadač naraz, po každom skripte zavretý.

## Zhrnutie pre majiteľa

Texty pre Google (titulok, popis, nadpis H1 s „Barbershop 30 · Nitra“), cenník, kontakt, hodiny a časté otázky sú
v poriadku, sedia so stránkou a dajú sa prečítať aj bez skriptov. Anglická stránka je celá preložená. Našli sme tri
vážne veci: (1) údaje pre Google majú typ podniku „BarberShop“, ktorý slovník schema.org nepozná, takže Google ich
nezoberie ako údaje o firme; (2) kanonická adresa, obrázok na zdieľanie, údaje pre Google aj mapa stránok ukazujú na
adresu `d8f5s88zjy-art.github.io/barbershop30/`, ktorá dnes vracia chybu 404; (3) zlá adresa pod webom Barbershopu
ukáže chybovú stránku HEAD SPA 30 s jej telefónom a rezerváciou. Ďalej: jazykové verzie cez `?lang=` v mape stránok
Google nezoberie, telefón má na začiatku 0,5 až 1,8 s blokovaný procesor (TBT) a pár drobností. Všetko ide opraviť
bez zmeny vzhľadu.

Počty: **3 vážne, 2 stredné, 10 drobných**. Kontrolný skript: 98 kontrol OK.

## Ako to zopakovať

```
cd /tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/barber/audit-celok
node nastroje/a3-seo.mjs --git --online --json=A3-seo/kolo-0/a3-seo.json      # statika HTML, JSON-LD, robots, sitemap (+ curl)
node nastroje/a3-rychlost.mjs --port=8880 --out=A3-seo/kolo-0/snimky --behy=3  # LCP, CLS, TBT, bez JS, telefón
node nastroje/a3-rychlost.mjs --port=8880 --gl=swiftshader --len-rychlost       # to isté so softvérovým WebGL
node nastroje/a3-dlhe-ulohy.mjs --port=8883 --cpu=4                             # pôvod dlhých úloh (záznam výkonu)
node nastroje/a3-zdroje.mjs --port=8884                                         # zdroje, gzip, počet prvkov DOM
node nastroje/a3-mobil-detail.mjs --port=8885                                   # písmo < 12 px, ťukacie plochy
```
Pomocné: `a3-bezjs-detail.mjs`, `a3-tbt-rozbor.mjs`, `a3-karta.mjs`, `a3-hero-zasah.mjs`, `a3-pisma.mjs`, `a3-glyfy.mjs`
(všetky v `nastroje/`, hlavička každého hovorí, čo robí). Slovník schema.org: `nastroje/schemaorg-current-https.jsonld`
(stiahnutý 26. 10. 2026). Výstupy: `A3-seo/kolo-0/*.txt`, `*.json`, snímky `A3-seo/kolo-0/snimky/*.jpg`.

## Nálezy

### A3-01 · vážna · Typ podniku v údajoch pre Google neexistuje
- **Súbor:** `barbershop-30/index.html:56` (`"@type": "BarberShop"`), vygenerovaná `en/index.html:57`.
- **Dôkaz:** `a3-seo.txt`: `VAZNA [jsonld-typ] @type "BarberShop" v slovníku schema.org neexistuje … (index.html:56)`
  a `[jsonld-localbusiness] @type BarberShop nie je podtyp LocalBusiness`. Slovník schema.org (graf 1,5 MB) nemá
  `schema:BarberShop` (0 výskytov), `curl https://schema.org/BarberShop` → 404, `https://schema.org/HairSalon` → 200,
  HairSalon je podtyp HealthAndBeautyBusiness → LocalBusiness (`a3-externe-odkazy.txt`). Google preto celý blok (adresa, hodiny, 15 cien,
  hasMap) nevie zaradiť ako firmu. Plán N04 v OTAZKY-PRE-MAJITELA.md už HairSalon navrhol, v kóde nie je.
- **Návrh:** `"@type": "HairSalon",` (riadok 56). Nič iné sa nemení; `en/` sa vytvorí znova (`node source/tools/en-stranka.mjs`,
  pri nasadení sa to robí samo). Overiť `node nastroje/a3-seo.mjs` (0× jsonld-typ) a admin-test (admin prepisuje ceny v JSON-LD).

### A3-02 · vážna · Kanonická adresa, obrázok na zdieľanie a mapa stránok vedú na adresu s chybou 404
- **Súbory:** `index.html:24` (canonical), `:30` og:url, `:31` og:image, `:59–60` JSON-LD url/image;
  `rezervacia.html:15, 21, 22`; `sitemap.xml:9, 23, 28…` (všetky `<loc>`); `robots.txt:9`;
  `source/tools/nasad-barbershop30.sh:2` (cieľ samostatného nasadenia).
- **Dôkaz:** `a3-zive-adresy.txt` a `a3-seo.txt` (časť Naživo, curl 26. 10. 2026 09:08 UTC):
  `404 https://d8f5s88zjy-art.github.io/barbershop30/`, `404 …/barbershop30/en/`, `404 …/sitemap.xml`,
  `404 …/robots.txt`, `404 …/assets/og.jpg`. Samostatné nasadenie (repozitár barbershop30) teda neexistuje.
  Nasadenie cez `.github/workflows/pages.yml:35` adresu prepíše na `…/head-spa-30/barbershop-30/` (táto verzia je
  živá, HTTP 200), ale ukážka, ktorú si majiteľ pozerá (raw.githack, strom bez úprav), aj nasadenie skriptom
  nasad-barbershop30.sh posielajú Google na 404 a pri zdieľaní odkazu chýba obrázok (og:image → 404).
- **Návrh:** jedna skutočná adresa webu. Kým majiteľ nerozhodne o doméne (otázka 21: www.barbershop30.sk, rezervácia
  `/rezervacia` musí ostať), dať do stromu tú, kde web naozaj beží: jedným príkazom z README („Nasadenie“)
  `https://d8f5s88zjy-art.github.io/barbershop30/` → `https://d8f5s88zjy-art.github.io/head-spa-30/barbershop-30/`
  v index.html, rezervacia.html, robots.txt, sitemap.xml (sed v pages.yml sa potom nič nezmení). Skript
  nasad-barbershop30.sh nepoužívať, kým repozitár barbershop30 s Pages neexistuje. Pri presune na doménu ten istý
  sed na `https://www.barbershop30.sk/`. Overiť `node nastroje/a3-seo.mjs --online` (žiadne VAZNA [nazivo]).

### A3-03 · vážna · Zlá adresa pod webom Barbershopu ukáže stránku HEAD SPA 30 s jej telefónom
- **Súbory:** `barbershop-30/404.html` neexistuje; koreňový `404.html` (mimo sparse stromu, `git show HEAD:404.html`)
  riadky 6, 52, 54; `.github/workflows/pages.yml:34` (404 Barbershopu sa nekopíruje);
  `source/tools/nasad-barbershop30.sh:20–22` (ani tu).
- **Dôkaz:** `a3-zive-adresy.txt`: `https://d8f5s88zjy-art.github.io/head-spa-30/barbershop-30/neexistuje` → 404 so
  stránkou `<title>Stránka sa nenašla | HEAD SPA 30 Nitra</title>`, `tel:+421911153136`,
  `booqme.app/sk/rezervacia/salon-30-head-spa`. Rovnako dnes `…/barbershop-30/en/` (živá verzia je ešte staršia).
  `a3-seo.txt`: `VAZNA [404-chyba]`. Pravidlo podkladov: „nedávať telefón HEAD SPA na stránky Barbershopu“; oprava
  D6a-0 N02 („ide hneď na main“) nie je urobená. Pri samostatnom nasadení by sa ukázala anglická 404 GitHubu bez
  odkazu na web.
- **Návrh (texty len zo stránky a plánu N02):** `barbershop-30/404.html` s `noindex`, štýlom webu a textom
  „Táto stránka tu nie je.“, tlačidlá „Objednať sa“ (https://www.barbershop30.sk/rezervacia), „Zavolať 0951 267 203“
  (tel:+421951267203), „Späť na úvod“; kopírovať v nasad-barbershop30.sh. Pre nasadenie v podpriečinku head-spa-30
  musí koreňový 404.html podľa cesty `/head-spa-30/barbershop-30/` ukázať blok Barbershopu (N02) – je to súbor
  HEAD SPA, zmenu robiť opatrne a overiť obe cesty curl.

### A3-04 · stredná · Jazykové verzie `?lang=` v mape stránok Google nezoberie
- **Súbor:** `sitemap.xml:42–131` (6 blokov `<url>` s `?lang=uk|hu|sr|pl|de|cs`) a riadky hreflang 15–20 a 34–39.
- **Dôkaz:** `a3-seo.txt`: 6× `STREDNA [sitemap-kanonicka] …?lang=uk: stránka má canonical …/barbershop30/`
  a `STREDNA [hreflang-kanonicka] 6 hreflang vedie na adresy s inou canonical`. Adresa `?lang=` vracia slovenské HTML
  s canonical na slovenskú stránku (preklad robí až skript), takže Google ju má za duplikát a hreflang na ňu ignoruje;
  Search Console ich ukáže ako „alternatívna stránka so správnou kanonickou značkou“. Dvojica sk ↔ en a x-default je
  v poriadku (`OK [hreflang-vzajomnost]`).
- **Návrh:** zo sitemap.xml vynechať 6 blokov `?lang=` a v zvyšných dvoch (`/`, `/en/`) riadky hreflang uk, hu,
  sr-Latn, pl, de, cs; ostane sk, en, x-default. Prepínač `?lang=` ostáva pre ľudí. Vrátiť ich, až keď budú statické
  stránky `/uk/`, `/hu/`… (plán D6c).

### A3-05 · stredná · Telefón: blokovaný procesor po načítaní (TBT 0,5–1,8 s)
- **Súbory:** `assets/app.js`, `assets/style.css`, neskoro vkladané `assets/karty.css`, `assets/i18n.css`,
  `assets/atmosfera.css` (film.js nie je predmetom tohto návrhu).
- **Dôkaz:** `a3-rychlost.txt` (Chromium bez prepínačov ako PageSpeed, telefón 412×823, CPU 4×, sieť Slow 4G,
  3 behy): úvodná stránka TBT 953 / 550 / 677 ms (medián 677), en/ 1758 / 771 / 508 ms, rezervacia.html 0 / 7 / 390 ms.
  `a3-dlhe-ulohy-index-cpu4.txt` (záznam výkonu, 2 behy, TBT 1459 a 918 ms): dlhé úlohy sú hlavne prepočet
  rozloženia a štýlov celej stránky (Layout 88–376 ms, UpdateLayoutTree do 150 ms v jednej úlohe, úlohy 169–621 ms),
  skladanie vrstiev (Layerize 324 ms po načítaní karty.css), spustenie modulov (v8.evaluateModule 60–333 ms),
  časovač 230 ms a i18n `offer` 81 ms; ďalšia úloha 318 ms (Layout 227 ms) prišla po 4,3 s. Neskoro vložené štýly:
  karty.css po 0,43 s, atmosfera.css a i18n.css po 3,8 s (`a3-zdroje-index.txt`). Stránka má 919 prvkov DOM
  a 17 255 px na výšku (`a3-zdroje-index.txt`, `a3-rychlost-swiftshader.txt`). Merania kolíšu (počítač CPU 1×: 95 vs 842 ms), lebo súčasne bežia iné kontroly.
  So softvérovým WebGL (zariadenie bez grafiky) pribudne jedna úloha 1,7–2,3 s pri overovaní grafiky filmu
  (`a3-tbt-rozbor-cpu4.txt`: predvolené 2466 ms, `?film=off` 398 ms, bez WebGL 352 ms) – len zaznamenávam, film.js patrí
  oprave čiernych škvŕn.
- **Návrh (vzhľad sa nemení):** pravidlá z karty.css, i18n.css a atmosfera.css (spolu ~6 kB gzip) dať do style.css,
  aby sa celá stránka neprepočítavala trikrát; `offer()` z i18n.js a ďalšie nepotrebné pri štarte spúšťať cez
  `requestIdleCallback`; skúsiť `content-visibility: auto` s `contain-intrinsic-size` na pásoch pod prvou obrazovkou
  (pozor: app.js meria polohy kotiev filmu – overiť app-smoke a tma-test). Merať `a3-rychlost.mjs` (cieľ TBT < 200 ms).
- **LCP:** prvok je text nadpisu H1 (`span.w`), na telefóne 3,3–3,8 s, na počítači 0,5–1,1 s. Lokálny server
  neposiela gzip: HTML 83 kB (gzip 15 kB), style.css 93 kB (gzip 23 kB) – `a3-zdroje-index.txt`. Na GitHub Pages
  bude prvý obraz rýchlejší; o koľko, sme nemerali.

### A3-06 · drobná · Nadpisy H2 bez slov, ktoré ľudia hľadajú
- **Súbor:** `index.html:483–484` („Služby a ceny“ je `<p class="kicker">`, H2 „Čo to bude dnes?“), `:290–291`
  („Ľudia“ / „Komu zveríš hlavu?“), `:644–645` („Galéria“ / „Pozri si to zblízka.“), `:784–785` („Rezervácia“ /
  „Kedy si sadneš?“).
- **Dôkaz:** `a3-seo.txt`, časť slová: „cenník“ H2 0×, „Nitra“ H2 0×, „barbershop“ H2 0×. Pri H1 je to vyriešené
  nadpiskom vnútri nadpisu (`index.html:186–188`).
- **Návrh:** rovnako ako H1: `<h2 class="title kin" id="h-sluzby"><span class="kicker">Služby a ceny</span> Čo to<br> bude dnes?</h2>`
  a `<p class="kicker">` zmazať; to isté pre „Rezervácia“, „Galéria“, „Ľudia“. `.kicker` je `display:flex`, vyzerá
  rovnako; `rozdel()` v `assets/app.js:730–740` ale delí na slová aj vnorené značky, musí `.kicker` preskočiť
  (inak by nadpisok dostal pohyb po slovách). Overiť app-smoke, i18n-test, en-test.

### A3-07 · drobná · Údaje pre Google bez priceRange, @id a geo
- **Súbor:** `index.html:53–106`.
- **Dôkaz:** `a3-seo.txt`: `DROBNA [jsonld-odporucane] chýba odporúčané podľa Google: geo, priceRange`,
  `DROBNA [jsonld-id]`.
- **Návrh:** `"@id": "<základná adresa>#barbershop"`, `"priceRange": "3 € – 40 €"` (najlacnejšia Úprava obočia 3 €
  `index.html:595`, najdrahší Ultra inclusive 40 € `:577`). `geo` až po overení súradníc z profilu Google
  (CHECKS 27: „súradnice nie sú overené“), nevymýšľať.

### A3-08 · drobná · Open Graph: business.business bez kontaktných údajov, chýba druhý jazyk
- **Súbor:** `index.html:25` (`og:type business.business`), `en/index.html:26`.
- **Dôkaz:** `a3-seo.txt`: `DROBNA [og-type] … bez povinných business:contact_data:*`, `DROBNA [og-locale-alt]`.
- **Návrh:** `<meta property="og:type" content="website">` (plán N10) a `<meta property="og:locale:alternate" content="en_GB">`
  (na en/ `sk_SK`; en-stranka.mjs to vie doplniť pri zámene og:locale).

### A3-09 · drobná · Dve ikony stránky, jedna je data:URI
- **Súbor:** `index.html:36–37`, `rezervacia.html:23–24`, `en/index.html:37–38`.
- **Dôkaz:** `a3-seo.txt`: `DROBNA [favicon] 2× rel=icon (data:URI, assets/favicon.svg)`.
- **Návrh:** riadok 36 (data:URI) zmazať, ostane `assets/favicon.svg` (plán N10).

### A3-10 · drobná · Obrázok zväčšenej fotky so `src=""`
- **Súbor:** `index.html:898`, `en/index.html:899`.
- **Dôkaz:** `a3-seo.txt`: `DROBNA [img-src] img so src="" (neplatné HTML …)`.
- **Návrh:** atribút `src=""` vynechať (lightbox ho nastaví pri otvorení), `alt=""` a rozmery nechať.

### A3-11 · drobná · robots.txt zakazuje /admin/, ktorý má noindex; súbor platí len v koreni domény
- **Súbor:** `robots.txt:6`, `admin/index.html:6`.
- **Dôkaz:** `a3-seo.txt`: `DROBNA [robots-noindex] … Google noindex neprečíta`, `DROBNA [robots-umiestnenie] web je
  v podpriečinku /barbershop30/: vyhľadávače čítajú len robots.txt v koreni domény`.
- **Návrh:** `Disallow: /admin/` zmazať (noindex, nofollow stačí) alebo nechať a vedieť, že pri odkaze zvonka môže
  Google zaradiť adresu bez obsahu. Sitemap pred presunom na doménu odoslať ručne v Search Console.

### A3-12 · drobná · Rezervácia: po zapnutí objednávky bude indexovaná, ale nie je v sitemap
- **Súbor:** `.github/workflows/pages.yml:66` (zmaže `<meta name="robots" content="noindex">`), `sitemap.xml`,
  `rezervacia.html:13, 22`.
- **Dôkaz:** `a3-seo.txt`: rezervacia.html `OK [robots] noindex`, `DROBNA [twitter] chýba twitter:card`,
  `DROBNA [og-image-wh]`; sitemap má len `/` a `/en/` + `?lang=`.
- **Návrh:** v tom istom kroku pages.yml pridať do sitemap `<url><loc>…/rezervacia.html</loc>…</url>`; do hlavičky
  rezervacia.html `twitter:card summary_large_image` a `og:image:width 1200`, `og:image:height 630`.

### A3-13 · drobná · Malé ťukacie plochy v kontakte a pätičke
- **Súbor:** `index.html:803–804` (telefón a e-mail v „Kde nás nájdeš“), `:873–877` (Instagram, Facebook, Navigovať,
  Vernostná kartička), cenník „Objednať“ (15×), skoky v cenníku (vytvára `assets/app.js:833`).
- **Dôkaz:** `a3-mobil-detail-index.txt` (390 px, elementFromPoint vrátane neviditeľného presahu): telefón 96×22 px,
  e-mail 121×22 px (pod 24 px, WCAG 2.5.8), pätička 24 px, „Objednať“ v cenníku 106×40 px, skoky 40 px, „hook“
  odkazy 41 px. Odkazy so šípkou majú presah 49–57 px (oprava CHECKS 28 platí), úvodné tlačidlá 44 px
  (`a3-hero-zasah.txt`). Text pod 12 px je len na vizitke (napodobenina tlačenej vizitky).
- **Návrh:** rovnaký neviditeľný presah ako pri odkazoch so šípkou (`::after` s `inset: -12px 0`) pre
  `.contact-row a` a `.footer-links a`; vzhľad sa nezmení.

### A3-14 · drobná · „8 rokov“ recepcie nesedí s rokom 2019
- **Súbor:** `index.html:223` („Ako jediný barbershop v Nitre ju máme už 8 rokov.“), `:817`; oproti `:813`, `:853`
  („Od roku 2019“) a JSON-LD `foundingDate 2019` (`:63`).
- **Dôkaz:** OTAZKY-PRE-MAJITELA.md otázka 9 (otvorená), CONTENT_SOURCES.md:125 („potvrdiť u majiteľa“). 2019 → 2026 je 7 rokov.
- **Návrh:** kým majiteľ nepotvrdí, text z podkladov: „Pri dverách ťa privíta recepčná.“ a pri faktoch len „Recepcia“
  s „pri vchode“ podľa ART_DIRECTION – alebo nechať, ak majiteľ potvrdí rok.

### A3-15 · drobná · Počet recenzií v úvode je zo 13. 10.
- **Súbor:** `index.html:192` („5,0 na Google · 945 recenzií“), kľúče v `assets/i18n/*.json`.
- **Dôkaz:** CONTENT_SOURCES.md:157 (overené 13. 10., „pri ďalšej kontrole aktualizuj“), OTAZKY-PRE-MAJITELA.md
  otázka 18 uvádza 949 k 20. 10.
- **Návrh:** pred nasadením znova overiť na profile Google (cid 18132360254733427623) a prepísať číslo vo všetkých 8 jazykoch.

## Čo prešlo (s dôkazom)

- Titulky a popisy (`a3-seo.txt`): sk „Barbershop 30 Nitra | Pánske holičstvo, Mostná 30“ 49 znakov, popis 131;
  en 49 a 132; rezervácia 32 a 125; všetky jedinečné.
- `lang` sk/en/sk/sk/sk, `og:locale` sedí; viewport bez zákazu priblíženia.
- Canonical sk → `/`, en → `/en/`, rezervácia → seba (a noindex); hreflang sk ↔ en ↔ x-default vzájomný v sitemap.
- sitemap.xml platné XML, lastmod 2026-10-25 = posledný commit index.html; robots.txt platný, CSS/JS/obrázky neblokuje.
- noindex: rezervacia.html, karta/, admin/ (karta a admin aj nofollow).
- og:image `assets/og.jpg` 1200×630, 139 kB, obsah sedí s og:image:alt (snímku som otvoril); twitter:card summary_large_image.
- manifest platný, ikony 192, 512, maskovateľná 512 s presnými rozmermi; apple-touch-icon 180×180.
- JSON-LD syntax platná; 15 ponúk = 15 riadkov cenníka (názvy aj ceny); telefón, e-mail, adresa, hodiny (Po–Pi 9–19,
  So 9–14) a sameAs sedia s textom; bez aggregateRating a review (Google ich o sebe samom neukazuje).
- Časté otázky sú text v HTML (8 otázok) bez FAQPage – správne, Google od 2023 výsledky s otázkami ukazuje len
  úradom a zdravotníctvu.
- Jeden H1 s „Barbershop 30 · Nitra“, poradie nadpisov bez preskočenej úrovne.
- 30 obrázkov, všetky s alt; 211 odkazovaných súborov existuje; všetky kotvy existujú; target=_blank má noopener;
  externé odkazy (rezervácia, Booqme, Google Maps) HTTP 200, Instagram a Facebook presmerujú na prihlásenie
  (bežné bez cookies) – `a3-externe-odkazy.txt`.
- Bez JavaScriptu (`a3-rychlost-swiftshader.txt`, snímky `uvod-bezjs-390.jpg`, `bezjs-index-html-390.jpg`):
  892 slov, H1 viditeľný, 19 cien, telefón, fotka úvodu načítaná; po 5 s úvod celý (tlačidlá aj hodnotenie).
- Telefón 360 a 390 px: bez vodorovného pretekania na index, en, rezervácia; CLS na telefóne 0, pri skrolovaní 0,
  na počítači najviac 0,032 (dobré je < 0,1).
- Anglická stránka: `en-stranka.mjs --check` „aktuálna“, v texte nezostala slovenčina (len mená a adresa).
- Vernostná kartička z pätičky: bez servera kartičiek ukáže „Kartičky práve spúšťame … 0951 267 203“
  (`karta-po-tuknuti-390.jpg`), nie chybu.

## Miestne vyhľadávanie oproti docs/SEO-ANALYZA.md

Hotové: titulok so „Nitra“, „Pánske holičstvo“, „Mostná 30“; popis 131 znakov; H1 s „Barbershop 30 · Nitra“;
slovo „holičstvo“ (titulok, popis, úvod); časté otázky; anglická stránka; hasMap; cenník a tím v HTML. „Nitra“
je v texte 10×, „strih“ 36×, „brada“ 18×, „holenie“ 13×, „Mostná/Mostnej“ 7×. Chýba a čaká na majiteľa (nič
z toho nedopĺňať bez potvrdenia): „bez objednania“ (otázka 5), darčekové poukážky (otázka 2), „v centre Nitry“
(nie je v overených podkladoch), geo súradnice (neoverené). Navyše oproti analýze: typ HairSalon (A3-01) a skutočná
adresa webu (A3-02) sú pre miestne výsledky dôležitejšie než ďalšie slová.

## Neoverené a obmedzenia

- Čierne škvrny vo filme som nevidel: v Chromiu bez grafickej karty sa film po overení grafiky vypne (`world-frame
  world-off` v `a3-tbt-rozbor-cpu4.txt`), takže ho tieto merania neukazujú.
- Rýchlosť je laboratórna (Playwright + CDP, nie Lighthouse), bez gzip a so súbežnými kontrolami na tom istom stroji.
- Živý web na `…/head-spa-30/barbershop-30/` je zo staršej vetvy main (titulok 82 znakov, sitemap s `?lang=en`,
  `en/` → 404); po nasadení tejto vetvy sa nahradí.
- Ako Google stránky naozaj zaindexuje, ukáže až Search Console po nasadení.
