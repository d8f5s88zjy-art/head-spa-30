// čas zhody: node cas-v2-1.mjs <strom/barbershop-30> sada.jsonl... ; každá otázka 7×, medián, po zahriatí celej sady
import { readFileSync } from 'node:fs';
const [root, ...sady] = process.argv.slice(2);
const { odpovedz } = await import(root + '/assets/recepcia.js');
const kb = {}, Q = [];
for (const s of sady) for (const l of readFileSync(s, 'utf8').split('\n').filter(Boolean)) { const o = JSON.parse(l); kb[o.jazyk] ??= JSON.parse(readFileSync(`${root}/assets/recepcia/${o.jazyk}.json`, 'utf8')); Q.push(o); }
for (let i = 0; i < 3; i++) for (const o of Q) odpovedz(o.otazka, kb[o.jazyk]);
const m = Q.map((o) => { const t = []; for (let i = 0; i < 7; i++) { const a = performance.now(); odpovedz(o.otazka, kb[o.jazyk]); t.push(performance.now() - a); } t.sort((a, b) => a - b); return [t[3], o]; }).sort((a, b) => b[0] - a[0]);
console.log('otázok', Q.length, 'medián všetkých', m[m.length >> 1][0].toFixed(3), 'ms');
for (const [t, o] of m.slice(0, 5)) console.log(t.toFixed(3), 'ms', o.jazyk, o.otazka.slice(0, 70));
console.log('nad 5 ms:', m.filter((x) => x[0] >= 5).length);
