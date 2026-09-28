# GYM KLUB – prechádzka fitkom: produkčný dokument

Stránka `lipa-gym/3d/` je prechádzka celým fitkom GYM KLUB Nitra na skutočných záberoch
z prevádzky. Je to samostatná varianta vedľa existujúceho webu `lipa-gym/`, ktorý zostal
bez zmeny. Stránka má `noindex`, kým ju prevádzka neschváli.

Zadanie od klienta: žiadny úvod s padajúcou činkou; prechádzka gymom „tak, aby ho bolo vidno
celý“, všetko skutočné a ostré. Po verzii so zastávkami a kapitolami (pôsobila ako katalóg)
chce klient elegantnú skrolovaciu animáciu fitka v reálnom prostredí, počas ktorej sa
odkrývajú overené informácie o fitku: bez kapitol, bez náhľadov a zoznamov.

Spustenie lokálne: v koreni repozitára `python3 -m http.server 8080` a otvoriť
`http://localhost:8080/lipa-gym/3d/`. Žiadne zostavovanie ani knižnice nie sú potrebné.

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
| Otváracie hodiny | FAQ: Po–Št 06:30–21:00, Pi 06:30–23:00, So–Ne 08:00–17:00. Pätička: So–Ne 08:30–18:00 | **KONFLIKT** (víkend) | nie |
| Ceny | vstup 6 €, permanentka 50 €/mesiac a ďalšie | neoverené s prevádzkou | nie |
| Platba | FAQ: „len v hotovosti“, cenník: Multisport, Upbalansea app | treba potvrdiť | nie |
| Tréneri | zoznam v menu sa líši od stránky trénerov | **KONFLIKT** | nie |

Pred zverejnením treba s prevádzkou potvrdiť hodiny, cenník, spôsob platby a zoznam
aktívnych trénerov. Potom doplniť sekciu `#hodiny` a zmazať `noindex`.

## 2. Médiá

Zdroj: 59 unikátnych fotografií (iPhone, ultraširoký objektív, 1932 × 2576 px na výšku)
a 13 videí (3840 × 2160 HEVC HDR HLG, otočené na výšku, 2,5 až 6,2 s) z 26. 9. 2026.
Duplikáty sú vyradené podľa kontrolného súčtu, poškodená fotka `907003c1` sa nepoužíva.
Originály sa do repozitára nekopírujú.

Spracovanie: fotky P3 → sRGB, export 1932 a 1280 px (AVIF 62 / WebP 84 / JPG 86);
z videí (HLG → SDR BT.709, tonemapping hable) sú použité len ostré snímky 2160 a 1280 px:
terasa (IMG_8989, 0,1 s), dvere zvonku (IMG_8990, 2,1 s) a recepcia (IMG_8993, 2,7 s).
Zábery približovania k dverám sú buď mäkké (IMG_8981–8984, 8990 pred 2 s), alebo majú
v skle odraz človeka (IMG_8993 pred 2,2 s). Videoklipy sa na stránke neprehrávajú.

**Ľudia:** klip IMG_8993 (vchod) má počas prvých asi 2,2 s v skle dverí odraz človeka,
ktorý natáčal, preto je snímka recepcie až z 2,7 s (skontrolovaná, bez osôb). Klip IMG_8995 (odraz osoby v zrkadle) sa nepoužíva vôbec. Vyradené fotky s jasne
odrazenými ľuďmi v zrkadlách: ae931f9a, b0ed9981, 67413462, e77dd2bd, de7727af, 0031fb81.
Na použitých fotkách sú nanajvýš drobné, neidentifikovateľné odrazy; sklo dverí (snímka
IMG_8990) a presklená stena na fotke f3cad8ed boli skontrolované v plnom rozlíšení.

### Zábery filmu (16, v poradí chôdze)

| # | záber | zdroj | text, ktorý sa odkryje |
|---|---|---|---|
| 01 | terasa-1 | IMG_8989, snímka 0,1 s | úvodný titulok; „Začíname na terase“ |
| 02 | vstup-1 | IMG_8990, snímka 2,1 s | Dvere pod nápisom GYM KLUB & caffee |
| 03 | recepcia-1 | IMG_8993, snímka 2,7 s | Prvá zastávka za dverami |
| 04 | hlavna-sala-1 | ded57978 | Silový tréning na strojoch |
| 05 | hlavna-sala-5 | 82585127 | – |
| 06 | hlavna-sala-3 | e604ab34 | Plne klimatizované |
| 07 | stroje-4 | 4c899013 | Denné svetlo z veľkých okien |
| 08 | stroje-1 | 50b58cdb | – |
| 09 | kardio-3 | 7729db43 | – |
| 10 | kardio-1 | ca5cd7a4 | Beh s výhľadom na stromy |
| 11 | volne-vahy-2 | 750d9d90 | Jednoručky, osi a lavice |
| 12 | jednorucky-1 | 4a8527d5 | Do tmavej časti fitka |
| 13 | funkcna-zona-3 | f3cad8ed | Šprintérska dráha pod LED svetlami |
| 14 | funkcna-zona-6 | 92861a6f | – |
| 15 | funkcna-zona-2 | 751e5e8a | Rig Life Fitness |
| 16 | tatami-2 | f56a3d44 | Samostatná miestnosť; Tréningy v GYM KLUB |

Každý záber je v `media/` ako `tour-<id>-<1932|2160>` a `-1280` v AVIF, WebP a JPG, plus
`og.jpg`; spolu 97 súborov, 37 MB. Žiadny iný súbor v `media/` nie je.
Texty vychádzajú len z registra faktov (adresa, klimatizácia, typy tréningov) a z toho, čo
je vidno na záberoch. Hodiny, ceny, platby a tréneri na stránke nie sú.

## 3. Štruktúra stránky

1. Horná lišta: logo a odkaz Kontakt.
2. Film (`#prehliadka`): jedna obrazovka prilepená počas celej dĺžky sekcie. Na prvom zábere
   sa po načítaní odkryje titulok GYM KLUB; skrolovaním kamera prechádza 16 zábermi a
   odkrývajú sa texty (malý nadpis zóny, veľký titulok, jedna veta). Na tatami sa obraz
   stmaví a ukážu sa tréningy (Fitness, MMA, Jiu Jitsu, Luta Livre, Krav Maga, Zdravý chrbát,
   Pilates). Film končí stmievačkou. Tenký zelený pás dole ukazuje priebeh.
3. Kontakt (`#kontakt`): adresa, telefón a e-mail ako text aj odkaz, mapa v novom okne,
   poznámka, že hodiny, cenník a rozvrh povedia telefonicky alebo e-mailom.
4. Pätička: adresa, odkaz na klasickú verziu webu a gymklub.sk.

## 4. Umelecký smer

- Skutočné ostré zábery, tmavý filmový obraz (vineta a stmavený spodok kvôli textu), jeden
  akcent `#c6f24a` (zelená z rámov strojov).
- Pohyb kamery: každý záber sa počas skrolovania pomaly približuje k miestu, kam sa ide
  (bod medzi `focus` a `walk`); pri prechode sa záber zrýchlene priblíži a zmizne a pod ním
  je už nasledujúci priestor, takže pôsobí ako prelet ďalej do fitka.
- Texty sa odkrývajú po riadkoch (priehľadnosť a posun) a pri skrolovaní späť sa skryjú
  obrátene. Písmo Bebas Neue na titulky, Manrope na text, lokálne, so slovenskou diakritikou.

## 5. Technické riešenie

- Čisté HTML, CSS a JS (`index.html`, `assets/style.css`, `assets/film.js`), bez knižníc,
  bez zostavovania a bez cudzích požiadaviek. Texty sú priamo v HTML, s JS ich riadi
  `data-sc` (záber), `data-a` a `data-b` (od kedy do kedy v obrazovkách skrolovania).
  Dĺžka záberu je `data-len`, prechod trvá 0,45 obrazovky.
- Jednotka skrolovania je výška scény (100lvh), takže skrývanie adresného riadka na mobile
  nič neposúva; texty dole sa odsadzujú o rozdiel `100lvh - 100svh`, aby boli vždy vidno.
- Slučka `requestAnimationFrame` beží len pri zmene polohy, kamera ide za skrolovaním so
  zotrvačnosťou 85 ms, veľký skok (odkaz Kontakt) dorovná naraz. Mení sa iba `transform`
  a `opacity` a zapisuje sa len zmenená hodnota.
- V DOM sú vykreslené najviac štyri zábery (predošlý, aktuálny a dva nasledujúce); tie sa
  vopred načítajú a dekódujú. Kým nie je ďalší záber pripravený, predošlý nezmizne, takže
  nikdy nebliká čierna.
- Prehliadač vyberá veľkosť cez `srcset`/`sizes` (telefóny s 3× displejom dostanú 1932 px,
  aby záber ostal ostrý aj pri priblížení), formát AVIF, WebP alebo JPG.
- Obmedzený pohyb: bez priblíženia a posunov, len prelínanie. Bez JS: úvodný záber s
  titulkom a všetky texty pod sebou.

## 6. Kontroly (28. 9. 2026, Chromium cez Playwright)

- iPhone 13 (emulácia, procesor spomalený 4×), plynulé skrolovanie celým filmom kolieskom:
  medián aj 95. percentil snímky 16,7 ms, žiadna snímka nad 50 ms.
- 1440 × 900: medián 16,7 ms, 95. percentil 33,4 ms (softvérové vykresľovanie bez GPU).
- Konzola bez chýb a varovaní, žiadna požiadavka s chybou; bez vodorovného pretečenia na
  šírkach 320, 375, 768, 1024, 1440 a 1920 px (začiatok, stred filmu aj koniec stránky).
- Snímky obrazovky na 13 polohách filmu na telefóne aj počítači (titulok, texty, prechody,
  tréningy, stmievačka, kontakt).

## 7. Obmedzenia

- Pohyb kamery je priblíženie ostrých fotiek, nie video: súvislý záber chôdze celým fitkom
  neexistuje (videá majú 2,5 až 6,2 s a väčšina je mäkká alebo s odrazom osoby). Súvislé
  4K video chôdze na gimbale by umožnilo skutočný prelet.
- Na širokej obrazovke je z fotky na výšku vidno pás okolo bodu záujmu (asi 47 % výšky,
  35 % pri záberoch terasy, vchodu a recepcie). Fotky na šírku by počítaču pomohli.
- Tatami je mäkšie než ostatné zábery (biela plochá miestnosť).
- Testované len v Chromium; treba overiť v Safari na iPhone a Macu a na Androide.
- Otváracie hodiny, cenník, platby a tréneri zámerne chýbajú, kým ich prevádzka nepotvrdí.
