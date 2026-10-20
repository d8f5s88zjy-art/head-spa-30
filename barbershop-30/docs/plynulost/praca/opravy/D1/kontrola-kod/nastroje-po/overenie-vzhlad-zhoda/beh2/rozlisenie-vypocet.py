#!/usr/bin/env python3
"""VZ-01, VZ-07, VZ-08 (beh 2): zdrojové px na px displeja podľa výpočtu layout() a pickSize() z film.js
(presah OVER 0,12 fotky / OVER_V 0,06 video, plátno DPR_MAX = min(dpr, 2), CAP 1448 telefón / 2896 počítač,
kamera pri kotve z0 = -0,04 → zväčšenie 1/0,96). Hodnota 1,0 = bod na bod. Druhý stĺpec: textúra / px plátna
(> 1 znamená, že ostrosť obmedzuje plátno, nie fotka). python3 -I rozlisenie-vypocet.py"""
Z = 1 / 0.96
def calc(vw, vh, dpr, pa, tex, src_w, over, cap_dpr=2):
    cd = min(dpr, cap_dpr); aspect = vw / vh; ov = 1 + 2 * over
    pw = ov * 1.0; ph = pw / pa                     # v šírkach okna
    if ph < ov / aspect: ph = ov / aspect; pw = ph * pa
    canvas_px = pw * vw * cd * Z                    # šírka fotky na plátne
    tex_per_canvas = min(tex, src_w) / canvas_px
    per_dev = min(1.0, tex_per_canvas) * cd / dpr
    return round(per_dev, 2), round(tex_per_canvas, 2), round(pw, 3)
rows = [
  ('telefón 390×844 @3, fotka -m 1448 (zdroj 1536)', 390, 844, 3, 0.5625, 1448, 1536, 0.12),
  ('  to isté s presahom 1,12', 390, 844, 3, 0.5625, 1448, 1536, 0.06),
  ('  to isté s presahom 1,12 a plátnom 3×', 390, 844, 3, 0.5625, 1448, 1536, 0.06, 3),
  ('telefón 390×844 @3, sekvencia 720 (natívne 576)', 390, 844, 3, 0.5625, 720, 720, 0.06),
  ('  natívny zdroj 576', 390, 844, 3, 0.5625, 576, 576, 0.06),
  ('telefón 390×844 @3, tim-slucka 864 (natívne 576)', 390, 844, 3, 0.5625, 864, 864, 0.06),
  ('počítač 1440×900 @1, fotka 2172', 1440, 900, 1, 1.5, 2172, 4096, 0.12),
  ('počítač 1440×900 @1, rohožka 1920', 1440, 900, 1, 1.6, 1920, 1920, 0.12),
  ('počítač 1920×1080 @1, rohožka 1920', 1920, 1080, 1, 1.6, 1920, 1920, 0.12),
  ('počítač 1920×1080 @1, fotka 2896', 1920, 1080, 1, 1.5, 2896, 4096, 0.12),
  ('počítač 1440×900 @2, rohožka 1920', 1440, 900, 2, 1.6, 1920, 1920, 0.12),
  ('počítač 1440×900 @2, fotka 2896 (CAP)', 1440, 900, 2, 1.5, 2896, 4096, 0.12),
]
print('prípad\tzdroj/px displeja\ttextúra/px plátna\tšírka fotky (okná)')
for r in rows:
    a = calc(*r[1:])
    print(f'{r[0]}\t{a[0]}\t{a[1]}\t{a[2]}')
