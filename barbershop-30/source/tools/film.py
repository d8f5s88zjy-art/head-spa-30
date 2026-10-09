#!/usr/bin/env python3
"""Film prehliadky: z vybraných fotiek vyrobí zábery pre assets/img/film/ – šírky 2172/1448/1086
v AVIF aj WebP a hĺbkovú mapu <meno>-hlbka.webp (svetlá = blízko) cez Depth Anything V2 (ONNX, lokálne).
Spustenie z koreňa barbershop-30: python3 -I source/tools/film.py [meno ...]"""
import os, sys, subprocess, json
from PIL import Image, ImageOps
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'assets', 'img', 'film'); os.makedirs(OUT, exist_ok=True)
MODEL = '/tmp/claude-0/-home-user/9632978b-2b69-5a1e-a151-fbbea674fc3a/scratchpad/depth/model.onnx'
G = os.path.join(ROOT, 'source', 'web-povodny', 'gallery'); F = os.path.join(ROOT, 'source', 'photos'); SL = os.path.join(ROOT, 'source', 'web-povodny', 'slider')
# meno záberu: (zdroj, popis miesta)
SHOTS = {
  'vstup':        (G+'/43.jpg', 'Vstup z Mostnej ulice'),
  'recepcia':     (G+'/35.jpg', 'Recepcia a predná sála'),
  'sala':         (G+'/38.jpg', 'Hlavná sála'),
  'kreslo':       (G+'/28.jpg', 'Kreslo pri okne'),
  'stol':         (G+'/40.jpg', 'Pracovné miesto'),
  'naradie':      (G+'/39.jpg', 'Pomády, štetka a karafa'),
  'zadna':        (G+'/31.jpg', 'Zadná miestnosť'),
  'cakaren':      (G+'/36.jpg', 'Kútik s pumpou Route 66'),
  'sala-rano':    (G+'/33.jpg', 'Sála v rannom svetle'),
  'kreslo-stred': (G+'/34.jpg', 'Kreslo uprostred sály'),
  'kava':         (G+'/41.jpg', 'Káva pre hostí'),
  'sud':          (G+'/30.jpg', 'Predná sála so sudom'),
  'noznice':      (SL+'/4.jpg', 'Nožnice a hrebeň'),
  # úvod: hneď za dverami, na rohožke (1920 px; súbor -2172 je originál bez zväčšenia)
  'rohozka':      (SL+'/3.jpg', 'Na rohožke, hneď za dverami'),
}
WIDTHS = (2172, 1448, 1086)
only = sys.argv[1:]
man = {}
for name,(src,place) in SHOTS.items():
    if only and name not in only: continue
    im = ImageOps.exif_transpose(Image.open(src)).convert('RGB'); W,H = im.size
    for w in WIDTHS:
        r = im if w >= W else im.resize((w, round(H*w/W)), Image.LANCZOS)
        r.save(f'{OUT}/{name}-{w}.avif', quality=58, speed=6); r.save(f'{OUT}/{name}-{w}.webp', quality=80, method=5)
    subprocess.run([sys.executable, '-I', os.path.join(ROOT,'source','tools','hlbka.py'), MODEL, src, f'{OUT}/{name}-hlbka.webp'], check=True, stdout=subprocess.DEVNULL)
    sizes = {w: os.path.getsize(f'{OUT}/{name}-{w}.avif') for w in WIDTHS}
    man[name] = {'source': os.path.relpath(src, ROOT), 'place': place, 'width': W, 'height': H, 'avif': sizes, 'hlbka': os.path.getsize(f'{OUT}/{name}-hlbka.webp')}
    print(name, W, H, {w: round(s/1024) for w,s in sizes.items()}, 'KB', flush=True)
mp = os.path.join(OUT, 'film.json'); old = json.load(open(mp)) if os.path.exists(mp) else {}; old.update(man); json.dump(old, open(mp,'w'), ensure_ascii=False, indent=1)
print('done', len(man))
