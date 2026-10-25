# Úprava recepcia.js (oprava 3b): celý názov služby z cenníka v otázke je istá zhoda so silným kmeňom (p. 7)
import sys
p = sys.argv[1]
s = open(p, encoding='utf8').read()
R = [("    p._v = p.otazky.map(norm);\n", "    p._v = p.otazky.map(norm); p._n = (p.odpoved || []).filter(Array.isArray).map((x) => norm(x[0]));\n"),
     ("  let sh = 0;\n", "  let sh = p._n.some((x) => q.includes(x));\n")]
for x, y in R:
    assert s.count(x) == 1, x
    s = s.replace(x, y)
open(p, 'w', encoding='utf8').write(s)
print('ok')
