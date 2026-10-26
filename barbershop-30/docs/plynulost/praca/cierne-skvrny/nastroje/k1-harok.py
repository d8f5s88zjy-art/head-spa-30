#!/usr/bin/env python3
"""K1 – hárok náhľadov škvŕn: pre každú skupinu škvŕn (výstup k1-suhrn.py --json) jeden náhľad plátna s rámčekmi
(purpurový = pohľad safari, tyrkysový = pohľad chromium, žltý prerušovaný = podozrenie) a pod ním popis.

Použitie: python3 -I k1-harok.py <suhrn.json> <výstup.jpg> [stĺpce=3] [šírka bunky=480]"""
import json
import sys
from PIL import Image, ImageDraw

src, out = sys.argv[1], sys.argv[2]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 3
cw = int(sys.argv[4]) if len(sys.argv) > 4 else 480
d = json.load(open(src))
cells = []
for b in d['behy']:
    for g in b['skupiny']:
        if not g.get('nahlad'):
            continue
        cells.append((b['beh'], g))
if not cells:
    print('žiadne náhľady')
    sys.exit(0)
ims = []
for beh, g in cells:
    im = Image.open(g['nahlad']).convert('RGB')
    h = round(im.height * cw / im.width)
    ims.append((im.resize((cw, h)), beh, g))
ch = max(i[0].height for i in ims) + 44
rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (cols * cw, rows * ch), (255, 255, 255))
dr = ImageDraw.Draw(sheet)
for k, (im, beh, g) in enumerate(ims):
    x, y = (k % cols) * cw, (k // cols) * ch
    sheet.paste(im, (x, y))
    t1 = '%s | %s %s %s' % (beh, g['pohlad'], g['zaber'], g['skupina'].split('|')[-1])
    t2 = 'y %s-%s  max %.2f %%  alfa0 %.2f  det %d' % (g['scrollY'][0], g['scrollY'][1], g['max_plocha_pct'], g['alfa0_podiel'] or 0, g['detekcie'])
    dr.text((x + 4, y + im.height + 4), t1, fill=(0, 0, 0))
    dr.text((x + 4, y + im.height + 22), t2, fill=(0, 0, 0))
sheet.save(out, quality=82)
print(out, sheet.size, len(ims))
