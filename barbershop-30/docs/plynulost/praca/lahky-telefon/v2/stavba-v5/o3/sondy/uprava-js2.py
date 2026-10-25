# Úprava recepcia.js (oprava 3b, váha): prahy ako konštanty, cenové slovo jednou funkciou, kratšie komentáre
import sys
p = sys.argv[1]
s = open(p, encoding='utf8').read()
R = [
 ("/* Recepcia: nič sa neposiela ani neukladá; pravidlá zhody 1–6 overuje source/tools/recepcia-test.mjs */",
  "/* Recepcia: nič sa neposiela ani neukladá; pravidlá zhody 1–7 opisuje a overuje source/tools/recepcia-test.mjs */"),
 ("const ista = (w, k) => zhoda(w, k) > 0.89,", "const PRAH = 0.55, BLIZKO = 0.1, cen = (kb, w) => kb._cen.some((c) => w.startsWith(c)), ista = (w, k) => zhoda(w, k) > 0.89,"),
 ("/* [skóre, špecifickosť (p. 3), položka, istá zhoda so silným kmeňom] */", "/* [skóre, špecifickosť (p. 3), položka, silný kmeň (p. 7)] */"),
 ("if (m[i] < 1 && kb._cen.some((c) => w.startsWith(c))) s += 1 - m[i];", "if (m[i] < 1 && cen(kb, w)) s += 1 - m[i];"),
 ("  const t = kb.prah, top = (l) =>", "  const top = (l) =>"),
 ("n[0][0] >= t.nevieme && n[0][0] >= (p[0] ? p[0][0] : 0) - t.blizko)", "n[0][0] >= PRAH && n[0][0] >= (p[0] ? p[0][0] : 0) - BLIZKO)"),
 ("p.filter((x) => x[0] >= t.odpoved)", "p.filter((x) => x[0] >= PRAH)"),
 ("    /* p. 3, 7: slovo inej služby, ktoré víťaz nevysvetlí, spojená služba bez spojky, cena bez silného kmeňa → Myslíš toto? */\n", "    /* p. 3 a 7 */\n"),
 ("b[0][0] - b[1][0] < t.blizko ? b[1] : Y;", "b[0][0] - b[1][0] < BLIZKO ? b[1] : Y;"),
 ("  if (c && ws.some((w) => kb._cen.some((k) => w.startsWith(k)))) {", "  if (c && ws.some((w) => cen(kb, w))) {"),
 (", cen = (w) => kb._cen.some((c) => w.startsWith(c)), sp =", ", ce = (w) => cen(kb, w), sp ="),
 ("const ws = w0.filter((w) => zn(w) || cen(w) ||", "const ws = w0.filter((w) => zn(w) || ce(w) ||"),
 ("!/^\\d+$/.test(w) && !cen(w) && !zn(w));", "!/^\\d+$/.test(w) && !ce(w) && !zn(w));"),
 ("const wt = ws.filter((w) => !cen(w) &&", "const wt = ws.filter((w) => !ce(w) &&"),
]
for a, b in R:
    assert s.count(a) == 1, a
    s = s.replace(a, b)
import re; assert not re.search(r'kb\.prah|\bt\.(nevieme|odpoved|blizko)', s), 'zvyšok prahu'
open(p, 'w', encoding='utf8').write(s)
print('ok')
