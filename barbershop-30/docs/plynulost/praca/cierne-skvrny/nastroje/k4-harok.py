# hárok snímok so značkou čísla snímky a času: k4-harok.py <priečinok snímok> <výstup.jpg> <od> <do> <krok> [stĺpce] [mierka]
import sys, os
from PIL import Image, ImageDraw, ImageFont
src, out, a, b, step = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), int(sys.argv[5])
cols = int(sys.argv[6]) if len(sys.argv) > 6 else 8
sc = float(sys.argv[7]) if len(sys.argv) > 7 else 0.5
fn = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf', 14)
ids = list(range(a, b + 1, step))
ims = []
for i in ids:
    im = Image.open(os.path.join(src, 'f%04d.jpg' % i)).convert('RGB')
    im = im.resize((int(im.width * sc), int(im.height * sc)))
    d = ImageDraw.Draw(im)
    t = '%d %.2fs' % (i, (i - 1) / 30)
    d.rectangle([0, 0, 110, 16], fill=(255, 255, 0)); d.text((2, 0), t, fill=(0, 0, 0), font=fn)
    ims.append(im)
w, h = ims[0].size
rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (cols * w, rows * h), (128, 128, 128))
for k, im in enumerate(ims):
    sheet.paste(im, ((k % cols) * w, (k // cols) * h))
sheet.save(out, quality=85)
print(out, sheet.size)
