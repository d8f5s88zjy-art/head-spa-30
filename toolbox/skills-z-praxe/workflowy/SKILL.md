---
name: workflowy
description: Práca s viacerými agentmi naraz (nástroj Workflow v Claude Code, multi-agent orchestration) pri tvorbe a kontrole webu. Stavba po moduloch paralelne s pevným rozhraním, integrácia, nezávislá kontrola z viacerých pohľadov (prístupnosť, pravdivosť, výkon, kreatíva), porota návrhov (textári, strihači), audit s overením každého nálezu skeptikom (code review, Lighthouse, fps), brána dvoch recenzentov pred odovzdaním majiteľovi a revízia plánu tímom rolí (podľa ECC a gstack). Použi pri väčšej úlohe pre viac agentov, pri písaní zadaní agentom a schém výstupu (JSON schema) aj keď zvažuješ, či workflow vôbec treba. 11 spustených skriptov a tri šablóny (smerovanie podľa náročnosti, brána, tím rolí) v priklady/.
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

## Kedy workflow netreba

- **Jedna línia zmien** v pár súboroch, ktorú hneď overí cielený test alebo snímka. Návrat na ulicu, plynulý
  úvod na telefóne a sekvencie snímok z videa (`barbershop-30/docs/CHECKS.md` časti 7, 9 a 12) sa robili priamo;
  hotový návrat na ulicu potom nezávisle skontroloval workflow (`priklady/kontrola-kodu-kompozicie-vykonu.js`).
- **Merania výkonu a Lighthouse súbežne s inými behmi**: súbežné behy si berú CPU (CHECKS 6: „súbežne bežali
  iné testy, preto rozptyl“). Kontrolóri v `kontrola-*.js` preto testy nespúšťali („NESPÚŠŤAJ prehliadačové
  testy ani Playwright (bežia práve inde a súperili by o CPU)“). Kde meranie vo workflowe bolo (kontrolór výkonu
  v `integracia-a-kontrola.js`, audítori v `audit-fps.js`), zadanie uvádzalo podmienky merania; meranie pred
  a po úprave tou istou metódou je v CHECKS 13 (úpravy robila hlavná relácia, audit súbory nemenil).
- **Commit, push a nasadenie**: robí hlavná relácia po kontrole („Nepushuj do gitu (commit robí orchestrátor).“).
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
| 60 agentov naraz | nástroj púšťa naraz najviac asi 16 a relácia má týždenný limit agentov | menej, ale cielených agentov (pasca nižšie) |

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
   `${JSON.stringify(todo, null, 1).slice(0, 24000)}`.

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

## Kontrolný zoznam

- [ ] Workflow naozaj treba: nezávislé časti, nezávislý pohľad alebo viac návrhov; inak pracuj priamo.
- [ ] Podklady sú na disku a v zadaní je ich cesta a obsah (brief, rozhranie, zdroje faktov, nástroje).
- [ ] Spoločný kontext: projekt, cesty, pravidlo pravdy, ktoré CLAUDE.md platí, čo agent nevidí, čo už je známe.
- [ ] Rozhranie medzi modulmi je zapísané pred stavbou; každý súbor a trieda má jedného vlastníka.
- [ ] Každý agent má schému; dôkazové polia sú povinné; je pole pre ďalšiu fázu.
- [ ] Kontrolóri a audítori needitujú a nespúšťajú súbežné testy; podmienky merania sú v zadaní.
- [ ] Nálezy sa pred úpravou overujú (skeptik); pri neistote sa zamietajú.
- [ ] `null` výsledky sú ošetrené; kontrola sa nespustí na nehotovom.
- [ ] Počet agentov je spočítaný voči limitu relácie; medzivýsledky sú v súboroch.
- [ ] Opravy sú overené tou istou metódou a zapísané (aj zamietnuté a nezapracované, s dôvodom).
- [ ] Commit a nasadenie robí hlavná relácia; osvedčený skript je v `priklady/`.

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
