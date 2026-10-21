# Pás snímok screencastu skrol.mjs v zadaných časoch od t0 (ms) s popisom stavu sondy: python3 -I pas2.py <dir> <out.jpg> t1,t2,... [nadpis]
import json, sys
from PIL import Image, ImageDraw
d, out, ts = sys.argv[1], sys.argv[2], [int(x) for x in sys.argv[3].split(',')]
nad = sys.argv[4] if len(sys.argv) > 4 else ''
m = json.load(open(d + '/meta.json')); fr = m['frames']; t0 = m['t0']; seg = m['sonda'].get('seg', [])
# seg časy sú performance.now() stránky; t0 je čas pred goto, posun ~ zanedbateľný (rádovo desiatky ms)
ims = []
for t in ts:
    c = [f for f in fr if f['ts'] - t0 <= t]; f = c[-1]
    k = [s['k'] for s in seg if s['od'] <= t <= s['do'] + 20]
    im = Image.open(f['file']).convert('RGB'); im = im.resize((300, round(300 * im.height / im.width)))
    h = im.convert('L').histogram(); tma = sum(h[:20]) / sum(h)
    can = Image.new('RGB', (300, im.height + 38), (40, 40, 40)); can.paste(im, (0, 38))
    dr = ImageDraw.Draw(can); dr.text((5, 4), f"{nad} {t} ms (sn. {round(f['ts'] - t0)}) tma {tma*100:.0f}%", fill=(255, 220, 120)); dr.text((5, 20), (k[-1] if k else '-')[:48], fill=(200, 200, 200)); ims.append(can)
sh = Image.new('RGB', (sum(i.width + 6 for i in ims), max(i.height for i in ims))); x = 0
for i in ims: sh.paste(i, (x, 0)); x += i.width + 6
sh.save(out, quality=82)
