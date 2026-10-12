#!/usr/bin/env python3
"""Hluché pauzy v nahrávke s rečou (reel, video od majiteľa): nájde ticho a voliteľne ho vystrihne.

Podľa videa joshfpocock „YouTube agent“ (/yt-edit: „finds every dead pause and retake … Claude can cut them
with ffmpeg“). Opakované zábery (retake) skript nehľadá: tie treba nájsť v prepise reči, nie v zvuku.

python3 pauzy.py video.mp4                       # zoznam páuz (ticho pod -35 dB dlhšie ako 0,6 s)
python3 pauzy.py video.mp4 --prah -32 --dlzka 0.5
python3 pauzy.py video.mp4 --strih bez-pauz.mp4  # vystrihne pauzy, na každej strane nechá 0,12 s nádychu

ffmpeg: v PATH alebo z balíka imageio_ffmpeg. Výsledok strihu je nové video (H.264 + AAC), originál ostáva."""
import argparse, re, shutil, subprocess, sys


def ffmpeg():
    p = shutil.which('ffmpeg')
    if p:
        return p
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        sys.exit('chyba: chýba ffmpeg (ani v PATH, ani imageio_ffmpeg)')


def pauzy(ff, vstup, prah, dlzka):
    r = subprocess.run([ff, '-hide_banner', '-nostats', '-i', vstup, '-af', f'silencedetect=noise={prah}dB:d={dlzka}',
                        '-f', 'null', '-'], capture_output=True, text=True)
    log = r.stderr
    m = re.search(r'Duration: (\d+):(\d+):([\d.]+)', log)
    if not m:
        sys.exit('chyba: ffmpeg nevie prečítať dĺžku videa')
    trvanie = int(m.group(1)) * 3600 + int(m.group(2)) * 60 + float(m.group(3))
    zac = [float(x) for x in re.findall(r'silence_start: (-?[\d.]+)', log)]
    kon = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', log)]
    if len(kon) < len(zac):                     # ticho až do konca
        kon.append(trvanie)
    return trvanie, [(max(0.0, a), b) for a, b in zip(zac, kon)]


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('video')
    ap.add_argument('--prah', type=float, default=-35, help='hlasitosť ticha v dB (predvolene -35)')
    ap.add_argument('--dlzka', type=float, default=0.6, help='najkratšia pauza v s (predvolene 0,6)')
    ap.add_argument('--rezerva', type=float, default=0.12, help='koľko z pauzy nechať na každej strane (s)')
    ap.add_argument('--strih', help='výstupné video bez páuz')
    a = ap.parse_args()
    ff = ffmpeg()
    trvanie, p = pauzy(ff, a.video, a.prah, a.dlzka)
    spolu = sum(b - x for x, b in p)
    print(f'video {trvanie:.2f} s, páuz {len(p)}, spolu {spolu:.2f} s')
    for i, (x, b) in enumerate(p, 1):
        print(f'{i:3d}. {x:7.2f} – {b:7.2f} s  ({b - x:.2f} s)')
    if not a.strih:
        return 0
    # časti, ktoré ostanú: všetko okrem páuz, z každej pauzy ostane rezerva na oboch stranách
    keep, t = [], 0.0
    for x, b in p:
        k = min(x + a.rezerva, b)
        if k - t > 0.05:
            keep.append((t, k))
        t = max(b - a.rezerva, k)
    if trvanie - t > 0.05:
        keep.append((t, trvanie))
    if not keep:
        sys.exit('chyba: po vystrihnutí by nič neostalo (skús nižší --prah)')
    f = []
    for i, (x, b) in enumerate(keep):
        f.append(f'[0:v]trim=start={x:.3f}:end={b:.3f},setpts=PTS-STARTPTS[v{i}];'
                 f'[0:a]atrim=start={x:.3f}:end={b:.3f},asetpts=PTS-STARTPTS,afade=t=in:d=0.01,'
                 f'afade=t=out:st={max(0, b - x - 0.01):.3f}:d=0.01[a{i}];')
    f.append(''.join(f'[v{i}][a{i}]' for i in range(len(keep))) + f'concat=n={len(keep)}:v=1:a=1[v][a]')
    subprocess.run([ff, '-v', 'error', '-y', '-i', a.video, '-filter_complex', ''.join(f), '-map', '[v]', '-map', '[a]',
                    '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-pix_fmt', 'yuv420p',
                    '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', a.strih], check=True)
    nove = sum(b - x for x, b in keep)
    print(f'strih: {a.strih}, {len(keep)} častí, {nove:.2f} s (o {trvanie - nove:.2f} s kratšie)')
    return 0


if __name__ == '__main__':
    sys.exit(main())
