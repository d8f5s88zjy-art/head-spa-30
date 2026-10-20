#!/usr/bin/env node
/* Rozbor dlhých úloh v stope (stopy/<meno>.json): pre každú úlohu nad prahom (čas vlákna) strom udalostí
   s časom vlákna, prvky štýlu, URL funkcií. node rozbor-uloh.mjs stopy/x.json [--prah=40] [--max=10] */
import fs from 'node:fs';
const [file, ...rest] = process.argv.slice(2);
const opt = Object.fromEntries(rest.filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.length ? v.join('=') : '1']; }));
const PRAH = Number(opt.prah || 40) * 1000;
const evs = JSON.parse(fs.readFileSync(file, 'utf8')).traceEvents;
const tn = evs.find((e) => e.name === 'thread_name' && e.args.name === 'CrRendererMain');
const M = evs.filter((e) => e.pid === tn.pid && e.tid === tn.tid && e.ph === 'X' && e.dur != null).sort((a, b) => a.ts - b.ts || b.dur - a.dur);
const tasks = M.filter((e) => e.name === 'RunTask' || e.name === 'ThreadControllerImpl::RunTask');
const top = []; let end = -1; for (const t of tasks) if (t.ts >= end) { top.push(t); end = t.ts + t.dur; }
const t0 = M[0].ts;
const long = top.filter((t) => (t.tdur || 0) > PRAH).sort((a, b) => b.tdur - a.tdur).slice(0, Number(opt.max || 10));
const desc = (e) => { const a = e.args || {}, d = a.data || a.beginData || {}; let s = e.name; if (d.url) s += ' ' + d.url.split('/').pop().split('?')[0] + ':' + ((d.lineNumber ?? -1) + 1) + (d.functionName ? ' ' + d.functionName : ''); if (a.elementCount) s += ' prvkov=' + a.elementCount; if (d.type) s += ' ' + d.type; if (a.data && a.data.stackTrace && a.data.stackTrace[0]) s += ' <- ' + a.data.stackTrace[0].url.split('/').pop() + ':' + (a.data.stackTrace[0].lineNumber + 1); return s; };
for (const t of long) {
  console.log(`\n=== úloha @${((t.ts - t0) / 1000).toFixed(0)} ms: stena ${(t.dur / 1000).toFixed(1)} ms, vlákno ${(t.tdur / 1000).toFixed(1)} ms`);
  const inner = M.filter((e) => e !== t && e.ts >= t.ts && e.ts + e.dur <= t.ts + t.dur && (e.tdur || e.dur) > 2000);
  // hĺbka podľa vnorenia
  const stack = [];
  for (const e of inner) {
    while (stack.length && stack[stack.length - 1].ts + stack[stack.length - 1].dur <= e.ts) stack.pop();
    if (stack.length < 6) console.log(`${'  '.repeat(stack.length + 1)}${desc(e)}  [stena ${(e.dur / 1000).toFixed(1)} | vlákno ${((e.tdur ?? e.dur) / 1000).toFixed(1)}]`);
    stack.push(e);
  }
}
