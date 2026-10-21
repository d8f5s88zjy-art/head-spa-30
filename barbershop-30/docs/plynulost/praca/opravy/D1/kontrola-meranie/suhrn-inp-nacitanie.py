# Kontrola merania D1: INP (inp.mjs --film=off, CPU 4× a 6×: menu otvor/zavri, jazyk EN/SK, dlhé úlohy do 1,5 s po ťuknutí)
# a prvé načítanie (nacitanie.mjs --film=off --cpu=4: FCP, LCP, CLS, dlhé úlohy, TBT po FCP) pred/po z vysledky/*.json.
#   python3 -I suhrn-inp-nacitanie.py
import json, glob, os, statistics as st
K = os.path.dirname(os.path.abspath(__file__))
def med(xs): return round(st.median(xs), 1) if xs else None
def fmt(xs): return ', '.join(str(x) for x in xs)
for cpu in ('4', '6'):
    rows = {}
    for s in ('pred', 'po'):
        for f in sorted(glob.glob(f'{K}/nastroje-{s}/overenie-vykon-telefon/vysledky/k1-inp{cpu}-{s}-*.json')):
            v = json.load(open(f)); k = v['kroky']; r = {}
            for n in ('menuOtvor', 'menuZavri', 'jazykEN', 'jazykSK'):
                if n in k:
                    r[f'{n} INP ms'] = k[n]['inpMs']
                    r[f'{n} najdlhšia úloha do 1,5 s (stena ms)'] = max([x[0] for x in k[n].get('dlheUlohyDo1_5s_stenaVlakno', [])], default=0)
            rows.setdefault(s, []).append(r)
    if not rows: continue
    print(f'### inp.mjs --film=off --cpu={cpu}  (behov pred {len(rows.get("pred", []))}, po {len(rows.get("po", []))})')
    keys = list(next(iter(rows.values()))[0].keys())
    print('| metrika | pred medián (behy) | po medián (behy) |'); print('|---|---|---|')
    for kk in keys:
        a = [x.get(kk) for x in rows.get('pred', []) if kk in x]; b = [x.get(kk) for x in rows.get('po', []) if kk in x]
        print(f'| {kk} | {med(a)} ({fmt(a)}) | {med(b)} ({fmt(b)}) |')
    print()
rows = {}
for s in ('pred', 'po'):
    for f in sorted(glob.glob(f'{K}/nastroje-{s}/overenie-vykon-telefon/vysledky/k1-nac-{s}-*.json')):
        v = json.load(open(f))
        rows.setdefault(s, []).append({'FCP ms': v['fcpMs'], 'LCP ms': max([x['t'] for x in v['lcp']], default=None), 'LCP prvok': (v['lcp'][-1]['el'] if v['lcp'] else None),
            'CLS': v['cls'] if isinstance(v['cls'], (int, float)) else None, 'dlhých úloh': v['dlhychUloh'], 'TBT po FCP stena ms': v['tbtPoFcpStenaMs'], 'TBT po FCP vlákno ms': v['tbtPoFcpVlaknoMs'],
            'najdlhšia stena ms': max([x['stenaMs'] for x in v['najdlhsie']], default=0), 'záťaž': v['zataz'][0]})
if rows:
    print(f'### nacitanie.mjs --film=off --cpu=4  (behov pred {len(rows.get("pred", []))}, po {len(rows.get("po", []))})')
    keys = list(next(iter(rows.values()))[0].keys())
    print('| metrika | pred (behy) | po (behy) |'); print('|---|---|---|')
    for kk in keys:
        a = [x[kk] for x in rows.get('pred', [])]; b = [x[kk] for x in rows.get('po', [])]
        print(f'| {kk} | {fmt(a)} | {fmt(b)} |')
    for s in ('pred', 'po'):
        for i, f in enumerate(sorted(glob.glob(f'{K}/nastroje-{s}/overenie-vykon-telefon/vysledky/k1-nac-{s}-*.json'))):
            v = json.load(open(f)); print(f'  {s} {i+1}: najdlhšie úlohy {v["najdlhsie"][:4]}; app.js modul {v["appJsModul"]}; cls {v["cls"]}')
