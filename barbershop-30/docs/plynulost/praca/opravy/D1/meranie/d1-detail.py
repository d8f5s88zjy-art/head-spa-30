# D1 – podrobnosti z vysledok.json behov skrol.mjs (ab-<predpona>-<pred|po>-<i>): najdlhšia úloha, najdlhšia LoAF,
# LoAF > 50 ms so skriptom app.js / i18n.js / atmosfera.js (skript > 10 ms alebo vynútený štýl/rozloženie > 10 ms),
# LoAF > 50 ms so skriptom atmosfera.js, vynútené štýl/rozloženie z app.js a čas skriptu tabule hodín.
#   python3 d1-detail.py <priečinok so ab-*> <predpona...>
import json, glob, re, sys, statistics as st
D = sys.argv[1]
for pre in sys.argv[2:]:
    print(f'### {pre}')
    rows = {}
    for f in sorted(glob.glob(f'{D}/ab-{pre}-*/vysledok.json')):
        m = re.search(rf'ab-{pre}-(pred|po)-(\d+)/', f)
        if not m: continue
        r = json.load(open(f)); v = m.group(1)
        lo = r['loaf']; du = r['dlhe_ulohy']
        nase = [x for x in lo if x['d'] > 50 and any(s['src'] in ('app.js', 'i18n.js', 'atmosfera.js') and (s['d'] > 10 or s['forced'] > 10) for s in x['scripts'])]
        atm = [x for x in lo if x['d'] > 50 and any(s['src'] == 'atmosfera.js' for s in x['scripts'])]
        vyn = [x for x in r['vynutene'] if 'app.js' in x['k']]
        # tabuľa: pred = časovač tick na riadku 69x, po = slučka krok
        tab_vyn = sum(x['n'] for x in vyn if re.search(r'app\.js:(tick:69\d|krok)', x['k']))
        tab_skr = sum(x['ms'] for x in r['skripty'] if re.search(r'app\.js:(tick:69\d|krok)', x['k']))
        rows.setdefault(v, []).append({
            'najdlhšia úloha': max([x['ms'] for x in du] or [0]), 'najdlhšia LoAF': max([x['d'] for x in lo] or [0]),
            'LoAF>50 so skriptom stránky >10': len(nase), 'LoAF>50 s atmosfera.js': len(atm),
            'vynútené z tabule (n)': tab_vyn, 'skript tabule ms': round(tab_skr, 1),
            'vynútené z app.js (n)': sum(x['n'] for x in vyn)})
    if not rows: continue
    keys = list(next(iter(rows.values()))[0].keys())
    print('| variant (n) | ' + ' | '.join(keys) + ' |'); print('|' + ' --- |' * (len(keys) + 1))
    for v in ('pred', 'po'):
        if v not in rows: continue
        rs = rows[v]
        print(f'| {v} ({len(rs)}) | ' + ' | '.join(str(round(st.median([x[k] for x in rs]), 1)) for k in keys) + ' |')
    for v in ('pred', 'po'):
        for i, x in enumerate(rows.get(v, [])): print('  ', v, i + 1, x)
