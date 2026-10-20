# Kostra skriptu workflowu

Zdroj: skripty v [`../priklady/`](../priklady/) (ako sa funkcie naozaj používali) a nápoveda nástroja Workflow
v Claude Code (skill `workflow-authoring`). Čo pochádza len z nápovedy a v príkladoch sa neskúšalo, je tak označené.

## Kde skripty sú a ako ich spustiť

- Každé spustenie nástroja Workflow uloží skript do priečinka relácie, mimo repozitára:
  `~/.claude/projects/<priečinok projektu>/<relácia>/workflows/scripts/<meno>-wf_<hash>.js`
  (napr. `audit-fps-wf_2f14c8a8-bf2.js`). Preto sa osvedčené skripty kopírujú do `priklady/`.
- Nástroj Workflow vezme skript ako text, alebo cestu k súboru v `scriptPath` (nápoveda). Príklady
  `filmovy-navrh-podla-videa.js` a `strihaci-prechodov.js` čítajú `args`, treba ich zadať pri spustení.
- Cesty v príkladoch (`/home/user/head-spa-30/…`, scratchpad relácie) sú z pôvodnej relácie. Na inom projekte
  ich zmeň v konštantách na začiatku (`P`, `ROOT`, `HS`, `S`, `SCR`, `R`, `B`, `OUT`) a v spoločnom kontexte.

## Hlavička `meta`

Prvý príkaz skriptu. V príkladoch je komentár až za ňou (`priklady/kontrola-kodu-kompozicie-vykonu.js`):

```js
export const meta = {
  name: 'kontrola-kod-kompozicia-vykon',
  description: 'Nezávislé kontroly webu BARBERSHOP 30 po maximálnom detaile, novom prechode a návrate na ulicu: kód film.js, mobilná kompozícia, výkon a pamäť; potom protiargumenty ku každému nálezu',
  phases: [
    { title: 'Kontrola', detail: 'tri nezávislé pohľady' },
    { title: 'Overenie', detail: 'dvaja skeptici na každý nález' },
  ],
}
```

- `phases[].title` sa zhoduje s `phase('Kontrola')` a s `phase:` v možnostiach agenta.
- Nápoveda: `meta` musí byť čistý literál (bez premenných, volaní funkcií a interpolácie), povinné sú `name`
  a `description`.

## Funkcie, ako ich používajú príklady

### `agent(zadanie, možnosti)`

```js
agent(r.prompt, { label: `kontrola:${r.key}`, phase: 'Kontrola', schema: FINDINGS })
```
(`priklady/kontrola-kodu-kompozicie-vykonu.js`)

- `label`: meno v priebehu (`'integrátor'`, `` `textár ${a.key} (${a.label})` ``, `` `overenie:${f.from}:${i}:${n}` ``).
- `phase`: skupina v priebehu; dôležité vnútri `parallel()` a `pipeline()`.
- `schema`: JSON Schema; agent musí vrátiť objekt podľa nej. Bez schémy vráti text: rozbor videa
  (`refText`) a návrh rozloženia (`layout`) sa vkladajú do ďalších zadaní ako text
  (`priklady/filmovy-navrh-podla-videa.js`), syntéza strihačov vracia markdown.
- `effort: 'high'`: v stavbe, integrácii, kontrolách a opravách (`stavba-webu.js`, `prehliadka-filmu.js`,
  `integracia-a-kontrola.js`) a pri výskume obchodných údajov (`audit-webu.js`).
- Zlyhaný agent vráti `null`. Príklady to ošetrujú `.filter(Boolean)`, podmienkou v ďalšom zadaní
  a predčasným koncom:

```js
if (!integ) { log('Integrátor zlyhal.'); return { film, page, integ } }
```
(`priklady/prehliadka-filmu.js`)

### `parallel(funkcie)`, `Promise.all(sľuby)`

```js
const reviews = (await parallel(REVIEWS.map((r) => () => agent(r.prompt, { label: `kontrola:${r.key}`, phase: 'Kontrola', schema: FINDINGS })))).filter(Boolean)
```

- `parallel` dostane pole **funkcií** (`() => agent(…)`) a počká na všetky.
- `Promise.all` dostane pole **sľubov**; agent beží od chvíle, keď sa zavolá `agent(…)`. Tak sa stavali moduly
  (`stavba-webu.js`, `prehliadka-filmu.js`) a štyri prúdy auditu (`audit-webu.js`).

### `pipeline(položky, fáza1, fáza2, …)`

```js
const results = await pipeline(
  SKILLS,
  (s) => agent(`${BASE}\n\nTvoje priečinky: ${s.dirs.map((d) => OUT + '/' + d).join(', ')}.\n\n${s.prompt}`,
    { label: `píše:${s.key}`, phase: 'Písanie', schema: RESULT }),
  (w, s) => agent(`${BASE}\n\nSi NEZÁVISLÝ OVEROVATEĽ skillu …`,
    { label: `overuje:${s.key}`, phase: 'Overenie', schema: VERDICT }).then((v) => ({ key: s.key, dirs: s.dirs, writer: w, verdict: v })),
)
```
(`priklady/spisanie-toolboxu.js`, zadanie overovateľa skrátené)

- Druhá fáza dostane `(výsledok prvej fázy, pôvodná položka)`, preto netreba položku nosiť vo výsledku.
- Nápoveda: medzi fázami nie je bariéra; položka môže byť v overení, kým iná sa ešte píše.
- S jednou fázou slúži ako súbežné mapovanie dávok: `pipeline(batches, (batch, _, idx) => agent(…))`
  (`audit-webu.js`, tretí parameter je poradie dávky).

### `phase`, `log`, `args`, `return`

```js
phase('Kontrola')
log('Kontrola: ' + ok.length + '/4 správ, nálezov ' + all.length + ', na opravu ' + todo.length)
const A = args
return { film, page, integ, reviews: ok.map(r => ({ verdict: r.verdict, findings: r.findings.length, report: r.report_path })), fix }
```
(`prehliadka-filmu.js`; `const A = args` je zo `strihaci-prechodov.js`)

`return` je výsledok workflowu pre hlavnú reláciu. Veľké výstupy (snímky, diffy, správy) zapisujú agenti do
súborov a vo výsledku sú len cesty (`report_path`, `shots`, `diff`).

## Spustiť skôr, čakať neskôr

Dlhý agent sa spustí bez `await` a výsledok sa vyzdvihne, až keď ho treba (`priklady/filmovy-navrh-podla-videa.js`):

```js
phase('Rozbor')
const refP = agent(`${CTX}
ÚLOHA: Rozober referenčné video do čísel, aby sa dalo verne napodobniť na telefóne aj na počítači.
…`, { label: 'rozbor-videa', phase: 'Rozbor' })
// … medzitým textári, porotcovia a syntéza textov …
const refText = await refP
```

Rovnako `layoutP` a `videoP`, potom `const [layout, video] = await Promise.all([layoutP, videoP])`.

## Prenos stavu medzi fázami

- Súhrn a otvorené body, orezané: `${integ.summary.slice(0, 1500)} | otvorené: ${integ.open_issues.join(' || ').slice(0, 2000)}`
  (`prehliadka-filmu.js`).
- Nálezy ako JSON, orezané: `${JSON.stringify(todo, null, 1).slice(0, 24000)}`.
- Pri zlyhanom autorovi náhradný pokyn pre integrátora (`stavba-webu.js`: ak chýba 3D kreslo, „vytvor minimálnu
  verziu podľa CONTRACT §5“).
- Nálezy dostanú pôvod: `({ ...f, report: r.report_path })`, `({ ...f, from: REVIEWS[i] ? REVIEWS[i].key : '?' })`.

## Počet agentov (spočítané z kódu príkladov)

| Príklad | Agentov |
| --- | --- |
| `audit-webu.js` | 6 (výskum, 3 dávky fotiek, referencie, technika) |
| `stavba-webu.js` | 4 (3 moduly, integrátor) |
| `integracia-a-kontrola.js` | 6 (integrátor, 4 kontrolóri, opravár) |
| `prehliadka-filmu.js` | 8 (2 moduly, integrátor, 4 kontrolóri, opravár) |
| `kontrola-ostrosti-prechodov.js` | 4 + 2 × počet nálezov okrem low |
| `kontrola-kodu-kompozicie-vykonu.js` | 3 + 2 × počet nálezov okrem low |
| `filmovy-navrh-podla-videa.js` | 10 (rozbor, 3 textári, 2 porotcovia, syntéza, rozloženie, videá, kritik) |
| `strihaci-prechodov.js` | 6 (3 strihači, 2 porotcovia, syntéza) |
| `textari-popisov.js` | 7 (3 textári, 2 porotcovia, syntéza, kontrola) |
| `audit-fps.js` | 6 (3 audítori, 3 skeptici) |
| `spisanie-toolboxu.js` | 14 (7 autorov, 7 overovateľov) |

Dvaja skeptici na nález rastú s počtom nálezov; pri kontrolách v CHECKS 8 overenie nedobehlo (limit relácie).
Jeden skeptik na oblasť (`audit-fps.js`) je pevne 3 agenti.

## Čo v skripte nejde (nápoveda, v príkladoch sa nepoužíva)

- `Date.now()`, `Math.random()` a `new Date()` bez argumentu hodia chybu (kvôli obnoveniu behu). Dátum daj do
  zadania ako text (`audit-webu.js`: „Dnešný dátum: 2026-10-09.“) alebo cez `args`.
- Skript nemá prístup k súborom ani k API Node.js; súbory čítajú a píšu agenti.
- Obyčajný JavaScript, nie TypeScript.
- Prerušený beh sa dá podľa nápovedy obnoviť (`scriptPath` a `resumeFromRunId`; najdlhší nezmenený začiatok
  volaní agentov sa vráti z pamäte, od prvého zmeneného volania beží všetko znova). Pri nedobehnutých behoch
  CHECKS 8 a 10 obnovenie nespomínajú: nálezy sa overili ručne, strih sa vybral z hotových návrhov.

## Kostra na skopírovanie: integrácia, kontroly, oprava

Skrátené z `priklady/prehliadka-filmu.js` (zadania nahradené `…`, kód ponechaný):

```js
export const meta = {
  name: 'barbershop30-prehliadka',
  description: '…',
  phases: [
    { title: 'Stavba', detail: '…' },
    { title: 'Integrácia', detail: '…' },
    { title: 'Kontrola', detail: 'prístupnosť, pravdivosť, výkon, kreatíva' },
    { title: 'Oprava', detail: 'oprava nálezov, záznam kontrol' },
  ],
}

const P = '/home/user/head-spa-30/barbershop-30'
const BASE = `Projekt: … Záväzné dokumenty: … ROZHRANIE FILM ↔ STRÁNKA (záväzné pre oba moduly): …`

const RESULT = { type: 'object', properties: { files: { type: 'array', items: { type: 'string' } }, summary: { type: 'string' }, open_issues: { type: 'array', items: { type: 'string' } }, notes: { type: 'string' } }, required: ['files', 'summary', 'open_issues', 'notes'] }
const REVIEW = { type: 'object', properties: { verdict: { type: 'string', enum: ['pass', 'pass_with_fixes', 'fail'] }, checks_run: { type: 'array', items: { type: 'string' } }, findings: { type: 'array', items: { type: 'object', properties: { severity: { type: 'string', enum: ['blocker', 'high', 'medium', 'low'] }, area: { type: 'string' }, evidence: { type: 'string' }, fix: { type: 'string' } }, required: ['severity', 'area', 'evidence', 'fix'] } }, report_path: { type: 'string' } }, required: ['verdict', 'checks_run', 'findings', 'report_path'] }

phase('Stavba')
const [film, page] = await Promise.all([
  agent(`${BASE}\n\nTVOJA ÚLOHA … (vlastníš: …)`, { label: 'film s hĺbkou', phase: 'Stavba', schema: RESULT, effort: 'high' }),
  agent(`${BASE}\n\nTVOJA ÚLOHA … (vlastníš: …)`, { label: 'stránka prehliadky', phase: 'Stavba', schema: RESULT, effort: 'high' }),
])
log('Stavba: ' + [film, page].filter(Boolean).map(r => r.files.length + ' súborov').join(' + '))

phase('Integrácia')
const integ = await agent(`${BASE}\n\nTVOJA ÚLOHA … INTEGRÁTOR … STRÁNKA: ${page ? page.summary + ' | otvorené: ' + page.open_issues.join('; ') + ' | notes: ' + page.notes : 'agent zlyhal'} …`, { label: 'integrátor', phase: 'Integrácia', schema: RESULT, effort: 'high' })
if (!integ) { log('Integrátor zlyhal.'); return { film, page, integ } }

phase('Kontrola')
const COMMON = `${BASE}
Si NEZÁVISLÝ kontrolór. Web NEUPRAVUJ (len zapíš správu do docs/reviews/<oblast>.md). … Stav po integrácii: ${integ.summary.slice(0, 1500)} | otvorené: ${integ.open_issues.join(' || ').slice(0, 2000)}`
const reviews = await parallel([
  () => agent(`${COMMON}\nOBLASŤ: prístupnosť a odolnosť (docs/reviews/pristupnost.md). …`, { label: 'kontrola: prístupnosť', phase: 'Kontrola', schema: REVIEW, effort: 'high' }),
  () => agent(`${COMMON}\nOBLASŤ: pravdivosť a SEO (docs/reviews/pravdivost.md). …`, { label: 'kontrola: pravdivosť', phase: 'Kontrola', schema: REVIEW, effort: 'high' }),
  () => agent(`${COMMON}\nOBLASŤ: výkon (docs/reviews/vykon.md). …`, { label: 'kontrola: výkon', phase: 'Kontrola', schema: REVIEW, effort: 'high' }),
  () => agent(`${COMMON}\nOBLASŤ: kreatívny posudok (docs/reviews/kreativa.md). …`, { label: 'kontrola: kreatíva', phase: 'Kontrola', schema: REVIEW, effort: 'high' }),
])
const ok = reviews.filter(Boolean)
const all = ok.flatMap(r => r.findings.map(f => ({ ...f, report: r.report_path })))
const todo = all.filter(f => ['blocker', 'high', 'medium'].includes(f.severity)).sort((a, b) => ['blocker', 'high', 'medium'].indexOf(a.severity) - ['blocker', 'high', 'medium'].indexOf(b.severity))
log('Kontrola: ' + ok.length + '/4 správ, nálezov ' + all.length + ', na opravu ' + todo.length)

phase('Oprava')
const fix = await agent(`${BASE}
Si opravár. Správy: ${ok.map(r => r.report_path).join(', ')}. NÁLEZY NA OPRAVU (blocker, high, medium):
${JSON.stringify(todo, null, 1).slice(0, 24000)}
Pravidlá: oprav príčinu, over rovnakým meraním/screenshotom (pred/po), nič neskrývaj aby test prešiel, … Výstup: files, summary, open_issues, notes.`, { label: 'opravár', phase: 'Oprava', schema: RESULT, effort: 'high' })

return { film, page, integ, reviews: ok.map(r => ({ verdict: r.verdict, findings: r.findings.length, report: r.report_path })), fix }
```

Ak má kontrola overovať nálezy skeptikmi namiesto priamej opravy, vymeň fázu Oprava za fázu Overenie
z `priklady/kontrola-kodu-kompozicie-vykonu.js` (SKILL.md, vzor 4A).
