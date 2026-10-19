"""Vyhodnotenie čiernych okien zo záznamu cierne.mjs (spúšťať: python3 -I cierne.py <priečinok>).
Blok 10 x 10 px je prázdny tmavý, keď má priemerný jas < 30 a smerodajnú odchýlku < 5 (jednofarebná plocha
farby pozadia #0E0D0C / #171412 bez obrazu). Riadok snímky je prázdny, keď sú prázdne všetky jeho bloky.
Čierne okno = súvislý pás prázdnych riadkov cez celú šírku vyšší ako 20 % výšky okna (= viac ako 20 % plochy),
trvajúci dlhšie ako 150 ms (ZADANIE 2). Pásy s textom (cenník, kontakt) majú medzery najviac asi 17 % výšky,
otvorené menu 18 %, preto ich prah neoznačí; snímky s otvoreným menu sa navyše vynechávajú (scenár menu-otvorene).
Poloha skrolu z metadát screencastu počas zotrvačnosti zaostáva za obrazom, preto sa pásy podľa polohy nevynímajú."""
import json, os, sys
from PIL import Image
import numpy as np

d = sys.argv[1]
meta = json.load(open(os.path.join(d, 'snimky.json')))
vh, vw, pasy, sek = meta['vh'], meta['vw'], meta['pasy'], meta['sekcie']
B = 10

def sekcia(y):
    c = y + vh / 2
    best = sek[0][0] if sek else '-'
    for s in sek:
        if c >= s[1]:
            best = s[0]
    return best

rows = []
for fr in meta['snimky']:
    if fr['s'] in ('menu-otvorene', 'start'):
        continue
    try:
        im = Image.open(os.path.join(d, fr['f'])).convert('L')
    except Exception:
        continue
    a = np.asarray(im, dtype=np.float32)
    h, w = a.shape
    a = a[: h - h % B, : w - w % B].reshape(h // B, B, w // B, B).transpose(0, 2, 1, 3).reshape(h // B, w // B, B * B)
    e = (a.mean(axis=2) < 30) & (a.std(axis=2) < 5)          # prázdne tmavé bloky
    riadky = e.all(axis=1)
    best = cur = 0
    for r in riadky:
        cur = cur + B if r else 0
        best = max(best, cur)
    spolu, prazdne = e.size, int(e.sum())
    rows.append({'f': fr['f'], 't': fr['t'], 'y': fr['y'] or 0, 's': fr['s'], 'plocha': spolu, 'podiel': best / h, 'tmave': prazdne / spolu if spolu else 0})

# behy snímok s podielom > 20 %
out = {'meno': meta['meno'], 'snimok': len(rows), 'scenare': {}}
by = {}
for r in rows:
    by.setdefault(r['s'], []).append(r)
for s, rs in by.items():
    rs.sort(key=lambda r: r['t'])
    runs, cur = [], None
    for i, r in enumerate(rs):
        bad = r['podiel'] > 0.2 and r['plocha'] > 0
        if bad and cur is None:
            cur = {'od': r['t'], 'y': r['y'], 'sekcia': sekcia(r['y']) + ' (podľa metadát, pri švihu zaostáva)', 'max': r['podiel'], 'snimka': r['f']}
        if bad:
            if r['podiel'] > cur['max']:
                cur['max'], cur['snimka'] = r['podiel'], r['f']
            cur['do'] = rs[i + 1]['t'] if i + 1 < len(rs) else r['t'] + 0.016
        if not bad and cur is not None:
            runs.append(cur); cur = None
    if cur is not None:
        runs.append(cur)
    zle = [x for x in runs if (x['do'] - x['od']) * 1000 > 150]
    out['scenare'][s] = {
        'snimok': len(rs),
        'maxPodiel': round(max((r['podiel'] for r in rs), default=0), 3), 'maxTmavychBlokov': round(max((r['tmave'] for r in rs), default=0), 3),
        'oknaNad150ms': [{'ms': round((x['do'] - x['od']) * 1000), 'podiel': round(x['max'], 2), 'y': round(x['y']), 'sekcia': x['sekcia'], 'snimka': x['snimka']} for x in zle],
        'spoluMs': round(sum((x['do'] - x['od']) * 1000 for x in zle)),
    }
json.dump(out, open(os.path.join(d, 'cierne.json'), 'w'), ensure_ascii=False, indent=1)

# kontaktný hárok najhorších snímok (dôkaz)
worst = sorted(rows, key=lambda r: -r['podiel'])[:8]
worst = [w for w in worst if w['podiel'] > 0.2]
if worst:
    ims = [Image.open(os.path.join(d, w['f'])).convert('RGB') for w in worst]
    tw = sum(i.size[0] for i in ims) + 6 * (len(ims) - 1)
    th = max(i.size[1] for i in ims)
    sheet = Image.new('RGB', (tw, th), (255, 255, 255))
    x = 0
    for i in ims:
        sheet.paste(i, (x, 0)); x += i.size[0] + 6
    sheet.save(os.path.join(d, 'najhorsie.png'))
    out['najhorsie'] = [(w['f'], w['s'], round(w['podiel'], 2), round(w['y'])) for w in worst]
print(json.dumps(out, ensure_ascii=False, indent=1)[:6000])
