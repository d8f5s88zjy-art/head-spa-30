"""Hudba na pozadie webu BARBERSHOP 30: vlastná skladba (syntéza v Pythone), bez licencií tretích strán.
Lo-fi jazz hip-hop, 82 BPM, A mol / C dur, 16 taktov (asi 46,8 s), slučka bez švu.
Nástroje: elektrické piano (FM, ako Rhodes) s tremolom, mäkký bas, bicie s posunutým rytmom (swing),
vibrafón v druhej polovici, praskanie platne a jemné kolísanie pásky. Všetko je navrhnuté ako slučka:
udalosti sa vyrobia na tri obehy a vystrihne sa prostredný, takže dozvuky z konca pokračujú na začiatku.

python3 source/tools/hudba.py  ->  assets/audio/hudba.webm a hudba.m4a (ffmpeg z imageio_ffmpeg alebo v PATH)
Dĺžka slučky (16 * 4 * 60 / 82 s) je aj v assets/atmosfera.js (LOOP)."""
import os, subprocess, numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile

SR = 44100
BPM = 82
BEAT = 60 / BPM
BAR = 4 * BEAT
BARS = 16
LOOP = BARS * BAR                       # dĺžka slučky (s)
N = int(round(LOOP * SR))
CYC = 3                                 # obehy pri výrobe; vystrihne sa prostredný
TOT = N * CYC
rng = np.random.default_rng(30)
L = np.zeros(TOT); R = np.zeros(TOT)
SW = 0.6                                # swing osmín (0,5 = rovno)


def hz(m): return 440.0 * 2 ** ((m - 69) / 12)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, a, b, o=2): return sosfilt(butter(o, [a, b], 'band', fs=SR, output='sos'), x)


def at(bar, beat, eighth=0):
    """Čas v sekundách: takt, doba (0..3), osmina 0/1 so swingom."""
    return bar * BAR + (beat + (SW if eighth else 0)) * BEAT


def put(sig, t, gain=1.0, pan=0.0, buf=None):
    """Vloží zvuk do všetkých troch obehov (aby slučka mala dozvuky z predchádzajúceho obehu)."""
    for c in range(CYC):
        i = int(round((t + c * LOOP) * SR))
        if i < 0: continue
        n = min(len(sig), TOT - i)
        if n <= 0: continue
        if buf is not None:
            buf[i:i + n] += sig[:n] * gain
        else:
            L[i:i + n] += sig[:n] * gain * np.cos((pan + 1) * np.pi / 4) * 1.414
            R[i:i + n] += sig[:n] * gain * np.sin((pan + 1) * np.pi / 4) * 1.414


def env_adsr(n, a, d, s, rel_at=None, rel=0.25):
    t = np.arange(n) / SR
    e = np.where(t < a, t / max(a, 1e-4), s + (1 - s) * np.exp(-(t - a) / max(d, 1e-4)))
    if rel_at is not None:
        e *= np.where(t < rel_at, 1.0, np.exp(-(t - rel_at) / rel))
    return e


# ---------------------------------------------------------------- nástroje
def rhodes(m, dur, vel=1.0):
    """Elektrické piano: FM 1:1 (teplé telo) + 14:1 (cinknutie ladičky), útlm podľa výšky tónu."""
    f = hz(m); n = int((dur + 1.6) * SR); t = np.arange(n) / SR
    idx = (1.5 * vel + 0.3) * np.exp(-t / 0.5) + 0.25
    mod = np.sin(2 * np.pi * f * t) * idx
    body = np.sin(2 * np.pi * f * t + mod)
    tine = np.sin(2 * np.pi * f * t + 0.9 * vel * np.exp(-t / 0.03) * np.sin(2 * np.pi * f * 14 * t)) - np.sin(2 * np.pi * f * t)
    decay = 2.4 * (440 / f) ** 0.35
    e = env_adsr(n, 0.004, decay, 0.0, rel_at=dur, rel=0.22)
    x = (body + 0.45 * tine * np.exp(-t / 0.08)) * e * vel
    return lp(x, 4200)


def bass(m, dur, vel=1.0):
    f = hz(m); n = int((dur + 0.3) * SR); t = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * t) + 0.28 * np.sin(4 * np.pi * f * t) + 0.08 * np.sin(6 * np.pi * f * t)
    x = np.tanh(1.6 * x) / np.tanh(1.6)
    e = env_adsr(n, 0.008, 0.45, 0.35, rel_at=dur, rel=0.06)
    # krátky „prstový“ nástup
    pluck = lp(rng.normal(0, 1, n), 900) * np.exp(-t / 0.012) * 0.15
    return lp((x + pluck) * e * vel, 700)


def vibes(m, dur, vel=1.0):
    f = hz(m); n = int((dur + 2.0) * SR); t = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * t) + 0.12 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t / 0.25) + 0.05 * np.sin(2 * np.pi * f * 10 * t) * np.exp(-t / 0.05)
    trem = 1 - 0.18 * (0.5 + 0.5 * np.sin(2 * np.pi * 5.2 * t))
    e = env_adsr(n, 0.003, 1.6, 0.0, rel_at=dur + 0.4, rel=0.5)
    return lp(x * e * trem * vel, 5000)


def kick(vel=1.0):
    n = int(0.45 * SR); t = np.arange(n) / SR
    f = 48 + 75 * np.exp(-t / 0.025)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.22)
    click = lp(rng.normal(0, 1, n), 1800) * np.exp(-t / 0.004) * 0.25
    return np.tanh(1.4 * (x + click)) * vel


def snare(vel=1.0):
    n = int(0.4 * SR); t = np.arange(n) / SR
    noise = bp(rng.normal(0, 1, n), 1500, 6500) * np.exp(-t / 0.07)
    body = np.sin(2 * np.pi * 185 * t) * np.exp(-t / 0.05) + 0.5 * np.sin(2 * np.pi * 330 * t) * np.exp(-t / 0.03)
    return lp(noise * 0.75 + body * 0.45, 5200) * vel


def rim(vel=1.0):
    n = int(0.12 * SR); t = np.arange(n) / SR
    x = np.sin(2 * np.pi * 1650 * t) * np.exp(-t / 0.012) + bp(rng.normal(0, 1, n), 2000, 5000) * np.exp(-t / 0.008) * 0.6
    return x * vel


def hat(vel=1.0, open_=False):
    n = int((0.35 if open_ else 0.09) * SR); t = np.arange(n) / SR
    x = hp(rng.normal(0, 1, n), 6500, 4)
    x *= np.exp(-t / (0.12 if open_ else 0.022))
    return lp(x, 9500) * vel


# dozvuk (jedna miestnosť pre všetko, rôzny podiel)
IR = rng.normal(0, 1, int(SR * 2.4)) * np.exp(-np.arange(int(SR * 2.4)) / SR / 0.6)
IR = lp(hp(IR, 250), 5500); IR /= np.sqrt((IR ** 2).sum()) * 6
def verb(x): return fftconvolve(x, IR)[:len(x)]


# ---------------------------------------------------------------- harmónia (C dur / A mol)
# takt: (bas, akord pre piano)
PROG = [
    (41, [57, 60, 64, 67]),   # Fmaj9 (bez základu): A C E G
    (40, [55, 59, 62, 67]),   # Em7: G B D G
    (38, [53, 57, 60, 64]),   # Dm9: F A C E
    (43, [53, 59, 64, 69]),   # G13: F B E A
    (36, [52, 55, 59, 62]),   # Cmaj9: E G B D
    (33, [55, 59, 60, 64]),   # Am9: G B C E
    (38, [53, 57, 60, 65]),   # Dm9 (F hore)
    (40, [56, 62, 67, 71]),   # E7(#9): G# D G B
]

ep = np.zeros(TOT); bs = np.zeros(TOT); dr = np.zeros(TOT); vb = np.zeros(TOT)
for b in range(BARS):
    root, ch = PROG[b % 8]
    # piano: úder na 1 (rozložený o pár ms), krátke „and of 2“ alebo predstih do ďalšieho taktu
    for k, m in enumerate(ch):
        v = 0.42 + 0.08 * rng.random()
        put(rhodes(m, BEAT * 2.3, v), at(b, 0) + 0.012 * k + rng.uniform(0, 0.006), buf=ep)
    if b % 2 == 0:
        for k, m in enumerate(ch[1:]):
            put(rhodes(m, BEAT * 0.45, 0.3), at(b, 1, 1) + 0.01 * k, buf=ep)
    else:
        nr, nch = PROG[(b + 1) % 8]
        for k, m in enumerate(nch[:3]):
            put(rhodes(m, BEAT * 0.4, 0.26), at(b, 3, 1) + 0.01 * k, buf=ep)
    # bas: 1 (bodkovaná štvrťová), kvinta/oktáva na 2a, prechodový tón na 4a
    put(bass(root, BEAT * 1.4, 0.9), at(b, 0), buf=bs)
    put(bass(root + (7 if b % 2 == 0 else 12), BEAT * 0.5, 0.6), at(b, 1, 1), buf=bs)
    put(bass(root + 7, BEAT * 0.8, 0.7), at(b, 2, 1), buf=bs)
    nr = PROG[(b + 1) % 8][0]
    put(bass(nr + (1 if nr < root else -1), BEAT * 0.4, 0.55), at(b, 3, 1), buf=bs)
    # bicie: kopák 1, 2a (niekedy 3a), virbel 2 a 4, hi-hat osminy so swingom
    put(kick(1.0), at(b, 0), buf=dr)
    put(kick(0.75), at(b, 1, 1), buf=dr)
    if b % 4 == 3: put(kick(0.6), at(b, 2, 1), buf=dr)
    put(snare(0.8), at(b, 1) + 0.012, buf=dr)
    put(snare(0.85), at(b, 3) + 0.012, buf=dr)
    if b % 8 == 7:   # malá výplň na konci frázy
        put(snare(0.35), at(b, 3, 1) + 0.01, buf=dr)
        put(rim(0.4), at(b, 2, 1), buf=dr)
    for q in range(4):
        for e8 in (0, 1):
            v = (0.32 if e8 == 0 else 0.2) * (0.85 + 0.3 * rng.random())
            op = (b % 4 == 1 and q == 3 and e8 == 1)
            put(hat(v, op), at(b, q, e8), buf=dr, gain=1.0)

# vibrafón v taktoch 9–16: jednoduchý motív z tónov akordov (A mol pentatonika)
MEL = [  # (takt, doba, osmina, tón, dĺžka v dobách)
    (8, 0, 0, 76, 1.5), (8, 1, 1, 74, 0.5), (8, 2, 0, 72, 2.0),
    (9, 0, 1, 71, 1.0), (9, 2, 0, 74, 1.5),
    (10, 0, 0, 71, 1.5), (10, 1, 1, 69, 0.5), (10, 2, 0, 67, 2.0),
    (11, 1, 0, 69, 1.0), (11, 2, 1, 71, 1.5),
    (12, 0, 0, 72, 1.5), (12, 1, 1, 71, 0.5), (12, 2, 0, 67, 1.5),
    (13, 0, 1, 64, 1.0), (13, 2, 0, 67, 2.0),
    (14, 0, 0, 69, 1.5), (14, 2, 0, 72, 1.0), (14, 3, 0, 74, 1.0),
    (15, 0, 0, 71, 3.0),
]
for b, q, e8, m, d in MEL:
    put(vibes(m, d * BEAT, 0.5), at(b, q, e8), buf=vb)

# ---------------------------------------------------------------- mix
t = np.arange(TOT) / SR
# „pumpovanie“: piano a bas sa jemne stiahnu pri kopáku
duck = np.ones(TOT)
for b in range(BARS):
    for kt in (at(b, 0), at(b, 1, 1)):
        for c in range(CYC):
            i = int((kt + c * LOOP) * SR); n = min(int(0.28 * SR), TOT - i)
            if n > 0: duck[i:i + n] = np.minimum(duck[i:i + n], 1 - 0.3 * np.exp(-np.arange(n) / SR / 0.1))
# tremolo pravo-ľavo na piane (perióda delí slučku)
fr = round(0.9 * LOOP) / LOOP              # ~0,9 Hz, celý počet periód v slučke
pan = 0.35 * np.sin(2 * np.pi * fr * t)
epv = verb(ep)
L += (ep * np.cos((pan + 1) * np.pi / 4) * 1.414 * 0.72 + epv * 0.3) * duck
R += (ep * np.sin((pan + 1) * np.pi / 4) * 1.414 * 0.72 + np.roll(epv, 300) * 0.3) * duck
L += bs * 0.4 * duck; R += bs * 0.4 * duck
drv = verb(dr)
drm = lp(np.tanh(1.3 * dr) / np.tanh(1.3), 7000)
L += drm * 0.36 + drv * 0.06; R += drm * 0.36 + np.roll(drv, 220) * 0.06
vbv = verb(vb)
L += vb * 0.34 + vbv * 0.24; R += vb * 0.36 + np.roll(vbv, 260) * 0.24
# praskanie platne a šum
cr = np.zeros(TOT)
k = rng.poisson(14 * TOT / SR)
pos = rng.integers(0, TOT, k)
cr[pos] = rng.choice([-1, 1], k) * rng.pareto(3.0, k) * 0.25
cr = hp(lp(cr, 6000), 900)
hiss = lp(hp(rng.normal(0, 1, TOT), 2000), 7000) * 0.006
L += cr * 0.5 + hiss; R += np.roll(cr, 37) * 0.5 + np.roll(hiss, 91)
mix = np.stack([L, R])
# páska: jemné kolísanie výšky (wow 0,5 Hz, celý počet periód v slučke)
fw = round(0.5 * LOOP) / LOOP
dly = 0.0012 * SR * (1 + np.sin(2 * np.pi * fw * t)) / 2
idx = np.arange(TOT) - dly
mix = np.stack([np.interp(idx, np.arange(TOT), ch) for ch in mix])
# teplý filter a mierna saturácia
mix = lp(hp(mix, 35), 9500)
mix = np.tanh(mix * 1.2) / np.tanh(1.2)
loop = mix[:, N:2 * N]
# hlasitosť: RMS -17 dBFS, špička pod -1 dBFS
loop *= 10 ** (-17 / 20) / np.sqrt((loop ** 2).mean())
pk = np.abs(loop).max()
if pk > 0.89: loop *= 0.89 / pk

out = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'assets', 'audio')
os.makedirs(out, exist_ok=True)
wav = os.path.join(out, 'hudba.wav')
wavfile.write(wav, SR, (loop.T * 32767).astype(np.int16))
seam = np.abs(loop[:, 0] - loop[:, -1]).max()
print(f'slučka {LOOP:.3f} s, {N} vzoriek; RMS {20*np.log10(np.sqrt((loop**2).mean())):.1f} dBFS; '
      f'špička {np.abs(loop).max():.3f}; skok na šve {seam:.4f}')
# web: Opus (WebM) pre Chrome, Firefox, Edge; AAC (M4A) pre Safari. WAV sa nenecháva v assets.
FF = subprocess.run(['python3', '-c', 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())'],
                    capture_output=True, text=True).stdout.strip() or 'ffmpeg'
subprocess.run([FF, '-v', 'error', '-y', '-i', wav, '-c:a', 'libopus', '-b:a', '96k', '-vbr', 'on', '-application', 'audio',
                os.path.join(out, 'hudba.webm')], check=True)
subprocess.run([FF, '-v', 'error', '-y', '-i', wav, '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart',
                os.path.join(out, 'hudba.m4a')], check=True)
os.remove(wav)
