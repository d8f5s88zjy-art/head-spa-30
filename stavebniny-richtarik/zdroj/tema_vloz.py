# Vloží (alebo nahradí) skript témy podkladu v index.html z výstupu build.tema_head() (zdroj/tema-head.js): pred
# <link rel="stylesheet" href="assets/site.css">, aby bežal pred prvým vykreslením. Samostatný nástroj na ručné spustenie
# po zmene zdroja (build.py index.html nikdy neprepisuje). Použitie (z priečinka stavebniny-richtarik, venv s lxml):
# python3 -I zdroj/tema_vloz.py .   Potom python3 build.py: kontrola_uvodu() overí zhodu so zdrojom.
import sys, os, re
D = os.path.abspath(sys.argv[1]); sys.path.insert(0, D); os.chdir(D)
import build
blok = build.TEMA_HEAD   # končí novým riadkom
p = os.path.join(D, 'index.html'); ix = open(p, encoding='utf-8').read(); pred = len(ix)
ix = re.sub(r'<script>\(function\(h,d\)\{try\{var m=/\[\?&\]tema=.*?</script>\n', '', ix, flags=re.S)   # starý blok preč
kotva = '<link rel="stylesheet" href="assets/site.css">'
assert ix.count(kotva) == 1
ix = ix.replace(kotva, blok + kotva)
assert ix.count(blok) == 1
open(p, 'w', encoding='utf-8').write(ix)
print('index.html', pred, '→', len(ix), 'B; skript témy', len(blok), 'B')
