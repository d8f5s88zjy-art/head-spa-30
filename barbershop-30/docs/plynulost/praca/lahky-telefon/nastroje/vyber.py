# Simulácia výberu <picture>/<img srcset> pre iPhone 390x844 DPR3 so Safari (AVIF áno).
# Pravidlo WebKit (predpoklad, overiť v Safari Web Inspector cez currentSrc): najmenší kandidát s hustotou >= DPR, inak najväčší.
# Použitie: python3 -I vyber.py <strom> <pro:0|1>
import sys, re, os
from html.parser import HTMLParser
VW, VH, DPR = 390, 844, 3
root, pro = sys.argv[1], sys.argv[2] == '1'
def mq(m):
    if not m: return True
    ok = True
    for a, n in re.findall(r'\((max|min)-width:\s*(\d+)px\)', m):
        n = int(n); ok &= (VW <= n) if a == 'max' else (VW >= n)
    return ok
def length(s):
    s = s.strip()
    m = re.match(r'([\d.]+)vw$', s)
    if m: return float(m.group(1)) * VW / 100
    m = re.match(r'([\d.]+)px$', s)
    if m: return float(m.group(1))
    raise ValueError(s)
def sizes(v):
    if not v: return VW
    for part in v.split(','):
        part = part.strip()
        m = re.match(r'(\(.*\))\s+(\S+)$', part)
        if m:
            if mq(m.group(1)): return length(m.group(2))
        else: return length(part)
    return VW
def pick(srcset, sz):
    c = []
    for item in srcset.split(','):
        p = item.strip().split()
        if len(p) == 2 and p[1].endswith('w'): c.append((int(p[1][:-1]) / sz, p[0]))
        elif len(p) >= 1: c.append((1.0, p[0]))
    c.sort()
    for d, u in c:
        if d >= DPR: return u, d
    return c[-1][1], c[-1][0]
class P(HTMLParser):
    def __init__(s):
        super().__init__(); s.tpl = None; s.nos = 0; s.pic = None; s.out = []; s.line = 0
    def handle_starttag(s, t, a):
        a = dict(a)
        if t == 'template': s.tpl = a.get('id'); return
        if t == 'noscript': s.nos += 1; return
        if s.nos: return
        if s.tpl and not ((s.tpl == 'still-vstup') == pro): return
        if t == 'picture': s.pic = {'src': [], 'line': s.getpos()[0], 'tpl': s.tpl}
        elif t == 'source' and s.pic is not None: s.pic['src'].append(a)
        elif t == 'img':
            ln = s.getpos()[0]
            if s.pic is not None:
                for so in s.pic['src']:
                    if not mq(so.get('media')): continue
                    ty = so.get('type', '')
                    if ty and ty not in ('image/avif', 'image/webp', 'image/jpeg', 'image/png'): continue
                    u, d = pick(so['srcset'], sizes(so.get('sizes') or a.get('sizes')))
                    break
                else:
                    u, d = pick(a['srcset'], sizes(a.get('sizes'))) if a.get('srcset') else (a['src'], 1)
            else:
                u, d = pick(a['srcset'], sizes(a.get('sizes'))) if a.get('srcset') else (a.get('src', ''), 1)
            s.out.append((ln, u, d, a.get('loading', 'eager'), sizes(a.get('sizes')) if a.get('sizes') else None, a.get('class', '')))
    def handle_endtag(s, t):
        if t == 'template': s.tpl = None
        elif t == 'noscript': s.nos -= 1
        elif t == 'picture': s.pic = None
p = P(); p.feed(open(os.path.join(root, 'index.html'), encoding='utf-8').read())
for ln, u, d, lz, sz, cl in p.out:
    if not u: continue
    f = os.path.join(root, u)
    size = os.path.getsize(f) if os.path.isfile(f) else -1
    print(f"{ln}\t{u}\thustota={d:.2f}\tsizes={sz}\t{lz}\t{size}")
