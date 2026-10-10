# BARBERSHOP 30 – prehliadka podniku (smer 2, nahrádza 3D kreslo)

> Nadradený dokument: `docs/MASTER_BRIEF.md` (zámer, kontrolný zoznam detailov, postup bez chýb). Pri rozpore platí MASTER_BRIEF.

Rozhodnutie majiteľa (2026‑10‑09): web má od prvej sekundy pôsobiť ako **prehliadka
podniku**, bez 3D kresla, čo najreálnejšie a profesionálne. Hero objektom je sám
priestor na skutočných fotkách. Platí ďalej ART_DIRECTION.md (paleta, typografia,
tlačidlá, pravidlá pohybu, pravidlo pravdy) – mení sa iba obrazová vrstva a scény.

## Technika: film zo skutočných fotiek s hĺbkovou mapou

Rovnaký princíp ako na webe HEAD SPA 30 (`/home/user/head-spa-30/assets/world.js`,
README „Film zo skutočných fotiek“): každá fotka má hĺbkovú mapu (`<meno>-hlbka.webp`,
svetlá = blízko), kamera sa v nej pohne ako v skutočnej miestnosti (popredie sa posúva
voči stene), pri skrolovaní ide pomalým filmovým pohybom (nájazd, prejazd, zdvih) a
medzi časťami webu sa zábery prelínajú. Text, tlačidlá a cenník sú HTML nad filmom.
Fotky sa netónujú; len vinetácia a jeden jednotný **prechod cez priestor** medzi zábermi
(rozhodnutie majiteľa 2026‑10‑09: prechody jednotné, filmové, s efektom, bez straty ostrosti):
- každý bod obrazu sa prelína vo vlastnom čase podľa bližšej z dvoch hĺbok: ďaleký koniec oboch
  miestností sa vymení prvý, blízke veci (kreslo, sud, pult – staré aj nové popredie) posledné, akoby
  popri návštevníkovi prešli; každý bod sa prelína v okne 0,45 z celého prechodu (post shader,
  hĺbka ide v alfe textúry záberu);
- kamera odchádzajúceho záberu zrýchli dopredu (do štvrtiny vzdialenosti), prichádzajúca dobehne
  zozadu a usadí sa; hĺbka sa pri tom „otvorí“ (uAmt 0,42 → 0,52 a späť);
- uprostred krátke šero (82 % jasu) a o niečo užšia vinetácia, ako strih vo filme; nikdy tma,
  nikdy dvojexpozícia celého obrazu, nikdy rozmazanie;
- prechod zaberá najviac 30 % cesty medzi kotvami (pri bežnej medzere jednej obrazovky 0,3 obrazovky
  skrolu; pri väčších medzerách asi 55 % výšky okna, najmenej 16 %), vždy okolo stredu, a v pokoji
  sa vždy dokončí na bližší záber;
- ten istý prechod má aj prológ (z fasády cez dvere dnu). Snímky: `source/tools/prechod-shot.mjs`
  (zastavený prechod cez `BS30_FILM.fadeFreeze`).

- Zábery (maximálny detail): `assets/img/film/<meno>-{1086,1448,2172,2896}.{avif,webp}`
  (fasáda `vstup` aj 4096 px pre nájazd k dverám) + `<meno>-hlbka.webp`; nič sa nezväčšuje nad
  originál (rohozka-2172 = 1920 px). Pre telefón má každý záber vlastný výrez na výšku 9 : 16
  okolo bodu záujmu `<meno>-m-{1086,1448}` + `<meno>-m-hlbka.webp` (rohožka z fotky majiteľa
  foto-30 na výšku), takže sa na displeji 3× nezväčšuje ako výsek zo záberu na šírku. Detailné
  zábery (karafa, pracovné miesto, káva) majú okno len na časť výšky fotky (`mh` vo film.py), aby
  telefón ukázal predmet nad doskou s textom a nie stenu okolo neho. AVIF q66, WebP q84. Zoznam,
  rozmery, stupne a bod záujmu výrezu v `assets/img/film/film.json`
  (skript `source/tools/film.py`, hĺbka `source/tools/hlbka.py` – Depth Anything V2 small, ONNX,
  lokálne); zálohy a kotvy v index.html z neho prepíše `source/tools/stills.py`.
- Film si vyberie najmenší stupeň, ktorý sa na obrazovke nezväčší (do 2896 px na počítači, záber
  prológu do 4096 px, telefón 1448 px výrezu); fotky majú mipmapy, trilineárne filtrovanie a
  anizotropiu 8; mriežka 256 × 192 (počítač), 112 × 200 (výrez na telefóne); plátno na telefóne
  až 3× (pri pomalom zariadení sa samo zníži).
- Plynulosť ako video: kamera sa hýbe stále (pomalé oblúky aj bez skrolovania; 60 snímok/s minútu
  po poslednom pohybe, potom 30, po 3 min stojí), kamera za skrolom ide ako ťažšia (pružina 4,2),
  koliesko na počítači posúva stránku plynulo (app.js, časová konštanta 140 ms; dotyk, klávesy a
  posuvník natívne), prológ je jedna plynulá krivka (najrýchlejšie v dverách, bez zastavenia).
  Kontrola: `node source/tools/koliesko-test.mjs`.
- Knižnica: three.js (vendor), jeden canvas `position: fixed` pod obsahom, WebGL2;
  bez WebGL2, pri `prefers-reduced-motion`, `saveData`, nízkej obrazovke alebo slabom
  telefóne (< 4 GB, < 4 jadrá) ostáva **pokojná verzia**: tie isté fotky ako statické
  `<picture>` pozadia sekcií s jemným CSS prejazdom (scale 1 → 1.06 podľa scrollu) –
  stránka vyzerá rovnako, len sa v nej nedá „pohnúť“.
- Rytmus (ako head spa): záber cez celú obrazovku → pás s textom cez celú šírku → záber.
  Textové dosky sú tmavé (`--ink` 0.72) so zreteľným okrajom, nikdy nerozmazávajú text.
- Kamera: jeden jednotný pohyb celého filmu – stále pomaly dopredu s jemným bočným
  oblúkom (4 % šírky na desktope, 2,6 % na telefóne), pozerá na bod záujmu `f`;
  myš na počítači pridá ďalší oblúk, telefón nie (žiadne povolenia).
- Mobil: výrez na výšku najviac 1448 px (bod na bod aj pri 3×; rohožka na telefóne je z foto‑40
  majiteľa, 1932×2576, výrez 1449 px: pult, rohožka, kreslá, sud), presah 1,24, text dole nad spodným CTA.
  Body záujmu výrezov sú na veci z názvu miesta (recepcia 0,30 = pult, stôl 0,62, čakáreň 0,72 = pumpa,
  sud 0,78), kreslo pri okne o 5 % vyššie (opierka celá).

## Brána filmu

Film beží len s grafickou kartou: hlavička aj film.js skúšajú WebGL2 s `failIfMajorPerformanceCaveat`
a meno vykresľovača (SwiftShader, llvmpipe, software → pokojná verzia, film by sa tam trhal). Platí to aj pre
Lighthouse a PageSpeed Insights, ktoré kreslia softvérovo: merajú pokojnú verziu, ktorú dostane každé také
zariadenie. `?film=on` film povolí aj pri softvérovom kreslení (všetky testy v `source/tools/` ho pridávajú).

## Úvod ako film (prológ): z ulice cez dvere dnu

Rozhodnutie majiteľa (2026‑10‑09, podľa referencie s filmovým úvodom): web sa otvorí ako film,
ale namiesto cudzieho mesta sú v ňom naše dvere a naša miestnosť. Raz za návštevu (sessionStorage
`bs30uvod`), len keď film ide (trieda `world`), bez kotvy v adrese a v zobrazenej karte:

1. Prvý obraz stránky je fasáda s dverami (`vstup`, statická záloha, LCP) s H1 a tlačidlami.
2. Film začne tým istým záberom: kamera ide z chodníka k dverám (pohyb `door`, dopredu o tretinu
   vzdialenosti, bod záujmu dvere [0.76, 0.53]) – 2,0 s na počítači, 2,3 s na telefóne.
3. Cez krátke šero (prelínanie ako medzi miestnosťami) prejde dnu na záber úvodu `rohozka`
   (slider/3: rohožka s logom, kreslo, sála) – 1,4 s / 1,6 s; kamera v ňom ďalej stúpa (`rise`)
   a od tejto chvíle ju vedie skrolovanie. Celý prológ asi 3,5 s; skrolovanie ho hneď ukončí.
4. Chôdza začne, až keď je načítaný aj záber úvodu (dovtedy kamera stojí pred podnikom na
   prvom snímku, ktorý sedí na zálohe); na pomalej sieti najviac 6 s po fasáde, potom ide aj tak
   a pri dverách počká (najviac 4 s). Ak film nepríde do 7 s od štartu, prológ sa vynechá.
   Počas prológu sa nesťahuje nič iné než záber úvodu a kvalita (rozlíšenie plátna) sa nemení.
5. Statická záloha (fasáda, aj rohožka pri druhej návšteve) má presne rámovanie prvého snímku filmu:
   rovina záberu s presahom 1,24, bod záujmu, začiatočná vzdialenosť kamery (`--z0` v style.css:
   0,05 prológ, −0,04 záber pri kotve, −0,005 jemný nájazd) a rovnakú vinetáciu; stály pohyb kamery
   nabieha 1,5 s od nuly. Prelínanie zálohy do filmu tak nič neposunie ani nepriblíži (posun do
   7 px, mierka do 2 %, zvyšok je hĺbkový posun). Záloha si vyberá ten istý stupeň fotky ako film
   (`sizes="(max-width: 720px) 93vw, 124vw"`: telefón 1086, počítač 2172), film ju má z cache.

Rozhranie: kotva úvodu `.film-shot[data-shot="rohozka"]` nesie `data-pro="vstup"`, `data-pro-f`,
`data-pro-fm`, `data-pro-mv="door"`, `data-pro-size="4096x2731"`, `data-pro-place`; o prológu
rozhodne skript v hlavičke (trieda `pro` na `<html>`, `?uvod=znova` ho pustí aj opakovane) a
statickú zálohu úvodu (fasáda pri prológu, inak rohožka) vloží skript v kotve z dvoch `<template>`.
Pokojná verzia (bez WebGL, obmedzený pohyb, šetrenie dát, druhá návšteva): rohožka hneď, bez prológu.
Kontrola: `node source/tools/uvod-shot.mjs` (snímky prológu na polohách 0 … 1, druhé načítanie,
`?film=off`); plynulosť: `node source/tools/uvod-meranie.mjs` (časová os prológu pri rýchlej aj
pomalej sieti, dvojice záloha/film) a `python3 -I source/tools/uvod-zhoda.py` (posun a mierka dvojíc).

### Hook úvodu (rozhodnutie majiteľa 2026‑10‑09: na telefóne rovnako prepracované ako na počítači)

- **Filmové pásy**: počas prológu sú hore a dole čierne pásy ako v kine (8 % výšky, na telefóne
  9 %); keď kamera príde dnu, odsunú sa von (900 ms). Poistka: keby film neprišiel, odsunú sa po 9 s.
- **Choreografia nadpisu**: doska nastúpi (350 ms), potom vety nadpisu po jednej (420 / 560 ms),
  odsek (760 ms) a tlačidlá (900 ms); pri obmedzení pohybu bez animácie.
- **Doska pláva nad filmom**: obsah záberu ide pri skrolovaní o kúsok pomalšie než stránka
  (±14 px podľa `--sp`), takže text má vlastnú hĺbku oproti miestnosti.
- **Telefón**: doska úvodu kompaktná (hlavné tlačidlo je v spodnej lište, v doske ostáva
  „Zavolať“ ako odkaz), výzva „Prejdi si podnik“ nad spodnou lištou, výrezy na výšku s vlastným
  bodom záujmu a hĺbkou (časť Technika), ten istý prechod cez priestor ako na počítači.

### Návrat na otváraciu scénu (rozhodnutie majiteľa 2026‑10‑09)

Zákazník sa po skrolovaní môže vrátiť na otváraciu scénu: na začiatku stránky je tlačidlo
„Späť na ulicu“ (vpravo dole nad výzvou, len keď film beží) – kamera prejde z rohožky cez dvere von
na Mostnú (časová os 1,9 s / 2,2 s na telefóne, filmové pásy sa zasunú) a ostane stáť pred podnikom
(`html.outside`, S = 0); tlačidlo sa zmení na „Vojdi dnu“ a vojdenie je ten istý prológ, len o tretinu
rýchlejší. To isté spraví koliesko nahor na vrchu stránky, potiahnutie prstom nadol na vrchu
(`overscroll-behavior-y: none`, aby to nebolo obnovenie stránky), šípka hore / Home; z ulice dnu
koliesko nadol, potiahnutie nahor, šípka dole / medzerník, tlačidlo, alebo jednoducho skrolovanie
(pružina prejde cez dvere). Záber fasády sa načíta len vtedy, keď ho treba, a po vojdení sa uvoľní.
Rozhranie: `BS30_FILM.uvod.von()`, `BS30_FILM.uvod.znova()`, stav `state.outside`, `state.leaving`.
Bez filmu (pokojná verzia) tlačidlo nie je.

## Cesta (poradie záberov = poradie sekcií; titulné karty od 2026‑10‑10)

Každá kotva začína titulnou kartou priamo na zábere (nadpisok, nadpis Fraunces 800, jeden riadok, bez
dosky; style.css P11). Karta je pripnutá, kým kotva prechádza oknom, a mení sa len krytím (app.js `--o`,
`is-on`); nadpis karty nastúpi po slovách (P12). Poloha karty sa strieda: vľavo, vpravo, v strede.
Na telefóne sú tri zábery skutočné videá majiteľa (`data-video`, film.js `VideoTexture`, bez tónovania).

| # | sekcia (id) | záber počítač / telefón | karta | nadpisok · nadpis · riadok | tlačidlá |
|---|---|---|---|---|---|
| 0 | prológ (bez kotvy) | `vstup` fasáda s dverami | – | to isté ako úvod | – |
| 1 | `#uvod` | `rohozka` | stred | Barbershop 30 · Nitra · „Tvoj strih. *Tvoje miesto.*“ · Za dverami na Mostnej 30 sa strihá od roku 2019. | Rezervovať termín, Zavolať |
| 2 | `#recepcia` | `recepcia` | vpravo | Recepcia · „Najprv káva. Potom strih.“ · recepčná, káva a minerálka zdarma | – |
| 3 | `#vstup-dnu` | počítač bez vlastného záberu (`data-desk="skip"`, film ide z recepcie do sály) / telefón **video** `vstup-dnu` (video‑3 0–5 s, riadené skrolom, kamera ide sálou) | vľavo | Prvý krok · „Poď ďalej.“ · Drevená podlaha, kreslá a zrkadlá. Mostná ostala za dverami. | – |
| 4 | `#sala` | `sala` → `kreslo` | vľavo → vpravo | Tri miestnosti · „Osem kresiel. Jedno je tvoje.“ → Kreslo pri okne · „Sadni si a vydýchni.“ | – |
| 5 | `#remeslo` | `stol` / telefón **video** `okolo-kresla` (video‑3 5–9,3 s, skrol) → `naradie` | vľavo → vpravo | Remeslo · „Povedz, ako to chceš.“ → Ultra inclusive · „Dopraj si všetko.“ (40 €) | – |
| 6 | `#zadna` | `zadna` → `cakaren` | vľavo → vpravo | „Vzadu je iná nálada.“ → „Route 66 na Mostnej.“ | – |
| 7 | `#tim` | `sala-rano` / telefón **video** `tim-slucka` (video‑2 1–9 s, tichá slučka) + pás tímu | vľavo | Ľudia · „Komu zveríš hlavu?“ · Desať ľudí, jeden kalendár. | – |
| 8 | `#sluzby` | `kreslo-stred` + pás: bežiaci pás služieb, kroky strihu, cenník | stred | Služby a ceny · „Čo to bude dnes?“ · 18 € / 28 € | Objednať pri položkách |
| 9 | `#galeria` | `kava` + pás galérie → `sud` | vľavo → vpravo | „Pozri si to zblízka.“ → Cestou von · „Odchádzaš s hlavou hore.“ | – |
| 10 | `#rezervacia` + kontakt | `vstup` znova + pás kontaktu (tabuľa dnešných hodín, svetlo po okraji karty) | stred | Rezervácia · „Kedy *si sadneš?*“ · Online kedykoľvek, aj v noci. | Rezervovať termín, Zavolať, Navigovať |

Spodné tlačidlo na telefóne je kompaktné vpravo dole (telefón + Rezervovať termín), skryté v úvode, v páse
cenníka, v rezervácii a pri menu. Texty sú po porote dvoch hodnotiteľov; každý údaj má zdroj v
CONTENT_SOURCES.md alebo v pôvodnom index.html.

Pohyby: `in` nájazd, `right`/`left` prejazd po oblúku, `rise`/`down` zdvih/klesanie,
`near` len jemný nájazd (pre symetrické zábery s textovou doskou), `door` chôdza k dverám
(len prológ: dopredu o 34 % vzdialenosti, asi 1,5× priblíženie).

## Čo sa z webu odstraňuje

- 3D kreslo: `assets/chair.js`, `assets/model/`, `assets/vendor/GLTFLoader.js`,
  `BufferGeometryUtils.js`, `SkeletonUtils.js`, `meshopt_decoder.module.js`,
  `RoundedBoxGeometry.js`, `RoomEnvironment.js`, postery `poster-uvod-*`,
  `poster-rezervacia-*`, `source/chair-dev.html`, `source/tools/posters.mjs`,
  `source/glb-view.html`. (Zdrojové modely v `source/model/` ostávajú v histórii gitu,
  z webu sa nenasadzujú.)
- Text „3D symbol kresla“ a všetko, čo o kresle hovorí.

## Čo ostáva

`assets/style.css` (základ + sekcie), `assets/app.js` (scroll, data-at, menu, lightbox,
videá cez IntersectionObserver, mobilné CTA), obrázky `assets/img/*` pre galériu, tím a
pokojnú verziu, videá `assets/video/*`, texty a údaje (CONTENT_SOURCES.md).

## Mobil

Zábery sú na šírku (4096×2731); na telefóne film aj záloha ukážu vlastný výrez na výšku
(`<meno>-m`, 9 : 16 okolo bodu záujmu: dvere, pult, kreslo; pri detailoch užšie okno okolo
predmetu) s presahom 1,24, bod záujmu vo výreze je `data-fm`. Text je v dolnej polovici na doske, spodné tlačidlo „Rezervovať termín“
stále dostupné.

## Podmienky prijatia (doplnenie k zadaniu)

- Prvý obraz (fasáda pri prológu, inak rohožka) je silná kompozícia aj bez filmu; H1 a CTA
  čitateľné do 1 s. Prológ nikdy neblokuje: skrolovanie ho ukončí, stránka je od začiatku
  použiteľná, bez filmu sa jednoducho nekoná.
- Prechody medzi zábermi sú plynulé dopredu aj dozadu; skok cez menu pristane bez jazdy.
- Film sa nenačíta pred prvým čitateľným obrazom; three.js + prvý záber až po pohybe
  návštevníka (ako head spa).
- Pokojná verzia (bez WebGL / reduced motion) vyzerá rovnako, len bez pohybu kamery.
