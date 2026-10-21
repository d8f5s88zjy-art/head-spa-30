# Súhrn úsekov z sondy skrol.mjs: čas, keď aktuálna titulná karta nemá vlastnú fotku (cudzia / žiadna / náhľad).
# python3 -I seg.py <meta.json alebo skrol-*.json>
import json, sys, collections
m = json.load(open(sys.argv[1])); seg = m['sonda'].get('seg', [])
tot = collections.Counter(); dlhe = []
for x in seg:
    p = x['k'].split(':'); stav = p[1] if len(p) > 1 else 'mimo'
    d = x['do'] - x['od']
    tot[stav] += d
    if stav in ('cudzia', 'ziadna', 'nahlad') and d >= 100: dlhe.append((x['k'], x['od'], d, x['n']))
print(json.dumps({'ms_podla_stavu': tot, 'useky_nad_100ms': dlhe}, ensure_ascii=False))
