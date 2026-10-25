// vypíše neznáme 3-písmenové slová v otázkach (riadky jazyk|...|otázka, otázka je posledné pole)
import { readFileSync } from 'node:fs';
const [root, ...subory] = process.argv.slice(2);
const { norm, zhoda } = await import(root + '/assets/recepcia.js');
const kb = {}, cnt = {};
for (const f of subory) for (const l of readFileSync(f, 'utf8').split('\n').filter(Boolean)) {
  const c = l.split('|'); const j = c[0]; const q = c.length > 2 && f.includes('sondy') ? c[2] : c[1];
  if (!kb[j]) { const k = JSON.parse(readFileSync(`${root}/assets/recepcia/${j}.json`, 'utf8')); k._st = k.stop.split(' '); k._k = [...k.polozky, ...k.nevieme].flatMap((p) => p.kluc.split(/[\s|]+/).filter(Boolean).map((t) => t.replace('!', '').toLowerCase())); k._x = [k.cenove, k.vypln, k.zdvor].join(' ').split(' '); kb[j] = k; }
  const k = kb[j];
  for (const w of norm(q).split(' ')) {
    if (w.length !== 3 || /^\d+$/.test(w) || k._st.includes(w)) continue;
    if (k._k.some((x) => zhoda(w, x) > 0.89) || k._x.some((x) => zhoda(w, x) === 1 || w.startsWith(x))) continue;
    cnt[j + ' ' + w] = (cnt[j + ' ' + w] || 0) + 1;
  }
}
console.log(Object.entries(cnt).sort((a, b) => b[1] - a[1]).map(([w, n]) => `${w}:${n}`).join('  '));
