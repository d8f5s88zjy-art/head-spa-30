# Úprava recepcia.js (oprava 3b): p. 3 – slovo celého názvu inej služby v otázke je tiež jej istá zhoda; víťaz vysvetlí aj slová svojho názvu
import sys
p = sys.argv[1]
s = open(p, encoding='utf8').read()
a = "    const X = b[0][2], Y = X._c && p.find((y) => y[2] !== X && y[2]._c && y[3] && ((X.pravidlo === 'spolu' && !sp) || ws.some((w) => silny(y[2], (k) => pred(w, k)) && !X._g.flat().some(([k]) => zhoda(w, k)))));\n"
b = ("    const X = b[0][2], nz = (y, w) => y._n.some((n) => q.includes(n) && n.split(' ').includes(w));\n"
     "    const Y = X._c && p.find((y) => y[2] !== X && y[2]._c && y[3] && ((X.pravidlo === 'spolu' && !sp) || ws.some((w) => (silny(y[2], (k) => pred(w, k)) || nz(y[2], w)) && !nz(X, w) && !X._g.flat().some(([k]) => zhoda(w, k)))));\n")
assert s.count(a) == 1
s = s.replace(a, b)
open(p, 'w', encoding='utf8').write(s)
print('ok')
