#!/usr/bin/env python3
"""Zálohy filmu v index.html z assets/img/film/film.json.

Každú <picture class="film-still"> (aj v <template> a <noscript>) prepíše podľa film.json: zdroje
pre telefón (výrez na výšku <meno>-m-*, media (max-width: 720px) ako prah telefónu vo film.js),
zdroje na šírku so všetkými stupňami (AVIF, WebP) a <img> so zálohou WebP; šírky v srcset sú
skutočné šírky súborov (rohozka-2172 = 1920w). Zachová alt, loading/fetchpriority/decoding a
--fx/--fy; doplní --fmx/--fmy (bod záujmu výrezu). Na kotvách .film-shot doplní data-size,
data-tiers, data-m, data-m-size, data-m-tiers, data-fm a to isté pre prológ (data-pro-*).

Spustenie z koreňa barbershop-30: python3 -I source/tools/stills.py [--check]"""
import json, os, re, sys
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MAN = json.load(open(os.path.join(ROOT, 'assets', 'img', 'film', 'film.json')))
HTML = os.path.join(ROOT, 'index.html')
PHONE = '(max-width: 720px)'
P = 'assets/img/film/'

def srcset(name, tiers, ext):
    return ', '.join(f'{P}{name}-{w}.{ext} {t["w"]}w' for w, t in sorted(tiers.items(), key=lambda kv: int(kv[0])))

def mid(tiers):
    ws = sorted(int(w) for w in tiers); return ws[min(1, len(ws) - 1)]

def picture(name, style, img_attrs, indent):
    r = MAN[name]; m = r['m']
    fmx = f'{m["fx"] * 100:.1f}%'
    st = re.sub(r'\s*--fmx:[^;]*;?|\s*--fmy:[^;]*;?', '', style).rstrip('; ')
    fy = re.search(r'--fy:\s*([^;"]+)', st); fmy = fy.group(1).strip() if fy else '50%'
    st = f'{st}; --fmx: {fmx}; --fmy: {fmy}'
    i = indent
    return (f'{i}<picture class="film-still" style="{st}">\n'
            f'{i}  <source media="{PHONE}" type="image/avif" srcset="{srcset(name + "-m", m["tiers"], "avif")}" sizes="100vw">\n'
            f'{i}  <source media="{PHONE}" type="image/webp" srcset="{srcset(name + "-m", m["tiers"], "webp")}" sizes="100vw">\n'
            f'{i}  <source type="image/avif" srcset="{srcset(name, r["tiers"], "avif")}" sizes="100vw">\n'
            f'{i}  <source type="image/webp" srcset="{srcset(name, r["tiers"], "webp")}" sizes="100vw">\n'
            f'{i}  <img src="{P}{name}-{mid(r["tiers"])}.webp" srcset="{srcset(name, r["tiers"], "webp")}" sizes="100vw" width="{r["width"]}" height="{r["height"]}"{img_attrs}>\n'
            f'{i}</picture>')

PIC = re.compile(r'^([ \t]*)<picture class="film-still" style="([^"]*)">\s*\n(.*?)^[ \t]*</picture>', re.S | re.M)
def rewrite_pictures(html):
    def rep(mo):
        indent, style, body = mo.group(1), mo.group(2), mo.group(3)
        img = re.search(r'<img\b([^>]*)>', body).group(1)
        name = re.search(r'assets/img/film/([a-z0-9-]+?)(?:-m)?-\d+\.(?:avif|webp)', body).group(1)
        # atribúty <img> okrem src/srcset/sizes/width/height
        keep = re.sub(r'\s+(?:src|srcset|sizes|width|height)="[^"]*"', '', img)
        return picture(name, style, keep, indent)
    return PIC.sub(rep, html)

def set_attrs(tag, attrs):
    for k, v in attrs.items():
        if re.search(rf'\s{k}="[^"]*"', tag): tag = re.sub(rf'\s{k}="[^"]*"', f' {k}="{v}"', tag, count=1)
        else: tag = tag[:-1] + f' {k}="{v}"' + tag[-1]
    return tag

def rewrite_anchors(html):
    def rep(mo):
        tag = mo.group(0)
        name = re.search(r'data-shot="([^"]+)"', tag).group(1); r = MAN[name]; m = r['m']
        a = {'data-size': f'{r["width"]}x{r["height"]}', 'data-tiers': ','.join(str(w) for w in sorted(map(int, r['tiers']))),
             'data-m': f'{name}-m', 'data-m-size': f'{m["width"]}x{m["height"]}', 'data-m-tiers': ','.join(str(w) for w in sorted(map(int, m['tiers'])))}
        fy = re.search(r'data-f="[^,"]+,([^"]+)"', tag); a['data-fm'] = f'{m["fx"]:.2f},{fy.group(1).strip() if fy else "0.5"}'
        pro = re.search(r'data-pro="([^"]+)"', tag)
        if pro:
            pr = MAN[pro.group(1)]; pm = pr['m']
            a.update({'data-pro-size': f'{pr["width"]}x{pr["height"]}', 'data-pro-tiers': ','.join(str(w) for w in sorted(map(int, pr['tiers']))),
                      'data-pro-m': f'{pro.group(1)}-m', 'data-pro-m-size': f'{pm["width"]}x{pm["height"]}', 'data-pro-m-tiers': ','.join(str(w) for w in sorted(map(int, pm['tiers'])))})
            pfy = re.search(r'data-pro-f="[^,"]+,([^"]+)"', tag); a['data-pro-fm'] = f'{pm["fx"]:.2f},{pfy.group(1).strip() if pfy else "0.5"}'
        return set_attrs(tag, a)
    return re.sub(r'<div class="film-shot[^"]*"[^>]*data-shot="[^"]+"[^>]*>', rep, html, flags=re.S)

html = open(HTML, encoding='utf-8').read()
new = rewrite_anchors(rewrite_pictures(html))
if '--check' in sys.argv:
    print('zhodné' if new == html else 'líši sa'); sys.exit(0 if new == html else 1)
open(HTML, 'w', encoding='utf-8').write(new)
print('zálohy:', len(PIC.findall(new)), 'kotvy:', len(re.findall(r'data-m="', new)))
