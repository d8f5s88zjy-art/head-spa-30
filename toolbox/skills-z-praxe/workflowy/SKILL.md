---
name: workflowy
description: Práca s viacerými agentmi naraz (nástroj Workflow v Claude Code, multi-agent orchestration) pri tvorbe a kontrole webu. Stavba po moduloch paralelne s pevným rozhraním, integrácia, nezávislá kontrola z viacerých pohľadov (prístupnosť, pravdivosť, výkon, kreatíva), porota návrhov (textári, strihači), audit s overením každého nálezu skeptikom (code review, Lighthouse, fps), brána dvoch recenzentov pred odovzdaním majiteľovi, revízia plánu tímom rolí (podľa ECC a gstack), stavba s hodnotiteľom v slučke so stavmi NEOVERENE a ESKALACIA a slovník vzorov Anthropicu (prompt chaining, routing, parallelization, orchestrator-workers, evaluator-optimizer); pravidlá pre paralelu (rozpočet agentov, porty, push a nasadenie len hlavná relácia), sieť spolupracujúcich agentov (fronta úloh s obmedzenou súbežnosťou, brief namiesto dokumentu, kontrola podľa rizika, odovzdávka na konci, fail closed pri limite relácie, dispečer a hodinový check-in orchestrátora). Použi pri väčšej úlohe pre viac agentov, pri písaní zadaní agentom a schém výstupu (JSON schema) aj keď zvažuješ, či workflow vôbec treba. 11 spustených skriptov a štyri šablóny (smerovanie podľa náročnosti, brána, tím rolí, sieť agentov) v priklady/.
---

# Workflowy: viac agentov naraz pri tvorbe a kontrole webu

Workflow je skript v JavaScripte pre nástroj Workflow v Claude Code. Spustí viac agentov naraz, každému dá
zadanie a schému výstupu a ich výsledky poskladá: stavba modulov, integrácia, kontroly, porota, overenie.
Tento skill zhŕňa vzory, ktoré sme naozaj spustili pri webe BARBERSHOP 30 (`barbershop-30/`) a pri spisovaní
tohto toolboxu (október 2026). Všetkých 11 skriptov je v [`priklady/`](priklady/), každý s komentárom za
blokom `meta`: čo robí a kedy sa osvedčil.

## Kedy použiť

- Úloha sa delí na **nezávislé časti**, ktoré sa dajú robiť naraz: moduly webu (film a stránka), oblasti
  kontroly, dávky podkladov (45 fotiek v troch dávkach po 15).
- Treba **nezávislý pohľad**: kontrolór, ktorý kód nepísal, a skeptik, ktorý sa nález pokúsi vyvrátiť.
- Treba **viac návrhov na výber**: textári s rôznym uhlom, strihači s rôznym slovníkom, potom porota.
- Treba **pokryť veľa naraz**: prieskum podkladov v štyroch prúdoch, spísanie siedmich položiek toolboxu
  s overením každej.
- Treba **viac úloh so stavbou a kontrolou**, naraz s obmedzenou súbežnosťou, a beh musí prežiť limit relácie:
  sieť agentov (`priklady/siet-tim.js`, časť „Sieť agentov“).

## Kedy workflow netreba

- **Jedna línia zmien** v pár súboroch, ktorú hneď overí cielený test alebo snímka. Návrat na ulicu, plynulý
  úvod na telefóne a sekvencie snímok z videa (`barbershop-30/docs/CHECKS.md` časti 7, 9 a 12) sa robili priamo;
  hotový návrat na ulicu potom nezávisle skontroloval workflow (`priklady/kontrola-kodu-kompozicie-vykonu.js`).
- **Merania výkonu a Lighthouse súbežne s inými behmi**: súbežné behy si berú CPU (CHECKS 6: „súbežne bežali
  iné testy, preto rozptyl“). Kontrolóri v `kontrola-*.js` preto testy nespúšťali („NESPÚŠŤAJ prehliadačové
  testy ani Playwright (bežia práve inde a súperili by o CPU)“). Kde meranie vo workflowe bolo (kontrolór výkonu
  v `integracia-a-kontrola.js`, audítori v `audit-fps.js`), zadanie uvádzalo podmienky merania; meranie pred
  a po úprave tou istou metódou je v CHECKS 13 (úpravy robila hlavná relácia, audit súbory nemenil).
- **Push, merge do `main` a nasadenie**: robí hlavná relácia po kontrole („Nepushuj do gitu (commit robí orchestrátor).“).
  Implementátor smie commitovať lokálne na svojej pracovnej vetve (obnova, diff pre kontrolóra); nepushuje a nespúšťa
  ukladacie skripty s pushom (P7). Súhlas majiteľa pred každým pushom do `main` je zatiaľ návrh a čaká na rozhodnutie
  majiteľa (otázka D1); `CLAUDE.md` ho dnes nežiada.
- **Stačí jeden agent alebo priama práca**: pred workflowom napíš jednou vetou, prečo nestačí. Anthropic radí
  začať najjednoduchším riešením a systém viacerých agentov stojí asi 15× viac tokenov ako chat (P10).
- **Rozhodnutie patrí majiteľovi** (nová fotka: CHECKS 8, „Neriešené (vyžadujú majiteľa)“; súhlasy osôb vo videách
  a portrétoch: CHECKS 5).
- **Zostáva málo z limitu relácie**: veľké workflowy nedobehli (CHECKS 8 a 10, pozri Pasce).
- **Dlhý beh, ktorý môže používateľ prerušiť**: najprv rýchle cielené kontroly, celé sady až potom
  (pri testoch to používateľ raz prerušil).

## Postup krok za krokom

1. Rozhodni, či workflow treba (dva zoznamy vyššie).
2. Priprav podklady na disk: záväzné dokumenty (brief, rozhranie medzi modulmi, zdroje faktov), nástroje na
   snímky a testy. Workflow ich len odkazuje cestou.
3. Vyber vzor (nižšie) a najbližší príklad z tabuľky na konci. Skopíruj ho a zmeň konštanty s cestami
   (`P`, `ROOT`, `BASE`, `CTX`) a zadania.
4. Napíš spoločný kontext, roly a schémy výstupu (časť Ako písať zadania).
5. Spočítaj agentov: overenie dvoma skeptikmi stojí 2 agentov na každý nález.
6. Spusti nástrojom Workflow (skript ako text alebo `scriptPath` na súbor; návrhové príklady chcú `args`).
7. Prečítaj výsledok. Čo nedobehlo alebo je sporné, over sám v kóde a na snímkach a zapíš to.
8. Zapracuj, zmeraj pred a po tou istou metódou, zapíš do `CHECKS.md` alebo `INTEGRATION_LOG.md`, commit sám.
9. Osvedčený skript skopíruj do `priklady/` s komentárom za blokom `meta`.

## Kostra skriptu

Skript začína blokom `meta` (prvý príkaz; názvy fáz rovnaké ako v `phase()`). Z `priklady/audit-fps.js`:

```js
export const meta = {
  name: 'audit-fps',
  description: 'Audit výkonu webu BARBERSHOP 30 pre 60 až 120 snímok za sekundu: film JS, grafika, DOM a CSS',
  phases: [
    { title: 'Audit', detail: 'tri oblasti naraz, len čítanie a meranie' },
    { title: 'Overenie', detail: 'skeptik preverí, či návrhy naozaj pomôžu a nič nerozbijú' },
  ],
}
```

| Funkcia | Ako ju používajú príklady |
| --- | --- |
| `agent(zadanie, { label, phase, schema, effort })` | so `schema` vráti objekt podľa schémy, bez nej text; zlyhaný agent vráti `null` |
| `parallel([() => agent(…), …])` | čaká na všetky (bariéra), výsledky sa čistia `.filter(Boolean)` |
| `Promise.all([agent(…), …])` | stavba modulov naraz; agent beží od chvíle volania |
| `pipeline(položky, fáza1, fáza2)` | každá položka ide fázami sama, fáza 2 dostane `(výsledok, položka)` |
| `phase('Kontrola')`, `log('…')` | skupiny a riadky priebehu pre používateľa |
| `args` | parametre spustenia (`args.site`, `args.scratch`, `args.ref` v návrhových workflowoch) |
| `return { … }` | výsledok pre hlavnú reláciu |

Spustenie uloženého skriptu, obnovenie, čo v skripte nejde, počty agentov a kostra na skopírovanie:
[references/kostra-skriptu.md](references/kostra-skriptu.md).

## Vzor 1: prieskum podkladov v prúdoch (`audit-webu.js`)

Na začiatku projektu štyri prúdy naraz: obchodné údaje so zdrojom, inventár fotiek, pravidlá z referenčných
balíkov, technická príprava. Veľký inventár sa delí na dávky, dávka je jeden agent (`priklady/audit-webu.js`):

```js
const files = Array.from({ length: 45 }, (_, i) => `${P}/source/photos/foto-${String(i + 1).padStart(2, '0')}.jpg`)
const batches = [files.slice(0, 15), files.slice(15, 30), files.slice(30, 45)]
// … pipeline(batches, (batch, _, idx) => agent(…)) a ďalšie tri agenty bez await …
const [business, photoBatches, rules, techres] = await Promise.all([research, photos, refs, tech])
const allPhotos = (photoBatches || []).filter(Boolean).flatMap(b => b.photos)
```

- Schéma núti ku každému údaju zdroj a stupeň: `confidence: { type: 'string', enum: ['verified-official',
  'third-party', 'weak', 'not-found'] }`. `barbershop-30/docs/CONTENT_SOURCES.md` má prvé tri stupne po slovensky
  (overené‑oficiálne, tretia strana, slabé); namiesto `not-found` má štvrtý stupeň neoverené (tvrdenie majiteľa
  alebo odhad, na web až po potvrdení).
- Fotky: „Otvor KAŽDÝ z týchto … súborov nástrojom Read“ a „Nehodnoť nič, čo si neotvoril.“
- Čo chýba, povedz vopred, aby si to agent nedomyslel: súbor `Analyza_10_referencnych_videi.md` „nemáme“,
  „nevymýšľaj jeho obsah“.

## Vzor 2: stavba po moduloch s pevným rozhraním (`stavba-webu.js`, `prehliadka-filmu.js`)

1. **Rozhranie pred stavbou.** `barbershop-30/docs/CONTRACT.md`: „Záväzné rozhrania …“ a „Kto mení kontrakt,
   mení aj tento súbor.“ (súbory, DOM, premenné, API modulu). Menšie rozhranie stačí do spoločného kontextu:
   „ROZHRANIE FILM ↔ STRÁNKA (záväzné pre oba moduly)“ (kotvy `.film-shot` s `data-shot`, `data-f`, `data-mv`,
   záloha `<picture class="film-still">`, triedy `world`, `world-in`, `world-off`).
2. **Každý agent vlastní svoje súbory**: `TVOJA ÚLOHA (vlastníš: ${P}/assets/app.js):` a v kontexte
   „Pracuj len v súboroch, ktoré vlastníš (nižšie); ostatné nečítaj ako hotové“.
3. **Moduly naraz**, každý vráti poznámky pre integrátora (`priklady/stavba-webu.js`):

```js
const RESULT = { type: 'object', properties: { files: { type: 'array', items: { type: 'string' } }, summary: { type: 'string' }, open_issues: { type: 'array', items: { type: 'string' } }, notes_for_integrator: { type: 'string' } }, required: ['files', 'summary', 'open_issues', 'notes_for_integrator'] }

phase('Stavba')
const [chair, page, director] = await Promise.all([
```

4. **Integrátor** dostane súhrn, otvorené body a poznámky každého autora, aj keď autor zlyhal:
   `--- stránka: ${page ? page.summary + ' | otvorené: ' + page.open_issues.join('; ') + ' | pre integrátora: ' + page.notes_for_integrator : 'agent zlyhal'}`.
   Pravidlo sporu: „kontrakt má prednosť; keď sa dvaja autori odchýlili rovnako, zachovaj ich spoločnú verziu
   a oprav tretiu“.
5. Integrátor spustí testy a snímky, každú snímku otvorí, opraví v kóde („žiadne workaroundy v screenshot
   skripte“) a zapíše `docs/INTEGRATION_LOG.md`.

Lekcia: v `prehliadka-filmu.js` dostal film `film.css` s pravidlami pre `.film-still` a stránka `style.css`
tiež s `.film-still`. Integrátor potom našiel `film.css` ako nepoužitý duplikát a zmazal ho
(`barbershop-30/docs/INTEGRATION_LOG.md`). Každý súbor a každá trieda má mať v rozhraní jedného vlastníka.

## Vzor 3: integrácia, nezávislé kontroly, opravár (`integracia-a-kontrola.js`, `prehliadka-filmu.js`)

Poradie je zapísané aj v `barbershop-30/docs/MASTER_BRIEF.md` (časť 4, Postup práce): stavba, integrácia,
štyri nezávislé kontroly, opravy blocker/high/medium overené rovnakým meraním, záznam, nasadenie až potom.

- Na nehotový web sa kontrola nespúšťa: `if (!integ) { log('Integrátor zlyhal.'); return { film, page, integ } }`.
- Štyria kontrolóri naraz, každý jedna oblasť a vlastná správa `docs/reviews/<oblast>.md`: prístupnosť
  a odolnosť, pravdivosť a SEO, výkon, kreatívny posudok (proti pôvodnému webu a podmienkam prijatia).
- Kontrolór web neupravuje: „Si NEZÁVISLÝ kontrolór. Web NEUPRAVUJ (okrem zápisu svojej správy). Svoje zistenia
  podlož dôkazom: príkazom, číslom, názvom screenshotu, riadkom súboru. Nehodnoť to, čo si nespustil a neotvoril.“
- Závažnosť má pevný význam: „blocker = web nefunguje alebo klame, high = zjavná chyba pre zákazníka,
  medium = kvalita, low = drobnosť“.
- Na opravu idú blocker, high, medium, zoradené (`priklady/prehliadka-filmu.js`):

```js
const ok = reviews.filter(Boolean)
const all = ok.flatMap(r => r.findings.map(f => ({ ...f, report: r.report_path })))
const todo = all.filter(f => ['blocker', 'high', 'medium'].includes(f.severity)).sort((a, b) => ['blocker', 'high', 'medium'].indexOf(a.severity) - ['blocker', 'high', 'medium'].indexOf(b.severity))
```

- Opravár: „oprav príčinu, nie príznak; každú opravu over rovnakým meraním/screenshotom, ktorým bol nález zistený
  (zapíš pred/po); ak nález nie je reálny alebo oprava by stála viac než prínos, nepíš kód a zdôvodni to
  v zázname; nič neskrývaj ani nevypínaj, aby test prešiel“. Zapíše `docs/CHECKS.md` a `docs/COMPARISON.md`.

## Vzor 4: kontrola a audit s overením každého nálezu

Kontrolór aj audítor sa mýlia, preto sa nález pred úpravou overuje. Dve podoby, ktoré sme spustili:

**A. Dvaja skeptici na nález** (`kontrola-ostrosti-prechodov.js`, `kontrola-kodu-kompozicie-vykonu.js`).
Najprv tri až štyri pohľady naraz (kód, stránka a súbory, kompozícia, výkon a pamäť), len čítanie, grep
a výpočty. Potom každý nález okrem `low` dostane dvoch skeptikov (`priklady/kontrola-kodu-kompozicie-vykonu.js`,
zadanie skrátené; `kontrola-ostrosti-prechodov.js` má tú istú podmienku zapísanú inak):

```js
const toVerify = all.filter((f) => f.severity !== 'low')
const verified = await parallel(toVerify.map((f, i) => () =>
  parallel([0, 1].map((n) => () => agent(`${COMMON}\n\nSi skeptik č. ${n + 1}. Pokús sa VYVRÁTIŤ tento nález kontroly (${f.from}): …`, { label: `overenie:${f.from}:${i}:${n}`, phase: 'Overenie', schema: VERDICT })))
    .then((vs) => { const v = vs.filter(Boolean); return { ...f, votes: v, confirmed: v.length > 0 && v.some((x) => !x.refuted) && !(v.length === 2 && v.every((x) => x.refuted)) } })
))
```

Nález platí, keď ho aspoň jeden skeptik nevyvráti. Skeptik pri neistote zamieta: „keď si nie si istý,
refuted=true a povedz prečo“. Cena: dvaja agenti na každý nález.

**B. Audit v pipeline, jeden skeptik na oblasť** (`audit-fps.js`). Lacnejšie: skeptik dostane všetky nálezy
svojej oblasti naraz a začne hneď, keď oblasť dobehne (zadanie skrátené):

```js
const results = await pipeline(
  AREAS,
  (a) => agent(`${CTX}\n\n${a.prompt}`, { label: `audit ${a.key}`, phase: 'Audit', schema: FIND }).then((r) => (r ? { area: a.key, ...r } : null)),
  (r, a) => r && agent(`${CTX}\n\nSi skeptický recenzent výkonu. Pre každý nález z oblasti ${a.key} over v kóde, či (1) naozaj stojí čas v každej snímke, (2) navrhnutá úprava ho ušetrí, (3) nič nerozbije …`,
    { label: `overenie ${a.key}`, phase: 'Overenie', schema: FIND }).then((v) => (v ? { area: a.key, audit: r, verified: v } : null)),
)
```

Výsledok (CHECKS 13, podrobne [`../rychly-web/references/audit.md`](../rychly-web/references/audit.md)): overovateľ zamietol svetlo po okraji karty
na `width: 200%` (na úzkom telefóne je karta vyššia ako široká a rohy by pri niektorých uhloch ostali bez svetla).
Audit inou metódou sľuboval prepočet štýlu 48,7 → 7,4 ms na snímku; meranie po úprave (telefón 390×844, CPU 4×,
film vypnutý) dalo prepočet štýlu 5,1 → 4,8 ms a hlavné vlákno 10,9 → 9,6 ms. Zapracuj overené nálezy s nízkym
rizikom, meraj pred a po tou istou metódou, nezapracované zapíš do kontrol s dôvodom.

## Vzor 5: porota návrhov (`textari-popisov.js`, `strihaci-prechodov.js`, `filmovy-navrh-podla-videa.js`)

Tvorcovia s rôznym uhlom, porotcovia s rôznym pohľadom, syntéza, nakoniec korektor alebo kritik.

| Workflow | Tvorcovia (uhly) | Porotcovia | Záver |
| --- | --- | --- | --- |
| textári popisov | remeslo, hosť, charakter | pravidlá a fakty; zákazník | syntéza podľa súčtu skóre, korektor |
| strihači prechodov | kamera, svetlo, tvar (prototyp v kópii `film.js`) | strihač filmu; technický kontrolór | syntéza do jedného shaderu |
| filmový návrh | zdržanlivý, hook, Nitra (texty) | pravidlá a fakty; zákazník | syntéza textov, rozloženie a videá, kritik |

```js
const drafts = (await parallel(ANGLES.map((a) => () =>
  agent(`${BRIEF}\n${a.prompt}\nVráť lead a presne 10 popisov v poradí tímu (name = krstné meno presne ako vyššie). Pred odovzdaním si každý popis spočítaj (znaky) a skontroluj pravidlá 1 až 8.`,
    { label: `textár ${a.key} (${a.label})`, phase: 'Písanie', schema: DRAFT })
    .then((d) => (d ? { key: a.key, label: a.label, ...d } : null))
))).filter(Boolean)
```

(`priklady/textari-popisov.js`)

- Pravidlá s tvrdým dôsledkom: „Pravidlá (porušenie = vyradenie)“ (textári vo `filmovy-navrh-podla-videa.js`);
  porotca pravidiel v `textari-popisov.js`: „porušenie pravidla 1, 2 alebo 5 znamená najviac 3 body“.
- Dvaja porotcovia s **rôznym** pohľadom (pravidlá a zákazník; vkus a výkon), nie dvaja rovnakí.
- Syntéza neprepisuje zbytočne: „Môžeš jemne upraviť slovo alebo spojiť nápady, ale neprepisuj dobré texty
  zbytočne. Pole from = odkiaľ text je (A, B, C alebo úprava).“
- Návrhy kódu vznikajú v kópii, repozitár sa needituje: „NIKDY needituj súbory v /home/user/head-spa-30. Prototyp
  rob v kópii“ (súbory sa skopírujú do `${A.scratch}`, veľké priečinky sa nalinkujú `ln -s`).
- Dlhý rozbor môže bežať popri tvorcoch: `const refP = agent(…)` na začiatku, `const refText = await refP`
  až pred rozložením (`priklady/filmovy-navrh-podla-videa.js`).
- Výsledky: popisy barberov 43 až 68 znakov bez faktov o osobe (CHECKS 11, [`../obsah-a-texty/references/popisy-ludi.md`](../obsah-a-texty/references/popisy-ludi.md));
  strihy: porota a syntéza nedobehli, zvolený slovník strihača „kamera“ (CHECKS 10, [`../film-z-fotiek/references/strihy.md`](../film-z-fotiek/references/strihy.md)).

## Vzor 6: dokumentácia s overením (`spisanie-toolboxu.js`)

Pipeline cez skills: autor číta skutočný kód a dokumenty a píše; hneď po ňom nezávislý overovateľ porovná
každé konkrétne tvrdenie (funkcia, parameter, číslo, príkaz, cesta, fakt o podniku) s kódom a chyby opraví
priamo v súboroch skillu. Takto vznikol tento toolbox.

## Smerovanie podľa náročnosti a spoločná pamäť (`smerovanie-podla-narocnosti.js`, šablóna)

Myšlienky z RuFlo (orchestrácia agentov pre Claude Code; rozbor videa a overenie v
[`../referencie-z-videi/references/naucene-z-videi.md`](../referencie-z-videi/references/naucene-z-videi.md), časť 5)
prevedené na nástroj Workflow bez inštalácie čohokoľvek. Šablóna zatiaľ nebola spustená; čísla úspor z videa
(75 %) ani z dokumentácie RuFlo (30 až 50 %) sme nemerali.

| RuFlo | U nás | Prečo |
| --- | --- | --- |
| Agent Booster: jednoduché úpravy bez LLM (WASM, AST) | mechanickú zmenu urobí hlavná relácia skriptom (sed, python); triedenie ju len pomenuje a dá príkaz | rýchle, lacné, overiteľné diffom |
| smerovanie: jednoduché Haiku, stredné Sonnet, zložité Opus | `agent(…, { model: 'haiku', effort: 'low' })` len na triedenie a jednoduché fázy; inak model relácie, `effort` podľa náročnosti | model meň len tam, kde si istý; skeptik vždy silný |
| zdieľaná pamäť (vektorová databáza) | priečinok `<scratch>/pamat/`: každý agent si ho prečíta a zapíše najviac 10 riadkov zistení | vidno, čo si agenti odovzdali; prežije obnovenie |
| roj s kráľovnou a hlasovaním | hlavná relácia riadi, porota hlasuje (vzor 5), skeptik vyvracia (vzor 4) | už overené na našich behoch |
| 60 agentov naraz | nástroj púšťa naraz najviac asi 16 (naše pozorovanie; subagentov cez nástroj Agent pustí Claude Code predvolene 20, code.claude.com/docs/en/sub-agents) a relácia má týždenný limit agentov | menej, ale cielených agentov (pasca nižšie) |

## Vzor 7: brána dvoch recenzentov pred odovzdaním majiteľovi (`brana-dvoch-recenzentov.js`, šablóna)

Podľa `santa-method` z ECC (github.com/affaan-m/ECC, MIT; rozbor `../tim-roly/references/ecc.md`). Vzor 4 overuje
nálezy kontroly (nález platí, keď ho aspoň jeden skeptik nevyvráti). Tu je to naopak: overuje sa hotový výstup
pre majiteľa (scenár, titulky a popis shortu, text na web) a prejde, len keď **obaja** recenzenti dajú PASS.

- Rovnaká rubrika a podklady pre oboch; žiadny nevidí hodnotenie druhého; súbory needitujú.
- Zlyhaný recenzent (`null`) je FAIL, nie PASS:

```js
const pass = v.length === 2 && v.every((x) => x && x.verdikt === 'PASS')
```

- Pri FAIL opravár opraví v `args.dir` len nájdené veci, nové fakty nepridáva, čo nevie doložiť, vyhodí; čo sa nedá
  bez majiteľa (privolenie, nový záber), vráti v `neopravitelne` a brána skončí eskaláciou.
- Najviac 3 kolá, potom rozhodne majiteľ alebo hlavná relácia. Cena: 2 agenti na kolo + opravár, najviac 8.
- Po PASS ide presný súbor majiteľovi na schválenie (`../youtube-shorts/scripts/schvalenie.py`). Rubriky pre short
  a text na web: `../tim-roly/references/sablony-rol.md`, časť 8.

## Vzor 8: tím rolí pred stavbou (`tim-roly-plan.js`, šablóna)

Podľa gstack (`/plan-ceo-review`, `/plan-design-review`, `/plan-eng-review`, poradie z `/autoplan`; MIT, Garry Tan).
Rozsah (CEO, štyri režimy) a dizajn (prechody 0 až 10, pre web alebo pre short) bežia naraz, technika ide posledná,
aby videla ich čakajúce návrhy:

```js
const [rozsah, dizajn] = await Promise.all([
  agent(ROLA_ROZSAH, { label: 'rola: rozsah (CEO)', phase: 'Revízia', schema: ROZSAH, effort: 'high' }),
  agent(ROLA_DIZAJN, { label: 'rola: dizajn 0-10', phase: 'Revízia', schema: DIZAJN, effort: 'high' }),
])
const technika = await agent(rolaTechnika(rozsah, dizajn), { label: 'rola: technika (eng)', phase: 'Revízia', schema: TECHNIKA, effort: 'high' })
```

Jeden skeptik na rolu vyvráti nálezy bez citátu; nález roly, ktorej skeptik zlyhal, ostane s príznakom `neoverene`.
Syntéza vráti otázky pre majiteľa D1, D2 (jedno rozhodnutie = jedna otázka, najviac 4 možnosti, odporúčanie,
úplnosť) a zoznam mechanických úprav pre hlavnú reláciu. Nikto needituje. 7 agentov. Na rozdiel od gstacku agent
nikdy nevolí odporúčanie za majiteľa. Otázky, kontrolné zoznamy a schémy ďalších rolí (staff recenzent, QA,
bezpečnosť, release): `../tim-roly/`.

**Skúška šablón 7 a 8 (2026-10-17, bez nástroja Workflow):** skript sa celý preložil ako asynchrónna funkcia a
spustil s falošnými `agent`, `parallel`, `phase`, `log`; každý výstup falošného agenta bol vygenerovaný a overený
podľa schémy a v žiadnom zadaní nebolo `undefined` ani `[object Object]`. Výsledky: `tim-roly-plan.js` 7 agentov pri
všetkých rolách (vyvrátený nález vypadol), 6 pri zlyhanom dizajne a skeptikovi (príznak `neoverene`), 3 pri zlyhaní
všetkých rolí, 0 bez args; `brana-dvoch-recenzentov.js` 2 agenti pri dvoch PASS, 5 pri oprave a PASS v 2. kole,
8 a eskalácia pri zlyhanom recenzentovi, 3 a eskalácia pri neopraviteľnom náleze, 0 bez args. Rovnaká skúška
odhalila zámerne vložené chyby (syntax, chýbajúci argument v zadaní).

## Vzor 9: stavba s hodnotiteľom v slučke (evaluator-optimizer, štandard pre stavbu)

Je to náš najčastejší vzor stavby (rozbor denníkov 2026-10-20; originály mimo repozitára `gymklub-redesign-stavba-1`
a `-2`, `2-opravy`, `gymklub-cms`, `gym3d-walkthrough`, `gymklub-zive-texty`, `barbershop30-preklady-lajko`,
`gymklub-uvod-overenie` → `-reverify`). Implementátor urobí balík, nezávislí hodnotitelia (kód, meranie, vzhľad) ho
skontrolujú, opravár opraví len overené nálezy a celé sa to opakuje najviac N kôl. Vzor 7 je jeho prípad pre text
pre majiteľa. Anthropic ho opisuje ako „one LLM call generates a response while another provides evaluation and
feedback in a loop“ a radí ho tam, kde sú jasné kritériá hodnotenia a ďalšie kolo prináša merateľné zlepšenie
(anthropic.com/engineering/building-effective-agents). Podmienka zastavenia je povinná („such as a maximum number
of iterations“).

Výsledok každej dávky má pole `stav`:

| Stav | Kedy | Čo urobí hlavná relácia |
| --- | --- | --- |
| `PASS` | všetci hodnotitelia vrátili výsledok a nie je vážny nález | pokračuje (ďalšia dávka, kontrola celku) |
| `NEOVERENE` | aspoň jeden hodnotiteľ zlyhal (`null`) | spustí chýbajúcu kontrolu alebo overí sama; dávka nejde ďalej |
| `ESKALACIA` | po poslednom kole ostali vážne nálezy | otázka D1 majiteľovi alebo rozhodnutie hlavnej relácie so zoznamom nálezov |
| `ZLYHALO` | zlyhal implementátor alebo opravár | kontrola sa nespúšťa; hlavná relácia rozhodne, či beh zopakovať |

Kostra (podľa `priklady/brana-dvoch-recenzentov.js:83, 100`; zadania a schémy doplň podľa vzoru 3):

```js
const MAX_KOL = 2   // najviac 3 kontroly a 2 opravy na dávku; podmienka zastavenia
for (const d of DAVKY) {
  let impl = await agent(zadanieImpl(d), { label: `impl ${d.id}`, phase: 'Stavba', schema: IMPL })
  let stav = impl ? 'PASS' : 'ZLYHALO', kontroly = [], vazne = []
  for (let kolo = 0; stav === 'PASS'; kolo++) {
    kontroly = await parallel(LENSY.map((l) => () => agent(zadanieKontroly(l, d, kolo), { label: `${l.id} ${d.id} k${kolo + 1}`, phase: 'Kontrola', schema: KONTROLA })))
    if (kontroly.some((k) => !k)) { stav = 'NEOVERENE'; break }      // zlyhaný hodnotiteľ nie je PASS
    vazne = kontroly.flatMap((k, i) => k.nalezy.map((n) => ({ ...n, lens: LENSY[i].id }))).filter((n) => n.zavaznost !== 'nizka')
    if (!vazne.length) break                                         // PASS
    if (kolo >= MAX_KOL) { stav = 'ESKALACIA'; break }
    impl = await agent(zadanieOpravy(vazne, d), { label: `oprava ${d.id} k${kolo + 1}`, phase: 'Oprava', schema: IMPL })
    if (!impl) stav = 'ZLYHALO'
  }
  vysledky.push({ id: d.id, stav, impl, vazne, kontroly })
  if (stav !== 'PASS') return { stav, vysledky }                    // ďalšia dávka nestavia na neskontrolovanom
}
```

- Hodnotitelia needitujú: len čítajú alebo pracujú v kópii (`gymklub-cms:92, 112`), každý má vlastný port (P5).
- Opravár opraví len nálezy poslednej kontroly a nové funkcie nepridáva.
- Neoverený nález nesie `neoverene: true`. Chýbajúci verdikt skeptika neznamená „vyvrátené“, patrí do tretej
  kôpky `neoverene` (ako v `tim-roly-plan.js`).
- Záverečná kontrola celku needituje. Ak predsa niečo opraví, nasleduje nová nezávislá kontrola alebo kontrola
  diffu hlavnou reláciou (`../tim-roly/`, zásada 7).
- Cena: implementátor + pohľady × kolá + opravy. Pri troch pohľadoch a `MAX_KOL = 2` je to najviac 12 agentov na
  dávku (1 + 3 × 3 + 2); počet zapíš do hlavičky (P1).

Skutočné skripty, ktoré to dnes robia inak (opraviť pri najbližšom spustení; v toolboxe nie sú, odkazy `skript:riadok`
sú do originálov mimo repozitára, stav 2026-10-20; `2-opravy` je `scratchpad/barber/workflowy/2-opravy.js`):

| Skript | Čo sa stane | Oprava |
| --- | --- | --- |
| `gymklub-redesign-stavba-1:67`, `-2:68`: `if (!kontrola \|\| …) break` | zlyhaná kontrola ukončí slučku ako úspech | `NEOVERENE` |
| `gymklub-redesign-stavba-1:59-67` | kontrola beží aj po zlyhanom implementátorovi | `ZLYHALO`, kontrolu nespúšťať |
| `2-opravy:47` a `:50` (`kontroly.filter(Boolean)`, `if (!vazne.length \|\| kolo >= 2) break`) | keď zlyhajú všetky tri kontroly, dávka „prejde“; po treťom kole s vážnymi nálezmi nič neupozorní | `NEOVERENE`, `ESKALACIA` |
| `barbershop-plynulost-audit:39` (`v.overenie ? v.overenie.nalezy : v.audit.nalezy`) | keď skeptik zlyhá, do plánu idú neoverené nálezy bez označenia | príznak `neoverene` |
| `gymklub-uvod-overenie:39-41` | nález bez verdiktu skončí medzi zamietnutými s prázdnym dôvodom | tretia kôpka `neoverene` |
| `co-nevidis-v-zabere-priprava:43` (`JSON.stringify(fakty.tvrdenia)`) | pri zlyhanom editorovi faktov skript spadne skôr, než sa spustí skeptik | `if (!fakty) return { stav: 'ZLYHALO', krok: 'fakty' }` |
| `2-opravy:59` | záverečná kontrola má v zadaní „Nájdené chyby, ktoré sú jasné a malé, OPRAV a commitni“ | kontrolór needituje; opravy cez opravára a novú kontrolu |

**Skúška kostry (2026-10-20, Node 22, skúšobní agenti bez nástroja Workflow)** na dvoch dávkach a troch pohľadoch,
sedem prípadov: všetko PASS (8 agentov), len nízke nálezy (PASS, 8), zlyhaný hodnotiteľ (`NEOVERENE` po 4), stále
vážne nálezy (`ESKALACIA` po 12), zlyhaný implementátor (`ZLYHALO` po 1), oprava v 2. kole (PASS po 16), zlyhaný
opravár (`ZLYHALO` po 5). Šablónu `priklady/stavba-s-hodnotitelom.js` (so zadaniami a schémami) pridaj až po
rovnakej skúške ako pri vzoroch 7 a 8.

## Sieť agentov (`siet-tim.js`, šablóna)

Zadanie majiteľa 2026-10-20: „Urob si sieť agentov, ktorí budú spolupracovať pre lepšiu efektivitu.“ Rozbor 53 behov
(407 spustených agentov, 270 výsledkov, 105 zlyhaní, takmer všetky limit relácie; `scratchpad/siet-statistika.txt`)
ukázal straty: po limite skript spúšťal ďalšie agenty, ktoré hneď padali (`wf_20f36633-067`: 44 spustených, 1 výsledok);
každý agent čítal celé dokumenty (ZADANIE 7 kB, PLAN 59 kB); tri kontroly na každú dávku aj pri malom riziku; čakanie
na „pokračuj“ od majiteľa; ukladanie denníka vyše 2 minúty; porty a súbory sa bili pri súbežných tímoch; viac ako 3 ťažké
agenty naraz sa na 4 jadrách spomaľovali. Sieť je vzor 9 pre viac úloh naraz s týmito pravidlami (P1 až P10 platia ďalej,
tu sú len odkazy). Diagram toku, formáty briefu, odovzdávky a stavu, kontrolný zoznam dispečera a postup obnovy:
[references/siet-agentov.md](references/siet-agentov.md).

- **Dispečer pred každým spustením.** Hlavná relácia pred každým spustením workflowu (aj pri obnove) spustí
  `python3 -I scratchpad/siet/dispecer.py --md` (len číta denníky `subagents/workflows/*/journal.jsonl` a `behy.json`:
  limit relácie a čas resetu, čo beží, čo treba obnoviť s presným príkazom, porty, na ktorých niekto počúva) a ručne
  doplní, čo dispečer nevidí: ťažké procesy, strom a zapisovateľ (P4), rozpočet (P1), briefy. Pri limite sa nespúšťa
  nič a prebudenie sa naplánuje na čas resetu. Bez dispečera sa workflow nespúšťa.
- **Najviac 3 ťažké agenty v celom kontajneri** (4 jadrá, 15 GB): ťažký = staviteľ, kontrolór, opravár (prehliadač,
  Lighthouse, ffmpeg, build). Šablóna má `sucasne` (úloh naraz, najviac 3) a `agentov_naraz` (ťažkých agentov naraz
  v tomto workflowe, 1 až 3; nástroj sám púšťa najviac min(16, CPU−2) = 2); hlavná relácia nastaví
  `agentov_naraz = 3 − ťažkých inde` podľa dispečera a `pgrep`. Merania podľa P6; kontrolór merania zapíše súbežnosť.
  Jeden strom, jeden zapisovateľ (P4): úlohy s rovnakým `repo` bežia po jednej; naraz bežia len úlohy s vlastným
  pracovným stromom (`git worktree` na vlastnej vetve, pole `repo` úlohy), `spolocny_strom: true` to vypne.
- **Kontrola podľa rizika.** Riziko určí hlavná relácia v briefe (nízke = jeden súbor, jasný postup, ľahko vratné;
  stredné = viac súborov alebo meranie; vysoké = film a WebGL, výkon na telefóne, bezpečnosť, obsah pre zákazníka, pred
  nasadením; pri pochybnosti vyššie): nízke = jeden kontrolór s tromi pohľadmi (kód, vzhľad, meranie) v jednej správe;
  stredné = dvaja (vzhľad; kód + meranie); vysoké = traja nezávislí. Meranie ide vždy v druhej vlne. Opravy najviac 2 kolá,
  stavy ako vo vzore 9. PASS len keď každý kontrolór spravil pridelené pohľady (pole `pohlady`), opísal rozsah (`preslo`)
  a nie je `ok=false`; zlyhaný kontrolór, nespravený pohľad alebo nula nálezov bez rozsahu = `NEOVERENE` (P2), `ok=false`
  bez vážneho nálezu = vážny nález pre opravára. Výstup určený majiteľovi na schválenie (short, reel, text) ide vždy aj
  cez bránu dvoch recenzentov (`../tim-roly/SKILL.md`, zásada 4), nech je riziko úlohy akékoľvek.
- **Brief namiesto dokumentu.** Agent dostane len krátky brief (najviac 2 kB v `scratchpad/siet/brief/<id>.md`: cieľ,
  kritériá prijatia s číslami, súbory, metóda merania, čo nečítať) a cesty k odovzdávkam predchodcov (odovzdávka práce
  úloh z `po`, teda staviteľa alebo posledného opravára, prípadne odovzdávka hlavnej relácie); `args.kontext` najviac 1 500 znakov (skript ho oreže a zapíše to do logu).
  Veľké dokumenty číta hlavná relácia a do briefu dá len to, čo úloha potrebuje.
- **Odovzdávka na konci.** Každý agent (staviteľ, kontrolór, opravár) končí súborom `ODOVZDAVKA.md` (najviac 60 riadkov:
  stav, zmeny, dôkaz, otvorené, pre ďalšieho, porty) a vráti jej cestu; ďalší agent číta len ju, nie správy ostatných.
  Stav behu je v `stav-behu.json` (lacný zapisovateľ, `effort: 'low'`, spustí jeden príkaz po štarte a po každej
  skončenej úlohe).
- **Fail closed pri limite.** Prvý `null` (limit relácie, prerušenie) nastaví STOP: žiadny ďalší agent sa nespustí ani
  v súbežnej úlohe ani zapisovateľ; úlohy dostanú `NEOVERENE` (postavené, ale kontrola sa nedokončila alebo je neúplná), `PRERUSENE` (rozpracovaná
  stavba alebo oprava) alebo `NESPUSTENE` a ich id sú v poli `neobnovene`. Výnimka ťažkého agenta zastaví sieť tiež
  (`rozpocet` alebo `vynimka`). Obnova až po resete limitu: `resumeFromRunId` s tými istými args. Kľúč agenta
  v denníku je hash zadania, preto zadania závisia len od args a výsledkov vlastných predchodcov (nie od času, náhody
  ani poradia dobehnutia súbežných úloh); inak by sa hotové agenty spustili znova. Stav po STOP zapíše hlavná relácia
  sama z poľa `stav_behu` výsledku.
- **Hodinový check-in.** Hlavná relácia si pred spustením siete naplánuje prebudenie (`send_later`, prípadne hodinový
  cron): spustí dispečera a `nastenka.py` (STAV.md), prečíta `stav-behu.json`, zapíše riadok do `PRIEBEH.md`, uloží
  denník raz za check-in (`uloz-rychle.sh` namiesto `uloz.sh`, nie po každom agentovi), pri limite naplánuje ďalšie
  prebudenie na čas resetu a nečaká na „pokračuj“ od majiteľa.
- **Čo robí orchestrátor sám, nie agent:** rozhodnutia (`ESKALACIA`, `ZLYHALO`, `BLOKOVANE`: otázka D1 majiteľovi alebo
  nový brief), nástenka (`stav-behu.json`, `STAV.md`, riadok v `PRIEBEH.md`, tabuľka stromov a portov, `ROZHODNUTIA.md`,
  P8; nový beh hneď do `behy.json`), commity do `main`, push, nasadenie a ukladacie skripty (P7, P9), otázky majiteľovi
  (formát D1 v `../tim-roly/`), čítanie veľkých dokumentov a písanie briefov, určenie rizika, pridelenie rozsahu portov
  (P5, obsadené porty z dispečera do `porty.vynechat`), dispečer a check-in.

Nástroje mimo repozitára v `scratchpad/siet/` (podrobne v references/siet-agentov.md, „Nástroje“): `dispecer.py`
(len číta: limit, čo beží, príkazy na obnovu, porty), `nastenka.py` (STAV.md z `ulohy.json` a dispečera), `behy.json`
(scriptPath a args behov pre obnovu), `ulohy.json`, `brief/`, `stav-behu.json`, `stav-behu.priklad.json`,
`skuska-siet-tim.mjs` (skúška šablóny s falošnými agentmi), `uloz-rychle.sh` (uloženie denníka, spúšťa len hlavná
relácia). Šablóna `priklady/siet-tim.js` má v hlavičke args (`ulohy[{ id, nazov, riziko, brief, subory, repo?, priorita?, po?,
odovzdavka?, effort?, model? }]`, `sucasne`, `agentov_naraz`, `spolocny_strom`, `rozpocet_na_ulohu`, `rezerva`, `repo`, `out`,
`porty { od, do, vynechat }`, `odovzdavka`, `kontext`, `datum`, `model_zapisu`) a počty agentov: nízke 2 až 6,
stredné 3 až 9, vysoké 4 až 12 na úlohu, plus 1 + počet úloh zápisov stavu (P1).

Kontrola parsovania po každej zmene skriptu (to isté, čo urobí nástroj: telo ako asynchrónna funkcia s globálmi):

```bash
node -e "const s=require('fs').readFileSync(process.argv[1],'utf8').replace(/^export const meta/m,'const meta');
new (Object.getPrototypeOf(async function(){}).constructor)('agent','parallel','pipeline','phase','log','args','budget',s);
console.log('parsovanie OK')" priklady/siet-tim.js
```

**Skúška šablóny (Node 22, falošní agenti, `siet/skuska-siet-tim.mjs`):** 2026-10-20 14 behov (PASS, limit, ESKALACIA,
oprava v 2. kole, ZLYHALO a BLOKOVANE, rozpočet, zlyhaný kontrolór, chybné vstupy). 2026-10-21 39 behov, 266
falošných agentov, žiadna výhrada, navyše: rovnaké zadania pri opačnom časovaní, obnova s cache bez opakovania hotových
agentov, príkazy zapisovateľa naozaj spustené (bash, python3; súbor sa zhoduje s výsledkom aj pri apostrofoch
v názvoch), `porty.vynechat`, cyklus v `po`, `agentov_naraz`, výnimky zapisovateľa a staviteľa, odovzdávky predchodcov
(nasledovník dostane odovzdávku práce, nie kontrolóra), `ok=false` bez nálezu, nespravený pohľad a nula nálezov bez
rozsahu a úlohy v jednom strome po jednej (nezávislá kontrola šablóny 2026-10-21 zistila, že PASS tri z týchto prípadov
dovtedy nezachytil a že súbežné úlohy v jednom strome porušovali P4). Štyri zámerne vložené
chyby skúška zachytila. Ostrý beh nástrojom Workflow zatiaľ nebol; pri prvom doplň tabuľku nižšie
a `references/priebeh-workflowov.md` a over `model: 'haiku'` zapisovateľa (inak `model_zapisu: ''`).

## Vzory v slovníku Anthropicu (mapa na naše vzory a skripty)

Anthropic v článku „Building effective agents“ (anthropic.com/engineering/building-effective-agents, uverejnené
2024-12-19, text neskôr doplnený) rozlišuje dve veci. **Workflow** vedie model a nástroje po ceste, ktorá je daná
v kóde („through predefined code paths“). **Agent** si postup a nástroje riadi sám. Naše skripty pre nástroj
Workflow sú v tomto zmysle workflowy: cesta je v kóde, uzly sú agenti. Ako autonómny agent pracuje hlavná relácia.
Článok radí začať najjednoduchším riešením a zložitosť pridať, až keď ju výsledok zaplatí („finding the simplest
solution possible“). Systém viacerých agentov spotrebuje asi 15× viac tokenov ako chat
(anthropic.com/engineering/multi-agent-research-system, 2025-06-13). Odkazy `skript:riadok` v tabuľke ukazujú do
originálov mimo repozitára (časť „V tomto repozitári“; `2-opravy` je `scratchpad/barber/workflowy/2-opravy.js`),
stav 2026-10-20.

| Vzor Anthropicu | Čo to je | U nás (vzor, šablóna) | Skutočné behy (`skript:riadok`) | Na čo si dať pozor |
| --- | --- | --- | --- | --- |
| augmented LLM (nástroje, MCP) | model s nástrojmi, stavebný blok všetkých ostatných | každý agent; akcie smerom von nerobíme | zákaz odoslania v zadaní: `booqme-prehlad-a-rezervacia:65`, `booqme-poukazy:50`, `recenzie-barbershop-headspa:30`, `toolbox-head-spa-30-kontrola:27`; žiadny z našich workflow skriptov nevolá `mcp__` | zákaz je len v texte zadania; agent, ktorý číta cudzí obsah, nedostane nič na odoslanie (`../tim-roly/`, zásada 8); viac nástrojov nie je lepšie (anthropic.com/engineering/writing-tools-for-agents) |
| prompt chaining s bránou | kroky za sebou, medzi nimi programová kontrola | vzory 2, 3 a 6, `audit-fps.js` (pipeline) | `barbershop-plynulost-audit:34-49`, `2-opravy:41-56`, `gymklub-redesign-stavba-1:57-74` | brána po každom kroku (P3); keď fázy zdieľajú veľa kontextu (plán, stavba, testy), radšej hlavná relácia (code.claude.com/docs/en/sub-agents) |
| routing | zatriedi vstup a pošle ho cestou podľa triedy | `smerovanie-podla-narocnosti.js` (zatiaľ nespustená) | `recenzie-barbershop-headspa:95-96` (trieda „neisté“ ide prísnejšou cestou) | len keď sa triedy dajú spoľahlivo rozlíšiť; pri pochybnosti prísnejšia cesta alebo človek |
| parallelization: sectioning | nezávislé časti naraz | vzor 1, pohľady vo vzore 4 | `barbershop-plynulost-audit:25-36`, `gstack-nauka:39-41`, `barbershop30-preklady-lajko:29-44` | časti nesmú meniť tie isté súbory (jeden vlastník, vzor 2); rozpočet (P1) |
| parallelization: voting | tá istá úloha viackrát, rozhodne hlasovanie | vzor 4A (dvaja skeptici), vzor 5 (porota), vzor 7 (dvaja recenzenti) | `visionary-living-navrh:61, 103, 118`, `gymklub-zive-texty:87, 97, 100`, `gymklub-uvod-overenie:32-36` | skeptik na každý nález bez stropu (37 agentov v jednom behu), P1 |
| orchestrator-workers | hlavný model určí podúlohy až podľa vstupu | hlavná relácia + nástroj Workflow; plán auditu → dávky | `2-opravy:12` (dávky z `davky.json`), `gymklub-uvod-overenie:34` (počet skeptikov podľa nálezov) | pevné roly nie sú orchestrátor (článok: rozdiel oproti paralelizácii je, že podúlohy nie sú dané vopred); rozhodnutia, push a nasadenie drží hlavná relácia (P7, P8) |
| evaluator-optimizer | jeden tvorí, druhý hodnotí a vracia spätnú väzbu, slučka s maximom kôl | vzor 7, vzor 9 | `gymklub-redesign-stavba-1:62-71`, `-2:63-72`, `2-opravy:44-53`, `gymklub-cms:88-118` | zlyhaný hodnotiteľ nie je PASS (vzor 9) |
| autonómny agent | slučka so spätnou väzbou z prostredia a s podmienkou zastavenia | hlavná relácia | vo workflowoch nie je | podmienka zastavenia: najviac N kôl, stop po troch (`../tim-roly/`, zásada 3) |
| človek v slučke (kontrolný bod, nie vzor) | agent sa zastaví a čaká na človeka | otázky D1 (`tim-roly-plan.js`), `ESKALACIA` vo vzore 7, `../youtube-shorts/scripts/schvalenie.py` | `co-nevidis-tiktok:38`, `barbershop-co-chyba:43`, `co-nevidis-v-zabere-priprava:39` | schválenie vynúti prostredie, nie veta v zadaní (P7; `../tim-roly/`, Schválenia majiteľa) |

Typy z videa @nocode.joshua (záznam 20 v `../referencie-z-videi/references/naucene-z-videi.md`) v tomto slovníku:
tool = augmented LLM, skills = doplnenie postupu (nie je to vzor riadenia), sequential = chaining, parallel =
sectioning, router = routing, human in the loop = kontrolný bod, orchestrator = orchestrator-workers.
Evaluator-optimizer, voting ani autonómny agent vo videu nie sú.

**Ktorý vzor zvoliť**

- Jedna línia zmien, ktorú hneď overí test alebo snímka: bez workflowu („Kedy workflow netreba“).
- Kroky sú známe vopred a každý je ľahší ako celok: chaining s bránou.
- Nezávislé časti: sectioning. Treba istotu úsudku: voting (skeptici, porota).
- Výstup sa dá hodnotiť jasnou rubrikou a ďalšie kolo ho merateľne zlepší: evaluator-optimizer (vzor 9).
- Podúlohy nevieš vopred: plán ako súbor od hlavnej relácie, potom ďalší workflow (ako audit → `davky.json` → opravy).
- Úloha sa dotýka peňazí, klientov alebo zverejnenia: vždy kontrolný bod u majiteľa (`../tim-roly/`).

## Ako písať zadania agentom

Agent nevidí rozhovor ani ostatných agentov; vie len to, čo je v zadaní (a v CLAUDE.md repozitára).

1. **Spoločný kontext** v jednej konštante (`BASE`, `COMMON`, `CTX`, `DOCS`, `BRIEF`), rovnaký pre všetkých:
   - projekt, cesta, adresa nasadenia, jazyk, dátum (keď sa zapisuje dátum získania údajov);
   - **záväzné dokumenty s cestou a obsahom**, napr. `${P}/docs/TOUR_DIRECTION.md (cesta 9 scén, technika, čo sa maže)`;
   - pravidlo pravdy: „nikdy nič nevymýšľaj; čo nenájdeš, označ ako nenájdené“;
   - nástroje s presným príkazom (`node source/shot.mjs <url|/cesta> <nazov> [--scroll=px] …`, cesta k Playwrightu);
   - želanie majiteľa doslova v úvodzovkách a veta „rozhovor s majiteľom nevidíš“;
   - ktoré pravidlá platia, keď je v repozitári viac webov: „pravidlá o názvoch z koreňového CLAUDE.md (HEAD SPA 30)
     sa týkajú iného webu“;
   - čo už je známe alebo sa práve mení: „Už vieme (neopakuj): … Toto upravujem sám.“;
   - hranice: nepushovať, v návrhovej fáze needitovať repozitár, nespúšťať testy súbežne;
   - podmienky merania: „Kontajner nemá grafickú kartu (SwiftShader), preto čas GPU nemeraj ako skutočný“.
2. **Rola a vlastníctvo**: `TVOJA ÚLOHA (vlastníš: …)`, `MAŽEŠ: …`, „Si NEZÁVISLÝ kontrolór“, „Si skeptik č. 1“.
3. **Postup v krokoch s overením**: čo spustiť, ktoré snímky otvoriť nástrojom Read, koľko kôl opráv
   („Iteruj min. 3 kolá opráv“).
4. **Výstup cez schému**: povinné dôkazové polia (`evidence`, `file`, `line`, `confidence`), `enum` pre závažnosť
   a verdikt, pole pre ďalšiu fázu (`notes_for_integrator`, `open_issues`), cesty k súborom namiesto veľkého obsahu
   (`report_path`, `shots`, `diff`), pri textoch pole `facts` so zdrojom každého údaja.
5. **Stav predchádzajúcej fázy** vložený orezaný: `${integ.summary.slice(0, 1500)}`, nálezy
   `${JSON.stringify(todo, null, 1).slice(0, 24000)}`; pri odovzdaní medzi rolami odovzdávací blok (stav, súbory,
   merateľné kritériá prijatia, požadovaný dôkaz, komu výstup ide; `../tim-roly/references/sablony-rol.md`, časť 0).
6. **Jedno meno roly všade**: v zadaní, v `label`, v názve schémy a v odkazoch iných rolí. Orchestrátor Agency
   Agents volá „ArchitectUX“ a „EvidenceQA“, hoci agenti sa volajú „UX Architect“ a „Evidence Collector“;
   odovzdanie potom stojí na tom, či model mená uhádne (rozbor 2026-10-19, `../tim-roly/references/agency-agents.md`).
7. **Nástroje vymenovať.** Subagent Claude Code bez poľa `tools` dedí všetky nástroje (code.claude.com/docs/en/sub-agents);
   v zadaní aj v definícii agenta napíš, čo smie (napr. `Read, Grep, Glob`) a čo nie (zápis, sieť, odosielanie).

Citáty, katalóg rolí a všetky schémy z príkladov: [references/zadania-a-schemy.md](references/zadania-a-schemy.md).
Priebeh a výsledok každého workflowu: [references/priebeh-workflowov.md](references/priebeh-workflowov.md).

## Pasce (lekcie)

| Pasca | Čo sa stalo | Riešenie |
| --- | --- | --- |
| Limit relácie | skeptici nedobehli (CHECKS 8: „Nepotvrdené skeptikmi (limit relácie)“), porota a syntéza strihačov tiež (CHECKS 10) | spočítaj agentov vopred; lacnejší jeden skeptik na oblasť (vzor 4B); výsledky do súborov (strihači: diff a snímky); nedobehnuté over sám a zapíš |
| Nadsadený prínos z auditu | prepočet štýlu: sľub 48,7 → 7,4 ms, namerané 5,1 → 4,8 ms (hlavné vlákno 10,9 → 9,6 ms, CHECKS 13) | meraj pred a po tou istou metódou, do kontrol zapíš namerané |
| Návrh, ktorý rozbije telefón | `width: 200%` pre svetlo po okraji karty | skeptik s otázkou „nič nerozbije?“, zamietnuté zapíš s dôvodom |
| Dvaja vlastníci jedného pravidla | `.film-still` vo `film.css` aj `style.css`, duplikát zmazaný | v rozhraní jeden vlastník na súbor a triedu |
| Test viazaný na starý stav | dymový test hľadal zálohu úvodu podľa `[data-shot="vstup"]`, opravené na `#uvod` (INTEGRATION_LOG) | integrátor upraví testy spolu so zmenou rozhrania |
| Súbežné testy | rozptyl Lighthouse pri súbežných testoch (CHECKS 6) | kontrolóri len čítajú a počítajú; merania spúšťa jeden agent alebo hlavná relácia |
| Zlyhaný agent | `agent()` vráti `null` | `.filter(Boolean)`, náhradný text do ďalšej fázy, `if (!integ) … return` |
| Agent nevidí rozhovor | návrhové workflowy | „rozhovor s majiteľom nevidíš“ a doslovné želanie v zadaní |
| Pravidlá iného webu | `barbershop-30/` je v repozitári HEAD SPA 30 s jeho CLAUDE.md | v kontexte napíš, ktoré pravidlá platia |
| Kód sa mení počas auditu | `audit-fps.js`: „Toto upravujem sám.“ | časť „už vieme“, nech sa nálezy netýkajú starého stavu |
| Veľká stavba pred potvrdením smeru | 3D kreslo postavené, integrované a skontrolované, potom „NOVÝ SMER majiteľa … 3D kreslo sa odstraňuje“ | smer si nechaj potvrdiť skôr (návrhová fáza bez editácie repozitára) |
| Domyslený podklad | chýbajúci súbor s analýzou videí | v zadaní napíš, čo chýba a že sa to nemá vymýšľať |
| Týždenný limit agentov | 2026-10-11: dva workflowy (10 a 5 agentov, spolu okolo 2 miliónov tokenov) dobehli len čiastočne, porota, syntéza a 4 kontroly zlyhali s „You've hit your weekly limit“ | pred spustením spočítaj agentov a tokeny; triedenie a jednoduché fázy lacnejším modelom; medzivýsledky do súborov, aby sa dalo pokračovať ručne |
| Zlyhaný hodnotiteľ ako úspech | `gymklub-redesign-stavba-1:67`: `if (!kontrola …) break`; `2-opravy:47`: `kontroly.filter(Boolean)`, pri troch zlyhaných kontrolách 0 nálezov | vzor 9, stav `NEOVERENE` |
| Port s iným webom | 8765 a 8781 obsluhovali v rôznych behoch iný web | P5: vlastný rozsah, server spúšťa agent a overí titulok |
| Strom zmenil účel | `scratchpad/hs2`: do 2026-10-19 strom toolboxu (vetva `claude/barbershop-hudba`, commity zlúčené do `main`), potom Barbershop; skills čítané odtiaľ sú staré | P4: skill z `main` |
| Kontrola po nasadení | GYM KLUB: úvod bol naživo, kontrola potom potvrdila 25 nálezov | P9 |
| Push z agenta do verejného repozitára | `uloz.sh:26` spúšťa agent (`2-opravy:43, 51, 59`), balí aj kópie pracovných stromov | P7, P8 |

## Pravidlá pre paralelu a orchestrátora (P1 až P10)

Z denníkov behov nástroja Workflow (rozbor 2026-10-20) a zo zdrojov Anthropicu. Systém viacerých agentov
spotrebuje asi 15× viac tokenov ako chat (anthropic.com/engineering/multi-agent-research-system). Claude Code
predvolene odmietne ďalšieho subagenta, keď ich v relácii beží 20, a vnára najviac tri vrstvy pod hlavnou reláciou
(code.claude.com/docs/en/sub-agents, stav 2026-10-20). Pre nástroj Workflow uvádzame „asi 16 naraz“; to je naše
pozorovanie, nemerali sme ho. Odkazy `skript:riadok` sú do originálov mimo repozitára (časť „V tomto repozitári“),
stav 2026-10-20.

- **P1 Rozpočet v hlavičke.** Za blok `meta` napíš komentár: agentov najmenej a najviac, najviac naraz, odhad
  tokenov. Pri viac ako 20 agentoch, pri inom bežiacom workflowe alebo blízko týždenného limitu pusti beh po
  častiach alebo s menej pohľadmi. Skeptik na nález má strop: pri viac ako 12 nálezoch jeden skeptik na oblasť
  (vzor 4B). Dôvod: `gymklub-uvod-overenie` spustil 37 agentov (5 testerov, 32 skeptikov), `2-opravy` má podľa
  kódu 21 až 61 agentov a 2026-10-11 dva súbežné behy narazili na týždenný limit.
- **P2 Zlyhaný hodnotiteľ nie je PASS.** Stavy `NEOVERENE`, `ESKALACIA` a `ZLYHALO` podľa vzoru 9; neoverený nález
  nesie príznak.
- **P3 Brána za každým krokom.** Pred použitím výsledku `if (!x) return { stav: 'ZLYHALO', krok }`. Nikdy
  `x.pole` bez kontroly. Nad zlyhanou implementáciou sa kontrola nespúšťa.
- **P4 Jeden strom, jeden účel, jeden zapisovateľ.** Zoznam pracovných stromov (cesta, vetva, účel, kto zapisuje)
  patrí do `PRIEBEH.md` projektu, nie do pamäti relácie. Iný beh strom len číta a v zadaní to stojí („súbežne iný
  tím v …, NEMEŇ“, vzor `barbershop-co-chyba:16`). Skill sa číta z `main` (`git show origin/main:toolbox/…` alebo
  strom na `main`), nie zo stromu iného projektu. Príklad: `scratchpad/hs2` bol do 2026-10-19 stromom toolboxu
  (vetva `claude/barbershop-hudba`, jej commity sú zlúčené do `main`), potom sa stal vetvou Barbershopu a dnes
  v ňom chýba `skills-senior/`.
- **P5 Porty z tabuľky.** Každý beh dostane vlastný rozsah a každý agent konkrétny port v zadaní. Agent server
  spustí sám a pred testom overí, čo obsluhuje (`curl -s http://127.0.0.1:<port>/ | grep -o '<title>[^<]*'`).
  Nikdy „ak beží, použi ho“. Dôvod: port 8765 obsluhoval GYM KLUB aj kópiu HEAD SPA 30
  (`salon-poukazky-kontrola:19`), port 8781 HEAD SPA 30 aj prototyp Visionary Living (`visionary-living-web2:65`).
  Rozsahy pre nové behy (staré skripty pri opakovaní prečíslovať); 8750 až 8799 ostáva voľné, lebo 8765 a 8781
  majú staré behy a mohli by stále bežať:

  | Projekt | Porty |
  | --- | --- |
  | Barbershop 30 | 8100–8299 audit, 8300–8499 opravy, 8600–8699 prieskum (ako `barbershop-plynulost-audit:14`, `2-opravy:34-36`, `barbershop-co-chyba:30-32`) |
  | GYM KLUB | 8500–8599 |
  | HEAD SPA 30 a vernostná kartička | 8700–8749 |
  | projekty klientov (Zentury, Visionary Living, Stavebniny Richtárik) | 8800–8899 |
  | toolbox, videá, referencie | 8900–8999 |

- **P6 Merania v tichu.** Lighthouse a snímkové časy merať len vtedy, keď nebeží iný beh s prehliadačom, alebo
  súbežnosť zapísať k číslam. V kole kontrol ide meranie až po ostatných pohľadoch, nie súčasne s nimi. Dôvod:
  `2-opravy:46` púšťa kontrolu kódu, meranie a vzhľad naraz a 2026-10-20 medzi 11:20 a 11:30 UTC bežali štyri
  workflowy súčasne.
- **P7 Commit, push, nasadenie.** Implementátor smie commitovať lokálne na svojej pracovnej vetve (kvôli obnove
  a diffu pre kontrolóra). Push, merge do `main` a nasadenie robí len hlavná relácia, po kontrole. Ukladacie
  skripty s pushom (`uloz.sh`) spúšťa hlavná relácia, nie agent (dnes `2-opravy:15, 43, 51, 59`). Súhlas majiteľa
  pred každým pushom do `main` je návrh a čaká na rozhodnutie majiteľa (otázka D1): `CLAUDE.md` ho dnes nežiada,
  `../../head-spa-30/SKILL.md` ho pri HEAD SPA 30 žiada. Ak sa majiteľ rozhodne pre súhlas, má ho vynútiť
  prostredie: pravidlo `ask` na `Bash(git push *)` aj na spúšťanie ukladacích skriptov (napr. `Bash(*uloz.sh*)`)
  v nastaveniach projektu (poradie „deny, then ask, then allow“, code.claude.com/docs/en/permissions). Pravidlo
  pre Bash porovnáva len text príkazu a nie je bezpečnostná hranica: `git push` vnútri skriptu ani `sh -c '…'`
  samo nezachytí (permissions, „What a Bash rule doesn't match“). Subagenti na pozadí posielajú otázky na
  povolenie do hlavnej relácie (sub-agents); či to platí aj pre agentov nástroja Workflow, over krátkym behom.
  Výhrada (permissions, stav 2026-10-20): bez spravovaných nastavení (managed settings) a bez prihlásenia Team
  alebo Enterprise môže nainštalovaný mod s udalosťou `tool.check` schváliť aj volanie, na ktoré by sa pravidlo
  `ask` pýtalo, ba aj volanie, ktoré pravidlo `deny` zamieta. Taký mod bez vedomia majiteľa neinštalovať.
- **P8 Denník a rozhodnutia.** Každý projekt má `PRIEBEH.md` (kroky, stav, ako pokračovať, tabuľka stromov)
  a `ROZHODNUTIA.md`. V ňom sú doslovné slová majiteľa s dátumom a zadania naň odkazujú cestou, namiesto odpisu
  (dnes odpísané v `barbershop-co-chyba:16`, `co-nevidis-tiktok:14`, `gymklub-redesign-stavba-1:19-21`). Uloženie
  pre obnovenie berie len texty a skripty, nie kópie pracovných stromov: `uloz.sh:9-10` dnes pribalí aj súbory
  z kópií stromov `opravy/pred-D1` a `opravy/D1`. Repozitár je verejný.
- **P9 Najprv kontrola, potom nasadenie.** Kontrola beží nad vetvou alebo lokálnym náhľadom. Veta „práve bol
  nasadený“ (`gymklub-uvod-overenie:10`) sa v zadaní kontroly nemá objaviť. Kontrola GYM KLUB po nasadení
  potvrdila 25 nálezov, ktoré už boli naživo.
- **P10 Najjednoduchšie riešenie.** Pred workflowom napíš do hlavičky jednu vetu: prečo nestačí jeden agent alebo
  priama práca (Building effective agents: „finding the simplest solution possible“).

## V tomto repozitári

- Skripty: [`priklady/`](priklady/) (tabuľka nižšie). Originály sú mimo repozitára v
  `~/.claude/projects/<projekt>/<relácia>/workflows/scripts/<meno>-wf_<hash>.js`.
- Podklady a výsledky v `barbershop-30/docs/`: `CONTRACT.md` (rozhranie pre stavbu modulov, z obdobia 3D kresla),
  `MASTER_BRIEF.md` časť 4 (postup práce), `INTEGRATION_LOG.md`, `CHECKS.md` (časti 8, 10, 11 a 13 sú z workflowov),
  `COMPARISON.md`, `CONTENT_SOURCES.md`, `MEDIA_SELECTION.md`. Správy kontrolórov `docs/reviews/*.md` v repozitári
  nie sú; nálezy a opravy zhŕňa `CHECKS.md`.
- Súvisiace skills: [`../rychly-web/references/audit.md`](../rychly-web/references/audit.md) (audit-fps), [`../obsah-a-texty/references/popisy-ludi.md`](../obsah-a-texty/references/popisy-ludi.md)
  (textári), [`../film-z-fotiek/references/strihy.md`](../film-z-fotiek/references/strihy.md) (strihy),
  [`../tim-roly/`](../tim-roly/SKILL.md) (roly podľa gstack a ECC: otázky, kontrolné zoznamy, zadania a schémy; vzory 7 a 8).

| Príklad | Pôvodné meno | Vzor | Fázy (agenti) | Kedy sa osvedčil |
| --- | --- | --- | --- | --- |
| `audit-webu.js` | barbershop30-audit | 1 | Výskum, Fotky, Referencie, Technika (6) | začiatok BARBERSHOP 30, 2026-10-09 |
| `stavba-webu.js` | barbershop30-stavba | 2 | Stavba, Integrácia (4) | prvá verzia s 3D kreslom |
| `integracia-a-kontrola.js` | barbershop30-integracia-kontrola | 3 | Integrácia, Kontrola, Oprava (6) | po prvej stavbe |
| `prehliadka-filmu.js` | barbershop30-prehliadka | 2 a 3 | Stavba, Integrácia, Kontrola, Oprava (8) | prestavba na prehliadku, 2026-10-09 |
| `kontrola-ostrosti-prechodov.js` | kontrola-ostrost-prechody | 4A | Kontrola, Overenie (4 + 2 na nález) | maximálny detail, CHECKS 8 |
| `kontrola-kodu-kompozicie-vykonu.js` | kontrola-kod-kompozicia-vykon | 4A | Kontrola, Overenie (3 + 2 na nález) | návrat na ulicu, CHECKS 8 |
| `filmovy-navrh-podla-videa.js` | barbershop-filmovy-navrh | 5 | Rozbor, Texty, Rozloženie, Videá, Kritika (10) | ako na videu, CHECKS 10 |
| `strihaci-prechodov.js` | barbershop-prechody-strih | 5 | Strihači, Porota, Syntéza (6) | strihy prechodov, CHECKS 10 |
| `textari-popisov.js` | popisy-barberov | 5 | Písanie, Porota, Syntéza, Kontrola (7) | popisy barberov, CHECKS 11 |
| `audit-fps.js` | audit-fps | 4B | Audit, Overenie (6) | plynulosť, CHECKS 13 |
| `spisanie-toolboxu.js` | toolbox-skills-z-praxe | 6 | Písanie, Overenie (14) | tento toolbox |
| `smerovanie-podla-narocnosti.js` | (šablóna) | smerovanie | Triedenie, Práca, Overenie (1 + úlohy + zložité) | zatiaľ nespustená, z rozboru RuFlo 2026-10-12 |
| `brana-dvoch-recenzentov.js` | (šablóna) | 7 | Recenzia, Oprava (2 na kolo + opravár, najviac 8) | skúška s falošnými agentmi, z rozboru ECC 2026-10-17 |
| `tim-roly-plan.js` | (šablóna) | 8 | Revízia, Overenie, Otázky (3 + 3 + 1) | skúška s falošnými agentmi, z rozboru gstack 2026-10-17 |
| `siet-tim.js` | (šablóna) | sieť agentov (vzor 9 na viac úloh) | Stav, Stavba, Kontrola, Oprava (2 až 12 na úlohu + 1 + úlohy) | skúška s falošnými agentmi (39 behov), z rozboru denníkov 2026-10-20 |

## Kontrolný zoznam

- [ ] Workflow naozaj treba: nezávislé časti, nezávislý pohľad alebo viac návrhov; inak pracuj priamo.
- [ ] Podklady sú na disku a v zadaní je ich cesta a obsah (brief, rozhranie, zdroje faktov, nástroje).
- [ ] Spoločný kontext: projekt, cesty, pravidlo pravdy, ktoré CLAUDE.md platí, čo agent nevidí, čo už je známe.
- [ ] Rozhranie medzi modulmi je zapísané pred stavbou; každý súbor a trieda má jedného vlastníka.
- [ ] Každý agent má schému; dôkazové polia sú povinné; je pole pre ďalšiu fázu.
- [ ] Kontrolóri a audítori needitujú a nespúšťajú súbežné testy; podmienky merania sú v zadaní.
- [ ] Nálezy sa pred úpravou overujú (skeptik); pri neistote sa zamietajú.
- [ ] `null` výsledky sú ošetrené: zlyhaný hodnotiteľ = `NEOVERENE`, posledné kolo s vážnymi nálezmi =
      `ESKALACIA`, zlyhaný implementátor = `ZLYHALO` (vzor 9); kontrola sa nespustí na nehotovom.
- [ ] Rozpočet je v hlavičke (agenti najmenej a najviac, naraz, tokeny), skeptici majú strop, beh má vlastný
      rozsah portov; medzivýsledky sú v súboroch (P1, P5).
- [ ] Opravy sú overené tou istou metódou a zapísané (aj zamietnuté a nezapracované, s dôvodom).
- [ ] Push, merge do `main` a nasadenie robí hlavná relácia po kontrole (súhlas majiteľa: návrh, otázka D1);
      rozhodnutia majiteľa sú v `ROZHODNUTIA.md`; osvedčený skript je v `priklady/` (P7 až P9).
- [ ] Pri sieti úloh: dispečer prešiel pred spustením, najviac 3 ťažké agenty v kontajneri, brief do 2 kB namiesto
      dokumentu, kontrola podľa rizika, odovzdávka na konci, fail closed pri limite, check-in naplánovaný (časť „Sieť agentov“).

## Lekcia: smer vizuálu potvrdiť u majiteľa skôr, než sa postaví celý web (VISIONARY LIVING, 10/2026)

Porota (tri návrhy, traja sudcovia, syntéza) vybrala smer „projektová dokumentácia“ (rám listu, pečiatka, kóty) a web sa podľa
neho celý postavil, otestoval a nasadil. Majiteľ ho potom odmietol jednou vetou: „nech to nepôsobí ako dokument, nech je to
profesionálny web s animáciami“. Porota optimalizovala odlišnosť a remeslo, nie očakávanie majiteľa, ktorý chcel bežný prémiový
realitný web, len živší.

- Po porote poslať majiteľovi 2 až 3 snímky víťaza (titulka počítač + telefón) s jednou vetou „staviam toto“ a počkať na krátke
  áno, ak sa smer odlišuje od toho, čo majiteľ pozná (jeho starý web, konkurencia). Stavba 20 stránok trvá hodiny; odpoveď minútu.
- Do kritérií poroty pridať „očakávanie majiteľa“ (čo videl, čo pozná, aký web si predstavuje) ako samostatné kritérium s váhou,
  nie len „odlišnosť“. Sudca „kupujúci“ nestačí – treba aj sudcu „majiteľ“, ktorý číta pôvodné zadanie doslovne.
- Odlišné metafory (výkres, noviny, film) ponúkať ako jednu z možností, nie ako víťaza bez potvrdenia.
- Obsah, generátor, výberovník, testy a výkon ostali použiteľné – oddeliť vizuál (CSS, markup sekcií) od dát a správania
  sa oplatilo: nový vizuál je nová porota + prepis štýlu, nie nový web.
