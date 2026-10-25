# Úprava recepcia.js (oprava 3b, váha): kratšia hlavička, pred() pri slove času
import sys
p = sys.argv[1]
s = open(p, encoding='utf8').read()
R = [("/* Recepcia: nič sa neposiela ani neukladá; pravidlá zhody 1–7 opisuje a overuje source/tools/recepcia-test.mjs */",
      "/* Recepcia: nič sa neposiela ani neukladá; pravidlá zhody p. 1–7 opisuje source/tools/recepcia-test.mjs */"),
     ("tr = T && T._g[0].some(([k, st]) => st && ws.some((w) => zhoda(w, k) === 1));", "tr = T && T._g[0].some(([k, st]) => st && ws.some((w) => pred(w, k)));")]
for x, y in R:
    assert s.count(x) == 1, x
    s = s.replace(x, y)
open(p, 'w', encoding='utf8').write(s)
print('ok')
