# Hárok záznam vs. reprodukcia: riadok = chvíľa; stĺpce: snímka zo záznamu (Safari) | Chromium bez zásahu |
# alfa plátna (čierna = 0) | simulácia „alfa 0 = diera“. Použitie: k4-porovnanie.py <snímky> <reprodukcia-dir> <výstup.jpg>
import sys, os
from PIL import Image, ImageDraw, ImageFont
sn, rd, out = sys.argv[1:4]
fn = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 17)
fb = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 19)
ROWS = [  # (snímka záznamu, id reprodukcie, popis)
    (225, 'sala-t50', 'sala (Poď ďalej) – záznam 7,47 s'),
    (437, 'cakaren-t50', 'cakaren (Vzadu ťa čaká káva) – záznam 14,53 s'),
    (560, 'sala-rano-t65', 'sala-rano (Komu zveríš hlavu?) – záznam 18,63 s'),
    (330, 'stol-t50', 'stol (Povedz, ako to chceš) – záznam 10,97 s, kontrola: čisté'),
]
H = 430
CROP = (0.08, 0.0, 0.70, 1.0)   # výrez okna 1350×960 podobný tomu, čo zachytil telefón (stred obrazovky)
cols = ['záznam (Safari, telefón)', 'Chromium bez zásahu', 'alfa plátna (čierna = 0)', 'simulácia: alfa 0 = diera']
tiles = []
for fr, i, desc in ROWS:
    v = Image.open(os.path.join(sn, 'f%04d.jpg' % fr)).convert('RGB')
    v = v.resize((int(v.width * H / v.height), H))
    row = [v]
    for p in [os.path.join(rd, 'chromium', i + '.jpg'), os.path.join(rd, 'alfa', i + '-alfa.jpg'), os.path.join(rd, 'alfa', i + '-sim.jpg')]:
        if os.path.exists(p):
            im = Image.open(p).convert('RGB')
            w, h = im.size
            im = im.crop((int(CROP[0] * w), int(CROP[1] * h), int(CROP[2] * w), int(CROP[3] * h)))
            im = im.resize((int(im.width * H / im.height), H))
        else:
            im = Image.new('RGB', (300, H), (90, 90, 90))
        row.append(im)
    tiles.append((desc, row))
cw = [max(r[1][k].width for r in tiles) for k in range(4)]
W = sum(cw) + 5 * 8
HT = 34 + len(tiles) * (H + 34) + 8
sheet = Image.new('RGB', (W, HT), (235, 232, 226))
dr = ImageDraw.Draw(sheet)
x = 8
for k, c in enumerate(cols):
    dr.text((x, 8), c, fill=(20, 20, 20), font=fb); x += cw[k] + 8
y = 34
for desc, row in tiles:
    dr.text((8, y + 6), desc, fill=(20, 20, 20), font=fn)
    y += 30
    x = 8
    for k, im in enumerate(row):
        sheet.paste(im, (x, y)); x += cw[k] + 8
    y += H + 4
sheet.save(out, quality=86)
print(out, sheet.size)
