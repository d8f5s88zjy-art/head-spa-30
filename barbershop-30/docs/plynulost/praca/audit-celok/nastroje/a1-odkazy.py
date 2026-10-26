#!/usr/bin/env python3
# A1 – statická kontrola odkazov webu BARBERSHOP 30: každá lokálna cesta v HTML (href, src, srcset, poster,
# data-full, data-poster, data-lightbox-src[set], imagesrcset), v CSS (url(...)) a v JS (reťazce 'assets/…',
# new URL('…', import.meta.url)) musí existovať na disku. Kotvy #id musia mať cieľ v tej istej stránke.
# Použitie: python3 -I a1-odkazy.py <priečinok barbershop-30>   (výstup: riadky CHÝBA / OK súhrn, exit 1 pri chybe)
import os, re, sys, json
from urllib.parse import urlsplit, unquote

ROOT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else '.')
STRANKY = ['index.html', 'en/index.html', 'rezervacia.html', 'karta/index.html', 'admin/index.html']
chyby, pocet = [], 0

def lokalne(u):
    u = u.strip()
    if not u or u.startswith(('http:', 'https:', 'mailto:', 'tel:', 'data:', 'blob:', 'javascript:', '#', '//', '{', '$')):
        return None
    return u

def over(zdroj, base_dir, u, kde):
    global pocet
    u = lokalne(u)
    if u is None:
        return
    cesta = unquote(urlsplit(u).path)
    if not cesta:
        return
    pocet += 1
    abs_ = os.path.normpath(os.path.join(ROOT, cesta.lstrip('/')) if cesta.startswith('/') else os.path.join(base_dir, cesta))
    if cesta.endswith('/'):
        abs_ = os.path.join(abs_, 'index.html')
    if not os.path.exists(abs_):
        chyby.append(f'CHÝBA {os.path.relpath(abs_, ROOT)}  (z {zdroj}:{kde}: {u})')

def riadok(text, pos):
    return text.count('\n', 0, pos) + 1

for s in STRANKY:
    p = os.path.join(ROOT, s)
    if not os.path.exists(p):
        chyby.append(f'CHÝBA stránka {s}')
        continue
    t = open(p, encoding='utf-8').read()
    d = os.path.dirname(p)
    ids = set(re.findall(r'\bid="([^"]+)"', t))
    for m in re.finditer(r'\b(href|src|poster|data-full|data-poster|data-lightbox-src|data-src)="([^"]*)"', t):
        if m.group(1) == 'href' and m.group(2).startswith('#') and len(m.group(2)) > 1 and m.group(2)[1:] not in ids:
            chyby.append(f'KOTVA bez cieľa {m.group(2)} ({s}:{riadok(t, m.start())})')
        over(s, d, m.group(2), riadok(t, m.start()))
    for m in re.finditer(r'\b(srcset|imagesrcset|data-lightbox-srcset)="([^"]*)"', t):
        for kus in m.group(2).split(','):
            kus = kus.strip().split()
            if kus:
                over(s, d, kus[0], riadok(t, m.start()))

# CSS url(...)
for dp, dn, fn in os.walk(ROOT):
    if '/source' in dp or '/docs' in dp:
        continue
    for f in fn:
        p = os.path.join(dp, f)
        rel = os.path.relpath(p, ROOT)
        if f.endswith('.css'):
            t = open(p, encoding='utf-8').read()
            for m in re.finditer(r'url\(\s*["\']?([^"\')]+)["\']?\s*\)', t):
                over(rel, dp, m.group(1), riadok(t, m.start()))
        elif f.endswith('.js') and '/vendor' not in dp:
            t = open(p, encoding='utf-8').read()
            for m in re.finditer(r"new URL\(\s*'([^'$`]+)'\s*,\s*import\.meta\.url", t):
                over(rel, dp, m.group(1), riadok(t, m.start()))
            for m in re.finditer(r"import\(\s*'(\.[^']+)'\s*\)", t):
                over(rel, dp, m.group(1), riadok(t, m.start()))
            for m in re.finditer(r"['\"`]((?:\.\./)?assets/[A-Za-z0-9_./-]+\.(?:webp|avif|jpg|png|svg|json|js|css|m4a|webm|mp4|vcf|woff2))['\"`]", t):
                # cesty 'assets/…' v skriptoch sú relatívne k stránke (index.html v koreni)
                over(rel, ROOT, m.group(1), riadok(t, m.start()))
        elif f.endswith('.webmanifest'):
            j = json.load(open(p, encoding='utf-8'))
            for ik in j.get('icons', []):
                over(rel, dp, ik.get('src', ''), 'icons')
            for k in ('start_url', 'scope'):
                if j.get(k):
                    over(rel, dp, j[k].split('?')[0] or './', k)

for c in chyby:
    print(c)
print(f'SÚHRN: overených lokálnych ciest {pocet}, chýb {len(chyby)}')
sys.exit(1 if chyby else 0)
