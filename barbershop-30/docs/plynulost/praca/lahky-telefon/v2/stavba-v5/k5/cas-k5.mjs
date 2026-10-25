// opakované meranie najpomalších otázok (medián zo 7 behov po zahriatí) + 200-znakové vstupy
import fs from 'node:fs'; import path from 'node:path'; import { performance } from 'node:perf_hooks';
const ROOT = path.resolve(process.argv[2]);
const { odpovedz } = await import(path.join(ROOT, 'assets/recepcia.js'));
const KB = {}; const kb = (l) => (KB[l] ||= JSON.parse(fs.readFileSync(path.join(ROOT, `assets/recepcia/${l}.json`), 'utf8')));
const Q = JSON.parse(fs.readFileSync(new URL('./najpomalsie.json', import.meta.url)));
const dlhe = [
  ['sk', 'kolko stoji '.repeat(17)], ['sk', 'Koľko stojí pánsky strih a úprava brady a holenie hlavy a farbenie brady a depilácia uší a nosa a starostlivosť o pleť a ornament a obočie pre syna a pre mňa v sobotu?'.slice(0, 200)],
  ['de', 'Herrenhaarschnittbartpflegekopfrasurglattrasurhautpflegeaugenbrauenkorrekturohrenundnasenwaxingbartfaerbung '.repeat(2).slice(0, 200)],
  ['uk', 'Скільки коштує чоловіча стрижка і оформлення бороди і гоління голови і фарбування бороди і догляд за шкірою для сина і для мене в суботу о 9:30?'.slice(0, 200)],
  ['hu', 'a b c d e f g h i j k l m n o p q r s t u v w x y z '.repeat(4).slice(0, 200)],
  ['pl', 'strzyżenie '.repeat(18).slice(0, 200)], ['en', 'how long how long how long '.repeat(8).slice(0, 200)],
];
const med = (l, q) => { const k = kb(l); for (let i = 0; i < 3; i++) odpovedz(q, k); const t = []; for (let i = 0; i < 7; i++) { const a = performance.now(); odpovedz(q, k); t.push(performance.now() - a); } t.sort((a, b) => a - b); return t[3]; };
const r1 = Q.map(([l, q]) => [med(l, q), l, q]).sort((a, b) => b[0] - a[0]);
console.log('najpomalšie z generátora (medián 7):', r1.slice(0, 5).map((x) => `${x[0].toFixed(2)} ms ${x[1]} „${x[2]}“`).join('\n  '));
console.log('max', r1[0][0].toFixed(2), 'ms; nad 5 ms:', r1.filter((x) => x[0] > 5).length, 'z', r1.length);
const r2 = dlhe.map(([l, q]) => [med(l, q), l, q.length]);
console.log('200 znakov:', r2.map((x) => `${x[1]} ${x[2]} zn. ${x[0].toFixed(2)} ms`).join(', '));
