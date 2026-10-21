# Vyhodnotenie screencastu čierneho štartu: podiel plochy s jasom < 20 v každej snímke po prvom vykreslení,
# pás snímok v 0/300/800/1500/3000 ms (snímka platná v danom čase = posledná s ts <= t0 + t), zmaže surové snímky.
# python3 -I tma.py <dir_scenára> <výstupný_pás.jpg> [--nechaj]
import json, os, sys
from PIL import Image, ImageDraw
d, out = sys.argv[1], sys.argv[2]
m = json.load(open(os.path.join(d, 'meta.json')))
t0 = m['t0']; fr = m['frames']
if m.get('fcp') is not None and m.get('origin') and m['sc'] not in ('spat', 'spat-2'):
    start = m['origin'] + m['fcp']
else:
    start = t0 + 30
def dark(f):
    im = Image.open(f).convert('L'); h = im.histogram(); n = sum(h)
    return sum(h[:20]) / n
res = []
for f in fr:
    if os.path.exists(f['file']):
        res.append((f['ts'] - t0, dark(f['file']), f['file']))
po = [r for r in res if r[0] + t0 >= start - 1]
# snímka platná vo chvíli FCP = posledná pred ním
pred = [r for r in res if r[0] + t0 < start - 1]
if pred: po = [pred[-1]] + po if (m['sc'] not in ('spat', 'spat-2')) else po
nad90 = [(round(t), round(x, 3)) for t, x, _ in po if x > 0.90]
konc = res[-1][1] if res else None
casy = [0, 300, 800, 1500, 3000]
vyber = []
for t in casy:
    c = [r for r in res if r[0] <= t]
    vyber.append((t, c[-1] if c else None))
ims = []
for t, r in vyber:
    if r is None:
        im = Image.new('RGB', (390, 844), (255, 255, 255)); lab = f'{t} ms: nic'
    else:
        im = Image.open(r[2]).convert('RGB'); lab = f'{t} ms (sn. {round(r[0])}) tma {r[1]*100:.0f}%'
    im = im.resize((390, round(390 * im.height / im.width)))
    can = Image.new('RGB', (im.width, im.height + 26), (40, 40, 40)); can.paste(im, (0, 26))
    ImageDraw.Draw(can).text((6, 6), lab, fill=(255, 220, 120)); ims.append(can)
Wt = sum(i.width + 6 for i in ims); Ht = max(i.height for i in ims)
sh = Image.new('RGB', (Wt, Ht), (0, 0, 0)); x = 0
for i in ims: sh.paste(i, (x, 0)); x += i.width + 6
sh.save(out, quality=82)
print(json.dumps({'sc': m['sc'], 'W': m['W'], 'snimok': len(res), 'fcp_ms_od_akcie': round(start - t0), 'po_fcp': len(po), 'nad90': nad90[:12], 'pocet_nad90': len(nad90),
                  'max_tma_po_fcp': round(max([x for _, x, _ in po], default=0), 3), 'tma_koniec': round(konc, 3) if konc is not None else None,
                  'vzorky': [{k: v for k, v in (z or {}).items() if k in ('t', 'y', 'h1', 'btn', 'lista', 'near', 'st', 'cls', 'gl', 'err')} for z in (m.get('vzorky') or [])],
                  'koniec': m.get('koniec'), 'poBF': m.get('poBF') or m.get('po')}, ensure_ascii=False))
if '--nechaj' not in sys.argv:
    for _, _, f in res: os.remove(f)
