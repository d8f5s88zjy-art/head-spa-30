#!/usr/bin/env node
/* Rozbor zaseknutí v uloženej stope (meraj.mjs --ulozStopu=1): medzery medzi snímkami (BeginMainFrame/rAF) nad prah
   a čo v tom čase robilo každé vlákno (hlavné, kompozítor, rastrovacie a dekódovacie vlákna, GPU).
   node stopa-zaseky.mjs <stopa.trace.json> [--prah=150] [--top=12] */
import fs from 'node:fs';
const opt = Object.fromEntries(process.argv.slice(3).filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? '1']; }));
const PRAH = Number(opt.prah || 150), TOP = Number(opt.top || 12);
const j = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const ev = Array.isArray(j) ? j : j.traceEvents;
const tn = new Map(), pn = new Map();
for (const e of ev) { if (e.ph === 'M' && e.name === 'thread_name') tn.set(e.pid + ':' + e.tid, e.args.name); if (e.ph === 'M' && e.name === 'process_name') pn.set(e.pid, e.args.name); }
const sync = ev.find((e) => /^vt-sync/.test(e.name || ''));
const rpid = sync.pid;
const thr = new Map();
for (const e of ev) {
  if (e.ph !== 'X' || e.dur == null) continue;
  const k = e.pid + ':' + e.tid, name = (pn.get(e.pid) || '?').replace(/ Process$/, '') + '/' + (tn.get(k) || '?');
  if (!(e.pid === rpid || /GPU/.test(pn.get(e.pid) || ''))) continue;
  (thr.get(name) || thr.set(name, []).get(name)).push({ n: e.name, ts: e.ts / 1000, d: e.dur / 1000, td: (e.tdur || 0) / 1000, a: e.args });
}
// self time and depth
for (const list of thr.values()) {
  list.sort((a, b) => a.ts - b.ts || b.d - a.d);
  const st = [];
  for (const x of list) { x.end = x.ts + x.d; x.self = x.d; while (st.length && st[st.length - 1].end <= x.ts + 1e-6) st.pop(); x.depth = st.length; if (st.length) st[st.length - 1].self -= x.d; st.push(x); }
}
const mainName = [...thr.keys()].find((k) => k.endsWith('/CrRendererMain'));
const main = thr.get(mainName);
// snímky = začiatky BeginMainFrame na hlavnom vlákne
const bmf = main.filter((x) => x.n === 'ProxyMain::BeginMainFrame' || x.n === 'BeginMainFrame').map((x) => x.ts).sort((a, b) => a - b);
const gaps = [];
for (let i = 1; i < bmf.length; i++) if (bmf[i] - bmf[i - 1] > PRAH) gaps.push([bmf[i - 1], bmf[i]]);
console.log(`snímok ${bmf.length}, medzier > ${PRAH} ms: ${gaps.length}, spolu ${gaps.reduce((s, g) => s + g[1] - g[0], 0).toFixed(0)} ms`);
const tot = {}; const names = {};
for (const [a, b] of gaps) {
  for (const [k, list] of thr) {
    let busy = 0;
    for (const x of list) { if (x.end <= a || x.ts >= b) continue; const o = Math.min(x.end, b) - Math.max(x.ts, a); if (x.depth === 0) busy += o; const s = Math.max(0, x.self) * (o / x.d); const nn = names[k] || (names[k] = {}); nn[x.n] = (nn[x.n] || 0) + s; }
    tot[k] = (tot[k] || 0) + busy;
  }
}
const W = gaps.reduce((s, g) => s + g[1] - g[0], 0);
console.log('\nvyťaženie vlákien počas medzier (% času medzier):');
for (const [k, v] of Object.entries(tot).sort((a, b) => b[1] - a[1]).slice(0, 14)) console.log(`  ${(100 * v / W).toFixed(0).padStart(4)} %  ${k}`);
console.log('\nnajväčšie udalosti (vlastný čas) v medzerách po vláknach:');
for (const [k, v] of Object.entries(tot).sort((a, b) => b[1] - a[1]).slice(0, 6)) {
  const top = Object.entries(names[k] || {}).sort((a, b) => b[1] - a[1]).slice(0, TOP).map(([n, ms]) => `${n} ${ms.toFixed(0)}`);
  console.log(`  ${k}: ${top.join(' | ')}`);
}
// 5 najdlhších medzier: čo bežalo
console.log('\nnajdlhšie medzery:');
for (const [a, b] of [...gaps].sort((x, y) => (y[1] - y[0]) - (x[1] - x[0])).slice(0, 6)) {
  const per = [];
  for (const [k, list] of thr) { let busy = 0; const nn = {}; for (const x of list) { if (x.end <= a || x.ts >= b) continue; const o = Math.min(x.end, b) - Math.max(x.ts, a); if (x.depth === 0) busy += o; nn[x.n] = (nn[x.n] || 0) + Math.max(0, x.self) * (o / x.d); } if (busy > 20) per.push(`${k.split('/').pop()} ${busy.toFixed(0)} ms [${Object.entries(nn).sort((p, q) => q[1] - p[1]).slice(0, 4).map(([n, m]) => n + ' ' + m.toFixed(0)).join(', ')}]`); }
  console.log(`  ${(b - a).toFixed(0)} ms (t=${(a - sync.ts / 1000).toFixed(0)} ms od začiatku): ${per.join(' ; ')}`);
}
// dekódovanie obrázkov celkovo
const dec = {}; for (const [k, list] of thr) for (const x of list) if (/Decode|ImageDecode/i.test(x.n)) { const d2 = dec[k] || (dec[k] = { n: 0, ms: 0, max: 0 }); d2.n++; d2.ms += x.d; d2.max = Math.max(d2.max, x.d); }
console.log('\ndekódovanie obrázkov (celá stopa):', JSON.stringify(Object.fromEntries(Object.entries(dec).map(([k, v]) => [k, { pocet: v.n, ms: Math.round(v.ms), max: Math.round(v.max) }]))));
