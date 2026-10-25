// Oprava 7: obal modulu recepcia.js pre generátory tried – odpovedá skutočný modul, každá otázka sa zapíše
// (jazyk, otázka, súbor a riadok generátora z volania) do $ZACHYT (jsonl.gz). Použitie cez o7/generatory.sh.
import { gzipSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
const M = await import(process.env.RECEPCIA_MODUL);
const out = [];
export const norm = M.norm, zhoda = M.zhoda, zahrej = M.zahrej;
export const vyrez = () => null; // starý výrez (P3) už nie je – cena je celá skupina cenníka (P7)
export function odpovedz(q, kb) {
  const st = (new Error().stack || '').split('\n').filter((x) => /stavba-v5\/(k4|k5|skeptik|skeptik2|o7\/k5kopia)\//.test(x) && !x.includes('zachyt'));
  const m = /\/([^/]+\.mjs):(\d+)/.exec(st[st.length - 1] || '') || [];
  out.push(JSON.stringify({ l: kb.jazyk, q, f: m[1] || '?', r: +m[2] || 0 }));
  return M.odpovedz(q, kb);
}
process.on('exit', () => writeFileSync(process.env.ZACHYT, gzipSync(out.join('\n') + '\n')));
