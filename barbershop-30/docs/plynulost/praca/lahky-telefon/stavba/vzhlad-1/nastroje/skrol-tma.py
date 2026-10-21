# Vyhodnotenie screencastu skrolu: snímky s > 90 % plochy pod jasom 20, pás okolo skoku z menu; zmaže surové snímky.
# python3 -I skrol-tma.py <dir> <out_pas.jpg>
import json, os, sys, shutil
from PIL import Image, ImageDraw
d, out = sys.argv[1], sys.argv[2]
m = json.load(open(d + '/meta.json')); t0 = m['t0']; fr = m['frames']
res = []
for f in fr:
    im = Image.open(f['file']).convert('L'); h = im.histogram(); res.append((f['ts'] - t0, sum(h[:20]) / sum(h), f['file']))
po = [r for r in res if r[0] > 2600]
nad = [(round(t), round(x, 3)) for t, x, _ in po if x > 0.9]
nad80 = [(round(t), round(x, 3)) for t, x, _ in po if x > 0.8]
ts = m['tSkok']; casy = [ts - 100, ts + 120, ts + 250, ts + 500, ts + 1000, ts + 2000]
ims = []
for t in casy:
    c = [r for r in res if r[0] <= t]; r = c[-1]
    im = Image.open(r[2]).convert('RGB'); im = im.resize((300, round(300 * im.height / im.width)))
    can = Image.new('RGB', (300, im.height + 24), (40, 40, 40)); can.paste(im, (0, 24))
    ImageDraw.Draw(can).text((5, 5), f"skok {round(t - ts):+d} ms (sn. {round(r[0] - ts):+d}) tma {r[1]*100:.0f}%", fill=(255, 220, 120)); ims.append(can)
sh = Image.new('RGB', (sum(i.width + 6 for i in ims), max(i.height for i in ims))); x = 0
for i in ims: sh.paste(i, (x, 0)); x += i.width + 6
sh.save(out, quality=82)
print(json.dumps({'snimok_po_starte': len(po), 'nad90': nad[:20], 'pocet_nad90': len(nad), 'pocet_nad80': len(nad80), 'nad80': nad80[:10], 'max': round(max(x for _, x, _ in po), 3)}))
shutil.copy(d + '/meta.json', out.replace('.jpg', '.json'))
shutil.rmtree(d + '/f')
