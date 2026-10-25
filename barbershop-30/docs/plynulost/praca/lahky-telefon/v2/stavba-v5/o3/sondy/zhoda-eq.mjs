// porovná zhoda() dvoch verzií na všetkých slovách otázok × všetkých kmeňoch
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const [a, b, root, ...subory] = process.argv.slice(2);
const A = await import(pathToFileURL(a)), B = await import(pathToFileURL(b));
const kl = new Set(), sl = new Set();
for (const l of ['sk', 'en', 'de', 'cs', 'pl', 'hu', 'sr', 'uk']) { const kb = JSON.parse(readFileSync(`${root}/assets/recepcia/${l}.json`, 'utf8')); [...kb.polozky, ...kb.nevieme].forEach((p) => p.kluc.split(/[\s|]+/).filter(Boolean).forEach((t) => kl.add(t.replace('!', '').toLowerCase()))); }
for (const f of subory) for (const l of readFileSync(f, 'utf8').split('\n')) for (const w of A.norm(l.split('|').pop()).split(' ')) if (w) sl.add(w);
let n = 0, d = 0;
for (const w of sl) for (const k of kl) { if (k[0] === '>') continue; n++; if (A.zhoda(w, k) !== B.zhoda(w, k)) { d++; if (d < 10) console.log('ROZDIEL', w, k, A.zhoda(w, k), B.zhoda(w, k)); } }
console.log(`slov ${sl.size} × kmeňov ${kl.size} = ${n} porovnaní, rozdielov ${d}`);
