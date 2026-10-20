#!/usr/bin/env python3
"""Rozklad čakania filmu po skoku (CO-1/CO-5) z nahrávky over2.mjs + casovac.js.
Pre každú značku skoku: kedy sa začal sťahovať súbor cieľového záberu, kedy prišiel, rozbalenie (createImageBitmap),
nahrávanie pásov do grafiky, kedy je záber ready a kedy film znova kreslí (koniec prázdneho plátna).
  python3 rozklad-v.py runs/<meno>"""
import json, sys, os
R = sys.argv[1]
m = json.load(open(os.path.join(R, 'meta.json'))); L = [x for x in json.load(open(os.path.join(R, 'log.json'))) if 'y' in x]
C = json.load(open(os.path.join(R, 'cas.json'))) if os.path.exists(os.path.join(R, 'cas.json')) else []
pt0 = m['pt0']
P = lambda wall: wall - pt0                       # Date.now -> performance.now stránky
marks = [(P(k['t']), k['m']) for k in m['marks'] if any(w in k['m'] for w in ('menu', 'klik', 'skok', 'svih'))]
for i, (tm, name) in enumerate(marks):
    tn = marks[i + 1][0] if i + 1 < len(marks) else 1e12
    seg = [x for x in L if tm <= P(x['t']) < tn]
    # prázdne plátno: prvý clear po značke, prvý draw po ňom
    tc = next((P(x['t']) for x in seg if x.get('gl') == 'clear' and x.get('wi') == 1), None)
    td = next((P(x['t']) for x in seg if tc is not None and P(x['t']) > tc and x.get('gl') == 'draw'), None)
    cur = next((x['f']['cur'] for x in seg[::-1] if x.get('f')), None)
    print(f"== {name} (t={tm:.0f}) cieľ {cur}: prázdne plátno od {tc and round(tc - tm)} ms do {td and round(td - tm)} ms (trvanie {tc and td and round(td - tc)} ms)")
    if not C: continue
    base = (cur or '').replace('-video', '')
    for e in C:
        if not (tm - 200 <= e.get('t0', 0) < min(tn, tm + 20000)): continue
        if e['k'] == 'fetch' and ('/film/' in e['url'] or base.split('-m')[0] in e['url'] or True) and ('avif' in e['url'] or 'webp' in e['url']):
            print(f"   fetch {e['url']:<32} od {e['t0'] - tm:>6.0f}  hlavičky {e.get('th', 0) - tm if e.get('th') else None}  telo {e.get('tb', 0) - tm if e.get('tb') else None}  {e.get('err', '')}")
        elif e['k'] == 'bitmap':
            print(f"   bitmap {str(e['url']):<31} od {e['t0'] - tm:>6.0f}  do {e.get('t1', 0) - tm:>6.0f}  = {e.get('t1', 0) - e['t0']} ms  {e.get('w')}x{e.get('h')}")
    tex = [e for e in C if e['k'] == 'tex' and tm <= e['t0'] < min(tn, tm + 20000)]
    if tex:
        print(f"   pásy do grafiky: {sum(e['n'] for e in tex)} volaní, {sum(e['ms'] for e in tex):.0f} ms v hlavnom vlákne, od {tex[0]['t0'] - tm:.0f} do {tex[-1]['t1'] - tm:.0f} ms")
