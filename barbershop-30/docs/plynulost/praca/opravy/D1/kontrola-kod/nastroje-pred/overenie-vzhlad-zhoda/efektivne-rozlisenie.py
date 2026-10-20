#!/usr/bin/env python3
"""Efektívne rozlíšenie snímky obrazovky (VZ-01, VZ-07, VZ-08): koľko detailu naozaj obsahuje mriežka displeja.
Pre mierku s sa snímka zmenší na s a zväčší späť (Lanczos); D(s) = RMS rozdielu. Obraz zväčšený z menšieho
zdroja (video 576 px, plátno 2× na displeji 3×) nestratí pri zmenšení na svoju skutočnú hustotu nič, takže
D(s) je pri ňom ~0. EFF = najväčšia mierka s, pri ktorej D(s) klesne pod 12 % D(0,2) (1,0 = detail až po pixel
displeja, 0,45 = obraz je ako zo 45 % rozlíšenia). Meria sa stredný výrez (x 15–85 %, y 12–62 %) snímky bez textu.
python3 -I efektivne-rozlisenie.py priečinok_so_zabery.json ..."""
import sys, os, json
import numpy as np
from PIL import Image
S = [1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.45, 0.4, 0.35, 0.3, 0.25, 0.2]
def D(a, s):
    im = Image.fromarray(a)
    W, H = im.size
    d = im.resize((max(8, round(W * s)), max(8, round(H * s))), Image.LANCZOS).resize((W, H), Image.LANCZOS)
    b = np.asarray(d, dtype=np.float64); x = a.astype(np.float64)
    m = 6  # okraj bez artefaktov zmenšenia
    return float(np.sqrt(((x - b)[m:-m, m:-m] ** 2).mean()))
print('zar\tmód\tkarta\tzdroj\tEFF\tD(0.7)/D(0.2)\tD(0.5)/D(0.2)')
for d in sys.argv[1:]:
    J = json.load(open(os.path.join(d, 'zabery.json')))
    for r in J['res']:
        f = os.path.join(d, r['file'] + '-ciste.png')
        if not os.path.exists(f): continue
        im = Image.open(f).convert('L'); W, H = im.size
        a = np.asarray(im.crop((int(W * .15), int(H * .12), int(W * .85), int(H * .62))))
        ds = {s: D(a, s) for s in S}
        ref = ds[0.2]
        # najväčšia mierka, kde strata detailu ešte nepresiahla 12 % (lineárna interpolácia medzi krokmi)
        eff = S[-1]
        for i, s in enumerate(S):
            if ds[s] / ref > 0.12:
                if i == 0: eff = 1.0
                else:
                    s0, s1 = S[i - 1], s; r0, r1 = ds[s0] / ref, ds[s1] / ref
                    eff = s0 + (s1 - s0) * (0.12 - r0) / max(1e-9, r1 - r0)
                break
        fl = r.get('film')
        src = (f"{fl['cur']} tex{(fl.get('ready') or {}).get('size')} dpr{fl['dpr']}" if fl else (r['still'][0]['src'] if r.get('still') else '-'))
        print(f"{J['dev']}\t{J['mode']}\t{r['shot']}\t{src}\t{eff:.2f}\t{ds[0.7]/ref:.3f}\t{ds[0.5]/ref:.3f}")
