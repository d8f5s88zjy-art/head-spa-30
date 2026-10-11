export const meta = {
  name: 'kontrola-kod-kompozicia-vykon',
  description: 'Nezávislé kontroly webu BARBERSHOP 30 po maximálnom detaile, novom prechode a návrate na ulicu: kód film.js, mobilná kompozícia, výkon a pamäť; potom protiargumenty ku každému nálezu',
  phases: [
    { title: 'Kontrola', detail: 'tri nezávislé pohľady' },
    { title: 'Overenie', detail: 'dvaja skeptici na každý nález' },
  ],
}

// Príklad z praxe: nezávislá kontrola webu BARBERSHOP 30 po maximálnom detaile, novom prechode a návrate
// na ulicu (pôvodne workflow „kontrola-kod-kompozicia-vykon“).
// Vzor: tri pohľady naraz (kód film.js, kompozícia a hook, výkon a pamäť) len čítaním a výpočtami, potom
// dvaja skeptici na každý nález okrem low; nález platí, keď ho aspoň jeden z nich nevyvráti.
// Kedy sa osvedčil: nálezom zodpovedajú opravy v barbershop-30/docs/CHECKS.md časť 8 (napríklad mipmapy, ktoré
// sa netvorili, kreslenie naplno na ulici, zotrvačnosť kolieska). CHECKS.md tam uvádza: nepotvrdené skeptikmi (limit relácie).
// Spustenie: nástroj Workflow so scriptPath na tento súbor. ROOT a cesty k snímkam sú z pôvodnej relácie.
// Oproti originálu pribudol len tento komentár.

const ROOT = '/home/user/head-spa-30/barbershop-30'
const COMMON = `Pracuješ v repozitári ${ROOT} (statický web BARBERSHOP 30, Nitra; podpriečinok repozitára head-spa-30, nasadený na https://d8f5s88zjy-art.github.io/head-spa-30/barbershop-30/). Pravidlá: po slovensky, žiadna zmienka o AI nikde, nič nevymýšľať. NESPÚŠŤAJ prehliadačové testy ani Playwright (bežia inde) – iba čítaj súbory, grep, python3 -I na výpočty, pozeraj hotové snímky. Dokumenty: docs/MASTER_BRIEF.md (záväzný brief), docs/TOUR_DIRECTION.md (časti Technika, Úvod ako film, Hook úvodu, Návrat na otváraciu scénu), docs/CHECKS.md. Dnešné zmeny (všetko v assets/film.js, index.html, assets/style.css; porovnaj: git -C /home/user/head-spa-30 diff 2d89d1b -- barbershop-30/assets/film.js barbershop-30/index.html barbershop-30/assets/style.css): (1) zábery v maximálnom detaile – stupne 1086/1448/2172/2896 (vstup aj 4096), výrezy na výšku pre telefón <meno>-m-{1086,1448} s vlastnou hĺbkou, výber cez data-tiers / data-m / data-m-size / data-m-tiers / data-fm a data-pro-* (shotOf, tiersOf, pickSize s CAP 1448 telefón / 2896 počítač / 4096 prológ), mipmapy + trilineárne filtrovanie + anizotropia pri ručnom nahrávaní po pásoch (upload → gl.generateMipmap), mriežka na telefóne 112×200; (2) jednotný prechod cez priestor: hĺbka v alfe render targetov (varying vZ), post shader prelína každý bod podľa hĺbky (o = 0,5·a.a + 0,5·b.a; m = smoothstep(o·0,45, o·0,45+0,55, uMix)), šero 18 % a vinetácia uprostred, dĺžka prechodu podľa výšky okna (span = clamp(0,55·innerHeight/gap, 0,16, 0,3)), uAmt 0,42→0,52, nájazd/dojazd v place(); (3) prológ (úvod ako film) a návrat na otváraciu scénu: PRO záber existuje vždy (done=!proArmed), startPro/leave/cancelLeave/outside, časové osi pro a leaving vo frame(), tl = pro||leaving||outside v draw(), ovládanie (tlačidlo .film-door, wheel, touchstart/touchmove, keydown), filmové pásy .film-bars cez html.pro / html.outside, overscroll-behavior-y: none, api.uvod.von/znova, proFreeze/fadeFreeze; (4) hook úvodu: choreografia nadpisu, .film-content parallax podľa --sp, kompaktná doska na telefóne, .scroll-hint a .film-door na telefóne. Vráť len skutočné nálezy s dôkazom (súbor:riadok, citát, výpočet); nič nevymýšľaj; keď si nie si istý, povedz to v confidence.`

const FINDINGS = {
  type: 'object',
  properties: {
    findings: { type: 'array', items: { type: 'object', properties: {
      severity: { type: 'string', enum: ['blocker', 'high', 'medium', 'low'] },
      area: { type: 'string' }, file: { type: 'string' }, line: { type: 'integer' },
      claim: { type: 'string' }, evidence: { type: 'string' }, fix: { type: 'string' },
      confidence: { type: 'number' },
    }, required: ['severity', 'area', 'file', 'claim', 'evidence', 'fix', 'confidence'] } },
    summary: { type: 'string' },
  },
  required: ['findings', 'summary'],
}
const VERDICT = { type: 'object', properties: { refuted: { type: 'boolean' }, reason: { type: 'string' }, severity: { type: 'string', enum: ['blocker', 'high', 'medium', 'low', 'none'] } }, required: ['refuted', 'reason', 'severity'] }

const REVIEWS = [
  { key: 'kod', prompt: `${COMMON}\n\nTvoj pohľad: KÓD assets/film.js (prečítaj celý súbor, je to asi 800 riadkov, aj diff). Hľadaj skutočné chyby a stavy, ktoré sa dajú rozbiť: (a) prológ, odchod von (leave/leaving), stav vonku (outside) a opakované vojdenie (startPro): poradie udalostí, čo sa stane pri skrole počas odchodu, pri skoku cez menu (goTo/jump S-T>1,5) kým je návštevník vonku, pri otočení telefónu (resize/measure) vonku alebo počas prológu, pri strate WebGL kontextu, pri skrytí karty; PRO.done a keepAround (uvoľnenie a znovunačítanie fasády), fin() nábeh po znovunačítaní, held/dark; (b) shotOf/tiersOf, výber -m, pickSize so stupňami a CAP, rohozka (stupne 1086/1448/2172 = 1920 px) a rohozka-m (len 1086 = 900 px); (c) mipmapy pri nahrávaní po pásoch: initTexture s generateMipmaps=false a minFilter LinearMipmapLinearFilter, generateMipmap po poslednom páse – je textúra v tom čase naviazaná, čo pri upgrade veľkosti (dispose starej), pri zrušení (live() false), pri context lost; anizotropia pred initTexture; (d) post shader: alfa render targetov (WebGLRenderTarget predvolený formát, clear alpha 1 = blízko pre prázdne okraje), matematika smoothstep(o·0,45, o·0,45+0,55, uMix) – pokrýva celý rozsah pre všetky o?; (e) draw(): span podľa gap pri k = N, uAmt návrat na 0,42, fadeFreeze, podmienka (pro||outside) && !A.ready; (f) place(): push záporné pri prichádzajúcom, kamera vs near plane 0,1 pri DIST 10, uAmt 0,52, push 0,25·DIST; (g) pamäť: 4096×2731 RGBA + mipmapy pre prológ, 2896 pre ostatné, drop po prológu; (h) udalosti wheel/touch/keydown: passive, konflikt s lightboxom a menu (klávesy medzerník/šípky keď je otvorený lightbox alebo fokus v tlačidle), touchmove pri otvorenom menu; (i) čokoľvek, čo zlyhá v Safari (iOS) – createImageBitmap, OffscreenCanvas, overscroll-behavior, 100lvh. Každý nález: súbor:riadok, citát, prečo, návrh opravy.` },
  { key: 'kompozicia', prompt: `${COMMON}\n\nTvoj pohľad: MOBILNÁ A DESKTOPOVÁ KOMPOZÍCIA, HOOK A OSTROSŤ. Pozri si snímky (Read, PNG/JPG): ${ROOT}/docs/screenshots/uvod-mobile-s{000,018,035,050,062,080,100}.jpg a uvod-desktop-s{000,035,050,100}.jpg (prológ s pásmi), ${ROOT}/docs/screenshots/scena-{1,2,3,3b,4,5,6,7,8c,9}-mobile.jpg (výrezy -m), ${ROOT}/docs/screenshots/prechod-sala-desktop-m{025,050,075}.jpg a prechod-sala-mobile-m{025,050,075}.jpg (prechod cez priestor), /tmp/claude-0/-home-user/9632978b-2b69-5a1e-a151-fbbea674fc3a/scratchpad/dvere2/uvod-desktop-vonku.png a uvod-mobile-vonku.png (stav vonku na ulici s tlačidlom), /tmp/claude-0/-home-user/9632978b-2b69-5a1e-a151-fbbea674fc3a/scratchpad/dvere3/uvod-mobile-vonku.png ak existuje (tlačidlo dverí presunuté hore), ${ROOT}/docs/screenshots/ostrost/*.jpg (pred/po). Posúď ako kreatívny riaditeľ s dôrazom na detail: bod záujmu každého výrezu (dvere, pult, kreslo, červené kreslo, pumpa, sud), čitateľnosť dosiek, prekrývanie tlačidiel (dvere, výzva, spodné Rezervovať), pásy vs lišta, prechod (je ďaleký koniec novej miestnosti naozaj prvý? je to filmové, nie „dvojexpozícia“?), konzistencia hero telefón (foto-30) vs počítač (slider/3), hook (čo by zákazníka zastavilo v prvých 3 s a čo mu chýba). Navrhni konkrétne hodnoty (x bodu záujmu vo film.py SHOTS, CSS pozície, časy) pre veci, ktoré treba zmeniť. Nálezy s dôkazom (čo na snímke vidíš), nie dojmy.` },
  { key: 'vykon', prompt: `${COMMON}\n\nTvoj pohľad: VÝKON A PAMÄŤ. Vypočítaj (python3 -I z assets/img/film/film.json a kódu film.js): (1) pamäť textúr v grafike: telefón (výrez 1448×2575 RGBA ×1,33 s mipmapami, keepAround drží až 4 zábery + render targety rtA/rtB pri dpr 2 a 100lvh), počítač DPR 2 pri 1440 px (2896 ×1,33 ×4) + prológ 4096×2731 ×1,33 + rtA/rtB 2880×1800 – je to únosné pre 4 GB telefón (Safari limit pamäte stránky ~1–1,5 GB, GPU zdieľaná), pre integrovanú grafiku?; (2) prenesené bajty: prvý obraz bez filmu (záloha -m-1086 / 1448), prológ (three 170 KB gzip + vstup(-m) + rohozka(-m) + susedia), celá prehliadka telefón (všetky -m-1448) a počítač DPR 2 (všetky 2896) a DPR 1 (2172) – porovnaj s pôvodnými 1448/2172 (q58) a s cieľmi MASTER_BRIEF (prvý obraz ≤ 1,5 MB, LCP ≤ 2,5 s Slow 4G); (3) čas nahrávania po pásoch (BAND 256, pump 4 ms/snímku) pre 2896×1931, 4096×2731 a 1448×2575 – koľko snímkov, a generateMipmap na mobilnej GPU; (4) riziká: tablet 1024 px (phone=false → 2896 pri DPR 2), telefón na šírku (max-height 500 px → film vypnutý?), prológ 4096 len keď need > 2896×0,95; (5) CSS: .film-content parallax s will-change na každej kotve (13 vrstiev) – pamäť kompozitora na telefóne, backdrop-filter dosiek na počítači, overscroll-behavior; (6) skript v hlavičke: preload fasády 4096 na širokom 2× displeji = 764 KB pred LCP? (preload má fetchpriority high – súperí s HTML/CSS?). Daj konkrétne odporúčania s prahmi a nálezy s výpočtom.` },
]

phase('Kontrola')
const reviews = (await parallel(REVIEWS.map((r) => () => agent(r.prompt, { label: `kontrola:${r.key}`, phase: 'Kontrola', schema: FINDINGS })))).filter(Boolean)
const all = reviews.flatMap((r, i) => r.findings.map((f) => ({ ...f, from: REVIEWS[i] ? REVIEWS[i].key : '?' })))
log(`nálezov spolu ${all.length}: ${all.filter((f) => f.severity === 'blocker' || f.severity === 'high').length} blocker/high, ${all.filter((f) => f.severity === 'medium').length} medium`)

phase('Overenie')
const toVerify = all.filter((f) => f.severity !== 'low')
const verified = await parallel(toVerify.map((f, i) => () =>
  parallel([0, 1].map((n) => () => agent(`${COMMON}\n\nSi skeptik č. ${n + 1}. Pokús sa VYVRÁTIŤ tento nález kontroly (${f.from}): „${f.claim}“ (súbor ${f.file}${f.line ? ':' + f.line : ''}; dôkaz kontrolóra: ${f.evidence}; navrhovaná oprava: ${f.fix}). Prečítaj si dotknutý kód/súbor a over to sám (grep, python3 -I výpočet, Read snímok). refuted=true, keď nález neplatí, je už ošetrený inde, alebo by oprava nič nezlepšila; keď si nie si istý, refuted=true a povedz prečo. Uveď aj skutočnú závažnosť.`, { label: `overenie:${f.from}:${i}:${n}`, phase: 'Overenie', schema: VERDICT })))
    .then((vs) => { const v = vs.filter(Boolean); return { ...f, votes: v, confirmed: v.length > 0 && v.some((x) => !x.refuted) && !(v.length === 2 && v.every((x) => x.refuted)) } })
))
const confirmed = verified.filter(Boolean).filter((f) => f.confirmed)
const refuted = verified.filter(Boolean).filter((f) => !f.confirmed)
log(`potvrdené ${confirmed.length}, vyvrátené ${refuted.length}, nízke (neoverované) ${all.length - toVerify.length}`)
return { confirmed, refuted, low: all.filter((f) => f.severity === 'low'), summaries: reviews.map((r, i) => ({ key: REVIEWS[i].key, summary: r.summary })) }