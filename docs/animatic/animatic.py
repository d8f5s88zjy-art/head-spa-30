"""Animované storyboardy piatich videí „Dvaja vedľa seba“ (9:16, 1080x1920, so zvukom).

Použitie:
    pip install pillow numpy imageio-ffmpeg fonttools brotli
    python3 docs/animatic/animatic.py 1,2,3,4,5 out          # vyrenderuje mp4 do priečinka out/
    python3 docs/animatic/animatic.py preview 5 "1,6,13,21"  # náhľad snímok v daných sekundách

Scenáre (texty, časovanie pohľadov, pointy) sú vo funkciách scene1 až scene5 na konci súboru.
"""
import math, subprocess, sys, os
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import imageio_ffmpeg

W, H, FPS = 1080, 1920, 24
HERE = os.path.dirname(os.path.abspath(__file__))
FONTS = os.path.join(HERE, "..", "..", "assets", "fonts")
CACHE = os.path.join(HERE, ".fonts")


def font(name, size):
    """Use the site's own woff2 fonts (converted once to ttf for Pillow)."""
    os.makedirs(CACHE, exist_ok=True)
    ttf = os.path.join(CACHE, name + ".ttf")
    if not os.path.exists(ttf):
        from fontTools.ttLib import TTFont
        f = TTFont(os.path.join(FONTS, name + ".woff2"))
        f.flavor = None
        f.save(ttf)
    return ImageFont.truetype(ttf, size)


F_CAP = font("Manrope-700", 62)
F_PUN = font("Fraunces-500", 70)
F_SM = font("Manrope-600", 32)
F_TINY = font("Manrope-700", 26)

BG1, BG2 = (28, 36, 28), (12, 16, 12)
GOLD = (212, 180, 106)
CREAM = (232, 220, 196)
SKIN_A, SKIN_B = (214, 168, 132), (196, 148, 114)
DARK = (30, 24, 20)

DEFAULTS = dict(px=0, py=0, lid=0.1, lid_l=None, lid_r=None, brow=0, brow_l=None, brow_r=None,
                mouth=0, tilt=0, zoom=1, dx=0, dy=0, hair=1)


def smooth(p):
    p = max(0.0, min(1.0, p))
    return p * p * (3 - 2 * p)


def param_at(keys, name, t):
    """keys: list of (t, dict). Transition starts at t_k and lasts dict['_dur'] (default 0.5)."""
    val = DEFAULTS[name]
    for kt, kd in keys:
        if name not in kd:
            continue
        if kt > t:
            break
        dur = kd.get("_dur", 0.5)
        target = kd[name]
        if target is None or val is None:
            val = target
            continue
        val = val + (target - val) * smooth((t - kt) / dur if dur > 0 else 1)
    return val


def state(keys, t):
    return {k: param_at(keys, k, t) for k in DEFAULTS}


def draw_head(s, skin, shirt, towel=True, hair_col=(60, 40, 30)):
    L = Image.new("RGBA", (560, 560), (0, 0, 0, 0))
    d = ImageDraw.Draw(L)
    cx, cy, R = 280, 300, 150
    # hair (behind head) or towel drawn after head
    if not towel:
        hs = s["hair"]
        for i, (ox, oy, r) in enumerate([(-110, -90, 78), (-40, -140, 86), (40, -145, 88), (115, -95, 80), (0, -60, 110)]):
            d.ellipse((cx + ox - r * hs, cy + oy - r * hs, cx + ox + r * hs, cy + oy + r * hs), fill=hair_col)
    d.ellipse((cx - 172, cy - 30, cx - 130, cy + 40), fill=skin)  # ears
    d.ellipse((cx + 130, cy - 30, cx + 172, cy + 40), fill=skin)
    d.ellipse((cx - R, cy - R, cx + R, cy + R), fill=skin)
    if towel:
        d.ellipse((cx - 165, cy - 215, cx + 165, cy - 40), fill=CREAM)
        d.rectangle((cx - 165, cy - 128, cx + 165, cy - 90), fill=CREAM)
        d.ellipse((cx - 165, cy - 150, cx + 165, cy - 60), fill=(214, 200, 172))
        d.ellipse((cx + 90, cy - 235, cx + 175, cy - 165), fill=CREAM)  # towel knot
    # eyes
    for side in (-1, 1):
        ex, ey = cx + side * 62, cy - 20
        d.ellipse((ex - 27, ey - 19, ex + 27, ey + 19), fill=(250, 248, 240), outline=DARK, width=3)
        pxp = ex + s["px"] * 17
        pyp = ey + s["py"] * 8
        d.ellipse((pxp - 15, pyp - 15, pxp + 15, pyp + 15), fill=(40, 30, 28))
        d.ellipse((pxp - 5, pyp - 8, pxp + 1, pyp - 2), fill=(255, 255, 255))
        lid = s["lid_l"] if (side == -1 and s["lid_l"] is not None) else (s["lid_r"] if (side == 1 and s["lid_r"] is not None) else s["lid"])
        if lid > 0.02:
            h = int(38 * lid)
            d.rectangle((ex - 30, ey - 21, ex + 30, ey - 21 + h), fill=skin)
            d.line((ex - 27, ey - 19 + h, ex + 27, ey - 19 + h), fill=DARK, width=3)
        # brow
        b = s["brow_l"] if (side == -1 and s["brow_l"] is not None) else (s["brow_r"] if (side == 1 and s["brow_r"] is not None) else s["brow"])
        inner_x, outer_x = ex - side * 26, ex + side * 26
        base = ey - 40
        if b >= 0:
            iy, oy = base - 16 * b, base - 14 * b
        else:
            iy, oy = base + 14 * (-b), base - 4 * (-b)
        d.line((inner_x, iy, outer_x, oy), fill=(50, 36, 30), width=9)
    # nose
    d.line((cx, cy - 5, cx - 8, cy + 30, cx + 6, cy + 32), fill=(160, 110, 85), width=4)
    # mouth
    m = s["mouth"]
    mw, my = 36, cy + 72
    if abs(m) < 0.08:
        d.line((cx - mw, my, cx + mw, my), fill=(120, 60, 60), width=5)
    elif m > 0:
        hh = 8 + 30 * m
        d.arc((cx - mw, my - hh, cx + mw, my + hh), 15, 165, fill=(120, 60, 60), width=5)
    else:
        hh = 8 + 30 * (-m)
        d.arc((cx - mw, my, cx + mw, my + 2 * hh), 200, 340, fill=(120, 60, 60), width=5)
    if s["zoom"] != 1:
        z = s["zoom"]
        L = L.resize((int(560 * z), int(560 * z)), Image.BICUBIC)
    if abs(s["tilt"]) > 0.01:
        L = L.rotate(s["tilt"], resample=Image.BICUBIC, center=(L.width / 2, L.height * 300 / 560))
    return L


def body(d, x, y, shirt, cape=False):
    d.rounded_rectangle((x - 235, y - 270, x + 235, y + 640), 60, fill=(44, 38, 30), outline=GOLD, width=4)  # chair
    d.ellipse((x - 200, y + 110, x + 200, y + 560), fill=shirt)
    d.rectangle((x - 200, y + 330, x + 200, y + 700), fill=shirt)
    d.rectangle((x - 40, y + 100, x + 40, y + 180), fill=(190, 145, 110))  # neck
    if cape:
        d.ellipse((x - 205, y + 105, x + 205, y + 300), fill=CREAM)
        d.rectangle((x - 40, y + 100, x + 40, y + 180), fill=(190, 145, 110))


def wrap(d, text, font, maxw):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if d.textlength(t, font=font) <= maxw:
            cur = t
        else:
            lines.append(cur)
            cur = w
    lines.append(cur)
    return lines


def caption(canvas, text, font, y, color, alpha, boxed=True):
    if alpha <= 0:
        return
    L = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(L)
    lines = wrap(d, text, font, 900)
    lh = font.size + 14
    th = lh * len(lines)
    if boxed:
        d.rounded_rectangle((60, y - 36, W - 60, y + th + 30), 30, fill=(0, 0, 0, int(150 * alpha)))
    for i, ln in enumerate(lines):
        tw = d.textlength(ln, font=font)
        d.text(((W - tw) / 2, y + i * lh), ln, font=font, fill=color + (int(255 * alpha),))
    canvas.alpha_composite(L)


def background(t, steam=True, glow=True):
    arr = np.linspace(0, 1, H)[:, None, None]
    img = (np.array(BG1) * (1 - arr) + np.array(BG2) * arr).astype(np.uint8)
    img = np.repeat(img, W, axis=1)
    canvas = Image.fromarray(img).convert("RGBA")
    if glow:
        canvas.alpha_composite(GLOW)
    if steam:
        S = Image.new("RGBA", (W // 4, H // 4), (0, 0, 0, 0))
        sd = ImageDraw.Draw(S)
        for i in range(5):
            yy = (1500 - ((t * 70 + i * 260) % 1300)) / 4
            xx = (120 + i * 210 + math.sin(t * 0.8 + i) * 40) / 4
            sd.ellipse((xx - 22, yy - 10, xx + 22, yy + 10), fill=(255, 255, 255, 22))
        S = S.filter(ImageFilter.GaussianBlur(8)).resize((W, H), Image.BILINEAR)
        canvas.alpha_composite(S)
    return canvas


def _glow():
    G = Image.new("RGBA", (W // 4, H // 4), (0, 0, 0, 0))
    gd = ImageDraw.Draw(G)
    gd.ellipse((150, 25, 325, 225), fill=(212, 170, 90, 70))
    return G.filter(ImageFilter.GaussianBlur(30)).resize((W, H), Image.BILINEAR)


GLOW = _glow()


AX, BX, HY = 330, 750, 900  # head centres


def render_frame(scene, t):
    canvas = background(t, steam=scene.get("steam", True))
    d = ImageDraw.Draw(canvas)
    body(d, AX, HY, (43, 58, 90), cape=scene.get("cape", False))
    body(d, BX, HY, (106, 47, 56), cape=scene.get("cape", False))
    if "before" in scene:
        scene["before"](canvas, d, t)
    sa, sb = state(scene["A"], t), state(scene["B"], t)
    for s, x, skin, hc in ((sa, AX, SKIN_A, (50, 34, 26)), (sb, BX, SKIN_B, (92, 62, 40))):
        L = draw_head(s, skin, None, towel=scene.get("towel", True), hair_col=hc)
        canvas.alpha_composite(L, (int(x + s["dx"] - L.width / 2), int(HY + s["dy"] - L.height * 300 / 560)))
    d = ImageDraw.Draw(canvas)
    if "after" in scene:
        scene["after"](canvas, d, t)
    # captions
    a = min(1, t / 0.4) if t < 4.6 else max(0, 1 - (t - 4.6) / 0.4)
    caption(canvas, scene["intro"], F_CAP, 230, (255, 255, 255), a)
    pt = scene["pointa_t"]
    if t >= pt:
        caption(canvas, scene["pointa"], F_PUN, 1540, GOLD, min(1, (t - pt) / 0.4))
    caption(canvas, "HEAD SPA 30 · Nitra", F_SM, 1820, (150, 150, 130), 0.8, boxed=False)
    return canvas


def audio(duration, hit_t, extra=None):
    sr = 44100
    n = int(duration * sr)
    t = np.arange(n) / sr
    out = 0.05 * np.sin(2 * np.pi * 55 * t) * (1 + 0.3 * np.sin(2 * np.pi * 0.25 * t))
    rng = np.random.default_rng(1)
    for k in np.arange(0.5, min(hit_t, duration), 0.5):
        i0 = int(k * sr)
        L = int(0.025 * sr)
        env = np.exp(-np.arange(L) / (0.004 * sr))
        amp = 0.12 + 0.25 * (k / hit_t)
        out[i0:i0 + L] += amp * env * rng.standard_normal(L) * np.sin(2 * np.pi * 2200 * np.arange(L) / sr)
    i0 = int(hit_t * sr)
    L = min(int(1.6 * sr), n - i0)
    tt = np.arange(L) / sr
    out[i0:i0 + L] += 0.7 * np.sin(2 * np.pi * 58 * tt) * np.exp(-tt * 2.2) + 0.3 * rng.standard_normal(L) * np.exp(-tt * 18)
    if extra:
        extra(out, sr)
    out = np.clip(out, -1, 1)
    return (out * 32767).astype(np.int16), sr


def render(scene, path):
    import wave
    pcm, sr = audio(scene["dur"], scene["pointa_t"], scene.get("audio_extra"))
    wav = path + ".wav"
    with wave.open(wav, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(pcm.tobytes())
    ff = imageio_ffmpeg.get_ffmpeg_exe()
    cmd = [ff, "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
           "-i", wav, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-preset", "fast",
           "-c:a", "aac", "-b:a", "128k", "-shortest", "-movflags", "+faststart", path]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
    nf = int(scene["dur"] * FPS)
    for i in range(nf):
        fr = render_frame(scene, i / FPS).convert("RGB")
        p.stdin.write(fr.tobytes())
    p.stdin.close()
    err = p.stderr.read().decode()[-400:]
    p.wait()
    os.remove(wav)
    if p.returncode != 0:
        print(err)
    return p.returncode


# ---------------- props ----------------

def hand(d, x, y, r=36, skin=SKIN_B):
    d.ellipse((x - r, y - r, x + r, y + r), fill=skin, outline=(120, 80, 60), width=3)


def prog(t, a, b):
    return smooth((t - a) / (b - a)) if b > a else 1.0


# ---------------- scenes ----------------

def scene1():
    def before(c, d, t):
        # dripping water at right edge and a puddle
        for k in range(2):
            yy = 320 + ((t * 900 + k * 450) % 1120)
            d.ellipse((1010, yy, 1030, yy + 34), fill=(120, 190, 220))
        d.ellipse((940, 1450, 1075, 1495), fill=(90, 150, 190))
        # B's wet sleeve resting on the armrest (planted from the start)
        d.rounded_rectangle((BX + 150, 1080, BX + 260, 1330), 40, fill=(60, 90, 130))
        d.ellipse((BX + 165, 1300, BX + 245, 1380), fill=SKIN_B)
        for k in range(3):
            yy = 1385 + ((t * 250 + k * 45) % 70)
            d.ellipse((BX + 175 + k * 26, yy, BX + 187 + k * 26, yy + 18), fill=(120, 190, 220))
        d.ellipse((BX + 150, 1440, BX + 270, 1470), fill=(90, 150, 190))
        if t >= 19.0:  # the towel slides over the wet arm
            x0 = W + 20 - (W + 20 - (BX + 110)) * prog(t, 19.0, 20.6)
            d.rounded_rectangle((x0, 1060, x0 + 330, 1480), 34, fill=CREAM)
            d.line((x0 + 20, 1150, x0 + 310, 1150), fill=(214, 200, 172), width=6)
            hand(d, x0 + 300, 1120, 34, SKIN_B)

    def after(c, d, t):
        if 4.3 < t < 6.3:  # B fixes his towel
            hand(d, BX + 150, 700 + 20 * math.sin(t * 9), 34, SKIN_B)

    A = [(0, dict(px=0, lid=0.1)), (2.5, dict(px=1, brow=-0.6, _dur=1.2)), (7.0, dict(px=0, brow=0)),
         (11.5, dict(px=1, tilt=-12, brow=0.8, _dur=1.0)), (17.0, dict(px=0, tilt=0, brow=0, _dur=1.0)),
         (19.6, dict(lid=1, _dur=0.8))]
    B = [(0, dict(lid=0.1)), (4.5, dict(brow=0.3)), (8.5, dict(px=-1, _dur=0.25)), (9.3, dict(px=0, brow=0.6, _dur=0.25)),
         (13.0, dict(mouth=0.4, brow=0.8, _dur=0.3)), (14.0, dict(mouth=0, _dur=0.3)), (15.2, dict(mouth=0.5, _dur=0.3)),
         (16.2, dict(mouth=0, _dur=0.3)), (19.0, dict(py=1, px=0.6, _dur=0.5)), (21.0, dict(py=0, px=0, lid=0.3))]
    return dict(name="1-kto-nechal-tiect-vodu", dur=22, intro="Keď sa terapeutka pýta, kto nechal tiecť vodu",
                pointa="Prípad uzavretý.", pointa_t=19.5, A=A, B=B, before=before, after=after)


def scene2():
    def after(c, d, t):
        # therapist's hands on B's head
        for side in (-1, 1):
            hx = BX + side * 75 + math.sin(t * 3 + side) * 6
            hy = 700 + math.sin(t * 3) * 10
            d.line((hx, hy, hx + side * 60, 380), fill=(200, 160, 128), width=42)
            d.ellipse((hx - 42, hy - 36, hx + 42, hy + 36), fill=(214, 172, 136), outline=(120, 80, 60), width=3)
        if t >= 17.8:  # A raises his hand like at school
            p = prog(t, 17.8, 19.2)
            hy = 1180 - 520 * p
            d.line((AX - 150, 1230, AX - 200, hy), fill=(43, 58, 90), width=52)
            hand(d, AX - 200, hy, 38, SKIN_A)

    A = [(0, dict(brow=-0.3, mouth=-0.3)), (2.5, dict(px=1, py=-1, brow=-0.7, _dur=1.2)), (7.2, dict(px=0, py=0, brow=0, mouth=-0.2, _dur=0.3)),
         (12.5, dict(px=1, tilt=-15, brow=-0.8, mouth=-0.5, _dur=1.0)), (17.8, dict(px=0, tilt=0, brow=0.5, mouth=0.2, _dur=0.7))]
    B = [(0, dict(lid=1, mouth=0.6)), (5.5, dict(lid_l=0.3, px=-1, _dur=0.5)), (9.5, dict(lid_l=None, lid=1, mouth=0.8)),
         (15.5, dict(lid=0, px=0, mouth=0.7, brow=0.3))]
    return dict(name="2-o-pat-minut-dlhsie", dur=22, intro="Keď brat dostane masáž o 5 minút dlhšie",
                pointa="Rezervácia na 90 minút. Pre seba.", pointa_t=18.6, A=A, B=B, after=after)


def scene3():
    def after(c, d, t):
        # reception counter and the gift voucher
        d.rectangle((0, 1290, W, 1440), fill=(58, 50, 38))
        d.rectangle((0, 1290, W, 1300), fill=GOLD)
        vx = 560 + 620 * prog(t, 2.2, 4.6)
        d.rounded_rectangle((vx, 1200, vx + 250, 1340), 14, fill=(240, 232, 214), outline=GOLD, width=5)
        d.text((vx + 34, 1250), "POUKAZ", font=F_TINY, fill=(60, 50, 40))
        d.line((vx + 20, 1300, vx + 230, 1300), fill=GOLD, width=3)
        if 2.0 < t < 5.2:
            hand(d, vx + 250, 1225, 34, SKIN_B)
        if t >= 17.2:  # A points at B without moving his head
            p = prog(t, 17.2, 18.4)
            d.line((AX + 130, 1190, AX + 130 + 250 * p, 1190), fill=(43, 58, 90), width=48)
            hand(d, AX + 130 + 250 * p, 1190, 34, SKIN_A)
            d.line((AX + 150 + 250 * p, 1190, AX + 215 + 250 * p, 1190), fill=SKIN_A, width=16)

    A = [(0, dict(mouth=0.05)), (4.5, dict(px=0.6, py=1, _dur=0.4)), (5.5, dict(px=1, py=0, brow=-0.6)),
         (9.5, dict(px=0, brow=0)), (14.5, dict(brow_r=1, _dur=0.8)), (17.2, dict(brow_r=0.6, mouth=0.15))]
    B = [(0, dict(mouth=0.1)), (2.2, dict(py=0.6, px=0.4, _dur=0.4)), (4.6, dict(py=0, px=0)),
         (6.5, dict(px=-1, brow=1, mouth=-0.4)), (11.5, dict(px=0, brow=0.2, mouth=0.3, lid=0.2)),
         (13.0, dict(mouth=0.5, _dur=0.2)), (13.6, dict(mouth=0.2, _dur=0.2)), (18.0, dict(lid=1, mouth=-0.2, _dur=0.6))]
    return dict(name="3-mamin-poukaz", dur=22, intro="Keď mama zistí, kto použil jej darčekový poukaz",
                pointa="Rituál pre dvoch. Zaplatila mama.", pointa_t=18.6, A=A, B=B, after=after, towel=False, steam=False)


def scene4():
    def after(c, d, t):
        if 2.2 < t < 3.8:  # B's hair flip
            p = prog(t, 2.2, 3.8)
            hand(d, BX + 200, 900 - 260 * math.sin(p * math.pi), 34, SKIN_B)
        if 6.3 < t < 8.2:  # A adjusts one wave with two fingers
            hand(d, AX + 150, 730 + 10 * math.sin(t * 8), 30, SKIN_A)
        if t >= 17.0:  # mirror
            p = prog(t, 17.0, 18.5)
            my = 1420 - 300 * p
            d.line((AX - 60, 1250, AX - 60, my + 60), fill=(43, 58, 90), width=48)
            d.line((AX - 60, my + 60, AX - 60, my + 150), fill=(120, 90, 50), width=14)
            d.ellipse((AX - 140, my - 90, AX + 20, my + 70), fill=GOLD)
            d.ellipse((AX - 128, my - 78, AX + 8, my + 58), fill=(200, 210, 220))
            hand(d, AX - 60, my + 100, 34, SKIN_A)

    A = [(0, dict(mouth=0.4, brow=0.2)), (4.5, dict(px=1, brow=-0.5, mouth=-0.3)), (6.3, dict(px=0, brow=0.2, mouth=0.2, tilt=-4)),
         (11.5, dict(px=0, brow=-0.3, mouth=-0.1, tilt=0, _dur=0.4)), (17.6, dict(px=-0.4, py=1, mouth=0.6, brow=0.3, _dur=0.8))]
    B = [(0, dict(mouth=0.4, brow=0.2)), (2.2, dict(hair=1.28, tilt=9, _dur=0.7)), (3.2, dict(hair=1.0, tilt=0, _dur=0.6)),
         (8.5, dict(px=-1, brow=1, mouth=-0.5)), (11.5, dict(px=0, brow=-0.3, mouth=-0.1, _dur=0.4)),
         (14.5, dict(zoom=1.12, dy=30, mouth=0.5, brow=0.2, _dur=1.5)), (18.6, dict(px=1, mouth=-0.3, brow=0.6))]
    return dict(name="4-kto-ma-krajsie-vlasy", dur=22, intro="Keď sa mama pýta, kto má krajšie vlasy",
                pointa="Zlatý rituál 24K. Starší.", pointa_t=18.6, A=A, B=B, after=after, towel=False, cape=True)


def scene5():
    def after(c, d, t):
        if t > 19.5:
            for k in range(3):
                yy = 640 - ((t * 60 + k * 50) % 150)
                d.text((BX - 210 + k * 22, yy - k * 10), "z", font=F_CAP, fill=(220, 220, 220))

    def snore(out, sr):
        for k in (19.6, 21.2):
            i0 = int(k * sr); L = int(0.7 * sr); tt = np.arange(L) / sr
            out[i0:i0 + L] += 0.25 * np.sin(2 * np.pi * 90 * tt) * np.sin(2 * np.pi * 22 * tt) * np.exp(-tt * 2)

    A = [(0, dict(mouth=0.05)), (5.0, dict(px=1, brow=-0.5)), (9.0, dict(px=0, brow=0)),
         (15.0, dict(px=1, brow=1, mouth=-0.3, _dur=0.6)), (18.5, dict(px=0, brow=0.2, mouth=-0.1, _dur=1.2))]
    B = [(0, dict(lid=0.2, mouth=0.3)), (2.0, dict(lid=0.9, _dur=3.0)), (7.0, dict(lid=0, brow=1, mouth=-0.2, _dur=0.2)),
         (9.5, dict(brow=0, mouth=0.2)), (12.0, dict(lid=1, tilt=20, dx=-40, dy=20, mouth=0.3, _dur=3.0)),
         (17.8, dict(tilt=48, dx=-165, dy=110, _dur=1.6))]
    return dict(name="5-vydrzal-tri-minuty", dur=23, intro="Keď brat zaspí na 3. minúte rituálu",
                pointa="Pánsky rituál. 60 minút. Vydržal 3.", pointa_t=19.4, A=A, B=B, after=after, audio_extra=snore)


SCENES = [scene1, scene2, scene3, scene4, scene5]

if __name__ == "__main__":
    if sys.argv[1] == "preview":
        sc = SCENES[int(sys.argv[2]) - 1]()
        times = [float(x) for x in sys.argv[3].split(",")]
        frames = [render_frame(sc, t).convert("RGB").resize((360, 640)) for t in times]
        sheet = Image.new("RGB", (360 * len(frames), 640))
        for i, f in enumerate(frames):
            sheet.paste(f, (i * 360, 0))
        sheet.save(f"preview_{sys.argv[2]}.jpg", quality=85)
    else:
        outdir = sys.argv[2]
        os.makedirs(outdir, exist_ok=True)
        for idx in [int(x) for x in sys.argv[1].split(",")]:
            sc = SCENES[idx - 1]()
            path = os.path.join(outdir, f"{sc['name']}.mp4")
            rc = render(sc, path)
            print(idx, path, "rc", rc, flush=True)
