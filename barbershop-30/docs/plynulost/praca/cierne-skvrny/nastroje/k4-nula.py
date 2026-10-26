# K4: kde má zjemnená hĺbková mapa (a teda alfa plátna pri priamom kreslení záberu) presne 0 a či sa to kryje
# s čiernymi dierami zo záznamu majiteľa. Zopakuje soften() z film.js na procesore: mapa 768 px (depthBitmap),
# kanál R, max filter r = round(2·sig) vodorovne a zvislo, Gaussov filter r = min(40, round(3·sig)), sigma = r/3,
# vodorovne a zvislo, po každom prechode zaokrúhlenie na 8 bitov (render target UnsignedByteType). Vrcholy mriežky
# 256×192 vzorkujú lineárne, medzi vrcholmi sa hĺbka interpoluje, alfa plátna = round(vZ·255).
# Dieru zo záznamu prenesie na fotku ako k4-diera-hlbka.py (SIFT + homografia z bodov mimo diery).
# Použitie: k4-nula.py <snímky> <img/film> <výstup.json> <náhľady-dir> snimka:zaber:x0,y0,x1,y1 ...
import sys, os, json
import cv2, numpy as np
src, film, outj, outd = sys.argv[1:5]
PRAH = 8
SEG = (256, 192)

def soften(d):
    h, w = d.shape
    sig = max(1.5, 1.2 * w / SEG[0]); rm = int(round(2 * sig)); rb = min(40, int(round(3 * sig)))
    q = lambda a: np.rint(a * 255) / 255.0
    a = d.astype(np.float64) / 255.0
    a = q(cv2.dilate(a, np.ones((1, 2 * rm + 1)), borderType=cv2.BORDER_REPLICATE))
    a = q(cv2.dilate(a, np.ones((2 * rm + 1, 1)), borderType=cv2.BORDER_REPLICATE))
    f = np.arange(-rb, rb + 1, dtype=np.float64); wgt = np.exp(-0.5 * f * f / (rb * rb / 9.0)); wgt /= wgt.sum()
    a = q(cv2.filter2D(a, -1, wgt.reshape(1, -1), borderType=cv2.BORDER_REPLICATE))
    a = q(cv2.filter2D(a, -1, wgt.reshape(-1, 1), borderType=cv2.BORDER_REPLICATE))
    return a, dict(sig=round(sig, 2), r_max=rm, r_blur=rb)

def alfa_platna(s, pw, ph):
    h, w = s.shape
    ii, jj = np.meshgrid(np.arange(SEG[0] + 1), np.arange(SEG[1] + 1))
    mx = (ii / SEG[0] * w - 0.5).astype(np.float32); my = (jj / SEG[1] * h - 0.5).astype(np.float32)
    g = cv2.remap(s.astype(np.float32), mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)   # hĺbka vo vrcholoch
    v = cv2.resize(g, (pw, ph), interpolation=cv2.INTER_LINEAR)                                       # medzi vrcholmi
    return np.rint(v * 255).astype(np.int32), g

sift = cv2.SIFT_create(4000)
res = []
for spec in sys.argv[5:]:
    fr, shot, box = spec.split(':'); fr = int(fr); bx = [int(v) for v in box.split(',')]
    v = cv2.imread(os.path.join(src, 'f%04d.jpg' % fr)); vg = cv2.cvtColor(v, cv2.COLOR_BGR2GRAY)
    m = (vg <= PRAH).astype(np.uint8); win = np.zeros_like(m); win[bx[1]:bx[3], bx[0]:bx[2]] = 1; m &= win
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
    hole = np.zeros_like(m)
    for k in range(1, n):
        if st[k][4] >= 150: hole[lab == k] = 1
    hole = cv2.morphologyEx(hole, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    p = cv2.imread(os.path.join(film, shot + '-1086.webp')); pg = cv2.cvtColor(p, cv2.COLOR_BGR2GRAY)
    ph, pw = pg.shape
    draw = cv2.imread(os.path.join(film, shot + '-hlbka.webp'), cv2.IMREAD_UNCHANGED)
    d = draw[..., 2] if draw.ndim == 3 else draw                                                       # shader číta .r
    if d.shape[1] > 768: d = cv2.resize(d, (768, int(round(d.shape[0] * 768 / d.shape[1]))), interpolation=cv2.INTER_LINEAR)
    s, par = soften(d)
    a8, g = alfa_platna(s, pw, ph)
    vs = cv2.resize(vg, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
    mv = cv2.resize(1 - cv2.dilate(hole, np.ones((9, 9), np.uint8)), None, fx=2, fy=2, interpolation=cv2.INTER_NEAREST)
    k1, d1 = sift.detectAndCompute(vs, mv * 255); k2, d2 = sift.detectAndCompute(pg, None)
    good = [a for a, b in cv2.BFMatcher().knnMatch(d1, d2, k=2) if a.distance < 0.75 * b.distance]
    A = np.float32([k1[x.queryIdx].pt for x in good]) / 2.0; B = np.float32([k2[x.trainIdx].pt for x in good])
    Hm, inl = cv2.findHomography(A, B, cv2.RANSAC, 6.0)
    hw = cv2.warpPerspective(hole * 255, Hm, (pw, ph), flags=cv2.INTER_NEAREST) > 0
    # viditeľná časť fotky na snímke záznamu (okno telefónu), aby sa predpoveď porovnávala len tam
    vis = cv2.warpPerspective(np.ones_like(hole) * 255, Hm, (pw, ph), flags=cv2.INTER_NEAREST) > 0
    r = {'snimka': fr, 't': round((fr - 1) / 30, 3), 'zaber': shot, 'zhody': len(good), 'inliery': int(inl.sum()) if inl is not None else 0,
         'soften': par, 'mapa_nula_pct': round(100 * float((d == 0).mean()), 2), 'zjemnena_nula_pct': round(100 * float((s == 0).mean()), 2),
         'diera_zaznam_pct_fotky': round(100 * float(hw.mean()), 2), 'viditelne_pct_fotky': round(100 * float(vis.mean()), 1), 'prahy': {}}
    for T in [0, 1, 2, 4, 8, 16, 32]:
        pr = (a8 <= T) & vis
        inter = (pr & hw).sum(); uni = (pr | hw).sum()
        r['prahy'][str(T)] = {'predpoved_pct_vidit': round(100 * float(pr.sum() / max(1, vis.sum())), 2), 'IoU': round(float(inter / max(1, uni)), 3),
                              'diera_pokryta_pct': round(100 * float(inter / max(1, hw.sum())), 1), 'predpoved_v_diere_pct': round(100 * float(inter / max(1, pr.sum())), 1)}
    res.append(r); print(json.dumps(r, ensure_ascii=False))
    # náhľad: fotka + predpoveď alfa 0 (červená) + diera zo záznamu (zelená), prekryv žltá | zjemnená mapa s obrysmi
    ov = p.copy(); pr0 = (a8 == 0) & vis
    ov[pr0 & ~hw] = (0, 0, 255); ov[hw & ~pr0] = (0, 255, 0); ov[pr0 & hw] = (0, 255, 255)
    sm = cv2.cvtColor(cv2.resize((s * 255).astype(np.uint8), (pw, ph)), cv2.COLOR_GRAY2BGR)
    for mask, col in [(pr0, (0, 0, 255)), (hw, (0, 255, 0))]:
        cs, _ = cv2.findContours(mask.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE); cv2.drawContours(sm, cs, -1, col, 2)
    cv2.imwrite(os.path.join(outd, 'nula-%04d-%s.jpg' % (fr, shot)), np.hstack([cv2.addWeighted(p, 0.45, ov, 0.55, 0), sm]), [cv2.IMWRITE_JPEG_QUALITY, 85])
json.dump(res, open(outj, 'w'), ensure_ascii=False, indent=1)
