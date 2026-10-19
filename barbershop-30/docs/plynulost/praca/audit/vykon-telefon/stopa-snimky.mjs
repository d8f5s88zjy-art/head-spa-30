#!/usr/bin/env node
/* Zloženie ťažkých snímok hlavného vlákna zo stopy (meraj.mjs --ulozStopu=1).
   Každá úloha ProxyMain::BeginMainFrame (rAF, štýl, layout, paint, commit) = jedna snímka; ostatné úlohy medzi
   snímkami (vstup, časovače, sieť) sa pripočítajú k nasledujúcej snímke. Vypíše rozdelenie trvania a priemerné
   zloženie snímok nad prahom (vlastný čas podľa mena udalosti) a skripty v nich.
   node stopa-snimky.mjs <stopa.trace.json> [--prah=16.7] */
import fs from 'node:fs';
const opt = Object.fromEntries(process.argv.slice(3).filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? '1']; }));
const PRAH = Number(opt.prah || 16.7);
const j = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const ev = Array.isArray(j) ? j : j.traceEvents;
const sync = ev.find((e) => /^vt-sync/.test(e.name || ''));
const tn = new Map(); for (const e of ev) if (e.ph === 'M' && e.name === 'thread_name') tn.set(e.pid + ':' + e.tid, e.args.name);
const list = ev.filter((e) => e.pid === sync.pid && tn.get(e.pid + ':' + e.tid) === 'CrRendererMain' && e.ph === 'X' && e.dur != null)
  .map((e) => ({ n: e.name, ts: e.ts / 1000, d: e.dur / 1000, a: e.args })).sort((a, b) => a.ts - b.ts || b.d - a.d);
const st = [];
for (const x of list) { x.self = x.d; x.end = x.ts + x.d; while (st.length && st[st.length - 1].end <= x.ts + 1e-6) st.pop(); x.depth = st.length; x.root = st.length ? st[0] : x; if (st.length) st[st.length - 1].self -= Math.min(x.d, Math.max(0, st[st.length - 1].end - x.ts)); st.push(x); }
const WAIT = /WaitFor|Initialize$/;
// snímky: koreň obsahuje ProxyMain::BeginMainFrame
const roots = list.filter((x) => x.depth === 0);
const isFrame = new Set(list.filter((x) => x.n === 'ProxyMain::BeginMainFrame').map((x) => x.root));
const frames = []; let pending = [];
for (const r of roots) { pending.push(r); if (isFrame.has(r)) { frames.push(pending); pending = []; } }
const byRoot = new Map(); for (const x of list) { const k = x.root; (byRoot.get(k) || byRoot.set(k, []).get(k)).push(x); }
const rows = frames.map((rs) => {
  const comp = {}; let work = 0, wait = 0; const scr = {};
  for (const r of rs) for (const x of byRoot.get(r) || []) {
    if (WAIT.test(x.n)) wait += x.self; else { work += x.self; comp[x.n] = (comp[x.n] || 0) + x.self; }
    if (x.n === 'FunctionCall' && x.a && x.a.data && x.depth <= 3) { const d = x.a.data; const k = `${String(d.url || '').split('/barbershop-30/').pop()}:${(d.lineNumber ?? -1) + 1} ${d.functionName || ''}`; scr[k] = (scr[k] || 0) + x.d; }
  }
  return { work, wait, comp, scr };
});
const s = rows.map((r) => r.work).sort((a, b) => a - b);
const qq = (p) => s[Math.min(s.length - 1, Math.ceil(p * s.length) - 1)];
console.log(`snímok ${rows.length}; práca (bez čakania) p50 ${qq(0.5).toFixed(1)} p90 ${qq(0.9).toFixed(1)} p95 ${qq(0.95).toFixed(1)} max ${s[s.length - 1].toFixed(1)} ms; nad ${PRAH} ms: ${rows.filter((r) => r.work > PRAH).length}`);
const agg = (rs) => { const c = {}, sc = {}; for (const r of rs) { for (const [k, v] of Object.entries(r.comp)) c[k] = (c[k] || 0) + v; for (const [k, v] of Object.entries(r.scr)) sc[k] = (sc[k] || 0) + v; } const n = Math.max(1, rs.length); return { zlozenie: Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 14).map(([k, v]) => `${k} ${(v / n).toFixed(2)}`), skripty: Object.entries(sc).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => `${k} ${(v / n).toFixed(2)}`) }; };
const heavy = rows.filter((r) => r.work > PRAH), light = rows.filter((r) => r.work <= PRAH);
console.log(`\nťažké snímky (${heavy.length}), priemer ms na snímku:`); const h = agg(heavy); console.log('  ' + h.zlozenie.join('\n  ')); console.log('  skripty: ' + h.skripty.join(', '));
console.log(`\nľahké snímky (${light.length}), priemer ms na snímku:`); const l = agg(light); console.log('  ' + l.zlozenie.slice(0, 8).join('\n  ')); console.log('  skripty: ' + l.skripty.join(', '));
