#!/usr/bin/env node
/* Rozbor uloženej stopy (meraj.mjs --ulozStopu=1): dlhé úlohy hlavného vlákna a čo v nich bolo.
   node stopa-detail.mjs <subor.trace.json> [--min=50] [--top=15]
   Pre každú úlohu nad prah: trvanie, vlastný čas podľa mena udalosti (top 8), URL a riadky skriptov (FunctionCall),
   prvky v prepočte štýlu, a čo v tom čase robilo vlákno GPU (CrGpuMain) a kompozítor. */
import fs from 'node:fs';
const file = process.argv[2];
const opt = Object.fromEntries(process.argv.slice(3).filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? '1']; }));
const MIN = Number(opt.min || 50), TOP = Number(opt.top || 15);
const j = JSON.parse(fs.readFileSync(file, 'utf8'));
const ev = Array.isArray(j) ? j : j.traceEvents;
const tn = new Map(), pn = new Map();
for (const e of ev) { if (e.ph === 'M' && e.name === 'thread_name') tn.set(e.pid + ':' + e.tid, e.args.name); if (e.ph === 'M' && e.name === 'process_name') pn.set(e.pid, e.args.name); }
const sync = ev.find((e) => /^vt-sync/.test(e.name || ''));
const rpid = sync ? sync.pid : null;
const by = new Map(); const open = new Map();
for (const e of ev) {
  const k = e.pid + ':' + e.tid;
  if (e.ph === 'X' && e.dur != null) (by.get(k) || by.set(k, []).get(k)).push({ n: e.name, ts: e.ts / 1000, d: e.dur / 1000, a: e.args });
  else if (e.ph === 'B') (open.get(k) || open.set(k, []).get(k)).push(e);
  else if (e.ph === 'E') { const b = (open.get(k) || []).pop(); if (b) (by.get(k) || by.set(k, []).get(k)).push({ n: b.name, ts: b.ts / 1000, d: (e.ts - b.ts) / 1000, a: b.args }); }
}
const nest = (list) => { list.sort((a, b) => a.ts - b.ts || b.d - a.d); const st = []; for (const x of list) { x.self = x.d; x.end = x.ts + x.d; while (st.length && st[st.length - 1].end <= x.ts + 1e-6) st.pop(); x.depth = st.length; x.par = st[st.length - 1] || null; if (x.par) x.par.self -= Math.min(x.d, Math.max(0, x.par.end - x.ts)); st.push(x); } return list; };
let main = null, gpu = null, comp = null;
for (const [k, list] of by) {
  const pid = Number(k.split(':')[0]), t = tn.get(k);
  if (pid === rpid && t === 'CrRendererMain') main = nest(list);
  if (pid === rpid && t === 'Compositor') comp = nest(list);
  if (/GPU/i.test(pn.get(pid) || '') && t === 'CrGpuMain') gpu = nest(list);
}
if (!main) { console.log('hlavné vlákno nenájdené'); process.exit(1); }
const t0 = sync ? sync.ts / 1000 : main[0].ts;
const roots = main.filter((x) => x.depth === 0 && x.d >= MIN).sort((a, b) => b.d - a.d).slice(0, TOP);
const inside = (list, a, b) => (list || []).filter((x) => x.ts < b && x.end > a);
const busy = (list, a, b) => (list || []).filter((x) => x.depth === 0 && x.ts < b && x.end > a).reduce((s, x) => s + Math.min(x.end, b) - Math.max(x.ts, a), 0);
for (const r of roots) {
  const kids = inside(main, r.ts, r.end).filter((x) => x.ts >= r.ts && x.end <= r.end + 1e-6);
  const self = {}; let elems = 0; const scripts = {};
  for (const x of kids) { self[x.n] = (self[x.n] || 0) + x.self; if (x.n === 'UpdateLayoutTree' && x.a && x.a.elementCount) elems += x.a.elementCount; if (x.n === 'FunctionCall' && x.a && x.a.data) { const d = x.a.data; const key = `${String(d.url || '').split('/barbershop-30/').pop()}:${(d.lineNumber ?? -1) + 1} ${d.functionName || ''}`; scripts[key] = (scripts[key] || 0) + x.d; } }
  const top = Object.entries(self).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k} ${v.toFixed(0)}`).join(', ');
  const gtop = {}; for (const x of inside(gpu, r.ts, r.end)) { if (x.depth <= 1) gtop[x.n] = (gtop[x.n] || 0) + Math.min(x.end, r.end) - Math.max(x.ts, r.ts); }
  console.log(`\n@${(r.ts - t0).toFixed(0)} ms  ${r.n} ${r.d.toFixed(0)} ms  (src ${r.a && (r.a.src_func || r.a.src_file) || '-'})`);
  console.log(`  vlastný čas: ${top}`);
  if (elems) console.log(`  prvkov v prepočte štýlu: ${elems}`);
  if (Object.keys(scripts).length) console.log(`  skripty: ${Object.entries(scripts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => `${k} ${v.toFixed(0)}`).join(', ')}`);
  console.log(`  GPU (CrGpuMain) zaneprázdnené ${busy(gpu, r.ts, r.end).toFixed(0)} ms: ${Object.entries(gtop).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => `${k} ${v.toFixed(0)}`).join(', ')}`);
  console.log(`  kompozítor zaneprázdnený ${busy(comp, r.ts, r.end).toFixed(0)} ms`);
}
// súhrn: koľko času bolo v dlhých úlohách
const all = main.filter((x) => x.depth === 0);
const long = all.filter((x) => x.d >= MIN);
console.log(`\nhlavné vlákno: úloh ${all.length}, nad ${MIN} ms: ${long.length}, ich čas ${long.reduce((s, x) => s + x.d, 0).toFixed(0)} ms`);
