export const meta = {
  name: 'barbershop-texty-recepcia-prevadzky',
  description: 'Barbershop 30: údernejšie texty pri barberoch (garancia, skúsenosti), recepcia vs. barber v častých otázkach, odkazy na HEAD SPA 30 / Salón 30 / Barbershop 30 v pätičke; 3 návrhy textov → porota → stavba v 8 jazykoch → kontrola (texty a fakty ‖ kód a vzhľad) → skeptik',
  phases: [
    { title: 'Texty', detail: '3 copywriteri, len z faktov webu; otázky pre majiteľa' },
    { title: 'Porota', detail: 'oči majiteľa ‖ pravdivosť a právo' },
    { title: 'Stavba', detail: 'index.html, i18n 8 jazykov, en/, pätička, testy, pred/po, commit' },
    { title: 'Kontrola', detail: 'texty a fakty ‖ kód a vzhľad; najviac 1 oprava' },
    { title: 'Skeptik', detail: 'poslať majiteľovi?' },
  ],
}
const SP = '/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad'
const STROM = SP + '/hs-skvrny'
const WEB = STROM + '/barbershop-30'
const OUT = SP + '/barber/texty'
const BAZA = 'bdabff7'
const KONTEXT = `KONTEXT (rozhovor s majiteľom nevidíš): web BARBERSHOP 30 (Nitra, Mostná 30), statický web ${WEB} (index.html; preklady assets/i18n/*.json pre cs, en, de, hu, pl, sr, uk – slovenčina je v HTML; anglická stránka en/ sa generuje cez source/tools/en-stranka.mjs; testy v source/tools: i18n-test.mjs, en-test.mjs, app-smoke.mjs, vychytavky-test.mjs, tma-test.mjs, admin-test.mjs; sekcie: úvod, služby a cenník, tím barberov (Nikolas, Kristián, Damian, Michal, Andy, Dominika, Kevin, Lajko, Jojo, Adrian…), recenzie, časté otázky, rezervácia, kontakt, pätička). Strom ${STROM} = git worktree (sparse) na vetve barbershop-skvrny = origin/barbershop-oprava (HEAD ${BAZA}: oprava čiernych škvŕn vo filme + SEO). Majiteľ (27. 10.) chce: (1) pri barberoch údernejšie, „pikantnejšie“ texty – garancia, skúsenosti a podobne, aby zákazník chcel prísť; (2) do častých otázok napísať, že máme recepčnú, ktorá sa postará o termíny a pohodlie, a barber o výsledok – preto je vždy lepšie kontaktovať recepciu než barbera, ktorý sa venuje zákazníkovi; (3) na konci stránky odkazy na naše prevádzky HEAD SPA 30, Salón 30 a Barbershop 30, aby sa dalo klikať rovno na ne.
Pravidlá (záväzné): NIČ NEVYMÝŠĽAŤ – každý fakt (roky praxe, počet zákazníkov, ocenenia, čo garancia znamená, otváracie hodiny, mená) len z textov webu, assets/i18n, docs/ a ${SP}/dennik/barbershop-30/docs/plynulost/OTAZKY-PRE-MAJITELA.md (čo je tam NEPOTVRDENÉ, nepoužívaj ako fakt); „garancia“ smie byť na webe len ako konkrétny záväzok, ktorý majiteľ potvrdí – navrhni 2–3 znenia a označ ich ako NA POTVRDENIE (do stavby ide verzia bez nepotvrdených čísel a sľubov, napr. „Ak nebudeš spokojný, povedz to recepcii ešte v kresle – dáme to do poriadku“ len ak majiteľ potvrdí; inak sa garancia na webe neukáže a ostane v otázkach pre majiteľa); „spicy“ = sebavedomý, priamy, mužský tón bez vulgarít, bez porovnávania konkurencie, bez zdravotných sľubov; žiadna zmienka o AI. Odkazy na prevádzky len na overené adresy (curl 200; HEAD SPA 30 = web v tomto repozitári / jeho doména podľa canonical v koreňovom index.html; Salón 30 – nájdi overenú adresu na webe/v docs/booqme, ak nie je, odkaz na rezerváciu Booqme alebo telefón a zapíš otázku pre majiteľa). Vzhľad ostatných častí nemeniť; film.js nemeniť. Všetko v 8 jazykoch (preklady doplniť do i18n JSON a en/ pregenerovať; i18n-test musí prejsť). Commity po slovensky, BEZ podpisových riadkov (žiadne Co-Authored-By ani Claude-Session), len lokálne – NIKDY push, merge, reset --hard, rm -rf mimo dočasných priečinkov; nič nenasadzovať. Každé tvrdenie dolož príkazom s výstupom, cestou:riadkom alebo snímkou, ktorú si OTVORIL nástrojom Read. Po slovensky so správnou diakritikou. Prehliadač: Playwright createRequire('/opt/node22/lib/node_modules/'), Chromium /opt/pw-browsers (nič neinštaluj); server python3 -I -m http.server <port> --bind 127.0.0.1 --directory ${STROM}, stránka /barbershop-30/index.html?asistent=ukazka&objednavka=ukazka. Snímky ako JPEG.`
const TEXTY = { type: 'object', properties: { k: { type: 'string' }, barberi: { type: 'string' }, faq: { type: 'string' }, patka: { type: 'string' }, garancia_na_potvrdenie: { type: 'array', items: { type: 'string' } }, otazky_pre_majitela: { type: 'array', items: { type: 'string' } }, subor: { type: 'string' } }, required: ['k', 'barberi', 'faq', 'patka', 'garancia_na_potvrdenie', 'otazky_pre_majitela', 'subor'] }
const SKORE = { type: 'object', properties: { body: { type: 'object', properties: { A: { type: 'number' }, B: { type: 'number' }, C: { type: 'number' } }, required: ['A', 'B', 'C'] }, vitaz: { type: 'string' }, stepy: { type: 'string' }, skrty: { type: 'string' }, subor: { type: 'string' } }, required: ['body', 'vitaz', 'stepy', 'skrty', 'subor'] }
const ODOV = { type: 'object', properties: { zhrnutie: { type: 'string' }, commity: { type: 'array', items: { type: 'string' } }, merania: { type: 'array', items: { type: 'string' } }, snimky: { type: 'array', items: { type: 'string' } }, nedokoncene: { type: 'array', items: { type: 'string' } }, subor: { type: 'string' } }, required: ['zhrnutie', 'commity', 'merania', 'snimky', 'nedokoncene', 'subor'] }
const NAL = { type: 'object', properties: { ok: { type: 'boolean' }, verdikt: { type: 'string' }, nalezy: { type: 'array', items: { type: 'object', properties: { zavaznost: { type: 'string', enum: ['vazna', 'stredna', 'drobna'] }, nazov: { type: 'string' }, dokaz: { type: 'string' }, navrh: { type: 'string' } }, required: ['zavaznost', 'nazov', 'dokaz', 'navrh'] } }, subor: { type: 'string' } }, required: ['ok', 'verdikt', 'nalezy', 'subor'] }

phase('Texty')
const TONY = [
  { k: 'A', t: 'tón „sebavedomý remeselník“: krátke úderné vety, remeslo, precíznosť, výsledok, ktorý vidíš v zrkadle' },
  { k: 'B', t: 'tón „pánsky klub“: atmosféra, rituál, pohodlie, recepcia ako hostiteľ, barber ako majster' },
  { k: 'C', t: 'tón „bez okolkov“: humor s mierou, priamo k veci, prečo prísť práve sem a prečo volať recepciu' },
]
const T3 = (await parallel(TONY.map((t) => () => agent(`${KONTEXT}\n\nROLA: senior copywriter (${t.t}). Prečítaj index.html (celý text webu), i18n sk texty v HTML, docs/ a OTAZKY-PRE-MAJITELA.md. Napíš do ${OUT}/texty-${t.k}.md: (1) texty pri barberoch – spoločný úvod sekcie tímu (2–3 vety) a ku každému barberovi 1 krátky úderný riadok (len z toho, čo o ňom web hovorí – špecializácia, od kedy, čo robí rád; ak web nič nehovorí, všeobecný riadok bez faktov), plus 3 „piliere“ (napr. Skúsenosti, Precíznosť, Garancia) – každý 1 veta, pri garancii 2–3 znenia NA POTVRDENIE majiteľom; (2) 2–3 nové časté otázky: „Mám volať barberovi alebo recepcii?“ (recepčná = termíny a pohodlie, barber = výsledok, barber sa venuje zákazníkovi v kresle, preto recepcia), „Čo ak nebudem spokojný?“ (len ak garancia potvrdená – inak znenie s „povedz to hneď, dáme to do poriadku“ označ NA POTVRDENIE), prípadne „Môžem prísť bez objednania?“ len ak web odpoveď pozná; (3) pätička: blok „Naše prevádzky“ s HEAD SPA 30, Salón 30, Barbershop 30 (1 riadok ku každej, len overené fakty – čo je ktorá prevádzka, podľa webov/dokumentov; adresy over curl) – zisti presné adresy webov; (4) otázky pre majiteľa. Max. dĺžky: riadok barbera ≤ 90 znakov, pilier ≤ 140, odpoveď FAQ ≤ 320.`, { label: `texty ${t.k}`, phase: 'Texty', schema: TEXTY, effort: 'high' })))).filter(Boolean)
if (!T3.length) return { stav: 'ZLYHALO', dovod: 'texty' }

phase('Porota')
const PODKLAD = T3.map((t) => `Návrh ${t.k} (${t.subor}):\nBARBERI: ${t.barberi.slice(0, 1500)}\nFAQ: ${t.faq.slice(0, 900)}\nPÄTKA: ${t.patka.slice(0, 500)}\nGARANCIA NA POTVRDENIE: ${t.garancia_na_potvrdenie.join(' | ').slice(0, 400)}`).join('\n\n')
const P = (await parallel([
  ['majitel', 'oči majiteľa barbershopu a jeho zákazníka: je to „spicy“, sebavedomé, chce človek prísť? nie je to trápne, prehnané ani urážlivé? sedí tón s webom? pochopí zákazník, prečo volať recepciu?'],
  ['pravda', 'strážca pravdivosti a práva: každé tvrdenie má oporu v textoch webu/dokumentov; žiadne nepotvrdené čísla, sľuby, zdravotné tvrdenia, porovnávanie konkurencie; garancia len ako NA POTVRDENIE; odkazy na prevádzky overené'],
].map(([k, t]) => () => agent(`${KONTEXT}\n\nROLA: porotca – ${t}. Nezávislý, nič nemeníš. Ohodnoť 0–10 (kľúče A, B, C; chýbajúci 0), vitaz = písmeno, stepy = čo vziať z ostatných, skrty = čo vyhodiť alebo zmeniť (konkrétne vety). Zapíš ${OUT}/porota-${k}.md.\n\n${PODKLAD}`, { label: `porota:${k}`, phase: 'Porota', schema: SKORE, effort: 'high' })))).filter(Boolean)
const sucet = {}
for (const t of T3) sucet[t.k] = P.reduce((a, p) => a + ((p.body || {})[t.k] || 0), 0)
const vit = T3.slice().sort((a, b) => sucet[b.k] - sucet[a.k])[0]
const otazky = [...new Set(T3.flatMap((t) => t.otazky_pre_majitela))]
log(`body ${JSON.stringify(sucet)} → ${vit.k}`)

phase('Stavba')
const S = await agent(`${KONTEXT}\n\nROLA: senior front-end a redaktor (jediný zapisovateľ v ${STROM}). Porty 8800–8809. Postav víťazný návrh ${vit.k} (${vit.subor}) so štepmi a škrtmi poroty:\n${P.map((p) => `- ${p.stepy}\n  ŠKRTY: ${p.skrty}`).join('\n').slice(0, 4000)}\n1) Sekcia tímu: úvod + riadok ku každému barberovi + 3 piliere (garanciu bez potvrdenia NEUVÁDZAJ ako sľub – ak nie je potvrdená, pilier nahraď iným overeným, a garanciu nechaj v docs/OTAZKY ako čakajúcu). 2) Časté otázky: nové otázky podľa návrhu (recepcia vs. barber povinne). 3) Pätička: blok „Naše prevádzky“ s troma odkazmi (overené adresy, target podľa zvyku webu, aktuálna prevádzka označená), aj v en/. 4) Preklady do cs, en, de, hu, pl, sr, uk (verné, prirodzené, rovnaký tón), en/ pregeneruj. 5) Testy: i18n-test, en-test, app-smoke, vychytavky-test, tma-test, admin-test (porovnaj s ${BAZA}: nič nové nesmie padnúť). 6) Snímky telefón 390×844 DPR 3 a počítač 1440×900: tím, FAQ, pätička – PRED (${BAZA}) a PO; hárok ${OUT}/pred-po.jpg (≤ 2,5 MB, popisy po slovensky) – OTVOR ho. 7) docs/OTAZKY-PRE-MAJITELA.md doplň o garanciu a prevádzky (ak chýba adresa Salónu 30). Commity po slovensky, bez podpisov: „Barbershop 30: údernejšie texty tímu, recepcia v častých otázkach a odkazy na prevádzky“ (+ samostatný pre preklady, ak chceš). Zapíš ${OUT}/odovzdavka.md.`, { label: 'stavba', phase: 'Stavba', schema: ODOV, effort: 'xhigh' })
if (!S) return { stav: 'ZLYHALO', dovod: 'stavba', vit: vit.k, sucet, otazky }

let kolo = 1, k1, k2
while (true) {
  phase('Kontrola')
  ;[k1, k2] = await parallel([
    () => agent(`${KONTEXT}\n\nROLA: kontrolór textov a faktov (nezávislý, nič nemeníš). Kolo ${kolo}. Odovzdávka ${S.subor}. Diff git -C ${STROM} diff ${BAZA}..HEAD. Over: každé nové tvrdenie má oporu (súbor:riadok), žiadna garancia bez potvrdenia, tón sedí a nie je trápny, FAQ o recepcii je jasná, preklady v 7 jazykoch sú verné a bez chýb (prečítaj ich), odkazy na prevádzky vedú na správne adresy (curl), žiadna zmienka o AI, commity bez podpisov. Zapíš ${OUT}/kontrola-texty-${kolo}.md.`, { label: `kontrola:texty:${kolo}`, phase: 'Kontrola', schema: NAL, effort: 'high' }),
    () => agent(`${KONTEXT}\n\nROLA: kontrolór kódu a vzhľadu (nezávislý, nič nemeníš). Kolo ${kolo}. Odovzdávka ${S.subor}. Porty 8810–8819. Telefón 390×844 DPR 3, 360×780, počítač 1440×900, 1920×1080 a en/: sekcia tímu, FAQ (otváranie), pätička – pretečenie, zalomenie, prekrytie, kontrast, ciele ≥ 44 px, prepnutie jazykov sk → en → uk → hu; testy (spusti i18n-test, en-test, app-smoke, vychytavky-test, tma-test, admin-test a porovnaj s ${BAZA}); CLS 0; film.js nezmenený (git diff ${BAZA}..HEAD -- barbershop-30/assets/film.js prázdny). Zapíš ${OUT}/kontrola-kod-${kolo}.md.`, { label: `kontrola:kód:${kolo}`, phase: 'Kontrola', schema: NAL, effort: 'high' }),
  ])
  if (!k1 || !k2) return { stav: 'NEOVERENE', S, k1, k2 }
  const vazne = [...k1.nalezy, ...k2.nalezy].filter((n) => n.zavaznost === 'vazna')
  if (!vazne.length || kolo >= 2) break
  const op = await agent(`${KONTEXT}\n\nROLA: senior front-end (jediný zapisovateľ). Porty 8800–8809. Oprav vážne nálezy (${k1.subor}, ${k2.subor}); testy; ak sa zmení vzhľad, obnov hárok. Commit bez podpisov. Zapíš ${OUT}/oprava-${kolo}.md.\n${JSON.stringify(vazne).slice(0, 8000)}`, { label: 'oprava', phase: 'Kontrola', schema: ODOV, effort: 'high' })
  if (!op) return { stav: 'ZLYHALO', dovod: 'oprava', vazne }
  kolo++
}

phase('Skeptik')
const VS = { type: 'object', properties: { poslat: { type: 'boolean' }, dovod: { type: 'string' }, pre_majitela: { type: 'string' }, otazky_pre_majitela: { type: 'array', items: { type: 'string' } }, nepotvrdene: { type: 'array', items: { type: 'string' } } }, required: ['poslat', 'dovod', 'pre_majitela', 'otazky_pre_majitela', 'nepotvrdene'] }
const sk = await agent(`${KONTEXT}\n\nROLA: skeptik. Tvrdenie: „Nové texty tímu sú úderné a pravdivé, FAQ vysvetľuje recepciu vs. barbera, pätička má overené odkazy na HEAD SPA 30, Salón 30 a Barbershop 30, všetko je v 8 jazykoch, testy prechádzajú, vzhľad ostatných častí je nezmenený, commity bez podpisov.“ Podklady ${OUT}/. Over aspoň 6 tvrdení sám (porty 8820–8829, prehliadač najviac 5 min). Otázky pre majiteľa zhrň z ${JSON.stringify(otazky).slice(0, 1500)} a docs/OTAZKY. Pri neistote poslat=false. pre_majitela: 4–6 viet bez žargónu. Zapíš ${OUT}/SKEPTIK.md.`, { label: 'skeptik', phase: 'Skeptik', schema: VS, effort: 'high' })
return { stav: sk ? (sk.poslat ? 'POSLAT' : 'NEPOSLAT') : 'BEZ_SKEPTIKA', skeptik: sk, vit: vit.k, sucet, S, k1, k2 }
