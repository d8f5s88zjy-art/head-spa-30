# súhrn A/B behov: ab-<scen>-<variant>-<i>/vysledok.json -> tabuľka (medián cez opakovania)
import json, glob, sys, statistics as st, re
scen = sys.argv[1]
rows = {}
for f in sorted(glob.glob(f'ab-{scen}-*/vysledok.json')):
    m = re.match(rf'ab-{scen}-(.+)-(\d+)/', f); v = m.group(1)
    r = json.load(open(f)); s = r['snimky']; h = r['snimky_hlavne']; mv = r['hlavne_vlakno_ms']
    rows.setdefault(v, []).append({
        'rAF p95': s['p95'], 'rAF >33 %': s['nad33_pct'], 'rAF >100': s['nad100'], 'LoAF>50': r['loaf_nad50'],
        'dlhé úlohy': len(r['dlhe_ulohy']), 'snímka p50': h['spolu']['p50'], 'snímka p95': h['spolu']['p95'], 'snímky >16,7 %': h['nad16_pct'],
        'štýl/sn priem': h['UpdateLayoutTree']['avg'], 'štýl p95': h['UpdateLayoutTree']['p95'], 'rAF skript priem': h['FireAnimationFrame']['avg'],
        'štýl spolu s': round(mv['styl'] / 1000, 2), 'vlákno spolu s': round(mv['spolu'] / 1000, 1), 'okno s': round(r['okno_s'] / 1000, 1)})
keys = list(next(iter(rows.values()))[0].keys())
print('| variant (n) | ' + ' | '.join(keys) + ' |'); print('|' + ' --- |' * (len(keys) + 1))
for v, rs in rows.items():
    print(f'| {v} ({len(rs)}) | ' + ' | '.join(str(round(st.median([x[k] for x in rs]), 2)) for k in keys) + ' |')
for v, rs in rows.items():
    for i, x in enumerate(rs): print('  ', v, i + 1, x)
