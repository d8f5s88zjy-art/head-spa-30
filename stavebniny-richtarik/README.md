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
- Štýly a skripty: `assets/site.css`, `assets/site.js` (menu, vyhľadávanie, lightbox).
- `img/logo.png` je pôvodné logo firmy, ostatné veľké fotky sú z Pexels (`img/FOTKY.md`),
  kým sa nenafotí predajňa a sklad. Nová fotka sa uloží pod rovnakým názvom.

## Nasadenie
Obsah priečinka sa nahrá na hosting domény (koreň webu). Náhľad beží na GitHub Pages
v podpriečinku `stavebniny-richtarik/`.
