// spúšťač slepých sád: node spust-slepe.mjs <strom/barbershop-30> <sada.jsonl> > vysledky.jsonl
import { readFileSync } from 'node:fs';
const [root, sada] = process.argv.slice(2);
const { odpovedz } = await import(root + '/assets/recepcia.js');
const kb = {};
for (const l of readFileSync(sada, 'utf8').split('\n').filter(Boolean)) {
  const o = JSON.parse(l), j = o.jazyk;
  kb[j] ??= JSON.parse(readFileSync(`${root}/assets/recepcia/${j}.json`, 'utf8'));
  const r = odpovedz(o.otazka, kb[j]);
  const out = { ...o, typ: r.typ, id: r.id ?? null };
  if (r.typ === 'odpoved') { out.text = r.p.odpoved.map((f) => [].concat(f).join(' ')).join(' / '); if (r.sluzba) out.sluzba = r.sluzba; }
  else if (r.typ === 'vyber') out.kand = r.p.map((x) => x.id);
  else if (r.typ === 'nevieme') out.text = r.p.odovzdanie;
  console.log(JSON.stringify(out));
}
