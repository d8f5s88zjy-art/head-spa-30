#!/usr/bin/env bash
# Balík na nahratie na hosting (koreň domény): len to, čo web pri behu potrebuje, zoznam súborov, zip a kontroly.
# Použitie (v priečinku webu): bash nasadenie/balik.sh . <výstupný priečinok>
# Výstup: <výstup>/web/ (obsah na nahratie), <výstup>/zoznam.txt, <výstup>/stavebniny-richtarik-web.zip.
# Do balíka nepatrí: zdroj/ (pages.json, obrazky.json, prechody.js), build.py, obsah.py, popisy.py, texty.py, __pycache__/, README.md,
# OBNOVA-*.md, img/FOTKY.md, nasadenie/ (nastavenie servera sa nahrá zvlášť, README časť Nasadenie), .gitignore
# a obrázky v img/, na ktoré nič neodkazuje.
# Skript nič nenahráva; prepíše len <výstup>/web, zoznam.txt a zip.
# Asistent na otázky: bez premennej ASISTENT_API ide web bez neho (bez data-asistent, bez odkazu Ochrana údajov
# v päte, bez asistent/ a assets/asistent*). S ASISTENT_API=https://…/asistent/api.php dostanú všetky stránky adresu
# servera a server ide do balíka bez testov, nástrojov, README, config.php a vendor/ (README asistenta, Zapnutie).
set -euo pipefail
SRC="$(cd "$1" && pwd)"; OUT="$2"
[ -f "$SRC/index.html" ] && [ -f "$SRC/assets/site.js" ] || { echo "CHYBA: $SRC nie je priečinok webu"; exit 1; }
mkdir -p "$OUT"; OUT="$(cd "$OUT" && pwd)"
case "$OUT" in "$SRC"|"$SRC"/*) echo "CHYBA: výstup nesmie byť v priečinku webu"; exit 1;; esac
rm -rf "$OUT/web" "$OUT/zoznam.txt" "$OUT/stavebniny-richtarik-web.zip"; mkdir -p "$OUT/web"
tar -C "$SRC" \
  --exclude=./zdroj --exclude=./__pycache__ --exclude=./build.py --exclude=./obsah.py --exclude=./popisy.py --exclude=./texty.py \
  --exclude=./README.md --exclude='./OBNOVA-*.md' --exclude=./img/FOTKY.md --exclude=./nasadenie --exclude=./.gitignore \
  --exclude='*.pyc' --exclude='.DS_Store' \
  --exclude=./asistent/testy --exclude=./asistent/nastroje --exclude=./asistent/README.md \
  --exclude=./asistent/config.example.php --exclude=./asistent/config.php --exclude=./asistent/vendor \
  --exclude=./asistent/composer.lock --exclude='./asistent/data/*.sqlite*' --exclude=./asistent/.gitignore \
  -cf - . | tar -C "$OUT/web" -xf -
# asistent: zapnutý len s adresou servera, inak z balíka zmizne celý (náhľad má data-asistent="ukazka")
if [ -n "${ASISTENT_API:-}" ]; then
  case "$ASISTENT_API" in https://*/api.php) ;; *) echo "CHYBA: ASISTENT_API musí byť https://…/api.php"; exit 1;; esac
  find "$OUT/web" -name '*.html' -exec sed -i "s#data-asistent=\"ukazka\"#data-asistent=\"$ASISTENT_API\"#" {} +
  echo "asistent: zapnutý, server $ASISTENT_API (vendor/ a config.php doplniť podľa asistent/README.md, Zapnutie)"
  if grep -q 'class="navrh"' "$OUT/web/asistent/ochrana-udajov.html"; then
    echo "POZOR: asistent/ochrana-udajov.html je stále návrh (pás .navrh); pred zapnutím ho musí schváliť majiteľ"
  fi
else
  find "$OUT/web" -name '*.html' -exec sed -i -e 's# data-asistent="ukazka"##' -e 's#<a [^>]*data-asistent-odkaz[^>]*>[^<]*</a>##' {} +
  rm -rf "$OUT/web/asistent" "$OUT/web/assets/"asistent*
  echo "asistent: vypnutý (bez ASISTENT_API)"
fi
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

# kontrola 1: v balíku nie sú zdroje, poznámky ani súbory starého úvodného videa
# znalosti asistenta (asistent/znalosti/*.md) server potrebuje, zvonku sú zakázané (.htaccess, web.config)
nz=$(grep -vE '^asistent/znalosti/' "$OUT/zoznam.txt" | grep -cE '\.(py|md|pyc|mjs|sh)$|^zdroj/|^nasadenie/' || true)
echo "súborov .py/.md/.mjs/.sh, zdroj/ a nasadenie/ v balíku: $nz"
nf=$(grep -cE '^img/fi''lm/|^img/uvod/o''g\.jpg$' "$OUT/zoznam.txt" || true)
echo "súborov starého úvodného videa v balíku: $nf"
# kontrola 3: ukážka asistenta nesmie ísť na ostrý web; bez ASISTENT_API žiadne data-asistent
echo "stránok s data-asistent=\"ukazka\": $(grep -rl 'data-asistent="ukazka"' "$OUT/web" --include='*.html' | wc -l), s data-asistent: $(grep -rl 'data-asistent=' "$OUT/web" --include='*.html' | wc -l) z $(find "$OUT/web" -name '*.html' | wc -l)"
echo "asistent v balíku: testy/nástroje/README/config/vendor: $(grep -cE '^asistent/(testy|nastroje|README|config|vendor|composer\.lock)' "$OUT/zoznam.txt" || true)"
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
