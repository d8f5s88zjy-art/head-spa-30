"""Valcová panoráma zo skutočného videa, v ktorom sa kamera otáča na mieste.

1. Každý snímok (v malom rozlíšení) sa premietne na valec so známou ohniskovou vzdialenosťou,
   susedné snímky sa približne zarovnajú fázovou koreláciou a zmeria sa ich ostrosť.
2. Vyberie sa reťaz najostrejších snímok s prekryvom asi 40 %.
3. Každá dvojica sa presne zarovná podľa zhodných bodov (SIFT) a šev sa vedie tam,
   kde sa snímky líšia najmenej, s úzkym prelínaním.
Nič sa nedomaľuje: čo kamera nezachytila, v panoráme nie je.

python3 tools/panorama.py VIDEO.mov VYSTUP.jpg [--f 1600] [--scale 1]
"""
import argparse, math, cv2, numpy as np

ap = argparse.ArgumentParser()
ap.add_argument('video'); ap.add_argument('out')
ap.add_argument('--f', type=float, default=1600)      # ohnisko v px pri šírke 2160
ap.add_argument('--scale', type=float, default=1.0)
ap.add_argument('--overlap', type=float, default=0.45)
a = ap.parse_args()

cap = cv2.VideoCapture(a.video)
n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)); W0, H0 = int(cap.get(3)), int(cap.get(4))

def cyl_maps(W, H, f):
    cx, cy = W / 2, H / 2
    CW = int(2 * f * math.atan(cx / f))
    th = ((np.arange(CW) - CW / 2) / f)[None, :].repeat(H, 0)
    vv = (np.arange(H) - cy)[:, None].repeat(CW, 1)
    return (cx + f * np.tan(th)).astype(np.float32), (cy + vv / np.cos(th)).astype(np.float32), CW

# 1. hrubé polohy a ostrosť
LW = 540; ls = LW / W0; LH = int(H0 * ls)
lmx, lmy, LCW = cyl_maps(LW, LH, a.f * LW / 2160)
pos, sharp = [], []; prev = None; x = y = 0.0; win = None
for i in range(n):
    ok, fr = cap.read()
    if not ok: break
    g = cv2.cvtColor(cv2.resize(fr, (LW, LH), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2GRAY)
    w = cv2.remap(g, lmx, lmy, cv2.INTER_LINEAR).astype(np.float32)
    m = w[int(LH * .15):int(LH * .85), int(LCW * .1):int(LCW * .9)]
    if win is None: win = cv2.createHanningWindow((m.shape[1], m.shape[0]), cv2.CV_32F)
    if prev is not None:
        (dx, dy), _ = cv2.phaseCorrelate(prev, m, win); x -= dx; y -= dy
    prev = m
    gx = cv2.Sobel(g, cv2.CV_32F, 1, 0); gy = cv2.Sobel(g, cv2.CV_32F, 0, 1)
    sharp.append(float((gx ** 2).mean() + (gy ** 2).mean())); pos.append(x)
n = len(pos); pos = np.array(pos) / ls; sharp = np.array(sharp)
flip = pos[-1] < pos[0]
if flip: pos = -pos
pos -= pos.min()

# 2. reťaz ostrých snímok; ostrosť porovnávame s okolím, lebo závisí aj od obsahu
S = a.scale; W, H = int(W0 * S), int(H0 * S); f = a.f * W / 2160
mx, my, CW = cyl_maps(W, H, f); CW0 = CW / S
order = np.argsort(pos)
end = pos.max()
cand = [k for k in range(n) if pos[k] <= 0.15 * CW0]
chain = [max(cand, key=lambda k: sharp[k])]
while pos[chain[-1]] < end - 1:
    cur = pos[chain[-1]]
    lo, hi = cur + (1 - a.overlap - .2) * CW0, cur + (1 - a.overlap) * CW0
    cand = [k for k in range(n) if lo <= pos[k] <= hi]
    if not cand:
        cand = [k for k in range(n) if cur < pos[k] <= cur + (1 - .15) * CW0]
        if not cand: break
        cand = [max(cand, key=lambda k: pos[k])]
    nxt = max(cand, key=lambda k: sharp[k])
    if pos[nxt] >= end - .3 * CW0:          # posledný kúsok: najostrejší z konca
        tail = [k for k in range(n) if pos[k] >= end - .15 * CW0 and pos[k] > cur]
        if tail and pos[max(tail, key=lambda k: sharp[k])] - cur < (1 - .15) * CW0:
            nxt = max(tail, key=lambda k: sharp[k])
    chain.append(nxt)
    if pos[nxt] >= end - .15 * CW0: break

def read(k):
    c = cv2.VideoCapture(a.video); c.set(cv2.CAP_PROP_POS_FRAMES, int(k)); ok, fr = c.read()
    if S != 1: fr = cv2.resize(fr, (W, H), interpolation=cv2.INTER_AREA)
    return cv2.remap(fr, mx, my, cv2.INTER_CUBIC, borderMode=cv2.BORDER_CONSTANT)

sift = cv2.SIFT_create(4000)
def reg(A, B, guess):
    """posun B voči A (v px), meraný v prekryve podľa zhodných bodov"""
    s = 900 / A.shape[1]
    ga = cv2.cvtColor(cv2.resize(A, None, fx=s, fy=s), cv2.COLOR_BGR2GRAY)
    gb = cv2.cvtColor(cv2.resize(B, None, fx=s, fy=s), cv2.COLOR_BGR2GRAY)
    ka, da = sift.detectAndCompute(ga, None); kb, db = sift.detectAndCompute(gb, None)
    mt = cv2.BFMatcher().knnMatch(da, db, k=2)
    d = []
    for p in mt:
        if len(p) == 2 and p[0].distance < .7 * p[1].distance:
            pa = ka[p[0].queryIdx].pt; pb = kb[p[0].trainIdx].pt
            d.append((pa[0] - pb[0], pa[1] - pb[1]))
    d = np.array(d) / s
    if len(d) < 12: return guess, 0
    ok = np.abs(d[:, 0] - guess[0]) < .25 * CW
    d = d[ok] if ok.sum() >= 12 else d
    # najhustejší zhluk posunov (dominantná rovina)
    best = None
    for c in d[:: max(1, len(d) // 200)]:
        inl = (np.abs(d - c) < [6 * S + 3, 6 * S + 3]).all(1)
        if best is None or inl.sum() > best.sum(): best = inl
    return tuple(np.median(d[best], 0)), int(best.sum())

if flip: chain = chain[::-1]              # skladáme vždy zľava doprava
frames = [read(k) for k in chain]
P = [(0.0, 0.0)]
for j in range(1, len(chain)):
    guess = (abs(pos[chain[j]] - pos[chain[j - 1]]) * S, 0)
    (dx, dy), cnt = reg(frames[j - 1], frames[j], guess)
    P.append((P[-1][0] + dx, P[-1][1] + dy))
P = np.array(P); P -= P.min(0)
print("posuny", np.diff(P[:, 0]).round(0).tolist(), "dy", np.diff(P[:, 1]).round(0).tolist())
TW = int(P[:, 0].max() + CW) + 2; TH = int(P[:, 1].max() + H) + 2
canvas = np.zeros((TH, TW, 3), np.uint8); cov = np.zeros((TH, TW), bool)

def place(img, px, py):
    ox, oy = int(round(px)), int(round(py))
    return ox, oy

for j, fr in enumerate(frames):
    ox, oy = int(round(P[j, 0])), int(round(P[j, 1]))
    valid = fr.sum(2) > 3
    reg_c = canvas[oy:oy + H, ox:ox + CW]; reg_v = cov[oy:oy + H, ox:ox + CW]
    both = valid & reg_v
    if both.any():
        # šev: v prekryve dynamickým programovaním nájdeme zvislú cestu s najmenším rozdielom
        colsb = np.where(both.any(0))[0]; c0, c1 = colsb[0], colsb[-1] + 1
        diff = np.abs(reg_c[:, c0:c1].astype(np.int16) - fr[:, c0:c1].astype(np.int16)).sum(2).astype(np.float32)
        diff[~both[:, c0:c1]] = 1e5
        ds = 4; D = cv2.resize(diff, ((c1 - c0) // ds + 1, H // ds + 1), interpolation=cv2.INTER_AREA)
        # neznáme pri okrajoch prekryvu mierne penalizujeme, šev drž v strede
        wdt = D.shape[1]; D += (np.abs(np.arange(wdt) - wdt / 2) / (wdt / 2)) ** 2 * D.mean() * .6
        cost = D.copy(); back = np.zeros(D.shape, np.int8)
        for r in range(1, D.shape[0]):
            prv = cost[r - 1]
            l = np.r_[np.inf, prv[:-1]]; rr = np.r_[prv[1:], np.inf]
            st = np.stack([l, prv, rr]); am = st.argmin(0)
            cost[r] += st[am, np.arange(wdt)]; back[r] = am - 1
        path = np.zeros(D.shape[0], int); path[-1] = int(cost[-1].argmin())
        for r in range(D.shape[0] - 1, 0, -1): path[r - 1] = np.clip(path[r] + back[r, path[r]], 0, wdt - 1)
        seam = np.interp(np.arange(H), np.arange(D.shape[0]) * ds, path * ds + ds / 2) + c0
        cols = np.arange(CW)[None, :]
        F = 10 * S + 4
        alpha = np.clip((cols - seam[:, None]) / (2 * F) + .5, 0, 1)    # 0 = staré, 1 = nové
        alpha = np.where(reg_v, alpha, 1.0); alpha = np.where(valid, alpha, 0.0)
    else:
        alpha = valid.astype(np.float32)
    out = reg_c.astype(np.float32) * (1 - alpha[..., None]) + fr.astype(np.float32) * alpha[..., None]
    canvas[oy:oy + H, ox:ox + CW] = out.clip(0, 255).astype(np.uint8)
    cov[oy:oy + H, ox:ox + CW] |= valid

rows = np.where(cov.mean(1) > .995)[0]
cc = np.where(cov[rows[0]:rows[-1]].all(0))[0]
pano = canvas[rows[0]:rows[-1] + 1, cc[0]:cc[-1] + 1]
cv2.imwrite(a.out, pano, [cv2.IMWRITE_JPEG_QUALITY, 94])
print(f'{a.out}: {pano.shape[1]}x{pano.shape[0]}  horiz {math.degrees(pano.shape[1] / f):.0f}°  '
      f'vert {math.degrees(2 * math.atan(pano.shape[0] / 2 / f)):.0f}°  snímky {list(chain)}')
