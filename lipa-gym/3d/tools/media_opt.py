"""Optimalizácia fotiek pre web (cieľ: celý web ~30 MB).
Veľké AVIF (1932/2160 px) sa prekódujú v kvalite 50 (vizuálne zhodné, ~35 % menšie),
WebP 1280 (záloha pre prehliadače bez AVIF) v kvalite 66. Zdrojom sú JPG v plnej kvalite.
python3 tools/media_opt.py
"""
import glob, os, pillow_avif
from concurrent.futures import ProcessPoolExecutor
from PIL import Image

def one(jpg):
    base = jpg[:-4]
    im = Image.open(jpg).convert('RGB')
    im.save(base + '.avif', 'AVIF', quality=50, speed=5)
    r = im.resize((1280, round(im.height * 1280 / im.width)), Image.LANCZOS)
    r.save(base.rsplit('-', 1)[0] + '-1280.webp', 'WEBP', quality=66, method=6)
    return os.path.basename(base)

if __name__ == '__main__':
    os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'media'))
    jpgs = sorted(glob.glob('tour-*-1932.jpg') + glob.glob('tour-*-2160.jpg'))
    with ProcessPoolExecutor() as ex:
        for n in ex.map(one, jpgs): print(n)
