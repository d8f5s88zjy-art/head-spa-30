#!/bin/sh
# Pripraví web na nahratie cez FTP do priečinka _ftp (a voliteľne ZIP).
# Adresy webu sa prepíšu na vlastnú doménu, pridá sa .htaccess pre Apache.
# Použitie: sh tools/ftp-balik.sh [domena] [cesta-k-zip]
#   sh tools/ftp-balik.sh headspa30.sk
#   sh tools/ftp-balik.sh headspa30.sk /tmp/headspa30-ftp.zip
set -e
DOMENA="${1:-headspa30.sk}"
ZIP="$2"
cd "$(dirname "$0")/.."
rm -rf _ftp && mkdir -p _ftp
cp -r index.html 404.html pravne.html robots.txt sitemap.xml assets admin _ftp/
cp tools/ftp.htaccess _ftp/.htaccess
# vernostná kartička (PHP + SQLite); testy, návod a vzor konfigurácie na hosting netreba, config.php dopíše nasadenie
mkdir -p _ftp/vernost
cp -r vernost/.htaccess vernost/index.html vernost/api vernost/lib vernost/data vernost/karta vernost/admin vernost/web vernost/pisma vernost/ochrana-udajov.html _ftp/vernost/
rm -f _ftp/vernost/data/meno.php _ftp/vernost/data/*.sqlite*
# asistent na otázky (PHP); knižnicu (vendor/) doinštaluje a config.php dopíše nasadenie (ftp.yml)
mkdir -p _ftp/asistent/data
cp -r asistent/.htaccess asistent/api.php asistent/lib asistent/znalosti asistent/composer.json asistent/ochrana-udajov.html _ftp/asistent/
cp asistent/data/.htaccess _ftp/asistent/data/
# zdrojové a nepoužívané súbory na hosting netreba
rm -f _ftp/assets/premium-v9.* _ftp/assets/i18n/README.txt
# adresy webu na vlastnú doménu (kanonická adresa, zdieľanie, údaje pre Google, mapa stránok)
for f in _ftp/index.html _ftp/pravne.html _ftp/404.html _ftp/robots.txt _ftp/sitemap.xml; do
  sed -i "s#https://d8f5s88zjy-art.github.io/head-spa-30/#https://$DOMENA/#g" "$f"
done
# stránka 404 má cesty od koreňa /head-spa-30/ (GitHub Pages); na vlastnej doméne je koreň /
sed -i 's#"/head-spa-30/#"/#g; s#(/head-spa-30/#(/#g' _ftp/404.html
# robots.txt na GitHub Pages ohlasuje aj mapu stránok barbershopu; na doméne HEAD SPA ten priečinok nie je
sed -i '/barbershop/d' _ftp/robots.txt
if [ -n "$ZIP" ]; then rm -f "$ZIP"; (cd _ftp && zip -q -r -9 "$ZIP" . ); fi
echo "Hotovo: _ftp${ZIP:+ a $ZIP}"
