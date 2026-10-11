export const meta = {
  name: 'kontrola-ostrost-prechody',
  description: 'Nezávislé kontroly webu BARBERSHOP 30 po zmene na maximálny detail a nový prechod: kód film.js, stránka a súbory, mobilná kompozícia, výkon a pamäť; potom protiargumenty ku každému nálezu',
  phases: [
    { title: 'Kontrola', detail: 'štyri nezávislé pohľady' },
    { title: 'Overenie', detail: 'dvaja skeptici na každý nález' },
  ],
}

// Príklad z praxe: nezávislá kontrola webu BARBERSHOP 30 po zmene na maximálny detail záberov a nový prechod
// (pôvodne workflow „kontrola-ostrost-prechody“).
// Vzor: štyri pohľady naraz (kód, stránka a súbory, kompozícia na telefóne, výkon a pamäť) len čítaním,
// grep a výpočtami, bez Playwrightu (testy bežali inde a súperili by o CPU). Potom dvaja skeptici na každý
// nález okrem low; nález platí, keď ho aspoň jeden z nich nevyvráti.
// Kedy sa osvedčil: nálezom zodpovedajú opravy v barbershop-30/docs/CHECKS.md časť 8 (2026-10-09/10). Tam je
// aj zapísané: nepotvrdené skeptikmi (limit relácie), nálezy prijaté po vlastnom overení kódu a snímok.
// Spustenie: nástroj Workflow so scriptPath na tento súbor. ROOT a cesty k snímkam sú z pôvodnej relácie.
// Oproti originálu pribudol len tento komentár.

const ROOT = '/home/user/head-spa-30/barbershop-30'
const COMMON = `Pracuješ v repozitári ${ROOT} (statický web BARBERSHOP 30, Nitra; podpriečinok repozitára head-spa-30). Pravidlá: po slovensky, žiadna zmienka o AI nikde, nič nevymýšľať. NESPÚŠŤAJ prehliadačové testy ani Playwright (bežia práve inde a súperili by o CPU) – iba čítaj súbory, používaj grep, python3 -I na výpočty a pozeraj hotové snímky. Dokumenty: docs/MASTER_BRIEF.md (záväzný brief), docs/TOUR_DIRECTION.md (smer prehliadky, časť „Technika“ a „Úvod ako film“), docs/CHECKS.md. Dnešné zmeny: (1) zábery filmu v maximálnom detaile – source/tools/film.py vyrobilo assets/img/film/<meno>-{1086,1448,2172,2896}.{avif,webp}, pre vstup aj -4096, a pre telefón výrezy na výšku <meno>-m-{1086,1448} + <meno>-m-hlbka.webp; zoznam v assets/img/film/film.json; source/tools/stills.py prepísal zálohy <picture class="film-still"> a kotvy .film-shot (data-size, data-tiers, data-m, data-m-size, data-m-tiers, data-fm, data-pro-*) v index.html; (2) assets/film.js: výber výrezu -m na telefóne (shotOf), stupne podľa data-tiers (pickSize, CAP 1448 telefón / 2896 počítač / 4096 prológ), mipmapy + trilineárne filtrovanie + anizotropia pri ručnom nahrávaní po pásoch (upload), hustejšia mriežka na telefóne (SEG 112×200), a nový jednotný prechod medzi zábermi: hĺbka v alfe render targetov (varying vZ), post shader prelína každý bod podľa hĺbky (o = 0,5·a.a + 0,5·b.a; m = smoothstep(o·0,45, o·0,45+0,55, uMix)), šero 18 % a vinetácia uprostred, dĺžka prechodu podľa výšky okna (span = clamp(0,55·innerHeight/gap, 0,16, 0,3)), uAmt 0,42→0,52 pri prechode, nájazd/dojazd kamery v place(), ladiace háky proFreeze/fadeFreeze. Rozdiel oproti nasadenej verzii: git -C /home/user/head-spa-30 diff 2d89d1b -- barbershop-30/assets/film.js barbershop-30/index.html barbershop-30/assets/style.css barbershop-30/source/tools/film.py. Vráť len skutočné nálezy s dôkazom (súbor:riadok, citát, výpočet); nič nevymýšľaj; keď si nie si istý, povedz to v confidence.`

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
  { key: 'kod', prompt: `${COMMON}\n\nTvoj pohľad: KÓD assets/film.js (prečítaj celý súbor aj diff). Hľadaj skutočné chyby: (a) shotOf/tiersOf a výber -m na telefóne vrátane prológu (data-pro-m, data-pro-fm, data-pro-m-size, data-pro-m-tiers) – súlad s atribútmi v index.html; (b) pickSize so stupňami a CAP, rohozka má stupne 1086/1448/2172 (súbor -2172 je 1920 px) a rohozka-m len 1086 (900 px); (c) mipmapy pri ručnom nahrávaní po pásoch: three r169 initTexture s generateMipmaps=false a minFilter LinearMipmapLinearFilter, potom gl.generateMipmap po poslednom páse – je textúra v tom čase naviazaná a kompletná, nebude WebGL2 vzorkovať čierno kým nie sú mipmapy, čo sa stane pri upgrade veľkosti (old texture dispose), čo pri zrušení (live() false)? anizotropia cez t.anisotropy pred initTexture; (d) post shader: alfa render targetov (WebGLRenderTarget predvolene RGBA UnsignedByte? premultiplied? clear alpha z setClearColor(…,1) = „blízko“ pre prázdne miesta), mix podľa hĺbky, šero, vinetácia vs – matematika smoothstep(o·0,45, o·0,45+0,55, uMix) pokrýva 0..1 pre všetky o?; (e) draw(): span podľa gap (anchors[k+1] môže chýbať pri k = N), uAmt modulácia a návrat na 0,42 aj pri výnimke/preskočení, fadeFreeze; (f) place(): nový nájazd/dojazd (push záporné pri prichádzajúcom), či kamera neprejde cez mriežku (near plane 0,1, DIST 10, uAmt 0,52, push 0,25·DIST); (g) pamäť: 4096×2731 RGBA + mipmapy pre prológ, 2896 pre ostatné – maxTex, drop po prológu; (h) SEG 112×200 na telefóne vs soften() polomer; (i) čokoľvek, čo by pri skrole, skoku cez menu, otočení telefónu alebo strate kontextu zlyhalo. Každý nález: súbor:riadok, citát, prečo, návrh opravy.` },
  { key: 'stranka', prompt: `${COMMON}\n\nTvoj pohľad: STRÁNKA A SÚBORY. Over skriptom (python3 -I) súlad index.html ↔ assets/img/film/film.json ↔ súbory na disku: každý srcset v každej <picture class="film-still"> (aj v <template id="still-uvod">, <template id="still-vstup">, <noscript>) ukazuje na existujúce súbory a šírky v „w“ zodpovedajú skutočným šírkam súborov (rohozka-2172 = 1920w, rohozka-m-1086 = 900w, noznice sa vo filme nepoužíva); každá kotva .film-shot má data-tiers/data-m/data-m-size/data-m-tiers/data-fm zhodné s film.json a súbormi; prológ data-pro-* zhodný; preload v hlavičke (tabuľky S a W v skripte) zhodný so srcset v šablónach pre vstup/vstup-m/rohozka/rohozka-m; media="(max-width: 720px)" rovnaké ako prah telefónu vo film.js; --fmx/--fmy v style.css a v picture; pozadie bez triedy world; robots.txt a sitemap.xml; nikde zmienka o AI/nástrojoch (grep -i "ai\\b|claude|gpt|anthropic|openai" v index.html, assets, docs, README, commit správy posledných 10); slovenčina s diakritikou v nových textoch (README.md, docs/CHECKS.md, docs/TOUR_DIRECTION.md); alt texty záloh; veľkosť assets/img/film a čo sa z toho reálne sťahuje pri prvom obraze (bez filmu) na telefóne a počítači (spočítaj z film.json a srcset). Každý nález: súbor:riadok, dôkaz, oprava.` },
  { key: 'kompozicia', prompt: `${COMMON}\n\nTvoj pohľad: MOBILNÁ KOMPOZÍCIA A OSTROSŤ. Pozri si snímky (Read, sú to PNG): /tmp/claude-0/-home-user/9632978b-2b69-5a1e-a151-fbbea674fc3a/scratchpad/ostre/sceny/scena-{1,2,3,3b,4,5,6,7,8c,9}-mobile.png (nové výrezy -m na telefóne 390×844), /tmp/claude-0/-home-user/9632978b-2b69-5a1e-a151-fbbea674fc3a/scratchpad/ostre/uvod/uvod-mobile-s{000,035,050,100}.png a uvod-desktop-s{000,035,050,100}.png (prológ), a staré snímky z nasadenej verzie v ${ROOT}/docs/screenshots/scena-{1,2,3,5,9}-mobile.jpg na porovnanie. Posúď: je bod záujmu každého záberu vo výreze celý a správne (dvere na fasáde, pult a barber pole v recepcii, kreslo pri okne, červené kreslo v zadnej miestnosti, pumpa Route 66, sud, kreslo uprostred); je hero na telefóne (fotka majiteľa foto-30 na výšku: kreslo, rohožka pod doskou) dobrá voľba oproti slider/3 na počítači – konzistentné miesto?; sú dosky čitateľné a neprekrývajú hlavný motív; sú snímky zreteľne ostrejšie než staré (porovnaj detaily – obklady, nápisy, lampy)? Navrhni konkrétne hodnoty x bodu záujmu (0–1 v pôvodnej fotke na šírku) pre výrezy, ktoré treba posunúť (source/tools/film.py, SHOTS[meno][2]), a prípadné zmeny data-fm. Nálezy s dôkazom (čo na snímke vidíš), nie dojmy.` },
  { key: 'vykon', prompt: `${COMMON}\n\nTvoj pohľad: VÝKON A PAMÄŤ. Vypočítaj (python3 -I, z assets/img/film/film.json a kódu film.js): (1) pamäť textúr v grafike na telefóne (výrez 1448×2575 RGBA ×1,33 s mipmapami; v pamäti naraz až 4 zábery podľa keepAround) a na počítači s DPR 2 pri 1440 px (2896 stupeň ×1,33 ×4) a navyše prológ 4096×2731 ×1,33 – je to únosné pre telefón so 4 GB a Safari (limit pamäte na stránku), pre integrovanú grafiku?; (2) prenesené bajty: prvý obraz bez filmu (záloha -m-1086 na telefóne, 1448 na počítači), prológ (three 170 KB gzip + vstup + rohozka + susedia), celá prehliadka na telefóne (všetky -m-1448) a na počítači DPR 2 (všetky 2896) – porovnaj s pôvodnými 1448/2172 a s cieľmi v MASTER_BRIEF (prvý obraz ≤ 1,5 MB; LCP ≤ 2,5 s na Slow 4G); (3) čas nahrávania po pásoch (BAND 256 riadkov, pump 4 ms/snímku) pre 2896×1931 a 4096×2731 – koľko snímkov trvá, než je záber hotový, a či to pri rýchlom skrole spôsobí prázdne čakanie; (4) riziko: pickSize na DPR 3 telefóne (need = 1,24×1170 = 1451 > 1448×0,95 → vyberie 1448 ✓?) a na tablete 1024 px (phone=false → stupne do 2896, CAP 2896, DPR 2 → need 2540 → 2896 – pamäť?); (5) AVIF q66 vs q58: nárast bajtov na záber a či sa to oplatí (ostrosť vs prenos); (6) mipmapy: generateMipmap na 4096×2731 na mobilnej GPU – trvanie, blokovanie snímky. Daj konkrétne odporúčania (čísla prahov) a nálezy s výpočtom.` },
]

phase('Kontrola')
const reviews = (await parallel(REVIEWS.map((r) => () => agent(r.prompt, { label: `kontrola:${r.key}`, phase: 'Kontrola', schema: FINDINGS })))).filter(Boolean)
const all = reviews.flatMap((r, i) => r.findings.map((f) => ({ ...f, from: REVIEWS[i] ? REVIEWS[i].key : '?' })))
log(`nálezov spolu ${all.length}: ${all.filter((f) => f.severity === 'blocker' || f.severity === 'high').length} blocker/high, ${all.filter((f) => f.severity === 'medium').length} medium`)

phase('Overenie')
const toVerify = all.filter((f) => f.severity !== 'low')
const verified = await parallel(toVerify.map((f, i) => () =>
  parallel([0, 1].map((n) => () => agent(`${COMMON}\n\nSi skeptik č. ${n + 1}. Pokús sa VYVRÁTIŤ tento nález kontroly (${f.from}): „${f.claim}“ (súbor ${f.file}${f.line ? ':' + f.line : ''}; dôkaz kontrolóra: ${f.evidence}; navrhovaná oprava: ${f.fix}). Prečítaj si dotknutý kód/súbor a over to sám (grep, python3 -I výpočet, Read snímok). refuted=true, keď nález neplatí, je už ošetrený inde, alebo by oprava nič nezlepšila; keď si nie si istý, refuted=true a povedz prečo. Uveď aj skutočnú závažnosť.`, { label: `overenie:${f.from}:${i}:${n}`, phase: 'Overenie', schema: VERDICT })))
    .then((vs) => ({ ...f, votes: vs.filter(Boolean), confirmed: vs.filter(Boolean).filter((v) => !v.refuted).length >= 1 && !(vs.filter(Boolean).length === 2 && vs.filter(Boolean).every((v) => v.refuted)) }))
))
const confirmed = verified.filter(Boolean).filter((f) => f.confirmed)
const refuted = verified.filter(Boolean).filter((f) => !f.confirmed)
log(`potvrdené ${confirmed.length}, vyvrátené ${refuted.length}, nízke (neoverované) ${all.length - toVerify.length}`)
return { confirmed, refuted, low: all.filter((f) => f.severity === 'low'), summaries: reviews.map((r, i) => ({ key: REVIEWS[i].key, summary: r.summary })) }