import { readFileSync } from 'node:fs';
const root = process.argv[2];
const { odpovedz } = await import(root + '/assets/recepcia.js');
const L = ['sk','en','uk','hu','sr','pl','de','cs'];
const qs = readFileSync(process.argv[3],'utf8').split('\n').filter(Boolean).map(l=>l.split('|'));
const adv = process.argv[4]==="bez" ? [] : ['a'.repeat(200), 'strihbradaholeniefarbenieobociadepilacia'.repeat(5), Array.from({length:66},(_,i)=>'xy'+i).join(' ').slice(0,200), 'kolko stoji '.repeat(17), 'Rückenwaxingbartfärbungaugenbrauen'.repeat(6), 'Скільки коштує стрижка бороди '.repeat(7)];
const res = {};
for (const l of L) {
  const kb = JSON.parse(readFileSync(`${root}/assets/recepcia/${l}.json`,'utf8'));
  const t0 = performance.now(); odpovedz('x', kb); const prip = performance.now()-t0;
  const mine = qs.filter(x=>x[0]===l).map(x=>x[1]).concat(adv);
  for (let w=0; w<3; w++) for (const q of mine) odpovedz(q, kb);
  let max=0, maxq='', sum=0;
  for (const q of mine) { const a=performance.now(); for(let i=0;i<5;i++) odpovedz(q,kb); const d=(performance.now()-a)/5; sum+=d; if(d>max){max=d;maxq=q;} }
  res[l] = { otazok: mine.length, priprav_ms: +prip.toFixed(2), priemer_ms: +(sum/mine.length).toFixed(3), max_ms: +max.toFixed(3), maxq: maxq.slice(0,40) };
}
console.table(res);
