// slová z názvov služieb (riadky cenníka v odpovedi), ktoré nemajú istú zhodu s kmeňom tej istej položky
import { readFileSync } from 'node:fs';
const root = process.argv[2];
const { norm, zhoda } = await import(root + '/assets/recepcia.js');
for (const j of ['sk', 'en', 'de', 'cs', 'pl', 'hu', 'sr', 'uk']) {
  const kb = JSON.parse(readFileSync(`${root}/assets/recepcia/${j}.json`, 'utf8'));
  const stop = kb.stop.split(' '), vyp = kb.vypln.split(' ');
  const out = [];
  for (const p of kb.polozky) for (const r of p.odpoved.filter(Array.isArray)) {
    if (!/€/.test(r[1])) continue;
    const kmene = p.kluc.split(/[\s|]+/).filter(Boolean).map((t) => t.replace('!', '').toLowerCase());
    for (const w of norm(r[0]).split(' ').filter((w) => w.length > 3 && !/^\d+$/.test(w) && !stop.includes(w) && !vyp.some((v) => zhoda(w, v) === 1)))
      if (!kmene.some((k) => zhoda(w, k) > 0.89)) out.push(`${p.id}:${w}`);
  }
  console.log(j, out.join(' '));
}
