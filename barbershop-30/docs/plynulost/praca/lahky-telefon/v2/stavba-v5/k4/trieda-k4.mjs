// Trieda A: otázka na trvanie + slovo položky bez trvania a bez ceny (káva, hodiny, rezervácia …) → nesmie dať trvanie strihu/brady
// Trieda B: slovo služby bez ceny (farbenie vlasov = Romana) + slovo služby s cenou → nesmie dať holú cenu
import { readFileSync } from 'node:fs';
const root = process.argv[2];
const { odpovedz } = await import(root + '/assets/recepcia.js');
const T = { sk: 'kolko minut', en: 'how many minutes', de: 'wie viele minuten', hu: 'hany perc', cs: 'kolik minut', pl: 'ile minut', uk: 'скільки хвилин', sr: 'koliko minuta' };
const C = { sk: 'kolko stoji', en: 'how much is', de: 'was kostet', hu: 'mennyibe kerul', cs: 'kolik stoji', pl: 'ile kosztuje', uk: 'скільки коштує', sr: 'koliko kosta' };
const silne = (p) => p.kluc.split('|')[0].trim().split(/\s+/).filter((t) => /^[A-ZÀ-ÞĀ-Ž]/.test(t) || t.endsWith('!')).map((t) => t.replace(/[!=]/g, '').toLowerCase()).filter((t) => t.length > 2 && !/^\d/.test(t));
const A = [], B = [];
for (const l of Object.keys(T)) {
  const kb = JSON.parse(readFileSync(`${root}/assets/recepcia/${l}.json`, 'utf8'));
  const cena = (p) => !!p.cena || JSON.stringify(p.odpoved || '').includes('€');
  for (const p of kb.polozky.filter((p) => !p.cas && !cena(p) && !p.pravidlo)) for (const s of silne(p)) {
    const q = `${T[l]} ${s}`, r = odpovedz(q, kb);
    if (r.typ === 'odpoved' && r.id === 'trvanie') A.push(`${l} | ${q} → ${p.id}: ${JSON.stringify(r.p.odpoved).slice(0, 60)}`);
  }
  const fv = kb.polozky.find((p) => p.id === 'farbenie-vlasov');
  const vsetkyCen = new Set(kb.polozky.filter(cena).flatMap((p) => p.kluc.replace(/\|/g, ' ').split(/\s+/).map((t) => t.replace(/[!=]/g, '').toLowerCase())));
  for (const s of silne(fv).filter((s) => !vsetkyCen.has(s))) for (const y of kb.polozky.filter((p) => cena(p) && !p.pravidlo && p.id !== 'farbenie-brady' && p.odpoved.some(Array.isArray))) {
    const n = y.odpoved.find(Array.isArray)[0].split(/\s+/).pop();
    const q = `${C[l]} ${s} ${n}`, r = odpovedz(q, kb);
    if (r.typ === 'odpoved' && cena(r.p)) B.push(`${l} | ${q} → ${r.id} ${JSON.stringify(r.p.odpoved).slice(0, 50)}`);
  }
}
console.log('A', A.length); A.forEach((x) => console.log('  ' + x));
console.log('B', B.length); B.forEach((x) => console.log('  ' + x));
