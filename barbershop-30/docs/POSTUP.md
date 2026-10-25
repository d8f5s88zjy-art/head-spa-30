# Postup prác na Barbershop 30 (záznam na nadviazanie)

Zadávateľ chce, aby sa každá ďalšia práca dala nadviazať aj v novej relácii. Tu je stručne, čo je hotové, čo je
rozpracované, čo sa rozhodlo a na čo sa čaká. Pri každom kroku sa tento súbor doplní (najnovšie hore v časti Denník).
Podrobnosti sú v `docs/CHECKS.md` (kontroly), `README.md` (technika) a `../asistent/README.md` (server asistenta).

## Stav (2026‑10‑22)

Vetva `claude/head-spa-30-page-uil3m0`, do `main` sa nasadzuje len so súhlasom zadávateľa (zatiaľ nebol daný).
Náhľad cez raw.githack.com s ukážkami: `.../barbershop-30/index.html?asistent=ukazka&objednavka=ukazka`
a `.../barbershop-30/rezervacia.html?asistent=ukazka&objednavka=ukazka`.

Hotové na vetve:
- Web Barbershop 30: film z fotiek, úvodné dvere, cenník, tím, galéria, kontakt, 8 jazykov.
- Rezervačná stránka `rezervacia.html` v dizajne webu, objednávka v štýle webu (služba, barber, deň, čas);
  posielanie rezervácie do ich systému nie je zapojené (čaká na súhlas prevádzky).
- Ukážky na kontrolu bez servera: `?objednavka=ukazka`, `?asistent=ukazka`.
- Asistent Barber: ikona je logo, bublina pri ikone (Spýtať sa, Zavolať), chat, Zavolať v hlavičke, Skryť Barbera.
- Vizitka (ich skutočná), téma pre ich stránku barbershop30.sk/rezervacia (`assets/tema-rezervacia.css`).
- Miesto na fotky práce barberov (`assets/praca.json`, `source/tools/praca.py`), fotky treba od barberov.

Rozpracované (požiadavky z 2026‑10‑22):
1. HOTOVÉ (pozri Denník): Barber má mať aspoň 250 odpovedí na časté otázky, pohodlne na telefóne.
   Rozhodnutie: všetky odpovede sú v `../asistent/znalosti/barbershop-otazky.json` (len overené fakty z
   `barbershop.md` a webu). Server ku každej otázke pridá modelu najviac 6 najpodobnejších (lacnejšie ako celý
   zoznam pri každej otázke, pri nízkej návštevnosti by cache často vypršala). V okne: témy a otázky ťuknutím
   (okamžitá pripravená odpoveď, označená), súvisiace otázky pod odpoveďou, ukážka odpovedá z tých istých odpovedí.
   Telefón: okno sa pri klávesnici prispôsobí viditeľnej ploche, clona za oknom, ťukacie plochy 44 px.
2. HOTOVÉ na vetve: podpis v pätičke „Grafický dizajn a web: Samuel Pavelka“ (index aj rezervacia.html); znenie potvrdiť.
3. HOTOVÉ (CHECKS 23): Vernostná kartička: odkaz v pätičke Barbershopu vedie na stránku na headspa30.sk (HEAD SPA 30), opraviť na
   kartičku Barbershopu. Po zaplatení má zákazník dostať ponuku založiť si účet (body, odmeny). Odmeny a akcie
   nastavuje Lajko sám v admine kartičky (`../vernost/`, admin `https://www.headspa30.sk/vernost/admin/`).
4. HOTOVÉ (CHECKS 24): Admin pre Lajka: aby mohol meniť texty, fotky (a odmeny kartičky) sám, ako administrátor.
   `admin/` (naostro `https://d8f5s88zjy-art.github.io/head-spa-30/barbershop-30/admin/` po zverejnení), prihlásenie
   kľúčom GitHub, uloženie jedným commitom do `main`. Texty, cenník, tím (aj nový člen a fotka), galéria, odpovede
   asistenta; jedna zmena upraví obe stránky, preklady, znalosti asistenta a odpovede. Kontakt a hodiny (telefón,
   e‑mail, Po–Pi a sobota) naraz vo všetkých súboroch (2026‑10‑24, CHECKS 25); adresu a nedeľu mení tvorca webu.
   Odmeny kartičky: admin kartičky.
   Kľúč pre Lajka vytvorí zadávateľ na účte webu (postup na prihlasovacej stránke adminu).
5. HOTOVÉ (pozri Denník a CHECKS 22): web na telefóne pôsobí ako PowerPoint prezentácia. Chce živý web na telefóne, každá
   animácia so silným háčikom, aby zákazník ostal a objednal sa. Ikony zmenšiť, aby tak nebili do očí.

Analýza kartičky (bod 3, hotové): odkaz v pätičke vedie na https://www.headspa30.sk/vernost/karta/, server
kartičky tam ešte nie je nahratý, preto 404 stránka HEAD SPA 30. Plán: kartička Barbershopu priamo na webe
Barbershopu (`barbershop-30/karta/`, kópie `vernost/karta/*` ako pri `vernost.js`, API cez `data-api`, lokálne
`/vernost/api/`), server vráti odkaz na kartičku podľa prevádzky (`PREVADZKY['barbershop']['karta']`, e‑mail,
novinka), statický manifest pre Barbershop, formulár na založenie kartičky na stránke (`?nova`), v admine kartičky
QR kód „nový klient“ pre recepciu po zaplatení; kým server nebeží, stránka to poctivo povie a dá telefón.
Testy `vernost/testy/e2e.mjs` očakávajú `/vernost/karta/` pre barbershop (riadky 38, 119), treba upraviť.

Čaká sa na zadávateľa:
- súhlas so zverejnením do `main`;
- kľúč ANTHROPIC_API_KEY a prístupy FTP (asistent naostro), ASISTENT_KALENDAR_URL;
- áno alebo nie: posielať rezervácie priamo do ich systému na barbershop30.sk;
- kto spravuje barbershop30.sk (vloženie témy jedným riadkom);
- fotky práce barberov, čitateľná fotka vizitky;
- presné znenie podpisu v pätičke; heslo do adminu kartičky Barbershopu (GitHub tajomstvo `VERNOST_HESLO_BARBERSHOP`);
- kľúč GitHub pre Lajka do adminu webu (vytvára sa na účte webu, až po zverejnení do `main`).

## Denník

- 2026‑10‑25 (hotové, CHECKS 26, snímky a testy OK): zadávateľ: „na telefóne nie je fotky vidno úplne, okná zakrývajú celú obrazovku“.
  Príčina: fotka na šírku cez celú výšku displeja ukáže najviac tretinu šírky (film ešte priblíži, spolu asi štvrtina),
  karta s textom a stmavenie prekrývali spodnú polovicu. Riešenie (P16 v style.css, film.js PAS_B a aim()): na telefóne
  na výšku je fotka scény v hornom páse 56 % výšky (fotka na šírku, asi 2× viac šírky), text pod ňou na atramente;
  prológ ostáva cez celé okno. Galéria: celé fotky v pomere strán (na šírku cez celú šírku, tri na výšku vedľa seba),
  tím: celá fotka 820 × 694. Menu panel podľa obsahu so stmavenou stránkou (ťuk zavrie), objednávka panel zdola 82 %,
  asistent 72 %. Zálohy bez výrezov -m (okrem prológu), sizes 170vw, stills.py upravený. Overené snímky 360/390/430
  s filmom aj bez neho, zhoda zálohy s filmom, testy app-smoke, i18n, objednávka, asistent, tma OK. Čaká sa na
  pohľad zadávateľa na skutočnom telefóne.

- 2026‑10‑24: dokončené nedokončené veci: admin Kontakt a hodiny (telefón, e‑mail, hodiny naraz v 27 súboroch vrátane
  servera asistenta, kartičky a CLAUDE.md; test 100 OK), odkaz Ochrana osobných údajov na kartičke Barbershopu viedol
  na neexistujúcu stránku (opravené, vernost 118 OK), validátor otázok berie hodiny z app.js.
  Zadávateľovi ukradli iPhone, na ktorom je prihlásený do Claude: kým nepotvrdí z bezpečného zariadenia, že sa
  odhlásil zo všetkých zariadení, nič sa nezverejňuje ani neposiela von.

- 2026‑10‑22: admin pre Lajka (`admin/`, `source/tools/admin-test.mjs` 63 OK s falošným GitHubom): texty, cenník,
  tím, galéria, odpovede asistenta, odkazy na admin kartičky. Pages kopíruje `admin/`, robots ho vylučuje.
  Funguje až po zverejnení do `main`, lebo číta a ukladá `main`. Ďalej: súhlas so zverejnením a kľúč pre Lajka.

- 2026‑10‑22: kartička Barbershopu na jeho webe (`barbershop-30/karta/`), pätička už nevedie na headspa30.sk,
  založenie kartičky cez QR na recepcii po zaplatení (`?nova`, admin kartičky → QR pre nového klienta), odmeny
  a akcie nastavuje Lajko v admine kartičky (`https://www.headspa30.sk/vernost/admin/`). Test 117 OK.
- 2026‑10‑22: živý telefón (P15): pohyb kamery aj bez filmu, hĺbka kariet, 7 háčikov s výzvou na objednanie,
  živý stav otváracích hodín v úvode, cenník so záložkami a kratšími riadkami, posunutie pásov tímu a galérie,
  menšie ikony (asistent 48/44 px, spodná lišta). Podpis v pätičke „Grafický dizajn a web: Samuel Pavelka“
  (meno z účtu zadávateľa, potvrdiť pred zverejnením). Ďalej: kartička Barbershopu (bod 3), admin pre Lajka (bod 4).
- 2026‑10‑22: časté otázky hotové: 251 odpovedí, hľadanie v prehliadači aj na serveri, témy a otázky ťuknutím,
  súvisiace otázky, clona a klávesnica na telefóne, testy (prehliadač 71 OK, server 37 + 17 OK). Zdroj otázok je
  JSON, upravuje sa priamo v ňom (`node barbershop-30/source/tools/otazky.mjs` po úprave).
- 2026‑10‑22: 251 overených odpovedí na časté otázky (`barbershop-otazky.json`); zadané: podpis, kartička
  Barbershopu namiesto HEAD SPA 30, účet po zaplatení, admin pre Lajka, tento záznam.
- 2026‑10‑22: asistent Barber (logo, bublina, skrytie, ukážka), commit 496a5dc; snímky testov d5ddfea.
- 2026‑10‑22: ukážka objednávky bez servera, téma pre barbershop30.sk/rezervacia, rezervácia s fotkami.
- 2026‑10‑21: objednávka v štýle webu, vizitka, vernostná kartička na stránke, asistent s voľnými termínmi.
