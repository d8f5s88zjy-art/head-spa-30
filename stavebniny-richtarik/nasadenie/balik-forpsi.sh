#!/usr/bin/env bash
# Druhá polovica balik.sh pre FORPSI=linux (volá ju balik.sh, samostatne sa nespúšťa): časti pre laika, kontroly
# „čo Forpsi chce“ a návody. Vstup: <priečinok webu> <výstup s hotovým web/ vrátane .htaccess> <limit časti v MB>.
# README, časť Balík pre Forpsi.
set -euo pipefail
SRC="$1"; OUT="$2"; CASTI="$3"
case "$CASTI" in ''|*[!0-9]*) echo "CHYBA: CASTI musí byť číslo (MB)"; exit 1;; esac
case "${CASTI_SUBOROV:-0}" in *[!0-9]*) echo "CHYBA: CASTI_SUBOROV musí byť číslo"; exit 1;; esac
[ -f "$OUT/web/.htaccess" ] && [ -d "$OUT/web/sprava" ] || { echo "CHYBA: $OUT/web nie je balík pre Forpsi (chýba .htaccess alebo sprava/)"; exit 1; }
REV=$(python3 -I -c 'import json,sys; print(json.load(open(sys.argv[1]))["revizia"])' "$OUT/web/sprava/verzia.json")

# 1. Názvy súborov (Forpsi kb/a2435: bez diakritiky, medzier a zvláštnych znakov; na Linuxe záleží na veľkosti písmen)
#    a direktívy .htaccess (Forpsi kb/a2796: mod_rewrite + skupiny Indexes, AuthConfig, FileInfo, Limit; iné = chyba 500)
python3 -I - "$OUT/web" <<'EOF1'
import os, re, sys
R = sys.argv[1]; fs = []; dirs = set()
for dp, dn, fn in os.walk(R):
    for f in fn:
        r = os.path.relpath(os.path.join(dp, f), R).replace(os.sep, '/'); fs.append(r)
        for i in range(1, r.count('/') + 1): dirs.add('/'.join(r.split('/')[:i]))
zle = [r for r in fs if not re.fullmatch(r'[A-Za-z0-9._/-]+', r)]
male = {}
for r in sorted(set(fs) | dirs): male.setdefault(r.lower(), []).append(r)
kol = [v for v in male.values() if len(v) > 1]
velke = [r for r in fs if r != r.lower()]
bodka = sorted(r for r in fs if os.path.basename(r).startswith('.'))
naj = max((len(os.listdir(os.path.join(R, d))), d) for d in dirs)
print(f'názvy súborov: {len(fs)} súborov | zakázaný znak {len(zle)} {zle[:5]} | líšia sa len veľkosťou písmen {len(kol)} {kol[:3]}'
      f' | s veľkým písmenom {len(velke)} | najviac položiek v priečinku {naj[0]} ({naj[1]})')
print('súbory začínajúce bodkou:', len(bodka), ' '.join(bodka))
ocak = ['.htaccess', 'img/s/.htaccess', 'pdf/s/.htaccess', 'sprava/.htaccess', 'sprava/.user.ini']
POVOLENE = {  # direktíva → skupina AllowOverride; obaly <IfModule>, <FilesMatch>, <Files> sú povolené vždy
    'rewriteengine': 'mod_rewrite', 'rewriterule': 'mod_rewrite', 'rewritecond': 'mod_rewrite', 'rewritebase': 'mod_rewrite',
    'errordocument': 'FileInfo', 'addtype': 'FileInfo', 'removetype': 'FileInfo', 'removehandler': 'FileInfo', 'header': 'FileInfo',
    'addoutputfilterbytype': 'FileInfo', 'directoryindex': 'Indexes', 'require': 'AuthConfig', 'order': 'Limit', 'deny': 'Limit', 'allow': 'Limit'}
nepov = []; pouzite = {}
for r in bodka:
    if not r.endswith('.htaccess'): continue
    for i, l in enumerate(open(os.path.join(R, r), encoding='utf-8'), 1):
        l = l.strip()
        if not l or l.startswith('#') or l.startswith('<'): continue
        d = l.split()[0].lower()
        if d in POVOLENE: pouzite[POVOLENE[d]] = pouzite.get(POVOLENE[d], 0) + 1
        else: nepov.append(f'{r}:{i} {l.split()[0]}')
print('direktívy .htaccess podľa skupín Forpsi:', ', '.join(f'{k} {v}' for k, v in sorted(pouzite.items())), '| nepovolené', len(nepov), nepov[:5])
if zle or kol or nepov or bodka != ocak or naj[0] >= 16000:
    print('CHYBA: balík nespĺňa pravidlá Forpsi pre názvy alebo .htaccess (očakávané súbory s bodkou:', ' '.join(ocak) + ')'); sys.exit(1)
EOF1

# 2. Časti: jadro (všetko mimo img/, pdf/, subory/ + ochranné súbory img/s, pdf/s) → obrázky úvodu (index.html, site.css)
#    → ostatné img/ → pdf/ → subory/. Súčet nekomprimovaných veľkostí + 1 kB na súbor je horná hranica veľkosti ZIPu.
#    Do každej časti pribudne cast-K-z-N.txt (aj do web/, aby časti spolu = web/); potom nový zoznam a sha256.
python3 -I - "$OUT/web" "$OUT" "$CASTI" "${CASTI_SUBOROV:-0}" "$REV" <<'EOF2'
import os, re, sys, subprocess, urllib.parse, hashlib
R, OUT, MB, MAXN, REV = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), sys.argv[5]; LIM = MB * 1000 * 1000
fs = {}
for dp, dn, fn in os.walk(R):
    for f in fn:
        p = os.path.join(dp, f); fs[os.path.relpath(p, R).replace(os.sep, '/')] = os.path.getsize(p)
def odkazy(rel):
    s = open(os.path.join(R, rel), encoding='utf-8').read(); von = set()
    jedno = re.findall(r'(?:href|src|data-src|poster)="([^"]+)"', s) + re.findall(r'url\(["\']?([^)"\']+)', s) + re.findall(r'"src":\s*"([^"]+)"', s)
    sady = re.findall(r'(?:imagesrcset|srcset|data-srcset)="([^"]+)"', s)
    for x in jedno + [y for u in sady for y in u.split(',')]:
        x = x.strip().split(' ')[0].split('#')[0].split('?')[0]
        if not x or re.match(r'(https?:|mailto:|tel:|data:|%23|javascript:)', x): continue
        c = os.path.normpath(os.path.join(os.path.dirname(rel), urllib.parse.unquote(x))).replace(os.sep, '/') if not x.startswith('/') else x.lstrip('/')
        von.add(c)
    return von
uvod = (odkazy('index.html') | odkazy('assets/site.css')) & set(fs)
def skupina(r):
    k = r.split('/')[0]
    if k not in ('img', 'pdf', 'subory') or re.fullmatch(r'(img|pdf)/s/(\.htaccess|web\.config)', r): return 0
    if k == 'img': return 1 if r in uvod else 2
    return 3 if k == 'pdf' else 4
poradie = sorted(fs, key=lambda r: (skupina(r), r))
REZERVA = 4096   # značka cast-K-z-N.txt
casti = [[]]; vel = [REZERVA]
for r in poradie:
    s = fs[r]
    if s + 1024 + REZERVA > LIM: print('CHYBA: súbor', r, 'je väčší ako limit časti'); sys.exit(1)
    if vel[-1] + s + 1024 > LIM or (MAXN and len(casti[-1]) >= MAXN - 1): casti.append([]); vel.append(REZERVA)
    casti[-1].append(r); vel[-1] += s + 1024
N = len(casti)
if any(skupina(r) == 0 for c in casti[1:] for r in c): print('CHYBA: stránky, štýly a správa sa nezmestili do časti 1'); sys.exit(1)
riadky = []
for i, c in enumerate(casti, 1):
    m = f'cast-{i}-z-{N}.txt'
    open(os.path.join(R, m), 'w', encoding='utf-8', newline='\r\n').write(
        f'Stavebniny Richtárik – nový web, časť {i} z {N}.\n\n'
        f'Tento súbor patrí do priečinka www na hostingu spolu so všetkým ostatným z tejto časti.\n'
        f'Keď sa na webe otvorí adresa /{m}, časť {i} je vo www na správnom mieste.\n\n'
        f'Balík: revízia údajov {REV}, súborov v tejto časti {len(c) + 1}.\n')
    c.insert(0, m)
    z = os.path.join(OUT, f'richtarik-forpsi-cast-{i}-z-{N}.zip')
    subprocess.run(['zip', '-qX', z, '-@'], cwd=R, input=('\n'.join(c) + '\n').encode(), check=True)
    v = os.path.getsize(z)
    if v > LIM: print('CHYBA: časť', i, 'má', v, 'B'); sys.exit(1)
    koren = sorted({r.split('/')[0] for r in c})
    if len(koren) < 2: print('CHYBA: časť', i, 'má v koreni len jednu položku'); sys.exit(1)
    co = {0: 'stránky, štýly, správa', 1: 'obrázky úvodu', 2: 'obrázky', 3: 'PDF', 4: 'súbory na stiahnutie'}
    obsah = ', '.join(co[k] for k in sorted({skupina(r) for r in c[1:]}))
    sha = hashlib.sha256(open(z, 'rb').read()).hexdigest()
    riadky.append((i, len(c), v, obsah, sha, len(koren)))
    print(f'časť {i} z {N}: {len(c)} súborov, {v / 1e6:.1f} MB, položky v koreni ZIPu: {len(koren)} ({obsah})')
open(os.path.join(OUT, 'casti-sha256.txt'), 'w').write(''.join(f'{sha}  richtarik-forpsi-cast-{i}-z-{N}.zip\n' for i, n, v, o, sha, k in riadky))
open(os.path.join(OUT, '.casti.tsv'), 'w').write(''.join(f'{i}\t{n}\t{v}\t{o}\n' for i, n, v, o, sha, k in riadky))
EOF2
(cd "$OUT/web" && find . -type f | sed 's|^\./||' | LC_ALL=C sort > "$OUT/zoznam.txt")
(cd "$OUT/web" && find . -type f -print0 | LC_ALL=C sort -z | xargs -0 sha256sum | sed 's|  \./|  |' > "$OUT/SHA256SUMS.txt")
N=$(wc -l < "$OUT/.casti.tsv")

# 3. Kontrola: všetky časti rozbalené do jedného priečinka = presne web/ (zoznam a sha256)
T=$(mktemp -d)
for z in "$OUT"/richtarik-forpsi-cast-*-z-"$N".zip; do unzip -qo "$z" -d "$T/vsetko"; done
(cd "$T/vsetko" && find . -type f -print0 | LC_ALL=C sort -z | xargs -0 sha256sum | sed 's|  \./|  |') > "$T/sha"
if cmp -s "$T/sha" "$OUT/SHA256SUMS.txt"; then echo "časti spolu = web/: $(wc -l < "$T/sha") súborov, zoznam aj sha256 zhodné"
else echo "CHYBA: rozbalené časti sa líšia od web/"; diff "$T/sha" "$OUT/SHA256SUMS.txt" | head; rm -rf "$T"; exit 1; fi
rm -rf "$T/vsetko"

# 4. Kontrola: samotná časť 1 = fungujúci web. Úvod nemá žiadny chýbajúci odkaz; ostatným stránkam smú chýbať len
#    súbory z img/, pdf/ a subory/ (prídu v ďalších častiach) – žiadna stránka, štýl, skript, písmo ani súbor správy.
unzip -qo "$OUT/richtarik-forpsi-cast-1-z-$N.zip" -d "$T/jedna"
python3 -I - "$T/jedna" "${CASTI_SUBOROV:-0}" <<'EOF3'
import os, re, sys, urllib.parse
R = sys.argv[1]; MALE = int(sys.argv[2]) > 0; uvod = []; ine = []; neskor = 0; n = 0   # MALE: sada s CASTI_SUBOROV, obrázky úvodu sa do časti 1 nezmestia
for dp, dn, fn in os.walk(R):
    if os.path.relpath(dp, R).replace(os.sep, '/').split('/')[0] == 'sprava': continue
    for f in fn:
        if not f.endswith(('.html', '.css', '.webmanifest')): continue
        p = os.path.join(dp, f); rel = os.path.relpath(p, R).replace(os.sep, '/'); s = open(p, encoding='utf-8').read()
        jedno = re.findall(r'(?:href|src|data-src)="([^"]+)"', s) + re.findall(r'url\(["\']?([^)"\']+)', s) + re.findall(r'"src":\s*"([^"]+)"', s)
        sady = re.findall(r'(?:imagesrcset|srcset|data-srcset)="([^"]+)"', s)
        for x in jedno + [y for u in sady for y in u.split(',')]:
            x = x.strip().split(' ')[0]
            if not x or re.match(r'(https?:|mailto:|tel:|data:|#|%23|javascript:)', x): continue
            x = x.split('#')[0].split('?')[0]
            if not x: continue
            n += 1
            c = os.path.normpath(os.path.join(R, x.lstrip('/')) if x.startswith('/') else os.path.join(dp, urllib.parse.unquote(x)))
            if os.path.exists(c): continue
            ciel = os.path.relpath(c, R).replace(os.sep, '/')
            if rel in ('index.html', 'assets/site.css') and not (MALE and ciel.split('/')[0] == 'img'): uvod.append((rel, x))
            elif ciel.split('/')[0] in ('img', 'pdf', 'subory'): neskor += 1
            else: ine.append((rel, x))
for m in ('.htaccess', 'index.html', '404.html', 'sprava/index.php', 'sprava/.htaccess', 'img/s/.htaccess', 'pdf/s/.htaccess', 'assets/site.css', 'assets/site.js', 'assets/index.json'):
    if not os.path.exists(os.path.join(R, m)): ine.append(('časť 1', m))
print(f'samotná časť 1: odkazov {n} | úvodu a site.css chýba {len(uvod)} {uvod[:5]} | chýba stránka, štýl, skript alebo písmo {len(ine)} {ine[:5]}'
      f' | obrázky a PDF, ktoré prídu v ďalších častiach {neskor}')
if uvod or ine: print('CHYBA: časť 1 sama nedá fungujúci web'); sys.exit(1)
EOF3
rm -rf "$T"

# 5. Návody: pre laika (TXT do 72 znakov, HTML v jednom stĺpci a z neho PDF na telefón) a návod správy pre majiteľa
python3 -I "$SRC/nasadenie/navod_forpsi.py" "$SRC/nasadenie/navod-forpsi.md" "$OUT" "$OUT/.casti.tsv"
rm -f "$OUT/.casti.tsv"
if NODE_PATH="${NODE_PATH:-$(npm root -g 2>/dev/null || true)}" node "$SRC/nasadenie/navod-pdf.cjs" "$OUT/NAVOD-FORPSI.html" "$OUT/NAVOD-FORPSI.pdf" 2>/dev/null; then
  echo "návod pre laika: NAVOD-FORPSI.pdf ($(du -h "$OUT/NAVOD-FORPSI.pdf" | cut -f1)), NAVOD-FORPSI.txt, NAVOD-FORPSI.html"
else
  rm -f "$OUT/NAVOD-FORPSI.pdf"
  echo "POZOR: NAVOD-FORPSI.pdf sa nevyrobil (chýba node s Playwrightom). Vyrobte ho: node nasadenie/navod-pdf.cjs <výstup>/NAVOD-FORPSI.html <výstup>/NAVOD-FORPSI.pdf"
fi
if [ -n "${NAVOD_SPRAVA:-}" ]; then
  [ -f "$NAVOD_SPRAVA" ] || { echo "CHYBA: NAVOD_SPRAVA=$NAVOD_SPRAVA neexistuje"; exit 1; }
  cp "$NAVOD_SPRAVA" "$OUT/navod-sprava.pdf"; echo "návod správy pre majiteľa: navod-sprava.pdf ($(du -h "$OUT/navod-sprava.pdf" | cut -f1))"
else
  echo "POZOR: k balíku patrí návod správy pre majiteľa – NAVOD_SPRAVA=<cesta k navod-sprava.pdf> ho priloží"
fi
echo "pre laika: richtarik-forpsi-cast-1-z-$N.zip … -$N-z-$N.zip, NAVOD-FORPSI.pdf (aj .txt), navod-sprava.pdf"
echo "pre nás:   web/, zoznam.txt, SHA256SUMS.txt, casti-sha256.txt, NAVOD-FORPSI.html"
