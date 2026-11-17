# Stavebniny Richtárik, nový web

Modernizovaná verzia webu www.stavebninyrichtarik.sk. Všetky údaje (adresa, telefóny, IČO,
otváracie hodiny, sortiment, značky, akcie, ceny, zľavy 5 % a 3,3 %) aj texty a obrázky
produktov sú prevzaté z pôvodnej stránky, nič nie je vymyslené.

## Čo web obsahuje
- Úvod s vyhľadávaním, akciami, katalógom, zľavami, službami, novinkami a kontaktom. Pás faktov pod fotkami predajne má tri
  prvky: 1997 · Zákaznícka karta (zľava z cien: 5 % pri platbe v hotovosti, 3,3 % pri platbe platobnou kartou a tretí riadok
  „Špeciálne zľavy pre stavebné firmy a živnostníkov“ `.f-firmy` – znenie podľa majiteľa 17. 11. 2026, predtým „ďalšia zľava
  z akciových cien“; jeden prvok, nie dva rovnaké riadky – Lajko 13. 11. 2026) · 40+ značiek; ten istý pás je na O nás (`FAKTY_ONAS`, `.facts.fk`).
  To isté znenie má veta zľavy v `data/cennik.json` (akcie, Leták, karta zliav na Službách), doplnok popisov akcií
  (`texty.popis`, `Seo::AKCIA_DOPLNOK`), Časté otázky a asistent.
  Na širokom okne (od 1300 px, úvod) sú 5 % a 3,3 % vpravo v rade s 1997 a 40+. Čísla zľavy sú na úvode len v tomto páse:
  sekcia Zľavy nižšie („Zákaznícka karta a zľavy pre firmy“) hovorí o karte a špeciálnych zľavách pre firmy, živnostníkov
  a predajne, percentá neopakuje (kontrola 13. 11. 2026).
- Katalóg: 15 kategórií a všetky podstránky pôvodného webu (Pezinské tehelne, Porfix, Ytong,
  Blachotrapez, Tondach, Fakro, Schiedel, Baumit…), bočné menu s výberom kategórie.
- Akcie (15 akcií s letákom a PDF; na 10 z nich ceny z cenníka akcií z 28. 1. 2026 v tabuľke), Novinky (8), Galéria
  (predajňa a sklad a 4 výstavy, lightbox), Služby, Doprava, Časté otázky, O nás, Kontakt, Akciový leták, stránka 404.
- Doprava (`doprava.html`): vlastné autá, doprava po celom Slovensku a podmienky dopravy pri akciách, len fakty
  z pôvodného webu a cenníka, fotka dvora (žiadne auto). Časté otázky (`caste-otazky.html`): 15 otázok, odpovede
  doslova z overenej databázy otázok predajne (časť Texty a SEO).
- Prehliadka predajne priamo na stránke (úvod, sekcia Predajňa, a Kontakt): „Prechádzka predajňou“ – 9 zastávok
  zo skutočných fotiek majiteľa so šípkami na zemi a pásom náhľadov – a druhá záložka „Pohľad z ulice (Google)“
  s rámom Street View vloženým až po kliknutí; nikoho neposielame von (časť Prehliadka predajne).
- Vyhľadávanie v celom katalógu bez ohľadu na diakritiku (`assets/index.json`).
- Asistent na otázky (okno vpravo dole, v náhľade ukážka z overených častých otázok, na ostrom webe len so serverom;
  časť Asistent na otázky a `asistent/README.md`).
- Pokyny majiteľa zo 17. 11. 2026 (e-mail „v prílohe Vám posielam, čo ešte treba zmeniť vo webe“, IMG_0347–0348; Lajko:
  „Budeš robiť, čo chce Mário“), druhá časť (prvá: zakladateľ, znenie karty, fotky katalógu a weby výrobcov):
  - **Názov pri logu s čiernym obrysom** (L1, Mário to žiadal na úvode; lišta je na všetkých stránkach ten istý komponent):
    `.lg-nazov` má osem ostrých tieňov `--obrys` (1 px, telefón vo farebnej téme 1,25 px), vo všetkých troch témach – na
    farebnom alebo svetlom slove (RICHTÁRIK vždy, STAVEBNINY v tmavej téme); čierne slovo STAVEBNINY vo farebnej a svetlej
    téme obrys nemá (čierny obrys na čiernom písme nie je vidieť, len spája písmená a zapĺňa otvory v B a N).
  - **Bez štítku „Skutočná fotka našej predajne v Nitre“** (L2) na úvode aj v uvítaní (`zdroj/uvitanie.*`); fotka ostala.
  - **Galéria bez albumu „Materiál v areáli predajne“** (L19, `data/galeria.json` id `dvor`, šablóna aj oblasť
    `galeria-dvor` sú preč, Python aj PHP); fotky `img/uvod/` ostávajú na úvode.
  - **Služby** (L21, L22, L23): pri službách 3D piktogramy (Výpočet spotreby ← „Zdarma výpočet“, Poradenstvo ←
    „Poradenstvo v stavebninách“, Množstevné zľavy ← „Zľavy“; `SLUZBY_OBR`, oblasť `sluzby-polozky`, priradenie podľa slova
    v nadpise služby), v karte zliav 3D zákaznícka karta, v časti Vlastná doprava auto z grafiky Rozvoz namiesto starých fotiek
    áut `img/p/883–885` (už nie sú v balíku), vo výzve pred pätou „Zavolajte nám“ a „Napíšte nám“ (oblasť `sluzby-kontakt`).
    Každý obrázok je na stránke raz (auto len vo Vlastnej doprave, nie aj pri službe Doprava na stavbu; „Zdarma výpočet“ len
    pri službe, výzva pred pätou ho už nemá). Otváracie hodiny na Službách nie sú, ich piktogram ostáva na Kontakte.
  - **3D zákaznícka karta** (L23, výrez `karta` z IMG_0312, `img/ilu/karta-3d-*`) na úvode (oblasť `uvod-karta`) a na Službách
    namiesto plochej `img/karta-nova-*`; pri inej adrese, PSČ, telefóne alebo e-maile v správe sa ukáže plochá karta
    (`GRAFIKA_PRI['karta']`; plochá karta má tie isté údaje – nová adresa či číslo znamená novú kartu od majiteľa).
  - **Tabule 3D** (L24): vysoká tabuľa (adresa, telefóny, e-mail, otváracia doba) na Kontakte v karte Predajňa a sklad (oblasť
    `kontakt-tabula`, len pri zhode údajov `GRAFIKA_PRI['tabula']`), široká „RICHTÁRIK Stavebniny“ na O nás pod fotkou predajne
    (`TABULA_ONAS`, bez údajov); obe ostávajú aj v Galérii. Opravené akciové letáky zatiaľ nemáme (Pre Mária).
  - Overené bez zmeny: auto na Doprave (L20), ilustrácia dlaždice Podhľady a PVC (L18); ilustrácia „Dlažby + obklady“ v štýle
    série (L17) chýba – Pre Mária. 3D názvy „RICHTÁRIK STAVEBNINY“ a obrázok s miestom 3D karty (prílohy e-mailu) nemáme.

## Ako sa web stavia
- Zdroj: `zdroj/pages.json` (obsah 83 stránok pôvodného webu) a `zdroj/obrazky.json`
  (rozmery obrázkov). Fotky produktov sú v `img/p/`, fotky z galérie v `img/g/` a `img/gt/`,
  PDF v `pdf/`, dokumenty Schiedel (.doc) a montážne video Onduvilla (MP4) v `subory/` – všetky súbory
  pôvodného webu sú na novom webe lokálne, odkazy sú relatívne.
- Generátor: `python3 build.py` (potrebuje lxml) prepíše všetky podstránky, `404.html`, `sitemap.xml`, `robots.txt`
  a `assets/index.json` (index hľadania). Úvod `index.html` negeneruje (časť Údržba).
  Texty podstránok, popisy kategórií a akcií sú v konštantách na začiatku `build.py`; úvod sa mení ručne.
- `popisy.py` má popisky 48 značiek napísané len z pôvodného sortimentu; karta značky
  má fotku (z podstránky alebo z kategórie), logo, popisok, rozbaľovací celý sortiment
  a odkaz na podstránku. Produkty bez fotky dostanú značkovú dlaždicu.
- `obsah.py` rozloží HTML pôvodného webu na bloky (produkt s parametrami a PDF, nadpis,
  text, zoznam, obrázky, logá, tabuľka, značky, galéria) a vykreslí ich ako moderné
  komponenty: produktové karty, karty značiek, kroky s obrázkom, figúry s popiskom.
- Štýly a skripty: `assets/site.css`, `assets/site.js` (menu, záloha objavovania blokov pri skrolovaní pre prehliadače
  bez časovej osi posunu, počítadlá, vyhľadávanie, zbalená päta na telefóne, lightbox s listovaním a popiskami – systémové Späť ho zatvorí a neodíde zo stránky, veľmi
  široký obrázok (banner) je na telefóne vo výške súboru a posúva sa prstom do strán (`.lb-siroky`) –, pás
  značiek s tlačidlom Zastaviť pohyb) a skript prechodov medzi stránkami v `<head>` (zdroj `zdroj/prechody.js`). Úvod je prvá obrazovka v štýle pôvodného webu: veľký nápis na fotke, tma len pod textom, fotky sa striedajú (časť Úvod nižšie). Celý web je svetlý
  (papier, malta, betón, tmavý text, tehlová ako akcent): lišta, spodná lišta, menu, päta aj lightbox. Každá podstránka
  má svetlú hlavičku s ostrou fotkou v ráme (`HLAVICKA_FOTO` v `build.py`), skutočné fotky dvora pri tovare, ktorý
  ukazujú. Pohyb celého webu (prechody medzi stránkami, odhalenia pri posune, ovládacie prvky) je v časti Pohyb
  a prechody nižšie.
- Predajné texty: hlavička každej kategórie má vlastnú vetu (`HOOKY` v `build.py`) len z faktov
  pôvodného webu (sklad, doprava, výpočet spotreby zadarmo, zľavy).
- `texty.py`: nadpisy H1, titulky a popisy stránok pre vyhľadávače (`STRANKY`), záväzné názvy značiek
  (`NAZVY_ZNACIEK`), opisy obrázkov (`OBR_ALT`, `GALERIA_ALT`) a úprava písania v textoch zdroja (typografia,
  jednotky, verzálky, preklepy). Pravidlá sú v časti Texty a SEO.
- `img/logo-rs-360|720.png|webp` je nové logo RS od majiteľa (9. 11. 2026, vyčistené zo snímky obrazovky, originál si
  žiadame; staré `logo.png` a `logo-white.png` sú zo stromu preč), fotky predajne a tovaru v `img/predajna/` a `img/uvod/`
  sú od majiteľa, ilustračné fotky kategórií sú z Pexels (`img/FOTKY.md`), kým sa nenafotí ďalší tovar; hlavička Porfixu
  (katalóg aj akcia) je od 13. 11. 2026 fotka výrobcu z porfix.sk – **pred spustením súhlas Porfixu** (`img/FOTKY.md`). Nová fotka sa uloží pod novým názvom (obrázky majú na hostingu cache na rok, časť Údržba).
- Propagačné grafiky majiteľa (e-maily zo 16. 11. 2026; `img/ilu/` a `img/grafika/`, pôvod a zoznam v `img/FOTKY.md`).
  Lajko 16. 11. 2026: na webe majú byť **všetky** Máriove obrázky (38) a v dlaždiciach skupín tovaru ilustrácie namiesto
  fotiek; skutočné fotky ostávajú po rozkliknutí skupiny. Kde sú:
  - **dlaždice skupín tovaru** na úvode a v Katalógu (`dlazdice()` v `build.py`, `.cats`): 15 ilustrácií, jednotná mriežka
    5 / 3 / 2 stĺpce so štvorcovým obrázkom (z ilustrácie sa nič neorezáva), prvá dlaždica je na telefóne naležato. Dlažby
    a ploty majú zatiaľ Máriov obrázok dlažby iného štýlu (`dlazby-*`), výmena za sériový 1 : 1 pod tým istým menom.
    Blok `.cats` v ručnom `index.html` je výstup `dlazdice('index.html', cisla=True)`. Hlavičky kategórií
    (`HLAVICKA_FOTO`, `KAT[..][4]`; od 17. 11. 2026 pri 10 kategóriách Máriove fotky `KAT_FOTO`), fotky tovaru a galéria
    majú ďalej skutočné fotky;
  - výzva „Potrebujete cenu na konkrétne množstvo?“ (`.kat-cta.ilu`) na 15 stránkach kategórií (`KAT_ILUSTRACIA`; podstránky
    značiek ju nemajú) a Poradenstvo vo výzve „Nenašli ste, čo hľadáte?“ v Katalógu (`.sort-note.ilu`);
  - karty Zavolajte nám a Napíšte nám na Kontakte (oblasť `kontakt-karty`, `.kk2`) a hodiny v karte Otváracie hodiny
    (oblasť `hodiny-kontakt`, `.khod-obr`) a vysoká tabuľa v karte Predajňa a sklad (oblasť `kontakt-tabula`, `.ktab`);
    na Službách od 17. 11. 2026 „Zdarma výpočet“, Poradenstvo a ikona zliav (s podmienkou) pri službách (oblasť
    `sluzby-polozky`, `.srv-obr`), 3D zákaznícka karta v karte zliav (oblasť `sluzby-zlavy`, `.kat-cta.zl`), auto Rozvoz vo
    Vlastnej doprave a „Zavolajte nám“ s „Napíšte nám“ vo výzve pred pätou (`page(cta_obr=…)`, oblasť `sluzby-kontakt`,
    `.cta-ik`); 3D karta aj na úvode (oblasť `uvod-karta`) a široká tabuľa na O nás (`TABULA_ONAS`);
  - auto z obrázka „Rozvoz stavebného materiálu“ na Doprave vedľa štyroch bodov a na Službách (`rozvoz_figura()`, `.rozvoz`): výrez **bez nápisu**, lebo jeho
    druhý riadok má „AVIA 3t“ a Avia je 3,5 t (výrez je mnohouholník, roh s nápisom je priehľadný – `nastroje/grafika_maria.sh`; rámik má pod ním odtiene podlahy
    obrázka, aby roh nebol vidno ako svetlejší klin);
  - dva letáky a dva bannery na stránke Leták v časti „Letáky a bannery“ (oblasť `galeria-letaky`) a logá, tabule, vizitka,
    zákaznícka karta a päť ilustrácií iného štýlu v albume „Logo a firemná grafika“ na konci Galérie, za fotkami predajne
    a výstav (oblasť `galeria-grafika`): náhľady v rámikoch 4 : 3 zarovnaných hore (letáky dva v rade ako susedné časti
    stránky, album šesť v rade), po kliknutí veľký obrázok. Obrázok nahraný v správe má v rámiku šírky 600 a 1 200 px
    (`srcset`, `sizes`). Položky sú v `data/galeria.json` (albumy `letaky`, `grafika`, prenesené
    `nastroje/export_grafika.py`), správa ich vie skryť, nahradiť, popísať a posunúť. Letáky a bannery majú preklepy –
    Lajko o nich vie; opravená verzia od Mária sa vymení cez „Nahradiť inou fotkou“ v správe, alebo novým výrezom do zdroja
  (pod tým istým menom len kým web nie je na hostingu, potom pod novým menom – cache na rok; `img/FOTKY.md`).
  **Obrázok s údajom nesmie klamať:** hodiny, ikona zliav, tabuľa s kontaktom, vizitka, karta a oba letáky sa vykreslia len
  vtedy, keď údaje v `data/firma.json` a `data/cennik.json` sú tie, ktoré majú v sebe (`GRAFIKA_UDAJE` v `build.py`,
  `udaje_platia()` v `nastroje/vykreslenie.py` aj `sprava/jadro/Vykreslenie.php`, pri položkách albumov pole `plati_pri`);
  po zmene v správe obrázok zmizne a text ostane. Pri zľave sa kontrolujú celé spojenia „5 % pri platbe v hotovosti“
  a „3,3 % pri platbe platobnou kartou“ (zmena jediného čísla obrázok skryje); zákaznícka karta má v podmienke aj PSČ.
  „Horné Krškany“ na karte a letáku sa nekontroluje (časť obce sa v správe nemení). Všetky sú lenivé, nikde nie sú LCP; opisy (alt) v `texty.OBR_ALT`
  (`ilu:<názov>`), pri albumoch v dátach (`popis`). Zdroj `zdroj/grafika-maria/` (38 výrezov) a výroba
  `bash nastroje/grafika_maria.sh` (len orez, zmenšenie, doostrenie; nič nad skutočný detail snímok).
- Karty značiek v kategórii (`obsah.py` `_brand`, fotka v `popisy.py` `ZNACKY`): vlastná fotka (z pôvodného webu `p/ID`,
  Máriova `predajna:<názov>` alebo ilustračná z `img/`), inak **logo značky na bielom poli** (`.zm.logo`), bez loga len text
  (`.znacka.bez`). Fotka kategórie sa na kartách neopakuje – je v hlavičke stránky (do 13. 11. 2026 mala Izolácia tú istú
  fotku 10× za sebou, sadrokartón 3×).
  **Odkaz „Web výrobcu“ a logá podľa majiteľa (e-mail 17. 11. 2026):** `popisy.WEB_ZNACIEK` má prednosť pred adresou
  z pôvodného webu (`zdroj/pages.json` sa nemení, je záznamom pôvodného webu), `None` = karta bez odkazu (Parabit);
  `popisy.LOGA_ZNACIEK` dá karte logo z `img/logo/` s vlastným opisom (Stadreko na Komínových systémoch aj na Dlažbách
  namiesto loga Qatro `img/p/52`, RG plast deva pri Easytherm na Izolačnom materiáli). Adresy: Univerbau (Sypké zmesi aj
  Fasádny systém) `http://www.univerbau.sk` – https tam má certifikát len pre `univerbau.sk`, preto http –, Betonárka
  Nadlice `https://www.betonarkanadlice.sk`, Tondach `https://www.wienerberger.sk`, City Stone Design
  `https://www.citystonedesign.sk`, Stadreko `https://www.stadreko.sk`, Schiedel `https://www.schiedel.sk`, Yssel Steel
  `https://www.yssel.sk`, Masonite `https://www.masonite.com`, Slovakia Trend `https://www.stendpro.sk` (17. 11. 2026 sa
  z tohto prostredia nedal otvoriť – overiť v prehliadači), DS Haco `https://www.hacoslovakia.sk` (robotovi vracia 403).
  Ostatné adresy sú z pôvodného webu.

## Téma podkladu: farebná (predvolená), svetlý papier a tmavá „čierno-biela“

**Čierno-bielo-červená paleta (Lajko 17. 11. 2026: „urob to celé do čierno-bielo-červenej“).** Farby rozhrania všetkých
stránok vo všetkých troch témach (lišta, menu, päta, uvítanie, karty, tlačidlá, štítky, pásy sekcií, hľadanie, lightbox,
asistent, 404, Ochrana údajov, `theme-color`) sú len biela, čierna, neutrálne šedé (R = G = B) na linky, vedľajší text
a striedanie pásov a červená loga RS, zmeraná z `img/logo-rs-720.png` (najčastejší pixel `#d93439`), v štyroch odtieňoch
toho istého tónu (358°):

| odtieň | použitie | kontrast |
|---|---|---|
| `#d93439` (`--brick`, `--f-cervena`) | tlačidlá s bielym písmom, veľké písmo (názov v lište, „Za super ceny.“, percentá), linky, grafika | biela na nej 4,67 : 1 |
| `#b42226` (`--brick-txt`, `--brick-dk`, `--brick-hover`) | malé červené písmo na svetlom, tlačidlo pod myšou | na bielej 6,57, na `#e0e0e0` 4,98 |
| `#921b1f` | tmavší stav pod myšou (šípky prechádzky) | – |
| `#e57679` (`--brick-svetla`, `--brick-pale`) | malé červené písmo na čiernom (päta, tmavá téma) | na `#111` 6,47, na `#2b2b2b` 4,85 |

Béžové, krémové, pieskové a teplosivé tóny (`#faf8f4`, `#f6eee4`, `#efe3d5`, `#f3f0ea`, `#e6e2dc`, `#dcd7cf`, `#141210`,
`#181614` …) a ružové plochy sú preč; ružové podklady (`--brick-lt`) sú neutrálne šedé a červený akcent nesie linka alebo
písmo. Fotky, Máriove grafiky, logá značiek a mapa sa nemenia (sú to obrázky). **Výnimka:** podklad `.rozvoz` pod
priehľadným rohom grafiky Rozvoz má modrosivé odtiene podlahy obrázka (8 farieb, `site.css`); pri výmene obrázka treba
podklad prepočítať z jeho okraja a upraviť výnimku `PALETA_VYNIMKY` v `build.py`. Správa obsahu (`sprava/` rozhranie) má
svoje farby a kontrola ju nečíta.
- **Kontrola:** `build.py` (`kontrola_farieb`, za kontrolou textov) prejde verejné CSS, JS a HTML (stránky, `zdroj/`, kostry
  stránok správy `sprava/kostry`, manifest) a každú zapísanú farbu (`#rgb`, `#rrggbb`, `#rrggbbaa`, `%23…` v dátových SVG,
  `rgb()`/`rgba()`) porovná s paletou (`PALETA_CERVENE` + neutrálne + úplne priehľadné); vypíše „kontrola farieb: OK“ alebo
  `POZOR` so súborom a riadkom.
- **Tokeny** (`:root` = svetlá, `html[data-tema="farebna"]`, `html[data-tema="tmava"]`): farebná – stránka `--paper #f5f5f5`,
  karty `#fff`, malta a hlavičky podstránok `#ebebeb`, betón `#e0e0e0`, linky `#d4d4d4`, písmo `#1a1a1a` / `#383838` /
  vedľajšie `#595959`, päta `#1a1a1a` so spodným pásom `#0a0a0a` a malým červeným písmom `#e57679`; svetlá – stránka biela,
  malta `#f5f5f5`, betón `#ebebeb`, linky `#dbdbdb`, písmo `#141414` / `#5c5c5c`; tmavá – podklad `#111`, pásy `#1a1a1a`,
  karty `#1c1c1c` / `#262626`, linky `#2e2e2e`, písmo `#f5f5f5` / `#d6d6d6` / `#b3b3b3`. `--prgb` / `--irgb` (RGB podkladu
  a písma pre priesvitné lišty a jemné linky) sú neutrálne.
- **Farebná téma (predvolená)** je prevažne biela a svetlá (Lajko skôr chcel svetlejší web): biela lišta s červenou linkou
  dole, svetlé pásy a biele karty, čierna je len úvod (prvá obrazovka) a päta, červená len ako akcent (tlačidlá, linky, štítky, „Za super ceny.“). **Svetlá téma** má ešte viac bielej: výzva pred
  pätou je biely pás s červenou linkou hore, červeným a čiernym tlačidlom (nie červená plocha). **Tmavá téma** je čierna,
  biela a červená. Úvod je vo všetkých témach rovnaký (čierny pás s fotkou, časť Úvod).
- **Merania 17. 11. 2026** (`richtarik/staryuvod/zapis/`, `nastroje/snim.mjs` a `mer.py`, ako 16. 11.: tmavé = L < 35 %,
  svetlé = L > 80 %, červená = maska HSV; 390 × 844 a 1440 × 900, „obmedziť pohyb“; BAZA 2ea16df7 → teraz): **červená
  nie je vyššia** – farebná téma, úvod priemer na obrazovku cez celú výšku telefón 7,1 → 6,9 %, počítač 3,1 → 3,0 % (strop
  zo 16. 11.: 7,5 a 3,3 %), prvá obrazovka úvodu 12,7 → 9,3 % a 6,8 → 4,7 %; ostatné stránky bez zmeny (Katalóg 6,9 / 3,1 %,
  Kontakt 6,8 / 3,4 %). Svetlá téma po zrušení červenej výzvy: Služby 12,7 → 5,0 % (telefón) a 18,3 → 1,8 % (počítač),
  Katalóg 10,1 → 5,1 % a 17,3 → 2,1 %, svetlé plochy na podstránkach +4 až +15 bodov. Prvá obrazovka úvodu je čierny pás (tmavé 12 → 67 %
  na telefóne, 10 → 77 % na počítači) – zámer, ako na pôvodnom webe; zvyšok stránky je svetlý ako predtým. Béžových pixelov
  (R ≥ G ≥ B, R − B 4–40, jasné; `nastroje/podiel.py`) je na celých stránkach ≈ 2,9 % (predtým 48–67 % vo farebnej a svetlej téme), zvyšok sú fotky; svetlá téma má
  na celých stránkach 83–86 % svetlých plôch (predtým 75–78 %) a 1,2–2,2 % červenej (predtým 9,8–10,2 %). Pri zmene farieb meranie
  zopakovať.
- **Kontrast AA** všade (aj fokus, stavy pod myšou, zakázané): malé písmo ≥ 4,5 : 1, veľké a ovládače ≥ 3 : 1; na červenej
  loga je písmo vždy čisto biele (priesvitné by malo 4,0); fokus je obrys `--brick` 3 px (na tmavom a v úvode biely, v tmavej
  téme na škáre `#e57679`).

Web má tri varianty podkladu z jedných komponentov cez tokeny v `assets/site.css`. **Predvolená je farebná téma**
(Lajo 10. 11. 2026: majiteľ chce farebný podklad podľa svojho nového loga s názvom a zákazníckej karty): atribút
`data-tema="farebna"` je priamo v `<html>` každej stránky (`build.py` konštanta `TEMA`, `index.html`,
`asistent/ochrana-udajov.html`), takže web je farebný aj bez JavaScriptu a nič sa neprekresľuje. Svetlý papier (bez
atribútu) a tmavá „čierno-biela“ (`data-tema="tmava"`) ostávajú len na porovnanie.

**Scény a mechanizmus farebnej témy** (časť „Farebná téma“ na konci `site.css`): lokálne tokeny majú biela lišta hore
(znak RS, názov s čiernym obrysom, položky menu, telefón ako červené tlačidlo, 4 px červená linka dole), spodná lišta
telefónu (biela s červenou linkou hore), päta a ostrov hľadania. Podklad prechodu medzi stránkami (`::view-transition`) je
po pásoch vo farbe scén novej stránky (`--scena`; skript `zdroj/prechody.js` ich pri `pagereveal` zapíše ako
`background-image` do malého `<style id="vt-pozadie">`), aby päta ani pásy pri prelnutí nepreblikli inou farbou; pásy
zhasnú, len čo ich nová stránka zakryje (`@keyframes vt-podklad`, 330 ms). Výška lišty je token `--lista-v` (88 px, do
980 px 84 px). Tlač je vždy svetlá (`@media screen`). Asistent má pravidlá tém na konci `assets/asistent.css`,
`asistent/ochrana-udajov.html` vlastné tokeny (rovnaká paleta). Staršie zápisy tokenov (história): `richtarik/svetlejsie/zapis/ZAPIS.md`,
`richtarik/majitel/farebna/TOKENY.md`, `richtarik/majitel/tema/ZAPIS.md`; paleta 17. 11.: `richtarik/staryuvod/navrh-P/NAVRH.md`.

Prepínanie: skript `zdroj/tema-head.js` (build.py `TEMA_HEAD`, v `index.html` ho vkladá `python3 -I zdroj/tema_vloz.py .`,
v `asistent/ochrana-udajov.html` značky `<!--tema-->`) beží v `<head>` pred štýlom: `?tema=svetla` odoberie atribút
(svetlý papier), `?tema=tmava` nastaví tmavú, oboje si zapamätá (`localStorage` `tema`), `?tema=farebna` voľbu zruší, bez
parametra platí zapamätaná voľba; prepne aj `theme-color` (farebná `#ffffff` – biela lišta, svetlá `#ffffff`, tmavá `#111111`). Bez JS,
v ráme bez úložiska alebo so zakázaným úložiskom je web farebný (parameter v adrese funguje aj tam). Ten istý skript
nastaví na `<html>` triedu `js`; bez nej (bez JavaScriptu) sú tlačidlo menu a pole hľadania skryté, lebo by nič nerobili
(navigácia je v päte). Pri tlači sa netlačí spodná lišta, tlačidlo menu, prechádzka ani tlačidlá výziev. Skript prechodov
v `index.html` po zmene `zdroj/prechody.js` obnoví `python3 -I zdroj/prechody_vloz.py .`. Prepínač v rozhraní nie je.
Zápis tmavej témy: `richtarik/majitel/tema/ZAPIS.md` a `TOKENY.md`.

## Úvod
**Prvá obrazovka ako na pôvodnom webe (17. 11. 2026, Lajko: „zachovaj štýl písma a prvú úvodnú [obrazovku] … aj to, že
sa to menilo, ale urob to tak, nech sa to dá ľahko čítať, ale všetko nové tam nechaj“).** Úvod (`index.html`, sekcia
`.uv`) je vo všetkých témach rovnaký: tmavá fotka cez celú šírku a výšku prvej obrazovky (pod lištou, na telefóne aj nad
spodnou lištou) a veľký nápis vľavo dole priamo na nej.
- Text (zo starého webu a z BAZY, nič nové): riadok nad nadpisom „Stavebniny Richtárik, Nitra. Od roku 1997“ (`.uv-nad`,
  červená linka) a H1 „Stavebný materiál v celom sortimente. Za super ceny.“ – Barlow Condensed 800, verzálky, šírka 12ch,
  riadkovanie 0,9, vždy 6 riadkov (STAVEBNÝ / MATERIÁL / V CELOM / SORTIMENTE. / ZA SUPER / CENY.; dvojice „v celom“
  a „Za super“ sú nezlomiteľné `<span class="nz">`). „v celom sortimente.“ je tenší a svetlošedý (`.thin`, 600, `#d9d9d9`),
  „Za super ceny.“ červené loga (`em`, `#d93439`). Veľkosť: telefón 52 px (pri 320 px 49 px, pri 320 × 568 46 px), tablet
  a počítač ako pôvodne `clamp(52px, 9,2vw, 132px)`, najviac toľko, aby sa celý nadpis zmestil na prvú obrazovku
  (1440 × 900: 117 px, 1920 × 1080: 132 px). Každé slovo je `<span class="w" style="--i:n">` (postupný nábeh).
  Pod nadpisom (počítač v pravom stĺpci) ostáva všetko nové: hodiny a adresa zo správy (`<!--s:hodiny-uvod-info-->`, od
  701 px, dnešný deň podčiarknutý), veta zo správy (`<!--s:uvod-lede-->`), Zavolať 0905 622 223, Poslať dopyt, Prezrieť
  katalóg, Aktuálne akcie a vyhľadávanie (biely ostrov; na počítači sa výsledky otvárajú nad poľom, aby boli celé na prvej
  obrazovke). Na počítači je vpravo dole „Skroluj“ (`.uv-cue`, ozdoba, `aria-hidden`).
- Fotky (`.uv-bg`): štyri staré fotky z `img/hd` (Pexels, `img/FOTKY.md`) – palety tvárnic, stavba, murári, strecha –
  v `img/uvod/uvod-{palety,stavba,murar,strecha}-*.avif|webp`: počítač a tablet široký výrez `-1280|1920` (strecha `-1230`,
  užší výrez sa nezväčšuje), telefón (do 700 px) vlastný zvislý výrez `-t-480|750` (stavba `-t-710`). Len orez, zmenšenie
  a prevod formátu skriptom `zdroj/uvod_snimky.py`, nič nedokreslené ani tónované. **Výrezy nesmú zasiahnuť nákladné auto
  a modrý sud na fotke `hero` ani palmu na fotke `strecha-praca`** (zakázané oblasti v skripte; `build.py` ich pri každom
  behu overí). Fotka predajne č. 11 a štítok „Naša predajňa“ v prvej obrazovke nie sú (majiteľ 17. 11. 2026: „vymazať“);
  fotka 11 ostáva nižšie na stránke. Film ani auto v úvode nie sú.
- Načítanie: prvá fotka (`.uv-f0`, palety) je v HTML s `fetchpriority="high"` (LCP; telefón 96 KB AVIF, počítač 119 KB),
  ďalšie tri sú v `<template class="uv-dalsie">` a `site.js` (časť „úvod: striedanie fotiek“) ich vloží až po načítaní
  stránky a po uvítaní v nečinnom čase; striedanie sa zapne triedou `uv-stridaj`, keď sú dekódované. `sizes` počíta
  s výškou úvodu (široký výrez pokrýva celú výšku).
- Striedanie ako na pôvodnom webe: cyklus 24 s, každá fotka ≈ 6 s, prelnutie s jemným priblížením (krivka pôvodného
  `slide`), prvá fotka dosadne s Ken Burns (15 s). Mimo obrazovky a na skrytej karte sa zastaví (`uv-stoj`). Slová
  nadpisu nabehnú za sebou (posun zdola a prelnutie, 1,35 s, krok 105 ms), riadok nad nadpisom, ponuka, hodiny a Skroluj
  vyjdú po nich (trieda `uv-ide` zo skriptu v `<head>`; po uvítaní ich spúšťa skript brány).
- Čitateľnosť – miestny prechod (Lajko 17. 11.: „nech je to viac vidno“): fotka sa nestmavuje celá, tma je len pod
  textom. Nadpis má pod sebou rozmazané schody podľa dĺžky svojich 6 riadkov (`.uv h1::before`, SVG v desatinách em, takže
  sedí na každej šírke): biele riadky 46 %, tenší riadok 56 %, „Za super ceny.“ 90 % čiernej. Riadok nad nadpisom, hodiny,
  ponuka s tlačidlami a odkazmi a Skroluj majú mäkký čierny podklad 57 % (`.uv-nad::after`, `.uv-info::after`,
  `.uv-b::before` na počítači, `.uv-text::before` cez mriežku na telefóne a tablete, `.uv::after`). Celá plocha má len
  jemný prechod pod lištou a pri spodnom okraji (`.uv::before`, najviac 32–36 %); jemný tieň písma navyše. Veľkosť
  nadpisu ostáva (telefón `min(52px, 15.4vw)`, 6 riadkov). Meranie v čase (17. 11. 2026, 32 okamihov celého 24 s kruhu
  striedania vrátane prelínaní × 320/390/768/1440 × tri témy; každý pixel celého písmena vrátane diakritiky voči pixelu
  pozadia za ním, bez tieňa písma, ale s prechodmi a podkladmi; nástroje `richtarik/svetlyuvod/zapis/nastroje/meraj.cjs`
  + `vyhodnot.py kontrast`): biely H1 ≥ 3,55 : 1, tenší riadok ≥ 3,51, „Za super ceny.“ ≥ 3,54 (prah 3), riadok nad
  nadpisom ≥ 5,61, veta ≥ 5,20, hodiny ≥ 5,41, odkazy ≥ 6,62, Skroluj ≥ 8,97 (prah 4,5); tlačidlá majú plný podklad
  (Zavolať biela na `#d93439` 4,67 : 1, pod myšou `#b42226` 6,57 : 1). Fotku je vidno (`vyhodnot.py viditelnost`, farebná
  téma, priemer 8 okamihov): priemerný jas prvej obrazovky 92 z 255 na telefóne 390 a 91 na počítači 1440 (predtým 55 a
  50, pôvodný web 85 a 89); plocha stmavená menej než na 50 %: 46 % a 64 % (predtým 0 % a 7 %, pôvodný web 5 % a 59 %).
  Farby úvodu sú len čierna, biela, šedá `#d9d9d9` a červené z palety.
- **Pri výmene alebo doplnení fotky úvodu** (napr. Máriove fotky do `zdroj/uvod_snimky.py`) treba najprv zmerať, či
  hustoty tmy ešte stačia: hustoty sú stavané na najjasnejšie pixely terajších 4 fotiek a rezerva nadpisu je len asi
  0,5 nad prahom 3 : 1. Postup: `FOTO=1 node meraj.cjs <výstup> 32 novy:<port> 320x568,390x844,768x1024,1440x900
  farebna,svetla,tmava`, potom `python3 -I potreba.py <výstup>` (koľko čiernej treba pod každou skupinou textu; dnes biely
  nadpis 0,41, tenší riadok 0,52, červený 0,83, malý text 0,45–0,53) a `python3 -I vyhodnot.py kontrast <výstup>` (musí byť
  0 pod prahom). Ak treba viac, zvýšiť `fill-opacity` v SVG `.uv h1::before` alebo `--uv-tm` v `assets/site.css`.
- „Obmedziť pohyb“, šetrenie dát a bez JS: jedna fotka bez pohybu, bez nábehu a bez uvítania; text je hneď nepriehľadný
  (bez JS je skryté len pole hľadania, ktoré by nič nerobilo).
- Kód: CSS na konci `assets/site.css` (časť „Úvod v štýle pôvodného webu“), skript `assets/site.js` (striedanie),
  trieda `uv-ide` zo skriptu v `<head>` úvodu. Animuje sa len `transform` a `opacity`.
- Výmena fotky: upraviť výrez v `zdroj/uvod_snimky.py` (nová fotka musí byť skutočná, bez pridaného či ubraného obsahu;
  zakázané oblasti doplniť), spustiť `/usr/bin/python3 -I zdroj/uvod_snimky.py .`, cesty v `index.html` (`.uv-f0`
  a `template.uv-dalsie`) a znova zmerať kontrast v čase. Vypnutie striedania: zmazať `<template class="uv-dalsie">`
  (ostane prvá fotka).
- `build.py` úvod neprepíše: `write()` zápis do `index.html` odmietne. `kontrola_uvodu()` na konci behu overí menu
  a údaje firmy v úvode, jeden H1 „Stavebný materiál v celom sortimente. Za super ceny.“ po slovách `.w` s dvoma `.nz`
  a nad ním `.uv-nad` (bez znaku a názvu firmy v H1; názov je v titulku a v lište práve raz), fotky `.uv-f0` (v HTML,
  `fetchpriority="high"`) a `.uv-f1` až `.uv-f3` (v `template.uv-dalsie`), existenciu súborov `img/uvod`, výrezy (zakázané
  oblasti), že v prvej obrazovke nie je fotka 11, štítok, rám ani film, og obrázok na všetkých stránkach, žiadny odkaz
  na staré video s autom, že uvítanie v `index.html` sa zhoduje so zdrojom (nižšie) a že rad fotiek „Skutočné fotografie
  – V našej predajni v Nitre“ (`section.zasoba`, dlaždice `.zt`, čakanie `uv-pocka`) na úvode nie je a pod prvou
  obrazovkou ide hneď pás faktov (Lajko 17. 11. 2026: „tento rad fotiek daj preč“).

### Uvítanie „Brána“ pred úvodom
Pri prvej návšteve zákazníka privíta brána s pozdravom „Nitra – Horné Krškany · od roku 1997“ a „Vitajte. Poďte ďalej.“.
Krídla sú čierne ako úvod (vo všetkých témach, jemné svetlé latky, červená spára, „Poďte ďalej.“ na červenom páse) a
rozídu sa rovno nad úvodom (posuvná brána, bez otáčania; na telefóne hore a dole). Fotka v bráne ani štítky už nie sú,
nič navyše sa nestiahne. Hlavička (logo, menu, telefón) a spodná lišta Zavolať / Cenová ponuka sú celý čas nad bránou
a fungujú. Texty sú len z overených faktov.
- Scenár (tempo ×1,5): pozdrav drží 0,57 s od prvého vykreslenia; brána sa otvorí, keď je prvá fotka úvodu (`.uv-f0`)
  dekódovaná (najneskôr 1,35 s po prvom vykreslení, inak rýchla cesta); krídla sa rozídu za 0,75 s, fotka úvodu dosadne
  (1,06 → 1), riadok nad nadpisom a slová nadpisu vyjdú až vtedy, keď sú krídla celkom mimo nich (KZ-01: nikdy nie sú
  prerezané hranou krídla, čas sa vypočíta z rozmerov a krivky clony), potom ponuka. Namerané bez škrtenia: otvorenie
  0,58–0,60 s po prvom vykreslení, krídla mimo za 0,55 s, koniec ≈ 1,5 s od navigácie (telefón 4G CPU 4× ≈ 2,4 s).
- Rýchla cesta: na pomalej sieti (prvé vykreslenie po 1,5 s) alebo keď fotka nie je včas pripravená, brána len
  pozdraví a otvorí sa rovno na úvod (0,44 s), keď je fotka úvodu vykreslená, najneskôr 0,7 s po prvom vykreslení.
- Úvod sa otvára hore (Lajko 11. 11. 2026: „Nech sa stránka otvára na úvode“): pri otvorení zvonka (odkaz z WhatsAppu,
  e-mailu alebo vyhľadávača, napísaná adresa) aj pri obnovení stránky `zdroj/uvitanie-head.js` zahodí kotvu v adrese
  (napr. `#prehliadka` zo staršieho odkazu) ešte pred rozhodnutím o uvítaní a nastaví `history.scrollRestoration =
  'manual'`, takže stránka začne hore na úvode a uvítanie sa ukáže podľa pravidiel nižšie. Sekundu po načítaní a pred
  odchodom sa obnova polohy vráti na `auto`: Späť a Vpred (aj z podstránky) vracajú polohu ako doteraz a kotva
  v odkaze vnútri webu funguje. Kým sa stránka s kotvou načíta, vracia sa hore, len kým sa návštevník neposunie sám
  (koliesko, ťah prstom, klávesy posunu; KZ-05) – okrem polohy, kam ju posunul prehliadač kvôli kotve. Späť a Vpred
  bránu neukážu ani s `?uvitanie`. Vypnutie: `HORE = 0` v `zdroj/uvitanie-head.js` a vložiť bloky (`uvitanie_vloz.py`).
  Skúška: `majitel/uvod-hore/nastroje/k-uvod.mjs` (otvorenie zvonka s kotvou aj bez, `?uvitanie`, obnovenie, Späť
  z podstránky s bfcache aj bez, „obmedziť pohyb“, kotva z vnútra webu).
- Kotvy v stránke (odkaz „Prezrieť predajňu“ → `#prehliadka`): posun riadi `assets/site.js` (`naKotvu`), lebo sekcie
  s `content-visibility:auto` a obrázky načítavané pri posune menia rozloženie počas cesty a plynulý posun prehliadača
  zastal na telefóne obrazovku pred rámom prehliadky. Skript pred cestou vykreslí sekcie (trieda `cv-ciel`, `site.css`),
  v každej snímke znova zmeria polohu cieľa (aj `scroll-padding` a `scroll-margin`) a dôjde presne k nemu za ≈ 0,9 s;
  ťuk, koliesko alebo kláves cestu zastavia, pri „obmedziť pohyb“ skok bez animácie. Adresa dostane kotvu ako nový
  záznam histórie (Späť vráti polohu pred kliknutím, Vpred zase k prehliadke).
- Kedy sa neukáže: druhá návšteva v tej istej relácii (`sessionStorage` `br-videne`), príchod z inej stránky webu,
  Späť, Vpred a obnovenie, šetrenie dát, predvykreslenie, okno menšie ako 300 × 420 px, „obmedziť pohyb“ a bez JS
  (prekryv je v HTML ako prvý prvok `<body>`, bez triedy `br-ide` je skrytý a skript ho odstráni). Vtedy beží dnešný
  úvod (trieda `uv-ide`). `?uvitanie` v adrese ho vynúti aj pri ďalšej návšteve (nie pri „obmedziť pohyb“), napr. na
  ukážku majiteľovi.
- Preskočenie: ťuk, klik, koliesko, kláves (aj Tab), posun, zmena šírky okna alebo skrytie karty. Úvod je hneď
  v konečnom stave a brána sa prelne za 0,16 s; ťuk na zatvorenú bránu nič pod ňou nestlačí, ťuk na Zavolať v lište
  alebo na telefón v hlavičke sa normálne vykoná.
- Asistent na otázky, odložená práca `site.js` (odhalenia, pás značiek…) a striedanie fotiek úvodu čakajú na koniec
  uvítania (udalosť `br-koniec` `{preskocene, rychlo, t}`).
- Prístupnosť a SEO: prekryv má `aria-hidden`, vnútro je `inert` (žiadny fokus, mimo čítačky), samotný prekryv
  zachytí ťuk (inert vrstva by ťuk pustila na odkaz pod ňou). Prvý nadpis v strome je H1 úvodu, obsah úvodu je v HTML
  od začiatku. Pri tlači sa prekryv nezobrazí a úvod je v konečnom stave.
- Poistky: CSS skryje prekryv 4,8 s po zobrazení, aj keby skript zlyhal; skript ho odstráni najneskôr po 9 s.
- Kód: zdroje sú v `zdroj/uvitanie-head.js` (rozhodnutie v `<head>`), `zdroj/uvitanie.css`, `zdroj/uvitanie.html`
  (prekryv) a `zdroj/uvitanie.js` (riadenie, WAAPI). `build.py:uvitanie_bloky()` ich zmenší na 4 bloky v `index.html`
  (štýl a rozhodnutie v `<head>` pred skriptom `uv-ide`, prekryv ako prvý prvok `<body>`, aby bol pozdrav v prvom
  vykreslení, skript za hlavičkou a menu tesne pred `<main>`).
  Po zmene zdroja: `python3 -I zdroj/uvitanie_vloz.py .` (bloky v `index.html` nahradí) a `python3 build.py`
  („kontrola úvodu: OK … uvítanie zo zdroja 1×“; kontrola overí aj `aria-hidden`, `inert`, žiadny nadpis, odkaz,
  výkričník ani štítok označenia asistenta v prekryve, jeho skrytie bez `br-ide` a žiadne `rotate`, `perspective` ani
  `clip-path`).
- Vypnutie: v `zdroj/uvitanie-head.js` `VYP = 1` a vložiť bloky (`uvitanie_vloz.py`), alebo zmazať 4 bloky
  z `index.html` (`<style>` začínajúci `.br{`, skript s `br-ide` v `<head>`, `<div class="br" …>` za `<body>` a skript pred `<main>`)
  a z podmienky skriptu `uv-ide` časť `&&!h.classList.contains("br-ide")`, potom upraviť `kontrola_uvodu()`.
- Test: `richtarik/staryuvod/zapis/nastroje/uvitanie-zf.mjs kontroly` (27 kontrol: značky a časy otvárania, pozdrav,
  krídla, slová nadpisu neprerezané krídlom, počas uvítania len prvá fotka a striedanie až po ňom, čítačka, preskočenie
  do 0,25 s, ťuk nič nestlačí, relácia, kotva, obmedziť pohyb, šetrenie dát, bez JS, tlač, Späť, poistky, šírky 320 – 1920,
  odovzdanie do úvodu, iframe; adresy NOVY, PRED – ten istý web s `classList.add('br-ide')` nahradeným `void 0` – a HOST
  v hlavičke skriptu) a `… vykon` (A/B meranie). Starší `richtarik/dokoncenie/nastroje/uvitanie-zf.mjs` patrí k úvodu
  s fotkou 11 a strihom zásob.

## Pohyb a prechody
**Tempo ×1,5 (10. 11. 2026, majiteľ: pomalšie animácie).** Všetko, čo je predstavenie, má 1,5-násobok pôvodnej dĺžky aj
oneskorenia; odozva na dotyk a myš ostala. Časy uvedené ďalej v tejto časti a v časti Úvod sú pôvodné (×1,0), dnešné sú:

| premenná alebo prvok | pôvodne | dnes |
|---|---|---|
| `--dlzka-dnu` / `--dlzka-dnu-op` (nová stránka) | 360 / 160 ms | 540 / 240 ms |
| `--dlzka-von` / `--dlzka-von-op` (stará stránka) | 180 / 120 ms | 270 / 180 ms |
| `--vt-odstup`, `--vt-odstup-op` | 60 ms | 90 ms |
| `--dlzka-let` (zdieľaná fotka, nadpis, štítok) | 440 ms | 660 ms |
| `--dlzka-strih` / `--dlzka-strih-spat` | 500 / 420 ms | 750 / 630 ms |
| `--dlzka-menu` (opona menu pri prechode) | 360 ms | 540 ms |
| `--dlzka-vstup` (hlavička podstránky) | 620 ms | 930 ms |
| `--dlzka-odh` / `--dlzka-odh-op` (odhalenie pri posune) | 620 / 520 ms | 930 / 780 ms |
| `--dlzka-riadok`, `--dlzka-stredna`, `--krok-cas` | 800, 360, 70 ms | 1 200, 540, 105 ms |
| riadok nadpisu sekcie z drážky, H1 po prechode na telefóne | 560, 440 ms | 840, 660 ms |
| úvod: nábeh slov H1, Ken Burns prvej fotky, striedanie fotiek | 0,9 s (krok 70 ms), 10 s, – | 1,35 s (krok 105 ms), 15 s, 24 s (fotka 6 s) |
| uvítanie Brána (od prvého vykreslenia po koniec) | ≈ 1,6 s | ≈ 2,4 s (`zdroj/uvitanie.js`, `M = 1.5`) |
| **bez zmeny (odozva):** `--dlzka-tlak` 80 ms, `--dlzka-pusti` 160 ms, `--dlzka-hover` 240 ms, `--dlzka-kratka` 180 ms, lightbox, otvorenie menu 300 ms, výsledky hľadania, okno asistenta 360 ms, preskočenie uvítania, rýchla cesta uvítania 440 ms | | |

Prechod stránky tým trvá 0,75–0,8 s (namerané úvod → katalóg 770–795 ms, predtým 560–650 ms); ťuk, klik alebo kláves ho
stále ukončí hneď. Obsah na pohyb nečaká: konečný stav je HTML a CSS, „obmedziť pohyb“ a prehliadač bez JS ho vidia hneď.
Zmeniť tempo: hodnoty v `:root` (`site.css`, časť Pohybový systém, pôvodná hodnota je v komentári pri každej premennej),
časy úvodu v časti „pohyb úvodu“ na konci `site.css`, konštanta `M` v `zdroj/uvitanie.js` a časy v `zdroj/uvitanie.css`
(potom `python3 -I zdroj/uvitanie_vloz.py .` a build).

Jeden pohybový jazyk pre celý web. CSS je v časti „Pohybový systém celého webu“ na konci `assets/site.css` (premenné
dĺžok a kriviek `--dlzka-*`, `--krivka-*`), skript prechodov v `zdroj/prechody.js`. Úplný katalóg (prvok, spúšťač,
trvanie, krivka, rozpočet, správanie pri „obmedziť pohyb“) je v `richtarik/profi/zf/POHYB.md`. Zásady: animuje sa len
`transform`, `translate`, `scale` a `opacity`; nič sa nepripína a posun sa nezamyká; plochy pri prechodoch sú papier
alebo fotka, nikdy tmavá clona; text v okne je po odhalení plne viditeľný (aj v pokoji po posune); bez JS, pri „obmedziť pohyb“ a v prehliadači
bez podpory je všetko hneď v konečnom stave; bez otáčania a poskakovania.

**Uvítanie pred úvodom** (len `index.html`, prvá návšteva v relácii zvonka; podrobne v časti Úvod): pozdrav vyjde
z drážky, každé krídlo svoje slovo (`--krivka-vyjazd`, 0,26 s, spára medzi slovami až potom), krídla brány sa rozídu do strán (`--krivka-clona`, 0,5 s), kamera
vojde na 1,05 (`--krivka-kamera`), štítky vyjdú (`--krivka-vyjazd`, 0,26 s), fotka sa usadí do rámu úvodu (0,52 s,
13 kľúčových snímok ease in-out, len `transform`), prelnutie 90 ms do papiera úvodu, pečiatka „Náš dvor“
(`--krivka-pecat`, jediný prekmit), preskočenie `--dlzka-pusti`. Rozpočet: 0 dlhých snímok počas pohybu brány,
scenár sa vytvorí pozastavený vopred v nečinnom čase a v snímke otvorenia sa len spustí (do 2 ms pri CPU 4×).
Pri „obmedziť pohyb“, bez JS, pri tlači a šetrení dát neexistuje.

**Prechody medzi stránkami** (View Transitions medzi dokumentmi, `@view-transition{navigation:auto}`). Typ určí skript
v `<head>` pri odchode zo stránky (`pageswap`) a odovzdá ho novej stránke (`pagereveal`, `sessionStorage`):
- `dalej` – bežný odkaz a Vpred: postupné odídenie a príchod (priehľadnosť a posun sú oddelené). Stará stránka
  lineárne zmizne za 0–120 ms (posun 8 px hore za 180 ms), nová sa lineárne objaví za 60–220 ms (posun 24 px zdola
  60–420 ms). Texty oboch strán nikdy nie sú spolu nad 0,21 a ich súčet nikdy pod 0,37, lišta stojí: nie je dvojitá
  expozícia ani prázdny papier. Na telefóne potom H1 vyjde z drážky (200–640 ms) a odsek pod ním nasleduje.
- `spat` – Späť v histórii, drobčeky a odkaz Späť: rovnako, smer je opačný.
- `strih` – hlavné menu, menu na telefóne, päta, spodná lišta a tlačidlá úvodu: nová stránka za 0,5 s vyjde zdola ako
  list papiera cez starú, stará len mierne ustúpi (nestmavne, nezmenší sa).
- `strih-spat` – Späť zo stránky, na ktorú sa prišlo strihom (aj z menu): zrkadlo strihu, list za 0,42 s odíde nadol
  a predošlá stránka sa vráti zo svojho ústupu. Vpred strih zopakuje. Typ príchodu si skript pamätá pri každej položke
  histórie (`sessionStorage` `vt:<kľúč>`).
- **zdieľaná fotka** (`foto`): ťuk na dlaždicu katalógu, akcie alebo novinky. Fotka dlaždice za 0,44 s preletí
  a zväčší sa na fotku hlavičky stránky (okno mení veľkosť a orezáva). Pri Späť sa fotka hlavičky zmenší späť do dlaždice
  a dlaždica sa ukáže až na konci letu. Ak je v hlavičke iná fotka ako na dlaždici, počas letu sa prelínajú (typ
  `prelnutie`). Zdieľa sa len prvok, z ktorého je medzi hornou a spodnou lištou viditeľných aspoň 60 % (inak by
  vzlietol spod lišty); inak ide čistý `dalej` alebo `spat`. Od 701 px letí pri dlaždici katalógu aj názov a stane sa
  nadpisom H1 (`nadpis`, len rovnaký text v jednom riadku, letí pod fotkou); odsek pod H1 sa objaví až v posledných
  18 % letu, keď nadpis dosadá. Karta značky v kategórii (tlačidlo Podrobnosti) pošle svoju fotku do hlavičky značky
  (s prelnutím) a od 701 px štítok karty akcie („Špeciálne zľavy“, „Akciová cena“…) letí do štítku na stránke akcie
  (`stitok`, len posun a zmena veľkosti, bez prekmitu); pri Späť opačne. Na telefóne (do 700 px) názov ani štítok
  neletia: H1 vyjde z drážky a štítok akcie dopadne na mieste pečiatkou. Prechod z otvoreného menu na telefóne (typ
  `zmenu`) je jeden pohyb: panel odíde za 0,36 s doprava ako opona a pod ním už stojí nová stránka aj s lištou.
  Na počítači prejde podčiarknutie aktívnej položky menu k novej položke (`ciara`). Lišta a spodná lišta stoja.
  Ikona asistenta (`asi`) sa s obsahom nehýbe: na mieste zmizne za čas odchodu starej stránky a na novej sa ukáže až
  s lenivo načítaným modulom; pri Späť z vyrovnávacej pamäte len stojí. Stránka `asistent/ochrana-udajov.html` má
  vlastný štýl, ale tie isté typy prechodov a dĺžky (skript jej obnovuje `build.py`, funkcia `ochrana_prechody`).
- Prechod sa nespustí pri obnovení stránky a pri „obmedziť pohyb“. Ťuknutie alebo kláves počas prechodu ho hneď ukončí.
  Nenačítaná fotka sa nezdieľa (letela by ako prázdny rám), vtedy len odíde a príde so stránkou.
- Cieľ dlaždice sa začne pripravovať pri dotyku (Speculation Rules `prerender`, `eagerness: conservative`, len `.html`
  toho istého webu, nikdy PDF, `subory/`, `mailto:` ani `tel:`), aby bola fotka hlavičky pri prechode hotová.
- Bez podpory: Firefox (prechody medzi dokumentmi zatiaľ nemá) a staršie prehliadače majú okamžitú navigáciu bez čakania
  (záloha s 200 ms zatmievaním je zrušená). Chrome a Edge od 126 a Safari od 18.2 prechody majú; **Safari na iPhone
  treba po nasadení overiť na skutočnom zariadení** (WebKit sa tu testovať nedal).
- Skript je v každej stránke práve raz (`build.py:prechody_head()` ho zmenší zo `zdroj/prechody.js`, v `index.html`
  je vložený ručne a `kontrola_uvodu()` overí zhodu). Po zmene `zdroj/prechody.js` treba spustiť `build.py` a nový blok
  (výstup `prechody_head()`) vložiť do `<head>` úvodu namiesto starého.

**Vstup hlavičky podstránky** (len s JS, keď stránka prišla bez prechodu: priamy odkaz, obnovenie, prehliadač bez
prechodov): H1 vyjde zdola, nakreslí sa linka nadpisku, odsek ide za ním a fotka hlavičky sa otvorí ako okno kina
(pásy malty sa stiahnu k okrajom) a dosadne. Keď stránka prišla prechodom (trieda `vt` na `<html>` zo skriptu
v `<head>`), vstup sa nespustí a hýbe sa len prechod: vstup počas prechodu na počítači bez grafickej karty zdvojnásobil
dlhé snímky.

**Odhalenia pri posune.** Texty, karty a štítky sa odhalia spúšťaným odhalením s časom (`site.js`, IntersectionObserver):
nadpisok, nadpis, odsek a tlačidlo sekcie vyjdú 18 px zdola za sebou (70 ms, najviac 4 kroky), karty v mriežke podľa
stĺpca, štítok akcie dopadne ako pečiatka, číslo služby vyjde zľava; priehľadnosť dobehne za 520 ms, posun za 620 ms,
takže po zastavení posunu je všetko v okne plne viditeľné (aj spodný okraj okna sa odhalí po 180 ms pokoja). Hodnoty
sú od 9. 11. 2026 ×1,5 (930 / 780 ms, 105 ms) – to platí pri čítaní; tempo sa riadi rýchlosťou posunu (KZ-02, 11. 11.
2026, rýchlosť z polohy a času v poslucháči posunu): od 600 px/s pôvodné tempo bez spomalenia (trieda `.r`) a odhalenie
sa spustí už 25 % výšky okna pod ním, od 1500 px/s je obsah hneď na mieste (`.ih`), takže pri rýchlom posune nič
nedobieha. Čo je pri
načítaní v okne, sa nehýbe. Fotky sa otvoria ako okno kina (pásy papiera `scaleY`, nie `clip-path`) a dosadnú a fotka
pásu Doprava ide pomalšie než stránka – tie sú viazané na posun (CSS `animation-timeline: view()`, kompozítor; bez
podpory stoja). Odhalenia sú len pre obrazovku (`@media screen`), pri tlači je všetko viditeľné (`tlac-zf.mjs`).
Práca, ktorá nemusí byť v prvej snímke (odhalenia, popisy lightboxu, pás značiek, služby), sa spustí až po prechode
stránky alebo v nečinnom čase (`poPrechode` v `site.js`).

**Ovládacie prvky:** stlačenie tlačidiel (0,97) a dlaždíc (0,985) za 80 ms, odozva pod myšou len na zariadení s myšou
(šípka v páse názvu dlaždice, zdvih štítkov, podčiarknutie menu), krúžok fokusu 3 px, menu na telefóne s položkami
za sebou, výsledky hľadania sa vysunú (na telefóne sa pole pri fokuse posunie pod lištu, výsledky sú nad spodnou lištou
a ikona asistenta sa skryje), lightbox ukáže fotku až dekódovanú, prenesie ju z náhľadu (popisok po lete) a pri
zatvorení ju vráti; stránku pod ním nezamyká cez `overflow`. Bublina asistenta sa ukáže až po 1,5 s pokoja posunu. Pás značiek zastaví
myš, fokus aj tlačidlo „Zastaviť pohyb“; bez JS a pri „obmedziť pohyb“ je to statický zoznam, ktorý sa dá posúvať.

**Ako vypnúť:**
- prechody medzi stránkami: v `site.css` `@view-transition{navigation:auto}` → `navigation:none`,
- zdieľané prvky a strih (ľahká verzia pre všetkých): v `zdroj/prechody.js` nahradiť `lahke = ss.getItem(L) > 1` za `lahke = 1`, `build.py`
  a blok `prechody_head()` vložiť do `index.html`,
- odhalenia textov pri posune: v `site.js` zmazať `poPrechode(odhalenia)`; odhalenia fotiek: zmazať blok
  `@supports (animation-timeline:view())` v časti 4B Pohybového systému (obsah ostane viditeľný),
- vstup hlavičky podstránky: zmazať blok `@media` v časti 3 Pohybového systému,
- uvítanie pred úvodom: `VYP = 1` v `zdroj/uvitanie-head.js` a `python3 -I zdroj/uvitanie_vloz.py .` (časť Úvod),
- celý pohyb pre jedného návštevníka: nastavenie systému „obmedziť pohyb“.

**Telefón aj počítač** majú rovnaký jazyk (let fotky, nadpisu a štítku aj strih). Záloha: keď prechod na zariadení
seká (aspoň 2 snímky nad 50 ms po prvých 100 ms animácie) a stane sa to v relácii dvakrát, ďalšie prechody idú v ľahkej
verzii bez zdieľaných prvkov a bez strihu (`site.js` meria, `sessionStorage` `vt-lahke`, skript v `<head>` ho číta).

**Testy** sú v `richtarik/dokoncenie/nastroje/`: `prechody-zf.mjs` (prechody na 8 typoch stránok tam aj späť, typy,
mená, dlhé snímky, prázdna dlaždica pri Späť, režim bez podpory), `scenar.mjs` (presný storyboard prechodu: animácie
sa zastavia a nastavia na časy), `posun-zf.mjs` (posun 30 × 120 px, pripnuté prvky, CLS, kotvy), `staticke-zf.mjs`
(bez JS, „obmedziť pohyb“: skryté prvky a bežiace animácie), `koniec-zf.mjs` (odhalenia dobehnú aj na konci stránky),
`osi-zf.mjs` (každá animácia pri posune sa riadi posunom stránky, nie rámom s `overflow: hidden`), `lightbox-zf.mjs`
(storyboard lightboxu), `mikro-zf.mjs` (odozva ťuknutí, fokus, pás značiek), `tlac-zf.mjs` (tlač: nič priesvitné ani
posunuté), `bfcache-zf.mjs` (Späť a Vpred z vyrovnávacej pamäte prehliadača, v plnom Chromiu: `KANAL=chromium`)
a `harok-zf.py` (jas snímok a hárky), `uvitanie-zf.mjs` (uvítanie pred úvodom: kontroly a A/B meranie). Doladenie
pohybu (6. 11. 2026) pridalo v `richtarik/profi/doladenie/kolo1/oprava/nastroje/`: `pokoj.mjs` (priehľadnosť textov
v okne po zastavení posunu), `nahraj.mjs` (záznam a dlhé snímky všetkých scén, CLS, INP), `kontroly.mjs` („obmedziť
pohyb“, bez JS, prehliadač bez View Transitions), `uvod.mjs` a `pozdrav.mjs` (uvítanie a úvod), `bublina.mjs`
(bublina asistenta pri posune).

**Zdroje inšpirácie** (navštívené 5. 11. 2026; prevzaté sú len princípy, kód je vlastný, bez knižnice a CDN):

| zdroj | princíp | čím sa web líši |
|---|---|---|
| Chrome: Profiles MPA – https://view-transitions.chrome.dev/profiles/mpa/ | zdieľaný prvok medzi dvoma HTML, mená až v `pageswap`/`pagereveal` | dlaždica → hlavička aj názov → H1, pri Späť sa dlaždica prelne až na konci |
| Chrome: Off the beaten path MPA – https://view-transitions.chrome.dev/off-the-beaten-path/mpa/ | „upratať, hlavný ťah, detaily“, prerender | do 0,5 s, prerender len pri dotyku |
| Chrome: Stack Navigator MPA – https://view-transitions.chrome.dev/stack-navigator/mpa/ | typy prechodu podľa smeru | papier namiesto čierneho podkladu, stará stránka nestmavne |
| Chrome for Developers: Cross-document view transitions – https://developer.chrome.com/docs/web-platform/view-transitions/cross-document | `@view-transition`, udalosti, typy, reload | – |
| Shopify.dev: Cancel view transitions on interaction – https://shopify.dev/docs/storefronts/themes/best-practices/performance/cancel-view-transitions-on-interaction | `skipTransition` pri dotyku a klávese | – |
| CSS-Tricks: Cross-document view transitions gotchas – https://css-tricks.com/cross-document-view-transitions-part-1/ | `object-fit: cover` na snímkach | okno fotky orezáva |
| scroll-driven-animations.style: Image Reveal – https://scroll-driven-animations.style/demos/image-reveal/css/ | odhalenie fotky pri posune | pásy papiera `scaleY` namiesto `clip-path` |
| WebKit: Scroll-driven animations with just CSS – https://webkit.org/blog/17101/a-guide-to-scroll-driven-animations-with-just-css/ | časová os za skratkou `animation`, rozsahy | dráhy v px |
| Haven Constructions – https://www.havenconstructions.com.au/ | text vyjde z drážky | bez opony, po riadkoch |
| Hays Woodworking – https://www.hayswoodworking.com/ | odhalenie plochou, ktorá odíde | svetlé pásy nad viditeľnou fotkou |
| Codrops: Image Layer Animations with Clip-Path – https://tympanus.net/codrops/2023/10/31/image-layer-animations-with-clip-path | strih viacerých záberov | výtlačky cez `transform` |
| Codrops: Double Image Hover – https://tympanus.net/codrops/2023/03/01/double-image-hover-effects-with-clip-path-animations/ | odozva dlaždice pri myši | šípka a stlačenie, bez druhej fotky |
| Byggmax – https://www.byggmax.se/ | nástup podľa poradia | podľa stĺpca na časovej osi posunu |
| Petersen Tegl – https://www.petersen-tegl.dk/ | materiál ako hrdina, štítok palety | papierový štítok v páse zásob (pás 17. 11. 2026 z úvodu odstránený) |
| DEV: Accessible marquee – https://dev.to/olpeh/modern-and-accessible-marquee-clone-with-tailwindcss-5abb | pauza a statický pás pri obmedzení pohybu | tlačidlo Zastaviť pohyb, pauza pri fokuse |
| web.dev: High-performance CSS animations – https://web.dev/articles/animations-guide | len transform a opacity | – |
| A. Roselli: Don't split words into letters – https://adrianroselli.com/2026/02/you-know-what-just-dont-split-words-into-letters.html | text najviac po riadkoch | – |

## Prehliadka predajne

Majiteľ (9. 11. 2026) chce, aby si ľudia mohli predajňu prezrieť ako v Google Mapách, priamo na našej stránke. Lajo
(10. 11. 2026): urobiť to z fotiek, ktoré majiteľ poslal, a zachovať to, čo Google – že sa tam dá pohybovať. Fotky
majiteľa sú bežné ploché zábery, nie 360° panorámy; **nič sa nedomýšľa ani negeneruje**. Preto má komponent `.pp`
(sekcia „Prezrite si predajňu“ na úvode pred Kontaktom a na Kontakte, kotva `#prehliadka`) dve záložky:

1. **Prechádzka predajňou** – zastávky `PRECHADZKA` v `build.py` (dnes 9: tabuľa pri ceste → tvárnice pri ceste →
   Ytong a Porfix → palety dlažby → regál s profilmi → krytý sklad → predajňa: náradie → regály → pult). Každá zastávka
   je jedna fotka z `img/predajna/`. Poradie je odhad podľa fotiek, potvrdí ho majiteľ. Slovo 360° sa nikde nepoužíva,
   kým zastávka nie je skutočná panoráma.
2. **Pohľad z ulice (Google)** – rám Street View v našej stránke (ulica pred predajňou, dá sa v ňom otáčať a ísť po
   ceste). Vytvorí sa až po kliknutí na záložku alebo na šípku „Pohľad z ulice (Google)“; pred ním ide na Google
   0 požiadaviek a veta pod oknom to hovorí.

**Obe časti sú prepojené** (Lajo 10. 11. 2026: „nech to má taký istý princíp a fungovanie“): na prvej zastávke je na zemi
šípka s popisom „Pohľad z ulice (Google)“ (kľúč `ulica` zastávky v `PRECHADZKA`) – prepne na druhú záložku; v pohľade
z ulice je v páse pod rámom tlačidlo „Vojsť do predajne“ – otvorí prvú zastávku prechádzky (ak prechádzka beží na inej
zastávke, vráti sa na prvú). Čipy „Celá obrazovka“ a „Zavrieť“ sú v pohľade z ulice v tom istom páse pod rámom, aby
nezakrývali ovládanie, logo a podmienky Googlu. Bez záložky Googlu (`ULICA_GOOGLE = False`) sa šípka na ulicu nekreslí.

Pred kliknutím je v stránke len fotka prvej zastávky (náhľad), odznak „Prechádzka · 9 zastávok“, tlačidlo „Prejsť sa
predajňou“ a záložky. Modul `assets/prechadzka.js` (29,3 kB, gzip 9,8 kB; zdroj `zdroj/prechadzka.js`, build pred neho
vloží zoznam zastávok), fotky ďalších zastávok, náhľady 160 px (`img/prechadzka/`) ani rám Googlu sa pred kliknutím
nesťahujú. Prvá zastávka je tá istá fotka ako náhľad, takže sa otvorí hneď (telefón 390 × 844, 4G 9 Mb/s: 0,26 s,
so studenou pamäťou 0,56 s; pomalá 4G 1,6 Mb/s: 0,48 s a 1,27 s – `richtarik/majitel/prehliadka/ZAPIS.md`).

**V zastávke.** Fotka je väčšia než okno: ťahanie prstom alebo myšou ju posúva (zotrvačnosť, útlm 320 ms), pri posune sa
jemne nakláňa v perspektíve (najviac 2,5° a 1,5°, len keď fotka okno prekrýva s rezervou). Dva prsty, tlačidlá + a −,
klávesy + a −, dvojité ťuknutie alebo koliesko priblížia; koliesko v stránke posúva stránku (priblíži s Ctrl), na
celej obrazovke priblíži samo. Zvislý ťah prstom v stránke patrí stránke (`touch-action: pan-y`, nič sa nepripína); na
celej obrazovke a pri priblíženej fotke (trieda `pp-zoomnute`) posúva prst fotku všetkými smermi (`touch-action: none`)
– stránka sa vtedy posúva ťahom mimo fotky alebo po oddialení. Všetko je `transform` jednej vrstvy (kompozítor),
kreslí sa len počas pohybu.
**Mierka.** `PRECHADZKA_LIMIT = 1.6`: jeden bod zdroja nikdy nezaberie viac než 1,6 CSS bodu (rendered / intrinsic
v nástrojoch prehliadača, počíta sa proti skutočnému rozlíšeniu fotky v `zdroj`, dnes 1296 × 930 až 990 a 1132 × 1366).
Východisko: fotka prekrýva okno a do strán presahuje o 30 %, pokiaľ je vidno aspoň 42 % jej plochy; strop priblíženia
je 2,2-násobok najmenšej mierky, najviac limit (pri zapnutom náklone 1,553, lebo náklon zväčší bližší okraj fotky
najviac o 3 % – ani ten neprekročí 1,6). Keď je okno väčšie než 1,6-násobok fotky (veľký monitor), fotka ostane
menšia než okno na tmavom podklade. S originálmi od majiteľa stačí prepísať `zdroj` a limit sa posunie sám.
**Súbory.** Podľa zobrazenej šírky a hustoty displeja (najviac 2) sa vyberie 720, 960 alebo 1290 px (AVIF, WebP ako
záloha); zväčšený súbor 1720 px len vtedy, keď je fotka na obrazovke širšia než zdroj (veľké okno alebo priblíženie).
**Medzi zastávkami.** Šípky ukotvené na zemi (poloha v % fotky a smer v `sipky`): dopredu červený kotúč s bielym
okrajom a popisom „Ďalej“ (cieľ dotyku 76 px), späť tmavý s popisom „Späť“ (56 px). **Šípky sa držia v zábere**: ležia
na svojom mieste fotky (vrátane náklonu), a keď je to miesto po posune alebo priblížení mimo okna, ostanú pri
najbližšom okraji javiska (pod čipmi, vedľa tlačidiel + a −; dve šípky sa neprekryjú) – na ďalšiu zastávku sa dá prejsť
bez hľadania (`drzSipky` v `zdroj/prechadzka.js`; v zastávke typu panoráma sa šípka pri okraji okna drží rovnako,
len smer za chrbtom alebo ďaleko bokom zmizne ako v Street View a ostáva krok v päte). Ďalej klávesy ← → ↑ (so Shiftom šípky posúvajú pohľad, Home a End prvá a posledná),
tlačidlá kroku pri názve (krok ďalej je červený) a pás náhľadov. Prechod: nájazd do smeru šípky (mierka 1 → 1,32 so stredom v šípke) s prelnutím, 620 ms; krok späť prichádza
z priblíženia; pri „obmedziť pohyb“ len prelnutie 220 ms, bez zotrvačnosti a náklonu. Susedné zastávky sa sťahujú
vopred, ostatné sa uvoľňujú. Názov a poradie („Predajňa – náradie, 7 z 9“) číta čítačka pri zmene (`aria-live`).
**Okno.** Telefón 62 vh (najmenej 300 px; Lajo 10. 11. 2026: aspoň 60 % výšky obrazovky – na 390 × 844 je to 523 px),
od 701 px 16 : 9 (najviac 76 vh), pod ním päta s názvom a náhľadmi (miesto na dva riadky názvu, výška päty sa medzi
zastávkami nemení). Po otvorení prechádzky aj pohľadu z ulice sa stránka posunie tak, aby bolo okno v zábere medzi
lištou webu a spodnou lištou telefónu (`zarovnaj`): keď sa zmestí celé, ukáže sa celé; keď nie, obraz ostane celý pod
lištou webu a z päty je vidno, čo sa zmestí. Ikona asistenta sa schová, kým je otvorená prechádzka v okne (zakrývala
by krok ďalej). „Celá
obrazovka“ je `requestFullscreen` na celom komponente; kde nie je (iPhone), pevná pozícia cez celé okno (`.pp-pevne`,
sekcia s `content-visibility:auto` dostane `pp-pevne-rodic`, Esc ju ukončí). „Zavrieť“ vráti náhľad a fokus na tlačidlo.
**Prístupnosť.** Záložky `role="tablist"` (šípky presúvajú fokus, obsah sa prepne až Enterom – pohľad z ulice načíta
obsah od Googlu), scéna `role="application"` s názvom zastávky a opisom klávesov, šípky a náhľady sú tlačidlá s názvom
cieľa, ciele dotyku ≥ 44 px, kontrast vo všetkých troch témach nad AA (čipy a šípky na fotke rátané nad bielou aj
čiernou fotkou). **Bez JS** ostáva fotka prvej zastávky s popisom a pod ňou galéria ostatných zastávok s popismi
(`<noscript>`), tlačidlo a záložky sú `hidden`.

### Nastavenie v `build.py`

- `PRECHADZKA` – zoznam zastávok: `id`, `foto` (názov z `img/predajna`), `nazov`, `zdroj` (skutočné rozlíšenie fotky),
  `stred` (bod fotky v %, ktorý je pri príchode v strede okna), `sipky` – `(cieľ, x %, y %, smer°)`; smer 0 = dopredu,
  kladný doprava, 180 = späť. Šípka na skoršiu zastávku sa kreslí ako menšia šípka späť. Zastávka pri ceste má navyše
  `ulica=(x %, y %, smer°)` – miesto šípky „Pohľad z ulice (Google)“. Novej fotke treba vyrobiť
  náhľad: `richtarik/venv/bin/python richtarik/majitel/prehliadka/nastroje/nahlady.py <priečinok webu> <názov fotky>`.
- `ULICA_GOOGLE = True` – **jediný prepínač** záložky Googlu; `False` ju odstráni z oboch stránok (bez záložiek ostane
  len prechádzka). `ULICA_SURADNICE` – súradnice predajne pre bezkľúčové vloženie
  `https://www.google.com/maps?q=&layer=c&cbll=…&hl=sk&output=svembed` (`hl=sk`: rozhranie rámu po slovensky, KZ-09) (bez kľúča API, nič od Googlu nie je v repozitári).
- `PANORAMA['src']` – ak majiteľ dodá kód „Vložiť mapu“ svojej panorámy (adresa `https://www.google.com/maps/embed?pb=…`
  z `<iframe>`), vloží sa sem a má prednosť pred súradnicami. Postup: záznam firmy v Google Mapách → Fotky → 360° →
  otvoriť panorámu → Zdieľať → Vložiť mapu → skopírovať `src`.
- Po zmene: `python3 build.py` a blok vložiť aj do `index.html` (úvod sa udržiava ručne; `kontrola_uvodu()` hlási, kým
  sa nezhoduje s `prehliadka_blok('')`; blok vypíše `python3 -c "import build; print(build.prehliadka_blok(''))"`).

Rám Googlu: `referrerpolicy="no-referrer-when-downgrade"`, `allowfullscreen`, titulok; ukáže sa po udalosti `load`. Ak
`load` do 8 s nepríde, rám sa odstráni, pod oknom ostane „Pohľad z ulice sa nepodarilo načítať. Ostáva prechádzka
predajňou.“ a vráti sa prvá záložka. Z cudzieho rámu sa nedá zistiť, čo v ňom Google ukázal (napr. overenie robota);
v našom prostredí sa 10. 11. 2026 panoráma načítala a dalo sa v nej otáčať aj ísť po ceste. Po kliknutí rám od Googlu
vypíše do konzoly hlásenie o zakázanom akcelerometri (rovnaké ako pri oficiálnom kóde „Vložiť mapu“); senzory mu
zámerne nedávame.

### Ako prechádzku povýšiť na skutočné 360° (návod pre Laja)

Prehliadač panorám `zdroj/panorama.js` (build ho zmenší do `assets/panorama.js`, stiahne sa až na zastávke typu
panoráma) je pripravený: WebGL, jeden trojuholník, **guľa** pri pomere 2 : 1 (360° × 180°), **valec** pri čiastočnej
panoráme z telefónu (pohľad sa zastaví na okraji obrazu), šípky sa ukotvia na smer a fungujú rovnako.

1. **Koľko a kde:** 5–8 stanovíšť v poradí cesty zákazníka (brána, stred cesty medzi paletami, pred krytým skladom,
   v sklade, vchod do predajne, stred predajne, pri pulte). Stáť v strede uličky alebo cesty, nie pri regáli.
2. **Ako fotiť:** 360° kamera na statíve (najlepšie; výstup JPEG 2 : 1) alebo iPhone v režime **Pano**: telefón na
   výšku, otáčať sa na mieste okolo telefónu (nie okolo seba), pomaly, celý kruh alebo aspoň polkruh. **Rovnaká výška**
   na všetkých stanovištiach (hrudník, asi 1,4–1,5 m), vodorovne, za rovnakého svetla (jeden deň, bez protisvetla),
   bez ľudí a značiek áut v zábere. Z každého stanovišťa nech je vidno nasledujúce.
3. **Súbory:** JPEG do `img/panorama/` (napr. `01-brana.jpg`), šírka 4096–8192 px, do 1,5 MB. Guľa musí mať pomer
   presne 2 : 1; Pano z telefónu ostane, ako je (pomer napr. 4 : 1).
4. **Zápis zastávky** v `PRECHADZKA` namiesto `foto` a `zdroj`:
   `dict(id='brana', panorama='img/panorama/01-brana.jpg', uhol=360, nahlad='09-tabula-ulica', alt='Brána predajne',
   nazov='Brána', stred=(0, 0), sipky=[('cesta', 15, -20, 0)])`. `uhol` je vodorovný rozsah záberu v stupňoch (360
   pri guli; pri Pano odhad, napr. 180 alebo 240 – podľa toho, o koľko sa fotograf otočil), `nahlad` je fotka
   z `img/predajna` pre pás náhľadov a galériu bez JS, `stred` je smer pohľadu pri príchode `(yaw, pitch)` v stupňoch
   (0 = stred obrazu, kladný yaw doprava, kladný pitch hore) a šípky `(cieľ, yaw, pitch, smer)` – pitch okolo −20 je zem
   pár metrov pred fotografom.
5. Build, vložiť blok do `index.html`, prejsť všetky zastávky na telefóne. Až potom smie pribudnúť slovo 360° v názve.

Skúšobný obrazec panorámy v repozitári ani na webe nie je (odstránený 10. 11. 2026); skúška panorám beží v kópii webu
(`richtarik/majitel/prehliadka/nastroje/test-pano.mjs`). Skúšky komponentu: `test-pp.mjs` (141 kontrol: sieť pred
kliknutím, dotyk, myš, klávesnica, čítačka, celá obrazovka, zatvorenie, obmedziť pohyb, bez JS, zlyhanie Googlu),
`sv-test.mjs` (skutočný rám Googlu), `kontrast.mjs`, `meraj.mjs` (4G a plynulosť pri CPU 4×).

## Texty a SEO
Platí pre všetky texty webu (úvod, podstránky, alt texty, titulky, popisy, tlačidlá):
- **Len fakty** z pôvodného webu (`zdroj/pages.json`), z cenníka akcií `pdf/662.pdf` (28. 1. 2026) a z Máriových grafík
  zo 16. 11. 2026 (`img/FOTKY.md`), z nich len potvrdené tvrdenia (dnes len Iveco 8 t; ostatné sú otvorené otázky nižšie). Text sa smie
  preformulovať a skrátiť, nesmie pribudnúť nové tvrdenie (počty paliet, m², roky skúseností, recenzie, záruky,
  „najlacnejší“). Tvrdenia výrobcov (napr. „najväčší výrobca cementu“) len s pripísaním výrobcovi, nikdy v popise
  stránky. „Zadarmo“ len pri cenovej ponuke, poradenstve a výpočte spotreby, pri doprave len s podmienkou zo zdroja.
- **Oslovenie:** web vyká malými písmenami („vy, vám, váš“), firma hovorí „my“, tlačidlá sú v neurčitku
  („Zavolať 0905 622 223“, „Prezrieť katalóg“). Bez výkričníkov, verzálok vo vete a prázdnych fráz; čísla namiesto
  prídavných mien; „Akciová cena“ namiesto „super ceny“. Mechanická ruka v jednotnom čísle. 8 t auto je **Iveco** (od
  16. 11. 2026: Máriove grafiky IMG_0312 „Rozvoz stavebného materiálu … Iveco 8t s mechanickou rukou“ a leták IMG_0310;
  pôvodný web mal raz LIAZ, raz Iveco): úvod, Služby (text služby aj veta pri autách) a Doprava píšu „Iveco 8 t“, LIAZ nikde.
  Dnešné biele Iveco je na Máriovej fotke `predajna:10-auta-firmy` (hlavička Služieb a Dopravy). Staršie fotky áut z pôvodnej
  stránky Služby (`img/p/883–885`, modrý LIAZ) sú od 17. 11. 2026 preč (majiteľ: „vymazať fotky áut, staré fotky“), vo Vlastnej
  doprave je auto z grafiky Rozvoz bez nápisu.
  Asistent značku nemenuje (stráž v `asistent/nastroje/otazky.mjs`), Časté otázky ostávajú „nákladné auto 8 t“, aby sa
  zhodovali s databázou asistenta. Avia je **3,5 t** (rozhodol Lajko 16. 11. 2026; Máriove grafiky píšu „Avia 3t“, preto je obrázok auta na Doprave len vo výreze bez nápisu a oprava na obrázkoch je v zozname Pre Mária nižšie).
- **Typografia** (`texty._typografia`, beží automaticky na každej stránke): m², m³, €, „5 %“, pomlčka s medzerami,
  nezlomiteľná medzera medzi číslom a jednotkou, v dátume a za ø, verzálky zdroja na bežné písmo (výnimky `SKRATKY`
  a `MENA`), preklepy zdroja (`PREKLEPY`). Obchodný názov „Ing. Mário Richtárik - Stavebniny“ sa nemení.
- **Nadpis H1:** 2 – 7 slov, najviac 45 znakov, na stránke jeden a na webe jedinečný. Kategória = názov kategórie,
  značka = „Značka – čo to je“, akcia = „… v akcii“ (iný ako H1 v katalógu), novinka = výrobok a použitie.
- **Titulok** najviac 60 znakov vo vzore „… | Stavebniny Richtárik Nitra“ (pred príponou najviac 31 znakov; dlhší build
  odmietne chybou, nereže ho – `texty.titulok()`), **popis** 120 – 155 znakov z celých viet,
  bez „…“ na konci. Každá stránka má ručný záznam v `texty.STRANKY` (`h1`, `t`, `d`); og:title a og:description sú
  rovnaké. `build.py` na konci behu skontroluje dĺžky, jedinečnosť a chýbajúci ručný popis (`kontrola textov: OK`,
  inak `POZOR` so zoznamom). Nová stránka = nový záznam v `STRANKY`.
- **Karty „Podrobnejšie“** v katalógu majú názov podľa H1 cieľovej stránky a prvú vetu jej popisu (nie reklamné vety
  výrobcu zo zdroja).
- **Alt texty:** opisujú, čo je na fotke (5 – 15 slov), logá majú názov značky, ilustračné fotky kategórií (`img/hd`,
  Pexels) majú prázdny alt a netvrdí sa o nich, že sú z dvora.
- **Ceny akcií** (`CENNIK_AKCIE` v `build.py`): prepis tabuliek z `pdf/662.pdf` so stranou PDF v nadpise tabuľky,
  hlavička „Cenník akcií z 28. 1. 2026 (PDF)“ a veta „Platnosť ceny potvrdí predajňa.“. Pri novom cenníku: nové PDF
  do `pdf/`, zmeniť `CENNIK_PDF`, `CENNIK_TEXT`, `CENNIK_LETAK`, `PDF_DATUM`, tabuľky v `CENNIK_AKCIE`, popisy akcií
  v `texty.STRANKY` a dátum v `index.html`; každé číslo s € overiť v `pdftotext -layout pdf/<číslo>.pdf`. Staré akcie
  bez dátumu (pôvodná stránka Akcie) ostávajú, kým majiteľ nerozhodne; nedostávajú nový dátum.
- **Odkazy:** akcia ↔ katalóg (`AKCIA_KATALOG`, na akcii „Tento tovar v katalógu“, na katalógu „Táto značka je
  v akcii“ / „V akcii z tejto kategórie“), novinky z kategórií (`NOVINKY_KATEGORIE`). Text odkazu hovorí, kam vedie.
- **Časté otázky:** odpovede sa berú doslova z databázy otázok predajne (`asistent/znalosti/richtarik-otazky.json`,
  ak je v strome; inak kópia `CASTE_KOPIA` v `build.py` s tými istými textami), zoznam `CASTE_ID`. Pri zmene odpovede
  zmeniť databázu aj kópiu, aby web a databáza hovorili to isté.
- **Štruktúrované dáta:** `HardwareStore` s `@id` `…/#predajna` na úvode (ručne, vložiť výstup `firma_ld()`,
  `kontrola_uvodu()` overí zhodu) a na Kontakte, `BreadcrumbList` na každej podstránke, `FAQPage` len na Častých
  otázkach. Bez `geo` (presná poloha nie je v zdroji), `sameAs` (profily nie sú v zdroji) a `Offer` (cenník nemá
  platnosť do).
- **Sitemap** má `lastmod` z dátumu posledného commitu stránky (zmenená necommitnutá stránka = dnešný dátum),
  `robots.txt` vylučuje `/asistent/`. Vyhľadávanie na webe (`assets/index.json`) sa pregeneruje pri každom behu.
- **Rýchlosť podstránok:** fotka hlavičky má na telefóne (do 480 px) vlastný výrez 720 × 468 (`img/uvod/hlavicka/`,
  `img/hd/hlavicka/`, vyrobí `bash zdroj/hlavicky.sh`; Máriove fotky `img/predajna/hlavicka/` z `-1290` v polohe
  `PREDAJNA_POS`, AVIF crf 32 – zdroj je snímka obrazovky; od 13. 11. 2026, bez nich si telefón s DPR 3 bral `-1290`,
  napr. 99 kB namiesto 41 kB; karta značky s Máriovou fotkou berie ten istý výrez); meno súboru bez „-720“ je rovnaké ako pri dlaždici, takže
  prechod medzi stránkami ju berie ako tú istú fotku. Po výmene fotky dvora alebo ilustračnej fotky treba skript
  spustiť znova. Prednačítané sú len 2 písma nadpisov (800); úvod `index.html` má navyše `BarlowCondensed-600-latin`
  (lišta a tlačidlá – bez neho sa pri prvej návšteve s uvítaním na počítači posunulo menu o 10 px, CLS 0,005 → 0,0005;
  podstránky ho nemajú, posun tam nie je a LCP by stúpol o ≈ 0,1 s). Fotky hlavičiek s jemnou štruktúrou (dlažba, fasáda)
  majú v `zdroj/hlavicky.sh` vlastnú kvalitu (`KVALITA`, AVIF 4 : 4 : 4) a na počítači verziu `img/hd/<názov>-600.webp`
  (dlažba na telefóne 139 → 93 kB, na počítači 482 → 85 kB). Náhľady letákov v kartách akcií (`nahlad` v `data/akcie.json`)
  sú zmenšeniny `img/p/<číslo>-400.webp` (karta ich ukazuje v šírke 150 px; spolu 1 MB → 0,3 MB), leták na stránke akcie
  je lenivý. Máriove grafiky (`img/ilu/`, `img/grafika/`) vyrobí `bash nastroje/grafika_maria.sh`
  zo `zdroj/grafika-maria/`; nová grafika = nový výrez do zdroja, riadok v skripte a nové meno súboru (cache na rok;
  pri výmene 1 : 1 pod starým menom ju návštevník, ktorý tu už bol, uvidí až po vypršaní cache). Dlaždice skupín: 15 ilustrácií
  spolu 105 kB (AVIF 480 px) namiesto 1,1 – 1,3 MB fotiek. Fotky kategórií od majiteľa (17. 11. 2026, `img/kat`) vyrobí
  `bash nastroje/foto_maria.sh` zo `zdroj/foto-maria/` (aj logá `img/logo/`).
- **Otvorené otázky majiteľa** (predvolené znenie sa nemení): staré akcie bez dátumu, veta cenníka „Ceny v cenníku akcií
  platia pri platbe v hotovosti, z ceny je už odrátaná 5 % zľava“ – platí ešte pri zľave z cien 5 % (17. 11. 2026 ponechaná), Nero Ebono
  alebo Ebano, hosting a HTTPS (časť HTTPS a presmerovania). Z Máriových grafík zo 16. 11. 2026 (texty webu sa podľa nich
  nemenia, kým ich nepotvrdí): „Týždenné zľavy na určený druh tovaru“ a „Objektové a množstevné zľavy“ (IMG_0310), „Kvalitná
  montáž“ čoho (IMG_0310), fax na pevnej linke (IMG_0312, IMG_0310), značky Kremix, Heluz, Ruukki, Budmat, Vital a „Doprava
  zdarma“ bez podmienky (banner IMG_0314). Vyriešené: 8 t auto je Iveco (IMG_0312, IMG_0310; 16. 11. 2026); Avia je 3,5 t
  (Lajko 16. 11. 2026); znenie zákazníckej karty – zľava z cien 5 % v hotovosti, 3,3 % pri platbe platobnou kartou, stavebné
  firmy a živnostníci špeciálne zľavy (Mário, e-mail 17. 11. 2026); firmu založil Zoltán Richtárik v roku 1997 (Mário,
  e-mail 17. 11. 2026; text O nás na webe aj v úvode, správa ho mení v Textoch – obchodný názov prevádzkovateľa „Ing. Mário
  Richtárik - Stavebniny“ ostáva); obrys názvu, štítok „Skutočná fotka…“, album „Materiál v areáli predajne“, staré fotky
  áut, 3D piktogramy, 3D karta a tabule (Mário, e-mail 17. 11. 2026). Nové (17. 11. 2026): kde presne majú byť 3D názvy
  „RICHTÁRIK STAVEBNINY“ a 3D karta (obrázky s pokynmi z e-mailu nemáme), opravené akciové letáky, ilustrácia „Dlažby +
  obklady“ v štýle série; fotka predajne na úvode pod zmazaným štítkom ostáva (Lajko rozhodne).
- **Pre Mária** (čo od neho potrebujeme k obrázkom; dovtedy sú na webe tak, ako ich poslal). Dokument na poslanie
  Máriovi s náhľadmi vyznačených chýb a otázkami: `richtarik/mario4/final/pre-maria.pdf` (17. 11. 2026 po jeho zozname zmien, zdroj vedľa neho; predošlý `richtarik/dokoncenie/final/pre-maria.pdf`).
  1. Obrázok auta „Rozvoz stavebného materiálu“: nápis „AVIA 3t“ opraviť na „AVIA 3,5 t“ (rovnako v letáku „Prečo
     nakupovať u nás“). Dovtedy je na Doprave len auto bez nápisu; s opravenou verziou ukážeme celý obrázok.
  2. Ilustráciu **Dlažby** v štýle série: na Máriovom letáku so sortimentom už je ikona „BETÓNOVÉ DLAŽBY“ v štýle série
     (sivý podstavec, dlažba) – prosíme ten súbor v plnom rozlíšení, nie nový obrázok.
  3. Opravené verzie oboch letákov a oboch bannerov. Leták „Prečo nakupovať u nás“: „Peradenstvo“ → Poradenstvo, na mape
     „Horné Kiškany“ → Horné Krškany, „Avia 3t“ → Avia 3,5 t, „po - pia“ → Po – Pi. Leták so sortimentom: „PODHLADY“ →
     PODHĽADY, „MUROVACÍ MATERIÁL“ je dvakrát (druhý pri dverách), na fotke „Naša značka“ je „Stevabalny“. Veľký banner:
     „PVC, pedhlady“, „Hutvý materiál“, „Kominový systém“, „Dlažby, platy obklady“, „BRUSENÁ TEHLA“, „STAVEBNÁ CHEMIA“ →
     CHÉMIA, „THELY-LEPIDLÁ-PENY“, „NÁRADIE-PENETRÁRY“, „Chemofak“ (Chemolak), skomolené logá značiek, „Strešné rezivo“
     nad značkami krytín, „KOMPLETNÝ ZATEPĽOVACÍ SYSTÉM“ nad komínom a „KOMPLETNÝ SADROKARTÓNOVÝ SYSTÉM“ nad strechou.
     Široký banner: „KOMPLETNÝ … … SYSTÉM“ (chýba slovo), „Doprava sderma“, v zozname reziva „Mranoly“ → Hranoly,
     nečitateľné bočné stĺpce značiek.
  4. Originály všetkých 38 obrázkov v plnom rozlíšení (JPG, PNG alebo PDF, nie snímky z telefónu): dnešné snímky nesú len
     ≈ 530 – 1 320 px, letáky a bannery sú po zväčšení zle čitateľné.
  5. Ikony bez pevných údajov (hodiny, telefón, e-mail, zľava), ideálne s priehľadným pozadím – alebo počítať s tým, že po
     zmene údajov v správe sa obrázok sám skryje a treba poslať nový.
  6. Logo vo vektore (SVG alebo PDF) – stále chýba.
  7. Odpovede (web ich dovtedy netvrdí, časť Otvorené otázky vyššie): čo patrí do skupiny **Podhľady a PVC** (ilustrácia
     ukazuje podhľad, fotka a texty stránky výrobky z recyklovaného plastu); „Doprava zdarma“ – pri akom tovare a za akej
     podmienky; predávate značky Kremix, Heluz, Ruukki, Budmat, Vital; platia „Týždenné zľavy na určený druh tovaru“
     a „Objektové a množstevné zľavy“; „Kvalitná montáž“ – čoho; je 037 651 17 77 aj fax; ~~zľava 5 % / 3,3 % – len so
     zákazníckou kartou a z akciových cien~~ (zodpovedané 17. 11. 2026: zľava z cien, 3,3 % pri platbe platobnou kartou);
     platí pri zľave z cien ešte veta „Ceny v cenníku akcií platia pri platbe v hotovosti, z ceny je už odrátaná 5 % zľava“;
     O nás – veta „…, aby rozšíril služby, ktoré dovtedy v stavebníctve ponúkal“ ostala z pôvodného webu, sedí aj na
     zakladateľa Zoltána Richtárika?; na karte „949 05 Nitra 5“ – ponechať, alebo „949 05 Nitra“.
  8. K zmenám zo 17. 11. 2026 (katalóg): originály poslaných fotiek a log (dnes snímky z Mailu, ≈ 1 000 – 1 300 px) a súhlas
     výrobcov so zverejnením ich fotiek (`img/FOTKY.md`); fotka tehál na Murovacom materiáli je z palety Wienerberger
     Porotherm, ktorý medzi značkami kategórie nie je – predávate ho (doplniť značku), alebo poslať inú fotku?; Easytherm
     a logo RG plast deva – je RG plast deva výrobca/dodávateľ Easythermu (opis karty sa nemenil)?; pergola na Podhľadoch a PVC
     – čo z nej predávate (web o nej nič netvrdí)?; podstránka Tondach má z pôvodného webu odkaz na PDF „Tondach Prehľad
     produktov 2009“ na starej doméne tondach.sk, ktorá 17. 11. 2026 neodpovedala – zmazať, alebo nahradiť iným
     prospektom? (odkaz Web výrobcu na karte už vedie na www.wienerberger.sk); www.stendpro.sk sa odtiaľto nedal otvoriť –
     overiť adresu.
  9. K zmenám zo 17. 11. 2026 (druhá časť): opravené akciové letáky a bannery (pošlite opravené súbory – dovtedy sú na webe
     tie s preklepmi, bod 3); ilustrácia „Dlažby + obklady“ v štýle série (bod 2); obrázok s pokynmi, kam dať 3D názvy
     „RICHTÁRIK STAVEBNINY“, a obrázok s miestom 3D zákazníckej karty (prílohy e-mailu k nám neprišli – dnes je 3D karta na
     úvode a na Službách namiesto plochej); Parabit – stačí bez odkazu na web výrobcu, alebo celú značku z katalógu dať preč?

## Údržba
- Prostredie: `python3 -m venv venv && venv/bin/pip install lxml`, potom v tomto priečinku `venv/bin/python build.py`.
  Beh vypíše `stránok v sitemap.xml: 76`, `znalosti asistenta z dát: bez zmeny`, `kontrola oblastí správy: OK`,
  `zhoda Python = PHP: … rozdielov 0`, `kontrola úvodu: OK`, `kontrola textov: OK`, `kontrola farieb: OK` a `vygenerovaných stránok HTML: 76`
  (riadok `vynechané odkazy …` sa vypíše len vtedy, keď zdroj odkazuje na súbor, ktorý už neexistuje). Riadok `POZOR` znamená, že
  `kontrola_uvodu()` v ručnom `index.html` nenašla položku menu alebo údaj firmy z `build.py` (`NAV`, `FIRMA`), alebo
  že `kontrola_textov()` našla titulok, popis či H1 mimo pravidiel (časť Texty a SEO) – treba to opraviť. Po behu
  `git diff --stat`: `index.html` sa smie zmeniť len v označených oblastiach (údaje z `data/`).
- Texty: akcie, ceny akcií, cenník akcií, firma, otváracie hodiny a časté otázky sú v `data/*.json` (spravuje ich
  správa webu, časť Správa webu – pred úpravou v repozitári najprv import zmien z hostingu); hlavičky kategórií
  (`HOOKY`), sortiment zo zdroja (`PONUKA_UVOD`), novinky (`NOVINKY_POPIS`), Služby (`SLUZBY`), O nás (`ONAS_TEXT`),
  Doprava (`build_doprava()`) sú v `build.py`; opravy celých viet (`OPRAVY`), nadpisy, titulky, popisy, názvy značiek,
  alt texty a typografia v `texty.py` (časť Texty a SEO). Nový cenník akcií nahrá majiteľ v správe (Cenník a letáky).
- Prehliadka predajne: zastávky prechádzky v `PRECHADZKA`, záložka Googlu prepínačom `ULICA_GOOGLE`, kód „Vložiť mapu“
  do `PANORAMA['src']`, skutočné panorámy do `img/panorama/` (časť Prehliadka predajne); po zmene vložiť nový blok
  `prehliadka_blok('')` ručne aj do `index.html` a spustiť `asistent/nastroje/otazky_zdroj.py`, ak sa zmenil počet zastávok
  (asistent ho uvádza).
- Úvod (`index.html`) sa mení ručne (texty, odkazy, karty akcií a noviniek, päta). Po zmene `index.html`, `site.css`
  alebo `site.js`: `node --check assets/site.js` a prejsť úvod na telefóne aj počítači (uvítanie, nábeh slov, striedanie fotiek, hľadanie, posun).
- Fotky prvej obrazovky `img/uvod/uvod-*` vyrába `zdroj/uvod_snimky.py` zo starých fotiek `img/hd` (časť Úvod; výrezy
  so zakázanými oblasťami, nič nezväčšovať). Ostatné fotky `img/uvod/` sú hotové webové veľkosti fotiek majiteľa (originály má majiteľ). Novú fotku treba vyrobiť
  v tých istých šírkach a formátoch (AVIF aj WebP, ImageMagick, nikdy nezväčšovať): `dvor-p` 1290, 1720 a `dvor-t`
  (výrez na výšku) 1086, 1448; `dvor-predajna` 800, 1200; `pas-dvor` 1280, 1920; `pas-dvor-t` (výrez na výšku) 780,
  1086, 1290; `zasoba-porfix`, `-rezivo`, `-stadreko` 480, 720, 900; `zasoba-tehly` 480, 720, 856 (rad týchto fotiek
  na úvode od 17. 11. 2026 nie je; `zasoba-tehly`, `-stadreko`, `-rezivo` sú v hlavičkách akcií a Pezinských tehelní,
  `zasoba-porfix` nič nepoužíva – ostáva ako náhrada hlavičky Porfix, `img/FOTKY.md`, a do balíka nejde; čísla sú v názve
  súboru; `dvor-t-1448` má po vyrovnaní horizontu 1420 px a `pas-dvor-1920` 1848 px, v `srcset` je skutočná šírka).
  Do fotiek sa nič nepridáva ani neuberá (žiadne dokresľovanie paliet ani tovaru, žiadne generatívne nástroje); smie
  sa len fotografická úprava tónu, farby, svetla, orez a vyrovnanie, tak ako pri elegantnej úprave zo 6. 11. 2026
  (`img/FOTKY.md`). Nová fotka dostane tú istú úpravu, aby mala sada jeden tón; „plné zásoby“ ukazuje len skutočná
  fotka. Pri rovnakom názve sa na hostingu prejaví až po vypršaní cache (rok), preto novú fotku radšej pod novým názvom.
- Fotky v hlavičkách podstránok: `HLAVICKA_FOTO` v `build.py` (stránka → `uvod:<názov>` skutočná fotka dvora,
  `kat:<názov>` fotka kategórie od majiteľa z `img/kat`, `p:<číslo>` fotka z pôvodného webu, `<názov>` ilustračná fotka
  kategórie z `img/hd`). **Hlavné stránky 10 kategórií** (Strešné krytiny, Sypké zmesi, Stavebné rezivo, Murovací materiál,
  Hutný materiál, Izolačný materiál, Fasádny systém, Farby a laky, Dlažby a ploty, Podhľady a PVC) majú od 17. 11. 2026
  Máriove fotky (`KAT_FOTO`, opisy `KAT_FOTO_ALT`; majiteľ: „katalóg výrobkov – vymeniť fotky za tie, čo som poslal“).
  Podstránky značiek si nechali doterajšiu fotku (aby nedostali tovar inej značky). Zdroj `zdroj/foto-maria/` (bezstratové
  výrezy zo snímok, `vyrezy.tsv`), výroba `bash nastroje/foto_maria.sh`: šírky 480, 720, 960 a skutočná šírka výrezu
  (1030 – 1320 px, nič sa nezväčšuje), vysoké výrezy orezané na 4 : 3, výrez 720 × 468 pre telefón v `img/kat/hlavicka/`.
  Predošlé fotky predajne v hlavičkách týchto kategórií ostali v repozitári (do balíka idú len použité súbory). Ilustračná fotka sa používa vo
  verzii 1200 px (`img/hd/<názov>-1200.webp`, ImageMagick, kvalita 80); pre novú ju treba vyrobiť rovnako (celú sadu – najväčšia šírka, -1200, dlaždica 900 × 600 a výrez -720 pre telefón –
  vyrobí `richtarik/dizajn2/zapis/nastroje/fotky.sh`; v `srcset` je skutočná šírka najväčšieho súboru). Rám má na
  počítači najviac 520 px, na telefóne celú šírku obsahu a výšku 230 px; fotka musí mať aspoň 1,6-násobok šírky rámu.
  Dlaždice kategórií (úvod aj Katalóg) skladá `dlazdice()`; od 16. 11. 2026 majú Máriove ilustrácie skupín
  (`KAT_ILUSTRACIA`, `img/ilu`), skutočné fotky sú po rozkliknutí v hlavičke kategórie. Na úvode sa dlaždice menia ručne
  (vložiť výstup `dlazdice('index.html', cisla=True)`).
- Služby (texty v `data/texty.json`, piktogramy `SLUZBY_OBR`), pás faktov O nás (`FAKTY_ONAS`) a tabuľa na O nás
  (`TABULA_ONAS`) sú v `build.py`; texty sú zo zdroja alebo z úvodu, nové treba overiť rovnako. Podmienky 3D karty a tabule
  na Kontakte sú v `GRAFIKA_PRI` (kľúče ako `plati_pri` v `data/galeria.json`).
- Hosting: `python3 -I nasadenie/presmerovania.py . nasadenie` vyrobí znova `htaccess.txt`, `web.config.txt`
  a `presmerovania.tsv` (po pridaní PDF do `pdf/`, zmene stránok alebo `DOMENA`) a vypíše kontrolu (časť HTTPS
  a presmerovania).

## Správa webu
Majiteľ si na hostingu Forpsi sám upravuje akcie a ceny, letáky a cenník akcií v PDF, otváracie hodiny a oznamy
k nim (sviatok, dovolenka, iné hodiny od – do), novinky (nové aj pôvodné: text, fotky, PDF, skrytie), fotky v albumoch
galérie Predajňa a Areál a obrázky v albumoch grafiky (Letáky a bannery na stránke Leták, Logo a firemná grafika
v Galérii), vybrané texty Úvodu, Služieb, O nás a Dopravy a telefón a e-mail: adresa
`https://www.stavebninyrichtarik.sk/sprava/`, na telefóne aj na počítači. Návod pre majiteľa krok za krokom je v správe
(Pomoc) a v PDF pre majiteľa `richtarik/dokoncenie/final/navod-sprava.pdf` (17. 11. 2026, 11 kapitol vrátane galérie,
letákov a bannerov, telefónu a e-mailu so skrývaním obrázkov a textov; zdroj `richtarik/dokoncenie/final/navod/navod.html`, snímky
zo skutočnej správy na kópii `navod/nastroje/spusti.sh` – plné Chromium so slovenčinou, `LANGUAGE=sk`, PDF `navod/nastroje/vyrob.sh`;
po zmene obrazoviek správy snímky a PDF vyrobiť znova); architektúra a výsledky testov v `richtarik/sprava/zapis/ZAPIS.md`.

**Ako to funguje.** Návštevník dostáva len statické súbory ako doteraz – na verejných stránkach nie je žiadny skript,
štýl, cookie ani odkaz správy. Obsah, ktorý správa mení, je v stránkach v označených oblastiach
`<!--s:ID-->…<!--/s:ID-->` (275 oblastí, spolu ≈ 18 kB na 77 stránkach; od 16. 11. 2026 aj karty Zavolajte nám a Napíšte
nám na Kontakte – `kontakt-karty`: Máriova grafika s číslom alebo e-mailom v obrázku sa ukáže, len kým sú v `data/firma.json`
údaje z obrázka, `KONTAKT_OBR` v `build.py`; po zmene telefónu či e-mailu ostane karta bez obrázka. Rovnako ostatné grafiky
s údajom: obrázok hodín v `hodiny-kontakt`, ikona zliav v `sluzby-polozky`, 3D karta v `uvod-karta` a `sluzby-zlavy`
(namiesto nej plochá karta), tabuľa v `kontakt-tabula`, piktogramy kontaktu v `sluzby-kontakt` a položky albumov `galeria-letaky`
a `galeria-grafika` s poľom `plati_pri` – `GRAFIKA_UDAJE`, `udaje_platia()`; v správe má taká položka poznámku „nie je na
webe“ a po nahradení novým obrázkom podmienka zaniká. Albumy grafiky smú ostať prázdne, ich časť potom z webu zmizne celá). Pravda o ňom sú údaje `data/*.json` (`firma`
s hodinami a oznamami, `cennik`, `akcie`, `caste`, `novinky`, `galeria`, `texty`, `verzia`). Oblasti skladajú tie isté šablóny `sprava/sablony/*.html` v Pythone
(`build.py` cez `nastroje/sablona.py`, `nastroje/vykreslenie.py`) aj v PHP (`sprava/jadro/Sablona.php`,
`Vykreslenie.php`, `Typografia.php`). Správa po ťuknutí Zverejniť vykreslí z celých údajov všetky oblasti, novú
stránku akcie alebo novinky zloží z kostry `sprava/kostry/akcia.html` / `novinka.html`, prepočíta `assets/index.json`
a `sitemap.xml`, pri zmene telefónu alebo e-mailu nahradí ich staré podoby vo všetkých verejných textových súboroch
(`sprava/jadro/Kontakt.php`; pri importe to isté v zdrojoch repozitára `nastroje/kontakt.py`) a ak je na hostingu
asistent, zosúladí jeho znalosti s hodinami a častými otázkami. Oznam k hodinám má na webe `data-do` a `site.js`
ho po poslednom dni skryje (bez JS ostane viditeľný aj s dátumom); bežné hodiny a ich údaje pre Google sa nemenia.
Každá zmena ide cez náhľad so zoznamom „Čo sa zmení“ (pred → po, uloží sa aj do Histórie; pri zmene telefónu, e-mailu
alebo hodín aj veta, ktoré obrázky s údajom v obrázku z webu zmiznú alebo sa vrátia – `Rozdiel::obrazkyVety`) → kontroly (H1, titulky a popisy pre Google a ich jedinečnosť, odkazy, rozmery obrázkov,
JSON-LD, značky) → zálohu → denník prerušeného zápisu → premenovanie → overenie odtlačkov a dá sa vrátiť v Histórii.

**build.py** číta `data/` (`data_sprava.py`), oblasti v ručnom `index.html` prepíše z údajov (zvyšok súboru nemení),
zapíše `sprava/kostry/` (kostra akcie, `konstanty.json`, `oblasti.json`, `typografia.json`) a na konci overí:
`kontrola oblastí správy: OK` (každá oblasť = vykreslenie z údajov, značky v pároch, nie v `<title>`, `<script>` ani
atribúte) a `zhoda Python = PHP` (`nastroje/sprava_zhoda.py`: všetky oblasti, typografia na ≈ 2 600 textoch webu,
šablóny, popisy, 75 záznamov hľadania – 0 rozdielov; bez `php` v PATH len upozornenie). `python3
nastroje/sprava_zhoda.py --referencia <starý výstup>` overí, že web bez značiek je bajtovo ako predtým.

**Inštalácia na Forpsi (Linux odporúčaný, Windows funguje).**
1. Doména musí mať HTTPS (bez neho správa ukáže len návod). PHP 8.1 – 8.5 (odporúčané 8.3) s GD (WebP).
2. Pred balíkom stiahnuť a importovať zmeny z hostingu (bod Zmeny z hostingu nižšie; pri prvej inštalácii netreba).
   Balík so správou: `SPRAVA=1 SPRAVA_REVIZIA=<revízia z data/verzia.json> bash nasadenie/balik.sh . <výstup>` –
   bez zhodnej revízie balík odmietne vzniknúť (poistka, aby nový web neprepísal zmeny majiteľa). Do balíka ide
   `sprava/` bez testov, `sprava/semeno/` (počiatočné údaje), `sprava/verzia.json`; nikdy `data/`, `nastroje/`, údaje
   správy ani zálohy. Bez `SPRAVA=1` je balík ako doteraz plus ochranné súbory `img/s/`, `pdf/s/`.
3. Nahrať obsah balíka do `/<doména>/www` (FTP, WebFTP rozbalí ZIP na serveri). Na Linuxe si správa vytvorí priečinok
   údajov **mimo webu** `/<doména>/sprava-data/`; ak to hosting nedovolí (Windows), vytvorí `www/sprava-data-<32 hex>/`
   s `.htaccess` a `web.config` a sondou overí, že je z internetu nedostupný – inak sa zastaví.
4. Otvoriť `https://…/sprava/` → kontrola servera (HTTPS, PHP, rozšírenia, zápis do priečinkov webu, sondy: údaje
   nedostupné, PHP sa v `img/s` a `pdf/s` nespúšťa, `sprava/` zakázaná, značky v stránkach, web = údaje). Ak hlási
   zápis, na Linuxe nastaviť priečinkom webu práva 757 (Forpsi). Pred prihlásením ukáže len súhrn.
5. Prvé nastavenie spolu s majiteľom: Vytvoriť overovací kód → správa zapíše `PRVY-KOD.txt` do priečinka údajov
   (čitateľný len cez FTP/WebFTP, kód platí 24 h, 5 pokusov, nový najskôr o 15 min) → kód opísať → meno a heslo
   (aspoň 10 znakov, nie známe ani s názvom firmy). **Žiadne predvolené heslo ani účet neexistuje**; heslo je len ako
   odtlačok (Argon2id/bcrypt). Zabudnuté heslo: rovnako cez `OBNOVA-KOD.txt` (1 h); núdzovo zmazať `ucty.json` cez FTP.

**Bezpečnosť.** Relácia s `HttpOnly`, `SameSite=Strict`, `Secure`, prísny režim, nečinnosť 2 h; zapamätané zariadenie
30 dní s rotáciou tokenu (starý token odhlási zariadenie); CSRF token + kontrola Origin; 5 zlých hesiel z jednej
adresy = 15 min, 10 = 1 h (celkový zákaz pre všetkých nie je, aby cudzí nezamkol majiteľa); pokusy o kód 5 z adresy,
200 spolu, nový kód hneď po zmazaní súboru s kódom cez FTP; hlavičky `no-store`, `noindex`, CSP, `DENY` rámy
(`X-Robots-Tag` na `/sprava/` posiela `.htaccess` aj PHP, zámerne – chráni aj statické súbory a funguje aj bez
mod_headers; dvojitá hlavička je neškodná).
Fotky: v telefóne zmenšené na 2 400 px, na serveri len JPEG/PNG/WebP do 15 MB a 40 Mpx, prekódované cez GD do WebP
(a AVIF, ak server vie) v šírkach 600 a 1 200 px nikdy väčších ako originál, bez EXIF a GPS, meno vždy od servera
(`img/s/<rok>/<mesiac>/…`), nič sa neprepisuje. PDF: do 25 MB, bez JavaScriptu a vložených súborov (`pdf/s/…`).
`img/s/` a `pdf/s/` zakazujú spúšťanie (`.htaccess`, `web.config`). Testy: `sprava/testy/bezpecnost.sh`.

**Zmeny z hostingu späť do repozitára.** V správe Nastavenia → Stiahnuť zálohu (heslo) → ZIP s `data/`, `img/s/`,
`pdf/s/` a odtlačkami súborov. Potom `python3 -I nastroje/sprava_import.py <zip>`: overí cesty a typy súborov,
skopíruje, spustí `build.py` a porovná výsledok s hostingom (cez `nasadenie/profil.py`, bez `lastmod`); 0 rozdielov
je podmienka, rozdiel znamená chybu kódu, nie obsahu. Commit „Stavebniny Richtárik: obsah zo správy k <dátum> (r<n>)“.
**Pravidlo: pred každým novým balíkom najprv import.** Ak by sa na hosting predsa nahral starší web, správa to po
prihlásení ukáže a tlačidlo „Vrátiť na web moje zmeny“ vykreslí web znova z uložených údajov.

**Čo správa nemení:** vzhľad, menu, katalóg a značky, ostatné albumy galérie (výstavy), pôvodný obsah starých noviniek
(dá sa doplniť text, fotky a PDF pod neho), adresu a IČO, uvítanie, prechádzku, tému, presmerovania a štruktúru JSON-LD
(to ostáva v `build.py` a `index.html`). Asistent: hodiny v znalostiach, odpovediach a v okne (`asistent.js`,
`asistent-ukazka.js`) aj odpovede z Častých otázok zosúladí správa aj `build.py` (riadok `znalosti asistenta z dát`);
novú akciu či novinku do znalostí nepridá – `build.py` to vypíše ako `POZOR` a pred zapnutím asistenta ju treba
doplniť (`asistent/README.md`). Krok späť pri novej akcii alebo novinke ju len skryje (stránka ostane s vetou, že
skončila, a `noindex`); úplne ju odstráni programátor. Úvod (`index.html`) má v kartách akcií typografiu podstránok
(nezlomiteľné medzery pred € a jednotkami): pri 1024 px je rad kariet o riadok (24 px) vyšší, inak bez rozdielu;
`sprava_zhoda.py --referencia` preto `index.html` porovnáva po zjednotení medzier.

**Testy správy** (všetky na kópii v `/dev/shm`, nikdy na hostingu ani na repozitári – bez argumentov sa nespustia):
`php sprava/testy/jednotky.php <kópia balíka> <vstupy>` (180 testov: vstupy, šablóny, fotky, PDF, zámky, zálohy,
prerušený zápis, súbeh, kódy, heslá, oznamy, novinky, galéria, texty, kontakt, grafiky s údajom v obrázku, ceny a úvod),
`bash sprava/testy/e2e.sh <snímky>` (Playwright 390 × 844 aj 1440 × 900, ≈ 260 kontrol na šírku: celý postup majiteľa
vrátane novinky, sviatku, fotky v galérii, textu, telefónu, e-mailu a pevnej linky a ich vrátenia, obrázka pridaného do
albumu grafiky a skrytia všetkých letákov, s overením verejných stránok a toho, že obrázky so starými hodinami,
telefónom alebo e-mailom po zmene zmiznú a po vrátení sa vrátia), `bash sprava/testy/bezpecnost.sh`, `python3 sprava/testy/vstupy.py <priečinok>`
(testovacie súbory). Lokálny server: `php -S 127.0.0.1:<port> -t <kópia> sprava/testy/router.php` (napodobní zákazy
z `.htaccess`; bez HTTPS funguje len pod `php -S`).

## Nasadenie
Náhľad beží na GitHub Pages v podpriečinku `stavebniny-richtarik/`. Ostrý web je v koreni domény
https://www.stavebninyrichtarik.sk/ (canonical, sitemap a og:image sú nastavené na túto adresu):

1. `venv/bin/python build.py` – vypíše `stránok v sitemap.xml: 76`, `kontrola úvodu: OK`, `kontrola textov: OK`, `kontrola farieb: OK`
   a žiadne `POZOR`; `index.html` bez zmeny.
2. `bash nasadenie/balik.sh . <priečinok balíka>` (bez asistenta) alebo
   `ASISTENT_API=https://www.stavebninyrichtarik.sk/asistent/api.php bash nasadenie/balik.sh . <priečinok>` (s ním, až
   keď je server pripravený, časť Asistent na otázky) – balík bez zdrojov a poznámok (`zdroj/`, `build.py`, `obsah.py`,
   `popisy.py`, `texty.py`, `README.md`, `OBNOVA-*.md`, `img/FOTKY.md`, `nasadenie/`) a bez obrázkov, na ktoré nič
   neodkazuje; skript skontroluje lokálne odkazy a súbory starého videa a vyrobí aj zip. Na hosting sa nahrá
   **obsah** balíka do koreňa domény (FTP/SFTP). PDF v `pdf/` idú celé, lebo na ne vedú presmerovania starých adries.
   So správou: `SPRAVA=1 SPRAVA_REVIZIA=<revízia z data/verzia.json>` (časť Správa webu). `CASTI=40` namiesto jedného
   ZIPu (≈ 150 MB) vyrobí časti `stavebniny-richtarik-web-1.zip` … `-5.zip`, každú do 40 MB a samostatne
   rozbaliteľnú do koreňa webu (na poradí nezáleží); skript ich rozbalí a porovná zoznam a sha256 s `web/` (riadok
   `časti spolu = web/: … zhodné`). Vedľa balíka vždy zapíše `NAVOD-NAHRATIE.txt` (zo `nasadenie/navod-nahratie.txt`:
   čo kam, čo sa nesmie prepísať ani zmazať – `img/s/`, `pdf/s/`, `sprava-data*`, upravený `.htaccess`, žiadna
   synchronizácia v FTP klientovi –, prvé prihlásenie do správy, kontrola po nahratí), `SHA256SUMS.txt` a
   `ku-korenu/.htaccess` a `ku-korenu/web.config`.
3. Na hostingu: `ku-korenu/.htaccess` (Apache) alebo `ku-korenu/web.config` (IIS) z balíka – kópie
   `nasadenie/htaccess.txt` a `web.config.txt` – do koreňa webu: 301 zo starých adries `.aspx` a `files/N.pdf`,
   vlastná 404. Nie sú v ZIPe zámerne (ďalšie nahratie by prepísalo upravený `.htaccess`). Kanonická adresa a HTTPS:
   časť HTTPS a presmerovania nižšie.
4. Hlavičky (sú v oboch súboroch): gzip a brotli pre HTML, CSS, JS, JSON a SVG; `Cache-Control: max-age=31536000,
   immutable` pre `img/`, `pdf/`, `subory/` a písma, `max-age=600` pre HTML, `site.css`, `site.js` a `index.json`
   (názvy bez verzie). Fotku pod rovnakým názvom zákazníci po výmene uvidia až po roku – meniť názov.
5. Po nahratí: Google Search Console – odoslať `sitemap.xml`, skontrolovať niekoľko starých adries (301) a jednu
   neexistujúcu (404).

## HTTPS a presmerovania
- Web počíta s adresou `https://www.stavebninyrichtarik.sk/` (`DOMENA` v `build.py`: canonical, og:url, og:image,
  sitemap, JSON-LD aj ciele presmerovaní). Pôvodný hosting (IIS 10) HTTPS dnes nemá; ostať, alebo prejsť inam, je
  otvorená otázka majiteľa.
- `python3 -I nasadenie/presmerovania.py . nasadenie` vyrobí pravidlá v tomto poradí:
  1. **Kanonická adresa** (schéma a host podľa `DOMENA`): `http://…` a adresy bez `www` jedným 301 na
     `https://www.…`. Pravidlo je **pripravené, ale vypnuté** (v `htaccess.txt` zakomentované, vo `web.config.txt`
     `enabled="false"`), aby web na hostingu bez HTTPS neprestal fungovať. Staré adresy ho obchádzajú.
  2. **Staré adresy** pôvodného webu (`/sk/….aspx`, 83 stránok zo `zdroj/pages.json`) a súbory `files/N.pdf|doc|wmv`
     rovno na absolútny cieľ na kanonickej adrese, takže aj z `http://` alebo bez `www` je to jedno presmerovanie
     (bez reťaze).
  Skript na konci vypíše kontrolu: `v zdroji stránok 83 | chýba 0 | … | neexistujúci cieľ 0 | reťaze 0`. Vyrába aj
  hlavičky cache a hlavičku CORS pre písma (`Access-Control-Allow-Origin: *` pri `.woff2`, do 13. 11. 2026 len ručne
  v súboroch), takže jeho výstup je zhodný so súbormi v `nasadenie/`.
- **Zapnutie, keď HTTPS na hostingu funguje** (certifikát pre `www` aj holú doménu): `python3 -I
  nasadenie/presmerovania.py . nasadenie --kanonicke` (alebo v `.htaccess` odkomentovať tri riadky pod bodom 1, vo
  `web.config` dať `enabled="true"`) a súbor znova nahrať. Overenie: `curl -sI http://stavebninyrichtarik.sk/`
  vráti `301` a `Location: https://www.stavebninyrichtarik.sk/`, `curl -sI http://stavebninyrichtarik.sk/sk/akcie.aspx`
  jedno `301` rovno na `https://www.stavebninyrichtarik.sk/akcie/index.html`. Ak hosting ukončuje HTTPS na proxy
  a Apache vidí stále `%{HTTPS} off` (presmerovanie dookola), v `.htaccess` zmeniť podmienku na
  `RewriteCond %{HTTP:X-Forwarded-Proto} !https`.
- **Ak hosting HTTPS mať nebude:** v `build.py` zmeniť `DOMENA = 'http://www.stavebninyrichtarik.sk/'`, spustiť
  `venv/bin/python build.py` (podstránky, sitemap, robots.txt) a `python3 -I nasadenie/presmerovania.py . nasadenie`
  (ciele presmerovaní a kanonické pravidlo sa prepnú na http). V ručnom `index.html` nahradiť
  `https://www.stavebninyrichtarik.sk/` za `http://www.stavebninyrichtarik.sk/` (canonical, og:url, og:image, JSON-LD);
  `kontrola_uvodu()` potom musí hlásiť OK. Potom balík (časť Nasadenie, bod 2).

## Asistent na otázky
- Okno asistenta s povinným označením ako na Barbershope (výslovná žiadosť majiteľa). Všetko o ňom je v `asistent/README.md`:
  režimy, zapnutie naostro, kľúč (len cez premennú `KLUC` do `asistent/config.php`, nikdy do repozitára ani do správ),
  limity, odhad nákladov a údržba znalostí.
- Náhľad: `data-asistent="ukazka"` na `<html>` (šablóna v `build.py`, ručne v `index.html`), odpovede vopred
  pripravené, nič sa neposiela. Kým je v okne úvod (sekcia s nadpisom `#h-uvod`, trieda `.hero` alebo atribút
  `data-bez-asistenta`), ikona je skrytá, aby nezakryla jeho tlačidlá. Modul sa načíta lenivo (pri prvom ťuknutí alebo
  klávese, inak 3,5 s po načítaní a najskôr 5,5 s od začiatku, po uvítaní) a nikdy počas posunu (čaká 600 ms
  pokoja), aby preklad modulu nedal dlhú snímku v odhaleniach pri posune; prvý obraz stránky ho nepotrebuje.
- Vzhľad a pohyb okna sú z webu: papier, malta, tehlová, Barlow; dĺžky a krivky z `site.css` (`--dlzka-dnu`,
  `--krivka-dnu`, `--dlzka-tlak`), žiadna tmavá plocha (ani bublina otázky, ani clona na telefóne), pri „obmedziť
  pohyb“ bez animácie.
- Znalosti a texty webu hovoria to isté: odpovede na stránke Časté otázky berie `build.py` doslova z
  `asistent/znalosti/richtarik-otazky.json`. Po zmene textov webu: `python3 -I asistent/nastroje/otazky_zdroj.py .`,
  `venv/bin/python build.py`, potom `node asistent/nastroje/caste.mjs .` (zhoda stránky s databázou) a
  `node asistent/nastroje/otazky.mjs .` (fakty a hľadanie; 1 známy FAIL „Kedy by ste mi to vedeli doviezť?“ 0,57).
- Balík: bez `ASISTENT_API` ide web bez asistenta (žiadne `data-asistent`, žiadny odkaz Ochrana údajov v päte,
  žiadne `asistent/` ani `assets/asistent*`); s `ASISTENT_API=https://www.stavebninyrichtarik.sk/asistent/api.php`
  dostanú stránky adresu servera.
