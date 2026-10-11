#!/usr/bin/env python3
"""Prehľad snímok videa do mriežky (na kontrolu reelu očami): N snímok za sekundu, čas v rohu,
voliteľne bezpečná zóna (spodných 20 % a pravých 12 % pri 9:16 kryje ovládanie TikToku a Instagramu).

  python3 -I prehlad.py video.mp4 -o prehlad.jpg [--fps 1] [--sirka 270] [--stlpce 6] [--zona] [--od 0 --do 15]
  python3 -I prehlad.py video.mp4 --detail 1.5 -o detail.png     # jedna snímka v plnom rozlíšení (ostrosť, diakritika)

Potrebuje ffmpeg a Pillow. Nič nemení na videu.
"""
import argparse
import json
import subprocess
import sys
import tempfile
from pathlib import Path


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('video')
    ap.add_argument('-o', '--vystup', required=True)
    ap.add_argument('--fps', type=float, default=1.0, help='snímok za sekundu (1 = jedna každú sekundu)')
    ap.add_argument('--sirka', type=int, default=270, help='šírka jednej snímky v mriežke (px)')
    ap.add_argument('--stlpce', type=int, default=6)
    ap.add_argument('--od', type=float, default=0.0)
    ap.add_argument('--do', type=float)
    ap.add_argument('--zona', action='store_true', help='vyznač bezpečnú zónu (dole 20 %%, vpravo 12 %%, hore 12 %%)')
    ap.add_argument('--detail', type=float, help='len jedna snímka v tomto čase (s), plné rozlíšenie')
    a = ap.parse_args()
    from PIL import Image, ImageDraw, ImageFont
    if a.detail is not None:
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(a.detail), '-i', a.video, '-frames:v', '1', a.vystup],
                       check=True)
        print(a.vystup)
        return 0
    info = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'json',
                                      a.video], capture_output=True, check=True).stdout)
    dlzka = float(info['format']['duration'])
    do = min(a.do or dlzka, dlzka)
    with tempfile.TemporaryDirectory(prefix='prehlad-') as t:
        # snímky v časoch od + k/fps (stred intervalu nie, presne tieto časy, aby sa dali dohľadať)
        casy = []
        k = 0
        while a.od + k / a.fps < do - 1e-3:
            casy.append(a.od + k / a.fps)
            k += 1
        obr = []
        for i, c in enumerate(casy):
            p = Path(t) / f's{i:04d}.png'
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{c:.3f}', '-i', a.video, '-frames:v', '1',
                            '-vf', f'scale={a.sirka}:-2:flags=lanczos', str(p)], check=True)
            if p.exists():
                obr.append((c, Image.open(p).convert('RGB')))
        if not obr:
            print('žiadne snímky', file=sys.stderr)
            return 1
        w, h = obr[0][1].size
        st = min(a.stlpce, len(obr))
        rd = (len(obr) + st - 1) // st
        S = Image.new('RGB', (st * w + (st + 1) * 6, rd * h + (rd + 1) * 6), (24, 22, 20))
        d = ImageDraw.Draw(S, 'RGBA')
        try:
            f = ImageFont.truetype('DejaVuSans.ttf', max(11, w // 18))
        except OSError:
            f = ImageFont.load_default()
        for i, (c, im) in enumerate(obr):
            x, y = 6 + (i % st) * (w + 6), 6 + (i // st) * (h + 6)
            S.paste(im, (x, y))
            if a.zona:
                d.rectangle([x, y + h * 0.80, x + w - 1, y + h - 1], outline=(255, 60, 60, 200), fill=(255, 60, 60, 40))
                d.rectangle([x + w * 0.88, y, x + w - 1, y + h - 1], outline=(255, 60, 60, 200), fill=(255, 60, 60, 40))
                d.line([x, y + h * 0.12, x + w, y + h * 0.12], fill=(255, 200, 60, 160))
            d.rectangle([x, y, x + w // 4, y + w // 12], fill=(0, 0, 0, 170))
            d.text((x + 3, y + 1), f'{c:.1f} s', fill=(255, 255, 255), font=f)
        S.save(a.vystup, quality=88)
    print(f'{a.vystup}: {len(obr)} snímok, {st}x{rd}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
