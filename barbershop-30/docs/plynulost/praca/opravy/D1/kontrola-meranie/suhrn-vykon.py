# Kontrola merania D1: tabuľka pred/po zo série skrol.mjs (ab-<predpona>-<pred|po>-<i>/vysledok.json v kópiách nástrojov).
# Mediány behov + jednotlivé behy. Navyše proti tabulka.py implementátora: všetky vynútené štýly/rozloženia z app.js
# (nielen z riadku tabule), LoAF so skriptom stránky aj s rozpisom, posuny rozloženia (CLS) počas merania.
#   python3 -I suhrn-vykon.py [predpona...]
import json, glob, os, re, sys, statistics as st
K = os.path.dirname(os.path.abspath(__file__))
def runs(p, s): return sorted(glob.glob(f'{K}/nastroje-{s}/overenie-kod-stranka/ab-{p}-{s}-*/vysledok.json'))
def med(xs): return round(st.median(xs), 2) if xs else None
NASE = r'(app|i18n|atmosfera)\.js'
def zle(v):
    out = []
    for l in v['loaf']:
        if l['d'] <= 50: continue
        sc = [s for s in l['scripts'] if re.search(NASE, s.get('src') or '') and (s['d'] > 10 or (s.get('forced') or 0) > 10)]
        if sc: out.append((l['t'], l['d'], [(s['src'], s.get('fn'), s.get('inv'), s['d'], s.get('forced')) for s in sc]))
    return out
def metr(v):
    sh = v['snimky_hlavne']; sn = v['snimky']
    vyn_tab = sum(x['n'] for x in v['vynutene'] if re.search(r'app\.js:(tick:69\d|krok)', x['k']))
    vyn_app_n = sum(x['n'] for x in v['vynutene'] if 'app.js' in x['k'])
    vyn_app_ms = sum(x['ms'] for x in v['vynutene'] if 'app.js' in x['k'])
    tab = sum(x['ms'] for x in v['skripty'] if re.search(r'app\.js:(tick:69\d|krok)', x['k']))
    atm = [l for l in v['loaf'] if l['d'] > 50 and any(s.get('src') == 'atmosfera.js' for s in l['scripts'])]
    return {'úloha snímky p95': sh['spolu']['p95'], 'úloha snímky p50': sh['spolu']['p50'], 'štýl/sn': sh['UpdateLayoutTree']['avg'], 'štýl p95': sh['UpdateLayoutTree']['p95'],
            'snímky >16,7 %': sh['nad16_pct'], 'dlhé úlohy': len(v['dlhe_ulohy']), 'najdlhšia úloha': max([x['ms'] for x in v['dlhe_ulohy']], default=0),
            'LoAF>50': v['loaf_nad50'], 'najdlhšia LoAF': max([l['d'] for l in v['loaf']], default=0), 'LoAF>50 so skriptom stránky >10': len(zle(v)),
            'LoAF>50 s atmosfera.js': len(atm), 'rAF p95': sn['p95'], 'rAF >33 %': sn['nad33_pct'], 'rAF >100': sn['nad100'],
            'vynútené z tabule': vyn_tab, 'vynútené z app.js (n)': vyn_app_n, 'vynútené z app.js ms': round(vyn_app_ms, 1), 'skript tabule ms': round(tab, 1),
            'CLS spolu': round(sum(x['v'] for x in v.get('layout_shift', [])), 4)}
PRE = sys.argv[1:] or ['k1', 'k1s', 'k1pd', 'k1pdh', 'k1k']
for p in PRE:
    data = {s: [(f, json.load(open(f))) for f in runs(p, s)] for s in ('pred', 'po')}
    if not data['pred'] and not data['po']: continue
    print(f'### {p}  (behov pred {len(data["pred"])}, po {len(data["po"])})')
    m = {s: [metr(v) for _, v in data[s]] for s in data}
    keys = list((m['pred'] or m['po'])[0].keys())
    print('| metrika | pred medián (behy) | po medián (behy) |'); print('|---|---|---|')
    for k in keys:
        a = [d[k] for d in m['pred']]; b = [d[k] for d in m['po']]
        print(f'| {k} | {med(a)} ({", ".join(str(x) for x in a)}) | {med(b)} ({", ".join(str(x) for x in b)}) |')
    for s in ('pred', 'po'):
        for f, v in data[s]:
            z = zle(v)
            if z: print(f'  {s} {os.path.basename(os.path.dirname(f))}: LoAF so skriptom stránky: {z[:4]}')
            vy = [x for x in v['vynutene'] if 'app.js' in x['k']]
            print(f'  {s} {os.path.basename(os.path.dirname(f))}: vynútené z app.js: {vy[:5]}')
            top = sorted(v['loaf'], key=lambda l: -l['d'])[:2]
            print(f'  {s} {os.path.basename(os.path.dirname(f))}: najdlhšie LoAF: ' + '; '.join(f"t={l['t']} d={l['d']} blk={l['blk']} sl={l['sl']} skripty={[(x['src'], x['fn'], x['d'], x['forced']) for x in l['scripts']][:3]}" for l in top))
    print()
