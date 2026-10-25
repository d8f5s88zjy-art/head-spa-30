# Úprava recepcia.js (oprava 3b): p. 3 – svedok inej služby: slovo s jej silným kmeňom alebo jej celý názov v otázke,
# ktorý víťaz nevysvetlí; spojená služba so spojkou vysvetlí názvy svojich častí
import sys
p = sys.argv[1]
s = open(p, encoding='utf8').read()
a = s.index("    const X = b[0][2], kn = "); b = s.index("    const Z = b[1]", a)
s = s[:a] + ("    const X = b[0][2], S = X.pravidlo === 'spolu', kn = (y) => y._n.filter((n) => q.includes(n)), xs = kn(X).join(' '), ex = (w) => w.length < 2 || xs.split(' ').includes(w) || X._g.flat().some(([k]) => pred(w, k));\n"
             "    const Y = X._c && p.find(([, , y, sh]) => y !== X && y._c && sh && ((S && !sp) || ws.some((w) => silny(y, (k) => pred(w, k)) && !ex(w)) || kn(y).some((n) => !xs.includes(n) && !(S && n.split(' ').every(ex)))));\n") + s[b:]
open(p, 'w', encoding='utf8').write(s)
print('ok')
