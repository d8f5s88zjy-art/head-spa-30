# Pás snímok screencastu v zadaných časoch: python3 -I pas.py <dir> <out.jpg> t1,t2,...
import json, sys
from PIL import Image, ImageDraw
d, out, ts = sys.argv[1], sys.argv[2], [int(x) for x in sys.argv[3].split(',')]
m = json.load(open(d + '/meta.json')); fr = m['frames']; ims = []
for t in ts:
    c = [f for f in fr if f['ts'] - m['t0'] <= t]; f = c[-1]
    im = Image.open(f['file']).convert('RGB'); im = im.resize((390, round(390 * im.height / im.width)))
    can = Image.new('RGB', (390, im.height + 26), (40, 40, 40)); can.paste(im, (0, 26))
    ImageDraw.Draw(can).text((6, 6), f"{m['sc']} {m['W']}: {t} ms (sn. {round(f['ts'] - m['t0'])})", fill=(255, 220, 120)); ims.append(can)
sh = Image.new('RGB', (sum(i.width + 6 for i in ims), max(i.height for i in ims))); x = 0
for i in ims: sh.paste(i, (x, 0)); x += i.width + 6
sh.save(out, quality=82)
