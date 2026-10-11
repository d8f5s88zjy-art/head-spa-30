# Zadania agentom a schémy výstupu

Všetky citáty sú zo skriptov v [`../priklady/`](../priklady/). Pomlčky (U+2013) zo zdrojov sú v citátoch
nahradené čiarkou alebo vynechané (`…`); v samotných skriptoch ostali nezmenené.

## Stavba zadania

1. **Spoločný kontext** v konštante, ktorú dostane každý agent workflowu: `BASE` (`prehliadka-filmu.js`,
   `integracia-a-kontrola.js`, `spisanie-toolboxu.js`), `COMMON` (`audit-webu.js`, kontroly), `CTX`
   (`audit-fps.js`, návrhové workflowy), `DOCS` (`stavba-webu.js`), `BRIEF` (`textari-popisov.js`).
2. **Rola a vlastníctvo** na začiatku úlohy.
3. **Postup v číslovaných krokoch**, každý s overením (príkaz, snímka, meranie).
4. **Výstup**: schéma a čo patrí do voľných polí (`notes`, `summary`, `rationale`).

## Čo dať do spoločného kontextu

| Čo | Citát | Príklad |
| --- | --- | --- |
| projekt, miesto, nasadenie | „Projekt: web BARBERSHOP 30 v Nitre, statický (bez build kroku), v ${P}; nasadený ako podpriečinok https://d8f5s88zjy-art.github.io/head-spa-30/barbershop-30/ (všetky cesty RELATÍVNE).“ | `prehliadka-filmu.js` |
| záväzné dokumenty s obsahom | „Záväzné dokumenty: ${P}/docs/TOUR_DIRECTION.md (cesta 9 scén, technika, čo sa maže), ${P}/docs/ART_DIRECTION.md (paleta, typografia, tlačidlá, pohyb), ${P}/docs/CONTENT_SOURCES.md (jediný zdroj obchodných údajov, nič nevymýšľaj) …“ | `prehliadka-filmu.js` |
| pravidlo pravdy a dátum | „Dnešný dátum: 2026-10-09. Pravidlo pravdy: nikdy nič nevymýšľaj; čo nenájdeš, označ ako nenájdené.“ | `audit-webu.js` |
| nástroje s presným použitím | „Screenshoty: cd ${P} && node source/shot.mjs <url\|/cesta> <nazov> [--scroll=px] [--wait=ms] [--only=desktop\|mobile] [--full] [--dpr=n] (WebGL cez SwiftShader funguje; stránka nastavuje window.__renderDone).“ a „Playwright import: /home/user/node-tools/node_modules/playwright/index.mjs.“ | `integracia-a-kontrola.js` |
| čo agent nevidí | „KONTEXT (čítaj pozorne, rozhovor s majiteľom nevidíš):“ | `filmovy-navrh-podla-videa.js` |
| želanie majiteľa doslova | „Majiteľ chce: „Tie prechody zlepši, pridaj tam rôzne edity, aby to bolo krajšie, tie jednotlivé prechody““ | `strihaci-prechodov.js` |
| ktoré pravidlá platia | „Je to samostatný web v podpriečinku repozitára head-spa-30; pravidlá o názvoch z koreňového CLAUDE.md (HEAD SPA 30) sa týkajú iného webu, NIE tohto.“ | `filmovy-navrh-podla-videa.js` |
| čo už je známe | „Už vieme (neopakuj): film kreslí plnou frekvenciou 60 s po pohybe, potom 30 snímok/s (setTimeout), po 180 s stojí; … Toto upravujem sám.“ | `audit-fps.js` |
| čo sa zmenilo | „Rozdiel oproti nasadenej verzii: git -C /home/user/head-spa-30 diff 2d89d1b -- barbershop-30/assets/film.js …“ | `kontrola-ostrosti-prechodov.js` |
| čo chýba | súbor `Analyza_10_referencnych_videi.md` „nemáme“, „nevymýšľaj jeho obsah“ | `audit-webu.js` |
| čo sa práve generuje | „manifest sa práve generuje skriptom source/tools/build_images.py; ak chýba slug, počkaj a skontroluj znova“ (s cestou k logu) | `stavba-webu.js` |
| podmienky merania | „Kontajner nemá grafickú kartu (SwiftShader), preto čas GPU nemeraj ako skutočný; meraj čas hlavného vlákna (CDP Performance.getMetrics …)“; „Uvedené ciele sú ciele, nie garancie.“ | `audit-fps.js`, `integracia-a-kontrola.js` |
| rozpočet v číslach | „dovolený rozpočet post shaderu najviac asi 16 vzoriek textúry na pixel navyše; žiadne nové render targety s plným rozlíšením navyše, ak sa dá. Lighthouse mobil 95+.“ | `strihaci-prechodov.js` |
| hranice | „Nepushuj do gitu (commit robí orchestrátor).“; „NIKDY needituj súbory v /home/user/head-spa-30.“; „NESPÚŠŤAJ prehliadačové testy ani Playwright (bežia práve inde a súperili by o CPU)“ | `integracia-a-kontrola.js`, `strihaci-prechodov.js`, `kontrola-ostrosti-prechodov.js` |
| dôkazy | „Vráť len skutočné nálezy s dôkazom (súbor:riadok, citát, výpočet); nič nevymýšľaj; keď si nie si istý, povedz to v confidence.“ | `kontrola-*.js` |
| stav predchádzajúcej fázy | „Stav po integrácii: ${integ.summary.slice(0, 1500)} \| otvorené: …“ | `prehliadka-filmu.js` |

Agenti dostávajú aj CLAUDE.md repozitára. Keď v repozitári žije viac webov (`barbershop-30/` v repozitári
HEAD SPA 30), kontext musí povedať, ktoré pravidlá platia a ktoré nie.

## Katalóg rolí

| Rola | Kľúčové vety | Príklad |
| --- | --- | --- |
| autor modulu | „TVOJA ÚLOHA (vlastníš: ${P}/assets/app.js):“; „Pracuj len v súboroch, ktoré vlastníš (nižšie); ostatné nečítaj ako hotové“; pri prestavbe aj „MAŽEŠ: …“ | `stavba-webu.js`, `prehliadka-filmu.js` |
| integrátor | „Zjednoť názvy tried, id, CSS premenných a atribútov podľa CONTRACT (kontrakt má prednosť; keď sa dvaja autori odchýlili rovnako, zachovaj ich spoločnú verziu a oprav tretiu).“; „Oprav každý nájdený problém priamo v kóde (žiadne workaroundy v screenshot skripte).“ | `stavba-webu.js` |
| integrátor a art director | „Otvor KAŽDÝ screenshot nástrojom Read a posúď ako art director“; „Iteruj min. 3 kolá opráv, zapíš zmeny.“; záväzné „REŽISÉRSKE ROZHODNUTIA“ A až G | `prehliadka-filmu.js`, `integracia-a-kontrola.js` |
| kontrolór | „Si NEZÁVISLÝ kontrolór. Web NEUPRAVUJ (okrem zápisu svojej správy). Svoje zistenia podlož dôkazom: príkazom, číslom, názvom screenshotu, riadkom súboru. Nehodnoť to, čo si nespustil a neotvoril.“ | `integracia-a-kontrola.js` |
| skeptik nálezu | „Pokús sa VYVRÁTIŤ tento nález kontroly … refuted=true, keď nález neplatí, je už ošetrený inde, alebo by oprava nič nezlepšila; keď si nie si istý, refuted=true a povedz prečo. Uveď aj skutočnú závažnosť.“ | `kontrola-*.js` |
| skeptický recenzent výkonu | „over v kóde, či (1) naozaj stojí čas v každej snímke, (2) navrhnutá úprava ho ušetrí, (3) nič nerozbije … Nálezy, ktoré neobstoja, zamietni s dôvodom.“ | `audit-fps.js` |
| opravár | „oprav príčinu, nie príznak; každú opravu over rovnakým meraním/screenshotom, ktorým bol nález zistený (zapíš pred/po); … nič neskrývaj ani nevypínaj, aby test prešiel“ | `integracia-a-kontrola.js` |
| tvorca návrhu | uhol v poli (`ANGLES`, `ED`), napr. „Tvoj uhol: zážitok hosťa v kresle. Pokoj, dôvera, že ťa niekto počúva, chvíľa pre seba, odchod s dobrým pocitom.“; „Pred odovzdaním si každý popis spočítaj (znaky)“ | `textari-popisov.js`, `strihaci-prechodov.js` |
| porotca | pohľad v poli (`JUDGES`, `J`), napr. „Si porotca za zákazníka: muž z Nitry 20 až 45 rokov, ktorý si na telefóne vyberá, ku komu sa objedná.“; „porušenie pravidla 1, 2 alebo 5 znamená najviac 3 body“ | `textari-popisov.js` |
| syntéza | „Pre každého barbera vezmi najlepší popis podľa súčtu skóre, oprav problémy, ktoré porotcovia našli“; „neprepisuj dobré texty zbytočne. Pole from = odkiaľ text je“ | `textari-popisov.js` |
| korektor | „Každý problém oprav čo najmenším zásahom a vráť opravenú sadu vo final (ak je všetko v poriadku, vráť ju nezmenenú a ok = true).“ | `textari-popisov.js` |
| kritik | „Si skeptický vedúci projektu. … Nájdi konflikty medzi nimi …“; „Over tvrdenia, ktoré sa dajú overiť (otvor súbory, snímky). Navrhni presné poradie implementácie po krokoch s testami.“ | `filmovy-navrh-podla-videa.js` |
| overovateľ dokumentácie | „Každé konkrétne tvrdenie (názov funkcie, parameter, číslo, príkaz, cesta, správanie, fakt o podniku) porovnaj so skutočným kódom a dokumentmi“; „Chyby OPRAV priamo v súboroch skillu (iba tam).“ | `spisanie-toolboxu.js` |

## Schémy z príkladov

### Výsledok práce (autor, integrátor, opravár)

```js
const RESULT = { type: 'object', properties: { files: { type: 'array', items: { type: 'string' } }, summary: { type: 'string' }, open_issues: { type: 'array', items: { type: 'string' } }, notes: { type: 'string' } }, required: ['files', 'summary', 'open_issues', 'notes'] }
```
(`prehliadka-filmu.js`; v `stavba-webu.js` sa posledné pole volá `notes_for_integrator`)

### Správa kontrolóra

```js
const REVIEW = { type: 'object', properties: {
  verdict: { type: 'string', enum: ['pass', 'pass_with_fixes', 'fail'] },
  checks_run: { type: 'array', items: { type: 'string' } },
  findings: { type: 'array', items: { type: 'object', properties: {
    severity: { type: 'string', enum: ['blocker', 'high', 'medium', 'low'] }, area: { type: 'string' },
    evidence: { type: 'string' }, fix: { type: 'string' } }, required: ['severity', 'area', 'evidence', 'fix'] } },
  report_path: { type: 'string' } }, required: ['verdict', 'checks_run', 'findings', 'report_path'] }
```
(`integracia-a-kontrola.js`; `checks_run` ukáže, čo kontrolór naozaj spustil)

### Nález s dôkazom a verdikt skeptika

```js
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
```
(`kontrola-kodu-kompozicie-vykonu.js`; `none` dovolí skeptikovi povedať, že nález nemá žiadnu závažnosť)

### Nález auditu výkonu

```js
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
```
(`audit-fps.js`; tú istú schému vracia aj skeptik, len s nálezmi, ktoré obstáli)

### Údaj so zdrojom a stupňom dôveryhodnosti

```js
fields: { type: 'array', items: { type: 'object', properties: {
  key: { type: 'string' }, value: { type: 'string' }, source_url: { type: 'string' },
  retrieved: { type: 'string' }, confidence: { type: 'string', enum: ['verified-official', 'third-party', 'weak', 'not-found'] },
  note: { type: 'string' } }, required: ['key', 'value', 'source_url', 'confidence'] } },
```
(`audit-webu.js`, schéma `BUSINESS`; má aj `not_found` a `blocked_sources`, aby sa nenájdené a zablokované zdroje nestratili)

### Text s pravidlami v popise poľa a zdrojom faktov

```js
headline: { type: 'string', description: '2 až 5 slov, najviac 32 znakov, môže mať 2 riadky oddelené |' },
accent: { type: 'string', description: 'slovo alebo dve z nadpisu, ktoré budú vo farbe lampy alebo kurzívou; prázdne ak nič' },
sub: { type: 'string', description: 'najviac 1 až 2 krátke vety, spolu najviac 90 znakov' },
cta: { type: 'string', description: 'text tlačidla alebo odkazu, ak scéna nejaké má; inak prázdne' },
facts: { type: 'array', items: { type: 'string' }, description: 'každý faktický údaj v texte a odkiaľ je (súbor a čo tam stojí)' },
```
(`filmovy-navrh-podla-videa.js`, schéma `DECK`, výňatok položky scény)

### Hodnotenie poroty a korektúra

```js
const SCORE = {
  type: 'object',
  properties: {
    violations: { type: 'array', items: { type: 'object', properties: { deck: { type: 'string' }, id: { type: 'string' }, text: { type: 'string' }, why: { type: 'string' } }, required: ['deck', 'id', 'text', 'why'] } },
    best: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, deck: { type: 'string' }, why: { type: 'string' }, fix: { type: 'string' } }, required: ['id', 'deck', 'why', 'fix'] } },
    deck_scores: { type: 'array', items: { type: 'object', properties: { deck: { type: 'string' }, score: { type: 'number' }, note: { type: 'string' } }, required: ['deck', 'score', 'note'] } },
  },
  required: ['violations', 'best', 'deck_scores'],
}
```
(`filmovy-navrh-podla-videa.js`; v `textari-popisov.js` je obdoba `JUDGE` so skóre A, B, C pre každého a `CHECK`
s poľami `ok`, `problems` a `final`, kde `final` je celá opravená sada)

### Návrh s prototypom na disku

```js
shots: { type: 'array', items: { type: 'string' }, description: 'cesty k pásom snímok priebehu (mix 0, 0.2, 0.35, 0.5, 0.65, 0.8, 1) pre každý strih, telefón 390×844 aj počítač 1440×900' },
diff: { type: 'string', description: 'cesta k diffu kópie film.js voči originálu' },
risks: { type: 'string' },
```
(`strihaci-prechodov.js`, schéma `EDIT`, výňatok)

## Čo sa na schémach osvedčilo

- `enum` pre závažnosť a verdikt: nálezy sa dajú strojovo filtrovať a zoradiť (`todo` vo vzore 3, `toVerify` vo vzore 4).
- Povinné dôkazové polia (`evidence`, `file`, `claim`, `confidence`; pri audite `where`, `cost`, `gain`, `risk`):
  nález bez dôkazu neprejde validáciou a ľahšie sa odhalí.
- Pravidlá priamo v `description` poľa (dĺžky, počty slov): textár ich má pred očami pri každom poli.
- Pole `facts` (a `source_url` s `confidence`): každý údaj nesie svoj zdroj.
- Pole pre ďalšiu fázu (`notes_for_integrator`, `open_issues`, `notes`) a cesty k súborom namiesto veľkého
  obsahu (`report_path`, `shots`, `diff`).
