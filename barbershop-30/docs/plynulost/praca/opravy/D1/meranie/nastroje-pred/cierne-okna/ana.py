#!/usr/bin/env python3
"""Lov na čierne okná – analýza nahrávky z rec.mjs po snímkach.

Snímok sa rozdelí na dlaždice (asi 3,3 % šírky). Dlaždica je „tmavá prázdna“, keď jej priemerný jas
(0 až 1, luma) je pod DARK a smerodajná odchýlka pod FLAT (jednoliata plocha bez obsahu; text, fotka aj
rozmazaný náhľad majú väčší rozptyl). Počíta sa len tam, kde má byť obraz: celé okno okrem lišty, pásov
s textom (.band, pätička) a otvoreného menu; obrázky vnútri pásov (galéria, portréty, video) sa počítajú.
Čierne okno = súvislý úsek snímok, kde tmavé prázdne dlaždice v mieste obrazu pokrývajú >= 20 % okna,
dlhší ako 150 ms (snímok platí do času ďalšieho snímku; screencast posiela snímok len pri zmene obrazu).

  python3 ana.py runs/<meno> [--dark=0.14] [--flat=0.012] [--min=150] [--thr=0.20]
Výstup: runs/<meno>/ana.json, runs/<meno>/kluc/*.jpg (začiatok, stred a koniec každého okna + prehľad).
"""
import json, os, sys, shutil
import numpy as np
from PIL import Image, ImageDraw

args = [a for a in sys.argv[1:] if not a.startswith('--')]
opt = dict(a[2:].split('=', 1) for a in sys.argv[1:] if a.startswith('--') and '=' in a)
RUN = args[0]
DARK = float(opt.get('dark', 0.14))
FLAT = float(opt.get('flat', 0.007))
MINMS = float(opt.get('min', 150))
THR = float(opt.get('thr', 0.20))
MID = float(opt.get('mid', 0.35))   # podiel tmavých prázdnych dlaždíc v strednom páse okna (chýba obraz, nie tmavá fotka)

meta = json.load(open(os.path.join(RUN, 'meta.json')))
log = json.load(open(os.path.join(RUN, 'log.json')))
W, H = meta['W'], meta['H']
t0 = meta['tNav']
frames = meta['frames']
frames.sort(key=lambda f: f['t'])
samples = [x for x in log if 'cls' in x]
marks = sorted([x for x in log if 'mark' in x] + meta['marks'], key=lambda x: x['t'])
geos = [(x['t'], x['geo']) for x in log if 'geo' in x]
menu_ev = [(x['t'], x['menuEv']) for x in log if 'menuEv' in x]
def menu_open(t, s):
    # z udalostí MutationObserver (presné), inak zo vzorky každých 100 ms; 400 ms po zatvorení ešte dobieha animácia
    if menu_ev:
        st, last_close = 'closed', -1e18
        for (tt, v) in menu_ev:
            if tt <= t:
                st = v
                if v == 'closed': last_close = tt
        return st == 'open' or (t - last_close) < 400
    # staršie nahrávky bez udalostí: menu je otvorené od ťuknutia na tlačidlo (asi 900 ms pred značkou „menu #…“)
    # po ťuknutie na odkaz tesne po značke (+ 400 ms animácia zatvorenia)
    for m in meta['marks']:
        if m['mark'].startswith('menu #') and m['t'] - 3000 <= t <= m['t'] + 500:
            return True
        if m['mark'].startswith('jazyk') and m['t'] - 1200 <= t <= m['t'] + 2000:
            return True
    return s.get('menu') == 'open'
fcp = None
for m in log:
    if 'mark' in m and m['mark'].startswith('first-contentful-paint@'):
        fcp = t0 + 0  # čas z performance.now je od začiatku navigácie, približne
        try:
            fcp = None
        except Exception:
            pass
# prvé vykreslenie (FCP) z PerformanceObserver: čas od začiatku navigácie (približne tNav)
fcp_t = None
for m_ in log:
    if 'mark' in m_ and m_['mark'].startswith('first-contentful-paint@'):
        fcp_t = t0 + float(m_['mark'].split('@')[1])
        break

def sample_at(t):
    lo, hi = 0, len(samples) - 1
    if not samples:
        return {}
    if t <= samples[0]['t']:
        return samples[0]
    while lo < hi:
        mid = (lo + hi + 1) // 2
        if samples[mid]['t'] <= t:
            lo = mid
        else:
            hi = mid - 1
    return samples[lo]

def geo_at(t):
    g = None
    for (tt, gg) in geos:
        if tt <= t:
            g = gg
        else:
            break
    if g is None and geos:
        g = geos[0][1]
    return g or {'bands': [], 'media': []}

res = []
first_light = None
for f in frames:
    p = os.path.join(RUN, 'frames', f['file'])
    try:
        im = Image.open(p).convert('L')
    except Exception:
        continue
    a = np.asarray(im, dtype=np.float32) / 255.0
    fh, fw = a.shape
    sc = fw / W                       # pixely snímku na CSS px
    ts = max(8, int(round(fw / 30)))  # dlaždica
    nx, ny = fw // ts, fh // ts
    a2 = a[:ny * ts, :nx * ts].reshape(ny, ts, nx, ts)
    mean = a2.mean(axis=(1, 3))
    std = a2.std(axis=(1, 3))
    dark = (mean < DARK) & (std < FLAT)
    # maska „tu má byť obraz“ v CSS px okna
    s = sample_at(f['t'])
    y = f['sy'] if f.get('sy') is not None else s.get('y', 0)
    mask = np.ones((ny, nx), dtype=bool)
    cy = (np.arange(ny) + 0.5) * ts / sc     # stred dlaždice v CSS px okna
    cx = (np.arange(nx) + 0.5) * ts / sc
    navh = 64 if W > 640 else 60
    mask[cy < navh, :] = False
    g = geo_at(f['t'])
    for (l, t_, r, b) in g.get('bands', []):
        rows = (cy + y >= t_) & (cy + y < b)
        cols = (cx >= l) & (cx < r)
        mask[np.ix_(rows, cols)] = False
    for (l, t_, r, b) in g.get('media', []):
        rows = (cy + y >= t_) & (cy + y < b)
        cols = (cx >= l) & (cx < r)
        mask[np.ix_(rows, cols)] = True
    # telefón: menu podľa obrazu (screencast za DOM mešká o stovky ms až sekundy, udalosti DOM by
    # vyradili aj snímky, kde už je vidieť obsah); počítač menu nemá (navigácia je v lište)
    menu = False if W <= 720 else menu_open(f['t'], s)
    if W <= 720:
        # otvorené menu na telefóne podľa obrazu: oranžové tlačidlo Rezervovať cez celú šírku (8 % až 92 %)
        # v strede okna; titulné karty majú tlačidlá vedľa seba, spodné tlačidlo je vpravo dole
        rgb = np.asarray(Image.open(p).convert('RGB').resize((fw // 2, fh // 2)), dtype=np.int16)
        R, G, B = rgb[..., 0], rgb[..., 1], rgb[..., 2]
        org = (R > 170) & (G > 60) & (G < 140) & (B < 80)
        y0, y1 = int(380 * sc / 2), int(680 * sc / 2)
        rows = org[y0:y1].mean(axis=1)
        if rows.size and float(rows.max()) > 0.72:
            menu = True
    tot = nx * ny
    d_img = float((dark & mask).sum()) / tot
    d_all = float(dark.sum()) / tot
    # stredný pás okna (15 až 60 % výšky): tam je šero okrajov (body::after, ::after zálohy) nulové, takže
    # tmavá prázdna plocha tu znamená chýbajúci obraz, nie tmavú časť fotky pod spodným prechodom
    mid = (cy >= 0.15 * H) & (cy < 0.60 * H)
    mm = mask & mid[:, None]
    d_mid = float((dark & mm).sum()) / max(1, int(mm.sum()))
    # prvé vykreslenie stránky: nie biela about:blank, a už je vidieť niečo svetlé (text lišty, fotka)
    if first_light is None and a.mean() < 0.9 and float((a > 0.6).mean()) > 0.002:
        first_light = f['t']
    res.append({'i': f['i'], 'file': f['file'], 't': f['t'], 'rt': round(f['t'] - t0), 'y': y, 'dimg': round(d_img, 3), 'dall': round(d_all, 3), 'dmid': round(d_mid, 3),
                'img': round(float(mask.sum()) / tot, 3), 'menu': menu, 'lum': round(float(a.mean()), 3)})

# udalosti
ev = []
cur = None
for k, r in enumerate(res):
    bad = r['dimg'] >= THR and r['dmid'] >= MID and not r['menu']
    if bad and cur is None:
        cur = {'k0': k}
    if not bad and cur is not None:
        cur['k1'] = k
        ev.append(cur)
        cur = None
if cur is not None:
    cur['k1'] = len(res)
    ev.append(cur)

# zlúčiť okná oddelené jediným svetlejším snímkom (do 120 ms)
mg = []
for e in ev:
    if mg and e['k0'] < len(res) and mg[-1]['k1'] < len(res) and res[e['k0']]['t'] - res[mg[-1]['k1']]['t'] <= 120:
        mg[-1]['k1'] = e['k1']
    else:
        mg.append(e)
ev = mg
out_ev = []
kdir = os.path.join(RUN, 'kluc')
shutil.rmtree(kdir, ignore_errors=True)
os.makedirs(kdir, exist_ok=True)
end_t = res[-1]['t'] if res else 0
for e in ev:
    a, b = e['k0'], e['k1']
    ta = res[a]['t']
    tb = res[b]['t'] if b < len(res) else end_t
    dur = tb - ta
    peak = max(res[a:b], key=lambda r: r['dimg'])
    s0 = sample_at(ta)
    pre_paint = ta < (fcp_t if fcp_t else (first_light or 0))
    # značky scenára tesne pred udalosťou
    mk = [m['mark'] for m in marks if ta - 6000 <= m['t'] <= ta + 200]
    item = {'od_ms': round(ta - t0), 'do_ms': round(tb - t0), 'trvanie_ms': round(dur), 'snimok': b - a,
            'max_tmavej_plochy': peak['dimg'], 'tmava_celkom': peak['dall'], 'scrollY': res[a]['y'], 'scrollY_koniec': res[b - 1]['y'],
            'pred_prvym_obrazom': pre_paint, 'znacky': mk[-4:], 'cls': s0.get('cls'), 'film': s0.get('film'),
            'zalohy': s0.get('st'), 'subory': [res[a]['file'], peak['file'], res[b - 1]['file']]}
    out_ev.append(item)
    if dur >= MINMS:
        tag = f"{round(ta - t0):06d}ms_{round(dur)}ms"
        for nm, rr in (('a', res[a]), ('peak', peak), ('z', res[b - 1])):
            shutil.copy(os.path.join(RUN, 'frames', rr['file']), os.path.join(kdir, f"{tag}_{nm}.jpg"))
        # snímok tesne po (obraz sa vrátil)
        if b < len(res):
            shutil.copy(os.path.join(RUN, 'frames', res[b]['file']), os.path.join(kdir, f"{tag}_po.jpg"))

long_ev = [e for e in out_ev if e['trvanie_ms'] >= MINMS]
# tmavé časti záberov (fotka pod spodným prechodom), nie chýbajúci obraz: súhrn podľa polohy skrolu
tma = {}
for k, r in enumerate(res):
    if r['dimg'] >= THR and r['dmid'] < MID and not r['menu']:
        dt = (res[k + 1]['t'] if k + 1 < len(res) else end_t) - r['t']
        b = int(r['y'] // 200 * 200)
        x = tma.setdefault(b, {'y': b, 'ms': 0, 'max': 0, 'file': r['file']})
        x['ms'] += dt
        if r['dimg'] > x['max']: x['max'] = r['dimg']; x['file'] = r['file']
tma = sorted(tma.values(), key=lambda x: -x['ms'])[:12]
summary = {'run': meta['name'], 'nastavenie': {k: meta[k] for k in ('dev', 'net', 'cpu', 'film', 'cache', 'scen', 'rm', 'savedata', 'url')},
           'snimok': len(res), 'trvanie_s': round((end_t - t0) / 1000, 1), 'prvy_svetly_snimok_ms': round(first_light - t0) if first_light else None,
           'fps_nahravky': round(len(res) / max(0.001, (end_t - res[0]['t']) / 1000), 1) if res else 0,
           'prah': {'dark': DARK, 'flat': FLAT, 'plocha': THR, 'min_ms': MINMS},
           'ciernych_okien': len(long_ev), 'najdlhsie_ms': max([e['trvanie_ms'] for e in long_ev], default=0),
           'spolu_ms': sum(e['trvanie_ms'] for e in long_ev), 'tmave_zabery': tma, 'udalosti': out_ev, 'chyby': meta.get('errs', [])}
json.dump(summary, open(os.path.join(RUN, 'ana.json'), 'w'), ensure_ascii=False, indent=1)
json.dump(res, open(os.path.join(RUN, 'snimky.json'), 'w'))

# prehľad: priebeh tmavej plochy v čase (pás) + značky
if res:
    span = max(1, end_t - t0)
    Wd, Hd = 1400, 220
    im = Image.new('RGB', (Wd, Hd), (250, 250, 248))
    dr = ImageDraw.Draw(im)
    X = lambda t: int((t - t0) / span * (Wd - 20)) + 10
    Y = lambda v: int(Hd - 30 - v * (Hd - 60))
    dr.line([(10, Y(THR)), (Wd - 10, Y(THR))], fill=(220, 120, 60))
    pts = [(X(r['t']), Y(r['dimg'])) for r in res]
    if len(pts) > 1:
        dr.line(pts, fill=(20, 20, 20), width=2)
    pts2 = [(X(r['t']), Y(r['dall'])) for r in res]
    if len(pts2) > 1:
        dr.line(pts2, fill=(150, 150, 220), width=1)
    for e in long_ev:
        dr.rectangle([X(t0 + e['od_ms']), Hd - 26, X(t0 + e['do_ms']), Hd - 18], fill=(200, 30, 30))
    for m in marks:
        if 'mark' in m and not m['mark'].startswith(('lcp', 'first')):
            x = X(m['t'])
            dr.line([(x, 10), (x, Hd - 30)], fill=(120, 180, 120))
            dr.text((x + 2, 10 + (hash(m['mark']) % 5) * 12), m['mark'][:22], fill=(40, 100, 40))
    dr.text((10, Hd - 14), f"{meta['name']}  čierna=tmavá prázdna plocha v mieste obrazu (čierna čiara), celá tmavá (modrá), prah {THR}", fill=(0, 0, 0))
    im.save(os.path.join(kdir, '_priebeh.png'))

print(json.dumps({k: summary[k] for k in ('run', 'snimok', 'trvanie_s', 'fps_nahravky', 'prvy_svetly_snimok_ms', 'ciernych_okien', 'najdlhsie_ms', 'spolu_ms')}, ensure_ascii=False))
for e in long_ev:
    f = e['film'] or {}
    print(f"  {e['od_ms']:>7} ms  {e['trvanie_ms']:>6} ms  plocha {e['max_tmavej_plochy']:.2f}  y={e['scrollY']}->{e['scrollY_koniec']}  "
          f"{'PRED-OBRAZOM ' if e['pred_prvym_obrazom'] else ''}znacky={e['znacky']}  film={{cur:{f.get('cur')}, S:{f.get('S')}, T:{f.get('T')}, ready:{f.get('ready')}}}")
