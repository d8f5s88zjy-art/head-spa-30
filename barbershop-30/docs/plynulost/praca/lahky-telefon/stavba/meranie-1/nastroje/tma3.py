# Rozbor screencastu jedného behu (meranie 1). Vstup: <dir>/meta.json {origin, fcp, h1At, h1Box, frames:[{file, ts}]} (ts v ms epochy).
# Plocha obsahu = snímka bez lišty (hore 70 CSS px) a spodných tlačidiel (dole 110 CSS px). Kalibrované na pilote (meranie-1.md):
#   d40  = podiel pixelov plochy obsahu s jasom < 40 (ink a prázdna karta ~19, fotka úvodu 0,31–0,38),
#   tmavá snímka  = d40 ≥ 0,85 (bez fotky; aj keď je na tme už nadpis),  čierna snímka = d40 ≥ 0,97 (nič okrem lišty),
#   fotka         = d40 < 0,60 a smerodajná odchýlka jasu > 25,
#   nadpis v snímke = v ráme #h-uvod (h1Box zo sondy) aspoň 5 % pixelov s jasom ≥ 200 (biely text; bez neho 0,000).
# Snímky pred FCP (prázdna biela about:blank) sa nerátajú.
# Výstup (JSON): fcp; tma3 / cierna3 = podiel ČASU v [FCP, FCP+3000] ms s tmavou / čiernou snímkou; fotkaMs = prvá snímka s fotkou;
#   fotkaH1Ms = prvá snímka s fotkou A nadpisom (ms od začiatku navigácie, v scenári od akcie).
# python3 -I tma3.py <dir> <pás.jpg|-> [--nechaj]
import json, os, sys
from PIL import Image, ImageDraw, ImageStat
d, out = sys.argv[1], sys.argv[2]
m = json.load(open(os.path.join(d, 'meta.json')))
org = m['origin']; fcp = m.get('fcp'); h1 = m.get('h1At'); konec = m.get('koniecMs'); box = m.get('h1Box')
res = []
for f in m['frames']:
    p = f['file']
    if not os.path.exists(p): continue
    im = Image.open(p).convert('L'); w, h = im.size; k = w / 390
    c = im.crop((0, int(70 * k), w, int(h - 110 * k))); hc = c.histogram(); nc = sum(hc)
    d40 = sum(hc[:40]) / nc; sd = ImageStat.Stat(c).stddev[0]
    hb = None
    if box:
        b = im.crop(tuple(int(v * k) for v in box)); hh = b.histogram(); hb = sum(hh[200:]) / max(1, sum(hh))
    res.append({'t': f['ts'] - org, 'dark': d40, 'black': d40 >= 0.97, 'foto': d40 < 0.60 and sd > 25, 'h1': (hb or 0) >= 0.05, 'file': p})
res.sort(key=lambda r: r['t'])
if fcp is not None: res = [r for r in res if r['t'] >= fcp - 5] or res[-1:]
end = konec if konec else (res[-1]['t'] + 50 if res else 0)
def podiel(a, b, test=lambda r: r['dark'] >= 0.85):
    """časový podiel tmavých snímok v [a, b]; úsek pred prvou snímkou v okne sa berie podľa poslednej skoršej snímky"""
    if b <= a: return None
    tot = 0.0
    for i, r in enumerate(res):
        s = r['t']; e = res[i + 1]['t'] if i + 1 < len(res) else end
        s2, e2 = max(s, a), min(e, b)
        if e2 > s2 and test(r): tot += e2 - s2
    return tot / (b - a)
o = {'snimok': len(res), 'fcp': round(fcp) if fcp is not None else None, 'h1At': h1}
if fcp is not None:
    o['tma3'] = round(podiel(fcp, fcp + 3000), 3)
    o['cierna3'] = round(podiel(fcp, fcp + 3000, lambda r: r['black']), 3)
    o['tmavychSnimok3s'] = sum(1 for r in res if r['t'] <= fcp + 3000 and r['dark'] >= 0.85)
foto = [r for r in res if r['foto']]
o['fotkaMs'] = round(foto[0]['t']) if foto else None
fh = None
if box:
    fhs = [r for r in res if r['foto'] and r['h1']]
    fh = fhs[0]['t'] if fhs else None
o['fotkaH1Ms'] = round(fh) if fh is not None else None
o['tmaKoniec'] = round(res[-1]['dark'], 3) if res else None
o['fotkaKoniec'] = res[-1]['foto'] if res else None
if out != '-' and res:
    casy = ([('FCP', fcp + 30)] if fcp is not None else []) + [(f'{t} ms', t) for t in (1000, 1500, 2000, 3000, 5000)]
    ims = []
    for lab, t in casy:
        c = [r for r in res if r['t'] <= t]
        if not c: im = Image.new('RGB', (390, 844), (255, 255, 255)); txt = f'{lab}: bez obrazu'
        else:
            r = c[-1]; im = Image.open(r['file']).convert('RGB'); txt = f'{lab} (t {round(r["t"])}) tma {r["dark"]*100:.0f}%'
        im = im.resize((260, round(260 * im.height / im.width)))
        can = Image.new('RGB', (im.width, im.height + 22), (40, 40, 40)); can.paste(im, (0, 22))
        ImageDraw.Draw(can).text((4, 5), txt, fill=(255, 220, 120)); ims.append(can)
    Wt = sum(i.width + 4 for i in ims); Ht = max(i.height for i in ims)
    sh = Image.new('RGB', (Wt, Ht), (0, 0, 0)); x = 0
    for i in ims: sh.paste(i, (x, 0)); x += i.width + 4
    sh.save(out, quality=72)
if '--nechaj' not in sys.argv:
    for r in res:
        try: os.remove(r['file'])
        except OSError: pass
print(json.dumps(o, ensure_ascii=False))
