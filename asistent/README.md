# AI asistent (Barbershop 30)

Okno „AI asistent“ na webe Barbershop 30 (zreteľne označené ako AI): návštevník napíše otázku a odpoveď sa píše hneď,
po kúskoch. Odpovedá model Claude Opus 5.5 (oficiálna PHP knižnica Anthropic) len z overených údajov webu, voľné termíny
overuje v rezervačnom kalendári (keď je napojenie povolené) a pri každej odpovedi o termíne ukáže Zavolať a potvrdiť termín.

| Časť | Kde |
| --- | --- |
| Okno na webe a na rezervačnej stránke (8 jazykov, odkazy v odpovedi, rozhovor v karte prehliadača) | `barbershop-30/assets/asistent.js`, `asistent.css`; načíta ho `app.js` (web) a `rezervacia.js` (rezervacia.html) |
| Zapnutie na webe (atribút `data-asistent` na `<html>`) | `barbershop-30/assets/app.js` časť 7b3, `.github/workflows/pages.yml` |
| Server: prúd odpovede, nástroj na termíny, limity, kontrola vstupu | `api.php`, `lib/jadro.php` |
| Voľné termíny z rezervačného systému (len čítanie voľných časov) | `lib/kalendar.php` |
| Čo asistent vie (jediný zdroj faktov) | `znalosti/barbershop.md` |
| Ochrana údajov (odkaz z okna) | `ochrana-udajov.html` |
| Nasadenie na hosting (knižnica, `config.php` z tajomstva) | `.github/workflows/ftp.yml`, `tools/ftp-balik.sh`, `tools/asistent-config.php` |
| Objednávkové okno na webe (barberi, dni, voľné časy; len čítanie) | `api.php` (`a=barberi`, `a=dni`, `a=terminy`), `lib/kalendar.php`, `barbershop-30/assets/objednavka.js` |
| Testy | `testy/spusti.sh` (server proti falošnému API a falošnému rezervačnému systému, 36 + 17 kontrol), `barbershop-30/source/tools/asistent-test.mjs` (okno v prehliadači), `barbershop-30/source/tools/objednavka-test.mjs` (objednávkové okno) |

## Zapnutie

V GitHube (Settings → Secrets and variables → Actions) musia byť:
- `ANTHROPIC_API_KEY`: kľúč API z https://platform.claude.com (účet majiteľa, platí sa za použitie),
- `FTP_SERVER`, `FTP_USER`, `FTP_PASSWORD` (a voliteľne `FTP_DIR`, `FTP_DOMENA`): hosting www.headspa30.sk.

Po ďalšom nahratí do `main` nasadenie nahrá asistenta na `https://www.headspa30.sk/asistent/` a web Barbershop 30
dostane `data-asistent`. Bez kľúča alebo FTP web nič nesťahuje ani neposiela a okno sa neukáže.
Kontrola naživo: `https://www.headspa30.sk/asistent/api.php?a=stav` vráti `"zapnute":true`.

## Ako to funguje

- Prehliadač pošle celý rozhovor (najviac 16 správ, otázka najviac 800 znakov) na `api.php?a=otazka`. Server pridá
  pokyny a znalosti (v cache API, ďalšie otázky sú lacnejšie a rýchlejšie), zavolá model s prúdom a posiela text
  ďalej ako `text/event-stream`. Kľúč API je len v `config.php` na serveri.
- Úsilie modelu `low` (rýchle krátke odpovede); v `config.php` sa dá dať `medium` alebo `high`. Pri odmietnutí
  modelom pomôže záložný model (`fallbacks: "default"`).
- Limity: 15 otázok za 10 minút a 60 za deň od jedného návštevníka (IP len ako odtlačok so soľou, po 24 h preč),
  1 500 otázok za deň spolu (strop nákladov). Rozhovory sa na serveri neukladajú.
- Asistent nerezervuje; posiela odkaz na rezervačný systém a telefón recepcie.
- Na otázku, kto odpovedá, povie pravdivo, že je Barber, AI asistent, nie človek.

## Časté otázky (776 overených odpovedí)

- `znalosti/barbershop-otazky.json`: otázka, iné znenia, odpoveď, téma, `tel` (pod odpoveď patrí Zavolať a Objednať sa).
  Len fakty z `barbershop.md` a webu; čo web neuvádza, odpoveď povie a dá telefón. Id `tim-meno` a `volno-meno` v téme
  tim sú len odpovede o členoch tímu (admin ich pri zmene tímu zmaže a vytvorí znova), iné otázky tímu majú `o-time-`.
- Server (`lib/otazky.php`) nájde k poslednej otázke najviac 6 podobných (zhoda aspoň 0,3) a pridá ich modelu do druhej
  časti pokynov, mimo cache: pokyny v cache sa nemenia a celý zoznam (776 otázok, asi 200 kB textu) sa neplatí pri
  každej otázke.
- Okno na webe ukazuje témy a otázky ťuknutím s odpoveďou hneď a bez servera (označená ako pripravená odpoveď). Kópia
  pre prehliadač sú dva súbory: `assets/asistent-otazky.json` (otázky a odpovede, pri prvom otvorení okna) a
  `assets/asistent-otazky-kmene.json` (kmene iných znení na hľadanie, hneď po ňom).
- Po každej úprave: `node barbershop-30/source/tools/otazky.mjs` (fakty proti cenníku, každá otázka nájde samu
  seba, server a prehliadač zoradia rovnako, kópia pre web v dvoch súboroch). Test servera: `testy/spusti.sh` (model
  dostal odpovede).

## Okno na webe: Barber

- Meno Barber (`MENO_ASISTENTA` v `lib/jadro.php` a texty okna v `barbershop-30/assets/asistent.js`), vždy so
  štítkom AI pri logu aj pri mene, podnadpisom „AI asistent Barbershopu 30“ a poznámkou pod oknom.
- Ikona vľavo dole je logo Barbershopu 30 (`barbershop-30/assets/img/logo-30-barbershop-160.webp`) v bielom kruhu,
  48 px (telefón 44 px), aby nebila do očí.
  Keď ju návštevník 8 s vidí (nie v úvode, pri menu ani pri ponuke jazyka), vyskočí nad ňou bublina so Spýtať sa
  a Zavolať; raz za návštevu, sama zmizne po 25 s, zavretá krížikom sa 14 dní neukáže (`localStorage`).
- Zavolať je stále v hlavičke okna (na úzkom telefóne ako slúchadlo), pod odpoveďami o termíne aj pri chybe.
  Skryť Barbera schová ikonu aj okno do konca návštevy (`sessionStorage`).
- Ukážka na kontrolu bez servera: `?asistent=ukazka` (web aj `rezervacia.html`). Odpovede sú vopred pripravené po
  slovensky z údajov webu (`barbershop-30/assets/asistent-ukazka.js`: cenník zo stránky, hodiny, adresa, tím),
  voľné termíny neoveruje ani nevymýšľa, čo nevie, posiela na telefón; pás v okne hovorí, že nepíše AI. Nič sa
  neposiela.

## Voľné termíny (rezervačný kalendár)

- Model má nástroj `over_volne_terminy` (barber, deň YYYY-MM-DD, služba). Server ho vykoná v `lib/kalendar.php`: to isté,
  čo vidí návštevník vo formulári na https://www.barbershop30.sk/rezervacia (zoznam barberov, pravidlá kalendára, voľné
  začiatky pre službu a barbera). Objednávku nikdy neodosiela; z odpovede berie len časy HH:MM.
- Stavy: `overene` (časy, čas overenia), `ziadny_volny`, `zatvorene` (nedeľa, sviatok), `mimo_rozsahu` (rezervácia
  ide mesiac dopredu), `minulost`, `neznamy_barber`, `nepripojene` (napojenie nie je zapnuté), `chyba` (výpadok, časový
  limit 6 s, zastarané údaje). Časy platia 2 minúty, potom sa overia znova. Časové pásmo Europe/Bratislava.
- Okno ukáže overené časy na karte priamo z výsledku kalendára (nie z textu modelu) s poznámkou „Predbežné, kým termín
  nepotvrdíš“ a pod ňou Zavolať a potvrdiť termín. Pri každej otázke alebo odpovedi o termíne pošle server udalosť
  `tel` a okno ukáže tlačidlá aj bez karty.
- **Zapnutie len so súhlasom prevádzky** (rezervačný systém spravuje Barbershop 30): v GitHube premenná repozitára
  `ASISTENT_KALENDAR_URL` = `https://www.barbershop30.sk/rezervacia` (Settings → Secrets and variables → Actions →
  Variables). Bez nej asistent na otázku o termíne povie, že dostupnosť teraz overiť nevie, a ponúkne telefón.
  Napojenie je overené len proti falošnému systému v testoch, nie proti živému (pozri CHECKS).

## Objednávkové okno na webe (služba → barber → deň → čas)

- Web Barbershop 30 (`barbershop-30/assets/objednavka.js`: okno na webe aj kroky na rezervačnej stránke
  `barbershop-30/rezervacia.html`) sa pýta servera bez kľúča API, len čítaním:
  `api.php?a=barberi&sluzba=1` (mená barberov), `a=dni&sluzba=1&barber=…` (rozsah, zatvorené dni, sviatky),
  `a=terminy&sluzba=1&barber=…&datum=YYYY-MM-DD` (to isté ako nástroj asistenta, `volne_terminy`). Odpoveď nikdy
  neobsahuje mená ani poznámky iných zákazníkov.
- Vlastný limit (`limit_ok('kalendar')`): 90 požiadaviek za 10 minút od návštevníka a 6 000 za deň spolu (`kal_za_10_min`,
  `kal_spolu_za_den` v `config.php`), časy aj tak 2 minúty z vyrovnávacej pamäte.
- Okno termín nerezervuje: na konci vedie do rezervačného systému alebo na telefón. Odoslanie objednávky z webu
  (`makeOrder`) tu nie je; potrebovalo by písomný súhlas prevádzky rezervačného systému a jej dokumentáciu rozhrania.
- Zapína sa spolu s kalendárom: premenná `ASISTENT_KALENDAR_URL` a FTP → nasadenie (pages.yml) pridá na web
  `data-objednavka`. Bez kalendára vráti server 503 a web ostane pri odkazoch do rezervačného systému.

## Keď sa zmení cenník, hodiny alebo tím

Zmeň `znalosti/barbershop.md` spolu s webom. Nič iné asistent nevie; čo v znalostiach nie je, odkáže na recepciu.

## Skúška na vlastnom počítači

```sh
cd asistent && composer install && sh testy/spusti.sh          # server, 17 kontrol
cd ../barbershop-30 && node source/tools/asistent-test.mjs      # okno v prehliadači so serverom a falošným API
```
Okno so skúšobným serverom: `index.html?asistent=http://127.0.0.1:8912/api.php` (len na localhost).
