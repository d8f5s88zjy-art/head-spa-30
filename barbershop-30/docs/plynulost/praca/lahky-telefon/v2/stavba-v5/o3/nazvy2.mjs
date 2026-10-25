// slová z názvov služieb, ktoré nepozná žiadny kmeň (strážca pravidla 2 by ich bral ako neznáme)
import { readFileSync } from 'node:fs';
const root = process.argv[2];
const { norm, zhoda } = await import(root + '/assets/recepcia.js');
for (const j of ['sk', 'en', 'de', 'cs', 'pl', 'hu', 'sr', 'uk']) {
  const kb = JSON.parse(readFileSync(`${root}/assets/recepcia/${j}.json`, 'utf8'));
  const stop = kb.stop.split(' '), vyp = kb.vypln.split(' '), cen = kb.cenove.split(' ');
  const all = [...kb.polozky, ...kb.nevieme].flatMap((p) => p.kluc.split(/[\s|]+/).filter(Boolean).map((t) => t.replace('!', '').toLowerCase()));
  const out = new Set();
  for (const p of kb.polozky) for (const r of p.odpoved.filter(Array.isArray)) {
    if (!/€/.test(r[1])) continue;
    for (const w of norm(r[0]).split(' ').filter((w) => w.length > 3 && !/^\d+$/.test(w) && !stop.includes(w) && !vyp.some((v) => zhoda(w, v) === 1) && !cen.some((c) => w.startsWith(c))))
      if (!all.some((k) => zhoda(w, k) > 0.89)) out.add(`${p.id}:${w}`);
  }
  console.log(j, [...out].join(' '));
}
