// Oprava 7: skúška otázok nad stromom (starý aj nový tvar odpovede).
//   node skusaj.mjs <strom/barbershop-30> < riadky "jazyk|otázka[|…]"
// Výstup: jazyk | otázka → typ id | text; HOLÁ = veta/riadok s cenou alebo trvaním mimo celej skupiny cenníka;
// SKUPINY = nadpisy zobrazených skupín, ▶ = zvýraznený riadok.
import { readFileSync } from 'node:fs';
const root = process.argv[2];
const M = await import(root + '/assets/recepcia.js');
const kb = {};
const CENA = /€|\d[\s ]?(min|хв|perc|Min)/;
for (const l of readFileSync(0, 'utf8').split('\n').filter((x) => x && !x.startsWith('#'))) {
  const [j, q] = l.split('|');
  kb[j] ??= JSON.parse(readFileSync(`${root}/assets/recepcia/${j}.json`, 'utf8'));
  const r = M.odpovedz(q, kb[j]);
  let t = '';
  if (r.typ === 'cennik') t = 'SKUPINY ' + r.g.map((i) => kb[j].cennik[i][0]).join(' + ') + (r.hl?.length ? ' ▶ ' + r.hl.join(', ') : '') + (r.p ? ' | ' + r.p.odpoved.filter((f) => !Array.isArray(f)).join(' ') : '');
  else if (r.typ === 'odpoved') { const s = JSON.stringify(r.p.odpoved); t = (CENA.test(s) ? 'HOLÁ ' : '') + s.slice(0, 90); }
  else if (r.typ === 'nevieme') t = r.p.odovzdanie;
  else if (Array.isArray(r.p)) t = '[' + r.p.map((x) => x.id).join(', ') + ']';
  console.log(`${j} | ${q} → ${r.typ} ${r.id ?? ''} | ${t}`);
}
