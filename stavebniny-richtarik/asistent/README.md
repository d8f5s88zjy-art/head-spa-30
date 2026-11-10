# Asistent na otázky (Stavebniny Richtárik)

Okno „AI asistent Stavebnín Richtárik“ na webe Stavebniny Richtárik, označené rovnako ako Barber na webe Barbershop 30
(štítok AI pri ikone aj v názve okna, podtitul, prvá správa, poznámka pod oknom a odkaz Ochrana údajov). Návštevník
napíše otázku alebo ťukne na častú otázku a odpoveď sa píše po kúskoch. Naostro odpovedá model Claude Opus 5.5
(oficiálna PHP knižnica Anthropic) len z overených údajov webu. Nezávislý od Barbershopu: vlastný server v tomto
priečinku, vlastná doména, vlastný kľúč a účet majiteľa.

| Časť | Kde |
| --- | --- |
| Okno na webe (ikona, bublina, témy a časté otázky, odkazy v odpovedi, rozhovor v karte prehliadača) | `assets/asistent.js`, `assets/asistent.css` |
| Časté otázky v prehliadači a hľadanie | `assets/asistent-otazky.js`, `assets/asistent-otazky.json` (kópia zdroja) |
| Ukážka bez servera (náhľad) | `assets/asistent-ukazka.js` |
| Zapnutie (atribút `data-asistent` na `<html>`) | `assets/site.js` (časť asistent, pred vyhľadávaním), `build.py` (šablóna), `index.html`, `nasadenie/balik.sh` |
| Úvod bez ikony | `assets/asistent.js` (`UVOD`): sekcia s nadpisom `#h-uvod`, `.hero` alebo `data-bez-asistenta` v `index.html` |
| Server: prúd odpovede, limity, kontrola vstupu | `api.php`, `lib/jadro.php` |
| Časté otázky na serveri (to isté hľadanie) | `lib/otazky.php` |
| Čo asistent vie (jediný zdroj faktov) | `znalosti/richtarik.md`, `znalosti/richtarik-otazky.json` (60 overených odpovedí) |
| Ochrana údajov (odkaz z okna aj z päty, `noindex`) | `ochrana-udajov.html` (návrh na schválenie majiteľom) |
| Apache / IIS (zvonku len `api.php` a `ochrana-udajov.html`) | `.htaccess`, `lib/.htaccess`, `data/.htaccess`, `znalosti/.htaccess`, `web.config` |
| Konfigurácia s kľúčom (mimo repozitára) | `config.example.php`, `nasadenie/asistent-config.php` |
| Testy a nástroje (do balíka nejdú) | `testy/spusti.sh` (server proti falošnému API, 27 kontrol), `nastroje/otazky_zdroj.py` (zdroj častých otázok), `nastroje/otazky.mjs` (fakty, štýl a hľadanie), `nastroje/caste.mjs` (zhoda so stránkou Časté otázky), `nastroje/prehliadac.mjs` (okno v prehliadači) |

## Režimy
- **Náhľad:** `data-asistent="ukazka"` na `<html>` všetkých stránok. Okno ukazuje vopred pripravené overené odpovede,
  podtitul „Ukážka – odpovede sú pripravené vopred z častých otázok.“ a pás ukážky. Nič sa nikam neposiela.
- **Ostrý web bez servera** (predvolené): `bash nasadenie/balik.sh . <výstup>` odstráni `data-asistent` aj odkaz
  Ochrana údajov z päty a do balíka nedá `asistent/` ani `assets/asistent*`. Okno sa neukáže, nič sa nesťahuje.
- **Ostrý web so serverom:** postup nižšie.
- Na skúšku: `?asistent=off` okno vypne, `?asistent=ukazka` ukáže ukážku, na localhost `?asistent=<adresa api.php>`
  skúšobný server.

## Zapnutie naostro
Podmienky (rozhoduje majiteľ s hostingom; dnešný server je IIS 10 s ASP.NET 2.0 a HTTPS na ňom nefunguje):
- PHP 8.1 alebo novšie (odporúčané 8.3) s rozšíreniami pdo_sqlite, curl, mbstring, openssl a json.
- HTTPS s platným certifikátom (otázky idú cez sieť; CORS je len pre `https://www.stavebninyrichtarik.sk`
  a `https://stavebninyrichtarik.sk`) a odchádzajúce HTTPS na api.anthropic.com.
- Zapisovateľný `asistent/data/` (SQLite s počítadlami limitov).
- Výstup bez vyrovnávania (Apache: `no-gzip` je v `.htaccess`; IIS FastCGI: `responseBufferLimit="0"` na obsluhe PHP
  nastaví hosting). Bez toho odpoveď príde naraz na konci, čo funguje, len pomalšie.
- Schválený text `ochrana-udajov.html` (majiteľ alebo zodpovedná osoba pre GDPR) a odstránený pás `.navrh`.
  `balik.sh` upozorní, keď tam pás ešte je.
- Účet na platform.claude.com na firmu a mesačný limit výdavkov nastavený v konzole.

Postup (na počítači správcu webu, nie na hostingu):
1. `ASISTENT_API=https://www.stavebninyrichtarik.sk/asistent/api.php bash nasadenie/balik.sh . <výstup>`
   (všetky stránky dostanú adresu servera; testy, nástroje, README, `config.php` a `vendor/` do balíka nejdú).
2. `composer install -d <výstup>/web/asistent --no-dev --prefer-dist --optimize-autoloader`
   (knižnica `anthropic-ai/sdk` ^0.61; na hostingu composer netreba).
3. Kľúč **len cez premennú prostredia `KLUC`**: `read -rs KLUC && export KLUC && php nasadenie/asistent-config.php >
   <výstup>/web/asistent/config.php; unset KLUC`. Kľúč nikdy nepatrí do repozitára (`config.php` je v `.gitignore`),
   do príkazového riadku s históriou, do e-mailu ani do správ. Majiteľ ho odovzdá správcovi osobne alebo cez
   správcu hesiel. Bez kľúča ostane asistent vypnutý (`api.php?a=stav` → `"zapnute":false`, okno sa neukáže).
4. Nahrať balík. Po nasadení skontrolovať:
   - `https://www.stavebninyrichtarik.sk/asistent/api.php?a=stav` vráti `{"ok":true,"zapnute":true}`,
   - `…/asistent/lib/jadro.php`, `…/asistent/znalosti/richtarik.md`, `…/asistent/config.php`, `…/asistent/data/`
     a `…/asistent/vendor/autoload.php` vrátia 403 alebo 404 (pravidlá `.htaccess` a `web.config` tu neboli
     overené na skutočnom Apache ani IIS),
   - 20 až 30 skúšobných otázok s kľúčom majiteľa: hodiny, adresa, cement, Blachotrapez, doprava do Bratislavy,
     vykládka, zákaznícka karta, sklad, „Ste človek?“, „Ktorý je najlacnejší komín?“ (bez superlatívu), otázka mimo
     témy, otázka v angličtine. Odpoveď nesmie mať cenu, ktorá nie je v znalostiach, ani sľub termínu, zľavy či vykládky
     zdarma.

## Limity a náklady
- Limity: 12 otázok za 10 minút a 40 za deň od jedného návštevníka (IP len ako odtlačok so soľou, po 24 h preč), 400
  otázok za deň spolu (strop nákladov). Mení sa v `config.php` (`za_10_min`, `za_den`, `spolu_za_den`), pri príprave
  aj premennou `SPOLU_ZA_DEN`.
- Odhad (cenník Claude Opus 5.5: vstup 4 $ a výstup 20 $ za milión tokenov, čítanie z vyrovnávacej pamäte 0,20 $):
  jedna otázka asi 0,01 až 0,015 $, prvá otázka po 5 minútach ticha asi 0,03 $. Pri 20 otázkach denne asi 5 až 10 $
  mesačne, v najhoršom prípade pri strope 400 otázok denne 4 až 12 $ za deň. Je to odhad, nie meranie; presné čísla
  ukáže konzola (`usage`) po zapnutí.
- Model `claude-opus-5-5`, úsilie `low`, záložný model servera (`fallbacks: "default"`, beta
  `server-side-fallback-2026-07-01`) pri odmietnutí, bez nástrojov, pokyny so znalosťami vo vyrovnávacej pamäti API.

## Ako to funguje
- Prehliadač pošle rozhovor (najviac 16 správ, otázka najviac 800 znakov) na `api.php?a=otazka`. Server pridá pokyny
  a znalosti a k poslednej otázke najviac 6 podobných overených odpovedí a posiela text ďalej ako `text/event-stream`.
- Rozhovory sa na serveri neukladajú ani nezapisujú do záznamov.
- Ceny len tie, ktoré sú v znalostiach (cenník akcií 28. 1. 2026), vždy s tým, že platnosť potvrdí predajňa. Nič
  nepočíta (cena, množstvo), skladovú zásobu, termín dovozu, vykládku zdarma ani zľavu navyše nesľubuje. Na otázku, kto
  odpovedá, povie pravdivo, že je AI asistent webu, nie človek. Vyká, bez superlatívov, „super cien“ a značky 8 t auta.

## Údržba znalostí (keď sa zmení akcia, cenník, hodiny, kontakt alebo stránky webu)
1. Upraviť `znalosti/richtarik.md` a odpovede v `nastroje/otazky_zdroj.py` (len fakty z webu, cenníka a pôvodného webu).
   Poznámky pre správcu do znalostí nepatria (model ich môže zákazníkovi zopakovať), píšu sa sem: miesto sa volá
   **predajňa**, nie dvor (majiteľ 9. 11. 2026) – v znalostiach ani v odpovediach sa slovo „dvor“ ako názov miesta nepoužíva.
2. `python3 -I asistent/nastroje/otazky_zdroj.py .` (v priečinku webu) zapíše `znalosti/richtarik-otazky.json`, kópiu
   `assets/asistent-otazky.json` a časť „Stránky webu“ v znalostiach podľa stránok, ktoré na webe sú (`doprava.html`,
   `caste-otazky.html` sa pridajú samy).
3. `node asistent/nastroje/otazky.mjs .` – fakty, štýl, odkazy a hľadanie. Povolený je len známy 1 FAIL
   („Kedy by ste mi to vedeli doviezť?“ má zhodu 0,57 pod prahom 0,6; v ukážke dá telefón, naostro odpovie model).
4. `node asistent/nastroje/caste.mjs .` – stránka Časté otázky a asistent musia mať rovnaké odpovede (100 %).
5. Server: `sh asistent/testy/spusti.sh` v kópii s `vendor/` (27 kontrol). Okno: `node asistent/nastroje/prehliadac.mjs
   <adresa webu> <priečinok snímok> [<adresa skúšobného api.php>]`.
