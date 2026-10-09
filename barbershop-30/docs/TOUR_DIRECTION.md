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
- každý bod obrazu sa prelína vo vlastnom čase podľa hĺbky: ďaleký koniec novej miestnosti sa
  vynorí prvý, blízke veci odchádzajúceho záberu (kreslo, sud, pult) miznú posledné, akoby popri
  návštevníkovi prešli; každý bod sa prelína v okne 0,55 z celého prechodu (post shader,
  hĺbka ide v alfe textúry záberu);
- kamera odchádzajúceho záberu zrýchli dopredu (do štvrtiny vzdialenosti), prichádzajúca dobehne
  zozadu a usadí sa; hĺbka sa pri tom „otvorí“ (uAmt 0,42 → 0,52 a späť);
- uprostred krátke šero (82 % jasu) a o niečo užšia vinetácia, ako strih vo filme; nikdy tma,
  nikdy dvojexpozícia celého obrazu, nikdy rozmazanie;
- prechod má na obrazovke vždy rovnakú dĺžku (asi 55 % výšky okna skrolu, 16–30 % cesty medzi
  kotvami, okolo stredu) a v pokoji sa vždy dokončí na bližší záber;
- ten istý prechod má aj prológ (z fasády cez dvere dnu). Snímky: `source/tools/prechod-shot.mjs`
  (zastavený prechod cez `BS30_FILM.fadeFreeze`).

- Zábery (maximálny detail): `assets/img/film/<meno>-{1086,1448,2172,2896}.{avif,webp}`
  (fasáda `vstup` aj 4096 px pre nájazd k dverám) + `<meno>-hlbka.webp`; nič sa nezväčšuje nad
  originál (rohozka-2172 = 1920 px). Pre telefón má každý záber vlastný výrez na výšku 9 : 16
  okolo bodu záujmu `<meno>-m-{1086,1448}` + `<meno>-m-hlbka.webp` (rohožka z fotky majiteľa
  foto-30 na výšku), takže sa na displeji 3× nezväčšuje ako výsek zo záberu na šírku. AVIF q66,
  WebP q84. Zoznam, rozmery, stupne a bod záujmu výrezu v `assets/img/film/film.json`
  (skript `source/tools/film.py`, hĺbka `source/tools/hlbka.py` – Depth Anything V2 small, ONNX,
  lokálne); zálohy a kotvy v index.html z neho prepíše `source/tools/stills.py`.
- Film si vyberie najmenší stupeň, ktorý sa na obrazovke nezväčší (do 2896 px na počítači, záber
  prológu do 4096 px, telefón 1448 px výrezu); fotky majú mipmapy, trilineárne filtrovanie a
  anizotropiu 8; mriežka 256 × 192 (počítač), 112 × 200 (výrez na telefóne).
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
- Mobil: výrez na výšku najviac 1448 px (bod na bod aj pri 3×), presah 1,24, text dole nad spodným CTA.

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
4. Kým záber úvodu nie je načítaný, kamera pri dverách počká (najviac 4 s); ak film nepríde do 7 s
   od štartu, prológ sa vynechá a web beží ako bez neho.

Rozhranie: kotva úvodu `.film-shot[data-shot="rohozka"]` nesie `data-pro="vstup"`, `data-pro-f`,
`data-pro-fm`, `data-pro-mv="door"`, `data-pro-size="4096x2731"`, `data-pro-place`; o prológu
rozhodne skript v hlavičke (trieda `pro` na `<html>`, `?uvod=znova` ho pustí aj opakovane) a
statickú zálohu úvodu (fasáda pri prológu, inak rohožka) vloží skript v kotve z dvoch `<template>`.
Pokojná verzia (bez WebGL, obmedzený pohyb, šetrenie dát, druhá návšteva): rohožka hneď, bez prológu.
Kontrola: `node source/tools/uvod-shot.mjs` (snímky prológu na polohách 0 … 1, druhé načítanie,
`?film=off`).

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

## Cesta (poradie záberov = poradie sekcií)

| # | sekcia (id) | záber (`film.json`) | bod záujmu f | pohyb | text nad filmom | CTA |
|---|---|---|---|---|---|---|
| 0 | prológ (bez kotvy) | `vstup` – fasáda s dverami a barber pole (gallery/43) | [0.76, 0.53] dvere | `door` (chôdza k dverám) | to isté ako úvod (doska je HTML, nemení sa) | – |
| 1 | `#uvod` | `rohozka` – hneď za dverami: rohožka s logom, kreslo, sála (slider/3, 1920 px) | [0.5, 0.55], telefón [0.44, 0.58] | `rise` | eyebrow BARBERSHOP 30 · NITRA, H1 „Tvoj strih. Tvoje miesto.“, lead, 2 tlačidlá | Rezervovať termín, Zavolať na recepciu |
| 2 | `#recepcia` | `recepcia` – pult, lampy, barber pole (gallery/35) | [0.45, 0.55] pult | `right` | H2 „Príď ako k známym.“, 3 riadky: recepčná ťa privíta · káva a minerálka zdarma · 8 kresiel, minimálne čakanie | – |
| 3 | `#sala` | `sala` – rad kresiel, zrkadlá (gallery/38) → `kreslo` (gallery/28) | [0.5, 0.55] → [0.58, 0.55] | `left` → `in` | H2 „Osem kresiel. Jedno je tvoje.“ + chip „Hlavná sála“ | Pozri služby → |
| 4 | `#remeslo` | `stol` (gallery/40) + **video** `remeslo-strojcek` v portrétovom okne vedľa textu; detail `naradie` (gallery/39) | [0.5, 0.5] | `rise` | H2 „Presnosť, ktorú vidíš v detaile.“, odsek z opisov služieb (konzultácia, strojček aj nožnice, fade, horúci uterák, britva, styling, kolínska) | – |
| 5 | `#zadna` | `zadna` (gallery/31) → `cakaren` (gallery/36) | [0.5, 0.55] → [0.5, 0.55] | `right` → `in` | H2 „Druhá miestnosť, iná nálada.“ + chipy Zadná miestnosť · Čakáreň | – |
| 6 | `#tim` | `sala-rano` (gallery/33) ako pozadie, nad ním **portréty tímu** (10) + video `tim-v-akcii` | [0.5, 0.55] | `left` | H2 „Tím barberov a barberiek.“, karty s menom a rolou (len overené) | Rezervovať termín |
| 7 | `#sluzby` | `kreslo-stred` (gallery/34) – pokojný symetrický záber, nad ním doska s cenníkom | [0.5, 0.55] | `near` (len jemný nájazd) | H2 „Vyber si službu.“, cenník 15 služieb (názov, opis 1 veta, cena, trvanie, Objednať) + odkaz Booqme na farbenie | Objednať pri každej položke |
| 8 | `#galeria` | `kava` (gallery/41) → `sud` (gallery/30) | [0.5, 0.5] | `down` | H2 „Detaily, ktoré robia miesto.“, galéria 8 fotiek (lightbox): noznice, naradie, barber pole, neón, zrkadlo, buldog, káva, sud; dôvera: Google hodnotenie (odkaz), Instagram | – |
| 9 | `#rezervacia` + kontakt | `vstup` znova – kruh sa uzavrie pri dverách | [0.55, 0.5] | `in` (ustáli sa) | H2 „Tvoj termín je na jedno klepnutie.“, adresa, hodiny, telefón, Navigovať | Rezervovať termín, Zavolať, Navigovať |

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
(`<meno>-m`, 9 : 16 okolo bodu záujmu: dvere, pult, kreslo) s presahom 1,24, bod záujmu vo
výreze je `data-fm`. Text je v dolnej polovici na doske, spodné tlačidlo „Rezervovať termín“
stále dostupné.

## Podmienky prijatia (doplnenie k zadaniu)

- Prvý obraz (fasáda pri prológu, inak rohožka) je silná kompozícia aj bez filmu; H1 a CTA
  čitateľné do 1 s. Prológ nikdy neblokuje: skrolovanie ho ukončí, stránka je od začiatku
  použiteľná, bez filmu sa jednoducho nekoná.
- Prechody medzi zábermi sú plynulé dopredu aj dozadu; skok cez menu pristane bez jazdy.
- Film sa nenačíta pred prvým čitateľným obrazom; three.js + prvý záber až po pohybe
  návštevníka (ako head spa).
- Pokojná verzia (bez WebGL / reduced motion) vyzerá rovnako, len bez pohybu kamery.
