# Barbershop 30 – prejde rezervácia? Nezávislý audit (senior, rezervácia), 2. 11. 2026

Strom: `hs-skvrny` (vetva barbershop-skvrny), HEAD `791fb3db`, `git status` čistý (v strome som nič nemenil).
Všetko moje: tento priečinok (`nastroje/`, `snimky/`, `stiahnute/`, `kopia/` = súkromná kópia stromu na testy so serverom).
Porty: 9100 (statický server stromu), 9101–9104 (testy asistenta v kópii), 9105–9107 (objednavka-test v kópii),
9108 (CORS v kópii), 9109 (falošné API cez Playwright route, bez servera).

## Odpoveď majiteľovi jednou vetou

**Áno, rezervácia dnes prejde:** každé z 37 tlačidiel Objednať sa (aj v anglickej verzii, na rezervačnej stránke,
v Barberovi a na stránke 404) vedie na živý rezervačný systém `https://www.barbershop30.sk/rezervacia`. Ten som
prešiel na telefóne aj na počítači až po formulár s údajmi. Služby, ceny aj barberi sedia s webom na 100 %.
Pred prepnutím domény na nový web sú však 3 veci, ktoré by rezerváciu **rozbiť vedeli** (REZ-01, REZ-02, REZ-05)
a 1 vec, ktorá zákazníka zbytočne mätie (REZ-03).

## Ako som overoval (a čo som NEurobil)

- Živý systém: Playwright Chromium cez proxy, `nastroje/zive-prechod.mjs`. **Stráž** (`nastroje/spolocne.mjs`):
  z POST na barbershop30.sk pustí len čítacie metódy formulára `getEmployees`, `getCalendar`, `getTime` (tie posiela
  sám formulár pri klikaní); `makeOrder` a čokoľvek iné zruší ešte v prehliadači. Výsledok oboch prechodov:
  `"straz":{"povolene":["getEmployees","getCalendar","getTime"],"zrusene":[]}` – **makeOrder nikdy, žiadne meno,
  telefón ani e-mail som nevyplnil**. Analytiku podniku (Google) stráž blokuje, aby audit nekazil štatistiky
  (8 a 6 zrušených meraní; chyby `ERR_BLOCKED_BY_CLIENT` v konzole sú preto moje, nie ich).
- Okno objednávky a rezervacia.html: `nastroje/okno-hrany.mjs` (falošné API cez Playwright route, nič von),
  `nastroje/odkazy.mjs` (všetky odkazy), pôvodný `source/tools/objednavka-test.mjs` a `asistent/testy/spusti.sh`
  v **kópii** stromu so zástupnou knižnicou HTTP (`kopia/asistent/vendor/autoload.php`, curl), lebo v kontajneri nie je
  `asistent/vendor` a nič sa nesmie inštalovať.

## 1. Odkazy na rezerváciu (všetky stránky, telefón 390 × 844 aj počítač 1366 × 900)

`odkazy.log` (výňatok):

| Stránka | na barbershop30.sk/rezervacia | z toho s `data-sluzba` | Booqme | target / rel |
|---|---|---|---|---|
| index.html | 37 | 15 (cenník) | 2 (`/sk/rezervacia/barbershop30`) | všetky `_blank` + `noopener` |
| en/index.html | 37 | 15 | 2 (`/en/reservation/barbershop30`) | všetky `_blank` + `noopener` |
| rezervacia.html | 25 | 15 | 1 | všetky `_blank` + `noopener` |
| 404.html | 1 | – | – | bez `target` (rovnaká karta – na chybovej stránke v poriadku) |
| Barber (ukážka) | `Objednať sa` v hlavičke + odkazy v odpovediach | – | farbenie → Booqme | `_blank` + `noopener` |

- JSON-LD `potentialAction` = `ReserveAction` → `https://www.barbershop30.sk/rezervacia` (`index.html:83-86`).
- Kotva `#rezervacia` existuje na sk aj en. Žiadny odkaz nevedie inam (mimo Kalendára Google v „Pripomeň si ďalší
  strih“, ktorý v popise nesie adresu rezervácie – zámerne).
- Jazyky (`?lang=en/de/uk/hu/pl/cs/sr`): Booqme sa prepne do jazyka (sr → en), hlavná rezervácia dostane poznámku
  `title` „The booking page is in Slovak.“ a pod. – všetkých 7 jazykov OK.
- Ciele (curl, GET): `www.barbershop30.sk/rezervacia` **200** (25 882 B, title „Barbershop30“);
  Booqme sk/cs/hu/en/de/pl/uk **200**, každá s „Barbershop30 | Online rezervácia – Booqme“, Mostná 30, Nitra,
  +421 951 267 203 → **ten istý podnik**.
- Predvoľby: Objednať pri službe v cenníku vyberie službu (`a.price-cta[data-sluzba="18"]` → krok 2 „Pánsky strih
  a úprava brady“), Objednať sa pri barberovi ho vyberie (Adrian → po službe rovno deň), `rezervacia.html?sluzba=1&barber=Adrián`
  ide rovno na deň u Adriana (aj s diakritikou). **Pozor:** predvoľby fungujú len v našom okne; do živého systému sa
  neprenesú (REZ-02).

## 2. Živý rezervačný systém (telefón 390 × 844 aj počítač 1366 × 900)

`stiahnute/zive-pc.json`, `stiahnute/zive-telefon.json`, snímky `snimky/zive-*.png` (otvorené):

| Krok | Počítač | Telefón |
|---|---|---|
| Načítanie | 200, 3,9 s, bez pretekania (1366 = 1366) | 200, 5,7 s, bez pretekania (390 = 390) |
| 1. služba | Pánsky strih → Pokračovať v rezervácii | Vybrať → Pokračovať |
| 2. barber | Nezáleží + 10 barberov | to isté |
| 3. kalendár | Kristián: 2. 11. – 3. 12. 2026, nedele zatvorené, 25 voľných dní | Nezáleží: 32 voľných dní |
| 3. čas | 2. 11.: 18 začiatkov (10:00 – 14:15) | 2. 11.: 20 začiatkov (09:00 – 14:15) |
| 4. formulár | meno, priezvisko, e-mail, telefón, Pokračovať | to isté |

**Čo by zákazník musel vyplniť a čo by sa stalo:** meno, priezvisko, e-mail, telefón → Pokračovať → zhrnutie
(služby, pracovník, termín, možnosť Odstrániť / Pridať službu) → tlačidlo **„Rezervovať termín“** (`makeOrder`).
Podľa textov systému potom „Vaša rezervácia bola úspešná!“, e-mail s detailmi a deň vopred SMS
„…pripomenut Vas zajtrajsi rezervovany termin…“ (preklady komponentu v HTML, `stiahnute/rezervacia.html`).
Ďalej som nešiel.

**Konzola živej stránky (mimo mojej stráže):** 1 chyba `TypeError: Cannot read properties of null (reading 'hasOwnProperty') at $watch.immediate (js/app.js?ver=1:1:226676)`
na počítači aj telefóne + 2 varovania Google Maps. Prechod nezastaví (REZ-07).

**Služby a ceny – živý systém vs. web (15/15 zhoda):**

| id | Systém | Web (cenník) | Cena | Trvanie |
|---|---|---|---|---|
| 1 | Pánsky strih | Pánsky strih | 18 = 18 € | 40 = 40 min |
| 18 | Pánsky strih a Úprava brady | Pánsky strih a úprava brady | 28 = 28 € | 60 = 60 |
| 19 | Pánsky strih - dĺžka vlasov nad 10cm | Pánsky strih – dĺžka vlasov nad 10 cm | 22 = 22 € | 60 = 60 |
| 5 | Strih pre malých gentlemenov | Strih pre malých gentlemanov | 15 = 15 € | 45 = 45 |
| 2 | Oholenie hlavy | Oholenie hlavy | 13 = 13 € | 25 = 25 |
| 3 | Úprava brady | Úprava brady | 15 = 15 € | 20 = 20 |
| 4 | Holenie do hladka Hot Towel | Holenie do hladka Hot Towel | 15 = 15 € | 30 = 30 |
| 11 | Farbenie brady | Farbenie brady | 10 = 10 € | 30 = 30 |
| 14 | Balíček 1 | Balíček 1 | 30 = 30 € | 65 = 65 |
| 15 | Ultra inclusive Barbershop30 | Ultra inclusive Barbershop30 | 40 = 40 € | 80 = 80 |
| 6 | Starostlivosť o pleť PREMIUM | Starostlivosť o pleť PREMIUM | 21,5 = 21,50 € | 30 = 30 |
| 7 | Úprava obočia | Úprava obočia | 3 = 3 € | 5 = 5 |
| 8 | Depilácia uši a nosa voskom | Depilácia uší a nosa voskom | 5,5 = 5,50 € | 10 = 10 |
| 10 | Kreatívny ornament na hlave | Kreatívny ornament na hlave | 4 = 4 € | 10 = 10 |
| 12 | Farbenie obočia | Farbenie obočia | 5 = 5 € | 10 = 10 |

(Systém: `stiahnute/sluzby-zive.json` z `<v-order-component data=…>`; web: `price-name/price-time/price-amount/data-sluzba`
v `index.html`, rovnako v `rezervacia.html` a `en/index.html`, po 15 `data-sluzba`.) Názvy sa líšia len pravopisom.

**Barberi:** systém `Nezáleží, Kristián, Nikolas, Damian, Michal, Andy, Dominika, Kevin, Lajko, Jojo, Adrian`;
web `.team-name` = tých istých 10 (`index.html:333–468`). Zhoda 10/10.

**Booqme:** 14 služieb – len farbenie (na bielo/sivo/klasické/kreatívne), trvalá, tónovanie, prekrytie šedín,
poliózia, melír (45 – 80 €), Romana. Zodpovedá textu webu „Farbenie, melír a trvalú robí Romana. Rezervuješ ich
samostatne“ (`index.html:475`, `:631-634`) a znalostiam Barbera (`asistent/znalosti/barbershop.md:44`).

## 3. Okno objednávky a rezervacia.html (ukážka aj falošný systém)

- `okno-hrany.mjs`: **54 OK, 0 FAIL** (`okno-hrany.log`). Pokrýva: každý krok a Späť (4→3→2→1), Esc, Späť
  prehliadača zatvorí len okno, dvojklik na službu aj na čas (žiadny dvojitý krok ani dvojité bloky), výpadok
  `/terminy` (HTTP 500), stav `chyba` zo systému, **API neodpovie** (po 9 s poctivá chyba + Dokončiť + Zavolať,
  `snimky/hrany/6-casovy-limit-390.png`), stav API zlyhá → okno sa nezapne a tlačidlo otvorí rezervačný systém
  v novej karte, **pomalá sieť 3 s** („Pozerám do kalendára…“, `aria-busy`), rýchle preklikanie dní počas pomalej
  siete (ukáže časy posledného dňa), **nedele** zakázané, **sviatok** zakázaný, **dnes po zatváracej hodine
  + 2 prázdne dni** → okno samo preskočí na prvý deň s voľnom (aj cez sviatok), všetko plné → „V tento deň je už
  plno“, **časové pásmo** Los Angeles aj Auckland → prvý deň = dnes v Bratislave, nedele zakázané, **klávesnica**
  (Tab + Enter celou cestou, fokus neutečie z modálneho okna), **čítačka** (`aria-labelledby`, `aria-live`
  oznámi počet časov, `aria-pressed` pri dni, skupiny), neznáma služba a nebezpečné meno v `?barber=` → krok 1 bez chyby.
  Nič nešlo na rezervačný systém (stráž: žiadny `/rezervacia/ajax`, žiadny POST).
- `asistent/testy/spusti.sh` (kópia, porty 9101–9104): **kalendár 21 OK, 0 FAIL**; objednávkové časti servera
  8/8 OK (barberi, dni, časy bez mien zákazníkov, výpadok = chyba, neznáma služba/barber, 503 bez kalendára, cudzí
  pôvod odmietnutý, **makeOrder sa nikdy neodoslal**). 19 FAIL sú len otázky na AI – zástupná knižnica nemá
  klienta Anthropic (mimo tohto auditu).
- `objednavka-test.mjs` (kópia, port 9105–9107, falošný systém): pozri koniec zápisu („Beh objednavka-test“).
- Tvar požiadaviek nášho servera (`asistent/lib/kalendar.php`) som porovnal s tým, čo posiela ich prehliadač:
  barber ako objekt `{id, name, …, opening_hours, time_multiple}` ✓, dátum `{selectedDate: "2.11.2026"}` ✓,
  časy v skupinách `{"Dopoludnia":[…],"Popoludní":[…]}` → `array_walk_recursive` ich zoberie ✓, `limits`
  `"02.11.2026"` aj `disabled_dates` `"1.11.2026"` → `kal_datum` (`\d{1,2}`) ✓, `disabled_days` `["Ne"]` ✓.
  Jediný rozdiel: ich prehliadač posiela `services` ako celé objekty, náš server `[1]` (`kalendar.php:108,140,199`).
  Podľa `docs/CHECKS.md:602-610` to predchodca 25. 10. overil proti skutočnému systému (Kristián 28 časov);
  ja som to neoveroval, lebo vlastný POST mimo formulára by porušil pravidlo auditu.

## 4. Produkčná doména (CORS, cesty, tema-rezervacia.css)

- **CORS okna:** `api.php` v kópii (port 9108): `Origin https://www.barbershop30.sk` → 200 + `Access-Control-Allow-Origin:
  https://www.barbershop30.sk`; `https://barbershop30.sk` → 200 + ACAO; `http://www.barbershop30.sk` → **403**
  „Zakázaný pôvod.“; github.io → 200; raw.githack.com → 403. Okno volá GET s `credentials: 'omit'` (žiadny preflight).
  Na doméne s HTTPS teda čítanie kalendára prejde.
- **Ich server:** `www.barbershop30.sk/` je **Laravel** (cookie `laravel_session`, `XSRF-TOKEN`, `/index.html` 404,
  `/sitemap.xml` 404). Stránka `/rezervacia` načítava **relatívne** `css/app.css?ver=1`, `js/app.js?ver=1`,
  `js/plugins/*.js` (13 súborov), `js/vendor/*`, `images/demo/logo.png` – všetko 200 dnes. `/rezervacia/ajax` GET = 405
  (správne, len POST). `/rezervacia/` → **301 na http://** (zníženie na HTTP), `http://www.barbershop30.sk/rezervacia` → 200
  bez presmerovania na HTTPS a s `ajax-url="http://…/rezervacia/ajax"` (REZ-08).
- **tema-rezervacia.css:** na živej rezervácii nie je (0 výskytov v `stiahnute/rezervacia.html`); adresa z návodu
  `https://d8f5s88zjy-art.github.io/head-spa-30/barbershop-30/assets/tema-rezervacia.css` vracia **404**, rovnako
  `…/barbershop-30/rezervacia.html` – GitHub Pages beží zo staršieho `main` (`d2cf2450`), táto vetva nie je nasadená (REZ-05).

## Nálezy a návrhy

### REZ-01 – vážna (pri prepnutí domény): `/rezervacia` je ten istý Laravel ako dnešný web
- Dôkaz: hore v časti 4 (curl: `/` Laravel, `/index.html` 404; relatívne `css/`, `js/`, `images/`). README
  (`README.md:183-190`) hovorí „nový web do koreňa toho istého servera“ – ale koreň obsluhuje Laravel, nie priečinok.
- Riziko 1: ak sa nový web nahrá „namiesto“ starého (FTP prepíše/odstráni `public/css`, `public/js`, `public/images`
  alebo `index.php`), rezervácia ostane bez štýlu a skriptu = **nedá sa objednať**, alebo 404.
- Riziko 2: nový `rezervacia.html` v koreni domény. Pri Apache s `MultiViews` (alebo na GitHub Pages, ktoré
  servíruje `.html` bez prípony) by `/rezervacia` vrátil **našu statickú stránku** namiesto systému – a jej tlačidlá
  vedú späť na `/rezervacia` → slučka, rezervácia neprejde.
- Návrh: na doméne dať rezervačnú stránku na inú adresu (napr. `/objednavka/` alebo `/rezervacia-web.html`, plus
  `canonical`), alebo s hostingom písomne potvrdiť `MultiViews` vypnuté; nový web pridať do `public/` Laravelu tak,
  že `index.html` má prednosť pred `index.php` len pre `/` (DirectoryIndex), a súbory `public/css`, `public/js`,
  `public/images`, `public/fonts` a `index.php` ostanú. Po nasadení: `curl -s -o /dev/null -w '%{http_code}' …/rezervacia`
  = 200 **a** HTML obsahuje `v-order-component` (200 sám osebe nestačí – vrátil by ho aj náš statický súbor).

### REZ-02 – stredná (plynulosť): „Dokončiť v rezervačnom systéme“ zahodí celý výber
- Dôkaz: `objednavka.js:424` `href: REZERVACIA` bez parametrov; živý komponent nečíta URL (v `js/app.js` nie je
  `location.search` ani `URLSearchParams` mimo knižnice axios; `mounted` len `parseJson(e.data)`). Zákazník, ktorý
  na webe 2–4 kliknutiami vybral „Pánsky strih · Adrian · pondelok 2. novembra o 09:00“ (`snimky/hrany/4-krok4-390.png`),
  musí v systéme znova: službu, Pokračovať, barbera, deň, čas, 4 polia, Pokračovať, Rezervovať termín.
- Návrh (od najlacnejšieho): (a) v kroku 4 povedať pravdu „V rezervačnom systéme vyber znova: Pánsky strih → Adrian →
  2. 11. → 9:00“ (lístok ostáva v pôvodnej karte, odkaz ide do novej – to už je dobré); (b) požiadať správcu ich systému
  o podporu `?sluzba=1&barber=50&datum=2.11.2026&cas=09:00` v `mounted` (pár riadkov) a web ich doplní do odkazu;
  (c) so **písomným súhlasom prevádzky** dokončiť objednávku priamo v okne (`makeOrder` cez server) – až potom má
  okno zmysel na 100 %.

### REZ-03 – stredná (zavádzajúce): voľno barbera okno ukáže ako „zatvorené“
- Dôkaz: živý `getCalendar` pre Kristiána má 104 `disabled_dates`, pre „Nezáleží“ 34; **70 dní je len jeho voľno**
  (utorky 3., 10., 17., 24. 11. a väčšina decembra). `kalendar.php:143` ich dá do `sviatky`, `objednavka.js:344-346` ich
  označí `L.zatvorene` → v okne „Ut 3 zatvorené“, hoci prevádzka je otvorená. Test: voľno Adriana sa ukázalo ako
  `"piatok 6. novembra, zatvorené"` (`okno-hrany.log`, `snimky/hrany/3-krok3-390.png`).
- Návrh: v `objednavka_dni` vrátiť aj `volno` = dni barbera mínus dni „Nezáleží“ (pravidlá Nezáleží sú v pamäti
  1 h, jedna požiadavka navyše) a v okne pre ne text „nepracuje“ (8 jazykov) s tichým odkazom „Iný barber“.

### REZ-04 – drobná (vizuál): dvojklik v okne označí text oranžovým výberom
- Dôkaz: `snimky/hrany/2-krok2-390.png` („Alebo si vyber svojho barbera“, „30“, portrét celé oranžové),
  `3-krok3-390.png`, `4-krok4-390.png`. `objednavka.css` nemá `user-select` ani `touch-action`.
- Návrh: `.obj button, .obj-sluzby, .obj-tim, .obj-dni, .obj-mriezka { -webkit-user-select: none; user-select: none; }`
  a `.obj button { touch-action: manipulation; }` (bez oneskorenia ťuku a bez priblíženia dvojťukom).

### REZ-05 – stredná (pred spustením): štýl pre ich rezerváciu a rezervacia.html nie sú nikde nasadené
- Dôkaz: časť 4 (404 na github.io pre `tema-rezervacia.css` aj `rezervacia.html`, 0 výskytov na živej stránke).
  Návod `docs/TEMA_REZERVACIA.md:16` odkazuje práve na túto adresu; po prepnutí domény by sa mala zmeniť na doménu.
- Návrh: až po nasadení vetvy overiť 200 a až potom poslať správcovi riadok na vloženie; v návode uviesť adresu
  na doméne (alebo súbor rovno k nim do `public/css/`, nech nezávisí od GitHubu).

### REZ-06 – drobná (vizuál): oranžový rámik okolo nadpisu pri otvorení rezervacia.html s predvoľbou
- Dôkaz: `snimky/hrany/11-rezervacia-predvolba-390.png` („Kedy?“ v oranžovom rámiku hneď po načítaní). Príčina:
  `.obj-h { outline: none }` (`objednavka.css:41`, špecifickosť 0,1,0) prehrá s `.obj :focus-visible`
  (`objednavka.css:22`, 0,2,0); nadpis dostane fokus programovo (`vykresli(true)`), bez predošlého ťuknutia ho Chrome
  ukáže ako `:focus-visible`. Každý, kto príde z Instagramu cez `?sluzba=…`, to uvidí.
- Návrh: `.obj .obj-h:focus-visible { outline: none; }` (fokus pre čítačku ostane).

### REZ-07 – drobná (ich systém, poslať správcovi): chyby a prístupnosť živého formulára
- Chyba konzoly `TypeError … hasOwnProperty` (časť 2) na každom načítaní.
- `makeAjaxCall` pri chybe siete len `console.log` a `loaderDone()` sa nezavolá (`stiahnute/app.js`, metóda
  `makeAjaxCall`) → pri výpadku ostane navždy točiaci sa kruh, zákazník nevie, že má zavolať.
- Polia bez `<label>` (len placeholder), telefón `type="text"` (nie `tel`, telefón neukáže číselnú klávesnicu), pri
  formulári ani v zhrnutí nie je odkaz na spracúvanie osobných údajov (`form-dom-*.html`, šablóna `#summary`).
- Na telefóne medzi „priezvisko“ a „email“ veľká prázdna medzera (`snimky/zive-telefon-6-formular.png`).

### REZ-08 – stredná (bezpečnosť ich systému): rezervácia ide aj cez nešifrované HTTP
- Dôkaz: `curl http://www.barbershop30.sk/rezervacia` → 200 (bez presmerovania), `ajax-url="http://www.barbershop30.sk/rezervacia/ajax"`;
  `https://www.barbershop30.sk/rezervacia/` → **301 na `http://`**. Kto napíše adresu s lomkou, pošle meno, e-mail
  a telefón nešifrovane. Naše odkazy sú správne (`https`, bez lomky).
- Návrh pre hosting: presmerovanie HTTP → HTTPS na celej doméne a oprava presmerovania lomky na `https`.

### REZ-09 – informácia: okno objednávky na webe je naostro vypnuté (správne)
- `data-objednavka` pridá `pages.yml:74` len s premennou `ASISTENT_KALENDAR_URL` a FTP; dnes ho nemá `index.html:2`
  ani `rezervacia.html:2`, takže všetky tlačidlá idú rovno do systému (overené: stav API zlyhá → nová karta na systém).
  Okno je zatiaľ len ukážka `?objednavka=ukazka` (odkaz majiteľa na c8febb66: index.html, rezervacia.html,
  objednavka.js = 200 na raw.githack.com). Od c8febb66 sa v objednávke zmenilo len `objednavka.css` (nízke okno) a
  `rezervacia.html` (`<main tabindex="-1">`).

## 6. Čo presne treba spraviť, aby rezervácia z nového webu prešla naostro (pre majiteľa)

Dnes (web na GitHub Pages, tlačidlá → ich systém) **prechádza** – netreba nič. Pri spustení nového webu na
www.barbershop30.sk:

1. **S hostingom / správcom ich systému (Laravel):** potvrdiť, že `/rezervacia`, `/rezervacia/ajax` a súbory
   `css/`, `js/`, `images/`, `fonts/`, `index.php` ostanú; nový web pôjde len vedľa (REZ-01).
2. **Rozhodnúť adresu našej rezervačnej stránky** na doméne tak, aby nekolidovala s `/rezervacia` (REZ-01, riziko 2).
3. **Nasadiť vetvu** (dnes GitHub Pages ukazuje starší `main`) a overiť 200 pre `tema-rezervacia.css` a stránky (REZ-05).
4. **Prepnúť adresu** podľa README (`sed` + `node source/tools/en-stranka.mjs`), potom
   `curl -s https://www.barbershop30.sk/rezervacia | grep -c v-order-component` = 1.
5. **HTTPS všade** (REZ-08) – požiadať hosting.
6. **Prejsť rezerváciu naostro až po formulár** na telefóne a počítači (môj skript: `node nastroje/zive-prechod.mjs telefon`
   a `pc` – stráž nikdy nepustí makeOrder).
7. **Ak chce majiteľ okno v štýle webu** (nie je nutné): písomný súhlas prevádzky systému s čítaním voľných časov,
   premenná `ASISTENT_KALENDAR_URL` + FTP; pred tým opraviť REZ-03, REZ-04, REZ-06 a ideálne REZ-02 (b) alebo (c).
   Jedna kontrolná požiadavka `getEmployees` so `services:[1]` so súhlasom prevádzky (časť 3, rozdiel v tvare).
8. **Voliteľne poslať správcovi** REZ-07 (večný kruh pri výpadku, chyba konzoly, labely, typ tel, odkaz na ochranu údajov).

## Beh objednavka-test (kópia, falošný systém)

`node source/tools/objednavka-test.mjs --port=9105 --out=…/snimky/objednavka-test` v kópii, dvakrát
(`objednavka-test.log`, `objednavka-test2.log`): **54 OK, 0 FAIL** (okno na 360/390/430/768/1440 px: služba,
rýchla voľba, dve kliknutia od služby po výber času, deň a časy bez pretekania, výpadok, výber bez úspechu,
makeOrder nikdy), potom oba razy `page.screenshot: Timeout 30000ms` na riadku 238 (snímka `3-den-cas-1440.png`)
pri záťaži kontajnera 18–21 (`uptime`; súbežne beží ďalší audit) – film WebGL v softvérovom vykresľovaní nestihne
stabilný snímok. Časti testu za týmto miestom (vizitka/kartička pri 1440, rezervacia.html) neprebehli; rezervacia.html
s predvoľbou a s falošným API pokrýva `okno-hrany.mjs` (OK). Nepovažujem to za chybu webu, ale **neoverené týmto
testom** – zopakovať na pokojnom stroji.

## Upratanie

Server 9100 zastavený cez uložené PID (`server-9100.pid`), php servery testov zastavili samotné testy, server 9108
zastavený `kill` jeho PID. Strom `hs-skvrny` bez zmien (`git status --short` prázdny).
