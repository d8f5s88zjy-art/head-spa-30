"""Vlastné fotky prevádzky pre klasický web, prirodzená fotografická úprava.
Zdroj: originály z mobilu (rovnaké ako pre web 3d, výrezy z videa pre vchod, recepciu a terasu).
Úprava sa snaží o vzhľad skutočnej fotografie, nie o „HDR“ mobilu:
  vyváženie bielej, expozícia, jemná filmová krivka (hlbšia čierna, mäkké svetlá), mierne nižšia sýtosť,
  odšumenie, zmenšenie v plnej kvalite, veľmi jemné doostrenie až vo výslednej veľkosti a slabá vinetácia.
Výstup: assets/img/f/<id>-{640,1080}.* (4:5) a <id>-w-{960,1920}.* (16:9)
python3 tools/vlastne_fotky.py [id ...]"""
import os, sys
import numpy as np, cv2
from PIL import Image, ImageFilter
import pillow_avif  # noqa: F401

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, '3d', 'tools'))
import grade  # noqa: E402  (zdroj originálov a výrez 4:5)

OUT = os.path.join(ROOT, 'assets', 'img', 'f')
# výška stredu výrezu 16:9 (0 = hore, 1 = dole)
WIDE = {
    'funkcna-zona-6': .56, 'funkcna-zona-7': .36, 'terasa-1': .56, 'vstup-1': .40, 'recepcia-1': .56,
    'hlavna-sala-1': .42, 'hlavna-sala-4': .55, 'volne-vahy-1': .58, 'stroje-4': .55, 'funkcna-zona-1': .60,
    'funkcna-zona-5': .56, 'kardio-1': .58,
}
TALL = list(WIDE) + ['volne-vahy-2', 'stroje-2', 'tatami-2']


def natural(rgb, video=False):
    x = rgb.astype(np.float32) / 255
    # vyváženie bielej: tretina korekcie šedého sveta na stredných tónoch
    lum = x.mean(2); m = (lum > .12) & (lum < .88)
    mean = x[m].mean(0)
    x *= (1 + .35 * (mean.mean() / np.maximum(mean, 1e-3) - 1))[None, None, :]
    # expozícia: medián jasu k 0,40, polovičnou silou
    Y = (x ** 2.2 * [.2126, .7152, .0722]).sum(2)
    med = float(np.median(Y)) ** (1 / 2.2)
    x = x * (.40 / max(med, .05)) ** .5
    # svetlá: mäkké zbalenie nad 0,82 (lampy a okná nevypália)
    x = np.where(x > .82, .82 + .18 * (1 - np.exp(-(x - .82) / .18)), x)
    x = np.clip(x, 0, 1)
    # filmová krivka: jemné S, hlbšia čierna so zachovanou kresbou
    s = x * x * (3 - 2 * x)
    x = x + .28 * (s - x)
    x = .012 + x * .985
    # sýtosť o niečo nižšia než z mobilu, pleť a červená dráha ostanú prirodzené
    g = x.mean(2, keepdims=True)
    x = g + (x - g) * .92
    out = (np.clip(x, 0, 1) * 255).astype(np.uint8)
    return cv2.fastNlMeansDenoisingColored(out, None, 4 if video else 2.5, 4 if video else 2.5, 5, 15)


def vignette(im, k=.10):
    w, h = im.size
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    r = np.sqrt(((xx - w / 2) / (w / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2) / np.sqrt(2)
    f = 1 - k * np.clip(r, 0, 1) ** 2.2
    a = np.asarray(im).astype(np.float32) * f[..., None]
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


def save(im, base, sizes, ratio):
    for W in sizes:
        W2 = min(W, im.width)
        r = im.resize((W2, round(W2 * ratio)), Image.LANCZOS)
        r = r.filter(ImageFilter.UnsharpMask(radius=.8, percent=35, threshold=2))
        r = vignette(r)
        b = f'{base}-{W}'
        r.save(b + '.avif', quality=64, speed=5)
        r.save(b + '.webp', quality=82, method=5)
        r.save(b + '.jpg', quality=86, optimize=True, progressive=True)


def run(sid):
    src = np.asarray(grade.source(sid))
    video = sid not in grade.ORIG
    h, w = src.shape[:2]
    if sid in WIDE:
        ch = int(w * 9 / 16); y0 = int(np.clip(WIDE[sid] * h - ch / 2, 0, h - ch))
        save(Image.fromarray(natural(src[y0:y0 + ch], video)), os.path.join(OUT, f'{sid}-w'), (960, 1920), 9 / 16)
    bgr = grade.crop45(cv2.cvtColor(src, cv2.COLOR_RGB2BGR), grade.TUNE.get(sid, {}).get('fy', .62))
    tall = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
    save(Image.fromarray(natural(tall, video)), os.path.join(OUT, sid), (640, 1080), 5 / 4)


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    for sid in (sys.argv[1:] or TALL):
        run(sid); print(sid)
