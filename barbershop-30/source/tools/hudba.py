"""Hudba na pozadie webu BARBERSHOP 30: vlastná skladba (syntéza v Pythone), bez licencií tretích strán.
Verzia 2 (2026-10-12, po spätnej väzbe majiteľa „nie je príjemná, príliš silná, nesedí tam“): pokojná bossa nova
v duchu jazzového lounge, F dur, 76 BPM, 16 taktov (asi 50,5 s), slučka bez švu. Bez kopáka, virbla a praskania platne.
Nástroje: nylonová gitara (Karplus-Strong) v rytme bossa novy, mäkký kontrabas (korene a kvinty), metličky
(šuchot a jemné ťuknutia na 2 a 4), tichá plocha elektrického piana a v druhej polovici jemný vibrafón.
Všetko je navrhnuté ako slučka: udalosti sa vyrobia na tri obehy a vystrihne sa prostredný, dozvuky z konca tak
pokračujú na začiatku. Hlasitosť nízka (RMS -21 dBFS), na webe ešte stíšená (assets/atmosfera.js, VOL).

python3 source/tools/hudba.py  ->  assets/audio/hudba.webm a hudba.m4a (ffmpeg z imageio_ffmpeg alebo v PATH)
Dĺžka slučky (16 * 4 * 60 / 76 s) je aj v assets/atmosfera.js (LOOP)."""
import os, subprocess, numpy as np
from scipy.signal import butter, sosfilt, fftconvolve, lfilter
from scipy.io import wavfile

SR = 44100
BPM = 76
BEAT = 60 / BPM
BAR = 4 * BEAT
BARS = 16
LOOP = BARS * BAR
N = int(round(LOOP * SR))
CYC = 3
TOT = N * CYC
rng = np.random.default_rng(76)
SW = 0.54                               # jemný swing osmín (bossa je takmer rovná)


def hz(m): return 440.0 * 2 ** ((m - 69) / 12)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, a, b, o=2): return sosfilt(butter(o, [a, b], 'band', fs=SR, output='sos'), x)


def at(bar, beat, eighth=0):
    return bar * BAR + (beat + (SW if eighth else 0)) * BEAT


def put(buf, sig, t, gain=1.0):
    for c in range(CYC):
        i = int(round((t + c * LOOP) * SR))
        n = min(len(sig), TOT - i)
        if i >= 0 and n > 0:
            buf[i:i + n] += sig[:n] * gain


def ks(f, dur, soft=0.5, damp=0.996, cut=5000, tail=0.12):
    """Brnknutá struna (Karplus-Strong): oneskorenie N vzoriek s priemerom dvoch susedných (útlm výšok)."""
    n = int((dur + 2.0) * SR)
    Nd = max(2, int(round(SR / f - 0.5)))
    exc = lp(rng.uniform(-1, 1, Nd * 2), 900 + 3500 * (1 - soft))[:Nd]      # mäkší úder = tmavší začiatok
    x = np.zeros(n); x[:Nd] = exc / (np.abs(exc).max() + 1e-9)
    a = np.zeros(Nd + 2); a[0] = 1; a[Nd] = a[Nd + 1] = -damp * 0.5
    y = lfilter([1.0], a, x)
    t = np.arange(n) / SR
    y *= np.where(t < dur, 1.0, np.exp(-(t - dur) / tail))
    return lp(y, cut)


def guitar(m, dur, vel):
    y = ks(hz(m), dur, soft=0.55, damp=0.9965, cut=4200, tail=0.18)
    y = y + 0.35 * bp(y, 95, 260)                                         # telo gitary
    return y * vel


def upright(m, dur, vel):
    y = ks(hz(m), dur, soft=0.85, damp=0.991, cut=750, tail=0.08)
    n = len(y); t = np.arange(n) / SR
    thump = np.sin(2 * np.pi * hz(m) * t) * np.exp(-t / 0.25) * 0.5          # plnší tón
    return lp(y + thump, 700) * vel


def pad(m, dur, vel):
    n = int((dur + 1.2) * SR); t = np.arange(n) / SR; f = hz(m)
    x = np.sin(2 * np.pi * f * t) + 0.18 * np.sin(4 * np.pi * f * t)
    e = np.minimum(1, t / 0.6) * np.where(t < dur, 1.0, np.exp(-(t - dur) / 0.5))
    return x * e * vel


def vibes(m, dur, vel):
    n = int((dur + 2.2) * SR); t = np.arange(n) / SR; f = hz(m)
    x = np.sin(2 * np.pi * f * t) + 0.1 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t / 0.2)
    trem = 1 - 0.12 * (0.5 + 0.5 * np.sin(2 * np.pi * 4.2 * t))
    e = np.minimum(1, t / 0.008) * np.exp(-t / 1.5) * np.where(t < dur + 0.5, 1.0, np.exp(-(t - dur - 0.5) / 0.4))
    return lp(x * trem * e, 4500) * vel


def brush_tap(vel):
    n = int(0.12 * SR); t = np.arange(n) / SR
    return lp(bp(rng.normal(0, 1, n), 1800, 9000), 7000) * np.exp(-t / 0.035) * vel


# ---------------------------------------------------------------- harmónia (F dur), 8 taktov dvakrát
# takt: [(od doby, bas, akord gitary 4 tóny)]
PROG = [
    [(0, 41, [57, 64, 67, 72])],                                  # Fmaj9
    [(0, 38, [53, 60, 64, 69])],                                  # Dm9
    [(0, 43, [58, 65, 69, 74])],                                  # Gm9
    [(0, 36, [58, 64, 69, 74])],                                  # C13
    [(0, 41, [57, 64, 67, 72])],                                  # Fmaj9
    [(0, 45, [55, 60, 64, 67]), (2, 38, [54, 60, 63, 69])],       # Am7, D7(b9)
    [(0, 43, [58, 65, 69, 74])],                                  # Gm9
    [(0, 36, [58, 65, 69, 74]), (2, 36, [58, 64, 69, 74])],       # C9sus4, C13
]
# rytmus gitary (osminy v takte): striedajú sa dva takty, ako pri bossa nove
RYT = [[0, 3, 6], [1, 4, 6]]

gt = np.zeros(TOT); bs = np.zeros(TOT); br = np.zeros(TOT); pd = np.zeros(TOT); vb = np.zeros(TOT)
for b in range(BARS):
    segs = PROG[b % 8]
    def chord_at(eighth):
        beat = eighth / 2
        cur = segs[0]
        for s in segs:
            if s[0] <= beat: cur = s
        return cur
    for k, e8 in enumerate(RYT[b % 2]):
        _, _, ch = chord_at(e8)
        t0 = at(b, e8 // 2, e8 % 2)
        dur = BEAT * (0.9 if k < 2 else 1.2)
        for j, m in enumerate(ch):                                    # palec a prsty: jemné rozloženie
            put(gt, guitar(m, dur, 0.34 + 0.06 * rng.random()), t0 + 0.009 * j + rng.uniform(0, 0.004))
    # kontrabas: koreň na 1, kvinta (alebo nový koreň) na 3
    for s in segs:
        put(bs, upright(s[1], BEAT * 1.7, 0.75), at(b, s[0]))
    if len(segs) == 1:
        put(bs, upright(segs[0][1] + 7, BEAT * 1.6, 0.6), at(b, 2))
    # tichá plocha: tercia a septima akordu cez celý takt
    for s in segs:
        L = (BAR if len(segs) == 1 else BAR / 2)
        for m in s[2][:2]:
            put(pd, pad(m, L * 0.95, 0.05), at(b, s[0]))
    # metličky: ťuknutie na 2 a 4, šuchot cez celý takt
    for q in (1, 3):
        put(br, brush_tap(0.5 + 0.1 * rng.random()), at(b, q))

# šuchot metličky: šum vo vysokom pásme, hlasitosť sa vlní po dvoch dobách
tt = np.arange(TOT) / SR
swirl = 0.55 + 0.45 * np.sin(2 * np.pi * tt / (2 * BEAT) - np.pi / 2) ** 2
# šum je jeden obeh zopakovaný trikrát, aby slučka nemala šev ani v šume
br += np.tile(lp(bp(rng.normal(0, 1, N), 2500, 9000), 8000), CYC) * swirl * 0.18

# vibrafón v taktoch 9–16 (tóny akordov, F dur)
MEL = [
    (8, 0, 76, 1.5), (8, 2, 72, 1.0), (8, 3, 74, 1.0),
    (9, 0, 77, 2.0), (9, 2.5, 76, 1.0),
    (10, 0, 74, 1.5), (10, 2, 70, 1.5),
    (11, 0, 69, 2.0), (11, 2, 67, 2.0),
    (12, 0, 72, 1.0), (12, 1, 76, 1.0), (12, 2, 79, 2.0),
    (13, 0, 76, 1.5), (13, 2, 75, 1.0), (13, 3, 74, 1.0),
    (14, 0, 74, 2.0), (14, 2, 72, 1.0), (14, 3, 70, 1.0),
    (15, 0, 69, 3.0),
]
for b, q, m, d in MEL:
    put(vb, vibes(m, d * BEAT, 0.5), b * BAR + q * BEAT)

# ---------------------------------------------------------------- mix
IR = rng.normal(0, 1, int(SR * 2.2)) * np.exp(-np.arange(int(SR * 2.2)) / SR / 0.55)
IR = lp(hp(IR, 300), 5000); IR /= np.sqrt((IR ** 2).sum()) * 5
def verb(x): return fftconvolve(x, IR)[:len(x)]

pan_g = 0.25                                                          # gitara mierne vľavo, vibrafón vpravo
gL = gt * np.cos((-pan_g + 1) * np.pi / 4) * 1.414; gR = gt * np.sin((-pan_g + 1) * np.pi / 4) * 1.414
gv = verb(gt)
L = gL * 0.6 + gv * 0.22; R = gR * 0.6 + np.roll(gv, 300) * 0.22
L += bs * 0.5; R += bs * 0.5
pv = verb(pd); L += pd * 0.6 + pv * 0.3; R += pd * 0.6 + np.roll(pv, 250) * 0.3
L += br * 0.16; R += np.roll(br, 40) * 0.16
vv = verb(vb); L += vb * 0.22 + vv * 0.25; R += vb * 0.3 + np.roll(vv, 280) * 0.25
mix = np.stack([L, R])
mix = lp(hp(mix, 45), 9000)
mix = np.tanh(mix * 1.05) / np.tanh(1.05)
loop = mix[:, N:2 * N]
loop *= 10 ** (-21 / 20) / np.sqrt((loop ** 2).mean())
pk = np.abs(loop).max()
if pk > 0.5: loop *= 0.5 / pk                                          # špička najviac -6 dBFS

out = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'assets', 'audio')
os.makedirs(out, exist_ok=True)
wav = os.path.join(out, 'hudba.wav')
wavfile.write(wav, SR, (loop.T * 32767).astype(np.int16))
seam = np.abs(loop[:, 0] - loop[:, -1]).max()
print(f'slučka {LOOP:.3f} s, {N} vzoriek; RMS {20*np.log10(np.sqrt((loop**2).mean())):.1f} dBFS; '
      f'špička {20*np.log10(np.abs(loop).max()):.1f} dBFS; skok na šve {seam:.4f}')
# web: Opus (WebM) pre Chrome, Firefox, Edge; AAC (M4A) pre Safari. WAV sa nenecháva v assets.
FF = subprocess.run(['python3', '-c', 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())'],
                    capture_output=True, text=True).stdout.strip() or 'ffmpeg'
subprocess.run([FF, '-v', 'error', '-y', '-i', wav, '-c:a', 'libopus', '-b:a', '96k', '-vbr', 'on', '-application', 'audio',
                os.path.join(out, 'hudba.webm')], check=True)
subprocess.run([FF, '-v', 'error', '-y', '-i', wav, '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart',
                os.path.join(out, 'hudba.m4a')], check=True)
if os.environ.get('HUDBA_WAV'):
    os.replace(wav, os.environ['HUDBA_WAV'])
else:
    os.remove(wav)
