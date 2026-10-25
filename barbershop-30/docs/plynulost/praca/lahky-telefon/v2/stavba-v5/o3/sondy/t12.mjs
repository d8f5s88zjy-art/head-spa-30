// vypíše všetky zlyhania tried 11 a 12 (nie len prvé)
import { readFileSync } from 'node:fs';
const root = process.argv[2];
const { odpovedz } = await import(root + '/assets/recepcia.js?' + Date.now());
const FC = { sk: 'Koľko stojí', en: 'How much is', de: 'Was kostet', cs: 'Kolik stojí', pl: 'Ile kosztuje', hu: 'Mennyibe kerül', sr: 'Koliko košta', uk: 'Скільки коштує' };
const FT = { sk: 'Ako dlho trvá', en: 'How long does it take:', de: 'Wie lange dauert', cs: 'Jak dlouho trvá', pl: 'Jak długo trwa', hu: 'Meddig tart', sr: 'Koliko traje', uk: 'Скільки триває' };
const cenove = (p) => p.odpoved.filter(Array.isArray).length && JSON.stringify(p.odpoved).includes('€'), nazov = (p) => p.odpoved.filter(Array.isArray)[0][0];
const cena = (r) => r.typ === 'odpoved' && /€|\d (min|хв|perc|Min)/.test(JSON.stringify(r.p.odpoved));
const SPOLU = { 'cena-strih-brada': ['cena-strih', 'cena-brada'] };
let n12 = 0, z12 = 0, z11 = 0;
for (const l of Object.keys(FC)) {
  const kb = JSON.parse(readFileSync(`${root}/assets/recepcia/${l}.json`, 'utf8'));
  for (const p of kb.polozky.filter((x) => x.cas)) { const q = `${FT[l]} ${nazov(p)}?`, r = odpovedz(q, kb); if (!(r.typ === 'odpoved' && r.id === 'trvanie' && r.sluzba === p.id)) { z11++; console.log('11', l, q, '→', r.typ, r.id, r.sluzba || '', Array.isArray(r.p) ? r.p.map((x) => x.id) : ''); } }
  const c = kb.polozky.filter(cenove), spoj = kb.spoj.split(' ')[0];
  for (const a of c) for (const b of c) { if (a === b) continue; n12++;
    const q = `${FC[l]} ${nazov(a)} ${spoj} ${nazov(b)}?`, r = odpovedz(q, kb), t = r.typ === 'odpoved' && JSON.stringify(r.p.odpoved);
    const S = (x, y) => r.id === x.id && (SPOLU[x.id] || []).includes(y.id) || (SPOLU[r.id] || []).includes(x.id) && (SPOLU[r.id] || []).includes(y.id);
    const ok = r.typ === 'vyber' || !cena(r) || S(a, b) || S(b, a) || [a, b].every((x) => t.includes(nazov(x)));
    if (!ok) { z12++; console.log('12', l, q, '→', r.typ, r.id, Array.isArray(r.p) ? r.p.map((x) => x.id) : ''); } }
}
console.log(`11 zlyhaní ${z11}; 12: ${z12} z ${n12}`);
