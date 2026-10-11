export const meta = {
  name: 'barbershop-prechody-strih',
  description: 'Rôzne filmové strihy pre jednotlivé prechody: traja strihači s prototypmi, dvaja porotcovia, syntéza do jedného riešenia',
  phases: [
    { title: 'Strihači', detail: 'tri slovníky strihov, prototyp v kópii filmu, snímky priebehu' },
    { title: 'Porota', detail: 'strihač z filmu a kontrolór vkusu a výkonu' },
    { title: 'Syntéza', detail: 'jedna mapa strihov, hotový shader, overené snímky' },
  ],
}

// Príklad z praxe: porota návrhov s prototypmi, rôzne filmové strihy pre prechody filmu BARBERSHOP 30
// (pôvodne workflow „barbershop-prechody-strih“).
// Vzor: traja strihači (kamera, svetlo, tvar) naraz; každý upraví vlastnú kópiu film.js v scratchpade,
// odfotí pás priebehu strihu a uloží diff. Dvaja porotcovia (strihač filmu, technický kontrolór), syntéza
// do jedného post shaderu.
// Kedy sa osvedčil: barbershop-30/docs/CHECKS.md časť 10. Porota a syntéza nedobehli (limit relácie), zvolený
// bol slovník strihača „kamera“. Zadanie káže strihačom uložiť diff a snímky do súborov, takže ich práca
// ostala k dispozícii aj bez syntézy.
// Spustenie: nástroj Workflow so scriptPath na tento súbor a args { site, scratch }.
// Oproti originálu pribudol len tento komentár.
const A = args
const CTX = `
KONTEXT (rozhovor s majiteľom nevidíš):
- Web: ${A.site} – statický web podniku BARBERSHOP 30 (pánske holičstvo, Mostná 30, Nitra), samostatný web v podpriečinku repozitára head-spa-30. Pravidlá o názvoch z koreňového CLAUDE.md (HEAD SPA 30) sa týkajú iného webu; platí: po slovensky, žiadna zmienka o AI ani nástrojoch na webe, komentáre v kóde po slovensky.
- Pozadie webu je „film“ ${A.site}/assets/film.js (three.js WebGL2): skutočné fotky podniku s hĺbkovou mapou na mriežke, kamera ide skrolovaním z ulice cez dvere dnu a cez miestnosti. Prechod medzi dvoma zábermi: oba sa kreslia do render targetov rtA a rtB (v alfe je hĺbka bodu, 1 = blízko), post shader ich zloží (dnes jeden rovnaký prechod: každý bod sa prelína podľa bližšej hĺbky, krátke šero, vinetácia), k tomu nájazd kamery odchádzajúceho záberu (push). Prechod je riadený SKROLOVANÍM (uMix 0..1 ide tam aj späť podľa polohy), nie časom; v prológu (úvod z ulice cez dvere) ho vedie čas. Telefón (≤720 px) má vlastné výrezy na výšku a slabšie efekty. Ladiace háčiky: window.BS30_FILM (state, goTo, fadeFreeze, proFreeze); nástroj snímok zastaveného prechodu ${A.site}/source/tools/prechod-shot.mjs; dokumentácia ${A.site}/docs/TOUR_DIRECTION.md (sekcia Technika a Cesta).
- Poradie záberov (cesta): vstup (fasáda, len prológ) → rohozka (úvod za dverami) → recepcia → sala → kreslo → stol (remeslo) → naradie (detail karafa) → zadna (čierne obklady, červené kreslo) → cakaren (pumpa Route 66) → sala-rano → kreslo-stred (cenník, dlhá sekcia) → kava (galéria, pohľad zhora) → sud → vstup (rezervácia, fasáda z ulice). Fotky si pozri v ${A.site}/assets/img/film/ (meno-1086.webp, telefón meno-m-1086.webp, hĺbka meno-hlbka.webp).
- Súbežne kolegovia navrhujú nové texty scén, filmové rozloženie a zapojenie skutočných videí majiteľa ako záberov (THREE.VideoTexture, bez hĺbkovej mapy, hĺbka plochá). Tvoj strih musí fungovať aj pre záber bez hĺbky (alfa 0).
- Majiteľ chce: „Tie prechody zlepši, pridaj tam rôzne edity, aby to bolo krajšie, tie jednotlivé prechody“ (predtým: viac filmové, prepracované, dbať na ostrosť, nejaký efekt pri prechode; referencia: filmový barber web, scény sa prelínajú so skutočným pohybom kamery). Teda: každý prechod medzi miestnosťami vlastný premyslený strih ako od strihača filmu, pritom jeden vkus a jedna farebnosť (fotky sa netónujú). Nič lacné (žiadne trblietky, hviezdičky, glitch, dúhové efekty, hrubé záblesky do bielej), obraz mimo prechodu ostáva ostrý.
- Výkon: telefón (iPhone, dpr 2) musí kresliť 60 snímok/s aj počas prechodu; dovolený rozpočet post shaderu najviac asi 16 vzoriek textúry na pixel navyše; žiadne nové render targety s plným rozlíšením navyše, ak sa dá. Lighthouse mobil 95+.
- Nástroje: node 22, Playwright cez createRequire z ${A.site}/source/shot.mjs (startStaticServer(root), PRESETS; chromium.launch(PRESETS[0])), python3 s PIL a numpy, ffmpeg.
- NIKDY needituj súbory v /home/user/head-spa-30. Prototyp rob v kópii: skopíruj index.html a assets/{style.css,app.js,film.js,fonts.css,favicon.svg} do vlastného priečinka v ${A.scratch}, ostatné (assets/img, assets/video, assets/fonts, assets/vendor, source) tam nalinkuj (ln -s), a uprav kópiu film.js.
`
const EDIT = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    vocabulary: { type: 'array', items: { type: 'object', properties: { kind: { type: 'string' }, what: { type: 'string', description: 'čo divák vidí, ako vo filme' }, glsl: { type: 'string', description: 'presný GLSL kód vetvy v post shaderi (alebo zmena place/push), s uniformami' }, cost: { type: 'string', description: 'vzorky textúry na pixel navyše' } }, required: ['kind', 'what', 'glsl', 'cost'] } },
    map: { type: 'array', items: { type: 'object', properties: { from: { type: 'string' }, to: { type: 'string' }, kind: { type: 'string' }, params: { type: 'string' }, why: { type: 'string' } }, required: ['from', 'to', 'kind', 'params', 'why'] } },
    integration: { type: 'string', description: 'ako to zapojiť do film.js: nové uniformy, atribút kotvy (napr. data-cut), telefón vs. počítač, smer skrolu späť, prológ' },
    shots: { type: 'array', items: { type: 'string' }, description: 'cesty k pásom snímok priebehu (mix 0, 0.2, 0.35, 0.5, 0.65, 0.8, 1) pre každý strih, telefón 390×844 aj počítač 1440×900' },
    diff: { type: 'string', description: 'cesta k diffu kópie film.js voči originálu' },
    risks: { type: 'string' },
  },
  required: ['name', 'vocabulary', 'map', 'integration', 'shots', 'diff', 'risks'],
}
const ED = [
  { key: 'kamera', a: 'strihy pohybom kamery: švih (whip pan) so smerovým rozmazaním v smere pohybu, nájazd cez predmet (push-through) so zoom rozmazaním okolo bodu záujmu, pokračovanie pohybu (match move: prichádzajúci záber prevezme smer a rýchlosť odchádzajúceho), prechod popri stene/stĺpe (popredie z hĺbkovej mapy zakryje obraz ako keby kamera prešla za ním)' },
  { key: 'svetlo', a: 'strihy svetlom a filmom: teplé presvetlenie od lámp podniku (light leak z miesta najjasnejších bodov, farba lampy, nie biela), krátke preexponovanie a návrat expozície ako pri otvorení clony, zrno a jemná anamorfná šmuha cez svetlá počas prechodu, prechod tmou dverí (dip do farby tmy podniku s hĺbkou), všetko zdržanlivé a teplé' },
  { key: 'tvar', a: 'grafické a tvarové strihy: match cut na tvar (okrúhle lampy a kruhové svetlá ↔ okrúhle zrkadlá, rám dverí ↔ rám zrkadla), clona (iris) z bodu záujmu, stierka po hrane v zábere (svetlo okna, hrana steny) s mäkkým okrajom, hĺbková stierka (najprv ďaleko, potom blízko alebo naopak) so smerom podľa pohybu, rozdelenie obrazu po hĺbke' },
]
phase('Strihači')
const edits = await parallel(ED.map((e) => () => agent(`${CTX}
ÚLOHA: Si strihač filmu a technický grafik (GLSL). Navrhni slovník 4 až 6 strihov a priraď každému prechodu v ceste jeden strih tak, aby susedné prechody neboli rovnaké a strih súvisel s tým, čo je na oboch záberoch (smer pohybu kamery data-mv, tvary, svetlá, hĺbka). Tvoj smer: ${e.a}.
1. Prečítaj film.js (post shader, draw(), place(), push, MOVES, AMT, telefón) a TOUR_DIRECTION.md. Pozri si zábery.
2. Implementuj strihy v kópii film.js (jeden post shader s vetvami podľa uniformy uKind, parametre ako uniformy, napr. smer a bod záujmu v obrazovke; strih vyberie atribút kotvy alebo tabuľka v kóde). Strih musí byť plynulý tam aj späť pri skrolovaní, v mix 0 a 1 presne pôvodný obraz, ostrý mimo prechodu.
3. Pre každý strih odfoť pás priebehu (mix 0, 0.2, 0.35, 0.5, 0.65, 0.8, 1) na telefóne 390×844 (deviceScaleFactor 2) aj počítači 1440×900 (napr. cez BS30_FILM.goTo a fadeFreeze, pozri prechod-shot.mjs) a spoj do jedného obrázka na strih. Pozri si ich a iteruj, kým to nevyzerá ako od profesionála.
4. Zmeraj aspoň odhadom cenu (vzorky na pixel) a over, že bez chýb konzoly.
Ulož všetko do ${A.scratch}/strih-${e.key}/ (diff kópie film.js voči originálu do zmeny.diff).`, { label: `strihac-${e.key}`, phase: 'Strihači', schema: EDIT })))
const ok = edits.filter(Boolean)
log(`strihači hotoví: ${ok.length} z ${ED.length}`)

const VERDICT = {
  type: 'object',
  properties: {
    ranking: { type: 'array', items: { type: 'object', properties: { editor: { type: 'string' }, kind: { type: 'string' }, score: { type: 'number' }, note: { type: 'string' } }, required: ['editor', 'kind', 'score', 'note'] } },
    best_map: { type: 'array', items: { type: 'object', properties: { from: { type: 'string' }, to: { type: 'string' }, editor: { type: 'string' }, kind: { type: 'string' }, why: { type: 'string' } }, required: ['from', 'to', 'editor', 'kind', 'why'] } },
    reject: { type: 'array', items: { type: 'object', properties: { editor: { type: 'string' }, kind: { type: 'string' }, why: { type: 'string' } }, required: ['editor', 'kind', 'why'] } },
  },
  required: ['ranking', 'best_map', 'reject'],
}
const J = [
  { key: 'film', l: 'skúsený strihač reklám a filmov: pozri si pásy snímok (otvor obrázky), posúď, ktoré strihy pôsobia ako od profesionála, ktoré lacno alebo rušivo, či majú rytmus a súvis so zábermi, či celok drží jeden vkus' },
  { key: 'vykon', l: 'technický kontrolór: over v kóde (diffy) cenu shaderu na telefóne, správanie tam a späť pri skrolovaní, mix 0 a 1 presne pôvodný obraz, záber bez hĺbky (video, alfa 0), prológ, prístupnosť (prefers-reduced-motion = jednoduché prelínanie), chyby; odfoť si sám aspoň dva strihy, ak treba' },
]
phase('Porota')
const verdicts = await parallel(J.map((j) => () => agent(`${CTX}
ÚLOHA: Si porotca strihov. Pohľad: ${j.l}.
Návrhy troch strihačov (JSON, s cestami k snímkam a diffom): ${JSON.stringify(ok, null, 1)}
Ohodnoť každý strih 0 až 10, vyber pre každý prechod v ceste najlepší strih (od ktorého strihača) a vypíš, čo zamietnuť a prečo.`, { label: `porotca-${j.key}`, phase: 'Porota', schema: VERDICT })))

phase('Syntéza')
const synth = await agent(`${CTX}
ÚLOHA: Zostav jedno finálne riešenie strihov z troch návrhov a dvoch hodnotení. Vezmi najlepšie strihy (najviac 6 druhov), zjednoť ich do jedného post shaderu s vetvami podľa uKind v čistej kópii aktuálneho film.js v ${A.scratch}/strih-final/ (pozri KONTEXT, ako kopírovať), vyber strih pre každý prechod v ceste (aj prológ dvere: ulica → rohožka, a späť na ulicu), telefón slabšie, prefers-reduced-motion jednoduché prelínanie. Zachovaj všetko ostatné vo film.js (prológ, návrat na ulicu, kvalitu, výrezy telefónu). Návrh: strih nech určuje atribút kotvy prichádzajúceho záberu data-cut (s rozumným predvoleným strihom, keď chýba), aby sa dal ľahko meniť.
Odfoť každý prechod cesty (mix 0, 0.25, 0.5, 0.75, 1) na telefóne 390×844 aj počítači 1440×900 do ${A.scratch}/strih-final/snimky/ a spoj do kontaktného obrázka ${A.scratch}/strih-final/prehlad-telefon.jpg a prehlad-pocitac.jpg. Over bez chýb konzoly a že mix 0 a 1 sú pôvodné zábery.
Návrhy: ${JSON.stringify(ok, null, 1)}
Hodnotenia: ${JSON.stringify(verdicts.filter(Boolean), null, 1)}
Výstup: markdown po slovensky: mapa strihov (tabuľka prechod → strih → prečo), zoznam zmien vo film.js, cena na pixel, cesta k diffu ${A.scratch}/strih-final/zmeny.diff (voči aktuálnemu ${A.site}/assets/film.js), cesty k prehľadom, zvyšné riziká.`, { label: 'strih-synteza', phase: 'Syntéza' })
return { edits: ok, verdicts, synth }