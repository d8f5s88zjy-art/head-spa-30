#!/usr/bin/env python3
"""Oprava 1 – video pred/po: vľavo PRED (2687b6e), vpravo PO, snímky z op-predpo.cjs (režim video), 30 sn./s.
Použitie: python3 -I op-video.py --pred DIR --po DIR --out pred-po.mp4 [--max-mb 15] [--sirka 944]
"""
import argparse, json, os, shutil, subprocess, tempfile
from PIL import Image, ImageDraw, ImageFont

ap = argparse.ArgumentParser()
ap.add_argument('--pred', required=True); ap.add_argument('--po', required=True); ap.add_argument('--out', required=True)
ap.add_argument('--max-mb', type=float, default=15); ap.add_argument('--sirka', type=int, default=944); ap.add_argument('--fps', type=int, default=30)
a = ap.parse_args()
F = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'; FB = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
f_c = ImageFont.truetype(FB, 22); f_s = ImageFont.truetype(F, 17)
sp = {s['n']: s for s in json.load(open(os.path.join(a.pred, 'stavy.json'), encoding='utf-8'))['snimky']}
so = {s['n']: s for s in json.load(open(os.path.join(a.po, 'stavy.json'), encoding='utf-8'))['snimky']}
n = min(len(sp), len(so))
tmp = tempfile.mkdtemp(prefix='predpo-', dir=os.path.dirname(a.out) or '.')
W = a.sirka; BAR = 44; FOOT = 30
p = Image.open(os.path.join(a.pred, 'f0000.jpg')); H = round(W * p.height / p.width); H += H % 2
TW = 2 * W + 12; TH = BAR + H + FOOT
popis = {'rohozka': 'rohožka', 'sala': 'sála (Poď ďalej)', 'stol': 'stôl (Povedz, ako to chceš)', 'cakaren': 'čakáreň (Vzadu ťa čaká káva)', 'sala-rano': 'ranná sála (Komu zveríš hlavu?)'}
for i in range(n):
    im = Image.new('RGB', (TW, TH), (14, 13, 12)); dr = ImageDraw.Draw(im)
    l = Image.open(os.path.join(a.pred, f'f{i:04d}.jpg')).convert('RGB').resize((W, H), Image.BILINEAR)
    r = Image.open(os.path.join(a.po, f'f{i:04d}.jpg')).convert('RGB').resize((W, H), Image.BILINEAR)
    im.paste(l, (0, BAR)); im.paste(r, (W + 12, BAR))
    s1, s2 = sp[i], so[i]
    dr.text((12, 9), 'PRED (2687b6e)', font=f_c, fill=(255, 120, 110))
    dr.text((W + 24, 9), 'PO (oprava)', font=f_c, fill=(130, 230, 150))
    t = f"priehľadné pixely: {s1['a0_pct']:.1f} %".replace('.', ',')
    dr.text((W - 12 - dr.textlength(t, font=f_s), 13), t, font=f_s, fill=(235, 225, 215))
    t = f"priehľadné pixely: {s2['a0_pct']:.1f} %".replace('.', ',')
    dr.text((TW - 12 - dr.textlength(t, font=f_s), 13), t, font=f_s, fill=(235, 225, 215))
    kde = (popis.get(s1['zaber'], s1['zaber']) + (f"  ·  strih do ďalšieho záberu {s1['m']*100:.0f} %" if s1['druh'] == 'strih' else f"  ·  pohyb kamery {s1['t']*100:.0f} %"))
    dr.text((12, BAR + H + 7), 'skrol filmovou scénou ako na zázname (Chromium, skladanie ako Safari: alfa 0 = podklad stránky) · ' + kde, font=f_s, fill=(200, 192, 184))
    im.save(os.path.join(tmp, f'v{i:04d}.jpg'), 'JPEG', quality=90)
crf = 20
while True:
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-framerate', str(a.fps), '-i', os.path.join(tmp, 'v%04d.jpg'),
                    '-c:v', 'libx264', '-preset', 'medium', '-crf', str(crf), '-pix_fmt', 'yuv420p', '-movflags', '+faststart', a.out], check=True)
    mb = os.path.getsize(a.out) / 1048576
    if mb <= a.max_mb or crf >= 34: break
    crf += 3
shutil.rmtree(tmp)
print(a.out, f'{n} snímok, {n / a.fps:.1f} s, {mb:.1f} MB, crf {crf}, {TW}x{TH}')
