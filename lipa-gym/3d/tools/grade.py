"""Úprava fotiek prevádzky pre prehliadku (ako retuš fotografa, bez pridávania čohokoľvek do obrazu):
1. vyrovnanie zbiehajúcich sa zvislíc: fotky sú z mobilu nakloneného nahor; zvislé hrany sa nájdu
   (Hough), odhadne sa ich úbežník a obraz sa narovná na ~80 % (úplne kolmé pôsobí neprirodzene)
2. orez 4:5 s menším podielom stropu (fy = výška stredu výrezu)
3. tóny: vyváženie bielej (čiastočný gray-world), expozícia na cieľový medián, jemné zdvihnutie tieňov,
   stlmenie svetiel (lampy), lokálny kontrast CLAHE, mierna sýtosť, odšumenie a doostrenie
Výstup: media/g-<id>-{640,1080,1600}.{avif,webp} a -1080.jpg + tools/grade.json (rozmery, orez)
python3 tools/grade.py [id ...]"""
import json, os, sys
import numpy as np, cv2
from PIL import Image, ImageOps
import pillow_avif  # noqa: F401

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
U = '/root/.claude/uploads/e4fc08a7-9804-506e-a6e2-06fd64c3d915/'
ORIG = json.load(open(os.path.join(ROOT, 'tools', 'grade_src.json')))
FOT = json.load(open(os.path.join(ROOT, 'tools', 'fotky.json')))
# výška stredu výrezu 4:5 (0 = hore, 1 = dole) a sila narovnania; predvolené 0,62 a 0,8
TUNE = {
    'funkcna-zona-7': {'fy': .45}, 'funkcna-zona-2': {'fy': .5}, 'tatami-2': {'fy': .6},
    'jednorucky-1': {'fy': .55}, 'recepcia-1': {'fy': .55}, 'vstup-1': {'fy': .5, 'k': 0}, 'terasa-1': {'fy': .6, 'k': 0},
}


def source(sid):
    if sid in ORIG:
        return ImageOps.exif_transpose(Image.open(U + ORIG[sid])).convert('RGB')
    return Image.open(os.path.join(ROOT, 'media', f"tour-{sid}-{FOT[sid]['big']}.avif")).convert('RGB')


def keystone(bgr, k):
    """Úbežník zvislíc z dlhých takmer zvislých hrán; narovnanie homografiou."""
    h, w = bgr.shape[:2]
    if k <= 0:
        return bgr, 0.0
    g = cv2.cvtColor(cv2.resize(bgr, (w // 2, h // 2)), cv2.COLOR_BGR2GRAY)
    e = cv2.Canny(cv2.GaussianBlur(g, (5, 5), 0), 60, 160)
    L = cv2.HoughLinesP(e, 1, np.pi / 360, 80, minLineLength=h // 10, maxLineGap=8)
    if L is None:
        return bgr, 0.0
    A, B = [], []
    for x1, y1, x2, y2 in (L.reshape(-1, 4) * 2):
        dx, dy = x2 - x1, y2 - y1
        if abs(dy) < 1 or abs(dx / dy) > .25:      # len do ~14° od zvislice
            continue
        # priamka x = a*y + b; pre úbežník hľadáme y0, kde sa priamky pretínajú: sklon a závisí lineárne od x(y)
        a = dx / dy; xm = (x1 + x2) / 2; ym = (y1 + y2) / 2
        A.append((a, xm - a * ym, np.hypot(dx, dy)))
    if len(A) < 6:
        return bgr, 0.0
    # pri úbežníku (cx, vy): a = (x - cx)/(y - vy) → lineárna regresia a ≈ (x_c(y) - cx)/(y - vy)
    # jednoduchšie: sklon a proti vzdialenosti od stredu x v strednej výške; smernica = -1/(vy - h/2)
    arr = np.array(A); a = arr[:, 0]; xc = arr[:, 1] + a * (h / 2) - w / 2; wt = arr[:, 2]
    s = np.sum(wt * xc * a) / max(np.sum(wt * xc * xc), 1e-6)   # a ≈ s * xc
    s = float(np.clip(s, -0.0012, 0.0012)) * k
    # zvislica na pozícii xc má sklon s*xc: horný okraj sa roztiahne/zúži o s*xc*h
    t = s * (w / 2) * h / 2
    src = np.float32([[0, 0], [w, 0], [w, h], [0, h]])
    dst = np.float32([[0 + t, 0], [w - t, 0], [w + t, h], [0 - t, h]])
    M = cv2.getPerspectiveTransform(dst, src)
    out = cv2.warpPerspective(bgr, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    # orez okrajov, kam sa dostal replikovaný okraj
    m = int(abs(t) * 1.05) + 2
    return out[:, m:w - m], s


def tone(bgr, video=False):
    x = bgr.astype(np.float32) / 255
    # vyváženie bielej: polovica korekcie gray-world na stredných tónoch
    lum = x.mean(2); msk = (lum > .15) & (lum < .85)
    mean = x[msk].mean(0); g = mean.mean()
    x *= (1 + .5 * (g / np.maximum(mean, 1e-3) - 1))[None, None, :]
    x = np.clip(x, 0, 1)
    # expozícia: medián jasu na ~0,44
    lin = x ** 2.2; Y = (lin * [.0722, .7152, .2126]).sum(2)
    med = np.median(Y) ** (1 / 2.2)
    x = np.clip(x * (.44 / max(med, .05)) ** .7, 0, None)
    # svetlá (lampy, okná): mäkké stlmenie nad 0,8
    x = np.where(x > .8, .8 + (1 - np.exp(-(x - .8) * 3)) * .2 / (1 - np.exp(-.6)), x)
    x = np.clip(x, 0, 1)
    # tiene: jemné zdvihnutie
    x = x + .04 * (1 - x) ** 3 * (x < .5)
    lab = cv2.cvtColor((x * 255).astype(np.uint8), cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    l = cv2.createCLAHE(clipLimit=1.12, tileGridSize=(6, 6)).apply(l)
    lab = cv2.merge([l, a, b])
    out = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
    hsv = cv2.cvtColor(out, cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv[..., 1] = np.clip(hsv[..., 1] * 1.08, 0, 255)
    out = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)
    # zábery z videa: silnejšie odšumenie a bez doostrenia (inak pôsobia ostro „digitálne“)
    out = cv2.fastNlMeansDenoisingColored(out, None, 5 if video else 3, 5 if video else 3, 5, 15)
    if video:
        return out
    blur = cv2.GaussianBlur(out, (0, 0), 1.4)
    return cv2.addWeighted(out, 1.28, blur, -.28, 0)


def crop45(bgr, fy):
    h, w = bgr.shape[:2]
    ch = int(w * 5 / 4)
    if ch > h:
        cw = int(h * 4 / 5); x0 = (w - cw) // 2
        return bgr[:, x0:x0 + cw]
    y0 = int(np.clip(fy * h - ch / 2, 0, h - ch))
    return bgr[y0:y0 + ch]


def run(sid):
    t = TUNE.get(sid, {})
    bgr = cv2.cvtColor(np.asarray(source(sid)), cv2.COLOR_RGB2BGR)
    bgr, s = keystone(bgr, t.get('k', 0))   # automatické narovnanie vypnuté (nespoľahlivé), ponechané pre ručné k
    bgr = crop45(bgr, t.get('fy', .62))
    bgr = tone(bgr, video=sid not in ORIG)
    im = Image.fromarray(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB))
    W = min(1600, im.width)
    for w in (640, 1080, W):
        r = im.resize((w, round(w * 5 / 4)), Image.LANCZOS)
        r.save(os.path.join(ROOT, 'media', f'g-{sid}-{w}.avif'), quality=62, speed=5)
        r.save(os.path.join(ROOT, 'media', f'g-{sid}-{w}.webp'), quality=80, method=5)
        if w in (640, 1080):
            r.save(os.path.join(ROOT, 'media', f'g-{sid}-{w}.jpg'), quality=84 if w == 1080 else 82, optimize=True, progressive=True)
    return {'w': W, 'h': round(W * 5 / 4), 'tilt': round(s * 1e4, 2)}


if __name__ == '__main__':
    ids = sys.argv[1:] or list(FOT)
    p = os.path.join(ROOT, 'tools', 'grade.json')
    out = json.load(open(p)) if os.path.exists(p) else {}
    for sid in ids:
        out[sid] = run(sid); print(sid, out[sid])
    json.dump(out, open(p, 'w'), indent=1, ensure_ascii=False)
