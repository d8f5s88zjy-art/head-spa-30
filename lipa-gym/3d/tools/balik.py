"""Zostaví balík webu pre artefakt: stránky (s cestami pre artefakt) a len tie médiá, ktoré web
naozaj používa (odkazy v HTML, dáta prehliadky, fotky vo zväčšení). Vypíše celkovú veľkosť.
python3 tools/balik.py CIEĽOVÝ_PRIEČINOK  → CIEĽ/files.json (mapa publikovaná cesta → súbor)"""
import json, os, re, sys, shutil
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = sys.argv[1]
os.makedirs(os.path.join(OUT, 'assets'), exist_ok=True)
PAGES = ['index.html', 'o-fitku.html', 'clenstva.html', 'sluzby.html', 'mma.html', 'kontakt.html']
files, media = {}, set()
for f in PAGES:
    t = open(os.path.join(ROOT, f), encoding='utf-8').read()
    t = t.replace('<a href="../">Klasická verzia webu</a> · ', '').replace('../assets/', 'shared/').replace('href="index.html"', 'href="./"')
    media |= set(re.findall(r'media/[A-Za-z0-9_.-]+\.(?:avif|webp|jpg|png|mp4|webm)', t))
    # zväčšené fotky (lightbox): plné AVIF, WebP 1280, malé JPG
    for src, big in re.findall(r'data-src="([^"]+)" data-big="(\d+)"', t):
        if src.startswith('g-'):
            media |= {f'media/{src}-{big}.avif', f'media/{src}-1080.webp', f'media/{src}-640.jpg'}
        elif src.startswith('panda'):
            media |= {f'media/{src}-{big}.{x}' for x in ('avif', 'webp', 'jpg')}
        else:
            media |= {f'media/{src}-{big}.avif', f'media/{src}-1280.webp', f'media/{src}-480.jpg'}
    dst = os.path.join(OUT, 'artefakt.html' if f == 'index.html' else f)
    open(dst, 'w', encoding='utf-8').write(t)
    if f != 'index.html':
        files[f] = dst
for a in ['style.css', 'site.js', 'fonts/Archivo-latin.woff2', 'fonts/Archivo-latin-ext.woff2', 'fonts/PlexMono-latin.woff2', 'fonts/PlexMono-latin-ext.woff2']:
    files['assets/' + a] = os.path.join(ROOT, 'assets', a)
missing = [m for m in media if not os.path.exists(os.path.join(ROOT, m))]
for m in sorted(media):
    if m not in missing:
        files[m] = os.path.join(ROOT, m)
json.dump(files, open(os.path.join(OUT, 'files.json'), 'w'), indent=0)
tot = sum(os.path.getsize(p) for p in files.values()) + os.path.getsize(os.path.join(OUT, 'artefakt.html'))
print('súborov', len(files) + 1, 'spolu', round(tot / 1048576, 1), 'MB', 'chýba', missing)
