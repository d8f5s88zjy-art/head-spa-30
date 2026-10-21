# Kontrola merania D1: čas vlákna (skrol2.mjs --film=off, CPU 1× a 4×) pred/po z vysledky/<meno>.json v kópiách nástrojov.
#   python3 -I suhrn-skrol2.py
import json, glob, os, statistics as st
K = os.path.dirname(os.path.abspath(__file__))
def med(xs): return round(st.median(xs), 2) if xs else None
for cpu in ('cpu1', 'cpu4'):
    rows = {}
    for s in ('pred', 'po'):
        for f in sorted(glob.glob(f'{K}/nastroje-{s}/overenie-vykon-telefon/vysledky/k1-{cpu}-{s}-*.json')):
            v = json.load(open(f)); c = v['vlaknoNaSnimku']; d = v['dlheUlohy']; r = v['snimkyRaf']
            rows.setdefault(s, []).append({'p50 vlákna': c['cpu']['p50'], 'p95 vlákna': c['cpu']['p95'], 'max vlákna': c['cpu']['max'], 'štýl/sn': c['stylPriem'], 'layout/sn': c['layoutPriem'], 'skript/sn': c['skriptPriem'], 'paint/sn': c['paintPriem'],
                'vlákno >16,7 %': c['nad16'], 'vlákno >33 %': c['nad33'], 'úlohy vlákna >50': d['vlakno50'], 'max úloha vlákna ms': d['maxVlaknoMs'], 'úlohy steny >50': d['stena50'], 'rAF p95': r['p95'], 'rAF >33 %': r['nad33'], 'záťaž pred': v['zatazPred'][0], 'trvanie s': v['trvanieS']})
    if not rows: continue
    print(f'### skrol2 --film=off --{cpu}  (behov pred {len(rows.get("pred", []))}, po {len(rows.get("po", []))})')
    keys = list(next(iter(rows.values()))[0].keys())
    print('| metrika | pred medián (behy) | po medián (behy) |'); print('|---|---|---|')
    for k in keys:
        a = [x[k] for x in rows.get('pred', [])]; b = [x[k] for x in rows.get('po', [])]
        print(f'| {k} | {med(a)} ({", ".join(str(x) for x in a)}) | {med(b)} ({", ".join(str(x) for x in b)}) |')
    print()
