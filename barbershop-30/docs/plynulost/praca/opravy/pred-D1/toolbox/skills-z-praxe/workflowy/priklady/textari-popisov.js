export const meta = {
  name: 'popisy-barberov',
  description: 'Traja textári napíšu popisy barberov, dvaja porotcovia ich ohodnotia, syntéza a kontrola pravidiel',
  phases: [
    { title: 'Písanie', detail: 'traja textári, každý iný uhol' },
    { title: 'Porota', detail: 'pravidlá a fakty; zákazník a elegancia' },
    { title: 'Syntéza', detail: 'výber najlepšieho pre každého barbera' },
    { title: 'Kontrola', detail: 'jazyk, pravidlá, opakovanie' },
  ],
}

// Príklad z praxe: porota textov, krátke popisy desiatich barberov BARBERSHOP 30
// (pôvodne workflow „popisy-barberov“, 2026-10-11).
// Vzor: traja textári s rôznym uhlom (remeslo, hosť, charakter), dvaja porotcovia (pravidlá a fakty;
// zákazník), syntéza podľa súčtu skóre, nakoniec korektor a skeptik opraví porušenia najmenším zásahom.
// Kedy sa osvedčil: popisy sú v barbershop-30/index.html (.team-bio), 43 až 68 znakov, bez faktov
// o osobe (docs/CHECKS.md časť 11).
// Spustenie: nástroj Workflow so scriptPath na tento súbor. Mená a pravidlá sú v TEAM a BRIEF.
// Oproti originálu pribudol len tento komentár (krstné mená a roly sú tie, ktoré tím uvádza na webe).

const TEAM = [
  ['Nikolas', 'Barber'], ['Kristián', 'Barber'], ['Damian', 'Barber'], ['Michal', 'Barber'], ['Andy', 'Barber'],
  ['Dominika', 'Barberka'], ['Kevin', 'Barber'], ['Lajko', 'Barber'], ['Jojo', 'Barber'], ['Adrian', 'Barber'],
]

const BRIEF = `
Úloha: krátke popisy pre 10 kariet tímu na webe BARBERSHOP 30 (Mostná 30, Nitra), súbor
/home/user/head-spa-30/barbershop-30/index.html, sekcia #tim (karty .team-card: portrét, meno .team-name, rola .team-role).
Majiteľ chce: "ku každému barberovi popisok, že je strašne dobrý barber atď., pekný, príjemný a elegantný popis".

Tím (meno, rola presne podľa webu podniku): ${TEAM.map(([n, r]) => n + ' (' + r + ')').join(', ')}.
Dominika je žena (barberka): rod a tvary slov musia sedieť (napr. "jej ruka", "s ňou", "ona").

Overené fakty, ktoré platia pre celý podnik (nie pre konkrétneho človeka):
- strihá sa od roku 2019; 8 kresiel; recepčná; káva a minerálka zdarma; online rezervácia 24/7; strihajú aj deti (do 10 rokov)
- pánsky strih: konzultácia, strojček a nožnice, techniky fade, umytie, fénovanie, záverečný styling, kolínska
- brada: horúci uterák, britva, styling s prípravkami; holenie do hladka; ultra inclusive s pohárikom whisky
- podnik o sebe píše: poctivé remeslo s moderným štýlom, profi tím, skúsení barberi, ľudskosť
O jednotlivých barberoch nevieme NIČ okrem mena a roly (žiadne roky praxe, špecializácie, ocenenia, záľuby, pôvod).

Pravidlá (povinné):
1. Nič nevymýšľaj o konkrétnom človeku: žiadne čísla, roky praxe, súťaže, ocenenia, špecializácia ("je špecialista na fade",
   "najradšej robí brady"), záľuby, povaha opísaná ako fakt o živote. Pochvala remesla a prístupu je v poriadku, lebo ju chce
   majiteľ: presnosť, pokoj, pozornosť, istá ruka, čistý výsledok, počúva ťa, odídeš spokojný. Prvky remesla (nožnice, britva,
   strojček, fade, horúci uterák) môžeš použiť ako obraz, ale nie ako tvrdenie, že ich daný človek robí lepšie ako ostatní.
2. Žiadne porovnávanie a superlatívy ako tvrdenie: nie "najlepší v Nitre", "číslo jeden", "top", "100 %", "legenda".
   Kvalitu povedz elegantne a sebavedomo, nie krikľavo.
3. Tykanie zákazníkovi (ty, tvoj, odídeš). Slovenčina, spisovná, prirodzená, bez anglicizmov okrem slov barber, fade.
4. Dĺžka: jedna, najviac dve krátke vety; najviac 95 znakov vrátane medzier na jeden popis. Karta je úzka (asi 240 px na telefóne).
5. Žiadne pomlčky (ani em dash, ani en dash, ani spojovník ako pomlčka medzi slovami), žiadne výkričníky, žiadne emoji,
   žiadne úvodzovky.
6. Každý popis iný: žiadne dva popisy nesmú začínať rovnako ani stavať na rovnakom kľúčovom slove alebo rovnakej vete
   so zmeneným menom. Opakovanie slov ako "presný", "pokojný", "istá ruka" najviac dvakrát v celej desiatke.
7. Tón webu: elegantný, zdržanlivý, tmavý a teplý (orech, zlatá), filmový. Ukážky textov, ktoré už na webe sú:
   "Tvoj strih. Tvoje miesto." / "Najprv káva. Potom strih." / "Sadni si a vydýchni." / "Povedz, ako to chceš."
   / "Komu zveríš hlavu?" / "Odchádzaš s hlavou hore."
8. Meno v popise netreba opakovať (je nad ním ako nadpis); ak ho použiješ, tak výnimočne.

Okrem 10 popisov napíš aj nový úvodný riadok sekcie (.lead nad kartami), ktorý nahradí terajší
"Mená a roly presne tak, ako ich tím uvádza. Každý z nich je v rezervácii, vyber si toho svojho."
Najviac 2 krátke vety, rovnaké pravidlá.
`

const DRAFT = {
  type: 'object',
  properties: {
    lead: { type: 'string' },
    bios: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, text: { type: 'string' } }, required: ['name', 'text'] } },
    notes: { type: 'string' },
  },
  required: ['lead', 'bios'],
}

const ANGLES = [
  { key: 'A', label: 'remeslo', prompt: 'Tvoj uhol: remeslo a ruka. Konkrétne zmyslové obrazy práce (nožnice, britva, čistá línia, horúci uterák), ako by si písal titulky k filmu o remesle. Krátke, rytmické vety.' },
  { key: 'B', label: 'hosť', prompt: 'Tvoj uhol: zážitok hosťa v kresle. Pokoj, dôvera, že ťa niekto počúva, chvíľa pre seba, odchod s dobrým pocitom. Teplé, ľudské, elegantné.' },
  { key: 'C', label: 'charakter', prompt: 'Tvoj uhol: sebavedomá elegancia značky. Každý popis ako krátky výrok s ľahkou pointou alebo kontrastom (dve polovice vety), aby si ho zákazník zapamätal. Chválu povedz s noblesou, bez krikľavosti.' },
]

phase('Písanie')
const drafts = (await parallel(ANGLES.map((a) => () =>
  agent(`${BRIEF}\n${a.prompt}\nVráť lead a presne 10 popisov v poradí tímu (name = krstné meno presne ako vyššie). Pred odovzdaním si každý popis spočítaj (znaky) a skontroluj pravidlá 1 až 8.`,
    { label: `textár ${a.key} (${a.label})`, phase: 'Písanie', schema: DRAFT })
    .then((d) => (d ? { key: a.key, label: a.label, ...d } : null))
))).filter(Boolean)
log(`Návrhy: ${drafts.map((d) => d.key).join(', ')}`)

const show = drafts.map((d) => `NÁVRH ${d.key} (${d.label})\nlead: ${d.lead}\n` + d.bios.map((b) => `${b.name}: ${b.text}`).join('\n')).join('\n\n')

const JUDGE = {
  type: 'object',
  properties: {
    perBarber: { type: 'array', items: { type: 'object', properties: {
      name: { type: 'string' }, best: { type: 'string' },
      scores: { type: 'object', properties: { A: { type: 'number' }, B: { type: 'number' }, C: { type: 'number' } } },
      issues: { type: 'array', items: { type: 'string' } } }, required: ['name', 'best', 'scores'] } },
    lead: { type: 'object', properties: { best: { type: 'string' }, issues: { type: 'array', items: { type: 'string' } } }, required: ['best'] },
    general: { type: 'string' },
  },
  required: ['perBarber', 'lead'],
}

phase('Porota')
const JUDGES = [
  { key: 'pravidla', prompt: 'Si prísny porotca pre pravidlá a fakty. Pre každý popis skontroluj pravidlá 1 až 8 (najmä vymyslené fakty o človeku, superlatívy, dĺžku do 95 znakov, pomlčky, rod pri Dominike, gramatiku a prirodzenosť slovenčiny). Skóre 1 až 10; porušenie pravidla 1, 2 alebo 5 znamená najviac 3 body.' },
  { key: 'zakaznik', prompt: 'Si porotca za zákazníka: muž z Nitry 20 až 45 rokov, ktorý si na telefóne vyberá, ku komu sa objedná. Hodnoť, či popis znie elegantne a príjemne, či z neho cítiť, že ide o veľmi dobrého barbera, či by si ho zapamätal a či nepôsobí ako lacná reklama alebo šablóna. Skóre 1 až 10.' },
]
const verdicts = (await parallel(JUDGES.map((j) => () =>
  agent(`${BRIEF}\n${j.prompt}\n\nNávrhy troch textárov:\n\n${show}\n\nPre každého barbera urči najlepší návrh (A, B alebo C) a skóre všetkých troch, vypíš konkrétne problémy (napr. "B Kevin: 102 znakov"). Urči aj najlepší lead.`,
    { label: `porotca ${j.key}`, phase: 'Porota', schema: JUDGE })
    .then((v) => (v ? { judge: j.key, ...v } : null))
))).filter(Boolean)

const FINAL = {
  type: 'object',
  properties: {
    lead: { type: 'string' },
    bios: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, text: { type: 'string' }, from: { type: 'string' } }, required: ['name', 'text'] } },
    rationale: { type: 'string' },
  },
  required: ['lead', 'bios'],
}

phase('Syntéza')
const synth = await agent(`${BRIEF}\nSi hlavný textár. Z troch návrhov a hodnotení dvoch porotcov zostav finálnu desiatku a lead.
Pre každého barbera vezmi najlepší popis podľa súčtu skóre, oprav problémy, ktoré porotcovia našli, a dbaj na pravidlo 6
(desiatka ako celok sa nesmie opakovať: rôzne začiatky, rôzne obrazy, striedanie rytmu). Môžeš jemne upraviť slovo
alebo spojiť nápady, ale neprepisuj dobré texty zbytočne. Pole from = odkiaľ text je (A, B, C alebo úprava).

${show}

Hodnotenia porotcov (JSON):
${JSON.stringify(verdicts)}`, { label: 'syntéza', phase: 'Syntéza', schema: FINAL })

const CHECK = {
  type: 'object',
  properties: {
    ok: { type: 'boolean' },
    problems: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, problem: { type: 'string' }, fix: { type: 'string' } }, required: ['name', 'problem'] } },
    final: FINAL,
  },
  required: ['ok', 'problems', 'final'],
}

phase('Kontrola')
const check = await agent(`${BRIEF}\nSi korektor a skeptik. Snaž sa v tejto finálnej sade nájsť každé porušenie pravidiel 1 až 8:
spočítaj znaky každého popisu (vypíš počty), hľadaj akúkoľvek pomlčku alebo spojovník medzi slovami, výkričník,
úvodzovky, superlatív, vymyslený fakt o konkrétnom človeku, zlý rod pri Dominike, gramatické chyby, neprirodzené
slovné spojenia, opakovanie začiatkov alebo kľúčových slov v rámci desiatky. Každý problém oprav čo najmenším
zásahom a vráť opravenú sadu vo final (ak je všetko v poriadku, vráť ju nezmenenú a ok = true).

Finálna sada:
lead: ${synth ? synth.lead : ''}
${synth ? synth.bios.map((b) => `${b.name}: ${b.text}`).join('\n') : ''}`, { label: 'kontrola', phase: 'Kontrola', schema: CHECK })

return { drafts, verdicts, synth, check }
