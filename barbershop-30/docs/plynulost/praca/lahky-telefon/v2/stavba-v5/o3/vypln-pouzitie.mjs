// koľkokrát sa výplňové a zdvorilé slovo (predpona) vyskytne v otázkach sád
import { readFileSync } from 'node:fs';
const [root, ...subory] = process.argv.slice(2);
const norm = (s) => String(s).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const z = (w, k) => { const e = w.length - k.length; return k.length < 5 ? e >= 0 && e <= 3 && w.startsWith(k) && e < (k.length > 3 ? 4 : 2) : w.startsWith(k); };
const riadky = subory.flatMap((f) => readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => l.split('|')));
for (const j of ['sk', 'en', 'de', 'cs', 'pl', 'hu', 'sr', 'uk']) {
  const kb = JSON.parse(readFileSync(`${root}/assets/recepcia/${j}.json`, 'utf8'));
  const slova = riadky.filter(([l]) => l === j).flatMap(([, q]) => norm(q).split(' '));
  for (const pole of ['vypln', 'zdvor']) {
    const c = kb[pole].split(' ').map((k) => [k, slova.filter((w) => z(w, k)).length]);
    console.log(j, pole, 'nepoužité:', c.filter((x) => !x[1]).map((x) => x[0]).join(' '), '| použité:', c.filter((x) => x[1]).map((x) => x.join(':')).join(' '));
  }
}
