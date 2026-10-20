# D1 – tabuľka pred/po zo série A/B (ab.sh, striedavo pred/po, 11:21–11:49): mediány behov.
#   python3 -I tabulka.py
import json, glob, os, re, statistics as st
M = os.path.dirname(os.path.abspath(__file__))
S = os.path.join(M, 'ab-suhrn')
def runs(p, s): return sorted(glob.glob(f'{S}/ab-{p}-{s}-*/vysledok.json'))
def med(xs): return round(st.median(xs), 2) if xs else None
def zle_loaf(v):
    n = 0
    for l in v['loaf']:
        if l['d'] <= 50: continue
        if any(re.search(r'(app|i18n|atmosfera)\.js', s.get('src') or '') and (s['d'] > 10 or (s.get('forced') or 0) > 10) for s in l['scripts']): n += 1
    return n
def metr(v):
    sh = v['snimky_hlavne']; sn = v['snimky']
    vyn_tab = sum(x['n'] for x in v['vynutene'] if re.search(r'app\.js:tick:69\d', x['k']))
    tab = sum(x['ms'] for x in v['skripty'] if re.search(r'app\.js:(tick:69\d|krok)', x['k']))
    return {'úloha snímky p95': sh['spolu']['p95'], 'štýl/sn': sh['UpdateLayoutTree']['avg'], 'štýl p95': sh['UpdateLayoutTree']['p95'],
            'snímky >16,7 %': sh['nad16_pct'], 'dlhé úlohy': len(v['dlhe_ulohy']), 'najdlhšia úloha': max([x['ms'] for x in v['dlhe_ulohy']], default=0),
            'najdlhšia LoAF': max([l['d'] for l in v['loaf']], default=0), 'LoAF>50 so skriptom >10': zle_loaf(v),
            'rAF >33 %': sn['nad33_pct'], 'vynútené z tabule': vyn_tab, 'skript tabule ms': round(tab, 1)}
for p, nazov in [('d1ab', 'stredne'), ('d1abs', 'svih'), ('d1abpd', 'prvý dotyk hudba=off'), ('d1abpdh', 'prvý dotyk s hudbou'), ('d1abk', 'kontakt')]:
    print(f'### {nazov} ({p})')
    data = {s: [metr(json.load(open(f))) for f in runs(p, s)] for s in ('pred', 'po')}
    keys = list(data['pred'][0].keys())
    print('| metrika | pred (medián, behy) | po (medián, behy) |'); print('|---|---|---|')
    for k in keys:
        a = [d[k] for d in data['pred']]; b = [d[k] for d in data['po']]
        print(f'| {k} | {med(a)} ({", ".join(str(x) for x in a)}) | {med(b)} ({", ".join(str(x) for x in b)}) |')
