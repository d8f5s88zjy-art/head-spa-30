#!/usr/bin/env python3
"""Model odovzdania zálohy filmu (html.world-in): záloha mizne 0,7 s (style.css:500, 1105-1107), plátno
nabieha 1,2 s (style.css:416), obe s --ease-in-out = cubic-bezier(0.65, 0, 0.35, 1). Vidieť je
záloha·α_z + plátno·α_p·(1 − α_z); keď je obraz rovnaký, jas = α_z + α_p·(1 − α_z)."""
def bez(p1x, p1y, p2x, p2y):
    def f(x):
        lo, hi = 0.0, 1.0
        for _ in range(60):
            t = (lo + hi) / 2
            bx = 3 * (1 - t) ** 2 * t * p1x + 3 * (1 - t) * t * t * p2x + t ** 3
            if bx < x: lo = t
            else: hi = t
        t = (lo + hi) / 2
        return 3 * (1 - t) ** 2 * t * p1y + 3 * (1 - t) * t * t * p2y + t ** 3
    return f
E = bez(0.65, 0, 0.35, 1)
mn = (1, 0)
for ms in range(0, 1301, 50):
    t = ms / 1000
    az = 1 - E(min(1, t / 0.7)); ap = E(min(1, t / 1.2))
    j = az + ap * (1 - az)
    mn = min(mn, (j, ms))
    print(f"{ms:5d} ms  záloha {az:.2f}  plátno {ap:.2f}  jas {j:.2f}")
print(f"najnižší jas {mn[0]:.2f} v čase {mn[1]} ms (pokles o {(1 - mn[0]) * 100:.0f} %)")
