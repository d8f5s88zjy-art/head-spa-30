#!/usr/bin/env node
/* Porovnanie pokusov A/B (fronta.sh, fronta2.sh): čas CPU hlavného vlákna na snímku (tdur, robustný voči záťaži stroja)
   a jeho rozdelenie (štýl, layout, paint, skript) pre každý beh a prechod. node ab.mjs [vysledky] [predpona=ab] */
import fs from 'node:fs';
import path from 'node:path';
const dir = process.argv[2] || path.join(path.dirname(new URL(import.meta.url).pathname), 'vysledky');
const pre = process.argv[3] || 'ab';
const files = fs.readdirSync(dir).filter((f) => f.startsWith(pre) && f.endsWith('.json')).sort();
const r1 = (x) => (x == null ? '–' : (+x).toFixed(1));
console.log('| beh | prechod | snímok | p95 snímky | > 33 ms % | dlhé úlohy | CPU p50 | CPU p95 | CPU > 16,7 ms % | CPU štýl/sn. | CPU layout/sn. | CPU paint/sn. | CPU skript/sn. | CPU animácie/sn. | záťaž |');
console.log('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');
for (const f of files) {
  const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  if (!j.skrol) continue;
  for (const [p, P] of Object.entries(j.skrol.prechody)) {
    const H = (j.skrol.vlakno || {})[p] || {}, C = H.cpuNaSnimku || {}, K = H.katCpu || {}, n = (P.snimky && P.snimky.snimok) || 1;
    console.log(`| ${f.replace(/\.json$/, '')} | ${p} | ${n} | ${r1(P.snimky.p95)} | ${r1(P.snimky.podiel33)} | ${P.dlheUlohy.pocet} (max ${P.dlheUlohy.max}) | ${r1(C.p50)} | ${r1(C.p95)} | ${r1(C.nad16)} | ${r1((K.styl || 0) / n)} | ${r1((K.layout || 0) / n)} | ${r1((K.paint || 0) / n)} | ${r1((K.skript || 0) / n)} | ${r1((K['animacie-css'] || 0) / n)} | ${r1(P.zataz ?? j.meta.zataz[0])} |`);
  }
}
