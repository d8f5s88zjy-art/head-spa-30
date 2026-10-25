// Oprava 7: čas PRVEJ otázky v novom procese (studený JIT), voliteľne po zahriatí ako v paneli (ZAHRIAT=1 → modul.zahrej()).
//   node prva-otazka.mjs <strom/barbershop-30> <jazyk> <otázka>
import { readFileSync } from 'node:fs';
const [root, j, q] = process.argv.slice(2);
const M = await import(root + '/assets/recepcia.js');
const kb = JSON.parse(readFileSync(`${root}/assets/recepcia/${j}.json`, 'utf8'));
let tz = 0;
if (process.env.ZAHRIAT && M.zahrej) { const a = performance.now(); M.zahrej(kb); tz = performance.now() - a; }
const a = performance.now(); M.odpovedz(q, kb); const t1 = performance.now() - a;
const b = performance.now(); M.odpovedz(q, kb); const t2 = performance.now() - b;
console.log(`${j} „${q}“ prvá ${t1.toFixed(2)} ms, druhá ${t2.toFixed(2)} ms${process.env.ZAHRIAT ? `, zahriatie ${tz.toFixed(2)} ms` : ''}`);
