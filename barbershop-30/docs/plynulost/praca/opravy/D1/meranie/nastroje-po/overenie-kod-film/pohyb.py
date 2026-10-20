#!/usr/bin/env python3
"""Overenie KF-04: pohyb obrazu filmu v pokoji (stály pohyb kamery z place(), film.js:999–1004) v pixeloch plátna.
Telefón 390×844, plátno 780×1688 (DPR 2), FOV 50, DIST 10, DRIFT 0,6, uAmt 0,3, presah 1,24, výrez 1536×2731.
Kamera: position = eye + off, lookAt(eye + 0,08·off v x,y; z = 0). Body roviny sa posúvajú k uEye podľa hĺbky z (VERT)."""
import numpy as np
W, H = 780, 1688
FOV, DIST, AMT, DRIFT = 50.0, 10.0, 0.3, 0.6
tanH = np.tan(np.radians(FOV) / 2)
vh = 2 * DIST * tanH; vw = vh * (390 / 844)
pa = 1536 / 2731
pw = vw * 1.24; ph = pw / pa
if ph < vh * 1.24: ph = vh * 1.24; pw = ph * pa
eye = np.array([0.0, (0.5 - 0.55) * ph, DIST])
# pohyb záberu 'rise' v strede kotvy (t = 0,5): m = [[-ARC*0.4,-ARC*0.5,0.04],[ARC*0.4,ARC*0.5,-0.12]], ARC = 0,02
ARC = 0.02; m0 = np.array([-ARC*0.4, -ARC*0.5, 0.04]); m1 = np.array([ARC*0.4, ARC*0.5, -0.12])
t = 0.5; e = t*t*(3-2*t)*0.6 + t*0.4
base = (m0 + (m1 - m0) * e) * np.array([vw, vh, DIST])
def cam(sec):
    dr = DRIFT
    off = base.copy()
    off[0] += (np.sin(sec*0.37)*0.006 + np.sin(sec*0.13+0.7)*0.011) * dr * vw
    off[1] += (np.sin(sec*0.29+1.3)*0.004 + np.sin(sec*0.09+2.1)*0.006) * dr * vh
    off[2] += (np.sin(sec*0.21+0.4)*0.008 + np.sin(sec*0.07+1.9)*0.014) * DIST * dr
    off[2] -= 0  # bez strihu
    pos = eye + off
    tgt = np.array([eye[0] + off[0]*0.08, eye[1] + off[1]*0.08, 0.0])
    return pos, tgt
def project(P, pos, tgt):
    f = tgt - pos; f /= np.linalg.norm(f)
    up = np.array([0, 1.0, 0]); r = np.cross(f, up); r /= np.linalg.norm(r); u = np.cross(r, f)
    d = P - pos
    x, y, z = d @ r, d @ u, d @ f
    sx = (x / z) / (tanH * W / H); sy = (y / z) / tanH
    return np.stack([(sx * 0.5 + 0.5) * W, (0.5 - sy * 0.5) * H], 1)
# body roviny na obrazovke (mriežka) s hĺbkou 0, 0,5, 1
gx, gy = np.meshgrid(np.linspace(-vw/2, vw/2, 9), np.linspace(-vh/2, vh/2, 15))
pts = []
for z in (0.0, 0.5, 1.0):
    P = np.stack([gx.ravel(), gy.ravel(), np.zeros(gx.size)], 1)
    P = eye + (P - eye) * (1 - AMT * z)
    pts.append(P)
P = np.concatenate(pts)
mx = 0; dt = 1/60
for sec in np.arange(0, 180, 0.25):
    a = project(P, *cam(sec)); b = project(P, *cam(sec + dt))
    d = np.linalg.norm(b - a, axis=1).max()
    mx = max(mx, d)
print('najväčší posun bodu obrazu za snímku 60 Hz: %.3f px plátna (%.2f px/s); pri 12 Hz: %.2f px; pri 30 Hz: %.2f px' % (mx, mx*60, mx*5, mx*2))
