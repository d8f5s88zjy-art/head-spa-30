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
  cyrilike. `hreflang` je v `sitemap.xml`, nie v HTML (HTML musí ostať v prvom okne TCP); sú v ňom len kanonické
  adresy sk a `en/` (adresy `?lang=` majú canonical na slovenskú stránku, Google by ich bral ako duplikát). Nový text na stránke
  potrebuje kľúč vo všetkých slovníkoch; kontrola: `node source/tools/i18n-test.mjs`.
  Anglická stránka `en/index.html` (pre Google: vlastná adresa, texty priamo v HTML) sa vytvorí pri nasadení zo
  slovenskej `index.html` a `assets/i18n/en.json` (`source/tools/en-stranka.mjs`, rovnaké pravidlá ako `i18n.js`);
  `data-zdroj="en"` povie `i18n.js`, že stránka už je po anglicky, a prepínač vedie na slovenskú stránku s `?lang=`.
  V repozitári je jej kópia na náhľad, `--check` overí, že je aktuálna; test `node source/tools/en-test.mjs`.
- **SEO úvod a časté otázky (2026‑10‑25, `docs/SEO-ANALYZA.md`)**: titulok „Barbershop 30 Nitra | Pánske holičstvo,
  Mostná 30“, popis so službami, H1 so značkou a mestom (nadpisok „Barbershop 30 · Nitra“ nad „Každý človek. Každé želanie. Jedno
  miesto.“), podnadpis „Pánske holičstvo na Mostnej 30“. Časté otázky (`#caste-otazky`, pás v rezervácii pod
  kontaktom, 11 otázok ako `<details>`, odpovede len z overených údajov, bez skriptu fungujú), údaje pre Google
  s `hasMap` (profil v Mapách; súradnice nie sú, lebo nie sú overené).

- **Tím, recepcia v otázkach a prevádzky v pätičke (2026‑10‑27, `docs/CHECKS.md` 32)**: nad portrétmi tímu tri
  piliere Skúsenosti · Precíznosť · Pohodlie (`ul.team-pillars`, od 28. 10. Garancia), riadky barberov bez faktov o osobe (rovnaké
  v `rezervacia.html` a v odpovediach asistenta), v častých otázkach „Mám volať barberovi alebo recepcii?“ (recepčná =
  termíny a pohodlie, barber = výsledok), v pätičke blok „Naše prevádzky“ (`.footer-shops`: HEAD SPA 30, Salón 30,
  Barbershop 30 ako aktuálna stránka s `aria-current`).
- **Ráznejšie texty tímu, prax 10 až 15 rokov a garancia v kresle (2026‑10‑28, `docs/CHECKS.md` 33)**: majiteľ 27. 10.:
  „Musia to byť rázne texty“, „Barberi majú 10–15 rokov praxe“. Úvod tímu v troch vetách s praxou, piliere Skúsenosti ·
  Precíznosť · Garancia („Z kresla vstaneš, až keď si spokojný. Čo nesedí, dohodneme a doladíme hneď.“, bez lehôt a sľubov po
  odchode), kratšie riadky barberov, otázka „Čo ak nebudem spokojný?“ (11. položka → 10. miesto), „recepčná od roku 2019“
  namiesto „jediný barbershop v Nitre, 8 rokov“, podnadpis „Všetky tri na Mostnej 30 v Nitre.“ v pätičke (adresy overené na
  weboch prevádzok). To isté v znalostiach Barbera (`../asistent/znalosti/barbershop.md`, otázky 252).
- **Asistent Barber** (`assets/asistent.js` a `asistent.css`, server `../asistent/`): ikona vľavo dole je logo
  Barbershopu 30 v bielom kruhu so štítkom AI; keď ju návštevník chvíľu vidí, vyskočí pri nej bublina (Spýtať sa,
  Zavolať, zavrieť; raz za návštevu, zavretá sa 14 dní neukáže). Chat odpovedá na otázky o službách, cenách,
  rezervácii a ceste len z `../asistent/znalosti/barbershop.md`, v jazyku otázky, po kúskoch; Zavolať je stále
  v hlavičke okna, Skryť Barbera ho schová do konca návštevy. Všade je zreteľne označený ako AI. Zapne ho nasadenie
  atribútom `data-asistent` na `<html>` (len s kľúčom API a FTP), modul sa načíta až po prvom geste. `?asistent=off`
  ho vypne, `?asistent=ukazka` ukáže okno bez servera s vopred pripravenými odpoveďami z údajov webu
  (`assets/asistent-ukazka.js`, na kontrolu, výrazne označené, že nepíše AI). Podrobne `../asistent/README.md`;
  test `source/tools/asistent-test.mjs`.
- **Časté otázky Barbera** (`../asistent/znalosti/barbershop-otazky.json`, 777 overených odpovedí v 11 témach): v okne
  témy a otázky ťuknutím (overená odpoveď hneď, bez servera, s popisom „Pripravená odpoveď“), pod odpoveďou súvisiace
  otázky; server ku každej písanej otázke pridá modelu 6 najpodobnejších. Hľadanie je v `assets/asistent-otazky.js`
  a rovnaké v `../asistent/lib/otazky.php`. Po úprave otázok `node source/tools/otazky.mjs` (kontrola faktov proti
  cenníku, zhoda prehliadač a server, kópia pre prehliadač: `assets/asistent-otazky.json` s otázkami a odpoveďami pri
  prvom otvorení okna, gzip asi 41 kB, a `assets/asistent-otazky-kmene.json` s kmeňmi znení na hľadanie hneď po ňom,
  asi 25 kB; admin ju pri uložení robí rovnako). Stráž `source/tools/otazky-ocakavane.json`: 158 bežných otázok
  (z každej témy aspoň 10) musí padnúť na odpoveď so zodpovedajúcim významom a 64 otázok mimo témy (počasie, benzín,
  kurz eura, recept…) musí ostať pod prahom okna 0,6; pri chybe sa opravujú znenia (`v`), nie sada ani hľadanie.

- **Živý telefón (2026‑10‑22, style.css P15, app.js časť 12)**: zadávateľ: „na telefóne to pôsobí ako PowerPoint“.
  Fotka scény sa aj bez filmu hýbe pri skrolovaní ako kamera podľa `data-mv` (in a near priblíženie, rise a down
  zvislý posun, left a right vodorovný; presah 1,14, okraj fotky nevidno), karta s textom ide o kúsok pomalšie
  (hĺbka 44 px), každá scéna má háčik `.hook` (krátka výzva s odkazom na objednanie alebo na cenník, nastúpi po
  nadpise, šípka raz ukáže smer), úvod ukazuje živý stav otváracích hodín (`[data-zive]`, slová tabule `__tabula`),
  cenník má na telefóne pripnuté záložky skupín, popis na dva riadky (ťuk rozbalí) a riadky nastúpia zdola, pásy
  tímu a galérie sa raz jemne posunú. Ikona asistenta 48 px (telefón 44 px), spodná lišta menšia. Pri obmedzení
  pohybu a bez skriptu všetko stojí a je viditeľné.
- **Pás pod plávajúcou lištou a ikonou Barbera (S-1, 11. 11. 2026, style.css koniec, app.js `spodnaLista`,
  asistent.css `.asi-pod`)**: zákazník 9. 11.: „musí byť 0 prekrývaní všade“. Lišta Zavolať / Objednať sa a ikona
  Barbera ležali pri skrole cez text (text presvital medzi tlačidlami a okolo ikony). Na telefóne a tablete (do 900 px)
  je pod nimi pás `#spodny-pas` cez celú šírku: plná plocha 70 px (tablet 74 px) + `safe-area-inset-bottom`, nad ním
  28 px prechod do priehľadna; text pred ním vybledne a medzi tlačidlami nepresvitá. Tón pásu je tón sekcií
  (`--ink-2`), nad pätičkou sa prelnie do jej tónu (`--ink`, trieda `s-pata`, len opacity; K1-S1-3). Pás svieti s lištou (`s-cta`) a bez
  nej pod ikonou (`s-ikona`: cenník, kontakt, pätička), nie v úvode, pri menu a v prológu filmu. Ikona je na telefóne
  v páse; v úvode bez pásu len tam, kde má pod tlačidlami titulnej karty voľno (`s-volno`; na 320×568 by ležala cez
  „Zavolať a potvrdiť termín“, príde s lištou). Lišta a pás prídu až po zhasnutí titulnej karty, ak by pás ležal cez jej
  tlačidlá (`heroNaraz` ráta s výškou pásu). Ukazovanie len cez transform a opacity (300 ms), bez backdrop-filter,
  `pointer-events: none`, `contain`. Skrytá lišta má po odchode `visibility: hidden` (nie je v poradí Tabu, D-1).
  Na počítači pás nie je: ikona má vlastný podklad `.asi-pod` (samostatný pevný prvok hneď za tlačidlom, tón sekcie
  12 px okolo, tieň), ktorý svieti len vtedy, keď je v zóne ikony riadok textu – app.js `podIk` sleduje zónu ikony
  + 8 px a 40 px vopred IntersectionObserverom, text karty záberu sa ráta, kým karta svieti; nad fotkou bez textu
  podklad nie je (K1-S1-1). Ukáže sa hneď, zhasne za 200 ms. V pätičke je rezerva 88 px (`html.asi-je .site-footer`;
  v pätičke, nie pod ňou, aby pás kapitol pri dne ostal tenký, K1-S1-2), na telefóne rezerva pásu, aby bola celá
  pätička nad ním.
- **Telefón: fotka v páse, celé fotky, menšie okná (2026‑10‑25, style.css P16, film.js `PAS_B` a `aim()`)**:
  zadávateľ: „fotky nie je vidno úplne, okná zakrývajú celú obrazovku“. Na telefóne na výšku je fotka scény v hornom
  páse (56 % výšky, `--pas`), text karty pod ňou na atramente; fotka na šírku v páse ukáže asi 2× viac šírky ako cez
  celý displej. Film kreslí zábery na šírku (výrezy `-m` len pre prológ, ten ide cez celé okno) s optickou osou
  v strede pásu (`camera.setViewOffset`), plátno pod pásom zakryje vrstva `body::after` (počas prológu a na ulici
  bežná vinetácia, prechod cez `--pas-o`). Záloha má rovnaké rámovanie v páse (overené: zhodná poloha fotky so
  snímkou filmu). Galéria ukáže celé fotky v ich pomere strán (na šírku cez celú šírku, tri na výšku vedľa seba),
  tím celé portréty 820 × 694. Menu je panel podľa obsahu so stmavenou stránkou (ťuk mimo zavrie), objednávka panel
  zdola 82 %, asistent 72 %. `stills.py` dáva výrezy `-m` len prológu, ostatným `sizes` 170vw.
- **Vychytávky (2026‑10‑25, `assets/karty.js` a `karty.css`, `assets/manifest.webmanifest`)**: pri vizitke Pošli
  kamarátovi (zdieľanie telefónu, inak kópia kanonickej adresy) a Pripomeň si ďalší strih (o 3, 4 alebo 6 týždňov
  o 10:00, nedeľa sa posunie na pondelok; súbor .ics podľa RFC 5545 alebo Google Kalendár; udalosť hovorí, že je to
  pripomienka, nie rezervácia, s odkazom na rezerváciu a telefónom). Ikona na plochu telefónu: manifest, ikony
  `assets/img/ikona/` (`source/tools/ikony.mjs`, motív favicon) a apple-touch-icon. Test `source/tools/vychytavky-test.mjs`.
- **Telefón: opravy z kontroly (2026‑10‑25, style.css P18, app.js `mqPas`, film.js strih za pásom)**: scéna za
  pásom (služby, galéria, predná sála) začína na telefóne na výšku o pás fotky skôr, jej karta je vidieť už pri
  nábehu (ide hneď za pásom) a karta pred pásom zhasne až pod pásom; pod fotkou tak neostáva prázdny atrament.
  Záber sa za pásom vymení v strede úseku, keď pás kryje celý pás fotky (film aj záloha, pás leží nad zálohami).
  Plná lišta (bez presvitania textu), plné tlačidlo Zavolať v spodnej lište a písmo 12 px, ponuka jazyka zmizne
  po odskrolovaní o obrazovku, ťukacie plochy odkazov aspoň 44 px (neviditeľný presah). Kontrola: `docs/CHECKS.md` 28.
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
  prevádzky a jej dokumentáciu rozhrania).
  **Jediná cesta k objednaniu (Lajko 9. 11. 2026, bod 7):** okno je na webe vždy. Každý odkaz Objednať sa (lišta, úvod,
  háčiky kariet, tím, cenník, kontakt, spodná lišta telefónu, odpovede Barbera, `en/`) ho otvorí – zachytí ich `app.js`
  (časť 7b4). Modul a štýl okna sa stiahnu až na požiadanie (dotyk odkazu, fokus klávesnicou, myš nad odkazom,
  `?objednat=1`), nie v nečinnosti každému návštevníkovi: A/B 11. 11. 2026 (CPU 4×) ukázalo s modulom v pláne lenivých
  modulov viac dlhých snímok pri skrole telefónu. V HTML ostávajú odkazy na rezervačný systém (cesta bez skriptu,
  Ctrl/Cmd‑klik ho otvorí v novej karte). `?objednat=1` otvorí okno po
  načítaní (aj s `&sluzba=<id>&barber=<meno>`; adresa sa potom vyčistí). `404.html` vedie na `…/?objednat=1`.
  Voľné časy ukáže len server s pripojeným kalendárom: nasadenie pridá `data-objednavka` na `<html>` len s premennou
  `ASISTENT_KALENDAR_URL` (súhlas prevádzky) a FTP. Stav servera sa zisťuje hneď pri spustení, **najviac 8 s**
  (`api.php?a=stav`, aj voľné časy majú limit 8 s). Okno nikdy nie je slepá ulička: kým sa zisťuje, služba sa dá vybrať
  a krok 2 ukáže „Pozerám do kalendára…“; bez servera (náhľad na GitHub Pages či raw.githack), s nepripojeným kalendárom,
  pri chybe alebo bez internetu ukáže **„Objednávka cez web teraz nejde – zavolaj.“** s tlačidlami Zavolať 0951 267 203
  a Skúsiť znova, otváracími hodinami (kópia `.hours` z pätičky, teda v jazyku stránky a podľa adminu) a tichým odkazom
  na rezervačný systém; bez internetu navyše „Si bez internetu…“ a po návrate pripojenia to okno skúsi samo. Chyba
  uprostred cesty ukáže pri kroku Dokončiť v rezervačnom systéme, Zavolať, Skúsiť znova a hodiny. Fokus ide na nadpis
  kroku, Esc a Späť telefónu okno zatvoria a fokus sa vráti na odkaz; pri obmedzenom pohybe bez nábehu.
  Modul okna sa sťahuje až pri dotyku odkazu; keď sa nestiahne (bez internetu), ťuk ukáže malú **zálohu priamo z `app.js`**
  (tá istá veta „nejde – zavolaj“, pri výpadku siete aj „Si bez internetu…“, Zavolať, hodiny z pätičky, Skúsiť znova;
  texty z prekladových slovníkov), nikdy novú kartu; zlyhaný import sa nedrží a po návrate internetu sa okno otvorí
  samo (kontrola K2-1, 11. 11. 2026). Odozva (K2-2): ťuk najprv ukáže `aria-busy` na odkaze a okno (`showModal`, prepočet
  celej stránky) príde až po vykreslení; Esc okno a clonu hneď skryje (len krytie) a zatvorí ho o snímku neskôr.
  `?objednavka=<adresa>` na localhost, `?objednavka=off` (len na skúšku bez okna); `?objednavka=ukazka` (aj na náhľade)
  ukáže kroky s ukážkovými časmi bez servera, s pruhom „Ukážka na kontrolu… nič sa nerezervuje“.
  Test: `source/tools/objednavka-test.mjs` (všetky odkazy otvoria okno, bez servera, server visí/zlyhá/Skúsiť znova
  cez `page.route`, bez internetu, klávesnica, presmerovanie, `?objednat=1`, žiadny odkaz na `rezervacia.html`; časti
  s php serverom a falošným rezervačným systémom bežia len s `asistent/vendor`).
- **`rezervacia.html` = len presmerovanie** (od 11. 11. 2026): samostatná rezervačná stránka už nie je cesta pre zákazníka.
  Staré odkazy a Instagram (`rezervacia.html?sluzba=1&barber=Adrian`) presmeruje skript hneď na
  `index.html?objednat=1&sluzba=1&barber=Adrian` (okno s predvoľbou), bez skriptu `meta refresh` na `index.html?objednat=1`,
  a na stránke je viditeľný odkaz Objednať sa a telefón. `noindex`, canonical na hlavnú stránku, nie je v `sitemap.xml`
  ani v JSON-LD (nasadenie ju tam už nepridáva). `assets/rezervacia.js` a `rezervacia.css` sú preč; fotky skupín služieb
  (vlastné výrezy 16 : 6 `assets/img/rez/rez-<skupina>-{760,1080,1600}.{avif,webp,jpg}` zo zdrojových fotiek,
  `source/tools/rez-fotky.py`, Lajko 9. 11. 2026) ukazuje okno objednávky (`objednavka.js`, `FOTO_SKUP`). Admin ju naďalej číta (texty a telefón, cenník ani tím nemá).
  Pred prepnutím domény platí bod 2 v Nasadení: na `www.barbershop30.sk` ju nedávať na `/rezervacia.html`.

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
  cenu prepíše sám) a uloženie zastaví, kým niektorá odpoveď hovorí cenu, ktorá v cenníku nie je. Zmena názvu alebo
  ceny služby sa prepíše aj v údajoch pre Google (`application/ld+json` v `index.html`). Fotky zmenší
  v prehliadači (WebP a JPEG, tím 480/820, galéria 640/1080/1600). Záložka Kontakt a hodiny zmení telefón (mobil),
  e‑mail a otváracie hodiny (Po–Pi a sobota, celé hodiny) naraz vo všetkých súboroch zoznamu `KONTAKT` v `admin.js`
  (web, preklady, app.js HOURS, asistent aj jeho server, kartička, vizitka, ukážky, pravidlo v CLAUDE.md); pred
  uložením ukáže počet miest a vety s časom otvorenia bez dňa na kontrolu. Adresu a nedeľu mení tvorca webu.
  `source/tools/otazky.mjs` berie povolené časy z app.js. Test: `node source/tools/admin-test.mjs`
  (falošný GitHub v pamäti, nič nejde von). Funguje až po zverejnení webu v `main` (číta súbory odtiaľ).

## Logá prevádzok

Lajko 9. 11. 2026 večer: „pridať logá Salónu 30 a HEAD SPA 30 krásne a profesionálne, s preklikom na ich web aj Instagram“.
V pätičke `index.html` (blok `.footer-shops`) má každá prevádzka logo nad menom v tom istom odkaze na jej web (preto
`alt=""`, meno je text odkazu), pod opisom odkazy **Web** a **Instagram** (`target="_blank" rel="noopener"`, `aria-label`
s menom prevádzky, kľúče vo všetkých 7 slovníkoch). Štýl `assets/style.css` (`.footer-shop-logo`: výška 40 px, `.footer-shop-web`).

| prevádzka | súbor | zdroj (stiahnuté 11. 11. 2026, curl) | úprava | odkazy |
|---|---|---|---|---|
| HEAD SPA 30 | `assets/img/prevadzky/head-spa-30.svg` (614 B) | znak v hlavičke https://www.headspa30.sk/ (inline SVG `.mark`, viewBox 64 × 64: kruh `#d9b56a`, lotos `#f3c98a`, linka) | len vyčistené: bez tried a `pathLength` pre animáciu, pridaný `xmlns`; krivky a farby bez zmeny | https://www.headspa30.sk/, https://www.instagram.com/headspa.salon30/ |
| Salón 30 | `assets/img/prevadzky/salon-30.webp` (1,4 kB) | https://www.salon30.sk/images/demo/logo.png (100 × 101 px, biele na priehľadnom; iné ani väčšie logo web nemá: `logo@2x.png`, `logo.svg` → 404) | orezané priehľadné okraje na 100 × 74 px, bezstratové WebP (bod po bode zhodné s PNG); zobrazené 54 × 40 px = 2× na telefóne s DPR 2 | https://www.salon30.sk/, https://www.instagram.com/salon30_nitra/ |
| Barbershop 30 | `assets/img/ikona/ikona-192.png` (ikona tohto webu „30“ s linkou lampy) | vlastná | žiadna (atrament ikony = atrament pätičky `#0e0d0c`, štvorec nevidno) | úvod stránky, https://www.instagram.com/barbershop30_nitra/ |

Prevádzkovateľ: Salón 30 – päta salon30.sk „Facepalm s.r.o., IČO: 52231381“, ten istý ako Barbershop 30 (FACEPALM, s.r.o.,
IČO 52231381). HEAD SPA 30 – headspa30.sk prevádzkovateľa neuvádza (`pravne.html` má polia Obchodné meno a IČO prázdne;
adresa Mostná 226/30, e-mail info@salon30.sk, „samostatná časť s vlastným tímom v priestoroch Salónu 30“). Svetlý variant
netreba: Salón 30 je už biely, HEAD SPA 30 zlatý (kontrast na atramente 10 : 1), nič sa neprekresľovalo.

Čo si vyžiadať (zlepší ostrosť, nie je podmienkou): od Salónu 30 logo vo vektore (SVG/PDF/AI) alebo PNG s priehľadným
pozadím aspoň 240 px na výšku – dnešných 100 px je na iPhone (DPR 3) mierne mäkkých a podtitul „DÁMSKE KADERNÍCTVO“ je pri
40 px len čiarka; od HEAD SPA 30 potvrdenie prevádzkovateľa (pre zápis zdrojov) a súhlas oboch prevádzok s použitím loga
(rovnaká skupina, logá sú z ich oficiálnych webov). Výmena: nový súbor pod tým istým menom (alebo nové meno a `src`
v `index.html`), upraviť `width`/`height` v pomere strán, `node source/tools/en-stranka.mjs`, `node source/tools/vaha.mjs`.
Váha: logá a odkazy v pätičke stoja +152 B gzip nasadenej `index.html`; −52 B vrátilo, že galéria už nemá
`data-lightbox-alt` (bol zhodný s `alt` obrázka a zväčšenie berie popis z `alt`, `app.js` `show()`), spolu 14 565 B < 14 600 B.

## Nasadenie

Teraz: podpriečinok `/barbershop-30/` webu HEAD SPA 30 (GitHub Pages, vetva `main`,
`.github/workflows/pages.yml` kopíruje `index.html`, `rezervacia.html`, `404.html`, `robots.txt`, `sitemap.xml`, `assets/`,
`karta/` a `admin/` a nakoniec vytvorí anglickú stránku `en/` zo slovenskej po všetkých úpravách).

Základná adresa webu je v súboroch rovno tá, kde web naozaj beží: `https://d8f5s88zjy-art.github.io/head-spa-30/barbershop-30/`
(canonical, og:url, og:image a JSON-LD v `index.html` a `rezervacia.html`, `404.html`, `robots.txt`, `sitemap.xml`;
miesta sú označené komentárom DEPLOY STEP). Pri vlastnej doméne ju prepne jeden príkaz z koreňa `barbershop-30`
a potom `node source/tools/en-stranka.mjs` (anglická stránka prevezme novú adresu):

    sed -i 's#https://d8f5s88zjy-art.github.io/head-spa-30/barbershop-30/#https://www.barbershop30.sk/#g' index.html rezervacia.html 404.html robots.txt sitemap.xml

Pred prepnutím domény www.barbershop30.sk na nový web (otázka 21 pre majiteľa, kontroly 29. 10. a 2. 11. 2026): všetky
tlačidlá Objednať sa a `potentialAction` v JSON-LD vedú na `https://www.barbershop30.sk/rezervacia`. Koreň domény dnes
obsluhuje Laravel (cookie `laravel_session`, `/index.html` vráti 404): rezervačný systém je jeho stránka `/rezervacia`
(komponent `v-order-component`), objednávka ide na `/rezervacia/ajax` a štýly, skripty a obrázky sú v `css/`, `js/`,
`images/` a `fonts/`. Preto:
1. s hostingom a správcom rezervácie písomne potvrdiť, že `index.php`, `/rezervacia`, `/rezervacia/ajax`, `css/`, `js/`,
   `images/` a `fonts/` ostanú a nový web pôjde len **vedľa** nich (nie „namiesto“ starého webu, nahratie cez FTP
   nesmie tieto priečinky prepísať ani zmazať);
2. nový web nesmie mať nič na `/rezervacia` ani `/rezervacia.html`: pri zapnutom MultiViews by Apache na `/rezervacia`
   vrátil našu statickú stránku s kódom 200 a objednať by sa nedalo. Našu stránku dať na inú adresu (návrh
   `/objednavka/`) alebo mať písomne potvrdené vypnuté MultiViews;
3. zoznam adries starého webu a 301 na nové stránky;
4. **pred prepnutím aj hneď po ňom** spustiť kontrolu domény (samotný kód 200 nestačí, kontroluje aj obsah stránky,
   štýly, endpoint objednávky a presmerovanie na HTTPS):

       bash source/tools/domena-kontrola.sh https://www.barbershop30.sk --web=https://www.barbershop30.sk/

   Návratový kód 0 = kritické kontroly (rezervačný systém, `css/app.css` a `js/app.js`, `/rezervacia/ajax` 405,
   `https://…/rezervacia/` neodchádza na http) prešli. Dnes hlási REZ-08: `https://…/rezervacia/` presmeruje na `http://`
   a HTTP nepresmeruje na HTTPS; to opraví hosting (presmerovanie na HTTPS na celej doméne).

Zlá adresa: GitHub Pages ukáže na každej neexistujúcej adrese len koreňový `/404.html` (HEAD SPA 30). Ten pri ceste
s `/barbershop-30/` ukáže blok Barbershopu 30 (Objednať sa, Zavolať 0951 267 203, Späť na úvod). `404.html` v tomto
priečinku je tá istá chybová stránka pre vlastnú doménu a samostatné nasadenie (`nasad-barbershop30.sh`).

## Nástroje (`source/tools/`, Playwright a Python s Pillow)

- `film.py` – zábery filmu: stupne 1086/1448/2172/2896 px (fasáda vstupu aj 4096), výrezy na výšku
  pre telefón `<meno>-m-*` a hĺbkové mapy (`hlbka.py`, Depth Anything V2 small ONNX; model ~99 MB nie je
  v gite – stiahni ho do `source/tools/depth/model.onnx` alebo daj cestu v `DEPTH_MODEL`).
- `stills.py` – z `assets/img/film/film.json` prepíše zálohy a kotvy záberov v `index.html`.
- `build_images.py` – fotky galérie, tímu a videopostery (`assets/img/manifest.json`).
- `vychytavky-test.mjs` – pripomienka strihu (.ics, Google Kalendár), Pošli kamarátovi, manifest a ikony; `ikony.mjs` – ikony na plochu.
- `en-stranka.mjs` – anglická stránka `en/index.html` zo slovenskej (pri nasadení; `--check` overí kópiu v repozitári);
  `en-test.mjs` – anglická stránka a SEO úvodu (titulok, popis, H1, časté otázky, cesty, prepínač jazyka).
- `i18n-test.mjs` – jazykové verzie: každý jazyk bez nepreložených textov, tabuľa hodín, Booqme, prepínač na počítači aj v menu telefónu, návrat do slovenčiny.
- `nahlad.mjs` – náhľad na kontrolu (úvod, pás tímu, cenník, galéria, rezervácia na 360/390/430 px, tablete a počítači), odkazy tel: a Objednať sa, obmedzený pohyb, bez skriptu;
  `mobil-audit.mjs` – snímky celej stránky po krokoch skrolu s pretekaním, pevnými prvkami a podielom tmy;
- `tma-test.mjs` – film nikdy neukáže čierne plátno (pomalá sieť, rýchly skrol a skoky cez menu);
  `asistent-test.mjs` – okno asistenta so serverom a falošným API; `admin-test.mjs` – admin s falošným GitHubom
  (prihlásenie, texty, cenník, tím, galéria, súbeh, web po zmenách); `objednavka-test.mjs` – objednávkové okno, vizitka
  a vernostná kartička proti falošnému rezervačnému systému.
- `kino-test.mjs` – pás kapitol a Kino: ťah myšou aj ťuk na počítači, popis ▶ pre čítačku v jazyku stránky (sk, en, de, en/),
  „Ďalej“ hneď za pásom a nikdy na texte karty (na okne do 500 px výšky sa neukáže), pás nad pásmi s textom schovaný.
- `prekryv-test.mjs` – žiadne dva texty cez seba (zákazník 9. 11. 2026): okná 320/360/390/430/768/1440 px bez filmu aj
  s `?film=on` a nízke okná telefónu (iPhone s lištou Safari 390×664, 360×614, 430×733, 320×447). Stránka po krokoch,
  hrany pásov cez miesto „Ďalej“ a pásu kapitol po 16 px, skutočné čakanie na cieli kapitol; 0 prekrytí = OK
  (asi 20 minút; `--w=390 --film=off --nizke=nie` je rýchla skúška jedného okna). Výsledok nezávisí od časovania:
  „Ďalej“ svieti len tam, kde jeho obdĺžnik s rezervou 8 px nepretína žiadny viditeľný text (`kino.js` `volno()`,
  meria sa pri zastavení a pri každej zmene), pri skrole zhasne v tej istej snímke (test to overí) a pás kapitol sa
  schová skôr, než sa ho okraj pásu s textom dotkne (celý jeho obdĺžnik + 8 px, `app.js` `kresliPas`).
  Navyše (K1-1, 11. 11. 2026): plávajúca lišta Zavolať/Objednať sa nikdy cez tlačidlá titulnej karty úvodu v 6 oknách
  telefónu 320×568 až 430×932 (skrol 0–1 400 px); na nízkom telefóne sa lišta ukáže až po zhasnutí karty (`--lista=nie` vypne).
  Na konci **vrstvy** (L3, 11. 11. 2026; samostatne `--len=vrstvy`, asi 3 minúty, vypnúť `--vrstvy=nie`): bublina Barbera
  („Ahoj, som Barber…“, `?asistent=ukazka`) a ponuka jazyka („This page is also in English.“ v jazykoch en, de, uk)
  v oknách 320/390/430/1440 na úvode, začiatku scény a cieli kapitol Poď ďalej, Remeslo, Čakáreň, Tím: kým svietia,
  ich obdĺžnik nepretína žiadny riadok viditeľného textu (karty ani iného) a po posune o 40 px zhasnú v najbližšej
  snímke. Obe sa ukážu len na mieste bez textu (`assets/volno.js`, to isté pravidlo ako „Ďalej“): ponuka je hneď pod
  lištou (na fotke záberu), bublina pri ikone počká na voľné miesto; meria sa len v pokoji.
- `podklad-test.mjs` – pás pod plávajúcou lištou a ikonou Barbera (S-1, 11. 11. 2026): 7 okien (320×568, 360×640,
  390×664, 390×844, 430×932, 768×1024, 1440×900) × slovensky a `en/` × bez filmu a s `?film=on`, zastavenia po 0,7 okna
  cez celú stránku a úplný spodok. V obdĺžniku lišty (jej tlačidlá) aj ikony, každý + 8 px, nesmie byť viditeľný žiadny
  znak textu stránky: body riadkov textu po 3 px, `document.elementsFromPoint` (pointer-events sa na meranie zapnú
  všetkým prvkom) a nad textom musí byť podklad s alfou × krytie ≥ 0,9 (prechody sa nerátajú). Na spodku musí byť celá
  pätička nad lištou, ikonou aj pásom. Test nesmie prejsť naprázdno (lišta a ikona sa musia ukázať). Asi 20 minút
  (`--okna=390x844 --jazyk=sk --film=off` je rýchla skúška, `--naraz=5` súbežne). Na 751156d9 zlyhá vo všetkých 28 oknách.
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
