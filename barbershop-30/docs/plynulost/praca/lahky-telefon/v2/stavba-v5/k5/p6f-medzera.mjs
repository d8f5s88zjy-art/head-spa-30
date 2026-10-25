// P6f (šablóna staviteľa „FRAZA.cas + služba + deň“) – koľko holých trvaní vidí hola() testu a koľko ich naozaj je
import fs from 'node:fs'; import path from 'node:path';
const ROOT = path.resolve(process.argv[2]);
const { odpovedz } = await import(path.join(ROOT, 'assets/recepcia.js'));
const J = ['sk', 'en', 'uk', 'hu', 'sr', 'pl', 'de', 'cs'];
const FRAZA = { sk: 'Ako dlho trvá', en: 'How long does it take:', de: 'Wie lange dauert', cs: 'Jak dlouho trvá', pl: 'Jak długo trwa', hu: 'Meddig tart', sr: 'Koliko traje', uk: 'Скільки триває' };
const LOC = { sk: 'sk', en: 'en', uk: 'uk', hu: 'hu', sr: 'sr-Latn', pl: 'pl', de: 'de', cs: 'cs' };
const DNI = (l) => [...Array(7)].map((_, i) => new Intl.DateTimeFormat(LOC[l], { weekday: 'long' }).format(new Date(2026, 9, 26 + i)));
const testHola = (r) => r.typ === 'odpoved' && /€|\d (min|хв|perc|Min)/.test(JSON.stringify(r.p.odpoved)); // kópia z testu (riadok 48–49)
const naozaj = (r) => r.typ === 'odpoved' && /€|\d[\s ](min|хв|perc|Min)/.test(JSON.stringify(r.p.odpoved));
for (const l of J) {
  const kb = JSON.parse(fs.readFileSync(path.join(ROOT, `assets/recepcia/${l}.json`), 'utf8'));
  const sl = kb.polozky.filter((p) => JSON.stringify(p.odpoved || '').includes('€') && p.odpoved.some(Array.isArray));
  let n = 0, a = 0, b = 0;
  for (const P of sl) for (const d of DNI(l)) { const r = odpovedz(`${FRAZA[l]} ${P.odpoved.find(Array.isArray)[0]} ${d}?`, kb); n++; if (testHola(r)) a++; if (naozaj(r)) b++; }
  console.log(`${l}: otázok ${n}, holé trvanie podľa hola() testu ${a}, naozaj ${b}`);
}
