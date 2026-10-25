// zoznam zhôd kmeňa vnútri slova: node vnutri.mjs <koreň> < vsetko-q.txt
import { readFileSync } from 'node:fs';
const root = process.argv[2];
const { norm, zhoda } = await import(root + '/assets/recepcia.js?' + Date.now());
const kb = {}, seen = new Set();
for (const l of readFileSync(0, 'utf8').split('\n').filter(Boolean)) {
  const i = l.indexOf('|'), j = l.slice(0, i), q = l.slice(i + 1);
  if (!kb[j]) { kb[j] = JSON.parse(readFileSync(`${root}/assets/recepcia/${j}.json`, 'utf8')); kb[j].all = [...kb[j].polozky, ...kb[j].nevieme].map((p) => [p.id, p.kluc.replace(/\|/g, ' ').split(/\s+/).filter(Boolean).map((t) => t.replace('!', '').toLowerCase())]); }
  for (const w of norm(q).split(' ')) {
    for (const [id, ks] of kb[j].all) for (const k of ks) {
      if (k.length > 4 && !'=>'.includes(k[0]) && w.includes(k) && !w.startsWith(k)) {
        const pre = w.slice(0, w.indexOf(k));
        const start = kb[j].all.filter(([, kk]) => kk.some((x) => zhoda(w, x) === 1)).map(([d]) => d);
        const key = j + w + k + id; if (seen.has(key)) continue; seen.add(key);
        console.log(`${j}\t${w}\t${k}\t${id}\tpred=${pre}\tzaciatok=${start.join(',')}\t${q}`);
      }
    }
  }
}
