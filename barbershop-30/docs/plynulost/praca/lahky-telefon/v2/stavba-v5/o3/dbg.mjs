// node dbg.mjs <koreň> <jazyk> "otázka" ... → výsledok a 4 najlepšie položky a témy so skóre
import { readFileSync } from 'node:fs';
const [root, j, ...qs] = process.argv.slice(2);
const { odpovedz, norm } = await import(root + '/assets/recepcia.js');
const kb = JSON.parse(readFileSync(`${root}/assets/recepcia/${j}.json`, 'utf8'));
for (const q of qs) {
  const r = odpovedz(q, kb);
  console.log(`${q} → ${r.typ} ${r.id ?? ''} ${r.sluzba ?? ''} ${JSON.stringify(r.p && (r.p.odpoved || r.p.odovzdanie || r.p.map?.((x) => x.id)))}`);
}
