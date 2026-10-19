#!/usr/bin/env node
/* Súhrn meraní meraj.mjs a cierne.mjs ako tabuľky v markdowne; s dvoma priečinkami porovnanie pred/po.
   node suhrn.mjs <vysledky> [<vysledky-po>] [--ciele]
   Ciele (ZADANIE 2.1): žiadna dlhá úloha > 50 ms počas skrolu, žiadna snímka > 100 ms, p95 ≤ 20 ms, > 33 ms ≤ 2 %,
   INP < 200 ms, CLS < 0,05, LCP ≤ 2,5 s; čierne okná: žiadne nad 150 ms. */
import fs from 'node:fs';
import path from 'node:path';
const dirs = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const load = (d) => Object.fromEntries(fs.readdirSync(d).filter((f) => f.endsWith('.json')).map((f) => [f.replace(/\.json$/, ''), JSON.parse(fs.readFileSync(path.join(d, f), 'utf8'))]));
const cier = (d) => Object.fromEntries(fs.readdirSync(d).filter((f) => f.startsWith('cierne-') && fs.existsSync(path.join(d, f, 'cierne.json'))).map((f) => [f, JSON.parse(fs.readFileSync(path.join(d, f, 'cierne.json'), 'utf8'))]));
const A = load(dirs[0]), B = dirs[1] ? load(dirs[1]) : null;
const CA = cier(dirs[0]), CB = dirs[1] ? cier(dirs[1]) : null;
const v = (x, d = 0) => (x == null || Number.isNaN(x) ? '–' : typeof x === 'number' ? x.toFixed(d) : x);
const pair = (a, b, d = 0) => (!B || b === undefined ? v(a, d) : `${v(a, d)} → ${v(b, d)}`);
const names = Object.keys(A).filter((k) => A[k].meta).sort();
const g = (o, p) => p.split('.').reduce((x, k) => (x == null ? x : x[k]), o);
const row = (cells) => '| ' + cells.join(' | ') + ' |';
const out = [];
out.push('## Načítanie\n');
out.push(row(['beh', 'FCP ms', 'LCP ms', 'LCP prvok', 'TBT ms', 'CLS', 'dlhé úlohy', 'najdlhšia ms', 'prvý snímok filmu ms']));
out.push(row(Array(9).fill('---')));
for (const n of names) {
  const a = A[n], b = B && B[n];
  const mx = (x) => x && x.nacitanie ? Math.max(0, ...x.nacitanie.dlheUlohy.map((t) => t[1])) : null;
  out.push(row([n, pair(g(a, 'nacitanie.fcp'), b && g(b, 'nacitanie.fcp')), pair(g(a, 'nacitanie.lcp'), b && g(b, 'nacitanie.lcp')), String(g(a, 'nacitanie.lcpPrvok') || '').slice(0, 30), pair(g(a, 'nacitanie.tbt'), b && g(b, 'nacitanie.tbt')), pair(g(a, 'nacitanie.cls'), b && g(b, 'nacitanie.cls'), 4), pair(g(a, 'nacitanie.dlheUlohy.length'), b && g(b, 'nacitanie.dlheUlohy.length')), pair(mx(a), b && mx(b)), pair(g(a, 'uvod.prvySnimokFilmu'), b && g(b, 'uvod.prvySnimokFilmu'))]));
}
out.push('\n## Úvod (prológ alebo nábeh úvodu)\n');
out.push(row(['beh', 'prológ', 'p50', 'p95', 'max', '> 33 ms %', 'dlhé úlohy', 'najdlhšia']));
out.push(row(Array(8).fill('---')));
for (const n of names) {
  const a = A[n], b = B && B[n]; if (!a.uvod) continue;
  out.push(row([n, a.uvod.prolog ? 'áno' : 'nie', pair(g(a, 'uvod.snimky.p50'), b && g(b, 'uvod.snimky.p50'), 1), pair(g(a, 'uvod.snimky.p95'), b && g(b, 'uvod.snimky.p95'), 1), pair(g(a, 'uvod.snimky.max'), b && g(b, 'uvod.snimky.max'), 0), pair(g(a, 'uvod.snimky.podiel33'), b && g(b, 'uvod.snimky.podiel33'), 1), pair(g(a, 'uvod.dlheUlohy.pocet'), b && g(b, 'uvod.dlheUlohy.pocet')), pair(g(a, 'uvod.dlheUlohy.max'), b && g(b, 'uvod.dlheUlohy.max'))]));
}
out.push('\n## Skrol celou stránkou (snímky rAF; práca hlavného vlákna na snímku bez čakania na GPU)\n');
out.push(row(['beh', 'prechod', 'snímok', 'p50', 'p95', 'max', '> 33 ms %', '> 100 ms', 'dlhé úlohy', 'najdlhšia', 'práca p50', 'práca p95', 'práca > 16,7 ms %', 'CPU p50', 'CPU p95', 'WebGL ms/sn.', 'textúry MB', 'koniec Y', 'záťaž']));
out.push(row(Array(19).fill('---')));
for (const n of names) {
  const a = A[n], b = B && B[n]; if (!a.skrol) continue;
  for (const p of Object.keys(a.skrol.prechody)) {
    const P = (x, k) => g(x, `skrol.prechody.${p}.${k}`), W = (x, k) => g(x, `skrol.vlakno.${p}.pracaNaSnimku.${k}`), C = (x, k) => g(x, `skrol.vlakno.${p}.cpuNaSnimku.${k}`);
    out.push(row([n, p, v(P(a, 'snimky.snimok')), pair(P(a, 'snimky.p50'), b && P(b, 'snimky.p50'), 1), pair(P(a, 'snimky.p95'), b && P(b, 'snimky.p95'), 1), pair(P(a, 'snimky.max'), b && P(b, 'snimky.max')), pair(P(a, 'snimky.podiel33'), b && P(b, 'snimky.podiel33'), 1), pair(P(a, 'snimky.nad100'), b && P(b, 'snimky.nad100')), pair(P(a, 'dlheUlohy.pocet'), b && P(b, 'dlheUlohy.pocet')), pair(P(a, 'dlheUlohy.max'), b && P(b, 'dlheUlohy.max')), pair(W(a, 'p50'), b && W(b, 'p50'), 1), pair(W(a, 'p95'), b && W(b, 'p95'), 1), pair(W(a, 'nad16'), b && W(b, 'nad16'), 1), pair(C(a, 'p50'), b && C(b, 'p50'), 1), pair(C(a, 'p95'), b && C(b, 'p95'), 1), pair(P(a, 'glMsNaSnimku'), b && P(b, 'glMsNaSnimku'), 1), pair(P(a, 'texturyMB'), b && P(b, 'texturyMB'), 0), v(P(a, 'koniecY')), v(P(a, 'zataz') ?? g(a, 'meta.zataz.0'), 1)]));
  }
}
out.push('\n## Skrol po sekciách (všetky prechody spolu): p95 snímky / max / dlhé úlohy; práca hlavného vlákna ms na snímku\n');
for (const n of names) {
  const a = A[n]; if (!a.skrol) continue;
  const secs = Object.keys(a.skrol.sekcie || {});
  out.push(`\n**${n}**\n`);
  out.push(row(['sekcia', 'p95', 'max', '> 33 ms %', 'dlhé úlohy (všetky prechody)', 'práca ms/sn.', 'štýl', 'layout', 'paint', 'skript', 'čakanie kompozítor', 'čakanie GPU', 'CPU ms/sn.', 'CPU štýl', 'CPU skript']));
  out.push(row(Array(15).fill('---')));
  for (const s of secs) {
    const st = a.skrol.sekcie[s], hv = (a.skrol.hlavneVlaknoMsNaSnimku || {})[s] || {};
    const lt = Object.values(a.skrol.prechody).reduce((x, p) => x + ((p.sekcie[s] && p.sekcie[s].dlheUlohy.pocet) || 0), 0);
    const ltm = Math.max(0, ...Object.values(a.skrol.prechody).map((p) => (p.sekcie[s] && p.sekcie[s].dlheUlohy.max) || 0));
    const work = (hv.spolu || 0) - (hv['cakanie-kompozitor'] || 0) - (hv['gpu-cakanie'] || 0);
    const hc = (a.skrol.hlavneVlaknoCpuMsNaSnimku || {})[s] || {};
    out.push(row([s, v(st.p95, 1), v(st.max), v(st.podiel33, 1), `${lt} (max ${ltm})`, v(work, 1), v(hv.styl, 1), v(hv.layout, 1), v(hv.paint, 1), v(hv.skript, 1), v(hv['cakanie-kompozitor'], 1), v(hv['gpu-cakanie'], 1), v(hc.praca, 1), v(hc.styl, 1), v(hc.skript, 1)]));
  }
}
out.push('\n## Prechody (INP z Event Timing, snímky počas prechodu)\n');
out.push(row(['beh', 'prechod', 'INP ms', 'p95', 'max', 'dlhé úlohy', 'najdlhšia']));
out.push(row(Array(7).fill('---')));
for (const n of names) {
  const a = A[n], b = B && B[n]; if (!a.prechody) continue;
  for (const [k, x] of Object.entries(a.prechody)) {
    if (!x || x.snimky === undefined) continue;
    const y = b && b.prechody && b.prechody[k];
    out.push(row([n, k + (x.chyba ? ' (chyba: ' + x.chyba.slice(0, 40) + ')' : ''), pair(x.interakcie.inp, y && y.interakcie.inp), pair(g(x, 'snimky.p95'), y && g(y, 'snimky.p95'), 1), pair(g(x, 'snimky.max'), y && g(y, 'snimky.max')), pair(x.dlheUlohy.pocet, y && y.dlheUlohy.pocet), pair(x.dlheUlohy.max, y && y.dlheUlohy.max)]));
  }
}
if (Object.keys(CA).length) {
  out.push('\n## Čierne okná (súvislá prázdna tmavá plocha > 20 % okna dlhšie ako 150 ms)\n');
  out.push(row(['beh', 'scenár', 'okien', 'spolu ms', 'najdlhšie ms', 'max podiel']));
  out.push(row(Array(6).fill('---')));
  for (const [n, c] of Object.entries(CA)) for (const [s, x] of Object.entries(c.scenare)) {
    const y = CB && CB[n] && CB[n].scenare[s];
    const mx = (z) => z ? Math.max(0, ...z.oknaNad150ms.map((o) => o.ms)) : undefined;
    out.push(row([n, s, pair(x.oknaNad150ms.length, y && y.oknaNad150ms.length), pair(x.spoluMs, y && y.spoluMs), pair(mx(x), y && mx(y)), pair(x.maxPodiel, y && y.maxPodiel, 2)]));
  }
}
console.log(out.join('\n'));
