# Úprava recepcia.js (oprava 3b): istá zhoda so silným kmeňom aj „vnútri“ zloženého slova (0,9)
import sys
p = sys.argv[1]
s = open(p, encoding='utf8').read()
R = [("  const hit = new Set(), h1 = new Set(), kr = new Set(), n = p._g.length;\n", "  const hit = new Set(), h1 = new Set(), kr = new Set(), n = p._g.length;\n  let sh = 0;\n"),
     ("if (z > 0.89) hit.add(gi);", "if (z > 0.89) { hit.add(gi); sh |= st; }"),
     ("  return [s / ws.length, kr.size + (n > 1 && h1.size === n), p, m.includes(2)];", "  return [s / ws.length, kr.size + (n > 1 && h1.size === n), p, sh];")]
for x, y in R:
    assert s.count(x) == 1, x
    s = s.replace(x, y)
open(p, 'w', encoding='utf8').write(s)
print('ok')
