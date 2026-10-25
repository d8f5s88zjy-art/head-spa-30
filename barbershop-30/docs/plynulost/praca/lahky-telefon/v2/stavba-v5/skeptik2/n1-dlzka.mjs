// skeptik 2, trieda N1: „dlhé vlasy“ + číslo pod 10 cm → nesmie byť holá cena nad 10 cm (22 €)
// node n1-dlzka.mjs <strom/barbershop-30>
import { readFileSync } from 'node:fs';
const root = process.argv[2];
const { odpovedz } = await import(root + '/assets/recepcia.js');
const S = {
  sk: [['Koľko stojí strih, mám {a} vlasy, {n} cm?', 'Mám {a} vlasy ({n} cm), koľko za strih?'], ['dlhé', 'dlhšie', 'dosť dlhé']],
  cs: [['Kolik stojí střih, mám {a} vlasy, {n} cm?', 'Mám {a} vlasy ({n} cm), kolik za střih?'], ['dlouhé', 'delší', 'docela dlouhé']],
  en: [['How much is a haircut, my hair is {a}, {n} cm?', 'I have {a} hair ({n} cm), what does a cut cost?'], ['long', 'longer', 'quite long']],
  de: [['Was kostet ein Haarschnitt, meine Haare sind {a}, {n} cm?', 'Ich habe {a} Haare ({n} cm), was kostet der Schnitt?'], ['lang', 'länger', 'lange']],
  pl: [['Ile kosztuje strzyżenie, mam {a} włosy, {n} cm?', 'Mam {a} włosy ({n} cm), ile za strzyżenie?'], ['długie', 'dłuższe', 'dość długie']],
  sr: [['Koliko košta šišanje, imam {a} kosu, {n} cm?', 'Imam {a} kosu ({n} cm), koliko košta šišanje?'], ['dugu', 'dužu', 'prilično dugu']],
  uk: [['Скільки коштує стрижка, у мене {a} волосся, {n} см?', 'Маю {a} волосся ({n} см), скільки коштує стрижка?'], ['довге', 'довше', 'досить довге']],
  hu: [['Mennyibe kerül a hajvágás, {a} a hajam, {n} cm?', '{a} hajam van ({n} cm), mennyibe kerül a vágás?'], ['hosszú', 'hosszabb', 'elég hosszú']],
};
let spolu = 0, hole = 0; const prik = {}, poj = {};
for (const [j, [vz, adj]] of Object.entries(S)) {
  const kb = JSON.parse(readFileSync(`${root}/assets/recepcia/${j}.json`, 'utf8'));
  poj[j] = [0, 0];
  for (const v of vz) for (const a of adj) for (let n = 1; n <= 9; n++) {
    const q = v.replace('{a}', a).replace('{n}', n); const r = odpovedz(q, kb); spolu++; poj[j][1]++;
    if (r.typ === 'odpoved' && JSON.stringify(r.p.odpoved).includes('€')) { hole++; poj[j][0]++; prik[j] ??= `${q} → ${r.id} ${JSON.stringify(r.p.odpoved[0])}`; }
  }
}
console.log(`N1: otázok ${spolu}, holá cena ${hole}`);
for (const [j, [h, s]] of Object.entries(poj)) console.log(`  ${j}: ${h}/${s}${prik[j] ? '  napr. ' + prik[j] : ''}`);
