// node sondy.mjs <koreň barbershop-30> <súbor jazyk|očakávané|otázka> [-v]
// očakávané: X = nesmie dostať cenu ani trvanie; V = viac služieb naraz (nie jediná cena); id[,id] = legitímna otázka;
// trvanie[:id] = trvanie (menovanej) služby. VÁŽNE = cena/trvanie tam, kde nemá byť, alebo cena/trvanie inej služby.
import { readFileSync } from 'node:fs';
const [root, f, v] = process.argv.slice(2);
const { odpovedz } = await import(root + '/assets/recepcia.js?' + Date.now());
const kb = {}, st = { ok: 0, mierne: 0, vazne: 0, legit: 0, legitOk: 0, legitVyber: 0, legitInak: 0 }, out = [];
const cena = (r) => r.typ === 'odpoved' && /€|\d (min|хв|perc|Min)/.test(JSON.stringify(r.p.odpoved));
for (const l of readFileSync(f, 'utf8').split('\n').filter(Boolean)) {
  const [j, oc, q] = l.split('|');
  kb[j] ??= JSON.parse(readFileSync(`${root}/assets/recepcia/${j}.json`, 'utf8'));
  const r = odpovedz(q, kb[j]);
  const ids = Array.isArray(r.p) ? r.p.map((x) => x.id).join(',') : '';
  const popis = `${r.typ} ${r.id ?? ''}${r.sluzba ? ':' + r.sluzba : ''}${ids ? ' [' + ids + ']' : ''}`;
  let s;
  if (oc === 'X') s = cena(r) ? 'VÁŽNE' : r.typ === 'odpoved' ? 'mierne' : 'ok';
  else if (oc === 'V') s = r.typ === 'odpoved' && cena(r) ? 'mierne' : 'ok';
  else {
    st.legit++;
    const [a, b] = oc.split(':');
    const okId = a === 'trvanie' ? r.typ === 'odpoved' && r.id === 'trvanie' && (r.sluzba || '') === (b || '') : r.typ === 'odpoved' && a.split(',').includes(r.id);
    if (okId) { s = 'ok'; st.legitOk++; }
    else if (cena(r)) { s = 'VÁŽNE'; st.legitInak++; }
    else if (r.typ === 'vyber') { s = 'vyber'; st.legitVyber++; }
    else { s = 'odovzdanie'; st.legitInak++; }
  }
  if (s === 'VÁŽNE') st.vazne++; else if (s === 'mierne') st.mierne++; else st.ok++;
  out.push(`${s.padEnd(10)} ${j} | ${q} [${oc}] → ${popis} | ${r.typ === 'odpoved' ? JSON.stringify(r.p.odpoved).slice(0, 60) : ''}`);
}
for (const x of out) if (v || !/^ok /.test(x)) console.log(x);
console.log(`spolu ${out.length}: VÁŽNE ${st.vazne}, mierne ${st.mierne}; legitímnych ${st.legit}: priamo ${st.legitOk}, „Myslíš toto?“ ${st.legitVyber}, odovzdanie/iné ${st.legitInak} (nie priamo ${(100 * (st.legit - st.legitOk) / Math.max(1, st.legit)).toFixed(1)} %)`);
