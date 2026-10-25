# Úprava recepcia.js (oprava 3b): celý názov služby v otázke pridá aj bonus 0,5 ako variant otázky
import sys
p = sys.argv[1]
s = open(p, encoding='utf8').read()
R = [("  let sh = p._n.some((x) => q.includes(x));\n", "  const nm = p._n.some((x) => q.includes(x));\n  let sh = nm;\n"),
     ("  s += p._v.includes(q) ? 2 : p._v.some((v) => v.includes(' ') && q.includes(v)) ? 0.5 : 0;", "  s += p._v.includes(q) ? 2 : nm || p._v.some((v) => v.includes(' ') && q.includes(v)) ? 0.5 : 0;")]
for x, y in R:
    assert s.count(x) == 1, x
    s = s.replace(x, y)
open(p, 'w', encoding='utf8').write(s)
print('ok')
