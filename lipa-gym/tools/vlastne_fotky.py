"""Vlastné fotky prevádzky pre klasický web.
Zdroj: originály z mobilu (rovnaké ako pre web 3d) a ich úprava tónov z 3d/tools/grade.py.
- na výšku 4:5: kópia hotových 3d/media/g-<id>-{640,1080}.{avif,webp,jpg}
- na šírku 16:9: nový výrez z originálu (fy = výška stredu výrezu), rovnaká úprava tónov
Výstup: assets/img/f/<id>-{640,1080}.* a <id>-w-{960,1920}.*
python3 tools/vlastne_fotky.py"""
import os, shutil, sys
import numpy as np, cv2
from PIL import Image
import pillow_avif  # noqa: F401

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, '3d', 'tools'))
import grade  # noqa: E402

OUT = os.path.join(ROOT, 'assets', 'img', 'f')
MEDIA = os.path.join(ROOT, '3d', 'media')
# id: výška stredu výrezu 16:9 (0 = hore, 1 = dole); None = len na výšku
WIDE = {
    'funkcna-zona-6': .56, 'terasa-1': .56, 'vstup-1': .40, 'recepcia-1': .56, 'hlavna-sala-1': .42,
    'hlavna-sala-4': .55, 'volne-vahy-1': .58, 'stroje-4': .55, 'funkcna-zona-1': .60,
    'funkcna-zona-5': .56, 'kardio-1': .58,
}
TALL = list(WIDE) + ['volne-vahy-2', 'stroje-2', 'tatami-2']


def wide(sid, fy):
    im = grade.source(sid)
    bgr = cv2.cvtColor(np.asarray(im), cv2.COLOR_RGB2BGR)
    h, w = bgr.shape[:2]
    ch = int(w * 9 / 16)
    y0 = int(np.clip(fy * h - ch / 2, 0, h - ch))
    bgr = grade.tone(bgr[y0:y0 + ch], video=sid not in grade.ORIG)
    im = Image.fromarray(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB))
    for W in (960, 1920):
        W2 = min(W, im.width)
        r = im.resize((W2, round(W2 * 9 / 16)), Image.LANCZOS)
        base = os.path.join(OUT, f'{sid}-w-{W}')
        r.save(base + '.avif', quality=60, speed=5)
        r.save(base + '.webp', quality=78, method=5)
        r.save(base + '.jpg', quality=82, optimize=True, progressive=True)
    return im.size


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    for sid in TALL:
        for w in (640, 1080):
            for ext in ('avif', 'webp', 'jpg'):
                shutil.copy(os.path.join(MEDIA, f'g-{sid}-{w}.{ext}'), os.path.join(OUT, f'{sid}-{w}.{ext}'))
    for sid, fy in (WIDE.items() if len(sys.argv) < 2 else [(a, WIDE[a]) for a in sys.argv[1:]]):
        print(sid, wide(sid, fy))
