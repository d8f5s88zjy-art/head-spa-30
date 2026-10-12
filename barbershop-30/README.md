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
- **Kurzor a hudba** (`assets/atmosfera.js`, koniec `assets/style.css`): kurzor v tvare nožníc (len myš;
  nad odkazom otvorené, pri kliknutí zatvorené, `assets/img/kurzor/`), teplé svetlo pod kurzorom a vlastná
  hudba na pozadí (`assets/audio/hudba.webm` a `.m4a`, slučka 46,8 s). Hudba sa pustí pri prvom kliknutí alebo
  ťuknutí (nie klávesom), tlačidlo „Hudba“ v lište ju vypne a voľba sa pamätá; súbor sa stiahne až pri pustení.
  `?hudba=off` a `?svetlo=off` ich vypnú.

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
- `app-smoke.mjs` – dymový test stránky; `scenes-shot.mjs` – snímky všetkých scén;
  `uvod-shot.mjs` – snímky prológu, jeho stavy a návrat na ulicu; `uvod-meranie.mjs` + `uvod-zhoda.py` –
  plynulosť prológu (časová os, zhoda zálohy s prvým snímkom filmu); `prechod-shot.mjs` – zastavený
  prechod medzi zábermi; `ostrost.mjs` + `ostrost.py` – porovnanie ostrosti dvoch adries;
  `karty-shot.mjs` – snímky všetkých titulných kariet (telefón aj počítač) s prehľadom; `videa.sh` – videá majiteľa
  ako zábery filmu (úseky, stabilizácia, kódovanie, plagáty, bez tónovania);
  `vaha.mjs` – prenesené bajty prvého obrazu; `../shot.mjs` – snímka ľubovoľnej adresy (desktop + mobil).
- `hudba.py` – hudba na pozadí (syntéza v Pythone, bez licencií tretích strán; lo-fi jazz 82 BPM, 16 taktov);
  `kurzor.mjs` – kurzory nožníc (SVG → PNG 32/64 px); `atmosfera-test.mjs` – test kurzora, svetla a hudby.

Záznamy kontrol: `docs/CHECKS.md`, `docs/INTEGRATION_LOG.md`, `docs/COMPARISON.md`,
snímky v `docs/screenshots/`.
