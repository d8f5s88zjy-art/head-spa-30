# Kde na fotke sú čierne diery zo záznamu a akú hĺbku tam má hĺbková mapa.
# Snímku zo záznamu zarovná na zdrojovú fotku (SIFT + homografia z bodov mimo diery), dieru (jas <= PRAH,
# súvislá oblasť v zadanom okne) prenesie do súradníc fotky a porovná hodnoty hĺbkovej mapy v diere
# a v páse okolo nej. Použitie: k4-diera-hlbka.py <snímky> <img/film> <výstup.json> <náhľady-dir> snimka:zaber:x0,y0,x1,y1 ...
import sys, os, json
import cv2, numpy as np
src, film, outj, outd = sys.argv[1:5]
PRAH = 8
res = []
sift = cv2.SIFT_create(4000)
for spec in sys.argv[5:]:
    fr, shot, box = spec.split(':'); fr = int(fr); bx = [int(v) for v in box.split(',')]
    v = cv2.imread(os.path.join(src, 'f%04d.jpg' % fr))
    vg = cv2.cvtColor(v, cv2.COLOR_BGR2GRAY)
    # diera: tmavé súvislé oblasti v okne bx, s uzavretím drobných medzier
    m = (vg <= PRAH).astype(np.uint8)
    win = np.zeros_like(m); win[bx[1]:bx[3], bx[0]:bx[2]] = 1; m &= win
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
    hole = np.zeros_like(m)
    for k in range(1, n):
        if st[k][4] >= 150: hole[lab == k] = 1
    hole = cv2.morphologyEx(hole, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    # zdroj: fotka záberu (1086 px) a hĺbková mapa
    p = cv2.imread(os.path.join(film, shot + '-1086.webp'))
    d = cv2.imread(os.path.join(film, shot + '-hlbka.webp'), cv2.IMREAD_GRAYSCALE)
    pg = cv2.cvtColor(p, cv2.COLOR_BGR2GRAY)
    vs = cv2.resize(vg, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)          # snímka je malá, 2x pre body
    mv = cv2.resize(1 - cv2.dilate(hole, np.ones((9, 9), np.uint8)), None, fx=2, fy=2, interpolation=cv2.INTER_NEAREST)
    k1, d1 = sift.detectAndCompute(vs, mv * 255)
    k2, d2 = sift.detectAndCompute(pg, None)
    mt = cv2.BFMatcher().knnMatch(d1, d2, k=2)
    good = [a for a, b in mt if a.distance < 0.75 * b.distance]
    A = np.float32([k1[g.queryIdx].pt for g in good]) / 2.0
    B = np.float32([k2[g.trainIdx].pt for g in good])
    Hm, inl = cv2.findHomography(A, B, cv2.RANSAC, 6.0)
    ninl = int(inl.sum()) if inl is not None else 0
    # diera a pás okolo nej (10 px snímky) do súradníc fotky
    ring = cv2.dilate(hole, np.ones((21, 21), np.uint8)) - cv2.dilate(hole, np.ones((5, 5), np.uint8))
    hw = cv2.warpPerspective(hole * 255, Hm, (p.shape[1], p.shape[0]), flags=cv2.INTER_NEAREST)
    rw = cv2.warpPerspective(ring * 255, Hm, (p.shape[1], p.shape[0]), flags=cv2.INTER_NEAREST)
    dd = cv2.resize(d, (p.shape[1], p.shape[0]), interpolation=cv2.INTER_LINEAR)
    zin, zring = dd[hw > 0], dd[rw > 0]
    q = lambda a, x: int(np.percentile(a, x)) if a.size else None
    ys, xs = np.nonzero(hw)
    r = {'snimka': fr, 't': round((fr - 1) / 30, 3), 'zaber': shot, 'zhody': len(good), 'inliery': ninl,
         'diera_px_video': int(hole.sum()), 'diera_na_fotke_box': [round(xs.min() / p.shape[1], 3), round(ys.min() / p.shape[0], 3), round(xs.max() / p.shape[1], 3), round(ys.max() / p.shape[0], 3)] if xs.size else None,
         'diera_podiel_fotky_pct': round(100 * (hw > 0).mean(), 2),
         'hlbka_v_diere': {'p50': q(zin, 50), 'p90': q(zin, 90), 'p99': q(zin, 99), 'max': int(zin.max()) if zin.size else None, 'podiel_0_pct': round(100 * (zin == 0).mean(), 1) if zin.size else None, 'podiel_do8_pct': round(100 * (zin <= 8).mean(), 1) if zin.size else None},
         'hlbka_v_pase_okolo': {'p10': q(zring, 10), 'p50': q(zring, 50), 'p90': q(zring, 90)}}
    res.append(r); print(json.dumps(r, ensure_ascii=False))
    # náhľad: fotka s dierou (zelená) | hĺbková mapa s dierou (červený obrys)
    ov = p.copy(); ov[hw > 0] = (0, 255, 0)
    dc = cv2.cvtColor(dd, cv2.COLOR_GRAY2BGR); cs, _ = cv2.findContours((hw > 0).astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    cv2.drawContours(dc, cs, -1, (0, 0, 255), 2)
    cv2.imwrite(os.path.join(outd, 'diera-%04d-%s.jpg' % (fr, shot)), np.hstack([cv2.addWeighted(p, 0.5, ov, 0.5, 0), dc]), [cv2.IMWRITE_JPEG_QUALITY, 85])
json.dump(res, open(outj, 'w'), ensure_ascii=False, indent=1)
