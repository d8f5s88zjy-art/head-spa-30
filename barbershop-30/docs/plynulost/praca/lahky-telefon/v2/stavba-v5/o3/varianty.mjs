// dopad varianty otázok: pre každý variant (okrem prvého) zistí, či jeho odstránenie zmení niektorý výstup v sadách
import { readFileSync } from 'node:fs';
const [root, ...subory] = process.argv.slice(2);
const { odpovedz } = await import(root + '/assets/recepcia.js');
const otazky = subory.flatMap((f) => readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => l.split('|')));
const kbs = {}; const nacitaj = (j) => JSON.parse(readFileSync(`${root}/assets/recepcia/${j}.json`, 'utf8'));
const vystup = (j, kb) => otazky.filter(([l]) => l === j).map(([, q]) => { const r = odpovedz(q, kb); return r.typ + ' ' + r.id + ' ' + (r.sluzba || '') + (Array.isArray(r.p) ? r.p.map((x) => x.id).join() : ''); });
let zbytocne = 0, spolu = 0;
for (const j of ['sk', 'en', 'de', 'cs', 'pl', 'hu', 'sr', 'uk']) {
  const zaklad = vystup(j, nacitaj(j));
  const kb0 = nacitaj(j);
  for (const [sekcia, list] of [['polozky', kb0.polozky], ['nevieme', kb0.nevieme]]) list.forEach((p, i) => {
    for (let v = 1; v < p.otazky.length; v++) {
      spolu++;
      const kb = nacitaj(j); kb[sekcia][i].otazky.splice(v, 1);
      const nove = vystup(j, kb);
      const zmeny = nove.filter((x, n) => x !== zaklad[n]).length;
      if (!zmeny) zbytocne++; else if (process.env.V) console.log(`${j} ${p.id} „${p.otazky[v]}“ mení ${zmeny}`);
    }
  });
}
console.log(`variantov ${spolu}, bez vplyvu na sady ${zbytocne}`);
