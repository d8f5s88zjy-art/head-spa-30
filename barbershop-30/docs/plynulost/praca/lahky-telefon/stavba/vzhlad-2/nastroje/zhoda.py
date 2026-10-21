# Časová os zhody snímok screencastu s konečnou snímkou (priemerný rozdiel jasu, horná 2/3 okna = fotka bez textu karty).
# python3 -I zhoda.py <dir_scenára>
import json, sys
from PIL import Image, ImageChops, ImageStat
d = sys.argv[1]; m = json.load(open(d + '/meta.json'))
fr = m['frames']
def load(f):
    im = Image.open(f).convert('L'); w, h = im.size; return im.crop((0, int(h * 0.1), w, int(h * 0.6)))
ref = load(fr[-1]['file']); prev = None; out = []
for f in fr:
    im = load(f['file']); v = round(ImageStat.Stat(ImageChops.difference(im, ref)).mean[0], 1)
    if prev is None or abs(v - prev) > 3: out.append((round(f['ts'] - m['t0']), v))
    prev = v
print(d.split('/')[-1], 'fcp', round(m['origin'] + (m['fcp'] or 0) - m['t0']) if m.get('fcp') else None, out)
