#!/usr/bin/env python3
"""Oprava 4: zostaví krok A|B|C|D v strome hs-recepcia zo stavu f715141 (o4/base) a zapíše súbory.
   python3 -I kroky.py <A|B|C|D>   (potom jazyky-gen.py a test)"""
import re, sys
from pathlib import Path
O4 = Path(__file__).parent
S5 = O4.parent
T = S5.parents[3] / 'hs-recepcia' / 'barbershop-30'
K = sys.argv[1]
KROKY = 'ABCD'[: 'ABCD'.index(K) + 1]

def rep(s, a, b):
    assert s.count(a) == 1, (K, a[:80], s.count(a))
    return s.replace(a, b)

# ---------- recepcia.js ----------
js = (O4 / 'base/recepcia.js').read_text('utf8')
js = re.sub(r'^ *\/\*.*\*\/\n', '', js, flags=re.M)  # A: komentáre preč (váha), pravidlá opisuje test
if 'B' in KROKY:
    js = rep(js, "  [...kb.polozky, ...kb.nevieme].forEach((p) => {", "  (kb._a = [...kb.polozky, ...kb.nevieme]).forEach((p) => {")
    js = rep(js, "  const q = norm(String(otazka).slice(0, 200)), w0 = q.split(' ').filter((w) => w.length > 1 && !kb._stop.includes(w)),",
        "  const q = norm(String(otazka).slice(0, 200)), st = (w) => kb._stop.includes(w),\n"
        "    w0 = q.split(' ').flatMap((w) => {\n"
        "      const j = Math.max(0, ...kb._k.filter((k) => dlhy(k) && w.startsWith(k)).map((k) => k.length)), i = j && w.length - j > 7 ? j : Math.min(...kb._k.filter(dlhy).map((k) => w.indexOf(k)).filter((i) => i > 2)), p = [w.slice(0, i), w.slice(i)], r = p[0].replace(/^ne/, '');\n"
        "      return i < 1e3 && r.length > 2 && !st(r) && !kb._k.some((k) => k.length > i && pred(w, k)) && !kb._a.some((P) => p.every((x) => P._n.join().includes(x) || P._g.flat().some(([k]) => ista(x, k) || (k.length > 3 && x.includes(k))))) ? p : [w];\n"
        "    }).filter((w) => w.length > 1 && !st(w)),")
if 'C' in KROKY:
    js = rep(js, "  const nm = p._n.some((x) => q.includes(x));\n  let sh = nm || p._v.includes(q);", "  const ex = p._n.some((x) => q.includes(x)) || p._v.includes(q);\n  let sh = ex;")
    js = rep(js, "s += p._v.includes(q) ? 9 : nm || p._v", "s += p._v.includes(q) ? 9 : ex || p._v")
    js = rep(js, "  return [s / ws.length, kr.size + (n > 1 && h1.size === n), p, sh];", "  return [s / ws.length, kr.size + (n > 1 && h1.size === n), p, sh, ex || hit.size === n];")
    js = rep(js, "return Z || (X._c && !b[0][3]) ? vyber", "return Z || (X._c && !(b[0][3] && b[0][4])) ? vyber")
if 'D' in KROKY:
    js = rep(js, "const q = norm(String(otazka).slice(0, 200)),", "const q = norm(String(otazka).slice(0, 200).replace(/\\d+:\\d+|(^|\\D)\\d\\s?(cm|см)/gi, '$1')),")
(T / 'assets/recepcia.js').write_text(js, 'utf8')
# ---------- recepcia.css (A: bez komentára) ----------
css = (O4 / 'base/recepcia.css').read_text('utf8')
(T / 'assets/recepcia.css').write_text(re.sub(r'^\/\*.*\*\/\n', '', css, flags=re.M), 'utf8')
# ---------- sk.json ----------
sk = (O4 / 'base/sk.json').read_text('utf8')
if 'B' in KROKY:
    sk = rep(sk, ' raz asi iba aby mne"', ' raz asi iba aby mne roz"')
if 'D' in KROKY:
    sk = rep(sk, '"kluc": ">10! Tinedz Pubert | rok rokov rocn Tinedz Pubert syn chlapec chlapc det diet"',
             '"kluc": ">10! Tinedz Pubert | rok rokov rocn Tinedz Pubert syn synov chlapec chlapc det detsk diet junior"')
(T / 'assets/recepcia/sk.json').write_text(sk, 'utf8')
# ---------- jazyky_data.py ----------
d = (O4 / 'base/jazyky_data.py').read_text('utf8')
if 'B' in KROKY:
    for a, b in [("'Kind Kinder Junge Sohn Junior gentlem klein jahr =10 fade schneid haarschnitt =haar =haare'", "'Kind Kinder Junge Sohn Junior gentlem klein jahr =10 fade schneid schnitt haarschnitt =haar =haare'"),
                 ("'wachs Waxing Ohr Ohren Nase Nasen =haar =haare'", "'wachs Waxing Ohr Ohren Nase Nasen entfern =haar =haare'"),
                 ("'Rasur Rasier Towel Glatt rasiermesser messer =hot'", "'Rasur Rasier Nassrasur Towel Glatt rasiermesser messer =hot'"),
                 ("raz asi aby nad pod\",\n", "raz asi aby nad pod pře roz\",\n"),
                 ("ten raz nad pod był niż\",", "ten raz nad pod był niż prze roz\","),
                 ("moj ide nad pod\",", "moj ide nad pod pre raz\","),
                 ("моя нас над під він\",", "моя нас над під він пере роз\",")]:
        d = rep(d, a, b)
if 'D' in KROKY:
    for a, b in [("son boy kid child'", "son boy kid child little junior'"),
                 ("Pubert sohn junge kind'", "Pubert sohn junge kind junior'"),
                 ("syn kluk chlapec chlapc dět'", "syn kluk chlapec chlapc dět děti dětsk junior'"),
                 ("chłopiec chłopc chlopiec chlopc dziec'", "chłopiec chłopc chlopiec chlopc dziec junior'"),
                 ("Kamasz fiam fiú gyerek'", "Kamasz fiam fiú kisfiú gyerek junior'"),
                 ("Pubert sin dečak dete deca'", "Pubert sin dečak dete deca dec decu dečij junior'"),
                 ("син сина синові хлопч дит'", "син сина синові хлопч дит діт дітей дитяч дитин маленьк junior'")]:
        d = rep(d, a, b)
(S5 / 'jazyky_data.py').write_text(d, 'utf8')
# ---------- test ----------
t = (O4 / 'base/recepcia-test.mjs').read_text('utf8')
fin = (O4 / 'final/recepcia-test.mjs').read_text('utf8')
t = rep(t, "//  6.–14. triedy podľa pravidiel zhody (p. 1–7 v komentároch recepcia.js); otázky sa skladajú z dát a šablón,\n//     nie z nálezov kontroly:",
        "//  6.–{n}. triedy podľa pravidiel zhody p. 1–{p} (modul nemá komentáre kvôli váhe; pravidlá opisuje tento súbor);\n//     otázky sa skladajú z dát a šablón, nie z nálezov kontroly:".format(n=14 + len(KROKY) - 1, p=7 + len(KROKY) - 1))
hl = fin[fin.index('//     p. 8 '):fin.index('//  Modul nič neposiela')]
casti = {'B': hl[:hl.index('//     p. 9 ')], 'C': hl[hl.index('//     p. 9 '):hl.index('//     p. 10 ')], 'D': hl[hl.index('//     p. 10 '):]}
bez = fin[fin.index('//  Modul nič neposiela'):fin.index('import fs from')]
kotva = "//          stránke) alebo s celým názvom služby; súčasť balíka, nástroj či prenesené slovo je slabý kmeň (test 14)\n"
t = rep(t, kotva, kotva + ''.join(casti[x] for x in KROKY if x != 'A') + bez)
testy = {'B': fin[fin.index('/* p. 8: zložené slovo'):fin.index('/* p. 9: služba s cenou')],
         'C': fin[fin.index('/* p. 9: služba s cenou'):fin.index('/* p. 4 a p. 10:')],
         'D': fin[fin.index('/* p. 4 a p. 10:'):]}
for x in KROKY:
    if x != 'A':
        t = t.rstrip('\n') + '\n\n' + testy[x].rstrip('\n') + '\n'
(T / 'source/tools/recepcia-test.mjs').write_text(t, 'utf8')
print('krok', K, 'zapísaný')
