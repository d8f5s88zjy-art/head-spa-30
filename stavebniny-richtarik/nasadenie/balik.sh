#!/usr/bin/env bash
# Balík na nahratie na hosting (koreň domény): len to, čo web pri behu potrebuje, zoznam súborov, zip a kontroly.
# Použitie (v priečinku webu): bash nasadenie/balik.sh . <výstupný priečinok>
# Výstup: <výstup>/web/ (obsah na nahratie), <výstup>/zoznam.txt, <výstup>/stavebniny-richtarik-web.zip.
# Do balíka nepatrí: zdroj/ (pages.json, obrazky.json), build.py, obsah.py, popisy.py, __pycache__/, README.md,
# OBNOVA-*.md, img/FOTKY.md, nasadenie/ (nastavenie servera sa nahrá zvlášť, README časť Nasadenie), .gitignore
# a obrázky v img/, na ktoré nič neodkazuje.
# Skript nič nenahráva; prepíše len <výstup>/web, zoznam.txt a zip.
set -euo pipefail
SRC="$(cd "$1" && pwd)"; OUT="$2"
[ -f "$SRC/index.html" ] && [ -f "$SRC/assets/site.js" ] || { echo "CHYBA: $SRC nie je priečinok webu"; exit 1; }
mkdir -p "$OUT"; OUT="$(cd "$OUT" && pwd)"
case "$OUT" in "$SRC"|"$SRC"/*) echo "CHYBA: výstup nesmie byť v priečinku webu"; exit 1;; esac
rm -rf "$OUT/web" "$OUT/zoznam.txt" "$OUT/stavebniny-richtarik-web.zip"; mkdir -p "$OUT/web"
tar -C "$SRC" \
  --exclude=./zdroj --exclude=./__pycache__ --exclude=./build.py --exclude=./obsah.py --exclude=./popisy.py \
  --exclude=./README.md --exclude='./OBNOVA-*.md' --exclude=./img/FOTKY.md --exclude=./nasadenie --exclude=./.gitignore \
  --exclude='*.pyc' --exclude='.DS_Store' \
  -cf - . | tar -C "$OUT/web" -xf -
# obrázky v img/, na ktoré neodkazuje žiadna stránka, štýl, skript ani index.json, do balíka nejdú (staré ilustračné
# fotky a ikony ostávajú v repozitári, napr. na výmenu fotky)
python3 -I - "$OUT/web" <<'EOF2'
import os, sys
R = sys.argv[1]; text = []
for dp, dn, fn in os.walk(R):
    for f in fn:
        if f.endswith(('.html', '.css', '.js', '.json', '.webmanifest', '.xml')):
            text.append(open(os.path.join(dp, f), encoding='utf-8', errors='replace').read())
text = '\n'.join(text); n = 0; b = 0
for dp, dn, fn in os.walk(os.path.join(R, 'img')):
    for f in fn:
        p = os.path.join(dp, f); rel = os.path.relpath(p, R).replace(os.sep, '/')
        if rel not in text:
            n += 1; b += os.path.getsize(p); os.remove(p)
print('vynechané neodkazované obrázky:', n, 'súborov,', round(b / 1048576, 2), 'MB')
EOF2
(cd "$OUT/web" && find . -type f | sed 's|^\./||' | LC_ALL=C sort > "$OUT/zoznam.txt")
echo "balík: $(wc -l < "$OUT/zoznam.txt") súborov, $(du -sh "$OUT/web" | cut -f1)"

# kontrola 1: v balíku nie sú zdroje ani poznámky
nz=$(grep -cE '\.(py|md|pyc)$|^zdroj/|^nasadenie/' "$OUT/zoznam.txt" || true)
echo "súborov .py/.md, zdroj/ a nasadenie/ v balíku: $nz"
# kontrola 2: každý lokálny odkaz href/src/srcset v HTML a url() v CSS existuje (odkazy od koreňa „/…“ má len 404.html)
python3 -I - "$OUT/web" <<'EOF'
import os, re, sys, urllib.parse
R = sys.argv[1]; bad = []; n = 0
for dp, dn, fn in os.walk(R):
    for f in fn:
        if not f.endswith(('.html', '.css', '.webmanifest')): continue
        p = os.path.join(dp, f); s = open(p, encoding='utf-8').read()
        jedno = re.findall(r'(?:href|src|data-src)="([^"]+)"', s) + re.findall(r'url\(["\']?([^)"\']+)', s) + re.findall(r'"src":\s*"([^"]+)"', s)
        sady = re.findall(r'(?:imagesrcset|srcset|data-srcset)="([^"]+)"', s)   # „a.avif 480w, b.avif 720w“
        for x in jedno + [y for u in sady for y in u.split(',')]:
            if True:
                x = x.strip().split(' ')[0]
                if not x or re.match(r'(https?:|mailto:|tel:|data:|#|%23|javascript:)', x): continue   # %23 = odkaz na filter vo vnútri SVG v data:
                x = x.split('#')[0].split('?')[0]
                if not x: continue
                n += 1
                cesta = os.path.join(R, x.lstrip('/')) if x.startswith('/') else os.path.join(dp, urllib.parse.unquote(x))
                if not os.path.exists(os.path.normpath(cesta)): bad.append((os.path.relpath(p, R), x))
print('lokálnych odkazov', n, 'chýbajúcich', len(bad), bad[:10])
EOF
(cd "$OUT/web" && zip -qr -X "$OUT/stavebniny-richtarik-web.zip" .)
echo "zip: $(du -h "$OUT/stavebniny-richtarik-web.zip" | cut -f1) $OUT/stavebniny-richtarik-web.zip"
