# Oprava, kolo 1 – BARBERSHOP 30, audit A3 (SEO), 27. 10. 2026

Strom `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/hs-audit` (vetva `barbershop-audit` z `2687b6e`, sparse:
`barbershop-30/`, koreňový `404.html`, `.github/`). Commity len lokálne, nič sa neposlalo ani nenasadilo.
`assets/film.js` ani hĺbkové mapy sa nemenili (`git diff --name-only 2687b6e..HEAD` – 15 súborov, žiadny film ani hĺbka).
Dôkazy sú v `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/barber/audit-celok/oprava-1/`
(ďalej `oprava-1/`).

## Commity (2687b6e..HEAD)

| commit | čo |
|---|---|
| `5d7bc23` | Barbershop 30: SEO – typ podniku HairSalon, funkčná adresa webu a vlastná chybová stránka |
| `f26de28` | Barbershop 30: SEO – mapa stránok len s kanonickými adresami |
| `37b23e1` | Barbershop 30: SEO – drobnosti v hlavičke, robots.txt a rezervácia v mape stránok |
| `0b6d074` | Barbershop 30: oprava – väčšie ťukacie plochy v kontakte a pätičke na telefóne |
| `38c8f2f` | Barbershop 30: denník – zvyšné opravy auditu SEO a čo čaká na majiteľa |

Záplata: `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/barber/audit-celok/oprava.patch`
(`git format-patch 2687b6e..HEAD --stdout`, 5 commitov). Skúška: `git am` na čistý `2687b6e` prešiel a strom vyšiel
zhodný s vetvou (tree `e5b862a9…` v oboch).

## Nález → stav → dôkaz

| nález | stav | dôkaz |
|---|---|---|
| **A3-01** vážna – `@type BarberShop` nie je v schema.org | **opravené** (`5d7bc23`) | `barbershop-30/index.html:56` a `en/index.html:57` `"@type": "HairSalon"`; `oprava-1/a3-seo-po.txt`: `OK [jsonld-slovnik] všetky @type a vlastnosti sú v schema.org`, `OK [jsonld-localbusiness] HairSalon je podtyp LocalBusiness`; admin, ktorý prepisuje ceny v JSON-LD: `oprava-1/testy/admin-test.txt` 101 OK, 0 FAIL (`OK údaje pre Google (JSON-LD): nová cena, platný JSON`) |
| **A3-02** vážna – canonical, og:url, og:image, JSON-LD, sitemap a robots na adrese s 404 | **opravené** (`5d7bc23`) | `index.html:24` canonical `https://d8f5s88zjy-art.github.io/head-spa-30/barbershop-30/`, to isté og:url/og:image, JSON-LD url/image, `rezervacia.html:15`, `sitemap.xml:11, 24`, `robots.txt:10`. curl 27. 10.: `200 …/head-spa-30/barbershop-30/`, `200 …/sitemap.xml`, `200 …/robots.txt`, `200 …/assets/og.jpg`, stará `404 https://d8f5s88zjy-art.github.io/barbershop30/`. Doména: README „Nasadenie“ – jeden príkaz `sed -i 's#https://d8f5s88zjy-art.github.io/head-spa-30/barbershop-30/#https://www.barbershop30.sk/#g' index.html rezervacia.html 404.html robots.txt sitemap.xml` a potom `node source/tools/en-stranka.mjs`. Testy berú adresu z canonical: `en-test` 16 OK (`kanonická adresa en/ = základná adresa + en/`), `vychytavky-test` 27 OK (Pošli kamarátovi zdieľa `…/head-spa-30/barbershop-30/`) |
| **A3-03** vážna – zlá adresa pod Barbershopom ukázala 404 HEAD SPA 30 | **opravené** (`5d7bc23`) | nová `barbershop-30/404.html` (noindex, štýl webu, „Táto stránka tu nie je.“, Objednať sa → `https://www.barbershop30.sk/rezervacia` ako `index.html:128/197`, Zavolať 0951 267 203 → `tel:+421951267203` ako `index.html:198`, Späť na úvod); koreňový `404.html:14` pri ceste `/barbershop-30/` prepne na blok Barbershopu. `oprava-1/404-skuska.txt` (Chromium, náhrada GitHub Pages na porte 8900): 98 OK, „VŠETKO OK“ – `/head-spa-30/barbershop-30/neexistuje`, `/en/neexistuje`, `/assets/stara-fotka.jpg` → titulok Barbershopu, tel. 0951, nič z HEAD SPA; `/head-spa-30/neexistuje` a ďalšie cesty → HEAD SPA 30, obraz zhodný s pôvodným 404 (62709 B / 62709 B). Snímky som otvoril: `oprava-1/snimky/404-barbershop-tel.jpg`, `404-headspa-pc.jpg`, `barbershop-404-1280.jpg`. Kopírovanie: `pages.yml:34`, `nasad-barbershop30.sh:20` |
| **A3-04** stredná – `?lang=` v sitemap, hreflang na nekanonické adresy | **opravené** (`f26de28`) | `sitemap.xml` má 2 adresy (`/`, `/en/`) a hreflang sk, en, x-default; lastmod 2026-10-27. `oprava-1/a3-seo-krok2.txt`: `OK [sitemap-url] 2 adries: / /en/`, `OK [hreflang-vzajomnost] … 3 hreflang (sk, en, x-default)`, STREDNA 0 (pred: 7). Prepínač `?lang=` na webe ostal (`i18n-test` 55 OK) |
| **A3-05** stredná – TBT na telefóne 0,5–1,8 s | **neopravené** (zadanie: A3-05 nemeniť) | presun karty.css/i18n.css/atmosfera.css do style.css a odklad `offer()` je zásah do načítania celej stránky a súvisí s filmom (úloha 1,7–2,3 s pri overovaní grafiky – film.js, oprava škvŕn); ďalšie kolo |
| **A3-06** drobná – H2 bez „Služby a ceny“, „Rezervácia“… | **neopravené** | nie je lacné ani bez rizika: nadpisok vnútri `.kin` H2 by rozbil delenie po slovách (`assets/app.js:730–740`) a preklad po celých riadkoch (`app.js:742–745`, kľúč = pôvodný riadok, 8 slovníkov + `en-stranka.mjs`) a zmenil medzeru nadpisok–nadpis; ďalšie kolo s testom vzhľadu |
| **A3-07** drobná – JSON-LD bez @id, priceRange, geo | **čiastočne** (`37b23e1`) | `index.html:57` `"@id": "…/head-spa-30/barbershop-30/#barbershop"` (aj en/). priceRange nie: admin mení ceny v JSON-LD len pri položkách ponuky (`admin/admin.js:659–667`) a „3 € – 40 €“ by po zmene ceny ostalo staré. geo nie: súradnice nie sú overené (CHECKS 27). `a3-seo-po.txt`: `DROBNA [jsonld-odporucane] chýba … geo, priceRange` ostáva |
| **A3-08** drobná – og:type business.business, chýba og:locale:alternate | **opravené** (`37b23e1`) | `index.html:25` og:type website, `:27` og:locale:alternate en_GB; `en/index.html` en_GB + alternate sk_SK (`source/tools/en-stranka.mjs:100`, `en-stranka.mjs --check` „aktuálna“) |
| **A3-09** drobná – dve ikony, jedna data:URI | **opravené** (`37b23e1`) | `index.html:37`, `rezervacia.html:27`, `en/index.html` – jediná `rel="icon"` `assets/favicon.svg` (ten istý obrázok „30“ ako data:URI); `vychytavky-test` 27 OK (ikony a manifest) |
| **A3-10** drobná – `img src=""` v lightboxe | **opravené** (`37b23e1`) | `index.html:899` bez src; `app.js:595` nastaví src pri otvorení, `:620` ho pri zatvorení zmaže; `app-smoke`: `OK [desktop] lightbox sa otvorí assets/img/naradie-noznice-1600.jpg`, šípka, Esc (aj mobil) |
| **A3-11** drobná – robots.txt zakazuje /admin/ s noindex; platí len v koreni domény | **opravené** (`37b23e1`) | `robots.txt` bez `Disallow: /admin/` (admin má `noindex, nofollow`), komentár: súbor platí až na vlastnej doméne, dovtedy sitemap ručne v Search Console. `a3-seo-po.txt`: `robots-noindex` zmizlo; `robots-umiestnenie` (podpriečinok) ostáva ako informácia – opraví ho až doména |
| **A3-12** drobná – rezervácia bez twitter:card, rozmerov og:image; po zapnutí objednávky mimo sitemap | **opravené** (`37b23e1`) | `rezervacia.html:23–26` og:image:width 1200, height 630 (og.jpg 1200×630 overené Pillow), og:image:alt (text z index.html), twitter:card. `pages.yml:67`: po zapnutí objednávky pridá adresu z canonical rezervácie do sitemap.xml. Simulácia kroku: `oprava-1/pages-simulacia/vystup.txt` – zapnuté: 0× meta robots, 3 `<loc>` vrátane `rezervacia.html`, XML platné; vypnuté: noindex ostáva, 2 `<loc>` |
| **A3-13** drobná – malé ťukacie plochy v kontakte a pätičke | **opravené** (`0b6d074`) | `assets/style.css:1614–1616` (len do 720 px, neviditeľný `::after`, presah do polovice medzery k susedovi). `oprava-1/tuk-pred-390.txt` → `tuk-po-390.txt`: telefón 96×21 → 104×41, e‑mail 158×22 → 166×42, Instagram/Facebook/Navigovať/Vernostná kartička 23–24 → 35–36 px (rovnako 360 px). Vzhľad: `oprava-1/pred-po/porovnanie.txt` – kontakt a pätička 390/1280, úvod, en/ pätička: 0 rozdielnych bodov (rezervácia: šum ±1 úroveň jasu aj medzi dvoma behmi tej istej verzie, opakovanie 0). Otvoril som `pred-po/kontakt-390-po.jpg`, `pred-po/paticka-390-po.jpg`, `pred-po/rezervacia-1280-vyrez.jpg` |
| **A3-14** drobná – „8 rokov“ recepcie oproti roku 2019 | **neopravené** – čaká na majiteľa | OTAZKY-PRE-MAJITELA.md otázka 9; zmena textu bez potvrdenia by bola vymyslená |
| **A3-15** drobná – 945 recenzií zo 13. 10. | **neopravené** – čaká na majiteľa | otázka 18 (949 k 20. 10., súhlas s číslom); profil Google sa odtiaľto overiť nedá |

Súhrn auditu po opravách: `oprava-1/a3-seo-po.txt` – **VAZNA 0, STREDNA 0, DROBNA 6** (pred `a3-seo-pred.txt`: VAZNA 10 riadkov
= nálezy A3-01 až A3-03, STREDNA 7, DROBNA 20). Zvyšné drobné: karta/ a admin/ bez popisu a s krátkym titulkom (obe noindex, bez vplyvu),
geo + priceRange (vyššie), robots.txt v podpriečinku (vyrieši doména).

Naživo (`oprava-1/a3-seo-po-online.txt`): `/`, sitemap.xml, robots.txt, og.jpg → 200; **`…/barbershop-30/en/` → 404**
(VAZNA [nazivo]). Živý web je zo starej `main` (`origin/main` d2cf245 z 21. 10., jej pages.yml nemá krok `en-stranka`,
`git show origin/main:.github/workflows/pages.yml | grep -c en-stranka` → 0); en/ vytvorí až nasadenie tejto vetvy
(`pages.yml:68–69`). Bez nasadenia sa to opraviť nedá.

## Vlastné testy webu (konečný stav, `oprava-1/testy/`)

| test | výsledok |
|---|---|
| `en-test` | 16 OK, 0 FAIL |
| `vychytavky-test` | 27 OK, 0 FAIL |
| `i18n-test` | 55 OK, 0 FAIL |
| `app-smoke` | 108 OK, 1 FAIL `[softvér desktop] bez posunu rozloženia (CLS 0.0283)` – **rovnako na čistom 2687b6e** (`app-smoke-zaklad-2687b6e.txt`: 108 OK, ten istý FAIL 0.0283), nie je z týchto zmien; pozri nižšie |
| `koliesko-test` | 4 OK, 0 FAIL |
| `atmosfera-test` | 39 OK, 0 FAIL |
| `tma-test` | 52 OK, 0 FAIL („bez čiernej plochy“); hárky `snimky-tma/harok-mobile.jpg`, `harok-desktop.jpg` som otvoril |
| `admin-test` | 101 OK, 0 FAIL (v dočasnej kópii stromu s `asistent/`, `vernost/`, `CLAUDE.md` z gitu) |
| `objednavka-test` | 13 OK, 3 FAIL – **rovnako na 2687b6e** (`objednavka-test-zaklad-2687b6e.txt`, výsledky zhodné riadok po riadku). Príčina prostredia: `asistent/api.php:31` vyžaduje `vendor/autoload.php` (composer: symfony/http-client), tu nie je a inštalovať sa nesmie (`a=dni` → 503 „Rezervačný kalendár nie je pripojený.“) |
| `asistent-test` | nespustiteľný tu: `api.php:27` hlási `zapnute` len s `vendor/autoload.php` (curl `?a=stav` → `{"ok":true,"zapnute":false}`), tlačidlo sa preto neukáže; asistent sa týmito zmenami nemenil |
| `mobil-audit` | 360/390/430/768/1440 px: pretekanie 0 px všade; „tmavé“ snímky sú len pätička na konci stránky (otvoril som `mobil-audit/w390-23-24.jpg`) |
| `vaha` | do load bez filmu: desktop 240 kB, mobil 310 kB; `oprava-1/velkosti.txt`: index.html −218 B (gzip −159), rezervacia −96 B, style.css +405 B (gzip +123) |

Testy s pevnými portami mimo 8900–8909 (objednavka 8972–8974, asistent 8911–8914) bežali z kópie s portami
8905–8908; súbory v strome sa nemenili. Ostatné testy používajú voľný port systému (`source/shot.mjs:101`).

## Zaznamenané pre opravu čiernych škvŕn / ďalšie kolo (nemenil som)

- **CLS 0,0283 na počítači pri softvérovej grafike** (FAIL v app-smoke, už na 2687b6e): `oprava-1/cls-zdroj-swiftshader.txt`
  – jeden posun v 248 ms: `div.title-card.title-hero::before` 1148×874 na y=26 → 1148×900 na y=0 a menu 530 → 519 px;
  pri prvom behu s WebGL cez SwiftShader, bez WebGL (`cls-zdroj.txt`) 0,0001. Súvisí s prepnutím filmu (trieda `pro`
  zmizne, pribudne `world-frame world-off` – film.js), patrí oprave škvŕn.
- Čierne škvrny vo filme som v tma-test (26 záberov telefón, 26 počítač) nevidel. Na telefóne je spodná ~polovica
  každého záberu tmavý podklad pod fotkou (miesto pre text karty; stránka je v teste skrytá) – test ho neráta ako čiernu
  plochu (< 85 %), len zaznamenávam.
- Audity A1, A2, A4 nie sú dokončené (zadanie: ignorovať); ich rozpracované body (napr. A2-1 kontrast „Objednať sa“
  v hlavičke, A2-5 písmo po i18n.css) som neriešil.

## Nástroje tohto kola (`oprava-1/nastroje/`)

`404-skuska.cjs` + `pages-server.py` (náhrada GitHub Pages), `tuk-medzery.cjs` (ťukacie plochy a voľné miesto
k susedom), `pred-po-vzhlad.cjs` (výrezy pred/po a porovnanie po bodoch), `cls-zdroj.cjs` (pôvod posunu rozloženia),
`before-hladaj.cjs` (ktorý prvok má posúvajúci sa `::before`). Audit: `node ../nastroje/a3-seo.mjs <strom>/barbershop-30 --git [--online]`.
