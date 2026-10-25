// podiel „Myslíš toto?“ / odovzdania pri legitímnych otázkach: riadky „jazyk|otázka|očakávané id“ (očakávané bez ? a !)
// node podiel.mjs <koreň> <súbor> [vypln=0]
import { readFileSync } from 'node:fs';
const [root, f, bezVypln] = process.argv.slice(2);
const { odpovedz } = await import(root + '/assets/recepcia.js');
const kb = {}; let n = 0, ok = 0, vy = 0, od = 0; const zle = [];
for (const l of readFileSync(f, 'utf8').split('\n').filter(Boolean)) {
  const [j, q, oc] = l.split('|');
  if (!oc || oc.startsWith('?') || oc === '!') continue;
  if (!kb[j]) { kb[j] = JSON.parse(readFileSync(`${root}/assets/recepcia/${j}.json`, 'utf8')); if (bezVypln) kb[j].vypln = ''; }
  const r = odpovedz(q, kb[j]); n++;
  const ids = oc.split(',');
  if (r.typ === 'odpoved' && ids.includes(r.id)) ok++;
  else if (r.typ === 'vyber') { vy++; zle.push(`${j}|${q} → vyber ${r.p.map((x) => x.id)}`); }
  else { od++; zle.push(`${j}|${q} → ${r.typ} ${r.id ?? ''}`); }
}
console.log(`legitímnych ${n}: priama odpoveď ${ok}, „Myslíš toto?“ ${vy}, odovzdanie/iné ${od}, podiel nie priamej ${(100 * (n - ok) / n).toFixed(1)} %`);
if (process.env.V) zle.forEach((x) => console.log('  ' + x));
