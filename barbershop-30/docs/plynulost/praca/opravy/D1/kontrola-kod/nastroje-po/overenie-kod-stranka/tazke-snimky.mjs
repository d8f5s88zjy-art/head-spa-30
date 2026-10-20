// Najťažšie snímky (úlohy s vykreslením) a čo v nich bolo: časti, zneplatnenia (ak je trace s invalidationTracking),
// zmeny tried kotiev v tom čase (vysledok.json near_zmeny nie sú v čase trace, preto len trace)
import fs from 'fs'; import zlib from 'zlib';
import { mainThread } from './analyza.mjs';
const ev = JSON.parse(zlib.gunzipSync(fs.readFileSync(process.argv[2]))).traceEvents;
const mt = mainThread(ev);
const all = ev.filter((e) => `${e.pid}:${e.tid}` === mt).sort((a, b) => a.ts - b.ts);
const X = all.filter((e) => e.ph === 'X');
const t0 = X[0].ts;
const tasks = X.filter((e) => e.name === 'RunTask' && e.dur > 25000);
const out = [];
for (const t of tasks) {
  const inside = all.filter((e) => e.ts >= t.ts && e.ts <= t.ts + t.dur && e !== t);
  if (!inside.some((e) => e.name === 'PrePaint' || e.name === 'Commit' || e.name === 'UpdateLayoutTree')) continue;
  const parts = new Map();
  for (const e of inside) if (e.ph === 'X' && ['FireAnimationFrame', 'UpdateLayoutTree', 'Layout', 'PrePaint', 'Paint', 'Layerize', 'Commit', 'HitTest', 'TimerFire', 'Decode Image', 'IntersectionObserverController::computeIntersections', 'UpdateLayer', 'PaintImage', 'EventDispatch', 'ParseAuthorStyleSheet'].includes(e.name)) parts.set(e.name, (parts.get(e.name) || 0) + e.dur / 1000);
  const ult = inside.filter((e) => e.name === 'UpdateLayoutTree' && e.ph === 'X').map((e) => e.args.elementCount);
  const inv = new Map();
  for (const e of inside) if (e.name === 'ScheduleStyleInvalidationTracking' || e.name === 'StyleRecalcInvalidationTracking') { const d = e.args.data || {}; const k = `${d.nodeName || ''}${d.changedClass ? ' .' + d.changedClass : ''}${d.changedAttribute ? ' @' + d.changedAttribute : ''} ${d.reason || ''}`.trim(); inv.set(k, (inv.get(k) || 0) + 1); }
  out.push({ t: Math.round((t.ts - t0) / 1000), ms: +(t.dur / 1000).toFixed(1), parts: [...parts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => `${k} ${v.toFixed(1)}`).join(', '), prvkov: ult.join('/'), inv: [...inv.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, n]) => `${n}× ${k.slice(0, 70)}`) });
}
out.sort((a, b) => b.ms - a.ms);
for (const o of out.slice(0, Number(process.argv[3] || 25))) console.log(JSON.stringify(o));
console.log('snímok > 25 ms:', out.length);
