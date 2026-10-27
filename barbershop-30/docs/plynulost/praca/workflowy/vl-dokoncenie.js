export const meta = {
  name: 'visionary-living-dokoncenie',
  description: 'VISIONARY LIVING: dokončenie webu – 4 audity (funkcie ‖ vzhľad ‖ SEO a fakty ‖ výkon a prístupnosť) → oprava → overenie → skeptik; otázky pre klienta a hárky pred/po',
  phases: [
    { title: 'Audit', detail: '4 nezávislé audity všetkých 20 stránok' },
    { title: 'Oprava', detail: 'jeden zapisovateľ, generátor zostav.py, testy' },
    { title: 'Overenie', detail: 'tie isté 4 audity; najviac 1 ďalšie kolo' },
    { title: 'Skeptik', detail: 'poslať majiteľovi?' },
  ],
}
const SP = '/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad'
const REPO = '/home/user/head-spa-30'
const WEB = REPO + '/visionary-living'
const OUT = SP + '/visionary/dokoncenie'
const KONTEXT = `KONTEXT (rozhovor s majiteľom nevidíš): web VISIONARY LIVING (developerský projekt dvojizbových a trojizbových bytov v obci Černík) v ${WEB} – statický web „projektová dokumentácia“ (README.md, docs/NAVRH.md záväzný brief, docs/ZDROJE.md zdroje a neoverené veci; generátor source/zostav.py → 20 stránok + sitemap + robots; obrázky source/obrazky.py; písma source/pisma.py; test node source/kontrola.mjs; náhľad https://d8f5s88zjy-art.github.io/head-spa-30/visionary-living/ s noindex). Repozitár ${REPO} na vetve claude/subor-idk-fotografie-fitka-5lqm3q (vetva tejto relácie; v iných podpriečinkoch repozitára nič nemeň). Majiteľ (27. 10.): „Dokonči web pre Visionary.“ Web je postavený a testy prešli; teraz ho treba dokončiť: nikde žiadne chyby, všetko funguje na telefóne aj počítači, vzhľad bez chýb, SEO pripravené na doménu, rýchly a prístupný, a zoznam vecí, ktoré musí potvrdiť klient (README časť Nasadenie, ZDROJE časť Neoverené).
Pravidlá: texty a čísla len z docs/ZDROJE.md / pôvodného webu – nič nevymýšľať (ani ceny, termíny, adresy, IČO, mená); dizajn podľa docs/NAVRH.md (bez prerábania koncepcie); žiadne čierne polia ani okná; ostré obrázky; žiadna zmienka o AI na webe ani v commitoch. Zmeny rob cez generátor (zostav.py, obsah.json) a pregeneruj; ručne needituj vygenerované HTML. Commity po slovensky, BEZ podpisových riadkov (žiadne Co-Authored-By ani Claude-Session), len lokálne – NIKDY push, merge, reset --hard, rm -rf mimo dočasných priečinkov; nič nenasadzovať. Každé tvrdenie dolož príkazom s výstupom, cestou:riadkom alebo snímkou, ktorú si OTVORIL nástrojom Read. Po slovensky so správnou diakritikou. Prehliadač: Playwright createRequire('/opt/node22/lib/node_modules/'), Chromium /opt/pw-browsers (nič neinštaluj); server python3 -I -m http.server <port> --bind 127.0.0.1 --directory ${REPO}, stránka /visionary-living/. Snímky ukladaj ako JPEG, pracovné súbory nad 50 MB maž (disk je malý).`
const NAL = { type: 'object', properties: { audit: { type: 'string' }, ok: { type: 'boolean' }, nalezy: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, zavaznost: { type: 'string', enum: ['vazna', 'stredna', 'drobna'] }, nazov: { type: 'string' }, dokaz: { type: 'string' }, navrh: { type: 'string' }, subor: { type: 'string' } }, required: ['id', 'zavaznost', 'nazov', 'dokaz', 'navrh', 'subor'] } }, pre_klienta: { type: 'array', items: { type: 'string' } }, preslo: { type: 'array', items: { type: 'string' } }, zapis: { type: 'string' } }, required: ['audit', 'ok', 'nalezy', 'pre_klienta', 'preslo', 'zapis'] }
const ODOV = { type: 'object', properties: { zhrnutie: { type: 'string' }, commity: { type: 'array', items: { type: 'string' } }, opravene: { type: 'array', items: { type: 'string' } }, neopravene: { type: 'array', items: { type: 'string' } }, subor: { type: 'string' } }, required: ['zhrnutie', 'commity', 'opravene', 'neopravene', 'subor'] }

const AUDITY = [
  { k: 'V1-funkcie', porty: '8930–8934', t: `AUDIT FUNKCIÍ: všetkých 20 stránok na počítači (1440×900) aj telefóne (390×844 DPR 3, dotyk): menu, všetky odkazy (interné aj tel:, mailto:), výber bytu na fasáde (klik, dotyk, klávesnica, filter), panel bytu, tabuľka, stránky bytov (lupa pôdorysu, susedné byty), cesta financovania so skrolom, galéria a lupa (dialóg, šípky, Esc), formulár (chyby pod poľami, ?byt=A1 predvyplní, odoslanie mailto), cookies/ochrana súkromia, beh bez JS a s obmedzeným pohybom. Zbieraj chyby konzoly, neúspešné požiadavky, mŕtve odkazy, tlačidlá bez účinku. Spusti node source/kontrola.mjs a zapíš výsledok.` },
  { k: 'V2-vzhlad', porty: '8935–8939', t: `AUDIT VZHĽADU: šírky 320, 360, 375, 390, 412, 430 (na výšku aj na šírku), 768, 820, 1024, 1280, 1366, 1440, 1536, 1920, 2560 – každá stránka po sekciách: pretečenie, prekryté/odrezané texty, rozbité zalomenie nadpisov, prázdne/čierne plochy aj počas načítania a kreslenia výkresov, neostré či roztiahnuté obrázky (porovnaj prirodzenú veľkosť s vykreslenou × DPR), konzistencia rámu listu a pečiatky, diakritika v písmach (orezané písma!), tmavý režim ak je. Hárky snímok s vyznačením chýb.` },
  { k: 'V3-seo-fakty', porty: '8940–8944', t: `AUDIT SEO A FAKTOV: title/description (dĺžky, jedinečnosť), canonical a og (BASE v zostav.py), noindex (zámerne – over, že prepnutie na doménu je jedným nastavením a README to popisuje), sitemap/robots, štruktúrované dáta (či sú a či nič nevymýšľajú – napr. Residence/ApartmentComplex/Offer len s údajmi zo ZDROJE), nadpisy, alt texty, interné odkazy, lang. FAKTY: každé číslo a tvrdenie na webe porovnaj s docs/ZDROJE.md (ceny, plochy, podlažia, termíny, dostupnosť, kontakty) – nesúlad je vážny nález. Zostav zoznam otázok pre klienta (pre_klienta) z README Nasadenie a ZDROJE Neoverené plus všetko nové, čo nájdeš.` },
  { k: 'V4-vykon', porty: '8945–8949', t: `AUDIT VÝKONU A PRÍSTUPNOSTI: telefón (CPU 4×, 4G 10 Mb/s RTT 60 ms) a počítač – bajty prvej obrazovky a do load, LCP, CLS, TBT, rAF medzery pri skrole (hlavne Financovanie a kreslenie výkresov), veľkosť obrázkov vs. zobrazenie, písma (preload, FOUT). Prístupnosť: kontrast, popisy, poradie a viditeľnosť fokusu, klávesnica (menu, fasáda, dialóg, formulár), aria stavy, dotykové ciele ≥ 44 px, reduced-motion.` },
]
const audit = (a, kolo, extra) => agent(`${KONTEXT}\n\nROLA: nezávislý audítor (${a.k}, kolo ${kolo}); v repozitári nič nemeníš, píš len do ${OUT}/${a.k}/kolo-${kolo}/. Porty ${a.porty}. ${a.t}${extra || ''}\nKaždý nález s id, závažnosťou (vazna = nefunguje / viditeľná chyba / nepravdivý údaj / škodí SEO; stredna; drobna), dôkazom a súborom:riadkom. Zapíš ${OUT}/${a.k}/kolo-${kolo}/ZAPIS.md.`, { label: `${a.k}:${kolo}`, phase: kolo === 0 ? 'Audit' : 'Overenie', schema: NAL, effort: 'high' })

phase('Audit')
const D = (await parallel(AUDITY.map((a) => () => audit(a, 0)))).filter(Boolean)
if (!D.length) return { stav: 'ZLYHALO', dovod: 'audity nedobehli' }
const otazky = [...new Set(D.flatMap((d) => d.pre_klienta || []))]

phase('Oprava')
const oprava = (kolo, podklad) => agent(`${KONTEXT}\n\nROLA: senior front-end (jediný zapisovateľ v ${WEB}). Porty 8950–8954. Kolo ${kolo}. Podklady auditov (prečítaj): ${podklad}\nOprav všetky vážne a stredné nálezy a lacné bezpečné drobné – cez generátor, potom python3 source/zostav.py a node source/kontrola.mjs (musí prejsť). Nič nevymýšľaj; čo potrebuje údaj od klienta, nechaj tak a zapíš do neopravene. Zapíš aj ${WEB}/docs/OTAZKY-PRE-KLIENTA.md (stručne, po slovensky, čo musí klient potvrdiť alebo dodať pred spustením na doméne: ${JSON.stringify(otazky).slice(0, 3000)} + čo zistíš) a doplň README. Hárok pred/po pre majiteľa ${OUT}/pred-po.jpg (≤ 2,5 MB, popisy po slovensky; telefón aj počítač, miesta, kde sa niečo zmenilo – PRED = HEAD pred tvojimi commitmi). OTVOR ho. Commity po slovensky po logických celkoch („VISIONARY LIVING: …“), bez podpisov. Zapíš ${OUT}/oprava-${kolo}.md.`, { label: `oprava:${kolo}`, phase: kolo === 1 ? 'Oprava' : 'Overenie', schema: ODOV, effort: 'xhigh' })
let O = await oprava(1, D.map((d) => d.zapis).join(', '))
if (!O) return { stav: 'ZLYHALO', dovod: 'oprava nedobehla', D }

let kolo = 1, V = []
while (true) {
  phase('Overenie')
  V = (await parallel(AUDITY.map((a) => () => audit(a, kolo, `\n\nOVERENIE PO OPRAVE (${O.subor}): over každý predchádzajúci nález (${OUT}/${a.k}/kolo-${kolo - 1}/ZAPIS.md) a hľadaj nové chyby aspoň jedným novým spôsobom (oprava mohla niečo pokaziť).`)))).filter(Boolean)
  const vazne = V.flatMap((v) => v.nalezy.filter((n) => n.zavaznost === 'vazna'))
  if (!vazne.length || kolo >= 2) break
  O = await oprava(kolo + 1, V.map((v) => v.zapis).join(', '))
  if (!O) return { stav: 'ZLYHALO', dovod: 'oprava 2 nedobehla', V }
  kolo++
}

phase('Skeptik')
const VS = { type: 'object', properties: { poslat: { type: 'boolean' }, dovod: { type: 'string' }, pre_majitela: { type: 'string' }, nepotvrdene: { type: 'array', items: { type: 'string' } } }, required: ['poslat', 'dovod', 'pre_majitela', 'nepotvrdene'] }
const sk = await agent(`${KONTEXT}\n\nROLA: skeptik. Tvrdenie: „Web Visionary Living je dokončený: všetkých 20 stránok funguje na telefóne aj počítači bez chýb, vzhľad je bez chýb na všetkých šírkach, každý údaj sedí so zdrojom, SEO je pripravené na prepnutie na doménu, web je rýchly a prístupný, a docs/OTAZKY-PRE-KLIENTA.md obsahuje všetko, čo musí klient potvrdiť; commity bez podpisov.“ Podklady ${OUT}/. Over aspoň 8 tvrdení vlastnými sondami (porty 8955–8959, prehliadač najviac 8 min). Pri neistote poslat=false. pre_majitela: 4–6 viet bez žargónu. Zapíš ${OUT}/SKEPTIK.md.`, { label: 'skeptik', phase: 'Skeptik', schema: VS, effort: 'high' })
return { stav: sk ? (sk.poslat ? 'POSLAT' : 'NEPOSLAT') : 'BEZ_SKEPTIKA', skeptik: sk, O, V, otazky }
