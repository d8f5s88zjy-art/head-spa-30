# Pohybový systém webu Stavebniny Richtárik (zf, 5. 11. 2026)

Jeden pohybový jazyk pre celý web: úvod, prechody medzi stránkami, vstup hlavičky podstránky, odhalenia sekcií pri posune
a ovládacie prvky. Kód je v strome `hs-richtarik-obnova/stavebniny-richtarik`:

- `assets/site.css`, časť **„Pohybový systém celého webu“** (na konci súboru) a časť **„Úvod zo skutočných fotiek dvora“**
  (krivky `--krivka-*` a pohyb úvodu),
- `zdroj/prechody.js` (zdroj skriptu prechodov, `build.py:prechody_head()` ho zmenší a vloží do `<head>` každej stránky,
  v `index.html` je ručne a `kontrola_uvodu()` overí zhodu),
- `assets/site.js` (úvodný strih zásob, lightbox, pás značiek, záloha odhalení cez IntersectionObserver).

## 1. Zásady

1. **Animuje sa len `transform`, `translate`, `scale` a `opacity`.** Žiadne `clip-path` na veľkej ploche (v koncepte C zhodil
   kompozítor), žiadne animované `width`, `padding` ani `top` (výnimka: skupina zdieľanej fotky pri prechode, ktorú rieši
   prehliadač).
2. **Nič sa nepripína a posun sa nezamyká.** Odhalenia pri posune sú viazané na polohu posunu (CSS `animation-timeline:
   view()`), nie na pripnutú sekciu. Rýchlosť a smer posunu má vždy zákazník.
3. **Žiadne tmavé plochy ani záclony.** Podklad prechodov je papier `--paper` (#faf8f4), clony fotiek sú pásy papiera alebo
   malty, nikdy tmavá farba. Text nikdy nie je priehľadnejší ako 0,2.
4. **Obsah nečaká na efekt.** Konečný stav je obyčajné HTML a CSS, pohyb sa len pridáva. Bez JS, pri „obmedziť pohyb“
   a v prehliadači bez podpory je všetko hneď v konečnom stave. Prechod stránky trvá najviac 0,5 s a ťuknutie alebo kláves
   ho hneď ukončí (`skipTransition`).
5. **Bez otáčania a poskakovania.** Jediný prekmit má pečiatka štítku (`--krivka-pecat`, raz pri vstupe). Výtlačky v strihu
   úvodu ležia mierne natočené, ale ich pohyb je len posun a priehľadnosť.
6. **Choreografia:** najprv upratať (odchod), potom hlavný ťah (zdieľaná fotka, nadpis), potom detaily (text, linka, clona).
7. **Naraz jeden pohyb.** Keď stránka prišla prechodom, vstup hlavičky sa nespustí (prechod je vstup). Na počítači
   sa fotka a nadpis neprenášajú letom (meranie bez grafickej karty, README).
8. **Tlač a čítačky:** odhalenia pri posune len pre obrazovku (`@media screen`), pri tlači je všetko viditeľné a tlačidlo
   „Zastaviť pohyb“ sa netlačí.

## 2. Premenné

| premenná | hodnota | použitie |
|---|---|---|
| `--dlzka-tlak` | 80 ms | stlačenie tlačidla, dlaždice, ikon |
| `--dlzka-pusti` | 160 ms | uvoľnenie, prelnutie na konci letu |
| `--dlzka-kratka` | 180 ms | výsledky hľadania, skrytie záberov úvodu |
| `--dlzka-hover` | 240 ms | odozva pod myšou (šípka, štítok, podčiarknutie) |
| `--dlzka-von` | 150 ms | stará stránka odíde |
| `--dlzka-dnu` | 330 ms | nová stránka príde (oneskorenie = `--dlzka-von`) |
| `--dlzka-let` | 440 ms | zdieľaná fotka, nadpis a podčiarknutie menu letia |
| `--dlzka-strih` | 500 ms | strih zdola z menu |
| `--dlzka-stredna` | 360 ms | pečiatka štítku na úvode |
| `--dlzka-vstup` | 620 ms | vstup H1 a odseku hlavičky podstránky |
| `--dlzka-riadok` | 800 ms | riadok H1 úvodu vyjde z drážky |
| `--krivka-von` | `cubic-bezier(.4,0,1,1)` | odchod: zrýchľuje |
| `--krivka-dnu` | `cubic-bezier(.2,.7,.2,1)` | príchod a odozva: rýchly štart, mäkké dosadnutie |
| `--krivka-let` | `cubic-bezier(.3,0,.15,1)` | let zdieľaného prvku |
| `--krivka-vyjazd` | `cubic-bezier(.2,.75,.2,1)` | text a bloky vychádzajú |
| `--krivka-clona` | `cubic-bezier(.7,0,.2,1)` | pásy papiera, strih |
| `--krivka-kamera` | `cubic-bezier(.22,.6,.3,1)` | pomalé dosadnutie fotky |
| `--krivka-dopad`, `--krivka-odchod`, `--krivka-pecat` | | strih zásob v úvode |
| `--krok-cas` | 70 ms | stupňovanie v čase |
| `--krok-posun` | 36 px | stupňovanie pri posune: ďalší stĺpec mriežky začne o 36 px posunu neskôr |
| `--draha` | 200 px | blok je na mieste po 200 px posunu od vstupu do okna |

## 3. Katalóg pohybu

Rozpočet: „kompozítor“ znamená, že animácia beží mimo hlavného vlákna (transform/opacity, pri posune časová os v CSS).
„Obmedziť pohyb“ = `prefers-reduced-motion: reduce`.

### 3a. Úvod (len `index.html`, scenár z1, v zf bez otáčania)

| prvok | spúšťač | trvanie | krivka | rozpočet | obmedziť pohyb / bez JS |
|---|---|---|---|---|---|
| okno kina: 2 pásy papiera sa stiahnu | načítanie (`uv-ide`) | 0,2–1,05 s | `--krivka-clona` | 2 vrstvy, kompozítor | pásy nie sú |
| kamera dosadne na fotke dvora | načítanie | 0–2,9 s, raz | `--krivka-kamera` | 1 vrstva | fotka stojí |
| H1 po riadkoch z drážky | načítanie | 0,12–1,06 s | `--krivka-vyjazd` | 2 riadky | text stojí |
| strih zásob: 4 výtlačky dopadnú, kôpka odíde, pečiatka „Náš dvor“ | zábery dekódované, ≥ 1,0 s | 1,0–4,0 s | `--krivka-dopad`, `--krivka-odchod`, `--krivka-pecat` | 1 animácia transformácie na prvok | zábery sa nestiahnu |
| fotka dvora pri odchode ide pomalšie | posun (`view()`) | počas odchodu úvodu | lineárne | kompozítor, 0 ms JS | statická |

### 3b. Prechody medzi stránkami (všetkých 75 stránok)

| prvok | spúšťač | trvanie | krivka | rozpočet | obmedziť pohyb / bez podpory |
|---|---|---|---|---|---|
| **dalej**: stará stránka 8 px hore do papiera, nová 16 px zdola | bežný odkaz, Vpred | 0–150 ms odchod, 150–480 ms príchod | `--krivka-von`, `--krivka-dnu` | 2 snímky stránky | okamžitá navigácia |
| **spat**: smer opačný | Späť, drobčeky, odkaz Späť | rovnako | rovnako | rovnako | okamžitá navigácia |
| **strih**: nová stránka vyjde zdola ako list papiera, stará ustúpi o 6 % | hlavné menu, menu na telefóne, päta, spodná lišta, tlačidlá úvodu | 500 ms | `--krivka-clona` | 2 snímky, jemný tieň hrany (8 %) | okamžitá navigácia |
| **foto**: fotka dlaždice letí do hlavičky (okno mení veľkosť, fotka v ňom) | dlaždica katalógu, zásoby, novinky; Späť opačne | 440 ms | `--krivka-let` | 1 skupina (šírka a výška: hlavné vlákno) | bez letu |
| **prelnutie**: iná fotka na dlaždici ako v hlavičke | doplnok k foto | stará zmizne v prvých 60 % letu | lineárne | | |
| **nadpis**: názov dlaždice sa stane H1 | dlaždica katalógu, rovnaký text v jednom riadku | 440 ms | `--krivka-let` | 1 skupina, ostrá snímka H1 | bez letu |
| odsek pod H1 počká, kým nadpis dosadne (telefón) | let `nadpis`, typ `dalej`, ≤ 1000 px | 0–264 ms priehľadný, 264–440 ms sa objaví | lineárne | 1 vrstva | – |
| **ciara**: podčiarknutie aktívnej položky menu prejde k novej | každý prechod na počítači | 440 ms | `--krivka-let` | 1 malá skupina | bez letu |
| lišta a spodná lišta stoja | každý prechod | – | – | 0 | – |
| **počítač od 1001 px**: fotka a nadpis bez letu (objavia sa rovno v hlavičke), strih ako „ďalej“ | každý prechod na počítači | 0 s / 150 + 330 ms | – | menej vrstiev v pohybe naraz | – |
| Späť na stránku načítanú znova: prelnutie do dlaždice počká na dekódovanie fotky dlaždice | Späť bez vyrovnávacej pamäte | najviac +0,9 s | – | `site.js` (vtCakaj) | – |
| príprava stránky pri dotyku dlaždice | `pointerdown` (Speculation Rules, conservative) | – | – | stiahne cieľ o ~100 ms skôr | bez podpory nič |
| prerušenie ťuknutím alebo klávesom | `pointerdown`, `keydown` | okamžite | – | – | – |

### 3c. Vstup hlavičky podstránky (pri načítaní bez prechodu: priamy odkaz, obnovenie, prehliadač bez prechodov)

| prvok | spúšťač | trvanie | krivka | rozpočet | obmedziť pohyb / bez JS |
|---|---|---|---|---|---|
| H1 vyjde 22 px zdola z 0,2 | načítanie | 0,06–0,68 s | `--krivka-vyjazd` | 1 vrstva | stojí |
| linka nadpisku sa nakreslí | načítanie | 0,12–0,72 s | `--krivka-vyjazd` | 1 malá vrstva | celá |
| úvodný odsek | načítanie | 0,16–0,78 s | `--krivka-vyjazd` | 1 vrstva | stojí |
| drobčeky z 0,2 | načítanie | 0–0,4 s | lineárne | | viditeľné |
| fotka hlavičky: okno kina (pásy malty) a dosadnutie z 1,06 | načítanie | 0,1–0,9 s a 0–1,2 s | `--krivka-clona`, `--krivka-kamera` | 3 vrstvy | stojí, bez pásov |
| stránka prišla prechodom (každý typ) | trieda `vt` na `<html>` (skript v `<head>`, `pagereveal`) | – | – | vstup sa nespustí, hýbe sa len prechod (A/B na počítači: s ním 89, bez neho 41 dlhých snímok, `mer/pricina`) | – |

### 3d. Odhalenia pri posune (úvod aj podstránky; len s `animation-timeline` a JS, inak IntersectionObserver alebo nič)

| prvok | spúšťač (rozsah časovej osi) | dráha | krivka | rozpočet | obmedziť pohyb / bez JS / bez podpory |
|---|---|---|---|---|---|
| nadpisok, nadpis sekcie, odsek, tlačidlo za sebou (`main .head`) | vstup do okna, `--k` 0–2 | 200 px + 36 px na krok | lineárne k posunu | kompozítor | viditeľné; bez podpory `.head` cez IO |
| linka nadpisku | vstup, 0–180 px | 180 px | lineárne | | celá |
| karty v mriežke (kategórie, akcie, značky, výrobky, kontakty, čísla) podľa stĺpca | vstup, `--k` podľa stĺpca | 200 px + 36 px | lineárne | 1 vrstva na kartu počas vstupu | viditeľné |
| fotky (služby, O nás, kontakt, galéria, dvor v kontakte): okno kina z pásov papiera, fotka dosadne z 1,12 | vstup 0–260 px; dosadnutie po polovicu prechodu oknom | 260 px | lineárne | 3 vrstvy na fotku | viditeľné |
| pás zásob na úvode (aj vodorovný posuvník na telefóne): okno kina, fotka dosadne, štítok palety vyjde zľava, stĺpce postupne | časová os celého pásu `--zas` | 260 px + 36 px | lineárne | | viditeľné |
| novinky (vodorovný posuvník do 1100 px) | časová os pásu `--novs` | 200 px + 36 px | lineárne | | viditeľné |
| štítok akcie: pečiatka z 1,6 (bez otáčania) | vstup karty 40–200 px | 160 px | prekmit v 70 % | 1 malá vrstva | stojí |
| čísla služieb 01–06 vyjdú zľava | vstup 0–160 px | 160 px | lineárne | | stoja |
| štítok „Od roku 1997“ sa vysunie z rámu | vstup fotky | celý vstup | lineárne | | stojí |
| pás Doprava: fotka ide pomalšie než stránka (±7 %, telefón ±3 %) | celý prechod oknom | výška okna + pásu | lineárne | kompozítor, nahrádza nekonečný drift aj paralaxu skriptom | fotka stojí |
| pruh priebehu čítania | posun celej stránky (`scroll(root)`) | celá stránka | lineárne | kompozítor (predtým skript pri každom posune) | bez podpory skript |
| sekcie pod prvou a päta | `content-visibility: auto` | – | – | lacnejšia prvá snímka novej stránky | – |

### 3e. Ovládacie prvky

| prvok | spúšťač | trvanie | krivka | obmedziť pohyb |
|---|---|---|---|---|
| tlačidlo: stlačenie na 0,97 | `:active` | 80 ms dnu, 160 ms von | `--krivka-dnu` | stav bez prechodu |
| tlačidlo: zdvih o 2 px, šípka vyjde | myš (`hover: hover`) | 240 ms | `--krivka-dnu` | bez prechodu |
| dlaždice katalógu, akcií, zásob, noviniek, značiek, galérie: stlačenie na 0,985 | `:active` | 80 / 160 ms | `--krivka-dnu` | bez prechodu |
| dlaždica katalógu: šípka „→“ v páse názvu, fotka 1,04, podčiarknutie názvu | myš, fokus | 240 ms, fotka 1,1 s | `--krivka-dnu` | bez prechodu |
| štítok zásob sa zdvihne o 3 px | myš | 240 ms | `--krivka-dnu` | bez prechodu |
| štítok akcie 1,06 | myš | 240 ms | `--krivka-pecat` | bez prechodu |
| menu na počítači: podčiarknutie vyjde zľava | myš, fokus | 240 ms | `--krivka-dnu` | bez prechodu |
| menu na telefóne: panel zprava, položky postupne | otvorenie | 350 ms, položky 90 + 35 ms × n | `--krivka-vyjazd` | bez pohybu |
| bočné menu katalógu: posun o 6 px (translate, nie padding) | myš | 240 ms | `--krivka-dnu` | bez prechodu |
| aktívna služba: riadok sa posunie o 12 px | poloha v okne | 400 ms | `--krivka-dnu` | bez prechodu |
| vyhľadávanie: krúžok poľa, výsledky sa vysunú 6 px | fokus, písanie | 240 / 180 ms | `--krivka-dnu` | bez pohybu |
| lightbox: fotka sa prenesie z náhľadu (FLIP), pri zatvorení sa vráti, listovanie zo strany | klik, Esc, šípky, potiahnutie | 380 / 260 / 260 ms | `--krivka-let` | bez pohybu |
| pás značiek: 60 s na okruh, pauza myšou, fokusom a tlačidlom „Zastaviť pohyb“ (`aria-pressed`) | stále | 60 s | lineárne | statický zoznam, ktorý sa dá posúvať |
| fokus z klávesnice: krúžok 3 px | `:focus-visible` | – | – | rovnako |

## 4. Ako vypnúť

- **Všetko naraz pre jedného návštevníka:** nastavenie systému „obmedziť pohyb“.
- **Prechody medzi stránkami:** v `site.css` nahradiť `@view-transition{navigation:auto}` za `navigation:none`. Skript v `<head>`
  sa potom nespustí (nič nepomenuje).
- **Zdieľaná fotka na počítači** je od 1001 px už bez letu (`@media (min-width:1001px)` v časti 2): v meraní v Chromiu bez
  grafickej karty mal let a strih celou stránkou viac dlhých snímok ako z1. Na počítači s grafickou kartou sa dá pravidlo
  zmazať a let bude aj tam.
- **Odhalenia pri posune:** zmazať blok `@supports (animation-timeline:view())` v časti 4 Pohybového systému. Obsah ostane
  viditeľný (prehliadač bez podpory má odhalenia cez IntersectionObserver v `site.js`).
- **Vstup hlavičky podstránky:** zmazať blok `@media` v časti 3.
- **Pás značiek:** pravidlo `animation:marquee` v časti „pás značiek“.

## 5. Zdroje inšpirácie

Prevzaté sú len princípy, kód je vlastný (CSS, WAAPI a 3 kB JS, bez knižnice a CDN). Všetky zdroje navštívili rešerše
5. 11. 2026 (`richtarik/profi/inspiracia/galerie|odvetvie|technika/ZAPIS.md`).

| zdroj | princíp | čím sa web líši |
|---|---|---|
| Chrome: Profiles MPA – https://view-transitions.chrome.dev/profiles/mpa/ | zdieľaný prvok medzi dvoma HTML, mená nastavené až v `pageswap`/`pagereveal` | dlaždica → hlavička aj nadpis → H1, okno fotky orezáva, pri Späť sa prelne až na konci |
| Chrome: Off the beaten path MPA – https://view-transitions.chrome.dev/off-the-beaten-path/mpa/ | poradie „upratať, hlavný ťah, detaily“, prerender | celé do 0,5 s, prerender len pri dotyku |
| Chrome: Stack Navigator MPA – https://view-transitions.chrome.dev/stack-navigator/mpa/ | typy podľa smeru (push/pop) | papier namiesto čierneho podkladu, stará stránka nestmavne |
| Chrome for Developers: Cross-document view transitions – https://developer.chrome.com/docs/web-platform/view-transitions/cross-document | `@view-transition`, `pageswap`, `pagereveal`, typy, reload | – |
| Shopify.dev: Cancel view transitions on interaction – https://shopify.dev/docs/storefronts/themes/best-practices/performance/cancel-view-transitions-on-interaction | `skipTransition` pri `pointerdown`/`keydown` | – |
| CSS-Tricks: Cross-document view transitions gotchas – https://css-tricks.com/cross-document-view-transitions-part-1/ | `object-fit: cover` na snímkach | k tomu orezanie okna skupiny |
| scroll-driven-animations.style: Image Reveal – https://scroll-driven-animations.style/demos/image-reveal/css/ | fotka sa odhalí pri posune | pásy papiera `scaleY` namiesto `clip-path`, začiatok nie je neviditeľný |
| WebKit: Scroll-driven animations with just CSS – https://webkit.org/blog/17101/a-guide-to-scroll-driven-animations-with-just-css/ | `animation-timeline` za skratkou, rozsahy | dráhy v px, aby boli bloky skoro na mieste |
| Haven Constructions (Awwwards HM) – https://www.havenconstructions.com.au/ | slovo vyjde zdola z drážky | bez modrej opony, po riadkoch, nie po písmenách |
| Hays Woodworking – https://www.hayswoodworking.com/ | odhalenie plochou, ktorá odíde | svetlé pásy nad už viditeľnou fotkou |
| Codrops: Image Layer Animations with Clip-Path – https://tympanus.net/codrops/2023/10/31/image-layer-animations-with-clip-path | strih viacerých záberov | výtlačky cez `transform`, skutočné fotky zásob |
| Codrops: Double Image Hover – https://tympanus.net/codrops/2023/03/01/double-image-hover-effects-with-clip-path-animations/ | odozva dlaždice pri myši | šípka v páse názvu, stlačenie, žiadna druhá fotka |
| Byggmax – https://www.byggmax.se/ | postupný nástup podľa indexu | posun podľa stĺpca na časovej osi posunu |
| Petersen Tegl – https://www.petersen-tegl.dk/ | materiál ako hrdina, štítok ako na palete | papierový štítok s tehlovou hranou v páse zásob |
| DEV: Accessible marquee – https://dev.to/olpeh/modern-and-accessible-marquee-clone-with-tailwindcss-5abb | pás s pauzou, pri obmedzení pohybu posuvný | tlačidlo „Zastaviť pohyb“, pauza aj pri fokuse, bez JS statický |
| web.dev: High-performance CSS animations – https://web.dev/articles/animations-guide | len transform a opacity | – |
| A. Roselli: Don't split words into letters – https://adrianroselli.com/2026/02/you-know-what-just-dont-split-words-into-letters.html | text deliť najviac po riadkoch | – |
| Negatívne: Wienerberger SK, Porfix SK, Leitl, Jonite, Texas Materials | opona, tmavé video, dlhé čakanie | nič pred obsahom, žiadna tmavá plocha |
