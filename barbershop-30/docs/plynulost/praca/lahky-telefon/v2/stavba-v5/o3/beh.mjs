// node beh.mjs <koreň barbershop-30> < riadky "jazyk|otázka[|očakávané]"  → jeden riadok na otázku
import { readFileSync } from 'node:fs';
const root = process.argv[2];
const { odpovedz } = await import(root + '/assets/recepcia.js?' + Date.now());
const kb = {};
for (const l of readFileSync(0, 'utf8').split('\n').filter(Boolean)) {
  const [j, q] = l.split('|');
  kb[j] ??= JSON.parse(readFileSync(`${root}/assets/recepcia/${j}.json`, 'utf8'));
  const r = odpovedz(q, kb[j]);
  const ids = Array.isArray(r.p) ? r.p.map((x) => x.id).join(',') : '';
  const t = r.typ === 'odpoved' ? JSON.stringify(r.p.odpoved).slice(0, 70) : r.typ === 'nevieme' ? r.p.odovzdanie : ids;
  console.log(`${j} | ${q} → ${r.typ} ${r.id ?? ''}${r.sluzba ? ':' + r.sluzba : ''} | ${t ?? ''}`);
}
