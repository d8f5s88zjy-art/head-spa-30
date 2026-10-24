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

- **Asistent Barber** (`assets/asistent.js` a `asistent.css`, server `../asistent/`): ikona vľavo dole je logo
  Barbershopu 30 v bielom kruhu so štítkom AI; keď ju návštevník chvíľu vidí, vyskočí pri nej bublina (Spýtať sa,
  Zavolať, zavrieť; raz za návštevu, zavretá sa 14 dní neukáže). Chat odpovedá na otázky o službách, cenách,
  rezervácii a ceste len z `../asistent/znalosti/barbershop.md`, v jazyku otázky, po kúskoch; Zavolať je stále
  v hlavičke okna, Skryť Barbera ho schová do konca návštevy. Všade je zreteľne označený ako AI. Zapne ho nasadenie
  atribútom `data-asistent` na `<html>` (len s kľúčom API a FTP), modul sa načíta až po prvom geste. `?asistent=off`
  ho vypne, `?asistent=ukazka` ukáže okno bez servera s vopred pripravenými odpoveďami z údajov webu
  (`assets/asistent-ukazka.js`, na kontrolu, výrazne označené, že nepíše AI). Podrobne `../asistent/README.md`;
  test `source/tools/asistent-test.mjs`.
- **Časté otázky Barbera** (`../asistent/znalosti/barbershop-otazky.json`, 251 overených odpovedí v 11 témach): v okne
  témy a otázky ťuknutím (overená odpoveď hneď, bez servera, s popisom „Pripravená odpoveď“), pod odpoveďou súvisiace
  otázky; server ku každej písanej otázke pridá modelu 6 najpodobnejších. Hľadanie je v `assets/asistent-otazky.js`
  a rovnaké v `../asistent/lib/otazky.php`. Po úprave otázok `node source/tools/otazky.mjs` (kontrola faktov proti
  cenníku, zhoda prehliadač a server, kópia `assets/asistent-otazky.json`).

- **Živý telefón (2026‑10‑22, style.css P15, app.js časť 12)**: zadávateľ: „na telefóne to pôsobí ako PowerPoint“.
  Fotka scény sa aj bez filmu hýbe pri skrolovaní ako kamera podľa `data-mv` (in a near priblíženie, rise a down
  zvislý posun, left a right vodorovný; presah 1,14, okraj fotky nevidno), karta s textom ide o kúsok pomalšie
  (hĺbka 44 px), každá scéna má háčik `.hook` (krátka výzva s odkazom na objednanie alebo na cenník, nastúpi po
  nadpise, šípka raz ukáže smer), úvod ukazuje živý stav otváracích hodín (`[data-zive]`, slová tabule `__tabula`),
  cenník má na telefóne pripnuté záložky skupín, popis na dva riadky (ťuk rozbalí) a riadky nastúpia zdola, pásy
  tímu a galérie sa raz jemne posunú. Ikona asistenta 48 px (telefón 44 px), spodná lišta menšia. Pri obmedzení
  pohybu a bez skriptu všetko stojí a je viditeľné.
- **Telefón a objednávka (2026‑10‑21)**: na telefóne bez videí (zábery sály, stola a rannej sály sú ostré výrezy fotiek
  s hĺbkou namiesto videí z 576 px zdroja; predošlé 60 fps slučky boli dopočítané interpoláciou z 30 fps). Úvod hovorí
  čo (strih, brada, holenie), prečo (5,0 na Google, 945 recenzií; pánsky strih 18 €) a ako (Objednať sa, Zavolať
  a potvrdiť termín). Pásy vychádzajú spod záberu mäkko (stmievačka namiesto ostrej hrany, menšie odsadenia na telefóne).
  Filmový pohyb (P14 v `style.css`, `app.js` časť 8b): linka strihu pri nástupe pásu, odhalenie fotiek tímu a galérie
  maskou, odozva tlačidiel; pri obmedzení pohybu a bez skriptu nič neskrýva.

- **Objednávka v štýle webu** (`assets/objednavka.js` a `objednavka.css`, server `../asistent/api.php`): Objednať sa
  otvorí okno služba → barber → deň a voľný čas z rezervačného kalendára (len čítanie, z odpovede len časy HH:MM).
  Služby, časy a ceny berie z cenníka (`a.price-cta[data-sluzba]` = id služby v rezervačnom systéme), portréty z tímu.
  Po výbere služby ukáže hneď najbližšie voľné časy u ktoréhokoľvek barbera (služba → čas = dve kliknutia), pod nimi
  tím pre toho, kto chce svojho barbera. Objednať pri službe v cenníku ju vyberie, Objednať sa pri barberovi ho vyberie. Na konci ukáže výber s poznámkou, že
  termín ešte nie je rezervovaný, a vedie do rezervačného systému (cestou sa ozve prihláška vernostnej kartičky) alebo
  na telefón; úspech neukazuje, lebo objednávku nič nepotvrdilo (odoslanie z webu by potrebovalo písomný súhlas
  prevádzky a jej dokumentáciu rozhrania). Zapne ho nasadenie atribútom `data-objednavka` na `<html>` len s premennou
  `ASISTENT_KALENDAR_URL` (súhlas prevádzky) a FTP; okno sa zapne až po `api.php?a=stav` s pripojeným kalendárom, inak
  a pri každej chybe vedú odkazy rovno do rezervačného systému. `?objednavka=<adresa>` na localhost, `?objednavka=off`;
  `?objednavka=ukazka` (aj na náhľade) ukáže kroky s ukážkovými časmi bez servera, s pruhom „Ukážka na kontrolu… nič sa
  nerezervuje“, aby sa dala cesta preklikať pred zapnutím kalendára.
  Test: `source/tools/objednavka-test.mjs` (okno aj rezervačná stránka, falošný rezervačný systém, snímky).
- **Rezervačná stránka** (`rezervacia.html`, `assets/rezervacia.js` a `rezervacia.css`): samostatná stránka v dizajne
  webu na odkaz z Instagramu, Google alebo webu. Úvod s fotkou kresla, kroky objednávky priamo na stránke (ten istý kód
  ako okno, `objednavka.js` → `stranka`), vedľa kontakt, jazyky ako na webe a AI asistent na otázky (`asistent.js`,
  zreteľne označený ako AI). Bez skriptu a bez pripojeného kalendára je to cenník webu s odkazmi do rezervačného
  systému a telefón. Odkaz s predvoľbou: `rezervacia.html?sluzba=1&barber=Adrian` (rovno na deň). Zapína sa rovnakými
  príznakmi ako web (`data-objednavka`, `data-asistent`, nasadenie v pages.yml); kým nie je pripojený kalendár, má
  `noindex` (nasadenie s kalendárom ho odstráni). Záväzné odoslanie rezervácie z webu nie je (pozri Objednávka).
  Služby sú po skupinách so skutočnou fotkou prevádzky (strih, brada, balíčky, doplnky; nie výsledky strihov),
  barberi ako karty s portrétom, pod tým tím ako na webe a „Naša práca“ s odkazom na Instagram. Fotky práce
  barberov: `docs/FOTKY_PRACE.md`, `source/tools/praca.py` → `assets/praca.json` (okno aj stránka ich ukážu samy).
- **Vizitka a vernostná kartička** (`assets/karty.js` a `karty.css`, pás pod kontaktom, načíta sa po načítaní stránky):
  vizitka, ktorú prevádzka už rozdáva (predloha: fotka recepcie `source/photos/foto-17.jpg`), nie nový návrh: na výšku,
  pruhy barber pole, biely kruh s pôvodným logom zo starého webu (`source/web-povodny/logo-vector-black.svg` →
  `assets/img/logo-30-barbershop.webp`), vpredu telefón, e‑mail, adresa a web (len riadky čitateľné na fotke), vzadu
  pruhy s logom. Uložiť kontakt otvorí `assets/barbershop30.vcf`. Vizitka je slovenská ako vytlačená (`lang="sk"`).
  Vernostná kartička (ukážka v rovnakom vzhľade ako `vernost/karta` a ako funguje) sa ukáže len so zapnutou
  prihláškou (`data-zapnute` na `assets/vernost.js`) alebo s uloženou kartičkou; tlačidlo otvorí prihlášku alebo
  kartičku. `?vernost=ukazka` ju ukáže na kontrolu s vypnutým tlačidlom.

- **Vzhľad webu na ich rezervácii** (`assets/tema-rezervacia.css`, návod `docs/TEMA_REZERVACIA.md`): štýl pre
  existujúcu stránku www.barbershop30.sk/rezervacia, ktorý vloží jedným riadkom správca ich webu; funkcia ostáva
  ich. Náhľad pred a po: `node source/tools/tema-nahlad.mjs` (ich stránka lokálne so skúšobným kalendárom).

- **Admin pre Lajka** (`admin/`, naostro `https://d8f5s88zjy-art.github.io/head-spa-30/barbershop-30/admin/`):
  texty webu po častiach, cenník, tím (aj nový člen a fotka), galéria (fotka a popis), odpovede asistenta Barber
  a odkazy na admin vernostnej kartičky. Prihlásenie kľúčom GitHub (fine-grained, len tento repozitár, Contents:
  Read and write), kľúč ostáva v prehliadači. Uloženie je jeden commit priamo do `main` (bloby, strom, commit,
  posun vetvy bez prepísania; keď sa web medzitým zmenil, neuloží nič a povie to). Jedna zmena upraví všetko, čo
  s ňou súvisí: `index.html` aj `rezervacia.html` (len text, značky ostanú), preklady `assets/i18n/*.json` (kľúč
  sa presunie, starý ostane, kým ho niečo používa), znalosti asistenta `../asistent/znalosti/barbershop.md`,
  časté otázky `barbershop-otazky.json` a ich kópiu pre web. Odpovede so starou cenou dá na kontrolu (jedinečnú
  cenu prepíše sám) a uloženie zastaví, kým niektorá odpoveď hovorí cenu, ktorá v cenníku nie je. Fotky zmenší
  v prehliadači (WebP a JPEG, tím 480/820, galéria 640/1080/1600). Záložka Kontakt a hodiny zmení telefón (mobil),
  e‑mail a otváracie hodiny (Po–Pi a sobota, celé hodiny) naraz vo všetkých súboroch zoznamu `KONTAKT` v `admin.js`
  (web, preklady, app.js HOURS, asistent aj jeho server, kartička, vizitka, ukážky, pravidlo v CLAUDE.md); pred
  uložením ukáže počet miest a vety s časom otvorenia bez dňa na kontrolu. Adresu a nedeľu mení tvorca webu.
  `source/tools/otazky.mjs` berie povolené časy z app.js. Test: `node source/tools/admin-test.mjs`
  (falošný GitHub v pamäti, nič nejde von). Funguje až po zverejnení webu v `main` (číta súbory odtiaľ).

## Nasadenie

Teraz: podpriečinok `/barbershop-30/` webu HEAD SPA 30 (GitHub Pages, vetva `main`,
`.github/workflows/pages.yml` kopíruje `index.html`, `rezervacia.html`, `robots.txt`, `sitemap.xml`, `assets/`,
`karta/` a `admin/` a
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
  `asistent-test.mjs` – okno asistenta so serverom a falošným API; `admin-test.mjs` – admin s falošným GitHubom
  (prihlásenie, texty, cenník, tím, galéria, súbeh, web po zmenách); `objednavka-test.mjs` – objednávkové okno, vizitka
  a vernostná kartička proti falošnému rezervačnému systému.
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
