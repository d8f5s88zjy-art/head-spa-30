// čas zhody (oprava 5): najlepší zo 7 behov na otázku, priemer a maximum; slepé sady + k4/vsetky-k4.txt + 200-znakové vstupy
// node cas-o5.mjs <strom/barbershop-30>
import { readFileSync } from 'node:fs';
const root = process.argv[2], S5 = new URL('..', import.meta.url).pathname;
const { odpovedz } = await import(root + '/assets/recepcia.js');
const Q = {};
for (const s of ['A', 'B', 'C2']) for (const l of readFileSync(S5 + `slepe/sada-${s}.jsonl`, 'utf8').split('\n').filter(Boolean)) { const o = JSON.parse(l); (Q[o.jazyk] ||= []).push(o.otazka); }
for (const l of readFileSync(S5 + 'k4/vsetky-k4.txt', 'utf8').split('\n').filter(Boolean)) { const [j, q] = l.split('|'); (Q[j] ||= []).push(q); }
const adv = ['a'.repeat(200), 'strihbradaholeniefarbenieobociadepilacia'.repeat(5), Array.from({ length: 66 }, (_, i) => 'xy' + i).join(' ').slice(0, 200), 'kolko stoji '.repeat(17), 'Rückenwaxingbartfärbungaugenbrauen'.repeat(6), 'Скільки коштує стрижка бороди '.repeat(7), 'strih brada holenie farbenie obocie depilacia hlava plet ultra balicek deti dlhe vlasy melir trvala kava hodiny adresa telefon email'];
const out = [];
for (const [l, qs] of Object.entries(Q)) {
  const kb = JSON.parse(readFileSync(`${root}/assets/recepcia/${l}.json`, 'utf8'));
  odpovedz('x', kb);
  const meraj = (list) => { for (let w = 0; w < 2; w++) list.forEach((q) => odpovedz(q, kb)); let max = 0, mq = '', sum = 0; for (const q of list) { let t = Infinity; for (let i = 0; i < 7; i++) { const a = performance.now(); odpovedz(q, kb); t = Math.min(t, performance.now() - a); } sum += t; if (t > max) { max = t; mq = q; } } return [sum / list.length, max, mq]; };
  const [p1, m1, q1] = meraj(qs), [p2, m2, q2] = meraj(adv);
  out.push(`${l}: otázok ${qs.length}, priemer ${p1.toFixed(3)} ms, max ${m1.toFixed(3)} ms („${q1.slice(0, 40)}“) | 200-znakové: priemer ${p2.toFixed(3)} ms, max ${m2.toFixed(3)} ms („${q2.slice(0, 30)}“)`);
}
console.log(out.join('\n'));
