# Asistent na otázky pre Stavebniny Richtárik – diagnóza a návrh (4. 11. 2026)

Rola: diagnostik. V strome `hs-richtarik-obnova` som nič nemenil (`git status --short` prázdny, HEAD 4b2646bf).
Všetko je v tomto priečinku: návrh súborov v `navrh/`, overenie v `kontrola/`.

## 1. Zhrnutie
- Navrhujem samostatný server `stavebniny-richtarik/asistent/` podľa Barbershopu 30 (origin/barbershop-oprava 791fb3db),
  bez rezervačného kalendára a bez nástrojov: prúd odpovede, limity, strop nákladov, kľúč len v `config.php`, žiadne
  ukladanie rozhovorov, `.htaccess` aj `web.config` (dnešný hosting je IIS).
- Znalosti len z faktov webu a cenníka 662 (`znalosti/richtarik.md`), 60 overených častých otázok
  (`znalosti/richtarik-otazky.json`) pre ukážku aj ako podklad pre model.
- Okno v štýle Richtárika (papier, tehlová, Barlow), označené ako na Barbershope: štítok AI pri ikone aj pri mene,
  podnadpis „AI asistent Stavebnín Richtárik“, prvá správa, poznámka pod oknom, odkaz Ochrana údajov.
- Náhľad: ukážkový režim (`data-asistent="ukazka"`), nič sa neposiela. Ostrý web: bez adresy servera sa atribút
  pri balíku odstráni a okno sa neukáže.
- Overené: kontrola častých otázok 343 OK / 1 FAIL (známa hranica, bod 8), server proti falošnému API 27/27,
  okno v prehliadači 50/50 (telefón s CPU 4× aj počítač), upravený balík 0 chýbajúcich odkazov.
- Zapnutie naostro blokuje hosting: IIS 10 / ASP.NET 2.0, HTTPS nefunguje. Otázky pre majiteľa sú v bode 7.

## 2. Čo som naštudoval na Barbershope (origin/barbershop-oprava, len čítanie)
| Vec | Kde (git show origin/barbershop-oprava:…) |
| --- | --- |
| Stav `a=stav`, zapnuté = kľúč + vendor + PHP 8.1 | `asistent/api.php:27` |
| Prúd, `maxTokens` 4000, pokyny so znalosťami v cache, `effort` low, `fallbacks: "default"` | `asistent/api.php:92`, `:95`, `:101`, `:102` |
| Povolené pôvody (CORS) | `asistent/lib/jadro.php:10` |
| Limity 15/10 min, 60/deň, 1 500/deň spolu; IP ako HMAC odtlačok | `asistent/lib/jadro.php:77`, `:83`, `:85` |
| Rozhovory sa neukladajú; „AI asistent, nie človek“; ukážka | `asistent/README.md:37`, `:39`, `:75` |
| Zapnutie na webe `data-asistent`, načítanie pri geste alebo po 3,5 s | `barbershop-30/assets/app.js:405` |
| Nasadenie pridá `data-asistent` len s kľúčom, FTP a dostupnou stránkou ochrany údajov | `.github/workflows/pages.yml:66` |
| `config.php` z tajomstva pri nasadení | `.github/workflows/ftp.yml:59`, `tools/asistent-config.php` |
| Označenie v okne (štítok AI, pás ukážky „nepíše ich AI“) | `barbershop-30/assets/asistent.js:31` |
| Hľadanie častých otázok JS = PHP (Dice s váhami, kmene) | `barbershop-30/assets/asistent-otazky.js`, `asistent/lib/otazky.php` |

Prevzaté bez zmeny: hľadanie (kmene, váhy, zaokrúhlenie na 1e-6), limity v SQLite s WAL, kontrola rozhovoru (16 správ,
800 znakov), prúd s 2 kB úvodom proti proxy, správanie pri chybe a odmietnutí. Vynechané: kalendár, objednávkové
okno, nástroj `over_volne_terminy`, 8 jazykov, smerovač cenníka služieb (barbershopový), delenie kópie na 2 súbory
(60 otázok má gzip 7,7 kB, kmene sa počítajú v prehliadači).

## 3. Návrh súborov (`navrh/`)
```
stavebniny-richtarik/asistent/      → nový priečinok webu (server)
  api.php, lib/jadro.php, lib/otazky.php, .htaccess, lib/.htaccess, data/.htaccess, web.config, .gitignore,
  composer.json, config.example.php, ochrana-udajov.html, README.md,
  znalosti/richtarik.md, znalosti/richtarik-otazky.json, testy/spusti.sh, testy/mock-api.php
stavebniny-richtarik/assets/        → okno na webe
  asistent.js (23,6 kB, gzip 8,5 kB), asistent.css (11,8 kB), asistent-otazky.js, asistent-ukazka.js,
  asistent-otazky.json (kópia zdroja, gzip 7,7 kB)
stavebniny-richtarik/nasadenie/asistent-config.php   → config.php z premennej KLUC (mimo repozitára)
nastroje/ (→ stavebniny-richtarik/asistent/nastroje/): otazky_zdroj.py, otazky.mjs, prehliadac.mjs
zaplaty/: site.js-asistent.js (vložiť do site.js), balik.sh.diff, build.py.diff
```
Zapracovanie (pre implementátora):
1. Skopírovať `navrh/stavebniny-richtarik/*` do `stavebniny-richtarik/`, `navrh/nastroje/*` do `stavebniny-richtarik/asistent/nastroje/`.
2. `zaplaty/site.js-asistent.js` vložiť do `assets/site.js` PRED časť „// vyhľadávanie: index sa stiahne pri prvom
   písaní“ (v 4b2646bf riadok 907). Pozor: za ňou je `if (!q || !res) return;` (riadok 910); kód vložený na koniec
   súboru sa na stránkach bez vyhľadávania nespustí. Takto som to prvýkrát chybne vložil ja a kontrola
   v prehliadači ikonu nenašla (časový limit pri `.asi-btn.is-on`); po presune 50/50.
3. `build.py` riadok 585 `<html lang="sk">` → `<html lang="sk" data-asistent="ukazka">`, to isté ručne v `index.html`
   (build.py ho neprepisuje); v `kontrola_uvodu()` doplniť kontrolu atribútu.
4. `nasadenie/balik.sh` podľa `zaplaty/balik.sh.diff` (vyskúšané ako `kontrola/balik-upraveny.sh`, bod 6).
5. Nový úvod (film) ostáva na inej úlohe: okno skrýva ikonu, kým je v okne `.hero` alebo `[data-bez-asistenta]`.
   Ak nový úvod nebude mať triedu `.hero`, dať mu `data-bez-asistenta`.

## 4. Bezpečnosť a súkromie (rovnaké ako Barbershop)
- Kľúč len v `asistent/config.php` na serveri. Vyrobí ho `nasadenie/asistent-config.php` z premennej `KLUC`.
  Je v `.gitignore` aj v `.htaccess` / `web.config`. Prehliadač ho nikdy nedostane. Test „kľúč ide len do API, nie do
  odpovede“ OK. V návrhu nie je žiadny kľúč (grep `sk-ant-` s 8 a viac znakmi: nič).
- Zvonku dostupné len `api.php` a `ochrana-udajov.html`. Apache: `.htaccess` (F na `lib|data|znalosti|vendor|testy`,
  config, composer, README) a `Require all denied` v `lib/` a `data/`. IIS: `web.config` s `hiddenSegments` a
  `denyUrlSequences`. Na skutočnom Apache/IIS NEOVERENÉ (tu nie je ani jeden), preto je to v kontrole po nasadení (README).
- CORS len `https://www.stavebninyrichtarik.sk` a `https://stavebninyrichtarik.sk`, ďalšie pôvody len cez `config.php
  'povody'`. Cudzí pôvod vráti 403 (test OK).
- Limity: 12 otázok za 10 min a 40 za deň od návštevníka, 400 za deň spolu. Návštevník je HMAC odtlačok IP so soľou
  a po 24 h sa zmaže. V databáze nie je text otázky (test „databáza limitov: len odtlačky a časy“ OK).
  Rozhovor sa neukladá ani nezapisuje do logu (test „server nezapísal rozhovor do logu“ OK).
- Vstup: najviac 16 správ, otázka 800 znakov, spolu 16 000, len JSON a POST (testy 404/405/415 OK).

## 5. Znalosti, časté otázky, správanie
- `znalosti/richtarik.md`: firma, kontakt, hodiny, služby, doprava, platba, zľavy, 17 akcií s textom kariet zo stránky Akcie,
  novinky, 15 kategórií so značkami a odkazmi, stránky webu a zoznam toho, čo asistent nevie. Všetky odkazy ukazujú na
  existujúce súbory webu (24/24 OK pri tvorbe, ďalšie 2 doplnené po kontrole).
- Ceny: len tie, ktoré sú výslovne v znalostiach (cement 4,42/5,18 €, Blachotrapez 17 €/0,55/1,20/40 €, Delap 17,80 €/m²,
  kamene od 8,95 €, BIANKA od 22,80/31 €), vždy „cenník akcií 28. 1. 2026, platnosť potvrdí predajňa“. Nič nepočíta,
  nesčítava ani neprepočítava, množstvo materiálu nepočíta (ponúkne bezplatný výpočet spotreby). Ostatné ceny pošle na
  PDF 662 a na telefón (`lib/jadro.php` pokyny, časť Fakty).
- Bez superlatívov („najlacnejší komínový systém“ zo starej akcie asistent neopakuje). Bez odborných stavebných rád.
  Bez osobných údajov. Objednávky ani dopyty neprijíma.
- „Ste človek?“: pravdivo „som AI asistent webu …, teda automatický asistent, nie človek“ (pokyny aj častá otázka
  `asistent-clovek`, v prehliadači OK).
- Otvorené otázky majiteľa sa nemenia, asistent ich obchádza:
  - LIAZ / Iveco: hovorí len „autá 3,5 t a 8 t s mechanickou rukou“. Tonáž sedí na `index.html:100` aj `sluzby.html:49`.
  - Nero Ebono/Ebano: názov nepoužíva.
  - Zľava 5 % / 3,3 %: znenie ako dnešný web.
  - Staré akcie bez dátumu: pri akcii vždy „platnosť potvrdí predajňa“.
  - Hosting a HTTPS: bod 7.
  Kontrola `otazky.mjs` tieto slová v odpovediach zakazuje.
- Tón: vykanie (profesionálne pre stavebníkov a firmy). Dnešný web tyká („Zavolaj, poradíme hneď“). Ak tím textov
  ostane pri tykaní, treba zmeniť pokyny (`vykaj`) a 60 odpovedí.
- Okno: pod odpoveďou o cene, sklade, doprave či ponuke sú tlačidlá „Zavolať 0905 622 223“ a „Cenová ponuka“ (mailto
  ako na webe). Odkazy na www.stavebninyrichtarik.sk vedú v náhľade na náhľad (test: pdf/662.pdf a letak.html 200).

## 6. Overenie (príkazy a výstupy v `kontrola/`)
- `node navrh/nastroje/otazky.mjs navrh/stavebniny-richtarik` → `kontrola/otazky-kontrola.txt`: **343 OK, 1 FAIL**.
  - Každé číslo, odkaz a e-mail v 60 odpovediach je v znalostiach.
  - Všetkých 383 znení nájde svoju otázku.
  - Bežné otázky: 50/51 so zhodou aspoň 0,6. Jediná výnimka „Kedy by ste mi to vedeli doviezť?“ má zhodu 0,55
    (správna odpoveď, ale pod prahom). V ukážke sa preto ukáže „nemám, zavolajte“, naostro odpovie model. Ponechané
    zámerne, aby test nebol ušitý na mieru.
  - Mimo témy: 20/20 pod 0,6.
  - PHP a JS zoradia rovnako (131 otázok). Kópia pre web je zhodná so zdrojom.
- `sh asistent/testy/spusti.sh` (knižnica anthropic-ai/sdk v0.61.0 cez composer v dočasnej kópii, falošné API na
  127.0.0.1:9631) → `kontrola/server-testy.txt`: **27 OK, 0 FAIL**.
  - Stav s kľúčom aj bez neho.
  - CORS a 403.
  - Prúd po kúskoch.
  - Model `claude-opus-5-5`, úsilie low, fallbacks.
  - Bez tools.
  - Znalosti v cache, časté otázky mimo cache, kľúč nie v odpovedi.
  - Tlačidlo pri cene.
  - Validácia, chyba API s telefónom, odmietnutie, limit, databáza bez textu, log bez rozhovoru.
- `node navrh/nastroje/prehliadac.mjs` na kópii 4b2646bf so záplatami (server 127.0.0.1:9634) → `kontrola/prehliadac.txt`
  a `kontrola/snimky/vysledky.json`: **50 OK, 0 FAIL**.
  - Telefón 390×844 s CPU 4× a počítač 1440×900.
  - Ikona nad spodnou lištou (ikona dole 760 px, lišta hore 775 px).
  - Označenie okna, pás ukážky, ochrana údajov 200, svetlé okno aj svetlá clona.
  - Cena cementu, tlačidlá, mimo témy, odkazy v náhľade, „Si človek?“, Escape.
  - Bez chýb v konzole, `?asistent=off`, obmedzený pohyb bez animácie, bez JS nič navyše.
  - Na úvode `asistent.js` až 3,5 s po načítaní (načítanie 783 ms, modul 4282 ms; v inom behu 281/3781 ms), časté
    otázky sa pred otvorením okna nesťahujú.
  - Ikona skrytá, kým je úvod v okne.
- Snímky som otvoril nástrojom Read:
  - `kontrola/snimky/telefon-1-ikona.png`, `telefon-2-okno.png`, `telefon-3-cement.png`, `telefon-4-rozhovor.png`,
    `telefon-5-uvod-ikona.png`, `pocitac-4-rozhovor.png`.
  - Prvá verzia mala ikonu cez tlačidlo „Aktuálne akcie“ úvodu. Opravené skrytím nad úvodom.
  - Medzera pred bodkou za odkazom: opravené.
- Upravený balík (`kontrola/balik-upraveny.sh` na kópii) → `kontrola/balik.txt`:
  - Bez `ASISTENT_API` je 0 stránok s ukážkou a bez `data-asistent`.
  - S `ASISTENT_API` má `<html … data-asistent="https://www.stavebninyrichtarik.sk/asistent/api.php">`.
  - Testy, nástroje, README a config do balíka nejdú.
  - 6598 lokálnych odkazov, chýbajúcich 0.
- Výkon: modul sa nenačíta počas prvého obrazu (gesto alebo 3,5 s po `load`), CSS až s modulom. Prvá návšteva bez
  otvorenia okna stiahne asi 12 kB gzip (js + css), okno potom ďalších 7,7 kB. A/B meranie filmu som nerobil, lebo film
  sa mení v inej úlohe. Odporúčam ho po zapracovaní (CPU 4×, striedavo s `?asistent=off`).
- Servery som po sebe ukončil (na portoch 9630–9639 nič nebeží). Dočasné kópie webu, balíkov a vendor/ som zmazal.

## 7. Hosting a otázky pre majiteľa
Zistené (len GET):
- `curl -s -D - -o /dev/null http://www.stavebninyrichtarik.sk/sk.aspx` → `server: Microsoft-IIS/10.0`,
  `x-aspnet-version: 2.0.50727`, `x-powered-by: ASP.NET`.
- `https://www.stavebninyrichtarik.sk/sk.aspx` → `curl: (35) OpenSSL SSL_connect: SSL_ERROR_SYSCALL` (HTTPS nefunguje).
- `/index.php` → 404 (PHP tým nie je potvrdené ani vyvrátené).

Asistent naostro potrebuje:
1. PHP 8.1 alebo novšie (odporúčané 8.3) s rozšíreniami pdo_sqlite, curl, mbstring, openssl a json, plus composer
   knižnicu `anthropic-ai/sdk` ^0.61 (inštaluje sa pri balíku, na hostingu netreba composer).
2. HTTPS s platným certifikátom (otázky idú cez sieť) a odchádzajúce HTTPS na api.anthropic.com.
3. Zapisovateľný `asistent/data/` (SQLite s počítadlami limitov).
4. Výstup bez vyrovnávania. Na IIS FastCGI to je `responseBufferLimit="0"` na obsluhe PHP, čo na zdieľanom hostingu
   nastavuje hosting. Inak odpoveď príde naraz na konci, čo funguje, ale pomalšie.

**Otázky pre majiteľa:**
- (a) Ostáva web na dnešnom IIS hostingu, alebo sa sťahuje (napr. Apache/PHP hosting ako pri headspa30.sk)?
  Podporuje dnešný hosting PHP 8.x a vie nastaviť HTTPS (Let's Encrypt) a `responseBufferLimit`?
- (b) Chcete asistenta naostro? Ak áno, treba účet na platform.claude.com na firmu (platí sa za použitie), kľúč odovzdať
  správcovi webu bezpečne (nie e-mailom ani v správe) a nastaviť si mesačný limit výdavkov v konzole.
- (c) Súhlasíte so znením stránky Ochrana údajov (`asistent/ochrana-udajov.html`): prevádzkovateľ Ing. Mário Richtárik -
  Stavebniny, odovzdanie textu otázky spoločnosti Anthropic PBC (USA) ako sprostredkovateľovi? Odporúčam, aby to
  pozrel niekto, kto vám robí GDPR.
- (d) Tón: vykanie (návrh) alebo tykanie (dnešný web)?
- (e) Strop 400 otázok denne vyhovuje?

Kým nie sú odpovede, náhľad beží v ukážke a ostrý web je bez okna.

## 8. Náklady a limity (odhad, nie meranie)
Cenník modelu Claude Opus 5.5:
- vstup 4 $ za milión tokenov, výstup 20 $,
- čítanie z cache 0,20 $, zápis do cache 1,25× vstupu (5 $).

Veľkosti (zmerané `php -r` v `kontrola/server`):
- pokyny so znalosťami: 13 143 znakov, slovensky odhadom 4 000 až 5 000 tokenov (v cache),
- časté otázky k jednej otázke: 1 395 znakov, asi 500 tokenov mimo cache.

Odhad na jednu otázku:
- teplá cache: čítanie 0,001 $ + vstup mimo cache asi 0,004 $ + výstup pri úsilí low 200 až 500 tokenov
  (0,004 až 0,010 $), spolu **asi 0,01 až 0,015 $**,
- studená cache (prvá otázka po 5 minútach ticha): asi **0,03 $**.

Stropy:
- najhorší prípad pri dennom strope 400 otázok: 4 až 12 $ za deň,
- pri 20 otázkach denne: asi 5 až 10 $ za mesiac.

Presné čísla až z `usage` po zapnutí. Limity sa dajú zmeniť v `config.php` (`za_10_min`, `za_den`, `spolu_za_den`).

## 9. Riziká a čo ostáva
- `.htaccess` a `web.config` som neoveril na skutočnom serveri. Po nasadení treba skontrolovať 403/404 na
  `lib/`, `znalosti/` a `config.php` (README asistenta, Zapnutie, bod 4).
- Skutočný model som nevolal: bez kľúča a podľa pravidiel. Správanie modelu (ceny, superlatívy, „ste človek“) je dané
  pokynmi a overené len tým, že pokyny idú do API (test). Pred zapnutím odporúčam 20 až 30 skúšobných otázok
  s kľúčom majiteľa.
- Slovo AI sa v návrhu objavuje len pri označení asistenta: texty okna, pokyn modelu, ako sa má predstaviť, odpoveď
  `asistent-clovek`, stránka ochrany údajov a testy, ktoré toto označenie kontrolujú. Komentáre v `asistent.js:6`,
  `:143` a `asistent.css:3` hovoria o „štítku AI“. Ak to má byť prísnejšie, prepísať ich na „štítok označenia“.
- Ikona na telefóne zakrýva malý kúsok obsahu nad spodnou lištou, ako každé plávajúce tlačidlo. Na úvode je skrytá.
