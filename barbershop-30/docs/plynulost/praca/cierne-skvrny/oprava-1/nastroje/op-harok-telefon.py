#!/usr/bin/env python3
"""Oprava 1 – hárok pre telefón (390 × 844 @2): strih popredia čakáreň → ranná sála (zvislý) a káva → sud, PRED vs. PO.
Použitie: python3 -I op-harok-telefon.py --pred DIR --po DIR --out pred-po-telefon.jpg
"""
import argparse, json, os
from PIL import Image, ImageDraw, ImageFont

ap = argparse.ArgumentParser()
ap.add_argument('--pred', required=True); ap.add_argument('--po', required=True); ap.add_argument('--out', required=True)
a = ap.parse_args()
F = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'; FB = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
f_h = ImageFont.truetype(FB, 28); f_c = ImageFont.truetype(FB, 19); f_s = ImageFont.truetype(F, 16)
st = {}
for d in (a.pred, a.po):
    for s in json.load(open(os.path.join(d, 'stavy.json'), encoding='utf-8'))['snimky']: st[(d, s['id'])] = s
ids = [s['id'] for s in json.load(open(os.path.join(a.po, 'stavy.json'), encoding='utf-8'))['snimky']]
CW = 250; PAD = 22; G = 10
im0 = Image.open(os.path.join(a.po, ids[0] + '.jpg')); CH = round(CW * im0.height / im0.width)
W = PAD * 2 + len(ids) * (CW + G) - G
HEAD = 120; LAB = 30; H = HEAD + 2 * (LAB + CH + G) + 70
im = Image.new('RGB', (W, H), (246, 243, 238)); dr = ImageDraw.Draw(im)
dr.text((PAD, 18), 'BARBERSHOP 30 – telefón: strih popredia (čakáreň → ranná sála, káva → sud) pred a po oprave', font=f_h, fill=(20, 18, 16))
dr.text((PAD, 58), 'Telefón na výšku: fotka je v hornom páse plátna, pod ním farba stránky. Strih popredia pred opravou bral „predmet v popredí“ aj spod pásu,', font=f_s, fill=(70, 66, 60))
dr.text((PAD, 80), 'a cez obraz natiahol čiernu (až 96 % plátna tmavé). Po oprave počíta v páse fotky. Snímky: Chromium (SwiftShader), 390 × 844 @2, produkčné farby, len plátno.', font=f_s, fill=(70, 66, 60))
def popis(s):
    z = {'cakaren': 'čakáreň', 'kava': 'káva'}.get(s['zaber'], s['zaber'])
    return f"{z} · záber v pokoji" if s['druh'] == 'zaber' else f"{z} → ďalší · strih {s['v'] * 100:.0f} %"
for r, (d, lab, col) in enumerate([(a.pred, 'PRED (2687b6e)', (160, 30, 30)), (a.po, 'PO (oprava)', (30, 110, 50))]):
    y = HEAD + r * (LAB + CH + G)
    dr.text((PAD, y), lab, font=f_c, fill=col)
    for i, id_ in enumerate(ids):
        x = PAD + i * (CW + G)
        p = Image.open(os.path.join(d, id_ + '.jpg')).convert('RGB').resize((CW, CH), Image.LANCZOS)
        im.paste(p, (x, y + LAB))
        s = st.get((d, id_))
        if r == 0: dr.text((x, y + LAB - 2 - 18 + 0), '', font=f_s)
        dr.text((x + 6, y + LAB + CH - 40), popis(s), font=f_s, fill=(240, 232, 224))
        dr.text((x + 6, y + LAB + CH - 20), f"tmavé pixely: {s['tmave_pct']:.1f} %".replace('.', ','), font=f_s, fill=(240, 232, 224))
dr.text((PAD, H - 50), 'Tmavé pixely = jas pod 48/255 na celom plátne; dolných 44 % plátna je vždy farba stránky (pod pásom, v HTML ho zakrýva text), preto je ~40 % bežný stav.', font=f_s, fill=(70, 66, 60))
im.save(a.out, 'JPEG', quality=86, optimize=True)
print(a.out, im.size, os.path.getsize(a.out) // 1024, 'kB')
