// Dekódovanie obrázkov počas skrolu: kedy začne voči zmene triedy is-shown/is-near kotvy (trace s invalidationTracking),
// trvanie na vlákne (CPU spomalenie platí len pre hlavné vlákno, dekódovanie na pracovných vláknach nie).
import fs from 'fs'; import zlib from 'zlib';
import { mainThread, threads } from './analyza.mjs';
const ev = JSON.parse(zlib.gunzipSync(fs.readFileSync(process.argv[2]))).traceEvents;
const mt = mainThread(ev); const names = threads(ev);
const t0 = ev.filter((e) => e.ph === 'X').reduce((a, e) => Math.min(a, e.ts), Infinity);
const dec = ev.filter((e) => e.ph === 'X' && (e.name === 'Decode Image' || e.name === 'ImageDecodeTask')).sort((a, b) => a.ts - b.ts);
console.log('príklad args:', JSON.stringify(dec.find((e) => e.name === 'Decode Image')?.args), JSON.stringify(dec.find((e) => e.name === 'ImageDecodeTask')?.args));
const big = dec.filter((e) => e.name === 'Decode Image' && e.dur > 10000);
const cls = ev.filter((e) => `${e.pid}:${e.tid}` === mt && e.name === 'ScheduleStyleInvalidationTracking' && /is-shown|is-near/.test(e.args?.data?.changedClass || '')).map((e) => ({ ts: e.ts, c: e.args.data.changedClass, node: e.args.data.nodeName }));
console.log('dekódovaní > 10 ms:', big.length, 'trvanie ms:', big.map((e) => (e.dur / 1000).toFixed(0)).join(' '));
for (const d of big) {
  const prev = cls.filter((c) => c.ts <= d.ts).slice(-1)[0];
  console.log(`  dekód o ${((d.ts - t0) / 1000).toFixed(0)} ms, ${(d.dur / 1000).toFixed(0)} ms na ${names.get(`${d.pid}:${d.tid}`)}; posledná zmena triedy pred ním: ${prev ? `${prev.c} o ${((d.ts - prev.ts) / 1000).toFixed(0)} ms skôr` : '-'} ${JSON.stringify(d.args).slice(0, 80)}`);
}
