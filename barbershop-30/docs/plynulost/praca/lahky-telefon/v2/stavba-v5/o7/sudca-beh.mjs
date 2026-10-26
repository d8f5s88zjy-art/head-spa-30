// Oprava 7: hodnotenie podľa kritéria (c) zásady P7 nad všetkými sadami a generátormi tried.
//   node sudca-beh.mjs <strom/barbershop-30> [priečinok so zachytenými otázkami generátorov] > výstup.txt
// Sudca: <strom>/source/tools/recepcia-sudca.mjs (nezávislý od modulu). Pri označených sadách aj použiteľnosť
// (priamo, jedným ťuknutím, odovzdanie navyše, odchýlka) – rovnaké triedy ako hodnotiteľ v2-1 (o6/zarad.py).
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
const ROOT = path.resolve(process.argv[2]), GEN = process.argv[3];
const S5 = path.dirname(path.dirname(new URL(import.meta.url).pathname));
const { odpovedz } = await import(path.join(ROOT, 'assets/recepcia.js'));
const { sudca, posud } = await import(path.join(ROOT, 'source/tools/recepcia-sudca.mjs'));
const J = ['sk', 'en', 'uk', 'hu', 'sr', 'pl', 'de', 'cs'];
const surove = (l) => JSON.parse(fs.readFileSync(path.join(ROOT, `assets/recepcia/${l}.json`), 'utf8'));
const KB = Object.fromEntries(J.map((l) => [l, surove(l)])), SU = Object.fromEntries(J.map((l) => [l, sudca(surove(l), l)]));
const CEN = Object.fromEntries(J.map((l) => [l, new Set(SU[l].cenove.map((p) => p.id))]));
const NELEG = new Set(['odovzdanie', 'bez-ceny']);
const riadky = [], P = (s) => riadky.push(s);
const popis = (l, r) => r.typ === 'cennik' ? `skupiny ${r.g.map((i) => KB[l].cennik[i][0]).join(' + ')}${r.hl.length ? ' ▶ ' + r.hl : ''}` : r.typ === 'vyber' ? `voľby [${r.p.map((x) => x.id)}]` : `${r.typ} ${r.id ?? ''}`;
/* použiteľnosť označenej otázky */
function pouzitelnost(l, r, oc, pr) {
  const ok = new Set([oc, ...(pr || [])]), leg = ![...ok].every((x) => NELEG.has(x));
  if (!leg) return r.typ === 'cennik' ? 'CENNIK-PRI-ODOVZDANI' : 'OK';
  const vol = String(oc).startsWith('volba:') ? oc.slice(6).split(',') : [];
  const S = SU[l], zobraz = r.typ === 'cennik' ? new Set(r.g) : new Set();
  const vSk = (id) => { const p = S.cenove.find((x) => x.id === id); return p && S.skupinyP.get(p).some((i) => zobraz.has(i)); };
  if (r.typ === 'cennik') {
    if ([...ok, ...vol].some(vSk) || ok.has('trvanie') || ok.has('ceny-konecne')) return 'OK-PRIAMO';
    return [...ok, ...vol].some((x) => CEN[l].has(x)) ? 'INA-SKUPINA' : 'ODCHYLKA';
  }
  if (r.typ === 'odpoved') return ok.has(r.id) ? 'OK-PRIAMO' : 'ODCHYLKA';
  if (r.typ === 'vyber') { const k = r.p.map((x) => x.id); if (ok.has('odovzdanie')) return 'OK'; return [...ok, ...vol].some((x) => k.slice(0, 2).includes(x)) || (ok.has('trvanie') && k.some((x) => CEN[l].has(x))) ? 'OK-VOLBA' : 'ODOVZDANIE-NAVYSE'; }
  if (r.typ === 'nevieme' && ok.has(r.id)) return 'OK-PRIAMO';
  return ok.has('odovzdanie') ? 'OK' : 'ODOVZDANIE-NAVYSE';
}
function zdroj(meno, otazky, oznacene) {
  const typ = {}, chyby = {}, prik = [], pou = {};
  let n = 0, ms = 0;
  for (const o of otazky) {
    const { l, q } = o;
    if (!KB[l]) continue;
    n++;
    const t0 = performance.now(), r = odpovedz(q, KB[l]); ms = Math.max(ms, performance.now() - t0);
    typ[r.typ] = (typ[r.typ] || 0) + 1;
    const c = posud(SU[l], q, r, { ocak: o.ocak, prijatelne: o.pr });
    for (const x of c) { const k = x.slice(0, 2); chyby[k] = (chyby[k] || 0) + 1; }
    if (c.length && prik.length < 40) prik.push(`    ${l} „${q}“ → ${popis(l, r)} | ${c.join('; ')}`);
    if (oznacene) { const u = pouzitelnost(l, r, o.ocak, o.pr); pou[u] = (pou[u] || 0) + 1; if (u === 'CENNIK-PRI-ODOVZDANI' && prik.length < 40) prik.push(`    (použiteľnosť) ${l} „${q}“ → ${popis(l, r)} | očakávané ${o.ocak}`); }
  }
  const spolu = Object.values(chyby).reduce((a, b) => a + b, 0);
  P(`${meno}: otázok ${n}, CHYBY (c) ${spolu} ${JSON.stringify(chyby)} | typy ${JSON.stringify(typ)}${oznacene ? ' | použiteľnosť ' + JSON.stringify(pou) : ''}`);
  prik.forEach((x) => P(x));
  return { n, spolu, pou };
}
const citajTxt = (f) => fs.readFileSync(path.join(S5, f), 'utf8').split('\n').filter((x) => x && !x.startsWith('#')).map((x) => { const [l, q] = x.includes('|') ? x.split('|') : ['sk', x]; return { l, q }; });
let celkom = 0, celkomN = 0;
const pripocitaj = (x) => { celkom += x.spolu; celkomN += x.n; return x; };
P(`# sudca (c) nad ${ROOT}, ${new Date().toISOString()}`);
P('\n## Slepé sady (označené)');
const leg = { n: 0, navyse: 0 };
for (const s of ['A', 'B', 'C2', 'D1', 'D2', 'E2']) {
  const o = fs.readFileSync(path.join(S5, `slepe/sada-${s}.jsonl`), 'utf8').split('\n').filter(Boolean).map((x) => JSON.parse(x)).map((x) => ({ l: x.jazyk, q: x.otazka, ocak: x.ocakavane, pr: [].concat(x.prijatelne || []).flatMap((y) => String(y).split(',')).filter(Boolean) }));
  const x = pripocitaj(zdroj(`sada-${s}`, o, true));
  const L = o.filter((y) => ![y.ocak, ...y.pr].every((z) => NELEG.has(z))).length;
  leg.n += L; leg.navyse += (x.pou['ODOVZDANIE-NAVYSE'] || 0);
}
P(`  legitímnych otázok ${leg.n}, odovzdanie navyše ${leg.navyse} (${(100 * leg.navyse / leg.n).toFixed(2)} %)`);
P('\n## Skeptik 2 (označené otázky)');
for (const f of ['skeptik2/otazky-v5-2.txt', 'skeptik2/otazky-v5-2b.txt']) {
  const o = fs.readFileSync(path.join(S5, f), 'utf8').split('\n').filter(Boolean).map((x) => { const [l, q, oc] = x.split('|'); const [k, id] = oc.split(':'); return { l, q, ocak: k === 'nevieme' ? 'odovzdanie' : id || null }; });
  pripocitaj(zdroj(f, o, false));
}
P('\n## Zoznamy otázok kontrol a skeptika (bez označenia)');
for (const f of ['k4/sondy-k4.txt', 'k4/sondy-k4b.txt', 'k4/sondy-k4c.txt', 'k5/sonda.txt', 'k5/sondy-k5.txt', 'k5/sondy-k5b.txt', 'skeptik/otazky.txt', 'skeptik/otazky2.txt', 'o7/sondy-p7.txt']) pripocitaj(zdroj(f, citajTxt(f), false));
if (GEN) {
  P('\n## Generátory tried (otázky zachytené obalom modulu, o7/generatory.sh)');
  const k5 = fs.readFileSync(path.join(S5, 'o7/k5kopia/trieda-k5.mjs'), 'utf8').split('\n');
  const trieda = (r) => { for (let i = r - 1; i >= 0; i--) { const m = /---------- (K\d)/.exec(k5[i]); if (m) return m[1]; } return 'K?'; };
  for (const f of fs.readdirSync(GEN).filter((x) => x.endsWith('.jsonl.gz')).sort()) {
    const o = zlib.gunzipSync(fs.readFileSync(path.join(GEN, f))).toString('utf8').split('\n').filter(Boolean).map((x) => JSON.parse(x));
    if (f.startsWith('k5-trieda')) {
      const t = {};
      for (const x of o) (t[trieda(x.r)] ||= []).push(x);
      for (const [k, v] of Object.entries(t).sort()) pripocitaj(zdroj(`${f} ${k}`, v, false));
    } else pripocitaj(zdroj(f, o, false));
  }
}
P(`\nSPOLU: otázok ${celkomN}, chýb podľa (c) ${celkom}`);
process.stdout.write(riadky.join('\n') + '\n');
