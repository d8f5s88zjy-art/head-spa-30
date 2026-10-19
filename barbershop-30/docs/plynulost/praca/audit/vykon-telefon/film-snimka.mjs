#!/usr/bin/env node
/* Čas funkcie frame() vo film.js na hlavnom vlákne zo stopy (meraj.mjs --ulozStopu=1, film=on):
   celý čas volania, z toho čakanie na GPU (WaitForToken/WaitForGetOffset…), vlastná práca (JS + kopírovanie dát
   do príkazového bufferu). node film-snimka.mjs <stopa.trace.json> */
import fs from 'node:fs';
const j = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const ev = Array.isArray(j) ? j : j.traceEvents;
const sync = ev.find((e) => /^vt-sync/.test(e.name || ''));
const tn = new Map(); for (const e of ev) if (e.ph === 'M' && e.name === 'thread_name') tn.set(e.pid + ':' + e.tid, e.args.name);
const main = ev.filter((e) => e.pid === sync.pid && tn.get(e.pid + ':' + e.tid) === 'CrRendererMain' && e.ph === 'X' && e.dur != null).map((e) => ({ n: e.name, ts: e.ts / 1000, d: e.dur / 1000, a: e.args })).sort((a, b) => a.ts - b.ts);
const calls = main.filter((x) => x.n === 'FunctionCall' && x.a && x.a.data && /film\.js/.test(x.a.data.url || '') && x.a.data.functionName === 'frame');
const waits = main.filter((x) => /WaitForToken|WaitForGetOffset|WaitForCommand|Initialize/.test(x.n));
const rows = calls.map((c) => { const w = waits.filter((x) => x.ts >= c.ts && x.ts < c.ts + c.d).reduce((s, x) => s + x.d, 0); return { d: c.d, w, p: c.d - w }; });
const st = (a) => { const s = [...a].sort((x, y) => x - y); const q = (p) => s[Math.min(s.length - 1, Math.ceil(p * s.length) - 1)]; return { n: s.length, p50: +q(0.5).toFixed(1), p90: +q(0.9).toFixed(1), p95: +q(0.95).toFixed(1), max: +s[s.length - 1].toFixed(1), spolu: Math.round(s.reduce((x, y) => x + y, 0)) }; };
console.log('frame() celkom', st(rows.map((r) => r.d)));
console.log('z toho čakanie na GPU', st(rows.map((r) => r.w)));
console.log('vlastná práca (bez čakania)', st(rows.map((r) => r.p)));
