export const meta = {
  name: 'smerovanie-podla-narocnosti',
  description: 'Úlohy podľa náročnosti: mechanické skriptom, jednoduché lacným agentom, zložité silným agentom so skeptikom; spoločná pamäť v súboroch',
  phases: [
    { title: 'Triedenie', detail: 'lacný agent zaradí každú úlohu' },
    { title: 'Práca', detail: 'agent podľa triedy, pamäť v súboroch' },
    { title: 'Overenie', detail: 'skeptik len pri zložitých úlohách' },
  ],
}
// ŠABLÓNA, zatiaľ nespustená (2026-10-12). Pri prvom použití over a doplň do tabuľky v SKILL.md.
// Myšlienky z RuFlo (rozbor: ../../referencie-z-videi/references/naucene-z-videi.md, časť 5) prevedené na nástroj Workflow:
// 1. „Agent Booster“: mechanickú zmenu (nahradenie textu, premenovanie, formát) nerobí agent. Triedenie ju vráti
//    v zozname `skriptom` s presným príkazom a vykoná ju hlavná relácia skriptom (sed, python), lacno a overiteľne.
// 2. Smerovanie modelov: jednoduché úlohy model 'haiku' a effort 'low', stredné zdedia model relácie s effort
//    'medium', zložité model relácie s effort 'high' a skeptikom. Model nastavuj len tam, kde si si istý.
// 3. Spoločná pamäť: každý agent si pred prácou prečíta priečinok args.scratch/pamat/ a na konci doň zapíše
//    krátke zistenia (<id>.md). Pamäť ostáva na disku pre ďalšie úlohy, ďalší beh aj obnovenie (resume).
// args: { scratch: '<pracovný priečinok>', kontext: '<projekt, cesty, pravidlá>', ulohy: [{ id, popis }] }

const PAMAT = `${args.scratch}/pamat`
const KONTEXT = `${args.kontext || ''}
SPOLOČNÁ PAMÄŤ: pred prácou si prečítaj všetky súbory v ${PAMAT}/ (ak existujú), sú to zistenia ostatných agentov.
Na konci zapíš do ${PAMAT}/<id úlohy>.md najviac 10 riadkov: čo si zistil a čo by mal vedieť ďalší (cesty, príkazy,
pasce). Nič iné do pamäte nepíš a cudzie súbory v nej neprepisuj.`

const TRIEDY = {
  type: 'object',
  properties: {
    triedy: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          trieda: { type: 'string', enum: ['skript', 'jednoducha', 'stredna', 'zlozita'] },
          dovod: { type: 'string' },
          prikaz: { type: 'string', description: 'pri triede skript: presný príkaz alebo úprava pre hlavnú reláciu' },
        },
        required: ['id', 'trieda', 'dovod'],
      },
    },
  },
  required: ['triedy'],
}
const VYSLEDOK = {
  type: 'object',
  properties: {
    zhrnutie: { type: 'string' },
    subory: { type: 'array', items: { type: 'string' } },
    dokaz: { type: 'string', description: 'príkaz alebo meranie, ktoré výsledok overuje' },
    otvorene: { type: 'array', items: { type: 'string' } },
  },
  required: ['zhrnutie', 'dokaz'],
}
const VERDIKT = {
  type: 'object',
  properties: { plati: { type: 'boolean' }, chyby: { type: 'array', items: { type: 'string' } }, dokaz: { type: 'string' } },
  required: ['plati', 'chyby', 'dokaz'],
}
const NASTAVENIE = {
  jednoducha: { model: 'haiku', effort: 'low' },
  stredna: { effort: 'medium' },
  zlozita: { effort: 'high' },
}

phase('Triedenie')
const t = await agent(`${KONTEXT}
Zaraď každú úlohu podľa náročnosti. „skript“: mechanická zmena bez rozhodovania (nahradenie textu, premenovanie,
formát), uveď presný príkaz. „jednoducha“: jeden súbor, jasný postup. „stredna“: viac súborov alebo treba čítať
kód. „zlozita“: návrh, výkon, bezpečnosť alebo zmena, ktorú treba overiť skeptikom. Pri pochybnosti vyššia trieda.
ÚLOHY: ${JSON.stringify(args.ulohy)}`, { label: 'triedenie', phase: 'Triedenie', schema: TRIEDY, model: 'haiku', effort: 'low' })

const podla = Object.fromEntries((t ? t.triedy : []).map((x) => [x.id, x]))
const trieda = (u) => (podla[u.id] ? podla[u.id].trieda : 'stredna')   // zlyhané triedenie: všetko ako stredné
const skriptom = args.ulohy.filter((u) => trieda(u) === 'skript').map((u) => ({ ...u, prikaz: podla[u.id].prikaz || '' }))
const agentom = args.ulohy.filter((u) => trieda(u) !== 'skript')
log(`skriptom ${skriptom.length}, agentom ${agentom.length}${t ? '' : ' (triedenie zlyhalo, všetko ako stredné)'}`)

const vysledky = await pipeline(
  agentom,
  (u) => agent(`${KONTEXT}\nÚLOHA ${u.id}: ${u.popis}`, { label: `${trieda(u)}:${u.id}`, phase: 'Práca', schema: VYSLEDOK, ...NASTAVENIE[trieda(u)] }),
  (r, u) => {
    if (!r || trieda(u) !== 'zlozita') return r ? { id: u.id, ...r } : null
    return agent(`${KONTEXT}\nSi skeptik. Over výsledok úlohy ${u.id} („${u.popis}“) a pokús sa ho vyvrátiť: prečítaj súbory,
spusti dôkaz, hľadaj, čo sa rozbilo. Pri pochybnosti plati=false. VÝSLEDOK: ${JSON.stringify(r)}`,
    { label: `overenie:${u.id}`, phase: 'Overenie', schema: VERDIKT, effort: 'high' }).then((v) => ({ id: u.id, ...r, overenie: v }))
  },
)
return { skriptom, vysledky: vysledky.filter(Boolean), zlyhane: agentom.length - vysledky.filter(Boolean).length }
