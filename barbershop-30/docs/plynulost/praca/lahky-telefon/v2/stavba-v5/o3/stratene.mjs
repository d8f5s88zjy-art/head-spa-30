// slová z otázok, ktoré mali pri HEAD istú zhodu (1) s kmeňom a podľa pravidla 1 ju stratili
import { readFileSync } from 'node:fs';
const root = process.argv[2];
const norm = (s) => String(s).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
function dl(a, b) { if (a === b) return 0; if (Math.abs(a.length - b.length) > 1) return 2; let i = 0; while (i < a.length && a[i] === b[i]) i++; return a.slice(i + 1) === b.slice(i + 1) || a.slice(i + 1) === b.slice(i) || a.slice(i) === b.slice(i + 1) || (a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2)) ? 1 : 2; }
const stara = (w, k) => { if (k[0] === '=') return w === k.slice(1) ? 1 : 0; if (w === k || w.startsWith(k)) return 1; if (k.length > 3 && w.includes(k)) return 0.9; return 0; };
const nova = (w, k) => { if (k[0] === '=') return w === k.slice(1) ? 1 : 0; const e = w.length - k.length; if (k.length < 5) return e < 0 || e > 3 || !w.startsWith(k) ? 0 : e < (k.length > 3 ? 4 : 2) ? 1 : 0.6; if (w.startsWith(k)) return 1; if (w.includes(k)) return 0.9; return 0; };
const out = new Map();
for (const f of process.argv.slice(3)) for (const l of readFileSync(f, 'utf8').split('\n').filter(Boolean)) {
  const [j, q] = l.split('|');
  const kb = JSON.parse(readFileSync(`${root}/assets/recepcia/${j}.json`, 'utf8'));
  const stop = kb.stop.split(' ');
  const kmene = [...kb.polozky, ...kb.nevieme].flatMap((p) => p.kluc.split(/[\s|]+/).filter(Boolean).map((t) => [t.replace('!', '').toLowerCase(), p.id]));
  for (const w of norm(q).split(' ').filter((w) => w.length > 1 && !stop.includes(w))) {
    const s = kmene.filter(([k]) => stara(w, k) >= 0.9), n = kmene.filter(([k]) => nova(w, k) >= 0.9);
    const lost = s.filter(([k, id]) => !n.some(([k2, id2]) => id2 === id));
    if (lost.length) { const key = `${j} ${w}`; out.set(key, (out.get(key) || '') || lost.map(([k, id]) => `${id}:${k}${nova(w, k) ? '(0.6)' : ''}`).join(' ')); }
  }
}
for (const [k, v] of [...out].sort()) console.log(k, '←', v);
