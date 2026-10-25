// S1 „bez zmeny odpovedí“: všetky otázky pôvodných JSON (aj vyradené varianty) a slepé sady dajú na aeaafb7 a na S1 to isté.
//   node bez-zmeny.mjs <strom aeaafb7/barbershop-30> <strom S1/barbershop-30>
import { readFileSync } from 'node:fs';
const [A, B] = process.argv.slice(2);
const mA = await import(A + '/assets/recepcia.js'), mB = await import(B + '/assets/recepcia.js?s1');
const kl = (r) => JSON.stringify([r.typ, r.id, r.sluzba, Array.isArray(r.p) ? r.p.map((x) => x.id) : r.p?.odpoved ?? r.p?.odovzdanie, r.cas, r.o]);
let n = 0, z = 0;
for (const l of ['sk', 'en', 'uk', 'hu', 'sr', 'pl', 'de', 'cs']) {
  const ka = JSON.parse(readFileSync(`${A}/assets/recepcia/${l}.json`, 'utf8')), kb = JSON.parse(readFileSync(`${B}/assets/recepcia/${l}.json`, 'utf8'));
  const Q = [...ka.polozky, ...ka.nevieme].flatMap((p) => p.otazky);
  for (const s of ['A', 'B', 'C2', 'D1', 'D2']) for (const r of readFileSync(`../slepe/sada-${s}.jsonl`, 'utf8').split('\n').filter(Boolean)) { const o = JSON.parse(r); if (o.jazyk === l) Q.push(o.otazka); }
  for (const q of Q) { n++; const a = kl(mA.odpovedz(q, ka)), b = kl(mB.odpovedz(q, kb)); if (a !== b) { z++; console.log(l, q, a, b); } }
}
console.log(`otázok ${n}, rozdielnych odpovedí ${z}`);
