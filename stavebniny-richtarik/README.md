# Stavebniny Richtárik, nový web

Modernizovaná verzia webu www.stavebninyrichtarik.sk. Všetky údaje (adresa, telefóny, IČO,
otváracie hodiny, sortiment, značky, akcie, ceny, zľavy 5 % a 3,3 %) aj texty a obrázky
produktov sú prevzaté z pôvodnej stránky, nič nie je vymyslené.

## Čo web obsahuje
- Úvod s vyhľadávaním, akciami, katalógom, zľavami, službami, novinkami a kontaktom.
- Katalóg: 15 kategórií a všetky podstránky pôvodného webu (Pezinské tehelne, Porfix, Ytong,
  Blachotrapez, Tondach, Fakro, Schiedel, Baumit…), bočné menu s výberom kategórie.
- Akcie (15 akcií s letákom a PDF; na 10 z nich ceny z cenníka akcií z 28. 1. 2026 v tabuľke), Novinky (8), Galéria
  (predajňa a sklad a 4 výstavy, lightbox), Služby, Doprava, Časté otázky, O nás, Kontakt, Akciový leták, stránka 404.
- Doprava (`doprava.html`): vlastné autá, doprava po celom Slovensku a podmienky dopravy pri akciách, len fakty
  z pôvodného webu a cenníka, fotka dvora (žiadne auto). Časté otázky (`caste-otazky.html`): 15 otázok, odpovede
  doslova z overenej databázy otázok predajne (časť Texty a SEO).
- Prehliadka predajne 360° priamo na stránke (úvod, sekcia Predajňa, a Kontakt): fotka predajne, po kliknutí otočná panoráma
  bez odkazu na Google (časť Prehliadka predajne 360°).
- Vyhľadávanie v celom katalógu bez ohľadu na diakritiku (`assets/index.json`).
- Asistent na otázky (okno vpravo dole, v náhľade ukážka z overených častých otázok, na ostrom webe len so serverom;
  časť Asistent na otázky a `asistent/README.md`).

## Ako sa web stavia
- Zdroj: `zdroj/pages.json` (obsah 83 stránok pôvodného webu) a `zdroj/obrazky.json`
  (rozmery obrázkov). Fotky produktov sú v `img/p/`, fotky z galérie v `img/g/` a `img/gt/`,
  PDF v `pdf/`, dokumenty Schiedel (.doc) a montážne video Onduvilla (MP4) v `subory/` – všetky súbory
  pôvodného webu sú na novom webe lokálne, odkazy sú relatívne.
- Generátor: `python3 build.py` (potrebuje lxml) prepíše všetky podstránky, `404.html`, `sitemap.xml`, `robots.txt`
  a `assets/index.json` (index hľadania). Úvod `index.html` negeneruje (časť Údržba).
  Texty podstránok, popisy kategórií a akcií sú v konštantách na začiatku `build.py`; úvod sa mení ručne.
- `popisy.py` má popisky 48 značiek napísané len z pôvodného sortimentu; karta značky
  má fotku (z podstránky alebo z kategórie), logo, popisok, rozbaľovací celý sortiment
  a odkaz na podstránku. Produkty bez fotky dostanú značkovú dlaždicu.
- `obsah.py` rozloží HTML pôvodného webu na bloky (produkt s parametrami a PDF, nadpis,
  text, zoznam, obrázky, logá, tabuľka, značky, galéria) a vykreslí ich ako moderné
  komponenty: produktové karty, karty značiek, kroky s obrázkom, figúry s popiskom.
- Štýly a skripty: `assets/site.css`, `assets/site.js` (menu, záloha objavovania blokov pri skrolovaní pre prehliadače
  bez časovej osi posunu, počítadlá, vyhľadávanie, zbalená päta na telefóne, lightbox s listovaním a popiskami, pás
  značiek s tlačidlom Zastaviť pohyb) a skript prechodov medzi stránkami v `<head>` (zdroj `zdroj/prechody.js`). Úvod je skutočná fotka dvora so strihom zásob (časť Úvod nižšie). Celý web je svetlý
  (papier, malta, betón, tmavý text, tehlová ako akcent): lišta, spodná lišta, menu, päta aj lightbox. Každá podstránka
  má svetlú hlavičku s ostrou fotkou v ráme (`HLAVICKA_FOTO` v `build.py`), skutočné fotky dvora pri tovare, ktorý
  ukazujú. Pohyb celého webu (prechody medzi stránkami, odhalenia pri posune, ovládacie prvky) je v časti Pohyb
  a prechody nižšie.
- Predajné texty: hlavička každej kategórie má vlastnú vetu (`HOOKY` v `build.py`) len z faktov
  pôvodného webu (sklad, doprava, výpočet spotreby zadarmo, zľavy).
- `texty.py`: nadpisy H1, titulky a popisy stránok pre vyhľadávače (`STRANKY`), záväzné názvy značiek
  (`NAZVY_ZNACIEK`), opisy obrázkov (`OBR_ALT`, `GALERIA_ALT`) a úprava písania v textoch zdroja (typografia,
  jednotky, verzálky, preklepy). Pravidlá sú v časti Texty a SEO.
- `img/logo-rs-360|720.png|webp` je nové logo RS od majiteľa (9. 11. 2026, vyčistené zo snímky obrazovky, originál si
  žiadame; staré `logo.png` a `logo-white.png` sú zo stromu preč), fotky predajne a tovaru v `img/predajna/` a `img/uvod/`
  sú od majiteľa, ilustračné fotky kategórií sú z Pexels (`img/FOTKY.md`), kým sa nenafotí ďalší tovar. Nová fotka sa uloží pod novým názvom (obrázky majú na hostingu cache na rok, časť Údržba).

## Téma podkladu: farebná (predvolená), svetlý papier a tmavá „čierno-biela“

Web má tri varianty podkladu z jedných komponentov cez tokeny v `assets/site.css`. **Predvolená je farebná téma**
(Lajo 10. 11. 2026: majiteľ chce farebný podklad podľa svojho nového loga s názvom a zákazníckej karty): atribút
`data-tema="farebna"` je priamo v `<html>` každej stránky (`build.py` konštanta `TEMA`, `index.html`,
`asistent/ochrana-udajov.html`), takže web je farebný aj bez JavaScriptu a nič sa neprekresľuje. Svetlý papier (bez
atribútu) a tmavá „čierno-biela“ (`data-tema="tmava"`) ostávajú len na porovnanie.

**Farebná téma** (časť „Farebná téma“ na konci `site.css`): farby loga – červená `#d73438` (zmeraná), antracit `#1c1a1b`,
biela. Stránka má teplý svetlý tón `#f6eee4` s bielymi kartami a červenými prvkami (katalóg, dlhé texty); sekcie sú scény
s lokálnymi tokenmi: **červená** (lišta ako pás loga s tmavou linkou hore a dole, hlavička podstránky, pás faktov, pás
Doprava, zľavy so zákazníckou kartou, výzva pred pätou, pás v päte, menu na telefóne) a **antracit** (pás značiek, akcie
a služby na úvode, kontakt, päta, spodná lišta). Biele ostrovy v scénach (karty akcií, vyhľadávanie) majú späť svetlé tokeny. Biele
písmo na červenej loga má 4,73 : 1, preto je na červenej vždy čisto biele (nikdy priesvitné), dlhý text je na svetlom tóne
alebo antracite, malé červené písmo je `#b92328` (svetlá scéna) alebo `#f28b7d` (antracit). Úvod je v duchu prvého návrhu:
fotka cez celú výšku, červený panel so šikmou antracitovou hranou, veľký biely názov STAVEBNINY RICHTÁRIK s antracitovým
obrysom a znakom RS, heslo a tlačidlá (rozloženie len cez CSS: `.uv` je mriežka, `.uv-a` a `.uv-b` `display:contents`);
strih zásob sa vo farebnej téme nepoužíva (`site.js`). Uvítanie má červené krídla s antracitovým pásom, znak RS a názov
živým písmom (`zdroj/uvitanie.*`, cesta `otvorF`: krídla sa rozídu rovno nad úvodom). Podklad prechodu medzi stránkami
(`::view-transition`) je po pásoch vo farbe scén novej stránky (`--scena`; skript `zdroj/prechody.js` ich pri `pagereveal`
zapíše ako `background-image` do malého `<style id="vt-pozadie">`, nie ako dedenú vlastnosť na `<html>`, tá by prepočítala
štýl celej stránky), aby červená hlavička ani antracitové pásy pri prelnutí nepreblikli nasvetlo. Pásy zhasnú, len čo ich
nová stránka zakryje (`@keyframes vt-podklad` v `site.css`, 330 ms; pri návrate na počítači ostávajú do konca, lebo tam
doznievajúci posun stránky nekryje spodná lišta) – inak sa kreslili pod stránkou až do konca prechodu a na telefóne
predlžovali jeho poslednú snímku. Výška lišty je token
`--lista-v` (88 px, do 980 px 84 px). Tlač je vždy svetlá (`@media screen`). Tokeny, kontrasty a merania:
`richtarik/majitel/farebna/TOKENY.md` a `ZAPIS.md`.

**Tmavá téma** (`html[data-tema="tmava"]`, časť „Tmavá téma“ v `site.css`): podklad noc `#121110`, pásy sekcií `#181614`,
karty `#1b1917`, písmo papierová biela `#f4f1ec`, akcent červená loga `#d73438` len vo veľkom písme, tlačidlách a grafike,
malé červené písmo je svetlejšia `#ef7a66` (AA). Roly v `:root` (svetlý papier): `--brick-txt` (malé červené písmo),
`--brick-hover` (tlačidlo pod myšou), `--povrch` a `--povrch-2` (karta a karta pod myšou), `--prgb` (RGB podkladu pre
priesvitné lišty a odznaky), `--irgb` (RGB písma pre jemné linky a latky brány). Asistent má pravidlá tém na konci
`assets/asistent.css`, `asistent/ochrana-udajov.html` vlastné tokeny.

Prepínanie: skript `zdroj/tema-head.js` (build.py `TEMA_HEAD`, v `index.html` ho vkladá `python3 -I zdroj/tema_vloz.py .`,
v `asistent/ochrana-udajov.html` značky `<!--tema-->`) beží v `<head>` pred štýlom: `?tema=svetla` odoberie atribút
(svetlý papier), `?tema=tmava` nastaví tmavú, oboje si zapamätá (`localStorage` `tema`), `?tema=farebna` voľbu zruší, bez
parametra platí zapamätaná voľba; prepne aj `theme-color` (farebná `#1c1a1b`, svetlá `#faf8f4`, tmavá `#121110`). Bez JS,
v ráme bez úložiska alebo so zakázaným úložiskom je web farebný (parameter v adrese funguje aj tam). Skript prechodov
v `index.html` po zmene `zdroj/prechody.js` obnoví `python3 -I zdroj/prechody_vloz.py .`. Prepínač v rozhraní nie je.
Zápis tmavej témy: `richtarik/majitel/tema/ZAPIS.md` a `TOKENY.md`.

## Úvod
**Farebná téma (predvolená od 10. 11. 2026) mení rozloženie úvodu a uvítania len cez CSS a jednu cestu v skripte uvítania;
popis nižšie platí pre svetlú a tmavú tému na porovnanie.** Vo farebnej téme: fotka (provizórne č. 11) vypĺňa celú výšku
prvej obrazovky, na počítači (od 981 px) vpravo od červeného panela so šikmou hranou, na telefóne a tablete hore nad ním
(v šírke okna ≈ 1 : 1 so zdrojom, nezväčšuje sa na celú výšku); v paneli znak RS, názov (telefón 59–86 px, počítač
96–138 px), heslo „Predajňa plná materiálu. Od základov po strechu.“ a tlačidlá Zavolať a Poslať dopyt, na počítači vpravo
dole antracitový panel s ponukou, odkazmi a vyhľadávaním. Strih zásob a tlačidlo Prehrať úvod sa nepoužívajú. Uvítanie:
červené krídla, znak RS a názov, krídla sa rozídu rovno nad hotovým úvodom (koniec ≈ 1,5 s od navigácie).

**Stav od 10. 11. 2026 (kolo majiteľa, platí pred staršími údajmi v tejto časti):**
- Hlavný obraz je fotka 11 od majiteľa (`img/predajna/11-tvarnice-porfix-cesta-*`, **provizórne**, kým majiteľ nepotvrdí
  „fotku číslo 5“). Počítač berie `-1290|1720`, telefón (do 700 px) tie isté široké súbory `-960|1290` s výrezom na palety
  (`object-position: 26% 55%` v ráme, `--x:.44` v uvítaní). Zvislý výrez 663 px sa už nepoužíva: v ráme ho prehliadač
  zväčšoval 1,76×, široký súbor sa v ráme 390 × 320 px pri DPR 3 zobrazí ≈ 1 : 1 (1 290 px na 1 257 bodov displeja).
- Nadpis H1 úvodu je značka: znak RS (`img/logo-rs-*`, ozdobný) a vedľa neho „Stavebniny / Richtárik“ v dvoch riadkoch
  s miestom „Nitra – Horné Krškany“ (`.h1-znacka`, `.h1-nazov`, `.h1-miesto`; veľkosti `--zh`, `--zn` v `site.css`:
  telefón 390 px znak 148 × 72 px a názov 35 px, počítač 1440 px znak 230 × 112 px a názov 58 px), pod ňou heslo
  „Predajňa plná materiálu. Od základov po strechu.“ (riadky `.ln`, 22 / 36 px). Majiteľ 9. 11. 2026: „úvodný názov
  Stavebniny Richtárik nech je väčším a s novým logom“. Pri výmene loga stačí vymeniť súbory `img/logo-rs-*`.
- Tempo: všetky časy scenára úvodu, strihu zásob a uvítania nižšie sú **pôvodné hodnoty; dnes platí ich 1,5-násobok**
  (majiteľ: pomalšie animácie; tabuľka v časti Pohyb a prechody). Odozva na ťuk sa nespomalila.

Úvod (`index.html`, sekcia `.uv`) je len zo skutočných fotiek dvora, bez videa a bez auta. Hlavný obraz je výrez fotky
dvora `u4` (palety tvárnic pod modrou oblohou): `img/uvod/dvor-p-1290|1720` na šírku (počítač, tablet) a
`img/uvod/dvor-t-1086|1448` na výšku (telefón), AVIF aj WebP. Je to LCP (`fetchpriority="high"`), viditeľný od prvej
snímky, pod ním svetlý náhľad 16 px. Pôvod fotiek je v `img/FOTKY.md`.
- Scenár (čas od začiatku načítania): 0–2,9 s fotka pomaly dosadne (zmenšenie z 1,09 na 1); 0,2–1,05 s sa hore a dole
  rozostúpia dva svetlé pásy papiera ako okno kina; 0,12–1,06 s vyjde nadpis po riadkoch z drážky
  („Stavebniny Nitra – Horné Krškany“ ako riadok nad nadpisom, „Dvor plný materiálu. Od základov po strechu.“);
  1,0–3,0 s dopadnú na dvor za sebou štyri skutočné zábery zásob (ležia rovno, na telefóne najviac 46 % výšky rámu
  vpravo hore) so štítkom ako na palete (Tehly TermoBRIK, Pórobetón
  Porfix – fotka bez dokreslených paliet, Dlažby a obrubníky Stadreko, Stavebné rezivo priamo na sklade); 3,32–3,84 s kôpka odíde
  doprava; 3,62–3,98 s sa vrazí štítok „Náš dvor · Novozámocká 62/68, Nitra“. Potom ostane statický koncový stav
  a vpravo hore tlačidlo „Prehrať úvod“. Celý čas je stály popis fotky „Skutočná fotka nášho dvora v Nitre“.
- Text, telefón, vyhľadávanie, katalóg a akcie fungujú od prvej snímky, nič sa neskrýva ani nečaká. Riadok s hodinami
  (počítač) zvýrazní dnešný deň (`data-dni`), bez textu „otvorené“. Pri odchode z úvodu ide fotka pomalšie než stránka
  (CSS `animation-timeline: view()`, nič sa nepripína a posun sa nezamyká).
- Kód: CSS je v časti „Úvod zo skutočných fotiek dvora“ na konci `assets/site.css` (aj spoločné krivky a dĺžky pohybu
  `--krivka-*`, `--dlzka-*` a záložné písmo s metrikami Barlow, aby výmena písma neposunula riadky), skript v
  `assets/site.js` (časť „úvod: strih zásob“) a trieda `uv-ide` zo skriptu v `<head>` úvodu. Animuje sa len
  `transform` a `opacity`.
- Strih sa nespustí bez JS, pri „obmedziť pohyb“, pri šetrení dát (`saveData`), druhýkrát v tej istej relácii
  (`sessionStorage` `uv-videne`) a keď zákazník už posúva. Sám sa nespustí ani po uvítaní (hook odovzdala brána) a keď
  stránka prišla prechodom alebo Späť/Vpred (trieda `vt`; vtedy sa nehrá ani vstup úvodu): ostane tlačidlo „Prehrať
  úvod“ a zábery sa stiahnu až po jeho stlačení. Odchod zo stránky bežiaci strih hneď dokončí. Preruší ho posun, koliesko, dotyk, kláves (okrem Tab)
  a fokus vo vyhľadávaní. Zábery sú v `<template id="uv-zabery">`, takže bez strihu sa vôbec nestiahnu.
- Výmena záberu: v `index.html` v `<template id="uv-zabery">` zmeniť cesty `img/uvod/zasoba-<názov>-480|720|900`
  a text štítku (`<b>` a `<span>`); nová fotka musí byť skutočná, bez pridaného či ubraného obsahu, v rovnakých
  šírkach a s rovnakou fotografickou úpravou (časť Údržba).
  Počet záberov je 4 (časovanie v CSS `.uv-mont .uv-z:nth-child(n)` a v skripte 830, 1580, 2250 ms; koniec strihu 4,53 s).
- Vypnutie strihu: zmazať `<template id="uv-zabery">` v `index.html` (ostane fotka, okno kina a nadpis). Vypnutie
  celého pohybu úvodu: zmazať v skripte v `<head>` `index.html` riadok s triedou `uv-ide`; úvod ostane statický.
- Poradie sťahovania: ten istý skript v `<head>` pridá triedu `uv-pocka`, kým sa nenačíta fotka dvora (najviac 4 s,
  pri posune hneď). Dovtedy sa fotky pásu „Na našom dvore v Nitre“ nesťahujú (`.uv-pocka .zas img{display:none}`,
  dlaždice majú pevný pomer strán, nič sa neposunie), aby na pomalej sieti nebrali pásmo hlavnej fotke. Bez JS sa
  sťahujú hneď.
- `build.py` úvod neprepíše: `write()` zápis do `index.html` odmietne. `kontrola_uvodu()` na konci behu overí menu
  a údaje firmy v úvode, jeden H1 so slovom „Stavebniny“, og obrázok dvora (`img/og-dvor.jpg`) na všetkých stránkach,
  že žiadny súbor neodkazuje na staré video s autom a že uvítanie v `index.html` sa zhoduje so zdrojom (nižšie).

### Uvítanie „Brána“ pred úvodom
Pri prvej návšteve zákazníka privíta svetlá brána z papiera s pozdravom „Nitra – Horné Krškany · od roku 1997“
a „Vitajte. Poďte ďalej.“. Krídla sa rozídu do strán (posuvná brána, bez otáčania), za nimi je celá skutočná fotka
dvora (tá istá ako v úvode) s odznakom „Skutočná fotka nášho dvora v Nitre“ a štítkami na paletách („Betónové
tvárnice · murovací materiál“, „Doprava na stavbu · po celom Slovensku“, na počítači aj „Betónové výrobky · na
paletách“). Fotka sa potom presne usadí do rámu úvodu, vyjde nadpis a ponuka a štítok „Náš dvor“ sa vrazí. Strih zásob
sa potom sám nespustí, ostane tlačidlo „Prehrať úvod“. Hlavička (logo, menu, telefón) a spodná lišta Zavolať / Cenová ponuka sú celý čas nad
bránou a fungujú. Texty sú len z overených faktov (rok 1997, adresa, doprava po celom Slovensku, sortiment).
- Scenár na telefóne (390 × 844, 4G, CPU 4×; F = prvé vykreslenie ≈ 0,8 s): F – F + 0,26 s pozdrav vyjde z drážky
  (každé krídlo nesie svoje slovo: na počítači „Vitajte.“ vľavo zarovnané k spáre a „Poďte ďalej.“ vpravo od spáry;
  na telefóne sa brána otvára zvisle, „Vitajte.“ je v hornom krídle nad vodorovnou spárou a „Poďte ďalej.“ v dolnom
  pod ňou, cez celú šírku, 17,5 vw), F + 0,26 – 0,66 s sa medzi slovami nakreslí tehlová spára; t0 = max(F + 0,38 s, fotka pripravená) ≈ 1,2 s krídla sa za 0,5 s rozídu (na telefóne hore a dole), kamera vojde na
  1,05; t0 + 0,15 s odznak; t0 + 0,10 / 0,15 s štítky (krúžok špendlíka sa raz rozvlní), zhasnú v t0 + 0,94 s;
  t0 + 0,60 – 1,12 s usadenie do rámu úvodu (len `transform`, bez posunu rozloženia), t0 + 0,74 / 0,80 s riadky H1,
  t0 + 0,80 s ponuka; t0 + 1,12 s prelnutie 90 ms a prekryv zmizne, pečiatka „Náš dvor“. Úvod je použiteľný ≈ 2,3 s.
  Počítač: F ≈ 0,15 s, t0 ≈ 0,55 s, usadenie t0 + 0,56 – 1,0 s (kratšia dráha), použiteľný ≈ 1,6 s. Ak t0 príde
  neskôr, časy od t0 sa skrátia koeficientom k (najviac na 0,72), aby bol úvod použiteľný do 2,45 s (od 10. 11. 2026 s tempom
  ×1,5: pozdrav drží 0,57 s, cieľ 3,7 s; namerané bez škrtenia: otvorenie 0,58 s po prvom vykreslení, usadenie +0,90 s
  telefón / +0,84 s počítač, koniec +1,78 / +1,73 s, spolu ≈ 2,5 s od navigácie; ťuk bránu ukončí do 0,2 s).
- Rýchla cesta: na pomalej sieti (prvé vykreslenie po 1,5 s) alebo keď fotka nie je včas pripravená, brána len
  pozdraví a otvorí sa rovno na úvod (0,44 s), keď je fotka úvodu vykreslená, najneskôr 0,7 s po prvom vykreslení.
- Kedy sa neukáže: druhá návšteva v tej istej relácii (`sessionStorage` `br-videne`), príchod z inej stránky webu,
  Späť, Vpred a obnovenie, kotva v adrese, šetrenie dát, predvykreslenie, okno menšie ako 300 × 420 px, „obmedziť
  pohyb“ a bez JS (prekryv je v HTML ako prvý prvok `<body>`, bez triedy `br-ide` je skrytý a skript ho odstráni;
  fotka je tá istá ako v úvode, nič navyše sa nestiahne). Vtedy beží dnešný úvod (trieda `uv-ide`).
  `?uvitanie` v adrese ho vynúti aj pri ďalšej návšteve (nie pri „obmedziť pohyb“), napr. na ukážku majiteľovi.
- Preskočenie: ťuk, klik, koliesko, kláves (aj Tab), posun, zmena šírky okna alebo skrytie karty. Úvod je hneď
  v konečnom stave a brána sa prelne za 0,16 s; ťuk na bránu nič pod ňou nestlačí, ťuk na Zavolať v lište alebo na
  telefón v hlavičke sa normálne vykoná. Po preskočení sa strih zásob nespustí (tlačidlo „Prehrať úvod“ ostane).
- Asistent na otázky, odložená práca `site.js` (odhalenia, pás značiek…) a tlačidlo „Prehrať úvod“ čakajú na koniec
  uvítania (udalosť `br-koniec`).
- Prístupnosť a SEO: prekryv má `aria-hidden`, vnútro je `inert` (žiadny fokus, mimo čítačky), samotný prekryv
  zachytí ťuk (inert vrstva by ťuk pustila na odkaz pod ňou). Prvý nadpis v strome je nezmenené H1, obsah úvodu je
  v HTML od začiatku. Pri tlači sa prekryv nezobrazí a úvod je v konečnom stave.
- Poistky: CSS skryje prekryv 4,8 s po prvom vykreslení, aj keby skript zlyhal; skript ho odstráni najneskôr po 9 s
  (pred tempom ×1,5 to bolo 3,2 s a 6 s).
- Názov firmy v bráne (KF-11): do 1023 px je vedľa znaku v dvoch riadkoch a zmestí sa od 320 px (znak `min(86px, 22vw)`,
  písmo `min(34px, 8.4vw)`), od 1024 px v jednom riadku; meranie `majitel/oprava/nastroje/snim.mjs` (pravý okraj názvu ≤ krídlo).
- Kód: zdroje sú v `zdroj/uvitanie-head.js` (rozhodnutie v `<head>`), `zdroj/uvitanie.css`, `zdroj/uvitanie.html`
  (prekryv) a `zdroj/uvitanie.js` (riadenie, WAAPI). `build.py:uvitanie_bloky()` ich zmenší na 4 bloky v `index.html`
  (štýl a rozhodnutie v `<head>` pred skriptom `uv-ide`, prekryv ako prvý prvok `<body>`, aby bol pozdrav v prvom
  vykreslení, skript za hlavičkou a menu tesne pred `<main>`).
  Po zmene zdroja: `python3 -I zdroj/uvitanie_vloz.py .` (bloky v `index.html` nahradí) a `python3 build.py`
  („kontrola úvodu: OK … uvítanie zo zdroja 1×“; kontrola overí aj `aria-hidden`, `inert`, žiadny nadpis, odkaz,
  výkričník ani štítok označenia asistenta v prekryve, jeho skrytie bez `br-ide` a žiadne `rotate`, `perspective` ani
  `clip-path`). `assets/site.js` čaká na udalosť `br-koniec` (`{preskocene, rychlo, t}`).
- Vypnutie: v `zdroj/uvitanie-head.js` `VYP = 1` a vložiť bloky (`uvitanie_vloz.py`), alebo zmazať 4 bloky
  z `index.html` (`<style>` začínajúci `.br{`, skript s `br-ide` v `<head>`, `<div class="br" …>` za `<body>` a skript pred `<main>`)
  a z podmienky skriptu `uv-ide` časť `&&!h.classList.contains("br-ide")`, potom upraviť `kontrola_uvodu()`.
- Výmena fotky dvora: uvítanie používa ten istý `<picture>` ako úvod (rovnaké `srcset` a `sizes`), pri inom výreze
  treba v prekryve skontrolovať polohy špendlíkov štítkov (`data-tel`, `data-pc` = poloha v pomere k fotke) a pomer
  strán v `zdroj/uvitanie.css` (`.br-scena`, `--a`).
- Test: `richtarik/dokoncenie/nastroje/uvitanie-zf.mjs kontroly` (preskočenie, relácia, obmedziť pohyb, bez JS, kotva,
  šetrenie dát, iframe, tlač, Späť, šírky 320 – 1920, odovzdanie do rámu, štítky, krídla) a `… vykon` (A/B meranie).

## Pohyb a prechody
**Tempo ×1,5 (10. 11. 2026, majiteľ: pomalšie animácie).** Všetko, čo je predstavenie, má 1,5-násobok pôvodnej dĺžky aj
oneskorenia; odozva na dotyk a myš ostala. Časy uvedené ďalej v tejto časti a v časti Úvod sú pôvodné (×1,0), dnešné sú:

| premenná alebo prvok | pôvodne | dnes |
|---|---|---|
| `--dlzka-dnu` / `--dlzka-dnu-op` (nová stránka) | 360 / 160 ms | 540 / 240 ms |
| `--dlzka-von` / `--dlzka-von-op` (stará stránka) | 180 / 120 ms | 270 / 180 ms |
| `--vt-odstup`, `--vt-odstup-op` | 60 ms | 90 ms |
| `--dlzka-let` (zdieľaná fotka, nadpis, štítok) | 440 ms | 660 ms |
| `--dlzka-strih` / `--dlzka-strih-spat` | 500 / 420 ms | 750 / 630 ms |
| `--dlzka-menu` (opona menu pri prechode) | 360 ms | 540 ms |
| `--dlzka-vstup` (hlavička podstránky) | 620 ms | 930 ms |
| `--dlzka-odh` / `--dlzka-odh-op` (odhalenie pri posune) | 620 / 520 ms | 930 / 780 ms |
| `--dlzka-riadok`, `--dlzka-stredna`, `--krok-cas` | 800, 360, 70 ms | 1 200, 540, 105 ms |
| riadok nadpisu sekcie z drážky, H1 po prechode na telefóne | 560, 440 ms | 840, 660 ms |
| úvod: okno kina, kamera, strih zásob | 0,85 s, 2,9 s, 3,0 s | 1,28 s, 4,35 s, 4,5 s |
| uvítanie Brána (od prvého vykreslenia po koniec) | ≈ 1,6 s | ≈ 2,4 s (`zdroj/uvitanie.js`, `M = 1.5`) |
| **bez zmeny (odozva):** `--dlzka-tlak` 80 ms, `--dlzka-pusti` 160 ms, `--dlzka-hover` 240 ms, `--dlzka-kratka` 180 ms, lightbox, otvorenie menu 300 ms, výsledky hľadania, okno asistenta 360 ms, preskočenie uvítania, rýchla cesta uvítania 440 ms | | |

Prechod stránky tým trvá 0,75–0,8 s (namerané úvod → katalóg 770–795 ms, predtým 560–650 ms); ťuk, klik alebo kláves ho
stále ukončí hneď. Obsah na pohyb nečaká: konečný stav je HTML a CSS, „obmedziť pohyb“ a prehliadač bez JS ho vidia hneď.
Zmeniť tempo: hodnoty v `:root` (`site.css`, časť Pohybový systém, pôvodná hodnota je v komentári pri každej premennej),
časy úvodu v časti „pohyb úvodu“ a v `site.js` (strih zásob), konštanta `M` v `zdroj/uvitanie.js` a časy v `zdroj/uvitanie.css`
(potom `python3 -I zdroj/uvitanie_vloz.py .` a build).

Jeden pohybový jazyk pre celý web. CSS je v časti „Pohybový systém celého webu“ na konci `assets/site.css` (premenné
dĺžok a kriviek `--dlzka-*`, `--krivka-*`), skript prechodov v `zdroj/prechody.js`. Úplný katalóg (prvok, spúšťač,
trvanie, krivka, rozpočet, správanie pri „obmedziť pohyb“) je v `richtarik/profi/zf/POHYB.md`. Zásady: animuje sa len
`transform`, `translate`, `scale` a `opacity`; nič sa nepripína a posun sa nezamyká; plochy pri prechodoch sú papier
alebo fotka, nikdy tmavá clona; text v okne je po odhalení plne viditeľný (aj v pokoji po posune); bez JS, pri „obmedziť pohyb“ a v prehliadači
bez podpory je všetko hneď v konečnom stave; bez otáčania a poskakovania.

**Uvítanie pred úvodom** (len `index.html`, prvá návšteva v relácii zvonka; podrobne v časti Úvod): pozdrav vyjde
z drážky, každé krídlo svoje slovo (`--krivka-vyjazd`, 0,26 s, spára medzi slovami až potom), krídla brány sa rozídu do strán (`--krivka-clona`, 0,5 s), kamera
vojde na 1,05 (`--krivka-kamera`), štítky vyjdú (`--krivka-vyjazd`, 0,26 s), fotka sa usadí do rámu úvodu (0,52 s,
13 kľúčových snímok ease in-out, len `transform`), prelnutie 90 ms do papiera úvodu, pečiatka „Náš dvor“
(`--krivka-pecat`, jediný prekmit), preskočenie `--dlzka-pusti`. Rozpočet: 0 dlhých snímok počas pohybu brány,
scenár sa vytvorí pozastavený vopred v nečinnom čase a v snímke otvorenia sa len spustí (do 2 ms pri CPU 4×).
Pri „obmedziť pohyb“, bez JS, pri tlači a šetrení dát neexistuje.

**Prechody medzi stránkami** (View Transitions medzi dokumentmi, `@view-transition{navigation:auto}`). Typ určí skript
v `<head>` pri odchode zo stránky (`pageswap`) a odovzdá ho novej stránke (`pagereveal`, `sessionStorage`):
- `dalej` – bežný odkaz a Vpred: postupné odídenie a príchod (priehľadnosť a posun sú oddelené). Stará stránka
  lineárne zmizne za 0–120 ms (posun 8 px hore za 180 ms), nová sa lineárne objaví za 60–220 ms (posun 24 px zdola
  60–420 ms). Texty oboch strán nikdy nie sú spolu nad 0,21 a ich súčet nikdy pod 0,37, lišta stojí: nie je dvojitá
  expozícia ani prázdny papier. Na telefóne potom H1 vyjde z drážky (200–640 ms) a odsek pod ním nasleduje.
- `spat` – Späť v histórii, drobčeky a odkaz Späť: rovnako, smer je opačný.
- `strih` – hlavné menu, menu na telefóne, päta, spodná lišta a tlačidlá úvodu: nová stránka za 0,5 s vyjde zdola ako
  list papiera cez starú, stará len mierne ustúpi (nestmavne, nezmenší sa).
- `strih-spat` – Späť zo stránky, na ktorú sa prišlo strihom (aj z menu): zrkadlo strihu, list za 0,42 s odíde nadol
  a predošlá stránka sa vráti zo svojho ústupu. Vpred strih zopakuje. Typ príchodu si skript pamätá pri každej položke
  histórie (`sessionStorage` `vt:<kľúč>`).
- **zdieľaná fotka** (`foto`): ťuk na dlaždicu katalógu, pásu zásob alebo novinky. Fotka dlaždice za 0,44 s preletí
  a zväčší sa na fotku hlavičky stránky (okno mení veľkosť a orezáva). Pri Späť sa fotka hlavičky zmenší späť do dlaždice
  a dlaždica sa ukáže až na konci letu. Ak je v hlavičke iná fotka ako na dlaždici, počas letu sa prelínajú (typ
  `prelnutie`). Zdieľa sa len prvok, z ktorého je medzi hornou a spodnou lištou viditeľných aspoň 60 % (inak by
  vzlietol spod lišty); inak ide čistý `dalej` alebo `spat`. Od 701 px letí pri dlaždici katalógu aj názov a stane sa
  nadpisom H1 (`nadpis`, len rovnaký text v jednom riadku, letí pod fotkou); odsek pod H1 sa objaví až v posledných
  18 % letu, keď nadpis dosadá. Karta značky v kategórii (tlačidlo Podrobnosti) pošle svoju fotku do hlavičky značky
  (s prelnutím) a od 701 px štítok karty akcie („Špeciálne zľavy“, „Akciová cena“…) letí do štítku na stránke akcie
  (`stitok`, len posun a zmena veľkosti, bez prekmitu); pri Späť opačne. Na telefóne (do 700 px) názov ani štítok
  neletia: H1 vyjde z drážky a štítok akcie dopadne na mieste pečiatkou. Prechod z otvoreného menu na telefóne (typ
  `zmenu`) je jeden pohyb: panel odíde za 0,36 s doprava ako opona a pod ním už stojí nová stránka aj s lištou.
  Na počítači prejde podčiarknutie aktívnej položky menu k novej položke (`ciara`). Lišta a spodná lišta stoja.
  Ikona asistenta (`asi`) sa s obsahom nehýbe: na mieste zmizne za čas odchodu starej stránky a na novej sa ukáže až
  s lenivo načítaným modulom; pri Späť z vyrovnávacej pamäte len stojí. Stránka `asistent/ochrana-udajov.html` má
  vlastný štýl, ale tie isté typy prechodov a dĺžky (skript jej obnovuje `build.py`, funkcia `ochrana_prechody`).
- Prechod sa nespustí pri obnovení stránky a pri „obmedziť pohyb“. Ťuknutie alebo kláves počas prechodu ho hneď ukončí.
  Nenačítaná fotka sa nezdieľa (letela by ako prázdny rám), vtedy len odíde a príde so stránkou.
- Cieľ dlaždice sa začne pripravovať pri dotyku (Speculation Rules `prerender`, `eagerness: conservative`, len `.html`
  toho istého webu, nikdy PDF, `subory/`, `mailto:` ani `tel:`), aby bola fotka hlavičky pri prechode hotová.
- Bez podpory: Firefox (prechody medzi dokumentmi zatiaľ nemá) a staršie prehliadače majú okamžitú navigáciu bez čakania
  (záloha s 200 ms zatmievaním je zrušená). Chrome a Edge od 126 a Safari od 18.2 prechody majú; **Safari na iPhone
  treba po nasadení overiť na skutočnom zariadení** (WebKit sa tu testovať nedal).
- Skript je v každej stránke práve raz (`build.py:prechody_head()` ho zmenší zo `zdroj/prechody.js`, v `index.html`
  je vložený ručne a `kontrola_uvodu()` overí zhodu). Po zmene `zdroj/prechody.js` treba spustiť `build.py` a nový blok
  (výstup `prechody_head()`) vložiť do `<head>` úvodu namiesto starého.

**Vstup hlavičky podstránky** (len s JS, keď stránka prišla bez prechodu: priamy odkaz, obnovenie, prehliadač bez
prechodov): H1 vyjde zdola, nakreslí sa linka nadpisku, odsek ide za ním a fotka hlavičky sa otvorí ako okno kina
(pásy malty sa stiahnu k okrajom) a dosadne. Keď stránka prišla prechodom (trieda `vt` na `<html>` zo skriptu
v `<head>`), vstup sa nespustí a hýbe sa len prechod: vstup počas prechodu na počítači bez grafickej karty zdvojnásobil
dlhé snímky.

**Odhalenia pri posune.** Texty, karty a štítky sa odhalia spúšťaným odhalením s časom (`site.js`, IntersectionObserver):
nadpisok, nadpis, odsek a tlačidlo sekcie vyjdú 18 px zdola za sebou (70 ms, najviac 4 kroky), karty v mriežke podľa
stĺpca, štítok akcie dopadne ako pečiatka, číslo služby vyjde zľava; priehľadnosť dobehne za 520 ms, posun za 620 ms,
takže po zastavení posunu je všetko v okne plne viditeľné (aj spodný okraj okna sa odhalí po 180 ms pokoja). Čo je pri
načítaní v okne, sa nehýbe. Fotky sa otvoria ako okno kina (pásy papiera `scaleY`, nie `clip-path`) a dosadnú a fotka
pásu Doprava ide pomalšie než stránka – tie sú viazané na posun (CSS `animation-timeline: view()`, kompozítor; bez
podpory stoja). Odhalenia sú len pre obrazovku (`@media screen`), pri tlači je všetko viditeľné (`tlac-zf.mjs`).
Práca, ktorá nemusí byť v prvej snímke (odhalenia, popisy lightboxu, pás značiek, služby), sa spustí až po prechode
stránky alebo v nečinnom čase (`poPrechode` v `site.js`).

**Ovládacie prvky:** stlačenie tlačidiel (0,97) a dlaždíc (0,985) za 80 ms, odozva pod myšou len na zariadení s myšou
(šípka v páse názvu dlaždice, zdvih štítkov, podčiarknutie menu), krúžok fokusu 3 px, menu na telefóne s položkami
za sebou, výsledky hľadania sa vysunú (na telefóne sa pole pri fokuse posunie pod lištu, výsledky sú nad spodnou lištou
a ikona asistenta sa skryje), lightbox ukáže fotku až dekódovanú, prenesie ju z náhľadu (popisok po lete) a pri
zatvorení ju vráti; stránku pod ním nezamyká cez `overflow`. Bublina asistenta sa ukáže až po 1,5 s pokoja posunu. Pás značiek zastaví
myš, fokus aj tlačidlo „Zastaviť pohyb“; bez JS a pri „obmedziť pohyb“ je to statický zoznam, ktorý sa dá posúvať.

**Ako vypnúť:**
- prechody medzi stránkami: v `site.css` `@view-transition{navigation:auto}` → `navigation:none`,
- zdieľané prvky a strih (ľahká verzia pre všetkých): v `zdroj/prechody.js` nahradiť `lahke = ss.getItem(L) > 1` za `lahke = 1`, `build.py`
  a blok `prechody_head()` vložiť do `index.html`,
- odhalenia textov pri posune: v `site.js` zmazať `poPrechode(odhalenia)`; odhalenia fotiek: zmazať blok
  `@supports (animation-timeline:view())` v časti 4B Pohybového systému (obsah ostane viditeľný),
- vstup hlavičky podstránky: zmazať blok `@media` v časti 3 Pohybového systému,
- uvítanie pred úvodom: `VYP = 1` v `zdroj/uvitanie-head.js` a `python3 -I zdroj/uvitanie_vloz.py .` (časť Úvod),
- celý pohyb pre jedného návštevníka: nastavenie systému „obmedziť pohyb“.

**Telefón aj počítač** majú rovnaký jazyk (let fotky, nadpisu a štítku aj strih). Záloha: keď prechod na zariadení
seká (aspoň 2 snímky nad 50 ms po prvých 100 ms animácie) a stane sa to v relácii dvakrát, ďalšie prechody idú v ľahkej
verzii bez zdieľaných prvkov a bez strihu (`site.js` meria, `sessionStorage` `vt-lahke`, skript v `<head>` ho číta).

**Testy** sú v `richtarik/dokoncenie/nastroje/`: `prechody-zf.mjs` (prechody na 8 typoch stránok tam aj späť, typy,
mená, dlhé snímky, prázdna dlaždica pri Späť, režim bez podpory), `scenar.mjs` (presný storyboard prechodu: animácie
sa zastavia a nastavia na časy), `posun-zf.mjs` (posun 30 × 120 px, pripnuté prvky, CLS, kotvy), `staticke-zf.mjs`
(bez JS, „obmedziť pohyb“: skryté prvky a bežiace animácie), `koniec-zf.mjs` (odhalenia dobehnú aj na konci stránky),
`osi-zf.mjs` (každá animácia pri posune sa riadi posunom stránky, nie rámom s `overflow: hidden`), `lightbox-zf.mjs`
(storyboard lightboxu), `mikro-zf.mjs` (odozva ťuknutí, fokus, pás značiek), `tlac-zf.mjs` (tlač: nič priesvitné ani
posunuté), `bfcache-zf.mjs` (Späť a Vpred z vyrovnávacej pamäte prehliadača, v plnom Chromiu: `KANAL=chromium`)
a `harok-zf.py` (jas snímok a hárky), `uvitanie-zf.mjs` (uvítanie pred úvodom: kontroly a A/B meranie). Doladenie
pohybu (6. 11. 2026) pridalo v `richtarik/profi/doladenie/kolo1/oprava/nastroje/`: `pokoj.mjs` (priehľadnosť textov
v okne po zastavení posunu), `nahraj.mjs` (záznam a dlhé snímky všetkých scén, CLS, INP), `kontroly.mjs` („obmedziť
pohyb“, bez JS, prehliadač bez View Transitions), `uvod.mjs` a `pozdrav.mjs` (uvítanie a úvod), `bublina.mjs`
(bublina asistenta pri posune).

**Zdroje inšpirácie** (navštívené 5. 11. 2026; prevzaté sú len princípy, kód je vlastný, bez knižnice a CDN):

| zdroj | princíp | čím sa web líši |
|---|---|---|
| Chrome: Profiles MPA – https://view-transitions.chrome.dev/profiles/mpa/ | zdieľaný prvok medzi dvoma HTML, mená až v `pageswap`/`pagereveal` | dlaždica → hlavička aj názov → H1, pri Späť sa dlaždica prelne až na konci |
| Chrome: Off the beaten path MPA – https://view-transitions.chrome.dev/off-the-beaten-path/mpa/ | „upratať, hlavný ťah, detaily“, prerender | do 0,5 s, prerender len pri dotyku |
| Chrome: Stack Navigator MPA – https://view-transitions.chrome.dev/stack-navigator/mpa/ | typy prechodu podľa smeru | papier namiesto čierneho podkladu, stará stránka nestmavne |
| Chrome for Developers: Cross-document view transitions – https://developer.chrome.com/docs/web-platform/view-transitions/cross-document | `@view-transition`, udalosti, typy, reload | – |
| Shopify.dev: Cancel view transitions on interaction – https://shopify.dev/docs/storefronts/themes/best-practices/performance/cancel-view-transitions-on-interaction | `skipTransition` pri dotyku a klávese | – |
| CSS-Tricks: Cross-document view transitions gotchas – https://css-tricks.com/cross-document-view-transitions-part-1/ | `object-fit: cover` na snímkach | okno fotky orezáva |
| scroll-driven-animations.style: Image Reveal – https://scroll-driven-animations.style/demos/image-reveal/css/ | odhalenie fotky pri posune | pásy papiera `scaleY` namiesto `clip-path` |
| WebKit: Scroll-driven animations with just CSS – https://webkit.org/blog/17101/a-guide-to-scroll-driven-animations-with-just-css/ | časová os za skratkou `animation`, rozsahy | dráhy v px |
| Haven Constructions – https://www.havenconstructions.com.au/ | text vyjde z drážky | bez opony, po riadkoch |
| Hays Woodworking – https://www.hayswoodworking.com/ | odhalenie plochou, ktorá odíde | svetlé pásy nad viditeľnou fotkou |
| Codrops: Image Layer Animations with Clip-Path – https://tympanus.net/codrops/2023/10/31/image-layer-animations-with-clip-path | strih viacerých záberov | výtlačky cez `transform` |
| Codrops: Double Image Hover – https://tympanus.net/codrops/2023/03/01/double-image-hover-effects-with-clip-path-animations/ | odozva dlaždice pri myši | šípka a stlačenie, bez druhej fotky |
| Byggmax – https://www.byggmax.se/ | nástup podľa poradia | podľa stĺpca na časovej osi posunu |
| Petersen Tegl – https://www.petersen-tegl.dk/ | materiál ako hrdina, štítok palety | papierový štítok v páse zásob |
| DEV: Accessible marquee – https://dev.to/olpeh/modern-and-accessible-marquee-clone-with-tailwindcss-5abb | pauza a statický pás pri obmedzení pohybu | tlačidlo Zastaviť pohyb, pauza pri fokuse |
| web.dev: High-performance CSS animations – https://web.dev/articles/animations-guide | len transform a opacity | – |
| A. Roselli: Don't split words into letters – https://adrianroselli.com/2026/02/you-know-what-just-dont-split-words-into-letters.html | text najviac po riadkoch | – |

## Prehliadka predajne 360°

**Režim ukážky (10. 11. 2026, KF-12).** Kým je v `img/panorama/predajna.jpg` len skúšobný obraz, platí v `build.py`
`PANORAMA['skusobna'] = True`: komponent má atribút `data-panorama-skusobna`, odznak „360° · ukážka“, tlačidlo „Vyskúšať
prehliadku 360°“, vetu „Ukážka: skúšobný obraz, nie záber predajne.“, odsek sekcie „Ukážka na kontrolu: …“ a odkazy
„Prehliadka 360° (ukážka)“. Sekcia aj odkazy sú medzi značkami `<!--p360-->` a `<!--/p360-->`; `nasadenie/balik.sh` ich
z balíka na ostrý web vynechá spolu s obrazom a prehliadačom (v balíku 0 stránok s prehliadkou, overené). Po dodaní
skutočného záberu alebo kódu „Vložiť mapu“: `PANORAMA['skusobna'] = False`, build a na úvode vymeniť blok, odsek a text
odkazu (`kontrola_uvodu()` vypíše, čo sa nezhoduje).

Majiteľ (9. 11. 2026) chce, aby si ľudia mohli predajňu prezrieť ako v Google Mapách (otáčať sa po predajni), a to priamo na
našej stránke; nikoho neposielame na Google. Komponent `.p360` (`build.py: prehliadka_blok()`, štýl v `assets/site.css`
časť „Prehliadka predajne 360°“, správanie v `assets/site.js`) je na úvode (sekcia Predajňa pred Kontaktom, fotka 13) a na
Kontakte (fotka 02); odkazy „Prezrieť predajňu v 360°“ v päte sekcie Kontakt na úvode a pri fotke na Kontakte vedú na `#prehliadka`
tej istej stránky. Pred kliknutím je to len fotka predajne od majiteľa, odznak „360°“ a tlačidlo: **nič sa nenačíta** (0 požiadaviek
na Google, panoráma ani prehliadač sa nestiahnu). Po kliknutí sa do okna (telefón 60 vh, od 701 px 16:9) vloží jeden z dvoch zdrojov
podľa `PANORAMA` v `build.py` (prednosť má `src`):

1. **`src` – rám Google Máp** (`data-panorama-src`): `<iframe>` s adresou z kódu „Vložiť mapu“ panorámy stavebnín
   (`https://www.google.com/maps/embed?pb=…`), `loading="lazy"`, `allowfullscreen`, `referrerpolicy="no-referrer-when-downgrade"`,
   titulok; fotka sa prelne preč až po udalosti `load` (bez prázdneho rámu). Veta pod oknom hovorí, že obsah z Google Máp sa
   načíta až po kliknutí (ochrana údajov). **Ako získať kód** (Lajo alebo majiteľ, prihlásený v prehliadači na počítači):
   otvoriť záznam firmy v Google Mapách (`https://www.google.com/maps?cid=137067579998285540`) → Fotky → záložka
   „360°“ (alebo Street View) → otvoriť panorámu stavebnín → menu (tri bodky) alebo „Zdieľať“ → „Vložiť mapu“ → skopírovať
   `src="…"` z `<iframe>` → vložiť do `PANORAMA['src']` → `python3 build.py` a ten istý blok vložiť ručne do `index.html`
   (`kontrola_uvodu()` hlási, kým sa nezhoduje). Kód sa z nášho prostredia nedal získať (Google ukázal reCAPTCHA pre sieť,
   `richtarik/majitel/360/ZAPIS.md`), nič sa nezostavuje od oka. Hotovú adresu overte v stránke: rám sa dá ťahať.
2. **`obrazok` – vlastná panoráma** (`data-panorama-obrazok`, dnes `img/panorama/predajna.jpg`): equirektangulárny obraz
   2:1 (celých 360° × 180°, sever v strede), prehliadač `zdroj/panorama.js` (build ho zmenší do `assets/panorama.js`, modul sa
   importuje až po kliknutí). WebGL: jeden trojuholník, zlomkový shader počíta smer každého bodu a číta z textúry (šírka
   mocnina dvoch, najviac 4096 px); bez WebGL záloha v CSS (pás ako pozadie, len vodorovné a zvislé posúvanie). Ovládanie:
   ťahanie prstom alebo myšou so zotrvačnosťou (útlm 320 ms; pri „obmedziť pohyb“ bez zotrvačnosti), dva prsty = priblíženie
   (zorný uhol 45–100°), šípky a +/−, koliesko len na celej obrazovke. Kreslí sa len počas pohybu. **Dnes je v súbore
   skúšobný obraz** vygenerovaný lokálne (`richtarik/majitel/360/nastroje/panorama_skuska.py`: prechod oblohy a zeme, mriežka
   po 15°, svetové strany a stupne na horizonte, nápis „Skúšobná panoráma – skutočný záber predajne sa doplní“). Skutočná
   panoráma od majiteľa (fotoaparát alebo telefón s režimom 360°, prípadne stiahnutá z jeho účtu Google) sa uloží pod tým
   istým názvom `img/panorama/predajna.jpg` (JPEG, 2:1, 4096–8192 px šírka, do 1,5 MB); nič iné netreba meniť.

Tlačidlá na okne: „Celá obrazovka“ (`requestFullscreen` na celom komponente; kde nie je, napr. iPhone, pevná pozícia cez celé
okno `.p360-pevne`, sekcia s `content-visibility:auto` dostane `p360-pevne-rodic`; Esc ju ukončí) a „Zavrieť prehliadku“
(odstráni rám alebo panorámu, vráti fotku a fokus na tlačidlo). Bez JS ostáva fotka a veta „Prehliadka potrebuje zapnutý
JavaScript“ (tlačidlo je `hidden`). Bez oboch zdrojov ostáva fotka a tlačidlo je skryté. Obe témy: odznak a veta z tokenov,
čipy lišty tmavý papier so svetlým písmom (na bielej fotke 11,7 : 1, na noci 18,7 : 1; tlačidlo tehlová s bielym písmom 5,4 : 1 svetlá, 4,7 : 1 tmavá). Skúšky: `richtarik/majitel/360/nastroje/test-p360.mjs` (sieť pred kliknutím,
ťahanie, zotrvačnosť, klávesnica, celá obrazovka, zavretie, obmedziť pohyb, bez JS, dĺžky snímok).

## Texty a SEO
Platí pre všetky texty webu (úvod, podstránky, alt texty, titulky, popisy, tlačidlá):
- **Len fakty** z pôvodného webu (`zdroj/pages.json`) a z cenníka akcií `pdf/662.pdf` (28. 1. 2026). Text sa smie
  preformulovať a skrátiť, nesmie pribudnúť nové tvrdenie (počty paliet, m², roky skúseností, recenzie, záruky,
  „najlacnejší“). Tvrdenia výrobcov (napr. „najväčší výrobca cementu“) len s pripísaním výrobcovi, nikdy v popise
  stránky. „Zadarmo“ len pri cenovej ponuke, poradenstve a výpočte spotreby, pri doprave len s podmienkou zo zdroja.
- **Oslovenie:** web vyká malými písmenami („vy, vám, váš“), firma hovorí „my“, tlačidlá sú v neurčitku
  („Zavolať 0905 622 223“, „Prezrieť katalóg“). Bez výkričníkov, verzálok vo vete a prázdnych fráz; čísla namiesto
  prídavných mien; „Akciová cena“ namiesto „super ceny“. Mechanická ruka v jednotnom čísle, značka 8 t auta sa v nových
  textoch neuvádza (na Službách ostáva znenie zdroja).
- **Typografia** (`texty._typografia`, beží automaticky na každej stránke): m², m³, €, „5 %“, pomlčka s medzerami,
  nezlomiteľná medzera medzi číslom a jednotkou, v dátume a za ø, verzálky zdroja na bežné písmo (výnimky `SKRATKY`
  a `MENA`), preklepy zdroja (`PREKLEPY`). Obchodný názov „Ing. Mário Richtárik - Stavebniny“ sa nemení.
- **Nadpis H1:** 2 – 7 slov, najviac 45 znakov, na stránke jeden a na webe jedinečný. Kategória = názov kategórie,
  značka = „Značka – čo to je“, akcia = „… v akcii“ (iný ako H1 v katalógu), novinka = výrobok a použitie.
- **Titulok** najviac 60 znakov vo vzore „… | Stavebniny Richtárik Nitra“ (pred príponou najviac 31 znakov; dlhší build
  odmietne chybou, nereže ho – `texty.titulok()`), **popis** 120 – 155 znakov z celých viet,
  bez „…“ na konci. Každá stránka má ručný záznam v `texty.STRANKY` (`h1`, `t`, `d`); og:title a og:description sú
  rovnaké. `build.py` na konci behu skontroluje dĺžky, jedinečnosť a chýbajúci ručný popis (`kontrola textov: OK`,
  inak `POZOR` so zoznamom). Nová stránka = nový záznam v `STRANKY`.
- **Karty „Podrobnejšie“** v katalógu majú názov podľa H1 cieľovej stránky a prvú vetu jej popisu (nie reklamné vety
  výrobcu zo zdroja).
- **Alt texty:** opisujú, čo je na fotke (5 – 15 slov), logá majú názov značky, ilustračné fotky kategórií (`img/hd`,
  Pexels) majú prázdny alt a netvrdí sa o nich, že sú z dvora.
- **Ceny akcií** (`CENNIK_AKCIE` v `build.py`): prepis tabuliek z `pdf/662.pdf` so stranou PDF v nadpise tabuľky,
  hlavička „Cenník akcií z 28. 1. 2026 (PDF)“ a veta „Platnosť ceny potvrdí predajňa.“. Pri novom cenníku: nové PDF
  do `pdf/`, zmeniť `CENNIK_PDF`, `CENNIK_TEXT`, `CENNIK_LETAK`, `PDF_DATUM`, tabuľky v `CENNIK_AKCIE`, popisy akcií
  v `texty.STRANKY` a dátum v `index.html`; každé číslo s € overiť v `pdftotext -layout pdf/<číslo>.pdf`. Staré akcie
  bez dátumu (pôvodná stránka Akcie) ostávajú, kým majiteľ nerozhodne; nedostávajú nový dátum.
- **Odkazy:** akcia ↔ katalóg (`AKCIA_KATALOG`, na akcii „Tento tovar v katalógu“, na katalógu „Táto značka je
  v akcii“ / „V akcii z tejto kategórie“), novinky z kategórií (`NOVINKY_KATEGORIE`). Text odkazu hovorí, kam vedie.
- **Časté otázky:** odpovede sa berú doslova z databázy otázok predajne (`asistent/znalosti/richtarik-otazky.json`,
  ak je v strome; inak kópia `CASTE_KOPIA` v `build.py` s tými istými textami), zoznam `CASTE_ID`. Pri zmene odpovede
  zmeniť databázu aj kópiu, aby web a databáza hovorili to isté.
- **Štruktúrované dáta:** `HardwareStore` s `@id` `…/#predajna` na úvode (ručne, vložiť výstup `firma_ld()`,
  `kontrola_uvodu()` overí zhodu) a na Kontakte, `BreadcrumbList` na každej podstránke, `FAQPage` len na Častých
  otázkach. Bez `geo` (presná poloha nie je v zdroji), `sameAs` (profily nie sú v zdroji) a `Offer` (cenník nemá
  platnosť do).
- **Sitemap** má `lastmod` z dátumu posledného commitu stránky (zmenená necommitnutá stránka = dnešný dátum),
  `robots.txt` vylučuje `/asistent/`. Vyhľadávanie na webe (`assets/index.json`) sa pregeneruje pri každom behu.
- **Rýchlosť podstránok:** fotka hlavičky má na telefóne (do 480 px) vlastný výrez 720 × 468 (`img/uvod/hlavicka/`,
  `img/hd/hlavicka/`, vyrobí `bash zdroj/hlavicky.sh`); meno súboru bez „-720“ je rovnaké ako pri dlaždici, takže
  prechod medzi stránkami ju berie ako tú istú fotku. Po výmene fotky dvora alebo ilustračnej fotky treba skript
  spustiť znova. Prednačítané sú len 2 písma nadpisov.
- **Otvorené otázky majiteľa** (predvolené znenie sa nemení): staré akcie bez dátumu, LIAZ alebo Iveco pri 8 t aute,
  znenie zľavy 5 % / 3,3 %, Nero Ebono alebo Ebano, hosting a HTTPS (časť HTTPS a presmerovania).

## Údržba
- Prostredie: `python3 -m venv venv && venv/bin/pip install lxml`, potom v tomto priečinku `venv/bin/python build.py`.
  Beh vypíše `stránok v sitemap.xml: 76`, vynechané odkazy na súbory, ktoré na pôvodnom webe už neboli (497, 521),
  `kontrola úvodu: OK`, `kontrola textov: OK` a `vygenerovaných stránok HTML: 76`. Riadok `POZOR` znamená, že
  `kontrola_uvodu()` v ručnom `index.html` nenašla položku menu alebo údaj firmy z `build.py` (`NAV`, `FIRMA`), alebo
  že `kontrola_textov()` našla titulok, popis či H1 mimo pravidiel (časť Texty a SEO) – treba to opraviť. Po behu
  `git diff --stat`: `index.html` sa nesmie zmeniť.
- Texty: akcie (`AKCIE_KARTY`, `ZLAVA_AKCIE`, `CENNIK_PDF`, `CENNIK_AKCIE`), hlavičky kategórií (`HOOKY`), sortiment
  zo zdroja (`PONUKA_UVOD`), novinky (`NOVINKY_POPIS`), Služby (`SLUZBY`), O nás (`ONAS_TEXT`), Doprava
  (`build_doprava()`), Časté otázky (`CASTE_ID`, `CASTE_KOPIA`) a opravy celých viet zdroja (`OPRAVY`) sú v `build.py`;
  nadpisy, titulky, popisy, názvy značiek, alt texty a typografia v `texty.py` (časť Texty a SEO).
  Nový cenník akcií: PDF do `pdf/`, zmeniť `CENNIK_PDF`, `CENNIK_TEXT`, `CENNIK_LETAK` a dátum v `index.html` (sekcia
  Akcie).
- Prehliadka predajne 360°: kód „Vložiť mapu“ z Google Máp do `PANORAMA['src']`, skutočná panoráma pod `img/panorama/predajna.jpg`
  (časť Prehliadka predajne 360°); po zmene `PANORAMA` alebo `prehliadka_blok()` vložiť nový blok ručne aj do `index.html`.
- Úvod (`index.html`) sa mení ručne (texty, odkazy, karty akcií a noviniek, päta). Po zmene `index.html`, `site.css`
  alebo `site.js`: `node --check assets/site.js` a prejsť úvod na telefóne aj počítači (strih, Prehrať úvod, posun).
- Fotky úvodu `img/uvod/` sú hotové webové veľkosti fotiek majiteľa (originály má majiteľ). Novú fotku treba vyrobiť
  v tých istých šírkach a formátoch (AVIF aj WebP, ImageMagick, nikdy nezväčšovať): `dvor-p` 1290, 1720 a `dvor-t`
  (výrez na výšku) 1086, 1448; `dvor-predajna` 800, 1200; `pas-dvor` 1280, 1920; `pas-dvor-t` (výrez na výšku) 780,
  1086, 1290; `zasoba-porfix`, `-rezivo`, `-stadreko` 480, 720, 900; `zasoba-tehly` 480, 720, 856 (čísla sú v názve
  súboru; `dvor-t-1448` má po vyrovnaní horizontu 1420 px a `pas-dvor-1920` 1848 px, v `srcset` je skutočná šírka).
  Do fotiek sa nič nepridáva ani neuberá (žiadne dokresľovanie paliet ani tovaru, žiadne generatívne nástroje); smie
  sa len fotografická úprava tónu, farby, svetla, orez a vyrovnanie, tak ako pri elegantnej úprave zo 6. 11. 2026
  (`img/FOTKY.md`). Nová fotka dostane tú istú úpravu, aby mala sada jeden tón; „plné zásoby“ ukazuje len skutočná
  fotka. Pri rovnakom názve sa na hostingu prejaví až po vypršaní cache (rok), preto novú fotku radšej pod novým názvom.
- Fotky v hlavičkách podstránok: `HLAVICKA_FOTO` v `build.py` (stránka → `uvod:<názov>` skutočná fotka dvora,
  `p:<číslo>` fotka z pôvodného webu, `<názov>` ilustračná fotka kategórie z `img/hd`). Ilustračná fotka sa používa vo
  verzii 1200 px (`img/hd/<názov>-1200.webp`, ImageMagick, kvalita 80); pre novú ju treba vyrobiť rovnako. Rám má na
  počítači najviac 520 px, na telefóne celú šírku obsahu a výšku 230 px; fotka musí mať aspoň 1,6-násobok šírky rámu.
  Dlaždice kategórií (úvod aj Katalóg) skladá `dlazdice()`; skutočné fotky pri dlaždiciach sú v `DLAZDICA_UVOD`. Na
  úvode sa dlaždice menia ručne (vložiť výstup `dlazdice('index.html', cisla=True)`).
- Služby (`SLUZBY`), fotky dvora v galérii (`GALERIA_DVOR`) a pás faktov O nás (`FAKTY_ONAS`) sú v `build.py`; texty
  sú zo zdroja alebo z úvodu, nové treba overiť rovnako.
- Hosting: `python3 -I nasadenie/presmerovania.py . nasadenie` vyrobí znova `htaccess.txt`, `web.config.txt`
  a `presmerovania.tsv` (po pridaní PDF do `pdf/`, zmene stránok alebo `DOMENA`) a vypíše kontrolu (časť HTTPS
  a presmerovania).

## Nasadenie
Náhľad beží na GitHub Pages v podpriečinku `stavebniny-richtarik/`. Ostrý web je v koreni domény
https://www.stavebninyrichtarik.sk/ (canonical, sitemap a og:image sú nastavené na túto adresu):

1. `venv/bin/python build.py` – vypíše `stránok v sitemap.xml: 76`, `kontrola úvodu: OK`, `kontrola textov: OK`
   a žiadne `POZOR`; `index.html` bez zmeny.
2. `bash nasadenie/balik.sh . <priečinok balíka>` (bez asistenta) alebo
   `ASISTENT_API=https://www.stavebninyrichtarik.sk/asistent/api.php bash nasadenie/balik.sh . <priečinok>` (s ním, až
   keď je server pripravený, časť Asistent na otázky) – balík bez zdrojov a poznámok (`zdroj/`, `build.py`, `obsah.py`,
   `popisy.py`, `texty.py`, `README.md`, `OBNOVA-*.md`, `img/FOTKY.md`, `nasadenie/`) a bez obrázkov, na ktoré nič
   neodkazuje; skript skontroluje lokálne odkazy a súbory starého videa a vyrobí aj zip. Na hosting sa nahrá
   **obsah** balíka do koreňa domény (FTP/SFTP). PDF v `pdf/` idú celé, lebo na ne vedú presmerovania starých adries.
3. Na hostingu: `nasadenie/htaccess.txt` ako `.htaccess` (Apache) alebo `nasadenie/web.config.txt` ako `web.config`
   (IIS) – 301 zo starých adries `.aspx` a `files/N.pdf`, vlastná 404. Kanonická adresa a HTTPS: časť HTTPS
   a presmerovania nižšie.
4. Hlavičky (sú v oboch súboroch): gzip a brotli pre HTML, CSS, JS, JSON a SVG; `Cache-Control: max-age=31536000,
   immutable` pre `img/`, `pdf/`, `subory/` a písma, `max-age=600` pre HTML, `site.css`, `site.js` a `index.json`
   (názvy bez verzie). Fotku pod rovnakým názvom zákazníci po výmene uvidia až po roku – meniť názov.
5. Po nahratí: Google Search Console – odoslať `sitemap.xml`, skontrolovať niekoľko starých adries (301) a jednu
   neexistujúcu (404).

## HTTPS a presmerovania
- Web počíta s adresou `https://www.stavebninyrichtarik.sk/` (`DOMENA` v `build.py`: canonical, og:url, og:image,
  sitemap, JSON-LD aj ciele presmerovaní). Pôvodný hosting (IIS 10) HTTPS dnes nemá; ostať, alebo prejsť inam, je
  otvorená otázka majiteľa.
- `python3 -I nasadenie/presmerovania.py . nasadenie` vyrobí pravidlá v tomto poradí:
  1. **Kanonická adresa** (schéma a host podľa `DOMENA`): `http://…` a adresy bez `www` jedným 301 na
     `https://www.…`. Pravidlo je **pripravené, ale vypnuté** (v `htaccess.txt` zakomentované, vo `web.config.txt`
     `enabled="false"`), aby web na hostingu bez HTTPS neprestal fungovať. Staré adresy ho obchádzajú.
  2. **Staré adresy** pôvodného webu (`/sk/….aspx`, 83 stránok zo `zdroj/pages.json`) a súbory `files/N.pdf|doc|wmv`
     rovno na absolútny cieľ na kanonickej adrese, takže aj z `http://` alebo bez `www` je to jedno presmerovanie
     (bez reťaze).
  Skript na konci vypíše kontrolu: `v zdroji stránok 83 | chýba 0 | … | neexistujúci cieľ 0 | reťaze 0`.
- **Zapnutie, keď HTTPS na hostingu funguje** (certifikát pre `www` aj holú doménu): `python3 -I
  nasadenie/presmerovania.py . nasadenie --kanonicke` (alebo v `.htaccess` odkomentovať tri riadky pod bodom 1, vo
  `web.config` dať `enabled="true"`) a súbor znova nahrať. Overenie: `curl -sI http://stavebninyrichtarik.sk/`
  vráti `301` a `Location: https://www.stavebninyrichtarik.sk/`, `curl -sI http://stavebninyrichtarik.sk/sk/akcie.aspx`
  jedno `301` rovno na `https://www.stavebninyrichtarik.sk/akcie/index.html`. Ak hosting ukončuje HTTPS na proxy
  a Apache vidí stále `%{HTTPS} off` (presmerovanie dookola), v `.htaccess` zmeniť podmienku na
  `RewriteCond %{HTTP:X-Forwarded-Proto} !https`.
- **Ak hosting HTTPS mať nebude:** v `build.py` zmeniť `DOMENA = 'http://www.stavebninyrichtarik.sk/'`, spustiť
  `venv/bin/python build.py` (podstránky, sitemap, robots.txt) a `python3 -I nasadenie/presmerovania.py . nasadenie`
  (ciele presmerovaní a kanonické pravidlo sa prepnú na http). V ručnom `index.html` nahradiť
  `https://www.stavebninyrichtarik.sk/` za `http://www.stavebninyrichtarik.sk/` (canonical, og:url, og:image, JSON-LD);
  `kontrola_uvodu()` potom musí hlásiť OK. Potom balík (časť Nasadenie, bod 2).

## Asistent na otázky
- Okno asistenta s povinným označením ako na Barbershope (výslovná žiadosť majiteľa). Všetko o ňom je v `asistent/README.md`:
  režimy, zapnutie naostro, kľúč (len cez premennú `KLUC` do `asistent/config.php`, nikdy do repozitára ani do správ),
  limity, odhad nákladov a údržba znalostí.
- Náhľad: `data-asistent="ukazka"` na `<html>` (šablóna v `build.py`, ručne v `index.html`), odpovede vopred
  pripravené, nič sa neposiela. Kým je v okne úvod (sekcia s nadpisom `#h-uvod`, trieda `.hero` alebo atribút
  `data-bez-asistenta`), ikona je skrytá, aby nezakryla jeho tlačidlá. Modul sa načíta lenivo (pri prvom ťuknutí alebo
  klávese, inak 3,5 s po načítaní a najskôr 5,5 s od začiatku, po strihu úvodu) a nikdy počas posunu (čaká 600 ms
  pokoja), aby preklad modulu nedal dlhú snímku v odhaleniach pri posune; prvý obraz stránky ho nepotrebuje.
- Vzhľad a pohyb okna sú z webu: papier, malta, tehlová, Barlow; dĺžky a krivky z `site.css` (`--dlzka-dnu`,
  `--krivka-dnu`, `--dlzka-tlak`), žiadna tmavá plocha (ani bublina otázky, ani clona na telefóne), pri „obmedziť
  pohyb“ bez animácie.
- Znalosti a texty webu hovoria to isté: odpovede na stránke Časté otázky berie `build.py` doslova z
  `asistent/znalosti/richtarik-otazky.json`. Po zmene textov webu: `python3 -I asistent/nastroje/otazky_zdroj.py .`,
  `venv/bin/python build.py`, potom `node asistent/nastroje/caste.mjs .` (zhoda stránky s databázou) a
  `node asistent/nastroje/otazky.mjs .` (fakty a hľadanie; 1 známy FAIL „Kedy by ste mi to vedeli doviezť?“ 0,57).
- Balík: bez `ASISTENT_API` ide web bez asistenta (žiadne `data-asistent`, žiadny odkaz Ochrana údajov v päte,
  žiadne `asistent/` ani `assets/asistent*`); s `ASISTENT_API=https://www.stavebninyrichtarik.sk/asistent/api.php`
  dostanú stránky adresu servera.
