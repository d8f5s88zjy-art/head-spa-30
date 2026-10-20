#!/usr/bin/env python3
"""Overenie auditu „čierne okná“ – analýza nahrávky z over.mjs (nezávislá od ana.py auditu).

A) Film (pravda z WebGL): úseky, keď je film zapnutý (html.world-in) a posledná operácia do obrazovky bola clear
   bez kreslenia, teda plátno je jednofarebné #0e0d0c a zálohy sú skryté. Trvanie = od prvého záznamu s clear
   po prvý záznam s draw (záznam z každej snímky requestAnimationFrame, inak každých 200 ms).
B) Obraz (pixely): dlaždica asi 10 × 10 CSS px je „tmavá prázdna“, keď priemerný jas < DARK a rozpätie
   (max - min) < RNG. Počíta sa len mimo lišty (60 px), mimo dosiek s textom (.band, pätička; obrázky v nich
   sa počítajú) a mimo otvoreného menu. Okno = súvislý úsek snímok s tmavou prázdnou plochou >= THR okna,
   dlhší ako MIN ms (snímok platí do ďalšieho snímku).
  python3 over.py runs/<meno> [--dark=0.13] [--rng=0.045] [--thr=0.20] [--min=150]
"""
import json, os, sys, shutil
import numpy as np
from PIL import Image

args = [a for a in sys.argv[1:] if not a.startswith('--')]
opt = dict(a[2:].split('=', 1) for a in sys.argv[1:] if a.startswith('--') and '=' in a)
RUN = args[0]
DARK = float(opt.get('dark', 0.13)); RNG = float(opt.get('rng', 0.045)); THR = float(opt.get('thr', 0.20)); MINMS = float(opt.get('min', 150))
meta = json.load(open(os.path.join(RUN, 'meta.json')))
log = [x for x in json.load(open(os.path.join(RUN, 'log.json'))) if 'y' in x]
W, H, t0 = meta['W'], meta['H'], meta['tNav']
frames = sorted(meta['frames'], key=lambda f: f['t'])
marks = meta['marks']
geos = [(x['t'], x['geo']) for x in log if 'geo' in x]
ts_log = [x['t'] for x in log]

def at(t):
    import bisect
    i = bisect.bisect_right(ts_log, t) - 1
    return log[max(0, i)] if log else {}
def geo_at(t):
    g = geos[0][1] if geos else [[], []]
    for (tt, gg) in geos:
        if tt <= t: g = gg
        else: break
    return g
def menu_open(t):
    # menu otvorené (alebo sa ešte zatvára 450 ms)
    last_open = None
    for x in log:
        if x['t'] > t: break
        if x.get('menu') == 'open': last_open = x['t']
    return last_open is not None and t - last_open < 450
def marks_near(t, before=6000):
    return [m['m'] for m in marks if t - before <= m['t'] <= t + 100][-3:]

# ---------- A) film z WebGL ----------
film_ev = []
cur = None
for x in log:
    blank = x.get('wi') == 1 and x.get('gl') == 'clear'
    if blank and cur is None: cur = {'a': x['t'], 'x': x}
    if not blank and cur is not None:
        cur['b'] = x['t']; film_ev.append(cur); cur = None
if cur is not None: cur['b'] = log[-1]['t']; film_ev.append(cur)
film_out = []
for e in film_ev:
    dur = e['b'] - e['a']
    if dur < MINMS: continue
    x = e['x']
    film_out.append({'od_ms': e['a'] - t0, 'trvanie_ms': dur, 'y': x['y'], 'film': x.get('f'), 'znacky': marks_near(e['a'])})

# ---------- B) pixely ----------
res = []
for f in frames:
    p = os.path.join(RUN, 'f', f['file'])
    try:
        im = Image.open(p).convert('RGB'); rgb = np.asarray(im, dtype=np.float32) / 255.0
        a = rgb.mean(axis=2)
    except Exception: continue
    # otvorené menu v pixeloch (snímka obrazovky mešká za DOM): široké oranžové tlačidlo REZERVOVAŤ v strede okna
    fh0, fw0 = a.shape; sc0 = fw0 / W
    org = (rgb[..., 0] > 0.70) & (rgb[..., 1] > 0.28) & (rgb[..., 1] < 0.55) & (rgb[..., 2] < 0.30)
    band = org[int(0.55 * fh0):int(0.92 * fh0), int(20 * sc0):int((W - 20) * sc0)]
    pix_menu = bool(W < 700 and band.size and (band.mean(axis=1) > 0.8).any())
    fh, fw = a.shape; sc = fw / W; ts = max(6, int(round(10 * sc)))
    nx, ny = fw // ts, fh // ts
    a2 = a[:ny * ts, :nx * ts].reshape(ny, ts, nx, ts)
    mean = a2.mean(axis=(1, 3)); rng = a2.max(axis=(1, 3)) - a2.min(axis=(1, 3))
    dark = (mean < DARK) & (rng < RNG)
    s = at(f['t']); y = f['sy'] if f.get('sy') is not None else s.get('y', 0)
    cy = (np.arange(ny) + 0.5) * ts / sc; cx = (np.arange(nx) + 0.5) * ts / sc
    mask = np.ones((ny, nx), dtype=bool); mask[cy < 60, :] = False
    bands, media = geo_at(f['t'])
    for (l, tt, r, b) in bands:
        mask[np.ix_((cy + y >= tt) & (cy + y < b), (cx >= l) & (cx < r))] = False
    for (l, tt, r, b) in media:
        mask[np.ix_((cy + y >= tt) & (cy + y < b), (cx >= l) & (cx < r))] = True
    mo = menu_open(f['t']) or pix_menu
    tot = nx * ny
    res.append({'file': f['file'], 't': f['t'], 'y': y, 'd': float((dark & mask).sum()) / tot, 'dall': float(dark.sum()) / tot, 'menu': mo})
ev = []; cur = None
for k, r in enumerate(res):
    bad = r['d'] >= THR and not r['menu']
    if bad and cur is None: cur = k
    if not bad and cur is not None: ev.append((cur, k)); cur = None
if cur is not None: ev.append((cur, len(res)))
kdir = os.path.join(RUN, 'kluc2'); shutil.rmtree(kdir, ignore_errors=True); os.makedirs(kdir, exist_ok=True)
end_t = res[-1]['t'] if res else 0
pix_out = []
for (a, b) in ev:
    ta = res[a]['t']; tb = res[b]['t'] if b < len(res) else end_t
    if tb - ta < MINMS: continue
    pk = max(res[a:b], key=lambda r: r['d'])
    s = at(ta)
    # karta s najväčším --so v čase okna (pokojná verzia) a jej stav
    k = s.get('k') or []
    vis = [c for c in k if c[3] > 0.001]
    item = {'od_ms': round(ta - t0), 'trvanie_ms': round(tb - ta), 'plocha': round(pk['d'], 2), 'y': res[a]['y'], 'y_koniec': res[b - 1]['y'],
            'gl': s.get('gl'), 'wi': s.get('wi'), 'film': s.get('f'), 'karty_so>0': vis, 'hid_px': s.get('hid'), 'znacky': marks_near(ta),
            'snimky': [res[a]['file'], pk['file'], res[b - 1]['file']]}
    pix_out.append(item)
    tag = f"{round(ta - t0):06d}ms_{round(tb - ta)}ms"
    for nm, rr in (('a', res[a]), ('peak', pk), ('z', res[b - 1])):
        shutil.copy(os.path.join(RUN, 'f', rr['file']), os.path.join(kdir, f'{tag}_{nm}.jpg'))
    if b < len(res): shutil.copy(os.path.join(RUN, 'f', res[b]['file']), os.path.join(kdir, f'{tag}_po.jpg'))

# prvý obraz: od prvého vykreslenia (FCP) po prvý snímok, kde tmavá prázdna plocha klesne pod THR
fcp = next((m[3] for m in meta.get('pmarks', []) if m[1] == 'first-contentful-paint'), None)
lcp = [m for m in meta.get('pmarks', []) if m[0] == 'largest-contentful-paint']
first_dark = None
if fcp is not None and res:
    tf = meta.get('pt0', t0) + fcp
    after = [r for r in res if r['t'] >= tf - 50]
    lit = next((r for r in after if r['d'] < THR), None)
    if lit: first_dark = round(lit['t'] - tf)
summary = {'run': meta['name'], 'nastavenie': {k: meta[k] for k in ('dev', 'dpr', 'net', 'cpu', 'q', 'cache', 'scen', 'rm', 'savedata', 'inject')},
           'snimok': len(res), 'fps': round(len(res) / max(0.001, (end_t - res[0]['t']) / 1000), 1) if res else 0,
           'fcp_ms': fcp, 'lcp': lcp[-1:] if lcp else None, 'tmavy_prvy_obraz_po_fcp_ms': first_dark,
           'film_prazdne_platno': {'pocet': len(film_out), 'spolu_ms': sum(e['trvanie_ms'] for e in film_out), 'najdlhsie_ms': max([e['trvanie_ms'] for e in film_out], default=0), 'okna': film_out},
           'pixely': {'pocet': len(pix_out), 'spolu_ms': sum(e['trvanie_ms'] for e in pix_out), 'najdlhsie_ms': max([e['trvanie_ms'] for e in pix_out], default=0), 'okna': pix_out},
           'obrazky': meta.get('reqs'), 'chyby': meta.get('errs')}
json.dump(summary, open(os.path.join(RUN, 'over2.json'), 'w'), ensure_ascii=False, indent=1)
json.dump(res, open(os.path.join(RUN, 'snimky2.json'), 'w'))
print(f"{meta['name']}: snímok {len(res)} ({summary['fps']}/s), FCP {fcp}, tmavý prvý obraz po FCP {first_dark} ms")
print(f"  film prázdne plátno (WebGL): {len(film_out)} okien, spolu {summary['film_prazdne_platno']['spolu_ms']} ms, najdlhšie {summary['film_prazdne_platno']['najdlhsie_ms']} ms")
for e in film_out:
    print(f"    {e['od_ms']:>7} ms {e['trvanie_ms']:>6} ms y={e['y']} film={e['film']} {e['znacky']}")
print(f"  pixely (>= {THR:.0%} tmavej prázdnej plochy): {len(pix_out)} okien, spolu {summary['pixely']['spolu_ms']} ms, najdlhšie {summary['pixely']['najdlhsie_ms']} ms")
for e in pix_out:
    print(f"    {e['od_ms']:>7} ms {e['trvanie_ms']:>6} ms plocha {e['plocha']} y={e['y']}->{e['y_koniec']} gl={e['gl']} wi={e['wi']} hid={e['hid_px']} karty={e['karty_so>0']} {e['znacky']}")
