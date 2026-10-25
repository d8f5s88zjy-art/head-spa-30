// čas zhody: node cas.mjs <koreň> < vsetko-q.txt  (najlepší z 5 behov po zahriatí, max cez otázky; aj 200-znakové otázky)
import { readFileSync } from 'node:fs';
const root = process.argv[2];
const { odpovedz } = await import(root + '/assets/recepcia.js?' + Date.now());
const kb = {}, Q = [];
for (const l of readFileSync(0, 'utf8').split('\n').filter(Boolean)) { const i = l.indexOf('|'), j = l.slice(0, i); kb[j] ??= JSON.parse(readFileSync(`${root}/assets/recepcia/${j}.json`, 'utf8')); Q.push([j, l.slice(i + 1)]); }
const dlhe = Object.keys(kb).flatMap((j) => [0, 1, 2].map((n) => [j, Q.filter((q) => q[0] === j).slice(n * 7, n * 7 + 12).map((q) => q[1]).join(' ').slice(0, 200)]));
const meraj = (L) => { const best = L.map(() => Infinity); for (let r = 0; r < 6; r++) L.forEach(([j, q], i) => { const t = performance.now(); odpovedz(q, kb[j]); const d = performance.now() - t; if (r) best[i] = Math.min(best[i], d); }); return best; };
const a = meraj(Q), b = meraj(dlhe);
console.log(`otázok ${Q.length}: priemer ${(a.reduce((x, y) => x + y) / a.length).toFixed(3)} ms, max ${Math.max(...a).toFixed(2)} ms, nad 5 ms ${a.filter((x) => x > 5).length}; 200-znakových ${b.length}: max ${Math.max(...b).toFixed(2)} ms`);
