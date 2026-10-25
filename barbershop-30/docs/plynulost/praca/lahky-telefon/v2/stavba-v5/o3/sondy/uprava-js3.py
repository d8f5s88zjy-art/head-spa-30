# Úprava recepcia.js (oprava 3b, váha): Damerau-Levenshtein ≤ 1 ako áno/nie, zdvorilosť cez F
import sys
p = sys.argv[1]
s = open(p, encoding='utf8').read()
a = s.index('function dl(a, b) {'); b = s.index('}\n', s.index('? 1 : 2;', a)) + 2
s = s[:a] + ("/* Damerau-Levenshtein ≤ 1: rovnaké, alebo jedno písmeno vynechané, pridané, iné, prehodené */\n"
             "function dl(a, b) {\n  let i = 0;\n  while (a[i] && a[i] === b[i]) i++;\n"
             "  return a.slice(i + 1) === b.slice(i + 1) || a.slice(i + 1) === b.slice(i) || a.slice(i) === b.slice(i + 1) || (a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2));\n}\n") + s[b:]
R = [("[-1, 0, 1].some((n) => dl(w.slice(0, k.length + n), k) < 2)", "[-1, 0, 1].some((n) => dl(w.slice(0, k.length + n), k))"),
     ("return { typ: 'zdvorilost', id: null, skore: 0 };", "return { ...F(0), typ: 'zdvorilost' };")]
for x, y in R:
    assert s.count(x) == 1, x
    s = s.replace(x, y)
open(p, 'w', encoding='utf8').write(s)
print('ok')
