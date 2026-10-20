export const meta = {
  name: 'barbershop-filmovy-navrh',
  description: 'Návrh: rozbor referenčného videa, texty s hookom (porota), filmové rozloženie na telefón, skutočné videá vo filme, kritika',
  phases: [
    { title: 'Rozbor', detail: 'referenčné video snímku po snímke' },
    { title: 'Texty', detail: 'traja textári, dvaja porotcovia, syntéza' },
    { title: 'Rozloženie', detail: 'text na zábere bez boxov, telefón aj počítač, prototyp' },
    { title: 'Videá', detail: 'skutočné videá majiteľa ako zábery filmu' },
    { title: 'Kritika', detail: 'konflikty, riziká, čo chýba' },
  ],
}

// Príklad z praxe: návrhová fáza „ako na referenčnom videu“ pre BARBERSHOP 30
// (pôvodne workflow „barbershop-filmovy-navrh“).
// Vzor: rozbor referenčného videa beží popri troch textároch (sľub refP sa čaká až pred rozložením), dvaja
// porotcovia a syntéza textov, potom naraz rozloženie a videá (každý s prototypom v kópii webu v scratchpade,
// repozitár sa needituje) a na konci skeptický vedúci projektu hľadá konflikty a navrhne poradie implementácie.
// Kedy sa osvedčil: barbershop-30/docs/CHECKS.md časť 10 (rozbor po snímkach, texty po porote, titulné karty, videá).
// Spustenie: nástroj Workflow so scriptPath na tento súbor a args { site, scratch, ref }: cesta k webu, pracovný
// priečinok (so snímkami súčasného stavu teraz-mobil-vsetko.jpg a teraz-m/), priečinok referencie (video.mp4,
// kontakt.jpg, kluc.jpg).
// Oproti originálu pribudol len tento komentár.

const A = args
const CTX = `
KONTEXT (čítaj pozorne, rozhovor s majiteľom nevidíš):
- Web: ${A.site} – statický web podniku BARBERSHOP 30 (pánske holičstvo, Mostná 30, Nitra). Je to samostatný web v podpriečinku repozitára head-spa-30; pravidlá o názvoch z koreňového CLAUDE.md (HEAD SPA 30) sa týkajú iného webu, NIE tohto. Platí ale: po slovensky, tykanie, žiadna zmienka o AI, nástrojoch ani 3D modeli na webe.
- Vlastné pravidlá tohto webu: ${A.site}/docs/MASTER_BRIEF.md (bez marketingových fráz, bez superlatívov, nič nevymýšľať), ${A.site}/docs/ART_DIRECTION.md, ${A.site}/docs/TOUR_DIRECTION.md (ako funguje film), ${A.site}/docs/CONTENT_SOURCES.md (overené údaje: služby, ceny, kontakt, hodiny). Písma len Fraunces (500, 500 kurzíva, 800) a Manrope (400, 600, 700) z assets/fonts. Cieľ Lighthouse: mobil 95+, desktop 100.
- Pozadie webu je „film“ (assets/film.js, WebGL): skutočné fotky podniku s hĺbkovou mapou, kamera ide skrolovaním z ulice cez dvere dnu a ďalej cez miestnosti; zábery sa prelínajú. Na telefóne má každý záber vlastný výrez na výšku. Nad filmom sú sekcie (section.scene) s doskami .board (tmavé boxy s textom). Úvod: prológ z fasády cez dvere na rohožku.
- Majiteľ (po tretí raz) chce: „aby vojdenie do nášho barbershopu bolo také plynulé ako na videu, aby to na telefóne vyzeralo tak dobre ako na videu; si senior, ktorý to graficky spracuje a potom vylepší stránku aj efektnými textami, elegantnými, aby k nám zákazník chcel prísť, aby tam stále bol silný hook“.
- Referenčné video (TikTok antenucci.studio, „Dapper Dave's“ barber web, 10,5 s, 576×1024): ${A.ref}/video.mp4; kontaktné snímky ${A.ref}/kontakt.jpg (6 snímok/s) a kľúčové snímky ${A.ref}/kluc.jpg. Je to nahrávka skrolovania webu: hero DAPPER DAVE'S (nočné mesto, skript „Barber Lounge“, veta „Where the city comes to get sharp.“, tlačidlo BOOK YOUR CHAIR) → STEP INSIDE (kamera ide popri výklade s barber pole) → WHERE KINGS SIT (kreslá) → EVERY LINE INTENTIONAL (sála, potom detail strihu) → WALK OUT SHARPER (zlatý opar) → MORE THAN A CUT (barber s klientom) → TAKE YOUR THRONE (neón, tlačidlá BOOK NOW a CALL) → SERVICES & PRICING → PULL UP (adresa, hodiny, mapa). Každá scéna: záber cez celé okno so skutočným pohybom kamery, krátky nadpis veľkými písmenami priamo na zábere (bez boxu), malý nadpisok nad ním, 1 až 2 riadky textu, niekde tlačidlo.
- Súčasný stav na telefóne (390×844): ${A.scratch}/teraz-mobil-vsetko.jpg (všetky scény), jednotlivo ${A.scratch}/teraz-m/scena-*-mobile.png. Takmer každá scéna je tmavý box s drobným textom cez polovicu fotky a stále oranžové tlačidlo dole.
- Skutočné videá majiteľa (na výšku 576×1024, 30 snímok/s): ${A.site}/source/video/video-1.mp4 (9 s, barberi pri stylingu, kamera z ruky), video-2.mp4 (12,8 s, plná hlavná sála s oranžovými lampami, traja barberi pri práci, mierny pohyb), video-3.mp4 (13,3 s, kamera pomaly ide okolo barbera pri strihu, lampy, drevená podlaha). Na webe sú už ako malé tiché slučky (assets/video/remeslo-strojcek-576.*, tim-v-akcii-576.*, remeslo-styling-576.*), pozri docs/MEDIA_SELECTION.md. Klienti sú zozadu, barberi zamestnanci (súhlas má potvrdiť majiteľ).
- Nástroje: node 22, Playwright cez createRequire z ${A.site}/source/shot.mjs (exportuje startStaticServer(root) a PRESETS; chromium.launch(PRESETS[0])), python3 s PIL a numpy, ffmpeg/ffprobe. Snímky ukladaj do svojho priečinka v ${A.scratch}.
- NIKDY needituj súbory v /home/user/head-spa-30 (toto je návrhová fáza). Ak chceš prototyp, skopíruj index.html a assets/{style.css,app.js,film.js,fonts.css,favicon.svg} do vlastného priečinka v ${A.scratch}, ostatné (assets/img, assets/video, assets/fonts, assets/vendor) tam len nalinkuj (ln -s), a uprav kópiu.
`

phase('Rozbor')
const refP = agent(`${CTX}
ÚLOHA: Rozober referenčné video do čísel, aby sa dalo verne napodobniť na telefóne aj na počítači.
1. ffmpeg-om vytiahni snímky 30/s okolo každého prechodu medzi scénami (asi 1,5–1,9 s; 2,6–2,9; 3,5–3,8; 4,4–4,9; 6,1–6,4; 7,0–7,3; 7,9–8,6 s) a pozri si ich. Urči typ prechodu (prelínanie, strih, posun), jeho dĺžku v snímkach, či sa text prelína spolu so záberom alebo samostatne, či sa text pohybuje (vysúva, mierka), a ako sa hýbe kamera v zábere (smer, rýchlosť ako % šírky za sekundu, nájazd).
2. Typografia: zmeraj na snímkach výšku verzálok nadpisu voči výške okna webu (rám webu je približne y 290–630 z 1024 na snímke), počet slov a riadkov, zarovnanie a polohu (vľavo/vpravo/stred, ktorá tretina), nadpisok a text pod ním (veľkosť voči nadpisu, počet riadkov), tlačidlá, či je pod textom stmavenie (gradient) a kde.
3. Rytmus: koľko scén, ako dlho trvá každá v nahrávke, ako je to na webe namapované na skrolovanie (jedna obrazovka na scénu?).
4. Čo konkrétne robí dojem „plynulé ako video“ a „prémiové“: vymenuj 6–10 konkrétnych, merateľných vlastností.
5. Porovnaj so súčasným stavom nášho webu na telefóne (${A.scratch}/teraz-mobil-vsetko.jpg) a napíš presne, čo sa líši.
Výstup: markdown (po slovensky), čísla a konkrétne hodnoty, žiadne všeobecné rady. Ulož aj snímky, ktoré si použil, do ${A.scratch}/rozbor/ a uveď cesty.`, { label: 'rozbor-videa', phase: 'Rozbor' })

const DECK = {
  type: 'object',
  properties: {
    angle: { type: 'string' },
    scenes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'uvod | vstup-dnu | recepcia | sala | kreslo | remeslo | naradie | zadna | cakaren | tim | sluzby | galeria | sud | rezervacia' },
          kicker: { type: 'string', description: 'nadpisok nad nadpisom, 1 až 4 slová' },
          headline: { type: 'string', description: '2 až 5 slov, najviac 32 znakov, môže mať 2 riadky oddelené |' },
          accent: { type: 'string', description: 'slovo alebo dve z nadpisu, ktoré budú vo farbe lampy alebo kurzívou; prázdne ak nič' },
          sub: { type: 'string', description: 'najviac 1 až 2 krátke vety, spolu najviac 90 znakov' },
          cta: { type: 'string', description: 'text tlačidla alebo odkazu, ak scéna nejaké má; inak prázdne' },
          facts: { type: 'array', items: { type: 'string' }, description: 'každý faktický údaj v texte a odkiaľ je (súbor a čo tam stojí)' },
        },
        required: ['id', 'kicker', 'headline', 'accent', 'sub', 'cta', 'facts'],
      },
    },
    hero_tagline: { type: 'string', description: 'veta pod názvom v úvode, ako „Where the city comes to get sharp.“' },
    sticky_cta: { type: 'string', description: 'text stáleho tlačidla na telefóne' },
    story: { type: 'string', description: 'ako texty za sebou rozprávajú príbeh návštevy, 2 až 4 vety' },
  },
  required: ['angle', 'scenes', 'hero_tagline', 'sticky_cta', 'story'],
}
const ANGLES = [
  { key: 'zdrzanlivy', a: 'zdržanlivá elegancia: pokojné, isté vety, ako dobrý pánsky krajčír; žiadny krik, sila v jednoduchosti a v konkrétnom detaile (lampa, kreslo, horúci uterák, britva)' },
  { key: 'hook', a: 'silný hook: krátke rozkazovacie a druhoosobové vety, ktoré ťahajú ďalej („Vojdi.“, „Sadni si.“), rytmus ako filmový trailer, každá scéna končí tak, aby chcel skrolovať ďalej; stále bez superlatívov a bez výmyslov' },
  { key: 'nitra', a: 'miestny a ľudský: Mostná 30 v Nitre, ľudia, ktorí ťa poznajú, pocit, že ideš k svojim; vrelé, ale nie sladké, s konkrétnymi detailmi z podniku' },
]
const SCENES = `Scény v poradí (id – čo je na zábere – čo je tam dnes):
uvod – fasáda s nápisom BARBERSHOP, dvere, potom rohožka s logom za dverami – H1 „Tvoj strih. Tvoje miesto.“, tlačidlá rezervácia a zavolať
vstup-dnu – NOVÁ krátka scéna hneď po úvode, ako „STEP INSIDE“: kamera ide dnu do sály (skutočné video majiteľa alebo fotky)
recepcia – recepcia s orchideou a predná sála – „Príď ako k známym.“ + 3 odrážky (pri vstupe ťa privíta recepčná, káva a minerálka sú zdarma, osem kresiel minimálne čakanie)
sala – hlavná sála s kreslami, kruhové svetlá – „Osem kresiel. Jedno je tvoje.“
kreslo – barberské kreslo pri okne (druhý záber sály, dnes len popis miesta)
remeslo – pracovné miesto, nástroje; video barbera pri práci – „Presnosť, ktorú vidíš v detaile.“ + odsek o postupe strihu
naradie – detail karafa, pomády, štetka (dnes len popis miesta)
zadna – zadná miestnosť, čierne obklady, červené kreslo – „Druhá miestnosť, iná nálada.“
cakaren – kútik s pumpou Route 66 (dnes len popis miesta)
tim – sála v rannom svetle, portréty barberov – „Tím barberov a barberiek.“ (desať ľudí, spoločná rezervácia)
sluzby – kreslo uprostred sály; cenník – „Vyber si službu.“
galeria – káva pre hostí; galéria fotiek – „Detaily, ktoré robia miesto.“
sud – predná sála so sudom a uterákmi (dnes len popis miesta)
rezervacia – fasáda z ulice; kontakt – „Tvoj termín je na jedno klepnutie.“ (ako „TAKE YOUR THRONE“ + BOOK NOW + CALL)`

phase('Texty')
const decks = await parallel(ANGLES.map((g) => () => agent(`${CTX}
ÚLOHA: Si skúsený slovenský textár pre prémiové pánske holičstvo. Napíš kompletnú sadu textov pre filmové scény webu podľa referenčného videa (STEP INSIDE, WHERE KINGS SIT, EVERY LINE INTENTIONAL, WALK OUT SHARPER, MORE THAN A CUT, TAKE YOUR THRONE), ale po slovensky, pre náš podnik a naše zábery. NEPREKLADAJ referenciu doslova, napíš vlastné.
Uhol pohľadu: ${g.a}.
${SCENES}
Pravidlá (porušenie = vyradenie): tykanie; žiadne superlatívy (najlepší, číslo jedna, top, jedinečný, dokonalý...); žiadne marketingové frázy (kvalitné služby, profesionálny prístup, ponúkame...); žiadny vymyslený údaj (počty, roky, ceny, služby, mená, ocenenia, recenzie) – každý údaj musí byť v ${A.site}/index.html alebo ${A.site}/docs/CONTENT_SOURCES.md a uveď ho vo facts; žiadne em dash (—); nadpis 2 až 5 slov; nadpisok 1 až 4 slová; sub najviac 90 znakov; nič o AI. Texty musia byť elegantné, nie lacné, a stále ťahať ďalej (hook). Najprv si prečítaj index.html (všetky dosky) a CONTENT_SOURCES.md.
Vráť sadu pre všetkých 14 scén (všetky id).`, { label: `textar-${g.key}`, phase: 'Texty', schema: DECK })))
const okDecks = decks.filter(Boolean)
log(`textári hotoví: ${okDecks.length} z ${ANGLES.length}`)

const SCORE = {
  type: 'object',
  properties: {
    violations: { type: 'array', items: { type: 'object', properties: { deck: { type: 'string' }, id: { type: 'string' }, text: { type: 'string' }, why: { type: 'string' } }, required: ['deck', 'id', 'text', 'why'] } },
    best: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, deck: { type: 'string' }, why: { type: 'string' }, fix: { type: 'string' } }, required: ['id', 'deck', 'why', 'fix'] } },
    deck_scores: { type: 'array', items: { type: 'object', properties: { deck: { type: 'string' }, score: { type: 'number' }, note: { type: 'string' } }, required: ['deck', 'score', 'note'] } },
  },
  required: ['violations', 'best', 'deck_scores'],
}
const deckText = JSON.stringify(okDecks, null, 1)
const JUDGES = [
  { key: 'pravidla', l: 'prísny kontrolór pravidiel a faktov: over každý faktický údaj proti index.html a docs/CONTENT_SOURCES.md (otvor ich), hľadaj superlatívy, marketingové frázy, vykanie, em dash, dĺžky, gramatiku a diakritiku, nezmysly v slovenčine' },
  { key: 'zakaznik', l: 'zákazník z Nitry, 25 až 45 rokov, ktorý si vyberá holičstvo na telefóne: ktoré texty ťa chytia, pôsobia elegantne a prémiovo a chceš kvôli nim prísť; ktoré pôsobia lacno, prázdne alebo preložene; či scény za sebou tvoria príbeh a hook drží až po rezerváciu' },
]
phase('Texty')
const scores = await parallel(JUDGES.map((j) => () => agent(`${CTX}
ÚLOHA: Si porotca textov webu. Pohľad: ${j.l}.
Sady textov od troch textárov (JSON): ${deckText}
Pre každú scénu vyber najlepší text (z ktorej sady) a navrhni konkrétnu úpravu, ak treba. Vypíš všetky porušenia pravidiel. Ohodnoť každú sadu 0 až 10.`, { label: `porotca-${j.key}`, phase: 'Texty', schema: SCORE })))

const finalDeck = await agent(`${CTX}
ÚLOHA: Zostav finálnu sadu textov filmových scén z troch návrhov a hodnotení dvoch porotcov. Zober najlepšie vety, oprav všetky porušenia, zjednoť tón (elegantný, istý, s hookom, tykanie) a skontroluj, že scény za sebou rozprávajú príbeh návštevy: ulica, dvere, dnu, kreslo, remeslo, výsledok, ľudia, služby, rezervácia. Každý údaj over v ${A.site}/index.html alebo ${A.site}/docs/CONTENT_SOURCES.md.
Návrhy: ${deckText}
Hodnotenia: ${JSON.stringify(scores.filter(Boolean), null, 1)}`, { label: 'texty-synteza', phase: 'Texty', schema: DECK })

const refText = await refP

phase('Rozloženie')
const layoutP = agent(`${CTX}
ROZBOR REFERENCIE (od kolegu): ${refText}
ÚLOHA: Navrhni a prototypuj filmové rozloženie scén ako v referencii: nadpis priamo na zábere cez celé okno, bez tmavých boxov, s jemným stmavením len tam, kde je text, krátky nadpisok a 1 až 2 riadky, na telefóne aj na počítači. Telefón má prednosť (390×844, aj 430×932 a 360×780).
1. Prečítaj index.html (štruktúra section.scene, .film-shot kotvy so sticky .film-still zálohou, .board dosky) a assets/style.css (vrstvy, premenné, mobil pravidlá ≤720 px, choreografia H1 .w, filmové pásy). Zisti, čo všetko je na dnešných doskách (zoznamy, video v okienku, chipy, cenník, galéria, kontakt).
2. Navrhni, ako zmeniť markup a CSS tak, aby každá scéna (aj druhé kotvy kreslo, naradie, cakaren, sud a nová scéna vstup-dnu) začínala „titulnou kartou“ ako vo videu (veľký nadpis Fraunces 800 na zábere), a kam dať podrobnejší obsah (cenník, tím, galéria, kontakt majú ostať ako čitateľné dosky; krátke scény môžu boxy stratiť úplne). Zachovaj prístupnosť (h1/h2 poradie, kontrast textu na fotke aspoň 4,5 : 1 pre malý text a 3 : 1 pre veľký, merané na skutočných záberoch), CLS 0, žiadny backdrop-filter na telefóne, filmové pásy úvodu, spodné tlačidlo „Rezervovať termín“ na telefóne (môže byť elegantnejšie, nie stále oranžová plocha cez celú šírku?).
3. Postav prototyp v kópii webu v ${A.scratch}/proto-rozlozenie/ (pozri KONTEXT, ako kopírovať) s pracovnými textami (finálne texty dodá textár; použi napr. „Vojdi dnu.“, „Sadni si.“ ako zástupné) a odfoť telefón 390×844 (deviceScaleFactor 2) aspoň pre úvod, vstup-dnu, recepciu, sálu, kreslo, remeslo, tím, služby a rezerváciu (skrol na kotvu, počkaj na window.__scrollSettled a ešte 1,5 s; pozri ${A.site}/source/tools/scenes-shot.mjs, ako sa skroluje na kotvy) a počítač 1440×900 pre 3 scény. Porovnaj so snímkami referencie a iteruj, kým to nevyzerá ako referencia.
Výstup: markdown po slovensky: (a) presný návrh zmien markupu (príklad HTML jednej titulnej karty a zoznam scén, kde čo bude), (b) hotové CSS (celé nové pravidlá, s premennými webu), (c) čo sa mení v app.js alebo film.js, ak niečo, (d) zmerané kontrasty, (e) cesty k snímkam prototypu, (f) riziká. Diff tvojej kópie voči originálu ulož do ${A.scratch}/proto-rozlozenie/zmeny.diff.`, { label: 'rozlozenie', phase: 'Rozloženie' })

phase('Videá')
const videoP = agent(`${CTX}
ROZBOR REFERENCIE (od kolegu): ${refText}
ÚLOHA: Navrhni a over, ako zapojiť skutočné videá majiteľa do filmu tak, aby vojdenie do podniku a ďalšie scény mali skutočný pohyb kamery ako v referencii, hlavne na telefóne.
1. Prečítaj celé assets/film.js (zábery SHOTS z kotiev .film-shot, load/upload po pásoch, draw s prelínaním dvoch render targetov, post shader s hĺbkou v alfe, prológ pro/proS, keepAround, kvalita dpr, telefón vs. počítač) a docs/TOUR_DIRECTION.md.
2. Pozri si videá (ffmpeg snímky) a navrhni, ktoré videá a ktoré úseky (sekundy) dať do ktorých scén: nová scéna „vstup-dnu“ hneď po prológu (kamera ide dnu do sály), remeslo (barber pri práci), tím (plná sála). Zváž aj obrátené prehratie, spomalenie, stabilizáciu (ffmpeg deshake/vidstab, ak je), farebné zjednotenie s fotkami (fotky sa netónujú, len vinetácia), orezanie.
3. Navrhni techniku: THREE.VideoTexture ako záber filmu (bez hĺbkovej mapy alebo s plochou hĺbkou, prelínanie s fotkami tým istým post shaderom), alebo HTML video vrstva; prehrávanie automaticky (muted, playsinline, loop) vs. riadené skrolovaním (seek; vtedy kódovanie s kľúčovou snímkou každú snímku, -g 1); správanie na iPhone (Low Power Mode blokuje autoplay, play() odmietne: čo sa ukáže), pamäť, nahrávanie textúry každú snímku na telefóne, Lighthouse (lazy načítanie až blízko scény, veľkosť súborov), počítač (video na výšku na širokom okne: kde a ako, alebo len na telefóne).
4. Over v praxi: urob malý test v kópii webu v ${A.scratch}/proto-video/ (pozri KONTEXT), zakóduj vybraný úsek (mp4 h264 + webm, 576×1024 alebo menej), zapoj ho do kópie film.js ako záber a odfoť telefón 390×844 v polovici prechodu fotka → video a vo videu; zmeraj veľkosti súborov a či sa prehráva v headless Chromiu (poznámka: headless kreslí softvérovo, časy nie sú ako na telefóne).
Výstup: markdown po slovensky: výber úsekov a dôvod, ffmpeg príkazy, presný návrh zmien film.js (funkcie, nové atribúty kotvy, napr. data-video, data-video-poster) s ukážkami kódu, správanie pri zlyhaní a na počítači, veľkosti súborov, cesty k snímkam, riziká. Diff kópie ulož do ${A.scratch}/proto-video/zmeny.diff.`, { label: 'videa-vo-filme', phase: 'Videá' })

const [layout, video] = await Promise.all([layoutP, videoP])

phase('Kritika')
const critic = await agent(`${CTX}
ÚLOHA: Si skeptický vedúci projektu. Dostaneš štyri výstupy návrhovej fázy. Nájdi konflikty medzi nimi (napr. rozloženie počíta s inými scénami než videá alebo texty), porušenia pravidiel webu, riziká pre výkon (Lighthouse mobil 95+), prístupnosť, iPhone Safari, a čo chýba, aby majiteľ povedal „toto je ako na videu“. Over tvrdenia, ktoré sa dajú overiť (otvor súbory, snímky). Navrhni presné poradie implementácie po krokoch s testami.
ROZBOR: ${refText}
TEXTY: ${JSON.stringify(finalDeck)}
ROZLOŽENIE: ${layout}
VIDEÁ: ${video}
Výstup: markdown po slovensky, konkrétne.`, { label: 'kritik', phase: 'Kritika' })

return { refText, finalDeck, scores, layout, video, critic }