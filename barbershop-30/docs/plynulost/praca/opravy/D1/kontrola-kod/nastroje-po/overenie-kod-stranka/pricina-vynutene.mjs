// Prečo čítanie scrollY v app.js (readTarget) vynúti prepočet štýlu: aké zneplatnenia mu predchádzajú v tej istej snímke
import fs from 'fs'; import zlib from 'zlib';
import { mainThread } from './analyza.mjs';
const ev = JSON.parse(zlib.gunzipSync(fs.readFileSync(process.argv[2]))).traceEvents;
const mt = mainThread(ev);
const main = ev.filter((e) => `${e.pid}:${e.tid}` === mt).sort((a, b) => a.ts - b.ts);
const st = (e) => { const s = e.args?.beginData?.stackTrace || e.args?.data?.stackTrace; return s && s.length ? s.slice(0, 3).map((f) => `${(f.url || '').split('/').pop()}:${f.functionName}:${f.lineNumber}`).join(' < ') : ''; };
const forced = main.filter((e) => e.name === 'UpdateLayoutTree' && e.ph === 'X' && /readTarget/.test(st(e)));
console.log('vynútených v readTarget:', forced.length);
const tally = new Map();
let prevEnd = 0, k = 0;
// pre každý vynútený prepočet: zneplatnenia od predchádzajúceho prepočtu štýlu po tento
const ults = main.filter((e) => e.name === 'UpdateLayoutTree' && e.ph === 'X');
for (const f of forced) {
  const i = ults.indexOf(f); const prev = ults[i - 1]; const from = prev ? prev.ts + prev.dur : 0;
  const inv = main.filter((e) => e.ts >= from && e.ts <= f.ts && /InvalidationTracking/.test(e.name));
  const keys = new Set();
  for (const e of inv) { const d = e.args?.data || {}; keys.add(`${e.name.replace('InvalidationTracking', '')} ${d.nodeName || ''} ${d.changedClass ? '.' + d.changedClass : ''}${d.changedAttribute ? '@' + d.changedAttribute : ''}${d.changedPseudo ? ':' + d.changedPseudo : ''} ${d.reason || ''} | ${st(e)}`); }
  // aj ostatné udalosti medzi (napr. animácie, udalosti)
  const other = main.filter((e) => e.ts >= from && e.ts <= f.ts && e.ph === 'X' && ['FunctionCall', 'EventDispatch', 'TimerFire', 'FireAnimationFrame', 'UpdateAnimationsAndStyle?', 'Animation'].includes(e.name)).map((e) => e.name === 'FunctionCall' ? `FC ${(e.args.data.url || '').split('/').pop()}:${e.args.data.functionName}` : e.name === 'EventDispatch' ? `ED ${e.args.data.type}` : e.name);
  for (const x of keys) tally.set(x, (tally.get(x) || 0) + 1);
  if (!keys.size) tally.set('(žiadne zneplatnenie v trace) ' + [...new Set(other)].join(','), (tally.get('(žiadne zneplatnenie v trace) ' + [...new Set(other)].join(',')) || 0) + 1);
  if (k++ < 3) console.log('príklad', (f.dur / 1000).toFixed(2), 'ms, prvkov', f.args.elementCount, [...keys].slice(0, 6));
}
console.log([...tally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30).map(([a, b]) => `${b}× ${a}`).join('\n'));
const cnt = forced.map((e) => e.args.elementCount || 0).sort((a, b) => a - b);
console.log('prvkov v týchto prepočtoch p50/p95/max', cnt[cnt.length >> 1], cnt[Math.floor(cnt.length * 0.95)], cnt[cnt.length - 1]);
