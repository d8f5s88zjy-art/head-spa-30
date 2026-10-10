#!/usr/bin/env python3
"""Film prehliadky: z vybraných fotiek vyrobí zábery pre assets/img/film/ a hĺbkové mapy
(<meno>-hlbka.webp, svetlá = blízko) cez Depth Anything V2 (ONNX, lokálne).

Maximálny detail: každý záber má stupne šírky 1086 / 1448 / 2172 / 2896 px (a fasáda vstupu aj
4096 px pre nájazd k dverám v úvode), nikdy sa nezväčšuje nad originál (najmenší stupeň nad
originálom je kópia originálu, napr. rohozka-2172 = 1920 px). Pre telefón má každý záber vlastný
výrez na výšku 9 : 16 okolo bodu záujmu (<meno>-m-1086/-m-1448 + <meno>-m-hlbka.webp), takže sa
na displeji nezväčšuje 2× ako výsek zo záberu na šírku. Zoznam, pôvod, rozmery, stupne a bod
záujmu výrezu zapíše do film.json (z neho ide index.html cez stills.py).

Spustenie z koreňa barbershop-30: python3 -I source/tools/film.py [meno ...]"""
import os, sys, subprocess, json, tempfile
from PIL import Image, ImageOps
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'assets', 'img', 'film'); os.makedirs(OUT, exist_ok=True)
# model Depth Anything V2 small (ONNX, ~99 MB) nie je v gite: stiahni ho do source/tools/depth/model.onnx
# alebo daj cestu v premennej prostredia DEPTH_MODEL
MODEL = os.environ.get('DEPTH_MODEL', os.path.join(ROOT, 'source', 'tools', 'depth', 'model.onnx'))
G = os.path.join(ROOT, 'source', 'web-povodny', 'gallery'); F = os.path.join(ROOT, 'source', 'photos'); SL = os.path.join(ROOT, 'source', 'web-povodny', 'slider')
# meno záberu: zdroj, popis miesta, x bodu záujmu pre výrez na telefón (0–1), voliteľne:
#   'm': iný zdroj pre telefón (fotka na výšku toho istého miesta), 'mfy': y bodu záujmu (0–1, inak 0.5),
#   'mh': výška okna výrezu ako podiel výšky fotky (0–1, inak celá výška; detailné zábery sa tak na
#   telefóne zúžia na predmet a nie na stenu okolo neho), 'big': aj stupeň 4096 px
SHOTS = {
  'vstup':        (G+'/43.jpg', 'Vstup z Mostnej ulice', 0.76, {'big': True}),
  'rohozka':      (SL+'/3.jpg', 'Na rohožke, hneď za dverami', 0.44, {'m': F+'/foto-40.jpg', 'mfx': 0.5, 'mfy': 0.5}),
  'recepcia':     (G+'/35.jpg', 'Recepcia a predná sála', 0.30, {}),
  'sala':         (G+'/38.jpg', 'Hlavná sála', 0.5, {}),
  'kreslo':       (G+'/28.jpg', 'Kreslo pri okne', 0.58, {'mfy': 0.5}),
  'stol':         (G+'/40.jpg', 'Pracovné miesto', 0.62, {'mfx': 0.38, 'mfy': 0.64, 'mh': 0.75}),
  'naradie':      (G+'/39.jpg', 'Pomády, štetka a karafa', 0.5, {'mfx': 0.32, 'mfy': 0.55, 'mh': 0.8}),
  'zadna':        (G+'/31.jpg', 'Zadná miestnosť', 0.5, {}),
  'cakaren':      (G+'/36.jpg', 'Kútik s pumpou Route 66', 0.72, {}),
  'sala-rano':    (G+'/33.jpg', 'Sála v rannom svetle', 0.5, {}),
  'kreslo-stred': (G+'/34.jpg', 'Kreslo uprostred sály', 0.5, {}),
  'kava':         (G+'/41.jpg', 'Káva pre hostí', 0.5, {'mfy': 0.42, 'mh': 0.8}),
  'sud':          (G+'/30.jpg', 'Predná sála so sudom', 0.78, {}),
}
WIDTHS = (1086, 1448, 2172, 2896)      # stupne na šírku (desktop)
M_WIDTHS = (1086, 1448)                # stupne výrezu na výšku (telefón; film tam berie najviac 1448)
M_RATIO = 9 / 16                       # výrez na telefón: šírka / výška
AVIF_Q, WEBP_Q = 66, 84                # maximálny detail: vyššia kvalita než pôvodných 58 / 80

def tiers_for(W, widths, big=False):
    """Stupne, ktoré sa vyrobia: všetky pod šírkou originálu a prvý nad ňou ako kópia originálu."""
    out = []
    for w in sorted(widths):
        out.append(w)
        if w >= W: break
    if big and W > max(widths): out.append(W)
    return out

def save_tiers(im, name, widths, big=False):
    W, H = im.size; made = {}
    for w in tiers_for(W, widths, big):
        r = im if w >= W else im.resize((w, round(H * w / W)), Image.LANCZOS)
        r.save(f'{OUT}/{name}-{w}.avif', quality=AVIF_Q, speed=6); r.save(f'{OUT}/{name}-{w}.webp', quality=WEBP_Q, method=5)
        made[w] = {'w': r.width, 'h': r.height, 'avif': os.path.getsize(f'{OUT}/{name}-{w}.avif')}
    return made

def depth(src_path, out):
    subprocess.run([sys.executable, '-I', os.path.join(ROOT, 'source', 'tools', 'hlbka.py'), MODEL, src_path, out], check=True, stdout=subprocess.DEVNULL)

def load(path):
    return ImageOps.exif_transpose(Image.open(path)).convert('RGB')

only = sys.argv[1:]
man = {}
for name, (src, place, fx, o) in SHOTS.items():
    if only and name not in only: continue
    im = load(src); W, H = im.size
    tiers = save_tiers(im, name, WIDTHS, o.get('big', False))
    depth(src, f'{OUT}/{name}-hlbka.webp')
    rec = {'source': os.path.relpath(src, ROOT), 'place': place, 'width': W, 'height': H,
           'tiers': tiers, 'hlbka': os.path.getsize(f'{OUT}/{name}-hlbka.webp')}
    # výrez na telefón: okno 9 : 16 okolo bodu záujmu (mfx, mfy), na celú výšku alebo (mh) len na
    # jej časť pri detailných záberoch; nikdy cez okraj fotky
    msrc = o.get('m'); mim = load(msrc) if msrc else im; mfx = o.get('mfx', fx); mfy = o.get('mfy', 0.5)
    MW, MH = mim.size; ch = round(MH * o.get('mh', 1)); cw = min(MW, round(ch * M_RATIO))
    left = min(max(round(mfx * MW - cw / 2), 0), MW - cw); top = min(max(round(mfy * MH - ch / 2), 0), MH - ch)
    crop = mim.crop((left, top, left + cw, top + ch))
    mt = save_tiers(crop, name + '-m', M_WIDTHS)
    with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tf: crop.save(tf.name); tmp = tf.name
    try: depth(tmp, f'{OUT}/{name}-m-hlbka.webp')
    finally: os.unlink(tmp)
    rec['m'] = {'source': os.path.relpath(msrc or src, ROOT), 'width': cw, 'height': ch, 'left': left, 'top': top,
                'fx': round((mfx * MW - left) / cw, 3), 'tiers': mt, 'hlbka': os.path.getsize(f'{OUT}/{name}-m-hlbka.webp')}
    if 'mfy' in o: rec['m']['fy'] = round((mfy * MH - top) / ch, 3)
    man[name] = rec
    print(name, W, H, {w: round(t['avif'] / 1024) for w, t in tiers.items()}, 'KB; telefón', cw, 'x', ch, 'fx', rec['m']['fx'], {w: round(t['avif'] / 1024) for w, t in mt.items()}, 'KB', flush=True)
mp = os.path.join(OUT, 'film.json'); old = json.load(open(mp)) if os.path.exists(mp) else {}; old.update(man); json.dump(old, open(mp, 'w'), ensure_ascii=False, indent=1)
print('done', len(man))
