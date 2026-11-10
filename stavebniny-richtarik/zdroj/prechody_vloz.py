# Vloží (alebo nahradí) skript prechodov medzi stránkami v index.html z výstupu build.PRECHODY_HEAD (zdroj/prechody.js
# a pravidlá prípravy stránok). Samostatný nástroj na ručné spustenie po zmene zdroja (build.py index.html nikdy neprepisuje).
# Použitie (z priečinka stavebniny-richtarik): python3 -I zdroj/prechody_vloz.py .   Potom python3 build.py:
# kontrola_uvodu() overí zhodu so zdrojom.
import sys, os, re
D = os.path.abspath(sys.argv[1]); sys.path.insert(0, D); os.chdir(D)
import build
blok = build.PRECHODY_HEAD   # dva skripty, končí novým riadkom
p = os.path.join(D, 'index.html'); ix = open(p, encoding='utf-8').read(); pred = len(ix)
stary = re.compile(r"<script>\(function\(w,d\)\{if\(!\('onpagereveal' in w\)\)return;.*?</script>\n<script type=\"speculationrules\">.*?</script>\n", re.S)
assert len(stary.findall(ix)) == 1
ix = stary.sub(lambda m: blok, ix)
assert ix.count(blok) == 1
open(p, 'w', encoding='utf-8').write(ix)
print('index.html', pred, '→', len(ix), 'B; skript prechodov', len(blok), 'B')
