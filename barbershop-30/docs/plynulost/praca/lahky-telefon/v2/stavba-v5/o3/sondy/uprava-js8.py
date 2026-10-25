# Úprava recepcia.js (oprava 3b): p. 3 – iná služba je v otázke, ak je v nej jej celý názov (nie ako časť názvu víťaza)
# alebo slovo s jej silným kmeňom, ktoré víťaz nevysvetlí žiadnym svojím kmeňom ani slovom svojho názvu
import sys
p = sys.argv[1]
s = open(p, encoding='utf8').read()
a = s.index("    const X = b[0][2], nz = "); b = s.index("    const Z = b[1]", a)
s = s[:a] + ("    const X = b[0][2], kn = (y) => y._n.filter((n) => q.includes(n)), xn = kn(X).join(' ');\n"
             "    const Y = X._c && p.find(([, , y, sh]) => y !== X && y._c && sh && ((X.pravidlo === 'spolu' && !sp) || kn(y).some((n) => !xn.includes(n))\n"
             "      || ws.some((w) => silny(y, (k) => pred(w, k)) && !X._g.flat().some(([k]) => pred(w, k)) && !xn.split(' ').includes(w))));\n") + s[b:]
open(p, 'w', encoding='utf8').write(s)
print('ok')
