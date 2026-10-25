# Úprava recepcia.js (oprava 3b): python3 -I uprava-js.py <recepcia.js>
import sys
p = sys.argv[1]
s = open(p, encoding='utf8').read()
R = [
 ("  if (k[0] === '=') return +(w === k.slice(1));\n",
  "  if (k[0] === '=') return +(w === k.slice(1));\n  if (k[0] === '>') return +(+w > +k.slice(1));\n"),
 ("/* [skóre, špecifickosť (p. 3), položka] */", "/* [skóre, špecifickosť (p. 3), položka, istá zhoda so silným kmeňom] */"),
 ("  return [s / ws.length, kr.size + (n > 1 && h1.size === n), p];",
  "  return [s / ws.length, kr.size + (n > 1 && h1.size === n), p, m.includes(2)];"),
 ("  [kb._stop, kb._cen, kb._vyp, kb._zdv] = [kb.stop, kb.cenove, kb.vypln, kb.zdvor].map(",
  "  [kb._stop, kb._cen, kb._vyp, kb._zdv, kb._sp] = [kb.stop, kb.cenove, kb.vypln, kb.zdvor, kb.spoj].map("),
 ("function rozhodni(ws, q, kb, pol) {", "function rozhodni(ws, q, kb, pol, sp) {"),
 ("  if (b[0]) return b[1] && b[0][0] - b[1][0] < t.blizko ? vyber(b.slice(0, 2)) : R('odpoved', b[0]);\n",
  "  if (b[0]) {\n"
  "    /* p. 3: slovo inej služby, ktoré víťaz nevysvetlí, alebo spojená služba bez spojky = obe; p. 7: cena len pri istej zhode so silným kmeňom */\n"
  "    const X = b[0][2], S = X.pravidlo === 'spolu' && !sp, ma = (y, w, s) => y._g.some((g) => g.some(([k, st]) => (st || !s) && zhoda(w, k) >= (s || 0.5)));\n"
  "    const Y = X._c && p.find((y) => y[2] !== X && y[2]._c && y[3] && (S || ws.some((w) => ma(y[2], w, 1) && !ma(X, w))));\n"
  "    return b[1] && b[0][0] - b[1][0] < t.blizko ? vyber(b.slice(0, 2)) : Y ? vyber(S ? [Y, b[0]] : [b[0], Y]) : X._c && !b[0][3] ? vyber([b[0]]) : R('odpoved', b[0]);\n"
  "  }\n"),
 ("cen = (w) => kb._cen.some((c) => w.startsWith(c));\n",
  "cen = (w) => kb._cen.some((c) => w.startsWith(c)), sp = /[+&]/.test(otazka) || q.split(' ').some((w) => kb._sp.includes(w));\n"),
 ("    const r = rozhodni(ws, q, kb, kb.polozky);\n", "    const r = rozhodni(ws, q, kb, kb.polozky, sp);\n"),
 ("rozhodni(wt, q, kb, kb.polozky.filter((p) => p !== T))", "rozhodni(wt, q, kb, kb.polozky.filter((p) => p !== T), sp)"),
 ("  const nez = ws.filter((w) => w.length > 3 && ", "  const nez = ws.filter((w) => w.length > 2 && "),
]
for a, b in R:
    assert s.count(a) == 1, a
    s = s.replace(a, b)
open(p, 'w', encoding='utf8').write(s)
print('ok')
