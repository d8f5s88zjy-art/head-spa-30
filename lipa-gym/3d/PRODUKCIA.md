# GYM KLUB 3D – produkčný dokument

Návrh filmovej 3D prehliadky pre GYM KLUB Nitra (`lipa-gym/3d/`). Je to samostatná
varianta vedľa existujúceho webu `lipa-gym/`, ktorý zostal bez zmeny. Stránka má
`noindex`, kým ju prevádzka neschváli.

Spustenie lokálne: v koreni repozitára `python3 -m http.server 8080` a otvoriť
`http://localhost:8080/lipa-gym/3d/`. Po úprave `src/intro.js` treba spustiť `./build.sh`.

## 1. Register faktov

Overené na gymklub.sk 27. 9. 2026 (hlavná stránka, pätička, FAQ, rozvrh).

| Fakt | Hodnota | Stav | Na stránke |
|---|---|---|---|
| Názov | GYM KLUB / Gym Klub Fitness & Bodybuilding | overené | áno |
| Adresa | Výstavná 6 (Lipa Centrum), 949 01 Nitra | overené (pätička) | áno |
| Telefón | +421 944 800 394 | overené | áno |
| E-mail | info@gymklub.sk | overené | áno |
| Typy tréningov | fitness, bojové športy (MMA, Jiu Jitsu, Luta Livre), Krav Maga, Zdravý chrbát, Pilates | overené | áno, bez časov |
| Klimatizácia | „plne klimatizované“ | overené (text webu), na fotkách stropné kazetové jednotky | áno |
| Samostatný tréning | „Samostatný tréning, fitness centrum“ | overené | áno, bez hodín |
| Otváracie hodiny | FAQ: Po–Št 06:30–21:00, Pi 06:30–23:00, So–Ne 08:00–17:00. Pätička: So–Ne 08:30–18:00 | **KONFLIKT** (víkend) | nie |
| Ceny | vstup 6 €, permanentka 50 €/mesiac a ďalšie | neoverené s prevádzkou | nie |
| Platba | FAQ: „len v hotovosti“, cenník: Multisport, Upbalansea app | treba potvrdiť | nie |
| Tréneri | zoznam v menu sa líši od stránky trénerov | **KONFLIKT** | nie, len odkaz na gymklub.sk |
| Počítadlá na starom webe | nulové hodnoty | nepoužiť | nie |

Pred zverejnením treba s prevádzkou potvrdiť hodiny, cenník, spôsob platby a zoznam
aktívnych trénerov (so súhlasom s fotkami). Potom ich doplniť do sekcie `#clenstvo`
a `#treneri` a zmazať `noindex`.

## 2. Audit médií

Zdroj: 59 unikátnych fotografií a 13 videí nahraných do relácie 27. 9. 2026 (niektoré
fotky prišli viackrát, duplikáty sú vyradené podľa kontrolného súčtu).

- **Fotografie:** 1932 × 2576 px, na výšku, iPhone s ultraširokým objektívom. Metadáta
  EXIF chýbajú. Jedna fotka (`907003c1`) je poškodená, spodná polovica je čierna,
  vyradená.
- **Videá:** 3840 × 2160 HEVC Main 10, HDR (HLG, BT.2020), otočené na výšku, dĺžka
  2,5 až 6,2 s, natočené 26. 9. 2026 medzi 18:19 a 18:52. Zvuk je len ruch prostredia
  bez reči, preto titulky netreba.
- **Zóny:** tatami (6 fotiek), svetlá sála s voľnými váhami a tyrkysovými strojmi
  (20), kardio pri oknách (4), hlavná sála s nástennou maľbou GYM KLUB (14), tmavá
  funkčná zóna s červenou dráhou a rigom Life Fitness (14).
- **Ľudia:** na klipe IMG_8993 (vchod) je v skle dverí počas prvých asi 2 s odraz
  človeka, ktorý natáčal. Preto je klip `vchod` zostrihaný z IMG_8990 (zatvorené dvere,
  od 0,9 s) a IMG_8993 až od 2,3 s (recepcia bez ľudí). Na fotkách `plate-loaded`,
  `hex-svetla` a `sprint-draha` sú v zrkadlách drobné, neidentifikovateľné postavy.

Originály sa do repozitára nekopírujú (spolu asi 700 MB). Vo webe sú len odvodené súbory:

| Súbor | Zdroj | Spracovanie |
|---|---|---|
| `terasa-720.*` | IMG_8989 | HLG → SDR BT.709 (tonemapping hable), 720 × 1280, 30 fps, bez zvuku |
| `vchod-720.*` | IMG_8990 + IMG_8993 | ako vyššie, zostrih 0,9 s + od 2,3 s |
| `sala-a-720.*` | IMG_8995 | ako vyššie |
| `sala-c-720.*` | IMG_8998 | ako vyššie |
| `hlavna-sala-*` | 9e0cb490 | 640 a 1280 px šírka, AVIF / WebP / JPG, bez orezania |
| `kardio-okna-*` | 28604a63 | ako vyššie |
| `cinky-*` | ceeb6294 | ako vyššie |
| `plate-loaded-*` | 43dbcf61 | ako vyššie |
| `jednorucky-*` | 4a8527d5 | ako vyššie |
| `ring-*` | 751e5e8a | ako vyššie |
| `tatami-*` | 38aed571 | ako vyššie |
| `intro-still.*` | render 3D scény | statický záber pre obmedzený pohyb a zariadenia bez WebGL |

Videá majú 720 × 1280, nie 4K. Na webe sa zobrazujú najviac vo výške okna a menšie
súbory (0,6 až 1 MB) znamenajú plynulé načítanie aj na mobile. Nikde nie sú označené
ako 4K.

## 3. Umelecký smer

- Tmavá, hmatová estetika podľa skutočnej prevádzky: čierny kazetový strop,
  šesťuholníkové svetlá, červená šprintérska dráha, zelené rámy kladiek.
- Akcent je jedna zelená (`#c6f24a`) z rámov strojov, použitá len na čísla kapitol,
  zvýraznené slová a hlavné tlačidlo.
- Písmo: Bebas Neue na nadpisy, Manrope na text, obe lokálne, so slovenskou diakritikou.
- 3D: fyzikálne materiály (guma s opotrebením v roughness mape, chróm, vrúbkovaná
  oceľ), nízke večerné slnko ako na záberoch (18:20), atmosférický opar, jemné zrno
  len v 3D časti.
- Texty sú krátke, bez superlatívov a čísel, ktoré nemáme overené. Opis priestoru
  vychádza z toho, čo je vidno na záberoch.

## 4. Kamera a časová os

Jedno číslo `p` (0 až 1) podľa skrolovania úvodu riadi 3D scénu, texty, clonu aj zvuk.
Za úvodom riadi pás médií poloha jednotlivých krokov. Všetko sa počíta z polohy,
takže návrat hore, obnovenie v strede aj priamy odkaz na kotvu dajú rovnaký obraz.

| p | Záber | Obsah |
|---|---|---|
| 0–0,2 | nad vrstvou mrakov, 2,2 km, kamera z boku | „Dva kilometre nad mestom…“ |
| 0,2–0,6 | prechod vrstvami mrakov, kamera sa stočí nadol, pod ňou mozaika mesta | „Dole platí gravitácia…“ |
| 0,6–0,72 | posledné metre, zrýchlenie, činka sa ustáli na plochej stene | – |
| 0,72 | dopad na teraco pred vchodom: krátky náraz kamery (12 mm, tlmený), prach, kruh | úder (ak je zapnutý zvuk) |
| 0,73–0,9 | kamera pri zemi, scéna stmavne | GYM KLUB · Výstavná 6, Nitra |
| 0,83–0,97 | kruhová clona z miesta dopadu s obrysom kotúča, otvára skutočný záber terasy | – |
| 1 | prehliadka: rám sa z celej obrazovky zmenší doprava (na mobile ostáva celá obrazovka) | kapitoly 01–04 |

Kapitoly prehliadky: 01 Vstup (terasa, vchod), 02 Hlavná sála (tmavá zóna, sála
s maľbou, kardio), 03 Voľné váhy (jednoručky, nakladacie stroje, stojan),
04 Funkčná a bojová zóna (dráha, rig, tatami). Potom Tréneri, Členstvo, Kontakt a pätička.

## 5. Technické riešenie

- Čisté HTML, CSS a JS ako zvyšok repozitára. Jediná knižnica je three.js 0.186.1,
  zbalená cez esbuild len s použitými časťami do `assets/intro.js` (575 kB, 151 kB gzip).
  React, fyzikálny engine, knižnica na plynulé skrolovanie ani animačná knižnica
  nie sú potrebné.
- Jedno plátno a jeden renderer. Pomer pixelov je obmedzený na 1,75 (mobil 1,5).
  Ak snímky trvajú dlhšie ako 25 ms, rozlíšenie sa raz zníži. Scéna sa vykresľuje
  len pri zmene, po 12 s nečinnosti a pri skrytej karte stojí a za úvodom sa vypne.
- Zem aj mraky sú sústredné prstence husté pri mieste dopadu. Pôvodný štvorec 40 km
  so 2 trojuholníkmi strácal pri kamere 20 cm nad zemou presnosť a zem sa rozpadla
  (zistené a opravené počas testov).
- Postprocesing v jednom prechode: radiálne rozmazanie podľa rýchlosti mimo stredu
  (činka ostáva ostrá), opar pri prechode mrakom, vinetácia, zrno.
- Videá: `muted`, `playsinline`, `preload="none"`. Načíta sa len aktívne a nasledujúce,
  hrá len aktívne, ostatné sú zastavené.
- Záložné režimy:
  - **obmedzený pohyb:** úvod na jednu obrazovku, statická kompozícia, videá sa
    nespúšťajú (ukážu sa plagáty);
  - **bez WebGL alebo pri chybe načítania:** statický záber, prehliadka funguje ďalej;
  - **bez JavaScriptu:** obyčajná stránka s textami.
- Zvuk je predvolene vypnutý. Po zapnutí hrá syntetizovaný vietor podľa rýchlosti
  pádu a nízky úder pri dopade (Web Audio, žiadne súbory).
- Mapa sa načíta až po kliknutí, dovtedy žiadne požiadavky na tretie strany.

## 6. Kontroly (27. 9. 2026)

Prehliadač: Chromium 141 (Playwright) so softvérovým WebGL (SwiftShader). Na fyzickom
zariadení ani v Safari či Firefoxe testované **nebolo**.

- Snímky celej časovej osi (10 bodov úvodu, 12 krokov prehliadky, bloky) pri
  1440 × 900 a 390 × 844.
- Návrat hore cez dopad až na začiatok: clona sa zatvorí, scéna sa vráti.
- Priamy odkaz `#sila` a obnovenie stránky v strede: správne médium, bez skoku.
- Zmena veľkosti okna 1280 → 390 px: plátno sa prispôsobí, bez vodorovného posúvania.
- Preskočenie intra myšou aj klávesom Enter: presun na `#vstup`.
- Poradie klávesu Tab: odkaz na preskočenie, logo, navigácia, zvuk, preskočiť intro,
  odkazy v obsahu, všetky s viditeľným zameraním.
- Obmedzený pohyb: bez 3D, videá stoja, obsah plynie priamo.
- Zablokované WebGL a zablokovaný `intro.js`: statický záber, bez chýb v konzole.
- Obrázky majú alt text a rozmery, videá `aria-label`. Stránka má jeden `h1`
  a sedem `h2`.
- Kontrast textu voči pozadiu `#0c0d0f`: hlavný text 17,2:1, sekundárny 8,6:1,
  popisky 6,0:1, zelená 15:1, text na zelenom tlačidle 15:1.
- Konzola: bez chýb (jediná chyba 404 bol chýbajúci statický záber, doplnený).

## 7. Obmedzenia

- Činka je procedurálny model v reálnom čase. Je vierohodná, ale nie fotoreálna
  ako predrenderovaný film. Pohľad zhora na „mesto“ je procedurálna mozaika, nie
  skutočná Nitra: mapové ani letecké podklady Nitry v projekte nie sú a generovať
  ich ako skutočné by bolo zavádzajúce. Pre vyšší realizmus by pomohol predrenderovaný
  úvod (Blender) a letecký záber Chrenovej od prevádzky.
- Výkon bol meraný len v softvérovom vykresľovaní. Na skutočných GPU treba zmerať
  čas snímky, najmä na starších Androidoch.
- Otváracie hodiny, cenník, platby a tréneri zámerne chýbajú, kým ich prevádzka
  nepotvrdí (pozri register faktov).
- Klipy trvajú 2,5 až 6 s a hrajú v slučke. Dlhšie zábery, ideálne jeden plynulý
  prechod od terasy po sálu, by prehliadku zlepšili.
