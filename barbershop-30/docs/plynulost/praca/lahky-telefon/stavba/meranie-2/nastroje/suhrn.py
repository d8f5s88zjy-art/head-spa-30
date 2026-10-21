# Súhrn merania 1: mediány pred/po z data/*.json → tabuľky v Markdowne (stdout).
# python3 -I suhrn.py <data_dir>
import json, glob, os, sys, statistics as S
D = sys.argv[1]
rows = [json.load(open(f)) for f in sorted(glob.glob(os.path.join(D, '*.json'))) if not f.endswith('brana.json')]
def med(xs):
    xs = [x for x in xs if x is not None]
    return S.median(xs) if xs else None
def g(o, path):
    for k in path.split('.'):
        if o is None: return None
        o = o.get(k) if isinstance(o, dict) else None
    return o
def fmt(v, nd=0, pct=False):
    if v is None: return '–'
    if isinstance(v, bool): return 'áno' if v else 'nie'
    if pct: return f'{100 * v:.0f} %'.replace('.', ',')
    return (f'{v:.{nd}f}' if nd else f'{round(v)}').replace('.', ',')
def vals(kind, prof, strom, path, sc=None):
    return [g(r, path) for r in rows if r['name'].startswith(kind + '-') and r.get('prof') == prof and r['strom'] == strom and (sc is None or r.get('sc') == sc)]
def cell(kind, prof, strom, path, nd=0, pct=False, sc=None, mx=False):
    v = vals(kind, prof, strom, path, sc)
    if not v: return '–'
    m = max([x for x in v if x is not None], default=None) if mx else med(v)
    raw = ' / '.join(fmt(x, nd, pct) for x in v)
    return f'**{fmt(m, nd, pct)}** ({raw})'
P = ['c4f', 'c6f', 'c4s', 'c6s']
PN = {'c4f': 'CPU 4×, Fast 4G', 'c6f': 'CPU 6×, Fast 4G', 'c4s': 'CPU 4×, Slow 4G', 'c6s': 'CPU 6×, Slow 4G'}
out = []
out.append('### Štart (prvá návšteva bez parametrov), medián (jednotlivé behy)\n')
M = [('FCP (ms)', 'fcp', 0, False, False), ('prvá fotka (ms)', 'fotkaMs', 0, False, False), ('prvá fotka s nadpisom (ms)', 'fotkaH1Ms', 0, False, False),
     ('tma v 3 s po FCP (podiel času)', 'tma3', 0, True, False), ('čierna v 3 s po FCP', 'cierna3', 0, True, False),
     ('bajty prvej obrazovky (kB)', 'prvaObrazovka.bajty', 0, False, False), ('požiadavky prvej obrazovky', 'prvaObrazovka.poziadaviek', 0, False, False),
     ('WebGL kontexty (max)', 'gl', 0, False, True), ('hrajúce videá naraz (max)', 'maxPlay', 0, False, True), ('neúplné fotky – vzorky (max)', 'incN', 0, False, True)]
for p in P:
    if not vals('start', p, 'pred', 'fcp'): continue
    out.append(f'\n**{PN[p]}**\n\n| meranie | PRED (D1) | PO (lite) |\n|---|---|---|')
    for lab, path, nd, pct, mx in M:
        if 'bajty' in path:
            f = lambda s: [None if x is None else x / 1000 for x in vals('start', p, s, path)]
            a, b = f('pred'), f('po')
            out.append(f'| {lab} | **{fmt(med(a))}** ({" / ".join(fmt(x) for x in a)}) | **{fmt(med(b))}** ({" / ".join(fmt(x) for x in b)}) |')
        else:
            out.append(f'| {lab} | {cell("start", p, "pred", path, nd, pct, mx=mx)} | {cell("start", p, "po", path, nd, pct, mx=mx)} |')
if vals('start', 'c4f', 'pred0', 'fcp'):
    out.append('\n**D1 bez podvrhu GPU (pred0, pokojná verzia kontajnera), CPU 4×, Fast 4G**\n\n| meranie | pred0 |\n|---|---|')
    for lab, path, nd, pct, mx in M:
        if 'bajty' in path:
            a = [None if x is None else x / 1000 for x in vals('start', 'c4f', 'pred0', path)]; out.append(f'| {lab} | **{fmt(med(a))}** |')
        else: out.append(f'| {lab} | {cell("start", "c4f", "pred0", path, nd, pct, mx=mx)} |')
# scenáre
scs = sorted({r['sc'] for r in rows if r['name'].startswith('scen-')})
if scs:
    out.append('\n### Čierny štart v ďalších situáciách (CPU 4×, Fast 4G, bez ?uvod=off), medián\n')
    out.append('| scenár | tma 3 s PRED | tma 3 s PO | čierna 3 s PRED | čierna 3 s PO | prvá fotka PRED (ms) | prvá fotka PO (ms) | fotka na konci PRED / PO |\n|---|---|---|---|---|---|---|---|')
    for sc in scs:
        fk = lambda s: '/'.join('áno' if x else 'nie' for x in vals('scen', 'c4f', s, 'fotkaKoniec', sc))
        out.append(f'| {sc} | {cell("scen", "c4f", "pred", "tma3", 0, True, sc)} | {cell("scen", "c4f", "po", "tma3", 0, True, sc)} | {cell("scen", "c4f", "pred", "cierna3", 0, True, sc)} | {cell("scen", "c4f", "po", "cierna3", 0, True, sc)} | {cell("scen", "c4f", "pred", "fotkaMs", 0, False, sc)} | {cell("scen", "c4f", "po", "fotkaMs", 0, False, sc)} | {fk("pred")} / {fk("po")} |')
# skrol
SK = [('úloha snímky p95 (ms, stena)', 'stopa.ulohaSnimkyP95', 1), ('úloha snímky p50 (ms)', 'stopa.ulohaSnimkyP50', 1), ('úloha snímky p95, čas vlákna (ms)', 'stopa.vlaknoP95', 1),
      ('snímky > 16,7 ms (%)', 'stopa.nad16', 1), ('dlhé úlohy > 50 ms (počet)', 'stopa.dlheUlohy50', 0), ('dlhé úlohy spolu (ms)', 'stopa.dlheUlohyMs', 0), ('najdlhšia úloha (ms)', 'stopa.najdlhsiaMs', 0),
      ('LoAF > 50 ms (počet)', 'loaf50.n', 0), ('LoAF > 50 ms spolu (ms)', 'loaf50.sucet', 0), ('LoAF najdlhší (ms)', 'loaf50.max', 0),
      ('rAF interval p50 / p95 (ms)', None, 0), ('okno 12 švihov + ťah (s)', 'okno', 1), ('posun v okne (px)', None, 0),
      ('bajty celej stránky (MB)', 'celaStranka.bajty', 2), ('WebGL kontexty (max)', 'gl', 0), ('hrajúce videá naraz (max)', 'maxPlay', 0), ('neúplné fotky – vzorky (max)', 'incN', 0)]
for p in P:
    st = [s for s in ('pred', 'po', 'pred0') if vals('skrol', p, s, 'okno')]
    if not st: continue
    out.append(f'\n### Skrol prstom – {PN[p]} (medián z {len(vals("skrol", p, "po", "okno"))} behov)\n')
    out.append('| meranie | ' + ' | '.join({'pred': 'PRED (D1)', 'po': 'PO (lite)', 'pred0': 'D1 pokojná (pred0)'}[s] for s in st) + ' |\n|---|' + '---|' * len(st))
    for lab, path, nd in SK:
        cs = []
        for s in st:
            if path is None and lab.startswith('rAF'):
                a, b = vals('skrol', p, s, 'raf.p50'), vals('skrol', p, s, 'raf.p95'); cs.append(f'{fmt(med(a), 1)} / {fmt(med(b), 1)}')
            elif path is None:
                ys = [r['y'][1] - r['y'][0] for r in rows if r['name'].startswith('skrol-') and r['prof'] == p and r['strom'] == s]; cs.append(f'{fmt(med(ys))}')
            elif 'bajty' in path:
                a = [None if x is None else x / 1e6 for x in vals('skrol', p, s, path)]; cs.append(f'**{fmt(med(a), 2)}** ({" / ".join(fmt(x, 2) for x in a)})')
            elif path in ('gl', 'maxPlay', 'incN'): cs.append(cell('skrol', p, s, path, nd, mx=True))
            else: cs.append(cell('skrol', p, s, path, nd))
        out.append(f'| {lab} | ' + ' | '.join(cs) + ' |')
# pc
pcs = [r for r in rows if r['name'].startswith('pc-')]
if pcs:
    out.append('\n### Počítač 1440×900, film (?uvod=off, CPU 1×, bez obmedzenia siete), krátky skrol kolieskom 15 × 420 px\n')
    out.append('| meranie | PRED (D1) | PO (lite) |\n|---|---|---|')
    pv = lambda s, path: [g(r, path) for r in pcs if r['strom'] == s]
    for lab, path, nd in [('úloha snímky p95 (ms)', 'stopa.ulohaSnimkyP95', 1), ('úloha snímky p50 (ms)', 'stopa.ulohaSnimkyP50', 1), ('snímky > 16,7 ms (%)', 'stopa.nad16', 1), ('dlhé úlohy > 50 ms', 'stopa.dlheUlohy50', 0),
                          ('LoAF > 50 ms', 'loaf50.n', 0), ('rAF p95 (ms)', 'raf.p95', 1), ('WebGL kontexty', 'gl', 0), ('posun (px)', 'y', 0)]:
        a, b = pv('pred', path), pv('po', path)
        out.append(f'| {lab} | **{fmt(med(a), nd)}** ({" / ".join(fmt(x, nd) for x in a)}) | **{fmt(med(b), nd)}** ({" / ".join(fmt(x, nd) for x in b)}) |')
    out.append('\nTriedy <html>: ' + '; '.join(f"{r['name']}: `{r['cls']}`" for r in pcs))
print('\n'.join(out))
