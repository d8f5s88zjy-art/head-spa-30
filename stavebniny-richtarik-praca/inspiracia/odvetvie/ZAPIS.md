# Inšpirácia z odvetvia: pohyb, hook a prechody na weboch stavebnín a výrobcov (5. 11. 2026)

Rola: výskum pohybu na webe v odvetví stavebného materiálu. V strome `hs-richtarik-obnova` som nič nemenil
(len som čítal `stavebniny-richtarik/index.html` a `assets/site.js`). Všetky výstupy sú v tomto priečinku
`richtarik/profi/inspiracia/odvetvie/`. Cesty nižšie sú relatívne k nemu.

## 1. Zhrnutie

- Prezrel som **23 webov** odvetvia (SK, CZ, DK, NO, SE, UK, DE, AT, USA) a 4 technické zdroje. **22 webov má
  kontaktné hárky pri 390 aj 1440 px** (sekvencia 0–4 s od prvého bajtu dokumentu + 8 snímok pri posune, s jasom
  a podielom tmavých pixelov). Hárky, ktoré som otvoril nástrojom Read, sú v časti 3 pri každej referencii.
  Obe šírky som otvoril pri 6 weboch (Wienerberger, Baumit, DEK, Petersen Tegl, Leitl, Texas Materials) a
  navyše prehľad všetkých prvých obrazoviek. Prehľad prvých obrazoviek: `prehlad-prva-obrazovka-390.jpg` (otvorený).
- **Najsilnejšie zistenie pre Richtárika: v odvetví nikto neukazuje vlastný sklad ako dôkaz.** Výrobcovia ukazujú
  produkt alebo vizualizáciu domu (Wienerberger, Bramac, Porfix), predajcovia akciové bannery a ceny (Selco, Byggmax,
  Stavmat, DEK). Coltman Bros píše „visit our extensive timber yard“ a Selco „We stock all the building materials …
  under one roof“, no ani jeden z nich ten dvor ani sklad neukáže. Skutočná fotka plného dvora je teda v odvetví
  nezvyčajná a sama dokazuje vetu v nadpise.
- **Hook v odvetví takmer vždy zakryje okno súhlasu s cookies.** Do 4 s ho má cez úvod **aspoň 16 z 22 webov**
  (11 našiel automat v texte prvej obrazovky, 5 som videl v hárkoch: Baumit, DEK, Leitl, MKM, Stavmat). Byggmax tam má
  ešte okno s PSČ. Pri 5 weboch okno aj stmaví stránku: Dinesen 52 %, Leitl 64 %, Wienerberger 33 %, Bramac 23 % a
  Texas Materials 40 % tmavých pixelov (tu je tmavá už samotná fotka). Web Richtárika dnes nemá kód cookies ani
  meracích skriptov (`grep -c cookie` v `index.html` aj `site.js` = 0), takže jeho hook nič nezakryje. To je
  výhoda, ktorú treba zachovať.
- **Filmové prechody medzi stránkami (View Transitions) a CSS animácie riadené posunom nepoužíva nikto z 22 webov.**
  Automat najprv našiel v CSS výrazy `view-transition` a `animation-timeline`. Pri overení zdroja sa ukázalo, že ide
  o rozpísaný zápis `all: unset` a `all: initial` (Wienerberger, Moelven), nie o skutočný prechod. Skutočné použitie
  má len Baumit: `animation-timeline: scroll(self)` ako detektor posunu v promo bloku (`nastroje/vtzdroj.mjs`,
  výstup v časti 5). Medzi weby, ktoré sme mohli prezrieť, je teda prechod medzi stránkami novinkou.
- Tri vzory **nepreberať**: (a) video v úvode (Leitl 9,4 MB za 4 s, Dinesen tmavé drevo, 84 Lumber čierny obdĺžnik),
  (b) celostránkový preloader (Stavmat má 3 s prázdnu stránku s krúžkom), (c) obrázky, ktoré pri posune vyskočia
  neskôr (Wienerberger, Coltman a Selco majú pri +0,15 s prázdne alebo sivé dlaždice).
- TOP 8 nápadov je v časti 7. Na prvom mieste je **pomalý „najazd“ kamery do skutočnej uličky dvora s nadpisom
  odhaleným maskou** (sila 5 × realizovateľnosť 5). Nasledujú **dlaždice zásob ako veľké textúry so štítkom**
  (inšpirácia Petersen Tegl) a **prechod z dlaždice katalógu do hlavičky kategórie cez View Transitions**.

## 2. Metóda a obmedzenia

- Nástroje: `nastroje/zachyt.mjs` (Playwright Chromium z `/opt/pw-browsers`, proxy z `HTTPS_PROXY`), `nastroje/harok.py`
  (hárok, jas), `nastroje/tech.py` (výpis techniky), `nastroje/prehlad.py`, `nastroje/vtzdroj.mjs` (pôvod pravidiel CSS),
  `nastroje/vsetko.sh` a `nastroje/znova.sh` (sériový beh). Zoznam webov je v `nastroje/zoznam.txt`.
- **Časová os:** CDP screencast s časovou pečiatkou každej snímky. Čas 0 je okamih, keď prišiel prvý bajt
  dokumentu (`commitEpoch` v JSON). Hárok ukazuje snímku platnú v čase 0; 0,5; 1; 1,5; 2; 3 a 4 s. Potom nasleduje
  ostrá snímka v 4 s, snímka po vizuálnom skrytí cookie lišty (skrytie cez CSS, nič som neodklikol) a 4 kroky
  posunu kolieskom po 0,8 výšky okna, každý so snímkou po 0,15 s a po 0,7 s (tak sa zachytí odhalenie alebo
  oneskorené načítanie).
- **Jas:** priemer jasu 0–255 a podiel pixelov s jasom pod 50 („tmavé %“), počítané na každej snímke hárku
  (`*-jas.json`).
- **Telefón:** samostatný beh pri 390 px, CPU 4× (`Emulation.setCPUThrottlingRate`), bez snímok. Počas 6 s
  načítania a 6 krokov posunu sa merali rámce cez `requestAnimationFrame`, ďalej Long Animation Frames a LCP
  (`*-390-meranie.json`). **Výhrada:** každý web je meraný jedným behom cez proxy, na stroji, kde súbežne bežia
  iné úlohy s prehliadačom. Čísla sú orientačné na porovnanie náročnosti, nie A/B meranie. Do 6 s spadá aj
  samotné načítanie stránky, takže dlhé rámce sú z veľkej časti parsovanie skriptov, nie animácia.
- **Bajty do 4 s** sú súčtom `transferSize` z Resource Timing. Cudzie domény bez `Timing-Allow-Origin` hlásia 0,
  takže hodnota je spodný odhad. Stavmat (0,02 MB) a Ptáček (0) sú preto nespoľahlivé.
- **Kodek:** testovací Chromium neprehrá H.264. Čierny obdĺžnik videa 84 Lumber môže byť sčasti spôsobený tým.
  Stále to však ukazuje, čo uvidí návštevník, kým sa video nespustí, keďže web nemá plagát (`poster`).
- **Zablokované alebo nedostupné (ochranu som neobchádzal):** awwwards.com (proxy zavrela spojenie, záznam
  `ws_closed_mid_exchange` v `__agentproxy/status`), siteinspire.com (429), cssdesignawards.com (502), kebony.com
  a huwsgray.co.uk (403, „Just a moment…“), raabkarcher.cz, raab-karcher.de a quester.at (časový limit).
  Optimera a Petralithe: stránka v prehliadači padala („Page crashed“). Na disku bolo vtedy 100–280 MB voľného
  miesta (`df -h /`), stroj zdieľajú aj iné úlohy. Z Optimery mám len prvú obrazovku pri 390 px, z Petralithe len
  statický rozbor HTML.
- Žiadny kód, text ani fotku z cudzích webov nepreberám. Zapisujem len princípy. Stiahnuté HTML a CSS sú len v
  `stiahnute/` a nič z nich som nespúšťal mimo prehliadača.

## 3. Referencie (navštívené 5. 11. 2026, časy UTC)

Formát: čo robí po sekundách → prečo funguje → technika → telefón (CPU 4×) → ako by to vyzeralo u Richtárika
(len skutočné fotky) → riziká. „Tmavé“ znamená podiel pixelov s jasom pod 50.

### R1 Petersen Tegl (DK), výrobca tehál – https://www.petersen-tegl.dk/
- Hárky (otvorené): `snimky/petersen/harok-petersen-390.jpg`, `snimky/petersen/harok-petersen-1440.jpg` (09:36–09:37).
- 0–1,0 s biela stránka, 1,0–1,5 s sivý zástupný obdĺžnik, 1,5–2 s makrofotka tehál „D201 – New Brick in the
  D-Series“ (pri 390 px sa celá ukáže v 3 s), 3 s panel cookies v pravom dolnom rohu (nestmavuje). Pri posune ide
  jedna za druhou **celoplošná textúra materiálu s veľkým nápisom pri spodnej hrane**: MURSTEN, KOLUMBA, COVER,
  FORMSTEN, TEGL-OVERLIGGERE. Nič sa nehýbe, snímka po 0,15 s = snímka po 0,7 s.
- Hook: materiál je hrdina, nie dom ani ľudia. Zblízka je hmatateľný a typografia pôsobí ako štítok na palete.
  Prvá obrazovka ukazuje tovar, nie reklamu.
- Technika: statické obrázky, 1× `@keyframes`, žiadna knižnica. **Len 0,14 MB do 4 s** (390), najmenej zo všetkých.
- Telefón: LCP 1756 ms, 7 z 463 rámcov nad 50 ms, najdlhší 217 ms. Je to najľahší web zo vzorky.
- U Richtárika: dlaždice zásob (TermoBRIK, Porfix neupravený z `bb6bbaeb`, Stadreko, rezivo) ako celoplošné
  textúry so štítkom TEHLY / PÓROBETÓN / DLAŽBY / REZIVO. Štítok sa pri vstupe do okna vysunie maskou (pozri N2).
- Riziká: textúra s bielym textom potrebuje kontrast, preto štítok na svetlom podklade, nie na tmavom pruhu.
  Fotky zásob majú najviac 900–1125 px na šírku, takže na počítači ich nedávať cez celú šírku.

### R2 Leitl (AT), výrobca tehál a betónu – https://www.leitl.at/
- Hárky (otvorené): `snimky/leitl/harok-leitl-390.jpg`, `snimky/leitl/harok-leitl-1440.jpg` (09:41–09:42).
- 0–1,0 s biela, 1,5 s úvodné video pod oranžovou lištou cookies (usercentrics) a nadpis „UNSERE WÄNDE KÖNNEN
  ZAUBERN“ v oranžovom páse. Tmavé je 53 % (390) a 61–64 % (1440). Bez lišty: čiernobiela fotka dieťaťa za
  oranžovou dierovanou tehlou, oranžový panel s textom a body karuselu. Pri posune: „Wir sind Komplettanbieter mit
  Serviceplus“, karty Ziegel a Beton s textúrou tehly v pozadí, „Familienunternehmen … 1895 … 5. Generation“.
- Hook: jedna farba značky (oranžová) a jedna veta s emóciou. Rodinná firma je v texte, nie v grafike.
- Technika: 2× `<video autoplay>` (`LEITL_LENA_HEADER…1644x744.mp4`), Swiper, jQuery, 13× `prefers-reduced-motion`.
  **9,47 MB do 4 s** (390).
- Telefón: LCP 2080 ms, 11 z 411 rámcov nad 50 ms (najdlhší 400 ms).
- U Richtárika: princíp jednej silnej vety v páse farby značky nad skutočnou fotkou, ale **bez videa**. Rok 1997
  a „rodinné stavebniny“ patria do textu pod nadpis, nie do odznaku.
- Riziká: tmavé video a tmavý závoj (64 %), veľký objem dát, karusel (pohyb, ktorý si človek nevyžiadal).

### R3 Wienerberger (SK), Porotherm, Tondach, Semmelrock – https://www.wienerberger.sk/
- Hárky (otvorené): `snimky/wienerberger/harok-wienerberger-390.jpg` (09:43),
  `snimky/wienerberger/stare/harok-wienerberger-1440.jpg` (09:32).
- 390 px: 0–2 s biela, 3 s okno Cookiebot nad stmavenou stránkou (23 % tmavých, 1440 px 33 %). Bez lišty: fotka
  rozostavaného domu s lešením a H1 „Váš domov si zaslúži inovatívne stavebné materiály“. Pri posune majú karty
  značiek pri +0,15 s **prázdny biely obdĺžnik** a fotka (tehla Porotherm, škridla Tondach) sa doplní až pri +0,7 s.
- Hook: slabý. Fotka domu je všeobecná, nadpis je o „vašom domove“, nie o materiáli.
- Technika: jQuery, AEM. Výrazy `view-transition` v CSS sú len rozpísaný `all: unset`
  (`wbs.min.4e9de07d….css`, overené `vtzdroj.mjs`). 3,4 MB do 4 s.
- Telefón: LCP 5144 ms, 14 z 281 rámcov nad 50 ms (najdlhší 650 ms).
- U Richtárika: z tohto webu nič nepreberať. Je to protipríklad, ktorý ukazuje, prečo obrázky v dlaždiciach
  treba načítať s rezervou (`loading="lazy"` + `rootMargin` alebo vopred pre prvé 2 rady).
- Riziká: oneskorené vyskočenie obrázkov pôsobí ako chyba, nie ako animácia.

### R4 Baumit (SK) – https://baumit.sk/
- Hárky (otvorené): `snimky/baumit/harok-baumit-390.jpg` (09:43), `snimky/baumit/stare/harok-baumit-1440.jpg` (09:33).
- 0,5–1,5 s biela stránka s tenkou červenou čiarou navrchu (ukazovateľ načítania), 2 s okno „Dáta pre pohodlnejšie
  používanie webu“ nad stmavenou mriežkou akcií (Cenník, Kalkulátor, Blog). Okno zostáva počas celého posunu,
  moje skrytie ho nezachytilo.
- Hook: žiadny. Prvú obrazovku zaberajú súhlas a promo dlaždice („k desiatim vedrám ďalšie za 1 €“, súťaž o Ford
  Transit).
- Technika: Swiper, jQuery a **jediné skutočné CSS riadené posunom vo vzorke**: `animation-name: detect-scroll;
  animation-timeline: scroll(self)` v `promosystem-CfeXefiI.css`, teda trik na zistenie, či sa blok dá posúvať.
  4,8 MB do 4 s.
- Telefón: LCP 5280 ms, 8 z 484 rámcov nad 50 ms (najdlhší 250 ms).
- U Richtárika: len technická poznámka, že `animation-timeline` je použiteľné bez knižníc (podpora v časti 6).
- Riziká: promo a okná nad hookom.

### R5 DEK (SK), sieť stavebnín – https://dek.sk/
- Hárky (otvorené): `snimky/dek/harok-dek-390.jpg` (09:45), `snimky/dek/stare/harok-dek-1440.jpg` (09:30).
- 1,5 s hlavička (telefón 0911 201 201, „Zoznam predajní“, „Vyberte si predajňu“) a H1 „Vyberajte z nášho širokého
  sortimentu“ nad prázdnymi dlaždicami kategórií. Tehla sa objaví v 2 s, ostatné obrázky až neskôr. V 3 s príde
  okno cookies. Pri posune sú bloky s číslami „Už 33 rokov skúseností“, „19 špecializovaných predajní“ a „Viac ako
  200 kvalitných výrobcov“.
- Hook: dôvera cez čísla a voľbu predajne. Vizuálne je slabý.
- Technika: jQuery, 1 animácia (`gradient`, zástupný lesk). 0,42 MB do 4 s.
- Telefón: LCP 5404 ms, 25 z 228 rámcov nad 50 ms.
- U Richtárika: čísla ako „33 rokov“ si môžeme dovoliť len z faktov. Máme rok 1997, ale **nie** počet paliet,
  m² ani zákazníkov, preto blok s číslami nerobiť. „Vyberte si predajňu“ Richtárik nepotrebuje, má jedno miesto.
  To je výhoda (pozri N4).
- Riziká: všeobecné H1 „široký sortiment“ je klišé odvetvia.

### R6 Premac (SK), betónová dlažba – https://www.premac.sk/
- Hárok (otvorený): `snimky/premac/stare/harok-premac-390.jpg` (09:33). Aktuálne hárky z 09:44 sú v `snimky/premac/`.
- 0–1,5 s biela, 2 s text „Betón pôsobí stroho a predsa vie očariť“ ešte bez štýlov a písma (záložné patkové
  písmo, zoznam kategórií v dvoch stĺpcoch), 3 s hotová mriežka fotiek kategórií (Betónové dlažby, Funkčné dlažby,
  Eko dlažby, Terasové platne), 4 s okno cookies. V karuseli úvodu je aj snímka **„POSLEDNÉ KUSY … skladu“**.
- Hook: mriežka skutočných povrchov dlažby. Komunikácia zásob je len cez akciu „posledné kusy“.
- Technika: Swiper + Owl + jQuery, 107× `@keyframes`. 2,9 MB do 4 s.
- Telefón: LCP 3308 ms, 9 z 305 rámcov nad 50 ms (najdlhší 950 ms).
- U Richtárika: mriežka skutočných fotiek kategórií je dobrý formát pre katalóg. Dlažby Premac sú aj v sortimente,
  ale použiť len vlastné fotky.
- Riziká: preblik nenaštýlovaného obsahu (FOUC) v 2 s a dve knižnice karuselov.

### R7 Porfix (SK), pórobetón – https://www.porfix.sk/
- Hárok (otvorený): `snimky/porfix/stare/harok-porfix-1440.jpg` (09:34).
- 0,5 s svetlomodrý podklad a kostra okna cookies, 1,0 s karusel s fotkou muža pri výkresoch „Staňte sa členom
  klubu Porfix“ pod oknom cookies. Pri posune: pás ikon a tlačidlo **„Vypočítať spotrebu“**, tmavomodrá sekcia
  „Služby a poradenstvo“ (12 % tmavých), karty referencií.
- Hook: ilustračná fotka človeka (klišé). Najsilnejší praktický prvok je výpočet spotreby.
- Technika: Splide, 24× `clip-path`. 0,8 MB do 4 s.
- Telefón: LCP 2124 ms, 9 z 413 rámcov nad 50 ms.
- U Richtárika: bezplatný výpočet spotreby Richtárik ponúka (fakt zo sady FAKTY v konceptoch). Môže byť druhým
  tlačidlom hneď pod hookom, nie zahrabaný v službách.
- Riziká: tmavomodré plné sekcie.

### R8 Stavmat (SK), sieť stavebnín – https://www.stavmat.sk/
- Hárok (otvorený): `snimky/stavmat/harok-stavmat-1440.jpg` (09:30).
- **0–4 s biela stránka s otáčajúcim sa krúžkom** (`page-preloader`, prvý obsah pri 1440 px až po 4 s), v 3 s lišta
  cookies. Potom: žltý pás „Nový akciový leták … s platnosťou do 5. 12.“ a úvod **„Doplňte zásoby – Akciový leták,
  Platnosť do 05.12.2026“** s fotkou regálov s tovarom, nižšie „Nájsť najbližšiu predajňu“ (s polohou) a okno
  „Nastavenie vašej najbližšej predajne?“.
- Hook: slovo „zásoby“ je v nadpise, ale znamená výzvu zákazníkovi, aby si nakúpil. Dôkaz vlastného skladu chýba.
- Technika: jQuery, Swiper, 46× `prefers-reduced-motion`, animácia `page-preloader`.
- Telefón: LCP 2900 ms, 5 z 230 rámcov nad 50 ms.
- U Richtárika: dátum platnosti priamo v hooku akcií je dobrý (pozri N8). Preloader je presný opak toho, čo chceme.
- Riziká: preloader oneskorí obsah a zhorší LCP.

### R9 Stadreko (SK), výrobca betónových prvkov zo sortimentu – https://www.stadreko.sk/
- Hárok (otvorený): `snimky/stadreko/harok-stadreko-390.jpg` (09:45).
- 1,5 s tmavomodrá hlavička a okno cookies (24 % tmavých), bez lišty: karusel „VYVÝŠENÝ ZÁHON HECTOR“ a 4 ikony
  „Tradícia od roku 1991 / Istota / Kvalita / Ekológia“. Pri posune: tlačidlá kategórií, **mapa Slovenska s bodmi
  závodov**, „Kvalita zo Slovenska – Začínali sme ako malá rodinná firma“, tmavomodrá päta (29 % tmavých).
- Hook: miestny pôvod (mapa, rodinná firma). Úvod však predáva produkt, nie firmu.
- Technika: jQuery. **22 MB do 4 s** (390), najviac zo vzorky.
- Telefón: LCP 3056 ms, 20 z 322 rámcov nad 50 ms.
- U Richtárika: rodinná firma od 1997 a jedna adresa v Nitre-Horných Krškanoch. Mapa s jedným bodom je slabá, lepší
  je stav „otvorené teraz“ a adresa (N4).
- Riziká: obrovské obrázky a tmavá päta.

### R10 Bramac / BMI (SK), strešné krytiny – https://www.bmigroup.com/sk/bmi-bramac/
- Hárok (otvorený): `snimky/bramac/harok-bramac-1440.jpg` (09:35).
- 0,5 s karusel „30 rokov záruka“: dom s červeným kosoštvorcom a **červeným diagonálnym klinom** cez spodok
  úvodu. V 4 s lišta cookies dolu a celá stránka stmavne na 23 % tmavých (390 px 31 %). Pri posune: „Bramac Vision“
  (vizualizácia strechy v telefóne), karty „Naše riešenia“, „Logistika BMI Slovensko“.
- Hook: záruka ako číslo. Diagonála dáva pohyb aj bez animácie.
- Technika: bez knižníc, 2× `clip-path`. 0,67 MB.
- Telefón: LCP 928 ms, 23 z 201 rámcov nad 50 ms (najdlhší 933 ms).
- U Richtárika: **diagonálny „páskový“ strih** ako prechod medzi sekciami (N5), vo svetlej farbe. Záruky
  Richtárik nemá vo faktoch, takže číslo záruky nie.
- Riziká: stmavenie oknom súhlasu.

### R11 Dinesen (DK), drevené podlahy – https://www.dinesen.com/en
- Hárok (otvorený): `snimky/dinesen/stare/harok-dinesen-1440.jpg` (09:37).
- 0–1,5 s biela, 2 s celoplošná fotka tmavého dreveného interiéru „Wall and ceiling cladding – Another approach to
  wooden surfaces“ (43 % tmavých), 3 s okno Cookie Information nad stmavenou fotkou (52 %). Pri posune zostáva
  okno (49 %).
- Hook: pokojná prémiová fotka materiálu a krátka veta.
- Technika: Slick, jQuery, video `file.mp4` (autoplay, mimo prvej obrazovky), 44× `@keyframes`, `body` má
  `overflow: hidden` (zamknutý posun, kým je okno otvorené). 2,8–3,4 MB.
- Telefón: LCP 2152 ms, 31 z 231 rámcov nad 50 ms (najdlhší 850 ms).
- U Richtárika: pokoj a jedna veta áno, tmavá paleta nie. Dvor fotený za slnka je svetlý (modrá obloha), čo je
  výhoda.
- Riziká: tmavé plochy a zamknutý posun.

### R12 Moelven (NO/SE), píla a drevo – https://www.moelven.com/
- Hárok (otvorený): `snimky/moelven/stare/harok-moelven-390.jpg` (09:37).
- 1,0–2,0 s **sivý blok namiesto fotky** s nadpisom „Opportunities grow on trees – we grow with opportunities“
  a vyhľadávaním, 3 s okno „You control your data“. Bez lišty: fotka usmiatej pracovníčky v prilbe. Pri posune:
  karty produktov (Sawn timber), sekcia „Our sawmills“ na fotke stohu rezaného dreva („about 2 million m3“),
  tmavomodrý pás.
- Hook: stoh reziva ako pozadie sekcie o pílach je presne „dôkaz zásob“, ale je až v tretej obrazovke.
- Technika: bez knižníc, `all: initial` (nie prechody). 1,9 MB.
- Telefón: LCP 2460 ms, 9 z 419 rámcov nad 50 ms.
- U Richtárika: fotka `zasoba-rezivo` ako pozadie bloku o dreve a sklade. Počty m³ nemáme, takže žiadne číslo.
- Riziká: sivý zástupný blok pôsobí ako tmavá plocha. Riešenie je mať svetlý zástupný farebný odtieň fotky
  (`background-color` podľa priemernej farby).

### R13 Texas Materials (USA), kamenivo, asfalt, betón – https://texasmaterials.com/
- Hárky (otvorené): `snimky/texasmat/harok-texasmat-390.jpg`, `snimky/texasmat/harok-texasmat-1440.jpg` (09:42–09:43).
  Na Awwwards je vedený v zozname (podľa vyhľadávania, stránku Awwwards som nemohol otvoriť).
- 1,0 s červené bloky (kostra), 1,5 s tmavý úvod (stmavená fotka stroja, 43 % tmavých) s nadpisom „PAVING THE WAY
  FOR TEXAS“ v červenom ráme a 4 rozbaľovacími tlačidlami (Materials, Heavy Civil Construction, Services,
  Careers). Pri posune: „Who we are“ a zoznam činností, **„Our territory“ (mapa s bodmi a adresy pobočiek
  s telefónmi)**, tmavomodrý pás „A long road behind us“ (35–41 % tmavých).
- Hook: veľké písmo v ráme a jasná ponuka 4 smerov. Miestna prítomnosť je mapa s pobočkami.
- Technika: Slick, jQuery. 2,0 MB.
- Telefón: LCP 1376 ms, 36 z 167 rámcov nad 50 ms (najdlhší 1233 ms).
- U Richtárika: veľký nadpis v ráme („štítok“) áno, tmavý podklad nie. Kontakt s adresou a telefónmi ako
  samostatná karta (fakty: Novozámocká 62/68, 0905 622 223, 037 651 17 77).
- Riziká: tmavé plochy 40 % v celom úvode.

### R14 84 Lumber (USA), sieť drevární – https://www.84lumber.com/
- Hárok (otvorený): `snimky/lumber84/harok-lumber84-390.jpg` (09:42).
- 1,0 s prvá snímka videa (pracovník s „84“ na chrbte), **1,5–4 s čierny obdĺžnik videa** (pozri výhradu
  o kodeku), pod ním „BUILDING AMERICA FOR THE LAST 70 YEARS“ a „84 LUMBER COMPANY IS THE NATION'S LARGEST
  PRIVATELY HELD SUPPLIER…“. Pri posune: odznaky ocenení a **„THERE ARE 19 STORES IN YOUR AREA“** na tmavomodrej
  drevenej textúre s čiarovými ikonami (59 % tmavých).
- Hook: história a veľkosť firmy. Dostupnosť je vyjadrená miestne („in your area“).
- Technika: 2× `<video autoplay>` (51 MB zdroj podľa názvu `…dc-51mb-cropped.mp4`), jQuery. 4,5 MB do 4 s.
- Telefón: LCP 1200 ms, 19 z 284 rámcov nad 50 ms.
- U Richtárika: nič z toho. „Najväčší“ si Richtárik tvrdiť nesmie a video nechceme.
- Riziká: čierna plocha bez plagátu, tvrdenia o veľkosti.

### R15 Coltman Bros (UK), rodinná drevospracujúca firma od 1903 – https://coltmanbros.co.uk/
- Hárok (otvorený): `snimky/coltman/stare/harok-coltman-390.jpg` (09:39).
- 0–2 s biela, 3 s logo a zelený pás s 3 výhodami („Timber Yard – Visit our timber yard for our full product range“,
  „Delivery Available“, „Online Shop“), potom „Shop for timber online!“ a text „for our full range call us on
  01455 209038 or **visit our extensive timber yard** in Leicestershire“, „FREE local pickup … FREE delivery …
  within 50 miles“. Pri posune **sivé prázdne plochy** (obrázky sa do +0,7 s nenačítali).
- Hook: poctivé miestne fakty (dvor, telefón, doprava v okruhu). Dvor však nie je odfotený.
- Technika: jQuery. 6 MB do 4 s.
- Telefón: LCP 2672 ms, 31 z 212 rámcov nad 50 ms.
- U Richtárika: rovnaký typ správy („príďte na dvor“, telefón, vlastná doprava), ale **s fotkou dvora**. Richtárik
  presne to, čo Coltman len opisuje, môže ukázať.
- Riziká: sivé plochy pri posune.

### R16 Selco Builders Warehouse (UK) – https://www.selcobw.com/
- Hárok (otvorený): `snimky/selco/harok-selco-390.jpg` (09:40).
- 0,5 s hlavička s pruhom tradeREWARDS, vyhľadávanie, riadky „Dial & Deliver“ a „Click & Deliver“, sivý
  zástupný karusel. 1,5 s banner Velux, 4 s lišta cookies. H1 (vizuálne nenápadné) „Selco, it's where the trade
  go! **We stock all the building materials, timber and supplies you need under one roof.**“. Pri posune: zoznam
  akcií s cenou, žlté dlaždice služieb (Dial & Deliver, Click & Collect, Click & Deliver).
- Hook: rýchlosť nákupu. Tvrdenie o sklade je len v texte.
- Technika: bez knižníc. 1,0–1,35 MB.
- Telefón: LCP 2320 ms, 24 z 307 rámcov nad 50 ms.
- U Richtárika: krátke **služby ako slovesá** („Zavolať“, „Prísť na dvor“, „Doprava“) hneď pod hookom.
- Riziká: tmavomodrá päta (31–45 % tmavých v poslednom kroku).

### R17 Byggmax (SE), stavebniny – https://www.byggmax.se/
- Hárok (otvorený): `snimky/byggmax/harok-byggmax-390.jpg` (09:46).
- 1,0 s žltá hlavička, 4 výhody („Smidig hemleverans“, „Klicka & hämta“, „Öppet köp 365 dagar“, „Handla billigast
  – med vår prisgaranti“) a banner akcie. 3,0 s okno **„Ange ditt postnummer för att se ditt sortiment och
  lagersaldo“** (zadajte PSČ, uvidíte sortiment a **stav skladu**) nad stmavenou stránkou. Pri posune: cenovky
  (149 kr/m², 23,95 kr/m), „LÄGSTA PRISER SEDAN 1993“.
- Hook: cena a skutočný stav skladu podľa predajne (dátami, nie fotkou).
- Technika: Slick. V CSS je **postupný nástup „chipov“**: `animation-name: _chipIn…; animation-delay:
  calc(var(--chip-index, 0) * 55…)` (výpis `vtzdroj.mjs` je orezaný). 0,56 MB.
- Telefón: LCP 5480 ms, 33 z 136 rámcov nad 50 ms (najdlhší 1617 ms).
- U Richtárika: živý stav skladu nemáme a nesmieme ho predstierať. Prevziať sa dá len mikroanimácia postupného
  nástupu dlaždíc (N7). Namiesto stavu skladu je dôkazom fotka plného dvora.
- Riziká: okno cez úvod, ťažké skripty.

### R18 Holz Possling (DE), drevo a stavebniny Berlín – https://www.possling.de/
- Hárok (otvorený): `snimky/possling/harok-possling-390.jpg` (09:47).
- 0–1,5 s biela, 2 s kostra, 3 s dlaždice značiek a video s **viditeľným tlačidlom pauzy**, 3–4 s panel súhlasu.
  Pri posune: „Heute im Fokus – Unsere aktuellen Tipps und Hinweise“ s dátumovanými správami, napr. **„Samstag,
  7.11.2026 – Wegen Inventur haben wir für Sie von 8 bis 14 Uhr geöffnet!“**, kurzy pre zákazníkov.
- Hook: „dnes“, aktuálnosť a ľudský tón (inventúra, otváracie hodiny).
- Technika: jQuery, `<video autoplay>` v prvej obrazovke. 1,3 MB.
- Telefón: LCP 4828 ms, 4 z 439 rámcov nad 50 ms, ale jeden LoAF 1542 ms.
- U Richtárika: pás „Dnes“ (otvorené do…, platné akcie s dátumom) len z existujúcich faktov (N4, N8). Ak raz bude
  pohyblivý prvok, musí mať pauzu ako Possling.
- Riziká: video v prvej obrazovke.

### R19 Petralithe (FR), kamenné obkladové panely – https://www.petralithe.com/en
- Snímky nemám (prehliadač padal pri nedostatku miesta na disku). Rozbor statického HTML
  (`stiahnute/petralithe/index.html`, 5. 11. 2026): `<video class="hero-video__video" preload="auto">` v úvode,
  knižnica **Lenis** (plynulý posun), triedy `big-image-clip` (obrázok, ktorý sa pri posune odkrýva orezom),
  `s_parallax_is_fixed` a `js-sz-text-section__parallax-element` (paralaxa). Podľa výsledku vyhľadávania má
  čestné uznanie Awwwards 18. 11. 2025 (na Awwwards som to overiť nemohol).
- Hook: textúra kameňa vo videu a odkrytie veľkého obrázka orezom pri posune.
- U Richtárika: princíp **„obrázok sa odkryje orezom pri vstupe“** áno (N2, N5), ale bez Lenis a bez pripnutia.
- Riziká: Lenis mení správanie posunu (blízke scroll-jackingu), `preload="auto"` stiahne video hneď, paralaxa je
  na telefóne drahá.

### R20 Optimera (NO), stavebniny – https://www.optimera.no/
- Len prvá obrazovka pri 390 px v prehľade `prehlad-prva-obrazovka-390.jpg` (otvorený). Ďalšie behy padali.
- Vyhľadávanie „Hva ser du etter?“, 6 ikon kategórií so skutočnými produktovými fotkami (Trelast, Verktøy,
  Arbeidsklær …), banner „Klar for byggeplassen“, spodná lišta (Nettbutikk, MinOptimera, Handlevogn).
- U Richtárika: vyhľadávanie hneď v prvej obrazovke Richtárik už má. Dlaždice kategórií s fotkou skutočného
  tovaru sú správny smer.

### R21 Kratšie: MKM (UK), Jewson (UK), Isover (SK), Ptáček (CZ)
- Hárky: `snimky/mkm/`, `snimky/jewson/`, `snimky/isover/`, `snimky/ptacek/` (390 aj 1440). Prvé obrazovky som
  videl v otvorenom prehľade `prehlad-prva-obrazovka-390.jpg`.
- **MKM:** „No branch selected – Please select a branch“, „Free Local Delivery*“, „Trusted Local Experts – Over 140+
  branches nationwide“, okno súhlasu cez celú výšku. Najviac dlhých rámcov vo vzorke: 51 z 173 nad 50 ms.
- **Jewson:** „Set your location – Get local prices and products that are more readily available in your area“.
  Dostupnosť je viazaná na polohu, tmavé dlaždice akcií (51–53 % tmavých pri posune).
- **Isover:** úvod je článok („Fúkaná izolácia: Kedy sa naozaj oplatí?“). Ľahký (0,77 MB), LCP 964 ms pri CPU 4×,
  ale bez hooku.
- **Ptáček:** „Největší prodejní síť topení, voda, plyn, koupelny“ (tvrdenie o veľkosti), LCP 7388 ms pri CPU 4×.

### Technické zdroje (princípy, nie vzhľad)
- **T1 Chrome for Developers – Cross-document view transitions:**
  https://developer.chrome.com/docs/web-platform/view-transitions/cross-document (cez vyhľadávanie 5. 11. 2026).
  Prechod sa zapína pravidlom `@view-transition { navigation: auto; }` na oboch stránkach. Prvky sa spárujú cez
  `view-transition-name`, typy prechodu cez `pagereveal`/`pageswap`. Prehliadač bez podpory urobí bežnú navigáciu.
  Návod ho balí do `@media (prefers-reduced-motion: no-preference)`.
- **T2 MDN – @view-transition a Using the View Transition API:**
  https://developer.mozilla.org/docs/Web/CSS/@view-transition,
  https://developer.mozilla.org/docs/Web/API/View_Transition_API/Using. Funguje len v rámci jedného pôvodu
  (same-origin) a pre navigácie push, replace a traverse spustené používateľom.
- **T3 caniuse (Fyrd/caniuse, `features-json`, stiahnuté 5. 11. 2026 do `stiahnute/`):** prechody medzi
  dokumentmi majú Chrome od 126, Safari a iOS od 18.2. Firefox má čiastočnú podporu (144, 145), Samsung Internet
  žiadnu. Úplnú podporu má 87,73 % používateľov. Prechody v rámci jedného dokumentu: Chrome 111, Safari 18.0,
  Firefox 144, Samsung 23 (93,17 %).
- **T4 MDN browser-compat-data `css/properties/animation-timeline.json` (stiahnuté 5. 11. 2026):**
  `animation-timeline`, `scroll()` a `view()` majú Chrome 115, Firefox 159 a Safari 26. Používať len pod
  `@supports (animation-timeline: view())`, s hotovým (viditeľným) stavom ako predvoleným.

## 4. Tabuľky meraní (z `*-jas.json`, `*.json`, `*-390-meranie.json`)

Prvý obsah = prvá snímka sekvencie s jasom pod 250 (čas od prvého bajtu dokumentu, cez proxy).

| web | šírka | prvý obsah (s) | jas / tmavé % v 4 s | najviac tmavých % pri posune | bajty do 4 s | LCP ms |
|---|---|---|---|---|---|---|
| baumit | 390 | 2.0 | 199/1 | 3 | 4.83 MB | 4304 |
| baumit | 1440 | 2.0 | 169/1 | 2 | 5.04 MB | 4748 |
| bramac | 390 | 0.5 | 83/31 | 8 | 0.67 MB | 3260 |
| bramac | 1440 | 0.5 | 91/23 | 6 | 0.67 MB | 736 |
| byggmax | 390 | 1.0 | 181/4 | 9 | 0.56 MB | 5024 |
| byggmax | 1440 | 0.5 | 168/2 | 24 | 0.56 MB | 2672 |
| coltman | 390 | 2.0 | 94/27 | 4 | 5.97 MB | 2152 |
| coltman | 1440 | 2.0 | 162/7 | 7 | 5.93 MB | 4336 |
| dek | 390 | 1.5 | 204/1 | 2 | 0.42 MB | 3588 |
| dek | 1440 | 1.5 | 179/2 | 7 | 0.42 MB | 3592 |
| dinesen | 390 | 1.5 | 210/7 | 6 | 2.77 MB | 1932 |
| dinesen | 1440 | 1.0 | 107/52 | 49 | 3.39 MB | 968 |
| isover | 390 | 1.0 | 227/2 | 3 | 0.77 MB | 1420 |
| isover | 1440 | 1.0 | 223/0 | 0 | 1.06 MB | 1544 |
| jewson | 390 | 2.0 | 154/16 | 51 | 1.7 MB | 2396 |
| jewson | 1440 | 2.0 | 133/15 | 53 | 1.7 MB | 1920 |
| leitl | 390 | 1.5 | 85/42 | 7 | 9.47 MB | 2404 |
| leitl | 1440 | 1.5 | 51/64 | 4 | 9.31 MB | 2704 |
| lumber84 | 390 | 1.0 | 164/27 | 59 | 4.49 MB | 1120 |
| lumber84 | 1440 | 0.5 | 65/65 | 56 | 4.7 MB | 1260 |
| mkm | 390 | 1.0 | 162/2 | 1 | 0.98 MB | 1480 |
| mkm | 1440 | 1.0 | 113/3 | 5 | 0.96 MB | 1488 |
| moelven | 390 | 1.0 | 205/11 | 11 | 1.91 MB | 2628 |
| moelven | 1440 | 0.5 | 106/41 | 22 | 1.91 MB | 1748 |
| petersen | 390 | 1.5 | 208/6 | 20 | 0.14 MB | 3468 |
| petersen | 1440 | 1.0 | 194/2 | 10 | 0.11 MB | 1788 |
| porfix | 390 | 0.5 | 209/0 | 10 | 0.81 MB | 1752 |
| porfix | 1440 | 0.5 | 193/6 | 12 | 0.79 MB | 1608 |
| possling | 390 | 2.0 | 193/7 | 19 | 1.34 MB | 6436 |
| possling | 1440 | 1.5 | 231/2 | 11 | 1.34 MB | 4156 |
| premac | 390 | 2.0 | 219/1 | 15 | 2.93 MB | 3152 |
| premac | 1440 | 2.0 | 191/12 | 24 | 2.41 MB | 2156 |
| ptacek | 390 | 3.0 | 215/3 | 12 | n/a | n/a |
| ptacek | 1440 | 1.5 | 173/2 | 10 | n/a | n/a |
| selco | 390 | 0.5 | 146/16 | 31 | 1.02 MB | 2092 |
| selco | 1440 | 0.5 | 134/27 | 45 | 1.35 MB | 1944 |
| stadreko | 390 | 1.5 | 209/6 | 29 | 21.97 MB | 4796 |
| stadreko | 1440 | 1.5 | 173/4 | 23 | 19.91 MB | 4536 |
| stavmat | 390 | 1.5 | 210/0 | 20 | n/a | 2824 |
| stavmat | 1440 | >4 | 218/3 | 0 | n/a | 2416 |
| texasmat | 390 | 1.0 | 98/44 | 41 | 2.0 MB | 1612 |
| texasmat | 1440 | 1.0 | 103/40 | 40 | 1.98 MB | 1196 |
| wienerberger | 390 | 3.0 | 141/23 | 5 | 3.42 MB | 3628 |
| wienerberger | 1440 | 2.0 | 98/33 | 5 | 3.61 MB | 2204 |

Telefón 390 px, CPU 4×, jeden beh, 6 s načítania + 6 krokov posunu (orientačné, výhrady v časti 2):

| web | LCP ms | rámce > 50 ms / spolu | najdlhší rámec ms | LoAF > 50 ms |
|---|---|---|---|---|
| baumit | 5280 | 8 / 484 | 250 | 13 |
| bramac | 928 | 23 / 201 | 933 | 26 |
| byggmax | 5480 | 33 / 136 | 1617 | 35 |
| coltman | 2672 | 31 / 212 | 550 | 33 |
| dek | 5404 | 25 / 228 | 417 | 25 |
| dinesen | 2152 | 31 / 231 | 850 | 31 |
| isover | 964 | 30 / 196 | 733 | 32 |
| leitl | 2080 | 11 / 411 | 400 | 14 |
| lumber84 | 1200 | 19 / 284 | 617 | 22 |
| mkm | 1748 | 51 / 173 | 983 | 53 |
| moelven | 2460 | 9 / 419 | 300 | 9 |
| petersen | 1756 | 7 / 463 | 217 | 8 |
| porfix | 2124 | 9 / 413 | 633 | 10 |
| possling | 4828 | 4 / 439 | 133 | 7 |
| premac | 3308 | 9 / 305 | 950 | 12 |
| ptacek | 7388 | 40 / 134 | 567 | 43 |
| selco | 2320 | 24 / 307 | 633 | 28 |
| stadreko | 3056 | 20 / 322 | 500 | 24 |
| stavmat | 2900 | 5 / 230 | 400 | 5 |
| texasmat | 1376 | 36 / 167 | 1233 | 39 |
| wienerberger | 5144 | 14 / 281 | 650 | 15 |

Na porovnanie, zo súčasných konceptov pre Richtárika (rovnaké CPU 4×, ale iné meranie a iný deň): koncept
Inventúra uvádza LCP 394 ms (medián) a 0 snímok nad 50 ms počas strihu (`koncept-inventura/NAVRH.md`). Žiadny
web z odvetvia sa tomu ani nepriblížil. Ľahkosť je teda tiež odlíšenie.

## 5. Ako odvetvie komunikuje zásoby, dovoz, poradenstvo, miesto a dôveru

| téma | ako to robia (dôkaz) | čo z toho pre Richtárika (len z faktov) |
|---|---|---|
| zásoby, „skladom“ | dátami podľa predajne: Byggmax „lagersaldo“ po zadaní PSČ, Jewson „more readily available in your area“, MKM „Please select a branch“; textom: Selco „We stock all …“, Coltman „extensive timber yard“; akciou: Premac „posledné kusy zo skladu“, Stavmat „Doplňte zásoby“ | živý stav skladu nemáme, preto ho nepredstierať. Dôkaz je **skutočná fotka plného dvora** (neupravené verzie z `bb6bbaeb`, nie fotky s doplnenými paletami) a veta „Dvor plný materiálu“ (povolené znenie) |
| dovoz | Coltman „FREE delivery … within 50 miles“, Selco „Click & Deliver“, Byggmax „Smidig hemleverans“, MKM „Free Local Delivery*“ | „Vlastná doprava autami s mechanickou rukou“ (fakt) **len textom**, bez fotky auta |
| poradenstvo | Porfix „Vypočítať spotrebu“, Bramac „Zameriame a spočítame ju aj bez dokumentácie“, DEK „komplexný poradenský servis“, Possling kurzy | bezplatný výpočet spotreby a poradenstvo (fakty v konceptoch) ako druhé tlačidlo pod hookom |
| miesto | Texas Materials mapa s pobočkami, Stadreko mapa závodov, 84 Lumber „19 stores in your area“, Stavmat „Nájsť najbližšiu predajňu“ | jedno miesto = žiadna voľba predajne. Adresa Novozámocká 62/68, Nitra-Horné Krškany a stav „otvorené / zatvorené“ z hodín Po–Pi 7–16, So 7–12 |
| dôvera | roky (DEK 33 rokov, Leitl 1895, 84 Lumber 70 rokov, Byggmax 1993, Stadreko 1991), veľkosť (Ptáček „největší“, 84 Lumber „largest“), počty (DEK 19 predajní, 200 výrobcov), ocenenia | rok **1997** a „rodinné stavebniny“ áno. Veľkosť, počty ani ocenenia nie (nemáme zdroj) |

**Klišé odvetvia (v tejto vzorke):** okno cookies cez úvod (16/22), karusel s bodkami (Premac, Porfix, Stadreko,
Bramac, Leitl, Selco), ilustračný človek alebo vizualizácia domu (Porfix, Leitl, Moelven, Wienerberger, Bramac),
všeobecné H1 („široký sortiment“, „inovatívne stavebné materiály“), odznak „od roku“, tmavomodré a čierne pásy
(Texas Materials, 84 Lumber, Stadreko, Selco, Porfix), video v úvode (Leitl, 84 Lumber, Possling), oneskorene
vyskakujúce obrázky (Wienerberger, Coltman, Selco).

**Čím sa Richtárik odlíši:** (1) vlastný dvor ako dôkaz namiesto reklamy, (2) prvá obrazovka bez okna, bez
preloaderu a bez videa, (3) svetlo, teda žiadna tmavá plocha ani pri prechode, (4) prechody medzi stránkami,
ktoré v odvetví nikto nemá, (5) rýchlosť na telefóne.

## 6. Techniky, ktoré sa dajú použiť bez knižníc (vlastný kód, princípy z T1–T4)

- **Najazd kamery:** `@keyframes` na `transform: scale()` a `translate()` priamo na `<img>`, ktorý je LCP prvok.
  Obrázok je viditeľný od prvého vykreslenia a animácia mení len kompozitor, takže LCP nečaká. Trvanie 2,5–4 s,
  `ease-out`, raz (nie v slučke). Pri `prefers-reduced-motion: reduce` bez animácie.
- **Odhalenie nadpisu maskou:** každý riadok v `<span>` s `overflow: clip` a vnútro `translateY(100%)→0`, alebo
  `clip-path: inset(0 0 100% 0)→inset(0)`. Text je v DOM od začiatku (SEO, bez JS viditeľný). Animáciu pridá až
  trieda nastavená skriptom, takže bez JS sa nič neskryje.
- **Odhalenia pri posune:** predvolený stav je viditeľný. Animácia platí len pod `@supports (animation-timeline:
  view()) and (prefers-reduced-motion: no-preference)`, s `animation-range: entry 0% cover 25%` a `clip-path`
  alebo `opacity` + `translate`. Bez podpory (Firefox pred 159) je všetko ihneď viditeľné, nič nie je pripnuté.
- **Prechody medzi stránkami:** `@view-transition { navigation: auto }` v `@media (prefers-reduced-motion:
  no-preference)`. Na dlaždicu katalógu a na hlavičkovú fotku kategórie dať rovnaký `view-transition-name`
  (unikátny, napr. `kat-tehly`) a krátke trvanie (220–300 ms). Pozadie stránok je svetlé, takže prelínanie
  nikdy neprejde cez tmavú. Bez podpory je navigácia bežná.
- **Mikroanimácie:** `transition` na `transform` a `box-shadow` (zdvih 2–4 px pri hover a focus, stlačenie
  `scale(.98)` pri `:active`), postupný nástup cez `--i` a `animation-delay: calc(var(--i) * 50ms)`, len raz.

## 7. TOP 8 nápadov pre Richtárika (sila hooku × realizovateľnosť, 1–5)

Všetko zo skutočných fotiek (`img/uvod`, neupravené verzie z `bb6bbaeb`, `u4`/`prijazd-podklad`/`u3` z gitu,
`img/g`), svetlé, bez pripnutia, bez zamknutia posunu, pri „obmedziť pohyb“ statické a bez JS viditeľné.

| # | nápad | inšpirácia (princíp) | hook | real. | skóre |
|---|---|---|---|---|---|
| N1 | **Najazd do uličky dvora + nadpis maskou.** 0–0,3 s je fotka uličky (A2 alebo A1 u4) už ostrá a viditeľná. 0,3–3,5 s kamera pomaly „vojde“ do uličky (scale 1,00→1,08, posun k úbežníku). 0,4–1,2 s sa po riadkoch odkryje „Dvor plný materiálu.“ a „Od základov po strechu.“. 1,4 s sa objaví štítok „Skutočná fotka · náš dvor v Nitre“, 1,8 s tlačidlá Zavolať a Katalóg. Úvod nemá okno, preloader ani video. | Petersen (materiál ako hrdina, 0,14 MB), Leitl (jedna veta), Coltman (dvor opísaný, ale neukázaný), protipríklady Stavmat a Dinesen | 5 | 5 | **25** |
| N2 | **Dlaždice zásob ako textúry so štítkom.** TermoBRIK, Porfix (neupravený), Stadreko a rezivo ako veľké výrezy s nápisom TEHLY / PÓROBETÓN / DLAŽBY / REZIVO pri spodnej hrane. Štítok sa pri vstupe do okna vysunie orezom (`animation-timeline: view()`, inak hneď viditeľný). Na telefóne pod sebou, na počítači 2×2. | Petersen (MURSTEN, KOLUMBA…), Petralithe (`big-image-clip`) | 4 | 5 | **20** |
| N3 | **Filmový prechod katalóg → kategória** cez View Transitions medzi dokumentmi: fotka dlaždice sa plynulo zmení na hlavičku kategórie a nadpis „preletí“ na miesto H1, 250 ms. Rovnako akcia → detail akcie. Bez podpory bežná navigácia, pri obmedzení pohybu vypnuté. | T1–T3. V odvetví to nemá nikto z 22 webov | 4 | 4 | **16** |
| N4 | **„Dnes otvorené do 16:00“ pri tlačidle Zavolať.** Stav sa vypočíta z hodín Po–Pi 7–16 a So 7–12. Pri zmene stavu zabliká bodka (raz). Hneď vedľa je adresa a dve čísla. Bez JS sa zobrazia statické hodiny. | Possling „Heute im Fokus“, 84 Lumber „stores in your area“, Coltman „visit our yard“. Protipríklad: voľba predajne (MKM, DEK) | 3 | 5 | **15** |
| N5 | **Svetlý diagonálny strih medzi sekciami.** Ďalšia sekcia (Sklad a doprava, Akcie) sa otvorí šikmým orezom v svetlej farbe značky (`clip-path: polygon`), 400 ms, len raz pri prvom vstupe. Žiadna tmavá clona. | Bramac (diagonálny klin), Leitl (pás farby), Petralithe (odkrytie orezom) | 3 | 5 | **15** |
| N6 | **Pás „kontaktný hárok dvora“.** Rad skutočných malých fotiek dvora a predajne (`img/g/73–106`, 533×400) ako filmový pás, ktorý sa pomaly posúva (CSS `translateX`, 40–60 s). Pauza pri hover a focus a tlačidlo pauzy, pri obmedzení pohybu statická mriežka. | Petersen (mozaika tehál), Possling (pauza videa) | 3 | 4 | **12** |
| N7 | **Mikroanimácie dlaždíc katalógu a akcií.** Postupný nástup 50 ms na dlaždicu (len raz), zdvih s tieňom pri hover a focus, stlačenie pri `:active`. Cenovka akcie sa pri vstupe „opečiatkuje“ (scale 1,12→1, rotácia −5°→−3°, 180 ms). | Byggmax (`--chip-index` × 55), Selco a Byggmax (cenovky) | 2 | 5 | **10** |
| N8 | **Pás s dátumom pri akciách:** „Cenník akcií z 28. 1. 2026“ s dátumom zo zdroja (pdf/662.pdf). Pri akciách bez dátumu sa dátum nevymýšľa (otvorená otázka majiteľa). | Stavmat („platnosť do 05.12.2026“), Possling (dátumované správy) | 2 | 4 | **8** |

**Nepreberať:** video v úvode, Lenis a plynulý posun, paralaxu s `background-attachment: fixed`, karusel
s automatickým posunom, preloader, tvrdenia o veľkosti, počty a záruky, okno cookies cez úvod, tmavé pásy.

## 8. Riziká pri realizácii a ako ich merať

- **Tmavé plochy:** každú snímku prechodu merať ako tu (`harok.py`, jas a tmavé %). Cieľ: 0 snímok s viac ako 20 %
  tmavých pixelov počas prechodov. Pozadie prechodu (`::view-transition`) a zástupné farby fotiek musia byť svetlé.
- **Výkon:** animovať len `transform`, `opacity` a `clip-path`. Na telefóne pri CPU 4× merať počas animácií
  (cieľ: 0 rámcov nad 50 ms), striedavo A/B s dnešným stavom.
- **LCP:** fotka úvodu musí byť viditeľná od prvého vykreslenia (`fetchpriority="high"`, bez `opacity: 0` na
  štarte). Odhaľuje sa len text a štítky.
- **Pripínanie a posun:** žiadne `position: sticky` pre obsah úvodu, žiadny `overflow: hidden` na `body`, žiadne
  zachytávanie kolieska.
- **Obmedziť pohyb a bez JS:** všetky animácie len pod `prefers-reduced-motion: no-preference`. Skryté počiatočné
  stavy len cez triedu, ktorú pridá skript.
- **Fotky:** len neupravené verzie (pas-dvor, dvor-predajna a zasoba-porfix z `bb6bbaeb`). Fotky skutočných áut
  firmy (IVECO z gitu, p/883, p/885) len so súhlasom majiteľa a nikdy auto z filmu.

## 9. Súbory

- `ZAPIS.md` (tento zápis), `prehlad-prva-obrazovka-390.jpg`, `prehlad-prva-obrazovka-1440.jpg`.
- `snimky/<web>/`: `harok-<web>-390.jpg`, `harok-<web>-1440.jpg` (aktuálne) a `stare/` (prvé behy, ktoré som
  otvoril tam, kde je to uvedené). Ďalej `sekv-<šírka>/` (vybrané snímky sekvencie), `<web>-<šírka>-t4.jpg`,
  `-bezlisty.jpg`, `-p1a…p4b.jpg`, JSON s technikou a jasom a `<web>-390-meranie.json`.
- `nastroje/` (skripty, zoznam webov), `stiahnute/` (caniuse, BCD, HTML a CSS na overenie pôvodu pravidiel).
- Pomocný `venv` (Pillow pre `harok.py`) som po práci zmazal kvôli miestu na disku; obnoví sa príkazom
  `python3 -m venv venv && venv/bin/pip install pillow`.
- Servery som nespúšťal (porty 9710–9719 neboli potrebné, pozeral som len verejné weby). Prehliadače sa po
  každom behu zavreli: `pgrep -f zachyt.mjs` po skončení nič nevráti.
