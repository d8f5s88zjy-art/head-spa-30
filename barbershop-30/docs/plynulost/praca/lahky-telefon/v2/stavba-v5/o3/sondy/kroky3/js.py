#!/usr/bin/env python3
"""Oprava 3b po krokoch – recepcia.js: python3 -I js.py <krok 7|8|9> <recepcia.js zo stavu 366c21f> <výstup>
7 váha a rýchlosť bez zmeny správania, 8 p. 7 a p. 3 (silný kmeň alebo celý názov, dve služby, spojka),
9 p. 4 a p. 2 (vek nad 10 ako trieda, neznáme slovo od 3 znakov)."""
import sys
krok, src, out = int(sys.argv[1]), sys.argv[2], sys.argv[3]
s = open(src, encoding='utf8').read()
def r(a, b):
    global s
    assert s.count(a) == 1, a[:100]
    s = s.replace(a, b)
# ---- 7: váha a rýchlosť (rovnaké odpovede) ----
r("  if (a === b) return 0;\n  if (Math.abs(a.length - b.length) > 1) return 2;\n", "")
r("  while (i < a.length && a[i] === b[i]) i++;\n  return a.slice(i + 1) === b.slice(i + 1) || a.slice(i + 1) === b.slice(i) || a.slice(i) === b.slice(i + 1) || (a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2)) ? 1 : 2;",
  "  while (a[i] && a[i] === b[i]) i++;\n  return a.slice(i + 1) === b.slice(i + 1) || a.slice(i + 1) === b.slice(i) || a.slice(i) === b.slice(i + 1) || (a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2));")
r("  let n = 0;\n  for (const x of A)", "  let n = 0;\n  if (10 * Math.min(A.length, B.length) < 3 * l) return 0;\n  for (const x of A)")
r("[-1, 0, 1].some((n) => dl(w.slice(0, k.length + n), k) < 2)", "[-1, 0, 1].some((n) => dl(w.slice(0, k.length + n), k))")
r("const ista = (w, k) => zhoda(w, k) > 0.89, zo = (l, f = ista) => (w) => l.some((k) => f(w, k)), pred = (w, k) => zhoda(w, k) === 1;",
  "const dlhy = (k) => k.length > 4 && !'=>'.includes(k[0]), ista = (w, k) => (dlhy(k) ? w.includes(k) : zhoda(w, k) > 0.89), pred = (w, k) => (dlhy(k) ? w.startsWith(k) : zhoda(w, k) === 1);\nconst cen = (kb, w) => kb._cen.some((c) => w.startsWith(c)), zo = (l, f = ista) => (w) => l.some((k) => f(w, k));")
r("if (m[i] < 1 && kb._cen.some((c) => w.startsWith(c))) s += 1 - m[i];", "if (m[i] < 1 && cen(kb, w)) s += 1 - m[i];")
r("  const t = kb.prah, top = (l) =>", "  const top = (l) =>")
r("n[0][0] >= t.nevieme && n[0][0] >= (p[0] ? p[0][0] : 0) - t.blizko)", "n[0][0] >= 0.55 && n[0][0] >= (p[0] ? p[0][0] : 0) - 0.1)")
r("p.filter((x) => x[0] >= t.odpoved)", "p.filter((x) => x[0] >= 0.55)")
r("b[0][0] - b[1][0] < t.blizko ? vyber(b.slice(0, 2))", "b[0][0] - b[1][0] < 0.1 ? vyber(b.slice(0, 2))")
r("  if (c && ws.some((w) => kb._cen.some((k) => w.startsWith(k)))) {", "  if (c && ws.some((w) => cen(kb, w))) {")
r(", cen = (w) => kb._cen.some((c) => w.startsWith(c));\n", ", ce = (w) => cen(kb, w);\n")
r("return { typ: 'zdvorilost', id: null, skore: 0 };", "return { ...F(0), typ: 'zdvorilost' };")
r("const ws = w0.filter((w) => zn(w) || cen(w) ||", "const ws = w0.filter((w) => zn(w) || ce(w) ||")
r("!/^\\d+$/.test(w) && !cen(w) && !zn(w));", "!/^\\d+$/.test(w) && !ce(w) && !zn(w));")
r("tr = T && T._g[0].some(([k, st]) => st && ws.some((w) => zhoda(w, k) === 1));", "tr = T && T._g[0].some(([k, st]) => st && ws.some((w) => pred(w, k)));")
r("const wt = ws.filter((w) => !cen(w) &&", "const wt = ws.filter((w) => !ce(w) &&")
r("const p = r.typ === 'odpoved' && r.p.cas && r.p, a = p && p.odpoved.filter(Array.isArray);", "const p = r.typ === 'odpoved' && r.p.cas && r.p;")
r("odpoved: a.map((y, i) => [y[0], p.cas[i]])", "odpoved: p.odpoved.filter(Array.isArray).map((y, i) => [y[0], p.cas[i]])")
r("const d = typeof document === 'undefined' ? null : document;", "const d = globalThis.document;")
r("const L = lang !== 'sk' && (p.akcie || []).includes('rezervacia') && window.B30_LANG && window.B30_LANG.langs.find((l) => l.code === lang);",
  "const L = lang !== 'sk' && p.akcie?.includes('rezervacia') && window.B30_LANG?.langs.find((l) => l.code === lang);")
if krok >= 8:
    r("/* Recepcia: nič sa neposiela ani neukladá; pravidlá zhody 1–6 overuje source/tools/recepcia-test.mjs */",
      "/* Recepcia: nič sa neposiela ani neukladá; pravidlá zhody p. 1–7 opisuje source/tools/recepcia-test.mjs */")
    r("/* [skóre, špecifickosť (p. 3), položka] */", "/* [skóre, špecifickosť (p. 3), položka, silný kmeň (p. 7)] */")
    r("  const m = ws.map((w, i) => { let b = 0; p._g.forEach((g, gi) => { for (const [k, st] of g) { const z = zhoda(w, k); if (z > 0.89) hit.add(gi);",
      "  const nm = p._n.some((x) => q.includes(x));\n  let sh = nm || p._v.includes(q);\n  const m = ws.map((w, i) => { let b = 0; p._g.forEach((g, gi) => { for (const [k, st] of g) { const z = zhoda(w, k); if (z > 0.89) { hit.add(gi); sh |= st; }")
    r("  s += p._v.includes(q) ? 2 : p._v.some((v) => v.includes(' ') && q.includes(v)) ? 0.5 : 0;", "  s += p._v.includes(q) ? 9 : nm || p._v.some((v) => v.includes(' ') && q.includes(v)) ? 0.5 : 0;")
    r("  return [s / ws.length, kr.size + (n > 1 && h1.size === n), p];", "  return [s / ws.length, kr.size + (n > 1 && h1.size === n), p, sh];")
    r("  [kb._stop, kb._cen, kb._vyp, kb._zdv] = [kb.stop, kb.cenove, kb.vypln, kb.zdvor].map(", "  [kb._stop, kb._cen, kb._vyp, kb._zdv, kb._sp] = [kb.stop, kb.cenove, kb.vypln, kb.zdvor, kb.spoj].map(")
    r("    p._v = p.otazky.map(norm);\n", "    p._v = p.otazky.map(norm); p._n = (p.odpoved || []).filter(Array.isArray).map((x) => norm(x[0]));\n")
    r("function rozhodni(ws, q, kb, pol) {", "function rozhodni(ws, q, kb, pol, sp) {")
    r("  if (b[0]) return b[1] && b[0][0] - b[1][0] < 0.1 ? vyber(b.slice(0, 2)) : R('odpoved', b[0]);\n",
      "  if (b[0]) {\n    /* p. 3 a 7 */\n"
      "    const X = b[0][2], S = X.pravidlo === 'spolu', kn = (y) => y._n.filter((n) => q.includes(n)), xs = kn(X).join(' '), ex = (w, L = 0) => w.length < 2 || xs.split(' ').includes(w) || X._g.flat().some(([k]) => k.length >= L && pred(w, k));\n"
      "    const Y = X._c && p.find(([, , y, sh]) => y !== X && y._c && sh && ((S && !sp) || ws.some((w) => y._g.flat().some(([k, st]) => st && pred(w, k) && !ex(w, k.length))) || kn(y).some((n) => !xs.includes(n) && !(S && n.split(' ').every((w) => ex(w))))));\n"
      "    const Z = b[1] && b[0][0] - b[1][0] < 0.1 ? b[1] : Y;\n"
      "    return Z || (X._c && !b[0][3]) ? vyber([b[0], Z].filter(Boolean)) : R('odpoved', b[0]);\n  }\n")
    r(", ce = (w) => cen(kb, w);\n", ", ce = (w) => cen(kb, w), sp = /[+&]/.test(otazka) || q.split(' ').some((w) => kb._sp.includes(w));\n")
    r("    const r = rozhodni(ws, q, kb, kb.polozky);\n", "    const r = rozhodni(ws, q, kb, kb.polozky, sp);\n    if (r.typ === 'vyber' && !ws.some((w) => zn(w) || ce(w))) return F(r.skore);\n")
    r("rozhodni(wt, q, kb, kb.polozky.filter((p) => p !== T))", "rozhodni(wt, q, kb, kb.polozky.filter((p) => p !== T), sp)")
if krok >= 9:
    r("  if (k[0] === '=') return +(w === k.slice(1));\n", "  if (k[0] === '=') return +(w === k.slice(1));\n  if (k[0] === '>') return +(+w > +k.slice(1));\n")
    r("  if (n > 1) s *= (1 + hit.size) / (1 + n);", "  if (n > 1) s *= p.odpoved || hit.size === n ? (1 + hit.size) / (1 + n) : 0;")
    r("  const nez = ws.filter((w) => w.length > 3 && ", "  const nez = ws.filter((w) => w.length > 2 && ")
open(out, 'w', encoding='utf8').write(s)
print(f'recepcia.js krok {krok} zapísaný')
