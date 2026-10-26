#!/usr/bin/env python3
"""Oprava 1 – hárok pred/po pre majiteľa: záznam | PRED (2687b6e) | PO (HEAD), rovnaké chvíle ako na zázname.
Použitie: python3 -I op-harok.py --ref K4-referencie.json --zaznam DIR --pred DIR --po DIR --out pred-po.jpg [--max-mb 2.5]
"""
import argparse, json, os
from PIL import Image, ImageDraw, ImageFont

ap = argparse.ArgumentParser()
ap.add_argument('--ref', required=True); ap.add_argument('--zaznam', required=True)
ap.add_argument('--pred', required=True); ap.add_argument('--po', required=True)
ap.add_argument('--out', required=True); ap.add_argument('--max-mb', type=float, default=2.5)
ap.add_argument('--nadpis', default='BARBERSHOP 30 – filmová scéna: čierne škvrny pred a po oprave')
a = ap.parse_args()

F = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
FB = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
f_h = ImageFont.truetype(FB, 30); f_c = ImageFont.truetype(FB, 20); f_r = ImageFont.truetype(F, 19); f_s = ImageFont.truetype(F, 16)
ref = json.load(open(a.ref, encoding='utf-8'))
chvile = ref['chvile']
stavy = {}
for d in (a.pred, a.po):
    try:
        for s in json.load(open(os.path.join(d, 'stavy.json'), encoding='utf-8'))['snimky']: stavy[(d, s['id'])] = s
    except Exception: pass

CW = 740                      # šírka stĺpca PRED/PO
G = 14; PAD = 24
rows = []
for c in chvile:
    zp = os.path.join(a.zaznam, f"z-{c['zaznam_s']}.jpg")
    z = Image.open(zp).convert('RGB')
    p1 = Image.open(os.path.join(a.pred, c['id'] + '.jpg')).convert('RGB')
    p2 = Image.open(os.path.join(a.po, c['id'] + '.jpg')).convert('RGB')
    rh = round(CW * p1.height / p1.width)
    p1 = p1.resize((CW, rh), Image.LANCZOS); p2 = p2.resize((CW, rh), Image.LANCZOS)
    z = z.resize((round(rh * z.width / z.height), rh), Image.LANCZOS)
    rows.append((c, z, p1, p2, rh))
ZW = max(r[1].width for r in rows)
W = PAD + ZW + G + CW + G + CW + PAD
HEAD = 150; ROWH = 44; FOOT = 110
H = HEAD + sum(r[4] + ROWH + G for r in rows) + FOOT
im = Image.new('RGB', (W, H), (246, 243, 238)); dr = ImageDraw.Draw(im)
dr.text((PAD, 22), a.nadpis, font=f_h, fill=(20, 18, 16))
dr.text((PAD, 66), 'Rovnaké chvíle ako na zázname majiteľa z 26. 10. (Safari na Macu). PRED = commit 2687b6e, PO = oprava film.js. '
        'Snímky sú z Chromia (SwiftShader, 1512 × 830), len plátno filmu bez textu stránky.', font=f_s, fill=(70, 66, 60))
dr.text((PAD, 88), 'Skladanie ako v Safari: pixel plátna s alfou 0 ukáže podklad stránky (#0e0d0c). Pred opravou mal shader v alfe hĺbku '
        '(0 = koniec miestnosti), po oprave je alfa 1 a plátno je bez alfy.', font=f_s, fill=(70, 66, 60))
y = HEAD - 32
dr.text((PAD, y), 'záznam majiteľa', font=f_c, fill=(20, 18, 16))
dr.text((PAD + ZW + G, y), 'PRED (2687b6e)', font=f_c, fill=(160, 30, 30))
dr.text((PAD + ZW + G + CW + G, y), 'PO (oprava)', font=f_c, fill=(30, 110, 50))
y = HEAD
for c, z, p1, p2, rh in rows:
    s1 = stavy.get((a.pred, c['id'])); s2 = stavy.get((a.po, c['id']))
    t1 = f"priehľadné pixely (alfa 0): {s1['a0_pct']:.2f} %".replace('.', ',') if s1 else ''
    t2 = f"priehľadné pixely (alfa 0): {s2['a0_pct']:.2f} %".replace('.', ',') if s2 else ''
    lab = f"{c['zaber']} · záznam {str(c['zaznam_s']).replace('.', ',')} s · {c['popis']}"
    dr.text((PAD, y), lab, font=f_r, fill=(20, 18, 16))
    y += ROWH - 12
    im.paste(z, (PAD + (ZW - z.width) // 2, y)); im.paste(p1, (PAD + ZW + G, y)); im.paste(p2, (PAD + ZW + G + CW + G, y))
    dr.text((PAD + ZW + G + 10, y + rh - 26), t1, font=f_s, fill=(255, 235, 235))
    dr.text((PAD + ZW + G + CW + G + 10, y + rh - 26), t2, font=f_s, fill=(230, 255, 235))
    y += rh + G + 12
dr.text((PAD, H - FOOT + 18), 'Oprava (assets/film.js): 1) priamy prechod píše alfu 1 (alfa = hĺbka ostáva len v textúre prechodu); 2) plátno bez alfy (vlastný WebGL2 kontext alpha:false);',
        font=f_s, fill=(70, 66, 60))
dr.text((PAD, H - FOOT + 40), '3) okraj fotky bez hĺbky (strihy popredia už nevťahujú okraj); 4) strih popredia na telefóne počíta v páse fotky; 5) mriežka obojstranná; 6) pri strate grafiky zálohy namiesto tmy.',
        font=f_s, fill=(70, 66, 60))
dr.text((PAD, H - FOOT + 62), 'RGB záberov v pokoji sa nemení (overené pixel po pixeli), hĺbka, pohyb a prechody ostávajú.', font=f_s, fill=(70, 66, 60))
q = 88
while True:
    im.save(a.out, 'JPEG', quality=q, optimize=True, subsampling=1)
    if os.path.getsize(a.out) <= a.max_mb * 1024 * 1024 or q <= 50: break
    q -= 6
print(a.out, im.size, os.path.getsize(a.out) // 1024, 'kB, kvalita', q)
