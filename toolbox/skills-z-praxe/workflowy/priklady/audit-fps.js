export const meta = {
  name: 'audit-fps',
  description: 'Audit výkonu webu BARBERSHOP 30 pre 60 až 120 snímok za sekundu: film JS, grafika, DOM a CSS',
  phases: [
    { title: 'Audit', detail: 'tri oblasti naraz, len čítanie a meranie' },
    { title: 'Overenie', detail: 'skeptik preverí, či návrhy naozaj pomôžu a nič nerozbijú' },
  ],
}

// Príklad z praxe: audit plynulosti (60 až 120 snímok za sekundu) webu BARBERSHOP 30
// (pôvodne workflow „audit-fps“, 2026-10-11).
// Vzor: pipeline cez tri oblasti (JS filmu, grafika, stránka a CSS); hneď po audite oblasti ju preverí
// skeptik (stojí to naozaj čas v každej snímke, ušetrí to úprava, nič nerozbije) a vráti len nálezy, ktoré obstoja.
// Kedy sa osvedčil: barbershop-30/docs/CHECKS.md časť 13. Overovateľ zamietol napríklad svetlo po okraji karty
// na width: 200% (na úzkom telefóne nepokryje rohy) a nameraný prínos bol menší, než tvrdil audit.
// Spustenie: nástroj Workflow so scriptPath na tento súbor. Cesty v CTX sú z pôvodnej relácie.
// Oproti originálu pribudol len tento komentár.

const CTX = `
Projekt: /home/user/head-spa-30/barbershop-30 (statický web, index.html, assets/film.js = three.js WebGL2 film
z fotiek s hĺbkovou mapou a videami, assets/app.js = skrolom riadené CSS premenné a triedy, assets/style.css).
Cieľ majiteľa: celá stránka 60 až 120 snímok za sekundu (telefón aj počítač), pri zachovaní ostrosti a vzhľadu.
Dôležité: NEUPRAVUJ žiadne súbory v projekte. Len čítaj, meraj (Playwright je k dispozícii: require('playwright')
z /home/user/head-spa-30/barbershop-30/source/tools, statický server: import { startStaticServer, PRESETS } from
'/home/user/head-spa-30/barbershop-30/source/shot.mjs'; ?film=on vynúti film aj pri softvérovom kreslení,
?film=off ho vypne, ?uvod=off vynechá prológ). Skripty si píš do /tmp/claude-0/-home-user/9632978b-2b69-5a1e-a151-fbbea674fc3a/scratchpad/fps/.
Kontajner nemá grafickú kartu (SwiftShader), preto čas GPU nemeraj ako skutočný; meraj čas hlavného vlákna
(CDP Performance.getMetrics: ScriptDuration, RecalcStyleDuration, LayoutDuration, TaskDuration; CPU spomalenie 4x
cez Emulation.setCPUThrottlingRate ako telefón) a odhadni záťaž GPU z kódu (počet prechodov, rozlíšenie cieľov,
vzorky textúr, mipmapy, prekrývanie).
Už vieme (neopakuj): film kreslí plnou frekvenciou 60 s po pohybe, potom 30 snímok/s (setTimeout), po 180 s stojí;
pri pomalom zariadení 'cap' = strop 30 snímok/s; quality() znižuje dpr po 0,5 keď priemer > 24 ms. Toto upravujem sám.
Vráť konkrétne nálezy: súbor:riadok, čo stojí čas v každej snímke, odhad úspory, presný návrh úpravy (kód),
riziko pre vzhľad. Zoraď podľa prínosu. Žiadne všeobecné rady bez väzby na tento kód.`

const FIND = {
  type: 'object',
  properties: {
    findings: { type: 'array', items: { type: 'object', properties: {
      where: { type: 'string' }, cost: { type: 'string' }, fix: { type: 'string' }, gain: { type: 'string' }, risk: { type: 'string' }, measured: { type: 'string' },
    }, required: ['where', 'cost', 'fix', 'gain', 'risk'] } },
    summary: { type: 'string' },
  },
  required: ['findings', 'summary'],
}

const AREAS = [
  { key: 'film-js', prompt: 'Oblasť: JavaScript filmu v každej snímke (assets/film.js: frame(), draw(), place(), drive(), keepAround(), measure(), quality(), shotT(), cut logika). Hľadaj alokácie v slučke (nové polia, objekty, closures, Vector3, spread, find/filter/map), zbytočné prepočty, čítania rozloženia (getBoundingClientRect, scrollY v slučke), synchronné volania WebGL ktoré čakajú na GPU (readPixels, getError, getParameter), nahrávanie textúr na hlavnom vlákne (texImage2D veľkých fotiek, generateMipmap), prácu ktorá by mohla bežať len pri zmene. Zmeraj ScriptDuration na snímku pri dýchaní kamery a pri skrolovaní (film=on, uvod=off, 390x844 aj 1440x900).' },
  { key: 'gpu', prompt: 'Oblasť: záťaž grafiky na snímku (assets/film.js: renderer, rtA/rtB render targety, mipmapy, shadery záberov a postprocesu, strihy streak/zoom so 12/16 vzorkami, vinetácia, dpr a jeho strop, antialias, mriežka záberu, počet kreslení na snímku, VideoTexture aktualizácie, prelínanie dvoch záberov). Odhadni pixely a vzorky textúr na snímku pre telefón 390x844 pri dpr 2 a 3 a pre počítač 1440x900 a 2560x1440, mimo strihu aj v strihu. Navrhni úpravy, ktoré udržia 120 snímok na telefóne s grafikou strednej triedy bez viditeľnej straty ostrosti (napr. mipmapy len keď treba, menej vzoriek, nižšie rozlíšenie len počas rýchleho pohybu, preskočenie postprocesu mimo strihu, precision, kreslenie len pri zmene).' },
  { key: 'dom-css', prompt: 'Oblasť: stránka nad filmom (assets/app.js tick/apply/setVar, assets/style.css animácie a prechody: marquee, lesk tlačidla, beam, kinetické nadpisy s filter blur, zaostrenie úvodu, title-frame opacity, film-still fixed vrstvy, will-change, body::after, backdrop-filter, sticky/fixed prvky, text-shadow, box-shadow, mask). Zmeraj RecalcStyle/Layout/Script/Paint na snímku pri plynulom skrolovaní celej stránky s CPU spomalením 4x (film=off aj film=on), nájdi drahé premenné na <html> (--p mení štýl celého stromu?), zbytočné zápisy, layout thrash, animácie mimo kompozitora (filter, mask, background-position), príliš veľa vrstiev. Navrhni úpravy s nameraným prínosom.' },
]

phase('Audit')
const results = await pipeline(
  AREAS,
  (a) => agent(`${CTX}\n\n${a.prompt}`, { label: `audit ${a.key}`, phase: 'Audit', schema: FIND }).then((r) => (r ? { area: a.key, ...r } : null)),
  (r, a) => r && agent(`${CTX}\n\nSi skeptický recenzent výkonu. Pre každý nález z oblasti ${a.key} over v kóde, či (1) naozaj stojí čas v každej snímke, (2) navrhnutá úprava ho ušetrí, (3) nič nerozbije (vzhľad, strihy, prológ, videá, testy v source/tools). Nálezy, ktoré neobstoja, zamietni s dôvodom. Vráť len tie, ktoré obstoja, s prípadne spresnenou úpravou.\n\nNálezy (JSON):\n${JSON.stringify(r.findings)}`,
    { label: `overenie ${a.key}`, phase: 'Overenie', schema: FIND }).then((v) => (v ? { area: a.key, audit: r, verified: v } : null)),
)
return results.filter(Boolean)
