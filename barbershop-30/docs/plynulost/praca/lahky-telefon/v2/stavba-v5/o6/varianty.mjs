// Ktoré varianty otázok (otazky[1..]) menia odpoveď? node varianty.mjs <strom/barbershop-30>
// Variant je presná zhoda (priama odpoveď bez pravidiel); ak bez neho modul dá na ten istý text tú istú odpoveď,
// variant je nadbytočný. Vypíše JSON {jazyk: {id: [varianty, ktoré treba nechať]}}; otazky[0] (zobrazovaná) ostáva vždy.
import { readFileSync } from 'node:fs';
const root = process.argv[2];
const { odpovedz } = await import(root + '/assets/recepcia.js');
const kl = (r) => JSON.stringify([r.typ, r.id, r.sluzba, Array.isArray(r.p) ? r.p.map((x) => x.id) : null, r.cas, r.o]);
const out = {};
for (const l of ['en', 'uk', 'hu', 'sr', 'pl', 'de', 'cs']) {
  const nacitaj = () => JSON.parse(readFileSync(`${root}/assets/recepcia/${l}.json`, 'utf8'));
  out[l] = {};
  for (const [i, p0] of nacitaj().polozky.entries()) {
    const nechaj = [];
    for (const v of p0.otazky.slice(1)) {
      const A = nacitaj(), B = nacitaj();
      B.polozky[i].otazky = B.polozky[i].otazky.filter((x) => x !== v);
      if (kl(odpovedz(v, A)) !== kl(odpovedz(v, B))) nechaj.push(v);
    }
    out[l][p0.id] = { vsetky: p0.otazky.length, nechaj };
  }
}
console.log(JSON.stringify(out));
