// Rozbor najdlhších volaní film.js frame v stope: čas vlákna, vnorené udalosti (GC, štýl, gpu) – node rozbor-frame.mjs stopa.json [n]
import fs from 'node:fs';
const [file, n = 8] = process.argv.slice(2);
const evs = JSON.parse(fs.readFileSync(file, 'utf8')).traceEvents;
const tn = evs.find((e) => e.name === 'thread_name' && e.args.name === 'CrRendererMain');
const M = evs.filter((e) => e.pid === tn.pid && e.tid === tn.tid && e.ph === 'X' && e.dur != null);
const fr = M.filter((e) => e.name === 'FunctionCall' && e.args?.data?.functionName === 'frame' && /film\.js/.test(e.args.data.url || ''));
const td = (e) => (e.tdur ?? e.dur) / 1000;
const all = fr.map(td).sort((a, b) => a - b);
const q = (p) => all[Math.min(all.length - 1, Math.floor(p * all.length))];
console.log('film frame volaní', all.length, 'vlákno p50', q(0.5).toFixed(1), 'p90', q(0.9).toFixed(1), 'p95', q(0.95).toFixed(1), 'max', all.at(-1).toFixed(1), 'spolu', all.reduce((a, b) => a + b, 0).toFixed(0), 'ms; nad 16 ms:', all.filter((x) => x > 16.7).length, 'nad 50 ms:', all.filter((x) => x > 50).length);
for (const f of [...fr].sort((a, b) => td(b) - td(a)).slice(0, +n)) {
  const inner = M.filter((e) => e !== f && e.ts >= f.ts && e.ts + e.dur <= f.ts + f.dur && td(e) > 1);
  const agg = {}; for (const e of inner) agg[e.name] = (agg[e.name] || 0) + td(e);
  console.log(`frame stena ${(f.dur / 1000).toFixed(1)} vlákno ${td(f).toFixed(1)} |`, Object.entries(agg).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => `${k} ${v.toFixed(1)}`).join(', '));
}
