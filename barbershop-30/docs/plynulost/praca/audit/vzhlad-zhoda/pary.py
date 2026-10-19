#!/usr/bin/env python3
"""Snímky vedľa seba: telefón (390 alebo 360) a počítač (1440 alebo 1920) pre tú istú polohu (beat).
python3 -I pary.py <mód: off|on|def> [telefon=p390] [pocitac=d1440]  -> pary/<mód>/<beat>.jpg"""
import sys, os, json, re
from PIL import Image, ImageDraw, ImageFont
mode = sys.argv[1]; ph = sys.argv[2] if len(sys.argv) > 2 else 'p390'; pc = sys.argv[3] if len(sys.argv) > 3 else 'd1440'
base = os.path.dirname(os.path.abspath(__file__))
A = json.load(open(f'{base}/shots/{ph}-{mode}/beats.json')); B = json.load(open(f'{base}/shots/{pc}-{mode}/beats.json'))
bm = {b['name']: b for b in B['beats'] if b['kind'] != 'krok'}
out = f'{base}/pary/{mode}-{ph}-{pc}'; os.makedirs(out, exist_ok=True)
try: font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 18)
except Exception: font = None
H = 900
for a in A['beats']:
    if a['kind'] == 'krok' or a['name'] not in bm: continue
    b = bm[a['name']]
    ia = Image.open(f"{base}/shots/{ph}-{mode}/{a['file']}").convert('RGB'); ib = Image.open(f"{base}/shots/{pc}-{mode}/{b['file']}").convert('RGB')
    ia = ia.resize((round(ia.width * H / ia.height), H), Image.LANCZOS); ib = ib.resize((round(ib.width * H / ib.height), H), Image.LANCZOS)
    sh = Image.new('RGB', (ia.width + ib.width + 12, H + 52), (60, 60, 60)); sh.paste(ia, (0, 52)); sh.paste(ib, (ia.width + 12, 52))
    d = ImageDraw.Draw(sh)
    def lab(x):
        m = x['imgs'][0] if x['imgs'] else None
        f = x.get('film')
        s = f"y{x['scrollY']} " + (f"{m['src'].split('/')[-1]} {m['zdroj_na_px']}px/px " if m else '') + (f"film {f['cur']} mix{f['mix']} dpr{f['dpr']} tex{f['size']}" if f else '') + f" písmo≥{x['fonts'][0] if x['fonts'] else '-'}px"
        return s
    d.text((4, 6), f"{ph}: {lab(a)}", fill=(255, 210, 140), font=font)
    d.text((4, 28), f"{pc} · {a['name']}: {lab(b)}", fill=(255, 210, 140), font=font)
    sh.save(f"{out}/{a['name']}.jpg", quality=86)
print(out, len(os.listdir(out)))
