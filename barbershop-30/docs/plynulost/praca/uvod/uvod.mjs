// Úvodná správa webu Barbershop 30 podľa majiteľa (28. 10. 2026): „Každý človek. Každé želanie. Jedno miesto.“
// nahradí „Tvoj strih. Tvoje miesto.“ v nadpise úvodu, v og:title, v 7 slovníkoch i18n, v teste anglickej stránky,
// vo vývojovej stránke filmu a v README. Každá náhrada musí sedieť práve raz, inak skript padne a nič nezapíše.
//   node uvod.mjs <koreň stromu>
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.argv[2];
const SITE = path.join(ROOT, 'barbershop-30');
const LANGS = ['cs', 'en', 'de', 'hu', 'pl', 'sr', 'uk'];
const vystup = new Map();
const citaj = (f) => (vystup.has(f) ? vystup.get(f) : fs.readFileSync(f, 'utf8'));
function nahrad(f, stare, nove) {
  const s = citaj(f);
  const n = s.split(stare).length - 1;
  if (n !== 1) throw new Error(`${path.relative(ROOT, f)}: „${stare.slice(0, 70)}“ nájdené ${n}×, čakané 1×`);
  vystup.set(f, s.replace(stare, () => nove));
}
const NB = ' ';
// nové kľúče (slovenčina v HTML) a preklady; og:title má po vzore doterajších prekladov nezlomiteľnú medzeru v „Barbershop 30“
const SLOGAN = ['Každý človek.', 'Každé želanie.', 'Jedno miesto.'];
const OG_SK = 'Barbershop 30 Nitra – Každý človek. Každé želanie. Jedno miesto.';
const P = {
  cs: ['Každý člověk.', 'Každé přání.', 'Jedno místo.', `Barbershop${NB}30 Nitra – Každý člověk. Každé přání. Jedno místo.`],
  en: ['Every person.', 'Every wish.', 'One place.', `Barbershop${NB}30 Nitra – Every person. Every wish. One place.`],
  de: ['Jeder Mensch.', 'Jeder Wunsch.', 'Ein Ort.', `Barbershop${NB}30 Nitra – Jeder Mensch. Jeder Wunsch. Ein Ort.`],
  hu: ['Minden ember.', 'Minden kívánság.', 'Egy hely.', `Barbershop${NB}30 Nyitra – Minden ember. Minden kívánság. Egy hely.`],
  pl: ['Każdy człowiek.', 'Każde życzenie.', 'Jedno miejsce.', `Barbershop${NB}30 Nitra – Każdy człowiek. Każde życzenie. Jedno miejsce.`],
  sr: ['Svaki čovek.', 'Svaka želja.', 'Jedno mesto.', `Barbershop${NB}30 Nitra – Svaki čovek. Svaka želja. Jedno mesto.`],
  uk: ['Кожна людина.', 'Кожне бажання.', 'Одне місце.', `Barbershop${NB}30 Нітра – Кожна людина. Кожне бажання. Одне місце.`],
};

// 1. index.html: nadpis úvodu (tri vety, kurzíva ostáva na poslednej), poznámky, og:title
const INDEX = path.join(SITE, 'index.html');
nahrad(INDEX,
  '<!-- nadpisok je súčasťou H1: Google aj čítačka čítajú „Barbershop 30 · Nitra, Tvoj strih. Tvoje miesto.“ -->',
  '<!-- nadpisok je súčasťou H1: Google aj čítačka čítajú „Barbershop 30 · Nitra, Každý človek. Každé želanie. Jedno miesto.“\n                   (úvodná správa podľa majiteľa, 28. 10. 2026) -->');
nahrad(INDEX,
  '<span class="w">Tvoj strih.</span> <span class="w"><em>Tvoje miesto.</em></span></h1>',
  `<span class="w">${SLOGAN[0]}</span> <span class="w">${SLOGAN[1]}</span> <span class="w"><em>${SLOGAN[2]}</em></span></h1>`);
nahrad(INDEX, '<meta property="og:title" content="Barbershop 30 Nitra – Tvoj strih. Tvoje miesto.">', `<meta property="og:title" content="${OG_SK}">`);
nahrad(INDEX, '<!-- kurzíva je v nadpise úvodu (Tvoje miesto), bez prednačítania', '<!-- kurzíva je v nadpise úvodu (Jedno miesto), bez prednačítania');
nahrad(path.join(SITE, 'rezervacia.html'), '<!-- kurzíva je v nadpise úvodu (Tvoje miesto), bez prednačítania', '<!-- kurzíva je v nadpise úvodu (Jedno miesto), bez prednačítania');

// 2. style.css: tri vety nadpisu zaostria po sebe (deti H1: nadpisok, veta, veta, veta)
nahrad(path.join(SITE, 'assets', 'style.css'),
  '.title-hero h1 .w:first-child { animation-delay: 150ms; }\n.title-hero h1 .w:nth-child(2) { animation-delay: 300ms; }',
  '.title-hero h1 .w:nth-child(2) { animation-delay: 150ms; }\n.title-hero h1 .w:nth-child(3) { animation-delay: 300ms; }\n.title-hero h1 .w:nth-child(4) { animation-delay: 450ms; }');

// 3. slovníky: kľúče na tom istom mieste, formát ako doteraz (JSON.stringify bez odsadenia)
const MAPA = new Map([['Tvoj strih.', 0], ['Tvoje miesto.', 2], ['Barbershop 30 Nitra – Tvoj strih. Tvoje miesto.', 3]]);
for (const l of LANGS) {
  const f = path.join(SITE, 'assets', 'i18n', `${l}.json`);
  const s = fs.readFileSync(f, 'utf8');
  const d = JSON.parse(s);
  if (JSON.stringify(d) !== s) throw new Error(`${l}.json: iný formát než JSON.stringify`);
  const out = {};
  let najdene = 0;
  for (const [k, v] of Object.entries(d)) {
    if (!MAPA.has(k)) { out[k] = v; continue; }
    najdene++;
    const i = MAPA.get(k);
    if (i === 0) { out[SLOGAN[0]] = P[l][0]; out[SLOGAN[1]] = P[l][1]; }
    else if (i === 2) out[SLOGAN[2]] = P[l][2];
    else out[OG_SK] = P[l][3];
  }
  if (najdene !== 3) throw new Error(`${l}.json: našiel som ${najdene} starých kľúčov, čakané 3`);
  vystup.set(f, JSON.stringify(out));
  console.log(`${l}.json: ${Object.keys(d).length} → ${Object.keys(out).length} kľúčov`);
}

// 4. test anglickej stránky, vývojová stránka filmu, README
nahrad(path.join(SITE, 'source', 'tools', 'en-test.mjs'), "/Your cut|Your place/i.test(info.h1)", "/Every person|One place/i.test(info.h1)");
nahrad(path.join(SITE, 'source', 'film-dev.html'), '<h1>Tvoj strih. Tvoje miesto.</h1>', '<h1>Každý človek. Každé želanie. Jedno miesto.</h1>');
nahrad(path.join(SITE, 'README.md'), '„Tvoj strih. Tvoje', '„Každý človek. Každé želanie. Jedno');

for (const [f, s] of vystup) fs.writeFileSync(f, s);
console.log(`zapísané: ${[...vystup.keys()].map((f) => path.relative(ROOT, f)).join(', ')}`);
