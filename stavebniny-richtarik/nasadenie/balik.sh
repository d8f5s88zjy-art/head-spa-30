#!/usr/bin/env bash
# Balík na nahratie na hosting (koreň domény): len to, čo web pri behu potrebuje, zoznam súborov, zip a kontroly.
# Použitie (v priečinku webu): bash nasadenie/balik.sh . <výstupný priečinok>
# Výstup: <výstup>/web/ (obsah na nahratie), <výstup>/zoznam.txt, <výstup>/SHA256SUMS.txt, <výstup>/stavebniny-richtarik-web.zip,
# <výstup>/ku-korenu/.htaccess a web.config (nastavenie servera z nasadenie/htaccess.txt, web.config.txt – do koreňa webu)
# a <výstup>/NAVOD-NAHRATIE.txt (čo kam, čo sa nesmie prepísať, prvé prihlásenie do správy, kontrola po nahratí).
# CASTI=40: namiesto jedného ZIPu časti stavebniny-richtarik-web-1.zip … -N.zip, každá najviac 40 MB (1 MB = 10^6 B)
# a samostatne rozbaliteľná do koreňa webu; skript ich rozbalí do skúšobného priečinka a porovná zoznam a sha256
# s web/. Nepoužíva sa delený archív (zip -s), ten WebFTP nerozbalí.
# Do balíka nepatrí: zdroj/ (pages.json, obrazky.json, prechody.js), build.py, obsah.py, popisy.py, texty.py, __pycache__/, README.md,
# OBNOVA-*.md, img/FOTKY.md, nasadenie/ (nastavenie servera sa nahrá zvlášť, README časť Nasadenie), .gitignore
# a obrázky v img/, na ktoré nič neodkazuje.
# Skript nič nenahráva; prepíše len <výstup>/web, zoznam.txt a zip.
# Správa webu (sprava/, README časť Správa webu): ide do balíka len so SPRAVA=1 a SPRAVA_REVIZIA=<revízia z data/verzia.json>
# (poistka: pred novým balíkom treba z hostingu stiahnuť zmeny a importovať ich, inak by balík prepísal Máriove zmeny).
# Do balíka nikdy nejdú data/, nastroje/, data_sprava.py, sprava/testy ani priečinok údajov správy (sprava-data*).
# Ochranné súbory img/s/ a pdf/s/ (.htaccess, web.config: zákaz spúšťania) idú vždy; nahrávky v img/s sa nečistia.
# Asistent na otázky: bez premennej ASISTENT_API ide web bez neho (bez data-asistent, bez odkazu Ochrana údajov
# v päte, bez asistent/ a assets/asistent*). S ASISTENT_API=https://…/asistent/api.php dostanú všetky stránky adresu
# servera a server ide do balíka bez testov, nástrojov, README, config.php a vendor/ (README asistenta, Zapnutie).
set -euo pipefail
SRC="$(cd "$1" && pwd)"; OUT="$2"
[ -f "$SRC/index.html" ] && [ -f "$SRC/assets/site.js" ] || { echo "CHYBA: $SRC nie je priečinok webu"; exit 1; }
mkdir -p "$OUT"; OUT="$(cd "$OUT" && pwd)"
case "$OUT" in "$SRC"|"$SRC"/*) echo "CHYBA: výstup nesmie byť v priečinku webu"; exit 1;; esac
rm -rf "$OUT/web" "$OUT/zoznam.txt" "$OUT/SHA256SUMS.txt" "$OUT/ku-korenu" "$OUT/NAVOD-NAHRATIE.txt" "$OUT"/stavebniny-richtarik-web*.zip; mkdir -p "$OUT/web"
tar -C "$SRC" \
  --exclude=./zdroj --exclude=./__pycache__ --exclude=./build.py --exclude=./obsah.py --exclude=./popisy.py --exclude=./texty.py \
  --exclude=./README.md --exclude='./OBNOVA-*.md' --exclude=./img/FOTKY.md --exclude=./nasadenie --exclude=./.gitignore \
  --exclude='*.pyc' --exclude='.DS_Store' \
  --exclude=./asistent/testy --exclude=./asistent/nastroje --exclude=./asistent/README.md \
  --exclude=./asistent/config.example.php --exclude=./asistent/config.php --exclude=./asistent/vendor \
  --exclude=./asistent/composer.lock --exclude='./asistent/data/*.sqlite*' --exclude=./asistent/.gitignore \
  --exclude=./data --exclude=./nastroje --exclude=./data_sprava.py --exclude=./sprava/testy --exclude='./sprava-data*' \
  -cf - . | tar -C "$OUT/web" -xf -
# správa webu: so SPRAVA=1 ide do balíka spolu so semenom údajov (použije sa len na prázdnom hostingu) a revíziou
if [ "${SPRAVA:-}" = "1" ]; then
  REV=$(python3 -I -c 'import json,sys; print(json.load(open(sys.argv[1]))["revizia"])' "$SRC/data/verzia.json")
  if [ "${SPRAVA_REVIZIA:-}" != "$REV" ]; then
    echo "CHYBA: SPRAVA_REVIZIA musí byť $REV (revízia data/verzia.json). Najprv stiahnite zmeny zo správy na hostingu a importujte ich"
    echo "       (python3 -I nastroje/sprava_import.py <export.zip>), potom zostavte balík: SPRAVA=1 SPRAVA_REVIZIA=$REV bash nasadenie/balik.sh . <výstup>"
    exit 1
  fi
  mkdir -p "$OUT/web/sprava/semeno"
  cp "$SRC"/data/{firma,cennik,akcie,caste,novinky,galeria,texty,verzia}.json "$OUT/web/sprava/semeno/"
  printf '{"revizia": %s, "z_commitu": "%s"}\n' "$REV" "$(git -C "$SRC" rev-parse --short HEAD 2>/dev/null || echo neznamy)" > "$OUT/web/sprava/verzia.json"
  echo "správa webu: v balíku (revízia údajov $REV)"
else
  rm -rf "$OUT/web/sprava"
  echo "správa webu: bez nej (SPRAVA=1 ju pribalí)"
fi
# asistent: zapnutý len s adresou servera, inak z balíka zmizne celý (náhľad má data-asistent="ukazka")
if [ -n "${ASISTENT_API:-}" ]; then
  case "$ASISTENT_API" in https://*/api.php) ;; *) echo "CHYBA: ASISTENT_API musí byť https://…/api.php"; exit 1;; esac
  python3 -I "$SRC/nasadenie/profil.py" "$OUT/web" "$ASISTENT_API"
  echo "asistent: zapnutý, server $ASISTENT_API (vendor/ a config.php doplniť podľa asistent/README.md, Zapnutie)"
  if grep -q 'class="navrh"' "$OUT/web/asistent/ochrana-udajov.html"; then
    echo "POZOR: asistent/ochrana-udajov.html je stále návrh (pás .navrh); pred zapnutím ho musí schváliť majiteľ"
  fi
else
  python3 -I "$SRC/nasadenie/profil.py" "$OUT/web"
  rm -rf "$OUT/web/asistent" "$OUT/web/assets/"asistent*
  echo "asistent: vypnutý (bez ASISTENT_API)"
fi
# prechádzka predajňou (build.py PRECHADZKA): ide do balíka celá – komponent .pp na úvode a Kontakte, modul assets/prechadzka.js
# (v ňom sú cesty fotiek zastávok a náhľadov doslovne, preto ich kontrola neodkazovaných obrázkov nižšie nechá) a prehliadač
# panorám assets/panorama.js pre zastávky typu panoráma. Skúšobný obraz panorámy ani starý komponent p360 v balíku nesmú byť.
if grep -rqE 'data-panorama-skusobna|class="p360' "$OUT/web" --include='*.html' || [ -e "$OUT/web/img/panorama/predajna.jpg" ]; then
  echo "CHYBA: v balíku je skúšobná panoráma alebo starý komponent p360"; exit 1
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
        if rel.startswith('img/s/'): continue   # nahrávky správy webu a ich ochranné súbory sa nečistia
        if rel not in text:
            n += 1; b += os.path.getsize(p); os.remove(p)
print('vynechané neodkazované obrázky:', n, 'súborov,', round(b / 1048576, 2), 'MB')
EOF2
(cd "$OUT/web" && find . -type f | sed 's|^\./||' | LC_ALL=C sort > "$OUT/zoznam.txt")
echo "balík: $(wc -l < "$OUT/zoznam.txt") súborov, $(du -sh "$OUT/web" | cut -f1)"
# prechádzka predajňou: každý súbor, ktorý modul prechádzky menuje (fotky zastávok, náhľady, panorámy), je v balíku
python3 -I - "$OUT/web" <<'EOF4'
import os, re, sys
R = sys.argv[1]; m = os.path.join(R, 'assets', 'prechadzka.js')
if not os.path.exists(m): print('CHYBA: v balíku chýba assets/prechadzka.js'); sys.exit(1)
s = open(m, encoding='utf-8').read()
cesty = sorted(set(re.findall(r'"(img/[^"]+\.(?:avif|webp|jpg|jpeg|png))"', s)))
chyba = [c for c in cesty if not os.path.exists(os.path.join(R, c))]
stranky = [f for f in ('index.html', 'kontakt.html') if 'class="pp"' in open(os.path.join(R, f), encoding='utf-8').read()]
ulica = sum('data-ulica="https://www.google.com/maps' in open(os.path.join(R, f), encoding='utf-8').read() for f in stranky)
print('prechádzka predajňou: zastávok', s.count('"id":'), '· súborov fotiek a náhľadov', len(cesty), '· chýbajúcich', len(chyba), chyba[:5], '· komponent na stránkach', ' '.join(stranky), '· záložka pohľadu z ulice (Google) na', ulica, 'z nich')
if chyba or len(stranky) != 2: sys.exit(1)
EOF4

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
    if os.path.relpath(dp, R).replace(os.sep, '/').split('/')[0] == 'sprava': continue   # správa: šablóny a kostry nie sú stránky
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
(cd "$OUT/web" && find . -type f -print0 | LC_ALL=C sort -z | xargs -0 sha256sum | sed 's|  \./|  |' > "$OUT/SHA256SUMS.txt")
# nastavenie servera vedľa balíka (nie v ňom: pri ďalšom nahratí by prepísalo upravený .htaccess na hostingu)
mkdir -p "$OUT/ku-korenu"; cp "$SRC/nasadenie/htaccess.txt" "$OUT/ku-korenu/.htaccess"; cp "$SRC/nasadenie/web.config.txt" "$OUT/ku-korenu/web.config"
if [ -z "${CASTI:-}" ]; then
  (cd "$OUT/web" && zip -qr -X "$OUT/stavebniny-richtarik-web.zip" .)
  echo "zip: $(du -h "$OUT/stavebniny-richtarik-web.zip" | cut -f1) $OUT/stavebniny-richtarik-web.zip"
  LIMIT=40
else
  case "$CASTI" in ''|*[!0-9]*) echo "CHYBA: CASTI musí byť číslo (MB)"; exit 1;; esac
  LIMIT=$CASTI
  # časti: najprv všetko okrem img/, pdf/ a subory/ (stránky, štýly, správa), potom priečinky po abecede; súčet
  # nekomprimovaných veľkostí + 1 kB na súbor (hlavičky ZIPu) je horná hranica veľkosti ZIPu, takže limit platí vždy
  python3 -I - "$OUT/web" "$OUT" "$CASTI" <<'EOF5'
import os, sys, subprocess
R, OUT, MB = sys.argv[1], sys.argv[2], int(sys.argv[3]); LIM = MB * 1000 * 1000
fs = []
for dp, dn, fn in os.walk(R):
    for f in fn:
        p = os.path.join(dp, f); fs.append((os.path.relpath(p, R).replace(os.sep, '/'), os.path.getsize(p)))
fs.sort(key=lambda x: (x[0].split('/')[0] in ('img', 'pdf', 'subory'), x[0]))
casti = [[]]; vel = [0]
for r, s in fs:
    if s + 1024 > LIM: print('CHYBA: súbor', r, 'je väčší ako limit časti'); sys.exit(1)
    if vel[-1] + s + 1024 > LIM: casti.append([]); vel.append(0)
    casti[-1].append(r); vel[-1] += s + 1024
for i, c in enumerate(casti, 1):
    z = os.path.join(OUT, f'stavebniny-richtarik-web-{i}.zip')
    subprocess.run(['zip', '-qX', z, '-@'], cwd=R, input=('\n'.join(c) + '\n').encode(), check=True)
    v = os.path.getsize(z)
    if v > LIM: print('CHYBA: časť', i, 'má', v, 'B'); sys.exit(1)
    print(f'časť {i}: {len(c)} súborov, {v / 1e6:.1f} MB ({c[0]} … {c[-1]})')
EOF5
  # kontrola: všetky časti rozbalené do jedného priečinka = presne web/ (zoznam a sha256)
  T=$(mktemp -d); for z in "$OUT"/stavebniny-richtarik-web-*.zip; do unzip -qo "$z" -d "$T"; done
  (cd "$T" && find . -type f -print0 | LC_ALL=C sort -z | xargs -0 sha256sum | sed 's|  \./|  |') > "$T.sha"
  if cmp -s "$T.sha" "$OUT/SHA256SUMS.txt"; then echo "časti spolu = web/: $(wc -l < "$T.sha") súborov, zoznam aj sha256 zhodné"
  else echo "CHYBA: rozbalené časti sa líšia od web/"; diff "$T.sha" "$OUT/SHA256SUMS.txt" | head; rm -rf "$T" "$T.sha"; exit 1; fi
  rm -rf "$T" "$T.sha"
fi
sed "s/{LIMIT}/$LIMIT/g" "$SRC/nasadenie/navod-nahratie.txt" > "$OUT/NAVOD-NAHRATIE.txt"
echo "vedľa balíka: ku-korenu/.htaccess, ku-korenu/web.config, NAVOD-NAHRATIE.txt, SHA256SUMS.txt"
