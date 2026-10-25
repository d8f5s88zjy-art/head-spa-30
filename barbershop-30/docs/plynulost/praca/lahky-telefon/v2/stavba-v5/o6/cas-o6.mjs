// čas zhody: node cas-o6.mjs <modul.js> ; sady A,B,C2,D1,D2; každá otázka 15×, najlepší aj medián, po zahriatí
import { readFileSync } from 'node:fs';
const mod = process.argv[2], root = '/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/hs-recepcia/barbershop-30';
const { odpovedz } = await import(mod);
const kb = {}, Q = [];
for (const s of ['A', 'B', 'C2', 'D1', 'D2']) for (const l of readFileSync(`../slepe/sada-${s}.jsonl`, 'utf8').split('\n').filter(Boolean)) { const o = JSON.parse(l); kb[o.jazyk] ??= JSON.parse(readFileSync(`${root}/assets/recepcia/${o.jazyk}.json`, 'utf8')); Q.push(o); }
for (let i = 0; i < 3; i++) for (const o of Q) odpovedz(o.otazka, kb[o.jazyk]);
const m = Q.map((o) => { const t = []; for (let i = 0; i < 15; i++) { const a = performance.now(); odpovedz(o.otazka, kb[o.jazyk]); t.push(performance.now() - a); } t.sort((a, b) => a - b); return [t[0], t[7], o]; });
const naj = [...m].sort((a, b) => b[0] - a[0]), med = [...m].sort((a, b) => b[1] - a[1]);
console.log(`otázok ${Q.length}; najlepší z 15: max ${naj[0][0].toFixed(2)} ms (${naj[0][2].jazyk} ${naj[0][2].otazka.slice(0, 50)}…), nad 5 ms ${naj.filter((x) => x[0] >= 5).length}; medián z 15: max ${med[0][1].toFixed(2)} ms, nad 5 ms ${med.filter((x) => x[1] >= 5).length}; medián všetkých ${med[med.length >> 1][1].toFixed(3)} ms`);
