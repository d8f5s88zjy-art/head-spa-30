#!/usr/bin/env python3
"""A2 – analýza snímok z a2-vzhlad.cjs: čierne/prázdne polia, kontrast textu, hárok s vyznačenými nálezmi.

  python3 -I a2-analyza.py <dir s kroky.json>          # jeden prechod (stránka × šírka)
  python3 -I a2-analyza.py --nacitanie <dir nacitanie>  # snímky počas načítania
  python3 -I a2-analyza.py --stavy <dir stavy>          # interaktívne stavy

Hárky ide do <A2-vzhlad>/harky/, súhrn do analyza.json vedľa snímok.
Farby rámikov: červená pretečenie/mimo okna, oranžová prekryv plávajúcich, fialová odrezaný alebo prekrytý text,
žltá nízky kontrast, modrá čierne/prázdne pole, tyrkysová neostrá/roztiahnutá/nenačítaná fotka, zelená zakrytý text.
"""
import json
import os
import re
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage

A2 = '/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/barber/audit-celok/A2-vzhlad'
HARKY = os.path.join(A2, 'harky')
os.makedirs(HARKY, exist_ok=True)
try:
    FONT = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 13)
    FONT_B = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 15)
except OSError:
    FONT = FONT_B = ImageFont.load_default()

FARBY = {'pretecenie': (255, 40, 40), 'plavajuce': (255, 140, 0), 'text': (200, 60, 255), 'kontrast': (255, 230, 0),
         'tma': (40, 120, 255), 'foto': (0, 220, 220), 'zakryte': (40, 230, 90), 'pismo': (255, 105, 180)}


def lin(c):
    c = c / 255.0
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def lum_arr(a):
    a = a.astype(np.float64)
    return 0.2126 * lin(a[..., 0]) + 0.7152 * lin(a[..., 1]) + 0.0722 * lin(a[..., 2])


def parse_rgba(s):
    m = re.findall(r'[\d.]+', s or '')
    if len(m) < 3:
        return None
    r, g, b = (float(x) for x in m[:3])
    a = float(m[3]) if len(m) > 3 else 1.0
    return r, g, b, a


def ratio(l1, l2):
    hi, lo = max(l1, l2), min(l1, l2)
    return (hi + 0.05) / (lo + 0.05)


def tma_polia(img, cell=16):
    """Najväčšie súvislé takmer čierne a jednoliate pole (bunky 16 px: priemer jasu < 24, rozptyl < 4)."""
    g = np.asarray(img.convert('L'), dtype=np.float64)
    h, w = g.shape
    H, W = h // cell, w // cell
    if not H or not W:
        return 0.0, None, 0.0
    g2 = g[:H * cell, :W * cell].reshape(H, cell, W, cell)
    mean = g2.mean(axis=(1, 3))
    std = g2.std(axis=(1, 3))
    flat = (mean < 24) & (std < 4)
    lab, n = ndimage.label(flat)
    tmave = float((g < 18).mean())
    if not n:
        return 0.0, None, tmave
    sizes = ndimage.sum(flat, lab, range(1, n + 1))
    k = int(np.argmax(sizes)) + 1
    ys, xs = np.where(lab == k)
    box = [int(xs.min() * cell), int(ys.min() * cell), int((xs.max() - xs.min() + 1) * cell), int((ys.max() - ys.min() + 1) * cell)]
    return float(sizes[k - 1] / (H * W)), box, tmave


def kontrast(bez, t, op_min=0.9):
    """Kontrast textu voči pozadiu pod ním (snímka bez textu): najhorší prípad = 90. (10.) percentil jasu pozadia."""
    if t['op'] < op_min:
        return None
    c = parse_rgba(t['color'])
    if not c:
        return None
    x, y, w, h = t['r']
    W, H = bez.size
    x0, y0, x1, y1 = max(0, x), max(0, y), min(W, x + w), min(H, y + h)
    if x1 - x0 < 4 or y1 - y0 < 4:
        return None
    reg = np.asarray(bez.crop((x0, y0, x1, y1)).convert('RGB'))
    L = lum_arr(reg).ravel()
    med = np.median(reg.reshape(-1, 3), axis=0)
    a = c[3] * t['op']
    col = np.array(c[:3]) * a + med * (1 - a)
    lt = float(lum_arr(col.reshape(1, 1, 3))[0, 0])
    lmed = float(np.median(L))
    worst = float(np.percentile(L, 90 if lt > lmed else 10))
    r_worst, r_med = ratio(lt, worst), ratio(lt, lmed)
    big = t['fs'] >= 24 or (t['fs'] >= 18.66 and t['fw'] >= 700)
    need = 3.0 if big else 4.5
    return {'r_med': round(r_med, 2), 'r_worst': round(r_worst, 2), 'need': need, 'ok': r_med >= need and r_worst >= need * 0.8}


def draw_boxes(img, boxes):
    im = img.convert('RGB').copy()
    d = ImageDraw.Draw(im)
    for kind, r, label in boxes:
        x, y, w, h = r
        col = FARBY.get(kind, (255, 0, 0))
        for k in range(3):
            d.rectangle([x - k, y - k, x + w + k, y + h + k], outline=col)
        if label:
            tx, ty = max(0, x), max(0, y - 16)
            tw = d.textlength(label[:60], font=FONT)
            d.rectangle([tx, ty, tx + tw + 6, ty + 16], fill=(0, 0, 0))
            d.text((tx + 3, ty + 1), label[:60], fill=col, font=FONT)
    return im


def harok(ims, labels, out, title, th=None):
    if not ims:
        return
    w0, h0 = ims[0].size
    if th is None:
        th = 420 if h0 >= w0 else 300
    ims = [i.resize((max(1, round(i.width * th / i.height)), th)) for i in ims]
    cw = max(i.width for i in ims)
    cols = max(1, min(len(ims), 2200 // (cw + 10)))
    rows = (len(ims) + cols - 1) // cols
    W = cols * (cw + 10) + 10
    Hh = rows * (th + 40) + 44
    c = Image.new('RGB', (W, Hh), (250, 250, 250))
    d = ImageDraw.Draw(c)
    d.text((10, 10), title, fill=(0, 0, 0), font=FONT_B)
    for k, im in enumerate(ims):
        x = 10 + (k % cols) * (cw + 10)
        y = 40 + (k // cols) * (th + 40)
        c.paste(im, (x, y))
        d.text((x, y + th + 4), labels[k][:int(cw / 7)], fill=(160, 0, 0) if '!' in labels[k] else (0, 0, 0), font=FONT)
    c.save(out, quality=78)


def jeden(dirp):
    rep = json.load(open(os.path.join(dirp, 'kroky.json')))
    stranka, vp = rep['stranka'], rep['vp']
    rel = os.path.relpath(dirp, A2).replace(os.sep, '_')
    nalezy = {}

    def add(kind, key, info):
        k = (kind, key)
        if k not in nalezy:
            nalezy[k] = {'typ': kind, 'kluc': key, 'kroky': [], 'info': info}
        nalezy[k]['kroky'].append(info.get('krok'))

    ims, labels = [], []
    for i, k in enumerate(rep['kroky']):
        img = Image.open(os.path.join(dirp, k['snimka']))
        bez = Image.open(os.path.join(dirp, k['bez'])).convert('RGB')
        boxes = []
        if k['over'] > 0:
            add('pretecenie', 'scrollWidth', {'krok': i, 'px': k['over']})
        for o in k['offenders']:
            boxes.append(('pretecenie', o['r'], 'pretečenie ' + o['n']))
            add('pretecenie', o['n'], {'krok': i, 'r': o['r'], 'fixed': o['fixed']})
        for o in k['floatOverlap']:
            # pri prekryve plávajúcich prvkov ignoruj priehľadné (pod 0,3)
            if min(o['opA'], o['opB']) < 0.3:
                continue
            boxes.append(('plavajuce', o['r'], f"{o['a'][:22]} × {o['b'][:22]}"))
            add('plavajuce', o['a'] + ' × ' + o['b'], {'krok': i, 'r': o['r']})
        for o in k['floatOut']:
            boxes.append(('pretecenie', o['r'], 'mimo okna ' + o['n']))
            add('plavajuce-mimo', o['n'], {'krok': i, 'r': o['r']})
        for o in k['textCut']:
            boxes.append(('text', o['r'], o['how'][:18] + ' ' + o['t'][:24]))
            add('text-odrezany', o['n'] + ' | ' + o['how'], {'krok': i, 'r': o['r'], 't': o['t']})
        for o in k['textOverlap']:
            boxes.append(('text', o['r'], 'prekryv: ' + o['ta'][:16] + ' / ' + o['tb'][:16]))
            add('text-prekryv', o['a'] + ' / ' + o['b'], {'krok': i, 'r': o['r'], 'ta': o['ta'], 'tb': o['tb'], 'op': [o['opA'], o['opB']]})
        for o in k['covered']:
            boxes.append(('zakryte', o['r'], 'zakryté: ' + o['t'][:24]))
            add('zakryte', o['float'] + ' → ' + o['n'], {'krok': i, 'r': o['r'], 't': o['t'], 'pin': o['pin'], 'koniec': o['atEnd']})
        for o in k['ctrlOut']:
            boxes.append(('pretecenie', o['r'], o['how'][:20] + ' ' + o['t'][:20]))
            add('ovladac-mimo', o['n'] + ' | ' + o['how'], {'krok': i, 'r': o['r'], 't': o['t']})
        for o in k['imgs']:
            boxes.append(('foto', o['r'], o['problem'][:40]))
            add('foto', o['src'] + ' | ' + o['problem'].split(' (')[0], {'krok': i, 'r': o['r'], 'problem': o['problem'], 'nw': o['nw'], 'op': o['op']})
        for o in k.get('moji', []):
            boxes.append(('text', o['r'], 'diakritika: ' + o['t'][:30]))
            add('diakritika', o['n'], {'krok': i, 't': o['t']})
        for o in k.get('fontMiss', []):
            add('pismo-rez', o['rez'], {'krok': i, 'n': o['n'], 't': o['t']})
        # kontrast
        for t in k['texty']:
            if t['r'][1] + t['r'][3] < 0 or t['r'][1] > k['vh']:
                continue
            res = kontrast(bez, t)
            if res and not res['ok']:
                boxes.append(('kontrast', t['r'], f"{res['r_med']}:1 ({res['r_worst']}) {t['t'][:18]}"))
                add('kontrast', t['n'] + ' | ' + t['t'][:30], {'krok': i, 'r': t['r'], 't': t['t'], 'fs': t['fs'], 'fw': t['fw'], 'color': t['color'], **res})
        # čierne pole
        frac, box, tmave = tma_polia(img)
        k['tma_pole'] = round(frac, 3)
        k['tma_podiel'] = round(tmave, 3)
        if frac > 0.25 and box:
            boxes.append(('tma', box, f'čierne pole {round(frac * 100)} %'))
            add('tma', f'krok {i}', {'krok': i, 'r': box, 'pole': round(frac, 3), 'tmave': round(tmave, 3)})
        an = draw_boxes(img, boxes)
        if boxes:
            an.save(os.path.join(dirp, f'ozn-{i:02d}.jpg'), quality=75)
        ims.append(an)
        labels.append(f"{i} y{k['y']}" + (f" ! {len(boxes)}" if boxes else '') + (f" tma{round(frac * 100)}%" if frac > 0.25 else ''))
    harok(ims, labels, os.path.join(HARKY, f'{rel}.jpg'), f"{stranka} {vp} ({rep['w']}×{rep['h']}, DPR {rep['dpr']}) – {rep['url'].split('?')[0].split('127.0.0.1')[-1]} – rámiky: červená pretečenie, oranžová plávajúce, fialová text, žltá kontrast, modrá čierne pole, tyrkys fotka, zelená zakryté")
    # písma z CDP: systémové náhrady
    pisma_zle = []
    for f in rep.get('fonty', []):
        sys_f = [p for p in f['pouzite'] if '(systém)' in p]
        if sys_f:
            pisma_zle.append({'n': f['n'], 't': f['t'], 'fam': f['fam'], 'w': f['w'], 'st': f['st'], 'pouzite': f['pouzite']})
    out = {'stranka': stranka, 'vp': vp, 'url': rep['url'], 'chyby': rep['chyby'], 'html': rep['meta']['html'],
           'pisma_systemove': pisma_zle, 'pisma_vsetky': rep.get('fonty', []),
           'nalezy': [dict(v, kroky=sorted(set(v['kroky']))) for v in nalezy.values()],
           'tma': [(i, k['tma_pole'], k['tma_podiel']) for i, k in enumerate(rep['kroky'])]}
    json.dump(out, open(os.path.join(dirp, 'analyza.json'), 'w'), ensure_ascii=False, indent=1)
    typy = {}
    for v in nalezy.values():
        typy[v['typ']] = typy.get(v['typ'], 0) + 1
    print(f"  {stranka} {vp}: {typy or 'bez nálezov'}; systémové písmo {len(pisma_zle)}; chyby {len(rep['chyby'])}")


def nacitanie(root):
    for dp, dn, fn in os.walk(root):
        if 'nacitanie.json' not in fn:
            continue
        rep = json.load(open(os.path.join(dp, 'nacitanie.json')))
        ims, labels, rows = [], [], []
        for f in rep['files']:
            p = os.path.join(dp, f)
            if not os.path.exists(p):
                continue
            img = Image.open(p)
            frac, box, tmave = tma_polia(img)
            boxes = [('tma', box, f'čierne pole {round(frac * 100)} %')] if frac > 0.25 and box else []
            ims.append(draw_boxes(img, boxes))
            labels.append(f"{f[1:5]} ms tma {round(tmave * 100)}% pole {round(frac * 100)}%" + (' !' if frac > 0.25 else ''))
            rows.append((f, round(frac, 3), round(tmave, 3)))
        rel = os.path.relpath(dp, A2).replace(os.sep, '_')
        harok(ims, labels, os.path.join(HARKY, f'{rel}.jpg'), f"načítanie {rep['stranka']} {rep['vp']} (Slow 4G) – {rep['url'].split('127.0.0.1')[-1]}", th=360)
        json.dump({'snimky': rows, 'html': rep['html'], 'chyby': rep['chyby']}, open(os.path.join(dp, 'analyza.json'), 'w'), ensure_ascii=False, indent=1)
        print('  načítanie', rel, [(r[0], r[1]) for r in rows])


def stavy(root):
    for vp in sorted(os.listdir(root)):
        p = os.path.join(root, vp, 'stavy.json')
        if not os.path.exists(p):
            continue
        res = json.load(open(p))
        ims, labels, souhrn = [], [], []
        for s in res:
            if 'snimka' not in s:
                souhrn.append({'stav': s['stav'], 'chyby': s.get('chyby')})
                continue
            img = Image.open(os.path.join(root, vp, s['snimka']))
            k = s['k']
            boxes = []
            for o in k['floatOverlap']:
                if min(o['opA'], o['opB']) >= 0.3:
                    boxes.append(('plavajuce', o['r'], f"{o['a'][:22]} × {o['b'][:22]}"))
            for o in k['floatOut']:
                boxes.append(('pretecenie', o['r'], 'mimo okna ' + o['n'][:30]))
            for o in k['offenders']:
                boxes.append(('pretecenie', o['r'], 'pretečenie ' + o['n'][:30]))
            for o in k['textCut']:
                boxes.append(('text', o['r'], o['how'][:18] + ' ' + o['t'][:24]))
            for o in k['textOverlap']:
                boxes.append(('text', o['r'], 'prekryv: ' + o['ta'][:16] + ' / ' + o['tb'][:16]))
            for o in k['covered']:
                boxes.append(('zakryte', o['r'], 'zakryté: ' + o['t'][:24]))
            for o in k['ctrlOut']:
                boxes.append(('pretecenie', o['r'], o['how'][:20] + ' ' + o['t'][:20]))
            for o in k['imgs']:
                boxes.append(('foto', o['r'], o['problem'][:40]))
            frac, box, tmave = tma_polia(img)
            if frac > 0.25 and box:
                boxes.append(('tma', box, f'čierne pole {round(frac * 100)} %'))
            an = draw_boxes(img, boxes)
            an.save(os.path.join(root, vp, 'ozn-' + s['snimka']), quality=75)
            ims.append(an)
            labels.append(s['stav'] + (f" ! {len(boxes)}" if boxes else '') + (' CHYBA' if s.get('chyba') else ''))
            souhrn.append({'stav': s['stav'], 'chyba': s.get('chyba'), 'boxy': [(b[0], b[2]) for b in boxes], 'floats': k['floats'], 'tma_pole': round(frac, 3)})
        harok(ims, labels, os.path.join(HARKY, f'stavy_{vp}.jpg'), f'interaktívne stavy {vp}')
        json.dump(souhrn, open(os.path.join(root, vp, 'analyza.json'), 'w'), ensure_ascii=False, indent=1)
        print('  stavy', vp, [(s['stav'], len(s.get('boxy', [])), s.get('chyba')) for s in souhrn if 'stav' in s])


if __name__ == '__main__':
    if sys.argv[1] == '--nacitanie':
        nacitanie(sys.argv[2])
    elif sys.argv[1] == '--stavy':
        stavy(sys.argv[2])
    else:
        jeden(sys.argv[1])
