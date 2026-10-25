# Úprava recepcia.js (oprava 3b, váha): kratšie zápisy bez zmeny správania
import sys
p = sys.argv[1]
s = open(p, encoding='utf8').read()
R = [("/* 1 istá, 0,9 vnútri, 0,6 neistá (aj preklep DL ≤ 1), 0,5 podobná (p. 1) */", "/* 1 istá, 0,9 vnútri, 0,6 neistá, 0,5 podobná (p. 1) */"),
     ("const p = r.typ === 'odpoved' && r.p.cas && r.p, a = p && p.odpoved.filter(Array.isArray);", "const p = r.typ === 'odpoved' && r.p.cas && r.p;"),
     ("odpoved: a.map((y, i) => [y[0], p.cas[i]])", "odpoved: p.odpoved.filter(Array.isArray).map((y, i) => [y[0], p.cas[i]])"),
     ("const L = lang !== 'sk' && (p.akcie || []).includes('rezervacia') && window.B30_LANG && window.B30_LANG.langs.find((l) => l.code === lang);",
      "const L = lang !== 'sk' && p.akcie?.includes('rezervacia') && window.B30_LANG?.langs.find((l) => l.code === lang);")]
for x, y in R:
    assert s.count(x) == 1, x
    s = s.replace(x, y)
open(p, 'w', encoding='utf8').write(s)
print('ok')
