#!/usr/bin/env python3
"""Zostaví assets/recepcia/{en,uk,hu,sr,pl,de,cs}.json zo sk.json.

Vety odpovedí sa NEPREKLADAJÚ ručne: každý úryvok slovenskej odpovede, ktorý má kľúč v assets/i18n/<jazyk>.json,
sa vezme doslovne zo slovníka (preklad, ktorý je na stránke). Ručne sú len úryvky bez kľúča (FRAG – časť väčšieho
uzla stránky, prevzatá z jeho prekladu v slovníku), otázky, kmene, texty panelu a odovzdania.
Kmene, stop-slová, výplňové a zdvorilé slová sa normalizujú rovnako ako v recepcia.js (NFD bez diakritiky, malé písmená); silný kmeň =
veľké začiatočné písmeno, v cyrilike sa zapíše príponou „!“.
  python3 jazyky-gen.py <koreň barbershop-30>
"""
import json, re, sys, unicodedata
from pathlib import Path

ROOT = Path(sys.argv[1])
SK = json.loads((ROOT / 'assets/recepcia/sk.json').read_text('utf8'))
BQ = {'en': 'en/reservation', 'uk': 'uk/reservation', 'hu': 'hu/foglalas', 'sr': 'en/reservation',
      'pl': 'pl/reservation', 'de': 'de/reservation', 'cs': 'cs/rezervace'}


def bez(s):
    return ''.join(c for c in unicodedata.normalize('NFD', s) if not unicodedata.category(c).startswith('M'))


def kmen(tok):
    eq = tok.startswith('=')
    t = tok[1:] if eq else tok
    bang = t.endswith('!')
    t = t.rstrip('!')
    silny = bang or t[:1].isupper()
    b = bez(t)
    if silny and re.match(r'[A-Z]', b):
        out = b[0] + b[1:].lower()
    elif silny:
        out = b.lower() + '!'
    else:
        out = b.lower()
    return ('=' if eq else '') + out


def kluc(s):
    return ' | '.join(' '.join(kmen(t) for t in g.split()) for g in s.split('|')) if s else ''


def stop(s):
    return ' '.join(dict.fromkeys(bez(w).lower() for w in s.split()))


def jazyk(l, D):
    i18n = json.loads((ROOT / f'assets/i18n/{l}.json').read_text('utf8'))
    n = lambda s: re.sub(r'\s+', ' ', s).strip()

    def tr(x):
        if x in D['frag']:
            return D['frag'][x]
        v = i18n.get(n(x))
        if isinstance(v, str):
            return v
        if re.fullmatch(r'[\d,]+ €', x):
            return x
        raise SystemExit(f'{l}: chýba preklad úryvku „{x}“')

    kontakt = dict(SK['kontakt'])
    kontakt['booqme'] = f'https://booqme.app/{BQ[l]}/barbershop30'
    P = D['panel']
    slov = lambda sk, vlastny: i18n.get(sk) if isinstance(i18n.get(sk), str) else vlastny
    panel = {k: slov(SK['panel'][k], P[k]) for k in ['nadpis', 'uvod', 'vstup', 'odoslat', 'zavriet', 'sukromie', 'mysli', 'zdroj']}
    panel['volby'] = {k: slov(v, P['volby'][k]) for k, v in SK['panel']['volby'].items()}
    panel['akcie'] = {k: (i18n.get(v) if isinstance(i18n.get(v), str) else P['akcie'][k]) for k, v in SK['panel']['akcie'].items()}
    panel['nepotvrdene'] = P['nepotvrdene']
    polozky = []
    for p in SK['polozky']:
        o, k = D['polozky'][p['id']]
        q = {'id': p['id']}
        if 'pravidlo' in p:
            q['pravidlo'] = p['pravidlo']
        q.update({'otazky': o, 'kluc': kluc(k)})
        q['odpoved'] = [[tr(x) for x in f] if isinstance(f, list) else tr(f) for f in p['odpoved']]
        if 'cas' in p:  # price-time z cenníka, preklad zo slovníka stránky
            q['cas'] = [tr(x) for x in p['cas']]
        if 'zoznam' in p:
            q['zoznam'] = [tr(z) for z in p['zoznam']]
        q['akcie'] = p['akcie']  # zdroj a overene sú len v zdroje.json (rovnaké pre všetky jazyky)
        polozky.append(q)
    nevieme = []
    for p in SK['nevieme']:
        o, k, od = D['nevieme'][p['id']]
        q = {'id': p['id']}
        if 'pravidlo' in p:
            q['pravidlo'] = p['pravidlo']
        q.update({'otazky': o, 'kluc': kluc(k), 'odovzdanie': od, 'akcie': p['akcie']})
        if 'cena' in p:
            q['cena'] = p['cena']
        nevieme.append(q)
    vz = {k: stop(D[k]) for k in ('vypln', 'zdvor') if k in D}  # výplňové a zdvorilé slová (oprava 3, pravidlá 2 a 5)
    return {'jazyk': l, 'prah': SK['prah'], 'stop': stop(D['stop']), 'cenove': stop(D['cenove']), **vz, 'kontakt': kontakt,
            'panel': panel, 'fallback': D['fallback'], 'odovzdanie': D['odovzdanie'], 'polozky': polozky, 'nevieme': nevieme}


def zapis(path, d):
    c = lambda x: json.dumps(x, ensure_ascii=False, separators=(',', ': '))
    r = ['{']
    keys = list(d)
    for i, k in enumerate(keys):
        end = ',' if i < len(keys) - 1 else ''
        v = d[k]
        if k in ('polozky', 'nevieme'):
            r.append(f'  "{k}": [')
            r.append(',\n'.join('    ' + c(x) for x in v))
            r.append('  ]' + end)
        elif k == 'kontakt':
            r.append('  "kontakt": {')
            r.append(',\n'.join(f'    {c(a)}: {c(b)}' for a, b in v.items()))
            r.append('  }' + end)
        elif k == 'panel':
            r.append('  "panel": {')
            r.append(',\n'.join(f'    {c(a)}: {c(b)}' for a, b in v.items()))
            r.append('  }' + end)
        else:
            r.append(f'  {c(k)}: {c(v)}{end}')
    r.append('}')
    path.write_text('\n'.join(r) + '\n', 'utf8')


sys.path.insert(0, str(Path(__file__).parent))
from jazyky_data import DATA  # noqa: E402

for l, D in DATA.items():
    zapis(ROOT / f'assets/recepcia/{l}.json', jazyk(l, D))
    print('zapísané', l)
