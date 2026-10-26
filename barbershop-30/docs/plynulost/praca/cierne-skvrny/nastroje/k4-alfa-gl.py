# K4: alfa plátna prečítaná priamo z WebGL (k4-reprodukcia.cjs, režim alfa: <id>-alfa-gl.png, sivá = alfa) ->
#  - <id>-sim.jpg: bežná snímka z Chromia, pixely s alfou 0 prefarbené na farbu stránky --ink (#0e0d0c): tak vyzerá
#    plátno v prehliadači, ktorý pri skladaní stránky pustí cez alfu 0 pozadie (záznam majiteľa, Safari na Macu)
#  - porovnanie s dierou zo záznamu: snímka z Chromia aj snímka záznamu sa zarovnajú na fotku (SIFT + homografia),
#    IoU oblasti alfa 0 a diery zo záznamu v súradniciach fotky
# Použitie: k4-alfa-gl.py <reprodukcia-dir> <snímky záznamu> <img/film> <výstup.json> [id=snimka:zaber:x0,y0,x1,y1 ...]
import sys, os, json, glob
import cv2, numpy as np
d, sn, film, outj = sys.argv[1:5]
INK = (12, 13, 14)   # BGR
PRAH = 8
sift = cv2.SIFT_create(4000)
def homog(gray, mask, pg):
    k1, d1 = sift.detectAndCompute(gray, mask); k2, d2 = sift.detectAndCompute(pg, None)
    good = [a for a, b in cv2.BFMatcher().knnMatch(d1, d2, k=2) if a.distance < 0.75 * b.distance]
    A = np.float32([k1[x.queryIdx].pt for x in good]); B = np.float32([k2[x.trainIdx].pt for x in good])
    Hm, inl = cv2.findHomography(A, B, cv2.RANSAC, 6.0)
    return Hm, len(good), int(inl.sum()) if inl is not None else 0
spec = {}
for a in sys.argv[5:]:
    i, rest = a.split('=', 1); fr, shot, box = rest.split(':'); spec[i] = (int(fr), shot, [int(v) for v in box.split(',')])
res = []
for f in sorted(glob.glob(os.path.join(d, 'alfa', '*-alfa-gl.png'))):
    i = os.path.basename(f)[:-12]
    a8 = cv2.imread(f, cv2.IMREAD_GRAYSCALE)
    H, W = a8.shape
    z = a8 == 0
    ys, xs = np.nonzero(z)
    r = {'id': i, 'okno': [W, H], 'alfa0_pct': round(100 * float(z.mean()), 2), 'alfa_do8_pct': round(100 * float((a8 <= 8).mean()), 2),
         'alfa0_box': [round(xs.min() / W, 3), round(ys.min() / H, 3), round(xs.max() / W, 3), round(ys.max() / H, 3)] if xs.size else None}
    n = os.path.join(d, 'chromium', i + '.jpg')
    im = cv2.imread(n) if os.path.exists(n) else None
    if im is not None and im.shape[:2] == z.shape:
        sim = im.copy(); sim[z] = INK
        cv2.imwrite(os.path.join(d, 'alfa', i + '-sim.jpg'), sim, [cv2.IMWRITE_JPEG_QUALITY, 85])
        if i in spec:
            fr, shot, bx = spec[i]
            p = cv2.imread(os.path.join(film, shot + '-1086.webp')); pg = cv2.cvtColor(p, cv2.COLOR_BGR2GRAY); ph, pw = pg.shape
            # Chromium -> fotka (bez dosky s textom: body len z plátna, text sa maskou nevylúči, RANSAC ho odfiltruje)
            Hc, gc, ic = homog(cv2.cvtColor(im, cv2.COLOR_BGR2GRAY), None, pg)
            zc = cv2.warpPerspective(z.astype(np.uint8) * 255, Hc, (pw, ph), flags=cv2.INTER_NEAREST) > 0
            visc = cv2.warpPerspective(np.full(z.shape, 255, np.uint8), Hc, (pw, ph), flags=cv2.INTER_NEAREST) > 0
            # záznam -> fotka
            v = cv2.imread(os.path.join(sn, 'f%04d.jpg' % fr)); vg = cv2.cvtColor(v, cv2.COLOR_BGR2GRAY)
            m = (vg <= PRAH).astype(np.uint8); win = np.zeros_like(m); win[bx[1]:bx[3], bx[0]:bx[2]] = 1; m &= win
            m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
            nn, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
            hole = np.zeros_like(m)
            for k in range(1, nn):
                if st[k][4] >= 150: hole[lab == k] = 1
            hole = cv2.morphologyEx(hole, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
            vs = cv2.resize(vg, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
            mv = cv2.resize(1 - cv2.dilate(hole, np.ones((9, 9), np.uint8)), None, fx=2, fy=2, interpolation=cv2.INTER_NEAREST)
            Hv, gv, iv = homog(vs, mv * 255, pg)
            Hv = Hv @ np.diag([0.5, 0.5, 1.0])
            hw = cv2.warpPerspective(hole * 255, Hv, (pw, ph), flags=cv2.INTER_NEAREST) > 0
            visv = cv2.warpPerspective(np.full(hole.shape, 255, np.uint8), Hv, (pw, ph), flags=cv2.INTER_NEAREST) > 0
            both = visc & visv
            inter = (zc & hw & both).sum(); uni = ((zc | hw) & both).sum()
            r['vs_zaznam'] = {'snimka': fr, 'zaber': shot, 'zhody_chromium': [gc, ic], 'zhody_zaznam': [gv, iv],
                              'IoU': round(float(inter / max(1, uni)), 3), 'diera_pokryta_pct': round(100 * float(inter / max(1, (hw & both).sum())), 1),
                              'alfa0_v_diere_pct': round(100 * float(inter / max(1, (zc & both).sum())), 1)}
            ov = p.copy(); ov[zc & ~hw & both] = (0, 0, 255); ov[hw & ~zc & both] = (0, 255, 0); ov[zc & hw & both] = (0, 255, 255)
            cv2.imwrite(os.path.join(d, 'alfa', i + '-vs-zaznam.jpg'), cv2.addWeighted(p, 0.45, ov, 0.55, 0), [cv2.IMWRITE_JPEG_QUALITY, 85])
    res.append(r); print(json.dumps(r, ensure_ascii=False))
json.dump(res, open(outj, 'w'), ensure_ascii=False, indent=1)
