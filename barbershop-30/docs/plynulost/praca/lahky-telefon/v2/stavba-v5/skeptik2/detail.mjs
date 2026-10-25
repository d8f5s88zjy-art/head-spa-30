// skeptik 2: podrobný výpis odpovede vrátane výrezu cenníka a času zhody
// node detail.mjs <strom/barbershop-30> otazky.txt [...]
import { readFileSync } from 'node:fs';
const root = process.argv[2];
const { odpovedz, vyrez } = await import(root + '/assets/recepcia.js');
const kb = {};
const out = [];
for (const f of process.argv.slice(3)) for (const l of readFileSync(f, 'utf8').split('\n').filter(Boolean)) {
  const [j, q, ocak, druh] = l.split('|');
  kb[j] ??= JSON.parse(readFileSync(`${root}/assets/recepcia/${j}.json`, 'utf8'));
  const t0 = performance.now(); const r = odpovedz(q, kb[j]); const ms = performance.now() - t0;
  const o = { j, q, ocak, druh, typ: r.typ, id: r.id, ms: +ms.toFixed(2) };
  if (r.typ === 'odpoved') {
    o.odpoved = r.p.odpoved;
    o.cena = JSON.stringify(r.p.odpoved).includes('€');
    o.trvanie = r.id === 'trvanie'; o.sluzba = r.sluzba;
    const v = vyrez(r.p, kb[j]);
    o.vyrez = v ? [v[0], v[1].map((x) => (x[3] ? '▶ ' : '  ') + x.slice(0, 3).join(' · '))] : null;
  } else if (r.typ === 'vyber') { o.volby = r.p.map((p) => p.id); o.cas = !!r.cas; o.fallbackVeta = !!r.o; }
  else if (r.typ === 'nevieme') o.odovzdanie = r.p.odovzdanie;
  out.push(o);
}
console.log(JSON.stringify(out, null, 0).replace(/\},\{/g, '},\n{'));
