"""Zvuk k videu GYM KLUB (strih z fotiek): A mol, 100 BPM, podľa časov strihov z edl.json.
Tichý úvod s dronom, po ťuknutí nastúpi pulz basu a kopák, šum pri každom prechode dverami,
jemný úder pri strihoch, stúpanie pred koncom a záverečný akord na karte."""
import json, numpy as np
from PIL import Image
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile

E = json.load(open('edl.json'))
SR, DUR = 48000, E['dur']
N = int(SR * DUR)
BEAT = 60 / 90
rng = np.random.default_rng(3)
t = np.arange(N) / SR
L = np.zeros(N); R = np.zeros(N)

def hz(n): return 440 * 2 ** ((n - 69) / 12)            # MIDI → Hz
def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, a, b, o=2): return sosfilt(butter(o, [a, b], 'band', fs=SR, output='sos'), x)
def add(sig, at, gain=1.0, pan=0.0):
    i = int(at * SR); n = min(len(sig), N - i)
    if n <= 0: return
    L[i:i + n] += sig[:n] * gain * np.sqrt((1 - pan) / 2) * 1.414
    R[i:i + n] += sig[:n] * gain * np.sqrt((1 + pan) / 2) * 1.414
def env(n, a, d, sustain=0.0):
    e = np.ones(n); na = max(1, int(a * SR)); e[:na] = np.linspace(0, 1, na)
    tt = np.arange(n - na) / SR; e[na:] = sustain + (1 - sustain) * np.exp(-tt / max(d, 1e-3))
    return e
def saw(f, n, det=0.0):
    ph = np.cumsum(np.full(n, f) / SR); out = 2 * (ph % 1) - 1
    if det: ph2 = np.cumsum(np.full(n, f * (1 + det)) / SR); out = 0.5 * (out + 2 * (ph2 % 1) - 1)
    return out
IR = rng.normal(0, 1, int(SR * 2.2)) * np.exp(-np.arange(int(SR * 2.2)) / SR / 0.55)
IR = lp(IR, 6000); IR /= np.abs(IR).sum() ** 0.5 * 18
def verb(x, wet=0.3): return x * (1 - wet) + fftconvolve(x, IR)[:len(x)] * wet

def boom(length=1.4, f0=90, f1=34, gain=1.0):
    m = int(length * SR); tt = np.arange(m) / SR
    f = f1 + (f0 - f1) * np.exp(-tt / .09)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(m, .002, .45)
    s += lp(rng.normal(0, 1, m), 900) * env(m, .001, .05) * .5
    return s * gain
def kick():
    m = int(.32 * SR); tt = np.arange(m) / SR
    f = 44 + 110 * np.exp(-tt / .035)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(m, .001, .12) + lp(rng.normal(0, 1, m), 2500) * env(m, .0005, .006) * .25
def whoosh(length, a, b, gain):
    # šum cez pásmový filter s plynule sa posúvajúcou frekvenciou (stavová premenná, bez cvakania)
    m = int(length * SR); x = rng.normal(0, 1, m); out = np.zeros(m)
    lo = hi = 0.0
    for j in range(m):
        fc = a * (b / a) ** (j / m)
        ch = 1 - np.exp(-2 * np.pi * fc * 1.5 / SR); cl = 1 - np.exp(-2 * np.pi * fc / 1.5 / SR)
        hi += ch * (x[j] - hi); lo += cl * (hi - lo); out[j] = hi - lo
    return out / (np.abs(out).max() + 1e-9) * np.sin(np.linspace(0, np.pi, m)) ** 1.5 * gain

BEAT = 60 / 100
t0 = E['tap']; tend = E['end']
# dron: A1 + E2, pred ťuknutím tichšie
drone = lp(saw(hz(33), N, .004) * .6 + saw(hz(40), N, .003) * .4, 420)
lvl = np.where(t < t0, .1 + .12 * np.clip(t / max(t0, .1), 0, 1), np.where(t < tend, .14, .14 * np.exp(-(t - tend) / .5)))
L += drone * lvl; R += drone * lvl
# ťuk: tón A5
m = int(.5 * SR); blip = (np.sin(2 * np.pi * hz(81) * np.arange(m) / SR) + .3 * np.sin(4 * np.pi * hz(81) * np.arange(m) / SR)) * env(m, .002, .07)
add(verb(blip, .35), t0, .1)
add(boom(1.2, 90, 36), t0 + .25, .45)
# groove od ťuknutia po koniec
K = kick(); duck = np.ones(N)
chords = [(57, [57, 60, 64]), (53, [53, 57, 60]), (48, [55, 60, 64]), (55, [55, 59, 62])]
bar = 4 * BEAT
for b in np.arange(t0 + .25, tend - .05, BEAT):
    add(K, b, .5)
    i = int(b * SR); mm = min(int(.3 * SR), N - i)
    if mm > 0: duck[i:i + mm] = np.minimum(duck[i:i + mm], 1 - .55 * np.exp(-np.arange(mm) / SR / .09))
for b in np.arange(t0 + .25 + BEAT / 2, tend - .05, BEAT):
    mm = int(.05 * SR); add(hp(rng.normal(0, 1, mm), 7000) * env(mm, .001, .012), b, .05, .25)
bass = np.zeros(N); pad = np.zeros(N)
for s in np.arange(t0 + .25, tend - 1e-6, BEAT / 2):
    root = chords[int((s - t0 - .25) // bar) % 4][0] - 12
    mm = int(BEAT / 2 * SR * .92)
    note = lp(saw(hz(root - 12), mm, .006), 520) * env(mm, .004, .16, .25)
    i = int(s * SR); k = min(mm, N - i); bass[i:i + k] += note[:k]
for j, s in enumerate(np.arange(t0 + .25, tend, bar)):
    notes = chords[j % 4][1]; e_ = min(tend, s + bar)
    mm = int((e_ - s + .6) * SR)
    x = sum(saw(hz(nn), mm, .005) for nn in notes) / 3
    x = lp(x, 1500) * env(mm, .4, 9, .9) * np.clip((e_ + .6 - s - np.arange(mm) / SR) / .6, 0, 1)
    i = int(s * SR); k = min(mm, N - i); pad[i:i + k] += x[:k]
L += bass * duck * .4; R += bass * duck * .4
pv = verb(pad, .45); L += pv * .09 * duck ** .5; R += np.roll(pv, 240) * .09 * duck ** .5
# prechody dverami: šum; strihy: jemný úder
for tm in E['moves']:
    add(verb(whoosh(.9, 350, 4200, 1.0), .3), max(0, tm - .1), .15, rng.uniform(-.3, .3))
for tm in E['cuts'][1:]:
    add(verb(whoosh(.35, 2500, 500, 1.0), .25), max(0, tm - .18), .08, rng.uniform(-.3, .3))
# stúpanie a záver
mm = int(1.6 * SR); rr = hp(rng.normal(0, 1, mm), 500) * np.linspace(0, 1, mm) ** 2.5
tt = np.arange(mm) / SR; rise = np.sin(2 * np.pi * np.cumsum(220 + 440 * (tt / 1.6) ** 2) / SR) * np.linspace(0, 1, mm) ** 2
add(lp(rr, 9000) * .5 + rise * .1, tend - 1.6, .2)
add(boom(1.8, 100, 32), tend, .85)
mm = int((DUR - tend) * SR)
am9 = [45, 52, 55, 59, 60, 64]
fin = sum(np.sin(2 * np.pi * hz(nn) * np.arange(mm) / SR + j) * (1 / (1 + j * .3)) for j, nn in enumerate(am9))
fin = verb(lp(fin / 3, 3000) * env(mm, .05, 1.6, .2), .5) * np.clip((DUR - tend - np.arange(mm) / SR) / .6, 0, 1)
add(fin, tend, .22)
mix = np.stack([L, R])
low = lp(mix.mean(0), 120); mix = hp(mix, 120) + low
mix = hp(mix, 25); mix = np.tanh(mix * 1.15) / np.tanh(1.15)
mix *= np.clip((DUR - t) / .4, 0, 1) * np.clip(t / .15, 0, 1)
mix *= 10 ** (-16 / 20) / np.sqrt((mix ** 2).mean())
pk = np.abs(mix).max()
if pk > .89: mix *= .89 / pk
wavfile.write('soundtrack.wav', SR, (mix.T * 32767).astype(np.int16))
print('RMS dBFS', round(20 * np.log10(np.sqrt((mix ** 2).mean())), 1), 'peak', round(float(np.abs(mix).max()), 3))
