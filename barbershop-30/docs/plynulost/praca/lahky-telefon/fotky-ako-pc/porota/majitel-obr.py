import sys
from PIL import Image, ImageDraw, ImageFont
F = sys.argv[1]
fb = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 30)
fr = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 22)
PH = 1100  # výška telefónu v obrázku
pw = round(1290 * PH / 2796)
pcw = 1000; pch = round(900 * pcw / 1440)
rows = [('cakaren', 'Čakáreň'), ('stol', 'Pracovné miesto')]
W = pcw + 2 * pw + 4 * 40; H = 110 + len(rows) * (PH + 110)
out = Image.new('RGB', (W, H), (20, 19, 18)); d = ImageDraw.Draw(out)
d.text((40, 30), 'Tá istá fotka: počítač, telefón dnes, telefón po zmene', font=fb, fill=(240, 232, 220))
y = 110
for key, name in rows:
    pc = Image.open(f'{F}/raw/PC-{key}.png').convert('RGB').resize((pcw, pch), Image.LANCZOS)
    a = Image.open(f'{F}/raw430/A-{key}.png').convert('RGB').resize((pw, PH), Image.LANCZOS)
    b = Image.open(f'{F}/raw430/B-{key}.png').convert('RGB').resize((pw, PH), Image.LANCZOS)
    x = 40
    out.paste(pc, (x, y + (PH - pch) // 2)); d.text((x, y + (PH - pch) // 2 + pch + 12), f'{name}: počítač', font=fb, fill=(240, 232, 220))
    x += pcw + 40
    out.paste(a, (x, y)); d.text((x, y + PH + 12), 'telefón dnes', font=fb, fill=(200, 190, 180))
    d.text((x, y + PH + 50), 'len stred fotky', font=fr, fill=(170, 160, 150))
    x += pw + 40
    out.paste(b, (x, y)); d.rectangle([x - 4, y - 4, x + pw + 3, y + PH + 3], outline=(226, 106, 44), width=4)
    d.text((x, y + PH + 12), 'telefón po zmene', font=fb, fill=(226, 106, 44))
    d.text((x, y + PH + 50), 'celá fotka ako na počítači', font=fr, fill=(170, 160, 150))
    y += PH + 110
out.save(f'{F}/porota/pre-majitela-porovnanie-430.jpg', quality=84, optimize=True)
print(out.size)
