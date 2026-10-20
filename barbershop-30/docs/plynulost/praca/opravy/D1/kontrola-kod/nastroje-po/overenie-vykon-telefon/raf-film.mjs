// Rozbor T1/T2: čas vlákna jednotlivých rAF volaní film.js (frame) a app.js (tick) zo stopy
import fs from 'node:fs';
const [file] = process.argv.slice(2);
const evs = JSON.parse(fs.readFileSync(file, 'utf8')).traceEvents;
const tn = evs.find((e) => e.name === 'thread_name' && e.args.name === 'CrRendererMain');
const M = evs.filter((e) => e.pid === tn.pid && e.tid === tn.tid && e.ph === 'X' && e.dur != null);
const fc = M.filter((e) => e.name === 'FunctionCall' && e.args && e.args.data);
const by = {};
for (const e of fc) { const d = e.args.data; const k = (d.url || '').split('/').pop().split('?')[0] + ':' + (d.lineNumber + 1) + ' ' + (d.functionName || ''); (by[k] || (by[k] = [])).push([(e.tdur ?? e.dur) / 1000, e.dur / 1000]); }
const st = (a) => { const s = [...a].sort((x, y) => x - y); const q = (p) => s[Math.min(s.length - 1, Math.floor(p * s.length))]; return { n: s.length, p50: +q(0.5).toFixed(2), p90: +q(0.9).toFixed(2), p95: +q(0.95).toFixed(2), max: +s[s.length - 1].toFixed(1), spolu: +s.reduce((x, y) => x + y, 0).toFixed(0) }; };
const rows = Object.entries(by).map(([k, a]) => [k, st(a.map((x) => x[0])), st(a.map((x) => x[1]))]).sort((a, b) => b[1].spolu - a[1].spolu).slice(0, 12);
for (const [k, v, w] of rows) console.log(k.padEnd(40), 'vlákno', JSON.stringify(v), '| stena p95', w.p95, 'max', w.max);
