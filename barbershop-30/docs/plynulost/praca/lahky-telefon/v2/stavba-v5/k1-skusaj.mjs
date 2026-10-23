// pomocná skúška kontrolóra: node k1-skusaj.mjs <strom/barbershop-30> < riadky "jazyk|otázka"
import { readFileSync } from 'node:fs';
const root = process.argv[2];
const { odpovedz } = await import(root + '/assets/recepcia.js');
const kb = {};
const lines = readFileSync(0, 'utf8').split('\n').filter(Boolean);
for (const l of lines) {
  const [j, q] = l.includes('|') ? l.split('|') : ['sk', l];
  kb[j] ??= JSON.parse(readFileSync(`${root}/assets/recepcia/${j}.json`, 'utf8'));
  const r = odpovedz(q, kb[j]);
  const p = Array.isArray(r.p) ? r.p.map(x=>x.id).join(',') : '';
  const t = r.typ === 'odpoved' ? JSON.stringify(r.p.odpoved).slice(0,70) : r.typ === 'nevieme' ? r.p.odovzdanie : p;
  console.log(`${j} | ${q} → ${r.typ} ${r.id ?? ''} | ${t ?? ''}`);
}
