"""Fotky webu GYM KLUB: jednotné jemné ladenie a formáty.
- Originály (JPG z gymklub.sk a z prevádzky) sú v assets/img/src/, výstupy v assets/img/.
- Ladenie: mierne zdvihnutie tieňov (fotky sú podexponované), jemný lokálny kontrast, stlmené svetlá
  v oknách, neutrálna teplota. Nálada ostáva tmavá, nič sa nepridáva ani nevymýšľa.
- Pre každú fotku: <meno>.jpg/.webp/.avif v plnej šírke a <meno>-640.* (fotky trénerov -320).
python3 tools/obrazky.py [meno ...]"""
import glob, os, sys
import numpy as np, cv2
from PIL import Image
import pillow_avif  # noqa: F401

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, 'assets', 'img')
SRC = os.path.join(IMG, 'src')
# veľkosti: plná a malá šírka
SIZES = {'band-led': (1920, 640), 'tim/': (480, 320)}   # fotky priestoru: tools/vlastne_fotky.py


def grade(im, strength=1.0):
    x = np.asarray(im.convert('RGB')).astype(np.float32) / 255
    # tiene: zdvihnúť dolnú tretinu (krivka), stredy mierne rozjasniť
    lift = .10 * strength
    x = x + lift * (1 - x) ** 4
    x = np.clip(x * (1 + .05 * strength), 0, 1)
    # svetlá (okná): mäkké stlmenie nad 0,86
    x = np.where(x > .86, .86 + (1 - np.exp(-(x - .86) * 4)) * .14 / (1 - np.exp(-.56)), x)
    u8 = (np.clip(x, 0, 1) * 255).astype(np.uint8)
    lab = cv2.cvtColor(u8, cv2.COLOR_RGB2LAB)
    l, a, b = cv2.split(lab)
    l = cv2.createCLAHE(clipLimit=1.15, tileGridSize=(6, 6)).apply(l)
    out = cv2.cvtColor(cv2.merge([l, a, b]), cv2.COLOR_LAB2RGB)
    blur = cv2.GaussianBlur(out, (0, 0), 1.2)
    out = cv2.addWeighted(out, 1.18, blur, -.18, 0)
    return Image.fromarray(out)


def save(im, base, w):
    if im.width > w:
        im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    im.save(base + '.jpg', quality=82, optimize=True, progressive=True)
    im.save(base + '.webp', quality=80, method=6)
    im.save(base + '.avif', quality=58, speed=5)


def run(path):
    rel = os.path.relpath(path, SRC)[:-4]          # napr. stojany, tim/sasik
    im = Image.open(path)
    tim = rel.startswith('tim/')
    g = grade(im, .6 if tim else 1.0)
    big, small = SIZES.get(rel, SIZES['tim/'] if tim else (1200, 640))
    save(g, os.path.join(IMG, rel), big)
    if small:
        save(g, os.path.join(IMG, f'{rel}-{small}'), small)
    print(rel, g.size)


if __name__ == '__main__':
    names = sys.argv[1:]
    for p in sorted(glob.glob(os.path.join(SRC, '**', '*.jpg'), recursive=True)):
        if not names or os.path.relpath(p, SRC)[:-4] in names:
            run(p)
