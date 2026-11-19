#!/usr/bin/env bash
# Testy balíka pre Hosting Linux Forpsi na KÓPII v /dev/shm (nikdy na hostingu ani na živom webe):
#   bash nasadenie/test-forpsi.sh [port php -S, predvolene 9765] [port Apache, predvolene 9766] [priečinok snímok]
# 1. balík FORPSI=linux (všetky kontroly balik.sh), 2. statické testy (XML web.config, remove, simulácia presmerovaní),
# 3. časti rozbalené do jedného priečinka = SHA256SUMS, 4. samotná časť 1 v prehliadači (php -S + Playwright),
# 5. Apache s AllowOverride ako Forpsi (FileInfo AuthConfig Indexes Limit, bez Options): žiadna 500, typy, 404, 236 starých
#    adries cez http, zákazy, 6. správa na hostingu, kde PHP beží pod iným používateľom než FTP a údaje sú vo
#    www/sprava-data-<hex> (cesta, ktorú README kedysi volal „Windows“): hlásenie pri 755, prvé prihlásenie po 757.
# Kroky 5 a 6 potrebujú apache2 s mod_php a práva root (súbory patria používateľovi „FTP“ 2001, PHP beží ako www-data);
# inak sa preskočia s POZOR. Na konci servery ukončí a kópiu zmaže. Čo sa dá overiť len na účte Forpsi: README.
set -uo pipefail
R="$(cd "$(dirname "$0")/.." && pwd)"; P1="${1:-9765}"; P2="${2:-9766}"; SNIMKY="${3:-}"
T=/dev/shm/rs-forpsi-test; rm -rf "$T"; mkdir -p "$T/tmp"; chmod 755 "$T"
VYSLEDOK=0; FTP=2001
koniec() { [ -f "$T/ap/pid" ] && kill "$(cat "$T/ap/pid")" 2>/dev/null; pkill -f "php -S 127.0.0.1:$P1 " 2>/dev/null; sleep 0.5; rm -rf "$T"; }
trap koniec EXIT
export NODE_PATH="${NODE_PATH:-$(npm root -g 2>/dev/null)}"
REV=$(python3 -I -c 'import json,sys; print(json.load(open(sys.argv[1]))["revizia"])' "$R/data/verzia.json")

echo "== 1. balík FORPSI=linux"
if ! FORPSI=linux SPRAVA=1 SPRAVA_REVIZIA=$REV bash "$R/nasadenie/balik.sh" "$R" "$T/balik" > "$T/balik.log" 2>&1; then tail -5 "$T/balik.log"; echo "ZLE: balík nevznikol"; exit 1; fi
grep -E '^(názvy súborov|súbory začínajúce|direktívy|časť [0-9]|časti spolu|samotná časť|návod|lokálnych odkazov)' "$T/balik.log"
N=$(ls "$T/balik"/richtarik-forpsi-cast-*.zip | wc -l)
[ ! -e "$T/balik/ku-korenu" ] && [ ! -e "$T/balik/web/web.config" ] && [ -f "$T/balik/web/.htaccess" ] && echo "  ok   .htaccess v koreni, žiadne ku-korenu ani web.config v koreni" || { echo "  ZLE  koreň balíka"; VYSLEDOK=1; }
for z in "$T/balik"/richtarik-forpsi-cast-*.zip; do
  v=$(stat -c %s "$z"); k=$(unzip -Z1 "$z" | cut -d/ -f1 | sort -u | wc -l)
  [ "$v" -le 40000000 ] && [ "$k" -ge 2 ] && echo "  ok   $(basename "$z"): $v B ≤ 40 MB, položiek v koreni $k" || { echo "  ZLE  $(basename "$z"): $v B, v koreni $k"; VYSLEDOK=1; }
done
(cd "$T/balik" && sha256sum -c --quiet casti-sha256.txt) && echo "  ok   casti-sha256.txt sedí so ZIPmi" || VYSLEDOK=1
for f in NAVOD-FORPSI.txt NAVOD-FORPSI.html NAVOD-FORPSI.pdf; do [ -s "$T/balik/$f" ] && echo "  ok   $f" || { echo "  ZLE  chýba $f"; VYSLEDOK=1; }; done
[ "$(awk '{ if (length($0) > m) m = length($0) } END { print m }' <(iconv -f utf-8 -t utf-8 "$T/balik/NAVOD-FORPSI.txt" | tr -d '\r' | sed 's/^\xef\xbb\xbf//' | python3 -I -c 'import sys; [print("x" * len(l.rstrip("\n"))) for l in sys.stdin]'))" -le 72 ] && echo "  ok   NAVOD-FORPSI.txt: riadky do 72 znakov" || { echo "  ZLE  dlhý riadok v NAVOD-FORPSI.txt"; VYSLEDOK=1; }
if FORPSI=linux bash "$R/nasadenie/balik.sh" "$R" "$T/bez" > "$T/bez.log" 2>&1; then echo "  ZLE  balík pre Forpsi vznikol bez správy"; VYSLEDOK=1; else echo "  ok   bez SPRAVA=1 balík pre Forpsi nevznikne"; fi
if FORPSI=windows SPRAVA=1 SPRAVA_REVIZIA=$REV bash "$R/nasadenie/balik.sh" "$R" "$T/bez" > "$T/bez.log" 2>&1; then echo "  ZLE  FORPSI=windows vznikol"; VYSLEDOK=1; else echo "  ok   FORPSI=windows sa nestavia (Hosting Windows Forpsi nemá PHP)"; fi
rm -rf "$T/bez"

echo "== 2. statické testy"
python3 -I "$R/nasadenie/test_forpsi.py" staticke "$R" "$T/tmp" || VYSLEDOK=1

echo "== 3. časti rozbalené do jedného priečinka = SHA256SUMS"
mkdir -p "$T/host/www"
for i in $(seq 1 "$N"); do unzip -qo "$T/balik/richtarik-forpsi-cast-$i-z-$N.zip" -d "$T/host/www"; done
if (cd "$T/host/www" && sha256sum -c --quiet "$T/balik/SHA256SUMS.txt") && [ "$(find "$T/host/www" -type f | wc -l)" = "$(wc -l < "$T/balik/SHA256SUMS.txt")" ]; then
  echo "  ok   $(wc -l < "$T/balik/SHA256SUMS.txt") súborov, sha256 zhodné, nič navyše"; else echo "  ZLE  rozbalené časti ≠ SHA256SUMS"; VYSLEDOK=1; fi

echo "== 4. samotná časť 1 v prehliadači (php -S 127.0.0.1:$P1)"
unzip -qo "$T/balik/richtarik-forpsi-cast-1-z-$N.zip" -d "$T/jedna"
(cd "$T/jedna" && php -S 127.0.0.1:$P1 -t "$T/jedna" "$R/sprava/testy/router.php" > "$T/php.log" 2>&1 &)
sleep 1
node "$R/nasadenie/test-forpsi-cast1.mjs" "http://127.0.0.1:$P1/" "$SNIMKY" || VYSLEDOK=1
pkill -f "php -S 127.0.0.1:$P1 " 2>/dev/null; rm -rf "$T/jedna"

echo "== 5. a 6. Apache ako Forpsi (127.0.0.1:$P2)"
MOD=/usr/lib/apache2/modules
if [ "$(id -u)" != 0 ] || ! command -v apache2 > /dev/null || [ ! -f "$MOD/libphp8.3.so" ] || ! command -v setpriv > /dev/null; then
  echo "POZOR: kroky 5 a 6 preskočené (treba root, apache2 s libphp8.3.so a setpriv)"; exit $VYSLEDOK
fi
mkdir -p "$T/ap"; chmod 755 "$T/ap"
cat > "$T/ap/apache.conf" <<CONF
ServerRoot "$T/ap"
PidFile "$T/ap/pid"
Mutex file:$T/ap default
DefaultRuntimeDir "$T/ap"
Listen 127.0.0.1:$P2
ServerName 127.0.0.1
User www-data
Group www-data
ErrorLog "$T/ap/error.log"
LogLevel warn
LoadModule mpm_prefork_module $MOD/mod_mpm_prefork.so
LoadModule authz_core_module $MOD/mod_authz_core.so
LoadModule mime_module $MOD/mod_mime.so
LoadModule dir_module $MOD/mod_dir.so
LoadModule rewrite_module $MOD/mod_rewrite.so
LoadModule headers_module $MOD/mod_headers.so
LoadModule filter_module $MOD/mod_filter.so
LoadModule deflate_module $MOD/mod_deflate.so
LoadModule brotli_module $MOD/mod_brotli.so
LoadModule php_module $MOD/libphp8.3.so
TypesConfig /etc/mime.types
StartServers 6
DocumentRoot "$T/host/www"
# poradie úvodných súborov podľa Forpsi (kb/a2386)
DirectoryIndex index.php3 index.php index.html index.htm
<FilesMatch "\.php$">
  SetHandler application/x-httpd-php
</FilesMatch>
<FilesMatch "^\.ht">
  Require all denied
</FilesMatch>
<Directory "$T/host/www">
  # Forpsi (kb/a2796): mod_rewrite + skupiny Indexes, AuthConfig, FileInfo, Limit; Options povolené nie sú
  AllowOverride FileInfo AuthConfig Indexes Limit
  Options FollowSymLinks
  Require all granted
</Directory>
<IfDefine BEZ_SOND>
  php_admin_flag allow_url_fopen off
</IfDefine>
CONF
ap() { [ -f "$T/ap/pid" ] && { kill "$(cat "$T/ap/pid")" 2>/dev/null; for i in 1 2 3 4 5 6 7 8 9 10; do [ -f "$T/ap/pid" ] || break; sleep 0.3; done; }
       apache2 -f "$T/ap/apache.conf" "$@" -k start || { echo "ZLE: Apache sa nespustil"; cat "$T/ap/error.log"; exit 1; }; sleep 1; }
# web nahratý cez FTP: všetko patrí používateľovi FTP, priečinky 755, súbory 644; PHP beží ako www-data
chown -R $FTP:$FTP "$T/host"; find "$T/host" -type d -exec chmod 755 {} +; find "$T/host" -type f -exec chmod 644 {} +
ap
python3 -I "$R/nasadenie/test_forpsi.py" web "http://127.0.0.1:$P2" "$T/host/www" "$R/nasadenie/presmerovania.tsv" || VYSLEDOK=1
echo "  v denníku Apache riadkov „not allowed here“ alebo „Invalid command“ (nepovolená direktíva): $(grep -c 'not allowed here\|Invalid command' "$T/ap/error.log")"
grep -q 'not allowed here\|Invalid command' "$T/ap/error.log" && { grep 'not allowed here\|Invalid command' "$T/ap/error.log" | head -3; VYSLEDOK=1; }

echo "== 6. správa: PHP beží pod iným používateľom než FTP"
python3 -I "$R/nasadenie/test_forpsi.py" sprava755 "http://127.0.0.1:$P2" || VYSLEDOK=1
# úkon z návodu: práva 757 na www a podpriečinky (len priečinky)
find "$T/host/www" -type d -exec chmod 757 {} +
# prvé otvorenie bez sond (aby sa správa nepýtala skutočnej domény), potom adresa.txt = tento server a sondy zapnuté
ap -D BEZ_SOND
curl -s -o /dev/null -H 'X-Forwarded-Proto: https' "http://127.0.0.1:$P2/sprava/"
D=$(ls -d "$T/host/www"/sprava-data-* 2>/dev/null | head -1)
[ -n "$D" ] && printf 'http://127.0.0.1:%s\n' "$P2" > "$D/adresa.txt" && chown www-data:www-data "$D/adresa.txt"
ap
python3 -I "$R/nasadenie/test_forpsi.py" prve "http://127.0.0.1:$P2" "$T/host/www" "$FTP" || VYSLEDOK=1
echo "  súbory v priečinku údajov:"; ls -la "$D" | sed 's/^/    /' | sed "s/$(basename "$D")/sprava-data-…/"
[ "$VYSLEDOK" = 0 ] && echo "VÝSLEDOK: všetko v poriadku" || echo "VÝSLEDOK: sú chyby"
exit $VYSLEDOK
