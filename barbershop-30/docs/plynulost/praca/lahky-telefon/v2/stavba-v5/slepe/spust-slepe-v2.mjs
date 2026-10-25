// spúšťač slepých sád v2 (hodnotenie v2-1): node spust-slepe-v2.mjs <strom/barbershop-30> <sada.jsonl> > vysledky.jsonl
// navyše: výrez cenníka (P3), príznaky výberu (o = text fallbacku, cas = voľby trvania), čas zhody
import { readFileSync } from 'node:fs';
const [root, sada] = process.argv.slice(2);
const { odpovedz, vyrez } = await import(root + '/assets/recepcia.js');
const kb = {};
const txt = (p) => p.odpoved.map((f) => [].concat(f).join(' ')).join(' / ');
for (const l of readFileSync(sada, 'utf8').split('\n').filter(Boolean)) {
  const o = JSON.parse(l), j = o.jazyk;
  kb[j] ??= JSON.parse(readFileSync(`${root}/assets/recepcia/${j}.json`, 'utf8'));
  odpovedz(o.otazka, kb[j]);
  const t0 = performance.now(); const r = odpovedz(o.otazka, kb[j]); const ms = performance.now() - t0;
  const out = { ...o, typ: r.typ, id: r.id ?? null, ms: +ms.toFixed(3) };
  if (r.typ === 'odpoved') {
    out.text = txt(r.p); if (r.sluzba) out.sluzba = r.sluzba;
    const v = /€/.test(out.text) ? vyrez(r.p, kb[j]) : null;
    if (/€/.test(out.text)) out.vyrez = v ? { skupina: v[0], riadky: v[1].map((x) => `${x[3] ? '*' : ''}${x[0]} ${x[1]} ${x[2]}`) } : null;
  } else if (r.typ === 'vyber') { out.kand = r.p.map((x) => x.id); if (r.o) out.o = 1; if (r.cas) out.cas = 1; }
  else if (r.typ === 'nevieme') out.text = r.p.odovzdanie;
  console.log(JSON.stringify(out));
}
