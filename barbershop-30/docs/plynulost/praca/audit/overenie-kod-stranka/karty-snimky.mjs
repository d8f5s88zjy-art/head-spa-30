// Snímky, v ktorých sa karta rozsvieti (trieda is-on na kotve -> nastúpi nadpis po slovách): trvanie úlohy, paint, layerize
import fs from 'fs'; import zlib from 'zlib';
import { mainThread } from './analyza.mjs';
for (const f of process.argv.slice(2)) {
  const ev = JSON.parse(zlib.gunzipSync(fs.readFileSync(f))).traceEvents;
  const mt = mainThread(ev);
  const all = ev.filter((e) => `${e.pid}:${e.tid}` === mt).sort((a, b) => a.ts - b.ts);
  const X = all.filter((e) => e.ph === 'X');
  const on = all.filter((e) => e.name === 'ScheduleStyleInvalidationTracking' && e.args?.data?.changedClass === 'is-on');
  const tasks = X.filter((e) => e.name === 'RunTask');
  const rows = [];
  for (const o of on) {
    // snímka, v ktorej sa zmena prejaví, a 8 nasledujúcich (prechody slov trvajú ~0,6 s + oneskorenie)
    const i = tasks.findIndex((t) => t.ts <= o.ts && t.ts + t.dur >= o.ts);
    const win = tasks.slice(i, i + 40).filter((t) => t.ts < o.ts + 900000);
    const fr = win.filter((t) => X.some((e) => e.name === 'PrePaint' && e.ts >= t.ts && e.ts <= t.ts + t.dur));
    const sum = (nm) => fr.reduce((a, t) => a + X.filter((e) => e.name === nm && e.ts >= t.ts && e.ts + e.dur <= t.ts + t.dur).reduce((b, e) => b + e.dur / 1000, 0), 0);
    rows.push({ snimok: fr.length, max: Math.max(...fr.map((t) => t.dur / 1000)), nad16: fr.filter((t) => t.dur > 16700).length, paint: sum('Paint'), layerize: sum('Layerize'), styl: sum('UpdateLayoutTree') });
  }
  const med = (k) => { const v = rows.map((r) => r[k]).sort((a, b) => a - b); return +(v[v.length >> 1] || 0).toFixed(1); };
  console.log(f.split('/')[0], `rozsvietení kariet: ${rows.length}; v 0,9 s po rozsvietení (medián): snímok ${med('snimok')}, najdlhšia ${med('max')} ms, nad 16,7 ms ${med('nad16')}, paint ${med('paint')} ms, layerize ${med('layerize')} ms, štýl ${med('styl')} ms`);
}
