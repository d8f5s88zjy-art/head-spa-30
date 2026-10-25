// skeptik 2: čas zhody – každá otázka 7×, medián; node cas-s2.mjs <strom/barbershop-30> otazky...
import { readFileSync } from 'node:fs';
const root = process.argv[2]; const { odpovedz } = await import(root + '/assets/recepcia.js'); const kb = {};
const Q = process.argv.slice(3).flatMap((f) => readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => l.split('|')));
const long = Object.keys({ sk: 1, en: 1, de: 1, uk: 1 }).map((j) => [j, ('Koľko stojí strih a brada a obočie a farbenie pre syna v sobotu o 9:00 ráno? ').repeat(4).slice(0, 200)]);
const m = []; if (process.env.ZAHRIAT) for (const [j, q] of Q) { kb[j] ??= JSON.parse(readFileSync(`${root}/assets/recepcia/${j}.json`, "utf8")); odpovedz(q, kb[j]); }
for (const [j, q] of [...Q, ...long]) { kb[j] ??= JSON.parse(readFileSync(`${root}/assets/recepcia/${j}.json`, 'utf8')); const t = [];
  for (let i = 0; i < 7; i++) { const a = performance.now(); odpovedz(q, kb[j]); t.push(performance.now() - a); } t.sort((x, y) => x - y); m.push([t[3], j, q]); }
m.sort((a, b) => b[0] - a[0]); const med = [...m].sort((a, b) => a[0] - b[0])[m.length >> 1][0];
console.log(`otázok ${m.length}, medián ${med.toFixed(3)} ms, max ${m[0][0].toFixed(3)} ms (${m[0][1]} „${m[0][2].slice(0, 50)}“), nad 5 ms: ${m.filter((x) => x[0] >= 5).length}`);
