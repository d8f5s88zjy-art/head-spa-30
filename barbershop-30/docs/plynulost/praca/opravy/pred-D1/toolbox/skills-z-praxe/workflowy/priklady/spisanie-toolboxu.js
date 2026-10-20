export const meta = {
  name: 'toolbox-skills-z-praxe',
  description: 'Spísať postupy z prác na weboch HEAD SPA 30 a BARBERSHOP 30 do skills v toolboxe a každý overiť proti kódu',
  phases: [
    { title: 'Písanie', detail: 'jeden autor na skill, číta skutočný kód a dokumenty' },
    { title: 'Overenie', detail: 'nezávislý overovateľ porovná každé tvrdenie s kódom a opraví' },
  ],
}

// Príklad z praxe: spísanie skills do toolbox/skills-z-praxe (pôvodne workflow „toolbox-skills-z-praxe“, október 2026).
// Vzor: pipeline cez skills; pre každý skill autor (číta skutočný kód a dokumenty) a hneď po ňom nezávislý
// overovateľ, ktorý porovná každé tvrdenie s kódom a opraví ho. Spoločné pravidlá sú v BASE.
// Spustenie: nástroj Workflow so scriptPath na tento súbor. Cesty R, B, OUT, POZ a REF6 sú z pôvodnej relácie.
// Oproti originálu pribudol len tento komentár.

const R = '/home/user/head-spa-30'
const B = R + '/barbershop-30'
const OUT = R + '/toolbox/skills-z-praxe'
const POZ = '/tmp/claude-0/-home-user/9632978b-2b69-5a1e-a151-fbbea674fc3a/scratchpad/toolbox/poznatky.md'
const REF6 = '/tmp/claude-0/-home-user/9632978b-2b69-5a1e-a151-fbbea674fc3a/scratchpad/ref6'

const BASE = `Úloha: do toolboxu repozitára ${R} zapisuješ znovupoužiteľný skill (postup, ktorý sa dá použiť neskôr na tomto aj na inom webe). Skills sa ukladajú do ${OUT}/<meno>/SKILL.md (formát Agent Skills, špecifikácia ${R}/toolbox/specifikacia/agent-skills-spec.md; vzor dobrého skillu napr. ${R}/toolbox/skills/frontend-design/SKILL.md a ${R}/toolbox/skills-animacie/gsap/).
Spoločný podklad s poznatkami z celej práce: ${POZ} (prečítaj celý). Ak sa podklad a kód líšia, platí kód a rozdiel spomeň vo výsledku.
PRAVIDLÁ:
- SKILL.md začína frontmatter iba s poľami name (malé písmená bez diakritiky, spojovníky, zhodné s názvom priečinka) a description (po slovensky, čo skill robí a KEDY ho použiť, s kľúčovými slovami, ktoré ľudia použijú, aj anglickými termínmi ako WebGL, Lighthouse, reels; najviac asi 600 znakov).
- Text po slovensky, vecne, prakticky: kedy použiť, postup krok za krokom, krátke úryvky kódu PREVZATÉ zo skutočných súborov (uveď cestu k súboru), pasce a ich riešenia (lekcie), kontrolný zoznam na konci. SKILL.md do zhruba 300 riadkov; podrobnosti do ${OUT}/<meno>/references/*.md a odkáž na ne.
- Každé tvrdenie, číslo a parameter musí mať oporu v kóde alebo dokumentoch repozitára alebo v podklade. Nič nevymýšľaj; čo nevieš overiť, vynechaj.
- Bez pomlčky em dash (znak U+2014) a bez en dash (U+2013) v texte; použi čiarku, dvojbodku alebo zátvorky.
- Žiadne prihlasovacie údaje, tokeny, e-maily ani osobné údaje.
- Píš len do svojho priečinka (ich zoznam je v zadaní). Nič iné v repozitári nemeň, necommituj, nepushuj.
- Skill má byť použiteľný aj na inom projekte: všeobecný postup + časť „V tomto repozitári“ s cestami k fungujúcej implementácii.
Vráť štruktúrovaný výsledok.`

const SKILLS = [
  {
    key: 'instagram',
    dirs: ['instagram-salon', 'referencie-z-videi'],
    prompt: `Napíš DVA skills.
1) ${OUT}/instagram-salon/: Instagram pre salón (Barbershop 30 aj HEAD SPA 30, dá sa použiť aj pre iný podnik). Vychádza z videa nategold.ai o „Instagram Agent“ s 11 skills (titulky ${REF6}/sub.vtt, prehľad snímok ${REF6}/sheet.jpg, prečítaj aj ten obrázok). Pôvodný repozitár github.com/nategoldai/instagram-agent sa NEPODARILO otvoriť: nekopíruj z neho nič, nepredstieraj, že vieš, čo v ňom je; skill je náš vlastný, postavený na tom, čo video ukazuje a hovorí. Pokry všetkých 11 úloh (Post Writer, Comment Drafter, Reply Handler, Profile Optimizer, Content Planner, Virality Engine, Hook Extractor, Reel Scripter, Grid Planner, Trend Watcher, Engagement Loop) ako režimy skillu, ktoré pripravujú LEN NÁVRHY; uverejňuje a komentuje majiteľ sám (automatické akcie z účtu Instagram obmedzuje, pôsobia ako spam). Rozbor reelu podľa videa: úvod (jasný sľub), obraz (tvár a rozpoznateľné miesto), stavba (problém a jednoduché riešenie); scenár reelu v troch vetách. Trend Watcher a Virality Engine pracujú s odkazmi alebo snímkami, ktoré dodá majiteľ (TikTok odkazy cez skill referencie-z-videi), nie s prihlásením do účtu.
Fakty LEN zo zdrojov, nikdy ich do skillu nekopíruj ako zoznam cien (menia sa), ale uveď, kde sú: Barbershop 30 ${B}/docs/CONTENT_SOURCES.md (Instagram, Facebook, rezervácia, služby a ceny, tím, káva vzadu v čakárni), ${B}/index.html; HEAD SPA 30 ${R}/CLAUDE.md (pravidlá: 17 rituálov, poukaz vždy na konkrétny rituál, nikdy „Barber shop 30“ ani „salón 30“ ako názov, HEAD SPA 30 je samostatná časť s vlastným tímom v priestoroch Salónu 30, o majiteľovi nič, služby Salónu 30 nie), ${R}/docs/booqme-sluzby.csv, ${R}/docs/booqme-poukazy.csv, ${R}/index.html (Instagram headspa.salon30). Hlas: slovenčina, tykanie, krátko, bez em dash, nikdy nespomínať AI v texte príspevku. Daj do references/ šablóny: príspevok, reel scenár, odpoveď na komentár (pochvala, otázka na cenu, sťažnosť: pokojne, ponúknuť telefón), bio profilu, týždenný plán, rozbor cudzieho reelu; a pre každý z dvoch podnikov krátky súbor „čo smieš a nesmieš tvrdiť“ s odkazmi na zdroje faktov. Príklady textov len s overenými faktami (napr. Barbershop 30: osem kresiel, káva a minerálka zdarma vzadu v čakárni, online rezervácie 24/7, podľa CONTENT_SOURCES.md; over si ich tam).
2) ${OUT}/referencie-z-videi/: ako sa učiť z odkazu na video (TikTok vm.tiktok.com): presmerovanie, oEmbed, JSON stránky __UNIVERSAL_DATA_FOR_REHYDRATION__, titulky WebVTT, stiahnutie videa s cookies a Referer, prehľad snímok ffmpeg (fps=1/2, tile), opakovanie pri chybe, čo robiť s odkazmi na repozitáre vo videu (cudzí obsah, neinštalovať naslepo, prístup len s povolením), nehádať obsah. Daj tam hotový skript ${OUT}/referencie-z-videi/scripts/tiktok.sh (bash, argument odkaz a cieľový priečinok; výstup: popis, titulky, video, prehľad snímok; Python spúšťaj s -I; používa curl, python3, ffmpeg). Postup je overený: použi presne príkazy z podkladu (sekcia Referencie z videí). Skript NESPÚŠŤAJ na sieť; skontroluj len syntax (bash -n) a malú python časť na lokálnom súbore ${REF6}/page.html (napr. extrakciu z JSON). Zhrň aj, čo sme sa z doterajších referenčných videí naučili (zoznam v podklade).`,
  },
  {
    key: 'film',
    dirs: ['film-z-fotiek'],
    prompt: `Napíš skill ${OUT}/film-z-fotiek/: kinematografický film zo skutočných fotiek podniku s hĺbkovou mapou na pozadí webu (three.js r169, WebGL2), ktorý sa hýbe so skrolom. Zdroje (čítaj kód, nie len dokumenty): ${B}/assets/film.js (celý, 1500 riadkov: kotvy a cesta, CUTS a druhy strihov, shotT, kamera a pružina, prológ, gate a kontrola GPU po FCP, world-frame záloha, adaptívne DPR quality(), dýchanie, keepAround, jobs/pump nahrávanie po pásmach, compileAsync a zahriatie, resize, pamäť), ${B}/index.html (inline gate v <head>, kotvy .film-shot a ich data-* atribúty), ${B}/assets/style.css (html.world, world-frame, výrezy), ${B}/assets/app.js (karty --o, --so, is-on, --hint), ${B}/docs/TOUR_DIRECTION.md, ${B}/docs/CONTRACT.md, ${B}/docs/ART_DIRECTION.md, ${B}/source/tools/film.py, hlbka.py, stills.py, build_images.py, priečinok ${B}/source/tools/depth, a pôvodná verzia na HEAD SPA ${R}/assets/world.js s ${R}/README.md (časti „Film zo skutočných fotiek“, „Úvodné dvere“, „Dvere na úvode“, „Výkon na mobile“). Popíš architektúru, rozhranie HTML ↔ film (atribúty), prípravu záberov (stupne veľkosti, výrezy na telefón, hĺbka ≤ 768 px), strihy, kameru, gate a zálohy, výkon (DPR, pásma nahrávania, čo sa nesmie robiť v každej snímke), dvere v úvode, a lekcie. Detailné tabuľky (všetky druhy strihov a parametre, atribúty kotiev) do references/.`,
  },
  {
    key: 'video',
    dirs: ['video-a-sekvencie'],
    prompt: `Napíš skill ${OUT}/video-a-sekvencie/: plynulé video na webe pri skrolovaní a slučky videa (cieľ 60 až 240 Hz displeje). Zdroje: ${B}/source/tools/sekvencie.sh, ${B}/source/tools/videa.sh, ${B}/assets/film.js (videoOf, FRAG_SEQ, seqStart, seqStop, seqFetch, seqTex, seqDrive, attach/detach, drive pre scroll mód, play mód a odomknutie gestom, data-video-* atribúty, state API so seq), ${B}/index.html (sekcie s data-video, data-video-mode, data-video-n, data-video-size, data-video-poster), ${B}/docs/CHECKS.md (sekcie 11 až 13 s meraniami), ${B}/docs/MEDIA_SELECTION.md, ${B}/docs/TOUR_DIRECTION.md. Popíš: prečo pretáčanie videa podľa skrolu na telefóne seká, sekvenciu snímok po 0,1 s (príprava ffmpeg + Pillow AVIF/WebP, veľkosti), načítanie hrubé → jemné, LRU textúr, limit nahratí za snímku, zahadzovanie zastaraných, prelínanie dvoch snímok a dosadnutie v pokoji, slučky (vidstab, lanczos, CAS, minterpolate, šev slučky cez strojnásobenie a výrez strednej periódy, xfade), kódovanie H.264/VP9 parametre zo skriptov, realitu merania fps (SwiftShader, Safari na iPhone), čo ostáva na rozhodnutie (zdroj v 60 fps). Prilož do references/ parametre a úryvky príkazov zo skriptov.`,
  },
  {
    key: 'vykon',
    dirs: ['rychly-web'],
    prompt: `Napíš skill ${OUT}/rychly-web/: rýchly a plynulý statický web, Lighthouse mobil 95+ a desktop 100, plynulý skrol 60 až 240 Hz. Zdroje: ${B}/docs/CHECKS.md (celý, merania a opravy), ${R}/README.md (časti „Rýchlosť a prístupnosť“, „Výkon na mobile“, „Mobil“, „Drobnosti, ktoré nie sú vidieť“, „Luxusná vrstva“), ${B}/assets/app.js (readTarget/curY, apply, --hint, io pauzovanie animácií), ${B}/assets/style.css (is-off pauzy, visually-hidden, výrezy object-fit), ${B}/index.html (<head>: preload, písma, gate), ${R}/tools/build.mjs (minifikácia esbuild), ${B}/source/tools/vaha.mjs, ${B}/source/tools/ostrost.mjs, úpravy podľa auditu v /tmp/claude-0/-home-user/9632978b-2b69-5a1e-a151-fbbea674fc3a/scratchpad/wf/perf-patch.py, skript auditu /root/.claude/projects/-home-user-head-spa-30-barbershop-30/9632978b-2b69-5a1e-a151-fbbea674fc3a/workflows/scripts/audit-fps-wf_2f14c8a8-bf2.js. Popíš: ako merať (Lighthouse mobil/desktop, observed vs simulated, Lantern, viac behov), LCP (veľkosť obrázkov na telefón, AVIF/WebP kvalita), FCP (nič drahé pred prvým vykreslením), CLS (pasca so zmenšením viewportu od pretekajúcich abspos prvkov), prepočty štýlu (premenné na <html>, čítanie po zápise, innerHeight, pointer premenné), animácie mimo obrazovky, backdrop-filter na mobile, overovanie tvrdení auditu meraním, zoznam overených ešte nenasadených nápadov a zamietnutý width: 200%. Kontrolný zoznam pred nasadením.`,
  },
  {
    key: 'testy',
    dirs: ['testy-a-nasadenie'],
    prompt: `Napíš skill ${OUT}/testy-a-nasadenie/: testovanie statického webu v prehliadači (Playwright, Chromium z /opt/pw-browsers) a nasadenie na GitHub Pages. Zdroje: všetky nástroje v ${B}/source/tools/*.mjs a *.py na testy a snímky (app-smoke.mjs celý: čo kontroluje, ako beží s parametrami, kontrola softvérového renderovania, šírky, beh bez app.js, kotvy; koliesko-test.mjs; uvod-meranie.mjs; uvod-zhoda.py; uvod-shot.mjs; karty-shot.mjs; scenes-shot.mjs; strih-shot.mjs; prechod-shot.mjs; ostrost.mjs/py; vaha.mjs), ${B}/source/tools/nasad-barbershop30.sh, ${R}/tools/ftp-balik.sh, ${R}/tools/ftp-rozdel.py, ${R}/tools/build.mjs, ${R}/CLAUDE.md (Postup nasadenia), ${R}/README.md (časti „Admin (admin/)“, „Náhľad“, „Nasadenie“), ${B}/README.md, ${B}/docs/CHECKS.md, ${B}/docs/INTEGRATION_LOG.md. Popíš: ako spustiť lokálny server a testy (príkazy prevzaté zo súborov), čo každý nástroj meria, lekcie (čakania a nestabilné testy, softvérové renderovanie nemeria skutočné fps, najprv rýchle cielené kontroly), postup nasadenia (fetch a merge main kvôli adminu, vetva, ff-only do main, overenie naživo), nasadenie do samostatného repozitára, FTP balík, commity po slovensky bez podpisov. Kontrolný zoznam.`,
  },
  {
    key: 'obsah',
    dirs: ['obsah-a-texty', 'booqme-rezervacie'],
    prompt: `Napíš DVA skills.
1) ${OUT}/obsah-a-texty/: pravdivý obsah a texty webu podniku po slovensky. Zdroje: ${R}/CLAUDE.md, ${R}/README.md (časti „Typografia po slovensky“, „Texty pri rituáloch“, „Bez opakovania“, „Nadväznosť sekcií“, „Kam vedú tlačidlá“, „Jazyky“, „Identita z prevádzky“, „Tlač“), ${R}/assets/i18n.js a ${R}/assets/i18n/*.json (kľúč je slovenský text, šesť jazykov; zisti ako to funguje a ako sa pridáva text), ${B}/docs/CONTENT_SOURCES.md (štruktúra so stupňami dôveryhodnosti, zápis opráv majiteľa s dátumom), ${B}/docs/MASTER_BRIEF.md, ${B}/docs/ART_DIRECTION.md, ${B}/docs/MEDIA_SELECTION.md (súhlasy s fotkami ľudí), ${R}/stavebniny-richtarik/README.md (web z obsahu pôvodnej stránky, nič vymyslené), ${B}/index.html (texty, popisy barberov .team-bio), workflow textárov /root/.claude/projects/-home-user-head-spa-30-barbershop-30/9632978b-2b69-5a1e-a151-fbbea674fc3a/workflows/scripts/popisy-barberov-wf_89e5a84c-a96.js. Popíš: zdroj faktov a stupne dôvery, čo sa nesmie (vymýšľať, AI zmienky, em dash, mená a značky podľa pravidiel podniku), hlas (tykanie, krátke riadky, hook), slovenská typografia, viac jazykov, štruktúrované dáta schema.org (JSON-LD v index.html) v súlade s textom, popisy ľudí bez vymyslených faktov, zapracovanie opráv od majiteľa.
2) ${OUT}/booqme-rezervacie/: web napojený na rezervačný systém Booqme (odkazy na kalendár a obchod s poukazmi, žiadne formuláre na webe). Zdroje: ${R}/tools/booqme-kontrola.mjs (zisti, čo kontroluje a ako sa spúšťa; prihlasovacie údaje len z premenných prostredia, nikdy ich nevypisuj), ${R}/docs/booqme-sluzby.csv, ${R}/docs/booqme-poukazy.csv, ${R}/docs/booqme-opravy.md, priečinok ${R}/docs/booqme, ${R}/README.md (časti „Poukazy online cez Booqme“, „Rezervácia“, „Rezervácie“, „Rezervácia priamo na stránke“, „Kam vedú tlačidlá Rezervovať“, „Poukaz na konkrétny rituál“, „Darčekové poukážky“), ${R}/CLAUDE.md (Booqme), ${R}/index.html (data-booking-link, li[data-booqme], JSON-LD ReserveAction). Pre BARBERSHOP 30 uveď, že má vlastný rezervačný systém (CONTENT_SOURCES.md) a Booqme len pre farbenie. Popíš postup zosúladenia webu po zmene v Booqme a kontrolu.`,
  },
  {
    key: 'workflowy',
    dirs: ['workflowy'],
    prompt: `Napíš skill ${OUT}/workflowy/: osvedčené postupy práce s viacerými agentmi naraz (nástroj Workflow v Claude Code) pri tvorbe a kontrole webu. Zdroje, skripty, ktoré sme naozaj spustili (prečítaj ich celé):
/root/.claude/projects/-home-user/9632978b-2b69-5a1e-a151-fbbea674fc3a/workflows/scripts/barbershop30-audit-wf_850e3837-9e0.js
/root/.claude/projects/-home-user-head-spa-30-barbershop-30-source/9632978b-2b69-5a1e-a151-fbbea674fc3a/workflows/scripts/barbershop30-stavba-wf_136dc1aa-f19.js
/root/.claude/projects/-home-user-head-spa-30/9632978b-2b69-5a1e-a151-fbbea674fc3a/workflows/scripts/barbershop30-prehliadka-wf_317ae533-f1a.js
/root/.claude/projects/-home-user-head-spa-30/9632978b-2b69-5a1e-a151-fbbea674fc3a/workflows/scripts/kontrola-kod-kompozicia-vykon-wf_4bf8b5e9-bc2.js
/root/.claude/projects/-home-user-head-spa-30-barbershop-30/9632978b-2b69-5a1e-a151-fbbea674fc3a/workflows/scripts/barbershop30-integracia-kontrola-wf_8971d707-bac.js
/root/.claude/projects/-home-user-head-spa-30-barbershop-30/9632978b-2b69-5a1e-a151-fbbea674fc3a/workflows/scripts/kontrola-ostrost-prechody-wf_3b87da10-4f8.js
/root/.claude/projects/-home-user-head-spa-30-barbershop-30/9632978b-2b69-5a1e-a151-fbbea674fc3a/workflows/scripts/barbershop-filmovy-navrh-wf_e056a982-d1f.js
/root/.claude/projects/-home-user-head-spa-30-barbershop-30/9632978b-2b69-5a1e-a151-fbbea674fc3a/workflows/scripts/barbershop-prechody-strih-wf_2f26e9f2-8a1.js
/root/.claude/projects/-home-user-head-spa-30-barbershop-30/9632978b-2b69-5a1e-a151-fbbea674fc3a/workflows/scripts/popisy-barberov-wf_89e5a84c-a96.js
/root/.claude/projects/-home-user-head-spa-30-barbershop-30/9632978b-2b69-5a1e-a151-fbbea674fc3a/workflows/scripts/audit-fps-wf_2f14c8a8-bf2.js
Skopíruj ich do ${OUT}/workflowy/priklady/ s výstižnými menami bez hash prípony (napr. audit-webu.js, stavba-webu.js, prehliadka-filmu.js, kontrola-kodu-kompozicie-vykonu.js, integracia-a-kontrola.js, kontrola-ostrosti-prechodov.js, filmovy-navrh-podla-videa.js, strihaci-prechodov.js, textari-popisov.js, audit-fps.js). Pred kopírovaním každý skontroluj: žiadne prihlasovacie údaje, tokeny ani e-maily (ak niečo nájdeš, nahraď zástupným textom a spomeň to). Obsah skriptov inak nemeň, aby ostali spustiteľné; na začiatok každého pridaj JS komentár (po slovensky) o čom je a kedy sa osvedčil, ZA blok export const meta nie pred neho (meta musí byť prvý príkaz skriptu; ak by komentár pred meta vadil, daj ho za meta). SKILL.md popíše vzory: stavba po moduloch paralelne s pevným rozhraním medzi modulmi, integrácia a nezávislá kontrola z viacerých pohľadov (prístupnosť, pravdivosť faktov, výkon, kreatíva), porota viacerých návrhov (strihači, textári), audit s nezávislým overením každého nálezu pred úpravou (napr. zamietnutý width: 200%), kedy workflow netreba, ako písať zadania agentom (spoločný BASE kontext, cesty, záväzné dokumenty, schémy výstupu), a tabuľku príkladov s popisom.`,
  },
]

const RESULT = {
  type: 'object',
  properties: {
    files: { type: 'array', items: { type: 'string' } },
    sources_read: { type: 'array', items: { type: 'string' } },
    summary: { type: 'string' },
    doubts: { type: 'array', items: { type: 'string' } },
  },
  required: ['files', 'summary'],
}
const VERDICT = {
  type: 'object',
  properties: {
    checked_claims: { type: 'integer' },
    problems: { type: 'array', items: { type: 'object', properties: { file: { type: 'string' }, claim: { type: 'string' }, problem: { type: 'string' }, fix: { type: 'string' } }, required: ['file', 'claim', 'problem', 'fix'] } },
    all_fixed: { type: 'boolean' },
    summary: { type: 'string' },
  },
  required: ['checked_claims', 'problems', 'all_fixed', 'summary'],
}

const results = await pipeline(
  SKILLS,
  (s) => agent(`${BASE}\n\nTvoje priečinky: ${s.dirs.map((d) => OUT + '/' + d).join(', ')}.\n\n${s.prompt}`,
    { label: `píše:${s.key}`, phase: 'Písanie', schema: RESULT }),
  (w, s) => agent(`${BASE}\n\nSi NEZÁVISLÝ OVEROVATEĽ skillu v priečinkoch ${s.dirs.map((d) => OUT + '/' + d).join(', ')} (napísal ho iný autor podľa tohto zadania: ${s.prompt.slice(0, 1500)}).
Prečítaj všetky súbory skillu. Každé konkrétne tvrdenie (názov funkcie, parameter, číslo, príkaz, cesta, správanie, fakt o podniku) porovnaj so skutočným kódom a dokumentmi v repozitári a s podkladom ${POZ}. Hľadaj aktívne chyby: vymyslené alebo nepresné čísla, funkcie, ktoré v kóde nie sú alebo robia niečo iné, zlé cesty, príkazy, ktoré by nefungovali, fakty o podniku bez opory v zdrojoch, porušenia pravidiel (em dash U+2014, en dash U+2013, AI zmienka v navrhovaných textoch pre zákazníkov, osobné údaje, prihlasovacie údaje), neplatný frontmatter (len name a description, name = priečinok), mätúce alebo chýbajúce kroky. Over aj, že relatívne odkazy medzi súbormi skillu vedú na existujúce súbory. Chyby OPRAV priamo v súboroch skillu (iba tam). Ak skill obsahuje skripty, over syntax (bash -n, node --check) bez spúšťania na sieti. Vráť zoznam nájdených problémov a opráv.
Poznámka autora: ${JSON.stringify(w ? { summary: w.summary, doubts: w.doubts || [], files: w.files } : 'autor nevrátil výsledok, skontroluj, čo v priečinku je, a doplň chýbajúce podľa zadania').slice(0, 3000)}`,
    { label: `overuje:${s.key}`, phase: 'Overenie', schema: VERDICT }).then((v) => ({ key: s.key, dirs: s.dirs, writer: w, verdict: v })),
)
return results
