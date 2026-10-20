# Stavebniny Richtárik, nový web

Modernizovaná verzia webu www.stavebninyrichtarik.sk. Všetky údaje (adresa, telefóny, IČO,
otváracie hodiny, sortiment, značky, akcie, ceny, zľavy 5 % a 3,3 %) aj texty a obrázky
produktov sú prevzaté z pôvodnej stránky, nič nie je vymyslené.

## Čo web obsahuje
- Úvod s vyhľadávaním, akciami, katalógom, zľavami, službami, novinkami a kontaktom.
- Katalóg: 15 kategórií a všetky podstránky pôvodného webu (Pezinské tehelne, Porfix, Ytong,
  Blachotrapez, Tondach, Fakro, Schiedel, Baumit…), bočné menu s výberom kategórie.
- Akcie (15 akcií s letákom a PDF), Novinky (8), Galéria (4 albumy s lightboxom), Služby,
  O nás, Kontakt, Akciový leták.
- Vyhľadávanie v celom katalógu bez ohľadu na diakritiku (`assets/index.json`).

## Ako sa web stavia
- Zdroj: `zdroj/pages.json` (obsah 83 stránok pôvodného webu) a `zdroj/obrazky.json`
  (rozmery obrázkov). Fotky produktov sú v `img/p/`, fotky z galérie v `img/g/` a `img/gt/`,
  PDF v `pdf/`. Veľké letáky ostali odkazom na pôvodný web.
- Generátor: `python3 build.py` (potrebuje lxml) prepíše všetky HTML stránky.
  Texty na úvode, popisy kategórií a akcií sú v konštantách na začiatku `build.py`.
- `popisy.py` má popisky 48 značiek napísané len z pôvodného sortimentu; karta značky
  má fotku (z podstránky alebo z kategórie), logo, popisok, rozbaľovací celý sortiment
  a odkaz na podstránku. Produkty bez fotky dostanú značkovú dlaždicu.
- `obsah.py` rozloží HTML pôvodného webu na bloky (produkt s parametrami a PDF, nadpis,
  text, zoznam, obrázky, logá, tabuľka, značky, galéria) a vykreslí ich ako moderné
  komponenty: produktové karty, karty značiek, kroky s obrázkom, figúry s popiskom.
- Štýly a skripty: `assets/site.css`, `assets/site.js` (menu, objavovanie blokov a fotiek pri
  skrolovaní, paralaxa, počítadlá, ukazovateľ prečítania, náklon karty, vyhľadávanie,
  lightbox s listovaním a popiskami). Úvod na širokej obrazovke prehráva film `img/film/uvod*.mp4`
  v 720p, 1080p alebo 4K podľa obrazovky (na telefóne strieda fotky), každá podstránka má
  fotografickú hlavičku z ostrej fotky `img/hd/` (`head_img` v `build.py`). Fotky v dlaždiciach
  katalógu a v hlavičkách sa pomaly hýbu, karty sa nakláňajú za kurzorom, medzi stránkami je
  filmový prechod (View Transitions, inde jemné stiahnutie a nábeh).
- Predajné texty: hlavička každej kategórie má vlastnú vetu (`HOOKY` v `build.py`) len z faktov
  pôvodného webu (sklad, doprava, výpočet spotreby zadarmo, zľavy).
- `img/logo.png` je pôvodné logo firmy, ostatné veľké fotky sú z Pexels (`img/FOTKY.md`),
  kým sa nenafotí predajňa a sklad. Nová fotka sa uloží pod rovnakým názvom.

## Nasadenie
Obsah priečinka sa nahrá na hosting domény (koreň webu). Náhľad beží na GitHub Pages
v podpriečinku `stavebniny-richtarik/`.
