// čas zhody: každá otázka 5× (najlepší beh), po zahriatí; plus 200-znakové otázky; node cas.mjs <koreň> <súbor>
import { readFileSync } from 'node:fs';
const [root, f] = process.argv.slice(2);
const { odpovedz } = await import(root + '/assets/recepcia.js?' + Date.now());
const kb = {};
const qs = readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => l.split('|'));
for (const l of ['sk', 'en', 'de', 'cs', 'pl', 'hu', 'sr', 'uk']) { qs.push([l, ('koľko stojí pánsky strih a úprava brady pre syna 12 rokov doma v nedeľu ' ).repeat(4).slice(0, 200)]); qs.push([l, 'x'.repeat(200)]); }
for (const [j] of qs) kb[j] ??= JSON.parse(readFileSync(`${root}/assets/recepcia/${j}.json`, 'utf8'));
for (const [j, q] of qs) odpovedz(q, kb[j]);
let max = 0, sum = 0, mq = '';
for (const [j, q] of qs) { let t = Infinity; for (let i = 0; i < 5; i++) { const t0 = performance.now(); odpovedz(q, kb[j]); t = Math.min(t, performance.now() - t0); } sum += t; if (t > max) { max = t; mq = `${j}|${q.slice(0, 60)}`; } }
console.log(`otázok ${qs.length}: priemer ${(sum / qs.length).toFixed(3)} ms, najpomalšia ${max.toFixed(3)} ms („${mq}“)`);
