#!/usr/bin/env python3
"""K1 – súhrn behov detektora k1-detektor.cjs.

Použitie: python3 -I k1-suhrn.py <priečinok s behmi> [<výstupný json>]
Prejde všetky k1-<okno>-<gpu>*.json (rekurzívne), pre každý beh vypíše snímky, zakryté kroky, škvrny
v pohľade safari a chromium a ich skupiny (záber, tretina obrazu), a spočíta jedinečné škvrny naprieč behmi:
škvrna = rovnaký záber + rovnaká oblasť (tretina × tretina plátna) + rovnaký pohľad. Výstup JSON + text."""
import glob
import json
import os
import sys

root = sys.argv[1]
out = sys.argv[2] if len(sys.argv) > 2 else None
behy, uniq = [], {}
for f in sorted(glob.glob(os.path.join(root, '**', 'k1-*.json'), recursive=True)):
    if os.path.basename(f).startswith('k1-suhrn'):
        continue
    d = json.load(open(f))
    if 'kroky' not in d:
        continue
    ok = d['okno']
    tag = '%dx%d@%s %s%s%s' % (ok['w'], ok['h'], ok['dpr'], d['gpu']['rezim'], ' znacka' if d['parametre'].get('znacka') else '', ' TESTVADA' if d['parametre'].get('test_vada') else '')
    kroky = d['kroky']
    rez = sorted({k['r'] for k in kroky})
    b = {
        'beh': tag, 'subor': f, 'renderer': d['gpu'].get('renderer'), 'rozsah': d.get('rozsah'), 'rezimy': rez,
        'snimky': sum(1 for k in kroky if not k.get('zakryte')), 'zakryte': sum(1 for k in kroky if k.get('zakryte')),
        'snimky_mix0': sum(1 for k in kroky if not k.get('zakryte') and not k.get('mix')),
        'max_alfa0_pct': max([k.get('a0') or 0 for k in kroky] + [0]),
        'snimky_s_alfa0': sum(1 for k in kroky if (k.get('a0') or 0) > 0),
        'dpr_filmu': sorted({k.get('dpr') for k in kroky if k.get('dpr')}),
        'chyby': d.get('chyby', [])[:5], 'chyba': d.get('chyba'), 'skupiny': [],
    }
    for g in d.get('skupiny', []):
        if g['druh'] != 'skvrny':
            continue
        det = [s for s in d['skvrny'] if s['skupina'] == g['skupina']]
        top = max(det, key=lambda s: s['plocha'])
        crop = next((s.get('vyrez_platno') for s in det if s.get('vyrez_platno')), None)
        scr = next((s.get('vyrez_obrazovka') for s in det if s.get('vyrez_obrazovka')), None)
        nah = next((s.get('nahlad') for s in det if s.get('nahlad')), None)
        gg = {
            'skupina': g['skupina'], 'pohlad': g['pohlad'], 'zaber': g['zaber'], 'detekcie': g['pocet'], 'rezimy': g['rezimy'],
            'scrollY': g['scrollY'], 'S': [min(s['S'] for s in det), max(s['S'] for s in det)],
            'max_plocha_pct': g['max_plocha'], 'bbox_pri_max': top['bbox'], 'stred': top['stred'], 'jas': top['jas'], 'farba': top['farba'],
            'alfa0_podiel': top['alfa0_podiel'], 'ref_jas': top['ref_jas'], 'necakane': top['necakane'],
            'vyrez_platno': crop, 'vyrez_obrazovka': scr, 'nahlad': nah,
        }
        b['skupiny'].append(gg)
        if not d['parametre'].get('test_vada') and not d['parametre'].get('znacka'):
            key = (g['pohlad'], g['zaber'], g['skupina'].split('|')[-1])
            u = uniq.setdefault(key, {'pohlad': key[0], 'zaber': key[1], 'oblast': key[2], 'behy': [], 'max_plocha_pct': 0, 'detekcie': 0})
            u['behy'].append(tag)
            u['detekcie'] += g['pocet']
            u['max_plocha_pct'] = max(u['max_plocha_pct'], g['max_plocha'])
    behy.append(b)

res = {'behy': behy, 'jedinecne': sorted(uniq.values(), key=lambda u: (u['pohlad'], u['zaber'], u['oblast']))}
res['pocet'] = {
    'safari': sum(1 for u in res['jedinecne'] if u['pohlad'] == 'safari'),
    'chromium': sum(1 for u in res['jedinecne'] if u['pohlad'] == 'chromium'),
}
for b in behy:
    print('== %s  %s  rozsah %s  režimy %s' % (b['beh'], (b['renderer'] or '')[:60], b['rozsah'], ','.join(b['rezimy'])))
    print('   snímky %d (z toho bez prechodu %d), zakryté %d, snímky s alfou 0: %d, max alfa0 %.2f %%, DPR filmu %s, chyby %d %s' % (
        b['snimky'], b['snimky_mix0'], b['zakryte'], b['snimky_s_alfa0'], b['max_alfa0_pct'], b['dpr_filmu'], len(b['chyby']), b['chyba'] or ''))
    for g in b['skupiny']:
        print('   %-8s %-22s det %3d  y %s  S %.3f–%.3f  max %.2f %%  bbox %s  alfa0 %.2f  ref_jas %s  %s' % (
            g['pohlad'], g['zaber'] + ' ' + g['skupina'].split('|')[-1], g['detekcie'], g['scrollY'], g['S'][0], g['S'][1], g['max_plocha_pct'],
            '%gx%g@%g,%g' % (g['bbox_pri_max']['w'], g['bbox_pri_max']['h'], g['bbox_pri_max']['x'], g['bbox_pri_max']['y']), g['alfa0_podiel'], g['ref_jas'], ','.join(g['rezimy'])))
print('JEDINEČNÉ (záber + tretina obrazu):', json.dumps(res['pocet']))
for u in res['jedinecne']:
    print('   %-8s %-14s %s  max %.2f %%  detekcie %d  behy: %s' % (u['pohlad'], u['zaber'], u['oblast'], u['max_plocha_pct'], u['detekcie'], '; '.join(u['behy'])))
if out:
    json.dump(res, open(out, 'w'), ensure_ascii=False, indent=1)
