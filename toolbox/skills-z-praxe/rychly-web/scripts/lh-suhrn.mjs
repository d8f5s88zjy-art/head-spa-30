#!/usr/bin/env node
// Súhrn behov Lighthouse z JSON správ: skóre, simulované aj pozorované metriky, prvok LCP a medián.
// Pozorované (observed*) hodnoty sú z tohto behu v laboratórnom prehliadači; simulované (bez predpony)
// prepočítala simulácia (throttlingMethod: simulate). Keď je beh slabý, porovnaj ich: neskorý pozorovaný
// prvý obraz zhorší simulovaný Speed Index aj pri rovnakom FCP.
//
//   node lh-suhrn.mjs <priečinok s *.json | súbory.json ...>
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
if (!args.length) { console.error('použitie: node lh-suhrn.mjs <priečinok | súbory.json ...>'); process.exit(2); }
const files = args.flatMap((a) => (fs.statSync(a).isDirectory() ? fs.readdirSync(a).filter((f) => f.endsWith('.json')).sort().map((f) => path.join(a, f)) : [a]));

const s = (ms) => (ms == null ? '?' : (ms / 1000).toFixed(2));
const rows = [];
for (const f of files) {
  let j;
  try { j = JSON.parse(fs.readFileSync(f, 'utf8')); } catch { continue; }
  if (!j.audits || !j.categories) continue;
  const m = j.audits.metrics?.details?.items?.[0] || {};
  const cat = (k) => (j.categories[k] ? Math.round(j.categories[k].score * 100) : '-');
  const lcpEl = j.audits['largest-contentful-paint-element']?.details?.items?.[0]?.items?.[0]?.node?.nodeLabel || '';
  rows.push({
    file: path.basename(f), form: j.configSettings?.formFactor, method: j.configSettings?.throttlingMethod,
    perf: cat('performance'), a11y: cat('accessibility'), bp: cat('best-practices'), seo: cat('seo'),
    fcp: m.firstContentfulPaint, fcpObs: m.observedFirstContentfulPaint,
    lcp: m.largestContentfulPaint, lcpObs: m.observedLargestContentfulPaint,
    si: m.speedIndex, siObs: m.observedSpeedIndex, tbt: m.totalBlockingTime,
    cls: j.audits['cumulative-layout-shift']?.numericValue, lcpEl,
  });
}
if (!rows.length) { console.error('žiadna správa Lighthouse'); process.exit(1); }

console.log('súbor\tzariadenie\tvýkon\tpríst.\tpostupy\tSEO\tFCP sim/poz\tLCP sim/poz\tSI sim/poz\tTBT ms\tCLS\tprvok LCP');
for (const r of rows) {
  console.log([r.file, `${r.form} (${r.method})`, r.perf, r.a11y, r.bp, r.seo, `${s(r.fcp)}/${s(r.fcpObs)}`, `${s(r.lcp)}/${s(r.lcpObs)}`,
    `${s(r.si)}/${s(r.siObs)}`, Math.round(r.tbt ?? 0), (r.cls ?? 0).toFixed(3), r.lcpEl.slice(0, 40)].join('\t'));
}
const med = (a) => { const v = a.filter((x) => typeof x === 'number').sort((x, y) => x - y); return v.length ? v[Math.floor((v.length - 1) / 2)] : null; };
for (const form of [...new Set(rows.map((r) => r.form))]) {
  const g = rows.filter((r) => r.form === form);
  console.log(`\n${form}: ${g.length} behov, výkon ${g.map((r) => r.perf).join(' / ')}, medián ${med(g.map((r) => r.perf))}, ` +
    `najhorší ${Math.min(...g.map((r) => r.perf))}; medián LCP ${s(med(g.map((r) => r.lcp)))} s, TBT ${Math.round(med(g.map((r) => r.tbt)) ?? 0)} ms, ` +
    `CLS najviac ${Math.max(...g.map((r) => r.cls ?? 0)).toFixed(3)}`);
}
