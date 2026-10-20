#!/usr/bin/env python3
"""Overenie kod-film: úseky šera filmu zo sondy (snímka filmu, ktorá plátno len vyčistila a nič nenakreslila).
python3 sero.py <vysledok.json>"""
import json, sys
d = json.load(open(sys.argv[1]))
s = d['sonda']; fr = s['fr']; st = s['st']
def stav(t):
    b = None
    for x in st:
        if x[0] <= t: b = x
        else: break
    return b
for k, v in d['scen'].items():
    od, po = v['od'], v['po']
    f = [x for x in fr if od <= x[0] <= po]
    run = None; useky = []
    for x in f:
        tma = x[3] > 0 and x[2] == 0
        if tma and run is None: run = x[0]
        elif not tma and x[2] > 0 and run is not None: useky.append((round(run - od), round(x[0] - run), stav(run))); run = None
    if run is not None: useky.append((round(run - od), 'trvá do konca (%d ms)' % round(po - run), stav(run)))
    print(k, 'snímok filmu', len(f), 'šero:', useky if useky else 'žiadne')
