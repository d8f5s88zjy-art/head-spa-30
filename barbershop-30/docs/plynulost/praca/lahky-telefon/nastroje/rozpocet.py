# Súčty bajtov (gzip pre text, ako GitHub Pages) a megapixelov pre scenáre iPhone 390x844 DPR3 (Safari, AVIF).
# Použitie: python3 -I rozpocet.py <koreň stromu D1> <koreň stromu BALÍK>
import sys, os, gzip, glob, importlib.util
here = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('rozmery', os.path.join(here, 'rozmery.py'))
D1, BAL = sys.argv[1], sys.argv[2]
def dims(p):
    import struct
    b = open(p, 'rb').read()
    if p.endswith('.avif'):
        i = b.find(b'ispe'); return struct.unpack('>II', b[i+8:i+16])
    if p.endswith('.webp'):
        c = b[12:16]
        if c == b'VP8X': return (1+int.from_bytes(b[24:27],'little'), 1+int.from_bytes(b[27:30],'little'))
        if c == b'VP8 ': w, h = struct.unpack('<HH', b[26:30]); return (w & 0x3fff, h & 0x3fff)
        if c == b'VP8L': v = int.from_bytes(b[21:25],'little'); return ((v & 0x3fff)+1, ((v >> 14) & 0x3fff)+1)
    return None
TEXT = ('.html', '.css', '.js', '.json')
def size(root, f):
    p = os.path.join(root, f)
    b = open(p, 'rb').read()
    return len(gzip.compress(b, 6)) if f.endswith(TEXT) else len(b)
def mp(root, f):
    d = dims(os.path.join(root, f)) if f.endswith(('.avif', '.webp')) else None
    return d[0]*d[1]/1e6 if d else 0.0
FONTS = [f'assets/fonts/{n}.woff2' for n in ('Fraunces-500','Fraunces-500i','Fraunces-800','Manrope-400','Manrope-600','Manrope-700')]
F = 'assets/img/film/'
def seq(name): return sorted(os.path.relpath(p, D1) for p in glob.glob(os.path.join(D1, f'assets/seq/{name}/f*.avif')))
TEAM = [f'assets/img/tim-{n}-820.avif' for n in ('nikolas','kristian','damian','michal','andy','dominika','kevin','lajko','jojo','adrian')]
GAL_D1 = ['assets/img/naradie-noznice-1600.avif'] + [f'assets/img/{n}-640.avif' for n in ('detail-stol','galeria-barberpole','galeria-neon','galeria-zrkadlo','galeria-buldog','galeria-kava','galeria-sud')]
GAL_BAL = [f'assets/img/{n}-1600.avif' for n in ('naradie-noznice','detail-stol','galeria-buldog','galeria-kava','galeria-sud')] + [f'assets/img/{n}-1080.avif' for n in ('galeria-barberpole','galeria-neon','galeria-zrkadlo')]
def S(t): return {
 'D1': {
  'text_film': ['index.html','assets/style.css','assets/app.js','assets/vernost.js','assets/film.js','assets/vendor/three.module.min.js'],
  'text_off':  ['index.html','assets/style.css','assets/app.js','assets/vernost.js','assets/film.js'],
  'depth': '-m-hlbka.webp'},
 'BAL': {
  'text_film': ['index.html','assets/style.css','assets/d7.css','assets/app.js','assets/vernost.js','assets/film.js','assets/film-worker.js','assets/galeria.js','assets/img/film/nahlady.json','assets/img/film/nahlady.css','assets/vendor/three.module.min.js'],
  'text_off':  ['index.html','assets/style.css','assets/d7.css','assets/app.js','assets/vernost.js','assets/film.js','assets/galeria.js','assets/img/film/nahlady.css'],
  'depth': '-m-hlbka-z.webp'}}[t]
def scen(t):
    c = S(t); dp = c['depth']
    ph = lambda n: F + n + '-m-1448.avif'
    dep = lambda n: F + n + dp
    out = {}
    # (a) prvá obrazovka, film zapnutý, prvá návšteva (prológ): fasáda + rohožka + hĺbky + plagát ďalšieho záberu
    #     + zálohy is-near po load (D1: karty 0..2, BALÍK: 0..1)
    a = ['assets/img/film/vstup-m-1448.avif', dep('vstup'), ph('rohozka'), dep('rohozka'), 'assets/seq/vstup-dnu/f025.avif']
    a += (['assets/img/film/stol-m-1448.avif'] if t == 'D1' else [ph('sala')])
    out['a_film'] = (c['text_film'] + FONTS, a)
    # (a) film vypnutý (world-off): záloha úvodu rohožka + is-near
    a2 = [ph('rohozka')] + (['assets/seq/vstup-dnu/f025.avif', 'assets/img/film/stol-m-1448.avif'] if t == 'D1' else [ph('sala')])
    out['a_off'] = (c['text_off'] + FONTS, a2)
    # (b) celá stránka, film zapnutý
    shots = ['vstup', 'rohozka', 'cakaren', 'kreslo-stred', 'kava', 'sud']
    b = [ph(n) for n in shots] + [dep(n) for n in shots]
    b += seq('vstup-dnu') + seq('okolo-kresla') + ['assets/video/tim-slucka-poster-864.avif', 'assets/video/tim-slucka-864.mp4']
    b += ['assets/img/film/stol-m-1448.avif', ph('sala-rano')] + ([] if t == 'D1' else [ph('sala')])   # HTML zálohy stiahnuté popri filme
    b += TEAM + ['assets/video/tim-v-akcii-poster-576.webp', 'assets/video/tim-v-akcii-576.mp4'] + (GAL_D1 if t == 'D1' else GAL_BAL)
    out['b_film'] = (c['text_film'] + FONTS + ['assets/recenzie.js'], b)
    # (b) celá stránka, film vypnutý: len HTML zálohy
    b2 = [ph(n) for n in ['rohozka', 'cakaren', 'sala-rano', 'kreslo-stred', 'kava', 'sud', 'vstup']] + ['assets/img/film/stol-m-1448.avif']
    b2 += (['assets/seq/vstup-dnu/f025.avif'] if t == 'D1' else [ph('sala')])
    b2 += TEAM + ['assets/video/tim-v-akcii-poster-576.webp', 'assets/video/tim-v-akcii-576.mp4'] + (GAL_D1 if t == 'D1' else GAL_BAL)
    out['b_off'] = (c['text_off'] + FONTS + ['assets/recenzie.js'], b2)
    return out
for t, root in (('D1', D1), ('BAL', BAL)):
    for k, (txt, med) in scen(t).items():
        med = list(dict.fromkeys(med)); txt = list(dict.fromkeys(txt))
        tb = sum(size(root, f) for f in txt); mb = sum(size(root, f) for f in med)
        vids = sum(size(root, f) for f in med if f.endswith('.mp4'))
        imgs = [f for f in med if f.endswith(('.avif', '.webp'))]
        mps = sorted(((mp(root, f), f) for f in imgs), reverse=True)
        print(f"{t}\t{k}\ttext+písma={tb/1024:.0f} kB\tobrázky={(mb-vids)/1024:.0f} kB ({len(imgs)} súb.)\tvideo={vids/1024:.0f} kB\tspolu={(tb+mb)/1024/1024:.2f} MB\tMP spolu={sum(m for m,_ in mps):.1f}\tnad 1,5 MP: {sum(1 for m,_ in mps if m>1.5)} ks / {sum(m for m,_ in mps if m>1.5):.1f} MP")
        if k in ('a_film', 'a_off'):
            for m, f in mps: print(f"\t\t{size(root,f)/1024:.0f} kB\t{m:.2f} MP\t{f}")
