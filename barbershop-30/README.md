# BARBERSHOP 30 – web

Statický web (jedna stránka, bez build kroku): `index.html` + `assets/` (štýly, skripty, písma,
fotky, film, videá). Relatívne cesty, dá sa nasadiť do koreňa domény aj do podpriečinka.

## Čo web robí

- **Prehliadka podniku** (`docs/TOUR_DIRECTION.md`, `docs/MASTER_BRIEF.md`): pozadie stránky je film
  zo skutočných fotiek prevádzky s hĺbkovými mapami (`assets/film.js`, `assets/img/film/`); pri
  skrolovaní sa kamera pohne v každej miestnosti a zábery sa prelínajú v poradí, ako sa podnikom
  prechádza. Bez WebGL, pri obmedzení pohybu alebo šetrení dát ostáva pokojná verzia s tými istými
  fotkami.
- **Úvod ako film**: raz za návštevu sa film rozbehne sám – z Mostnej ulice k dverám a cez dvere
  dnu na rohožku (filmové pásy, prechod cez priestor); skrolovanie ho hneď ukončí. Tlačidlo „Späť na
  ulicu“ (alebo potiahnutie nadol na vrchu) vyvedie kameru von a „Vojdi dnu“ ju vráti. `?uvod=znova`
  pustí prológ aj opakovane, `?uvod=off` ho vynechá, `?film=off` film vypne.
- Texty, ceny a údaje len z overených zdrojov (`docs/CONTENT_SOURCES.md`), rezervácia vedie do
  rezervačného systému podniku.
- **Kurzor a hudba** (`assets/atmosfera.js` a `atmosfera.css`, načíta ich `app.js` až pri prvom pohybe myši,
  dotyku či klávese, inak 3,5 s po načítaní, aby nesúperili s prvým obrazom): kurzor v tvare nožníc (len myš;
  nad odkazom otvorené, pri kliknutí zatvorené, `assets/img/kurzor/`), teplé svetlo pod kurzorom a vlastná
  hudba na pozadí (`assets/audio/hudba.webm` a `.m4a`, pokojná bossa nova, slučka 50,5 s) a zvuk strihnutia pri kliknutí myšou
  alebo ťuknutí (`assets/audio/strih.*`, 3 varianty). Hudba sa pustí pri prvom kliknutí alebo ťuknutí (nie
  klávesom), tlačidlo „Hudba“ v lište vypne hudbu aj strihanie a voľba sa pamätá; hudba sa stiahne až pri pustení.
  `?hudba=off` a `?svetlo=off` ich vypnú.

- **Brána filmu** (skript v hlavičke `index.html`, trieda `world` na `<html>`): film sa zapne pri WebGL2, bez
  obmedzenia pohybu a šetrenia dát, pri výške okna nad 500 px a aspoň 4 GB pamäte a 4 jadrách. WebGL kontext sa
  v hlavičke nevytvára (pred prvým obrazom by prehliadač štartoval grafiku); grafickú kartu overí `film.js` po
  prvom vykreslení a pri softvérovom kreslení sa vypne (pokojná verzia, statické zábery). `?film=off` alebo
  `?motion=off` film vypne, `?film=on` vynechá overenie grafiky (testy v prehliadači bez grafiky).
- **Jazyky** (`assets/i18n.js`, `assets/i18n.css`, slovníky `assets/i18n/<jazyk>.json`): slovenčina, angličtina,
  ukrajinčina, maďarčina, srbčina (latinka), poľština, nemčina a čeština; výber a poradie podľa prieskumu menšín
  a cudzincov v Nitre (`docs/JAZYKY.md`). Kľúč slovníka je slovenský text zo stránky, `__tabula` sú slová tabule
  dnešných hodín. Modul načíta `app.js` hneď pri `?lang=` alebo uloženej voľbe (`b30.lang`), inak pri prvom geste
  alebo 3,5 s po načítaní. Prepínač je na počítači v lište, na telefóne v rozbaľovacom menu. Nadpisy po slovách
  (`.kin`) sa prekladajú po celých riadkoch a delia znova, Booqme dostane jazyk (srbčina → angličtina) a pri hlavnej
  rezervácii (len po slovensky) je poznámka v jazyku stránky. Ukrajinčina sťahuje Manrope s cyrilikou len pri
  cyrilike. `hreflang` je v `sitemap.xml`, nie v HTML (HTML musí ostať v prvom okne TCP). Nový text na stránke
  potrebuje kľúč vo všetkých slovníkoch; kontrola: `node source/tools/i18n-test.mjs`.

- **Asistent** (`assets/asistent.js` a `asistent.css`, server `../asistent/`): okno „Opýtaj sa nás“ vľavo dole, odpovede
  na otázky o službách, cenách, rezervácii a ceste len z `../asistent/znalosti/barbershop.md`, v jazyku otázky,
  po kúskoch. Zapne ho nasadenie atribútom `data-asistent` na `<html>` (len s kľúčom API a FTP), modul sa načíta
  až po prvom geste. `?asistent=off` ho vypne. Podrobne `../asistent/README.md`; test `source/tools/asistent-test.mjs`.

- **Telefón a objednávka (2026‑10‑21)**: na telefóne bez videí (zábery sály, stola a rannej sály sú ostré výrezy fotiek
  s hĺbkou namiesto videí z 576 px zdroja; predošlé 60 fps slučky boli dopočítané interpoláciou z 30 fps). Úvod hovorí
  čo (strih, brada, holenie), prečo (5,0 na Google, 945 recenzií; pánsky strih 18 €) a ako (Objednať sa, Zavolať
  a potvrdiť termín). Pásy vychádzajú spod záberu mäkko (stmievačka namiesto ostrej hrany, menšie odsadenia na telefóne).
  Filmový pohyb (P14 v `style.css`, `app.js` časť 8b): linka strihu pri nástupe pásu, odhalenie fotiek tímu a galérie
  maskou, odozva tlačidiel; pri obmedzení pohybu a bez skriptu nič neskrýva.

## Nasadenie

Teraz: podpriečinok `/barbershop-30/` webu HEAD SPA 30 (GitHub Pages, vetva `main`,
`.github/workflows/pages.yml` kopíruje `index.html`, `robots.txt`, `sitemap.xml` a `assets/` a
nahradí základnú adresu). Pri vlastnej doméne nahraď základnú adresu
`https://d8f5s88zjy-art.github.io/barbershop30/` v `index.html`, `robots.txt` a `sitemap.xml`
jedným príkazom `sed` (miesta sú označené komentárom DEPLOY STEP).

## Nástroje (`source/tools/`, Playwright a Python s Pillow)

- `film.py` – zábery filmu: stupne 1086/1448/2172/2896 px (fasáda vstupu aj 4096), výrezy na výšku
  pre telefón `<meno>-m-*` a hĺbkové mapy (`hlbka.py`, Depth Anything V2 small ONNX; model ~99 MB nie je
  v gite – stiahni ho do `source/tools/depth/model.onnx` alebo daj cestu v `DEPTH_MODEL`).
- `stills.py` – z `assets/img/film/film.json` prepíše zálohy a kotvy záberov v `index.html`.
- `build_images.py` – fotky galérie, tímu a videopostery (`assets/img/manifest.json`).
- `i18n-test.mjs` – jazykové verzie: každý jazyk bez nepreložených textov, tabuľa hodín, Booqme, prepínač na počítači aj v menu telefónu, návrat do slovenčiny.
- `nahlad.mjs` – náhľad na kontrolu (úvod, pás tímu, cenník, galéria, rezervácia na 360/390/430 px, tablete a počítači), odkazy tel: a Objednať sa, obmedzený pohyb, bez skriptu;
  `mobil-audit.mjs` – snímky celej stránky po krokoch skrolu s pretekaním, pevnými prvkami a podielom tmy;
- `tma-test.mjs` – film nikdy neukáže čierne plátno (pomalá sieť, rýchly skrol a skoky cez menu);
  `asistent-test.mjs` – okno asistenta so serverom a falošným API.
- `app-smoke.mjs` – dymový test stránky; `scenes-shot.mjs` – snímky všetkých scén;
  `uvod-shot.mjs` – snímky prológu, jeho stavy a návrat na ulicu; `uvod-meranie.mjs` + `uvod-zhoda.py` –
  plynulosť prológu (časová os, zhoda zálohy s prvým snímkom filmu); `prechod-shot.mjs` – zastavený
  prechod medzi zábermi; `ostrost.mjs` + `ostrost.py` – porovnanie ostrosti dvoch adries;
  `karty-shot.mjs` – snímky všetkých titulných kariet (telefón aj počítač) s prehľadom; `videa.sh` – videá majiteľa
  ako zábery filmu (úseky, stabilizácia, kódovanie, plagáty, bez tónovania);
  `vaha.mjs` – prenesené bajty prvého obrazu; `../shot.mjs` – snímka ľubovoľnej adresy (desktop + mobil).
- `hudba.py` – hudba na pozadí (syntéza v Pythone, bez licencií tretích strán; bossa nova 76 BPM, 16 taktov);
  `strih.py` – zvuk strihnutia (syntéza); `kurzor.mjs` – kurzory nožníc (SVG → PNG 32/64 px);
  `atmosfera-test.mjs` – test kurzora, svetla, hudby a strihania.

Záznamy kontrol: `docs/CHECKS.md`, `docs/INTEGRATION_LOG.md`, `docs/COMPARISON.md`,
snímky v `docs/screenshots/`.
