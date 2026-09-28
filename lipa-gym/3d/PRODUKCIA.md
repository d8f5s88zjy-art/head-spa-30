# GYM KLUB – prechádzka fitkom: produkčný dokument

Stránka `lipa-gym/3d/` je prechádzka celým fitkom GYM KLUB Nitra na skutočných záberoch
z prevádzky. Je to samostatná varianta vedľa existujúceho webu `lipa-gym/`, ktorý zostal
bez zmeny. Stránka má `noindex`, kým ju prevádzka neschváli.

Zadanie od klienta: žiadny úvod s padajúcou činkou; prechádzka gymom „tak, aby ho bolo vidno
celý“, všetko skutočné a ostré. Verzia so zastávkami a kapitolami pôsobila ako katalóg,
skrolovací film pôsobil zasekane. Posledné zadanie: zákazník si má pozrieť celé fitko skôr, než
príde; profesionálne, bez popisov farieb a toho, čo je vidno na fotkách; „ako 3D stránka“.
Potom: úvod má pôsobiť ako úvodná animácia z inej verzie (artefakt 63b74e51: three.js scéna,
LED šesťuholníky sa s blikaním rozsvietia, kamera letí po dráhe), ale realisticky.

Spustenie lokálne: v koreni repozitára `python3 -m http.server 8080` a otvoriť
`http://localhost:8080/lipa-gym/3d/`. Žiadne zostavovanie ani knižnice nie sú potrebné.

## 00. Prepracovanie (audit 28. 9. 2026)

Audit na 360, 768 a 1440 px ukázal: úvod bol prvé 1 až 3 s tmavý a bez textu, prvé dve obrazovky
zaberala animácia, adresa, hodiny a cena neboli na úvode, náhľady v galériách sa načítavali
v 1280 px (O fitku 5 až 7,7 MB), nadpisy boli všeobecné a texty o priestoroch príliš krátke.

Zmeny:
- Úvod: text sa odkryje hneď (najneskôr po 0,9 s), LED svetlá sa rozsvecujú za ním; nadpis
  „Fitko a bojové športy v Lipa Centre“ s adresou nad ním; úvod skrátený z 230vh na 165vh.
- Pás rýchlych informácií pod úvodom: adresa s navigáciou, hodiny, cena vstupu, telefón.
- Menu: „Cenník“ namiesto „Členstvá“; na tablete tlačidlo Naplánovať návštevu v lište; na mobile
  spodná lišta Cenník, Volať, Naplánovať návštevu.
- Texty: informatívne nadpisy (napr. „Jeden vstup za 6 €, mesiac za 50 €“), vybavenie každého
  priestoru podľa fotiek, prvá návšteva v 4 krokoch, podmienky platby, pomocné texty formulára.
- Značky „Doplniť: …“ pri každom chýbajúcom alebo nepotvrdenom údaji.
- Náhľady 480 px (AVIF, WebP, JPG) pre galérie a dlaždice: O fitku na mobile 1,3 MB (predtým 5,2),
  úvod 0,7 MB (predtým 1,9); fotky sály Panda aj v AVIF.
- Slovenská typografia: pevná medzera za jednopísmenovými predložkami a pred €.

## 0. Web s 5 stránkami (aktuálny stav)

Zadanie: kompletný, luxusne pôsobiaci web fitka s cestou k návšteve a členstvu, mobil ako prvý,
bez vymyslených cien, hodín a recenzií; chýbajúce údaje viditeľne označiť.

| Stránka | Obsah |
|---|---|
| `index.html` | úvod so svetelnou 3D scénou („Tu sa nehrá na fitko. Tu sa trénuje.“, Pozrieť členstvá, Naplánovať návštevu), prečo GYM KLUB, ukážka priestorov (priestorová fotka + 4 dlaždice), služby, členstvá, prvá návšteva |
| `o-fitku.html` | 7 priestorov s priestorovou fotkou a galériou 30 fotiek, fotky na celú obrazovku, zázemie |
| `clenstva.html` | 3 hlavné vstupy, porovnanie (posuvník: jednotlivé vstupy vs. permanentka), ďalšie vstupy, podmienky |
| `sluzby.html` | fitness, osobný tréning, bojové športy, Krav Maga, zdravý chrbát, pilates, výživa; týždenný rozvrh; tréneri |
| `mma.html` | Panda Fight Club Nitra (MMA, Luta Livre, Jiu Jitsu, tréner Michal Šášik): disciplíny, sála (2 fotky z gymklub.sk), rozvrh, kontakt na trénera, ocenenie Orly fyzickej aktivity 2024; na domove pás s odkazom, v službách odkaz |
| `kontakt.html` | adresa, telefón, e-mail, Instagram, Facebook, otváracie hodiny, mapa po kliknutí, formulár návštevy (pripraví e-mail), otázky |

Stránky generuje `tools/generuj.py` (spoločná hlavička, menu, pätička, spodná lišta s tlačidlami
na telefóne); všetky fakty sú v ňom na jednom mieste (`GYM`, `HOURS`, `PLANS`, `MORE`, `TERMS`,
`TIMETABLE`, `COACHES`, `ZONES`). Po úprave: `python3 tools/generuj.py` v `lipa-gym/3d`.
Panda Fight Club: zdroje pandafightclub.webnode.sk, gymklub.sk, Instagram klubu a
orlyfyzickejaktivity.eu (28. 9. 2026). Údaje prevzaté z gymklub.sk a z klasického webu `lipa-gym/` sú na stránke označené žltou značkou
**Doplniť:**; `TODO_VISIBLE = False` ich skryje, keď budú potvrdené. Recenzie z klasického webu sa
nepoužili (nie je overený zdroj).

Prechody medzi stránkami: View Transitions (`@view-transition`), v ostatných prehliadačoch
obyčajné načítanie. Úvody podstránok sa po načítaní usadia (priblíženie fotky, vysunutie textu),
sekcie sa pri skrolovaní raz odkryjú; pri obmedzenom pohybe nič z toho.

### Pred zverejnením doplniť alebo potvrdiť

1. Ceny, balíky (platnosť 10 a 20 vstupov), spôsob platby (len hotovosť?), MultiSport, Upbalansea.
2. Otváracie hodiny cez víkend (08:00 – 17:00 alebo 08:30 – 18:00) a sviatky.
3. Zoznam aktívnych trénerov a ich telefóny, rozvrh lekcií.
4. Parkovanie pri Lipa Centre (otázka na kontakte).
4a. Panda Fight Club: rozvrh (gymklub.sk Ut a Št 17:00 – 19:00, So 13:00 – 15:00; web klubu Št 16:00 – 18:00,
    So a Ne 13:00 – 15:00), vchod do sály zo zadnej strany budovy, súhlas klubu s použitím mena, loga a fotiek.
5. Fotky z tréningov a lekcií (ľudia so súhlasom), fotky trénerov; farby a logo vo vektore.
6. Cieľová skupina a hlavný cieľ webu, ak má byť text zameraný inak (napr. študenti, bojové športy).
7. Spracovanie formulára bez e-mailového programu (služba typu Formspree), ak ho chcete.
8. Doména a finálna adresa webu (canonical, og:image), potom odstrániť `noindex` a značky OVERIŤ.

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

### Fotky (30, v poradí chôdze, 7 priestorov)

| # | priestor | fotky (id) | zdroj |
|---|---|---|---|
| 01 | Príchod | terasa-1, vstup-1, recepcia-1 | snímky z videí IMG_8989 (0,1 s), IMG_8990 (2,1 s), IMG_8993 (2,7 s) |
| 02 | Hlavná sála | hlavna-sala-1, -2, -4, -5, -3, -6 | ded57978, 9a523572, 1a601891, 82585127, e604ab34, 81d98737 |
| 03 | Sála so strojmi | stroje-4, -1, -2, -3 | 4c899013, 50b58cdb, 30d967db, 31539524 |
| 04 | Kardio | kardio-3, -1, -2 | 7729db43, ca5cd7a4, 39186e4d |
| 05 | Voľné váhy | volne-vahy-1, -2, -3, jednorucky-1 | ea0dcc02, 750d9d90, b57b28e1, 4a8527d5 |
| 06 | Funkčná zóna | funkcna-zona-4, -1, -2, -5, -3, -6, -7 | a08cf80a, 335ed77e, 751e5e8a, 101780bb, f3cad8ed, 92861a6f, 4f66d594 |
| 07 | Tatami | tatami-1, -2, -3 | 38aed571, f56a3d44, b95c2f9e |

Každá fotka je v `media/` ako `tour-<id>-<1932|2160>` a `-1280` v AVIF, WebP a JPG, plus
`og.jpg` a 30 hĺbkových máp a maska svetiel úvodu; spolu 212 súborov, 69 MB. Na stránke sa načíta len to, čo je v obraze
(`loading="lazy"`), veľká verzia až pri otvorení na celú obrazovku.

Viditeľné texty obsahujú len názvy priestorov, účel priestoru jednou vetou, overené fakty
(adresa, klimatizácia, typy tréningov, kontakt) a pokyny na ovládanie. Farby ani vybavenie
viditeľné na fotkách sa nepopisujú; podrobné opisy ostali len v `alt` textoch pre čítačky.

### Hĺbkové mapy (3D)

Ku každej z 30 fotiek je `media/depth-<id>.png` (512 px na šírku, 8-bit, bližšie = svetlejšie,
spolu 0,8 MB). Vyrobené 28. 9. 2026 modelom Depth Anything V2 Base (ONNX, `onnx-community/
depth-anything-v2-base`) z verzie 1280 px, vstup 518 px, normalizácia na 1. až 99,5. percentil;
potom rozšírenie popredia o 2 px (max filter 5) a rozmazanie 2 px, aby sa hrany popredia pri
posune netrhali. Mapy sú odhad, nie meranie; slúžia len na priestorový dojem.

### Svetlá úvodnej scény

`media/lights-funkcna-zona-7.png` (966 × 1288, RGBA, 0,2 MB) patrí k fotke funkcna-zona-7:
R = maska svetiel (jas nad 0,74, sýtosť pod 0,3, len horných 42 % obrazu, bez loga na rigu),
G = kedy sa daný kúsok zapne, B = rytmus blikania, A = rozmazaná žiara. Maska je rozdelená na
91 kúskov (Voronoiove bunky zo semien rovnomerne rozložených po maske, zodpovedajú približne
jednotlivým trubiciam); zapínajú sa od najbližších vpravo hore k vzdialeným s náhodným posunom.
Rovnaké hodnoty sú v `site.js` (`CELLS`), z nich sa počíta svetlo v miestnosti.

## 3. Štruktúra stránky

1. Lišta: logo, Prehliadka, Tréningy (skrytá pod 400 px), Kontakt; po odchode úvodu z obrazu
   dostane tmavé pozadie.
2. Úvod (230vh, obrazovka stojí): fotka funkčnej zóny v tme, LED šesťuholníky sa za 3,6 s
   po kúskoch s blikaním rozsvietia a rozsvieti sa sála; potom sa odkryje GYM KLUB, veta
   „Prezrite si celé fitko skôr, než prídete.“, tlačidlo a nápoveda „Skrolujte a vojdite
   dnu“. Skrolovaním sa kamera skloní od stropu k dráhe, priblíži sa a vojde do priestoru
   (posun podľa hĺbky), titulok odíde. Myš alebo ťah prstom kamerou jemne pohýbu.
3. Pás základných informácií: adresa, 7 priestorov a 30 fotiek, plne klimatizované.
4. Prehliadka: 7 priestorov, každý s číslom, názvom, jednou vetou, veľkou priestorovou fotkou
   (vstup-1, hlavna-sala-2, stroje-4, kardio-1, volne-vahy-2, funkcna-zona-6, tatami-2),
   počítadlom a galériou všetkých fotiek priestoru.
5. Tréningy: Fitness, MMA, Jiu Jitsu, Luta Livre, Krav Maga, Zdravý chrbát, Pilates.
6. Kontakt: adresa, telefón a e-mail ako text aj odkaz, mapa v novom okne.
7. Fotky na celú obrazovku (`dialog`): všetkých 30 fotiek v jednom páse, posun prstom,
   šípkami alebo klávesmi, popis priestoru a poradie fotky v ňom, zatvorenie krížikom alebo Esc.

## 4. Umelecký smer

- Tmavá, pokojná stránka, veľké ostré fotky, písmo Bebas Neue na nadpisy a Manrope na text,
  jeden akcent `#c6f24a`.
- Pohyb len jemný: úvodná fotka sa po načítaní pomaly usadí, titulok sa odkryje, sekcie sa pri
  príchode do obrazu raz vysunú. Nič sa nehýbe počas skrolovania.

## 5. Technické riešenie

- Čisté HTML, CSS a JS (`index.html`, `assets/style.css`, `assets/site.js`), bez knižníc a bez
  zostavovania. Skrolovanie stránky je natívne; galérie sú natívne vodorovné posúvanie
  s prichytávaním (`scroll-snap`), skript len aktualizuje počítadlo a šípky (najviac raz za
  snímku). Odkrývanie sekcií a tmavú lištu riadi `IntersectionObserver`.
- 3D: WebGL fragment shader (5 krokov hľadania povrchu po hĺbkovej mape) posúva obraz o najviac
  2 % šírky podľa hĺbky a pri prvom zobrazení kamera vojde do priestoru (popredie sa priblíži).
  Kamera sa sama pomaly pohybuje, myš (poloha) alebo vodorovný ťah prstom ju vedie; zvislý ťah
  ostáva skrolovaniu. Kontext vzniká 600 px pred príchodom do obrazu, kreslí sa len v obraze a
  pri odchode ďaleko sa uvoľní (naraz najviac 2 až 3). Fotka sa na textúru dekóduje cez
  `createImageBitmap` mimo hlavného vlákna, na dotykových zariadeniach najviac 1400 px.
  Bez WebGL a pri obmedzenom pohybe ostáva obyčajná fotka pod plátnom.
- Úvod: rovnaký shader s hĺbkou a navyše textúra svetiel. Tma = fotka × 0,035; trubica
  svieti farbou z fotky, kým sa zapína, bliká; svetlo v miestnosti = priemer stavov 91
  trubíc (umocnený 1,3), takže sála pri blikaní trubíc tiež poblikáva. Titulok sa odkryje,
  keď svieti viac než polovica. Poistka v `<head>` odkryje titulok po 4,5 s; ak scéna naskočí
  až potom, svetlá sa už nezapínajú (nebliká svetlo → tma → svetlo).
- Hlavné fotky priestorov sa pri prvom zobrazení krátko rozblikajú ako žiarivky a rozsvietia.
- Bez JS: stránka je celá viditeľná, galérie sa posúvajú, fotka sa otvorí ako súbor. Úvod sa
  odkryje najneskôr po 3 s aj bez skriptu. Obmedzený pohyb: žiadne animácie.

## 6. Kontroly (28. 9. 2026, Chromium cez Playwright)

- iPhone 13 (emulácia, procesor spomalený 4×), plynulé skrolovanie celou stránkou kolieskom:
  medián aj 95. percentil snímky 16,7 až 16,8 ms, dve snímky nad 50 ms zo 794.
- 1440 × 900: medián aj 95. percentil 16,7 až 16,8 ms, žiadna snímka nad 50 ms.
- Úvod (snímky počas načítania a pri skrolovaní 35, 70 a 100 %): najprv tma, potom svietia
  len trubice, potom celá sála s titulkom; pri skrolovaní kamera zíde k dráhe a vojde dnu.
  Skript počas rozsvecovania 6,1 ms za sekundu, potom menej.
- 3D: plátno sa vytvorí pri úvode a pri priestoroch v obraze; pri posune myši zľava doprava sa
  kamenný stĺp v popredí posunie výrazne viac než okná vzadu. Skript 3D slučky zaberie 1,8 ms za
  sekundu (iPhone 13, emulácia). Testovacie prostredie nemá GPU (softvérové WebGL), preto sa
  plynulosť 3D na skutočných telefónoch musí overiť.
- Galéria (šípka aj posun prstom), otvorenie fotky, posun klávesmi a prstom cez hranicu
  priestorov, zatvorenie Esc: popis a poradie sedia, stránka sa odomkne, zameranie sa vráti na
  fotku.
- Konzola bez chýb a varovaní, žiadna požiadavka s chybou, bez vodorovného pretečenia na
  šírkach 320, 375, 768, 1024, 1440 a 1920 px.

## 7. Obmedzenia

- 3D je odhadnutá hĺbka jednej fotky, nie model priestoru: dovoľuje malý pohľad do strán
  (2 %), nie chôdzu. Na hranách predmetov môže byť pri najväčšom posune jemné roztiahnutie.
- Nie je to video ani 360° prehliadka: súvislé video chôdze fitkom neexistuje (videá majú
  2,5 až 6,2 s a väčšina je mäkká alebo s odrazom osoby). Súvislé 4K video na gimbale alebo
  360° kamera by umožnili skutočný prelet.
- Fotky sú na výšku; v galérii sa orezávajú na 3 : 4, celé sú na celej obrazovke.
- Tatami je mäkšie než ostatné zábery (biela plochá miestnosť).
- Testované len v Chromium; treba overiť v Safari na iPhone a Macu a na Androide.
- Otváracie hodiny, cenník, platby a tréneri zámerne chýbajú, kým ich prevádzka nepotvrdí.
