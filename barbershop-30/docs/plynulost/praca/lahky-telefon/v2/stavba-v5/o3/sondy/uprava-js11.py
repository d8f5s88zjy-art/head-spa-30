# Úprava recepcia.js (oprava 3b, váha): prahy priamo v kóde (0,55 a 0,1), document cez globalThis
import sys
p = sys.argv[1]
s = open(p, encoding='utf8').read()
R = [("const PRAH = 0.55, BLIZKO = 0.1, cen = ", "const cen = "),
     ("const d = typeof document === 'undefined' ? null : document;", "const d = globalThis.document;")]
for x, y in R:
    assert s.count(x) == 1, x
    s = s.replace(x, y)
assert s.count('PRAH') == 2 and s.count('BLIZKO') == 2, (s.count('PRAH'), s.count('BLIZKO'))
s = s.replace('PRAH', '0.55').replace('BLIZKO', '0.1')
open(p, 'w', encoding='utf8').write(s)
print('ok')
