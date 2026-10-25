// čas zhody len na skutočných otázkach sád (bez umelých 200-znakových), najlepší z 5 behov, po zahriatí
import { readFileSync } from 'node:fs';
const [root, f] = process.argv.slice(2);
const { odpovedz } = await import(root + '/assets/recepcia.js?' + Date.now());
const kb = {}, qs = readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => l.split('|'));
for (const [j] of qs) kb[j] ??= JSON.parse(readFileSync(`${root}/assets/recepcia/${j}.json`, 'utf8'));
for (const [j, q] of qs) odpovedz(q, kb[j]);
let max = 0, mq = '', n5 = 0, dlz = 0;
for (const [j, q] of qs) { let t = Infinity; for (let i = 0; i < 5; i++) { const t0 = performance.now(); odpovedz(q, kb[j]); t = Math.min(t, performance.now() - t0); } if (t > 5) n5++; if (t > max) { max = t; mq = `${j}|${q}`; } dlz = Math.max(dlz, q.length); }
console.log(`skutočných otázok ${qs.length} (najdlhšia ${dlz} znakov): najpomalšia ${max.toFixed(2)} ms („${mq}“), nad 5 ms: ${n5}`);
