#!/usr/bin/env python3
"""Efektívne rozlíšenie obrazu filmu a zálohy: pixely zdroja na pixel displeja (1 = bod na bod, pod 1 zväčšené).
Výpočet podľa film.js (layout() 772-787, pickSize() 426-432, DPR_MAX 316, CAP 425, OVER/OVER_V 769-770) a style.css
(rámovanie zálohy 471-485, video 1173) pre zariadenia z auditu. python3 -I rozlisenie.py <koreň webu>"""
import sys, json, re, os
root = sys.argv[1]
html = open(os.path.join(root, 'index.html'), encoding='utf-8').read()
shots = []
for m in re.finditer(r'<div class="film-shot[^"]*"([^>]*)>', html):
    a = dict(re.findall(r'data-([\w-]+)="([^"]*)"', m.group(1)))
    shots.append(a)
DEV = {'p390': (390, 844, 3), 'p360': (360, 780, 3), 'd1440': (1440, 900, 1), 'd1920': (1920, 1080, 1)}
def tiers(s):
    return sorted(int(x) for x in s.split(',')) if s else [1086, 1448, 2172]
FJ = json.load(open(os.path.join(root, 'assets/img/film/film.json')))
def realw(name, t, mobile):
    j = FJ.get(name.replace('-m', '')) if name else None
    if not j: return t
    tt = (j['m'] if mobile else j)['tiers']
    return tt.get(str(t), {}).get('w', t)
print('zariadenie záber      zdroj          film: plátno×dpr  textúra  zdroj/px_displeja  | záloha (world-frame) zdroj/px')
for dn, (W, H, dpr) in DEV.items():
    phone = W <= 720
    fdpr = min(dpr, 2)
    cw = W * fdpr
    for s in shots:
        vid = phone and s.get('video')
        if vid:
            vw_, vh_ = map(int, s['video-size'].split('x')); pa = vw_ / vh_; ov = 1.12; srcw_all = [vw_]; name = s['video'].split('/')[-1]
        elif phone and s.get('m'):
            mw, mh = map(int, s['m-size'].split('x')); pa = mw / mh; ov = 1.24; srcw_all = [realw(s['shot'], t, True) for t in tiers(s.get('m-tiers'))]; name = s['m']
        else:
            sw, sh = map(int, s['size'].split('x')); pa = sw / sh; ov = 1.24; srcw_all = [realw(s['shot'], t, False) for t in tiers(s.get('tiers'))]; name = s['shot']
        asp = W / H
        pw = ov * max(1, H * pa / W) if False else None
        # rovina: pw = vw*ov; ak ph < vh*ov, ph = vh*ov a pw = ph*pa (v jednotkách šírky okna)
        pw_w = ov; ph_w = pw_w / pa
        if ph_w < ov / asp: ph_w = ov / asp; pw_w = ph_w * pa
        need = pw_w * cw
        cap = 1448 if phone else (4096 if s.get('pro') else 2896)
        fit = [w for w in srcw_all if w <= cap] or [srcw_all[0]]
        pick = next((w for w in fit if w >= need * 0.95), fit[-1])
        plane_dev = pw_w * W * dpr                    # šírka roviny v pixeloch displeja
        eff = min(pick / plane_dev, fdpr / dpr)       # obmedzené textúrou aj rozlíšením plátna
        # záloha s rámovaním filmu (style.css 471-485): šírka = 1,24·k·max(100vw, 100vh·pa), k = 1/(1+z0)
        z0 = -0.005 if (vid or s.get('mv') == 'near') else -0.04
        k = 1 / (1 + z0); ovs = 1.12 if vid else 1.24
        still_css = ovs * k * max(W, H * pa)
        # výber zo srcset: sizes (max-width:720px) 93vw | 124vw; pri videu 100vw (f025 720w)
        sz = (W if vid else 0.93 * W) if phone else 1.24 * W
        cands = [720] if vid else srcw_all
        # Chromium: najmenší kandidát s hustotou >= DPR (overené meraním: 390 px → 1448, 360 px → 1086)
        dens = [c / sz for c in cands]
        sel = next((c for c, dd in zip(cands, dens) if dd >= dpr), cands[-1])
        still_eff = sel / (still_css * dpr)
        print(f"{dn:6s} {s['shot']:12s} {name:16s} {cw:5.0f}px×{fdpr}  {pick:5d}   {eff:5.2f}   | {sel:5d} → {still_eff:4.2f}")
