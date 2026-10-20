#!/usr/bin/env python3
"""Simulácia pružiny filmu (film.js:1236–1243) pri 60 Hz na skutočnej dráhe skrolu z nahrávky over.mjs.
Zisťuje, či by pri plynulom kreslení (telefón s grafikou) švih prekročil |T-S| > 1,5 záberu (skoková vetva:
held = null, dark = shown, cieľ bez textúry = vymazané plátno).   python3 pruzina.py runs/<meno> [--hz=60]"""
import json, sys, bisect
run = sys.argv[1]
hz = float(next((a.split('=')[1] for a in sys.argv if a.startswith('--hz=')), 60))
L = [x for x in json.load(open(run + '/log.json')) if 'f' in x and 'y' in x]
m = json.load(open(run + '/meta.json')); t0 = m['tNav']
ts = [x['t'] for x in L]; Ts = [x['f']['T'] for x in L]
def T_at(t):
    i = bisect.bisect_right(ts, t) - 1
    if i < 0: return Ts[0]
    if i >= len(ts) - 1: return Ts[-1]
    a, b = ts[i], ts[i + 1]
    return Ts[i] + (Ts[i + 1] - Ts[i]) * (t - a) / max(1, b - a)
w0, dt = 6.5, 1.0 / hz
S, V = Ts[0], 0.0
t = ts[0]; jumps = []; mx = 0; mxt = 0
while t < ts[-1]:
    T = T_at(t)
    V += ((T - S) * w0 * w0 - 2 * w0 * V) * dt; S += V * dt
    if abs(T - S) > mx: mx = abs(T - S); mxt = t
    if abs(T - S) > 1.5: jumps.append((round(t - t0), round(S, 2), round(T, 2))); S = T; V = 0
    t += dt * 1000
print(f"{run}: {hz:.0f} Hz, najväčšie |T-S| = {mx:.2f} záberu v čase {round(mxt - t0)} ms; skokov (>1,5): {len(jumps)}")
for j in jumps: print('   skok v', j[0], 'ms: S', j[1], '-> T', j[2])
