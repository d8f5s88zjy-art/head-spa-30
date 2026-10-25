"""Zostaví medzistavy opravy 5 pre logické commity (A–E) z konečného stavu (o5/final) a stavu pred opravou.
  python3 -I stavy.py <A|B|C|D|E>
Zapíše súbory do stromu hs-recepcia a dáta generátora do o5/stav/<X>/, spustí generátor (JSON = generátor).
A  priama odpoveď len pri úplnom vysvetlení otázky (P1, P2, výplňové triedy, limit váhy)
B  cena vždy vo výreze cenníka (P3: vyrez, tabuľka, cennik v JSON, kompaktný JSON a CSS kvôli váhe)
C  trvanie len pri službe s trvaním (P4: vetva trvania, voľby trvania, časové slová v dátach)
D  čisté kmene a kombinatorické testy (P5 dáta, lint, P6)
E  panel nehýbe stránkou ani filmom (S7, S2, S3, V1, D1, D2, D8)"""
import json, re, subprocess, sys, shutil
from pathlib import Path

S5 = Path('/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/barber/lahky-telefon/v2/stavba-v5')
R = Path('/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/hs-recepcia')
FIN = S5 / 'o5/final'
B30 = 'barbershop-30'
KROK = sys.argv[1]
PORADIE = 'ABCDE'
po = lambda x: PORADIE.index(KROK) >= PORADIE.index(x)
head = lambda p: subprocess.run(['git', '-C', str(R), 'show', f'HEAD:{p}'], capture_output=True, check=True).stdout.decode('utf8')
fin = lambda p: (FIN / p).read_text('utf8')


def nahrad(s, pary):
    for a, b in pary:
        assert s.count(a) == 1, f'{KROK}: nenájdené ({s.count(a)}×): {a[:90]}'
        s = s.replace(a, b)
    return s


# ---------- recepcia.js: z konečného stavu sa odoberú zmeny neskorších krokov ----------
js = fin(f'{B30}/assets/recepcia.js')
if not po('E'):
    js = nahrad(js, [
        ("function zamkni(z) {\n  const s = d.body.style;\n  if (z) ov = s.overflow;\n  d.documentElement.style.scrollbarGutter = z && innerWidth > d.documentElement.clientWidth ? 'stable' : '';\n  s.overflow = z ? 'hidden' : ov;\n}\n", ''),
        ("dlg.onclose = () => { zamkni(0); btn.", "dlg.onclose = () => { btn."),
        ("  texty();\n  zamkni(1);\n  dlg.showModal();", "  texty();\n  dlg.showModal();"),
        ("  btn.setAttribute('aria-expanded', 'true');\n  chips.scrollLeft = 0;\n", "  btn.setAttribute('aria-expanded', 'true');\n"),
        ("let dlg, kb, lang = '', btn, log, chips, inp, ov;", "let dlg, kb, lang = '', btn, log, chips, inp;"),
    ])
if not po('C'):
    js = nahrad(js, [
        ("  const G = T._g[0], Q = ` ${q} `, tw = (w) => G.some(([k]) => ista(w, k)), vol = ",
         "  const G = T._g[0], tw = (w) => G.some(([k]) => ista(w, k)), vol = "),
        ("  if (!G.some(([k, s]) => s && (Q.includes(` ${k.replace('_', ' ')} `) || ws.some((w) => pred(w, k))))) {\n    const r = rozhodni(ws, q, kb, pol, sp, vol);\n    if (r.typ === 'odpoved' || r.typ === 'nevieme' || !ws.some(tw)) return r;\n  }\n  const wt = ws.filter((w) => !tw(w) && !(ce(w) && !zn(w)));\n  if (wt.every((w) => vol(w) && !zn(w))) return R('odpoved', [1, 0, T]);\n  const r = rozhodni(wt, q, kb, pol, sp, vol), l = [].concat(r.p);\n  if (r.typ === 'nevieme' || r.typ === 'fallback') return r;\n  if (r.typ === 'odpoved' && r.p.cas) return R('odpoved', [r.skore, 0, trvP(r.p)], { id: T.id, sluzba: r.p.id });\n  return { ...vyber(l.map((x) => [r.skore, 0, x])), ...(l.every((x) => x.cas) ? { id: T.id, cas: 1 } : { o: 1 }) };\n",
         "  if (!G.some(([k, s]) => s && ws.some((w) => pred(w, k)))) return rozhodni(ws, q, kb, pol, sp, vol);\n  const wt = ws.filter((w) => !tw(w) && !ce(w)), r = wt.length ? rozhodni(wt, q, kb, pol, sp, vol) : R('odpoved', [1, 0, T]);\n  if (r.typ !== 'odpoved' || r.p === T) return r;\n  return r.p.cas ? R('odpoved', [r.skore, 0, trvP(r.p)], { id: T.id, sluzba: r.p.id }) : F(0);\n"),
        ("const trvP = (p) => ({ ...p, otazky: [p.odpoved.find(Array.isArray)[0]], odpoved:", "const trvP = (p) => ({ ...p, odpoved:"),
        ("  if (r.typ === 'vyber') { r.p.forEach((p) => { const t = r.cas ? trvP(p) : p; box.append(tlac('rc-btn', t.otazky[0], () => polozka(t))); }); li.append(veta(r.o ? kb.fallback : kb.panel.mysli), box, akcie(r.o ? ['tel', 'email', 'rezervacia'] : ['sluzby', 'tel'])); }",
         "  if (r.typ === 'vyber') { r.p.forEach((p) => box.append(tlac('rc-btn', p.otazky[0], () => polozka(p)))); li.append(veta(kb.panel.mysli), box, akcie(['sluzby', 'tel'])); }"),
    ])
if not po('B'):
    i = js.index('const cenovy = '); j = js.index('\nlet dlg')
    js = js[:i] + js[j + 1:]
    i = js.index('function tabulka('); j = js.index('function odpoved(p)')
    js = js[:i] + js[j:]
    js = nahrad(js, [
        ("  const li = el('li', 'rc-a'), v = vyrez(p, kb);\n  p.odpoved.forEach((f) => (v && cenovy(f) ? li.querySelector('.rc-cen') || li.append(tabulka(v)) : li.append(veta([].concat(f).join(' ')))));",
         "  const li = el('li', 'rc-a');\n  p.odpoved.forEach((f) => li.append(veta([].concat(f).join(' '))));"),
    ])
    # kostra panela s úvodzovkami ako pred opravou (skrátenie úvodzoviek patrí k váhe výrezu)
    hk = head(f'{B30}/assets/recepcia.js')
    a, b = hk.index('const KOSTRA = '), hk.index("</div>';\n", hk.index('const KOSTRA = ')) + 9
    i, j = js.index('const KOSTRA = '), js.index("</div>';\n", js.index('const KOSTRA = ')) + 9
    js = js[:i] + hk[a:b] + js[j:]
(R / B30 / 'assets/recepcia.js').write_text(js, 'utf8')

# ---------- recepcia.css ----------
css = fin(f'{B30}/assets/recepcia.css')
if not po('E'):
    css = nahrad(css, [
        ("border-radius:12px 12px 0 0;overscroll-behavior:contain;background", "border-radius:12px 12px 0 0;background"),
        (".rc-chips{display:flex;gap:var(--s2);flex:none;overflow-x:auto;margin:0 -6px;padding:var(--s2) 6px}", ".rc-chips{display:flex;gap:var(--s2);flex:none;overflow-x:auto;padding:var(--s2) 0}"),
        ("overflow-y:auto;overscroll-behavior:contain;display:flex", "overflow-y:auto;display:flex"),
        ("@media (min-width:901px){#rc-panel{inset:auto var(--gutter) 92px auto;", "@media (min-width:901px){#rc-panel{inset:auto 24px 92px auto;"),
        ("#rc-panel::backdrop{background:rgba(14,13,12,.55)}\n", "#rc-panel::backdrop{background:rgba(14,13,12,.55)}\n#rc-panel[open]{animation:rc-in 240ms var(--ease-out)}\n"),
        ("@media (prefers-reduced-motion:no-preference){html:not([data-motion=\"off\"]) #rc-panel[open]{animation:rc-in 240ms var(--ease-out)}}\n",
         "@media (prefers-reduced-motion:reduce){#rc-panel[open]{animation:none}}\nhtml[data-motion=\"off\"] #rc-panel[open]{animation:none}\n"),
    ])
if not po('B'):
    css = head(f'{B30}/assets/recepcia.css')
(R / B30 / 'assets/recepcia.css').write_text(css, 'utf8')

# ---------- style.css ----------
(R / B30 / 'assets/style.css').write_text(fin(f'{B30}/assets/style.css') if po('E') else head(f'{B30}/assets/style.css'), 'utf8')

# ---------- testy ----------
t1 = fin(f'{B30}/source/tools/recepcia-test.mjs')
if not po('D'):
    t1 = nahrad(t1, [
        ("//  Zásady zhody v2 (oprava 5, stavba-v5/ZASADY-ZHODY.md): P1 priama odpoveď len pri úplnom vysvetlení otázky, P2 inak\n//  „Myslíš toto?“ alebo odovzdanie, P3 cena vo výreze cenníka, P4 trvanie len pri službe s trvaním, P5 čisté kmene,\n//  P6 kombinatorické testy z dát – tie sú v source/tools/recepcia-kombinacie-test.mjs.\n", ''),
        ("'source/tools/recepcia-test.mjs', 'source/tools/recepcia-kombinacie-test.mjs', ...JAZYKY", "'source/tools/recepcia-test.mjs', ...JAZYKY"),
    ])
(R / B30 / 'source/tools/recepcia-test.mjs').write_text(t1, 'utf8')
t2p = R / B30 / 'source/tools/recepcia-kombinacie-test.mjs'
t2 = fin(f'{B30}/source/tools/recepcia-kombinacie-test.mjs')
if po('D'):
    t2p.write_text(t2, 'utf8')
elif po('B'):
    # len test výrezu cenníka (P3); kombinácie P5 a P6 pribudnú v kroku D
    hlav = ("#!/usr/bin/env node\n// Testy recepcie podľa zásad zhody v2 (oprava 5), bez prehliadača – výrez cenníka (P3).\n//\n//   node --test source/tools/recepcia-kombinacie-test.mjs\n//\n"
            "// P3: odpoveď s cenou ukáže výrez cenníka – riadok služby zvýraznený, susedné riadky tej istej skupiny, nadpis skupiny;\n"
            "// vety a čísla doslovne zo stránky (sk: index.html, ostatné jazyky: slovník stránky cez generátor jazyky-gen.py).\n")
    imp = t2[t2.index('import fs from'):t2.index("const FRAZA = {")]
    pom = "const cenova = (p) => !!p.odpoved && JSON.stringify(p.odpoved).includes('€');\n\n"
    p3 = t2[t2.index('/* P3: výrez cenníka'):]
    t2p.write_text(hlav + imp + pom + p3, 'utf8')
elif t2p.exists():
    t2p.unlink()

# ---------- dáta generátora a JSON ----------
dst = S5 / f'o5/stav/{KROK}'; dst.mkdir(parents=True, exist_ok=True)
pred = (S5 / 'o5/jazyky_data.pred-o5.py').read_text('utf8')
final = fin('jazyky_data.py')


def bloky(s):
    """{(jazyk, kľúč riadku): riadok} pre riadky ' 'vypln'…' a '  'id': (…)' v blokoch EN = {…}"""
    out, cur = {}, None
    for l in s.split('\n'):
        m = re.match(r'^([A-Z][A-Z]) = \{', l)
        if m: cur = m.group(1)
        m = re.match(r"^ {1,2}'([\w-]+)': ", l)
        if cur and m: out[(cur, m.group(1))] = l
    return out


def prepis(s, zdroj, kluce, jazyky=None):
    out, cur = [], None
    for l in s.split('\n'):
        m = re.match(r'^([A-Z][A-Z]) = \{', l)
        if m: cur = m.group(1)
        m = re.match(r"^ {1,2}'([\w-]+)': ", l)
        if cur and m and m.group(1) in kluce and (cur, m.group(1)) in zdroj and (jazyky is None or cur in jazyky): l = zdroj[(cur, m.group(1))]
        out.append(l)
    return '\n'.join(out)


F = bloky(final)
data = prepis(pred, F, {'vypln', 'stop', 'cenove', 'zdvor'})                       # A: výplňové triedy (opytovacie slová, zámená, „seid“, „teuer“)
data = prepis(data, F, {'trvanie'}, {'HU'})                                        # A: hu „meddig“ je časové slovo (inak blokuje P1 pri „meddig tart“)
data = prepis(data, F, {'hodiny'}, {'SR'})                                         # A: sr „vreme“ (aj počasie) len slabý kmeň hodín
if po('C'):
    data = prepis(data, F, {'trvanie', 'cena-dlhe'})                               # C: časové slová položky trvanie, dlhé vlasy bez časových prísloviek
    if not po('D'):                                                              # … príplatok a „drahší“ ostávajú do kroku D silné
        data = nahrad(data, [
            ("=Cm over extra surcharg expensiv |", "=Cm over Extra Surcharg expensiv |"),
            ("=Cm aufpreis teurer zuschlag |", "=Cm Aufpreis Teurer Zuschlag |"),
            ("=Cm příplat dražš vlas", "=Cm Příplat Dražš vlas"),
            ("=Cm dopłat doplat droższ włos", "=Cm Dopłat Doplat Droższ włos"),
            ("=Cm felár drágább haj", "=Cm Felár Drágább haj"),
            ("=Cm doplat skuplj kosa", "=Cm Doplat Skuplj kosa"),
            ("=См доплат дорож волос", "=См Доплат Дорож волос"),
        ])
if po('D'):
    data = final                                                                  # D: šediny, príplatok, sr vreme, pl opłat
(dst / 'jazyky_data.py').write_text(data, 'utf8')
gen = fin('jazyky-gen.py') if po('B') else (S5 / 'o5/jazyky-gen.pred-o5.py').read_text('utf8')
(dst / 'jazyky-gen.py').write_text(gen, 'utf8')

sk = json.loads(fin(f'{B30}/assets/recepcia/sk.json'))
skh = json.loads(head(f'{B30}/assets/recepcia/sk.json'))
st = dict(skh); st['vypln'] = sk['vypln'].replace(' nejak tou tom tym toho take', '')  # zámená pribudnú v kroku D spolu so slabým „príplatok“
if po('B'):
    st = {k: (sk['cennik'] if k == 'polozky' and False else v) for k, v in st.items()}
    st2 = {}
    for k, v in st.items():
        if k == 'polozky': st2['cennik'] = sk['cennik']
        st2[k] = v
    st = st2
if po('C'):
    for p in st['polozky']:
        if p['id'] == 'cena-dlhe': p['kluc'] = 'Dlhe Dlhy Dlha Dlhs Dlzk =10! =Cm Priplat Drah vlas strih'
if po('D'):
    st = sk
ns = {}
sys.argv = ['x', str(R / B30)]
exec(gen.split('sys.path.insert(0')[0], ns)
ns['zapis'](R / B30 / 'assets/recepcia/sk.json', st)
subprocess.run([sys.executable, '-I', str(dst / 'jazyky-gen.py'), str(R / B30)], check=True, capture_output=True)
if KROK == 'E':
    for p in sorted(FIN.rglob('*')):
        if p.is_file() and B30 in str(p):
            rel = p.relative_to(FIN)
            assert (R / rel).read_bytes() == p.read_bytes(), f'E ≠ konečný stav: {rel}'
    assert (dst / 'jazyky_data.py').read_text('utf8') == final
print('stav', KROK, 'zapísaný')
