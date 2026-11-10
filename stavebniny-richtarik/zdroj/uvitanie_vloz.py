# Vloží (alebo nahradí) uvítanie „Brána“ v index.html z výstupu build.uvitanie_bloky() (zdroj/uvitanie.*).
# Samostatný nástroj na ručné spustenie po zmene zdroja (build.py index.html nikdy neprepisuje).
# Použitie (z priečinka stavebniny-richtarik, venv s lxml): python3 -I zdroj/uvitanie_vloz.py .
# Potom python3 build.py: kontrola_uvodu() overí, že bloky v index.html sa zhodujú so zdrojom.
# Bloky: <style> a <script> rozhodnutia pred skript uv-ide v <head>, prekryv .br ako prvý prvok <body> (pozdrav v prvom
# vykreslení), skript za hlavičkou a menu tesne pred <main>;
# skript uv-ide dostane podmienku &&!h.classList.contains("br-ide"). Opakované spustenie bloky len nahradí.
import sys, os, re
D = os.path.abspath(sys.argv[1]); sys.path.insert(0, D); os.chdir(D)
import build
b = build.uvitanie_bloky()
p = os.path.join(D, 'index.html'); ix = open(p, encoding='utf-8').read(); pred = len(ix)
# staré bloky preč (opakované spustenie)
ix = re.sub(r'<style>\.br\{.*?</style>\n', '', ix, flags=re.S)
ix = re.sub(r'<script>\(function\(h,w,d\)\{var VYP=.*?</script>\n', '', ix, flags=re.S)
ix = re.sub(r'<template id="br-tpl">.*?</template>\n<script>.*?</script>\n', '', ix, flags=re.S)   # staršia podoba (šablóna)
ix = re.sub(r'<div class="br" aria-hidden="true">[^\n]*\n', '', ix)
ix = re.sub(r'<script>\(function\(d,w\)\{var h=d\.documentElement,ov0=.*?</script>\n(?=<main id="obsah">)', '', ix, flags=re.S)
kotva = '<script>/* pohyb úvodu len pri'
assert ix.count(kotva) == 1
ix = ix.replace(kotva, b['style'] + '\n' + b['head'] + '\n' + kotva)
uv = '.matches)h.classList.add("uv-ide")'
if uv in ix: ix = ix.replace(uv, '.matches&&!h.classList.contains("br-ide"))h.classList.add("uv-ide")')
main = '<main id="obsah">'
assert ix.count(main) == 1
ix = ix.replace(main, b['skript'] + '\n' + main)
body = re.search(r'<body[^>]*>\n', ix)
ix = ix[:body.end()] + b['sablona'] + '\n' + ix[body.end():]
for n, x in b.items(): assert ix.count(x) == 1, n
open(p, 'w', encoding='utf-8').write(ix)
print('index.html', pred, '→', len(ix), 'B; bloky:', {n: len(x) for n, x in b.items()})
