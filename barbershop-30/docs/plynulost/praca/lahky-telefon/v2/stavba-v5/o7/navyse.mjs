// Oprava 7: výpis legitímnych otázok slepých sád, ktoré skončia odovzdaním navyše (pre ladenie použiteľnosti)
import fs from 'node:fs'; import path from 'node:path';
const ROOT = path.resolve(process.argv[2]); const S5 = path.dirname(path.dirname(new URL(import.meta.url).pathname));
const { odpovedz } = await import(path.join(ROOT, 'assets/recepcia.js'));
const KB = {}; const NELEG = new Set(['odovzdanie', 'bez-ceny']);
for (const s of ['A', 'B', 'C2', 'D1', 'D2', 'E2']) for (const x of fs.readFileSync(path.join(S5, `slepe/sada-${s}.jsonl`), 'utf8').split('\n').filter(Boolean).map((y) => JSON.parse(y))) {
  const l = x.jazyk, ok = new Set([x.ocakavane, ...[].concat(x.prijatelne || []).flatMap((y) => String(y).split(','))]);
  if ([...ok].every((y) => NELEG.has(y))) continue;
  const kb = (KB[l] ||= JSON.parse(fs.readFileSync(path.join(ROOT, `assets/recepcia/${l}.json`), 'utf8')));
  const r = odpovedz(x.otazka, kb), vol = String(x.ocakavane).startsWith('volba:') ? x.ocakavane.slice(6).split(',') : [];
  const ids = r.typ === 'vyber' ? r.p.map((p) => p.id) : [];
  const zle = r.typ === 'nevieme' ? !ok.has(r.id) : r.typ === 'fallback' || r.typ === 'zdvorilost' || (r.typ === 'vyber' && ![...ok, ...vol].some((y) => ids.slice(0, 2).includes(y)) && !(ok.has('trvanie')));
  if (zle) console.log(`${s} ${l} „${x.otazka}“ → ${r.typ} ${r.id ?? ''} ${ids.join(',')} | čakané ${x.ocakavane}`);
}
