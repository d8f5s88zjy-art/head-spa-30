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
- `img/logo.png` je pôvodné logo firmy (na svetlom podklade; biele `logo-white.png` web už nepoužíva), fotky dvora
  a tovaru v `img/uvod/` sú od majiteľa, ilustračné fotky kategórií sú z Pexels (`img/FOTKY.md`), kým sa nenafotí ďalší
  tovar. Nová fotka sa uloží pod novým názvom (obrázky majú na hostingu cache na rok, časť Údržba).

## Úvod
Úvod (`index.html`, sekcia `.uv`) je len zo skutočných fotiek dvora, bez videa a bez auta. Hlavný obraz je výrez fotky
dvora `u4` (palety tvárnic pod modrou oblohou): `img/uvod/dvor-p-1290|1720` na šírku (počítač, tablet) a
`img/uvod/dvor-t-1086|1448` na výšku (telefón), AVIF aj WebP. Je to LCP (`fetchpriority="high"`), viditeľný od prvej
snímky, pod ním svetlý náhľad 16 px. Pôvod fotiek je v `img/FOTKY.md`.
- Scenár (čas od začiatku načítania): 0–2,9 s fotka pomaly dosadne (zmenšenie z 1,09 na 1); 0,2–1,05 s sa hore a dole
  rozostúpia dva svetlé pásy papiera ako okno kina; 0,12–1,06 s vyjde nadpis po riadkoch z drážky
  („Stavebniny Nitra – Horné Krškany“ ako riadok nad nadpisom, „Dvor plný materiálu. Od základov po strechu.“);
  1,0–3,0 s dopadnú na dvor za sebou štyri skutočné zábery zásob so štítkom ako na palete (Tehly TermoBRIK, Pórobetón
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
  (`sessionStorage` `uv-videne`) a keď zákazník už posúva. Preruší ho posun, koliesko, dotyk, kláves (okrem Tab)
  a fokus vo vyhľadávaní. Zábery sú v `<template id="uv-zabery">`, takže bez strihu sa vôbec nestiahnu.
- Výmena záberu: v `index.html` v `<template id="uv-zabery">` zmeniť cesty `img/uvod/zasoba-<názov>-480|720|900`
  a text štítku (`<b>` a `<span>`); nová fotka musí byť skutočná, bez pridaného či ubraného obsahu, v rovnakých
  šírkach a s rovnakou fotografickou úpravou (časť Údržba).
  Počet záberov je 4 (časovanie v CSS `.uv-mont .uv-z:nth-child(n)` a v skripte 550, 1050, 1500 ms).
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
paletách“). Fotka sa potom presne usadí do rámu úvodu, vyjde nadpis a ponuka, štítok „Náš dvor“ sa vrazí a 0,6 s po
konci nadviaže strih zásob. Hlavička (logo, menu, telefón) a spodná lišta Zavolať / Cenová ponuka sú celý čas nad
bránou a fungujú. Texty sú len z overených faktov (rok 1997, adresa, doprava po celom Slovensku, sortiment).
- Scenár na telefóne (390 × 844, 4G, CPU 4×; F = prvé vykreslenie ≈ 0,8 s): F – F + 0,4 s pozdrav vyjde z drážky a
  nakreslí sa tehlová spára; t0 = max(F + 0,38 s, fotka pripravená) ≈ 1,2 s krídla sa za 0,5 s rozídu, kamera vojde na
  1,05; t0 + 0,15 s odznak; t0 + 0,10 / 0,15 s štítky (krúžok špendlíka sa raz rozvlní), zhasnú v t0 + 0,94 s;
  t0 + 0,60 – 1,12 s usadenie do rámu úvodu (len `transform`, bez posunu rozloženia), t0 + 0,74 / 0,80 s riadky H1,
  t0 + 0,80 s ponuka; t0 + 1,12 s prelnutie 90 ms a prekryv zmizne, pečiatka „Náš dvor“. Úvod je použiteľný ≈ 2,3 s.
  Počítač: F ≈ 0,15 s, t0 ≈ 0,55 s, usadenie t0 + 0,56 – 1,0 s (kratšia dráha), použiteľný ≈ 1,6 s. Ak t0 príde
  neskôr, časy od t0 sa skrátia koeficientom k (najviac na 0,72), aby bol úvod použiteľný do 2,45 s.
- Rýchla cesta: na pomalej sieti (prvé vykreslenie po 1,5 s) alebo keď fotka nie je včas pripravená, brána len
  pozdraví a otvorí sa rovno na úvod (0,44 s), keď je fotka úvodu vykreslená, najneskôr 0,7 s po prvom vykreslení.
- Kedy sa neukáže: druhá návšteva v tej istej relácii (`sessionStorage` `br-videne`), príchod z inej stránky webu,
  Späť, Vpred a obnovenie, kotva v adrese, šetrenie dát, predvykreslenie, okno menšie ako 300 × 420 px, „obmedziť
  pohyb“ a bez JS (šablóna `<template>` je nečinná, nič sa nestiahne). Vtedy beží dnešný úvod (trieda `uv-ide`).
  `?uvitanie` v adrese ho vynúti aj pri ďalšej návšteve (nie pri „obmedziť pohyb“), napr. na ukážku majiteľovi.
- Preskočenie: ťuk, klik, koliesko, kláves (aj Tab), posun, zmena šírky okna alebo skrytie karty. Úvod je hneď
  v konečnom stave a brána sa prelne za 0,16 s; ťuk na bránu nič pod ňou nestlačí, ťuk na Zavolať v lište alebo na
  telefón v hlavičke sa normálne vykoná. Po preskočení sa strih zásob nespustí (tlačidlo „Prehrať úvod“ ostane).
- Asistent na otázky sa počas uvítania nenačíta ani neukáže (čaká na udalosť `br-koniec`).
- Prístupnosť a SEO: prekryv má `aria-hidden`, vnútro je `inert` (žiadny fokus, mimo čítačky), samotný prekryv
  zachytí ťuk (inert vrstva by ťuk pustila na odkaz pod ňou). Prvý nadpis v strome je nezmenené H1, obsah úvodu je
  v HTML od začiatku. Pri tlači sa prekryv nezobrazí a úvod je v konečnom stave.
- Poistky: CSS skryje prekryv 3,2 s po prvom vykreslení, aj keby skript zlyhal; skript ho odstráni najneskôr po 6 s.
- Kód: zdroje sú v `zdroj/uvitanie-head.js` (rozhodnutie v `<head>`), `zdroj/uvitanie.css`, `zdroj/uvitanie.html`
  (šablóna) a `zdroj/uvitanie.js` (riadenie, WAAPI). `build.py:uvitanie_bloky()` ich zmenší na 4 bloky v `index.html`
  (štýl a rozhodnutie v `<head>` pred skriptom `uv-ide`, šablóna a skript za hlavičkou a menu tesne pred `<main>`).
  Po zmene zdroja: `python3 -I zdroj/uvitanie_vloz.py .` (bloky v `index.html` nahradí) a `python3 build.py`
  („kontrola úvodu: OK … uvítanie zo zdroja 1×“; kontrola overí aj `aria-hidden`, `inert`, žiadny nadpis, odkaz,
  výkričník ani štítok označenia asistenta v šablóne a žiadne `rotate`, `perspective` ani `clip-path`). Strih zásob a asistent v
  `assets/site.js` čakajú na udalosť `br-koniec` (`{preskocene, rychlo, t}`).
- Vypnutie: v `zdroj/uvitanie-head.js` `VYP = 1` a vložiť bloky (`uvitanie_vloz.py`), alebo zmazať 4 bloky
  z `index.html` (`<style>` začínajúci `.br{`, skript s `br-ide` v `<head>`, `<template id="br-tpl">` a skript za ním)
  a z podmienky skriptu `uv-ide` časť `&&!h.classList.contains("br-ide")`, potom upraviť `kontrola_uvodu()`.
- Výmena fotky dvora: uvítanie používa ten istý `<picture>` ako úvod (rovnaké `srcset` a `sizes`), pri inom výreze
  treba v šablóne skontrolovať polohy špendlíkov štítkov (`data-tel`, `data-pc` = poloha v pomere k fotke) a pomer
  strán v `zdroj/uvitanie.css` (`.br-scena`, `--a`).
- Test: `richtarik/dokoncenie/nastroje/uvitanie-zf.mjs kontroly` (preskočenie, relácia, obmedziť pohyb, bez JS, kotva,
  šetrenie dát, iframe, tlač, Späť, šírky 320 – 1920, odovzdanie do rámu, štítky, krídla) a `… vykon` (A/B meranie).

## Pohyb a prechody
Jeden pohybový jazyk pre celý web. CSS je v časti „Pohybový systém celého webu“ na konci `assets/site.css` (premenné
dĺžok a kriviek `--dlzka-*`, `--krivka-*`), skript prechodov v `zdroj/prechody.js`. Úplný katalóg (prvok, spúšťač,
trvanie, krivka, rozpočet, správanie pri „obmedziť pohyb“) je v `richtarik/profi/zf/POHYB.md`. Zásady: animuje sa len
`transform`, `translate`, `scale` a `opacity`; nič sa nepripína a posun sa nezamyká; plochy pri prechodoch sú papier
alebo fotka, nikdy tmavá clona; text nikdy nie je priehľadnejší ako 0,2; bez JS, pri „obmedziť pohyb“ a v prehliadači
bez podpory je všetko hneď v konečnom stave; bez otáčania a poskakovania.

**Uvítanie pred úvodom** (len `index.html`, prvá návšteva v relácii zvonka; podrobne v časti Úvod): pozdrav vyjde
z drážky po riadkoch (`--krivka-vyjazd`, 0,34 s), krídla brány sa rozídu do strán (`--krivka-clona`, 0,5 s), kamera
vojde na 1,05 (`--krivka-kamera`), štítky vyjdú (`--krivka-vyjazd`, 0,26 s), fotka sa usadí do rámu úvodu (0,52 s,
13 kľúčových snímok ease in-out, len `transform`), prelnutie 90 ms do papiera úvodu, pečiatka „Náš dvor“
(`--krivka-pecat`, jediný prekmit), preskočenie `--dlzka-pusti`. Rozpočet: 0 dlhých snímok počas pohybu brány,
scenár sa vytvorí pozastavený vopred v nečinnom čase a v snímke otvorenia sa len spustí (do 2 ms pri CPU 4×).
Pri „obmedziť pohyb“, bez JS, pri tlači a šetrení dát neexistuje.

**Prechody medzi stránkami** (View Transitions medzi dokumentmi, `@view-transition{navigation:auto}`). Typ určí skript
v `<head>` pri odchode zo stránky (`pageswap`) a odovzdá ho novej stránke (`pagereveal`, `sessionStorage`):
- `dalej` – bežný odkaz a Vpred: 0–150 ms stará stránka odíde 8 px hore do papiera, 150–480 ms nová príde 16 px zdola
  (nová začne, až keď stará skončila, texty nie sú nikdy cez seba).
- `spat` – Späť v histórii, drobčeky a odkaz Späť: rovnako, smer je opačný.
- `strih` – hlavné menu, menu na telefóne, päta, spodná lišta a tlačidlá úvodu: nová stránka za 0,5 s vyjde zdola ako
  list papiera cez starú, stará len mierne ustúpi (nestmavne, nezmenší sa).
- **zdieľaná fotka** (`foto`): ťuk na dlaždicu katalógu, pásu zásob alebo novinky. Fotka dlaždice za 0,44 s preletí
  a zväčší sa na fotku hlavičky stránky (okno mení veľkosť a orezáva). Pri Späť sa fotka hlavičky zmenší späť do dlaždice
  a dlaždica sa ukáže až na konci letu. Ak je v hlavičke iná fotka ako na dlaždici, počas letu sa prelínajú (typ
  `prelnutie`). Pri dlaždici katalógu letí aj názov a stane sa nadpisom H1 (`nadpis`, len rovnaký text v jednom riadku);
  na telefóne odsek pod H1 počká, kým nadpis dosadne, aby letiaci nadpis nešiel cez text.
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

**Odhalenia pri posune** (CSS `animation-timeline: view()`, beží v kompozítore): nadpisok, nadpis, odsek a tlačidlo sekcie
vyjdú zdola za sebou, karty v mriežke podľa stĺpca, fotky sa otvoria ako okno kina (pásy papiera `scaleY`, nie
`clip-path`) a dosadnú, štítok akcie dopadne ako pečiatka, fotka pásu Doprava ide pomalšie než stránka (namiesto
nekonečného driftu). Prehliadač bez časovej osi posunu má objavovanie cez IntersectionObserver v `site.js`. Odhalenia
sú len pre obrazovku (`@media screen`), pri tlači je všetko viditeľné (`tlac-zf.mjs`).

**Ovládacie prvky:** stlačenie tlačidiel (0,97) a dlaždíc (0,985) za 80 ms, odozva pod myšou len na zariadení s myšou
(šípka v páse názvu dlaždice, zdvih štítkov, podčiarknutie menu), krúžok fokusu 3 px, menu na telefóne s položkami
za sebou, výsledky hľadania sa vysunú, lightbox prenesie fotku z náhľadu a pri zatvorení ju vráti. Pás značiek zastaví
myš, fokus aj tlačidlo „Zastaviť pohyb“; bez JS a pri „obmedziť pohyb“ je to statický zoznam, ktorý sa dá posúvať.

**Ako vypnúť:**
- prechody medzi stránkami: v `site.css` `@view-transition{navigation:auto}` → `navigation:none`,
- len zdieľanú fotku na počítači: `@media (min-width:1001px){::view-transition-group(foto){animation-duration:0s}}`,
- odhalenia pri posune: zmazať blok `@supports (animation-timeline:view())` v časti 4 Pohybového systému (obsah ostane
  viditeľný),
- vstup hlavičky podstránky: zmazať blok `@media` v časti 3 Pohybového systému,
- uvítanie pred úvodom: `VYP = 1` v `zdroj/uvitanie-head.js` a `python3 -I zdroj/uvitanie_vloz.py .` (časť Úvod),
- celý pohyb pre jedného návštevníka: nastavenie systému „obmedziť pohyb“.

**Na počítači** (od 1001 px) sa fotka a nadpis neprenášajú letom, ale objavia sa rovno v hlavičke, a strih z menu je
ako „ďalej“: v meraní v Chromiu bez grafickej karty mal let a strih celou stránkou na počítači viac dlhých snímok
(pravidlo `@media (min-width:1001px)` v časti 2 Pohybového systému; na počítači s grafickou kartou sa dá overiť a zmazať).
Podčiarknutie menu letí aj na počítači.

**Testy** sú v `richtarik/dokoncenie/nastroje/`: `prechody-zf.mjs` (prechody na 8 typoch stránok tam aj späť, typy,
mená, dlhé snímky, prázdna dlaždica pri Späť, režim bez podpory), `scenar.mjs` (presný storyboard prechodu: animácie
sa zastavia a nastavia na časy), `posun-zf.mjs` (posun 30 × 120 px, pripnuté prvky, CLS, kotvy), `staticke-zf.mjs`
(bez JS, „obmedziť pohyb“: skryté prvky a bežiace animácie), `koniec-zf.mjs` (odhalenia dobehnú aj na konci stránky),
`osi-zf.mjs` (každá animácia pri posune sa riadi posunom stránky, nie rámom s `overflow: hidden`), `lightbox-zf.mjs`
(storyboard lightboxu), `mikro-zf.mjs` (odozva ťuknutí, fokus, pás značiek), `tlac-zf.mjs` (tlač: nič priesvitné ani
posunuté), `bfcache-zf.mjs` (Späť a Vpred z vyrovnávacej pamäte prehliadača, v plnom Chromiu: `KANAL=chromium`)
a `harok-zf.py` (jas snímok a hárky), `uvitanie-zf.mjs` (uvítanie pred úvodom: kontroly a A/B meranie).

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
- **Titulok** najviac 60 znakov vo vzore „… | Stavebniny Richtárik Nitra“, **popis** 120 – 155 znakov z celých viet,
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
