// slová, kde dlhý kmeň sedí na začiatku a zvyšok je dlhý: node zvysok.mjs <koreň> < vsetko-q.txt
import { readFileSync } from 'node:fs';
const root = process.argv[2];
const { norm, zhoda } = await import(root + '/assets/recepcia.js?' + Date.now());
const kb = {}, seen = new Map();
for (const l of readFileSync(0, 'utf8').split('\n').filter(Boolean)) {
  const i = l.indexOf('|'), j = l.slice(0, i), q = l.slice(i + 1);
  if (!kb[j]) { kb[j] = JSON.parse(readFileSync(`${root}/assets/recepcia/${j}.json`, 'utf8')); kb[j].all = [...kb[j].polozky, ...kb[j].nevieme].map((p) => [p.id, p.kluc.replace(/\|/g, ' ').split(/\s+/).filter(Boolean).map((t) => t.replace('!', '').toLowerCase())]); }
  for (const w of norm(q).split(' ')) {
    let best = '';
    for (const [, ks] of kb[j].all) for (const k of ks) if (k.length > 4 && !'=>'.includes(k[0]) && w.startsWith(k) && k.length > best.length) best = k;
    if (!best) continue;
    const r = w.slice(best.length);
    if (r.length >= 4) { const key = j + ' ' + w; if (!seen.has(key)) seen.set(key, `${r.length}\t${j}\t${w}\t${best}+${r}`); }
  }
}
console.log([...seen.values()].sort((a, b) => parseInt(b) - parseInt(a)).join('\n'));
