# Súhrn výsledkov skrol2.mjs: python3 -I suhrn.py <log alebo json...>
import sys, json, glob
rows = []
for a in sys.argv[1:]:
    for f in glob.glob(a):
        txt = open(f).read()
        if f.endswith('.json'):
            rows.append(json.loads(txt))
        else:
            for l in txt.splitlines():
                if l.startswith('{"meno"'):
                    rows.append(json.loads(l))
for d in rows:
    v = d.get('vlakno') or d.get('vlaknoNaSnimku'); dl = d.get('dlhe') or d.get('dlheUlohy')
    print(f"{d['meno']:<28} zát {d.get('zataz', d.get('zatazPred'))} cpu p50 {v['cpu']['p50']:>5} p95 {v['cpu']['p95']:>5} priem {v['cpu']['priem']:>6} >16 {v['nad16']:>5}% >33 {v.get('nad33','-'):>4}% štýl {v['stylPriem']:>5} paint {v['paintPriem']:>5} skript {v['skriptPriem']:>5} prvkov {v['prvkovStylPriem']:>5} dlhé(vl>50) {dl['vlakno50']:>3} max {dl['maxVlaknoMs']:>6} | raf p95 {d['snimkyRaf']['p95']} >33 {d['snimkyRaf']['nad33']}%")
