"""Doplní úvodný text a pointu do hotového klipu a vyexportuje ho na výšku 9:16 (1080x1920).

Použitie:
    pip install pillow imageio-ffmpeg fonttools brotli
    python3 docs/animatic/titulky.py klip.mp4 von.mp4 "Keď brat zaspí na 3. minúte rituálu" \
        "Pánsky rituál. 60 minút. Vydržal 3." --pointa 19.6 --koniec 20.8 --podrz 2.2

--pointa   sekunda, od ktorej sa zobrazí text pointy
--koniec   kde klip orezať (napr. pred záverečným logom); bez hodnoty sa nereže
--podrz    o koľko sekúnd podržať posledný záber, aby sa pointa dala prečítať
"""
import argparse, os, subprocess, sys
import imageio_ffmpeg
from PIL import Image, ImageDraw, ImageFont

W, H = 1080, 1920
HERE = os.path.dirname(os.path.abspath(__file__))
FONTS = os.path.join(HERE, "..", "..", "assets", "fonts")
CACHE = os.path.join(HERE, ".fonts")


def font(name, size):
    os.makedirs(CACHE, exist_ok=True)
    ttf = os.path.join(CACHE, name + ".ttf")
    if not os.path.exists(ttf):
        from fontTools.ttLib import TTFont
        f = TTFont(os.path.join(FONTS, name + ".woff2"))
        f.flavor = None
        f.save(ttf)
    return ImageFont.truetype(ttf, size)


def wrap(d, text, fnt, maxw):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if d.textlength(t, font=fnt) <= maxw:
            cur = t
        else:
            lines.append(cur)
            cur = w
    lines.append(cur)
    return lines


def overlay(text, fnt, y, color, path):
    L = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(L)
    lh = fnt.size + 16
    for i, ln in enumerate(wrap(d, text, fnt, 940)):
        x = (W - d.textlength(ln, font=fnt)) / 2
        d.text((x, y + i * lh), ln, font=fnt, fill=color, stroke_width=7, stroke_fill=(0, 0, 0, 255))
    L.save(path)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("vstup"); ap.add_argument("vystup"); ap.add_argument("uvod"); ap.add_argument("pointa_text")
    ap.add_argument("--pointa", type=float, required=True); ap.add_argument("--koniec", type=float)
    ap.add_argument("--podrz", type=float, default=2.0); ap.add_argument("--uvod-do", type=float, default=4.8)
    a = ap.parse_args()
    intro_png, pointa_png = a.vystup + ".uvod.png", a.vystup + ".pointa.png"
    overlay(a.uvod, font("Manrope-700", 66), 330, (255, 255, 255, 255), intro_png)
    overlay(a.pointa_text, font("Fraunces-500", 74), 1450, (212, 180, 106, 255), pointa_png)
    fc = (f"[0:v]tpad=stop_mode=clone:stop_duration={a.podrz},split[a][b];"
          f"[a]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=30:5,eq=brightness=-0.25[bg];"
          f"[b]scale=1080:-2[fg];[bg][fg]overlay=0:(H-h)/2[v1];"
          f"[v1][1:v]overlay=0:0:enable='between(t,0,{a.uvod_do})'[v2];"
          f"[v2][2:v]overlay=0:0:enable='gte(t,{a.pointa})'[v];[0:a]apad[a]")
    cmd = [imageio_ffmpeg.get_ffmpeg_exe(), "-y"]
    if a.koniec:
        cmd += ["-t", str(a.koniec)]
    cmd += ["-i", a.vstup, "-i", intro_png, "-i", pointa_png, "-filter_complex", fc, "-map", "[v]", "-map", "[a]"]
    if a.koniec:
        cmd += ["-t", str(a.koniec + a.podrz)]
    cmd += ["-c:v", "libx264", "-crf", "20", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", a.vystup]
    r = subprocess.run(cmd, capture_output=True, text=True)
    os.remove(intro_png); os.remove(pointa_png)
    if r.returncode:
        sys.exit(r.stderr[-800:])
    print("hotovo:", a.vystup)


if __name__ == "__main__":
    main()
