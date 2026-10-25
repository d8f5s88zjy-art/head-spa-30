# porovnanie dvoch behov slepých sád: python3 -I porovnaj.py <predpona-pred> <predpona-po>
import json, sys
a, b = sys.argv[1], sys.argv[2]
zmien = 0
for s in ['A', 'B', 'C2', 'D1', 'D2']:
    X = json.load(open(f'{a}-{s}-zarad.json')); Y = json.load(open(f'{b}-{s}-zarad.json'))
    for x, y in zip(X, Y):
        assert x['otazka'] == y['otazka']
        kx = (x['typ'], x['id'], x.get('sluzba'), tuple(x.get('kand', [])))
        ky = (y['typ'], y['id'], y.get('sluzba'), tuple(y.get('kand', [])))
        if kx != ky:
            zmien += 1
            print(f"{s} {y['jazyk']} | {y['otazka'][:90]} | oc={y['ocakavane']} | {x['trieda']}/{x['podtrieda']} {kx[0]} {kx[1]} {list(kx[3])[:4]} -> {y['trieda']}/{y['podtrieda']} {ky[0]} {ky[1]} {list(ky[3])[:4]}")
print('zmenených odpovedí', zmien)
