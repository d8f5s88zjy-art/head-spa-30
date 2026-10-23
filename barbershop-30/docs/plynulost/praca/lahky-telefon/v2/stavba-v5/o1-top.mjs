// pomocná skúška opravára: vypíše 3 najlepšie položky so skóre; node o1-top.mjs <strom/barbershop-30> < riadky "jazyk|otázka"
import { readFileSync } from 'node:fs';
const root = process.argv[2];
const { odpovedz } = await import(root + '/assets/recepcia.js');
const kb = {};
for (const l of readFileSync(0, 'utf8').split('\n').filter(Boolean)) {
  const [j, q] = l.includes('|') ? l.split('|') : ['sk', l];
  kb[j] ??= JSON.parse(readFileSync(`${root}/assets/recepcia/${j}.json`, 'utf8'));
  const r = odpovedz(q, kb[j]);
  const ids = Array.isArray(r.p) ? r.p.map((x) => x.id).join(',') : r.id;
  console.log(`${j} | ${q} → ${r.typ} ${ids ?? ''} (${r.skore.toFixed(2)})`);
}
