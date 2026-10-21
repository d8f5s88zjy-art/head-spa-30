"""Výpočet viditeľnej plochy a ostrosti titulných kariet + náhľad rámov na pôvodnej fotke.
Použitie: python3 -I rozbor.py <proto/barbershop-30> <fakty>"""
import json, sys, re, os
from PIL import Image, ImageDraw, ImageFont

ROOT, OUT = sys.argv[1], sys.argv[2]
film = json.load(open(f'{ROOT}/assets/img/film/film.json'))
meas = json.load(open(f'{OUT}/raw/meranie.json'))
html = open(f'{ROOT}/index.html', encoding='utf-8').read()

cards = []
for m in re.finditer(r'<div class="film-shot is-title[^"]*"([^>]*)>', html):
    a = dict(re.findall(r'(data-[\w-]+)="([^"]*)"', m.group(1)))
    cards.append(a)

def cover(W, H, cw, ch, px, py, L=0, T=0):
    s = max(W / cw, H / ch)
    w, h = W / s, H / s
    x0 = L + (cw - w) * px
    y0 = T + (ch - h) * py
    return dict(x0=x0, y0=y0, x1=x0 + w, y1=y0 + h, s=s, drawnW=cw * s, drawnH=ch * s)

def film_frame(W, H, W0, H0, fx, fy, z0):
    # style.css html.world .film-still img (presah 1,24, prvý snímok filmu pri kotve)
    k = 1 / (1 + z0); pa = W0 / H0
    pw = 1.24 * k * max(W, H * pa); ph = pw / pa
    mx = (pw - W * k) / 2 - 0.06 * W * k; my = (ph - H * k) / 2 - 0.06 * H * k
    ex = min(max((fx - 0.5) * pw, -mx), mx); ey = min(max((0.5 - fy) * ph, -my), my)
    left = W / 2 - pw / 2 - ex; top = H / 2 - ph / 2 + ey
    sc = pw / W0
    return dict(x0=-left / sc, y0=-top / sc, x1=(W - left) / sc, y1=(H - top) / sc, s=sc, drawnW=pw, drawnH=ph)

def area(r): return max(0, r['x1'] - r['x0']) * max(0, r['y1'] - r['y0'])
def inter(a, b): return dict(x0=max(a['x0'], b['x0']), y0=max(a['y0'], b['y0']), x1=min(a['x1'], b['x1']), y1=min(a['y1'], b['y1']))

def file_w(name, tier, m=False):
    t = (film[name]['m'] if m else film[name])['tiers'][str(tier)]
    return t['w'], t['h']

rows = []
for c in cards:
    name = c['data-shot']; fj = film[name]; mj = fj['m']
    W0, H0 = fj['width'], fj['height']
    fx, fy = map(float, c['data-f'].split(','))
    fmx, fmy = map(float, c['data-fm'].split(','))
    mW, mH = map(int, c['data-m-size'].split('x'))
    L, T = mj.get('left', 0), mj.get('top', 0)
    same_src = mj['source'] == fj['source']
    msrc = Image.open(f"{ROOT}/{mj['source']}").size
    z0 = -0.005 if c.get('data-mv') == 'near' else -0.04
    r = dict(shot=name, place=c.get('data-place'), W0=W0, H0=H0, same_src=same_src, msrc=msrc, mcrop=(L, T, mW, mH))
    r['pc'] = cover(1440, 900, W0, H0, fx, fy)
    r['pcfilm'] = film_frame(1440, 900, W0, H0, fx, fy, z0)
    for dev, (W, H) in dict(tel390=(390, 844), tel430=(430, 932)).items():
        r[dev] = cover(W, H, mW, mH, fmx, fmy, L, T)
    for k in ('pc', 'pcfilm', 'tel390', 'tel430'):
        rr = r[k]
        base = W0 * H0 if (k.startswith('pc') or same_src) else msrc[0] * msrc[1]
        rr['pct'] = 100 * area(rr) / base
        if k.startswith('tel') and same_src:
            ov = inter(rr, r['pc'])
            rr['ofpc'] = 100 * area(ov) / area(r['pc'])
            pw = r['pc']['x1'] - r['pc']['x0']
            rr['miss_l'] = 100 * max(0, rr['x0'] - r['pc']['x0']) / pw
            rr['miss_r'] = 100 * max(0, r['pc']['x1'] - rr['x1']) / pw
            rr['ofpcfilm'] = 100 * area(inter(rr, r['pcfilm'])) / area(r['pcfilm'])
    # ostrosť: súbor, ktorý prehliadač naozaj vzal (meranie.json), px súboru na CSS px pri priblížení 1,00
    for dev in ('pc1', 'pc2', 'tel390', 'tel430'):
        mm = next(x for x in meas[dev] if x['shot'] == name)
        src = mm['src']; tier = int(re.search(r'-(\d+)\.\w+$', src).group(1))
        ism = '-m-' in src
        fw, fh = file_w(name, tier, ism)
        drawn = (r[dev]['drawnW'] if dev.startswith('tel') else r['pc']['drawnW'])
        dpr = {'pc1': 1, 'pc2': 2, 'tel390': 3, 'tel430': 3}[dev]
        r['f_' + dev] = dict(src=src, fw=fw, fh=fh, pxcss=fw / drawn, dpr=dpr, krytie=fw / drawn / dpr,
                             zoom=mm['css']['z'], meas_drawnW=mm['css']['drawnW'])
    rows.append(r)

json.dump(rows, open(f'{OUT}/raw/rozbor.json', 'w'), indent=1, ensure_ascii=False)

# tabuľky
print('| karta | PC 1440×900 cover | PC s filmom (rámovanie 1,24) | tel 390×844 | tel 430×932 | z plochy PC vidno na tel 390 | chýba vľavo / vpravo (z šírky PC) |')
for r in rows:
    t = r['tel390']; t4 = r['tel430']
    extra = f"{t['ofpc']:.0f} % | {t['miss_l']:.0f} % / {t['miss_r']:.0f} %" if r['same_src'] else 'iná fotka | –'
    print(f"| {r['shot']} | {r['pc']['pct']:.1f} % | {r['pcfilm']['pct']:.1f} % | {t['pct']:.1f} % | {t4['pct']:.1f} % | {extra} |")
print()
print('| karta | PC DPR1 súbor | px/CSS | PC DPR2 súbor | px/CSS | tel 390 DPR3 súbor | px/CSS | px/fyz. px | tel 430 | px/CSS | px/fyz. px |')
for r in rows:
    a, b, c, d = r['f_pc1'], r['f_pc2'], r['f_tel390'], r['f_tel430']
    print(f"| {r['shot']} | {a['src']} ({a['fw']}×{a['fh']}) | {a['pxcss']:.2f} | {b['src']} ({b['fw']}×{b['fh']}) | {b['pxcss']:.2f} | {c['src']} ({c['fw']}×{c['fh']}) | {c['pxcss']:.2f} | {c['krytie']:.2f} | {d['src']} | {d['pxcss']:.2f} | {d['krytie']:.2f} |")

# náhľad rámov na pôvodnej fotke (len kreslenie obdĺžnikov do diagnostického obrázka, fotka sa nemení)
try:
    font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 22)
except Exception:
    font = ImageFont.load_default()
os.makedirs(f'{OUT}/ramy', exist_ok=True)
thumbs = []
for r in rows:
    fj = film[r['shot']]
    im = Image.open(f"{ROOT}/{fj['source']}").convert('RGB')
    sc = 900 / im.width
    im = im.resize((900, round(im.height * sc)), Image.LANCZOS)
    dr = ImageDraw.Draw(im)
    def box(rr, col, wdt):
        dr.rectangle([rr['x0'] * sc, rr['y0'] * sc, rr['x1'] * sc - 1, rr['y1'] * sc - 1], outline=col, width=wdt)
    box(r['pc'], (60, 220, 90), 5)
    box(r['pcfilm'], (80, 160, 255), 3)
    if r['same_src']:
        box(r['tel430'], (255, 220, 0), 3)
        box(r['tel390'], (255, 110, 0), 5)
    dr.rectangle([0, 0, 900, 34], fill=(0, 0, 0))
    txt = f"{r['shot']}: PC {r['pc']['pct']:.0f} %  film {r['pcfilm']['pct']:.0f} %  tel390 {r['tel390']['pct']:.0f} %" + ('' if r['same_src'] else ' (tel = iná fotka)')
    dr.text((8, 5), txt, fill=(255, 255, 255), font=font)
    im.save(f"{OUT}/ramy/{r['shot']}.jpg", quality=82)
    thumbs.append(im)
cols = 3
tw, th = 900, max(t.height for t in thumbs)
sheet = Image.new('RGB', (cols * tw + (cols + 1) * 10, ((len(thumbs) + cols - 1) // cols) * (th + 10) + 10 + 50), (20, 20, 20))
d = ImageDraw.Draw(sheet)
d.text((10, 12), 'Zelená = PC 1440×900 (?film=off, cover)   Modrá = PC s filmom (presah 1,24)   Oranžová = telefón 390×844   Žltá = telefón 430×932', fill=(255, 255, 255), font=font)
for i, t in enumerate(thumbs):
    sheet.paste(t, (10 + (i % cols) * (tw + 10), 50 + (i // cols) * (th + 10)))
sheet = sheet.resize((sheet.width // 2, sheet.height // 2), Image.LANCZOS)
sheet.save(f'{OUT}/ramy-vsetky-karty.jpg', quality=80)
print('sheet', sheet.size, os.path.getsize(f'{OUT}/ramy-vsetky-karty.jpg'))
