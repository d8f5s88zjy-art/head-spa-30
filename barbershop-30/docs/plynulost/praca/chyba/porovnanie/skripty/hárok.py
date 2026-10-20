# Kontaktný hárok: python3 -I hárok.py výstup.jpg šírka_dlaždice stĺpce súbor...
import sys
from PIL import Image, ImageDraw
out, tw, cols = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
fs = sys.argv[4:]
ims = []
for f in fs:
    im = Image.open(f).convert('RGB')
    h = int(im.height * tw / im.width)
    ims.append((f.rsplit('/', 1)[-1], im.resize((tw, h))))
rows = [ims[i:i + cols] for i in range(0, len(ims), cols)]
H = sum(max(i.height for _, i in r) + 22 for r in rows)
sheet = Image.new('RGB', (cols * (tw + 8), H), (40, 40, 40))
d = ImageDraw.Draw(sheet)
y = 0
for r in rows:
    x = 0
    for n, im in r:
        d.text((x + 4, y + 4), n, fill=(255, 220, 120))
        sheet.paste(im, (x, y + 20)); x += tw + 8
    y += max(i.height for _, i in r) + 22
sheet.save(out, quality=80)
print(out, sheet.size)
