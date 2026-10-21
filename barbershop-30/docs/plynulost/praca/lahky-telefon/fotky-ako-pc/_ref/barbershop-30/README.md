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
  klávesom ani ťahom prstom pri skrolovaní), tlačidlo „Hudba“ v lište vypne hudbu aj strihanie a voľba sa pamätá;
  hudba sa stiahne až pri pustení a tlačidlo sa rozsvieti, až keď zvuk naozaj hrá.
  `?hudba=off` a `?svetlo=off` ich vypnú.

- **Brána filmu** (skript v hlavičke `index.html`, trieda `world` na `<html>`): film sa zapne pri WebGL2, bez
  obmedzenia pohybu a šetrenia dát, pri výške okna nad 500 px a aspoň 4 GB pamäte a 4 jadrách. WebGL kontext sa
  v hlavičke nevytvára (pred prvým obrazom by prehliadač štartoval grafiku); grafickú kartu overí `film.js` po
  prvom vykreslení a pri softvérovom kreslení sa vypne (pokojná verzia, statické zábery). `?film=off` alebo
  `?motion=off` film vypne, `?film=on` vynechá overenie grafiky (testy v prehliadači bez grafiky).
- **Ľahký telefón** (trieda `lite` z tej istej hlavičky, majiteľ 2026‑10‑21): prst bez myši
  (`(hover: none) and (pointer: coarse)`) a kratšia strana obrazovky do 720 px. Pridá aj `world-off`, nepridá `world`
  ani `pro`; `film.js` sa vôbec nenačíta (dynamický import na konci `index.html` len bez `lite`), takže žiadne three.js,
  hĺbkové mapy, sekvencie ani video v plátne. Zábery sú tie isté fotky `-m` cez celé okno s pomalým priblížením
  (`--sp`, transform) a prelínaním kariet (`--so`, opacity) podľa skrolu. Úzke okno počítača s myšou ostáva na filme.
  `?film=on` `lite` vypne (porovnanie s filmom na telefóne), `?film=off` ho nechá. Testy: `app-smoke.mjs` (časť lite),
  `uvod-shot.mjs` (lite na telefóne), `karty-shot.mjs --lite`; pevný port testovacieho servera dá `B30_PORT`.
- **Jazyky** (`assets/i18n.js`, `assets/i18n.css`, slovníky `assets/i18n/<jazyk>.json`): slovenčina, angličtina,
  ukrajinčina, maďarčina, srbčina (latinka), poľština, nemčina a čeština; výber a poradie podľa prieskumu menšín
  a cudzincov v Nitre (`docs/JAZYKY.md`). Kľúč slovníka je slovenský text zo stránky, `__tabula` sú slová tabule
  dnešných hodín. Modul načíta `app.js` hneď pri `?lang=` alebo uloženej voľbe (`b30.lang`), inak na počítači pri
  prvom geste alebo 3,5 s po načítaní, na dotykovom zariadení vo voľnej chvíli po načítaní, keď sa neskroluje (nie
  pri prvom ťahu prstom), alebo hneď pri otvorení menu. Prepínač je na počítači v lište, na telefóne v rozbaľovacom
  menu. Nadpisy po slovách (`.kin`) sa prekladajú po celých riadkoch a delia znova, Booqme dostane jazyk (srbčina →
  angličtina) a pri hlavnej rezervácii (len po slovensky) je poznámka v jazyku stránky. Manrope s cyrilikou pridá
  `i18n.js` (FontFace) až pri ukrajinčine, pri jej ponuke alebo pri otvorení ponuky jazykov na počítači (nie
  `@font-face` v `i18n.css`: nové písmo prepočíta rozloženie celej stránky; rezy s hrúbkou presne 400/600/700 ako latinka,
  rez s rozsahom 500–800 by tlačidlá a nadpisky v latinke prepol na písmo systému). `hreflang` je v `sitemap.xml`,
  nie v HTML (HTML musí ostať v prvom okne TCP). Nový text na stránke
  potrebuje kľúč vo všetkých slovníkoch; kontrola: `node source/tools/i18n-test.mjs`.

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
