// Pre najdlhšie úlohy (čas vlákna) súčet udalostí podľa mena (všetky, aj krátke), aby sa našla skrytá práca
import fs from 'node:fs';
const [file, n = 3] = process.argv.slice(2);
const evs = JSON.parse(fs.readFileSync(file, 'utf8')).traceEvents;
const tn = evs.find((e) => e.name === 'thread_name' && e.args.name === 'CrRendererMain');
const all = evs.filter((e) => e.pid === tn.pid && e.tid === tn.tid);
const M = all.filter((e) => e.ph === 'X' && e.dur != null).sort((a, b) => a.ts - b.ts || b.dur - a.dur);
const tasks = M.filter((e) => e.name === 'RunTask' || e.name === 'ThreadControllerImpl::RunTask');
const top = []; let end = -1; for (const t of tasks) if (t.ts >= end) { top.push(t); end = t.ts + t.dur; }
for (const t of top.sort((a, b) => (b.tdur || 0) - (a.tdur || 0)).slice(0, +n)) {
  const inner = all.filter((e) => e !== t && e.ts >= t.ts && e.ts <= t.ts + t.dur);
  const agg = {};
  for (const e of inner) { const k = e.name + (e.ph !== 'X' ? '(' + e.ph + ')' : ''); const a = agg[k] || (agg[k] = [0, 0, 0]); a[0]++; if (e.ph === 'X') { a[1] += (e.tdur ?? e.dur) / 1000; a[2] += e.dur / 1000; } }
  console.log(`\n=== úloha stena ${(t.dur / 1000).toFixed(0)} ms, vlákno ${(t.tdur / 1000).toFixed(0)} ms, args ${JSON.stringify(t.args).slice(0, 200)}`);
  Object.entries(agg).sort((a, b) => b[1][1] - a[1][1] || b[1][0] - a[1][0]).slice(0, 25).forEach(([k, a]) => console.log(`   ${k}: ${a[0]}× vlákno ${a[1].toFixed(1)} stena ${a[2].toFixed(1)}`));
}
