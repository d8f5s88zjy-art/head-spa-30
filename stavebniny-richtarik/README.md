# Stavebniny Richtárik, nový web

Modernizovaná verzia webu www.stavebninyrichtarik.sk. Všetky údaje (adresa, telefóny, IČO,
otváracie hodiny, sortiment, značky, akcie, ceny, zľavy 5 % a 3,3 %) aj texty a obrázky
produktov sú prevzaté z pôvodnej stránky, nič nie je vymyslené.

## Čo web obsahuje
- Úvod s vyhľadávaním, akciami, katalógom, zľavami, službami, novinkami a kontaktom.
- Katalóg: 15 kategórií a všetky podstránky pôvodného webu (Pezinské tehelne, Porfix, Ytong,
  Blachotrapez, Tondach, Fakro, Schiedel, Baumit…), bočné menu s výberom kategórie.
- Akcie (15 akcií s letákom a PDF, cenník akcií z 28. 1. 2026), Novinky (8), Galéria (predajňa a sklad
  a 4 výstavy, lightbox), Služby, O nás, Kontakt, Akciový leták, stránka 404.
- Vyhľadávanie v celom katalógu bez ohľadu na diakritiku (`assets/index.json`).

## Ako sa web stavia
- Zdroj: `zdroj/pages.json` (obsah 83 stránok pôvodného webu) a `zdroj/obrazky.json`
  (rozmery obrázkov). Fotky produktov sú v `img/p/`, fotky z galérie v `img/g/` a `img/gt/`,
  PDF v `pdf/`, dokumenty Schiedel (.doc) a montážne video Onduvilla (MP4) v `subory/` – všetky súbory
  pôvodného webu sú na novom webe lokálne, odkazy sú relatívne.
- Generátor: `python3 build.py` (potrebuje lxml) prepíše všetky podstránky, `404.html`, `sitemap.xml`, `robots.txt`
  a `assets/index.json` (index hľadania). Úvod `index.html` negeneruje (časť Údržba).
  Texty na úvode, popisy kategórií a akcií sú v konštantách na začiatku `build.py`.
- `popisy.py` má popisky 48 značiek napísané len z pôvodného sortimentu; karta značky
  má fotku (z podstránky alebo z kategórie), logo, popisok, rozbaľovací celý sortiment
  a odkaz na podstránku. Produkty bez fotky dostanú značkovú dlaždicu.
- `obsah.py` rozloží HTML pôvodného webu na bloky (produkt s parametrami a PDF, nadpis,
  text, zoznam, obrázky, logá, tabuľka, značky, galéria) a vykreslí ich ako moderné
  komponenty: produktové karty, karty značiek, kroky s obrázkom, figúry s popiskom.
- Štýly a skripty: `assets/site.css`, `assets/site.js` (menu, objavovanie blokov a fotiek pri
  skrolovaní, paralaxa pásu na úvode, počítadlá, ukazovateľ prečítania, vyhľadávanie, zbalená päta na telefóne,
  lightbox s listovaním a popiskami). Úvod je film ovládaný skrolovaním (časť Úvodný film nižšie). Celý web je svetlý
  (papier, malta, betón, tmavý text, tehlová ako akcent): lišta, spodná lišta, menu, päta aj lightbox. Každá podstránka
  má svetlú hlavičku s ostrou fotkou v ráme (`HLAVICKA_FOTO` v `build.py`), skutočné fotky dvora pri tovare, ktorý
  ukazujú. Medzi stránkami je pokojný prechod (View Transitions: lišta stojí, stará stránka zmizne do papiera, potom
  nabehne nová; inde rovnaké zmiznutie triedou `leaving`).
- Predajné texty: hlavička každej kategórie má vlastnú vetu (`HOOKY` v `build.py`) len z faktov
  pôvodného webu (sklad, doprava, výpočet spotreby zadarmo, zľavy).
- `img/logo.png` je pôvodné logo firmy (na svetlom podklade, biele `logo-white.png` len nad filmom úvodu), fotky dvora
  a tovaru v `img/uvod/` sú od majiteľa, ilustračné fotky kategórií sú z Pexels (`img/FOTKY.md`), kým sa nenafotí ďalší
  tovar. Nová fotka sa uloží pod novým názvom (obrázky majú na hostingu cache na rok, časť Údržba).

## Úvodný film
Úvod (`index.html`, sekcia `.hero.film`) je záber z dronu: biele IVECO Stavebniny Richtárik s mechanickou rukou spomalí
na ulici, odbočí cez bránu do dvora plného paliet TermoBRIK a PORFIX a kamera ho nasleduje nízko do dvora. Film posúva
zákazník skrolovaním dopredu aj dozadu, sekcia sa na ten čas pripne (telefón 2,5 výšky obrazovky, počítač 2,8).
- Snímky: `img/film/<sada>-NN.avif` sú bloky po 8 snímkach (4 × 2 v jednom AVIF), `<sada>-k.avif` je každá 8. snímka
  v polovičnom rozlíšení (načíta sa prvá, film je hneď prechodný). Sady: `t960` (telefón na výšku s hustotou od 2,
  výrez 9 : 19,5 rovno zo 4K klipu), `t720` a `t540` (menšie telefóny, šetrenie dát), `p1920` a `p1280` (tablet
  a počítač, celý záber 16 : 9). 144 snímok z 10 s klipu, film z nich ukáže 118 (končí na snímke `koniec`).
- Prvý obraz `img/film/prvy-<sada>.avif|webp` je ostrý záber ulice (`start-ulica.png`) zarovnaný presne na prvú snímku
  klipu, do 150 kB; je to LCP (preload, fetchpriority high), bez JS a pri obmedzení pohybu ostáva sám a nič sa nepripína.
- Prehrávač je v `assets/site.js` (časť „úvod: film ovládaný skrolovaním“): jemný dobeh, prelínanie susedných snímok,
  sťahovanie, dekódovanie aj kreslenie v pracovnom vlákne (OffscreenCanvas; prehliadač bez neho kreslí na hlavnom
  vlákne), v pamäti len bloky okolo aktuálnej polohy, titulky z faktov webu. Po otočení telefónu kreslí staré kľúčové
  snímky, kým nie sú nové (nikdy čierna plocha); bez AVIF sa film vypne. Dva canvasy: pohyb (rozlíšenie podľa výkonu,
  bez grafického čipu stále 42 %) a nad ním pokojový, ktorý sa po 0,3 s pokoja raz nakreslí v rozlíšení displeja a pri
  pohybe sa len skryje. Na konci filmu sa nad canvas prelína ostrý posledný záber `img/film/posl-<sada>.avif`.
- Koniec filmu: ostrý posledný záber v plnom jase, úvod odchádza pomalšie než stránka a svetlý pás vyhľadávania
  so zaoblenými rohmi sa vysunie nad ňu (CSS `animation-timeline`, bez neho rovnaký posun zo `site.js`). Pásy pod
  úvodom (vyhľadávanie, Plná zásoba, fakty, značky) sú svetlé – žiadne tmavé pole v prechode.
- Telefón na výšku: nadpis a odsek hore, tlačidlá dole, auto medzi nimi; nízke obrazovky (pomer od 1 : 2) menší text
  a obraz posunutý (`--oy`), canvas použije ten istý posun. Text čitateľný bez tmavej plochy: tesný sivohnedý tieň písma,
  „Dovezieme.“ na tehlovom štítku, na nízkych obrazovkách sivohnedý (nie čierny) prechod hore.
- Obsah pod pásom Plná zásoba je počas filmu nevykreslený (`content-visibility: hidden`, trieda `skryte` na sekcii);
  sekcia sa odkryje, keď je 1,5 obrazovky od okna. Jej obrázky sa stiahnu počas filmu vopred (vlákno do vyrovnávacej
  pamäte, potom po jednom ako obrázok), nekonečné animácie bežia, len keď je sekcia blízko okna.
- Výroba: `zdroj/film.sh <zdroje> <pracovný priečinok>` (zdroje `klip-4k.mp4` alebo `klip-720.mp4` a `start-ulica.png`)
  vyrobí všetky súbory v `img/film/`, `img/uvod/og.jpg` a vloží údaje filmu (časy, ohniská) do `index.html`.
  Výpočty (výber snímok s rovnomerným pohybom, ohnisko auta) sú v `zdroj/film.mjs`, ostrý nápis na bočnici auta
  v snímkach 1–28 (sledovanie bočnice zo snímky 0) v `zdroj/napis.mjs`. Film končí na snímke `koniec` (h 408, ostrejšia
  než koniec klipu), ostrý posledný záber z nej vyrába krok 4c (`LEN_POSL=1` vyrobí len ten). Postup a merania:
  `OBNOVA-2026-10-27.md`.
- `build.py` úvod s filmom neprepíše: `write()` zápis do `index.html` odmietne a starý generovaný úvod vyrobí len
  `python3 build.py --stary-uvod` do `zdroj/uvod-stary.html` (na porovnanie textov).

## Údržba
- Prostredie: `python3 -m venv venv && venv/bin/pip install lxml`, potom v tomto priečinku `venv/bin/python build.py`.
  Beh vypíše `stránok v sitemap.xml: 74`, vynechané odkazy na súbory, ktoré na pôvodnom webe už neboli (497, 521),
  a `stránok: 76`. Riadok `POZOR` znamená, že `kontrola_uvodu()` v ručnom `index.html` nenašla položku menu alebo
  údaj firmy z `build.py` (`NAV`, `FIRMA`) – treba ho doplniť do úvodu ručne. Po behu `git diff --stat`: `index.html`
  sa nesmie zmeniť.
- Texty: akcie (`AKCIE_KARTY`, `ZLAVA_AKCIE`, `CENNIK_PDF`), hlavičky kategórií (`HOOKY`), sortiment zo zdroja
  (`PONUKA_UVOD`), novinky (`NOVINKY_POPIS`) a opravy preklepov a názvov značiek (`OPRAVY`) sú na začiatku `build.py`.
  Nový cenník akcií: PDF do `pdf/`, zmeniť `CENNIK_PDF`, `CENNIK_TEXT`, `CENNIK_LETAK` a dátum v `index.html` (sekcia
  Akcie).
- Úvod (`index.html`) sa mení ručne a len mimo filmu (texty, odkazy, karty akcií a noviniek, päta). Po zmene
  `index.html`, `site.css` alebo `site.js`: `node --check assets/site.js` a prejsť film (pripnutie, posun, titulky).
- Fotky úvodu `img/uvod/` sú hotové webové veľkosti fotiek majiteľa (originály má majiteľ). Novú fotku treba vyrobiť
  v tých istých šírkach a formátoch (AVIF aj WebP, ImageMagick, nikdy nezväčšovať): `dvor-predajna` 800, 1200;
  `pas-dvor` 1280, 1920; `pas-dvor-t` (výrez na výšku) 780, 1086, 1290; `zasoba-porfix`, `-rezivo`, `-stadreko`
  480, 720, 900; `zasoba-tehly` 480, 720, 856. Plné palety a tovar musia ostať v zábere. Pri rovnakom názve sa na
  hostingu prejaví až po vypršaní cache (rok), preto novú fotku radšej pod novým názvom.
- Fotky v hlavičkách podstránok: `HLAVICKA_FOTO` v `build.py` (stránka → `uvod:<názov>` skutočná fotka dvora,
  `p:<číslo>` fotka z pôvodného webu, `<názov>` ilustračná fotka kategórie z `img/hd`). Ilustračná fotka sa používa vo
  verzii 1200 px (`img/hd/<názov>-1200.webp`, ImageMagick, kvalita 80); pre novú ju treba vyrobiť rovnako. Rám má na
  počítači najviac 520 px, na telefóne celú šírku obsahu a výšku 230 px; fotka musí mať aspoň 1,6-násobok šírky rámu.
  Dlaždice kategórií (úvod aj Katalóg) skladá `dlazdice()`; skutočné fotky pri dlaždiciach sú v `DLAZDICA_UVOD`. Na
  úvode sa dlaždice menia ručne (vložiť výstup `dlazdice('index.html', cisla=True)`).
- Služby (`SLUZBY`), fotky dvora v galérii (`GALERIA_DVOR`) a pás faktov O nás (`FAKTY_ONAS`) sú v `build.py`; texty
  sú zo zdroja alebo z úvodu, nové treba overiť rovnako.
- Film: `zdroj/film.sh` ho vyrobí znova len zo zdrojov `klip-4k.mp4` (alebo `klip-720.mp4`) a `start-ulica.png`,
  ktoré nie sú v repozitári. Treba ich mať uložené mimo pracovného prostredia (u majiteľa, na disku alebo v cloude);
  bez nich sa film nedá zmeniť, len ponechať.
- Hosting: `python3 -I nasadenie/presmerovania.py . nasadenie` vyrobí znova `htaccess.txt`, `web.config.txt`
  a `presmerovania.tsv` (po pridaní PDF do `pdf/` alebo zmene stránok).

## Nasadenie
Náhľad beží na GitHub Pages v podpriečinku `stavebniny-richtarik/`. Ostrý web je v koreni domény
https://www.stavebninyrichtarik.sk/ (canonical, sitemap a og:image sú nastavené na túto adresu):

1. `venv/bin/python build.py` – vypíše `stránok v sitemap.xml: 74` a žiadne `POZOR`; `index.html` bez zmeny.
2. `bash nasadenie/balik.sh . <priečinok balíka>` – balík bez zdrojov a poznámok (`zdroj/`, `build.py`, `obsah.py`,
   `popisy.py`, `README.md`, `OBNOVA-*.md`, `img/FOTKY.md`, `nasadenie/`) a bez obrázkov, na ktoré nič neodkazuje;
   skript skontroluje lokálne odkazy a vyrobí aj zip. Na hosting sa nahrá **obsah** balíka do koreňa domény (FTP/SFTP).
3. Na hostingu: `nasadenie/htaccess.txt` ako `.htaccess` (Apache) alebo `nasadenie/web.config.txt` ako `web.config`
   (IIS) – 301 zo starých adries `.aspx` a `files/N.pdf`, vlastná 404. HTTPS (napr. Let's Encrypt) s presmerovaním
   `http → https` a adresy bez `www` na `www.`; ak HTTPS nebude, zmeniť `DOMENA` v `build.py` na `http://` a znova bod 1.
4. Hlavičky (sú v oboch súboroch): gzip a brotli pre HTML, CSS, JS, JSON a SVG; `Cache-Control: max-age=31536000,
   immutable` pre `img/`, `pdf/`, `subory/` a písma, `max-age=600` pre HTML, `site.css`, `site.js` a `index.json`
   (názvy bez verzie). Fotku pod rovnakým názvom zákazníci po výmene uvidia až po roku – meniť názov.
5. Po nahratí: Google Search Console – odoslať `sitemap.xml`, skontrolovať niekoľko starých adries (301) a jednu
   neexistujúcu (404).
