// Najdlhšie prepočty štýlu (UpdateLayoutTree): počet prvkov, potomkovia v trace, čo bolo tesne pred nimi
import fs from 'fs'; import zlib from 'zlib';
import { mainThread } from './analyza.mjs';
const ev = JSON.parse(zlib.gunzipSync(fs.readFileSync(process.argv[2]))).traceEvents;
const mt = mainThread(ev);
const main = ev.filter((e) => `${e.pid}:${e.tid}` === mt && (e.ph === 'X' || e.ph === 'B' || e.ph === 'E' || e.ph === 'I' || e.ph === 'i')).sort((a, b) => a.ts - b.ts);
const X = main.filter((e) => e.ph === 'X');
const ult = X.filter((e) => e.name === 'UpdateLayoutTree');
const tot = ult.reduce((a, e) => a + e.dur, 0) / 1000;
console.log('ULT n', ult.length, 'spolu ms', tot.toFixed(0));
// rozdelenie trvania podľa počtu prvkov
const bins = {};
for (const e of ult) { const c = e.args.elementCount || 0; const b = c === 0 ? '0' : c < 10 ? '1-9' : c < 50 ? '10-49' : c < 200 ? '50-199' : '200+'; bins[b] = bins[b] || { n: 0, ms: 0, max: 0 }; bins[b].n++; bins[b].ms += e.dur / 1000; bins[b].max = Math.max(bins[b].max, e.dur / 1000); }
console.log(bins);
const t0 = X[0].ts;
const top = [...ult].sort((a, b) => b.dur - a.dur).slice(0, 12);
for (const e of top) {
  const kids = X.filter((c) => c !== e && c.ts >= e.ts && c.ts + c.dur <= e.ts + e.dur).map((c) => `${c.name} ${(c.dur / 1000).toFixed(1)}`);
  const inst = main.filter((c) => (c.ph === 'I' || c.ph === 'i') && c.ts >= e.ts && c.ts <= e.ts + e.dur).map((c) => c.name);
  console.log(((e.ts - t0) / 1000).toFixed(0), 'ms', (e.dur / 1000).toFixed(1), 'prvkov', e.args.elementCount, JSON.stringify(e.args).slice(0, 200), kids.slice(0, 8).join(', '), inst.slice(0, 5).join(','));
}
// aké názvy udalostí sú vnorené v ULT celkovo
const nm = new Map();
for (const e of ult) for (const c of X) { if (c.ts < e.ts) continue; if (c.ts > e.ts + e.dur) break; if (c !== e && c.ts + c.dur <= e.ts + e.dur) nm.set(c.name, (nm.get(c.name) || 0) + c.dur / 1000); }
console.log([...nm.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15));
