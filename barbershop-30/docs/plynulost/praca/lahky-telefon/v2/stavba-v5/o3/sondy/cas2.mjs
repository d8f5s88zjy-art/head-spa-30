import { readFileSync } from 'node:fs';
const root = process.argv[2];
const { odpovedz } = await import(root + '/assets/recepcia.js?' + Date.now());
const Q = {
  sk: 'Dobrý deň, chcel by som sa opýtať, koľko by ma stál pánsky strih a k tomu úprava brady, a či by ste zvládli aj môjho syna, ktorý má osem rokov, najlepšie v sobotu doobeda, ďakujem veľmi pekne za odpoveď',
  en: 'Hello, I would like to ask how much a mens haircut together with a beard trim would cost me, and whether you could also fit in my son who is eight years old, ideally on Saturday morning, thank you',
  uk: 'Добрий день, хотів би запитати, скільки коштуватиме чоловіча стрижка разом з оформленням бороди, і чи могли б ви також прийняти мого сина, якому вісім років, бажано в суботу зранку, дякую',
  hu: 'Jó napot, szeretném megkérdezni, mennyibe kerülne egy férfi hajvágás szakálligazítással együtt, és hogy a nyolcéves fiamat is be tudnátok-e venni, lehetőleg szombat délelőtt, köszönöm szépen',
};
for (const [l, q0] of Object.entries(Q)) {
  const kb = JSON.parse(readFileSync(`${root}/assets/recepcia/${l}.json`, 'utf8'));
  const q = q0.slice(0, 200);
  for (let i = 0; i < 3; i++) odpovedz(q, kb);
  let t = Infinity; for (let i = 0; i < 7; i++) { const t0 = performance.now(); odpovedz(q, kb); t = Math.min(t, performance.now() - t0); }
  const r = odpovedz(q, kb);
  console.log(l, q.length, 'znakov', t.toFixed(2), 'ms', r.typ, r.id, Array.isArray(r.p) ? r.p.map((x) => x.id).join(',') : '');
}
