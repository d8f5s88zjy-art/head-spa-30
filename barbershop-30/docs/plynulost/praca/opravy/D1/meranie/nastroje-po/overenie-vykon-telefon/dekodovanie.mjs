// T6: dekódovanie obrázkov v stope (všetky vlákna renderera): počet, čas (stena/vlákno), typ, vlákno; medzery medzi snímkami
// node dekodovanie.mjs stopa.json
import fs from 'node:fs';
const evs = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')).traceEvents;
const tname = new Map(evs.filter((e) => e.name === 'thread_name').map((e) => [e.pid + ':' + e.tid, e.args.name]));
const main = evs.find((e) => e.name === 'thread_name' && e.args.name === 'CrRendererMain');
const R = evs.filter((e) => e.pid === main.pid && e.ph === 'X' && e.dur != null);
const dec = R.filter((e) => /Decode/i.test(e.name));
const by = {};
for (const e of dec) { const k = e.name + ' @' + (tname.get(e.pid + ':' + e.tid) || e.tid); (by[k] || (by[k] = [])).push(e); }
for (const [k, a] of Object.entries(by)) {
  const d = a.map((e) => e.dur / 1000).sort((x, y) => x - y), t = a.map((e) => (e.tdur ?? e.dur) / 1000);
  const types = {}; for (const e of a) { const ty = e.args?.imageType || e.args?.data?.imageType || ''; types[ty] = (types[ty] || 0) + 1; }
  console.log(k.padEnd(60), 'n', a.length, 'stena p50', d[d.length >> 1].toFixed(1), 'max', d.at(-1).toFixed(1), 'priem', (d.reduce((x, y) => x + y, 0) / d.length).toFixed(1), 'vlákno priem', (t.reduce((x, y) => x + y, 0) / t.length).toFixed(1), JSON.stringify(types));
}
