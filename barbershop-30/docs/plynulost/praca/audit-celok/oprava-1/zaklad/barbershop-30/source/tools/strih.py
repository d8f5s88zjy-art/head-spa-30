"""Zvuk strihnutia nožnicami pri kliknutí (BARBERSHOP 30): vlastná syntéza, bez cudzích nahrávok.
Jedno strihnutie = kĺzanie čepelí po sebe (šum cez úzke kovové rezonancie, ktoré mierne stúpajú, ako sa bod
dotyku posúva k hrotu), na konci cvaknutie, keď sa čepele zatvoria, a krátke doznenie kovu.
Tri varianty za sebou v jednom súbore, každý v okne SLOT sekúnd (assets/atmosfera.js hrá náhodný z nich).

python3 source/tools/strih.py  ->  assets/audio/strih.webm a strih.m4a"""
import os, subprocess, numpy as np
from scipy.signal import butter, sosfilt, lfilter
from scipy.io import wavfile

SR = 48000
SLOT = 0.25                      # dĺžka okna jedného variantu (s); rovnaká hodnota je v atmosfera.js
rng = np.random.default_rng(7)


def bp(x, a, b, o=2): return sosfilt(butter(o, [a, b], 'band', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)


def reso(x, f0, f1, q):
    """Rezonátor (dvojpólový filter) s frekvenciou plynulo od f0 po f1, spracovaný po krátkych úsekoch."""
    out = np.zeros_like(x); y1 = y2 = 0.0
    n = len(x); blk = 64
    for i in range(0, n, blk):
        f = f0 + (f1 - f0) * (i / max(n - 1, 1))
        r = np.exp(-np.pi * f / (q * SR)); th = 2 * np.pi * f / SR
        a1, a2 = -2 * r * np.cos(th), r * r
        for j in range(i, min(i + blk, n)):
            y = x[j] - a1 * y1 - a2 * y2
            out[j] = y; y2, y1 = y1, y
    return out * (1 - r)


def snip(scrape=0.045, base=1.0, bright=1.0, click=1.0):
    n = int(SLOT * SR); t = np.arange(n) / SR
    out = np.zeros(n)
    # 1. kĺzanie čepelí: šum s drsnosťou (rýchle mikroudery) cez 4 kovové rezonancie
    ns = int(scrape * SR)
    grit = rng.normal(0, 1, ns) * (0.6 + 0.4 * (rng.random(ns) > 0.85))
    e = np.minimum(1, np.arange(ns) / (0.006 * SR)) * np.exp(-np.maximum(0, np.arange(ns) / SR - scrape * 0.6) / 0.01)
    e *= 0.5 + 0.5 * np.arange(ns) / ns                                  # zosilnie k hrotu
    s = np.zeros(ns)
    for f, g in [(3100, 1.0), (4650, 0.8), (6300, 0.6), (8600, 0.35)]:
        s += reso(grit, f * base, f * base * 1.12, 22) * g
    s = hp(s, 2200) * e * bright
    out[:ns] += s / (np.abs(s).max() + 1e-9) * 0.55
    # 2. cvaknutie pri zatvorení: krátky prechod + „tok“ okolo 1,2 kHz
    c0 = ns
    nc = int(0.012 * SR)
    imp = rng.normal(0, 1, nc) * np.exp(-np.arange(nc) / (0.0012 * SR))
    tok = np.sin(2 * np.pi * 1250 * base * np.arange(nc) / SR) * np.exp(-np.arange(nc) / (0.003 * SR))
    clk = bp(imp, 900, 9000) * 0.9 + tok * 0.5
    out[c0:c0 + nc] += clk / (np.abs(clk).max() + 1e-9) * 0.9 * click
    # 3. doznenie kovu: neharmonické zložky, rýchly útlm
    nr = n - c0; tr = np.arange(nr) / SR
    ring = sum(np.sin(2 * np.pi * f * base * tr + p) * a * np.exp(-tr / d)
               for f, a, d, p in [(2870, 0.5, 0.032, 0.3), (4410, 0.35, 0.024, 1.1), (7130, 0.22, 0.015, 2.0), (9850, 0.12, 0.01, 0.7)])
    out[c0:] += ring * 0.18 * click
    out = hp(out, 300)
    out *= np.minimum(1, np.maximum(0, (SLOT - t) / 0.02))                # bez cvaknutia na konci okna
    return out


VARIANTY = [snip(0.045, 1.0, 1.0, 1.0), snip(0.038, 1.06, 0.9, 0.85), snip(0.052, 0.95, 1.1, 1.0)]
x = np.concatenate(VARIANTY)
x *= 10 ** (-3 / 20) / np.abs(x).max()                                    # špička -3 dBFS
st = np.stack([x, np.roll(x, 12)], 1)                                     # jemná šírka v stereu

out = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'assets', 'audio')
os.makedirs(out, exist_ok=True)
wav = os.path.join(out, 'strih.wav')
wavfile.write(wav, SR, (st * 32767).astype(np.int16))
FF = subprocess.run(['python3', '-c', 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())'],
                    capture_output=True, text=True).stdout.strip() or 'ffmpeg'
subprocess.run([FF, '-v', 'error', '-y', '-i', wav, '-c:a', 'libopus', '-b:a', '96k', '-application', 'audio',
                os.path.join(out, 'strih.webm')], check=True)
subprocess.run([FF, '-v', 'error', '-y', '-i', wav, '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart',
                os.path.join(out, 'strih.m4a')], check=True)
os.remove(wav)
print(f'{len(VARIANTY)} varianty po {SLOT} s, špička -3 dBFS')
