import fs from 'node:fs'; import path from 'node:path';
const ROOT = path.resolve(process.argv[2]); const { odpovedz } = await import(path.join(ROOT, 'assets/recepcia.js'));
const D = { sk: ['do 10 cm', 'pod 10 cm', 'menej ako 10 cm', 'max 10 cm', 'kratšie než 10 cm', 'do 10cm', 'pod 10cm'], cs: ['do 10 cm', 'pod 10 cm', 'méně než 10 cm', 'max 10 cm', 'do 10cm'],
  en: ['up to 10 cm', 'under 10 cm', 'less than 10 cm', 'below 10 cm', 'max 10 cm', 'up to 10cm'], de: ['bis 10 cm', 'unter 10 cm', 'weniger als 10 cm', 'max 10 cm', 'bis 10cm'],
  pl: ['do 10 cm', 'pod 10 cm', 'poniżej 10 cm', 'mniej niż 10 cm', 'do 10cm'], hu: ['10 cm-ig', '10 cm alatt', '10 cm-nél rövidebb', 'max 10 cm'],
  sr: ['do 10 cm', 'pod 10 cm', 'ispod 10 cm', 'manje od 10 cm', 'do 10cm'], uk: ['до 10 см', 'під 10 см', 'менше 10 см', 'нижче 10 см', 'до 10см'] };
const P = { sk: 'Koľko stojí', cs: 'Kolik stojí', en: 'How much is a', de: 'Was kostet ein', pl: 'Ile kosztuje', hu: 'Mennyibe kerül a', sr: 'Koliko košta', uk: 'Скільки коштує' };
for (const [l, arr] of Object.entries(D)) {
  const kb = JSON.parse(fs.readFileSync(path.join(ROOT, `assets/recepcia/${l}.json`), 'utf8'));
  const S = kb.polozky.find((p) => p.id === 'cena-strih').odpoved.find(Array.isArray)[0];
  const strih = { sk: 'strih', cs: 'střih', en: 'haircut', de: 'Haarschnitt', pl: 'strzyżenie', hu: 'hajvágás', sr: 'šišanje', uk: 'стрижка' }[l];
  const zle = [];
  for (const d of arr) for (const x of [strih, S]) { const q = `${P[l]} ${x} ${d}?`, r = odpovedz(q, kb); if (r.typ === 'odpoved' && r.id === 'cena-dlhe') zle.push(`„${q}“`); }
  console.log(`${l}: ${zle.length}/${arr.length * 2} → 22 € (nad 10 cm): ${zle.slice(0, 3).join(', ')}`);
}
