// skóre najlepšej položky pre cenové otázky (bez prahu ciastocne); node o1-cena.mjs <strom> < riadky
import { readFileSync } from 'node:fs';
const root = process.argv[2];
const { odpovedz } = await import(root + '/assets/recepcia.js');
const kb = {};
for (const l of readFileSync(0, 'utf8').split('\n').filter(Boolean)) {
  const [j, q] = l.includes('|') ? l.split('|') : ['sk', l];
  kb[j] ??= JSON.parse(readFileSync(`${root}/assets/recepcia/${j}.json`, 'utf8'));
  kb[j].prah.ciastocne = 99; const a = odpovedz(q, kb[j]);
  kb[j].prah.ciastocne = 0; const b = odpovedz(q, kb[j]);
  console.log(`${j} | ${q} → ${a.typ} ${a.id ?? ''} | top ${b.typ} ${Array.isArray(b.p) ? b.p.map((x) => x.id).join(',') : b.id} ${b.skore.toFixed(3)}`);
}
