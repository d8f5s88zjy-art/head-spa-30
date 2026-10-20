// Rozklad práce hlavného vlákna v jednej snímke (úloha s PrePaint/Commit = aktualizácia vykreslenia):
// rAF skript, štýl, layout, prepaint, paint, layerize, commit; percentily cez všetky snímky a počet nad 16,7 ms.
import fs from 'fs'; import zlib from 'zlib';
import { mainThread } from './analyza.mjs';
const ev = JSON.parse(zlib.gunzipSync(fs.readFileSync(process.argv[2]))).traceEvents;
const mt = mainThread(ev);
const X = ev.filter((e) => `${e.pid}:${e.tid}` === mt && e.ph === 'X').sort((a, b) => a.ts - b.ts || b.dur - a.dur);
const tasks = X.filter((e) => e.name === 'RunTask');
const K = ['FireAnimationFrame', 'UpdateLayoutTree', 'Layout', 'PrePaint', 'Paint', 'Layerize', 'Commit', 'HitTest', 'IntersectionObserverController::computeIntersections', 'EventDispatch', 'ScrollLayer'];
const frames = [];
let j = 0;
for (const t of tasks) {
  while (j < X.length && X[j].ts < t.ts) j++;
  const parts = Object.fromEntries(K.map((k) => [k, 0]));
  let isFrame = false;
  for (let i = j; i < X.length && X[i].ts < t.ts + t.dur; i++) {
    const e = X[i]; if (e === t) continue;
    if (e.name === 'PrePaint' || e.name === 'Commit') isFrame = true;
    if (K.includes(e.name)) parts[e.name] += e.dur / 1000;
  }
  if (isFrame) frames.push({ ms: t.dur / 1000, ...parts });
}
const q = (arr, p) => { const s = [...arr].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const rows = ['ms', ...K].map((k) => { const v = frames.map((f) => f[k]); return { cast: k === 'ms' ? 'SPOLU úloha snímky' : k, p50: +q(v, 0.5).toFixed(2), p95: +q(v, 0.95).toFixed(2), priemer: +(v.reduce((a, b) => a + b, 0) / v.length).toFixed(2), podiel_pct: k === 'ms' ? 100 : +(100 * v.reduce((a, b) => a + b, 0) / frames.reduce((a, f) => a + f.ms, 0)).toFixed(1) }; });
console.log(`snímok (úloh s vykreslením): ${frames.length}; nad 16,7 ms: ${frames.filter((f) => f.ms > 16.7).length} (${(100 * frames.filter((f) => f.ms > 16.7).length / frames.length).toFixed(1)} %); nad 50 ms: ${frames.filter((f) => f.ms > 50).length}`);
console.table(rows);
