# Porovnávací obrázok: dvojice (lite | D1) pre každú kartu, s priemerným rozdielom jasu v percentách.
# python3 -I porovnaj.py <A.json> <B.json> <out.jpg> <nazovA> <nazovB> [mierka] [stĺpce]
import json, sys
from PIL import Image, ImageDraw, ImageChops, ImageStat
a, b = json.load(open(sys.argv[1])), json.load(open(sys.argv[2])); out = sys.argv[3]; na, nb = sys.argv[4], sys.argv[5]
sc = float(sys.argv[6]) if len(sys.argv) > 6 else 0.5; cols = int(sys.argv[7]) if len(sys.argv) > 7 else 3
pairs = []; rep = []
for x, y in zip(a['out'], b['out']):
    ia, ib = Image.open(x['f']).convert('RGB'), Image.open(y['f']).convert('RGB')
    d = ImageStat.Stat(ImageChops.difference(ia.convert('L'), ib.convert('L'))).mean[0] / 255 * 100
    # rozdiel mimo lišty (horných 70 px) a spodných 90 px (tlačidlá, pätička)
    h = ia.height; dm = ImageStat.Stat(ImageChops.difference(ia.convert('L').crop((0, 70, ia.width, h - 90)), ib.convert('L').crop((0, 70, ib.width, h - 90)))).mean[0] / 255 * 100
    rep.append({'karta': x['i'], 'shot': x['shot'], 'rozdiel_%': round(d, 2), 'bez_listy_a_spodku_%': round(dm, 2), 'A': x['shown'], 'B': y['shown']})
    w2, h2 = int(ia.width * sc), int(ia.height * sc)
    can = Image.new('RGB', (w2 * 2 + 4, h2 + 30), (30, 30, 30)); can.paste(ia.resize((w2, h2)), (0, 30)); can.paste(ib.resize((w2, h2)), (w2 + 4, 30))
    dr = ImageDraw.Draw(can); dr.text((4, 3), f"{x['i']} {x['shot']}  {na} | {nb}", fill=(255, 220, 120)); dr.text((4, 16), f"rozdiel {d:.1f} % (bez lišty/spodku {dm:.1f} %)", fill=(200, 200, 200))
    pairs.append(can)
W1, H1 = pairs[0].size; rows = (len(pairs) + cols - 1) // cols
sh = Image.new('RGB', (cols * (W1 + 10), rows * (H1 + 10)), (0, 0, 0))
for k, p in enumerate(pairs): sh.paste(p, ((k % cols) * (W1 + 10), (k // cols) * (H1 + 10)))
sh.save(out, quality=85)
print(json.dumps(rep, ensure_ascii=False))
